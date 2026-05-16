import { eChessFigure } from '../../enums/eChessFigure.js';
import { PIECE_VALUES } from '../constants/pieceValues.js';

const CHECKMATE_BONUS = 100000000;
const CAPTURE_BONUS = 1000000;
const PROMOTION_BONUS = 100000;
const CHECK_BONUS = 10000;

export function orderMoves(moves, chessEngine, side) {
  return moves
    .map((move, index) => {
      const movingFigure = chessEngine.getCellById(move.fromId)?.figure || null;
      const capturedFigure = getCapturedFigure(chessEngine, move);
      const { engine: simulation, result } = chessEngine.simulateMove(move, side);

      if (!simulation || !result.success) {
        return null;
      }

      return {
        move,
        simulation,
        result,
        score: getOrderingScore({ movingFigure, capturedFigure, result }),
        index,
      };
    })
    .filter(Boolean)
    .sort((first, second) => second.score - first.score || first.index - second.index);
}

function getOrderingScore({ movingFigure, capturedFigure, result }) {
  let score = 0;

  if (result.status === 'checkmate') {
    score += CHECKMATE_BONUS;
  }

  if (capturedFigure) {
    const capturedValue = PIECE_VALUES[capturedFigure.name] || 0;
    const movingValue = movingFigure ? PIECE_VALUES[movingFigure.name] || 0 : 0;
    score += CAPTURE_BONUS + capturedValue * 10 - movingValue;
  }

  if (
    movingFigure?.name === eChessFigure.PAWN &&
    result.moveInfo?.movingFigure.name !== eChessFigure.PAWN
  ) {
    score += PROMOTION_BONUS;
  }

  if (result.status === 'check') {
    score += CHECK_BONUS;
  }

  return score;
}

function getCapturedFigure(chessEngine, move) {
  const fromCell = chessEngine.getCellById(move.fromId);
  const toCell = chessEngine.getCellById(move.toId);

  if (!fromCell || !fromCell.figure || !toCell) {
    return null;
  }

  if (toCell.figure && toCell.figure.side !== fromCell.figure.side) {
    return toCell.figure;
  }

  const isEnPassantCapture =
    fromCell.figure.name === eChessFigure.PAWN &&
    fromCell.column !== toCell.column &&
    !toCell.figure;

  if (!isEnPassantCapture) {
    return null;
  }

  const capturedCell = chessEngine.getCell(fromCell.row, toCell.column);
  if (capturedCell && capturedCell.figure && capturedCell.figure.side !== fromCell.figure.side) {
    return capturedCell.figure;
  }

  return null;
}
