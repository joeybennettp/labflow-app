# Marketing & UI Agent

## Scope

Owns all marketing-facing and first-impression UI — login, signup, doctor registration, and any future landing or onboarding pages. Responsible for brand identity, visual polish, design tokens, typography, animation systems, and responsive behavior across these surfaces. Does **not** own in-app feature pages (those belong to their respective feature agents).

## Key Files

| File | Purpose |
|---|---|
| `src/app/login/page.tsx` | Split-screen login — dark brand panel + white form |
| `src/app/signup/page.tsx` | Team member signup page |
| `src/app/forgot-password/page.tsx` | Password reset request |
| `src/app/reset-password/page.tsx` | Password reset form |
| `src/app/portal/register/page.tsx` | Doctor self-registration |
| `src/app/layout.tsx` | Font loading (Geist, Geist Mono, Syne) |
| `src/app/globals.css` | Design tokens, keyframe animations |

## Brand Identity

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-brand-600` | `#2563eb` | Primary accent, buttons, icons |
| `--color-brand-700` | `#1d4ed8` | Hover states |
| `--color-brand-100` | `#dbeafe` | Focus rings |
| `--color-brand-50` | `#eff6ff` | Light backgrounds |
| Dark panel base | `#0a0f1e → #111936 → #0d1529` | Left panel gradient (login) |

### Typography

| Font | Variable | Usage |
|---|---|---|
| **Geist** | `--font-sans` | Body text, form labels, buttons — all UI |
| **Geist Mono** | `--font-mono` | Code, monospace contexts |
| **Syne** (700, 800) | `--font-display` | Display headlines on brand panels only |

Syne is loaded in `layout.tsx` with weights 700/800. Used via `style={{ fontFamily: 'var(--font-display)' }}` on headline elements. Never use Syne for body text or form elements. Headlines use `text-3xl lg:text-4xl` sizing to fit cleanly on two lines across all breakpoints.

### Logo Treatment

The LabFlow logo is a blue-600 rounded square with white "LF" text + "LabFlow" wordmark. Two variants exist:

- **Glass variant** (dark backgrounds): `bg-white/10 border border-white/20 backdrop-blur-sm` container, white text
- **Standard variant** (light backgrounds): `bg-brand-600` square, `text-slate-900` wordmark

## Animation System

All keyframes are defined in `globals.css`:

| Animation | Duration | Purpose |
|---|---|---|
| `float` | 20s | Gentle vertical drift for decorative elements |
| `drift` | 22-25s | Multi-axis movement for accent shapes |
| `pulse-soft` | 8s | Opacity pulse for ambient glow effects |
| `crosshair-pulse` | 4-5s | Scale + opacity pulse for precision markers |
| `fadeInUp` | 0.5s | Entrance animation for form panels |

Applied via inline `style={{ animation: '...' }}` since these are decorative, not Tailwind utilities. Stagger with `animation-delay` for natural feel.

### Decorative Elements

The login page establishes the visual language for brand panels:

- **Hex grid** — inline SVG `<pattern>` with stroke-only hexagons at 8% opacity
- **Floating hexagons** — 3-4 larger hex shapes with `float`/`drift` animations
- **Crosshair markers** — precision-themed SVG elements with `crosshair-pulse`
- **Radial glow orb** — `radial-gradient` div with `pulse-soft` animation
- All decorative elements use `brand-600` (`#2563eb`) at low opacity

## Responsive Strategy

| Breakpoint | Behavior |
|---|---|
| Mobile (`<md`) | Brand panel collapses to ~160px header strip, logo centered, hide headlines/features. Form fills remaining space with mobile logo fallback. |
| Desktop (`md:+`) | True 50/50 split grid (`md:grid md:grid-cols-2`). Full-height panels, all decorative elements and feature bullets visible. |

Key patterns:
- `hidden md:block` for desktop-only elements (headlines, features, extra decorative shapes)
- `md:hidden` for mobile-only fallback elements (mobile logo)
- Fixed height on mobile brand strip (`h-[160px] md:h-auto`)

## Dependencies

- **Auth** — Login/signup pages use `useAuth()` from `auth-context.tsx` for `signIn`/`signUp`
- **Settings** — Lab name could appear on marketing pages in the future

## Common Tasks

- **Apply split-screen to another page**: Copy the login page's two-panel grid structure. Left panel gets the dark gradient + hex grid + decorative elements. Right panel gets white background + form content. Add `fadeInUp` animation to the form panel.
- **Add a new decorative element**: Create an inline SVG in the dark panel's relative container. Position with `absolute` + percentage offsets. Apply an existing animation from `globals.css`.
- **Add a new animation**: Define `@keyframes` in `globals.css`. Keep durations long (8-25s) for ambient effects, short (0.3-0.5s) for entrance effects. Apply via inline `style` attribute.
- **Update brand colors**: Modify `--color-brand-*` tokens in `globals.css` `@theme inline` block. Update the dark panel gradient hex values in the login page's inline `style`.
- **Add feature bullets**: Add to the `hidden md:flex flex-col gap-4` container in the left panel. Use a Lucide icon (`w-4 h-4 text-brand-600`) + `text-blue-200/60 text-sm` text.
