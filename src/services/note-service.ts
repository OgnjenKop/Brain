import { BrainPluginSettings } from "../settings/settings";
import {
  collapseWhitespace,
  formatDateTimeKey,
  formatSummaryTimestamp,
} from "../utils/date";
import { slugify, trimTitle } from "../utils/text";
import { VaultService } from "./vault-service";
import { TFile } from "obsidian";

export class NoteService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async appendNote(text: string): Promise<{ path: string }> {
    const settings = this.settingsProvider();
    const cleaned = collapseWhitespace(text);
    if (!cleaned) {
      throw new Error("Note text cannot be empty");
    }

    const block = `## ${formatDateTimeKey(new Date())}\n- ${cleaned}`;
    await this.vaultService.appendText(settings.inboxFile, block);
    return { path: settings.inboxFile };
  }

  async createGeneratedNote(
    title: string,
    body: string,
    sourceLabel: string,
    sourcePath: string | null,
    sourcePaths?: string[],
  ): Promise<TFile> {
    const settings = this.settingsProvider();
    const now = new Date();
    const cleanedTitle = trimTitle(title);
    const fileName = `${formatSummaryTimestamp(now)}-${slugify(cleanedTitle)}.md`;
    const path = await this.vaultService.ensureUniqueFilePath(
      `${settings.notesFolder}/${fileName}`,
    );
    const sourceLine = sourcePaths && sourcePaths.length > 0
      ? `${sourceLabel} • ${sourcePaths.length} ${sourcePaths.length === 1 ? "file" : "files"}`
      : sourcePath
        ? `${sourceLabel} • ${sourcePath}`
        : sourceLabel;
    const sourceFileLines = sourcePaths && sourcePaths.length > 0
      ? [
          "Source files:",
          ...sourcePaths.slice(0, 12).map((source) => `- ${source}`),
          ...(sourcePaths.length > 12
            ? [`- ...and ${sourcePaths.length - 12} more`]
            : []),
        ]
      : [];
    const content = [
      `# ${cleanedTitle}`,
      "",
      `Created: ${formatDateTimeKey(now)}`,
      `Source: ${sourceLine}`,
      ...sourceFileLines,
      "",
      collapseWhitespace(body) ? body.trim() : "No artifact content returned.",
      "",
    ].join("\n");

    return await this.vaultService.replaceText(path, content);
  }
}


