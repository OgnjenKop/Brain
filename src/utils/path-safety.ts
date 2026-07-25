import { BrainPluginSettings } from "../settings/settings";

/**
 * Normalizes a vault-relative path for comparison only.
 *
 * Vault paths are compared case-insensitively because Brain runs on
 * case-insensitive filesystems (macOS, Windows), where `brain/agents.md` and
 * `Brain/AGENTS.md` are the same file. Comparing the raw strings would let a
 * differently-cased path slip past the instructions-file guard.
 */
export function normalizeComparablePath(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

export function samePath(left: string, right: string): boolean {
  const normalized = normalizeComparablePath(left);
  return Boolean(normalized) && normalized === normalizeComparablePath(right);
}

/** True when `path` is inside `folder` (or is the folder itself). */
export function isInsideFolder(path: string, folder: string): boolean {
  const normalizedFolder = normalizeComparablePath(folder);
  if (!normalizedFolder) {
    return false;
  }
  const normalizedPath = normalizeComparablePath(path);
  return normalizedPath === normalizedFolder
    || normalizedPath.startsWith(`${normalizedFolder}/`);
}

export function isSafeMarkdownPath(
  path: string,
  settings?: Pick<BrainPluginSettings, "instructionsFile">,
): boolean {
  const segments = path.split("/").filter(Boolean);
  const isSafe =
    Boolean(path) &&
    path.endsWith(".md") &&
    !segments.includes("..") &&
    segments.every((segment) => !segment.startsWith("."));

  if (!isSafe) {
    return false;
  }

  if (settings && samePath(path, settings.instructionsFile)) {
    return false;
  }

  return true;
}
