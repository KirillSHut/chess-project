# AI_RULES.md

# Project Overview

This project is a browser chess game built with JavaScript, React, and PixiJS.

Main technologies:

- JavaScript ES modules
- React
- PixiJS
- Webpack
- ESLint / Prettier

The current implementation contains:

- `ChessEngine` as the model and chess-rule source of truth
- React application shell in `src/ui`
- MVC-style coordination through `ControllerGame`
- Dedicated random bot logic in `src/ai/RandomBot.js`
- PixiJS board and piece rendering through `ControllerView`
- `CellContainer` and `BaseFigure` Pixi components
- Turn management
- Full playable local game flow
- A random-move AI bot integrated through a dedicated AI module

The project does not currently contain:

- TypeScript
- Server-side logic
- WebSocket / Socket.IO multiplayer
- Dedicated AI modules beyond random move selection
- A separate state-management library

Keep future changes aligned with the real implementation. Do not document or build idealized systems unless the task explicitly asks for them.

Related project docs:

- `docs/architecture.md` explains the current architecture and module boundaries.
- `docs/devlog.md` records architecture decisions and foundation changes.

---

# Current Architecture

## Model: `ChessEngine`

`src/models/ChessEngine.js` stores the logical board state and owns chess rules.

It currently handles:

- Initial board setup
- Legal move generation
- Turn-side filtering for available moves
- Move validation
- Move application
- Check, checkmate, and stalemate detection
- Castling
- En passant
- Basic pawn promotion, defaulting to queen
- Cloned simulations for king-safety validation

The engine must remain independent from PixiJS, DOM APIs, controller classes, and rendering details.

The engine currently uses mutable internal cell objects. Preserve this decision for incremental work, but avoid leaking extra mutable state or allowing view objects to become part of engine state.

## Game Controller: `ControllerGame`

`src/controllers/game/ControllerGame.js` coordinates the model and view.

It currently owns:

- `ChessEngine` creation
- `ControllerView` creation
- Current turn
- Selected figure
- Highlighted move cells
- Human click handling
- View synchronization after moves
- Bot turn orchestration
- Generic end-game result creation and callback dispatch

This class is intentionally the main integration layer. It is acceptable for it to know about both engine and view, but avoid adding unrelated responsibilities such as asset loading, DOM layout, networking, or complex AI search here.

## View: `ControllerView`

`src/view/ControllerView.js` owns PixiJS board and figure rendering.

It currently handles:

- Board cell creation
- Figure creation from engine cell data
- Pixi containers
- Board positioning
- Mapping engine cells to view cells
- Clearing and rebuilding figures after model changes

The view may read model-shaped data passed into it, but it must not validate chess rules or decide game outcomes.

## Pixi Components

`src/controllers/components/Cell.js` and `src/controllers/components/figures/BaseFigure.js` are PixiJS display components.

They currently handle:

- Texture and sprite creation
- Pointer events
- Visual activation / deactivation
- Piece and cell positioning

These components should stay visual and input-focused. They should not contain chess rules, turn logic, or bot logic.

## React UI Shell

`src/ui` owns application-level screens and menu navigation.

It currently handles:

- Main menu
- Bot difficulty menu
- Multiplayer placeholder
- Mounting the PixiJS game screen after choosing Random bot difficulty
- Displaying the end-game overlay from controller-emitted result data

React must stay an application shell. Do not move chess rules, board rendering, or MVC game flow into React components.

## Game Bootstrap

`src/main.js` bootstraps React. `src/ui/GameScreen.jsx` creates the PixiJS application when the game screen is opened. `src/Game.js` owns the top-level chess game lifecycle.

They currently handle:

- Asset loading
- Pixi application setup
- Stage scaling
- Game initialization
- Simple game-end logging

Keep bootstrap files focused on application setup and top-level lifecycle. Keep React screen state separate from chess state.

---

# What Is Implemented Well

- The chess engine is UI-agnostic and does not import PixiJS.
- Move validation and move application are centralized in `ChessEngine`.
- The controller is the integration point between engine and Pixi view.
- The view is mostly rendering-focused and rebuilds itself from engine state.
- The random bot uses legal engine moves instead of inventing move rules.
- The project already has a playable game loop with turn changes and end-game handling.
- Special chess rules such as castling, en passant, checkmate, stalemate, and promotion are represented in the engine.

Preserve these decisions unless a task specifically requires a broader refactor.

---

# Current Architectural Problems

## Mixed Responsibilities

- `ControllerGame` handles selection state, legal-move highlighting, turn advancement, bot turn orchestration, and end-game dispatch.
- `ControllerView` creates board cells and figures, stores layout constants, maps model cells to view cells, and manages Pixi containers.
- `CellContainer` and `BaseFigure` expose click callbacks directly, which couples input handling closely to Pixi display objects.
- `ChessEngine.getAvailableMoves` accepts an object shaped like a view figure, including `cellView`. This works today, but it leaks view terminology into the engine API.

These are acceptable for the current project size, but they are the areas to improve first as the code grows.

## Scaling Risks

- Full figure rebuilds are acceptable temporarily, but future animation systems should move toward incremental synchronization.
- `RandomBot` is intentionally small; future bots should follow the same engine-focused boundary without creating a large AI framework early.
- Engine cells are mutable and exposed through the `cells` getter. External code should treat them as read-only snapshots even though they are real objects today.
- There are no automated tests yet for critical chess rules.
- There is no dedicated move history or notation layer.
- Promotion is automatic unless `promotionTo` is passed programmatically; there is no promotion UI yet.
- Game-end handling currently logs through `Game.endGame`; there is no visible end-game UI.
- Naming such as `ControllerView` and storing components under `controllers/components` is workable, but the boundary between view components and controllers should stay clear.

---

# Architecture Rules

## JavaScript Only

Use JavaScript ES modules. Do not migrate the project to TypeScript unless explicitly requested.

Do not introduce Redux, Zustand, MobX, Socket.IO, a server, or another framework unless the task explicitly asks for that feature.

Use the configured ESLint and Prettier setup for consistency:

- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`

## Respect the Current MVC Structure

Keep the current responsibilities:

- `ChessEngine` owns chess state and rules.
- `ControllerGame` coordinates game flow.
- `ControllerView` renders board and figures.
- Pixi components handle visuals and pointer events.
- React components handle menus and screen navigation.
- `Game` and `GameScreen` handle Pixi game bootstrap and lifecycle.

Prefer incremental changes over large rewrites.

## Chess Engine Rules

The engine is the source of truth for legal chess state.

Engine code must:

- Validate moves
- Apply moves
- Track rule-specific state such as `hasMoved` and `_lastMove`
- Detect check, checkmate, and stalemate
- Stay independent from PixiJS, DOM, controller, and asset code

Engine code should avoid:

- Importing view or controller modules
- Accepting Pixi display objects as inputs
- Mutating state outside controlled engine methods
- Adding UI-specific concepts

When improving the engine API, prefer simple data inputs such as `fromId`, `toId`, `side`, and `figureName`.

## Controller Rules

`ControllerGame` may coordinate model and view, but it should not become a catch-all class.

It may contain:

- Turn flow
- Selection flow
- Calling engine methods
- Calling view methods
- Trigger bot actions while keeping bot decision logic outside the controller.
- End-game dispatch

Avoid adding:

- Chess rule calculations
- Pixi rendering internals
- Asset loading
- DOM layout logic
- Networking logic
- Complex AI search algorithms

Bot decision-making belongs in dedicated AI modules such as `RandomBot`, which receive engine state and return a move.

## View Rules

View code may:

- Render cells and figures
- Highlight legal target cells supplied by the controller
- Attach pointer callbacks
- Map cell ids to Pixi cell containers
- Rebuild or update visual pieces from engine state

View code must not:

- Validate chess moves
- Decide whose turn it is
- Decide checkmate or stalemate
- Generate bot moves
- Store authoritative chess state

## React UI Rules

React components may:

- Render menus, buttons, and placeholder screens
- Hold simple screen-selection state with `useState`
- Mount and unmount the PixiJS game through `GameScreen`
- Present end-game overlays from generic result objects

React components must not:

- Validate chess moves
- Render the chess board or pieces
- Own engine state
- Import `ChessEngine` directly for gameplay decisions
- Add complex routing or global state libraries for simple menu flow

End-game UI should consume neutral result data such as:

```js
{
  type: 'checkmate',
  winner: 'white',
  loser: 'black',
  isDraw: false,
}
```

React may translate that into local-player copy such as `You Win`, but the result object itself must not be bot-specific.

## Component Rules

Pixi components should stay small and visual.

They may:

- Create sprites and text labels
- Position themselves
- Emit interaction events
- Show active / inactive visual state

They must not:

- Import `ChessEngine`
- Know current turn
- Generate legal moves
- Apply game moves
- Trigger bot decisions directly

---

# AI Bot Rules

The current AI is a random legal-move bot implemented in `src/ai/RandomBot.js`.

Rules for current bot work:

- Use `ChessEngine.getAvailableMoves` or another engine-owned legal move API.
- Never generate pseudo-legal bot moves manually.
- Never let the bot directly mutate engine cells or Pixi objects.
- Keep random selection simple unless the task asks for stronger AI.

If adding stronger AI later:

- Add a separate JavaScript module with the same `getMove(engine, side)` shape.
- Pass it legal moves or model data, not Pixi objects.
- Keep the first extraction small; do not introduce a full AI framework upfront.

---

# State Management

The current engine uses mutable internal objects. This is acceptable for now.

Rules:

- Mutate board state only inside `ChessEngine` methods.
- Treat `ChessEngine.cells` as read-only outside the engine.
- Do not store Pixi objects in engine cells.
- Do not let view state become authoritative.
- Prefer cloning or simulation helpers for move validation that needs hypothetical board states.

Avoid broad immutability rewrites unless they solve a concrete bug or testing need.

---

# Function and Class Design

Functions should:

- Be small enough to understand locally
- Have clear inputs and outputs
- Avoid hidden cross-layer side effects
- Use descriptive names

Classes should:

- Keep one primary responsibility
- Follow existing project naming unless there is a concrete reason to rename
- Avoid deep inheritance
- Avoid generic manager classes

Do not introduce abstractions just because they may be useful later.

---

# Testing Rules

There is currently no test suite. When adding tests, prioritize engine behavior first.

Highest-value test targets:

- Legal and illegal movement for every piece
- Captures and blocked paths
- Check prevention
- Checkmate and stalemate
- Castling rules
- En passant
- Promotion
- Bot move selection using only legal moves

Rendering code can be tested more lightly. Prefer engine tests before Pixi interaction tests.

---

# Incremental Improvement Priorities

Prefer improvements in this order:

1. Add focused tests around `ChessEngine`.
2. Simplify engine inputs so they do not reference `cellView`.
3. Add stronger bot modules only when adding more bot behavior.
4. Improve view synchronization only when animations, performance, or UI features need it.
5. Add visible game-end and promotion UI when requested.
6. Add multiplayer only as a separate feature, with a clear server/client design.

---

# Forbidden Patterns

Do NOT:

- Rewrite the whole project for small tasks
- Migrate to TypeScript without explicit instruction
- Add another UI framework without explicit instruction
- Rewrite the PixiJS chess board in React
- Add networking or server authority rules to code that has no multiplayer feature yet
- Put PixiJS objects inside `ChessEngine`
- Put chess-rule validation inside view components
- Let the bot directly manipulate sprites or engine internals
- Create circular dependencies between model, controller, and view
- Replace the current MVC structure with an unrelated architecture

---

# AI Assistant Instructions

When generating code:

- Analyze the current implementation first
- Follow the existing JavaScript style
- Respect the MVC boundaries already present
- Keep changes tightly scoped
- Preserve reasonable existing decisions
- Avoid unnecessary abstractions
- Explain tradeoffs briefly
- Mention relevant edge cases
- Add tests when touching chess rules, if a test setup exists or is part of the task

If architecture is unclear:

- Inspect the code before answering
- Prefer small incremental changes
- Ask for clarification only when a reasonable local decision would be risky

---

# Project Goal

The current goal is a maintainable local PixiJS chess game with a clean enough architecture to grow gradually.

Longer-term features such as stronger AI, multiplayer, timers, notation, animations, and richer UI should be added incrementally without pretending they already exist.
