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
  private isLoading = false;
  private collapsedSections = new Set<string>();

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
    this.registerKeyboardShortcuts();
    await this.refreshStatus();
  }

  onClose(): Promise<void> {
    window.removeEventListener("keydown", this.handleKeyDown);
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

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    const buttons = Array.from(this.contentEl.querySelectorAll("button.brain-button"));
    for (const button of buttons) {
      (button as HTMLButtonElement).disabled = loading;
    }
    if (this.inputEl) {
      this.inputEl.disabled = loading;
    }
  }

  private registerKeyboardShortcuts(): void {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case "n":
        event.preventDefault();
        void this.saveAsNote();
        break;
      case "t":
        event.preventDefault();
        void this.saveAsTask();
        break;
      case "j":
        event.preventDefault();
        void this.saveAsJournal();
        break;
      case "c":
        event.preventDefault();
        this.inputEl.value = "";
        new Notice("Capture cleared");
        break;
    }
  };

  private toggleSection(sectionId: string): void {
    if (this.collapsedSections.has(sectionId)) {
      this.collapsedSections.delete(sectionId);
    } else {
      this.collapsedSections.add(sectionId);
    }
  }

  private createCollapsibleSection(
    id: string,
    title: string,
    description: string,
    contentCreator: (container: HTMLElement) => void,
  ): void {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section",
    });

    const header = section.createEl("div", { cls: "brain-section-header" });
    const toggleBtn = header.createEl("button", {
      cls: "brain-collapse-toggle",
      text: this.collapsedSections.has(id) ? "▶" : "▼",
    });
    header.createEl("h3", { text: title });
    header.createEl("p", { text: description });

    toggleBtn.addEventListener("click", () => {
      this.toggleSection(id);
      const contentEl = section.querySelector(".brain-section-content");
      if (contentEl) {
        contentEl.toggleAttribute("hidden");
        toggleBtn.setText(this.collapsedSections.has(id) ? "▶" : "▼");
      }
    });

    const content = section.createEl("div", {
      cls: "brain-section-content",
      attr: this.collapsedSections.has(id) ? { hidden: "true" } : undefined,
    });
    contentCreator(content);
  }

  private createCaptureSection(): void {
    this.createCollapsibleSection(
      "capture",
      "Quick Capture",
      "Capture rough input into the vault before review and synthesis.",
      (container) => {
        this.inputEl = container.createEl("textarea", {
          cls: "brain-capture-input",
          attr: {
            placeholder: "Type a note, task, or journal entry...",
            rows: "8",
          },
        });

        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Capture Note (n)",
        }).addEventListener("click", () => {
          void this.saveAsNote();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Capture Task (t)",
        }).addEventListener("click", () => {
          void this.saveAsTask();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Capture Journal (j)",
        }).addEventListener("click", () => {
          void this.saveAsJournal();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Clear (c)",
        }).addEventListener("click", () => {
          this.inputEl.value = "";
          new Notice("Capture cleared");
        });
      },
    );
  }

  private createSynthesisSection(): void {
    this.createCollapsibleSection(
      "synthesis",
      "Synthesize",
      "Turn explicit context into summaries, clean notes, tasks, and briefs.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button brain-button-primary",
          text: "Summarize Current Note",
        }).addEventListener("click", () => {
          void this.plugin.askAboutCurrentNote();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Synthesize Current Note...",
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.askAboutCurrentNoteWithTemplate();
          } finally {
            this.setLoading(false);
          }
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
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.askAboutRecentFiles();
          } finally {
            this.setLoading(false);
          }
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Synthesize Notes...",
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.synthesizeNotes();
          } finally {
            this.setLoading(false);
          }
        });
      },
    );
  }

  private createAskSection(): void {
    this.createCollapsibleSection(
      "ask",
      "Ask Brain",
      "Ask a question about the current note, a selected group, a folder, or the whole vault.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button brain-button-primary",
          text: "Ask Question",
        }).addEventListener("click", () => {
          void this.plugin.askQuestion();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "About Current Note",
        }).addEventListener("click", () => {
          void this.plugin.askQuestionAboutCurrentNote();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "About Current Folder",
        }).addEventListener("click", () => {
          void this.plugin.askQuestionAboutCurrentFolder();
        });
      },
    );
  }

  private createReviewSection(): void {
    this.createCollapsibleSection(
      "review",
      "Review",
      "Process captured input and keep the daily loop moving.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button brain-button-primary",
          text: "Review Inbox",
        }).addEventListener("click", () => {
          void this.plugin.processInbox();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Open Review History",
        }).addEventListener("click", () => {
          void this.plugin.openReviewHistory();
        });
      },
    );
  }

  private createTopicPageSection(): void {
    this.createCollapsibleSection(
      "topic",
      "Topic Pages",
      "Brain's flagship flow: turn explicit context into a durable markdown page you can keep building.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Create Topic Page",
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.createTopicPage();
          } finally {
            this.setLoading(false);
          }
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Topic Page From Current Note",
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.createTopicPageForScope("note");
          } finally {
            this.setLoading(false);
          }
        });
      },
    );
  }

  private createCaptureAssistSection(): void {
    if (!this.plugin.settings.enableAIRouting) {
      return;
    }

    this.createCollapsibleSection(
      "capture-assist",
      "Capture Assist",
      "Use AI only to classify fresh capture into note, task, or journal.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Auto-route Capture",
        }).addEventListener("click", () => {
          void this.autoRoute();
        });
      },
    );
  }

  private createStatusSection(): void {
    this.createCollapsibleSection(
      "status",
      "Status",
      "Current inbox, task, and synthesis status.",
      (container) => {
        const inboxRow = container.createEl("p", { text: "Inbox: loading..." });
        this.inboxCountEl = inboxRow;

        const taskRow = container.createEl("p", { text: "Tasks: loading..." });
        this.taskCountEl = taskRow;

        const reviewRow = container.createEl("div", { cls: "brain-status-row" });
        this.reviewHistoryEl = reviewRow.createEl("span", { text: "Review history: loading..." });
        reviewRow.createEl("button", {
          cls: "brain-button brain-button-small",
          text: "Open",
        }).addEventListener("click", () => {
          void this.plugin.openReviewHistory();
        });

        const aiRow = container.createEl("p", { text: "AI: loading..." });
        this.aiStatusEl = aiRow;

        const summaryRow = container.createEl("p", { text: "Last artifact: loading..." });
        this.summaryStatusEl = summaryRow;
      },
    );
  }

  private createOutputSection(): void {
    this.createCollapsibleSection(
      "output",
      "Artifacts",
      "Recent synthesis results and generated artifacts.",
      (container) => {
        container.createEl("h4", { text: "Last Result" });
        this.resultEl = container.createEl("pre", {
          cls: "brain-output",
          text: "No result yet.",
        });

        container.createEl("h4", { text: "Last Artifact" });
        this.summaryEl = container.createEl("pre", {
          cls: "brain-output",
          text: "No artifact generated yet.",
        });
      },
    );
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

    this.setLoading(true);
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
      showError(error, "Could not auto-route capture");
    } finally {
      this.setLoading(false);
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
