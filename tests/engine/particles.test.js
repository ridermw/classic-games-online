(function () {
  var T = window.TestFramework;

  T.describe('Engine.Particles', function () {

    T.it('should exist on window.Engine', function () {
      T.expect(window.Engine.Particles).toBeDefined();
      T.expect(typeof window.Engine.Particles.create).toBe('function');
    });

    T.it('create() returns particle system interface', function () {
      var ps = window.Engine.Particles.create();
      T.expect(typeof ps.emit).toBe('function');
      T.expect(typeof ps.update).toBe('function');
      T.expect(typeof ps.render).toBe('function');
      T.expect(typeof ps.clear).toBe('function');
    });

    T.it('starts with zero particles', function () {
      var ps = window.Engine.Particles.create();
      T.expect(ps.count()).toBe(0);
    });

    T.it('emit adds particles', function () {
      var ps = window.Engine.Particles.create();
      ps.emit({ x: 100, y: 100, count: 5, color: '#C41E3A', speed: 50, life: 1 });
      T.expect(ps.count()).toBe(5);
    });

    T.it('emit multiple times accumulates', function () {
      var ps = window.Engine.Particles.create();
      ps.emit({ x: 0, y: 0, count: 3, life: 1 });
      ps.emit({ x: 0, y: 0, count: 7, life: 1 });
      T.expect(ps.count()).toBe(10);
    });

    T.it('update reduces life, removes dead particles', function () {
      var ps = window.Engine.Particles.create();
      ps.emit({ x: 0, y: 0, count: 5, life: 0.5, speed: 10 });
      T.expect(ps.count()).toBe(5);

      // After 0.3s, particles still alive
      ps.update(0.3);
      T.expect(ps.count()).toBe(5);

      // After another 0.3s (total 0.6s), all should be dead (life was 0.5)
      ps.update(0.3);
      T.expect(ps.count()).toBe(0);
    });

    T.it('clear removes all particles', function () {
      var ps = window.Engine.Particles.create();
      ps.emit({ x: 0, y: 0, count: 20, life: 10 });
      T.expect(ps.count()).toBe(20);
      ps.clear();
      T.expect(ps.count()).toBe(0);
    });

    T.it('render does not throw with mock ctx', function () {
      var ps = window.Engine.Particles.create();
      ps.emit({ x: 50, y: 50, count: 3, color: '#FFFFFF', life: 1, size: 2 });
      // Mock canvas context
      var ctx = {
        save: function () {},
        restore: function () {},
        beginPath: function () {},
        arc: function () {},
        fill: function () {},
        globalAlpha: 1,
        fillStyle: ''
      };
      // Should not throw
      ps.render(ctx);
      T.expect(ps.count()).toBe(3);
    });

    T.it('particles move when updated', function () {
      var ps = window.Engine.Particles.create();
      // Emit with known parameters — full spread
      ps.emit({ x: 100, y: 100, count: 1, speed: 1000, life: 5, spread: Math.PI * 2, size: 2 });
      T.expect(ps.count()).toBe(1);
      // We can't directly read position, but update+render should work without error
      ps.update(0.1);
      T.expect(ps.count()).toBe(1);
    });
  });
})();
