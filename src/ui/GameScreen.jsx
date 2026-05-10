import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { Game } from '../Game.js';

export function GameScreen({ difficulty, onBackToMenu }) {
  const pixiRootRef = useRef(null);

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
  }, [difficulty]);

  return (
    <main className="game-screen">
      <div className="game-toolbar">
        <button className="menu-button menu-button-compact" type="button" onClick={onBackToMenu}>
          Menu
        </button>
        <span className="game-mode">Bot: {difficulty}</span>
      </div>
      <div className="pixi-stage" ref={pixiRootRef} />
    </main>
  );
}
