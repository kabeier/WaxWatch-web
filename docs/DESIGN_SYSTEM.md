# Design System

This document defines a **temporary baseline design system** for WaxWatch until official design guides are published. It gives agents and contributors a shared implementation target so new UI stays consistent.

## Status and ownership

- **Current state:** Temporary baseline (this file).
- **Future state:** Canonical design documentation will replace this baseline.
- **Owner:** Product/design + frontend maintainers.

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

## Required reusable primitives

### State UI primitives

The app must provide and reuse shared primitives for common state handling:

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `RateLimitedState`

Minimum behavior contract:

- Accept consistent title/body/action props.
- Support icon/illustration slot (optional).
- Provide accessible semantics for status messaging.
- Avoid layout shift where feasible (especially loading/skeleton usage).

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

If needed tokens/utilities do not exist yet, add them to shared design-system primitives first, then consume them from the new component.

## Migration plan when official guides arrive

When canonical design guides are available:

1. Add links/references to the official design docs at the top of this file.
2. Mark this temporary baseline section as deprecated.
3. Map each temporary token to its canonical counterpart.
4. Document migration notes per token category (typography, spacing, color, state primitives, nav shell).
5. Track and execute component-level migration in batches.
6. Remove temporary tokens/utilities after migration completion.

### Migration notes template

Use this format for each temporary token/primitive during migration:

- `temporary`: `<token_or_primitive_name>`
- `canonical`: `<new_reference_name_or_link>`
- `status`: `pending | in-progress | migrated | removed`
- `notes`: `<breaking changes, behavioral differences, rollout notes>`
