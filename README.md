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
  README.md     Placeholder for future multiplayer server work

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
- `server/` is reserved for a future multiplayer backend.
- `shared/chess/` contains reusable chess rules and board configuration for both the client and future server.

No multiplayer server is implemented yet. The current local game modes and AI systems remain client-side.

## Shared Chess

`shared/chess/ChessEngine.js` is the source of truth for chess rules, move validation, move application, cloning, and simulation. Client rendering, React UI, and AI bots import it but do not live in the shared layer.
