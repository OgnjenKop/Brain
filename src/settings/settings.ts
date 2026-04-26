export interface BrainPluginSettings {
  notesFolder: string;
  instructionsFile: string;
  codexModel: string;
  excludeFolders: string;
}

export const DEFAULT_BRAIN_SETTINGS: BrainPluginSettings = {
  notesFolder: "Notes",
  instructionsFile: "Brain/AGENTS.md",
  codexModel: "",
  excludeFolders: ".obsidian\nnode_modules",
};

export function normalizeBrainSettings(
  input: Partial<BrainPluginSettings> | Record<string, unknown>,
): BrainPluginSettings {
  const merged: BrainPluginSettings = {
    ...DEFAULT_BRAIN_SETTINGS,
    ...input,
  } as BrainPluginSettings;

  return {
    notesFolder: normalizeRelativePath(
      merged.notesFolder,
      DEFAULT_BRAIN_SETTINGS.notesFolder,
    ),
    instructionsFile: normalizeRelativePath(
      merged.instructionsFile,
      DEFAULT_BRAIN_SETTINGS.instructionsFile,
    ),
    codexModel: typeof merged.codexModel === "string" ? merged.codexModel.trim() : "",
    excludeFolders: normalizeExcludeFolders(merged.excludeFolders),
  };
}

function normalizeRelativePath(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || fallback;
}

function normalizeExcludeFolders(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_BRAIN_SETTINGS.excludeFolders;
  }
  return value
    .split("\n")
    .map((line) => line.trim().replace(/^\/+/, "").replace(/\/+$/, ""))
    .filter(Boolean)
    .join("\n");
}

export function parseExcludeFolders(excludeFolders: string): string[] {
  return excludeFolders
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
