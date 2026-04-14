import { BrainPluginSettings } from "../settings/settings";
import { formatDateKey, formatDateTimeKey } from "../utils/date";
import { VaultService } from "./vault-service";
import { InboxEntry, InboxEntryIdentity } from "./inbox-service";
import { TFile } from "obsidian";

export interface ReviewLogEntry extends InboxEntryIdentity {
  action: string;
  timestamp: string;
  sourcePath: string;
  fileMtime: number;
  entryIndex: number;
}

export class ReviewLogService {
  private readonly reviewEntryCountCache = new Map<string, {
    mtime: number;
    count: number;
  }>();
  private reviewLogFilesCache: {
    mtime: number;
    files: TFile[];
  } | null = null;
  private reviewEntryTotalCache: {
    listingMtime: number;
    total: number;
  } | null = null;

  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async appendReviewLog(entry: InboxEntryIdentity, action: string): Promise<{ path: string }> {
    const settings = this.settingsProvider();
    const now = new Date();
    const dateKey = formatDateKey(now);
    const path = `${settings.reviewsFolder}/${dateKey}.md`;
    const content = [
      `## ${formatDateTimeKey(now)}`,
      `- Action: ${action}`,
      `- Inbox: ${entry.heading}`,
      `- Preview: ${entry.preview || entry.body || "(empty)"}`,
      `- Signature: ${encodeReviewSignature(entry.signature)}`,
      `- Signature index: ${entry.signatureIndex}`,
      "",
    ].join("\n");

    await this.vaultService.appendText(path, content);
    this.reviewEntryCountCache.clear();
    this.reviewLogFilesCache = null;
    this.reviewEntryTotalCache = null;
    return { path };
  }

  async getReviewLogFiles(limit?: number): Promise<TFile[]> {
    const settings = this.settingsProvider();

    if (!this.reviewLogFilesCache) {
      const allFiles = await this.vaultService.listMarkdownFiles();
      const matching = allFiles
        .filter((file) => isUnderFolder(file.path, settings.reviewsFolder))
        .sort((left, right) => right.stat.mtime - left.stat.mtime);
      this.reviewLogFilesCache = {
        mtime: matching[0]?.stat.mtime ?? 0,
        files: matching,
      };
    }

    return typeof limit === "number"
      ? this.reviewLogFilesCache.files.slice(0, limit)
      : this.reviewLogFilesCache.files;
  }

  async getReviewEntries(limit?: number): Promise<ReviewLogEntry[]> {
    const logs = await this.getReviewLogFiles(limit);
    const entries: ReviewLogEntry[] = [];

    for (const file of logs) {
      const content = await this.vaultService.readText(file.path);
      const parsed = parseReviewLogEntries(content, file.path, file.stat.mtime);
      entries.push(...parsed.reverse());
      if (typeof limit === "number" && entries.length >= limit) {
        break;
      }
    }

    return typeof limit === "number" ? entries.slice(0, limit) : entries;
  }

  async getReviewEntryCount(): Promise<number> {
    const logs = await this.getReviewLogFiles();
    if (logs.length === 0) {
      this.reviewEntryTotalCache = { listingMtime: 0, total: 0 };
      return 0;
    }

    const listingMtime = logs[0].stat.mtime;
    if (this.reviewEntryTotalCache?.listingMtime === listingMtime) {
      return this.reviewEntryTotalCache.total;
    }

    const seenPaths = new Set<string>();
    let total = 0;

    const uncachedFiles = logs.filter((file) => {
      const cached = this.reviewEntryCountCache.get(file.path);
      return !(cached && cached.mtime === file.stat.mtime);
    });

    const cachedFiles = logs.filter((file) => {
      const cached = this.reviewEntryCountCache.get(file.path);
      return cached && cached.mtime === file.stat.mtime;
    });

    for (const file of cachedFiles) {
      seenPaths.add(file.path);
      total += this.reviewEntryCountCache.get(file.path)!.count;
    }

    if (uncachedFiles.length > 0) {
      const results = await Promise.all(
        uncachedFiles.map(async (file) => {
          const content = await this.vaultService.readText(file.path);
          const count = parseReviewLogEntries(content, file.path, file.stat.mtime).length;
          this.reviewEntryCountCache.set(file.path, {
            mtime: file.stat.mtime,
            count,
          });
          return { file, count };
        }),
      );

      for (const { file, count } of results) {
        seenPaths.add(file.path);
        total += count;
      }
    }

    for (const path of this.reviewEntryCountCache.keys()) {
      if (!seenPaths.has(path)) {
        this.reviewEntryCountCache.delete(path);
      }
    }

    this.reviewEntryTotalCache = { listingMtime, total };
    return total;
  }
}

export function parseReviewLogEntries(
  content: string,
  sourcePath: string,
  fileMtime: number,
): ReviewLogEntry[] {
  const lines = content.split("\n");
  const entries: ReviewLogEntry[] = [];
  let currentTimestamp = "";
  let currentAction = "";
  let currentHeading = "";
  let currentPreview = "";
  let currentSignature = "";
  let currentSignatureIndex = 0;
  let currentEntryIndex = 0;

  const pushEntry = (): void => {
    if (!currentTimestamp) {
      return;
    }

    entries.push({
      action: currentAction || "unknown",
      heading: currentHeading,
      preview: currentPreview,
      body: "",
      signature: currentSignature,
      signatureIndex: currentSignatureIndex,
      timestamp: currentTimestamp,
      sourcePath,
      fileMtime,
      entryIndex: currentEntryIndex,
    });
    currentTimestamp = "";
    currentAction = "";
    currentHeading = "";
    currentPreview = "";
    currentSignature = "";
    currentSignatureIndex = 0;
    currentEntryIndex += 1;
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      pushEntry();
      currentTimestamp = headingMatch[1].trim();
      continue;
    }

    const actionMatch = line.match(/^-\s+Action:\s+(.+)$/i);
    if (actionMatch) {
      currentAction = actionMatch[1].trim();
      continue;
    }

    const inboxMatch = line.match(/^-\s+Inbox:\s+(.+)$/i);
    if (inboxMatch) {
      currentHeading = inboxMatch[1].trim();
      continue;
    }

    const previewMatch = line.match(/^-\s+Preview:\s+(.+)$/i);
    if (previewMatch) {
      currentPreview = previewMatch[1].trim();
      continue;
    }

    const signatureMatch = line.match(/^-\s+Signature:\s+(.+)$/i);
    if (signatureMatch) {
      currentSignature = decodeReviewSignature(signatureMatch[1].trim());
      continue;
    }

    const signatureIndexMatch = line.match(/^-\s+Signature index:\s+(.+)$/i);
    if (signatureIndexMatch) {
      const parsed = Number.parseInt(signatureIndexMatch[1], 10);
      currentSignatureIndex = Number.isFinite(parsed) ? parsed : 0;
    }
  }

  pushEntry();
  return entries;
}

function isUnderFolder(path: string, folder: string): boolean {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
}

function encodeReviewSignature(signature: string): string {
  return encodeURIComponent(signature);
}

function decodeReviewSignature(signature: string): string {
  try {
    return decodeURIComponent(signature);
  } catch {
    return signature;
  }
}
