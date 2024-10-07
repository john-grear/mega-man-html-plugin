import MegaMan from './mega-man.js';

const megaMan = new MegaMan();

let chargingInterval;

// Maintains keys being held down
const activeKeys = new Set();

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowRight':
        case 'd':
            // Unflip Mega Man when changing directions
            megaMan.element.classList.remove('flipped');
            break;
        case 'ArrowLeft':
        case 'a':
            // Flip Mega Man when changing directions
            megaMan.element.classList.add('flipped');
            break;
        case ' ':
            // If not already holding down space bar
            if (!activeKeys.has(' ')) {
                // Set interval to build up charge, triggering attack state when ready
                chargingInterval = setInterval(() => {
                    megaMan.buildUpCharge();
                }, 20);

                // Prevent multiple intervals
                activeKeys.add(event.key);
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case ' ':
            // Stop holding attack key and stop charging
            activeKeys.delete(event.key);

            // Stop charging interval
            clearInterval(chargingInterval);

            // Release an attack
            megaMan.attack();

            // Reset to idle animation shortly after attacking
            setTimeout(() => megaMan.resetAttackAnimations(), 250);
            break;
    }
});