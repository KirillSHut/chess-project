import { Assets } from 'pixi.js';
import { assetsConfig } from './configs/assetsConfig.js';
import { ControllerGame } from './controllers/game/ControllerGame.js';

export class Game {
  constructor(
    app,
    {
      mode = 'human-vs-bot',
      botDifficulty = 'random',
      botDifficulties = null,
      playerSide = 'white',
      botSide = 'black',
      botEnabled = true,
      initialState = null,
      onGameEnd = () => {},
      onBotThinkingChange = () => {},
      onBotMoveMetrics = () => {},
      onMultiplayerMove = () => {},
    } = {},
  ) {
    this.app = app;
    this.stage = app.stage;
    this.mode = mode;
    this.botDifficulty = botDifficulty;
    this.botDifficulties = botDifficulties;
    this.playerSide = playerSide;
    this.botSide = botSide;
    this.botEnabled = botEnabled;
    this.initialState = initialState;
    this.onGameEnd = onGameEnd;
    this.onBotThinkingChange = onBotThinkingChange;
    this.onBotMoveMetrics = onBotMoveMetrics;
    this.onMultiplayerMove = onMultiplayerMove;

    this._isStarted = false;
    this._isFinished = false;
  }

  init() {
    this.ControllerGame = new ControllerGame(this.stage, {
      mode: this.mode,
      playerSide: this.playerSide,
      botSide: this.botSide,
      botEnabled: this.botEnabled,
      botDifficulty: this.botDifficulty,
      botDifficulties: this.botDifficulties,
      initialState: this.initialState,
    });

    this.ControllerGame.init();
    this.ControllerGame.onGameEnd = (result) => {
      this.endGame(result);
    };
    this.ControllerGame.onBotThinkingChange = this.onBotThinkingChange;
    this.ControllerGame.onBotMoveMetrics = this.onBotMoveMetrics;
    this.ControllerGame.onMultiplayerMove = this.onMultiplayerMove;

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
    this.ControllerGame.scheduleBotMove();
  }

  getBotMoveMetrics() {
    return this.ControllerGame.getBotMoveMetrics();
  }

  applyConfirmedMultiplayerMove(move) {
    if (this._isFinished) {
      return { success: false, reason: 'game_finished' };
    }

    return this.ControllerGame.applyConfirmedMultiplayerMove(move);
  }

  loadMultiplayerSnapshot(snapshot, meta = {}) {
    return this.ControllerGame.loadMultiplayerSnapshot(snapshot, meta);
  }

  handleInvalidMultiplayerMove() {
    this.ControllerGame.handleInvalidMultiplayerMove();
  }

  stopMultiplayerSession() {
    this._isFinished = true;
    this.ControllerGame?.stopMultiplayerSession();
  }

  endGame(result) {
    if (this._isFinished) return;
    this._isFinished = true;
    this.onGameEnd(result);
  }

  dispose() {
    this.ControllerGame?.cancelPendingBotTurn();
  }
}
