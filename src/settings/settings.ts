export interface BrainPluginSettings {
  notesFolder: string;
  instructionsFile: string;
  codexModel: string;
}

export const DEFAULT_BRAIN_SETTINGS: BrainPluginSettings = {
  notesFolder: "Notes",
  instructionsFile: "Brain/AGENTS.md",
  codexModel: "",
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
  };
}

function normalizeRelativePath(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || fallback;
}
