# CHESS PROJECT ROADMAP

---

# PHASE 0 — PROJECT FOUNDATION

## Goal

Stabilize the current project foundation and prepare the codebase for future scaling.

## Tasks

- Finalize `AI_RULES.md`
- Create `docs/architecture.md`
- Create `docs/devlog.md`
- Configure ESLint and Prettier consistently
- Verify folder structure and module boundaries
- Clean obvious dead code and temporary hacks

## Expected Result

- Stable project structure
- Clear engineering rules
- Consistent development workflow

---

# PHASE 1 — ENGINE STABILIZATION

## Goal

Make the chess engine reliable, isolated, and easier to scale.

## Tasks

### Engine API cleanup

- Remove `cellView` leakage from engine APIs
- Replace view-shaped arguments with engine-only data
- Simplify move APIs

### Engine cleanup

- Review move generation logic
- Review move validation flow
- Improve naming consistency
- Remove hidden engine/view coupling

### Add focused tests

Priority order:

1. Pawn movement
2. Castling
3. En passant
4. Check detection
5. Checkmate
6. Stalemate
7. Promotion

### Add utility systems

- Move serialization helpers
- Board cloning helpers
- Coordinate conversion helpers

## Expected Result

- Reliable engine foundation
- Stable move validation
- Cleaner architecture boundaries
- Testable chess logic

---

# PHASE 2 — BOT EXTRACTION

## Goal

Separate AI logic from the main game controller.

## Tasks

### Extract random bot

Create:

```text
src/ai/RandomBot.js
```

### Create bot interface

Example:

```js
bot.getMove(chessEngine);
```

or

```js
bot.getMove({
  board,
  side,
  legalMoves,
});
```

### Refactor controller

- Remove move-selection logic from `ControllerGame`
- Keep controller responsible only for bot triggering

### Add AI-safe boundaries

- AI must not import PixiJS
- AI must not manipulate sprites
- AI must only operate on engine data

## Expected Result

- Cleaner architecture
- AI-ready structure
- Easier AI scaling

---

# PHASE 3 — GAME STATE FEATURES

## Goal

Add systems required for future AI, multiplayer, replay, and UX improvements.

## Tasks

### Move history

Store:

- from
- to
- captured piece
- promotion
- special move type

### Notation system

- Basic algebraic notation
- PGN-ready move representation

### Game state tracking

- Current turn
- Check state
- Winner state
- Draw state

### Add utility APIs

- Export board state
- Import board state
- Reset game
- Replay move history

## Expected Result

- Replay-ready architecture
- Better debugging
- Better multiplayer preparation

---

# PHASE 4 — AI IMPROVEMENTS

## Goal

Implement stronger AI systems and multiple difficulty levels.

## Tasks

### Greedy bot

- Capture prioritization
- Basic board evaluation

### Minimax

- Recursive move search
- Board evaluation function

### Alpha-Beta pruning

- Optimize search performance
- Reduce unnecessary calculations

### Difficulty system

- Random
- Easy
- Medium
- Hard

### Evaluation improvements

- Material values
- Piece positioning
- King safety
- Mobility scoring

## Expected Result

- Intelligent opponents
- Research-ready AI system
- Stronger diploma value

---

# PHASE 5 — RENDERING IMPROVEMENTS

## Goal

Improve visual quality and rendering architecture.

## Tasks

### Incremental synchronization

- Stop rebuilding all pieces every move
- Update only changed pieces

### Animations

- Piece movement animation
- Capture animation
- Check highlight animation

### UI improvements

- Promotion UI
- End-game UI
- Turn indicators
- Move highlights

### Performance improvements

- Reuse sprites
- Reduce texture recreation
- Improve Pixi container management

## Expected Result

- Better UX
- Cleaner rendering architecture
- Better scalability

---

# PHASE 6 — MULTIPLAYER FOUNDATION

## Goal

Introduce online multiplayer architecture.

## Tasks

### Backend setup

- Node.js server
- WebSocket or Socket.IO integration

### Room system

- Create room
- Join room
- Leave room

### Synchronization

- Send moves only
- Server-side move validation
- Turn synchronization

### Reconnection handling

- Restore game state
- Reconnect player to room

### Security boundaries

- Server-authoritative validation
- Reject invalid moves

## Expected Result

- Working online chess matches
- Stable synchronization model
- Multiplayer-ready architecture

---

# PHASE 7 — MULTIPLAYER FEATURES

## Goal

Expand multiplayer functionality and UX.

## Tasks

### Multiplayer UX

- Matchmaking
- Lobby system
- Player names

### Timers

- Chess clocks
- Turn timers

### Match history

- Saved games
- Replay support

### Rating system

- ELO calculation
- Rank tracking

## Expected Result

- Full multiplayer experience
- Competitive systems
- Better diploma presentation

---

# PHASE 8 — RESEARCH & ANALYSIS

## Goal

Prepare analytical and scientific parts of the diploma.

## Tasks

### AI benchmarking

Measure:

- Move calculation time
- Search depth performance
- Alpha-beta efficiency
- Bot win rates

### Multiplayer analysis

Measure:

- Synchronization latency
- Reconnection behavior
- Server load

### Performance analysis

Measure:

- Render performance
- Memory usage
- FPS stability

### Prepare visual materials

- Charts
- Diagrams
- Architecture schemes
- Algorithm comparisons

## Expected Result

- Research-ready material
- Scientific analysis
- Strong diploma presentation

---

# PHASE 9 — FINAL POLISH

## Goal

Prepare the project for final diploma presentation.

## Tasks

### Final cleanup

- Remove debug code
- Improve naming consistency
- Remove dead code

### Documentation

- Architecture documentation
- API documentation
- Setup instructions

### Presentation preparation

- Demo scenarios
- Screenshots
- Performance graphs
- AI comparison examples

### Stability pass

- Bug fixing
- Final testing
- Edge-case validation

## Expected Result

- Presentation-ready diploma project
- Stable release version
- Complete documentation

---

# DEVELOPMENT RULES

## General Workflow

For every feature:

1. Define small scoped task
2. Generate implementation with Codex
3. Review manually
4. Test behavior
5. Commit small changes
6. Update `devlog.md`

---

# PRIORITY RULE

Always prioritize:

1. Engine correctness
2. Architecture clarity
3. Stable APIs
4. Rendering polish
5. Optimization

Never sacrifice architecture quality for short-term speed.

---

# IMPORTANT REMINDER

Do not build:

- enterprise abstractions
- plugin systems
- generic factories
- unnecessary registries
- overengineered architectures

Prefer:

- incremental growth
- small refactors
- simple APIs
- isolated responsibilities
