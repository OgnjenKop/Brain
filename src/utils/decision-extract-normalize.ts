export function normalizeDecisionExtractionOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Decisions",
      "No decision content returned.",
      "",
      "## Rationale",
      "No decision content returned.",
      "",
      "## Open Questions",
      "No decision content returned.",
    ].join("\n");
  }

  const parsed = parseDecisionSections(trimmed);
  if (parsed) {
    return [
      "## Decisions",
      parsed.decisions || "No clear decisions extracted.",
      "",
      "## Rationale",
      parsed.rationale || "No rationale extracted.",
      "",
      "## Open Questions",
      parsed.openQuestions || "Review the source context.",
    ].join("\n");
  }

  return [
    "## Decisions",
    trimmed,
    "",
    "## Rationale",
    "No rationale extracted.",
    "",
    "## Open Questions",
    "Review the source context.",
  ].join("\n");
}

function parseDecisionSections(content: string): {
  decisions: string;
  rationale: string;
  openQuestions: string;
} | null {
  const sectionLines: Record<"Decisions" | "Rationale" | "Open Questions", string[]> = {
    Decisions: [],
    Rationale: [],
    "Open Questions": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Decisions|Rationale|Open Questions)\s*$/i);
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
    decisions: trimSection([...preambleLines, ...sectionLines.Decisions]),
    rationale: trimSection(sectionLines.Rationale),
    openQuestions: trimSection(sectionLines["Open Questions"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Decisions: string[];
  Rationale: string[];
  "Open Questions": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "rationale") {
    return "Rationale";
  }
  if (normalized === "open questions") {
    return "Open Questions";
  }
  return "Decisions";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
