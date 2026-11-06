const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600; 
canvas.height = 900;

let gameActive = true, bullets = [], powerUp = null, walls = [];
const keys = {};

class Tank {
    constructor(x, y, color, id) {
        this.startX = x; this.startY = y; this.color = color; this.id = id;
        this.init();
    }
    init() {
        this.x = this.startX; this.y = this.startY;
        this.w = 28; this.h = 28; 
        this.dir = this.id === 1 ? "UP" : "DOWN";
        this.speed = 4; this.shield = false; this.alive = true;
    }
    draw() {
        if (!this.alive) return;
        ctx.fillStyle = this.shield ? "#00fbff" : this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#111";
        
        if (this.dir === "UP") ctx.fillRect(this.x + 11, this.y - 12, 6, 12);
        if (this.dir === "DOWN") ctx.fillRect(this.x + 11, this.y + 28, 6, 12);
        if (this.dir === "LEFT") ctx.fillRect(this.x - 12, this.y + 11, 12, 6);
        if (this.dir === "RIGHT") ctx.fillRect(this.x + 28, this.y + 11, 12, 6);
    }
}

const p1 = new Tank(285, 820, "#2e7d32", 1);
const p2 = new Tank(285, 50, "#c62828", 2);

// ربط أزرار الحركة باللمس مع معالجة اتجاهات اللاعب الثاني المقلوب
function setupKey(btnId, logicalKey) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.ontouchstart = (e) => { e.preventDefault(); keys[logicalKey] = true; };
    btn.ontouchend = (e) => { e.preventDefault(); keys[logicalKey] = false; };
}

// أزرار اللاعب الأول (الأخضر - اتجاهات طبيعية)
setupKey("p1Up", "p1Up");
setupKey("p1Down", "p1Down");
setupKey("p1Left", "p1Left");
setupKey("p1Right", "p1Right");

// أزرار اللاعب الثاني (الأحمر - يتم عكس الحركة برمجياً لأن الحاوية مقلوبة 180 درجة CSS)
setupKey("p2Up", "p2Down");   
setupKey("p2Down", "p2Up");   
setupKey("p2Left", "p2Right"); 
setupKey("p2Right", "p2Left"); 

// تفعيل أزرار النار باللمس الفوري للتابلت
document.getElementById("p1Fire").ontouchstart = (e) => { e.preventDefault(); shoot(p1); };
document.getElementById("p2Fire").ontouchstart = (e) => { e.preventDefault(); shoot(p2); };
document.getElementById("restartBtn").onclick = resetGame;

function shoot(tank) {
    if (!gameActive || !tank.alive) return;
    let bx = tank.x + 12, by = tank.y + 12, bdx = 0, bdy = 0;
    if (tank.dir === "UP") bdy = -10;
    if (tank.dir === "DOWN") bdy = 10;
    if (tank.dir === "LEFT") bdx = -10;
    if (tank.dir === "RIGHT") bdx = 10;
    bullets.push({ x: bx, y: by, dx: bdx, dy: bdy, owner: tank.id });
}

function update() {
    if (!gameActive) return;
    [p1, p2].forEach(p => {
        const k = `p${p.id}`;
        let oldX = p.x, oldY = p.y;
        if (keys[k+"Up"]) { p.y -= p.speed; p.dir = "UP"; }
        else if (keys[k+"Down"]) { p.y += p.speed; p.dir = "DOWN"; }
        else if (keys[k+"Left"]) { p.x -= p.speed; p.dir = "LEFT"; }
        else if (keys[k+"Right"]) { p.x += p.speed; p.dir = "RIGHT"; }

        if (p.x < 0 || p.x > canvas.width-p.w || p.y < 0 || p.y > canvas.height-p.h || walls.some(w => p.x < w.x+w.w && p.x+p.w > w.x && p.y < w.y+w.h && p.y+p.h > w.y)) {
            p.x = oldX; p.y = oldY;
        }
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx; b.y += b.dy;
        
        let destroyed = false;
        if (walls.some(w => b.x > w.x && b.x < w.x+w.w && b.y > w.y && b.y < w.y+w.h)) {
            bullets.splice(i, 1);
            continue;
        }
        
        let players = [p1, p2];
        for (let j = 0; j < players.length; j++) {
            let p = players[j];
            if (p.alive && b.owner !== p.id && b.x > p.x && b.x < p.x+p.w && b.y > p.y && b.y < p.y+p.h) {
                if (p.shield) p.shield = false;
                else { p.alive = false; endGame(b.owner); }
                bullets.splice(i, 1);
                destroyed = true;
                break;
            }
        }
        if (destroyed) continue;
        
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    if (powerUp && [p1, p2].some(p => {
        if (Math.abs(p.x - powerUp.x) < 30 && Math.abs(p.y - powerUp.y) < 30) {
            if (powerUp.type === "SPEED") { p.speed = 7; setTimeout(()=>p.speed=4, 7000); }
            else { p.shield = true; setTimeout(()=>p.shield=false, 7000); }
            powerUp = null; return true;
        }
    }));
}

function endGame(winnerId) {
    gameActive = false;
    document.getElementById("winMessage").innerText = `الفائز هو اللاعب ${winnerId === 1 ? 'الأخضر' : 'الأحمر'}!`;
    document.getElementById("winScreen").classList.remove("hidden");
}

function resetGame() {
    walls = [];
    for(let i=0; i<8; i++) walls.push({x:50+Math.random()*440, y:200+Math.random()*450, w:70, h:25});
    p1.init(); p2.init(); bullets = []; powerUp = null; gameActive = true;
    document.getElementById("winScreen").classList.add("hidden");
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#5d4037"; 
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
    p1.draw(); p2.draw();
    if (powerUp) { ctx.fillStyle = "gold"; ctx.fillRect(powerUp.x, powerUp.y, 25, 25); }
    ctx.fillStyle = "yellow"; 
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI*2);
        ctx.fill();
    });
    update(); 
    requestAnimationFrame(draw);
}

resetGame();
draw();
setInterval(() => { if(gameActive && !powerUp) powerUp = { x: 50+Math.random()*500, y: 200+Math.random()*500, type: Math.random()>0.5?"SPEED":"SHIELD" }; }, 10000);
