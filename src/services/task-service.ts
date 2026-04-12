import { BrainPluginSettings } from "../settings/settings";
import { collapseWhitespace, formatDateTimeKey } from "../utils/date";
import { VaultService } from "./vault-service";

export class TaskService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async appendTask(text: string): Promise<{ path: string }> {
    const settings = this.settingsProvider();
    const cleaned = collapseWhitespace(text);
    if (!cleaned) {
      throw new Error("Task text cannot be empty");
    }

    const block = `- [ ] ${cleaned} _(added ${formatDateTimeKey(new Date())})_`;
    await this.vaultService.appendText(settings.tasksFile, block);
    return { path: settings.tasksFile };
  }
}
