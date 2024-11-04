export default class MegaManTransformController {
  direction = 1; // Left = -1, right = 1

  static left = -1;
  static right = -1;

  /**
   * Sets the default coordinates to the spawn area coordinates with a higher y value to allow
   * Mega Man to fall into place at the start of the spawn animation
   *
   * @param {Element} element
   * @param {animationController} animationController
   */
  constructor(element, animationController) {
    this.element = element;
    this.animationController = animationController;
    this.setSpawnCoords();
  }

  /**
   * Defines the coordinates at spawn to track position in local context. Coordinates are not
   * used for collisions, but for visual position on screen only. Animation controller used
   * to update CSS position variables
   */
  setSpawnCoords() {
    const rect = this.element.getBoundingClientRect();
    this.spawnCoordinates = {
      x: window.scrollX + rect.left,
      y: window.scrollY - rect.top,
    };

    this.coords = {
      x: this.spawnCoordinates.x,
      y: this.spawnCoordinates.y * 2,
    };

    this.animationController.updateX(0);
    this.animationController.updateY(this.coords.y);
  }

  /**
   * Update x-coordinate value and CSS property to update position on screen
   *
   * @param {number} deltaX
   */
  updateX(deltaX) {
    this.coords.x += deltaX;

    // Offset position by spawn area x-coordinate
    this.animationController.updateX(this.coords.x - this.spawnCoordinates.x);
  }

  /**
   * Update y-coordinate value and CSS property to update position on screen
   *
   * @param {number} deltaY
   */
  updateY(deltaY) {
    this.coords.y += deltaY;
    this.animationController.updateY(this.coords.y);
  }

  /**
   * Update direction value and CSS property to update direction Mega Man facing on screen
   *
   * @param {boolean} leftPressed
   */
  updateDirection(leftPressed) {
    this.direction = leftPressed ? -1 : 1;
    this.animationController.updateDirection(this.direction);
  }
}
