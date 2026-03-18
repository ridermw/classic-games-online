// Minimal test framework
window.TestFramework = {
  suites: [],
  _currentSuite: null,

  describe: function (name, fn) {
    var suite = { name: name, tests: [], passed: 0, failed: 0 };
    this.suites.push(suite);
    this._currentSuite = suite;
    fn();
    this._currentSuite = null;
  },

  it: function (name, fn) {
    if (!this._currentSuite) {
      throw new Error('it() must be called inside describe()');
    }
    this._currentSuite.tests.push({ name: name, fn: fn });
  },

  expect: function (val) {
    function fail(msg) {
      throw new Error(msg);
    }

    return {
      toBe: function (expected) {
        if (val !== expected) fail('Expected ' + JSON.stringify(val) + ' to be ' + JSON.stringify(expected));
      },
      toBeTrue: function () {
        if (val !== true) fail('Expected ' + JSON.stringify(val) + ' to be true');
      },
      toBeFalse: function () {
        if (val !== false) fail('Expected ' + JSON.stringify(val) + ' to be false');
      },
      toBeGreaterThan: function (n) {
        if (!(val > n)) fail('Expected ' + val + ' to be greater than ' + n);
      },
      toBeLessThan: function (n) {
        if (!(val < n)) fail('Expected ' + val + ' to be less than ' + n);
      },
      toEqual: function (expected) {
        var a = JSON.stringify(val);
        var b = JSON.stringify(expected);
        if (a !== b) fail('Expected ' + a + ' to equal ' + b);
      },
      toBeCloseTo: function (expected, precision) {
        var p = precision !== undefined ? precision : 2;
        var diff = Math.abs(val - expected);
        if (diff > Math.pow(10, -p) / 2) {
          fail('Expected ' + val + ' to be close to ' + expected + ' (precision ' + p + ')');
        }
      },
      toBeNull: function () {
        if (val !== null) fail('Expected ' + JSON.stringify(val) + ' to be null');
      },
      toBeDefined: function () {
        if (val === undefined) fail('Expected value to be defined');
      },
      toThrow: function () {
        if (typeof val !== 'function') fail('Expected a function for toThrow');
        var threw = false;
        try { val(); } catch (e) { threw = true; }
        if (!threw) fail('Expected function to throw');
      }
    };
  },

  run: function () {
    var results = [];
    var totalPassed = 0;
    var totalFailed = 0;

    for (var s = 0; s < this.suites.length; s++) {
      var suite = this.suites[s];
      suite.passed = 0;
      suite.failed = 0;

      for (var t = 0; t < suite.tests.length; t++) {
        var test = suite.tests[t];
        var result = { suite: suite.name, test: test.name, passed: false, error: null };
        try {
          test.fn();
          result.passed = true;
          suite.passed++;
          totalPassed++;
        } catch (e) {
          result.error = e.message || String(e);
          suite.failed++;
          totalFailed++;
        }
        results.push(result);
      }
    }

    return {
      passed: totalPassed,
      failed: totalFailed,
      total: totalPassed + totalFailed,
      results: results
    };
  }
};
