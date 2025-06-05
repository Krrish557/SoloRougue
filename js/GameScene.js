export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.playerMaxHealth = 25;
    this.playerHealth = 25;
    this.enemyBaseHealth = 5;
    this.enemyBaseSpeed = 60;
    this.rp = 0;
    this.enemiesKilled = 0;
    this.enemiesToClearStage = 15;
    this.lastDirection = 1;
    this.stageNumber = 1;
  }

  preload() {}

  create() {
    this.player = this.createAscii("  \\O/\n   |\n  / \\", 100, 500, "#00FF00");
    this.player.body.setCollideWorldBounds(true);
    this.player.health = this.playerMaxHealth;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D,Z,X,SPACE");

    this.platforms = this.physics.add.staticGroup();
    this.createPlatform(0, 560, 800);
    this.createPlatform(150, 430, 300);
    this.createPlatform(500, 330, 250);
    this.createPlatform(300, 230, 150);

    this.physics.add.collider(this.player, this.platforms, this.platformCollisionFilter, null, this);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.spawnEnemyTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.input.keyboard.on('keydown-Z', () => this.fireBullet());

    this.physics.add.collider(this.bullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);

    this.hudText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fill: '#ffffff',
    });
    this.stageText = this.add.text(600, 10, `Enemies killed: 0/${this.enemiesToClearStage}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      fill: '#ffffff',
    });

    this.shopActive = false;
  }

  update() {
    if (this.playerHealth <= 0) {
      this.gameOver();
      return;
    }

    if (this.shopActive) return;

    const speed = 150;
    let vx = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      vx = -speed;
      this.lastDirection = -1;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      vx = speed;
      this.lastDirection = 1;
    }

    if (
      (this.cursors.space.isDown || this.wasd.SPACE.isDown || this.wasd.X.isDown) &&
      this.player.body.blocked.down
    ) {
      this.player.body.setVelocityY(-500);
    }

    this.player.body.setVelocityX(vx);

    this.bullets.children.iterate((bullet) => {
      if (bullet) {
        bullet.body.setVelocityX(400 * bullet.direction);
        bullet.body.setVelocityY(0);
        if (bullet.x > this.sys.game.config.width + 20 || bullet.x < -20) bullet.destroy();
      }
    });

    this.enemies.children.iterate((enemy) => {
      if (enemy) {
        const direction = enemy.x < this.player.x ? 1 : -1;
        enemy.body.setVelocityX(this.enemyBaseSpeed * this.stageNumber * direction);
        enemy.flipX = direction < 0;
      }
    });

    this.hudText.setText(
      `HP: ${this.playerHealth}/${this.playerMaxHealth}  RP: ${this.rp}  Stage: ${this.stageNumber}`
    );
    this.stageText.setText(`Enemies killed: ${this.enemiesKilled}/${this.enemiesToClearStage}`);
  }

  createAscii(asciiArt, x, y, color = "#FFFFFF") {
    const text = this.add.text(x, y, asciiArt, {
      fontFamily: "monospace",
      fontSize: 16,
      color,
      align: "left",
      lineSpacing: -5,
    }).setOrigin(0, 0);

    this.physics.add.existing(text);
    text.body.setCollideWorldBounds(true);
    text.body.setBounce(0.1);
    text.body.setSize(text.width, text.height);
    return text;
  }

  createPlatform(x, y, width) {
    const platformText = "_".repeat(Math.floor(width / 10));
    const platform = this.add.text(x, y, platformText, {
      fontFamily: "monospace",
      fontSize: 16,
      color: "#888888",
    }).setOrigin(0, 0);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
    return platform;
  }

  fireBullet() {
    if (this.playerHealth <= 0 || this.shopActive) return;

    const bulletX = this.player.x + (this.lastDirection === 1 ? 30 : -10);
    const bulletY = this.player.y + 10;
    const bullet = this.add.text(bulletX, bulletY, "*", {
      fontFamily: "monospace",
      fontSize: 16,
      color: "#FF0000",
    }).setOrigin(0, 0);
    this.physics.add.existing(bullet);
    bullet.body.allowGravity = false;
    bullet.body.setSize(bullet.width, bullet.height);
    bullet.direction = this.lastDirection;
    bullet.body.setVelocityX(400 * bullet.direction);
    this.bullets.add(bullet);
  }

  spawnEnemy() {
    if (this.enemiesKilled >= this.enemiesToClearStage || this.shopActive) return;

    const spawnOnPlatform = Math.random() < 0.5;
    let x, y;

    if (spawnOnPlatform) {
      const platformsArray = this.platforms.getChildren().filter(p => p.y < 560);
      const plat = Phaser.Utils.Array.GetRandom(platformsArray);
      x = Phaser.Math.Between(plat.x, plat.x + plat.width - 40);
      y = plat.y - 30;
    } else {
      const fromLeft = Math.random() < 0.5;
      x = fromLeft ? 0 : this.sys.game.config.width - 40;
      y = 500;
    }

    const enemy = this.createAscii("  \\x/\n   |\n  / \\", x, y, "#FF5555");
    enemy.health = this.enemyBaseHealth * this.stageNumber;
    enemy.body.setCollideWorldBounds(true);
    enemy.body.setBounce(0);
    enemy.body.setSize(enemy.width, enemy.height);
    this.enemies.add(enemy);
  }

  handlePlayerEnemyCollision(player, enemy) {
    this.playerHealth -= 2;

    const pushBack = 30;
    if (player.x < enemy.x) player.x -= pushBack;
    else player.x += pushBack;
  }

  handleBulletEnemyCollision(bullet, enemy) {
    bullet.destroy();
    enemy.health -= 5;
    if (enemy.health <= 0) {
      enemy.destroy();
      this.rp += 1;
      this.enemiesKilled += 1;
      if (this.enemiesKilled >= this.enemiesToClearStage) this.stageCleared();
    }
  }

  stageCleared() {
    this.spawnEnemyTimer.remove(false);
    this.shopActive = true;

    const shopText = this.add.text(300, 200,
      `Stage ${this.stageNumber} Cleared!\nRP: ${this.rp}\n\nBuy Health Potion (10 RP)\nPress H to Buy\nPress G to Go to Next Stage`,
      {
        fontFamily: 'monospace',
        fontSize: 24,
        fill: '#00FF00',
        align: 'center',
      }
    );
    this.shopText = shopText;

    this.input.keyboard.once('keydown-H', () => {
      if (this.rp >= 10) {
        this.rp -= 10;
        this.playerHealth = Math.min(this.playerHealth + 10, this.playerMaxHealth);
        shopText.setText(shopText.text + `\nHealth Potion Purchased! HP restored.`);
      } else {
        shopText.setText(shopText.text + `\nNot enough RP.`);
      }
    });

    this.input.keyboard.once('keydown-G', () => {
      shopText.destroy();
      this.shopActive = false;
      this.prepareNextStage();
    });
  }

  prepareNextStage() {
    this.enemiesKilled = 0;
    this.stageNumber++;
    this.spawnEnemyTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
  }

  gameOver() {
    this.add.text(300, 300, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: 48,
      fill: '#FF0000',
    });
    this.scene.pause();
  }

  platformCollisionFilter(player, platform) {
    // One-way: only collide when falling onto the platform
    const platformTop = platform.y;
    const playerBottom = player.y + player.height;
    return player.body.velocity.y >= 0 && playerBottom <= platformTop + 10;
  }
}
