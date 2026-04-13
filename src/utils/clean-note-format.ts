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

function safeCollapseWhitespace(text: string | undefined): string {
  return collapseWhitespace(text ?? "");
}

export function buildFallbackCleanNote(content: string): string {
  const overview = new Set<string>();
  const keyPoints = new Set<string>();
  const questions = new Set<string>();

  for (const rawLine of content.split("\n")) {
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
      if (headingText) {
        overview.add(headingText);
      }
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        keyPoints.add(bulletText);
      }
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        keyPoints.add(taskText);
      }
      continue;
    }

    if (line.endsWith("?")) {
      const question = safeCollapseWhitespace(line);
      if (question) {
        questions.add(question);
      }
      continue;
    }

    if (overview.size < 4) {
      overview.add(safeCollapseWhitespace(line));
    }
  }

  return [
    "# Clean Note",
    "",
    "## Overview",
    formatListSection(overview, "No overview found."),
    "",
    "## Key Points",
    formatListSection(keyPoints, "No key points found."),
    "",
    "## Open Questions",
    formatListSection(questions, "No open questions found."),
  ].join("\n");
}
