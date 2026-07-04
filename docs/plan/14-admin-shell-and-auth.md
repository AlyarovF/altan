# Step 14 — Admin shell & auth (apps/admin, Vite)

|                |                   |
| -------------- | ----------------- |
| **Phase**      | Admin             |
| **Owner**      | frontend-engineer |
| **Depends on** | 04, 10            |
| **Status**     | ✅ Done           |

## Objective

Stand up the admin dashboard SPA with login, protected routing, RBAC-aware navigation, and a
KPI landing page — the new replacement for `admin.html`.

## Scope & deliverables

- Vite + React + TypeScript + **AntD v5** + Tailwind; React Router v6.
- **Login** page → `POST /auth/login`; axios instance with token attach + **refresh** on 401;
  Zustand session store; logout.
- **Protected routes** + AntD app layout (sider nav, header with user menu, breadcrumbs).
- **RBAC**: nav items and actions gated by the user's role from `/auth/me`.
- **TanStack Query** + the generated typed client; global error/toast handling; i18next for admin UI.
- **Dashboard landing**: KPI cards + charts (AntD Charts/Statistic) — open quotes, **overdue vs
  12h SLA**, products published, latest news.

## Tasks

1. Scaffold app, theme (brand-matched), router, layout, auth flow + interceptors.
2. Build the session store and RBAC nav/action gating.
3. Build the dashboard KPIs from the quotes/products/news APIs.

## Acceptance criteria

- [ ] Login/logout work; tokens refresh transparently; unauthorized users are redirected.
- [ ] Routes/nav/actions reflect the user's role.
- [ ] Dashboard shows live KPIs including SLA-overdue quotes.

## ALTAN-specific notes

- Surfacing **SLA-overdue quotes** on the landing page operationalizes the marketed 12h promise for the sales team.
