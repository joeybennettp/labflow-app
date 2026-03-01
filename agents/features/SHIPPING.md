# Shipping Agent

## Scope

Owns shipping tracking — the carrier/tracking data collection when marking a case as shipped, the dedicated shipping tracker page, and shipping info display in both lab and doctor portals.

## Key Files

| File | Purpose |
|---|---|
| `src/app/shipping/page.tsx` | Shipping tracker dashboard — lists all shipped cases with carrier, tracking, and date |
| `src/components/CaseDetailModal.tsx` | Shipping form (inline) — collects carrier + tracking when advancing to `shipped` status |
| `src/components/PortalCaseDetail.tsx` | Read-only shipping info display for doctors |
| `src/lib/types.ts` | Shipping fields on `Case` and `PortalCase` types |

## Shipping Fields

Three columns on the `cases` table:

```sql
shipping_carrier TEXT DEFAULT '',      -- e.g. 'FedEx', 'UPS', 'USPS', 'Hand Delivery', 'Other'
tracking_number  TEXT DEFAULT '',      -- free-text, optional
shipped_at       TIMESTAMPTZ,          -- NULL until case is marked shipped
```

These fields appear on both `Case` (lab staff) and `PortalCase` (doctors). They are **not** on `PortalInvoiceCase`.

## Carrier List

Hardcoded in `CaseDetailModal.tsx`:

```ts
const CARRIERS = ['FedEx', 'UPS', 'USPS', 'Hand Delivery', 'Other'] as const;
```

## Status Transition Flow

When a case is advanced from `ready` to `shipped`:

1. `CaseDetailModal.handleForwardStatus()` detects `nextStatus === 'shipped'` and shows the inline shipping form instead of immediately advancing
2. User selects carrier from dropdown (defaults to `'FedEx'`) and optionally enters tracking number
3. On confirm, `handleShipConfirm()` calls `onStatusChange(id, 'shipped', { shipping_carrier, tracking_number })`
4. In the parent page (`page.tsx`), the handler builds the update payload:
   ```ts
   updatePayload.shipping_carrier = shippingData.shipping_carrier;
   updatePayload.tracking_number = shippingData.tracking_number;
   updatePayload.shipped_at = new Date().toISOString();
   ```
5. Single `supabase.from('cases').update(updatePayload)` writes all fields atomically
6. `logActivity()` fires for audit trail

**Note:** `shipped_at` is set client-side, not by a database trigger.

## Shipping Tracker Page

`/shipping` displays all cases with `status = 'shipped'`, ordered by `shipped_at DESC`.

- Query: `supabase.from('cases').select('*, doctors(name)').eq('status', 'shipped')`
- Client-side time filter: All / Last 7 Days / Last 30 Days
- Stats: Total Shipped, With Tracking, Hand Delivered
- Falls back to `due` date when `shipped_at` is null

## RLS Considerations

- No shipping-specific RLS policies — governed by `cases` table policies
- Only lab staff can UPDATE cases (set shipping fields)
- Doctors can READ shipping fields on their own cases — `PortalCase` includes `shipping_carrier`, `tracking_number`, `shipped_at`
- The shipping tracker page (`/shipping`) is lab-staff-only (not gated by `isAdmin`, accessible to all staff)

## Dependencies

- **Cases** — Shipping is the terminal status in the case workflow
- **Doctor Portal** — `PortalCaseDetail` displays shipping info to doctors
- **Activity Log** — Status change to `shipped` is logged

## Common Tasks

- **Add a new carrier option**: Update the `CARRIERS` array in `CaseDetailModal.tsx`
- **Make tracking number required**: Add validation in `handleShipConfirm` before calling `onStatusChange`
- **Add shipping notifications**: Hook into the status change handler in `page.tsx` after the Supabase update succeeds
