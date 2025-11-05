import {
  ROLES,
  ROLE_NAMES,
  parseCode,
  buildCode,
  WIDTH_OPTIONS,
  WIDTH_NAMES,
} from '../lib/formations';

const ROLE_COLORS = {
  keeper: '#e0f7fa',
  sweeper: '#e8eaf6',
  defense: '#c8e6c9',
  stopper: '#dcedc8',
  defensiveMid: '#fff9c4',
  mid: '#ffe0b2',
  winger: '#f8bbd0',
  forward: '#ffcdd2',
};

const DEPTH_OPTIONS = [
  'veryDeep',
  'deep',
  'neutral',
  'high',
  'veryHigh',
];
const DEPTH_NAMES = {
  veryDeep: 'very deep',
  deep: 'deep',
  neutral: 'neutral',
  high: 'high',
  veryHigh: 'very high',
};
const ROLE_OPTIONS = ROLES.filter((r) => r !== 'keeper');

function specToRows(spec) {
  return ROLES.flatMap((role) => {
    const players = spec[role] || [];
    return players.map((code, idx) => {
      const { depth, width } = parseCode(code);
      return { id: `${role}-${idx}`, role, idx, depth, width };
    });
  });
}

function replacePlayer(spec, role, idx, code) {
  return {
    ...spec,
    [role]: spec[role].map((c, i) => (i === idx ? code : c)),
  };
}

function movePlayer(spec, fromRole, idx, toRole, code) {
  const next = { ...spec };
  next[fromRole] = spec[fromRole].filter((_, i) => i !== idx);
  next[toRole] = [...(next[toRole] || []), code];
  return next;
}

export default function FormationGrid({ spec, onSpecChange }) {
  const rows = specToRows(spec);

  function updatePlayer(role, idx, changes) {
    const current = parseCode(spec[role][idx]);
    const { role: nextRole = role, ...mods } = changes;
    const next = { ...current, ...mods };
    const nextCode = buildCode(next);
    const nextSpec =
      nextRole === role
        ? replacePlayer(spec, role, idx, nextCode)
        : movePlayer(spec, role, idx, nextRole, nextCode);
    onSpecChange(nextSpec);
  }

  return (
    <table className="formation-grid">
      <thead>
        <tr>
          <th>Position</th>
          <th>Depth</th>
          <th>Width</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ id, role, idx, depth, width }) => (
          <tr key={id} style={{ background: ROLE_COLORS[role] }}>
            <td>
              {role === 'keeper' ? (
                ROLE_NAMES[role]
              ) : (
                <select
                  value={role}
                  onChange={(e) =>
                    updatePlayer(role, idx, { role: e.target.value })
                  }
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {ROLE_NAMES[opt]}
                    </option>
                  ))}
                </select>
              )}
            </td>
            <td>
              {role === 'keeper' ? (
                ''
              ) : (
                <select
                  value={depth}
                  onChange={(e) =>
                    updatePlayer(role, idx, { depth: e.target.value })
                  }
                >
                  {DEPTH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {DEPTH_NAMES[opt]}
                    </option>
                  ))}
                </select>
              )}
            </td>
            <td>
              {role === 'keeper' ? (
                ''
              ) : (
                <select
                  value={width}
                  onChange={(e) =>
                    updatePlayer(role, idx, { width: e.target.value })
                  }
                >
                  {WIDTH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {WIDTH_NAMES[opt]}
                    </option>
                  ))}
                </select>
              )}
            </td>
          </tr>
        ))}
      </tbody>
      <style jsx>{`
        /* Stretch to use available width on small screens */
        .formation-grid {
          width: 100%;
          max-width: 500px;
          margin: 1rem auto;
          border-collapse: collapse;
        }
        .formation-grid select {
          width: 100%;
        }
        th,
        td {
          border: 1px solid #ccc;
          padding: 0.25rem 0.5rem;
        }
      `}</style>
    </table>
  );
}
