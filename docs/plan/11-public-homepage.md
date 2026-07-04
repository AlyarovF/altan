# Step 11 — Homepage

|                   |                   |
| ----------------- | ----------------- |
| **Phase**         | Public panel      |
| **Owner**         | frontend-engineer |
| **Collaborators** | product-manager   |
| **Depends on**    | 10, 05, 06, 08    |
| **Status**        | ✅ Done           |

## Objective

Build the homepage with every section dynamic (from the API) and fully localized — the
faithful, now-data-driven rebuild of `index.html`.

## Sections (all dynamic + i18n + SSR/ISR)

1. **Hero** — tagline "Where Critical Materials Meet Markets.", tag line, primary CTA
   ("Request a quote" → global modal), hero stat chips (26+ product lines, 4 supply regions,
   12h quote reply, all incoterms).
2. **Trust badges** — ISO 9001:2015 · EXW/CIF/FOB/DDP · 12h quote response · Global delivery.
3. **Featured products** — grid of `featured=true` cards: name, grade, badges (🔥 Hot / ✨ NEW),
   min order, category; each card → product detail + "Request quote".
4. **How ALTAN Works** — 4 steps (Source / Qualify / Ship / Confirm) with icons, then the
   stats bar (40+ Audited Suppliers · <12h Quote · 30+ Countries · ISO 9001).
5. **Market Intelligence** — 3 news cards: commodity, price label, change (up/down/flat color),
   outlook badge (Firm/Bullish/Bearish/Mixed) → news detail.
6. **Footer** (from content API).

## Tasks

1. Compose sections from AntD components + Tailwind layout; fetch in server components with ISR.
2. Map `changeDirection` → color and `outlook` → badge variant for news cards.
3. Responsive + accessible (landmarks, heading order, alt text, focus styles).

## Acceptance criteria

- [ ] Every value renders from the API (nothing hard-coded); EN/RU/UZ all correct.
- [ ] Featured products, process steps, stats, and news all match the spec.
- [ ] CTAs open the quote modal; news/product links navigate correctly.
- [ ] Good Lighthouse SEO/perf/a11y on the homepage.

## ALTAN-specific notes

- Icons: Source=pick/mine, Qualify=flask, Ship=ship/truck, Confirm=check (use lucide-react or @ant-design/icons; pick consistent set).
