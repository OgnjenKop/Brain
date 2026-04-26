/**
 * Shared Node.js runtime helpers.
 *
 * These use dynamic `require()` via `Function("return require")()` to
 * bypass esbuild bundling of Node built-ins. Obsidian plugins run in an
 * Electron/Node context where `require` is available at runtime but cannot
 * be statically bundled.
 */

export function getNodeRequire(): NodeRequire {
  return Function("return require")() as NodeRequire;
}

export function getCodexRuntime(): {
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
  const req = getNodeRequire();
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

export function getExecFileAsync(): (
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

export function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export function isTimeoutError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "killed" in error && error.killed === true;
}

export function isAbortError(error: unknown): boolean {
  return typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError";
}

export function isNodeRuntimeUnavailable(error: unknown): boolean {
  return error instanceof ReferenceError || error instanceof TypeError;
}
