import { App, Modal, Setting } from "obsidian";
import type { QuestionScope } from "../types";

export type { QuestionScope };

interface QuestionScopeModalOptions {
  title: string;
}

export class QuestionScopeModal extends Modal {
  private resolve!: (value: QuestionScope | null) => void;
  private settled = false;

  constructor(
    app: App,
    private readonly options: QuestionScopeModalOptions,
  ) {
    super(app);
  }

  openPicker(): Promise<QuestionScope | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: "Choose the scope Brain should use for this request.",
    });

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText("Current Note").setCta().onClick(() => {
          this.finish("note");
        }),
      )
      .addButton((button) =>
        button.setButtonText("Selected Notes").onClick(() => {
          this.finish("group");
        }),
      )
      .addButton((button) =>
        button.setButtonText("Current Folder").onClick(() => {
          this.finish("folder");
        }),
      )
      .addButton((button) =>
        button.setButtonText("Entire Vault").onClick(() => {
          this.finish("vault");
        }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }

  private finish(scope: QuestionScope | null): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(scope);
    this.close();
  }
}
