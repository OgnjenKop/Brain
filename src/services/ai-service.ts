import { BrainPluginSettings } from "../settings/settings";
import { getCodexBinaryPath } from "../utils/codex-auth";
import { getCodexRuntime, isAbortError, isEnoentError, isTimeoutError } from "../utils/node-runtime";

const CODEX_CHAT_TIMEOUT_MS = 120000;

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

    try {
      await execFileWithAbort(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
        timeout: CODEX_CHAT_TIMEOUT_MS,
        signal,
        stdin: prompt,
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

function execFileWithAbort(
  file: string,
  args: readonly string[],
  options: import("child_process").ExecFileOptions & {
    signal?: AbortSignal;
    stdin?: string;
  },
  execFile: ReturnType<typeof getCodexRuntime>["execFile"],
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const { signal, stdin, ...execOptions } = options;
    const child = execFile(file, args, execOptions, (error) => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", abort);
      if (error) {
        reject(error);
      } else {
        resolve();
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


