import { App, Modal, Notice, Setting } from "obsidian";
import { trimTrailingNewlines } from "../utils/date";

interface PromptModalOptions {
  title: string;
  placeholder?: string;
  submitLabel?: string;
  multiline?: boolean;
}

export class PromptModal extends Modal {
  private resolve!: (value: string | null) => void;
  private settled = false;
  private inputEl!: HTMLInputElement | HTMLTextAreaElement;

  constructor(app: App, private readonly options: PromptModalOptions) {
    super(app);
  }

  openPrompt(): Promise<string | null> {
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

    if (this.options.multiline) {
      const textarea = contentEl.createEl("textarea", {
        cls: "brain-modal-input",
        attr: {
          placeholder: this.options.placeholder ?? "",
          rows: "8",
        },
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          void this.submit();
        }
      });
      this.inputEl = textarea;
    } else {
      const input = contentEl.createEl("input", {
        cls: "brain-modal-input",
        attr: {
          placeholder: this.options.placeholder ?? "",
          type: "text",
        },
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void this.submit();
        }
      });
      this.inputEl = input;
    }

    this.inputEl.focus();

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText(this.options.submitLabel ?? "Submit").setCta().onClick(() => {
          void this.submit();
        }),
      )
      .addButton((button) =>
        button.setButtonText("Cancel").onClick(() => {
          this.finish(null);
        }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }

  private async submit(): Promise<void> {
    const value = trimTrailingNewlines(this.inputEl.value).trim();
    if (!value) {
      new Notice("Enter some text first.");
      return;
    }
    this.finish(value);
  }

  private finish(value: string | null): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(value);
    this.close();
  }
}

export class ResultModal extends Modal {
  constructor(
    app: App,
    private readonly titleText: string,
    private readonly bodyText: string,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.titleText });
    contentEl.createEl("pre", {
      cls: "brain-result",
      text: this.bodyText,
    });
  }
}
