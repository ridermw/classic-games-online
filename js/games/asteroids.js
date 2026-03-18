// Raider Space Defense — Asteroids clone for Walton Raiders Classic Games
window.Games = window.Games || {};

window.Games.Asteroids = (function () {
  'use strict';

  var W = 800;
  var H = 600;
  var DRAG = 0.99;
  var MAX_SPEED = 300;
  var ROTATION_SPEED = 4.5;
  var THRUST_POWER = 280;
  var BULLET_SPEED = 400;
  var BULLET_LIFE = 1.5;
  var SHIP_RADIUS = 14;
  var INITIAL_ASTEROIDS = 4;

  var ASTEROID_SIZES = {
    large:  { radius: 40, score: 25,  speed: 40 },
    medium: { radius: 20, score: 50,  speed: 70 },
    small:  { radius: 10, score: 100, speed: 110 }
  };

  var COLORS = {
    red: '#C41E3A',
    redBright: '#E8294A',
    blue: '#002D72',
    blueBright: '#1A56DB',
    bg: '#0B1120',
    white: '#FFFFFF',
    whiteSoft: 'rgba(255,255,255,0.87)'
  };

  // --- State ---
  var canvas, ctx;
  var gameLoop, input, particles, audio;
  var ship, bullets, asteroids, stars;
  var score, wave, alive;

  // --- Helpers ---
  function wrap(obj) {
    if (obj.x < 0) obj.x += W;
    if (obj.x > W) obj.x -= W;
    if (obj.y < 0) obj.y += H;
    if (obj.y > H) obj.y -= H;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function generateAsteroidShape(radius) {
    var verts = [];
    var numVerts = 8 + Math.floor(Math.random() * 5);
    for (var i = 0; i < numVerts; i++) {
      var angle = (i / numVerts) * Math.PI * 2;
      var wobble = radius * (0.7 + Math.random() * 0.3);
      verts.push({ angle: angle, r: wobble });
    }
    return verts;
  }

  function createAsteroid(x, y, size) {
    var info = ASTEROID_SIZES[size];
    var angle = Math.random() * Math.PI * 2;
    var speed = info.speed * (0.6 + Math.random() * 0.4);
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: info.radius,
      size: size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      shape: generateAsteroidShape(info.radius)
    };
  }

  function spawnAsteroids(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      var x, y;
      do {
        x = Math.random() * W;
        y = Math.random() * H;
      } while (Math.hypot(x - ship.x, y - ship.y) < 150);
      arr.push(createAsteroid(x, y, 'large'));
    }
    return arr;
  }

  function createStarField() {
    var s = [];
    for (var i = 0; i < 120; i++) {
      s.push({
        x: Math.random() * W,
        y: Math.random() * H,
        brightness: 0.3 + Math.random() * 0.7,
        size: 0.5 + Math.random() * 1.5
      });
    }
    return s;
  }

  function emitExplosion(x, y, count) {
    var colors = [COLORS.red, COLORS.redBright, COLORS.white, COLORS.blueBright];
    for (var i = 0; i < colors.length; i++) {
      particles.emit({
        x: x, y: y,
        count: Math.ceil(count / colors.length),
        color: colors[i],
        speed: 120,
        life: 0.7,
        spread: Math.PI * 2,
        size: 2.5
      });
    }
  }

  // --- Core ---
  function resetShip() {
    ship = {
      x: W / 2,
      y: H / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: SHIP_RADIUS,
      thrusting: false
    };
  }

  function initState() {
    score = 0;
    wave = 1;
    alive = true;
    bullets = [];
    resetShip();
    asteroids = spawnAsteroids(INITIAL_ASTEROIDS);
    stars = createStarField();
    if (particles) particles.clear();
  }

  function fireBullet() {
    var noseX = ship.x + Math.cos(ship.angle) * SHIP_RADIUS;
    var noseY = ship.y + Math.sin(ship.angle) * SHIP_RADIUS;
    bullets.push({
      x: noseX,
      y: noseY,
      vx: Math.cos(ship.angle) * BULLET_SPEED,
      vy: Math.sin(ship.angle) * BULLET_SPEED,
      radius: 2,
      life: BULLET_LIFE
    });
    if (audio) audio.play('shoot');
  }

  function splitAsteroid(asteroid) {
    var nextSize = null;
    if (asteroid.size === 'large') nextSize = 'medium';
    else if (asteroid.size === 'medium') nextSize = 'small';

    var children = [];
    if (nextSize) {
      for (var i = 0; i < 2; i++) {
        children.push(createAsteroid(asteroid.x, asteroid.y, nextSize));
      }
    }
    return children;
  }

  function updateHUD() {
    var el = typeof document !== 'undefined' && document.getElementById('hudScore');
    if (el) el.textContent = score;
  }

  // --- Update / Render ---
  function update(dt) {
    if (input) input.update();

    if (!alive) {
      if (particles) particles.update(dt);
      alive = true;
      resetShip();
      return;
    }

    // Ship rotation
    if ((input && input.isKeyDown('ArrowLeft')) || (input && input.isKeyDown('a'))) {
      ship.angle -= ROTATION_SPEED * dt;
    }
    if ((input && input.isKeyDown('ArrowRight')) || (input && input.isKeyDown('d'))) {
      ship.angle += ROTATION_SPEED * dt;
    }

    // Ship thrust
    ship.thrusting = false;
    if ((input && input.isKeyDown('ArrowUp')) || (input && input.isKeyDown('w'))) {
      ship.vx += Math.cos(ship.angle) * THRUST_POWER * dt;
      ship.vy += Math.sin(ship.angle) * THRUST_POWER * dt;
      ship.thrusting = true;
    }

    // Clamp speed
    var speed = Math.hypot(ship.vx, ship.vy);
    if (speed > MAX_SPEED) {
      ship.vx = (ship.vx / speed) * MAX_SPEED;
      ship.vy = (ship.vy / speed) * MAX_SPEED;
    }

    // Drag
    ship.vx *= DRAG;
    ship.vy *= DRAG;

    // Move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    wrap(ship);

    // Fire
    if (input && input.isKeyPressed(' ')) {
      fireBullet();
    }

    // Update bullets
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      wrap(b);
      if (b.life <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (var j = 0; j < asteroids.length; j++) {
      var a = asteroids[j];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotSpeed * dt;
      wrap(a);
    }

    // Bullet–asteroid collisions
    for (var bi = bullets.length - 1; bi >= 0; bi--) {
      var bullet = bullets[bi];
      for (var ai = asteroids.length - 1; ai >= 0; ai--) {
        var ast = asteroids[ai];
        if (Engine.Collision.circleCircle(bullet, ast)) {
          // Score
          score += ASTEROID_SIZES[ast.size].score;
          updateHUD();
          if (audio) audio.play('explode');

          // Effects
          emitExplosion(ast.x, ast.y, 16);
          if (canvas) Engine.Renderer.screenShake(canvas, 3, 0.2);

          // Split
          var children = splitAsteroid(ast);
          for (var c = 0; c < children.length; c++) {
            asteroids.push(children[c]);
          }
          asteroids.splice(ai, 1);
          bullets.splice(bi, 1);
          break;
        }
      }
    }

    // Ship–asteroid collision
    for (var si = 0; si < asteroids.length; si++) {
      if (Engine.Collision.circleCircle(ship, asteroids[si])) {
        alive = false;
        emitExplosion(ship.x, ship.y, 30);
        if (canvas) Engine.Renderer.screenShake(canvas, 6, 0.4);
        if (audio) audio.play('die');
        break;
      }
    }

    // Next wave
    if (asteroids.length === 0) {
      wave++;
      asteroids = spawnAsteroids(INITIAL_ASTEROIDS + wave - 1);
      if (audio) audio.play('score');
    }

    // Particles
    if (particles) particles.update(dt);
  }

  function render(renderCtx) {
    var c = renderCtx || ctx;
    if (!c) return;

    Engine.Renderer.clear(c, W, H, COLORS.bg);

    // Stars
    if (stars) {
      for (var si = 0; si < stars.length; si++) {
        var st = stars[si];
        c.fillStyle = 'rgba(255,255,255,' + st.brightness + ')';
        c.beginPath();
        c.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Asteroids
    for (var ai = 0; ai < asteroids.length; ai++) {
      var a = asteroids[ai];
      c.save();
      c.translate(a.x, a.y);
      c.rotate(a.rotation);
      c.beginPath();
      for (var vi = 0; vi < a.shape.length; vi++) {
        var v = a.shape[vi];
        var px = Math.cos(v.angle) * v.r;
        var py = Math.sin(v.angle) * v.r;
        if (vi === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fillStyle = 'rgba(255,255,255,0.05)';
      c.fill();
      c.strokeStyle = COLORS.whiteSoft;
      c.lineWidth = 1.5;
      c.stroke();
      c.restore();
    }

    // Ship
    if (alive) {
      c.save();
      c.translate(ship.x, ship.y);
      c.rotate(ship.angle);

      // Engine glow when thrusting
      if (ship.thrusting) {
        c.beginPath();
        c.moveTo(-10, -6);
        c.lineTo(-18 - Math.random() * 6, 0);
        c.lineTo(-10, 6);
        c.closePath();
        c.fillStyle = COLORS.blueBright;
        c.globalAlpha = 0.7 + Math.random() * 0.3;
        c.fill();
        c.globalAlpha = 1;
      }

      // Ship body — chevron/shield
      c.beginPath();
      c.moveTo(SHIP_RADIUS, 0);          // nose
      c.lineTo(-10, -10);                // top-left wing
      c.lineTo(-6, 0);                   // indent
      c.lineTo(-10, 10);                 // bottom-left wing
      c.closePath();
      c.fillStyle = COLORS.red;
      c.fill();
      c.strokeStyle = COLORS.white;
      c.lineWidth = 1.5;
      c.stroke();

      c.restore();
    }

    // Bullets
    c.fillStyle = COLORS.white;
    for (var bi = 0; bi < bullets.length; bi++) {
      var b = bullets[bi];
      c.beginPath();
      c.arc(b.x, b.y, 2, 0, Math.PI * 2);
      c.fill();
    }

    // Particles
    if (particles) particles.render(c);

    // Vignette / grain
    Engine.Renderer.drawVignette(c, W, H);
    Engine.Renderer.drawGrain(c, W, H, 0.03);
  }

  // --- Public API ---
  return {
    init: function (cvs, context) {
      canvas = cvs;
      ctx = context;
      input = Engine.Input.create();
      particles = Engine.Particles.create();
      audio = Engine.Audio.create();
      initState();
      gameLoop = Engine.GameLoop.create(update, function () { render(ctx); });
      gameLoop.start();
    },

    update: update,
    render: render,

    handleInput: function () {
      // Input is handled internally via Engine.Input each frame
    },

    reset: function () {
      initState();
    },

    getState: function () {
      return {
        ship: ship,
        bullets: bullets,
        asteroids: asteroids,
        score: score,
        wave: wave,
        alive: alive,
        stars: stars
      };
    },

    destroy: function () {
      if (gameLoop) gameLoop.stop();
      if (input) input.destroy();
      if (particles) particles.clear();
      gameLoop = null;
      input = null;
      particles = null;
      audio = null;
      canvas = null;
      ctx = null;
    },

    // Expose internals for testing
    _test: {
      setInput: function (inp) { input = inp; },
      setParticles: function (p) { particles = p; },
      setAudio: function (a) { audio = a; },
      setCanvas: function (c) { canvas = c; },
      setCtx: function (c) { ctx = c; },
      fireBullet: function () { fireBullet(); },
      splitAsteroid: splitAsteroid,
      createAsteroid: createAsteroid,
      wrap: wrap,
      initState: initState,
      resetShip: resetShip,
      W: W,
      H: H,
      ASTEROID_SIZES: ASTEROID_SIZES,
      DRAG: DRAG,
      BULLET_LIFE: BULLET_LIFE
    }
  };
})();
