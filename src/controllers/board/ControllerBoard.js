import { BoardModel } from '../../models/BoardModel.js';
import { BoardView } from '../../view/BoardView.js';

export class ControllerBoard {
  constructor(stage) {

    this.stage = stage;
  }

  init() {
    this.BoardModel = new BoardModel(this);
    this.BoardView = new BoardView(this.stage);

    this.BoardView.initFigures(this.BoardModel.cells);

    this.activateFigures();
  }

  activateFigures() {
    this.BoardView.figures.forEach(figure => {
      figure.activate();
      figure.onClick = this._onFigureClick.bind(this);
    })
  }

  _onFigureClick(figure) {
    const availableMoves = this.BoardModel.getAvailableMoves(figure);
    const cellViews = this.BoardView.getCells(availableMoves);

    cellViews.forEach(cellView => {
      cellView.activate();
    })
  }
}
