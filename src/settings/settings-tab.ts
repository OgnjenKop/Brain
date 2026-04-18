import { App, Notice, PluginSettingTab, Setting, TextComponent } from "obsidian";
import BrainPlugin from "../../main";

export class BrainSettingTab extends PluginSettingTab {
  plugin: BrainPlugin;

  constructor(app: App, plugin: BrainPlugin) {
    super(app, plugin);
    this.plugin = plugin;

    // Listen for setting updates (e.g., from auth flow)
    this.plugin.app.workspace.on("brain:settings-updated" as never, () => {
      this.display();
    });
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
          (value) => {
            if (!value.trim()) {
              new Notice("Inbox file cannot be empty");
              return false;
            }
            return true;
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
          (value) => {
            if (!value.trim()) {
              new Notice("Tasks file cannot be empty");
              return false;
            }
            return true;
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
          (value) => {
            if (!value.trim()) {
              new Notice("Journal folder cannot be empty");
              return false;
            }
            return true;
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
      .setName("Summaries folder")
      .setDesc("Folder used for persisted summaries.")
      .addText((text) =>
        this.bindTextSetting(
          text,
          this.plugin.settings.summariesFolder,
          (value) => {
            this.plugin.settings.summariesFolder = value;
          },
          (value) => {
            if (!value.trim()) {
              new Notice("Summaries folder cannot be empty");
              return false;
            }
            return true;
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
          (value) => {
            if (!value.trim()) {
              new Notice("Reviews folder cannot be empty");
              return false;
            }
            return true;
          },
        ),
      );

    containerEl.createEl("h3", { text: "AI" });

    new Setting(containerEl)
      .setName("AI Provider")
      .setDesc("Choose which AI provider to use for synthesis and routing.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            openai: "OpenAI / ChatGPT",
            gemini: "Google Gemini",
          })
          .setValue(this.plugin.settings.aiProvider)
          .onChange(async (value) => {
            this.plugin.settings.aiProvider = value as "openai" | "gemini";
            await this.plugin.saveSettings();
            this.display(); // Refresh UI to show relevant fields
          }),
      );

    if (this.plugin.settings.aiProvider === "openai") {
      const authSetting = new Setting(containerEl)
        .setName("Authentication")
        .setDesc(this.plugin.settings.openAIApiKey ? "Connected to OpenAI" : "Not connected");

      if (this.plugin.settings.openAIApiKey) {
        authSetting.addButton((button) =>
          button
            .setButtonText("Disconnect")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.openAIApiKey = "";
              await this.plugin.saveSettings();
              this.display();
            }),
        );
      } else {
        authSetting.addButton((button) =>
          button
            .setButtonText("Connect OpenAI")
            .setCta()
            .onClick(async () => {
              await this.plugin.authService.login("openai");
            }),
        );
      }

      new Setting(containerEl)
        .setName("OpenAI API key")
        .setDesc("Stored locally in plugin settings. Can be an API key or a session/access token.")
        .addText((text) => {
          text.inputEl.type = "password";
          text.setPlaceholder("Enter key or token...");
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
        .setDesc("Select a model or enter a custom one.")
        .addDropdown((dropdown) => {
          dropdown
            .addOptions({
              "gpt-4o-mini": "GPT-4o Mini (Default)",
              "gpt-4o": "GPT-4o (Powerful)",
              "o1-mini": "o1 Mini (Reasoning)",
              "o1-preview": "o1 Preview (Strong Reasoning)",
              "gpt-3.5-turbo": "GPT-3.5 Turbo (Legacy)",
              custom: "Custom Model...",
            })
            .setValue(
              ["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview", "gpt-3.5-turbo"].includes(
                this.plugin.settings.openAIModel,
              )
                ? this.plugin.settings.openAIModel
                : "custom",
            )
            .onChange(async (value) => {
              if (value !== "custom") {
                this.plugin.settings.openAIModel = value;
                await this.plugin.saveSettings();
                this.display();
              }
            });
        })
        .addText((text) => {
          const isCustom = !["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview", "gpt-3.5-turbo"].includes(
            this.plugin.settings.openAIModel,
          );
          if (isCustom) {
            text.setPlaceholder("Enter custom model name...");
            this.bindTextSetting(text, this.plugin.settings.openAIModel, (value) => {
              this.plugin.settings.openAIModel = value;
            });
          } else {
            text.inputEl.style.display = "none";
          }
        });

      new Setting(containerEl)

        .setName("OpenAI base URL")
        .setDesc("Override the default OpenAI endpoint for custom proxies or local LLMs.")
        .addText((text) =>
          this.bindTextSetting(
            text,
            this.plugin.settings.openAIBaseUrl,
            (value) => {
              this.plugin.settings.openAIBaseUrl = value;
            },
            (value) => {
              if (value && !value.trim()) {
                new Notice("OpenAI base URL cannot be empty");
                return false;
              }
              return true;
            },
          ),
        );
    } else if (this.plugin.settings.aiProvider === "gemini") {
      const authSetting = new Setting(containerEl)
        .setName("Authentication")
        .setDesc(this.plugin.settings.geminiApiKey ? "Connected to Google" : "Not connected");

      if (this.plugin.settings.geminiApiKey) {
        authSetting.addButton((button) =>
          button
            .setButtonText("Disconnect")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.geminiApiKey = "";
              await this.plugin.saveSettings();
              this.display();
            }),
        );
      } else {
        authSetting.addButton((button) =>
          button
            .setButtonText("Connect Google")
            .setCta()
            .onClick(async () => {
              await this.plugin.authService.login("gemini");
            }),
        );
      }

      new Setting(containerEl)
        .setName("Gemini API key")
        .setDesc("Stored locally in plugin settings.")
        .addText((text) => {
          text.inputEl.type = "password";
          text.setPlaceholder("Enter Gemini API key...");
          this.bindTextSetting(
            text,
            this.plugin.settings.geminiApiKey,
            (value) => {
              this.plugin.settings.geminiApiKey = value;
            },
          );
        });

      new Setting(containerEl)
        .setName("Gemini model")
        .setDesc("Select a Gemini model or enter a custom one.")
        .addDropdown((dropdown) => {
          dropdown
            .addOptions({
              "gemini-1.5-flash": "Gemini 1.5 Flash (Fastest)",
              "gemini-1.5-flash-8b": "Gemini 1.5 Flash 8B (Lighter)",
              "gemini-1.5-pro": "Gemini 1.5 Pro (Powerful)",
              "gemini-2.0-flash": "Gemini 2.0 Flash (Latest)",
              custom: "Custom Model...",
            })
            .setValue(
              ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.0-flash"].includes(
                this.plugin.settings.geminiModel,
              )
                ? this.plugin.settings.geminiModel
                : "custom",
            )
            .onChange(async (value) => {
              if (value !== "custom") {
                this.plugin.settings.geminiModel = value;
                await this.plugin.saveSettings();
                this.display();
              }
            });
        })
        .addText((text) => {
          const isCustom = !["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.0-flash"].includes(
            this.plugin.settings.geminiModel,
          );
          if (isCustom) {
            text.setPlaceholder("Enter custom model name...");
            this.bindTextSetting(text, this.plugin.settings.geminiModel, (value) => {
              this.plugin.settings.geminiModel = value;
            });
          } else {
            text.inputEl.style.display = "none";
          }
        });
    }

    containerEl.createEl("h3", { text: "AI Settings" });

    new Setting(containerEl)
      .setName("Enable AI synthesis")
      .setDesc("Use AI for synthesis, question answering, and topic pages when configured.")
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
    validate?: (value: string) => boolean,
  ): TextComponent {
    let currentValue = value;
    let lastSavedValue = value;
    let isSaving = false;

    text.setValue(value).onChange((nextValue) => {
      if (validate && !validate(nextValue)) {
        return;
      }
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
