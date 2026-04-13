export function normalizeTopicPageOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Overview",
      "No topic page content returned.",
      "",
      "## Evidence",
      "No topic page content returned.",
      "",
      "## Open Questions",
      "No topic page content returned.",
      "",
      "## Sources",
      "No topic page content returned.",
      "",
      "## Next Steps",
      "No topic page content returned.",
    ].join("\n");
  }

  const parsed = parseTopicPageSections(trimmed);
  if (parsed) {
    return [
      "## Overview",
      parsed.overview || "No overview extracted.",
      "",
      "## Evidence",
      parsed.evidence || "No evidence extracted.",
      "",
      "## Open Questions",
      parsed.openQuestions || "No open questions extracted.",
      "",
      "## Sources",
      parsed.sources || "No sources extracted.",
      "",
      "## Next Steps",
      parsed.nextSteps || "Review the source context.",
    ].join("\n");
  }

  return [
    "## Overview",
    trimmed,
    "",
    "## Evidence",
    "No evidence extracted.",
    "",
    "## Open Questions",
    "No open questions extracted.",
    "",
    "## Sources",
    "No sources extracted.",
    "",
    "## Next Steps",
    "Review the source context.",
  ].join("\n");
}

function parseTopicPageSections(content: string): {
  overview: string;
  evidence: string;
  openQuestions: string;
  sources: string;
  nextSteps: string;
} | null {
  const sectionLines: Record<
    "Overview" | "Evidence" | "Open Questions" | "Sources" | "Next Steps",
    string[]
  > = {
    Overview: [],
    Evidence: [],
    "Open Questions": [],
    Sources: [],
    "Next Steps": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(
      /^##\s+(Overview|Evidence|Open Questions|Sources|Next Steps)\s*$/i,
    );
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
    evidence: trimSection(sectionLines.Evidence),
    openQuestions: trimSection(sectionLines["Open Questions"]),
    sources: trimSection(sectionLines.Sources),
    nextSteps: trimSection(sectionLines["Next Steps"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Overview: string[];
  Evidence: string[];
  "Open Questions": string[];
  Sources: string[];
  "Next Steps": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "evidence") {
    return "Evidence";
  }
  if (normalized === "open questions") {
    return "Open Questions";
  }
  if (normalized === "sources") {
    return "Sources";
  }
  if (normalized === "next steps") {
    return "Next Steps";
  }
  return "Overview";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
