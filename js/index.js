// Game Music
let gameMusic = new Audio('./music/gameMusic.mp3');
let gameOverMusic = new Audio('./music/gameOverMusic.mp3');
let chickenKilled = new Audio('./music/chickenKilled.mp3');

// Canvas board
let tileSize = 32;
let rows = 22;
let columns = 22;
let canvasBoard;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;
let context;

// Space ship
let shipWidth = tileSize * 3;
let shipHeight = tileSize * 3;
let shipX = (tileSize * columns) / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 3.5;
let spaceShip = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight,
};

// Chickens
let chickenArray = [];
let chickenWidth = tileSize * 2.5;
let chickenHeight = tileSize * 2.5;
let chickenX = tileSize;
let chickenY = tileSize;
let chickenImg;
let chickenRows = 2;
let chickenColumns = 3;
let chickenCount = 0; // Number of Chickens to defeat
let chickenVelocityX = 1; // Chickens moving speed

// Ship properties
let shipImg;
let shipVelocityX = tileSize * 2; // Ship moving speed

// Bullets
let bulletImg;
let bulletArray = [];
let bulletVelocityY = -10; // Bullet moving speed

// Eggs
let eggImg;
let eggArray = [];
let eggVelocityY = 1; // Egg moving speed

let score = 0;
let gameOver = false;

// Initialize the game on window load
window.onload = function () {
    canvasBoard = document.getElementById("canvasBoard");
    canvasBoard.width = boardWidth;
    canvasBoard.height = boardHeight;
    context = canvasBoard.getContext("2d"); // Used for drawing on the board

    // Load images
    shipImg = new Image();
    shipImg.src = "./images/spaceShip.PNG";
    shipImg.onload = function () {
        context.drawImage(
            shipImg,
            spaceShip.x,
            spaceShip.y,
            spaceShip.width,
            spaceShip.height
        );
    };

    chickenImg = new Image();
    chickenImg.src = "./images/chickeninvader.png";
    createChicken();

    bulletImg = new Image();
    bulletImg.src = "./images/bullet.png";

    eggImg = new Image();
    eggImg.src = "./images/egg.png"; // Provide the path to your egg image
    createEgg();

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);
    // document.addEventListener("keyup", shoot); //To press again and again for shooting
    document.addEventListener("keydown", shoot);

    // Event listener for restarting the game on Space key press
    document.addEventListener("keydown", function (e) {
        if (e.code == "Space" && gameOver) {
            resetGame();
            gameMusic.pause();
        }
    });
};

// Main game loop
function update() {
    animationId = requestAnimationFrame(update);
    gameMusic.play();

    if (gameOver) {
        cancelAnimationFrame(animationId);
        gameMusic.pause();
        return;
    }

    context.clearRect(0, 0, canvasBoard.width, canvasBoard.height);

    // Render space ship
    context.drawImage(
        shipImg,
        spaceShip.x,
        spaceShip.y,
        spaceShip.width,
        spaceShip.height
    );

    // Render Chickens
    for (let i = 0; i < chickenArray.length; i++) {
        let chicken = chickenArray[i];

        if (chicken.alive) {
            chicken.x += chickenVelocityX;

            // Check if Chicken touches the borders
            if (chicken.x + chicken.width >= canvasBoard.width || chicken.x <= 0) {
                chickenVelocityX *= -1;
                chicken.x += chickenVelocityX * 2;

                // Move all Chickens up by one row
                for (let j = 0; j < chickenArray.length; j++) {
                    chickenArray[j].y += chickenHeight;
                }
            }

            context.drawImage(
                chickenImg,
                chicken.x,
                chicken.y,
                chicken.width,
                chicken.height
            );

            if (chicken.y >= spaceShip.y) {
                // Game over if a Chicken reaches the space ship
                gameOver = true;
                gameOverMusic.play();
            }
        }
    }

    // Render bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;

        context.drawImage(
            bulletImg,
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );

        // Bullet collision with Chickens
        for (let j = 0; j < chickenArray.length; j++) {
            let chicken = chickenArray[j];

            if (!bullet.used && chicken.alive && detectCollision(bullet, chicken)) {
                bullet.used = true;
                chicken.alive = false;
                chickenKilled.play();
                chickenCount--;
                score += 500;
            }
        }
    }

    // Clear used bullets
    while (
        bulletArray.length > 0 &&
        (bulletArray[0].used || bulletArray[0].y < 0)
    ) {
        bulletArray.shift(); // Removes the first element of the array
    }

    // Randomly fire eggs from different chickens
    if (Math.random() < 0.002) {
        let randomChickenIndex = Math.floor(Math.random() * chickenArray.length);
        let randomChicken = chickenArray[randomChickenIndex];

        let egg = {
            x: randomChicken.x + randomChicken.width / 2 - tileSize / 2,
            y: randomChicken.y + randomChicken.height,
            width: tileSize,
            height: tileSize,
            eggImg: eggImg,
            used: false,
        };

        eggArray.push(egg);
    }

    // Render eggs
    for (let i = 0; i < eggArray.length; i++) {
        let egg = eggArray[i];
        egg.y += eggVelocityY;
        context.drawImage(eggImg, egg.x, egg.y, egg.width, egg.height);

        // Egg collision with Space Ship
        if (!egg.used && detectCollision(egg, spaceShip)) {
            egg.used = true;
            gameOver = true; // Game over if an egg hits the space ship
            gameOverMusic.play();
        }
    }

    // Clear used eggs
    while (
        eggArray.length > 0 &&
        (eggArray[0].used || eggArray[0].y > canvasBoard.height)
    ) {
        eggArray.shift();
    }

    // Advance to the next level
    if (chickenCount == 0) {
        chickenColumns = Math.min(chickenColumns + 1, columns / 2 - 5); // Cap at 16/2 - 2 = 6
        chickenRows = Math.min(chickenRows + 1, rows - 18); // Cap at 16 - 4 = 12

        if (chickenVelocityX > 0) {
            chickenVelocityX += 0.2; // Increase the alien movement speed towards the right
        } else {
            chickenVelocityX -= 0.2; // Increase the alien movement speed towards the left
        }

        chickenArray = [];
        bulletArray = [];
        createChicken();
    }

    // Render score
    context.fillStyle = "white";
    context.font = "16px courier";
    context.fillText(score, 5, 20);
}

// Move the ship based on key input
function moveShip(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "ArrowLeft" && spaceShip.x - shipVelocityX >= 0) {
        spaceShip.x -= shipVelocityX; // Move left one tile
    } else if (
        e.code == "ArrowRight" &&
        spaceShip.x + shipVelocityX + spaceShip.width <= canvasBoard.width
    ) {
        spaceShip.x += shipVelocityX; // Move right one tile
    }
}

// Initialize Chickens on the board
function createChicken() {
    for (let c = 0; c < chickenColumns; c++) {
        for (let r = 0; r < chickenRows; r++) {
            let chicken = {
                img: chickenImg,
                x: chickenX + c * chickenWidth * 1.2,
                y: chickenY + r * chickenHeight * 1.2,
                width: chickenWidth,
                height: chickenHeight,
                alive: true,
            };
            chickenArray.push(chicken);
        }
    }
    chickenCount = chickenArray.length;
}

// Shoot bullets on Space key press
function shoot(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "Space") {
        let bullet = {
            x: spaceShip.x + (shipWidth * 0.2) / 32,
            y: spaceShip.y,
            width: tileSize * 3,
            height: tileSize * 3,
            bulletImg: bulletImg,
            used: false,
        };
        bulletArray.push(bullet);
    }
}

// Create eggs to be fired randomly from Chickens
function createEgg() {
    let eggsToFire = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < eggsToFire; i++) {
        let randomChickenIndex = Math.floor(Math.random() * chickenArray.length);
        let randomChicken = chickenArray[randomChickenIndex];

        let egg = {
            x: randomChicken.x + randomChicken.width / 2 - tileSize / 2,
            y: randomChicken.y + randomChicken.height,
            width: tileSize,
            height: tileSize,
            eggImg: eggImg,
            used: false,
        };

        eggArray.push(egg);
    }
}

// Check for collision between two objects
function detectCollision(a, b) {
    return (
        a.x < b.x + b.width / 2 &&
        a.x + a.width / 2 > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Reset the game state
function resetGame() {
    score = 0;
    gameOver = false;
    chickenArray = [];
    bulletArray = [];
    gameOverMusic.pause();
    gameOverMusic.currentTime = 0;
    createChicken();

    // Reset space ship position
    spaceShip.x = (tileSize * columns) / 2 - tileSize;
    spaceShip.y = tileSize * rows - tileSize * 3.5;

    // Reset chicken speed and columns/rows
    chickenVelocityX = 1;
    chickenCount = 0;
    chickenColumns = 2;
    chickenRows = 1;

    eggArray = [];
    createEgg();

    bulletVelocityY = -10;

    // Reinitialize the game loop
    requestAnimationFrame(update);
}
