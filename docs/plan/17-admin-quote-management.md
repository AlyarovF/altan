# Step 17 — Admin: quote management

|                   |                   |
| ----------------- | ----------------- |
| **Phase**         | Admin             |
| **Owner**         | frontend-engineer |
| **Collaborators** | product-manager   |
| **Depends on**    | 14, 07            |
| **Status**        | ✅ Done           |

## Objective

Give sales a workspace to triage, respond to, and report on incoming quote requests against
the 12h SLA.

## Scope & deliverables

- **Quotes table** (AntD): columns — ref, company, contact, products, country, incoterm,
  status, created, and **SLA** (time-to-due / **overdue** highlighted in red). Filters: status,
  overdue, date range, search.
- **Detail drawer**: full request + line items; **status workflow** (NEW → IN_REVIEW → QUOTED →
  WON | LOST | CLOSED); **Respond** action (records `respondedAt`, marks SLA met/missed);
  internal notes; audit trail.
- **Export CSV** of filtered results.

## Tasks

1. Build the table with SLA computation/highlight and server-driven filters.
2. Build the detail drawer with status transitions, respond, and notes.
3. Add CSV export and show the audit history.

## Acceptance criteria

- [ ] List shows quotes with correct SLA status; filters (incl. overdue) work.
- [ ] Status transitions and respond persist; SLA met/missed is recorded and visible.
- [ ] CSV export works; audit trail is shown per quote.

## ALTAN-specific notes

- Overdue (>12h unanswered) quotes must be visually unmissable — they represent a broken brand promise.
