# Fable Proto — 3D RPG Skeleton

A lightweight Fable-inspired RPG prototype built with Three.js r168 + vanilla JS ES modules.

## Stack

- **Three.js 0.168** via importmap (CDN, no bundler)
- **Vanilla JS** ES modules
- **HTML/CSS** HUD overlay

## Features

- Third-person camera with gentle orbit
- Hero with idle bob animation
- Karma system (−100 → +100)
  - Karma > 50: golden angel glow (avatar + hero emissive)
  - Karma < −50: red demon glow
- HP bar with colour-coded health
- Good/Evil action buttons
- Procedural environment (trees, rocks, fog)
- PCFSoftShadowMap + ACESFilmicToneMapping

## Run

```bash
cd fable-proto
python3 -m http.server 8000
```

Open: http://localhost:8000
