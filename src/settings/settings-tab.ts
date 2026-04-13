import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";
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
        this.bindTextSetting(
          text,
          this.plugin.settings.inboxFile,
          (value) => {
            this.plugin.settings.inboxFile = value;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Tasks file")
      .setDesc("Markdown file used for quick task capture.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.tasksFile,
          (value) => {
            this.plugin.settings.tasksFile = value;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Journal folder")
      .setDesc("Folder containing daily journal files.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.journalFolder,
          (value) => {
            this.plugin.settings.journalFolder = value;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Notes folder")
      .setDesc("Folder used for promoted notes and generated markdown artifacts.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.notesFolder,
          (value) => {
            this.plugin.settings.notesFolder = value;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Summaries folder")
      .setDesc("Folder used for persisted summaries.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.summariesFolder,
          (value) => {
            this.plugin.settings.summariesFolder = value;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Reviews folder")
      .setDesc("Folder used to store inbox review logs.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.reviewsFolder,
          (value) => {
            this.plugin.settings.reviewsFolder = value;
          },
        ),
      );

    containerEl.createEl("h3", { text: "AI" });

    new Setting(containerEl)
      .setName("Enable AI synthesis")
      .setDesc("Use OpenAI for synthesis, question answering, and topic pages when configured.")
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
        text.setPlaceholder("sk-...");
        this.bindTextSetting(
          text,
          this.plugin.settings.openAIApiKey,
          (value) => {
            this.plugin.settings.openAIApiKey = value;
          },
        );
      });

    new Setting(containerEl)
      .setName("OpenAI model")
      .setDesc("Model name used for synthesis, questions, topic pages, and routing requests.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.openAIModel,
          (value) => {
            this.plugin.settings.openAIModel = value;
          },
        ),
      );

    containerEl.createEl("h3", { text: "Context Collection" });

    new Setting(containerEl)
      .setName("Lookback days")
      .setDesc("How far back to scan when building recent-context summaries.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          String(this.plugin.settings.summaryLookbackDays),
          (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.summaryLookbackDays =
              Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Maximum characters")
      .setDesc("Maximum text collected before synthesis or summary.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          String(this.plugin.settings.summaryMaxChars),
          (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.summaryMaxChars =
              Number.isFinite(parsed) && parsed >= 1000 ? parsed : 12000;
          },
        ),
      );

    containerEl.createEl("h3", { text: "Summary Output" });

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

  private bindTextSetting(
    text: TextComponent,
    value: string,
    onValueChange: (value: string) => void,
  ): TextComponent {
    let currentValue = value;
    let lastSavedValue = value;
    let isSaving = false;

    text.setValue(value).onChange((nextValue) => {
      currentValue = nextValue;
      onValueChange(nextValue);
    });
    this.queueSaveOnBlur(
      text.inputEl,
      () => currentValue,
      () => lastSavedValue,
      (savedValue) => {
        lastSavedValue = savedValue;
      },
      () => isSaving,
      (saving) => {
        isSaving = saving;
      },
    );
    return text;
  }

  private queueSaveOnBlur(
    input: HTMLInputElement,
    getCurrentValue: () => string,
    getLastSavedValue: () => string,
    setLastSavedValue: (value: string) => void,
    isSaving: () => boolean,
    setSaving: (saving: boolean) => void,
  ): void {
    input.addEventListener("blur", () => {
      void this.saveOnBlur(
        getCurrentValue,
        getLastSavedValue,
        setLastSavedValue,
        isSaving,
        setSaving,
      );
    });
    input.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        input.blur();
      }
    });
  }

  private async saveOnBlur(
    getCurrentValue: () => string,
    getLastSavedValue: () => string,
    setLastSavedValue: (value: string) => void,
    isSaving: () => boolean,
    setSaving: (saving: boolean) => void,
  ): Promise<void> {
    if (isSaving()) {
      return;
    }

    const currentValue = getCurrentValue();
    if (currentValue === getLastSavedValue()) {
      return;
    }

    setSaving(true);
    try {
      await this.plugin.saveSettings();
      setLastSavedValue(currentValue);
    } finally {
      setSaving(false);
    }
  }
}
