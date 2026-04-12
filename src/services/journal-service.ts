import { BrainPluginSettings } from "../settings/settings";
import { collapseJournalText, formatDateKey, formatTimeKey } from "../utils/date";
import { VaultService } from "./vault-service";
import { TFile } from "obsidian";

export class JournalService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  getJournalPath(date = new Date()): string {
    const settings = this.settingsProvider();
    const dateKey = formatDateKey(date);
    return `${settings.journalFolder}/${dateKey}.md`;
  }

  async ensureJournalFile(date = new Date()): Promise<TFile> {
    const dateKey = formatDateKey(date);
    const path = this.getJournalPath(date);
    return this.vaultService.appendJournalHeader(path, dateKey);
  }

  async appendEntry(text: string, date = new Date()): Promise<{ path: string }> {
    const cleaned = collapseJournalText(text);
    if (!cleaned) {
      throw new Error("Journal text cannot be empty");
    }

    const file = await this.ensureJournalFile(date);
    const path = file.path;

    const block = `## ${formatTimeKey(date)}\n${cleaned}`;
    await this.vaultService.appendText(path, block);
    return { path };
  }
}
