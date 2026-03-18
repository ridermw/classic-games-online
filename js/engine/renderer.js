// Renderer — shared rendering utilities
window.Engine = window.Engine || {};

window.Engine.Renderer = {
  clear: function (ctx, w, h, color) {
    ctx.fillStyle = color || '#0B1120';
    ctx.fillRect(0, 0, w, h);
  },

  drawVignette: function (ctx, w, h) {
    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.max(w, h) * 0.7;
    var gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  },

  drawGrain: function (ctx, w, h, intensity) {
    if (!intensity) return;
    var imageData = ctx.getImageData(0, 0, w, h);
    var data = imageData.data;
    var scale = intensity * 25;
    for (var i = 0; i < data.length; i += 4) {
      var noise = (Math.random() - 0.5) * scale;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);
  },

  screenShake: function (canvas, intensity, duration) {
    if (!canvas || !canvas.style) return;
    var start = performance.now();
    var origTransform = canvas.style.transform || '';

    function shake(now) {
      var elapsed = (now - start) / 1000;
      if (elapsed >= duration) {
        canvas.style.transform = origTransform;
        return;
      }
      var decay = 1 - elapsed / duration;
      var dx = (Math.random() - 0.5) * 2 * intensity * decay;
      var dy = (Math.random() - 0.5) * 2 * intensity * decay;
      canvas.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(shake);
    }

    requestAnimationFrame(shake);
  }
};
