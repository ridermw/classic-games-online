(function () {
  var T = window.TestFramework;
  var C = window.Engine.Collision;

  T.describe('Engine.Collision', function () {

    // --- rectRect ---
    T.it('rectRect: overlapping rectangles', function () {
      T.expect(C.rectRect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 10, height: 10 }
      )).toBeTrue();
    });

    T.it('rectRect: separated rectangles', function () {
      T.expect(C.rectRect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 20, width: 10, height: 10 }
      )).toBeFalse();
    });

    T.it('rectRect: touching edges (not overlapping)', function () {
      T.expect(C.rectRect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 }
      )).toBeFalse();
    });

    T.it('rectRect: contained rectangle', function () {
      T.expect(C.rectRect(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 10, y: 10, width: 5, height: 5 }
      )).toBeTrue();
    });

    T.it('rectRect: zero-size rectangle at interior point collides', function () {
      T.expect(C.rectRect(
        { x: 5, y: 5, width: 0, height: 0 },
        { x: 0, y: 0, width: 10, height: 10 }
      )).toBeTrue();
    });

    T.it('rectRect: zero-size rectangle outside does not collide', function () {
      T.expect(C.rectRect(
        { x: 50, y: 50, width: 0, height: 0 },
        { x: 0, y: 0, width: 10, height: 10 }
      )).toBeFalse();
    });

    // --- circleCircle ---
    T.it('circleCircle: overlapping circles', function () {
      T.expect(C.circleCircle(
        { x: 0, y: 0, radius: 10 },
        { x: 5, y: 0, radius: 10 }
      )).toBeTrue();
    });

    T.it('circleCircle: separated circles', function () {
      T.expect(C.circleCircle(
        { x: 0, y: 0, radius: 5 },
        { x: 20, y: 0, radius: 5 }
      )).toBeFalse();
    });

    T.it('circleCircle: touching circles (edge case)', function () {
      T.expect(C.circleCircle(
        { x: 0, y: 0, radius: 5 },
        { x: 10, y: 0, radius: 5 }
      )).toBeTrue();
    });

    T.it('circleCircle: same position', function () {
      T.expect(C.circleCircle(
        { x: 5, y: 5, radius: 3 },
        { x: 5, y: 5, radius: 3 }
      )).toBeTrue();
    });

    T.it('circleCircle: zero-radius', function () {
      T.expect(C.circleCircle(
        { x: 0, y: 0, radius: 0 },
        { x: 0, y: 0, radius: 0 }
      )).toBeTrue();
    });

    // --- circleRect ---
    T.it('circleRect: circle inside rect', function () {
      T.expect(C.circleRect(
        { x: 50, y: 50, radius: 5 },
        { x: 0, y: 0, width: 100, height: 100 }
      )).toBeTrue();
    });

    T.it('circleRect: circle outside rect', function () {
      T.expect(C.circleRect(
        { x: 200, y: 200, radius: 5 },
        { x: 0, y: 0, width: 100, height: 100 }
      )).toBeFalse();
    });

    T.it('circleRect: circle touching rect edge', function () {
      T.expect(C.circleRect(
        { x: 105, y: 50, radius: 5 },
        { x: 0, y: 0, width: 100, height: 100 }
      )).toBeTrue();
    });

    T.it('circleRect: circle overlapping corner', function () {
      T.expect(C.circleRect(
        { x: 102, y: 102, radius: 5 },
        { x: 0, y: 0, width: 100, height: 100 }
      )).toBeTrue();
    });

    // --- pointInRect ---
    T.it('pointInRect: inside', function () {
      T.expect(C.pointInRect(5, 5, { x: 0, y: 0, width: 10, height: 10 })).toBeTrue();
    });

    T.it('pointInRect: outside', function () {
      T.expect(C.pointInRect(15, 15, { x: 0, y: 0, width: 10, height: 10 })).toBeFalse();
    });

    T.it('pointInRect: on edge (inclusive)', function () {
      T.expect(C.pointInRect(0, 0, { x: 0, y: 0, width: 10, height: 10 })).toBeTrue();
      T.expect(C.pointInRect(10, 10, { x: 0, y: 0, width: 10, height: 10 })).toBeTrue();
    });

    T.it('pointInRect: just outside', function () {
      T.expect(C.pointInRect(-0.01, 5, { x: 0, y: 0, width: 10, height: 10 })).toBeFalse();
    });
  });
})();
