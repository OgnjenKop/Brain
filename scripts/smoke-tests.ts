import assert from "node:assert/strict";
import { buildFallbackSummary } from "../src/utils/summary-format";
import { normalizeSummary } from "../src/utils/summary-normalize";
import { buildFallbackSynthesis } from "../src/utils/synthesis-format";
import { normalizeSynthesisOutput } from "../src/utils/synthesis-normalize";
import { buildFallbackTaskExtraction } from "../src/utils/task-extract-format";
import { normalizeTaskExtractionOutput } from "../src/utils/task-extract-normalize";
import { buildFallbackDecisionExtraction } from "../src/utils/decision-extract-format";
import { normalizeDecisionExtractionOutput } from "../src/utils/decision-extract-normalize";
import { buildFallbackOpenQuestions } from "../src/utils/open-questions-format";
import { normalizeOpenQuestionsOutput } from "../src/utils/open-questions-normalize";
import { buildFallbackCleanNote } from "../src/utils/clean-note-format";
import { normalizeCleanNoteOutput } from "../src/utils/clean-note-normalize";
import { buildFallbackProjectBrief } from "../src/utils/project-brief-format";
import { normalizeProjectBriefOutput } from "../src/utils/project-brief-normalize";
import { buildFallbackQuestionAnswer } from "../src/utils/question-answer-format";
import { normalizeQuestionAnswerOutput } from "../src/utils/question-answer-normalize";
import { buildFallbackTopicPage } from "../src/utils/topic-page-format";
import { normalizeTopicPageOutput } from "../src/utils/topic-page-normalize";
import {
  getSynthesisTemplateButtonLabel,
  getSynthesisTemplateTitle,
} from "../src/utils/synthesis-template";
import {
  formatContextLocation,
  formatContextMetadataLines,
  formatContextSourceLines,
} from "../src/utils/context-format";
import {
  DEFAULT_BRAIN_SETTINGS,
  normalizeBrainSettings,
} from "../src/settings/settings";
import {
  InboxService,
  InboxVaultService,
  parseInboxEntries,
} from "../src/services/inbox-service";
import { parseReviewLogEntries } from "../src/services/review-log-service";
import { TaskService, TaskVaultService } from "../src/services/task-service";
import {
  formatDateKey,
  formatDateTimeKey,
  formatSummaryTimestamp,
  formatTimeKey,
} from "../src/utils/date";

async function run(): Promise<void> {
  const normalized = normalizeBrainSettings({
    inboxFile: "/Brain/inbox.md",
    tasksFile: "  Brain/tasks.md  ",
    summaryLookbackDays: "0" as unknown as number,
    summaryMaxChars: -10 as unknown as number,
    openAIModel: " ",
    openAIApiKey: "  secret  ",
  });

  assert.equal(normalized.inboxFile, "Brain/inbox.md");
  assert.equal(normalized.tasksFile, "Brain/tasks.md");
  assert.equal(normalized.summaryLookbackDays, 1);
  assert.equal(normalized.summaryMaxChars, 1000);
  assert.equal(normalized.openAIModel, DEFAULT_BRAIN_SETTINGS.openAIModel);
  assert.equal(normalized.openAIApiKey, "secret");
  assert.equal(normalized.notesFolder, DEFAULT_BRAIN_SETTINGS.notesFolder);

  const date = new Date("2026-04-11T22:15:00");
  assert.equal(formatDateKey(date), "2026-04-11");
  assert.equal(formatTimeKey(date), "22:15");
  assert.equal(formatDateTimeKey(date), "2026-04-11 22:15");
  assert.equal(formatSummaryTimestamp(date), "2026-04-11-2215");

  const summary = buildFallbackSummary([
    "# Project Alpha",
    "- [ ] Send proposal",
    "- Follow up with client",
    "Plain text note",
  ].join("\n"));

  assert.match(summary, /## Highlights/);
  assert.match(summary, /Project Alpha/);
  assert.match(summary, /## Tasks/);
  assert.match(summary, /Send proposal/);
  assert.match(summary, /## Follow-ups/);
  assert.match(summary, /Send proposal/);

  const synthesis = buildFallbackSynthesis([
    "# Research",
    "- [ ] Draft outline",
    "- Main point",
    "Open question?",
  ].join("\n"));

  assert.match(synthesis, /## Summary/);
  assert.match(synthesis, /Research/);
  assert.match(synthesis, /## Key Themes/);
  assert.match(synthesis, /Main point/);
  assert.match(synthesis, /## Follow-ups/);
  assert.match(synthesis, /Draft outline/);

  const normalizedSynthesis = normalizeSynthesisOutput([
    "## Summary",
    "- Alpha",
    "",
    "## Key Themes",
    "- Beta",
  ].join("\n"));

  assert.match(normalizedSynthesis, /## Summary/);
  assert.match(normalizedSynthesis, /## Key Themes/);
  assert.match(normalizedSynthesis, /## Follow-ups/);
  assert.match(normalizedSynthesis, /Review the source context\./);

  const taskExtraction = buildFallbackTaskExtraction([
    "# Project Alpha",
    "- [ ] Send proposal",
    "- Client needs pricing",
    "What is the next step?",
  ].join("\n"));

  assert.match(taskExtraction, /## Tasks/);
  assert.match(taskExtraction, /Send proposal/);
  assert.match(taskExtraction, /## Context/);
  assert.match(taskExtraction, /Client needs pricing/);
  assert.match(taskExtraction, /## Follow-ups/);
  assert.match(taskExtraction, /What is the next step\?/);

  const normalizedTaskExtraction = normalizeTaskExtractionOutput([
    "## Tasks",
    "- Send proposal",
    "",
    "## Context",
    "- Client notes",
  ].join("\n"));

  assert.match(normalizedTaskExtraction, /## Tasks/);
  assert.match(normalizedTaskExtraction, /## Context/);
  assert.match(normalizedTaskExtraction, /## Follow-ups/);
  assert.match(normalizedTaskExtraction, /Review the source context\./);

  const decisionExtraction = buildFallbackDecisionExtraction([
    "# API design",
    "- We decided to keep markdown as source of truth",
    "- Because users need inspectable output",
    "Should we add richer review metadata?",
  ].join("\n"));

  assert.match(decisionExtraction, /## Decisions/);
  assert.match(decisionExtraction, /source of truth/);
  assert.match(decisionExtraction, /## Rationale/);
  assert.match(decisionExtraction, /Because users need inspectable output/);
  assert.match(decisionExtraction, /## Open Questions/);

  const normalizedDecisionExtraction = normalizeDecisionExtractionOutput([
    "## Decisions",
    "- Keep markdown canonical",
    "",
    "## Rationale",
    "- Preserve inspectability",
  ].join("\n"));

  assert.match(normalizedDecisionExtraction, /## Decisions/);
  assert.match(normalizedDecisionExtraction, /## Rationale/);
  assert.match(normalizedDecisionExtraction, /## Open Questions/);
  assert.match(normalizedDecisionExtraction, /Review the source context\./);

  const openQuestionsExtraction = buildFallbackOpenQuestions([
    "# Sprint planning",
    "- What should ship first?",
    "- Need to validate the migration path",
    "- Follow up with design by Friday",
  ].join("\n"));

  assert.match(openQuestionsExtraction, /## Open Questions/);
  assert.match(openQuestionsExtraction, /What should ship first\?/);
  assert.match(openQuestionsExtraction, /## Context/);
  assert.match(openQuestionsExtraction, /Need to validate the migration path/);
  assert.match(openQuestionsExtraction, /## Follow-ups/);

  const normalizedOpenQuestions = normalizeOpenQuestionsOutput([
    "## Open Questions",
    "- What ships first?",
    "",
    "## Context",
    "- Planning notes",
  ].join("\n"));

  assert.match(normalizedOpenQuestions, /## Open Questions/);
  assert.match(normalizedOpenQuestions, /## Context/);
  assert.match(normalizedOpenQuestions, /## Follow-ups/);
  assert.match(normalizedOpenQuestions, /Review the source context\./);

  const cleanNote = buildFallbackCleanNote([
    "# Project Alpha",
    "- [ ] Send proposal",
    "- Main point",
    "What else is missing?",
  ].join("\n"));

  assert.match(cleanNote, /# Clean Note/);
  assert.match(cleanNote, /## Overview/);
  assert.match(cleanNote, /Project Alpha/);
  assert.match(cleanNote, /## Key Points/);
  assert.match(cleanNote, /Send proposal/);
  assert.match(cleanNote, /## Open Questions/);
  assert.match(cleanNote, /What else is missing\?/);

  const normalizedCleanNote = normalizeCleanNoteOutput([
    "# Clean Note",
    "",
    "## Overview",
    "- Alpha",
  ].join("\n"));

  assert.match(normalizedCleanNote, /# Clean Note/);
  assert.match(normalizedCleanNote, /## Overview/);
  assert.match(normalizedCleanNote, /## Key Points/);
  assert.match(normalizedCleanNote, /## Open Questions/);

  const projectBrief = buildFallbackProjectBrief([
    "# Project Alpha",
    "- [ ] Send proposal",
    "- Need pricing clarity",
    "What is the objective?",
  ].join("\n"));

  assert.match(projectBrief, /# Project Brief/);
  assert.match(projectBrief, /## Overview/);
  assert.match(projectBrief, /Project Alpha/);
  assert.match(projectBrief, /## Goals/);
  assert.match(projectBrief, /Need pricing clarity/);
  assert.match(projectBrief, /## Next Steps/);
  assert.match(projectBrief, /Send proposal/);

  const normalizedProjectBrief = normalizeProjectBriefOutput([
    "# Project Brief",
    "",
    "## Overview",
    "- Alpha",
  ].join("\n"));

  assert.match(normalizedProjectBrief, /# Project Brief/);
  assert.match(normalizedProjectBrief, /## Overview/);
  assert.match(normalizedProjectBrief, /## Goals/);
  assert.match(normalizedProjectBrief, /## Scope/);
  assert.match(normalizedProjectBrief, /## Next Steps/);

  const topicPage = buildFallbackTopicPage(
    "Research notes",
    [
      "# Research Notes",
      "- We should publish the internal draft first",
      "- Open question about rollout?",
      "- [ ] Follow up with design",
    ].join("\n"),
    "Selected notes",
    null,
    ["notes/research.md", "notes/design.md"],
  );

  assert.match(topicPage, /## Overview/);
  assert.match(topicPage, /- Topic: Research notes/);
  assert.match(topicPage, /## Evidence/);
  assert.match(topicPage, /## Open Questions/);
  assert.match(topicPage, /## Sources/);
  assert.match(topicPage, /notes\/research\.md/);
  assert.match(topicPage, /## Next Steps/);

  const normalizedTopicPage = normalizeTopicPageOutput([
    "## Overview",
    "- Alpha",
    "",
    "## Evidence",
    "- Beta",
    "",
    "## Open Questions",
    "- Gamma",
    "",
    "## Sources",
    "- notes/research.md",
    "",
    "## Next Steps",
    "- Review the source context.",
  ].join("\n"));

  assert.match(normalizedTopicPage, /## Overview/);
  assert.match(normalizedTopicPage, /## Evidence/);
  assert.match(normalizedTopicPage, /## Open Questions/);
  assert.match(normalizedTopicPage, /## Sources/);
  assert.match(normalizedTopicPage, /## Next Steps/);

  const questionAnswer = buildFallbackQuestionAnswer(
    "What decisions did I make?",
    [
      "# Project Alpha",
      "- We should ship the MVP first",
      "- Need pricing clarity",
      "Open question?",
    ].join("\n"),
  );

  assert.match(questionAnswer, /# Answer/);
  assert.match(questionAnswer, /## Question/);
  assert.match(questionAnswer, /What decisions did I make\?/);
  assert.match(questionAnswer, /## Evidence/);
  assert.match(questionAnswer, /ship the MVP first/);
  assert.match(questionAnswer, /## Follow-ups/);

  const normalizedQuestionAnswer = normalizeQuestionAnswerOutput([
    "# Answer",
    "",
    "## Question",
    "What decisions did I make?",
    "",
    "## Answer",
    "The context suggests the MVP should ship first.",
    "",
    "## Evidence",
    "- We should ship the MVP first",
  ].join("\n"));

  assert.match(normalizedQuestionAnswer, /# Answer/);
  assert.match(normalizedQuestionAnswer, /## Question/);
  assert.match(normalizedQuestionAnswer, /## Answer/);
  assert.match(normalizedQuestionAnswer, /## Evidence/);
  assert.match(normalizedQuestionAnswer, /## Follow-ups/);

  assert.equal(getSynthesisTemplateTitle("summarize"), "Summary");
  assert.equal(getSynthesisTemplateTitle("extract-tasks"), "Task Extraction");
  assert.equal(getSynthesisTemplateTitle("extract-decisions"), "Decision Extraction");
  assert.equal(getSynthesisTemplateTitle("extract-open-questions"), "Open Questions");
  assert.equal(getSynthesisTemplateTitle("rewrite-clean-note"), "Clean Note");
  assert.equal(getSynthesisTemplateTitle("draft-project-brief"), "Project Brief");

  assert.equal(getSynthesisTemplateButtonLabel("summarize"), "Summarize");
  assert.equal(getSynthesisTemplateButtonLabel("extract-tasks"), "Extract Tasks");
  assert.equal(
    getSynthesisTemplateButtonLabel("extract-decisions"),
    "Extract Decisions",
  );
  assert.equal(
    getSynthesisTemplateButtonLabel("extract-open-questions"),
    "Extract Open Questions",
  );
  assert.equal(
    getSynthesisTemplateButtonLabel("rewrite-clean-note"),
    "Rewrite as Clean Note",
  );
  assert.equal(
    getSynthesisTemplateButtonLabel("draft-project-brief"),
    "Draft Project Brief",
  );

  const questionContext = {
    sourceLabel: "Selected notes",
    sourcePath: "notes/alpha.md",
    sourcePaths: ["notes/alpha.md", "notes/beta.md", "notes/gamma.md"],
    text: "content",
    originalLength: 7,
    truncated: false,
    maxChars: 12000,
  };

  assert.equal(formatContextLocation(questionContext), "Selected notes • 3 files");
  assert.match(formatContextMetadataLines(questionContext).join("\n"), /Context files:/);
  assert.match(formatContextMetadataLines(questionContext).join("\n"), /notes\/beta\.md/);

  const sourceLines = formatContextSourceLines(questionContext);
  assert.equal(sourceLines[0], "Source: Selected notes");
  assert.equal(sourceLines[1], "Source path: notes/alpha.md");
  assert.equal(sourceLines[2], "Source files:");
  assert.equal(sourceLines[3], "notes/alpha.md");
  assert.equal(sourceLines[4], "notes/beta.md");
  assert.equal(sourceLines[5], "notes/gamma.md");
  assert.ok(!sourceLines.some((line) => line.startsWith("- ")));

  const singleFileContext = {
    ...questionContext,
    sourcePaths: ["notes/alpha.md"],
  };
  assert.equal(formatContextLocation(singleFileContext), "Selected notes • 1 file");

  const inboxEntries = parseInboxEntries([
    "## 2026-04-11 09:00",
    "- First inbox item",
    "<!-- brain-reviewed: task 2026-04-11 10:00 -->",
    "",
    "## 2026-04-11 11:00",
    "- Second inbox item",
  ].join("\n"));

  assert.equal(inboxEntries.length, 2);
  assert.equal(inboxEntries[0].reviewed, true);
  assert.equal(inboxEntries[0].reviewAction, "task");
  assert.equal(inboxEntries[1].reviewed, false);

  const duplicateEntries = parseInboxEntries([
    "## 2026-04-11 09:00",
    "- Duplicate item",
    "## 2026-04-11 09:00",
    "- Duplicate item",
  ].join("\n"));

  assert.equal(duplicateEntries[0].signatureIndex, 0);
  assert.equal(duplicateEntries[1].signatureIndex, 1);

  const reviewEntries = parseReviewLogEntries([
    "## 2026-04-11 09:00",
    "- Action: task",
    "- Inbox: First inbox item",
    "- Preview: First inbox item",
    `- Signature: ${encodeURIComponent("## 2026-04-11 09:00\n- First inbox item")}`,
    "- Signature index: 0",
    "",
    "## 2026-04-11 10:00",
    "- Action: reopen",
    "- Inbox: First inbox item",
    "- Preview: First inbox item",
    `- Signature: ${encodeURIComponent("## 2026-04-11 09:00\n- First inbox item")}`,
    "- Signature index: 0",
  ].join("\n"), "Brain/reviews/2026-04-11.md", 123);

  assert.equal(reviewEntries.length, 2);
  assert.equal(reviewEntries[0].action, "task");
  assert.equal(reviewEntries[1].action, "reopen");
  assert.equal(reviewEntries[0].signatureIndex, 0);

  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": {
      text: [
        "## 2026-04-11 09:00",
        "- First item",
        "<!-- brain-reviewed: task 2026-04-11 09:05 -->",
        "",
        "## 2026-04-11 10:00",
        "- Second item",
      ].join("\n"),
      mtime: 100,
    },
    "Brain/tasks.md": {
      text: [
        "- [ ] First task",
        "- [x] Done task",
        "- [ ] Second task",
      ].join("\n"),
      mtime: 200,
    },
  });
  const settingsProvider = () => normalizeBrainSettings({});
  const inboxService = new InboxService(fakeVault, settingsProvider);
  const taskService = new TaskService(fakeVault, settingsProvider);

  assert.equal(await inboxService.getUnreviewedCount(), 1);
  assert.equal(await inboxService.getUnreviewedCount(), 1);
  assert.equal(await taskService.getOpenTaskCount(), 2);
  assert.equal(await taskService.getOpenTaskCount(), 2);

  fakeVault.setFile("Brain/inbox.md", [
    "## 2026-04-11 09:00",
    "- First item",
    "",
    "## 2026-04-11 10:00",
    "- Second item",
  ].join("\n"), 101);
  fakeVault.setFile("Brain/tasks.md", [
    "- [ ] First task",
    "- [ ] Second task",
    "- [ ] Third task",
  ].join("\n"), 201);

  assert.equal(await inboxService.getUnreviewedCount(), 2);
  assert.equal(await taskService.getOpenTaskCount(), 3);

  const normalizedSummary = normalizeSummary([
    "## Highlights",
    "- Alpha",
    "",
    "## Tasks",
    "- [ ] Beta",
  ].join("\n"));

  assert.match(normalizedSummary, /## Highlights/);
  assert.match(normalizedSummary, /## Tasks/);
  assert.match(normalizedSummary, /## Follow-ups/);
  assert.match(normalizedSummary, /Review recent notes\./);
  
  // New behavioral regressions
  await testInboxPromotionFlow();
  await testScopeAggregation();
  await testReopenEdgeCases();
}

async function testInboxPromotionFlow() {
  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": {
      text: "## 2026-04-11 09:00\n- [ ] Buy milk",
      mtime: 100,
    },
    "Brain/tasks.md": {
      text: "",
      mtime: 200,
    },
  });
  const settingsProvider = () => normalizeBrainSettings({});
  const inboxService = new InboxService(fakeVault, settingsProvider);
  const taskService = new TaskService(fakeVault, settingsProvider);

  // Promote to task
  const content = await fakeVault.readText("Brain/inbox.md");
  const entries = parseInboxEntries(content);
  const entry = entries[0];
  await taskService.appendTask(entry.preview);
  await inboxService.markEntryReviewed(entry, "task");

  const inboxText = await fakeVault.readText("Brain/inbox.md");
  const tasksText = await fakeVault.readText("Brain/tasks.md");

  assert.match(inboxText, /<!-- brain-reviewed: task/);
  assert.match(tasksText, /- \[ \] Buy milk/);
}

async function testScopeAggregation() {
  const fakeVault = new FakeVaultService({
    "notes/alpha.md": { text: "Alpha content", mtime: 100 },
    "notes/beta.md": { text: "Beta content", mtime: 110 },
  });
  const settingsProvider = () => normalizeBrainSettings({ notesFolder: "notes" });
  
  // We simulate ContextService's logic of gathering content from file paths
  const files = ["notes/alpha.md", "notes/beta.md"];
  const contentMap = new Map<string, string>();
  for (const path of files) {
      contentMap.set(path, await fakeVault.readText(path));
  }
  
  assert.equal(contentMap.size, 2);
  assert.equal(contentMap.get("notes/alpha.md"), "Alpha content");
  assert.equal(contentMap.get("notes/beta.md"), "Beta content");
}

async function testReopenEdgeCases() {
  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": {
      text: "## 2026-04-11 09:00\n- Duplicate item\n<!-- brain-reviewed: task 2026-04-11 09:05 -->\n## 2026-04-11 09:00\n- Duplicate item",
      mtime: 100,
    },
  });
  
  const content = await fakeVault.readText("Brain/inbox.md");
  const entries = parseInboxEntries(content);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].reviewed, true);
  assert.equal(entries[1].reviewed, false);
}

class FakeVaultService implements InboxVaultService, TaskVaultService {
  private readonly files = new Map<string, {
    text: string;
    mtime: number;
  }>();

  constructor(seed: Record<string, { text: string; mtime: number }>) {
    for (const [path, payload] of Object.entries(seed)) {
      this.files.set(path, payload);
    }
  }

  async readText(path: string): Promise<string> {
    return this.files.get(path)?.text ?? "";
  }

  async readTextWithMtime(path: string): Promise<{
    text: string;
    mtime: number;
    exists: boolean;
  }> {
    const payload = this.files.get(path);
    if (!payload) {
      return {
        text: "",
        mtime: 0,
        exists: false,
      };
    }
    return {
      text: payload.text,
      mtime: payload.mtime,
      exists: true,
    };
  }

  setFile(path: string, text: string, mtime: number): void {
    this.files.set(path, { text, mtime });
  }

  async appendText(path: string, content: string): Promise<void> {
    const existing = this.files.get(path);
    if (!existing) {
      this.files.set(path, { text: `${content}\n`, mtime: Date.now() });
      return;
    }

    this.files.set(path, {
      text: `${existing.text}${content}\n`,
      mtime: Date.now(),
    });
  }

  async replaceText(path: string, content: string): Promise<void> {
    this.files.set(path, {
      text: content,
      mtime: Date.now(),
    });
  }
}

void run().then(() => {
  console.log("smoke tests passed");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
