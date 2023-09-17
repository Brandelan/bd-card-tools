import { CardToolConstants } from "../../bd-card-tools";
import { dealToPlayers, flipCard } from "../card-launch-ui";
const chalk = require("chalk");

export interface CardData {
  title: string;
  img: string;
  desc: string;
  title_front: string;
  title_back: string;
  desc_front: string;
  desc_back: string;
  img_front: string;
  img_back: string;
  isFaceDown: boolean;
}

export interface UIOptions extends FormApplicationOptions {
  classes: string[];
  popOut: boolean;
  width: number;
  template: string;
  id: string;
  title: string;
  closeOnSubmit: boolean;
}

export class DealtCardGMUI extends FormApplication<UIOptions, any, CardData> {
  debug: boolean = false;

  /**
   * Setup our default options for the UI window
   * get this from
   */
  static override get defaultOptions(): FormApplicationOptions {
    const defaults = super.defaultOptions;

    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      width: 640,
      height: 800,
      template: CardToolConstants.TEMPLATES.GM_HBS,
      id: CardToolConstants.UI_ID_GM,
      title: "Tarot Card",
      closeOnSubmit: false,
      resizable: true,
    });
  }

  /**
   * Set our default data in the accompanying HTML file.
   * These are set with handlebarrs {{width}}, {{height}}, etc
   * https://github.com/League-of-Foundry-Developers/foundry-vtt-types/wiki/Creating-custom-FormApplications#specifying-a-custom-type-for-the-return-type-of-getdata
   */
  override async getData(): Promise<CardData> {
    console.log(
      `getData in CardUI with title: ${this.object.title}, img path ${this.object.img}, and description ${this.object.desc}`
    );
    return {
      title: this.object.title,
      img: this.object.img,
      desc: this.object.desc,
      isFaceDown: this.object.isFaceDown,
      title_front: this.object.title_front,
      title_back: this.object.title_back,
      desc_front: this.object.desc_front,
      desc_back: this.object.desc_back,
      img_front: this.object.img_front,
      img_back: this.object.img_back,
    };
  }

  public async setData(
    title: string,
    img: string,
    desc: string,
    isFaceDown: boolean
  ) {
    this.object.title = title;
    this.object.img = img;
    this.object.desc = desc;
    this.object.isFaceDown = isFaceDown;

    await this.render(true);
  }

  activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);
    console.log(chalk.blue("Activate listeners called!"));
    this.debug && console.log(chalk.blue("Activate listeners called!"));

    this.debug && console.log(html);
    html.find('button[name="flip"]').on("click", (event) => {
      this.debug && console.log("Flipping Card");
      this._onFlipCard(html);
    });

    this.debug && console.log(html);
    html.find('button[name="dealToPlayers"]').on("click", (event) => {
      this.debug && console.log("Dealing To Players");
      this._onDealToPlayers(html);
    });
  }

  async _onFlipCard(html: JQuery<HTMLElement>) {
    flipCard();
  }

  async _onDealToPlayers(html: JQuery<HTMLElement>) {
    const data = await this.getData();
    console.log("deal to players:");
    console.log(data);
    dealToPlayers(data);
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  async _updateObject(event: Event, formData?: object): Promise<void> {
    //console.log(formData.exampleInput);
  }
}
