import { ChessEngine } from '../../models/ChessEngine.js';
import { ControllerView } from '../../view/ControllerView.js';

/**
 * ControllerGame coordinates the ChessEngine (pure logic) and ControllerView (Pixi rendering).
 * It also owns the turn system and simple bot integration for now.
 */
export class ControllerGame {
  constructor(stage, { playerSide = 'white', botSide = 'black', botEnabled = true } = {}) {
    this.stage = stage;

    this.playerSide = playerSide;
    this.botSide = botSide;
    this.botEnabled = botEnabled;

    this.currentTurn = 'white';
    this.selectedFigure = null;
    this.activeMoveCells = [];
    this._isFinished = false;

    this.onGameEnd = () => {};
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
    this.currentTurn = 'white';
    this._isFinished = false;
    this._clearSelection();
  }

  /**
   * Attempt to make a move from a given figure to a given target cell.
   * Used both by human player (via clicks) and bot.
   */
  makeMove(fromId, toId, side) {
    if (this._isFinished) return { success: false, reason: 'game_finished' };
    if (side !== this.currentTurn) return { success: false, reason: 'not_your_turn' };

    if (!this.ChessEngine.isMoveLegal(fromId, toId, side)) {
      return { success: false, reason: 'illegal_move' };
    }

    const result = this.ChessEngine.makeMove(fromId, toId, side);
    if (!result.success) return result;

    this._syncViewWithModel();
    this._handlePostMove(side, result.status);

    return result;
  }

  /**
   * Simple bot that picks a random legal move.
   */
  botMove() {
    if (!this.botEnabled || this.currentTurn !== this.botSide) return;

    const allMoves = this._getAllLegalMovesForSide(this.botSide);
    if (allMoves.length === 0) return;

    const randomIndex = Math.floor(Math.random() * allMoves.length);
    const { fromId, toId } = allMoves[randomIndex];

    this.makeMove(fromId, toId, this.botSide);
  }

  endGame(type, winner) {
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
    if (this._isFinished) return;

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
    if (this._isFinished) return;
    if (!this.selectedFigure) return;

    const fromId = this.selectedFigure.cellView.id;
    const toId = cellView.id;

    const result = this.makeMove(fromId, toId, this.currentTurn);
    if (!result.success) {
      this._clearSelection();
      return;
    }

    if (this.botEnabled && this.currentTurn === this.botSide) {
      this.botMove();
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

  _getAllLegalMovesForSide(side) {
    const moves = [];

    this.ChessEngine.cells.forEach((cell) => {
      if (!cell.figure || cell.figure.side !== side) return;

      const legalTargets = this.ChessEngine.getAvailableMoves(
        {
          figureName: cell.figure.name,
          side,
          cellView: { id: cell.id },
        },
        side,
      );

      legalTargets.forEach((target) => {
        moves.push({
          fromId: cell.id,
          toId: target.id,
        });
      });
    });

    return moves;
  }
}
