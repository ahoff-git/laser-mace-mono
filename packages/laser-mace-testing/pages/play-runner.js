import Link from 'next/link';
import { useState } from 'react';
import {
  FORMATION_SPECS,
  buildFormation,
  ROLES,
  parseCode,
} from '../lib/formations';
import { formatPosition } from '../lib/positioning';
import FormationGrid from '../components/FormationGrid';

// How long players take to run to a new spot.
const PLAYER_RUN_MS = 400;

// Base styling for each player marker.
const PLAYER_BASE_STYLE = {
  position: 'absolute',
  // Shrink on narrow screens but cap at desktop-friendly size.
  width: 'clamp(8px, 2.5vw, 20px)',
  height: 'clamp(8px, 2.5vw, 20px)',
  background: 'red',
  transform: 'translate(-50%, -50%)',
  transition: `top ${PLAYER_RUN_MS}ms linear, left ${PLAYER_RUN_MS}ms linear`,
};

function playerStyle({ x, y, isGoalie }) {
  return {
    ...PLAYER_BASE_STYLE,
    left: `${x}%`,
    top: `${y}%`,
    background: isGoalie ? 'blue' : PLAYER_BASE_STYLE.background,
  };
}

function Player({ x, y, isGoalie }) {
  const style = playerStyle({ x, y, isGoalie });
  return <div style={style} />;
}

// Distance squared between two coordinates.
function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// Pair each player with the nearest new position so nobody sprints across the field.
function assignClosest(players, targets) {
  const remaining = [...targets];
  return players.map((p) => {
    let bestIndex = 0;
    let bestDist = Infinity;
    remaining.forEach((t, idx) => {
      const dist = distanceSq(p, t);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = idx;
      }
    });
    const { x, y } = remaining.splice(bestIndex, 1)[0];
    return { ...p, x, y };
  });
}

// Rotate formation coordinates so goals sit on the field's sides.
function rotateFormation(players) {
  return players.map(({ id, x, y }) => ({ id, x: 100 - y, y: x }));
}

function cloneSpec(spec) {
  return ROLES.reduce((acc, role) => {
    acc[role] = [...(spec[role] || [])];
    return acc;
  }, {});
}

// Map existing role names to the shorthand zone role.
const ROLE_ZONE = {
  sweeper: 'D',
  defense: 'D',
  stopper: 'D',
  defensiveMid: 'M',
  mid: 'M',
  winger: 'F',
  forward: 'F',
};

function zoneCode(role, idx, total) {
  const zoneRole = ROLE_ZONE[role];
  if (!zoneRole) return null;
  if (total === 1) return `C${zoneRole}`;
  if (total === 2) return `${idx === 0 ? 'L' : 'R'}${zoneRole}`;
  if (total === 3) return `${['L', 'C', 'R'][idx]}${zoneRole}`;
  return `${idx < total / 2 ? 'L' : 'R'}${zoneRole}`;
}

function formationToShorthand(spec) {
  return ROLES.flatMap((role) => {
    const players = spec[role] || [];
    return players.map((code, idx) => {
      const { depth, width } = parseCode(code);
      const zone = zoneCode(role, idx, players.length);
      if (!zone) return null;
      return formatPosition({ zone, depth, width });
    });
  })
    .filter(Boolean)
    .join(', ');
}

function HomeButton() {
  return (
    <>
      <nav className="home-button">
        <Link href="/">Home</Link>
      </nav>
      <style jsx>{`
        .home-button {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
        }
        .home-button a {
          color: #0070f3;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}

export default function PlayRunner() {
  const formationNames = Object.keys(FORMATION_SPECS);
  const [selectedFormation, setSelectedFormation] = useState(
    formationNames[0],
  );
  const [spec, setSpec] = useState(() =>
    cloneSpec(FORMATION_SPECS[formationNames[0]]),
  );
  const [players, setPlayers] = useState(() =>
    rotateFormation(buildFormation(FORMATION_SPECS[formationNames[0]])),
  );
  const formationShorthand = formationToShorthand(spec);

  function handleFormationChange(e) {
    const next = e.target.value;
    setSelectedFormation(next);
    const nextSpec = cloneSpec(FORMATION_SPECS[next]);
    handleSpecChange(nextSpec);
  }

  function handleSpecChange(nextSpec) {
    setSpec(nextSpec);
    const targets = rotateFormation(buildFormation(nextSpec));
    setPlayers((prev) => assignClosest(prev, targets));
  }

  return (
    <div className="container">
      <HomeButton />
      <div className="controls">
        <label htmlFor="formation">Formation:</label>
        <select
          id="formation"
          value={selectedFormation}
          onChange={handleFormationChange}
        >
          {formationNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        {players.map((p, idx) => (
          <Player key={p.id} x={p.x} y={p.y} isGoalie={idx === 0} />
        ))}
      </div>
      <FormationGrid spec={spec} onSpecChange={handleSpecChange} />
      <p className="description">{formationShorthand}</p>
      <style jsx>{`
        .container {
          text-align: center;
          padding: 1rem;
          position: relative;
        }
        .field {
          position: relative;
          width: 100%;
          max-width: 800px;
          aspect-ratio: 8 / 5;
          margin: 1rem auto;
          background: #0a0;
          border: 2px solid #fff;
        }
        .field::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #fff;
        }
        .field::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100px;
          height: 100px;
          margin-left: -50px;
          margin-top: -50px;
          border: 2px solid #fff;
          border-radius: 50%;
        }
        .controls {
          margin: 1rem 0;
        }
        label {
          margin-right: 0.5rem;
        }
        .description {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
