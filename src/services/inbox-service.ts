import { BrainPluginSettings } from "../settings/settings";
import { formatDateTimeKey } from "../utils/date";

export interface InboxVaultService {
  readText(filePath: string): Promise<string>;
  readTextWithMtime(filePath: string): Promise<{
    text: string;
    mtime: number;
    exists: boolean;
  }>;
  replaceText(filePath: string, content: string): Promise<unknown>;
}

export interface InboxEntry {
  heading: string;
  body: string;
  raw: string;
  preview: string;
  index: number;
  signature: string;
  signatureIndex: number;
  startLine: number;
  endLine: number;
  reviewed: boolean;
  reviewAction: string | null;
  reviewedAt: string | null;
}

export type InboxEntryIdentity = Pick<
  InboxEntry,
  "heading" | "body" | "preview" | "signature" | "signatureIndex"
> &
  Partial<Pick<InboxEntry, "raw" | "startLine" | "endLine">>;

export class InboxService {
  private unreviewedCountCache: {
    mtime: number;
    count: number;
  } | null = null;

  constructor(
    private readonly vaultService: InboxVaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async getRecentEntries(limit = 20, includeReviewed = false): Promise<InboxEntry[]> {
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const entries = parseInboxEntries(content);
    const filtered = includeReviewed ? entries : entries.filter((entry) => !entry.reviewed);
    return filtered.slice(-limit).reverse();
  }

  async getUnreviewedCount(): Promise<number> {
    const settings = this.settingsProvider();
    const { text, mtime, exists } = await this.vaultService.readTextWithMtime(settings.inboxFile);
    if (!exists) {
      this.unreviewedCountCache = {
        mtime: 0,
        count: 0,
      };
      return 0;
    }

    if (this.unreviewedCountCache && this.unreviewedCountCache.mtime === mtime) {
      return this.unreviewedCountCache.count;
    }

    const count = parseInboxEntries(text).filter((entry) => !entry.reviewed).length;
    this.unreviewedCountCache = {
      mtime,
      count,
    };
    return count;
  }

  async markEntryReviewed(entry: InboxEntryIdentity, action: string): Promise<boolean> {
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const currentEntries = parseInboxEntries(content);
    const currentEntry =
      currentEntries.find(
        (candidate) =>
          !candidate.reviewed &&
          candidate.signature === entry.signature &&
          candidate.signatureIndex === entry.signatureIndex,
      ) ??
      currentEntries.find((candidate) => !candidate.reviewed && candidate.raw === entry.raw) ??
      currentEntries.find(
        (candidate) =>
          !candidate.reviewed &&
          candidate.heading === entry.heading &&
          candidate.body === entry.body &&
          candidate.preview === entry.preview,
      ) ??
      currentEntries.find(
        (candidate) =>
          !candidate.reviewed &&
          candidate.heading === entry.heading &&
          candidate.startLine === entry.startLine,
      );

    if (!currentEntry) {
      return false;
    }

    const updated = insertReviewMarker(content, currentEntry, action);
    if (updated === content) {
      return false;
    }
    await this.vaultService.replaceText(settings.inboxFile, updated);
    this.unreviewedCountCache = null;
    return true;
  }

  async reopenEntry(entry: InboxEntryIdentity): Promise<boolean> {
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const currentEntries = parseInboxEntries(content);
    const currentEntry =
      currentEntries.find(
        (candidate) =>
          candidate.reviewed &&
          candidate.signature === entry.signature &&
          candidate.signatureIndex === entry.signatureIndex,
      ) ??
      findUniqueReviewedSignatureMatch(currentEntries, entry.signature) ??
      currentEntries.find(
        (candidate) =>
          candidate.reviewed &&
          candidate.heading === entry.heading &&
          candidate.body === entry.body &&
          candidate.preview === entry.preview,
      );

    if (!currentEntry) {
      return false;
    }

    const updated = removeReviewMarker(content, currentEntry);
    if (updated === content) {
      return false;
    }
    await this.vaultService.replaceText(settings.inboxFile, updated);
    this.unreviewedCountCache = null;
    return true;
  }
}

export function parseInboxEntries(content: string): InboxEntry[] {
  const lines = content.split("\n");
  const entries: InboxEntry[] = [];
  let currentHeading = "";
  let currentBodyLines: string[] = [];
  let currentStartLine = -1;
  let currentReviewed = false;
  let currentReviewAction: string | null = null;
  let currentReviewedAt: string | null = null;
  const signatureCounts = new Map<string, number>();

  const pushEntry = (endLine: number): void => {
    if (!currentHeading) {
      currentBodyLines = [];
      return;
    }

    const body = currentBodyLines.join("\n").trim();
    const preview = buildPreview(body);
    const raw = [currentHeading, ...currentBodyLines].join("\n").trimEnd();
    const signature = buildEntrySignature(currentHeading, currentBodyLines);
    const signatureIndex = signatureCounts.get(signature) ?? 0;
    signatureCounts.set(signature, signatureIndex + 1);
    entries.push({
      heading: currentHeading.replace(/^##\s+/, "").trim(),
      body,
      raw,
      preview,
      index: entries.length,
      signature,
      signatureIndex,
      startLine: currentStartLine,
      endLine,
      reviewed: currentReviewed,
      reviewAction: currentReviewAction,
      reviewedAt: currentReviewedAt,
    });
    currentBodyLines = [];
    currentStartLine = -1;
    currentReviewed = false;
    currentReviewAction = null;
    currentReviewedAt = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      pushEntry(index);
      currentHeading = line;
      currentStartLine = index;
      continue;
    }

    if (!currentHeading) {
      continue;
    }

    const reviewMatch = line.match(/^<!--\s*brain-reviewed:\s*([a-z]+)(?:\s+(.+?))?\s*-->$/i);
    if (reviewMatch) {
      currentReviewed = true;
      currentReviewAction = reviewMatch[1].toLowerCase();
      currentReviewedAt = reviewMatch[2] ?? null;
      continue;
    }

    currentBodyLines.push(line);
  }

  pushEntry(lines.length);
  return entries;
}

function insertReviewMarker(content: string, entry: InboxEntry, action: string): string {
  const lines = content.split("\n");
  if (entry.startLine < 0 || entry.endLine < entry.startLine || entry.endLine > lines.length) {
    return content;
  }

  const timestamp = formatDateTimeKey(new Date());
  const marker = `<!-- brain-reviewed: ${action} ${timestamp} -->`;
  const entryLines = lines.slice(entry.startLine, entry.endLine);
  const cleanedEntryLines = trimTrailingBlankLines(
    entryLines.filter((line) => !line.match(/^<!--\s*brain-reviewed:/i)),
  );
  cleanedEntryLines.push(marker, "");

  const updatedLines = [
    ...lines.slice(0, entry.startLine),
    ...cleanedEntryLines,
    ...lines.slice(entry.endLine),
  ];

  return trimTrailingBlankLines(updatedLines).join("\n");
}

function removeReviewMarker(content: string, entry: InboxEntry): string {
  const lines = content.split("\n");
  if (entry.startLine < 0 || entry.endLine < entry.startLine || entry.endLine > lines.length) {
    return content;
  }

  const entryLines = lines.slice(entry.startLine, entry.endLine);
  const cleanedEntryLines = trimTrailingBlankLines(
    entryLines.filter((line) => !line.match(/^<!--\s*brain-reviewed:/i)),
  );

  const updatedLines = [
    ...lines.slice(0, entry.startLine),
    ...cleanedEntryLines,
    ...lines.slice(entry.endLine),
  ];

  return trimTrailingBlankLines(updatedLines).join("\n");
}

function buildPreview(body: string): string {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[0] ?? "";
}

function buildEntrySignature(heading: string, bodyLines: string[]): string {
  return [heading.trim(), ...bodyLines.map((line) => line.trim())].join("\n");
}

function trimTrailingBlankLines(lines: string[]): string[] {
  const clone = [...lines];
  while (clone.length > 0 && clone[clone.length - 1].trim() === "") {
    clone.pop();
  }
  return clone;
}

function findUniqueReviewedSignatureMatch(
  entries: InboxEntry[],
  signature: string,
): InboxEntry | null {
  const reviewedMatches = entries.filter(
    (entry) => entry.reviewed && entry.signature === signature,
  );
  if (reviewedMatches.length !== 1) {
    return null;
  }
  return reviewedMatches[0];
}
