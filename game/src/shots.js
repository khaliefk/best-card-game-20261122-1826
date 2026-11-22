// The screenshot scenes behind ?shot=start|play|win|lose. Each one plays the real rules
// forward from a fresh world, steered by a simple autopilot, so the frame is what a real game
// looks like and the same seed always gives the same frame. The win and lose scenes play
// until the duel actually ends (a losing pilot passes every turn; a winning one plays its
// best card each turn), capped so a stuck game still paints.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** The player's autopilot: the same greedy policy the Warden uses (see world.autoPlay). */
function playerAuto(world) {
  return world.autoPlay('you') !== -1;
}

/** One full round: the player acts, then the Warden acts. Returns the winner, if any. */
function playRound(world, playerPlays) {
  const state = world.state;
  if (playerPlays) {
    while (playerAuto(world)) {
      if (state.winner !== null) return state.winner;
    }
  }
  world.endTurn();
  while (state.winner === null && state.side === 'foe') {
    if (world.aiStep() === -1) break;
  }
  if (state.winner === null) world.endTurn();
  return state.winner;
}

/**
 * Set `world` to the named scene (start, play, win or lose; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name !== 'play' && name !== 'win' && name !== 'lose') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    for (let round = 0; round < 5 && state.winner === null; round += 1) {
      playRound(world, true);
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  const playerPlays = name === 'win';
  let winner = null;
  for (let round = 0; round < 200 && winner === null; round += 1) {
    winner = playRound(world, playerPlays);
  }
  return { screen: SCREEN_OVER, best: state.winner === 'you' ? 1 : 0 };
}
