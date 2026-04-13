export function normalizeSynthesisOutput(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Summary",
      "No synthesis content returned.",
      "",
      "## Key Themes",
      "No synthesis content returned.",
      "",
      "## Follow-ups",
      "No synthesis content returned.",
    ].join("\n");
  }

  const parsed = parseSynthesisSections(trimmed);
  if (parsed) {
    return [
      "## Summary",
      parsed.summary || "No synthesis content returned.",
      "",
      "## Key Themes",
      parsed.keyThemes || "No key themes extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context.",
    ].join("\n");
  }

  return [
    "## Summary",
    trimmed,
    "",
    "## Key Themes",
    "No key themes extracted.",
    "",
    "## Follow-ups",
    "Review the source context.",
  ].join("\n");
}

function parseSynthesisSections(content: string): {
  summary: string;
  keyThemes: string;
  followUps: string;
} | null {
  const sectionLines: Record<"Summary" | "Key Themes" | "Follow-ups", string[]> = {
    Summary: [],
    "Key Themes": [],
    "Follow-ups": [],
  };
  const preambleLines: string[] = [];

  let currentSection: keyof typeof sectionLines | null = null;
  let sawHeading = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Summary|Key Themes|Follow-ups)\s*$/i);
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
    summary: trimSection([...preambleLines, ...sectionLines.Summary]),
    keyThemes: trimSection(sectionLines["Key Themes"]),
    followUps: trimSection(sectionLines["Follow-ups"]),
  };
}

function canonicalSectionName(section: string): keyof {
  Summary: string[];
  "Key Themes": string[];
  "Follow-ups": string[];
} {
  const normalized = section.toLowerCase();
  if (normalized === "key themes") {
    return "Key Themes";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Summary";
}

function trimSection(lines: string[]): string {
  return lines.join("\n").trim();
}
