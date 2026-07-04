# Step 18 — Admin: content & translations management

|                   |                   |
| ----------------- | ----------------- |
| **Phase**         | Admin             |
| **Owner**         | frontend-engineer |
| **Collaborators** | product-manager   |
| **Depends on**    | 14, 08            |
| **Status**        | ✅ Done           |

## Objective

Let admins edit every piece of site copy, the process steps, the stats, and all EN/RU/UZ
translations — completing "make everything dynamic" with no deploy required.

## Scope & deliverables

- **Site content editor**: company name, tagline, tag, trust badges, hero stats, footer.
- **Process steps editor**: the 4 steps (title / subtitle / icon / order), reorderable.
- **Site stats editor**: label / value / group (hero vs process bar), reorderable.
- **Translations manager**: grid of `key × locale (EN/RU/UZ)` with inline edit, namespace filter,
  search, a **missing-translation report**, and **JSON import/export** (to ingest the legacy
  `app.js` i18n object). Saving triggers **public-site revalidation**.

## Tasks

1. Build content/steps/stats forms bound to the content API.
2. Build the translations grid + missing-key report + import/export.
3. Wire a "publish/revalidate" action that refreshes the public ISR cache.

## Acceptance criteria

- [ ] Editing content/steps/stats updates the public site after revalidation.
- [ ] Translations editable per locale; missing-key report flags gaps; import/export works.
- [ ] No user-facing string on the public site remains hard-coded.

## ALTAN-specific notes

- This screen is what fulfills the brief literally: an admin can change the tagline, a stat, or a translation and the public site reflects it.
