import MegaMan from "./mega-man.js";

export default class MegaManAnimation {
    static maxSpawnState = 20;
    static spawnFramePause = 10; // 30 / 10 = 3 frames over 30 update calls

    static maxWalkState = 30;
    static walkFramePause = 10; // 30 / 10 = 3 frames over 30 update calls

    static attackTimeout = 250; // Time (ms) before disabling attack animation

    static maxChargeState = 40;

    /**
     * Initialize the base animation state and default states to 0
     * 
     * @param {Element} element 
     */
    constructor(element) {
        this.element = element;
        this.element.classList.add('spawn-animation-state');
        this.style = this.element.style;

        this.spawnState = 0; // 0 - (maxSpawnState - 1)
        this.walkState = 0; // 0 - (maxWalkState - 1)
        this.jumpState = 0; // 0 - 1
        this.chargeState = 0; // 0 - (maxChargeState - 1)
    }

    /**
     * Update horizontal position on screen
     * 
     * @param {number} xCoordinate
     */
    updateX(xCoordinate) {
        this.style.setProperty('--positionX', `${xCoordinate}px`);
    }

    /**
     * Update vertical position on screen
     * 
     * @param {number} yCoordinate
     */
    updateY(yCoordinate) {
        this.style.setProperty('--positionY', `${yCoordinate}px`);
    }

    /**
     * Update the direction property to flip Mega Man's sprite / animation
     * 
     * @param {int} direction - 1 = right, -1 = left
     */
    updateDirection(direction = 1) {
        this.style.setProperty('--direction', direction);
    }

    /**
     * Update visibility value to hide Mega Man during spawn animation
     * 
     * @param {boolean} disable - Set hidden if true, visible if false
     */
    updateVisibility(disable = false) {
        this.style.visibility = disable ? 'hidden' : 'visible';
    }

    /**
     * Update the spawn state property. Increment spawnState until maxSpawnState reached,
     * then reset to 0. Displays a 2 frame animation for spawning after reaching spawn
     * 
     * @param {boolean} disable - Remove spawn animation and add base animation state
     * @returns {boolean} - True when complete
     */
    updateSpawn(disable = false) {
        if (disable) {
            this.element.classList.remove('spawn-animation-state');
            this.element.classList.add('base-animation-state');
            return true;
        } else {
            if (++this.spawnState > MegaManAnimation.maxSpawnState) return true;

            this.style.setProperty('--spawn-state',
                Math.floor(this.spawnState / MegaManAnimation.spawnFramePause) + 1); // 1 - 2
        }

        return false;
    }

    /**
     * Update the walk state property. Increment walkState until maxWalkState reached,
     * then reset to 0. Displays a 3 frame animation for walking
     * 
     * @param {boolean} disable - Forcibly sets property to 0 if true
     */
    updateWalk(disable = false) {
        // Don't walk if already jumping
        if (disable || this.jumpState > 0) {
            this.walkState = 0;
            this.style.setProperty('--walk-state', 0);
        } else {
            this.walkState = (this.walkState + 1) % MegaManAnimation.maxWalkState;
            this.style.setProperty('--walk-state',
                Math.floor(this.walkState / MegaManAnimation.walkFramePause) + 1); // 1 - 3
        }
    }

    /**
    * Update the jump state property. Stop walking before displaying jump animation
    * 
    * @param {boolean} disable - Forcibly sets property to 0 if true
    */
    updateJump(disable = false) {
        if (disable) {
            this.jumpState = 0;
        } else {
            this.updateWalk(true);
            this.jumpState = 1;
        }

        this.style.setProperty('--jump-state', this.jumpState);
    }

    /**
    * Update the attack state property. Shift walk frame by 4 and jump frame by 1.
    * 
    * @param {boolean} disable - Forcibly sets property to 0 if true
    */
    updateAttack(disable = false) {
        if (disable) {
            this.style.setProperty('--attack-state', 0);
            this.updateCharge(0);
            return;
        } else if (this.jumpState > 0) {
            this.style.setProperty('--attack-state', 1);
        } else {
            this.style.setProperty('--attack-state', 4);
        }

        // Wait before disabling attack and charge animations
        setTimeout(() => this.updateAttack(true), MegaManAnimation.attackTimeout);
    }

    /**
     * Update the charge state property. Increment chargeState until maxChargeState reached,
     * then reset to 0. Display a 3 frame animation for both min and max charge states
     * 
     * @param {int} charge - Value to determine correct charge state
     * @returns {void}
     */
    updateCharge(charge = 0) {
        if (charge === 0) {
            this.chargeState = 0;
            this.element.style.setProperty('--charge-state', 0);
            return;
        }

        if (charge < MegaMan.minChargeValue) return;

        this.chargeState = (this.chargeState + 1) % MegaManAnimation.maxChargeState;

        if (charge < MegaMan.maxChargeValue) {
            this.style.setProperty('--charge-state', (this.chargeState % 3) + 1);
        } else {
            this.style.setProperty('--charge-state', (this.chargeState % 3) + 4);
        }
    }
}
