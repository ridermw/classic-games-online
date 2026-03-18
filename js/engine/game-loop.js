// Game Loop — requestAnimationFrame-based with delta time capping
window.Engine = window.Engine || {};

window.Engine.GameLoop = {
  create: function (updateFn, renderFn) {
    var running = false;
    var rafId = null;
    var lastTime = 0;
    var MAX_DT = 0.05; // cap to prevent spiral of death

    function tick(timestamp) {
      if (!running) return;

      var dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (dt > MAX_DT) dt = MAX_DT;

      updateFn(dt);
      renderFn();

      rafId = requestAnimationFrame(tick);
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      },
      stop: function () {
        running = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      isRunning: function () {
        return running;
      }
    };
  }
};
