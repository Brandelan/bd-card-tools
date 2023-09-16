import { getGame } from "../bd-card-tools";
import { DealersUI } from "./ui/bd-dealers-ui";

export abstract class CardFuncs {
  /**
   * Get all card stacks in the game
   * @returns an object containing all the decks, piles, and hands in the system
   */
  public static getStacks() {
    const stacks: CardStacks | undefined = getGame().cards;

    if (stacks == null) {
      return;
    }

    const piles: StoredDocument<Cards>[] = [];
    const decks: StoredDocument<Cards>[] = [];
    const hands: StoredDocument<Cards>[] = [];

    for (let stack of stacks) {
      console.log(`stack type is ${stack.type}`);
      console.log(`stack name is ${stack.name}`);

      switch (stack.type) {
        case "deck":
          decks.push(stack);
          break;
        case "pile":
          piles.push(stack);
          break;
        case "hand":
          hands.push(stack);
          break;

        default:
          break;
      }
    }

    console.log(`stacks are:`);
    console.log(stacks);

    return { decks: decks, piles: piles, hands: hands };
  }

  /**
   * Public hook to launch our dealing UI, only GMs can do this
   * @returns
   */
  public static async launchGMCardUI() {
    //Only the GM can flip the card!
    if (!getGame()?.user?.isGM) return;

    console.log(`launching dealUI`);

    const stacks = CardFuncs.getStacks();
    const decks = CardFuncs.buildHTMLSelectionOptions(stacks?.decks);
    const discards = CardFuncs.buildHTMLSelectionOptions(stacks?.piles);

    console.log(`getData for DealUI`);
    console.log(`Stacks are:`);
    console.log(stacks);
    console.log(`Decks are:`);
    console.log(decks);
    console.log(`Discards are:`);
    console.log(discards);

    window.DealUI = new DealersUI(
      {
        decks: decks,
        discards: discards,
      },
      {}
    );
    window.DealUI.render(true);
  }

  /**
   * A down and dirty UI for the cards, doesnt do anything as I"ve moved over to a form application
   * @returns
   */
  public static async createStackBox() {
    const stacks = this.getStacks();

    if (stacks == null || stacks.decks == null) {
      return;
    }

    let availDecksHtml = this.buildHTMLSelectionOptions(stacks.decks);
    let avilDiscardsHtml = this.buildHTMLSelectionOptions(stacks.piles);

    await Dialog.prompt({
      title: "Deck Choice",
      content: `
          <div class="form-group">
            <div>
              <label for="decks">Choose Deck</label>
              <select name="decks">
                ${availDecksHtml}
              </select>
            </div>
            <div>
              <label for="discards">Choose Discard Pile</label>
              <select name="discards">
                ${avilDiscardsHtml}
              </select>
            </div>
          </div>
      `,
      callback: async (html) => {
        let select = html.find('[name="decks"]').val();
        console.log(select);
        let discard = html.find('[name="discards"]').val();
        console.log(discard);
      },
    });
  }

  public static titleify(title: string): string {
    const words = title.toLocaleLowerCase().split(" ");
    let outTitle = "";

    for (let index = 0; index < words.length; index++) {
      const word = words[index];
      outTitle += word.charAt(0).toUpperCase() + word.substring(1);

      if (index < words.length - 1) {
        outTitle += " ";
      }
    }

    return outTitle;
  }

  /**
   * Build the selection dropdown menu
   * @param cards The card array we're building a selection option for
   */
  public static buildHTMLSelectionOptions(
    cards: StoredDocument<Cards>[] | undefined | null
  ) {
    let availDecksHtml = "";

    if (cards == null) {
      return availDecksHtml;
    }

    for (let index = 0; index < cards.length; index++) {
      const element = cards[index];

      if (element.name == null) {
        continue;
      }

      availDecksHtml += `<option value ="${element.name}">${this.titleify(
        element.name
      )}</option>`;

      if (index < cards.length - 1) {
        availDecksHtml += `\n`;
      }
    }

    return availDecksHtml;
  }
}
