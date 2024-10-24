import Bullet from './bullet.js';
import CollisionObject from './collision-object.js';
import MegaManAnimation from './mega-man-animation.js';
import Time from '../utils/time.js';
import Window from '../utils/window.js';
import { activeKeys } from '../utils/event-handler.js';

export default class MegaMan {
    // Spawn related variables
    spawned = false;

    static spawnSpeed = 15;

    // Walk related variables
    direction = 1;

    static walkingSpeed = 500;

    // Jump related variables
    jumpButtonReleased = false;
    jumping = false;
    jumpTime = 0; // Time (ms) since jump button was first held down
    grounded = false;

    static jumpingSpeed = 650;
    static jumpTimeLimit = 300;
    static gravity = 900;

    // Charge related variables
    chargeInterval = 0;
    charge = 0; // Time (ms) since attack button was first held down
    charging = false;

    static minChargeValue = 250;
    static lowChargeValue = 500;
    static maxChargeValue = 1000;
    static chargeIntervalRate = 20 / 1000; // Time (ms) to transition to next charge frame
    static chargeRate = 2250; // Rate x deltaTime = how much charge to give per frame

    // Collision related variables
    static collisionDistance = 10;

    constructor() {
        // TODO: Initiate spawn in animation
        this.element = document.querySelector('.mega-man');
        this.animationController = new MegaManAnimation(this.element);

        // Used to offset horizontal position
        const rect = this.element.getBoundingClientRect();
        this.origin = {
            x: window.scrollX + rect.left,
            y: window.scrollY - rect.top,
        }

        // Tracks position in local context to update CSS positionX and positionY
        // Used for visual position, not collisions
        this.coords = {
            x: this.origin.x,
            y: this.origin.y * 2,
        };

        this.updateBounds();
        this.animationController.updateVisibility();
        this.spawn();
    }

    /**
     * Move Mega Man in spawn noodle animation down until they reach spawn area,
     * then update the spawn animation until time is up, and disable spawn animation
     */
    spawn() {
        if (this.coords.y < 0) {
            // Drop into place
            this.updateVerticalBounds(MegaMan.spawnSpeed);
            requestAnimationFrame(() => this.spawn());
        } else if (this.coords.y + MegaMan.spawnSpeed > 0) {
            // Adjust position to 0
            this.updateVerticalBounds(-this.coords.y);

            // Update spawn animation
            if (!this.animationController.updateSpawn()) {
                requestAnimationFrame(() => this.spawn());
            } else {
                // Spawn animation finished
                this.animationController.updateSpawn(true);
                this.spawned = true;
                this.updateBounds();
            }
        }
    }

    /**
     * Main control function that runs every frame to handle all functionality
     * 
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     */
    update(collisionObjects = []) {
        // Check spawned
        if (!this.spawned) return;

        // Walk
        this.walk(collisionObjects);

        // Slide TODO

        // Jump
        this.jump(collisionObjects);

        // Apply gravity
        this.applyGravity(collisionObjects);

        // Charge
        this.buildUpCharge();
    }

    /**
     * Walk left or right, check for collisions, and update direction, horizontal position, and animation
     * 
     * Variables update translate call in mega-man.css
     * 
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     */
    walk(collisionObjects) {
        const leftPressed = activeKeys.a;
        const rightPressed = activeKeys.d;
        // Don't move if not pressing arrow keys or if both are pressed
        if ((!leftPressed && !rightPressed) || (leftPressed && rightPressed)) {
            this.animationController.updateWalk(true);
            return;
        }

        this.direction = leftPressed ? -1 : 1;
        this.animationController.updateDirection(this.direction);

        this.animationController.updateWalk();

        if (this.checkHorizontalCollision(collisionObjects)) return;

        // Update bounds after walking one frame
        const velocity = MegaMan.walkingSpeed * this.direction * Time.deltaTime;
        this.updateHorizontalBounds(velocity);

        // Update X position on screen, offset by the parent origin X coordinate
        this.animationController.updateX(this.coords.x - this.origin.x);

        // Check in air and not jumping to enable falling
        if (!this.jumping && !this.checkOnGround(collisionObjects)) this.enableFalling(true);
    }

    /**
     * Update x-coordinate for positioning and horizontal bounds for collision detection
     * 
     * @param {int} deltaX
     */
    updateHorizontalBounds(deltaX) {
        this.coords.x += deltaX;
        this.bounds.left += deltaX;
        this.bounds.right += deltaX;

        // Offset position by parent origin x-coordinate
        this.animationController.updateX(this.coords.x - this.origin.x);
    }

    /**
     * Jump, check for collisions, and update vertical position and animation. Jump can only last as long
     * as jumpTimeLimit and must be on the ground to initiate, obviously
     * 
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     */
    jump(collisionObjects) {
        if (!activeKeys.w) {
            if (this.jumping) {
                this.jumping = false;
            }

            this.jumpButtonReleased = true;
            return;
        }

        // First frame of jumping
        if (!this.jumping && this.jumpButtonReleased && this.grounded) this.enableJumping();

        // Don't continue jumping if not jumping and not on the ground
        if (!this.jumping && !this.grounded) return;

        // Check ceiling above Mega Man or jump time past limit and stop jumping accordingly
        if (this.checkHitCeiling(collisionObjects) || this.jumpTime >= MegaMan.jumpTimeLimit) {
            this.jumping = false;
            return;
        }

        // Calculate velocity for one frame
        const velocity = MegaMan.jumpingSpeed * Time.deltaTime;

        // Increment time to stop jumping too far
        this.jumpTime += velocity;

        // Update position variable to translate in CSS
        this.updateVerticalBounds(-velocity);

        // In air = no longer grounded
        this.grounded = false;
    }

    /**
     * Set jump conditions and animation
     */
    enableJumping() {
        this.enableFalling();

        this.jumping = true;
        this.jumpButtonReleased = false;
    }

    /**
     * Set fall conditions and animation
     */
    enableFalling() {
        this.animationController.updateWalk(true);
        this.animationController.updateAttack(true);

        this.grounded = false;
        this.animationController.updateJump();
    }

    /**
     * Fall until ground is reached
     * 
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     */
    applyGravity(collisionObjects) {
        // Check not jumping or grounded
        if (this.jumping || this.grounded) return;

        // Check collision with ground
        if (this.checkOnGround(collisionObjects)) return;

        // Calculate velocity and update y coordinate to move downwards
        const velocity = MegaMan.gravity * Time.deltaTime;
        this.updateVerticalBounds(velocity);
    }

    /**
     * Reset grounded conditions and disable jump animation
     */
    disableGravity() {
        this.jumping = false;
        this.grounded = true;
        this.jumpTime = 0;
        this.animationController.updateJump(true);
    }

    /**
     * Check for collisions either the edges of the window or any of the collisionObjects by
     * calculating the distance to each, ensuring they are within the collidable bounds, and
     * that Mega Man is moving towards them to prevent sticking to walls after colliding
     *  
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     * @returns {boolean}
     */
    checkHorizontalCollision(collisionObjects) {
        // Check collision with left or right edge of page
        const leftDistance = Math.abs(Window.left - this.bounds.left);
        const rightDistance = Math.abs(Window.right - this.bounds.right);
        if ((leftDistance <= MegaMan.collisionDistance && this.direction == -1) ||
            (rightDistance <= MegaMan.collisionDistance && this.direction == 1)) return true;

        // Check all possible collision objects
        for (const object of collisionObjects) {
            // Check not within y bounds of object
            if (this.checkObjectWithinYBounds(object)) continue;

            // Check close enough to collide with
            const leftDistance = Math.abs(object.right - this.bounds.left);
            const rightDistance = Math.abs(object.left - this.bounds.right);
            if ((leftDistance > MegaMan.collisionDistance && this.direction == -1) ||
                (rightDistance > MegaMan.collisionDistance && this.direction == 1)) continue;

            return true;
        }

        return false;
    }

    /**
     * Check for collisions either the top of the window or any of the collisionObjects by
     * calculating the distance to each and ensuring they are within the collidable bounds
     *  
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     * @returns {boolean}
     */
    checkHitCeiling(collisionObjects) {
        // Check hit ceiling on top of page
        const distance = Math.abs(Window.top - this.bounds.top);
        if (distance <= MegaMan.collisionDistance) return true;

        // Check all possible ceiling objects
        for (const object of collisionObjects) {
            // Check Mega Man above the object
            if (this.bounds.bottom < object.bottom) continue;

            // Check not within x bounds of object
            if (this.checkWithinHorizontalBounds(object)) continue;

            // Check close enough to collide with
            const distance = Math.abs(object.bottom - this.bounds.top);
            if (distance > MegaMan.collisionDistance) continue;

            return true;
        }

        return false;
    }

    /**
     * Check for collisions either the bottom of the window or any of the collisionObjects by
     * calculating the distance to each and ensuring they are within the collidable bounds
     *  
     * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
     * @returns {boolean}
     */
    checkOnGround(collisionObjects) {
        // Check on ground at bottom of page
        const distance = Math.abs(Window.bottom - this.bounds.bottom);
        if (distance <= MegaMan.collisionDistance) {
            this.disableGravity();

            this.updateVerticalBounds(distance);
            return true;
        }

        // Check all possible ground objects
        for (const object of collisionObjects) {
            // Check Mega Man below the object
            if (this.bounds.bottom > object.top) continue;

            // Check not within x bounds of object
            if (this.checkWithinHorizontalBounds(object)) continue;

            // Check close enough to collide with
            const distance = Math.abs(object.top - this.bounds.bottom);
            if (distance > MegaMan.collisionDistance) continue;

            this.disableGravity();

            this.updateVerticalBounds(distance);

            return true;
        }

        return false;
    }

    /**
     * Check if the given object is within the horizontal bounds of Mega Man
     * 
     * @param {DOMRect} object - Bounding rectangle of the object to check
     * @returns {boolean} - True if the object is within Mega Man's X bounds, false otherwise.
     */
    checkWithinHorizontalBounds(object) {
        const left = this.bounds.left + MegaMan.collisionDistance;
        const right = this.bounds.right - MegaMan.collisionDistance;
        return (right < object.left || left > object.right) && (left < object.right || right > object.left);
    }

    /**
     * Check if the given object is within the vertical bounds of Mega Man
     * 
     * @param {DOMRect} object - Bounding rectangle of the object to check
     * @returns {boolean} - True if the object is within Mega Man's Y bounds, false otherwise.
     */
    checkObjectWithinYBounds(object) {
        const top = this.bounds.top + MegaMan.collisionDistance;
        const bottom = this.bounds.bottom - MegaMan.collisionDistance;
        return (top < object.bottom || bottom > object.top) && (bottom < object.top || top > object.bottom);
    }

    /**
     * Update the y-coordinate as well as the top and bottom bounds to use in collision detection
     * 
     * @param {int} deltaY 
     */
    updateVerticalBounds(deltaY) {
        this.coords.y += deltaY;
        this.bounds.top += deltaY;
        this.bounds.bottom += deltaY;

        this.animationController.updateY(this.coords.y);
    }

    /**
     * Update attack animation, shoot a bullet, and reset charge to prevent multiple charged shots
     */
    attack(force = false) {
        // Stop charging
        this.charging = force;

        // Allow shot before charge, but don't shoot two in succession unless charge past minimum
        if (this.charge < MegaMan.minChargeValue && !force) return;

        this.animationController.updateAttack();

        // Spawn bullet
        new Bullet(this.charge, this.direction, this.element.getBoundingClientRect());

        this.charge = 0;
    }

    /**
     * Increment charge for Mega Man based on the duration of the attack button being held down.
     * Update charge animation based on charge value every time chargeInterval passes the rate
     */
    buildUpCharge() {
        if (!activeKeys.space) {
            if (this.charging) this.attack();
            return;
        }

        // Always do initial attack with no charge
        if (!this.charging) this.attack(true);

        // Enable charging
        this.charging = true;

        // Increment interval by deltaTime
        const deltaTime = Time.deltaTime;
        this.chargeInterval += deltaTime;

        // Wait until charge rate has been reached to update animation
        if (this.chargeInterval < MegaMan.chargeIntervalRate) return;

        // Reset interval
        this.chargeInterval = 0;

        // Increment charge per frame
        this.charge += MegaMan.chargeRate * deltaTime;

        this.animationController.updateCharge(this.charge);
    }

    /**
     * Update position in global context for use with collisions
     * 
     * Only to be used during resize event and constructor to prevent constant refresh of the document
     */
    updateBounds() {
        const rect = this.element.getBoundingClientRect();
        this.bounds = {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
        };
    }
}
