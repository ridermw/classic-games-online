// Particles — lightweight particle system for effects
window.Engine = window.Engine || {};

window.Engine.Particles = {
  create: function () {
    var particles = [];

    return {
      emit: function (config) {
        var x = config.x || 0;
        var y = config.y || 0;
        var count = config.count || 10;
        var color = config.color || '#FFFFFF';
        var speed = config.speed || 100;
        var life = config.life || 1;
        var spread = config.spread !== undefined ? config.spread : Math.PI * 2;
        var size = config.size || 3;
        var baseAngle = config.angle !== undefined ? config.angle : 0;

        for (var i = 0; i < count; i++) {
          var angle = baseAngle - spread / 2 + Math.random() * spread;
          var spd = speed * (0.5 + Math.random() * 0.5);
          particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: life,
            maxLife: life,
            color: color,
            size: size
          });
        }
      },

      update: function (dt) {
        for (var i = particles.length - 1; i >= 0; i--) {
          var p = particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            particles.splice(i, 1);
          }
        }
      },

      render: function (ctx) {
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          var alpha = Math.max(0, p.life / p.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      },

      clear: function () {
        particles.length = 0;
      },

      // Expose count for testing
      count: function () {
        return particles.length;
      }
    };
  }
};
