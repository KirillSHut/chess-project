import { Assets, Sprite, Texture } from 'pixi.js';
import { assetsConfig } from './configs/assetsConfig.js';
import { ControllerBoard } from './controllers/board/ControllerBoard.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.stage = app.stage;
  }

  init() {
    this.ControllerBoard = new ControllerBoard(this.stage);

    this.ControllerBoard.init();
  }

  async loadAssets() {
    await Assets.load(assetsConfig)
  }
}
