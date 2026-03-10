// Canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Inputs

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};


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

    // Request the next frame and repeat the loop
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
