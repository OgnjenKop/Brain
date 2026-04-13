export function normalizeCleanNoteOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "# Clean Note",
      "",
      "## Overview",
      "No synthesis content returned.",
      "",
      "## Key Points",
      "No synthesis content returned.",
      "",
      "## Open Questions",
      "No synthesis content returned.",
    ].join("\n");
  }

  const parsed = parseCleanNoteSections(trimmed);
  if (parsed) {
    return [
      "# Clean Note",
      "",
      "## Overview",
      parsed.overview || "No overview extracted.",
      "",
      "## Key Points",
      parsed.keyPoints || "No key points extracted.",
      "",
      "## Open Questions",
      parsed.questions || "No open questions extracted.",
    ].join("\n");
  }

  return [
    "# Clean Note",
    "",
    "## Overview",
    trimmed,
    "",
    "## Key Points",
    "No key points extracted.",
    "",
    "## Open Questions",
    "No open questions extracted.",
  ].join("\n");
}

function parseCleanNoteSections(content: string): {
  overview: string;
  keyPoints: string;
  questions: string;
} | null {
  const sectionLines: Record<"Overview" | "Key Points" | "Open Questions", string[]> = {
    Overview: [],
    "Key Points": [],
    "Open Questions": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Overview|Key Points|Open Questions)\s*$/i);
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
    keyPoints: trimSection(sectionLines["Key Points"]),
    questions: trimSection(sectionLines["Open Questions"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Overview: string[];
  "Key Points": string[];
  "Open Questions": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "key points") {
    return "Key Points";
  }
  if (normalized === "open questions") {
    return "Open Questions";
  }
  return "Overview";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
