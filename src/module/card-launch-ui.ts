import { CardDataConstructorData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/cardData";
import { MODULE_NAME, MODULE_TYPE, getGame } from "../bd-card-tools";
import { DealtCardPlayerUI } from "./ui/bd-dealt-card-player-ui";
import chalk from "chalk";
import { CardData, DealtCardGMUI } from "./ui/bd-dealt-card-gm-ui";

/**
 * Open the player's card UI
 * @param title
 * @param img
 * @param description
 * @param title_front
 * @param title_back
 * @param desc_front
 * @param desc_back
 * @param img_front
 * @param img_back
 * @param width
 * @param height
 * @param isFaceDOwn
 */
export async function openPlayerCardUI(
  title: string,
  img: string,
  description: string,
  title_front: string,
  title_back: string,
  desc_front: string,
  desc_back: string,
  img_front: string,
  img_back: string,
  width: number,
  height: number,
  isFaceDOwn: boolean
) {
  console.log(
    chalk.blue(
      `Generate Card with title: ${title}, img path ${img}, and description ${description}`
    )
  );

  window.CardToolsUI = new DealtCardPlayerUI(
    {
      title: title,
      img: img,
      desc: description,
      isFaceDown: isFaceDOwn,
      title_front: title_front,
      title_back: title_back,
      desc_front: desc_front,
      desc_back: desc_back,
      img_front: img_front,
      img_back: img_back,
    },
    {}
  );
  await window.CardToolsUI.render(true);
}

/**
 * Open the GM's card first so he can decide what to do with it
 * @param title
 * @param img
 * @param description
 * @param title_front
 * @param title_back
 * @param desc_front
 * @param desc_back
 * @param img_front
 * @param img_back
 * @param width
 * @param height
 * @param isFaceDOwn
 */
export async function openGMCardUI(
  title: string,
  img: string,
  description: string,
  title_front: string,
  title_back: string,
  desc_front: string,
  desc_back: string,
  img_front: string,
  img_back: string,
  width: number,
  height: number,
  isFaceDOwn: boolean
) {
  console.log(
    chalk.blue(
      `Generate Card with title: ${title}, img path ${img}, and description ${description}`
    )
  );
  window.GMCardToolsUI = new DealtCardGMUI(
    {
      title: title,
      img: img,
      desc: description,
      isFaceDown: isFaceDOwn,
      title_front: title_front,
      title_back: title_back,
      desc_front: desc_front,
      desc_back: desc_back,
      img_front: img_front,
      img_back: img_back,
    },
    {}
  );
  await window.GMCardToolsUI.render(true);
}

/**
 * Send our card event to everyone connected including sender
 * @param origin the card deck being dealt from
 * @param destinations the destination deck/stack/pile
 * @param context the creation data for the card being dealt
 */
export function sendCardToGM(
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

          const front_title =
            createdInner.faces[0].name != null
              ? createdInner.faces[0].name
              : "";
          const front_description =
            createdInner.description != null ? createdInner.description : "";

          // actual display items
          const img = isFaceDown ? backImage : faceImage;
          const title = isFaceDown ? "" : front_title;
          const description = isFaceDown ? "" : front_description;

          const width = createdInner.width == null ? 600 : createdInner.width;
          const height =
            createdInner.height == null ? 800 : createdInner.height;

          openGMCardUI(
            title,
            img,
            description,
            front_title,
            "",
            front_description,
            "",
            faceImage,
            backImage,
            width,
            height,
            isFaceDown
          );
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
  title_front: string;
  title_back: string;
  desc_front: string;
  desc_back: string;
  img_front: string;
  img_back: string;
  width: number;
  height: number;
  isFaceDown: boolean;
}) {
  //popOutCard(data.title, data.img, data.description, data.width, data.height);
  await openPlayerCardUI(
    data.title,
    data.img,
    data.description,
    data.title_front,
    data.title_back,
    data.desc_front,
    data.desc_back,
    data.img_front,
    data.img_back,
    data.width,
    data.height,
    data.isFaceDown
  );
  console.log(`-----------handle socket event called---------------`);
  console.log(data.title, data.img, data.description, data.width, data.height); // expected 'Foo'
}

/**
 * Choose to deal this card to all players
 * @returns
 */
export async function dealToPlayers(data: CardData) {
  //Only the GM can flip the card!
  if (!getGame()?.user?.isGM) return;

  //const data = await window.GMCardToolsUI.getData();

  if (data.isFaceDown) {
    data.img = data.img_back;
    data.title = data.title_back;
    data.desc = data.desc_back;
  } else {
    data.img = data.img_front;
    data.title = data.title_front;
    data.desc = data.desc_front;
  }

  emitCardDisplay(
    data.title,
    data.img,
    data.desc,
    data.title_front,
    data.title_back,
    data.desc_front,
    data.desc_back,
    data.img_front,
    data.img_back,
    0,
    0,
    data.isFaceDown,
    false
  );
}

/**
 * Flip the card, GM only option
 * @returns
 */
export async function flipCard() {
  if (window.CardToolsUI == null) {
    console.log("no card to flip");
  }

  //Only the GM can flip the card!
  if (!getGame()?.user?.isGM) return;

  const data = await window.CardToolsUI.getData();

  if (data.isFaceDown) {
    window.CardToolsUI.setData(
      data.title_front,
      data.img_front,
      data.desc_front,
      false
    );
  } else {
    window.CardToolsUI.setData(
      data.title_back,
      data.img_back,
      data.desc_back,
      true
    );
  }
  const dataFlipped = await window.CardToolsUI.getData();

  emitCardDisplay(
    dataFlipped.title,
    dataFlipped.img,
    dataFlipped.desc,
    dataFlipped.title_front,
    dataFlipped.title_back,
    dataFlipped.desc_front,
    dataFlipped.desc_back,
    dataFlipped.img_front,
    dataFlipped.img_back,
    0,
    0,
    dataFlipped.isFaceDown,
    false
  );
}

function emitCardDisplay(
  title: string,
  img: string,
  description: string,
  title_front: string,
  title_back: string,
  desc_front: string,
  desc_back: string,
  img_front: string,
  img_back: string,
  width: number,
  height: number,
  isFaceDown: boolean,
  emit_to_sender: boolean
) {
  new Promise((resolve) => {
    // This is the acknowledgement callback
    const ackCb = (response) => {
      console.log(`socket emit started`);
      resolve(response);
    };

    console.log(
      `-----------socket emit for ${MODULE_TYPE + "." + MODULE_NAME}-----------`
    );

    //Emit the data to everyone!
    getGame().socket?.emit(
      MODULE_TYPE + "." + MODULE_NAME,
      {
        title: title,
        img: img,
        description: description,
        img_back: img_back,
        img_front: img_front,
        desc_back: desc_back,
        desc_front: desc_front,
        title_front: title_front,
        title_back: title_back,
        width: width,
        height: height,
        isFaceDown: isFaceDown,
      },
      ackCb
    );

    if (emit_to_sender) {
      //send the window to the instigator as well
      handleSocketEvent({
        title: title,
        img: img,
        description: description,
        img_back: img_back,
        img_front: img_front,
        desc_back: desc_back,
        desc_front: desc_front,
        title_front: title_front,
        title_back: title_back,
        width: width,
        height: height,
        isFaceDown: isFaceDown,
      });
    }
  });
}

/***********************************************************
 *
 * DEPRECATED
 *
 ***********************************************************/

/**
 * @deprecated
 * Send our card event to everyone connected including sender
 * @param origin the card deck being dealt from
 * @param destinations the destination deck/stack/pile
 * @param context the creation data for the card being dealt
 */
export function sendCardDisplayToAll(
  origin: Cards,
  destinations: Cards[],
  context: {
    action: string;
    toCreate: any[][];
    fromUpdate: any[];
    fromDelete: any[];
  }
) {
  if (!window.DisplayDealt) {
    return;
  }
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

          const front_title =
            createdInner.faces[0].name != null
              ? createdInner.faces[0].name
              : "";
          const front_description =
            createdInner.description != null ? createdInner.description : "";

          // actual display items
          const img = isFaceDown ? backImage : faceImage;
          const title = isFaceDown ? "" : front_title;
          const description = isFaceDown ? "" : front_description;

          const width = createdInner.width == null ? 600 : createdInner.width;
          const height =
            createdInner.height == null ? 800 : createdInner.height;

          emitCardDisplay(
            title,
            img,
            description,
            front_title,
            "",
            front_description,
            "",
            faceImage,
            backImage,
            width,
            height,
            isFaceDown,
            true
          );
        }
      }
    }
  }
  console.log(context);
}

/**
 * @deprecated
 * Pop out the card to a simple dialog
 * @param title
 * @param img
 * @param description
 * @param width
 * @param height
 */
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
