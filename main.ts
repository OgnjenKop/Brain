import { MarkdownView, Notice, Plugin } from "obsidian";
import {
  BrainPluginSettings,
  normalizeBrainSettings,
} from "./src/settings/settings";
import { BrainSettingTab } from "./src/settings/settings-tab";
import { ContextService } from "./src/services/context-service";
import { InboxService } from "./src/services/inbox-service";
import { JournalService } from "./src/services/journal-service";
import { NoteService } from "./src/services/note-service";
import { ReviewLogService } from "./src/services/review-log-service";
import { ReviewService } from "./src/services/review-service";
import { QuestionService } from "./src/services/question-service";
import { SummaryService } from "./src/services/summary-service";
import { SynthesisService } from "./src/services/synthesis-service";
import { TopicPageService } from "./src/services/topic-page-service";
import { TaskService } from "./src/services/task-service";
import { BrainAIService } from "./src/services/ai-service";
import { BrainAuthService } from "./src/services/auth-service";
import { VaultService } from "./src/services/vault-service";
import { BrainWorkflowService } from "./src/services/workflow-service";
import {
  PromptModal,
  ResultModal,
} from "./src/views/prompt-modals";
import { InboxReviewModal } from "./src/views/inbox-review-modal";
import { QuestionScope } from "./src/types";
import { ReviewHistoryModal } from "./src/views/review-history-modal";
import {
  BRAIN_VIEW_TYPE,
  BrainSidebarView,
} from "./src/views/sidebar-view";
import { formatDateTimeKey } from "./src/utils/date";
import { SummaryResult } from "./src/services/summary-service";
import { registerCommands } from "./src/commands/register-commands";
import { showError } from "./src/utils/error-handler";
import { getAIConfigurationStatus } from "./src/utils/ai-config";

export default class BrainPlugin extends Plugin {
  settings!: BrainPluginSettings;
  vaultService!: VaultService;
  inboxService!: InboxService;
  noteService!: NoteService;
  taskService!: TaskService;
  journalService!: JournalService;
  reviewLogService!: ReviewLogService;
  reviewService!: ReviewService;
  questionService!: QuestionService;
  contextService!: ContextService;
  synthesisService!: SynthesisService;
  topicPageService!: TopicPageService;
  aiService!: BrainAIService;
  authService!: BrainAuthService;
  summaryService!: SummaryService;
  workflowService!: BrainWorkflowService;
  private sidebarView: BrainSidebarView | null = null;
  private lastSummaryAt: Date | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.vaultService = new VaultService(this.app);
    this.aiService = new BrainAIService();
    this.authService = new BrainAuthService(this);
    this.inboxService = new InboxService(this.vaultService, () => this.settings);
    this.noteService = new NoteService(this.vaultService, () => this.settings);
    this.taskService = new TaskService(this.vaultService, () => this.settings);
    this.journalService = new JournalService(
      this.vaultService,
      () => this.settings,
    );
    this.contextService = new ContextService(
      this.app,
      this.vaultService,
      () => this.settings,
    );
    this.reviewLogService = new ReviewLogService(
      this.vaultService,
      () => this.settings,
    );
    this.reviewService = new ReviewService(
      this.noteService,
      this.inboxService,
      this.taskService,
      this.journalService,
      this.reviewLogService,
      () => this.settings,
    );
    this.questionService = new QuestionService(
      this.aiService,
      () => this.settings,
    );
    this.summaryService = new SummaryService(
      this.vaultService,
      this.aiService,
      () => this.settings,
    );
    this.synthesisService = new SynthesisService(
      this.aiService,
      () => this.settings,
    );
    this.topicPageService = new TopicPageService(
      this.aiService,
      () => this.settings,
    );
    this.workflowService = new BrainWorkflowService(
      this.app,
      () => this.settings,
      this.contextService,
      this.synthesisService,
      this.topicPageService,
      this.questionService,
      this.noteService,
      {
        updateResult: (text) => this.updateSidebarResult(text),
        updateSummary: (text) => this.updateSidebarSummary(text),
        refreshStatus: () => this.refreshSidebarStatusBestEffort(),
        reportActionResult: (message) => this.reportActionResult(message),
        hasActiveMarkdownNote: () => this.hasActiveMarkdownNote(),
        setLastSummaryAt: (date) => {
          this.lastSummaryAt = date;
        },
      },
    );

    try {
      this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
        const view = new BrainSidebarView(leaf, this);
        this.sidebarView = view;
        return view;
      });

      registerCommands(this);

      this.addSettingTab(new BrainSettingTab(this.app, this));
    } catch (error) {
      showError(error, "Could not finish loading Brain");
    }
  }

  onunload(): void {
    this.sidebarView = null;
  }

  async loadSettings(): Promise<void> {
    try {
      const loaded = (await this.loadData()) ?? {};
      this.settings = normalizeBrainSettings(loaded);
    } catch (error) {
      showError(error, "Could not load Brain settings");
      this.settings = normalizeBrainSettings({});
    }
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
      showError(error, "Could not refresh sidebar status");
    }
  }

  async reportActionResult(message: string): Promise<void> {
    new Notice(message);
    this.updateSidebarResult(message);
    await this.refreshSidebarStatusBestEffort();
  }

  getLastSummaryLabel(): string {
    return this.lastSummaryAt ? formatDateTimeKey(this.lastSummaryAt) : "No artifact yet";
  }

  async routeText(text: string): Promise<string | null> {
    if (!this.settings.enableAIRouting) {
      return null;
    }

    const aiStatus = await getAIConfigurationStatus(this.settings);
    if (!aiStatus.configured) {
      new Notice(aiStatus.message);
      return null;
    }

    const route = await this.aiService.routeText(text, this.settings);
    if (route) {
      this.updateSidebarResult(`Auto-routed as ${route}`);
    }
    return route;
  }

  async askAboutCurrentNote(): Promise<void> {
    await this.workflowService.askAboutCurrentNote("summarize");
  }

  async askAboutCurrentNoteWithTemplate(): Promise<void> {
    await this.workflowService.askAboutCurrentNote();
  }

  async askAboutSelection(): Promise<void> {
    await this.workflowService.askAboutSelection();
  }

  async askAboutRecentFiles(): Promise<void> {
    await this.workflowService.askAboutRecentFiles();
  }

  async askAboutCurrentFolder(): Promise<void> {
    await this.workflowService.askAboutCurrentFolder();
  }

  async synthesizeNotes(): Promise<void> {
    await this.workflowService.synthesizeNotes();
  }

  async askQuestionAboutCurrentNote(): Promise<void> {
    await this.workflowService.askQuestionAboutCurrentNote();
  }

  async askQuestionAboutCurrentFolder(): Promise<void> {
    await this.workflowService.askQuestionAboutCurrentFolder();
  }

  async askQuestion(): Promise<void> {
    await this.workflowService.askQuestion();
  }

  async createTopicPage(): Promise<void> {
    await this.workflowService.createTopicPage();
  }

  async createTopicPageForScope(defaultScope?: QuestionScope): Promise<void> {
    await this.workflowService.createTopicPage(defaultScope);
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
      showError(error, "Brain could not save that entry");
    }
  }

  async captureNote(text: string): Promise<string> {
    const saved = await this.noteService.appendNote(text);
    return `Captured note in ${saved.path}`;
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
    const selection = this.workflowService.getActiveSelectionText();
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
    return await this.inboxService.getUnreviewedCount();
  }

  async getOpenTaskCount(): Promise<number> {
    return await this.taskService.getOpenTaskCount();
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

  async getAiStatusText(): Promise<string> {
    if (!this.settings.enableAISummaries && !this.settings.enableAIRouting) {
      return "AI off";
    }
    const aiStatus = await getAIConfigurationStatus(this.settings);
    if (!aiStatus.configured) {
      return aiStatus.message.replace(/\.$/, "");
    }
    const provider = aiStatus.provider ?? "AI";
    const model = aiStatus.model ? ` (${aiStatus.model})` : "";
    return `${provider}${model}`;
  }

  private hasActiveMarkdownNote(): boolean {
    return Boolean(this.app.workspace.getActiveViewOfType(MarkdownView)?.file);
  }
}
