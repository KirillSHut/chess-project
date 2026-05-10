# Devlog

## 2026-05-10

### Foundation Stabilization

- Finalized `AI_RULES.md` so it describes the current JavaScript + PixiJS MVC implementation instead of an idealized TypeScript, React, and multiplayer architecture.
- Added `docs/architecture.md` to document module responsibilities, allowed dependencies, known tradeoffs, and scaling priorities.
- Added this devlog as a lightweight place to record architectural decisions and project foundation changes.
- Converted ESLint to native ESLint 9 flat config and wired Prettier into the lint workflow.
- Added package scripts for formatting and lint fixes.
- Removed obvious temporary code:
  - Debug-only global Pixi app assignment.
  - Empty ticker callback.
  - Unused view-only `hasMoved` field.
  - Unused cell `_currentFigure` field.
  - Stale TODO comment.
  - Unused bunny asset aliases from the asset manifest.

### Current Architecture Decision

The project should keep the current MVC-style structure:

- `ChessEngine` owns chess state and rules.
- `ControllerGame` coordinates game flow between model and view.
- `ControllerView` owns Pixi rendering.
- Pixi components stay visual and input-focused.

The next meaningful architecture improvement should be tests around `ChessEngine`, not a rewrite.
