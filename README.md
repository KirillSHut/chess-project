# Chess Project

JavaScript chess project with a React UI shell, PixiJS board rendering, MVC-style game orchestration, local play vs bot, AI vs AI testing, and AI benchmarking metrics.

## Current Structure

```text
client/
  src/          Current frontend source code
  public/       Client assets and CSS
  index.html    Client HTML template
  webpack.config.mjs

server/
  src/          Initial Express and Socket.IO server
  package.json
  README.md

shared/
  chess/        Reusable chess rules and board configuration
  README.md

docsMD/         Project architecture notes, devlog, and roadmap
docs/           Generated client build output
```

## How To Run The Client

Install dependencies from the repository root:

```bash
npm install
```

Start the client dev server:

```bash
npm run client:dev
```

Build the client:

```bash
npm run client:build
```

Compatibility aliases are kept:

```bash
npm run dev
npm run build
```

## Multiplayer Preparation

The project is now arranged as a simple multiplayer-ready monorepo shape:

- `client/` contains the existing playable React/PixiJS chess app.
- `server/` contains the initial Express and Socket.IO multiplayer server foundation.
- `shared/chess/` contains reusable chess rules and board configuration for both the client and future server.

No multiplayer rooms or chess synchronization are implemented yet. The current local game modes and AI systems remain client-side.

## How To Run The Server

Install server dependencies:

```bash
npm --prefix server install
```

Start the server from the repository root:

```bash
npm run server:dev
```

Or from inside `server/`:

```bash
npm run dev
```

The server exposes `GET /health` and accepts basic Socket.IO connections.

## Multiplayer Client Connection

The client has a small Socket.IO service at `client/src/services/socketService.js`.

By default it connects to:

```text
http://localhost:4000
```

Override the server URL for the client build with:

```bash
SOCKET_URL=http://localhost:4000 npm run client:dev
```

The client connects only when the multiplayer placeholder screen is opened and disconnects when leaving that screen.

## Shared Chess

`shared/chess/ChessEngine.js` is the source of truth for chess rules, move validation, move application, cloning, and simulation. Client rendering, React UI, and AI bots import it but do not live in the shared layer.
