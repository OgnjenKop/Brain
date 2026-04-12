import { requestUrl } from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { normalizeSummary } from "../utils/summary-normalize";

type RouteLabel = "note" | "task" | "journal" | null;

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

export class BrainAIService {
  constructor() {}

  async summarize(text: string, settings: BrainPluginSettings): Promise<string> {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content:
          "You summarize markdown vault content. Respond with concise markdown using the requested sections only.",
      },
      {
        role: "user",
        content: [
          "Summarize the following vault content into exactly these sections:",
          "",
          "## Highlights",
          "## Tasks",
          "## Follow-ups",
          "",
          "Be concise, do not invent facts, and preserve actionable tasks.",
          "",
          text,
        ].join("\n"),
      },
    ]);

    return normalizeSummary(response);
  }

  async routeText(text: string, settings: BrainPluginSettings): Promise<RouteLabel> {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content:
          "Classify capture text into exactly one of: note, task, journal. Return one word only.",
      },
      {
        role: "user",
        content: [
          "Classify the following user input as exactly one of:",
          "note",
          "task",
          "journal",
          "",
          "Return only one word.",
          "",
          text,
        ].join("\n"),
      },
    ]);

    const cleaned = response.trim().toLowerCase();
    if (cleaned === "note" || cleaned === "task" || cleaned === "journal") {
      return cleaned;
    }
    return null;
  }

  private async postChatCompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): Promise<string> {
    if (!settings.openAIApiKey.trim()) {
      throw new Error("OpenAI API key is missing");
    }

    const result = await requestUrl({
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.openAIApiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.openAIModel.trim(),
        messages,
        temperature: 0.2,
      }),
    });

    const json = result.json as ChatCompletionResponse;
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) {
      throw new Error("OpenAI returned an empty response");
    }
    return content.trim();
  }
}
