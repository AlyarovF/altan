# Step 13 — Quote modal & request flow

|                   |                   |
| ----------------- | ----------------- |
| **Phase**         | Public panel      |
| **Owner**         | frontend-engineer |
| **Collaborators** | product-manager   |
| **Depends on**    | 10, 07            |
| **Status**        | ✅ Done           |

## Objective

Build the global quote modal that turns interest into a tracked `QuoteRequest` — the inline
quote modal, now wired to the backend with the 12h SLA promise.

## Scope & deliverables

- Global modal (AntD `Modal`) openable from any CTA (hero, header, product cards, product detail).
- Form (React Hook Form + **zod schema from `packages/shared`**): company, contact name, email,
  phone, country, **incoterm** (EXW/FCA/FOB/CIF/DDP…), destination, product(s) of interest
  (prefilled when opened from a product), quantity + unit, message.
- Anti-spam honeypot; inline validation; disabled/loading submit.
- Submit → `POST /quote-requests`; **success state** shows the `ref` and "we reply within 12h";
  robust error handling; full i18n; accessible (focus trap, labelled fields, ESC/restore focus).

## Tasks

1. Build the modal + provider so any component can trigger it (optionally with a prefilled product).
2. Implement the form with shared zod validation and localized labels/errors.
3. Handle submit, success (ref + SLA message), and failure states.

## Acceptance criteria

- [ ] Modal opens globally and prefilled from a product; validation matches the backend.
- [ ] Successful submit shows the quote `ref` and the 12h promise; errors are handled gracefully.
- [ ] Localized in EN/RU/UZ; accessible; honeypot/rate-limit respected.

## ALTAN-specific notes

- The confirmation must reinforce the "12h quote response" promise — it's a core trust signal.
