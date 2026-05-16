import { getLegalMoves } from './utils/getLegalMoves.js';

export class RandomBot {
  getMove(chessEngine, side) {
    const legalMoves = getLegalMoves(chessEngine, side);

    if (legalMoves.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }
}
