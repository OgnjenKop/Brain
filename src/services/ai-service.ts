import { BrainPluginSettings } from "../settings/settings";
import { getCodexBinaryPath } from "../utils/codex-auth";
import { getCodexRuntime, isAbortError, isEnoentError, isTimeoutError } from "../utils/node-runtime";

const CODEX_CHAT_TIMEOUT_MS = 120000;

interface ExecResult {
  stdout: string;
  stderr: string;
}

export class BrainAIService {
  async completeChat(
    messages: Array<{ role: "system" | "user"; content: string }>,
    settings: BrainPluginSettings,
    workingDirectory: string | null,
    signal?: AbortSignal,
  ): Promise<string> {
    return this.postCodexCompletion(settings, messages, workingDirectory, signal);
  }

  private async postCodexCompletion(
    settings: BrainPluginSettings,
    messages: Array<{ role: "system" | "user"; content: string }>,
    workingDirectory: string | null,
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
      "--ignore-rules",
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputFile,
    ];

    if (workingDirectory) {
      args.push("--cd", workingDirectory);
    }

    if (settings.codexModel.trim()) {
      args.push("--model", settings.codexModel.trim());
    }

    args.push("-");
    const prompt = this.buildCodexPrompt(messages);

    let execResult: ExecResult | null = null;

    try {
      execResult = await execFileWithAbort(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
        timeout: CODEX_CHAT_TIMEOUT_MS,
        signal,
        stdin: prompt,
      }, execFile);

      let content: string;
      try {
        content = await fs.readFile(outputFile, "utf8");
      } catch {
        if (execResult.stdout.trim()) {
          content = execResult.stdout.trim();
        } else if (execResult.stderr.trim()) {
          throw new Error(`Codex did not produce output. Details: ${execResult.stderr.trim().slice(0, 500)}`);
        } else {
          throw new Error("Codex did not produce any output. The CLI may require a newer version or a different configuration.");
        }
      }

      if (!content.trim()) {
        throw new Error("Codex returned an empty response.");
      }
      return content.trim();
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) {
        throw new Error("Codex request stopped.");
      }
      if (isTimeoutError(error)) {
        throw new Error(
          "Codex did not respond in time. Try again, or check `codex login status` outside Brain. " +
          "If Codex requires approval for shell commands, configure it for non-interactive use.",
        );
      }
      if (isEnoentError(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }

      const stderrDetail = execResult?.stderr?.trim()
        || getErrorDetail(error, "stderr")
        || "";
      if (stderrDetail && error instanceof Error) {
        throw new Error(`${error.message}\nCodex stderr: ${stderrDetail.slice(0, 500)}`);
      }
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private buildCodexPrompt(
    messages: Array<{ role: "system" | "user"; content: string }>,
  ): string {
    const parts: string[] = [];

    for (const message of messages) {
      if (message.role === "system") {
        parts.push(message.content);
      } else {
        parts.push("");
        parts.push("---");
        parts.push("");
        parts.push(message.content);
      }
    }

    return parts.join("\n");
  }
}

function execFileWithAbort(
  file: string,
  args: readonly string[],
  options: import("child_process").ExecFileOptions & {
    signal?: AbortSignal;
    stdin?: string;
  },
  execFile: ReturnType<typeof getCodexRuntime>["execFile"],
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const { signal, stdin, ...execOptions } = options;
    const child = execFile(file, args, execOptions, (error, stdout, stderr) => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", abort);
      if (error) {
        const enriched = enrichError(error, stdout, stderr);
        reject(enriched);
      } else {
        resolve({
          stdout: bufferToString(stdout),
          stderr: bufferToString(stderr),
        });
      }
    });
    if (stdin !== undefined) {
      child.stdin?.end(stdin);
    }

    const abort = () => {
      if (settled) {
        return;
      }
      child.kill("SIGTERM");
      window.setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, 1500);
    };

    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener("abort", abort, { once: true });
    }
  });
}

function bufferToString(value: string | Buffer): string {
  return Buffer.isBuffer(value) ? value.toString("utf8") : value;
}

function enrichError(
  error: import("child_process").ExecFileException,
  stdout: string | Buffer,
  stderr: string | Buffer,
): CodexExecutionError {
  const stdoutText = bufferToString(stdout);
  const stderrText = bufferToString(stderr);
  const wrapped = new CodexExecutionError(error.message, error);
  wrapped.stdout = stdoutText;
  wrapped.stderr = stderrText;
  if (error.code !== null) {
    wrapped.code = error.code;
  }
  wrapped.killed = error.killed ?? false;
  return wrapped;
}

class CodexExecutionError extends Error {
  stdout = "";
  stderr = "";
  code: string | number | undefined = undefined;
  killed = false;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CodexExecutionError";
    (this as Error & { cause?: unknown }).cause = cause;
  }
}

function getErrorDetail(error: unknown, key: "stdout" | "stderr"): string {
  if (typeof error !== "object" || error === null || !(key in error)) {
    return "";
  }
  const value = (error as Record<string, unknown>)[key];
  if (typeof value === "string") {
    return value.trim();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("utf8").trim();
  }
  return "";
}
