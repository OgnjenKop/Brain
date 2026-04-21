import { App, MarkdownView, Notice, TFile } from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { QuestionScope, SynthesisTemplate } from "../types";
import { ContextService, SynthesisContext } from "./context-service";
import { SynthesisResult, SynthesisService } from "./synthesis-service";
import { TopicPageService } from "./topic-page-service";
import { QuestionService } from "./question-service";
import { NoteService } from "./note-service";
import { FileGroupPickerModal } from "../views/file-group-picker-modal";
import { PromptModal } from "../views/prompt-modals";
import { QuestionScopeModal } from "../views/question-scope-modal";
import { SynthesisResultModal } from "../views/synthesis-result-modal";
import { TemplatePickerModal } from "../views/template-picker-modal";
import { buildSynthesisNoteContent, buildInsertedSynthesisContent } from "../utils/synthesis-format";
import { showError } from "../utils/error-handler";
import { isBrainGeneratedPath } from "../utils/path";
import { getAppendSeparator } from "../utils/text";

export interface BrainWorkflowCallbacks {
  updateResult(text: string): void;
  updateSummary(text: string): void;
  refreshStatus(): Promise<void>;
  reportActionResult(message: string): Promise<void>;
  hasActiveMarkdownNote(): boolean;
  setLastSummaryAt(date: Date): void;
}

export class BrainWorkflowService {
  constructor(
    private readonly app: App,
    private readonly settingsProvider: () => BrainPluginSettings,
    private readonly contextService: ContextService,
    private readonly synthesisService: SynthesisService,
    private readonly topicPageService: TopicPageService,
    private readonly questionService: QuestionService,
    private readonly noteService: NoteService,
    private readonly callbacks: BrainWorkflowCallbacks,
  ) {}

  async askAboutCurrentNote(defaultTemplate?: SynthesisTemplate): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getCurrentNoteContext(),
      defaultTemplate ? "Summarize Current Note" : "Synthesize Current Note",
      defaultTemplate,
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
      "Clean Note From Recent Files",
      "rewrite-clean-note",
    );
  }

  async askAboutCurrentFolder(): Promise<void> {
    await this.askBrainForContext(
      () => this.contextService.getCurrentFolderContext(),
      "Draft Brief From Current Folder",
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
      showError(error, "Could not synthesize these notes");
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
      showError(error, "Could not ask Brain");
    }
  }

  async createTopicPage(defaultScope?: QuestionScope): Promise<void> {
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

      this.callbacks.setLastSummaryAt(new Date());
      this.callbacks.updateSummary(result.content);
      this.callbacks.updateResult(
        result.usedAI
          ? `AI topic page saved to ${saved.path}`
          : `Topic page saved to ${saved.path}`,
      );
      await this.callbacks.refreshStatus();
      new Notice(`Topic page saved to ${saved.path}`);

      const leaf = this.app.workspace.getLeaf(false) ?? this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.openFile(saved);
        this.app.workspace.revealLeaf(leaf);
      }
    } catch (error) {
      showError(error, "Could not create that topic page");
    }
  }

  async saveSynthesisResult(
    result: SynthesisResult,
    context: SynthesisContext,
  ): Promise<string> {
    const saved = await this.noteService.createGeneratedNote(
      result.noteTitle,
      buildSynthesisNoteContent(result, context),
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

    const addition = buildInsertedSynthesisContent(result, context);
    const editor = view.editor;
    const lastLine = editor.lastLine();
    const lastLineText = editor.getLine(lastLine);
    const endPosition = { line: lastLine, ch: lastLineText.length };
    const separator = getAppendSeparator(editor.getValue());
    editor.replaceRange(`${separator}${addition}\n`, endPosition);
    return `Inserted synthesis into ${view.file.path}`;
  }

  getActiveSelectionText(): string {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = activeView?.editor?.getSelection()?.trim() ?? "";
    return selection;
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
      showError(error, "Could not synthesize that context");
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
      showError(error, "Could not select notes for Brain");
    }
  }

  private async pickSelectedMarkdownFiles(title: string): Promise<TFile[] | null> {
    const settings = this.settingsProvider();
    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => !isBrainGeneratedPath(file.path, settings))
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
      this.callbacks.setLastSummaryAt(new Date());
      this.callbacks.updateSummary(result.content);
      this.callbacks.updateResult(
        result.usedAI
          ? `AI answer from ${context.sourceLabel}`
          : `Local answer from ${context.sourceLabel}`,
      );
      await this.callbacks.refreshStatus();
      new SynthesisResultModal(this.app, {
        context,
        result,
        canInsert: this.callbacks.hasActiveMarkdownNote(),
        onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
        onSave: async () => this.saveSynthesisResult(result, context),
        onActionComplete: async (message) => {
          await this.callbacks.reportActionResult(message);
        },
      }).open();
    } catch (error) {
      showError(error, "Could not answer that question");
    }
  }

  private async runSynthesisFlow(
    context: SynthesisContext,
    template: SynthesisTemplate,
  ): Promise<void> {
    const result = await this.synthesisService.run(template, context);
    this.callbacks.setLastSummaryAt(new Date());
    this.callbacks.updateSummary(result.content);
    this.callbacks.updateResult(
      result.usedAI
        ? `AI ${result.title.toLowerCase()} from ${context.sourceLabel}`
        : `Local ${result.title.toLowerCase()} from ${context.sourceLabel}`,
    );
    await this.callbacks.refreshStatus();
    new SynthesisResultModal(this.app, {
      context,
      result,
      canInsert: this.callbacks.hasActiveMarkdownNote(),
      onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
      onSave: async () => this.saveSynthesisResult(result, context),
      onActionComplete: async (message) => {
        await this.callbacks.reportActionResult(message);
      },
    }).open();
  }

  private async pickSynthesisTemplate(
    title: string,
  ): Promise<SynthesisTemplate | null> {
    return await new TemplatePickerModal(this.app, { title }).openPicker();
  }
}
