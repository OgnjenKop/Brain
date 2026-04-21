import { collapseWhitespace, formatDateTimeKey } from "./date";
import { formatListSection, safeCollapseWhitespace } from "./format-helpers";
import type { SynthesisResult } from "../services/synthesis-service";
import type { SynthesisContext } from "../services/context-service";
import { formatContextSourceLines } from "./context-format";
import { stripLeadingTitle } from "./text";

function addSummaryLine(
  summary: Set<string>,
  text: string,
  maxItems = 4,
): void {
  if (summary.size >= maxItems) {
    return;
  }

  const cleaned = collapseWhitespace(text);
  if (!cleaned) {
    return;
  }

  summary.add(cleaned);
}

export function buildFallbackSynthesis(content: string): string {
  const summary = new Set<string>();
  const themes = new Set<string>();
  const followUps = new Set<string>();

  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      themes.add(headingText);
      addSummaryLine(summary, headingText);
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      followUps.add(taskText);
      themes.add(taskText);
      addSummaryLine(summary, taskText);
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      themes.add(bulletText);
      addSummaryLine(summary, bulletText);
      continue;
    }

    if (line.endsWith("?")) {
      followUps.add(safeCollapseWhitespace(line));
    }

    addSummaryLine(summary, line);
  }

  return [
    "## Summary",
    formatListSection(summary, "No source context found."),
    "",
    "## Key Themes",
    formatListSection(themes, "No key themes found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified."),
  ].join("\n");
}

export function buildSynthesisNoteContent(
  result: SynthesisResult,
  context: SynthesisContext,
): string {
  return [
    `Action: ${result.action}`,
    `Generated: ${formatDateTimeKey(new Date())}`,
    `Context length: ${context.originalLength} characters.`,
    "",
    stripLeadingTitle(result.content),
    "",
  ].join("\n");
}

export function buildInsertedSynthesisContent(
  result: SynthesisResult,
  context: SynthesisContext,
): string {
  return [
    `## Brain ${result.title}`,
    ...formatContextSourceLines(context).map((line) => `- ${line}`),
    `- Generated: ${formatDateTimeKey(new Date())}`,
    "",
    stripLeadingTitle(result.content),
  ].join("\n");
}
