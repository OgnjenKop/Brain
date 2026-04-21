import { Notice } from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { SynthesisContext } from "./context-service";
import { BrainAIService } from "./ai-service";
import { buildFallbackTopicPage } from "../utils/topic-page-format";
import { normalizeTopicPageOutput } from "../utils/topic-page-normalize";
import { collapseWhitespace, formatDateTimeKey } from "../utils/date";
import { SynthesisResult } from "./synthesis-service";
import { getAIConfigurationStatus } from "../utils/ai-config";

export class TopicPageService {
  constructor(
    private readonly aiService: BrainAIService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async createTopicPage(topic: string, context: SynthesisContext): Promise<SynthesisResult> {
    const settings = this.settingsProvider();
    const cleanedTopic = collapseWhitespace(topic);
    if (!cleanedTopic) {
      throw new Error("Topic cannot be empty");
    }

    const fallback = buildFallbackTopicPage(
      cleanedTopic,
      context.text,
      context.sourceLabel,
      context.sourcePath,
      context.sourcePaths,
    );
    let content = fallback;
    let usedAI = false;

    if (settings.enableAISummaries) {
      const aiStatus = await getAIConfigurationStatus(settings);
      if (!aiStatus.configured) {
        new Notice(aiStatus.message);
      } else {
        try {
          content = await this.aiService.createTopicPage(cleanedTopic, context, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new Notice("Brain fell back to local topic page generation");
          content = fallback;
        }
      }
    }

    const normalizedContent = ensureTopicBullet(
      normalizeTopicPageOutput(content),
      cleanedTopic,
    );

    return {
      action: "Topic Page",
      title: "Topic Page",
      noteTitle: shortenTopic(cleanedTopic),
      content: normalizedContent,
      usedAI,
      promptText: cleanedTopic,
    };
  }
}

function ensureTopicBullet(content: string, topic: string): string {
  const normalizedTopic = collapseWhitespace(topic);
  const lines = content.split("\n");
  const overviewIndex = lines.findIndex((line) => /^##\s+Overview\s*$/i.test(line));
  if (overviewIndex === -1) {
    return content;
  }

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > overviewIndex && /^##\s+/.test(line),
  );
  const topicLine = `- Topic: ${normalizedTopic}`;
  const overviewSlice = lines.slice(
    overviewIndex + 1,
    nextHeadingIndex === -1 ? lines.length : nextHeadingIndex,
  );
  if (overviewSlice.some((line) => line.trim().toLowerCase().startsWith("- topic:"))) {
    return content;
  }

  const insertionIndex = overviewIndex + 1;
  const updated = [...lines];
  updated.splice(insertionIndex, 0, topicLine);
  return updated.join("\n");
}

function shortenTopic(topic: string): string {
  const cleaned = topic.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) {
    return cleaned || `Topic ${formatDateTimeKey(new Date())}`;
  }

  return `${cleaned.slice(0, 57).trimEnd()}...`;
}
