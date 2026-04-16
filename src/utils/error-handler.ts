import { Notice } from "obsidian";

/**
 * Centralized error handling utility
 * Standardizes error reporting across the plugin
 */

export function showError(error: unknown, defaultMessage: string): void {
  console.error(error);
  const message = error instanceof Error ? error.message : defaultMessage;
  new Notice(message);
}

export function showErrorAndRethrow(error: unknown, defaultMessage: string): never {
  showError(error, defaultMessage);
  throw error instanceof Error ? error : new Error(defaultMessage);
}
