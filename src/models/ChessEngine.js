import { chessCells } from '../configs/chessCells.js';
import { eChessFigure } from '../enums/eChessFigure.js';
import { figureMoveConfig } from '../configs/figureMoveConfig.js';

/**
 * ChessEngine stores the complete logical state of the chess board.
 * It is intentionally UI‑agnostic so it can later be reused for multiplayer / networking.
 */
export class ChessEngine {
  constructor() {
    /**
     * Flat array of 64 cell objects.
     * Each cell has:
     *  - id, file, row, column (from chessCells)
     *  - figure: { name, side, hasMoved } | null
     */
    this._cells = [];

    /**
     * Track last move for features like en passant.
     * Shape: { fromId, toId, figure, isTwoStepPawnMove } | null
     */
    this._lastMove = null;

    /**
     * Side to move next. Controllers may still own turn flow, but the engine
     * keeps this so cloned positions are fully useful for AI search.
     */
    this._activeSide = 'white';

    this._init();
  }

  _init() {
    this._cells = chessCells.map((cell) => {
      return {
        ...cell,
        figure: null,
      };
    });

    this._setupInitialPosition();
  }

  /**
   * Standard chess starting position.
   */
  _setupInitialPosition() {
    const place = (id, name, side) => {
      const cell = this.getCellById(id);
      if (!cell) return;
      cell.figure = {
        name,
        side,
        hasMoved: false,
      };
    };

    // White pieces
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2'].forEach((id) =>
      place(id, eChessFigure.PAWN, 'white'),
    );
    place('A1', eChessFigure.ROOK, 'white');
    place('H1', eChessFigure.ROOK, 'white');
    place('B1', eChessFigure.KNIGHT, 'white');
    place('G1', eChessFigure.KNIGHT, 'white');
    place('C1', eChessFigure.BISHOP, 'white');
    place('F1', eChessFigure.BISHOP, 'white');
    place('D1', eChessFigure.QUEEN, 'white');
    place('E1', eChessFigure.KING, 'white');

    // Black pieces
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'].forEach((id) =>
      place(id, eChessFigure.PAWN, 'black'),
    );
    place('A8', eChessFigure.ROOK, 'black');
    place('H8', eChessFigure.ROOK, 'black');
    place('B8', eChessFigure.KNIGHT, 'black');
    place('G8', eChessFigure.KNIGHT, 'black');
    place('C8', eChessFigure.BISHOP, 'black');
    place('F8', eChessFigure.BISHOP, 'black');
    place('D8', eChessFigure.QUEEN, 'black');
    place('E8', eChessFigure.KING, 'black');
  }

  /**
   * PUBLIC API
   * ----------
   */

  /**
   * Get all legal moves for a figure located on the given cellView.
   * This is the method used by the controller / view layer.
   *
   * @param {{ figureName: string, side: 'white' | 'black', cellView: { id: string } }} param0
   * @param {string} currentTurnSide side whose turn it is (used to filter out illegal piece selections)
   */
  getAvailableMoves({ figureName, side, cellView }, currentTurnSide) {
    if (side !== currentTurnSide) {
      return [];
    }

    const fromCell = this.getCellById(cellView.id);
    if (
      !fromCell ||
      !fromCell.figure ||
      fromCell.figure.side !== side ||
      fromCell.figure.name !== figureName
    ) {
      return [];
    }

    const pseudoLegalTargets = this._getPseudoLegalMovesFromCell(fromCell);

    // Filter out moves that would leave own king in check
    const legalTargets = pseudoLegalTargets.filter((targetCell) => {
      const simulation = this.clone();
      simulation._applyMoveInternal(fromCell.id, targetCell.id, { isSimulation: true });
      return !simulation.isInCheck(side);
    });

    return legalTargets;
  }

  /**
   * Check if a specific move is legal for the given side.
   */
  isMoveLegal(fromId, toId, side) {
    const fromCell = this.getCellById(fromId);
    if (!fromCell || !fromCell.figure || fromCell.figure.side !== side) {
      return false;
    }

    const legalTargets = this.getAvailableMoves(
      {
        figureName: fromCell.figure.name,
        side,
        cellView: { id: fromId },
      },
      side,
    );

    return Boolean(legalTargets.find((cell) => cell.id === toId));
  }

  /**
   * Execute a move if it is legal. Returns a result object that can be
   * used by higher‑level controllers / game flow.
   */
  makeMove(fromId, toId, side, { promotionTo } = {}) {
    if (!this.isMoveLegal(fromId, toId, side)) {
      return { success: false, reason: 'illegal_move' };
    }

    const moveInfo = this._applyMoveInternal(fromId, toId, {
      isSimulation: false,
      promotionTo,
    });

    const opponentSide = side === 'white' ? 'black' : 'white';
    this._activeSide = opponentSide;
    const inCheck = this.isInCheck(opponentSide);
    const opponentHasMoves = this._sideHasAnyLegalMove(opponentSide);

    let status = 'ok';
    if (inCheck && !opponentHasMoves) {
      status = 'checkmate';
    } else if (!inCheck && !opponentHasMoves) {
      status = 'stalemate';
    } else if (inCheck) {
      status = 'check';
    }

    return {
      success: true,
      status,
      moveInfo,
    };
  }

  /**
   * Returns true if the given side's king is currently in check.
   */
  isInCheck(side) {
    const kingCell = this._cells.find(
      (cell) => cell.figure && cell.figure.name === eChessFigure.KING && cell.figure.side === side,
    );
    if (!kingCell) return false;

    const opponentSide = side === 'white' ? 'black' : 'white';
    return this._isCellAttackedBySide(kingCell, opponentSide);
  }

  /**
   * Create a fully isolated copy of the current engine state.
   */
  clone() {
    const clone = new ChessEngine();
    clone._cells = this._cells.map((cell) => ({
      ...cell,
      figure: cell.figure ? { ...cell.figure } : null,
    }));
    clone._lastMove = this._lastMove
      ? {
          ...this._lastMove,
          figure: this._lastMove.figure ? { ...this._lastMove.figure } : null,
        }
      : null;
    clone._activeSide = this._activeSide;
    return clone;
  }

  /**
   * Apply a move object through normal engine validation.
   * Useful for callers that already represent moves as data objects.
   */
  applyMove({ fromId, toId }, side = this._activeSide, options = {}) {
    return this.makeMove(fromId, toId, side, options);
  }

  /**
   * Apply a legal move to a clone and return both the isolated engine and result.
   * The original engine is never mutated.
   */
  simulateMove(move, side = this._activeSide, options = {}) {
    const simulation = this.clone();
    const result = simulation.applyMove(move, side, options);

    return {
      engine: result.success ? simulation : null,
      result,
    };
  }

  /**
   * UTILITY API
   * ----------
   */

  get cells() {
    return this._cells;
  }

  get activeSide() {
    return this._activeSide;
  }

  getCellById(id) {
    return this._cells.find((cell) => cell.id === id);
  }

  getCell(row, column) {
    return this._cells.find((cell) => cell.row === row && cell.column === column);
  }

  /**
   * INTERNAL MOVE / RULES LOGIC
   * ---------------------------
   */

  _getPseudoLegalMovesFromCell(fromCell) {
    if (!fromCell.figure) return [];

    const { name, side } = fromCell.figure;
    if (name === eChessFigure.PAWN) {
      return this._getPawnMoves(fromCell, side);
    }

    if (name === eChessFigure.KING) {
      return this._getKingMoves(fromCell, side);
    }

    const movePattern = figureMoveConfig[name];
    if (!movePattern) return [];

    const moves = [];

    movePattern.forEach((pattern) => {
      for (const move of pattern) {
        const nextRow = fromCell.row + move.row;
        const nextColumn = fromCell.column + move.column;
        const nextCell = this.getCell(nextRow, nextColumn);

        if (!nextCell) break;

        if (nextCell.figure) {
          if (nextCell.figure.side !== side) {
            moves.push(nextCell);
          }
          break;
        }

        moves.push(nextCell);

        if (name === eChessFigure.KNIGHT) {
          // Knights do not continue along a ray – each pattern has length 1 anyway
          break;
        }
      }
    });

    return moves;
  }

  _getPawnMoves(fromCell, side) {
    const moves = [];
    const direction = side === 'white' ? 1 : -1;
    const startingRow = side === 'white' ? 2 : 7;

    const oneStep = this.getCell(fromCell.row + direction, fromCell.column);
    if (oneStep && !oneStep.figure) {
      moves.push(oneStep);

      const twoStep = this.getCell(fromCell.row + 2 * direction, fromCell.column);
      if (!fromCell.figure.hasMoved && fromCell.row === startingRow && twoStep && !twoStep.figure) {
        moves.push(twoStep);
      }
    }

    // Diagonal captures
    const captureLeft = this.getCell(fromCell.row + direction, fromCell.column - 1);
    const captureRight = this.getCell(fromCell.row + direction, fromCell.column + 1);

    [captureLeft, captureRight].forEach((target) => {
      if (target && target.figure && target.figure.side !== side) {
        moves.push(target);
      }
    });

    // Basic en passant (optional part) – only if there is a last move that was a two‑step pawn advance
    if (this._lastMove && this._lastMove.isTwoStepPawnMove) {
      const lastTo = this.getCellById(this._lastMove.toId);
      if (
        lastTo &&
        lastTo.row === fromCell.row &&
        Math.abs(lastTo.column - fromCell.column) === 1
      ) {
        const epTarget = this.getCell(fromCell.row + direction, lastTo.column);
        if (epTarget && !epTarget.figure) {
          moves.push(epTarget);
        }
      }
    }

    return moves;
  }

  _getKingMoves(fromCell, side) {
    const moves = [];
    const movePattern = figureMoveConfig[eChessFigure.KING];

    movePattern.forEach((pattern) => {
      for (const move of pattern) {
        const nextRow = fromCell.row + move.row;
        const nextColumn = fromCell.column + move.column;
        const nextCell = this.getCell(nextRow, nextColumn);

        if (!nextCell) break;

        if (nextCell.figure) {
          if (nextCell.figure.side !== side) {
            moves.push(nextCell);
          }
          break;
        }

        moves.push(nextCell);
        break;
      }
    });

    // Castling
    if (!fromCell.figure.hasMoved && !this.isInCheck(side)) {
      const rank = side === 'white' ? 1 : 8;

      // King side
      const kingSideRookCell = this.getCell(rank, 8);
      if (
        kingSideRookCell &&
        kingSideRookCell.figure &&
        kingSideRookCell.figure.name === eChessFigure.ROOK &&
        !kingSideRookCell.figure.hasMoved
      ) {
        const fFile = this.getCell(rank, 6);
        const gFile = this.getCell(rank, 7);
        if (
          fFile &&
          gFile &&
          !fFile.figure &&
          !gFile.figure &&
          !this._isCellAttackedBySide(fFile, side === 'white' ? 'black' : 'white') &&
          !this._isCellAttackedBySide(gFile, side === 'white' ? 'black' : 'white')
        ) {
          moves.push(gFile);
        }
      }

      // Queen side
      const queenSideRookCell = this.getCell(rank, 1);
      if (
        queenSideRookCell &&
        queenSideRookCell.figure &&
        queenSideRookCell.figure.name === eChessFigure.ROOK &&
        !queenSideRookCell.figure.hasMoved
      ) {
        const bFile = this.getCell(rank, 2);
        const cFile = this.getCell(rank, 3);
        const dFile = this.getCell(rank, 4);
        if (
          bFile &&
          cFile &&
          dFile &&
          !bFile.figure &&
          !cFile.figure &&
          !dFile.figure &&
          !this._isCellAttackedBySide(cFile, side === 'white' ? 'black' : 'white') &&
          !this._isCellAttackedBySide(dFile, side === 'white' ? 'black' : 'white')
        ) {
          moves.push(cFile);
        }
      }
    }

    return moves;
  }

  _isCellAttackedBySide(targetCell, attackingSide) {
    for (const cell of this._cells) {
      if (!cell.figure || cell.figure.side !== attackingSide) continue;

      const attackTargets = this._getAttackTargetsFromCell(cell);
      if (attackTargets.find((c) => c.id === targetCell.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Attack targets are NOT the same as legal moves.
   * - King attacks adjacent squares only (no castling).
   * - Pawn attacks diagonals only (no forward moves, no en passant target squares).
   * - Other pieces are the same as pseudo-legal ray/step targets.
   *
   * This separation prevents recursion loops like:
   *  attack check -> king pseudo moves -> castling -> isInCheck -> attack check -> ...
   */
  _getAttackTargetsFromCell(fromCell) {
    if (!fromCell.figure) return [];

    const { name, side } = fromCell.figure;

    if (name === eChessFigure.PAWN) {
      const direction = side === 'white' ? 1 : -1;
      const targets = [];
      const left = this.getCell(fromCell.row + direction, fromCell.column - 1);
      const right = this.getCell(fromCell.row + direction, fromCell.column + 1);
      if (left) targets.push(left);
      if (right) targets.push(right);
      return targets;
    }

    if (name === eChessFigure.KING) {
      const targets = [];
      const deltas = [
        { row: 1, column: 0 },
        { row: -1, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: -1 },
        { row: 1, column: 1 },
        { row: 1, column: -1 },
        { row: -1, column: 1 },
        { row: -1, column: -1 },
      ];

      deltas.forEach((d) => {
        const cell = this.getCell(fromCell.row + d.row, fromCell.column + d.column);
        if (cell) targets.push(cell);
      });

      return targets;
    }

    // For rook/bishop/queen/knight we can reuse ray patterns, but we should not
    // filter out squares just because they contain own pieces: the first occupied
    // square on a ray is still "attacked" (it blocks further squares).
    const movePattern = figureMoveConfig[name];
    if (!movePattern) return [];

    const targets = [];

    movePattern.forEach((pattern) => {
      for (const move of pattern) {
        const nextCell = this.getCell(fromCell.row + move.row, fromCell.column + move.column);
        if (!nextCell) break;

        targets.push(nextCell);

        // Stop ray when hitting any piece
        if (nextCell.figure) break;

        // Knights are step pieces (pattern has length 1 anyway)
        if (name === eChessFigure.KNIGHT) break;
      }
    });

    return targets;
  }

  _sideHasAnyLegalMove(side) {
    for (const cell of this._cells) {
      if (!cell.figure || cell.figure.side !== side) continue;
      const legalTargets = this.getAvailableMoves(
        {
          figureName: cell.figure.name,
          side,
          cellView: { id: cell.id },
        },
        side,
      );
      if (legalTargets.length > 0) {
        return true;
      }
    }
    return false;
  }

  _applyMoveInternal(fromId, toId, { isSimulation, promotionTo } = {}) {
    const fromCell = this.getCellById(fromId);
    const toCell = this.getCellById(toId);

    if (!fromCell || !fromCell.figure || !toCell) {
      return null;
    }

    const movingFigure = { ...fromCell.figure };
    const capturedFigure = toCell.figure ? { ...toCell.figure } : null;

    const isPawn = movingFigure.name === eChessFigure.PAWN;
    const isTwoStepPawnMove = isPawn && Math.abs(toCell.row - fromCell.row) === 2;

    // En passant capture
    if (
      isPawn &&
      this._lastMove &&
      this._lastMove.isTwoStepPawnMove &&
      !toCell.figure &&
      fromCell.column !== toCell.column
    ) {
      const direction = movingFigure.side === 'white' ? 1 : -1;
      const capturedCell = this.getCell(toCell.row - direction, toCell.column);
      if (capturedCell && capturedCell.figure && capturedCell.figure.side !== movingFigure.side) {
        if (!isSimulation) {
          capturedCell.figure = null;
        } else {
          capturedCell.figure = null;
        }
      }
    }

    // Castling rook movement
    if (
      movingFigure.name === eChessFigure.KING &&
      Math.abs(toCell.column - fromCell.column) === 2
    ) {
      const side = movingFigure.side;
      const rank = side === 'white' ? 1 : 8;
      if (toCell.column === 7) {
        const rookFrom = this.getCell(rank, 8);
        const rookTo = this.getCell(rank, 6);
        if (rookFrom && rookTo && rookFrom.figure) {
          rookTo.figure = { ...rookFrom.figure, hasMoved: true };
          rookFrom.figure = null;
        }
      } else if (toCell.column === 3) {
        const rookFrom = this.getCell(rank, 1);
        const rookTo = this.getCell(rank, 4);
        if (rookFrom && rookTo && rookFrom.figure) {
          rookTo.figure = { ...rookFrom.figure, hasMoved: true };
          rookFrom.figure = null;
        }
      }
    }

    // Perform main move
    fromCell.figure = null;
    movingFigure.hasMoved = true;

    // Pawn promotion (basic: auto promote to queen if no explicit promotionTo is provided)
    if (isPawn) {
      const promotionRow = movingFigure.side === 'white' ? 8 : 1;
      if (toCell.row === promotionRow) {
        movingFigure.name = promotionTo || eChessFigure.QUEEN;
      }
    }

    toCell.figure = movingFigure;

    if (!isSimulation) {
      this._lastMove = {
        fromId,
        toId,
        figure: movingFigure,
        isTwoStepPawnMove,
      };
    }

    return {
      fromId,
      toId,
      movingFigure,
      capturedFigure,
    };
  }
}
