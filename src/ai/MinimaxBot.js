import { evaluateBoard } from './evaluators/evaluateBoard.js';
import { getLegalMoves } from './utils/getLegalMoves.js';
import { orderMoves } from './utils/orderMoves.js';

export const DEFAULT_DEPTH = 2;

const CHECKMATE_SCORE = 1000000;

export class MinimaxBot {
  constructor(depth = DEFAULT_DEPTH) {
    this.depth = depth;
    this._lastMetrics = this._createMetrics();
  }

  getMove(chessEngine, side) {
    this._lastMetrics = this._createMetrics();
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
    this._lastMetrics.nodesVisited += 1;

    const currentSide = chessEngine.activeSide;
    const legalMoves = getLegalMoves(chessEngine, currentSide);

    if (legalMoves.length === 0) {
      if (chessEngine.isInCheck(currentSide)) {
        return currentSide === maximizingSide ? -CHECKMATE_SCORE - depth : CHECKMATE_SCORE + depth;
      }

      return 0;
    }

    if (depth === 0) {
      this._lastMetrics.evaluations += 1;
      return evaluateBoard(chessEngine, maximizingSide);
    }

    const isMaximizingTurn = currentSide === maximizingSide;
    let bestScore = isMaximizingTurn ? -Infinity : Infinity;

    const orderedMoves = orderMoves(legalMoves, chessEngine, currentSide);
    for (let index = 0; index < orderedMoves.length; index += 1) {
      const { simulation } = orderedMoves[index];
      const score = this._minimax(simulation, depth - 1, maximizingSide, alpha, beta);

      if (isMaximizingTurn) {
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, bestScore);
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) {
        this._lastMetrics.prunedBranches += orderedMoves.length - index - 1;
        break;
      }
    }

    return bestScore;
  }

  getLastMetrics() {
    return { ...this._lastMetrics };
  }

  _createMetrics() {
    return {
      nodesVisited: 0,
      evaluations: 0,
      prunedBranches: 0,
      depth: this.depth,
    };
  }
}
