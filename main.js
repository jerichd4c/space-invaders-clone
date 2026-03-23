const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stageValue = document.getElementById('stage-value');
const scoreValue = document.getElementById('score-value');

const alienSprites = {
    frame1: new Image(),
    frame2: new Image(),
    death: new Image()
};
alienSprites.frame1.src = 'sprites/Invader_sprite1-export.png';
alienSprites.frame2.src = 'sprites/Invader_sprite2-export.png';
alienSprites.death.src = 'sprites/Invader_death_animation-export.png';

const playerSprites = {
    alive: new Image(),
    death1: new Image(),
    death2: new Image()
};
playerSprites.alive.src = 'sprites/Ship-export.png';
playerSprites.death1.src = 'sprites/Death_animation1-export.png';
playerSprites.death2.src = 'sprites/Death_animation2-export.png';

const impactSprite = new Image();
impactSprite.src = 'sprites/Impact_effect-export.png';

const barrierSprite = new Image();
barrierSprite.src = 'sprites/Barrier_fixed-export.png';

const sounds = {
    shoot: new Audio('sounds/shoot.wav'),
    explosion: new Audio('sounds/explosion.wav'),
    crash: new Audio('sounds/crash.wav'),
    move: [
        new Audio('sounds/fastinvader1.wav'),
        new Audio('sounds/fastinvader2.wav'),
        new Audio('sounds/fastinvader3.wav'),
        new Audio('sounds/fastinvader4.wav')
    ]
};
let lastMoveSoundTime = 0;
let moveSoundIndex = 0;

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
const enemyProjectiles = [];
let lastAlienShotTime = 0;
const alienShootCooldownBase = 1200;
const alienShootChance = 0.35;


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
        this.width = 75;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 60;
        this.speed = 2.5;
        this.cooldown = 500;
        this.lastShotTime = 0;
        this.state = 'alive';
        this.deathTimer = 0;
    }

    draw(ctx) {
        if (this.state === 'alive') {
            ctx.drawImage(playerSprites.alive, this.x, this.y, this.width, this.height);
        } else if (this.state === 'dying') {
            const now = Date.now();
            const frame = Math.floor((now - this.deathTimer) / 150) % 2;
            const sprite = frame === 0 ? playerSprites.death1 : playerSprites.death2;
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
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

        sounds.shoot.currentTime = 0;
        sounds.shoot.play().catch(() => { });
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
        this.state = 'moving';
        this.impactTimer = 0;
        this.markedForDeletion = false;
    }

    draw(ctx) {
        if (this.state === 'moving') {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.state === 'impact') {
            const size = 50;
            ctx.drawImage(impactSprite, this.x - size / 2 + this.width / 2, 0, size, size);
        }
    }

    update() {
        if (this.state === 'moving') {
            this.y -= this.speed;
            if (this.y < 100) this.color = 'red';
            if (this.y <= 0) {
                this.y = 0;
                this.state = 'impact';
                this.impactTimer = Date.now();
                sounds.crash.currentTime = 0;
                sounds.crash.play().catch(() => { });
            }
        } else if (this.state === 'impact') {
            if (Date.now() - this.impactTimer > 200) {
                this.markedForDeletion = true;
            }
        }
    }
}

class Alien {
    constructor(x, y, row, col) {
        this.width = 65;
        this.height = 50;
        this.x = x;
        this.y = y;
        this.state = 'alive';
        this.deathTimer = 0;
        this.markedForDeletion = false;
        this.row = row;
        this.col = col;
    }

    draw(ctx) {
        if (this.state === 'alive') {
            const sprite = (moveSoundIndex % 2 === 0) ? alienSprites.frame1 : alienSprites.frame2;
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else if (this.state === 'dying') {
            ctx.drawImage(alienSprites.death, this.x, this.y, this.width, this.height);
        }
    }

    update() {
        if (this.state === 'dying') {
            const now = Date.now();
            if (now - this.deathTimer > 300) {
                this.markedForDeletion = true;
            }
        }
    }
}

class BarrierBlock {
    constructor(x, y, localCol, localRow, size = 10) {
        this.width = size;
        this.height = size;
        this.x = x;
        this.y = y;
        this.localCol = localCol;
        this.localRow = localRow;
        this.markedForDeletion = false;
    }

    draw(ctx) {
        // Sprite may be higher resolution than the 6-col x 4-row block grid.
        // Scale the source rect proportionally so each block samples its
        // correct portion of the sprite at any resolution.
        const cols = 6;
        const rows = 4;
        const sw = barrierSprite.naturalWidth / cols;
        const sh = barrierSprite.naturalHeight / rows;
        ctx.drawImage(
            barrierSprite,
            this.localCol * sw, this.localRow * sh, sw, sh,
            this.x, this.y, this.width, this.height
        );
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
    const blockSize = 21;
    const shape = [
        [0, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 1, 1]
    ];

    for (let i = 0; i < 4; i++) {
        const startX = spacing * (i + 1) - (shape[0].length * blockSize) / 2;
        const startY = canvas.height - 240;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    barrierBlocks.push(new BarrierBlock(startX + c * blockSize, startY + r * blockSize, c, r, blockSize));
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
            const x = startX + c * (65 + gapX);
            const y = startY + r * (50 + gapY);
            aliens.push(new Alien(x, y, r, c));
        }
    }
    formationDirection = 1;
}

function getFrontlineAliens() {
    const frontlineByCol = new Map();

    aliens.forEach((alien) => {
        if (alien.state !== 'alive') return;
        const existing = frontlineByCol.get(alien.col);
        if (!existing || alien.y > existing.y) {
            frontlineByCol.set(alien.col, alien);
        }
    });

    return Array.from(frontlineByCol.values());
}

class EnemyProjectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 14;
        this.speed = 3;
        this.color = 'lime';
        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.markedForDeletion = true;
        }
    }
}

function getAlienShootCooldown() {
    return Math.max(450, alienShootCooldownBase - (stage - 1) * 80);
}

function tryAlienShoot() {
    if (gameOver || aliens.length === 0) return;

    const now = Date.now();
    if (now - lastAlienShotTime < getAlienShootCooldown()) return;
    if (Math.random() > alienShootChance) return;

    const frontline = getFrontlineAliens();
    if (!frontline.length) return;

    const shooter = frontline[Math.floor(Math.random() * frontline.length)];
    enemyProjectiles.push(new EnemyProjectile(shooter.x + shooter.width / 2 - 2, shooter.y + shooter.height));
    lastAlienShotTime = now;

    sounds.shoot.currentTime = 0;
    sounds.shoot.play().catch(() => { });
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
        let aliveCount = 0;

        aliens.forEach((alien) => {
            if (alien.state === 'alive') {
                minX = Math.min(minX, alien.x);
                maxX = Math.max(maxX, alien.x + alien.width);
                aliveCount++;
            }
        });

        if (aliveCount > 0 && (minX <= 0 || maxX >= canvas.width)) {
            formationDirection *= -1;
            aliens.forEach((alien) => {
                if (alien.state === 'alive') alien.y += formationDrop;
            });
        }

        const now = Date.now();
        const delay = Math.max(100, 800 - (formationSpeed * 150));
        if (now - lastMoveSoundTime > delay) {
            const currentSound = sounds.move[moveSoundIndex];
            currentSound.currentTime = 0;
            currentSound.play().catch(() => { });
            moveSoundIndex = (moveSoundIndex + 1) % 4;
            lastMoveSoundTime = now;
        }
    }

    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];

        alien.update();
        if (alien.markedForDeletion) {
            aliens.splice(i, 1);
            continue;
        }

        if (!gameOver && alien.state === 'alive') {
            alien.x += formationSpeed * formationDirection;
            if (rectsIntersect(alien, player) || alien.y + alien.height >= player.y) {
                gameOver = true;
                player.state = 'dying';
                player.deathTimer = Date.now();
                sounds.crash.currentTime = 0;
                sounds.crash.play().catch(() => { });
            }

            // Check collision vs barriers
            for (let b = 0; b < barrierBlocks.length; b++) {
                if (!barrierBlocks[b].markedForDeletion && rectsIntersect(alien, barrierBlocks[b])) {
                    barrierBlocks[b].markedForDeletion = true;
                }
            }
        }

        alien.draw(ctx);
    }

    tryAlienShoot();

    if (!gameOver && aliens.length === 0) {
        stage += 1;
        playerProjectiles.length = 0;
        enemyProjectiles.length = 0;
        createFormation();
        updateHUD();
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = enemyProjectiles[i];
        projectile.update();

        if (!projectile.markedForDeletion && player.state === 'alive' && rectsIntersect(projectile, player)) {
            projectile.markedForDeletion = true;
            gameOver = true;
            player.state = 'dying';
            player.deathTimer = Date.now();
            sounds.crash.currentTime = 0;
            sounds.crash.play().catch(() => { });
        }

        if (!projectile.markedForDeletion) {
            for (let b = 0; b < barrierBlocks.length; b++) {
                if (!barrierBlocks[b].markedForDeletion && rectsIntersect(projectile, barrierBlocks[b])) {
                    barrierBlocks[b].markedForDeletion = true;
                    projectile.markedForDeletion = true;
                    break;
                }
            }
        }

        if (!projectile.markedForDeletion) {
            projectile.draw(ctx);
        } else {
            enemyProjectiles.splice(i, 1);
        }
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
                if (alien.state !== 'alive' || !rectsIntersect(projectile, alien)) continue;

                projectile.markedForDeletion = true;
                alien.state = 'dying';
                alien.deathTimer = Date.now();
                score += 100;
                updateHUD();

                sounds.explosion.currentTime = 0;
                sounds.explosion.play().catch(() => { });
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
