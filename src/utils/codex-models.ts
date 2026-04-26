import { getCodexBinaryPath } from "./codex-auth";
import { getExecFileAsync } from "./node-runtime";

export interface CodexModelOption {
  value: string;
  label: string;
}

export const DEFAULT_CODEX_MODEL_OPTIONS: CodexModelOption[] = [
  { value: "", label: "Account default" },
];

export const CUSTOM_CODEX_MODEL_VALUE = "__custom__";
const CODEX_MODEL_CATALOG_TIMEOUT_MS = 8000;

export async function getSupportedCodexModelOptions(): Promise<CodexModelOption[]> {
  const codexBinary = await getCodexBinaryPath();
  if (!codexBinary) {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }

  try {
    const execFileAsync = getExecFileAsync();
    const { stdout, stderr } = await execFileAsync(codexBinary, ["debug", "models"], {
      maxBuffer: 1024 * 1024 * 20,
      timeout: CODEX_MODEL_CATALOG_TIMEOUT_MS,
    });
    return parseCodexModelCatalog(`${stdout}\n${stderr}`);
  } catch {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }
}

export function parseCodexModelCatalog(output: string): CodexModelOption[] {
  const jsonText = extractJsonObject(output);
  if (!jsonText) {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      models?: Array<{
        slug?: unknown;
        display_name?: unknown;
        visibility?: unknown;
      }>;
    };
    const seen = new Set<string>();
    const options = [...DEFAULT_CODEX_MODEL_OPTIONS];
    for (const model of parsed.models ?? []) {
      const slug = typeof model.slug === "string" ? model.slug.trim() : "";
      if (!slug || seen.has(slug)) {
        continue;
      }
      if (model.visibility !== undefined && model.visibility !== "list") {
        continue;
      }
      seen.add(slug);
      options.push({
        value: slug,
        label: typeof model.display_name === "string" && model.display_name.trim()
          ? model.display_name.trim()
          : slug,
      });
    }
    return options;
  } catch {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }
}

export function getCodexModelDropdownValue(
  model: string,
  options: readonly CodexModelOption[] = DEFAULT_CODEX_MODEL_OPTIONS,
): string {
  const normalized = model.trim();
  if (!normalized) {
    return "";
  }
  return options.some((option) => option.value === normalized)
    ? normalized
    : CUSTOM_CODEX_MODEL_VALUE;
}

export function isKnownCodexModel(
  model: string,
  options: readonly CodexModelOption[] = DEFAULT_CODEX_MODEL_OPTIONS,
): boolean {
  const normalized = model.trim();
  return options.some((option) => option.value === normalized);
}

function extractJsonObject(output: string): string | null {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return output.slice(start, end + 1);
}
