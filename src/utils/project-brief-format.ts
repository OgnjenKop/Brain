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

export function buildFallbackProjectBrief(content: string): string {
  const overview = new Set<string>();
  const goals = new Set<string>();
  const scope = new Set<string>();
  const nextSteps = new Set<string>();

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
        scope.add(headingText);
      }
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        nextSteps.add(taskText);
        goals.add(taskText);
      }
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        scope.add(bulletText);
        if (looksLikeGoal(bulletText)) {
          goals.add(bulletText);
        }
      }
      continue;
    }

    if (looksLikeGoal(line)) {
      goals.add(safeCollapseWhitespace(line));
    } else if (overview.size < 4) {
      overview.add(safeCollapseWhitespace(line));
    }
  }

  return [
    "# Project Brief",
    "",
    "## Overview",
    formatListSection(overview, "No overview found."),
    "",
    "## Goals",
    formatListSection(goals, "No goals found."),
    "",
    "## Scope",
    formatListSection(scope, "No scope found."),
    "",
    "## Next Steps",
    formatListSection(nextSteps, "No next steps found."),
  ].join("\n");
}

function looksLikeGoal(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.startsWith("goal ") ||
    lower.startsWith("goals ") ||
    lower.startsWith("need ") ||
    lower.startsWith("needs ") ||
    lower.startsWith("want ") ||
    lower.startsWith("wants ") ||
    lower.includes("should ") ||
    lower.includes("must ") ||
    lower.includes("objective")
  );
}
