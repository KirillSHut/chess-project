import { Container, Sprite, Text, Graphics } from 'pixi.js';

export class CellContainer extends Container {
  constructor(cellInfo, {cellSizes, textureName, spriteSize, dotColor, dotSize}) {
    super();

    this._cellInfo = cellInfo;
    this.cellSizes = cellSizes;
    this._textureName = textureName;
    this.spriteSize = spriteSize;
    this.dotColor = dotColor;
    this.dotSize = dotSize;
    this._currentFigure = null;

    this.onClick = () => {};

    this._init();
    this._addListeners();
  }

  _init() {
    this.width = this.cellSizes.width || 0;
    this.height = this.cellSizes.height || 0;
    this.pivot.set(this.width / 2, this.height / 2);

    if(this._textureName) {
      const sprite = Sprite.from(this._textureName);

      if(this.spriteSize) {
        sprite.width = this.spriteSize.width || sprite.width;
        sprite.height = this.spriteSize.height || sprite.height;
      }

      this.addChild(sprite);
    }

    if(this._cellInfo.row === 1) {
      this._createCellInfoText(this._cellInfo.id);
    } else if(this._cellInfo.row !== 1 && this._cellInfo.file === 'A') {
      this._createCellInfoText(this._cellInfo.row);
    }

    this.dot = new Graphics();
    this.dot
      .circle(this.width / 2, this.height / 2, 10)
      .fill('red');
    this.dot.visible = false;

    this.addChild(this.dot);

    // TODO Проверить на наличие текстуры, если есть использовать ее, если нет создать и использовать ее
    // if(PIXI.utils.TextureCache[textureName]) {}
  }

  _addListeners() {
    this.on('pointertap', () => this.onClick(this));
  };

  _createCellInfoText(text) {
    const textField = new Text({text, style: {fontSize: 20, fill: 0xFF0000}});
    textField.pivot.set(0, textField.height);
    textField.position.set(5, this.height);

    this.addChild(textField);
  }

  activate() {
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.dot.visible = true;
  }

  deactivate() {
    this.eventMode = 'none';
    this.dot.visible = false;
  }

  set figure(figure) {
    this._figure = figure;
  }

  get figure() {
    return this._figure;
  }

  get id() {
    return this._cellInfo.id;
  }

  get row() {
    return this._cellInfo.row;
  }

  get column() {
    return this._cellInfo.column;
  }
}
