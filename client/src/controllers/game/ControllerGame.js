import { GreedyBot } from '../../ai/GreedyBot.js';
import { MinimaxBot } from '../../ai/MinimaxBot.js';
import { RandomBot } from '../../ai/RandomBot.js';
import { ChessEngine } from '../../../../shared/chess/ChessEngine.js';
import { ControllerView } from '../../view/ControllerView.js';

const BOT_THINK_DELAY_MS = 300;
const MAX_AI_VS_AI_HALF_MOVES = 200;

/**
 * ControllerGame coordinates the ChessEngine (pure logic) and ControllerView (Pixi rendering).
 * It also owns the turn system and simple bot integration for now.
 */
export class ControllerGame {
  constructor(
    stage,
    {
      mode = 'human-vs-bot',
      playerSide = 'white',
      botSide = 'black',
      botEnabled = true,
      botDifficulty = 'random',
      botDifficulties = null,
      initialState = null,
    } = {},
  ) {
    this.stage = stage;

    this.mode = mode;
    this.playerSide = playerSide;
    this.botSide = botSide;
    this.botEnabled = botEnabled;
    this.initialState = initialState;
    this.botDifficulties =
      botDifficulties ||
      (botEnabled
        ? {
            [botSide]: botDifficulty,
          }
        : {});
    this.bots = Object.fromEntries(
      Object.entries(this.botDifficulties).map(([side, difficulty]) => [
        side,
        this._createBot(difficulty),
      ]),
    );

    this.currentTurn = 'white';
    this.selectedFigure = null;
    this.activeMoveCells = [];
    this._isFinished = false;
    this._isBotThinking = false;
    this._botTurnToken = 0;
    this._pendingBotTurnId = null;
    this._isMultiplayerMovePending = false;
    this.botMoveMetrics = [];
    this.lastBotMoveMetrics = null;
    this.halfMoveCount = 0;

    this.onGameEnd = () => {};
    this.onBotThinkingChange = () => {};
    this.onBotMoveMetrics = () => {};
    this.onMultiplayerMove = () => {};
  }

  init() {
    this.ChessEngine = new ChessEngine();
    if (this.initialState) {
      this.ChessEngine.loadSnapshot(this.initialState);
      this.currentTurn = this.ChessEngine.activeSide;
    }

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
    this.currentTurn = this.ChessEngine?.activeSide || 'white';
    this._isFinished = false;
    this._isMultiplayerMovePending = false;
    this.botMoveMetrics = [];
    this.lastBotMoveMetrics = null;
    this.halfMoveCount = 0;
    this._clearSelection();

    if (this.mode === 'ai-vs-ai') {
      this._deactivateBoardInput();
      this.scheduleBotMove();
    }
  }

  /**
   * Attempt to make a move from a given figure to a given target cell.
   * Used both by human player (via clicks) and bot.
   */
  makeMove(fromId, toId, side, { promotionTo = null, source = 'local' } = {}) {
    if (this._isFinished) return { success: false, reason: 'game_finished' };
    if (this._isBotThinking && !this._isBotSide(side)) {
      return { success: false, reason: 'bot_thinking' };
    }
    if (this._isMultiplayerMovePending && source === 'local') {
      return { success: false, reason: 'move_pending' };
    }
    if (side !== this.currentTurn) return { success: false, reason: 'not_your_turn' };

    if (!this.ChessEngine.isMoveLegal(fromId, toId, side)) {
      return { success: false, reason: 'illegal_move' };
    }

    if (this.mode === 'multiplayer' && source === 'local') {
      this._isMultiplayerMovePending = true;
      this._clearSelection();
      this.onMultiplayerMove({
        fromId,
        toId,
        promotionTo,
      });
      return { success: true, pending: true };
    }

    const result = this.ChessEngine.makeMove(fromId, toId, side, { promotionTo });
    if (!result.success) return result;

    if (this.mode === 'multiplayer') {
      this._isMultiplayerMovePending = false;
    }

    this._clearSelection();
    this._syncViewWithModel();
    this._handlePostMove(side, result.status);

    return result;
  }

  applyConfirmedMultiplayerMove({
    fromId,
    toId,
    side,
    promotionTo = null,
    status = null,
    gameState = null,
  }) {
    if (this.mode !== 'multiplayer') {
      return { success: false, reason: 'not_multiplayer' };
    }

    if (this._isFinished) return { success: false, reason: 'game_finished' };

    if (gameState) {
      return this.loadMultiplayerSnapshot(gameState, { status, side });
    }

    return this.makeMove(fromId, toId, side, { promotionTo, source: 'server' });
  }

  loadMultiplayerSnapshot(snapshot, { status = null, side = null } = {}) {
    if (!this.ChessEngine) {
      return { success: false, reason: 'engine_not_ready' };
    }

    const result = this.ChessEngine.loadSnapshot(snapshot);
    if (!result.success) return result;

    this._isMultiplayerMovePending = false;
    this.currentTurn = this.ChessEngine.activeSide;
    this._clearSelection();

    if (this.ControllerView) {
      this._syncViewWithModel();
    }

    if (status === 'checkmate') {
      this.endGame('checkmate', side);
    } else if (status === 'stalemate') {
      this.endGame('stalemate', null);
    }

    return { success: true };
  }

  handleInvalidMultiplayerMove() {
    this._isMultiplayerMovePending = false;
  }

  stopMultiplayerSession() {
    this._isFinished = true;
    this._isMultiplayerMovePending = false;
    this._clearSelection();
    this._deactivateBoardInput();
  }

  scheduleBotMove() {
    const activeBot = this._getBotForSide(this.currentTurn);

    if (!this.botEnabled || this._isFinished || this._isBotThinking || !activeBot) {
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
        !this._getBotForSide(this.currentTurn)
      ) {
        return;
      }

      const activeSide = this.currentTurn;
      const currentBot = this._getBotForSide(activeSide);
      const calculationStartTime = this._getTimeMs();
      const move = currentBot.getMove(this.ChessEngine, activeSide);
      const calculationTimeMs = this._getTimeMs() - calculationStartTime;
      this._recordBotMoveMetrics(move, calculationTimeMs, activeSide, currentBot);

      if (move) {
        const { fromId, toId } = move;
        this.makeMove(fromId, toId, activeSide);
      } else {
        this._finishNoMovePosition(activeSide);
      }

      if (!this._isFinished && botTurnToken === this._botTurnToken) {
        this._setBotThinking(false);

        if (this._isBotSide(this.currentTurn)) {
          this.scheduleBotMove();
        }
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
    if (
      this._isFinished ||
      this._isBotThinking ||
      this._isMultiplayerMovePending ||
      !this._isHumanTurn()
    ) {
      return;
    }

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
    if (
      this._isFinished ||
      this._isBotThinking ||
      this._isMultiplayerMovePending ||
      !this._isHumanTurn()
    ) {
      return;
    }
    if (!this.selectedFigure) return;

    const fromId = this.selectedFigure.cellView.id;
    const toId = cellView.id;

    const result = this.makeMove(fromId, toId, this.currentTurn);
    if (!result.success) {
      this._clearSelection();
      return;
    }

    if (this._isBotSide(this.currentTurn)) {
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

    this.halfMoveCount += 1;
    if (this.mode === 'ai-vs-ai' && this.halfMoveCount >= MAX_AI_VS_AI_HALF_MOVES) {
      this.endGame('move-limit', null);
      return;
    }

    this.currentTurn = opponentSide;
    this._clearSelection();
  }

  _createGameResult(type, winner) {
    if (type === 'stalemate' || winner === null) {
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

  _recordBotMoveMetrics(move, calculationTimeMs, side, bot) {
    const searchMetrics = typeof bot.getLastMetrics === 'function' ? bot.getLastMetrics() : {};

    const metrics = {
      difficulty: this.botDifficulties[side],
      side,
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

  _finishNoMovePosition(side) {
    if (this.ChessEngine.isInCheck(side)) {
      this.endGame('checkmate', side === 'white' ? 'black' : 'white');
      return;
    }

    this.endGame('stalemate', null);
  }

  _getBotForSide(side) {
    return this.bots[side] || null;
  }

  _isBotSide(side) {
    return Boolean(this._getBotForSide(side));
  }

  _isHumanTurn() {
    return this.mode !== 'ai-vs-ai' && this.currentTurn === this.playerSide;
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
