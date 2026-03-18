(function () {
  var T = window.TestFramework;

  // Minimal mock helpers
  function mockCanvas() {
    var gradientObj = {
      addColorStop: function () {}
    };
    return {
      width: 800,
      height: 600,
      style: { transform: '' },
      getContext: function () { return mockCtx(); },
      addEventListener: function () {},
      removeEventListener: function () {},
      getBoundingClientRect: function () { return { left: 0, top: 0, width: 800, height: 600 }; }
    };
  }

  function mockCtx() {
    var gradientObj = { addColorStop: function () {} };
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      font: '',
      textAlign: '',
      fillRect: function () {},
      clearRect: function () {},
      beginPath: function () {},
      closePath: function () {},
      moveTo: function () {},
      lineTo: function () {},
      arc: function () {},
      fill: function () {},
      stroke: function () {},
      save: function () {},
      restore: function () {},
      quadraticCurveTo: function () {},
      createLinearGradient: function () { return gradientObj; },
      createRadialGradient: function () { return gradientObj; },
      getImageData: function (x, y, w, h) {
        return { data: new Uint8ClampedArray(w * h * 4) };
      },
      putImageData: function () {}
    };
  }

  // Helper: create a fresh game state without starting the game loop
  function setupGame() {
    var game = window.Games.Breakout;
    // Use internal reset to get fresh state without needing canvas listeners
    game._setInput(null);
    game._setParticles(window.Engine.Particles.create());
    game._setAudio(null);
    game._resetState();
    return game;
  }

  T.describe('Games.Breakout', function () {

    // 1. Initial state
    T.it('initial state: ball stuck to paddle, score 0, all bricks present', function () {
      var game = setupGame();
      var state = game.getState();

      T.expect(state.launched).toBeFalse();
      T.expect(state.score).toBe(0);

      var aliveBricks = 0;
      for (var i = 0; i < state.bricks.length; i++) {
        if (state.bricks[i].alive) aliveBricks++;
      }
      T.expect(aliveBricks).toBe(state.BRICK_COLS * state.BRICK_ROWS);
      T.expect(state.bricks.length).toBe(50);
    });

    // 2. Ball launch
    T.it('ball launch: after launch, ball is moving (vy < 0)', function () {
      var game = setupGame();
      game._launchBall();
      var state = game.getState();

      T.expect(state.launched).toBeTrue();
      T.expect(state.ball.vy).toBeLessThan(0);
    });

    // 3. Paddle movement
    T.it('paddle movement: left/right keys move paddle within bounds', function () {
      var game = setupGame();
      var state = game.getState();
      var startX = state.paddle.x;

      // Simulate holding right key via a mock input
      game._setInput({
        isKeyDown: function (key) { return key === 'ArrowRight'; },
        isKeyPressed: function () { return false; },
        update: function () {},
        destroy: function () {}
      });

      game.update(0.1);
      state = game.getState();
      T.expect(state.paddle.x).toBeGreaterThan(startX);

      // Simulate holding left key
      var rightX = state.paddle.x;
      game._setInput({
        isKeyDown: function (key) { return key === 'ArrowLeft'; },
        isKeyPressed: function () { return false; },
        update: function () {},
        destroy: function () {}
      });

      game.update(0.1);
      state = game.getState();
      T.expect(state.paddle.x).toBeLessThan(rightX);
    });

    // 4. Ball-wall collision: ball bounces off left/right/top walls
    T.it('ball-wall collision: ball bounces off left wall', function () {
      var game = setupGame();
      game._launchBall();
      var state = game.getState();

      // Force ball to left edge moving left
      state.ball.x = 2;
      state.ball.vx = -300;
      state.ball.vy = -200;

      game.update(0.016);
      state = game.getState();
      T.expect(state.ball.vx).toBeGreaterThan(0);
    });

    T.it('ball-wall collision: ball bounces off right wall', function () {
      var game = setupGame();
      game._launchBall();
      var state = game.getState();

      state.ball.x = state.WIDTH - 2;
      state.ball.vx = 300;
      state.ball.vy = -200;

      game.update(0.016);
      state = game.getState();
      T.expect(state.ball.vx).toBeLessThan(0);
    });

    T.it('ball-wall collision: ball bounces off top wall', function () {
      var game = setupGame();
      game._launchBall();
      var state = game.getState();

      state.ball.x = 400;
      state.ball.y = 2;
      state.ball.vx = 100;
      state.ball.vy = -300;

      game.update(0.016);
      state = game.getState();
      T.expect(state.ball.vy).toBeGreaterThan(0);
    });

    // 5. Ball-paddle collision
    T.it('ball-paddle collision: ball reverses vertical direction', function () {
      var game = setupGame();
      game._launchBall();
      var state = game.getState();

      // Position ball just above paddle, moving down
      state.ball.x = state.paddle.x + state.PADDLE_WIDTH / 2;
      state.ball.y = state.paddle.y - state.ball.radius - 1;
      state.ball.vx = 0;
      state.ball.vy = 300;

      game.update(0.016);
      state = game.getState();
      T.expect(state.ball.vy).toBeLessThan(0);
    });

    // 6. Ball-brick collision
    T.it('ball-brick collision: brick removed, score +10, particles emitted', function () {
      var game = setupGame();
      var emitCount = 0;
      game._setParticles({
        emit: function () { emitCount++; },
        update: function () {},
        render: function () {},
        clear: function () {},
        count: function () { return 0; }
      });

      game._launchBall();
      var state = game.getState();

      // Position ball right at first brick
      var brick = state.bricks[0];
      state.ball.x = brick.x + brick.width / 2;
      state.ball.y = brick.y + brick.height + state.ball.radius + 1;
      state.ball.vx = 0;
      state.ball.vy = -300;

      game.update(0.016);
      state = game.getState();

      T.expect(state.bricks[0].alive).toBeFalse();
      T.expect(state.score).toBe(10);
      T.expect(emitCount).toBeGreaterThan(0);
    });

    // 7. Ball death: ball below canvas → reset state
    T.it('ball death: ball below canvas resets to stuck state', function () {
      var game = setupGame();
      game._launchBall();
      var state = game.getState();

      // Move ball below canvas
      state.ball.y = state.HEIGHT + 50;
      state.ball.vy = 300;

      game.update(0.016);
      state = game.getState();

      T.expect(state.launched).toBeFalse();
    });

    // 8. Win condition: all bricks cleared → bricks reset
    T.it('win condition: all bricks cleared triggers celebration and reset', function () {
      var game = setupGame();
      game._setParticles({
        emit: function () {},
        update: function () {},
        render: function () {},
        clear: function () {},
        count: function () { return 0; }
      });

      game._launchBall();
      var state = game.getState();

      // Kill all bricks
      for (var i = 0; i < state.bricks.length; i++) {
        state.bricks[i].alive = false;
      }

      // Leave one brick alive so ball-brick collision triggers the last kill
      state.bricks[state.bricks.length - 1].alive = true;
      var lastBrick = state.bricks[state.bricks.length - 1];
      state.ball.x = lastBrick.x + lastBrick.width / 2;
      state.ball.y = lastBrick.y + lastBrick.height + state.ball.radius + 1;
      state.ball.vx = 0;
      state.ball.vy = -300;

      game.update(0.016);
      state = game.getState();

      // Celebration timer should be active
      T.expect(state.celebrationTimer).toBeGreaterThan(0);

      // Advance time past celebration
      game.update(2.0);
      state = game.getState();

      // Bricks should be reset — all alive again
      var aliveBricks = 0;
      for (var j = 0; j < state.bricks.length; j++) {
        if (state.bricks[j].alive) aliveBricks++;
      }
      T.expect(aliveBricks).toBe(state.BRICK_COLS * state.BRICK_ROWS);
    });

    // 9. Paddle stays within canvas bounds
    T.it('paddle stays within canvas bounds on left', function () {
      var game = setupGame();
      var state = game.getState();
      state.paddle.x = -50;

      game._setInput({
        isKeyDown: function (key) { return key === 'ArrowLeft'; },
        isKeyPressed: function () { return false; },
        update: function () {},
        destroy: function () {}
      });

      game.update(0.016);
      state = game.getState();
      T.expect(state.paddle.x).toBeCloseTo(0, 0);
    });

    T.it('paddle stays within canvas bounds on right', function () {
      var game = setupGame();
      var state = game.getState();
      state.paddle.x = state.WIDTH;

      game._setInput({
        isKeyDown: function (key) { return key === 'ArrowRight'; },
        isKeyPressed: function () { return false; },
        update: function () {},
        destroy: function () {}
      });

      game.update(0.016);
      state = game.getState();
      T.expect(state.paddle.x + state.PADDLE_WIDTH).toBeLessThan(state.WIDTH + 1);
    });
  });
})();
