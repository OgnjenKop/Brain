import { requestUrl } from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { normalizeSummary } from "../utils/summary-normalize";
import { normalizeSynthesisOutput } from "../utils/synthesis-normalize";
import { SynthesisContext } from "./context-service";
import { normalizeTaskExtractionOutput } from "../utils/task-extract-normalize";
import { normalizeDecisionExtractionOutput } from "../utils/decision-extract-normalize";
import { normalizeOpenQuestionsOutput } from "../utils/open-questions-normalize";
import { normalizeCleanNoteOutput } from "../utils/clean-note-normalize";
import { normalizeProjectBriefOutput } from "../utils/project-brief-normalize";
import { normalizeQuestionAnswerOutput } from "../utils/question-answer-normalize";
import { normalizeTopicPageOutput } from "../utils/topic-page-normalize";
import { formatContextMetadataLines } from "../utils/context-format";
import { SynthesisTemplate } from "../types";
import { getCodexBinaryPath } from "../utils/codex-auth";

type RouteLabel = "note" | "task" | "journal" | null;

interface GeminiContentPart {
  text: string;
}

interface GeminiRequestBody {
  contents: Array<{ role: string; parts: GeminiContentPart[] }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
  system_instruction?: {
    parts: GeminiContentPart[];
  };
}

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

  async synthesizeContext(
    template: SynthesisTemplate,
    context: SynthesisContext,
    settings: BrainPluginSettings,
  ): Promise<string> {
    const prompt = this.buildPrompt(template, context);
    const response = await this.postChatCompletion(settings, prompt);
    return this.normalize(template, response);
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

  async answerQuestion(
    question: string,
    context: SynthesisContext,
    settings: BrainPluginSettings,
  ): Promise<string> {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content:
          "You answer questions using explicit markdown vault context only. Respond with concise markdown using the requested sections only and do not invent facts.",
      },
      {
        role: "user",
        content: [
          "Answer the following question using only the context below.",
          "",
          `Question: ${question}`,
          "",
          "Return exactly these sections:",
          "",
          "# Answer",
          "## Question",
          "## Answer",
          "## Evidence",
          "## Follow-ups",
          "",
          "If the context is insufficient, say so explicitly.",
          "",
          ...formatContextMetadataLines(context),
          "",
          context.text,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ]);

    return normalizeQuestionAnswerOutput(response);
  }

  async createTopicPage(
    topic: string,
    context: SynthesisContext,
    settings: BrainPluginSettings,
  ): Promise<string> {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content:
          "You turn explicit markdown vault context into a durable wiki page. Respond with the requested sections only and do not invent facts.",
      },
      {
        role: "user",
        content: [
          `Create a topic page for: ${topic}`,
          "",
          "Return exactly these sections:",
          "",
          "## Overview",
          `- Topic: ${topic}`,
          "## Evidence",
          "## Open Questions",
          "## Sources",
          "## Next Steps",
          "",
          "Be concise, do not invent facts, and keep the page reusable.",
          "",
          ...formatContextMetadataLines(context),
          "",
          context.text,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ]);

    return normalizeTopicPageOutput(response);
  }

  private async postChatCompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): Promise<string> {
    if (settings.aiProvider === "codex") {
      return this.postCodexCompletion(settings, messages);
    }
    if (settings.aiProvider === "gemini") {
      return this.postGeminiCompletion(settings, messages);
    }
    return this.postOpenAICompletion(settings, messages);
  }

  private async postCodexCompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): Promise<string> {
    const { execFileAsync, fs, os, path } = getCodexRuntime();
    const codexBinary = await getCodexBinaryPath();
    if (!codexBinary) {
      throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
    }
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "brain-codex-"));
    const outputFile = path.join(tempDir, "response.txt");
    const args = [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputFile,
    ];

    if (settings.codexModel.trim()) {
      args.push("--model", settings.codexModel.trim());
    }

    args.push(this.buildCodexPrompt(messages));

    try {
      await execFileAsync(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
      });
      const content = await fs.readFile(outputFile, "utf8");
      if (!content.trim()) {
        throw new Error("Codex returned an empty response");
      }
      return content.trim();
    } catch (error) {
      if (isEnoentError(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private buildCodexPrompt(
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): string {
    return [
      "You are responding inside Brain, an Obsidian plugin.",
      "Do not run shell commands, inspect the filesystem, or modify files.",
      "Use only the content provided below and answer with markdown only.",
      "",
      ...messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`),
    ].join("\n\n");
  }

  private async postOpenAICompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): Promise<string> {
    const isDefaultUrl = !settings.openAIBaseUrl || settings.openAIBaseUrl.includes("api.openai.com");
    if (isDefaultUrl && !settings.openAIApiKey.trim()) {
      throw new Error("OpenAI API key is missing");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (settings.openAIApiKey.trim()) {
      headers["Authorization"] = `Bearer ${settings.openAIApiKey.trim()}`;
    }

    const result = await requestUrl({
      url: settings.openAIBaseUrl.trim() || "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers,
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

  private async postGeminiCompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): Promise<string> {
    if (!settings.geminiApiKey.trim()) {
      throw new Error("Gemini API key is missing");
    }

    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    // Convert OpenAI messages to Gemini format
    const contents = userMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const body: GeminiRequestBody = {
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    if (systemMessage) {
      body.system_instruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const result = await requestUrl({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel}:generateContent?key=${settings.geminiApiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = result.json;
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!content.trim()) {
      throw new Error("Gemini returned an empty response");
    }
    return content.trim();
  }

  private buildPrompt(
    template: SynthesisTemplate,
    context: SynthesisContext,
  ): Array<{ role: "system" | "user"; content: string }> {
    if (template === "extract-tasks") {
      return [
        {
          role: "system",
          content:
            "You extract actionable tasks from explicit markdown vault context. Respond with the requested sections only.",
        },
        {
          role: "user",
          content: [
            "Extract tasks from the following context into exactly these sections:",
            "",
            "## Tasks",
            "## Context",
            "## Follow-ups",
            "",
            "Be concise, do not invent facts, and preserve actionable items.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];
    }

    if (template === "rewrite-clean-note") {
      return [
        {
          role: "system",
          content:
            "You rewrite explicit markdown vault context into a clean markdown note. Respond with the requested sections only.",
        },
        {
          role: "user",
          content: [
            "Rewrite the following context into exactly these sections:",
            "",
            "# Clean Note",
            "## Overview",
            "## Key Points",
            "## Open Questions",
            "",
            "Be concise, do not invent facts, and preserve the structure of a reusable note.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];
    }

    if (template === "extract-decisions") {
      return [
        {
          role: "system",
          content:
            "You extract decisions from explicit markdown vault context. Respond with the requested sections only.",
        },
        {
          role: "user",
          content: [
            "Extract decisions from the following context into exactly these sections:",
            "",
            "## Decisions",
            "## Rationale",
            "## Open Questions",
            "",
            "Be concise, do not invent facts, and preserve uncertainty where context is incomplete.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];
    }

    if (template === "extract-open-questions") {
      return [
        {
          role: "system",
          content:
            "You extract unresolved questions from explicit markdown vault context. Respond with the requested sections only.",
        },
        {
          role: "user",
          content: [
            "Extract open questions from the following context into exactly these sections:",
            "",
            "## Open Questions",
            "## Context",
            "## Follow-ups",
            "",
            "Be concise, do not invent facts, and keep uncertainty explicit.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];
    }

    if (template === "draft-project-brief") {
      return [
        {
          role: "system",
          content:
            "You draft a project brief from explicit markdown vault context. Respond with the requested sections only.",
        },
        {
          role: "user",
          content: [
            "Draft the following context into exactly these sections:",
            "",
            "# Project Brief",
            "## Overview",
            "## Goals",
            "## Scope",
            "## Next Steps",
            "",
            "Be concise, do not invent facts, and preserve project structure.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];
    }

    return [
      {
        role: "system",
        content:
          "You turn explicit markdown vault context into concise markdown synthesis. Respond with the requested sections only.",
      },
      {
        role: "user",
        content: [
          "Summarize the following context into exactly these sections:",
          "",
          "## Summary",
          "## Key Themes",
          "## Follow-ups",
          "",
          "Be concise, do not invent facts, and preserve actionable items.",
          "",
          ...formatContextMetadataLines(context),
          "",
          context.text,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
  }

  private normalize(template: SynthesisTemplate, response: string): string {
    if (template === "extract-tasks") {
      return normalizeTaskExtractionOutput(response);
    }
    if (template === "extract-decisions") {
      return normalizeDecisionExtractionOutput(response);
    }
    if (template === "extract-open-questions") {
      return normalizeOpenQuestionsOutput(response);
    }
    if (template === "rewrite-clean-note") {
      return normalizeCleanNoteOutput(response);
    }
    if (template === "draft-project-brief") {
      return normalizeProjectBriefOutput(response);
    }
    return normalizeSynthesisOutput(response);
  }
}

function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function getCodexRuntime(): {
  execFileAsync: (
    file: string,
    args?: readonly string[],
    options?: Record<string, unknown>,
  ) => Promise<{ stdout: string; stderr: string }>;
  fs: typeof import("fs").promises;
  os: typeof import("os");
  path: typeof import("path");
} {
  const req = getNodeRequire();
  const { execFile } = req("child_process") as typeof import("child_process");
  const { promisify } = req("util") as typeof import("util");

  return {
    execFileAsync: promisify(execFile) as (
      file: string,
      args?: readonly string[],
      options?: Record<string, unknown>,
    ) => Promise<{ stdout: string; stderr: string }>,
    fs: (req("fs") as typeof import("fs")).promises,
    os: req("os") as typeof import("os"),
    path: req("path") as typeof import("path"),
  };
}

function getNodeRequire(): NodeRequire {
  return Function("return require")() as NodeRequire;
}
