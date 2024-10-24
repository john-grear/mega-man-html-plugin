import Bullet from './classes/bullet.js';
import CollisionObject from './classes/collision-object.js';
import MegaMan from './classes/mega-man.js';
import Time from './utils/time.js';
import Window from './utils/window.js';
import './utils/event-handler.js';

export const megaMan = new MegaMan();
export const collisionObjects = [];

/**
 * Run the whole interactive every frame
 */
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

/**
 * Find all elements tagged as ground and adds them as CollisionObject's to an array
 * 
 * TODO: Change this later to default to all divs in document unless config section toggled
 */
function findCollisionObjects() {
    var groundTagElements = Array.from(document.getElementsByClassName('ground'));

    groundTagElements.forEach(element => collisionObjects.push(new CollisionObject(element)));
}

findCollisionObjects();

Window.resize(MegaMan.collisionDistance);

gameLoop();