# Plan Agent

## Purpose

Feature design, implementation strategy, and dependency mapping. The Plan Agent takes Explore findings and produces a step-by-step implementation plan before any code is written.

## When to Dispatch

- New feature implementation (any feature touching 2+ files)
- Refactoring or architectural changes
- Multi-step bug fixes with cross-cutting impact
- Any task where the approach isn't immediately obvious

## How to Operate

### Planning Process

1. **Review Explore output** — Understand affected files, existing patterns, and dependencies
2. **Reference CLAUDE.md** — Ensure the plan follows established conventions
3. **Reference the feature agent guide** — Check domain-specific rules for the affected feature
4. **Design the approach** — Determine which files to modify, in what order, and why
5. **Identify risks** — Flag potential RLS issues, type mismatches, or role-visibility concerns

### Plan Structure

Every plan should include:

```
## Context
Why this change is needed

## Approach
Step-by-step implementation (ordered by dependency)

## Files to Modify
- Exact file paths with what changes in each

## Database Changes (if any)
- New tables, columns, policies, or functions
- Update supabase/schema.sql and supabase/policies.sql accordingly

## Dependencies
- Other features affected
- Components that need updating

## Verification
- How to test the change (build, lint, manual verification)
```

### Rules

- Never propose a new pattern when an existing one works. Reuse Modal, StatusBadge, StatsGrid, CasesTable patterns.
- New types go in `src/lib/types.ts` — never inline type definitions in components.
- New Supabase tables require RLS policies. Always plan for both lab staff and doctor access levels.
- Admin-only features must check `isAdmin` and be hidden from the Sidebar for non-admin users.
- Doctor portal features must use `PortalCase` (no financial data) unless explicitly showing invoices (`PortalInvoiceCase`).
