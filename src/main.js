import { Application} from "pixi.js";
import { Game } from './Game.js';

(async () => {
  const app = new Application();

  await app.init({ background: "#1099bb", resizeTo: window });

  document.getElementById("pixi-container").appendChild(app.canvas);

  globalThis.__PIXI_APP__ = app;

  const game = new Game(app);

  await game.loadAssets();
  game.init();

  // Listen for animate update
  app.ticker.add((time) => {});

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Коэффициент масштaба
    const scale = Math.min(
      w / 2340,
      h / 1080
    );

    // Применяем масштабы
    app.stage.scale.set(scale);

    // Центрируем
    app.stage.x = (w - 2340 * scale) / 2;
    app.stage.y = (h - 1080 * scale) / 2;
  }

  window.addEventListener('resize', resize);
  resize();
})();
