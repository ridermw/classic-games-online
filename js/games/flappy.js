// Flappy Raider — Flappy Bird game for Walton Raiders Classic Games
window.Games = window.Games || {};

window.Games.Flappy = (function () {
  // Constants
  var WIDTH = 800;
  var HEIGHT = 600;

  var BIRD_X = 200;
  var BIRD_W = 24;
  var BIRD_H = 16;

  var GRAVITY = 0.5;
  var FLAP_VEL = -8;

  var PIPE_WIDTH = 52;
  var PIPE_GAP = 140;
  var PIPE_SPEED = 3;
  var PIPE_SPACING = 220;
  var PIPE_MIN_Y = 120;

  var GROUND_HEIGHT = 40;

  var STATE_READY = 'READY';
  var STATE_PLAYING = 'PLAYING';
  var STATE_DEAD = 'DEAD';

  // State
  var canvas, ctx;
  var gameLoop, input, particles, audio;
  var bird, pipes, score, state;
  var frameCount;
  var deathTimer;
  var bobTimer;
  var distanceSinceLastPipe;

  // Parallax
  var bgOffset;
  var groundOffset;

  // Skyline buildings (generated once)
  var buildings;

  function createBuildings() {
    var arr = [];
    var x = 0;
    while (x < WIDTH + 200) {
      var w = 30 + Math.random() * 50;
      var h = 40 + Math.random() * 80;
      arr.push({ x: x, w: w, h: h });
      x += w + 5 + Math.random() * 20;
    }
    return arr;
  }

  function resetBird() {
    bird = {
      x: BIRD_X,
      y: HEIGHT / 2,
      vy: 0,
      rotation: 0,
      wingAngle: 0
    };
  }

  function resetState() {
    resetBird();
    pipes = [];
    score = 0;
    state = STATE_READY;
    frameCount = 0;
    deathTimer = 0;
    bobTimer = 0;
    distanceSinceLastPipe = PIPE_SPACING;
    bgOffset = 0;
    groundOffset = 0;
    if (!buildings) buildings = createBuildings();
    updateHUD();
  }

  function updateHUD() {
    var el = document.getElementById('hudScore');
    if (el) el.textContent = score;
  }

  function flap() {
    if (state === STATE_DEAD) return;
    if (state === STATE_READY) {
      state = STATE_PLAYING;
    }
    bird.vy = FLAP_VEL;
    if (audio) audio.play('jump');
  }

  function spawnPipe() {
    var maxY = HEIGHT - GROUND_HEIGHT - PIPE_GAP - PIPE_MIN_Y;
    var gapY = PIPE_MIN_Y + Math.random() * maxY;
    pipes.push({
      x: WIDTH,
      gapY: gapY,
      scored: false
    });
  }

  function die() {
    if (state === STATE_DEAD) return;
    state = STATE_DEAD;
    deathTimer = 1.5;
    if (audio) audio.play('die');

    // Death particles
    if (particles) {
      var colors = ['#C41E3A', '#FFFFFF', '#002D72'];
      for (var i = 0; i < 3; i++) {
        particles.emit({
          x: bird.x,
          y: bird.y,
          count: 8,
          color: colors[i],
          speed: 120,
          life: 0.8,
          size: 3
        });
      }
    }
  }

  function getBirdHitbox() {
    return {
      x: bird.x - BIRD_W / 2 + 2,
      y: bird.y - BIRD_H / 2 + 2,
      width: BIRD_W - 4,
      height: BIRD_H - 4
    };
  }

  function getPipeRects(pipe) {
    var capW = PIPE_WIDTH + 8;
    var capH = 16;
    return {
      top: {
        x: pipe.x,
        y: 0,
        width: PIPE_WIDTH,
        height: pipe.gapY
      },
      topCap: {
        x: pipe.x - 4,
        y: pipe.gapY - capH,
        width: capW,
        height: capH
      },
      bottom: {
        x: pipe.x,
        y: pipe.gapY + PIPE_GAP,
        width: PIPE_WIDTH,
        height: HEIGHT - (pipe.gapY + PIPE_GAP)
      },
      bottomCap: {
        x: pipe.x - 4,
        y: pipe.gapY + PIPE_GAP,
        width: capW,
        height: capH
      }
    };
  }

  function onClick() {
    flap();
  }

  // ---- Update ----
  function update(dt) {
    frameCount++;

    if (state === STATE_DEAD) {
      // Bird falls while dead
      bird.vy += GRAVITY;
      bird.y += bird.vy;
      bird.rotation = Math.min(bird.rotation + 0.1, Math.PI / 2);

      if (particles) particles.update(dt);

      deathTimer -= dt;
      if (deathTimer <= 0) {
        resetState();
      }
      return;
    }

    if (input) input.update();

    // Check flap input
    if (input) {
      if (input.isKeyPressed(' ') || input.isKeyPressed('ArrowUp')) {
        flap();
      }
    }

    if (state === STATE_READY) {
      // Bob gently
      bobTimer += dt;
      bird.y = HEIGHT / 2 + Math.sin(bobTimer * 3) * 8;
      bird.wingAngle = Math.sin(bobTimer * 6) * 0.3;
      return;
    }

    // PLAYING state
    // Physics
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    // Bird rotation based on velocity
    bird.rotation = Math.max(-0.5, Math.min(bird.vy * 0.04, 1.2));

    // Wing flap animation
    bird.wingAngle = Math.sin(frameCount * 0.3) * 0.4;

    // Scroll pipes and background
    groundOffset = (groundOffset + PIPE_SPEED) % 40;
    bgOffset = (bgOffset + PIPE_SPEED * 0.3) % (WIDTH + 200);

    // Pipe spawning
    distanceSinceLastPipe += PIPE_SPEED;
    if (distanceSinceLastPipe >= PIPE_SPACING) {
      spawnPipe();
      distanceSinceLastPipe = 0;
    }

    // Move pipes
    for (var i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= PIPE_SPEED;

      // Scoring
      if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH / 2 < bird.x) {
        pipes[i].scored = true;
        score++;
        updateHUD();
        if (audio) audio.play('score');
      }

      // Remove off-screen pipes
      if (pipes[i].x + PIPE_WIDTH < -10) {
        pipes.splice(i, 1);
      }
    }

    // Collision detection
    var birdBox = getBirdHitbox();

    // Ground collision
    if (bird.y + BIRD_H / 2 >= HEIGHT - GROUND_HEIGHT) {
      die();
      return;
    }

    // Ceiling collision
    if (bird.y - BIRD_H / 2 <= 0) {
      die();
      return;
    }

    // Pipe collisions
    for (var j = 0; j < pipes.length; j++) {
      var rects = getPipeRects(pipes[j]);
      if (Engine.Collision.rectRect(birdBox, rects.top) ||
          Engine.Collision.rectRect(birdBox, rects.topCap) ||
          Engine.Collision.rectRect(birdBox, rects.bottom) ||
          Engine.Collision.rectRect(birdBox, rects.bottomCap)) {
        die();
        return;
      }
    }

    if (particles) particles.update(dt);
  }

  // ---- Render ----
  function render(context) {
    var c = context || ctx;
    if (!c) return;

    // Sky gradient
    var skyGrad = c.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#0a1628');
    skyGrad.addColorStop(1, '#1a1030');
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, WIDTH, HEIGHT);

    // Parallax skyline (far layer)
    if (buildings) {
      c.fillStyle = '#0d1a2d';
      var bOff = bgOffset;
      for (var b = 0; b < buildings.length; b++) {
        var bx = buildings[b].x - bOff;
        if (bx > WIDTH) bx -= WIDTH + 200;
        if (bx < -100) bx += WIDTH + 200;
        c.fillRect(bx, HEIGHT - GROUND_HEIGHT - buildings[b].h, buildings[b].w, buildings[b].h);
      }
    }

    // Pipes
    for (var i = 0; i < pipes.length; i++) {
      var pipe = pipes[i];
      drawPipe(c, pipe);
    }

    // Ground strip
    c.fillStyle = '#1a2a1a';
    c.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);

    // Ground line
    c.strokeStyle = '#2a4a2a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, HEIGHT - GROUND_HEIGHT);
    c.lineTo(WIDTH, HEIGHT - GROUND_HEIGHT);
    c.stroke();

    // Ground texture lines (scrolling)
    c.strokeStyle = '#223322';
    c.lineWidth = 1;
    for (var g = -40; g < WIDTH + 40; g += 40) {
      var gx = g - groundOffset;
      c.beginPath();
      c.moveTo(gx, HEIGHT - GROUND_HEIGHT + 8);
      c.lineTo(gx + 20, HEIGHT);
      c.stroke();
    }

    // Bird
    drawBird(c);

    // HUD / ready text
    if (state === STATE_READY) {
      c.save();
      c.font = 'bold 28px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillStyle = '#FFFFFF';
      c.globalAlpha = 0.6 + Math.sin(frameCount * 0.08) * 0.3;
      c.fillText('TAP TO PLAY', WIDTH / 2, HEIGHT / 3);
      c.restore();
    }

    // Particles
    if (particles) particles.render(c);

    // Vignette and grain
    Engine.Renderer.drawVignette(c, WIDTH, HEIGHT);
  }

  function drawPipe(c, pipe) {
    var rects = getPipeRects(pipe);

    // Top pipe — blue gradient
    var topGrad = c.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    topGrad.addColorStop(0, '#002D72');
    topGrad.addColorStop(0.5, '#1A56DB');
    topGrad.addColorStop(1, '#002D72');
    c.fillStyle = topGrad;
    c.fillRect(rects.top.x, rects.top.y, rects.top.width, rects.top.height);

    // Top cap
    c.fillStyle = '#1A56DB';
    c.fillRect(rects.topCap.x, rects.topCap.y, rects.topCap.width, rects.topCap.height);

    // Bottom pipe — red gradient
    var botGrad = c.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    botGrad.addColorStop(0, '#8B1225');
    botGrad.addColorStop(0.5, '#C41E3A');
    botGrad.addColorStop(1, '#8B1225');
    c.fillStyle = botGrad;
    c.fillRect(rects.bottom.x, rects.bottom.y, rects.bottom.width, rects.bottom.height);

    // Bottom cap
    c.fillStyle = '#C41E3A';
    c.fillRect(rects.bottomCap.x, rects.bottomCap.y, rects.bottomCap.width, rects.bottomCap.height);
  }

  function drawBird(c) {
    c.save();
    c.translate(bird.x, bird.y);
    c.rotate(bird.rotation);

    // Body — red ellipse
    c.fillStyle = '#C41E3A';
    c.beginPath();
    c.ellipse(0, 0, BIRD_W / 2, BIRD_H / 2, 0, 0, Math.PI * 2);
    c.fill();

    // Wing — red-bright triangle, oscillates
    c.save();
    c.rotate(bird.wingAngle);
    c.fillStyle = '#E8294A';
    c.beginPath();
    c.moveTo(-4, -2);
    c.lineTo(-14, -10);
    c.lineTo(-2, 2);
    c.closePath();
    c.fill();
    c.restore();

    // Eye — white circle
    c.fillStyle = '#FFFFFF';
    c.beginPath();
    c.arc(6, -3, 3, 0, Math.PI * 2);
    c.fill();

    // Pupil
    c.fillStyle = '#000000';
    c.beginPath();
    c.arc(7, -3, 1.5, 0, Math.PI * 2);
    c.fill();

    // Beak — amber/gold triangle
    c.fillStyle = '#F59E0B';
    c.beginPath();
    c.moveTo(BIRD_W / 2 - 2, -2);
    c.lineTo(BIRD_W / 2 + 6, 1);
    c.lineTo(BIRD_W / 2 - 2, 4);
    c.closePath();
    c.fill();

    c.restore();
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
        canvas.addEventListener('click', onClick);
      }
    },

    update: function (dt) {
      update(dt);
    },

    render: function (context) {
      render(context);
    },

    handleInput: function (event) {
      if (event && (event.type === 'click' || event.type === 'touchstart')) {
        flap();
      }
    },

    reset: function () {
      if (particles) particles.clear();
      resetState();
    },

    getState: function () {
      return {
        state: state,
        bird: bird,
        pipes: pipes,
        score: score,
        WIDTH: WIDTH,
        HEIGHT: HEIGHT,
        BIRD_X: BIRD_X,
        BIRD_W: BIRD_W,
        BIRD_H: BIRD_H,
        GRAVITY: GRAVITY,
        FLAP_VEL: FLAP_VEL,
        PIPE_WIDTH: PIPE_WIDTH,
        PIPE_GAP: PIPE_GAP,
        PIPE_SPEED: PIPE_SPEED,
        PIPE_SPACING: PIPE_SPACING,
        GROUND_HEIGHT: GROUND_HEIGHT,
        deathTimer: deathTimer
      };
    },

    destroy: function () {
      if (gameLoop) gameLoop.stop();
      if (input) input.destroy();
      if (particles) particles.clear();

      if (canvas) {
        canvas.removeEventListener('click', onClick);
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
    _flap: function () { flap(); },
    _resetState: function () { resetState(); },
    _spawnPipe: function () { spawnPipe(); },
    _die: function () { die(); }
  };
})();
