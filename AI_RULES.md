# AI_RULES.md

# Project Overview

This project is an intelligent multiplayer chess system built with web technologies.

Main technologies:
- TypeScript
- React
- PixiJS
- Node.js
- WebSocket / Socket.IO

The project contains:
- Chess engine
- AI opponents
- Multiplayer system
- PixiJS rendering layer
- React UI layer

The codebase must remain modular, deterministic, and scalable.

---

# Core Engineering Principles

## Separation of Responsibilities

Strictly separate:
- Chess logic
- Rendering
- UI
- Networking
- AI logic

Never mix responsibilities.

Examples:
- Chess engine must not know about PixiJS
- PixiJS objects must not contain chess rules
- AI must not directly manipulate sprites
- Multiplayer layer must not directly modify UI

---

# Architecture Rules

## Chess Engine

Chess engine is the source of truth.

The engine:
- validates moves
- stores game state
- detects check/checkmate/stalemate
- handles castling
- handles en passant
- handles promotion

Engine code must:
- be deterministic
- be pure whenever possible
- not contain rendering code
- not contain networking code

---

## Rendering Layer

PixiJS is rendering only.

Rendering layer:
- displays board
- displays pieces
- plays animations
- handles drag and drop visuals

Rendering layer must NOT:
- validate chess moves
- contain AI logic
- contain multiplayer synchronization logic

---

## Multiplayer Layer

Server is authoritative.

Client must never be trusted for:
- move validation
- game state integrity
- turn validation

Server validates all moves.

Multiplayer code must:
- use event-driven architecture
- support reconnecting
- support synchronization
- support room-based games

---

## AI System

AI logic must be isolated.

AI modules:
- evaluate board states
- generate legal moves
- calculate best move

AI must:
- never access rendering
- never modify UI
- operate only on engine state

Supported AI levels:
- Random
- Greedy
- Minimax
- Alpha-Beta pruning

---
# State Management

Game state must be immutable whenever possible.

Do not mutate:
- board arrays
- move objects
- piece objects

Prefer:
- copied state
- immutable updates
- pure functions

### Bad
```js
board[x][y] = piece;
```

### Good
```js
const newBoard = cloneBoard(board);
```

---

# Function Design

Functions should:
- do one thing
- be predictable
- avoid hidden side effects

Prefer pure functions.

### Bad
```js
movePieceAndPlayAnimation();
```

### Good
```js
validateMove();
applyMove();
playMoveAnimation();
```

---

# Class Design

Prefer composition over inheritance.

Avoid:
- deep inheritance trees
- god objects
- massive manager classes

Classes should have:
- single responsibility
- clear ownership
- minimal dependencies

---

# Code Style

### Rules
- Small functions
- Descriptive naming
- No magic numbers
- Avoid duplicated code

Use:
- constants
- enums-like objects
- utility modules

---

# Naming Conventions

Use clear naming.

### Good examples
- ChessBoard
- MoveValidator
- BoardRenderer
- MultiplayerService
- MinimaxBot

### Avoid
- Manager
- Utils
- DataHandler
- GenericService

---

# Performance Rules

Performance matters.

Avoid:
- unnecessary allocations
- rerendering entire board
- recalculating unchanged states

Use:
- memoization where useful
- pooling if needed
- incremental updates

---

# Testing Rules

Critical chess logic must be testable.

### Required test coverage
- move validation
- check/checkmate
- castling
- en passant
- AI move generation

Rendering code does not require heavy testing.

---

# AI Assistant Instructions

When generating code:
- follow existing architecture
- avoid rewriting unrelated code
- do not introduce new patterns unnecessarily
- preserve module boundaries
- explain tradeoffs briefly
- mention edge cases
- prefer maintainability over cleverness

If architecture is unclear:
- ask for clarification
- do not invent large systems automatically

---

# Forbidden Patterns

Do NOT:
- mix rendering with chess logic
- directly mutate shared state
- create circular dependencies
- use singleton abuse
- place networking inside rendering classes
- place PixiJS objects inside chess engine

---

# Preferred Development Flow

1. Implement engine logic
2. Add tests
3. Connect rendering
4. Add AI
5. Add multiplayer
6. Optimize performance

---

# Git Workflow

### Commit style examples
```bash
feat(engine): add bishop move validation
feat(ai): implement minimax search
fix(multiplayer): synchronize board state
refactor(rendering): separate animation system
```

### Rules
- Small commits
- Clear commit messages
- One responsibility per commit

---

# Codex Prompting Rules

When asking AI to generate code:
- define task scope clearly
- provide context
- specify restrictions
- request edge cases
- request tradeoff explanations

### Good prompt example
```text
Task:
Implement legal rook movement validation.

Requirements:
- Cannot move through pieces
- Cannot capture same color
- Pure logic only
- No rendering code
- JavaScript only

Output:
- Full implementation
- Short explanation
- Edge cases considered
```

---

# Project Goal

The goal is to build:
- scalable architecture
- maintainable multiplayer chess platform
- intelligent chess AI system
- research-ready diploma project

Code quality and architecture are more important than short-term speed.
