(function () {
  var T = window.TestFramework;

  T.describe('Engine.Input', function () {

    T.it('should exist on window.Engine', function () {
      T.expect(window.Engine.Input).toBeDefined();
      T.expect(typeof window.Engine.Input.create).toBe('function');
    });

    T.it('create() returns input interface', function () {
      var input = window.Engine.Input.create();
      T.expect(typeof input.isKeyDown).toBe('function');
      T.expect(typeof input.isKeyPressed).toBe('function');
      T.expect(typeof input.update).toBe('function');
      T.expect(typeof input.destroy).toBe('function');
      input.destroy();
    });

    T.it('isKeyDown returns false for keys not pressed', function () {
      var input = window.Engine.Input.create();
      T.expect(input.isKeyDown('ArrowUp')).toBeFalse();
      T.expect(input.isKeyDown('Space')).toBeFalse();
      input.destroy();
    });

    T.it('tracks keydown events', function () {
      var input = window.Engine.Input.create();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      T.expect(input.isKeyDown('ArrowUp')).toBeTrue();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      T.expect(input.isKeyDown('ArrowUp')).toBeFalse();
      input.destroy();
    });

    T.it('isKeyPressed is one-shot per frame', function () {
      var input = window.Engine.Input.create();

      // Press a key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      input.update(); // flush buffer into pressed

      T.expect(input.isKeyPressed('a')).toBeTrue();

      // Next frame — pressed should reset
      input.update();
      T.expect(input.isKeyPressed('a')).toBeFalse();

      // But key is still held down
      T.expect(input.isKeyDown('a')).toBeTrue();

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      input.destroy();
    });

    T.it('destroy removes listeners cleanly', function () {
      var input = window.Engine.Input.create();
      input.destroy();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      T.expect(input.isKeyDown('x')).toBeFalse();
    });

    T.it('multiple keys tracked independently', function () {
      var input = window.Engine.Input.create();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      T.expect(input.isKeyDown('a')).toBeTrue();
      T.expect(input.isKeyDown('b')).toBeTrue();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      T.expect(input.isKeyDown('a')).toBeFalse();
      T.expect(input.isKeyDown('b')).toBeTrue();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
      input.destroy();
    });
  });
})();
