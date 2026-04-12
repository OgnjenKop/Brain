import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import BrainPlugin from "../../main";
import { PromptModal } from "./prompt-modals";

export const BRAIN_VIEW_TYPE = "brain-sidebar-view";

export class BrainSidebarView extends ItemView {
  private inputEl!: HTMLTextAreaElement;
  private resultEl!: HTMLElement;
  private summaryEl!: HTMLElement;
  private inboxCountEl!: HTMLElement;
  private taskCountEl!: HTMLElement;
  private reviewHistoryEl!: HTMLElement;
  private aiStatusEl!: HTMLElement;
  private summaryStatusEl!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: BrainPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return BRAIN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Brain";
  }

  getIcon(): string {
    return "brain";
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass("brain-sidebar");

    const header = this.contentEl.createEl("div", { cls: "brain-header" });
    header.createEl("h2", { text: "Brain" });
    header.createEl("p", {
      text: "Quick capture, daily journaling, and lightweight summaries.",
    });

    this.createCaptureSection();
    this.createReviewSection();
    this.createAiSection();
    this.createStatusSection();
    this.createOutputSection();
    await this.refreshStatus();
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }

  setLastResult(text: string): void {
    this.resultEl.setText(text);
  }

  setLastSummary(text: string): void {
    this.summaryEl.setText(text);
  }

  async refreshStatus(): Promise<void> {
    if (this.inboxCountEl) {
      const inboxCount = await this.plugin.getInboxCount();
      this.inboxCountEl.setText(`${inboxCount} recent entries`);
    }
    if (this.taskCountEl) {
      const taskCount = await this.plugin.getOpenTaskCount();
      this.taskCountEl.setText(`${taskCount} open tasks`);
    }
    if (this.reviewHistoryEl) {
      const reviewCount = await this.plugin.getReviewHistoryCount();
      this.reviewHistoryEl.setText(`Review history: ${reviewCount} logs`);
    }
    if (this.aiStatusEl) {
      this.aiStatusEl.setText(this.plugin.getAiStatusText());
    }
    if (this.summaryStatusEl) {
      this.summaryStatusEl.setText(this.plugin.getLastSummaryLabel());
    }
  }

  private createCaptureSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Quick Capture" });

    this.inputEl = section.createEl("textarea", {
      cls: "brain-capture-input",
      attr: {
        placeholder: "Type a note, task, or journal entry...",
        rows: "8",
      },
    });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Save as Note",
    }).addEventListener("click", () => {
      void this.saveAsNote();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Save as Task",
    }).addEventListener("click", () => {
      void this.saveAsTask();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Save as Journal",
    }).addEventListener("click", () => {
      void this.saveAsJournal();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Clear",
    }).addEventListener("click", () => {
      this.inputEl.value = "";
      new Notice("Capture cleared");
    });
  }

  private createReviewSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Review" });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Process Inbox",
    }).addEventListener("click", () => {
      void this.plugin.processInbox();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Open Today's Journal",
    }).addEventListener("click", () => {
      void this.plugin.openTodaysJournal();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Summarize Today",
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(1, "Today");
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Summarize Week",
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(7, "Week");
    });
  }

  private createAiSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "AI Actions" });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Summarize",
    }).addEventListener("click", () => {
      void this.generateSummary();
    });

    if (this.plugin.settings.enableAIRouting) {
      buttons.createEl("button", {
        cls: "brain-button",
        text: "Auto-route",
      }).addEventListener("click", () => {
        void this.autoRoute();
      });
    }
  }

  private createStatusSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Status" });

    const inboxRow = section.createEl("p", { text: "Inbox: loading..." });
    this.inboxCountEl = inboxRow;

    const taskRow = section.createEl("p", { text: "Tasks: loading..." });
    this.taskCountEl = taskRow;

    const reviewRow = section.createEl("div", { cls: "brain-status-row" });
    this.reviewHistoryEl = reviewRow.createEl("span", { text: "Review history: loading..." });
    reviewRow.createEl("button", {
      cls: "brain-button brain-button-small",
      text: "Open",
    }).addEventListener("click", () => {
      void this.plugin.openReviewHistory();
    });

    const aiRow = section.createEl("p", { text: "AI: loading..." });
    this.aiStatusEl = aiRow;

    const summaryRow = section.createEl("p", { text: "Last summary: loading..." });
    this.summaryStatusEl = summaryRow;
  }

  private createOutputSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Output" });

    section.createEl("h4", { text: "Last Result" });
    this.resultEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No recent action.",
    });

    section.createEl("h4", { text: "Last Summary" });
    this.summaryEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No summary generated yet.",
    });
  }

  private async saveAsNote(): Promise<void> {
    await this.executeCapture(
      (text) => this.plugin.captureNote(text),
      "Could not save note",
    );
  }

  private async saveAsTask(): Promise<void> {
    await this.executeCapture(
      (text) => this.plugin.captureTask(text),
      "Could not save task",
    );
  }

  private async saveAsJournal(): Promise<void> {
    await this.executeCapture(
      (text) => this.plugin.captureJournal(text),
      "Could not save journal entry",
    );
  }

  private async generateSummary(): Promise<void> {
    try {
      const result = await this.plugin.summarizeNow();
      this.summaryEl.setText(result.content);
      this.setLastResult(
        result.usedAI ? "AI summary generated" : "Local summary generated",
      );
    } catch (error) {
      console.error(error);
      new Notice("Could not generate summary");
    }
  }

  private async autoRoute(): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text) {
      new Notice("Enter some text first.");
      return;
    }

    try {
      const route = await this.plugin.routeText(text);
      if (!route) {
        new Notice("Brain could not classify that entry");
        return;
      }
      if (route === "note") {
        await this.executeCapture(
          () => this.plugin.captureNote(text),
          "Could not save note",
        );
      } else if (route === "task") {
        await this.executeCapture(
          () => this.plugin.captureTask(text),
          "Could not save task",
        );
      } else {
        await this.executeCapture(
          () => this.plugin.captureJournal(text),
          "Could not save journal entry",
        );
      }
    } catch (error) {
      console.error(error);
      new Notice("Could not auto-route capture");
    }
  }

  private async executeCapture(
    action: (text: string) => Promise<string>,
    failureMessage: string,
  ): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text) {
      new Notice("Enter some text first.");
      return;
    }

    try {
      const result = await action(text);
      await this.plugin.reportActionResult(result);
      this.inputEl.value = "";
    } catch (error) {
      console.error(error);
      new Notice(failureMessage);
    }
  }
}
