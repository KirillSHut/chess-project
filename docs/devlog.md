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

### React Shell Integration

- Added React as a simple application shell for menu screens.
- Kept PixiJS responsible for chess rendering.
- Kept chess logic outside React components.
- Added main menu, bot difficulty menu, multiplayer placeholder, and game screen.
- Added Webpack JSX support through Babel.

Current UI rule:

- React owns screen navigation and menu presentation.
- `GameScreen` is the bridge that mounts PixiJS.
- The existing MVC chess implementation remains responsible for gameplay.

### End-Game Flow

- Added generic terminal result objects from `ControllerGame`.
- Added a React end-game overlay with Restart Game and Back To Menu actions.
- Froze board input after terminal states so a finished position cannot continue receiving moves.
- Kept result presentation in React while leaving checkmate and stalemate detection in `ChessEngine`.
- Restart now creates a fresh local game session so engine and view state reset together.

### Random Bot Extraction

- Moved random move selection from `ControllerGame` into `src/ai/RandomBot.js`.
- Kept `ControllerGame` responsible for bot turn orchestration and move application only.
- Kept bot decisions engine-focused through `getMove(chessEngine, side)`.
- Preserved the existing legal-move behavior while making future bot swapping simpler.
