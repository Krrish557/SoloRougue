export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.hp = 25;
    this.maxHp = 25;
    this.enemyHp = 5;
    this.enemySpeed = 60;
    this.bulletDamage = 5;
    this.speed = 5;
    this.rp = 0;
    this.kills = 0;
    this.targetKills = 7;
    this.direction = 1;
    this.stage = 1;
    this.paused = false;

    this.knockbackDuration = 300;
    this.knockbackTimer = 0;
    this.lastHitTime = 0;
    this.hitCooldown = 500;
    this.isKnockedBack = false;
    this.maxEnemiesOnScreen = 7; // First stage: 7 enemies

    this.enemyJumpCooldown = 1000; // Minimum delay between jumps
    this.enemyLastJump = new Map(); // For tracking each enemy's jump timer
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("sonic", "assets/sonic.png");
    this.load.image("villain", "assets/villain.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("menu", "assets/menuBg.png");
  }

  create() {
    this.add.image(768, 320, "background");

    this.ground = this.physics.add.staticGroup();
    const groundBody = this.ground.create(768, 600); // Adjusted ground Y for correct alignment
    groundBody.setSize(1536, 40).setOffset(-768, -20);
    groundBody.setVisible(false);

    this.barriers = this.physics.add.staticGroup();
    const leftBarrier = this.barriers.create(0, 320);
    leftBarrier.setSize(20, 640).setOffset(-10, -320).setVisible(false);
    const rightBarrier = this.barriers.create(1536, 320);
    rightBarrier.setSize(20, 640).setOffset(-10, -320).setVisible(false);

    this.player = this.physics.add.sprite(300, 300, "sonic");
    this.player.setScale(0.08);
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D,Z,X,SPACE");
    this.pauseKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    this.platforms = this.physics.add.staticGroup();
    const platform1 = this.platforms.add(
      this.createPlatform(292.5, 410, 215, 40)
    );
    const platform2 = this.platforms.add(
      this.createPlatform(1065, 455, 170, 30)
    );
    const platform3 = this.platforms.add(
      this.createPlatform(1267.5, 315, 175, 40)
    );
    platform1.setVisible(false);
    platform2.setVisible(false);
    platform3.setVisible(false);

    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
    });
    this.enemies = this.physics.add.group();

    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.input.keyboard.on("keydown-Z", () => this.fireBullet());
    this.pauseKey.on("down", () => this.togglePause());

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.barriers);
    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.collider(this.enemies, this.barriers);
    this.physics.add.collider(
      this.player,
      this.platforms,
      this.onePlatform,
      null,
      this
    );
    this.physics.add.collider(
      this.enemies,
      this.platforms,
      this.onePlatform,
      null,
      this
    );
    this.physics.add.collider(this.bullets, this.platforms, (bullet) =>
      bullet.destroy()
    );
    this.physics.add.collider(this.bullets, this.ground, (bullet) =>
      bullet.destroy()
    );
    this.physics.add.collider(this.bullets, this.barriers, (bullet) =>
      bullet.destroy()
    );
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.hitPlayer,
      null,
      this
    );
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );

    this.hudText = this.add.text(10, 10, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      fill: "#ffffff",
    });
    this.killText = this.add.text(600, 10, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      fill: "#ffffff",
    });

    this.shopActive = false;
    this.menuImage = null;
    this.resumeKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  update() {
    if (this.hp <= 0) {
      this.add.text(600, 300, "GAME OVER", {
        fontSize: "32px",
        fill: "#FF0000",
      });
      this.scene.pause();
      return;
    }

    if (this.shopActive || this.paused) return;

    const currentTime = this.time.now;
    if (this.isKnockedBack && currentTime > this.knockbackTimer)
      this.isKnockedBack = false;
    if (this.isKnockedBack) return;

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

    if (
      (this.cursors.space.isDown ||
        this.wasd.SPACE.isDown ||
        this.wasd.X.isDown) &&
      this.player.body.touching.down
    ) {
      this.player.body.setVelocityY(-600);
    }

    this.player.body.setVelocityX((vx * this.speed) / 5);

    this.bullets.children.iterate((bullet) => {
      if (bullet) {
        bullet.body.setVelocityX(800 * bullet.direction);
        bullet.body.setAllowGravity(false);
        if (bullet.x > this.sys.game.config.width + 50 || bullet.x < -50)
          bullet.destroy();
      }
    });

    this.enemies.children.iterate((enemy) => {
      if (enemy) {
        const dir = enemy.x < this.player.x ? 1 : -1;
        enemy.body.setVelocityX(this.enemySpeed * this.stage * dir);
        enemy.setFlipX(dir < 0);

        if (!this.enemyLastJump.has(enemy)) this.enemyLastJump.set(enemy, 0);

        // Detect obstacle in front
        const blocked =
          (dir === 1 && enemy.body.blocked.right) ||
          (dir === -1 && enemy.body.blocked.left);

        if (blocked) {
          if (
            currentTime - this.enemyLastJump.get(enemy) >
            this.enemyJumpCooldown
          ) {
            const stepBack = dir === 1 ? -50 : 50; // Step back
            enemy.x += stepBack; // Move enemy backward a bit
            enemy.body.setVelocityY(-400); // Then jump
            this.enemyLastJump.set(enemy, currentTime); // Reset jump timer
          }
        }
      }
    });

    this.hudText.setText(
      `HP: ${this.hp}/${this.maxHp} 💰 RP: ${this.rp}  Stage: ${this.stage} Speed: ${this.speed} Damage: ${this.bulletDamage}`
    );
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

    const bullet = this.bullets.get(bulletX, bulletY, "bullet");
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
    if (this.kills >= this.targetKills || this.shopActive || this.paused)
      return;
    if (this.enemies.countActive(true) >= this.maxEnemiesOnScreen) return;

    const side = Phaser.Math.Between(0, 1) ? 260 : 1380;
    const enemy = this.enemies.create(side, 100, "villain");
    enemy.setScale(0.08);
    enemy.setCollideWorldBounds(true);
    enemy.hp = this.enemyHp + this.stage - 1;

    this.maxEnemiesOnScreen = 7 + (this.stage - 1) * 3; // Increase enemy limit by stage
  }

  hitPlayer(player, enemy) {
    const currentTime = this.time.now;
    if (currentTime - this.lastHitTime > this.hitCooldown) {
      this.hp -= 2;
      this.lastHitTime = currentTime;

      const pushX = player.x < enemy.x ? -200 : 200; // Stronger horizontal knockback
      const pushY = -50; // Minimal vertical knockback
      player.setVelocity(pushX, pushY);

      this.isKnockedBack = true;
      this.knockbackTimer = currentTime + this.knockbackDuration;
    }
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
        this.menuImage = this.add.image(768, 320, "menu");
      } catch {
        this.menuImage = this.add.rectangle(768, 320, 384, 448, 0x000000, 0.8);
      }
      this.menuText = this.add.text(
        768,
        320,
        "Press SPACE or ESC\n to Continue",
        {
          fontSize: "32px",
          fill: "#000000",
          align: "center",
          fontStyle: "bold",
        }
      );
      this.menuText.setOrigin(0.5, 0.5);
      this.resumeKey.once("down", () => this.togglePause());
      this.pauseKey.once("down", () => this.togglePause());
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
      this.menuImage = this.add.image(768, 320, "menu");
    } catch {
      this.menuImage = this.add.rectangle(768, 320, 384, 448, 0x000000, 0.8);
    }
    this.menuText = this.add.text(
      768,
      320,
      `Stage ${this.stage} Cleared!\n💰RP: ${this.rp}\n\n🍎 Apple (10 RP): Heals 10 HP\n🥤 Soda (10 RP): +1 Speed\n🔥 Fire (10 RP): +5 Bullet DMG\n\nPress A for Apple\nS for Soda\nF for Fire\nPress SPACE or ESC to Start \nThe Next Stage`,
      { fontSize: "20px", fill: "#000000", align: "center", fontStyle: "bold" }
    );
    this.menuText.setOrigin(0.5, 0.5);

    this.input.keyboard.once("keydown-A", () => {
      if (this.rp >= 10 && this.hp < this.maxHp) {
        this.hp = Math.min(this.hp + 10, this.maxHp);
        this.rp -= 10;
      }
    });
    this.input.keyboard.once("keydown-S", () => {
      if (this.rp >= 10) {
        this.speed += 1;
        this.rp -= 10;
      }
    });
    this.input.keyboard.once("keydown-F", () => {
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
      this.targetKills += 3;
    };

    this.resumeKey.once("down", resume);
    this.pauseKey.once("down", resume);
  }
}
