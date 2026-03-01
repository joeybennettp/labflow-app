# Cases Agent

## Scope

Owns the full case lifecycle — creation, status tracking, detail views, attachments, messages, materials, and analytics. This is the core feature of LabFlow.

## Key Files

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Main dashboard — case list, stats, analytics, modals |
| `src/components/CasesTable.tsx` | Case table with search, filter, sort |
| `src/components/CaseDetailModal.tsx` | View/edit case details + status workflow |
| `src/components/CaseFormModal.tsx` | Create/edit case form |
| `src/components/CaseAttachments.tsx` | File upload/download per case |
| `src/components/CaseMessages.tsx` | Per-case messaging thread |
| `src/components/CaseMaterials.tsx` | Material usage tracking per case |
| `src/components/StatusBadge.tsx` | Visual status indicator |
| `src/components/StatsGrid.tsx` | KPI cards (active, overdue, due soon, revenue) |
| `src/components/AnalyticsGrid.tsx` | Charts (status pie, type/doctor bar) |
| `src/lib/types.ts` | `Case`, `PortalCase`, `PortalInvoiceCase`, `CaseAttachment`, `CaseMessage`, `CaseMaterial` |

## Database Tables

- **`cases`** — Core case records with status, financials, shipping
- **`case_attachments`** — File uploads linked to cases
- **`case_messages`** — Message threads per case
- **`case_materials`** — Material usage per case (junction table)

## Status Workflow

```
received → in_progress → quality_check → ready → shipped
```

- Status moves forward or backward one step via `CaseDetailModal`
- `shipped` status requires `shipping_carrier` and `tracking_number`
- Status changes are logged via `logActivity()`

## RLS Considerations

- Lab staff see all cases
- Doctors see only cases where `doctor_id` matches their linked doctor record
- Financial fields (`price`, `invoiced`) are excluded from `PortalCase` type

## Dependencies

- **Doctors** — `doctor_id` foreign key; doctor name displayed via join
- **Inventory** — `case_materials` links cases to materials
- **Invoicing** — `invoiced` and `price` fields on cases
- **Shipping** — `shipping_carrier`, `tracking_number`, `shipped_at` fields
- **Activity Log** — All case actions are logged

## Common Tasks

- **Add a field to cases**: Update `supabase/schema.sql` → `types.ts` → `CaseFormModal` → `CaseDetailModal`
- **Change status workflow**: Modify the status check constraint in `schema.sql` and the step logic in `CaseDetailModal`
- **Add a new case sub-feature**: Create component in `src/components/Case*.tsx`, add tab in `CaseDetailModal`
