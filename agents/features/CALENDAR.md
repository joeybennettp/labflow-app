# Calendar Agent

## Scope

Owns the visual calendar view — displays cases by due date, supports day selection, and provides quick access to case details and status changes. Available to all lab staff (admin + tech).

## Key Files

| File | Purpose |
|---|---|
| `src/app/calendar/page.tsx` | Self-contained calendar page — grid, navigation, day panel, case modals |

No separate calendar component exists. All logic is in the page file.

## Data Fetching

```ts
// Cases ordered by due date + doctors for edit form
Promise.all([
  supabase.from('cases').select('*, doctors(name)').order('due', { ascending: true }),
  supabase.from('doctors').select('*').order('name', { ascending: true })
])
```

## State

```ts
cases: Case[]
doctors: Doctor[]
currentMonth: number        // 0–11
currentYear: number
selectedDay: string | null  // ISO date 'YYYY-MM-DD'
selectedCase: Case | null
showDetail: boolean
showEditCase: boolean
```

## Calendar Grid

### Computation
- `casesByDate: Record<string, Case[]>` — groups cases by `due` date string (via `useMemo`)
- `calendarDays: { day: number | null; dateStr: string }[]` — 7-aligned grid cells with leading nulls for padding

### Helper Functions (module-level)
- `getDaysInMonth(year, month)` — returns day count
- `getFirstDayOfMonth(year, month)` — returns 0–6 (Sunday = 0)

### Navigation
- `prevMonth()` / `nextMonth()` — handles year boundaries, clears `selectedDay`
- `goToToday()` — jumps to current month and selects today

### Visual Indicators
- Up to 6 colored status dots per day cell
- Rush cases get `ring-1 ring-red-400` on their dot
- Overflow shown as `+N` text
- Today: `bg-brand-600 text-white` circle on date number
- Selected day: `bg-brand-50` cell background

Status colors (Tailwind classes, not hex):
```ts
received: 'bg-slate-400'
in_progress: 'bg-blue-500'
quality_check: 'bg-purple-500'
ready: 'bg-green-500'
shipped: 'bg-amber-500'
```

## Selected Day Panel

Renders below the grid when a day is clicked. Shows all cases due that day:
- Case number (monospace, brand-600), RUSH badge, patient name, type, StatusBadge
- Clicking a case opens `CaseDetailModal`

## CRUD Actions

The calendar page supports full case operations:

| Action | Handler | Notes |
|---|---|---|
| Status change | `handleStatusChange` | Includes shipping data collection for `shipped` status |
| Edit case | `handleUpdateCase` | Via `CaseFormModal` (edit mode) |
| Delete case | `handleDeleteCase` | With `window.confirm` dialog |

All actions call `refreshCases()` after completion.

## Known Gap

**Activity logging is not called from the calendar page.** Status changes, edits, and deletes performed via the calendar do not generate `activity_log` entries. Only operations from the main dashboard (`src/app/page.tsx`) call `logActivity()`.

## RLS Considerations

- Uses the same `cases` and `doctors` SELECT policies as the main dashboard
- No calendar-specific RLS needed
- Available to all lab staff (not admin-gated)

## Dependencies

- **Cases** — displays cases by due date
- **Doctors** — doctor list for case edit form
- **Shipping** — handles shipping data when advancing to `shipped` status via `CaseDetailModal`

## Common Tasks

- **Add activity logging**: Add `logActivity()` calls in `handleStatusChange`, `handleUpdateCase`, and `handleDeleteCase` (matching the pattern in `src/app/page.tsx`)
- **Add week view**: Would need a new `calendarDays` computation and grid layout
- **Color by case type instead of status**: Change the status color mapping to a type-based one
