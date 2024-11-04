import MegaMan from "./mega-man.js";
import Window from "../utils/window.js";

export default class MegaManCollisionController {
  constructor(element, transformController) {
    this.element = element;
    this.transformController = transformController;
  }

  /**
   * Check for collisions either the edges of the window or any of the collisionObjects by
   * calculating the distance to each, ensuring they are within the collidable bounds, and
   * that Mega Man is moving towards them to prevent sticking to walls after colliding and
   * jittery jumps from distance comparisons
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   * @returns {boolean}
   */
  checkHorizontalCollision(collisionObjects) {
    // Check left and right edge of page
    const leftDistance = Math.abs(Window.left - this.bounds.left);
    const rightDistance = Math.abs(Window.right - this.bounds.right);
    if (
      (leftDistance <= MegaMan.collisionDistance &&
        this.transformController.direction == -1) ||
      (rightDistance <= MegaMan.collisionDistance &&
        this.transformController.direction == 1)
    ) {
      return true;
    }

    // Check collision objects
    for (const object of collisionObjects) {
      if (this.checkWithinVerticalBounds(object)) continue;

      // Check close enough to collide with
      const leftDistance = Math.abs(object.right - this.bounds.left);
      const rightDistance = Math.abs(object.left - this.bounds.right);
      if (
        (leftDistance > MegaMan.collisionDistance &&
          this.transformController.direction == -1) ||
        (rightDistance > MegaMan.collisionDistance &&
          this.transformController.direction == 1)
      ) {
        continue;
      }

      return true;
    }

    return false;
  }

  /**
   * Check for collisions either the top of the window or any of the collisionObjects by
   * calculating the distance to each and ensuring they are within the collidable bounds
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   * @returns {boolean}
   */
  checkHitCeiling(collisionObjects) {
    // Check hit ceiling on top of page
    const distance = Math.abs(Window.top - this.bounds.top);
    if (distance <= MegaMan.collisionDistance) return true;

    // Check all possible ceiling objects
    for (const object of collisionObjects) {
      // Check Mega Man above the object
      if (this.bounds.bottom < object.bottom) continue;

      // Check not within x bounds of object
      if (this.checkWithinHorizontalBounds(object)) continue;

      // Check close enough to collide with
      const distance = Math.abs(object.bottom - this.bounds.top);
      if (distance > MegaMan.collisionDistance) continue;

      return true;
    }

    return false;
  }

  /**
   * Check for collisions either the bottom of the window or any of the collisionObjects by
   * calculating the distance to each and ensuring they are within the collidable bounds
   *
   * @param {CollisionObject[]} [collisionObjects=[]] - Objects to collide with
   * @returns {boolean}
   */
  checkOnGround(collisionObjects) {
    // Check on ground at bottom of page
    const distance = Math.abs(Window.bottom - this.bounds.bottom);
    if (distance <= MegaMan.collisionDistance) {
      return true;
    }

    // Check all possible ground objects
    for (const object of collisionObjects) {
      // Check Mega Man below the object
      if (this.bounds.bottom > object.top) continue;

      // Check not within x bounds of object
      if (this.checkWithinHorizontalBounds(object)) continue;

      // Check close enough to collide with
      const distance = Math.abs(object.top - this.bounds.bottom);
      if (distance > MegaMan.collisionDistance) continue;

      this.updateVerticalBounds(distance);

      return true;
    }

    // TODO: Check failing very randomly while sliding / jumping, maybe even just walking. Likely some kind of bounds check error

    return false;
  }

  /**
   * Check if the given object is within the horizontal bounds of Mega Man
   *
   * @param {DOMRect} object - Bounding rectangle of the object to check
   * @returns {boolean} - True if the object is within Mega Man's X bounds, false otherwise.
   */
  checkWithinHorizontalBounds(object) {
    const left = this.bounds.left + MegaMan.collisionDistance;
    const right = this.bounds.right - MegaMan.collisionDistance;
    return (
      (right < object.left || left > object.right) &&
      (left < object.right || right > object.left)
    );
  }

  /**
   * Check if the given object is within the vertical bounds of Mega Man
   *
   * @param {DOMRect} object - Bounding rectangle of the object to check
   * @returns {boolean} - True if the object is within Mega Man's Y bounds, false otherwise.
   */
  checkWithinVerticalBounds(object) {
    const top = this.bounds.top + MegaMan.collisionDistance;
    const bottom = this.bounds.bottom - MegaMan.collisionDistance;
    return (
      (top < object.bottom || bottom > object.top) &&
      (bottom < object.top || top > object.bottom)
    );
  }

  /**
   * Update x-coordinate for positioning and horizontal bounds for collision detection
   *
   * @param {int} deltaX
   */
  updateHorizontalBounds(deltaX) {
    this.transformController.updateX(deltaX);

    this.bounds.left += deltaX;
    this.bounds.right += deltaX;
  }

  /**
   * Update the y-coordinate for positioning and vertical bounds for collision detection
   *
   * @param {int} deltaY
   */
  updateVerticalBounds(deltaY) {
    this.transformController.updateY(deltaY);

    this.bounds.top += deltaY;
    this.bounds.bottom += deltaY;
  }

  /**
   * Update bounds in global context to determine collisions
   *
   * Only to be used during resize event and constructor to prevent constant refresh of the document
   */
  updateBounds() {
    const rect = this.element.getBoundingClientRect();
    this.bounds = {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
    };
  }
}
