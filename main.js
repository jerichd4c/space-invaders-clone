const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stageValue = document.getElementById('stage-value');
const scoreValue = document.getElementById('score-value');

let gameOver = false;
let formationDirection = 1;
const formationDrop = 20;
let stage = 1;
const formationSpeedBase = 0.5;
let formationSpeed = formationSpeedBase;
let score = 0;

function updateHUD() {
    stageValue.textContent = stage;
    scoreValue.textContent = score;
}

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

const playerProjectiles = [];


window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 2.5;
        this.color = 'lime';
        this.cooldown = 500;
        this.lastShotTime = 0; 
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + this.width / 2 - 5, this.y - 10, 10, 10);
    }

    update() {
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
        if (keys.Space) {
            this.shoot();
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime < this.cooldown) return;

        const projectileX = this.x + this.width / 2 - 2;
        const projectileY = this.y - 10;
        playerProjectiles.push(new Projectile(projectileX, projectileY));
        this.lastShotTime = now;
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 4;
        this.color = 'white';

        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed; 

        if (this.y + this.height < 0) this.markedForDeletion = true;
    }
}

class Alien {
    constructor(x, y) {
        this.width = 40;
        this.height = 30;
        this.x = x;
        this.y = y;
        this.color = 'crimson';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class BarrierBlock {
    constructor(x, y) {
        this.width = 10;
        this.height = 10;
        this.x = x;
        this.y = y;
        this.color = '#33ff00';
        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function rectsIntersect(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

const player = new Player();

const aliens = [];
let barrierBlocks = [];

function initBarriers() {
    barrierBlocks = [];
    const spacing = canvas.width / 5;
    const blockSize = 10;
    const shape = [
        [0, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 1, 1]
    ];
    
    for (let i = 0; i < 4; i++) {
        const startX = spacing * (i + 1) - (shape[0].length * blockSize) / 2;
        const startY = canvas.height - 150;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    barrierBlocks.push(new BarrierBlock(startX + c * blockSize, startY + r * blockSize));
                }
            }
        }
    }
}

function createFormation(rows = 4, cols = 8) {
    aliens.length = 0;
    const startX = 60;
    const startY = 60;
    const gapX = 20;
    const gapY = 24;

    formationSpeed = formationSpeedBase + (stage - 1) * 0.15;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = startX + c * (40 + gapX);
            const y = startY + r * (30 + gapY);
            aliens.push(new Alien(x, y));
        }
    }
    formationDirection = 1;
}

// Game loop

function gameLoop() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw the player
    if (!gameOver) {
        player.update();
    }

    // Draw new frame  
    player.draw(ctx);

    // Update and draw barriers
    for (let i = barrierBlocks.length - 1; i >= 0; i--) {
        if (barrierBlocks[i].markedForDeletion) {
            barrierBlocks.splice(i, 1);
        } else {
            barrierBlocks[i].draw(ctx);
        }
    }

    // Update and draw aliens
    if (!gameOver && aliens.length) {
        let minX = Infinity;
        let maxX = -Infinity;

        aliens.forEach((alien) => {
            minX = Math.min(minX, alien.x);
            maxX = Math.max(maxX, alien.x + alien.width);
        });

        if (minX <= 0 || maxX >= canvas.width) {
            formationDirection *= -1;
            aliens.forEach((alien) => {
                alien.y += formationDrop;
            });
        }
    }

    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];

        if (!gameOver) {
            alien.x += formationSpeed * formationDirection;
            if (rectsIntersect(alien, player) || alien.y + alien.height >= player.y) gameOver = true;
            
            // Check collision vs barriers
            for (let b = 0; b < barrierBlocks.length; b++) {
                if (!barrierBlocks[b].markedForDeletion && rectsIntersect(alien, barrierBlocks[b])) {
                    barrierBlocks[b].markedForDeletion = true;
                }
            }
        }

        alien.draw(ctx);
    }

    if (!gameOver && aliens.length === 0) {
        stage += 1;
        playerProjectiles.length = 0;
        createFormation();
        updateHUD();
    }

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const projectile = playerProjectiles[i];
        projectile.update();

        // Check collision vs barriers
        for (let b = 0; b < barrierBlocks.length; b++) {
            if (!barrierBlocks[b].markedForDeletion && rectsIntersect(projectile, barrierBlocks[b])) {
                barrierBlocks[b].markedForDeletion = true;
                projectile.markedForDeletion = true;
                break;
            }
        }

        if (!projectile.markedForDeletion) {
            // Check collision vs aliens
            for (let j = aliens.length - 1; j >= 0; j--) {
                const alien = aliens[j];
                if (!rectsIntersect(projectile, alien)) continue;

                projectile.markedForDeletion = true;
                aliens.splice(j, 1);
                score += 100;
                updateHUD();
                break;
            }
        }

        if (!projectile.markedForDeletion) {
            projectile.draw(ctx);
        } else {
            playerProjectiles.splice(i, 1);
        }
    }

    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '28px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Courier New';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }

    // Request the next frame and repeat the loop
    requestAnimationFrame(gameLoop);
}

// Start the game loop
initBarriers();
createFormation();
updateHUD();
gameLoop();
