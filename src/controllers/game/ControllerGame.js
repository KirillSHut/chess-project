import { GreedyBot } from '../../ai/GreedyBot.js';
import { MinimaxBot } from '../../ai/MinimaxBot.js';
import { RandomBot } from '../../ai/RandomBot.js';
import { ChessEngine } from '../../models/ChessEngine.js';
import { ControllerView } from '../../view/ControllerView.js';

const BOT_THINK_DELAY_MS = 100;

/**
 * ControllerGame coordinates the ChessEngine (pure logic) and ControllerView (Pixi rendering).
 * It also owns the turn system and simple bot integration for now.
 */
export class ControllerGame {
  constructor(
    stage,
    { playerSide = 'white', botSide = 'black', botEnabled = true, botDifficulty = 'random' } = {},
  ) {
    this.stage = stage;

    this.playerSide = playerSide;
    this.botSide = botSide;
    this.botEnabled = botEnabled;
    this.botDifficulty = botDifficulty;
    this.currentBot = this._createBot(botDifficulty);

    this.currentTurn = 'white';
    this.selectedFigure = null;
    this.activeMoveCells = [];
    this._isFinished = false;
    this._isBotThinking = false;
    this._botTurnToken = 0;
    this._pendingBotTurnId = null;
    this.botMoveMetrics = [];
    this.lastBotMoveMetrics = null;

    this.onGameEnd = () => {};
    this.onBotThinkingChange = () => {};
    this.onBotMoveMetrics = () => {};
  }

  init() {
    this.ChessEngine = new ChessEngine();
    this.ControllerView = new ControllerView(this.stage);

    this.ControllerView.initFigures(this.ChessEngine.cells);

    this._activateFigures();
  }

  /**
   * PUBLIC GAME FLOW API
   * --------------------
   */

  startGame() {
    this.cancelPendingBotTurn();
    this.currentTurn = 'white';
    this._isFinished = false;
    this.botMoveMetrics = [];
    this.lastBotMoveMetrics = null;
    this._clearSelection();
  }

  /**
   * Attempt to make a move from a given figure to a given target cell.
   * Used both by human player (via clicks) and bot.
   */
  makeMove(fromId, toId, side) {
    if (this._isFinished) return { success: false, reason: 'game_finished' };
    if (this._isBotThinking && side !== this.botSide) {
      return { success: false, reason: 'bot_thinking' };
    }
    if (side !== this.currentTurn) return { success: false, reason: 'not_your_turn' };

    if (!this.ChessEngine.isMoveLegal(fromId, toId, side)) {
      return { success: false, reason: 'illegal_move' };
    }

    const result = this.ChessEngine.makeMove(fromId, toId, side);
    if (!result.success) return result;

    this._clearSelection();
    this._syncViewWithModel();
    this._handlePostMove(side, result.status);

    return result;
  }

  scheduleBotMove() {
    if (
      !this.botEnabled ||
      this._isFinished ||
      this._isBotThinking ||
      this.currentTurn !== this.botSide
    ) {
      return;
    }

    const botTurnToken = ++this._botTurnToken;
    this._setBotThinking(true);
    this._clearSelection();
    this._deactivateBoardInput();

    this._pendingBotTurnId = setTimeout(() => {
      this._pendingBotTurnId = null;

      if (
        botTurnToken !== this._botTurnToken ||
        this._isFinished ||
        this.currentTurn !== this.botSide
      ) {
        return;
      }

      const calculationStartTime = this._getTimeMs();
      const move = this.currentBot.getMove(this.ChessEngine, this.botSide);
      const calculationTimeMs = this._getTimeMs() - calculationStartTime;
      this._recordBotMoveMetrics(move, calculationTimeMs);

      if (move) {
        const { fromId, toId } = move;
        this.makeMove(fromId, toId, this.botSide);
      }

      if (!this._isFinished && botTurnToken === this._botTurnToken) {
        this._setBotThinking(false);
      }
    }, BOT_THINK_DELAY_MS);
  }

  cancelPendingBotTurn() {
    this._botTurnToken += 1;
    if (this._pendingBotTurnId !== null) {
      clearTimeout(this._pendingBotTurnId);
      this._pendingBotTurnId = null;
    }
    this._setBotThinking(false);
  }

  endGame(type, winner) {
    this.cancelPendingBotTurn();
    this._isFinished = true;
    this._clearSelection();
    this._deactivateBoardInput();

    if (typeof this.onGameEnd === 'function') {
      this.onGameEnd(this._createGameResult(type, winner));
    }
  }

  /**
   * INTERNAL CONTROLLER LOGIC
   * -------------------------
   */

  _activateFigures() {
    this.ControllerView.figures.forEach((figure) => {
      figure.activate();
      figure.onClick = this._onFigureClick.bind(this);
    });

    this.ControllerView.cells.forEach((cellView) => {
      cellView.onClick = this._onCellClick.bind(this);
    });
  }

  _onFigureClick(figure) {
    if (this._isFinished || this._isBotThinking) return;

    if (figure.side !== this.currentTurn) {
      if (this.selectedFigure) {
        this._onCellClick(figure.cellView);
      }
      return;
    }

    if (this.selectedFigure && this.selectedFigure === figure) {
      this._clearSelection();
      return;
    }

    this._clearSelection();

    this.selectedFigure = figure;

    const availableMoves = this.ChessEngine.getAvailableMoves(
      {
        figureName: figure.figureName,
        side: figure.side,
        cellView: figure.cellView,
      },
      this.currentTurn,
    );

    const cellViews = this.ControllerView.getCells(availableMoves) || [];

    cellViews.forEach((cellView) => {
      cellView.activate();
      this.activeMoveCells.push(cellView);
    });
  }

  _onCellClick(cellView) {
    if (this._isFinished || this._isBotThinking) return;
    if (!this.selectedFigure) return;

    const fromId = this.selectedFigure.cellView.id;
    const toId = cellView.id;

    const result = this.makeMove(fromId, toId, this.currentTurn);
    if (!result.success) {
      this._clearSelection();
      return;
    }

    if (this.botEnabled && this.currentTurn === this.botSide) {
      this.scheduleBotMove();
    }
  }

  _clearSelection() {
    this.selectedFigure = null;
    this.activeMoveCells.forEach((cellView) => {
      cellView.deactivate();
    });
    this.activeMoveCells = [];
  }

  _syncViewWithModel() {
    // Remove all existing figure views
    this.ControllerView.clearFigures();
    this.ControllerView.initFigures(this.ChessEngine.cells);
    this._activateFigures();
  }

  _handlePostMove(side, status) {
    const opponentSide = side === 'white' ? 'black' : 'white';

    if (status === 'checkmate') {
      this.endGame('checkmate', side);
      return;
    }

    if (status === 'stalemate') {
      this.endGame('stalemate', null);
      return;
    }

    this.currentTurn = opponentSide;
    this._clearSelection();
  }

  _createGameResult(type, winner) {
    if (type === 'stalemate') {
      return {
        type,
        winner: null,
        loser: null,
        isDraw: true,
      };
    }

    return {
      type,
      winner,
      loser: winner === null ? null : winner === 'white' ? 'black' : 'white',
      isDraw: false,
    };
  }

  _deactivateBoardInput() {
    this.ControllerView.figures.forEach((figure) => {
      figure.deactivate();
    });
    this.ControllerView.cells.forEach((cellView) => {
      cellView.deactivate();
    });
  }

  _setBotThinking(isThinking) {
    if (this._isBotThinking === isThinking) return;

    this._isBotThinking = isThinking;
    this.onBotThinkingChange(isThinking);
  }

  getBotMoveMetrics() {
    return this.botMoveMetrics.map((metrics) => ({
      ...metrics,
      selectedMove: metrics.selectedMove ? { ...metrics.selectedMove } : null,
    }));
  }

  _recordBotMoveMetrics(move, calculationTimeMs) {
    const searchMetrics =
      typeof this.currentBot.getLastMetrics === 'function' ? this.currentBot.getLastMetrics() : {};

    const metrics = {
      difficulty: this.botDifficulty,
      side: this.botSide,
      calculationTimeMs,
      selectedMove: move ? { ...move } : null,
      searchDepth: searchMetrics.depth ?? null,
      ...searchMetrics,
    };

    this.lastBotMoveMetrics = metrics;
    this.botMoveMetrics.push(metrics);
    this.onBotMoveMetrics(metrics);
  }

  _getTimeMs() {
    return globalThis.performance?.now ? globalThis.performance.now() : Date.now();
  }

  _createBot(botDifficulty) {
    if (botDifficulty === 'easy') {
      return new GreedyBot();
    }

    if (botDifficulty === 'medium') {
      return new MinimaxBot(2);
    }

    if (botDifficulty === 'hard') {
      return new MinimaxBot(3);
    }

    return new RandomBot();
  }
}
