import { formatListSection, safeCollapseWhitespace } from "./format-helpers";

function looksLikeOpenQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.endsWith("?") ||
    lower.includes("question") ||
    lower.includes("unclear") ||
    lower.includes("open issue") ||
    lower.includes("unknown")
  );
}

function looksLikeNextStep(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.startsWith("next ") ||
    lower.startsWith("follow up") ||
    lower.startsWith("follow-up") ||
    lower.startsWith("todo ") ||
    lower.startsWith("to-do ") ||
    lower.includes("should ") ||
    lower.includes("need ") ||
    lower.includes("needs ") ||
    lower.includes("must ") ||
    lower.includes("action")
  );
}

function formatSources(
  sourceLabel: string,
  sourcePath: string | null,
  sourcePaths: string[] | undefined,
): string {
  const sources = new Set<string>();

  if (sourcePaths && sourcePaths.length > 0) {
    for (const path of sourcePaths.slice(0, 12)) {
      sources.add(path);
    }

    if (sourcePaths.length > 12) {
      sources.add(`...and ${sourcePaths.length - 12} more`);
    }
  } else if (sourcePath) {
    sources.add(sourcePath);
  } else {
    sources.add(sourceLabel);
  }

  return formatListSection(sources, "No explicit sources found.");
}

export function buildFallbackTopicPage(
  topic: string,
  content: string,
  sourceLabel: string,
  sourcePath: string | null,
  sourcePaths: string[] | undefined,
): string {
  const overview = new Set<string>();
  const evidence = new Set<string>();
  const openQuestions = new Set<string>();
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
        if (looksLikeOpenQuestion(headingText)) {
          openQuestions.add(headingText);
        }
        if (looksLikeNextStep(headingText)) {
          nextSteps.add(headingText);
        }
      }
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        evidence.add(taskText);
        nextSteps.add(taskText);
      }
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        evidence.add(bulletText);
        if (looksLikeOpenQuestion(bulletText)) {
          openQuestions.add(bulletText);
        }
        if (looksLikeNextStep(bulletText)) {
          nextSteps.add(bulletText);
        }
      }
      continue;
    }

    if (looksLikeOpenQuestion(line)) {
      const question = safeCollapseWhitespace(line);
      if (question) {
        openQuestions.add(question);
      }
      continue;
    }

    if (overview.size < 4) {
      overview.add(safeCollapseWhitespace(line));
    } else if (evidence.size < 4) {
      evidence.add(safeCollapseWhitespace(line));
    }
  }

  if (!nextSteps.size) {
    nextSteps.add("Review the source context.");
  }

  return [
    "## Overview",
    `- Topic: ${safeCollapseWhitespace(topic)}`,
    formatListSection(overview, "No overview found."),
    "",
    "## Evidence",
    formatListSection(evidence, "No evidence found."),
    "",
    "## Open Questions",
    formatListSection(openQuestions, "No open questions found."),
    "",
    "## Sources",
    formatSources(sourceLabel, sourcePath, sourcePaths),
    "",
    "## Next Steps",
    formatListSection(nextSteps, "Review the source context."),
  ].join("\n");
}
