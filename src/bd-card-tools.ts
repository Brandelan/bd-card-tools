/**
 * This is your JavaScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */

/*
https://hackmd.io/@akrigline/ByHFgUZ6u/%2FF4CFuxqZSTOcqgixEf9M6A
https://github.com/League-of-Foundry-Developers/foundry-vtt-types/wiki/FAQ
*/

import { registerSettings } from "./module/settings";
import { preloadTemplates } from "./module/preloadTemplates";
import { CardDataConstructorData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/cardData";
import { DealtCardPlayerUI } from "./module/ui/bd-dealt-card-player-ui";
import chalk from "chalk";
import { handleSocketEvent, sendCardToGM } from "./module/card-launch-ui";
import { CardFuncs } from "./module/card-funcs";
import { DealersUI } from "./module/ui/bd-dealers-ui";
import { DealtCardGMUI } from "./module/ui/bd-dealt-card-gm-ui";

declare global {
  interface Window {
    CardToolsUI: DealtCardPlayerUI;
    GMCardToolsUI: DealtCardGMUI;
    DealUI: DealersUI;
    DisplayDealt: boolean;
    LaunchGMCardUI: () => {};
  }
}

export const MODULE_NAME = `bd-card-tools`;
export const MODULE_TYPE = `module`;

export class CardToolConstants {
  static ID = `bd-card-tools`;
  static UI_ID_GM = `bd-card-ui-gm`;
  static UI_ID_PLAYER = `bd-card-ui-player`;
  static DEAL_UI_ID = `deal-ui`;
  static DIR = `modules/${CardToolConstants.ID}`;
  static TEMPLATES = {
    DEAL_HBS: `modules/${CardToolConstants.ID}/templates/bd-deal.hbs`,
    PLAYER_HBS: `modules/${CardToolConstants.ID}/templates/bd-card-ui-player.hbs`,
    GM_HBS: `modules/${CardToolConstants.ID}/templates/bd-card-ui-gm.hbs`,
    HTML: `modules/${CardToolConstants.ID}/templates/bd-card-tools.html`,
  };
}

export function getGame(): Game {
  if (!(game instanceof Game)) {
    throw new Error("game is not initialized yet!");
  }
  return game;
}

export function getCanvas(): Canvas {
  if (!(canvas instanceof Canvas)) {
    throw new Error("game is not initialized yet!");
  }
  return canvas;
}

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once("init", async function () {
  console.log("bd-card-tools | Initializing bd-card-tools");

  // Assign custom classes and constants here
  window.LaunchGMCardUI = CardFuncs.launchGMCardUI;

  // Register custom module settings
  registerSettings();

  // Preload Handlebars templates
  await preloadTemplates();

  // Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once("setup", function () {
  // Do anything after initialization but before
  // ready
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once("ready", function () {
  /**------------------------------------------------------ */
  //setup our socket on event for all players
  getGame().socket?.on(
    MODULE_TYPE + "." + MODULE_NAME,
    (data: {
      title: string;
      img: string;
      description: string;
      title_front: string;
      title_back: string;
      desc_front: string;
      desc_back: string;
      img_front: string;
      img_back: string;
      width: number;
      height: number;
      isFaceDown: boolean;
    }) => {
      handleSocketEvent(data);
    }
  );

  /**------------------------------------------------------ */
  /**Test our card tools */
});

/*
 * hook on Dealing Cards
 */
Hooks.on("dealCards", sendCardToGM);

/*
 * Helper functions
 */
