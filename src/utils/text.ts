import { TFile } from "obsidian";
import { VaultService } from "../services/vault-service";
import type { InboxEntry } from "../services/inbox-service";
import { collapseWhitespace } from "./date";

export async function joinRecentFilesForSummary(
  vaultService: VaultService,
  files: TFile[],
  maxChars: number,
): Promise<string> {
  const parts: string[] = [];
  let total = 0;

  for (const file of files) {
    try {
      const content = await vaultService.readText(file.path);
      const trimmed = content.trim();
      if (!trimmed) {
        continue;
      }

      const block = [`--- ${file.path}`, trimmed].join("\n");
      if (total + block.length > maxChars) {
        const remaining = Math.max(0, maxChars - total);
        if (remaining > 0) {
          parts.push(block.slice(0, remaining));
        }
        break;
      }

      parts.push(block);
      total += block.length;
    } catch (error) {
      console.error(error);
    }
  }

  return parts.join("\n\n");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "note";
}

export function trimTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 60) {
    return trimmed;
  }
  return `${trimmed.slice(0, 57).trimEnd()}...`;
}

export function getAppendSeparator(text: string): string {
  if (!text.trim()) {
    return "";
  }
  if (text.endsWith("\n\n")) {
    return "";
  }
  if (text.endsWith("\n")) {
    return "\n";
  }
  return "\n\n";
}

export function stripLeadingTitle(content: string): string {
  const lines = content.trim().split("\n");
  if (!lines.length) {
    return "";
  }

  if (!/^#\s+/.test(lines[0])) {
    return content.trim();
  }

  const remaining = lines.slice(1);
  while (remaining.length > 0 && !remaining[0].trim()) {
    remaining.shift();
  }
  return remaining.join("\n").trim();
}

export function buildNoteTitle(entry: InboxEntry): string {
  const candidate = entry.preview || entry.body || entry.heading;
  const lines = candidate
    .split("\n")
    .map((line) => collapseWhitespace(line))
    .filter(Boolean);

  const first = lines[0] ?? "Untitled note";
  return trimTitle(first);
}
