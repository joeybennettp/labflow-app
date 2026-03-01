# Auth Agent

## Scope

Owns authentication, role management, route protection, and the login/signup flows. This is the foundation layer — every other feature depends on auth to determine what a user can see and do.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/auth-context.tsx` | `AuthProvider` + `useAuth()` hook — central auth state, role detection, route protection |
| `src/app/login/page.tsx` | Email/password login with links to signup and doctor registration |
| `src/app/signup/page.tsx` | Team member signup — invite-claim flow (3-step) |
| `src/app/portal/register/page.tsx` | Doctor self-registration — email check → signup → account link |
| `src/lib/types.ts` | `Doctor` type (has `auth_user_id` for linking) |

## Roles

Three roles stored in `user_profiles.role`:

| Role | Access | Route |
|---|---|---|
| `admin` | Full platform access including financials, team, reports, inventory | `/` (lab portal) |
| `tech` | Case management without financial data, team, or reports | `/` (lab portal) |
| `doctor` | Read-only case tracking, messaging, attachments, invoice history | `/portal` (doctor portal) |

The `UserRole` type (`'admin' | 'tech' | 'doctor'`) is defined locally in `auth-context.tsx`, not in `types.ts`.

## AuthProvider Architecture

### State
- `user` — Supabase `User` object (or null)
- `role` — resolved from `user_profiles` table
- `isAdmin` / `isDoctor` — derived booleans
- `doctorId` — linked `doctors.id` for doctor users
- `loading` — true until auth state is determined

### Role Caching
Roles are cached in `localStorage` to prevent flicker on page reload:
- Keys: `labflow-role`, `labflow-doctor-id`
- Helpers: `getCachedRole`, `setCachedRole`, `getCachedDoctorId`, `setCachedDoctorId`
- Cache is cleared on sign-out

### Role Resolution
`fetchRole(userId, userEmail?, retry?)`:
1. Queries `user_profiles` for the user's role
2. If doctor, fetches `doctors.id` via `auth_user_id`
3. Fire-and-forgets an email sync to `user_profiles`
4. Auto-retries once (500ms delay) if auth token not ready

### Route Protection
A `useEffect` watches `[user, role, roleResolved, loading, pathname]`:
- Unauthenticated → redirect to `/login`
- Doctor accessing non-portal route → redirect to `/portal`
- Non-doctor accessing `/portal` → redirect to `/`
- Waits for `roleResolved` before redirecting (prevents premature redirects)

### Auth Events
`supabase.auth.onAuthStateChange` drives the flow:
- On session: calls `fetchRole` in the background
- Sets `loading = false` immediately (not after role resolves)
- 3-second safety timeout if auth never resolves

## Login/Signup Flows

### Lab Staff Signup (invite-required)
```
Step 1: supabase.rpc('check_team_invite', { check_email })
        → Blocks if no pending invite exists
Step 2: supabase.auth.signUp({ email, password })
        → Creates Supabase auth account
Step 3: supabase.rpc('claim_team_invite', { p_user_id, p_email })
        → Creates user_profiles row with invited role
        → Marks team_invites.status = 'claimed'
Post:   Pre-seeds localStorage with role for instant redirect
```

### Doctor Registration (self-service)
```
Step 1: supabase.rpc('check_doctor_email', { check_email })
        → Verifies email matches an unlinked doctor record
Step 2: supabase.auth.signUp({ email, password })
        → Creates Supabase auth account
Step 3: supabase.rpc('link_doctor_account', { p_user_id, p_email })
        → Links auth user to doctor record
        → Creates user_profiles row with role='doctor'
```

## Database Functions

| Function | Security | Purpose |
|---|---|---|
| `is_lab_staff(user_id)` | DEFINER | Used in RLS — checks role is `admin` or `tech` |
| `is_admin(user_id)` | DEFINER | Used in RLS — checks role is `admin` |
| `get_doctor_id_for_user()` | DEFINER | Used in RLS — returns `doctors.id` for `auth.uid()` |
| `check_doctor_email(email)` | DEFINER | Pre-registration check for doctors |
| `link_doctor_account(user_id, email)` | DEFINER | Post-registration link for doctors |
| `check_team_invite(email)` | DEFINER | Pre-signup check for staff invites |
| `claim_team_invite(user_id, email)` | DEFINER | Post-signup claim for staff invites |

All are `SECURITY DEFINER` to bypass RLS when checking `user_profiles`.

## RLS Considerations

- `user_profiles`: Users can read own profile; admins can read/write all profiles
- All other tables use `is_lab_staff()` or `is_admin()` in their policies
- Doctor-specific policies use `get_doctor_id_for_user()` to scope data

## Dependencies

- **Every feature** depends on Auth for role detection and route protection
- **Team** — invite/claim flow creates `user_profiles` entries
- **Doctor Portal** — `link_doctor_account` connects auth users to doctor records
- **Sidebar** — uses `isAdmin` to show/hide admin-only nav items

## Common Tasks

- **Add a new role**: Update CHECK constraint on `user_profiles.role` → update `UserRole` type in `auth-context.tsx` → add redirect logic → update RLS functions
- **Change redirect behavior**: Modify the route protection `useEffect` in `auth-context.tsx`
- **Add a new auth-gated page**: Check role in the page component; add to `NAV_ITEMS` in Sidebar with `adminOnly` flag if needed
