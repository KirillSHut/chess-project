# Architecture

This project is a local browser chess game built with JavaScript ES modules, React, PixiJS, and Webpack. React is the application shell. PixiJS remains the chess rendering system. The chess implementation keeps its MVC-style structure.

## High-Level Flow

1. `src/main.js` mounts the React application shell.
2. `src/ui/App.jsx` controls simple menu navigation with React state.
3. `src/ui/GameScreen.jsx` creates the PixiJS application when a playable mode is selected.
4. `src/Game.js` loads assets and owns the top-level chess game lifecycle.
5. `src/controllers/game/ControllerGame.js` creates and coordinates the model and view.
6. `src/models/ChessEngine.js` stores board state and validates chess rules.
7. `src/view/ControllerView.js` renders board cells and pieces with PixiJS.
8. Pixi components emit pointer callbacks back into the controller.

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

Must not own:

- PixiJS objects
- DOM elements
- Click handling
- Rendering details
- Bot strategy
- Networking concerns

### Game Controller

`src/controllers/game/ControllerGame.js`

Owns:

- Current turn
- Selected figure state
- Legal move highlighting flow
- Human move handling
- View synchronization after engine moves
- Random bot move orchestration
- End-game callback dispatch

This is the integration layer. It is allowed to know about both `ChessEngine` and `ControllerView`, but it should not absorb unrelated systems.

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

## Known Tradeoffs

- `ControllerGame` currently contains random bot selection. This is fine for one bot level, but should be extracted when bot behavior grows.
- React currently uses local `useState` for screen flow. This is enough for the menu; routing or global state would be unnecessary.
- `ChessEngine.cells` exposes mutable objects. Treat them as read-only outside the engine until there is a concrete reason to introduce snapshots.
- `ChessEngine.getAvailableMoves` currently accepts a view-shaped object with `cellView`. A future incremental cleanup should prefer simple model inputs such as `fromId` and `side`.
- The view rebuilds all figures after every move. This is simple and stable now, but may need incremental updates when animations or performance become important.

## Scaling Priorities

1. Add focused tests for `ChessEngine`.
2. Clean the engine public API so it does not mention view concepts.
3. Extract bot strategy only when adding non-random AI.
4. Add visible promotion and game-end UI.
5. Improve rendering updates when animation or performance requires it.
6. Add multiplayer only as a separate planned feature.
