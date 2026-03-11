const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const paddleWidth = 18,
    paddleHeight = 120,
    paddleSpeed = 8,
    ballRadius = 12,
    initialBallSpeed = 8,
    maxBallSpeed = 40,
    netWidth = 5,
    netColor = "WHITE";

// Difficulty levels
const difficulties = {
    easy: { speed: 6, maxSpeed: 30 },
    medium: { speed: 8, maxSpeed: 40 },
    hard: { speed: 12, maxSpeed: 50 }
};
let currentDifficulty = 'medium';

// Draw net on canvas
function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(canvas.width / 2 - netWidth / 2, i, netWidth, 10, netColor);
    }
}

// Draw rectangle on canvas
function drawRect(x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

// Draw a circle on canvas
function drawCircle(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

// Draw text on canvas
function drawText(text, x, y, color, fontSize = 60, fontWeight = 'bold', font = "Courier New") {
    context.fillStyle = color;
    context.font = `${fontWeight} ${fontSize}px ${font}`;
    context.textAlign = "center";
    context.fillText(text, x, y);
}

// Create a paddle object
function createPaddle(x, y, width, height, color) {
    return { x, y, width, height, color, score: 0 };
}

// Create a ball object
function createBall(x, y, radius, velocityX, velocityY, color) {
    return { x, y, radius, velocityX, velocityY, color, speed: initialBallSpeed };
}

// Define user and computer paddle objects
const user = createPaddle(0, canvas.height / 2 - paddleHeight / 2, paddleWidth, paddleHeight, "WHITE");

const com = createPaddle(canvas.width - paddleWidth, canvas.height / 2 - paddleHeight / 2, paddleWidth, paddleHeight, "WHITE");

// Define ball object
const ball = createBall(canvas.width / 2, canvas.height / 2, ballRadius, initialBallSpeed, initialBallSpeed, "WHITE");

// Game state
let isPaused = true;
let gameState = 'menu'; // 'menu' or 'playing'

// Difficulty menu button positions
const difficultyButtons = [
    { label: 'Easy', value: 'easy', x: null, y: null, width: 220, height: 70 },
    { label: 'Medium', value: 'medium', x: null, y: null, width: 220, height: 70 },
    { label: 'Hard', value: 'hard', x: null, y: null, width: 220, height: 70 }
];

// Calculate button positions after canvas is sized
function setButtonPositions() {
    const startY = canvas.height / 2 + 60;
    difficultyButtons.forEach((btn, i) => {
        btn.x = canvas.width / 2 - btn.width / 2;
        btn.y = startY + i * (btn.height + 20);
    });
}
setButtonPositions();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setButtonPositions();
});

// Update user paddle position based on mouse movement (only in playing state)
function movePaddle(event) {
    const rect = canvas.getBoundingClientRect();
    user.y = event.clientY - rect.top - user.height / 2;
}

canvas.addEventListener('mousemove', (event) => {
    if (gameState !== 'playing') return;
    movePaddle(event);
});

// Handle difficulty selection and start game from main menu
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Difficulty selection in menu or paused state
    if (gameState === 'menu' || (gameState === 'playing' && isPaused)) {
        for (const btn of difficultyButtons) {
            if (
                mouseX >= btn.x &&
                mouseX <= btn.x + btn.width &&
                mouseY >= btn.y &&
                mouseY <= btn.y + btn.height
            ) {
                // If difficulty changed, reset scores and ball
                if (currentDifficulty !== btn.value) {
                    currentDifficulty = btn.value;
                    ball.speed = difficulties[currentDifficulty].speed;
                    ball.velocityX = difficulties[currentDifficulty].speed;
                    ball.velocityY = difficulties[currentDifficulty].speed;
                    user.score = 0;
                    com.score = 0;
                    resetBall();
                }
                // If in menu, start game
                if (gameState === 'menu') {
                    gameState = 'playing';
                    isPaused = false;
                }
                break;
            }
        }
    }
});

// Pause/unpause game on spacebar/escape press (only in playing state)
document.addEventListener('keydown', (event) => {
    if (gameState === 'playing' && (event.code === 'Escape' || event.code === 'Space')) {
        isPaused = !isPaused;
    }
});

// Check for collision between ball and paddle
function collision(b, p) {
    return (
        b.x + b.radius > p.x && b.x - b.radius < p.x + p.width && b.y + b.radius > p.y && b.y - b.radius < p.y + p.height
    );
}

// Reset ball position and velocity
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = Math.random() * (canvas.height - ball.radius * 2) + ball.radius;
    ball.velocityX = -ball.velocityX;
    // Set speed to current difficulty's speed
    ball.speed = difficulties[currentDifficulty].speed;
}

// Update game logic
function update() {
    if (gameState !== 'playing' || isPaused) return;

    // Check for score and reset ball if necessary
    if (ball.x - ball.radius < 0) {
        com.score++;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        user.score++;
        resetBall();
    }

    // Update ball position
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Update computer paddle position based on ball position
    com.y += (ball.y - (com.y + com.height / 2)) * 0.1;

    // Top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }

    // Determine which paddle is begin hit by the ball and handle collision
    let player = ball.x + ball.radius < canvas.width / 2 ? user : com;
    if (collision(ball, player)) {
        const collidePoint = ball.y - (player.y + player.height / 2);
        const collisionAngle = (Math.PI / 4) * (collidePoint / (player.height / 2));
        const direction = ball.x + ball.radius < canvas.width / 2 ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(collisionAngle);
        ball.velocityY = ball.speed * Math.sin(collisionAngle);

        // Increase ball speed and limit to max speed
        ball.speed += 0.2;
        if (ball.speed > maxBallSpeed) {
            ball.speed = maxBallSpeed;
        }
    }
}

// Render game on canvas
function render() {
    // Clear canvas with black screen
    drawRect(0, 0, canvas.width, canvas.height, "BLACK");

    if (gameState === 'menu' || (gameState === 'playing' && isPaused)) {
        // Draw title card
        drawText("PONG", canvas.width / 2, canvas.height / 2 - 100, "WHITE", 120, 'bold');
        drawText("Select Difficulty", canvas.width / 2, canvas.height / 2, "GRAY", 48, 'bold');
        // Draw difficulty buttons
        difficultyButtons.forEach(btn => {
            context.fillStyle = btn.value === currentDifficulty ? "#444" : "#222";
            context.fillRect(btn.x, btn.y, btn.width, btn.height);
            context.strokeStyle = "WHITE";
            context.lineWidth = 3;
            context.strokeRect(btn.x, btn.y, btn.width, btn.height);
            drawText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2 + 18, "WHITE", 40, 'bold');
        });
        if (gameState === 'menu') {
            drawText("Click a button to start", canvas.width / 2, canvas.height - 80, "GRAY", 32, 'bold');
        } else {
            drawText("Paused - Click difficulty to change", canvas.width / 2, canvas.height - 80, "GRAY", 32, 'bold');
        }
        return;
    }

    drawNet();

    // Draw scores
    drawText(user.score, canvas.width / 4, canvas.height / 2, "GRAY", 120, 'bold');
    drawText(com.score, (3 * canvas.width) / 4, canvas.height / 2, "GRAY", 120, 'bold');

    // Draw paddles
    drawRect(user.x, user.y, user.width, user.height, user.color);
    drawRect(com.x, com.y, com.width, com.height, com.color);

    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);

    // Draw pause text if paused
    if (isPaused) {
        drawText("PAUSED", canvas.width / 2, canvas.height / 2, "WHITE", 60, 'bold');
    }
}


// Run game loop
function gameLoop() {
    update();
    render();
}

// Set gameLoop to run at 60 frame per second
const framePerSec = 60;
setInterval(gameLoop, 1000 / framePerSec);