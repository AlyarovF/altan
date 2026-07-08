# Step 08 — Remove Sourcing entirely; make `/incoterms` a real page

`/incoterms` is currently a 6-line redirect to `/sourcing`, and the footer links to it — so
the real page must land first.

## Changes (in order)

1. **Rewrite `apps/web/app/[locale]/incoterms/page.tsx`** as a real page: `PageHero` + the
   7-term card grid lifted from the sourcing page (`INCOTERMS.map` over tick cards). New
   `incoterms.*` namespace in all 3 JSONs: copy `sourcing.incoterms.title/lede` and the
   7 × `term`/`desc` pairs, plus hero eyebrow/title/lede. Add `generateMetadata`.
2. **Delete** `apps/web/app/[locale]/sourcing/page.tsx` and
   `apps/web/components/motifs/LogisticsCorridors.tsx` (dead after step 07 + this).
3. **`components/Header.tsx`**: remove `{ href: '/sourcing', key: 'sourcing' }` from the NAV
   array (covers desktop + mobile drawer).
4. **`messages/{en,ru,uz}.json`**: remove `nav.sourcing` and the entire `sourcing` namespace.
5. **`app/sitemap.ts`**: remove `/sourcing`, add `/incoterms`.
6. **`next.config.mjs`**: permanent redirect `/:locale/sourcing → /:locale/incoterms` (and
   bare `/sourcing`) for link equity.

Depends on step 07 (Coverage was the last other `sourcing.*` consumer).

## Verify

`/en/incoterms` renders 7 cards in 3 locales; `/en/sourcing` redirects;
`grep -rn "sourcing" apps/web --include='*.tsx' --include='*.ts' --include='*.json'` is
empty; footer "Incoterms" link works.
