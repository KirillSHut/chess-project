import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { Game } from '../Game.js';
import { EndGameOverlay } from './EndGameOverlay.jsx';

export function GameScreen({ difficulty, playerSide, botSide, onBackToMenu }) {
  const pixiRootRef = useRef(null);
  const [gameResult, setGameResult] = useState(null);
  const [sessionId, setSessionId] = useState(0);

  useEffect(() => {
    const pixiRoot = pixiRootRef.current;
    const app = new Application();
    let isMounted = true;
    let isPixiReady = false;

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

      const game = new Game(app, {
        botDifficulty: difficulty,
        playerSide,
        botSide,
        onGameEnd: setGameResult,
      });

      await game.loadAssets();

      if (!isMounted) {
        app.destroy(true);
        return;
      }

      game.init();
      window.addEventListener('resize', resize);
      resize();
    };

    bootGame();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resize);
      if (isPixiReady) {
        app.destroy(true);
      }
    };
  }, [botSide, difficulty, playerSide, sessionId]);

  const restartGame = () => {
    setGameResult(null);
    setSessionId((currentSessionId) => currentSessionId + 1);
  };

  const difficultyLabel = `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;

  return (
    <main className="game-screen">
      <div className="game-toolbar">
        <button className="menu-button menu-button-compact" type="button" onClick={onBackToMenu}>
          Menu
        </button>
        <span className="game-mode">Bot: {difficultyLabel}</span>
      </div>
      <div className="pixi-stage" ref={pixiRootRef} />
      {gameResult && (
        <EndGameOverlay
          result={gameResult}
          viewerSide={playerSide}
          onRestart={restartGame}
          onBackToMenu={onBackToMenu}
        />
      )}
    </main>
  );
}
