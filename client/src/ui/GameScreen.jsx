import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { Game } from '../Game.js';
import {
  disconnectSocket,
  leaveRoom,
  sendMove,
  subscribeToRoomEvents,
} from '../services/socketService.js';
import { clearMultiplayerSession } from '../services/multiplayerSessionStorage.js';
import {
  clearLocalBotGameSession,
  saveLocalBotGameSession,
} from '../services/localBotGameSessionStorage.js';
import { AiMetricsPanel } from './AiMetricsPanel.jsx';
import { EndGameOverlay } from './EndGameOverlay.jsx';

const BOARD_WORLD_CENTER_X = 1170;
const BOARD_WORLD_CENTER_Y = 540;
const BOARD_WORLD_SIZE = 870;

export function GameScreen({
  mode,
  roomId,
  playerSide,
  initialState,
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
  const [gameInitialState, setGameInitialState] = useState(initialState);
  const hasLeftRoomRef = useRef(false);

  const handleGameEnd = (result) => {
    if (mode === 'human-vs-bot') {
      clearLocalBotGameSession();
    } else if (mode === 'multiplayer') {
      clearMultiplayerSession();
    }

    setGameResult(result);
  };

  useEffect(() => {
    const pixiRoot = pixiRootRef.current;
    const app = new Application();
    let game = null;
    let isMounted = true;
    let isPixiReady = false;
    let resizeObserver = null;
    let unsubscribeFromRoomEvents = null;
    hasLeftRoomRef.current = false;

    if (mode === 'multiplayer') {
      setMultiplayerStatus('Connected');
      setMultiplayerExitReason(null);
    }

    const resize = () => {
      if (!pixiRoot || !isPixiReady) return;

      const { width, height } = pixiRoot.getBoundingClientRect();
      const rendererWidth = Math.max(1, Math.floor(width));
      const rendererHeight = Math.max(1, Math.floor(height));
      const scale = Math.min(rendererWidth / BOARD_WORLD_SIZE, rendererHeight / BOARD_WORLD_SIZE);

      app.renderer.resize(rendererWidth, rendererHeight);
      app.stage.scale.set(scale);
      app.stage.x = rendererWidth / 2 - BOARD_WORLD_CENTER_X * scale;
      app.stage.y = rendererHeight / 2 - BOARD_WORLD_CENTER_Y * scale;
    };

    const bootGame = async () => {
      await app.init({
        antialias: true,
        background: '#10110f',
        height: 1,
        width: 1,
      });
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
        initialState: gameInitialState,
        botEnabled: mode !== 'multiplayer',
        onGameEnd: handleGameEnd,
        onBotThinkingChange: setIsBotThinking,
        onBotMoveMetrics: setLastBotMoveMetrics,
        onLocalBotGameChange: saveLocalBotGameSession,
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
            if (move.status === 'checkmate' || move.status === 'stalemate') {
              clearMultiplayerSession();
            }
          },
          onInvalidMove: ({ message }) => {
            game?.handleInvalidMultiplayerMove();
            setMultiplayerStatus(message || 'Invalid move');
          },
          onOpponentLeft: () => {
            game?.stopMultiplayerSession();
            setMultiplayerStatus('Opponent left the game');
            setMultiplayerExitReason('left');
            clearMultiplayerSession();
          },
          onOpponentDisconnected: () => {
            game?.setMultiplayerPaused(true);
            setMultiplayerStatus('Opponent disconnected. Waiting for reconnect...');
            setMultiplayerExitReason(null);
          },
          onOpponentReconnected: () => {
            game?.setMultiplayerPaused(false);
            setMultiplayerStatus('Connected');
            setMultiplayerExitReason(null);
          },
          onRoomClosed: () => {
            game?.stopMultiplayerSession();
            setMultiplayerStatus('Room closed');
            setMultiplayerExitReason('closed');
            clearMultiplayerSession();
          },
          onRoomError: ({ code, message }) => {
            game?.handleInvalidMultiplayerMove();
            setMultiplayerStatus(
              code === 'opponent_disconnected' ? 'Opponent disconnected' : message || 'Room error',
            );
          },
        });
      }

      if (window.ResizeObserver) {
        resizeObserver = new window.ResizeObserver(resize);
        resizeObserver.observe(pixiRoot);
      }

      window.addEventListener('resize', resize);
      window.addEventListener('orientationchange', resize);
      resize();
    };

    bootGame();

    return () => {
      isMounted = false;
      game?.dispose();
      unsubscribeFromRoomEvents?.();
      if (mode === 'multiplayer') {
        disconnectSocket();
      }
      setIsBotThinking(false);
      setLastBotMoveMetrics(null);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      if (isPixiReady) {
        app.destroy(true);
      }
    };
  }, [botDifficulties, gameInitialState, mode, playerSide, roomId, sessionId]);

  const restartGame = () => {
    setGameResult(null);
    setIsBotThinking(false);
    setLastBotMoveMetrics(null);
    setMultiplayerStatus('Connected');
    setMultiplayerExitReason(null);
    if (mode === 'human-vs-bot') {
      clearLocalBotGameSession();
      setGameInitialState(null);
    }
    setSessionId((currentSessionId) => currentSessionId + 1);
  };

  const leaveMultiplayerRoom = () => {
    if (hasLeftRoomRef.current) return;

    leaveRoom(roomId);
    clearMultiplayerSession();
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

    if (mode === 'human-vs-bot') {
      clearLocalBotGameSession();
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
      <section className="game-layout" aria-label="Chess board">
        <div className="game-board-area">
          <div className="pixi-stage" ref={pixiRootRef} />
        </div>

        <aside className="game-side-panel" aria-label="Game controls and status">
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
        </aside>
      </section>
      {gameResult && (
        <EndGameOverlay
          result={gameResult}
          viewerSide={playerSide}
          onRestart={restartGame}
          onBackToMenu={mode === 'multiplayer' ? backToMenuFromMultiplayer : onBackToMenu}
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
              {multiplayerExitReason === 'left' ? 'Opponent left the game' : 'Room closed'}
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
