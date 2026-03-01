# Reports Agent

## Scope

Owns analytics and reporting — the admin-only reports page with 6 charts, and the reusable dashboard analytics components (`AnalyticsGrid`, `StatsGrid`). All analytics are computed client-side from the full `cases` dataset.

## Key Files

| File | Purpose |
|---|---|
| `src/app/reports/page.tsx` | Full reports page — 6 charts for deep analysis (admin-only) |
| `src/components/AnalyticsGrid.tsx` | 3 summary charts for main dashboard (status pie, revenue bar, type bar) |
| `src/components/StatsGrid.tsx` | KPI stat cards for main dashboard (active, overdue, ready/shipped, revenue) |

## Reports Page Charts

All derived client-side via `useMemo` from `cases: Case[]`:

| # | Chart | Type | Data Source |
|---|---|---|---|
| 1 | Cases by Month | Bar | Case count by `created_at`, last 12 months |
| 2 | Revenue Over Time | Line | Sum of `price` where `invoiced === true`, last 12 months |
| 3 | Cases per Doctor | Horizontal Bar | Case count grouped by `doctors.name`, top 10 |
| 4 | Revenue by Doctor | Horizontal Bar | Invoiced revenue by doctor, top 10 |
| 5 | Avg Turnaround Time | Line | Days from `created_at` to `shipped_at` (shipped only), by month |
| 6 | Case Status Distribution | Donut Pie | Current count per status |

**Data fetching:** Single query — `supabase.from('cases').select('*, doctors(name)')` — fetches all cases with no date filter.

## Dashboard Components

### StatsGrid
4 KPI cards (revenue card is admin-only):
- **Active Cases** — status !== 'shipped'
- **Overdue** — not shipped AND due < today
- **Ready/Shipped** — status is 'ready' or 'shipped'
- **Revenue** — sum of price for invoiced cases (admin-only, hidden for techs)

Uses `useState(() => ...)` initializer for `today`/`tomorrow` to avoid impure render calls.

### AnalyticsGrid
3 charts:
- **Cases by Status** — donut pie chart
- **Revenue by Month** — bar chart, last 6 months, invoiced only (admin-only)
- **Cases by Restoration Type** — horizontal bar, top 8, clickable (calls `onTypeClick` to filter case list)

## Status Colors

Duplicated in both `reports/page.tsx` and `AnalyticsGrid.tsx`:

```ts
const STATUS_COLORS: Record<Case['status'], string> = {
  received: '#64748b',
  in_progress: '#2563eb',
  quality_check: '#7c3aed',
  ready: '#16a34a',
  shipped: '#d97706',
};
```

## Charting Library

All charts use **Recharts**: `BarChart`, `Bar`, `LineChart`, `Line`, `PieChart`, `Pie`, `Cell`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`.

## RLS Considerations

- Reports page fetches all cases — requires `is_lab_staff()` SELECT policy
- Revenue data (price, invoiced) is visible because lab staff have full case access
- Admin-only gating is at the UI layer (redirect in `useEffect`)
- Doctors have no access to the reports page

## Dependencies

- **Cases** — all analytics derive from the `cases` table
- **Doctors** — doctor name joined for per-doctor charts
- **Invoicing** — revenue charts filter by `invoiced === true`

## Common Tasks

- **Add a new chart**: Add a `useMemo` computation in `reports/page.tsx`, render a new Recharts component in the grid
- **Add a dashboard KPI**: Add a computed value and card in `StatsGrid.tsx`
- **Change date range**: Modify the month-window logic in the `useMemo` computations (currently 12 months for reports, 6 months for dashboard)
- **Export reports**: Would need a new PDF/CSV generation function similar to `generateInvoicePDF`
