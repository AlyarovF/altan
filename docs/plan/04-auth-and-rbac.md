# Step 04 — Auth & RBAC (admin/staff)

|                |                  |
| -------------- | ---------------- |
| **Phase**      | Backend APIs     |
| **Owner**      | backend-engineer |
| **Depends on** | 03               |
| **Status**     | ✅ Done          |

## Objective

Authenticate staff and enforce role-based access so the admin dashboard is protected while
the public site stays open and read-only.

## Scope & deliverables

- **Passport** strategies (local + JWT). **argon2** password hashing.
- JWT **access + refresh** tokens; refresh rotation; logout/invalidate.
- Endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- `Role` enum (ADMIN, SALES, EDITOR, VIEWER) + `RolesGuard` + `@Roles()` decorator.
- Throttle/lock login attempts; audit login success/failure.
- Seed an initial **ADMIN** user (env-driven credentials, forced first-login change later).
- Password reset flow — phase 2 (note only).

## Tasks

1. Implement auth module, strategies, guards, decorators, token service.
2. Hash with argon2; store refresh securely (httpOnly cookie or hashed token row).
3. Apply `RolesGuard` globally with public-route opt-out (`@Public()`).
4. Write the admin seeder (used by step 09).

## Acceptance criteria

- [ ] Login returns tokens; `/auth/me` returns the user + role.
- [ ] Protected routes 401 without a token, 403 with an insufficient role.
- [ ] Public catalog/news/content endpoints remain reachable unauthenticated.
- [ ] Login attempts are throttled and audited.

## ALTAN-specific notes

- Map roles to duties: SALES → quotes; EDITOR → products/news/content; ADMIN → all incl. users.
