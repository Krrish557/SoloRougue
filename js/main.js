import GameScene from './GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1536,
  height: 640,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: [GameScene],
  pixelArt: true
};

const game = new Phaser.Game(config);
