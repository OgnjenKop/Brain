import { App, Modal, Notice } from "obsidian";
import { SynthesisContext } from "../services/context-service";
import { SynthesisResult } from "../services/synthesis-service";
import { formatContextLocation } from "../utils/context-format";

interface SynthesisResultModalOptions {
  context: SynthesisContext;
  result: SynthesisResult;
  canInsert: boolean;
  onInsert: () => Promise<string>;
  onSave: () => Promise<string>;
  onActionComplete: (message: string) => Promise<void>;
}

export class SynthesisResultModal extends Modal {
  private working = false;
  private buttons: HTMLButtonElement[] = [];

  constructor(
    app: App,
    private readonly options: SynthesisResultModalOptions,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: `Brain ${this.options.result.title}` });

    contentEl.createEl("p", {
      text: `Action: ${this.options.result.action}`,
    });
    if (this.options.result.promptText) {
      contentEl.createEl("p", {
        text: `Prompt: ${this.options.result.promptText}`,
      });
    }
    contentEl.createEl("p", {
      text: `Context: ${formatContextLocation(this.options.context)}`,
    });
    contentEl.createEl("p", {
      text: this.options.context.truncated
        ? `Context truncated to ${this.options.context.maxChars} characters from ${this.options.context.originalLength}.`
        : `Context length: ${this.options.context.originalLength} characters.`,
    });

    contentEl.createEl("pre", {
      cls: "brain-result",
      text: this.options.result.content,
    });

    if (this.options.canInsert) {
      // Buttons are rendered below after optional guidance text.
    } else {
      contentEl.createEl("p", {
        text: "Open a markdown note to insert this artifact there, or save it to Brain notes.",
      });
    }

    const buttons = contentEl.createEl("div", { cls: "brain-button-row" });
    this.buttons = [];

    if (this.options.canInsert) {
      this.buttons.push(this.createButton(buttons, "Insert into current note", () => {
        void this.runAction(() => this.options.onInsert());
      }, true));
    }

    this.buttons.push(
      this.createButton(buttons, "Save to Brain notes", () => {
        void this.runAction(() => this.options.onSave());
      }),
      this.createButton(buttons, "Close", () => {
        this.close();
      }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private createButton(
    parent: HTMLElement,
    text: string,
    onClick: () => void,
    cta = false,
  ): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: cta ? "brain-button brain-button-primary" : "brain-button",
      text,
    });
    button.addEventListener("click", onClick);
    return button;
  }

  private async runAction(action: () => Promise<string>): Promise<void> {
    if (this.working) {
      return;
    }

    this.working = true;
    this.setButtonsDisabled(true);

    try {
      const message = await action();
      await this.options.onActionComplete(message);
      this.close();
    } catch (error) {
      console.error(error);
      new Notice("Could not update the synthesis result");
    } finally {
      this.working = false;
      this.setButtonsDisabled(false);
    }
  }

  private setButtonsDisabled(disabled: boolean): void {
    for (const button of this.buttons) {
      button.disabled = disabled;
    }
  }
}
