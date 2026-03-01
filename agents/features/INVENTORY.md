# Inventory Agent

## Scope

Owns material inventory management — the materials catalog, stock tracking with reorder alerts, and per-case material usage tracking. Admin-only feature for the `/inventory` page, but material usage (via `CaseMaterials`) is accessible to all lab staff within case details.

## Key Files

| File | Purpose |
|---|---|
| `src/app/inventory/page.tsx` | Inventory dashboard — material list, search, stats, CRUD operations (admin-only) |
| `src/components/MaterialFormModal.tsx` | Create/edit material form with category and unit dropdowns |
| `src/components/CaseMaterials.tsx` | Per-case material usage — add/remove materials, auto-adjusts stock quantity |
| `src/components/CaseDetailModal.tsx` | Embeds `CaseMaterials` component in case detail view |
| `src/lib/types.ts` | `Material`, `CaseMaterial` types |

## Database Tables

### `materials`
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT DEFAULT '',
  category TEXT DEFAULT '',
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  reorder_level NUMERIC(10,2) DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  supplier TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- auto-updated by trigger
);
```

### `case_materials` (junction table)
```sql
CREATE TABLE case_materials (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity_used NUMERIC(10,2) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Both FKs have `ON DELETE CASCADE` — deleting a case or material removes associated usage records.

## Inventory Deduction Pattern

Stock quantity is managed **client-side** in `CaseMaterials.tsx` — there is no database trigger:

- **Adding material to case**: Inserts `case_materials` row, then decrements `materials.quantity` by the amount used (`Math.max(0, current - qty)`)
- **Removing material from case**: Deletes `case_materials` row, then restores `materials.quantity` by adding back `quantity_used`

This means inventory accuracy depends on the client-side logic. No server-side enforcement exists.

## Hardcoded Enumerations

In `MaterialFormModal.tsx`:

- **Categories**: `['Zirconia', 'PFM', 'Acrylic', 'E.max', 'Metal', 'Composite', 'Wax', 'Other']`
- **Units**: `['pcs', 'ml', 'g', 'kg', 'oz', 'discs', 'blocks', 'sheets']`

## RLS Considerations

Both tables are **lab-staff-only** — doctors have zero access:

- `materials`: Full CRUD for `is_lab_staff(auth.uid())`
- `case_materials`: SELECT, INSERT, DELETE for `is_lab_staff(auth.uid())` — no UPDATE policy (entries are deleted and re-inserted, never updated)

## Dependencies

- **Cases** — `case_materials` links materials to cases via `case_id`
- **Invoicing** — Material costs contribute to overall case cost analysis

## Common Tasks

- **Add a new material field**: Update `supabase/schema.sql` → `Material` type in `types.ts` → `MaterialFormModal` form → `InventoryPage` table
- **Change reorder alert threshold**: Logic is in `InventoryPage` — `quantity <= reorder_level && reorder_level > 0`
- **Add new category/unit options**: Update the hardcoded arrays in `MaterialFormModal.tsx`
