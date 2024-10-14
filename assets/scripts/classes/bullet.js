import MegaMan from './mega-man.js';

export default class Bullet {
    charge = 0;
    direction = 1;
    position = 0;
    boundingClientRect = null;
    element = null;

    static list = [];
    static maxBullets = 3;
    static lastBulletTime = 0;
    static shootDelay = 330;

    static movingSpeed = 10;

    constructor(charge, direction, boundingClientRect) {
        // If too many bullets or shooting too quickly, do nothing
        if (!Bullet.canSpawn()) return null;

        // Update bullet spawn limiting values
        Bullet.lastBulletTime = Date.now();

        this.charge = charge;
        this.direction = direction;
        this.boundingClientRect = boundingClientRect;

        this.createHtmlElement();

        this.setPosition();

        Bullet.list.push(this);
    }

    /**
     * Creates a new HTMLDivElement bullet with different sprite set based on the charge held
     */
    createHtmlElement() {
        this.element = document.createElement('div');
        this.element.classList.add('bullet');

        // Add to the page
        document.body.appendChild(this.element);

        // Determine charge of bullet
        if (this.charge >= MegaMan.lowChargeValue && this.charge < MegaMan.maxChargeValue) {
            this.element.classList.add('low-charge');
        } else if (this.charge >= MegaMan.maxChargeValue) {
            this.element.classList.add('max-charge');
        }
    }

    /**
     * Flip and position the bullet based on Mega Man flippped state and position
     */
    setPosition() {
        this.element.style.setProperty('--direction', this.direction);

        // Position bullet based on Mega Man's position
        this.element.style.top = `${this.boundingClientRect.top + 60}px`;
        this.element.style.left = this.direction === -1
            ? `${this.boundingClientRect.left - 32}px`
            : `${this.boundingClientRect.right}px`;
    }

    /**
     * Main control function that runs every frame to handle all functionality of each Bullet
     */
    update() {
        this.move();
    }

    /**
     * Starts animation to move the bullet across the screen
     */
    move() {
        // Update position
        this.position += Bullet.movingSpeed * this.direction;
        this.element.style.setProperty('--position', `${this.position}px`);

        // Check if bullet hits the edge of the screen
        const bulletRect = this.element.getBoundingClientRect();
        if ((this.direction === 1 && bulletRect.right >= window.innerWidth - 20)
            || (this.direction === -1 && bulletRect.left <= 20)) {
            this.delete();
            return;
        }
    }

    /**
     * Removes bullet from HTML Doc and static list
     */
    delete() {
        this.element.remove();
        Bullet.list.splice(Bullet.list.indexOf(this), 1);
    }

    /**
     * Check to ensure not too many bullets are spawned and bullets are spaced out
     */
    static canSpawn() {
        return Bullet.list.length < Bullet.maxBullets && (Date.now() - Bullet.lastBulletTime) >= Bullet.shootDelay;
    }
}