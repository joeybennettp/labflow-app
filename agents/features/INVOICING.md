# Invoicing Agent

## Scope

Owns invoice management — marking cases as invoiced, generating PDF invoices per doctor, and the doctor-facing invoice history view. Invoicing operates as a layer on top of the `cases` table (no separate invoice table).

## Key Files

| File | Purpose |
|---|---|
| `src/app/invoices/page.tsx` | Lab invoice dashboard — filter, toggle invoiced status, generate PDFs (admin-only) |
| `src/app/portal/invoices/page.tsx` | Doctor invoice history — read-only view of their invoiced/pending cases |
| `src/lib/generateInvoicePDF.ts` | PDF generation with jsPDF — groups cases by doctor, one page per doctor |
| `src/components/StatsGrid.tsx` | Revenue stat card uses `invoiced` filter; pending invoices count from shipped-but-not-invoiced |
| `src/components/AnalyticsGrid.tsx` | Revenue-by-month chart only counts invoiced cases |
| `src/components/CaseDetailModal.tsx` | Displays `invoiced` field (admin-only, read-only) |
| `src/lib/types.ts` | `Case` (has `price`, `invoiced`), `PortalCase` (excludes both), `PortalInvoiceCase` (includes both) |

## Database

Invoicing uses columns on the `cases` table — there is no dedicated invoice table:

```sql
price     NUMERIC(10,2) DEFAULT 0,
invoiced  BOOLEAN DEFAULT FALSE,
```

Invoice numbers are generated in application code (`generateInvoicePDF.ts`), not stored in the database.

The `lab_settings` table provides lab identity for PDF headers (lab_name, address, phone, email).

## Type System

The three-type pattern is critical for financial data isolation:

| Type | Has `price`/`invoiced` | Used By |
|---|---|---|
| `Case` | Yes | Lab portal — full case views |
| `PortalCase` | **No** | Doctor portal — case dashboard (financial data hidden) |
| `PortalInvoiceCase` | Yes | Doctor portal — `/portal/invoices` only |

**Rule:** Never expose `price` or `invoiced` through `PortalCase`. The `PortalInvoiceCase` type is a narrow exception specifically for the invoice history page.

## PDF Generation

`generateInvoicePDF(cases, labSettings, doctors)`:

1. Groups cases by `doctor_id`
2. Sorts doctors alphabetically
3. Creates one page per doctor with auto-incrementing invoice numbers (`INV-{year}-{001}`)
4. Layout: lab header → invoice metadata → bill-to block → cases table → total → footer
5. Rush cases flagged with `(Rush)` suffix on case number
6. Saves as `invoices-{YYYY-MM-DD}.pdf`

## RLS Considerations

- No invoice-specific RLS policies — invoicing is governed by `cases` table policies
- Only lab staff can UPDATE cases (flip the `invoiced` boolean)
- Doctors can SELECT their own cases — the portal invoice page leverages this
- **Note:** `price` and `invoiced` columns have no column-level security. The `PortalCase` type omission is an application-layer convention only.

## Dependencies

- **Cases** — `price` and `invoiced` are fields on the `cases` table
- **Doctors** — PDF invoices are grouped by doctor; doctor name/practice appear on invoices
- **Lab Settings** — Lab identity (name, address, contact) appears on PDF headers
- **Analytics** — Revenue charts filter by `invoiced === true`

## Common Tasks

- **Change invoice PDF layout**: Modify `src/lib/generateInvoicePDF.ts` — uses jsPDF with autoTable plugin
- **Add a field to invoices**: Add to `cases` table → update `Case` type → update `PortalInvoiceCase` if doctor-visible → update PDF generator
- **Change invoiced toggle behavior**: Modify `toggleInvoiced` in `src/app/invoices/page.tsx`
