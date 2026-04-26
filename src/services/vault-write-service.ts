import { BrainPluginSettings } from "../settings/settings";
import { isSafeMarkdownPath } from "../utils/path-safety";
import { VaultService } from "./vault-service";

export type VaultWriteOperation =
  | {
      type: "append";
      path: string;
      content: string;
      description?: string;
    }
  | {
      type: "create";
      path: string;
      content: string;
      description?: string;
    };

export interface VaultWritePlan {
  summary: string;
  confidence: "low" | "medium" | "high";
  operations: VaultWriteOperation[];
  questions: string[];
}

export class VaultWriteService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  normalizePlan(plan: Partial<VaultWritePlan> | Record<string, unknown>): VaultWritePlan {
    const confidence = readConfidence(plan.confidence);
    return {
      summary: typeof plan.summary === "string" && plan.summary.trim()
        ? plan.summary.trim()
        : "Brain proposed vault updates.",
      confidence,
      operations: (Array.isArray(plan.operations) ? plan.operations : [])
        .map((operation) => this.normalizeOperation(operation))
        .filter((operation): operation is VaultWriteOperation => operation !== null)
        .slice(0, 8),
      questions: (Array.isArray(plan.questions) ? plan.questions : [])
        .map((question) => String(question).trim())
        .filter(Boolean)
        .slice(0, 5),
    };
  }

  async applyPlan(plan: VaultWritePlan): Promise<string[]> {
    const settings = this.settingsProvider();
    const paths: string[] = [];
    for (const operation of plan.operations) {
      if (!isSafeMarkdownPath(operation.path, settings)) {
        continue;
      }
      if (operation.type === "append") {
        await this.vaultService.appendText(operation.path, operation.content);
        paths.push(operation.path);
      } else if (operation.type === "create") {
        const path = await this.vaultService.ensureUniqueFilePath(operation.path);
        await this.vaultService.replaceText(path, operation.content);
        paths.push(path);
      }
    }
    return Array.from(new Set(paths));
  }

  private normalizeOperation(operation: unknown): VaultWriteOperation | null {
    if (!operation || typeof operation !== "object" || !("type" in operation)) {
      return null;
    }

    const candidate = operation as Partial<VaultWriteOperation>;
    const content = "content" in candidate ? String(candidate.content ?? "").trim() : "";
    if (!content) {
      return null;
    }

    if (candidate.type !== "append" && candidate.type !== "create") {
      return null;
    }

    const path = "path" in candidate
      ? normalizeMarkdownPath(String(candidate.path ?? ""))
      : "";
    const settings = this.settingsProvider();
    if (!isSafeMarkdownPath(path, settings)) {
      return null;
    }

    return {
      type: candidate.type,
      path,
      content,
      description: readDescription(candidate),
    };
  }
}

function readDescription(operation: Partial<VaultWriteOperation>): string | undefined {
  return typeof operation.description === "string" && operation.description.trim()
    ? operation.description.trim()
    : undefined;
}

function readConfidence(value: unknown): VaultWritePlan["confidence"] {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function normalizeMarkdownPath(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "");
}
