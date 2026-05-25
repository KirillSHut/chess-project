import { randomBytes } from 'node:crypto';

const ROOM_ID_LENGTH = 6;

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(socketId) {
    const roomId = this._createRoomId();
    const room = {
      id: roomId,
      players: {
        white: socketId,
        black: null,
      },
      status: 'waiting',
    };

    this.rooms.set(roomId, room);

    return {
      room,
      side: 'white',
    };
  }

  joinRoom(socketId, roomId) {
    const normalizedRoomId = this._normalizeRoomId(roomId);
    const room = this.rooms.get(normalizedRoomId);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.white === socketId) {
      return {
        room,
        side: 'white',
      };
    }

    if (room.players.black === socketId) {
      return {
        room,
        side: 'black',
      };
    }

    if (room.status === 'playing' || (room.players.white && room.players.black)) {
      throw new Error('Room is full');
    }

    if (!room.players.white) {
      room.players.white = socketId;
      room.status = room.players.black ? 'ready' : 'waiting';

      return {
        room,
        side: 'white',
      };
    }

    room.players.black = socketId;
    room.status = 'playing';

    return {
      room,
      side: 'black',
    };
  }

  leaveRoom(socketId) {
    const roomEntry = this._findRoomBySocketId(socketId);
    if (!roomEntry) return null;

    const [roomId, room] = roomEntry;
    const side = room.players.white === socketId ? 'white' : 'black';
    room.players[side] = null;

    const remainingSide = room.players.white ? 'white' : room.players.black ? 'black' : null;
    const remainingSocketId = remainingSide ? room.players[remainingSide] : null;

    if (!remainingSocketId) {
      this.rooms.delete(roomId);
      return {
        roomId,
        side,
        room: null,
        remainingSocketId: null,
      };
    }

    room.status = 'waiting';

    return {
      roomId,
      side,
      room,
      remainingSocketId,
    };
  }

  getPublicRoom(room) {
    if (!room) return null;

    return {
      id: room.id,
      players: {
        white: Boolean(room.players.white),
        black: Boolean(room.players.black),
      },
      status: room.status,
    };
  }

  getRoomById(roomId) {
    return this.rooms.get(this._normalizeRoomId(roomId)) || null;
  }

  getSideForSocket(room, socketId) {
    if (!room) return null;
    if (room.players.white === socketId) return 'white';
    if (room.players.black === socketId) return 'black';

    return null;
  }

  getOpponentSocketId(room, socketId) {
    const side = this.getSideForSocket(room, socketId);
    if (!side) return null;

    return side === 'white' ? room.players.black : room.players.white;
  }

  _createRoomId() {
    let roomId = '';

    do {
      roomId = randomBytes(ROOM_ID_LENGTH)
        .toString('base64url')
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase()
        .slice(0, ROOM_ID_LENGTH)
        .padEnd(ROOM_ID_LENGTH, '0');
    } while (this.rooms.has(roomId));

    return roomId;
  }

  _normalizeRoomId(roomId) {
    return String(roomId || '')
      .trim()
      .toUpperCase();
  }

  _findRoomBySocketId(socketId) {
    return [...this.rooms.entries()].find(([, room]) => {
      return room.players.white === socketId || room.players.black === socketId;
    });
  }
}
