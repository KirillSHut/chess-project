import { PIECE_VALUES } from '../constants/pieceValues.js';
import { PIECE_SQUARE_TABLES } from '../constants/pieceSquareTables.js';

export function evaluateBoard(chessEngine, side) {
  return chessEngine.cells.reduce((score, cell) => {
    if (!cell.figure) {
      return score;
    }

    const value =
      (PIECE_VALUES[cell.figure.name] || 0) + getPositionalValue(cell, cell.figure.side);
    return cell.figure.side === side ? score + value : score - value;
  }, 0);
}

function getPositionalValue(cell, figureSide) {
  const table = PIECE_SQUARE_TABLES[cell.figure.name];
  if (!table) {
    return 0;
  }

  const rowIndex = figureSide === 'white' ? cell.row - 1 : 8 - cell.row;
  const columnIndex = cell.column - 1;
  return table[rowIndex][columnIndex] || 0;
}
