export function normalizeOpenQuestionsOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Open Questions",
      "No open-question content returned.",
      "",
      "## Context",
      "No open-question content returned.",
      "",
      "## Follow-ups",
      "No open-question content returned.",
    ].join("\n");
  }

  const parsed = parseOpenQuestionSections(trimmed);
  if (parsed) {
    return [
      "## Open Questions",
      parsed.openQuestions || "No open questions extracted.",
      "",
      "## Context",
      parsed.context || "No supporting context extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context.",
    ].join("\n");
  }

  return [
    "## Open Questions",
    trimmed,
    "",
    "## Context",
    "No supporting context extracted.",
    "",
    "## Follow-ups",
    "Review the source context.",
  ].join("\n");
}

function parseOpenQuestionSections(content: string): {
  openQuestions: string;
  context: string;
  followUps: string;
} | null {
  const sectionLines: Record<"Open Questions" | "Context" | "Follow-ups", string[]> = {
    "Open Questions": [],
    Context: [],
    "Follow-ups": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Open Questions|Context|Follow-ups)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName(heading[1]);
      sawHeading = true;
      continue;
    }

    if (!sawHeading) {
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }

    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }

  if (!sawHeading) {
    return null;
  }

  return {
    openQuestions: trimSection([...preambleLines, ...sectionLines["Open Questions"]]),
    context: trimSection(sectionLines.Context),
    followUps: trimSection(sectionLines["Follow-ups"]),
  };
}

function canonicalSectionName(section: string): keyof {
  "Open Questions": string[];
  Context: string[];
  "Follow-ups": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "context") {
    return "Context";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Open Questions";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
