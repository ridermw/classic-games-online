(function () {
  var T = window.TestFramework;
  var R = window.Engine.Renderer;

  T.describe('Engine.Renderer', function () {

    T.it('should exist on window.Engine', function () {
      T.expect(window.Engine.Renderer).toBeDefined();
      T.expect(typeof R.clear).toBe('function');
      T.expect(typeof R.drawVignette).toBe('function');
      T.expect(typeof R.drawGrain).toBe('function');
      T.expect(typeof R.screenShake).toBe('function');
    });

    T.it('clear fills canvas with color', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      var ctx = canvas.getContext('2d');
      R.clear(ctx, 100, 100, '#0B1120');
      // Verify pixel is not transparent
      var pixel = ctx.getImageData(50, 50, 1, 1).data;
      // #0B1120 => R=11, G=17, B=32
      T.expect(pixel[0]).toBe(11);
      T.expect(pixel[1]).toBe(17);
      T.expect(pixel[2]).toBe(32);
      T.expect(pixel[3]).toBe(255);
    });

    T.it('clear uses default color when none provided', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      var ctx = canvas.getContext('2d');
      R.clear(ctx, 50, 50);
      var pixel = ctx.getImageData(25, 25, 1, 1).data;
      T.expect(pixel[3]).toBe(255); // fully opaque
    });

    T.it('drawVignette does not throw', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      var ctx = canvas.getContext('2d');
      R.drawVignette(ctx, 100, 100);
      T.expect(true).toBeTrue();
    });

    T.it('drawGrain does not throw', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      var ctx = canvas.getContext('2d');
      R.clear(ctx, 50, 50, '#000000');
      R.drawGrain(ctx, 50, 50, 0.5);
      T.expect(true).toBeTrue();
    });

    T.it('drawGrain with zero intensity is a no-op', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      var ctx = canvas.getContext('2d');
      R.clear(ctx, 10, 10, '#FF0000');
      var before = ctx.getImageData(5, 5, 1, 1).data[0];
      R.drawGrain(ctx, 10, 10, 0);
      var after = ctx.getImageData(5, 5, 1, 1).data[0];
      T.expect(before).toBe(after);
    });

    T.it('screenShake does not throw on canvas element', function () {
      var canvas = document.createElement('canvas');
      R.screenShake(canvas, 5, 0.2);
      T.expect(true).toBeTrue();
    });

    T.it('screenShake handles null canvas gracefully', function () {
      R.screenShake(null, 5, 0.2);
      T.expect(true).toBeTrue();
    });
  });
})();
