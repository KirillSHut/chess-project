import { eChessFigure } from '../enums/eChessFigure.js';
import { getLegalMoves } from './utils/getLegalMoves.js';

const pieceValues = {
  [eChessFigure.PAWN]: 1,
  [eChessFigure.KNIGHT]: 3,
  [eChessFigure.BISHOP]: 3,
  [eChessFigure.ROOK]: 5,
  [eChessFigure.QUEEN]: 9,
  [eChessFigure.KING]: 1000,
};

export class GreedyBot {
  getMove(chessEngine, side) {
    const legalMoves = getLegalMoves(chessEngine, side);

    if (legalMoves.length === 0) {
      return null;
    }

    const highestValueCaptures = [];
    let highestCaptureValue = 0;

    legalMoves.forEach((move) => {
      const capturedFigure = this._getCapturedFigure(chessEngine, move);
      const captureValue = capturedFigure ? pieceValues[capturedFigure.name] || 0 : 0;

      if (captureValue === 0) return;

      if (captureValue > highestCaptureValue) {
        highestCaptureValue = captureValue;
        highestValueCaptures.length = 0;
        highestValueCaptures.push(move);
        return;
      }

      if (captureValue === highestCaptureValue) {
        highestValueCaptures.push(move);
      }
    });

    const candidateMoves = highestValueCaptures.length > 0 ? highestValueCaptures : legalMoves;
    const randomIndex = Math.floor(Math.random() * candidateMoves.length);
    return candidateMoves[randomIndex];
  }

  _getCapturedFigure(chessEngine, move) {
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
}
