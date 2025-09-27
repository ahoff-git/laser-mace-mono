// --- Example Usage in a Game Project ---
import { Crono } from '../dist/';

let playerX = 0;
let frameCount = 0;

Crono.setLoop(() => {
   

    // Runs 60 times per second
    Crono.runAt(60, () => {
        playerX += 1;
        console.log(`Player X position: ${playerX}`);
    });

    // Runs 30 times per second
    Crono.runAt(30, () => {
        frameCount++;
        console.log(`Frame count: ${frameCount}`);
    });

    // This part runs as fast as possible
    console.log('Running game logic at max speed');

    // Log the current FPS
    console.log(`Current FPS: ${Crono.CurrentFPS()}`);
});

Crono.Start();