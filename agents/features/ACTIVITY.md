# Activity Agent

## Scope

Owns the audit trail system — the `logActivity()` utility for recording actions and the admin-only activity log page for viewing the feed. Activity logging is fire-and-forget and must never block user actions.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/activity.ts` | `logActivity()` function — the single logging utility |
| `src/app/activity/page.tsx` | Activity feed page — filterable, paginated log view (admin-only) |
| `src/lib/types.ts` | `ActivityLogEntry` type |

## Logging Utility

```ts
export async function logActivity(
  supabase: SupabaseClient,
  { caseId, action, details = {} }: LogParams
): Promise<void>
```

### Behavior
1. Gets current user via `supabase.auth.getUser()`
2. Resolves display name: email prefix → `user_profiles.display_name` → `doctors.name`
3. Inserts into `activity_log` table
4. Fully wrapped in try/catch — errors go to `console.error` only, never thrown

### Critical Pattern
**Fire-and-forget** — `logActivity()` is never `await`ed. It runs in the background so user actions are never delayed by logging.

### Where It's Called

| File | Actions Logged |
|---|---|
| `src/app/page.tsx` | `created case`, `edited case`, `deleted case`, status changes |
| `src/app/invoices/page.tsx` | `marked as invoiced`, `unmarked as invoiced` |
| `src/components/CaseAttachments.tsx` | `uploaded file "..."`, `removed file "..."` |
| `src/components/CaseMessages.tsx` | `sent a message` |

**Not logged:** Calendar page operations (status changes, edits, deletes from `/calendar`).

## Activity Log Page

### Access
Admin-only — redirects non-admins to `/`.

### Data Fetching
```ts
supabase
  .from('activity_log')
  .select('*, cases(case_number)')
  .order('created_at', { ascending: false })
  .limit(limit)  // starts at 50, increments by 50
```

### Filters
5 tabs, matched by substring in `action`:

| Filter | Matches |
|---|---|
| All | Everything |
| Status Changes | `status`, `moved`, `changed`, `shipped` |
| Files | `upload`, `file`, `removed file` |
| Messages | `message`, `sent` |
| Other | Everything not matching above |

### Action Icons

| Action Substring | Icon |
|---|---|
| `created` | PlusCircle |
| `status` | ArrowRightLeft |
| `edited` | Pencil |
| `deleted` | Trash2 |
| `uploaded` | Upload |
| `removed` | Trash2 |
| `message` | MessageSquare |
| `invoiced` | Receipt |
| default | History |

### Action Colors

| Action Substring | Color |
|---|---|
| `created`, `invoiced` | green |
| `status`, `moved`, `changed` | blue |
| `deleted`, `removed` | red |
| `uploaded`, `file` | purple |
| `message`, `sent` | amber |
| `edited` | slate |

### Timestamp Display
- < 1 min: "Just now"
- < 60 min: "Xm ago"
- < 24 hrs: "Xh ago"
- Otherwise: locale date/time string

### Pagination
"Load more activity" button when `entries.length >= limit`. Increments limit by 50 per click.

## Database

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL DEFAULT 'Unknown',
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_case_id ON activity_log(case_id);
```

`ON DELETE SET NULL` on `case_id` means entries survive case deletion (case number becomes null in the feed).

## Type

```ts
export type ActivityLogEntry = {
  id: string;
  case_id: string | null;
  user_id: string;
  user_name: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  cases?: { case_number: string } | null;
};
```

## RLS Considerations

- Lab staff: SELECT and INSERT on `activity_log` via `is_lab_staff()`
- Doctors: SELECT only, scoped to their own cases via subquery
- No UPDATE or DELETE policies — log is append-only and permanent

## Dependencies

- **Cases** — `case_id` links entries to cases; `case_number` joined for display
- **Auth** — `user_id` and display name resolution in `logActivity()`
- **Every feature that modifies data** should call `logActivity()` for audit trail

## Common Tasks

- **Add logging to a new feature**: Call `logActivity(supabase, { caseId, action: 'descriptive action', details: {...} })` — never await it
- **Add a new filter category**: Add to `ActivityFilter` type and `matchesFilter()` function in `activity/page.tsx`
- **Add activity logging to calendar**: Add `logActivity()` calls in `calendar/page.tsx` handlers (matching patterns from `page.tsx`)
