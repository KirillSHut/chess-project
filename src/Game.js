import { Assets } from 'pixi.js';
import { assetsConfig } from './configs/assetsConfig.js';
import { ControllerBoard } from './controllers/board/ControllerBoard.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.stage = app.stage;

    this._isStarted = false;
    this._isFinished = false;
  }

  init() {
    this.ControllerBoard = new ControllerBoard(this.stage, {
      playerSide: 'white',
      botSide: 'black',
      botEnabled: true,
    });

    this.ControllerBoard.init();
    this.ControllerBoard.onGameEnd = ({ status, winnerSide }) => {
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

    this.ControllerBoard.startGame();
  }

  makeMove(fromId, toId, side) {
    if (this._isFinished) {
      return { success: false, reason: 'game_finished' };
    }

    return this.ControllerBoard.makeMove(fromId, toId, side);
  }

  botMove() {
    if (this._isFinished) return;
    this.ControllerBoard.botMove();
  }

  endGame(status, winnerSide) {
    if (this._isFinished) return;
    this._isFinished = true;

    // For now we just log; UI/online sync can hook into this later.
    console.log('Game ended:', { status, winnerSide });
  }
}
