# Architecture

This project is a local browser chess game built with JavaScript ES modules, React, PixiJS, and Webpack. React is the application shell. PixiJS remains the chess rendering system. The chess implementation keeps its MVC-style structure.

## High-Level Flow

1. `src/main.js` mounts the React application shell.
2. `src/ui/App.jsx` controls simple menu navigation with React state.
3. `src/ui/GameScreen.jsx` creates the PixiJS application when a playable mode is selected.
4. `src/Game.js` loads assets and owns the top-level chess game lifecycle.
5. `src/controllers/game/ControllerGame.js` creates and coordinates the model and view.
6. `src/ai` chooses bot moves from engine-generated legal moves.
7. `src/models/ChessEngine.js` stores board state and validates chess rules.
8. `src/view/ControllerView.js` renders board cells and pieces with PixiJS.
9. Pixi components emit pointer callbacks back into the controller.

## Module Responsibilities

### React UI Shell

`src/ui/App.jsx`
`src/ui/MainMenu.jsx`
`src/ui/BotDifficultyMenu.jsx`
`src/ui/GameScreen.jsx`

Owns:

- Main menu screen
- Bot difficulty screen
- Multiplayer placeholder screen
- Simple screen navigation state
- Mounting and unmounting the PixiJS game canvas
- End-game overlay presentation

Must not own:

- Chess rules
- Board rendering
- Move validation
- Bot move generation
- Persistent game state

### Model

`src/models/ChessEngine.js`

Owns:

- Board state
- Initial setup
- Legal move generation
- Move validation and application
- Check, checkmate, and stalemate detection
- Castling, en passant, and promotion state
- Simulated moves for king-safety validation
- Public clone and simulation helpers for future AI search

Must not own:

- PixiJS objects
- DOM elements
- Click handling
- Rendering details
- Bot strategy
- Networking concerns

Simulation API:

- `clone()` returns an isolated engine with copied board, move history, and active-side state.
- `applyMove(move, side, options)` accepts move data and routes through normal validation.
- `simulateMove(move, side, options)` applies a move to a clone and returns `{ engine, result }`.

### Game Controller

`src/controllers/game/ControllerGame.js`

Owns:

- Current turn
- Selected figure state
- Legal move highlighting flow
- Human move handling
- View synchronization after engine moves
- Random bot move orchestration
- Generic end-game result creation and callback dispatch

This is the integration layer. It is allowed to know about both `ChessEngine` and `ControllerView`, but it should not absorb unrelated systems.

### AI

`src/ai/RandomBot.js`
`src/ai/GreedyBot.js`
`src/ai/MinimaxBot.js`
`src/ai/constants/pieceValues.js`
`src/ai/constants/pieceSquareTables.js`
`src/ai/evaluators/evaluateBoard.js`
`src/ai/utils/getLegalMoves.js`
`src/ai/utils/orderMoves.js`

Owns:

- Gathering legal moves from `ChessEngine`
- Random move selection for `RandomBot`
- Simple capture-value selection for `GreedyBot`
- Shallow future-move search with alpha-beta pruning for `MinimaxBot`
- Lightweight candidate ordering for alpha-beta search
- Deterministic material plus piece-square scoring for future search bots
- Returning simple move data

Must not own:

- Turn advancement
- Move application
- PixiJS or React references
- Direct engine mutation

### View

`src/view/ControllerView.js`

Owns:

- Board cell creation
- Figure creation from engine cells
- PixiJS containers
- Board positioning
- Mapping cell ids to `CellContainer` instances
- Clearing and rebuilding figures

Must not decide:

- Whether a move is legal
- Whose turn it is
- Whether the game is over
- Which move the bot should play

### Pixi Components

`src/controllers/components/Cell.js`
`src/controllers/components/figures/BaseFigure.js`

Own:

- Sprite and text creation
- Pointer activation
- Visual active/inactive state
- Local positioning

These classes should stay display-object focused.

### Bootstrap

`src/main.js`

Own:

- React application mount

`src/ui/GameScreen.jsx`
`src/Game.js`

Own:

- Pixi application setup
- Asset loading
- Stage scaling
- Top-level start/end lifecycle

## Current Boundaries

Allowed dependencies:

- `main` imports React and `App`
- React menu components import other UI components
- `GameScreen` imports PixiJS `Application` and `Game`
- `Game` imports `ControllerGame`
- `ControllerGame` imports the currently supported bot modules
- `ControllerGame` imports `ChessEngine` and `ControllerView`
- `ControllerView` imports Pixi components and static board config
- Pixi components import PixiJS
- `ChessEngine` imports configs and enum-like constants

Disallowed dependencies:

- Menu-only React components importing `ChessEngine` or Pixi components
- `ChessEngine` importing PixiJS, view, controller, or DOM modules
- Pixi components importing `ChessEngine`
- View code generating chess rules
- Bot logic directly mutating view objects or engine internals

## End-Game Flow

1. `ChessEngine.makeMove()` returns `checkmate` or `stalemate` from existing rule logic.
2. `ControllerGame` converts that terminal status into a neutral result object:
   - checkmate: `{ type, winner, loser, isDraw: false }`
   - stalemate: `{ type, winner: null, loser: null, isDraw: true }`
3. `Game` forwards the result to the active application shell.
4. `GameScreen` stores the result in React state and renders `EndGameOverlay`.
5. The overlay translates the neutral result into viewer-facing copy such as `You Win`, `You Lose`, or `Draw`.

The neutral result shape is deliberate: multiplayer players, local players, and spectators can all consume the same result without changing engine logic.

## Simulation Flow

1. AI code asks the engine for legal moves.
2. AI code can call `engine.clone()` and `clonedEngine.applyMove(move)`, or use `engine.simulateMove(move)`.
3. Every applied hypothetical move still passes through `ChessEngine.makeMove()`.
4. The original active game engine remains unchanged.

Clones preserve board pieces, `hasMoved` flags, the last move for en passant, promotion outcomes represented on pieces, and `activeSide`. This is enough state for recursive evaluation while keeping rule ownership inside the engine.

## Known Tradeoffs

- `RandomBot`, `GreedyBot`, and `MinimaxBot` are dedicated modules with the same `getMove(engine, side)` shape.
- `evaluateBoard` uses material plus modest piece-square bonuses. Mobility, deeper king safety, and endgame-specific tables remain separate future steps.
- `MinimaxBot` stays at depth 2 for now and uses alpha-beta pruning. Deeper synchronous search may still visibly block the UI and should be profiled before increasing depth.
- Move ordering currently prefers checkmates, captures, promotions, and checks. It reuses the child simulations needed by search rather than simulating positions twice.
- React currently uses local `useState` for screen flow. This is enough for the menu; routing or global state would be unnecessary.
- Restart currently remounts a fresh PixiJS game session from `GameScreen`. This resets engine and view state together without introducing a second reset path inside the engine.
- Cloning allocates a fresh 64-cell engine snapshot. That is clear and safe for the current project, though deeper search may eventually need profiling before optimization.
- `ChessEngine.cells` exposes mutable objects. Treat them as read-only outside the engine until there is a concrete reason to introduce snapshots.
- `ChessEngine.getAvailableMoves` currently accepts a view-shaped object with `cellView`. A future incremental cleanup should prefer simple model inputs such as `fromId` and `side`.
- The view rebuilds all figures after every move. This is simple and stable now, but may need incremental updates when animations or performance become important.

## Scaling Priorities

1. Add focused tests for `ChessEngine`.
2. Clean the engine public API so it does not mention view concepts.
3. Add new bot modules only when introducing non-random AI.
4. Add visible promotion and game-end UI.
5. Improve rendering updates when animation or performance requires it.
6. Add multiplayer only as a separate planned feature.
