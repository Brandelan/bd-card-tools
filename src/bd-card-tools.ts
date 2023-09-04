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

declare global {}

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

export function popOutCard(title: string) {
  let d = new Dialog({
    title: "Test Dialog",
    content: "<p>You must choose either Option 1, or Option 2</p>",
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Option One",
        callback: () => console.log("Chose One"),
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Option Two",
        callback: () => console.log("Chose Two"),
      },
    },
    default: "two",
    render: (html) =>
      console.log("Register interactivity in the rendered dialog"),
    close: (html) =>
      console.log("This always is logged no matter which option is chosen"),
  });
  d.render(true);
}

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once("init", async function () {
  console.log("bd-card-tools | Initializing bd-card-tools");

  // Assign custom classes and constants here

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
Hooks.once("ready", function () {});

Hooks.on(
  "dealCards",
  (
    origin: Cards,
    destinations: Cards[],
    context: {
      action: string;
      toCreate: any[][];
      fromUpdate: any[];
      fromDelete: any[];
    }
  ) => {
    // console.log(`origin is: `);
    // console.log(origin);
    // console.log(`destinations are: `);
    // console.log(destinations);

    for (let index = 0; index < destinations.length; index++) {
      const element = destinations[index];

      //   console.log(`destination is: `);
      //   console.log(element);
      //   console.log(`desintation cards is: `);
      //   console.log(element.cards);
    }

    console.log(
      "-------------Create an image pop up of the first face of each dealt card if not face down--------"
    );

    if (context.toCreate.length > 0) {
      for (let index = 0; index < context.toCreate.length; index++) {
        const createdOuter = context.toCreate[index];
        // console.log(`-------------createOuter${index}--------`);
        // console.log(context.toCreate);

        if (createdOuter.length > 0) {
          for (let index = 0; index < createdOuter.length; index++) {
            const createdInner = createdOuter[index] as CardDataConstructorData;

            //if face is null, that means the card is dealt face down
            if (
              createdInner.face != null &&
              createdInner.faces != null &&
              createdInner.faces.length > 0
            ) {
              let img =
                createdInner.faces[0].img != null
                  ? createdInner.faces[0].img
                  : "";

              // Construct the Application instance
              const ip = new ImagePopout(img);

              // Display the image popout
              ip.render(true);

              // Share the image with other connected players
              ip.shareImage();
            }
          }
        }
      }
    }
    console.log(context);
    //const ip = new ImagePopout(origin.th);
  }
);
