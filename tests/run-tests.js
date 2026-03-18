// Node.js test runner using jsdom
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Read all source files
const engineFiles = [
  'js/engine/game-loop.js',
  'js/engine/input.js',
  'js/engine/collision.js',
  'js/engine/particles.js',
  'js/engine/renderer.js',
  'js/engine/audio.js',
];

const gameFiles = [
  'js/games/breakout.js',
  'js/games/asteroids.js',
  'js/games/tetris.js',
  'js/games/mario.js',
  'js/games/flappy.js',
];

const testFiles = [
  'tests/test-framework.js',
  'tests/engine/game-loop.test.js',
  'tests/engine/input.test.js',
  'tests/engine/collision.test.js',
  'tests/engine/particles.test.js',
  'tests/engine/renderer.test.js',
  'tests/engine/audio.test.js',
  'tests/games/breakout.test.js',
  'tests/games/asteroids.test.js',
  'tests/games/tetris.test.js',
  'tests/games/mario.test.js',
  'tests/games/flappy.test.js',
];

// Build combined script
let script = '';
for (const f of [...engineFiles, ...gameFiles, ...testFiles]) {
  script += fs.readFileSync(path.join(root, f), 'utf-8') + '\n';
}

// Add runner
script += `
  var report = window.TestFramework.run();
  window.__TEST_RESULTS__ = report;
`;

const dom = new JSDOM(`<!DOCTYPE html><html><body><canvas id="c" width="200" height="200"></canvas></body></html>`, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost',
});

// Polyfill AudioContext
dom.window.AudioContext = function () {
  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: {},
    resume: function () {},
    createOscillator: function () {
      return {
        type: '', frequency: { setValueAtTime: function(){}, exponentialRampToValueAtTime: function(){} },
        connect: function(){}, start: function(){}, stop: function(){}
      };
    },
    createGain: function () {
      return {
        gain: { setValueAtTime: function(){}, exponentialRampToValueAtTime: function(){}, value: 1 },
        connect: function(){}
      };
    },
    createBuffer: function(ch, len, sr) {
      var data = new Float32Array(len);
      return { getChannelData: function() { return data; } };
    },
    createBufferSource: function() {
      return { buffer: null, connect: function(){}, start: function(){} };
    }
  };
};
dom.window.webkitAudioContext = dom.window.AudioContext;

// Execute
dom.window.eval(script);

const results = dom.window.__TEST_RESULTS__;

// Display results
console.log('\n=== Classic Games Online — Test Results ===\n');

let currentSuite = '';
for (const r of results.results) {
  if (r.suite !== currentSuite) {
    currentSuite = r.suite;
    console.log(`\n  ${currentSuite}`);
  }
  const icon = r.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`    ${icon} ${r.test}`);
  if (r.error) {
    console.log(`      \x1b[31m${r.error}\x1b[0m`);
  }
}

console.log(`\n  \x1b[${results.failed === 0 ? '32' : '31'}m${results.passed} passed, ${results.failed} failed — ${results.total} total\x1b[0m\n`);

process.exit(results.failed > 0 ? 1 : 0);
