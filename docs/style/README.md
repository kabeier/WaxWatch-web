# WaxWatch Style Docs Index

This directory is the canonical style reference for app-facing UI work.

Agents and contributors must treat these files as required input before designing or restyling screens, shared components, or layout chrome.

## Required reading order for UI work

1. `docs/AGENT_GUIDE.md`
2. `docs/DESIGN_SYSTEM.md`
3. `docs/style/WAXWATCH_FRONTEND_DESIGN_GUIDE.txt`
4. `docs/style/WAXWATCH_THEME_TOKENS.txt`
5. `docs/style/COMPONENT_STYLE_RULES.txt`
6. `docs/style/WAVETRACE_COMPONENT_SPEC.txt`
7. `docs/style/APP_SHELL_LAYOUT_SPEC.txt`
8. `docs/style/PAGE_VIEW_SPECS.txt`
9. Supporting implementation references as needed:
   - `docs/style/WAXWATCH_GLOBAL_BASE.css.txt`
   - `docs/style/WAXWATCH_DARK_THEME.css.txt`
   - `docs/style/WAXWATCH_LIGHT_THEME.css.txt`
   - `docs/style/TAILWIND_TOKEN_MAPPING.txt`
   - `docs/style/wave-trace.css.txt`
   - `docs/style/WaveTrace.tsx.txt`

## How these docs fit together

- `WAXWATCH_FRONTEND_DESIGN_GUIDE.txt` defines the product's visual identity, route inventory, and non-negotiable design guardrails.
- `WAXWATCH_THEME_TOKENS.txt` defines the only allowed color/accent token system.
- `COMPONENT_STYLE_RULES.txt` defines default component behavior for cards, buttons, inputs, toasts, dialogs, and badges.
- `WAVETRACE_COMPONENT_SPEC.txt` defines the only approved waveform implementation and placement rules.
- `APP_SHELL_LAYOUT_SPEC.txt` defines desktop/mobile shell layout, nav chrome, and z-index behavior.
- `PAGE_VIEW_SPECS.txt` defines route-level page composition so agents do not invent layouts ad hoc.
- The CSS and TSX `.txt` files are implementation references for theme variables, base styles, WaveTrace structure, and Tailwind token mapping.

## Agent workflow integration

When a task changes UI, layout, design tokens, or route presentation, agents must:

1. Read `docs/AGENT_GUIDE.md`, `docs/DESIGN_SYSTEM.md`, and this index first.
2. Read the specific style files relevant to the task before coding.
3. Reuse existing tokens, shared primitives, and the `WaveTrace` component instead of inventing new visual patterns.
4. Keep waveform usage within the documented guardrails:
   - calm for header bands
   - active for dividers/hero accents
   - spike only for rare highlight moments
   - never behind forms, tables, or dense content
5. Follow the app shell and page specs before proposing new layouts.
6. Update these docs in the same PR whenever a new reusable visual rule or token becomes necessary.
7. Run Prettier before committing for PR submission:
   - `npm run format` for broad changes, or
   - `npx prettier --write <changed-files>` for targeted changes
   - then verify with `npm run format:check`

## Additional documentation review

A dedicated index file for `docs/style/` is necessary because the style system now spans multiple specialized documents and implementation references. This file is that required addition.

At this time, no further style documentation appears necessary beyond keeping this index updated as the source of truth for which style documents agents must read.
