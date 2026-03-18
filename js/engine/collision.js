// Collision — pure function collision detection
window.Engine = window.Engine || {};

window.Engine.Collision = {
  rectRect: function (a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  },

  circleCircle: function (a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dist = dx * dx + dy * dy;
    var radSum = a.radius + b.radius;
    return dist <= radSum * radSum;
  },

  circleRect: function (circle, rect) {
    // Find the closest point on the rect to the circle center
    var closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    var closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    var dx = circle.x - closestX;
    var dy = circle.y - closestY;
    return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
  },

  pointInRect: function (px, py, rect) {
    return (
      px >= rect.x &&
      px <= rect.x + rect.width &&
      py >= rect.y &&
      py <= rect.y + rect.height
    );
  }
};
