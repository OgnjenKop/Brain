import { BrainPluginSettings } from "../settings/settings";
import { collapseWhitespace, formatDateTimeKey } from "../utils/date";

export interface TaskVaultService {
  appendText(filePath: string, content: string): Promise<unknown>;
  readTextWithMtime(filePath: string): Promise<{
    text: string;
    mtime: number;
    exists: boolean;
  }>;
}

export class TaskService {
  private openTaskCountCache: {
    mtime: number;
    count: number;
  } | null = null;

  constructor(
    private readonly vaultService: TaskVaultService,
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
    this.openTaskCountCache = null;
    return { path: settings.tasksFile };
  }

  async getOpenTaskCount(): Promise<number> {
    const settings = this.settingsProvider();
    const { text, mtime, exists } = await this.vaultService.readTextWithMtime(settings.tasksFile);
    if (!exists) {
      this.openTaskCountCache = {
        mtime: 0,
        count: 0,
      };
      return 0;
    }

    if (this.openTaskCountCache && this.openTaskCountCache.mtime === mtime) {
      return this.openTaskCountCache.count;
    }

    const count = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^- \[( |x|X)\]/.test(line))
      .filter((line) => !/^- \[(x|X)\]/.test(line))
      .length;
    this.openTaskCountCache = {
      mtime,
      count,
    };
    return count;
  }
}
