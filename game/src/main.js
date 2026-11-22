// Boot and the one loop: input is read every frame, the Warden's turn is paced out in
// ~0.65 s steps so a human can follow it, and the renderer paints what is there. The game
// moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the shuffle. ?shot=start|play|win|lose (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { EVENT_LOSE, EVENT_PLAYED, EVENT_WIN, createWorld } from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_END_TURN,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the win count then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, { best: scene.best, selected: -1, hoverCard: -1 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let selected = -1;
  let aiTimer = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    selected = -1;
    aiTimer = 0;
    screen = SCREEN_PLAY;
    sound.unlock();
    announce('Playing. Your turn: play a card, then end your turn.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.winner === 'you') {
      best += 1;
      saveBest(best);
      sound.win();
      announce(`Victory in ${world.state.stats.turns} turns. Duels won: ${best}.`);
    } else {
      sound.lose();
      announce(`Defeat. The Warden wins in ${world.state.stats.turns} turns.`);
    }
  }

  function playCard(index) {
    const state = world.state;
    if (state.side !== 'you' || state.winner !== null) return;
    const card = state.you.hand[index];
    if (card === undefined) return;
    const events = world.playCard('you', index);
    if (events & EVENT_PLAYED) {
      selected = -1;
      const played = world.state.lastPlay.card;
      if (played.kind === 'strike') sound.hit();
      else if (played.kind === 'mend') sound.heal();
      else if (played.kind === 'insight') sound.draw();
      else sound.play();
      if (events & EVENT_WIN) endGame();
    }
  }

  function endTurn() {
    const state = world.state;
    if (state.side !== 'you' || state.winner !== null) return;
    world.endTurn();
    aiTimer = 0.8;
    sound.turn();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startGame();
      return;
    }
    if (screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const keyCard = input.keyCard(actions);
    if (keyCard >= 0) playCard(keyCard);
    else if (actions & ACTION_END_TURN) endTurn();
  }

  function handleClick() {
    const raw = input.takeClick();
    if (raw === null) return;
    const point = renderer.toLogical(raw.clientX, raw.clientY);
    if (screen === SCREEN_TITLE) {
      sound.unlock();
      startGame();
      return;
    }
    if (screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const hit = renderer.hit(point.x, point.y);
    if (hit === null) {
      selected = -1;
      return;
    }
    if (hit.type === 'end') {
      endTurn();
      return;
    }
    if (hit.type === 'card') {
      if (selected === hit.index) {
        playCard(hit.index);
      } else {
        selected = hit.index;
        sound.play();
      }
    }
  }

  function hoverCard() {
    const raw = input.hover();
    if (raw.clientX < 0) return -1;
    const point = renderer.toLogical(raw.clientX, raw.clientY);
    const hit = renderer.hit(point.x, point.y);
    return hit !== null && hit.type === 'card' ? hit.index : -1;
  }

  function stepAi(dt) {
    const state = world.state;
    if (screen !== SCREEN_PLAY || state.side !== 'foe' || state.winner !== null) return;
    aiTimer -= dt;
    if (aiTimer > 0) return;
    aiTimer = 0.65;
    const played = world.aiStep();
    if (played === -1) {
      world.endTurn();
      aiTimer = 0;
      sound.turn();
      return;
    }
    const card = state.lastPlay.card;
    if (card.kind === 'strike') sound.hit();
    else if (card.kind === 'mend') sound.heal();
    else sound.play();
    if (state.winner !== null) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    handleActions();
    handleClick();
    if (screen === SCREEN_PLAY) stepAi(dt);
    renderer.draw(world, screen, { best, selected, hoverCard: hoverCard() });
  }

  let last = performance.now();

  // Leaving the tab pauses a running game rather than letting the Warden play unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Court. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
