import MegaMan from './classes/mega-man.js';
import Time from './utils/time.js';
import './utils/event-handler.js';

const megaMan = new MegaMan();

function gameLoop() {
    // Update delta time to be used in other classes
    Time.update();

    // Handle all functionality for Mega Man       
    megaMan.update();

    // For each bullet in Bullet.list, call update()

    requestAnimationFrame(gameLoop);
}

gameLoop();