import { CardTools } from "../../bd-card-tools";
const chalk = require("chalk");

export interface CardData {
  title: string;
  img: string;
  desc: string;
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

export class CardToolsUI extends FormApplication<UIOptions, any, CardData> {
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
      width: 576,
      // height: 640,
      template: CardTools.TEMPLATES.HBS,
      id: CardTools.ID,
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
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  async _updateObject(event: Event, formData?: object): Promise<void> {
    //console.log(formData.exampleInput);
  }
}
