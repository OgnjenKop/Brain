import { App, Modal, Notice, Setting } from "obsidian";
import { InboxEntry, InboxEntryIdentity } from "../services/inbox-service";
import { ReviewLogEntry } from "../services/review-log-service";
import { ReviewService } from "../services/review-service";
import { showError } from "../utils/error-handler";

type ReviewAction = "keep" | "task" | "journal" | "note" | "skip";

export class InboxReviewModal extends Modal {
  private currentIndex = 0;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return;
    }

    const action = keyToAction(event.key);
    if (!action) {
      return;
    }

    event.preventDefault();
    void this.handleAction(action);
  };

  constructor(
    app: App,
    private readonly entries: InboxEntry[],
    private readonly reviewService: ReviewService,
    private readonly onActionComplete?: (message: string) => Promise<void> | void,
  ) {
    super(app);
  }

  onOpen(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    this.render();
  }

  onClose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.contentEl.empty();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.addClass("brain-modal");
    this.contentEl.createEl("h2", { text: "Process Inbox" });

    if (!this.entries.length) {
      this.contentEl.createEl("p", { text: "No inbox entries found." });
      return;
    }

    const entry = this.entries[this.currentIndex];
    this.contentEl.createEl("div", {
      text: `Entry ${this.currentIndex + 1} of ${this.entries.length}`,
    });
    this.contentEl.createEl("h3", {
      text: entry.heading || "Untitled entry",
    });
    this.contentEl.createEl("pre", {
      cls: "brain-result",
      text: entry.body || entry.preview || "(empty entry)",
    });
    this.contentEl.createEl("p", {
      text: "Choose an action for this entry. Shortcuts: k keep, t task, j journal, n note, s skip.",
    });

    const buttonRow = this.contentEl.createEl("div", { cls: "brain-button-row" });
    this.addButton(buttonRow, "Keep in inbox", "keep");
    this.addButton(buttonRow, "Convert to task", "task");
    this.addButton(buttonRow, "Append to journal", "journal");
    this.addButton(buttonRow, "Promote to note", "note");
    this.addButton(buttonRow, "Skip", "skip");
  }

  private addButton(container: HTMLElement, label: string, action: ReviewAction): void {
    container.createEl("button", {
      cls: action === "note" ? "brain-button brain-button-primary" : "brain-button",
      text: label,
    }).addEventListener("click", () => {
      void this.handleAction(action);
    });
  }

  private async handleAction(action: ReviewAction): Promise<void> {
    const entry = this.entries[this.currentIndex];
    if (!entry) {
      this.close();
      return;
    }

    try {
      let message = "";
      if (action === "task") {
        message = await this.reviewService.promoteToTask(entry);
      } else if (action === "journal") {
        message = await this.reviewService.appendToJournal(entry);
      } else if (action === "note") {
        message = await this.reviewService.promoteToNote(entry);
      } else if (action === "keep") {
        message = await this.reviewService.keepEntry(entry);
      } else {
        message = await this.reviewService.skipEntry(entry);
      }

      try {
        if (this.onActionComplete) {
          await this.onActionComplete(message);
        } else {
          new Notice(message);
        }
      } catch (error) {
        showError(error, "Could not process review action");
      }

      this.currentIndex += 1;

      if (this.currentIndex >= this.entries.length) {
        new Notice("Inbox review complete");
        this.close();
        return;
      }

      this.render();
    } catch (error) {
      showError(error, "Could not process inbox entry");
    }
  }
}

function keyToAction(key: string): ReviewAction | null {
  switch (key.toLowerCase()) {
    case "k":
      return "keep";
    case "t":
      return "task";
    case "j":
      return "journal";
    case "n":
      return "note";
    case "s":
      return "skip";
    default:
      return null;
  }
}
