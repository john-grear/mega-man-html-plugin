import Bullet from './bullet.js';

export default class MegaMan {
    // HTML Div Element
    element = document.querySelector('.mega-man');

    // Charged state variables
    attackButtonLastPressed = 0;
    chargingLowChargeAttack = false;
    chargingMaxChargeAttack = false;
    charge = 0; // Time (ms) since attack button was first held down

    static lowChargeValue = 500;
    static maxChargeValue = 1500;

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
        if (this.charge >= MegaMan.lowChargeValue && this.charge < MegaMan.maxChargeValue && !this.chargingLowChargeAttack) {
            this.chargingLowChargeAttack = true;
            this.element.classList.add('low-charge-state');
        } else if (this.charge >= MegaMan.maxChargeValue && !this.chargingMaxChargeAttack) {
            this.chargingLowChargeAttack = false;
            this.chargingMaxChargeAttack = true;
            this.element.classList.remove('low-charge-state');
            this.element.classList.add('max-charge-state');
        }
    }

    /**
     * Sets the attacking style for Mega Man and shoot a bullet
     */
    attack() {
        this.element.classList.remove('low-charge-state', 'max-charge-state');
        this.element.classList.add('attacking');

        Bullet.shoot(this.charge, this.element);
    }

    /**
     * Removes all attacking states from Mega Man to reset to idle animation
     */
    resetAttackAnimations() {
        this.attackButtonLastPressed = 0;
        this.chargingLowChargeAttack = false;
        this.chargingMaxChargeAttack = false;
        this.element.classList.remove('attacking');
    }

}