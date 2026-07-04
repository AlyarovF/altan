#!/usr/bin/env bash
# ============================================================================
# ALTAN — production deploy script (self-managed Linux server).
#
# Idempotent & re-runnable: run it for the first deploy AND for every update.
# It builds images, applies DB migrations, (optionally) seeds, brings the stack
# up, and waits for the health check to go green.
#
#   ./deploy.sh                 first deploy / update (build + migrate + up)
#   ./deploy.sh --seed          also seed the DB (run ONCE, on first deploy)
#   ./deploy.sh --no-build      skip image build (config/env-only change)
#   ./deploy.sh --pull          pull newer base images (postgres/redis/nginx)
#   ./deploy.sh --down          stop the stack (keeps data volumes)
#   ./deploy.sh --env-file PATH use a different env file (default .env.production)
#
# Fails loudly on any error (set -euo pipefail).
# ============================================================================
set -euo pipefail

# --- Config ------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# --- Flags -------------------------------------------------------------------
DO_SEED=false
DO_BUILD=true
DO_PULL=false
DO_DOWN=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)     DO_SEED=true ;;
    --no-build) DO_BUILD=false ;;
    --pull)     DO_PULL=true ;;
    --down)     DO_DOWN=true ;;
    --env-file) ENV_FILE="${2:?--env-file needs a path}"; shift ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1 (see --help)" >&2; exit 2 ;;
  esac
  shift
done

# --- Pretty logging ----------------------------------------------------------
c_blue="\033[1;34m"; c_green="\033[1;32m"; c_red="\033[1;31m"; c_yellow="\033[1;33m"; c_off="\033[0m"
log()  { echo -e "${c_blue}==>${c_off} $*"; }
ok()   { echo -e "${c_green}✓${c_off} $*"; }
warn() { echo -e "${c_yellow}!${c_off} $*"; }
die()  { echo -e "${c_red}✗ $*${c_off}" >&2; exit 1; }

# --- Preflight: tooling ------------------------------------------------------
log "Checking Docker & Compose…"
command -v docker >/dev/null 2>&1 || die "docker is not installed or not on PATH."
docker info >/dev/null 2>&1 || die "cannot talk to the Docker daemon (is it running? are you in the docker group?)."

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  die "neither 'docker compose' (v2) nor 'docker-compose' (v1) is available."
fi
ok "Using compose: ${DC[*]}  ($("${DC[@]}" version --short 2>/dev/null || echo '?'))"

# --- Preflight: env file -----------------------------------------------------
[[ -f "$ENV_FILE" ]] || die "missing $ENV_FILE. Copy .env.production.example -> $ENV_FILE and fill in secrets."

# Load env for interpolation (build args, ports, project name).
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Refuse to deploy with example/placeholder secrets still in place.
if grep -Eq 'CHANGE_ME|generate_with_openssl' "$ENV_FILE"; then
  die "$ENV_FILE still contains CHANGE_ME / placeholder secrets. Set real values first."
fi
for v in POSTGRES_PASSWORD DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET DOMAIN; do
  [[ -n "${!v:-}" ]] || die "required env var $v is empty in $ENV_FILE."
done

PROJECT="${COMPOSE_PROJECT_NAME:-altan}"
# Base compose command (global flags must precede the subcommand).
dc() { "${DC[@]}" -p "$PROJECT" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }
ok "Env loaded from $ENV_FILE  (project: $PROJECT, domain: ${DOMAIN})"

# --- --down: stop and exit ---------------------------------------------------
if $DO_DOWN; then
  log "Stopping the ALTAN stack (data volumes are preserved)…"
  dc down
  ok "Stack stopped. Volumes kept (use 'dc down -v' manually to wipe data)."
  exit 0
fi

# --- Validate the compose file ----------------------------------------------
log "Validating compose configuration…"
dc config >/dev/null || die "docker compose config is invalid."
ok "Compose configuration is valid."

# --- Pull base images (optional) --------------------------------------------
if $DO_PULL; then
  log "Pulling base images (postgres / redis / nginx)…"
  dc pull postgres redis edge || warn "pull reported issues (continuing)."
fi

# --- Build images ------------------------------------------------------------
if $DO_BUILD; then
  log "Building application images (api / web / admin)… this can take a few minutes."
  dc build api web admin
  ok "Images built."
else
  warn "Skipping image build (--no-build)."
fi

# --- Start data services first, wait until healthy --------------------------
log "Starting data services (postgres, redis)…"
dc up -d postgres redis
log "Waiting for postgres to be healthy…"
for i in $(seq 1 30); do
  state="$(dc ps -q postgres | xargs -r docker inspect -f '{{.State.Health.Status}}' 2>/dev/null || echo starting)"
  [[ "$state" == "healthy" ]] && { ok "postgres is healthy."; break; }
  [[ $i -eq 30 ]] && die "postgres did not become healthy in time."
  sleep 2
done

# --- Apply DB migrations (one-off container; NOT baked into the image) -------
log "Applying database migrations (prisma migrate deploy)…"
dc run --rm --no-deps api sh -lc "cd apps/api && ./node_modules/.bin/prisma migrate deploy" \
  || die "prisma migrate deploy failed."
ok "Migrations applied."

# --- Seed (optional; first deploy only) -------------------------------------
if $DO_SEED; then
  warn "Seeding the database (--seed). Intended for the FIRST deploy; the seed is"
  warn "idempotent (upserts), so re-running will not duplicate rows."
  # Prisma spawns `ts-node` off PATH; pnpm keeps it in the package .bin, so add it.
  dc run --rm --no-deps api sh -lc 'cd apps/api && export PATH="$PWD/node_modules/.bin:$PATH" && prisma db seed' \
    || die "database seed failed."
  ok "Seed complete (content + bootstrap admin ${ADMIN_EMAIL:-}))."
fi

# --- Bring up the full stack -------------------------------------------------
log "Bringing up the full stack (api, web, admin, edge)…"
dc up -d
ok "Containers started."

# --- Wait for the edge health check to go green -----------------------------
EDGE_PORT="${EDGE_HTTP_PORT:-80}"
HEALTH_URL="http://localhost:${EDGE_PORT}/api/v1/health"
log "Waiting for API health at ${HEALTH_URL} …"
http_status() {
  if command -v curl >/dev/null 2>&1; then
    curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$1" 2>/dev/null || echo 000
  elif command -v wget >/dev/null 2>&1; then
    wget -q -T 5 -O /dev/null "$1" && echo 200 || echo 000
  else
    dc exec -T edge wget -q -T 5 -O /dev/null "http://127.0.0.1/api/v1/health" && echo 200 || echo 000
  fi
}
healthy=false
for i in $(seq 1 40); do
  code="$(http_status "$HEALTH_URL")"
  if [[ "$code" == "200" ]]; then healthy=true; ok "API health is green (200)."; break; fi
  sleep 3
done
$healthy || { echo; dc ps; die "API did not become healthy. Check logs: '${DC[*]} -p $PROJECT -f $COMPOSE_FILE logs api'"; }

# --- Status + URLs -----------------------------------------------------------
echo
log "Deployment status:"
dc ps
echo
ok "ALTAN is up."
echo -e "   Public site : ${PUBLIC_SITE_URL:-http://${DOMAIN}}"
echo -e "   Admin panel : https://${ADMIN_HOST:-admin.${DOMAIN}}"
echo -e "   API health  : ${HEALTH_URL}"
echo -e "   API docs    : http://localhost:${EDGE_PORT}/api/v1/docs (behind the edge)"
echo
warn "If this was the first deploy, change the bootstrap admin password after logging in."
