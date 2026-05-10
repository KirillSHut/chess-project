import { BoardModel } from '../../models/BoardModel.js';
import { BoardView } from '../../view/BoardView.js';

/**
 * ControllerBoard coordinates the BoardModel (pure logic) and BoardView (Pixi rendering).
 * It also owns the turn system and simple bot integration for now.
 */
export class ControllerBoard {
  constructor(stage, { playerSide = 'white', botSide = 'black', botEnabled = true } = {}) {
    this.stage = stage;

    this.playerSide = playerSide;
    this.botSide = botSide;
    this.botEnabled = botEnabled;

    this.currentTurn = 'white';
    this.selectedFigure = null;
    this.activeMoveCells = [];

    this.onGameEnd = () => {};
  }

  init() {
    this.BoardModel = new BoardModel();
    this.BoardView = new BoardView(this.stage);

    this.BoardView.initFigures(this.BoardModel.cells);

    this._activateFigures();
  }

  /**
   * PUBLIC GAME FLOW API
   * --------------------
   */

  startGame() {
    this.currentTurn = 'white';
    this._clearSelection();
  }

  /**
   * Attempt to make a move from a given figure to a given target cell.
   * Used both by human player (via clicks) and bot.
   */
  makeMove(fromId, toId, side) {
    if (side !== this.currentTurn) return { success: false, reason: 'not_your_turn' };

    if (!this.BoardModel.isMoveLegal(fromId, toId, side)) {
      return { success: false, reason: 'illegal_move' };
    }

    const result = this.BoardModel.makeMove(fromId, toId, side);
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

  endGame(status, winnerSide) {
    if (typeof this.onGameEnd === 'function') {
      this.onGameEnd({ status, winnerSide });
    }
  }

  /**
   * INTERNAL CONTROLLER LOGIC
   * -------------------------
   */

  _activateFigures() {
    this.BoardView.figures.forEach(figure => {
      figure.activate();
      figure.onClick = this._onFigureClick.bind(this);
    });

    this.BoardView.cells.forEach(cellView => {
      cellView.onClick = this._onCellClick.bind(this);
    });
  }

  _onFigureClick(figure) {
    if (figure.side !== this.currentTurn) {
      if(this.selectedFigure) {
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

    const availableMoves = this.BoardModel.getAvailableMoves(
      {
        figureName: figure.figureName,
        side: figure.side,
        cellView: figure.cellView,
      },
      this.currentTurn,
    );

    const cellViews = this.BoardView.getCells(availableMoves) || [];

    cellViews.forEach(cellView => {
      cellView.activate();
      this.activeMoveCells.push(cellView);
    });
  }

  _onCellClick(cellView) {
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
    this.activeMoveCells.forEach(cellView => {
      cellView.deactivate();
    });
    this.activeMoveCells = [];
  }

  _syncViewWithModel() {
    // Remove all existing figure views
    this.BoardView.clearFigures();
    this.BoardView.initFigures(this.BoardModel.cells);
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

  _getAllLegalMovesForSide(side) {
    const moves = [];

    this.BoardModel.cells.forEach(cell => {
      if (!cell.figure || cell.figure.side !== side) return;

      const legalTargets = this.BoardModel.getAvailableMoves(
        {
          figureName: cell.figure.name,
          side,
          cellView: { id: cell.id },
        },
        side,
      );

      legalTargets.forEach(target => {
        moves.push({
          fromId: cell.id,
          toId: target.id,
        });
      });
    });

    return moves;
  }
}
