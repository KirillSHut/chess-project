import { Assets } from 'pixi.js';
import { assetsConfig } from './configs/assetsConfig.js';
import { ControllerGame } from './controllers/game/ControllerGame.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.stage = app.stage;

    this._isStarted = false;
    this._isFinished = false;
  }

  init() {
    this.ControllerGame = new ControllerGame(this.stage, {
      playerSide: 'white',
      botSide: 'black',
      botEnabled: true,
    });

    this.ControllerGame.init();
    this.ControllerGame.onGameEnd = ({ status, winnerSide }) => {
      this.endGame(status, winnerSide);
    };

    this.startGame();
  }

  async loadAssets() {
    await Assets.load(assetsConfig)
  }

  /**
   * PUBLIC GAME FLOW API
   * --------------------
   */

  startGame() {
    if (this._isStarted) return;
    this._isStarted = true;
    this._isFinished = false;

    this.ControllerGame.startGame();
  }

  makeMove(fromId, toId, side) {
    if (this._isFinished) {
      return { success: false, reason: 'game_finished' };
    }

    return this.ControllerGame.makeMove(fromId, toId, side);
  }

  botMove() {
    if (this._isFinished) return;
    this.ControllerGame.botMove();
  }

  endGame(status, winnerSide) {
    if (this._isFinished) return;
    this._isFinished = true;

    // For now we just log; UI/online sync can hook into this later.
    console.log('Game ended:', { status, winnerSide });
  }
}
