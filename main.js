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
var READ_BATCH_SIZE = 10;
async function joinRecentFilesForSummary(vaultService, files, maxChars) {
  const parts = [];
  let total = 0;
  for (let i = 0; i < files.length; i += READ_BATCH_SIZE) {
    const batch = files.slice(i, i + READ_BATCH_SIZE);
    const texts = await Promise.all(
      batch.map((file) => vaultService.readText(file.path).catch((error) => {
        console.error(error);
        return "";
      }))
    );
    for (let j = 0; j < batch.length; j += 1) {
      const file = batch[j];
      const content = texts[j];
      const trimmed = content.trim();
      if (!trimmed) {
        continue;
      }
      const block = [`--- ${file.path}`, trimmed].join("\n");
      const separatorOverhead = parts.length > 0 ? 2 : 0;
      if (total + separatorOverhead + block.length > maxChars) {
        const remaining = Math.max(0, maxChars - total - separatorOverhead);
        if (remaining > 0) {
          parts.push(block.slice(0, remaining));
        }
        return parts.join("\n\n");
      }
      parts.push(block);
      total += separatorOverhead + block.length;
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
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder, settings.notesFolder],
      excludePaths: [settings.inboxFile, settings.tasksFile],
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
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder, settings.notesFolder],
      excludePaths: [settings.inboxFile, settings.tasksFile],
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
      excludeFolders: [settings.summariesFolder, settings.reviewsFolder, settings.notesFolder],
      excludePaths: [settings.inboxFile, settings.tasksFile]
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
    const uncachedFiles = [];
    for (const file of logs) {
      const cached = this.reviewEntryCountCache.get(file.path);
      if (cached && cached.mtime === file.stat.mtime) {
        seenPaths.add(file.path);
        total += cached.count;
      } else {
        uncachedFiles.push(file);
      }
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
  constructor(noteService, inboxService, taskService, journalService, reviewLogService, settingsProvider) {
    this.noteService = noteService;
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
    const title = buildNoteTitle(entry);
    const body = [
      "Original capture:",
      entry.body || entry.preview || entry.heading
    ].join("\n");
    const saved = await this.noteService.createGeneratedNote(
      title,
      body,
      "Brain inbox",
      null
    );
    await this.appendReviewLogBestEffort(entry, "note");
    const markerUpdated = await this.markInboxReviewed(entry, "note");
    return this.appendMarkerNote(
      `Promoted inbox entry to note in ${saved.path}`,
      markerUpdated
    );
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
  const overviewIndex = lines.findIndex((line) => /^##\s+Overview\s*$/i.test(line));
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
    if (options.excludePaths) {
      const excluded = new Set(options.excludePaths);
      files = files.filter((file) => !excluded.has(file.path));
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
      if (this.isAnyModalOpen()) {
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
  isAnyModalOpen() {
    return document.querySelector(".modal-bg") !== null || document.querySelector(".modal-container") !== null;
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
      this.noteService,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbW9kZWwtc2VsZWN0aW9uLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZS50cyIsICJzcmMvdXRpbHMvZGF0ZS50cyIsICJzcmMvdXRpbHMvdGV4dC50cyIsICJzcmMvc2VydmljZXMvaW5ib3gtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgudHMiLCAic3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL2Zvcm1hdC1oZWxwZXJzLnRzIiwgInNyYy91dGlscy9xdWVzdGlvbi1hbnN3ZXItZm9ybWF0LnRzIiwgInNyYy91dGlscy9xdWVzdGlvbi1hbnN3ZXItbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktZm9ybWF0LnRzIiwgInNyYy9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZS50cyIsICJzcmMvdXRpbHMvY29udGV4dC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3dvcmtmbG93LXNlcnZpY2UudHMiLCAic3JjL3ZpZXdzL2ZpbGUtZ3JvdXAtcGlja2VyLW1vZGFsLnRzIiwgInNyYy92aWV3cy9wcm9tcHQtbW9kYWxzLnRzIiwgInNyYy92aWV3cy9xdWVzdGlvbi1zY29wZS1tb2RhbC50cyIsICJzcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbC50cyIsICJzcmMvdXRpbHMvZXJyb3ItaGFuZGxlci50cyIsICJzcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsLnRzIiwgInNyYy92aWV3cy9pbmJveC1yZXZpZXctbW9kYWwudHMiLCAic3JjL3V0aWxzL2luYm94LXJldmlldy50cyIsICJzcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyIsICJzcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQ29udGV4dFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgSm91cm5hbFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBOb3RlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUb3BpY1BhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkF1dGhTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2F1dGgtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluV29ya2Zsb3dTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3dvcmtmbG93LXNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIFByb21wdE1vZGFsLFxuICBSZXN1bHRNb2RhbCxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3Byb21wdC1tb2RhbHNcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5pbXBvcnQgeyBSZXZpZXdIaXN0b3J5TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWxcIjtcbmltcG9ydCB7XG4gIEJSQUlOX1ZJRVdfVFlQRSxcbiAgQnJhaW5TaWRlYmFyVmlldyxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3NpZGViYXItdmlld1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVJlc3VsdCB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQ29tbWFuZHMgfSBmcm9tIFwiLi9zcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHNcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuL3NyYy91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJyYWluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3MhOiBCcmFpblBsdWdpblNldHRpbmdzO1xuICB2YXVsdFNlcnZpY2UhOiBWYXVsdFNlcnZpY2U7XG4gIGluYm94U2VydmljZSE6IEluYm94U2VydmljZTtcbiAgbm90ZVNlcnZpY2UhOiBOb3RlU2VydmljZTtcbiAgdGFza1NlcnZpY2UhOiBUYXNrU2VydmljZTtcbiAgam91cm5hbFNlcnZpY2UhOiBKb3VybmFsU2VydmljZTtcbiAgcmV2aWV3TG9nU2VydmljZSE6IFJldmlld0xvZ1NlcnZpY2U7XG4gIHJldmlld1NlcnZpY2UhOiBSZXZpZXdTZXJ2aWNlO1xuICBxdWVzdGlvblNlcnZpY2UhOiBRdWVzdGlvblNlcnZpY2U7XG4gIGNvbnRleHRTZXJ2aWNlITogQ29udGV4dFNlcnZpY2U7XG4gIHN5bnRoZXNpc1NlcnZpY2UhOiBTeW50aGVzaXNTZXJ2aWNlO1xuICB0b3BpY1BhZ2VTZXJ2aWNlITogVG9waWNQYWdlU2VydmljZTtcbiAgYWlTZXJ2aWNlITogQnJhaW5BSVNlcnZpY2U7XG4gIGF1dGhTZXJ2aWNlITogQnJhaW5BdXRoU2VydmljZTtcbiAgc3VtbWFyeVNlcnZpY2UhOiBTdW1tYXJ5U2VydmljZTtcbiAgd29ya2Zsb3dTZXJ2aWNlITogQnJhaW5Xb3JrZmxvd1NlcnZpY2U7XG4gIHByaXZhdGUgc2lkZWJhclZpZXc6IEJyYWluU2lkZWJhclZpZXcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0U3VtbWFyeUF0OiBEYXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5ib3hTZXJ2aWNlID0gbmV3IEluYm94U2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5ub3RlU2VydmljZSA9IG5ldyBOb3RlU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy50YXNrU2VydmljZSA9IG5ldyBUYXNrU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5qb3VybmFsU2VydmljZSA9IG5ldyBKb3VybmFsU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuY29udGV4dFNlcnZpY2UgPSBuZXcgQ29udGV4dFNlcnZpY2UoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3TG9nU2VydmljZSA9IG5ldyBSZXZpZXdMb2dTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5yZXZpZXdTZXJ2aWNlID0gbmV3IFJldmlld1NlcnZpY2UoXG4gICAgICB0aGlzLm5vdGVTZXJ2aWNlLFxuICAgICAgdGhpcy5pbmJveFNlcnZpY2UsXG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLFxuICAgICAgdGhpcy5qb3VybmFsU2VydmljZSxcbiAgICAgIHRoaXMucmV2aWV3TG9nU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnF1ZXN0aW9uU2VydmljZSA9IG5ldyBRdWVzdGlvblNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnN1bW1hcnlTZXJ2aWNlID0gbmV3IFN1bW1hcnlTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnN5bnRoZXNpc1NlcnZpY2UgPSBuZXcgU3ludGhlc2lzU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudG9waWNQYWdlU2VydmljZSA9IG5ldyBUb3BpY1BhZ2VTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy53b3JrZmxvd1NlcnZpY2UgPSBuZXcgQnJhaW5Xb3JrZmxvd1NlcnZpY2UoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgICB0aGlzLmNvbnRleHRTZXJ2aWNlLFxuICAgICAgdGhpcy5zeW50aGVzaXNTZXJ2aWNlLFxuICAgICAgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlLFxuICAgICAgdGhpcy5xdWVzdGlvblNlcnZpY2UsXG4gICAgICB0aGlzLm5vdGVTZXJ2aWNlLFxuICAgICAge1xuICAgICAgICB1cGRhdGVSZXN1bHQ6ICh0ZXh0KSA9PiB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQodGV4dCksXG4gICAgICAgIHVwZGF0ZVN1bW1hcnk6ICh0ZXh0KSA9PiB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHRleHQpLFxuICAgICAgICByZWZyZXNoU3RhdHVzOiAoKSA9PiB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpLFxuICAgICAgICByZXBvcnRBY3Rpb25SZXN1bHQ6IChtZXNzYWdlKSA9PiB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKSxcbiAgICAgICAgaGFzQWN0aXZlTWFya2Rvd25Ob3RlOiAoKSA9PiB0aGlzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgICBzZXRMYXN0U3VtbWFyeUF0OiAoZGF0ZSkgPT4ge1xuICAgICAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IGRhdGU7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5yZWdpc3RlclZpZXcoQlJBSU5fVklFV19UWVBFLCAobGVhZikgPT4ge1xuICAgICAgICBjb25zdCB2aWV3ID0gbmV3IEJyYWluU2lkZWJhclZpZXcobGVhZiwgdGhpcyk7XG4gICAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgICByZXR1cm4gdmlldztcbiAgICAgIH0pO1xuXG4gICAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEJyYWluU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGZpbmlzaCBsb2FkaW5nIEJyYWluXCIpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgbG9hZCBCcmFpbiBzZXR0aW5nc1wiKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRoZSBzaWRlYmFyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBCUkFJTl9WSUVXX1RZUEUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGhhc09wZW5TaWRlYmFyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSkubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFJlc3VsdCh0ZXh0KTtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RTdW1tYXJ5KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQobWVzc2FnZSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgfVxuXG4gIGdldExhc3RTdW1tYXJ5TGFiZWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sYXN0U3VtbWFyeUF0ID8gZm9ybWF0RGF0ZVRpbWVLZXkodGhpcy5sYXN0U3VtbWFyeUF0KSA6IFwiTm8gYXJ0aWZhY3QgeWV0XCI7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5zZXR0aW5ncyk7XG4gICAgaWYgKCFhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICBuZXcgTm90aWNlKGFpU3RhdHVzLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgcm91dGUgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5yb3V0ZVRleHQodGV4dCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgaWYgKHJvdXRlKSB7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoYEF1dG8tcm91dGVkIGFzICR7cm91dGV9YCk7XG4gICAgfVxuICAgIHJldHVybiByb3V0ZTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudE5vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuYXNrQWJvdXRDdXJyZW50Tm90ZShcInN1bW1hcml6ZVwiKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuYXNrQWJvdXRDdXJyZW50Tm90ZSgpO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRTZWxlY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuYXNrQWJvdXRTZWxlY3Rpb24oKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0UmVjZW50RmlsZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuYXNrQWJvdXRSZWNlbnRGaWxlcygpO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza0Fib3V0Q3VycmVudEZvbGRlcigpO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZU5vdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLnN5bnRoZXNpemVOb3RlcygpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnROb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmFza1F1ZXN0aW9uKCk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuY3JlYXRlVG9waWNQYWdlKCk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2VGb3JTY29wZShkZWZhdWx0U2NvcGU/OiBRdWVzdGlvblNjb3BlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy53b3JrZmxvd1NlcnZpY2UuY3JlYXRlVG9waWNQYWdlKGRlZmF1bHRTY29wZSk7XG4gIH1cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coXG4gICAgbG9va2JhY2tEYXlzPzogbnVtYmVyLFxuICAgIGxhYmVsPzogc3RyaW5nLFxuICApOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN1bW1hcnlTZXJ2aWNlLmdlbmVyYXRlU3VtbWFyeShsb29rYmFja0RheXMsIGxhYmVsKTtcbiAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclN1bW1hcnkoYCR7cmVzdWx0LnRpdGxlfVxcblxcbiR7cmVzdWx0LmNvbnRlbnR9YCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KFxuICAgICAgcmVzdWx0LnVzZWRBSSA/IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIHdpdGggQUlgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIG5ldyBOb3RpY2UoXG4gICAgICByZXN1bHQucGVyc2lzdGVkUGF0aFxuICAgICAgICA/IGAke3Jlc3VsdC50aXRsZX0gc2F2ZWQgdG8gJHtyZXN1bHQucGVyc2lzdGVkUGF0aH1gXG4gICAgICAgIDogcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWBcbiAgICAgICAgICA6IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIGxvY2FsbHlgLFxuICAgICk7XG4gICAgaWYgKCF0aGlzLmhhc09wZW5TaWRlYmFyKCkpIHtcbiAgICAgIG5ldyBSZXN1bHRNb2RhbCh0aGlzLmFwcCwgYEJyYWluICR7cmVzdWx0LnRpdGxlfWAsIHJlc3VsdC5jb250ZW50KS5vcGVuKCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlRnJvbU1vZGFsKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgc3VibWl0TGFiZWw6IHN0cmluZyxcbiAgICBhY3Rpb246ICh0ZXh0OiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPixcbiAgICBtdWx0aWxpbmUgPSBmYWxzZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdmFsdWUgPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgIHRpdGxlLFxuICAgICAgcGxhY2Vob2xkZXI6IG11bHRpbGluZVxuICAgICAgICA/IFwiV3JpdGUgeW91ciBlbnRyeSBoZXJlLi4uXCJcbiAgICAgICAgOiBcIlR5cGUgaGVyZS4uLlwiLFxuICAgICAgc3VibWl0TGFiZWwsXG4gICAgICBtdWx0aWxpbmUsXG4gICAgfSkub3BlblByb21wdCgpO1xuXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFjdGlvbih2YWx1ZSk7XG4gICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQnJhaW4gY291bGQgbm90IHNhdmUgdGhhdCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjYXB0dXJlTm90ZSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5ub3RlU2VydmljZS5hcHBlbmROb3RlKHRleHQpO1xuICAgIHJldHVybiBgQ2FwdHVyZWQgbm90ZSBpbiAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVUYXNrKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZUpvdXJuYWwodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkodGV4dCk7XG4gICAgcmV0dXJuIGBTYXZlZCBqb3VybmFsIGVudHJ5IHRvICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc0luYm94KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UuZ2V0UmVjZW50SW5ib3hFbnRyaWVzKCk7XG4gICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIGluYm94IGVudHJpZXMgZm91bmRcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IEluYm94UmV2aWV3TW9kYWwodGhpcy5hcHAsIGVudHJpZXMsIHRoaXMucmV2aWV3U2VydmljZSwgYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgIH0pLm9wZW4oKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoYExvYWRlZCAke2VudHJpZXMubGVuZ3RofSBpbmJveCBlbnRyaWVzYCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5SZXZpZXdIaXN0b3J5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cmllcygpO1xuICAgIG5ldyBSZXZpZXdIaXN0b3J5TW9kYWwodGhpcy5hcHAsIGVudHJpZXMsIHRoaXMpLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIGFkZFRhc2tGcm9tU2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IHRoaXMud29ya2Zsb3dTZXJ2aWNlLmdldEFjdGl2ZVNlbGVjdGlvblRleHQoKTtcbiAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayhzZWxlY3Rpb24pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGBTYXZlZCB0YXNrIGZyb20gc2VsZWN0aW9uIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IE5vdGljZShcIk5vIHNlbGVjdGlvbiBmb3VuZC4gT3BlbmluZyB0YXNrIGVudHJ5IG1vZGFsLlwiKTtcbiAgICBhd2FpdCB0aGlzLmNhcHR1cmVGcm9tTW9kYWwoXCJBZGQgVGFza1wiLCBcIlNhdmUgdGFza1wiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBvcGVuVG9kYXlzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5lbnN1cmVKb3VybmFsRmlsZSgpO1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdG9kYXkncyBqb3VybmFsXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgY29uc3QgbWVzc2FnZSA9IGBPcGVuZWQgJHtmaWxlLnBhdGh9YDtcbiAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIGdldEluYm94Q291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UuZ2V0VW5yZXZpZXdlZENvdW50KCk7XG4gIH1cblxuICBhc3luYyBnZXRPcGVuVGFza0NvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudGFza1NlcnZpY2UuZ2V0T3BlblRhc2tDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3SGlzdG9yeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyeUNvdW50KCk7XG4gIH1cblxuICBhc3luYyByZW9wZW5SZXZpZXdFbnRyeShlbnRyeToge1xuICAgIGhlYWRpbmc6IHN0cmluZztcbiAgICBwcmV2aWV3OiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlSW5kZXg6IG51bWJlcjtcbiAgfSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnJlb3BlbkZyb21SZXZpZXdMb2coe1xuICAgICAgYWN0aW9uOiBcInJlb3BlblwiLFxuICAgICAgdGltZXN0YW1wOiBcIlwiLFxuICAgICAgc291cmNlUGF0aDogXCJcIixcbiAgICAgIGZpbGVNdGltZTogRGF0ZS5ub3coKSxcbiAgICAgIGVudHJ5SW5kZXg6IDAsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGVudHJ5LnByZXZpZXcsXG4gICAgICBzaWduYXR1cmU6IGVudHJ5LnNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyBnZXRBaVN0YXR1c1RleHQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgJiYgIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm4gXCJBSSBvZmZcIjtcbiAgICB9XG4gICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5zZXR0aW5ncyk7XG4gICAgaWYgKCFhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICByZXR1cm4gYWlTdGF0dXMubWVzc2FnZS5yZXBsYWNlKC9cXC4kLywgXCJcIik7XG4gICAgfVxuICAgIGNvbnN0IHByb3ZpZGVyID0gYWlTdGF0dXMucHJvdmlkZXIgPz8gXCJBSVwiO1xuICAgIGNvbnN0IG1vZGVsID0gYWlTdGF0dXMubW9kZWwgPyBgICgke2FpU3RhdHVzLm1vZGVsfSlgIDogXCJcIjtcbiAgICByZXR1cm4gYCR7cHJvdmlkZXJ9JHttb2RlbH1gO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNBY3RpdmVNYXJrZG93bk5vdGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KT8uZmlsZSk7XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuICBvcGVuQUlCYXNlVXJsOiBzdHJpbmc7XG5cbiAgYWlQcm92aWRlcjogXCJvcGVuYWlcIiB8IFwiY29kZXhcIiB8IFwiZ2VtaW5pXCI7XG4gIGNvZGV4TW9kZWw6IHN0cmluZztcbiAgZ2VtaW5pQXBpS2V5OiBzdHJpbmc7XG4gIGdlbWluaU1vZGVsOiBzdHJpbmc7XG5cbiAgc3VtbWFyeUxvb2tiYWNrRGF5czogbnVtYmVyO1xuICBzdW1tYXJ5TWF4Q2hhcnM6IG51bWJlcjtcblxuICBwZXJzaXN0U3VtbWFyaWVzOiBib29sZWFuO1xuXG4gIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICBpbmJveEZpbGU6IFwiQnJhaW4vaW5ib3gubWRcIixcbiAgdGFza3NGaWxlOiBcIkJyYWluL3Rhc2tzLm1kXCIsXG4gIGpvdXJuYWxGb2xkZXI6IFwiQnJhaW4vam91cm5hbFwiLFxuICBub3Rlc0ZvbGRlcjogXCJCcmFpbi9ub3Rlc1wiLFxuICBzdW1tYXJpZXNGb2xkZXI6IFwiQnJhaW4vc3VtbWFyaWVzXCIsXG4gIHJldmlld3NGb2xkZXI6IFwiQnJhaW4vcmV2aWV3c1wiLFxuICBlbmFibGVBSVN1bW1hcmllczogZmFsc2UsXG4gIGVuYWJsZUFJUm91dGluZzogZmFsc2UsXG4gIG9wZW5BSUFwaUtleTogXCJcIixcbiAgb3BlbkFJTW9kZWw6IFwiZ3B0LTRvLW1pbmlcIixcbiAgb3BlbkFJQmFzZVVybDogXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxL2NoYXQvY29tcGxldGlvbnNcIixcbiAgYWlQcm92aWRlcjogXCJvcGVuYWlcIixcbiAgY29kZXhNb2RlbDogXCJcIixcbiAgZ2VtaW5pQXBpS2V5OiBcIlwiLFxuICBnZW1pbmlNb2RlbDogXCJnZW1pbmktMS41LWZsYXNoXCIsXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IDcsXG4gIHN1bW1hcnlNYXhDaGFyczogMTIwMDAsXG4gIHBlcnNpc3RTdW1tYXJpZXM6IHRydWUsXG4gIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogW10sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgaW5ib3hGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgobWVyZ2VkLmluYm94RmlsZSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5pbmJveEZpbGUpLFxuICAgIHRhc2tzRmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKG1lcmdlZC50YXNrc0ZpbGUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1MudGFza3NGaWxlKSxcbiAgICBqb3VybmFsRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuam91cm5hbEZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muam91cm5hbEZvbGRlcixcbiAgICApLFxuICAgIG5vdGVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQubm90ZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm5vdGVzRm9sZGVyLFxuICAgICksXG4gICAgc3VtbWFyaWVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuc3VtbWFyaWVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJpZXNGb2xkZXIsXG4gICAgKSxcbiAgICByZXZpZXdzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQucmV2aWV3c0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MucmV2aWV3c0ZvbGRlcixcbiAgICApLFxuICAgIGVuYWJsZUFJU3VtbWFyaWVzOiBCb29sZWFuKG1lcmdlZC5lbmFibGVBSVN1bW1hcmllcyksXG4gICAgZW5hYmxlQUlSb3V0aW5nOiBCb29sZWFuKG1lcmdlZC5lbmFibGVBSVJvdXRpbmcpLFxuICAgIG9wZW5BSUFwaUtleTogdHlwZW9mIG1lcmdlZC5vcGVuQUlBcGlLZXkgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQub3BlbkFJQXBpS2V5LnRyaW0oKSA6IFwiXCIsXG4gICAgb3BlbkFJTW9kZWw6XG4gICAgICB0eXBlb2YgbWVyZ2VkLm9wZW5BSU1vZGVsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5vcGVuQUlNb2RlbC50cmltKClcbiAgICAgICAgPyBtZXJnZWQub3BlbkFJTW9kZWwudHJpbSgpXG4gICAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5vcGVuQUlNb2RlbCxcbiAgICBvcGVuQUlCYXNlVXJsOlxuICAgICAgdHlwZW9mIG1lcmdlZC5vcGVuQUlCYXNlVXJsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5vcGVuQUlCYXNlVXJsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5vcGVuQUlCYXNlVXJsLnRyaW0oKVxuICAgICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1Mub3BlbkFJQmFzZVVybCxcbiAgICBhaVByb3ZpZGVyOlxuICAgICAgbWVyZ2VkLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCJcbiAgICAgICAgPyBcImdlbWluaVwiXG4gICAgICAgIDogbWVyZ2VkLmFpUHJvdmlkZXIgPT09IFwiY29kZXhcIlxuICAgICAgICAgID8gXCJjb2RleFwiXG4gICAgICAgICAgOiBcIm9wZW5haVwiLFxuICAgIGNvZGV4TW9kZWw6IHR5cGVvZiBtZXJnZWQuY29kZXhNb2RlbCA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5jb2RleE1vZGVsLnRyaW0oKSA6IFwiXCIsXG4gICAgZ2VtaW5pQXBpS2V5OiB0eXBlb2YgbWVyZ2VkLmdlbWluaUFwaUtleSA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5nZW1pbmlBcGlLZXkudHJpbSgpIDogXCJcIixcbiAgICBnZW1pbmlNb2RlbDpcbiAgICAgIHR5cGVvZiBtZXJnZWQuZ2VtaW5pTW9kZWwgPT09IFwic3RyaW5nXCIgJiYgbWVyZ2VkLmdlbWluaU1vZGVsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5nZW1pbmlNb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmdlbWluaU1vZGVsLFxuICAgIHN1bW1hcnlMb29rYmFja0RheXM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeUxvb2tiYWNrRGF5cywgMSwgMzY1LCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgIHN1bW1hcnlNYXhDaGFyczogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TWF4Q2hhcnMsIDEwMDAsIDEwMDAwMCwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgIHBlcnNpc3RTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLnBlcnNpc3RTdW1tYXJpZXMpLFxuICAgIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogQXJyYXkuaXNBcnJheShtZXJnZWQuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zKVxuICAgICAgPyAobWVyZ2VkLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyBhcyBzdHJpbmdbXSkuZmlsdGVyKChzKSA9PiB0eXBlb2YgcyA9PT0gXCJzdHJpbmdcIilcbiAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGNsYW1wSW50ZWdlcihcbiAgdmFsdWU6IHVua25vd24sXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlcixcbiAgZmFsbGJhY2s6IG51bWJlcixcbik6IG51bWJlciB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcbiAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbHVlKSk7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZShwYXJzZWQpKSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHBhcnNlZCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxsYmFjaztcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVGV4dENvbXBvbmVudCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQge1xuICBnZXRNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldE5leHRNb2RlbFZhbHVlLFxuICBpc0N1c3RvbU1vZGVsVmFsdWUsXG59IGZyb20gXCIuLi91dGlscy9tb2RlbC1zZWxlY3Rpb25cIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuY29uc3QgT1BFTkFJX1BSRVNFVF9NT0RFTFMgPSBbXG4gIFwiZ3B0LTRvLW1pbmlcIixcbiAgXCJncHQtNG9cIixcbiAgXCJvMS1taW5pXCIsXG4gIFwibzEtcHJldmlld1wiLFxuICBcImdwdC0zLjUtdHVyYm9cIixcbl0gYXMgY29uc3Q7XG5cbmNvbnN0IEdFTUlOSV9QUkVTRVRfTU9ERUxTID0gW1xuICBcImdlbWluaS0xLjUtZmxhc2hcIixcbiAgXCJnZW1pbmktMS41LWZsYXNoLThiXCIsXG4gIFwiZ2VtaW5pLTEuNS1wcm9cIixcbiAgXCJnZW1pbmktMi4wLWZsYXNoXCIsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogQnJhaW5QbHVnaW47XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW4gU2V0dGluZ3NcIiB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0b3JhZ2VcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbmJveCBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgbm90ZSBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJJbmJveCBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiVGFza3MgZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHVzZWQgZm9yIHF1aWNrIHRhc2sgY2FwdHVyZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiVGFza3MgZmlsZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkpvdXJuYWwgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciBjb250YWluaW5nIGRhaWx5IGpvdXJuYWwgZmlsZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSm91cm5hbCBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOb3RlcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgZm9yIHByb21vdGVkIG5vdGVzIGFuZCBnZW5lcmF0ZWQgbWFya2Rvd24gYXJ0aWZhY3RzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3VtbWFyaWVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcGVyc2lzdGVkIHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiU3VtbWFyaWVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJldmlld3MgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIHRvIHN0b3JlIGluYm94IHJldmlldyBsb2dzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV2aWV3c0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlJldmlld3MgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkFJIFByb3ZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkNob29zZSB0aGUgcHJvdmlkZXIgQnJhaW4gc2hvdWxkIHVzZSBmb3Igc3ludGhlc2lzLCBxdWVzdGlvbnMsIHRvcGljIHBhZ2VzLCBhbmQgb3B0aW9uYWwgYXV0by1yb3V0aW5nLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT5cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICBvcGVuYWk6IFwiT3BlbkFJIEFQSVwiLFxuICAgICAgICAgICAgY29kZXg6IFwiT3BlbkFJIENvZGV4IChDaGF0R1BUKVwiLFxuICAgICAgICAgICAgZ2VtaW5pOiBcIkdvb2dsZSBHZW1pbmlcIixcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPSB2YWx1ZSBhcyBcIm9wZW5haVwiIHwgXCJjb2RleFwiIHwgXCJnZW1pbmlcIjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7IC8vIFJlZnJlc2ggVUkgdG8gc2hvdyByZWxldmFudCBmaWVsZHNcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICB0aGlzLmNyZWF0ZUFJU3RhdHVzU2V0dGluZyhjb250YWluZXJFbCk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgY29uc3QgYXV0aFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJPcGVuQUkgc2V0dXBcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5XG4gICAgICAgICAgICA/IFwiT3BlbkFJIGlzIHJlYWR5LiBUaGUgQVBJIGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBCcmFpbiBzZXR0aW5ncy5cIlxuICAgICAgICAgICAgOiBcIlVzZSBhbiBPcGVuQUkgQVBJIGtleSBmcm9tIHBsYXRmb3JtLm9wZW5haS5jb20sIG9yIHBvaW50IEJyYWluIGF0IGFuIE9wZW5BSS1jb21wYXRpYmxlIGVuZHBvaW50IGJlbG93LlwiLFxuICAgICAgICApO1xuXG4gICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5KSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJEaXNjb25uZWN0XCIpXG4gICAgICAgICAgICAuc2V0V2FybmluZygpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IFwiXCI7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXV0aFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIk9wZW4gT3BlbkFJIFNldHVwXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oXCJvcGVuYWlcIik7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIEFQSSBrZXlcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgXCJTdG9yZWQgbG9jYWxseSBpbiBwbHVnaW4gc2V0dGluZ3MuIFVzZSBhbiBBUEkga2V5IGZvciB0aGUgZGVmYXVsdCBPcGVuQUkgZW5kcG9pbnQuIElmIHlvdSBvdmVycmlkZSB0aGUgYmFzZSBVUkwgYmVsb3csIHRoaXMgZmllbGQgaXMgdXNlZCBhcyB0aGF0IGVuZHBvaW50J3MgYmVhcmVyIHRva2VuLlwiLFxuICAgICAgICApXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIE9wZW5BSSBBUEkga2V5Li4uXCIpO1xuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSxcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIk9wZW5BSSBtb2RlbFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlNlbGVjdCBhIG1vZGVsIG9yIGVudGVyIGEgY3VzdG9tIG9uZS5cIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICAgIFwiZ3B0LTRvLW1pbmlcIjogXCJHUFQtNG8gTWluaSAoRGVmYXVsdClcIixcbiAgICAgICAgICAgICAgXCJncHQtNG9cIjogXCJHUFQtNG8gKFBvd2VyZnVsKVwiLFxuICAgICAgICAgICAgICBcIm8xLW1pbmlcIjogXCJvMSBNaW5pIChSZWFzb25pbmcpXCIsXG4gICAgICAgICAgICAgIFwibzEtcHJldmlld1wiOiBcIm8xIFByZXZpZXcgKFN0cm9uZyBSZWFzb25pbmcpXCIsXG4gICAgICAgICAgICAgIFwiZ3B0LTMuNS10dXJib1wiOiBcIkdQVC0zLjUgVHVyYm8gKExlZ2FjeSlcIixcbiAgICAgICAgICAgICAgY3VzdG9tOiBcIkN1c3RvbSBNb2RlbC4uLlwiLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zZXRWYWx1ZShnZXRNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsIE9QRU5BSV9QUkVTRVRfTU9ERUxTKSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgbmV4dE1vZGVsID0gZ2V0TmV4dE1vZGVsVmFsdWUoXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsXG4gICAgICAgICAgICAgICAgT1BFTkFJX1BSRVNFVF9NT0RFTFMsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCA9IG5leHRNb2RlbDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gXCJjdXN0b21cIiAmJiBuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobmV4dE1vZGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQ3VzdG9tID0gaXNDdXN0b21Nb2RlbFZhbHVlKFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsXG4gICAgICAgICAgICBPUEVOQUlfUFJFU0VUX01PREVMUyxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChpc0N1c3RvbSkge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIGN1c3RvbSBtb2RlbCBuYW1lLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcodGV4dCwgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJTZWxlY3QgQ3VzdG9tIE1vZGVsLi4uIHRvIGVudGVyIGEgbW9kZWwgbmFtZVwiKTtcbiAgICAgICAgICAgIHRleHQuc2V0VmFsdWUoXCJcIik7XG4gICAgICAgICAgICB0ZXh0LmlucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIGJhc2UgVVJMXCIpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIFwiT3ZlcnJpZGUgdGhlIGRlZmF1bHQgT3BlbkFJIGVuZHBvaW50IGZvciBjdXN0b20gcHJveGllcyBvciBsb2NhbCBMTE1zLiBJZiB5b3Ugc2V0IHRoaXMsIHRoZSBiZWFyZXIgdG9rZW4gYWJvdmUgaXMgc2VudCB0byB0aGF0IGVuZHBvaW50LlwiLFxuICAgICAgICApXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUJhc2VVcmwsXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQmFzZVVybCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJPcGVuQUkgYmFzZSBVUkwgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiY29kZXhcIikge1xuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiQ29kZXggc2V0dXBcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgXCJVc2UgeW91ciBDaGF0R1BUIHN1YnNjcmlwdGlvbiB0aHJvdWdoIHRoZSBvZmZpY2lhbCBDb2RleCBDTEkuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiBjaGVjayBCcmFpbidzIHNpZGViYXIgc3RhdHVzIHRvIGNvbmZpcm0gQ29kZXggaXMgcmVhZHkuXCIsXG4gICAgICAgIClcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIENvZGV4IFNldHVwXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oXCJjb2RleFwiKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJDb2RleCBtb2RlbFwiKVxuICAgICAgICAuc2V0RGVzYyhcIk9wdGlvbmFsLiBMZWF2ZSBibGFuayB0byB1c2UgdGhlIENvZGV4IENMSSBkZWZhdWx0IG1vZGVsIGZvciB5b3VyIGFjY291bnQuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKHRleHQsIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgY29uc3QgYXV0aFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJHZW1pbmkgc2V0dXBcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5XG4gICAgICAgICAgICA/IFwiR2VtaW5pIGlzIHJlYWR5LiBUaGUgQVBJIGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBCcmFpbiBzZXR0aW5ncy5cIlxuICAgICAgICAgICAgOiBcIlVzZSBhIEdlbWluaSBBUEkga2V5IGZyb20gR29vZ2xlIEFJIFN0dWRpbywgdGhlbiBwYXN0ZSBpdCBiZWxvdy5cIixcbiAgICAgICAgKTtcblxuICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSkge1xuICAgICAgICBhdXRoU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiRGlzY29ubmVjdFwiKVxuICAgICAgICAgICAgLnNldFdhcm5pbmcoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkgPSBcIlwiO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIEdlbWluaSBTZXR1cFwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKFwiZ2VtaW5pXCIpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkdlbWluaSBBUEkga2V5XCIpXG4gICAgICAgIC5zZXREZXNjKFwiU3RvcmVkIGxvY2FsbHkgaW4gcGx1Z2luIHNldHRpbmdzLiBHZW5lcmF0ZWQgZnJvbSBHb29nbGUgQUkgU3R1ZGlvLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciBHZW1pbmkgQVBJIGtleS4uLlwiKTtcbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXksXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJHZW1pbmkgbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJTZWxlY3QgYSBHZW1pbmkgbW9kZWwgb3IgZW50ZXIgYSBjdXN0b20gb25lLlwiKVxuICAgICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAgIC5hZGRPcHRpb25zKHtcbiAgICAgICAgICAgICAgXCJnZW1pbmktMS41LWZsYXNoXCI6IFwiR2VtaW5pIDEuNSBGbGFzaCAoRmFzdGVzdClcIixcbiAgICAgICAgICAgICAgXCJnZW1pbmktMS41LWZsYXNoLThiXCI6IFwiR2VtaW5pIDEuNSBGbGFzaCA4QiAoTGlnaHRlcilcIixcbiAgICAgICAgICAgICAgXCJnZW1pbmktMS41LXByb1wiOiBcIkdlbWluaSAxLjUgUHJvIChQb3dlcmZ1bClcIixcbiAgICAgICAgICAgICAgXCJnZW1pbmktMi4wLWZsYXNoXCI6IFwiR2VtaW5pIDIuMCBGbGFzaCAoTGF0ZXN0KVwiLFxuICAgICAgICAgICAgICBjdXN0b206IFwiQ3VzdG9tIE1vZGVsLi4uXCIsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNldFZhbHVlKGdldE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCwgR0VNSU5JX1BSRVNFVF9NT0RFTFMpKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBuZXh0TW9kZWwgPSBnZXROZXh0TW9kZWxWYWx1ZShcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCxcbiAgICAgICAgICAgICAgICBHRU1JTklfUFJFU0VUX01PREVMUyxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG5leHRNb2RlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsID0gbmV4dE1vZGVsO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcImN1c3RvbVwiICYmIG5leHRNb2RlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNDdXN0b20gPSBpc0N1c3RvbU1vZGVsVmFsdWUoXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCxcbiAgICAgICAgICAgIEdFTUlOSV9QUkVTRVRfTU9ERUxTLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGlzQ3VzdG9tKSB7XG4gICAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgY3VzdG9tIG1vZGVsIG5hbWUuLi5cIik7XG4gICAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyh0ZXh0LCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIlNlbGVjdCBDdXN0b20gTW9kZWwuLi4gdG8gZW50ZXIgYSBtb2RlbCBuYW1lXCIpO1xuICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZShcIlwiKTtcbiAgICAgICAgICAgIHRleHQuaW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSSBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBBSSBzeW50aGVzaXNcIilcbiAgICAgIC5zZXREZXNjKFwiVXNlIEFJIGZvciBzeW50aGVzaXMsIHF1ZXN0aW9uIGFuc3dlcmluZywgYW5kIHRvcGljIHBhZ2VzIHdoZW4gY29uZmlndXJlZC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHJvdXRpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiQWxsb3cgdGhlIHNpZGViYXIgdG8gYXV0by1yb3V0ZSBjYXB0dXJlcyB3aXRoIEFJLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29udGV4dCBDb2xsZWN0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTG9va2JhY2sgZGF5c1wiKVxuICAgICAgLnNldERlc2MoXCJIb3cgZmFyIGJhY2sgdG8gc2NhbiB3aGVuIGJ1aWxkaW5nIHJlY2VudC1jb250ZXh0IHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDAgPyBwYXJzZWQgOiA3O1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1heGltdW0gY2hhcmFjdGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJNYXhpbXVtIHRleHQgY29sbGVjdGVkIGJlZm9yZSBzeW50aGVzaXMgb3Igc3VtbWFyeS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPj0gMTAwMCA/IHBhcnNlZCA6IDEyMDAwO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3VtbWFyeSBPdXRwdXRcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQZXJzaXN0IHN1bW1hcmllc1wiKVxuICAgICAgLnNldERlc2MoXCJXcml0ZSBnZW5lcmF0ZWQgc3VtbWFyaWVzIGludG8gdGhlIHZhdWx0LlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUFJU3RhdHVzU2V0dGluZyhjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0dXNTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlByb3ZpZGVyIHN0YXR1c1wiKVxuICAgICAgLnNldERlc2MoXCJDdXJyZW50IHJlYWRpbmVzcyBmb3IgdGhlIHNlbGVjdGVkIEFJIHByb3ZpZGVyLlwiKTtcbiAgICBzdGF0dXNTZXR0aW5nLnNldERlc2MoXCJDaGVja2luZyBwcm92aWRlciBzdGF0dXMuLi5cIik7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hBSVN0YXR1cyhzdGF0dXNTZXR0aW5nKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaEFJU3RhdHVzKHNldHRpbmc6IFNldHRpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgIHNldHRpbmcuc2V0RGVzYyhzdGF0dXMubWVzc2FnZSk7XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBsYXN0U2F2ZWRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBpc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgdGV4dC5zZXRWYWx1ZSh2YWx1ZSkub25DaGFuZ2UoKG5leHRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShuZXh0VmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlU2F2ZU9uQmx1cihcbiAgICAgIHRleHQuaW5wdXRFbCxcbiAgICAgICgpID0+IGN1cnJlbnRWYWx1ZSxcbiAgICAgICgpID0+IGxhc3RTYXZlZFZhbHVlLFxuICAgICAgKHNhdmVkVmFsdWUpID0+IHtcbiAgICAgICAgbGFzdFNhdmVkVmFsdWUgPSBzYXZlZFZhbHVlO1xuICAgICAgfSxcbiAgICAgICgpID0+IGlzU2F2aW5nLFxuICAgICAgKHNhdmluZykgPT4ge1xuICAgICAgICBpc1NhdmluZyA9IHNhdmluZztcbiAgICAgIH0sXG4gICAgICB2YWxpZGF0ZSxcbiAgICApO1xuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVNhdmVPbkJsdXIoXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgZ2V0Q3VycmVudFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgZ2V0TGFzdFNhdmVkVmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRMYXN0U2F2ZWRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgaXNTYXZpbmc6ICgpID0+IGJvb2xlYW4sXG4gICAgc2V0U2F2aW5nOiAoc2F2aW5nOiBib29sZWFuKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IHZvaWQge1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlT25CbHVyKFxuICAgICAgICBnZXRDdXJyZW50VmFsdWUsXG4gICAgICAgIGdldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBzZXRMYXN0U2F2ZWRWYWx1ZSxcbiAgICAgICAgaXNTYXZpbmcsXG4gICAgICAgIHNldFNhdmluZyxcbiAgICAgICAgdmFsaWRhdGUsXG4gICAgICApO1xuICAgIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZU9uQmx1cihcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGlzU2F2aW5nKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRDdXJyZW50VmFsdWUoKTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09PSBnZXRMYXN0U2F2ZWRWYWx1ZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2F2aW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIHNldExhc3RTYXZlZFZhbHVlKGN1cnJlbnRWYWx1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNhdmluZyhmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGlzQ3VzdG9tTW9kZWxWYWx1ZShcbiAgdmFsdWU6IHN0cmluZyxcbiAgcHJlc2V0TW9kZWxzOiByZWFkb25seSBzdHJpbmdbXSxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIXByZXNldE1vZGVscy5pbmNsdWRlcyh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbERyb3Bkb3duVmFsdWUoXG4gIHZhbHVlOiBzdHJpbmcsXG4gIHByZXNldE1vZGVsczogcmVhZG9ubHkgc3RyaW5nW10sXG4pOiBzdHJpbmcge1xuICByZXR1cm4gaXNDdXN0b21Nb2RlbFZhbHVlKHZhbHVlLCBwcmVzZXRNb2RlbHMpID8gXCJjdXN0b21cIiA6IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dE1vZGVsVmFsdWUoXG4gIHNlbGVjdGlvbjogc3RyaW5nLFxuICBjdXJyZW50VmFsdWU6IHN0cmluZyxcbiAgcHJlc2V0TW9kZWxzOiByZWFkb25seSBzdHJpbmdbXSxcbik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoc2VsZWN0aW9uID09PSBcImN1c3RvbVwiKSB7XG4gICAgcmV0dXJuIGlzQ3VzdG9tTW9kZWxWYWx1ZShjdXJyZW50VmFsdWUsIHByZXNldE1vZGVscykgPyBjdXJyZW50VmFsdWUgOiBcIlwiO1xuICB9XG5cbiAgcmV0dXJuIHByZXNldE1vZGVscy5pbmNsdWRlcyhzZWxlY3Rpb24pID8gc2VsZWN0aW9uIDogbnVsbDtcbn1cbiIsICJleHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RleExvZ2luU3RhdHVzKG91dHB1dDogc3RyaW5nKTogQ29kZXhMb2dpblN0YXR1cyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBvdXRwdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gIGlmICghbm9ybWFsaXplZCkge1xuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxuXG4gIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwibm90IGxvZ2dlZCBpblwiKSB8fCBub3JtYWxpemVkLmluY2x1ZGVzKFwibG9nZ2VkIG91dFwiKSkge1xuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxuXG4gIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwibG9nZ2VkIGluXCIpKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLWluXCI7XG4gIH1cblxuICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleExvZ2luU3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhlY0ZpbGVBc3luYyA9IGdldEV4ZWNGaWxlQXN5bmMoKTtcbiAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBbXCJsb2dpblwiLCBcInN0YXR1c1wiXSwge1xuICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCxcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VDb2RleExvZ2luU3RhdHVzKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgIHJldHVybiBcInVuYXZhaWxhYmxlXCI7XG4gICAgfVxuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZXhCaW5hcnlQYXRoKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCBmcyA9IHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKTtcbiAgY29uc3QgcGF0aCA9IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG4gIGNvbnN0IG9zID0gcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoLCBvcy5ob21lZGlyKCkpO1xuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgc2VhcmNoaW5nLlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Vub2VudEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImNvZGVcIiBpbiBlcnJvciAmJiBlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiO1xufVxuXG5mdW5jdGlvbiBnZXRFeGVjRmlsZUFzeW5jKCk6IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbikgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PiB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgZXhlY0ZpbGUgfSA9IHJlcShcImNoaWxkX3Byb2Nlc3NcIikgYXMgdHlwZW9mIGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuICByZXR1cm4gcHJvbWlzaWZ5KGV4ZWNGaWxlKSBhcyAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9Pjtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVJlcXVpcmUoKTogTm9kZVJlcXVpcmUge1xuICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpIGFzIE5vZGVSZXF1aXJlO1xufVxuXG5mdW5jdGlvbiBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoTW9kdWxlOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSwgaG9tZURpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBjYW5kaWRhdGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdGhFbnRyaWVzID0gKHByb2Nlc3MuZW52LlBBVEggPz8gXCJcIikuc3BsaXQocGF0aE1vZHVsZS5kZWxpbWl0ZXIpLmZpbHRlcihCb29sZWFuKTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhdGhFbnRyaWVzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGVudHJ5LCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1vbkRpcnMgPSBbXG4gICAgXCIvb3B0L2hvbWVicmV3L2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBgJHtob21lRGlyfS8ubG9jYWwvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYnVuL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmNvZGVpdW0vd2luZHN1cmYvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYW50aWdyYXZpdHkvYW50aWdyYXZpdHkvYmluYCxcbiAgICBcIi9BcHBsaWNhdGlvbnMvQ29kZXguYXBwL0NvbnRlbnRzL1Jlc291cmNlc1wiLFxuICBdO1xuXG4gIGZvciAoY29uc3QgZGlyIG9mIGNvbW1vbkRpcnMpIHtcbiAgICBjYW5kaWRhdGVzLmFkZChwYXRoTW9kdWxlLmpvaW4oZGlyLCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGNhbmRpZGF0ZXMpO1xufVxuXG5mdW5jdGlvbiBjb2RleEV4ZWN1dGFibGVOYW1lKCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyBcImNvZGV4LmNtZFwiIDogXCJjb2RleFwiO1xufVxuIiwgImltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZXhMb2dpblN0YXR1cyB9IGZyb20gXCIuL2NvZGV4LWF1dGhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBBSUNvbmZpZ3VyYXRpb25TdGF0dXMge1xuICBjb25maWd1cmVkOiBib29sZWFuO1xuICBwcm92aWRlcjogXCJvcGVuYWlcIiB8IFwiY29kZXhcIiB8IFwiZ2VtaW5pXCIgfCBudWxsO1xuICBtb2RlbDogc3RyaW5nIHwgbnVsbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKFxuICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbik6IFByb21pc2U8QUlDb25maWd1cmF0aW9uU3RhdHVzPiB7XG4gIGlmIChzZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImNvZGV4XCIpIHtcbiAgICBjb25zdCBjb2RleFN0YXR1cyA9IGF3YWl0IGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgICBpZiAoY29kZXhTdGF0dXMgPT09IFwidW5hdmFpbGFibGVcIikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICAgIHByb3ZpZGVyOiBcImNvZGV4XCIsXG4gICAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgaW5zdGFsbGVkLlwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29kZXhTdGF0dXMgIT09IFwibG9nZ2VkLWluXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgICBtb2RlbDogbnVsbCxcbiAgICAgICAgbWVzc2FnZTogXCJDb2RleCBDTEkgbm90IGxvZ2dlZCBpbi5cIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgbW9kZWwgPSBzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSB8fCBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmVkOiB0cnVlLFxuICAgICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICAgIG1vZGVsLFxuICAgICAgbWVzc2FnZTogbW9kZWxcbiAgICAgICAgPyBgUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggbW9kZWwgJHttb2RlbH0uYFxuICAgICAgICA6IFwiUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggdGhlIGFjY291bnQgZGVmYXVsdCBtb2RlbC5cIixcbiAgICB9O1xuICB9XG5cbiAgaWYgKHNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICBpZiAoIXNldHRpbmdzLmdlbWluaUFwaUtleS50cmltKCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgICBwcm92aWRlcjogXCJnZW1pbmlcIixcbiAgICAgICAgbW9kZWw6IG51bGwsXG4gICAgICAgIG1lc3NhZ2U6IFwiR2VtaW5pIEFQSSBrZXkgbWlzc2luZy5cIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCFzZXR0aW5ncy5nZW1pbmlNb2RlbC50cmltKCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgICBwcm92aWRlcjogXCJnZW1pbmlcIixcbiAgICAgICAgbW9kZWw6IG51bGwsXG4gICAgICAgIG1lc3NhZ2U6IFwiR2VtaW5pIG1vZGVsIG1pc3NpbmcuXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmVkOiB0cnVlLFxuICAgICAgcHJvdmlkZXI6IFwiZ2VtaW5pXCIsXG4gICAgICBtb2RlbDogc2V0dGluZ3MuZ2VtaW5pTW9kZWwudHJpbSgpLFxuICAgICAgbWVzc2FnZTogXCJSZWFkeSB0byB1c2UgR2VtaW5pLlwiLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBpc0RlZmF1bHRPcGVuQUlVcmwgPVxuICAgICFzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLnRyaW0oKSB8fCBzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLmluY2x1ZGVzKFwiYXBpLm9wZW5haS5jb21cIik7XG5cbiAgaWYgKCFzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJvcGVuYWlcIixcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbWVzc2FnZTogXCJPcGVuQUkgbW9kZWwgbWlzc2luZy5cIixcbiAgICB9O1xuICB9XG5cbiAgaWYgKGlzRGVmYXVsdE9wZW5BSVVybCAmJiAhc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgIHByb3ZpZGVyOiBcIm9wZW5haVwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIk9wZW5BSSBBUEkga2V5IG1pc3NpbmcuXCIsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICBwcm92aWRlcjogXCJvcGVuYWlcIixcbiAgICBtb2RlbDogc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpLFxuICAgIG1lc3NhZ2U6IGlzRGVmYXVsdE9wZW5BSVVybFxuICAgICAgPyBcIlJlYWR5IHRvIHVzZSB0aGUgT3BlbkFJIEFQSS5cIlxuICAgICAgOiBcIlJlYWR5IHRvIHVzZSBhIGN1c3RvbSBPcGVuQUktY29tcGF0aWJsZSBlbmRwb2ludC5cIixcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgZ2V0V2luZG93U3RhcnQgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRoZXNpc0NvbnRleHQge1xuICBzb3VyY2VMYWJlbDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsO1xuICBzb3VyY2VQYXRocz86IHN0cmluZ1tdO1xuICB0ZXh0OiBzdHJpbmc7XG4gIG9yaWdpbmFsTGVuZ3RoOiBudW1iZXI7XG4gIHRydW5jYXRlZDogYm9vbGVhbjtcbiAgbWF4Q2hhcnM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRleHRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldEN1cnJlbnROb3RlQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSB2aWV3LmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnQgbm90ZSBpcyBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoXCJDdXJyZW50IG5vdGVcIiwgdmlldy5maWxlLnBhdGgsIHRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VsZWN0ZWRUZXh0Q29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSB2aWV3LmVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3Qgc29tZSB0ZXh0IGZpcnN0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChcIlNlbGVjdGVkIHRleHRcIiwgdmlldy5maWxlLnBhdGgsIHRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmVjZW50RmlsZXNDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQoc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cykuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuY29sbGVjdE1hcmtkb3duRmlsZXMoe1xuICAgICAgZXhjbHVkZUZvbGRlcnM6IFtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsIHNldHRpbmdzLnJldmlld3NGb2xkZXIsIHNldHRpbmdzLm5vdGVzRm9sZGVyXSxcbiAgICAgIGV4Y2x1ZGVQYXRoczogW3NldHRpbmdzLmluYm94RmlsZSwgc2V0dGluZ3MudGFza3NGaWxlXSxcbiAgICAgIG1pbk10aW1lOiBjdXRvZmYsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiUmVjZW50IGZpbGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IHZpZXcuZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuY29sbGVjdE1hcmtkb3duRmlsZXMoe1xuICAgICAgZXhjbHVkZUZvbGRlcnM6IFtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsIHNldHRpbmdzLnJldmlld3NGb2xkZXIsIHNldHRpbmdzLm5vdGVzRm9sZGVyXSxcbiAgICAgIGV4Y2x1ZGVQYXRoczogW3NldHRpbmdzLmluYm94RmlsZSwgc2V0dGluZ3MudGFza3NGaWxlXSxcbiAgICAgIGZvbGRlclBhdGgsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiQ3VycmVudCBmb2xkZXJcIiwgZmlsZXMsIGZvbGRlclBhdGggfHwgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlczogVEZpbGVbXSk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG1hcmtkb3duIG5vdGVcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiU2VsZWN0ZWQgbm90ZXNcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VmF1bHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5jb2xsZWN0TWFya2Rvd25GaWxlcyh7XG4gICAgICBleGNsdWRlRm9sZGVyczogW3NldHRpbmdzLnN1bW1hcmllc0ZvbGRlciwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlciwgc2V0dGluZ3Mubm90ZXNGb2xkZXJdLFxuICAgICAgZXhjbHVkZVBhdGhzOiBbc2V0dGluZ3MuaW5ib3hGaWxlLCBzZXR0aW5ncy50YXNrc0ZpbGVdLFxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIkVudGlyZSB2YXVsdFwiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dChcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFN5bnRoZXNpc0NvbnRleHQge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgbWF4Q2hhcnMgPSBNYXRoLm1heCgxMDAwLCBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpO1xuICAgIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgICBjb25zdCBvcmlnaW5hbExlbmd0aCA9IHRyaW1tZWQubGVuZ3RoO1xuICAgIGNvbnN0IHRydW5jYXRlZCA9IG9yaWdpbmFsTGVuZ3RoID4gbWF4Q2hhcnM7XG4gICAgY29uc3QgbGltaXRlZCA9IHRydW5jYXRlZCA/IHRyaW1tZWQuc2xpY2UoMCwgbWF4Q2hhcnMpLnRyaW1FbmQoKSA6IHRyaW1tZWQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc291cmNlTGFiZWwsXG4gICAgICBzb3VyY2VQYXRoLFxuICAgICAgc291cmNlUGF0aHMsXG4gICAgICB0ZXh0OiBsaW1pdGVkLFxuICAgICAgb3JpZ2luYWxMZW5ndGgsXG4gICAgICB0cnVuY2F0ZWQsXG4gICAgICBtYXhDaGFycyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBidWlsZEZpbGVHcm91cENvbnRleHQoXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBmaWxlczogVEZpbGVbXSxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICApOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBtYXJrZG93biBmaWxlcyBmb3VuZCBmb3IgJHtzb3VyY2VMYWJlbC50b0xvd2VyQ2FzZSgpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIGZpbGVzLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzLFxuICAgICk7XG5cbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG1hcmtkb3duIGZpbGVzIGZvdW5kIGZvciAke3NvdXJjZUxhYmVsLnRvTG93ZXJDYXNlKCl9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KHNvdXJjZUxhYmVsLCBzb3VyY2VQYXRoLCB0ZXh0LCBmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUucGF0aCkpO1xuICB9XG59XG5cblxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQyKGRhdGUuZ2V0TW9udGgoKSArIDEpfS0ke3BhZDIoZGF0ZS5nZXREYXRlKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3BhZDIoZGF0ZS5nZXRIb3VycygpKX06JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZVRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0gJHtmb3JtYXRUaW1lS2V5KGRhdGUpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9LSR7cGFkMihkYXRlLmdldEhvdXJzKCkpfSR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS5yZXBsYWNlKC9cXHMrJC9nLCBcIlwiKSlcbiAgICAuam9pbihcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOZXdsaW5lcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5czogbnVtYmVyKTogRGF0ZSB7XG4gIGNvbnN0IHNhZmVEYXlzID0gTWF0aC5tYXgoMSwgbG9va2JhY2tEYXlzKTtcbiAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZSgpO1xuICBzdGFydC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgc3RhcnQuc2V0RGF0ZShzdGFydC5nZXREYXRlKCkgLSAoc2FmZURheXMgLSAxKSk7XG4gIHJldHVybiBzdGFydDtcbn1cblxuZnVuY3Rpb24gcGFkMih2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHR5cGUgeyBJbmJveEVudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuY29uc3QgUkVBRF9CQVRDSF9TSVpFID0gMTA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgZmlsZXM6IFRGaWxlW10sXG4gIG1heENoYXJzOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSArPSBSRUFEX0JBVENIX1NJWkUpIHtcbiAgICBjb25zdCBiYXRjaCA9IGZpbGVzLnNsaWNlKGksIGkgKyBSRUFEX0JBVENIX1NJWkUpO1xuICAgIGNvbnN0IHRleHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBiYXRjaC5tYXAoKGZpbGUpID0+IHZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpLmNhdGNoKChlcnJvcjogdW5rbm93bikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9KSksXG4gICAgKTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYmF0Y2gubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgIGNvbnN0IGZpbGUgPSBiYXRjaFtqXTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0ZXh0c1tqXTtcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmxvY2sgPSBbYC0tLSAke2ZpbGUucGF0aH1gLCB0cmltbWVkXS5qb2luKFwiXFxuXCIpO1xuICAgICAgY29uc3Qgc2VwYXJhdG9yT3ZlcmhlYWQgPSBwYXJ0cy5sZW5ndGggPiAwID8gMiA6IDA7IC8vIFwiXFxuXFxuXCJcbiAgICAgIGlmICh0b3RhbCArIHNlcGFyYXRvck92ZXJoZWFkICsgYmxvY2subGVuZ3RoID4gbWF4Q2hhcnMpIHtcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gTWF0aC5tYXgoMCwgbWF4Q2hhcnMgLSB0b3RhbCAtIHNlcGFyYXRvck92ZXJoZWFkKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA+IDApIHtcbiAgICAgICAgICBwYXJ0cy5wdXNoKGJsb2NrLnNsaWNlKDAsIHJlbWFpbmluZykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGJsb2NrKTtcbiAgICAgIHRvdGFsICs9IHNlcGFyYXRvck92ZXJoZWFkICsgYmxvY2subGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tK3wtKyQvZywgXCJcIilcbiAgICAuc2xpY2UoMCwgNDgpIHx8IFwibm90ZVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXBwZW5kU2VwYXJhdG9yKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghdGV4dC50cmltKCkpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBpZiAodGV4dC5lbmRzV2l0aChcIlxcblxcblwiKSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXCIpKSB7XG4gICAgcmV0dXJuIFwiXFxuXCI7XG4gIH1cbiAgcmV0dXJuIFwiXFxuXFxuXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcExlYWRpbmdUaXRsZShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoIWxpbmVzLmxlbmd0aCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgaWYgKCEvXiNcXHMrLy50ZXN0KGxpbmVzWzBdKSkge1xuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIGNvbnN0IHJlbWFpbmluZyA9IGxpbmVzLnNsaWNlKDEpO1xuICB3aGlsZSAocmVtYWluaW5nLmxlbmd0aCA+IDAgJiYgIXJlbWFpbmluZ1swXS50cmltKCkpIHtcbiAgICByZW1haW5pbmcuc2hpZnQoKTtcbiAgfVxuICByZXR1cm4gcmVtYWluaW5nLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGROb3RlVGl0bGUoZW50cnk6IEluYm94RW50cnkpOiBzdHJpbmcge1xuICBjb25zdCBjYW5kaWRhdGUgPSBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgZW50cnkuaGVhZGluZztcbiAgY29uc3QgbGluZXMgPSBjYW5kaWRhdGVcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBjb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcblxuICBjb25zdCBmaXJzdCA9IGxpbmVzWzBdID8/IFwiVW50aXRsZWQgbm90ZVwiO1xuICByZXR1cm4gdHJpbVRpdGxlKGZpcnN0KTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5ib3hWYXVsdFNlcnZpY2Uge1xuICByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+O1xuICByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9PjtcbiAgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmJveEVudHJ5IHtcbiAgaGVhZGluZzogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIHJhdzogc3RyaW5nO1xuICBwcmV2aWV3OiBzdHJpbmc7XG4gIGluZGV4OiBudW1iZXI7XG4gIHNpZ25hdHVyZTogc3RyaW5nO1xuICBzaWduYXR1cmVJbmRleDogbnVtYmVyO1xuICBzdGFydExpbmU6IG51bWJlcjtcbiAgZW5kTGluZTogbnVtYmVyO1xuICByZXZpZXdlZDogYm9vbGVhbjtcbiAgcmV2aWV3QWN0aW9uOiBzdHJpbmcgfCBudWxsO1xuICByZXZpZXdlZEF0OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBJbmJveEVudHJ5SWRlbnRpdHkgPSBQaWNrPFxuICBJbmJveEVudHJ5LFxuICBcImhlYWRpbmdcIiB8IFwiYm9keVwiIHwgXCJwcmV2aWV3XCIgfCBcInNpZ25hdHVyZVwiIHwgXCJzaWduYXR1cmVJbmRleFwiXG4+ICZcbiAgUGFydGlhbDxQaWNrPEluYm94RW50cnksIFwicmF3XCIgfCBcInN0YXJ0TGluZVwiIHwgXCJlbmRMaW5lXCI+PjtcblxuZXhwb3J0IGNsYXNzIEluYm94U2VydmljZSB7XG4gIHByaXZhdGUgdW5yZXZpZXdlZENvdW50Q2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogSW5ib3hWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0UmVjZW50RW50cmllcyhsaW1pdCA9IDIwLCBpbmNsdWRlUmV2aWV3ZWQgPSBmYWxzZSk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBlbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBpbmNsdWRlUmV2aWV3ZWQgPyBlbnRyaWVzIDogZW50cmllcy5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpO1xuICAgIHJldHVybiBmaWx0ZXJlZC5zbGljZSgtbGltaXQpLnJldmVyc2UoKTtcbiAgfVxuXG4gIGFzeW5jIGdldFVucmV2aWV3ZWRDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgeyB0ZXh0LCBtdGltZSwgZXhpc3RzIH0gPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dFdpdGhNdGltZShzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGlmICghZXhpc3RzKSB7XG4gICAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0ge1xuICAgICAgICBtdGltZTogMCxcbiAgICAgICAgY291bnQ6IDAsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgJiYgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZS5tdGltZSA9PT0gbXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlLmNvdW50O1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gcGFyc2VJbmJveEVudHJpZXModGV4dCkuZmlsdGVyKChlbnRyeSkgPT4gIWVudHJ5LnJldmlld2VkKS5sZW5ndGg7XG4gICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IHtcbiAgICAgIG10aW1lLFxuICAgICAgY291bnQsXG4gICAgfTtcbiAgICByZXR1cm4gY291bnQ7XG4gIH1cblxuICBhc3luYyBtYXJrRW50cnlSZXZpZXdlZChlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgY3VycmVudEVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBjdXJyZW50RW50cnkgPVxuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZSA9PT0gZW50cnkuc2lnbmF0dXJlICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZUluZGV4ID09PSBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICAgICkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJiBjYW5kaWRhdGUucmF3ID09PSBlbnRyeS5yYXcpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuaGVhZGluZyA9PT0gZW50cnkuaGVhZGluZyAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5ib2R5ID09PSBlbnRyeS5ib2R5ICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnByZXZpZXcgPT09IGVudHJ5LnByZXZpZXcsXG4gICAgICApID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuaGVhZGluZyA9PT0gZW50cnkuaGVhZGluZyAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zdGFydExpbmUgPT09IGVudHJ5LnN0YXJ0TGluZSxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSBpbnNlcnRSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5LCBhY3Rpb24pO1xuICAgIGlmICh1cGRhdGVkID09PSBjb250ZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHNldHRpbmdzLmluYm94RmlsZSwgdXBkYXRlZCk7XG4gICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyByZW9wZW5FbnRyeShlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmUgPT09IGVudHJ5LnNpZ25hdHVyZSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmVJbmRleCA9PT0gZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgICApID8/XG4gICAgICBmaW5kVW5pcXVlUmV2aWV3ZWRTaWduYXR1cmVNYXRjaChjdXJyZW50RW50cmllcywgZW50cnkuc2lnbmF0dXJlKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICBjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuaGVhZGluZyA9PT0gZW50cnkuaGVhZGluZyAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5ib2R5ID09PSBlbnRyeS5ib2R5ICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnByZXZpZXcgPT09IGVudHJ5LnByZXZpZXcsXG4gICAgICApO1xuXG4gICAgaWYgKCFjdXJyZW50RW50cnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkID0gcmVtb3ZlUmV2aWV3TWFya2VyKGNvbnRlbnQsIGN1cnJlbnRFbnRyeSk7XG4gICAgaWYgKHVwZGF0ZWQgPT09IGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCB1cGRhdGVkKTtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmJveEVudHJpZXMoY29udGVudDogc3RyaW5nKTogSW5ib3hFbnRyeVtdIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBlbnRyaWVzOiBJbmJveEVudHJ5W10gPSBbXTtcbiAgbGV0IGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRCb2R5TGluZXM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWQgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdBY3Rpb246IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudFJldmlld2VkQXQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBjb25zdCBzaWduYXR1cmVDb3VudHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGNvbnN0IHB1c2hFbnRyeSA9IChlbmRMaW5lOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjdXJyZW50Qm9keUxpbmVzID0gW107XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm9keSA9IGN1cnJlbnRCb2R5TGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG4gICAgY29uc3QgcHJldmlldyA9IGJ1aWxkUHJldmlldyhib2R5KTtcbiAgICBjb25zdCByYXcgPSBbY3VycmVudEhlYWRpbmcsIC4uLmN1cnJlbnRCb2R5TGluZXNdLmpvaW4oXCJcXG5cIikudHJpbUVuZCgpO1xuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGJ1aWxkRW50cnlTaWduYXR1cmUoY3VycmVudEhlYWRpbmcsIGN1cnJlbnRCb2R5TGluZXMpO1xuICAgIGNvbnN0IHNpZ25hdHVyZUluZGV4ID0gc2lnbmF0dXJlQ291bnRzLmdldChzaWduYXR1cmUpID8/IDA7XG4gICAgc2lnbmF0dXJlQ291bnRzLnNldChzaWduYXR1cmUsIHNpZ25hdHVyZUluZGV4ICsgMSk7XG4gICAgZW50cmllcy5wdXNoKHtcbiAgICAgIGhlYWRpbmc6IGN1cnJlbnRIZWFkaW5nLnJlcGxhY2UoL14jI1xccysvLCBcIlwiKS50cmltKCksXG4gICAgICBib2R5LFxuICAgICAgcmF3LFxuICAgICAgcHJldmlldyxcbiAgICAgIGluZGV4OiBlbnRyaWVzLmxlbmd0aCxcbiAgICAgIHNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4LFxuICAgICAgc3RhcnRMaW5lOiBjdXJyZW50U3RhcnRMaW5lLFxuICAgICAgZW5kTGluZSxcbiAgICAgIHJldmlld2VkOiBjdXJyZW50UmV2aWV3ZWQsXG4gICAgICByZXZpZXdBY3Rpb246IGN1cnJlbnRSZXZpZXdBY3Rpb24sXG4gICAgICByZXZpZXdlZEF0OiBjdXJyZW50UmV2aWV3ZWRBdCxcbiAgICB9KTtcbiAgICBjdXJyZW50Qm9keUxpbmVzID0gW107XG4gICAgY3VycmVudFN0YXJ0TGluZSA9IC0xO1xuICAgIGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICAgIGN1cnJlbnRSZXZpZXdBY3Rpb24gPSBudWxsO1xuICAgIGN1cnJlbnRSZXZpZXdlZEF0ID0gbnVsbDtcbiAgfTtcblxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGluZXMubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgbGluZSA9IGxpbmVzW2luZGV4XTtcbiAgICBjb25zdCBoZWFkaW5nTWF0Y2ggPSBsaW5lLm1hdGNoKC9eIyNcXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoKSB7XG4gICAgICBwdXNoRW50cnkoaW5kZXgpO1xuICAgICAgY3VycmVudEhlYWRpbmcgPSBsaW5lO1xuICAgICAgY3VycmVudFN0YXJ0TGluZSA9IGluZGV4O1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFjdXJyZW50SGVhZGluZykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcmV2aWV3TWF0Y2ggPSBsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDpcXHMqKFthLXpdKykoPzpcXHMrKC4rPykpP1xccyotLT4kL2kpO1xuICAgIGlmIChyZXZpZXdNYXRjaCkge1xuICAgICAgY3VycmVudFJldmlld2VkID0gdHJ1ZTtcbiAgICAgIGN1cnJlbnRSZXZpZXdBY3Rpb24gPSByZXZpZXdNYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY3VycmVudFJldmlld2VkQXQgPSByZXZpZXdNYXRjaFsyXSA/PyBudWxsO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY3VycmVudEJvZHlMaW5lcy5wdXNoKGxpbmUpO1xuICB9XG5cbiAgcHVzaEVudHJ5KGxpbmVzLmxlbmd0aCk7XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRSZXZpZXdNYXJrZXIoY29udGVudDogc3RyaW5nLCBlbnRyeTogSW5ib3hFbnRyeSwgYWN0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGlmIChlbnRyeS5zdGFydExpbmUgPCAwIHx8IGVudHJ5LmVuZExpbmUgPCBlbnRyeS5zdGFydExpbmUgfHwgZW50cnkuZW5kTGluZSA+IGxpbmVzLmxlbmd0aCkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgdGltZXN0YW1wID0gZm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSk7XG4gIGNvbnN0IG1hcmtlciA9IGA8IS0tIGJyYWluLXJldmlld2VkOiAke2FjdGlvbn0gJHt0aW1lc3RhbXB9IC0tPmA7XG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuICBjbGVhbmVkRW50cnlMaW5lcy5wdXNoKG1hcmtlciwgXCJcIik7XG5cbiAgY29uc3QgdXBkYXRlZExpbmVzID0gW1xuICAgIC4uLmxpbmVzLnNsaWNlKDAsIGVudHJ5LnN0YXJ0TGluZSksXG4gICAgLi4uY2xlYW5lZEVudHJ5TGluZXMsXG4gICAgLi4ubGluZXMuc2xpY2UoZW50cnkuZW5kTGluZSksXG4gIF07XG5cbiAgcmV0dXJuIHRyaW1UcmFpbGluZ0JsYW5rTGluZXModXBkYXRlZExpbmVzKS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudDogc3RyaW5nLCBlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCBlbnRyeUxpbmVzID0gbGluZXMuc2xpY2UoZW50cnkuc3RhcnRMaW5lLCBlbnRyeS5lbmRMaW5lKTtcbiAgY29uc3QgY2xlYW5lZEVudHJ5TGluZXMgPSB0cmltVHJhaWxpbmdCbGFua0xpbmVzKFxuICAgIGVudHJ5TGluZXMuZmlsdGVyKChsaW5lKSA9PiAhbGluZS5tYXRjaCgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kpKSxcbiAgKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkUHJldmlldyhib2R5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGJvZHlcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICByZXR1cm4gbGluZXNbMF0gPz8gXCJcIjtcbn1cblxuZnVuY3Rpb24gYnVpbGRFbnRyeVNpZ25hdHVyZShoZWFkaW5nOiBzdHJpbmcsIGJvZHlMaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gW2hlYWRpbmcudHJpbSgpLCAuLi5ib2R5TGluZXMubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSldLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHRyaW1UcmFpbGluZ0JsYW5rTGluZXMobGluZXM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCBjbG9uZSA9IFsuLi5saW5lc107XG4gIHdoaWxlIChjbG9uZS5sZW5ndGggPiAwICYmIGNsb25lW2Nsb25lLmxlbmd0aCAtIDFdLnRyaW0oKSA9PT0gXCJcIikge1xuICAgIGNsb25lLnBvcCgpO1xuICB9XG4gIHJldHVybiBjbG9uZTtcbn1cblxuZnVuY3Rpb24gZmluZFVuaXF1ZVJldmlld2VkU2lnbmF0dXJlTWF0Y2goXG4gIGVudHJpZXM6IEluYm94RW50cnlbXSxcbiAgc2lnbmF0dXJlOiBzdHJpbmcsXG4pOiBJbmJveEVudHJ5IHwgbnVsbCB7XG4gIGNvbnN0IHJldmlld2VkTWF0Y2hlcyA9IGVudHJpZXMuZmlsdGVyKFxuICAgIChlbnRyeSkgPT4gZW50cnkucmV2aWV3ZWQgJiYgZW50cnkuc2lnbmF0dXJlID09PSBzaWduYXR1cmUsXG4gICk7XG4gIGlmIChyZXZpZXdlZE1hdGNoZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHJldmlld2VkTWF0Y2hlc1swXTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBjb2xsYXBzZUpvdXJuYWxUZXh0LCBmb3JtYXREYXRlS2V5LCBmb3JtYXRUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBKb3VybmFsU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgZ2V0Sm91cm5hbFBhdGgoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdERhdGVLZXkoZGF0ZSk7XG4gICAgcmV0dXJuIGAke3NldHRpbmdzLmpvdXJuYWxGb2xkZXJ9LyR7ZGF0ZUtleX0ubWRgO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdERhdGVLZXkoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0Sm91cm5hbFBhdGgoZGF0ZSk7XG4gICAgcmV0dXJuIHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZEpvdXJuYWxIZWFkZXIocGF0aCwgZGF0ZUtleSk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRFbnRyeSh0ZXh0OiBzdHJpbmcsIGRhdGUgPSBuZXcgRGF0ZSgpKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlSm91cm5hbFRleHQodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJKb3VybmFsIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUpvdXJuYWxGaWxlKGRhdGUpO1xuICAgIGNvbnN0IHBhdGggPSBmaWxlLnBhdGg7XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdFRpbWVLZXkoZGF0ZSl9XFxuJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBibG9jayk7XG4gICAgcmV0dXJuIHsgcGF0aCB9O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHtcbiAgY29sbGFwc2VXaGl0ZXNwYWNlLFxuICBmb3JtYXREYXRlVGltZUtleSxcbiAgZm9ybWF0U3VtbWFyeVRpbWVzdGFtcCxcbn0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IHNsdWdpZnksIHRyaW1UaXRsZSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgTm90ZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZE5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90ZSB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfVxcbi0gJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy5pbmJveEZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgY2xlYW5lZFRpdGxlID0gdHJpbVRpdGxlKHRpdGxlKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGAke2Zvcm1hdFN1bW1hcnlUaW1lc3RhbXAobm93KX0tJHtzbHVnaWZ5KGNsZWFuZWRUaXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoXG4gICAgICBgJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn0vJHtmaWxlTmFtZX1gLFxuICAgICk7XG4gICAgY29uc3Qgc291cmNlTGluZSA9IHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgID8gYCR7c291cmNlTGFiZWx9IFx1MjAyMiAke3NvdXJjZVBhdGhzLmxlbmd0aH0gJHtzb3VyY2VQYXRocy5sZW5ndGggPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gXG4gICAgICA6IHNvdXJjZVBhdGhcbiAgICAgICAgPyBgJHtzb3VyY2VMYWJlbH0gXHUyMDIyICR7c291cmNlUGF0aH1gXG4gICAgICAgIDogc291cmNlTGFiZWw7XG4gICAgY29uc3Qgc291cmNlRmlsZUxpbmVzID0gc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgPyBbXG4gICAgICAgICAgXCJTb3VyY2UgZmlsZXM6XCIsXG4gICAgICAgICAgLi4uc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpLm1hcCgoc291cmNlKSA9PiBgLSAke3NvdXJjZX1gKSxcbiAgICAgICAgICAuLi4oc291cmNlUGF0aHMubGVuZ3RoID4gMTJcbiAgICAgICAgICAgID8gW2AtIC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYF1cbiAgICAgICAgICAgIDogW10pLFxuICAgICAgICBdXG4gICAgICA6IFtdO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke2NsZWFuZWRUaXRsZX1gLFxuICAgICAgXCJcIixcbiAgICAgIGBDcmVhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIGBTb3VyY2U6ICR7c291cmNlTGluZX1gLFxuICAgICAgLi4uc291cmNlRmlsZUxpbmVzLFxuICAgICAgXCJcIixcbiAgICAgIGNvbGxhcHNlV2hpdGVzcGFjZShib2R5KSA/IGJvZHkudHJpbSgpIDogXCJObyBhcnRpZmFjdCBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgY29udGVudCk7XG4gIH1cbn1cblxuXG4iLCAiaW1wb3J0IHR5cGUgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5cbi8qKlxuICogUGF0aCB1dGlsaXR5IGZ1bmN0aW9uc1xuICovXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBwYXRoIGlzIHVuZGVyIGEgc3BlY2lmaWMgZm9sZGVyIChvciBpcyB0aGUgZm9sZGVyIGl0c2VsZikuXG4gKiBIYW5kbGVzIHRyYWlsaW5nIHNsYXNoZXMgY29uc2lzdGVudGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNVbmRlckZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIHBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXIgfHwgcGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJ9L2ApO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgcGF0aCBpcyBhIEJyYWluLWdlbmVyYXRlZCBmaWxlIChzdW1tYXJpZXMsIHJldmlld3MsIG5vdGVzLFxuICogaW5ib3gsIG9yIHRhc2tzKS4gVXNlZCB0byBleGNsdWRlIGdlbmVyYXRlZCBjb250ZW50IGZyb20gc3ludGhlc2lzXG4gKiBhbmQgY29udGV4dCBhZ2dyZWdhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQnJhaW5HZW5lcmF0ZWRQYXRoKFxuICBwYXRoOiBzdHJpbmcsXG4gIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgaXNVbmRlckZvbGRlcihwYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpIHx8XG4gICAgaXNVbmRlckZvbGRlcihwYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSB8fFxuICAgIGlzVW5kZXJGb2xkZXIocGF0aCwgc2V0dGluZ3Mubm90ZXNGb2xkZXIpIHx8XG4gICAgcGF0aCA9PT0gc2V0dGluZ3MuaW5ib3hGaWxlIHx8XG4gICAgcGF0aCA9PT0gc2V0dGluZ3MudGFza3NGaWxlXG4gICk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5IH0gZnJvbSBcIi4vaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJldmlld0xvZ0VudHJ5IGV4dGVuZHMgSW5ib3hFbnRyeUlkZW50aXR5IHtcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmc7XG4gIGZpbGVNdGltZTogbnVtYmVyO1xuICBlbnRyeUluZGV4OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdMb2dTZXJ2aWNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdFbnRyeUNvdW50Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfT4oKTtcbiAgcHJpdmF0ZSByZXZpZXdMb2dGaWxlc0NhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBmaWxlczogVEZpbGVbXTtcbiAgfSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJldmlld0VudHJ5VG90YWxDYWNoZToge1xuICAgIGxpc3RpbmdNdGltZTogbnVtYmVyO1xuICAgIHRvdGFsOiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFJldmlld0xvZyhlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShub3cpO1xuICAgIGNvbnN0IHBhdGggPSBgJHtzZXR0aW5ncy5yZXZpZXdzRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYC0gQWN0aW9uOiAke2FjdGlvbn1gLFxuICAgICAgYC0gSW5ib3g6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgYC0gUHJldmlldzogJHtlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgXCIoZW1wdHkpXCJ9YCxcbiAgICAgIGAtIFNpZ25hdHVyZTogJHtlbmNvZGVSZXZpZXdTaWduYXR1cmUoZW50cnkuc2lnbmF0dXJlKX1gLFxuICAgICAgYC0gU2lnbmF0dXJlIGluZGV4OiAke2VudHJ5LnNpZ25hdHVyZUluZGV4fWAsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSBudWxsO1xuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdMb2dGaWxlcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG5cbiAgICBpZiAoIXRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSkge1xuICAgICAgY29uc3QgYWxsRmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgICAgY29uc3QgbWF0Y2hpbmcgPSBhbGxGaWxlc1xuICAgICAgICAuZmlsdGVyKChmaWxlKSA9PiBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gICAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiBtYXRjaGluZ1swXT8uc3RhdC5tdGltZSA/PyAwLFxuICAgICAgICBmaWxlczogbWF0Y2hpbmcsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCJcbiAgICAgID8gdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlLmZpbGVzLnNsaWNlKDAsIGxpbWl0KVxuICAgICAgOiB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUuZmlsZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyaWVzKGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxSZXZpZXdMb2dFbnRyeVtdPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQpO1xuICAgIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBsb2dzKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSk7XG4gICAgICBlbnRyaWVzLnB1c2goLi4ucGFyc2VkLnJldmVyc2UoKSk7XG4gICAgICBpZiAodHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiICYmIGVudHJpZXMubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgPyBlbnRyaWVzLnNsaWNlKDAsIGxpbWl0KSA6IGVudHJpZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMoKTtcbiAgICBpZiAobG9ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWU6IDAsIHRvdGFsOiAwIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0aW5nTXRpbWUgPSBsb2dzWzBdLnN0YXQubXRpbWU7XG4gICAgaWYgKHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlPy5saXN0aW5nTXRpbWUgPT09IGxpc3RpbmdNdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlLnRvdGFsO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZW5QYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGxldCB0b3RhbCA9IDA7XG5cbiAgICBjb25zdCB1bmNhY2hlZEZpbGVzOiB0eXBlb2YgbG9ncyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGxvZ3MpIHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgaWYgKGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZSkge1xuICAgICAgICBzZWVuUGF0aHMuYWRkKGZpbGUucGF0aCk7XG4gICAgICAgIHRvdGFsICs9IGNhY2hlZC5jb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuY2FjaGVkRmlsZXMucHVzaChmaWxlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodW5jYWNoZWRGaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHVuY2FjaGVkRmlsZXMubWFwKGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICAgICAgY29uc3QgY291bnQgPSBwYXJzZVJldmlld0xvZ0VudHJpZXMoY29udGVudCwgZmlsZS5wYXRoLCBmaWxlLnN0YXQubXRpbWUpLmxlbmd0aDtcbiAgICAgICAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5zZXQoZmlsZS5wYXRoLCB7XG4gICAgICAgICAgICBtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuICAgICAgICAgICAgY291bnQsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHsgZmlsZSwgY291bnQgfTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBmb3IgKGNvbnN0IHsgZmlsZSwgY291bnQgfSBvZiByZXN1bHRzKSB7XG4gICAgICAgIHNlZW5QYXRocy5hZGQoZmlsZS5wYXRoKTtcbiAgICAgICAgdG90YWwgKz0gY291bnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmtleXMoKSkge1xuICAgICAgaWYgKCFzZWVuUGF0aHMuaGFzKHBhdGgpKSB7XG4gICAgICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmRlbGV0ZShwYXRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IHsgbGlzdGluZ010aW1lLCB0b3RhbCB9O1xuICAgIHJldHVybiB0b3RhbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyxcbiAgZmlsZU10aW1lOiBudW1iZXIsXG4pOiBSZXZpZXdMb2dFbnRyeVtdIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG4gIGxldCBjdXJyZW50VGltZXN0YW1wID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudFByZXZpZXcgPSBcIlwiO1xuICBsZXQgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICBsZXQgY3VycmVudEVudHJ5SW5kZXggPSAwO1xuXG4gIGNvbnN0IHB1c2hFbnRyeSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUaW1lc3RhbXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgYWN0aW9uOiBjdXJyZW50QWN0aW9uIHx8IFwidW5rbm93blwiLFxuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBjdXJyZW50UHJldmlldyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBzaWduYXR1cmU6IGN1cnJlbnRTaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogY3VycmVudFNpZ25hdHVyZUluZGV4LFxuICAgICAgdGltZXN0YW1wOiBjdXJyZW50VGltZXN0YW1wLFxuICAgICAgc291cmNlUGF0aCxcbiAgICAgIGZpbGVNdGltZSxcbiAgICAgIGVudHJ5SW5kZXg6IGN1cnJlbnRFbnRyeUluZGV4LFxuICAgIH0pO1xuICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICAgIGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICAgIGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgICBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gMDtcbiAgICBjdXJyZW50RW50cnlJbmRleCArPSAxO1xuICB9O1xuXG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeSgpO1xuICAgICAgY3VycmVudFRpbWVzdGFtcCA9IGhlYWRpbmdNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb25NYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0FjdGlvbjpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKGFjdGlvbk1hdGNoKSB7XG4gICAgICBjdXJyZW50QWN0aW9uID0gYWN0aW9uTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5ib3hNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0luYm94OlxccysoLispJC9pKTtcbiAgICBpZiAoaW5ib3hNYXRjaCkge1xuICAgICAgY3VycmVudEhlYWRpbmcgPSBpbmJveE1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1ByZXZpZXc6XFxzKyguKykkL2kpO1xuICAgIGlmIChwcmV2aWV3TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRQcmV2aWV3ID0gcHJldmlld01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZU1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrU2lnbmF0dXJlOlxccysoLispJC9pKTtcbiAgICBpZiAoc2lnbmF0dXJlTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRTaWduYXR1cmUgPSBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlTWF0Y2hbMV0udHJpbSgpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZUluZGV4TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmUgaW5kZXg6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVJbmRleE1hdGNoKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQoc2lnbmF0dXJlSW5kZXhNYXRjaFsxXSwgMTApO1xuICAgICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBwYXJzZWQgOiAwO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hFbnRyeSgpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gZW5jb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc2lnbmF0dXJlKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGJ1aWxkTm90ZVRpdGxlIH0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IEluYm94RW50cnksIEluYm94RW50cnlJZGVudGl0eSwgSW5ib3hTZXJ2aWNlIH0gZnJvbSBcIi4vaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgSm91cm5hbFNlcnZpY2UgfSBmcm9tIFwiLi9qb3VybmFsLXNlcnZpY2VcIjtcbmltcG9ydCB7IFRhc2tTZXJ2aWNlIH0gZnJvbSBcIi4vdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSwgUmV2aWV3TG9nU2VydmljZSB9IGZyb20gXCIuL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgTm90ZVNlcnZpY2UgfSBmcm9tIFwiLi9ub3RlLXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IG5vdGVTZXJ2aWNlOiBOb3RlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluYm94U2VydmljZTogSW5ib3hTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2U6IFRhc2tTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgam91cm5hbFNlcnZpY2U6IEpvdXJuYWxTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3TG9nU2VydmljZTogUmV2aWV3TG9nU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRJbmJveEVudHJpZXMobGltaXQgPSAyMCk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuaW5ib3hTZXJ2aWNlLmdldFJlY2VudEVudHJpZXMobGltaXQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvVGFzayhlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdGV4dCA9IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nO1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJ0YXNrXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInRhc2tcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcbiAgICAgIGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byB0YXNrIGluICR7c2F2ZWQucGF0aH1gLFxuICAgICAgbWFya2VyVXBkYXRlZCxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMga2VlcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYExlZnQgaW5ib3ggZW50cnkgaW4gJHt0aGlzLnNldHRpbmdzUHJvdmlkZXIoKS5pbmJveEZpbGV9YDtcbiAgfVxuXG4gIGFzeW5jIHNraXBFbnRyeShlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcInNraXBcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwic2tpcFwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFwiU2tpcHBlZCBpbmJveCBlbnRyeVwiLCBtYXJrZXJVcGRhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZFRvSm91cm5hbChlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KFxuICAgICAgW1xuICAgICAgICBgU291cmNlOiAke2VudHJ5LmhlYWRpbmd9YCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmcsXG4gICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgKTtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwiam91cm5hbFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJqb3VybmFsXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoYEFwcGVuZGVkIGluYm94IGVudHJ5IHRvICR7c2F2ZWQucGF0aH1gLCBtYXJrZXJVcGRhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIHByb21vdGVUb05vdGUoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHRpdGxlID0gYnVpbGROb3RlVGl0bGUoZW50cnkpO1xuICAgIGNvbnN0IGJvZHkgPSBbXG4gICAgICBcIk9yaWdpbmFsIGNhcHR1cmU6XCIsXG4gICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICB0aXRsZSxcbiAgICAgIGJvZHksXG4gICAgICBcIkJyYWluIGluYm94XCIsXG4gICAgICBudWxsLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcIm5vdGVcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwibm90ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFxuICAgICAgYFByb21vdGVkIGluYm94IGVudHJ5IHRvIG5vdGUgaW4gJHtzYXZlZC5wYXRofWAsXG4gICAgICBtYXJrZXJVcGRhdGVkLFxuICAgICk7XG4gIH1cblxuICBhc3luYyByZW9wZW5Gcm9tUmV2aWV3TG9nKGVudHJ5OiBSZXZpZXdMb2dFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgaWRlbnRpdHkgPSB7XG4gICAgICBoZWFkaW5nOiBlbnRyeS5oZWFkaW5nLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIHByZXZpZXc6IGVudHJ5LnByZXZpZXcsXG4gICAgICBzaWduYXR1cmU6IGVudHJ5LnNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICB9O1xuICAgIGNvbnN0IHJlb3BlbmVkID0gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UucmVvcGVuRW50cnkoaWRlbnRpdHkpO1xuICAgIGlmICghcmVvcGVuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlLW9wZW4gaW5ib3ggZW50cnkgJHtlbnRyeS5oZWFkaW5nfWApO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoaWRlbnRpdHksIFwicmVvcGVuXCIpO1xuICAgIHJldHVybiBgUmUtb3BlbmVkIGluYm94IGVudHJ5ICR7ZW50cnkuaGVhZGluZ31gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBtYXJrSW5ib3hSZXZpZXdlZChlbnRyeTogSW5ib3hFbnRyeSwgYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLm1hcmtFbnRyeVJldmlld2VkKGVudHJ5LCBhY3Rpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZE1hcmtlck5vdGUobWVzc2FnZTogc3RyaW5nLCBtYXJrZXJVcGRhdGVkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbWFya2VyVXBkYXRlZCA/IG1lc3NhZ2UgOiBgJHttZXNzYWdlfSAocmV2aWV3IG1hcmtlciBub3QgdXBkYXRlZClgO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KFxuICAgIGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksXG4gICAgYWN0aW9uOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJldmlld0xvZ1NlcnZpY2UuYXBwZW5kUmV2aWV3TG9nKGVudHJ5LCBhY3Rpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhbnN3ZXJRdWVzdGlvbihxdWVzdGlvbjogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHF1ZXN0aW9uIGFuc3dlcmluZ1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBcIlF1ZXN0aW9uIEFuc3dlclwiLFxuICAgICAgdGl0bGU6IFwiQW5zd2VyXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5RdWVzdGlvbihxdWVzdGlvbiksXG4gICAgICBjb250ZW50OiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHByb21wdFRleHQ6IHF1ZXN0aW9uLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gcXVlc3Rpb24udHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgUXVlc3Rpb24gJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKFxuICBpdGVtczogU2V0PHN0cmluZz4sXG4gIGVtcHR5TWVzc2FnZTogc3RyaW5nLFxuICBtYXhJdGVtcyA9IDEwLFxuKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgbWF4SXRlbXMpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmZ1bmN0aW9uIGV4dHJhY3RLZXl3b3JkcyhxdWVzdGlvbjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzdG9wd29yZHMgPSBuZXcgU2V0KFtcbiAgICBcIndoYXRcIixcbiAgICBcIndoeVwiLFxuICAgIFwiaG93XCIsXG4gICAgXCJ3aGljaFwiLFxuICAgIFwid2hlblwiLFxuICAgIFwid2hlcmVcIixcbiAgICBcIndob1wiLFxuICAgIFwid2hvbVwiLFxuICAgIFwiZG9lc1wiLFxuICAgIFwiZG9cIixcbiAgICBcImRpZFwiLFxuICAgIFwiaXNcIixcbiAgICBcImFyZVwiLFxuICAgIFwid2FzXCIsXG4gICAgXCJ3ZXJlXCIsXG4gICAgXCJ0aGVcIixcbiAgICBcImFcIixcbiAgICBcImFuXCIsXG4gICAgXCJ0b1wiLFxuICAgIFwib2ZcIixcbiAgICBcImZvclwiLFxuICAgIFwiYW5kXCIsXG4gICAgXCJvclwiLFxuICAgIFwiaW5cIixcbiAgICBcIm9uXCIsXG4gICAgXCJhdFwiLFxuICAgIFwid2l0aFwiLFxuICAgIFwiYWJvdXRcIixcbiAgICBcImZyb21cIixcbiAgICBcIm15XCIsXG4gICAgXCJvdXJcIixcbiAgICBcInlvdXJcIixcbiAgICBcInRoaXNcIixcbiAgICBcInRoYXRcIixcbiAgICBcInRoZXNlXCIsXG4gICAgXCJ0aG9zZVwiLFxuICAgIFwibWFrZVwiLFxuICAgIFwibWFkZVwiLFxuICAgIFwibmVlZFwiLFxuICAgIFwibmVlZHNcIixcbiAgICBcImNhblwiLFxuICAgIFwiY291bGRcIixcbiAgICBcInNob3VsZFwiLFxuICAgIFwid291bGRcIixcbiAgICBcIndpbGxcIixcbiAgICBcImhhdmVcIixcbiAgICBcImhhc1wiLFxuICAgIFwiaGFkXCIsXG4gIF0pO1xuXG4gIHJldHVybiBBcnJheS5mcm9tKFxuICAgIG5ldyBTZXQoXG4gICAgICBxdWVzdGlvblxuICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAuc3BsaXQoL1teYS16MC05XSsvZylcbiAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoKHdvcmQpID0+IHdvcmQubGVuZ3RoID49IDQgJiYgIXN0b3B3b3Jkcy5oYXMod29yZCkpLFxuICAgICksXG4gICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNRdWVzdGlvbihsaW5lOiBzdHJpbmcsIGtleXdvcmRzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoIWtleXdvcmRzLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4ga2V5d29yZHMuc29tZSgoa2V5d29yZCkgPT4gbG93ZXIuaW5jbHVkZXMoa2V5d29yZCkpO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RXZpZGVuY2UoY29udGVudDogc3RyaW5nLCBxdWVzdGlvbjogc3RyaW5nKToge1xuICBldmlkZW5jZTogU2V0PHN0cmluZz47XG4gIG1hdGNoZWQ6IGJvb2xlYW47XG59IHtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5d29yZHMgPSBleHRyYWN0S2V5d29yZHMocXVlc3Rpb24pO1xuICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oaGVhZGluZ1RleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMykpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihoZWFkaW5nVGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQgJiYgKG1hdGNoZXNRdWVzdGlvbih0YXNrVGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAzKSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKHRhc2tUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oYnVsbGV0VGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCA0KSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGJ1bGxldFRleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChtYXRjaGVzUXVlc3Rpb24obGluZSwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAyKSB7XG4gICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGxpbmUsIGtleXdvcmRzKSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGV2aWRlbmNlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGV2aWRlbmNlLFxuICAgIG1hdGNoZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIocXVlc3Rpb246IHN0cmluZywgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZFF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShxdWVzdGlvbik7XG4gIGNvbnN0IHsgZXZpZGVuY2UsIG1hdGNoZWQgfSA9IGNvbGxlY3RFdmlkZW5jZShjb250ZW50LCBjbGVhbmVkUXVlc3Rpb24pO1xuICBjb25zdCBhbnN3ZXJMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAobWF0Y2hlZCkge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXG4gICAgICBcIkkgZm91bmQgdGhlc2UgbGluZXMgaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQgdGhhdCBkaXJlY3RseSBtYXRjaCB5b3VyIHF1ZXN0aW9uLlwiLFxuICAgICk7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRoZSBjb250ZXh0IGRvZXMgbm90IHByb3ZpZGUgYSBmdWxseSB2ZXJpZmllZCBhbnN3ZXIsIHNvIHRyZWF0IHRoaXMgYXMgYSBncm91bmRlZCBzdW1tYXJ5LlwiKTtcbiAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplKSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcbiAgICAgIFwiSSBjb3VsZCBub3QgZmluZCBhIGRpcmVjdCBtYXRjaCBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dCwgc28gdGhlc2UgYXJlIHRoZSBjbG9zZXN0IGxpbmVzIGF2YWlsYWJsZS5cIixcbiAgICApO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUcmVhdCB0aGlzIGFzIG5lYXJieSBjb250ZXh0IHJhdGhlciB0aGFuIGEgY29uZmlybWVkIGFuc3dlci5cIik7XG4gIH0gZWxzZSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIkkgY291bGQgbm90IGZpbmQgYSBkaXJlY3QgYW5zd2VyIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0LlwiKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVHJ5IG5hcnJvd2luZyB0aGUgcXVlc3Rpb24gb3Igc2VsZWN0aW5nIGEgbW9yZSBzcGVjaWZpYyBub3RlIG9yIGZvbGRlci5cIik7XG4gIH1cblxuICBjb25zdCBmb2xsb3dVcHMgPSBtYXRjaGVkIHx8IGV2aWRlbmNlLnNpemVcbiAgICA/IG5ldyBTZXQoW1xuICAgICAgICBcIkFzayBhIG5hcnJvd2VyIHF1ZXN0aW9uIGlmIHlvdSB3YW50IGEgbW9yZSBzcGVjaWZpYyBhbnN3ZXIuXCIsXG4gICAgICAgIFwiT3BlbiB0aGUgc291cmNlIG5vdGUgb3IgZm9sZGVyIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXCIsXG4gICAgICBdKVxuICAgIDogbmV3IFNldChbXG4gICAgICAgIFwiUHJvdmlkZSBtb3JlIGV4cGxpY2l0IGNvbnRleHQgb3Igc2VsZWN0IGEgZGlmZmVyZW50IG5vdGUgb3IgZm9sZGVyLlwiLFxuICAgICAgXSk7XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgY2xlYW5lZFF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEFuc3dlclwiLFxuICAgIGFuc3dlckxpbmVzLmpvaW4oXCIgXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGRpcmVjdCBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICBwYXJzZWQuYW5zd2VyIHx8IFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgcGFyc2VkLmV2aWRlbmNlIHx8IFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBxdWVzdGlvbjogc3RyaW5nO1xuICBhbnN3ZXI6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiUXVlc3Rpb25cIiB8IFwiQW5zd2VyXCIgfCBcIkV2aWRlbmNlXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFF1ZXN0aW9uOiBbXSxcbiAgICBBbnN3ZXI6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoUXVlc3Rpb258QW5zd2VyfEV2aWRlbmNlfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbjogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5RdWVzdGlvbl0pLFxuICAgIGFuc3dlcjogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkFuc3dlciksXG4gICAgZXZpZGVuY2U6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5FdmlkZW5jZSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBRdWVzdGlvbjogc3RyaW5nW107XG4gIEFuc3dlcjogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImFuc3dlclwiKSB7XG4gICAgcmV0dXJuIFwiQW5zd2VyXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlF1ZXN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSxcbn0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5LCBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLCBnZXRXaW5kb3dTdGFydCB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LWZvcm1hdFwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1bW1hcnlSZXN1bHQge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHBlcnNpc3RlZFBhdGg/OiBzdHJpbmc7XG4gIHVzZWRBSTogYm9vbGVhbjtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN1bW1hcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cz86IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9IGxvb2tiYWNrRGF5cyA/PyBzZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzO1xuICAgIGNvbnN0IGN1dG9mZiA9IGdldFdpbmRvd1N0YXJ0KGVmZmVjdGl2ZUxvb2tiYWNrRGF5cykuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuY29sbGVjdE1hcmtkb3duRmlsZXMoe1xuICAgICAgZXhjbHVkZUZvbGRlcnM6IFtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsIHNldHRpbmdzLnJldmlld3NGb2xkZXJdLFxuICAgICAgbWluTXRpbWU6IGN1dG9mZixcbiAgICB9KTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGxldCBzdW1tYXJ5ID0gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudCk7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc3VtbWFyeSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN1bW1hcml6ZShjb250ZW50IHx8IHN1bW1hcnksIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgc3VtbWFyeVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwZXJzaXN0ZWRQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdGl0bGUgPSBsYWJlbCA/IGAke2xhYmVsfSBTdW1tYXJ5YCA6IFwiU3VtbWFyeVwiO1xuICAgIGlmIChzZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKG5ldyBEYXRlKCkpO1xuICAgICAgY29uc3QgZmlsZUxhYmVsID0gbGFiZWwgPyBgJHtsYWJlbC50b0xvd2VyQ2FzZSgpfS0ke3RpbWVzdGFtcH1gIDogdGltZXN0YW1wO1xuICAgICAgY29uc3QgcmVxdWVzdGVkUGF0aCA9IGAke3NldHRpbmdzLnN1bW1hcmllc0ZvbGRlcn0vJHtmaWxlTGFiZWx9Lm1kYDtcbiAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChyZXF1ZXN0ZWRQYXRoKTtcbiAgICAgIGNvbnN0IGRpc3BsYXlUaW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBbXG4gICAgICAgIGAjICR7dGl0bGV9ICR7ZGlzcGxheVRpbWVzdGFtcH1gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBgIyMgV2luZG93YCxcbiAgICAgICAgZWZmZWN0aXZlTG9va2JhY2tEYXlzID09PSAxID8gXCJUb2RheVwiIDogYExhc3QgJHtlZmZlY3RpdmVMb29rYmFja0RheXN9IGRheXNgLFxuICAgICAgICBcIlwiLFxuICAgICAgICBzdW1tYXJ5LnRyaW0oKSxcbiAgICAgIF0uam9pbihcIlxcblwiKTtcbiAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgYm9keSk7XG4gICAgICBwZXJzaXN0ZWRQYXRoID0gcGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogc3VtbWFyeSxcbiAgICAgIHBlcnNpc3RlZFBhdGgsXG4gICAgICB1c2VkQUksXG4gICAgICB0aXRsZSxcbiAgICB9O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24gfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBjbGVhblN1bW1hcnlMaW5lKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiAodGV4dCA/PyBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFRhc2tTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBcIi0gTm8gcmVjZW50IHRhc2tzIGZvdW5kLlwiO1xuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtIFsgXSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGhpZ2hsaWdodHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGhlYWRpbmdbMV0pKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gY2xlYW5TdW1tYXJ5TGluZSh0YXNrWzJdKTtcbiAgICAgIHRhc2tzLmFkZCh0ZXh0KTtcbiAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gY2xlYW5TdW1tYXJ5TGluZShidWxsZXRbMl0pO1xuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgaGlnaGxpZ2h0cy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoaGlnaGxpZ2h0cy5zaXplIDwgNSAmJiBsaW5lLmxlbmd0aCA8PSAxNDApIHtcbiAgICAgIGhpZ2hsaWdodHMuYWRkKGNsZWFuU3VtbWFyeUxpbmUobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oaGlnaGxpZ2h0cywgXCJObyByZWNlbnQgbm90ZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIGZvcm1hdFRhc2tTZWN0aW9uKHRhc2tzKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJOb3RoaW5nIHBlbmRpbmcgZnJvbSByZWNlbnQgbm90ZXMuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tUYXNrRXh0cmFjdGlvbiB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3QtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tPcGVuUXVlc3Rpb25zIH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZiB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNSZXN1bHQge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbm90ZVRpdGxlOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICBwcm9tcHRUZXh0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3ludGhlc2lzU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBydW4odGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gdGhpcy5idWlsZEZhbGxiYWNrKHRlbXBsYXRlLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN5bnRoZXNpemVDb250ZXh0KHRlbXBsYXRlLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN5bnRoZXNpc1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIHRpdGxlOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIG5vdGVUaXRsZTogYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gJHtnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKX1gLFxuICAgICAgY29udGVudDogdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRmFsbGJhY2sodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24odGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsZEZhbGxiYWNrU3ludGhlc2lzKHRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9jb250ZXh0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRMb2NhdGlvbihjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nIHtcbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY291bnQgPSBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aDtcbiAgICByZXR1cm4gYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gXHUyMDIyICR7Y291bnR9ICR7Y291bnQgPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIHJldHVybiBgJHtjb250ZXh0LnNvdXJjZUxhYmVsfSBcdTIwMjIgJHtjb250ZXh0LnNvdXJjZVBhdGh9YDtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LnNvdXJjZUxhYmVsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbGluZXMgPSBbYENvbnRleHQgc291cmNlOiAke2NvbnRleHQuc291cmNlTGFiZWx9YF07XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIGxpbmVzLnB1c2goYENvbnRleHQgcGF0aDogJHtjb250ZXh0LnNvdXJjZVBhdGh9YCk7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBsaW5lcy5wdXNoKFwiQ29udGV4dCBmaWxlczpcIik7XG4gICAgY29uc3QgdmlzaWJsZSA9IGNvbnRleHQuc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiB2aXNpYmxlKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICR7cGF0aH1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiB2aXNpYmxlLmxlbmd0aCkge1xuICAgICAgbGluZXMucHVzaChgLSAuLi5hbmQgJHtjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCAtIHZpc2libGUubGVuZ3RofSBtb3JlYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnRleHQudHJ1bmNhdGVkKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGBDb250ZXh0IHdhcyB0cnVuY2F0ZWQgdG8gJHtjb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbGluZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0U291cmNlTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbGluZXMgPSBbYFNvdXJjZTogJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBdO1xuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICBsaW5lcy5wdXNoKGBTb3VyY2UgcGF0aDogJHtjb250ZXh0LnNvdXJjZVBhdGh9YCk7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBsaW5lcy5wdXNoKFwiU291cmNlIGZpbGVzOlwiKTtcbiAgICBjb25zdCB2aXNpYmxlID0gY29udGV4dC5zb3VyY2VQYXRocy5zbGljZSgwLCAxMik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHZpc2libGUpIHtcbiAgICAgIGxpbmVzLnB1c2gocGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgIGxpbmVzLnB1c2goYC4uLmFuZCAke2NvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoIC0gdmlzaWJsZS5sZW5ndGh9IG1vcmVgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29udGV4dC50cnVuY2F0ZWQpIHtcbiAgICBsaW5lcy5wdXNoKFxuICAgICAgYENvbnRleHQgdHJ1bmNhdGVkIHRvICR7Y29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi9kYXRlXCI7XG5pbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5pbXBvcnQgdHlwZSB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHR5cGUgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzIH0gZnJvbSBcIi4vY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IHN0cmlwTGVhZGluZ1RpdGxlIH0gZnJvbSBcIi4vdGV4dFwiO1xuXG5mdW5jdGlvbiBhZGRTdW1tYXJ5TGluZShcbiAgc3VtbWFyeTogU2V0PHN0cmluZz4sXG4gIHRleHQ6IHN0cmluZyxcbiAgbWF4SXRlbXMgPSA0LFxuKTogdm9pZCB7XG4gIGlmIChzdW1tYXJ5LnNpemUgPj0gbWF4SXRlbXMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICBpZiAoIWNsZWFuZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBzdW1tYXJ5LmFkZChjbGVhbmVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3VtbWFyeSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0aGVtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgdGhlbWVzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBoZWFkaW5nVGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgZm9sbG93VXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB0aGVtZXMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIHRhc2tUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICB0aGVtZXMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgYnVsbGV0VGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGZvbGxvd1Vwcy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuXG4gICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgbGluZSk7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHN1bW1hcnksIFwiTm8gc291cmNlIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGhlbWVzLCBcIk5vIGtleSB0aGVtZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQoXG4gIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBgQWN0aW9uOiAke3Jlc3VsdC5hY3Rpb259YCxcbiAgICBgR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgYENvbnRleHQgbGVuZ3RoOiAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9IGNoYXJhY3RlcnMuYCxcbiAgICBcIlwiLFxuICAgIHN0cmlwTGVhZGluZ1RpdGxlKHJlc3VsdC5jb250ZW50KSxcbiAgICBcIlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEluc2VydGVkU3ludGhlc2lzQ29udGVudChcbiAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gW1xuICAgIGAjIyBCcmFpbiAke3Jlc3VsdC50aXRsZX1gLFxuICAgIC4uLmZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0KS5tYXAoKGxpbmUpID0+IGAtICR7bGluZX1gKSxcbiAgICBgLSBHZW5lcmF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YCxcbiAgICBcIlwiLFxuICAgIHN0cmlwTGVhZGluZ1RpdGxlKHJlc3VsdC5jb250ZW50KSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VTeW50aGVzaXNTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgIHBhcnNlZC5zdW1tYXJ5IHx8IFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICBwYXJzZWQua2V5VGhlbWVzIHx8IFwiTm8ga2V5IHRoZW1lcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3ludGhlc2lzU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGtleVRoZW1lczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJTdW1tYXJ5XCIgfCBcIktleSBUaGVtZXNcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgU3VtbWFyeTogW10sXG4gICAgXCJLZXkgVGhlbWVzXCI6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhTdW1tYXJ5fEtleSBUaGVtZXN8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnk6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuU3VtbWFyeV0pLFxuICAgIGtleVRoZW1lczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFRoZW1lc1wiXSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBTdW1tYXJ5OiBzdHJpbmdbXTtcbiAgXCJLZXkgVGhlbWVzXCI6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHRoZW1lc1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFRoZW1lc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJTdW1tYXJ5XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIHRhc2tzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGNvbnRleHQuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGFza3MsIFwiTm8gdGFza3MgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oY29udGV4dCwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBwYXJzZWQudGFza3MgfHwgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgVGFza3NcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHRhc2tzOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiVGFza3NcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBUYXNrczogW10sXG4gICAgQ29udGV4dDogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFRhc2tzfENvbnRleHR8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGNvbnRleHQ6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuQ29udGV4dF0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiVGFza3NcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gbG9va3NMaWtlUmF0aW9uYWxlKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImJlY2F1c2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNvIHRoYXRcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImR1ZSB0b1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicmVhc29uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ0cmFkZW9mZlwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uc3RyYWludFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VEZWNpc2lvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpZGVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImRlY2lzaW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjaG9vc2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNoaXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFkb3B0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkcm9wXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzd2l0Y2hcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tEZWNpc2lvbkV4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZGVjaXNpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHJhdGlvbmFsZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lIHx8IGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoZGVjaXNpb25zLnNpemUgPCAzKSB7XG4gICAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByYXRpb25hbGUuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VEZWNpc2lvbihsaW5lKSkge1xuICAgICAgZGVjaXNpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZVJhdGlvbmFsZShsaW5lKSkge1xuICAgICAgcmF0aW9uYWxlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZGVjaXNpb25zLCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHJhdGlvbmFsZSwgXCJObyBleHBsaWNpdCByYXRpb25hbGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIFwiTm8gZGVjaXNpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VEZWNpc2lvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBwYXJzZWQuZGVjaXNpb25zIHx8IFwiTm8gY2xlYXIgZGVjaXNpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgcGFyc2VkLnJhdGlvbmFsZSB8fCBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGVjaXNpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGRlY2lzaW9uczogc3RyaW5nO1xuICByYXRpb25hbGU6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIkRlY2lzaW9uc1wiIHwgXCJSYXRpb25hbGVcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiwgc3RyaW5nW10+ID0ge1xuICAgIERlY2lzaW9uczogW10sXG4gICAgUmF0aW9uYWxlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKERlY2lzaW9uc3xSYXRpb25hbGV8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkZWNpc2lvbnM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuRGVjaXNpb25zXSksXG4gICAgcmF0aW9uYWxlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuUmF0aW9uYWxlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgRGVjaXNpb25zOiBzdHJpbmdbXTtcbiAgUmF0aW9uYWxlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJyYXRpb25hbGVcIikge1xuICAgIHJldHVybiBcIlJhdGlvbmFsZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIkRlY2lzaW9uc1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBsb29rc0xpa2VRdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibm90IHN1cmVcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRm9sbG93VXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZm9sbG93IHVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZXh0IHN0ZXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImludmVzdGlnYXRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjb25maXJtXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ2YWxpZGF0ZVwiKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBjb250ZXh0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZUZvbGxvd1VwKHRleHQpKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5zaXplIDwgNikge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZVF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNpemUgPCA0KSB7XG4gICAgICBjb250ZXh0LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3BlbiBRdWVzdGlvbnNcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPcGVuIFF1ZXN0aW9uc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl1dKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuQ29udGV4dCksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5UG9pbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgcXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oa2V5UG9pbnRzLCBcIk5vIGtleSBwb2ludHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUNsZWFuTm90ZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgcGFyc2VkLmtleVBvaW50cyB8fCBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBrZXlQb2ludHM6IHN0cmluZztcbiAgcXVlc3Rpb25zOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiS2V5IFBvaW50c1wiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIFwiS2V5IFBvaW50c1wiOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEtleSBQb2ludHN8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGtleVBvaW50czogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFBvaW50c1wiXSksXG4gICAgcXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBcIktleSBQb2ludHNcIjogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHBvaW50c1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFBvaW50c1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG92ZXJ2aWV3ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGdvYWxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHNjb3BlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG5leHRTdGVwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICBzY29wZS5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICBuZXh0U3RlcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgICAgZ29hbHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBzY29wZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VHb2FsKGJ1bGxldFRleHQpKSB7XG4gICAgICAgICAgZ29hbHMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlR29hbChsaW5lKSkge1xuICAgICAgZ29hbHMuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH0gZWxzZSBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBHb2Fsc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGdvYWxzLCBcIk5vIGdvYWxzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgU2NvcGVcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihzY29wZSwgXCJObyBzY29wZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihuZXh0U3RlcHMsIFwiTm8gbmV4dCBzdGVwcyBmb3VuZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlR29hbCh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImdvYWwgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImdvYWxzIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZWVkIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZWVkcyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwid2FudCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwid2FudHMgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaG91bGQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJtdXN0IFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwib2JqZWN0aXZlXCIpXG4gICk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVByb2plY3RCcmllZlNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgIHBhcnNlZC5nb2FscyB8fCBcIk5vIGdvYWxzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICBwYXJzZWQuc2NvcGUgfHwgXCJObyBzY29wZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBwYXJzZWQubmV4dFN0ZXBzIHx8IFwiTm8gbmV4dCBzdGVwcyBleHRyYWN0ZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEdvYWxzXCIsXG4gICAgXCJObyBnb2FscyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFNjb3BlXCIsXG4gICAgXCJObyBzY29wZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBcIk5vIG5leHQgc3RlcHMgZXh0cmFjdGVkLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUHJvamVjdEJyaWVmU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBnb2Fsczogc3RyaW5nO1xuICBzY29wZTogc3RyaW5nO1xuICBuZXh0U3RlcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJPdmVydmlld1wiIHwgXCJHb2Fsc1wiIHwgXCJTY29wZVwiIHwgXCJOZXh0IFN0ZXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgR29hbHM6IFtdLFxuICAgIFNjb3BlOiBbXSxcbiAgICBcIk5leHQgU3RlcHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3ZlcnZpZXd8R29hbHN8U2NvcGV8TmV4dCBTdGVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAgZ29hbHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5Hb2FscyksXG4gICAgc2NvcGU6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5TY29wZSksXG4gICAgbmV4dFN0ZXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJOZXh0IFN0ZXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIEdvYWxzOiBzdHJpbmdbXTtcbiAgU2NvcGU6IHN0cmluZ1tdO1xuICBcIk5leHQgU3RlcHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZ29hbHNcIikge1xuICAgIHJldHVybiBcIkdvYWxzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwic2NvcGVcIikge1xuICAgIHJldHVybiBcIlNjb3BlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwibmV4dCBzdGVwc1wiKSB7XG4gICAgcmV0dXJuIFwiTmV4dCBTdGVwc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiVGFzayBFeHRyYWN0aW9uXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgIHJldHVybiBcIkRlY2lzaW9uIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgcmV0dXJuIFwiQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIlByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcnlcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlKTogc3RyaW5nIHtcbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgVGFza3NcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBEZWNpc2lvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IE9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJSZXdyaXRlIGFzIENsZWFuIE5vdGVcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICByZXR1cm4gXCJEcmFmdCBQcm9qZWN0IEJyaWVmXCI7XG4gIH1cblxuICByZXR1cm4gXCJTdW1tYXJpemVcIjtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1RvcGljUGFnZSB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBjbGFzcyBUb3BpY1BhZ2VTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZSh0b3BpYzogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWRUb3BpYyA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyk7XG4gICAgaWYgKCFjbGVhbmVkVG9waWMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvcGljIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgICBjb250ZXh0LnRleHQsXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZShjbGVhbmVkVG9waWMsIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgdG9waWMgcGFnZSBnZW5lcmF0aW9uXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gZW5zdXJlVG9waWNCdWxsZXQoXG4gICAgICBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudCksXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiVG9waWMgUGFnZVwiLFxuICAgICAgdGl0bGU6IFwiVG9waWMgUGFnZVwiLFxuICAgICAgbm90ZVRpdGxlOiBzaG9ydGVuVG9waWMoY2xlYW5lZFRvcGljKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50LFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogY2xlYW5lZFRvcGljLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlVG9waWNCdWxsZXQoY29udGVudDogc3RyaW5nLCB0b3BpYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBvdmVydmlld0luZGV4ID0gbGluZXMuZmluZEluZGV4KChsaW5lKSA9PiAvXiMjXFxzK092ZXJ2aWV3XFxzKiQvaS50ZXN0KGxpbmUpKTtcbiAgaWYgKG92ZXJ2aWV3SW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCBuZXh0SGVhZGluZ0luZGV4ID0gbGluZXMuZmluZEluZGV4KFxuICAgIChsaW5lLCBpbmRleCkgPT4gaW5kZXggPiBvdmVydmlld0luZGV4ICYmIC9eIyNcXHMrLy50ZXN0KGxpbmUpLFxuICApO1xuICBjb25zdCB0b3BpY0xpbmUgPSBgLSBUb3BpYzogJHtub3JtYWxpemVkVG9waWN9YDtcbiAgY29uc3Qgb3ZlcnZpZXdTbGljZSA9IGxpbmVzLnNsaWNlKFxuICAgIG92ZXJ2aWV3SW5kZXggKyAxLFxuICAgIG5leHRIZWFkaW5nSW5kZXggPT09IC0xID8gbGluZXMubGVuZ3RoIDogbmV4dEhlYWRpbmdJbmRleCxcbiAgKTtcbiAgaWYgKG92ZXJ2aWV3U2xpY2Uuc29tZSgobGluZSkgPT4gbGluZS50cmltKCkudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKFwiLSB0b3BpYzpcIikpKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCBpbnNlcnRpb25JbmRleCA9IG92ZXJ2aWV3SW5kZXggKyAxO1xuICBjb25zdCB1cGRhdGVkID0gWy4uLmxpbmVzXTtcbiAgdXBkYXRlZC5zcGxpY2UoaW5zZXJ0aW9uSW5kZXgsIDAsIHRvcGljTGluZSk7XG4gIHJldHVybiB1cGRhdGVkLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNob3J0ZW5Ub3BpYyh0b3BpYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZCA9IHRvcGljLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbiAgaWYgKGNsZWFuZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIGNsZWFuZWQgfHwgYFRvcGljICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YDtcbiAgfVxuXG4gIHJldHVybiBgJHtjbGVhbmVkLnNsaWNlKDAsIDU3KS50cmltRW5kKCl9Li4uYDtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZU9wZW5RdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwib3BlbiBpc3N1ZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VOZXh0U3RlcCh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5leHQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImZvbGxvdyB1cFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJmb2xsb3ctdXBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwidG9kbyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwidG8tZG8gXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaG91bGQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZWVkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmVlZHMgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJtdXN0IFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiYWN0aW9uXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNvdXJjZXMoXG4gIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIHNvdXJjZVBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBpZiAoc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBzb3VyY2VQYXRocy5zbGljZSgwLCAxMikpIHtcbiAgICAgIHNvdXJjZXMuYWRkKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2VQYXRocy5sZW5ndGggPiAxMikge1xuICAgICAgc291cmNlcy5hZGQoYC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHNvdXJjZVBhdGgpIHtcbiAgICBzb3VyY2VzLmFkZChzb3VyY2VQYXRoKTtcbiAgfSBlbHNlIHtcbiAgICBzb3VyY2VzLmFkZChzb3VyY2VMYWJlbCk7XG4gIH1cblxuICByZXR1cm4gZm9ybWF0TGlzdFNlY3Rpb24oc291cmNlcywgXCJObyBleHBsaWNpdCBzb3VyY2VzIGZvdW5kLlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gIHRvcGljOiBzdHJpbmcsXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgc291cmNlUGF0aHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBuZXh0U3RlcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihoZWFkaW5nVGV4dCkpIHtcbiAgICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvb2tzTGlrZU5leHRTdGVwKGhlYWRpbmdUZXh0KSkge1xuICAgICAgICAgIG5leHRTdGVwcy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGV2aWRlbmNlLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIG5leHRTdGVwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihidWxsZXRUZXh0KSkge1xuICAgICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb29rc0xpa2VOZXh0U3RlcChidWxsZXRUZXh0KSkge1xuICAgICAgICAgIG5leHRTdGVwcy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24obGluZSkpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGV2aWRlbmNlLnNpemUgPCA0KSB7XG4gICAgICBldmlkZW5jZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFuZXh0U3RlcHMuc2l6ZSkge1xuICAgIG5leHRTdGVwcy5hZGQoXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGAtIFRvcGljOiAke3NhZmVDb2xsYXBzZVdoaXRlc3BhY2UodG9waWMpfWAsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGV2aWRlbmNlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgU291cmNlc1wiLFxuICAgIGZvcm1hdFNvdXJjZXMoc291cmNlTGFiZWwsIHNvdXJjZVBhdGgsIHNvdXJjZVBhdGhzKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG5leHRTdGVwcywgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVG9waWNQYWdlU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIHBhcnNlZC5ldmlkZW5jZSB8fCBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBwYXJzZWQub3BlblF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNvdXJjZXNcIixcbiAgICAgIHBhcnNlZC5zb3VyY2VzIHx8IFwiTm8gc291cmNlcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBwYXJzZWQubmV4dFN0ZXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgXCJObyBzb3VyY2VzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRvcGljUGFnZVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xuICBzb3VyY2VzOiBzdHJpbmc7XG4gIG5leHRTdGVwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcbiAgICBcIk92ZXJ2aWV3XCIgfCBcIkV2aWRlbmNlXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIgfCBcIlNvdXJjZXNcIiB8IFwiTmV4dCBTdGVwc1wiLFxuICAgIHN0cmluZ1tdXG4gID4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIFNvdXJjZXM6IFtdLFxuICAgIFwiTmV4dCBTdGVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaChcbiAgICAgIC9eIyNcXHMrKE92ZXJ2aWV3fEV2aWRlbmNlfE9wZW4gUXVlc3Rpb25zfFNvdXJjZXN8TmV4dCBTdGVwcylcXHMqJC9pLFxuICAgICk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGV2aWRlbmNlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuRXZpZGVuY2UpLFxuICAgIG9wZW5RdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgICBzb3VyY2VzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuU291cmNlcyksXG4gICAgbmV4dFN0ZXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJOZXh0IFN0ZXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbiAgU291cmNlczogc3RyaW5nW107XG4gIFwiTmV4dCBTdGVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJldmlkZW5jZVwiKSB7XG4gICAgcmV0dXJuIFwiRXZpZGVuY2VcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJzb3VyY2VzXCIpIHtcbiAgICByZXR1cm4gXCJTb3VyY2VzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwibmV4dCBzdGVwc1wiKSB7XG4gICAgcmV0dXJuIFwiTmV4dCBTdGVwc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUYXNrVmF1bHRTZXJ2aWNlIHtcbiAgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xuICByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFRhc2tTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBvcGVuVGFza0NvdW50Q2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVGFza1ZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmRUYXNrKHRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhc2sgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2sgPSBgLSBbIF0gJHtjbGVhbmVkfSBfKGFkZGVkICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9KV9gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQoc2V0dGluZ3MudGFza3NGaWxlLCBibG9jayk7XG4gICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB7IHBhdGg6IHNldHRpbmdzLnRhc2tzRmlsZSB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgeyB0ZXh0LCBtdGltZSwgZXhpc3RzIH0gPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dFdpdGhNdGltZShzZXR0aW5ncy50YXNrc0ZpbGUpO1xuICAgIGlmICghZXhpc3RzKSB7XG4gICAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGNvdW50OiAwLFxuICAgICAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSAmJiB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZS5tdGltZSA9PT0gbXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZS5jb3VudDtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IHRleHRcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAvXi0gXFxbKCB8eHxYKVxcXS8udGVzdChsaW5lKSlcbiAgICAgIC5maWx0ZXIoKGxpbmUpID0+ICEvXi0gXFxbKHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAubGVuZ3RoO1xuICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxufVxuIiwgImltcG9ydCB7IHJlcXVlc3RVcmwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvc3VtbWFyeS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyB9IGZyb20gXCIuLi91dGlscy9jb250ZXh0LWZvcm1hdFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGdldENvZGV4QmluYXJ5UGF0aCB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5cbnR5cGUgUm91dGVMYWJlbCA9IFwibm90ZVwiIHwgXCJ0YXNrXCIgfCBcImpvdXJuYWxcIiB8IG51bGw7XG5cbmludGVyZmFjZSBHZW1pbmlDb250ZW50UGFydCB7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEdlbWluaVJlcXVlc3RCb2R5IHtcbiAgY29udGVudHM6IEFycmF5PHsgcm9sZTogc3RyaW5nOyBwYXJ0czogR2VtaW5pQ29udGVudFBhcnRbXSB9PjtcbiAgZ2VuZXJhdGlvbkNvbmZpZzoge1xuICAgIHRlbXBlcmF0dXJlOiBudW1iZXI7XG4gICAgbWF4T3V0cHV0VG9rZW5zOiBudW1iZXI7XG4gIH07XG4gIHN5c3RlbV9pbnN0cnVjdGlvbj86IHtcbiAgICBwYXJ0czogR2VtaW5pQ29udGVudFBhcnRbXTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENoYXRDb21wbGV0aW9uQ2hvaWNlIHtcbiAgbWVzc2FnZT86IHtcbiAgICBjb250ZW50Pzogc3RyaW5nO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQ2hhdENvbXBsZXRpb25SZXNwb25zZSB7XG4gIGNob2ljZXM/OiBDaGF0Q29tcGxldGlvbkNob2ljZVtdO1xufVxuXG5leHBvcnQgY2xhc3MgQnJhaW5BSVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgYXN5bmMgc3VtbWFyaXplKHRleHQ6IHN0cmluZywgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSBzdW1tYXJpemUgbWFya2Rvd24gdmF1bHQgY29udGVudC4gUmVzcG9uZCB3aXRoIGNvbmNpc2UgbWFya2Rvd24gdXNpbmcgdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIlN1bW1hcml6ZSB0aGUgZm9sbG93aW5nIHZhdWx0IGNvbnRlbnQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSB0YXNrcy5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHRleHQsXG4gICAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXSk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3VtbWFyeShyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBzeW50aGVzaXplQ29udGV4dChcbiAgICB0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBwcm9tcHQgPSB0aGlzLmJ1aWxkUHJvbXB0KHRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBwcm9tcHQpO1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSh0ZW1wbGF0ZSwgcmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgcm91dGVUZXh0KHRleHQ6IHN0cmluZywgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBQcm9taXNlPFJvdXRlTGFiZWw+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJDbGFzc2lmeSBjYXB0dXJlIHRleHQgaW50byBleGFjdGx5IG9uZSBvZjogbm90ZSwgdGFzaywgam91cm5hbC4gUmV0dXJuIG9uZSB3b3JkIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiQ2xhc3NpZnkgdGhlIGZvbGxvd2luZyB1c2VyIGlucHV0IGFzIGV4YWN0bHkgb25lIG9mOlwiLFxuICAgICAgICAgIFwibm90ZVwiLFxuICAgICAgICAgIFwidGFza1wiLFxuICAgICAgICAgIFwiam91cm5hbFwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJSZXR1cm4gb25seSBvbmUgd29yZC5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHRleHQsXG4gICAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXSk7XG5cbiAgICBjb25zdCBjbGVhbmVkID0gcmVzcG9uc2UudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGNsZWFuZWQgPT09IFwibm90ZVwiIHx8IGNsZWFuZWQgPT09IFwidGFza1wiIHx8IGNsZWFuZWQgPT09IFwiam91cm5hbFwiKSB7XG4gICAgICByZXR1cm4gY2xlYW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyBhbnN3ZXJRdWVzdGlvbihcbiAgICBxdWVzdGlvbjogc3RyaW5nLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IGFuc3dlciBxdWVzdGlvbnMgdXNpbmcgZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBvbmx5LiBSZXNwb25kIHdpdGggY29uY2lzZSBtYXJrZG93biB1c2luZyB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkgYW5kIGRvIG5vdCBpbnZlbnQgZmFjdHMuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiQW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlc3Rpb24gdXNpbmcgb25seSB0aGUgY29udGV4dCBiZWxvdy5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIGBRdWVzdGlvbjogJHtxdWVzdGlvbn1gLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJSZXR1cm4gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyBBbnN3ZXJcIixcbiAgICAgICAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgICAgICAgXCIjIyBBbnN3ZXJcIixcbiAgICAgICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIklmIHRoZSBjb250ZXh0IGlzIGluc3VmZmljaWVudCwgc2F5IHNvIGV4cGxpY2l0bHkuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXSk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQocmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKFxuICAgIHRvcGljOiBzdHJpbmcsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgdHVybiBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gYSBkdXJhYmxlIHdpa2kgcGFnZS4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seSBhbmQgZG8gbm90IGludmVudCBmYWN0cy5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgYENyZWF0ZSBhIHRvcGljIHBhZ2UgZm9yOiAke3RvcGljfWAsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgICAgIGAtIFRvcGljOiAke3RvcGljfWAsXG4gICAgICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICBcIiMjIFNvdXJjZXNcIixcbiAgICAgICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIGtlZXAgdGhlIHBhZ2UgcmV1c2FibGUuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXSk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdENoYXRDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChzZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImNvZGV4XCIpIHtcbiAgICAgIHJldHVybiB0aGlzLnBvc3RDb2RleENvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzKTtcbiAgICB9XG4gICAgaWYgKHNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLnBvc3RHZW1pbmlDb21wbGV0aW9uKHNldHRpbmdzLCBtZXNzYWdlcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnBvc3RPcGVuQUlDb21wbGV0aW9uKHNldHRpbmdzLCBtZXNzYWdlcyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDb2RleENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBleGVjRmlsZUFzeW5jLCBmcywgb3MsIHBhdGggfSA9IGdldENvZGV4UnVudGltZSgpO1xuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgfVxuICAgIGNvbnN0IHRlbXBEaXIgPSBhd2FpdCBmcy5ta2R0ZW1wKHBhdGguam9pbihvcy50bXBkaXIoKSwgXCJicmFpbi1jb2RleC1cIikpO1xuICAgIGNvbnN0IG91dHB1dEZpbGUgPSBwYXRoLmpvaW4odGVtcERpciwgXCJyZXNwb25zZS50eHRcIik7XG4gICAgY29uc3QgYXJncyA9IFtcbiAgICAgIFwiZXhlY1wiLFxuICAgICAgXCItLXNraXAtZ2l0LXJlcG8tY2hlY2tcIixcbiAgICAgIFwiLS1lcGhlbWVyYWxcIixcbiAgICAgIFwiLS1zYW5kYm94XCIsXG4gICAgICBcInJlYWQtb25seVwiLFxuICAgICAgXCItLW91dHB1dC1sYXN0LW1lc3NhZ2VcIixcbiAgICAgIG91dHB1dEZpbGUsXG4gICAgXTtcblxuICAgIGlmIChzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgYXJncy5wdXNoKFwiLS1tb2RlbFwiLCBzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSk7XG4gICAgfVxuXG4gICAgYXJncy5wdXNoKHRoaXMuYnVpbGRDb2RleFByb21wdChtZXNzYWdlcykpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIGFyZ3MsIHtcbiAgICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCAqIDQsXG4gICAgICAgIGN3ZDogdGVtcERpcixcbiAgICAgIH0pO1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKG91dHB1dEZpbGUsIFwidXRmOFwiKTtcbiAgICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChpc0Vub2VudEVycm9yKGVycm9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCBDTEkgaXMgbm90IGluc3RhbGxlZC4gSW5zdGFsbCBgQG9wZW5haS9jb2RleGAgYW5kIHJ1biBgY29kZXggbG9naW5gIGZpcnN0LlwiKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBmcy5ybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29kZXhQcm9tcHQoXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiWW91IGFyZSByZXNwb25kaW5nIGluc2lkZSBCcmFpbiwgYW4gT2JzaWRpYW4gcGx1Z2luLlwiLFxuICAgICAgXCJEbyBub3QgcnVuIHNoZWxsIGNvbW1hbmRzLCBpbnNwZWN0IHRoZSBmaWxlc3lzdGVtLCBvciBtb2RpZnkgZmlsZXMuXCIsXG4gICAgICBcIlVzZSBvbmx5IHRoZSBjb250ZW50IHByb3ZpZGVkIGJlbG93IGFuZCBhbnN3ZXIgd2l0aCBtYXJrZG93biBvbmx5LlwiLFxuICAgICAgXCJcIixcbiAgICAgIC4uLm1lc3NhZ2VzLm1hcCgobWVzc2FnZSkgPT4gYCR7bWVzc2FnZS5yb2xlLnRvVXBwZXJDYXNlKCl9OlxcbiR7bWVzc2FnZS5jb250ZW50fWApLFxuICAgIF0uam9pbihcIlxcblxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdE9wZW5BSUNvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgaXNEZWZhdWx0VXJsID0gIXNldHRpbmdzLm9wZW5BSUJhc2VVcmwgfHwgc2V0dGluZ3Mub3BlbkFJQmFzZVVybC5pbmNsdWRlcyhcImFwaS5vcGVuYWkuY29tXCIpO1xuICAgIGlmIChpc0RlZmF1bHRVcmwgJiYgIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5BSSBBUEkga2V5IGlzIG1pc3NpbmdcIik7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH07XG5cbiAgICBpZiAoc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSkge1xuICAgICAgaGVhZGVyc1tcIkF1dGhvcml6YXRpb25cIl0gPSBgQmVhcmVyICR7c2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKX1gO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLnRyaW0oKSB8fCBcImh0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEvY2hhdC9jb21wbGV0aW9uc1wiLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1vZGVsOiBzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCksXG4gICAgICAgIG1lc3NhZ2VzLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4yLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzdWx0Lmpzb24gYXMgQ2hhdENvbXBsZXRpb25SZXNwb25zZTtcbiAgICBjb25zdCBjb250ZW50ID0ganNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgPz8gXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdEdlbWluaUNvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCFzZXR0aW5ncy5nZW1pbmlBcGlLZXkudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW1pbmkgQVBJIGtleSBpcyBtaXNzaW5nXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHN5c3RlbU1lc3NhZ2UgPSBtZXNzYWdlcy5maW5kKChtKSA9PiBtLnJvbGUgPT09IFwic3lzdGVtXCIpO1xuICAgIGNvbnN0IHVzZXJNZXNzYWdlcyA9IG1lc3NhZ2VzLmZpbHRlcigobSkgPT4gbS5yb2xlICE9PSBcInN5c3RlbVwiKTtcblxuICAgIC8vIENvbnZlcnQgT3BlbkFJIG1lc3NhZ2VzIHRvIEdlbWluaSBmb3JtYXRcbiAgICBjb25zdCBjb250ZW50cyA9IHVzZXJNZXNzYWdlcy5tYXAoKG0pID0+ICh7XG4gICAgICByb2xlOiBtLnJvbGUgPT09IFwidXNlclwiID8gXCJ1c2VyXCIgOiBcIm1vZGVsXCIsXG4gICAgICBwYXJ0czogW3sgdGV4dDogbS5jb250ZW50IH1dLFxuICAgIH0pKTtcblxuICAgIGNvbnN0IGJvZHk6IEdlbWluaVJlcXVlc3RCb2R5ID0ge1xuICAgICAgY29udGVudHMsXG4gICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjIsXG4gICAgICAgIG1heE91dHB1dFRva2VuczogMjA0OCxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGlmIChzeXN0ZW1NZXNzYWdlKSB7XG4gICAgICBib2R5LnN5c3RlbV9pbnN0cnVjdGlvbiA9IHtcbiAgICAgICAgcGFydHM6IFt7IHRleHQ6IHN5c3RlbU1lc3NhZ2UuY29udGVudCB9XSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzLyR7c2V0dGluZ3MuZ2VtaW5pTW9kZWx9OmdlbmVyYXRlQ29udGVudD9rZXk9JHtzZXR0aW5ncy5nZW1pbmlBcGlLZXl9YCxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgIH0pO1xuXG4gICAgY29uc3QganNvbiA9IHJlc3VsdC5qc29uO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBqc29uLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dCA/PyBcIlwiO1xuICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbWluaSByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFByb21wdChcbiAgICB0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PiB7XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgYWN0aW9uYWJsZSB0YXNrcyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3QgdGFza3MgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgICAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSBpdGVtcy5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IHJld3JpdGUgZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGEgY2xlYW4gbWFya2Rvd24gbm90ZS4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiUmV3cml0ZSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSB0aGUgc3RydWN0dXJlIG9mIGEgcmV1c2FibGUgbm90ZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCBkZWNpc2lvbnMgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IGRlY2lzaW9ucyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICAgICAgICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgdW5jZXJ0YWludHkgd2hlcmUgY29udGV4dCBpcyBpbmNvbXBsZXRlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgdW5yZXNvbHZlZCBxdWVzdGlvbnMgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IG9wZW4gcXVlc3Rpb25zIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIGtlZXAgdW5jZXJ0YWludHkgZXhwbGljaXQuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZHJhZnQgYSBwcm9qZWN0IGJyaWVmIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRHJhZnQgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgcHJvamVjdCBzdHJ1Y3R1cmUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHR1cm4gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGNvbmNpc2UgbWFya2Rvd24gc3ludGhlc2lzLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIlN1bW1hcml6ZSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIGl0ZW1zLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF07XG4gIH1cblxuICBwcml2YXRlIG5vcm1hbGl6ZSh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsIHJlc3BvbnNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dChyZXNwb25zZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNFbm9lbnRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJjb2RlXCIgaW4gZXJyb3IgJiYgZXJyb3IuY29kZSA9PT0gXCJFTk9FTlRcIjtcbn1cblxuZnVuY3Rpb24gZ2V0Q29kZXhSdW50aW1lKCk6IHtcbiAgZXhlY0ZpbGVBc3luYzogKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG4gIGZzOiB0eXBlb2YgaW1wb3J0KFwiZnNcIikucHJvbWlzZXM7XG4gIG9zOiB0eXBlb2YgaW1wb3J0KFwib3NcIik7XG4gIHBhdGg6IHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpO1xufSB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgZXhlY0ZpbGUgfSA9IHJlcShcImNoaWxkX3Byb2Nlc3NcIikgYXMgdHlwZW9mIGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuXG4gIHJldHVybiB7XG4gICAgZXhlY0ZpbGVBc3luYzogcHJvbWlzaWZ5KGV4ZWNGaWxlKSBhcyAoXG4gICAgICBmaWxlOiBzdHJpbmcsXG4gICAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgKSA9PiBQcm9taXNlPHsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+LFxuICAgIGZzOiAocmVxKFwiZnNcIikgYXMgdHlwZW9mIGltcG9ydChcImZzXCIpKS5wcm9taXNlcyxcbiAgICBvczogcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpLFxuICAgIHBhdGg6IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIiksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVSZXF1aXJlKCk6IE5vZGVSZXF1aXJlIHtcbiAgcmV0dXJuIEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKSBhcyBOb2RlUmVxdWlyZTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3VtbWFyeShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VTdW1tYXJ5U2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICBwYXJzZWQuaGlnaGxpZ2h0cyB8fCBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBwYXJzZWQudGFza3MgfHwgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHJlY2VudCBub3Rlcy5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyByZWNlbnQgbm90ZXMuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VTdW1tYXJ5U2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBoaWdobGlnaHRzOiBzdHJpbmc7XG4gIHRhc2tzOiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIkhpZ2hsaWdodHNcIiB8IFwiVGFza3NcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgSGlnaGxpZ2h0czogW10sXG4gICAgVGFza3M6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhIaWdobGlnaHRzfFRhc2tzfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBoaWdobGlnaHRzOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkhpZ2hsaWdodHNdKSxcbiAgICB0YXNrczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlRhc2tzKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIEhpZ2hsaWdodHM6IHN0cmluZ1tdO1xuICBUYXNrczogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJ0YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiVGFza3NcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiSGlnaGxpZ2h0c1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IENvZGV4TG9naW5TdGF0dXMsIGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5BdXRoU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBCcmFpblBsdWdpbikge31cblxuICBhc3luYyBsb2dpbihwcm92aWRlcjogXCJvcGVuYWlcIiB8IFwiY29kZXhcIiB8IFwiZ2VtaW5pXCIpIHtcbiAgICBsZXQgdXJsID0gXCJcIjtcbiAgICBpZiAocHJvdmlkZXIgPT09IFwib3BlbmFpXCIpIHtcbiAgICAgIHVybCA9IFwiaHR0cHM6Ly9wbGF0Zm9ybS5vcGVuYWkuY29tL2FwaS1rZXlzXCI7XG4gICAgICBuZXcgTm90aWNlKFwiT3BlbiB0aGUgT3BlbkFJIEFQSSBrZXkgcGFnZSwgY3JlYXRlIGEga2V5LCB0aGVuIHBhc3RlIGl0IGludG8gQnJhaW4gc2V0dGluZ3MuXCIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09IFwiY29kZXhcIikge1xuICAgICAgdXJsID0gXCJodHRwczovL29wZW5haS5jb20vY29kZXgvZ2V0LXN0YXJ0ZWQvXCI7XG4gICAgICBuZXcgTm90aWNlKFwiSW5zdGFsbCB0aGUgQ29kZXggQ0xJLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiByZXR1cm4gdG8gQnJhaW4gYW5kIHNlbGVjdCB0aGUgQ29kZXggcHJvdmlkZXIuXCIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIHVybCA9IFwiaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL2FwcC9hcGlrZXlcIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJPcGVuIHRoZSBHZW1pbmkgQVBJIGtleSBwYWdlLCB0aGVuIHBhc3RlIHRoZSBrZXkgaW50byBCcmFpbiBzZXR0aW5ncy5cIik7XG4gICAgfVxuXG4gICAgd2luZG93Lm9wZW4odXJsKTtcbiAgfVxuXG4gIGFzeW5jIGdldENvZGV4U3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICAgIHJldHVybiBnZXRDb2RleExvZ2luU3RhdHVzKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBub3JtYWxpemVQYXRoLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgU2V0KFtcbiAgICAgIHNldHRpbmdzLmpvdXJuYWxGb2xkZXIsXG4gICAgICBzZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgIHNldHRpbmdzLnJldmlld3NGb2xkZXIsXG4gICAgICBwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5ib3hGaWxlKSxcbiAgICAgIHBhcmVudEZvbGRlcihzZXR0aW5ncy50YXNrc0ZpbGUpLFxuICAgIF0pO1xuXG4gICAgZm9yIChjb25zdCBmb2xkZXIgb2YgZm9sZGVycykge1xuICAgICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoZm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUZvbGRlcklmTWlzc2luZyhjdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIShleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZvbGRlcjogJHtjdXJyZW50fWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgaW5pdGlhbENvbnRlbnQgPSBcIlwiKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIobm9ybWFsaXplZCkpO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaW5pdGlhbENvbnRlbnQpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBleGlzdHM6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKSxcbiAgICAgIG10aW1lOiBmaWxlLnN0YXQubXRpbWUsXG4gICAgICBleGlzdHM6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgY29uc3Qgc2VwYXJhdG9yID0gY3VycmVudC5sZW5ndGggPT09IDBcbiAgICAgID8gXCJcIlxuICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXFxuXCIpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICAgICAgICA/IFwiXFxuXCJcbiAgICAgICAgICA6IFwiXFxuXFxuXCI7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAke2N1cnJlbnR9JHtzZXBhcmF0b3J9JHtub3JtYWxpemVkQ29udGVudH1gKTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBub3JtYWxpemVkQ29udGVudCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBlbnN1cmVVbmlxdWVGaWxlUGF0aChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIGNvbnN0IGRvdEluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdEluZGV4ID09PSAtMSA/IG5vcm1hbGl6ZWQgOiBub3JtYWxpemVkLnNsaWNlKDAsIGRvdEluZGV4KTtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3RJbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZShkb3RJbmRleCk7XG5cbiAgICBsZXQgY291bnRlciA9IDI7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7Y291bnRlcn0ke2V4dGVuc2lvbn1gO1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY2FuZGlkYXRlKSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgICAgY291bnRlciArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEpvdXJuYWxIZWFkZXIoZmlsZVBhdGg6IHN0cmluZywgZGF0ZUtleTogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgsIGAjICR7ZGF0ZUtleX1cXG5cXG5gKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG4gIH1cblxuICBhc3luYyBjb2xsZWN0TWFya2Rvd25GaWxlcyhvcHRpb25zOiB7XG4gICAgZXhjbHVkZUZvbGRlcnM/OiBzdHJpbmdbXTtcbiAgICBleGNsdWRlUGF0aHM/OiBzdHJpbmdbXTtcbiAgICBtaW5NdGltZT86IG51bWJlcjtcbiAgICBmb2xkZXJQYXRoPzogc3RyaW5nO1xuICB9ID0ge30pOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBsZXQgZmlsZXMgPSBhd2FpdCB0aGlzLmxpc3RNYXJrZG93bkZpbGVzKCk7XG5cbiAgICBpZiAob3B0aW9ucy5leGNsdWRlRm9sZGVycykge1xuICAgICAgZm9yIChjb25zdCBmb2xkZXIgb2Ygb3B0aW9ucy5leGNsdWRlRm9sZGVycykge1xuICAgICAgICBmaWxlcyA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBmb2xkZXIpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5leGNsdWRlUGF0aHMpIHtcbiAgICAgIGNvbnN0IGV4Y2x1ZGVkID0gbmV3IFNldChvcHRpb25zLmV4Y2x1ZGVQYXRocyk7XG4gICAgICBmaWxlcyA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4gIWV4Y2x1ZGVkLmhhcyhmaWxlLnBhdGgpKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5taW5NdGltZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBmaWxlcyA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IG9wdGlvbnMubWluTXRpbWUhKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5mb2xkZXJQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZpbGVzID0gZmlsZXMuZmlsdGVyKChmaWxlKSA9PlxuICAgICAgICBvcHRpb25zLmZvbGRlclBhdGhcbiAgICAgICAgICA/IGlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBvcHRpb25zLmZvbGRlclBhdGgpXG4gICAgICAgICAgOiAhZmlsZS5wYXRoLmluY2x1ZGVzKFwiL1wiKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGVzLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlRm9sZGVySWZNaXNzaW5nKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xuICAgICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50Rm9sZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gIGNvbnN0IGluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIik7XG4gIHJldHVybiBpbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFF1ZXN0aW9uU2NvcGUsIFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBDb250ZXh0U2VydmljZSwgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0LCBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IFRvcGljUGFnZVNlcnZpY2UgfSBmcm9tIFwiLi90b3BpYy1wYWdlLXNlcnZpY2VcIjtcbmltcG9ydCB7IFF1ZXN0aW9uU2VydmljZSB9IGZyb20gXCIuL3F1ZXN0aW9uLXNlcnZpY2VcIjtcbmltcG9ydCB7IE5vdGVTZXJ2aWNlIH0gZnJvbSBcIi4vbm90ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBGaWxlR3JvdXBQaWNrZXJNb2RhbCB9IGZyb20gXCIuLi92aWV3cy9maWxlLWdyb3VwLXBpY2tlci1tb2RhbFwiO1xuaW1wb3J0IHsgUHJvbXB0TW9kYWwgfSBmcm9tIFwiLi4vdmlld3MvcHJvbXB0LW1vZGFsc1wiO1xuaW1wb3J0IHsgUXVlc3Rpb25TY29wZU1vZGFsIH0gZnJvbSBcIi4uL3ZpZXdzL3F1ZXN0aW9uLXNjb3BlLW1vZGFsXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHRNb2RhbCB9IGZyb20gXCIuLi92aWV3cy9zeW50aGVzaXMtcmVzdWx0LW1vZGFsXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVBpY2tlck1vZGFsIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuaW1wb3J0IHsgYnVpbGRTeW50aGVzaXNOb3RlQ29udGVudCwgYnVpbGRJbnNlcnRlZFN5bnRoZXNpc0NvbnRlbnQgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLWZvcm1hdFwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcbmltcG9ydCB7IGlzQnJhaW5HZW5lcmF0ZWRQYXRoIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IGdldEFwcGVuZFNlcGFyYXRvciB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnJhaW5Xb3JrZmxvd0NhbGxiYWNrcyB7XG4gIHVwZGF0ZVJlc3VsdCh0ZXh0OiBzdHJpbmcpOiB2b2lkO1xuICB1cGRhdGVTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQ7XG4gIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIGhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpOiBib29sZWFuO1xuICBzZXRMYXN0U3VtbWFyeUF0KGRhdGU6IERhdGUpOiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgQnJhaW5Xb3JrZmxvd1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbnRleHRTZXJ2aWNlOiBDb250ZXh0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHN5bnRoZXNpc1NlcnZpY2U6IFN5bnRoZXNpc1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0b3BpY1BhZ2VTZXJ2aWNlOiBUb3BpY1BhZ2VTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcXVlc3Rpb25TZXJ2aWNlOiBRdWVzdGlvblNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBub3RlU2VydmljZTogTm90ZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBjYWxsYmFja3M6IEJyYWluV29ya2Zsb3dDYWxsYmFja3MsXG4gICkge31cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnROb3RlKGRlZmF1bHRUZW1wbGF0ZT86IFN5bnRoZXNpc1RlbXBsYXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgZGVmYXVsdFRlbXBsYXRlID8gXCJTdW1tYXJpemUgQ3VycmVudCBOb3RlXCIgOiBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgICBkZWZhdWx0VGVtcGxhdGUsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0U2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZFRleHRDb250ZXh0KCksXG4gICAgICBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgIFwiZXh0cmFjdC10YXNrc1wiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFJlY2VudEZpbGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRSZWNlbnRGaWxlc0NvbnRleHQoKSxcbiAgICAgIFwiQ2xlYW4gTm90ZSBGcm9tIFJlY2VudCBGaWxlc1wiLFxuICAgICAgXCJyZXdyaXRlLWNsZWFuLW5vdGVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgXCJEcmFmdCBCcmllZiBGcm9tIEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICBcImRyYWZ0LXByb2plY3QtYnJpZWZcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZU5vdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzY29wZSA9IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiU3ludGhlc2l6ZSBOb3Rlc1wiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyB0byBTeW50aGVzaXplXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcGxhdGUgPSBhd2FpdCB0aGlzLnBpY2tTeW50aGVzaXNUZW1wbGF0ZShcIlN5bnRoZXNpemUgTm90ZXNcIik7XG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoZXNlIG5vdGVzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoXCJub3RlXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwiZm9sZGVyXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFzayBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoZGVmYXVsdFNjb3BlPzogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0b3BpYyA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJUb3BpYyBvciBxdWVzdGlvbiB0byB0dXJuIGludG8gYSB3aWtpIHBhZ2UuLi5cIixcbiAgICAgICAgc3VibWl0TGFiZWw6IFwiQ3JlYXRlXCIsXG4gICAgICAgIG11bHRpbGluZTogdHJ1ZSxcbiAgICAgIH0pLm9wZW5Qcm9tcHQoKTtcbiAgICAgIGlmICghdG9waWMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IGRlZmF1bHRTY29wZSA/PyBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICAgICAgc2NvcGUsXG4gICAgICAgIFwiU2VsZWN0IE5vdGVzIGZvciBUb3BpYyBQYWdlXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZSh0b3BpYywgY29udGV4dCk7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgICAgcmVzdWx0Lm5vdGVUaXRsZSxcbiAgICAgICAgcmVzdWx0LmNvbnRlbnQsXG4gICAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aCxcbiAgICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuY2FsbGJhY2tzLnNldExhc3RTdW1tYXJ5QXQobmV3IERhdGUoKSk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy51cGRhdGVTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnVwZGF0ZVJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIHRvcGljIHBhZ2Ugc2F2ZWQgdG8gJHtzYXZlZC5wYXRofWBcbiAgICAgICAgICA6IGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLnJlZnJlc2hTdGF0dXMoKTtcbiAgICAgIG5ldyBOb3RpY2UoYFRvcGljIHBhZ2Ugc2F2ZWQgdG8gJHtzYXZlZC5wYXRofWApO1xuXG4gICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgICAgaWYgKGxlYWYpIHtcbiAgICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShzYXZlZCk7XG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGNyZWF0ZSB0aGF0IHRvcGljIHBhZ2VcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2F2ZVN5bnRoZXNpc1Jlc3VsdChcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5ub3RlU2VydmljZS5jcmVhdGVHZW5lcmF0ZWROb3RlKFxuICAgICAgcmVzdWx0Lm5vdGVUaXRsZSxcbiAgICAgIGJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgcmV0dXJuIGBTYXZlZCBhcnRpZmFjdCB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkaXRpb24gPSBidWlsZEluc2VydGVkU3ludGhlc2lzQ29udGVudChyZXN1bHQsIGNvbnRleHQpO1xuICAgIGNvbnN0IGVkaXRvciA9IHZpZXcuZWRpdG9yO1xuICAgIGNvbnN0IGxhc3RMaW5lID0gZWRpdG9yLmxhc3RMaW5lKCk7XG4gICAgY29uc3QgbGFzdExpbmVUZXh0ID0gZWRpdG9yLmdldExpbmUobGFzdExpbmUpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9uID0geyBsaW5lOiBsYXN0TGluZSwgY2g6IGxhc3RMaW5lVGV4dC5sZW5ndGggfTtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBnZXRBcHBlbmRTZXBhcmF0b3IoZWRpdG9yLmdldFZhbHVlKCkpO1xuICAgIGVkaXRvci5yZXBsYWNlUmFuZ2UoYCR7c2VwYXJhdG9yfSR7YWRkaXRpb259XFxuYCwgZW5kUG9zaXRpb24pO1xuICAgIHJldHVybiBgSW5zZXJ0ZWQgc3ludGhlc2lzIGludG8gJHt2aWV3LmZpbGUucGF0aH1gO1xuICB9XG5cbiAgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza0JyYWluRm9yQ29udGV4dChcbiAgICByZXNvbHZlcjogKCkgPT4gUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PixcbiAgICBtb2RhbFRpdGxlOiBzdHJpbmcsXG4gICAgZGVmYXVsdFRlbXBsYXRlPzogU3ludGhlc2lzVGVtcGxhdGUsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcmVzb2x2ZXIoKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gZGVmYXVsdFRlbXBsYXRlID8/IChhd2FpdCB0aGlzLnBpY2tTeW50aGVzaXNUZW1wbGF0ZShtb2RhbFRpdGxlKSk7XG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoYXQgY29udGV4dFwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGU6IFF1ZXN0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBzd2l0Y2ggKHNjb3BlKSB7XG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJ2YXVsdFwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRWYXVsdENvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBFbnRpcmUgVmF1bHRcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcImdyb3VwXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICBzY29wZTogUXVlc3Rpb25TY29wZSxcbiAgICBncm91cFBpY2tlclRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dCB8IG51bGw+IHtcbiAgICBzd2l0Y2ggKHNjb3BlKSB7XG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJmb2xkZXJcIjpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJ2YXVsdFwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRWYXVsdENvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJncm91cFwiOiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKGdyb3VwUGlja2VyVGl0bGUpO1xuICAgICAgICBpZiAoIWZpbGVzIHx8ICFmaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlcyk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRTZWxlY3RlZEdyb3VwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGlja1NlbGVjdGVkTWFya2Rvd25GaWxlcyhcIlNlbGVjdCBOb3Rlc1wiKTtcbiAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlcyksXG4gICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IFNlbGVjdGVkIE5vdGVzXCIsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHNlbGVjdCBub3RlcyBmb3IgQnJhaW5cIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwaWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKHRpdGxlOiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlW10gfCBudWxsPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0XG4gICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNCcmFpbkdlbmVyYXRlZFBhdGgoZmlsZS5wYXRoLCBzZXR0aW5ncykpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuXG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBtYXJrZG93biBmaWxlcyBmb3VuZFwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBuZXcgRmlsZUdyb3VwUGlja2VyTW9kYWwodGhpcy5hcHAsIGZpbGVzLCB7XG4gICAgICB0aXRsZSxcbiAgICB9KS5vcGVuUGlja2VyKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgcmVzb2x2ZXI6ICgpID0+IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4sXG4gICAgbW9kYWxUaXRsZTogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHJlc29sdmVyKCk7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogbW9kYWxUaXRsZSxcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiQXNrIGEgcXVlc3Rpb24gYWJvdXQgdGhpcyBjb250ZXh0Li4uXCIsXG4gICAgICAgIHN1Ym1pdExhYmVsOiBcIkFza1wiLFxuICAgICAgICBtdWx0aWxpbmU6IHRydWUsXG4gICAgICB9KS5vcGVuUHJvbXB0KCk7XG4gICAgICBpZiAoIXF1ZXN0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVzdGlvblNlcnZpY2UuYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb24sIGNvbnRleHQpO1xuICAgICAgdGhpcy5jYWxsYmFja3Muc2V0TGFzdFN1bW1hcnlBdChuZXcgRGF0ZSgpKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnVwZGF0ZVN1bW1hcnkocmVzdWx0LmNvbnRlbnQpO1xuICAgICAgdGhpcy5jYWxsYmFja3MudXBkYXRlUmVzdWx0KFxuICAgICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgQUkgYW5zd2VyIGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBcbiAgICAgICAgICA6IGBMb2NhbCBhbnN3ZXIgZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YCxcbiAgICAgICk7XG4gICAgICBhd2FpdCB0aGlzLmNhbGxiYWNrcy5yZWZyZXNoU3RhdHVzKCk7XG4gICAgICBuZXcgU3ludGhlc2lzUmVzdWx0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgcmVzdWx0LFxuICAgICAgICBjYW5JbnNlcnQ6IHRoaXMuY2FsbGJhY2tzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgICBvbkluc2VydDogYXN5bmMgKCkgPT4gdGhpcy5pbnNlcnRTeW50aGVzaXNJbnRvQ3VycmVudE5vdGUocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgICAgb25TYXZlOiBhc3luYyAoKSA9PiB0aGlzLnNhdmVTeW50aGVzaXNSZXN1bHQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgICAgb25BY3Rpb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmNhbGxiYWNrcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICAgIH0sXG4gICAgICB9KS5vcGVuKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYW5zd2VyIHRoYXQgcXVlc3Rpb25cIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5TeW50aGVzaXNGbG93KFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN5bnRoZXNpc1NlcnZpY2UucnVuKHRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICB0aGlzLmNhbGxiYWNrcy5zZXRMYXN0U3VtbWFyeUF0KG5ldyBEYXRlKCkpO1xuICAgIHRoaXMuY2FsbGJhY2tzLnVwZGF0ZVN1bW1hcnkocmVzdWx0LmNvbnRlbnQpO1xuICAgIHRoaXMuY2FsbGJhY2tzLnVwZGF0ZVJlc3VsdChcbiAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgPyBgQUkgJHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX0gZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YFxuICAgICAgICA6IGBMb2NhbCAke3Jlc3VsdC50aXRsZS50b0xvd2VyQ2FzZSgpfSBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5jYWxsYmFja3MucmVmcmVzaFN0YXR1cygpO1xuICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgY29udGV4dCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGNhbkluc2VydDogdGhpcy5jYWxsYmFja3MuaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCksXG4gICAgICBvbkluc2VydDogYXN5bmMgKCkgPT4gdGhpcy5pbnNlcnRTeW50aGVzaXNJbnRvQ3VycmVudE5vdGUocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIG9uU2F2ZTogYXN5bmMgKCkgPT4gdGhpcy5zYXZlU3ludGhlc2lzUmVzdWx0KHJlc3VsdCwgY29udGV4dCksXG4gICAgICBvbkFjdGlvbkNvbXBsZXRlOiBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNhbGxiYWNrcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICB9LFxuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGlja1N5bnRoZXNpc1RlbXBsYXRlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBUZW1wbGF0ZVBpY2tlck1vZGFsKHRoaXMuYXBwLCB7IHRpdGxlIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW50ZXJmYWNlIEZpbGVHcm91cFBpY2tlck1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBGaWxlUm93IHtcbiAgZmlsZTogVEZpbGU7XG4gIGNoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50O1xuICByb3c6IEhUTUxFbGVtZW50O1xufVxuXG5leHBvcnQgY2xhc3MgRmlsZUdyb3VwUGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogVEZpbGVbXSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIHNlYXJjaElucHV0ITogSFRNTElucHV0RWxlbWVudDtcbiAgcHJpdmF0ZSByb3dzOiBGaWxlUm93W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZpbGVzOiBURmlsZVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogRmlsZUdyb3VwUGlja2VyTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFRGaWxlW10gfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBvbmUgb3IgbW9yZSBub3RlcyB0byB1c2UgYXMgY29udGV4dC5cIixcbiAgICB9KTtcblxuICAgIHRoaXMuc2VhcmNoSW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiRmlsdGVyIG5vdGVzLi4uXCIsXG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmZpbHRlclJvd3ModGhpcy5zZWFyY2hJbnB1dC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1maWxlLWdyb3VwLWxpc3RcIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiB0aGlzLmZpbGVzKSB7XG4gICAgICBjb25zdCByb3cgPSBsaXN0LmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tZmlsZS1ncm91cC1yb3dcIixcbiAgICAgIH0pO1xuICAgICAgY29uc3QgY2hlY2tib3ggPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgdGV4dDogZmlsZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICB0aGlzLnJvd3MucHVzaCh7IGZpbGUsIGNoZWNrYm94LCByb3cgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlVzZSBTZWxlY3RlZFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMucm93c1xuICAgICAgICAuZmlsdGVyKChyb3cpID0+IHJvdy5jaGVja2JveC5jaGVja2VkKVxuICAgICAgICAubWFwKChyb3cpID0+IHJvdy5maWxlKTtcbiAgICAgIGlmICghc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG5vdGVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmluaXNoKHNlbGVjdGVkKTtcbiAgICB9KTtcblxuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyUm93cyh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcXVlcnkgPSB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gIXF1ZXJ5IHx8IHJvdy5maWxlLnBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSk7XG4gICAgICByb3cucm93LnN0eWxlLmRpc3BsYXkgPSBtYXRjaCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChmaWxlczogVEZpbGVbXSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKGZpbGVzKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHRyaW1UcmFpbGluZ05ld2xpbmVzIH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuaW50ZXJmYWNlIFByb21wdE1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHBsYWNlaG9sZGVyPzogc3RyaW5nO1xuICBzdWJtaXRMYWJlbD86IHN0cmluZztcbiAgbXVsdGlsaW5lPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFByb21wdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBQcm9tcHRNb2RhbE9wdGlvbnMpIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblByb21wdCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICBjb25zdCB0ZXh0YXJlYSA9IGNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgcm93czogXCI4XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSB0ZXh0YXJlYTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciA/PyBcIlwiLFxuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnB1dEVsID0gaW5wdXQ7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLmZvY3VzKCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KHRoaXMub3B0aW9ucy5zdWJtaXRMYWJlbCA/PyBcIlN1Ym1pdFwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkNhbmNlbFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN1Ym1pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IHRyaW1UcmFpbGluZ05ld2xpbmVzKHRoaXMuaW5wdXRFbC52YWx1ZSkudHJpbSgpO1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmZpbmlzaCh2YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaCh2YWx1ZTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUodmFsdWUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVzdWx0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGl0bGVUZXh0OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSByZWFkb25seSBib2R5VGV4dDogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy50aXRsZVRleHQgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IHRoaXMuYm9keVRleHQsXG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IFF1ZXN0aW9uU2NvcGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IHR5cGUgeyBRdWVzdGlvblNjb3BlIH07XG5cbmludGVyZmFjZSBRdWVzdGlvblNjb3BlTW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2NvcGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBRdWVzdGlvblNjb3BlTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFF1ZXN0aW9uU2NvcGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSB0aGUgc2NvcGUgQnJhaW4gc2hvdWxkIHVzZSBmb3IgdGhpcyByZXF1ZXN0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkN1cnJlbnQgTm90ZVwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcIm5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlNlbGVjdGVkIE5vdGVzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZ3JvdXBcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkN1cnJlbnQgRm9sZGVyXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZm9sZGVyXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJFbnRpcmUgVmF1bHRcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJ2YXVsdFwiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChzY29wZTogUXVlc3Rpb25TY29wZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHNjb3BlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi4vc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQgfSBmcm9tIFwiLi4vc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdENvbnRleHRMb2NhdGlvbiB9IGZyb20gXCIuLi91dGlscy9jb250ZXh0LWZvcm1hdFwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuaW50ZXJmYWNlIFN5bnRoZXNpc1Jlc3VsdE1vZGFsT3B0aW9ucyB7XG4gIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQ7XG4gIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0O1xuICBjYW5JbnNlcnQ6IGJvb2xlYW47XG4gIG9uSW5zZXJ0OiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIG9uU2F2ZTogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBvbkFjdGlvbkNvbXBsZXRlOiAobWVzc2FnZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgY2xhc3MgU3ludGhlc2lzUmVzdWx0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgd29ya2luZyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1dHRvbnM6IEhUTUxCdXR0b25FbGVtZW50W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFN5bnRoZXNpc1Jlc3VsdE1vZGFsT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IGBCcmFpbiAke3RoaXMub3B0aW9ucy5yZXN1bHQudGl0bGV9YCB9KTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYEFjdGlvbjogJHt0aGlzLm9wdGlvbnMucmVzdWx0LmFjdGlvbn1gLFxuICAgIH0pO1xuICAgIGlmICh0aGlzLm9wdGlvbnMucmVzdWx0LnByb21wdFRleHQpIHtcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgUHJvbXB0OiAke3RoaXMub3B0aW9ucy5yZXN1bHQucHJvbXB0VGV4dH1gLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYENvbnRleHQ6ICR7Zm9ybWF0Q29udGV4dExvY2F0aW9uKHRoaXMub3B0aW9ucy5jb250ZXh0KX1gLFxuICAgIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogdGhpcy5vcHRpb25zLmNvbnRleHQudHJ1bmNhdGVkXG4gICAgICAgID8gYENvbnRleHQgdHJ1bmNhdGVkIHRvICR7dGhpcy5vcHRpb25zLmNvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gXG4gICAgICAgIDogYENvbnRleHQgbGVuZ3RoOiAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm9yaWdpbmFsTGVuZ3RofSBjaGFyYWN0ZXJzLmAsXG4gICAgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogdGhpcy5vcHRpb25zLnJlc3VsdC5jb250ZW50LFxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jYW5JbnNlcnQpIHtcbiAgICAgIC8vIEJ1dHRvbnMgYXJlIHJlbmRlcmVkIGJlbG93IGFmdGVyIG9wdGlvbmFsIGd1aWRhbmNlIHRleHQuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBcIk9wZW4gYSBtYXJrZG93biBub3RlIHRvIGluc2VydCB0aGlzIGFydGlmYWN0IHRoZXJlLCBvciBzYXZlIGl0IHRvIEJyYWluIG5vdGVzLlwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgdGhpcy5idXR0b25zID0gW107XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNhbkluc2VydCkge1xuICAgICAgdGhpcy5idXR0b25zLnB1c2godGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJJbnNlcnQgaW50byBjdXJyZW50IG5vdGVcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucnVuQWN0aW9uKCgpID0+IHRoaXMub3B0aW9ucy5vbkluc2VydCgpKTtcbiAgICAgIH0sIHRydWUpKTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1dHRvbnMucHVzaChcbiAgICAgIHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiU2F2ZSB0byBCcmFpbiBub3Rlc1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5ydW5BY3Rpb24oKCkgPT4gdGhpcy5vcHRpb25zLm9uU2F2ZSgpKTtcbiAgICAgIH0pLFxuICAgICAgdGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJDbG9zZVwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUJ1dHRvbihcbiAgICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBvbkNsaWNrOiAoKSA9PiB2b2lkLFxuICAgIGN0YSA9IGZhbHNlLFxuICApOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgYnV0dG9uID0gcGFyZW50LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogY3RhID8gXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIiA6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0LFxuICAgIH0pO1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25DbGljayk7XG4gICAgcmV0dXJuIGJ1dHRvbjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQWN0aW9uKGFjdGlvbjogKCkgPT4gUHJvbWlzZTxzdHJpbmc+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMud29ya2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMud29ya2luZyA9IHRydWU7XG4gICAgdGhpcy5zZXRCdXR0b25zRGlzYWJsZWQodHJ1ZSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IGFjdGlvbigpO1xuICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uQWN0aW9uQ29tcGxldGUobWVzc2FnZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgdXBkYXRlIHRoZSBzeW50aGVzaXMgcmVzdWx0XCIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0QnV0dG9uc0Rpc2FibGVkKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldEJ1dHRvbnNEaXNhYmxlZChkaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIHRoaXMuYnV0dG9ucykge1xuICAgICAgYnV0dG9uLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogQ2VudHJhbGl6ZWQgZXJyb3IgaGFuZGxpbmcgdXRpbGl0eVxuICogU3RhbmRhcmRpemVzIGVycm9yIHJlcG9ydGluZyBhY3Jvc3MgdGhlIHBsdWdpblxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlO1xuICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yQW5kUmV0aHJvdyhlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyIHtcbiAgc2hvd0Vycm9yKGVycm9yLCBkZWZhdWx0TWVzc2FnZSk7XG4gIHRocm93IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihkZWZhdWx0TWVzc2FnZSk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcbmltcG9ydCB0eXBlIHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IHR5cGUgeyBTeW50aGVzaXNUZW1wbGF0ZSB9O1xuXG5pbnRlcmZhY2UgVGVtcGxhdGVQaWNrZXJPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogU3ludGhlc2lzVGVtcGxhdGUgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFRlbXBsYXRlUGlja2VyT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5QaWNrZXIoKTogUHJvbWlzZTxTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIGhvdyBCcmFpbiBzaG91bGQgc3ludGhlc2l6ZSB0aGlzIGNvbnRleHQuXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJzdW1tYXJpemVcIikpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwic3VtbWFyaXplXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImV4dHJhY3QtdGFza3NcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC10YXNrc1wiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LWRlY2lzaW9uc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LWRlY2lzaW9uc1wiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInJld3JpdGUtY2xlYW4tbm90ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImRyYWZ0LXByb2plY3QtYnJpZWZcIik7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2godGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUodGVtcGxhdGUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuaW1wb3J0IHsgZ2V0SW5ib3hSZXZpZXdDb21wbGV0aW9uTWVzc2FnZSB9IGZyb20gXCIuLi91dGlscy9pbmJveC1yZXZpZXdcIjtcblxudHlwZSBSZXZpZXdBY3Rpb24gPSBcImtlZXBcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBcIm5vdGVcIiB8IFwic2tpcFwiO1xuXG5leHBvcnQgY2xhc3MgSW5ib3hSZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBjdXJyZW50SW5kZXggPSAwO1xuICBwcml2YXRlIGtlcHRDb3VudCA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGFuZGxlS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4ge1xuICAgIGlmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuYWx0S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAodGFyZ2V0ICYmICh0YXJnZXQudGFnTmFtZSA9PT0gXCJJTlBVVFwiIHx8IHRhcmdldC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uID0ga2V5VG9BY3Rpb24oZXZlbnQua2V5KTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdm9pZCB0aGlzLmhhbmRsZUFjdGlvbihhY3Rpb24pO1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZW50cmllczogSW5ib3hFbnRyeVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3U2VydmljZTogUmV2aWV3U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9uQWN0aW9uQ29tcGxldGU/OiAobWVzc2FnZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZCxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlByb2Nlc3MgSW5ib3hcIiB9KTtcblxuICAgIGlmICghdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyBpbmJveCBlbnRyaWVzIGZvdW5kLlwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICB0ZXh0OiBgRW50cnkgJHt0aGlzLmN1cnJlbnRJbmRleCArIDF9IG9mICR7dGhpcy5lbnRyaWVzLmxlbmd0aH1gLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiaDNcIiwge1xuICAgICAgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGVudHJ5XCIsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IFwiKGVtcHR5IGVudHJ5KVwiLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBhbiBhY3Rpb24gZm9yIHRoaXMgZW50cnkuIFNob3J0Y3V0czogayBrZWVwLCB0IHRhc2ssIGogam91cm5hbCwgbiBub3RlLCBzIHNraXAuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBidXR0b25Sb3cgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIktlZXAgaW4gaW5ib3hcIiwgXCJrZWVwXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJDb252ZXJ0IHRvIHRhc2tcIiwgXCJ0YXNrXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJBcHBlbmQgdG8gam91cm5hbFwiLCBcImpvdXJuYWxcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIlByb21vdGUgdG8gbm90ZVwiLCBcIm5vdGVcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIlNraXBcIiwgXCJza2lwXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRCdXR0b24oY29udGFpbmVyOiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZywgYWN0aW9uOiBSZXZpZXdBY3Rpb24pOiB2b2lkIHtcbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBhY3Rpb24gPT09IFwibm90ZVwiID8gXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIiA6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBsYWJlbCxcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmhhbmRsZUFjdGlvbihhY3Rpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBY3Rpb24oYWN0aW9uOiBSZXZpZXdBY3Rpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBsZXQgbWVzc2FnZSA9IFwiXCI7XG4gICAgICBpZiAoYWN0aW9uID09PSBcInRhc2tcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnByb21vdGVUb1Rhc2soZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwiam91cm5hbFwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UuYXBwZW5kVG9Kb3VybmFsKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcIm5vdGVcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnByb21vdGVUb05vdGUoZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwia2VlcFwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2Uua2VlcEVudHJ5KGVudHJ5KTtcbiAgICAgICAgdGhpcy5rZXB0Q291bnQgKz0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2Uuc2tpcEVudHJ5KGVudHJ5KTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMub25BY3Rpb25Db21wbGV0ZSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMub25BY3Rpb25Db21wbGV0ZShtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHByb2Nlc3MgcmV2aWV3IGFjdGlvblwiKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jdXJyZW50SW5kZXggKz0gMTtcblxuICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4ID49IHRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgbmV3IE5vdGljZShnZXRJbmJveFJldmlld0NvbXBsZXRpb25NZXNzYWdlKHRoaXMua2VwdENvdW50KSk7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHByb2Nlc3MgaW5ib3ggZW50cnlcIik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGtleVRvQWN0aW9uKGtleTogc3RyaW5nKTogUmV2aWV3QWN0aW9uIHwgbnVsbCB7XG4gIHN3aXRjaCAoa2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlIFwia1wiOlxuICAgICAgcmV0dXJuIFwia2VlcFwiO1xuICAgIGNhc2UgXCJ0XCI6XG4gICAgICByZXR1cm4gXCJ0YXNrXCI7XG4gICAgY2FzZSBcImpcIjpcbiAgICAgIHJldHVybiBcImpvdXJuYWxcIjtcbiAgICBjYXNlIFwiblwiOlxuICAgICAgcmV0dXJuIFwibm90ZVwiO1xuICAgIGNhc2UgXCJzXCI6XG4gICAgICByZXR1cm4gXCJza2lwXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGdldEluYm94UmV2aWV3Q29tcGxldGlvbk1lc3NhZ2Uoa2VwdENvdW50OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoa2VwdENvdW50IDw9IDApIHtcbiAgICByZXR1cm4gXCJJbmJveCByZXZpZXcgY29tcGxldGVcIjtcbiAgfVxuXG4gIGlmIChrZXB0Q291bnQgPT09IDEpIHtcbiAgICByZXR1cm4gXCJSZXZpZXcgcGFzcyBjb21wbGV0ZTsgMSBlbnRyeSByZW1haW5zIGluIGluYm94LlwiO1xuICB9XG5cbiAgcmV0dXJuIGBSZXZpZXcgcGFzcyBjb21wbGV0ZTsgJHtrZXB0Q291bnR9IGVudHJpZXMgcmVtYWluIGluIGluYm94LmA7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnkgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdIaXN0b3J5TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZW50cmllczogUmV2aWV3TG9nRW50cnlbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4sXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlJldmlldyBIaXN0b3J5XCIgfSk7XG5cbiAgICBpZiAoIXRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIk5vIHJldmlldyBsb2dzIGZvdW5kLlwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJPcGVuIGEgbG9nIHRvIGluc3BlY3QgaXQsIG9yIHJlLW9wZW4gYW4gaW5ib3ggaXRlbSBpZiBpdCB3YXMgbWFya2VkIGluY29ycmVjdGx5LlwiLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLmVudHJpZXMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwgeyBjbHM6IFwiYnJhaW4tc2VjdGlvblwiIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBlbnRyeS5oZWFkaW5nIHx8IFwiVW50aXRsZWQgaXRlbVwiIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IGAke2VudHJ5LnRpbWVzdGFtcH0gXHUyMDIyICR7ZW50cnkuYWN0aW9ufWAsXG4gICAgICB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgICAgdGV4dDogZW50cnkucHJldmlldyB8fCBcIihlbXB0eSBwcmV2aWV3KVwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGJ1dHRvbnMgPSByb3cuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgdGV4dDogXCJPcGVuIGxvZ1wiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLm9wZW5Mb2coZW50cnkuc291cmNlUGF0aCk7XG4gICAgICB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgIHRleHQ6IFwiUmUtb3BlblwiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJlb3BlbkVudHJ5KGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3BlbkxvZyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBhYnN0cmFjdEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCEoYWJzdHJhY3RGaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gcmV2aWV3IGxvZ1wiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShhYnN0cmFjdEZpbGUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW9wZW5FbnRyeShlbnRyeTogUmV2aWV3TG9nRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJlb3BlblJldmlld0VudHJ5KGVudHJ5KTtcbiAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIEl0ZW1WaWV3LCBOb3RpY2UsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuaW50ZXJmYWNlIEFwcFdpdGhTZXR0aW5ncyBleHRlbmRzIEFwcCB7XG4gIHNldHRpbmc6IHtcbiAgICBvcGVuKCk6IHZvaWQ7XG4gICAgb3BlblRhYkJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQ7XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSByZXN1bHRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGluYm94Q291bnRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHRhc2tDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmV2aWV3SGlzdG9yeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgYWlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGNhcHR1cmVBc3Npc3RTZWN0aW9uRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBpc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjb2xsYXBzZWRTZWN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBwcml2YXRlIGtleWJvYXJkSGFuZGxlcj86IChldnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBCUkFJTl9WSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIkJyYWluXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW5cIjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tc2lkZWJhclwiKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDYXB0dXJlIGlkZWFzLCBzeW50aGVzaXplIGV4cGxpY2l0IGNvbnRleHQsIGFuZCBzYXZlIGR1cmFibGUgbWFya2Rvd24gYXJ0aWZhY3RzLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkQ29sbGFwc2VkU3RhdGUoKTtcbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVBc2tTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVSZXZpZXdTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlU3RhdHVzU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0U2VjdGlvbigpO1xuICAgIHRoaXMucmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5rZXlib2FyZEhhbmRsZXIpIHtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMua2V5Ym9hcmRIYW5kbGVyKTtcbiAgICAgIHRoaXMua2V5Ym9hcmRIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBzZXRMYXN0UmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMucmVzdWx0RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIHNldExhc3RTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IFtpbmJveENvdW50LCB0YXNrQ291bnQsIHJldmlld0NvdW50XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMucGx1Z2luLmdldEluYm94Q291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldE9wZW5UYXNrQ291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldFJldmlld0hpc3RvcnlDb3VudCgpLFxuICAgIF0pO1xuICAgIGlmICh0aGlzLmluYm94Q291bnRFbCkge1xuICAgICAgdGhpcy5pbmJveENvdW50RWwuc2V0VGV4dChgJHtpbmJveENvdW50fSB1bnJldmlld2VkIGVudHJpZXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudGFza0NvdW50RWwpIHtcbiAgICAgIHRoaXMudGFza0NvdW50RWwuc2V0VGV4dChgJHt0YXNrQ291bnR9IG9wZW4gdGFza3NgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmV2aWV3SGlzdG9yeUVsKSB7XG4gICAgICB0aGlzLnJldmlld0hpc3RvcnlFbC5zZXRUZXh0KGBSZXZpZXcgaGlzdG9yeTogJHtyZXZpZXdDb3VudH0gZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5haVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLmFpU3RhdHVzRWwuZW1wdHkoKTtcbiAgICAgIGNvbnN0IHN0YXR1c1RleHQgPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRBaVN0YXR1c1RleHQoKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQUk6ICR7c3RhdHVzVGV4dH0gYCB9KTtcblxuICAgICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgdGhpcy5haVN0YXR1c0VsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgICAgdGV4dDogYWlTdGF0dXMuY29uZmlndXJlZCA/IFwiTWFuYWdlXCIgOiBcIkNvbm5lY3RcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFwcCA9IHRoaXMuYXBwIGFzIEFwcFdpdGhTZXR0aW5ncztcbiAgICAgICAgYXBwLnNldHRpbmcub3BlbigpO1xuICAgICAgICBhcHAuc2V0dGluZy5vcGVuVGFiQnlJZCh0aGlzLnBsdWdpbi5tYW5pZmVzdC5pZCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3VtbWFyeVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLnN1bW1hcnlTdGF0dXNFbC5zZXRUZXh0KHRoaXMucGx1Z2luLmdldExhc3RTdW1tYXJ5TGFiZWwoKSk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQ2FwdHVyZUFzc2lzdFZpc2liaWxpdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0TG9hZGluZyhsb2FkaW5nOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSBsb2FkaW5nO1xuICAgIGNvbnN0IGJ1dHRvbnMgPSBBcnJheS5mcm9tKHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b24uYnJhaW4tYnV0dG9uXCIpKTtcbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiBidXR0b25zKSB7XG4gICAgICAoYnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgfVxuICAgIGlmICh0aGlzLmlucHV0RWwpIHtcbiAgICAgIHRoaXMuaW5wdXRFbC5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWdpc3RlcktleWJvYXJkU2hvcnRjdXRzKCk6IHZvaWQge1xuICAgIHRoaXMua2V5Ym9hcmRIYW5kbGVyID0gKGV2dDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgaWYgKGV2dC5tZXRhS2V5IHx8IGV2dC5jdHJsS2V5IHx8IGV2dC5hbHRLZXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNUZXh0SW5wdXRBY3RpdmUoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc0FueU1vZGFsT3BlbigpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChldnQua2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzTm90ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNUYXNrKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJqXCI6XG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc0pvdXJuYWwoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJDYXB0dXJlIGNsZWFyZWRcIik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmtleWJvYXJkSGFuZGxlcik7XG4gIH1cblxuICBwcml2YXRlIGlzVGV4dElucHV0QWN0aXZlKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIHJldHVybiB0YXJnZXQgIT09IG51bGwgJiYgKHRhcmdldC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgdGFyZ2V0LnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIik7XG4gIH1cblxuICBwcml2YXRlIGlzQW55TW9kYWxPcGVuKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLm1vZGFsLWJnXCIpICE9PSBudWxsIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIubW9kYWwtY29udGFpbmVyXCIpICE9PSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2dnbGVTZWN0aW9uKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKHNlY3Rpb25JZCkpIHtcbiAgICAgIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuZGVsZXRlKHNlY3Rpb25JZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuYWRkKHNlY3Rpb25JZCk7XG4gICAgfVxuICAgIHRoaXMuc2F2ZUNvbGxhcHNlZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRDb2xsYXBzZWRTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zID0gbmV3IFNldCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBzYXZlQ29sbGFwc2VkU3RhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zID0gQXJyYXkuZnJvbSh0aGlzLmNvbGxhcHNlZFNlY3Rpb25zKTtcbiAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgaWQ6IHN0cmluZyxcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgY29udGVudENyZWF0b3I6IChjb250YWluZXI6IEhUTUxFbGVtZW50KSA9PiB2b2lkLFxuICApOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaGVhZGVyID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zZWN0aW9uLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IHRvZ2dsZUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY29sbGFwc2UtdG9nZ2xlXCIsXG4gICAgICB0ZXh0OiB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBcIlx1MjVCNlwiIDogXCJcdTI1QkNcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgXCJhcmlhLWxhYmVsXCI6IHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IGBFeHBhbmQgJHt0aXRsZX1gIDogYENvbGxhcHNlICR7dGl0bGV9YCxcbiAgICAgICAgXCJhcmlhLWV4cGFuZGVkXCI6ICghdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpKS50b1N0cmluZygpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IHRpdGxlIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBkZXNjcmlwdGlvbiB9KTtcblxuICAgIHRvZ2dsZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50b2dnbGVTZWN0aW9uKGlkKTtcbiAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcihcIi5icmFpbi1zZWN0aW9uLWNvbnRlbnRcIik7XG4gICAgICBpZiAoY29udGVudEVsKSB7XG4gICAgICAgIGNvbnRlbnRFbC50b2dnbGVBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgICAgIHRvZ2dsZUJ0bi5zZXRUZXh0KHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IFwiXHUyNUI2XCIgOiBcIlx1MjVCQ1wiKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gYEV4cGFuZCAke3RpdGxlfWAgOiBgQ29sbGFwc2UgJHt0aXRsZX1gKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgKCF0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkpLnRvU3RyaW5nKCkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgY29udGVudCA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb24tY29udGVudFwiLFxuICAgICAgYXR0cjogdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8geyBoaWRkZW46IFwidHJ1ZVwiIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gICAgY29udGVudENyZWF0b3IoY29udGVudCk7XG4gICAgcmV0dXJuIHNlY3Rpb247XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJjYXB0dXJlXCIsXG4gICAgICBcIlF1aWNrIENhcHR1cmVcIixcbiAgICAgIFwiQ2FwdHVyZSByb3VnaCBpbnB1dCBpbnRvIHRoZSB2YXVsdCBiZWZvcmUgcmV2aWV3IGFuZCBzeW50aGVzaXMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIHRoaXMuaW5wdXRFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tY2FwdHVyZS1pbnB1dFwiLFxuICAgICAgICAgIGF0dHI6IHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIlR5cGUgYSBub3RlLCB0YXNrLCBvciBqb3VybmFsIGVudHJ5Li4uXCIsXG4gICAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2FwdHVyZSBOb3RlIChuKVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNOb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDYXB0dXJlIFRhc2sgKHQpXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc1Rhc2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNhcHR1cmUgSm91cm5hbCAoailcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzSm91cm5hbCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2xlYXIgKGMpXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQ2FwdHVyZSBjbGVhcmVkXCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3ludGhlc2lzU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwic3ludGhlc2lzXCIsXG4gICAgICBcIlN5bnRoZXNpemVcIixcbiAgICAgIFwiVHVybiBleHBsaWNpdCBjb250ZXh0IGludG8gc3VtbWFyaWVzLCBjbGVhbiBub3RlcywgdGFza3MsIGFuZCBicmllZnMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgICAgdGV4dDogXCJTdW1tYXJpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJTeW50aGVzaXplIEN1cnJlbnQgTm90ZS4uLlwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0U2VsZWN0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJEcmFmdCBCcmllZiBGcm9tIEZvbGRlclwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDbGVhbiBOb3RlIEZyb20gUmVjZW50IEZpbGVzXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hc2tBYm91dFJlY2VudEZpbGVzKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiU3ludGhlc2l6ZSBOb3Rlcy4uLlwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc3ludGhlc2l6ZU5vdGVzKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQXNrU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwiYXNrXCIsXG4gICAgICBcIkFzayBCcmFpblwiLFxuICAgICAgXCJBc2sgYSBxdWVzdGlvbiBhYm91dCB0aGUgY3VycmVudCBub3RlLCBhIHNlbGVjdGVkIGdyb3VwLCBhIGZvbGRlciwgb3IgdGhlIHdob2xlIHZhdWx0LlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICAgIHRleHQ6IFwiQXNrIFF1ZXN0aW9uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkFib3V0IEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudEZvbGRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmV2aWV3U2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwicmV2aWV3XCIsXG4gICAgICBcIlJldmlld1wiLFxuICAgICAgXCJQcm9jZXNzIGNhcHR1cmVkIGlucHV0IGFuZCBrZWVwIHRoZSBkYWlseSBsb29wIG1vdmluZy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgICB0ZXh0OiBcIlJldmlldyBJbmJveFwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucHJvY2Vzc0luYm94KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlVG9waWNQYWdlU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwidG9waWNcIixcbiAgICAgIFwiVG9waWMgUGFnZXNcIixcbiAgICAgIFwiQnJhaW4ncyBmbGFnc2hpcCBmbG93OiB0dXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBhIGR1cmFibGUgbWFya2Rvd24gcGFnZSB5b3UgY2FuIGtlZXAgYnVpbGRpbmcuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVBc3Npc3RTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY2FwdHVyZUFzc2lzdFNlY3Rpb25FbCA9IHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJjYXB0dXJlLWFzc2lzdFwiLFxuICAgICAgXCJDYXB0dXJlIEFzc2lzdFwiLFxuICAgICAgXCJVc2UgQUkgb25seSB0byBjbGFzc2lmeSBmcmVzaCBjYXB0dXJlIGludG8gbm90ZSwgdGFzaywgb3Igam91cm5hbC5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkF1dG8tcm91dGUgQ2FwdHVyZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5hdXRvUm91dGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5jYXB0dXJlQXNzaXN0U2VjdGlvbkVsLnRvZ2dsZUF0dHJpYnV0ZShcImhpZGRlblwiLCAhdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQ2FwdHVyZUFzc2lzdFZpc2liaWxpdHkoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY2FwdHVyZUFzc2lzdFNlY3Rpb25FbCkge1xuICAgICAgdGhpcy5jYXB0dXJlQXNzaXN0U2VjdGlvbkVsLnRvZ2dsZUF0dHJpYnV0ZShcImhpZGRlblwiLCAhdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVN0YXR1c1NlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcInN0YXR1c1wiLFxuICAgICAgXCJTdGF0dXNcIixcbiAgICAgIFwiQ3VycmVudCBpbmJveCwgdGFzaywgYW5kIHN5bnRoZXNpcyBzdGF0dXMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGluYm94Um93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiSW5ib3g6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5pbmJveENvdW50RWwgPSBpbmJveFJvdztcblxuICAgICAgICBjb25zdCB0YXNrUm93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiVGFza3M6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy50YXNrQ291bnRFbCA9IHRhc2tSb3c7XG5cbiAgICAgICAgY29uc3QgcmV2aWV3Um93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXN0YXR1cy1yb3dcIiB9KTtcbiAgICAgICAgdGhpcy5yZXZpZXdIaXN0b3J5RWwgPSByZXZpZXdSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJSZXZpZXcgaGlzdG9yeTogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICByZXZpZXdSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICAgICAgdGV4dDogXCJPcGVuXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhaVJvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkFJOiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHRoaXMuYWlTdGF0dXNFbCA9IGFpUm93O1xuXG4gICAgICAgIGNvbnN0IHN1bW1hcnlSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJMYXN0IGFydGlmYWN0OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHRoaXMuc3VtbWFyeVN0YXR1c0VsID0gc3VtbWFyeVJvdztcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0U2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwib3V0cHV0XCIsXG4gICAgICBcIkFydGlmYWN0c1wiLFxuICAgICAgXCJSZWNlbnQgc3ludGhlc2lzIHJlc3VsdHMgYW5kIGdlbmVyYXRlZCBhcnRpZmFjdHMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IFJlc3VsdFwiIH0pO1xuICAgICAgICB0aGlzLnJlc3VsdEVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tb3V0cHV0XCIsXG4gICAgICAgICAgdGV4dDogXCJObyByZXN1bHQgeWV0LlwiLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb250YWluZXIuY3JlYXRlRWwoXCJoNFwiLCB7IHRleHQ6IFwiTGFzdCBBcnRpZmFjdFwiIH0pO1xuICAgICAgICB0aGlzLnN1bW1hcnlFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLW91dHB1dFwiLFxuICAgICAgICAgIHRleHQ6IFwiTm8gYXJ0aWZhY3QgZ2VuZXJhdGVkIHlldC5cIixcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc05vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IGNhcHR1cmUgbm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc1Rhc2soKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlVGFzayh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGF1dG9Sb3V0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgcm91dGUgPSBhd2FpdCB0aGlzLnBsdWdpbi5yb3V0ZVRleHQodGV4dCk7XG4gICAgICBpZiAoIXJvdXRlKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBjb3VsZCBub3QgY2xhc3NpZnkgdGhhdCBlbnRyeVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHJvdXRlID09PSBcIm5vdGVcIikge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVOb3RlKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IGNhcHR1cmUgbm90ZVwiLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChyb3V0ZSA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlVGFzayh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIHRhc2tcIixcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZUpvdXJuYWwodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3Qgc2F2ZSBqb3VybmFsIGVudHJ5XCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXV0by1yb3V0ZSBjYXB0dXJlXCIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNhcHR1cmUoXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgZmFpbHVyZU1lc3NhZ2U6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHRleHQpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIGZhaWx1cmVNZXNzYWdlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgUXVlc3Rpb25TY29wZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5pbnRlcmZhY2UgQnJhaW5Db21tYW5kSG9zdCB7XG4gIGFkZENvbW1hbmQ6IFBsdWdpbltcImFkZENvbW1hbmRcIl07XG4gIGNhcHR1cmVGcm9tTW9kYWwoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBzdWJtaXRMYWJlbDogc3RyaW5nLFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIG11bHRpbGluZT86IGJvb2xlYW4sXG4gICk6IFByb21pc2U8dm9pZD47XG4gIG5vdGVTZXJ2aWNlOiB7IGFwcGVuZE5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB9O1xuICB0YXNrU2VydmljZTogeyBhcHBlbmRUYXNrKHRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4gfTtcbiAgam91cm5hbFNlcnZpY2U6IHsgYXBwZW5kRW50cnkodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB9O1xuICBwcm9jZXNzSW5ib3goKTogUHJvbWlzZTx2b2lkPjtcbiAgb3BlblJldmlld0hpc3RvcnkoKTogUHJvbWlzZTx2b2lkPjtcbiAgZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KGxvb2tiYWNrRGF5cz86IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xuICBhZGRUYXNrRnJvbVNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+O1xuICBvcGVuVG9kYXlzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+O1xuICBvcGVuU2lkZWJhcigpOiBQcm9taXNlPHZvaWQ+O1xuICBzeW50aGVzaXplTm90ZXMoKTogUHJvbWlzZTx2b2lkPjtcbiAgYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpOiBQcm9taXNlPHZvaWQ+O1xuICBhc2tRdWVzdGlvbigpOiBQcm9taXNlPHZvaWQ+O1xuICBhc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTogUHJvbWlzZTx2b2lkPjtcbiAgY3JlYXRlVG9waWNQYWdlKCk6IFByb21pc2U8dm9pZD47XG4gIGNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKHNjb3BlPzogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbW1hbmRzKHBsdWdpbjogQnJhaW5Db21tYW5kSG9zdCk6IHZvaWQge1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY2FwdHVyZS1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFwiQ2FwdHVyZSBOb3RlXCIsIFwiQ2FwdHVyZVwiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi5ub3RlU2VydmljZS5hcHBlbmROb3RlKHRleHQpO1xuICAgICAgICByZXR1cm4gYENhcHR1cmVkIG5vdGUgaW4gJHtzYXZlZC5wYXRofWA7XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYWRkLXRhc2tcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIFRhc2tcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIFRhc2tcIiwgXCJDYXB0dXJlXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtam91cm5hbC1lbnRyeVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgSm91cm5hbFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcbiAgICAgICAgXCJDYXB0dXJlIEpvdXJuYWxcIixcbiAgICAgICAgXCJDYXB0dXJlXCIsXG4gICAgICAgIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4uam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkodGV4dCk7XG4gICAgICAgICAgcmV0dXJuIGBTYXZlZCBqb3VybmFsIGVudHJ5IHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgICB9LFxuICAgICAgICB0cnVlLFxuICAgICAgKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwicHJvY2Vzcy1pbmJveFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IFJldmlldyBJbmJveFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ucHJvY2Vzc0luYm94KCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInJldmlldy1oaXN0b3J5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBSZXZpZXcgSGlzdG9yeVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblJldmlld0hpc3RvcnkoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3VtbWFyaXplLXRvZGF5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9kYXkgU3VtbWFyeVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDEsIFwiVG9kYXlcIik7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN1bW1hcml6ZS10aGlzLXdlZWtcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBXZWVrbHkgU3VtbWFyeVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDcsIFwiV2Vla1wiKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYWRkLXRhc2stZnJvbS1zZWxlY3Rpb25cIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIFRhc2sgRnJvbSBTZWxlY3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFkZFRhc2tGcm9tU2VsZWN0aW9uKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4tdG9kYXlzLWpvdXJuYWxcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFRvZGF5J3MgSm91cm5hbFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblRvZGF5c0pvdXJuYWwoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi1zaWRlYmFyXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBCcmFpbiBTaWRlYmFyXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuU2lkZWJhcigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeW50aGVzaXplLW5vdGVzXCIsXG4gICAgbmFtZTogXCJCcmFpbjogU3ludGhlc2l6ZSBOb3Rlc1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uc3ludGhlc2l6ZU5vdGVzKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5bnRoZXNpemUtY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogU3ludGhlc2l6ZSBDdXJyZW50IE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYXNrLXF1ZXN0aW9uXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQXNrIFF1ZXN0aW9uXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tRdWVzdGlvbigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhc2stcXVlc3Rpb24tY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrUXVlc3Rpb25BYm91dEN1cnJlbnROb3RlKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNyZWF0ZS10b3BpYy1wYWdlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9waWMgUGFnZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY3JlYXRlVG9waWNQYWdlKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNyZWF0ZS10b3BpYy1wYWdlLWN1cnJlbnQtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFRvcGljIFBhZ2UgRnJvbSBDdXJyZW50IE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKFwibm90ZVwiKTtcbiAgICB9LFxuICB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG9CQUE2Qzs7O0FDNEJ0QyxJQUFNLHlCQUE4QztBQUFBLEVBQ3pELFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQSxFQUNYLGVBQWU7QUFBQSxFQUNmLGFBQWE7QUFBQSxFQUNiLGlCQUFpQjtBQUFBLEVBQ2pCLGVBQWU7QUFBQSxFQUNmLG1CQUFtQjtBQUFBLEVBQ25CLGlCQUFpQjtBQUFBLEVBQ2pCLGNBQWM7QUFBQSxFQUNkLGFBQWE7QUFBQSxFQUNiLGVBQWU7QUFBQSxFQUNmLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUNkLGFBQWE7QUFBQSxFQUNiLHFCQUFxQjtBQUFBLEVBQ3JCLGlCQUFpQjtBQUFBLEVBQ2pCLGtCQUFrQjtBQUFBLEVBQ2xCLDBCQUEwQixDQUFDO0FBQzdCO0FBRU8sU0FBUyx1QkFDZCxPQUNxQjtBQUNyQixRQUFNLFNBQThCO0FBQUEsSUFDbEMsR0FBRztBQUFBLElBQ0gsR0FBRztBQUFBLEVBQ0w7QUFFQSxTQUFPO0FBQUEsSUFDTCxXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixl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QVMsTUFBTSxLQUFLLGNBQWMsb0JBQW9CO0FBQUEsTUFDMUQsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsWUFBWTtBQUFBLE1BQ1osV0FBVyxLQUFLLElBQUk7QUFBQSxNQUNwQixZQUFZO0FBQUEsTUFDWixNQUFNO0FBQUEsTUFDTixTQUFTLE1BQU07QUFBQSxNQUNmLFNBQVMsTUFBTTtBQUFBLE1BQ2YsV0FBVyxNQUFNO0FBQUEsTUFDakIsZ0JBQWdCLE1BQU07QUFBQSxJQUN4QixDQUFDO0FBQ0QsVUFBTSxLQUFLLCtCQUErQjtBQUMxQyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxrQkFBbUM7QUE5YTNDO0FBK2FJLFFBQUksQ0FBQyxLQUFLLFNBQVMscUJBQXFCLENBQUMsS0FBSyxTQUFTLGlCQUFpQjtBQUN0RSxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sV0FBVyxNQUFNLHlCQUF5QixLQUFLLFFBQVE7QUFDN0QsUUFBSSxDQUFDLFNBQVMsWUFBWTtBQUN4QixhQUFPLFNBQVMsUUFBUSxRQUFRLE9BQU8sRUFBRTtBQUFBLElBQzNDO0FBQ0EsVUFBTSxZQUFXLGNBQVMsYUFBVCxZQUFxQjtBQUN0QyxVQUFNLFFBQVEsU0FBUyxRQUFRLEtBQUssU0FBUyxLQUFLLE1BQU07QUFDeEQsV0FBTyxHQUFHLFFBQVEsR0FBRyxLQUFLO0FBQUEsRUFDNUI7QUFBQSxFQUVRLHdCQUFpQztBQTNiM0M7QUE0YkksV0FBTyxTQUFRLFVBQUssSUFBSSxVQUFVLG9CQUFvQiw4QkFBWSxNQUFuRCxtQkFBc0QsSUFBSTtBQUFBLEVBQzNFO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpc0Vub2VudEVycm9yIiwgImdldE5vZGVSZXF1aXJlIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
