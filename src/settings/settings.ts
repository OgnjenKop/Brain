export interface BrainPluginSettings {
  inboxFile: string;
  tasksFile: string;
  journalFolder: string;
  notesFolder: string;
  summariesFolder: string;
  reviewsFolder: string;

  enableAISummaries: boolean;
  enableAIRouting: boolean;

  openAIApiKey: string;
  openAIModel: string;
  openAIBaseUrl: string;

  aiProvider: "openai" | "gemini";
  geminiApiKey: string;
  geminiModel: string;

  summaryLookbackDays: number;
  summaryMaxChars: number;

  persistSummaries: boolean;

  collapsedSidebarSections: string[];
}

export const DEFAULT_BRAIN_SETTINGS: BrainPluginSettings = {
  inboxFile: "Brain/inbox.md",
  tasksFile: "Brain/tasks.md",
  journalFolder: "Brain/journal",
  notesFolder: "Brain/notes",
  summariesFolder: "Brain/summaries",
  reviewsFolder: "Brain/reviews",
  enableAISummaries: false,
  enableAIRouting: false,
  openAIApiKey: "",
  openAIModel: "gpt-4o-mini",
  openAIBaseUrl: "https://api.openai.com/v1/chat/completions",
  aiProvider: "openai",
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
  summaryLookbackDays: 7,
  summaryMaxChars: 12000,
  persistSummaries: true,
  collapsedSidebarSections: [],
};

export function normalizeBrainSettings(
  input: Partial<BrainPluginSettings> | Record<string, unknown>,
): BrainPluginSettings {
  const merged: BrainPluginSettings = {
    ...DEFAULT_BRAIN_SETTINGS,
    ...input,
  } as BrainPluginSettings;

  return {
    inboxFile: normalizeRelativePath(merged.inboxFile, DEFAULT_BRAIN_SETTINGS.inboxFile),
    tasksFile: normalizeRelativePath(merged.tasksFile, DEFAULT_BRAIN_SETTINGS.tasksFile),
    journalFolder: normalizeRelativePath(
      merged.journalFolder,
      DEFAULT_BRAIN_SETTINGS.journalFolder,
    ),
    notesFolder: normalizeRelativePath(
      merged.notesFolder,
      DEFAULT_BRAIN_SETTINGS.notesFolder,
    ),
    summariesFolder: normalizeRelativePath(
      merged.summariesFolder,
      DEFAULT_BRAIN_SETTINGS.summariesFolder,
    ),
    reviewsFolder: normalizeRelativePath(
      merged.reviewsFolder,
      DEFAULT_BRAIN_SETTINGS.reviewsFolder,
    ),
    enableAISummaries: Boolean(merged.enableAISummaries),
    enableAIRouting: Boolean(merged.enableAIRouting),
    openAIApiKey: typeof merged.openAIApiKey === "string" ? merged.openAIApiKey.trim() : "",
    openAIModel:
      typeof merged.openAIModel === "string" && merged.openAIModel.trim()
        ? merged.openAIModel.trim()
        : DEFAULT_BRAIN_SETTINGS.openAIModel,
    openAIBaseUrl:
      typeof merged.openAIBaseUrl === "string" && merged.openAIBaseUrl.trim()
        ? merged.openAIBaseUrl.trim()
        : DEFAULT_BRAIN_SETTINGS.openAIBaseUrl,
    aiProvider: (merged.aiProvider === "gemini" ? "gemini" : "openai") as "openai" | "gemini",
    geminiApiKey: typeof merged.geminiApiKey === "string" ? merged.geminiApiKey.trim() : "",
    geminiModel:
      typeof merged.geminiModel === "string" && merged.geminiModel.trim()
        ? merged.geminiModel.trim()
        : DEFAULT_BRAIN_SETTINGS.geminiModel,
    summaryLookbackDays: clampInteger(merged.summaryLookbackDays, 1, 365, DEFAULT_BRAIN_SETTINGS.summaryLookbackDays),
    summaryMaxChars: clampInteger(merged.summaryMaxChars, 1000, 100000, DEFAULT_BRAIN_SETTINGS.summaryMaxChars),
    persistSummaries: Boolean(merged.persistSummaries),
    collapsedSidebarSections: Array.isArray(merged.collapsedSidebarSections)
      ? (merged.collapsedSidebarSections as string[]).filter((s) => typeof s === "string")
      : DEFAULT_BRAIN_SETTINGS.collapsedSidebarSections,
  };
}

function normalizeRelativePath(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || fallback;
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return Math.min(max, Math.max(min, value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.min(max, Math.max(min, parsed));
    }
  }

  return fallback;
}
