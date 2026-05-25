import { useEffect, useRef, useState } from 'react';
import {
  connectSocket,
  createRoom,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  subscribeToRoomEvents,
} from '../services/socketService.js';

const connectionLabels = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Connection error',
};

export function MultiplayerScreen({ onBack, onGameStart }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [playerSide, setPlayerSide] = useState(null);
  const [roomStatus, setRoomStatus] = useState('No room');
  const [roomError, setRoomError] = useState('');
  const isStartingGameRef = useRef(false);

  const resetRoomState = () => {
    setRoomId('');
    setPlayerSide(null);
    setRoomStatus('No room');
    setRoomError('');
  };

  useEffect(() => {
    setConnectionStatus('connecting');

    const socket = connectSocket();

    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleConnectError = () => setConnectionStatus('error');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    const unsubscribeFromRoomEvents = subscribeToRoomEvents({
      onRoomCreated: ({ roomId: createdRoomId, side }) => {
        setRoomId(createdRoomId);
        setJoinRoomId(createdRoomId);
        setPlayerSide(side);
        setRoomStatus('Waiting for opponent');
        setRoomError('');
      },
      onRoomJoined: ({ roomId: joinedRoomId, side, room }) => {
        setRoomId(joinedRoomId);
        setJoinRoomId(joinedRoomId);
        setPlayerSide(side);
        setRoomStatus(room?.status === 'playing' ? `Joined as ${side}` : 'Waiting for opponent');
        setRoomError('');
      },
      onPlayerJoined: ({ room }) => {
        setRoomStatus(room?.status === 'playing' ? 'Opponent joined' : 'Waiting for opponent');
        setRoomError('');
      },
      onRoomLeft: () => {
        resetRoomState();
      },
      onRoomError: ({ code, message }) => {
        setRoomError(message || 'Room error');
        setRoomStatus(code === 'opponent_disconnected' ? 'Opponent disconnected' : 'Error');
      },
      onGameStarted: ({ roomId: startedRoomId, playerSide: assignedSide, players, gameState }) => {
        const side = assignedSide || (players?.white === socket.id ? 'white' : 'black');
        isStartingGameRef.current = true;

        onGameStart({
          mode: 'multiplayer',
          roomId: startedRoomId,
          playerSide: side,
          opponentConnected: true,
          initialState: gameState,
          botDifficulties: {},
        });
      },
    });

    if (socket.connected) {
      setConnectionStatus('connected');
    }

    return () => {
      if (!isStartingGameRef.current) {
        leaveRoom();
        disconnectSocket();
      }

      unsubscribeFromRoomEvents();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  const handleCreateRoom = () => {
    if (connectionStatus !== 'connected') return;

    setRoomError('');
    setRoomStatus('Creating room');
    createRoom();
  };

  const handleJoinRoom = () => {
    if (connectionStatus !== 'connected' || !joinRoomId.trim()) return;

    setRoomError('');
    setRoomStatus('Joining room');
    joinRoom(joinRoomId);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const hasRoom = Boolean(roomId);

  return (
    <section className="menu-panel" aria-labelledby="multiplayer-title">
      <p className="menu-kicker">Multiplayer</p>
      <h1 id="multiplayer-title">Room setup</h1>
      <p className="menu-copy">
        Create a room as White or join an existing room as Black. Move synchronization comes next.
      </p>

      <div className="connection-status" data-status={connectionStatus}>
        <span>Server</span>
        <strong>{connectionLabels[connectionStatus]}</strong>
      </div>

      <div className="multiplayer-room-panel">
        <button
          className="menu-button menu-button-primary"
          type="button"
          disabled={connectionStatus !== 'connected' || hasRoom}
          onClick={handleCreateRoom}
        >
          Create Room
        </button>

        <label className="room-input-field">
          <span>Join room ID</span>
          <input
            maxLength="6"
            placeholder="ABCD12"
            value={joinRoomId}
            onChange={(event) => setJoinRoomId(event.target.value.toUpperCase())}
          />
        </label>

        <button
          className="menu-button"
          type="button"
          disabled={connectionStatus !== 'connected' || hasRoom || !joinRoomId.trim()}
          onClick={handleJoinRoom}
        >
          Join Room
        </button>
      </div>

      <dl className="room-status-list">
        <div>
          <dt>Room ID</dt>
          <dd>{roomId || '-'}</dd>
        </div>
        <div>
          <dt>Side</dt>
          <dd>{playerSide ? formatSide(playerSide) : '-'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{roomStatus}</dd>
        </div>
      </dl>

      {roomError && <p className="room-error">{roomError}</p>}

      {hasRoom && (
        <button className="menu-button" type="button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      )}

      <button className="menu-button menu-button-secondary" type="button" onClick={onBack}>
        Back to menu
      </button>
    </section>
  );
}

function formatSide(side) {
  return `${side[0].toUpperCase()}${side.slice(1)}`;
}
