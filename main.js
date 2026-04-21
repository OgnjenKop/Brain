"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BrainPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian20 = require("obsidian");

// src/settings/settings.ts
var DEFAULT_BRAIN_SETTINGS = {
  inboxFile: "Brain/inbox.md",
  tasksFile: "Brain/tasks.md",
  journalFolder: "Brain/journal",
  notesFolder: "Brain/notes",
  summariesFolder: "Brain/summaries",
  reviewsFolder: "Brain/reviews",
  enableAISummaries: false,
  enableAIRouting: false,
  openAIApiKey: "",
  openAIModel: "gpt-4o-mini",
  openAIBaseUrl: "https://api.openai.com/v1/chat/completions",
  aiProvider: "openai",
  codexModel: "",
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
  summaryLookbackDays: 7,
  summaryMaxChars: 12e3,
  persistSummaries: true,
  collapsedSidebarSections: []
};
function normalizeBrainSettings(input) {
  const merged = {
    ...DEFAULT_BRAIN_SETTINGS,
    ...input
  };
  return {
    inboxFile: normalizeRelativePath(merged.inboxFile, DEFAULT_BRAIN_SETTINGS.inboxFile),
    tasksFile: normalizeRelativePath(merged.tasksFile, DEFAULT_BRAIN_SETTINGS.tasksFile),
    journalFolder: normalizeRelativePath(
      merged.journalFolder,
      DEFAULT_BRAIN_SETTINGS.journalFolder
    ),
    notesFolder: normalizeRelativePath(
      merged.notesFolder,
      DEFAULT_BRAIN_SETTINGS.notesFolder
    ),
    summariesFolder: normalizeRelativePath(
      merged.summariesFolder,
      DEFAULT_BRAIN_SETTINGS.summariesFolder
    ),
    reviewsFolder: normalizeRelativePath(
      merged.reviewsFolder,
      DEFAULT_BRAIN_SETTINGS.reviewsFolder
    ),
    enableAISummaries: Boolean(merged.enableAISummaries),
    enableAIRouting: Boolean(merged.enableAIRouting),
    openAIApiKey: typeof merged.openAIApiKey === "string" ? merged.openAIApiKey.trim() : "",
    openAIModel: typeof merged.openAIModel === "string" && merged.openAIModel.trim() ? merged.openAIModel.trim() : DEFAULT_BRAIN_SETTINGS.openAIModel,
    openAIBaseUrl: typeof merged.openAIBaseUrl === "string" && merged.openAIBaseUrl.trim() ? merged.openAIBaseUrl.trim() : DEFAULT_BRAIN_SETTINGS.openAIBaseUrl,
    aiProvider: merged.aiProvider === "gemini" ? "gemini" : merged.aiProvider === "codex" ? "codex" : "openai",
    codexModel: typeof merged.codexModel === "string" ? merged.codexModel.trim() : "",
    geminiApiKey: typeof merged.geminiApiKey === "string" ? merged.geminiApiKey.trim() : "",
    geminiModel: typeof merged.geminiModel === "string" && merged.geminiModel.trim() ? merged.geminiModel.trim() : DEFAULT_BRAIN_SETTINGS.geminiModel,
    summaryLookbackDays: clampInteger(merged.summaryLookbackDays, 1, 365, DEFAULT_BRAIN_SETTINGS.summaryLookbackDays),
    summaryMaxChars: clampInteger(merged.summaryMaxChars, 1e3, 1e5, DEFAULT_BRAIN_SETTINGS.summaryMaxChars),
    persistSummaries: Boolean(merged.persistSummaries),
    collapsedSidebarSections: Array.isArray(merged.collapsedSidebarSections) ? merged.collapsedSidebarSections.filter((s) => typeof s === "string") : DEFAULT_BRAIN_SETTINGS.collapsedSidebarSections
  };
}
function normalizeRelativePath(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || fallback;
}
function clampInteger(value, min, max, fallback) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return Math.min(max, Math.max(min, value));
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.min(max, Math.max(min, parsed));
    }
  }
  return fallback;
}

// src/settings/settings-tab.ts
var import_obsidian = require("obsidian");

// src/utils/model-selection.ts
function isCustomModelValue(value, presetModels) {
  return !presetModels.includes(value);
}
function getModelDropdownValue(value, presetModels) {
  return isCustomModelValue(value, presetModels) ? "custom" : value;
}
function getNextModelValue(selection, currentValue, presetModels) {
  if (selection === "custom") {
    return isCustomModelValue(currentValue, presetModels) ? currentValue : "";
  }
  return presetModels.includes(selection) ? selection : null;
}

// src/utils/codex-auth.ts
function parseCodexLoginStatus(output) {
  const normalized = output.trim().toLowerCase();
  if (!normalized) {
    return "logged-out";
  }
  if (normalized.includes("not logged in") || normalized.includes("logged out")) {
    return "logged-out";
  }
  if (normalized.includes("logged in")) {
    return "logged-in";
  }
  return "logged-out";
}
async function getCodexLoginStatus() {
  const codexBinary = await getCodexBinaryPath();
  if (!codexBinary) {
    return "unavailable";
  }
  try {
    const execFileAsync = getExecFileAsync();
    const { stdout, stderr } = await execFileAsync(codexBinary, ["login", "status"], {
      maxBuffer: 1024 * 1024
    });
    return parseCodexLoginStatus(`${stdout}
${stderr}`);
  } catch (error) {
    if (isEnoentError(error)) {
      return "unavailable";
    }
    return "logged-out";
  }
}
async function getCodexBinaryPath() {
  const req = getNodeRequire();
  const fs = req("fs");
  const path = req("path");
  const os = req("os");
  const candidates = buildCodexCandidates(path, os.homedir());
  for (const candidate of candidates) {
    try {
      await fs.promises.access(candidate);
      return candidate;
    } catch (e) {
    }
  }
  return null;
}
function isEnoentError(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
function getExecFileAsync() {
  const req = getNodeRequire();
  const { execFile } = req("child_process");
  const { promisify } = req("util");
  return promisify(execFile);
}
function getNodeRequire() {
  return Function("return require")();
}
function buildCodexCandidates(pathModule, homeDir) {
  var _a;
  const candidates = /* @__PURE__ */ new Set();
  const pathEntries = ((_a = process.env.PATH) != null ? _a : "").split(pathModule.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    candidates.add(pathModule.join(entry, codexExecutableName()));
  }
  const commonDirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    `${homeDir}/.local/bin`,
    `${homeDir}/.bun/bin`,
    `${homeDir}/.codeium/windsurf/bin`,
    `${homeDir}/.antigravity/antigravity/bin`,
    "/Applications/Codex.app/Contents/Resources"
  ];
  for (const dir of commonDirs) {
    candidates.add(pathModule.join(dir, codexExecutableName()));
  }
  return Array.from(candidates);
}
function codexExecutableName() {
  return process.platform === "win32" ? "codex.cmd" : "codex";
}

// src/utils/ai-config.ts
async function getAIConfigurationStatus(settings) {
  if (settings.aiProvider === "codex") {
    const codexStatus = await getCodexLoginStatus();
    if (codexStatus === "unavailable") {
      return {
        configured: false,
        provider: "codex",
        model: null,
        message: "Codex CLI not installed."
      };
    }
    if (codexStatus !== "logged-in") {
      return {
        configured: false,
        provider: "codex",
        model: null,
        message: "Codex CLI not logged in."
      };
    }
    const model = settings.codexModel.trim() || null;
    return {
      configured: true,
      provider: "codex",
      model,
      message: model ? `Ready to use Codex with model ${model}.` : "Ready to use Codex with the account default model."
    };
  }
  if (settings.aiProvider === "gemini") {
    if (!settings.geminiApiKey.trim()) {
      return {
        configured: false,
        provider: "gemini",
        model: null,
        message: "Gemini API key missing."
      };
    }
    if (!settings.geminiModel.trim()) {
      return {
        configured: false,
        provider: "gemini",
        model: null,
        message: "Gemini model missing."
      };
    }
    return {
      configured: true,
      provider: "gemini",
      model: settings.geminiModel.trim(),
      message: "Ready to use Gemini."
    };
  }
  const isDefaultOpenAIUrl = !settings.openAIBaseUrl.trim() || settings.openAIBaseUrl.includes("api.openai.com");
  if (!settings.openAIModel.trim()) {
    return {
      configured: false,
      provider: "openai",
      model: null,
      message: "OpenAI model missing."
    };
  }
  if (isDefaultOpenAIUrl && !settings.openAIApiKey.trim()) {
    return {
      configured: false,
      provider: "openai",
      model: null,
      message: "OpenAI API key missing."
    };
  }
  return {
    configured: true,
    provider: "openai",
    model: settings.openAIModel.trim(),
    message: isDefaultOpenAIUrl ? "Ready to use the OpenAI API." : "Ready to use a custom OpenAI-compatible endpoint."
  };
}

// src/settings/settings-tab.ts
var OPENAI_PRESET_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "o1-mini",
  "o1-preview",
  "gpt-3.5-turbo"
];
var GEMINI_PRESET_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-2.0-flash"
];
var BrainSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.plugin.app.workspace.on("brain:settings-updated", () => {
      this.display();
    });
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Brain Settings" });
    containerEl.createEl("h3", { text: "Storage" });
    new import_obsidian.Setting(containerEl).setName("Inbox file").setDesc("Markdown file used for quick note capture.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.inboxFile,
        (value) => {
          this.plugin.settings.inboxFile = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Inbox file cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Tasks file").setDesc("Markdown file used for quick task capture.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.tasksFile,
        (value) => {
          this.plugin.settings.tasksFile = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Tasks file cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Journal folder").setDesc("Folder containing daily journal files.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.journalFolder,
        (value) => {
          this.plugin.settings.journalFolder = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Journal folder cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Notes folder").setDesc("Folder used for promoted notes and generated markdown artifacts.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.notesFolder,
        (value) => {
          this.plugin.settings.notesFolder = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Notes folder cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Summaries folder").setDesc("Folder used for persisted summaries.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.summariesFolder,
        (value) => {
          this.plugin.settings.summariesFolder = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Summaries folder cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Reviews folder").setDesc("Folder used to store inbox review logs.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.reviewsFolder,
        (value) => {
          this.plugin.settings.reviewsFolder = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Reviews folder cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    containerEl.createEl("h3", { text: "AI" });
    new import_obsidian.Setting(containerEl).setName("AI Provider").setDesc("Choose the provider Brain should use for synthesis, questions, topic pages, and optional auto-routing.").addDropdown(
      (dropdown) => dropdown.addOptions({
        openai: "OpenAI API",
        codex: "OpenAI Codex (ChatGPT)",
        gemini: "Google Gemini"
      }).setValue(this.plugin.settings.aiProvider).onChange(async (value) => {
        this.plugin.settings.aiProvider = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    this.createAIStatusSetting(containerEl);
    if (this.plugin.settings.aiProvider === "openai") {
      const authSetting = new import_obsidian.Setting(containerEl).setName("OpenAI setup").setDesc(
        this.plugin.settings.openAIApiKey ? "OpenAI is ready. The API key is stored locally in Brain settings." : "Use an OpenAI API key from platform.openai.com, or point Brain at an OpenAI-compatible endpoint below."
      );
      if (this.plugin.settings.openAIApiKey) {
        authSetting.addButton(
          (button) => button.setButtonText("Disconnect").setWarning().onClick(async () => {
            this.plugin.settings.openAIApiKey = "";
            await this.plugin.saveSettings();
            this.display();
          })
        );
      } else {
        authSetting.addButton(
          (button) => button.setButtonText("Open OpenAI Setup").setCta().onClick(async () => {
            await this.plugin.authService.login("openai");
          })
        );
      }
      new import_obsidian.Setting(containerEl).setName("OpenAI API key").setDesc(
        "Stored locally in plugin settings. Use an API key for the default OpenAI endpoint. If you override the base URL below, this field is used as that endpoint's bearer token."
      ).addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("Enter OpenAI API key...");
        this.bindTextSetting(
          text,
          this.plugin.settings.openAIApiKey,
          (value) => {
            this.plugin.settings.openAIApiKey = value;
          }
        );
      });
      new import_obsidian.Setting(containerEl).setName("OpenAI model").setDesc("Select a model or enter a custom one.").addDropdown((dropdown) => {
        dropdown.addOptions({
          "gpt-4o-mini": "GPT-4o Mini (Default)",
          "gpt-4o": "GPT-4o (Powerful)",
          "o1-mini": "o1 Mini (Reasoning)",
          "o1-preview": "o1 Preview (Strong Reasoning)",
          "gpt-3.5-turbo": "GPT-3.5 Turbo (Legacy)",
          custom: "Custom Model..."
        }).setValue(getModelDropdownValue(this.plugin.settings.openAIModel, OPENAI_PRESET_MODELS)).onChange(async (value) => {
          const nextModel = getNextModelValue(
            value,
            this.plugin.settings.openAIModel,
            OPENAI_PRESET_MODELS
          );
          if (nextModel !== null) {
            this.plugin.settings.openAIModel = nextModel;
          }
          if (value === "custom" && nextModel !== null) {
            this.display();
            return;
          }
          if (nextModel !== null) {
            await this.plugin.saveSettings();
            this.display();
          }
        });
      }).addText((text) => {
        const isCustom = isCustomModelValue(
          this.plugin.settings.openAIModel,
          OPENAI_PRESET_MODELS
        );
        if (isCustom) {
          text.setPlaceholder("Enter custom model name...");
          this.bindTextSetting(text, this.plugin.settings.openAIModel, (value) => {
            this.plugin.settings.openAIModel = value;
          });
        } else {
          text.setPlaceholder("Select Custom Model... to enter a model name");
          text.setValue("");
          text.inputEl.disabled = true;
        }
      });
      new import_obsidian.Setting(containerEl).setName("OpenAI base URL").setDesc(
        "Override the default OpenAI endpoint for custom proxies or local LLMs. If you set this, the bearer token above is sent to that endpoint."
      ).addText(
        (text) => this.bindTextSetting(
          text,
          this.plugin.settings.openAIBaseUrl,
          (value) => {
            this.plugin.settings.openAIBaseUrl = value;
          },
          (value) => {
            if (value && !value.trim()) {
              new import_obsidian.Notice("OpenAI base URL cannot be empty");
              return false;
            }
            return true;
          }
        )
      );
    } else if (this.plugin.settings.aiProvider === "codex") {
      new import_obsidian.Setting(containerEl).setName("Codex setup").setDesc(
        "Use your ChatGPT subscription through the official Codex CLI. Install `@openai/codex`, run `codex login`, then check Brain's sidebar status to confirm Codex is ready."
      ).addButton(
        (button) => button.setButtonText("Open Codex Setup").setCta().onClick(async () => {
          await this.plugin.authService.login("codex");
        })
      );
      new import_obsidian.Setting(containerEl).setName("Codex model").setDesc("Optional. Leave blank to use the Codex CLI default model for your account.").addText(
        (text) => this.bindTextSetting(text, this.plugin.settings.codexModel, (value) => {
          this.plugin.settings.codexModel = value;
        })
      );
    } else if (this.plugin.settings.aiProvider === "gemini") {
      const authSetting = new import_obsidian.Setting(containerEl).setName("Gemini setup").setDesc(
        this.plugin.settings.geminiApiKey ? "Gemini is ready. The API key is stored locally in Brain settings." : "Use a Gemini API key from Google AI Studio, then paste it below."
      );
      if (this.plugin.settings.geminiApiKey) {
        authSetting.addButton(
          (button) => button.setButtonText("Disconnect").setWarning().onClick(async () => {
            this.plugin.settings.geminiApiKey = "";
            await this.plugin.saveSettings();
            this.display();
          })
        );
      } else {
        authSetting.addButton(
          (button) => button.setButtonText("Open Gemini Setup").setCta().onClick(async () => {
            await this.plugin.authService.login("gemini");
          })
        );
      }
      new import_obsidian.Setting(containerEl).setName("Gemini API key").setDesc("Stored locally in plugin settings. Generated from Google AI Studio.").addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("Enter Gemini API key...");
        this.bindTextSetting(
          text,
          this.plugin.settings.geminiApiKey,
          (value) => {
            this.plugin.settings.geminiApiKey = value;
          }
        );
      });
      new import_obsidian.Setting(containerEl).setName("Gemini model").setDesc("Select a Gemini model or enter a custom one.").addDropdown((dropdown) => {
        dropdown.addOptions({
          "gemini-1.5-flash": "Gemini 1.5 Flash (Fastest)",
          "gemini-1.5-flash-8b": "Gemini 1.5 Flash 8B (Lighter)",
          "gemini-1.5-pro": "Gemini 1.5 Pro (Powerful)",
          "gemini-2.0-flash": "Gemini 2.0 Flash (Latest)",
          custom: "Custom Model..."
        }).setValue(getModelDropdownValue(this.plugin.settings.geminiModel, GEMINI_PRESET_MODELS)).onChange(async (value) => {
          const nextModel = getNextModelValue(
            value,
            this.plugin.settings.geminiModel,
            GEMINI_PRESET_MODELS
          );
          if (nextModel !== null) {
            this.plugin.settings.geminiModel = nextModel;
          }
          if (value === "custom" && nextModel !== null) {
            this.display();
            return;
          }
          if (nextModel !== null) {
            await this.plugin.saveSettings();
            this.display();
          }
        });
      }).addText((text) => {
        const isCustom = isCustomModelValue(
          this.plugin.settings.geminiModel,
          GEMINI_PRESET_MODELS
        );
        if (isCustom) {
          text.setPlaceholder("Enter custom model name...");
          this.bindTextSetting(text, this.plugin.settings.geminiModel, (value) => {
            this.plugin.settings.geminiModel = value;
          });
        } else {
          text.setPlaceholder("Select Custom Model... to enter a model name");
          text.setValue("");
          text.inputEl.disabled = true;
        }
      });
    }
    containerEl.createEl("h3", { text: "AI Settings" });
    new import_obsidian.Setting(containerEl).setName("Enable AI synthesis").setDesc("Use AI for synthesis, question answering, and topic pages when configured.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableAISummaries).onChange(async (value) => {
        this.plugin.settings.enableAISummaries = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Enable AI routing").setDesc("Allow the sidebar to auto-route captures with AI.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableAIRouting).onChange(async (value) => {
        this.plugin.settings.enableAIRouting = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "Context Collection" });
    new import_obsidian.Setting(containerEl).setName("Lookback days").setDesc("How far back to scan when building recent-context summaries.").addText(
      (text) => this.bindTextSetting(
        text,
        String(this.plugin.settings.summaryLookbackDays),
        (value) => {
          const parsed = Number.parseInt(value, 10);
          this.plugin.settings.summaryLookbackDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Maximum characters").setDesc("Maximum text collected before synthesis or summary.").addText(
      (text) => this.bindTextSetting(
        text,
        String(this.plugin.settings.summaryMaxChars),
        (value) => {
          const parsed = Number.parseInt(value, 10);
          this.plugin.settings.summaryMaxChars = Number.isFinite(parsed) && parsed >= 1e3 ? parsed : 12e3;
        }
      )
    );
    containerEl.createEl("h3", { text: "Summary Output" });
    new import_obsidian.Setting(containerEl).setName("Persist summaries").setDesc("Write generated summaries into the vault.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.persistSummaries).onChange(async (value) => {
        this.plugin.settings.persistSummaries = value;
        await this.plugin.saveSettings();
      })
    );
  }
  createAIStatusSetting(containerEl) {
    const statusSetting = new import_obsidian.Setting(containerEl).setName("Provider status").setDesc("Current readiness for the selected AI provider.");
    statusSetting.setDesc("Checking provider status...");
    void this.refreshAIStatus(statusSetting);
  }
  async refreshAIStatus(setting) {
    const status = await getAIConfigurationStatus(this.plugin.settings);
    setting.setDesc(status.message);
  }
  bindTextSetting(text, value, onValueChange, validate) {
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
      validate
    );
    return text;
  }
  queueSaveOnBlur(input, getCurrentValue, getLastSavedValue, setLastSavedValue, isSaving, setSaving, validate) {
    input.addEventListener("blur", () => {
      void this.saveOnBlur(
        getCurrentValue,
        getLastSavedValue,
        setLastSavedValue,
        isSaving,
        setSaving,
        validate
      );
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        input.blur();
      }
    });
  }
  async saveOnBlur(getCurrentValue, getLastSavedValue, setLastSavedValue, isSaving, setSaving, validate) {
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
};

// src/services/context-service.ts
var import_obsidian2 = require("obsidian");

// src/utils/date.ts
function formatDateKey(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function formatTimeKey(date = /* @__PURE__ */ new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function formatDateTimeKey(date = /* @__PURE__ */ new Date()) {
  return `${formatDateKey(date)} ${formatTimeKey(date)}`;
}
function formatSummaryTimestamp(date = /* @__PURE__ */ new Date()) {
  return `${formatDateKey(date)}-${pad2(date.getHours())}${pad2(date.getMinutes())}`;
}
function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}
function collapseJournalText(text) {
  return text.split("\n").map((line) => line.replace(/\s+$/g, "")).join("\n").trim();
}
function trimTrailingNewlines(text) {
  return text.replace(/\n+$/g, "");
}
function getWindowStart(lookbackDays) {
  const safeDays = Math.max(1, lookbackDays);
  const start = /* @__PURE__ */ new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));
  return start;
}
function pad2(value) {
  return String(value).padStart(2, "0");
}

// src/utils/text.ts
async function joinRecentFilesForSummary(vaultService, files, maxChars) {
  const parts = [];
  let total = 0;
  for (const file of files) {
    try {
      const content = await vaultService.readText(file.path);
      const trimmed = content.trim();
      if (!trimmed) {
        continue;
      }
      const block = [`--- ${file.path}`, trimmed].join("\n");
      if (total + block.length > maxChars) {
        const remaining = Math.max(0, maxChars - total);
        if (remaining > 0) {
          parts.push(block.slice(0, remaining));
        }
        break;
      }
      parts.push(block);
      total += block.length;
    } catch (error) {
      console.error(error);
    }
  }
  return parts.join("\n\n");
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "note";
}
function trimTitle(text) {
  const trimmed = text.trim();
  if (trimmed.length <= 60) {
    return trimmed;
  }
  return `${trimmed.slice(0, 57).trimEnd()}...`;
}
function getAppendSeparator(text) {
  if (!text.trim()) {
    return "";
  }
  if (text.endsWith("\n\n")) {
    return "";
  }
  if (text.endsWith("\n")) {
    return "\n";
  }
  return "\n\n";
}
function stripLeadingTitle(content) {
  const lines = content.trim().split("\n");
  if (!lines.length) {
    return "";
  }
  if (!/^#\s+/.test(lines[0])) {
    return content.trim();
  }
  const remaining = lines.slice(1);
  while (remaining.length > 0 && !remaining[0].trim()) {
    remaining.shift();
  }
  return remaining.join("\n").trim();
}
function buildNoteTitle(entry) {
  var _a;
  const candidate = entry.preview || entry.body || entry.heading;
  const lines = candidate.split("\n").map((line) => collapseWhitespace(line)).filter(Boolean);
  const first = (_a = lines[0]) != null ? _a : "Untitled note";
  return trimTitle(first);
}

// src/services/context-service.ts
var ContextService = class {
  constructor(app, vaultService, settingsProvider) {
    this.app = app;
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async getCurrentNoteContext() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      throw new Error("Open a markdown note first");
    }
    const text = view.editor.getValue();
    if (!text.trim()) {
      throw new Error("Current note is empty");
    }
    return this.buildContext("Current note", view.file.path, text);
  }
  async getSelectedTextContext() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      throw new Error("Open a markdown note first");
    }
    const text = view.editor.getSelection();
    if (!text.trim()) {
      throw new Error("Select some text first");
    }
    return this.buildContext("Selected text", view.file.path, text);
  }
  async getRecentFilesContext() {
    const settings = this.settingsProvider();
    const cutoff = getWindowStart(settings.summaryLookbackDays).getTime();
    const files = await this.vaultService.collectMarkdownFiles({
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder],
      minMtime: cutoff
    });
    return this.buildFileGroupContext("Recent files", files, null);
  }
  async getCurrentFolderContext() {
    var _a, _b;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      throw new Error("Open a markdown note first");
    }
    const folderPath = (_b = (_a = view.file.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const settings = this.settingsProvider();
    const files = await this.vaultService.collectMarkdownFiles({
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder],
      folderPath
    });
    return this.buildFileGroupContext("Current folder", files, folderPath || null);
  }
  async getSelectedFilesContext(files) {
    if (!files.length) {
      throw new Error("Select at least one markdown note");
    }
    return this.buildFileGroupContext("Selected notes", files, null);
  }
  async getVaultContext() {
    const settings = this.settingsProvider();
    const files = await this.vaultService.collectMarkdownFiles({
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder]
    });
    return this.buildFileGroupContext("Entire vault", files, null);
  }
  buildContext(sourceLabel, sourcePath, text, sourcePaths) {
    const settings = this.settingsProvider();
    const maxChars = Math.max(1e3, settings.summaryMaxChars);
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
      maxChars
    };
  }
  async buildFileGroupContext(sourceLabel, files, sourcePath) {
    if (!files.length) {
      throw new Error(`No markdown files found for ${sourceLabel.toLowerCase()}`);
    }
    const settings = this.settingsProvider();
    const text = await joinRecentFilesForSummary(
      this.vaultService,
      files,
      settings.summaryMaxChars
    );
    if (!text.trim()) {
      throw new Error(`No markdown files found for ${sourceLabel.toLowerCase()}`);
    }
    return this.buildContext(sourceLabel, sourcePath, text, files.map((file) => file.path));
  }
};

// src/services/inbox-service.ts
var InboxService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
    this.unreviewedCountCache = null;
  }
  async getRecentEntries(limit = 20, includeReviewed = false) {
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const entries = parseInboxEntries(content);
    const filtered = includeReviewed ? entries : entries.filter((entry) => !entry.reviewed);
    return filtered.slice(-limit).reverse();
  }
  async getUnreviewedCount() {
    const settings = this.settingsProvider();
    const { text, mtime, exists } = await this.vaultService.readTextWithMtime(settings.inboxFile);
    if (!exists) {
      this.unreviewedCountCache = {
        mtime: 0,
        count: 0
      };
      return 0;
    }
    if (this.unreviewedCountCache && this.unreviewedCountCache.mtime === mtime) {
      return this.unreviewedCountCache.count;
    }
    const count = parseInboxEntries(text).filter((entry) => !entry.reviewed).length;
    this.unreviewedCountCache = {
      mtime,
      count
    };
    return count;
  }
  async markEntryReviewed(entry, action) {
    var _a, _b, _c;
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const currentEntries = parseInboxEntries(content);
    const currentEntry = (_c = (_b = (_a = currentEntries.find(
      (candidate) => !candidate.reviewed && candidate.signature === entry.signature && candidate.signatureIndex === entry.signatureIndex
    )) != null ? _a : currentEntries.find((candidate) => !candidate.reviewed && candidate.raw === entry.raw)) != null ? _b : currentEntries.find(
      (candidate) => !candidate.reviewed && candidate.heading === entry.heading && candidate.body === entry.body && candidate.preview === entry.preview
    )) != null ? _c : currentEntries.find(
      (candidate) => !candidate.reviewed && candidate.heading === entry.heading && candidate.startLine === entry.startLine
    );
    if (!currentEntry) {
      return false;
    }
    const updated = insertReviewMarker(content, currentEntry, action);
    if (updated === content) {
      return false;
    }
    await this.vaultService.replaceText(settings.inboxFile, updated);
    this.unreviewedCountCache = null;
    return true;
  }
  async reopenEntry(entry) {
    var _a, _b;
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const currentEntries = parseInboxEntries(content);
    const currentEntry = (_b = (_a = currentEntries.find(
      (candidate) => candidate.reviewed && candidate.signature === entry.signature && candidate.signatureIndex === entry.signatureIndex
    )) != null ? _a : findUniqueReviewedSignatureMatch(currentEntries, entry.signature)) != null ? _b : currentEntries.find(
      (candidate) => candidate.reviewed && candidate.heading === entry.heading && candidate.body === entry.body && candidate.preview === entry.preview
    );
    if (!currentEntry) {
      return false;
    }
    const updated = removeReviewMarker(content, currentEntry);
    if (updated === content) {
      return false;
    }
    await this.vaultService.replaceText(settings.inboxFile, updated);
    this.unreviewedCountCache = null;
    return true;
  }
};
function parseInboxEntries(content) {
  var _a;
  const lines = content.split("\n");
  const entries = [];
  let currentHeading = "";
  let currentBodyLines = [];
  let currentStartLine = -1;
  let currentReviewed = false;
  let currentReviewAction = null;
  let currentReviewedAt = null;
  const signatureCounts = /* @__PURE__ */ new Map();
  const pushEntry = (endLine) => {
    var _a2;
    if (!currentHeading) {
      currentBodyLines = [];
      return;
    }
    const body = currentBodyLines.join("\n").trim();
    const preview = buildPreview(body);
    const raw = [currentHeading, ...currentBodyLines].join("\n").trimEnd();
    const signature = buildEntrySignature(currentHeading, currentBodyLines);
    const signatureIndex = (_a2 = signatureCounts.get(signature)) != null ? _a2 : 0;
    signatureCounts.set(signature, signatureIndex + 1);
    entries.push({
      heading: currentHeading.replace(/^##\s+/, "").trim(),
      body,
      raw,
      preview,
      index: entries.length,
      signature,
      signatureIndex,
      startLine: currentStartLine,
      endLine,
      reviewed: currentReviewed,
      reviewAction: currentReviewAction,
      reviewedAt: currentReviewedAt
    });
    currentBodyLines = [];
    currentStartLine = -1;
    currentReviewed = false;
    currentReviewAction = null;
    currentReviewedAt = null;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      pushEntry(index);
      currentHeading = line;
      currentStartLine = index;
      continue;
    }
    if (!currentHeading) {
      continue;
    }
    const reviewMatch = line.match(/^<!--\s*brain-reviewed:\s*([a-z]+)(?:\s+(.+?))?\s*-->$/i);
    if (reviewMatch) {
      currentReviewed = true;
      currentReviewAction = reviewMatch[1].toLowerCase();
      currentReviewedAt = (_a = reviewMatch[2]) != null ? _a : null;
      continue;
    }
    currentBodyLines.push(line);
  }
  pushEntry(lines.length);
  return entries;
}
function insertReviewMarker(content, entry, action) {
  const lines = content.split("\n");
  if (entry.startLine < 0 || entry.endLine < entry.startLine || entry.endLine > lines.length) {
    return content;
  }
  const timestamp = formatDateTimeKey(/* @__PURE__ */ new Date());
  const marker = `<!-- brain-reviewed: ${action} ${timestamp} -->`;
  const entryLines = lines.slice(entry.startLine, entry.endLine);
  const cleanedEntryLines = trimTrailingBlankLines(
    entryLines.filter((line) => !line.match(/^<!--\s*brain-reviewed:/i))
  );
  cleanedEntryLines.push(marker, "");
  const updatedLines = [
    ...lines.slice(0, entry.startLine),
    ...cleanedEntryLines,
    ...lines.slice(entry.endLine)
  ];
  return trimTrailingBlankLines(updatedLines).join("\n");
}
function removeReviewMarker(content, entry) {
  const lines = content.split("\n");
  if (entry.startLine < 0 || entry.endLine < entry.startLine || entry.endLine > lines.length) {
    return content;
  }
  const entryLines = lines.slice(entry.startLine, entry.endLine);
  const cleanedEntryLines = trimTrailingBlankLines(
    entryLines.filter((line) => !line.match(/^<!--\s*brain-reviewed:/i))
  );
  const updatedLines = [
    ...lines.slice(0, entry.startLine),
    ...cleanedEntryLines,
    ...lines.slice(entry.endLine)
  ];
  return trimTrailingBlankLines(updatedLines).join("\n");
}
function buildPreview(body) {
  var _a;
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  return (_a = lines[0]) != null ? _a : "";
}
function buildEntrySignature(heading, bodyLines) {
  return [heading.trim(), ...bodyLines.map((line) => line.trim())].join("\n");
}
function trimTrailingBlankLines(lines) {
  const clone = [...lines];
  while (clone.length > 0 && clone[clone.length - 1].trim() === "") {
    clone.pop();
  }
  return clone;
}
function findUniqueReviewedSignatureMatch(entries, signature) {
  const reviewedMatches = entries.filter(
    (entry) => entry.reviewed && entry.signature === signature
  );
  if (reviewedMatches.length !== 1) {
    return null;
  }
  return reviewedMatches[0];
}

// src/services/journal-service.ts
var JournalService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  getJournalPath(date = /* @__PURE__ */ new Date()) {
    const settings = this.settingsProvider();
    const dateKey = formatDateKey(date);
    return `${settings.journalFolder}/${dateKey}.md`;
  }
  async ensureJournalFile(date = /* @__PURE__ */ new Date()) {
    const dateKey = formatDateKey(date);
    const path = this.getJournalPath(date);
    return this.vaultService.appendJournalHeader(path, dateKey);
  }
  async appendEntry(text, date = /* @__PURE__ */ new Date()) {
    const cleaned = collapseJournalText(text);
    if (!cleaned) {
      throw new Error("Journal text cannot be empty");
    }
    const file = await this.ensureJournalFile(date);
    const path = file.path;
    const block = `## ${formatTimeKey(date)}
${cleaned}`;
    await this.vaultService.appendText(path, block);
    return { path };
  }
};

// src/services/note-service.ts
var NoteService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async appendNote(text) {
    const settings = this.settingsProvider();
    const cleaned = collapseWhitespace(text);
    if (!cleaned) {
      throw new Error("Note text cannot be empty");
    }
    const block = `## ${formatDateTimeKey(/* @__PURE__ */ new Date())}
- ${cleaned}`;
    await this.vaultService.appendText(settings.inboxFile, block);
    return { path: settings.inboxFile };
  }
  async createGeneratedNote(title, body, sourceLabel, sourcePath, sourcePaths) {
    const settings = this.settingsProvider();
    const now = /* @__PURE__ */ new Date();
    const cleanedTitle = trimTitle(title);
    const fileName = `${formatSummaryTimestamp(now)}-${slugify(cleanedTitle)}.md`;
    const path = await this.vaultService.ensureUniqueFilePath(
      `${settings.notesFolder}/${fileName}`
    );
    const sourceLine = sourcePaths && sourcePaths.length > 0 ? `${sourceLabel} \u2022 ${sourcePaths.length} ${sourcePaths.length === 1 ? "file" : "files"}` : sourcePath ? `${sourceLabel} \u2022 ${sourcePath}` : sourceLabel;
    const sourceFileLines = sourcePaths && sourcePaths.length > 0 ? [
      "Source files:",
      ...sourcePaths.slice(0, 12).map((source) => `- ${source}`),
      ...sourcePaths.length > 12 ? [`- ...and ${sourcePaths.length - 12} more`] : []
    ] : [];
    const content = [
      `# ${cleanedTitle}`,
      "",
      `Created: ${formatDateTimeKey(now)}`,
      `Source: ${sourceLine}`,
      ...sourceFileLines,
      "",
      collapseWhitespace(body) ? body.trim() : "No artifact content returned.",
      ""
    ].join("\n");
    return await this.vaultService.replaceText(path, content);
  }
};

// src/utils/path.ts
function isUnderFolder(path, folder) {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
}
function isBrainGeneratedPath(path, settings) {
  return isUnderFolder(path, settings.summariesFolder) || isUnderFolder(path, settings.reviewsFolder) || isUnderFolder(path, settings.notesFolder) || path === settings.inboxFile || path === settings.tasksFile;
}

// src/services/review-log-service.ts
var ReviewLogService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
    this.reviewEntryCountCache = /* @__PURE__ */ new Map();
    this.reviewLogFilesCache = null;
    this.reviewEntryTotalCache = null;
  }
  async appendReviewLog(entry, action) {
    const settings = this.settingsProvider();
    const now = /* @__PURE__ */ new Date();
    const dateKey = formatDateKey(now);
    const path = `${settings.reviewsFolder}/${dateKey}.md`;
    const content = [
      `## ${formatDateTimeKey(now)}`,
      `- Action: ${action}`,
      `- Inbox: ${entry.heading}`,
      `- Preview: ${entry.preview || entry.body || "(empty)"}`,
      `- Signature: ${encodeReviewSignature(entry.signature)}`,
      `- Signature index: ${entry.signatureIndex}`,
      ""
    ].join("\n");
    await this.vaultService.appendText(path, content);
    this.reviewEntryCountCache.clear();
    this.reviewLogFilesCache = null;
    this.reviewEntryTotalCache = null;
    return { path };
  }
  async getReviewLogFiles(limit) {
    var _a, _b;
    const settings = this.settingsProvider();
    if (!this.reviewLogFilesCache) {
      const allFiles = await this.vaultService.listMarkdownFiles();
      const matching = allFiles.filter((file) => isUnderFolder(file.path, settings.reviewsFolder)).sort((left, right) => right.stat.mtime - left.stat.mtime);
      this.reviewLogFilesCache = {
        mtime: (_b = (_a = matching[0]) == null ? void 0 : _a.stat.mtime) != null ? _b : 0,
        files: matching
      };
    }
    return typeof limit === "number" ? this.reviewLogFilesCache.files.slice(0, limit) : this.reviewLogFilesCache.files;
  }
  async getReviewEntries(limit) {
    const logs = await this.getReviewLogFiles(limit);
    const entries = [];
    for (const file of logs) {
      const content = await this.vaultService.readText(file.path);
      const parsed = parseReviewLogEntries(content, file.path, file.stat.mtime);
      entries.push(...parsed.reverse());
      if (typeof limit === "number" && entries.length >= limit) {
        break;
      }
    }
    return typeof limit === "number" ? entries.slice(0, limit) : entries;
  }
  async getReviewEntryCount() {
    var _a;
    const logs = await this.getReviewLogFiles();
    if (logs.length === 0) {
      this.reviewEntryTotalCache = { listingMtime: 0, total: 0 };
      return 0;
    }
    const listingMtime = logs[0].stat.mtime;
    if (((_a = this.reviewEntryTotalCache) == null ? void 0 : _a.listingMtime) === listingMtime) {
      return this.reviewEntryTotalCache.total;
    }
    const seenPaths = /* @__PURE__ */ new Set();
    let total = 0;
    const uncachedFiles = logs.filter((file) => {
      const cached = this.reviewEntryCountCache.get(file.path);
      return !(cached && cached.mtime === file.stat.mtime);
    });
    const cachedFiles = logs.filter((file) => {
      const cached = this.reviewEntryCountCache.get(file.path);
      return cached && cached.mtime === file.stat.mtime;
    });
    for (const file of cachedFiles) {
      seenPaths.add(file.path);
      total += this.reviewEntryCountCache.get(file.path).count;
    }
    if (uncachedFiles.length > 0) {
      const results = await Promise.all(
        uncachedFiles.map(async (file) => {
          const content = await this.vaultService.readText(file.path);
          const count = parseReviewLogEntries(content, file.path, file.stat.mtime).length;
          this.reviewEntryCountCache.set(file.path, {
            mtime: file.stat.mtime,
            count
          });
          return { file, count };
        })
      );
      for (const { file, count } of results) {
        seenPaths.add(file.path);
        total += count;
      }
    }
    for (const path of this.reviewEntryCountCache.keys()) {
      if (!seenPaths.has(path)) {
        this.reviewEntryCountCache.delete(path);
      }
    }
    this.reviewEntryTotalCache = { listingMtime, total };
    return total;
  }
};
function parseReviewLogEntries(content, sourcePath, fileMtime) {
  const lines = content.split("\n");
  const entries = [];
  let currentTimestamp = "";
  let currentAction = "";
  let currentHeading = "";
  let currentPreview = "";
  let currentSignature = "";
  let currentSignatureIndex = 0;
  let currentEntryIndex = 0;
  const pushEntry = () => {
    if (!currentTimestamp) {
      return;
    }
    entries.push({
      action: currentAction || "unknown",
      heading: currentHeading,
      preview: currentPreview,
      body: "",
      signature: currentSignature,
      signatureIndex: currentSignatureIndex,
      timestamp: currentTimestamp,
      sourcePath,
      fileMtime,
      entryIndex: currentEntryIndex
    });
    currentTimestamp = "";
    currentAction = "";
    currentHeading = "";
    currentPreview = "";
    currentSignature = "";
    currentSignatureIndex = 0;
    currentEntryIndex += 1;
  };
  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      pushEntry();
      currentTimestamp = headingMatch[1].trim();
      continue;
    }
    const actionMatch = line.match(/^-\s+Action:\s+(.+)$/i);
    if (actionMatch) {
      currentAction = actionMatch[1].trim();
      continue;
    }
    const inboxMatch = line.match(/^-\s+Inbox:\s+(.+)$/i);
    if (inboxMatch) {
      currentHeading = inboxMatch[1].trim();
      continue;
    }
    const previewMatch = line.match(/^-\s+Preview:\s+(.+)$/i);
    if (previewMatch) {
      currentPreview = previewMatch[1].trim();
      continue;
    }
    const signatureMatch = line.match(/^-\s+Signature:\s+(.+)$/i);
    if (signatureMatch) {
      currentSignature = decodeReviewSignature(signatureMatch[1].trim());
      continue;
    }
    const signatureIndexMatch = line.match(/^-\s+Signature index:\s+(.+)$/i);
    if (signatureIndexMatch) {
      const parsed = Number.parseInt(signatureIndexMatch[1], 10);
      currentSignatureIndex = Number.isFinite(parsed) ? parsed : 0;
    }
  }
  pushEntry();
  return entries;
}
function encodeReviewSignature(signature) {
  return encodeURIComponent(signature);
}
function decodeReviewSignature(signature) {
  try {
    return decodeURIComponent(signature);
  } catch (e) {
    return signature;
  }
}

// src/services/review-service.ts
var ReviewService = class {
  constructor(vaultService, inboxService, taskService, journalService, reviewLogService, settingsProvider) {
    this.vaultService = vaultService;
    this.inboxService = inboxService;
    this.taskService = taskService;
    this.journalService = journalService;
    this.reviewLogService = reviewLogService;
    this.settingsProvider = settingsProvider;
  }
  async getRecentInboxEntries(limit = 20) {
    return this.inboxService.getRecentEntries(limit);
  }
  async promoteToTask(entry) {
    const text = entry.body || entry.preview || entry.heading;
    const saved = await this.taskService.appendTask(text);
    await this.appendReviewLogBestEffort(entry, "task");
    const markerUpdated = await this.markInboxReviewed(entry, "task");
    return this.appendMarkerNote(
      `Promoted inbox entry to task in ${saved.path}`,
      markerUpdated
    );
  }
  async keepEntry(entry) {
    return `Left inbox entry in ${this.settingsProvider().inboxFile}`;
  }
  async skipEntry(entry) {
    await this.appendReviewLogBestEffort(entry, "skip");
    const markerUpdated = await this.markInboxReviewed(entry, "skip");
    return this.appendMarkerNote("Skipped inbox entry", markerUpdated);
  }
  async appendToJournal(entry) {
    const saved = await this.journalService.appendEntry(
      [
        `Source: ${entry.heading}`,
        "",
        entry.body || entry.preview || entry.heading
      ].join("\n")
    );
    await this.appendReviewLogBestEffort(entry, "journal");
    const markerUpdated = await this.markInboxReviewed(entry, "journal");
    return this.appendMarkerNote(`Appended inbox entry to ${saved.path}`, markerUpdated);
  }
  async promoteToNote(entry) {
    const now = /* @__PURE__ */ new Date();
    const settings = this.settingsProvider();
    const notesFolder = settings.notesFolder;
    await this.vaultService.ensureFolder(notesFolder);
    const title = buildNoteTitle(entry);
    const filename = `${formatDateTimeKey(now).replace(/[: ]/g, "-")}-${slugify(title)}.md`;
    const path = await this.vaultService.ensureUniqueFilePath(`${notesFolder}/${filename}`);
    const content = [
      `# ${title}`,
      "",
      `Created: ${formatDateTimeKey(now)}`,
      "Source: Brain inbox",
      "",
      "Original capture:",
      entry.body || entry.preview || entry.heading,
      ""
    ].join("\n");
    await this.vaultService.appendText(path, content);
    await this.appendReviewLogBestEffort(entry, "note");
    const markerUpdated = await this.markInboxReviewed(entry, "note");
    return this.appendMarkerNote(`Promoted inbox entry to note in ${path}`, markerUpdated);
  }
  async reopenFromReviewLog(entry) {
    const identity = {
      heading: entry.heading,
      body: "",
      preview: entry.preview,
      signature: entry.signature,
      signatureIndex: entry.signatureIndex
    };
    const reopened = await this.inboxService.reopenEntry(identity);
    if (!reopened) {
      throw new Error(`Could not re-open inbox entry ${entry.heading}`);
    }
    await this.appendReviewLogBestEffort(identity, "reopen");
    return `Re-opened inbox entry ${entry.heading}`;
  }
  async markInboxReviewed(entry, action) {
    try {
      return await this.inboxService.markEntryReviewed(entry, action);
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  appendMarkerNote(message, markerUpdated) {
    return markerUpdated ? message : `${message} (review marker not updated)`;
  }
  async appendReviewLogBestEffort(entry, action) {
    try {
      await this.reviewLogService.appendReviewLog(entry, action);
    } catch (error) {
      console.error(error);
    }
  }
};

// src/services/question-service.ts
var import_obsidian3 = require("obsidian");

// src/utils/format-helpers.ts
function formatListSection(items, emptyMessage, maxItems = 10) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, maxItems).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace(text) {
  return collapseWhitespace(text != null ? text : "");
}

// src/utils/question-answer-format.ts
function extractKeywords(question) {
  const stopwords = /* @__PURE__ */ new Set([
    "what",
    "why",
    "how",
    "which",
    "when",
    "where",
    "who",
    "whom",
    "does",
    "do",
    "did",
    "is",
    "are",
    "was",
    "were",
    "the",
    "a",
    "an",
    "to",
    "of",
    "for",
    "and",
    "or",
    "in",
    "on",
    "at",
    "with",
    "about",
    "from",
    "my",
    "our",
    "your",
    "this",
    "that",
    "these",
    "those",
    "make",
    "made",
    "need",
    "needs",
    "can",
    "could",
    "should",
    "would",
    "will",
    "have",
    "has",
    "had"
  ]);
  return Array.from(
    new Set(
      question.toLowerCase().split(/[^a-z0-9]+/g).map((word) => word.trim()).filter((word) => word.length >= 4 && !stopwords.has(word))
    )
  );
}
function matchesQuestion(line, keywords) {
  if (!keywords.length) {
    return false;
  }
  const lower = line.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}
function collectEvidence(content, question) {
  const evidence = /* @__PURE__ */ new Set();
  const keywords = extractKeywords(question);
  let matched = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ")) {
      continue;
    }
    if (/^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      if (headingText && (matchesQuestion(headingText, keywords) || evidence.size < 3)) {
        if (matchesQuestion(headingText, keywords)) {
          matched = true;
        }
        evidence.add(headingText);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText && (matchesQuestion(taskText, keywords) || evidence.size < 3)) {
        if (matchesQuestion(taskText, keywords)) {
          matched = true;
        }
        evidence.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText && (matchesQuestion(bulletText, keywords) || evidence.size < 4)) {
        if (matchesQuestion(bulletText, keywords)) {
          matched = true;
        }
        evidence.add(bulletText);
      }
      continue;
    }
    if (matchesQuestion(line, keywords) || evidence.size < 2) {
      if (matchesQuestion(line, keywords)) {
        matched = true;
      }
      evidence.add(safeCollapseWhitespace(line));
    }
  }
  return {
    evidence,
    matched
  };
}
function buildFallbackQuestionAnswer(question, content) {
  const cleanedQuestion = safeCollapseWhitespace(question);
  const { evidence, matched } = collectEvidence(content, cleanedQuestion);
  const answerLines = [];
  if (matched) {
    answerLines.push(
      "I found these lines in the selected context that directly match your question."
    );
    answerLines.push("The context does not provide a fully verified answer, so treat this as a grounded summary.");
  } else if (evidence.size) {
    answerLines.push(
      "I could not find a direct match in the selected context, so these are the closest lines available."
    );
    answerLines.push("Treat this as nearby context rather than a confirmed answer.");
  } else {
    answerLines.push("I could not find a direct answer in the selected context.");
    answerLines.push("Try narrowing the question or selecting a more specific note or folder.");
  }
  const followUps = matched || evidence.size ? /* @__PURE__ */ new Set([
    "Ask a narrower question if you want a more specific answer.",
    "Open the source note or folder for additional context."
  ]) : /* @__PURE__ */ new Set([
    "Provide more explicit context or select a different note or folder."
  ]);
  return [
    "# Answer",
    "",
    "## Question",
    cleanedQuestion || "No question provided.",
    "",
    "## Answer",
    answerLines.join(" "),
    "",
    "## Evidence",
    formatListSection(evidence, "No direct evidence found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified.")
  ].join("\n");
}

// src/utils/question-answer-normalize.ts
function normalizeQuestionAnswerOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "# Answer",
      "",
      "## Question",
      "No question provided.",
      "",
      "## Answer",
      "No answer content returned.",
      "",
      "## Evidence",
      "No answer content returned.",
      "",
      "## Follow-ups",
      "No answer content returned."
    ].join("\n");
  }
  const parsed = parseQuestionAnswerSections(trimmed);
  if (parsed) {
    return [
      "# Answer",
      "",
      "## Question",
      parsed.question || "No question provided.",
      "",
      "## Answer",
      parsed.answer || "No answer content returned.",
      "",
      "## Evidence",
      parsed.evidence || "No evidence extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context."
    ].join("\n");
  }
  return [
    "# Answer",
    "",
    "## Question",
    "No question provided.",
    "",
    "## Answer",
    trimmed,
    "",
    "## Evidence",
    "No evidence extracted.",
    "",
    "## Follow-ups",
    "Review the source context."
  ].join("\n");
}
function parseQuestionAnswerSections(content) {
  const sectionLines = {
    Question: [],
    Answer: [],
    Evidence: [],
    "Follow-ups": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Question|Answer|Evidence|Follow-ups)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.match(/^#\s+/)) {
        continue;
      }
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    question: trimSection([...preambleLines, ...sectionLines.Question]),
    answer: trimSection(sectionLines.Answer),
    evidence: trimSection(sectionLines.Evidence),
    followUps: trimSection(sectionLines["Follow-ups"])
  };
}
function canonicalSectionName(section) {
  const normalized = section.toLowerCase();
  if (normalized === "answer") {
    return "Answer";
  }
  if (normalized === "evidence") {
    return "Evidence";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Question";
}
function trimSection(lines) {
  return lines.join("\n").trim();
}

// src/services/question-service.ts
var QuestionService = class {
  constructor(aiService, settingsProvider) {
    this.aiService = aiService;
    this.settingsProvider = settingsProvider;
  }
  async answerQuestion(question, context) {
    const settings = this.settingsProvider();
    const fallback = buildFallbackQuestionAnswer(question, context.text);
    let content = fallback;
    let usedAI = false;
    if (settings.enableAISummaries) {
      const aiStatus = await getAIConfigurationStatus(settings);
      if (!aiStatus.configured) {
        new import_obsidian3.Notice(aiStatus.message);
      } else {
        try {
          content = await this.aiService.answerQuestion(question, context, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new import_obsidian3.Notice("Brain fell back to local question answering");
          content = fallback;
        }
      }
    }
    return {
      action: "Question Answer",
      title: "Answer",
      noteTitle: shortenQuestion(question),
      content: normalizeQuestionAnswerOutput(content),
      usedAI,
      promptText: question
    };
  }
};
function shortenQuestion(question) {
  const cleaned = question.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) {
    return cleaned || `Question ${formatDateTimeKey(/* @__PURE__ */ new Date())}`;
  }
  return `${cleaned.slice(0, 57).trimEnd()}...`;
}

// src/services/summary-service.ts
var import_obsidian4 = require("obsidian");

// src/utils/summary-format.ts
function cleanSummaryLine(text) {
  return (text != null ? text : "").replace(/\s+/g, " ").trim();
}
function formatTaskSection(items) {
  if (!items.size) {
    return "- No recent tasks found.";
  }
  return Array.from(items).slice(0, 8).map((item) => `- [ ] ${item}`).join("\n");
}
function buildFallbackSummary(content) {
  const highlights = /* @__PURE__ */ new Set();
  const tasks = /* @__PURE__ */ new Set();
  const followUps = /* @__PURE__ */ new Set();
  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ")) {
      continue;
    }
    if (/^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      highlights.add(cleanSummaryLine(heading[1]));
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const text = cleanSummaryLine(task[2]);
      tasks.add(text);
      followUps.add(text);
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = cleanSummaryLine(bullet[2]);
      if (text) {
        highlights.add(text);
      }
      continue;
    }
    if (highlights.size < 5 && line.length <= 140) {
      highlights.add(cleanSummaryLine(line));
    }
  }
  return [
    "## Highlights",
    formatListSection(highlights, "No recent notes found."),
    "",
    "## Tasks",
    formatTaskSection(tasks),
    "",
    "## Follow-ups",
    formatListSection(followUps, "Nothing pending from recent notes.")
  ].join("\n");
}

// src/services/summary-service.ts
var SummaryService = class {
  constructor(vaultService, aiService, settingsProvider) {
    this.vaultService = vaultService;
    this.aiService = aiService;
    this.settingsProvider = settingsProvider;
  }
  async generateSummary(lookbackDays, label) {
    const settings = this.settingsProvider();
    const effectiveLookbackDays = lookbackDays != null ? lookbackDays : settings.summaryLookbackDays;
    const cutoff = getWindowStart(effectiveLookbackDays).getTime();
    const files = await this.vaultService.collectMarkdownFiles({
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder],
      minMtime: cutoff
    });
    const content = await joinRecentFilesForSummary(
      this.vaultService,
      files,
      settings.summaryMaxChars
    );
    let summary = buildFallbackSummary(content);
    let usedAI = false;
    if (settings.enableAISummaries) {
      const aiStatus = await getAIConfigurationStatus(settings);
      if (!aiStatus.configured) {
        new import_obsidian4.Notice(aiStatus.message);
      } else {
        try {
          summary = await this.aiService.summarize(content || summary, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new import_obsidian4.Notice("Brain fell back to local summary");
        }
      }
    }
    let persistedPath;
    const title = label ? `${label} Summary` : "Summary";
    if (settings.persistSummaries) {
      const timestamp = formatSummaryTimestamp(/* @__PURE__ */ new Date());
      const fileLabel = label ? `${label.toLowerCase()}-${timestamp}` : timestamp;
      const requestedPath = `${settings.summariesFolder}/${fileLabel}.md`;
      const path = await this.vaultService.ensureUniqueFilePath(requestedPath);
      const displayTimestamp = formatDateTimeKey(/* @__PURE__ */ new Date());
      const body = [
        `# ${title} ${displayTimestamp}`,
        "",
        `## Window`,
        effectiveLookbackDays === 1 ? "Today" : `Last ${effectiveLookbackDays} days`,
        "",
        summary.trim()
      ].join("\n");
      await this.vaultService.appendText(path, body);
      persistedPath = path;
    }
    return {
      content: summary,
      persistedPath,
      usedAI,
      title
    };
  }
};

// src/services/synthesis-service.ts
var import_obsidian5 = require("obsidian");

// src/utils/context-format.ts
function formatContextLocation(context) {
  if (context.sourcePaths && context.sourcePaths.length > 0) {
    const count = context.sourcePaths.length;
    return `${context.sourceLabel} \u2022 ${count} ${count === 1 ? "file" : "files"}`;
  }
  if (context.sourcePath) {
    return `${context.sourceLabel} \u2022 ${context.sourcePath}`;
  }
  return context.sourceLabel;
}
function formatContextMetadataLines(context) {
  const lines = [`Context source: ${context.sourceLabel}`];
  if (context.sourcePath) {
    lines.push(`Context path: ${context.sourcePath}`);
  }
  if (context.sourcePaths && context.sourcePaths.length > 0) {
    lines.push("Context files:");
    const visible = context.sourcePaths.slice(0, 12);
    for (const path of visible) {
      lines.push(`- ${path}`);
    }
    if (context.sourcePaths.length > visible.length) {
      lines.push(`- ...and ${context.sourcePaths.length - visible.length} more`);
    }
  }
  if (context.truncated) {
    lines.push(
      `Context was truncated to ${context.maxChars} characters from ${context.originalLength}.`
    );
  }
  return lines;
}
function formatContextSourceLines(context) {
  const lines = [`Source: ${context.sourceLabel}`];
  if (context.sourcePath) {
    lines.push(`Source path: ${context.sourcePath}`);
  }
  if (context.sourcePaths && context.sourcePaths.length > 0) {
    lines.push("Source files:");
    const visible = context.sourcePaths.slice(0, 12);
    for (const path of visible) {
      lines.push(path);
    }
    if (context.sourcePaths.length > visible.length) {
      lines.push(`...and ${context.sourcePaths.length - visible.length} more`);
    }
  }
  if (context.truncated) {
    lines.push(
      `Context truncated to ${context.maxChars} characters from ${context.originalLength}.`
    );
  }
  return lines;
}

// src/utils/synthesis-format.ts
function addSummaryLine(summary, text, maxItems = 4) {
  if (summary.size >= maxItems) {
    return;
  }
  const cleaned = collapseWhitespace(text);
  if (!cleaned) {
    return;
  }
  summary.add(cleaned);
}
function buildFallbackSynthesis(content) {
  const summary = /* @__PURE__ */ new Set();
  const themes = /* @__PURE__ */ new Set();
  const followUps = /* @__PURE__ */ new Set();
  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      themes.add(headingText);
      addSummaryLine(summary, headingText);
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      followUps.add(taskText);
      themes.add(taskText);
      addSummaryLine(summary, taskText);
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      themes.add(bulletText);
      addSummaryLine(summary, bulletText);
      continue;
    }
    if (line.endsWith("?")) {
      followUps.add(safeCollapseWhitespace(line));
    }
    addSummaryLine(summary, line);
  }
  return [
    "## Summary",
    formatListSection(summary, "No source context found."),
    "",
    "## Key Themes",
    formatListSection(themes, "No key themes found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified.")
  ].join("\n");
}
function buildSynthesisNoteContent(result, context) {
  return [
    `Action: ${result.action}`,
    `Generated: ${formatDateTimeKey(/* @__PURE__ */ new Date())}`,
    `Context length: ${context.originalLength} characters.`,
    "",
    stripLeadingTitle(result.content),
    ""
  ].join("\n");
}
function buildInsertedSynthesisContent(result, context) {
  return [
    `## Brain ${result.title}`,
    ...formatContextSourceLines(context).map((line) => `- ${line}`),
    `- Generated: ${formatDateTimeKey(/* @__PURE__ */ new Date())}`,
    "",
    stripLeadingTitle(result.content)
  ].join("\n");
}

// src/utils/synthesis-normalize.ts
function normalizeSynthesisOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Summary",
      "No synthesis content returned.",
      "",
      "## Key Themes",
      "No synthesis content returned.",
      "",
      "## Follow-ups",
      "No synthesis content returned."
    ].join("\n");
  }
  const parsed = parseSynthesisSections(trimmed);
  if (parsed) {
    return [
      "## Summary",
      parsed.summary || "No synthesis content returned.",
      "",
      "## Key Themes",
      parsed.keyThemes || "No key themes extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context."
    ].join("\n");
  }
  return [
    "## Summary",
    trimmed,
    "",
    "## Key Themes",
    "No key themes extracted.",
    "",
    "## Follow-ups",
    "Review the source context."
  ].join("\n");
}
function parseSynthesisSections(content) {
  const sectionLines = {
    Summary: [],
    "Key Themes": [],
    "Follow-ups": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Summary|Key Themes|Follow-ups)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName2(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    summary: trimSection2([...preambleLines, ...sectionLines.Summary]),
    keyThemes: trimSection2(sectionLines["Key Themes"]),
    followUps: trimSection2(sectionLines["Follow-ups"])
  };
}
function canonicalSectionName2(section) {
  const normalized = section.toLowerCase();
  if (normalized === "key themes") {
    return "Key Themes";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Summary";
}
function trimSection2(lines) {
  return lines.join("\n").trim();
}

// src/utils/task-extract-format.ts
function buildFallbackTaskExtraction(content) {
  const tasks = /* @__PURE__ */ new Set();
  const context = /* @__PURE__ */ new Set();
  const followUps = /* @__PURE__ */ new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        tasks.add(taskText);
        followUps.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        context.add(bulletText);
      }
      continue;
    }
    if (line.endsWith("?")) {
      const question = safeCollapseWhitespace(line);
      if (question) {
        followUps.add(question);
      }
    }
  }
  return [
    "## Tasks",
    formatListSection(tasks, "No tasks found."),
    "",
    "## Context",
    formatListSection(context, "No supporting context found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified.")
  ].join("\n");
}

// src/utils/task-extract-normalize.ts
function normalizeTaskExtractionOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Tasks",
      "No task content returned.",
      "",
      "## Context",
      "No task content returned.",
      "",
      "## Follow-ups",
      "No task content returned."
    ].join("\n");
  }
  const parsed = parseTaskExtractionSections(trimmed);
  if (parsed) {
    return [
      "## Tasks",
      parsed.tasks || "No tasks extracted.",
      "",
      "## Context",
      parsed.context || "No supporting context extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context."
    ].join("\n");
  }
  return [
    "## Tasks",
    trimmed,
    "",
    "## Context",
    "No supporting context extracted.",
    "",
    "## Follow-ups",
    "Review the source context."
  ].join("\n");
}
function parseTaskExtractionSections(content) {
  const sectionLines = {
    Tasks: [],
    Context: [],
    "Follow-ups": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Tasks|Context|Follow-ups)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName3(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    tasks: trimSection3(sectionLines.Tasks),
    context: trimSection3([...preambleLines, ...sectionLines.Context]),
    followUps: trimSection3(sectionLines["Follow-ups"])
  };
}
function canonicalSectionName3(section) {
  const normalized = section.toLowerCase();
  if (normalized === "context") {
    return "Context";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Tasks";
}
function trimSection3(lines) {
  return lines.join("\n").trim();
}

// src/utils/decision-extract-format.ts
function looksLikeRationale(text) {
  const lower = text.toLowerCase();
  return lower.includes("because") || lower.includes("so that") || lower.includes("due to") || lower.includes("reason") || lower.includes("tradeoff") || lower.includes("constraint");
}
function looksLikeDecision(text) {
  const lower = text.toLowerCase();
  return lower.includes("decide") || lower.includes("decision") || lower.includes("choose") || lower.includes("ship") || lower.includes("adopt") || lower.includes("drop") || lower.includes("switch");
}
function buildFallbackDecisionExtraction(content) {
  const decisions = /* @__PURE__ */ new Set();
  const rationale = /* @__PURE__ */ new Set();
  const openQuestions = /* @__PURE__ */ new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const text = safeCollapseWhitespace(heading[1]);
      if (text.endsWith("?")) {
        openQuestions.add(text);
      } else if (looksLikeDecision(text)) {
        decisions.add(text);
      } else if (looksLikeRationale(text)) {
        rationale.add(text);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const text = safeCollapseWhitespace(task[2]);
      decisions.add(text);
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = safeCollapseWhitespace(bullet[2]);
      if (!text) {
        continue;
      }
      if (text.endsWith("?")) {
        openQuestions.add(text);
      } else if (looksLikeDecision(text)) {
        decisions.add(text);
      } else if (looksLikeRationale(text)) {
        rationale.add(text);
      } else if (decisions.size < 3) {
        decisions.add(text);
      } else {
        rationale.add(text);
      }
      continue;
    }
    if (line.endsWith("?")) {
      openQuestions.add(safeCollapseWhitespace(line));
      continue;
    }
    if (looksLikeDecision(line)) {
      decisions.add(safeCollapseWhitespace(line));
    } else if (looksLikeRationale(line)) {
      rationale.add(safeCollapseWhitespace(line));
    }
  }
  return [
    "## Decisions",
    formatListSection(decisions, "No clear decisions found."),
    "",
    "## Rationale",
    formatListSection(rationale, "No explicit rationale found."),
    "",
    "## Open Questions",
    formatListSection(openQuestions, "No open questions identified.")
  ].join("\n");
}

// src/utils/decision-extract-normalize.ts
function normalizeDecisionExtractionOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Decisions",
      "No decision content returned.",
      "",
      "## Rationale",
      "No decision content returned.",
      "",
      "## Open Questions",
      "No decision content returned."
    ].join("\n");
  }
  const parsed = parseDecisionSections(trimmed);
  if (parsed) {
    return [
      "## Decisions",
      parsed.decisions || "No clear decisions extracted.",
      "",
      "## Rationale",
      parsed.rationale || "No rationale extracted.",
      "",
      "## Open Questions",
      parsed.openQuestions || "Review the source context."
    ].join("\n");
  }
  return [
    "## Decisions",
    trimmed,
    "",
    "## Rationale",
    "No rationale extracted.",
    "",
    "## Open Questions",
    "Review the source context."
  ].join("\n");
}
function parseDecisionSections(content) {
  const sectionLines = {
    Decisions: [],
    Rationale: [],
    "Open Questions": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Decisions|Rationale|Open Questions)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName4(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    decisions: trimSection4([...preambleLines, ...sectionLines.Decisions]),
    rationale: trimSection4(sectionLines.Rationale),
    openQuestions: trimSection4(sectionLines["Open Questions"])
  };
}
function canonicalSectionName4(section) {
  const normalized = section.toLowerCase();
  if (normalized === "rationale") {
    return "Rationale";
  }
  if (normalized === "open questions") {
    return "Open Questions";
  }
  return "Decisions";
}
function trimSection4(lines) {
  return lines.join("\n").trim();
}

// src/utils/open-questions-format.ts
function looksLikeQuestion(text) {
  const lower = text.toLowerCase();
  return lower.endsWith("?") || lower.includes("question") || lower.includes("unclear") || lower.includes("unknown") || lower.includes("not sure");
}
function looksLikeFollowUp(text) {
  const lower = text.toLowerCase();
  return lower.includes("follow up") || lower.includes("next step") || lower.includes("investigate") || lower.includes("confirm") || lower.includes("validate");
}
function buildFallbackOpenQuestions(content) {
  const openQuestions = /* @__PURE__ */ new Set();
  const context = /* @__PURE__ */ new Set();
  const followUps = /* @__PURE__ */ new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const text = safeCollapseWhitespace(heading[1]);
      if (!text) {
        continue;
      }
      if (looksLikeQuestion(text)) {
        openQuestions.add(text);
      } else {
        context.add(text);
      }
      if (looksLikeFollowUp(text)) {
        followUps.add(text);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const text = safeCollapseWhitespace(task[2]);
      if (text) {
        followUps.add(text);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = safeCollapseWhitespace(bullet[2]);
      if (!text) {
        continue;
      }
      if (looksLikeQuestion(text)) {
        openQuestions.add(text);
      } else if (context.size < 6) {
        context.add(text);
      }
      if (looksLikeFollowUp(text)) {
        followUps.add(text);
      }
      continue;
    }
    if (looksLikeQuestion(line)) {
      openQuestions.add(safeCollapseWhitespace(line));
      continue;
    }
    if (context.size < 4) {
      context.add(safeCollapseWhitespace(line));
    }
  }
  return [
    "## Open Questions",
    formatListSection(openQuestions, "No open questions found."),
    "",
    "## Context",
    formatListSection(context, "No supporting context found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified.")
  ].join("\n");
}

// src/utils/open-questions-normalize.ts
function normalizeOpenQuestionsOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Open Questions",
      "No open-question content returned.",
      "",
      "## Context",
      "No open-question content returned.",
      "",
      "## Follow-ups",
      "No open-question content returned."
    ].join("\n");
  }
  const parsed = parseOpenQuestionSections(trimmed);
  if (parsed) {
    return [
      "## Open Questions",
      parsed.openQuestions || "No open questions extracted.",
      "",
      "## Context",
      parsed.context || "No supporting context extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review the source context."
    ].join("\n");
  }
  return [
    "## Open Questions",
    trimmed,
    "",
    "## Context",
    "No supporting context extracted.",
    "",
    "## Follow-ups",
    "Review the source context."
  ].join("\n");
}
function parseOpenQuestionSections(content) {
  const sectionLines = {
    "Open Questions": [],
    Context: [],
    "Follow-ups": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Open Questions|Context|Follow-ups)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName5(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    openQuestions: trimSection5([...preambleLines, ...sectionLines["Open Questions"]]),
    context: trimSection5(sectionLines.Context),
    followUps: trimSection5(sectionLines["Follow-ups"])
  };
}
function canonicalSectionName5(section) {
  const normalized = section.toLowerCase();
  if (normalized === "context") {
    return "Context";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Open Questions";
}
function trimSection5(lines) {
  return lines.join("\n").trim();
}

// src/utils/clean-note-format.ts
function buildFallbackCleanNote(content) {
  const overview = /* @__PURE__ */ new Set();
  const keyPoints = /* @__PURE__ */ new Set();
  const questions = /* @__PURE__ */ new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      if (headingText) {
        overview.add(headingText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        keyPoints.add(bulletText);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        keyPoints.add(taskText);
      }
      continue;
    }
    if (line.endsWith("?")) {
      const question = safeCollapseWhitespace(line);
      if (question) {
        questions.add(question);
      }
      continue;
    }
    if (overview.size < 4) {
      overview.add(safeCollapseWhitespace(line));
    }
  }
  return [
    "# Clean Note",
    "",
    "## Overview",
    formatListSection(overview, "No overview found."),
    "",
    "## Key Points",
    formatListSection(keyPoints, "No key points found."),
    "",
    "## Open Questions",
    formatListSection(questions, "No open questions found.")
  ].join("\n");
}

// src/utils/clean-note-normalize.ts
function normalizeCleanNoteOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "# Clean Note",
      "",
      "## Overview",
      "No synthesis content returned.",
      "",
      "## Key Points",
      "No synthesis content returned.",
      "",
      "## Open Questions",
      "No synthesis content returned."
    ].join("\n");
  }
  const parsed = parseCleanNoteSections(trimmed);
  if (parsed) {
    return [
      "# Clean Note",
      "",
      "## Overview",
      parsed.overview || "No overview extracted.",
      "",
      "## Key Points",
      parsed.keyPoints || "No key points extracted.",
      "",
      "## Open Questions",
      parsed.questions || "No open questions extracted."
    ].join("\n");
  }
  return [
    "# Clean Note",
    "",
    "## Overview",
    trimmed,
    "",
    "## Key Points",
    "No key points extracted.",
    "",
    "## Open Questions",
    "No open questions extracted."
  ].join("\n");
}
function parseCleanNoteSections(content) {
  const sectionLines = {
    Overview: [],
    "Key Points": [],
    "Open Questions": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Overview|Key Points|Open Questions)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName6(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.match(/^#\s+/)) {
        continue;
      }
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    overview: trimSection6([...preambleLines, ...sectionLines.Overview]),
    keyPoints: trimSection6(sectionLines["Key Points"]),
    questions: trimSection6(sectionLines["Open Questions"])
  };
}
function canonicalSectionName6(section) {
  const normalized = section.toLowerCase();
  if (normalized === "key points") {
    return "Key Points";
  }
  if (normalized === "open questions") {
    return "Open Questions";
  }
  return "Overview";
}
function trimSection6(lines) {
  return lines.join("\n").trim();
}

// src/utils/project-brief-format.ts
function buildFallbackProjectBrief(content) {
  const overview = /* @__PURE__ */ new Set();
  const goals = /* @__PURE__ */ new Set();
  const scope = /* @__PURE__ */ new Set();
  const nextSteps = /* @__PURE__ */ new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      if (headingText) {
        overview.add(headingText);
        scope.add(headingText);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        nextSteps.add(taskText);
        goals.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        scope.add(bulletText);
        if (looksLikeGoal(bulletText)) {
          goals.add(bulletText);
        }
      }
      continue;
    }
    if (looksLikeGoal(line)) {
      goals.add(safeCollapseWhitespace(line));
    } else if (overview.size < 4) {
      overview.add(safeCollapseWhitespace(line));
    }
  }
  return [
    "# Project Brief",
    "",
    "## Overview",
    formatListSection(overview, "No overview found."),
    "",
    "## Goals",
    formatListSection(goals, "No goals found."),
    "",
    "## Scope",
    formatListSection(scope, "No scope found."),
    "",
    "## Next Steps",
    formatListSection(nextSteps, "No next steps found.")
  ].join("\n");
}
function looksLikeGoal(text) {
  const lower = text.toLowerCase();
  return lower.startsWith("goal ") || lower.startsWith("goals ") || lower.startsWith("need ") || lower.startsWith("needs ") || lower.startsWith("want ") || lower.startsWith("wants ") || lower.includes("should ") || lower.includes("must ") || lower.includes("objective");
}

// src/utils/project-brief-normalize.ts
function normalizeProjectBriefOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "# Project Brief",
      "",
      "## Overview",
      "No synthesis content returned.",
      "",
      "## Goals",
      "No synthesis content returned.",
      "",
      "## Scope",
      "No synthesis content returned.",
      "",
      "## Next Steps",
      "No synthesis content returned."
    ].join("\n");
  }
  const parsed = parseProjectBriefSections(trimmed);
  if (parsed) {
    return [
      "# Project Brief",
      "",
      "## Overview",
      parsed.overview || "No overview extracted.",
      "",
      "## Goals",
      parsed.goals || "No goals extracted.",
      "",
      "## Scope",
      parsed.scope || "No scope extracted.",
      "",
      "## Next Steps",
      parsed.nextSteps || "No next steps extracted."
    ].join("\n");
  }
  return [
    "# Project Brief",
    "",
    "## Overview",
    trimmed,
    "",
    "## Goals",
    "No goals extracted.",
    "",
    "## Scope",
    "No scope extracted.",
    "",
    "## Next Steps",
    "No next steps extracted."
  ].join("\n");
}
function parseProjectBriefSections(content) {
  const sectionLines = {
    Overview: [],
    Goals: [],
    Scope: [],
    "Next Steps": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Overview|Goals|Scope|Next Steps)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName7(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.match(/^#\s+/)) {
        continue;
      }
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    overview: trimSection7([...preambleLines, ...sectionLines.Overview]),
    goals: trimSection7(sectionLines.Goals),
    scope: trimSection7(sectionLines.Scope),
    nextSteps: trimSection7(sectionLines["Next Steps"])
  };
}
function canonicalSectionName7(section) {
  const normalized = section.toLowerCase();
  if (normalized === "goals") {
    return "Goals";
  }
  if (normalized === "scope") {
    return "Scope";
  }
  if (normalized === "next steps") {
    return "Next Steps";
  }
  return "Overview";
}
function trimSection7(lines) {
  return lines.join("\n").trim();
}

// src/utils/synthesis-template.ts
function getSynthesisTemplateTitle(template) {
  if (template === "extract-tasks") {
    return "Task Extraction";
  }
  if (template === "extract-decisions") {
    return "Decision Extraction";
  }
  if (template === "extract-open-questions") {
    return "Open Questions";
  }
  if (template === "rewrite-clean-note") {
    return "Clean Note";
  }
  if (template === "draft-project-brief") {
    return "Project Brief";
  }
  return "Summary";
}
function getSynthesisTemplateButtonLabel(template) {
  if (template === "extract-tasks") {
    return "Extract Tasks";
  }
  if (template === "extract-decisions") {
    return "Extract Decisions";
  }
  if (template === "extract-open-questions") {
    return "Extract Open Questions";
  }
  if (template === "rewrite-clean-note") {
    return "Rewrite as Clean Note";
  }
  if (template === "draft-project-brief") {
    return "Draft Project Brief";
  }
  return "Summarize";
}

// src/services/synthesis-service.ts
var SynthesisService = class {
  constructor(aiService, settingsProvider) {
    this.aiService = aiService;
    this.settingsProvider = settingsProvider;
  }
  async run(template, context) {
    const settings = this.settingsProvider();
    const fallback = this.buildFallback(template, context.text);
    let content = fallback;
    let usedAI = false;
    if (settings.enableAISummaries) {
      const aiStatus = await getAIConfigurationStatus(settings);
      if (!aiStatus.configured) {
        new import_obsidian5.Notice(aiStatus.message);
      } else {
        try {
          content = await this.aiService.synthesizeContext(template, context, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new import_obsidian5.Notice("Brain fell back to local synthesis");
          content = fallback;
        }
      }
    }
    return {
      action: getSynthesisTemplateTitle(template),
      title: getSynthesisTemplateTitle(template),
      noteTitle: `${context.sourceLabel} ${getSynthesisTemplateTitle(template)}`,
      content: this.normalize(template, content),
      usedAI
    };
  }
  buildFallback(template, text) {
    if (template === "extract-tasks") {
      return buildFallbackTaskExtraction(text);
    }
    if (template === "extract-decisions") {
      return buildFallbackDecisionExtraction(text);
    }
    if (template === "extract-open-questions") {
      return buildFallbackOpenQuestions(text);
    }
    if (template === "rewrite-clean-note") {
      return buildFallbackCleanNote(text);
    }
    if (template === "draft-project-brief") {
      return buildFallbackProjectBrief(text);
    }
    return buildFallbackSynthesis(text);
  }
  normalize(template, content) {
    if (template === "extract-tasks") {
      return normalizeTaskExtractionOutput(content);
    }
    if (template === "extract-decisions") {
      return normalizeDecisionExtractionOutput(content);
    }
    if (template === "extract-open-questions") {
      return normalizeOpenQuestionsOutput(content);
    }
    if (template === "rewrite-clean-note") {
      return normalizeCleanNoteOutput(content);
    }
    if (template === "draft-project-brief") {
      return normalizeProjectBriefOutput(content);
    }
    return normalizeSynthesisOutput(content);
  }
};

// src/services/topic-page-service.ts
var import_obsidian6 = require("obsidian");

// src/utils/topic-page-format.ts
function looksLikeOpenQuestion(text) {
  const lower = text.toLowerCase();
  return lower.endsWith("?") || lower.includes("question") || lower.includes("unclear") || lower.includes("open issue") || lower.includes("unknown");
}
function looksLikeNextStep(text) {
  const lower = text.toLowerCase();
  return lower.startsWith("next ") || lower.startsWith("follow up") || lower.startsWith("follow-up") || lower.startsWith("todo ") || lower.startsWith("to-do ") || lower.includes("should ") || lower.includes("need ") || lower.includes("needs ") || lower.includes("must ") || lower.includes("action");
}
function formatSources(sourceLabel, sourcePath, sourcePaths) {
  const sources = /* @__PURE__ */ new Set();
  if (sourcePaths && sourcePaths.length > 0) {
    for (const path of sourcePaths.slice(0, 12)) {
      sources.add(path);
    }
    if (sourcePaths.length > 12) {
      sources.add(`...and ${sourcePaths.length - 12} more`);
    }
  } else if (sourcePath) {
    sources.add(sourcePath);
  } else {
    sources.add(sourceLabel);
  }
  return formatListSection(sources, "No explicit sources found.");
}
function buildFallbackTopicPage(topic, content, sourceLabel, sourcePath, sourcePaths) {
  const overview = /* @__PURE__ */ new Set();
  const evidence = /* @__PURE__ */ new Set();
  const openQuestions = /* @__PURE__ */ new Set();
  const nextSteps = /* @__PURE__ */ new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("--- ") || /^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      if (headingText) {
        overview.add(headingText);
        if (looksLikeOpenQuestion(headingText)) {
          openQuestions.add(headingText);
        }
        if (looksLikeNextStep(headingText)) {
          nextSteps.add(headingText);
        }
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText) {
        evidence.add(taskText);
        nextSteps.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText) {
        evidence.add(bulletText);
        if (looksLikeOpenQuestion(bulletText)) {
          openQuestions.add(bulletText);
        }
        if (looksLikeNextStep(bulletText)) {
          nextSteps.add(bulletText);
        }
      }
      continue;
    }
    if (looksLikeOpenQuestion(line)) {
      const question = safeCollapseWhitespace(line);
      if (question) {
        openQuestions.add(question);
      }
      continue;
    }
    if (overview.size < 4) {
      overview.add(safeCollapseWhitespace(line));
    } else if (evidence.size < 4) {
      evidence.add(safeCollapseWhitespace(line));
    }
  }
  if (!nextSteps.size) {
    nextSteps.add("Review the source context.");
  }
  return [
    "## Overview",
    `- Topic: ${safeCollapseWhitespace(topic)}`,
    formatListSection(overview, "No overview found."),
    "",
    "## Evidence",
    formatListSection(evidence, "No evidence found."),
    "",
    "## Open Questions",
    formatListSection(openQuestions, "No open questions found."),
    "",
    "## Sources",
    formatSources(sourceLabel, sourcePath, sourcePaths),
    "",
    "## Next Steps",
    formatListSection(nextSteps, "Review the source context.")
  ].join("\n");
}

// src/utils/topic-page-normalize.ts
function normalizeTopicPageOutput(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Overview",
      "No topic page content returned.",
      "",
      "## Evidence",
      "No topic page content returned.",
      "",
      "## Open Questions",
      "No topic page content returned.",
      "",
      "## Sources",
      "No topic page content returned.",
      "",
      "## Next Steps",
      "No topic page content returned."
    ].join("\n");
  }
  const parsed = parseTopicPageSections(trimmed);
  if (parsed) {
    return [
      "## Overview",
      parsed.overview || "No overview extracted.",
      "",
      "## Evidence",
      parsed.evidence || "No evidence extracted.",
      "",
      "## Open Questions",
      parsed.openQuestions || "No open questions extracted.",
      "",
      "## Sources",
      parsed.sources || "No sources extracted.",
      "",
      "## Next Steps",
      parsed.nextSteps || "Review the source context."
    ].join("\n");
  }
  return [
    "## Overview",
    trimmed,
    "",
    "## Evidence",
    "No evidence extracted.",
    "",
    "## Open Questions",
    "No open questions extracted.",
    "",
    "## Sources",
    "No sources extracted.",
    "",
    "## Next Steps",
    "Review the source context."
  ].join("\n");
}
function parseTopicPageSections(content) {
  const sectionLines = {
    Overview: [],
    Evidence: [],
    "Open Questions": [],
    Sources: [],
    "Next Steps": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(
      /^##\s+(Overview|Evidence|Open Questions|Sources|Next Steps)\s*$/i
    );
    if (heading) {
      currentSection = canonicalSectionName8(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.match(/^#\s+/)) {
        continue;
      }
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    overview: trimSection8([...preambleLines, ...sectionLines.Overview]),
    evidence: trimSection8(sectionLines.Evidence),
    openQuestions: trimSection8(sectionLines["Open Questions"]),
    sources: trimSection8(sectionLines.Sources),
    nextSteps: trimSection8(sectionLines["Next Steps"])
  };
}
function canonicalSectionName8(section) {
  const normalized = section.toLowerCase();
  if (normalized === "evidence") {
    return "Evidence";
  }
  if (normalized === "open questions") {
    return "Open Questions";
  }
  if (normalized === "sources") {
    return "Sources";
  }
  if (normalized === "next steps") {
    return "Next Steps";
  }
  return "Overview";
}
function trimSection8(lines) {
  return lines.join("\n").trim();
}

// src/services/topic-page-service.ts
var TopicPageService = class {
  constructor(aiService, settingsProvider) {
    this.aiService = aiService;
    this.settingsProvider = settingsProvider;
  }
  async createTopicPage(topic, context) {
    const settings = this.settingsProvider();
    const cleanedTopic = collapseWhitespace(topic);
    if (!cleanedTopic) {
      throw new Error("Topic cannot be empty");
    }
    const fallback = buildFallbackTopicPage(
      cleanedTopic,
      context.text,
      context.sourceLabel,
      context.sourcePath,
      context.sourcePaths
    );
    let content = fallback;
    let usedAI = false;
    if (settings.enableAISummaries) {
      const aiStatus = await getAIConfigurationStatus(settings);
      if (!aiStatus.configured) {
        new import_obsidian6.Notice(aiStatus.message);
      } else {
        try {
          content = await this.aiService.createTopicPage(cleanedTopic, context, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new import_obsidian6.Notice("Brain fell back to local topic page generation");
          content = fallback;
        }
      }
    }
    const normalizedContent = ensureTopicBullet(
      normalizeTopicPageOutput(content),
      cleanedTopic
    );
    return {
      action: "Topic Page",
      title: "Topic Page",
      noteTitle: shortenTopic(cleanedTopic),
      content: normalizedContent,
      usedAI,
      promptText: cleanedTopic
    };
  }
};
function ensureTopicBullet(content, topic) {
  const normalizedTopic = collapseWhitespace(topic);
  const lines = content.split("\n");
  const overviewIndex = lines.findIndex((line) => /^##\s+Overview\s*$/.test(line));
  if (overviewIndex === -1) {
    return content;
  }
  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > overviewIndex && /^##\s+/.test(line)
  );
  const topicLine = `- Topic: ${normalizedTopic}`;
  const overviewSlice = lines.slice(
    overviewIndex + 1,
    nextHeadingIndex === -1 ? lines.length : nextHeadingIndex
  );
  if (overviewSlice.some((line) => line.trim().toLowerCase().startsWith("- topic:"))) {
    return content;
  }
  const insertionIndex = overviewIndex + 1;
  const updated = [...lines];
  updated.splice(insertionIndex, 0, topicLine);
  return updated.join("\n");
}
function shortenTopic(topic) {
  const cleaned = topic.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) {
    return cleaned || `Topic ${formatDateTimeKey(/* @__PURE__ */ new Date())}`;
  }
  return `${cleaned.slice(0, 57).trimEnd()}...`;
}

// src/services/task-service.ts
var TaskService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
    this.openTaskCountCache = null;
  }
  async appendTask(text) {
    const settings = this.settingsProvider();
    const cleaned = collapseWhitespace(text);
    if (!cleaned) {
      throw new Error("Task text cannot be empty");
    }
    const block = `- [ ] ${cleaned} _(added ${formatDateTimeKey(/* @__PURE__ */ new Date())})_`;
    await this.vaultService.appendText(settings.tasksFile, block);
    this.openTaskCountCache = null;
    return { path: settings.tasksFile };
  }
  async getOpenTaskCount() {
    const settings = this.settingsProvider();
    const { text, mtime, exists } = await this.vaultService.readTextWithMtime(settings.tasksFile);
    if (!exists) {
      this.openTaskCountCache = {
        mtime: 0,
        count: 0
      };
      return 0;
    }
    if (this.openTaskCountCache && this.openTaskCountCache.mtime === mtime) {
      return this.openTaskCountCache.count;
    }
    const count = text.split("\n").map((line) => line.trim()).filter((line) => /^- \[( |x|X)\]/.test(line)).filter((line) => !/^- \[(x|X)\]/.test(line)).length;
    this.openTaskCountCache = {
      mtime,
      count
    };
    return count;
  }
};

// src/services/ai-service.ts
var import_obsidian7 = require("obsidian");

// src/utils/summary-normalize.ts
function normalizeSummary(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    return [
      "## Highlights",
      "No summary content returned.",
      "",
      "## Tasks",
      "No summary content returned.",
      "",
      "## Follow-ups",
      "No summary content returned."
    ].join("\n");
  }
  const parsed = parseSummarySections(trimmed);
  if (parsed) {
    return [
      "## Highlights",
      parsed.highlights || "No summary content returned.",
      "",
      "## Tasks",
      parsed.tasks || "No tasks extracted.",
      "",
      "## Follow-ups",
      parsed.followUps || "Review recent notes."
    ].join("\n");
  }
  return [
    "## Highlights",
    trimmed,
    "",
    "## Tasks",
    "No tasks extracted.",
    "",
    "## Follow-ups",
    "Review recent notes."
  ].join("\n");
}
function parseSummarySections(content) {
  const sectionLines = {
    Highlights: [],
    Tasks: [],
    "Follow-ups": []
  };
  const preambleLines = [];
  let currentSection = null;
  let sawHeading = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Highlights|Tasks|Follow-ups)\s*$/i);
    if (heading) {
      currentSection = canonicalSectionName9(heading[1]);
      sawHeading = true;
      continue;
    }
    if (!sawHeading) {
      if (line.trim()) {
        preambleLines.push(line);
      }
      continue;
    }
    if (currentSection) {
      sectionLines[currentSection].push(line);
    }
  }
  if (!sawHeading) {
    return null;
  }
  return {
    highlights: trimSection9([...preambleLines, ...sectionLines.Highlights]),
    tasks: trimSection9(sectionLines.Tasks),
    followUps: trimSection9(sectionLines["Follow-ups"])
  };
}
function canonicalSectionName9(section) {
  const normalized = section.toLowerCase();
  if (normalized === "tasks") {
    return "Tasks";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Highlights";
}
function trimSection9(lines) {
  return lines.join("\n").trim();
}

// src/services/ai-service.ts
var BrainAIService = class {
  constructor() {
  }
  async summarize(text, settings) {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content: "You summarize markdown vault content. Respond with concise markdown using the requested sections only."
      },
      {
        role: "user",
        content: [
          "Summarize the following vault content into exactly these sections:",
          "",
          "## Highlights",
          "## Tasks",
          "## Follow-ups",
          "",
          "Be concise, do not invent facts, and preserve actionable tasks.",
          "",
          text
        ].join("\n")
      }
    ]);
    return normalizeSummary(response);
  }
  async synthesizeContext(template, context, settings) {
    const prompt = this.buildPrompt(template, context);
    const response = await this.postChatCompletion(settings, prompt);
    return this.normalize(template, response);
  }
  async routeText(text, settings) {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content: "Classify capture text into exactly one of: note, task, journal. Return one word only."
      },
      {
        role: "user",
        content: [
          "Classify the following user input as exactly one of:",
          "note",
          "task",
          "journal",
          "",
          "Return only one word.",
          "",
          text
        ].join("\n")
      }
    ]);
    const cleaned = response.trim().toLowerCase();
    if (cleaned === "note" || cleaned === "task" || cleaned === "journal") {
      return cleaned;
    }
    return null;
  }
  async answerQuestion(question, context, settings) {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content: "You answer questions using explicit markdown vault context only. Respond with concise markdown using the requested sections only and do not invent facts."
      },
      {
        role: "user",
        content: [
          "Answer the following question using only the context below.",
          "",
          `Question: ${question}`,
          "",
          "Return exactly these sections:",
          "",
          "# Answer",
          "## Question",
          "## Answer",
          "## Evidence",
          "## Follow-ups",
          "",
          "If the context is insufficient, say so explicitly.",
          "",
          ...formatContextMetadataLines(context),
          "",
          context.text
        ].filter(Boolean).join("\n")
      }
    ]);
    return normalizeQuestionAnswerOutput(response);
  }
  async createTopicPage(topic, context, settings) {
    const response = await this.postChatCompletion(settings, [
      {
        role: "system",
        content: "You turn explicit markdown vault context into a durable wiki page. Respond with the requested sections only and do not invent facts."
      },
      {
        role: "user",
        content: [
          `Create a topic page for: ${topic}`,
          "",
          "Return exactly these sections:",
          "",
          "## Overview",
          `- Topic: ${topic}`,
          "## Evidence",
          "## Open Questions",
          "## Sources",
          "## Next Steps",
          "",
          "Be concise, do not invent facts, and keep the page reusable.",
          "",
          ...formatContextMetadataLines(context),
          "",
          context.text
        ].filter(Boolean).join("\n")
      }
    ]);
    return normalizeTopicPageOutput(response);
  }
  async postChatCompletion(settings, messages) {
    if (settings.aiProvider === "codex") {
      return this.postCodexCompletion(settings, messages);
    }
    if (settings.aiProvider === "gemini") {
      return this.postGeminiCompletion(settings, messages);
    }
    return this.postOpenAICompletion(settings, messages);
  }
  async postCodexCompletion(settings, messages) {
    const { execFileAsync, fs, os, path } = getCodexRuntime();
    const codexBinary = await getCodexBinaryPath();
    if (!codexBinary) {
      throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
    }
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "brain-codex-"));
    const outputFile = path.join(tempDir, "response.txt");
    const args = [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputFile
    ];
    if (settings.codexModel.trim()) {
      args.push("--model", settings.codexModel.trim());
    }
    args.push(this.buildCodexPrompt(messages));
    try {
      await execFileAsync(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir
      });
      const content = await fs.readFile(outputFile, "utf8");
      if (!content.trim()) {
        throw new Error("Codex returned an empty response");
      }
      return content.trim();
    } catch (error) {
      if (isEnoentError2(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => void 0);
    }
  }
  buildCodexPrompt(messages) {
    return [
      "You are responding inside Brain, an Obsidian plugin.",
      "Do not run shell commands, inspect the filesystem, or modify files.",
      "Use only the content provided below and answer with markdown only.",
      "",
      ...messages.map((message) => `${message.role.toUpperCase()}:
${message.content}`)
    ].join("\n\n");
  }
  async postOpenAICompletion(settings, messages) {
    var _a, _b, _c, _d;
    const isDefaultUrl = !settings.openAIBaseUrl || settings.openAIBaseUrl.includes("api.openai.com");
    if (isDefaultUrl && !settings.openAIApiKey.trim()) {
      throw new Error("OpenAI API key is missing");
    }
    const headers = {
      "Content-Type": "application/json"
    };
    if (settings.openAIApiKey.trim()) {
      headers["Authorization"] = `Bearer ${settings.openAIApiKey.trim()}`;
    }
    const result = await (0, import_obsidian7.requestUrl)({
      url: settings.openAIBaseUrl.trim() || "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers,
      body: JSON.stringify({
        model: settings.openAIModel.trim(),
        messages,
        temperature: 0.2
      })
    });
    const json = result.json;
    const content = (_d = (_c = (_b = (_a = json.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content) != null ? _d : "";
    if (!content.trim()) {
      throw new Error("OpenAI returned an empty response");
    }
    return content.trim();
  }
  async postGeminiCompletion(settings, messages) {
    var _a, _b, _c, _d, _e, _f;
    if (!settings.geminiApiKey.trim()) {
      throw new Error("Gemini API key is missing");
    }
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");
    const contents = userMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));
    const body = {
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    };
    if (systemMessage) {
      body.system_instruction = {
        parts: [{ text: systemMessage.content }]
      };
    }
    const result = await (0, import_obsidian7.requestUrl)({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel}:generateContent?key=${settings.geminiApiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const json = result.json;
    const content = (_f = (_e = (_d = (_c = (_b = (_a = json.candidates) == null ? void 0 : _a[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text) != null ? _f : "";
    if (!content.trim()) {
      throw new Error("Gemini returned an empty response");
    }
    return content.trim();
  }
  buildPrompt(template, context) {
    if (template === "extract-tasks") {
      return [
        {
          role: "system",
          content: "You extract actionable tasks from explicit markdown vault context. Respond with the requested sections only."
        },
        {
          role: "user",
          content: [
            "Extract tasks from the following context into exactly these sections:",
            "",
            "## Tasks",
            "## Context",
            "## Follow-ups",
            "",
            "Be concise, do not invent facts, and preserve actionable items.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text
          ].filter(Boolean).join("\n")
        }
      ];
    }
    if (template === "rewrite-clean-note") {
      return [
        {
          role: "system",
          content: "You rewrite explicit markdown vault context into a clean markdown note. Respond with the requested sections only."
        },
        {
          role: "user",
          content: [
            "Rewrite the following context into exactly these sections:",
            "",
            "# Clean Note",
            "## Overview",
            "## Key Points",
            "## Open Questions",
            "",
            "Be concise, do not invent facts, and preserve the structure of a reusable note.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text
          ].filter(Boolean).join("\n")
        }
      ];
    }
    if (template === "extract-decisions") {
      return [
        {
          role: "system",
          content: "You extract decisions from explicit markdown vault context. Respond with the requested sections only."
        },
        {
          role: "user",
          content: [
            "Extract decisions from the following context into exactly these sections:",
            "",
            "## Decisions",
            "## Rationale",
            "## Open Questions",
            "",
            "Be concise, do not invent facts, and preserve uncertainty where context is incomplete.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text
          ].filter(Boolean).join("\n")
        }
      ];
    }
    if (template === "extract-open-questions") {
      return [
        {
          role: "system",
          content: "You extract unresolved questions from explicit markdown vault context. Respond with the requested sections only."
        },
        {
          role: "user",
          content: [
            "Extract open questions from the following context into exactly these sections:",
            "",
            "## Open Questions",
            "## Context",
            "## Follow-ups",
            "",
            "Be concise, do not invent facts, and keep uncertainty explicit.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text
          ].filter(Boolean).join("\n")
        }
      ];
    }
    if (template === "draft-project-brief") {
      return [
        {
          role: "system",
          content: "You draft a project brief from explicit markdown vault context. Respond with the requested sections only."
        },
        {
          role: "user",
          content: [
            "Draft the following context into exactly these sections:",
            "",
            "# Project Brief",
            "## Overview",
            "## Goals",
            "## Scope",
            "## Next Steps",
            "",
            "Be concise, do not invent facts, and preserve project structure.",
            "",
            ...formatContextMetadataLines(context),
            "",
            context.text
          ].filter(Boolean).join("\n")
        }
      ];
    }
    return [
      {
        role: "system",
        content: "You turn explicit markdown vault context into concise markdown synthesis. Respond with the requested sections only."
      },
      {
        role: "user",
        content: [
          "Summarize the following context into exactly these sections:",
          "",
          "## Summary",
          "## Key Themes",
          "## Follow-ups",
          "",
          "Be concise, do not invent facts, and preserve actionable items.",
          "",
          ...formatContextMetadataLines(context),
          "",
          context.text
        ].filter(Boolean).join("\n")
      }
    ];
  }
  normalize(template, response) {
    if (template === "extract-tasks") {
      return normalizeTaskExtractionOutput(response);
    }
    if (template === "extract-decisions") {
      return normalizeDecisionExtractionOutput(response);
    }
    if (template === "extract-open-questions") {
      return normalizeOpenQuestionsOutput(response);
    }
    if (template === "rewrite-clean-note") {
      return normalizeCleanNoteOutput(response);
    }
    if (template === "draft-project-brief") {
      return normalizeProjectBriefOutput(response);
    }
    return normalizeSynthesisOutput(response);
  }
};
function isEnoentError2(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
function getCodexRuntime() {
  const req = getNodeRequire2();
  const { execFile } = req("child_process");
  const { promisify } = req("util");
  return {
    execFileAsync: promisify(execFile),
    fs: req("fs").promises,
    os: req("os"),
    path: req("path")
  };
}
function getNodeRequire2() {
  return Function("return require")();
}

// src/services/auth-service.ts
var import_obsidian8 = require("obsidian");
var BrainAuthService = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  async login(provider) {
    let url = "";
    if (provider === "openai") {
      url = "https://platform.openai.com/api-keys";
      new import_obsidian8.Notice("Open the OpenAI API key page, create a key, then paste it into Brain settings.");
    } else if (provider === "codex") {
      url = "https://openai.com/codex/get-started/";
      new import_obsidian8.Notice("Install the Codex CLI, run `codex login`, then return to Brain and select the Codex provider.");
    } else if (provider === "gemini") {
      url = "https://aistudio.google.com/app/apikey";
      new import_obsidian8.Notice("Open the Gemini API key page, then paste the key into Brain settings.");
    }
    window.open(url);
  }
  async getCodexStatus() {
    return getCodexLoginStatus();
  }
};

// src/services/vault-service.ts
var import_obsidian9 = require("obsidian");
var VaultService = class {
  constructor(app) {
    this.app = app;
  }
  async ensureKnownFolders(settings) {
    const folders = /* @__PURE__ */ new Set([
      settings.journalFolder,
      settings.notesFolder,
      settings.summariesFolder,
      settings.reviewsFolder,
      parentFolder(settings.inboxFile),
      parentFolder(settings.tasksFile)
    ]);
    for (const folder of folders) {
      await this.ensureFolder(folder);
    }
  }
  async ensureFolder(folderPath) {
    const normalized = (0, import_obsidian9.normalizePath)(folderPath).replace(/\/+$/, "");
    if (!normalized) {
      return;
    }
    const segments = normalized.split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (!existing) {
        await this.createFolderIfMissing(current);
      } else if (!(existing instanceof import_obsidian9.TFolder)) {
        throw new Error(`Path exists but is not a folder: ${current}`);
      }
    }
  }
  async ensureFile(filePath, initialContent = "") {
    const normalized = (0, import_obsidian9.normalizePath)(filePath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian9.TFile) {
      return existing;
    }
    if (existing) {
      throw new Error(`Path exists but is not a file: ${normalized}`);
    }
    await this.ensureFolder(parentFolder(normalized));
    return this.app.vault.create(normalized, initialContent);
  }
  async readText(filePath) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian9.normalizePath)(filePath));
    if (!(file instanceof import_obsidian9.TFile)) {
      return "";
    }
    return this.app.vault.read(file);
  }
  async readTextWithMtime(filePath) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian9.normalizePath)(filePath));
    if (!(file instanceof import_obsidian9.TFile)) {
      return {
        text: "",
        mtime: 0,
        exists: false
      };
    }
    return {
      text: await this.app.vault.read(file),
      mtime: file.stat.mtime,
      exists: true
    };
  }
  async appendText(filePath, content) {
    const file = await this.ensureFile(filePath);
    const current = await this.app.vault.read(file);
    const normalizedContent = content.endsWith("\n") ? content : `${content}
`;
    const separator = current.length === 0 ? "" : current.endsWith("\n\n") ? "" : current.endsWith("\n") ? "\n" : "\n\n";
    await this.app.vault.modify(file, `${current}${separator}${normalizedContent}`);
    return file;
  }
  async replaceText(filePath, content) {
    const file = await this.ensureFile(filePath);
    const normalizedContent = content.endsWith("\n") ? content : `${content}
`;
    await this.app.vault.modify(file, normalizedContent);
    return file;
  }
  async ensureUniqueFilePath(filePath) {
    const normalized = (0, import_obsidian9.normalizePath)(filePath);
    if (!this.app.vault.getAbstractFileByPath(normalized)) {
      return normalized;
    }
    const dotIndex = normalized.lastIndexOf(".");
    const base = dotIndex === -1 ? normalized : normalized.slice(0, dotIndex);
    const extension = dotIndex === -1 ? "" : normalized.slice(dotIndex);
    let counter = 2;
    while (true) {
      const candidate = `${base}-${counter}${extension}`;
      if (!this.app.vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
      counter += 1;
    }
  }
  async appendJournalHeader(filePath, dateKey) {
    const file = await this.ensureFile(filePath, `# ${dateKey}

`);
    const text = await this.app.vault.read(file);
    if (!text.trim()) {
      await this.app.vault.modify(file, `# ${dateKey}

`);
    }
    return file;
  }
  async listMarkdownFiles() {
    return this.app.vault.getMarkdownFiles();
  }
  async collectMarkdownFiles(options = {}) {
    let files = await this.listMarkdownFiles();
    if (options.excludeFolders) {
      for (const folder of options.excludeFolders) {
        files = files.filter((file) => !isUnderFolder(file.path, folder));
      }
    }
    if (options.minMtime !== void 0) {
      files = files.filter((file) => file.stat.mtime >= options.minMtime);
    }
    if (options.folderPath !== void 0) {
      files = files.filter(
        (file) => options.folderPath ? isUnderFolder(file.path, options.folderPath) : !file.path.includes("/")
      );
    }
    return files.sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
  async createFolderIfMissing(folderPath) {
    try {
      await this.app.vault.createFolder(folderPath);
    } catch (error) {
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      if (existing instanceof import_obsidian9.TFolder) {
        return;
      }
      throw error;
    }
  }
};
function parentFolder(filePath) {
  const normalized = (0, import_obsidian9.normalizePath)(filePath);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

// src/services/workflow-service.ts
var import_obsidian16 = require("obsidian");

// src/views/file-group-picker-modal.ts
var import_obsidian10 = require("obsidian");
var FileGroupPickerModal = class extends import_obsidian10.Modal {
  constructor(app, files, options) {
    super(app);
    this.files = files;
    this.options = options;
    this.settled = false;
    this.rows = [];
  }
  openPicker() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: "Choose one or more notes to use as context."
    });
    this.searchInput = contentEl.createEl("input", {
      cls: "brain-modal-input",
      attr: {
        placeholder: "Filter notes...",
        type: "text"
      }
    });
    this.searchInput.addEventListener("input", () => {
      this.filterRows(this.searchInput.value);
    });
    const list = contentEl.createEl("div", {
      cls: "brain-file-group-list"
    });
    for (const file of this.files) {
      const row = list.createEl("label", {
        cls: "brain-file-group-row"
      });
      const checkbox = row.createEl("input", {
        type: "checkbox"
      });
      row.createEl("span", {
        text: file.path
      });
      this.rows.push({ file, checkbox, row });
    }
    const buttons = contentEl.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Use Selected"
    }).addEventListener("click", () => {
      const selected = this.rows.filter((row) => row.checkbox.checked).map((row) => row.file);
      if (!selected.length) {
        new import_obsidian10.Notice("Select at least one note");
        return;
      }
      this.finish(selected);
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Cancel"
    }).addEventListener("click", () => {
      this.finish(null);
    });
  }
  onClose() {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }
  filterRows(value) {
    const query = value.trim().toLowerCase();
    for (const row of this.rows) {
      const match = !query || row.file.path.toLowerCase().includes(query);
      row.row.style.display = match ? "" : "none";
    }
  }
  finish(files) {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(files);
    this.close();
  }
};

// src/views/prompt-modals.ts
var import_obsidian11 = require("obsidian");
var PromptModal = class extends import_obsidian11.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.settled = false;
  }
  openPrompt() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  onOpen() {
    var _a, _b;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.options.title });
    if (this.options.multiline) {
      const textarea = contentEl.createEl("textarea", {
        cls: "brain-modal-input",
        attr: {
          placeholder: (_a = this.options.placeholder) != null ? _a : "",
          rows: "8"
        }
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          void this.submit();
        }
      });
      this.inputEl = textarea;
    } else {
      const input = contentEl.createEl("input", {
        cls: "brain-modal-input",
        attr: {
          placeholder: (_b = this.options.placeholder) != null ? _b : "",
          type: "text"
        }
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void this.submit();
        }
      });
      this.inputEl = input;
    }
    this.inputEl.focus();
    new import_obsidian11.Setting(contentEl).addButton(
      (button) => {
        var _a2;
        return button.setButtonText((_a2 = this.options.submitLabel) != null ? _a2 : "Submit").setCta().onClick(() => {
          void this.submit();
        });
      }
    ).addButton(
      (button) => button.setButtonText("Cancel").onClick(() => {
        this.finish(null);
      })
    );
  }
  onClose() {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }
  async submit() {
    const value = trimTrailingNewlines(this.inputEl.value).trim();
    if (!value) {
      new import_obsidian11.Notice("Enter some text first.");
      return;
    }
    this.finish(value);
  }
  finish(value) {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(value);
    this.close();
  }
};
var ResultModal = class extends import_obsidian11.Modal {
  constructor(app, titleText, bodyText) {
    super(app);
    this.titleText = titleText;
    this.bodyText = bodyText;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.titleText });
    contentEl.createEl("pre", {
      cls: "brain-result",
      text: this.bodyText
    });
  }
};

// src/views/question-scope-modal.ts
var import_obsidian12 = require("obsidian");
var QuestionScopeModal = class extends import_obsidian12.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.settled = false;
  }
  openPicker() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: "Choose the scope Brain should use for this request."
    });
    new import_obsidian12.Setting(contentEl).addButton(
      (button) => button.setButtonText("Current Note").setCta().onClick(() => {
        this.finish("note");
      })
    ).addButton(
      (button) => button.setButtonText("Selected Notes").onClick(() => {
        this.finish("group");
      })
    ).addButton(
      (button) => button.setButtonText("Current Folder").onClick(() => {
        this.finish("folder");
      })
    ).addButton(
      (button) => button.setButtonText("Entire Vault").onClick(() => {
        this.finish("vault");
      })
    );
  }
  onClose() {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }
  finish(scope) {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(scope);
    this.close();
  }
};

// src/views/synthesis-result-modal.ts
var import_obsidian14 = require("obsidian");

// src/utils/error-handler.ts
var import_obsidian13 = require("obsidian");
function showError(error, defaultMessage) {
  console.error(error);
  const message = error instanceof Error ? error.message : defaultMessage;
  new import_obsidian13.Notice(message);
}

// src/views/synthesis-result-modal.ts
var SynthesisResultModal = class extends import_obsidian14.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.working = false;
    this.buttons = [];
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: `Brain ${this.options.result.title}` });
    contentEl.createEl("p", {
      text: `Action: ${this.options.result.action}`
    });
    if (this.options.result.promptText) {
      contentEl.createEl("p", {
        text: `Prompt: ${this.options.result.promptText}`
      });
    }
    contentEl.createEl("p", {
      text: `Context: ${formatContextLocation(this.options.context)}`
    });
    contentEl.createEl("p", {
      text: this.options.context.truncated ? `Context truncated to ${this.options.context.maxChars} characters from ${this.options.context.originalLength}.` : `Context length: ${this.options.context.originalLength} characters.`
    });
    contentEl.createEl("pre", {
      cls: "brain-result",
      text: this.options.result.content
    });
    if (this.options.canInsert) {
    } else {
      contentEl.createEl("p", {
        text: "Open a markdown note to insert this artifact there, or save it to Brain notes."
      });
    }
    const buttons = contentEl.createEl("div", { cls: "brain-button-row" });
    this.buttons = [];
    if (this.options.canInsert) {
      this.buttons.push(this.createButton(buttons, "Insert into current note", () => {
        void this.runAction(() => this.options.onInsert());
      }, true));
    }
    this.buttons.push(
      this.createButton(buttons, "Save to Brain notes", () => {
        void this.runAction(() => this.options.onSave());
      }),
      this.createButton(buttons, "Close", () => {
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
  createButton(parent, text, onClick, cta = false) {
    const button = parent.createEl("button", {
      cls: cta ? "brain-button brain-button-primary" : "brain-button",
      text
    });
    button.addEventListener("click", onClick);
    return button;
  }
  async runAction(action) {
    if (this.working) {
      return;
    }
    this.working = true;
    this.setButtonsDisabled(true);
    try {
      const message = await action();
      await this.options.onActionComplete(message);
      this.close();
    } catch (error) {
      showError(error, "Could not update the synthesis result");
    } finally {
      this.working = false;
      this.setButtonsDisabled(false);
    }
  }
  setButtonsDisabled(disabled) {
    for (const button of this.buttons) {
      button.disabled = disabled;
    }
  }
};

// src/views/template-picker-modal.ts
var import_obsidian15 = require("obsidian");
var TemplatePickerModal = class extends import_obsidian15.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.settled = false;
  }
  openPicker() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: "Choose how Brain should synthesize this context."
    });
    new import_obsidian15.Setting(contentEl).addButton(
      (button) => button.setButtonText(getSynthesisTemplateButtonLabel("summarize")).setCta().onClick(() => {
        this.finish("summarize");
      })
    ).addButton(
      (button) => button.setButtonText(getSynthesisTemplateButtonLabel("extract-tasks")).onClick(() => {
        this.finish("extract-tasks");
      })
    ).addButton(
      (button) => button.setButtonText(getSynthesisTemplateButtonLabel("extract-decisions")).onClick(() => {
        this.finish("extract-decisions");
      })
    ).addButton(
      (button) => button.setButtonText(getSynthesisTemplateButtonLabel("extract-open-questions")).onClick(() => {
        this.finish("extract-open-questions");
      })
    ).addButton(
      (button) => button.setButtonText(getSynthesisTemplateButtonLabel("rewrite-clean-note")).onClick(() => {
        this.finish("rewrite-clean-note");
      })
    ).addButton(
      (button) => button.setButtonText(getSynthesisTemplateButtonLabel("draft-project-brief")).onClick(() => {
        this.finish("draft-project-brief");
      })
    );
  }
  onClose() {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }
  finish(template) {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolve(template);
    this.close();
  }
};

// src/services/workflow-service.ts
var BrainWorkflowService = class {
  constructor(app, settingsProvider, contextService, synthesisService, topicPageService, questionService, noteService, callbacks) {
    this.app = app;
    this.settingsProvider = settingsProvider;
    this.contextService = contextService;
    this.synthesisService = synthesisService;
    this.topicPageService = topicPageService;
    this.questionService = questionService;
    this.noteService = noteService;
    this.callbacks = callbacks;
  }
  async askAboutCurrentNote(defaultTemplate) {
    await this.askBrainForContext(
      () => this.contextService.getCurrentNoteContext(),
      defaultTemplate ? "Summarize Current Note" : "Synthesize Current Note",
      defaultTemplate
    );
  }
  async askAboutSelection() {
    await this.askBrainForContext(
      () => this.contextService.getSelectedTextContext(),
      "Extract Tasks From Selection",
      "extract-tasks"
    );
  }
  async askAboutRecentFiles() {
    await this.askBrainForContext(
      () => this.contextService.getRecentFilesContext(),
      "Clean Note From Recent Files",
      "rewrite-clean-note"
    );
  }
  async askAboutCurrentFolder() {
    await this.askBrainForContext(
      () => this.contextService.getCurrentFolderContext(),
      "Draft Brief From Current Folder",
      "draft-project-brief"
    );
  }
  async synthesizeNotes() {
    try {
      const scope = await new QuestionScopeModal(this.app, {
        title: "Synthesize Notes"
      }).openPicker();
      if (!scope) {
        return;
      }
      const context = await this.resolveContextForScope(
        scope,
        "Select Notes to Synthesize"
      );
      if (!context) {
        return;
      }
      const template = await this.pickSynthesisTemplate("Synthesize Notes");
      if (!template) {
        return;
      }
      await this.runSynthesisFlow(context, template);
    } catch (error) {
      showError(error, "Could not synthesize these notes");
    }
  }
  async askQuestionAboutCurrentNote() {
    await this.askQuestionForScope("note");
  }
  async askQuestionAboutCurrentFolder() {
    await this.askQuestionForScope("folder");
  }
  async askQuestion() {
    try {
      const scope = await new QuestionScopeModal(this.app, {
        title: "Ask Question"
      }).openPicker();
      if (!scope) {
        return;
      }
      await this.askQuestionForScope(scope);
    } catch (error) {
      showError(error, "Could not ask Brain");
    }
  }
  async createTopicPage(defaultScope) {
    var _a;
    try {
      const topic = await new PromptModal(this.app, {
        title: "Create Topic Page",
        placeholder: "Topic or question to turn into a wiki page...",
        submitLabel: "Create",
        multiline: true
      }).openPrompt();
      if (!topic) {
        return;
      }
      const scope = defaultScope != null ? defaultScope : await new QuestionScopeModal(this.app, {
        title: "Create Topic Page"
      }).openPicker();
      if (!scope) {
        return;
      }
      const context = await this.resolveContextForScope(
        scope,
        "Select Notes for Topic Page"
      );
      if (!context) {
        return;
      }
      const result = await this.topicPageService.createTopicPage(topic, context);
      const saved = await this.noteService.createGeneratedNote(
        result.noteTitle,
        result.content,
        context.sourceLabel,
        context.sourcePath,
        context.sourcePaths
      );
      this.callbacks.setLastSummaryAt(/* @__PURE__ */ new Date());
      this.callbacks.updateSummary(result.content);
      this.callbacks.updateResult(
        result.usedAI ? `AI topic page saved to ${saved.path}` : `Topic page saved to ${saved.path}`
      );
      await this.callbacks.refreshStatus();
      new import_obsidian16.Notice(`Topic page saved to ${saved.path}`);
      const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.openFile(saved);
        this.app.workspace.revealLeaf(leaf);
      }
    } catch (error) {
      showError(error, "Could not create that topic page");
    }
  }
  async saveSynthesisResult(result, context) {
    const saved = await this.noteService.createGeneratedNote(
      result.noteTitle,
      buildSynthesisNoteContent(result, context),
      context.sourceLabel,
      context.sourcePath,
      context.sourcePaths
    );
    return `Saved artifact to ${saved.path}`;
  }
  async insertSynthesisIntoCurrentNote(result, context) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian16.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      throw new Error("Open a markdown note first");
    }
    const addition = buildInsertedSynthesisContent(result, context);
    const editor = view.editor;
    const lastLine = editor.lastLine();
    const lastLineText = editor.getLine(lastLine);
    const endPosition = { line: lastLine, ch: lastLineText.length };
    const separator = getAppendSeparator(editor.getValue());
    editor.replaceRange(`${separator}${addition}
`, endPosition);
    return `Inserted synthesis into ${view.file.path}`;
  }
  getActiveSelectionText() {
    var _a, _b, _c;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian16.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
  async askBrainForContext(resolver, modalTitle, defaultTemplate) {
    try {
      const context = await resolver();
      const template = defaultTemplate != null ? defaultTemplate : await this.pickSynthesisTemplate(modalTitle);
      if (!template) {
        return;
      }
      await this.runSynthesisFlow(context, template);
    } catch (error) {
      showError(error, "Could not synthesize that context");
    }
  }
  async askQuestionForScope(scope) {
    switch (scope) {
      case "note":
        await this.askQuestionWithContext(
          () => this.contextService.getCurrentNoteContext(),
          "Ask Question About Current Note"
        );
        return;
      case "folder":
        await this.askQuestionWithContext(
          () => this.contextService.getCurrentFolderContext(),
          "Ask Question About Current Folder"
        );
        return;
      case "vault":
        await this.askQuestionWithContext(
          () => this.contextService.getVaultContext(),
          "Ask Question About Entire Vault"
        );
        return;
      case "group":
        await this.askQuestionAboutSelectedGroup();
        return;
      default:
        return;
    }
  }
  async resolveContextForScope(scope, groupPickerTitle) {
    switch (scope) {
      case "note":
        return await this.contextService.getCurrentNoteContext();
      case "folder":
        return await this.contextService.getCurrentFolderContext();
      case "vault":
        return await this.contextService.getVaultContext();
      case "group": {
        const files = await this.pickSelectedMarkdownFiles(groupPickerTitle);
        if (!files || !files.length) {
          return null;
        }
        return await this.contextService.getSelectedFilesContext(files);
      }
      default:
        return null;
    }
  }
  async askQuestionAboutSelectedGroup() {
    try {
      const files = await this.pickSelectedMarkdownFiles("Select Notes");
      if (!files || !files.length) {
        return;
      }
      await this.askQuestionWithContext(
        () => this.contextService.getSelectedFilesContext(files),
        "Ask Question About Selected Notes"
      );
    } catch (error) {
      showError(error, "Could not select notes for Brain");
    }
  }
  async pickSelectedMarkdownFiles(title) {
    const settings = this.settingsProvider();
    const files = this.app.vault.getMarkdownFiles().filter((file) => !isBrainGeneratedPath(file.path, settings)).sort((left, right) => right.stat.mtime - left.stat.mtime);
    if (!files.length) {
      new import_obsidian16.Notice("No markdown files found");
      return null;
    }
    return await new FileGroupPickerModal(this.app, files, {
      title
    }).openPicker();
  }
  async askQuestionWithContext(resolver, modalTitle) {
    try {
      const context = await resolver();
      const question = await new PromptModal(this.app, {
        title: modalTitle,
        placeholder: "Ask a question about this context...",
        submitLabel: "Ask",
        multiline: true
      }).openPrompt();
      if (!question) {
        return;
      }
      const result = await this.questionService.answerQuestion(question, context);
      this.callbacks.setLastSummaryAt(/* @__PURE__ */ new Date());
      this.callbacks.updateSummary(result.content);
      this.callbacks.updateResult(
        result.usedAI ? `AI answer from ${context.sourceLabel}` : `Local answer from ${context.sourceLabel}`
      );
      await this.callbacks.refreshStatus();
      new SynthesisResultModal(this.app, {
        context,
        result,
        canInsert: this.callbacks.hasActiveMarkdownNote(),
        onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
        onSave: async () => this.saveSynthesisResult(result, context),
        onActionComplete: async (message) => {
          await this.callbacks.reportActionResult(message);
        }
      }).open();
    } catch (error) {
      showError(error, "Could not answer that question");
    }
  }
  async runSynthesisFlow(context, template) {
    const result = await this.synthesisService.run(template, context);
    this.callbacks.setLastSummaryAt(/* @__PURE__ */ new Date());
    this.callbacks.updateSummary(result.content);
    this.callbacks.updateResult(
      result.usedAI ? `AI ${result.title.toLowerCase()} from ${context.sourceLabel}` : `Local ${result.title.toLowerCase()} from ${context.sourceLabel}`
    );
    await this.callbacks.refreshStatus();
    new SynthesisResultModal(this.app, {
      context,
      result,
      canInsert: this.callbacks.hasActiveMarkdownNote(),
      onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
      onSave: async () => this.saveSynthesisResult(result, context),
      onActionComplete: async (message) => {
        await this.callbacks.reportActionResult(message);
      }
    }).open();
  }
  async pickSynthesisTemplate(title) {
    return await new TemplatePickerModal(this.app, { title }).openPicker();
  }
};

// src/views/inbox-review-modal.ts
var import_obsidian17 = require("obsidian");

// src/utils/inbox-review.ts
function getInboxReviewCompletionMessage(keptCount) {
  if (keptCount <= 0) {
    return "Inbox review complete";
  }
  if (keptCount === 1) {
    return "Review pass complete; 1 entry remains in inbox.";
  }
  return `Review pass complete; ${keptCount} entries remain in inbox.`;
}

// src/views/inbox-review-modal.ts
var InboxReviewModal = class extends import_obsidian17.Modal {
  constructor(app, entries, reviewService, onActionComplete) {
    super(app);
    this.entries = entries;
    this.reviewService = reviewService;
    this.onActionComplete = onActionComplete;
    this.currentIndex = 0;
    this.keptCount = 0;
    this.handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const action = keyToAction(event.key);
      if (!action) {
        return;
      }
      event.preventDefault();
      void this.handleAction(action);
    };
  }
  onOpen() {
    window.addEventListener("keydown", this.handleKeyDown);
    this.render();
  }
  onClose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.contentEl.empty();
  }
  render() {
    this.contentEl.empty();
    this.contentEl.addClass("brain-modal");
    this.contentEl.createEl("h2", { text: "Process Inbox" });
    if (!this.entries.length) {
      this.contentEl.createEl("p", { text: "No inbox entries found." });
      return;
    }
    const entry = this.entries[this.currentIndex];
    this.contentEl.createEl("div", {
      text: `Entry ${this.currentIndex + 1} of ${this.entries.length}`
    });
    this.contentEl.createEl("h3", {
      text: entry.heading || "Untitled entry"
    });
    this.contentEl.createEl("pre", {
      cls: "brain-result",
      text: entry.body || entry.preview || "(empty entry)"
    });
    this.contentEl.createEl("p", {
      text: "Choose an action for this entry. Shortcuts: k keep, t task, j journal, n note, s skip."
    });
    const buttonRow = this.contentEl.createEl("div", { cls: "brain-button-row" });
    this.addButton(buttonRow, "Keep in inbox", "keep");
    this.addButton(buttonRow, "Convert to task", "task");
    this.addButton(buttonRow, "Append to journal", "journal");
    this.addButton(buttonRow, "Promote to note", "note");
    this.addButton(buttonRow, "Skip", "skip");
  }
  addButton(container, label, action) {
    container.createEl("button", {
      cls: action === "note" ? "brain-button brain-button-primary" : "brain-button",
      text: label
    }).addEventListener("click", () => {
      void this.handleAction(action);
    });
  }
  async handleAction(action) {
    const entry = this.entries[this.currentIndex];
    if (!entry) {
      this.close();
      return;
    }
    try {
      let message = "";
      if (action === "task") {
        message = await this.reviewService.promoteToTask(entry);
      } else if (action === "journal") {
        message = await this.reviewService.appendToJournal(entry);
      } else if (action === "note") {
        message = await this.reviewService.promoteToNote(entry);
      } else if (action === "keep") {
        message = await this.reviewService.keepEntry(entry);
        this.keptCount += 1;
      } else {
        message = await this.reviewService.skipEntry(entry);
      }
      try {
        if (this.onActionComplete) {
          await this.onActionComplete(message);
        } else {
          new import_obsidian17.Notice(message);
        }
      } catch (error) {
        showError(error, "Could not process review action");
      }
      this.currentIndex += 1;
      if (this.currentIndex >= this.entries.length) {
        new import_obsidian17.Notice(getInboxReviewCompletionMessage(this.keptCount));
        this.close();
        return;
      }
      this.render();
    } catch (error) {
      showError(error, "Could not process inbox entry");
    }
  }
};
function keyToAction(key) {
  switch (key.toLowerCase()) {
    case "k":
      return "keep";
    case "t":
      return "task";
    case "j":
      return "journal";
    case "n":
      return "note";
    case "s":
      return "skip";
    default:
      return null;
  }
}

// src/views/review-history-modal.ts
var import_obsidian18 = require("obsidian");
var ReviewHistoryModal = class extends import_obsidian18.Modal {
  constructor(app, entries, plugin) {
    super(app);
    this.entries = entries;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("brain-modal");
    contentEl.createEl("h2", { text: "Review History" });
    if (!this.entries.length) {
      contentEl.createEl("p", { text: "No review logs found." });
      return;
    }
    contentEl.createEl("p", {
      text: "Open a log to inspect it, or re-open an inbox item if it was marked incorrectly."
    });
    for (const entry of this.entries) {
      const row = contentEl.createEl("section", { cls: "brain-section" });
      row.createEl("h3", { text: entry.heading || "Untitled item" });
      row.createEl("p", {
        text: `${entry.timestamp} \u2022 ${entry.action}`
      });
      row.createEl("pre", {
        cls: "brain-result",
        text: entry.preview || "(empty preview)"
      });
      const buttons = row.createEl("div", { cls: "brain-button-row" });
      buttons.createEl("button", {
        cls: "brain-button",
        text: "Open log"
      }).addEventListener("click", () => {
        void this.openLog(entry.sourcePath);
      });
      buttons.createEl("button", {
        cls: "brain-button brain-button-primary",
        text: "Re-open"
      }).addEventListener("click", () => {
        void this.reopenEntry(entry);
      });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
  async openLog(path) {
    var _a;
    const abstractFile = this.app.vault.getAbstractFileByPath(path);
    if (!(abstractFile instanceof import_obsidian18.TFile)) {
      new import_obsidian18.Notice("Unable to open review log");
      return;
    }
    const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian18.Notice("Unable to open review log");
      return;
    }
    await leaf.openFile(abstractFile);
    this.app.workspace.revealLeaf(leaf);
  }
  async reopenEntry(entry) {
    try {
      const message = await this.plugin.reopenReviewEntry(entry);
      new import_obsidian18.Notice(message);
      this.close();
    } catch (error) {
      showError(error, "Could not re-open inbox entry");
    }
  }
};

// src/views/sidebar-view.ts
var import_obsidian19 = require("obsidian");
var BRAIN_VIEW_TYPE = "brain-sidebar-view";
var BrainSidebarView = class extends import_obsidian19.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.isLoading = false;
    this.collapsedSections = /* @__PURE__ */ new Set();
  }
  getViewType() {
    return BRAIN_VIEW_TYPE;
  }
  getDisplayText() {
    return "Brain";
  }
  getIcon() {
    return "brain";
  }
  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("brain-sidebar");
    const header = this.contentEl.createEl("div", { cls: "brain-header" });
    header.createEl("h2", { text: "Brain" });
    header.createEl("p", {
      text: "Capture ideas, synthesize explicit context, and save durable markdown artifacts."
    });
    this.loadCollapsedState();
    this.createCaptureSection();
    this.createTopicPageSection();
    this.createSynthesisSection();
    this.createAskSection();
    this.createReviewSection();
    this.createCaptureAssistSection();
    this.createStatusSection();
    this.createOutputSection();
    this.registerKeyboardShortcuts();
    await this.refreshStatus();
  }
  onClose() {
    if (this.keyboardHandler) {
      document.removeEventListener("keydown", this.keyboardHandler);
      this.keyboardHandler = void 0;
    }
    return Promise.resolve();
  }
  setLastResult(text) {
    this.resultEl.setText(text);
  }
  setLastSummary(text) {
    this.summaryEl.setText(text);
  }
  async refreshStatus() {
    const [inboxCount, taskCount, reviewCount] = await Promise.all([
      this.plugin.getInboxCount(),
      this.plugin.getOpenTaskCount(),
      this.plugin.getReviewHistoryCount()
    ]);
    if (this.inboxCountEl) {
      this.inboxCountEl.setText(`${inboxCount} unreviewed entries`);
    }
    if (this.taskCountEl) {
      this.taskCountEl.setText(`${taskCount} open tasks`);
    }
    if (this.reviewHistoryEl) {
      this.reviewHistoryEl.setText(`Review history: ${reviewCount} entries`);
    }
    if (this.aiStatusEl) {
      this.aiStatusEl.empty();
      const statusText = await this.plugin.getAiStatusText();
      this.aiStatusEl.createEl("span", { text: `AI: ${statusText} ` });
      const aiStatus = await getAIConfigurationStatus(this.plugin.settings);
      this.aiStatusEl.createEl("button", {
        cls: "brain-button brain-button-small",
        text: aiStatus.configured ? "Manage" : "Connect"
      }).addEventListener("click", () => {
        const app = this.app;
        app.setting.open();
        app.setting.openTabById(this.plugin.manifest.id);
      });
    }
    if (this.summaryStatusEl) {
      this.summaryStatusEl.setText(this.plugin.getLastSummaryLabel());
    }
    this.updateCaptureAssistVisibility();
  }
  setLoading(loading) {
    this.isLoading = loading;
    const buttons = Array.from(this.contentEl.querySelectorAll("button.brain-button"));
    for (const button of buttons) {
      button.disabled = loading;
    }
    if (this.inputEl) {
      this.inputEl.disabled = loading;
    }
  }
  registerKeyboardShortcuts() {
    this.keyboardHandler = (evt) => {
      if (evt.metaKey || evt.ctrlKey || evt.altKey) {
        return;
      }
      if (this.isTextInputActive()) {
        return;
      }
      switch (evt.key.toLowerCase()) {
        case "n":
          evt.preventDefault();
          void this.saveAsNote();
          break;
        case "t":
          evt.preventDefault();
          void this.saveAsTask();
          break;
        case "j":
          evt.preventDefault();
          void this.saveAsJournal();
          break;
        case "c":
          evt.preventDefault();
          this.inputEl.value = "";
          new import_obsidian19.Notice("Capture cleared");
          break;
      }
    };
    document.addEventListener("keydown", this.keyboardHandler);
  }
  isTextInputActive() {
    const target = document.activeElement;
    return target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
  }
  toggleSection(sectionId) {
    if (this.collapsedSections.has(sectionId)) {
      this.collapsedSections.delete(sectionId);
    } else {
      this.collapsedSections.add(sectionId);
    }
    this.saveCollapsedState();
  }
  loadCollapsedState() {
    this.collapsedSections = new Set(this.plugin.settings.collapsedSidebarSections);
  }
  saveCollapsedState() {
    this.plugin.settings.collapsedSidebarSections = Array.from(this.collapsedSections);
    void this.plugin.saveSettings();
  }
  createCollapsibleSection(id, title, description, contentCreator) {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    const header = section.createEl("div", { cls: "brain-section-header" });
    const toggleBtn = header.createEl("button", {
      cls: "brain-collapse-toggle",
      text: this.collapsedSections.has(id) ? "\u25B6" : "\u25BC",
      attr: {
        "aria-label": this.collapsedSections.has(id) ? `Expand ${title}` : `Collapse ${title}`,
        "aria-expanded": (!this.collapsedSections.has(id)).toString()
      }
    });
    header.createEl("h3", { text: title });
    header.createEl("p", { text: description });
    toggleBtn.addEventListener("click", () => {
      this.toggleSection(id);
      const contentEl = section.querySelector(".brain-section-content");
      if (contentEl) {
        contentEl.toggleAttribute("hidden");
        toggleBtn.setText(this.collapsedSections.has(id) ? "\u25B6" : "\u25BC");
        toggleBtn.setAttribute("aria-label", this.collapsedSections.has(id) ? `Expand ${title}` : `Collapse ${title}`);
        toggleBtn.setAttribute("aria-expanded", (!this.collapsedSections.has(id)).toString());
      }
    });
    const content = section.createEl("div", {
      cls: "brain-section-content",
      attr: this.collapsedSections.has(id) ? { hidden: "true" } : void 0
    });
    contentCreator(content);
    return section;
  }
  createCaptureSection() {
    this.createCollapsibleSection(
      "capture",
      "Quick Capture",
      "Capture rough input into the vault before review and synthesis.",
      (container) => {
        this.inputEl = container.createEl("textarea", {
          cls: "brain-capture-input",
          attr: {
            placeholder: "Type a note, task, or journal entry...",
            rows: "8"
          }
        });
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Capture Note (n)"
        }).addEventListener("click", () => {
          void this.saveAsNote();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Capture Task (t)"
        }).addEventListener("click", () => {
          void this.saveAsTask();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Capture Journal (j)"
        }).addEventListener("click", () => {
          void this.saveAsJournal();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Clear (c)"
        }).addEventListener("click", () => {
          this.inputEl.value = "";
          new import_obsidian19.Notice("Capture cleared");
        });
      }
    );
  }
  createSynthesisSection() {
    this.createCollapsibleSection(
      "synthesis",
      "Synthesize",
      "Turn explicit context into summaries, clean notes, tasks, and briefs.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button brain-button-primary",
          text: "Summarize Current Note"
        }).addEventListener("click", () => {
          void this.plugin.askAboutCurrentNote();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Synthesize Current Note..."
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.askAboutCurrentNoteWithTemplate();
          } finally {
            this.setLoading(false);
          }
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Extract Tasks From Selection"
        }).addEventListener("click", () => {
          void this.plugin.askAboutSelection();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Draft Brief From Folder"
        }).addEventListener("click", () => {
          void this.plugin.askAboutCurrentFolder();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Clean Note From Recent Files"
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.askAboutRecentFiles();
          } finally {
            this.setLoading(false);
          }
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Synthesize Notes..."
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.synthesizeNotes();
          } finally {
            this.setLoading(false);
          }
        });
      }
    );
  }
  createAskSection() {
    this.createCollapsibleSection(
      "ask",
      "Ask Brain",
      "Ask a question about the current note, a selected group, a folder, or the whole vault.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button brain-button-primary",
          text: "Ask Question"
        }).addEventListener("click", () => {
          void this.plugin.askQuestion();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "About Current Note"
        }).addEventListener("click", () => {
          void this.plugin.askQuestionAboutCurrentNote();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "About Current Folder"
        }).addEventListener("click", () => {
          void this.plugin.askQuestionAboutCurrentFolder();
        });
      }
    );
  }
  createReviewSection() {
    this.createCollapsibleSection(
      "review",
      "Review",
      "Process captured input and keep the daily loop moving.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button brain-button-primary",
          text: "Review Inbox"
        }).addEventListener("click", () => {
          void this.plugin.processInbox();
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Open Review History"
        }).addEventListener("click", () => {
          void this.plugin.openReviewHistory();
        });
      }
    );
  }
  createTopicPageSection() {
    this.createCollapsibleSection(
      "topic",
      "Topic Pages",
      "Brain's flagship flow: turn explicit context into a durable markdown page you can keep building.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Create Topic Page"
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.createTopicPage();
          } finally {
            this.setLoading(false);
          }
        });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Topic Page From Current Note"
        }).addEventListener("click", async () => {
          this.setLoading(true);
          try {
            await this.plugin.createTopicPageForScope("note");
          } finally {
            this.setLoading(false);
          }
        });
      }
    );
  }
  createCaptureAssistSection() {
    this.captureAssistSectionEl = this.createCollapsibleSection(
      "capture-assist",
      "Capture Assist",
      "Use AI only to classify fresh capture into note, task, or journal.",
      (container) => {
        const buttons = container.createEl("div", { cls: "brain-button-row" });
        buttons.createEl("button", {
          cls: "brain-button",
          text: "Auto-route Capture"
        }).addEventListener("click", () => {
          void this.autoRoute();
        });
      }
    );
    this.captureAssistSectionEl.toggleAttribute("hidden", !this.plugin.settings.enableAIRouting);
  }
  updateCaptureAssistVisibility() {
    if (this.captureAssistSectionEl) {
      this.captureAssistSectionEl.toggleAttribute("hidden", !this.plugin.settings.enableAIRouting);
    }
  }
  createStatusSection() {
    this.createCollapsibleSection(
      "status",
      "Status",
      "Current inbox, task, and synthesis status.",
      (container) => {
        const inboxRow = container.createEl("p", { text: "Inbox: loading..." });
        this.inboxCountEl = inboxRow;
        const taskRow = container.createEl("p", { text: "Tasks: loading..." });
        this.taskCountEl = taskRow;
        const reviewRow = container.createEl("div", { cls: "brain-status-row" });
        this.reviewHistoryEl = reviewRow.createEl("span", { text: "Review history: loading..." });
        reviewRow.createEl("button", {
          cls: "brain-button brain-button-small",
          text: "Open"
        }).addEventListener("click", () => {
          void this.plugin.openReviewHistory();
        });
        const aiRow = container.createEl("p", { text: "AI: loading..." });
        this.aiStatusEl = aiRow;
        const summaryRow = container.createEl("p", { text: "Last artifact: loading..." });
        this.summaryStatusEl = summaryRow;
      }
    );
  }
  createOutputSection() {
    this.createCollapsibleSection(
      "output",
      "Artifacts",
      "Recent synthesis results and generated artifacts.",
      (container) => {
        container.createEl("h4", { text: "Last Result" });
        this.resultEl = container.createEl("pre", {
          cls: "brain-output",
          text: "No result yet."
        });
        container.createEl("h4", { text: "Last Artifact" });
        this.summaryEl = container.createEl("pre", {
          cls: "brain-output",
          text: "No artifact generated yet."
        });
      }
    );
  }
  async saveAsNote() {
    await this.executeCapture(
      (text) => this.plugin.captureNote(text),
      "Could not capture note"
    );
  }
  async saveAsTask() {
    await this.executeCapture(
      (text) => this.plugin.captureTask(text),
      "Could not save task"
    );
  }
  async saveAsJournal() {
    await this.executeCapture(
      (text) => this.plugin.captureJournal(text),
      "Could not save journal entry"
    );
  }
  async autoRoute() {
    const text = this.inputEl.value.trim();
    if (!text) {
      new import_obsidian19.Notice("Enter some text first.");
      return;
    }
    this.setLoading(true);
    try {
      const route = await this.plugin.routeText(text);
      if (!route) {
        new import_obsidian19.Notice("Brain could not classify that entry");
        return;
      }
      if (route === "note") {
        await this.executeCapture(
          () => this.plugin.captureNote(text),
          "Could not capture note"
        );
      } else if (route === "task") {
        await this.executeCapture(
          () => this.plugin.captureTask(text),
          "Could not save task"
        );
      } else {
        await this.executeCapture(
          () => this.plugin.captureJournal(text),
          "Could not save journal entry"
        );
      }
    } catch (error) {
      showError(error, "Could not auto-route capture");
    } finally {
      this.setLoading(false);
    }
  }
  async executeCapture(action, failureMessage) {
    const text = this.inputEl.value.trim();
    if (!text) {
      new import_obsidian19.Notice("Enter some text first.");
      return;
    }
    try {
      const result = await action(text);
      await this.plugin.reportActionResult(result);
      this.inputEl.value = "";
    } catch (error) {
      showError(error, failureMessage);
    }
  }
};

// src/commands/register-commands.ts
function registerCommands(plugin) {
  plugin.addCommand({
    id: "capture-note",
    name: "Brain: Capture Note",
    callback: async () => {
      await plugin.captureFromModal("Capture Note", "Capture", async (text) => {
        const saved = await plugin.noteService.appendNote(text);
        return `Captured note in ${saved.path}`;
      });
    }
  });
  plugin.addCommand({
    id: "add-task",
    name: "Brain: Capture Task",
    callback: async () => {
      await plugin.captureFromModal("Capture Task", "Capture", async (text) => {
        const saved = await plugin.taskService.appendTask(text);
        return `Saved task to ${saved.path}`;
      });
    }
  });
  plugin.addCommand({
    id: "add-journal-entry",
    name: "Brain: Capture Journal",
    callback: async () => {
      await plugin.captureFromModal(
        "Capture Journal",
        "Capture",
        async (text) => {
          const saved = await plugin.journalService.appendEntry(text);
          return `Saved journal entry to ${saved.path}`;
        },
        true
      );
    }
  });
  plugin.addCommand({
    id: "process-inbox",
    name: "Brain: Review Inbox",
    callback: async () => {
      await plugin.processInbox();
    }
  });
  plugin.addCommand({
    id: "review-history",
    name: "Brain: Open Review History",
    callback: async () => {
      await plugin.openReviewHistory();
    }
  });
  plugin.addCommand({
    id: "summarize-today",
    name: "Brain: Generate Today Summary",
    callback: async () => {
      await plugin.generateSummaryForWindow(1, "Today");
    }
  });
  plugin.addCommand({
    id: "summarize-this-week",
    name: "Brain: Generate Weekly Summary",
    callback: async () => {
      await plugin.generateSummaryForWindow(7, "Week");
    }
  });
  plugin.addCommand({
    id: "add-task-from-selection",
    name: "Brain: Capture Task From Selection",
    callback: async () => {
      await plugin.addTaskFromSelection();
    }
  });
  plugin.addCommand({
    id: "open-todays-journal",
    name: "Brain: Open Today's Journal",
    callback: async () => {
      await plugin.openTodaysJournal();
    }
  });
  plugin.addCommand({
    id: "open-sidebar",
    name: "Brain: Open Brain Sidebar",
    callback: async () => {
      await plugin.openSidebar();
    }
  });
  plugin.addCommand({
    id: "synthesize-notes",
    name: "Brain: Synthesize Notes",
    callback: async () => {
      await plugin.synthesizeNotes();
    }
  });
  plugin.addCommand({
    id: "synthesize-current-note",
    name: "Brain: Synthesize Current Note",
    callback: async () => {
      await plugin.askAboutCurrentNoteWithTemplate();
    }
  });
  plugin.addCommand({
    id: "ask-question",
    name: "Brain: Ask Question",
    callback: async () => {
      await plugin.askQuestion();
    }
  });
  plugin.addCommand({
    id: "ask-question-current-note",
    name: "Brain: Ask Question About Current Note",
    callback: async () => {
      await plugin.askQuestionAboutCurrentNote();
    }
  });
  plugin.addCommand({
    id: "create-topic-page",
    name: "Brain: Generate Topic Page",
    callback: async () => {
      await plugin.createTopicPage();
    }
  });
  plugin.addCommand({
    id: "create-topic-page-current-note",
    name: "Brain: Generate Topic Page From Current Note",
    callback: async () => {
      await plugin.createTopicPageForScope("note");
    }
  });
}

// main.ts
var BrainPlugin = class extends import_obsidian20.Plugin {
  constructor() {
    super(...arguments);
    this.sidebarView = null;
    this.lastSummaryAt = null;
  }
  async onload() {
    await this.loadSettings();
    this.vaultService = new VaultService(this.app);
    this.aiService = new BrainAIService();
    this.authService = new BrainAuthService(this);
    this.inboxService = new InboxService(this.vaultService, () => this.settings);
    this.noteService = new NoteService(this.vaultService, () => this.settings);
    this.taskService = new TaskService(this.vaultService, () => this.settings);
    this.journalService = new JournalService(
      this.vaultService,
      () => this.settings
    );
    this.contextService = new ContextService(
      this.app,
      this.vaultService,
      () => this.settings
    );
    this.reviewLogService = new ReviewLogService(
      this.vaultService,
      () => this.settings
    );
    this.reviewService = new ReviewService(
      this.vaultService,
      this.inboxService,
      this.taskService,
      this.journalService,
      this.reviewLogService,
      () => this.settings
    );
    this.questionService = new QuestionService(
      this.aiService,
      () => this.settings
    );
    this.summaryService = new SummaryService(
      this.vaultService,
      this.aiService,
      () => this.settings
    );
    this.synthesisService = new SynthesisService(
      this.aiService,
      () => this.settings
    );
    this.topicPageService = new TopicPageService(
      this.aiService,
      () => this.settings
    );
    this.workflowService = new BrainWorkflowService(
      this.app,
      () => this.settings,
      this.contextService,
      this.synthesisService,
      this.topicPageService,
      this.questionService,
      this.noteService,
      {
        updateResult: (text) => this.updateSidebarResult(text),
        updateSummary: (text) => this.updateSidebarSummary(text),
        refreshStatus: () => this.refreshSidebarStatusBestEffort(),
        reportActionResult: (message) => this.reportActionResult(message),
        hasActiveMarkdownNote: () => this.hasActiveMarkdownNote(),
        setLastSummaryAt: (date) => {
          this.lastSummaryAt = date;
        }
      }
    );
    try {
      this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
        const view = new BrainSidebarView(leaf, this);
        this.sidebarView = view;
        return view;
      });
      registerCommands(this);
      this.addSettingTab(new BrainSettingTab(this.app, this));
    } catch (error) {
      showError(error, "Could not finish loading Brain");
    }
  }
  onunload() {
    this.sidebarView = null;
  }
  async loadSettings() {
    var _a;
    try {
      const loaded = (_a = await this.loadData()) != null ? _a : {};
      this.settings = normalizeBrainSettings(loaded);
    } catch (error) {
      showError(error, "Could not load Brain settings");
      this.settings = normalizeBrainSettings({});
    }
  }
  async saveSettings() {
    this.settings = normalizeBrainSettings(this.settings);
    await this.saveData(this.settings);
    await this.vaultService.ensureKnownFolders(this.settings);
    await this.refreshSidebarStatus();
  }
  async openSidebar() {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian20.Notice("Unable to open the sidebar");
      return;
    }
    await leaf.setViewState({
      type: BRAIN_VIEW_TYPE,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }
  getOpenSidebarView() {
    const leaves = this.app.workspace.getLeavesOfType(BRAIN_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof BrainSidebarView) {
        return view;
      }
    }
    return null;
  }
  hasOpenSidebar() {
    return this.app.workspace.getLeavesOfType(BRAIN_VIEW_TYPE).length > 0;
  }
  updateSidebarResult(text) {
    var _a;
    (_a = this.getOpenSidebarView()) == null ? void 0 : _a.setLastResult(text);
  }
  updateSidebarSummary(text) {
    var _a;
    (_a = this.getOpenSidebarView()) == null ? void 0 : _a.setLastSummary(text);
  }
  async refreshSidebarStatus() {
    var _a;
    await ((_a = this.getOpenSidebarView()) == null ? void 0 : _a.refreshStatus());
  }
  async refreshSidebarStatusBestEffort() {
    try {
      await this.refreshSidebarStatus();
    } catch (error) {
      showError(error, "Could not refresh sidebar status");
    }
  }
  async reportActionResult(message) {
    new import_obsidian20.Notice(message);
    this.updateSidebarResult(message);
    await this.refreshSidebarStatusBestEffort();
  }
  getLastSummaryLabel() {
    return this.lastSummaryAt ? formatDateTimeKey(this.lastSummaryAt) : "No artifact yet";
  }
  async routeText(text) {
    if (!this.settings.enableAIRouting) {
      return null;
    }
    const aiStatus = await getAIConfigurationStatus(this.settings);
    if (!aiStatus.configured) {
      new import_obsidian20.Notice(aiStatus.message);
      return null;
    }
    const route = await this.aiService.routeText(text, this.settings);
    if (route) {
      this.updateSidebarResult(`Auto-routed as ${route}`);
    }
    return route;
  }
  async askAboutCurrentNote() {
    await this.workflowService.askAboutCurrentNote("summarize");
  }
  async askAboutCurrentNoteWithTemplate() {
    await this.workflowService.askAboutCurrentNote();
  }
  async askAboutSelection() {
    await this.workflowService.askAboutSelection();
  }
  async askAboutRecentFiles() {
    await this.workflowService.askAboutRecentFiles();
  }
  async askAboutCurrentFolder() {
    await this.workflowService.askAboutCurrentFolder();
  }
  async synthesizeNotes() {
    await this.workflowService.synthesizeNotes();
  }
  async askQuestionAboutCurrentNote() {
    await this.workflowService.askQuestionAboutCurrentNote();
  }
  async askQuestionAboutCurrentFolder() {
    await this.workflowService.askQuestionAboutCurrentFolder();
  }
  async askQuestion() {
    await this.workflowService.askQuestion();
  }
  async createTopicPage() {
    await this.workflowService.createTopicPage();
  }
  async createTopicPageForScope(defaultScope) {
    await this.workflowService.createTopicPage(defaultScope);
  }
  async generateSummaryForWindow(lookbackDays, label) {
    const result = await this.summaryService.generateSummary(lookbackDays, label);
    this.lastSummaryAt = /* @__PURE__ */ new Date();
    this.updateSidebarSummary(`${result.title}

${result.content}`);
    this.updateSidebarResult(
      result.usedAI ? `${result.title} generated with AI` : `${result.title} generated locally`
    );
    await this.refreshSidebarStatusBestEffort();
    new import_obsidian20.Notice(
      result.persistedPath ? `${result.title} saved to ${result.persistedPath}` : result.usedAI ? `${result.title} generated with AI` : `${result.title} generated locally`
    );
    if (!this.hasOpenSidebar()) {
      new ResultModal(this.app, `Brain ${result.title}`, result.content).open();
    }
    return result;
  }
  async captureFromModal(title, submitLabel, action, multiline = false) {
    const value = await new PromptModal(this.app, {
      title,
      placeholder: multiline ? "Write your entry here..." : "Type here...",
      submitLabel,
      multiline
    }).openPrompt();
    if (value === null) {
      return;
    }
    try {
      const result = await action(value);
      await this.reportActionResult(result);
    } catch (error) {
      showError(error, "Brain could not save that entry");
    }
  }
  async captureNote(text) {
    const saved = await this.noteService.appendNote(text);
    return `Captured note in ${saved.path}`;
  }
  async captureTask(text) {
    const saved = await this.taskService.appendTask(text);
    return `Saved task to ${saved.path}`;
  }
  async captureJournal(text) {
    const saved = await this.journalService.appendEntry(text);
    return `Saved journal entry to ${saved.path}`;
  }
  async processInbox() {
    const entries = await this.reviewService.getRecentInboxEntries();
    if (!entries.length) {
      new import_obsidian20.Notice("No inbox entries found");
      return;
    }
    new InboxReviewModal(this.app, entries, this.reviewService, async (message) => {
      await this.reportActionResult(message);
    }).open();
    this.updateSidebarResult(`Loaded ${entries.length} inbox entries`);
    await this.refreshSidebarStatusBestEffort();
  }
  async openReviewHistory() {
    const entries = await this.reviewLogService.getReviewEntries();
    new ReviewHistoryModal(this.app, entries, this).open();
  }
  async addTaskFromSelection() {
    const selection = this.workflowService.getActiveSelectionText();
    if (selection) {
      const saved = await this.taskService.appendTask(selection);
      const message = `Saved task from selection to ${saved.path}`;
      await this.reportActionResult(message);
      return;
    }
    new import_obsidian20.Notice("No selection found. Opening task entry modal.");
    await this.captureFromModal("Add Task", "Save task", async (text) => {
      const saved = await this.taskService.appendTask(text);
      return `Saved task to ${saved.path}`;
    });
  }
  async openTodaysJournal() {
    var _a;
    const file = await this.journalService.ensureJournalFile();
    const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian20.Notice("Unable to open today's journal");
      return;
    }
    await leaf.openFile(file);
    this.app.workspace.revealLeaf(leaf);
    const message = `Opened ${file.path}`;
    await this.reportActionResult(message);
  }
  async getInboxCount() {
    return await this.inboxService.getUnreviewedCount();
  }
  async getOpenTaskCount() {
    return await this.taskService.getOpenTaskCount();
  }
  async getReviewHistoryCount() {
    return this.reviewLogService.getReviewEntryCount();
  }
  async reopenReviewEntry(entry) {
    const result = await this.reviewService.reopenFromReviewLog({
      action: "reopen",
      timestamp: "",
      sourcePath: "",
      fileMtime: Date.now(),
      entryIndex: 0,
      body: "",
      heading: entry.heading,
      preview: entry.preview,
      signature: entry.signature,
      signatureIndex: entry.signatureIndex
    });
    await this.refreshSidebarStatusBestEffort();
    return result;
  }
  async getAiStatusText() {
    var _a;
    if (!this.settings.enableAISummaries && !this.settings.enableAIRouting) {
      return "AI off";
    }
    const aiStatus = await getAIConfigurationStatus(this.settings);
    if (!aiStatus.configured) {
      return aiStatus.message.replace(/\.$/, "");
    }
    const provider = (_a = aiStatus.provider) != null ? _a : "AI";
    const model = aiStatus.model ? ` (${aiStatus.model})` : "";
    return `${provider}${model}`;
  }
  hasActiveMarkdownNote() {
    var _a;
    return Boolean((_a = this.app.workspace.getActiveViewOfType(import_obsidian20.MarkdownView)) == null ? void 0 : _a.file);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbW9kZWwtc2VsZWN0aW9uLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZS50cyIsICJzcmMvdXRpbHMvZGF0ZS50cyIsICJzcmMvdXRpbHMvdGV4dC50cyIsICJzcmMvc2VydmljZXMvaW5ib3gtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgudHMiLCAic3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL2Zvcm1hdC1oZWxwZXJzLnRzIiwgInNyYy91dGlscy9xdWVzdGlvbi1hbnN3ZXItZm9ybWF0LnRzIiwgInNyYy91dGlscy9xdWVzdGlvbi1hbnN3ZXItbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktZm9ybWF0LnRzIiwgInNyYy9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZS50cyIsICJzcmMvdXRpbHMvY29udGV4dC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3dvcmtmbG93LXNlcnZpY2UudHMiLCAic3JjL3ZpZXdzL2ZpbGUtZ3JvdXAtcGlja2VyLW1vZGFsLnRzIiwgInNyYy92aWV3cy9wcm9tcHQtbW9kYWxzLnRzIiwgInNyYy92aWV3cy9xdWVzdGlvbi1zY29wZS1tb2RhbC50cyIsICJzcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbC50cyIsICJzcmMvdXRpbHMvZXJyb3ItaGFuZGxlci50cyIsICJzcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsLnRzIiwgInNyYy92aWV3cy9pbmJveC1yZXZpZXctbW9kYWwudHMiLCAic3JjL3V0aWxzL2luYm94LXJldmlldy50cyIsICJzcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyIsICJzcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQ29udGV4dFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgSm91cm5hbFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBOb3RlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUb3BpY1BhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkF1dGhTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2F1dGgtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluV29ya2Zsb3dTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3dvcmtmbG93LXNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIFByb21wdE1vZGFsLFxuICBSZXN1bHRNb2RhbCxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3Byb21wdC1tb2RhbHNcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5pbXBvcnQgeyBSZXZpZXdIaXN0b3J5TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWxcIjtcbmltcG9ydCB7XG4gIEJSQUlOX1ZJRVdfVFlQRSxcbiAgQnJhaW5TaWRlYmFyVmlldyxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3NpZGViYXItdmlld1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVJlc3VsdCB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQ29tbWFuZHMgfSBmcm9tIFwiLi9zcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHNcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuL3NyYy91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJyYWluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3MhOiBCcmFpblBsdWdpblNldHRpbmdzO1xuICB2YXVsdFNlcnZpY2UhOiBWYXVsdFNlcnZpY2U7XG4gIGluYm94U2VydmljZSE6IEluYm94U2VydmljZTtcbiAgbm90ZVNlcnZpY2UhOiBOb3RlU2VydmljZTtcbiAgdGFza1NlcnZpY2UhOiBUYXNrU2VydmljZTtcbiAgam91cm5hbFNlcnZpY2UhOiBKb3VybmFsU2VydmljZTtcbiAgcmV2aWV3TG9nU2VydmljZSE6IFJldmlld0xvZ1NlcnZpY2U7XG4gIHJldmlld1NlcnZpY2UhOiBSZXZpZXdTZXJ2aWNlO1xuICBxdWVzdGlvblNlcnZpY2UhOiBRdWVzdGlvblNlcnZpY2U7XG4gIGNvbnRleHRTZXJ2aWNlITogQ29udGV4dFNlcnZpY2U7XG4gIHN5bnRoZXNpc1NlcnZpY2UhOiBTeW50aGVzaXNTZXJ2aWNlO1xuICB0b3BpY1BhZ2VTZXJ2aWNlITogVG9waWNQYWdlU2VydmljZTtcbiAgYWlTZXJ2aWNlITogQnJhaW5BSVNlcnZpY2U7XG4gIGF1dGhTZXJ2aWNlITogQnJhaW5BdXRoU2VydmljZTtcbiAgc3VtbWFyeVNlcnZpY2UhOiBTdW1tYXJ5U2VydmljZTtcbiAgd29ya2Zsb3dTZXJ2aWNlITogQnJhaW5Xb3JrZmxvd1NlcnZpY2U7XG4gIHByaXZhdGUgc2lkZWJhclZpZXc6IEJyYWluU2lkZWJhclZpZXcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0U3VtbWFyeUF0OiBEYXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5ib3hTZXJ2aWNlID0gbmV3IEluYm94U2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5ub3RlU2VydmljZSA9IG5ldyBOb3RlU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy50YXNrU2VydmljZSA9IG5ldyBUYXNrU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5qb3VybmFsU2VydmljZSA9IG5ldyBKb3VybmFsU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuY29udGV4dFNlcnZpY2UgPSBuZXcgQ29udGV4dFNlcnZpY2UoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3TG9nU2VydmljZSA9IG5ldyBSZXZpZXdMb2dTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5yZXZpZXdTZXJ2aWNlID0gbmV3IFJldmlld1NlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuaW5ib3hTZXJ2aWNlLFxuICAgICAgdGhpcy50YXNrU2VydmljZSxcbiAgICAgIHRoaXMuam91cm5hbFNlcnZpY2UsXG4gICAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5xdWVzdGlvblNlcnZpY2UgPSBuZXcgUXVlc3Rpb25TZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5zdW1tYXJ5U2VydmljZSA9IG5ldyBTdW1tYXJ5U2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5zeW50aGVzaXNTZXJ2aWNlID0gbmV3IFN5bnRoZXNpc1NlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnRvcGljUGFnZVNlcnZpY2UgPSBuZXcgVG9waWNQYWdlU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMud29ya2Zsb3dTZXJ2aWNlID0gbmV3IEJyYWluV29ya2Zsb3dTZXJ2aWNlKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICAgdGhpcy5jb250ZXh0U2VydmljZSxcbiAgICAgIHRoaXMuc3ludGhlc2lzU2VydmljZSxcbiAgICAgIHRoaXMudG9waWNQYWdlU2VydmljZSxcbiAgICAgIHRoaXMucXVlc3Rpb25TZXJ2aWNlLFxuICAgICAgdGhpcy5ub3RlU2VydmljZSxcbiAgICAgIHtcbiAgICAgICAgdXBkYXRlUmVzdWx0OiAodGV4dCkgPT4gdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KHRleHQpLFxuICAgICAgICB1cGRhdGVTdW1tYXJ5OiAodGV4dCkgPT4gdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeSh0ZXh0KSxcbiAgICAgICAgcmVmcmVzaFN0YXR1czogKCkgPT4gdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKSxcbiAgICAgICAgcmVwb3J0QWN0aW9uUmVzdWx0OiAobWVzc2FnZSkgPT4gdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSksXG4gICAgICAgIGhhc0FjdGl2ZU1hcmtkb3duTm90ZTogKCkgPT4gdGhpcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgICAgc2V0TGFzdFN1bW1hcnlBdDogKGRhdGUpID0+IHtcbiAgICAgICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBkYXRlO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgICAgY29uc3QgdmlldyA9IG5ldyBCcmFpblNpZGViYXJWaWV3KGxlYWYsIHRoaXMpO1xuICAgICAgICB0aGlzLnNpZGViYXJWaWV3ID0gdmlldztcbiAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICB9KTtcblxuICAgICAgcmVnaXN0ZXJDb21tYW5kcyh0aGlzKTtcblxuICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBmaW5pc2ggbG9hZGluZyBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLnNpZGViYXJWaWV3ID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbG9hZGVkID0gKGF3YWl0IHRoaXMubG9hZERhdGEoKSkgPz8ge307XG4gICAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhsb2FkZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGxvYWQgQnJhaW4gc2V0dGluZ3NcIik7XG4gICAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyh7fSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgZ2V0T3BlblNpZGViYXJWaWV3KCk6IEJyYWluU2lkZWJhclZpZXcgfCBudWxsIHtcbiAgICBjb25zdCBsZWF2ZXMgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSk7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIGxlYXZlcykge1xuICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICAgIGlmICh2aWV3IGluc3RhbmNlb2YgQnJhaW5TaWRlYmFyVmlldykge1xuICAgICAgICByZXR1cm4gdmlldztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBoYXNPcGVuU2lkZWJhcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpLmxlbmd0aCA+IDA7XG4gIH1cblxuICB1cGRhdGVTaWRlYmFyUmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RSZXN1bHQodGV4dCk7XG4gIH1cblxuICB1cGRhdGVTaWRlYmFyU3VtbWFyeSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5zZXRMYXN0U3VtbWFyeSh0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlZnJlc2ggc2lkZWJhciBzdGF0dXNcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KG1lc3NhZ2UpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBnZXRMYXN0U3VtbWFyeUxhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubGFzdFN1bW1hcnlBdCA/IGZvcm1hdERhdGVUaW1lS2V5KHRoaXMubGFzdFN1bW1hcnlBdCkgOiBcIk5vIGFydGlmYWN0IHlldFwiO1xuICB9XG5cbiAgYXN5bmMgcm91dGVUZXh0KHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGlmICghYWlTdGF0dXMuY29uZmlndXJlZCkge1xuICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uucm91dGVUZXh0KHRleHQsIHRoaXMuc2V0dGluZ3MpO1xuICAgIGlmIChyb3V0ZSkge1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBBdXRvLXJvdXRlZCBhcyAke3JvdXRlfWApO1xuICAgIH1cbiAgICByZXR1cm4gcm91dGU7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnROb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza0Fib3V0Q3VycmVudE5vdGUoXCJzdW1tYXJpemVcIik7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza0Fib3V0Q3VycmVudE5vdGUoKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0U2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza0Fib3V0U2VsZWN0aW9uKCk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFJlY2VudEZpbGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza0Fib3V0UmVjZW50RmlsZXMoKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudEZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLndvcmtmbG93U2VydmljZS5hc2tBYm91dEN1cnJlbnRGb2xkZXIoKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVOb3RlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLndvcmtmbG93U2VydmljZS5zeW50aGVzaXplTm90ZXMoKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLndvcmtmbG93U2VydmljZS5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Rm9sZGVyKCk7XG4gIH1cblxuICBhc3luYyBhc2tRdWVzdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLndvcmtmbG93U2VydmljZS5hc2tRdWVzdGlvbigpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZSgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoZGVmYXVsdFNjb3BlPzogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZShkZWZhdWx0U2NvcGUpO1xuICB9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KFxuICAgIGxvb2tiYWNrRGF5cz86IG51bWJlcixcbiAgICBsYWJlbD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTdW1tYXJ5UmVzdWx0PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zdW1tYXJ5U2VydmljZS5nZW5lcmF0ZVN1bW1hcnkobG9va2JhY2tEYXlzLCBsYWJlbCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KGAke3Jlc3VsdC50aXRsZX1cXG5cXG4ke3Jlc3VsdC5jb250ZW50fWApO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgIHJlc3VsdC51c2VkQUkgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYCA6IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIGxvY2FsbHlgLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICBuZXcgTm90aWNlKFxuICAgICAgcmVzdWx0LnBlcnNpc3RlZFBhdGhcbiAgICAgICAgPyBgJHtyZXN1bHQudGl0bGV9IHNhdmVkIHRvICR7cmVzdWx0LnBlcnNpc3RlZFBhdGh9YFxuICAgICAgICA6IHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIHdpdGggQUlgXG4gICAgICAgICAgOiBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCBsb2NhbGx5YCxcbiAgICApO1xuICAgIGlmICghdGhpcy5oYXNPcGVuU2lkZWJhcigpKSB7XG4gICAgICBuZXcgUmVzdWx0TW9kYWwodGhpcy5hcHAsIGBCcmFpbiAke3Jlc3VsdC50aXRsZX1gLCByZXN1bHQuY29udGVudCkub3BlbigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZUZyb21Nb2RhbChcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHN1Ym1pdExhYmVsOiBzdHJpbmcsXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgbXVsdGlsaW5lID0gZmFsc2UsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICB0aXRsZSxcbiAgICAgIHBsYWNlaG9sZGVyOiBtdWx0aWxpbmVcbiAgICAgICAgPyBcIldyaXRlIHlvdXIgZW50cnkgaGVyZS4uLlwiXG4gICAgICAgIDogXCJUeXBlIGhlcmUuLi5cIixcbiAgICAgIHN1Ym1pdExhYmVsLFxuICAgICAgbXVsdGlsaW5lLFxuICAgIH0pLm9wZW5Qcm9tcHQoKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odmFsdWUpO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkJyYWluIGNvdWxkIG5vdCBzYXZlIHRoYXQgZW50cnlcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY2FwdHVyZU5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICByZXR1cm4gYENhcHR1cmVkIG5vdGUgaW4gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVKb3VybmFsKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgam91cm5hbCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NJbmJveCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmdldFJlY2VudEluYm94RW50cmllcygpO1xuICAgIGlmICghZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBpbmJveCBlbnRyaWVzIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBJbmJveFJldmlld01vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzLnJldmlld1NlcnZpY2UsIGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICB9KS5vcGVuKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBMb2FkZWQgJHtlbnRyaWVzLmxlbmd0aH0gaW5ib3ggZW50cmllc2ApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBhc3luYyBvcGVuUmV2aWV3SGlzdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmdldFJldmlld0VudHJpZXMoKTtcbiAgICBuZXcgUmV2aWV3SGlzdG9yeU1vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBhZGRUYXNrRnJvbVNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3Rpb24gPSB0aGlzLndvcmtmbG93U2VydmljZS5nZXRBY3RpdmVTZWxlY3Rpb25UZXh0KCk7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2soc2VsZWN0aW9uKTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgU2F2ZWQgdGFzayBmcm9tIHNlbGVjdGlvbiB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBOb3RpY2UoXCJObyBzZWxlY3Rpb24gZm91bmQuIE9wZW5pbmcgdGFzayBlbnRyeSBtb2RhbC5cIik7XG4gICAgYXdhaXQgdGhpcy5jYXB0dXJlRnJvbU1vZGFsKFwiQWRkIFRhc2tcIiwgXCJTYXZlIHRhc2tcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgb3BlblRvZGF5c0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuZW5zdXJlSm91cm5hbEZpbGUoKTtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRvZGF5J3Mgam91cm5hbFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgT3BlbmVkICR7ZmlsZS5wYXRofWA7XG4gICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBnZXRJbmJveENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLmdldFVucmV2aWV3ZWRDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmdldE9wZW5UYXNrQ291bnQoKTtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0hpc3RvcnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cnlDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuUmV2aWV3RW50cnkoZW50cnk6IHtcbiAgICBoZWFkaW5nOiBzdHJpbmc7XG4gICAgcHJldmlldzogc3RyaW5nO1xuICAgIHNpZ25hdHVyZTogc3RyaW5nO1xuICAgIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5yZW9wZW5Gcm9tUmV2aWV3TG9nKHtcbiAgICAgIGFjdGlvbjogXCJyZW9wZW5cIixcbiAgICAgIHRpbWVzdGFtcDogXCJcIixcbiAgICAgIHNvdXJjZVBhdGg6IFwiXCIsXG4gICAgICBmaWxlTXRpbWU6IERhdGUubm93KCksXG4gICAgICBlbnRyeUluZGV4OiAwLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgZ2V0QWlTdGF0dXNUZXh0KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzICYmICF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIFwiQUkgb2ZmXCI7XG4gICAgfVxuICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGlmICghYWlTdGF0dXMuY29uZmlndXJlZCkge1xuICAgICAgcmV0dXJuIGFpU3RhdHVzLm1lc3NhZ2UucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuICAgIH1cbiAgICBjb25zdCBwcm92aWRlciA9IGFpU3RhdHVzLnByb3ZpZGVyID8/IFwiQUlcIjtcbiAgICBjb25zdCBtb2RlbCA9IGFpU3RhdHVzLm1vZGVsID8gYCAoJHthaVN0YXR1cy5tb2RlbH0pYCA6IFwiXCI7XG4gICAgcmV0dXJuIGAke3Byb3ZpZGVyfSR7bW9kZWx9YDtcbiAgfVxuXG4gIHByaXZhdGUgaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk/LmZpbGUpO1xuICB9XG59XG4iLCAiZXhwb3J0IGludGVyZmFjZSBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgaW5ib3hGaWxlOiBzdHJpbmc7XG4gIHRhc2tzRmlsZTogc3RyaW5nO1xuICBqb3VybmFsRm9sZGVyOiBzdHJpbmc7XG4gIG5vdGVzRm9sZGVyOiBzdHJpbmc7XG4gIHN1bW1hcmllc0ZvbGRlcjogc3RyaW5nO1xuICByZXZpZXdzRm9sZGVyOiBzdHJpbmc7XG5cbiAgZW5hYmxlQUlTdW1tYXJpZXM6IGJvb2xlYW47XG4gIGVuYWJsZUFJUm91dGluZzogYm9vbGVhbjtcblxuICBvcGVuQUlBcGlLZXk6IHN0cmluZztcbiAgb3BlbkFJTW9kZWw6IHN0cmluZztcbiAgb3BlbkFJQmFzZVVybDogc3RyaW5nO1xuXG4gIGFpUHJvdmlkZXI6IFwib3BlbmFpXCIgfCBcImNvZGV4XCIgfCBcImdlbWluaVwiO1xuICBjb2RleE1vZGVsOiBzdHJpbmc7XG4gIGdlbWluaUFwaUtleTogc3RyaW5nO1xuICBnZW1pbmlNb2RlbDogc3RyaW5nO1xuXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IG51bWJlcjtcbiAgc3VtbWFyeU1heENoYXJzOiBudW1iZXI7XG5cbiAgcGVyc2lzdFN1bW1hcmllczogYm9vbGVhbjtcblxuICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CUkFJTl9TRVRUSU5HUzogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgaW5ib3hGaWxlOiBcIkJyYWluL2luYm94Lm1kXCIsXG4gIHRhc2tzRmlsZTogXCJCcmFpbi90YXNrcy5tZFwiLFxuICBqb3VybmFsRm9sZGVyOiBcIkJyYWluL2pvdXJuYWxcIixcbiAgbm90ZXNGb2xkZXI6IFwiQnJhaW4vbm90ZXNcIixcbiAgc3VtbWFyaWVzRm9sZGVyOiBcIkJyYWluL3N1bW1hcmllc1wiLFxuICByZXZpZXdzRm9sZGVyOiBcIkJyYWluL3Jldmlld3NcIixcbiAgZW5hYmxlQUlTdW1tYXJpZXM6IGZhbHNlLFxuICBlbmFibGVBSVJvdXRpbmc6IGZhbHNlLFxuICBvcGVuQUlBcGlLZXk6IFwiXCIsXG4gIG9wZW5BSU1vZGVsOiBcImdwdC00by1taW5pXCIsXG4gIG9wZW5BSUJhc2VVcmw6IFwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zXCIsXG4gIGFpUHJvdmlkZXI6IFwib3BlbmFpXCIsXG4gIGNvZGV4TW9kZWw6IFwiXCIsXG4gIGdlbWluaUFwaUtleTogXCJcIixcbiAgZ2VtaW5pTW9kZWw6IFwiZ2VtaW5pLTEuNS1mbGFzaFwiLFxuICBzdW1tYXJ5TG9va2JhY2tEYXlzOiA3LFxuICBzdW1tYXJ5TWF4Q2hhcnM6IDEyMDAwLFxuICBwZXJzaXN0U3VtbWFyaWVzOiB0cnVlLFxuICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IFtdLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MoXG4gIGlucHV0OiBQYXJ0aWFsPEJyYWluUGx1Z2luU2V0dGluZ3M+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgY29uc3QgbWVyZ2VkOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICAgIC4uLkRFRkFVTFRfQlJBSU5fU0VUVElOR1MsXG4gICAgLi4uaW5wdXQsXG4gIH0gYXMgQnJhaW5QbHVnaW5TZXR0aW5ncztcblxuICByZXR1cm4ge1xuICAgIGluYm94RmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKG1lcmdlZC5pbmJveEZpbGUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5ib3hGaWxlKSxcbiAgICB0YXNrc0ZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChtZXJnZWQudGFza3NGaWxlLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnRhc2tzRmlsZSksXG4gICAgam91cm5hbEZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLmpvdXJuYWxGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmpvdXJuYWxGb2xkZXIsXG4gICAgKSxcbiAgICBub3Rlc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLm5vdGVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5ub3Rlc0ZvbGRlcixcbiAgICApLFxuICAgIHN1bW1hcmllc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muc3VtbWFyaWVzRm9sZGVyLFxuICAgICksXG4gICAgcmV2aWV3c0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLnJldmlld3NGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnJldmlld3NGb2xkZXIsXG4gICAgKSxcbiAgICBlbmFibGVBSVN1bW1hcmllczogQm9vbGVhbihtZXJnZWQuZW5hYmxlQUlTdW1tYXJpZXMpLFxuICAgIGVuYWJsZUFJUm91dGluZzogQm9vbGVhbihtZXJnZWQuZW5hYmxlQUlSb3V0aW5nKSxcbiAgICBvcGVuQUlBcGlLZXk6IHR5cGVvZiBtZXJnZWQub3BlbkFJQXBpS2V5ID09PSBcInN0cmluZ1wiID8gbWVyZ2VkLm9wZW5BSUFwaUtleS50cmltKCkgOiBcIlwiLFxuICAgIG9wZW5BSU1vZGVsOlxuICAgICAgdHlwZW9mIG1lcmdlZC5vcGVuQUlNb2RlbCA9PT0gXCJzdHJpbmdcIiAmJiBtZXJnZWQub3BlbkFJTW9kZWwudHJpbSgpXG4gICAgICAgID8gbWVyZ2VkLm9wZW5BSU1vZGVsLnRyaW0oKVxuICAgICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1Mub3BlbkFJTW9kZWwsXG4gICAgb3BlbkFJQmFzZVVybDpcbiAgICAgIHR5cGVvZiBtZXJnZWQub3BlbkFJQmFzZVVybCA9PT0gXCJzdHJpbmdcIiAmJiBtZXJnZWQub3BlbkFJQmFzZVVybC50cmltKClcbiAgICAgICAgPyBtZXJnZWQub3BlbkFJQmFzZVVybC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm9wZW5BSUJhc2VVcmwsXG4gICAgYWlQcm92aWRlcjpcbiAgICAgIG1lcmdlZC5haVByb3ZpZGVyID09PSBcImdlbWluaVwiXG4gICAgICAgID8gXCJnZW1pbmlcIlxuICAgICAgICA6IG1lcmdlZC5haVByb3ZpZGVyID09PSBcImNvZGV4XCJcbiAgICAgICAgICA/IFwiY29kZXhcIlxuICAgICAgICAgIDogXCJvcGVuYWlcIixcbiAgICBjb2RleE1vZGVsOiB0eXBlb2YgbWVyZ2VkLmNvZGV4TW9kZWwgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQuY29kZXhNb2RlbC50cmltKCkgOiBcIlwiLFxuICAgIGdlbWluaUFwaUtleTogdHlwZW9mIG1lcmdlZC5nZW1pbmlBcGlLZXkgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQuZ2VtaW5pQXBpS2V5LnRyaW0oKSA6IFwiXCIsXG4gICAgZ2VtaW5pTW9kZWw6XG4gICAgICB0eXBlb2YgbWVyZ2VkLmdlbWluaU1vZGVsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5nZW1pbmlNb2RlbC50cmltKClcbiAgICAgICAgPyBtZXJnZWQuZ2VtaW5pTW9kZWwudHJpbSgpXG4gICAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5nZW1pbmlNb2RlbCxcbiAgICBzdW1tYXJ5TG9va2JhY2tEYXlzOiBjbGFtcEludGVnZXIobWVyZ2VkLnN1bW1hcnlMb29rYmFja0RheXMsIDEsIDM2NSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICBzdW1tYXJ5TWF4Q2hhcnM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeU1heENoYXJzLCAxMDAwLCAxMDAwMDAsIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muc3VtbWFyeU1heENoYXJzKSxcbiAgICBwZXJzaXN0U3VtbWFyaWVzOiBCb29sZWFuKG1lcmdlZC5wZXJzaXN0U3VtbWFyaWVzKSxcbiAgICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IEFycmF5LmlzQXJyYXkobWVyZ2VkLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucylcbiAgICAgID8gKG1lcmdlZC5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMgYXMgc3RyaW5nW10pLmZpbHRlcigocykgPT4gdHlwZW9mIHMgPT09IFwic3RyaW5nXCIpXG4gICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1MuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGl2ZVBhdGgodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBjbGFtcEludGVnZXIoXG4gIHZhbHVlOiB1bmtub3duLFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXIsXG4gIGZhbGxiYWNrOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBwYXJzZWQpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHtcbiAgZ2V0TW9kZWxEcm9wZG93blZhbHVlLFxuICBnZXROZXh0TW9kZWxWYWx1ZSxcbiAgaXNDdXN0b21Nb2RlbFZhbHVlLFxufSBmcm9tIFwiLi4vdXRpbHMvbW9kZWwtc2VsZWN0aW9uXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5cbmNvbnN0IE9QRU5BSV9QUkVTRVRfTU9ERUxTID0gW1xuICBcImdwdC00by1taW5pXCIsXG4gIFwiZ3B0LTRvXCIsXG4gIFwibzEtbWluaVwiLFxuICBcIm8xLXByZXZpZXdcIixcbiAgXCJncHQtMy41LXR1cmJvXCIsXG5dIGFzIGNvbnN0O1xuXG5jb25zdCBHRU1JTklfUFJFU0VUX01PREVMUyA9IFtcbiAgXCJnZW1pbmktMS41LWZsYXNoXCIsXG4gIFwiZ2VtaW5pLTEuNS1mbGFzaC04YlwiLFxuICBcImdlbWluaS0xLjUtcHJvXCIsXG4gIFwiZ2VtaW5pLTIuMC1mbGFzaFwiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblxuICAgIC8vIExpc3RlbiBmb3Igc2V0dGluZyB1cGRhdGVzIChlLmcuLCBmcm9tIGF1dGggZmxvdylcbiAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uKFwiYnJhaW46c2V0dGluZ3MtdXBkYXRlZFwiIGFzIG5ldmVyLCAoKSA9PiB7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluIFNldHRpbmdzXCIgfSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdG9yYWdlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5ib3ggZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHVzZWQgZm9yIHF1aWNrIG5vdGUgY2FwdHVyZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluYm94RmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluYm94RmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSW5ib3ggZmlsZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlRhc2tzIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB1c2VkIGZvciBxdWljayB0YXNrIGNhcHR1cmUuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZpbGUsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZpbGUgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlRhc2tzIGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJKb3VybmFsIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgY29udGFpbmluZyBkYWlseSBqb3VybmFsIGZpbGVzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmpvdXJuYWxGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkpvdXJuYWwgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTm90ZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIGZvciBwcm9tb3RlZCBub3RlcyBhbmQgZ2VuZXJhdGVkIG1hcmtkb3duIGFydGlmYWN0cy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIk5vdGVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlN1bW1hcmllcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgZm9yIHBlcnNpc3RlZCBzdW1tYXJpZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlN1bW1hcmllcyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZXZpZXdzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCB0byBzdG9yZSBpbmJveCByZXZpZXcgbG9ncy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXZpZXdzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJSZXZpZXdzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQUlcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBSSBQcm92aWRlclwiKVxuICAgICAgLnNldERlc2MoXCJDaG9vc2UgdGhlIHByb3ZpZGVyIEJyYWluIHNob3VsZCB1c2UgZm9yIHN5bnRoZXNpcywgcXVlc3Rpb25zLCB0b3BpYyBwYWdlcywgYW5kIG9wdGlvbmFsIGF1dG8tcm91dGluZy5cIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgb3BlbmFpOiBcIk9wZW5BSSBBUElcIixcbiAgICAgICAgICAgIGNvZGV4OiBcIk9wZW5BSSBDb2RleCAoQ2hhdEdQVClcIixcbiAgICAgICAgICAgIGdlbWluaTogXCJHb29nbGUgR2VtaW5pXCIsXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlcilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyID0gdmFsdWUgYXMgXCJvcGVuYWlcIiB8IFwiY29kZXhcIiB8IFwiZ2VtaW5pXCI7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpOyAvLyBSZWZyZXNoIFVJIHRvIHNob3cgcmVsZXZhbnQgZmllbGRzXG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgdGhpcy5jcmVhdGVBSVN0YXR1c1NldHRpbmcoY29udGFpbmVyRWwpO1xuXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwib3BlbmFpXCIpIHtcbiAgICAgIGNvbnN0IGF1dGhTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIHNldHVwXCIpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleVxuICAgICAgICAgICAgPyBcIk9wZW5BSSBpcyByZWFkeS4gVGhlIEFQSSBrZXkgaXMgc3RvcmVkIGxvY2FsbHkgaW4gQnJhaW4gc2V0dGluZ3MuXCJcbiAgICAgICAgICAgIDogXCJVc2UgYW4gT3BlbkFJIEFQSSBrZXkgZnJvbSBwbGF0Zm9ybS5vcGVuYWkuY29tLCBvciBwb2ludCBCcmFpbiBhdCBhbiBPcGVuQUktY29tcGF0aWJsZSBlbmRwb2ludCBiZWxvdy5cIixcbiAgICAgICAgKTtcblxuICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSkge1xuICAgICAgICBhdXRoU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiRGlzY29ubmVjdFwiKVxuICAgICAgICAgICAgLnNldFdhcm5pbmcoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPSBcIlwiO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIE9wZW5BSSBTZXR1cFwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKFwib3BlbmFpXCIpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIk9wZW5BSSBBUEkga2V5XCIpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIFwiU3RvcmVkIGxvY2FsbHkgaW4gcGx1Z2luIHNldHRpbmdzLiBVc2UgYW4gQVBJIGtleSBmb3IgdGhlIGRlZmF1bHQgT3BlbkFJIGVuZHBvaW50LiBJZiB5b3Ugb3ZlcnJpZGUgdGhlIGJhc2UgVVJMIGJlbG93LCB0aGlzIGZpZWxkIGlzIHVzZWQgYXMgdGhhdCBlbmRwb2ludCdzIGJlYXJlciB0b2tlbi5cIixcbiAgICAgICAgKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciBPcGVuQUkgQVBJIGtleS4uLlwiKTtcbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXksXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJPcGVuQUkgbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJTZWxlY3QgYSBtb2RlbCBvciBlbnRlciBhIGN1c3RvbSBvbmUuXCIpXG4gICAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgICBkcm9wZG93blxuICAgICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgICBcImdwdC00by1taW5pXCI6IFwiR1BULTRvIE1pbmkgKERlZmF1bHQpXCIsXG4gICAgICAgICAgICAgIFwiZ3B0LTRvXCI6IFwiR1BULTRvIChQb3dlcmZ1bClcIixcbiAgICAgICAgICAgICAgXCJvMS1taW5pXCI6IFwibzEgTWluaSAoUmVhc29uaW5nKVwiLFxuICAgICAgICAgICAgICBcIm8xLXByZXZpZXdcIjogXCJvMSBQcmV2aWV3IChTdHJvbmcgUmVhc29uaW5nKVwiLFxuICAgICAgICAgICAgICBcImdwdC0zLjUtdHVyYm9cIjogXCJHUFQtMy41IFR1cmJvIChMZWdhY3kpXCIsXG4gICAgICAgICAgICAgIGN1c3RvbTogXCJDdXN0b20gTW9kZWwuLi5cIixcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc2V0VmFsdWUoZ2V0TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLCBPUEVOQUlfUFJFU0VUX01PREVMUykpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IG5leHRNb2RlbCA9IGdldE5leHRNb2RlbFZhbHVlKFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLFxuICAgICAgICAgICAgICAgIE9QRU5BSV9QUkVTRVRfTU9ERUxTLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAobmV4dE1vZGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwgPSBuZXh0TW9kZWw7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IFwiY3VzdG9tXCIgJiYgbmV4dE1vZGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKG5leHRNb2RlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBpc0N1c3RvbSA9IGlzQ3VzdG9tTW9kZWxWYWx1ZShcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLFxuICAgICAgICAgICAgT1BFTkFJX1BSRVNFVF9NT0RFTFMsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoaXNDdXN0b20pIHtcbiAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciBjdXN0b20gbW9kZWwgbmFtZS4uLlwiKTtcbiAgICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKHRleHQsIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiU2VsZWN0IEN1c3RvbSBNb2RlbC4uLiB0byBlbnRlciBhIG1vZGVsIG5hbWVcIik7XG4gICAgICAgICAgICB0ZXh0LnNldFZhbHVlKFwiXCIpO1xuICAgICAgICAgICAgdGV4dC5pbnB1dEVsLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcblxuICAgICAgICAuc2V0TmFtZShcIk9wZW5BSSBiYXNlIFVSTFwiKVxuICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICBcIk92ZXJyaWRlIHRoZSBkZWZhdWx0IE9wZW5BSSBlbmRwb2ludCBmb3IgY3VzdG9tIHByb3hpZXMgb3IgbG9jYWwgTExNcy4gSWYgeW91IHNldCB0aGlzLCB0aGUgYmVhcmVyIHRva2VuIGFib3ZlIGlzIHNlbnQgdG8gdGhhdCBlbmRwb2ludC5cIixcbiAgICAgICAgKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlCYXNlVXJsLFxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUJhc2VVcmwgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICYmICF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiT3BlbkFJIGJhc2UgVVJMIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImNvZGV4XCIpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkNvZGV4IHNldHVwXCIpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIFwiVXNlIHlvdXIgQ2hhdEdQVCBzdWJzY3JpcHRpb24gdGhyb3VnaCB0aGUgb2ZmaWNpYWwgQ29kZXggQ0xJLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gY2hlY2sgQnJhaW4ncyBzaWRlYmFyIHN0YXR1cyB0byBjb25maXJtIENvZGV4IGlzIHJlYWR5LlwiLFxuICAgICAgICApXG4gICAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiT3BlbiBDb2RleCBTZXR1cFwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKFwiY29kZXhcIik7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiQ29kZXggbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJPcHRpb25hbC4gTGVhdmUgYmxhbmsgdG8gdXNlIHRoZSBDb2RleCBDTEkgZGVmYXVsdCBtb2RlbCBmb3IgeW91ciBhY2NvdW50LlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyh0ZXh0LCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIGNvbnN0IGF1dGhTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiR2VtaW5pIHNldHVwXCIpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleVxuICAgICAgICAgICAgPyBcIkdlbWluaSBpcyByZWFkeS4gVGhlIEFQSSBrZXkgaXMgc3RvcmVkIGxvY2FsbHkgaW4gQnJhaW4gc2V0dGluZ3MuXCJcbiAgICAgICAgICAgIDogXCJVc2UgYSBHZW1pbmkgQVBJIGtleSBmcm9tIEdvb2dsZSBBSSBTdHVkaW8sIHRoZW4gcGFzdGUgaXQgYmVsb3cuXCIsXG4gICAgICAgICk7XG5cbiAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkpIHtcbiAgICAgICAgYXV0aFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkRpc2Nvbm5lY3RcIilcbiAgICAgICAgICAgIC5zZXRXYXJuaW5nKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5ID0gXCJcIjtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdXRoU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiT3BlbiBHZW1pbmkgU2V0dXBcIilcbiAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hdXRoU2VydmljZS5sb2dpbihcImdlbWluaVwiKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJHZW1pbmkgQVBJIGtleVwiKVxuICAgICAgICAuc2V0RGVzYyhcIlN0b3JlZCBsb2NhbGx5IGluIHBsdWdpbiBzZXR0aW5ncy4gR2VuZXJhdGVkIGZyb20gR29vZ2xlIEFJIFN0dWRpby5cIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwicGFzc3dvcmRcIjtcbiAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgR2VtaW5pIEFQSSBrZXkuLi5cIik7XG4gICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LFxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiR2VtaW5pIG1vZGVsXCIpXG4gICAgICAgIC5zZXREZXNjKFwiU2VsZWN0IGEgR2VtaW5pIG1vZGVsIG9yIGVudGVyIGEgY3VzdG9tIG9uZS5cIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTEuNS1mbGFzaFwiOiBcIkdlbWluaSAxLjUgRmxhc2ggKEZhc3Rlc3QpXCIsXG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTEuNS1mbGFzaC04YlwiOiBcIkdlbWluaSAxLjUgRmxhc2ggOEIgKExpZ2h0ZXIpXCIsXG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTEuNS1wcm9cIjogXCJHZW1pbmkgMS41IFBybyAoUG93ZXJmdWwpXCIsXG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTIuMC1mbGFzaFwiOiBcIkdlbWluaSAyLjAgRmxhc2ggKExhdGVzdClcIixcbiAgICAgICAgICAgICAgY3VzdG9tOiBcIkN1c3RvbSBNb2RlbC4uLlwiLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zZXRWYWx1ZShnZXRNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwsIEdFTUlOSV9QUkVTRVRfTU9ERUxTKSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgbmV4dE1vZGVsID0gZ2V0TmV4dE1vZGVsVmFsdWUoXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwsXG4gICAgICAgICAgICAgICAgR0VNSU5JX1BSRVNFVF9NT0RFTFMsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCA9IG5leHRNb2RlbDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gXCJjdXN0b21cIiAmJiBuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobmV4dE1vZGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQ3VzdG9tID0gaXNDdXN0b21Nb2RlbFZhbHVlKFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwsXG4gICAgICAgICAgICBHRU1JTklfUFJFU0VUX01PREVMUyxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChpc0N1c3RvbSkge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIGN1c3RvbSBtb2RlbCBuYW1lLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcodGV4dCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJTZWxlY3QgQ3VzdG9tIE1vZGVsLi4uIHRvIGVudGVyIGEgbW9kZWwgbmFtZVwiKTtcbiAgICAgICAgICAgIHRleHQuc2V0VmFsdWUoXCJcIik7XG4gICAgICAgICAgICB0ZXh0LmlucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQUkgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgQUkgc3ludGhlc2lzXCIpXG4gICAgICAuc2V0RGVzYyhcIlVzZSBBSSBmb3Igc3ludGhlc2lzLCBxdWVzdGlvbiBhbnN3ZXJpbmcsIGFuZCB0b3BpYyBwYWdlcyB3aGVuIGNvbmZpZ3VyZWQuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBBSSByb3V0aW5nXCIpXG4gICAgICAuc2V0RGVzYyhcIkFsbG93IHRoZSBzaWRlYmFyIHRvIGF1dG8tcm91dGUgY2FwdHVyZXMgd2l0aCBBSS5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkNvbnRleHQgQ29sbGVjdGlvblwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkxvb2tiYWNrIGRheXNcIilcbiAgICAgIC5zZXREZXNjKFwiSG93IGZhciBiYWNrIHRvIHNjYW4gd2hlbiBidWlsZGluZyByZWNlbnQtY29udGV4dCBzdW1tYXJpZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICBTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyksXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXMgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwID8gcGFyc2VkIDogNztcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJNYXhpbXVtIGNoYXJhY3RlcnNcIilcbiAgICAgIC5zZXREZXNjKFwiTWF4aW11bSB0ZXh0IGNvbGxlY3RlZCBiZWZvcmUgc3ludGhlc2lzIG9yIHN1bW1hcnkuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICBTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzKSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzID1cbiAgICAgICAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID49IDEwMDAgPyBwYXJzZWQgOiAxMjAwMDtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN1bW1hcnkgT3V0cHV0XCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUGVyc2lzdCBzdW1tYXJpZXNcIilcbiAgICAgIC5zZXREZXNjKFwiV3JpdGUgZ2VuZXJhdGVkIHN1bW1hcmllcyBpbnRvIHRoZSB2YXVsdC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnBlcnNpc3RTdW1tYXJpZXMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnBlcnNpc3RTdW1tYXJpZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVBSVN0YXR1c1NldHRpbmcoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdHVzU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQcm92aWRlciBzdGF0dXNcIilcbiAgICAgIC5zZXREZXNjKFwiQ3VycmVudCByZWFkaW5lc3MgZm9yIHRoZSBzZWxlY3RlZCBBSSBwcm92aWRlci5cIik7XG4gICAgc3RhdHVzU2V0dGluZy5zZXREZXNjKFwiQ2hlY2tpbmcgcHJvdmlkZXIgc3RhdHVzLi4uXCIpO1xuICAgIHZvaWQgdGhpcy5yZWZyZXNoQUlTdGF0dXMoc3RhdHVzU2V0dGluZyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hBSVN0YXR1cyhzZXR0aW5nOiBTZXR0aW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICBzZXR0aW5nLnNldERlc2Moc3RhdHVzLm1lc3NhZ2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBiaW5kVGV4dFNldHRpbmcoXG4gICAgdGV4dDogVGV4dENvbXBvbmVudCxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIG9uVmFsdWVDaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IFRleHRDb21wb25lbnQge1xuICAgIGxldCBjdXJyZW50VmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgbGFzdFNhdmVkVmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgaXNTYXZpbmcgPSBmYWxzZTtcblxuICAgIHRleHQuc2V0VmFsdWUodmFsdWUpLm9uQ2hhbmdlKChuZXh0VmFsdWUpID0+IHtcbiAgICAgIGlmICh2YWxpZGF0ZSAmJiAhdmFsaWRhdGUobmV4dFZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjdXJyZW50VmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgICBvblZhbHVlQ2hhbmdlKG5leHRWYWx1ZSk7XG4gICAgfSk7XG4gICAgdGhpcy5xdWV1ZVNhdmVPbkJsdXIoXG4gICAgICB0ZXh0LmlucHV0RWwsXG4gICAgICAoKSA9PiBjdXJyZW50VmFsdWUsXG4gICAgICAoKSA9PiBsYXN0U2F2ZWRWYWx1ZSxcbiAgICAgIChzYXZlZFZhbHVlKSA9PiB7XG4gICAgICAgIGxhc3RTYXZlZFZhbHVlID0gc2F2ZWRWYWx1ZTtcbiAgICAgIH0sXG4gICAgICAoKSA9PiBpc1NhdmluZyxcbiAgICAgIChzYXZpbmcpID0+IHtcbiAgICAgICAgaXNTYXZpbmcgPSBzYXZpbmc7XG4gICAgICB9LFxuICAgICAgdmFsaWRhdGUsXG4gICAgKTtcbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVTYXZlT25CbHVyKFxuICAgIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50LFxuICAgIGdldEN1cnJlbnRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIGdldExhc3RTYXZlZFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgc2V0TGFzdFNhdmVkVmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIGlzU2F2aW5nOiAoKSA9PiBib29sZWFuLFxuICAgIHNldFNhdmluZzogKHNhdmluZzogYm9vbGVhbikgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiB2b2lkIHtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuc2F2ZU9uQmx1cihcbiAgICAgICAgZ2V0Q3VycmVudFZhbHVlLFxuICAgICAgICBnZXRMYXN0U2F2ZWRWYWx1ZSxcbiAgICAgICAgc2V0TGFzdFNhdmVkVmFsdWUsXG4gICAgICAgIGlzU2F2aW5nLFxuICAgICAgICBzZXRTYXZpbmcsXG4gICAgICAgIHZhbGlkYXRlLFxuICAgICAgKTtcbiAgICB9KTtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiZcbiAgICAgICAgIWV2ZW50Lm1ldGFLZXkgJiZcbiAgICAgICAgIWV2ZW50LmN0cmxLZXkgJiZcbiAgICAgICAgIWV2ZW50LmFsdEtleSAmJlxuICAgICAgICAhZXZlbnQuc2hpZnRLZXlcbiAgICAgICkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVPbkJsdXIoXG4gICAgZ2V0Q3VycmVudFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgZ2V0TGFzdFNhdmVkVmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRMYXN0U2F2ZWRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgaXNTYXZpbmc6ICgpID0+IGJvb2xlYW4sXG4gICAgc2V0U2F2aW5nOiAoc2F2aW5nOiBib29sZWFuKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChpc1NhdmluZygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFZhbHVlID0gZ2V0Q3VycmVudFZhbHVlKCk7XG4gICAgaWYgKGN1cnJlbnRWYWx1ZSA9PT0gZ2V0TGFzdFNhdmVkVmFsdWUoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWxpZGF0ZSAmJiAhdmFsaWRhdGUoY3VycmVudFZhbHVlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNhdmluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBzZXRMYXN0U2F2ZWRWYWx1ZShjdXJyZW50VmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRTYXZpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBpc0N1c3RvbU1vZGVsVmFsdWUoXG4gIHZhbHVlOiBzdHJpbmcsXG4gIHByZXNldE1vZGVsczogcmVhZG9ubHkgc3RyaW5nW10sXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuICFwcmVzZXRNb2RlbHMuaW5jbHVkZXModmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxEcm9wZG93blZhbHVlKFxuICB2YWx1ZTogc3RyaW5nLFxuICBwcmVzZXRNb2RlbHM6IHJlYWRvbmx5IHN0cmluZ1tdLFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzQ3VzdG9tTW9kZWxWYWx1ZSh2YWx1ZSwgcHJlc2V0TW9kZWxzKSA/IFwiY3VzdG9tXCIgOiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5leHRNb2RlbFZhbHVlKFxuICBzZWxlY3Rpb246IHN0cmluZyxcbiAgY3VycmVudFZhbHVlOiBzdHJpbmcsXG4gIHByZXNldE1vZGVsczogcmVhZG9ubHkgc3RyaW5nW10sXG4pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHNlbGVjdGlvbiA9PT0gXCJjdXN0b21cIikge1xuICAgIHJldHVybiBpc0N1c3RvbU1vZGVsVmFsdWUoY3VycmVudFZhbHVlLCBwcmVzZXRNb2RlbHMpID8gY3VycmVudFZhbHVlIDogXCJcIjtcbiAgfVxuXG4gIHJldHVybiBwcmVzZXRNb2RlbHMuaW5jbHVkZXMoc2VsZWN0aW9uKSA/IHNlbGVjdGlvbiA6IG51bGw7XG59XG4iLCAiZXhwb3J0IHR5cGUgQ29kZXhMb2dpblN0YXR1cyA9IFwibG9nZ2VkLWluXCIgfCBcImxvZ2dlZC1vdXRcIiB8IFwidW5hdmFpbGFibGVcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhvdXRwdXQ6IHN0cmluZyk6IENvZGV4TG9naW5TdGF0dXMge1xuICBjb25zdCBub3JtYWxpemVkID0gb3V0cHV0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cblxuICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcIm5vdCBsb2dnZWQgaW5cIikgfHwgbm9ybWFsaXplZC5pbmNsdWRlcyhcImxvZ2dlZCBvdXRcIikpIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cblxuICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcImxvZ2dlZCBpblwiKSkge1xuICAgIHJldHVybiBcImxvZ2dlZC1pblwiO1xuICB9XG5cbiAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZXhMb2dpblN0YXR1cygpOiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHtcbiAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgIHJldHVybiBcInVuYXZhaWxhYmxlXCI7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGV4ZWNGaWxlQXN5bmMgPSBnZXRFeGVjRmlsZUFzeW5jKCk7XG4gICAgY29uc3QgeyBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgZXhlY0ZpbGVBc3luYyhjb2RleEJpbmFyeSwgW1wibG9naW5cIiwgXCJzdGF0dXNcIl0sIHtcbiAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpKSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4QmluYXJ5UGF0aCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgY29uc3QgZnMgPSByZXEoXCJmc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnNcIik7XG4gIGNvbnN0IHBhdGggPSByZXEoXCJwYXRoXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpO1xuICBjb25zdCBvcyA9IHJlcShcIm9zXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcblxuICBjb25zdCBjYW5kaWRhdGVzID0gYnVpbGRDb2RleENhbmRpZGF0ZXMocGF0aCwgb3MuaG9tZWRpcigpKTtcbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3MoY2FuZGlkYXRlKTtcbiAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBLZWVwIHNlYXJjaGluZy5cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNFbm9lbnRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJjb2RlXCIgaW4gZXJyb3IgJiYgZXJyb3IuY29kZSA9PT0gXCJFTk9FTlRcIjtcbn1cblxuZnVuY3Rpb24gZ2V0RXhlY0ZpbGVBc3luYygpOiAoXG4gIGZpbGU6IHN0cmluZyxcbiAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCB7IGV4ZWNGaWxlIH0gPSByZXEoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICBjb25zdCB7IHByb21pc2lmeSB9ID0gcmVxKFwidXRpbFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwidXRpbFwiKTtcbiAgcmV0dXJuIHByb21pc2lmeShleGVjRmlsZSkgYXMgKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVSZXF1aXJlKCk6IE5vZGVSZXF1aXJlIHtcbiAgcmV0dXJuIEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKSBhcyBOb2RlUmVxdWlyZTtcbn1cblxuZnVuY3Rpb24gYnVpbGRDb2RleENhbmRpZGF0ZXMocGF0aE1vZHVsZTogdHlwZW9mIGltcG9ydChcInBhdGhcIiksIGhvbWVEaXI6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwYXRoRW50cmllcyA9IChwcm9jZXNzLmVudi5QQVRIID8/IFwiXCIpLnNwbGl0KHBhdGhNb2R1bGUuZGVsaW1pdGVyKS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBwYXRoRW50cmllcykge1xuICAgIGNhbmRpZGF0ZXMuYWRkKHBhdGhNb2R1bGUuam9pbihlbnRyeSwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICBjb25zdCBjb21tb25EaXJzID0gW1xuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgYCR7aG9tZURpcn0vLmxvY2FsL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmJ1bi9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5jb2RlaXVtL3dpbmRzdXJmL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmFudGlncmF2aXR5L2FudGlncmF2aXR5L2JpbmAsXG4gICAgXCIvQXBwbGljYXRpb25zL0NvZGV4LmFwcC9Db250ZW50cy9SZXNvdXJjZXNcIixcbiAgXTtcblxuICBmb3IgKGNvbnN0IGRpciBvZiBjb21tb25EaXJzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGRpciwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShjYW5kaWRhdGVzKTtcbn1cblxuZnVuY3Rpb24gY29kZXhFeGVjdXRhYmxlTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJjb2RleC5jbWRcIiA6IFwiY29kZXhcIjtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlDb25maWd1cmF0aW9uU3RhdHVzIHtcbiAgY29uZmlndXJlZDogYm9vbGVhbjtcbiAgcHJvdmlkZXI6IFwib3BlbmFpXCIgfCBcImNvZGV4XCIgfCBcImdlbWluaVwiIHwgbnVsbDtcbiAgbW9kZWw6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBpZiAoc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJjb2RleFwiKSB7XG4gICAgY29uc3QgY29kZXhTdGF0dXMgPSBhd2FpdCBnZXRDb2RleExvZ2luU3RhdHVzKCk7XG4gICAgaWYgKGNvZGV4U3RhdHVzID09PSBcInVuYXZhaWxhYmxlXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgICBtb2RlbDogbnVsbCxcbiAgICAgICAgbWVzc2FnZTogXCJDb2RleCBDTEkgbm90IGluc3RhbGxlZC5cIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNvZGV4U3RhdHVzICE9PSBcImxvZ2dlZC1pblwiKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICAgICAgbW9kZWw6IG51bGwsXG4gICAgICAgIG1lc3NhZ2U6IFwiQ29kZXggQ0xJIG5vdCBsb2dnZWQgaW4uXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGVsID0gc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkgfHwgbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICAgIHByb3ZpZGVyOiBcImNvZGV4XCIsXG4gICAgICBtb2RlbCxcbiAgICAgIG1lc3NhZ2U6IG1vZGVsXG4gICAgICAgID8gYFJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIG1vZGVsICR7bW9kZWx9LmBcbiAgICAgICAgOiBcIlJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIHRoZSBhY2NvdW50IGRlZmF1bHQgbW9kZWwuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgaWYgKCFzZXR0aW5ncy5nZW1pbmlBcGlLZXkudHJpbSgpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgICAgcHJvdmlkZXI6IFwiZ2VtaW5pXCIsXG4gICAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgICBtZXNzYWdlOiBcIkdlbWluaSBBUEkga2V5IG1pc3NpbmcuXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghc2V0dGluZ3MuZ2VtaW5pTW9kZWwudHJpbSgpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgICAgcHJvdmlkZXI6IFwiZ2VtaW5pXCIsXG4gICAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgICBtZXNzYWdlOiBcIkdlbWluaSBtb2RlbCBtaXNzaW5nLlwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICAgIHByb3ZpZGVyOiBcImdlbWluaVwiLFxuICAgICAgbW9kZWw6IHNldHRpbmdzLmdlbWluaU1vZGVsLnRyaW0oKSxcbiAgICAgIG1lc3NhZ2U6IFwiUmVhZHkgdG8gdXNlIEdlbWluaS5cIixcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgaXNEZWZhdWx0T3BlbkFJVXJsID1cbiAgICAhc2V0dGluZ3Mub3BlbkFJQmFzZVVybC50cmltKCkgfHwgc2V0dGluZ3Mub3BlbkFJQmFzZVVybC5pbmNsdWRlcyhcImFwaS5vcGVuYWkuY29tXCIpO1xuXG4gIGlmICghc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgcHJvdmlkZXI6IFwib3BlbmFpXCIsXG4gICAgICBtb2RlbDogbnVsbCxcbiAgICAgIG1lc3NhZ2U6IFwiT3BlbkFJIG1vZGVsIG1pc3NpbmcuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChpc0RlZmF1bHRPcGVuQUlVcmwgJiYgIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJvcGVuYWlcIixcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbWVzc2FnZTogXCJPcGVuQUkgQVBJIGtleSBtaXNzaW5nLlwiLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvbmZpZ3VyZWQ6IHRydWUsXG4gICAgcHJvdmlkZXI6IFwib3BlbmFpXCIsXG4gICAgbW9kZWw6IHNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSxcbiAgICBtZXNzYWdlOiBpc0RlZmF1bHRPcGVuQUlVcmxcbiAgICAgID8gXCJSZWFkeSB0byB1c2UgdGhlIE9wZW5BSSBBUEkuXCJcbiAgICAgIDogXCJSZWFkeSB0byB1c2UgYSBjdXN0b20gT3BlbkFJLWNvbXBhdGlibGUgZW5kcG9pbnQuXCIsXG4gIH07XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5IH0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IGdldFdpbmRvd1N0YXJ0IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNDb250ZXh0IHtcbiAgc291cmNlTGFiZWw6IHN0cmluZztcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbDtcbiAgc291cmNlUGF0aHM/OiBzdHJpbmdbXTtcbiAgdGV4dDogc3RyaW5nO1xuICBvcmlnaW5hbExlbmd0aDogbnVtYmVyO1xuICB0cnVuY2F0ZWQ6IGJvb2xlYW47XG4gIG1heENoYXJzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBDb250ZXh0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRDdXJyZW50Tm90ZUNvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3Py5maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuIGEgbWFya2Rvd24gbm90ZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gdmlldy5lZGl0b3IuZ2V0VmFsdWUoKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdXJyZW50IG5vdGUgaXMgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KFwiQ3VycmVudCBub3RlXCIsIHZpZXcuZmlsZS5wYXRoLCB0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIGdldFNlbGVjdGVkVGV4dENvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3Py5maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuIGEgbWFya2Rvd24gbm90ZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gdmlldy5lZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VsZWN0IHNvbWUgdGV4dCBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoXCJTZWxlY3RlZCB0ZXh0XCIsIHZpZXcuZmlsZS5wYXRoLCB0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIGdldFJlY2VudEZpbGVzQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGN1dG9mZiA9IGdldFdpbmRvd1N0YXJ0KHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXMpLmdldFRpbWUoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmNvbGxlY3RNYXJrZG93bkZpbGVzKHtcbiAgICAgIGV4Y2x1ZGVGb2xkZXJzOiBbc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyXSxcbiAgICAgIG1pbk10aW1lOiBjdXRvZmYsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiUmVjZW50IGZpbGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IHZpZXcuZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuY29sbGVjdE1hcmtkb3duRmlsZXMoe1xuICAgICAgZXhjbHVkZUZvbGRlcnM6IFtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsIHNldHRpbmdzLnJldmlld3NGb2xkZXJdLFxuICAgICAgZm9sZGVyUGF0aCxcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJDdXJyZW50IGZvbGRlclwiLCBmaWxlcywgZm9sZGVyUGF0aCB8fCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzOiBURmlsZVtdKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlbGVjdCBhdCBsZWFzdCBvbmUgbWFya2Rvd24gbm90ZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJTZWxlY3RlZCBub3Rlc1wiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRWYXVsdENvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmNvbGxlY3RNYXJrZG93bkZpbGVzKHtcbiAgICAgIGV4Y2x1ZGVGb2xkZXJzOiBbc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyXSxcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJFbnRpcmUgdmF1bHRcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvbnRleHQoXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRocz86IHN0cmluZ1tdLFxuICApOiBTeW50aGVzaXNDb250ZXh0IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG1heENoYXJzID0gTWF0aC5tYXgoMTAwMCwgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzKTtcbiAgICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gICAgY29uc3Qgb3JpZ2luYWxMZW5ndGggPSB0cmltbWVkLmxlbmd0aDtcbiAgICBjb25zdCB0cnVuY2F0ZWQgPSBvcmlnaW5hbExlbmd0aCA+IG1heENoYXJzO1xuICAgIGNvbnN0IGxpbWl0ZWQgPSB0cnVuY2F0ZWQgPyB0cmltbWVkLnNsaWNlKDAsIG1heENoYXJzKS50cmltRW5kKCkgOiB0cmltbWVkO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZUxhYmVsLFxuICAgICAgc291cmNlUGF0aCxcbiAgICAgIHNvdXJjZVBhdGhzLFxuICAgICAgdGV4dDogbGltaXRlZCxcbiAgICAgIG9yaWdpbmFsTGVuZ3RoLFxuICAgICAgdHJ1bmNhdGVkLFxuICAgICAgbWF4Q2hhcnMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYnVpbGRGaWxlR3JvdXBDb250ZXh0KFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgZmlsZXM6IFRGaWxlW10sXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbWFya2Rvd24gZmlsZXMgZm91bmQgZm9yICR7c291cmNlTGFiZWwudG9Mb3dlckNhc2UoKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICBmaWxlcyxcbiAgICAgIHNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyxcbiAgICApO1xuXG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBtYXJrZG93biBmaWxlcyBmb3VuZCBmb3IgJHtzb3VyY2VMYWJlbC50b0xvd2VyQ2FzZSgpfWApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChzb3VyY2VMYWJlbCwgc291cmNlUGF0aCwgdGV4dCwgZmlsZXMubWFwKChmaWxlKSA9PiBmaWxlLnBhdGgpKTtcbiAgfVxufVxuXG5cbiIsICJleHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZUtleShkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtkYXRlLmdldEZ1bGxZZWFyKCl9LSR7cGFkMihkYXRlLmdldE1vbnRoKCkgKyAxKX0tJHtwYWQyKGRhdGUuZ2V0RGF0ZSgpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VGltZUtleShkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwYWQyKGRhdGUuZ2V0SG91cnMoKSl9OiR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERhdGVUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9ICR7Zm9ybWF0VGltZUtleShkYXRlKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U3VtbWFyeVRpbWVzdGFtcChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtmb3JtYXREYXRlS2V5KGRhdGUpfS0ke3BhZDIoZGF0ZS5nZXRIb3VycygpKX0ke3BhZDIoZGF0ZS5nZXRNaW51dGVzKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUucmVwbGFjZSgvXFxzKyQvZywgXCJcIikpXG4gICAgLmpvaW4oXCJcXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJpbVRyYWlsaW5nTmV3bGluZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFxuKyQvZywgXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXM6IG51bWJlcik6IERhdGUge1xuICBjb25zdCBzYWZlRGF5cyA9IE1hdGgubWF4KDEsIGxvb2tiYWNrRGF5cyk7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgc3RhcnQuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gIHN0YXJ0LnNldERhdGUoc3RhcnQuZ2V0RGF0ZSgpIC0gKHNhZmVEYXlzIC0gMSkpO1xuICByZXR1cm4gc3RhcnQ7XG59XG5cbmZ1bmN0aW9uIHBhZDIodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbn1cbiIsICJpbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB0eXBlIHsgSW5ib3hFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgZmlsZXM6IFRGaWxlW10sXG4gIG1heENoYXJzOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICAgICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBibG9jayA9IFtgLS0tICR7ZmlsZS5wYXRofWAsIHRyaW1tZWRdLmpvaW4oXCJcXG5cIik7XG4gICAgICBpZiAodG90YWwgKyBibG9jay5sZW5ndGggPiBtYXhDaGFycykge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSBNYXRoLm1heCgwLCBtYXhDaGFycyAtIHRvdGFsKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA+IDApIHtcbiAgICAgICAgICBwYXJ0cy5wdXNoKGJsb2NrLnNsaWNlKDAsIHJlbWFpbmluZykpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGJsb2NrKTtcbiAgICAgIHRvdGFsICs9IGJsb2NrLmxlbmd0aDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbHVnaWZ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTldKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi0rfC0rJC9nLCBcIlwiKVxuICAgIC5zbGljZSgwLCA0OCkgfHwgXCJub3RlXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmltVGl0bGUodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICBpZiAodHJpbW1lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gdHJpbW1lZDtcbiAgfVxuICByZXR1cm4gYCR7dHJpbW1lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBcHBlbmRTZXBhcmF0b3IodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXFxuXCIpKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgaWYgKHRleHQuZW5kc1dpdGgoXCJcXG5cIikpIHtcbiAgICByZXR1cm4gXCJcXG5cIjtcbiAgfVxuICByZXR1cm4gXCJcXG5cXG5cIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwTGVhZGluZ1RpdGxlKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC50cmltKCkuc3BsaXQoXCJcXG5cIik7XG4gIGlmICghbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBpZiAoIS9eI1xccysvLnRlc3QobGluZXNbMF0pKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICB9XG5cbiAgY29uc3QgcmVtYWluaW5nID0gbGluZXMuc2xpY2UoMSk7XG4gIHdoaWxlIChyZW1haW5pbmcubGVuZ3RoID4gMCAmJiAhcmVtYWluaW5nWzBdLnRyaW0oKSkge1xuICAgIHJlbWFpbmluZy5zaGlmdCgpO1xuICB9XG4gIHJldHVybiByZW1haW5pbmcuam9pbihcIlxcblwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZE5vdGVUaXRsZShlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuYm9keSB8fCBlbnRyeS5oZWFkaW5nO1xuICBjb25zdCBsaW5lcyA9IGNhbmRpZGF0ZVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGNvbnN0IGZpcnN0ID0gbGluZXNbMF0gPz8gXCJVbnRpdGxlZCBub3RlXCI7XG4gIHJldHVybiB0cmltVGl0bGUoZmlyc3QpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmJveFZhdWx0U2VydmljZSB7XG4gIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+O1xuICByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluYm94RW50cnkge1xuICBoZWFkaW5nOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZztcbiAgcmF3OiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgaW5kZXg6IG51bWJlcjtcbiAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIHN0YXJ0TGluZTogbnVtYmVyO1xuICBlbmRMaW5lOiBudW1iZXI7XG4gIHJldmlld2VkOiBib29sZWFuO1xuICByZXZpZXdBY3Rpb246IHN0cmluZyB8IG51bGw7XG4gIHJldmlld2VkQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIEluYm94RW50cnlJZGVudGl0eSA9IFBpY2s8XG4gIEluYm94RW50cnksXG4gIFwiaGVhZGluZ1wiIHwgXCJib2R5XCIgfCBcInByZXZpZXdcIiB8IFwic2lnbmF0dXJlXCIgfCBcInNpZ25hdHVyZUluZGV4XCJcbj4gJlxuICBQYXJ0aWFsPFBpY2s8SW5ib3hFbnRyeSwgXCJyYXdcIiB8IFwic3RhcnRMaW5lXCIgfCBcImVuZExpbmVcIj4+O1xuXG5leHBvcnQgY2xhc3MgSW5ib3hTZXJ2aWNlIHtcbiAgcHJpdmF0ZSB1bnJldmlld2VkQ291bnRDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBJbmJveFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRFbnRyaWVzKGxpbWl0ID0gMjAsIGluY2x1ZGVSZXZpZXdlZCA9IGZhbHNlKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGluY2x1ZGVSZXZpZXdlZCA/IGVudHJpZXMgOiBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5yZXZpZXdlZCk7XG4gICAgcmV0dXJuIGZpbHRlcmVkLnNsaWNlKC1saW1pdCkucmV2ZXJzZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VW5yZXZpZXdlZENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB7IHRleHQsIG10aW1lLCBleGlzdHMgfSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0V2l0aE10aW1lKHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnJldmlld2VkQ291bnRDYWNoZSAmJiB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlLm10aW1lID09PSBtdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBwYXJzZUluYm94RW50cmllcyh0ZXh0KS5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpLmxlbmd0aDtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIGFzeW5jIG1hcmtFbnRyeVJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZCgoY2FuZGlkYXRlKSA9PiAhY2FuZGlkYXRlLnJldmlld2VkICYmIGNhbmRpZGF0ZS5yYXcgPT09IGVudHJ5LnJhdykgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnN0YXJ0TGluZSA9PT0gZW50cnkuc3RhcnRMaW5lLFxuICAgICAgKTtcblxuICAgIGlmICghY3VycmVudEVudHJ5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGluc2VydFJldmlld01hcmtlcihjb250ZW50LCBjdXJyZW50RW50cnksIGFjdGlvbik7XG4gICAgaWYgKHVwZGF0ZWQgPT09IGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCB1cGRhdGVkKTtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkVudHJ5KGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgY3VycmVudEVudHJ5ID1cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZSA9PT0gZW50cnkuc2lnbmF0dXJlICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZUluZGV4ID09PSBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICAgICkgPz9cbiAgICAgIGZpbmRVbmlxdWVSZXZpZXdlZFNpZ25hdHVyZU1hdGNoKGN1cnJlbnRFbnRyaWVzLCBlbnRyeS5zaWduYXR1cmUpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5KTtcbiAgICBpZiAodXBkYXRlZCA9PT0gY29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluYm94RW50cmllcyhjb250ZW50OiBzdHJpbmcpOiBJbmJveEVudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IEluYm94RW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudEJvZHlMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICBsZXQgY3VycmVudFJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHNpZ25hdHVyZUNvdW50cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKGVuZExpbmU6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gY3VycmVudEJvZHlMaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwcmV2aWV3ID0gYnVpbGRQcmV2aWV3KGJvZHkpO1xuICAgIGNvbnN0IHJhdyA9IFtjdXJyZW50SGVhZGluZywgLi4uY3VycmVudEJvZHlMaW5lc10uam9pbihcIlxcblwiKS50cmltRW5kKCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYnVpbGRFbnRyeVNpZ25hdHVyZShjdXJyZW50SGVhZGluZywgY3VycmVudEJvZHlMaW5lcyk7XG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXggPSBzaWduYXR1cmVDb3VudHMuZ2V0KHNpZ25hdHVyZSkgPz8gMDtcbiAgICBzaWduYXR1cmVDb3VudHMuc2V0KHNpZ25hdHVyZSwgc2lnbmF0dXJlSW5kZXggKyAxKTtcbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcucmVwbGFjZSgvXiMjXFxzKy8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIGJvZHksXG4gICAgICByYXcsXG4gICAgICBwcmV2aWV3LFxuICAgICAgaW5kZXg6IGVudHJpZXMubGVuZ3RoLFxuICAgICAgc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXgsXG4gICAgICBzdGFydExpbmU6IGN1cnJlbnRTdGFydExpbmUsXG4gICAgICBlbmRMaW5lLFxuICAgICAgcmV2aWV3ZWQ6IGN1cnJlbnRSZXZpZXdlZCxcbiAgICAgIHJldmlld0FjdGlvbjogY3VycmVudFJldmlld0FjdGlvbixcbiAgICAgIHJldmlld2VkQXQ6IGN1cnJlbnRSZXZpZXdlZEF0LFxuICAgIH0pO1xuICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gICAgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gICAgY3VycmVudFJldmlld0FjdGlvbiA9IG51bGw7XG4gICAgY3VycmVudFJldmlld2VkQXQgPSBudWxsO1xuICB9O1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaW5kZXhdO1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeShpbmRleCk7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGxpbmU7XG4gICAgICBjdXJyZW50U3RhcnRMaW5lID0gaW5kZXg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOlxccyooW2Etel0rKSg/OlxccysoLis/KSk/XFxzKi0tPiQvaSk7XG4gICAgaWYgKHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UmV2aWV3ZWQgPSB0cnVlO1xuICAgICAgY3VycmVudFJldmlld0FjdGlvbiA9IHJldmlld01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IHJldmlld01hdGNoWzJdID8/IG51bGw7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjdXJyZW50Qm9keUxpbmVzLnB1c2gobGluZSk7XG4gIH1cblxuICBwdXNoRW50cnkobGluZXMubGVuZ3RoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgY29uc3QgbWFya2VyID0gYDwhLS0gYnJhaW4tcmV2aWV3ZWQ6ICR7YWN0aW9ufSAke3RpbWVzdGFtcH0gLS0+YDtcbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG4gIGNsZWFuZWRFbnRyeUxpbmVzLnB1c2gobWFya2VyLCBcIlwiKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRQcmV2aWV3KGJvZHk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gYm9keVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBsaW5lc1swXSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBidWlsZEVudHJ5U2lnbmF0dXJlKGhlYWRpbmc6IHN0cmluZywgYm9keUxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBbaGVhZGluZy50cmltKCksIC4uLmJvZHlMaW5lcy5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKV0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhsaW5lczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNsb25lID0gWy4uLmxpbmVzXTtcbiAgd2hpbGUgKGNsb25lLmxlbmd0aCA+IDAgJiYgY2xvbmVbY2xvbmUubGVuZ3RoIC0gMV0udHJpbSgpID09PSBcIlwiKSB7XG4gICAgY2xvbmUucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGNsb25lO1xufVxuXG5mdW5jdGlvbiBmaW5kVW5pcXVlUmV2aWV3ZWRTaWduYXR1cmVNYXRjaChcbiAgZW50cmllczogSW5ib3hFbnRyeVtdLFxuICBzaWduYXR1cmU6IHN0cmluZyxcbik6IEluYm94RW50cnkgfCBudWxsIHtcbiAgY29uc3QgcmV2aWV3ZWRNYXRjaGVzID0gZW50cmllcy5maWx0ZXIoXG4gICAgKGVudHJ5KSA9PiBlbnRyeS5yZXZpZXdlZCAmJiBlbnRyeS5zaWduYXR1cmUgPT09IHNpZ25hdHVyZSxcbiAgKTtcbiAgaWYgKHJldmlld2VkTWF0Y2hlcy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gcmV2aWV3ZWRNYXRjaGVzWzBdO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlSm91cm5hbFRleHQsIGZvcm1hdERhdGVLZXksIGZvcm1hdFRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEpvdXJuYWxTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBnZXRKb3VybmFsUGF0aChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICByZXR1cm4gYCR7c2V0dGluZ3Muam91cm5hbEZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gIH1cblxuICBhc3luYyBlbnN1cmVKb3VybmFsRmlsZShkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRKb3VybmFsUGF0aChkYXRlKTtcbiAgICByZXR1cm4gdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kSm91cm5hbEhlYWRlcihwYXRoLCBkYXRlS2V5KTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEVudHJ5KHRleHQ6IHN0cmluZywgZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkpvdXJuYWwgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IGZpbGUucGF0aDtcblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0VGltZUtleShkYXRlKX1cXG4ke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQge1xuICBjb2xsYXBzZVdoaXRlc3BhY2UsXG4gIGZvcm1hdERhdGVUaW1lS2V5LFxuICBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLFxufSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgc2x1Z2lmeSwgdHJpbVRpdGxlIH0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBOb3RlU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kTm90ZSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3RlIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9XFxuLSAke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHNldHRpbmdzLmluYm94RmlsZSwgYmxvY2spO1xuICAgIHJldHVybiB7IHBhdGg6IHNldHRpbmdzLmluYm94RmlsZSB9O1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICAgc291cmNlUGF0aHM/OiBzdHJpbmdbXSxcbiAgKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBjbGVhbmVkVGl0bGUgPSB0cmltVGl0bGUodGl0bGUpO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7Zm9ybWF0U3VtbWFyeVRpbWVzdGFtcChub3cpfS0ke3NsdWdpZnkoY2xlYW5lZFRpdGxlKX0ubWRgO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChcbiAgICAgIGAke3NldHRpbmdzLm5vdGVzRm9sZGVyfS8ke2ZpbGVOYW1lfWAsXG4gICAgKTtcbiAgICBjb25zdCBzb3VyY2VMaW5lID0gc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgPyBgJHtzb3VyY2VMYWJlbH0gXHUyMDIyICR7c291cmNlUGF0aHMubGVuZ3RofSAke3NvdXJjZVBhdGhzLmxlbmd0aCA9PT0gMSA/IFwiZmlsZVwiIDogXCJmaWxlc1wifWBcbiAgICAgIDogc291cmNlUGF0aFxuICAgICAgICA/IGAke3NvdXJjZUxhYmVsfSBcdTIwMjIgJHtzb3VyY2VQYXRofWBcbiAgICAgICAgOiBzb3VyY2VMYWJlbDtcbiAgICBjb25zdCBzb3VyY2VGaWxlTGluZXMgPSBzb3VyY2VQYXRocyAmJiBzb3VyY2VQYXRocy5sZW5ndGggPiAwXG4gICAgICA/IFtcbiAgICAgICAgICBcIlNvdXJjZSBmaWxlczpcIixcbiAgICAgICAgICAuLi5zb3VyY2VQYXRocy5zbGljZSgwLCAxMikubWFwKChzb3VyY2UpID0+IGAtICR7c291cmNlfWApLFxuICAgICAgICAgIC4uLihzb3VyY2VQYXRocy5sZW5ndGggPiAxMlxuICAgICAgICAgICAgPyBbYC0gLi4uYW5kICR7c291cmNlUGF0aHMubGVuZ3RoIC0gMTJ9IG1vcmVgXVxuICAgICAgICAgICAgOiBbXSksXG4gICAgICAgIF1cbiAgICAgIDogW107XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjICR7Y2xlYW5lZFRpdGxlfWAsXG4gICAgICBcIlwiLFxuICAgICAgYENyZWF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYFNvdXJjZTogJHtzb3VyY2VMaW5lfWAsXG4gICAgICAuLi5zb3VyY2VGaWxlTGluZXMsXG4gICAgICBcIlwiLFxuICAgICAgY29sbGFwc2VXaGl0ZXNwYWNlKGJvZHkpID8gYm9keS50cmltKCkgOiBcIk5vIGFydGlmYWN0IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChwYXRoLCBjb250ZW50KTtcbiAgfVxufVxuXG5cbiIsICJpbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuLyoqXG4gKiBQYXRoIHV0aWxpdHkgZnVuY3Rpb25zXG4gKi9cblxuLyoqXG4gKiBDaGVjayBpZiBhIHBhdGggaXMgdW5kZXIgYSBzcGVjaWZpYyBmb2xkZXIgKG9yIGlzIHRoZSBmb2xkZXIgaXRzZWxmKS5cbiAqIEhhbmRsZXMgdHJhaWxpbmcgc2xhc2hlcyBjb25zaXN0ZW50bHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1VuZGVyRm9sZGVyKHBhdGg6IHN0cmluZywgZm9sZGVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9ybWFsaXplZEZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gcGF0aCA9PT0gbm9ybWFsaXplZEZvbGRlciB8fCBwYXRoLnN0YXJ0c1dpdGgoYCR7bm9ybWFsaXplZEZvbGRlcn0vYCk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBwYXRoIGlzIGEgQnJhaW4tZ2VuZXJhdGVkIGZpbGUgKHN1bW1hcmllcywgcmV2aWV3cywgbm90ZXMsXG4gKiBpbmJveCwgb3IgdGFza3MpLiBVc2VkIHRvIGV4Y2x1ZGUgZ2VuZXJhdGVkIGNvbnRlbnQgZnJvbSBzeW50aGVzaXNcbiAqIGFuZCBjb250ZXh0IGFnZ3JlZ2F0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNCcmFpbkdlbmVyYXRlZFBhdGgoXG4gIHBhdGg6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikgfHxcbiAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpIHx8XG4gICAgaXNVbmRlckZvbGRlcihwYXRoLCBzZXR0aW5ncy5ub3Rlc0ZvbGRlcikgfHxcbiAgICBwYXRoID09PSBzZXR0aW5ncy5pbmJveEZpbGUgfHxcbiAgICBwYXRoID09PSBzZXR0aW5ncy50YXNrc0ZpbGVcbiAgKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlS2V5LCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHkgfSBmcm9tIFwiLi9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmV2aWV3TG9nRW50cnkgZXh0ZW5kcyBJbmJveEVudHJ5SWRlbnRpdHkge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG4gIHNvdXJjZVBhdGg6IHN0cmluZztcbiAgZmlsZU10aW1lOiBudW1iZXI7XG4gIGVudHJ5SW5kZXg6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFJldmlld0xvZ1NlcnZpY2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IHJldmlld0VudHJ5Q291bnRDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9PigpO1xuICBwcml2YXRlIHJldmlld0xvZ0ZpbGVzQ2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGZpbGVzOiBURmlsZVtdO1xuICB9IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmV2aWV3RW50cnlUb3RhbENhY2hlOiB7XG4gICAgbGlzdGluZ010aW1lOiBudW1iZXI7XG4gICAgdG90YWw6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kUmV2aWV3TG9nKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXREYXRlS2V5KG5vdyk7XG4gICAgY29uc3QgcGF0aCA9IGAke3NldHRpbmdzLnJldmlld3NGb2xkZXJ9LyR7ZGF0ZUtleX0ubWRgO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyMgJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBgLSBBY3Rpb246ICR7YWN0aW9ufWAsXG4gICAgICBgLSBJbmJveDogJHtlbnRyeS5oZWFkaW5nfWAsXG4gICAgICBgLSBQcmV2aWV3OiAke2VudHJ5LnByZXZpZXcgfHwgZW50cnkuYm9keSB8fCBcIihlbXB0eSlcIn1gLFxuICAgICAgYC0gU2lnbmF0dXJlOiAke2VuY29kZVJldmlld1NpZ25hdHVyZShlbnRyeS5zaWduYXR1cmUpfWAsXG4gICAgICBgLSBTaWduYXR1cmUgaW5kZXg6ICR7ZW50cnkuc2lnbmF0dXJlSW5kZXh9YCxcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBjb250ZW50KTtcbiAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5jbGVhcigpO1xuICAgIHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSA9IG51bGw7XG4gICAgdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB7IHBhdGggfTtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0xvZ0ZpbGVzKGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcblxuICAgIGlmICghdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlKSB7XG4gICAgICBjb25zdCBhbGxGaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgICBjb25zdCBtYXRjaGluZyA9IGFsbEZpbGVzXG4gICAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgICAgIHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IG1hdGNoaW5nWzBdPy5zdGF0Lm10aW1lID8/IDAsXG4gICAgICAgIGZpbGVzOiBtYXRjaGluZyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIlxuICAgICAgPyB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUuZmlsZXMuc2xpY2UoMCwgbGltaXQpXG4gICAgICA6IHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZS5maWxlcztcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0VudHJpZXMobGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPFJldmlld0xvZ0VudHJ5W10+IHtcbiAgICBjb25zdCBsb2dzID0gYXdhaXQgdGhpcy5nZXRSZXZpZXdMb2dGaWxlcyhsaW1pdCk7XG4gICAgY29uc3QgZW50cmllczogUmV2aWV3TG9nRW50cnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGxvZ3MpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKGNvbnRlbnQsIGZpbGUucGF0aCwgZmlsZS5zdGF0Lm10aW1lKTtcbiAgICAgIGVudHJpZXMucHVzaCguLi5wYXJzZWQucmV2ZXJzZSgpKTtcbiAgICAgIGlmICh0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgJiYgZW50cmllcy5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiA/IGVudHJpZXMuc2xpY2UoMCwgbGltaXQpIDogZW50cmllcztcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0VudHJ5Q291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBsb2dzID0gYXdhaXQgdGhpcy5nZXRSZXZpZXdMb2dGaWxlcygpO1xuICAgIGlmIChsb2dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUgPSB7IGxpc3RpbmdNdGltZTogMCwgdG90YWw6IDAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RpbmdNdGltZSA9IGxvZ3NbMF0uc3RhdC5tdGltZTtcbiAgICBpZiAodGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGU/Lmxpc3RpbmdNdGltZSA9PT0gbGlzdGluZ010aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUudG90YWw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VlblBhdGhzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgbGV0IHRvdGFsID0gMDtcblxuICAgIGNvbnN0IHVuY2FjaGVkRmlsZXMgPSBsb2dzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCk7XG4gICAgICByZXR1cm4gIShjYWNoZWQgJiYgY2FjaGVkLm10aW1lID09PSBmaWxlLnN0YXQubXRpbWUpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgY2FjaGVkRmlsZXMgPSBsb2dzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCk7XG4gICAgICByZXR1cm4gY2FjaGVkICYmIGNhY2hlZC5tdGltZSA9PT0gZmlsZS5zdGF0Lm10aW1lO1xuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGNhY2hlZEZpbGVzKSB7XG4gICAgICBzZWVuUGF0aHMuYWRkKGZpbGUucGF0aCk7XG4gICAgICB0b3RhbCArPSB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5nZXQoZmlsZS5wYXRoKSEuY291bnQ7XG4gICAgfVxuXG4gICAgaWYgKHVuY2FjaGVkRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICB1bmNhY2hlZEZpbGVzLm1hcChhc3luYyAoZmlsZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKGNvbnRlbnQsIGZpbGUucGF0aCwgZmlsZS5zdGF0Lm10aW1lKS5sZW5ndGg7XG4gICAgICAgICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuc2V0KGZpbGUucGF0aCwge1xuICAgICAgICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgICAgICAgIGNvdW50LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB7IGZpbGUsIGNvdW50IH07XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgICAgZm9yIChjb25zdCB7IGZpbGUsIGNvdW50IH0gb2YgcmVzdWx0cykge1xuICAgICAgICBzZWVuUGF0aHMuYWRkKGZpbGUucGF0aCk7XG4gICAgICAgIHRvdGFsICs9IGNvdW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgcGF0aCBvZiB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5rZXlzKCkpIHtcbiAgICAgIGlmICghc2VlblBhdGhzLmhhcyhwYXRoKSkge1xuICAgICAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5kZWxldGUocGF0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUgPSB7IGxpc3RpbmdNdGltZSwgdG90YWwgfTtcbiAgICByZXR1cm4gdG90YWw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUmV2aWV3TG9nRW50cmllcyhcbiAgY29udGVudDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcsXG4gIGZpbGVNdGltZTogbnVtYmVyLFxuKTogUmV2aWV3TG9nRW50cnlbXSB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgZW50cmllczogUmV2aWV3TG9nRW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudFRpbWVzdGFtcCA9IFwiXCI7XG4gIGxldCBjdXJyZW50QWN0aW9uID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRQcmV2aWV3ID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRTaWduYXR1cmUgPSBcIlwiO1xuICBsZXQgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gMDtcbiAgbGV0IGN1cnJlbnRFbnRyeUluZGV4ID0gMDtcblxuICBjb25zdCBwdXNoRW50cnkgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKCFjdXJyZW50VGltZXN0YW1wKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZW50cmllcy5wdXNoKHtcbiAgICAgIGFjdGlvbjogY3VycmVudEFjdGlvbiB8fCBcInVua25vd25cIixcbiAgICAgIGhlYWRpbmc6IGN1cnJlbnRIZWFkaW5nLFxuICAgICAgcHJldmlldzogY3VycmVudFByZXZpZXcsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgc2lnbmF0dXJlOiBjdXJyZW50U2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXg6IGN1cnJlbnRTaWduYXR1cmVJbmRleCxcbiAgICAgIHRpbWVzdGFtcDogY3VycmVudFRpbWVzdGFtcCxcbiAgICAgIHNvdXJjZVBhdGgsXG4gICAgICBmaWxlTXRpbWUsXG4gICAgICBlbnRyeUluZGV4OiBjdXJyZW50RW50cnlJbmRleCxcbiAgICB9KTtcbiAgICBjdXJyZW50VGltZXN0YW1wID0gXCJcIjtcbiAgICBjdXJyZW50QWN0aW9uID0gXCJcIjtcbiAgICBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gICAgY3VycmVudFByZXZpZXcgPSBcIlwiO1xuICAgIGN1cnJlbnRTaWduYXR1cmUgPSBcIlwiO1xuICAgIGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IDA7XG4gICAgY3VycmVudEVudHJ5SW5kZXggKz0gMTtcbiAgfTtcblxuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBoZWFkaW5nTWF0Y2ggPSBsaW5lLm1hdGNoKC9eIyNcXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoKSB7XG4gICAgICBwdXNoRW50cnkoKTtcbiAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBoZWFkaW5nTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uTWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytBY3Rpb246XFxzKyguKykkL2kpO1xuICAgIGlmIChhY3Rpb25NYXRjaCkge1xuICAgICAgY3VycmVudEFjdGlvbiA9IGFjdGlvbk1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGluYm94TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytJbmJveDpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKGluYm94TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRIZWFkaW5nID0gaW5ib3hNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aWV3TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytQcmV2aWV3OlxccysoLispJC9pKTtcbiAgICBpZiAocHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UHJldmlldyA9IHByZXZpZXdNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYXR1cmVNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1NpZ25hdHVyZTpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHNpZ25hdHVyZU1hdGNoKSB7XG4gICAgICBjdXJyZW50U2lnbmF0dXJlID0gZGVjb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZU1hdGNoWzFdLnRyaW0oKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYXR1cmVJbmRleE1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrU2lnbmF0dXJlIGluZGV4OlxccysoLispJC9pKTtcbiAgICBpZiAoc2lnbmF0dXJlSW5kZXhNYXRjaCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHNpZ25hdHVyZUluZGV4TWF0Y2hbMV0sIDEwKTtcbiAgICAgIGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IE51bWJlci5pc0Zpbml0ZShwYXJzZWQpID8gcGFyc2VkIDogMDtcbiAgICB9XG4gIH1cblxuICBwdXNoRW50cnkoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGVuY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc2lnbmF0dXJlKTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHNpZ25hdHVyZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBzaWduYXR1cmU7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBzbHVnaWZ5LCBidWlsZE5vdGVUaXRsZSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHksIEluYm94U2VydmljZSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3Rhc2stc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnksIFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5ib3hTZXJ2aWNlOiBJbmJveFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZTogVGFza1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBqb3VybmFsU2VydmljZTogSm91cm5hbFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdMb2dTZXJ2aWNlOiBSZXZpZXdMb2dTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEluYm94RW50cmllcyhsaW1pdCA9IDIwKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICByZXR1cm4gdGhpcy5pbmJveFNlcnZpY2UuZ2V0UmVjZW50RW50cmllcyhsaW1pdCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9UYXNrKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0ZXh0ID0gZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcInRhc2tcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwidGFza1wiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFxuICAgICAgYFByb21vdGVkIGluYm94IGVudHJ5IHRvIHRhc2sgaW4gJHtzYXZlZC5wYXRofWAsXG4gICAgICBtYXJrZXJVcGRhdGVkLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBrZWVwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBgTGVmdCBpbmJveCBlbnRyeSBpbiAke3RoaXMuc2V0dGluZ3NQcm92aWRlcigpLmluYm94RmlsZX1gO1xuICB9XG5cbiAgYXN5bmMgc2tpcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwic2tpcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJza2lwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJTa2lwcGVkIGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVG9Kb3VybmFsKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkoXG4gICAgICBbXG4gICAgICAgIGBTb3VyY2U6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJqb3VybmFsXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShgQXBwZW5kZWQgaW5ib3ggZW50cnkgdG8gJHtzYXZlZC5wYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvTm90ZShlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gc2V0dGluZ3Mubm90ZXNGb2xkZXI7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlRm9sZGVyKG5vdGVzRm9sZGVyKTtcblxuICAgIGNvbnN0IHRpdGxlID0gYnVpbGROb3RlVGl0bGUoZW50cnkpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gYCR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KS5yZXBsYWNlKC9bOiBdL2csIFwiLVwiKX0tJHtzbHVnaWZ5KHRpdGxlKX0ubWRgO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChgJHtub3Rlc0ZvbGRlcn0vJHtmaWxlbmFtZX1gKTtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMgJHt0aXRsZX1gLFxuICAgICAgXCJcIixcbiAgICAgIGBDcmVhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIFwiU291cmNlOiBCcmFpbiBpbmJveFwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiT3JpZ2luYWwgY2FwdHVyZTpcIixcbiAgICAgIGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGNvbnRlbnQpO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJub3RlXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcIm5vdGVcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShgUHJvbW90ZWQgaW5ib3ggZW50cnkgdG8gbm90ZSBpbiAke3BhdGh9YCwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyByZW9wZW5Gcm9tUmV2aWV3TG9nKGVudHJ5OiBSZXZpZXdMb2dFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgaWRlbnRpdHkgPSB7XG4gICAgICBoZWFkaW5nOiBlbnRyeS5oZWFkaW5nLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIHByZXZpZXc6IGVudHJ5LnByZXZpZXcsXG4gICAgICBzaWduYXR1cmU6IGVudHJ5LnNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICB9O1xuICAgIGNvbnN0IHJlb3BlbmVkID0gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UucmVvcGVuRW50cnkoaWRlbnRpdHkpO1xuICAgIGlmICghcmVvcGVuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlLW9wZW4gaW5ib3ggZW50cnkgJHtlbnRyeS5oZWFkaW5nfWApO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoaWRlbnRpdHksIFwicmVvcGVuXCIpO1xuICAgIHJldHVybiBgUmUtb3BlbmVkIGluYm94IGVudHJ5ICR7ZW50cnkuaGVhZGluZ31gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBtYXJrSW5ib3hSZXZpZXdlZChlbnRyeTogSW5ib3hFbnRyeSwgYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLm1hcmtFbnRyeVJldmlld2VkKGVudHJ5LCBhY3Rpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZE1hcmtlck5vdGUobWVzc2FnZTogc3RyaW5nLCBtYXJrZXJVcGRhdGVkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbWFya2VyVXBkYXRlZCA/IG1lc3NhZ2UgOiBgJHttZXNzYWdlfSAocmV2aWV3IG1hcmtlciBub3QgdXBkYXRlZClgO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KFxuICAgIGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksXG4gICAgYWN0aW9uOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJldmlld0xvZ1NlcnZpY2UuYXBwZW5kUmV2aWV3TG9nKGVudHJ5LCBhY3Rpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhbnN3ZXJRdWVzdGlvbihxdWVzdGlvbjogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHF1ZXN0aW9uIGFuc3dlcmluZ1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBcIlF1ZXN0aW9uIEFuc3dlclwiLFxuICAgICAgdGl0bGU6IFwiQW5zd2VyXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5RdWVzdGlvbihxdWVzdGlvbiksXG4gICAgICBjb250ZW50OiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHByb21wdFRleHQ6IHF1ZXN0aW9uLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gcXVlc3Rpb24udHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgUXVlc3Rpb24gJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKFxuICBpdGVtczogU2V0PHN0cmluZz4sXG4gIGVtcHR5TWVzc2FnZTogc3RyaW5nLFxuICBtYXhJdGVtcyA9IDEwLFxuKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgbWF4SXRlbXMpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmZ1bmN0aW9uIGV4dHJhY3RLZXl3b3JkcyhxdWVzdGlvbjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzdG9wd29yZHMgPSBuZXcgU2V0KFtcbiAgICBcIndoYXRcIixcbiAgICBcIndoeVwiLFxuICAgIFwiaG93XCIsXG4gICAgXCJ3aGljaFwiLFxuICAgIFwid2hlblwiLFxuICAgIFwid2hlcmVcIixcbiAgICBcIndob1wiLFxuICAgIFwid2hvbVwiLFxuICAgIFwiZG9lc1wiLFxuICAgIFwiZG9cIixcbiAgICBcImRpZFwiLFxuICAgIFwiaXNcIixcbiAgICBcImFyZVwiLFxuICAgIFwid2FzXCIsXG4gICAgXCJ3ZXJlXCIsXG4gICAgXCJ0aGVcIixcbiAgICBcImFcIixcbiAgICBcImFuXCIsXG4gICAgXCJ0b1wiLFxuICAgIFwib2ZcIixcbiAgICBcImZvclwiLFxuICAgIFwiYW5kXCIsXG4gICAgXCJvclwiLFxuICAgIFwiaW5cIixcbiAgICBcIm9uXCIsXG4gICAgXCJhdFwiLFxuICAgIFwid2l0aFwiLFxuICAgIFwiYWJvdXRcIixcbiAgICBcImZyb21cIixcbiAgICBcIm15XCIsXG4gICAgXCJvdXJcIixcbiAgICBcInlvdXJcIixcbiAgICBcInRoaXNcIixcbiAgICBcInRoYXRcIixcbiAgICBcInRoZXNlXCIsXG4gICAgXCJ0aG9zZVwiLFxuICAgIFwibWFrZVwiLFxuICAgIFwibWFkZVwiLFxuICAgIFwibmVlZFwiLFxuICAgIFwibmVlZHNcIixcbiAgICBcImNhblwiLFxuICAgIFwiY291bGRcIixcbiAgICBcInNob3VsZFwiLFxuICAgIFwid291bGRcIixcbiAgICBcIndpbGxcIixcbiAgICBcImhhdmVcIixcbiAgICBcImhhc1wiLFxuICAgIFwiaGFkXCIsXG4gIF0pO1xuXG4gIHJldHVybiBBcnJheS5mcm9tKFxuICAgIG5ldyBTZXQoXG4gICAgICBxdWVzdGlvblxuICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAuc3BsaXQoL1teYS16MC05XSsvZylcbiAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoKHdvcmQpID0+IHdvcmQubGVuZ3RoID49IDQgJiYgIXN0b3B3b3Jkcy5oYXMod29yZCkpLFxuICAgICksXG4gICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNRdWVzdGlvbihsaW5lOiBzdHJpbmcsIGtleXdvcmRzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoIWtleXdvcmRzLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4ga2V5d29yZHMuc29tZSgoa2V5d29yZCkgPT4gbG93ZXIuaW5jbHVkZXMoa2V5d29yZCkpO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RXZpZGVuY2UoY29udGVudDogc3RyaW5nLCBxdWVzdGlvbjogc3RyaW5nKToge1xuICBldmlkZW5jZTogU2V0PHN0cmluZz47XG4gIG1hdGNoZWQ6IGJvb2xlYW47XG59IHtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5d29yZHMgPSBleHRyYWN0S2V5d29yZHMocXVlc3Rpb24pO1xuICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oaGVhZGluZ1RleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMykpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihoZWFkaW5nVGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQgJiYgKG1hdGNoZXNRdWVzdGlvbih0YXNrVGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAzKSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKHRhc2tUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oYnVsbGV0VGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCA0KSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGJ1bGxldFRleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChtYXRjaGVzUXVlc3Rpb24obGluZSwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAyKSB7XG4gICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGxpbmUsIGtleXdvcmRzKSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGV2aWRlbmNlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGV2aWRlbmNlLFxuICAgIG1hdGNoZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIocXVlc3Rpb246IHN0cmluZywgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZFF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShxdWVzdGlvbik7XG4gIGNvbnN0IHsgZXZpZGVuY2UsIG1hdGNoZWQgfSA9IGNvbGxlY3RFdmlkZW5jZShjb250ZW50LCBjbGVhbmVkUXVlc3Rpb24pO1xuICBjb25zdCBhbnN3ZXJMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAobWF0Y2hlZCkge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXG4gICAgICBcIkkgZm91bmQgdGhlc2UgbGluZXMgaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQgdGhhdCBkaXJlY3RseSBtYXRjaCB5b3VyIHF1ZXN0aW9uLlwiLFxuICAgICk7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRoZSBjb250ZXh0IGRvZXMgbm90IHByb3ZpZGUgYSBmdWxseSB2ZXJpZmllZCBhbnN3ZXIsIHNvIHRyZWF0IHRoaXMgYXMgYSBncm91bmRlZCBzdW1tYXJ5LlwiKTtcbiAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplKSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcbiAgICAgIFwiSSBjb3VsZCBub3QgZmluZCBhIGRpcmVjdCBtYXRjaCBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dCwgc28gdGhlc2UgYXJlIHRoZSBjbG9zZXN0IGxpbmVzIGF2YWlsYWJsZS5cIixcbiAgICApO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUcmVhdCB0aGlzIGFzIG5lYXJieSBjb250ZXh0IHJhdGhlciB0aGFuIGEgY29uZmlybWVkIGFuc3dlci5cIik7XG4gIH0gZWxzZSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIkkgY291bGQgbm90IGZpbmQgYSBkaXJlY3QgYW5zd2VyIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0LlwiKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVHJ5IG5hcnJvd2luZyB0aGUgcXVlc3Rpb24gb3Igc2VsZWN0aW5nIGEgbW9yZSBzcGVjaWZpYyBub3RlIG9yIGZvbGRlci5cIik7XG4gIH1cblxuICBjb25zdCBmb2xsb3dVcHMgPSBtYXRjaGVkIHx8IGV2aWRlbmNlLnNpemVcbiAgICA/IG5ldyBTZXQoW1xuICAgICAgICBcIkFzayBhIG5hcnJvd2VyIHF1ZXN0aW9uIGlmIHlvdSB3YW50IGEgbW9yZSBzcGVjaWZpYyBhbnN3ZXIuXCIsXG4gICAgICAgIFwiT3BlbiB0aGUgc291cmNlIG5vdGUgb3IgZm9sZGVyIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXCIsXG4gICAgICBdKVxuICAgIDogbmV3IFNldChbXG4gICAgICAgIFwiUHJvdmlkZSBtb3JlIGV4cGxpY2l0IGNvbnRleHQgb3Igc2VsZWN0IGEgZGlmZmVyZW50IG5vdGUgb3IgZm9sZGVyLlwiLFxuICAgICAgXSk7XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgY2xlYW5lZFF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEFuc3dlclwiLFxuICAgIGFuc3dlckxpbmVzLmpvaW4oXCIgXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGRpcmVjdCBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICBwYXJzZWQuYW5zd2VyIHx8IFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgcGFyc2VkLmV2aWRlbmNlIHx8IFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBxdWVzdGlvbjogc3RyaW5nO1xuICBhbnN3ZXI6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiUXVlc3Rpb25cIiB8IFwiQW5zd2VyXCIgfCBcIkV2aWRlbmNlXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFF1ZXN0aW9uOiBbXSxcbiAgICBBbnN3ZXI6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoUXVlc3Rpb258QW5zd2VyfEV2aWRlbmNlfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbjogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5RdWVzdGlvbl0pLFxuICAgIGFuc3dlcjogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkFuc3dlciksXG4gICAgZXZpZGVuY2U6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5FdmlkZW5jZSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBRdWVzdGlvbjogc3RyaW5nW107XG4gIEFuc3dlcjogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImFuc3dlclwiKSB7XG4gICAgcmV0dXJuIFwiQW5zd2VyXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlF1ZXN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSxcbn0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5LCBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLCBnZXRXaW5kb3dTdGFydCB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LWZvcm1hdFwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1bW1hcnlSZXN1bHQge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHBlcnNpc3RlZFBhdGg/OiBzdHJpbmc7XG4gIHVzZWRBSTogYm9vbGVhbjtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN1bW1hcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cz86IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9IGxvb2tiYWNrRGF5cyA/PyBzZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzO1xuICAgIGNvbnN0IGN1dG9mZiA9IGdldFdpbmRvd1N0YXJ0KGVmZmVjdGl2ZUxvb2tiYWNrRGF5cykuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuY29sbGVjdE1hcmtkb3duRmlsZXMoe1xuICAgICAgZXhjbHVkZUZvbGRlcnM6IFtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsIHNldHRpbmdzLnJldmlld3NGb2xkZXJdLFxuICAgICAgbWluTXRpbWU6IGN1dG9mZixcbiAgICB9KTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGxldCBzdW1tYXJ5ID0gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudCk7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc3VtbWFyeSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN1bW1hcml6ZShjb250ZW50IHx8IHN1bW1hcnksIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgc3VtbWFyeVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwZXJzaXN0ZWRQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdGl0bGUgPSBsYWJlbCA/IGAke2xhYmVsfSBTdW1tYXJ5YCA6IFwiU3VtbWFyeVwiO1xuICAgIGlmIChzZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKG5ldyBEYXRlKCkpO1xuICAgICAgY29uc3QgZmlsZUxhYmVsID0gbGFiZWwgPyBgJHtsYWJlbC50b0xvd2VyQ2FzZSgpfS0ke3RpbWVzdGFtcH1gIDogdGltZXN0YW1wO1xuICAgICAgY29uc3QgcmVxdWVzdGVkUGF0aCA9IGAke3NldHRpbmdzLnN1bW1hcmllc0ZvbGRlcn0vJHtmaWxlTGFiZWx9Lm1kYDtcbiAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChyZXF1ZXN0ZWRQYXRoKTtcbiAgICAgIGNvbnN0IGRpc3BsYXlUaW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBbXG4gICAgICAgIGAjICR7dGl0bGV9ICR7ZGlzcGxheVRpbWVzdGFtcH1gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBgIyMgV2luZG93YCxcbiAgICAgICAgZWZmZWN0aXZlTG9va2JhY2tEYXlzID09PSAxID8gXCJUb2RheVwiIDogYExhc3QgJHtlZmZlY3RpdmVMb29rYmFja0RheXN9IGRheXNgLFxuICAgICAgICBcIlwiLFxuICAgICAgICBzdW1tYXJ5LnRyaW0oKSxcbiAgICAgIF0uam9pbihcIlxcblwiKTtcbiAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgYm9keSk7XG4gICAgICBwZXJzaXN0ZWRQYXRoID0gcGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogc3VtbWFyeSxcbiAgICAgIHBlcnNpc3RlZFBhdGgsXG4gICAgICB1c2VkQUksXG4gICAgICB0aXRsZSxcbiAgICB9O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24gfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBjbGVhblN1bW1hcnlMaW5lKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiAodGV4dCA/PyBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFRhc2tTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBcIi0gTm8gcmVjZW50IHRhc2tzIGZvdW5kLlwiO1xuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtIFsgXSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGhpZ2hsaWdodHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGhlYWRpbmdbMV0pKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gY2xlYW5TdW1tYXJ5TGluZSh0YXNrWzJdKTtcbiAgICAgIHRhc2tzLmFkZCh0ZXh0KTtcbiAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gY2xlYW5TdW1tYXJ5TGluZShidWxsZXRbMl0pO1xuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgaGlnaGxpZ2h0cy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoaGlnaGxpZ2h0cy5zaXplIDwgNSAmJiBsaW5lLmxlbmd0aCA8PSAxNDApIHtcbiAgICAgIGhpZ2hsaWdodHMuYWRkKGNsZWFuU3VtbWFyeUxpbmUobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oaGlnaGxpZ2h0cywgXCJObyByZWNlbnQgbm90ZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIGZvcm1hdFRhc2tTZWN0aW9uKHRhc2tzKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJOb3RoaW5nIHBlbmRpbmcgZnJvbSByZWNlbnQgbm90ZXMuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tUYXNrRXh0cmFjdGlvbiB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3QtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tPcGVuUXVlc3Rpb25zIH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZiB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNSZXN1bHQge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbm90ZVRpdGxlOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICBwcm9tcHRUZXh0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3ludGhlc2lzU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBydW4odGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gdGhpcy5idWlsZEZhbGxiYWNrKHRlbXBsYXRlLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN5bnRoZXNpemVDb250ZXh0KHRlbXBsYXRlLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN5bnRoZXNpc1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIHRpdGxlOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIG5vdGVUaXRsZTogYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gJHtnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKX1gLFxuICAgICAgY29udGVudDogdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRmFsbGJhY2sodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24odGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsZEZhbGxiYWNrU3ludGhlc2lzKHRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9jb250ZXh0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRMb2NhdGlvbihjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nIHtcbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY291bnQgPSBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aDtcbiAgICByZXR1cm4gYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gXHUyMDIyICR7Y291bnR9ICR7Y291bnQgPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIHJldHVybiBgJHtjb250ZXh0LnNvdXJjZUxhYmVsfSBcdTIwMjIgJHtjb250ZXh0LnNvdXJjZVBhdGh9YDtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LnNvdXJjZUxhYmVsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbGluZXMgPSBbYENvbnRleHQgc291cmNlOiAke2NvbnRleHQuc291cmNlTGFiZWx9YF07XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIGxpbmVzLnB1c2goYENvbnRleHQgcGF0aDogJHtjb250ZXh0LnNvdXJjZVBhdGh9YCk7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBsaW5lcy5wdXNoKFwiQ29udGV4dCBmaWxlczpcIik7XG4gICAgY29uc3QgdmlzaWJsZSA9IGNvbnRleHQuc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiB2aXNpYmxlKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICR7cGF0aH1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiB2aXNpYmxlLmxlbmd0aCkge1xuICAgICAgbGluZXMucHVzaChgLSAuLi5hbmQgJHtjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCAtIHZpc2libGUubGVuZ3RofSBtb3JlYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnRleHQudHJ1bmNhdGVkKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGBDb250ZXh0IHdhcyB0cnVuY2F0ZWQgdG8gJHtjb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbGluZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0U291cmNlTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbGluZXMgPSBbYFNvdXJjZTogJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBdO1xuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICBsaW5lcy5wdXNoKGBTb3VyY2UgcGF0aDogJHtjb250ZXh0LnNvdXJjZVBhdGh9YCk7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBsaW5lcy5wdXNoKFwiU291cmNlIGZpbGVzOlwiKTtcbiAgICBjb25zdCB2aXNpYmxlID0gY29udGV4dC5zb3VyY2VQYXRocy5zbGljZSgwLCAxMik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHZpc2libGUpIHtcbiAgICAgIGxpbmVzLnB1c2gocGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgIGxpbmVzLnB1c2goYC4uLmFuZCAke2NvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoIC0gdmlzaWJsZS5sZW5ndGh9IG1vcmVgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29udGV4dC50cnVuY2F0ZWQpIHtcbiAgICBsaW5lcy5wdXNoKFxuICAgICAgYENvbnRleHQgdHJ1bmNhdGVkIHRvICR7Y29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi9kYXRlXCI7XG5pbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5pbXBvcnQgdHlwZSB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHR5cGUgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzIH0gZnJvbSBcIi4vY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IHN0cmlwTGVhZGluZ1RpdGxlIH0gZnJvbSBcIi4vdGV4dFwiO1xuXG5mdW5jdGlvbiBhZGRTdW1tYXJ5TGluZShcbiAgc3VtbWFyeTogU2V0PHN0cmluZz4sXG4gIHRleHQ6IHN0cmluZyxcbiAgbWF4SXRlbXMgPSA0LFxuKTogdm9pZCB7XG4gIGlmIChzdW1tYXJ5LnNpemUgPj0gbWF4SXRlbXMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICBpZiAoIWNsZWFuZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBzdW1tYXJ5LmFkZChjbGVhbmVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3VtbWFyeSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0aGVtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgdGhlbWVzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBoZWFkaW5nVGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgZm9sbG93VXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB0aGVtZXMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIHRhc2tUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICB0aGVtZXMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgYnVsbGV0VGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGZvbGxvd1Vwcy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuXG4gICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgbGluZSk7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHN1bW1hcnksIFwiTm8gc291cmNlIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGhlbWVzLCBcIk5vIGtleSB0aGVtZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQoXG4gIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBgQWN0aW9uOiAke3Jlc3VsdC5hY3Rpb259YCxcbiAgICBgR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgYENvbnRleHQgbGVuZ3RoOiAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9IGNoYXJhY3RlcnMuYCxcbiAgICBcIlwiLFxuICAgIHN0cmlwTGVhZGluZ1RpdGxlKHJlc3VsdC5jb250ZW50KSxcbiAgICBcIlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEluc2VydGVkU3ludGhlc2lzQ29udGVudChcbiAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gW1xuICAgIGAjIyBCcmFpbiAke3Jlc3VsdC50aXRsZX1gLFxuICAgIC4uLmZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0KS5tYXAoKGxpbmUpID0+IGAtICR7bGluZX1gKSxcbiAgICBgLSBHZW5lcmF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YCxcbiAgICBcIlwiLFxuICAgIHN0cmlwTGVhZGluZ1RpdGxlKHJlc3VsdC5jb250ZW50KSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VTeW50aGVzaXNTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgIHBhcnNlZC5zdW1tYXJ5IHx8IFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICBwYXJzZWQua2V5VGhlbWVzIHx8IFwiTm8ga2V5IHRoZW1lcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3ludGhlc2lzU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGtleVRoZW1lczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJTdW1tYXJ5XCIgfCBcIktleSBUaGVtZXNcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgU3VtbWFyeTogW10sXG4gICAgXCJLZXkgVGhlbWVzXCI6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhTdW1tYXJ5fEtleSBUaGVtZXN8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnk6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuU3VtbWFyeV0pLFxuICAgIGtleVRoZW1lczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFRoZW1lc1wiXSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBTdW1tYXJ5OiBzdHJpbmdbXTtcbiAgXCJLZXkgVGhlbWVzXCI6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHRoZW1lc1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFRoZW1lc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJTdW1tYXJ5XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIHRhc2tzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGNvbnRleHQuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGFza3MsIFwiTm8gdGFza3MgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oY29udGV4dCwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBwYXJzZWQudGFza3MgfHwgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgVGFza3NcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHRhc2tzOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiVGFza3NcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBUYXNrczogW10sXG4gICAgQ29udGV4dDogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFRhc2tzfENvbnRleHR8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGNvbnRleHQ6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuQ29udGV4dF0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiVGFza3NcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gbG9va3NMaWtlUmF0aW9uYWxlKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImJlY2F1c2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNvIHRoYXRcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImR1ZSB0b1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicmVhc29uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ0cmFkZW9mZlwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uc3RyYWludFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VEZWNpc2lvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpZGVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImRlY2lzaW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjaG9vc2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNoaXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFkb3B0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkcm9wXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzd2l0Y2hcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tEZWNpc2lvbkV4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZGVjaXNpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHJhdGlvbmFsZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lIHx8IGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoZGVjaXNpb25zLnNpemUgPCAzKSB7XG4gICAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByYXRpb25hbGUuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VEZWNpc2lvbihsaW5lKSkge1xuICAgICAgZGVjaXNpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZVJhdGlvbmFsZShsaW5lKSkge1xuICAgICAgcmF0aW9uYWxlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZGVjaXNpb25zLCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHJhdGlvbmFsZSwgXCJObyBleHBsaWNpdCByYXRpb25hbGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIFwiTm8gZGVjaXNpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VEZWNpc2lvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBwYXJzZWQuZGVjaXNpb25zIHx8IFwiTm8gY2xlYXIgZGVjaXNpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgcGFyc2VkLnJhdGlvbmFsZSB8fCBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGVjaXNpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGRlY2lzaW9uczogc3RyaW5nO1xuICByYXRpb25hbGU6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIkRlY2lzaW9uc1wiIHwgXCJSYXRpb25hbGVcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiwgc3RyaW5nW10+ID0ge1xuICAgIERlY2lzaW9uczogW10sXG4gICAgUmF0aW9uYWxlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKERlY2lzaW9uc3xSYXRpb25hbGV8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkZWNpc2lvbnM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuRGVjaXNpb25zXSksXG4gICAgcmF0aW9uYWxlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuUmF0aW9uYWxlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgRGVjaXNpb25zOiBzdHJpbmdbXTtcbiAgUmF0aW9uYWxlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJyYXRpb25hbGVcIikge1xuICAgIHJldHVybiBcIlJhdGlvbmFsZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIkRlY2lzaW9uc1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBsb29rc0xpa2VRdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibm90IHN1cmVcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRm9sbG93VXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZm9sbG93IHVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZXh0IHN0ZXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImludmVzdGlnYXRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjb25maXJtXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ2YWxpZGF0ZVwiKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBjb250ZXh0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZUZvbGxvd1VwKHRleHQpKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5zaXplIDwgNikge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZVF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNpemUgPCA0KSB7XG4gICAgICBjb250ZXh0LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3BlbiBRdWVzdGlvbnNcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPcGVuIFF1ZXN0aW9uc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl1dKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuQ29udGV4dCksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5UG9pbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgcXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oa2V5UG9pbnRzLCBcIk5vIGtleSBwb2ludHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUNsZWFuTm90ZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgcGFyc2VkLmtleVBvaW50cyB8fCBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBrZXlQb2ludHM6IHN0cmluZztcbiAgcXVlc3Rpb25zOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiS2V5IFBvaW50c1wiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIFwiS2V5IFBvaW50c1wiOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEtleSBQb2ludHN8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGtleVBvaW50czogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFBvaW50c1wiXSksXG4gICAgcXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBcIktleSBQb2ludHNcIjogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHBvaW50c1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFBvaW50c1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG92ZXJ2aWV3ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGdvYWxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHNjb3BlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG5leHRTdGVwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICBzY29wZS5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICBuZXh0U3RlcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgICAgZ29hbHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBzY29wZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VHb2FsKGJ1bGxldFRleHQpKSB7XG4gICAgICAgICAgZ29hbHMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlR29hbChsaW5lKSkge1xuICAgICAgZ29hbHMuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH0gZWxzZSBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBHb2Fsc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGdvYWxzLCBcIk5vIGdvYWxzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgU2NvcGVcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihzY29wZSwgXCJObyBzY29wZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihuZXh0U3RlcHMsIFwiTm8gbmV4dCBzdGVwcyBmb3VuZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlR29hbCh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImdvYWwgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImdvYWxzIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZWVkIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZWVkcyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwid2FudCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwid2FudHMgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaG91bGQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJtdXN0IFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwib2JqZWN0aXZlXCIpXG4gICk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVByb2plY3RCcmllZlNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgIHBhcnNlZC5nb2FscyB8fCBcIk5vIGdvYWxzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICBwYXJzZWQuc2NvcGUgfHwgXCJObyBzY29wZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBwYXJzZWQubmV4dFN0ZXBzIHx8IFwiTm8gbmV4dCBzdGVwcyBleHRyYWN0ZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEdvYWxzXCIsXG4gICAgXCJObyBnb2FscyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFNjb3BlXCIsXG4gICAgXCJObyBzY29wZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBcIk5vIG5leHQgc3RlcHMgZXh0cmFjdGVkLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUHJvamVjdEJyaWVmU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBnb2Fsczogc3RyaW5nO1xuICBzY29wZTogc3RyaW5nO1xuICBuZXh0U3RlcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJPdmVydmlld1wiIHwgXCJHb2Fsc1wiIHwgXCJTY29wZVwiIHwgXCJOZXh0IFN0ZXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgR29hbHM6IFtdLFxuICAgIFNjb3BlOiBbXSxcbiAgICBcIk5leHQgU3RlcHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3ZlcnZpZXd8R29hbHN8U2NvcGV8TmV4dCBTdGVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAgZ29hbHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5Hb2FscyksXG4gICAgc2NvcGU6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5TY29wZSksXG4gICAgbmV4dFN0ZXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJOZXh0IFN0ZXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIEdvYWxzOiBzdHJpbmdbXTtcbiAgU2NvcGU6IHN0cmluZ1tdO1xuICBcIk5leHQgU3RlcHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZ29hbHNcIikge1xuICAgIHJldHVybiBcIkdvYWxzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwic2NvcGVcIikge1xuICAgIHJldHVybiBcIlNjb3BlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwibmV4dCBzdGVwc1wiKSB7XG4gICAgcmV0dXJuIFwiTmV4dCBTdGVwc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiVGFzayBFeHRyYWN0aW9uXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgIHJldHVybiBcIkRlY2lzaW9uIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgcmV0dXJuIFwiQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIlByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcnlcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlKTogc3RyaW5nIHtcbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgVGFza3NcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBEZWNpc2lvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IE9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJSZXdyaXRlIGFzIENsZWFuIE5vdGVcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICByZXR1cm4gXCJEcmFmdCBQcm9qZWN0IEJyaWVmXCI7XG4gIH1cblxuICByZXR1cm4gXCJTdW1tYXJpemVcIjtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1RvcGljUGFnZSB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBjbGFzcyBUb3BpY1BhZ2VTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZSh0b3BpYzogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWRUb3BpYyA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyk7XG4gICAgaWYgKCFjbGVhbmVkVG9waWMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvcGljIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgICBjb250ZXh0LnRleHQsXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZShjbGVhbmVkVG9waWMsIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgdG9waWMgcGFnZSBnZW5lcmF0aW9uXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gZW5zdXJlVG9waWNCdWxsZXQoXG4gICAgICBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudCksXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiVG9waWMgUGFnZVwiLFxuICAgICAgdGl0bGU6IFwiVG9waWMgUGFnZVwiLFxuICAgICAgbm90ZVRpdGxlOiBzaG9ydGVuVG9waWMoY2xlYW5lZFRvcGljKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50LFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogY2xlYW5lZFRvcGljLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlVG9waWNCdWxsZXQoY29udGVudDogc3RyaW5nLCB0b3BpYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBvdmVydmlld0luZGV4ID0gbGluZXMuZmluZEluZGV4KChsaW5lKSA9PiAvXiMjXFxzK092ZXJ2aWV3XFxzKiQvLnRlc3QobGluZSkpO1xuICBpZiAob3ZlcnZpZXdJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IG5leHRIZWFkaW5nSW5kZXggPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgKGxpbmUsIGluZGV4KSA9PiBpbmRleCA+IG92ZXJ2aWV3SW5kZXggJiYgL14jI1xccysvLnRlc3QobGluZSksXG4gICk7XG4gIGNvbnN0IHRvcGljTGluZSA9IGAtIFRvcGljOiAke25vcm1hbGl6ZWRUb3BpY31gO1xuICBjb25zdCBvdmVydmlld1NsaWNlID0gbGluZXMuc2xpY2UoXG4gICAgb3ZlcnZpZXdJbmRleCArIDEsXG4gICAgbmV4dEhlYWRpbmdJbmRleCA9PT0gLTEgPyBsaW5lcy5sZW5ndGggOiBuZXh0SGVhZGluZ0luZGV4LFxuICApO1xuICBpZiAob3ZlcnZpZXdTbGljZS5zb21lKChsaW5lKSA9PiBsaW5lLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCItIHRvcGljOlwiKSkpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGluc2VydGlvbkluZGV4ID0gb3ZlcnZpZXdJbmRleCArIDE7XG4gIGNvbnN0IHVwZGF0ZWQgPSBbLi4ubGluZXNdO1xuICB1cGRhdGVkLnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgdG9waWNMaW5lKTtcbiAgcmV0dXJuIHVwZGF0ZWQuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2hvcnRlblRvcGljKHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gdG9waWMudHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgVG9waWMgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gbG9va3NMaWtlT3BlblF1ZXN0aW9uKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5lbmRzV2l0aChcIj9cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInF1ZXN0aW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ1bmNsZWFyXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJvcGVuIGlzc3VlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ1bmtub3duXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZU5leHRTdGVwKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmV4dCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZm9sbG93IHVwXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImZvbGxvdy11cFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ0b2RvIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ0by1kbyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNob3VsZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5lZWQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZWVkcyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm11c3QgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJhY3Rpb25cIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0U291cmNlcyhcbiAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgc291cmNlUGF0aHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgc291cmNlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGlmIChzb3VyY2VQYXRocyAmJiBzb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKSkge1xuICAgICAgc291cmNlcy5hZGQocGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZVBhdGhzLmxlbmd0aCA+IDEyKSB7XG4gICAgICBzb3VyY2VzLmFkZChgLi4uYW5kICR7c291cmNlUGF0aHMubGVuZ3RoIC0gMTJ9IG1vcmVgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoc291cmNlUGF0aCkge1xuICAgIHNvdXJjZXMuYWRkKHNvdXJjZVBhdGgpO1xuICB9IGVsc2Uge1xuICAgIHNvdXJjZXMuYWRkKHNvdXJjZUxhYmVsKTtcbiAgfVxuXG4gIHJldHVybiBmb3JtYXRMaXN0U2VjdGlvbihzb3VyY2VzLCBcIk5vIGV4cGxpY2l0IHNvdXJjZXMgZm91bmQuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1RvcGljUGFnZShcbiAgdG9waWM6IHN0cmluZyxcbiAgY29udGVudDogc3RyaW5nLFxuICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBzb3VyY2VQYXRoczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBldmlkZW5jZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG5leHRTdGVwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGhlYWRpbmdUZXh0KSkge1xuICAgICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9va3NMaWtlTmV4dFN0ZXAoaGVhZGluZ1RleHQpKSB7XG4gICAgICAgICAgbmV4dFN0ZXBzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAgZXZpZGVuY2UuYWRkKHRhc2tUZXh0KTtcbiAgICAgICAgbmV4dFN0ZXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAgZXZpZGVuY2UuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGJ1bGxldFRleHQpKSB7XG4gICAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvb2tzTGlrZU5leHRTdGVwKGJ1bGxldFRleHQpKSB7XG4gICAgICAgICAgbmV4dFN0ZXBzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihsaW5lKSkge1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpO1xuICAgICAgaWYgKHF1ZXN0aW9uKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHF1ZXN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH0gZWxzZSBpZiAoZXZpZGVuY2Uuc2l6ZSA8IDQpIHtcbiAgICAgIGV2aWRlbmNlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIW5leHRTdGVwcy5zaXplKSB7XG4gICAgbmV4dFN0ZXBzLmFkZChcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgYC0gVG9waWM6ICR7c2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyl9YCxcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZXZpZGVuY2UsIFwiTm8gZXZpZGVuY2UgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgZm9ybWF0U291cmNlcyhzb3VyY2VMYWJlbCwgc291cmNlUGF0aCwgc291cmNlUGF0aHMpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24obmV4dFN0ZXBzLCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNvdXJjZXNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUb3BpY1BhZ2VTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgcGFyc2VkLmV2aWRlbmNlIHx8IFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgcGFyc2VkLnNvdXJjZXMgfHwgXCJObyBzb3VyY2VzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIHBhcnNlZC5uZXh0U3RlcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFNvdXJjZXNcIixcbiAgICBcIk5vIHNvdXJjZXMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVG9waWNQYWdlU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBldmlkZW5jZTogc3RyaW5nO1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG4gIHNvdXJjZXM6IHN0cmluZztcbiAgbmV4dFN0ZXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFxuICAgIFwiT3ZlcnZpZXdcIiB8IFwiRXZpZGVuY2VcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiB8IFwiU291cmNlc1wiIHwgXCJOZXh0IFN0ZXBzXCIsXG4gICAgc3RyaW5nW11cbiAgPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgRXZpZGVuY2U6IFtdLFxuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gICAgU291cmNlczogW10sXG4gICAgXCJOZXh0IFN0ZXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKFxuICAgICAgL14jI1xccysoT3ZlcnZpZXd8RXZpZGVuY2V8T3BlbiBRdWVzdGlvbnN8U291cmNlc3xOZXh0IFN0ZXBzKVxccyokL2ksXG4gICAgKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAgZXZpZGVuY2U6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5FdmlkZW5jZSksXG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl0pLFxuICAgIHNvdXJjZXM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5Tb3VyY2VzKSxcbiAgICBuZXh0U3RlcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk5leHQgU3RlcHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIE92ZXJ2aWV3OiBzdHJpbmdbXTtcbiAgRXZpZGVuY2U6IHN0cmluZ1tdO1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xuICBTb3VyY2VzOiBzdHJpbmdbXTtcbiAgXCJOZXh0IFN0ZXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImV2aWRlbmNlXCIpIHtcbiAgICByZXR1cm4gXCJFdmlkZW5jZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcInNvdXJjZXNcIikge1xuICAgIHJldHVybiBcIlNvdXJjZXNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJuZXh0IHN0ZXBzXCIpIHtcbiAgICByZXR1cm4gXCJOZXh0IFN0ZXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tWYXVsdFNlcnZpY2Uge1xuICBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dW5rbm93bj47XG4gIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgVGFza1NlcnZpY2Uge1xuICBwcml2YXRlIG9wZW5UYXNrQ291bnRDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBUYXNrVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGFzayB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAtIFsgXSAke2NsZWFuZWR9IF8oYWRkZWQgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX0pX2A7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy50YXNrc0ZpbGUsIGJsb2NrKTtcbiAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHsgcGF0aDogc2V0dGluZ3MudGFza3NGaWxlIH07XG4gIH1cblxuICBhc3luYyBnZXRPcGVuVGFza0NvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB7IHRleHQsIG10aW1lLCBleGlzdHMgfSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0V2l0aE10aW1lKHNldHRpbmdzLnRhc2tzRmlsZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0ge1xuICAgICAgICBtdGltZTogMCxcbiAgICAgICAgY291bnQ6IDAsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3BlblRhc2tDb3VudENhY2hlICYmIHRoaXMub3BlblRhc2tDb3VudENhY2hlLm10aW1lID09PSBtdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMub3BlblRhc2tDb3VudENhY2hlLmNvdW50O1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gdGV4dFxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoKGxpbmUpID0+IC9eLSBcXFsoIHx4fFgpXFxdLy50ZXN0KGxpbmUpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gIS9eLSBcXFsoeHxYKVxcXS8udGVzdChsaW5lKSlcbiAgICAgIC5sZW5ndGg7XG4gICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSB7XG4gICAgICBtdGltZSxcbiAgICAgIGNvdW50LFxuICAgIH07XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dCB9IGZyb20gXCIuLi91dGlscy9xdWVzdGlvbi1hbnN3ZXItbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdG9waWMtcGFnZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRleHQtZm9ybWF0XCI7XG5pbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZXhCaW5hcnlQYXRoIH0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LWF1dGhcIjtcblxudHlwZSBSb3V0ZUxhYmVsID0gXCJub3RlXCIgfCBcInRhc2tcIiB8IFwiam91cm5hbFwiIHwgbnVsbDtcblxuaW50ZXJmYWNlIEdlbWluaUNvbnRlbnRQYXJ0IHtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgR2VtaW5pUmVxdWVzdEJvZHkge1xuICBjb250ZW50czogQXJyYXk8eyByb2xlOiBzdHJpbmc7IHBhcnRzOiBHZW1pbmlDb250ZW50UGFydFtdIH0+O1xuICBnZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgdGVtcGVyYXR1cmU6IG51bWJlcjtcbiAgICBtYXhPdXRwdXRUb2tlbnM6IG51bWJlcjtcbiAgfTtcbiAgc3lzdGVtX2luc3RydWN0aW9uPzoge1xuICAgIHBhcnRzOiBHZW1pbmlDb250ZW50UGFydFtdO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQ2hhdENvbXBsZXRpb25DaG9pY2Uge1xuICBtZXNzYWdlPzoge1xuICAgIGNvbnRlbnQ/OiBzdHJpbmc7XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvblJlc3BvbnNlIHtcbiAgY2hvaWNlcz86IENoYXRDb21wbGV0aW9uQ2hvaWNlW107XG59XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkFJU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBhc3luYyBzdW1tYXJpemUodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHN1bW1hcml6ZSBtYXJrZG93biB2YXVsdCBjb250ZW50LiBSZXNwb25kIHdpdGggY29uY2lzZSBtYXJrZG93biB1c2luZyB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiU3VtbWFyaXplIHRoZSBmb2xsb3dpbmcgdmF1bHQgY29udGVudCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIHRhc2tzLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVTdW1tYXJ5KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVDb250ZXh0KFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHByb21wdCA9IHRoaXMuYnVpbGRQcm9tcHQodGVtcGxhdGUsIGNvbnRleHQpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIHByb21wdCk7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHRlbXBsYXRlLCByZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8Um91dGVMYWJlbD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIkNsYXNzaWZ5IGNhcHR1cmUgdGV4dCBpbnRvIGV4YWN0bHkgb25lIG9mOiBub3RlLCB0YXNrLCBqb3VybmFsLiBSZXR1cm4gb25lIHdvcmQgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJDbGFzc2lmeSB0aGUgZm9sbG93aW5nIHVzZXIgaW5wdXQgYXMgZXhhY3RseSBvbmUgb2Y6XCIsXG4gICAgICAgICAgXCJub3RlXCIsXG4gICAgICAgICAgXCJ0YXNrXCIsXG4gICAgICAgICAgXCJqb3VybmFsXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBvbmx5IG9uZSB3b3JkLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIGNvbnN0IGNsZWFuZWQgPSByZXNwb25zZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY2xlYW5lZCA9PT0gXCJub3RlXCIgfHwgY2xlYW5lZCA9PT0gXCJ0YXNrXCIgfHwgY2xlYW5lZCA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgIHJldHVybiBjbGVhbmVkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGFuc3dlclF1ZXN0aW9uKFxuICAgIHF1ZXN0aW9uOiBzdHJpbmcsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgYW5zd2VyIHF1ZXN0aW9ucyB1c2luZyBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IG9ubHkuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seSBhbmQgZG8gbm90IGludmVudCBmYWN0cy5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJBbnN3ZXIgdGhlIGZvbGxvd2luZyBxdWVzdGlvbiB1c2luZyBvbmx5IHRoZSBjb250ZXh0IGJlbG93LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgYFF1ZXN0aW9uOiAke3F1ZXN0aW9ufWAsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiSWYgdGhlIGNvbnRleHQgaXMgaW5zdWZmaWNpZW50LCBzYXkgc28gZXhwbGljaXRseS5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoXG4gICAgdG9waWM6IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSB0dXJuIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBhIGR1cmFibGUgd2lraSBwYWdlLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBgQ3JlYXRlIGEgdG9waWMgcGFnZSBmb3I6ICR7dG9waWN9YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgYC0gVG9waWM6ICR7dG9waWN9YCxcbiAgICAgICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQga2VlcCB0aGUgcGFnZSByZXVzYWJsZS5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQocmVzcG9uc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q2hhdENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiY29kZXhcIikge1xuICAgICAgcmV0dXJuIHRoaXMucG9zdENvZGV4Q29tcGxldGlvbihzZXR0aW5ncywgbWVzc2FnZXMpO1xuICAgIH1cbiAgICBpZiAoc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgcmV0dXJuIHRoaXMucG9zdEdlbWluaUNvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucG9zdE9wZW5BSUNvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdENvZGV4Q29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IGV4ZWNGaWxlQXN5bmMsIGZzLCBvcywgcGF0aCB9ID0gZ2V0Q29kZXhSdW50aW1lKCk7XG4gICAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCBDTEkgaXMgbm90IGluc3RhbGxlZC4gSW5zdGFsbCBgQG9wZW5haS9jb2RleGAgYW5kIHJ1biBgY29kZXggbG9naW5gIGZpcnN0LlwiKTtcbiAgICB9XG4gICAgY29uc3QgdGVtcERpciA9IGF3YWl0IGZzLm1rZHRlbXAocGF0aC5qb2luKG9zLnRtcGRpcigpLCBcImJyYWluLWNvZGV4LVwiKSk7XG4gICAgY29uc3Qgb3V0cHV0RmlsZSA9IHBhdGguam9pbih0ZW1wRGlyLCBcInJlc3BvbnNlLnR4dFwiKTtcbiAgICBjb25zdCBhcmdzID0gW1xuICAgICAgXCJleGVjXCIsXG4gICAgICBcIi0tc2tpcC1naXQtcmVwby1jaGVja1wiLFxuICAgICAgXCItLWVwaGVtZXJhbFwiLFxuICAgICAgXCItLXNhbmRib3hcIixcbiAgICAgIFwicmVhZC1vbmx5XCIsXG4gICAgICBcIi0tb3V0cHV0LWxhc3QtbWVzc2FnZVwiLFxuICAgICAgb3V0cHV0RmlsZSxcbiAgICBdO1xuXG4gICAgaWYgKHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICBhcmdzLnB1c2goXCItLW1vZGVsXCIsIHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKTtcbiAgICB9XG5cbiAgICBhcmdzLnB1c2godGhpcy5idWlsZENvZGV4UHJvbXB0KG1lc3NhZ2VzKSk7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZXhlY0ZpbGVBc3luYyhjb2RleEJpbmFyeSwgYXJncywge1xuICAgICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogNCxcbiAgICAgICAgY3dkOiB0ZW1wRGlyLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucmVhZEZpbGUob3V0cHV0RmlsZSwgXCJ1dGY4XCIpO1xuICAgICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZVwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGF3YWl0IGZzLnJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KS5jYXRjaCgoKSA9PiB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb2RleFByb21wdChcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJZb3UgYXJlIHJlc3BvbmRpbmcgaW5zaWRlIEJyYWluLCBhbiBPYnNpZGlhbiBwbHVnaW4uXCIsXG4gICAgICBcIkRvIG5vdCBydW4gc2hlbGwgY29tbWFuZHMsIGluc3BlY3QgdGhlIGZpbGVzeXN0ZW0sIG9yIG1vZGlmeSBmaWxlcy5cIixcbiAgICAgIFwiVXNlIG9ubHkgdGhlIGNvbnRlbnQgcHJvdmlkZWQgYmVsb3cgYW5kIGFuc3dlciB3aXRoIG1hcmtkb3duIG9ubHkuXCIsXG4gICAgICBcIlwiLFxuICAgICAgLi4ubWVzc2FnZXMubWFwKChtZXNzYWdlKSA9PiBgJHttZXNzYWdlLnJvbGUudG9VcHBlckNhc2UoKX06XFxuJHttZXNzYWdlLmNvbnRlbnR9YCksXG4gICAgXS5qb2luKFwiXFxuXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0T3BlbkFJQ29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBpc0RlZmF1bHRVcmwgPSAhc2V0dGluZ3Mub3BlbkFJQmFzZVVybCB8fCBzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLmluY2x1ZGVzKFwiYXBpLm9wZW5haS5jb21cIik7XG4gICAgaWYgKGlzRGVmYXVsdFVybCAmJiAhc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbkFJIEFQSSBrZXkgaXMgbWlzc2luZ1wiKTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfTtcblxuICAgIGlmIChzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpKSB7XG4gICAgICBoZWFkZXJzW1wiQXV0aG9yaXphdGlvblwiXSA9IGBCZWFyZXIgJHtzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpfWA7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IHNldHRpbmdzLm9wZW5BSUJhc2VVcmwudHJpbSgpIHx8IFwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zXCIsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbW9kZWw6IHNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSxcbiAgICAgICAgbWVzc2FnZXMsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjIsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGpzb24gPSByZXN1bHQuanNvbiBhcyBDaGF0Q29tcGxldGlvblJlc3BvbnNlO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBqc29uLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCA/PyBcIlwiO1xuICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5BSSByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0R2VtaW5pQ29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoIXNldHRpbmdzLmdlbWluaUFwaUtleS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbWluaSBBUEkga2V5IGlzIG1pc3NpbmdcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgc3lzdGVtTWVzc2FnZSA9IG1lc3NhZ2VzLmZpbmQoKG0pID0+IG0ucm9sZSA9PT0gXCJzeXN0ZW1cIik7XG4gICAgY29uc3QgdXNlck1lc3NhZ2VzID0gbWVzc2FnZXMuZmlsdGVyKChtKSA9PiBtLnJvbGUgIT09IFwic3lzdGVtXCIpO1xuXG4gICAgLy8gQ29udmVydCBPcGVuQUkgbWVzc2FnZXMgdG8gR2VtaW5pIGZvcm1hdFxuICAgIGNvbnN0IGNvbnRlbnRzID0gdXNlck1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgIHJvbGU6IG0ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcInVzZXJcIiA6IFwibW9kZWxcIixcbiAgICAgIHBhcnRzOiBbeyB0ZXh0OiBtLmNvbnRlbnQgfV0sXG4gICAgfSkpO1xuXG4gICAgY29uc3QgYm9keTogR2VtaW5pUmVxdWVzdEJvZHkgPSB7XG4gICAgICBjb250ZW50cyxcbiAgICAgIGdlbmVyYXRpb25Db25maWc6IHtcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuMixcbiAgICAgICAgbWF4T3V0cHV0VG9rZW5zOiAyMDQ4LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgaWYgKHN5c3RlbU1lc3NhZ2UpIHtcbiAgICAgIGJvZHkuc3lzdGVtX2luc3RydWN0aW9uID0ge1xuICAgICAgICBwYXJ0czogW3sgdGV4dDogc3lzdGVtTWVzc2FnZS5jb250ZW50IH1dLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvJHtzZXR0aW5ncy5nZW1pbmlNb2RlbH06Z2VuZXJhdGVDb250ZW50P2tleT0ke3NldHRpbmdzLmdlbWluaUFwaUtleX1gLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzdWx0Lmpzb247XG4gICAgY29uc3QgY29udGVudCA9IGpzb24uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0ID8/IFwiXCI7XG4gICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VtaW5pIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkUHJvbXB0KFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+IHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCBhY3Rpb25hYmxlIHRhc2tzIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCB0YXNrcyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIGl0ZW1zLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgcmV3cml0ZSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gYSBjbGVhbiBtYXJrZG93biBub3RlLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJSZXdyaXRlIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHRoZSBzdHJ1Y3R1cmUgb2YgYSByZXVzYWJsZSBub3RlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IGRlY2lzaW9ucyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3QgZGVjaXNpb25zIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSB1bmNlcnRhaW50eSB3aGVyZSBjb250ZXh0IGlzIGluY29tcGxldGUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCB1bnJlc29sdmVkIHF1ZXN0aW9ucyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3Qgb3BlbiBxdWVzdGlvbnMgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQga2VlcCB1bmNlcnRhaW50eSBleHBsaWNpdC5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBkcmFmdCBhIHByb2plY3QgYnJpZWYgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJEcmFmdCB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICAgICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICAgICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBwcm9qZWN0IHN0cnVjdHVyZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgdHVybiBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gY29uY2lzZSBtYXJrZG93biBzeW50aGVzaXMuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiU3VtbWFyaXplIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgaXRlbXMuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgcmVzcG9uc2U6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0Vub2VudEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImNvZGVcIiBpbiBlcnJvciAmJiBlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiO1xufVxuXG5mdW5jdGlvbiBnZXRDb2RleFJ1bnRpbWUoKToge1xuICBleGVjRmlsZUFzeW5jOiAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PjtcbiAgZnM6IHR5cGVvZiBpbXBvcnQoXCJmc1wiKS5wcm9taXNlcztcbiAgb3M6IHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcbiAgcGF0aDogdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG59IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgY29uc3QgeyBleGVjRmlsZSB9ID0gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgY29uc3QgeyBwcm9taXNpZnkgfSA9IHJlcShcInV0aWxcIikgYXMgdHlwZW9mIGltcG9ydChcInV0aWxcIik7XG5cbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZUFzeW5jOiBwcm9taXNpZnkoZXhlY0ZpbGUpIGFzIChcbiAgICAgIGZpbGU6IHN0cmluZyxcbiAgICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICAgIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4sXG4gICAgZnM6IChyZXEoXCJmc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnNcIikpLnByb21pc2VzLFxuICAgIG9zOiByZXEoXCJvc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwib3NcIiksXG4gICAgcGF0aDogcmVxKFwicGF0aFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVJlcXVpcmUoKTogTm9kZVJlcXVpcmUge1xuICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpIGFzIE5vZGVSZXF1aXJlO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVN1bW1hcnlTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgIHBhcnNlZC5oaWdobGlnaHRzIHx8IFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIHBhcnNlZC50YXNrcyB8fCBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHJlY2VudCBub3Rlcy5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN1bW1hcnlTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGhpZ2hsaWdodHM6IHN0cmluZztcbiAgdGFza3M6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiSGlnaGxpZ2h0c1wiIHwgXCJUYXNrc1wiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBIaWdobGlnaHRzOiBbXSxcbiAgICBUYXNrczogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKEhpZ2hsaWdodHN8VGFza3N8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGhpZ2hsaWdodHM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuSGlnaGxpZ2h0c10pLFxuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgSGlnaGxpZ2h0czogc3RyaW5nW107XG4gIFRhc2tzOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcInRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJUYXNrc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJIaWdobGlnaHRzXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgQ29kZXhMb2dpblN0YXR1cywgZ2V0Q29kZXhMb2dpblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkF1dGhTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IEJyYWluUGx1Z2luKSB7fVxuXG4gIGFzeW5jIGxvZ2luKHByb3ZpZGVyOiBcIm9wZW5haVwiIHwgXCJjb2RleFwiIHwgXCJnZW1pbmlcIikge1xuICAgIGxldCB1cmwgPSBcIlwiO1xuICAgIGlmIChwcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgdXJsID0gXCJodHRwczovL3BsYXRmb3JtLm9wZW5haS5jb20vYXBpLWtleXNcIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJPcGVuIHRoZSBPcGVuQUkgQVBJIGtleSBwYWdlLCBjcmVhdGUgYSBrZXksIHRoZW4gcGFzdGUgaXQgaW50byBCcmFpbiBzZXR0aW5ncy5cIik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gXCJjb2RleFwiKSB7XG4gICAgICB1cmwgPSBcImh0dHBzOi8vb3BlbmFpLmNvbS9jb2RleC9nZXQtc3RhcnRlZC9cIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJJbnN0YWxsIHRoZSBDb2RleCBDTEksIHJ1biBgY29kZXggbG9naW5gLCB0aGVuIHJldHVybiB0byBCcmFpbiBhbmQgc2VsZWN0IHRoZSBDb2RleCBwcm92aWRlci5cIik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgdXJsID0gXCJodHRwczovL2Fpc3R1ZGlvLmdvb2dsZS5jb20vYXBwL2FwaWtleVwiO1xuICAgICAgbmV3IE5vdGljZShcIk9wZW4gdGhlIEdlbWluaSBBUEkga2V5IHBhZ2UsIHRoZW4gcGFzdGUgdGhlIGtleSBpbnRvIEJyYWluIHNldHRpbmdzLlwiKTtcbiAgICB9XG5cbiAgICB3aW5kb3cub3Blbih1cmwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29kZXhTdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gICAgcmV0dXJuIGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcblxuZXhwb3J0IGNsYXNzIFZhdWx0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHApIHt9XG5cbiAgYXN5bmMgZW5zdXJlS25vd25Gb2xkZXJzKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZm9sZGVycyA9IG5ldyBTZXQoW1xuICAgICAgc2V0dGluZ3Muam91cm5hbEZvbGRlcixcbiAgICAgIHNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyLFxuICAgICAgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcixcbiAgICAgIHBhcmVudEZvbGRlcihzZXR0aW5ncy5pbmJveEZpbGUpLFxuICAgICAgcGFyZW50Rm9sZGVyKHNldHRpbmdzLnRhc2tzRmlsZSksXG4gICAgXSk7XG5cbiAgICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmb2xkZXJQYXRoKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZ21lbnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlRm9sZGVySWZNaXNzaW5nKGN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmICghKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZm9sZGVyOiAke2N1cnJlbnR9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBpbml0aWFsQ29udGVudCA9IFwiXCIpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZmlsZTogJHtub3JtYWxpemVkfWApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihub3JtYWxpemVkKSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBpbml0aWFsQ29udGVudCk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9PiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGV4aXN0czogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpLFxuICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgIGV4aXN0czogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBjdXJyZW50Lmxlbmd0aCA9PT0gMFxuICAgICAgPyBcIlwiXG4gICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cXG5cIilcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblwiKVxuICAgICAgICAgID8gXCJcXG5cIlxuICAgICAgICAgIDogXCJcXG5cXG5cIjtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCR7Y3VycmVudH0ke3NlcGFyYXRvcn0ke25vcm1hbGl6ZWRDb250ZW50fWApO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5vcm1hbGl6ZWRDb250ZW50KTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZVVuaXF1ZUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZG90SW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90SW5kZXggPT09IC0xID8gbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90SW5kZXgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdEluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKGRvdEluZGV4KTtcblxuICAgIGxldCBjb3VudGVyID0gMjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtjb3VudGVyfSR7ZXh0ZW5zaW9ufWA7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYXBwZW5kSm91cm5hbEhlYWRlcihmaWxlUGF0aDogc3RyaW5nLCBkYXRlS2V5OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgIyAke2RhdGVLZXl9XFxuXFxuYCk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgbGlzdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgfVxuXG4gIGFzeW5jIGNvbGxlY3RNYXJrZG93bkZpbGVzKG9wdGlvbnM6IHtcbiAgICBleGNsdWRlRm9sZGVycz86IHN0cmluZ1tdO1xuICAgIG1pbk10aW1lPzogbnVtYmVyO1xuICAgIGZvbGRlclBhdGg/OiBzdHJpbmc7XG4gIH0gPSB7fSk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGxldCBmaWxlcyA9IGF3YWl0IHRoaXMubGlzdE1hcmtkb3duRmlsZXMoKTtcblxuICAgIGlmIChvcHRpb25zLmV4Y2x1ZGVGb2xkZXJzKSB7XG4gICAgICBmb3IgKGNvbnN0IGZvbGRlciBvZiBvcHRpb25zLmV4Y2x1ZGVGb2xkZXJzKSB7XG4gICAgICAgIGZpbGVzID0gZmlsZXMuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIGZvbGRlcikpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLm1pbk10aW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZpbGVzID0gZmlsZXMuZmlsdGVyKChmaWxlKSA9PiBmaWxlLnN0YXQubXRpbWUgPj0gb3B0aW9ucy5taW5NdGltZSEpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmZvbGRlclBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoKGZpbGUpID0+XG4gICAgICAgIG9wdGlvbnMuZm9sZGVyUGF0aFxuICAgICAgICAgID8gaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIG9wdGlvbnMuZm9sZGVyUGF0aClcbiAgICAgICAgICA6ICFmaWxlLnBhdGguaW5jbHVkZXMoXCIvXCIpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXMuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVGb2xkZXJJZk1pc3NpbmcoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJlbnRGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKDAsIGluZGV4KTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldywgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgUXVlc3Rpb25TY29wZSwgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IENvbnRleHRTZXJ2aWNlLCBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQsIFN5bnRoZXNpc1NlcnZpY2UgfSBmcm9tIFwiLi9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHsgVG9waWNQYWdlU2VydmljZSB9IGZyb20gXCIuL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgUXVlc3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vcXVlc3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgTm90ZVNlcnZpY2UgfSBmcm9tIFwiLi9ub3RlLXNlcnZpY2VcIjtcbmltcG9ydCB7IEZpbGVHcm91cFBpY2tlck1vZGFsIH0gZnJvbSBcIi4uL3ZpZXdzL2ZpbGUtZ3JvdXAtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBQcm9tcHRNb2RhbCB9IGZyb20gXCIuLi92aWV3cy9wcm9tcHQtbW9kYWxzXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlTW9kYWwgfSBmcm9tIFwiLi4vdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWxcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdE1vZGFsIH0gZnJvbSBcIi4uL3ZpZXdzL3N5bnRoZXNpcy1yZXN1bHQtbW9kYWxcIjtcbmltcG9ydCB7IFRlbXBsYXRlUGlja2VyTW9kYWwgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBidWlsZFN5bnRoZXNpc05vdGVDb250ZW50LCBidWlsZEluc2VydGVkU3ludGhlc2lzQ29udGVudCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtZm9ybWF0XCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuaW1wb3J0IHsgaXNCcmFpbkdlbmVyYXRlZFBhdGggfSBmcm9tIFwiLi4vdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgZ2V0QXBwZW5kU2VwYXJhdG9yIH0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBCcmFpbldvcmtmbG93Q2FsbGJhY2tzIHtcbiAgdXBkYXRlUmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQ7XG4gIHVwZGF0ZVN1bW1hcnkodGV4dDogc3RyaW5nKTogdm9pZDtcbiAgcmVmcmVzaFN0YXR1cygpOiBQcm9taXNlPHZvaWQ+O1xuICByZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbiAgaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCk6IGJvb2xlYW47XG4gIHNldExhc3RTdW1tYXJ5QXQoZGF0ZTogRGF0ZSk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBCcmFpbldvcmtmbG93U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29udGV4dFNlcnZpY2U6IENvbnRleHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc3ludGhlc2lzU2VydmljZTogU3ludGhlc2lzU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvcGljUGFnZVNlcnZpY2U6IFRvcGljUGFnZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBxdWVzdGlvblNlcnZpY2U6IFF1ZXN0aW9uU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG5vdGVTZXJ2aWNlOiBOb3RlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrczogQnJhaW5Xb3JrZmxvd0NhbGxiYWNrcyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudE5vdGUoZGVmYXVsdFRlbXBsYXRlPzogU3ludGhlc2lzVGVtcGxhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBkZWZhdWx0VGVtcGxhdGUgPyBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIiA6IFwiU3ludGhlc2l6ZSBDdXJyZW50IE5vdGVcIixcbiAgICAgIGRlZmF1bHRUZW1wbGF0ZSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRTZWxlY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkVGV4dENvbnRleHQoKSxcbiAgICAgIFwiRXh0cmFjdCBUYXNrcyBGcm9tIFNlbGVjdGlvblwiLFxuICAgICAgXCJleHRyYWN0LXRhc2tzXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0UmVjZW50RmlsZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFJlY2VudEZpbGVzQ29udGV4dCgpLFxuICAgICAgXCJDbGVhbiBOb3RlIEZyb20gUmVjZW50IEZpbGVzXCIsXG4gICAgICBcInJld3JpdGUtY2xlYW4tbm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCksXG4gICAgICBcIkRyYWZ0IEJyaWVmIEZyb20gQ3VycmVudCBGb2xkZXJcIixcbiAgICAgIFwiZHJhZnQtcHJvamVjdC1icmllZlwiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBzeW50aGVzaXplTm90ZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJTeW50aGVzaXplIE5vdGVzXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICAgICAgc2NvcGUsXG4gICAgICAgIFwiU2VsZWN0IE5vdGVzIHRvIFN5bnRoZXNpemVcIixcbiAgICAgICk7XG4gICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IGF3YWl0IHRoaXMucGlja1N5bnRoZXNpc1RlbXBsYXRlKFwiU3ludGhlc2l6ZSBOb3Rlc1wiKTtcbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1blN5bnRoZXNpc0Zsb3coY29udGV4dCwgdGVtcGxhdGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHN5bnRoZXNpemUgdGhlc2Ugbm90ZXNcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnROb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25Gb3JTY29wZShcIm5vdGVcIik7XG4gIH1cblxuICBhc3luYyBhc2tRdWVzdGlvbkFib3V0Q3VycmVudEZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoXCJmb2xkZXJcIik7XG4gIH1cblxuICBhc3luYyBhc2tRdWVzdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2NvcGUgPSBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIkFzayBRdWVzdGlvblwiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25Gb3JTY29wZShzY29wZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXNrIEJyYWluXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZShkZWZhdWx0U2NvcGU/OiBRdWVzdGlvblNjb3BlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRvcGljID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIlRvcGljIG9yIHF1ZXN0aW9uIHRvIHR1cm4gaW50byBhIHdpa2kgcGFnZS4uLlwiLFxuICAgICAgICBzdWJtaXRMYWJlbDogXCJDcmVhdGVcIixcbiAgICAgICAgbXVsdGlsaW5lOiB0cnVlLFxuICAgICAgfSkub3BlblByb21wdCgpO1xuICAgICAgaWYgKCF0b3BpYykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNjb3BlID0gZGVmYXVsdFNjb3BlID8/IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiQ3JlYXRlIFRvcGljIFBhZ2VcIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgdGhpcy5yZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgICAgICBzY29wZSxcbiAgICAgICAgXCJTZWxlY3QgTm90ZXMgZm9yIFRvcGljIFBhZ2VcIixcbiAgICAgICk7XG4gICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnRvcGljUGFnZVNlcnZpY2UuY3JlYXRlVG9waWNQYWdlKHRvcGljLCBjb250ZXh0KTtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5ub3RlU2VydmljZS5jcmVhdGVHZW5lcmF0ZWROb3RlKFxuICAgICAgICByZXN1bHQubm90ZVRpdGxlLFxuICAgICAgICByZXN1bHQuY29udGVudCxcbiAgICAgICAgY29udGV4dC5zb3VyY2VMYWJlbCxcbiAgICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICAgKTtcblxuICAgICAgdGhpcy5jYWxsYmFja3Muc2V0TGFzdFN1bW1hcnlBdChuZXcgRGF0ZSgpKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnVwZGF0ZVN1bW1hcnkocmVzdWx0LmNvbnRlbnQpO1xuICAgICAgdGhpcy5jYWxsYmFja3MudXBkYXRlUmVzdWx0KFxuICAgICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgQUkgdG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YFxuICAgICAgICAgIDogYFRvcGljIHBhZ2Ugc2F2ZWQgdG8gJHtzYXZlZC5wYXRofWAsXG4gICAgICApO1xuICAgICAgYXdhaXQgdGhpcy5jYWxsYmFja3MucmVmcmVzaFN0YXR1cygpO1xuICAgICAgbmV3IE5vdGljZShgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCk7XG5cbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKHNhdmVkKTtcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgY3JlYXRlIHRoYXQgdG9waWMgcGFnZVwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU3ludGhlc2lzUmVzdWx0KFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICByZXN1bHQubm90ZVRpdGxlLFxuICAgICAgYnVpbGRTeW50aGVzaXNOb3RlQ29udGVudChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgY29udGV4dC5zb3VyY2VMYWJlbCxcbiAgICAgIGNvbnRleHQuc291cmNlUGF0aCxcbiAgICAgIGNvbnRleHQuc291cmNlUGF0aHMsXG4gICAgKTtcbiAgICByZXR1cm4gYFNhdmVkIGFydGlmYWN0IHRvICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3Py5maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuIGEgbWFya2Rvd24gbm90ZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBhZGRpdGlvbiA9IGJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KHJlc3VsdCwgY29udGV4dCk7XG4gICAgY29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG4gICAgY29uc3QgbGFzdExpbmUgPSBlZGl0b3IubGFzdExpbmUoKTtcbiAgICBjb25zdCBsYXN0TGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsYXN0TGluZSk7XG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSB7IGxpbmU6IGxhc3RMaW5lLCBjaDogbGFzdExpbmVUZXh0Lmxlbmd0aCB9O1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IGdldEFwcGVuZFNlcGFyYXRvcihlZGl0b3IuZ2V0VmFsdWUoKSk7XG4gICAgZWRpdG9yLnJlcGxhY2VSYW5nZShgJHtzZXBhcmF0b3J9JHthZGRpdGlvbn1cXG5gLCBlbmRQb3NpdGlvbik7XG4gICAgcmV0dXJuIGBJbnNlcnRlZCBzeW50aGVzaXMgaW50byAke3ZpZXcuZmlsZS5wYXRofWA7XG4gIH1cblxuICBnZXRBY3RpdmVTZWxlY3Rpb25UZXh0KCk6IHN0cmluZyB7XG4gICAgY29uc3QgYWN0aXZlVmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gYWN0aXZlVmlldz8uZWRpdG9yPy5nZXRTZWxlY3Rpb24oKT8udHJpbSgpID8/IFwiXCI7XG4gICAgcmV0dXJuIHNlbGVjdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgICBkZWZhdWx0VGVtcGxhdGU/OiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBkZWZhdWx0VGVtcGxhdGUgPz8gKGF3YWl0IHRoaXMucGlja1N5bnRoZXNpc1RlbXBsYXRlKG1vZGFsVGl0bGUpKTtcbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1blN5bnRoZXNpc0Zsb3coY29udGV4dCwgdGVtcGxhdGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHN5bnRoZXNpemUgdGhhdCBjb250ZXh0XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25Gb3JTY29wZShzY29wZTogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZm9sZGVyXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCksXG4gICAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEVudGlyZSBWYXVsdFwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZ3JvdXBcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkFib3V0U2VsZWN0ZWRHcm91cCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgIHNjb3BlOiBRdWVzdGlvblNjb3BlLFxuICAgIGdyb3VwUGlja2VyVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0IHwgbnVsbD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpO1xuICAgICAgY2FzZSBcImdyb3VwXCI6IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXMoZ3JvdXBQaWNrZXJUaXRsZSk7XG4gICAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKFwiU2VsZWN0IE5vdGVzXCIpO1xuICAgICAgaWYgKCFmaWxlcyB8fCAhZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKSxcbiAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgU2VsZWN0ZWQgTm90ZXNcIixcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc2VsZWN0IG5vdGVzIGZvciBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXModGl0bGU6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5hcHAudmF1bHRcbiAgICAgIC5nZXRNYXJrZG93bkZpbGVzKClcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc0JyYWluR2VuZXJhdGVkUGF0aChmaWxlLnBhdGgsIHNldHRpbmdzKSlcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG5cbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIG1hcmtkb3duIGZpbGVzIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IG5ldyBGaWxlR3JvdXBQaWNrZXJNb2RhbCh0aGlzLmFwcCwgZmlsZXMsIHtcbiAgICAgIHRpdGxlLFxuICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICByZXNvbHZlcjogKCkgPT4gUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PixcbiAgICBtb2RhbFRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcmVzb2x2ZXIoKTtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBtb2RhbFRpdGxlLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJBc2sgYSBxdWVzdGlvbiBhYm91dCB0aGlzIGNvbnRleHQuLi5cIixcbiAgICAgICAgc3VibWl0TGFiZWw6IFwiQXNrXCIsXG4gICAgICAgIG11bHRpbGluZTogdHJ1ZSxcbiAgICAgIH0pLm9wZW5Qcm9tcHQoKTtcbiAgICAgIGlmICghcXVlc3Rpb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXN0aW9uU2VydmljZS5hbnN3ZXJRdWVzdGlvbihxdWVzdGlvbiwgY29udGV4dCk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5zZXRMYXN0U3VtbWFyeUF0KG5ldyBEYXRlKCkpO1xuICAgICAgdGhpcy5jYWxsYmFja3MudXBkYXRlU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy51cGRhdGVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGBBSSBhbnN3ZXIgZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YFxuICAgICAgICAgIDogYExvY2FsIGFuc3dlciBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLnJlZnJlc2hTdGF0dXMoKTtcbiAgICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBjb250ZXh0LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGNhbkluc2VydDogdGhpcy5jYWxsYmFja3MuaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCksXG4gICAgICAgIG9uSW5zZXJ0OiBhc3luYyAoKSA9PiB0aGlzLmluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgICBvblNhdmU6IGFzeW5jICgpID0+IHRoaXMuc2F2ZVN5bnRoZXNpc1Jlc3VsdChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgICBvbkFjdGlvbkNvbXBsZXRlOiBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICAgICAgfSxcbiAgICAgIH0pLm9wZW4oKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhbnN3ZXIgdGhhdCBxdWVzdGlvblwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blN5bnRoZXNpc0Zsb3coXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICB0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3ludGhlc2lzU2VydmljZS5ydW4odGVtcGxhdGUsIGNvbnRleHQpO1xuICAgIHRoaXMuY2FsbGJhY2tzLnNldExhc3RTdW1tYXJ5QXQobmV3IERhdGUoKSk7XG4gICAgdGhpcy5jYWxsYmFja3MudXBkYXRlU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgdGhpcy5jYWxsYmFja3MudXBkYXRlUmVzdWx0KFxuICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICA/IGBBSSAke3Jlc3VsdC50aXRsZS50b0xvd2VyQ2FzZSgpfSBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXG4gICAgICAgIDogYExvY2FsICR7cmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCl9IGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWAsXG4gICAgKTtcbiAgICBhd2FpdCB0aGlzLmNhbGxiYWNrcy5yZWZyZXNoU3RhdHVzKCk7XG4gICAgbmV3IFN5bnRoZXNpc1Jlc3VsdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBjb250ZXh0LFxuICAgICAgcmVzdWx0LFxuICAgICAgY2FuSW5zZXJ0OiB0aGlzLmNhbGxiYWNrcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgIG9uSW5zZXJ0OiBhc3luYyAoKSA9PiB0aGlzLmluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgb25TYXZlOiBhc3luYyAoKSA9PiB0aGlzLnNhdmVTeW50aGVzaXNSZXN1bHQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIG9uQWN0aW9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICAgIH0sXG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwaWNrU3ludGhlc2lzVGVtcGxhdGUoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGw+IHtcbiAgICByZXR1cm4gYXdhaXQgbmV3IFRlbXBsYXRlUGlja2VyTW9kYWwodGhpcy5hcHAsIHsgdGl0bGUgfSkub3BlblBpY2tlcigpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbnRlcmZhY2UgRmlsZUdyb3VwUGlja2VyTW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEZpbGVSb3cge1xuICBmaWxlOiBURmlsZTtcbiAgY2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHJvdzogSFRNTEVsZW1lbnQ7XG59XG5cbmV4cG9ydCBjbGFzcyBGaWxlR3JvdXBQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBURmlsZVtdIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG4gIHByaXZhdGUgc2VhcmNoSW5wdXQhOiBIVE1MSW5wdXRFbGVtZW50O1xuICBwcml2YXRlIHJvd3M6IEZpbGVSb3dbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZmlsZXM6IFRGaWxlW10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBGaWxlR3JvdXBQaWNrZXJNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIG9uZSBvciBtb3JlIG5vdGVzIHRvIHVzZSBhcyBjb250ZXh0LlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5zZWFyY2hJbnB1dCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBwbGFjZWhvbGRlcjogXCJGaWx0ZXIgbm90ZXMuLi5cIixcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRoaXMuc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuZmlsdGVyUm93cyh0aGlzLnNlYXJjaElucHV0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3QgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWZpbGUtZ3JvdXAtbGlzdFwiLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIHRoaXMuZmlsZXMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3QuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1maWxlLWdyb3VwLXJvd1wiLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBjaGVja2JveCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJjaGVja2JveFwiLFxuICAgICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICB0ZXh0OiBmaWxlLnBhdGgsXG4gICAgICB9KTtcbiAgICAgIHRoaXMucm93cy5wdXNoKHsgZmlsZSwgY2hlY2tib3gsIHJvdyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiVXNlIFNlbGVjdGVkXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5yb3dzXG4gICAgICAgIC5maWx0ZXIoKHJvdykgPT4gcm93LmNoZWNrYm94LmNoZWNrZWQpXG4gICAgICAgIC5tYXAoKHJvdykgPT4gcm93LmZpbGUpO1xuICAgICAgaWYgKCFzZWxlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlNlbGVjdCBhdCBsZWFzdCBvbmUgbm90ZVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5maW5pc2goc2VsZWN0ZWQpO1xuICAgIH0pO1xuXG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNhbmNlbFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaWx0ZXJSb3dzKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBxdWVyeSA9IHZhbHVlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykge1xuICAgICAgY29uc3QgbWF0Y2ggPSAhcXVlcnkgfHwgcm93LmZpbGUucGF0aC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KTtcbiAgICAgIHJvdy5yb3cuc3R5bGUuZGlzcGxheSA9IG1hdGNoID8gXCJcIiA6IFwibm9uZVwiO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKGZpbGVzOiBURmlsZVtdIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUoZmlsZXMpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgdHJpbVRyYWlsaW5nTmV3bGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5pbnRlcmZhY2UgUHJvbXB0TW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgcGxhY2Vob2xkZXI/OiBzdHJpbmc7XG4gIHN1Ym1pdExhYmVsPzogc3RyaW5nO1xuICBtdWx0aWxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUHJvbXB0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFByb21wdE1vZGFsT3B0aW9ucykge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUHJvbXB0KCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUpIHtcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgPz8gXCJcIixcbiAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5KSkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5wdXRFbCA9IHRleHRhcmVhO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSBpbnB1dDtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwuZm9jdXMoKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQodGhpcy5vcHRpb25zLnN1Ym1pdExhYmVsID8/IFwiU3VibWl0XCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3VibWl0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gdHJpbVRyYWlsaW5nTmV3bGluZXModGhpcy5pbnB1dEVsLnZhbHVlKS50cmltKCk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZmluaXNoKHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aXRsZVRleHQ6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGJvZHlUZXh0OiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLnRpdGxlVGV4dCB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogdGhpcy5ib2R5VGV4dCxcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgUXVlc3Rpb25TY29wZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgdHlwZSB7IFF1ZXN0aW9uU2NvcGUgfTtcblxuaW50ZXJmYWNlIFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUXVlc3Rpb25TY29wZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFF1ZXN0aW9uU2NvcGUgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8UXVlc3Rpb25TY29wZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIHRoZSBzY29wZSBCcmFpbiBzaG91bGQgdXNlIGZvciB0aGlzIHJlcXVlc3QuXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBOb3RlXCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwibm90ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiU2VsZWN0ZWQgTm90ZXNcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJncm91cFwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBGb2xkZXJcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJmb2xkZXJcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkVudGlyZSBWYXVsdFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInZhdWx0XCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHNjb3BlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUoc2NvcGUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dExvY2F0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRleHQtZm9ybWF0XCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5pbnRlcmZhY2UgU3ludGhlc2lzUmVzdWx0TW9kYWxPcHRpb25zIHtcbiAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dDtcbiAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQ7XG4gIGNhbkluc2VydDogYm9vbGVhbjtcbiAgb25JbnNlcnQ6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgb25TYXZlOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIG9uQWN0aW9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG4gIHByaXZhdGUgYnV0dG9uczogSFRNTEJ1dHRvbkVsZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogU3ludGhlc2lzUmVzdWx0TW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogYEJyYWluICR7dGhpcy5vcHRpb25zLnJlc3VsdC50aXRsZX1gIH0pO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQWN0aW9uOiAke3RoaXMub3B0aW9ucy5yZXN1bHQuYWN0aW9ufWAsXG4gICAgfSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXN1bHQucHJvbXB0VGV4dCkge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IGBQcm9tcHQ6ICR7dGhpcy5vcHRpb25zLnJlc3VsdC5wcm9tcHRUZXh0fWAsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQ29udGV4dDogJHtmb3JtYXRDb250ZXh0TG9jYXRpb24odGhpcy5vcHRpb25zLmNvbnRleHQpfWAsXG4gICAgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiB0aGlzLm9wdGlvbnMuY29udGV4dC50cnVuY2F0ZWRcbiAgICAgICAgPyBgQ29udGV4dCB0cnVuY2F0ZWQgdG8gJHt0aGlzLm9wdGlvbnMuY29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7dGhpcy5vcHRpb25zLmNvbnRleHQub3JpZ2luYWxMZW5ndGh9LmBcbiAgICAgICAgOiBgQ29udGV4dCBsZW5ndGg6ICR7dGhpcy5vcHRpb25zLmNvbnRleHQub3JpZ2luYWxMZW5ndGh9IGNoYXJhY3RlcnMuYCxcbiAgICB9KTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiB0aGlzLm9wdGlvbnMucmVzdWx0LmNvbnRlbnQsXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNhbkluc2VydCkge1xuICAgICAgLy8gQnV0dG9ucyBhcmUgcmVuZGVyZWQgYmVsb3cgYWZ0ZXIgb3B0aW9uYWwgZ3VpZGFuY2UgdGV4dC5cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgdG8gaW5zZXJ0IHRoaXMgYXJ0aWZhY3QgdGhlcmUsIG9yIHNhdmUgaXQgdG8gQnJhaW4gbm90ZXMuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICB0aGlzLmJ1dHRvbnMgPSBbXTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FuSW5zZXJ0KSB7XG4gICAgICB0aGlzLmJ1dHRvbnMucHVzaCh0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIkluc2VydCBpbnRvIGN1cnJlbnQgbm90ZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5ydW5BY3Rpb24oKCkgPT4gdGhpcy5vcHRpb25zLm9uSW5zZXJ0KCkpO1xuICAgICAgfSwgdHJ1ZSkpO1xuICAgIH1cblxuICAgIHRoaXMuYnV0dG9ucy5wdXNoKFxuICAgICAgdGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJTYXZlIHRvIEJyYWluIG5vdGVzXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJ1bkFjdGlvbigoKSA9PiB0aGlzLm9wdGlvbnMub25TYXZlKCkpO1xuICAgICAgfSksXG4gICAgICB0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIkNsb3NlXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQnV0dG9uKFxuICAgIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gICAgY3RhID0gZmFsc2UsXG4gICk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidXR0b24gPSBwYXJlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBjdGEgPyBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiIDogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQsXG4gICAgfSk7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5BY3Rpb24oYWN0aW9uOiAoKSA9PiBQcm9taXNlPHN0cmluZz4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy53b3JraW5nID0gdHJ1ZTtcbiAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZCh0cnVlKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgYWN0aW9uKCk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25BY3Rpb25Db21wbGV0ZShtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCB1cGRhdGUgdGhlIHN5bnRoZXNpcyByZXN1bHRcIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXRCdXR0b25zRGlzYWJsZWQoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0QnV0dG9uc0Rpc2FibGVkKGRpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBidXR0b24gb2YgdGhpcy5idXR0b25zKSB7XG4gICAgICBidXR0b24uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqXG4gKiBDZW50cmFsaXplZCBlcnJvciBoYW5kbGluZyB1dGlsaXR5XG4gKiBTdGFuZGFyZGl6ZXMgZXJyb3IgcmVwb3J0aW5nIGFjcm9zcyB0aGUgcGx1Z2luXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvcihlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZGVmYXVsdE1lc3NhZ2U7XG4gIG5ldyBOb3RpY2UobWVzc2FnZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3JBbmRSZXRocm93KGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogbmV2ZXIge1xuICBzaG93RXJyb3IoZXJyb3IsIGRlZmF1bHRNZXNzYWdlKTtcbiAgdGhyb3cgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKGRlZmF1bHRNZXNzYWdlKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy10ZW1wbGF0ZVwiO1xuaW1wb3J0IHR5cGUgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgdHlwZSB7IFN5bnRoZXNpc1RlbXBsYXRlIH07XG5cbmludGVyZmFjZSBUZW1wbGF0ZVBpY2tlck9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogVGVtcGxhdGVQaWNrZXJPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgaG93IEJyYWluIHNob3VsZCBzeW50aGVzaXplIHRoaXMgY29udGV4dC5cIixcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcInN1bW1hcml6ZVwiKSkuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJzdW1tYXJpemVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC10YXNrc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LXRhc2tzXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImV4dHJhY3QtZGVjaXNpb25zXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3QtZGVjaXNpb25zXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImRyYWZ0LXByb2plY3QtYnJpZWZcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZHJhZnQtcHJvamVjdC1icmllZlwiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaCh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZSh0ZW1wbGF0ZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld1NlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LXNlcnZpY2VcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRJbmJveFJldmlld0NvbXBsZXRpb25NZXNzYWdlIH0gZnJvbSBcIi4uL3V0aWxzL2luYm94LXJldmlld1wiO1xuXG50eXBlIFJldmlld0FjdGlvbiA9IFwia2VlcFwiIHwgXCJ0YXNrXCIgfCBcImpvdXJuYWxcIiB8IFwibm90ZVwiIHwgXCJza2lwXCI7XG5cbmV4cG9ydCBjbGFzcyBJbmJveFJldmlld01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGN1cnJlbnRJbmRleCA9IDA7XG4gIHByaXZhdGUga2VwdENvdW50ID0gMDtcbiAgcHJpdmF0ZSByZWFkb25seSBoYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5hbHRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGlmICh0YXJnZXQgJiYgKHRhcmdldC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgdGFyZ2V0LnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBrZXlUb0FjdGlvbihldmVudC5rZXkpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB2b2lkIHRoaXMuaGFuZGxlQWN0aW9uKGFjdGlvbik7XG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBlbnRyaWVzOiBJbmJveEVudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdTZXJ2aWNlOiBSZXZpZXdTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb25BY3Rpb25Db21wbGV0ZT86IChtZXNzYWdlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvY2VzcyBJbmJveFwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIk5vIGluYm94IGVudHJpZXMgZm91bmQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIHRleHQ6IGBFbnRyeSAke3RoaXMuY3VycmVudEluZGV4ICsgMX0gb2YgJHt0aGlzLmVudHJpZXMubGVuZ3RofWAsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBlbnRyeS5oZWFkaW5nIHx8IFwiVW50aXRsZWQgZW50cnlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgZW50cnkpXCIsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIGFuIGFjdGlvbiBmb3IgdGhpcyBlbnRyeS4gU2hvcnRjdXRzOiBrIGtlZXAsIHQgdGFzaywgaiBqb3VybmFsLCBuIG5vdGUsIHMgc2tpcC5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvblJvdyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiS2VlcCBpbiBpbmJveFwiLCBcImtlZXBcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIkNvbnZlcnQgdG8gdGFza1wiLCBcInRhc2tcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIkFwcGVuZCB0byBqb3VybmFsXCIsIFwiam91cm5hbFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiUHJvbW90ZSB0byBub3RlXCIsIFwibm90ZVwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiU2tpcFwiLCBcInNraXBcIik7XG4gIH1cblxuICBwcml2YXRlIGFkZEJ1dHRvbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nLCBhY3Rpb246IFJldmlld0FjdGlvbik6IHZvaWQge1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IGFjdGlvbiA9PT0gXCJub3RlXCIgPyBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiIDogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IGxhYmVsLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuaGFuZGxlQWN0aW9uKGFjdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZUFjdGlvbihhY3Rpb246IFJldmlld0FjdGlvbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZXNzYWdlID0gXCJcIjtcbiAgICAgIGlmIChhY3Rpb24gPT09IFwidGFza1wiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UucHJvbW90ZVRvVGFzayhlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5hcHBlbmRUb0pvdXJuYWwoZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwibm90ZVwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UucHJvbW90ZVRvTm90ZShlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJrZWVwXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5rZWVwRW50cnkoZW50cnkpO1xuICAgICAgICB0aGlzLmtlcHRDb3VudCArPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5za2lwRW50cnkoZW50cnkpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5vbkFjdGlvbkNvbXBsZXRlKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vbkFjdGlvbkNvbXBsZXRlKG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcHJvY2VzcyByZXZpZXcgYWN0aW9uXCIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCArPSAxO1xuXG4gICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXggPj0gdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBuZXcgTm90aWNlKGdldEluYm94UmV2aWV3Q29tcGxldGlvbk1lc3NhZ2UodGhpcy5rZXB0Q291bnQpKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcHJvY2VzcyBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24ga2V5VG9BY3Rpb24oa2V5OiBzdHJpbmcpOiBSZXZpZXdBY3Rpb24gfCBudWxsIHtcbiAgc3dpdGNoIChrZXkudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgXCJrXCI6XG4gICAgICByZXR1cm4gXCJrZWVwXCI7XG4gICAgY2FzZSBcInRcIjpcbiAgICAgIHJldHVybiBcInRhc2tcIjtcbiAgICBjYXNlIFwialwiOlxuICAgICAgcmV0dXJuIFwiam91cm5hbFwiO1xuICAgIGNhc2UgXCJuXCI6XG4gICAgICByZXR1cm4gXCJub3RlXCI7XG4gICAgY2FzZSBcInNcIjpcbiAgICAgIHJldHVybiBcInNraXBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZ2V0SW5ib3hSZXZpZXdDb21wbGV0aW9uTWVzc2FnZShrZXB0Q291bnQ6IG51bWJlcik6IHN0cmluZyB7XG4gIGlmIChrZXB0Q291bnQgPD0gMCkge1xuICAgIHJldHVybiBcIkluYm94IHJldmlldyBjb21wbGV0ZVwiO1xuICB9XG5cbiAgaWYgKGtlcHRDb3VudCA9PT0gMSkge1xuICAgIHJldHVybiBcIlJldmlldyBwYXNzIGNvbXBsZXRlOyAxIGVudHJ5IHJlbWFpbnMgaW4gaW5ib3guXCI7XG4gIH1cblxuICByZXR1cm4gYFJldmlldyBwYXNzIGNvbXBsZXRlOyAke2tlcHRDb3VudH0gZW50cmllcyByZW1haW4gaW4gaW5ib3guYDtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld0hpc3RvcnlNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBCcmFpblBsdWdpbixcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUmV2aWV3IEhpc3RvcnlcIiB9KTtcblxuICAgIGlmICghdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gcmV2aWV3IGxvZ3MgZm91bmQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIk9wZW4gYSBsb2cgdG8gaW5zcGVjdCBpdCwgb3IgcmUtb3BlbiBhbiBpbmJveCBpdGVtIGlmIGl0IHdhcyBtYXJrZWQgaW5jb3JyZWN0bHkuXCIsXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuZW50cmllcykge1xuICAgICAgY29uc3Qgcm93ID0gY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7IGNsczogXCJicmFpbi1zZWN0aW9uXCIgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IGVudHJ5LmhlYWRpbmcgfHwgXCJVbnRpdGxlZCBpdGVtXCIgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogYCR7ZW50cnkudGltZXN0YW1wfSBcdTIwMjIgJHtlbnRyeS5hY3Rpb259YCxcbiAgICAgIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgICB0ZXh0OiBlbnRyeS5wcmV2aWV3IHx8IFwiKGVtcHR5IHByZXZpZXcpXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYnV0dG9ucyA9IHJvdy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICB0ZXh0OiBcIk9wZW4gbG9nXCIsXG4gICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlbkxvZyhlbnRyeS5zb3VyY2VQYXRoKTtcbiAgICAgIH0pO1xuICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgdGV4dDogXCJSZS1vcGVuXCIsXG4gICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucmVvcGVuRW50cnkoZW50cnkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuTG9nKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGFic3RyYWN0RmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShhYnN0cmFjdEZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gcmV2aWV3IGxvZ1wiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGFic3RyYWN0RmlsZSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlb3BlbkVudHJ5KGVudHJ5OiBSZXZpZXdMb2dFbnRyeSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgdGhpcy5wbHVnaW4ucmVvcGVuUmV2aWV3RW50cnkoZW50cnkpO1xuICAgICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCByZS1vcGVuIGluYm94IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgSXRlbVZpZXcsIE5vdGljZSwgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuXG5pbnRlcmZhY2UgQXBwV2l0aFNldHRpbmdzIGV4dGVuZHMgQXBwIHtcbiAgc2V0dGluZzoge1xuICAgIG9wZW4oKTogdm9pZDtcbiAgICBvcGVuVGFiQnlJZChpZDogc3RyaW5nKTogdm9pZDtcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IEJSQUlOX1ZJRVdfVFlQRSA9IFwiYnJhaW4tc2lkZWJhci12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpblNpZGViYXJWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBwcml2YXRlIHJlc3VsdEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3VtbWFyeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgaW5ib3hDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgdGFza0NvdW50RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSByZXZpZXdIaXN0b3J5RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBhaVN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3VtbWFyeVN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgY2FwdHVyZUFzc2lzdFNlY3Rpb25FbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGlzTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGNvbGxhcHNlZFNlY3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHByaXZhdGUga2V5Ym9hcmRIYW5kbGVyPzogKGV2dDogS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSQUlOX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQnJhaW5cIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpblwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1zaWRlYmFyXCIpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNhcHR1cmUgaWRlYXMsIHN5bnRoZXNpemUgZXhwbGljaXQgY29udGV4dCwgYW5kIHNhdmUgZHVyYWJsZSBtYXJrZG93biBhcnRpZmFjdHMuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmxvYWRDb2xsYXBzZWRTdGF0ZSgpO1xuICAgIHRoaXMuY3JlYXRlQ2FwdHVyZVNlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVRvcGljUGFnZVNlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVN5bnRoZXNpc1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZUFza1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVJldmlld1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVBc3Npc3RTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTdGF0dXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVPdXRwdXRTZWN0aW9uKCk7XG4gICAgdGhpcy5yZWdpc3RlcktleWJvYXJkU2hvcnRjdXRzKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmtleWJvYXJkSGFuZGxlcikge1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5rZXlib2FyZEhhbmRsZXIpO1xuICAgICAgdGhpcy5rZXlib2FyZEhhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHNldExhc3RSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5yZXN1bHRFbC5zZXRUZXh0KHRleHQpO1xuICB9XG5cbiAgc2V0TGFzdFN1bW1hcnkodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zdW1tYXJ5RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgW2luYm94Q291bnQsIHRhc2tDb3VudCwgcmV2aWV3Q291bnRdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5wbHVnaW4uZ2V0SW5ib3hDb3VudCgpLFxuICAgICAgdGhpcy5wbHVnaW4uZ2V0T3BlblRhc2tDb3VudCgpLFxuICAgICAgdGhpcy5wbHVnaW4uZ2V0UmV2aWV3SGlzdG9yeUNvdW50KCksXG4gICAgXSk7XG4gICAgaWYgKHRoaXMuaW5ib3hDb3VudEVsKSB7XG4gICAgICB0aGlzLmluYm94Q291bnRFbC5zZXRUZXh0KGAke2luYm94Q291bnR9IHVucmV2aWV3ZWQgZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy50YXNrQ291bnRFbCkge1xuICAgICAgdGhpcy50YXNrQ291bnRFbC5zZXRUZXh0KGAke3Rhc2tDb3VudH0gb3BlbiB0YXNrc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5yZXZpZXdIaXN0b3J5RWwpIHtcbiAgICAgIHRoaXMucmV2aWV3SGlzdG9yeUVsLnNldFRleHQoYFJldmlldyBoaXN0b3J5OiAke3Jldmlld0NvdW50fSBlbnRyaWVzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmFpU3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5lbXB0eSgpO1xuICAgICAgY29uc3Qgc3RhdHVzVGV4dCA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEFpU3RhdHVzVGV4dCgpO1xuICAgICAgdGhpcy5haVN0YXR1c0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGBBSTogJHtzdGF0dXNUZXh0fSBgIH0pO1xuXG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICB0aGlzLmFpU3RhdHVzRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1zbWFsbFwiLFxuICAgICAgICB0ZXh0OiBhaVN0YXR1cy5jb25maWd1cmVkID8gXCJNYW5hZ2VcIiA6IFwiQ29ubmVjdFwiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHAgYXMgQXBwV2l0aFNldHRpbmdzO1xuICAgICAgICBhcHAuc2V0dGluZy5vcGVuKCk7XG4gICAgICAgIGFwcC5zZXR0aW5nLm9wZW5UYWJCeUlkKHRoaXMucGx1Z2luLm1hbmlmZXN0LmlkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdW1tYXJ5U3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuc3VtbWFyeVN0YXR1c0VsLnNldFRleHQodGhpcy5wbHVnaW4uZ2V0TGFzdFN1bW1hcnlMYWJlbCgpKTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVDYXB0dXJlQXNzaXN0VmlzaWJpbGl0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRMb2FkaW5nKGxvYWRpbmc6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmlzTG9hZGluZyA9IGxvYWRpbmc7XG4gICAgY29uc3QgYnV0dG9ucyA9IEFycmF5LmZyb20odGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvbi5icmFpbi1idXR0b25cIikpO1xuICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGJ1dHRvbnMpIHtcbiAgICAgIChidXR0b24gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5wdXRFbCkge1xuICAgICAgdGhpcy5pbnB1dEVsLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyS2V5Ym9hcmRTaG9ydGN1dHMoKTogdm9pZCB7XG4gICAgdGhpcy5rZXlib2FyZEhhbmRsZXIgPSAoZXZ0OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZ0Lm1ldGFLZXkgfHwgZXZ0LmN0cmxLZXkgfHwgZXZ0LmFsdEtleSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc1RleHRJbnB1dEFjdGl2ZSgpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChldnQua2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzTm90ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNUYXNrKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJqXCI6XG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc0pvdXJuYWwoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJDYXB0dXJlIGNsZWFyZWRcIik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmtleWJvYXJkSGFuZGxlcik7XG4gIH1cblxuICBwcml2YXRlIGlzVGV4dElucHV0QWN0aXZlKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIHJldHVybiB0YXJnZXQgIT09IG51bGwgJiYgKHRhcmdldC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgdGFyZ2V0LnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIik7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZVNlY3Rpb24oc2VjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoc2VjdGlvbklkKSkge1xuICAgICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5kZWxldGUoc2VjdGlvbklkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5hZGQoc2VjdGlvbklkKTtcbiAgICB9XG4gICAgdGhpcy5zYXZlQ29sbGFwc2VkU3RhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZENvbGxhcHNlZFN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMgPSBuZXcgU2V0KHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIHNhdmVDb2xsYXBzZWRTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMgPSBBcnJheS5mcm9tKHRoaXMuY29sbGFwc2VkU2VjdGlvbnMpO1xuICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICBpZDogc3RyaW5nLFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBjb250ZW50Q3JlYXRvcjogKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpID0+IHZvaWQsXG4gICk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb24taGVhZGVyXCIgfSk7XG4gICAgY29uc3QgdG9nZ2xlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jb2xsYXBzZS10b2dnbGVcIixcbiAgICAgIHRleHQ6IHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IFwiXHUyNUI2XCIgOiBcIlx1MjVCQ1wiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBcImFyaWEtbGFiZWxcIjogdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gYEV4cGFuZCAke3RpdGxlfWAgOiBgQ29sbGFwc2UgJHt0aXRsZX1gLFxuICAgICAgICBcImFyaWEtZXhwYW5kZWRcIjogKCF0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkpLnRvU3RyaW5nKCksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogdGl0bGUgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IGRlc2NyaXB0aW9uIH0pO1xuXG4gICAgdG9nZ2xlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnRvZ2dsZVNlY3Rpb24oaWQpO1xuICAgICAgY29uc3QgY29udGVudEVsID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLXNlY3Rpb24tY29udGVudFwiKTtcbiAgICAgIGlmIChjb250ZW50RWwpIHtcbiAgICAgICAgY29udGVudEVsLnRvZ2dsZUF0dHJpYnV0ZShcImhpZGRlblwiKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldFRleHQodGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gXCJcdTI1QjZcIiA6IFwiXHUyNUJDXCIpO1xuICAgICAgICB0b2dnbGVCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBgRXhwYW5kICR7dGl0bGV9YCA6IGBDb2xsYXBzZSAke3RpdGxlfWApO1xuICAgICAgICB0b2dnbGVCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCAoIXRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSkudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb250ZW50ID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvbi1jb250ZW50XCIsXG4gICAgICBhdHRyOiB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyB7IGhpZGRlbjogXCJ0cnVlXCIgfSA6IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgICBjb250ZW50Q3JlYXRvcihjb250ZW50KTtcbiAgICByZXR1cm4gc2VjdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ2FwdHVyZVNlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcImNhcHR1cmVcIixcbiAgICAgIFwiUXVpY2sgQ2FwdHVyZVwiLFxuICAgICAgXCJDYXB0dXJlIHJvdWdoIGlucHV0IGludG8gdGhlIHZhdWx0IGJlZm9yZSByZXZpZXcgYW5kIHN5bnRoZXNpcy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgdGhpcy5pbnB1dEVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1jYXB0dXJlLWlucHV0XCIsXG4gICAgICAgICAgYXR0cjoge1xuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiVHlwZSBhIG5vdGUsIHRhc2ssIG9yIGpvdXJuYWwgZW50cnkuLi5cIixcbiAgICAgICAgICAgIHJvd3M6IFwiOFwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDYXB0dXJlIE5vdGUgKG4pXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc05vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNhcHR1cmUgVGFzayAodClcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzVGFzaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2FwdHVyZSBKb3VybmFsIChqKVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNKb3VybmFsKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDbGVhciAoYylcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJDYXB0dXJlIGNsZWFyZWRcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJzeW50aGVzaXNcIixcbiAgICAgIFwiU3ludGhlc2l6ZVwiLFxuICAgICAgXCJUdXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBzdW1tYXJpZXMsIGNsZWFuIG5vdGVzLCB0YXNrcywgYW5kIGJyaWVmcy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgICB0ZXh0OiBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0Q3VycmVudE5vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlLi4uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiRXh0cmFjdCBUYXNrcyBGcm9tIFNlbGVjdGlvblwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRTZWxlY3Rpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkRyYWZ0IEJyaWVmIEZyb20gRm9sZGVyXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnRGb2xkZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNsZWFuIE5vdGUgRnJvbSBSZWNlbnQgRmlsZXNcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFza0Fib3V0UmVjZW50RmlsZXMoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJTeW50aGVzaXplIE5vdGVzLi4uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zeW50aGVzaXplTm90ZXMoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVBc2tTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJhc2tcIixcbiAgICAgIFwiQXNrIEJyYWluXCIsXG4gICAgICBcIkFzayBhIHF1ZXN0aW9uIGFib3V0IHRoZSBjdXJyZW50IG5vdGUsIGEgc2VsZWN0ZWQgZ3JvdXAsIGEgZm9sZGVyLCBvciB0aGUgd2hvbGUgdmF1bHQuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgICAgdGV4dDogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza1F1ZXN0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQWJvdXQgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Rm9sZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVSZXZpZXdTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJyZXZpZXdcIixcbiAgICAgIFwiUmV2aWV3XCIsXG4gICAgICBcIlByb2Nlc3MgY2FwdHVyZWQgaW5wdXQgYW5kIGtlZXAgdGhlIGRhaWx5IGxvb3AgbW92aW5nLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICAgIHRleHQ6IFwiUmV2aWV3IEluYm94XCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIk9wZW4gUmV2aWV3IEhpc3RvcnlcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJ0b3BpY1wiLFxuICAgICAgXCJUb3BpYyBQYWdlc1wiLFxuICAgICAgXCJCcmFpbidzIGZsYWdzaGlwIGZsb3c6IHR1cm4gZXhwbGljaXQgY29udGV4dCBpbnRvIGEgZHVyYWJsZSBtYXJrZG93biBwYWdlIHlvdSBjYW4ga2VlcCBidWlsZGluZy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5jcmVhdGVUb3BpY1BhZ2UoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJUb3BpYyBQYWdlIEZyb20gQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZShcIm5vdGVcIik7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ2FwdHVyZUFzc2lzdFNlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jYXB0dXJlQXNzaXN0U2VjdGlvbkVsID0gdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcImNhcHR1cmUtYXNzaXN0XCIsXG4gICAgICBcIkNhcHR1cmUgQXNzaXN0XCIsXG4gICAgICBcIlVzZSBBSSBvbmx5IHRvIGNsYXNzaWZ5IGZyZXNoIGNhcHR1cmUgaW50byBub3RlLCB0YXNrLCBvciBqb3VybmFsLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQXV0by1yb3V0ZSBDYXB0dXJlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLmF1dG9Sb3V0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgICB0aGlzLmNhcHR1cmVBc3Npc3RTZWN0aW9uRWwudG9nZ2xlQXR0cmlidXRlKFwiaGlkZGVuXCIsICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDYXB0dXJlQXNzaXN0VmlzaWJpbGl0eSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jYXB0dXJlQXNzaXN0U2VjdGlvbkVsKSB7XG4gICAgICB0aGlzLmNhcHR1cmVBc3Npc3RTZWN0aW9uRWwudG9nZ2xlQXR0cmlidXRlKFwiaGlkZGVuXCIsICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdHVzU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwic3RhdHVzXCIsXG4gICAgICBcIlN0YXR1c1wiLFxuICAgICAgXCJDdXJyZW50IGluYm94LCB0YXNrLCBhbmQgc3ludGhlc2lzIHN0YXR1cy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgaW5ib3hSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJJbmJveDogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLmluYm94Q291bnRFbCA9IGluYm94Um93O1xuXG4gICAgICAgIGNvbnN0IHRhc2tSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJUYXNrczogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLnRhc2tDb3VudEVsID0gdGFza1JvdztcblxuICAgICAgICBjb25zdCByZXZpZXdSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc3RhdHVzLXJvd1wiIH0pO1xuICAgICAgICB0aGlzLnJldmlld0hpc3RvcnlFbCA9IHJldmlld1Jvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIlJldmlldyBoaXN0b3J5OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHJldmlld1Jvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgICAgICB0ZXh0OiBcIk9wZW5cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFpUm93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiQUk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5haVN0YXR1c0VsID0gYWlSb3c7XG5cbiAgICAgICAgY29uc3Qgc3VtbWFyeVJvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkxhc3QgYXJ0aWZhY3Q6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5zdW1tYXJ5U3RhdHVzRWwgPSBzdW1tYXJ5Um93O1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJvdXRwdXRcIixcbiAgICAgIFwiQXJ0aWZhY3RzXCIsXG4gICAgICBcIlJlY2VudCBzeW50aGVzaXMgcmVzdWx0cyBhbmQgZ2VuZXJhdGVkIGFydGlmYWN0cy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkxhc3QgUmVzdWx0XCIgfSk7XG4gICAgICAgIHRoaXMucmVzdWx0RWwgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1vdXRwdXRcIixcbiAgICAgICAgICB0ZXh0OiBcIk5vIHJlc3VsdCB5ZXQuXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IEFydGlmYWN0XCIgfSk7XG4gICAgICAgIHRoaXMuc3VtbWFyeUVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tb3V0cHV0XCIsXG4gICAgICAgICAgdGV4dDogXCJObyBhcnRpZmFjdCBnZW5lcmF0ZWQgeWV0LlwiLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzTm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVOb3RlKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzVGFzaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSBqb3VybmFsIGVudHJ5XCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXV0b1JvdXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJvdXRlVGV4dCh0ZXh0KTtcbiAgICAgIGlmICghcm91dGUpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGNvdWxkIG5vdCBjbGFzc2lmeSB0aGF0IGVudHJ5XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocm91dGUgPT09IFwibm90ZVwiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZU5vdGUodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKHJvdXRlID09PSBcInRhc2tcIikge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIGpvdXJuYWwgZW50cnlcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhdXRvLXJvdXRlIGNhcHR1cmVcIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ2FwdHVyZShcbiAgICBhY3Rpb246ICh0ZXh0OiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPixcbiAgICBmYWlsdXJlTWVzc2FnZTogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odGV4dCk7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgZmFpbHVyZU1lc3NhZ2UpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBRdWVzdGlvblNjb3BlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmludGVyZmFjZSBCcmFpbkNvbW1hbmRIb3N0IHtcbiAgYWRkQ29tbWFuZDogUGx1Z2luW1wiYWRkQ29tbWFuZFwiXTtcbiAgY2FwdHVyZUZyb21Nb2RhbChcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHN1Ym1pdExhYmVsOiBzdHJpbmcsXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgbXVsdGlsaW5lPzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPjtcbiAgbm90ZVNlcnZpY2U6IHsgYXBwZW5kTm90ZSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IH07XG4gIHRhc2tTZXJ2aWNlOiB7IGFwcGVuZFRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB9O1xuICBqb3VybmFsU2VydmljZTogeyBhcHBlbmRFbnRyeSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IH07XG4gIHByb2Nlc3NJbmJveCgpOiBQcm9taXNlPHZvaWQ+O1xuICBvcGVuUmV2aWV3SGlzdG9yeSgpOiBQcm9taXNlPHZvaWQ+O1xuICBnZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3cobG9va2JhY2tEYXlzPzogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8dW5rbm93bj47XG4gIGFkZFRhc2tGcm9tU2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD47XG4gIG9wZW5Ub2RheXNKb3VybmFsKCk6IFByb21pc2U8dm9pZD47XG4gIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD47XG4gIHN5bnRoZXNpemVOb3RlcygpOiBQcm9taXNlPHZvaWQ+O1xuICBhc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk6IFByb21pc2U8dm9pZD47XG4gIGFza1F1ZXN0aW9uKCk6IFByb21pc2U8dm9pZD47XG4gIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+O1xuICBjcmVhdGVUb3BpY1BhZ2UoKTogUHJvbWlzZTx2b2lkPjtcbiAgY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoc2NvcGU/OiBRdWVzdGlvblNjb3BlKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBCcmFpbkNvbW1hbmRIb3N0KTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjYXB0dXJlLW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIE5vdGVcIiwgXCJDYXB0dXJlXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgICAgIHJldHVybiBgQ2FwdHVyZWQgbm90ZSBpbiAke3NhdmVkLnBhdGh9YDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFza1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFza1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcIkNhcHR1cmUgVGFza1wiLCBcIkNhcHR1cmVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4udGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC1qb3VybmFsLWVudHJ5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFxuICAgICAgICBcIkNhcHR1cmUgSm91cm5hbFwiLFxuICAgICAgICBcIkNhcHR1cmVcIixcbiAgICAgICAgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICAgICAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJwcm9jZXNzLWluYm94XCIsXG4gICAgbmFtZTogXCJCcmFpbjogUmV2aWV3IEluYm94XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwicmV2aWV3LWhpc3RvcnlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzdW1tYXJpemUtdG9kYXlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb2RheSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coMSwgXCJUb2RheVwiKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3VtbWFyaXplLXRoaXMtd2Vla1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFdlZWtseSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coNywgXCJXZWVrXCIpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFzay1mcm9tLXNlbGVjdGlvblwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFzayBGcm9tIFNlbGVjdGlvblwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYWRkVGFza0Zyb21TZWxlY3Rpb24oKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi10b2RheXMtam91cm5hbFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVG9kYXkncyBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuVG9kYXlzSm91cm5hbCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXNpZGViYXJcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIEJyYWluIFNpZGViYXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5bnRoZXNpemUtbm90ZXNcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIE5vdGVzXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5zeW50aGVzaXplTm90ZXMoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3ludGhlc2l6ZS1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhc2stcXVlc3Rpb25cIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza1F1ZXN0aW9uKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFzay1xdWVzdGlvbi1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2VcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jcmVhdGVUb3BpY1BhZ2UoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2UtY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjog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QU07QUFDeEQsV0FBTyxHQUFHLFFBQVEsR0FBRyxLQUFLO0FBQUEsRUFDNUI7QUFBQSxFQUVRLHdCQUFpQztBQTNiM0M7QUE0YkksV0FBTyxTQUFRLFVBQUssSUFBSSxVQUFVLG9CQUFvQiw4QkFBWSxNQUFuRCxtQkFBc0QsSUFBSTtBQUFBLEVBQzNFO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpc0Vub2VudEVycm9yIiwgImdldE5vZGVSZXF1aXJlIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
