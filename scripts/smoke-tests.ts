import assert from "node:assert/strict";
import { buildFallbackSummary } from "../src/utils/summary-format";
import { normalizeSummary } from "../src/utils/summary-normalize";
import {
  DEFAULT_BRAIN_SETTINGS,
  normalizeBrainSettings,
} from "../src/settings/settings";
import { parseInboxEntries } from "../src/services/inbox-service";
import { parseReviewLogEntries } from "../src/services/review-log-service";
import {
  formatDateKey,
  formatDateTimeKey,
  formatSummaryTimestamp,
  formatTimeKey,
} from "../src/utils/date";

function run(): void {
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
}

run();
console.log("smoke tests passed");
