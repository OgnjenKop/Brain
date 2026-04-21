import type { BrainPluginSettings } from "../settings/settings";

/**
 * Path utility functions
 */

/**
 * Check if a path is under a specific folder (or is the folder itself).
 * Handles trailing slashes consistently.
 */
export function isUnderFolder(path: string, folder: string): boolean {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
}

/**
 * Check if a path is a Brain-generated file (summaries, reviews, notes,
 * inbox, or tasks). Used to exclude generated content from synthesis
 * and context aggregation.
 */
export function isBrainGeneratedPath(
  path: string,
  settings: BrainPluginSettings,
): boolean {
  return (
    isUnderFolder(path, settings.summariesFolder) ||
    isUnderFolder(path, settings.reviewsFolder) ||
    isUnderFolder(path, settings.notesFolder) ||
    path === settings.inboxFile ||
    path === settings.tasksFile
  );
}
