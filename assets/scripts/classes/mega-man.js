import Bullet from './bullet.js';
import Time from '../utils/time.js';
import { activeKeys } from '../utils/event-handler.js';

export default class MegaMan {
    // HTML Div Element
    element = document.querySelector('.mega-man');

    // Coordinate related variables
    origin = {
        x: window.scrollX + this.element.getBoundingClientRect().left,
        y: window.scrollY + this.element.getBoundingClientRect().top,
    }
    coords = { // Tracks position in local context to update CSS positionX and positionY
        x: this.origin.x,
        y: 0,
    };
    bounds = { // Tracks position in global context for use with collisions
        top: this.element.getBoundingClientRect().top,
        bottom: this.element.getBoundingClientRect().bottom,
        left: this.element.getBoundingClientRect().left,
        right: this.element.getBoundingClientRect().right,
    };

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
    static minCollisionDetectionDistance = 10;

    // Window bounds related variables
    static outerBounds = document.documentElement.scrollWidth - window.scrollX - MegaMan.minCollisionDetectionDistance;
    static innerBounds = 0;
    static upperBounds = document.documentElement.scrollHeight - window.scrollY - MegaMan.minCollisionDetectionDistance;
    static lowerBounds = 0;

    constructor() {
        // TODO: Initiate spawn in animation, then enable walking and charging state
        this.element.classList.add('walking-and-charging-state');
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

        // Update outerBounds in case page size changed since last movement
        MegaMan.outerBounds = document.documentElement.scrollWidth - window.scrollX - MegaMan.minCollisionDetectionDistance;

        // Don't start walking if already at end of screen
        if ((this.bounds.right >= MegaMan.outerBounds && this.direction == 1) ||
            (this.bounds.left <= MegaMan.innerBounds && this.direction == -1)) {
            return;
        }

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

        // Don't continue jumping if not jumping
        if (!this.jumping && !this.grounded) return;

        // Calculate velocity for one frame
        const velocity = MegaMan.jumpingSpeed * Time.deltaTime;
        const newY = this.coords.y - velocity;

        // Stop jumping if already at top of screen or jump past jumpTimeLimit
        if (newY >= MegaMan.upperBounds || this.jumpTime >= MegaMan.jumpTimeLimit) {
            this.jumping = false;
            return;
        }

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
        const distance = this.getVerticalDistanceToObject(MegaMan.upperBounds);
        if (Math.abs(distance) <= MegaMan.minCollisionDetectionDistance) {
            this.disableGravity();

            this.alignVerticalCollision(distance);

            this.disableAttackingAnimation();
            return true;
        }

        // Check all possible ground objects
        for (const object of collisionObjects) {
            // Check Mega Man below the object
            if (this.bounds.bottom > object.top) continue;

            // Check not within x bounds of object
            if (!(this.bounds.right >= object.left && this.bounds.left <= object.right) &
                !(this.bounds.left >= object.right && this.bounds.right <= object.left)) continue;

            // Check close enough to collide with
            const distance = this.getVerticalDistanceToObject(object.top);
            if (Math.abs(distance) > MegaMan.minCollisionDetectionDistance) continue;

            this.disableGravity();

            this.alignVerticalCollision(distance);

            this.disableAttackingAnimation();
            return true;
        }

        return false;
    }

    /**
     * Get vertical distance from the top of a collidable object to the bottom of Mega Man
     * 
     * @param {number} objectY - y-coordinate for the top of the object where Mega Man would be standing
     * @returns distance to the upperBounds
     */
    getVerticalDistanceToObject(objectY) {
        return objectY - this.bounds.bottom;
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
     * Offset the coordinates by the distance to perfectly align with the collided object
     */
    alignVerticalCollision(distance) {
        this.updateVerticalBounds(distance);
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
}