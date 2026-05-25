# Shared

Shared code intended to be reused by both the browser client and the future multiplayer server.

## Chess

`shared/chess/` contains pure chess-rule logic:

- `ChessEngine.js`
- board cell configuration
- figure move configuration
- chess figure enum values

This layer must stay independent from React, PixiJS, DOM APIs, client controllers, AI bots, and server transport code.
