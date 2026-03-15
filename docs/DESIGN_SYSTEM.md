# Design System

This document defines a **temporary baseline design system** for WaxWatch until official design guides are published. It gives agents and contributors a shared implementation target so new UI stays consistent.

## Status and ownership

- **Current state:** Temporary baseline (this file).
- **Future state:** Canonical design documentation will replace this baseline.
- **Owner:** Product/design + frontend maintainers.

## Design guide intake checklist

Primary intake workflow lives in `docs/DESIGN_GUIDE_INTAKE_CHECKLIST.md` and is required for design-guide adoption/migration planning.

Run this checklist as soon as official standards are published so migration work starts from a shared source of truth.

### 1) Source links

- [ ] Figma library + component specs: `Pending official link (Owner: Design Systems Working Group; Target date: 2026-06-30)`
- [ ] Design token dictionary (color/type/spacing/motion): `Pending official link (Owner: Design Systems Working Group; Target date: 2026-06-30)`
- [ ] Accessibility standards and content guidelines: `Pending official link (Owner: Design Systems Working Group; Target date: 2026-06-30)`
- [ ] Brand + voice guidelines: `Pending official link (Owner: Design Systems Working Group; Target date: 2026-06-30)`
- [ ] Engineering implementation notes/changelog: `Pending official link (Owner: Design Systems Working Group; Target date: 2026-06-30)`

### 2) Token mapping table

Complete this table before route-by-route migration begins. Every temporary token should map to a canonical token, or be explicitly marked for removal.

| Temporary token            | Canonical token/reference                                                                    | Migration action | Notes                                 |
| -------------------------- | -------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------- |
| `font.family.sans`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            | Confirm fallbacks + loading strategy. |
| `font.weight.regular`      | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `font.weight.medium`       | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `font.weight.semibold`     | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `font.weight.bold`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.xs`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.sm`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.base`                | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.lg`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.xl`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.2xl`                 | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `text.3xl`                 | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.0`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.1`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.2`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.3`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.4`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.5`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.6`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.8`                  | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.10`                 | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.12`                 | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `space.16`                 | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.bg.canvas`          | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.bg.surface`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.bg.subtle`          | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.fg.default`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.fg.muted`           | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.fg.inverse`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.border.default`     | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.border.muted`       | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.brand.primary`      | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.brand.primaryHover` | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.state.success`      | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.state.warning`      | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.state.error`        | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.state.info`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |
| `color.focus.ring`         | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `map`            |                                       |

### 3) Affected shared primitives

Review these first, because route quality usually depends on them:

- [ ] `StateLoading`
- [ ] `StateEmpty`
- [ ] `StateError`
- [ ] `StateRateLimited`
- [ ] `AppShell`
- [ ] `TopNav`
- [ ] `SideNav`
- [ ] `ContentContainer`

## Temporary baseline tokens

Use these tokens as the single source of truth for new UI work. Avoid adding one-off visual values unless they are first promoted to shared tokens/utilities.

### Typography scale (temporary)

- `font.family.sans`: `Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
- `font.weight.regular`: `400`
- `font.weight.medium`: `500`
- `font.weight.semibold`: `600`
- `font.weight.bold`: `700`

Type size + line height:

- `text.xs`: `12 / 16`
- `text.sm`: `14 / 20`
- `text.base`: `16 / 24`
- `text.lg`: `18 / 28`
- `text.xl`: `20 / 28`
- `text.2xl`: `24 / 32`
- `text.3xl`: `30 / 38`

Usage intent:

- Page title: `text.2xl` or `text.3xl`, `font.weight.semibold`
- Section title: `text.xl`, `font.weight.semibold`
- Body/default UI copy: `text.base`, `font.weight.regular`
- Secondary/meta copy: `text.sm`
- Labels/helper microcopy: `text.xs` or `text.sm`

### Spacing scale (temporary)

4px base scale:

- `space.0`: `0`
- `space.1`: `4px`
- `space.2`: `8px`
- `space.3`: `12px`
- `space.4`: `16px`
- `space.5`: `20px`
- `space.6`: `24px`
- `space.8`: `32px`
- `space.10`: `40px`
- `space.12`: `48px`
- `space.16`: `64px`

Usage intent:

- Intra-component gaps: `space.2` to `space.4`
- Form/control vertical rhythm: `space.3` to `space.4`
- Card/panel padding: `space.4` to `space.6`
- Section spacing: `space.8`+

### Color primitives (temporary)

Semantic primitives (not raw hex in component code):

- `color.bg.canvas`: app/page background
- `color.bg.surface`: cards/panels
- `color.bg.subtle`: muted surfaces
- `color.fg.default`: primary text/icons
- `color.fg.muted`: secondary text/icons
- `color.fg.inverse`: text on strong brand/neutral fills
- `color.border.default`: standard borders/dividers
- `color.border.muted`: subtle separators
- `color.brand.primary`: main action + highlights
- `color.brand.primaryHover`: hover/active brand state
- `color.state.success`
- `color.state.warning`
- `color.state.error`
- `color.state.info`
- `color.focus.ring`: keyboard focus indicator

Guidance:

- Build components against semantic tokens above.
- If a new semantic meaning is needed, add a new shared token; do not hardcode per-component hex values.

## Accessibility minimums (required)

At minimum, all new UI must satisfy:

- WCAG 2.1 AA contrast for text and essential UI controls.
- Visible keyboard focus states on all interactive elements.
- Full keyboard operability for navigation and key workflows.
- Semantic HTML first; ARIA only when native semantics are insufficient.
- Form fields include programmatically associated labels and clear validation/error messaging.
- State UI (loading/empty/error/rate-limited) is announced or otherwise accessible to assistive technologies where applicable.

## Shared component namespace

Use `src/components/ui/primitives/*` as the single namespace for design-system primitives.

- State primitives: `src/components/ui/primitives/state/*`
- Shell primitives: `src/components/ui/primitives/shell/*`

## Required reusable primitives

### State UI primitives

The app must provide and reuse shared primitives for common state handling:

- `StateLoading` (`src/components/StateLoading.tsx`)
- `StateEmpty` (`src/components/StateEmpty.tsx`)
- `StateError` (`src/components/StateError.tsx`)
- `StateRateLimited` (`src/components/StateRateLimited.tsx`)

Minimum behavior contract:

- Accept consistent title/body/action props.
- Support icon/illustration slot (optional).
- Provide accessible semantics for status messaging.
- Avoid layout shift where feasible (especially loading/skeleton usage).

### Contributor note (temporary default)

Until the official design guides land, contributors should treat `StateLoading`, `StateEmpty`, `StateError`, and `StateRateLimited` as required defaults for MVP route status handling (loading, empty, error, and rate-limited states). Avoid page-specific one-off status UI when these primitives cover the case.

### Navigation shell primitives

The app must provide and reuse shared navigation-shell primitives:

- `AppShell` (overall layout scaffold)
- `TopNav` (global header/navigation)
- `SideNav` (section/workspace nav, when present)
- `ContentContainer` (page width + horizontal rhythm)

Minimum behavior contract:

- Consistent responsive breakpoints and spacing.
- Shared active/hover/focus treatment for nav items.
- Predictable placement for global actions, user/profile menu, and page content.

## Implementation rule for all new UI

**Rule:** New UI components and all new route work must consume shared tokens and reusable utilities/components. Do **not** ship inline ad-hoc styles (e.g., arbitrary per-component spacing, color hex values, font sizing, or one-off state patterns) when equivalent shared tokens/utilities exist.

**Required for new UI work:**

- Use shared state primitives from `src/components/ui/primitives/state` for loading/empty/error/rate-limited patterns.
- Use shared shell primitives from `src/components/ui/primitives/shell` for layout/shell patterns.
- Use shared spacing/typography/color tokens defined in this document where equivalents already exist.

If needed tokens/utilities do not exist yet, add them to shared design-system primitives first, then consume them from the new component.

## Migration plan when official guides arrive

When canonical design guides are available:

1. Add links/references to the official design docs at the top of this file.
2. Mark this temporary baseline section as deprecated.
3. Migrate tokens first (typography/spacing/color mappings).
4. Migrate shared primitives second (state + shell primitives).
5. Migrate route pages third (consume updated primitives and tokens).
6. Remove deprecated temporary mappings/utilities last.

### Migration notes template (explicit template placeholders)

Use this format for each temporary token/primitive during migration:

- `temporary`: `TEMPLATE_TOKEN_OR_PRIMITIVE_NAME`
- `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
- `status`: `pending | in-progress | migrated | removed`
- `notes`: `TEMPLATE_NOTES`

## Team migration table stub (explicit template placeholders; fill when official guides land)

Use this table for immediate route/component tracking while official guidelines are being integrated.

| Team/Area       | Route or component       | Current primitive/token        | Canonical target                                                                             | Owner                   | Status    | Notes            |
| --------------- | ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------- | --------- | ---------------- |
| `TEMPLATE_TEAM` | `TEMPLATE_ROUTE_OR_FILE` | `TEMPLATE_TEMPORARY_REFERENCE` | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `TEMPLATE_OWNER_HANDLE` | `pending` | `TEMPLATE_NOTES` |

## Migration execution order (required)

Execute migration in this order and do not skip ahead unless dependencies are complete:

1. **Tokens**
2. **Shared primitives**
3. **Route pages**
4. **Cleanup** (remove temporary aliases/mappings and dead code)

## Migration tracker (pre-created)

Track migration work using the template fields from this document: `temporary`, `canonical`, `status`, and `notes`.

| temporary                      | canonical                                                                                              | status    | notes                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------- |
| `font.family.sans`             | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`           | `pending` | `Token migration starts in phase 1 (tokens).`                         |
| `color.brand.primary`          | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`           | `pending` | `Map to official semantic brand token in phase 1.`                    |
| `StateLoading`                 | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`           | `pending` | `Validate copy/skeleton/a11y as part of phase 2 (shared primitives).` |
| `AppShell`                     | `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`           | `pending` | `Migrate layout/nav shell behavior in phase 2.`                       |
| `app/(app)/alerts/page.tsx`    | `Pending route-level canonical mapping (Owner: Design Systems Working Group; Target date: 2026-06-30)` | `pending` | `Adopt migrated tokens/primitives in phase 3 (route pages).`          |
| `DEPRECATED_TEMPORARY_MAPPING` | `N/A`                                                                                                  | `pending` | `Remove in phase 4 cleanup after route migration completes.`          |

### Token-by-token tracker

- `temporary`: `font.family.sans`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.regular`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.medium`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.semibold`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.bold`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `text.xs`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.sm`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.base`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.lg`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.xl`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.2xl`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.3xl`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `space.0`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.1`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.2`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.3`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.4`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.5`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.6`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.8`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.10`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.12`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.16`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `color.bg.canvas`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.bg.surface`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.bg.subtle`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.fg.default`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.fg.muted`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.fg.inverse`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.border.default`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.border.muted`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.brand.primary`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.brand.primaryHover`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.success`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.warning`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.error`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.info`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.focus.ring`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`

### Component-by-component tracker

- `temporary`: `StateLoading`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Verify skeleton, copy tone, and a11y announcements.`
- `temporary`: `StateEmpty`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Verify iconography, guidance content, and CTA hierarchy.`
- `temporary`: `StateError`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Verify error tone, retry behavior, and escalation patterns.`
- `temporary`: `StateRateLimited`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Verify cooldown messaging and recovery actions.`
- `temporary`: `AppShell`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Validate layout metrics, responsive behavior, and global chrome.`
- `temporary`: `TopNav`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Validate nav item states and utility action placement.`
- `temporary`: `SideNav`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Validate hierarchy, active state contrast, and collapsed modes.`
- `temporary`: `ContentContainer`
  - `canonical`: `Pending canonical reference (Owner: Design Systems Working Group; Target date: 2026-06-30)`
  - `status`: `pending`
  - `notes`: `Validate max-widths and horizontal rhythm per breakpoint.`

## Route readiness acceptance criteria (wired-minimum -> production-ready)

A route can move from `wired-minimum` to `production-ready` only when all criteria below pass:

> **Status vocabulary source of truth:** Use the canonical route status names and matrix in `docs/DEVELOPER_REFERENCE.md` (**Route matrix**) when updating readiness terminology across docs and PRs.

1. **Canonical token adoption**
   - 100% of route-level typography, spacing, and color usage maps to canonical design tokens (or approved aliases).
   - No inline one-off visual values remain unless formally documented as a design exception.
2. **Shared primitive compliance**
   - Route uses canonical shared primitives for status handling and layout/navigation where applicable.
   - Any local primitive overrides are reviewed and approved by design + frontend maintainers.
3. **State completeness**
   - Route includes and visually verifies loading, empty, error, and rate-limited states using shared patterns.
4. **Interaction and accessibility sign-off**
   - Keyboard navigation works end-to-end.
   - Focus, contrast, semantics, and assistive-technology messaging meet WCAG 2.1 AA expectations.
5. **Responsive and cross-browser validation**
   - Route is validated at agreed breakpoints and in supported browsers/devices with no design regressions.
6. **Visual regression + QA evidence**
   - Screenshots or visual regression artifacts are attached and reviewed.
   - Product/design sign-off recorded in the migration tracker notes for that route.
7. **Documentation/tracker completion**
   - The token and component tracker entries linked to this route are updated to `migrated` (or documented with an approved exception).
