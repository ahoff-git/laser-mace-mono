# Laser-Mace

Laser-Mace is my personal Swiss army knife of tools—a collection of utilities that I’ve found indispensable over the years. Instead of reinventing the wheel or endlessly copy-pasting code, I drop anything useful here for easy reuse. Whether it’s **Crono**, a sweet game loop manager to handle frame rates and control how often certain things run, **createLazyState**, a super convenient factory function for smart caching, or **PeerNet**, my favorite tool that takes the hassle out of creating peer-to-peer networks, Laser-Mace has it all.

## Features

### General Utilities

- **greetLaserMace()**: A simple function to greet you from the world of Laser-Mace.
  ```javascript
  console.log(greetLaserMace());
  // Output: "Hello from LaserMace!"
  ```

### Game Logic

- **Crono (ChronoTrigger)**: A game loop manager with FPS control.
  - `Start()`: Begin the game loop.
  - `Stop()`: Halt the loop.
  - `setLoop(loopFunction)`: Define the loop function.
  - `runAt(fpsTarget, callback)`: Run a callback at a specified FPS.
  - `CurrentFPS()`: Get the current frames per second.

### State Management

- **createLazyState(definitions)**: Efficiently manage state with caching strategies (e.g., "always", "once", "timed").

### Randomization

- **rng(low, high, decimals)**: Generate random numbers with optional decimal precision.
- **randomItem(collection)**: Pick a random item from an array.

### Logging

- **log(level, message, keywords, ...data)**: Advanced logging with log levels and keyword-based filters.
- Log levels:
  - `off`
  - `error`
  - `warning`
  - `debug`

### Storage

- **storage.save(key, value)**: Save data to `localStorage`.
- **storage.load(key, defaultValue)**: Load data from `localStorage` with a fallback.
- **storage.listKeys()**: List all keys in `localStorage`.

### Miscellaneous Utilities

- **sendRequest(url, payload, timeoutMs?)**: Make HTTP requests with JSON payloads. Timeout defaults to `5000` ms.
- **getKeyNameByValue(obj, value)**: Retrieve an object's key by its value.
- **attachOnClick(id, fn, params, callback)**: Bind functions to elements by their `id`.

## Installation

Laser-Mace is written in TypeScript and the sources need to be compiled before use.

```bash
pnpm install
pnpm build # or rely on `pnpm install` triggering `prepare`
```


The `dist/` directory is generated during the build and is excluded from git.

## Testing

Run the unit tests using [Jest](https://jestjs.io/), which is installed as a dev dependency.

```bash
pnpm install
pnpm test
```

## Usage

```javascript
import { greetLaserMace, Crono, createLazyState, rng } from 'laser-mace';

// Greet from Laser-Mace
console.log(greetLaserMace());

// Use Crono for a game loop
Crono.setLoop((time) => {
    console.log(`Game running at: ${Crono.CurrentFPS()} FPS`);
});
Crono.Start();

// Random number generator
console.log(rng(1, 100));

// Create and manage lazy state
const state = createLazyState({
    example: ["timed", () => Date.now(), 5000],
});
console.log(state.example);
```

## Contributing

Got a crazy idea? Open a PR and let’s build the Laser-Mace universe together.

## License

MIT – Go wild.

---

Laser-Mace: Because every project deserves a little fun and chaos.


