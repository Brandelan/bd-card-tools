import { Options } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/dice/roll";

/**
 * Define your class that extends FormApplication
 */
class CardApplication extends Application {
  exampleOption: Partial<Options> | undefined;

  constructor(options?: Partial<Options>) {
    super();
    this.exampleOption = options;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: `myFormApplication.html`,
      id: "my-form-application",
      title: "My FormApplication",
    });
  }

  getData() {
    // Send data to the template
    return {
      msg: this.exampleOption,
      color: "red",
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    console.log(formData.exampleInput);
  }
}
