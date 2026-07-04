# Step 16 — Admin: news management

|                |                   |
| -------------- | ----------------- |
| **Phase**      | Admin             |
| **Owner**      | frontend-engineer |
| **Depends on** | 14, 06            |
| **Status**     | ✅ Done           |

## Objective

Let editors manage the Market Intelligence articles shown on the homepage and news pages.

## Scope & deliverables

- **News table** (AntD): paginate/sort/filter by commodity + status; row actions.
- **Create/Edit form** (RHF + zod): title, commodity, publishedAt, priceLabel, changeLabel,
  **changeDirection** (up/down/flat), **outlook** (Firm/Bullish/Bearish/Mixed), summary,
  body (rich-text/markdown editor), status; **localized** EN/RU/UZ tabs.
- Live **preview** of the news card as it will appear publicly.

## Tasks

1. Build the table and CRUD form with the outlook/direction selectors.
2. Add a rich-text/markdown editor for `body`; preview the public card.
3. Validate and localize.

## Acceptance criteria

- [ ] Create/edit/delete an article and see it on the homepage + detail page.
- [ ] Outlook badge and change direction/color render as configured.
- [ ] Localized EN/RU/UZ; preview matches the public card.

## ALTAN-specific notes

- Seeded examples to support: APT $292/MTU +8.4% YTD (Firm), Rhenium $1,340/kg +12.1% YTD (Bullish), FeMo $34.80/kg Mo −3.2% QoQ (Mixed).
