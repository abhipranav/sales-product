# ADR-0005: UI System Baseline with shadcn/ui

- Status: Accepted
- Date: 2026-02-07

## Context

The cockpit experience needs fast iteration speed and a consistently clean B2B interface without adding heavy runtime UI dependencies.

The previous setup used Tailwind utilities directly in each feature component, which increased repeated styling patterns and slowed UI consistency updates.

## Decision

Adopt shadcn/ui-style primitives as the shared UI baseline:

- Use local component primitives under `components/ui` (`Button`, `Card`, `Input`, `Textarea`, `Select`, `Badge`, `Separator`).
- Keep styling token-driven with Tailwind and local utility composition (`cn` with `clsx` + `tailwind-merge`).
- Refactor cockpit feature panels to consume shared primitives instead of inline duplicated utility clusters.

## Why this decision

- Maintains full ownership of component code (no opaque runtime component library dependency).
- Speeds up UI changes by centralizing behavior and variants.
- Aligns with modern Next.js + Tailwind SaaS build practices while preserving small bundles.

## Consequences

- New UI work should build on `components/ui` first, then feature components.
- Variant expansion must be done in primitive files to avoid style drift.
- Future teams and AI agents have one canonical UI composition layer to reference.
