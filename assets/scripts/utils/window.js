import CollisionObject from "../classes/collision-object.js";
import MegaMan from "../classes/mega-man.js";

export default class Window {
    static top = 0;
    static bottom = 0;
    static left = 0;
    static right = 0;

    /**
     * Update the bounds for the Window as well as all objects in it to ensure collisions function correctly
     * 
     * TODO: Add the death animation here later
     * 
     * @param {number} collisionDistance
     * @param {MegaMan} megaMan 
     * @param {CollisionObject[]} collisionObjects
     */
    static resize(collisionDistance, megaMan = null, collisionObjects = []) {
        Window.top = 0;
        Window.bottom = window.innerHeight + scrollY - collisionDistance;
        Window.left = 0;
        Window.right = window.innerWidth + scrollX - collisionDistance;

        collisionObjects.forEach(object => object.updateBounds());

        // Apply gravity if originally standing on bottom that has moved
        if (megaMan !== null) {
            megaMan.updateBounds();

            if (!megaMan.spawned) return;

            if (Window.isOffScreen(megaMan.bounds)) {
                megaMan.die();
            } else {
                megaMan.grounded = false;
                megaMan.applyGravity(collisionObjects);
                megaMan.enableFalling();
            }
        }
    }

    /**
     * Check if bounds are past any of the Windows bounds
     * 
     * @param {DOMRect} bounds 
     * @returns {boolean}
     */
    static isOffScreen(bounds) {
        return bounds.left < Window.left || bounds.right > Window.right ||
            bounds.top < Window.top || bounds.bottom > Window.bottom;
    }
}