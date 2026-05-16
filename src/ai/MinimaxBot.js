import { evaluateBoard } from './evaluators/evaluateBoard.js';
import { getLegalMoves } from './utils/getLegalMoves.js';
import { orderMoves } from './utils/orderMoves.js';

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

    const orderedMoves = orderMoves(legalMoves, chessEngine, side);

    orderedMoves.forEach(({ move, simulation }) => {
      const score = this._minimax(simulation, this.depth - 1, side, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    return bestMove;
  }

  _minimax(chessEngine, depth, maximizingSide, alpha, beta) {
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

    const orderedMoves = orderMoves(legalMoves, chessEngine, currentSide);
    for (const { simulation } of orderedMoves) {
      const score = this._minimax(simulation, depth - 1, maximizingSide, alpha, beta);

      if (isMaximizingTurn) {
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, bestScore);
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) {
        break;
      }
    }

    return bestScore;
  }
}
