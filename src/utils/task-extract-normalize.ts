export function normalizeTaskExtractionOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Tasks",
      "No task content returned.",
      "",
      "## Context",
      "No task content returned.",
      "",
      "## Follow-ups",
      "No task content returned.",
    ].join("\n");
  }

  const parsed = parseTaskExtractionSections(trimmed);
  if (parsed) {
    return [
      "## Tasks",
      parsed.tasks || "No tasks extracted.",
      "",
      "## Context",
      parsed.context || "No supporting context extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context.",
    ].join("\n");
  }

  return [
    "## Tasks",
    trimmed,
    "",
    "## Context",
    "No supporting context extracted.",
    "",
    "## Follow-ups",
    "Review the source context.",
  ].join("\n");
}

function parseTaskExtractionSections(content: string): {
  tasks: string;
  context: string;
  followUps: string;
} | null {
  const sectionLines: Record<"Tasks" | "Context" | "Follow-ups", string[]> = {
    Tasks: [],
    Context: [],
    "Follow-ups": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Tasks|Context|Follow-ups)\s*$/i);
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
    tasks: trimSection(sectionLines.Tasks),
    context: trimSection([...preambleLines, ...sectionLines.Context]),
    followUps: trimSection(sectionLines["Follow-ups"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Tasks: string[];
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
  return "Tasks";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
