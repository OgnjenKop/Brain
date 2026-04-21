import { Plugin } from "obsidian";
import type { QuestionScope } from "../types";

interface BrainCommandHost {
  addCommand: Plugin["addCommand"];
  captureFromModal(
    title: string,
    submitLabel: string,
    action: (text: string) => Promise<string>,
    multiline?: boolean,
  ): Promise<void>;
  noteService: { appendNote(text: string): Promise<{ path: string }> };
  taskService: { appendTask(text: string): Promise<{ path: string }> };
  journalService: { appendEntry(text: string): Promise<{ path: string }> };
  processInbox(): Promise<void>;
  openReviewHistory(): Promise<void>;
  generateSummaryForWindow(lookbackDays?: number, label?: string): Promise<unknown>;
  addTaskFromSelection(): Promise<void>;
  openTodaysJournal(): Promise<void>;
  openSidebar(): Promise<void>;
  synthesizeNotes(): Promise<void>;
  askAboutCurrentNoteWithTemplate(): Promise<void>;
  askQuestion(): Promise<void>;
  askQuestionAboutCurrentNote(): Promise<void>;
  createTopicPage(): Promise<void>;
  createTopicPageForScope(scope?: QuestionScope): Promise<void>;
}

export function registerCommands(plugin: BrainCommandHost): void {
  plugin.addCommand({
    id: "capture-note",
    name: "Brain: Capture Note",
    callback: async () => {
      await plugin.captureFromModal("Capture Note", "Capture", async (text) => {
        const saved = await plugin.noteService.appendNote(text);
        return `Captured note in ${saved.path}`;
      });
    },
  });

  plugin.addCommand({
    id: "add-task",
    name: "Brain: Capture Task",
    callback: async () => {
      await plugin.captureFromModal("Capture Task", "Capture", async (text) => {
        const saved = await plugin.taskService.appendTask(text);
        return `Saved task to ${saved.path}`;
      });
    },
  });

  plugin.addCommand({
    id: "add-journal-entry",
    name: "Brain: Capture Journal",
    callback: async () => {
      await plugin.captureFromModal(
        "Capture Journal",
        "Capture",
        async (text) => {
          const saved = await plugin.journalService.appendEntry(text);
          return `Saved journal entry to ${saved.path}`;
        },
        true,
      );
    },
  });

  plugin.addCommand({
    id: "process-inbox",
    name: "Brain: Review Inbox",
    callback: async () => {
      await plugin.processInbox();
    },
  });

  plugin.addCommand({
    id: "review-history",
    name: "Brain: Open Review History",
    callback: async () => {
      await plugin.openReviewHistory();
    },
  });

  plugin.addCommand({
    id: "summarize-today",
    name: "Brain: Generate Today Summary",
    callback: async () => {
      await plugin.generateSummaryForWindow(1, "Today");
    },
  });

  plugin.addCommand({
    id: "summarize-this-week",
    name: "Brain: Generate Weekly Summary",
    callback: async () => {
      await plugin.generateSummaryForWindow(7, "Week");
    },
  });

  plugin.addCommand({
    id: "add-task-from-selection",
    name: "Brain: Capture Task From Selection",
    callback: async () => {
      await plugin.addTaskFromSelection();
    },
  });

  plugin.addCommand({
    id: "open-todays-journal",
    name: "Brain: Open Today's Journal",
    callback: async () => {
      await plugin.openTodaysJournal();
    },
  });

  plugin.addCommand({
    id: "open-sidebar",
    name: "Brain: Open Brain Sidebar",
    callback: async () => {
      await plugin.openSidebar();
    },
  });

  plugin.addCommand({
    id: "synthesize-notes",
    name: "Brain: Synthesize Notes",
    callback: async () => {
      await plugin.synthesizeNotes();
    },
  });

  plugin.addCommand({
    id: "synthesize-current-note",
    name: "Brain: Synthesize Current Note",
    callback: async () => {
      await plugin.askAboutCurrentNoteWithTemplate();
    },
  });

  plugin.addCommand({
    id: "ask-question",
    name: "Brain: Ask Question",
    callback: async () => {
      await plugin.askQuestion();
    },
  });

  plugin.addCommand({
    id: "ask-question-current-note",
    name: "Brain: Ask Question About Current Note",
    callback: async () => {
      await plugin.askQuestionAboutCurrentNote();
    },
  });

  plugin.addCommand({
    id: "create-topic-page",
    name: "Brain: Generate Topic Page",
    callback: async () => {
      await plugin.createTopicPage();
    },
  });

  plugin.addCommand({
    id: "create-topic-page-current-note",
    name: "Brain: Generate Topic Page From Current Note",
    callback: async () => {
      await plugin.createTopicPageForScope("note");
    },
  });
}
