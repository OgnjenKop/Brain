import { App, MarkdownView } from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { VaultService } from "./vault-service";
import { joinRecentFilesForSummary } from "../utils/text";
import { isUnderFolder } from "../utils/path";
import { TFile } from "obsidian";

export interface SynthesisContext {
  sourceLabel: string;
  sourcePath: string | null;
  sourcePaths?: string[];
  text: string;
  originalLength: number;
  truncated: boolean;
  maxChars: number;
}

export class ContextService {
  constructor(
    private readonly app: App,
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async getCurrentNoteContext(): Promise<SynthesisContext> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      throw new Error("Open a markdown note first");
    }

    const text = view.editor.getValue();
    if (!text.trim()) {
      throw new Error("Current note is empty");
    }

    return this.buildContext("Current note", view.file.path, text);
  }

  async getSelectedTextContext(): Promise<SynthesisContext> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      throw new Error("Open a markdown note first");
    }

    const text = view.editor.getSelection();
    if (!text.trim()) {
      throw new Error("Select some text first");
    }

    return this.buildContext("Selected text", view.file.path, text);
  }

  async getRecentFilesContext(): Promise<SynthesisContext> {
    const settings = this.settingsProvider();
    const files = await this.collectRecentMarkdownFiles(settings.summaryLookbackDays);
    return this.buildFileGroupContext("Recent files", files, null);
  }

  async getCurrentFolderContext(): Promise<SynthesisContext> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      throw new Error("Open a markdown note first");
    }

    const folderPath = view.file.parent?.path ?? "";
    const files = await this.collectFilesInFolder(folderPath);
    return this.buildFileGroupContext("Current folder", files, folderPath || null);
  }

  async getSelectedFilesContext(files: TFile[]): Promise<SynthesisContext> {
    if (!files.length) {
      throw new Error("Select at least one markdown note");
    }

    return this.buildFileGroupContext("Selected notes", files, null);
  }

  async getVaultContext(): Promise<SynthesisContext> {
    const files = await this.collectVaultMarkdownFiles();
    return this.buildFileGroupContext("Entire vault", files, null);
  }

  private buildContext(
    sourceLabel: string,
    sourcePath: string | null,
    text: string,
    sourcePaths?: string[],
  ): SynthesisContext {
    const settings = this.settingsProvider();
    const maxChars = Math.max(1000, settings.summaryMaxChars);
    const trimmed = text.trim();
    const originalLength = trimmed.length;
    const truncated = originalLength > maxChars;
    const limited = truncated ? trimmed.slice(0, maxChars).trimEnd() : trimmed;

    return {
      sourceLabel,
      sourcePath,
      sourcePaths,
      text: limited,
      originalLength,
      truncated,
      maxChars,
    };
  }

  private async buildFileGroupContext(
    sourceLabel: string,
    files: TFile[],
    sourcePath: string | null,
  ): Promise<SynthesisContext> {
    if (!files.length) {
      throw new Error(`No markdown files found for ${sourceLabel.toLowerCase()}`);
    }

    const settings = this.settingsProvider();
    const text = await joinRecentFilesForSummary(
      this.vaultService,
      files,
      settings.summaryMaxChars,
    );

    if (!text.trim()) {
      throw new Error(`No markdown files found for ${sourceLabel.toLowerCase()}`);
    }

    return this.buildContext(sourceLabel, sourcePath, text, files.map((file) => file.path));
  }

  private async collectRecentMarkdownFiles(lookbackDays: number): Promise<TFile[]> {
    const cutoff = getWindowStart(lookbackDays).getTime();
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    return files
      .filter((file) => !isUnderFolder(file.path, settings.summariesFolder))
      .filter((file) => !isUnderFolder(file.path, settings.reviewsFolder))
      .filter((file) => file.stat.mtime >= cutoff)
      .sort((left, right) => right.stat.mtime - left.stat.mtime);
  }

  private async collectVaultMarkdownFiles(): Promise<TFile[]> {
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    return files
      .filter((file) => !isUnderFolder(file.path, settings.summariesFolder))
      .filter((file) => !isUnderFolder(file.path, settings.reviewsFolder))
      .sort((left, right) => right.stat.mtime - left.stat.mtime);
  }

  private async collectFilesInFolder(folderPath: string): Promise<TFile[]> {
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    return files
      .filter((file) => !isUnderFolder(file.path, settings.summariesFolder))
      .filter((file) => !isUnderFolder(file.path, settings.reviewsFolder))
      .filter((file) =>
        folderPath ? isUnderFolder(file.path, folderPath) : !file.path.includes("/"),
      )
      .sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
}

function getWindowStart(lookbackDays: number): Date {
  const safeDays = Math.max(1, lookbackDays);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));
  return start;
}
