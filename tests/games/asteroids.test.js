(function () {
  var T = window.TestFramework;
  var Asteroids = window.Games.Asteroids;
  var test = Asteroids._test;

  // Stub helpers
  function stubInput() {
    var downs = {};
    var pressed = {};
    var buffer = {};
    return {
      isKeyDown: function (k) { return !!downs[k]; },
      isKeyPressed: function (k) { return !!pressed[k]; },
      update: function () { pressed = buffer; buffer = {}; },
      destroy: function () {},
      _setDown: function (k, v) { downs[k] = v; },
      _setPressed: function (k, v) { buffer[k] = v; }
    };
  }

  function stubParticles() {
    return {
      emit: function () {},
      update: function () {},
      render: function () {},
      clear: function () {},
      count: function () { return 0; }
    };
  }

  function stubAudio() {
    return {
      play: function () {},
      setEnabled: function () {},
      isEnabled: function () { return false; }
    };
  }

  function setup() {
    test.setInput(stubInput());
    test.setParticles(stubParticles());
    test.setAudio(stubAudio());
    test.setCanvas(null);
    test.setCtx(null);
    test.initState();
    return Asteroids.getState();
  }

  T.describe('Games.Asteroids', function () {

    // 1. Initial state
    T.it('initial state: ship at center, 4 large asteroids, score 0', function () {
      var s = setup();
      T.expect(s.ship.x).toBe(test.W / 2);
      T.expect(s.ship.y).toBe(test.H / 2);
      T.expect(s.score).toBe(0);
      T.expect(s.asteroids.length).toBe(4);
      for (var i = 0; i < s.asteroids.length; i++) {
        T.expect(s.asteroids[i].size).toBe('large');
      }
    });

    // 2. Ship rotation
    T.it('ship rotation: left key decreases angle', function () {
      setup();
      var inp = stubInput();
      test.setInput(inp);
      var before = Asteroids.getState().ship.angle;
      inp._setDown('ArrowLeft', true);
      Asteroids.update(1 / 60);
      var after = Asteroids.getState().ship.angle;
      T.expect(after).toBeLessThan(before);
    });

    T.it('ship rotation: right key increases angle', function () {
      setup();
      var inp = stubInput();
      test.setInput(inp);
      var before = Asteroids.getState().ship.angle;
      inp._setDown('ArrowRight', true);
      Asteroids.update(1 / 60);
      var after = Asteroids.getState().ship.angle;
      T.expect(after).toBeGreaterThan(before);
    });

    // 3. Ship thrust
    T.it('ship thrust: up key increases velocity in facing direction', function () {
      setup();
      var inp = stubInput();
      test.setInput(inp);
      var s = Asteroids.getState();
      s.ship.angle = 0; // facing right
      var vxBefore = s.ship.vx;
      inp._setDown('ArrowUp', true);
      Asteroids.update(1 / 60);
      T.expect(Asteroids.getState().ship.vx).toBeGreaterThan(vxBefore);
    });

    // 4. Ship drag
    T.it('ship drag: velocity decays over time', function () {
      setup();
      var inp = stubInput();
      test.setInput(inp);
      var s = Asteroids.getState();
      s.ship.vx = 100;
      s.ship.vy = 0;
      s.ship.angle = 0;
      // No thrust — just let drag work
      Asteroids.update(1 / 60);
      T.expect(Asteroids.getState().ship.vx).toBeLessThan(100);
    });

    // 5. Bullet creation
    T.it('bullet creation: space key creates bullet at ship nose', function () {
      setup();
      var inp = stubInput();
      test.setInput(inp);
      T.expect(Asteroids.getState().bullets.length).toBe(0);
      inp._setPressed(' ', true);
      Asteroids.update(1 / 60);
      T.expect(Asteroids.getState().bullets.length).toBe(1);
    });

    // 6. Bullet expiry
    T.it('bullet expiry: bullets removed after 1.5s', function () {
      setup();
      var s = Asteroids.getState();
      // Remove all asteroids to prevent collisions
      s.asteroids.length = 0;
      test.fireBullet();
      T.expect(s.bullets.length).toBe(1);
      // Advance slightly less than lifetime
      var inp = stubInput();
      test.setInput(inp);
      Asteroids.update(1.4);
      T.expect(Asteroids.getState().bullets.length).toBe(1);
      // Advance past lifetime
      Asteroids.update(0.2);
      T.expect(Asteroids.getState().bullets.length).toBe(0);
    });

    // 7. Wraparound
    T.it('wraparound: objects wrap when going off-screen', function () {
      var obj = { x: -5, y: -5 };
      test.wrap(obj);
      T.expect(obj.x).toBeGreaterThan(0);
      T.expect(obj.y).toBeGreaterThan(0);

      var obj2 = { x: test.W + 5, y: test.H + 5 };
      test.wrap(obj2);
      T.expect(obj2.x).toBeLessThan(test.W);
      T.expect(obj2.y).toBeLessThan(test.H);
    });

    // 8. Asteroid splitting
    T.it('asteroid splitting: large → 2 medium, medium → 2 small, small → gone', function () {
      var large = test.createAsteroid(100, 100, 'large');
      var mediums = test.splitAsteroid(large);
      T.expect(mediums.length).toBe(2);
      T.expect(mediums[0].size).toBe('medium');
      T.expect(mediums[1].size).toBe('medium');

      var smalls = test.splitAsteroid(mediums[0]);
      T.expect(smalls.length).toBe(2);
      T.expect(smalls[0].size).toBe('small');

      var gone = test.splitAsteroid(smalls[0]);
      T.expect(gone.length).toBe(0);
    });

    // 9. Scoring
    T.it('scoring: correct points per asteroid size', function () {
      T.expect(test.ASTEROID_SIZES.large.score).toBe(25);
      T.expect(test.ASTEROID_SIZES.medium.score).toBe(50);
      T.expect(test.ASTEROID_SIZES.small.score).toBe(100);
    });

    // 10. Wave spawn
    T.it('wave spawn: new wave appears when all asteroids destroyed', function () {
      setup();
      var inp = stubInput();
      test.setInput(inp);
      var s = Asteroids.getState();
      // Clear all asteroids
      s.asteroids.length = 0;
      // Tick to trigger wave check
      Asteroids.update(1 / 60);
      var newState = Asteroids.getState();
      T.expect(newState.asteroids.length).toBeGreaterThan(0);
      T.expect(newState.wave).toBe(2);
    });
  });
})();
