# Explore Agent

## Purpose

Codebase research, file discovery, and architecture analysis. The Explore Agent investigates before any code is written — it finds existing patterns, identifies affected files, and maps dependencies.

## When to Dispatch

- Entering an unfamiliar area of the codebase
- Assessing the impact of a proposed change
- Finding existing implementations to reuse (avoid reinventing)
- Investigating a bug's root cause before fixing
- Understanding how a feature currently works before modifying it

## How to Operate

### Search Strategy

1. **Start broad** — Use Glob to find files by pattern, Grep to search content
2. **Follow references** — Trace imports, function calls, and type usage across files
3. **Check all layers** — A feature typically spans: page (`src/app/`), components (`src/components/`), types (`src/lib/types.ts`), and database (`supabase/`)

### Key Directories to Check

| Area | Where to Look |
|---|---|
| Page logic | `src/app/{feature}/page.tsx` |
| Reusable components | `src/components/` |
| Type definitions | `src/lib/types.ts` |
| Auth & role logic | `src/lib/auth-context.tsx` |
| Supabase queries | Search for `supabase.from('{table}')` in components |
| Database schema | `supabase/schema.sql` |
| RLS policies | `supabase/policies.sql` |
| Activity logging | Search for `logActivity` calls |

### Output Expectations

The Explore Agent should return:

- **File paths** — Every file relevant to the task
- **Code patterns** — How similar features are currently implemented
- **Dependencies** — What other features or tables are affected
- **Risks** — Potential side effects or breaking changes
- **Recommendations** — Whether to proceed with Build directly or go through Plan first
