import { Assets } from 'pixi.js';
import { assetsConfig } from './configs/assetsConfig.js';
import { ControllerGame } from './controllers/game/ControllerGame.js';

export class Game {
  constructor(
    app,
    {
      botDifficulty = 'random',
      playerSide = 'white',
      botSide = 'black',
      botEnabled = true,
      onGameEnd = () => {},
    } = {},
  ) {
    this.app = app;
    this.stage = app.stage;
    this.botDifficulty = botDifficulty;
    this.playerSide = playerSide;
    this.botSide = botSide;
    this.botEnabled = botEnabled;
    this.onGameEnd = onGameEnd;

    this._isStarted = false;
    this._isFinished = false;
  }

  init() {
    this.ControllerGame = new ControllerGame(this.stage, {
      playerSide: this.playerSide,
      botSide: this.botSide,
      botEnabled: this.botEnabled,
    });

    this.ControllerGame.init();
    this.ControllerGame.onGameEnd = (result) => {
      this.endGame(result);
    };

    this.startGame();
  }

  async loadAssets() {
    await Assets.load(assetsConfig);
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

  endGame(result) {
    if (this._isFinished) return;
    this._isFinished = true;
    this.onGameEnd(result);
  }
}
