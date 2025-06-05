#!/bin/bash

# Exit immediately on error
set -e

echo "📁 Creating directory structure..."

mkdir -p assets/sprites
mkdir -p assets/tilemaps
mkdir -p assets/tilesets
mkdir -p js/scenes

echo "📄 Creating placeholder files..."

touch assets/sprites/player.png
touch assets/sprites/enemy_runner.png
touch assets/sprites/enemy_shooter.png
touch assets/sprites/bullet.png
touch assets/sprites/potions.png

touch assets/tilemaps/.keep
touch assets/tilesets/tileset.png

touch js/main.js
touch js/scenes/BootScene.js
touch js/scenes/PreloadScene.js
touch js/scenes/GameScene.js
touch js/scenes/UIScene.js
touch js/scenes/ShopScene.js
touch js/scenes/BossScene.js

echo "🌐 Creating index.html..."
cat <<EOF > index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>SoloRogue</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js"></script>
    <script type="module" src="js/main.js"></script>
</head>
<body>
    <h1>Loading SoloRogue...</h1>
</body>
</html>
EOF

echo "📝 Creating README.md..."
cat <<EOF > README.md
# SoloRogue

A browser-based turn-based RPG roguelike fitness game built with Phaser.js.  
Progress through workout-based challenges and gain RoguePoints (RP) to grow stronger.

## Project Structure

\`\`\`
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
\`\`\`

## Running the Game

You can use a local server to run the game:

\`\`\`bash
npx live-server .
# or
npx http-server .
\`\`\`
EOF

echo "📦 Checking for Node.js and npm..."
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "✔ Node and npm found."

    echo "🛠 Installing live-server and http-server locally..."
    npm install --save-dev live-server http-server

    echo "🔧 Add this to your package.json scripts (if applicable):"
    echo "\"scripts\": {"
    echo "  \"start\": \"live-server .\","
    echo "  \"serve\": \"http-server .\""
    echo "}"
else
    echo "⚠ Node.js or npm not found. Skipping server setup. Please install them to use live-server or http-server."
fi

echo "✅ Setup complete."
