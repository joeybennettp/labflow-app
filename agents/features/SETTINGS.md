# Settings Agent

## Scope

Owns lab configuration — the settings page for lab identity/contact info and the `lab_settings` table that feeds into invoices, reports, and the doctor portal header. Available to all lab staff (admin + tech).

## Key Files

| File | Purpose |
|---|---|
| `src/app/settings/page.tsx` | Settings form — lab name, address, contact info |
| `src/lib/generateInvoicePDF.ts` | Reads `lab_settings` for PDF invoice headers |
| `src/app/invoices/page.tsx` | Fetches `lab_settings` for PDF generation |
| `src/app/portal/invoices/page.tsx` | Fetches `lab_settings` for lab name display |
| `src/components/PortalHeader.tsx` | Could display lab branding from settings |

## Database

```sql
CREATE TABLE lab_settings (
  id UUID PRIMARY KEY,
  lab_name TEXT NOT NULL DEFAULT 'My Dental Lab',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- auto-updated by trigger
);
```

Single-row table — fetched with `.limit(1).single()`.

## Local Type

Defined in `settings/page.tsx` (not exported from `types.ts`):

```ts
type LabSettings = {
  id: string;
  lab_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
};
```

The same shape is used locally in `generateInvoicePDF.ts`.

## Settings Page

### Form Fields
- **Lab Name** (required)
- **Address** (optional)
- **City / State / ZIP** (3-column grid, optional)
- **Phone / Email** (2-column grid, optional)

### Save Flow
1. `supabase.from('lab_settings').update({...}).eq('id', settings.id)`
2. On error: `alert()` with error message
3. On success: "Saved successfully" flash for 3 seconds

### Account Section
- Hardcoded "Pro Plan - Active" badge
- Admin: shows "Manage Team" link to `/team`
- Non-admin: shows "Contact admin" text

## RLS Considerations

`lab_settings` has the most permissive policies in the system:
- All 3 policies (SELECT, INSERT, UPDATE) require only `auth.role() = 'authenticated'`
- **Any authenticated user** can read and write lab settings — including doctors
- Access restriction is enforced only at the UI layer (settings page is in the lab portal sidebar)

## Dependencies

- **Invoicing** — `generateInvoicePDF` reads lab name, address, phone, email for PDF headers
- **Doctor Portal** — invoice page reads lab name for display
- **Team** — settings page links to `/team` for admins

## Common Tasks

- **Add a new setting field**: Add column to `lab_settings` in `schema.sql` → update local `LabSettings` type in `settings/page.tsx` → add form input → update any consumers (PDF generator, portal)
- **Add logo/branding**: Would need a file upload to Supabase Storage + a `logo_url` column on `lab_settings`
- **Restrict doctor write access**: Add role-based RLS policy to `lab_settings` (currently any authenticated user can write)
