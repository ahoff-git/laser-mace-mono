import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useMobileConsole } from '../lib/useMobileConsole';

// Import the greetLaserMace helper from the laser-mace package. This
// module will only resolve if the dependencies are installed from GitHub
// when running `pnpm install` locally.
import { greetLaserMace } from 'laser-mace';
import {
  randomCoord,
  randomSize,
  randomSpeed,
  randomCount,
  vecLength,
} from '../lib/utils';
import { createLaserMaceEngine } from '../lib/laserMaceEngine';
import { useSprinkler } from '../lib/sprinkler';

function NumberInput({
  label,
  value,
  onChange,
  disabled,
  checked,
  onToggle,
}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleBlur = (e) => {
    if (e.target.value === '') onChange('0');
  };

  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <input type="checkbox" checked={checked} onChange={onToggle} />
    </label>
  );
}

function PageHeader() {
  return (
    <header>
      <h1>Laser Mace</h1>
      <nav>
        <Link href="/landing">Landing</Link>
      </nav>
    </header>
  );
}

function FeaturesSection() {
  return (
    <section className="features">
      <h3>Features</h3>
      <ul>
        <li>Real-time simulation</li>
        <li>Extensible system</li>
        <li>Web-based interface</li>
      </ul>
    </section>
  );
}

function SpawnerControls({
  spawnOpts,
  makeUpdater,
  toggleRandom,
  spawnEntities,
}) {
  const axisInputs = ['x', 'y', 'z'];

  return (
    <section className="spawner">
      <h3>Spawn Options</h3>
      <div className="row">
        {axisInputs.map((axis) => {
          const randomKey = `from${axis.toUpperCase()}`;
          return (
            <NumberInput
              key={axis}
              label={`From ${axis.toUpperCase()}`}
              value={spawnOpts.from[axis]}
              disabled={spawnOpts.random[randomKey]}
              onChange={makeUpdater(['from', axis])}
              checked={spawnOpts.random[randomKey]}
              onToggle={() => toggleRandom(randomKey)}
            />
          );
        })}
      </div>
      <div className="row">
        <NumberInput
          label="To Y"
          value={spawnOpts.to.y}
          disabled={spawnOpts.random.toY}
          onChange={makeUpdater(['to', 'y'])}
          checked={spawnOpts.random.toY}
          onToggle={() => toggleRandom('toY')}
        />
      </div>
      <div className="row">
        <NumberInput
          label="Count"
          value={spawnOpts.count}
          disabled={spawnOpts.random.count}
          onChange={makeUpdater(['count'])}
          checked={spawnOpts.random.count}
          onToggle={() => toggleRandom('count')}
        />
        <NumberInput
          label="Size"
          value={spawnOpts.size}
          disabled={spawnOpts.random.size}
          onChange={makeUpdater(['size'])}
          checked={spawnOpts.random.size}
          onToggle={() => toggleRandom('size')}
        />
        <NumberInput
          label="Speed"
          value={spawnOpts.speed}
          disabled={spawnOpts.random.speed}
          onChange={makeUpdater(['speed'])}
          checked={spawnOpts.random.speed}
          onToggle={() => toggleRandom('speed')}
        />
      </div>
      <button onClick={spawnEntities}>Spawn</button>
    </section>
  );
}

function SprinklerControls({
  sprinklerOn,
  toggleSprinkler,
  sprinklerSliderValue,
  setSprinklerRate,
  flipRate,
  sprinklerRate,
  min,
  max,
}) {
  return (
    <section className="controls sprinkler">
      <h3>Sprinkler</h3>
      <div className="row">
        <label>
          <input type="checkbox" checked={sprinklerOn} onChange={toggleSprinkler} />
          On
        </label>
        <label>
          Rate
          <input
            type="range"
            min={min}
            max={max}
            step="100"
            value={sprinklerSliderValue}
            onChange={(e) => setSprinklerRate(flipRate(Number(e.target.value)))}
          />
        </label>
        <span>{(sprinklerRate / 1000).toFixed(1)}s</span>
      </div>
    </section>
  );
}

function CameraControls({
  zoom,
  zoomIn,
  zoomOut,
  orbitCamera,
  stopOrbit,
  clearMovingEntities,
}) {
  return (
    <section className="controls">
      <div className="row">
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={zoomOut}>Zoom Out</button>
      </div>
      <div className="row">
        <button onClick={orbitCamera}>Orbit Camera</button>
        <button onClick={stopOrbit}>Stop Orbit</button>
      </div>
      <button onClick={clearMovingEntities}>Clear Moving Entities</button>
      <p className="zoom-label">Zoom: {zoom.toFixed(2)}</p>
    </section>
  );
}

function EntityTable({ entitiesData }) {
  return (
    <table className="entity-table">
      <thead>
        <tr>
          <th>Entity</th>
          <th>Position</th>
          <th>Velocity</th>
        </tr>
      </thead>
      <tbody>
        {entitiesData.map((e, idx) => (
          <tr key={e.id ?? idx}>
            <td>{e.id ?? idx}</td>
            <td>
              {e.position
                ? `${e.position.x.toFixed(2)}, ${e.position.y.toFixed(2)}, ${e.position.z.toFixed(2)}`
                : ''}
            </td>
            <td>
              {e.velocity
                ? `${e.velocity.x.toFixed(2)}, ${e.velocity.y.toFixed(2)}, ${e.velocity.z.toFixed(2)}`
                : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EventLog({ events }) {
  return (
    <div className="event-box">
      <h3>Events</h3>
      <ul>
        {events.slice(-10).map((e, idx) => (
          <li key={idx}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LandingPage() {
  useMobileConsole(); // Debug console on mobile
  const [greeting, setGreeting] = useState('');
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const startedRef = useRef(false);
  const [entitiesData, setEntitiesData] = useState([]);
  const [events, setEvents] = useState([]);
  const [zoom, setZoom] = useState(200);
  const BOUNDARY_RANGE = 80;
  const LANDMARK_SPACING = 40;

  const {
    on: sprinklerOn,
    toggle: toggleSprinkler,
    rate: sprinklerRate,
    changeRate: setSprinklerRate,
  } = useSprinkler(engineRef, BOUNDARY_RANGE);

  const SPRINKLER_MIN = 100;
  const SPRINKLER_MAX = 2000;
  const flipRate = (v) => SPRINKLER_MIN + SPRINKLER_MAX - v; // right = more spawns
  const sprinklerSliderValue = flipRate(sprinklerRate);


  const randCoord = () => randomCoord(BOUNDARY_RANGE);

  const [spawnOpts, setSpawnOpts] = useState(() => ({
    from: { x: randCoord(), y: -BOUNDARY_RANGE + 5, z: randCoord() },
    to: { y: BOUNDARY_RANGE },
    count: 50,
    size: randomSize(),
    speed: 80,
    random: {
      fromX: true,
      fromY: false,
      fromZ: true,
      toY: false,
      count: false,
      size: true,
      speed: false,
    },
  }));

  const updateSpawnOpt = (path, value) => {
    setSpawnOpts((prev) => {
      const next = { ...prev };
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) {
        obj[path[i]] = { ...obj[path[i]] };
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const makeUpdater = (path) => (val) => updateSpawnOpt(path, val);

  const toggleRandom = (field) => {
    updateSpawnOpt(['random', field], !spawnOpts.random[field]);
  };


  // Set up the engine once the component mounts.
  useEffect(() => {
    if (startedRef.current) return; // avoid StrictMode double-mount in dev
    if (!canvasRef.current) return;
    startedRef.current = true;

    const engine = createLaserMaceEngine({
      canvas: canvasRef.current,
      boundary: BOUNDARY_RANGE,
      landmarkSpacing: LANDMARK_SPACING,
      onEvent: (msg) => setEvents((ev) => [...ev, msg]),
      onUpdate: (data) => setEntitiesData(data),
    });

    engineRef.current = engine;

    const camera = engine.renderSystem?.camera;
    if (camera) {
      camera.position.z = zoom;
      setZoom(vecLength(camera.position));
    }

    engine.start();

    return () => {
      try { engine.stop(); } catch {}
      engineRef.current = null;
      startedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const message = greetLaserMace();
      setGreeting(message);
      console.log('greetLaserMace:', message);
    } catch (err) {
      console.error('Failed to call greetLaserMace', err);
    }
  }, []);


  const spawnEntities = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const opts = spawnOpts;
    const count = opts.random.count ? randomCount() : Number(opts.count) || 1;
    for (let i = 0; i < count; i++) {
      const from = {
        x: opts.random.fromX ? randCoord() : Number(opts.from.x) || 0,
        y: opts.random.fromY ? randCoord() : Number(opts.from.y) || 0,
        z: opts.random.fromZ ? randCoord() : Number(opts.from.z) || 0,
      };
      const targetY = opts.random.toY ? randCoord() : Number(opts.to.y) || 0;
      const size = opts.random.size ? randomSize() : Number(opts.size) || 1;
      const speed = opts.random.speed ? randomSpeed() : Number(opts.speed) || 0;
      const dirY = targetY - from.y;
      const vel = { x: 0, y: (dirY >= 0 ? 1 : -1) * speed, z: 0 };
      engine.spawn({ from, velocity: vel, size });
    }
  };

  const clearMovingEntities = () => {
    engineRef.current?.clearMoving();
  };

  const adjustZoom = (delta) => {
    const newDist = engineRef.current?.adjustZoom(delta);
    if (newDist) setZoom(newDist);
  };

  const zoomIn = () => {
    const newDist = engineRef.current?.zoomIn();
    if (newDist) setZoom(newDist);
  };

  const zoomOut = () => {
    const newDist = engineRef.current?.zoomOut();
    if (newDist) setZoom(newDist);
  };

  const orbitCamera = () => {
    engineRef.current?.orbitCamera();
  };

  const stopOrbit = () => {
    engineRef.current?.stopOrbit();
  };

  return (
    <div className="container">
      <Head>
        <title>Laser Mace Landing</title>
        <meta
          name="description"
          content="Placeholder landing page for the Laser Mace project"
        />
      </Head>
      <header>
        <h1>Laser Mace</h1>
        <nav>
          <Link href="/landing">Landing</Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <h2>Welcome to Laser Mace</h2>
          <p>The ultimate test bed for our upcoming project.</p>
        </section>
        <section className="features">
          <h3>Features</h3>
          <ul>
            <li>Real-time simulation</li>
            <li>Extensible system</li>
            <li>Web-based interface</li>
          </ul>
        </section>
        {/* Canvas where the engine will render a simple cube */}
        <canvas ref={canvasRef} width={300} height={300} />
        <section className="spawner">
          <h3>Spawn Options</h3>
          <div className="row">
            {['x', 'y', 'z'].map((a) => (
              <NumberInput
                key={a}
                label={`From ${a.toUpperCase()}`}
                value={spawnOpts.from[a]}
                disabled={spawnOpts.random[`from${a.toUpperCase()}`]}
                onChange={makeUpdater(['from', a])}
                checked={spawnOpts.random[`from${a.toUpperCase()}`]}
                onToggle={() => toggleRandom(`from${a.toUpperCase()}`)}
              />
            ))}
          </div>
          <div className="row">
            <NumberInput
              label="To Y"
              value={spawnOpts.to.y}
              disabled={spawnOpts.random.toY}
              onChange={makeUpdater(['to', 'y'])}
              checked={spawnOpts.random.toY}
              onToggle={() => toggleRandom('toY')}
            />
          </div>
          <div className="row">
            <NumberInput
              label="Count"
              value={spawnOpts.count}
              disabled={spawnOpts.random.count}
              onChange={makeUpdater(['count'])}
              checked={spawnOpts.random.count}
              onToggle={() => toggleRandom('count')}
            />
            <NumberInput
              label="Size"
              value={spawnOpts.size}
              disabled={spawnOpts.random.size}
              onChange={makeUpdater(['size'])}
              checked={spawnOpts.random.size}
              onToggle={() => toggleRandom('size')}
            />
            <NumberInput
              label="Speed"
              value={spawnOpts.speed}
              disabled={spawnOpts.random.speed}
              onChange={makeUpdater(['speed'])}
              checked={spawnOpts.random.speed}
              onToggle={() => toggleRandom('speed')}
            />
          </div>
          <button onClick={spawnEntities}>Spawn</button>
        </section>
        <section className="controls sprinkler">
          <h3>Sprinkler</h3>
          <div className="row">
            <label>
              <input type="checkbox" checked={sprinklerOn} onChange={toggleSprinkler} />
              On
            </label>
            <label>
              Rate
              <input
                type="range"
                min={SPRINKLER_MIN}
                max={SPRINKLER_MAX}
                step="100"
                value={sprinklerSliderValue}
                onChange={(e) =>
                  setSprinklerRate(flipRate(Number(e.target.value)))
                }
              />
            </label>
            <span>{(sprinklerRate / 1000).toFixed(1)}s</span>
          </div>
        </section>
        <section className="controls">
          <div className="row">
            <button onClick={zoomIn}>Zoom In</button>
            <button onClick={zoomOut}>Zoom Out</button>
          </div>
          <div className="row">
            <button onClick={orbitCamera}>Orbit Camera</button>
            <button onClick={stopOrbit}>Stop Orbit</button>
          </div>
          <button onClick={clearMovingEntities}>Clear Moving Entities</button>
          <p className="zoom-label">Zoom: {zoom.toFixed(2)}</p>
        </section>
        <table className="entity-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Position</th>
              <th>Velocity</th>
            </tr>
          </thead>
          <tbody>
            {entitiesData.map((e, idx) => (
              <tr key={idx}>
                <td>{e.id ?? idx}</td>
                <td>
                  {e.position
                    ? `${e.position.x.toFixed(2)}, ${e.position.y.toFixed(2)}, ${e.position.z.toFixed(2)}`
                    : ''}
                </td>
                <td>
                  {e.velocity
                    ? `${e.velocity.x.toFixed(2)}, ${e.velocity.y.toFixed(2)}, ${e.velocity.z.toFixed(2)}`
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="event-box">
          <h3>Events</h3>
          <ul>
            {events.slice(-10).map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
        {greeting && <p className="greeting">{greeting}</p>}
      </main>
      <footer>
        &copy; {new Date().getFullYear()} Laser Mace
      </footer>
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 1rem;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        header {
          margin-top: 0;
        }
        header nav a {
          color: #0070f3;
          text-decoration: underline;
        }
        main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero {
          margin: 2rem 0;
        }
        .features ul {
          list-style: none;
          padding: 0;
        }
        canvas {
          border: 1px solid #ccc;
          margin: 1rem 0;
        }
        .controls {
          margin: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }
        .controls .row {
          display: flex;
          gap: 0.5rem;
        }
        .controls button {
          margin: 0;
        }
        .controls input[type='number'] {
          width: 80px;
        }
        .spawner {
          margin: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .spawner .row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .spawner label {
          display: flex;
          flex-direction: column;
          font-size: 0.8rem;
          align-items: center;
        }
        .spawner input[type='number'] {
          width: 60px;
        }
        .entity-table {
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .entity-table th,
        .entity-table td {
          border: 1px solid #ccc;
          padding: 0.25rem 0.5rem;
        }
        .event-box {
          border: 1px solid #ccc;
          margin-top: 1rem;
          padding: 0.5rem;
          width: 300px;
          max-height: 150px;
          overflow-y: auto;
          text-align: left;
        }
        .zoom-label {
          margin-top: 0.5rem;
        }
        footer {
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
