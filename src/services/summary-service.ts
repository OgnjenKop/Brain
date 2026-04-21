import { Notice } from "obsidian";
import { BrainAIService } from "./ai-service";
import { BrainPluginSettings } from "../settings/settings";
import { VaultService } from "./vault-service";
import {
  joinRecentFilesForSummary,
} from "../utils/text";
import { formatDateTimeKey, formatSummaryTimestamp, getWindowStart } from "../utils/date";
import { buildFallbackSummary } from "../utils/summary-format";
import { getAIConfigurationStatus } from "../utils/ai-config";

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
    const cutoff = getWindowStart(effectiveLookbackDays).getTime();
    const files = await this.vaultService.collectMarkdownFiles({
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder],
      minMtime: cutoff,
    });
    const content = await joinRecentFilesForSummary(
      this.vaultService,
      files,
      settings.summaryMaxChars,
    );

    let summary = buildFallbackSummary(content);
    let usedAI = false;

    if (settings.enableAISummaries) {
      const aiStatus = await getAIConfigurationStatus(settings);
      if (!aiStatus.configured) {
        new Notice(aiStatus.message);
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
}
