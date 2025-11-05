// Formation utilities and presets for placing players on the field.

const GOALIE_Y = 90;

// Base Y positions for each role in "normal" depth.
const BASE_Y = {
  keeper: GOALIE_Y,
  sweeper: 80,
  defense: 75,
  stopper: 70,
  defensiveMid: 60,
  mid: 50,
  winger: 40,
  forward: 30,
};

// Order to process positions so descriptions and coordinates stay in sync.
const ROLES = [
  'keeper',
  'sweeper',
  'defense',
  'stopper',
  'defensiveMid',
  'mid',
  'winger',
  'forward',
];

// Human friendly role labels.
const ROLE_NAMES = {
  keeper: 'keeper',
  sweeper: 'sweeper',
  defense: 'defender',
  stopper: 'stopper',
  defensiveMid: 'defensive midfielder',
  mid: 'midfielder',
  winger: 'winger',
  forward: 'forward',
};

import {
  DEPTH_CODES,
  DEPTH_LOOKUP,
  WIDTH_CODES,
  WIDTH_LOOKUP,
} from './positioning';

const WIDTH_OPTIONS = [
  'veryNarrow',
  'narrow',
  'neutral',
  'wide',
  'veryWide',
];

const WIDTH_NAMES = {
  veryNarrow: 'very narrow',
  narrow: 'narrow',
  neutral: 'neutral',
  wide: 'wide',
  veryWide: 'very wide',
};

// Parse a compact code like "MX" into width/depth modifiers.
function parseCode(code = '') {
  if (!code) return { depth: 'neutral', width: 'neutral' };
  let remaining = code;
  let depthCode;
  if (remaining.startsWith('DD')) {
    depthCode = 'DD';
    remaining = remaining.slice(2);
  } else if (remaining.startsWith('HH')) {
    depthCode = 'HH';
    remaining = remaining.slice(2);
  } else {
    depthCode = remaining[0];
    remaining = remaining.slice(1);
  }
  let widthCode;
  if (remaining.startsWith('OO')) {
    widthCode = 'OO';
  } else if (remaining.startsWith('II')) {
    widthCode = 'II';
  } else {
    widthCode = remaining[0];
  }
  return {
    depth: DEPTH_CODES[depthCode] ?? 'neutral',
    width: WIDTH_CODES[widthCode] ?? 'neutral',
  };
}

function buildCode({ depth, width }) {
  const depthChar = DEPTH_LOOKUP[depth] ?? 'X';
  const widthChar = WIDTH_LOOKUP[width] ?? 'X';
  return `${depthChar}${widthChar}`;
}

// Spread players evenly across the field.
function distribute(count) {
  if (count === 1) return [50];
  const margin = 100 / (count + 1);
  return Array.from({ length: count }, (_, i) => margin * (i + 1));
}

const WIDTH_OFFSETS = {
  veryNarrow: -20,
  narrow: -10,
  neutral: 0,
  wide: 10,
  veryWide: 20,
};

function adjustX(x, width) {
  if (Math.abs(x - 50) < 0.01) return x;
  const delta = WIDTH_OFFSETS[width] ?? 0;
  return x < 50 ? x - delta : x + delta;
}

const DEPTH_OFFSETS = {
  veryDeep: 20,
  deep: 10,
  neutral: 0,
  high: -10,
  veryHigh: -20,
};

function adjustY(y, depth) {
  return y + (DEPTH_OFFSETS[depth] ?? 0);
}

// Convert a high level formation spec into coordinates.
function buildFormation(spec) {
  const positions = [];
  let id = 0;

  ROLES.forEach((role) => {
    const players = spec[role] || [];
    if (role === 'keeper') {
      positions.push({ id: id++, x: 50, y: BASE_Y.keeper });
      return;
    }

    if (players.length === 0) return;

    const xs = distribute(players.length);
    players.forEach((code, idx) => {
      const { depth, width } = parseCode(code);
      const x = adjustX(xs[idx], width);
      const y = adjustY(BASE_Y[role], depth);
      positions.push({ id: id++, x, y });
    });
  });

  return positions;
}

// Describe a formation in plain language.
function describeFormation(spec) {
  return ROLES.flatMap((role) => {
    const players = spec[role] || [];
    return players.map((code) => {
      const { depth, width } = parseCode(code);
      const widthName = WIDTH_NAMES[width] ?? width;
      const modifiers = [depth, widthName].filter((m) => m !== 'neutral');
      const prefix = modifiers.join(' ');
      const roleName = ROLE_NAMES[role];
      return prefix ? `${prefix} ${roleName}` : roleName;
    });
  }).join(', ');
}

const FORMATION_SPECS = {
  '3-3-1': {
    keeper: [''],
    defense: ['XO', 'XI', 'XO'],
    mid: ['XO', 'XI', 'XO'],
    forward: ['XI'],
  },
  '2-3-2': {
    keeper: [''],
    defense: ['XO', 'XO'],
    mid: ['XO', 'XI', 'XO'],
    forward: ['XO', 'XO'],
  },
  '3-2-2': {
    keeper: [''],
    defense: ['XO', 'XI', 'XO'],
    mid: ['XI', 'XI'],
    forward: ['XO', 'XO'],
  },
  '2-1-2-2': {
    keeper: [''],
    defense: ['XO', 'XO'],
    defensiveMid: ['XI'],
    mid: ['XO', 'XO'],
    forward: ['XI', 'XI'],
  },
};

const FORMATIONS = Object.fromEntries(
  Object.entries(FORMATION_SPECS).map(([name, spec]) => [name, buildFormation(spec)]),
);

export {
  FORMATION_SPECS,
  describeFormation,
  parseCode,
  buildCode,
  buildFormation,
  ROLE_NAMES,
  ROLES,
  WIDTH_OPTIONS,
  WIDTH_NAMES,
};
export default FORMATIONS;

