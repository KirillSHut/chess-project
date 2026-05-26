import { randomBytes } from 'node:crypto';
import { ChessEngine } from '../../../shared/chess/ChessEngine.js';

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
      disconnected: {
        white: false,
        black: false,
      },
      engine: new ChessEngine(),
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

    if (
      room.status === 'playing' ||
      room.status === 'finished' ||
      room.status === 'ended' ||
      (room.players.white && room.players.black)
    ) {
      throw new Error('Room is full');
    }

    if (!room.players.white && !room.disconnected.white) {
      room.players.white = socketId;
      room.status = room.players.black ? 'ready' : 'waiting';

      return {
        room,
        side: 'white',
      };
    }

    room.players.black = socketId;
    room.disconnected.black = false;
    room.status = 'playing';

    return {
      room,
      side: 'black',
    };
  }

  leaveRoom(socketId, roomId = null) {
    const roomEntry = roomId ? this._getRoomEntryById(roomId) : this._findRoomBySocketId(socketId);
    if (!roomEntry) return null;

    const [resolvedRoomId, room] = roomEntry;
    const side =
      room.players.white === socketId ? 'white' : room.players.black === socketId ? 'black' : null;
    if (!side) return null;

    room.players[side] = null;
    room.disconnected[side] = false;

    const remainingSide = room.players.white ? 'white' : room.players.black ? 'black' : null;
    const remainingSocketId = remainingSide ? room.players[remainingSide] : null;

    if (!remainingSocketId) {
      this.rooms.delete(resolvedRoomId);
      return {
        roomId: resolvedRoomId,
        side,
        room: null,
        remainingSocketId: null,
      };
    }

    room.status = room.status === 'playing' || room.status === 'finished' ? 'ended' : 'waiting';

    return {
      roomId: resolvedRoomId,
      side,
      room,
      remainingSocketId,
    };
  }

  disconnectPlayer(socketId) {
    const roomEntry = this._findRoomBySocketId(socketId);
    if (!roomEntry) return null;

    const [roomId, room] = roomEntry;
    const side = this.getSideForSocket(room, socketId);
    if (!side) return null;

    if (room.status !== 'playing') {
      return this.leaveRoom(socketId, roomId);
    }

    room.players[side] = null;
    room.disconnected[side] = true;

    return {
      roomId,
      side,
      room,
      remainingSocketId: this.getConnectedOpponentSocketId(room, side),
      reconnectable: true,
    };
  }

  rejoinRoom(socketId, roomId, side) {
    const normalizedRoomId = this._normalizeRoomId(roomId);
    const normalizedSide = this._normalizeSide(side);
    const room = this.rooms.get(normalizedRoomId);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'playing') {
      throw new Error('Game is not active');
    }

    if (!normalizedSide) {
      throw new Error('Invalid side');
    }

    if (room.players[normalizedSide] && room.players[normalizedSide] !== socketId) {
      throw new Error('Side is already connected');
    }

    if (!room.disconnected[normalizedSide] && room.players[normalizedSide] !== socketId) {
      throw new Error('Side is not reconnectable');
    }

    room.players[normalizedSide] = socketId;
    room.disconnected[normalizedSide] = false;

    return {
      room,
      side: normalizedSide,
    };
  }

  closeRoom(roomId) {
    const roomEntry = this._getRoomEntryById(roomId);
    if (!roomEntry) return null;

    const [resolvedRoomId, room] = roomEntry;
    const connectedSocketIds = [room.players.white, room.players.black].filter(Boolean);
    room.status = 'ended';
    this.rooms.delete(resolvedRoomId);

    return {
      roomId: resolvedRoomId,
      room,
      connectedSocketIds,
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
      disconnected: {
        white: Boolean(room.disconnected.white),
        black: Boolean(room.disconnected.black),
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

  getConnectedOpponentSocketId(room, side) {
    if (!room || (side !== 'white' && side !== 'black')) return null;

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

  _normalizeSide(side) {
    return side === 'white' || side === 'black' ? side : null;
  }

  _findRoomBySocketId(socketId) {
    return [...this.rooms.entries()].find(([, room]) => {
      return room.players.white === socketId || room.players.black === socketId;
    });
  }

  _getRoomEntryById(roomId) {
    const normalizedRoomId = this._normalizeRoomId(roomId);
    const room = this.rooms.get(normalizedRoomId);

    return room ? [normalizedRoomId, room] : null;
  }
}
