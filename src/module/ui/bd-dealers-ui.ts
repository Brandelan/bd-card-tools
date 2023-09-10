import { CardToolConstants, getGame } from "../../bd-card-tools";
import { CardFuncs } from "../card-funcs";
import { flipCard } from "../card-launch-ui";
const chalk = require("chalk");

export interface DealersData {
  decks: string;
  discards: string;
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

export class DealersUI extends FormApplication<UIOptions, any, DealersData> {
  debug: boolean = true;

  /**
   * Setup our default options for the UI window
   * get this from
   */
  static override get defaultOptions(): FormApplicationOptions {
    const defaults = super.defaultOptions;
    console.log(`get default options`);

    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      width: 576,
      //height: 1024,
      template: CardToolConstants.TEMPLATES.DEAL_HBS,
      id: CardToolConstants.DEAL_UI_ID,
      title: "Deal Cards",
      closeOnSubmit: false,
      resizable: true,
    });
  }

  /**
   * Set our default data in the accompanying HTML file.
   * These are set with handlebarrs {{width}}, {{height}}, etc
   * https://github.com/League-of-Foundry-Developers/foundry-vtt-types/wiki/Creating-custom-FormApplications#specifying-a-custom-type-for-the-return-type-of-getdata
   */
  override async getData(): Promise<DealersData> {
    console.log(
      `GetData()\nDecks:\n${this.object.decks}\nDiscards\n${this.object.discards}`
    );

    return {
      decks: this.object.decks,
      discards: this.object.discards,
    };
  }

  async activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);
    console.log(chalk.blue("Activate listeners called!"));
    this.debug && console.log(chalk.blue("Activate listeners called!"));

    this.debug && console.log(html);

    html.find('[name="decks"]').on("change", (event) => {
      this.debug && console.log("decks changed");
      let discard = html.find('[name="decks"]').val();
      console.log(discard);
    });
    html.find('[name="discards"]').on("change", (event) => {
      this.debug && console.log("discards changed");
      let discard = html.find('[name="discards"]').val();
      console.log(discard);
    });
    html.find('button[name="deal"]').on("click", async (event) => {
      this.debug && console.log("on deal");
      await this._onDeal(html);
    });
    html.find('button[name="reset"]').on("click", async (event) => {
      this.debug && console.log("Resetting Decks");
      const deck = html.find(`[name="decks"]`).find(":selected").val();
      if (deck == null || typeof deck != "string") {
        return;
      }
      await this._onReset(deck);
    });
    html.find('checkbox[name="display"]').on("click", (event) => {
      let checked = html.find(`[name="display"]`).is(":checked");
      this.debug && console.log(`checkbox is ${checked}`);
      window.DisplayDealt = checked;
    });
  }

  /**
   *
   * @param html
   * @param el
   * @param type
   */
  async _onDeal(html: JQuery<HTMLElement>) {
    const deck = html.find(`[name="decks"]`).find(":selected").val();
    const discard = html.find(`[name="discards"]`).find(":selected").val();

    if (
      deck == null ||
      typeof deck != "string" ||
      discard == null ||
      typeof discard != "string"
    ) {
      return;
    }

    this.debug && console.log(chalk.blue(`Dealing ${deck} to ${discard}`));

    const deck_actual = getGame()?.cards?.getName(deck);
    const discard_actual = getGame()?.cards?.getName(discard);

    if (deck_actual == null || discard_actual == null) {
      console.log(
        `could not find deck with name ${deck} or discard with name ${discard}`
      );
      return;
    }

    //if there are no available cards, we must reset
    if (deck_actual.availableCards.length <= 0) {
      await this._askForReset(deck);
    }

    //make sure we actually want to display the resulting deal to everyone
    window.DisplayDealt = html.find('[name="display"]').is(":checked");

    console.log(`display dealt is ${window.DisplayDealt}`);

    const deck_ret = await deck_actual.deal([discard_actual], 1, {
      how: foundry.CONST.CARD_DRAW_MODES.RANDOM,
    });
  }

  async _askForReset(deck: string) {
    let d = await new Dialog({
      title: "Deck Choice",
      content: `
          <div class="form-group">
            <div>
            There are no more available cards to deal.
            </div>            
          </div>
      `,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: "Reset Deck",
          callback: async (html: JQuery<HTMLElement>) => {
            await this._onReset(deck);
          },
        },
        two: {
          icon: '<i class="fas fa-check"></i>',
          label: "Cancel",
          callback: (html) => {},
        },
      },
      default: "two",
    });
    d.render(true);
  }

  /**
   * Reset the selected deck
   * @param html the jquery for the htmlelement we're exmaining
   * @returns
   */
  async _onReset(deck: string) {
    console.log(`On reset called`);

    const deck_actual = getGame()?.cards?.getName(deck);

    if (deck_actual == null) {
      console.log(`could not find deck with name ${deck}`);
      return;
    }
    deck_actual.resetDialog();

    // if (window.CardToolsUI) {
    //   window.CardToolsUI.close();
    // }
  }
  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  async _updateObject(event: Event, formData?: object): Promise<void> {
    //console.log(formData.exampleInput);
  }
}
