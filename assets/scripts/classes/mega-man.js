import Bullet from "./bullet.js";
import CollisionObject from "./collision-object.js";
import DeathParticle from "./death-particle.js";
import MegaManAnimationController from "./mega-man-animation-controller.js";
import MegaManCollisionController from "./mega-man-collision-controller.js";
import MegaManTransformController from "./mega-man-transform-controller.js";
import Time from "../utils/time.js";
import Window from "../utils/window.js";
import { activeKeys } from "../utils/event-handler.js";

export default class MegaMan {
  // Spawn related variables
  spawned = false;

  static spawnSpeed = 15;
  static respawnTime = 10000; // Time (ms) to respawn after dying

  // Walk related variables
  walking = false;

  static walkingSpeed = 500;

  // Slide related variables
  slideLocked = false;
  sliding = false;
  slideTime = 0;

  static slideSpeed = 650;
  static slideTimeLimit = 300;

  // Jump related variables
  jumpButtonReleased = false;
  jumping = false;
  jumpTime = 0; // Time (ms) since jump button was first held down
  grounded = false;

  static jumpingSpeed = 650;
  static jumpTimeLimit = 300;
  static gravity = 900;

  // Charge related variables
  chargeInterval = 0;
  charge = 0; // Time (ms) since attack button was first held down
  charging = false;

  static minChargeValue = 250;
  static lowChargeValue = 500;
  static maxChargeValue = 1000;
  static chargeIntervalRate = 20 / 1000; // Time (ms) to transition to next charge frame
  static chargeRate = 2250; // Rate x deltaTime = how much charge to give per frame

  // Collision related variables
  static collisionDistance = 10;

  constructor() {
    this.element = document.querySelector(".mega-man");

    // TODO: If element === null, find spawn area and create new .mega-man element

    this.animationController = new MegaManAnimationController(this.element);

    this.transformController = new MegaManTransformController(
      this.element,
      this.animationController
    );

    this.collisionController = new MegaManCollisionController(
      this.element,
      this.transformController
    );
    this.collisionController.updateBounds();

    this.animationController.updateBase(true);
    this.animationController.updateVisibility();

    this.spawn();
  }

  /**
   * Shortcut for coordinate access
   */
  get coords() {
    return this.transformController.coords;
  }

  /**
   * Shortcut for direction access
   */
  get direction() {
    return this.transformController.direction;
  }

  /**
   * Move Mega Man in spawn noodle animation down until they reach spawn area,
   * then update the spawn animation until time is up, and disable spawn animation
   */
  spawn() {
    if (this.coords.y < 0) {
      // Drop into place
      this.collisionController.updateVerticalBounds(MegaMan.spawnSpeed);
      requestAnimationFrame(() => this.spawn());
    } else if (this.coords.y + MegaMan.spawnSpeed > 0) {
      // Adjust position to 0
      this.collisionController.updateVerticalBounds(-this.coords.y);

      // Update spawn animation
      if (!this.animationController.updateSpawn()) {
        requestAnimationFrame(() => this.spawn());
      } else {
        // Spawn animation finished
        this.animationController.updateSpawn(true);
        this.spawned = true;
        this.collisionController.updateBounds();
      }
    }
  }

  /**
   * Disable functionality and visibility, spawn death particles, and set a timer to respawn
   */
  die() {
    // Disable functionality and visibility
    this.spawned = false;
    this.animationController.updateVisibility(true);

    // Spawn death particles
    const boundingClientRect = this.element.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
      new DeathParticle(boundingClientRect, 45 * (i % 8), Math.floor(i / 8));
    }

    // Set timer to respawn
    this.setRespawnTimer();
  }

  /**
   * Set timer to respawn Mega Man, checking if Mega Man can fit on screen before spawning
   * If still off screen, reattempt every 0.5 second after that
   *
   * @param {number} [newRespawnTime=0] - Respawn time to use instead of MegaMan.respawnTime
   */
  setRespawnTimer(newRespawnTime = 0) {
    setTimeout(
      () => {
        if (Window.isOffScreen(this.bounds)) {
          this.setRespawnTimer(500);
          return;
        }

        this.moveToSpawnArea();
        this.collisionController.updateBounds();
        this.animationController.updateVisibility();
        this.spawn();
      },
      newRespawnTime === 0 ? MegaMan.respawnTime : newRespawnTime
    );
  }

  /**
   * Main control function that runs every frame to handle all functionality
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  update(collisionObjects = []) {
    // Check spawned
    if (!this.spawned) return;

    // Walk
    this.walk(collisionObjects);

    // Slide
    this.slide(collisionObjects);

    // Jump
    this.jump(collisionObjects);

    // Apply gravity
    this.applyGravity(collisionObjects);

    // Charge
    this.buildUpCharge();
  }

  /**
   * Attempt to trigger a slide if not already sliding, otherwise continue sliding
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  walk(collisionObjects) {
    if (this.walking) {
      this.updateWalk(collisionObjects);
    } else {
      this.triggerWalk(collisionObjects);
    }
  }

  /**
   * First check if walking is allowed, then start walking
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  triggerWalk(collisionObjects) {
    if (this.checkWalkConditions()) return;

    this.walking = true;

    this.updateWalk(collisionObjects);
  }

  /**
   * Walk left or right, check for collisions, and update direction, horizontal position, and animation
   *
   * Variables update translate call in mega-man.css
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  updateWalk(collisionObjects) {
    if (this.checkWalkConditions()) {
      this.animationController.updateWalk(true);
      this.walking = false;
      return;
    }

    this.transformController.updateDirection(activeKeys.left);

    this.animationController.updateWalk();

    if (this.collisionController.checkHorizontalCollision(collisionObjects))
      return;

    // Update bounds after walking one frame
    const velocity = MegaMan.walkingSpeed * this.direction * Time.deltaTime;
    this.collisionController.updateHorizontalBounds(velocity);

    if (this.checkFallConditions(collisionObjects)) {
      this.disableGravity();
      this.enableFalling(true);
    }
  }

  /**
   * Check if only either left or right is pressed, not both, and not sliding
   *
   * @returns {boolean}
   */
  checkWalkConditions() {
    const leftPressed = activeKeys.left;
    const rightPressed = activeKeys.right;
    return (
      (!leftPressed && !rightPressed) ||
      (leftPressed && rightPressed) ||
      this.sliding
    );
  }

  /**
   * Check if not jumping and in the air
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   * @returns {boolean}
   */
  checkFallConditions(collisionObjects) {
    return (
      !this.jumping && !this.collisionController.checkOnGround(collisionObjects)
    );
  }

  /**
   * Attempt to trigger a slide if not already sliding, otherwise continue sliding
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  slide(collisionObjects) {
    if (this.sliding) {
      this.updateSlide(collisionObjects);
    } else {
      this.triggerSlide(collisionObjects);
    }
  }

  /**
   * First attempt to unlock the slide if buttons are released, then attempt to initiate a slide if
   * the buttons were released before, and currently on the ground, pressing both down and jump
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  triggerSlide(collisionObjects) {
    this.unlockSlide();

    if (this.slideLocked) return;

    if (this.grounded && activeKeys.down && activeKeys.jump) {
      this.sliding = true;
      this.slideLocked = true;
      this.slideTime = 0;
      this.animationController.updateSlide();
      this.updateSlide(collisionObjects);
    }
  }

  /**
   * Slide in the direction facing at a slightly faster speed than walking, check for collisions,
   * and horizontal position and animation
   *
   * Variables update translate call in mega-man.css
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  updateSlide(collisionObjects) {
    this.unlockSlide();

    // Increment slide time
    this.slideTime += MegaMan.slideSpeed * Time.deltaTime;

    // If slide time exceeds limit, disable sliding
    if (this.slideTime >= MegaMan.slideTimeLimit) {
      this.disableSlide();
      return;
    }

    // Check for collisions; stop sliding if a collision is detected
    if (this.collisionController.checkHorizontalCollision(collisionObjects)) {
      this.disableSlide();
      return;
    }

    // Calculate and apply horizontal slide velocity
    const velocity = MegaMan.slideSpeed * this.direction * Time.deltaTime;
    this.collisionController.updateHorizontalBounds(velocity);

    if (this.checkFallConditions(collisionObjects)) {
      this.disableGravity();
      this.disableSlide();
      this.enableFalling(true);
      return;
    }

    // Continue slide animation
    this.animationController.updateSlide();
  }

  /**
   * Allows Mega Man to slide again only when both the down and jump buttons are released or
   * one button is released, but the time has been reset, meaning the slide was completed
   */
  unlockSlide() {
    const downButtonPressed = activeKeys.down;
    const jumpButtonPressed = activeKeys.jump;
    const bothButtonsReleased = !downButtonPressed && !jumpButtonPressed;
    const timeWasReset = this.slideTime === 0;

    if (bothButtonsReleased || (!jumpButtonPressed && timeWasReset)) {
      this.slideLocked = false;
    }
  }

  /**
   * Reset slide conditions and animation
   */
  disableSlide() {
    this.animationController.updateSlide(true);
    this.sliding = false;
    this.slideTime = 0;
  }

  /**
   * Jump, check for collisions, and update vertical position and animation. Jump can only last as long
   * as jumpTimeLimit and must be on the ground to initiate, obviously
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  jump(collisionObjects) {
    if (!activeKeys.jump) {
      if (this.jumping) {
        this.jumping = false;
      }

      this.jumpButtonReleased = true;
      return;
    }

    // First frame of jumping
    if (!this.jumping && this.jumpButtonReleased && this.grounded)
      this.enableJumping();

    // Don't continue jumping if not jumping and not on the ground
    if (!this.jumping && !this.grounded) return;

    // Check ceiling above Mega Man or jump time past limit and stop jumping accordingly
    if (
      this.collisionController.checkHitCeiling(collisionObjects) ||
      this.jumpTime >= MegaMan.jumpTimeLimit
    ) {
      this.jumping = false;
      return;
    }

    // Calculate velocity for one frame
    const velocity = MegaMan.jumpingSpeed * Time.deltaTime;

    // Increment time to stop jumping too far
    this.jumpTime += velocity;

    // Update position variable to translate in CSS
    this.collisionController.updateVerticalBounds(-velocity);

    // In air = no longer grounded
    this.grounded = false;
  }

  /**
   * Set jump conditions and animation
   *
   * // TODO: Change this to triggerJump() and add if statement in here
   */
  enableJumping() {
    if (activeKeys.down || this.slideLocked) return;

    if (this.sliding) {
      this.animationController.updateSlide(true);
      this.sliding = false;
      this.slideTime = 0;
    }

    this.enableFalling();

    this.jumping = true;
    this.jumpButtonReleased = false;
  }

  /**
   * Set fall conditions and animation
   */
  enableFalling() {
    this.grounded = false;
    this.slideLocked = true;
    this.animationController.updateJump();
    this.animationController.updateWalk(true);
    this.animationController.updateSlide(true);
    this.animationController.updateAttack(true);
  }

  /**
   * Fall until ground is reached
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   */
  applyGravity(collisionObjects) {
    // Check not jumping or grounded
    if (this.jumping || this.grounded) return;

    // Check collision with ground
    if (this.collisionController.checkOnGround(collisionObjects)) {
      this.disableGravity();
      return;
    }

    // Calculate velocity and update y coordinate to move downwards
    const velocity = MegaMan.gravity * Time.deltaTime;
    this.collisionController.updateVerticalBounds(velocity);
  }

  /**
   * Reset grounded conditions and disable jump animation
   */
  disableGravity() {
    this.jumping = false;
    this.grounded = true;
    this.jumpTime = 0;
    this.animationController.updateJump(true);
  }

  /**
   * Update attack animation, shoot a bullet, and reset charge to prevent multiple charged shots
   */
  attack(force = false) {
    if (this.sliding) return;

    // Stop charging
    this.charging = force;

    // Allow shot before charge, but don't shoot two in succession unless charge past minimum
    if (this.charge < MegaMan.minChargeValue && !force) return;

    this.animationController.updateAttack();

    // Spawn bullet
    new Bullet(
      this.charge,
      this.direction,
      this.element.getBoundingClientRect()
    );

    this.charge = 0;
  }

  /**
   * Increment charge for Mega Man based on the duration of the attack button being held down.
   * Update charge animation based on charge value every time chargeInterval passes the rate
   */
  buildUpCharge() {
    if (!activeKeys.attack) {
      if (this.charging) this.attack();
      return;
    }

    // Always do initial attack with no charge
    if (!this.charging) this.attack(true);

    // Enable charging
    this.charging = true;

    // Increment interval by deltaTime
    const deltaTime = Time.deltaTime;
    this.chargeInterval += deltaTime;

    // Wait until charge rate has been reached to update animation
    if (this.chargeInterval < MegaMan.chargeIntervalRate) return;

    // Reset interval
    this.chargeInterval = 0;

    // Increment charge per frame
    this.charge += MegaMan.chargeRate * deltaTime;

    this.animationController.updateCharge(this.charge);
  }
}
