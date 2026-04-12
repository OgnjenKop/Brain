import { App, Modal, Notice, TFile } from "obsidian";
import { ReviewLogEntry } from "../services/review-log-service";
import BrainPlugin from "../../main";

export class ReviewHistoryModal extends Modal {
  constructor(
    app: App,
    private readonly entries: ReviewLogEntry[],
    private readonly plugin: BrainPlugin,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: "Review History" });

    if (!this.entries.length) {
      contentEl.createEl("p", { text: "No review logs found." });
      return;
    }

    contentEl.createEl("p", {
      text: "Open a log to inspect it, or re-open an inbox item if it was marked incorrectly.",
    });

    for (const entry of this.entries) {
      const row = contentEl.createEl("section", { cls: "brain-section" });
      row.createEl("h3", { text: entry.heading || "Untitled item" });
      row.createEl("p", {
        text: `${entry.timestamp} • ${entry.action}`,
      });
      row.createEl("pre", {
        cls: "brain-result",
        text: entry.preview || "(empty preview)",
      });

      const buttons = row.createEl("div", { cls: "brain-button-row" });
      buttons.createEl("button", {
        cls: "brain-button",
        text: "Open log",
      }).addEventListener("click", () => {
        void this.openLog(entry.sourcePath);
      });
      buttons.createEl("button", {
        cls: "brain-button brain-button-primary",
        text: "Re-open",
      }).addEventListener("click", () => {
        void this.reopenEntry(entry);
      });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async openLog(path: string): Promise<void> {
    const abstractFile = this.app.vault.getAbstractFileByPath(path);
    if (!(abstractFile instanceof TFile)) {
      new Notice("Unable to open review log");
      return;
    }

    const leaf = this.app.workspace.getLeaf(false) ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice("Unable to open review log");
      return;
    }

    await leaf.openFile(abstractFile);
    this.app.workspace.revealLeaf(leaf);
  }

  private async reopenEntry(entry: ReviewLogEntry): Promise<void> {
    try {
      const message = await this.plugin.reopenReviewEntry(entry);
      new Notice(message);
      this.close();
    } catch (error) {
      console.error(error);
      new Notice("Could not re-open inbox entry");
    }
  }
}
