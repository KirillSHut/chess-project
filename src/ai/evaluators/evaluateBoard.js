import { PIECE_VALUES } from '../constants/pieceValues.js';

export function evaluateBoard(chessEngine, side) {
  return chessEngine.cells.reduce((score, cell) => {
    if (!cell.figure) {
      return score;
    }

    const value = PIECE_VALUES[cell.figure.name] || 0;
    return cell.figure.side === side ? score + value : score - value;
  }, 0);
}
