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
        io.to(room.id).emit('game_started', {
          roomId: room.id,
          players: {
            white: room.players.white,
            black: room.players.black,
          },
          initialState: null,
        });
      }
    } catch (error) {
      socket.emit('room_error', {
        message: error.message,
      });
    }
  });

  socket.on('leave_room', () => {
    leaveCurrentRoom(socket);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
    leaveCurrentRoom(socket, { notifySelf: false });
  });
});

function leaveCurrentRoom(socket, { notifySelf = true } = {}) {
  const previousRoomId = socket.data.roomId;
  const leaveResult = roomManager.leaveRoom(socket.id);

  if (previousRoomId) {
    socket.leave(previousRoomId);
  }

  socket.data.roomId = null;
  socket.data.side = null;

  if (!leaveResult) return;

  if (notifySelf) {
    socket.emit('room_left', {
      roomId: leaveResult.roomId,
    });
  }

  if (leaveResult.remainingSocketId) {
    socket.to(leaveResult.roomId).emit('room_error', {
      code: 'opponent_disconnected',
      message: 'Opponent disconnected',
      roomId: leaveResult.roomId,
      room: roomManager.getPublicRoom(leaveResult.room),
    });
  }
}

httpServer.listen(PORT, () => {
  console.log(`Multiplayer server listening on port ${PORT}`);
});
