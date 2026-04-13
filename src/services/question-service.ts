import { Notice } from "obsidian";
import { BrainAIService } from "./ai-service";
import { BrainPluginSettings } from "../settings/settings";
import { SynthesisContext } from "./context-service";
import { buildFallbackQuestionAnswer } from "../utils/question-answer-format";
import { normalizeQuestionAnswerOutput } from "../utils/question-answer-normalize";
import { formatDateTimeKey } from "../utils/date";
import { SynthesisResult } from "./synthesis-service";

export class QuestionService {
  constructor(
    private readonly aiService: BrainAIService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async answerQuestion(question: string, context: SynthesisContext): Promise<SynthesisResult> {
    const settings = this.settingsProvider();
    const fallback = buildFallbackQuestionAnswer(question, context.text);
    let content = fallback;
    let usedAI = false;

    if (settings.enableAISummaries) {
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new Notice("AI answers are enabled but OpenAI is not configured");
      } else {
        try {
          content = await this.aiService.answerQuestion(question, context, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new Notice("Brain fell back to local question answering");
          content = fallback;
        }
      }
    }

    return {
      action: "Question Answer",
      title: "Answer",
      noteTitle: shortenQuestion(question),
      content: normalizeQuestionAnswerOutput(content),
      usedAI,
      promptText: question,
    };
  }
}

function shortenQuestion(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) {
    return cleaned || `Question ${formatDateTimeKey(new Date())}`;
  }

  return `${cleaned.slice(0, 57).trimEnd()}...`;
}
