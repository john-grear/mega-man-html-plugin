// Maintains keys being held down
export const activeKeys = {
    w: false, // Jump will be added later
    a: false, // Move left
    d: false, // Move Right
    space: false, // Attack
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            activeKeys.w = true;
            break;
        case 'ArrowLeft':
        case 'a':
            activeKeys.a = true;
            break;
        case 'ArrowRight':
        case 'd':
            activeKeys.d = true;
            break;
        case ' ':
            activeKeys.space = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            activeKeys.w = false;
            break;
        case 'ArrowLeft':
        case 'a':
            activeKeys.a = false;
            break;
        case 'ArrowRight':
        case 'd':
            activeKeys.d = false;
            break;
        case ' ':
            activeKeys.space = false;
            break;
    }
});
