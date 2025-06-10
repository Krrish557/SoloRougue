export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.hp = 25;
    this.maxHp = 25;
    this.enemyHp = 5;
    this.enemySpeed = 60;
    this.rp = 0;
    this.kills = 0;
    this.targetKills = 15;
    this.direction = 1;
    this.stage = 1;
  }

  create() {
    this.player = this.createText("  \\O/\n   |\n  / \\", 100, 500, "#00FF00");
    this.player.body.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D,Z,X,SPACE");

    this.platforms = this.physics.add.staticGroup();
    this.createPlatform(0, 560, 800);
    this.createPlatform(150, 430, 300);
    this.createPlatform(500, 330, 250);
    this.createPlatform(300, 230, 150);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.input.keyboard.on('keydown-Z', () => this.fireBullet());

    this.physics.add.collider(this.player, this.platforms, this.onePlatform, null, this);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.enemies, this.hitPlayer, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);

    this.hudText = this.add.text(10, 10, '', { fontFamily: 'monospace', fontSize: '16px', fill: '#ffffff' });
    this.killText = this.add.text(600, 10, '', { fontFamily: 'monospace', fontSize: '16px', fill: '#ffffff' });

    this.shopActive = false;
  }

  update() {
    if (this.hp <= 0) {
      this.add.text(300, 300, 'GAME OVER', { fontFamily: 'monospace', fontSize: 48, fill: '#FF0000' });
      this.scene.pause();
      return;
    }

    if (this.shopActive) return;

    let vx = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      vx = -150;
      this.direction = -1;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      vx = 150;
      this.direction = 1;
    }

    if ((this.cursors.space.isDown || this.wasd.SPACE.isDown || this.wasd.X.isDown) && this.player.body.blocked.down) {
      this.player.body.setVelocityY(-500);
    }

    this.player.body.setVelocityX(vx);

    this.bullets.children.iterate((bullet) => {
      if (bullet) {
        bullet.body.setVelocityX(400 * bullet.direction);
        bullet.body.setVelocityY(0);
        if (bullet.x > 820 || bullet.x < -20) bullet.destroy();
      }
    });

    this.enemies.children.iterate((enemy) => {
      if (enemy) {
        const dir = enemy.x < this.player.x ? 1 : -1;
        enemy.body.setVelocityX(this.enemySpeed * this.stage * dir);
        enemy.flipX = dir < 0;
      }
    });

    this.hudText.setText(`HP: ${this.hp}/${this.maxHp}  RP: ${this.rp}  Stage: ${this.stage}`);
    this.killText.setText(`Enemies killed: ${this.kills}/${this.targetKills}`);
  }

  createText(text, x, y, color = "#FFFFFF") {
    const obj = this.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: 16,
      color,
      lineSpacing: -5,
    }).setOrigin(0, 0);
    this.physics.add.existing(obj);
    obj.body.setBounce(0.1);
    obj.body.setSize(obj.width, obj.height);
    return obj;
  }

  createPlatform(x, y, width) {
    const platform = this.add.text(x, y, "_".repeat(Math.floor(width / 10)), {
      fontFamily: "monospace",
      fontSize: 16,
      color: "#888888",
    }).setOrigin(0, 0);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  fireBullet() {
    if (this.hp <= 0 || this.shopActive) return;

    const bullet = this.add.text(
      this.player.x + (this.direction === 1 ? 30 : -10),
      this.player.y + 10,
      "*",
      { fontFamily: "monospace", fontSize: 16, color: "#FF0000" }
    ).setOrigin(0, 0);
    
    this.physics.add.existing(bullet);
    bullet.body.allowGravity = false;
    bullet.direction = this.direction;
    this.bullets.add(bullet);
  }

  spawnEnemy() {
    if (this.kills >= this.targetKills || this.shopActive) return;

    let x, y;
    if (Math.random() < 0.5) {
      const plats = this.platforms.getChildren().filter(p => p.y < 560);
      const plat = Phaser.Utils.Array.GetRandom(plats);
      x = Phaser.Math.Between(plat.x, plat.x + plat.width - 40);
      y = plat.y - 30;
    } else {
      x = Math.random() < 0.5 ? 0 : 760;
      y = 500;
    }

    const enemy = this.createText("  \\x/\n   |\n  / \\", x, y, "#FF5555");
    enemy.health = this.enemyHp * this.stage;
    enemy.body.setCollideWorldBounds(true);
    enemy.body.setBounce(0);
    this.enemies.add(enemy);
  }

  hitPlayer(player, enemy) {
    this.hp -= 2;
    const push = 30;
    if (player.x < enemy.x) player.x -= push;
    else player.x += push;
  }

  hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.health -= 5;
    if (enemy.health <= 0) {
      enemy.destroy();
      this.rp += 1;
      this.kills += 1;
      if (this.kills >= this.targetKills) this.showShop();
    }
  }

  showShop() {
    this.shopActive = true;
    const shop = this.add.text(300, 200,
      `Stage ${this.stage} Cleared!\nRP: ${this.rp}\n\nBuy Health Potion (10 RP)\nPress H to Buy\nPress G to Go to Next Stage`,
      { fontFamily: 'monospace', fontSize: 24, fill: '#00FF00', align: 'center' }
    );

    this.input.keyboard.once('keydown-H', () => {
      if (this.rp >= 10) {
        this.rp -= 10;
        this.hp = Math.min(this.hp + 10, this.maxHp);
        shop.setText(shop.text + `\nHealth Potion Purchased!`);
      } else {
        shop.setText(shop.text + `\nNot enough RP.`);
      }
    });

    this.input.keyboard.once('keydown-G', () => {
      shop.destroy();
      this.shopActive = false;
      this.kills = 0;
      this.stage++;
    });
  }

  onePlatform(player, platform) {
    return player.body.velocity.y >= 0 && (player.y + player.height) <= platform.y + 10;
  }
}