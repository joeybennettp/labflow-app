# Test Agent

## Purpose

Build verification, lint validation, and regression checks. The Test Agent runs after every implementation task to ensure nothing is broken before committing.

## When to Dispatch

- After every Build Agent task completes
- Before every commit
- After resolving merge conflicts
- When verifying a bug fix

## Verification Steps

### 1. Build Check

```bash
npm run build
```

- Must exit with zero errors
- All pages must appear in the build output
- No TypeScript compilation errors

### 2. Lint Check

```bash
npm run lint
```

- Must produce zero errors and zero warnings
- Common issues to watch for:
  - `Date.now()` called during render → wrap in `useState(() => ...)`
  - `setState` in `useEffect` → add eslint-disable comment if it's a fetch-on-mount pattern
  - Missing `alt` on image-like components → rename Lucide `Image` to `ImageIcon`
  - Unused variables → remove them
  - Missing useEffect dependencies → add them or suppress with comment + justification

### 3. Regression Check

Verify that the change didn't break adjacent features:

- If modifying `src/lib/types.ts` — ensure all components importing the changed type still compile
- If modifying `supabase/schema.sql` or `supabase/policies.sql` — ensure the SQL is valid and the live database matches
- If modifying `src/lib/auth-context.tsx` — verify login, role detection, and redirect logic still work
- If modifying a shared component (Modal, Sidebar, StatusBadge) — check all pages that use it

### 4. Role Verification

If the change involves role-based features, verify:

- Admin-only pages are gated by `isAdmin` check
- Doctor portal pages use `PortalCase` type (no financial data leaks)
- Sidebar hides admin-only items for non-admin users
- RLS policies correctly restrict data by role

## Output

The Test Agent should report:

```
Build:  PASS / FAIL (with error details)
Lint:   PASS / FAIL (with error count and file locations)
Issues: List of any problems found
```

If any check fails, the Test Agent should identify the root cause and recommend a fix — do not commit until all checks pass.
