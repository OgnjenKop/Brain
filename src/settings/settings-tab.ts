import { App, Notice, PluginSettingTab, Setting, TextComponent } from "obsidian";
import BrainPlugin from "../../main";
import { getAIConfigurationStatus } from "../utils/ai-config";
import {
  CUSTOM_CODEX_MODEL_VALUE,
  DEFAULT_CODEX_MODEL_OPTIONS,
  CodexModelOption,
  getCodexModelDropdownValue,
  getSupportedCodexModelOptions,
  isKnownCodexModel,
} from "../utils/codex-models";

export class BrainSettingTab extends PluginSettingTab {
  plugin: BrainPlugin;
  private modelOptions: CodexModelOption[] = DEFAULT_CODEX_MODEL_OPTIONS;
  private modelOptionsLoading = false;
  private modelOptionsLoaded = false;
  private customModelDraft = false;

  constructor(app: App, plugin: BrainPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Brain Settings" });
    if (!this.modelOptionsLoading && !this.modelOptionsLoaded) {
      void this.refreshModelOptions();
    }

    containerEl.createEl("h3", { text: "Storage" });

    new Setting(containerEl)
      .setName("Notes folder")
      .setDesc("Default folder for new markdown notes created from approved write plans.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.notesFolder,
          (value) => {
            this.plugin.settings.notesFolder = value;
          },
          (value) => {
            if (!value.trim()) {
              new Notice("Notes folder cannot be empty");
              return false;
            }
            return true;
          },
        ),
      );

    new Setting(containerEl)
      .setName("Instructions file")
      .setDesc("Markdown file that tells Brain how to operate in this vault.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.instructionsFile,
          (value) => {
            this.plugin.settings.instructionsFile = value;
          },
          (value) => {
            if (!value.trim()) {
              new Notice("Instructions file cannot be empty");
              return false;
            }
            return true;
          },
        ),
      );

    containerEl.createEl("h3", { text: "Codex CLI" });

    this.createCodexStatusSetting(containerEl);

    new Setting(containerEl)
      .setName("Codex setup")
      .setDesc(
        "Brain uses only the local Codex CLI. Install `@openai/codex`, run `codex login`, then recheck status.",
      )
      .addButton((button) =>
        button
          .setButtonText("Open Codex Setup")
          .setCta()
          .onClick(async () => {
            await this.plugin.authService.login();
          }),
      )
      .addButton((button) =>
        button
          .setButtonText("Recheck Status")
          .onClick(() => {
            this.display();
          }),
      );

    const modelSetting = new Setting(containerEl)
      .setName("Codex model")
      .setDesc(
        this.modelOptionsLoading
          ? "Loading models from the installed Codex CLI..."
          : "Optional. Select a model reported by Codex CLI, or leave blank to use the account default.",
      )
      .addDropdown((dropdown) => {
        for (const option of this.modelOptions) {
          dropdown.addOption(option.value, option.label);
        }
        dropdown
          .addOption(CUSTOM_CODEX_MODEL_VALUE, "Custom...")
          .setValue(
            this.customModelDraft
              ? CUSTOM_CODEX_MODEL_VALUE
              : getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions),
          )
          .onChange(async (value) => {
            if (value === CUSTOM_CODEX_MODEL_VALUE) {
              this.customModelDraft = true;
              this.display();
              return;
            }
            this.customModelDraft = false;
            this.plugin.settings.codexModel = value;
            await this.plugin.saveSettings();
            this.display();
          });
      });
    modelSetting.addButton((button) =>
      button
        .setButtonText("Reload")
        .onClick(() => {
          void this.refreshModelOptions();
        }),
    );

    if (
      this.customModelDraft ||
      getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions) === CUSTOM_CODEX_MODEL_VALUE
    ) {
      let draftValue = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions)
        ? ""
        : this.plugin.settings.codexModel;
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        new Setting(containerEl)
          .setName("Active Codex model")
          .setDesc(this.plugin.settings.codexModel.trim());
      }
      new Setting(containerEl)
        .setName("Custom Codex model")
        .setDesc("Exact model id passed to `codex exec --model`.")
        .addText((text) => {
          text
            .setValue(draftValue)
            .onChange((value) => {
              draftValue = value;
            });
          text.inputEl.addEventListener("blur", () => {
            void this.saveCustomModelDraft(draftValue);
          });
          text.inputEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              text.inputEl.blur();
            }
          });
        });
    }
  }

  private async refreshModelOptions(): Promise<void> {
    this.modelOptionsLoading = true;
    this.display();
    try {
      this.modelOptions = await getSupportedCodexModelOptions();
    } finally {
      this.modelOptionsLoaded = true;
      this.modelOptionsLoading = false;
      this.display();
    }
  }

  private async saveCustomModelDraft(value: string): Promise<void> {
    const model = value.trim();
    if (!model) {
      this.customModelDraft = false;
      this.display();
      return;
    }
    this.customModelDraft = false;
    this.plugin.settings.codexModel = model;
    await this.plugin.saveSettings();
    this.display();
  }

  private createCodexStatusSetting(containerEl: HTMLElement): void {
    const statusSetting = new Setting(containerEl)
      .setName("Codex status")
      .setDesc("Checking Codex CLI status...");
    void this.refreshCodexStatus(statusSetting);
  }

  private async refreshCodexStatus(setting: Setting): Promise<void> {
    try {
      const status = await getAIConfigurationStatus(this.plugin.settings);
      setting.setDesc(status.message);
    } catch (error) {
      console.error(error);
      setting.setDesc("Could not check Codex CLI status.");
    }
  }

  private bindTextSetting(
    text: TextComponent,
    value: string,
    onValueChange: (value: string) => void,
    validate?: (value: string) => boolean,
  ): TextComponent {
    let currentValue = value;
    let lastSavedValue = value;
    let isSaving = false;

    text.setValue(value).onChange((nextValue) => {
      currentValue = nextValue;
      if (!validate || validate(nextValue)) {
        onValueChange(nextValue);
      }
    });
    this.queueSaveOnBlur(
      text.inputEl,
      () => currentValue,
      () => lastSavedValue,
      (savedValue) => {
        currentValue = savedValue;
        lastSavedValue = savedValue;
      },
      () => isSaving,
      (saving) => {
        isSaving = saving;
      },
      validate,
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
    validate?: (value: string) => boolean,
  ): void {
    input.addEventListener("blur", () => {
      void this.saveOnBlur(
        input,
        getCurrentValue,
        getLastSavedValue,
        setLastSavedValue,
        isSaving,
        setSaving,
        validate,
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
    input: HTMLInputElement,
    getCurrentValue: () => string,
    getLastSavedValue: () => string,
    setLastSavedValue: (value: string) => void,
    isSaving: () => boolean,
    setSaving: (saving: boolean) => void,
    validate?: (value: string) => boolean,
  ): Promise<void> {
    if (isSaving()) {
      return;
    }

    const currentValue = getCurrentValue();
    if (currentValue === getLastSavedValue()) {
      return;
    }

    if (validate && !validate(currentValue)) {
      const lastSavedValue = getLastSavedValue();
      input.value = lastSavedValue;
      setLastSavedValue(lastSavedValue);
      return;
    }

    setSaving(true);
    try {
      await this.plugin.saveSettings();
      const savedValue = input.value;
      setLastSavedValue(savedValue);
    } finally {
      setSaving(false);
    }
  }
}
