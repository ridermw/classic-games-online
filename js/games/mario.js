// Raider Run — Auto-Runner Platformer for Walton Raiders Classic Games
window.Games = window.Games || {};

window.Games.Mario = (function () {
  'use strict';

  // Constants
  var WIDTH = 800;
  var HEIGHT = 600;
  var GROUND_Y = 450;
  var PLAYER_X = 150;
  var PLAYER_W = 12;
  var PLAYER_H = 28;
  var GRAVITY = 0.6;
  var JUMP_VEL = -12;
  var SCROLL_SPEED = 4;
  var SPAWN_MIN = 250;
  var SPAWN_MAX = 400;
  var COIN_SCORE = 10;
  var DEATH_PAUSE = 0.5;

  // Colors
  var COL_RED = '#C41E3A';
  var COL_RED_BRIGHT = '#E8294A';
  var COL_BG = '#0B1120';
  var COL_WHITE = '#FFFFFF';
  var COL_GOLD = '#F59E0B';
  var COL_DARK_GOLD = '#B45309';
  var COL_GROUND_DARK = '#1a2a1a';
  var COL_GROUND_LIGHT = '#2a3a2a';

  // States
  var STATE_READY = 'READY';
  var STATE_PLAYING = 'PLAYING';
  var STATE_DEAD = 'DEAD';

  // Internal state
  var canvas, ctx;
  var gameLoop, input, particles, audio;
  var state, player, obstacles, coins, score;
  var scrollOffset, distanceSinceSpawn, nextSpawnDist;
  var deathTimer;
  var bgFarOffset, bgMidOffset;

  function createPlayer() {
    return {
      x: PLAYER_X,
      y: GROUND_Y - PLAYER_H,
      width: PLAYER_W,
      height: PLAYER_H,
      vy: 0,
      onGround: true,
      legAnim: 0
    };
  }

  function resetState() {
    state = STATE_READY;
    player = createPlayer();
    obstacles = [];
    coins = [];
    score = 0;
    scrollOffset = 0;
    distanceSinceSpawn = 0;
    nextSpawnDist = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
    deathTimer = 0;
    bgFarOffset = 0;
    bgMidOffset = 0;
    if (particles) particles.clear();
    updateHUD();
  }

  function updateHUD() {
    if (typeof document === 'undefined') return;
    var el = document.getElementById('hudScore');
    if (el) el.textContent = 'Score: ' + score;
  }

  function jump() {
    if (player.onGround) {
      player.vy = JUMP_VEL;
      player.onGround = false;
      if (audio) audio.play('jump');
    }
  }

  function requestAction() {
    if (state === STATE_READY) {
      state = STATE_PLAYING;
      return;
    }
    if (state === STATE_PLAYING) {
      jump();
    }
  }

  function isOverGap() {
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      if (obs.type === 'gap') {
        if (player.x + player.width > obs.x && player.x < obs.x + obs.width) {
          return true;
        }
      }
    }
    return false;
  }

  function spawnObstacle() {
    var type = Math.random() < 0.6 ? 'spike' : 'gap';
    if (type === 'spike') {
      var h = 20 + Math.random() * 20;
      obstacles.push({
        type: 'spike',
        x: WIDTH + 10,
        y: GROUND_Y - h,
        width: 20,
        height: h
      });
    } else {
      obstacles.push({
        type: 'gap',
        x: WIDTH + 10,
        y: GROUND_Y,
        width: 60 + Math.random() * 40,
        height: HEIGHT - GROUND_Y
      });
    }
  }

  function spawnCoin(xPos) {
    var cy;
    if (Math.random() < 0.5) {
      cy = GROUND_Y - 50;
    } else {
      cy = GROUND_Y - 100 - Math.random() * 60;
    }
    coins.push({
      x: xPos !== undefined ? xPos : WIDTH + 10 + Math.random() * 100,
      y: cy,
      width: 16,
      height: 16,
      spinAngle: Math.random() * Math.PI * 2
    });
  }

  function die() {
    if (state !== STATE_PLAYING) return;
    state = STATE_DEAD;
    deathTimer = DEATH_PAUSE;
    if (audio) audio.play('die');
    if (particles) {
      particles.emit({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        count: 20,
        color: COL_RED_BRIGHT,
        speed: 150,
        life: 0.8,
        spread: Math.PI * 2,
        size: 3
      });
    }
  }

  function handleClick() {
    requestAction();
  }

  function handleTouch(e) {
    e.preventDefault();
    requestAction();
  }

  // ---- Update ----
  function update(dt) {
    if (!dt) dt = 1 / 60;

    if (state === STATE_DEAD) {
      deathTimer -= dt;
      player.vy += GRAVITY;
      player.y += player.vy;
      if (particles) particles.update(dt);
      if (deathTimer <= 0) {
        resetState();
      }
      return;
    }

    if (state === STATE_READY) {
      player.legAnim += 0.15;
      return;
    }

    // STATE_PLAYING
    if (input && (input.isKeyPressed('Space') || input.isKeyPressed('ArrowUp'))) {
      jump();
    }

    // Gravity and movement
    player.vy += GRAVITY;
    player.y += player.vy;

    // Ground collision (only when not over a gap)
    if (!isOverGap()) {
      if (player.y + player.height >= GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    } else {
      player.onGround = false;
    }

    // Death by falling off screen
    if (player.y > HEIGHT) {
      die();
      return;
    }

    // Scroll world
    scrollOffset += SCROLL_SPEED;
    distanceSinceSpawn += SCROLL_SPEED;
    bgFarOffset += SCROLL_SPEED * 0.3;
    bgMidOffset += SCROLL_SPEED * 0.6;

    // Move obstacles left
    for (var i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= SCROLL_SPEED;
      if (obstacles[i].x + obstacles[i].width < -50) {
        obstacles.splice(i, 1);
      }
    }

    // Move coins left
    for (var j = coins.length - 1; j >= 0; j--) {
      coins[j].x -= SCROLL_SPEED;
      coins[j].spinAngle += 0.1;
      if (coins[j].x + coins[j].width < -50) {
        coins.splice(j, 1);
      }
    }

    // Spawn new obstacles
    if (distanceSinceSpawn >= nextSpawnDist) {
      spawnObstacle();
      if (Math.random() < 0.7) {
        spawnCoin(WIDTH + 10 + Math.random() * 80);
      }
      distanceSinceSpawn = 0;
      nextSpawnDist = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
    }

    // Obstacle collision check
    var playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
    for (var k = 0; k < obstacles.length; k++) {
      if (obstacles[k].type === 'spike') {
        if (Engine.Collision.rectRect(playerRect, obstacles[k])) {
          die();
          return;
        }
      }
    }

    // Coin collection check
    for (var m = coins.length - 1; m >= 0; m--) {
      if (Engine.Collision.rectRect(playerRect, coins[m])) {
        score += COIN_SCORE;
        if (audio) audio.play('score');
        if (particles) {
          particles.emit({
            x: coins[m].x + 8,
            y: coins[m].y + 8,
            count: 8,
            color: COL_GOLD,
            speed: 100,
            life: 0.5,
            spread: Math.PI * 2,
            size: 2
          });
        }
        coins.splice(m, 1);
        updateHUD();
      }
    }

    // Animate
    player.legAnim += 0.2;
    if (particles) particles.update(dt);
    if (input) input.update();
  }

  // ---- Render ----
  function render(context) {
    var c = context || ctx;
    if (!c) return;

    Engine.Renderer.clear(c, WIDTH, HEIGHT, COL_BG);
    drawBackground(c);
    drawGround(c);
    drawObstacles(c);
    drawCoins(c);
    drawPlayer(c);
    if (particles) particles.render(c);
    drawUI(c);
    Engine.Renderer.drawVignette(c, WIDTH, HEIGHT);
  }

  function drawBackground(c) {
    // Far layer — blue mountain silhouettes (0.3x scroll)
    c.fillStyle = '#0d1a3a';
    var farOff = -(bgFarOffset % 400);
    for (var i = -1; i < 4; i++) {
      var bx = i * 200 + farOff;
      c.beginPath();
      c.moveTo(bx, GROUND_Y);
      c.lineTo(bx + 100, GROUND_Y - 180 - (i % 3) * 40);
      c.lineTo(bx + 200, GROUND_Y);
      c.fill();
    }

    // Mid layer — darker hill silhouettes (0.6x scroll)
    c.fillStyle = '#0a1228';
    var midOff = -(bgMidOffset % 300);
    for (var j = -1; j < 5; j++) {
      var hx = j * 160 + midOff;
      c.beginPath();
      c.moveTo(hx, GROUND_Y);
      c.quadraticCurveTo(hx + 80, GROUND_Y - 100 - (j % 2) * 30, hx + 160, GROUND_Y);
      c.fill();
    }
  }

  function drawGround(c) {
    // Ground fill
    c.fillStyle = COL_GROUND_DARK;
    c.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // Grass accent line
    c.fillStyle = COL_GROUND_LIGHT;
    c.fillRect(0, GROUND_Y, WIDTH, 3);

    // Cut gaps (draw background color over gap regions)
    c.fillStyle = COL_BG;
    for (var i = 0; i < obstacles.length; i++) {
      if (obstacles[i].type === 'gap') {
        c.fillRect(obstacles[i].x, GROUND_Y, obstacles[i].width, HEIGHT - GROUND_Y + 3);
      }
    }
  }

  function drawObstacles(c) {
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      if (obs.type === 'spike') {
        c.fillStyle = COL_RED;
        c.fillRect(obs.x, obs.y, obs.width, obs.height);
        c.fillStyle = COL_RED_BRIGHT;
        c.fillRect(obs.x, obs.y, obs.width, 3);
      }
    }
  }

  function drawCoins(c) {
    for (var i = 0; i < coins.length; i++) {
      var coin = coins[i];
      var scaleX = Math.abs(Math.cos(coin.spinAngle));
      var cx = coin.x + coin.width / 2;
      var cy = coin.y + coin.height / 2;
      var r = coin.width / 2;

      c.save();
      c.translate(cx, cy);
      c.scale(Math.max(scaleX, 0.15), 1);

      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fillStyle = COL_GOLD;
      c.fill();
      c.strokeStyle = COL_DARK_GOLD;
      c.lineWidth = 1.5;
      c.stroke();

      if (scaleX > 0.3) {
        c.fillStyle = COL_DARK_GOLD;
        c.font = 'bold 10px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('W', 0, 1);
      }

      c.restore();
    }
  }

  function drawPlayer(c) {
    var px = player.x;
    var py = player.y;

    // Head — white circle
    c.beginPath();
    c.arc(px + 6, py + 6, 6, 0, Math.PI * 2);
    c.fillStyle = COL_WHITE;
    c.fill();

    // Body — red rectangle
    c.fillStyle = COL_RED;
    c.fillRect(px, py + 12, 12, 14);

    // Legs — animated red lines
    c.strokeStyle = COL_RED;
    c.lineWidth = 2;
    if (!player.onGround) {
      // Tucked legs while jumping
      c.beginPath();
      c.moveTo(px + 3, py + 26);
      c.lineTo(px + 1, py + 24);
      c.stroke();
      c.beginPath();
      c.moveTo(px + 9, py + 26);
      c.lineTo(px + 11, py + 24);
      c.stroke();
    } else {
      // Running leg animation
      var legSwing = Math.sin(player.legAnim) * 6;
      c.beginPath();
      c.moveTo(px + 3, py + 26);
      c.lineTo(px + 3 + legSwing, py + 28);
      c.stroke();
      c.beginPath();
      c.moveTo(px + 9, py + 26);
      c.lineTo(px + 9 - legSwing, py + 28);
      c.stroke();
    }
  }

  function drawUI(c) {
    if (state === STATE_READY) {
      c.fillStyle = COL_WHITE;
      c.font = 'bold 28px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('TAP TO START', WIDTH / 2, HEIGHT / 2 - 40);

      c.font = '16px sans-serif';
      c.fillStyle = COL_GOLD;
      c.fillText('Space / Up / Click to Jump', WIDTH / 2, HEIGHT / 2);
    }
  }

  // ---- Public API ----
  return {
    init: function (canvasEl, context) {
      canvas = canvasEl;
      ctx = context;
      input = Engine.Input.create();
      particles = Engine.Particles.create();
      audio = Engine.Audio.create();

      resetState();

      gameLoop = Engine.GameLoop.create(
        function (dt) { update(dt); },
        function () { render(ctx); }
      );
      gameLoop.start();

      if (canvas) {
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouch);
      }
    },

    update: function (dt) {
      update(dt);
    },

    render: function (context) {
      render(context);
    },

    handleInput: function (event) {
      if (!event) return;
      var isJumpKey = event.type === 'keydown' &&
        (event.code === 'Space' || event.code === 'ArrowUp');
      var isClick = event.type === 'click' || event.type === 'touchstart';
      if (isJumpKey || isClick) {
        requestAction();
      }
    },

    reset: function () {
      resetState();
    },

    getState: function () {
      return {
        state: state,
        player: player,
        obstacles: obstacles,
        coins: coins,
        score: score,
        scrollOffset: scrollOffset,
        deathTimer: deathTimer,
        GROUND_Y: GROUND_Y,
        SCROLL_SPEED: SCROLL_SPEED,
        GRAVITY: GRAVITY,
        JUMP_VEL: JUMP_VEL,
        WIDTH: WIDTH,
        HEIGHT: HEIGHT
      };
    },

    destroy: function () {
      if (gameLoop) gameLoop.stop();
      if (input) input.destroy();
      if (particles) particles.clear();
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleTouch);
      }
      canvas = null;
      ctx = null;
      gameLoop = null;
      input = null;
      particles = null;
      audio = null;
    },

    // Exposed for testing
    _setInput: function (inp) { input = inp; },
    _setParticles: function (p) { particles = p; },
    _setAudio: function (a) { audio = a; },
    _resetState: function () { resetState(); },
    _spawnObstacle: function () { spawnObstacle(); },
    _spawnCoin: function (x) { spawnCoin(x); }
  };
})();
