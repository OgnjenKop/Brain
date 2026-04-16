import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import BrainPlugin from "../../main";
import { showError } from "../utils/error-handler";

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
      text: "Capture ideas, synthesize explicit context, and save durable markdown artifacts.",
    });

    this.createCaptureSection();
    this.createTopicPageSection();
    this.createSynthesisSection();
    this.createAskSection();
    this.createReviewSection();
    this.createCaptureAssistSection();
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
    const [inboxCount, taskCount, reviewCount] = await Promise.all([
      this.plugin.getInboxCount(),
      this.plugin.getOpenTaskCount(),
      this.plugin.getReviewHistoryCount(),
    ]);
    if (this.inboxCountEl) {
      this.inboxCountEl.setText(`${inboxCount} unreviewed entries`);
    }
    if (this.taskCountEl) {
      this.taskCountEl.setText(`${taskCount} open tasks`);
    }
    if (this.reviewHistoryEl) {
      this.reviewHistoryEl.setText(`Review history: ${reviewCount} entries`);
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
    section.createEl("p", {
      text: "Capture rough input into the vault before review and synthesis.",
    });

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
      text: "Capture Note",
    }).addEventListener("click", () => {
      void this.saveAsNote();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Capture Task",
    }).addEventListener("click", () => {
      void this.saveAsTask();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Capture Journal Entry",
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

  private createSynthesisSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Synthesize" });
    section.createEl("p", {
      text: "Turn explicit context into summaries, clean notes, tasks, and briefs.",
    });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Summarize Current Note",
    }).addEventListener("click", () => {
      void this.plugin.askAboutCurrentNote();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Synthesize Current Note...",
    }).addEventListener("click", () => {
      void this.plugin.askAboutCurrentNoteWithTemplate();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Extract Tasks From Selection",
    }).addEventListener("click", () => {
      void this.plugin.askAboutSelection();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Draft Brief From Folder",
    }).addEventListener("click", () => {
      void this.plugin.askAboutCurrentFolder();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Clean Note From Recent Files",
    }).addEventListener("click", () => {
      void this.plugin.askAboutRecentFiles();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Synthesize Notes...",
    }).addEventListener("click", () => {
      void this.plugin.synthesizeNotes();
    });
  }

  private createAskSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Ask Brain" });
    section.createEl("p", {
      text: "Ask a question about the current note, a selected group, a folder, or the whole vault.",
    });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Ask Question...",
    }).addEventListener("click", () => {
      void this.plugin.askQuestion();
    });
  }

  private createReviewSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Review" });
    section.createEl("p", {
      text: "Process captured input and keep the daily loop moving.",
    });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Review Inbox",
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
      text: "Create Today Summary",
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(1, "Today");
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Create Weekly Summary",
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(7, "Week");
    });
  }

  private createTopicPageSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Topic Pages" });
    section.createEl("p", {
      text: "Brain’s flagship flow: turn explicit context into a durable markdown page you can keep building.",
    });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Create Topic Page",
    }).addEventListener("click", () => {
      void this.plugin.createTopicPage();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Topic Page From Current Note",
    }).addEventListener("click", () => {
      void this.plugin.createTopicPageForScope("note");
    });
  }

  private createCaptureAssistSection(): void {
    if (!this.plugin.settings.enableAIRouting) {
      return;
    }

    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Capture Assist" });
    section.createEl("p", {
      text: "Use AI only to classify fresh capture into note, task, or journal.",
    });

    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Auto-route Capture",
    }).addEventListener("click", () => {
      void this.autoRoute();
    });
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

    const summaryRow = section.createEl("p", { text: "Last artifact: loading..." });
    this.summaryStatusEl = summaryRow;
  }

  private createOutputSection(): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });
    section.createEl("h3", { text: "Artifacts" });

    section.createEl("h4", { text: "Last Result" });
    this.resultEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No result yet.",
    });

    section.createEl("h4", { text: "Last Artifact" });
    this.summaryEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No artifact generated yet.",
    });
  }

  private async saveAsNote(): Promise<void> {
    await this.executeCapture(
      (text) => this.plugin.captureNote(text),
      "Could not capture note",
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
          "Could not capture note",
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
      showError(error, failureMessage);
    }
  }
}
