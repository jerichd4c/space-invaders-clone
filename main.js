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

// Player instance 

const player = new Player();

// Game loop

function gameLoop() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw the player
    player.update();

    // Draw new frame  
    player.draw(ctx);

    playerProjectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw(ctx);

        // Remove projectiles that are marked for deletion
        if (projectile.markedForDeletion) {
            playerProjectiles.splice(index, 1);
        }
    });

    // Request the next frame and repeat the loop
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
