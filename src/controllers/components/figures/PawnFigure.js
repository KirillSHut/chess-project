import { BaseFigure } from './BaseFigure.js';
import { eChessFigure } from '../../../enums/eChessFigure.js';

export class PawnFigure extends BaseFigure {
  constructor(cell, config) {
    super(eChessFigure.PAWN, cell, config);
  }
}
