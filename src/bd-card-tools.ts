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
import { CardData, CardToolsUI, UIOptions } from "./module/ui/bd-card-tools-ui";
import chalk from "chalk";

declare global {
  interface Window {
    CardToolsUI: FormApplication<UIOptions, CardData>;
  }
}

export const MODULE_NAME = `bd-card-tools`;
export const MODULE_TYPE = `module`;

export class CardTools {
  static ID = `bd-card-tools`;
  static DIR = `modules/${CardTools.ID}`;
  static TEMPLATES = {
    HBS: `modules/${CardTools.ID}/templates/bd-card-tools.hbs`,
    HTML: `modules/${CardTools.ID}/templates/bd-card-tools.html`,
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

export async function openUI(
  title: string,
  img: string,
  description: string,
  width: number,
  height: number
) {
  console.log(
    chalk.blue(
      `Generate Card with title: ${title}, img path ${img}, and description ${description}`
    )
  );
  window.CardToolsUI = new CardToolsUI(
    {
      title: title,
      img: img,
      desc: description,
    },
    {}
  );
  await window.CardToolsUI.render(true);
}

export function popOutCard(
  title: string,
  img: string,
  description: string,
  width: number,
  height: number
) {
  let d = new Dialog(
    {
      title: title,
      content: `
                <form class="flexcol">
                  <div class="form-group">                              
                    <img src=${img}></img>
                  </div>    
                  <div class="form-group">                              
                    <p>${description}</p>
                  </div>                            
                </form>
                `,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: "Flip",
          callback: () => {
            //flip front to back*********************
            d.render(true);
          },
        },
      },
      //default: "two",
      close: () => console.log("Closed window!"),
    },
    {
      width: width,
      height: height,
    }
  );
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
Hooks.once("ready", function () {
  getGame().socket?.on(
    MODULE_TYPE + "." + MODULE_NAME,
    (data: {
      title: string;
      img: string;
      description: string;
      width: number;
      height: number;
    }) => {
      handleSocketEvent(data);
    }
  );
});

/*
 * hook on Dealing Cards
 */
Hooks.on("dealCards", eventToAll);

/*
 * Helper functions
 */

/**
 * Send our card event to everyone connected including sender
 * @param origin the card deck being dealt from
 * @param destinations the destination deck/stack/pile
 * @param context the creation data for the card being dealt
 */
export function eventToAll(
  origin: Cards,
  destinations: Cards[],
  context: {
    action: string;
    toCreate: any[][];
    fromUpdate: any[];
    fromDelete: any[];
  }
) {
  if (context.toCreate.length > 0) {
    for (let index = 0; index < context.toCreate.length; index++) {
      const createdOuter = context.toCreate[index];

      if (createdOuter.length > 0) {
        for (let index = 0; index < createdOuter.length; index++) {
          const createdInner = createdOuter[index] as CardDataConstructorData;
          console.log(`-------------createdInner--------`);
          console.log(createdInner);

          //early exit
          if (createdInner.faces == null || createdInner.faces.length <= 0) {
            continue;
          }

          if (createdInner.back == null) {
            continue;
          }

          //chose our image
          const faceImage = createdInner.faces[0].img
            ? createdInner.faces[0].img
            : "";
          const backImage = createdInner.back.img ? createdInner.back.img : "";

          const isFaceDown = createdInner.face == null ? true : false;

          const title =
            createdInner.faces[0].name != null
              ? createdInner.faces[0].name
              : "";
          const description =
            createdInner.description != null ? createdInner.description : "";
          const img = isFaceDown ? backImage : faceImage;
          const width = createdInner.width == null ? 600 : createdInner.width;
          const height =
            createdInner.height == null ? 800 : createdInner.height;

          new Promise((resolve) => {
            // This is the acknowledgement callback
            const ackCb = (response) => {
              console.log(`socket emit started`);
              resolve(response);
            };

            console.log(
              `-----------socket emit for ${
                MODULE_TYPE + "." + MODULE_NAME
              }-----------`
            );

            //Emit the data to everyone!
            getGame().socket?.emit(
              MODULE_TYPE + "." + MODULE_NAME,
              {
                title: title,
                img: img,
                description: description,
                width: width,
                height: height,
              },
              ackCb
            );

            //send the window to the instigator as well
            handleSocketEvent({
              title: title,
              img: img,
              description: description,
              width: width,
              height: height,
            });
          });
        }
      }
    }
  }
  console.log(context);
}

/**
 *
 * @param data the card creation data
 */
export async function handleSocketEvent(data: {
  title: string;
  img: string;
  description: string;
  width: number;
  height: number;
}) {
  //popOutCard(data.title, data.img, data.description, data.width, data.height);
  await openUI(data.title, data.img, data.description, data.width, data.height);
  console.log(`-----------handle socket event called---------------`);
  console.log(data.title, data.img, data.description, data.width, data.height); // expected 'Foo'
}
