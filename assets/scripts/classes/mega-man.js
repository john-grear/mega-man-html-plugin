import Bullet from './bullet.js';
import Time from '../utils/time.js';
import Window from '../utils/window.js';
import { activeKeys } from '../utils/event-handler.js';

export default class MegaMan {
    // Walk related variables
    walking = false;
    walkingState = 0;
    direction = 1;

    static walkingSpeed = 500;

    // Jump related variables
    jumpButtonReleased = false;
    jumping = false;
    jumpTime = 0; // Time (ms) since jump button was first held down
    grounded = false;
    canJump = false;

    static jumpingSpeed = 650;
    static jumpTimeLimit = 300;
    static gravity = 900;

    // Charge related variables
    chargeInterval = 0;
    charge = 0; // Time (ms) since attack button was first held down
    charging = false;
    chargeState = 0;

    static minChargeValue = 250;
    static lowChargeValue = 500;
    static maxChargeValue = 1000;
    static chargeAnimationIntervalRate = 20 / 1000; // Time (ms) to transition to next charge frame
    static chargeRate = 2250; // Rate x deltaTime = how much charge to give per frame

    // Collision related variables
    static collisionDistance = 10;

    constructor() {
        // TODO: Initiate spawn in animation, then enable walking and charging state
        this.element = document.querySelector('.mega-man');
        this.element.classList.add('walking-and-charging-state');

        // Used to offset horizontal position
        const rect = this.element.getBoundingClientRect();
        this.origin = {
            x: window.scrollX + rect.left,
            y: window.scrollY + rect.top, // Unused at this time
        }

        // Tracks position in local context to update CSS positionX and positionY
        // Used for visual position, not collisions
        this.coords = {
            x: this.origin.x,
            y: 0,
        };

        this.updateBounds();
    }

    /**
     * Main control function that runs every frame to handle all functionality of Mega Man
     * 
     * @param {any[]} [collisionObjects=[]] - Objects to detect walking, jumping, or falling collisions
     */
    update(collisionObjects = []) {
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
     * Walks left or right if not going to be out of bounds, updating the direction, positionX,
     * and walkingState for the animation of Mega Man
     * 
     * Variables update translate call in mega-man.css
     * 
     * @param {any[]} [collisionObjects]
     */
    walk(collisionObjects) {
        const leftPressed = activeKeys.a;
        const rightPressed = activeKeys.d;
        // Don't move if not pressing arrow keys or if both are pressed
        if ((!leftPressed && !rightPressed) || (leftPressed && rightPressed)) {
            if (this.walking) this.disableWalkingAnimation();
            return;
        }

        // Enable walking
        this.walking = true;

        // Update direction Mega Man is facing
        this.direction = leftPressed ? -1 : 1;
        this.element.style.setProperty('--direction', this.direction);

        // Don't enable walking animation while jumping or falling
        if (this.grounded) {
            // Increments walking state to next frame
            if (++this.walkingState >= 30) this.walkingState = 0;
            this.element.style.setProperty('--walking-state', Math.floor(this.walkingState / 10) + 1);
        }

        // Calculate velocity and new x coordinate after walking one frame
        const velocity = MegaMan.walkingSpeed * this.direction * Time.deltaTime;

        // Don't start walking if already at end of screen
        if (this.checkHorizontalCollision(collisionObjects)) return;

        // Update position variable
        this.updateHorizontalBounds(velocity);

        // Update positionX on screen, offset by the parent origin X coordinate
        this.element.style.setProperty('--positionX', `${this.coords.x - this.origin.x}px`);

        // Check ground beneath Mega Man after walking and enable gravity accordingly
        if (!this.jumping && !this.checkOnGround(collisionObjects)) this.enableFallingAnimation(true);
    }

    /**
     * Resets all walking conditions and states
     */
    disableWalkingAnimation() {
        this.walking = false;
        this.walkingState = 0;
        this.element.style.setProperty('--walking-state', 0);
    }

    /**
     * Updates the x-coordinate as well as the left and right bounds to use in collision detection
     * 
     * @param {int} deltaX 
     */
    updateHorizontalBounds(deltaX) {
        this.coords.x += deltaX;
        this.bounds.left += deltaX;
        this.bounds.right += deltaX;
    }

    /**
     * Moves up if not going to be out of bounds, updating positionY and jumpingState
     * for the animation of Mega Man
     * 
     * Variables update translate call in mega-man.css
     * 
     * @param {any[]} [collisionObjects]
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
        if (!this.jumping && this.jumpButtonReleased && this.grounded) this.enableJumpingAnimation();

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
     * Set all jumping conditions and states
     */
    enableJumpingAnimation() {
        this.disableWalkingAnimation();
        this.disableAttackingAnimation();

        this.jumping = true;
        this.grounded = false;
        this.jumpButtonReleased = false;
        this.element.style.setProperty('--jumping-state', 1);
    }

    /**
     * Set all falling conditions and states
     */
    enableFallingAnimation() {
        this.disableWalkingAnimation();
        this.disableAttackingAnimation();

        this.grounded = false;
        this.element.style.setProperty('--jumping-state', 1);
    }

    /**
     * Move downward until ground is reached
     * 
     * @param {any[]} [collisionObjects]
     */
    applyGravity(collisionObjects) {
        // Only apply gravity when jumping is over and not on ground
        if (this.jumping || this.grounded) return;

        // Check on ground; allow jump and stop gravity
        if (this.checkOnGround(collisionObjects)) return;

        // Calculate velocity and update y coordinate to move downwards
        const velocity = MegaMan.gravity * Time.deltaTime;
        this.updateVerticalBounds(velocity);
    }

    /**
     * Iterate through all collisionObjects and left and right edges of the page to find any objects near
     * Mega Man within the miminum collision detection distance and within the x-coordinate bounds of the object for
     * Mega Man to collide with
     * 
     * If that all goes through, stop moving
     *  
     * @param {any[]} [collisionObjects] - all objects to search for collisions with Mega Man
     * @returns boolean based on if something was found near Mega Man or not
     */
    checkHorizontalCollision(collisionObjects) {
        // Check collision with left or right edge of page
        const leftDistance = this.getDistanceToLeft(Window.left);
        const rightDistance = this.getDistanceToRight(Window.right);
        if ((leftDistance <= MegaMan.collisionDistance && this.direction == -1) ||
            (rightDistance <= MegaMan.collisionDistance && this.direction == 1)) return true;

        // Check all possible collision objects
        for (const object of collisionObjects) {
            // Check not within y bounds of object
            if (this.checkObjectWithinYBounds(object)) continue;

            // Check close enough to collide with
            const leftDistance = this.getDistanceToLeft(object.right);
            const rightDistance = this.getDistanceToRight(object.left);
            if ((leftDistance > MegaMan.collisionDistance && this.direction == -1) ||
                (rightDistance > MegaMan.collisionDistance && this.direction == 1)) continue;

            return true;
        }

        return false;
    }

    /**
     * Iterate through all collisionObjects and top of the page to find something above Mega Man within
     * the miminum collision detection distance and within the x-coordinate bounds of the object to
     * bonk Mega Man's head into
     * 
     * If that all goes through, stop jumping
     *  
     * @param {any[]} [collisionObjects] - all objects to search for ceiling above Mega Man
     * @returns boolean based on if ceiling was found above Mega Man or not
     */
    checkHitCeiling(collisionObjects) {
        // Check hit ceiling on top of page
        const distance = this.getDistanceToTop(Window.top);
        if (distance <= MegaMan.collisionDistance) return true;

        // Check all possible ceiling objects
        for (const object of collisionObjects) {
            // Check Mega Man above the object
            if (this.bounds.bottom < object.bottom) continue;

            // Check not within x bounds of object
            if (this.checkObjectWithinXBounds(object)) continue;

            // Check close enough to collide with
            const distance = this.getDistanceToTop(object.bottom);
            if (distance > MegaMan.collisionDistance) continue;

            return true;
        }

        return false;
    }

    /**
     * Iterate through all collisionObjects and bottom of the page to find something below Mega Man within
     * the miminum collision detection distance and within the x-coordinate bounds of the object for Mega Man
     * to be able to stand on
     * 
     * If that all goes through, disable gravity, align with the object to stand on it perfectly,
     * and disable attack animation to prevent odd interactions after landing while attacking mid-air
     *  
     * @param {any[]} [collisionObjects] - all objects to search for ground beneath Mega Man
     * @returns boolean based on if ground was found beneath Mega Man or not
     */
    checkOnGround(collisionObjects) {
        // Check on ground at bottom of page
        const distance = this.getDistanceToBottom(Window.bottom);
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
            if (this.checkObjectWithinXBounds(object)) continue;

            // Check close enough to collide with
            const distance = this.getDistanceToBottom(object.top);
            if (distance > MegaMan.collisionDistance) continue;

            this.disableGravity();

            this.updateVerticalBounds(distance);
            return true;
        }

        return false;
    }

    /**
     * Checks if the given object is within the horizontal bounds of Mega Man
     * 
     * @param {DOMRect} object - Bounding rectangle of the object to check
     * @returns {boolean} - True if the object is within Mega Man's X bounds, false otherwise.
     */
    checkObjectWithinXBounds(object) {
        const left = this.bounds.left + MegaMan.collisionDistance;
        const right = this.bounds.right - MegaMan.collisionDistance;
        return (right < object.left || left > object.right) && (left < object.right || right > object.left);
    }

    /**
     * Checks if the given object is within the vertical bounds of Mega Man
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
     * Get horizontal distance from the left edge of a collidable object to the left bounds of Mega Man
     * 
     * @param {number} objectX - x-coordinate for the left edge of the object
     * @returns distance to objectX
     */
    getDistanceToLeft(objectX) {
        return Math.abs(objectX - this.bounds.left);
    }

    /**
     * Get horizontal distance from the right edge of a collidable object to the right bounds of Mega Man
     * 
     * @param {number} objectX - x-coordinate for the right edge of the object
     * @returns distance to objectX
     */
    getDistanceToRight(objectX) {
        return Math.abs(objectX - this.bounds.right);
    }

    /**
     * Get vertical distance from the bottom of a collidable object to the top of Mega Man
     * 
     * @param {number} objectY - y-coordinate for the bottom of the object
     * @returns distance to objectY
     */
    getDistanceToTop(objectY) {
        return Math.abs(objectY - this.bounds.top);
    }

    /**
     * Get vertical distance from the top of a collidable object to the bottom of Mega Man
     * 
     * @param {number} objectY - y-coordinate for the top of the object
     * @returns distance to objectY
     */
    getDistanceToBottom(objectY) {
        return Math.abs(objectY - this.bounds.bottom);
    }

    /**
     * Resets all gravity conditions and states
     */
    disableGravity() {
        this.jumping = false;
        this.grounded = true;
        this.jumpTime = 0;
        this.element.style.setProperty('--jumping-state', 0);
    }

    /**
     * Updates the y-coordinate as well as the top and bottom bounds to use in collision detection
     * 
     * @param {int} deltaY 
     */
    updateVerticalBounds(deltaY) {
        this.coords.y += deltaY;
        this.bounds.top += deltaY;
        this.bounds.bottom += deltaY;

        this.updatePositionY();
    }

    /**
     * Update the positionY CSS variable with current y-coordinate
     */
    updatePositionY() {
        this.element.style.setProperty('--positionY', `${this.coords.y}px`);
    }

    /**
     * Builds up the charge for Mega Man based on the duration of the attack button being held down.
     * If the charge reaches certain thresholds, it triggers different charge attack states
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

        // Accumulate deltaTime for charge update
        this.chargeInterval += Time.deltaTime;

        // Wait until charge rate has been reached to update animation
        if (this.chargeInterval < MegaMan.chargeAnimationIntervalRate) return;

        // Reset interval
        this.chargeInterval = 0;

        // Increment charge per frame
        this.charge += MegaMan.chargeRate * Time.deltaTime;

        // Wait until charge has reached at least low charge to update animation
        if (this.charge < MegaMan.lowChargeValue) return;

        this.triggerChargeAttackState();
    }

    /**
     * Triggers animation for Mega Man charge attack depending on how long attack button is held down.
     * Assumes charge is >= lowChargeValue
     */
    triggerChargeAttackState() {
        // Increments charging state to next frame
        if (++this.chargeState >= 39) this.chargeState = 0;

        // Enables charging status to repeatedly update variable until attack
        if (this.charge < MegaMan.maxChargeValue) {
            this.element.style.setProperty('--charging-state', (this.chargeState % 3) + 1);
        } else {
            this.element.style.setProperty('--charging-state', (this.chargeState % 3) + 4);
        }
    }

    /**
     * Sets the attacking style for Mega Man and shoot a bullet
     */
    attack(force = false) {
        // Stop charging
        this.charging = force;

        // Allow shot before charge, but don't shoot two in succession unless charge past minimum
        if (this.charge < MegaMan.minChargeValue && !force) return;

        if (this.grounded) {
            // Shifts walking state over 4 to display accurate sprite for attacking
            this.element.style.setProperty('--attacking-state', 4);
        } else {
            // Shifts jumping state over 1 to display accurate sprite for attacking
            this.element.style.setProperty('--attacking-state', 1);
        }

        // Spawn bullet
        new Bullet(this.charge, this.direction, this.element.getBoundingClientRect());

        // Immediately reset charge to disallow multiple charged shots
        this.charge = 0;

        // Waits 0.25 seconds before resetting to idle animation
        setTimeout(() => this.resetToIdleAnimation(), 250);
    }

    /**
     * Reset all attacking conditions and states
     */
    disableAttackingAnimation() {
        this.element.style.setProperty('--attacking-state', 0);
    }

    /**
     * Reset all charging conditions and states
     */
    disableChargingAnimation() {
        this.chargeState = 0;
        this.element.style.setProperty('--charging-state', 0);
    }

    /**
     * Reset Mega Man to idle animation
     */
    resetToIdleAnimation() {
        this.disableAttackingAnimation();
        this.disableChargingAnimation();
    }

    /**
     * Updates position in global context for use with collisions
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