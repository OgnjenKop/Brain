import { BrainPluginSettings } from "../settings/settings";
import { getAIConfigurationStatus } from "../utils/ai-config";
import { BrainAIService } from "./ai-service";
import { InstructionService } from "./instruction-service";
import { VaultQueryMatch, VaultQueryService } from "./vault-query-service";
import { VaultService } from "./vault-service";
import { VaultWritePlan, VaultWriteService } from "./vault-write-service";

export interface VaultChatResponse {
  answer: string;
  sources: VaultQueryMatch[];
  plan: VaultWritePlan | null;
  usedAI: boolean;
}

export interface ChatExchange {
  role: "user" | "brain";
  text: string;
}

const EMPTY_PLAN: VaultWritePlan = {
  summary: "",
  confidence: "low",
  operations: [],
  questions: [],
};
const CHAT_CONTEXT_LIMIT = 6;
const MAX_HISTORY_EXCHANGES = 6;
const MAX_CONTEXT_EXCERPT_CHARS = 1200;

export class VaultChatService {
  constructor(
    private readonly aiService: BrainAIService,
    private readonly instructionService: InstructionService,
    private readonly queryService: VaultQueryService,
    private readonly vaultService: VaultService,
    private readonly writeService: VaultWriteService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async respond(
    message: string,
    history: ChatExchange[] = [],
    signal?: AbortSignal,
  ): Promise<VaultChatResponse> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Enter a message first");
    }

    const [instructions, sources] = await Promise.all([
      this.instructionService.readInstructions(),
      this.queryService.queryVault(trimmed),
    ]);
    const context = formatSourcesForPrompt(sources.slice(0, CHAT_CONTEXT_LIMIT));
    const settings = this.settingsProvider();
    const vaultBasePath = this.vaultService.getBasePath();
    const aiStatus = await getAIConfigurationStatus(settings);
    if (!aiStatus.configured) {
      throw new Error(aiStatus.message);
    }

    const response = await this.aiService.completeChat(
      [
        {
          role: "system",
          content: buildSystemPrompt(instructions, settings),
        },
        {
          role: "user",
          content: buildUserPrompt(trimmed, vaultBasePath, context, history),
        },
      ],
      settings,
      vaultBasePath,
      signal,
    );
    const parsed = parseChatResponse(response);
    return {
      answer: parsed.answer || "Codex returned no answer.",
      sources,
      plan: parsed.plan ? this.writeService.normalizePlan(parsed.plan) : null,
      usedAI: true,
    };
  }
}

function buildSystemPrompt(
  instructions: string,
  settings: BrainPluginSettings,
): string {
  return [
    "You are Brain, an Obsidian vault assistant.",
    "Answer directly from the Obsidian vault markdown.",
    "You may inspect markdown files in the current working directory with read-only shell commands.",
    "Never claim facts that are not supported by vault markdown or the provided source hints.",
    "For simple questions, answer in one or two sentences.",
    "For filing requests, propose safe vault writes.",
    "Return only a JSON object.",
    "",
    "Return this JSON shape:",
    "{",
    '  "answer": "markdown answer with evidence and gaps",',
    '  "plan": {',
    '    "summary": "short summary of proposed writes, or empty string",',
    '    "confidence": "low|medium|high",',
    '    "operations": [',
    '      {"type":"append","path":"Some/File.md","content":"markdown"},',
    '      {"type":"create","path":"Some/New File.md","content":"markdown"}',
    "    ],",
    '    "questions": ["open question if you need clarification"]',
    "  }",
    "}",
    "",
    "Only include write operations when the user asks to add, save, file, remember, update, create, or otherwise put information into the vault.",
    "Use append/create operations only. Do not propose delete or replace operations.",
    `Default notes folder: ${settings.notesFolder}`,
    "",
    "Vault instructions:",
    instructions,
  ].join("\n");
}

function buildUserPrompt(
  message: string,
  vaultBasePath: string | null,
  context: string,
  history: ChatExchange[],
): string {
  const parts: string[] = [];

  const recentHistory = history.slice(-MAX_HISTORY_EXCHANGES);
  if (recentHistory.length > 0) {
    parts.push("Conversation history:");
    for (const exchange of recentHistory) {
      parts.push("");
      parts.push(`${exchange.role === "user" ? "User" : "Brain"}:`);
      parts.push(exchange.text);
    }
    parts.push("");
    parts.push("---");
    parts.push("");
  }

  parts.push(`User message: ${message}`);
  parts.push("");
  parts.push(
    vaultBasePath
      ? "You are running from the Obsidian vault root. Use read-only shell commands only if you need to inspect markdown files."
      : "Use the relevant vault context below.",
  );
  parts.push("");
  parts.push("Relevant source hints:");
  parts.push(context || "No matching vault files found.");

  return parts.join("\n");
}

function formatSourcesForPrompt(sources: VaultQueryMatch[]): string {
  return sources
    .map((source, index) => [
      `## Source ${index + 1}: ${source.path}`,
      `Title: ${source.title}`,
      `Reason: ${source.reason}`,
      "",
      source.excerpt.slice(0, MAX_CONTEXT_EXCERPT_CHARS),
    ].join("\n"))
    .join("\n\n");
}

function parseChatResponse(response: string): {
  answer: string;
  plan: VaultWritePlan | null;
} {
  const jsonText = extractJson(response);
  if (!jsonText) {
    return {
      answer: response.trim(),
      plan: null,
    };
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      answer?: unknown;
      plan?: unknown;
    };
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
      plan: isPlanObject(parsed.plan) ? parsed.plan : EMPTY_PLAN,
    };
  } catch {
    return {
      answer: response.trim(),
      plan: null,
    };
  }
}

function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    return fenced.trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function isPlanObject(value: unknown): value is VaultWritePlan {
  return typeof value === "object" && value !== null;
}
