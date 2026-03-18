// Raider Smash — Breakout game for Walton Raiders Classic Games
window.Games = window.Games || {};

window.Games.Breakout = (function () {
  // Constants
  var WIDTH = 800;
  var HEIGHT = 600;

  var PADDLE_WIDTH = 100;
  var PADDLE_HEIGHT = 12;
  var PADDLE_Y = HEIGHT - 40;
  var PADDLE_SPEED = 500;

  var BALL_RADIUS = 6;
  var BALL_SPEED = 350;

  var BRICK_COLS = 10;
  var BRICK_ROWS = 5;
  var BRICK_GAP = 4;
  var BRICK_TOP = 50;
  var BRICK_SIDE_PAD = 30;
  var BRICK_HEIGHT = 22;

  var ROW_COLORS = ['#C41E3A', '#E8294A', '#FFFFFF', '#1A56DB', '#002D72'];

  // State
  var canvas, ctx;
  var gameLoop, input, particles, audio;
  var paddle, ball, bricks, score, launched;
  var mouseX;
  var trailPositions;
  var celebrationTimer;

  function createBricks() {
    var arr = [];
    var brickWidth = (WIDTH - BRICK_SIDE_PAD * 2 - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS;
    for (var r = 0; r < BRICK_ROWS; r++) {
      for (var c = 0; c < BRICK_COLS; c++) {
        arr.push({
          x: BRICK_SIDE_PAD + c * (brickWidth + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
          width: brickWidth,
          height: BRICK_HEIGHT,
          color: ROW_COLORS[r],
          alive: true
        });
      }
    }
    return arr;
  }

  function resetBall() {
    launched = false;
    ball = {
      x: paddle.x + PADDLE_WIDTH / 2,
      y: PADDLE_Y - BALL_RADIUS,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS
    };
    trailPositions = [];
  }

  function resetState() {
    paddle = {
      x: WIDTH / 2 - PADDLE_WIDTH / 2,
      y: PADDLE_Y,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    };
    score = 0;
    celebrationTimer = 0;
    mouseX = null;
    bricks = createBricks();
    resetBall();
    updateHUD();
  }

  function updateHUD() {
    var el = document.getElementById('hudScore');
    if (el) el.textContent = score;
  }

  function launchBall() {
    if (launched) return;
    launched = true;
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    ball.vx = Math.cos(angle) * BALL_SPEED;
    ball.vy = Math.sin(angle) * BALL_SPEED;
  }

  function onMouseMove(e) {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (WIDTH / rect.width);
  }

  function onClick() {
    if (!launched) launchBall();
  }

  function onTouchMove(e) {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var touch = e.touches[0];
    if (touch) {
      mouseX = (touch.clientX - rect.left) * (WIDTH / rect.width);
    }
  }

  function onTouchStart() {
    if (!launched) launchBall();
  }

  // ---- Update ----
  function update(dt) {
    if (celebrationTimer > 0) {
      celebrationTimer -= dt;
      if (particles) particles.update(dt);
      if (celebrationTimer <= 0) {
        bricks = createBricks();
        resetBall();
      }
      return;
    }

    if (input) input.update();

    // Paddle movement — keyboard
    if (input && input.isKeyDown('ArrowLeft')) {
      paddle.x -= PADDLE_SPEED * dt;
    }
    if (input && input.isKeyDown('ArrowRight')) {
      paddle.x += PADDLE_SPEED * dt;
    }

    // Paddle movement — mouse
    if (mouseX !== null) {
      paddle.x = mouseX - PADDLE_WIDTH / 2;
    }

    // Clamp paddle
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + PADDLE_WIDTH > WIDTH) paddle.x = WIDTH - PADDLE_WIDTH;

    // Launch on key
    if (!launched && input) {
      if (input.isKeyPressed('ArrowUp') || input.isKeyPressed(' ') || input.isKeyPressed('Enter')) {
        launchBall();
      }
    }

    // Ball stuck to paddle
    if (!launched) {
      ball.x = paddle.x + PADDLE_WIDTH / 2;
      ball.y = PADDLE_Y - BALL_RADIUS;
      return;
    }

    // Trail
    trailPositions.unshift({ x: ball.x, y: ball.y });
    if (trailPositions.length > 8) trailPositions.pop();

    // Move ball
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Wall collisions
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + ball.radius > WIDTH) {
      ball.x = WIDTH - ball.radius;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }

    // Paddle collision
    if (ball.vy > 0 && Engine.Collision.circleRect(ball, paddle)) {
      ball.y = paddle.y - ball.radius;
      var hitPos = (ball.x - paddle.x) / PADDLE_WIDTH;
      var angle = -Math.PI * 0.85 + hitPos * Math.PI * 0.7;
      ball.vx = Math.cos(angle) * BALL_SPEED;
      ball.vy = Math.sin(angle) * BALL_SPEED;
      if (audio) audio.play('hit');
    }

    // Brick collisions
    for (var i = 0; i < bricks.length; i++) {
      var brick = bricks[i];
      if (!brick.alive) continue;
      if (Engine.Collision.circleRect(ball, brick)) {
        brick.alive = false;
        score += 10;
        updateHUD();

        // Determine bounce direction
        var brickCenterX = brick.x + brick.width / 2;
        var brickCenterY = brick.y + brick.height / 2;
        var dx = ball.x - brickCenterX;
        var dy = ball.y - brickCenterY;

        if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }

        // Effects
        if (particles) {
          particles.emit({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height / 2,
            count: 12,
            color: brick.color,
            speed: 150,
            life: 0.5,
            size: 3
          });
        }
        if (audio) audio.play('explode');
        if (canvas) Engine.Renderer.screenShake(canvas, 3, 0.15);

        break; // one brick per frame
      }
    }

    // Check win
    var allCleared = true;
    for (var j = 0; j < bricks.length; j++) {
      if (bricks[j].alive) { allCleared = false; break; }
    }
    if (allCleared) {
      celebrationTimer = 1.5;
      if (audio) audio.play('score');
      // Celebration particles
      if (particles) {
        for (var k = 0; k < 8; k++) {
          particles.emit({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT * 0.5,
            count: 20,
            color: ROW_COLORS[k % ROW_COLORS.length],
            speed: 200,
            life: 1.2,
            size: 4
          });
        }
      }
    }

    // Death — ball below screen
    if (ball.y - ball.radius > HEIGHT) {
      if (audio) audio.play('die');
      resetBall();
    }

    if (particles) particles.update(dt);
  }

  // ---- Render ----
  function render(context) {
    var c = context || ctx;
    if (!c) return;

    Engine.Renderer.clear(c, WIDTH, HEIGHT, '#0B1120');

    // Bricks
    for (var i = 0; i < bricks.length; i++) {
      var brick = bricks[i];
      if (!brick.alive) continue;

      c.save();
      c.fillStyle = brick.color;
      c.shadowColor = brick.color;
      c.shadowBlur = 4;
      roundRect(c, brick.x, brick.y, brick.width, brick.height, 3);
      c.fill();
      c.restore();

      // Shine highlight
      c.save();
      c.globalAlpha = 0.2;
      c.fillStyle = '#FFFFFF';
      roundRect(c, brick.x + 2, brick.y + 1, brick.width - 4, brick.height / 3, 2);
      c.fill();
      c.restore();
    }

    // Ball trail
    if (launched && trailPositions) {
      for (var t = 0; t < trailPositions.length; t++) {
        var tp = trailPositions[t];
        var alpha = 0.35 - t * 0.04;
        var trailSize = BALL_RADIUS * (1 - t * 0.08);
        // Red→blue fade
        var blend = t / trailPositions.length;
        c.beginPath();
        c.arc(tp.x, tp.y, Math.max(1, trailSize), 0, Math.PI * 2);
        c.fillStyle = blend < 0.5
          ? 'rgba(196,30,58,' + alpha + ')'
          : 'rgba(0,45,114,' + alpha + ')';
        c.fill();
      }
    }

    // Ball
    c.beginPath();
    c.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    c.fillStyle = '#FFFFFF';
    c.shadowColor = '#FFFFFF';
    c.shadowBlur = 8;
    c.fill();
    c.shadowBlur = 0;

    // Paddle — metallic bar with red glow edges
    var paddleGrad = c.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + PADDLE_HEIGHT);
    paddleGrad.addColorStop(0, '#AAAAAA');
    paddleGrad.addColorStop(0.3, '#FFFFFF');
    paddleGrad.addColorStop(0.7, '#CCCCCC');
    paddleGrad.addColorStop(1, '#888888');

    c.save();
    c.shadowColor = '#C41E3A';
    c.shadowBlur = 12;
    c.fillStyle = paddleGrad;
    roundRect(c, paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
    c.fill();
    c.restore();

    // Red glow edges on paddle
    c.save();
    c.globalAlpha = 0.6;
    c.fillStyle = '#E8294A';
    roundRect(c, paddle.x, paddle.y, 6, PADDLE_HEIGHT, 3);
    c.fill();
    roundRect(c, paddle.x + PADDLE_WIDTH - 6, paddle.y, 6, PADDLE_HEIGHT, 3);
    c.fill();
    c.restore();

    // Particles
    if (particles) particles.render(c);

    // Vignette and grain
    Engine.Renderer.drawVignette(c, WIDTH, HEIGHT);
  }

  function roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
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

      // Mouse/touch listeners
      if (canvas) {
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('click', onClick);
        canvas.addEventListener('touchmove', onTouchMove);
        canvas.addEventListener('touchstart', onTouchStart);
      }
    },

    update: function (dt) {
      update(dt);
    },

    render: function (context) {
      render(context);
    },

    handleInput: function (event) {
      // Input is handled via Engine.Input; this is for external events
      if (event && event.type === 'click' && !launched) {
        launchBall();
      }
    },

    reset: function () {
      if (particles) particles.clear();
      resetState();
    },

    getState: function () {
      return {
        paddle: paddle,
        ball: ball,
        bricks: bricks,
        score: score,
        launched: launched,
        celebrationTimer: celebrationTimer,
        WIDTH: WIDTH,
        HEIGHT: HEIGHT,
        PADDLE_WIDTH: PADDLE_WIDTH,
        PADDLE_HEIGHT: PADDLE_HEIGHT,
        BALL_RADIUS: BALL_RADIUS,
        BALL_SPEED: BALL_SPEED,
        BRICK_COLS: BRICK_COLS,
        BRICK_ROWS: BRICK_ROWS
      };
    },

    destroy: function () {
      if (gameLoop) gameLoop.stop();
      if (input) input.destroy();
      if (particles) particles.clear();

      if (canvas) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('click', onClick);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchstart', onTouchStart);
      }

      canvas = null;
      ctx = null;
      gameLoop = null;
      input = null;
      particles = null;
      audio = null;
    },

    // Exposed for testing — allows setting internal state
    _setInput: function (inp) { input = inp; },
    _setParticles: function (p) { particles = p; },
    _setAudio: function (a) { audio = a; },
    _launchBall: function () { launchBall(); },
    _resetState: function () { resetState(); }
  };
})();
