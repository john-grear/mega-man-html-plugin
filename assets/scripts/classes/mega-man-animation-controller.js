import MegaMan from "./mega-man.js";

export default class MegaManAnimationController {
  idle = false;
  activeStates = {
    spawn: false,
    walk: false,
    jump: false,
    slide: false,
    attack: false,
  };

  static maxIdleState = 150;
  static maxIdleFrames = 10; // max frames to be idle for

  static maxSpawnState = 20;
  static spawnFramePause = 10; // 30 / 10 = 3 frames over 30 update calls

  static maxWalkState = 30;
  static walkFramePause = 10; // 30 / 10 = 3 frames over 30 update calls
  static kneeBendFrameLength = 5;
  static kneeBendFrame = 2;

  static attackTimeout = 250; // Time (ms) before disabling attack animation

  static maxChargeState = 40;

  /**
   * Initialize the base animation state and default states to 0
   *
   * @param {Element} element
   */
  constructor(element) {
    this.element = element;
    this.element.classList.add("spawn-animation-state");
    this.style = this.element.style;

    this.idleState = 0; // 0 - 1
    this.spawnState = 0; // 0 - (maxSpawnState - 1)
    this.walkState = 0; // 0 - (maxWalkState - 1)
    this.slideFrames = 0; // 0 - maxSlideFrames
    this.chargeState = 0; // 0 - (maxChargeState - 1)
  }

  /**
   * Update horizontal position on screen
   *
   * @param {number} xCoordinate
   */
  updateX(xCoordinate) {
    this.style.setProperty("--positionX", `${xCoordinate}px`);
  }

  /**
   * Update vertical position on screen
   *
   * @param {number} yCoordinate
   */
  updateY(yCoordinate) {
    this.style.setProperty("--positionY", `${yCoordinate}px`);
  }

  /**
   * Update the direction property to flip Mega Man's sprite / animation
   *
   * @param {int} direction - 1 = right, -1 = left
   */
  updateDirection(direction = 1) {
    this.style.setProperty("--direction", direction);
  }

  /**
   * Update visibility value to hide Mega Man during spawn animation
   *
   * @param {boolean} disable - Set hidden if true, visible if false
   */
  updateVisibility(disable = false) {
    this.style.visibility = disable ? "hidden" : "visible";
  }

  /**
   * Update the spawn state property. Increment spawnState until maxSpawnState reached,
   * then reset to 0. Displays a 2 frame animation for spawning after reaching spawn
   *
   * @param {boolean} disable - Remove spawn animation and add base animation state
   * @returns {boolean} - True when complete
   */
  updateSpawn(disable = false) {
    this.activeStates.spawn = !disable;

    if (disable) {
      this.updateBase();
      return true;
    } else {
      if (++this.spawnState > MegaManAnimationController.maxSpawnState) {
        this.spawnState = 0;
        return true;
      }

      const adjustedSpawnState =
        Math.floor(
          this.spawnState / MegaManAnimationController.spawnFramePause
        ) + 1;
      this.style.setProperty("--spawn-state", adjustedSpawnState); // 1 - 2

      return false;
    }
  }

  /**
   * Update base and spawn animation states and spawn state property, depending on disable value
   *
   * @param {boolean} disable - Swap spawn and base animation state
   */
  updateBase(disable = false) {
    if (disable) {
      this.element.classList.remove("base-animation-state");
      this.element.classList.add("spawn-animation-state");

      this.spawnState = 0;
      this.style.setProperty("--spawn-state", 0);
    } else {
      this.element.classList.remove("spawn-animation-state");
      this.element.classList.add("base-animation-state");
    }
  }

  /**
   * Update the idle state property. Increment idleState until maxIdleState reached,
   * then display idle blinking animation for maxIdleFrames number of frames before
   * resetting idleState back to 0. Recursively call this function at the end if idle
   * was not being disabled. When other animations are disabled, they will disable
   * their variable in the activeStates map and call updateIdle to trigger idle timer
   * again
   *
   * @param {boolean} disable - Forcibly sets property to 0 if true
   */
  updateIdle(disable = false) {
    if (disable) {
      this.idle = false;
      this.element.style.setProperty("--idle-state", 0);
      return;
    } else {
      const anyActiveStates = Object.values(this.activeStates).some(
        (state) => state
      );

      if (anyActiveStates) {
        this.updateIdle(true);
        return;
      }

      this.idle = true;

      if (++this.idleState < MegaManAnimationController.maxIdleState) {
        requestAnimationFrame(() => this.updateIdle());
        return;
      }

      if (this.idleState === MegaManAnimationController.maxIdleState) {
        this.style.setProperty("--idle-state", 1);
      } else if (
        this.idleState >=
        MegaManAnimationController.maxIdleState +
          MegaManAnimationController.maxIdleFrames
      ) {
        this.idleState = 0;
        this.style.setProperty("--idle-state", 0);
      }
    }

    requestAnimationFrame(() => this.updateIdle());
  }

  /**
   * Update the walk state property. Start walkState at the knee bend frame length * -1,
   * incrementing until 0 is reached, which then starts the 3 frame walking animation.
   * Increment walkState until maxWalkState reached, then reset to 0
   *
   * @param {boolean} disable - Forcibly sets property to 0 if true after displaying the knee bend frame
   * after some delay. If jumping, skip knee bend frame
   */
  updateWalk(disable = false) {
    this.activeStates.walk = !disable;

    // Don't walk if jumping or sliding
    if (this.activeStates.jump || this.activeStates.slide) {
      this.style.setProperty("--walk-state", 0);
      this.walkState = -MegaManAnimationController.kneeBendFrameLength;
      if (!this.idle) this.updateIdle();
      return;
    }

    // Display knee bend frame before disabling
    if (disable) {
      if (this.walkState > 0) {
        this.walkState = -MegaManAnimationController.kneeBendFrameLength;
      }

      if (this.walkState < 0) {
        this.style.setProperty(
          "--walk-state",
          MegaManAnimationController.kneeBendFrame
        );
        ++this.walkState;
        requestAnimationFrame(() => this.updateWalk(true));
      } else {
        this.style.setProperty("--walk-state", 0);
        this.walkState = -MegaManAnimationController.kneeBendFrameLength;
        this.updateIdle();
      }
      return;
    }

    if (this.walkState < 0) {
      this.style.setProperty(
        "--walk-state",
        MegaManAnimationController.kneeBendFrame
      );
      ++this.walkState;
    } else {
      const currentWalkFrame = Math.floor(
        this.walkState / MegaManAnimationController.walkFramePause
      );
      this.style.setProperty("--walk-state", currentWalkFrame + 3); // Skip idle and knee bend frame
      this.walkState =
        (this.walkState + 1) % MegaManAnimationController.maxWalkState;
    }
  }

  /**
   * Update the jump state property. Stop walking before displaying jump animation
   *
   * @param {boolean} disable - Forcibly sets property to 0 if true
   */
  updateJump(disable = false) {
    this.activeStates.jump = !disable;

    if (disable) {
      this.style.setProperty("--jump-state", 0);
      if (!this.idle) this.updateIdle();
      return;
    }

    this.updateWalk(true);
    this.style.setProperty("--jump-state", 1);
  }

  /**
   * Update the slide state property. Stop walking before displaying slide animation
   *
   * @param {boolean} disable - Forcibly sets property to 0 if true
   */
  updateSlide(disable = false) {
    this.activeStates.slide = !disable;

    if (disable) {
      this.style.setProperty("--slide-state", 0);
      if (!this.idle) this.updateIdle();
      return;
    }

    this.updateWalk(true);
    this.style.setProperty("--slide-state", 1);
  }

  /**
   * Update the attack state property. Shift walk frame by 4 and jump frame by 1.
   *
   * @param {boolean} disable - Forcibly sets property to 0 if true
   */
  updateAttack(disable = false) {
    this.activeStates.attack = !disable;

    if (disable) {
      this.style.setProperty("--attack-state", 0);
      this.updateCharge(0);
      if (!this.idle) this.updateIdle();
      return;
    }

    if (this.activeStates.jump) {
      this.style.setProperty("--attack-state", 1); // Jumping + attacking
    } else if (this.activeStates.walk) {
      this.style.setProperty("--attack-state", 4); // Walking + attacking
    } else {
      this.style.setProperty("--attack-state", 6); // Idle, skip over knee bend and idle frames
    }

    // Wait before disabling attack and charge animations
    setTimeout(
      () => this.updateAttack(true),
      MegaManAnimationController.attackTimeout
    );
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
      this.element.style.setProperty("--charge-state", 0);
      if (!this.idle) this.updateIdle();
      return;
    }

    if (charge < MegaMan.minChargeValue) return;

    this.chargeState =
      (this.chargeState + 1) % MegaManAnimationController.maxChargeState;

    if (charge < MegaMan.maxChargeValue) {
      this.style.setProperty("--charge-state", (this.chargeState % 3) + 1);
    } else {
      this.style.setProperty("--charge-state", (this.chargeState % 3) + 4);
    }
  }
}
