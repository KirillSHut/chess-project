import { eChessFigure } from '../../../../shared/chess/enums/eChessFigure.js';

export const PIECE_VALUES = {
  [eChessFigure.PAWN]: 100,
  [eChessFigure.KNIGHT]: 300,
  [eChessFigure.BISHOP]: 300,
  [eChessFigure.ROOK]: 500,
  [eChessFigure.QUEEN]: 900,
  [eChessFigure.KING]: 100000,
};
