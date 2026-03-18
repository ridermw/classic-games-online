(function () {
  var T = window.TestFramework;

  function setupGame() {
    var game = window.Games.Mario;
    game._setInput(null);
    game._setParticles(window.Engine.Particles.create());
    game._setAudio(null);
    game._resetState();
    return game;
  }

  function startPlaying(game) {
    game.handleInput({ type: 'keydown', code: 'Space' });
  }

  T.describe('Games.Mario', function () {

    // 1. Initial state
    T.it('initial state: player on ground, state READY, score 0', function () {
      var game = setupGame();
      var s = game.getState();

      T.expect(s.state).toBe('READY');
      T.expect(s.score).toBe(0);
      T.expect(s.player.onGround).toBeTrue();
      T.expect(s.player.y + s.player.height).toBe(s.GROUND_Y);
    });

    // 2. Jump mechanics
    T.it('jump: space sets negative velocity, player goes up', function () {
      var game = setupGame();
      startPlaying(game);

      game.handleInput({ type: 'keydown', code: 'Space' });
      var s = game.getState();

      T.expect(s.player.vy).toBe(s.JUMP_VEL);
      T.expect(s.player.vy).toBeLessThan(0);
      T.expect(s.player.onGround).toBeFalse();
    });

    // 3. Gravity: player falls back to ground after jump
    T.it('gravity: player returns to ground after jump', function () {
      var game = setupGame();
      startPlaying(game);
      game.handleInput({ type: 'keydown', code: 'Space' });

      // After jump, run enough frames for full arc (peak ~frame 20, land ~frame 40)
      for (var i = 0; i < 50; i++) {
        game.update(1 / 60);
      }

      var s = game.getState();
      T.expect(s.player.onGround).toBeTrue();
      T.expect(s.player.y + s.player.height).toBe(s.GROUND_Y);
    });

    // 4. Ground collision: player stops at ground level
    T.it('ground collision: player rests exactly at ground level', function () {
      var game = setupGame();
      var s = game.getState();

      T.expect(s.player.y + s.player.height).toBe(s.GROUND_Y);
      T.expect(s.player.vy).toBe(0);
    });

    // 5. No double jump
    T.it('no double jump: cannot jump while airborne', function () {
      var game = setupGame();
      startPlaying(game);

      game.handleInput({ type: 'keydown', code: 'Space' });
      var vyAfterJump = game.getState().player.vy;

      // Try to jump again while airborne
      game.handleInput({ type: 'keydown', code: 'Space' });
      T.expect(game.getState().player.vy).toBe(vyAfterJump);
    });

    // 6. Obstacle generation
    T.it('obstacle generation: obstacles appear from right side', function () {
      var game = setupGame();
      startPlaying(game);

      game._spawnObstacle();
      var s = game.getState();

      T.expect(s.obstacles.length).toBe(1);
      T.expect(s.obstacles[0].x).toBeGreaterThan(s.WIDTH - 1);
    });

    // 7. Obstacle collision triggers death
    T.it('obstacle collision: hitting spike triggers death', function () {
      var game = setupGame();
      startPlaying(game);

      // Place spike overlapping the player
      var s = game.getState();
      s.obstacles.push({
        type: 'spike',
        x: s.player.x,
        y: s.player.y,
        width: 20,
        height: 30
      });

      game.update(1 / 60);
      T.expect(game.getState().state).toBe('DEAD');
    });

    // 8. Coin collection
    T.it('coin collection: overlapping coin increases score and removes coin', function () {
      var game = setupGame();
      startPlaying(game);

      // Place coin at player position
      var s = game.getState();
      s.coins.push({
        x: s.player.x,
        y: s.player.y,
        width: 16,
        height: 16,
        spinAngle: 0
      });

      T.expect(s.coins.length).toBe(1);
      game.update(1 / 60);

      s = game.getState();
      T.expect(s.score).toBe(10);
      T.expect(s.coins.length).toBe(0);
    });

    // 9. Death reset
    T.it('death reset: after death pause, returns to READY state', function () {
      var game = setupGame();
      startPlaying(game);

      // Trigger death via spike collision
      var s = game.getState();
      s.obstacles.push({
        type: 'spike',
        x: s.player.x,
        y: s.player.y,
        width: 20,
        height: 30
      });

      game.update(1 / 60);
      T.expect(game.getState().state).toBe('DEAD');

      // Advance past death pause (0.5s)
      game.update(0.6);
      T.expect(game.getState().state).toBe('READY');
      T.expect(game.getState().score).toBe(0);
    });

    // 10. World scroll
    T.it('world scroll: obstacles and coins move left each frame', function () {
      var game = setupGame();
      startPlaying(game);

      game._spawnObstacle();
      game._spawnCoin(900);

      var s = game.getState();
      var obsX = s.obstacles[0].x;
      var coinX = s.coins[0].x;

      game.update(1 / 60);

      s = game.getState();
      T.expect(s.obstacles[0].x).toBeLessThan(obsX);
      T.expect(s.coins[0].x).toBeLessThan(coinX);
    });
  });
})();
