import { collapseWhitespace } from "./date";

function formatListSection(items: Set<string>, emptyMessage: string): string {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }

  return Array.from(items)
    .slice(0, 8)
    .map((item) => `- ${item}`)
    .join("\n");
}

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

function safeCollapseWhitespace(text: string | undefined): string {
  return collapseWhitespace(text ?? "");
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
