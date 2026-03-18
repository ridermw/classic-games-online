// Input — keyboard + touch input tracking with one-shot press detection
window.Engine = window.Engine || {};

window.Engine.Input = {
  create: function () {
    var keysDown = {};    // currently held
    var keysPressed = {}; // just pressed this frame (one-shot)
    var keysBuffer = {};  // buffer for presses between update() calls

    function onKeyDown(e) {
      if (!keysDown[e.key]) {
        keysBuffer[e.key] = true;
      }
      keysDown[e.key] = true;
    }

    function onKeyUp(e) {
      keysDown[e.key] = false;
    }

    function onTouchStart(e) {
      if (!keysDown['Space']) {
        keysBuffer['Space'] = true;
      }
      keysDown['Space'] = true;
    }

    function onTouchEnd(e) {
      keysDown['Space'] = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);

    return {
      isKeyDown: function (key) {
        return !!keysDown[key];
      },
      isKeyPressed: function (key) {
        return !!keysPressed[key];
      },
      update: function () {
        // Move buffer into pressed, then clear buffer
        keysPressed = keysBuffer;
        keysBuffer = {};
      },
      destroy: function () {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchend', onTouchEnd);
        keysDown = {};
        keysPressed = {};
        keysBuffer = {};
      }
    };
  }
};
