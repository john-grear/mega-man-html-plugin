import Bullet from './classes/bullet.js';
import MegaMan from './classes/mega-man.js';
import Time from './utils/time.js';
import './utils/event-handler.js';

const megaMan = new MegaMan();
const collisionObjects = [];

function gameLoop() {
    // Update delta time to be used in other classes
    Time.update();

    // Handle all functionality for Mega Man
    megaMan.update(collisionObjects);

    // Handle all bullet movement
    Bullet.list.forEach(bullet => {
        bullet.update();
    });

    requestAnimationFrame(gameLoop);
}

function findWalkableArea() {
    var groundTagElements = Array.from(document.getElementsByClassName('ground'));

    groundTagElements.forEach(ground => collisionObjects.push(ground.getBoundingClientRect()))
}

findWalkableArea();
gameLoop();