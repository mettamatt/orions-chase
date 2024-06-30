// assets.js
import { elements } from "./game.js";
import { getAsset } from "./utils.js";
import { log } from "./utils.js";

/**
 * Sets up the game visuals by applying background images to elements.
 * @param {Object} assetList - The list of assets to set up.
 */
export function setupGameVisuals(assetList) {
  assetList.images.forEach((asset) => {
    const elementName = asset.split("/").pop().split(".")[0];
    const element =
      elements[elementName === "background" ? "gameContainer" : elementName];
    const image = getAsset("images", asset);
    if (element && image) {
      element.style.backgroundImage = `url(${image.src})`;
    } else {
      log(`Failed to set background image for ${elementName}`, "warn");
    }
  });
}
