import { App, PluginSettingTab, Setting } from "obsidian";
import BrainPlugin from "../../main";

export class BrainSettingTab extends PluginSettingTab {
  plugin: BrainPlugin;

  constructor(app: App, plugin: BrainPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Brain Settings" });

    containerEl.createEl("h3", { text: "Storage" });

    new Setting(containerEl)
      .setName("Inbox file")
      .setDesc("Markdown file used for quick note capture.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.inboxFile)
          .onChange(async (value) => {
            this.plugin.settings.inboxFile = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Tasks file")
      .setDesc("Markdown file used for quick task capture.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.tasksFile)
          .onChange(async (value) => {
            this.plugin.settings.tasksFile = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Journal folder")
      .setDesc("Folder containing daily journal files.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.journalFolder)
          .onChange(async (value) => {
            this.plugin.settings.journalFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Notes folder")
      .setDesc("Folder used for promoted notes.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.notesFolder)
          .onChange(async (value) => {
            this.plugin.settings.notesFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Summaries folder")
      .setDesc("Folder used for persisted summaries.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.summariesFolder)
          .onChange(async (value) => {
            this.plugin.settings.summariesFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Reviews folder")
      .setDesc("Folder used to store inbox review logs.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.reviewsFolder)
          .onChange(async (value) => {
            this.plugin.settings.reviewsFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("h3", { text: "AI" });

    new Setting(containerEl)
      .setName("Enable AI summaries")
      .setDesc("Use OpenAI for summaries when configured.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableAISummaries).onChange(async (value) => {
          this.plugin.settings.enableAISummaries = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Enable AI routing")
      .setDesc("Allow the sidebar to auto-route captures with AI.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableAIRouting).onChange(async (value) => {
          this.plugin.settings.enableAIRouting = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("OpenAI API key")
      .setDesc("Stored locally in plugin settings.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openAIApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openAIApiKey = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("OpenAI model")
      .setDesc("Model name used for summary and routing requests.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.openAIModel)
          .onChange(async (value) => {
            this.plugin.settings.openAIModel = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("h3", { text: "Summaries" });

    new Setting(containerEl)
      .setName("Lookback days")
      .setDesc("How far back to scan when building a summary.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.summaryLookbackDays))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.summaryLookbackDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Maximum characters")
      .setDesc("Maximum text collected before summarizing.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.summaryMaxChars))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.summaryMaxChars = Number.isFinite(parsed) && parsed >= 1000 ? parsed : 12000;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Persist summaries")
      .setDesc("Write generated summaries into the vault.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.persistSummaries).onChange(async (value) => {
          this.plugin.settings.persistSummaries = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
