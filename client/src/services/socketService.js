import { io } from 'socket.io-client';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:4000';

let socket = null;

export function connectSocket() {
  const activeSocket = getSocket();

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}

export function createRoom() {
  getSocket().emit('create_room');
}

export function joinRoom(roomId) {
  getSocket().emit('join_room', { roomId });
}

export function leaveRoom(roomId = null) {
  getSocket().emit('leave_room', { roomId });
}

export function sendMove({ roomId, fromId, toId, promotionTo = null }) {
  getSocket().emit('make_move', {
    roomId,
    fromId,
    toId,
    promotionTo,
  });
}

export function subscribeToRoomEvents(handlers) {
  const activeSocket = getSocket();

  if (handlers.onRoomCreated) {
    activeSocket.on('room_created', handlers.onRoomCreated);
  }

  if (handlers.onRoomJoined) {
    activeSocket.on('room_joined', handlers.onRoomJoined);
  }

  if (handlers.onPlayerJoined) {
    activeSocket.on('player_joined', handlers.onPlayerJoined);
  }

  if (handlers.onRoomLeft) {
    activeSocket.on('room_left', handlers.onRoomLeft);
  }

  if (handlers.onRoomError) {
    activeSocket.on('room_error', handlers.onRoomError);
  }

  if (handlers.onGameStarted) {
    activeSocket.on('game_started', handlers.onGameStarted);
  }

  if (handlers.onMoveApplied) {
    activeSocket.on('move_applied', handlers.onMoveApplied);
  }

  if (handlers.onInvalidMove) {
    activeSocket.on('invalid_move', handlers.onInvalidMove);
  }

  if (handlers.onOpponentLeft) {
    activeSocket.on('opponent_left', handlers.onOpponentLeft);
  }

  if (handlers.onOpponentDisconnected) {
    activeSocket.on('opponent_disconnected', handlers.onOpponentDisconnected);
  }

  return () => {
    if (handlers.onRoomCreated) {
      activeSocket.off('room_created', handlers.onRoomCreated);
    }

    if (handlers.onRoomJoined) {
      activeSocket.off('room_joined', handlers.onRoomJoined);
    }

    if (handlers.onPlayerJoined) {
      activeSocket.off('player_joined', handlers.onPlayerJoined);
    }

    if (handlers.onRoomLeft) {
      activeSocket.off('room_left', handlers.onRoomLeft);
    }

    if (handlers.onRoomError) {
      activeSocket.off('room_error', handlers.onRoomError);
    }

    if (handlers.onGameStarted) {
      activeSocket.off('game_started', handlers.onGameStarted);
    }

    if (handlers.onMoveApplied) {
      activeSocket.off('move_applied', handlers.onMoveApplied);
    }

    if (handlers.onInvalidMove) {
      activeSocket.off('invalid_move', handlers.onInvalidMove);
    }

    if (handlers.onOpponentLeft) {
      activeSocket.off('opponent_left', handlers.onOpponentLeft);
    }

    if (handlers.onOpponentDisconnected) {
      activeSocket.off('opponent_disconnected', handlers.onOpponentDisconnected);
    }
  };
}

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log(`Socket connected: ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.log(`Socket connection error: ${error.message}`);
    });
  }

  return socket;
}
