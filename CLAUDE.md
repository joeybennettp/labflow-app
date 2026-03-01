# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LabFlow is a B2B dental lab case management platform with two portals:
- **Lab Portal** (`/`) — Full case management for lab staff (admin/tech roles)
- **Doctor Portal** (`/portal`) — Read-only case tracking for dentist clients (doctor role)

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Database/Auth:** Supabase (PostgreSQL + Auth + RLS + Storage)
- **Styling:** Tailwind CSS 4, Lucide React icons
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **Deployment:** Vercel

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
```

No test framework is configured.

## Architecture

### Data Flow

All data fetching is done via direct Supabase client calls from components — there are no API routes (`/api/`). Row-Level Security (RLS) policies on Supabase handle authorization; doctors automatically see only their own cases without client-side filtering.

### Auth & Roles

Auth is managed through `src/lib/auth-context.tsx` using React Context. Three roles exist: `admin`, `tech`, `doctor`. Role is fetched from the `user_profiles` table and cached in localStorage to prevent flicker. Doctors are redirected to `/portal`, staff to `/`.

- Admin-only pages: `/invoices`, `/inventory`, `/reports`, `/activity`, `/team`
- All staff: `/`, `/calendar`, `/shipping`, `/doctors`, `/settings`
- Doctor-only: `/portal`, `/portal/invoices`, `/portal/register`

### Two-Portal Architecture

The lab portal and doctor portal are completely separate UIs. The doctor portal strips financial data (price, invoiced) from case views using a distinct `PortalCase` type, except on the invoices page which uses `PortalInvoiceCase`. Doctor self-registration works via an RPC function (`check_doctor_email`) that matches against existing doctor records.

### Case Status Workflow

`received` → `in_progress` → `quality_check` → `ready` → `shipped`

Status can move forward or backward one step. Shipped status includes carrier/tracking info.

### Key Patterns

- **State management:** React Context for auth, `useState`/`useMemo` for component state — no external state library
- **Modals:** Generic `Modal` wrapper component reused throughout
- **Activity logging:** Fire-and-forget via `logActivity()` in `src/lib/activity.ts` — never blocks user actions
- **Sorting/filtering:** Client-side with `useMemo` (dataset is small enough)
- **Path alias:** `@/*` maps to `./src/*`

### Source Layout

- `src/app/` — Next.js App Router pages (each route is a page.tsx)
- `src/components/` — All reusable React components (modals, tables, grids, badges)
- `src/lib/types.ts` — All TypeScript type definitions
- `src/lib/supabase.ts` — Supabase client initialization
- `src/lib/auth-context.tsx` — Auth provider, role management, route protection
- `src/lib/activity.ts` — Activity audit trail logging
- `src/lib/generateInvoicePDF.ts` — PDF invoice generation

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
