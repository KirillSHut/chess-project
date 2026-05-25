import { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '../services/socketService.js';

const connectionLabels = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Connection error',
};

export function MultiplayerScreen({ onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    setConnectionStatus('connecting');

    const socket = connectSocket();

    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleConnectError = () => setConnectionStatus('error');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      setConnectionStatus('connected');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, []);

  return (
    <section className="menu-panel" aria-labelledby="multiplayer-title">
      <p className="menu-kicker">Multiplayer</p>
      <h1 id="multiplayer-title">Coming soon</h1>
      <p className="menu-copy">
        Online play will arrive as a separate feature. The client can now connect to the multiplayer
        server foundation.
      </p>

      <div className="connection-status" data-status={connectionStatus}>
        <span>Server</span>
        <strong>{connectionLabels[connectionStatus]}</strong>
      </div>

      <button className="menu-button menu-button-secondary" type="button" onClick={onBack}>
        Back to menu
      </button>
    </section>
  );
}
