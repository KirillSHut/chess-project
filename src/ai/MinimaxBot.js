import { evaluateBoard } from './evaluators/evaluateBoard.js';
import { getLegalMoves } from './utils/getLegalMoves.js';

export const DEFAULT_DEPTH = 2;

const CHECKMATE_SCORE = 1000000;

export class MinimaxBot {
  constructor(depth = DEFAULT_DEPTH) {
    this.depth = depth;
  }

  getMove(chessEngine, side) {
    const legalMoves = getLegalMoves(chessEngine, side);

    if (legalMoves.length === 0) {
      return null;
    }

    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    legalMoves.forEach((move) => {
      const { engine: simulation } = chessEngine.simulateMove(move, side);
      if (!simulation) return;

      const score = this._minimax(simulation, this.depth - 1, side);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    return bestMove;
  }

  _minimax(chessEngine, depth, maximizingSide) {
    const currentSide = chessEngine.activeSide;
    const legalMoves = getLegalMoves(chessEngine, currentSide);

    if (legalMoves.length === 0) {
      if (chessEngine.isInCheck(currentSide)) {
        return currentSide === maximizingSide ? -CHECKMATE_SCORE - depth : CHECKMATE_SCORE + depth;
      }

      return 0;
    }

    if (depth === 0) {
      return evaluateBoard(chessEngine, maximizingSide);
    }

    const isMaximizingTurn = currentSide === maximizingSide;
    let bestScore = isMaximizingTurn ? -Infinity : Infinity;

    legalMoves.forEach((move) => {
      const { engine: simulation } = chessEngine.simulateMove(move, currentSide);
      if (!simulation) return;

      const score = this._minimax(simulation, depth - 1, maximizingSide);
      bestScore = isMaximizingTurn ? Math.max(bestScore, score) : Math.min(bestScore, score);
    });

    return bestScore;
  }
}
