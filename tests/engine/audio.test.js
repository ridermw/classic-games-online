(function () {
  var T = window.TestFramework;

  T.describe('Engine.Audio', function () {

    T.it('should exist on window.Engine', function () {
      T.expect(window.Engine.Audio).toBeDefined();
      T.expect(typeof window.Engine.Audio.create).toBe('function');
    });

    T.it('create() returns audio interface', function () {
      var audio = window.Engine.Audio.create();
      T.expect(typeof audio.play).toBe('function');
      T.expect(typeof audio.setEnabled).toBe('function');
      T.expect(typeof audio.isEnabled).toBe('function');
    });

    T.it('is muted by default', function () {
      var audio = window.Engine.Audio.create();
      T.expect(audio.isEnabled()).toBeFalse();
    });

    T.it('setEnabled toggles state', function () {
      var audio = window.Engine.Audio.create();
      audio.setEnabled(true);
      T.expect(audio.isEnabled()).toBeTrue();
      audio.setEnabled(false);
      T.expect(audio.isEnabled()).toBeFalse();
    });

    T.it('play does not throw when disabled', function () {
      var audio = window.Engine.Audio.create();
      // All sound names should be safe to call when disabled
      audio.play('shoot');
      audio.play('explode');
      audio.play('score');
      audio.play('die');
      audio.play('jump');
      audio.play('hit');
      audio.play('clear');
      T.expect(audio.isEnabled()).toBeFalse();
    });

    T.it('play does not throw for unknown sound', function () {
      var audio = window.Engine.Audio.create();
      audio.play('nonexistent');
      T.expect(true).toBeTrue();
    });

    T.it('setEnabled coerces to boolean', function () {
      var audio = window.Engine.Audio.create();
      audio.setEnabled(1);
      T.expect(audio.isEnabled()).toBeTrue();
      audio.setEnabled(0);
      T.expect(audio.isEnabled()).toBeFalse();
      audio.setEnabled('yes');
      T.expect(audio.isEnabled()).toBeTrue();
      audio.setEnabled('');
      T.expect(audio.isEnabled()).toBeFalse();
    });
  });
})();
