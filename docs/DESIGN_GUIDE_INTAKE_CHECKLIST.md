# Design Guide Intake Checklist

Use this checklist whenever official design guidance (Figma/library docs/token dictionaries) is introduced or updated. This is required intake before implementation PRs proceed.

## Intake requirements

### 1) Source link capture

- [ ] Figma library URL recorded.
- [ ] Component specs URL(s) recorded.
- [ ] Token dictionary URL (spacing/typography/colors/motion) recorded.
- [ ] Accessibility/content standards URL recorded.
- [ ] Version/changelog reference recorded.

### 2) Token mapping

- [ ] Every incoming spacing token mapped to existing shared token OR flagged for new shared token creation.
- [ ] Every incoming typography token mapped to existing shared token OR flagged for new shared token creation.
- [ ] Every incoming color token mapped to existing shared token OR flagged for new shared token creation.
- [ ] Temporary aliases/deprecated mappings explicitly listed with cleanup owner/date.

### 3) Affected primitives/components

- [ ] `src/components/ui/primitives/state/*` impact listed (loading/empty/error/rate-limited patterns).
- [ ] `src/components/ui/primitives/shell/*` impact listed (`AppShell`, `TopNav`, `SideNav`, `ContentContainer`).
- [ ] Any additional shared primitives/components requiring updates are listed.

### 4) Rollout order (required sequence)

Execute migration in this exact order:

1. **Tokens first** (spacing/typography/colors and any canonical aliases).
2. **Shared primitives next** (`state` and `shell` primitives).
3. **Route/page migrations after primitives**.
4. **Cleanup last** (remove deprecated temporary mappings and aliases).

Do not skip ahead in sequence. Route-level work should not ship before token + primitive updates are in place.

## Implementation guardrails

- New UI must use shared primitives from `src/components/ui/primitives/state` and `src/components/ui/primitives/shell` where applicable.
- New UI must use shared design tokens for spacing, typography, and colors when definitions already exist in `docs/DESIGN_SYSTEM.md`.
- Ad-hoc visual values are only allowed after shared-token discussion and documentation updates.
