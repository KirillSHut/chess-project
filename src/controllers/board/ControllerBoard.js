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
  }
}
