import { BrainPluginSettings } from "../settings/settings";
import { getCodexBinaryPath } from "../utils/codex-auth";

const CODEX_CHAT_TIMEOUT_MS = 120000;

export class BrainAIService {
  async completeChat(
    messages: Array<{ role: "system" | "user"; content: string }>,
    settings: BrainPluginSettings,
    signal?: AbortSignal,
  ): Promise<string> {
    return this.postCodexCompletion(settings, messages, signal);
  }

  private async postCodexCompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
    signal?: AbortSignal,
  ): Promise<string> {
    const { execFile, fs, os, path } = getCodexRuntime();
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
      await execFileWithAbort(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
        timeout: CODEX_CHAT_TIMEOUT_MS,
        signal,
      }, execFile);
      const content = await fs.readFile(outputFile, "utf8");
      if (!content.trim()) {
        throw new Error("Codex returned an empty response");
      }
      return content.trim();
    } catch (error) {
      if (isEnoentError(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }
      if (isTimeoutError(error)) {
        throw new Error("Codex did not respond in time. Try again, or check `codex login status` outside Brain.");
      }
      if (signal?.aborted || isAbortError(error)) {
        throw new Error("Codex request stopped.");
      }
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private buildCodexPrompt(
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): string {
    return messages
      .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
      .join("\n\n");
  }
}

function getCodexRuntime(): {
  execFile: (
    file: string,
    args?: readonly string[],
    options?: import("child_process").ExecFileOptions,
    callback?: (
      error: import("child_process").ExecFileException | null,
      stdout: string | Buffer,
      stderr: string | Buffer,
    ) => void,
  ) => import("child_process").ChildProcess;
  fs: typeof import("fs/promises");
  os: typeof import("os");
  path: typeof import("path");
} {
  const req = Function("return require")() as NodeRequire;
  const { execFile } = req("child_process") as typeof import("child_process");
  return {
    execFile: execFile as (
      file: string,
      args?: readonly string[],
      options?: import("child_process").ExecFileOptions,
      callback?: (
        error: import("child_process").ExecFileException | null,
        stdout: string | Buffer,
        stderr: string | Buffer,
      ) => void,
    ) => import("child_process").ChildProcess,
    fs: req("fs/promises") as typeof import("fs/promises"),
    os: req("os") as typeof import("os"),
    path: req("path") as typeof import("path"),
  };
}

function execFileWithAbort(
  file: string,
  args: readonly string[],
  options: import("child_process").ExecFileOptions & {
    signal?: AbortSignal;
  },
  execFile: ReturnType<typeof getCodexRuntime>["execFile"],
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = execFile(file, args, options, (error) => {
      if (settled) {
        return;
      }
      settled = true;
      options.signal?.removeEventListener("abort", abort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    const abort = () => {
      if (settled) {
        return;
      }
      child.kill("SIGTERM");
      window.setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 1500);
    };

    if (options.signal?.aborted) {
      abort();
    } else {
      options.signal?.addEventListener("abort", abort, { once: true });
    }
  });
}

function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isTimeoutError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "killed" in error && error.killed === true;
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError";
}
