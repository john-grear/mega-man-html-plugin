// Maintains keys being held down
export const activeKeys = {
    w: false, // Jump will be added later
    a: false, // Move left
    d: false, // Move Right
    space: false, // Attack
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
            activeKeys.a = true;
            // If holding down opposite direction, stop
            // Otherwise start walking left
            // if (activeKeys.has('ArrowRight')) {
            //     megaMan.stopWalking();
            // } else {
            //     activeKeys.add('ArrowLeft');
            //     megaMan.startWalking(-1);
            // }
            break;
        case 'ArrowRight':
        case 'd':
            activeKeys.d = true;
            // If holding down opposite direction, stop
            // Otherwise start walking right
            // if (activeKeys.has('ArrowLeft')) {
            //     megaMan.stopWalking();
            // } else {
            //     activeKeys.add('ArrowRight');
            //     megaMan.startWalking(1);
            // }
            break;
        case ' ':
            activeKeys.space = true;
            // If not already holding down space bar
            // if (!activeKeys.has(' ')) {
            //     megaMan.startCharging();

            //     // Prevent multiple intervals
            //     activeKeys.add(event.key);
            // }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
            activeKeys.a = false;
            // Stop holding left arrow key
            // activeKeys.delete('ArrowLeft');

            // Continue walking right if that is still being held down
            // if (!activeKeys.has('ArrowRight')) {
            //     megaMan.stopWalking();
            // } else {
            //     megaMan.startWalking(1);
            // }
            break;
        case 'ArrowRight':
        case 'd':
            activeKeys.d = false;
            // Stop holding right arrow key
            // activeKeys.delete('ArrowRight');

            // Continue walking left if that is still being held down
            // if (!activeKeys.has('ArrowLeft')) {
            //     megaMan.stopWalking();
            // } else {
            //     megaMan.startWalking(-1);
            // }
            break;
        case ' ':
            activeKeys.space = false;
            // Stop holding attack key and stop charging
            // activeKeys.delete(event.key);

            // Release an attack
            // megaMan.attack();

            // Reset to idle animation shortly after attacking
            // setTimeout(() => megaMan.resetAttackAnimations(), 250);
            break;
    }
});
