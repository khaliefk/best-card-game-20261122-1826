// The duel itself, pure logic with no DOM: two sides at 30 life, a shared 24-card deck each,
// embers that grow one a turn and pay for cards. A card is a strike (damage), a mend (heal),
// an insight (draw) or a ward (shield). The player plays by hand; the Warden plays by a
// simple greedy policy. Every function is deterministic for a fixed seed.

import { CARDS, EMBER_MAX, HAND_MAX, START_HAND, START_LIFE } from './config.js';

export const EVENT_PLAYED = 1;
export const EVENT_WIN = 2;
export const EVENT_LOSE = 4;

const BY_ID = new Map(CARDS.map((card) => [card.id, card]));

function shuffle(deck, random) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

function newSide(random) {
  return {
    life: START_LIFE,
    shield: 0,
    embers: 1,
    maxEmbers: 1,
    hand: [],
    deck: shuffle(CARDS.map((card) => card.id), random),
    discard: [],
  };
}

function drawCards(state, side, count) {
  const who = state[side];
  for (let i = 0; i < count; i += 1) {
    if (who.hand.length >= HAND_MAX) return;
    if (who.deck.length === 0) {
      if (who.discard.length === 0) return;
      who.deck = shuffle(who.discard, state.random);
      who.discard = [];
    }
    who.hand.push(who.deck.pop());
  }
}

/** Damage first eats the shield, then life. Returns the life actually lost. */
function dealDamage(state, side, amount) {
  const who = state[side];
  let left = amount;
  if (who.shield > 0) {
    const absorbed = Math.min(who.shield, left);
    who.shield -= absorbed;
    left -= absorbed;
  }
  const lost = Math.min(who.life, left);
  who.life -= lost;
  return lost;
}

function other(side) {
  return side === 'you' ? 'foe' : 'you';
}

function nameOf(side) {
  return side === 'you' ? 'You' : 'The Warden';
}

export function createWorld(random) {
  const state = {
    random,
    turn: 1,
    side: 'you',
    you: null,
    foe: null,
    log: [],
    stats: { turns: 0, damage: 0, played: 0, healed: 0 },
    winner: null,
    lastPlay: null,
  };

  function say(text) {
    state.log.push(text);
    if (state.log.length > 4) state.log.shift();
  }

  function reset() {
    state.turn = 1;
    state.side = 'you';
    state.you = newSide(random);
    state.foe = newSide(random);
    state.log = [];
    state.stats = { turns: 0, damage: 0, played: 0, healed: 0 };
    state.winner = null;
    state.lastPlay = null;
    drawCards(state, 'you', START_HAND);
    drawCards(state, 'foe', START_HAND);
    say('The duel begins. You hold the first ember.');
  }

  function canPlay(side, index) {
    if (state.winner !== null || state.side !== side) return false;
    const who = state[side];
    const id = who.hand[index];
    if (id === undefined) return false;
    return BY_ID.get(id).cost <= who.embers;
  }

  function playCard(side, index) {
    if (!canPlay(side, index)) return 0;
    const who = state[side];
    const target = state[other(side)];
    const id = who.hand[index];
    const card = BY_ID.get(id);
    who.hand.splice(index, 1);
    who.discard.push(id);
    who.embers -= card.cost;
    let events = EVENT_PLAYED;
    if (side === 'you') state.stats.played += 1;
    if (card.kind === 'strike') {
      const lost = dealDamage(state, other(side), card.power);
      if (side === 'you') state.stats.damage += lost;
      say(`${nameOf(side)} play ${card.name} — ${card.power} damage.`);
    } else if (card.kind === 'mend') {
      const healed = Math.min(START_LIFE - who.life, card.power);
      who.life += healed;
      if (side === 'you') state.stats.healed += healed;
      say(`${nameOf(side)} play ${card.name} — mend ${healed} life.`);
    } else if (card.kind === 'insight') {
      drawCards(state, side, card.power);
      say(`${nameOf(side)} play ${card.name} — draw ${card.power}.`);
    } else if (card.kind === 'ward') {
      who.shield += card.power;
      say(`${nameOf(side)} play ${card.name} — ward ${card.power}.`);
    }
    state.lastPlay = { by: side, card };
    if (target.life <= 0) {
      state.winner = side;
      events |= side === 'you' ? EVENT_WIN : EVENT_LOSE;
      say(side === 'you' ? 'The Warden falls. Victory is yours.' : 'Your last ember fades. The Warden wins.');
    }
    return events;
  }

  function endTurn() {
    if (state.winner !== null) return 0;
    const next = other(state.side);
    state.side = next;
    const who = state[next];
    who.maxEmbers = Math.min(EMBER_MAX, who.maxEmbers + 1);
    who.embers = who.maxEmbers;
    drawCards(state, next, 1);
    if (next === 'you') {
      state.turn += 1;
      state.stats.turns = state.turn;
      say(`Turn ${state.turn}. Your move.`);
    } else {
      say('The Warden takes the table.');
    }
    return 0;
  }

  /** One greedy policy for both sides: mend when hurt, else the best strike, else draw to
   *  cycle the hand, else ward while the shield is thin, else mend below full life — and as a
   *  last resort any affordable card, so a side holding only mends at full life still acts
   *  instead of passing forever. Returns the hand index, or -1 when nothing is affordable. */
  function choosePlay(side) {
    const who = state[side];
    const affordable = who.hand
      .map((id, index) => ({ card: BY_ID.get(id), index }))
      .filter((entry) => entry.card.cost <= who.embers);
    if (affordable.length === 0) return -1;
    const ofKind = (kind) => affordable.filter((entry) => entry.card.kind === kind);
    const best = (list) => {
      if (list.length === 0) return null;
      let pick = list[0];
      for (const entry of list) {
        const score = entry.card.power / entry.card.cost;
        const bestScore = pick.card.power / pick.card.cost;
        if (score > bestScore || (score === bestScore && entry.card.power > pick.card.power)) pick = entry;
      }
      return pick;
    };
    if (who.life <= 12) {
      const mend = best(ofKind('mend'));
      if (mend !== null) return mend.index;
    }
    const strike = best(ofKind('strike'));
    if (strike !== null) return strike.index;
    if (who.hand.length < HAND_MAX) {
      const insight = best(ofKind('insight'));
      if (insight !== null) return insight.index;
    }
    if (who.shield < 3) {
      const ward = best(ofKind('ward'));
      if (ward !== null) return ward.index;
    }
    const mend = best(ofKind('mend'));
    if (mend !== null && who.life < START_LIFE) return mend.index;
    return best(affordable).index;
  }

  /** Choose and play one card for `side`; returns the hand index played, or -1. */
  function autoPlay(side) {
    if (state.winner !== null || state.side !== side) return -1;
    const index = choosePlay(side);
    if (index === -1) return -1;
    playCard(side, index);
    return index;
  }

  /** One Warden action: play a card, or -1 when the Warden ends its turn. */
  function aiStep() {
    return autoPlay('foe');
  }

  reset();

  return { state, reset, canPlay, playCard, endTurn, aiStep, autoPlay, cardById: (id) => BY_ID.get(id) };
}
