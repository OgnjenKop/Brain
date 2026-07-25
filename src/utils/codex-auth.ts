import { getExecFileAsync, getNodeRequire, isEnoentError, isNodeRuntimeUnavailable, isTimeoutError } from "./node-runtime";

export type CodexLoginStatus = "logged-in" | "logged-out" | "unavailable";

const CODEX_LOGIN_STATUS_TIMEOUT_MS = 5000;
/**
 * Both lookups below spawn a process or walk every PATH entry, and they are hit
 * on each chat message, settings save, model change, and status refresh. A
 * short cache keeps that off the hot path; "Recheck Status" passes `force`.
 */
const CODEX_CACHE_MS = 30000;

interface Cached<T> {
  at: number;
  value: T;
}

let loginStatusCache: Cached<CodexLoginStatus> | null = null;
let loginStatusInFlight: Promise<CodexLoginStatus> | null = null;
let binaryPathCache: Cached<string | null> | null = null;
let binaryPathInFlight: Promise<string | null> | null = null;

function isFresh(entry: Cached<unknown> | null): boolean {
  return entry !== null && Date.now() - entry.at < CODEX_CACHE_MS;
}

/** Drops cached Codex lookups so the next call re-checks the machine. */
export function clearCodexCache(): void {
  loginStatusCache = null;
  loginStatusInFlight = null;
  binaryPathCache = null;
  binaryPathInFlight = null;
}

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

export async function getCodexLoginStatus(options?: { force?: boolean }): Promise<CodexLoginStatus> {
  if (options?.force) {
    clearCodexCache();
  } else if (isFresh(loginStatusCache)) {
    return loginStatusCache!.value;
  }

  // Concurrent callers share one process rather than each spawning their own.
  if (!loginStatusInFlight) {
    loginStatusInFlight = fetchCodexLoginStatus().finally(() => {
      loginStatusInFlight = null;
    });
  }
  return loginStatusInFlight;
}

async function fetchCodexLoginStatus(): Promise<CodexLoginStatus> {
  const status = await readCodexLoginStatus();
  loginStatusCache = { at: Date.now(), value: status };
  return status;
}

async function readCodexLoginStatus(): Promise<CodexLoginStatus> {
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
  if (isFresh(binaryPathCache)) {
    return binaryPathCache!.value;
  }
  if (!binaryPathInFlight) {
    binaryPathInFlight = findCodexBinaryPath()
      .then((resolved) => {
        binaryPathCache = { at: Date.now(), value: resolved };
        return resolved;
      })
      .finally(() => {
        binaryPathInFlight = null;
      });
  }
  return binaryPathInFlight;
}

async function findCodexBinaryPath(): Promise<string | null> {
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
      // X_OK, not F_OK: a non-executable file named `codex` on PATH is not a
      // usable CLI, and selecting it would fail later with a confusing error.
      await fs.promises.access(candidate, fs.constants.X_OK);
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

  const commonDirs: string[] = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    `${homeDir}/.local/bin`,
    `${homeDir}/.bun/bin`,
    `${homeDir}/.codeium/windsurf/bin`,
    `${homeDir}/.antigravity/antigravity/bin`,
    "/Applications/Codex.app/Contents/Resources",
  ];

  if (process.platform === "win32") {
    if (process.env.APPDATA) {
      commonDirs.push(pathModule.join(process.env.APPDATA, "npm"));
    }
    if (process.env.LOCALAPPDATA) {
      commonDirs.push(pathModule.join(process.env.LOCALAPPDATA, "Programs", "Codex"));
    }
  }

  for (const dir of commonDirs) {
    candidates.add(pathModule.join(dir, codexExecutableName()));
  }

  return Array.from(candidates);
}

function codexExecutableName(): string {
  return process.platform === "win32" ? "codex.cmd" : "codex";
}
