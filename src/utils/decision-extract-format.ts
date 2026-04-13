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

function looksLikeRationale(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("because") ||
    lower.includes("so that") ||
    lower.includes("due to") ||
    lower.includes("reason") ||
    lower.includes("tradeoff") ||
    lower.includes("constraint")
  );
}

function looksLikeDecision(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("decide") ||
    lower.includes("decision") ||
    lower.includes("choose") ||
    lower.includes("ship") ||
    lower.includes("adopt") ||
    lower.includes("drop") ||
    lower.includes("switch")
  );
}

export function buildFallbackDecisionExtraction(content: string): string {
  const decisions = new Set<string>();
  const rationale = new Set<string>();
  const openQuestions = new Set<string>();

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const text = safeCollapseWhitespace(heading[1]);
      if (text.endsWith("?")) {
        openQuestions.add(text);
      } else if (looksLikeDecision(text)) {
        decisions.add(text);
      } else if (looksLikeRationale(text)) {
        rationale.add(text);
      }
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const text = safeCollapseWhitespace(task[2]);
      decisions.add(text);
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = safeCollapseWhitespace(bullet[2]);
      if (!text) {
        continue;
      }
      if (text.endsWith("?")) {
        openQuestions.add(text);
      } else if (looksLikeDecision(text)) {
        decisions.add(text);
      } else if (looksLikeRationale(text)) {
        rationale.add(text);
      } else if (decisions.size < 3) {
        decisions.add(text);
      } else {
        rationale.add(text);
      }
      continue;
    }

    if (line.endsWith("?")) {
      openQuestions.add(safeCollapseWhitespace(line));
      continue;
    }

    if (looksLikeDecision(line)) {
      decisions.add(safeCollapseWhitespace(line));
    } else if (looksLikeRationale(line)) {
      rationale.add(safeCollapseWhitespace(line));
    }
  }

  return [
    "## Decisions",
    formatListSection(decisions, "No clear decisions found."),
    "",
    "## Rationale",
    formatListSection(rationale, "No explicit rationale found."),
    "",
    "## Open Questions",
    formatListSection(openQuestions, "No open questions identified."),
  ].join("\n");
}
