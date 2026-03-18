(function () {
  var T = window.TestFramework;

  function noop() {}
  function mockParticles() {
    return {
      emit: noop,
      update: noop,
      render: noop,
      clear: noop,
      count: function () { return 0; }
    };
  }
  function mockInput(overrides) {
    return {
      isKeyDown: (overrides && overrides.isKeyDown) || function () { return false; },
      isKeyPressed: (overrides && overrides.isKeyPressed) || function () { return false; },
      update: noop,
      destroy: noop
    };
  }

  function setupGame() {
    var game = window.Games.Flappy;
    game._setInput(null);
    game._setParticles(mockParticles());
    game._setAudio(null);
    game._resetState();
    return game;
  }

  T.describe('Games.Flappy', function () {

    // 1. Initial state
    T.it('initial state: bird at center-left, state = READY, score = 0, no pipes', function () {
      var game = setupGame();
      var s = game.getState();

      T.expect(s.state).toBe('READY');
      T.expect(s.score).toBe(0);
      T.expect(s.pipes.length).toBe(0);
      T.expect(s.bird.x).toBe(s.BIRD_X);
      T.expect(s.bird.y).toBeCloseTo(s.HEIGHT / 2, 0);
    });

    // 2. Flap mechanics
    T.it('flap sets negative vertical velocity', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();

      T.expect(s.state).toBe('PLAYING');
      T.expect(s.bird.vy).toBe(s.FLAP_VEL);
      T.expect(s.bird.vy).toBeLessThan(0);
    });

    // 3. Gravity
    T.it('gravity: bird falls when no flap (velocity increases positively)', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();
      var initialVy = s.bird.vy;

      // Run several frames — bird should accelerate downward
      for (var i = 0; i < 10; i++) {
        game.update(0.016);
      }
      s = game.getState();
      T.expect(s.bird.vy).toBeGreaterThan(initialVy);
    });

    // 4. Pipe generation
    T.it('pipe generation: pipes appear and scroll left', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();

      // Manually spawn a pipe
      game._spawnPipe();
      s = game.getState();
      T.expect(s.pipes.length).toBe(1);
      T.expect(s.pipes[0].x).toBe(s.WIDTH);

      // Run frames to scroll pipes
      var initialX = s.pipes[0].x;
      for (var i = 0; i < 5; i++) {
        game.update(0.016);
      }
      s = game.getState();
      T.expect(s.pipes[0].x).toBeLessThan(initialX);
    });

    // 5. Scoring
    T.it('score increments when bird passes pipe', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();

      // Spawn a pipe and position it so bird is about to pass it
      game._spawnPipe();
      s = game.getState();

      // Move pipe so its center is just ahead of the bird
      s.pipes[0].x = s.bird.x - s.PIPE_WIDTH / 2 + 1;
      s.pipes[0].gapY = s.bird.y - s.PIPE_GAP / 2;

      // Keep bird safe in the gap
      s.bird.y = s.pipes[0].gapY + s.PIPE_GAP / 2;
      s.bird.vy = 0;

      game.update(0.016);
      s = game.getState();
      T.expect(s.score).toBe(1);
      T.expect(s.pipes[0].scored).toBeTrue();
    });

    // 6. Collision detection: bird hitting pipe triggers death
    T.it('collision: bird hitting pipe triggers death', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();

      // Spawn a pipe at the bird's x position
      game._spawnPipe();
      s = game.getState();
      s.pipes[0].x = s.bird.x - s.PIPE_WIDTH / 2;
      // Set gap far below bird so bird is inside the top pipe
      s.pipes[0].gapY = s.bird.y + 100;
      s.bird.vy = 0;

      game.update(0.016);
      s = game.getState();
      T.expect(s.state).toBe('DEAD');
    });

    // 7. Ground collision
    T.it('ground collision: bird below canvas = death', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();

      // Position bird at ground
      s.bird.y = s.HEIGHT - s.GROUND_HEIGHT;
      s.bird.vy = 5;

      game.update(0.016);
      s = game.getState();
      T.expect(s.state).toBe('DEAD');
    });

    // 8. Ceiling collision
    T.it('ceiling collision: bird above canvas = death', function () {
      var game = setupGame();
      game._flap();
      var s = game.getState();

      // Position bird at ceiling
      s.bird.y = 0;
      s.bird.vy = -10;

      game.update(0.016);
      s = game.getState();
      T.expect(s.state).toBe('DEAD');
    });

    // 9. Death reset
    T.it('death reset: after death, state returns to READY', function () {
      var game = setupGame();
      game._flap();
      game._die();
      var s = game.getState();
      T.expect(s.state).toBe('DEAD');

      // Advance past death timer (1.5s)
      for (var i = 0; i < 120; i++) {
        game.update(0.016);
      }
      s = game.getState();
      T.expect(s.state).toBe('READY');
      T.expect(s.score).toBe(0);
    });

    // 10. Bird rotation
    T.it('bird rotation: positive velocity = nose down, negative = nose up', function () {
      var game = setupGame();
      game._flap();

      // Right after flap, vy is negative → rotation should be negative (nose up)
      game.update(0.016);
      var s = game.getState();
      T.expect(s.bird.rotation).toBeLessThan(0);

      // Let bird fall for many frames until vy is positive
      for (var i = 0; i < 60; i++) {
        game.update(0.016);
      }
      s = game.getState();
      T.expect(s.bird.vy).toBeGreaterThan(0);
      T.expect(s.bird.rotation).toBeGreaterThan(0);
    });

  });
})();
