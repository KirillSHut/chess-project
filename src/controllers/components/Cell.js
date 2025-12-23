import { Container, Sprite } from 'pixi.js';

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

    this._init();
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

    // TODO Проверить на наличие текстуры, если есть использовать ее, если нет создать и использовать ее
    // if(PIXI.utils.TextureCache[textureName]) {}
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
}
