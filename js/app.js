/**
 * Classic Games Online — Walton Raiders Edition
 * Main application: routing, game launcher, thumbnail previews
 */

const GAMES = [
  {
    id: 'asteroids',
    name: 'Raider Space Defense',
    description: 'Defend the galaxy',
    module: () => window.Games && window.Games.Asteroids,
    thumbnail: drawAsteroidsThumbnail
  },
  {
    id: 'breakout',
    name: 'Raider Smash',
    description: 'Break every brick',
    module: () => window.Games && window.Games.Breakout,
    thumbnail: drawBreakoutThumbnail
  },
  {
    id: 'tetris',
    name: 'Raider Blocks',
    description: 'Stack and clear',
    module: () => window.Games && window.Games.Tetris,
    thumbnail: drawTetrisThumbnail
  },
  {
    id: 'flappy',
    name: 'Flappy Raider',
    description: 'Tap to survive',
    module: () => window.Games && window.Games.Flappy,
    thumbnail: drawFlappyThumbnail
  },
  {
    id: 'mario',
    name: 'Raider Run',
    description: 'Run and jump',
    module: () => window.Games && window.Games.Mario,
    thumbnail: drawMarioThumbnail
  }
];

// ---- State ----
let currentView = 'landing'; // 'landing' | 'game'
let currentGame = null;
let thumbnailAnimFrames = [];

// ---- Colors (mirror CSS variables) ----
const C = {
  bg: '#0B1120',
  red: '#C41E3A',
  redBright: '#E8294A',
  blue: '#002D72',
  blueBright: '#1A56DB',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.87)',
  whiteMuted: 'rgba(255,255,255,0.35)',
  whiteFaint: 'rgba(255,255,255,0.08)'
};

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  initThumbnails();
  initNavigation();
  animateEntrance();
});

// ---- Thumbnail Rendering ----
function initThumbnails() {
  const cards = document.querySelectorAll('.game-card');
  cards.forEach((card, i) => {
    const canvas = card.querySelector('.game-card__thumbnail');
    if (!canvas || !GAMES[i]) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Static initial draw
    GAMES[i].thumbnail(ctx, w, h, 0);

    // Animate on hover
    let animFrame = null;
    let startTime = 0;

    card.addEventListener('mouseenter', () => {
      startTime = performance.now();
      const animate = (time) => {
        const t = (time - startTime) / 1000;
        ctx.clearRect(0, 0, w, h);
        GAMES[i].thumbnail(ctx, w, h, t);
        animFrame = requestAnimationFrame(animate);
      };
      animFrame = requestAnimationFrame(animate);
    });

    card.addEventListener('mouseleave', () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      ctx.clearRect(0, 0, w, h);
      GAMES[i].thumbnail(ctx, w, h, 0);
    });
  });
}

// ---- Navigation ----
function initNavigation() {
  // Card clicks
  document.querySelectorAll('.game-card').forEach((card, i) => {
    card.addEventListener('click', () => launchGame(GAMES[i]));
  });

  // ESC to return
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentView === 'game') {
      returnToLanding();
    }
  });
}

let activeGameModule = null;

function launchGame(game) {
  currentView = 'game';
  currentGame = game;

  const landing = document.querySelector('.landing');
  const viewport = document.querySelector('.game-viewport');
  const gameName = document.querySelector('#hudGameTitle');

  landing.classList.add('hidden');
  viewport.classList.add('active');

  if (gameName) gameName.textContent = game.name;

  const canvas = document.querySelector('.game-viewport__canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;

  // Launch the actual game module
  const mod = game.module();
  if (mod && typeof mod.init === 'function') {
    activeGameModule = mod;
    mod.init(canvas, ctx);
  } else {
    drawPlaceholder(ctx, 800, 600, game);
  }
}

function returnToLanding() {
  // Destroy active game
  if (activeGameModule && typeof activeGameModule.destroy === 'function') {
    activeGameModule.destroy();
  }
  activeGameModule = null;

  currentView = 'landing';
  currentGame = null;

  const landing = document.querySelector('.landing');
  const viewport = document.querySelector('.game-viewport');

  viewport.classList.remove('active');
  landing.classList.remove('hidden');
}

function drawPlaceholder(ctx, w, h, game) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.whiteMuted;
  ctx.font = '600 14px "Fira Code", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${game.name} — Coming Soon`, w / 2, h / 2 - 10);
  ctx.font = '12px "Fira Code", monospace';
  ctx.fillText('Press ESC to return', w / 2, h / 2 + 20);
}

// ---- Staggered Entrance Animation ----
function animateEntrance() {
  document.querySelectorAll('.fade-up').forEach((el, i) => {
    el.style.animationDelay = `${i * 100 + 100}ms`;
  });
}

// ---- Sound Toggle ----
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.bottom-bar__sound-toggle');
  if (!btn) return;
  let soundOn = false;
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    btn.classList.toggle('active', soundOn);
    btn.textContent = soundOn ? '♪ Sound On' : '♪ Sound Off';
  });
});


// ============================================
// THUMBNAIL RENDERERS — Animated canvas previews
// ============================================

function drawAsteroidsThumbnail(ctx, w, h, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);

  // Stars
  const starSeed = 42;
  for (let i = 0; i < 40; i++) {
    const sx = seededRandom(starSeed + i * 3) * w;
    const sy = seededRandom(starSeed + i * 7) * h;
    const brightness = 0.2 + seededRandom(starSeed + i * 13) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Floating asteroids
  for (let i = 0; i < 6; i++) {
    const baseX = seededRandom(i * 17 + 5) * w;
    const baseY = seededRandom(i * 23 + 7) * h;
    const x = baseX + Math.sin(t * 0.5 + i * 2) * 15;
    const y = baseY + Math.cos(t * 0.3 + i * 1.5) * 10;
    const r = 8 + seededRandom(i * 31) * 20;
    const rot = t * 0.3 + i;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawAsteroid(ctx, r, i);
    ctx.restore();
  }

  // Ship (Raider shield shape) in center
  const shipX = w * 0.35 + Math.sin(t * 0.8) * 10;
  const shipY = h * 0.5 + Math.cos(t * 0.6) * 8;
  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.rotate(-0.3 + Math.sin(t * 0.4) * 0.1);
  drawRaiderShip(ctx, 14);
  ctx.restore();
}

function drawAsteroid(ctx, r, seed) {
  ctx.beginPath();
  const verts = 7;
  for (let j = 0; j <= verts; j++) {
    const angle = (j / verts) * Math.PI * 2;
    const wobble = 0.7 + seededRandom(seed * 100 + j * 37) * 0.6;
    const px = Math.cos(angle) * r * wobble;
    const py = Math.sin(angle) * r * wobble;
    j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
}

function drawRaiderShip(ctx, size) {
  // Shield shape
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.8, size * 0.6);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(-size * 0.8, size * 0.6);
  ctx.closePath();
  ctx.fillStyle = C.red;
  ctx.fill();
  ctx.strokeStyle = C.whiteSoft;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Engine glow
  ctx.beginPath();
  ctx.arc(0, size * 0.6, 4, 0, Math.PI * 2);
  ctx.fillStyle = C.blueBright;
  ctx.fill();
}

function drawBreakoutThumbnail(ctx, w, h, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);

  const cols = 10;
  const rows = 5;
  const brickW = (w - 40) / cols;
  const brickH = 12;
  const brickGap = 3;
  const startY = 20;
  const colors = [C.red, C.redBright, C.white, C.blueBright, C.blue];

  // Bricks
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Animate: bricks "shimmer" in a wave
      const shimmer = Math.sin(t * 2 + c * 0.5 + r * 0.3) * 0.15 + 0.85;
      const bx = 20 + c * brickW;
      const by = startY + r * (brickH + brickGap);

      ctx.globalAlpha = shimmer;
      ctx.fillStyle = colors[r];
      roundRect(ctx, bx + 1, by, brickW - 2, brickH, 3);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Paddle
  const paddleW = 50;
  const paddleH = 8;
  const paddleX = w / 2 + Math.sin(t * 1.5) * 60 - paddleW / 2;
  const paddleY = h - 30;

  ctx.fillStyle = C.white;
  roundRect(ctx, paddleX, paddleY, paddleW, paddleH, 4);
  ctx.fill();

  // Ball
  const ballX = w / 2 + Math.sin(t * 2.3) * 80;
  const ballY = h / 2 + Math.cos(t * 3.1) * 30 + 20;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.fill();

  // Ball trail
  for (let i = 1; i <= 4; i++) {
    const tx = w / 2 + Math.sin(t * 2.3 - i * 0.1) * 80;
    const ty = h / 2 + Math.cos(t * 3.1 - i * 0.1) * 30 + 20;
    ctx.beginPath();
    ctx.arc(tx, ty, 5 - i, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(196,30,58,${0.3 - i * 0.06})`;
    ctx.fill();
  }
}

function drawTetrisThumbnail(ctx, w, h, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);

  const gridCols = 10;
  const gridRows = 16;
  const cellSize = Math.min((w - 60) / gridCols, (h - 20) / gridRows);
  const gridW = gridCols * cellSize;
  const gridH = gridRows * cellSize;
  const offsetX = (w - gridW) / 2;
  const offsetY = (h - gridH) / 2;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= gridCols; c++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + c * cellSize, offsetY);
    ctx.lineTo(offsetX + c * cellSize, offsetY + gridH);
    ctx.stroke();
  }
  for (let r = 0; r <= gridRows; r++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + r * cellSize);
    ctx.lineTo(offsetX + gridW, offsetY + r * cellSize);
    ctx.stroke();
  }

  // Placed blocks (static pattern)
  const placed = [
    [0,15,C.red],[1,15,C.red],[2,15,C.red],[3,15,C.red],
    [5,15,C.blue],[6,15,C.blue],[6,14,C.blue],[7,14,C.blue],
    [8,15,C.white],[9,15,C.white],[9,14,C.white],[8,14,C.white],
    [0,14,C.blueBright],[1,14,C.blueBright],[2,14,C.blueBright],[2,13,C.blueBright],
    [4,15,C.redBright],[4,14,C.redBright],[5,14,C.redBright],[5,13,C.redBright],
  ];

  placed.forEach(([c, r, color]) => {
    ctx.fillStyle = color;
    roundRect(ctx, offsetX + c * cellSize + 1, offsetY + r * cellSize + 1,
              cellSize - 2, cellSize - 2, 2);
    ctx.fill();
  });

  // Falling piece (T-piece, animated)
  const fallY = (t * 2) % 12;
  const fallCol = 4;
  const tPiece = [[0,0],[1,0],[-1,0],[0,-1]]; // T shape
  const pieceColor = C.red;

  tPiece.forEach(([dc, dr]) => {
    const c = fallCol + dc;
    const r = Math.floor(fallY) + dr;
    if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
      ctx.fillStyle = pieceColor;
      ctx.globalAlpha = 0.9;
      roundRect(ctx, offsetX + c * cellSize + 1, offsetY + r * cellSize + 1,
                cellSize - 2, cellSize - 2, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
}

function drawFlappyThumbnail(ctx, w, h, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(0.6, '#0f2040');
  grad.addColorStop(1, '#1a1030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Skyline silhouette
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  const buildings = [
    [0, 0.6, 0.08], [0.08, 0.55, 0.06], [0.15, 0.65, 0.1],
    [0.26, 0.5, 0.07], [0.34, 0.6, 0.12], [0.47, 0.45, 0.08],
    [0.56, 0.58, 0.1], [0.67, 0.52, 0.06], [0.74, 0.62, 0.12],
    [0.87, 0.48, 0.07], [0.94, 0.6, 0.08]
  ];
  buildings.forEach(([x, height, width]) => {
    const bx = (x + t * 0.02) % 1.2 - 0.1;
    ctx.fillRect(bx * w, h * (1 - height), width * w, h * height);
  });

  // Ground
  ctx.fillStyle = '#0d1a2d';
  ctx.fillRect(0, h * 0.85, w, h * 0.15);

  // Pipes
  const pipeW = 30;
  const gapH = 60;
  for (let i = 0; i < 3; i++) {
    const px = ((i * 0.35 + 0.3 - t * 0.08) % 1.2 + 0.1) * w;
    const gapY = h * 0.3 + seededRandom(i * 71) * h * 0.3;

    // Top pipe
    const topGrad = ctx.createLinearGradient(px, 0, px + pipeW, 0);
    topGrad.addColorStop(0, C.blue);
    topGrad.addColorStop(1, C.blueBright);
    ctx.fillStyle = topGrad;
    ctx.fillRect(px, 0, pipeW, gapY);
    ctx.fillRect(px - 4, gapY - 12, pipeW + 8, 12);

    // Bottom pipe
    const botGrad = ctx.createLinearGradient(px, 0, px + pipeW, 0);
    botGrad.addColorStop(0, C.red);
    botGrad.addColorStop(1, C.redBright);
    ctx.fillStyle = botGrad;
    ctx.fillRect(px, gapY + gapH, pipeW, h - gapY - gapH);
    ctx.fillRect(px - 4, gapY + gapH, pipeW + 8, 12);
  }

  // Bird (Raider eagle)
  const birdX = w * 0.3;
  const birdY = h * 0.4 + Math.sin(t * 3) * 15;
  const wingAngle = Math.sin(t * 8) * 0.4;

  ctx.save();
  ctx.translate(birdX, birdY);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.red;
  ctx.fill();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wing
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(-6, -12 + wingAngle * 10);
  ctx.lineTo(4, -4);
  ctx.fillStyle = C.redBright;
  ctx.fill();

  // Eye
  ctx.beginPath();
  ctx.arc(6, -2, 2, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.fill();

  // Beak
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(16, 1);
  ctx.lineTo(10, 3);
  ctx.fillStyle = C.accent || '#F59E0B';
  ctx.fill();

  ctx.restore();
}

function drawMarioThumbnail(ctx, w, h, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);

  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(1, '#162040');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Parallax mountains
  ctx.fillStyle = 'rgba(0,45,114,0.15)';
  for (let i = 0; i < 5; i++) {
    const mx = (i * w * 0.3 - t * 10) % (w * 1.5) - w * 0.25;
    const mh = 40 + seededRandom(i * 51) * 40;
    ctx.beginPath();
    ctx.moveTo(mx, h * 0.7);
    ctx.lineTo(mx + 60, h * 0.7 - mh);
    ctx.lineTo(mx + 120, h * 0.7);
    ctx.fill();
  }

  // Ground
  ctx.fillStyle = '#1a2a1a';
  ctx.fillRect(0, h * 0.75, w, h * 0.25);
  ctx.fillStyle = '#2a3a2a';
  ctx.fillRect(0, h * 0.75, w, 4);

  // Platforms
  const platforms = [[0.2, 0.58], [0.45, 0.48], [0.7, 0.55]];
  platforms.forEach(([px, py]) => {
    const platX = (px * w - t * 20) % (w + 100);
    ctx.fillStyle = '#2a3040';
    roundRect(ctx, platX, py * h, 60, 8, 3);
    ctx.fill();
    ctx.fillStyle = C.blueBright;
    ctx.fillRect(platX, py * h, 60, 2);
  });

  // W coins
  for (let i = 0; i < 4; i++) {
    const cx = (i * 80 + 50 - t * 30) % (w + 40);
    const cy = h * 0.5 + Math.sin(t * 2 + i) * 8;
    const scaleX = Math.abs(Math.cos(t * 3 + i));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, 1);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.fillStyle = '#B45309';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (scaleX > 0.3) ctx.fillText('W', 0, 0.5);
    ctx.restore();
  }

  // Runner character
  const runnerX = w * 0.25;
  const runnerY = h * 0.75 - 20;
  const legPhase = Math.sin(t * 10) * 0.4;

  ctx.save();
  ctx.translate(runnerX, runnerY);

  // Body
  ctx.fillStyle = C.red;
  roundRect(ctx, -6, -14, 12, 14, 2);
  ctx.fill();

  // Head
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(0, -18, 6, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated)
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-4 + Math.sin(legPhase) * 5, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(4 + Math.sin(legPhase + Math.PI) * 5, 10);
  ctx.stroke();

  ctx.restore();
}


// ---- Utility ----
function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAMES, seededRandom, roundRect, launchGame, returnToLanding };
}
