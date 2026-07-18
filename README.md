# Fable Proto

A browser-based real-time strategy prototype built from scratch with **Three.js** and vanilla JavaScript — no framework, no bundler, no build step.

**[▶ Live demo](https://marr59.github.io/fable-proto/)** · feudal-Asia night scene · commandable units · RTS camera

<!-- Add a screenshot or GIF here, e.g. ![screenshot](docs/screenshot.png) -->

## Overview

Fable Proto is a small sandbox RTS: command a squad of units across a night-time feudal-Asia scene, select and move them in groups, and train them into different classes at guild buildings. It was built as a hands-on exploration of real-time 3D and game systems in the browser.

## Features

- **Unit selection** — click a unit, drag a selection box for many, or press `A` to select all
- **Group commands** — send the whole selection to a point; units spread into a formation
- **Training / retraining** — walk units to a guild to change class (reflected by unit color)
- **RTS camera** — edge-scroll to pan the map when nothing is selected; follow-cam when units are selected
- **Skeletal animation** — per-unit rigged characters with idle/walk crossfade (cloned skinned glTF)
- **Karma system** — a −100…+100 axis that shifts the scene's particles, glow and bloom
- **Real-time rendering** — soft shadows, dynamic point lights, ACES tone mapping, Unreal bloom post-processing

## Tech

- **Three.js r168** loaded via native ES-module import maps from CDN — no bundler or install step
- **Vanilla JavaScript** for all game logic; HTML/CSS overlay for the HUD
- **glTF** character models with `SkeletonUtils` for per-unit skinned-mesh cloning and independent animation

## Run locally

```bash
cd fable-proto
python3 -m http.server 8000
# open http://localhost:8000
```

## Status

Prototype / work in progress. Character models are placeholder rigged assets — the focus here is the real-time systems (selection, group commands, camera, animation, scene rendering), not final art.
