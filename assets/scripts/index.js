import MegaMan from './mega-man.js';

const megaMan = new MegaMan();

// Maintains keys being held down
const activeKeys = new Set();

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
            // If holding down opposite direction, stop
            // Otherwise start walking left
            if (activeKeys.has('ArrowRight')) {
                megaMan.stopWalking();
            } else {
                activeKeys.add('ArrowLeft');
                megaMan.startWalking(-1);
            }
            break;
        case 'ArrowRight':
        case 'd':
            // If holding down opposite direction, stop
            // Otherwise start walking right
            if (activeKeys.has('ArrowLeft')) {
                megaMan.stopWalking();
            } else {
                activeKeys.add('ArrowRight');
                megaMan.startWalking(1);
            }
            break;
        case ' ':
            // If not already holding down space bar
            if (!activeKeys.has(' ')) {
                megaMan.startCharging();

                // Prevent multiple intervals
                activeKeys.add(event.key);
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
            // Stop holding left arrow key
            activeKeys.delete('ArrowLeft');
            
            // Continue walking right if that is still being held down
            if (!activeKeys.has('ArrowRight')) {
                megaMan.stopWalking();
            } else {
                megaMan.startWalking(1);
            }
            break;
        case 'ArrowRight':
        case 'd':
            // Stop holding right arrow key
            activeKeys.delete('ArrowRight');

            // Continue walking left if that is still being held down
            if (!activeKeys.has('ArrowLeft')) {
                megaMan.stopWalking();
            } else {
                megaMan.startWalking(-1);
            }
            break;
        case ' ':
            // Stop holding attack key and stop charging
            activeKeys.delete(event.key);

            // Release an attack
            megaMan.attack();

            // Reset to idle animation shortly after attacking
            setTimeout(() => megaMan.resetAttackAnimations(), 250);
            break;
    }
});