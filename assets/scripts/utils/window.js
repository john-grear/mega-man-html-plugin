import CollisionObject from "../classes/collision-object.js";
import MegaMan from "../classes/mega-man.js";

export default class Window {
    static top = 0;
    static bottom = 0;
    static left = 0;
    static right = 0;

    /**
     * Updates the bounds for the Window as well as all objects in it to ensure collisions function correctly
     * 
     * TODO: Add the death animation here later
     * 
     * @param {number} collisionDistance
     * @param {MegaMan} megaMan 
     * @param {CollisionObject[]} collisionObjects
     */
    static resize(collisionDistance, megaMan = null, collisionObjects = []) {
        megaMan?.updateBounds();
        collisionObjects.forEach(object => object.updateBounds());
        
        Window.top = 0;
        Window.bottom = window.innerHeight + scrollY - collisionDistance;
        Window.left = 0;
        Window.right = window.innerWidth + scrollX - collisionDistance;

        // Apply gravity if originally standing on bottom that has moved
        if (megaMan !== null) {
            megaMan.grounded = false;
            megaMan.applyGravity(collisionObjects);
            megaMan.enableFalling();
        }
    }
}