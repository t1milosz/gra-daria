const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Gracz ---
const player = { x: 100, y: 200, width: 50, height: 50, onGround: true };
const jumpDuration = 20;
let jumpTimer = 0;

// --- Przeszkody ---
let obstacles = [];
let spawnTimer = 0;
let speed = 3;  // wolny start

// --- Punkty ---
let score = 0;

// --- Tło ---
let bgIndex = 0;
const bgColors = ["#ffffff", "#c8e6ff", "#ffc8c8", "#c8ffc8"];
let bgColor = bgColors[bgIndex];

// --- Bonus efekty ---
let bonusEffects = [];

// --- Koniec gry ---
let gameOver = false;

// --- Ekran startowy ---
let gameStarted = false;

// --- Obrazy ---
const playerImg = new Image(); playerImg.src = "images/player.png";
const groundImg = new Image(); groundImg.src = "images/ground.png";
const airImg = new Image(); airImg.src = "images/air.png";
const bonusImg = new Image(); bonusImg.src = "images/bonus.png";
const endIcon = new Image(); endIcon.src = "images/end.png";

// --- Start po wczytaniu obrazów ---
let imagesLoaded = 0;
[playerImg, groundImg, airImg, bonusImg, endIcon].forEach(img => {
    img.onload = () => { 
        imagesLoaded++; 
        if(imagesLoaded === 5) startGame();
    }
});

// --- Obsługa klawiszy ---
let keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// --- Reset gry ---
function resetGame() {
    player.y = 200; player.onGround = true; jumpTimer = 0;
    obstacles = []; spawnTimer = 0; score = 0; speed = 3;
    bgIndex = 0; bgColor = bgColors[bgIndex]; bonusEffects = [];
    gameOver = false; gameStarted = false;
}

// --- Start gry ---
function startGame() {
    canvas.addEventListener("click", () => { if (!gameStarted) gameStarted = true; });
    gameLoop();
}

// --- Główna pętla ---
function gameLoop() {
    // --- Tło ---
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Ekran startowy ---
    if (!gameStarted) {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText("Kliknij, aby zacząć!", canvas.width/2 - 80, canvas.height/2);
        requestAnimationFrame(gameLoop);
        return;
    }

    // --- Ekran końcowy ---
    if (gameOver) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(endIcon, canvas.width/2 - 100, canvas.height/2 - 100, 200, 200);
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText(`Twój wynik: ${score}`, canvas.width/2 - 80, canvas.height/2 + 130);
        ctx.font = "20px Arial";
        ctx.fillText("Kliknij, aby zagrać ponownie", canvas.width/2 - 120, canvas.height/2 + 160);
        canvas.addEventListener("click", resetGame, { once: true });
        requestAnimationFrame(gameLoop);
        return;
    }

    // --- Skok gracza ---
    if (keys["Space"] && player.onGround) {
        jumpTimer = jumpDuration;
        player.onGround = false;
    }

    if (jumpTimer > 0) {
        player.y -= 12;  // większy skok
        jumpTimer--;
    } else if (!player.onGround) {
        player.y += 2;   // wolne opadanie
        if (player.y >= 200) player.onGround = true;
    }

    // --- Spawn przeszkód ---
    spawnTimer++;
    let canSpawn = obstacles.length === 0 || obstacles[obstacles.length-1].rect.x < canvas.width - 450;
    if (spawnTimer > 60 && canSpawn) {
        const types = ["ground","air","bonus"];
        const typ = types[Math.floor(Math.random()*types.length)];
        let rect;
        if (typ === "ground") rect = {x: canvas.width, y:215, width:30, height:35};
        else if (typ==="air") rect = {x: canvas.width, y:160, width:35, height:25};
        else rect = {x: canvas.width, y:180, width:40, height:40};
        obstacles.push({rect, type: typ, passed: false});
        spawnTimer = Math.floor(Math.random()*(90-50)+50);
    }

    // --- Ruch przeszkód ---
    obstacles.forEach(o => o.rect.x -= speed);

    // --- Kolizje i punkty ---
    obstacles.forEach(o => {
        const pRect = player;
        const oRect = o.rect;

        if (pRect.x < oRect.x + oRect.width &&
            pRect.x + pRect.width > oRect.x &&
            pRect.y < oRect.y + oRect.height &&
            pRect.y + pRect.height > oRect.y) {

            if (o.type === "bonus") {
                score += 1;
                bonusEffects.push({rect: {...o.rect}, timer: 10});
                obstacles.splice(obstacles.indexOf(o),1);
            } else {
                gameOver = true;
            }

        } else {
            if (!o.passed && oRect.x + oRect.width < player.x) {
                if(o.type !== "bonus") score += 1;
                o.passed = true;
                if (score % 10 === 0) speed += 0.3; // przyspieszenie
            }
        }
    });

    // --- Koniec gry po 50 punktach ---
    if (score >= 50) gameOver = true;

    // --- Rysowanie gracza ---
    ctx.drawImage(playerImg, player.x, player.y, player.width * 2.0, player.height * 2.0);

    // --- Rysowanie przeszkód ---
    obstacles.forEach(o => {
        if(o.type==="ground") ctx.drawImage(groundImg, o.rect.x, o.rect.y, o.rect.width * 1.5, o.rect.height * 1.5);
else if(o.type==="air") ctx.drawImage(airImg, o.rect.x, o.rect.y, o.rect.width * 1.5, o.rect.height * 1.5);
else ctx.drawImage(bonusImg, o.rect.x, o.rect.y, o.rect.width * 1.5, o.rect.height * 1.5);
    });

    // --- Efekty bonusów ---
    bonusEffects.forEach((effect, index) => {
        const size = 60 + (10 - effect.timer); // większe efekty
ctx.drawImage(bonusImg, effect.rect.x - (size-60)/2, effect.rect.y - (size-60)/2, size, size);
        effect.timer--;
        if (effect.timer <= 0) bonusEffects.splice(index, 1);
    });

    // --- Punkty ---
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 25);

    // --- Zmiana tła co 10 punktów ---
    if (Math.floor(score/10) > bgIndex) {
        bgIndex = (bgIndex + 1) % bgColors.length;
        bgColor = bgColors[bgIndex];
    }

    requestAnimationFrame(gameLoop);
}