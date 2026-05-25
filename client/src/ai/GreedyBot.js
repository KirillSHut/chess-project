import { eChessFigure } from '../../../shared/chess/enums/eChessFigure.js';
import { PIECE_VALUES } from './constants/pieceValues.js';
import { getLegalMoves } from './utils/getLegalMoves.js';

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
      const captureValue = capturedFigure ? PIECE_VALUES[capturedFigure.name] || 0 : 0;

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
