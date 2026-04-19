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
var import_obsidian19 = require("obsidian");

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
        message: "Codex CLI not installed."
      };
    }
    if (codexStatus !== "logged-in") {
      return {
        configured: false,
        message: "Codex CLI not logged in."
      };
    }
    return {
      configured: true,
      message: settings.codexModel.trim() ? `Ready to use Codex with model ${settings.codexModel.trim()}.` : "Ready to use Codex with the account default model."
    };
  }
  if (settings.aiProvider === "gemini") {
    if (!settings.geminiApiKey.trim()) {
      return {
        configured: false,
        message: "Gemini API key missing."
      };
    }
    if (!settings.geminiModel.trim()) {
      return {
        configured: false,
        message: "Gemini model missing."
      };
    }
    return {
      configured: true,
      message: "Ready to use Gemini."
    };
  }
  const isDefaultOpenAIUrl = !settings.openAIBaseUrl.trim() || settings.openAIBaseUrl.includes("api.openai.com");
  if (!settings.openAIModel.trim()) {
    return {
      configured: false,
      message: "OpenAI model missing."
    };
  }
  if (isDefaultOpenAIUrl && !settings.openAIApiKey.trim()) {
    return {
      configured: false,
      message: "OpenAI API key missing."
    };
  }
  return {
    configured: true,
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

// src/utils/path.ts
function isUnderFolder(path, folder) {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
}

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
    const files = await this.collectRecentMarkdownFiles(settings.summaryLookbackDays);
    return this.buildFileGroupContext("Recent files", files, null);
  }
  async getCurrentFolderContext() {
    var _a, _b;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      throw new Error("Open a markdown note first");
    }
    const folderPath = (_b = (_a = view.file.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const files = await this.collectFilesInFolder(folderPath);
    return this.buildFileGroupContext("Current folder", files, folderPath || null);
  }
  async getSelectedFilesContext(files) {
    if (!files.length) {
      throw new Error("Select at least one markdown note");
    }
    return this.buildFileGroupContext("Selected notes", files, null);
  }
  async getVaultContext() {
    const files = await this.collectVaultMarkdownFiles();
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
  async collectRecentMarkdownFiles(lookbackDays) {
    const cutoff = getWindowStart(lookbackDays).getTime();
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    return files.filter((file) => !isUnderFolder(file.path, settings.summariesFolder)).filter((file) => !isUnderFolder(file.path, settings.reviewsFolder)).filter((file) => file.stat.mtime >= cutoff).sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
  async collectVaultMarkdownFiles() {
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    return files.filter((file) => !isUnderFolder(file.path, settings.summariesFolder)).filter((file) => !isUnderFolder(file.path, settings.reviewsFolder)).sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
  async collectFilesInFolder(folderPath) {
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    return files.filter((file) => !isUnderFolder(file.path, settings.summariesFolder)).filter((file) => !isUnderFolder(file.path, settings.reviewsFolder)).filter(
      (file) => folderPath ? isUnderFolder(file.path, folderPath) : !file.path.includes("/")
    ).sort((left, right) => right.stat.mtime - left.stat.mtime);
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
    const title = this.buildNoteTitle(entry);
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
  buildNoteTitle(entry) {
    var _a;
    const candidate = entry.preview || entry.body || entry.heading;
    const lines = candidate.split("\n").map((line) => collapseWhitespace(line)).filter(Boolean);
    const first = (_a = lines[0]) != null ? _a : "Untitled note";
    return trimTitle(first);
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
    const files = await this.collectRecentFiles(settings, effectiveLookbackDays);
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
  async collectRecentFiles(settings, lookbackDays) {
    const cutoff = getWindowStart(lookbackDays).getTime();
    const files = await this.vaultService.listMarkdownFiles();
    return files.filter((file) => !isUnderFolder(file.path, settings.summariesFolder)).filter((file) => !isUnderFolder(file.path, settings.reviewsFolder)).filter((file) => file.stat.mtime >= cutoff).sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
};

// src/services/synthesis-service.ts
var import_obsidian5 = require("obsidian");

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

// src/views/prompt-modals.ts
var import_obsidian10 = require("obsidian");
var PromptModal = class extends import_obsidian10.Modal {
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
    new import_obsidian10.Setting(contentEl).addButton(
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
      new import_obsidian10.Notice("Enter some text first.");
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
var ResultModal = class extends import_obsidian10.Modal {
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

// src/views/file-group-picker-modal.ts
var import_obsidian11 = require("obsidian");
var FileGroupPickerModal = class extends import_obsidian11.Modal {
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
        new import_obsidian11.Notice("Select at least one note");
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

// src/views/inbox-review-modal.ts
var import_obsidian13 = require("obsidian");

// src/utils/error-handler.ts
var import_obsidian12 = require("obsidian");
function showError(error, defaultMessage) {
  console.error(error);
  const message = error instanceof Error ? error.message : defaultMessage;
  new import_obsidian12.Notice(message);
}

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
var InboxReviewModal = class extends import_obsidian13.Modal {
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
          new import_obsidian13.Notice(message);
        }
      } catch (error) {
        showError(error, "Could not process review action");
      }
      this.currentIndex += 1;
      if (this.currentIndex >= this.entries.length) {
        new import_obsidian13.Notice(getInboxReviewCompletionMessage(this.keptCount));
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

// src/views/question-scope-modal.ts
var import_obsidian14 = require("obsidian");
var QuestionScopeModal = class extends import_obsidian14.Modal {
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
    new import_obsidian14.Setting(contentEl).addButton(
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

// src/views/review-history-modal.ts
var import_obsidian15 = require("obsidian");
var ReviewHistoryModal = class extends import_obsidian15.Modal {
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
    if (!(abstractFile instanceof import_obsidian15.TFile)) {
      new import_obsidian15.Notice("Unable to open review log");
      return;
    }
    const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian15.Notice("Unable to open review log");
      return;
    }
    await leaf.openFile(abstractFile);
    this.app.workspace.revealLeaf(leaf);
  }
  async reopenEntry(entry) {
    try {
      const message = await this.plugin.reopenReviewEntry(entry);
      new import_obsidian15.Notice(message);
      this.close();
    } catch (error) {
      showError(error, "Could not re-open inbox entry");
    }
  }
};

// src/views/synthesis-result-modal.ts
var import_obsidian16 = require("obsidian");
var SynthesisResultModal = class extends import_obsidian16.Modal {
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
var import_obsidian17 = require("obsidian");
var TemplatePickerModal = class extends import_obsidian17.Modal {
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
    new import_obsidian17.Setting(contentEl).addButton(
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

// src/views/sidebar-view.ts
var import_obsidian18 = require("obsidian");
var BRAIN_VIEW_TYPE = "brain-sidebar-view";
var BrainSidebarView = class extends import_obsidian18.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.isLoading = false;
    this.collapsedSections = /* @__PURE__ */ new Set();
    this.handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      switch (event.key.toLowerCase()) {
        case "n":
          event.preventDefault();
          void this.saveAsNote();
          break;
        case "t":
          event.preventDefault();
          void this.saveAsTask();
          break;
        case "j":
          event.preventDefault();
          void this.saveAsJournal();
          break;
        case "c":
          event.preventDefault();
          this.inputEl.value = "";
          new import_obsidian18.Notice("Capture cleared");
          break;
      }
    };
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
    window.removeEventListener("keydown", this.handleKeyDown);
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
      const isConnected = statusText.includes("configured");
      this.aiStatusEl.createEl("button", {
        cls: "brain-button brain-button-small",
        text: isConnected ? "Manage" : "Connect"
      }).addEventListener("click", () => {
        const app = this.app;
        app.setting.open();
        app.setting.openTabById(this.plugin.manifest.id);
      });
    }
    if (this.summaryStatusEl) {
      this.summaryStatusEl.setText(this.plugin.getLastSummaryLabel());
    }
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
    window.addEventListener("keydown", this.handleKeyDown);
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
          new import_obsidian18.Notice("Capture cleared");
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
    if (!this.plugin.settings.enableAIRouting) {
      return;
    }
    this.createCollapsibleSection(
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
      new import_obsidian18.Notice("Enter some text first.");
      return;
    }
    this.setLoading(true);
    try {
      const route = await this.plugin.routeText(text);
      if (!route) {
        new import_obsidian18.Notice("Brain could not classify that entry");
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
      new import_obsidian18.Notice("Enter some text first.");
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
var BrainPlugin = class extends import_obsidian19.Plugin {
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
      new import_obsidian19.Notice("Unable to open the sidebar");
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
    new import_obsidian19.Notice(message);
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
      new import_obsidian19.Notice(aiStatus.message);
      return null;
    }
    const route = await this.aiService.routeText(text, this.settings);
    if (route) {
      this.updateSidebarResult(`Auto-routed as ${route}`);
    }
    return route;
  }
  async askAboutCurrentNote() {
    await this.askBrainForContext(
      () => this.contextService.getCurrentNoteContext(),
      "Summarize Current Note",
      "summarize"
    );
  }
  async askAboutCurrentNoteWithTemplate() {
    await this.askBrainForContext(
      () => this.contextService.getCurrentNoteContext(),
      "Synthesize Current Note"
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
  async createTopicPage() {
    await this.createTopicPageForScope();
  }
  async createTopicPageForScope(defaultScope) {
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
      this.lastSummaryAt = /* @__PURE__ */ new Date();
      this.updateSidebarSummary(result.content);
      this.updateSidebarResult(
        result.usedAI ? `AI topic page saved to ${saved.path}` : `Topic page saved to ${saved.path}`
      );
      await this.refreshSidebarStatusBestEffort();
      new import_obsidian19.Notice(`Topic page saved to ${saved.path}`);
      const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.openFile(saved);
        this.app.workspace.revealLeaf(leaf);
      }
    } catch (error) {
      showError(error, "Could not create that topic page");
    }
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
    new import_obsidian19.Notice(
      result.persistedPath ? `${result.title} saved to ${result.persistedPath}` : result.usedAI ? `${result.title} generated with AI` : `${result.title} generated locally`
    );
    if (!this.hasOpenSidebar()) {
      new ResultModal(this.app, `Brain ${result.title}`, result.content).open();
    }
    return result;
  }
  async saveSynthesisResult(result, context) {
    const saved = await this.noteService.createGeneratedNote(
      result.noteTitle,
      this.buildSynthesisNoteContent(result, context),
      context.sourceLabel,
      context.sourcePath,
      context.sourcePaths
    );
    return `Saved artifact to ${saved.path}`;
  }
  async insertSynthesisIntoCurrentNote(result, context) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian19.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      throw new Error("Open a markdown note first");
    }
    const addition = this.buildInsertedSynthesisContent(result, context);
    const editor = view.editor;
    const lastLine = editor.lastLine();
    const lastLineText = editor.getLine(lastLine);
    const endPosition = { line: lastLine, ch: lastLineText.length };
    const separator = getAppendSeparator(editor.getValue());
    editor.replaceRange(`${separator}${addition}
`, endPosition);
    return `Inserted synthesis into ${view.file.path}`;
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
      new import_obsidian19.Notice("No inbox entries found");
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
    const selection = this.getActiveSelectionText();
    if (selection) {
      const saved = await this.taskService.appendTask(selection);
      const message = `Saved task from selection to ${saved.path}`;
      await this.reportActionResult(message);
      return;
    }
    new import_obsidian19.Notice("No selection found. Opening task entry modal.");
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
      new import_obsidian19.Notice("Unable to open today's journal");
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
    if (!this.settings.enableAISummaries && !this.settings.enableAIRouting) {
      return "AI off";
    }
    const aiStatus = await getAIConfigurationStatus(this.settings);
    return aiStatus.configured ? aiStatus.message.replace(/^Ready to use /, "").replace(/\.$/, "") : aiStatus.message.replace(/\.$/, "");
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
    const files = this.app.vault.getMarkdownFiles().filter((file) => !this.isBrainGeneratedFile(file.path)).sort((left, right) => right.stat.mtime - left.stat.mtime);
    if (!files.length) {
      new import_obsidian19.Notice("No markdown files found");
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
      this.lastSummaryAt = /* @__PURE__ */ new Date();
      this.updateSidebarSummary(result.content);
      this.updateSidebarResult(
        result.usedAI ? `AI answer from ${context.sourceLabel}` : `Local answer from ${context.sourceLabel}`
      );
      await this.refreshSidebarStatusBestEffort();
      new SynthesisResultModal(this.app, {
        context,
        result,
        canInsert: this.hasActiveMarkdownNote(),
        onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
        onSave: async () => this.saveSynthesisResult(result, context),
        onActionComplete: async (message) => {
          await this.reportActionResult(message);
        }
      }).open();
    } catch (error) {
      showError(error, "Could not answer that question");
    }
  }
  async runSynthesisFlow(context, template) {
    const result = await this.synthesisService.run(template, context);
    this.lastSummaryAt = /* @__PURE__ */ new Date();
    this.updateSidebarSummary(result.content);
    this.updateSidebarResult(
      result.usedAI ? `AI ${result.title.toLowerCase()} from ${context.sourceLabel}` : `Local ${result.title.toLowerCase()} from ${context.sourceLabel}`
    );
    await this.refreshSidebarStatusBestEffort();
    new SynthesisResultModal(this.app, {
      context,
      result,
      canInsert: this.hasActiveMarkdownNote(),
      onInsert: async () => this.insertSynthesisIntoCurrentNote(result, context),
      onSave: async () => this.saveSynthesisResult(result, context),
      onActionComplete: async (message) => {
        await this.reportActionResult(message);
      }
    }).open();
  }
  async pickSynthesisTemplate(title) {
    return await new TemplatePickerModal(this.app, { title }).openPicker();
  }
  buildSynthesisNoteContent(result, context) {
    return [
      `Action: ${result.action}`,
      `Generated: ${formatDateTimeKey(/* @__PURE__ */ new Date())}`,
      `Context length: ${context.originalLength} characters.`,
      "",
      stripLeadingTitle(result.content),
      ""
    ].join("\n");
  }
  buildInsertedSynthesisContent(result, context) {
    return [
      `## Brain ${result.title}`,
      ...this.buildContextBulletLines(context),
      `- Generated: ${formatDateTimeKey(/* @__PURE__ */ new Date())}`,
      "",
      stripLeadingTitle(result.content)
    ].join("\n");
  }
  hasActiveMarkdownNote() {
    var _a;
    return Boolean((_a = this.app.workspace.getActiveViewOfType(import_obsidian19.MarkdownView)) == null ? void 0 : _a.file);
  }
  buildContextSourceLines(context) {
    return formatContextSourceLines(context);
  }
  buildContextBulletLines(context) {
    const sourceLines = this.buildContextSourceLines(context);
    return sourceLines.map((line) => `- ${line}`);
  }
  isBrainGeneratedFile(path) {
    return isUnderFolder(path, this.settings.summariesFolder) || isUnderFolder(path, this.settings.reviewsFolder);
  }
  getActiveSelectionText() {
    var _a, _b, _c;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian19.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbW9kZWwtc2VsZWN0aW9uLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZS50cyIsICJzcmMvdXRpbHMvdGV4dC50cyIsICJzcmMvdXRpbHMvcGF0aC50cyIsICJzcmMvdXRpbHMvZGF0ZS50cyIsICJzcmMvc2VydmljZXMvaW5ib3gtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL2Zvcm1hdC1oZWxwZXJzLnRzIiwgInNyYy91dGlscy9xdWVzdGlvbi1hbnN3ZXItZm9ybWF0LnRzIiwgInNyYy91dGlscy9xdWVzdGlvbi1hbnN3ZXItbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktZm9ybWF0LnRzIiwgInNyYy9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZS50cyIsICJzcmMvdXRpbHMvc3ludGhlc2lzLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvc3ludGhlc2lzLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvdGFzay1leHRyYWN0LWZvcm1hdC50cyIsICJzcmMvdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL29wZW4tcXVlc3Rpb25zLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvY2xlYW4tbm90ZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9wcm9qZWN0LWJyaWVmLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy10ZW1wbGF0ZS50cyIsICJzcmMvc2VydmljZXMvdG9waWMtcGFnZS1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy90b3BpYy1wYWdlLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1ub3JtYWxpemUudHMiLCAic3JjL3NlcnZpY2VzL3Rhc2stc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvdXRpbHMvc3VtbWFyeS1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NvbnRleHQtZm9ybWF0LnRzIiwgInNyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3ZpZXdzL3Byb21wdC1tb2RhbHMudHMiLCAic3JjL3ZpZXdzL2ZpbGUtZ3JvdXAtcGlja2VyLW1vZGFsLnRzIiwgInNyYy92aWV3cy9pbmJveC1yZXZpZXctbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL3V0aWxzL2luYm94LXJldmlldy50cyIsICJzcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWwudHMiLCAic3JjL3ZpZXdzL3Jldmlldy1oaXN0b3J5LW1vZGFsLnRzIiwgInNyYy92aWV3cy9zeW50aGVzaXMtcmVzdWx0LW1vZGFsLnRzIiwgInNyYy92aWV3cy90ZW1wbGF0ZS1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyIsICJzcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4sIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBCcmFpblBsdWdpblNldHRpbmdzLFxuICBub3JtYWxpemVCcmFpblNldHRpbmdzLFxufSBmcm9tIFwiLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJyYWluU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5ncy10YWJcIjtcbmltcG9ydCB7IENvbnRleHRTZXJ2aWNlLCBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgTm90ZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvbm90ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZVwiO1xuaW1wb3J0IHsgUXVlc3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2VcIjtcbmltcG9ydCB7IFN1bW1hcnlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N1bW1hcnktc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0LCBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUb3BpY1BhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkF1dGhTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2F1dGgtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIFByb21wdE1vZGFsLFxuICBSZXN1bHRNb2RhbCxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3Byb21wdC1tb2RhbHNcIjtcbmltcG9ydCB7IEZpbGVHcm91cFBpY2tlck1vZGFsIH0gZnJvbSBcIi4vc3JjL3ZpZXdzL2ZpbGUtZ3JvdXAtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBJbmJveFJldmlld01vZGFsIH0gZnJvbSBcIi4vc3JjL3ZpZXdzL2luYm94LXJldmlldy1tb2RhbFwiO1xuaW1wb3J0IHsgUXVlc3Rpb25TY29wZU1vZGFsIH0gZnJvbSBcIi4vc3JjL3ZpZXdzL3F1ZXN0aW9uLXNjb3BlLW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5pbXBvcnQgeyBSZXZpZXdIaXN0b3J5TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWxcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdE1vZGFsIH0gZnJvbSBcIi4vc3JjL3ZpZXdzL3N5bnRoZXNpcy1yZXN1bHQtbW9kYWxcIjtcbmltcG9ydCB7IFRlbXBsYXRlUGlja2VyTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuL3NyYy90eXBlc1wiO1xuaW1wb3J0IHtcbiAgQlJBSU5fVklFV19UWVBFLFxuICBCcmFpblNpZGViYXJWaWV3LFxufSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuL3NyYy91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBTdW1tYXJ5UmVzdWx0IH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N1bW1hcnktc2VydmljZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2NvbnRleHQtZm9ybWF0XCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4vc3JjL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQ29tbWFuZHMgfSBmcm9tIFwiLi9zcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHNcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuL3NyYy91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBcHBlbmRTZXBhcmF0b3IsIHN0cmlwTGVhZGluZ1RpdGxlIH0gZnJvbSBcIi4vc3JjL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuL3NyYy91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJhaW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIHZhdWx0U2VydmljZSE6IFZhdWx0U2VydmljZTtcbiAgaW5ib3hTZXJ2aWNlITogSW5ib3hTZXJ2aWNlO1xuICBub3RlU2VydmljZSE6IE5vdGVTZXJ2aWNlO1xuICB0YXNrU2VydmljZSE6IFRhc2tTZXJ2aWNlO1xuICBqb3VybmFsU2VydmljZSE6IEpvdXJuYWxTZXJ2aWNlO1xuICByZXZpZXdMb2dTZXJ2aWNlITogUmV2aWV3TG9nU2VydmljZTtcbiAgcmV2aWV3U2VydmljZSE6IFJldmlld1NlcnZpY2U7XG4gIHF1ZXN0aW9uU2VydmljZSE6IFF1ZXN0aW9uU2VydmljZTtcbiAgY29udGV4dFNlcnZpY2UhOiBDb250ZXh0U2VydmljZTtcbiAgc3ludGhlc2lzU2VydmljZSE6IFN5bnRoZXNpc1NlcnZpY2U7XG4gIHRvcGljUGFnZVNlcnZpY2UhOiBUb3BpY1BhZ2VTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBzdW1tYXJ5U2VydmljZSE6IFN1bW1hcnlTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGFzdFN1bW1hcnlBdDogRGF0ZSB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy52YXVsdFNlcnZpY2UgPSBuZXcgVmF1bHRTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFpU2VydmljZSA9IG5ldyBCcmFpbkFJU2VydmljZSgpO1xuICAgIHRoaXMuYXV0aFNlcnZpY2UgPSBuZXcgQnJhaW5BdXRoU2VydmljZSh0aGlzKTtcbiAgICB0aGlzLmluYm94U2VydmljZSA9IG5ldyBJbmJveFNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMubm90ZVNlcnZpY2UgPSBuZXcgTm90ZVNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMudGFza1NlcnZpY2UgPSBuZXcgVGFza1NlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuam91cm5hbFNlcnZpY2UgPSBuZXcgSm91cm5hbFNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLmNvbnRleHRTZXJ2aWNlID0gbmV3IENvbnRleHRTZXJ2aWNlKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UgPSBuZXcgUmV2aWV3TG9nU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3U2VydmljZSA9IG5ldyBSZXZpZXdTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICB0aGlzLmluYm94U2VydmljZSxcbiAgICAgIHRoaXMudGFza1NlcnZpY2UsXG4gICAgICB0aGlzLmpvdXJuYWxTZXJ2aWNlLFxuICAgICAgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucXVlc3Rpb25TZXJ2aWNlID0gbmV3IFF1ZXN0aW9uU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3VtbWFyeVNlcnZpY2UgPSBuZXcgU3VtbWFyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3ludGhlc2lzU2VydmljZSA9IG5ldyBTeW50aGVzaXNTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlID0gbmV3IFRvcGljUGFnZVNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnJlZ2lzdGVyVmlldyhCUkFJTl9WSUVXX1RZUEUsIChsZWFmKSA9PiB7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgICAgdGhpcy5zaWRlYmFyVmlldyA9IHZpZXc7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfSk7XG5cbiAgICAgIHJlZ2lzdGVyQ29tbWFuZHModGhpcyk7XG5cbiAgICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgQnJhaW5TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgZmluaXNoIGxvYWRpbmcgQnJhaW5cIik7XG4gICAgfVxuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5zaWRlYmFyVmlldyA9IG51bGw7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MobG9hZGVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBsb2FkIEJyYWluIHNldHRpbmdzXCIpO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3Moe30pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUtub3duRm9sZGVycyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gIH1cblxuICBhc3luYyBvcGVuU2lkZWJhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdGhlIHNpZGViYXJcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcbiAgICAgIHR5cGU6IEJSQUlOX1ZJRVdfVFlQRSxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9KTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIGdldE9wZW5TaWRlYmFyVmlldygpOiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCB7XG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBsZWF2ZXMpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEJyYWluU2lkZWJhclZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaGFzT3BlblNpZGViYXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgdXBkYXRlU2lkZWJhclJlc3VsdCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5zZXRMYXN0UmVzdWx0KHRleHQpO1xuICB9XG5cbiAgdXBkYXRlU2lkZWJhclN1bW1hcnkodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFN1bW1hcnkodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU2lkZWJhclN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCByZWZyZXNoIHNpZGViYXIgc3RhdHVzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChtZXNzYWdlKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICB9XG5cbiAgZ2V0TGFzdFN1bW1hcnlMYWJlbCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmxhc3RTdW1tYXJ5QXQgPyBmb3JtYXREYXRlVGltZUtleSh0aGlzLmxhc3RTdW1tYXJ5QXQpIDogXCJObyBhcnRpZmFjdCB5ZXRcIjtcbiAgfVxuXG4gIGFzeW5jIHJvdXRlVGV4dCh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyh0aGlzLnNldHRpbmdzKTtcbiAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgIG5ldyBOb3RpY2UoYWlTdGF0dXMubWVzc2FnZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnJvdXRlVGV4dCh0ZXh0LCB0aGlzLnNldHRpbmdzKTtcbiAgICBpZiAocm91dGUpIHtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgQXV0by1yb3V0ZWQgYXMgJHtyb3V0ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJvdXRlO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIixcbiAgICAgIFwic3VtbWFyaXplXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgXCJTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0U2VsZWN0ZWRUZXh0Q29udGV4dCgpLFxuICAgICAgXCJFeHRyYWN0IFRhc2tzIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgICBcImV4dHJhY3QtdGFza3NcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRSZWNlbnRGaWxlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0UmVjZW50RmlsZXNDb250ZXh0KCksXG4gICAgICBcIkNsZWFuIE5vdGUgRnJvbSBSZWNlbnQgRmlsZXNcIixcbiAgICAgIFwicmV3cml0ZS1jbGVhbi1ub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudEZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKSxcbiAgICAgIFwiRHJhZnQgQnJpZWYgRnJvbSBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVOb3RlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2NvcGUgPSBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIlN5bnRoZXNpemUgTm90ZXNcIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgdGhpcy5yZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgICAgICBzY29wZSxcbiAgICAgICAgXCJTZWxlY3QgTm90ZXMgdG8gU3ludGhlc2l6ZVwiLFxuICAgICAgKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gYXdhaXQgdGhpcy5waWNrU3ludGhlc2lzVGVtcGxhdGUoXCJTeW50aGVzaXplIE5vdGVzXCIpO1xuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucnVuU3ludGhlc2lzRmxvdyhjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc3ludGhlc2l6ZSB0aGVzZSBub3Rlc1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBhc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwibm90ZVwiKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25Gb3JTY29wZShcImZvbGRlclwiKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzY29wZSA9IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiQXNrIFF1ZXN0aW9uXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKHNjb3BlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhc2sgQnJhaW5cIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKGRlZmF1bHRTY29wZT86IFF1ZXN0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdG9waWMgPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiQ3JlYXRlIFRvcGljIFBhZ2VcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiVG9waWMgb3IgcXVlc3Rpb24gdG8gdHVybiBpbnRvIGEgd2lraSBwYWdlLi4uXCIsXG4gICAgICAgIHN1Ym1pdExhYmVsOiBcIkNyZWF0ZVwiLFxuICAgICAgICBtdWx0aWxpbmU6IHRydWUsXG4gICAgICB9KS5vcGVuUHJvbXB0KCk7XG4gICAgICBpZiAoIXRvcGljKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NvcGUgPSBkZWZhdWx0U2NvcGUgPz8gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyBmb3IgVG9waWMgUGFnZVwiLFxuICAgICAgKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudG9waWNQYWdlU2VydmljZS5jcmVhdGVUb3BpY1BhZ2UodG9waWMsIGNvbnRleHQpO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICAgIHJlc3VsdC5jb250ZW50LFxuICAgICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aHMsXG4gICAgICApO1xuXG4gICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGBBSSB0b3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gXG4gICAgICAgICAgOiBgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCxcbiAgICAgICk7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgICAgbmV3IE5vdGljZShgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCk7XG5cbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKHNhdmVkKTtcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgY3JlYXRlIHRoYXQgdG9waWMgcGFnZVwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coXG4gICAgbG9va2JhY2tEYXlzPzogbnVtYmVyLFxuICAgIGxhYmVsPzogc3RyaW5nLFxuICApOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN1bW1hcnlTZXJ2aWNlLmdlbmVyYXRlU3VtbWFyeShsb29rYmFja0RheXMsIGxhYmVsKTtcbiAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclN1bW1hcnkoYCR7cmVzdWx0LnRpdGxlfVxcblxcbiR7cmVzdWx0LmNvbnRlbnR9YCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KFxuICAgICAgcmVzdWx0LnVzZWRBSSA/IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIHdpdGggQUlgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIG5ldyBOb3RpY2UoXG4gICAgICByZXN1bHQucGVyc2lzdGVkUGF0aFxuICAgICAgICA/IGAke3Jlc3VsdC50aXRsZX0gc2F2ZWQgdG8gJHtyZXN1bHQucGVyc2lzdGVkUGF0aH1gXG4gICAgICAgIDogcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWBcbiAgICAgICAgICA6IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIGxvY2FsbHlgLFxuICAgICk7XG4gICAgaWYgKCF0aGlzLmhhc09wZW5TaWRlYmFyKCkpIHtcbiAgICAgIG5ldyBSZXN1bHRNb2RhbCh0aGlzLmFwcCwgYEJyYWluICR7cmVzdWx0LnRpdGxlfWAsIHJlc3VsdC5jb250ZW50KS5vcGVuKCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyBzYXZlU3ludGhlc2lzUmVzdWx0KFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICByZXN1bHQubm90ZVRpdGxlLFxuICAgICAgdGhpcy5idWlsZFN5bnRoZXNpc05vdGVDb250ZW50KHJlc3VsdCwgY29udGV4dCksXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIHJldHVybiBgU2F2ZWQgYXJ0aWZhY3QgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBpbnNlcnRTeW50aGVzaXNJbnRvQ3VycmVudE5vdGUoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGFkZGl0aW9uID0gdGhpcy5idWlsZEluc2VydGVkU3ludGhlc2lzQ29udGVudChyZXN1bHQsIGNvbnRleHQpO1xuICAgIGNvbnN0IGVkaXRvciA9IHZpZXcuZWRpdG9yO1xuICAgIGNvbnN0IGxhc3RMaW5lID0gZWRpdG9yLmxhc3RMaW5lKCk7XG4gICAgY29uc3QgbGFzdExpbmVUZXh0ID0gZWRpdG9yLmdldExpbmUobGFzdExpbmUpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9uID0geyBsaW5lOiBsYXN0TGluZSwgY2g6IGxhc3RMaW5lVGV4dC5sZW5ndGggfTtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBnZXRBcHBlbmRTZXBhcmF0b3IoZWRpdG9yLmdldFZhbHVlKCkpO1xuICAgIGVkaXRvci5yZXBsYWNlUmFuZ2UoYCR7c2VwYXJhdG9yfSR7YWRkaXRpb259XFxuYCwgZW5kUG9zaXRpb24pO1xuICAgIHJldHVybiBgSW5zZXJ0ZWQgc3ludGhlc2lzIGludG8gJHt2aWV3LmZpbGUucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZUZyb21Nb2RhbChcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHN1Ym1pdExhYmVsOiBzdHJpbmcsXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgbXVsdGlsaW5lID0gZmFsc2UsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICB0aXRsZSxcbiAgICAgIHBsYWNlaG9sZGVyOiBtdWx0aWxpbmVcbiAgICAgICAgPyBcIldyaXRlIHlvdXIgZW50cnkgaGVyZS4uLlwiXG4gICAgICAgIDogXCJUeXBlIGhlcmUuLi5cIixcbiAgICAgIHN1Ym1pdExhYmVsLFxuICAgICAgbXVsdGlsaW5lLFxuICAgIH0pLm9wZW5Qcm9tcHQoKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odmFsdWUpO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkJyYWluIGNvdWxkIG5vdCBzYXZlIHRoYXQgZW50cnlcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY2FwdHVyZU5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICByZXR1cm4gYENhcHR1cmVkIG5vdGUgaW4gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVKb3VybmFsKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgam91cm5hbCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NJbmJveCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmdldFJlY2VudEluYm94RW50cmllcygpO1xuICAgIGlmICghZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBpbmJveCBlbnRyaWVzIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBJbmJveFJldmlld01vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzLnJldmlld1NlcnZpY2UsIGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICB9KS5vcGVuKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBMb2FkZWQgJHtlbnRyaWVzLmxlbmd0aH0gaW5ib3ggZW50cmllc2ApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBhc3luYyBvcGVuUmV2aWV3SGlzdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmdldFJldmlld0VudHJpZXMoKTtcbiAgICBuZXcgUmV2aWV3SGlzdG9yeU1vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBhZGRUYXNrRnJvbVNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3Rpb24gPSB0aGlzLmdldEFjdGl2ZVNlbGVjdGlvblRleHQoKTtcbiAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayhzZWxlY3Rpb24pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGBTYXZlZCB0YXNrIGZyb20gc2VsZWN0aW9uIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IE5vdGljZShcIk5vIHNlbGVjdGlvbiBmb3VuZC4gT3BlbmluZyB0YXNrIGVudHJ5IG1vZGFsLlwiKTtcbiAgICBhd2FpdCB0aGlzLmNhcHR1cmVGcm9tTW9kYWwoXCJBZGQgVGFza1wiLCBcIlNhdmUgdGFza1wiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBvcGVuVG9kYXlzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5lbnN1cmVKb3VybmFsRmlsZSgpO1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdG9kYXkncyBqb3VybmFsXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgY29uc3QgbWVzc2FnZSA9IGBPcGVuZWQgJHtmaWxlLnBhdGh9YDtcbiAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIGdldEluYm94Q291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UuZ2V0VW5yZXZpZXdlZENvdW50KCk7XG4gIH1cblxuICBhc3luYyBnZXRPcGVuVGFza0NvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudGFza1NlcnZpY2UuZ2V0T3BlblRhc2tDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3SGlzdG9yeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyeUNvdW50KCk7XG4gIH1cblxuICBhc3luYyByZW9wZW5SZXZpZXdFbnRyeShlbnRyeToge1xuICAgIGhlYWRpbmc6IHN0cmluZztcbiAgICBwcmV2aWV3OiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlSW5kZXg6IG51bWJlcjtcbiAgfSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnJlb3BlbkZyb21SZXZpZXdMb2coe1xuICAgICAgYWN0aW9uOiBcInJlb3BlblwiLFxuICAgICAgdGltZXN0YW1wOiBcIlwiLFxuICAgICAgc291cmNlUGF0aDogXCJcIixcbiAgICAgIGZpbGVNdGltZTogRGF0ZS5ub3coKSxcbiAgICAgIGVudHJ5SW5kZXg6IDAsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGVudHJ5LnByZXZpZXcsXG4gICAgICBzaWduYXR1cmU6IGVudHJ5LnNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyBnZXRBaVN0YXR1c1RleHQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgJiYgIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm4gXCJBSSBvZmZcIjtcbiAgICB9XG4gICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5zZXR0aW5ncyk7XG4gICAgcmV0dXJuIGFpU3RhdHVzLmNvbmZpZ3VyZWQgPyBhaVN0YXR1cy5tZXNzYWdlLnJlcGxhY2UoL15SZWFkeSB0byB1c2UgLywgXCJcIikucmVwbGFjZSgvXFwuJC8sIFwiXCIpIDogYWlTdGF0dXMubWVzc2FnZS5yZXBsYWNlKC9cXC4kLywgXCJcIik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza0JyYWluRm9yQ29udGV4dChcbiAgICByZXNvbHZlcjogKCkgPT4gUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PixcbiAgICBtb2RhbFRpdGxlOiBzdHJpbmcsXG4gICAgZGVmYXVsdFRlbXBsYXRlPzogU3ludGhlc2lzVGVtcGxhdGUsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcmVzb2x2ZXIoKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gZGVmYXVsdFRlbXBsYXRlID8/IChhd2FpdCB0aGlzLnBpY2tTeW50aGVzaXNUZW1wbGF0ZShtb2RhbFRpdGxlKSk7XG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoYXQgY29udGV4dFwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGU6IFF1ZXN0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBzd2l0Y2ggKHNjb3BlKSB7XG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJ2YXVsdFwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRWYXVsdENvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBFbnRpcmUgVmF1bHRcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcImdyb3VwXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICBzY29wZTogUXVlc3Rpb25TY29wZSxcbiAgICBncm91cFBpY2tlclRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dCB8IG51bGw+IHtcbiAgICBzd2l0Y2ggKHNjb3BlKSB7XG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJmb2xkZXJcIjpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJ2YXVsdFwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRWYXVsdENvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJncm91cFwiOiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKGdyb3VwUGlja2VyVGl0bGUpO1xuICAgICAgICBpZiAoIWZpbGVzIHx8ICFmaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlcyk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRTZWxlY3RlZEdyb3VwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGlja1NlbGVjdGVkTWFya2Rvd25GaWxlcyhcIlNlbGVjdCBOb3Rlc1wiKTtcbiAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlcyksXG4gICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IFNlbGVjdGVkIE5vdGVzXCIsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHNlbGVjdCBub3RlcyBmb3IgQnJhaW5cIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwaWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKHRpdGxlOiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlW10gfCBudWxsPiB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdFxuICAgICAgLmdldE1hcmtkb3duRmlsZXMoKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIXRoaXMuaXNCcmFpbkdlbmVyYXRlZEZpbGUoZmlsZS5wYXRoKSlcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG5cbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIG1hcmtkb3duIGZpbGVzIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IG5ldyBGaWxlR3JvdXBQaWNrZXJNb2RhbCh0aGlzLmFwcCwgZmlsZXMsIHtcbiAgICAgIHRpdGxlLFxuICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICByZXNvbHZlcjogKCkgPT4gUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PixcbiAgICBtb2RhbFRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcmVzb2x2ZXIoKTtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBtb2RhbFRpdGxlLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJBc2sgYSBxdWVzdGlvbiBhYm91dCB0aGlzIGNvbnRleHQuLi5cIixcbiAgICAgICAgc3VibWl0TGFiZWw6IFwiQXNrXCIsXG4gICAgICAgIG11bHRpbGluZTogdHJ1ZSxcbiAgICAgIH0pLm9wZW5Qcm9tcHQoKTtcbiAgICAgIGlmICghcXVlc3Rpb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXN0aW9uU2VydmljZS5hbnN3ZXJRdWVzdGlvbihxdWVzdGlvbiwgY29udGV4dCk7XG4gICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGBBSSBhbnN3ZXIgZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YFxuICAgICAgICAgIDogYExvY2FsIGFuc3dlciBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgICBuZXcgU3ludGhlc2lzUmVzdWx0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgcmVzdWx0LFxuICAgICAgICBjYW5JbnNlcnQ6IHRoaXMuaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCksXG4gICAgICAgIG9uSW5zZXJ0OiBhc3luYyAoKSA9PiB0aGlzLmluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgICBvblNhdmU6IGFzeW5jICgpID0+IHRoaXMuc2F2ZVN5bnRoZXNpc1Jlc3VsdChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgICBvbkFjdGlvbkNvbXBsZXRlOiBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgICB9LFxuICAgICAgfSkub3BlbigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFuc3dlciB0aGF0IHF1ZXN0aW9uXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuU3ludGhlc2lzRmxvdyhcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zeW50aGVzaXNTZXJ2aWNlLnJ1bih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgID8gYEFJICR7cmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCl9IGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBcbiAgICAgICAgOiBgTG9jYWwgJHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX0gZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IFN5bnRoZXNpc1Jlc3VsdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBjb250ZXh0LFxuICAgICAgcmVzdWx0LFxuICAgICAgY2FuSW5zZXJ0OiB0aGlzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICBvblNhdmU6IGFzeW5jICgpID0+IHRoaXMuc2F2ZVN5bnRoZXNpc1Jlc3VsdChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgb25BY3Rpb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICB9LFxuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGlja1N5bnRoZXNpc1RlbXBsYXRlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBUZW1wbGF0ZVBpY2tlck1vZGFsKHRoaXMuYXBwLCB7IHRpdGxlIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRTeW50aGVzaXNOb3RlQ29udGVudChcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBbXG4gICAgICBgQWN0aW9uOiAke3Jlc3VsdC5hY3Rpb259YCxcbiAgICAgIGBHZW5lcmF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YCxcbiAgICAgIGBDb250ZXh0IGxlbmd0aDogJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofSBjaGFyYWN0ZXJzLmAsXG4gICAgICBcIlwiLFxuICAgICAgc3RyaXBMZWFkaW5nVGl0bGUocmVzdWx0LmNvbnRlbnQpLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFtcbiAgICAgIGAjIyBCcmFpbiAke3Jlc3VsdC50aXRsZX1gLFxuICAgICAgLi4udGhpcy5idWlsZENvbnRleHRCdWxsZXRMaW5lcyhjb250ZXh0KSxcbiAgICAgIGAtIEdlbmVyYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gLFxuICAgICAgXCJcIixcbiAgICAgIHN0cmlwTGVhZGluZ1RpdGxlKHJlc3VsdC5jb250ZW50KSxcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBwcml2YXRlIGhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpPy5maWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0U291cmNlTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvbnRleHRCdWxsZXRMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHNvdXJjZUxpbmVzID0gdGhpcy5idWlsZENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0KTtcbiAgICByZXR1cm4gc291cmNlTGluZXMubWFwKChsaW5lKSA9PiBgLSAke2xpbmV9YCk7XG4gIH1cblxuICBwcml2YXRlIGlzQnJhaW5HZW5lcmF0ZWRGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSB8fFxuICAgICAgaXNVbmRlckZvbGRlcihwYXRoLCB0aGlzLnNldHRpbmdzLnJldmlld3NGb2xkZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuICBvcGVuQUlCYXNlVXJsOiBzdHJpbmc7XG5cbiAgYWlQcm92aWRlcjogXCJvcGVuYWlcIiB8IFwiY29kZXhcIiB8IFwiZ2VtaW5pXCI7XG4gIGNvZGV4TW9kZWw6IHN0cmluZztcbiAgZ2VtaW5pQXBpS2V5OiBzdHJpbmc7XG4gIGdlbWluaU1vZGVsOiBzdHJpbmc7XG5cbiAgc3VtbWFyeUxvb2tiYWNrRGF5czogbnVtYmVyO1xuICBzdW1tYXJ5TWF4Q2hhcnM6IG51bWJlcjtcblxuICBwZXJzaXN0U3VtbWFyaWVzOiBib29sZWFuO1xuXG4gIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICBpbmJveEZpbGU6IFwiQnJhaW4vaW5ib3gubWRcIixcbiAgdGFza3NGaWxlOiBcIkJyYWluL3Rhc2tzLm1kXCIsXG4gIGpvdXJuYWxGb2xkZXI6IFwiQnJhaW4vam91cm5hbFwiLFxuICBub3Rlc0ZvbGRlcjogXCJCcmFpbi9ub3Rlc1wiLFxuICBzdW1tYXJpZXNGb2xkZXI6IFwiQnJhaW4vc3VtbWFyaWVzXCIsXG4gIHJldmlld3NGb2xkZXI6IFwiQnJhaW4vcmV2aWV3c1wiLFxuICBlbmFibGVBSVN1bW1hcmllczogZmFsc2UsXG4gIGVuYWJsZUFJUm91dGluZzogZmFsc2UsXG4gIG9wZW5BSUFwaUtleTogXCJcIixcbiAgb3BlbkFJTW9kZWw6IFwiZ3B0LTRvLW1pbmlcIixcbiAgb3BlbkFJQmFzZVVybDogXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxL2NoYXQvY29tcGxldGlvbnNcIixcbiAgYWlQcm92aWRlcjogXCJvcGVuYWlcIixcbiAgY29kZXhNb2RlbDogXCJcIixcbiAgZ2VtaW5pQXBpS2V5OiBcIlwiLFxuICBnZW1pbmlNb2RlbDogXCJnZW1pbmktMS41LWZsYXNoXCIsXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IDcsXG4gIHN1bW1hcnlNYXhDaGFyczogMTIwMDAsXG4gIHBlcnNpc3RTdW1tYXJpZXM6IHRydWUsXG4gIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogW10sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgaW5ib3hGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgobWVyZ2VkLmluYm94RmlsZSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5pbmJveEZpbGUpLFxuICAgIHRhc2tzRmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKG1lcmdlZC50YXNrc0ZpbGUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1MudGFza3NGaWxlKSxcbiAgICBqb3VybmFsRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuam91cm5hbEZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muam91cm5hbEZvbGRlcixcbiAgICApLFxuICAgIG5vdGVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQubm90ZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm5vdGVzRm9sZGVyLFxuICAgICksXG4gICAgc3VtbWFyaWVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuc3VtbWFyaWVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJpZXNGb2xkZXIsXG4gICAgKSxcbiAgICByZXZpZXdzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQucmV2aWV3c0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MucmV2aWV3c0ZvbGRlcixcbiAgICApLFxuICAgIGVuYWJsZUFJU3VtbWFyaWVzOiBCb29sZWFuKG1lcmdlZC5lbmFibGVBSVN1bW1hcmllcyksXG4gICAgZW5hYmxlQUlSb3V0aW5nOiBCb29sZWFuKG1lcmdlZC5lbmFibGVBSVJvdXRpbmcpLFxuICAgIG9wZW5BSUFwaUtleTogdHlwZW9mIG1lcmdlZC5vcGVuQUlBcGlLZXkgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQub3BlbkFJQXBpS2V5LnRyaW0oKSA6IFwiXCIsXG4gICAgb3BlbkFJTW9kZWw6XG4gICAgICB0eXBlb2YgbWVyZ2VkLm9wZW5BSU1vZGVsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5vcGVuQUlNb2RlbC50cmltKClcbiAgICAgICAgPyBtZXJnZWQub3BlbkFJTW9kZWwudHJpbSgpXG4gICAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5vcGVuQUlNb2RlbCxcbiAgICBvcGVuQUlCYXNlVXJsOlxuICAgICAgdHlwZW9mIG1lcmdlZC5vcGVuQUlCYXNlVXJsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5vcGVuQUlCYXNlVXJsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5vcGVuQUlCYXNlVXJsLnRyaW0oKVxuICAgICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1Mub3BlbkFJQmFzZVVybCxcbiAgICBhaVByb3ZpZGVyOlxuICAgICAgbWVyZ2VkLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCJcbiAgICAgICAgPyBcImdlbWluaVwiXG4gICAgICAgIDogbWVyZ2VkLmFpUHJvdmlkZXIgPT09IFwiY29kZXhcIlxuICAgICAgICAgID8gXCJjb2RleFwiXG4gICAgICAgICAgOiBcIm9wZW5haVwiLFxuICAgIGNvZGV4TW9kZWw6IHR5cGVvZiBtZXJnZWQuY29kZXhNb2RlbCA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5jb2RleE1vZGVsLnRyaW0oKSA6IFwiXCIsXG4gICAgZ2VtaW5pQXBpS2V5OiB0eXBlb2YgbWVyZ2VkLmdlbWluaUFwaUtleSA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5nZW1pbmlBcGlLZXkudHJpbSgpIDogXCJcIixcbiAgICBnZW1pbmlNb2RlbDpcbiAgICAgIHR5cGVvZiBtZXJnZWQuZ2VtaW5pTW9kZWwgPT09IFwic3RyaW5nXCIgJiYgbWVyZ2VkLmdlbWluaU1vZGVsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5nZW1pbmlNb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmdlbWluaU1vZGVsLFxuICAgIHN1bW1hcnlMb29rYmFja0RheXM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeUxvb2tiYWNrRGF5cywgMSwgMzY1LCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgIHN1bW1hcnlNYXhDaGFyczogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TWF4Q2hhcnMsIDEwMDAsIDEwMDAwMCwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgIHBlcnNpc3RTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLnBlcnNpc3RTdW1tYXJpZXMpLFxuICAgIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogQXJyYXkuaXNBcnJheShtZXJnZWQuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zKVxuICAgICAgPyAobWVyZ2VkLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyBhcyBzdHJpbmdbXSkuZmlsdGVyKChzKSA9PiB0eXBlb2YgcyA9PT0gXCJzdHJpbmdcIilcbiAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGNsYW1wSW50ZWdlcihcbiAgdmFsdWU6IHVua25vd24sXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlcixcbiAgZmFsbGJhY2s6IG51bWJlcixcbik6IG51bWJlciB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcbiAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbHVlKSk7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZShwYXJzZWQpKSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHBhcnNlZCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxsYmFjaztcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVGV4dENvbXBvbmVudCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQge1xuICBnZXRNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldE5leHRNb2RlbFZhbHVlLFxuICBpc0N1c3RvbU1vZGVsVmFsdWUsXG59IGZyb20gXCIuLi91dGlscy9tb2RlbC1zZWxlY3Rpb25cIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuY29uc3QgT1BFTkFJX1BSRVNFVF9NT0RFTFMgPSBbXG4gIFwiZ3B0LTRvLW1pbmlcIixcbiAgXCJncHQtNG9cIixcbiAgXCJvMS1taW5pXCIsXG4gIFwibzEtcHJldmlld1wiLFxuICBcImdwdC0zLjUtdHVyYm9cIixcbl0gYXMgY29uc3Q7XG5cbmNvbnN0IEdFTUlOSV9QUkVTRVRfTU9ERUxTID0gW1xuICBcImdlbWluaS0xLjUtZmxhc2hcIixcbiAgXCJnZW1pbmktMS41LWZsYXNoLThiXCIsXG4gIFwiZ2VtaW5pLTEuNS1wcm9cIixcbiAgXCJnZW1pbmktMi4wLWZsYXNoXCIsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogQnJhaW5QbHVnaW47XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXG4gICAgLy8gTGlzdGVuIGZvciBzZXR0aW5nIHVwZGF0ZXMgKGUuZy4sIGZyb20gYXV0aCBmbG93KVxuICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub24oXCJicmFpbjpzZXR0aW5ncy11cGRhdGVkXCIgYXMgbmV2ZXIsICgpID0+IHtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW4gU2V0dGluZ3NcIiB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0b3JhZ2VcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbmJveCBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgbm90ZSBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJJbmJveCBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiVGFza3MgZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHVzZWQgZm9yIHF1aWNrIHRhc2sgY2FwdHVyZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiVGFza3MgZmlsZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkpvdXJuYWwgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciBjb250YWluaW5nIGRhaWx5IGpvdXJuYWwgZmlsZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSm91cm5hbCBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOb3RlcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgZm9yIHByb21vdGVkIG5vdGVzIGFuZCBnZW5lcmF0ZWQgbWFya2Rvd24gYXJ0aWZhY3RzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3VtbWFyaWVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcGVyc2lzdGVkIHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiU3VtbWFyaWVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJldmlld3MgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIHRvIHN0b3JlIGluYm94IHJldmlldyBsb2dzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV2aWV3c0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlJldmlld3MgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkFJIFByb3ZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkNob29zZSB0aGUgcHJvdmlkZXIgQnJhaW4gc2hvdWxkIHVzZSBmb3Igc3ludGhlc2lzLCBxdWVzdGlvbnMsIHRvcGljIHBhZ2VzLCBhbmQgb3B0aW9uYWwgYXV0by1yb3V0aW5nLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT5cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICBvcGVuYWk6IFwiT3BlbkFJIEFQSVwiLFxuICAgICAgICAgICAgY29kZXg6IFwiT3BlbkFJIENvZGV4IChDaGF0R1BUKVwiLFxuICAgICAgICAgICAgZ2VtaW5pOiBcIkdvb2dsZSBHZW1pbmlcIixcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPSB2YWx1ZSBhcyBcIm9wZW5haVwiIHwgXCJjb2RleFwiIHwgXCJnZW1pbmlcIjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7IC8vIFJlZnJlc2ggVUkgdG8gc2hvdyByZWxldmFudCBmaWVsZHNcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICB0aGlzLmNyZWF0ZUFJU3RhdHVzU2V0dGluZyhjb250YWluZXJFbCk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgY29uc3QgYXV0aFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJPcGVuQUkgc2V0dXBcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5XG4gICAgICAgICAgICA/IFwiT3BlbkFJIGlzIHJlYWR5LiBUaGUgQVBJIGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBCcmFpbiBzZXR0aW5ncy5cIlxuICAgICAgICAgICAgOiBcIlVzZSBhbiBPcGVuQUkgQVBJIGtleSBmcm9tIHBsYXRmb3JtLm9wZW5haS5jb20sIG9yIHBvaW50IEJyYWluIGF0IGFuIE9wZW5BSS1jb21wYXRpYmxlIGVuZHBvaW50IGJlbG93LlwiLFxuICAgICAgICApO1xuXG4gICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5KSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJEaXNjb25uZWN0XCIpXG4gICAgICAgICAgICAuc2V0V2FybmluZygpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IFwiXCI7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXV0aFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIk9wZW4gT3BlbkFJIFNldHVwXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oXCJvcGVuYWlcIik7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIEFQSSBrZXlcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgXCJTdG9yZWQgbG9jYWxseSBpbiBwbHVnaW4gc2V0dGluZ3MuIFVzZSBhbiBBUEkga2V5IGZvciB0aGUgZGVmYXVsdCBPcGVuQUkgZW5kcG9pbnQuIElmIHlvdSBvdmVycmlkZSB0aGUgYmFzZSBVUkwgYmVsb3csIHRoaXMgZmllbGQgaXMgdXNlZCBhcyB0aGF0IGVuZHBvaW50J3MgYmVhcmVyIHRva2VuLlwiLFxuICAgICAgICApXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIE9wZW5BSSBBUEkga2V5Li4uXCIpO1xuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSxcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIk9wZW5BSSBtb2RlbFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlNlbGVjdCBhIG1vZGVsIG9yIGVudGVyIGEgY3VzdG9tIG9uZS5cIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICAgIFwiZ3B0LTRvLW1pbmlcIjogXCJHUFQtNG8gTWluaSAoRGVmYXVsdClcIixcbiAgICAgICAgICAgICAgXCJncHQtNG9cIjogXCJHUFQtNG8gKFBvd2VyZnVsKVwiLFxuICAgICAgICAgICAgICBcIm8xLW1pbmlcIjogXCJvMSBNaW5pIChSZWFzb25pbmcpXCIsXG4gICAgICAgICAgICAgIFwibzEtcHJldmlld1wiOiBcIm8xIFByZXZpZXcgKFN0cm9uZyBSZWFzb25pbmcpXCIsXG4gICAgICAgICAgICAgIFwiZ3B0LTMuNS10dXJib1wiOiBcIkdQVC0zLjUgVHVyYm8gKExlZ2FjeSlcIixcbiAgICAgICAgICAgICAgY3VzdG9tOiBcIkN1c3RvbSBNb2RlbC4uLlwiLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zZXRWYWx1ZShnZXRNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsIE9QRU5BSV9QUkVTRVRfTU9ERUxTKSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgbmV4dE1vZGVsID0gZ2V0TmV4dE1vZGVsVmFsdWUoXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsXG4gICAgICAgICAgICAgICAgT1BFTkFJX1BSRVNFVF9NT0RFTFMsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCA9IG5leHRNb2RlbDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gXCJjdXN0b21cIiAmJiBuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobmV4dE1vZGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQ3VzdG9tID0gaXNDdXN0b21Nb2RlbFZhbHVlKFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsXG4gICAgICAgICAgICBPUEVOQUlfUFJFU0VUX01PREVMUyxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChpc0N1c3RvbSkge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIGN1c3RvbSBtb2RlbCBuYW1lLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcodGV4dCwgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJTZWxlY3QgQ3VzdG9tIE1vZGVsLi4uIHRvIGVudGVyIGEgbW9kZWwgbmFtZVwiKTtcbiAgICAgICAgICAgIHRleHQuc2V0VmFsdWUoXCJcIik7XG4gICAgICAgICAgICB0ZXh0LmlucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIGJhc2UgVVJMXCIpXG4gICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgIFwiT3ZlcnJpZGUgdGhlIGRlZmF1bHQgT3BlbkFJIGVuZHBvaW50IGZvciBjdXN0b20gcHJveGllcyBvciBsb2NhbCBMTE1zLiBJZiB5b3Ugc2V0IHRoaXMsIHRoZSBiZWFyZXIgdG9rZW4gYWJvdmUgaXMgc2VudCB0byB0aGF0IGVuZHBvaW50LlwiLFxuICAgICAgICApXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUJhc2VVcmwsXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQmFzZVVybCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJPcGVuQUkgYmFzZSBVUkwgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiY29kZXhcIikge1xuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiQ29kZXggc2V0dXBcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgXCJVc2UgeW91ciBDaGF0R1BUIHN1YnNjcmlwdGlvbiB0aHJvdWdoIHRoZSBvZmZpY2lhbCBDb2RleCBDTEkuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiBjaGVjayBCcmFpbidzIHNpZGViYXIgc3RhdHVzIHRvIGNvbmZpcm0gQ29kZXggaXMgcmVhZHkuXCIsXG4gICAgICAgIClcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIENvZGV4IFNldHVwXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oXCJjb2RleFwiKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJDb2RleCBtb2RlbFwiKVxuICAgICAgICAuc2V0RGVzYyhcIk9wdGlvbmFsLiBMZWF2ZSBibGFuayB0byB1c2UgdGhlIENvZGV4IENMSSBkZWZhdWx0IG1vZGVsIGZvciB5b3VyIGFjY291bnQuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKHRleHQsIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgY29uc3QgYXV0aFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJHZW1pbmkgc2V0dXBcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5XG4gICAgICAgICAgICA/IFwiR2VtaW5pIGlzIHJlYWR5LiBUaGUgQVBJIGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBCcmFpbiBzZXR0aW5ncy5cIlxuICAgICAgICAgICAgOiBcIlVzZSBhIEdlbWluaSBBUEkga2V5IGZyb20gR29vZ2xlIEFJIFN0dWRpbywgdGhlbiBwYXN0ZSBpdCBiZWxvdy5cIixcbiAgICAgICAgKTtcblxuICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSkge1xuICAgICAgICBhdXRoU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiRGlzY29ubmVjdFwiKVxuICAgICAgICAgICAgLnNldFdhcm5pbmcoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkgPSBcIlwiO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIEdlbWluaSBTZXR1cFwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKFwiZ2VtaW5pXCIpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkdlbWluaSBBUEkga2V5XCIpXG4gICAgICAgIC5zZXREZXNjKFwiU3RvcmVkIGxvY2FsbHkgaW4gcGx1Z2luIHNldHRpbmdzLiBHZW5lcmF0ZWQgZnJvbSBHb29nbGUgQUkgU3R1ZGlvLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciBHZW1pbmkgQVBJIGtleS4uLlwiKTtcbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXksXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJHZW1pbmkgbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJTZWxlY3QgYSBHZW1pbmkgbW9kZWwgb3IgZW50ZXIgYSBjdXN0b20gb25lLlwiKVxuICAgICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAgIC5hZGRPcHRpb25zKHtcbiAgICAgICAgICAgICAgXCJnZW1pbmktMS41LWZsYXNoXCI6IFwiR2VtaW5pIDEuNSBGbGFzaCAoRmFzdGVzdClcIixcbiAgICAgICAgICAgICAgXCJnZW1pbmktMS41LWZsYXNoLThiXCI6IFwiR2VtaW5pIDEuNSBGbGFzaCA4QiAoTGlnaHRlcilcIixcbiAgICAgICAgICAgICAgXCJnZW1pbmktMS41LXByb1wiOiBcIkdlbWluaSAxLjUgUHJvIChQb3dlcmZ1bClcIixcbiAgICAgICAgICAgICAgXCJnZW1pbmktMi4wLWZsYXNoXCI6IFwiR2VtaW5pIDIuMCBGbGFzaCAoTGF0ZXN0KVwiLFxuICAgICAgICAgICAgICBjdXN0b206IFwiQ3VzdG9tIE1vZGVsLi4uXCIsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNldFZhbHVlKGdldE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCwgR0VNSU5JX1BSRVNFVF9NT0RFTFMpKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBuZXh0TW9kZWwgPSBnZXROZXh0TW9kZWxWYWx1ZShcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCxcbiAgICAgICAgICAgICAgICBHRU1JTklfUFJFU0VUX01PREVMUyxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKG5leHRNb2RlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsID0gbmV4dE1vZGVsO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcImN1c3RvbVwiICYmIG5leHRNb2RlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChuZXh0TW9kZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNDdXN0b20gPSBpc0N1c3RvbU1vZGVsVmFsdWUoXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCxcbiAgICAgICAgICAgIEdFTUlOSV9QUkVTRVRfTU9ERUxTLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGlzQ3VzdG9tKSB7XG4gICAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgY3VzdG9tIG1vZGVsIG5hbWUuLi5cIik7XG4gICAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyh0ZXh0LCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIlNlbGVjdCBDdXN0b20gTW9kZWwuLi4gdG8gZW50ZXIgYSBtb2RlbCBuYW1lXCIpO1xuICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZShcIlwiKTtcbiAgICAgICAgICAgIHRleHQuaW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSSBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBBSSBzeW50aGVzaXNcIilcbiAgICAgIC5zZXREZXNjKFwiVXNlIEFJIGZvciBzeW50aGVzaXMsIHF1ZXN0aW9uIGFuc3dlcmluZywgYW5kIHRvcGljIHBhZ2VzIHdoZW4gY29uZmlndXJlZC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHJvdXRpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiQWxsb3cgdGhlIHNpZGViYXIgdG8gYXV0by1yb3V0ZSBjYXB0dXJlcyB3aXRoIEFJLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29udGV4dCBDb2xsZWN0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTG9va2JhY2sgZGF5c1wiKVxuICAgICAgLnNldERlc2MoXCJIb3cgZmFyIGJhY2sgdG8gc2NhbiB3aGVuIGJ1aWxkaW5nIHJlY2VudC1jb250ZXh0IHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDAgPyBwYXJzZWQgOiA3O1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1heGltdW0gY2hhcmFjdGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJNYXhpbXVtIHRleHQgY29sbGVjdGVkIGJlZm9yZSBzeW50aGVzaXMgb3Igc3VtbWFyeS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPj0gMTAwMCA/IHBhcnNlZCA6IDEyMDAwO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3VtbWFyeSBPdXRwdXRcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQZXJzaXN0IHN1bW1hcmllc1wiKVxuICAgICAgLnNldERlc2MoXCJXcml0ZSBnZW5lcmF0ZWQgc3VtbWFyaWVzIGludG8gdGhlIHZhdWx0LlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUFJU3RhdHVzU2V0dGluZyhjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0dXNTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlByb3ZpZGVyIHN0YXR1c1wiKVxuICAgICAgLnNldERlc2MoXCJDdXJyZW50IHJlYWRpbmVzcyBmb3IgdGhlIHNlbGVjdGVkIEFJIHByb3ZpZGVyLlwiKTtcbiAgICBzdGF0dXNTZXR0aW5nLnNldERlc2MoXCJDaGVja2luZyBwcm92aWRlciBzdGF0dXMuLi5cIik7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hBSVN0YXR1cyhzdGF0dXNTZXR0aW5nKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaEFJU3RhdHVzKHNldHRpbmc6IFNldHRpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgIHNldHRpbmcuc2V0RGVzYyhzdGF0dXMubWVzc2FnZSk7XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBsYXN0U2F2ZWRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBpc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgdGV4dC5zZXRWYWx1ZSh2YWx1ZSkub25DaGFuZ2UoKG5leHRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShuZXh0VmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlU2F2ZU9uQmx1cihcbiAgICAgIHRleHQuaW5wdXRFbCxcbiAgICAgICgpID0+IGN1cnJlbnRWYWx1ZSxcbiAgICAgICgpID0+IGxhc3RTYXZlZFZhbHVlLFxuICAgICAgKHNhdmVkVmFsdWUpID0+IHtcbiAgICAgICAgbGFzdFNhdmVkVmFsdWUgPSBzYXZlZFZhbHVlO1xuICAgICAgfSxcbiAgICAgICgpID0+IGlzU2F2aW5nLFxuICAgICAgKHNhdmluZykgPT4ge1xuICAgICAgICBpc1NhdmluZyA9IHNhdmluZztcbiAgICAgIH0sXG4gICAgICB2YWxpZGF0ZSxcbiAgICApO1xuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVNhdmVPbkJsdXIoXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgZ2V0Q3VycmVudFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgZ2V0TGFzdFNhdmVkVmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRMYXN0U2F2ZWRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgaXNTYXZpbmc6ICgpID0+IGJvb2xlYW4sXG4gICAgc2V0U2F2aW5nOiAoc2F2aW5nOiBib29sZWFuKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IHZvaWQge1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlT25CbHVyKFxuICAgICAgICBnZXRDdXJyZW50VmFsdWUsXG4gICAgICAgIGdldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBzZXRMYXN0U2F2ZWRWYWx1ZSxcbiAgICAgICAgaXNTYXZpbmcsXG4gICAgICAgIHNldFNhdmluZyxcbiAgICAgICAgdmFsaWRhdGUsXG4gICAgICApO1xuICAgIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZU9uQmx1cihcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGlzU2F2aW5nKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRDdXJyZW50VmFsdWUoKTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09PSBnZXRMYXN0U2F2ZWRWYWx1ZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2F2aW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIHNldExhc3RTYXZlZFZhbHVlKGN1cnJlbnRWYWx1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNhdmluZyhmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGlzQ3VzdG9tTW9kZWxWYWx1ZShcbiAgdmFsdWU6IHN0cmluZyxcbiAgcHJlc2V0TW9kZWxzOiByZWFkb25seSBzdHJpbmdbXSxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIXByZXNldE1vZGVscy5pbmNsdWRlcyh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbERyb3Bkb3duVmFsdWUoXG4gIHZhbHVlOiBzdHJpbmcsXG4gIHByZXNldE1vZGVsczogcmVhZG9ubHkgc3RyaW5nW10sXG4pOiBzdHJpbmcge1xuICByZXR1cm4gaXNDdXN0b21Nb2RlbFZhbHVlKHZhbHVlLCBwcmVzZXRNb2RlbHMpID8gXCJjdXN0b21cIiA6IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dE1vZGVsVmFsdWUoXG4gIHNlbGVjdGlvbjogc3RyaW5nLFxuICBjdXJyZW50VmFsdWU6IHN0cmluZyxcbiAgcHJlc2V0TW9kZWxzOiByZWFkb25seSBzdHJpbmdbXSxcbik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoc2VsZWN0aW9uID09PSBcImN1c3RvbVwiKSB7XG4gICAgcmV0dXJuIGlzQ3VzdG9tTW9kZWxWYWx1ZShjdXJyZW50VmFsdWUsIHByZXNldE1vZGVscykgPyBjdXJyZW50VmFsdWUgOiBcIlwiO1xuICB9XG5cbiAgcmV0dXJuIHByZXNldE1vZGVscy5pbmNsdWRlcyhzZWxlY3Rpb24pID8gc2VsZWN0aW9uIDogbnVsbDtcbn1cbiIsICJleHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RleExvZ2luU3RhdHVzKG91dHB1dDogc3RyaW5nKTogQ29kZXhMb2dpblN0YXR1cyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBvdXRwdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gIGlmICghbm9ybWFsaXplZCkge1xuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxuXG4gIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwibm90IGxvZ2dlZCBpblwiKSB8fCBub3JtYWxpemVkLmluY2x1ZGVzKFwibG9nZ2VkIG91dFwiKSkge1xuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxuXG4gIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwibG9nZ2VkIGluXCIpKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLWluXCI7XG4gIH1cblxuICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleExvZ2luU3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhlY0ZpbGVBc3luYyA9IGdldEV4ZWNGaWxlQXN5bmMoKTtcbiAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBbXCJsb2dpblwiLCBcInN0YXR1c1wiXSwge1xuICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCxcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VDb2RleExvZ2luU3RhdHVzKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgIHJldHVybiBcInVuYXZhaWxhYmxlXCI7XG4gICAgfVxuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZXhCaW5hcnlQYXRoKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCBmcyA9IHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKTtcbiAgY29uc3QgcGF0aCA9IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG4gIGNvbnN0IG9zID0gcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoLCBvcy5ob21lZGlyKCkpO1xuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgc2VhcmNoaW5nLlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Vub2VudEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImNvZGVcIiBpbiBlcnJvciAmJiBlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiO1xufVxuXG5mdW5jdGlvbiBnZXRFeGVjRmlsZUFzeW5jKCk6IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbikgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PiB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgZXhlY0ZpbGUgfSA9IHJlcShcImNoaWxkX3Byb2Nlc3NcIikgYXMgdHlwZW9mIGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuICByZXR1cm4gcHJvbWlzaWZ5KGV4ZWNGaWxlKSBhcyAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9Pjtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVJlcXVpcmUoKTogTm9kZVJlcXVpcmUge1xuICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpIGFzIE5vZGVSZXF1aXJlO1xufVxuXG5mdW5jdGlvbiBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoTW9kdWxlOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSwgaG9tZURpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBjYW5kaWRhdGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdGhFbnRyaWVzID0gKHByb2Nlc3MuZW52LlBBVEggPz8gXCJcIikuc3BsaXQocGF0aE1vZHVsZS5kZWxpbWl0ZXIpLmZpbHRlcihCb29sZWFuKTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhdGhFbnRyaWVzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGVudHJ5LCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1vbkRpcnMgPSBbXG4gICAgXCIvb3B0L2hvbWVicmV3L2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBgJHtob21lRGlyfS8ubG9jYWwvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYnVuL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmNvZGVpdW0vd2luZHN1cmYvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYW50aWdyYXZpdHkvYW50aWdyYXZpdHkvYmluYCxcbiAgICBcIi9BcHBsaWNhdGlvbnMvQ29kZXguYXBwL0NvbnRlbnRzL1Jlc291cmNlc1wiLFxuICBdO1xuXG4gIGZvciAoY29uc3QgZGlyIG9mIGNvbW1vbkRpcnMpIHtcbiAgICBjYW5kaWRhdGVzLmFkZChwYXRoTW9kdWxlLmpvaW4oZGlyLCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGNhbmRpZGF0ZXMpO1xufVxuXG5mdW5jdGlvbiBjb2RleEV4ZWN1dGFibGVOYW1lKCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyBcImNvZGV4LmNtZFwiIDogXCJjb2RleFwiO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlQcm92aWRlckNvbmZpZyB7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFJQ29uZmlndXJhdGlvblN0YXR1cyB7XG4gIGNvbmZpZ3VyZWQ6IGJvb2xlYW47XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBpZiAoc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJjb2RleFwiKSB7XG4gICAgY29uc3QgY29kZXhTdGF0dXMgPSBhd2FpdCBnZXRDb2RleExvZ2luU3RhdHVzKCk7XG4gICAgaWYgKGNvZGV4U3RhdHVzID09PSBcInVuYXZhaWxhYmxlXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgaW5zdGFsbGVkLlwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29kZXhTdGF0dXMgIT09IFwibG9nZ2VkLWluXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgbG9nZ2VkIGluLlwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpXG4gICAgICAgID8gYFJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIG1vZGVsICR7c2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCl9LmBcbiAgICAgICAgOiBcIlJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIHRoZSBhY2NvdW50IGRlZmF1bHQgbW9kZWwuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgaWYgKCFzZXR0aW5ncy5nZW1pbmlBcGlLZXkudHJpbSgpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogXCJHZW1pbmkgQVBJIGtleSBtaXNzaW5nLlwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIXNldHRpbmdzLmdlbWluaU1vZGVsLnRyaW0oKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IFwiR2VtaW5pIG1vZGVsIG1pc3NpbmcuXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmVkOiB0cnVlLFxuICAgICAgbWVzc2FnZTogXCJSZWFkeSB0byB1c2UgR2VtaW5pLlwiLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBpc0RlZmF1bHRPcGVuQUlVcmwgPVxuICAgICFzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLnRyaW0oKSB8fCBzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLmluY2x1ZGVzKFwiYXBpLm9wZW5haS5jb21cIik7XG5cbiAgaWYgKCFzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBcIk9wZW5BSSBtb2RlbCBtaXNzaW5nLlwiLFxuICAgIH07XG4gIH1cblxuICBpZiAoaXNEZWZhdWx0T3BlbkFJVXJsICYmICFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogXCJPcGVuQUkgQVBJIGtleSBtaXNzaW5nLlwiLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvbmZpZ3VyZWQ6IHRydWUsXG4gICAgbWVzc2FnZTogaXNEZWZhdWx0T3BlbkFJVXJsXG4gICAgICA/IFwiUmVhZHkgdG8gdXNlIHRoZSBPcGVuQUkgQVBJLlwiXG4gICAgICA6IFwiUmVhZHkgdG8gdXNlIGEgY3VzdG9tIE9wZW5BSS1jb21wYXRpYmxlIGVuZHBvaW50LlwiLFxuICB9O1xufVxuIiwgImltcG9ydCB7IEFwcCwgTWFya2Rvd25WaWV3LCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IGdldFdpbmRvd1N0YXJ0IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNDb250ZXh0IHtcbiAgc291cmNlTGFiZWw6IHN0cmluZztcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbDtcbiAgc291cmNlUGF0aHM/OiBzdHJpbmdbXTtcbiAgdGV4dDogc3RyaW5nO1xuICBvcmlnaW5hbExlbmd0aDogbnVtYmVyO1xuICB0cnVuY2F0ZWQ6IGJvb2xlYW47XG4gIG1heENoYXJzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBDb250ZXh0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRDdXJyZW50Tm90ZUNvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3Py5maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuIGEgbWFya2Rvd24gbm90ZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gdmlldy5lZGl0b3IuZ2V0VmFsdWUoKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdXJyZW50IG5vdGUgaXMgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KFwiQ3VycmVudCBub3RlXCIsIHZpZXcuZmlsZS5wYXRoLCB0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIGdldFNlbGVjdGVkVGV4dENvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3Py5maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuIGEgbWFya2Rvd24gbm90ZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gdmlldy5lZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VsZWN0IHNvbWUgdGV4dCBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoXCJTZWxlY3RlZCB0ZXh0XCIsIHZpZXcuZmlsZS5wYXRoLCB0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIGdldFJlY2VudEZpbGVzQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0UmVjZW50TWFya2Rvd25GaWxlcyhzZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzKTtcbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJSZWNlbnQgZmlsZXNcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3Py5maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuIGEgbWFya2Rvd24gbm90ZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmb2xkZXJQYXRoID0gdmlldy5maWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0RmlsZXNJbkZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJDdXJyZW50IGZvbGRlclwiLCBmaWxlcywgZm9sZGVyUGF0aCB8fCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzOiBURmlsZVtdKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlbGVjdCBhdCBsZWFzdCBvbmUgbWFya2Rvd24gbm90ZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJTZWxlY3RlZCBub3Rlc1wiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRWYXVsdENvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RWYXVsdE1hcmtkb3duRmlsZXMoKTtcbiAgICByZXR1cm4gdGhpcy5idWlsZEZpbGVHcm91cENvbnRleHQoXCJFbnRpcmUgdmF1bHRcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvbnRleHQoXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRocz86IHN0cmluZ1tdLFxuICApOiBTeW50aGVzaXNDb250ZXh0IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG1heENoYXJzID0gTWF0aC5tYXgoMTAwMCwgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzKTtcbiAgICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gICAgY29uc3Qgb3JpZ2luYWxMZW5ndGggPSB0cmltbWVkLmxlbmd0aDtcbiAgICBjb25zdCB0cnVuY2F0ZWQgPSBvcmlnaW5hbExlbmd0aCA+IG1heENoYXJzO1xuICAgIGNvbnN0IGxpbWl0ZWQgPSB0cnVuY2F0ZWQgPyB0cmltbWVkLnNsaWNlKDAsIG1heENoYXJzKS50cmltRW5kKCkgOiB0cmltbWVkO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZUxhYmVsLFxuICAgICAgc291cmNlUGF0aCxcbiAgICAgIHNvdXJjZVBhdGhzLFxuICAgICAgdGV4dDogbGltaXRlZCxcbiAgICAgIG9yaWdpbmFsTGVuZ3RoLFxuICAgICAgdHJ1bmNhdGVkLFxuICAgICAgbWF4Q2hhcnMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYnVpbGRGaWxlR3JvdXBDb250ZXh0KFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgZmlsZXM6IFRGaWxlW10sXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbWFya2Rvd24gZmlsZXMgZm91bmQgZm9yICR7c291cmNlTGFiZWwudG9Mb3dlckNhc2UoKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICBmaWxlcyxcbiAgICAgIHNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyxcbiAgICApO1xuXG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBtYXJrZG93biBmaWxlcyBmb3VuZCBmb3IgJHtzb3VyY2VMYWJlbC50b0xvd2VyQ2FzZSgpfWApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChzb3VyY2VMYWJlbCwgc291cmNlUGF0aCwgdGV4dCwgZmlsZXMubWFwKChmaWxlKSA9PiBmaWxlLnBhdGgpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdFJlY2VudE1hcmtkb3duRmlsZXMobG9va2JhY2tEYXlzOiBudW1iZXIpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBjdXRvZmYgPSBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXMpLmdldFRpbWUoKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICByZXR1cm4gZmlsZXNcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBmaWxlLnN0YXQubXRpbWUgPj0gY3V0b2ZmKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdFZhdWx0TWFya2Rvd25GaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICByZXR1cm4gZmlsZXNcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0RmlsZXNJbkZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICByZXR1cm4gZmlsZXNcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PlxuICAgICAgICBmb2xkZXJQYXRoID8gaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIGZvbGRlclBhdGgpIDogIWZpbGUucGF0aC5pbmNsdWRlcyhcIi9cIiksXG4gICAgICApXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG59XG5cblxuIiwgImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gIGZpbGVzOiBURmlsZVtdLFxuICBtYXhDaGFyczogbnVtYmVyLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGxldCB0b3RhbCA9IDA7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB2YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmxvY2sgPSBbYC0tLSAke2ZpbGUucGF0aH1gLCB0cmltbWVkXS5qb2luKFwiXFxuXCIpO1xuICAgICAgaWYgKHRvdGFsICsgYmxvY2subGVuZ3RoID4gbWF4Q2hhcnMpIHtcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gTWF0aC5tYXgoMCwgbWF4Q2hhcnMgLSB0b3RhbCk7XG4gICAgICAgIGlmIChyZW1haW5pbmcgPiAwKSB7XG4gICAgICAgICAgcGFydHMucHVzaChibG9jay5zbGljZSgwLCByZW1haW5pbmcpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaChibG9jayk7XG4gICAgICB0b3RhbCArPSBibG9jay5sZW5ndGg7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tK3wtKyQvZywgXCJcIilcbiAgICAuc2xpY2UoMCwgNDgpIHx8IFwibm90ZVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXBwZW5kU2VwYXJhdG9yKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghdGV4dC50cmltKCkpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBpZiAodGV4dC5lbmRzV2l0aChcIlxcblxcblwiKSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXCIpKSB7XG4gICAgcmV0dXJuIFwiXFxuXCI7XG4gIH1cbiAgcmV0dXJuIFwiXFxuXFxuXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcExlYWRpbmdUaXRsZShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoIWxpbmVzLmxlbmd0aCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgaWYgKCEvXiNcXHMrLy50ZXN0KGxpbmVzWzBdKSkge1xuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIGNvbnN0IHJlbWFpbmluZyA9IGxpbmVzLnNsaWNlKDEpO1xuICB3aGlsZSAocmVtYWluaW5nLmxlbmd0aCA+IDAgJiYgIXJlbWFpbmluZ1swXS50cmltKCkpIHtcbiAgICByZW1haW5pbmcuc2hpZnQoKTtcbiAgfVxuICByZXR1cm4gcmVtYWluaW5nLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgIi8qKlxuICogUGF0aCB1dGlsaXR5IGZ1bmN0aW9uc1xuICovXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBwYXRoIGlzIHVuZGVyIGEgc3BlY2lmaWMgZm9sZGVyIChvciBpcyB0aGUgZm9sZGVyIGl0c2VsZikuXG4gKiBIYW5kbGVzIHRyYWlsaW5nIHNsYXNoZXMgY29uc2lzdGVudGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNVbmRlckZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIHBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXIgfHwgcGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJ9L2ApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQyKGRhdGUuZ2V0TW9udGgoKSArIDEpfS0ke3BhZDIoZGF0ZS5nZXREYXRlKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3BhZDIoZGF0ZS5nZXRIb3VycygpKX06JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZVRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0gJHtmb3JtYXRUaW1lS2V5KGRhdGUpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9LSR7cGFkMihkYXRlLmdldEhvdXJzKCkpfSR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS5yZXBsYWNlKC9cXHMrJC9nLCBcIlwiKSlcbiAgICAuam9pbihcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOZXdsaW5lcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5czogbnVtYmVyKTogRGF0ZSB7XG4gIGNvbnN0IHNhZmVEYXlzID0gTWF0aC5tYXgoMSwgbG9va2JhY2tEYXlzKTtcbiAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZSgpO1xuICBzdGFydC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgc3RhcnQuc2V0RGF0ZShzdGFydC5nZXREYXRlKCkgLSAoc2FmZURheXMgLSAxKSk7XG4gIHJldHVybiBzdGFydDtcbn1cblxuZnVuY3Rpb24gcGFkMih2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmJveFZhdWx0U2VydmljZSB7XG4gIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+O1xuICByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluYm94RW50cnkge1xuICBoZWFkaW5nOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZztcbiAgcmF3OiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgaW5kZXg6IG51bWJlcjtcbiAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIHN0YXJ0TGluZTogbnVtYmVyO1xuICBlbmRMaW5lOiBudW1iZXI7XG4gIHJldmlld2VkOiBib29sZWFuO1xuICByZXZpZXdBY3Rpb246IHN0cmluZyB8IG51bGw7XG4gIHJldmlld2VkQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIEluYm94RW50cnlJZGVudGl0eSA9IFBpY2s8XG4gIEluYm94RW50cnksXG4gIFwiaGVhZGluZ1wiIHwgXCJib2R5XCIgfCBcInByZXZpZXdcIiB8IFwic2lnbmF0dXJlXCIgfCBcInNpZ25hdHVyZUluZGV4XCJcbj4gJlxuICBQYXJ0aWFsPFBpY2s8SW5ib3hFbnRyeSwgXCJyYXdcIiB8IFwic3RhcnRMaW5lXCIgfCBcImVuZExpbmVcIj4+O1xuXG5leHBvcnQgY2xhc3MgSW5ib3hTZXJ2aWNlIHtcbiAgcHJpdmF0ZSB1bnJldmlld2VkQ291bnRDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBJbmJveFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRFbnRyaWVzKGxpbWl0ID0gMjAsIGluY2x1ZGVSZXZpZXdlZCA9IGZhbHNlKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGluY2x1ZGVSZXZpZXdlZCA/IGVudHJpZXMgOiBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5yZXZpZXdlZCk7XG4gICAgcmV0dXJuIGZpbHRlcmVkLnNsaWNlKC1saW1pdCkucmV2ZXJzZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VW5yZXZpZXdlZENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB7IHRleHQsIG10aW1lLCBleGlzdHMgfSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0V2l0aE10aW1lKHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnJldmlld2VkQ291bnRDYWNoZSAmJiB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlLm10aW1lID09PSBtdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBwYXJzZUluYm94RW50cmllcyh0ZXh0KS5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpLmxlbmd0aDtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIGFzeW5jIG1hcmtFbnRyeVJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZCgoY2FuZGlkYXRlKSA9PiAhY2FuZGlkYXRlLnJldmlld2VkICYmIGNhbmRpZGF0ZS5yYXcgPT09IGVudHJ5LnJhdykgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnN0YXJ0TGluZSA9PT0gZW50cnkuc3RhcnRMaW5lLFxuICAgICAgKTtcblxuICAgIGlmICghY3VycmVudEVudHJ5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGluc2VydFJldmlld01hcmtlcihjb250ZW50LCBjdXJyZW50RW50cnksIGFjdGlvbik7XG4gICAgaWYgKHVwZGF0ZWQgPT09IGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCB1cGRhdGVkKTtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkVudHJ5KGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgY3VycmVudEVudHJ5ID1cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZSA9PT0gZW50cnkuc2lnbmF0dXJlICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZUluZGV4ID09PSBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICAgICkgPz9cbiAgICAgIGZpbmRVbmlxdWVSZXZpZXdlZFNpZ25hdHVyZU1hdGNoKGN1cnJlbnRFbnRyaWVzLCBlbnRyeS5zaWduYXR1cmUpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5KTtcbiAgICBpZiAodXBkYXRlZCA9PT0gY29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluYm94RW50cmllcyhjb250ZW50OiBzdHJpbmcpOiBJbmJveEVudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IEluYm94RW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudEJvZHlMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICBsZXQgY3VycmVudFJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHNpZ25hdHVyZUNvdW50cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKGVuZExpbmU6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gY3VycmVudEJvZHlMaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwcmV2aWV3ID0gYnVpbGRQcmV2aWV3KGJvZHkpO1xuICAgIGNvbnN0IHJhdyA9IFtjdXJyZW50SGVhZGluZywgLi4uY3VycmVudEJvZHlMaW5lc10uam9pbihcIlxcblwiKS50cmltRW5kKCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYnVpbGRFbnRyeVNpZ25hdHVyZShjdXJyZW50SGVhZGluZywgY3VycmVudEJvZHlMaW5lcyk7XG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXggPSBzaWduYXR1cmVDb3VudHMuZ2V0KHNpZ25hdHVyZSkgPz8gMDtcbiAgICBzaWduYXR1cmVDb3VudHMuc2V0KHNpZ25hdHVyZSwgc2lnbmF0dXJlSW5kZXggKyAxKTtcbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcucmVwbGFjZSgvXiMjXFxzKy8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIGJvZHksXG4gICAgICByYXcsXG4gICAgICBwcmV2aWV3LFxuICAgICAgaW5kZXg6IGVudHJpZXMubGVuZ3RoLFxuICAgICAgc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXgsXG4gICAgICBzdGFydExpbmU6IGN1cnJlbnRTdGFydExpbmUsXG4gICAgICBlbmRMaW5lLFxuICAgICAgcmV2aWV3ZWQ6IGN1cnJlbnRSZXZpZXdlZCxcbiAgICAgIHJldmlld0FjdGlvbjogY3VycmVudFJldmlld0FjdGlvbixcbiAgICAgIHJldmlld2VkQXQ6IGN1cnJlbnRSZXZpZXdlZEF0LFxuICAgIH0pO1xuICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gICAgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gICAgY3VycmVudFJldmlld0FjdGlvbiA9IG51bGw7XG4gICAgY3VycmVudFJldmlld2VkQXQgPSBudWxsO1xuICB9O1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaW5kZXhdO1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeShpbmRleCk7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGxpbmU7XG4gICAgICBjdXJyZW50U3RhcnRMaW5lID0gaW5kZXg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOlxccyooW2Etel0rKSg/OlxccysoLis/KSk/XFxzKi0tPiQvaSk7XG4gICAgaWYgKHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UmV2aWV3ZWQgPSB0cnVlO1xuICAgICAgY3VycmVudFJldmlld0FjdGlvbiA9IHJldmlld01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IHJldmlld01hdGNoWzJdID8/IG51bGw7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjdXJyZW50Qm9keUxpbmVzLnB1c2gobGluZSk7XG4gIH1cblxuICBwdXNoRW50cnkobGluZXMubGVuZ3RoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgY29uc3QgbWFya2VyID0gYDwhLS0gYnJhaW4tcmV2aWV3ZWQ6ICR7YWN0aW9ufSAke3RpbWVzdGFtcH0gLS0+YDtcbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG4gIGNsZWFuZWRFbnRyeUxpbmVzLnB1c2gobWFya2VyLCBcIlwiKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRQcmV2aWV3KGJvZHk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gYm9keVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBsaW5lc1swXSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBidWlsZEVudHJ5U2lnbmF0dXJlKGhlYWRpbmc6IHN0cmluZywgYm9keUxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBbaGVhZGluZy50cmltKCksIC4uLmJvZHlMaW5lcy5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKV0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhsaW5lczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNsb25lID0gWy4uLmxpbmVzXTtcbiAgd2hpbGUgKGNsb25lLmxlbmd0aCA+IDAgJiYgY2xvbmVbY2xvbmUubGVuZ3RoIC0gMV0udHJpbSgpID09PSBcIlwiKSB7XG4gICAgY2xvbmUucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGNsb25lO1xufVxuXG5mdW5jdGlvbiBmaW5kVW5pcXVlUmV2aWV3ZWRTaWduYXR1cmVNYXRjaChcbiAgZW50cmllczogSW5ib3hFbnRyeVtdLFxuICBzaWduYXR1cmU6IHN0cmluZyxcbik6IEluYm94RW50cnkgfCBudWxsIHtcbiAgY29uc3QgcmV2aWV3ZWRNYXRjaGVzID0gZW50cmllcy5maWx0ZXIoXG4gICAgKGVudHJ5KSA9PiBlbnRyeS5yZXZpZXdlZCAmJiBlbnRyeS5zaWduYXR1cmUgPT09IHNpZ25hdHVyZSxcbiAgKTtcbiAgaWYgKHJldmlld2VkTWF0Y2hlcy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gcmV2aWV3ZWRNYXRjaGVzWzBdO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlSm91cm5hbFRleHQsIGZvcm1hdERhdGVLZXksIGZvcm1hdFRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEpvdXJuYWxTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBnZXRKb3VybmFsUGF0aChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICByZXR1cm4gYCR7c2V0dGluZ3Muam91cm5hbEZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gIH1cblxuICBhc3luYyBlbnN1cmVKb3VybmFsRmlsZShkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRKb3VybmFsUGF0aChkYXRlKTtcbiAgICByZXR1cm4gdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kSm91cm5hbEhlYWRlcihwYXRoLCBkYXRlS2V5KTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEVudHJ5KHRleHQ6IHN0cmluZywgZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkpvdXJuYWwgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IGZpbGUucGF0aDtcblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0VGltZUtleShkYXRlKX1cXG4ke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQge1xuICBjb2xsYXBzZVdoaXRlc3BhY2UsXG4gIGZvcm1hdERhdGVUaW1lS2V5LFxuICBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLFxufSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgc2x1Z2lmeSwgdHJpbVRpdGxlIH0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBOb3RlU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kTm90ZSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3RlIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9XFxuLSAke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHNldHRpbmdzLmluYm94RmlsZSwgYmxvY2spO1xuICAgIHJldHVybiB7IHBhdGg6IHNldHRpbmdzLmluYm94RmlsZSB9O1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICAgc291cmNlUGF0aHM/OiBzdHJpbmdbXSxcbiAgKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBjbGVhbmVkVGl0bGUgPSB0cmltVGl0bGUodGl0bGUpO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7Zm9ybWF0U3VtbWFyeVRpbWVzdGFtcChub3cpfS0ke3NsdWdpZnkoY2xlYW5lZFRpdGxlKX0ubWRgO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChcbiAgICAgIGAke3NldHRpbmdzLm5vdGVzRm9sZGVyfS8ke2ZpbGVOYW1lfWAsXG4gICAgKTtcbiAgICBjb25zdCBzb3VyY2VMaW5lID0gc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgPyBgJHtzb3VyY2VMYWJlbH0gXHUyMDIyICR7c291cmNlUGF0aHMubGVuZ3RofSAke3NvdXJjZVBhdGhzLmxlbmd0aCA9PT0gMSA/IFwiZmlsZVwiIDogXCJmaWxlc1wifWBcbiAgICAgIDogc291cmNlUGF0aFxuICAgICAgICA/IGAke3NvdXJjZUxhYmVsfSBcdTIwMjIgJHtzb3VyY2VQYXRofWBcbiAgICAgICAgOiBzb3VyY2VMYWJlbDtcbiAgICBjb25zdCBzb3VyY2VGaWxlTGluZXMgPSBzb3VyY2VQYXRocyAmJiBzb3VyY2VQYXRocy5sZW5ndGggPiAwXG4gICAgICA/IFtcbiAgICAgICAgICBcIlNvdXJjZSBmaWxlczpcIixcbiAgICAgICAgICAuLi5zb3VyY2VQYXRocy5zbGljZSgwLCAxMikubWFwKChzb3VyY2UpID0+IGAtICR7c291cmNlfWApLFxuICAgICAgICAgIC4uLihzb3VyY2VQYXRocy5sZW5ndGggPiAxMlxuICAgICAgICAgICAgPyBbYC0gLi4uYW5kICR7c291cmNlUGF0aHMubGVuZ3RoIC0gMTJ9IG1vcmVgXVxuICAgICAgICAgICAgOiBbXSksXG4gICAgICAgIF1cbiAgICAgIDogW107XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjICR7Y2xlYW5lZFRpdGxlfWAsXG4gICAgICBcIlwiLFxuICAgICAgYENyZWF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYFNvdXJjZTogJHtzb3VyY2VMaW5lfWAsXG4gICAgICAuLi5zb3VyY2VGaWxlTGluZXMsXG4gICAgICBcIlwiLFxuICAgICAgY29sbGFwc2VXaGl0ZXNwYWNlKGJvZHkpID8gYm9keS50cmltKCkgOiBcIk5vIGFydGlmYWN0IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChwYXRoLCBjb250ZW50KTtcbiAgfVxufVxuXG5cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlS2V5LCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHkgfSBmcm9tIFwiLi9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmV2aWV3TG9nRW50cnkgZXh0ZW5kcyBJbmJveEVudHJ5SWRlbnRpdHkge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG4gIHNvdXJjZVBhdGg6IHN0cmluZztcbiAgZmlsZU10aW1lOiBudW1iZXI7XG4gIGVudHJ5SW5kZXg6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFJldmlld0xvZ1NlcnZpY2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IHJldmlld0VudHJ5Q291bnRDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9PigpO1xuICBwcml2YXRlIHJldmlld0xvZ0ZpbGVzQ2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGZpbGVzOiBURmlsZVtdO1xuICB9IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmV2aWV3RW50cnlUb3RhbENhY2hlOiB7XG4gICAgbGlzdGluZ010aW1lOiBudW1iZXI7XG4gICAgdG90YWw6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kUmV2aWV3TG9nKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXREYXRlS2V5KG5vdyk7XG4gICAgY29uc3QgcGF0aCA9IGAke3NldHRpbmdzLnJldmlld3NGb2xkZXJ9LyR7ZGF0ZUtleX0ubWRgO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyMgJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBgLSBBY3Rpb246ICR7YWN0aW9ufWAsXG4gICAgICBgLSBJbmJveDogJHtlbnRyeS5oZWFkaW5nfWAsXG4gICAgICBgLSBQcmV2aWV3OiAke2VudHJ5LnByZXZpZXcgfHwgZW50cnkuYm9keSB8fCBcIihlbXB0eSlcIn1gLFxuICAgICAgYC0gU2lnbmF0dXJlOiAke2VuY29kZVJldmlld1NpZ25hdHVyZShlbnRyeS5zaWduYXR1cmUpfWAsXG4gICAgICBgLSBTaWduYXR1cmUgaW5kZXg6ICR7ZW50cnkuc2lnbmF0dXJlSW5kZXh9YCxcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBjb250ZW50KTtcbiAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5jbGVhcigpO1xuICAgIHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSA9IG51bGw7XG4gICAgdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB7IHBhdGggfTtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0xvZ0ZpbGVzKGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcblxuICAgIGlmICghdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlKSB7XG4gICAgICBjb25zdCBhbGxGaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgICBjb25zdCBtYXRjaGluZyA9IGFsbEZpbGVzXG4gICAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgICAgIHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IG1hdGNoaW5nWzBdPy5zdGF0Lm10aW1lID8/IDAsXG4gICAgICAgIGZpbGVzOiBtYXRjaGluZyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIlxuICAgICAgPyB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUuZmlsZXMuc2xpY2UoMCwgbGltaXQpXG4gICAgICA6IHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZS5maWxlcztcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0VudHJpZXMobGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPFJldmlld0xvZ0VudHJ5W10+IHtcbiAgICBjb25zdCBsb2dzID0gYXdhaXQgdGhpcy5nZXRSZXZpZXdMb2dGaWxlcyhsaW1pdCk7XG4gICAgY29uc3QgZW50cmllczogUmV2aWV3TG9nRW50cnlbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGxvZ3MpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKGNvbnRlbnQsIGZpbGUucGF0aCwgZmlsZS5zdGF0Lm10aW1lKTtcbiAgICAgIGVudHJpZXMucHVzaCguLi5wYXJzZWQucmV2ZXJzZSgpKTtcbiAgICAgIGlmICh0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgJiYgZW50cmllcy5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiA/IGVudHJpZXMuc2xpY2UoMCwgbGltaXQpIDogZW50cmllcztcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0VudHJ5Q291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBsb2dzID0gYXdhaXQgdGhpcy5nZXRSZXZpZXdMb2dGaWxlcygpO1xuICAgIGlmIChsb2dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUgPSB7IGxpc3RpbmdNdGltZTogMCwgdG90YWw6IDAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RpbmdNdGltZSA9IGxvZ3NbMF0uc3RhdC5tdGltZTtcbiAgICBpZiAodGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGU/Lmxpc3RpbmdNdGltZSA9PT0gbGlzdGluZ010aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUudG90YWw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VlblBhdGhzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgbGV0IHRvdGFsID0gMDtcblxuICAgIGNvbnN0IHVuY2FjaGVkRmlsZXMgPSBsb2dzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCk7XG4gICAgICByZXR1cm4gIShjYWNoZWQgJiYgY2FjaGVkLm10aW1lID09PSBmaWxlLnN0YXQubXRpbWUpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgY2FjaGVkRmlsZXMgPSBsb2dzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCk7XG4gICAgICByZXR1cm4gY2FjaGVkICYmIGNhY2hlZC5tdGltZSA9PT0gZmlsZS5zdGF0Lm10aW1lO1xuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGNhY2hlZEZpbGVzKSB7XG4gICAgICBzZWVuUGF0aHMuYWRkKGZpbGUucGF0aCk7XG4gICAgICB0b3RhbCArPSB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5nZXQoZmlsZS5wYXRoKSEuY291bnQ7XG4gICAgfVxuXG4gICAgaWYgKHVuY2FjaGVkRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICB1bmNhY2hlZEZpbGVzLm1hcChhc3luYyAoZmlsZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKGNvbnRlbnQsIGZpbGUucGF0aCwgZmlsZS5zdGF0Lm10aW1lKS5sZW5ndGg7XG4gICAgICAgICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuc2V0KGZpbGUucGF0aCwge1xuICAgICAgICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgICAgICAgIGNvdW50LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB7IGZpbGUsIGNvdW50IH07XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgICAgZm9yIChjb25zdCB7IGZpbGUsIGNvdW50IH0gb2YgcmVzdWx0cykge1xuICAgICAgICBzZWVuUGF0aHMuYWRkKGZpbGUucGF0aCk7XG4gICAgICAgIHRvdGFsICs9IGNvdW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgcGF0aCBvZiB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5rZXlzKCkpIHtcbiAgICAgIGlmICghc2VlblBhdGhzLmhhcyhwYXRoKSkge1xuICAgICAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5kZWxldGUocGF0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5yZXZpZXdFbnRyeVRvdGFsQ2FjaGUgPSB7IGxpc3RpbmdNdGltZSwgdG90YWwgfTtcbiAgICByZXR1cm4gdG90YWw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUmV2aWV3TG9nRW50cmllcyhcbiAgY29udGVudDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcsXG4gIGZpbGVNdGltZTogbnVtYmVyLFxuKTogUmV2aWV3TG9nRW50cnlbXSB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgZW50cmllczogUmV2aWV3TG9nRW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudFRpbWVzdGFtcCA9IFwiXCI7XG4gIGxldCBjdXJyZW50QWN0aW9uID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRQcmV2aWV3ID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRTaWduYXR1cmUgPSBcIlwiO1xuICBsZXQgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gMDtcbiAgbGV0IGN1cnJlbnRFbnRyeUluZGV4ID0gMDtcblxuICBjb25zdCBwdXNoRW50cnkgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKCFjdXJyZW50VGltZXN0YW1wKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZW50cmllcy5wdXNoKHtcbiAgICAgIGFjdGlvbjogY3VycmVudEFjdGlvbiB8fCBcInVua25vd25cIixcbiAgICAgIGhlYWRpbmc6IGN1cnJlbnRIZWFkaW5nLFxuICAgICAgcHJldmlldzogY3VycmVudFByZXZpZXcsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgc2lnbmF0dXJlOiBjdXJyZW50U2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXg6IGN1cnJlbnRTaWduYXR1cmVJbmRleCxcbiAgICAgIHRpbWVzdGFtcDogY3VycmVudFRpbWVzdGFtcCxcbiAgICAgIHNvdXJjZVBhdGgsXG4gICAgICBmaWxlTXRpbWUsXG4gICAgICBlbnRyeUluZGV4OiBjdXJyZW50RW50cnlJbmRleCxcbiAgICB9KTtcbiAgICBjdXJyZW50VGltZXN0YW1wID0gXCJcIjtcbiAgICBjdXJyZW50QWN0aW9uID0gXCJcIjtcbiAgICBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gICAgY3VycmVudFByZXZpZXcgPSBcIlwiO1xuICAgIGN1cnJlbnRTaWduYXR1cmUgPSBcIlwiO1xuICAgIGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IDA7XG4gICAgY3VycmVudEVudHJ5SW5kZXggKz0gMTtcbiAgfTtcblxuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBoZWFkaW5nTWF0Y2ggPSBsaW5lLm1hdGNoKC9eIyNcXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoKSB7XG4gICAgICBwdXNoRW50cnkoKTtcbiAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBoZWFkaW5nTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uTWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytBY3Rpb246XFxzKyguKykkL2kpO1xuICAgIGlmIChhY3Rpb25NYXRjaCkge1xuICAgICAgY3VycmVudEFjdGlvbiA9IGFjdGlvbk1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGluYm94TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytJbmJveDpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKGluYm94TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRIZWFkaW5nID0gaW5ib3hNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aWV3TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytQcmV2aWV3OlxccysoLispJC9pKTtcbiAgICBpZiAocHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UHJldmlldyA9IHByZXZpZXdNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYXR1cmVNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1NpZ25hdHVyZTpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHNpZ25hdHVyZU1hdGNoKSB7XG4gICAgICBjdXJyZW50U2lnbmF0dXJlID0gZGVjb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZU1hdGNoWzFdLnRyaW0oKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYXR1cmVJbmRleE1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrU2lnbmF0dXJlIGluZGV4OlxccysoLispJC9pKTtcbiAgICBpZiAoc2lnbmF0dXJlSW5kZXhNYXRjaCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHNpZ25hdHVyZUluZGV4TWF0Y2hbMV0sIDEwKTtcbiAgICAgIGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IE51bWJlci5pc0Zpbml0ZShwYXJzZWQpID8gcGFyc2VkIDogMDtcbiAgICB9XG4gIH1cblxuICBwdXNoRW50cnkoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGVuY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc2lnbmF0dXJlKTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHNpZ25hdHVyZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBzaWduYXR1cmU7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IHNsdWdpZnksIHRyaW1UaXRsZSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHksIEluYm94U2VydmljZSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3Rhc2stc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnksIFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5ib3hTZXJ2aWNlOiBJbmJveFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZTogVGFza1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBqb3VybmFsU2VydmljZTogSm91cm5hbFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdMb2dTZXJ2aWNlOiBSZXZpZXdMb2dTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEluYm94RW50cmllcyhsaW1pdCA9IDIwKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICByZXR1cm4gdGhpcy5pbmJveFNlcnZpY2UuZ2V0UmVjZW50RW50cmllcyhsaW1pdCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9UYXNrKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0ZXh0ID0gZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcInRhc2tcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwidGFza1wiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFxuICAgICAgYFByb21vdGVkIGluYm94IGVudHJ5IHRvIHRhc2sgaW4gJHtzYXZlZC5wYXRofWAsXG4gICAgICBtYXJrZXJVcGRhdGVkLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBrZWVwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBgTGVmdCBpbmJveCBlbnRyeSBpbiAke3RoaXMuc2V0dGluZ3NQcm92aWRlcigpLmluYm94RmlsZX1gO1xuICB9XG5cbiAgYXN5bmMgc2tpcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwic2tpcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJza2lwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJTa2lwcGVkIGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVG9Kb3VybmFsKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkoXG4gICAgICBbXG4gICAgICAgIGBTb3VyY2U6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJqb3VybmFsXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShgQXBwZW5kZWQgaW5ib3ggZW50cnkgdG8gJHtzYXZlZC5wYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvTm90ZShlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gc2V0dGluZ3Mubm90ZXNGb2xkZXI7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlRm9sZGVyKG5vdGVzRm9sZGVyKTtcblxuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5idWlsZE5vdGVUaXRsZShlbnRyeSk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtmb3JtYXREYXRlVGltZUtleShub3cpLnJlcGxhY2UoL1s6IF0vZywgXCItXCIpfS0ke3NsdWdpZnkodGl0bGUpfS5tZGA7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKGAke25vdGVzRm9sZGVyfS8ke2ZpbGVuYW1lfWApO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke3RpdGxlfWAsXG4gICAgICBcIlwiLFxuICAgICAgYENyZWF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgXCJTb3VyY2U6IEJyYWluIGluYm94XCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJPcmlnaW5hbCBjYXB0dXJlOlwiLFxuICAgICAgZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmcsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcIm5vdGVcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwibm90ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byBub3RlIGluICR7cGF0aH1gLCBtYXJrZXJVcGRhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkZyb21SZXZpZXdMb2coZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBpZGVudGl0eSA9IHtcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgcHJldmlldzogZW50cnkucHJldmlldyxcbiAgICAgIHNpZ25hdHVyZTogZW50cnkuc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXg6IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgIH07XG4gICAgY29uc3QgcmVvcGVuZWQgPSBhd2FpdCB0aGlzLmluYm94U2VydmljZS5yZW9wZW5FbnRyeShpZGVudGl0eSk7XG4gICAgaWYgKCFyZW9wZW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChpZGVudGl0eSwgXCJyZW9wZW5cIik7XG4gICAgcmV0dXJuIGBSZS1vcGVuZWQgaW5ib3ggZW50cnkgJHtlbnRyeS5oZWFkaW5nfWA7XG4gIH1cblxuICBidWlsZE5vdGVUaXRsZShlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZW50cnkucHJldmlldyB8fCBlbnRyeS5ib2R5IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3QgbGluZXMgPSBjYW5kaWRhdGVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gY29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGNvbnN0IGZpcnN0ID0gbGluZXNbMF0gPz8gXCJVbnRpdGxlZCBub3RlXCI7XG4gICAgcmV0dXJuIHRyaW1UaXRsZShmaXJzdCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG1hcmtJbmJveFJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UubWFya0VudHJ5UmV2aWV3ZWQoZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwZW5kTWFya2VyTm90ZShtZXNzYWdlOiBzdHJpbmcsIG1hcmtlclVwZGF0ZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiBtYXJrZXJVcGRhdGVkID8gbWVzc2FnZSA6IGAke21lc3NhZ2V9IChyZXZpZXcgbWFya2VyIG5vdCB1cGRhdGVkKWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoXG4gICAgZW50cnk6IEluYm94RW50cnlJZGVudGl0eSxcbiAgICBhY3Rpb246IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5hcHBlbmRSZXZpZXdMb2coZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tRdWVzdGlvbkFuc3dlciB9IGZyb20gXCIuLi91dGlscy9xdWVzdGlvbi1hbnN3ZXItZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dCB9IGZyb20gXCIuLi91dGlscy9xdWVzdGlvbi1hbnN3ZXItbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQgfSBmcm9tIFwiLi9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuXG5leHBvcnQgY2xhc3MgUXVlc3Rpb25TZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uOiBzdHJpbmcsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmFsbGJhY2sgPSBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIocXVlc3Rpb24sIGNvbnRleHQudGV4dCk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHNldHRpbmdzKTtcbiAgICAgIGlmICghYWlTdGF0dXMuY29uZmlndXJlZCkge1xuICAgICAgICBuZXcgTm90aWNlKGFpU3RhdHVzLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb24sIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgcXVlc3Rpb24gYW5zd2VyaW5nXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiUXVlc3Rpb24gQW5zd2VyXCIsXG4gICAgICB0aXRsZTogXCJBbnN3ZXJcIixcbiAgICAgIG5vdGVUaXRsZTogc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogcXVlc3Rpb24sXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG9ydGVuUXVlc3Rpb24ocXVlc3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSBxdWVzdGlvbi50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBRdWVzdGlvbiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oXG4gIGl0ZW1zOiBTZXQ8c3RyaW5nPixcbiAgZW1wdHlNZXNzYWdlOiBzdHJpbmcsXG4gIG1heEl0ZW1zID0gMTAsXG4pOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCBtYXhJdGVtcylcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gZXh0cmFjdEtleXdvcmRzKHF1ZXN0aW9uOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHN0b3B3b3JkcyA9IG5ldyBTZXQoW1xuICAgIFwid2hhdFwiLFxuICAgIFwid2h5XCIsXG4gICAgXCJob3dcIixcbiAgICBcIndoaWNoXCIsXG4gICAgXCJ3aGVuXCIsXG4gICAgXCJ3aGVyZVwiLFxuICAgIFwid2hvXCIsXG4gICAgXCJ3aG9tXCIsXG4gICAgXCJkb2VzXCIsXG4gICAgXCJkb1wiLFxuICAgIFwiZGlkXCIsXG4gICAgXCJpc1wiLFxuICAgIFwiYXJlXCIsXG4gICAgXCJ3YXNcIixcbiAgICBcIndlcmVcIixcbiAgICBcInRoZVwiLFxuICAgIFwiYVwiLFxuICAgIFwiYW5cIixcbiAgICBcInRvXCIsXG4gICAgXCJvZlwiLFxuICAgIFwiZm9yXCIsXG4gICAgXCJhbmRcIixcbiAgICBcIm9yXCIsXG4gICAgXCJpblwiLFxuICAgIFwib25cIixcbiAgICBcImF0XCIsXG4gICAgXCJ3aXRoXCIsXG4gICAgXCJhYm91dFwiLFxuICAgIFwiZnJvbVwiLFxuICAgIFwibXlcIixcbiAgICBcIm91clwiLFxuICAgIFwieW91clwiLFxuICAgIFwidGhpc1wiLFxuICAgIFwidGhhdFwiLFxuICAgIFwidGhlc2VcIixcbiAgICBcInRob3NlXCIsXG4gICAgXCJtYWtlXCIsXG4gICAgXCJtYWRlXCIsXG4gICAgXCJuZWVkXCIsXG4gICAgXCJuZWVkc1wiLFxuICAgIFwiY2FuXCIsXG4gICAgXCJjb3VsZFwiLFxuICAgIFwic2hvdWxkXCIsXG4gICAgXCJ3b3VsZFwiLFxuICAgIFwid2lsbFwiLFxuICAgIFwiaGF2ZVwiLFxuICAgIFwiaGFzXCIsXG4gICAgXCJoYWRcIixcbiAgXSk7XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oXG4gICAgbmV3IFNldChcbiAgICAgIHF1ZXN0aW9uXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5zcGxpdCgvW15hLXowLTldKy9nKVxuICAgICAgICAubWFwKCh3b3JkKSA9PiB3b3JkLnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcigod29yZCkgPT4gd29yZC5sZW5ndGggPj0gNCAmJiAhc3RvcHdvcmRzLmhhcyh3b3JkKSksXG4gICAgKSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc1F1ZXN0aW9uKGxpbmU6IHN0cmluZywga2V5d29yZHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGlmICgha2V5d29yZHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgbG93ZXIgPSBsaW5lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBrZXl3b3Jkcy5zb21lKChrZXl3b3JkKSA9PiBsb3dlci5pbmNsdWRlcyhrZXl3b3JkKSk7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RFdmlkZW5jZShjb250ZW50OiBzdHJpbmcsIHF1ZXN0aW9uOiBzdHJpbmcpOiB7XG4gIGV2aWRlbmNlOiBTZXQ8c3RyaW5nPjtcbiAgbWF0Y2hlZDogYm9vbGVhbjtcbn0ge1xuICBjb25zdCBldmlkZW5jZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBrZXl3b3JkcyA9IGV4dHJhY3RLZXl3b3JkcyhxdWVzdGlvbik7XG4gIGxldCBtYXRjaGVkID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQgJiYgKG1hdGNoZXNRdWVzdGlvbihoZWFkaW5nVGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAzKSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGhlYWRpbmdUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCAmJiAobWF0Y2hlc1F1ZXN0aW9uKHRhc2tUZXh0LCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDMpKSB7XG4gICAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24odGFza1RleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQgJiYgKG1hdGNoZXNRdWVzdGlvbihidWxsZXRUZXh0LCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDQpKSB7XG4gICAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24oYnVsbGV0VGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG1hdGNoZXNRdWVzdGlvbihsaW5lLCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDIpIHtcbiAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24obGluZSwga2V5d29yZHMpKSB7XG4gICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgZXZpZGVuY2UuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZXZpZGVuY2UsXG4gICAgbWF0Y2hlZCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tRdWVzdGlvbkFuc3dlcihxdWVzdGlvbjogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkUXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHF1ZXN0aW9uKTtcbiAgY29uc3QgeyBldmlkZW5jZSwgbWF0Y2hlZCB9ID0gY29sbGVjdEV2aWRlbmNlKGNvbnRlbnQsIGNsZWFuZWRRdWVzdGlvbik7XG4gIGNvbnN0IGFuc3dlckxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGlmIChtYXRjaGVkKSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcbiAgICAgIFwiSSBmb3VuZCB0aGVzZSBsaW5lcyBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dCB0aGF0IGRpcmVjdGx5IG1hdGNoIHlvdXIgcXVlc3Rpb24uXCIsXG4gICAgKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVGhlIGNvbnRleHQgZG9lcyBub3QgcHJvdmlkZSBhIGZ1bGx5IHZlcmlmaWVkIGFuc3dlciwgc28gdHJlYXQgdGhpcyBhcyBhIGdyb3VuZGVkIHN1bW1hcnkuXCIpO1xuICB9IGVsc2UgaWYgKGV2aWRlbmNlLnNpemUpIHtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFxuICAgICAgXCJJIGNvdWxkIG5vdCBmaW5kIGEgZGlyZWN0IG1hdGNoIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0LCBzbyB0aGVzZSBhcmUgdGhlIGNsb3Nlc3QgbGluZXMgYXZhaWxhYmxlLlwiLFxuICAgICk7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRyZWF0IHRoaXMgYXMgbmVhcmJ5IGNvbnRleHQgcmF0aGVyIHRoYW4gYSBjb25maXJtZWQgYW5zd2VyLlwiKTtcbiAgfSBlbHNlIHtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiSSBjb3VsZCBub3QgZmluZCBhIGRpcmVjdCBhbnN3ZXIgaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQuXCIpO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUcnkgbmFycm93aW5nIHRoZSBxdWVzdGlvbiBvciBzZWxlY3RpbmcgYSBtb3JlIHNwZWNpZmljIG5vdGUgb3IgZm9sZGVyLlwiKTtcbiAgfVxuXG4gIGNvbnN0IGZvbGxvd1VwcyA9IG1hdGNoZWQgfHwgZXZpZGVuY2Uuc2l6ZVxuICAgID8gbmV3IFNldChbXG4gICAgICAgIFwiQXNrIGEgbmFycm93ZXIgcXVlc3Rpb24gaWYgeW91IHdhbnQgYSBtb3JlIHNwZWNpZmljIGFuc3dlci5cIixcbiAgICAgICAgXCJPcGVuIHRoZSBzb3VyY2Ugbm90ZSBvciBmb2xkZXIgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cIixcbiAgICAgIF0pXG4gICAgOiBuZXcgU2V0KFtcbiAgICAgICAgXCJQcm92aWRlIG1vcmUgZXhwbGljaXQgY29udGV4dCBvciBzZWxlY3QgYSBkaWZmZXJlbnQgbm90ZSBvciBmb2xkZXIuXCIsXG4gICAgICBdKTtcblxuICByZXR1cm4gW1xuICAgIFwiIyBBbnN3ZXJcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICBjbGVhbmVkUXVlc3Rpb24gfHwgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgYW5zd2VyTGluZXMuam9pbihcIiBcIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZXZpZGVuY2UsIFwiTm8gZGlyZWN0IGV2aWRlbmNlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBBbnN3ZXJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgICBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlUXVlc3Rpb25BbnN3ZXJTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgcGFyc2VkLnF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBBbnN3ZXJcIixcbiAgICAgIHBhcnNlZC5hbnN3ZXIgfHwgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBwYXJzZWQuZXZpZGVuY2UgfHwgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBBbnN3ZXJcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBBbnN3ZXJcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUXVlc3Rpb25BbnN3ZXJTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHF1ZXN0aW9uOiBzdHJpbmc7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBldmlkZW5jZTogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJRdWVzdGlvblwiIHwgXCJBbnN3ZXJcIiB8IFwiRXZpZGVuY2VcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgUXVlc3Rpb246IFtdLFxuICAgIEFuc3dlcjogW10sXG4gICAgRXZpZGVuY2U6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhRdWVzdGlvbnxBbnN3ZXJ8RXZpZGVuY2V8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHF1ZXN0aW9uOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLlF1ZXN0aW9uXSksXG4gICAgYW5zd2VyOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuQW5zd2VyKSxcbiAgICBldmlkZW5jZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkV2aWRlbmNlKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFF1ZXN0aW9uOiBzdHJpbmdbXTtcbiAgQW5zd2VyOiBzdHJpbmdbXTtcbiAgRXZpZGVuY2U6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiYW5zd2VyXCIpIHtcbiAgICByZXR1cm4gXCJBbnN3ZXJcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJldmlkZW5jZVwiKSB7XG4gICAgcmV0dXJuIFwiRXZpZGVuY2VcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiUXVlc3Rpb25cIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSxcbn0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5LCBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLCBnZXRXaW5kb3dTdGFydCB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LWZvcm1hdFwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VtbWFyeVJlc3VsdCB7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgcGVyc2lzdGVkUGF0aD86IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3VtbWFyeVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnkobG9va2JhY2tEYXlzPzogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZWZmZWN0aXZlTG9va2JhY2tEYXlzID0gbG9va2JhY2tEYXlzID8/IHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXM7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RSZWNlbnRGaWxlcyhzZXR0aW5ncywgZWZmZWN0aXZlTG9va2JhY2tEYXlzKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGxldCBzdW1tYXJ5ID0gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudCk7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc3VtbWFyeSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN1bW1hcml6ZShjb250ZW50IHx8IHN1bW1hcnksIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgc3VtbWFyeVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwZXJzaXN0ZWRQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdGl0bGUgPSBsYWJlbCA/IGAke2xhYmVsfSBTdW1tYXJ5YCA6IFwiU3VtbWFyeVwiO1xuICAgIGlmIChzZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzKSB7XG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKG5ldyBEYXRlKCkpO1xuICAgICAgY29uc3QgZmlsZUxhYmVsID0gbGFiZWwgPyBgJHtsYWJlbC50b0xvd2VyQ2FzZSgpfS0ke3RpbWVzdGFtcH1gIDogdGltZXN0YW1wO1xuICAgICAgY29uc3QgcmVxdWVzdGVkUGF0aCA9IGAke3NldHRpbmdzLnN1bW1hcmllc0ZvbGRlcn0vJHtmaWxlTGFiZWx9Lm1kYDtcbiAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChyZXF1ZXN0ZWRQYXRoKTtcbiAgICAgIGNvbnN0IGRpc3BsYXlUaW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBbXG4gICAgICAgIGAjICR7dGl0bGV9ICR7ZGlzcGxheVRpbWVzdGFtcH1gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBgIyMgV2luZG93YCxcbiAgICAgICAgZWZmZWN0aXZlTG9va2JhY2tEYXlzID09PSAxID8gXCJUb2RheVwiIDogYExhc3QgJHtlZmZlY3RpdmVMb29rYmFja0RheXN9IGRheXNgLFxuICAgICAgICBcIlwiLFxuICAgICAgICBzdW1tYXJ5LnRyaW0oKSxcbiAgICAgIF0uam9pbihcIlxcblwiKTtcbiAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgYm9keSk7XG4gICAgICBwZXJzaXN0ZWRQYXRoID0gcGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogc3VtbWFyeSxcbiAgICAgIHBlcnNpc3RlZFBhdGgsXG4gICAgICB1c2VkQUksXG4gICAgICB0aXRsZSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0UmVjZW50RmlsZXMoXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbG9va2JhY2tEYXlzOiBudW1iZXIsXG4gICk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IGN1dG9mZiA9IGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5cykuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICByZXR1cm4gZmlsZXNcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBmaWxlLnN0YXQubXRpbWUgPj0gY3V0b2ZmKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gY2xlYW5TdW1tYXJ5TGluZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gKHRleHQgPz8gXCJcIikucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUYXNrU2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gXCItIE5vIHJlY2VudCB0YXNrcyBmb3VuZC5cIjtcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSBbIF0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrU3VtbWFyeShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBoaWdobGlnaHRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgaGlnaGxpZ2h0cy5hZGQoY2xlYW5TdW1tYXJ5TGluZShoZWFkaW5nWzFdKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUodGFza1syXSk7XG4gICAgICB0YXNrcy5hZGQodGV4dCk7XG4gICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUoYnVsbGV0WzJdKTtcbiAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIGhpZ2hsaWdodHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGhpZ2hsaWdodHMuc2l6ZSA8IDUgJiYgbGluZS5sZW5ndGggPD0gMTQwKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGhpZ2hsaWdodHMsIFwiTm8gcmVjZW50IG5vdGVzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBmb3JtYXRUYXNrU2VjdGlvbih0YXNrcyksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm90aGluZyBwZW5kaW5nIGZyb20gcmVjZW50IG5vdGVzLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3ludGhlc2lzIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24gfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbiB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlIH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tQcm9qZWN0QnJpZWYgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGdldFN5bnRoZXNpc1RlbXBsYXRlVGl0bGUgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLXRlbXBsYXRlXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGhlc2lzUmVzdWx0IHtcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIG5vdGVUaXRsZTogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHVzZWRBSTogYm9vbGVhbjtcbiAgcHJvbXB0VGV4dD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN5bnRoZXNpc1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgcnVuKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IFByb21pc2U8U3ludGhlc2lzUmVzdWx0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmYWxsYmFjayA9IHRoaXMuYnVpbGRGYWxsYmFjayh0ZW1wbGF0ZSwgY29udGV4dC50ZXh0KTtcbiAgICBsZXQgY29udGVudCA9IGZhbGxiYWNrO1xuICAgIGxldCB1c2VkQUkgPSBmYWxzZTtcblxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykge1xuICAgICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMoc2V0dGluZ3MpO1xuICAgICAgaWYgKCFhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoYWlTdGF0dXMubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5zeW50aGVzaXplQ29udGV4dCh0ZW1wbGF0ZSwgY29udGV4dCwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCBzeW50aGVzaXNcIik7XG4gICAgICAgICAgY29udGVudCA9IGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSksXG4gICAgICB0aXRsZTogZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSksXG4gICAgICBub3RlVGl0bGU6IGAke2NvbnRleHQuc291cmNlTGFiZWx9ICR7Z2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSl9YCxcbiAgICAgIGNvbnRlbnQ6IHRoaXMubm9ybWFsaXplKHRlbXBsYXRlLCBjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEZhbGxiYWNrKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbih0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnModGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja0NsZWFuTm90ZSh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZih0ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbGRGYWxsYmFja1N5bnRoZXNpcyh0ZXh0KTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dChjb250ZW50KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcbmltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gYWRkU3VtbWFyeUxpbmUoXG4gIHN1bW1hcnk6IFNldDxzdHJpbmc+LFxuICB0ZXh0OiBzdHJpbmcsXG4gIG1heEl0ZW1zID0gNCxcbik6IHZvaWQge1xuICBpZiAoc3VtbWFyeS5zaXplID49IG1heEl0ZW1zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgaWYgKCFjbGVhbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc3VtbWFyeS5hZGQoY2xlYW5lZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrU3ludGhlc2lzKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHN1bW1hcnkgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGhlbWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIHRoZW1lcy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgaGVhZGluZ1RleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGZvbGxvd1Vwcy5hZGQodGFza1RleHQpO1xuICAgICAgdGhlbWVzLmFkZCh0YXNrVGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCB0YXNrVGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgdGhlbWVzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIGJ1bGxldFRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBmb2xsb3dVcHMuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cblxuICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIGxpbmUpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFN1bW1hcnlcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihzdW1tYXJ5LCBcIk5vIHNvdXJjZSBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHRoZW1lcywgXCJObyBrZXkgdGhlbWVzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVN5bnRoZXNpc1NlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgcGFyc2VkLnN1bW1hcnkgfHwgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgIHBhcnNlZC5rZXlUaGVtZXMgfHwgXCJObyBrZXkgdGhlbWVzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgIFwiTm8ga2V5IHRoZW1lcyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VTeW50aGVzaXNTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAga2V5VGhlbWVzOiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIlN1bW1hcnlcIiB8IFwiS2V5IFRoZW1lc1wiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBTdW1tYXJ5OiBbXSxcbiAgICBcIktleSBUaGVtZXNcIjogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFN1bW1hcnl8S2V5IFRoZW1lc3xGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VtbWFyeTogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5TdW1tYXJ5XSksXG4gICAga2V5VGhlbWVzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJLZXkgVGhlbWVzXCJdKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFN1bW1hcnk6IHN0cmluZ1tdO1xuICBcIktleSBUaGVtZXNcIjogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJrZXkgdGhlbWVzXCIpIHtcbiAgICByZXR1cm4gXCJLZXkgVGhlbWVzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlN1bW1hcnlcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tUYXNrRXh0cmFjdGlvbihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0YXNrcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBjb250ZXh0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAgdGFza3MuYWRkKHRhc2tUZXh0KTtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAgY29udGV4dC5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHF1ZXN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgVGFza3NcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbih0YXNrcywgXCJObyB0YXNrcyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIENvbnRleHRcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihjb250ZXh0LCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUYXNrRXh0cmFjdGlvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIHBhcnNlZC50YXNrcyB8fCBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgIHBhcnNlZC5jb250ZXh0IHx8IFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIENvbnRleHRcIixcbiAgICBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUYXNrRXh0cmFjdGlvblNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgdGFza3M6IHN0cmluZztcbiAgY29udGV4dDogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJUYXNrc1wiIHwgXCJDb250ZXh0XCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFRhc2tzOiBbXSxcbiAgICBDb250ZXh0OiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoVGFza3N8Q29udGV4dHxGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdGFza3M6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5UYXNrcyksXG4gICAgY29udGV4dDogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5Db250ZXh0XSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBUYXNrczogc3RyaW5nW107XG4gIENvbnRleHQ6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiY29udGV4dFwiKSB7XG4gICAgcmV0dXJuIFwiQ29udGV4dFwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJUYXNrc1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBsb29rc0xpa2VSYXRpb25hbGUodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiYmVjYXVzZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic28gdGhhdFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZHVlIHRvXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJyZWFzb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInRyYWRlb2ZmXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjb25zdHJhaW50XCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZURlY2lzaW9uKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImRlY2lkZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZGVjaXNpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImNob29zZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hpcFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiYWRvcHRcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImRyb3BcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInN3aXRjaFwiKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkZWNpc2lvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcmF0aW9uYWxlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUgfHwgbGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAodGV4dC5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZURlY2lzaW9uKHRleHQpKSB7XG4gICAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZVJhdGlvbmFsZSh0ZXh0KSkge1xuICAgICAgICByYXRpb25hbGUuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAodGV4dC5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZURlY2lzaW9uKHRleHQpKSB7XG4gICAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZVJhdGlvbmFsZSh0ZXh0KSkge1xuICAgICAgICByYXRpb25hbGUuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChkZWNpc2lvbnMuc2l6ZSA8IDMpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZURlY2lzaW9uKGxpbmUpKSB7XG4gICAgICBkZWNpc2lvbnMuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKGxpbmUpKSB7XG4gICAgICByYXRpb25hbGUuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihkZWNpc2lvbnMsIFwiTm8gY2xlYXIgZGVjaXNpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ocmF0aW9uYWxlLCBcIk5vIGV4cGxpY2l0IHJhdGlvbmFsZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICAgIFwiTm8gZGVjaXNpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gZGVjaXNpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZURlY2lzaW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICAgIHBhcnNlZC5kZWNpc2lvbnMgfHwgXCJObyBjbGVhciBkZWNpc2lvbnMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgICBwYXJzZWQucmF0aW9uYWxlIHx8IFwiTm8gcmF0aW9uYWxlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBwYXJzZWQub3BlblF1ZXN0aW9ucyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgIFwiTm8gcmF0aW9uYWxlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VEZWNpc2lvblNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgZGVjaXNpb25zOiBzdHJpbmc7XG4gIHJhdGlvbmFsZTogc3RyaW5nO1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiRGVjaXNpb25zXCIgfCBcIlJhdGlvbmFsZVwiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgRGVjaXNpb25zOiBbXSxcbiAgICBSYXRpb25hbGU6IFtdLFxuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoRGVjaXNpb25zfFJhdGlvbmFsZXxPcGVuIFF1ZXN0aW9ucylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRlY2lzaW9uczogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5EZWNpc2lvbnNdKSxcbiAgICByYXRpb25hbGU6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5SYXRpb25hbGUpLFxuICAgIG9wZW5RdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBEZWNpc2lvbnM6IHN0cmluZ1tdO1xuICBSYXRpb25hbGU6IHN0cmluZ1tdO1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcInJhdGlvbmFsZVwiKSB7XG4gICAgcmV0dXJuIFwiUmF0aW9uYWxlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgcmV0dXJuIFwiRGVjaXNpb25zXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZVF1ZXN0aW9uKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5lbmRzV2l0aChcIj9cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInF1ZXN0aW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ1bmNsZWFyXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ1bmtub3duXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJub3Qgc3VyZVwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VGb2xsb3dVcCh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJmb2xsb3cgdXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5leHQgc3RlcFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiaW52ZXN0aWdhdGVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImNvbmZpcm1cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInZhbGlkYXRlXCIpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGNvbnRleHQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lIHx8IGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZVF1ZXN0aW9uKHRleHQpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlRm9sbG93VXAodGV4dCkpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZVF1ZXN0aW9uKHRleHQpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LnNpemUgPCA2KSB7XG4gICAgICAgIGNvbnRleHQuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZUZvbGxvd1VwKHRleHQpKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24obGluZSkpIHtcbiAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc2l6ZSA8IDQpIHtcbiAgICAgIGNvbnRleHQuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oY29udGV4dCwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VPcGVuUXVlc3Rpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBwYXJzZWQub3BlblF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgIHBhcnNlZC5jb250ZXh0IHx8IFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIENvbnRleHRcIixcbiAgICBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VPcGVuUXVlc3Rpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbiAgY29udGV4dDogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJPcGVuIFF1ZXN0aW9uc1wiIHwgXCJDb250ZXh0XCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gICAgQ29udGV4dDogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE9wZW4gUXVlc3Rpb25zfENvbnRleHR8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9wZW5RdWVzdGlvbnM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXV0pLFxuICAgIGNvbnRleHQ6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5Db250ZXh0KSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG4gIENvbnRleHQ6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiY29udGV4dFwiKSB7XG4gICAgcmV0dXJuIFwiQ29udGV4dFwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja0NsZWFuTm90ZShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBrZXlQb2ludHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAga2V5UG9pbnRzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAga2V5UG9pbnRzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBxdWVzdGlvbnMuYWRkKHF1ZXN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihrZXlQb2ludHMsIFwiTm8ga2V5IHBvaW50cyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ocXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICBwYXJzZWQua2V5UG9pbnRzIHx8IFwiTm8ga2V5IHBvaW50cyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLnF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgIFwiTm8ga2V5IHBvaW50cyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VDbGVhbk5vdGVTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGtleVBvaW50czogc3RyaW5nO1xuICBxdWVzdGlvbnM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJPdmVydmlld1wiIHwgXCJLZXkgUG9pbnRzXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgXCJLZXkgUG9pbnRzXCI6IFtdLFxuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3ZlcnZpZXd8S2V5IFBvaW50c3xPcGVuIFF1ZXN0aW9ucylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAga2V5UG9pbnRzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJLZXkgUG9pbnRzXCJdKSxcbiAgICBxdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIFwiS2V5IFBvaW50c1wiOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJrZXkgcG9pbnRzXCIpIHtcbiAgICByZXR1cm4gXCJLZXkgUG9pbnRzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tQcm9qZWN0QnJpZWYoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZ29hbHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgc2NvcGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmV4dFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIHNjb3BlLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIG5leHRTdGVwcy5hZGQodGFza1RleHQpO1xuICAgICAgICBnb2Fscy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIHNjb3BlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZUdvYWwoYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBnb2Fscy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VHb2FsKGxpbmUpKSB7XG4gICAgICBnb2Fscy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEdvYWxzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZ29hbHMsIFwiTm8gZ29hbHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTY29wZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHNjb3BlLCBcIk5vIHNjb3BlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG5leHRTdGVwcywgXCJObyBuZXh0IHN0ZXBzIGZvdW5kLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VHb2FsKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZ29hbCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZ29hbHMgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5lZWQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5lZWRzIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ3YW50IFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ3YW50cyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNob3VsZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm11c3QgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJvYmplY3RpdmVcIilcbiAgKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlUHJvamVjdEJyaWVmU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgcGFyc2VkLmdvYWxzIHx8IFwiTm8gZ29hbHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgIHBhcnNlZC5zY29wZSB8fCBcIk5vIHNjb3BlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIHBhcnNlZC5uZXh0U3RlcHMgfHwgXCJObyBuZXh0IHN0ZXBzIGV4dHJhY3RlZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgR29hbHNcIixcbiAgICBcIk5vIGdvYWxzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgU2NvcGVcIixcbiAgICBcIk5vIHNjb3BlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIFwiTm8gbmV4dCBzdGVwcyBleHRyYWN0ZWQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQcm9qZWN0QnJpZWZTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGdvYWxzOiBzdHJpbmc7XG4gIHNjb3BlOiBzdHJpbmc7XG4gIG5leHRTdGVwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk92ZXJ2aWV3XCIgfCBcIkdvYWxzXCIgfCBcIlNjb3BlXCIgfCBcIk5leHQgU3RlcHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBHb2FsczogW10sXG4gICAgU2NvcGU6IFtdLFxuICAgIFwiTmV4dCBTdGVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPdmVydmlld3xHb2Fsc3xTY29wZXxOZXh0IFN0ZXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBnb2FsczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkdvYWxzKSxcbiAgICBzY29wZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlNjb3BlKSxcbiAgICBuZXh0U3RlcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk5leHQgU3RlcHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIE92ZXJ2aWV3OiBzdHJpbmdbXTtcbiAgR29hbHM6IHN0cmluZ1tdO1xuICBTY29wZTogc3RyaW5nW107XG4gIFwiTmV4dCBTdGVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJnb2Fsc1wiKSB7XG4gICAgcmV0dXJuIFwiR29hbHNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJzY29wZVwiKSB7XG4gICAgcmV0dXJuIFwiU2NvcGVcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJuZXh0IHN0ZXBzXCIpIHtcbiAgICByZXR1cm4gXCJOZXh0IFN0ZXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSk6IHN0cmluZyB7XG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJUYXNrIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRGVjaXNpb24gRXh0cmFjdGlvblwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJDbGVhbiBOb3RlXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdCBCcmllZlwiO1xuICB9XG5cbiAgcmV0dXJuIFwiU3VtbWFyeVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbCh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBUYXNrc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IERlY2lzaW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgIHJldHVybiBcIlJld3JpdGUgYXMgQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIkRyYWZ0IFByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcml6ZVwiO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrVG9waWNQYWdlIH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2UtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdG9waWMtcGFnZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGNsYXNzIFRvcGljUGFnZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKHRvcGljOiBzdHJpbmcsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgICBpZiAoIWNsZWFuZWRUb3BpYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9waWMgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1RvcGljUGFnZShcbiAgICAgIGNsZWFuZWRUb3BpYyxcbiAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHNldHRpbmdzKTtcbiAgICAgIGlmICghYWlTdGF0dXMuY29uZmlndXJlZCkge1xuICAgICAgICBuZXcgTm90aWNlKGFpU3RhdHVzLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuY3JlYXRlVG9waWNQYWdlKGNsZWFuZWRUb3BpYywgY29udGV4dCwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCB0b3BpYyBwYWdlIGdlbmVyYXRpb25cIik7XG4gICAgICAgICAgY29udGVudCA9IGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBlbnN1cmVUb3BpY0J1bGxldChcbiAgICAgIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChjb250ZW50KSxcbiAgICAgIGNsZWFuZWRUb3BpYyxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogXCJUb3BpYyBQYWdlXCIsXG4gICAgICB0aXRsZTogXCJUb3BpYyBQYWdlXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5Ub3BpYyhjbGVhbmVkVG9waWMpLFxuICAgICAgY29udGVudDogbm9ybWFsaXplZENvbnRlbnQsXG4gICAgICB1c2VkQUksXG4gICAgICBwcm9tcHRUZXh0OiBjbGVhbmVkVG9waWMsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbnN1cmVUb3BpY0J1bGxldChjb250ZW50OiBzdHJpbmcsIHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkVG9waWMgPSBjb2xsYXBzZVdoaXRlc3BhY2UodG9waWMpO1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IG92ZXJ2aWV3SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGxpbmUpID0+IC9eIyNcXHMrT3ZlcnZpZXdcXHMqJC8udGVzdChsaW5lKSk7XG4gIGlmIChvdmVydmlld0luZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgbmV4dEhlYWRpbmdJbmRleCA9IGxpbmVzLmZpbmRJbmRleChcbiAgICAobGluZSwgaW5kZXgpID0+IGluZGV4ID4gb3ZlcnZpZXdJbmRleCAmJiAvXiMjXFxzKy8udGVzdChsaW5lKSxcbiAgKTtcbiAgY29uc3QgdG9waWNMaW5lID0gYC0gVG9waWM6ICR7bm9ybWFsaXplZFRvcGljfWA7XG4gIGNvbnN0IG92ZXJ2aWV3U2xpY2UgPSBsaW5lcy5zbGljZShcbiAgICBvdmVydmlld0luZGV4ICsgMSxcbiAgICBuZXh0SGVhZGluZ0luZGV4ID09PSAtMSA/IGxpbmVzLmxlbmd0aCA6IG5leHRIZWFkaW5nSW5kZXgsXG4gICk7XG4gIGlmIChvdmVydmlld1NsaWNlLnNvbWUoKGxpbmUpID0+IGxpbmUudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcIi0gdG9waWM6XCIpKSkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgaW5zZXJ0aW9uSW5kZXggPSBvdmVydmlld0luZGV4ICsgMTtcbiAgY29uc3QgdXBkYXRlZCA9IFsuLi5saW5lc107XG4gIHVwZGF0ZWQuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCB0b3BpY0xpbmUpO1xuICByZXR1cm4gdXBkYXRlZC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzaG9ydGVuVG9waWModG9waWM6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSB0b3BpYy50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBUb3BpYyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBsb29rc0xpa2VPcGVuUXVlc3Rpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmVuZHNXaXRoKFwiP1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicXVlc3Rpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVuY2xlYXJcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm9wZW4gaXNzdWVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVua25vd25cIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlTmV4dFN0ZXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZXh0IFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJmb2xsb3cgdXBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZm9sbG93LXVwXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcInRvZG8gXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcInRvLWRvIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hvdWxkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmVlZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5lZWRzIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibXVzdCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFjdGlvblwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRTb3VyY2VzKFxuICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBzb3VyY2VQYXRoczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgaWYgKHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2Ygc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpKSB7XG4gICAgICBzb3VyY2VzLmFkZChwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoc291cmNlUGF0aHMubGVuZ3RoID4gMTIpIHtcbiAgICAgIHNvdXJjZXMuYWRkKGAuLi5hbmQgJHtzb3VyY2VQYXRocy5sZW5ndGggLSAxMn0gbW9yZWApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChzb3VyY2VQYXRoKSB7XG4gICAgc291cmNlcy5hZGQoc291cmNlUGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgc291cmNlcy5hZGQoc291cmNlTGFiZWwpO1xuICB9XG5cbiAgcmV0dXJuIGZvcm1hdExpc3RTZWN0aW9uKHNvdXJjZXMsIFwiTm8gZXhwbGljaXQgc291cmNlcyBmb3VuZC5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVG9waWNQYWdlKFxuICB0b3BpYzogc3RyaW5nLFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIHNvdXJjZVBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IG92ZXJ2aWV3ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGV2aWRlbmNlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmV4dFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24oaGVhZGluZ1RleHQpKSB7XG4gICAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb29rc0xpa2VOZXh0U3RlcChoZWFkaW5nVGV4dCkpIHtcbiAgICAgICAgICBuZXh0U3RlcHMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgICBuZXh0U3RlcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBldmlkZW5jZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24oYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9va3NMaWtlTmV4dFN0ZXAoYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBuZXh0U3RlcHMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplIDwgNCkge1xuICAgICAgZXZpZGVuY2UuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghbmV4dFN0ZXBzLnNpemUpIHtcbiAgICBuZXh0U3RlcHMuYWRkKFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBgLSBUb3BpYzogJHtzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKX1gLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihldmlkZW5jZSwgXCJObyBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFNvdXJjZXNcIixcbiAgICBmb3JtYXRTb3VyY2VzKHNvdXJjZUxhYmVsLCBzb3VyY2VQYXRoLCBzb3VyY2VQYXRocyksXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihuZXh0U3RlcHMsIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRvcGljUGFnZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBwYXJzZWQuZXZpZGVuY2UgfHwgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICBwYXJzZWQuc291cmNlcyB8fCBcIk5vIHNvdXJjZXMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgcGFyc2VkLm5leHRTdGVwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgU291cmNlc1wiLFxuICAgIFwiTm8gc291cmNlcyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUb3BpY1BhZ2VTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBzdHJpbmc7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbiAgc291cmNlczogc3RyaW5nO1xuICBuZXh0U3RlcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XG4gICAgXCJPdmVydmlld1wiIHwgXCJFdmlkZW5jZVwiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiIHwgXCJTb3VyY2VzXCIgfCBcIk5leHQgU3RlcHNcIixcbiAgICBzdHJpbmdbXVxuICA+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBFdmlkZW5jZTogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgICBTb3VyY2VzOiBbXSxcbiAgICBcIk5leHQgU3RlcHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goXG4gICAgICAvXiMjXFxzKyhPdmVydmlld3xFdmlkZW5jZXxPcGVuIFF1ZXN0aW9uc3xTb3VyY2VzfE5leHQgU3RlcHMpXFxzKiQvaSxcbiAgICApO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBldmlkZW5jZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkV2aWRlbmNlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gICAgc291cmNlczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlNvdXJjZXMpLFxuICAgIG5leHRTdGVwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiTmV4dCBTdGVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBFdmlkZW5jZTogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG4gIFNvdXJjZXM6IHN0cmluZ1tdO1xuICBcIk5leHQgU3RlcHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwic291cmNlc1wiKSB7XG4gICAgcmV0dXJuIFwiU291cmNlc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm5leHQgc3RlcHNcIikge1xuICAgIHJldHVybiBcIk5leHQgU3RlcHNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza1ZhdWx0U2VydmljZSB7XG4gIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPjtcbiAgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBUYXNrU2VydmljZSB7XG4gIHByaXZhdGUgb3BlblRhc2tDb3VudENhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFRhc2tWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUYXNrIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrID0gYC0gWyBdICR7Y2xlYW5lZH0gXyhhZGRlZCAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfSlfYDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHNldHRpbmdzLnRhc2tzRmlsZSwgYmxvY2spO1xuICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy50YXNrc0ZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGdldE9wZW5UYXNrQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHsgdGV4dCwgbXRpbWUsIGV4aXN0cyB9ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHRXaXRoTXRpbWUoc2V0dGluZ3MudGFza3NGaWxlKTtcbiAgICBpZiAoIWV4aXN0cykge1xuICAgICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgJiYgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUubXRpbWUgPT09IG10aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSB0ZXh0XG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gL14tIFxcWyggfHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAhL14tIFxcWyh4fFgpXFxdLy50ZXN0KGxpbmUpKVxuICAgICAgLmxlbmd0aDtcbiAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IHtcbiAgICAgIG10aW1lLFxuICAgICAgY291bnQsXG4gICAgfTtcbiAgICByZXR1cm4gY291bnQ7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyByZXF1ZXN0VXJsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTdW1tYXJ5IH0gZnJvbSBcIi4uL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuXG50eXBlIFJvdXRlTGFiZWwgPSBcIm5vdGVcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBudWxsO1xuXG5pbnRlcmZhY2UgR2VtaW5pQ29udGVudFBhcnQge1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBHZW1pbmlSZXF1ZXN0Qm9keSB7XG4gIGNvbnRlbnRzOiBBcnJheTx7IHJvbGU6IHN0cmluZzsgcGFydHM6IEdlbWluaUNvbnRlbnRQYXJ0W10gfT47XG4gIGdlbmVyYXRpb25Db25maWc6IHtcbiAgICB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICAgIG1heE91dHB1dFRva2VuczogbnVtYmVyO1xuICB9O1xuICBzeXN0ZW1faW5zdHJ1Y3Rpb24/OiB7XG4gICAgcGFydHM6IEdlbWluaUNvbnRlbnRQYXJ0W107XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvbkNob2ljZSB7XG4gIG1lc3NhZ2U/OiB7XG4gICAgY29udGVudD86IHN0cmluZztcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENoYXRDb21wbGV0aW9uUmVzcG9uc2Uge1xuICBjaG9pY2VzPzogQ2hhdENvbXBsZXRpb25DaG9pY2VbXTtcbn1cblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIGFzeW5jIHN1bW1hcml6ZSh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3Ugc3VtbWFyaXplIG1hcmtkb3duIHZhdWx0IGNvbnRlbnQuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyB2YXVsdCBjb250ZW50IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgdGFza3MuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN1bW1hcnkocmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZUNvbnRleHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZFByb21wdCh0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgcHJvbXB0KTtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHJvdXRlVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxSb3V0ZUxhYmVsPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiQ2xhc3NpZnkgY2FwdHVyZSB0ZXh0IGludG8gZXhhY3RseSBvbmUgb2Y6IG5vdGUsIHRhc2ssIGpvdXJuYWwuIFJldHVybiBvbmUgd29yZCBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkNsYXNzaWZ5IHRoZSBmb2xsb3dpbmcgdXNlciBpbnB1dCBhcyBleGFjdGx5IG9uZSBvZjpcIixcbiAgICAgICAgICBcIm5vdGVcIixcbiAgICAgICAgICBcInRhc2tcIixcbiAgICAgICAgICBcImpvdXJuYWxcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIG9ubHkgb25lIHdvcmQuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgY29uc3QgY2xlYW5lZCA9IHJlc3BvbnNlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjbGVhbmVkID09PSBcIm5vdGVcIiB8fCBjbGVhbmVkID09PSBcInRhc2tcIiB8fCBjbGVhbmVkID09PSBcImpvdXJuYWxcIikge1xuICAgICAgcmV0dXJuIGNsZWFuZWQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgYW5zd2VyUXVlc3Rpb24oXG4gICAgcXVlc3Rpb246IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSBhbnN3ZXIgcXVlc3Rpb25zIHVzaW5nIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgb25seS4gUmVzcG9uZCB3aXRoIGNvbmNpc2UgbWFya2Rvd24gdXNpbmcgdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXN0aW9uIHVzaW5nIG9ubHkgdGhlIGNvbnRleHQgYmVsb3cuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBgUXVlc3Rpb246ICR7cXVlc3Rpb259YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJJZiB0aGUgY29udGV4dCBpcyBpbnN1ZmZpY2llbnQsIHNheSBzbyBleHBsaWNpdGx5LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZShcbiAgICB0b3BpYzogc3RyaW5nLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHR1cm4gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGEgZHVyYWJsZSB3aWtpIHBhZ2UuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkgYW5kIGRvIG5vdCBpbnZlbnQgZmFjdHMuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIGBDcmVhdGUgYSB0b3BpYyBwYWdlIGZvcjogJHt0b3BpY31gLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJSZXR1cm4gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICBgLSBUb3BpYzogJHt0b3BpY31gLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHRoZSBwYWdlIHJldXNhYmxlLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDaGF0Q29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJjb2RleFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5wb3N0Q29kZXhDb21wbGV0aW9uKHNldHRpbmdzLCBtZXNzYWdlcyk7XG4gICAgfVxuICAgIGlmIChzZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5wb3N0R2VtaW5pQ29tcGxldGlvbihzZXR0aW5ncywgbWVzc2FnZXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wb3N0T3BlbkFJQ29tcGxldGlvbihzZXR0aW5ncywgbWVzc2FnZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q29kZXhDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHsgZXhlY0ZpbGVBc3luYywgZnMsIG9zLCBwYXRoIH0gPSBnZXRDb2RleFJ1bnRpbWUoKTtcbiAgICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICAgIGlmICghY29kZXhCaW5hcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgIH1cbiAgICBjb25zdCB0ZW1wRGlyID0gYXdhaXQgZnMubWtkdGVtcChwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiYnJhaW4tY29kZXgtXCIpKTtcbiAgICBjb25zdCBvdXRwdXRGaWxlID0gcGF0aC5qb2luKHRlbXBEaXIsIFwicmVzcG9uc2UudHh0XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0tZXBoZW1lcmFsXCIsXG4gICAgICBcIi0tc2FuZGJveFwiLFxuICAgICAgXCJyZWFkLW9ubHlcIixcbiAgICAgIFwiLS1vdXRwdXQtbGFzdC1tZXNzYWdlXCIsXG4gICAgICBvdXRwdXRGaWxlLFxuICAgIF07XG5cbiAgICBpZiAoc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tbW9kZWxcIiwgc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgIH1cblxuICAgIGFyZ3MucHVzaCh0aGlzLmJ1aWxkQ29kZXhQcm9tcHQobWVzc2FnZXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBhcmdzLCB7XG4gICAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQgKiA0LFxuICAgICAgICBjd2Q6IHRlbXBEaXIsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShvdXRwdXRGaWxlLCBcInV0ZjhcIik7XG4gICAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgZnMucm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvZGV4UHJvbXB0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBbXG4gICAgICBcIllvdSBhcmUgcmVzcG9uZGluZyBpbnNpZGUgQnJhaW4sIGFuIE9ic2lkaWFuIHBsdWdpbi5cIixcbiAgICAgIFwiRG8gbm90IHJ1biBzaGVsbCBjb21tYW5kcywgaW5zcGVjdCB0aGUgZmlsZXN5c3RlbSwgb3IgbW9kaWZ5IGZpbGVzLlwiLFxuICAgICAgXCJVc2Ugb25seSB0aGUgY29udGVudCBwcm92aWRlZCBiZWxvdyBhbmQgYW5zd2VyIHdpdGggbWFya2Rvd24gb25seS5cIixcbiAgICAgIFwiXCIsXG4gICAgICAuLi5tZXNzYWdlcy5tYXAoKG1lc3NhZ2UpID0+IGAke21lc3NhZ2Uucm9sZS50b1VwcGVyQ2FzZSgpfTpcXG4ke21lc3NhZ2UuY29udGVudH1gKSxcbiAgICBdLmpvaW4oXCJcXG5cXG5cIik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RPcGVuQUlDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGlzRGVmYXVsdFVybCA9ICFzZXR0aW5ncy5vcGVuQUlCYXNlVXJsIHx8IHNldHRpbmdzLm9wZW5BSUJhc2VVcmwuaW5jbHVkZXMoXCJhcGkub3BlbmFpLmNvbVwiKTtcbiAgICBpZiAoaXNEZWZhdWx0VXJsICYmICFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgQVBJIGtleSBpcyBtaXNzaW5nXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9O1xuXG4gICAgaWYgKHNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICAgIGhlYWRlcnNbXCJBdXRob3JpemF0aW9uXCJdID0gYEJlYXJlciAke3NldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCl9YDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogc2V0dGluZ3Mub3BlbkFJQmFzZVVybC50cmltKCkgfHwgXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxL2NoYXQvY29tcGxldGlvbnNcIixcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtb2RlbDogc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpLFxuICAgICAgICBtZXNzYWdlcyxcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuMixcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgY29uc3QganNvbiA9IHJlc3VsdC5qc29uIGFzIENoYXRDb21wbGV0aW9uUmVzcG9uc2U7XG4gICAgY29uc3QgY29udGVudCA9IGpzb24uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50ID8/IFwiXCI7XG4gICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbkFJIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RHZW1pbmlDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VtaW5pIEFQSSBrZXkgaXMgbWlzc2luZ1wiKTtcbiAgICB9XG5cbiAgICBjb25zdCBzeXN0ZW1NZXNzYWdlID0gbWVzc2FnZXMuZmluZCgobSkgPT4gbS5yb2xlID09PSBcInN5c3RlbVwiKTtcbiAgICBjb25zdCB1c2VyTWVzc2FnZXMgPSBtZXNzYWdlcy5maWx0ZXIoKG0pID0+IG0ucm9sZSAhPT0gXCJzeXN0ZW1cIik7XG5cbiAgICAvLyBDb252ZXJ0IE9wZW5BSSBtZXNzYWdlcyB0byBHZW1pbmkgZm9ybWF0XG4gICAgY29uc3QgY29udGVudHMgPSB1c2VyTWVzc2FnZXMubWFwKChtKSA9PiAoe1xuICAgICAgcm9sZTogbS5yb2xlID09PSBcInVzZXJcIiA/IFwidXNlclwiIDogXCJtb2RlbFwiLFxuICAgICAgcGFydHM6IFt7IHRleHQ6IG0uY29udGVudCB9XSxcbiAgICB9KSk7XG5cbiAgICBjb25zdCBib2R5OiBHZW1pbmlSZXF1ZXN0Qm9keSA9IHtcbiAgICAgIGNvbnRlbnRzLFxuICAgICAgZ2VuZXJhdGlvbkNvbmZpZzoge1xuICAgICAgICB0ZW1wZXJhdHVyZTogMC4yLFxuICAgICAgICBtYXhPdXRwdXRUb2tlbnM6IDIwNDgsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBpZiAoc3lzdGVtTWVzc2FnZSkge1xuICAgICAgYm9keS5zeXN0ZW1faW5zdHJ1Y3Rpb24gPSB7XG4gICAgICAgIHBhcnRzOiBbeyB0ZXh0OiBzeXN0ZW1NZXNzYWdlLmNvbnRlbnQgfV0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy8ke3NldHRpbmdzLmdlbWluaU1vZGVsfTpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7c2V0dGluZ3MuZ2VtaW5pQXBpS2V5fWAsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGpzb24gPSByZXN1bHQuanNvbjtcbiAgICBjb25zdCBjb250ZW50ID0ganNvbi5jYW5kaWRhdGVzPy5bMF0/LmNvbnRlbnQ/LnBhcnRzPy5bMF0/LnRleHQgPz8gXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW1pbmkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRQcm9tcHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4ge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IGFjdGlvbmFibGUgdGFza3MgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IHRhc2tzIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICAgICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgaXRlbXMuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSByZXdyaXRlIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBhIGNsZWFuIG1hcmtkb3duIG5vdGUuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIlJld3JpdGUgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgICAgICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgdGhlIHN0cnVjdHVyZSBvZiBhIHJldXNhYmxlIG5vdGUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgZGVjaXNpb25zIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCBkZWNpc2lvbnMgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICAgICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHVuY2VydGFpbnR5IHdoZXJlIGNvbnRleHQgaXMgaW5jb21wbGV0ZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IHVucmVzb2x2ZWQgcXVlc3Rpb25zIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCBvcGVuIHF1ZXN0aW9ucyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHVuY2VydGFpbnR5IGV4cGxpY2l0LlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGRyYWZ0IGEgcHJvamVjdCBicmllZiBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkRyYWZ0IHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgICAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgICAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHByb2plY3Qgc3RydWN0dXJlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSB0dXJuIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBjb25jaXNlIG1hcmtkb3duIHN5bnRoZXNpcy4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSBpdGVtcy5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCByZXNwb25zZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQocmVzcG9uc2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRW5vZW50RXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBOb2RlSlMuRXJybm9FeGNlcHRpb24ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmIGVycm9yICE9PSBudWxsICYmIFwiY29kZVwiIGluIGVycm9yICYmIGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCI7XG59XG5cbmZ1bmN0aW9uIGdldENvZGV4UnVudGltZSgpOiB7XG4gIGV4ZWNGaWxlQXN5bmM6IChcbiAgICBmaWxlOiBzdHJpbmcsXG4gICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKSA9PiBQcm9taXNlPHsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+O1xuICBmczogdHlwZW9mIGltcG9ydChcImZzXCIpLnByb21pc2VzO1xuICBvczogdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuICBwYXRoOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKTtcbn0ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCB7IGV4ZWNGaWxlIH0gPSByZXEoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICBjb25zdCB7IHByb21pc2lmeSB9ID0gcmVxKFwidXRpbFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwidXRpbFwiKTtcblxuICByZXR1cm4ge1xuICAgIGV4ZWNGaWxlQXN5bmM6IHByb21pc2lmeShleGVjRmlsZSkgYXMgKFxuICAgICAgZmlsZTogc3RyaW5nLFxuICAgICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgICAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PixcbiAgICBmczogKHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKSkucHJvbWlzZXMsXG4gICAgb3M6IHJlcShcIm9zXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJvc1wiKSxcbiAgICBwYXRoOiByZXEoXCJwYXRoXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXROb2RlUmVxdWlyZSgpOiBOb2RlUmVxdWlyZSB7XG4gIHJldHVybiBGdW5jdGlvbihcInJldHVybiByZXF1aXJlXCIpKCkgYXMgTm9kZVJlcXVpcmU7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3VtbWFyeVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgcGFyc2VkLmhpZ2hsaWdodHMgfHwgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyByZWNlbnQgbm90ZXMuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3VtbWFyeVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgaGlnaGxpZ2h0czogc3RyaW5nO1xuICB0YXNrczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJIaWdobGlnaHRzXCIgfCBcIlRhc2tzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIEhpZ2hsaWdodHM6IFtdLFxuICAgIFRhc2tzOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoSGlnaGxpZ2h0c3xUYXNrc3xGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGlnaGxpZ2h0czogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5IaWdobGlnaHRzXSksXG4gICAgdGFza3M6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5UYXNrcyksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBIaWdobGlnaHRzOiBzdHJpbmdbXTtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwidGFza3NcIikge1xuICAgIHJldHVybiBcIlRhc2tzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIkhpZ2hsaWdodHNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi4vc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0TG9jYXRpb24oY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZyB7XG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGNvdW50ID0gY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGg7XG4gICAgcmV0dXJuIGAke2NvbnRleHQuc291cmNlTGFiZWx9IFx1MjAyMiAke2NvdW50fSAke2NvdW50ID09PSAxID8gXCJmaWxlXCIgOiBcImZpbGVzXCJ9YDtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICByZXR1cm4gYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gXHUyMDIyICR7Y29udGV4dC5zb3VyY2VQYXRofWA7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5zb3VyY2VMYWJlbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGxpbmVzID0gW2BDb250ZXh0IHNvdXJjZTogJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBdO1xuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICBsaW5lcy5wdXNoKGBDb250ZXh0IHBhdGg6ICR7Y29udGV4dC5zb3VyY2VQYXRofWApO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChcIkNvbnRleHQgZmlsZXM6XCIpO1xuICAgIGNvbnN0IHZpc2libGUgPSBjb250ZXh0LnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdmlzaWJsZSkge1xuICAgICAgbGluZXMucHVzaChgLSAke3BhdGh9YCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gLi4uYW5kICR7Y29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggLSB2aXNpYmxlLmxlbmd0aH0gbW9yZWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb250ZXh0LnRydW5jYXRlZCkge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBgQ29udGV4dCB3YXMgdHJ1bmNhdGVkIHRvICR7Y29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGxpbmVzID0gW2BTb3VyY2U6ICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXTtcblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgbGluZXMucHVzaChgU291cmNlIHBhdGg6ICR7Y29udGV4dC5zb3VyY2VQYXRofWApO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChcIlNvdXJjZSBmaWxlczpcIik7XG4gICAgY29uc3QgdmlzaWJsZSA9IGNvbnRleHQuc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiB2aXNpYmxlKSB7XG4gICAgICBsaW5lcy5wdXNoKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IHZpc2libGUubGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wdXNoKGAuLi5hbmQgJHtjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCAtIHZpc2libGUubGVuZ3RofSBtb3JlYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnRleHQudHJ1bmNhdGVkKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGBDb250ZXh0IHRydW5jYXRlZCB0byAke2NvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9LmAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcztcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgQ29kZXhMb2dpblN0YXR1cywgZ2V0Q29kZXhMb2dpblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkF1dGhTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IEJyYWluUGx1Z2luKSB7fVxuXG4gIGFzeW5jIGxvZ2luKHByb3ZpZGVyOiBcIm9wZW5haVwiIHwgXCJjb2RleFwiIHwgXCJnZW1pbmlcIikge1xuICAgIGxldCB1cmwgPSBcIlwiO1xuICAgIGlmIChwcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgdXJsID0gXCJodHRwczovL3BsYXRmb3JtLm9wZW5haS5jb20vYXBpLWtleXNcIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJPcGVuIHRoZSBPcGVuQUkgQVBJIGtleSBwYWdlLCBjcmVhdGUgYSBrZXksIHRoZW4gcGFzdGUgaXQgaW50byBCcmFpbiBzZXR0aW5ncy5cIik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gXCJjb2RleFwiKSB7XG4gICAgICB1cmwgPSBcImh0dHBzOi8vb3BlbmFpLmNvbS9jb2RleC9nZXQtc3RhcnRlZC9cIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJJbnN0YWxsIHRoZSBDb2RleCBDTEksIHJ1biBgY29kZXggbG9naW5gLCB0aGVuIHJldHVybiB0byBCcmFpbiBhbmQgc2VsZWN0IHRoZSBDb2RleCBwcm92aWRlci5cIik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgdXJsID0gXCJodHRwczovL2Fpc3R1ZGlvLmdvb2dsZS5jb20vYXBwL2FwaWtleVwiO1xuICAgICAgbmV3IE5vdGljZShcIk9wZW4gdGhlIEdlbWluaSBBUEkga2V5IHBhZ2UsIHRoZW4gcGFzdGUgdGhlIGtleSBpbnRvIEJyYWluIHNldHRpbmdzLlwiKTtcbiAgICB9XG5cbiAgICB3aW5kb3cub3Blbih1cmwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29kZXhTdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gICAgcmV0dXJuIGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgVEFic3RyYWN0RmlsZSxcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgU2V0KFtcbiAgICAgIHNldHRpbmdzLmpvdXJuYWxGb2xkZXIsXG4gICAgICBzZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgIHNldHRpbmdzLnJldmlld3NGb2xkZXIsXG4gICAgICBwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5ib3hGaWxlKSxcbiAgICAgIHBhcmVudEZvbGRlcihzZXR0aW5ncy50YXNrc0ZpbGUpLFxuICAgIF0pO1xuXG4gICAgZm9yIChjb25zdCBmb2xkZXIgb2YgZm9sZGVycykge1xuICAgICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoZm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUZvbGRlcklmTWlzc2luZyhjdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIShleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZvbGRlcjogJHtjdXJyZW50fWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgaW5pdGlhbENvbnRlbnQgPSBcIlwiKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIobm9ybWFsaXplZCkpO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaW5pdGlhbENvbnRlbnQpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBleGlzdHM6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKSxcbiAgICAgIG10aW1lOiBmaWxlLnN0YXQubXRpbWUsXG4gICAgICBleGlzdHM6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgY29uc3Qgc2VwYXJhdG9yID0gY3VycmVudC5sZW5ndGggPT09IDBcbiAgICAgID8gXCJcIlxuICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXFxuXCIpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICAgICAgICA/IFwiXFxuXCJcbiAgICAgICAgICA6IFwiXFxuXFxuXCI7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAke2N1cnJlbnR9JHtzZXBhcmF0b3J9JHtub3JtYWxpemVkQ29udGVudH1gKTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBub3JtYWxpemVkQ29udGVudCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBlbnN1cmVVbmlxdWVGaWxlUGF0aChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIGNvbnN0IGRvdEluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdEluZGV4ID09PSAtMSA/IG5vcm1hbGl6ZWQgOiBub3JtYWxpemVkLnNsaWNlKDAsIGRvdEluZGV4KTtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3RJbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZShkb3RJbmRleCk7XG5cbiAgICBsZXQgY291bnRlciA9IDI7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7Y291bnRlcn0ke2V4dGVuc2lvbn1gO1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY2FuZGlkYXRlKSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgICAgY291bnRlciArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEpvdXJuYWxIZWFkZXIoZmlsZVBhdGg6IHN0cmluZywgZGF0ZUtleTogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgsIGAjICR7ZGF0ZUtleX1cXG5cXG5gKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUZvbGRlcklmTWlzc2luZyhmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGZvbGRlclBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJQYXRoKTtcbiAgICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBhcmVudEZvbGRlcihmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICBjb25zdCBpbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpO1xuICByZXR1cm4gaW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgdHJpbVRyYWlsaW5nTmV3bGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5pbnRlcmZhY2UgUHJvbXB0TW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgcGxhY2Vob2xkZXI/OiBzdHJpbmc7XG4gIHN1Ym1pdExhYmVsPzogc3RyaW5nO1xuICBtdWx0aWxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUHJvbXB0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFByb21wdE1vZGFsT3B0aW9ucykge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUHJvbXB0KCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUpIHtcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgPz8gXCJcIixcbiAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5KSkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5wdXRFbCA9IHRleHRhcmVhO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSBpbnB1dDtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwuZm9jdXMoKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQodGhpcy5vcHRpb25zLnN1Ym1pdExhYmVsID8/IFwiU3VibWl0XCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3VibWl0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gdHJpbVRyYWlsaW5nTmV3bGluZXModGhpcy5pbnB1dEVsLnZhbHVlKS50cmltKCk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZmluaXNoKHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aXRsZVRleHQ6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGJvZHlUZXh0OiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLnRpdGxlVGV4dCB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogdGhpcy5ib2R5VGV4dCxcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW50ZXJmYWNlIEZpbGVHcm91cFBpY2tlck1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBGaWxlUm93IHtcbiAgZmlsZTogVEZpbGU7XG4gIGNoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50O1xuICByb3c6IEhUTUxFbGVtZW50O1xufVxuXG5leHBvcnQgY2xhc3MgRmlsZUdyb3VwUGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogVEZpbGVbXSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIHNlYXJjaElucHV0ITogSFRNTElucHV0RWxlbWVudDtcbiAgcHJpdmF0ZSByb3dzOiBGaWxlUm93W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZpbGVzOiBURmlsZVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogRmlsZUdyb3VwUGlja2VyTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFRGaWxlW10gfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBvbmUgb3IgbW9yZSBub3RlcyB0byB1c2UgYXMgY29udGV4dC5cIixcbiAgICB9KTtcblxuICAgIHRoaXMuc2VhcmNoSW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiRmlsdGVyIG5vdGVzLi4uXCIsXG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmZpbHRlclJvd3ModGhpcy5zZWFyY2hJbnB1dC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1maWxlLWdyb3VwLWxpc3RcIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiB0aGlzLmZpbGVzKSB7XG4gICAgICBjb25zdCByb3cgPSBsaXN0LmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tZmlsZS1ncm91cC1yb3dcIixcbiAgICAgIH0pO1xuICAgICAgY29uc3QgY2hlY2tib3ggPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgdGV4dDogZmlsZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICB0aGlzLnJvd3MucHVzaCh7IGZpbGUsIGNoZWNrYm94LCByb3cgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlVzZSBTZWxlY3RlZFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMucm93c1xuICAgICAgICAuZmlsdGVyKChyb3cpID0+IHJvdy5jaGVja2JveC5jaGVja2VkKVxuICAgICAgICAubWFwKChyb3cpID0+IHJvdy5maWxlKTtcbiAgICAgIGlmICghc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG5vdGVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmluaXNoKHNlbGVjdGVkKTtcbiAgICB9KTtcblxuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyUm93cyh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcXVlcnkgPSB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gIXF1ZXJ5IHx8IHJvdy5maWxlLnBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSk7XG4gICAgICByb3cucm93LnN0eWxlLmRpc3BsYXkgPSBtYXRjaCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChmaWxlczogVEZpbGVbXSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKGZpbGVzKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEluYm94RW50cnkgfSBmcm9tIFwiLi4vc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3U2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctc2VydmljZVwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcbmltcG9ydCB7IGdldEluYm94UmV2aWV3Q29tcGxldGlvbk1lc3NhZ2UgfSBmcm9tIFwiLi4vdXRpbHMvaW5ib3gtcmV2aWV3XCI7XG5cbnR5cGUgUmV2aWV3QWN0aW9uID0gXCJrZWVwXCIgfCBcInRhc2tcIiB8IFwiam91cm5hbFwiIHwgXCJub3RlXCIgfCBcInNraXBcIjtcblxuZXhwb3J0IGNsYXNzIEluYm94UmV2aWV3TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgY3VycmVudEluZGV4ID0gMDtcbiAgcHJpdmF0ZSBrZXB0Q291bnQgPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IGhhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0LnRhZ05hbWUgPT09IFwiSU5QVVRcIiB8fCB0YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGtleVRvQWN0aW9uKGV2ZW50LmtleSk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IEluYm94RW50cnlbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJldmlld1NlcnZpY2U6IFJldmlld1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvbkFjdGlvbkNvbXBsZXRlPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJQcm9jZXNzIEluYm94XCIgfSk7XG5cbiAgICBpZiAoIXRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgdGV4dDogYEVudHJ5ICR7dGhpcy5jdXJyZW50SW5kZXggKyAxfSBvZiAke3RoaXMuZW50cmllcy5sZW5ndGh9YCxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IGVudHJ5LmhlYWRpbmcgfHwgXCJVbnRpdGxlZCBlbnRyeVwiLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBcIihlbXB0eSBlbnRyeSlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgYW4gYWN0aW9uIGZvciB0aGlzIGVudHJ5LiBTaG9ydGN1dHM6IGsga2VlcCwgdCB0YXNrLCBqIGpvdXJuYWwsIG4gbm90ZSwgcyBza2lwLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9uUm93ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJLZWVwIGluIGluYm94XCIsIFwia2VlcFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQ29udmVydCB0byB0YXNrXCIsIFwidGFza1wiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQXBwZW5kIHRvIGpvdXJuYWxcIiwgXCJqb3VybmFsXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJQcm9tb3RlIHRvIG5vdGVcIiwgXCJub3RlXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJTa2lwXCIsIFwic2tpcFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQnV0dG9uKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogUmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogYWN0aW9uID09PSBcIm5vdGVcIiA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogbGFiZWwsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlQWN0aW9uKGFjdGlvbjogUmV2aWV3QWN0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9UYXNrKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImpvdXJuYWxcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmFwcGVuZFRvSm91cm5hbChlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9Ob3RlKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImtlZXBcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmtlZXBFbnRyeShlbnRyeSk7XG4gICAgICAgIHRoaXMua2VwdENvdW50ICs9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnNraXBFbnRyeShlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLm9uQWN0aW9uQ29tcGxldGUpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9uQWN0aW9uQ29tcGxldGUobWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBwcm9jZXNzIHJldmlldyBhY3Rpb25cIik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY3VycmVudEluZGV4ICs9IDE7XG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA+PSB0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoZ2V0SW5ib3hSZXZpZXdDb21wbGV0aW9uTWVzc2FnZSh0aGlzLmtlcHRDb3VudCkpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBwcm9jZXNzIGluYm94IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBrZXlUb0FjdGlvbihrZXk6IHN0cmluZyk6IFJldmlld0FjdGlvbiB8IG51bGwge1xuICBzd2l0Y2ggKGtleS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSBcImtcIjpcbiAgICAgIHJldHVybiBcImtlZXBcIjtcbiAgICBjYXNlIFwidFwiOlxuICAgICAgcmV0dXJuIFwidGFza1wiO1xuICAgIGNhc2UgXCJqXCI6XG4gICAgICByZXR1cm4gXCJqb3VybmFsXCI7XG4gICAgY2FzZSBcIm5cIjpcbiAgICAgIHJldHVybiBcIm5vdGVcIjtcbiAgICBjYXNlIFwic1wiOlxuICAgICAgcmV0dXJuIFwic2tpcFwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKipcbiAqIENlbnRyYWxpemVkIGVycm9yIGhhbmRsaW5nIHV0aWxpdHlcbiAqIFN0YW5kYXJkaXplcyBlcnJvciByZXBvcnRpbmcgYWNyb3NzIHRoZSBwbHVnaW5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yKGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZTtcbiAgbmV3IE5vdGljZShtZXNzYWdlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvckFuZFJldGhyb3coZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiBuZXZlciB7XG4gIHNob3dFcnJvcihlcnJvciwgZGVmYXVsdE1lc3NhZ2UpO1xuICB0aHJvdyBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoZGVmYXVsdE1lc3NhZ2UpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBnZXRJbmJveFJldmlld0NvbXBsZXRpb25NZXNzYWdlKGtlcHRDb3VudDogbnVtYmVyKTogc3RyaW5nIHtcbiAgaWYgKGtlcHRDb3VudCA8PSAwKSB7XG4gICAgcmV0dXJuIFwiSW5ib3ggcmV2aWV3IGNvbXBsZXRlXCI7XG4gIH1cblxuICBpZiAoa2VwdENvdW50ID09PSAxKSB7XG4gICAgcmV0dXJuIFwiUmV2aWV3IHBhc3MgY29tcGxldGU7IDEgZW50cnkgcmVtYWlucyBpbiBpbmJveC5cIjtcbiAgfVxuXG4gIHJldHVybiBgUmV2aWV3IHBhc3MgY29tcGxldGU7ICR7a2VwdENvdW50fSBlbnRyaWVzIHJlbWFpbiBpbiBpbmJveC5gO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgUXVlc3Rpb25TY29wZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgdHlwZSB7IFF1ZXN0aW9uU2NvcGUgfTtcblxuaW50ZXJmYWNlIFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUXVlc3Rpb25TY29wZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFF1ZXN0aW9uU2NvcGUgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8UXVlc3Rpb25TY29wZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIHRoZSBzY29wZSBCcmFpbiBzaG91bGQgdXNlIGZvciB0aGlzIHJlcXVlc3QuXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBOb3RlXCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwibm90ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiU2VsZWN0ZWQgTm90ZXNcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJncm91cFwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBGb2xkZXJcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJmb2xkZXJcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkVudGlyZSBWYXVsdFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInZhdWx0XCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHNjb3BlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUoc2NvcGUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgY2xhc3MgUmV2aWV3SGlzdG9yeU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgSGlzdG9yeVwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyByZXZpZXcgbG9ncyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiT3BlbiBhIGxvZyB0byBpbnNwZWN0IGl0LCBvciByZS1vcGVuIGFuIGluYm94IGl0ZW0gaWYgaXQgd2FzIG1hcmtlZCBpbmNvcnJlY3RseS5cIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5lbnRyaWVzKSB7XG4gICAgICBjb25zdCByb3cgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb25cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGl0ZW1cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgJHtlbnRyeS50aW1lc3RhbXB9IFx1MjAyMiAke2VudHJ5LmFjdGlvbn1gLFxuICAgICAgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgcHJldmlldylcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidXR0b25zID0gcm93LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgIHRleHQ6IFwiT3BlbiBsb2dcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuTG9nKGVudHJ5LnNvdXJjZVBhdGgpO1xuICAgICAgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICB0ZXh0OiBcIlJlLW9wZW5cIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5yZW9wZW5FbnRyeShlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Mb2cocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoYWJzdHJhY3RGaWxlKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnBsdWdpbi5yZW9wZW5SZXZpZXdFbnRyeShlbnRyeSk7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlLW9wZW4gaW5ib3ggZW50cnlcIik7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0TG9jYXRpb24gfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBTeW50aGVzaXNSZXN1bHRNb2RhbE9wdGlvbnMge1xuICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0O1xuICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdDtcbiAgY2FuSW5zZXJ0OiBib29sZWFuO1xuICBvbkluc2VydDogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBvblNhdmU6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgb25BY3Rpb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIFN5bnRoZXNpc1Jlc3VsdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidXR0b25zOiBIVE1MQnV0dG9uRWxlbWVudFtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBTeW50aGVzaXNSZXN1bHRNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBgQnJhaW4gJHt0aGlzLm9wdGlvbnMucmVzdWx0LnRpdGxlfWAgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBBY3Rpb246ICR7dGhpcy5vcHRpb25zLnJlc3VsdC5hY3Rpb259YCxcbiAgICB9KTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc3VsdC5wcm9tcHRUZXh0KSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogYFByb21wdDogJHt0aGlzLm9wdGlvbnMucmVzdWx0LnByb21wdFRleHR9YCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBDb250ZXh0OiAke2Zvcm1hdENvbnRleHRMb2NhdGlvbih0aGlzLm9wdGlvbnMuY29udGV4dCl9YCxcbiAgICB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5jb250ZXh0LnRydW5jYXRlZFxuICAgICAgICA/IGBDb250ZXh0IHRydW5jYXRlZCB0byAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHt0aGlzLm9wdGlvbnMuY29udGV4dC5vcmlnaW5hbExlbmd0aH0uYFxuICAgICAgICA6IGBDb250ZXh0IGxlbmd0aDogJHt0aGlzLm9wdGlvbnMuY29udGV4dC5vcmlnaW5hbExlbmd0aH0gY2hhcmFjdGVycy5gLFxuICAgIH0pO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5yZXN1bHQuY29udGVudCxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FuSW5zZXJ0KSB7XG4gICAgICAvLyBCdXR0b25zIGFyZSByZW5kZXJlZCBiZWxvdyBhZnRlciBvcHRpb25hbCBndWlkYW5jZSB0ZXh0LlxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogXCJPcGVuIGEgbWFya2Rvd24gbm90ZSB0byBpbnNlcnQgdGhpcyBhcnRpZmFjdCB0aGVyZSwgb3Igc2F2ZSBpdCB0byBCcmFpbiBub3Rlcy5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYnV0dG9ucyA9IFtdO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jYW5JbnNlcnQpIHtcbiAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiSW5zZXJ0IGludG8gY3VycmVudCBub3RlXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJ1bkFjdGlvbigoKSA9PiB0aGlzLm9wdGlvbnMub25JbnNlcnQoKSk7XG4gICAgICB9LCB0cnVlKSk7XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25zLnB1c2goXG4gICAgICB0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIlNhdmUgdG8gQnJhaW4gbm90ZXNcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucnVuQWN0aW9uKCgpID0+IHRoaXMub3B0aW9ucy5vblNhdmUoKSk7XG4gICAgICB9KSxcbiAgICAgIHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiQ2xvc2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVCdXR0b24oXG4gICAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgb25DbGljazogKCkgPT4gdm9pZCxcbiAgICBjdGEgPSBmYWxzZSxcbiAgKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHBhcmVudC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IGN0YSA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dCxcbiAgICB9KTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkFjdGlvbihhY3Rpb246ICgpID0+IFByb21pc2U8c3RyaW5nPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLndvcmtpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0QnV0dG9uc0Rpc2FibGVkKHRydWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCBhY3Rpb24oKTtcbiAgICAgIGF3YWl0IHRoaXMub3B0aW9ucy5vbkFjdGlvbkNvbXBsZXRlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHVwZGF0ZSB0aGUgc3ludGhlc2lzIHJlc3VsdFwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZChmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25zRGlzYWJsZWQoZGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiB0aGlzLmJ1dHRvbnMpIHtcbiAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLXRlbXBsYXRlXCI7XG5pbXBvcnQgdHlwZSB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCB0eXBlIHsgU3ludGhlc2lzVGVtcGxhdGUgfTtcblxuaW50ZXJmYWNlIFRlbXBsYXRlUGlja2VyT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBUZW1wbGF0ZVBpY2tlck9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBob3cgQnJhaW4gc2hvdWxkIHN5bnRoZXNpemUgdGhpcyBjb250ZXh0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwic3VtbWFyaXplXCIpKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInN1bW1hcml6ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LXRhc2tzXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3QtdGFza3NcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1kZWNpc2lvbnNcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC1kZWNpc2lvbnNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcInJld3JpdGUtY2xlYW4tbm90ZVwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJyZXdyaXRlLWNsZWFuLW5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHRlbXBsYXRlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIEl0ZW1WaWV3LCBOb3RpY2UsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuaW50ZXJmYWNlIEFwcFdpdGhTZXR0aW5ncyBleHRlbmRzIEFwcCB7XG4gIHNldHRpbmc6IHtcbiAgICBvcGVuKCk6IHZvaWQ7XG4gICAgb3BlblRhYkJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQ7XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSByZXN1bHRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGluYm94Q291bnRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHRhc2tDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmV2aWV3SGlzdG9yeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgYWlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGlzTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGNvbGxhcHNlZFNlY3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBCUkFJTl9WSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIkJyYWluXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW5cIjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tc2lkZWJhclwiKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDYXB0dXJlIGlkZWFzLCBzeW50aGVzaXplIGV4cGxpY2l0IGNvbnRleHQsIGFuZCBzYXZlIGR1cmFibGUgbWFya2Rvd24gYXJ0aWZhY3RzLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkQ29sbGFwc2VkU3RhdGUoKTtcbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVBc2tTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVSZXZpZXdTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlU3RhdHVzU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0U2VjdGlvbigpO1xuICAgIHRoaXMucmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBzZXRMYXN0UmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMucmVzdWx0RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIHNldExhc3RTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IFtpbmJveENvdW50LCB0YXNrQ291bnQsIHJldmlld0NvdW50XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMucGx1Z2luLmdldEluYm94Q291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldE9wZW5UYXNrQ291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldFJldmlld0hpc3RvcnlDb3VudCgpLFxuICAgIF0pO1xuICAgIGlmICh0aGlzLmluYm94Q291bnRFbCkge1xuICAgICAgdGhpcy5pbmJveENvdW50RWwuc2V0VGV4dChgJHtpbmJveENvdW50fSB1bnJldmlld2VkIGVudHJpZXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudGFza0NvdW50RWwpIHtcbiAgICAgIHRoaXMudGFza0NvdW50RWwuc2V0VGV4dChgJHt0YXNrQ291bnR9IG9wZW4gdGFza3NgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmV2aWV3SGlzdG9yeUVsKSB7XG4gICAgICB0aGlzLnJldmlld0hpc3RvcnlFbC5zZXRUZXh0KGBSZXZpZXcgaGlzdG9yeTogJHtyZXZpZXdDb3VudH0gZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5haVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLmFpU3RhdHVzRWwuZW1wdHkoKTtcbiAgICAgIGNvbnN0IHN0YXR1c1RleHQgPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRBaVN0YXR1c1RleHQoKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQUk6ICR7c3RhdHVzVGV4dH0gYCB9KTtcblxuICAgICAgY29uc3QgaXNDb25uZWN0ZWQgPSBzdGF0dXNUZXh0LmluY2x1ZGVzKFwiY29uZmlndXJlZFwiKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICAgIHRleHQ6IGlzQ29ubmVjdGVkID8gXCJNYW5hZ2VcIiA6IFwiQ29ubmVjdFwiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHAgYXMgQXBwV2l0aFNldHRpbmdzO1xuICAgICAgICBhcHAuc2V0dGluZy5vcGVuKCk7XG4gICAgICAgIGFwcC5zZXR0aW5nLm9wZW5UYWJCeUlkKHRoaXMucGx1Z2luLm1hbmlmZXN0LmlkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdW1tYXJ5U3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuc3VtbWFyeVN0YXR1c0VsLnNldFRleHQodGhpcy5wbHVnaW4uZ2V0TGFzdFN1bW1hcnlMYWJlbCgpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldExvYWRpbmcobG9hZGluZzogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuaXNMb2FkaW5nID0gbG9hZGluZztcbiAgICBjb25zdCBidXR0b25zID0gQXJyYXkuZnJvbSh0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uLmJyYWluLWJ1dHRvblwiKSk7XG4gICAgZm9yIChjb25zdCBidXR0b24gb2YgYnV0dG9ucykge1xuICAgICAgKGJ1dHRvbiBhcyBIVE1MQnV0dG9uRWxlbWVudCkuZGlzYWJsZWQgPSBsb2FkaW5nO1xuICAgIH1cbiAgICBpZiAodGhpcy5pbnB1dEVsKSB7XG4gICAgICB0aGlzLmlucHV0RWwuZGlzYWJsZWQgPSBsb2FkaW5nO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpOiB2b2lkIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZG9ubHkgaGFuZGxlS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4ge1xuICAgIGlmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuYWx0S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAodGFyZ2V0ICYmICh0YXJnZXQudGFnTmFtZSA9PT0gXCJJTlBVVFwiIHx8IHRhcmdldC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3dpdGNoIChldmVudC5rZXkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVBc05vdGUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwidFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzVGFzaygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJqXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQXNKb3VybmFsKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICAgICAgbmV3IE5vdGljZShcIkNhcHR1cmUgY2xlYXJlZFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9O1xuXG4gIHByaXZhdGUgdG9nZ2xlU2VjdGlvbihzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhzZWN0aW9uSWQpKSB7XG4gICAgICB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmRlbGV0ZShzZWN0aW9uSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmFkZChzZWN0aW9uSWQpO1xuICAgIH1cbiAgICB0aGlzLnNhdmVDb2xsYXBzZWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkQ29sbGFwc2VkU3RhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucyA9IG5ldyBTZXQodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZUNvbGxhcHNlZFN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyA9IEFycmF5LmZyb20odGhpcy5jb2xsYXBzZWRTZWN0aW9ucyk7XG4gICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIGNvbnRlbnRDcmVhdG9yOiAoY29udGFpbmVyOiBIVE1MRWxlbWVudCkgPT4gdm9pZCxcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaGVhZGVyID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zZWN0aW9uLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IHRvZ2dsZUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY29sbGFwc2UtdG9nZ2xlXCIsXG4gICAgICB0ZXh0OiB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBcIlx1MjVCNlwiIDogXCJcdTI1QkNcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgXCJhcmlhLWxhYmVsXCI6IHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IGBFeHBhbmQgJHt0aXRsZX1gIDogYENvbGxhcHNlICR7dGl0bGV9YCxcbiAgICAgICAgXCJhcmlhLWV4cGFuZGVkXCI6ICghdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpKS50b1N0cmluZygpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IHRpdGxlIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBkZXNjcmlwdGlvbiB9KTtcblxuICAgIHRvZ2dsZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50b2dnbGVTZWN0aW9uKGlkKTtcbiAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcihcIi5icmFpbi1zZWN0aW9uLWNvbnRlbnRcIik7XG4gICAgICBpZiAoY29udGVudEVsKSB7XG4gICAgICAgIGNvbnRlbnRFbC50b2dnbGVBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgICAgIHRvZ2dsZUJ0bi5zZXRUZXh0KHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IFwiXHUyNUI2XCIgOiBcIlx1MjVCQ1wiKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gYEV4cGFuZCAke3RpdGxlfWAgOiBgQ29sbGFwc2UgJHt0aXRsZX1gKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgKCF0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkpLnRvU3RyaW5nKCkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgY29udGVudCA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb24tY29udGVudFwiLFxuICAgICAgYXR0cjogdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8geyBoaWRkZW46IFwidHJ1ZVwiIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gICAgY29udGVudENyZWF0b3IoY29udGVudCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJjYXB0dXJlXCIsXG4gICAgICBcIlF1aWNrIENhcHR1cmVcIixcbiAgICAgIFwiQ2FwdHVyZSByb3VnaCBpbnB1dCBpbnRvIHRoZSB2YXVsdCBiZWZvcmUgcmV2aWV3IGFuZCBzeW50aGVzaXMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIHRoaXMuaW5wdXRFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tY2FwdHVyZS1pbnB1dFwiLFxuICAgICAgICAgIGF0dHI6IHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIlR5cGUgYSBub3RlLCB0YXNrLCBvciBqb3VybmFsIGVudHJ5Li4uXCIsXG4gICAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2FwdHVyZSBOb3RlIChuKVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNOb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDYXB0dXJlIFRhc2sgKHQpXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc1Rhc2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNhcHR1cmUgSm91cm5hbCAoailcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzSm91cm5hbCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2xlYXIgKGMpXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQ2FwdHVyZSBjbGVhcmVkXCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3ludGhlc2lzU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwic3ludGhlc2lzXCIsXG4gICAgICBcIlN5bnRoZXNpemVcIixcbiAgICAgIFwiVHVybiBleHBsaWNpdCBjb250ZXh0IGludG8gc3VtbWFyaWVzLCBjbGVhbiBub3RlcywgdGFza3MsIGFuZCBicmllZnMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgICAgdGV4dDogXCJTdW1tYXJpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJTeW50aGVzaXplIEN1cnJlbnQgTm90ZS4uLlwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0U2VsZWN0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJEcmFmdCBCcmllZiBGcm9tIEZvbGRlclwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDbGVhbiBOb3RlIEZyb20gUmVjZW50IEZpbGVzXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hc2tBYm91dFJlY2VudEZpbGVzKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiU3ludGhlc2l6ZSBOb3Rlcy4uLlwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc3ludGhlc2l6ZU5vdGVzKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQXNrU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwiYXNrXCIsXG4gICAgICBcIkFzayBCcmFpblwiLFxuICAgICAgXCJBc2sgYSBxdWVzdGlvbiBhYm91dCB0aGUgY3VycmVudCBub3RlLCBhIHNlbGVjdGVkIGdyb3VwLCBhIGZvbGRlciwgb3IgdGhlIHdob2xlIHZhdWx0LlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICAgIHRleHQ6IFwiQXNrIFF1ZXN0aW9uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkFib3V0IEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudEZvbGRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmV2aWV3U2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwicmV2aWV3XCIsXG4gICAgICBcIlJldmlld1wiLFxuICAgICAgXCJQcm9jZXNzIGNhcHR1cmVkIGlucHV0IGFuZCBrZWVwIHRoZSBkYWlseSBsb29wIG1vdmluZy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgICB0ZXh0OiBcIlJldmlldyBJbmJveFwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucHJvY2Vzc0luYm94KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlVG9waWNQYWdlU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwidG9waWNcIixcbiAgICAgIFwiVG9waWMgUGFnZXNcIixcbiAgICAgIFwiQnJhaW4ncyBmbGFnc2hpcCBmbG93OiB0dXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBhIGR1cmFibGUgbWFya2Rvd24gcGFnZSB5b3UgY2FuIGtlZXAgYnVpbGRpbmcuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVBc3Npc3RTZWN0aW9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcImNhcHR1cmUtYXNzaXN0XCIsXG4gICAgICBcIkNhcHR1cmUgQXNzaXN0XCIsXG4gICAgICBcIlVzZSBBSSBvbmx5IHRvIGNsYXNzaWZ5IGZyZXNoIGNhcHR1cmUgaW50byBub3RlLCB0YXNrLCBvciBqb3VybmFsLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQXV0by1yb3V0ZSBDYXB0dXJlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLmF1dG9Sb3V0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdHVzU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwic3RhdHVzXCIsXG4gICAgICBcIlN0YXR1c1wiLFxuICAgICAgXCJDdXJyZW50IGluYm94LCB0YXNrLCBhbmQgc3ludGhlc2lzIHN0YXR1cy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgaW5ib3hSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJJbmJveDogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLmluYm94Q291bnRFbCA9IGluYm94Um93O1xuXG4gICAgICAgIGNvbnN0IHRhc2tSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJUYXNrczogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLnRhc2tDb3VudEVsID0gdGFza1JvdztcblxuICAgICAgICBjb25zdCByZXZpZXdSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc3RhdHVzLXJvd1wiIH0pO1xuICAgICAgICB0aGlzLnJldmlld0hpc3RvcnlFbCA9IHJldmlld1Jvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIlJldmlldyBoaXN0b3J5OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHJldmlld1Jvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgICAgICB0ZXh0OiBcIk9wZW5cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFpUm93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiQUk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5haVN0YXR1c0VsID0gYWlSb3c7XG5cbiAgICAgICAgY29uc3Qgc3VtbWFyeVJvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkxhc3QgYXJ0aWZhY3Q6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5zdW1tYXJ5U3RhdHVzRWwgPSBzdW1tYXJ5Um93O1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJvdXRwdXRcIixcbiAgICAgIFwiQXJ0aWZhY3RzXCIsXG4gICAgICBcIlJlY2VudCBzeW50aGVzaXMgcmVzdWx0cyBhbmQgZ2VuZXJhdGVkIGFydGlmYWN0cy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkxhc3QgUmVzdWx0XCIgfSk7XG4gICAgICAgIHRoaXMucmVzdWx0RWwgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1vdXRwdXRcIixcbiAgICAgICAgICB0ZXh0OiBcIk5vIHJlc3VsdCB5ZXQuXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IEFydGlmYWN0XCIgfSk7XG4gICAgICAgIHRoaXMuc3VtbWFyeUVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tb3V0cHV0XCIsXG4gICAgICAgICAgdGV4dDogXCJObyBhcnRpZmFjdCBnZW5lcmF0ZWQgeWV0LlwiLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzTm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVOb3RlKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzVGFzaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSBqb3VybmFsIGVudHJ5XCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXV0b1JvdXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJvdXRlVGV4dCh0ZXh0KTtcbiAgICAgIGlmICghcm91dGUpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGNvdWxkIG5vdCBjbGFzc2lmeSB0aGF0IGVudHJ5XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocm91dGUgPT09IFwibm90ZVwiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZU5vdGUodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKHJvdXRlID09PSBcInRhc2tcIikge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIGpvdXJuYWwgZW50cnlcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhdXRvLXJvdXRlIGNhcHR1cmVcIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ2FwdHVyZShcbiAgICBhY3Rpb246ICh0ZXh0OiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPixcbiAgICBmYWlsdXJlTWVzc2FnZTogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odGV4dCk7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgZmFpbHVyZU1lc3NhZ2UpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbW1hbmRzKHBsdWdpbjogQnJhaW5QbHVnaW4pOiB2b2lkIHtcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNhcHR1cmUtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcIkNhcHR1cmUgTm90ZVwiLCBcIkNhcHR1cmVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4ubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGBDYXB0dXJlZCBub3RlIGluICR7c2F2ZWQucGF0aH1gO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC10YXNrXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBUYXNrXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFwiQ2FwdHVyZSBUYXNrXCIsIFwiQ2FwdHVyZVwiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgICAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYWRkLWpvdXJuYWwtZW50cnlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIEpvdXJuYWxcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXG4gICAgICAgIFwiQ2FwdHVyZSBKb3VybmFsXCIsXG4gICAgICAgIFwiQ2FwdHVyZVwiLFxuICAgICAgICBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KHRleHQpO1xuICAgICAgICAgIHJldHVybiBgU2F2ZWQgam91cm5hbCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgICAgfSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInByb2Nlc3MtaW5ib3hcIixcbiAgICBuYW1lOiBcIkJyYWluOiBSZXZpZXcgSW5ib3hcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLnByb2Nlc3NJbmJveCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJyZXZpZXctaGlzdG9yeVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gUmV2aWV3IEhpc3RvcnlcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN1bW1hcml6ZS10b2RheVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFRvZGF5IFN1bW1hcnlcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdygxLCBcIlRvZGF5XCIpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzdW1tYXJpemUtdGhpcy13ZWVrXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgV2Vla2x5IFN1bW1hcnlcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyg3LCBcIldlZWtcIik7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC10YXNrLWZyb20tc2VsZWN0aW9uXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBUYXNrIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hZGRUYXNrRnJvbVNlbGVjdGlvbigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXRvZGF5cy1qb3VybmFsXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBUb2RheSdzIEpvdXJuYWxcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5Ub2RheXNKb3VybmFsKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4tc2lkZWJhclwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gQnJhaW4gU2lkZWJhclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblNpZGViYXIoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3ludGhlc2l6ZS1ub3Rlc1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IFN5bnRoZXNpemUgTm90ZXNcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLnN5bnRoZXNpemVOb3RlcygpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeW50aGVzaXplLWN1cnJlbnQtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IFN5bnRoZXNpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFzay1xdWVzdGlvblwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEFzayBRdWVzdGlvblwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrUXVlc3Rpb24oKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYXNrLXF1ZXN0aW9uLWN1cnJlbnQtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEFzayBRdWVzdGlvbiBBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjcmVhdGUtdG9waWMtcGFnZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFRvcGljIFBhZ2VcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNyZWF0ZVRvcGljUGFnZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjcmVhdGUtdG9waWMtcGFnZS1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb3BpYyBQYWdlIEZyb20gQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZShcIm5vdGVcIik7XG4gICAgfSxcbiAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7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O0FBNHZCSSxXQUFPLFNBQVEsVUFBSyxJQUFJLFVBQVUsb0JBQW9CLDhCQUFZLE1BQW5ELG1CQUFzRCxJQUFJO0FBQUEsRUFDM0U7QUFBQSxFQUVRLHdCQUF3QixTQUFxQztBQUNuRSxXQUFPLHlCQUF5QixPQUFPO0FBQUEsRUFDekM7QUFBQSxFQUVRLHdCQUF3QixTQUFxQztBQUNuRSxVQUFNLGNBQWMsS0FBSyx3QkFBd0IsT0FBTztBQUN4RCxXQUFPLFlBQVksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7QUFBQSxFQUM5QztBQUFBLEVBRVEscUJBQXFCLE1BQXVCO0FBQ2xELFdBQ0UsY0FBYyxNQUFNLEtBQUssU0FBUyxlQUFlLEtBQ2pELGNBQWMsTUFBTSxLQUFLLFNBQVMsYUFBYTtBQUFBLEVBRW5EO0FBQUEsRUFFUSx5QkFBaUM7QUEvd0IzQztBQWd4QkksVUFBTSxhQUFhLEtBQUssSUFBSSxVQUFVLG9CQUFvQiw4QkFBWTtBQUN0RSxVQUFNLGFBQVksMERBQVksV0FBWixtQkFBb0IsbUJBQXBCLG1CQUFvQyxXQUFwQyxZQUE4QztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaXNFbm9lbnRFcnJvciIsICJnZXROb2RlUmVxdWlyZSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
