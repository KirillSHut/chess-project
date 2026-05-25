import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { Game } from '../Game.js';
import {
  disconnectSocket,
  leaveRoom,
  sendMove,
  subscribeToRoomEvents,
} from '../services/socketService.js';
import { AiMetricsPanel } from './AiMetricsPanel.jsx';
import { EndGameOverlay } from './EndGameOverlay.jsx';

export function GameScreen({
  mode,
  roomId,
  playerSide,
  botDifficulties,
  onBackToMenu,
  onBackToMultiplayer,
}) {
  const pixiRootRef = useRef(null);
  const [gameResult, setGameResult] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [lastBotMoveMetrics, setLastBotMoveMetrics] = useState(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState('Connected');
  const [multiplayerExitReason, setMultiplayerExitReason] = useState(null);
  const [sessionId, setSessionId] = useState(0);
  const hasLeftRoomRef = useRef(false);

  useEffect(() => {
    const pixiRoot = pixiRootRef.current;
    const app = new Application();
    let game = null;
    let isMounted = true;
    let isPixiReady = false;
    let unsubscribeFromRoomEvents = null;
    hasLeftRoomRef.current = false;

    if (mode === 'multiplayer') {
      setMultiplayerStatus('Connected');
      setMultiplayerExitReason(null);
    }

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(w / 2340, h / 1080);

      app.stage.scale.set(scale);
      app.stage.x = (w - 2340 * scale) / 2;
      app.stage.y = (h - 1080 * scale) / 2;
    };

    const bootGame = async () => {
      await app.init({ background: '#1099bb', resizeTo: window });
      isPixiReady = true;

      if (!isMounted || !pixiRoot) {
        app.destroy(true);
        return;
      }

      pixiRoot.appendChild(app.canvas);

      game = new Game(app, {
        mode,
        botDifficulties,
        playerSide,
        botEnabled: mode !== 'multiplayer',
        onGameEnd: setGameResult,
        onBotThinkingChange: setIsBotThinking,
        onBotMoveMetrics: setLastBotMoveMetrics,
        onMultiplayerMove: ({ fromId, toId, promotionTo }) => {
          if (mode !== 'multiplayer') return;

          setMultiplayerStatus('Move pending');
          sendMove({
            roomId,
            fromId,
            toId,
            promotionTo,
          });
        },
      });

      await game.loadAssets();

      if (!isMounted) {
        app.destroy(true);
        return;
      }

      game.init();
      if (mode === 'multiplayer') {
        unsubscribeFromRoomEvents = subscribeToRoomEvents({
          onMoveApplied: (move) => {
            const result = game?.applyConfirmedMultiplayerMove(move);

            if (result && !result.success) {
              console.log(`Failed to apply confirmed move: ${result.reason}`);
              return;
            }

            setMultiplayerStatus(
              move.status === 'checkmate' || move.status === 'stalemate'
                ? 'Game over'
                : 'Connected',
            );
          },
          onInvalidMove: ({ message }) => {
            game?.handleInvalidMultiplayerMove();
            setMultiplayerStatus(message || 'Invalid move');
          },
          onOpponentLeft: () => {
            game?.stopMultiplayerSession();
            setMultiplayerStatus('Opponent left the game');
            setMultiplayerExitReason('left');
          },
          onOpponentDisconnected: () => {
            game?.stopMultiplayerSession();
            setMultiplayerStatus('Opponent disconnected');
            setMultiplayerExitReason('disconnected');
          },
          onRoomError: ({ code, message }) => {
            game?.handleInvalidMultiplayerMove();
            setMultiplayerStatus(
              code === 'opponent_disconnected' ? 'Opponent disconnected' : message || 'Room error',
            );
          },
        });
      }

      window.addEventListener('resize', resize);
      resize();
    };

    bootGame();

    return () => {
      isMounted = false;
      game?.dispose();
      unsubscribeFromRoomEvents?.();
      if (mode === 'multiplayer') {
        if (!hasLeftRoomRef.current) {
          leaveRoom(roomId);
          hasLeftRoomRef.current = true;
        }
        disconnectSocket();
      }
      setIsBotThinking(false);
      setLastBotMoveMetrics(null);
      window.removeEventListener('resize', resize);
      if (isPixiReady) {
        app.destroy(true);
      }
    };
  }, [botDifficulties, mode, playerSide, roomId, sessionId]);

  const restartGame = () => {
    setGameResult(null);
    setIsBotThinking(false);
    setLastBotMoveMetrics(null);
    setMultiplayerStatus('Connected');
    setMultiplayerExitReason(null);
    setSessionId((currentSessionId) => currentSessionId + 1);
  };

  const leaveMultiplayerRoom = () => {
    if (hasLeftRoomRef.current) return;

    leaveRoom(roomId);
    hasLeftRoomRef.current = true;
  };

  const backToMenuFromMultiplayer = () => {
    leaveMultiplayerRoom();
    disconnectSocket();
    onBackToMenu();
  };

  const backToLobbyFromMultiplayer = () => {
    leaveMultiplayerRoom();
    onBackToMultiplayer?.();
  };

  const handleToolbarMenuClick = () => {
    if (mode === 'multiplayer') {
      backToMenuFromMultiplayer();
      return;
    }

    onBackToMenu();
  };

  const modeLabel =
    mode === 'ai-vs-ai'
      ? `White: ${formatDifficulty(botDifficulties.white)} / Black: ${formatDifficulty(botDifficulties.black)}`
      : mode === 'multiplayer'
        ? `Multiplayer: ${formatSide(playerSide)}${roomId ? ` / Room ${roomId}` : ''}`
        : `Bot: ${formatDifficulty(botDifficulties.black)}`;

  return (
    <main className="game-screen">
      <div className="game-toolbar">
        <button
          className="menu-button menu-button-compact"
          type="button"
          onClick={handleToolbarMenuClick}
        >
          Menu
        </button>
        <span className="game-mode">{modeLabel}</span>
        {mode === 'multiplayer' && <span className="game-mode">{multiplayerStatus}</span>}
        {isBotThinking && <span className="thinking-status">Bot is thinking...</span>}
      </div>
      {mode !== 'multiplayer' && <AiMetricsPanel metrics={lastBotMoveMetrics} />}
      <div className="pixi-stage" ref={pixiRootRef} />
      {gameResult && (
        <EndGameOverlay
          result={gameResult}
          viewerSide={playerSide}
          onRestart={restartGame}
          onBackToMenu={onBackToMenu}
        />
      )}
      {mode === 'multiplayer' && multiplayerExitReason && (
        <section
          className="end-game-overlay"
          aria-live="polite"
          aria-labelledby="multiplayer-ended-title"
        >
          <div className="end-game-panel">
            <p className="menu-kicker">Multiplayer</p>
            <h1 id="multiplayer-ended-title">
              {multiplayerExitReason === 'left'
                ? 'Opponent left the game'
                : 'Opponent disconnected'}
            </h1>
            <div className="end-game-actions">
              <button
                className="menu-button menu-button-primary"
                type="button"
                onClick={backToLobbyFromMultiplayer}
              >
                Back To Multiplayer Lobby
              </button>
              <button
                className="menu-button menu-button-secondary"
                type="button"
                onClick={backToMenuFromMultiplayer}
              >
                Back To Menu
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function formatDifficulty(difficulty) {
  return `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;
}

function formatSide(side) {
  return `${side[0].toUpperCase()}${side.slice(1)}`;
}
