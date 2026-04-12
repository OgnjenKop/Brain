export function normalizeSummary(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Highlights",
      "No summary content returned.",
      "",
      "## Tasks",
      "No summary content returned.",
      "",
      "## Follow-ups",
      "No summary content returned.",
    ].join("\n");
  }

  const parsed = parseSummarySections(trimmed);
  if (parsed) {
    return [
      "## Highlights",
      parsed.highlights || "No summary content returned.",
      "",
      "## Tasks",
      parsed.tasks || "No tasks extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review recent notes.",
    ].join("\n");
  }

  return [
    "## Highlights",
    trimmed,
    "",
    "## Tasks",
    "No tasks extracted.",
    "",
    "## Follow-ups",
    "Review recent notes.",
  ].join("\n");
}

function parseSummarySections(content: string): {
  highlights: string;
  tasks: string;
  followUps: string;
} | null {
  const sectionLines: Record<"Highlights" | "Tasks" | "Follow-ups", string[]> = {
    Highlights: [],
    Tasks: [],
    "Follow-ups": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Highlights|Tasks|Follow-ups)\s*$/i);
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
    highlights: trimSection([...preambleLines, ...sectionLines.Highlights]),
    tasks: trimSection(sectionLines.Tasks),
    followUps: trimSection(sectionLines["Follow-ups"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Highlights: string[];
  Tasks: string[];
  "Follow-ups": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "tasks") {
    return "Tasks";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Highlights";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
