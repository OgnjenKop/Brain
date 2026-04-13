import { Notice } from "obsidian";
import { BrainAIService } from "./ai-service";
import { BrainPluginSettings } from "../settings/settings";
import { SynthesisContext } from "./context-service";
import { buildFallbackSynthesis } from "../utils/synthesis-format";
import { normalizeSynthesisOutput } from "../utils/synthesis-normalize";
import { buildFallbackTaskExtraction } from "../utils/task-extract-format";
import { normalizeTaskExtractionOutput } from "../utils/task-extract-normalize";
import { buildFallbackDecisionExtraction } from "../utils/decision-extract-format";
import { normalizeDecisionExtractionOutput } from "../utils/decision-extract-normalize";
import { buildFallbackOpenQuestions } from "../utils/open-questions-format";
import { normalizeOpenQuestionsOutput } from "../utils/open-questions-normalize";
import { buildFallbackCleanNote } from "../utils/clean-note-format";
import { normalizeCleanNoteOutput } from "../utils/clean-note-normalize";
import { buildFallbackProjectBrief } from "../utils/project-brief-format";
import { normalizeProjectBriefOutput } from "../utils/project-brief-normalize";
import { SynthesisTemplate } from "../views/template-picker-modal";
import { getSynthesisTemplateTitle } from "../utils/synthesis-template";

export interface SynthesisResult {
  action: string;
  title: string;
  noteTitle: string;
  content: string;
  usedAI: boolean;
  promptText?: string;
}

export class SynthesisService {
  constructor(
    private readonly aiService: BrainAIService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async run(template: SynthesisTemplate, context: SynthesisContext): Promise<SynthesisResult> {
    const settings = this.settingsProvider();
    const fallback = this.buildFallback(template, context.text);
    let content = fallback;
    let usedAI = false;

    if (settings.enableAISummaries) {
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new Notice("AI summaries are enabled but OpenAI is not configured");
      } else {
        try {
          content = await this.aiService.synthesizeContext(template, context, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new Notice("Brain fell back to local synthesis");
          content = fallback;
        }
      }
    }

    return {
      action: getSynthesisTemplateTitle(template),
      title: getSynthesisTemplateTitle(template),
      noteTitle: `${context.sourceLabel} ${getSynthesisTemplateTitle(template)}`,
      content: this.normalize(template, content),
      usedAI,
    };
  }

  private buildFallback(template: SynthesisTemplate, text: string): string {
    if (template === "extract-tasks") {
      return buildFallbackTaskExtraction(text);
    }

    if (template === "extract-decisions") {
      return buildFallbackDecisionExtraction(text);
    }

    if (template === "extract-open-questions") {
      return buildFallbackOpenQuestions(text);
    }

    if (template === "rewrite-clean-note") {
      return buildFallbackCleanNote(text);
    }

    if (template === "draft-project-brief") {
      return buildFallbackProjectBrief(text);
    }

    return buildFallbackSynthesis(text);
  }

  private normalize(template: SynthesisTemplate, content: string): string {
    if (template === "extract-tasks") {
      return normalizeTaskExtractionOutput(content);
    }

    if (template === "extract-decisions") {
      return normalizeDecisionExtractionOutput(content);
    }

    if (template === "extract-open-questions") {
      return normalizeOpenQuestionsOutput(content);
    }

    if (template === "rewrite-clean-note") {
      return normalizeCleanNoteOutput(content);
    }

    if (template === "draft-project-brief") {
      return normalizeProjectBriefOutput(content);
    }

    return normalizeSynthesisOutput(content);
  }
}
