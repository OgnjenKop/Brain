import { Notice, TFile } from "obsidian";
import { BrainAIService } from "./ai-service";
import { BrainPluginSettings } from "../settings/settings";
import { VaultService } from "./vault-service";
import {
  joinRecentFilesForSummary,
} from "../utils/text";
import { formatDateTimeKey, formatSummaryTimestamp } from "../utils/date";
import { buildFallbackSummary } from "../utils/summary-format";
import { isUnderFolder } from "../utils/path";

export interface SummaryResult {
  content: string;
  persistedPath?: string;
  usedAI: boolean;
  title: string;
}

export class SummaryService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly aiService: BrainAIService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async generateSummary(lookbackDays?: number, label?: string): Promise<SummaryResult> {
    const settings = this.settingsProvider();
    const effectiveLookbackDays = lookbackDays ?? settings.summaryLookbackDays;
    const files = await this.collectRecentFiles(settings, effectiveLookbackDays);
    const content = await joinRecentFilesForSummary(
      this.vaultService,
      files,
      settings.summaryMaxChars,
    );

    let summary = buildFallbackSummary(content);
    let usedAI = false;

    if (settings.enableAISummaries) {
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new Notice("AI summaries are enabled but OpenAI is not configured");
      } else {
        try {
          summary = await this.aiService.summarize(content || summary, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new Notice("Brain fell back to local summary");
        }
      }
    }

    let persistedPath: string | undefined;
    const title = label ? `${label} Summary` : "Summary";
    if (settings.persistSummaries) {
      const timestamp = formatSummaryTimestamp(new Date());
      const fileLabel = label ? `${label.toLowerCase()}-${timestamp}` : timestamp;
      const requestedPath = `${settings.summariesFolder}/${fileLabel}.md`;
      const path = await this.vaultService.ensureUniqueFilePath(requestedPath);
      const displayTimestamp = formatDateTimeKey(new Date());
      const body = [
        `# ${title} ${displayTimestamp}`,
        "",
        `## Window`,
        effectiveLookbackDays === 1 ? "Today" : `Last ${effectiveLookbackDays} days`,
        "",
        summary.trim(),
      ].join("\n");
      await this.vaultService.appendText(path, body);
      persistedPath = path;
    }

    return {
      content: summary,
      persistedPath,
      usedAI,
      title,
    };
  }

  private async collectRecentFiles(
    settings: BrainPluginSettings,
    lookbackDays: number,
  ): Promise<TFile[]> {
    const cutoff = getWindowStart(lookbackDays).getTime();
    const files = await this.vaultService.listMarkdownFiles();
    return files
      .filter((file) => !isUnderFolder(file.path, settings.summariesFolder))
      .filter((file) => !isUnderFolder(file.path, settings.reviewsFolder))
      .filter((file) => file.stat.mtime >= cutoff)
      .sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
}

function getWindowStart(lookbackDays: number): Date {
  const safeDays = Math.max(1, lookbackDays);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));
  return start;
}
