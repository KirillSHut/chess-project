import cors from 'cors';
import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { RoomManager } from './rooms/RoomManager.js';

const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:5143',
  'https://kirillshut.github.io',
];

const app = express();
const httpServer = http.createServer(app);
const roomManager = new RoomManager();
const corsOptions = {
  origin: allowedOrigins,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('create_room', () => {
    leaveCurrentRoom(socket, { notifySelf: false });

    const { room, side } = roomManager.createRoom(socket.id);

    socket.data.roomId = room.id;
    socket.data.side = side;
    socket.join(room.id);

    socket.emit('room_created', {
      roomId: room.id,
      side,
      room: roomManager.getPublicRoom(room),
    });
  });

  socket.on('join_room', ({ roomId } = {}) => {
    try {
      if (
        socket.data.roomId &&
        socket.data.roomId !==
          String(roomId || '')
            .trim()
            .toUpperCase()
      ) {
        leaveCurrentRoom(socket, { notifySelf: false });
      }

      const { room, side } = roomManager.joinRoom(socket.id, roomId);

      socket.data.roomId = room.id;
      socket.data.side = side;
      socket.join(room.id);

      socket.emit('room_joined', {
        roomId: room.id,
        side,
        room: roomManager.getPublicRoom(room),
      });

      socket.to(room.id).emit('player_joined', {
        roomId: room.id,
        room: roomManager.getPublicRoom(room),
      });

      if (room.status === 'playing') {
        emitGameStarted(room);
      }
    } catch (error) {
      socket.emit('room_error', {
        message: error.message,
      });
    }
  });

  socket.on('leave_room', ({ roomId } = {}) => {
    leaveCurrentRoom(socket, {
      notifySelf: true,
      opponentEvent: 'opponent_left',
      roomId,
    });
  });

  socket.on('make_move', ({ roomId, fromId, toId, promotionTo } = {}) => {
    const room = roomManager.getRoomById(roomId);

    if (!room) {
      socket.emit('invalid_move', {
        message: 'Room not found',
      });
      return;
    }

    if (room.status !== 'playing') {
      socket.emit('invalid_move', {
        message: 'Game is not active',
      });
      return;
    }

    const side = roomManager.getSideForSocket(room, socket.id);
    if (!side) {
      socket.emit('invalid_move', {
        message: 'Sender is not in this room',
      });
      return;
    }

    if (side !== room.engine.activeSide) {
      socket.emit('invalid_move', {
        message: 'Not your turn',
        activeSide: room.engine.activeSide,
      });
      return;
    }

    if (typeof fromId !== 'string' || typeof toId !== 'string') {
      socket.emit('invalid_move', {
        message: 'Invalid move payload',
      });
      return;
    }

    const opponentSocketId = roomManager.getOpponentSocketId(room, socket.id);
    if (!opponentSocketId) {
      socket.emit('invalid_move', {
        message: 'Opponent is not connected',
      });
      return;
    }

    const result = room.engine.makeMove(fromId, toId, side, {
      promotionTo: promotionTo || null,
    });

    if (!result.success) {
      socket.emit('invalid_move', {
        message: result.reason || 'Invalid move',
        reason: result.reason,
        activeSide: room.engine.activeSide,
      });
      return;
    }

    if (result.status === 'checkmate' || result.status === 'stalemate') {
      room.status = 'finished';
    }

    io.to(room.id).emit('move_applied', {
      roomId: room.id,
      fromId,
      toId,
      promotionTo: promotionTo || null,
      side,
      status: result.status,
      moveInfo: result.moveInfo,
      activeSide: room.engine.activeSide,
      gameState: createGameState(room),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
    leaveAllRoomsForSocket(socket, {
      opponentEvent: 'opponent_disconnected',
    });
  });
});

function leaveCurrentRoom(
  socket,
  { notifySelf = true, opponentEvent = 'opponent_left', roomId = null } = {},
) {
  const previousRoomId = socket.data.roomId;
  const leaveResult = roomManager.leaveRoom(socket.id, roomId || previousRoomId);

  if (!leaveResult) {
    if (notifySelf) {
      socket.emit('room_error', {
        message: 'Room not found',
      });
    }
    return;
  }

  socket.leave(leaveResult.roomId);

  if (!previousRoomId || previousRoomId === leaveResult.roomId) {
    socket.data.roomId = null;
    socket.data.side = null;
  }

  if (notifySelf) {
    socket.emit('room_left', {
      roomId: leaveResult.roomId,
    });
  }

  if (leaveResult.remainingSocketId) {
    socket.to(leaveResult.roomId).emit(opponentEvent, {
      roomId: leaveResult.roomId,
      side: leaveResult.side,
    });
  }
}

function leaveAllRoomsForSocket(socket, { opponentEvent } = {}) {
  let leaveResult = null;

  do {
    leaveResult = roomManager.leaveRoom(socket.id);

    if (leaveResult?.remainingSocketId) {
      socket.to(leaveResult.roomId).emit(opponentEvent, {
        roomId: leaveResult.roomId,
        side: leaveResult.side,
      });
    }
  } while (leaveResult);

  socket.data.roomId = null;
  socket.data.side = null;
}

function emitGameStarted(room) {
  const players = {
    white: room.players.white,
    black: room.players.black,
  };
  const gameState = createGameState(room);

  if (room.players.white) {
    io.to(room.players.white).emit('game_started', {
      roomId: room.id,
      playerSide: 'white',
      players,
      gameState,
    });
  }

  if (room.players.black) {
    io.to(room.players.black).emit('game_started', {
      roomId: room.id,
      playerSide: 'black',
      players,
      gameState,
    });
  }
}

function createGameState(room) {
  return {
    ...room.engine.toSnapshot(),
    status: room.status,
  };
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Multiplayer server listening on port ${PORT}`);
});
