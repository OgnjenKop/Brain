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
