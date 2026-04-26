import { BrainPluginSettings } from "../settings/settings";

export function isSafeMarkdownPath(
  path: string,
  settings?: Pick<BrainPluginSettings, "instructionsFile">,
): boolean {
  const segments = path.split("/").filter(Boolean);
  const isSafe =
    Boolean(path) &&
    path.endsWith(".md") &&
    !path.includes("..") &&
    segments.every((segment) => !segment.startsWith("."));

  if (!isSafe) {
    return false;
  }

  if (settings && path === settings.instructionsFile) {
    return false;
  }

  return true;
}
