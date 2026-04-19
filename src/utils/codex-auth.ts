export type CodexLoginStatus = "logged-in" | "logged-out" | "unavailable";

export function parseCodexLoginStatus(output: string): CodexLoginStatus {
  const normalized = output.trim().toLowerCase();
  if (!normalized) {
    return "logged-out";
  }

  if (normalized.includes("not logged in") || normalized.includes("logged out")) {
    return "logged-out";
  }

  if (normalized.includes("logged in")) {
    return "logged-in";
  }

  return "logged-out";
}

export async function getCodexLoginStatus(): Promise<CodexLoginStatus> {
  const codexBinary = await getCodexBinaryPath();
  if (!codexBinary) {
    return "unavailable";
  }

  try {
    const execFileAsync = getExecFileAsync();
    const { stdout, stderr } = await execFileAsync(codexBinary, ["login", "status"], {
      maxBuffer: 1024 * 1024,
    });
    return parseCodexLoginStatus(`${stdout}\n${stderr}`);
  } catch (error) {
    if (isEnoentError(error)) {
      return "unavailable";
    }
    return "logged-out";
  }
}

export async function getCodexBinaryPath(): Promise<string | null> {
  const req = getNodeRequire();
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

function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function getExecFileAsync(): (
  file: string,
  args?: readonly string[],
  options?: Record<string, unknown>,
) => Promise<{ stdout: string; stderr: string }> {
  const req = getNodeRequire();
  const { execFile } = req("child_process") as typeof import("child_process");
  const { promisify } = req("util") as typeof import("util");
  return promisify(execFile) as (
    file: string,
    args?: readonly string[],
    options?: Record<string, unknown>,
  ) => Promise<{ stdout: string; stderr: string }>;
}

function getNodeRequire(): NodeRequire {
  return Function("return require")() as NodeRequire;
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
