import { Container } from 'pixi.js';
import { chessCells } from '../configs/chessCells.js';
import { CellContainer } from '../controllers/components/Cell.js';
import { PawnFigure } from '../controllers/components/figures/PawnFigure.js';
import { BaseFigure } from '../controllers/components/figures/BaseFigure.js';

export class BoardView extends Container {
  constructor(stage) {
    super();

    this.stage = stage;
    this.cellsPaddings = 10;
    this.cellSizes = {width: 100, height: 100};
    this.figureScales = 2;

    this.init();
  }

  init() {
    this._cells = [];
    this.figures = [];
    this.cellsContainer = new Container();
    this.figureContainer = new Container();

    this.addChild(this.cellsContainer, this.figureContainer);
    this.stage.addChild(this);

    this._initCells();
    this._initChildrenPositions();
  }

  initFigures(cells) {
    cells.forEach(cell => {
      if(Boolean(cell.figure)) {
        const cellView = this.getCell(cell.id);

        const {name, side} = cell.figure;
        const textureName = `${name}_figure_${side}`;
        const figure = new BaseFigure({name, cellView, textureName, side: cell.figure.side, spriteScale: this.figureScales});

        cellView.figure = figure;
        this.figures.push(figure);
        this.figureContainer.addChild(figure);
      }
    })
  }

  _initCells() {
    chessCells.forEach((cell) => {
      const cellColor = this.getCellColor(cell);
      const cellContainer = new CellContainer(cell, {
        cellSizes: this.cellSizes,
        textureName: `${cellColor}_cell`,
        dotColor: 0xFF0000,
        dotSize: {width: 30, height: 30},
      });

      cellContainer.x = (cell.column - 1) * this.cellSizes.width + (cell.column === 1 ? 0 : this.cellsPaddings * (cell.column - 1));
      cellContainer.y = -(cell.row - 8) * this.cellSizes.height + (cell.row === 8 ? 0 : this.cellsPaddings * -(cell.row - 8));

      this._cells.push(cellContainer);
      this.cellsContainer.addChild(cellContainer);
    });
  }

  _initChildrenPositions() {
    this.x = 1170;
    this.y = 540;
    this.cellsContainer.x = -(this.cellsContainer.width / 2);
    this.cellsContainer.y = -(this.cellsContainer.height / 2);
    this.figureContainer.x = this.cellsContainer.x;
    this.figureContainer.y = this.cellsContainer.y;
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

  getCell(id) {
    return this._cells.filter(cell => cell.id === id)[0];
  }

  getCells(cells) {
    const idArray = cells.map(cell => cell.id);

    if(idArray.length === 0) return;

    return this._cells.filter(cell => idArray.includes(cell.id));
  }
}
