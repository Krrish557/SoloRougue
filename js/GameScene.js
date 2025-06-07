export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.hp = 25;
    this.maxHp = 25;
    this.enemyHp = 5;
    this.enemySpeed = 60;
    this.bulletDamage = 5;
    this.speed = 5;
    this.rp = 0;
    this.kills = 0;
    this.targetKills = 15;
    this.direction = 1;
    this.stage = 1;
    this.paused = false;
  }

  preload() {
    this.load.image('background', "../assets/background.png");
    this.load.image('sonic', "../assets/sonic.png");
    this.load.image('villain', "../assets/villain.png");
    this.load.image('bullet', "../assets/bullet.png");
    this.load.image('menu', "../assets/menu.png");
  }

  create() {
    this.add.image(768, 320, 'background');

    this.ground = this.physics.add.staticGroup();
    this.ground.create(822.5, 550, 'ground').setScale(1).refreshBody().setSize(1155, 20).setOffset(-577.5, -10);

    this.player = this.physics.add.sprite(300, 300, 'sonic');
    this.player.setScale(0.15);
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D,Z,X,SPACE");
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.platforms = this.physics.add.staticGroup();
    this.platforms.add(this.createPlatform(292.5, 410, 215, 40));
    this.platforms.add(this.createPlatform(1065, 455, 170, 30));
    this.platforms.add(this.createPlatform(1267.5, 315, 175, 40));

    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image });
    this.enemies = this.physics.add.group();

    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.input.keyboard.on('keydown-Z', () => this.fireBullet());
    this.pauseKey.on('down', () => this.togglePause());

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms, this.onePlatform, null, this);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.collider(this.bullets, this.ground, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.collider(this.enemies, this.platforms, this.onePlatform, null, this);
    this.physics.add.collider(this.player, this.enemies, this.hitPlayer, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);

    this.hudText = this.add.text(10, 10, '', { fontFamily: 'monospace', fontSize: '16px', fill: '#ffffff' });
    this.killText = this.add.text(600, 10, '', { fontFamily: 'monospace', fontSize: '16px', fill: '#ffffff' });

    this.shopActive = false;
    this.marketBox = null;
    this.menuImage = null;
    this.resumeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    if (this.hp <= 0) {
      this.add.text(600, 300, 'GAME OVER', { fontSize: '32px', fill: '#FF0000' });
      this.scene.pause();
      return;
    }

    if (this.shopActive || this.paused) return;

    let vx = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      vx = -200;
      this.direction = -1;
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      vx = 200;
      this.direction = 1;
      this.player.setFlipX(false);
    }

    if ((this.cursors.space.isDown || this.wasd.SPACE.isDown || this.wasd.X.isDown) && this.player.body.touching.down) {
      this.player.body.setVelocityY(-500);
    }

    this.player.body.setVelocityX(vx * this.speed / 5);

    this.bullets.children.iterate((bullet) => {
      if (bullet) {
        bullet.body.setVelocityX(800 * bullet.direction);
        bullet.body.setAllowGravity(false);
        if (bullet.x > this.sys.game.config.width + 50 || bullet.x < -50) bullet.destroy();
      }
    });

    this.enemies.children.iterate((enemy) => {
      if (enemy) {
        const dir = enemy.x < this.player.x ? 1 : -1;
        enemy.body.setVelocityX(this.enemySpeed * this.stage * dir);
        enemy.setFlipX(dir < 0);
      }
    });

    this.hudText.setText(`HP: ${this.hp}/${this.maxHp}  RP: ${this.rp}  Stage: ${this.stage}`);
    this.killText.setText(`Enemies killed: ${this.kills}/${this.targetKills}`);
  }

  createPlatform(x, y, width, height) {
    const platform = this.add.rectangle(x, y, width, height, 0x6666ff);
    this.physics.add.existing(platform, true);
    return platform;
  }

  fireBullet() {
    if (this.hp <= 0 || this.shopActive || this.paused) return;

    const bulletX = this.player.x + (this.direction === 1 ? 20 : -20);
    const bulletY = this.player.y;

    const bullet = this.bullets.get(bulletX, bulletY, 'bullet');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.enable = true;
      bullet.setScale(0.08);
      bullet.direction = this.direction;
      bullet.setVelocityX(800 * bullet.direction);
      bullet.body.setAllowGravity(false);
    }
  }

  spawnEnemy() {
    if (this.kills >= this.targetKills || this.shopActive || this.paused) return;
    const side = Phaser.Math.Between(0, 1) ? 260 : 1380;
    const enemy = this.enemies.create(side, 100, 'villain');
    enemy.setScale(0.15);
    enemy.setCollideWorldBounds(true);
    enemy.hp = this.enemyHp + this.stage - 1;
  }

  hitPlayer(player, enemy) {
    this.hp -= 2;
    const push = player.x < enemy.x ? -200 : 200;
    player.setVelocityX(push);
  }

  hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.hp -= this.bulletDamage;
    if (enemy.hp <= 0) {
      enemy.destroy();
      this.rp += 1;
      this.kills += 1;
      if (this.kills >= this.targetKills) this.endRound();
    }
  }

  togglePause() {
    if (!this.paused) {
      this.paused = true;
      this.physics.pause();
      try {
        this.menuImage = this.add.image(768, 320, 'menu');
      } catch {
        this.menuImage = this.add.rectangle(768, 320, 384, 448, 0x000000, 0.8);
      }
      this.menuText = this.add.text(550, 300, 'Press SPACE or ESC to Continue', { fontSize: '24px', fill: '#FFFFFF' });
      this.resumeKey.once('down', () => this.togglePause());
      this.pauseKey.once('down', () => this.togglePause());
    } else {
      this.paused = false;
      this.physics.resume();
      if (this.menuImage) this.menuImage.destroy();
      if (this.menuText) this.menuText.destroy();
    }
  }

  endRound() {
    this.shopActive = true;
    this.enemies.clear(true, true);
    this.physics.pause();
    try {
      this.menuImage = this.add.image(768, 320, 'menu');
    } catch {
      this.menuImage = this.add.rectangle(768, 320, 384, 448, 0x000000, 0.8);
    }
    this.menuText = this.add.text(500, 180,
      `Stage ${this.stage} Cleared!\nRP: ${this.rp}\n\n🍎 Apple (10 RP): Heals 10 HP\n🥤 Soda (10 RP): +1 Speed\n🔥 Fire (10 RP): +5 Bullet DMG\n\nPress A for Apple, S for Soda, F for Fire\nPress SPACE or ESC to Start Next Stage`,
      { fontSize: '18px', fill: '#00FF00', align: 'center' });

    this.input.keyboard.once('keydown-A', () => {
      if (this.rp >= 10 && this.hp < this.maxHp) {
        this.hp = Math.min(this.hp + 10, this.maxHp);
        this.rp -= 10;
      }
    });
    this.input.keyboard.once('keydown-S', () => {
      if (this.rp >= 10) {
        this.speed += 1;
        this.rp -= 10;
      }
    });
    this.input.keyboard.once('keydown-F', () => {
      if (this.rp >= 10) {
        this.bulletDamage += 5;
        this.rp -= 10;
      }
    });

    const resume = () => {
      if (this.menuImage) this.menuImage.destroy();
      if (this.menuText) this.menuText.destroy();
      this.shopActive = false;
      this.physics.resume();
      this.kills = 0;
      this.stage++;
      this.targetKills += 5;
    };

    this.resumeKey.once('down', resume);
    this.pauseKey.once('down', resume);
  }

  onePlatform(player, platform) {
    const platformTop = platform.y - platform.height / 2;
    const playerBottom = player.y + player.displayHeight / 2;
    return player.body.velocity.y >= 0 && playerBottom <= platformTop + 10;
  }
}
