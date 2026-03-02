# Build Agent

## Purpose

Multi-step implementation, code generation, and cross-cutting changes. The Build Agent executes approved plans and writes production code.

## When to Dispatch

- Executing an approved implementation plan
- Implementing a well-scoped feature or bug fix
- Making changes that span multiple files

## Routing Constraint

**Do not implement UI/visual/styling changes directly.** All design token changes, component styling, CSS, animations, glass effects, card systems, and layout polish must be routed through the **Marketing & UI Agent** (`agents/features/MARKETING_UI.md`) and reviewed by the Chief Engineer before committing. This rule applies even for small tweaks.

## Coding Standards

### TypeScript
- Strict mode is enabled — no `any` types, no implicit returns
- All types defined in `src/lib/types.ts`
- Use path alias `@/` (maps to `src/`)

### React Patterns
- Functional components only
- `useState` for local state, `useMemo` for computed values, `useCallback` for stable references
- `useEffect` for data fetching on mount — wrap fetch calls with `void` and suppress `react-hooks/set-state-in-effect` if needed
- Impure functions like `Date.now()` must be wrapped in `useState(() => ...)` initializers, never called directly in render

### Supabase
- Direct client calls from components — no API routes
- Always use `supabase.from('{table}').select(...)` pattern
- Handle errors silently (console.error) — never show raw Supabase errors to users
- Use typed responses: cast `data as TypeName[]`

### Styling
- Tailwind CSS classes only — no inline styles, no CSS modules
- Follow existing color scheme: blue-600 primary, slate-900 sidebar, slate-50 background
- Responsive: mobile-first approach
- Icons: Lucide React exclusively

### Activity Logging
- Log all user-facing actions via `logActivity()` from `src/lib/activity.ts`
- Fire-and-forget pattern — never `await` the log call
- Include: action description, relevant details, case_id when applicable

## Common File Update Patterns

### Adding a new field to cases
1. `supabase/schema.sql` — Add column to `cases` table
2. `src/lib/types.ts` — Add field to `Case` type (and `PortalCase` if doctor-visible)
3. `src/components/CaseFormModal.tsx` — Add form input
4. `src/components/CaseDetailModal.tsx` — Display the field
5. `src/app/page.tsx` — Include in query select if not using `*`

### Adding a new page
1. `src/app/{route}/page.tsx` — Create page component with `'use client'` directive
2. `src/components/Sidebar.tsx` — Add to `NAV_ITEMS` array (set `adminOnly` if needed)
3. Add Supabase queries, state management, and UI

### Adding a new modal
1. Create component in `src/components/` using the `Modal` wrapper from `src/components/Modal.tsx`
2. Import and render in the parent page with open/close state

### Adding a new database table
1. `supabase/schema.sql` — CREATE TABLE with proper types and references
2. `supabase/policies.sql` — Enable RLS + add policies for lab staff and doctors
3. `src/lib/types.ts` — Add TypeScript type
