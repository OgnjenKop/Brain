import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import {
  BrainPluginSettings,
  normalizeBrainSettings,
} from "./src/settings/settings";
import { BrainSettingTab } from "./src/settings/settings-tab";
import { ContextService, SynthesisContext } from "./src/services/context-service";
import { InboxService } from "./src/services/inbox-service";
import { JournalService } from "./src/services/journal-service";
import { NoteService } from "./src/services/note-service";
import { ReviewLogService } from "./src/services/review-log-service";
import { ReviewService } from "./src/services/review-service";
import { QuestionService } from "./src/services/question-service";
import { SummaryService } from "./src/services/summary-service";
import { SynthesisResult, SynthesisService } from "./src/services/synthesis-service";
import { TopicPageService } from "./src/services/topic-page-service";
import { TaskService } from "./src/services/task-service";
import { BrainAIService } from "./src/services/ai-service";
import { VaultService } from "./src/services/vault-service";
import {
  PromptModal,
  ResultModal,
} from "./src/views/prompt-modals";
import { FileGroupPickerModal } from "./src/views/file-group-picker-modal";
import { InboxReviewModal } from "./src/views/inbox-review-modal";
import { QuestionScopeModal, QuestionScope } from "./src/views/question-scope-modal";
import { ReviewHistoryModal } from "./src/views/review-history-modal";
import { SynthesisResultModal } from "./src/views/synthesis-result-modal";
import { TemplatePickerModal, SynthesisTemplate } from "./src/views/template-picker-modal";
import {
  BRAIN_VIEW_TYPE,
  BrainSidebarView,
} from "./src/views/sidebar-view";
import { formatDateTimeKey } from "./src/utils/date";
import { SummaryResult } from "./src/services/summary-service";
import { formatContextSourceLines } from "./src/utils/context-format";

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
      this.vaultService,
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

    await this.vaultService.ensureKnownFolders(this.settings);
    await this.initializeLastArtifactTimestamp();

    this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
      const view = new BrainSidebarView(leaf, this);
      this.sidebarView = view;
      return view;
    });

    this.addCommand({
      id: "capture-note",
      name: "Brain: Capture Note",
      callback: async () => {
        await this.captureFromModal("Capture Note", "Capture", async (text) => {
          const saved = await this.noteService.appendNote(text);
          return `Captured note in ${saved.path}`;
        });
      },
    });

    this.addCommand({
      id: "add-task",
      name: "Brain: Capture Task",
      callback: async () => {
        await this.captureFromModal("Capture Task", "Capture", async (text) => {
          const saved = await this.taskService.appendTask(text);
          return `Saved task to ${saved.path}`;
        });
      },
    });

    this.addCommand({
      id: "add-journal-entry",
      name: "Brain: Capture Journal Entry",
      callback: async () => {
        await this.captureFromModal(
          "Capture Journal Entry",
          "Capture",
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
      name: "Brain: Review Inbox",
      callback: async () => {
        await this.processInbox();
      },
    });

    this.addCommand({
      id: "review-history",
      name: "Brain: Open Review History",
      callback: async () => {
        await this.openReviewHistory();
      },
    });

    this.addCommand({
      id: "summarize-today",
      name: "Brain: Create Today Summary",
      callback: async () => {
        await this.generateSummaryForWindow(1, "Today");
      },
    });

    this.addCommand({
      id: "summarize-this-week",
      name: "Brain: Create Weekly Summary",
      callback: async () => {
        await this.generateSummaryForWindow(7, "Week");
      },
    });

    this.addCommand({
      id: "add-task-from-selection",
      name: "Brain: Capture Task From Selection",
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
      name: "Brain: Open Brain Sidebar",
      callback: async () => {
        await this.openSidebar();
      },
    });

    this.addCommand({
      id: "synthesize-notes",
      name: "Brain: Synthesize Notes",
      callback: async () => {
        await this.synthesizeNotes();
      },
    });

    this.addCommand({
      id: "synthesize-current-note",
      name: "Brain: Synthesize Current Note",
      callback: async () => {
        await this.askAboutCurrentNoteWithTemplate();
      },
    });

    this.addCommand({
      id: "ask-question",
      name: "Brain: Ask Question Across Notes",
      callback: async () => {
        await this.askQuestion();
      },
    });

    this.addCommand({
      id: "ask-question-current-note",
      name: "Brain: Ask Question From Current Note",
      callback: async () => {
        await this.askQuestionAboutCurrentNote();
      },
    });

    this.addCommand({
      id: "create-topic-page",
      name: "Brain: Create Topic Page",
      callback: async () => {
        await this.createTopicPage();
      },
    });

    this.addCommand({
      id: "create-topic-page-current-note",
      name: "Brain: Create Topic Page From Current Note",
      callback: async () => {
        await this.createTopicPageForScope("note");
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
    await this.initializeLastArtifactTimestamp();
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
    return this.lastSummaryAt ? formatDateTimeKey(this.lastSummaryAt) : "No artifact yet";
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

  async askAboutCurrentNote(): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getCurrentNoteContext(),
      "Summarize Current Note",
      "summarize",
    );
  }

  async askAboutCurrentNoteWithTemplate(): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getCurrentNoteContext(),
      "Synthesize Current Note",
    );
  }

  async askAboutSelection(): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getSelectedTextContext(),
      "Extract Tasks From Selection",
      "extract-tasks",
    );
  }

  async askAboutRecentFiles(): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getRecentFilesContext(),
      "Create Clean Note From Recent Files",
      "rewrite-clean-note",
    );
  }

  async askAboutCurrentFolder(): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getCurrentFolderContext(),
      "Draft Project Brief From Current Folder",
      "draft-project-brief",
    );
  }

  async synthesizeNotes(): Promise<void> {
    try {
      const scope = await new QuestionScopeModal(this.app, {
        title: "Synthesize Notes",
      }).openPicker();
      if (!scope) {
        return;
      }

      const context = await this.resolveContextForScope(
        scope,
        "Select Notes to Synthesize",
      );
      if (!context) {
        return;
      }

      const template = await this.pickSynthesisTemplate("Synthesize Notes");
      if (!template) {
        return;
      }

      await this.runSynthesisFlow(context, template);
    } catch (error) {
      console.error(error);
      new Notice(
        error instanceof Error ? error.message : "Could not synthesize these notes",
      );
    }
  }

  async askQuestionAboutCurrentNote(): Promise<void> {
    await this.askQuestionForScope("note");
  }

  async askQuestionAboutCurrentFolder(): Promise<void> {
    await this.askQuestionForScope("folder");
  }

  async askQuestion(): Promise<void> {
    try {
      const scope = await new QuestionScopeModal(this.app, {
        title: "Ask Question",
      }).openPicker();
      if (!scope) {
        return;
      }

      await this.askQuestionForScope(scope);
    } catch (error) {
      console.error(error);
      new Notice(error instanceof Error ? error.message : "Could not ask Brain");
    }
  }

  async createTopicPage(): Promise<void> {
    await this.createTopicPageForScope();
  }

  async createTopicPageForScope(defaultScope?: QuestionScope): Promise<void> {
    try {
      const topic = await new PromptModal(this.app, {
        title: "Create Topic Page",
        placeholder: "Topic or question to turn into a wiki page...",
        submitLabel: "Create",
        multiline: true,
      }).openPrompt();
      if (!topic) {
        return;
      }

      const scope = defaultScope ?? await new QuestionScopeModal(this.app, {
        title: "Create Topic Page",
      }).openPicker();
      if (!scope) {
        return;
      }

      const context = await this.resolveContextForScope(
        scope,
        "Select Notes for Topic Page",
      );
      if (!context) {
        return;
      }

      const result = await this.topicPageService.createTopicPage(topic, context);
      const saved = await this.noteService.createGeneratedNote(
        result.noteTitle,
        result.content,
        context.sourceLabel,
        context.sourcePath,
        context.sourcePaths,
      );

      this.lastSummaryAt = new Date();
      this.updateSidebarSummary(result.content);
      this.updateSidebarResult(
        result.usedAI
          ? `AI topic page saved to ${saved.path}`
          : `Topic page saved to ${saved.path}`,
      );
      await this.refreshSidebarStatusBestEffort();
      new Notice(`Topic page saved to ${saved.path}`);

      const leaf = this.app.workspace.getLeaf(false) ?? this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.openFile(saved);
        this.app.workspace.revealLeaf(leaf);
      }
    } catch (error) {
      console.error(error);
      new Notice(
        error instanceof Error ? error.message : "Could not create that topic page",
      );
    }
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

  async saveSynthesisResult(
    result: SynthesisResult,
    context: SynthesisContext,
  ): Promise<string> {
    const saved = await this.noteService.createGeneratedNote(
      result.noteTitle,
      this.buildSynthesisNoteContent(result, context),
      context.sourceLabel,
      context.sourcePath,
      context.sourcePaths,
    );
    return `Saved artifact to ${saved.path}`;
  }

  async insertSynthesisIntoCurrentNote(
    result: SynthesisResult,
    context: SynthesisContext,
  ): Promise<string> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      throw new Error("Open a markdown note first");
    }

    const addition = this.buildInsertedSynthesisContent(result, context);
    const editor = view.editor;
    const lastLine = editor.lastLine();
    const lastLineText = editor.getLine(lastLine);
    const endPosition = { line: lastLine, ch: lastLineText.length };
    const separator = this.getAppendSeparator(editor.getValue());
    editor.replaceRange(`${separator}${addition}\n`, endPosition);
    return `Inserted synthesis into ${view.file.path}`;
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

  private async askBrainForContext(
    resolver: () => Promise<SynthesisContext>,
    modalTitle: string,
    defaultTemplate?: SynthesisTemplate,
  ): Promise<void> {
    try {
      const context = await resolver();
      const template = defaultTemplate ?? (await this.pickSynthesisTemplate(modalTitle));
      if (!template) {
        return;
      }

      await this.runSynthesisFlow(context, template);
    } catch (error) {
      console.error(error);
      new Notice(
        error instanceof Error ? error.message : "Could not synthesize that context",
      );
    }
  }

  private async askQuestionForScope(scope: QuestionScope): Promise<void> {
    switch (scope) {
      case "note":
        await this.askQuestionWithContext(
          () => this.contextService.getCurrentNoteContext(),
          "Ask Question About Current Note",
        );
        return;
      case "folder":
        await this.askQuestionWithContext(
          () => this.contextService.getCurrentFolderContext(),
          "Ask Question About Current Folder",
        );
        return;
      case "vault":
        await this.askQuestionWithContext(
          () => this.contextService.getVaultContext(),
          "Ask Question About Entire Vault",
        );
        return;
      case "group":
        await this.askQuestionAboutSelectedGroup();
        return;
      default:
        return;
    }
  }

  private async resolveContextForScope(
    scope: QuestionScope,
    groupPickerTitle: string,
  ): Promise<SynthesisContext | null> {
    switch (scope) {
      case "note":
        return await this.contextService.getCurrentNoteContext();
      case "folder":
        return await this.contextService.getCurrentFolderContext();
      case "vault":
        return await this.contextService.getVaultContext();
      case "group": {
        const files = await this.pickSelectedMarkdownFiles(groupPickerTitle);
        if (!files || !files.length) {
          return null;
        }
        return await this.contextService.getSelectedFilesContext(files);
      }
      default:
        return null;
    }
  }

  private async askQuestionAboutSelectedGroup(): Promise<void> {
    try {
      const files = await this.pickSelectedMarkdownFiles("Select Notes");
      if (!files || !files.length) {
        return;
      }

      await this.askQuestionWithContext(
        () => this.contextService.getSelectedFilesContext(files),
        "Ask Question About Selected Notes",
      );
    } catch (error) {
      console.error(error);
      new Notice(
        error instanceof Error ? error.message : "Could not select notes for Brain",
      );
    }
  }

  private async pickSelectedMarkdownFiles(title: string): Promise<TFile[] | null> {
    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => !this.isBrainGeneratedFile(file.path))
      .sort((left, right) => right.stat.mtime - left.stat.mtime);

    if (!files.length) {
      new Notice("No markdown files found");
      return null;
    }

    return await new FileGroupPickerModal(this.app, files, {
      title,
    }).openPicker();
  }

  private async askQuestionWithContext(
    resolver: () => Promise<SynthesisContext>,
    modalTitle: string,
  ): Promise<void> {
    try {
      const context = await resolver();
      const question = await new PromptModal(this.app, {
        title: modalTitle,
        placeholder: "Ask a question about this context...",
        submitLabel: "Ask",
        multiline: true,
      }).openPrompt();
      if (!question) {
        return;
      }

      const result = await this.questionService.answerQuestion(question, context);
      this.lastSummaryAt = new Date();
      this.updateSidebarSummary(result.content);
      this.updateSidebarResult(
        result.usedAI
          ? `AI answer from ${context.sourceLabel}`
          : `Local answer from ${context.sourceLabel}`,
      );
      await this.refreshSidebarStatusBestEffort();
      new SynthesisResultModal(this.app, {
        context,
        result,
        canInsert: this.hasActiveMarkdownNote(),
        onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
        onSave: async () => this.saveSynthesisResult(result, context),
        onActionComplete: async (message) => {
          await this.reportActionResult(message);
        },
      }).open();
    } catch (error) {
      console.error(error);
      new Notice(
        error instanceof Error ? error.message : "Could not answer that question",
      );
    }
  }

  private async runSynthesisFlow(
    context: SynthesisContext,
    template: SynthesisTemplate,
  ): Promise<void> {
    const result = await this.synthesisService.run(template, context);
    this.lastSummaryAt = new Date();
    this.updateSidebarSummary(result.content);
    this.updateSidebarResult(
      result.usedAI
        ? `AI ${result.title.toLowerCase()} from ${context.sourceLabel}`
        : `Local ${result.title.toLowerCase()} from ${context.sourceLabel}`,
    );
    await this.refreshSidebarStatusBestEffort();
    new SynthesisResultModal(this.app, {
      context,
      result,
      canInsert: this.hasActiveMarkdownNote(),
      onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
      onSave: async () => this.saveSynthesisResult(result, context),
      onActionComplete: async (message) => {
        await this.reportActionResult(message);
      },
    }).open();
  }

  private async pickSynthesisTemplate(
    title: string,
  ): Promise<SynthesisTemplate | null> {
    return await new TemplatePickerModal(this.app, { title }).openPicker();
  }

  private buildSynthesisNoteContent(
    result: SynthesisResult,
    context: SynthesisContext,
  ): string {
    return [
      `Action: ${result.action}`,
      `Generated: ${formatDateTimeKey(new Date())}`,
      `Context length: ${context.originalLength} characters.`,
      "",
      this.stripLeadingTitle(result.content),
      "",
    ].join("\n");
  }

  private buildInsertedSynthesisContent(
    result: SynthesisResult,
    context: SynthesisContext,
  ): string {
    return [
      `## Brain ${result.title}`,
      ...this.buildContextBulletLines(context),
      `- Generated: ${formatDateTimeKey(new Date())}`,
      "",
      this.stripLeadingTitle(result.content),
    ].join("\n");
  }

  private hasActiveMarkdownNote(): boolean {
    return Boolean(this.app.workspace.getActiveViewOfType(MarkdownView)?.file);
  }

  private buildContextSourceLines(context: SynthesisContext): string[] {
    return formatContextSourceLines(context);
  }

  private buildContextBulletLines(context: SynthesisContext): string[] {
    const sourceLines = this.buildContextSourceLines(context);
    return sourceLines.map((line) => `- ${line}`);
  }

  private async initializeLastArtifactTimestamp(): Promise<void> {
    try {
      const files = await this.vaultService.listMarkdownFiles();
      let latest = 0;
      for (const file of files) {
        if (!this.isArtifactFile(file.path)) {
          continue;
        }
        if (file.stat.mtime > latest) {
          latest = file.stat.mtime;
        }
      }
      this.lastSummaryAt = latest > 0 ? new Date(latest) : null;
    } catch (error) {
      console.error(error);
      this.lastSummaryAt = null;
    }
  }

  private isArtifactFile(path: string): boolean {
    return (
      this.isUnderFolder(path, this.settings.notesFolder) ||
      this.isUnderFolder(path, this.settings.summariesFolder)
    );
  }

  private isBrainGeneratedFile(path: string): boolean {
    return (
      this.isUnderFolder(path, this.settings.summariesFolder) ||
      this.isUnderFolder(path, this.settings.reviewsFolder)
    );
  }

  private isUnderFolder(path: string, folder: string): boolean {
    const normalized = folder.replace(/\/+$/, "");
    return path === normalized || path.startsWith(`${normalized}/`);
  }

  private getAppendSeparator(text: string): string {
    if (!text.trim()) {
      return "";
    }
    if (text.endsWith("\n\n")) {
      return "";
    }
    if (text.endsWith("\n")) {
      return "\n";
    }
    return "\n\n";
  }

  private stripLeadingTitle(content: string): string {
    const lines = content.trim().split("\n");
    if (!lines.length) {
      return "";
    }

    if (!/^#\s+/.test(lines[0])) {
      return content.trim();
    }

    const remaining = lines.slice(1);
    while (remaining.length > 0 && !remaining[0].trim()) {
      remaining.shift();
    }
    return remaining.join("\n").trim();
  }

  private getActiveSelectionText(): string {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = activeView?.editor?.getSelection()?.trim() ?? "";
    return selection;
  }
}
