import Bullet from './bullet.js';
import Time from '../utils/time.js';
import { activeKeys } from '../utils/event-handler.js';

export default class MegaMan {
    // HTML Div Element
    element = document.querySelector('.mega-man');

    // Movement related variables
    coords = {
        x: 0,
        y: 0,
    };
    walking = false;
    walkingState = 0;
    direction = 1;

    static walkingSpeed = 500;

    // Jump related variables
    jumping = false;
    jumpTime = 0; // Time (ms) since jump button was first held down

    static jumpingSpeed = 600;
    static jumpTimeLimit = 500;
    static jumpTimeScalar = 2.5;

    // Charged state related variables
    chargeInterval = 0;
    charge = 0; // Time (ms) since attack button was first held down
    charging = false;
    chargeState = 0;

    static lowChargeValue = 500;
    static maxChargeValue = 1500;
    static chargeAnimationIntervalRate = 20 / 1000; // Time (ms) to transition to next charge frame
    static chargeRate = 2250; // Rate x deltaTime = how much charge to give per frame

    // Window bounds related variables
    static outerBounds = document.documentElement.scrollWidth - window.scrollX - 130; //window.scrollX + window.innerWidth - 160;
    static innerBounds = 0;
    static upperBounds = 0;
    static lowerBounds = document.documentElement.scrollHeight - window.scrollY - 130;

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

        // Calculate velocity and new x coordinate after walking one frame
        const velocity = MegaMan.walkingSpeed * this.direction * Time.deltaTime;
        const newX = this.getCoords().x + velocity;

        // Update outerBounds in case page size changed since last movement
        MegaMan.outerBounds = document.documentElement.scrollWidth - window.scrollX - 130;

        // Don't start walking if already at end of screen
        if (newX >= MegaMan.outerBounds || newX <= MegaMan.innerBounds) {
            this.stopWalking();
            return;
        }

        // Update position variable to translateX in CSS
        this.coords.x += velocity;
        this.element.style.setProperty('--positionX', `${this.coords.x}px`);

        // Increments walking state to next frame
        if (++this.walkingState >= 30) this.walkingState = 0;
        this.element.style.setProperty('--walking-state', Math.floor(this.walkingState / 10) + 1);
    }

    /**
     * Resets all walking conditions and states
     */
    stopWalking() {
        this.walking = false;
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
            if (this.jumping) this.stopJumping();
            return;
        }

        // Enable jumping
        this.jumping = true;

        // Calculate velocity and new y coordinate after walking one frame
        const velocity = MegaMan.jumpingSpeed * Time.deltaTime;
        const newY = this.getCoords().y + velocity;

        // Stop jumping if already at top of screen or jump past jumpTimeLimit
        if (newY <= MegaMan.upperBounds || this.jumpTime >= MegaMan.jumpTimeLimit) {
            this.stopJumping();
            return;
        }

        this.jumpTime += velocity * MegaMan.jumpTimeScalar;

        // Update position variable to translateX in CSS
        this.coords.y -= velocity;
        this.element.style.setProperty('--positionY', `${this.coords.y}px`);
    }

    /**
     * Resets all jumping conditions and states, except for being on ground
     */
    stopJumping() {
        this.jumping = false;
    }

    /**
     * Move downward until ground is reached
     */
    applyGravity() {
        if (this.jumping) {
            return;
        }

        // Check on ground; allow jump and stop gravity
        // TODO: Needs changed to work with HTML Div elements instead of sea level
        if (this.coords.y >= 0) {
            this.jumpTime = 0;
            return;
        }

        // Calculate velocity and new y coordinate after walking one frame
        const velocity = MegaMan.jumpingSpeed * Time.deltaTime;
        const newY = this.getCoords().y + velocity;

        // Set correct height based on height of element landing on
        // TODO: Replace 0 with height of element going to land on
        if (newY < 0) {
            this.coords.y = 0;
            this.element.style.setProperty('--positionY', `${0}px`);
            return;
        }

        this.coords.y += velocity;
        this.element.style.setProperty('--positionY', `${this.coords.y}px`);
    }

    /**
     * Calculates the coordinates
     * 
     * @returns X and Y coordinates
     */
    getCoords() {
        return {
            x: window.scrollX + this.element.getBoundingClientRect().left,
            y: window.scrollY + this.element.getBoundingClientRect().top, //+ this.element.getBoundingClientRect().height / 2
        };
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
    attack() {
        // Stop charging
        this.charging = false;

        // Shifts walking state over 4 to display accurate sprite for attacking
        this.element.style.setProperty('--attacking-state', 4);

        // Spawn bullet
        const bullet = new Bullet(this.charge, this.direction, this.element.getBoundingClientRect());

        // Immediately reset charge to disallow multiple charged shots
        this.charge = 0;

        // Waits 0.25 seconds before resetting to idle animation
        setTimeout(() => this.resetToIdleAnimation(), 250);
    }

    /**
     * Reset Mega Man to idle animation
     */
    resetToIdleAnimation() {
        // Resets attacking state
        this.element.style.setProperty('--attacking-state', 0);

        // Resets charging state
        this.chargeState = 0;
        this.element.style.setProperty('--charging-state', 0);
    }
}