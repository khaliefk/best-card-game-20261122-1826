// Mouse and keyboard, read every frame. Clicks are reported as points in the canvas's own
// coordinates; keys arrive as single actions the game loop consumes once.

export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;

export function createInput(canvas) {
  let actions = 0;
  let click = null;
  let hover = { clientX: -1, clientY: -1 };

  // Clicks and hover are kept in raw viewport (client) coordinates; the renderer converts
  // them to the table's logical coordinates, so devicePixelRatio never leaks in here.
  canvas.addEventListener('click', (event) => {
    click = { clientX: event.clientX, clientY: event.clientY };
  });
  canvas.addEventListener('mousemove', (event) => {
    hover = { clientX: event.clientX, clientY: event.clientY };
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === ' ' || key === 'Enter') {
      actions |= ACTION_CONFIRM | ACTION_END_TURN;
      event.preventDefault();
    } else if (key === 'p' || key === 'P' || key === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (key === 'r' || key === 'R') {
      actions |= ACTION_RESTART;
    } else if (key === 'm' || key === 'M') {
      actions |= ACTION_MUTE;
    } else if (/^[1-7]$/.test(key)) {
      actions |= 32 << (Number(key) - 1);
    }
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    hover() {
      return hover;
    },
    /** Which hand card a number key asked for, 0-based, or -1. */
    keyCard(takenActions) {
      for (let i = 0; i < 7; i += 1) {
        if (takenActions & (32 << i)) return i;
      }
      return -1;
    },
  };
}
