import MegaMan from './mega-man.js';

export default class Bullet {
    static count = 0;
    static maxBullets = 3;
    static lastBulletTime = 0;
    static shootDelay = 330;

    /**
     * Create and move a bullet until it hits the edge of the screen
     * 
     * @param {int} charge - Time (ms) since attack button was first held down
     * @param {int} direction - -1 or 1 depending on if Mega Man is facing left or right, respectively
     * @param {DOMRect} boundingClientRect - Mega Man rectangular bounds to use as spawn area for Bullet
     */
    static shoot(charge, direction, boundingClientRect) {
        // If too many bullets or shooting too quickly, do nothing
        const now = Date.now();
        if (Bullet.count >= Bullet.maxBullets || (now - Bullet.lastBulletTime) < Bullet.shootDelay) return;

        // Update bullet spawn limiting values
        Bullet.lastBulletTime = now;
        ++Bullet.count;

        const bullet = this.createElement(charge);

        this.setPosition(bullet, direction, boundingClientRect);

        this.startMovement(bullet, direction);
    }

    /**
     * Creates a new HTMLDivElement bullet with different look based on the charge held
     * 
     * @param {int} charge
     * @returns HTMLDivElement for the new bullet
     */
    static createElement(charge) {
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');

        // Add to the page
        document.body.appendChild(bullet);

        // Determine charge of bullet
        if (charge >= MegaMan.lowChargeValue && charge < MegaMan.maxChargeValue) {
            bullet.classList.add('low-charge');
        } else if (charge >= MegaMan.maxChargeValue) {
            bullet.classList.add('max-charge');
        }

        return bullet;
    }

    /**
     * Flip and position the bullet based on Mega Man flippped state and position
     * 
     * @param {HTMLDivElement} bullet 
     * @param {int} direction
     * @param {DOMRect} boundingClientRect
     */
    static setPosition(bullet, direction, boundingClientRect) {
        bullet.style.setProperty('--direction', direction);

        // Position bullet based on Mega Man's position
        bullet.style.top = `${boundingClientRect.top + 60}px`;
        bullet.style.left = direction === -1
            ? `${boundingClientRect.left - 32}px`
            : `${boundingClientRect.right}px`;
    }

    /**
     * Starts animation to move the bullet across the screen
     * 
     * @param {HTMLDivElement} bullet
     * @param {int} direction
     */
    static startMovement(bullet, direction) {
        let position = 0;
        const velocity = 10 * direction;

        const move = () => {
            // Update position
            position += velocity;
            bullet.style.setProperty('--position', `${position}px`);

            // Check if bullet hits the edge of the screen
            const bulletRect = bullet.getBoundingClientRect();
            if ((direction === 1 && bulletRect.right >= window.innerWidth - 20)
                || (direction === -1 && bulletRect.left <= 20)) {
                this.remove(bullet);
                return;
            }

            // Continue animation
            requestAnimationFrame(move);
        };

        requestAnimationFrame(move);
    }

    /**
     * Removes bullet and updates bullet count
     * 
     * @param {HTMLDivElement} bullet
     */
    static remove(bullet) {
        bullet.remove();
        --Bullet.count;
    }
}