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

- [ ] Figma library + component specs: `<add URL>`
- [ ] Design token dictionary (color/type/spacing/motion): `<add URL>`
- [ ] Accessibility standards and content guidelines: `<add URL>`
- [ ] Brand + voice guidelines: `<add URL>`
- [ ] Engineering implementation notes/changelog: `<add URL>`

### 2) Token mapping table

Complete this table before route-by-route migration begins. Every temporary token should map to a canonical token, or be explicitly marked for removal.

| Temporary token            | Canonical token/reference | Migration action | Notes                                 |
| -------------------------- | ------------------------- | ---------------- | ------------------------------------- |
| `font.family.sans`         | `<add canonical ref>`     | `map`            | Confirm fallbacks + loading strategy. |
| `font.weight.regular`      | `<add canonical ref>`     | `map`            |                                       |
| `font.weight.medium`       | `<add canonical ref>`     | `map`            |                                       |
| `font.weight.semibold`     | `<add canonical ref>`     | `map`            |                                       |
| `font.weight.bold`         | `<add canonical ref>`     | `map`            |                                       |
| `text.xs`                  | `<add canonical ref>`     | `map`            |                                       |
| `text.sm`                  | `<add canonical ref>`     | `map`            |                                       |
| `text.base`                | `<add canonical ref>`     | `map`            |                                       |
| `text.lg`                  | `<add canonical ref>`     | `map`            |                                       |
| `text.xl`                  | `<add canonical ref>`     | `map`            |                                       |
| `text.2xl`                 | `<add canonical ref>`     | `map`            |                                       |
| `text.3xl`                 | `<add canonical ref>`     | `map`            |                                       |
| `space.0`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.1`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.2`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.3`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.4`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.5`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.6`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.8`                  | `<add canonical ref>`     | `map`            |                                       |
| `space.10`                 | `<add canonical ref>`     | `map`            |                                       |
| `space.12`                 | `<add canonical ref>`     | `map`            |                                       |
| `space.16`                 | `<add canonical ref>`     | `map`            |                                       |
| `color.bg.canvas`          | `<add canonical ref>`     | `map`            |                                       |
| `color.bg.surface`         | `<add canonical ref>`     | `map`            |                                       |
| `color.bg.subtle`          | `<add canonical ref>`     | `map`            |                                       |
| `color.fg.default`         | `<add canonical ref>`     | `map`            |                                       |
| `color.fg.muted`           | `<add canonical ref>`     | `map`            |                                       |
| `color.fg.inverse`         | `<add canonical ref>`     | `map`            |                                       |
| `color.border.default`     | `<add canonical ref>`     | `map`            |                                       |
| `color.border.muted`       | `<add canonical ref>`     | `map`            |                                       |
| `color.brand.primary`      | `<add canonical ref>`     | `map`            |                                       |
| `color.brand.primaryHover` | `<add canonical ref>`     | `map`            |                                       |
| `color.state.success`      | `<add canonical ref>`     | `map`            |                                       |
| `color.state.warning`      | `<add canonical ref>`     | `map`            |                                       |
| `color.state.error`        | `<add canonical ref>`     | `map`            |                                       |
| `color.state.info`         | `<add canonical ref>`     | `map`            |                                       |
| `color.focus.ring`         | `<add canonical ref>`     | `map`            |                                       |

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

**Rule:** New UI components must consume shared tokens and reusable utilities/components. Do **not** ship inline ad-hoc styles (e.g., arbitrary per-component spacing, color hex values, font sizing, or one-off state patterns) when equivalent shared tokens/utilities exist.

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

### Migration notes template

Use this format for each temporary token/primitive during migration:

- `temporary`: `<token_or_primitive_name>`
- `canonical`: `<new_reference_name_or_link>`
- `status`: `pending | in-progress | migrated | removed`
- `notes`: `<breaking changes, behavioral differences, rollout notes>`

## Team migration table stub (fill when official guides land)

Use this table for immediate route/component tracking while official guidelines are being integrated.

| Team/Area | Route or component | Current primitive/token | Canonical target | Owner | Status    | Notes     |
| --------- | ------------------ | ----------------------- | ---------------- | ----- | --------- | --------- |
| `<team>`  | `<route-or-file>`  | `<temporary ref>`       | `<official ref>` | `<@>` | `pending` | `<notes>` |

## Migration tracker (pre-created)

### Token-by-token tracker

- `temporary`: `font.family.sans`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.regular`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.medium`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.semibold`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `font.weight.bold`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official typography token names.`
- `temporary`: `text.xs`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.sm`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.base`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.lg`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.xl`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.2xl`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `text.3xl`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official type scale.`
- `temporary`: `space.0`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.1`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.2`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.3`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.4`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.5`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.6`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.8`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.10`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.12`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `space.16`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official spacing scale.`
- `temporary`: `color.bg.canvas`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.bg.surface`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.bg.subtle`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.fg.default`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.fg.muted`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.fg.inverse`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.border.default`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.border.muted`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.brand.primary`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.brand.primaryHover`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.success`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.warning`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.error`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.state.info`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`
- `temporary`: `color.focus.ring`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Awaiting official semantic color mapping.`

### Component-by-component tracker

- `temporary`: `StateLoading`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Verify skeleton, copy tone, and a11y announcements.`
- `temporary`: `StateEmpty`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Verify iconography, guidance content, and CTA hierarchy.`
- `temporary`: `StateError`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Verify error tone, retry behavior, and escalation patterns.`
- `temporary`: `StateRateLimited`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Verify cooldown messaging and recovery actions.`
- `temporary`: `AppShell`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Validate layout metrics, responsive behavior, and global chrome.`
- `temporary`: `TopNav`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Validate nav item states and utility action placement.`
- `temporary`: `SideNav`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Validate hierarchy, active state contrast, and collapsed modes.`
- `temporary`: `ContentContainer`
  - `canonical`: `<new_reference_name_or_link>`
  - `status`: `pending`
  - `notes`: `Validate max-widths and horizontal rhythm per breakpoint.`

## Route readiness acceptance criteria (wired -> production-ready)

A route can move from `wired` to `production-ready` only when all criteria below pass:

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
