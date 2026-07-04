# Step 10 — Public site shell (apps/web, Next.js)

|                |                            |
| -------------- | -------------------------- |
| **Phase**      | Public panel               |
| **Owner**      | frontend-engineer          |
| **Depends on** | 02, 05, 06, 08 (contracts) |
| **Status**     | ✅ Done                    |

## Objective

Scaffold the public user panel as a Next.js App Router app with AntD + Tailwind, EN/RU/UZ
locale routing, SEO, and a typed API client — the shell every public page renders inside.

## Scope & deliverables

- Next.js 14 App Router + TypeScript; **AntD v5 + @ant-design/nextjs-registry** (SSR styles)
  - `ConfigProvider` brand theme tokens; **Tailwind** with preflight reconciled with AntD.
- **next-intl** locale routing (`/en` `/ru` `/uz`) + middleware + `hreflang` + localized
  `<metadata>`; i18n catalog loaded from the content API (`GET /i18n/:locale`) with static fallback.
- **Typed API client** generated from the OpenAPI spec into `packages/shared`.
- **TanStack Query** provider with SSR hydration; axios instance.
- Server-component data helpers fetching content/products with **ISR `revalidate`**.
- Layout: header (logo "ALTAN Trading House", nav, **language switcher**, "Request a quote" CTA),
  footer (from content API). Global **quote modal** mount point (built in step 13).
- SEO baseline: `sitemap.ts`, `robots.ts`, OpenGraph/Twitter, canonical + hreflang.
- `loading` / `error` / `not-found` routes; fonts; favicon/brand assets.

## Tasks

1. Scaffold app, registry, theme, Tailwind/AntD reconciliation, fonts.
2. Wire next-intl + middleware + locale-aware links and metadata.
3. Generate + wire the typed client and Query provider (SSR-safe).
4. Build header/footer from the content API; add the quote-modal provider slot.

## Acceptance criteria

- [ ] Site boots at `/en`, `/ru`, `/uz`; language switcher works and persists.
- [ ] Header/footer/nav content comes from the API; AntD + Tailwind render cleanly under SSR.
- [ ] SEO tags (title/description/OG/hreflang/canonical), sitemap, and robots are present.
- [ ] Typed client + Query hydration work; no client-only data waterfalls on first paint.

## ALTAN-specific notes

- This is the company's primary public site — Core Web Vitals and indexability are acceptance concerns, not nice-to-haves.
