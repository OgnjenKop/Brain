import { BrainPluginSettings } from "../settings/settings";
import { getAIConfigurationStatus } from "../utils/ai-config";
import { BrainAIService } from "./ai-service";
import { InstructionService } from "./instruction-service";
import { VaultQueryMatch, VaultQueryService } from "./vault-query-service";
import { VaultWritePlan, VaultWriteService } from "./vault-write-service";

export interface VaultChatResponse {
  answer: string;
  sources: VaultQueryMatch[];
  plan: VaultWritePlan | null;
}

export interface ChatExchange {
  role: "user" | "brain";
  text: string;
}

/**
 * The source hints are the model's only view of the vault, so Brain sends a few
 * more of them, and more of each, than it did when Codex could go read files
 * for itself.
 */
const CHAT_CONTEXT_LIMIT = 8;
const MAX_HISTORY_EXCHANGES = 6;
const MAX_CONTEXT_EXCERPT_CHARS = 1200;

export class VaultChatService {
  constructor(
    private readonly aiService: BrainAIService,
    private readonly instructionService: InstructionService,
    private readonly queryService: VaultQueryService,
    private readonly writeService: VaultWriteService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async respond(
    message: string,
    history: ChatExchange[] = [],
    signal?: AbortSignal,
    onStage?: (stage: "query" | "ai") => void,
  ): Promise<VaultChatResponse> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Enter a message first");
    }

    // Checked before retrieval so an unconfigured Codex fails immediately
    // instead of after a full vault scan.
    const settings = this.settingsProvider();
    const aiStatus = await getAIConfigurationStatus(settings);
    if (!aiStatus.configured) {
      throw new Error(aiStatus.message);
    }

    onStage?.("query");
    // Retrieve exactly the sources that go into the prompt, so the sources the
    // UI attributes the answer to are the ones the model actually saw.
    const [instructions, sources] = await Promise.all([
      this.instructionService.readInstructions(),
      this.queryService.queryVault(trimmed, {
        limit: CHAT_CONTEXT_LIMIT,
        priorQuery: lastUserMessage(history),
      }),
    ]);
    const context = formatSourcesForPrompt(sources);

    onStage?.("ai");
    const response = await this.aiService.completeChat(
      [
        {
          role: "system",
          content: buildSystemPrompt(instructions, settings),
        },
        {
          role: "user",
          content: buildUserPrompt(trimmed, context, history),
        },
      ],
      settings,
      signal,
    );
    const parsed = parseChatResponse(response);
    return {
      answer: parsed.answer || "Codex returned no answer.",
      sources,
      plan: parsed.plan ? this.writeService.normalizePlan(parsed.plan) : null,
    };
  }
}

/**
 * The most recent user message before this one. A follow-up like "when is the
 * next review?" carries none of its own subject, so retrieval would otherwise
 * lose the thread.
 */
function lastUserMessage(history: ChatExchange[]): string | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].role === "user") {
      return history[index].text;
    }
  }
  return undefined;
}

function buildSystemPrompt(
  instructions: string,
  settings: BrainPluginSettings,
): string {
  return [
    "You are Brain, an Obsidian vault assistant.",
    "Answer from the source hints provided in the user message.",
    "You have no shell and no filesystem access. The source hints are the only vault content available to you; there is nothing else to read.",
    "Never claim facts that are not supported by the provided source hints.",
    "If the hints do not answer the question, say so plainly and name what the user could search for or which note is likely to hold it. Do not guess, and do not describe files you were not shown.",
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
    "The source hints below are the complete vault context for this question. There is no other vault content available to you.",
  );
  parts.push("");
  parts.push("Relevant source hints:");
  parts.push(
    context
      || "No matching vault files found. Say so, and suggest what the user could search for instead.",
  );

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

export function parseChatResponse(response: string): {
  answer: string;
  /** Raw, unvalidated plan payload. `VaultWriteService.normalizePlan` validates it. */
  plan: Record<string, unknown> | null;
} {
  for (const candidate of jsonCandidates(response)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }
    if (!isJsonObject(parsed)) {
      continue;
    }
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
      plan: isJsonObject(parsed.plan) ? parsed.plan : null,
    };
  }
  return {
    answer: response.trim(),
    plan: null,
  };
}

/**
 * Candidate JSON payloads, most trustworthy first.
 *
 * The whole response is tried before any fence, because Codex normally returns
 * bare JSON whose `answer` contains markdown — often including a fenced code
 * block. Matching an unanchored fence first would extract that inner block and
 * lose both the answer and the write plan.
 */
function jsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const candidates = [trimmed];

  const fenced = trimmed.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n?```$/i)?.[1];
  if (fenced) {
    candidates.push(fenced.trim());
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.push(trimmed.slice(start, end + 1));
  }

  return candidates;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
