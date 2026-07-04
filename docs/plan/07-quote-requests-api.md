# Step 07 — Quote requests API

|                   |                  |
| ----------------- | ---------------- |
| **Phase**         | Backend APIs     |
| **Owner**         | backend-engineer |
| **Collaborators** | product-manager  |
| **Depends on**    | 03, 04           |
| **Status**        | ✅ Done          |

## Objective

Capture quote requests from the public modal, enforce the **12h response SLA**, notify sales,
and let admins manage and respond — replacing a static/inert quote form.

## API surface

- **Public:** `POST /quote-requests` — body: company, contact name, email, phone, country,
  incoterm, destination, message, `items[]` (productId? + name snapshot, quantity, unit).
  Anti-spam: honeypot field + rate limit (+ optional captcha hook).
- **Admin:** `GET /admin/quote-requests` (filter status, **overdue vs SLA**, date, search),
  `GET /admin/quote-requests/:id`, `PATCH .../status`, `POST .../respond`.

## Tasks

1. Validate with shared zod/DTO; generate human `ref` (e.g. `ALT-2026-000123`).
2. On create: set `slaDueAt = createdAt + 12h`; persist items; **enqueue a BullMQ notification
   job** dispatched through an abstract **`MailerService` port** (sales alert + buyer
   acknowledgement). Ship a dev log/no-op adapter and a clear interface — **the project owner
   implements the real email provider**; we do not pick a vendor.
3. Status machine NEW → IN_REVIEW → QUOTED → WON|LOST|CLOSED; `respond` records `respondedAt`
   and whether the **12h SLA was met**.
4. Audit all transitions; rate-limit the public endpoint.

## Acceptance criteria

- [ ] Public submit validates, persists with `ref` + `slaDueAt`, and enqueues a notification through the mailer port.
- [ ] Admin can list/filter (incl. overdue), view, change status, and respond.
- [ ] SLA met/missed is computed and visible; spam controls active.

## ALTAN-specific notes

- The "12h quote response" is a marketed promise (trust badge + stats) — SLA tracking here is what makes it real and reportable in the admin dashboard.
- Incoterm + destination are required for a meaningful quote (EXW vs CIF vs DDP changes the price basis).
