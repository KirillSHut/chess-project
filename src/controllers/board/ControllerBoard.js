import { Container, Sprite } from 'pixi.js';
import { chessCells } from '../../configs/chessCells.js';

export class ControllerBoard {
  constructor(stage) {

    this.stage = stage;
    this.cellsPaddings = 10;
    this.cellSizes = {width: 100, height: 100};
  }

  init() {
    this.boardContainer = new Container();
    this.cellsContainer = new Container();

    this.boardContainer.addChild(this.cellsContainer);
    this.stage.addChild(this.boardContainer);

    this.initCells();

    this.boardContainer.x = 1170;
    this.boardContainer.y = 540;
    this.cellsContainer.x = -(this.cellsContainer.width / 2);
    this.cellsContainer.y = -(this.cellsContainer.height / 2);
  }

  initCells() {
    chessCells.forEach((cell, index) => {
      const cellColor = this.getCellColor(cell);
      const cellSprite = Sprite.from(`${cellColor}_cell`);

      cellSprite.width = this.cellSizes.width;
      cellSprite.height = this.cellSizes.height;

      cellSprite.x = (cell.column - 1) * this.cellSizes.width + (cell.column === 1 ? 0 : this.cellsPaddings * (cell.column - 1));
      cellSprite.y = -(cell.row - 8) * this.cellSizes.height + (cell.row === 8 ? 0 : this.cellsPaddings * -(cell.row - 8));

      this.cellsContainer.addChild(cellSprite);
    })
  }

  getCellColor({ row, column }) {
    if(row % 2 === 0) {
      if(column % 2 === 0) {
        return 'black'
      } else {
        return 'white'
      }
    } else {
      if(column % 2 === 0) {
        return 'white'
      } else {
        return 'black'
      }
    }
  }
}
