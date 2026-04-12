import { BrainPluginSettings } from "../settings/settings";
import { VaultService } from "./vault-service";
import {
  formatDateTimeKey,
  collapseWhitespace,
} from "../utils/date";

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
}
