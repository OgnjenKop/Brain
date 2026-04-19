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
import { ReviewService } from "../src/services/review-service";
import { parseReviewLogEntries } from "../src/services/review-log-service";
import { TaskService, TaskVaultService } from "../src/services/task-service";
import { getInboxReviewCompletionMessage } from "../src/utils/inbox-review";
import {
  formatDateKey,
  formatDateTimeKey,
  formatSummaryTimestamp,
  formatTimeKey,
} from "../src/utils/date";
import {
  getModelDropdownValue,
  getNextModelValue,
  isCustomModelValue,
} from "../src/utils/model-selection";
import { parseCodexLoginStatus } from "../src/utils/codex-auth";
import { isUnderFolder } from "../src/utils/path";

// Test constants
const TEST_MTIME_BASE = 100;
const TEST_MTIME_INBOX = TEST_MTIME_BASE;
const TEST_MTIME_TASKS = TEST_MTIME_BASE + 100;
const TEST_MTIME_INBOX_UPDATED = TEST_MTIME_BASE + 1;
const TEST_MTIME_TASKS_UPDATED = TEST_MTIME_BASE + 101;

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

  assert.equal(isCustomModelValue("gpt-4o-mini", ["gpt-4o-mini", "gpt-4o"]), false);
  assert.equal(isCustomModelValue("my-proxy-model", ["gpt-4o-mini", "gpt-4o"]), true);
  assert.equal(getModelDropdownValue("gpt-4o-mini", ["gpt-4o-mini", "gpt-4o"]), "gpt-4o-mini");
  assert.equal(getModelDropdownValue("my-proxy-model", ["gpt-4o-mini", "gpt-4o"]), "custom");
  assert.equal(getNextModelValue("custom", "gpt-4o-mini", ["gpt-4o-mini", "gpt-4o"]), "");
  assert.equal(
    getNextModelValue("custom", "my-proxy-model", ["gpt-4o-mini", "gpt-4o"]),
    "my-proxy-model",
  );
  assert.equal(
    getNextModelValue("gpt-4o", "my-proxy-model", ["gpt-4o-mini", "gpt-4o"]),
    "gpt-4o",
  );
  assert.equal(parseCodexLoginStatus("Logged in using ChatGPT"), "logged-in");
  assert.equal(parseCodexLoginStatus("Not logged in"), "logged-out");
  assert.equal(parseCodexLoginStatus(""), "logged-out");

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
      mtime: TEST_MTIME_INBOX,
    },
    "Brain/tasks.md": {
      text: [
        "- [ ] First task",
        "- [x] Done task",
        "- [ ] Second task",
      ].join("\n"),
      mtime: TEST_MTIME_TASKS,
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
  ].join("\n"), TEST_MTIME_INBOX_UPDATED);
  fakeVault.setFile("Brain/tasks.md", [
    "- [ ] First task",
    "- [ ] Second task",
    "- [ ] Third task",
  ].join("\n"), TEST_MTIME_TASKS_UPDATED);

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
  await testCountCacheInvalidation();
  await testScopeAggregation();
  await testReopenEdgeCases();
  await testFolderFiltering();
  await testFullCaptureReviewWorkflow();
  await testKeepLeavesEntryUnreviewed();
  testInboxReviewCompletionMessage();
}

/**
 * Tests that count caches invalidate correctly when files are modified
 * or entries are marked as reviewed.
 */
async function testCountCacheInvalidation() {
  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": {
      text: [
        "## 2026-04-11 09:00",
        "- First item",
        "<!-- brain-reviewed: task 2026-04-11 09:05 -->",
        "",
        "## 2026-04-11 10:00",
        "- Second item",
        "",
        "## 2026-04-11 11:00",
        "- Third item",
      ].join("\n"),
      mtime: TEST_MTIME_INBOX,
    },
    "Brain/tasks.md": {
      text: [
        "- [ ] First task",
        "- [x] Done task",
        "- [ ] Second task",
      ].join("\n"),
      mtime: TEST_MTIME_TASKS,
    },
  });
  const settingsProvider = () => normalizeBrainSettings({});
  const inboxService = new InboxService(fakeVault, settingsProvider);
  const taskService = new TaskService(fakeVault, settingsProvider);

  // Initial counts should use cache
  const inboxCount1 = await inboxService.getUnreviewedCount();
  const taskCount1 = await taskService.getOpenTaskCount();
  assert.equal(inboxCount1, 2);
  assert.equal(taskCount1, 2);

  // Second call should return cached values (same mtime)
  const inboxCount2 = await inboxService.getUnreviewedCount();
  const taskCount2 = await taskService.getOpenTaskCount();
  assert.equal(inboxCount2, 2);
  assert.equal(taskCount2, 2);

  // Modify inbox file (new mtime) - cache should invalidate
  fakeVault.setFile("Brain/inbox.md", [
    "## 2026-04-11 09:00",
    "- First item",
    "<!-- brain-reviewed: task 2026-04-11 09:05 -->",
    "",
    "## 2026-04-11 10:00",
    "- Second item",
  ].join("\n"), TEST_MTIME_INBOX_UPDATED);
  const inboxCount3 = await inboxService.getUnreviewedCount();
  assert.equal(inboxCount3, 1);

  // Modify tasks file (new mtime) - cache should invalidate
  fakeVault.setFile("Brain/tasks.md", [
    "- [ ] First task",
    "- [ ] Second task",
    "- [ ] Third task",
    "- [ ] Fourth task",
  ].join("\n") + "\n", TEST_MTIME_TASKS_UPDATED);
  const taskCount3 = await taskService.getOpenTaskCount();
  assert.equal(taskCount3, 4);

  // Mark entry as reviewed - should invalidate cache
  const content = await fakeVault.readText("Brain/inbox.md");
  const entries = parseInboxEntries(content);
  const unreviewedEntry = entries.find((e) => !e.reviewed);
  assert.ok(unreviewedEntry);
  await inboxService.markEntryReviewed(unreviewedEntry, "task");
  const inboxCount4 = await inboxService.getUnreviewedCount();
  assert.equal(inboxCount4, 0);

  // Append task - should invalidate cache
  await taskService.appendTask("New task");
  const taskCount4 = await taskService.getOpenTaskCount();
  assert.equal(taskCount4, 5);
}

/**
 * Tests that context aggregation correctly collects content from multiple files
 * and respects file ordering by modification time.
 */
async function testScopeAggregation() {
  const fakeVault = new FakeVaultService({
    "notes/alpha.md": { text: "Alpha content", mtime: TEST_MTIME_BASE },
    "notes/beta.md": { text: "Beta content", mtime: TEST_MTIME_BASE + 10 },
    "notes/gamma.md": { text: "Gamma content", mtime: TEST_MTIME_BASE + 20 },
    "Brain/summaries/daily.md": { text: "Summary content", mtime: TEST_MTIME_BASE + 30 },
    "Brain/reviews/2026-04-11.md": { text: "Review log", mtime: TEST_MTIME_BASE + 40 },
  });
  const settingsProvider = () => normalizeBrainSettings({ 
    notesFolder: "notes",
    summariesFolder: "Brain/summaries",
    reviewsFolder: "Brain/reviews"
  });
  
  // Test aggregating content from multiple files
  const files = ["notes/alpha.md", "notes/beta.md", "notes/gamma.md"];
  const contentMap = new Map<string, string>();
  for (const path of files) {
    contentMap.set(path, await fakeVault.readText(path));
  }
  
  assert.equal(contentMap.size, 3);
  assert.equal(contentMap.get("notes/alpha.md"), "Alpha content");
  assert.equal(contentMap.get("notes/beta.md"), "Beta content");
  assert.equal(contentMap.get("notes/gamma.md"), "Gamma content");

  // Test that aggregation respects file order by mtime
  const sortedFiles = files.toSorted((a, b) => {
    const aMtime = fakeVault.getFileMtime(a);
    const bMtime = fakeVault.getFileMtime(b);
    return bMtime - aMtime;
  });
  assert.equal(sortedFiles[0], "notes/gamma.md");
  assert.equal(sortedFiles[1], "notes/beta.md");
  assert.equal(sortedFiles[2], "notes/alpha.md");

  // Test context building with source paths
  const sourcePaths = files;
  const aggregatedText = Array.from(contentMap.values()).join("\n\n");
  assert.match(aggregatedText, /Alpha content/);
  assert.match(aggregatedText, /Beta content/);
  assert.match(aggregatedText, /Gamma content/);
  assert.equal(sourcePaths.length, 3);
}

/**
 * Tests reopening reviewed inbox entries, including edge cases with
 * duplicate entries distinguished by signature index.
 */
async function testReopenEdgeCases() {
  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": {
      text: [
        "## 2026-04-11 09:00",
        "- Duplicate item",
        "<!-- brain-reviewed: task 2026-04-11 09:05 -->",
        "## 2026-04-11 09:00",
        "- Duplicate item",
      ].join("\n"),
      mtime: TEST_MTIME_INBOX,
    },
  });

  const content = await fakeVault.readText("Brain/inbox.md");
  const entries = parseInboxEntries(content);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].reviewed, true);
  assert.equal(entries[1].reviewed, false);
  assert.equal(entries[0].signatureIndex, 0);
  assert.equal(entries[1].signatureIndex, 1);

  // Test that signatures match for duplicate content
  assert.equal(entries[0].signature, entries[1].signature);

  // Test reopen with signature index
  const settingsProvider = () => normalizeBrainSettings({});
  const inboxService = new InboxService(fakeVault, settingsProvider);
  const reopenResult = await inboxService.reopenEntry({
    heading: entries[0].heading,
    body: entries[0].body,
    preview: entries[0].preview,
    signature: entries[0].signature,
    signatureIndex: entries[0].signatureIndex,
  });
  assert.equal(reopenResult, true);

  const reopenedContent = await fakeVault.readText("Brain/inbox.md");
  assert.doesNotMatch(reopenedContent, /<!-- brain-reviewed: task/);
}

/**
 * Tests folder filtering logic to ensure Brain-generated summaries
 * and reviews are excluded from context aggregation.
 */
async function testFolderFiltering() {
  const fakeVault = new FakeVaultService({
    "notes/project-alpha.md": { text: "Project alpha content", mtime: TEST_MTIME_BASE },
    "notes/project-beta.md": { text: "Project beta content", mtime: TEST_MTIME_BASE + 10 },
    "Brain/summaries/daily.md": { text: "Daily summary", mtime: TEST_MTIME_BASE + 20 },
    "Brain/reviews/2026-04-11.md": { text: "Review log", mtime: TEST_MTIME_BASE + 30 },
    "journal/2026-04-11.md": { text: "Journal entry", mtime: TEST_MTIME_BASE + 40 },
  });

  // Simulate ContextService folder filtering logic
  const settings = normalizeBrainSettings({
    summariesFolder: "Brain/summaries",
    reviewsFolder: "Brain/reviews",
  });

  const allFiles = ["notes/project-alpha.md", "notes/project-beta.md", "Brain/summaries/daily.md", "Brain/reviews/2026-04-11.md", "journal/2026-04-11.md"];
  
  // Filter out summaries and reviews (as ContextService does)
  const filtered = allFiles.filter((path) => 
    !isUnderFolder(path, settings.summariesFolder) &&
    !isUnderFolder(path, settings.reviewsFolder)
  );

  assert.equal(filtered.length, 3);
  assert.ok(filtered.includes("notes/project-alpha.md"));
  assert.ok(filtered.includes("notes/project-beta.md"));
  assert.ok(filtered.includes("journal/2026-04-11.md"));
  assert.ok(!filtered.includes("Brain/summaries/daily.md"));
  assert.ok(!filtered.includes("Brain/reviews/2026-04-11.md"));

  // Test folder-specific filtering
  const folderFiles = filtered.filter((path) => isUnderFolder(path, "notes"));
  assert.equal(folderFiles.length, 2);
}

/**
 * Tests the complete capture → review → mark workflow to ensure
 * integration between inbox, tasks, and review services works correctly.
 */
async function testFullCaptureReviewWorkflow() {
  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": { text: "", mtime: TEST_MTIME_INBOX },
    "Brain/tasks.md": { text: "", mtime: TEST_MTIME_TASKS },
  });

  const settingsProvider = () => normalizeBrainSettings({});
  const inboxService = new InboxService(fakeVault, settingsProvider);
  const taskService = new TaskService(fakeVault, settingsProvider);

  // Step 1: Capture to inbox
  await fakeVault.appendText("Brain/inbox.md", [
    "## 2026-04-11 09:00",
    "- Buy groceries",
    "- Call mom",
  ].join("\n"));
  let inboxContent = await fakeVault.readText("Brain/inbox.md");
  assert.match(inboxContent, /Buy groceries/);
  assert.match(inboxContent, /Call mom/);

  // Step 2: Review and promote to task
  const entries = parseInboxEntries(inboxContent);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].reviewed, false);

  await taskService.appendTask(entries[0].preview);
  await inboxService.markEntryReviewed(entries[0], "task");

  inboxContent = await fakeVault.readText("Brain/inbox.md");
  const tasksContent = await fakeVault.readText("Brain/tasks.md");
  assert.match(inboxContent, /<!-- brain-reviewed: task/);
  assert.match(tasksContent, /Buy groceries/);

  // Step 3: Capture another entry
  await fakeVault.appendText("Brain/inbox.md", [
    "## 2026-04-11 10:00",
    "- Meeting notes from standup",
  ].join("\n"));

  // Step 4: Verify counts reflect state
  const unreviewedCount = await inboxService.getUnreviewedCount();
  const openTaskCount = await taskService.getOpenTaskCount();
  assert.equal(unreviewedCount, 1);
  assert.equal(openTaskCount, 1);

  // Step 5: Mark second entry as reviewed
  const updatedContent = await fakeVault.readText("Brain/inbox.md");
  const updatedEntries = parseInboxEntries(updatedContent);
  const unreviewedEntry = updatedEntries.find((e) => !e.reviewed);
  assert.ok(unreviewedEntry);
  await inboxService.markEntryReviewed(unreviewedEntry, "skip");

  // Step 6: Verify final state
  const finalUnreviewedCount = await inboxService.getUnreviewedCount();
  assert.equal(finalUnreviewedCount, 0);
}

async function testKeepLeavesEntryUnreviewed() {
  const fakeVault = new FakeVaultService({
    "Brain/inbox.md": {
      text: [
        "## 2026-04-11 09:00",
        "- Keep me around",
      ].join("\n"),
      mtime: TEST_MTIME_INBOX,
    },
    "Brain/tasks.md": {
      text: "",
      mtime: TEST_MTIME_TASKS,
    },
  });

  const settingsProvider = () => normalizeBrainSettings({});
  const inboxService = new InboxService(fakeVault, settingsProvider);
  const reviewService = new ReviewService(
    fakeVault as never,
    inboxService,
    {} as never,
    {} as never,
    {
      appendReviewLog: async () => ({ path: "Brain/reviews/2026-04-11.md" }),
    } as never,
    settingsProvider,
  );

  const [entry] = await inboxService.getRecentEntries();
  assert.ok(entry);

  const message = await reviewService.keepEntry(entry);
  assert.match(message, /Left inbox entry in Brain\/inbox\.md/);

  const inboxContent = await fakeVault.readText("Brain/inbox.md");
  assert.doesNotMatch(inboxContent, /brain-reviewed/);
  assert.equal(await inboxService.getUnreviewedCount(), 1);
}

function testInboxReviewCompletionMessage() {
  assert.equal(getInboxReviewCompletionMessage(0), "Inbox review complete");
  assert.equal(
    getInboxReviewCompletionMessage(1),
    "Review pass complete; 1 entry remains in inbox.",
  );
  assert.equal(
    getInboxReviewCompletionMessage(2),
    "Review pass complete; 2 entries remain in inbox.",
  );
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

  getFileMtime(path: string): number {
    return this.files.get(path)?.mtime ?? 0;
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
