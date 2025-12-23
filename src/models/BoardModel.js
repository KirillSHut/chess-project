import { chessCells } from '../configs/chessCells.js';
import { eChessFigure } from '../enums/eChessFigure.js';

export class BoardModel {
  constructor(ControllerBoard) {
    this.ControllerBoard = ControllerBoard;

    this._init();
  }

  _init() {
    this._cells = chessCells.map(cell => {
      return {...cell};
    })

    this._cells.forEach(cell => {
      if(cell.id === 'D4') return cell.figure = eChessFigure.PAWN;

      cell.figure = null;
    });
  }

  get cells() {
    return this._cells;
  }
}
