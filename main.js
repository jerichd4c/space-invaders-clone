// Canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Inputs

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

const playerProjectiles = [];


window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Player class 

class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        // Position in canvas
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 5;
        this.color = 'lime';
        this.cooldown = 300
        this.lastShotTime = 0; 
    }

    draw(ctx) {

        ctx.fillStyle = this.color;
        // Draw the main body of the player
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Draw the turret of the player
        ctx.fillRect(this.x + this.width / 2 - 5, this.y - 10, 10, 10);
    }

    update() {
        // Move left without going out of bounds
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        // Move right without going out of bounds
        if (keys.ArrowRight && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
        // Handle shooting 
        if (keys.Space) {
            this.shoot();
        }
    }

    shoot() {
        const currentTime = Date.now();
        // Check if enough time has passed since the last shot
        if (currentTime - this.lastShotTime >= this.cooldown) {

            const projectileX = this.x + this.width / 2 - 2; // Center the projectile on the turret
            const projectileY = this.y - 10;

            playerProjectiles.push(new Projectile(projectileX, projectileY));

            this.lastShotTime = currentTime; // Update the last shot time

        }
    }
}

// Projectile class

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 7;
        this.color = 'white';

        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        // Substracting speed to y to move the projectile upwards
        this.y -= this.speed; 

        if (this.y + this.height < 0) {
            // If the projectile goes off the top of the canvas, mark it for deletion
            this.markedForDeletion = true;
        }
    }
}

// Alien class 

class Alien {
    constructor(x, y) {
        this.width = 40;
        this.height = 30;
        this.x = x;
        this.y = y;
        this.speed = 2000; // Horizontal speed per frame
        this.direction = 1; // 1 moves right, -1 moves left
        this.dropDistance = 20; // Pixels to drop when changing direction
        this.color = 'crimson';
        this.cooldown = 1200; // Time between shots in ms
        this.lastShotTime = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(boundaries) {
        // boundaries: { left: number, right: number }
        this.x += this.speed * this.direction;

        // Reverse direction and drop when hitting canvas edges
        if (this.x <= boundaries.left || this.x + this.width >= boundaries.right) {
            this.direction *= -1;
            this.y += this.dropDistance;
        }
    }

    canShoot() {
        const now = Date.now();
        return now - this.lastShotTime >= this.cooldown;
    }

    shoot(createProjectile) {
        // createProjectile should be a function that builds and stores the projectile
        if (!this.canShoot()) return;

        const projectileX = this.x + this.width / 2;
        const projectileY = this.y + this.height;

        createProjectile(projectileX, projectileY);
        this.lastShotTime = Date.now();
    }
}

// Helpers

function rectsIntersect(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Player instance 

const player = new Player();

// Aliens setup

const aliens = [
    new Alien(80, 60),
    new Alien(160, 60),
    new Alien(240, 60),
    new Alien(320, 60),
    new Alien(400, 60)
];

// Game loop

function gameLoop() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw the player
    player.update();

    // Draw new frame  
    player.draw(ctx);

    // Update and draw aliens
    aliens.forEach((alien) => {
        alien.update({ left: 0, right: canvas.width });
        alien.draw(ctx);
    });

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const projectile = playerProjectiles[i];
        projectile.update();

        // Check collision vs aliens
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            if (rectsIntersect(projectile, alien)) {
                projectile.markedForDeletion = true;
                aliens.splice(j, 1);
                break; 
            }
        }

        if (!projectile.markedForDeletion) {
            projectile.draw(ctx);
        } else {
            playerProjectiles.splice(i, 1);
        }
    }

    // Request the next frame and repeat the loop
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
