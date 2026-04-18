import { formatListSection } from "./format-helpers";

function cleanSummaryLine(text: string | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function formatTaskSection(items: Set<string>): string {
  if (!items.size) {
    return "- No recent tasks found.";
  }
  return Array.from(items)
    .slice(0, 8)
    .map((item) => `- [ ] ${item}`)
    .join("\n");
}

export function buildFallbackSummary(content: string): string {
  const highlights = new Set<string>();
  const tasks = new Set<string>();
  const followUps = new Set<string>();

  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("--- ")) {
      continue;
    }

    if (/^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      highlights.add(cleanSummaryLine(heading[1]));
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const text = cleanSummaryLine(task[2]);
      tasks.add(text);
      followUps.add(text);
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = cleanSummaryLine(bullet[2]);
      if (text) {
        highlights.add(text);
      }
      continue;
    }

    if (highlights.size < 5 && line.length <= 140) {
      highlights.add(cleanSummaryLine(line));
    }
  }

  return [
    "## Highlights",
    formatListSection(highlights, "No recent notes found."),
    "",
    "## Tasks",
    formatTaskSection(tasks),
    "",
    "## Follow-ups",
    formatListSection(followUps, "Nothing pending from recent notes."),
  ].join("\n");
}
