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

function looksLikeQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.endsWith("?") ||
    lower.includes("question") ||
    lower.includes("unclear") ||
    lower.includes("unknown") ||
    lower.includes("not sure")
  );
}

function looksLikeFollowUp(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("follow up") ||
    lower.includes("next step") ||
    lower.includes("investigate") ||
    lower.includes("confirm") ||
    lower.includes("validate")
  );
}

export function buildFallbackOpenQuestions(content: string): string {
  const openQuestions = new Set<string>();
  const context = new Set<string>();
  const followUps = new Set<string>();

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const text = safeCollapseWhitespace(heading[1]);
      if (!text) {
        continue;
      }
      if (looksLikeQuestion(text)) {
        openQuestions.add(text);
      } else {
        context.add(text);
      }
      if (looksLikeFollowUp(text)) {
        followUps.add(text);
      }
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const text = safeCollapseWhitespace(task[2]);
      if (text) {
        followUps.add(text);
      }
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = safeCollapseWhitespace(bullet[2]);
      if (!text) {
        continue;
      }
      if (looksLikeQuestion(text)) {
        openQuestions.add(text);
      } else if (context.size < 6) {
        context.add(text);
      }
      if (looksLikeFollowUp(text)) {
        followUps.add(text);
      }
      continue;
    }

    if (looksLikeQuestion(line)) {
      openQuestions.add(safeCollapseWhitespace(line));
      continue;
    }

    if (context.size < 4) {
      context.add(safeCollapseWhitespace(line));
    }
  }

  return [
    "## Open Questions",
    formatListSection(openQuestions, "No open questions found."),
    "",
    "## Context",
    formatListSection(context, "No supporting context found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified."),
  ].join("\n");
}
