# Ember Court

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/khaliefk/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/khaliefk/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.18-green)](https://nodejs.org)

A turn-based elemental card duel for the [make.fun](https://make.fun/c/best-card-game-20261122-1826)
"Make the best card game" bounty. You face the Ash Warden across a table, both at 30 life,
playing cards from a 24-card deck of four elements — Ember, Tide, Leaf and Stone.

## How it plays

- **Embers pay for cards** — you gain one more max ember each turn (up to 8) and refill
  every turn. A card costs 1–4 embers; spend them or lose them.
- **Four elements, four jobs** — strikes deal damage, mends restore life, insights draw
  cards, and wards raise a shield that absorbs damage before your life does.
- **A Warden who fights back** — the Ash Warden mends when hurt, strikes when it can, and
  ends its turn when its hand runs dry. Bring its life to zero before it does the same to you.
- **A real deck** — 24 original cards, shuffled every duel; the discard pile reshuffles when
  the deck runs out. No two duels play the same.
- **Win and loss screens** — both show the duel's turns, damage dealt and cards played, and
  your total duels won is kept between visits.

## Controls

| Key / mouse | What it does |
| --- | --- |
| Click a card | Select it; click again to play it |
| 1–7 | Play that card from your hand |
| Space / Enter | End your turn (or start on the title screen) |
| R | Play again after a win or a loss |
| P / Esc | Pause |
| M | Mute the sounds |

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `game/index.html` opens in desktop Chrome with no build step and no
network request. `main.ts` (Node 22) copies `game/` and `screenshots/` to the output
directory and writes `dossier.json`.

## Screenshots

`shots.json` stages the four scenes deterministically (`?shot=start|play|win|lose`
with `&seed=N`): the title table, a mid-game table, victory, and defeat.
