import MegaMan from "../classes/mega-man.js";
import Window from "./window.js";
import { megaMan, collisionObjects } from "../index.js";

// Maintains keys being held down
export const activeKeys = {
  up: false,
  down: false,
  left: false,
  right: false,
  jump: false,
  attack: false,
  contextMenu: false,
};

function resetActiveKeys() {
  Object.keys(activeKeys).forEach((key) => {
    activeKeys[key] = false;
  });
}

document.addEventListener("keydown", (event) => {
  if (activeKeys.contextMenu) return;

  switch (event.key) {
    case "ArrowUp":
    case "w":
      activeKeys.up = true;
      break;
    case "ArrowDown":
    case "s":
      activeKeys.down = true;
      break;
    case "ArrowLeft":
    case "a":
      activeKeys.left = true;
      break;
    case "ArrowRight":
    case "d":
      activeKeys.right = true;
      break;
    case " ":
    case "z":
      activeKeys.jump = true;
      break;
    case "Shift":
    case "x":
      activeKeys.attack = true;
      break;
  }
});

document.addEventListener("keyup", (event) => {
  if (activeKeys.contextMenu) return;

  switch (event.key) {
    case "ArrowUp":
    case "w":
      activeKeys.up = false;
      break;
    case "ArrowDown":
    case "s":
      activeKeys.down = false;
      break;
    case "ArrowLeft":
    case "a":
      activeKeys.left = false;
      break;
    case "ArrowRight":
    case "d":
      activeKeys.right = false;
      break;
    case " ":
    case "z":
      activeKeys.jump = false;
      break;
    case "Shift":
    case "x":
      activeKeys.attack = false;
      break;
  }
});

window.addEventListener("resize", (event) => {
  resetActiveKeys();
  Window.resize(MegaMan.collisionDistance, megaMan, collisionObjects);
  resetActiveKeys();
});

document.addEventListener("mousedown", (event) => {
  switch (event.button) {
    case 0:
      activeKeys.attack = true;
      break;
  }
});

document.addEventListener("mouseup", (event) => {
  switch (event.button) {
    case 0:
      activeKeys.attack = false;
      break;
  }
});

// Stop input when right clicking for context menu
document.addEventListener("contextmenu", (event) => {
  resetActiveKeys();
  activeKeys.contextMenu = true;
});

document.addEventListener("click", (event) => {
  activeKeys.contextMenu = false;
});
