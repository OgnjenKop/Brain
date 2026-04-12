import { MarkdownView, Notice, Plugin } from "obsidian";
import {
  BrainPluginSettings,
  normalizeBrainSettings,
} from "./src/settings/settings";
import { BrainSettingTab } from "./src/settings/settings-tab";
import { InboxService } from "./src/services/inbox-service";
import { JournalService } from "./src/services/journal-service";
import { NoteService } from "./src/services/note-service";
import { ReviewLogService } from "./src/services/review-log-service";
import { ReviewService } from "./src/services/review-service";
import { SummaryService } from "./src/services/summary-service";
import { TaskService } from "./src/services/task-service";
import { BrainAIService } from "./src/services/ai-service";
import { VaultService } from "./src/services/vault-service";
import {
  PromptModal,
  ResultModal,
} from "./src/views/prompt-modals";
import { InboxReviewModal } from "./src/views/inbox-review-modal";
import { ReviewHistoryModal } from "./src/views/review-history-modal";
import {
  BRAIN_VIEW_TYPE,
  BrainSidebarView,
} from "./src/views/sidebar-view";
import { formatDateTimeKey } from "./src/utils/date";
import { SummaryResult } from "./src/services/summary-service";

export default class BrainPlugin extends Plugin {
  settings!: BrainPluginSettings;
  vaultService!: VaultService;
  inboxService!: InboxService;
  noteService!: NoteService;
  taskService!: TaskService;
  journalService!: JournalService;
  reviewLogService!: ReviewLogService;
  reviewService!: ReviewService;
  aiService!: BrainAIService;
  summaryService!: SummaryService;
  private sidebarView: BrainSidebarView | null = null;
  private lastSummaryAt: Date | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.vaultService = new VaultService(this.app);
    this.aiService = new BrainAIService();
    this.inboxService = new InboxService(this.vaultService, () => this.settings);
    this.noteService = new NoteService(this.vaultService, () => this.settings);
    this.taskService = new TaskService(this.vaultService, () => this.settings);
    this.journalService = new JournalService(
      this.vaultService,
      () => this.settings,
    );
    this.reviewLogService = new ReviewLogService(
      this.vaultService,
      () => this.settings,
    );
    this.reviewService = new ReviewService(
      this.vaultService,
      this.inboxService,
      this.taskService,
      this.journalService,
      this.reviewLogService,
      () => this.settings,
    );
    this.summaryService = new SummaryService(
      this.vaultService,
      this.aiService,
      () => this.settings,
    );

    await this.vaultService.ensureKnownFolders(this.settings);

    this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
      const view = new BrainSidebarView(leaf, this);
      this.sidebarView = view;
      return view;
    });

    this.addCommand({
      id: "capture-note",
      name: "Brain: Capture Note",
      callback: async () => {
        await this.captureFromModal("Capture Note", "Save note", async (text) => {
          const saved = await this.noteService.appendNote(text);
          return `Saved note to ${saved.path}`;
        });
      },
    });

    this.addCommand({
      id: "add-task",
      name: "Brain: Add Task",
      callback: async () => {
        await this.captureFromModal("Add Task", "Save task", async (text) => {
          const saved = await this.taskService.appendTask(text);
          return `Saved task to ${saved.path}`;
        });
      },
    });

    this.addCommand({
      id: "add-journal-entry",
      name: "Brain: Add Journal Entry",
      callback: async () => {
        await this.captureFromModal(
          "Add Journal Entry",
          "Save entry",
          async (text) => {
            const saved = await this.journalService.appendEntry(text);
            return `Saved journal entry to ${saved.path}`;
          },
          true,
        );
      },
    });

    this.addCommand({
      id: "process-inbox",
      name: "Brain: Process Inbox",
      callback: async () => {
        await this.processInbox();
      },
    });

    this.addCommand({
      id: "review-history",
      name: "Brain: Review History",
      callback: async () => {
        await this.openReviewHistory();
      },
    });

    this.addCommand({
      id: "summarize-recent-notes",
      name: "Brain: Summarize Recent Notes",
      callback: async () => {
        await this.generateSummaryForWindow();
      },
    });

    this.addCommand({
      id: "summarize-today",
      name: "Brain: Summarize Today",
      callback: async () => {
        await this.generateSummaryForWindow(1, "Today");
      },
    });

    this.addCommand({
      id: "summarize-this-week",
      name: "Brain: Summarize This Week",
      callback: async () => {
        await this.generateSummaryForWindow(7, "Week");
      },
    });

    this.addCommand({
      id: "add-task-from-selection",
      name: "Brain: Add Task From Selection",
      callback: async () => {
        await this.addTaskFromSelection();
      },
    });

    this.addCommand({
      id: "open-todays-journal",
      name: "Brain: Open Today's Journal",
      callback: async () => {
        await this.openTodaysJournal();
      },
    });

    this.addCommand({
      id: "open-sidebar",
      name: "Brain: Open Sidebar",
      callback: async () => {
        await this.openSidebar();
      },
    });

    this.addSettingTab(new BrainSettingTab(this.app, this));
  }

  onunload(): void {
    this.sidebarView = null;
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) ?? {};
    this.settings = normalizeBrainSettings(loaded);
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeBrainSettings(this.settings);
    await this.saveData(this.settings);
    await this.vaultService.ensureKnownFolders(this.settings);
    await this.refreshSidebarStatus();
  }

  async openSidebar(): Promise<void> {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice("Unable to open the sidebar");
      return;
    }
    await leaf.setViewState({
      type: BRAIN_VIEW_TYPE,
      active: true,
    });
    this.app.workspace.revealLeaf(leaf);
  }

  getOpenSidebarView(): BrainSidebarView | null {
    const leaves = this.app.workspace.getLeavesOfType(BRAIN_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof BrainSidebarView) {
        return view;
      }
    }
    return null;
  }

  hasOpenSidebar(): boolean {
    return this.app.workspace.getLeavesOfType(BRAIN_VIEW_TYPE).length > 0;
  }

  updateSidebarResult(text: string): void {
    this.getOpenSidebarView()?.setLastResult(text);
  }

  updateSidebarSummary(text: string): void {
    this.getOpenSidebarView()?.setLastSummary(text);
  }

  async refreshSidebarStatus(): Promise<void> {
    await this.getOpenSidebarView()?.refreshStatus();
  }

  async refreshSidebarStatusBestEffort(): Promise<void> {
    try {
      await this.refreshSidebarStatus();
    } catch (error) {
      console.error(error);
    }
  }

  async reportActionResult(message: string): Promise<void> {
    new Notice(message);
    this.updateSidebarResult(message);
    await this.refreshSidebarStatusBestEffort();
  }

  getLastSummaryLabel(): string {
    return this.lastSummaryAt ? formatDateTimeKey(this.lastSummaryAt) : "No summary yet";
  }

  async routeText(text: string): Promise<string | null> {
    if (!this.settings.enableAIRouting) {
      return null;
    }
    if (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim()) {
      new Notice("AI routing is enabled but OpenAI is not configured");
      return null;
    }
    const route = await this.aiService.routeText(text, this.settings);
    if (route) {
      this.updateSidebarResult(`Auto-routed as ${route}`);
    }
    return route;
  }

  async summarizeNow(): Promise<SummaryResult> {
    const result = await this.summaryService.generateSummary();
    this.lastSummaryAt = new Date();
    this.updateSidebarSummary(`${result.title}\n\n${result.content}`);
    this.updateSidebarResult(
      result.usedAI ? `${result.title} generated with AI` : `${result.title} generated locally`,
    );
    await this.refreshSidebarStatusBestEffort();
    return result;
  }

  async generateSummaryForWindow(
    lookbackDays?: number,
    label?: string,
  ): Promise<SummaryResult> {
    const result = await this.summaryService.generateSummary(lookbackDays, label);
    this.lastSummaryAt = new Date();
    this.updateSidebarSummary(`${result.title}\n\n${result.content}`);
    this.updateSidebarResult(
      result.usedAI ? `${result.title} generated with AI` : `${result.title} generated locally`,
    );
    await this.refreshSidebarStatusBestEffort();
    new Notice(
      result.persistedPath
        ? `${result.title} saved to ${result.persistedPath}`
        : result.usedAI
          ? `${result.title} generated with AI`
          : `${result.title} generated locally`,
    );
    if (!this.hasOpenSidebar()) {
      new ResultModal(this.app, `Brain ${result.title}`, result.content).open();
    }
    return result;
  }

  async captureFromModal(
    title: string,
    submitLabel: string,
    action: (text: string) => Promise<string>,
    multiline = false,
  ): Promise<void> {
    const value = await new PromptModal(this.app, {
      title,
      placeholder: multiline
        ? "Write your entry here..."
        : "Type here...",
      submitLabel,
      multiline,
    }).openPrompt();

    if (value === null) {
      return;
    }

    try {
      const result = await action(value);
      await this.reportActionResult(result);
    } catch (error) {
      console.error(error);
      new Notice("Brain could not save that entry");
    }
  }

  async captureNote(text: string): Promise<string> {
    const saved = await this.noteService.appendNote(text);
    return `Saved note to ${saved.path}`;
  }

  async captureTask(text: string): Promise<string> {
    const saved = await this.taskService.appendTask(text);
    return `Saved task to ${saved.path}`;
  }

  async captureJournal(text: string): Promise<string> {
    const saved = await this.journalService.appendEntry(text);
    return `Saved journal entry to ${saved.path}`;
  }

  async processInbox(): Promise<void> {
    const entries = await this.reviewService.getRecentInboxEntries();
    if (!entries.length) {
      new Notice("No inbox entries found");
      return;
    }

    new InboxReviewModal(this.app, entries, this.reviewService, async (message) => {
      await this.reportActionResult(message);
    }).open();
    this.updateSidebarResult(`Loaded ${entries.length} inbox entries`);
    await this.refreshSidebarStatusBestEffort();
  }

  async openReviewHistory(): Promise<void> {
    const entries = await this.reviewLogService.getReviewEntries();
    new ReviewHistoryModal(this.app, entries, this).open();
  }

  async addTaskFromSelection(): Promise<void> {
    const selection = this.getActiveSelectionText();
    if (selection) {
      const saved = await this.taskService.appendTask(selection);
      const message = `Saved task from selection to ${saved.path}`;
      await this.reportActionResult(message);
      return;
    }

    new Notice("No selection found. Opening task entry modal.");
    await this.captureFromModal("Add Task", "Save task", async (text) => {
      const saved = await this.taskService.appendTask(text);
      return `Saved task to ${saved.path}`;
    });
  }

  async openTodaysJournal(): Promise<void> {
    const file = await this.journalService.ensureJournalFile();
    const leaf = this.app.workspace.getLeaf(false) ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice("Unable to open today's journal");
      return;
    }

    await leaf.openFile(file);
    this.app.workspace.revealLeaf(leaf);
    const message = `Opened ${file.path}`;
    await this.reportActionResult(message);
  }

  async getInboxCount(): Promise<number> {
    const entries = await this.inboxService.getRecentEntries(1000);
    return entries.length;
  }

  async getOpenTaskCount(): Promise<number> {
    const text = await this.vaultService.readText(this.settings.tasksFile);
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^- \[( |x|X)\]/.test(line))
      .filter((line) => !/^- \[(x|X)\]/.test(line))
      .length;
  }

  async getReviewHistoryCount(): Promise<number> {
    return this.reviewLogService.getReviewEntryCount();
  }

  async reopenReviewEntry(entry: {
    heading: string;
    preview: string;
    signature: string;
    signatureIndex: number;
  }): Promise<string> {
    const result = await this.reviewService.reopenFromReviewLog({
      action: "reopen",
      timestamp: "",
      sourcePath: "",
      fileMtime: Date.now(),
      entryIndex: 0,
      body: "",
      heading: entry.heading,
      preview: entry.preview,
      signature: entry.signature,
      signatureIndex: entry.signatureIndex,
    });
    await this.refreshSidebarStatusBestEffort();
    return result;
  }

  getAiStatusText(): string {
    if (!this.settings.enableAISummaries && !this.settings.enableAIRouting) {
      return "AI off";
    }

    if (
      (this.settings.enableAISummaries || this.settings.enableAIRouting) &&
      (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim())
    ) {
      return "AI enabled but missing key";
    }

    return "AI configured";
  }

  private getActiveSelectionText(): string {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = activeView?.editor?.getSelection()?.trim() ?? "";
    return selection;
  }
}
