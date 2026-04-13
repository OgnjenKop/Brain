import { collapseWhitespace } from "./date";

function formatListSection(items: Set<string>, emptyMessage: string): string {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }

  return Array.from(items)
    .slice(0, 10)
    .map((item) => `- ${item}`)
    .join("\n");
}

function safeCollapseWhitespace(text: string | undefined): string {
  return collapseWhitespace(text ?? "");
}

export function buildFallbackTaskExtraction(content: string): string {
  const tasks = new Set<string>();
  const context = new Set<string>();
  const followUps = new Set<string>();

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        tasks.add(taskText);
        followUps.add(taskText);
      }
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        context.add(bulletText);
      }
      continue;
    }

    if (line.endsWith("?")) {
      const question = safeCollapseWhitespace(line);
      if (question) {
        followUps.add(question);
      }
    }
  }

  return [
    "## Tasks",
    formatListSection(tasks, "No tasks found."),
    "",
    "## Context",
    formatListSection(context, "No supporting context found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified."),
  ].join("\n");
}
