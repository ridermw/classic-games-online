# 🛡️ Walton Raiders — Classic Games Arcade

[![GitHub Pages](https://img.shields.io/badge/Play%20Now-GitHub%20Pages-C41E3A?style=for-the-badge&logo=github)](https://ridermw.github.io/classic-games-online/)
[![Built by AI](https://img.shields.io/badge/Built%20by-GitHub%20Copilot%20CLI-002D72?style=for-the-badge&logo=githubcopilot)](https://github.com/features/copilot)
[![Tests](https://img.shields.io/badge/Tests-108%2B%20Passing-brightgreen?style=for-the-badge)](#tests)

> **Classic games built entirely by AI** — powered by GitHub Copilot CLI.  
> Themed for **Walton High School, Marietta GA** 🔴⚪🔵

**🎮 [Play Now →](https://ridermw.github.io/classic-games-online/)**

---

## 🕹️ Games

| Game | Description | Controls |
|------|-------------|----------|
| **Raider Space Defense** | Asteroids — pilot the Raiders shield through space, blast asteroids into fragments | Arrow keys to rotate/thrust, Space to shoot |
| **Raider Smash** | Breakout — shatter red/white/blue bricks with the ball | Left/Right arrows or mouse to move paddle |
| **Raider Blocks** | Tetris — stack and clear tetrominoes in school colors | Arrows to move/rotate, Space for hard drop |
| **Flappy Raider** | Flappy Bird — guide the Raider eagle through columns | Space/Up/Click to flap |
| **Raider Run** | Auto-runner — jump obstacles, collect W emblems | Space/Up/Click to jump |

**Press `ESC` at any time to return to the game selector.**

---

## 📸 Screenshots

### Landing Page
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              W A L T O N   R A I D E R S            │
│              CLASSIC GAMES ARCADE                   │
│         // built entirely by ai                     │
│                                                     │
│  ┌─────────────────────┐  ┌──────────┐             │
│  │  RAIDER SPACE       │  │  RAIDER  │             │
│  │  DEFENSE     ▶ Play │  │  SMASH   │             │
│  └─────────────────────┘  └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  RAIDER  │ │  FLAPPY  │ │  RAIDER  │           │
│  │  BLOCKS  │ │  RAIDER  │ │  RUN     │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  ● Built by GitHub Copilot CLI         ♪ Sound Off │
└─────────────────────────────────────────────────────┘
```

### In-Game
```
┌─────────────────────────────────────────────────────┐
│         SCORE 2450  ·  RAIDER SPACE DEFENSE         │
│  ✦  ·       ·    ✦           ·        ✦            │
│       · ◇          ✦    ◇                           │
│   ◇          ▲                    ◇      ·          │
│             ╱█╲    ·        ◇                       │
│      ◇       █          ·              ◇            │
│        ·          ◇           ·                     │
│                ESC — BACK TO GAMES                   │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
classic-games-online/
├── index.html              # Single-page app — landing + game viewport
├── css/
│   ├── variables.css       # Design tokens (Raiders palette, typography)
│   ├── main.css            # Global styles, mesh gradient bg, animations
│   ├── landing.css         # Bento grid, cards, glassmorphism, transitions
│   └── game-ui.css         # In-game HUD and overlays
├── js/
│   ├── engine/             # Shared game engine (6 modules)
│   │   ├── game-loop.js    # rAF loop with delta time
│   │   ├── input.js        # Keyboard + touch input
│   │   ├── collision.js    # AABB, circle, point collision
│   │   ├── particles.js    # Particle system (explosions, trails)
│   │   ├── renderer.js     # Vignette, grain, screen shake
│   │   └── audio.js        # Web Audio synthesizer (7 sounds)
│   ├── games/              # 5 game modules
│   │   ├── asteroids.js    # Raider Space Defense
│   │   ├── breakout.js     # Raider Smash
│   │   ├── tetris.js       # Raider Blocks
│   │   ├── flappy.js       # Flappy Raider
│   │   └── mario.js        # Raider Run
│   └── app.js              # Router, thumbnails, game launcher
└── tests/                  # TDD test suite
    ├── test-framework.js   # Custom assertion library
    ├── test-runner.html    # Browser test runner
    ├── run-tests.js        # Headless Node runner
    ├── engine/             # Engine tests (57 tests)
    └── games/              # Game tests (50+ tests)
```

## 🎨 Design

- **Palette:** Raiders red (#C41E3A), navy (#002D72), white — on deep dark (#0B1120)
- **Typography:** Bebas Neue (display), DM Sans (body), Fira Code (scores)
- **Effects:** Animated mesh gradients, glassmorphism cards, CRT vignette, film grain, screen shake, particle systems
- **Approach:** 2026 premium sports-luxury aesthetic — not retro pixel nostalgia

## 🧪 Tests

All games and engine modules are built with **test-driven development**.

```bash
# Run tests headlessly
node tests/run-tests.js

# Or open in browser
open tests/test-runner.html
```

**108+ tests** covering game state, physics, collisions, scoring, edge cases.

## 🚀 Tech Stack

- **Zero dependencies** — pure HTML, CSS, JavaScript
- **No build step** — static files, instant deploy
- **Web Audio API** — procedurally synthesized 8-bit sounds
- **HTML5 Canvas** — all 5 games render to canvas
- **GitHub Pages** — deployed automatically on push

## 🤖 Built by AI

This entire project — every line of code, every test, every design decision — was built by **GitHub Copilot CLI** in a single session as a demonstration of AI-assisted development.

---

## 📋 Changelog

| Commit | Description |
|--------|-------------|
| `ef1c048` | Shared game engine + test framework (57 tests) |
| `8604381` | Raider Blocks (Tetris) — 25 tests |
| `ec512e4` | Raider Space Defense (Asteroids) — 11 tests |
| `229e118` | Raider Smash (Breakout) — 12 tests |
| `c84f2f4` | Cinematic landing page with animated thumbnails |

---

<p align="center">
  <strong>Walton High School · Marietta, Georgia</strong><br>
  <em>Go Raiders! 🔴⚪🔵</em>
</p>
