import Bullet from './bullet.js';
import Time from '../utils/time.js';
import { activeKeys } from '../utils/event-handler.js';

export default class MegaMan {
    // HTML Div Element
    element = document.querySelector('.mega-man');

    // Movement related variables
    origin = {
        x: window.scrollX + this.element.getBoundingClientRect().left,
        y: window.scrollY + this.element.getBoundingClientRect().top,
    }
    coords = {
        x: this.origin.x,
        y: this.origin.y,
    };
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

    // Charged state related variables
    chargeInterval = 0;
    charge = 0; // Time (ms) since attack button was first held down
    charging = false;
    chargeState = 0;

    static minChargeValue = 250;
    static lowChargeValue = 500;
    static maxChargeValue = 1000;
    static chargeAnimationIntervalRate = 20 / 1000; // Time (ms) to transition to next charge frame
    static chargeRate = 2250; // Rate x deltaTime = how much charge to give per frame

    // Window bounds related variables
    static outerBounds = document.documentElement.scrollWidth - window.scrollX - 130; //window.scrollX + window.innerWidth - 160;
    static innerBounds = 0;
    static upperBounds = document.documentElement.scrollHeight - window.scrollY - 130;
    static lowerBounds = 0;

    constructor() {
        this.element.classList.add('walking-and-charging-state');
    }

    /**
     * Main control function that runs every frame to handle all functionality of Mega Man
     */
    update() {
        // Walk
        this.walk();

        // Slide TODO

        // Jump
        this.jump();

        // Apply gravity
        this.applyGravity();

        // Charge
        this.buildUpCharge();
    }

    /**
     * Walks left or right if not going to be out of bounds, updating the direction, positionX,
     * and walkingState for the animation of Mega Man
     * 
     * Variables update translateX call in mega-man.css
     */
    walk() {
        const leftPressed = activeKeys.a;
        const rightPressed = activeKeys.d;
        // Don't move if not pressing arrow keys or if both are pressed
        if ((!leftPressed && !rightPressed) || (leftPressed && rightPressed)) {
            if (this.walking) this.stopWalking();
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
        const newX = this.coords.x + velocity;

        // Update outerBounds in case page size changed since last movement
        MegaMan.outerBounds = document.documentElement.scrollWidth - window.scrollX - 130;

        // Don't start walking if already at end of screen
        if (newX >= MegaMan.outerBounds || newX <= MegaMan.innerBounds) {
            return;
        }

        // Update position variable
        this.coords.x = newX;

        // Update positionX on screen, offset by the parent origin X coordinate
        this.element.style.setProperty('--positionX', `${this.coords.x - this.origin.x}px`);
    }

    /**
     * Resets all walking conditions and states
     */
    stopWalking() {
        this.walking = false;
        this.disableWalkingAnimation();
    }

    /**
     * Disables the walking animation and state variable
     */
    disableWalkingAnimation() {
        this.walkingState = 0;
        this.element.style.setProperty('--walking-state', 0);
    }

    /**
     * Moves up if not going to be out of bounds, updating positionY and jumpingState
     * for the animation of Mega Man
     * 
     * Variables update translateX call in mega-man.css
     */
    jump() {
        if (!activeKeys.w) {
            if (this.jumping) {
                this.jumping = false;
            }

            this.jumpButtonReleased = true;
            return;
        }

        // First frame of jumping
        if (!this.jumping && this.jumpButtonReleased && this.grounded) {
            this.disableWalkingAnimation();
            this.disableAttackAnimation();

            // Enable jumping animation and start jump
            this.jumping = true;
            this.grounded = false;
            this.jumpButtonReleased = false;
            this.element.style.setProperty('--jumping-state', 1);
        }

        // Don't continue jumping if not jumping
        if (!this.jumping) return;

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

        // Update position variable to translateX in CSS
        this.coords.y = newY;
        this.element.style.setProperty('--positionY', `${this.coords.y}px`);

        // In air = no longer grounded
        this.grounded = false;
    }

    /**
     * Move downward until ground is reached
     */
    applyGravity() { // TODO: Fix gravity to work with new coordinate system
        // Only apply gravity when jumping is over and not on ground
        if (this.jumping || this.grounded) return;

        // Check on ground; allow jump and stop gravity
        // TODO: Needs changed to work with HTML Div elements instead of sea level
        if (this.coords.y >= 0) { //< this.origin.y) {
            this.jumping = false;
            this.grounded = true;
            this.jumpTime = 0;
            this.jumpButtonReleased = false;
            this.element.style.setProperty('--jumping-state', 0);

            // Align with ground
            // TODO: Change to HTML Div Element y coord
            this.coords.y = 0;
            this.element.style.setProperty('--positionY', `${0}px`);

            this.disableAttackAnimation();
            return;
        }

        // Calculate velocity and update y coordinate to move downwards
        const velocity = MegaMan.gravity * Time.deltaTime;
        this.coords.y += velocity;
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
     * Disables the attack animation
     */
    disableAttackAnimation() {
        this.element.style.setProperty('--attacking-state', 0);
    }

    /**
     * Reset Mega Man to idle animation
     */
    resetToIdleAnimation() {
        this.disableAttackAnimation();

        // Resets charging state
        this.chargeState = 0;
        this.element.style.setProperty('--charging-state', 0);
    }
}