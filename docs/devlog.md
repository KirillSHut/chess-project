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

### Greedy Bot

- Added `GreedyBot` as the playable Easy difficulty.
- Added a tiny shared legal-move helper for AI modules.
- Kept material scoring simple: prefer the highest-value legal capture, otherwise choose a random legal move.
- Left Medium and Hard disabled while keeping the bot API compatible with future search-based bots.

### Engine Simulation API

- Promoted engine cloning into a public `clone()` API for AI search.
- Added `applyMove()` for move-object callers and `simulateMove()` for one-step isolated exploration.
- Added engine-owned `activeSide` state so cloned positions know whose turn comes next.
- Deep-copied last-move figure data so clone mutation does not leak back into the live engine.

### Board Evaluation

- Added reusable `PIECE_VALUES` constants using centipawn-style material values.
- Added deterministic `evaluateBoard(chessEngine, side)` material scoring.
- Reused the shared piece values in `GreedyBot` so capture ranking and future search evaluation stay aligned.

### Piece-Square Tables

- Added modest piece-square bonuses for every piece type.
- Mirrored white-oriented tables for black evaluation so positions remain symmetric.
- Kept material dominant while giving `MinimaxBot` a basic preference for healthier piece placement.

### Mobility Evaluation

- Added low-weight mobility scoring based on legal move counts for both sides.
- Kept the mobility term small so activity helps break ties without overpowering material.
- Calculated legal moves only once per side per evaluation.

### King Safety Evaluation

- Added lightweight king-safety scoring from check status and adjacent friendly pieces.
- Rewarded local shelter around the king without introducing attack maps or pawn-structure analysis.
- Kept the heuristic small so direct material remains the dominant signal.

### Minimax Bot

- Added deterministic depth-2 `MinimaxBot` as the playable Medium difficulty.
- Reused engine simulation plus material evaluation for recursive search.
- Added minimal terminal scoring for checkmate and stalemate positions.
- Kept Hard disabled and left alpha-beta pruning for a later step.

### Alpha-Beta Pruning

- Added alpha-beta bounds to `MinimaxBot` without changing its public API.
- Preserved the same evaluation and first-best tie behavior while skipping branches that cannot improve the current result.

### Hard Difficulty

- Enabled Hard difficulty by reusing `MinimaxBot` at depth 3.
- Kept Medium on depth 2 and avoided duplicating minimax logic in a separate bot class.

### Async Bot Turns

- Scheduled bot turns instead of calculating immediately inside the human click flow.
- Added cancellable thinking-state callbacks from controller to React.
- Locked board interaction while the bot is thinking.
- Added visible `Bot is thinking...` UI in the game toolbar.

### Move Ordering

- Added deterministic move ordering for minimax candidates.
- Prioritized checkmates, material captures, promotions, and checks.
- Reused child simulations during search so ordering does not simulate each move twice.
