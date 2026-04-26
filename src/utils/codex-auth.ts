import { getExecFileAsync, getNodeRequire, isEnoentError, isNodeRuntimeUnavailable, isTimeoutError } from "./node-runtime";

export type CodexLoginStatus = "logged-in" | "logged-out" | "unavailable";

const CODEX_LOGIN_STATUS_TIMEOUT_MS = 5000;

export function parseCodexLoginStatus(output: string): CodexLoginStatus {
  const normalized = output.trim().toLowerCase();
  if (!normalized) {
    return "logged-out";
  }

  if (normalized.includes("not logged in") || normalized.includes("logged out")) {
    return "logged-out";
  }

  if (
    normalized.includes("logged in") ||
    normalized.includes("signed in") ||
    normalized.includes("authenticated")
  ) {
    return "logged-in";
  }

  return "logged-out";
}

export async function getCodexLoginStatus(): Promise<CodexLoginStatus> {
  try {
    const codexBinary = await getCodexBinaryPath();
    if (!codexBinary) {
      return "unavailable";
    }

    const execFileAsync = getExecFileAsync();
    const { stdout, stderr } = await execFileAsync(codexBinary, ["login", "status"], {
      maxBuffer: 1024 * 1024,
      timeout: CODEX_LOGIN_STATUS_TIMEOUT_MS,
    });
    return parseCodexLoginStatus(`${stdout}\n${stderr}`);
  } catch (error) {
    if (isEnoentError(error) || isTimeoutError(error) || isNodeRuntimeUnavailable(error)) {
      return "unavailable";
    }
    return "logged-out";
  }
}

export async function getCodexBinaryPath(): Promise<string | null> {
  let req: NodeRequire;
  try {
    req = getNodeRequire();
  } catch {
    return null;
  }

  const fs = req("fs") as typeof import("fs");
  const path = req("path") as typeof import("path");
  const os = req("os") as typeof import("os");

  const candidates = buildCodexCandidates(path, os.homedir());
  for (const candidate of candidates) {
    try {
      await fs.promises.access(candidate);
      return candidate;
    } catch {
      // Keep searching.
    }
  }

  return null;
}

function buildCodexCandidates(pathModule: typeof import("path"), homeDir: string): string[] {
  const candidates = new Set<string>();
  const pathEntries = (process.env.PATH ?? "").split(pathModule.delimiter).filter(Boolean);

  for (const entry of pathEntries) {
    candidates.add(pathModule.join(entry, codexExecutableName()));
  }

  const commonDirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    `${homeDir}/.local/bin`,
    `${homeDir}/.bun/bin`,
    `${homeDir}/.codeium/windsurf/bin`,
    `${homeDir}/.antigravity/antigravity/bin`,
    "/Applications/Codex.app/Contents/Resources",
  ];

  for (const dir of commonDirs) {
    candidates.add(pathModule.join(dir, codexExecutableName()));
  }

  return Array.from(candidates);
}

function codexExecutableName(): string {
  return process.platform === "win32" ? "codex.cmd" : "codex";
}
