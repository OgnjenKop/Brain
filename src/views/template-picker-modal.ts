import { App, Modal, Setting } from "obsidian";
import { getSynthesisTemplateButtonLabel } from "../utils/synthesis-template";

export type SynthesisTemplate =
  | "summarize"
  | "extract-tasks"
  | "extract-decisions"
  | "extract-open-questions"
  | "rewrite-clean-note"
  | "draft-project-brief";

interface TemplatePickerOptions {
  title: string;
}

export class TemplatePickerModal extends Modal {
  private resolve!: (value: SynthesisTemplate | null) => void;
  private settled = false;

  constructor(
    app: App,
    private readonly options: TemplatePickerOptions,
  ) {
    super(app);
  }

  openPicker(): Promise<SynthesisTemplate | null> {
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
      text: "Choose how Brain should synthesize this context.",
    });

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText(getSynthesisTemplateButtonLabel("summarize")).setCta().onClick(() => {
          this.finish("summarize");
        }),
      )
      .addButton((button) =>
        button.setButtonText(getSynthesisTemplateButtonLabel("extract-tasks")).onClick(() => {
          this.finish("extract-tasks");
        }),
      )
      .addButton((button) =>
        button.setButtonText(getSynthesisTemplateButtonLabel("extract-decisions")).onClick(() => {
          this.finish("extract-decisions");
        }),
      )
      .addButton((button) =>
        button.setButtonText(getSynthesisTemplateButtonLabel("extract-open-questions")).onClick(() => {
          this.finish("extract-open-questions");
        }),
      )
      .addButton((button) =>
        button.setButtonText(getSynthesisTemplateButtonLabel("rewrite-clean-note")).onClick(() => {
          this.finish("rewrite-clean-note");
        }),
      )
      .addButton((button) =>
        button.setButtonText(getSynthesisTemplateButtonLabel("draft-project-brief")).onClick(() => {
          this.finish("draft-project-brief");
        }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }

  private finish(template: SynthesisTemplate | null): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(template);
    this.close();
  }
}
