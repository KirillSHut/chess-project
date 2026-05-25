# Server

Initial Node.js multiplayer server foundation.

## Run

Install server dependencies:

```bash
npm install
```

Start the server:

```bash
npm run dev
```

The server listens on `process.env.PORT` or falls back to `4000`.

## Current API

- `GET /health` returns `{ "status": "ok" }`
- Socket.IO accepts client connections and logs connect/disconnect events
- `create_room` creates an in-memory room and assigns the creator to White
- `join_room` joins an existing room and assigns the second player to Black
- `leave_room` removes the current player from their room

No chess state, move validation, matchmaking, persistence, authentication, or reconnect flow is implemented yet.
