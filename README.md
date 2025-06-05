# SoloRogue

A browser-based turn-based RPG roguelike fitness game built with Phaser.js.  
Progress through workout-based challenges and gain RoguePoints (RP) to grow stronger.

## Project Structure

```
.
├── assets/
│   ├── sprites/         # All sprite images (player, enemies, bullets, potions)
│   ├── tilemaps/        # Tiled JSON map files
│   └── tilesets/        # Tileset images used in maps
├── js/
│   ├── main.js          # Entry point for Phaser game
│   └── scenes/          # All game scenes
├── index.html           # Game bootstrap
└── README.md            # Project description
```

## Running the Game

You can use a local server to run the game:

```bash
npx live-server .
# or
npx http-server .
```
