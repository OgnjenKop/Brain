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

const MODEL_SECTION_CLASS = "brain-settings-model-section";

export class BrainSettingTab extends PluginSettingTab {
  plugin: BrainPlugin;
  private modelOptions: CodexModelOption[] = DEFAULT_CODEX_MODEL_OPTIONS;
  private modelOptionsLoading = false;
  private modelOptionsLoaded = false;
  private customModelDraft = false;
  private modelSectionEl: HTMLElement | null = null;
  private statusSetting: Setting | null = null;

  constructor(app: App, plugin: BrainPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("brain-settings");
    containerEl.createEl("h2", { text: "Brain Settings" });

    this.renderStorageSection(containerEl);

    containerEl.createEl("h3", { text: "Codex CLI" });

    this.renderCodexSetupSection(containerEl);
    this.renderStatusSection(containerEl);
    this.renderModelSection(containerEl);

    if (!this.modelOptionsLoading && !this.modelOptionsLoaded) {
      void this.refreshModelOptions();
    } else {
      this.updateModelControlsState();
    }
  }

  private renderStorageSection(containerEl: HTMLElement): void {
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

    new Setting(containerEl)
      .setName("Excluded folders")
      .setDesc("One folder path per line. Brain will skip markdown files inside these folders when searching the vault.")
      .addTextArea((text) => {
        text.setValue(this.plugin.settings.excludeFolders).onChange((value) => {
          this.plugin.settings.excludeFolders = value;
        });
        text.inputEl.addEventListener("blur", () => {
          void this.plugin.saveSettings();
        });
      });
  }

  private renderStatusSection(containerEl: HTMLElement): void {
    this.statusSetting = new Setting(containerEl)
      .setName("Codex status")
      .setDesc("Checking Codex CLI status...");
    void this.refreshCodexStatus(this.statusSetting);
  }

  private renderCodexSetupSection(containerEl: HTMLElement): void {
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
          .onClick(async () => {
            this.statusSetting?.setDesc("Rechecking Codex CLI status...");
            await this.refreshCodexStatus(this.statusSetting, true);
            this.updateModelControlsState();
          }),
      );
  }

  private renderModelSection(containerEl: HTMLElement): void {
    const wrapper = containerEl.createDiv({ cls: MODEL_SECTION_CLASS });
    this.modelSectionEl = wrapper;
    new Setting(wrapper)
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
              this.refreshModelSection();
              return;
            }
            this.customModelDraft = false;
            this.plugin.settings.codexModel = value;
            await this.plugin.saveSettings();
            this.refreshModelSection();
            this.updateStatusFromSettings();
          });
      })
      .addButton((button) => {
        button.setButtonText("Reload");
        button.onClick(() => {
          void this.refreshModelOptions();
        });
      });

    if (
      this.customModelDraft ||
      getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions) === CUSTOM_CODEX_MODEL_VALUE
    ) {
      let draftValue = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions)
        ? ""
        : this.plugin.settings.codexModel;
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        new Setting(wrapper)
          .setName("Active Codex model")
          .setDesc(this.plugin.settings.codexModel.trim());
      }
      new Setting(wrapper)
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

    this.updateModelControlsState();
  }

  private updateModelControlsState(): void {
    if (!this.modelSectionEl) {
      return;
    }
    const disabled = this.modelOptionsLoading;
    this.modelSectionEl
      .querySelectorAll<HTMLSelectElement | HTMLButtonElement>("select, button")
      .forEach((el) => {
        el.disabled = disabled;
      });
  }

  private async refreshModelOptions(): Promise<void> {
    this.modelOptionsLoading = true;
    this.refreshModelSection();
    try {
      this.modelOptions = await getSupportedCodexModelOptions();
    } finally {
      this.modelOptionsLoaded = true;
      this.modelOptionsLoading = false;
      this.refreshModelSection();
    }
  }

  private refreshModelSection(): void {
    if (!this.modelSectionEl) {
      return;
    }
    const parent = this.modelSectionEl.parentElement;
    if (!parent) {
      return;
    }
    const wasFocused = this.modelSectionEl.contains(document.activeElement);
    this.modelSectionEl.remove();
    this.renderModelSection(parent);
    if (wasFocused && this.modelSectionEl) {
      const focusable = this.modelSectionEl.querySelector<HTMLElement>(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), button:not([disabled])",
      );
      focusable?.focus();
    }
  }

  private async saveCustomModelDraft(value: string): Promise<void> {
    const model = value.trim();
    if (!model) {
      this.customModelDraft = false;
      this.refreshModelSection();
      return;
    }
    this.customModelDraft = false;
    this.plugin.settings.codexModel = model;
    await this.plugin.saveSettings();
    this.refreshModelSection();
    this.updateStatusFromSettings();
  }

  private updateStatusFromSettings(): void {
    if (this.statusSetting) {
      void this.refreshCodexStatus(this.statusSetting);
    }
  }

  private async refreshCodexStatus(setting: Setting | null, force = false): Promise<void> {
    if (!setting) {
      return;
    }
    if (force) {
      setting.setDesc("Rechecking Codex CLI status...");
    }
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
    let lastValidValue = value;

    text.setValue(value).onChange((nextValue) => {
      if (!validate || validate(nextValue)) {
        onValueChange(nextValue);
        lastValidValue = nextValue;
      }
    });

    text.inputEl.addEventListener("blur", () => {
      const currentValue = text.inputEl.value;
      if (validate && !validate(currentValue)) {
        text.setValue(lastValidValue);
        onValueChange(lastValidValue);
        return;
      }
      void this.plugin.saveSettings();
    });

    text.inputEl.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        text.inputEl.blur();
      }
    });

    return text;
  }
}
