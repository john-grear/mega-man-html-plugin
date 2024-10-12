import Bullet from './bullet.js';
import Time from '../utils/time.js';
import { activeKeys } from '../utils/event-handler.js';

export default class MegaMan {
    // HTML Div Element
    element = document.querySelector('.mega-man');

    // Movement related variables
    bounds = this.element.getBoundingClientRect();
    coords = {
        x: 0,
        y: 1,
    };
    walkingState = 0;
    direction = 1;

    // Charged state variables
    attackButtonLastPressed = 0;
    chargingInterval = null;
    charge = 0; // Time (ms) since attack button was first held down
    chargeState = 0;

    static lowChargeValue = 500;
    static maxChargeValue = 1500;

    static outerBounds = document.documentElement.scrollWidth - window.scrollX - 130; //window.scrollX + window.innerWidth - 160;
    static innerBounds = 0;

    constructor() {
        this.element.classList.add('walking-and-charging-state');
    }

    /**
     * Main control function that runs every frame to handle all functionality of Mega Man
     */
    update() {
        // Walk
        this.walk();

        // Jump
    }

    walk() {
        const leftPressed = activeKeys.a;
        const rightPressed = activeKeys.d;
        // Don't move if not pressing arrow keys or if both are pressed
        if ((!leftPressed && !rightPressed) || (leftPressed && rightPressed)) {
            if (this.walkingState > 0) this.stopWalking();
            return;
        }

        // Update direction Mega Man is facing
        this.direction = leftPressed ? -1 : 1;
        this.element.style.setProperty('--direction', this.direction);

        // Calculate velocity and new x coordinate after walking one frame
        const velocity = 600 * this.direction * Time.getDeltaTime();
        const x = this.getCoords().x + velocity;

        // Update outerBounds in case page size changed since last movement
        MegaMan.outerBounds = document.documentElement.scrollWidth - window.scrollX - 130;

        // Don't start walking if already at end of screen
        if (x >= MegaMan.outerBounds || x <= MegaMan.innerBounds) return;

        // Update position variable to translateX in CSS
        this.coords.x += velocity;
        this.element.style.setProperty('--position', `${this.coords.x}px`);

        // Increments walking state to next frame
        if (++this.walkingState >= 30) this.walkingState = 0;
        this.element.style.setProperty('--walking-state', Math.floor(this.walkingState / 10) + 1);
    }

    /**
     * Stop walking loop
     */
    stopWalking() {
        this.walkingState = 0;
        this.element.style.setProperty('--walking-state', 0);
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
     * Set interval to build up charge, triggering attack state when ready
     */
    startCharging() {
        this.update();
        this.chargingInterval = setInterval(() => {
            this.buildUpCharge();
        }, 20);
    }

    /**
     * Builds up the charge for Mega Man based on the duration of the attack button being held down.
     * If the charge reaches certain thresholds, it triggers different charge attack states
     */
    buildUpCharge() {
        // Reset when attack was already triggered to stop infinite charge
        const now = Date.now();
        if (this.attackButtonLastPressed === 0) this.attackButtonLastPressed = now;

        // Check attack button is being held down
        this.charge = now - this.attackButtonLastPressed;
        if (this.charge >= MegaMan.lowChargeValue) {
            this.triggerChargeAttackState();
        }
    }

    /**
     * Triggers animation for Mega Man charge attack depending on how long attack button is held down
     */
    triggerChargeAttackState() {
        // Increments walking state to next frame
        if (++this.chargeState >= 39) this.chargeState = 0;

        // Enables charging status to repeatedly update variable until attack
        if (this.charge >= MegaMan.lowChargeValue && this.charge < MegaMan.maxChargeValue) {
            this.element.style.setProperty('--charging-state', (this.chargeState % 3) + 1);
        } else if (this.charge >= MegaMan.maxChargeValue) {
            this.element.style.setProperty('--charging-state', (this.chargeState % 3) + 4);
        }
    }

    /**
     * Sets the attacking style for Mega Man and shoot a bullet
     */
    attack() {
        // Stop charging
        clearInterval(this.chargingInterval);

        // Shifts walking state over 4 to display accurate sprite for attacking
        this.element.style.setProperty('--attacking-state', 4);

        Bullet.shoot(this.charge, this);
    }

    /**
     * Reset Mega Man to idle animation
     */
    resetAttackAnimations() {
        // Resets attacking state
        this.attackButtonLastPressed = 0;
        this.element.style.setProperty('--attacking-state', 0);

        // Resets charging state
        this.chargeState = 0;
        this.element.style.setProperty('--charging-state', 0);
    }
}