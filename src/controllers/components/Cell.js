import { Container, Sprite } from 'pixi.js';

export class CellContainer extends Container {
  constructor({cellSizes, textureName, spriteSize, dotColor, dotSize}) {
    super();

    this.cellSizes = cellSizes;
    this.textureName = textureName;
    this.spriteSize = spriteSize;
    this.dotColor = dotColor;
    this.dotSize = dotSize;

    this.init();
  }

  init() {
    this.width = this.cellSizes.width || 0;
    this.height = this.cellSizes.height || 0;
    this.pivot.set(this.width / 2, this.height / 2);

    if(this.textureName) {
      const sprite = Sprite.from(this.textureName);

      sprite.width = this.spriteSize.width || sprite.width;
      sprite.height = this.spriteSize.height || sprite.height;

      this.addChild(sprite);
    }

    // TODO Проверить на наличие текстуры, если есть использовать ее, если нет создать и использовать ее
    // if(PIXI.utils.TextureCache[textureName]) {}
  }
}
