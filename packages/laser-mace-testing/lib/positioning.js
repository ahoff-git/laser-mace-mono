// Utilities for the soccer position shorthand described in the spec.
// The shorthand looks like: "A-LD-HW+ →↑".

const INTENT_CODES = {
  A: 'attacking',
  B: 'balanced',
  D: 'defensive',
};

const DEPTH_CODES = {
  DD: 'veryDeep',
  D: 'deep',
  X: 'neutral',
  H: 'high',
  HH: 'veryHigh',
};

const WIDTH_CODES = {
  II: 'veryNarrow',
  I: 'narrow',
  X: 'neutral',
  O: 'wide',
  OO: 'veryWide',
};

const ZONE_CODES = {
  LD: { side: 'left', role: 'defender' },
  CD: { side: 'center', role: 'defender' },
  RD: { side: 'right', role: 'defender' },
  LM: { side: 'left', role: 'midfielder' },
  CM: { side: 'center', role: 'midfielder' },
  RM: { side: 'right', role: 'midfielder' },
  LF: { side: 'left', role: 'forward' },
  CF: { side: 'center', role: 'forward' },
  RF: { side: 'right', role: 'forward' },
};

const MOVEMENT_CODES = {
  '→': 'forward',
  '←': 'back',
  '↑': 'up',
  '↓': 'down',
};

function reverseLookup(map) {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [value, key]),
  );
}

const INTENT_LOOKUP = reverseLookup(INTENT_CODES);
const DEPTH_LOOKUP = reverseLookup(DEPTH_CODES);
const WIDTH_LOOKUP = reverseLookup(WIDTH_CODES);

function parseIntent(str) {
  const code = str[0];
  if (str[1] === '-' && INTENT_CODES[code]) {
    return { intent: INTENT_CODES[code], rest: str.slice(2) };
  }
  return { intent: null, rest: str };
}

function parseZone(str) {
  const code = str.slice(0, 2);
  return { zone: { code, ...ZONE_CODES[code] }, rest: str.slice(2) };
}

function parseDepthWidth(str) {
  const [_, main] = str.split('-', 2);
  const modifierMatch = main.match(/[+-]$/);
  const modifier = modifierMatch ? modifierMatch[0] : null;
  const core = modifier ? main.slice(0, -1) : main;

  let depthCode;
  let rest = core;
  if (rest.startsWith('DD')) {
    depthCode = 'DD';
    rest = rest.slice(2);
  } else if (rest.startsWith('HH')) {
    depthCode = 'HH';
    rest = rest.slice(2);
  } else {
    depthCode = rest[0];
    rest = rest.slice(1);
  }

  let widthCode;
  if (rest.startsWith('OO')) {
    widthCode = 'OO';
  } else if (rest.startsWith('II')) {
    widthCode = 'II';
  } else {
    widthCode = rest[0];
  }

  return {
    depth: DEPTH_CODES[depthCode],
    width: WIDTH_CODES[widthCode],
    modifier,
  };
}

function parseMovement(str = '') {
  const arrows = [...str];
  return arrows.map((a) => MOVEMENT_CODES[a]).filter(Boolean);
}

function parsePosition(shorthand) {
  const [main, movementPart] = shorthand.split(' ');
  const { intent, rest } = parseIntent(main);
  const { zone, rest: afterZone } = parseZone(rest);
  const { depth, width, modifier } = parseDepthWidth(afterZone);
  const movement = parseMovement(movementPart);
  return { intent, zone, depth, width, modifier, movement };
}

function formatMovement(arr = []) {
  const lookup = reverseLookup(MOVEMENT_CODES);
  return arr.map((m) => lookup[m]).join('');
}

function formatPosition({ intent, zone, depth, width, modifier, movement }) {
  const intentPart = intent ? `${INTENT_LOOKUP[intent]}-` : '';
  const zoneCode = typeof zone === 'string' ? zone : zone.code;
  const depthCode = DEPTH_LOOKUP[depth];
  const widthCode = WIDTH_LOOKUP[width];
  const modPart = modifier ?? '';
  const movePart = formatMovement(movement);
  const main = `${intentPart}${zoneCode}-${depthCode}${widthCode}${modPart}`;
  return movePart ? `${main} ${movePart}` : main;
}

export {
  parsePosition,
  formatPosition,
  INTENT_CODES,
  DEPTH_CODES,
  DEPTH_LOOKUP,
  WIDTH_CODES,
  WIDTH_LOOKUP,
  ZONE_CODES,
  MOVEMENT_CODES,
};

export default parsePosition;

