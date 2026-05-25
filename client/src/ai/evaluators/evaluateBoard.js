import { PIECE_VALUES } from '../constants/pieceValues.js';
import { PIECE_SQUARE_TABLES } from '../constants/pieceSquareTables.js';
import { getLegalMoves } from '../utils/getLegalMoves.js';
import { eChessFigure } from '../../../../shared/chess/enums/eChessFigure.js';

const MOBILITY_WEIGHT = 5;
const CHECK_PENALTY = 50;
const FRIENDLY_KING_SHIELD_BONUS = 10;

const KING_NEIGHBOR_DELTAS = [
  { row: 1, column: 0 },
  { row: -1, column: 0 },
  { row: 0, column: 1 },
  { row: 0, column: -1 },
  { row: 1, column: 1 },
  { row: 1, column: -1 },
  { row: -1, column: 1 },
  { row: -1, column: -1 },
];

export function evaluateBoard(chessEngine, side) {
  return (
    getMaterialAndPositionalScore(chessEngine, side) +
    getMobilityScore(chessEngine, side) +
    getKingSafetyScore(chessEngine, side)
  );
}

function getMaterialAndPositionalScore(chessEngine, side) {
  return chessEngine.cells.reduce((score, cell) => {
    if (!cell.figure) {
      return score;
    }

    const value =
      (PIECE_VALUES[cell.figure.name] || 0) + getPositionalValue(cell, cell.figure.side);
    return cell.figure.side === side ? score + value : score - value;
  }, 0);
}

function getMobilityScore(chessEngine, side) {
  const opponentSide = side === 'white' ? 'black' : 'white';
  const ownMobility = getLegalMoves(chessEngine, side).length;
  const opponentMobility = getLegalMoves(chessEngine, opponentSide).length;

  return (ownMobility - opponentMobility) * MOBILITY_WEIGHT;
}

function getKingSafetyScore(chessEngine, side) {
  const opponentSide = side === 'white' ? 'black' : 'white';
  const ownKingScore = getSideKingSafetyScore(chessEngine, side);
  const opponentKingScore = getSideKingSafetyScore(chessEngine, opponentSide);

  return ownKingScore - opponentKingScore;
}

function getSideKingSafetyScore(chessEngine, side) {
  const kingCell = chessEngine.cells.find(
    (cell) => cell.figure?.name === eChessFigure.KING && cell.figure.side === side,
  );

  if (!kingCell) {
    return 0;
  }

  const friendlyNeighbors = KING_NEIGHBOR_DELTAS.reduce((count, delta) => {
    const neighborCell = chessEngine.getCell(
      kingCell.row + delta.row,
      kingCell.column + delta.column,
    );
    return neighborCell?.figure?.side === side ? count + 1 : count;
  }, 0);

  const checkScore = chessEngine.isInCheck(side) ? -CHECK_PENALTY : 0;
  return checkScore + friendlyNeighbors * FRIENDLY_KING_SHIELD_BONUS;
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
