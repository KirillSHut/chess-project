import { Container, Sprite } from 'pixi.js';

export class BaseFigure extends Container {
  constructor(cell, { textureName, spriteScale }) {
    super();

    this._cell = cell;
    this._textureName = textureName;
    this._spriteScale = spriteScale;
    this._init();
  }

  _init() {
    const sprite = Sprite.from(this._textureName);

    this.width = this.cell.width;
    this.height = this.cell.height;
    this.updatePositions();
    this.pivot.set(this.width / 2, this.height / 2);

    sprite.anchor.set(0.5);
    if(this._spriteScale) sprite.scale.set(this._spriteScale)

    this.addChild(sprite);
  }

  updatePositions() {
    this.x = this.cell.x + this.cell.width / 2;
    this.y = this.cell.y + this.cell.height / 2;
  }

  destroy() {
    super.destroy({ children: true });
  }

  get cell() {
    return this._cell;
  }

  set cell(cell) {
    this._cell = cell;
  }
}
