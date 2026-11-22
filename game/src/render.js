// The table, painted on one canvas. The playfield is a fixed 1280x720 logical area scaled to
// the window; every number a player needs — life, embers, costs, powers — is drawn big enough
// to read in a screenshot.

import { CARD, ELEMENTS, FIELD, FONT, FONT_UI, KINDS, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const HAND_Y = 486;
const HAND_AREA = { x: 120, width: 1040 };
const FOE_HAND = { x: 690, y: 30, w: 76, h: 106, gap: 10 };
export const END_TURN_RECT = { x: 1075, y: 295, w: 165, h: 64 };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSigil(ctx, shape, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'flame') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.9, cy - size * 0.2, cx + size * 0.6, cy + size * 0.7, cx, cy + size * 0.8);
    ctx.bezierCurveTo(cx - size * 0.6, cy + size * 0.7, cx - size * 0.9, cy - size * 0.2, cx, cy - size);
  } else if (shape === 'drop') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.85, cy - size * 0.1, cx + size * 0.7, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx - size * 0.7, cy + size, cx - size * 0.85, cy - size * 0.1, cx, cy - size);
  } else if (shape === 'leaf') {
    ctx.moveTo(cx - size, cy + size * 0.7);
    ctx.quadraticCurveTo(cx - size, cy - size, cx + size * 0.9, cy - size * 0.8);
    ctx.quadraticCurveTo(cx + size * 0.9, cy + size * 0.8, cx - size, cy + size * 0.7);
  } else {
    ctx.moveTo(cx - size * 0.8, cy - size * 0.5);
    ctx.lineTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.6, cy + size * 0.7);
    ctx.lineTo(cx - size * 0.6, cy + size * 0.7);
    ctx.closePath();
  }
  ctx.fill();
}

function drawShield(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.85, cy - size * 0.55);
  ctx.lineTo(cx + size * 0.7, cy + size * 0.45);
  ctx.quadraticCurveTo(cx + size * 0.35, cy + size * 0.95, cx, cy + size);
  ctx.quadraticCurveTo(cx - size * 0.35, cy + size * 0.95, cx - size * 0.7, cy + size * 0.45);
  ctx.lineTo(cx - size * 0.85, cy - size * 0.55);
  ctx.closePath();
  ctx.fill();
}

function lifeBar(ctx, x, y, w, life, max, shield, color) {
  ctx.fillStyle = PALETTE.lifeBack;
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fill();
  const frac = Math.max(0, life / max);
  if (frac > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x + 2, y + 2, Math.max(8, (w - 4) * frac), 18, 9);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 17px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${life} / ${max}`, x + w + 10, y + 11);
  if (shield > 0) {
    drawShield(ctx, x + w + 78, y + 11, 11, '#7fb3d8');
    ctx.fillStyle = '#cfe6f5';
    ctx.font = `700 16px ${FONT_UI}`;
    ctx.fillText(String(shield), x + w + 94, y + 11);
  }
}

function emberPips(ctx, x, y, embers, max) {
  for (let i = 0; i < max; i += 1) {
    const cx = x + i * 30 + 12;
    ctx.fillStyle = i < embers ? PALETTE.ember : PALETTE.emberBack;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + 10, y + 10);
    ctx.lineTo(cx, y + 20);
    ctx.lineTo(cx - 10, y + 10);
    ctx.closePath();
    ctx.fill();
    if (i >= embers) {
      ctx.strokeStyle = '#6b5322';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 16px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${embers} embers`, x + max * 30 + 8, y + 10);
}

function cardBack(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.back;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.backEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,162,75,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 5);
  ctx.stroke();
  drawSigil(ctx, 'flame', x + w / 2, y + h / 2, 16, PALETTE.trim);
}

export function handRects(count) {
  const total = count * CARD.width + (count - 1) * CARD.gap;
  const maxWidth = HAND_AREA.width;
  const gap = total <= maxWidth ? CARD.gap : (maxWidth - count * CARD.width) / (count - 1);
  const startX = HAND_AREA.x + (maxWidth - (count * CARD.width + (count - 1) * gap)) / 2;
  const rects = [];
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: startX + i * (CARD.width + gap), y: HAND_Y, w: CARD.width, h: CARD.height });
  }
  return rects;
}

function drawCard(ctx, card, rect, opts) {
  const { affordable, hover, selected } = opts;
  const el = ELEMENTS[card.element];
  const y = rect.y - (selected ? 18 : 0);
  ctx.save();
  if (!affordable) ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#f6efdd';
  roundRect(ctx, rect.x, y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = hover ? PALETTE.trim : '#b09a6a';
  ctx.lineWidth = hover ? 3 : 1.5;
  ctx.stroke();
  // Element header band.
  ctx.fillStyle = el.color;
  roundRect(ctx, rect.x, y, rect.w, 34, 10);
  ctx.fill();
  ctx.fillRect(rect.x, y + 24, rect.w, 10);
  ctx.fillStyle = '#fff';
  ctx.font = `700 13px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name.toUpperCase(), rect.x + rect.w / 2, y + 18);
  // Cost circle.
  ctx.fillStyle = affordable ? '#c9a24b' : '#a33';
  ctx.beginPath();
  ctx.arc(rect.x + 22, y + 52, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 20px ${FONT_UI}`;
  ctx.fillText(String(card.cost), rect.x + 22, y + 53);
  // Name.
  ctx.fillStyle = '#241a08';
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = 'center';
  const words = card.name.split(' ');
  if (card.name.length > 13 && words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(' '), rect.x + rect.w / 2, y + 86);
    ctx.fillText(words.slice(mid).join(' '), rect.x + rect.w / 2, y + 106);
  } else {
    ctx.fillText(card.name, rect.x + rect.w / 2, y + 96);
  }
  // Sigil.
  drawSigil(ctx, el.sigil, rect.x + rect.w / 2, y + 140, 20, el.color);
  // Kind + power.
  ctx.fillStyle = '#5c5232';
  ctx.font = `700 12px ${FONT_UI}`;
  ctx.fillText(KINDS[card.kind].label, rect.x + rect.w / 2, y + 172);
  ctx.fillStyle = el.dark;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(String(card.power), rect.x + rect.w / 2, y + 194);
  ctx.restore();
}

function drawMiniCard(ctx, card, x, y, scale) {
  const w = CARD.width * scale;
  const h = CARD.height * scale;
  const el = ELEMENTS[card.element];
  ctx.fillStyle = '#f6efdd';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#b09a6a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = el.color;
  ctx.fillRect(x, y, w, 22 * scale);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(11 * scale)}px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name.toUpperCase(), x + w / 2, y + 11 * scale);
  ctx.fillStyle = '#241a08';
  ctx.font = `700 ${Math.round(13 * scale)}px ${FONT}`;
  ctx.fillText(card.name, x + w / 2, y + 52 * scale);
  drawSigil(ctx, el.sigil, x + w / 2, y + 92 * scale, 16 * scale, el.color);
  ctx.fillStyle = el.dark;
  ctx.font = `700 ${Math.round(24 * scale)}px ${FONT}`;
  ctx.fillText(`${KINDS[card.kind].label} ${card.power}`, x + w / 2, y + 126 * scale);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let lastRects = [];
  let lastEndTurn = END_TURN_RECT;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    offsetX = (canvas.width - FIELD.width * scale) / 2;
    offsetY = (canvas.height - FIELD.height * scale) / 2;
  }

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
  }

  function hit(x, y) {
    for (let i = lastRects.length - 1; i >= 0; i -= 1) {
      const r = lastRects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y - 18 && y <= r.y + r.h) return { type: 'card', index: i };
    }
    const b = lastEndTurn;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return { type: 'end' };
    return null;
  }

  function drawTable() {
    ctx.fillStyle = PALETTE.feltDark;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const grad = ctx.createRadialGradient(640, 360, 80, 640, 360, 720);
    grad.addColorStop(0, PALETTE.feltLight);
    grad.addColorStop(1, PALETTE.felt);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.strokeStyle = PALETTE.trimDim;
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, FIELD.width - 28, FIELD.height - 28);
    ctx.strokeStyle = 'rgba(201,162,75,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(640, 360, 300, 130, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawSigil(ctx, 'flame', 640, 360, 26, 'rgba(201,162,75,0.35)');
  }

  function drawSide(state, side, isFoe, showInfo = true) {
    const who = state[side];
    const name = isFoe ? 'Ash Warden' : 'You';
    if (isFoe) {
      ctx.fillStyle = '#2a2118';
      ctx.beginPath();
      ctx.arc(88, 92, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.trim;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawSigil(ctx, 'flame', 88, 92, 22, '#e2574c');
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 24px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(name, 150, 78);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 14px ${FONT_UI}`;
      ctx.fillText('Keeper of the last ember', 150, 100);
      lifeBar(ctx, 150, 112, 300, who.life, 30, who.shield, PALETTE.life);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 14px ${FONT_UI}`;
      ctx.fillText(`${who.deck.length} cards in deck`, 150, 152);
      for (let i = 0; i < Math.min(who.hand.length, 7); i += 1) {
        cardBack(ctx, FOE_HAND.x + i * (FOE_HAND.w + FOE_HAND.gap), FOE_HAND.y, FOE_HAND.w, FOE_HAND.h);
      }
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 14px ${FONT_UI}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${who.hand.length} in hand`, FOE_HAND.x, FOE_HAND.y + FOE_HAND.h + 20);
    } else if (showInfo) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 24px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(name, 60, 458);
      lifeBar(ctx, 150, 444, 300, who.life, 30, who.shield, '#58b368');
      emberPips(ctx, 540, 444, who.embers, who.maxEmbers);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 14px ${FONT_UI}`;
      ctx.fillText(`${who.deck.length} cards in deck`, 900, 458);
    }
  }

  function drawCenter(state, ui, screen) {
    // Turn banner.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const yourTurn = state.side === 'you' && state.winner === null;
    ctx.fillStyle = yourTurn ? PALETTE.trim : PALETTE.muted;
    ctx.font = `700 20px ${FONT_UI}`;
    ctx.fillText(yourTurn ? '— YOUR TURN —' : '— THE WARDEN THINKS —', 640, 196);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 14px ${FONT_UI}`;
    ctx.fillText(`Turn ${state.turn}`, 640, 220);
    // Log.
    ctx.textAlign = 'left';
    ctx.font = `400 15px ${FONT_UI}`;
    state.log.forEach((line, i) => {
      ctx.fillStyle = i === state.log.length - 1 ? PALETTE.text : PALETTE.muted;
      ctx.fillText(line, 60, 262 + i * 24);
    });
    // Last played card, side by side in the middle — hidden on the end screens, where the
    // victory/defeat panel sits over this spot.
    if (screen !== SCREEN_OVER && state.lastPlay !== null) {
      drawMiniCard(ctx, state.lastPlay.card, 560, 246, 0.62);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 14px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.fillText(state.lastPlay.by === 'you' ? 'you played' : 'warden played', 606, 386);
    }
    // End turn button.
    const b = END_TURN_RECT;
    const enabled = yourTurn;
    ctx.fillStyle = enabled ? PALETTE.button : PALETTE.buttonDim;
    roundRect(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.fillStyle = enabled ? PALETTE.buttonText : '#cfc8ae';
    ctx.font = `700 20px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText('END TURN', b.x + b.w / 2, b.y + b.h / 2 + 1);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 13px ${FONT_UI}`;
    ctx.fillText('or press Space', b.x + b.w / 2, b.y + b.h + 20);
  }

  function drawTitle(best) {
    ctx.fillStyle = 'rgba(8,16,11,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawSigil(ctx, 'flame', 640, 150, 44, '#e2574c');
    ctx.fillStyle = PALETTE.trim;
    ctx.font = `700 88px ${FONT}`;
    ctx.fillText('EMBER COURT', 640, 260);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 24px ${FONT}`;
    ctx.fillText('A duel of elemental cards', 640, 322);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 18px ${FONT_UI}`;
    ctx.fillText('You and the Ash Warden, 30 life each. Spend embers, play cards,', 640, 380);
    ctx.fillText('bring the Warden to zero before your own ember fades.', 640, 406);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 22px ${FONT_UI}`;
    ctx.fillText('Click or press Space to start', 640, 470);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 16px ${FONT_UI}`;
    ctx.fillText('1–7 play a card  ·  Space ends your turn  ·  R restarts  ·  M mutes', 640, 516);
    if (best > 0) {
      ctx.fillStyle = PALETTE.win;
      ctx.font = `700 18px ${FONT_UI}`;
      ctx.fillText(`Duels won: ${best}`, 640, 556);
    }
  }

  function drawOver(state, best) {
    const won = state.winner === 'you';
    ctx.fillStyle = 'rgba(8,16,11,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = won ? PALETTE.win : PALETTE.lose;
    ctx.font = `700 84px ${FONT}`;
    ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 24px ${FONT}`;
    ctx.fillText(won ? 'The Warden falls. The court is yours.' : 'Your last ember fades. The Warden wins.', 640, 322);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 19px ${FONT_UI}`;
    ctx.fillText(`Turns: ${state.stats.turns}    Damage dealt: ${state.stats.damage}    Cards played: ${state.stats.played}`, 640, 392);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 22px ${FONT_UI}`;
    ctx.fillText('Press R or click to play again', 640, 530);
    if (best > 0) {
      ctx.fillStyle = PALETTE.win;
      ctx.font = `400 17px ${FONT_UI}`;
      ctx.fillText(`Duels won: ${best}`, 640, 568);
    }
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(8,16,11,0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 56px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', 640, 340);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 20px ${FONT_UI}`;
    ctx.fillText('Press P to resume', 640, 396);
  }

  function draw(world, screen, ui) {
    const state = world.state;
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawTable();
    if (screen === SCREEN_TITLE) {
      // A dealt table behind the title, so the first screenshot already shows the game.
      // The player's life row stays hidden: the title text sits over that spot.
      drawSide(state, 'foe', true);
      drawSide(state, 'you', false, false);
      drawTitle(ui.best);
      return;
    }
    drawSide(state, 'foe', true);
    drawSide(state, 'you', false);
    drawCenter(state, ui, screen);
    lastRects = handRects(state.you.hand.length);
    lastEndTurn = END_TURN_RECT;
    state.you.hand.forEach((id, i) => {
      const card = world.cardById(id);
      const affordable = state.side === 'you' && state.winner === null && card.cost <= state.you.embers;
      drawCard(ctx, card, lastRects[i], {
        affordable,
        hover: ui.hoverCard === i,
        selected: ui.selected === i,
      });
    });
    if (screen === SCREEN_PAUSED) drawPaused();
    if (screen === SCREEN_OVER) drawOver(state, ui.best);
  }

  return { draw, hit, toLogical, resize };
}
