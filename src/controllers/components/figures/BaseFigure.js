import { Container, Sprite } from 'pixi.js';

export class BaseFigure extends Container {
  constructor({name, cellView, textureName, side, spriteScale }) {
    super();

    this._figureName = name;
    this._cellView = cellView;
    this._textureName = textureName;
    this._spriteScale = spriteScale;
    this._side = side;

    this.onClick = () => {};

    this._init();
    this._addListeners();
  }

  _init() {
    const sprite = Sprite.from(this._textureName);

    this.width = this.cellView.width;
    this.height = this.cellView.height;
    this.updatePositions();
    this.pivot.set(this.width / 2, this.height / 2);

    sprite.anchor.set(0.5);
    if(this._spriteScale) sprite.scale.set(this._spriteScale)

    this.addChild(sprite);
  }

  _addListeners() {
    this.on('pointertap', () => this.onClick(this));
  };

  updatePositions() {
    this.x = this.cellView.x + this.cellView.width / 2;
    this.y = this.cellView.y + this.cellView.height / 2;
  }

  activate() {
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  deactivate() {
    this.eventMode = 'none';
  }

  destroy() {
    super.destroy({ children: true });
  }

  get cellView() {
    return this._cellView;
  }

  set cellView(cellView) {
    this._cellView = cellView;
  }

  get figureName() {
    return this._figureName;
  }

  get side() {
    return this._side;
  }
}
