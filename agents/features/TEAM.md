# Team Agent

## Scope

Owns team management — inviting lab staff, role assignment (admin/tech), role changes, and member removal. Admin-only feature accessible at `/team`.

## Key Files

| File | Purpose |
|---|---|
| `src/app/team/page.tsx` | Team dashboard — member list, pending invites, role management (admin-only) |
| `src/components/InviteTeamMemberModal.tsx` | Invite form — email + role selection |
| `src/app/signup/page.tsx` | Invite claim flow — 3-step signup for invited staff |
| `src/lib/auth-context.tsx` | Role detection after invite claim |

## Database Tables

### `user_profiles`
Stores role for every authenticated user:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin', 'tech', 'doctor')),
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `team_invites`
Tracks pending/claimed/revoked invitations:
```sql
CREATE TABLE team_invites (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin', 'tech')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ
);
```

A partial unique index prevents duplicate pending invites: `CREATE UNIQUE INDEX idx_team_invites_pending_email ON team_invites(LOWER(email)) WHERE status = 'pending'`

## Local Types (in team page)

```ts
type TeamMember = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'admin' | 'tech';
  created_at: string;
};

type PendingInvite = {
  id: string;
  email: string;
  role: 'admin' | 'tech';
  created_at: string;
};
```

These types are defined locally in the team page, not in `types.ts`.

## Team Page Actions

| Action | Function | Supabase Call |
|---|---|---|
| Invite member | `handleInvite` | `rpc('create_team_invite', { p_email, p_role })` |
| Revoke invite | `handleRevokeInvite` | `update team_invites set status='revoked'` |
| Toggle role | `handleToggleRole` | `update user_profiles set role` (admin ↔ tech) |
| Remove member | `handleRemoveMember` | `delete from user_profiles where id` |

### Safety Guards

- `isSelf(member)` — disables "Change Role" and "Remove" for the current user
- `isLastAdmin(member)` — prevents demoting the last remaining admin
- All destructive actions require confirmation via a modal

## Invite Claim Flow

When an invited person signs up at `/signup`:

```
1. check_team_invite(email)  → verifies pending invite exists
2. supabase.auth.signUp()    → creates auth account
3. claim_team_invite(user_id, email)
   → upserts user_profiles with the invited role
   → marks team_invites.status = 'claimed'
   → returns the role string
4. Pre-seeds localStorage with role for instant AuthProvider pickup
```

## RPC Functions

| Function | Access | Purpose |
|---|---|---|
| `create_team_invite(email, role)` | Admin-only (enforced in function) | Validates input, checks for duplicates, inserts invite |
| `check_team_invite(email)` | Public | Pre-signup check — is there a pending invite? |
| `claim_team_invite(user_id, email)` | Public (called during signup) | Creates profile, marks invite claimed |

## RLS Considerations

- `user_profiles`: Only admins can read all profiles, insert, update, delete. Regular users can only read their own row.
- `team_invites`: All operations (SELECT, INSERT, UPDATE) are admin-only via `is_admin(auth.uid())`
- No DELETE policy on `team_invites` — revocation is done via UPDATE to `status = 'revoked'`

## Invite Modal

`InviteTeamMemberModal` collects:
- **Email** — trimmed and lowercased before submission
- **Role** — dropdown with contextual descriptions:
  - Admin: "can see financial data, manage team, and configure settings"
  - Tech: "can manage cases but cannot see financial data"

## Dependencies

- **Auth** — Team management creates/modifies `user_profiles` entries that Auth depends on
- **Sidebar** — Team link is admin-only in `NAV_ITEMS`
- **Settings** — Shows "Manage Team" link for admins, "Contact admin" for techs

## Common Tasks

- **Add a new role**: Update CHECK constraints on `user_profiles.role` and `team_invites.role` → update `InviteTeamMemberModal` dropdown → update `is_lab_staff()` function if applicable
- **Change invite flow**: Modify `create_team_invite` RPC in `schema.sql` and `/signup` page
- **Add member metadata**: Add column to `user_profiles` → update `TeamMember` type in team page → update the member card UI
