# Step 08 — Content & i18n API

|                   |                  |
| ----------------- | ---------------- |
| **Phase**         | Backend APIs     |
| **Owner**         | backend-engineer |
| **Collaborators** | product-manager  |
| **Depends on**    | 03, 04           |
| **Status**        | ✅ Done          |

## Objective

Make **all site copy, stats, process steps, and translations** dynamic and admin-editable —
this is the core of "make everything dynamic". Replaces hard-coded HTML + the `app.js` i18n object.

## API surface

- **Public:**
  - `GET /content` — company name ("ALTAN Trading House"), tagline ("Where Critical Materials
    Meet Markets."), tag ("Global Trading House for Critical Raw Materials"), trust badges
    (ISO 9001:2015 · EXW/CIF/FOB/DDP · 12h quote response · Global delivery), footer.
  - `GET /process-steps` — the 4 steps (Source / Qualify / Ship / Confirm) + icons.
  - `GET /stats` — hero (26+ product lines, 4 supply regions, 12h quote reply, all incoterms)
    and process bar (40+ Audited Suppliers, <12h, 30+ Countries, ISO 9001).
  - `GET /i18n/:locale` — flattened key→value catalog for **next-intl / i18next** (EN/RU/UZ).
- **Admin (guarded):** CRUD for `SiteContent`, `ProcessStep`, `SiteStat`, and `Translation`
  (by namespace/key/locale); bulk **import/export** translations as JSON; missing-key report.

## Tasks

1. DTOs + Swagger; localized responses; aggressive caching + a revalidation hook for the public site.
2. Translation import endpoint that ingests the prototype's `app.js` i18n object shape.
3. Missing-translation report (keys lacking RU or UZ).

## Acceptance criteria

- [ ] Public endpoints return all site content/stats/steps and a full i18n catalog per locale.
- [ ] Admin edits persist and can trigger public revalidation.
- [ ] `app.js` i18n keys import cleanly; missing-key report works for EN/RU/UZ.

## ALTAN-specific notes

- Keep a static fallback catalog bundled in the frontends so the site still renders if the API/cache is briefly unavailable.
