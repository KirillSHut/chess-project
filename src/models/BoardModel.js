import { chessCells } from '../configs/chessCells.js';
import { eChessFigure } from '../enums/eChessFigure.js';
import { figureMoveConfig } from '../configs/figureMoveConfig.js';

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
      if(cell.id === 'D5') return cell.figure = {name: eChessFigure.KING, side: 'black'};

      cell.figure = null;
    });
  }


  getAvailableMoves({ figureName, side, cellView }) {
    const movePattern = figureName === eChessFigure.PAWN ? figureMoveConfig[figureName][side] : figureMoveConfig[figureName];

    let availableMoves = [];

    movePattern.forEach((pattern) => {
      for (const move of pattern) {
        if(move.condition && !move.condition(cellView)) break;
        const nextRow = cellView.row + move.row;
        const nextColumn = cellView.column + move.column;

        const nextCell = this._cells.filter(cell => cell.row === nextRow && cell.column === nextColumn)[0];

        if(nextCell && nextCell.figure) break;
        if(nextCell) availableMoves.push(nextCell);
      }
    })

    return availableMoves;
  }

  get cells() {
    return this._cells;
  }
}
