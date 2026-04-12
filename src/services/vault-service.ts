import {
  App,
  TAbstractFile,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { formatDateKey } from "../utils/date";

export class VaultService {
  constructor(private readonly app: App) {}

  async ensureKnownFolders(settings: BrainPluginSettings): Promise<void> {
    await this.ensureFolder(settings.journalFolder);
    await this.ensureFolder(settings.notesFolder);
    await this.ensureFolder(settings.summariesFolder);
    await this.ensureFolder(settings.reviewsFolder);
    await this.ensureFolder(parentFolder(settings.inboxFile));
    await this.ensureFolder(parentFolder(settings.tasksFile));
  }

  async ensureFolder(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath).replace(/\/+$/, "");
    if (!normalized) {
      return;
    }

    const segments = normalized.split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (!existing) {
        await this.app.vault.createFolder(current);
      } else if (!(existing instanceof TFolder)) {
        throw new Error(`Path exists but is not a folder: ${current}`);
      }
    }
  }

  async ensureFile(filePath: string, initialContent = ""): Promise<TFile> {
    const normalized = normalizePath(filePath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof TFile) {
      return existing;
    }
    if (existing) {
      throw new Error(`Path exists but is not a file: ${normalized}`);
    }

    await this.ensureFolder(parentFolder(normalized));
    return this.app.vault.create(normalized, initialContent);
  }

  async readText(filePath: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(normalizePath(filePath));
    if (!(file instanceof TFile)) {
      return "";
    }
    return this.app.vault.read(file);
  }

  async appendText(filePath: string, content: string): Promise<TFile> {
    const file = await this.ensureFile(filePath);
    const current = await this.app.vault.read(file);
    const normalizedContent = content.endsWith("\n") ? content : `${content}\n`;
    const separator = current.length === 0
      ? ""
      : current.endsWith("\n\n")
        ? ""
        : current.endsWith("\n")
          ? "\n"
          : "\n\n";
    await this.app.vault.modify(file, `${current}${separator}${normalizedContent}`);
    return file;
  }

  async replaceText(filePath: string, content: string): Promise<TFile> {
    const file = await this.ensureFile(filePath);
    const normalizedContent = content.endsWith("\n") ? content : `${content}\n`;
    await this.app.vault.modify(file, normalizedContent);
    return file;
  }

  async ensureUniqueFilePath(filePath: string): Promise<string> {
    const normalized = normalizePath(filePath);
    if (!this.app.vault.getAbstractFileByPath(normalized)) {
      return normalized;
    }

    const dotIndex = normalized.lastIndexOf(".");
    const base = dotIndex === -1 ? normalized : normalized.slice(0, dotIndex);
    const extension = dotIndex === -1 ? "" : normalized.slice(dotIndex);

    let counter = 2;
    while (true) {
      const candidate = `${base}-${counter}${extension}`;
      if (!this.app.vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
      counter += 1;
    }
  }

  async appendJournalHeader(filePath: string, dateKey: string): Promise<TFile> {
    const file = await this.ensureFile(filePath, `# ${dateKey}\n\n`);
    const text = await this.app.vault.read(file);
    if (!text.trim()) {
      await this.app.vault.modify(file, `# ${dateKey}\n\n`);
    }
    return file;
  }

  async listMarkdownFiles(): Promise<TFile[]> {
    return this.app.vault.getMarkdownFiles();
  }
}

function parentFolder(filePath: string): string {
  const normalized = normalizePath(filePath);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}
