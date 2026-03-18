// Raider Blocks — Tetris for Walton Raiders Classic Games
window.Games = window.Games || {};

window.Games.Tetris = (function () {
  'use strict';

  // --- Constants ---
  var CANVAS_W = 800;
  var CANVAS_H = 600;
  var COLS = 10;
  var ROWS = 20;
  var CELL = Math.floor((CANVAS_H - 40) / ROWS); // ~28
  var GRID_W = COLS * CELL;
  var GRID_H = ROWS * CELL;
  var GRID_X = Math.floor((CANVAS_W - GRID_W) / 2) - 80;
  var GRID_Y = Math.floor((CANVAS_H - GRID_H) / 2);
  var PANEL_X = GRID_X + GRID_W + 30;

  var DROP_INTERVAL = 0.5; // seconds per gravity tick
  var SOFT_DROP_INTERVAL = 0.05;
  var LOCK_DELAY = 0.3;

  var BG_COLOR = '#0B1120';
  var GRID_LINE_COLOR = 'rgba(255,255,255,0.04)';
  var GRID_BORDER_COLOR = 'rgba(255,255,255,0.12)';

  // --- Piece definitions (each rotation state) ---
  var PIECES = {
    I: { color: '#C41E3A', shapes: [
      [[0,0],[1,0],[2,0],[3,0]],
      [[0,0],[0,1],[0,2],[0,3]],
      [[0,0],[1,0],[2,0],[3,0]],
      [[0,0],[0,1],[0,2],[0,3]]
    ]},
    O: { color: '#FFFFFF', shapes: [
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]]
    ]},
    T: { color: '#002D72', shapes: [
      [[0,0],[1,0],[2,0],[1,1]],
      [[0,0],[0,1],[0,2],[1,1]],
      [[0,1],[1,0],[1,1],[2,1]],
      [[1,0],[1,1],[1,2],[0,1]]
    ]},
    S: { color: '#E8294A', shapes: [
      [[1,0],[2,0],[0,1],[1,1]],
      [[0,0],[0,1],[1,1],[1,2]],
      [[1,0],[2,0],[0,1],[1,1]],
      [[0,0],[0,1],[1,1],[1,2]]
    ]},
    Z: { color: '#1A56DB', shapes: [
      [[0,0],[1,0],[1,1],[2,1]],
      [[1,0],[0,1],[1,1],[0,2]],
      [[0,0],[1,0],[1,1],[2,1]],
      [[1,0],[0,1],[1,1],[0,2]]
    ]},
    J: { color: '#1A56DB', shapes: [
      [[0,0],[0,1],[1,1],[2,1]],
      [[0,0],[1,0],[0,1],[0,2]],
      [[0,0],[1,0],[2,0],[2,1]],
      [[1,0],[1,1],[0,2],[1,2]]
    ]},
    L: { color: '#C41E3A', shapes: [
      [[2,0],[0,1],[1,1],[2,1]],
      [[0,0],[0,1],[0,2],[1,2]],
      [[0,0],[1,0],[2,0],[0,1]],
      [[0,0],[1,0],[1,1],[1,2]]
    ]}
  };

  var PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // --- Bag randomizer ---
  function createBag() {
    var bag = PIECE_NAMES.slice();
    for (var i = bag.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
    return bag;
  }

  // --- State ---
  var grid, score, gameOver, currentPiece, nextPiece;
  var bag, dropTimer, lockTimer, locking;
  var clearAnimRows, clearAnimTimer, clearing;
  var gameLoop, input, particles, audio;
  var canvas, ctx;

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) {
      g[r] = [];
      for (var c = 0; c < COLS; c++) {
        g[r][c] = null;
      }
    }
    return g;
  }

  function nextFromBag() {
    if (!bag || bag.length === 0) {
      bag = createBag();
    }
    return bag.pop();
  }

  function spawnPiece(type) {
    var def = PIECES[type];
    var shape = def.shapes[0];
    // Center horizontally
    var minC = shape.reduce(function (m, p) { return Math.min(m, p[0]); }, Infinity);
    var maxC = shape.reduce(function (m, p) { return Math.max(m, p[0]); }, -Infinity);
    var w = maxC - minC + 1;
    var offsetX = Math.floor((COLS - w) / 2) - minC;
    return {
      type: type,
      color: def.color,
      rotation: 0,
      x: offsetX,
      y: 0,
      shape: shape
    };
  }

  function getShape(piece) {
    return PIECES[piece.type].shapes[piece.rotation];
  }

  function getCells(piece) {
    var shape = getShape(piece);
    var cells = [];
    for (var i = 0; i < shape.length; i++) {
      cells.push([piece.x + shape[i][0], piece.y + shape[i][1]]);
    }
    return cells;
  }

  function isValid(piece) {
    var cells = getCells(piece);
    for (var i = 0; i < cells.length; i++) {
      var cx = cells[i][0];
      var cy = cells[i][1];
      if (cx < 0 || cx >= COLS || cy >= ROWS) return false;
      if (cy >= 0 && grid[cy][cx] !== null) return false;
    }
    return true;
  }

  function tryMove(dx, dy) {
    var test = { type: currentPiece.type, color: currentPiece.color, rotation: currentPiece.rotation, x: currentPiece.x + dx, y: currentPiece.y + dy, shape: currentPiece.shape };
    if (isValid(test)) {
      currentPiece.x = test.x;
      currentPiece.y = test.y;
      return true;
    }
    return false;
  }

  function tryRotate() {
    var newRot = (currentPiece.rotation + 1) % 4;
    var test = { type: currentPiece.type, color: currentPiece.color, rotation: newRot, x: currentPiece.x, y: currentPiece.y, shape: currentPiece.shape };
    if (isValid(test)) {
      currentPiece.rotation = newRot;
      return true;
    }
    return false;
  }

  function lockPiece() {
    var cells = getCells(currentPiece);
    for (var i = 0; i < cells.length; i++) {
      var cx = cells[i][0];
      var cy = cells[i][1];
      if (cy >= 0 && cy < ROWS) {
        grid[cy][cx] = currentPiece.color;
      }
    }
    if (audio) audio.play('hit');
  }

  function getGhostY() {
    var gy = currentPiece.y;
    var test = { type: currentPiece.type, color: currentPiece.color, rotation: currentPiece.rotation, x: currentPiece.x, y: gy, shape: currentPiece.shape };
    while (true) {
      test.y = gy + 1;
      if (!isValid(test)) break;
      gy++;
    }
    return gy;
  }

  function hardDrop() {
    currentPiece.y = getGhostY();
    lockPiece();
    checkLines();
  }

  function checkLines() {
    var fullRows = [];
    for (var r = 0; r < ROWS; r++) {
      var full = true;
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === null) { full = false; break; }
      }
      if (full) fullRows.push(r);
    }
    if (fullRows.length > 0) {
      clearAnimRows = fullRows;
      clearAnimTimer = 0;
      clearing = true;
      if (audio) audio.play('clear');
      // Emit particles along each cleared row
      if (particles) {
        for (var i = 0; i < fullRows.length; i++) {
          var row = fullRows[i];
          for (var c = 0; c < COLS; c += 2) {
            particles.emit({
              x: GRID_X + c * CELL + CELL / 2,
              y: GRID_Y + row * CELL + CELL / 2,
              count: 4,
              color: '#FFFFFF',
              speed: 80,
              life: 0.6,
              spread: Math.PI * 2,
              size: 2
            });
          }
        }
      }
    } else {
      spawnNext();
    }
  }

  function clearFullRows() {
    var lines = clearAnimRows.length;
    // Remove rows top to bottom
    for (var i = clearAnimRows.length - 1; i >= 0; i--) {
      grid.splice(clearAnimRows[i], 1);
    }
    // Add empty rows at top
    for (var j = 0; j < lines; j++) {
      var row = [];
      for (var c = 0; c < COLS; c++) row.push(null);
      grid.unshift(row);
    }
    // Score
    if (lines === 4) {
      score += 400;
    } else {
      score += lines * 100;
    }
    updateHud();
  }

  function spawnNext() {
    currentPiece = spawnPiece(nextPiece || nextFromBag());
    nextPiece = nextFromBag();
    dropTimer = 0;
    locking = false;
    lockTimer = 0;
    if (!isValid(currentPiece)) {
      gameOver = true;
      if (audio) audio.play('die');
      // Brief pause then auto-reset
      setTimeout(function () {
        resetState();
      }, 1000);
    }
  }

  function updateHud() {
    var el = document.getElementById('hudScore');
    if (el) el.textContent = score;
  }

  function resetState() {
    grid = emptyGrid();
    score = 0;
    gameOver = false;
    bag = createBag();
    dropTimer = 0;
    lockTimer = 0;
    locking = false;
    clearing = false;
    clearAnimRows = [];
    clearAnimTimer = 0;
    nextPiece = nextFromBag();
    currentPiece = spawnPiece(nextFromBag());
    if (particles) particles.clear();
    updateHud();
  }

  // --- Update ---
  function update(dt) {
    if (gameOver) return;
    if (input) input.update();

    // Line clear animation
    if (clearing) {
      clearAnimTimer += dt;
      if (clearAnimTimer >= 0.3) {
        clearing = false;
        clearFullRows();
        spawnNext();
      }
      if (particles) particles.update(dt);
      return;
    }

    // Input
    if (input) {
      if (input.isKeyPressed('ArrowLeft')) tryMove(-1, 0);
      if (input.isKeyPressed('ArrowRight')) tryMove(1, 0);
      if (input.isKeyPressed('ArrowUp')) tryRotate();
      if (input.isKeyPressed('Space')) {
        hardDrop();
        return;
      }
    }

    // Gravity
    var interval = (input && input.isKeyDown('ArrowDown')) ? SOFT_DROP_INTERVAL : DROP_INTERVAL;
    dropTimer += dt;
    if (dropTimer >= interval) {
      dropTimer -= interval;
      if (!tryMove(0, 1)) {
        // Can't move down — start lock
        if (!locking) {
          locking = true;
          lockTimer = 0;
        }
      } else {
        locking = false;
        lockTimer = 0;
      }
    }

    // Lock delay
    if (locking) {
      lockTimer += dt;
      if (lockTimer >= LOCK_DELAY) {
        lockPiece();
        locking = false;
        checkLines();
      }
    }

    if (particles) particles.update(dt);
  }

  // --- Render ---
  function render(renderCtx) {
    var c = renderCtx || ctx;
    if (!c) return;

    Engine.Renderer.clear(c, CANVAS_W, CANVAS_H, BG_COLOR);

    // Grid background
    c.fillStyle = BG_COLOR;
    c.fillRect(GRID_X, GRID_Y, GRID_W, GRID_H);

    // Grid lines
    c.strokeStyle = GRID_LINE_COLOR;
    c.lineWidth = 1;
    for (var col = 0; col <= COLS; col++) {
      var x = GRID_X + col * CELL;
      c.beginPath();
      c.moveTo(x, GRID_Y);
      c.lineTo(x, GRID_Y + GRID_H);
      c.stroke();
    }
    for (var row = 0; row <= ROWS; row++) {
      var y = GRID_Y + row * CELL;
      c.beginPath();
      c.moveTo(GRID_X, y);
      c.lineTo(GRID_X + GRID_W, y);
      c.stroke();
    }

    // Grid border
    c.strokeStyle = GRID_BORDER_COLOR;
    c.lineWidth = 2;
    c.strokeRect(GRID_X, GRID_Y, GRID_W, GRID_H);

    // Placed blocks
    for (var r = 0; r < ROWS; r++) {
      for (var cc = 0; cc < COLS; cc++) {
        if (grid[r][cc] !== null) {
          drawCell(c, GRID_X + cc * CELL, GRID_Y + r * CELL, grid[r][cc], 1);
        }
      }
    }

    if (!gameOver && currentPiece) {
      // Ghost piece
      var ghostY = getGhostY();
      var ghostCells = getShape(currentPiece);
      c.globalAlpha = 0.1;
      for (var i = 0; i < ghostCells.length; i++) {
        drawCell(c,
          GRID_X + (currentPiece.x + ghostCells[i][0]) * CELL,
          GRID_Y + (ghostY + ghostCells[i][1]) * CELL,
          currentPiece.color, 1);
      }
      c.globalAlpha = 1;

      // Current piece
      var cells = getCells(currentPiece);
      for (var j = 0; j < cells.length; j++) {
        if (cells[j][1] >= 0) {
          drawCell(c, GRID_X + cells[j][0] * CELL, GRID_Y + cells[j][1] * CELL, currentPiece.color, 1);
        }
      }
    }

    // Line clear flash
    if (clearing && clearAnimRows) {
      var flashAlpha = 1 - (clearAnimTimer / 0.3);
      c.fillStyle = 'rgba(255,255,255,' + (flashAlpha * 0.7) + ')';
      for (var fi = 0; fi < clearAnimRows.length; fi++) {
        // Sweep effect: fill proportional to timer
        var sweepW = Math.min(1, clearAnimTimer / 0.15) * GRID_W;
        c.fillRect(GRID_X, GRID_Y + clearAnimRows[fi] * CELL, sweepW, CELL);
      }
    }

    // Right panel
    drawPanel(c);

    // Particles on top
    if (particles) particles.render(c);

    Engine.Renderer.drawVignette(c, CANVAS_W, CANVAS_H);
    Engine.Renderer.drawGrain(c, CANVAS_W, CANVAS_H, 0.03);
  }

  function drawCell(c, x, y, color, alpha) {
    var inset = 1;
    c.fillStyle = color;
    c.fillRect(x + inset, y + inset, CELL - inset * 2, CELL - inset * 2);

    // Bevel: lighter top-left
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(x + inset, y + inset, CELL - inset * 2, 2);
    c.fillRect(x + inset, y + inset, 2, CELL - inset * 2);

    // Bevel: darker bottom-right
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(x + inset, y + CELL - inset - 2, CELL - inset * 2, 2);
    c.fillRect(x + CELL - inset - 2, y + inset, 2, CELL - inset * 2);
  }

  function drawPanel(c) {
    // Score
    c.fillStyle = '#FFFFFF';
    c.font = '14px "Fira Code", monospace';
    c.textAlign = 'left';
    c.fillText('SCORE', PANEL_X, GRID_Y + 20);
    c.font = 'bold 28px "Fira Code", monospace';
    c.fillText(String(score), PANEL_X, GRID_Y + 52);

    // Next piece label
    c.font = '14px "Fira Code", monospace';
    c.fillText('NEXT', PANEL_X, GRID_Y + 100);

    // Next piece preview
    if (nextPiece) {
      var def = PIECES[nextPiece];
      var shape = def.shapes[0];
      var previewCell = 20;
      // Center the preview
      var minX = shape.reduce(function (m, p) { return Math.min(m, p[0]); }, Infinity);
      var maxX = shape.reduce(function (m, p) { return Math.max(m, p[0]); }, -Infinity);
      var minY = shape.reduce(function (m, p) { return Math.min(m, p[1]); }, Infinity);
      var maxY = shape.reduce(function (m, p) { return Math.max(m, p[1]); }, -Infinity);
      var pw = (maxX - minX + 1) * previewCell;
      var ph = (maxY - minY + 1) * previewCell;
      var px = PANEL_X + (100 - pw) / 2;
      var py = GRID_Y + 115 + (80 - ph) / 2;

      for (var i = 0; i < shape.length; i++) {
        drawCell(c,
          px + (shape[i][0] - minX) * previewCell,
          py + (shape[i][1] - minY) * previewCell,
          def.color, 1);
      }
    }
  }

  // --- Public API ---
  return {
    // Expose internals for testing
    _PIECES: PIECES,
    _PIECE_NAMES: PIECE_NAMES,
    _COLS: COLS,
    _ROWS: ROWS,
    _createBag: createBag,
    _emptyGrid: emptyGrid,
    _spawnPiece: spawnPiece,
    _isValid: function (piece, g) {
      var origGrid = grid;
      if (g) grid = g;
      var result = isValid(piece);
      grid = origGrid;
      return result;
    },
    _getCells: getCells,
    _getShape: getShape,
    _tryMove: tryMove,
    _tryRotate: tryRotate,
    _lockPiece: lockPiece,
    _hardDrop: hardDrop,
    _checkLines: checkLines,
    _clearFullRows: clearFullRows,
    _getGhostY: getGhostY,
    _setGrid: function (g) { grid = g; },
    _setCurrentPiece: function (p) { currentPiece = p; },
    _setNextPiece: function (p) { nextPiece = p; },
    _setScore: function (s) { score = s; },
    _setGameOver: function (v) { gameOver = v; },
    _setClearing: function (v) { clearing = v; },
    _spawnNext: spawnNext,

    init: function (canvasEl, ctxArg) {
      canvas = canvasEl;
      ctx = ctxArg;
      if (canvas) {
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
      }
      input = Engine.Input.create();
      particles = Engine.Particles.create();
      audio = Engine.Audio.create();
      resetState();
      gameLoop = Engine.GameLoop.create(update, render);
      gameLoop.start();
    },

    update: update,
    render: render,

    handleInput: function (event) {
      // Input is handled through Engine.Input polling in update()
    },

    reset: function () {
      resetState();
    },

    getState: function () {
      return {
        grid: grid,
        currentPiece: currentPiece,
        nextPiece: nextPiece,
        score: score,
        gameOver: gameOver
      };
    },

    destroy: function () {
      if (gameLoop) gameLoop.stop();
      if (input) input.destroy();
      if (particles) particles.clear();
      gameLoop = null;
      input = null;
      particles = null;
      audio = null;
    }
  };
})();
