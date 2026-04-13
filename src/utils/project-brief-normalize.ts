export function normalizeProjectBriefOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "# Project Brief",
      "",
      "## Overview",
      "No synthesis content returned.",
      "",
      "## Goals",
      "No synthesis content returned.",
      "",
      "## Scope",
      "No synthesis content returned.",
      "",
      "## Next Steps",
      "No synthesis content returned.",
    ].join("\n");
  }

  const parsed = parseProjectBriefSections(trimmed);
  if (parsed) {
    return [
      "# Project Brief",
      "",
      "## Overview",
      parsed.overview || "No overview extracted.",
      "",
      "## Goals",
      parsed.goals || "No goals extracted.",
      "",
      "## Scope",
      parsed.scope || "No scope extracted.",
      "",
      "## Next Steps",
      parsed.nextSteps || "No next steps extracted.",
    ].join("\n");
  }

  return [
    "# Project Brief",
    "",
    "## Overview",
    trimmed,
    "",
    "## Goals",
    "No goals extracted.",
    "",
    "## Scope",
    "No scope extracted.",
    "",
    "## Next Steps",
    "No next steps extracted.",
  ].join("\n");
}

function parseProjectBriefSections(content: string): {
  overview: string;
  goals: string;
  scope: string;
  nextSteps: string;
} | null {
  const sectionLines: Record<"Overview" | "Goals" | "Scope" | "Next Steps", string[]> = {
    Overview: [],
    Goals: [],
    Scope: [],
    "Next Steps": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Overview|Goals|Scope|Next Steps)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName(heading[1]);
      sawHeading = true;
      continue;
    }

    if (!sawHeading) {
      if (line.match(/^#\s+/)) {
        continue;
      }
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
    overview: trimSection([...preambleLines, ...sectionLines.Overview]),
    goals: trimSection(sectionLines.Goals),
    scope: trimSection(sectionLines.Scope),
    nextSteps: trimSection(sectionLines["Next Steps"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Overview: string[];
  Goals: string[];
  Scope: string[];
  "Next Steps": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "goals") {
    return "Goals";
  }
  if (normalized === "scope") {
    return "Scope";
  }
  if (normalized === "next steps") {
    return "Next Steps";
  }
  return "Overview";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
