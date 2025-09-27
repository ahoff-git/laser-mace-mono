// ChronoTrigger Library (CT) using Factory Functions with FPS Tracking
import { log, logLevels } from './logging';
import { createRollingAverage } from './math';

interface ChronoTrigger {
    Start: () => void;
    Stop: () => void;
    setLoop: (loopFunction: (time: number) => void) => void;
    runAt: (fps: number, callback: () => void) => void;
    CurrentFPS: () => number;
    AverageFPS: () => number;
}

function createChronoTrigger(): ChronoTrigger {
    const lastRunTimes: Map<number, number> = new Map();
    let loop: ((time: number) => void) | null = null;
    let running = false;
    let fps = 0; // Tracks the current running FPS
    const fpsHist = createRollingAverage(100);
    let lastFrameTime = 0;

    const Start = (): void => {
        if (typeof loop !== "function") {
            throw new Error("CT.Loop must be defined before calling CT.Start()");
        }
        running = true;
        const frame = (time: number): void => {
            if (running) {
                if (lastFrameTime > 0) {
                    const delta = time - lastFrameTime;
                    // using Math.max to avoid divide by 0
                    const newFps = Math.round(1000 / Math.max(delta,1));
                    fps = newFps!= 1000? newFps: fps;
                    fpsHist.add(fps);
                }
                lastFrameTime = time;

                loop!(time);
                requestAnimationFrame(frame);
            }
        };
        requestAnimationFrame(frame);
    };

    const Stop = (): void => {
        running = false;
    };

    const setLoop = (loopFunction: (time: number) => void): void => {
        loop = loopFunction;
    };

    const runAt = (fpsTarget: number, callback: () => void): void => {
        if (!lastRunTimes.has(fpsTarget)) {
            lastRunTimes.set(fpsTarget, 0);
        }
        const now = performance.now();
        const interval = 1000 / fpsTarget; // Milliseconds per frame

        if (fpsTarget > fps && fps > 0) {
            log(logLevels.warning, `Requested FPS (${fpsTarget}) exceeds current game FPS (${fps}). Performance may degrade.`, ["runAt, Crono"]);
        }

        if (now - (lastRunTimes.get(fpsTarget) || 0) >= interval) {
            lastRunTimes.set(fpsTarget, now);
            callback();
        }
    };

    const CurrentFPS = (): number => fps;
    const AverageFPS = (): number => Math.round(fpsHist.getAverage());

    return { Start, Stop, setLoop, runAt, CurrentFPS, AverageFPS};
}

// Exporting the library
export const Crono = createChronoTrigger();