# Database Agent

## Scope

Owns the Supabase database layer — all tables, functions, triggers, indexes, RLS policies, and storage configuration. This is the reference guide for any change that touches the data model.

## Key Files

| File | Purpose |
|---|---|
| `supabase/schema.sql` | All table definitions, functions, triggers, and indexes |
| `supabase/policies.sql` | All RLS policies (run after schema.sql) |
| `supabase/storage.sql` | Storage bucket and access policies |
| `supabase/seed.sql` | Sample data for development |
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/lib/types.ts` | TypeScript types mirroring database tables |

## Tables (10)

| Table | Purpose | Row Count (seed) |
|---|---|---|
| `doctors` | Dentist client directory | 4 |
| `cases` | Core case records — the central table | 12 |
| `user_profiles` | Auth user roles (admin/tech/doctor) | 0 (created at signup) |
| `lab_settings` | Single-row lab identity/branding | 1 |
| `case_attachments` | File uploads linked to cases | 0 |
| `case_messages` | Per-case messaging threads | 0 |
| `materials` | Inventory catalog | 0 |
| `case_materials` | Junction: material usage per case | 0 |
| `activity_log` | Audit trail for all actions | 0 |
| `team_invites` | Staff invitation tracking | 0 |

## Functions (10)

### Utility / Trigger Functions
| Function | Type | Purpose |
|---|---|---|
| `update_updated_at()` | TRIGGER | Sets `updated_at = NOW()` for `cases` |
| `update_updated_at_column()` | TRIGGER | Sets `updated_at = NOW()` for `lab_settings`, `materials` |
| `generate_case_number()` | TRIGGER | Auto-generates sequential `C-XXXX` case numbers (seeds from C-4570) |

### Auth / RLS Helper Functions (all SECURITY DEFINER)
| Function | Returns | Purpose |
|---|---|---|
| `is_lab_staff(user_id)` | BOOLEAN | Checks role IN ('admin', 'tech') — used in most RLS policies |
| `is_admin(user_id)` | BOOLEAN | Checks role = 'admin' — used in admin-gated policies |
| `get_doctor_id_for_user()` | UUID | Returns `doctors.id` for current auth user — used in doctor RLS policies |

### RPC Functions (all SECURITY DEFINER)
| Function | Called By | Purpose |
|---|---|---|
| `check_doctor_email(email)` | Doctor register page | Pre-signup: is this email an unlinked doctor? |
| `link_doctor_account(user_id, email)` | Doctor register page | Post-signup: link auth user to doctor, create profile |
| `create_team_invite(email, role)` | Team page | Admin-only: create pending invite |
| `check_team_invite(email)` | Signup page | Public: is there a pending invite? |
| `claim_team_invite(user_id, email)` | Signup page | Post-signup: create profile with invited role |

## Triggers (4)

| Trigger | Table | Event | Function |
|---|---|---|---|
| `set_case_number` | `cases` | BEFORE INSERT | `generate_case_number()` |
| `cases_updated_at` | `cases` | BEFORE UPDATE | `update_updated_at()` |
| `update_lab_settings_updated_at` | `lab_settings` | BEFORE UPDATE | `update_updated_at_column()` |
| `update_materials_updated_at` | `materials` | BEFORE UPDATE | `update_updated_at_column()` |

## Indexes (6)

| Index | Table | Column(s) | Notes |
|---|---|---|---|
| `idx_user_profiles_email` | `user_profiles` | `email` | B-tree |
| `idx_case_attachments_case_id` | `case_attachments` | `case_id` | B-tree |
| `idx_case_messages_case_id` | `case_messages` | `case_id` | B-tree |
| `idx_activity_log_created_at` | `activity_log` | `created_at DESC` | Descending for feed queries |
| `idx_activity_log_case_id` | `activity_log` | `case_id` | B-tree |
| `idx_team_invites_pending_email` | `team_invites` | `LOWER(email)` WHERE `status = 'pending'` | Partial unique — prevents duplicate pending invites |

## RLS Policy Summary (34 policies)

### Access Patterns
| Pattern | Function | Tables |
|---|---|---|
| Lab staff full access | `is_lab_staff()` | cases, doctors, materials, case_materials, case_attachments, case_messages, activity_log |
| Admin-only access | `is_admin()` | user_profiles (write), team_invites |
| Doctor scoped read | `get_doctor_id_for_user()` | cases, case_attachments, case_messages, activity_log |
| All authenticated | — | lab_settings |
| Self-only read | `auth.uid() = id` | user_profiles (own row) |

### Policy Counts by Table
| Table | SELECT | INSERT | UPDATE | DELETE | Total |
|---|---|---|---|---|---|
| `doctors` | 2 | 1 | 1 | 1 | 5 |
| `cases` | 2 | 1 | 1 | 1 | 5 |
| `user_profiles` | 2 | 1 | 1 | 1 | 5 |
| `lab_settings` | 1 | 1 | 1 | 0 | 3 |
| `case_attachments` | 2 | 2 | 0 | 2 | 6 |
| `case_messages` | 2 | 2 | 0 | 0 | 4 |
| `materials` | 1 | 1 | 1 | 1 | 4 |
| `case_materials` | 1 | 1 | 0 | 1 | 3 |
| `activity_log` | 2 | 1 | 0 | 0 | 3 |
| `team_invites` | 1 | 1 | 1 | 0 | 3 |

**Note:** `case_materials` has no UPDATE policy (entries are deleted and re-inserted). `case_messages` has no UPDATE or DELETE (messages are permanent).

## Storage

### Bucket: `case-attachments` (private)
- 6 storage policies on `storage.objects`
- Lab staff: full INSERT/SELECT/DELETE
- Doctors: INSERT/SELECT/DELETE with looser check (any linked doctor, not case-specific)

## Rules for Database Changes

1. **New table** → Add to `schema.sql` + enable RLS + add policies in `policies.sql` + add TypeScript type in `types.ts`
2. **New column** → Add to `schema.sql` + update TypeScript type + update relevant components
3. **New function** → Add to `schema.sql` with `SECURITY DEFINER` if it reads `user_profiles`
4. **New index** → Add to `schema.sql` only if query patterns justify it
5. **All RLS policies** go in `policies.sql`, never in `schema.sql`
6. **All SECURITY DEFINER functions** must be used carefully — they bypass RLS

## Common Tasks

- **Add a table**: CREATE TABLE in `schema.sql` → ALTER TABLE ENABLE RLS → policies in `policies.sql` → type in `types.ts`
- **Add a column to cases**: ALTER TABLE in `schema.sql` → update `Case` type → update `PortalCase` only if doctor-visible → never add `price`/`invoiced` to `PortalCase`
- **Debug RLS issues**: Check which `is_lab_staff` / `is_admin` / `get_doctor_id_for_user` function applies; verify the user's `user_profiles.role`
