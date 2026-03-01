# Doctor Portal Agent

## Scope

Owns the doctor-facing portal — a read-only view for dentist clients to track their cases, communicate with the lab, view attachments, and review invoices. Completely separate UI from the lab portal.

## Key Files

| File | Purpose |
|---|---|
| `src/app/portal/page.tsx` | Doctor case dashboard with stats, search, sort |
| `src/app/portal/invoices/page.tsx` | Doctor invoice history |
| `src/app/portal/register/page.tsx` | Doctor self-registration |
| `src/components/PortalHeader.tsx` | Portal header with lab branding |
| `src/components/PortalCaseDetail.tsx` | Read-only case detail with messages + attachments |
| `src/lib/types.ts` | `PortalCase` (no financials), `PortalInvoiceCase` (with price) |

## Database Tables

- **`doctors`** — `auth_user_id` links a Supabase auth user to a doctor record
- **`cases`** — Filtered by RLS to show only the doctor's own cases
- **`case_messages`** — Doctors can view and send messages on their own cases
- **`case_attachments`** — Doctors can view and upload attachments on their own cases

## Key Functions (in `supabase/schema.sql`)

- `check_doctor_email(email)` — Pre-registration check: is this email an unlinked doctor?
- `link_doctor_account(user_id, email)` — Post-signup: link auth user to doctor record, create profile with `doctor` role
- `get_doctor_id_for_user()` — Used in RLS policies to filter cases by doctor
- `is_lab_staff(user_id)` — Used in RLS to distinguish staff from doctors

## RLS Considerations

- Doctors can only SELECT cases where `doctor_id = get_doctor_id_for_user()`
- Doctors can only view/send messages and attachments on their own cases
- Doctors can only see their own doctor record
- Financial data (`price`, `invoiced`) is excluded from the default portal query — only shown on `/portal/invoices` using `PortalInvoiceCase`

## Dependencies

- **Auth** — Doctor role detection in `auth-context.tsx`, redirect to `/portal`
- **Cases** — Shares the `cases` table but with restricted view
- **Messages** — Shares `CaseMessages` component with role='doctor'
- **Attachments** — Shares `CaseAttachments` component with role='doctor'

## Common Tasks

- **Add a portal feature**: Create `src/app/portal/{feature}/page.tsx`, use `PortalCase` type, check `authLoading` + `doctorId` before fetching
- **Expose new case data to doctors**: Add field to `PortalCase` type in `types.ts`, update the select query in `portal/page.tsx`
- **Never expose to doctors**: `price`, `invoiced` (except on invoice page), internal notes meant for lab staff only
