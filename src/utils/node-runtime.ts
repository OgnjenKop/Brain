/**
 * Shared Node.js runtime helpers.
 *
 * These use dynamic `require()` via `Function("return require")()` to
 * bypass esbuild bundling of Node built-ins. Obsidian plugins run in an
 * Electron/Node context where `require` is available at runtime but cannot
 * be statically bundled.
 */

import type { ChildProcess, ExecFileException, ExecFileOptions } from "child_process";
import type { PathLike } from "fs";

export function getNodeRequire(): NodeRequire {
  return Function("return require")() as NodeRequire;
}

type ExecFileFn = (
  file: string,
  args?: readonly string[],
  options?: ExecFileOptions,
  callback?: (
    error: ExecFileException | null,
    stdout: string | Buffer,
    stderr: string | Buffer,
  ) => void,
) => ChildProcess;

type ExecFileAsyncFn = (
  file: string,
  args?: readonly string[],
  options?: ExecFileOptions,
) => Promise<{ stdout: string; stderr: string }>;

function getChildProcess(): { execFile: ExecFileFn } {
  const req = getNodeRequire();
  return req("child_process") as { execFile: ExecFileFn };
}

export function getCodexRuntime(): {
  execFile: ExecFileFn;
  fs: typeof import("fs/promises");
  os: typeof import("os");
  path: typeof import("path");
} {
  const req = getNodeRequire();
  return {
    execFile: getChildProcess().execFile,
    fs: req("fs/promises") as typeof import("fs/promises"),
    os: req("os") as typeof import("os"),
    path: req("path") as typeof import("path"),
  };
}

export function getExecFileAsync(): ExecFileAsyncFn {
  const req = getNodeRequire();
  const { promisify } = req("util") as typeof import("util");
  return promisify(getChildProcess().execFile) as unknown as ExecFileAsyncFn;
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
