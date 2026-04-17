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
    aiProvider: merged.aiProvider === "gemini" ? "gemini" : "openai",
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
    new import_obsidian.Setting(containerEl).setName("AI Provider").setDesc("Choose which AI provider to use for synthesis and routing.").addDropdown(
      (dropdown) => dropdown.addOptions({
        openai: "OpenAI / ChatGPT",
        gemini: "Google Gemini"
      }).setValue(this.plugin.settings.aiProvider).onChange(async (value) => {
        this.plugin.settings.aiProvider = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    if (this.plugin.settings.aiProvider === "openai") {
      const authSetting = new import_obsidian.Setting(containerEl).setName("Authentication").setDesc(this.plugin.settings.openAIApiKey ? "Connected to OpenAI" : "Not connected");
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
          (button) => button.setButtonText("Connect OpenAI").setCta().onClick(async () => {
            await this.plugin.authService.login("openai");
          })
        );
      }
      new import_obsidian.Setting(containerEl).setName("OpenAI API key").setDesc("Stored locally in plugin settings. Can be an API key or a session/access token.").addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("Enter key or token...");
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
        }).setValue(
          ["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview", "gpt-3.5-turbo"].includes(
            this.plugin.settings.openAIModel
          ) ? this.plugin.settings.openAIModel : "custom"
        ).onChange(async (value) => {
          if (value !== "custom") {
            this.plugin.settings.openAIModel = value;
            await this.plugin.saveSettings();
            this.display();
          }
        });
      }).addText((text) => {
        const isCustom = !["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview", "gpt-3.5-turbo"].includes(
          this.plugin.settings.openAIModel
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
      new import_obsidian.Setting(containerEl).setName("OpenAI base URL").setDesc("Override the default OpenAI endpoint for custom proxies or local LLMs.").addText(
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
    } else if (this.plugin.settings.aiProvider === "gemini") {
      const authSetting = new import_obsidian.Setting(containerEl).setName("Authentication").setDesc(this.plugin.settings.geminiApiKey ? "Connected to Google" : "Not connected");
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
          (button) => button.setButtonText("Connect Google").setCta().onClick(async () => {
            await this.plugin.authService.login("gemini");
          })
        );
      }
      new import_obsidian.Setting(containerEl).setName("Gemini API key").setDesc("Stored locally in plugin settings.").addText((text) => {
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
        }).setValue(
          ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.0-flash"].includes(
            this.plugin.settings.geminiModel
          ) ? this.plugin.settings.geminiModel : "custom"
        ).onChange(async (value) => {
          if (value !== "custom") {
            this.plugin.settings.geminiModel = value;
            await this.plugin.saveSettings();
            this.display();
          }
        });
      }).addText((text) => {
        const isCustom = !["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.0-flash"].includes(
          this.plugin.settings.geminiModel
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

// src/utils/path.ts
function isUnderFolder(path, folder) {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
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
function getWindowStart(lookbackDays) {
  const safeDays = Math.max(1, lookbackDays);
  const start = /* @__PURE__ */ new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));
  return start;
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
function pad2(value) {
  return String(value).padStart(2, "0");
}

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
    await this.appendReviewLogBestEffort(entry, "keep");
    const markerUpdated = await this.markInboxReviewed(entry, "keep");
    return this.appendMarkerNote("Kept inbox entry", markerUpdated);
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
    const filename = `${formatDateTimeKey(now).replace(/[: ]/g, "-")}-${slugify2(title)}.md`;
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
    return trimTitle2(first);
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
function slugify2(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "note";
}
function trimTitle2(text) {
  const trimmed = text.trim();
  if (trimmed.length <= 60) {
    return trimmed;
  }
  return `${trimmed.slice(0, 57).trimEnd()}...`;
}

// src/services/question-service.ts
var import_obsidian3 = require("obsidian");

// src/utils/question-answer-format.ts
function formatListSection(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 8).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new import_obsidian3.Notice("AI answers are enabled but OpenAI is not configured");
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
function formatListSection2(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 8).map((item) => `- ${item}`).join("\n");
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
    formatListSection2(highlights, "No recent notes found."),
    "",
    "## Tasks",
    formatTaskSection(tasks),
    "",
    "## Follow-ups",
    formatListSection2(followUps, "Nothing pending from recent notes.")
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
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new import_obsidian4.Notice("AI summaries are enabled but OpenAI is not configured");
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
    const cutoff = getWindowStart2(lookbackDays).getTime();
    const files = await this.vaultService.listMarkdownFiles();
    return files.filter((file) => !isUnderFolder(file.path, settings.summariesFolder)).filter((file) => !isUnderFolder(file.path, settings.reviewsFolder)).filter((file) => file.stat.mtime >= cutoff).sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
};
function getWindowStart2(lookbackDays) {
  const safeDays = Math.max(1, lookbackDays);
  const start = /* @__PURE__ */ new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));
  return start;
}

// src/services/synthesis-service.ts
var import_obsidian5 = require("obsidian");

// src/utils/synthesis-format.ts
function formatListSection3(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 8).map((item) => `- ${item}`).join("\n");
}
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
function safeCollapseWhitespace2(text) {
  return collapseWhitespace(text != null ? text : "");
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
      const headingText = safeCollapseWhitespace2(heading[1]);
      themes.add(headingText);
      addSummaryLine(summary, headingText);
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace2(task[2]);
      followUps.add(taskText);
      themes.add(taskText);
      addSummaryLine(summary, taskText);
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace2(bullet[2]);
      themes.add(bulletText);
      addSummaryLine(summary, bulletText);
      continue;
    }
    if (line.endsWith("?")) {
      followUps.add(safeCollapseWhitespace2(line));
    }
    addSummaryLine(summary, line);
  }
  return [
    "## Summary",
    formatListSection3(summary, "No source context found."),
    "",
    "## Key Themes",
    formatListSection3(themes, "No key themes found."),
    "",
    "## Follow-ups",
    formatListSection3(followUps, "No follow-ups identified.")
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
function formatListSection4(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 10).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace3(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
      const taskText = safeCollapseWhitespace3(task[2]);
      if (taskText) {
        tasks.add(taskText);
        followUps.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace3(bullet[2]);
      if (bulletText) {
        context.add(bulletText);
      }
      continue;
    }
    if (line.endsWith("?")) {
      const question = safeCollapseWhitespace3(line);
      if (question) {
        followUps.add(question);
      }
    }
  }
  return [
    "## Tasks",
    formatListSection4(tasks, "No tasks found."),
    "",
    "## Context",
    formatListSection4(context, "No supporting context found."),
    "",
    "## Follow-ups",
    formatListSection4(followUps, "No follow-ups identified.")
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
function formatListSection5(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 10).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace4(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
      const text = safeCollapseWhitespace4(heading[1]);
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
      const text = safeCollapseWhitespace4(task[2]);
      decisions.add(text);
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = safeCollapseWhitespace4(bullet[2]);
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
      openQuestions.add(safeCollapseWhitespace4(line));
      continue;
    }
    if (looksLikeDecision(line)) {
      decisions.add(safeCollapseWhitespace4(line));
    } else if (looksLikeRationale(line)) {
      rationale.add(safeCollapseWhitespace4(line));
    }
  }
  return [
    "## Decisions",
    formatListSection5(decisions, "No clear decisions found."),
    "",
    "## Rationale",
    formatListSection5(rationale, "No explicit rationale found."),
    "",
    "## Open Questions",
    formatListSection5(openQuestions, "No open questions identified.")
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
function formatListSection6(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 10).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace5(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
      const text = safeCollapseWhitespace5(heading[1]);
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
      const text = safeCollapseWhitespace5(task[2]);
      if (text) {
        followUps.add(text);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const text = safeCollapseWhitespace5(bullet[2]);
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
      openQuestions.add(safeCollapseWhitespace5(line));
      continue;
    }
    if (context.size < 4) {
      context.add(safeCollapseWhitespace5(line));
    }
  }
  return [
    "## Open Questions",
    formatListSection6(openQuestions, "No open questions found."),
    "",
    "## Context",
    formatListSection6(context, "No supporting context found."),
    "",
    "## Follow-ups",
    formatListSection6(followUps, "No follow-ups identified.")
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
function formatListSection7(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 8).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace6(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
      const headingText = safeCollapseWhitespace6(heading[1]);
      if (headingText) {
        overview.add(headingText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace6(bullet[2]);
      if (bulletText) {
        keyPoints.add(bulletText);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace6(task[2]);
      if (taskText) {
        keyPoints.add(taskText);
      }
      continue;
    }
    if (line.endsWith("?")) {
      const question = safeCollapseWhitespace6(line);
      if (question) {
        questions.add(question);
      }
      continue;
    }
    if (overview.size < 4) {
      overview.add(safeCollapseWhitespace6(line));
    }
  }
  return [
    "# Clean Note",
    "",
    "## Overview",
    formatListSection7(overview, "No overview found."),
    "",
    "## Key Points",
    formatListSection7(keyPoints, "No key points found."),
    "",
    "## Open Questions",
    formatListSection7(questions, "No open questions found.")
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
function formatListSection8(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 8).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace7(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
      const headingText = safeCollapseWhitespace7(heading[1]);
      if (headingText) {
        overview.add(headingText);
        scope.add(headingText);
      }
      continue;
    }
    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace7(task[2]);
      if (taskText) {
        nextSteps.add(taskText);
        goals.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace7(bullet[2]);
      if (bulletText) {
        scope.add(bulletText);
        if (looksLikeGoal(bulletText)) {
          goals.add(bulletText);
        }
      }
      continue;
    }
    if (looksLikeGoal(line)) {
      goals.add(safeCollapseWhitespace7(line));
    } else if (overview.size < 4) {
      overview.add(safeCollapseWhitespace7(line));
    }
  }
  return [
    "# Project Brief",
    "",
    "## Overview",
    formatListSection8(overview, "No overview found."),
    "",
    "## Goals",
    formatListSection8(goals, "No goals found."),
    "",
    "## Scope",
    formatListSection8(scope, "No scope found."),
    "",
    "## Next Steps",
    formatListSection8(nextSteps, "No next steps found.")
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
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new import_obsidian5.Notice("AI summaries are enabled but OpenAI is not configured");
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
function formatListSection9(items, emptyMessage) {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }
  return Array.from(items).slice(0, 8).map((item) => `- ${item}`).join("\n");
}
function safeCollapseWhitespace8(text) {
  return collapseWhitespace(text != null ? text : "");
}
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
  return formatListSection9(sources, "No explicit sources found.");
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
      const headingText = safeCollapseWhitespace8(heading[1]);
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
      const taskText = safeCollapseWhitespace8(task[2]);
      if (taskText) {
        evidence.add(taskText);
        nextSteps.add(taskText);
      }
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace8(bullet[2]);
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
      const question = safeCollapseWhitespace8(line);
      if (question) {
        openQuestions.add(question);
      }
      continue;
    }
    if (overview.size < 4) {
      overview.add(safeCollapseWhitespace8(line));
    } else if (evidence.size < 4) {
      evidence.add(safeCollapseWhitespace8(line));
    }
  }
  if (!nextSteps.size) {
    nextSteps.add("Review the source context.");
  }
  return [
    "## Overview",
    `- Topic: ${safeCollapseWhitespace8(topic)}`,
    formatListSection9(overview, "No overview found."),
    "",
    "## Evidence",
    formatListSection9(evidence, "No evidence found."),
    "",
    "## Open Questions",
    formatListSection9(openQuestions, "No open questions found."),
    "",
    "## Sources",
    formatSources(sourceLabel, sourcePath, sourcePaths),
    "",
    "## Next Steps",
    formatListSection9(nextSteps, "Review the source context.")
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
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new import_obsidian6.Notice("AI topic pages are enabled but OpenAI is not configured");
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
    if (settings.aiProvider === "gemini") {
      return this.postGeminiCompletion(settings, messages);
    }
    return this.postOpenAICompletion(settings, messages);
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

// src/services/auth-service.ts
var import_obsidian8 = require("obsidian");
var BrainAuthService = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  registerProtocol() {
    this.plugin.registerObsidianProtocol("brain-auth", async (data) => {
      const { provider, token } = data;
      if (!provider || !token) {
        new import_obsidian8.Notice("Brain: Invalid authentication data received");
        return;
      }
      if (provider === "openai") {
        this.plugin.settings.openAIApiKey = token;
        new import_obsidian8.Notice("Brain: OpenAI authenticated successfully");
      } else if (provider === "gemini") {
        this.plugin.settings.geminiApiKey = token;
        new import_obsidian8.Notice("Brain: Gemini authenticated successfully");
      }
      await this.plugin.saveSettings();
      this.plugin.app.workspace.trigger("brain:settings-updated");
    });
  }
  async login(provider) {
    let url = "";
    if (provider === "openai") {
      url = "https://platform.openai.com/api-keys";
      new import_obsidian8.Notice("Please create an API key and the plugin will guide you.");
    } else if (provider === "gemini") {
      url = "https://aistudio.google.com/app/apikey";
      new import_obsidian8.Notice("Opening Gemini API Key page...");
    }
    window.open(url);
  }
};

// src/services/vault-service.ts
var import_obsidian9 = require("obsidian");
var VaultService = class {
  constructor(app) {
    this.app = app;
  }
  async ensureKnownFolders(settings) {
    await this.ensureFolder(settings.journalFolder);
    await this.ensureFolder(settings.notesFolder);
    await this.ensureFolder(settings.summariesFolder);
    await this.ensureFolder(settings.reviewsFolder);
    await this.ensureFolder(parentFolder(settings.inboxFile));
    await this.ensureFolder(parentFolder(settings.tasksFile));
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
        await this.app.vault.createFolder(current);
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

// src/views/inbox-review-modal.ts
var InboxReviewModal = class extends import_obsidian13.Modal {
  constructor(app, entries, reviewService, onActionComplete) {
    super(app);
    this.entries = entries;
    this.reviewService = reviewService;
    this.onActionComplete = onActionComplete;
    this.currentIndex = 0;
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
        new import_obsidian13.Notice("Inbox review complete");
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
      const statusText = this.plugin.getAiStatusText();
      this.aiStatusEl.createEl("span", { text: `AI: ${statusText} ` });
      const isConnected = statusText.includes("configured");
      this.aiStatusEl.createEl("button", {
        cls: "brain-button brain-button-small",
        text: isConnected ? "Manage" : "Connect"
      }).addEventListener("click", () => {
        this.app.setting.open();
        this.app.setting.openTabById(this.plugin.manifest.id);
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
    this.authService.registerProtocol();
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
    await this.vaultService.ensureKnownFolders(this.settings);
    await this.initializeLastArtifactTimestamp();
    this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
      const view = new BrainSidebarView(leaf, this);
      this.sidebarView = view;
      return view;
    });
    registerCommands(this);
    this.addSettingTab(new BrainSettingTab(this.app, this));
  }
  onunload() {
    this.sidebarView = null;
  }
  async loadSettings() {
    var _a;
    const loaded = (_a = await this.loadData()) != null ? _a : {};
    this.settings = normalizeBrainSettings(loaded);
  }
  async saveSettings() {
    this.settings = normalizeBrainSettings(this.settings);
    await this.saveData(this.settings);
    await this.vaultService.ensureKnownFolders(this.settings);
    await this.initializeLastArtifactTimestamp();
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
    if (this.settings.aiProvider === "openai") {
      if (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim()) {
        new import_obsidian19.Notice("AI routing is enabled but OpenAI is not configured");
        return null;
      }
    } else if (this.settings.aiProvider === "gemini") {
      if (!this.settings.geminiApiKey.trim() || !this.settings.geminiModel.trim()) {
        new import_obsidian19.Notice("AI routing is enabled but Gemini is not configured");
        return null;
      }
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
    const separator = this.getAppendSeparator(editor.getValue());
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
  getAiStatusText() {
    if (!this.settings.enableAISummaries && !this.settings.enableAIRouting) {
      return "AI off";
    }
    if (this.settings.aiProvider === "openai") {
      if (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim()) {
        return "OpenAI enabled but missing key";
      }
      return "OpenAI configured";
    }
    if (this.settings.aiProvider === "gemini") {
      if (!this.settings.geminiApiKey.trim() || !this.settings.geminiModel.trim()) {
        return "Gemini enabled but missing key";
      }
      return "Gemini configured";
    }
    return "AI configured";
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
          await this.runSynthesisFlow(context, "summarize");
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
      this.stripLeadingTitle(result.content),
      ""
    ].join("\n");
  }
  buildInsertedSynthesisContent(result, context) {
    return [
      `## Brain ${result.title}`,
      ...this.buildContextBulletLines(context),
      `- Generated: ${formatDateTimeKey(/* @__PURE__ */ new Date())}`,
      "",
      this.stripLeadingTitle(result.content)
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
  async initializeLastArtifactTimestamp() {
    try {
      const files = await this.vaultService.listMarkdownFiles();
      let latest = 0;
      for (const file of files) {
        if (!this.isArtifactFile(file.path)) {
          continue;
        }
        if (file.stat.mtime > latest) {
          latest = file.stat.mtime;
        }
      }
      this.lastSummaryAt = latest > 0 ? new Date(latest) : null;
    } catch (error) {
      showError(error, "Could not initialize last artifact timestamp");
      this.lastSummaryAt = null;
    }
  }
  isArtifactFile(path) {
    return isUnderFolder(path, this.settings.notesFolder) || isUnderFolder(path, this.settings.summariesFolder);
  }
  isBrainGeneratedFile(path) {
    return isUnderFolder(path, this.settings.summariesFolder) || isUnderFolder(path, this.settings.reviewsFolder);
  }
  getAppendSeparator(text) {
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
  stripLeadingTitle(content) {
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
  getActiveSelectionText() {
    var _a, _b, _c;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian19.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy90ZXh0LnRzIiwgInNyYy91dGlscy9wYXRoLnRzIiwgInNyYy91dGlscy9kYXRlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9qb3VybmFsLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL25vdGUtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZS50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZS50cyIsICJzcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy9zdW1tYXJ5LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9jb250ZXh0LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9wcm9tcHQtbW9kYWxzLnRzIiwgInNyYy92aWV3cy9maWxlLWdyb3VwLXBpY2tlci1tb2RhbC50cyIsICJzcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsLnRzIiwgInNyYy91dGlscy9lcnJvci1oYW5kbGVyLnRzIiwgInNyYy92aWV3cy9xdWVzdGlvbi1zY29wZS1tb2RhbC50cyIsICJzcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWwudHMiLCAic3JjL3ZpZXdzL3N5bnRoZXNpcy1yZXN1bHQtbW9kYWwudHMiLCAic3JjL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbC50cyIsICJzcmMvdmlld3Mvc2lkZWJhci12aWV3LnRzIiwgInNyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQ29udGV4dFNlcnZpY2UsIFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgSm91cm5hbFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBOb3RlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQsIFN5bnRoZXNpc1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IFRvcGljUGFnZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdG9waWMtcGFnZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQXV0aFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgUHJvbXB0TW9kYWwsXG4gIFJlc3VsdE1vZGFsLFxufSBmcm9tIFwiLi9zcmMvdmlld3MvcHJvbXB0LW1vZGFsc1wiO1xuaW1wb3J0IHsgRmlsZUdyb3VwUGlja2VyTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlTW9kYWwsIFF1ZXN0aW9uU2NvcGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWxcIjtcbmltcG9ydCB7IFJldmlld0hpc3RvcnlNb2RhbCB9IGZyb20gXCIuL3NyYy92aWV3cy9yZXZpZXctaGlzdG9yeS1tb2RhbFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbFwiO1xuaW1wb3J0IHsgVGVtcGxhdGVQaWNrZXJNb2RhbCwgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQge1xuICBCUkFJTl9WSUVXX1RZUEUsXG4gIEJyYWluU2lkZWJhclZpZXcsXG59IGZyb20gXCIuL3NyYy92aWV3cy9zaWRlYmFyLXZpZXdcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4vc3JjL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN1bW1hcnlSZXN1bHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0U291cmNlTGluZXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi9zcmMvdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gXCIuL3NyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kc1wiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJhaW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIHZhdWx0U2VydmljZSE6IFZhdWx0U2VydmljZTtcbiAgaW5ib3hTZXJ2aWNlITogSW5ib3hTZXJ2aWNlO1xuICBub3RlU2VydmljZSE6IE5vdGVTZXJ2aWNlO1xuICB0YXNrU2VydmljZSE6IFRhc2tTZXJ2aWNlO1xuICBqb3VybmFsU2VydmljZSE6IEpvdXJuYWxTZXJ2aWNlO1xuICByZXZpZXdMb2dTZXJ2aWNlITogUmV2aWV3TG9nU2VydmljZTtcbiAgcmV2aWV3U2VydmljZSE6IFJldmlld1NlcnZpY2U7XG4gIHF1ZXN0aW9uU2VydmljZSE6IFF1ZXN0aW9uU2VydmljZTtcbiAgY29udGV4dFNlcnZpY2UhOiBDb250ZXh0U2VydmljZTtcbiAgc3ludGhlc2lzU2VydmljZSE6IFN5bnRoZXNpc1NlcnZpY2U7XG4gIHRvcGljUGFnZVNlcnZpY2UhOiBUb3BpY1BhZ2VTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBzdW1tYXJ5U2VydmljZSE6IFN1bW1hcnlTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGFzdFN1bW1hcnlBdDogRGF0ZSB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy52YXVsdFNlcnZpY2UgPSBuZXcgVmF1bHRTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFpU2VydmljZSA9IG5ldyBCcmFpbkFJU2VydmljZSgpO1xuICAgIHRoaXMuYXV0aFNlcnZpY2UgPSBuZXcgQnJhaW5BdXRoU2VydmljZSh0aGlzKTtcbiAgICB0aGlzLmF1dGhTZXJ2aWNlLnJlZ2lzdGVyUHJvdG9jb2woKTtcbiAgICB0aGlzLmluYm94U2VydmljZSA9IG5ldyBJbmJveFNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMubm90ZVNlcnZpY2UgPSBuZXcgTm90ZVNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMudGFza1NlcnZpY2UgPSBuZXcgVGFza1NlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuam91cm5hbFNlcnZpY2UgPSBuZXcgSm91cm5hbFNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLmNvbnRleHRTZXJ2aWNlID0gbmV3IENvbnRleHRTZXJ2aWNlKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UgPSBuZXcgUmV2aWV3TG9nU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3U2VydmljZSA9IG5ldyBSZXZpZXdTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICB0aGlzLmluYm94U2VydmljZSxcbiAgICAgIHRoaXMudGFza1NlcnZpY2UsXG4gICAgICB0aGlzLmpvdXJuYWxTZXJ2aWNlLFxuICAgICAgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucXVlc3Rpb25TZXJ2aWNlID0gbmV3IFF1ZXN0aW9uU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3VtbWFyeVNlcnZpY2UgPSBuZXcgU3VtbWFyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3ludGhlc2lzU2VydmljZSA9IG5ldyBTeW50aGVzaXNTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlID0gbmV3IFRvcGljUGFnZVNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUtub3duRm9sZGVycyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVMYXN0QXJ0aWZhY3RUaW1lc3RhbXAoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRoZSBzaWRlYmFyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBCUkFJTl9WSUVXX1RZUEUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGhhc09wZW5TaWRlYmFyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSkubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFJlc3VsdCh0ZXh0KTtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RTdW1tYXJ5KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQobWVzc2FnZSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgfVxuXG4gIGdldExhc3RTdW1tYXJ5TGFiZWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sYXN0U3VtbWFyeUF0ID8gZm9ybWF0RGF0ZVRpbWVLZXkodGhpcy5sYXN0U3VtbWFyeUF0KSA6IFwiTm8gYXJ0aWZhY3QgeWV0XCI7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXRoaXMuc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJBSSByb3V0aW5nIGlzIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5nZW1pbmlBcGlLZXkudHJpbSgpIHx8ICF0aGlzLnNldHRpbmdzLmdlbWluaU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgcm91dGluZyBpcyBlbmFibGVkIGJ1dCBHZW1pbmkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uucm91dGVUZXh0KHRleHQsIHRoaXMuc2V0dGluZ3MpO1xuICAgIGlmIChyb3V0ZSkge1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBBdXRvLXJvdXRlZCBhcyAke3JvdXRlfWApO1xuICAgIH1cbiAgICByZXR1cm4gcm91dGU7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnROb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKSxcbiAgICAgIFwiU3VtbWFyaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgXCJzdW1tYXJpemVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0U2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZFRleHRDb250ZXh0KCksXG4gICAgICBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgIFwiZXh0cmFjdC10YXNrc1wiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFJlY2VudEZpbGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRSZWNlbnRGaWxlc0NvbnRleHQoKSxcbiAgICAgIFwiQ2xlYW4gTm90ZSBGcm9tIFJlY2VudCBGaWxlc1wiLFxuICAgICAgXCJyZXdyaXRlLWNsZWFuLW5vdGVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgXCJEcmFmdCBCcmllZiBGcm9tIEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICBcImRyYWZ0LXByb2plY3QtYnJpZWZcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZU5vdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzY29wZSA9IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiU3ludGhlc2l6ZSBOb3Rlc1wiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyB0byBTeW50aGVzaXplXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcGxhdGUgPSBhd2FpdCB0aGlzLnBpY2tTeW50aGVzaXNUZW1wbGF0ZShcIlN5bnRoZXNpemUgTm90ZXNcIik7XG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoZXNlIG5vdGVzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoXCJub3RlXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwiZm9sZGVyXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFzayBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZSgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoZGVmYXVsdFNjb3BlPzogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0b3BpYyA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJUb3BpYyBvciBxdWVzdGlvbiB0byB0dXJuIGludG8gYSB3aWtpIHBhZ2UuLi5cIixcbiAgICAgICAgc3VibWl0TGFiZWw6IFwiQ3JlYXRlXCIsXG4gICAgICAgIG11bHRpbGluZTogdHJ1ZSxcbiAgICAgIH0pLm9wZW5Qcm9tcHQoKTtcbiAgICAgIGlmICghdG9waWMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IGRlZmF1bHRTY29wZSA/PyBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICAgICAgc2NvcGUsXG4gICAgICAgIFwiU2VsZWN0IE5vdGVzIGZvciBUb3BpYyBQYWdlXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZSh0b3BpYywgY29udGV4dCk7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgICAgcmVzdWx0Lm5vdGVUaXRsZSxcbiAgICAgICAgcmVzdWx0LmNvbnRlbnQsXG4gICAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aCxcbiAgICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIHRvcGljIHBhZ2Ugc2F2ZWQgdG8gJHtzYXZlZC5wYXRofWBcbiAgICAgICAgICA6IGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgICBuZXcgTm90aWNlKGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gKTtcblxuICAgICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICAgIGlmIChsZWFmKSB7XG4gICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoc2F2ZWQpO1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjcmVhdGUgdGhhdCB0b3BpYyBwYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyhcbiAgICBsb29rYmFja0RheXM/OiBudW1iZXIsXG4gICAgbGFiZWw/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3VtbWFyeVNlcnZpY2UuZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cywgbGFiZWwpO1xuICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShgJHtyZXN1bHQudGl0bGV9XFxuXFxuJHtyZXN1bHQuY29udGVudH1gKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWAgOiBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCBsb2NhbGx5YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IE5vdGljZShcbiAgICAgIHJlc3VsdC5wZXJzaXN0ZWRQYXRoXG4gICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBzYXZlZCB0byAke3Jlc3VsdC5wZXJzaXN0ZWRQYXRofWBcbiAgICAgICAgOiByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYFxuICAgICAgICAgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBpZiAoIXRoaXMuaGFzT3BlblNpZGViYXIoKSkge1xuICAgICAgbmV3IFJlc3VsdE1vZGFsKHRoaXMuYXBwLCBgQnJhaW4gJHtyZXN1bHQudGl0bGV9YCwgcmVzdWx0LmNvbnRlbnQpLm9wZW4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTeW50aGVzaXNSZXN1bHQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICB0aGlzLmJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgcmV0dXJuIGBTYXZlZCBhcnRpZmFjdCB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkaXRpb24gPSB0aGlzLmJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KHJlc3VsdCwgY29udGV4dCk7XG4gICAgY29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG4gICAgY29uc3QgbGFzdExpbmUgPSBlZGl0b3IubGFzdExpbmUoKTtcbiAgICBjb25zdCBsYXN0TGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsYXN0TGluZSk7XG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSB7IGxpbmU6IGxhc3RMaW5lLCBjaDogbGFzdExpbmVUZXh0Lmxlbmd0aCB9O1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IHRoaXMuZ2V0QXBwZW5kU2VwYXJhdG9yKGVkaXRvci5nZXRWYWx1ZSgpKTtcbiAgICBlZGl0b3IucmVwbGFjZVJhbmdlKGAke3NlcGFyYXRvcn0ke2FkZGl0aW9ufVxcbmAsIGVuZFBvc2l0aW9uKTtcbiAgICByZXR1cm4gYEluc2VydGVkIHN5bnRoZXNpcyBpbnRvICR7dmlldy5maWxlLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVGcm9tTW9kYWwoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBzdWJtaXRMYWJlbDogc3RyaW5nLFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIG11bHRpbGluZSA9IGZhbHNlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgdGl0bGUsXG4gICAgICBwbGFjZWhvbGRlcjogbXVsdGlsaW5lXG4gICAgICAgID8gXCJXcml0ZSB5b3VyIGVudHJ5IGhlcmUuLi5cIlxuICAgICAgICA6IFwiVHlwZSBoZXJlLi4uXCIsXG4gICAgICBzdWJtaXRMYWJlbCxcbiAgICAgIG11bHRpbGluZSxcbiAgICB9KS5vcGVuUHJvbXB0KCk7XG5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHZhbHVlKTtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJCcmFpbiBjb3VsZCBub3Qgc2F2ZSB0aGF0IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVOb3RlKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgcmV0dXJuIGBDYXB0dXJlZCBub3RlIGluICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZVRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlSm91cm5hbCh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzSW5ib3goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5nZXRSZWNlbnRJbmJveEVudHJpZXMoKTtcbiAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBuZXcgSW5ib3hSZXZpZXdNb2RhbCh0aGlzLmFwcCwgZW50cmllcywgdGhpcy5yZXZpZXdTZXJ2aWNlLCBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgfSkub3BlbigpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgTG9hZGVkICR7ZW50cmllcy5sZW5ndGh9IGluYm94IGVudHJpZXNgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICB9XG5cbiAgYXN5bmMgb3BlblJldmlld0hpc3RvcnkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyaWVzKCk7XG4gICAgbmV3IFJldmlld0hpc3RvcnlNb2RhbCh0aGlzLmFwcCwgZW50cmllcywgdGhpcykub3BlbigpO1xuICB9XG5cbiAgYXN5bmMgYWRkVGFza0Zyb21TZWxlY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gdGhpcy5nZXRBY3RpdmVTZWxlY3Rpb25UZXh0KCk7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2soc2VsZWN0aW9uKTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgU2F2ZWQgdGFzayBmcm9tIHNlbGVjdGlvbiB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBOb3RpY2UoXCJObyBzZWxlY3Rpb24gZm91bmQuIE9wZW5pbmcgdGFzayBlbnRyeSBtb2RhbC5cIik7XG4gICAgYXdhaXQgdGhpcy5jYXB0dXJlRnJvbU1vZGFsKFwiQWRkIFRhc2tcIiwgXCJTYXZlIHRhc2tcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgb3BlblRvZGF5c0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuZW5zdXJlSm91cm5hbEZpbGUoKTtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRvZGF5J3Mgam91cm5hbFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgT3BlbmVkICR7ZmlsZS5wYXRofWA7XG4gICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBnZXRJbmJveENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLmdldFVucmV2aWV3ZWRDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmdldE9wZW5UYXNrQ291bnQoKTtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0hpc3RvcnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cnlDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuUmV2aWV3RW50cnkoZW50cnk6IHtcbiAgICBoZWFkaW5nOiBzdHJpbmc7XG4gICAgcHJldmlldzogc3RyaW5nO1xuICAgIHNpZ25hdHVyZTogc3RyaW5nO1xuICAgIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5yZW9wZW5Gcm9tUmV2aWV3TG9nKHtcbiAgICAgIGFjdGlvbjogXCJyZW9wZW5cIixcbiAgICAgIHRpbWVzdGFtcDogXCJcIixcbiAgICAgIHNvdXJjZVBhdGg6IFwiXCIsXG4gICAgICBmaWxlTXRpbWU6IERhdGUubm93KCksXG4gICAgICBlbnRyeUluZGV4OiAwLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0QWlTdGF0dXNUZXh0KCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzICYmICF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIFwiQUkgb2ZmXCI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXRoaXMuc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgICAgIHJldHVybiBcIk9wZW5BSSBlbmFibGVkIGJ1dCBtaXNzaW5nIGtleVwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFwiT3BlbkFJIGNvbmZpZ3VyZWRcIjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5nZW1pbmlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgcmV0dXJuIFwiR2VtaW5pIGVuYWJsZWQgYnV0IG1pc3Npbmcga2V5XCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gXCJHZW1pbmkgY29uZmlndXJlZFwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIkFJIGNvbmZpZ3VyZWRcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgICBkZWZhdWx0VGVtcGxhdGU/OiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBkZWZhdWx0VGVtcGxhdGUgPz8gKGF3YWl0IHRoaXMucGlja1N5bnRoZXNpc1RlbXBsYXRlKG1vZGFsVGl0bGUpKTtcbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1blN5bnRoZXNpc0Zsb3coY29udGV4dCwgdGVtcGxhdGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHN5bnRoZXNpemUgdGhhdCBjb250ZXh0XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25Gb3JTY29wZShzY29wZTogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZm9sZGVyXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCksXG4gICAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEVudGlyZSBWYXVsdFwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZ3JvdXBcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkFib3V0U2VsZWN0ZWRHcm91cCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgIHNjb3BlOiBRdWVzdGlvblNjb3BlLFxuICAgIGdyb3VwUGlja2VyVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0IHwgbnVsbD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpO1xuICAgICAgY2FzZSBcImdyb3VwXCI6IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXMoZ3JvdXBQaWNrZXJUaXRsZSk7XG4gICAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKFwiU2VsZWN0IE5vdGVzXCIpO1xuICAgICAgaWYgKCFmaWxlcyB8fCAhZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKSxcbiAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgU2VsZWN0ZWQgTm90ZXNcIixcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc2VsZWN0IG5vdGVzIGZvciBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXModGl0bGU6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0XG4gICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhdGhpcy5pc0JyYWluR2VuZXJhdGVkRmlsZShmaWxlLnBhdGgpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcblxuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbWFya2Rvd24gZmlsZXMgZm91bmRcIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgbmV3IEZpbGVHcm91cFBpY2tlck1vZGFsKHRoaXMuYXBwLCBmaWxlcywge1xuICAgICAgdGl0bGUsXG4gICAgfSkub3BlblBpY2tlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IG1vZGFsVGl0bGUsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhIHF1ZXN0aW9uIGFib3V0IHRoaXMgY29udGV4dC4uLlwiLFxuICAgICAgICBzdWJtaXRMYWJlbDogXCJBc2tcIixcbiAgICAgICAgbXVsdGlsaW5lOiB0cnVlLFxuICAgICAgfSkub3BlblByb21wdCgpO1xuICAgICAgaWYgKCFxdWVzdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlc3Rpb25TZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0KTtcbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIGFuc3dlciBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXG4gICAgICAgICAgOiBgTG9jYWwgYW5zd2VyIGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWAsXG4gICAgICApO1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBjb250ZXh0LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGNhbkluc2VydDogdGhpcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uU2F2ZTogYXN5bmMgKCkgPT4gdGhpcy5zYXZlU3ludGhlc2lzUmVzdWx0KHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uQWN0aW9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIFwic3VtbWFyaXplXCIpO1xuICAgICAgICB9LFxuICAgICAgfSkub3BlbigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFuc3dlciB0aGF0IHF1ZXN0aW9uXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuU3ludGhlc2lzRmxvdyhcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zeW50aGVzaXNTZXJ2aWNlLnJ1bih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgID8gYEFJICR7cmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCl9IGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBcbiAgICAgICAgOiBgTG9jYWwgJHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX0gZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IFN5bnRoZXNpc1Jlc3VsdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBjb250ZXh0LFxuICAgICAgcmVzdWx0LFxuICAgICAgY2FuSW5zZXJ0OiB0aGlzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICBvblNhdmU6IGFzeW5jICgpID0+IHRoaXMuc2F2ZVN5bnRoZXNpc1Jlc3VsdChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgb25BY3Rpb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICB9LFxuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGlja1N5bnRoZXNpc1RlbXBsYXRlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBUZW1wbGF0ZVBpY2tlck1vZGFsKHRoaXMuYXBwLCB7IHRpdGxlIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRTeW50aGVzaXNOb3RlQ29udGVudChcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBbXG4gICAgICBgQWN0aW9uOiAke3Jlc3VsdC5hY3Rpb259YCxcbiAgICAgIGBHZW5lcmF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YCxcbiAgICAgIGBDb250ZXh0IGxlbmd0aDogJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofSBjaGFyYWN0ZXJzLmAsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5zdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRJbnNlcnRlZFN5bnRoZXNpc0NvbnRlbnQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW1xuICAgICAgYCMjIEJyYWluICR7cmVzdWx0LnRpdGxlfWAsXG4gICAgICAuLi50aGlzLmJ1aWxkQ29udGV4dEJ1bGxldExpbmVzKGNvbnRleHQpLFxuICAgICAgYC0gR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5zdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNBY3RpdmVNYXJrZG93bk5vdGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KT8uZmlsZSk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIGZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0KTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0QnVsbGV0TGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBzb3VyY2VMaW5lcyA9IHRoaXMuYnVpbGRDb250ZXh0U291cmNlTGluZXMoY29udGV4dCk7XG4gICAgcmV0dXJuIHNvdXJjZUxpbmVzLm1hcCgobGluZSkgPT4gYC0gJHtsaW5lfWApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgICBsZXQgbGF0ZXN0ID0gMDtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICBpZiAoIXRoaXMuaXNBcnRpZmFjdEZpbGUoZmlsZS5wYXRoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlLnN0YXQubXRpbWUgPiBsYXRlc3QpIHtcbiAgICAgICAgICBsYXRlc3QgPSBmaWxlLnN0YXQubXRpbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IGxhdGVzdCA+IDAgPyBuZXcgRGF0ZShsYXRlc3QpIDogbnVsbDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIGxhc3QgYXJ0aWZhY3QgdGltZXN0YW1wXCIpO1xuICAgICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzQXJ0aWZhY3RGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Mubm90ZXNGb2xkZXIpIHx8XG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGlzQnJhaW5HZW5lcmF0ZWRGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSB8fFxuICAgICAgaXNVbmRlckZvbGRlcihwYXRoLCB0aGlzLnNldHRpbmdzLnJldmlld3NGb2xkZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBwZW5kU2VwYXJhdG9yKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXFxuXCIpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRleHQuZW5kc1dpdGgoXCJcXG5cIikpIHtcbiAgICAgIHJldHVybiBcIlxcblwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJcXG5cXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgc3RyaXBMZWFkaW5nVGl0bGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuICAgIGlmICghbGluZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBpZiAoIS9eI1xccysvLnRlc3QobGluZXNbMF0pKSB7XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtYWluaW5nID0gbGluZXMuc2xpY2UoMSk7XG4gICAgd2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwICYmICFyZW1haW5pbmdbMF0udHJpbSgpKSB7XG4gICAgICByZW1haW5pbmcuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlbWFpbmluZy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuICBvcGVuQUlCYXNlVXJsOiBzdHJpbmc7XG5cbiAgYWlQcm92aWRlcjogXCJvcGVuYWlcIiB8IFwiZ2VtaW5pXCI7XG4gIGdlbWluaUFwaUtleTogc3RyaW5nO1xuICBnZW1pbmlNb2RlbDogc3RyaW5nO1xuXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IG51bWJlcjtcbiAgc3VtbWFyeU1heENoYXJzOiBudW1iZXI7XG5cbiAgcGVyc2lzdFN1bW1hcmllczogYm9vbGVhbjtcblxuICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CUkFJTl9TRVRUSU5HUzogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgaW5ib3hGaWxlOiBcIkJyYWluL2luYm94Lm1kXCIsXG4gIHRhc2tzRmlsZTogXCJCcmFpbi90YXNrcy5tZFwiLFxuICBqb3VybmFsRm9sZGVyOiBcIkJyYWluL2pvdXJuYWxcIixcbiAgbm90ZXNGb2xkZXI6IFwiQnJhaW4vbm90ZXNcIixcbiAgc3VtbWFyaWVzRm9sZGVyOiBcIkJyYWluL3N1bW1hcmllc1wiLFxuICByZXZpZXdzRm9sZGVyOiBcIkJyYWluL3Jldmlld3NcIixcbiAgZW5hYmxlQUlTdW1tYXJpZXM6IGZhbHNlLFxuICBlbmFibGVBSVJvdXRpbmc6IGZhbHNlLFxuICBvcGVuQUlBcGlLZXk6IFwiXCIsXG4gIG9wZW5BSU1vZGVsOiBcImdwdC00by1taW5pXCIsXG4gIG9wZW5BSUJhc2VVcmw6IFwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zXCIsXG4gIGFpUHJvdmlkZXI6IFwib3BlbmFpXCIsXG4gIGdlbWluaUFwaUtleTogXCJcIixcbiAgZ2VtaW5pTW9kZWw6IFwiZ2VtaW5pLTEuNS1mbGFzaFwiLFxuICBzdW1tYXJ5TG9va2JhY2tEYXlzOiA3LFxuICBzdW1tYXJ5TWF4Q2hhcnM6IDEyMDAwLFxuICBwZXJzaXN0U3VtbWFyaWVzOiB0cnVlLFxuICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IFtdLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MoXG4gIGlucHV0OiBQYXJ0aWFsPEJyYWluUGx1Z2luU2V0dGluZ3M+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgY29uc3QgbWVyZ2VkOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICAgIC4uLkRFRkFVTFRfQlJBSU5fU0VUVElOR1MsXG4gICAgLi4uaW5wdXQsXG4gIH0gYXMgQnJhaW5QbHVnaW5TZXR0aW5ncztcblxuICByZXR1cm4ge1xuICAgIGluYm94RmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKG1lcmdlZC5pbmJveEZpbGUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5ib3hGaWxlKSxcbiAgICB0YXNrc0ZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChtZXJnZWQudGFza3NGaWxlLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnRhc2tzRmlsZSksXG4gICAgam91cm5hbEZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLmpvdXJuYWxGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmpvdXJuYWxGb2xkZXIsXG4gICAgKSxcbiAgICBub3Rlc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLm5vdGVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5ub3Rlc0ZvbGRlcixcbiAgICApLFxuICAgIHN1bW1hcmllc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muc3VtbWFyaWVzRm9sZGVyLFxuICAgICksXG4gICAgcmV2aWV3c0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLnJldmlld3NGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnJldmlld3NGb2xkZXIsXG4gICAgKSxcbiAgICBlbmFibGVBSVN1bW1hcmllczogQm9vbGVhbihtZXJnZWQuZW5hYmxlQUlTdW1tYXJpZXMpLFxuICAgIGVuYWJsZUFJUm91dGluZzogQm9vbGVhbihtZXJnZWQuZW5hYmxlQUlSb3V0aW5nKSxcbiAgICBvcGVuQUlBcGlLZXk6IHR5cGVvZiBtZXJnZWQub3BlbkFJQXBpS2V5ID09PSBcInN0cmluZ1wiID8gbWVyZ2VkLm9wZW5BSUFwaUtleS50cmltKCkgOiBcIlwiLFxuICAgIG9wZW5BSU1vZGVsOlxuICAgICAgdHlwZW9mIG1lcmdlZC5vcGVuQUlNb2RlbCA9PT0gXCJzdHJpbmdcIiAmJiBtZXJnZWQub3BlbkFJTW9kZWwudHJpbSgpXG4gICAgICAgID8gbWVyZ2VkLm9wZW5BSU1vZGVsLnRyaW0oKVxuICAgICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1Mub3BlbkFJTW9kZWwsXG4gICAgb3BlbkFJQmFzZVVybDpcbiAgICAgIHR5cGVvZiBtZXJnZWQub3BlbkFJQmFzZVVybCA9PT0gXCJzdHJpbmdcIiAmJiBtZXJnZWQub3BlbkFJQmFzZVVybC50cmltKClcbiAgICAgICAgPyBtZXJnZWQub3BlbkFJQmFzZVVybC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm9wZW5BSUJhc2VVcmwsXG4gICAgYWlQcm92aWRlcjogKG1lcmdlZC5haVByb3ZpZGVyID09PSBcImdlbWluaVwiID8gXCJnZW1pbmlcIiA6IFwib3BlbmFpXCIpIGFzIFwib3BlbmFpXCIgfCBcImdlbWluaVwiLFxuICAgIGdlbWluaUFwaUtleTogdHlwZW9mIG1lcmdlZC5nZW1pbmlBcGlLZXkgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQuZ2VtaW5pQXBpS2V5LnRyaW0oKSA6IFwiXCIsXG4gICAgZ2VtaW5pTW9kZWw6XG4gICAgICB0eXBlb2YgbWVyZ2VkLmdlbWluaU1vZGVsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5nZW1pbmlNb2RlbC50cmltKClcbiAgICAgICAgPyBtZXJnZWQuZ2VtaW5pTW9kZWwudHJpbSgpXG4gICAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5nZW1pbmlNb2RlbCxcbiAgICBzdW1tYXJ5TG9va2JhY2tEYXlzOiBjbGFtcEludGVnZXIobWVyZ2VkLnN1bW1hcnlMb29rYmFja0RheXMsIDEsIDM2NSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICBzdW1tYXJ5TWF4Q2hhcnM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeU1heENoYXJzLCAxMDAwLCAxMDAwMDAsIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muc3VtbWFyeU1heENoYXJzKSxcbiAgICBwZXJzaXN0U3VtbWFyaWVzOiBCb29sZWFuKG1lcmdlZC5wZXJzaXN0U3VtbWFyaWVzKSxcbiAgICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IEFycmF5LmlzQXJyYXkobWVyZ2VkLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucylcbiAgICAgID8gKG1lcmdlZC5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMgYXMgc3RyaW5nW10pLmZpbHRlcigocykgPT4gdHlwZW9mIHMgPT09IFwic3RyaW5nXCIpXG4gICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1MuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGl2ZVBhdGgodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBjbGFtcEludGVnZXIoXG4gIHZhbHVlOiB1bmtub3duLFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXIsXG4gIGZhbGxiYWNrOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBwYXJzZWQpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogQnJhaW5QbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cbiAgICAvLyBMaXN0ZW4gZm9yIHNldHRpbmcgdXBkYXRlcyAoZS5nLiwgZnJvbSBhdXRoIGZsb3cpXG4gICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vbihcImJyYWluOnNldHRpbmdzLXVwZGF0ZWRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgfSk7XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpbiBTZXR0aW5nc1wiIH0pO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3RvcmFnZVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluYm94IGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB1c2VkIGZvciBxdWljayBub3RlIGNhcHR1cmUuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmJveEZpbGUsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmJveEZpbGUgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkluYm94IGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJUYXNrcyBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgdGFzayBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJUYXNrcyBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSm91cm5hbCBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIGNvbnRhaW5pbmcgZGFpbHkgam91cm5hbCBmaWxlcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmpvdXJuYWxGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJKb3VybmFsIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcHJvbW90ZWQgbm90ZXMgYW5kIGdlbmVyYXRlZCBtYXJrZG93biBhcnRpZmFjdHMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJOb3RlcyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTdW1tYXJpZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIGZvciBwZXJzaXN0ZWQgc3VtbWFyaWVzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJTdW1tYXJpZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmV2aWV3cyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgdG8gc3RvcmUgaW5ib3ggcmV2aWV3IGxvZ3MuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXZpZXdzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV2aWV3c0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiUmV2aWV3cyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFJXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQUkgUHJvdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiQ2hvb3NlIHdoaWNoIEFJIHByb3ZpZGVyIHRvIHVzZSBmb3Igc3ludGhlc2lzIGFuZCByb3V0aW5nLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT5cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICBvcGVuYWk6IFwiT3BlbkFJIC8gQ2hhdEdQVFwiLFxuICAgICAgICAgICAgZ2VtaW5pOiBcIkdvb2dsZSBHZW1pbmlcIixcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPSB2YWx1ZSBhcyBcIm9wZW5haVwiIHwgXCJnZW1pbmlcIjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7IC8vIFJlZnJlc2ggVUkgdG8gc2hvdyByZWxldmFudCBmaWVsZHNcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgY29uc3QgYXV0aFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJBdXRoZW50aWNhdGlvblwiKVxuICAgICAgICAuc2V0RGVzYyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPyBcIkNvbm5lY3RlZCB0byBPcGVuQUlcIiA6IFwiTm90IGNvbm5lY3RlZFwiKTtcblxuICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSkge1xuICAgICAgICBhdXRoU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiRGlzY29ubmVjdFwiKVxuICAgICAgICAgICAgLnNldFdhcm5pbmcoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPSBcIlwiO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJDb25uZWN0IE9wZW5BSVwiKVxuICAgICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKFwib3BlbmFpXCIpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIk9wZW5BSSBBUEkga2V5XCIpXG4gICAgICAgIC5zZXREZXNjKFwiU3RvcmVkIGxvY2FsbHkgaW4gcGx1Z2luIHNldHRpbmdzLiBDYW4gYmUgYW4gQVBJIGtleSBvciBhIHNlc3Npb24vYWNjZXNzIHRva2VuLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciBrZXkgb3IgdG9rZW4uLi5cIik7XG4gICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5LFxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIG1vZGVsXCIpXG4gICAgICAgIC5zZXREZXNjKFwiU2VsZWN0IGEgbW9kZWwgb3IgZW50ZXIgYSBjdXN0b20gb25lLlwiKVxuICAgICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAgIC5hZGRPcHRpb25zKHtcbiAgICAgICAgICAgICAgXCJncHQtNG8tbWluaVwiOiBcIkdQVC00byBNaW5pIChEZWZhdWx0KVwiLFxuICAgICAgICAgICAgICBcImdwdC00b1wiOiBcIkdQVC00byAoUG93ZXJmdWwpXCIsXG4gICAgICAgICAgICAgIFwibzEtbWluaVwiOiBcIm8xIE1pbmkgKFJlYXNvbmluZylcIixcbiAgICAgICAgICAgICAgXCJvMS1wcmV2aWV3XCI6IFwibzEgUHJldmlldyAoU3Ryb25nIFJlYXNvbmluZylcIixcbiAgICAgICAgICAgICAgXCJncHQtMy41LXR1cmJvXCI6IFwiR1BULTMuNSBUdXJibyAoTGVnYWN5KVwiLFxuICAgICAgICAgICAgICBjdXN0b206IFwiQ3VzdG9tIE1vZGVsLi4uXCIsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgICBbXCJncHQtNG8tbWluaVwiLCBcImdwdC00b1wiLCBcIm8xLW1pbmlcIiwgXCJvMS1wcmV2aWV3XCIsIFwiZ3B0LTMuNS10dXJib1wiXS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCxcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgID8gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWxcbiAgICAgICAgICAgICAgICA6IFwiY3VzdG9tXCIsXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gXCJjdXN0b21cIikge1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQ3VzdG9tID0gIVtcImdwdC00by1taW5pXCIsIFwiZ3B0LTRvXCIsIFwibzEtbWluaVwiLCBcIm8xLXByZXZpZXdcIiwgXCJncHQtMy41LXR1cmJvXCJdLmluY2x1ZGVzKFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoaXNDdXN0b20pIHtcbiAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciBjdXN0b20gbW9kZWwgbmFtZS4uLlwiKTtcbiAgICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKHRleHQsIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0ZXh0LmlucHV0RWwuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIGJhc2UgVVJMXCIpXG4gICAgICAgIC5zZXREZXNjKFwiT3ZlcnJpZGUgdGhlIGRlZmF1bHQgT3BlbkFJIGVuZHBvaW50IGZvciBjdXN0b20gcHJveGllcyBvciBsb2NhbCBMTE1zLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlCYXNlVXJsLFxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUJhc2VVcmwgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICYmICF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiT3BlbkFJIGJhc2UgVVJMIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgICBjb25zdCBhdXRoU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkF1dGhlbnRpY2F0aW9uXCIpXG4gICAgICAgIC5zZXREZXNjKHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSA/IFwiQ29ubmVjdGVkIHRvIEdvb2dsZVwiIDogXCJOb3QgY29ubmVjdGVkXCIpO1xuXG4gICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5KSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJEaXNjb25uZWN0XCIpXG4gICAgICAgICAgICAuc2V0V2FybmluZygpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSA9IFwiXCI7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXV0aFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkNvbm5lY3QgR29vZ2xlXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oXCJnZW1pbmlcIik7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiR2VtaW5pIEFQSSBrZXlcIilcbiAgICAgICAgLnNldERlc2MoXCJTdG9yZWQgbG9jYWxseSBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIEdlbWluaSBBUEkga2V5Li4uXCIpO1xuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSxcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkdlbWluaSBtb2RlbFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlNlbGVjdCBhIEdlbWluaSBtb2RlbCBvciBlbnRlciBhIGN1c3RvbSBvbmUuXCIpXG4gICAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgICBkcm9wZG93blxuICAgICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgICBcImdlbWluaS0xLjUtZmxhc2hcIjogXCJHZW1pbmkgMS41IEZsYXNoIChGYXN0ZXN0KVwiLFxuICAgICAgICAgICAgICBcImdlbWluaS0xLjUtZmxhc2gtOGJcIjogXCJHZW1pbmkgMS41IEZsYXNoIDhCIChMaWdodGVyKVwiLFxuICAgICAgICAgICAgICBcImdlbWluaS0xLjUtcHJvXCI6IFwiR2VtaW5pIDEuNSBQcm8gKFBvd2VyZnVsKVwiLFxuICAgICAgICAgICAgICBcImdlbWluaS0yLjAtZmxhc2hcIjogXCJHZW1pbmkgMi4wIEZsYXNoIChMYXRlc3QpXCIsXG4gICAgICAgICAgICAgIGN1c3RvbTogXCJDdXN0b20gTW9kZWwuLi5cIixcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgIFtcImdlbWluaS0xLjUtZmxhc2hcIiwgXCJnZW1pbmktMS41LWZsYXNoLThiXCIsIFwiZ2VtaW5pLTEuNS1wcm9cIiwgXCJnZW1pbmktMi4wLWZsYXNoXCJdLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgPyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbFxuICAgICAgICAgICAgICAgIDogXCJjdXN0b21cIixcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBcImN1c3RvbVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNDdXN0b20gPSAhW1wiZ2VtaW5pLTEuNS1mbGFzaFwiLCBcImdlbWluaS0xLjUtZmxhc2gtOGJcIiwgXCJnZW1pbmktMS41LXByb1wiLCBcImdlbWluaS0yLjAtZmxhc2hcIl0uaW5jbHVkZXMoXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChpc0N1c3RvbSkge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIGN1c3RvbSBtb2RlbCBuYW1lLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcodGV4dCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQuaW5wdXRFbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSSBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBBSSBzeW50aGVzaXNcIilcbiAgICAgIC5zZXREZXNjKFwiVXNlIEFJIGZvciBzeW50aGVzaXMsIHF1ZXN0aW9uIGFuc3dlcmluZywgYW5kIHRvcGljIHBhZ2VzIHdoZW4gY29uZmlndXJlZC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHJvdXRpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiQWxsb3cgdGhlIHNpZGViYXIgdG8gYXV0by1yb3V0ZSBjYXB0dXJlcyB3aXRoIEFJLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29udGV4dCBDb2xsZWN0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTG9va2JhY2sgZGF5c1wiKVxuICAgICAgLnNldERlc2MoXCJIb3cgZmFyIGJhY2sgdG8gc2NhbiB3aGVuIGJ1aWxkaW5nIHJlY2VudC1jb250ZXh0IHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDAgPyBwYXJzZWQgOiA3O1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1heGltdW0gY2hhcmFjdGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJNYXhpbXVtIHRleHQgY29sbGVjdGVkIGJlZm9yZSBzeW50aGVzaXMgb3Igc3VtbWFyeS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPj0gMTAwMCA/IHBhcnNlZCA6IDEyMDAwO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3VtbWFyeSBPdXRwdXRcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQZXJzaXN0IHN1bW1hcmllc1wiKVxuICAgICAgLnNldERlc2MoXCJXcml0ZSBnZW5lcmF0ZWQgc3VtbWFyaWVzIGludG8gdGhlIHZhdWx0LlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBsYXN0U2F2ZWRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBpc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgdGV4dC5zZXRWYWx1ZSh2YWx1ZSkub25DaGFuZ2UoKG5leHRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShuZXh0VmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlU2F2ZU9uQmx1cihcbiAgICAgIHRleHQuaW5wdXRFbCxcbiAgICAgICgpID0+IGN1cnJlbnRWYWx1ZSxcbiAgICAgICgpID0+IGxhc3RTYXZlZFZhbHVlLFxuICAgICAgKHNhdmVkVmFsdWUpID0+IHtcbiAgICAgICAgbGFzdFNhdmVkVmFsdWUgPSBzYXZlZFZhbHVlO1xuICAgICAgfSxcbiAgICAgICgpID0+IGlzU2F2aW5nLFxuICAgICAgKHNhdmluZykgPT4ge1xuICAgICAgICBpc1NhdmluZyA9IHNhdmluZztcbiAgICAgIH0sXG4gICAgICB2YWxpZGF0ZSxcbiAgICApO1xuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVNhdmVPbkJsdXIoXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgZ2V0Q3VycmVudFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgZ2V0TGFzdFNhdmVkVmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRMYXN0U2F2ZWRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgaXNTYXZpbmc6ICgpID0+IGJvb2xlYW4sXG4gICAgc2V0U2F2aW5nOiAoc2F2aW5nOiBib29sZWFuKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IHZvaWQge1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlT25CbHVyKFxuICAgICAgICBnZXRDdXJyZW50VmFsdWUsXG4gICAgICAgIGdldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBzZXRMYXN0U2F2ZWRWYWx1ZSxcbiAgICAgICAgaXNTYXZpbmcsXG4gICAgICAgIHNldFNhdmluZyxcbiAgICAgICAgdmFsaWRhdGUsXG4gICAgICApO1xuICAgIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZU9uQmx1cihcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGlzU2F2aW5nKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRDdXJyZW50VmFsdWUoKTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09PSBnZXRMYXN0U2F2ZWRWYWx1ZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2F2aW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIHNldExhc3RTYXZlZFZhbHVlKGN1cnJlbnRWYWx1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNhdmluZyhmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRoZXNpc0NvbnRleHQge1xuICBzb3VyY2VMYWJlbDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsO1xuICBzb3VyY2VQYXRocz86IHN0cmluZ1tdO1xuICB0ZXh0OiBzdHJpbmc7XG4gIG9yaWdpbmFsTGVuZ3RoOiBudW1iZXI7XG4gIHRydW5jYXRlZDogYm9vbGVhbjtcbiAgbWF4Q2hhcnM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRleHRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldEN1cnJlbnROb3RlQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSB2aWV3LmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnQgbm90ZSBpcyBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoXCJDdXJyZW50IG5vdGVcIiwgdmlldy5maWxlLnBhdGgsIHRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VsZWN0ZWRUZXh0Q29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSB2aWV3LmVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3Qgc29tZSB0ZXh0IGZpcnN0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChcIlNlbGVjdGVkIHRleHRcIiwgdmlldy5maWxlLnBhdGgsIHRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmVjZW50RmlsZXNDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RSZWNlbnRNYXJrZG93bkZpbGVzKHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXMpO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIlJlY2VudCBmaWxlc1wiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvbGRlclBhdGggPSB2aWV3LmZpbGUucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RGaWxlc0luRm9sZGVyKGZvbGRlclBhdGgpO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIkN1cnJlbnQgZm9sZGVyXCIsIGZpbGVzLCBmb2xkZXJQYXRoIHx8IG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VsZWN0ZWRGaWxlc0NvbnRleHQoZmlsZXM6IFRGaWxlW10pOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBtYXJrZG93biBub3RlXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIlNlbGVjdGVkIG5vdGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldFZhdWx0Q29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdFZhdWx0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIkVudGlyZSB2YXVsdFwiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dChcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFN5bnRoZXNpc0NvbnRleHQge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgbWF4Q2hhcnMgPSBNYXRoLm1heCgxMDAwLCBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpO1xuICAgIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgICBjb25zdCBvcmlnaW5hbExlbmd0aCA9IHRyaW1tZWQubGVuZ3RoO1xuICAgIGNvbnN0IHRydW5jYXRlZCA9IG9yaWdpbmFsTGVuZ3RoID4gbWF4Q2hhcnM7XG4gICAgY29uc3QgbGltaXRlZCA9IHRydW5jYXRlZCA/IHRyaW1tZWQuc2xpY2UoMCwgbWF4Q2hhcnMpLnRyaW1FbmQoKSA6IHRyaW1tZWQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc291cmNlTGFiZWwsXG4gICAgICBzb3VyY2VQYXRoLFxuICAgICAgc291cmNlUGF0aHMsXG4gICAgICB0ZXh0OiBsaW1pdGVkLFxuICAgICAgb3JpZ2luYWxMZW5ndGgsXG4gICAgICB0cnVuY2F0ZWQsXG4gICAgICBtYXhDaGFycyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBidWlsZEZpbGVHcm91cENvbnRleHQoXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBmaWxlczogVEZpbGVbXSxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICApOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBtYXJrZG93biBmaWxlcyBmb3VuZCBmb3IgJHtzb3VyY2VMYWJlbC50b0xvd2VyQ2FzZSgpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIGZpbGVzLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzLFxuICAgICk7XG5cbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG1hcmtkb3duIGZpbGVzIGZvdW5kIGZvciAke3NvdXJjZUxhYmVsLnRvTG93ZXJDYXNlKCl9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KHNvdXJjZUxhYmVsLCBzb3VyY2VQYXRoLCB0ZXh0LCBmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUucGF0aCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0UmVjZW50TWFya2Rvd25GaWxlcyhsb29rYmFja0RheXM6IG51bWJlcik6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IGN1dG9mZiA9IGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5cykuZ2V0VGltZSgpO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGZpbGUuc3RhdC5tdGltZSA+PSBjdXRvZmYpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0VmF1bHRNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RGaWxlc0luRm9sZGVyKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+XG4gICAgICAgIGZvbGRlclBhdGggPyBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgZm9sZGVyUGF0aCkgOiAhZmlsZS5wYXRoLmluY2x1ZGVzKFwiL1wiKSxcbiAgICAgIClcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzOiBudW1iZXIpOiBEYXRlIHtcbiAgY29uc3Qgc2FmZURheXMgPSBNYXRoLm1heCgxLCBsb29rYmFja0RheXMpO1xuICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKCk7XG4gIHN0YXJ0LnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICBzdGFydC5zZXREYXRlKHN0YXJ0LmdldERhdGUoKSAtIChzYWZlRGF5cyAtIDEpKTtcbiAgcmV0dXJuIHN0YXJ0O1xufVxuIiwgImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gIGZpbGVzOiBURmlsZVtdLFxuICBtYXhDaGFyczogbnVtYmVyLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGxldCB0b3RhbCA9IDA7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB2YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmxvY2sgPSBbYC0tLSAke2ZpbGUucGF0aH1gLCB0cmltbWVkXS5qb2luKFwiXFxuXCIpO1xuICAgICAgaWYgKHRvdGFsICsgYmxvY2subGVuZ3RoID4gbWF4Q2hhcnMpIHtcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gTWF0aC5tYXgoMCwgbWF4Q2hhcnMgLSB0b3RhbCk7XG4gICAgICAgIGlmIChyZW1haW5pbmcgPiAwKSB7XG4gICAgICAgICAgcGFydHMucHVzaChibG9jay5zbGljZSgwLCByZW1haW5pbmcpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaChibG9jayk7XG4gICAgICB0b3RhbCArPSBibG9jay5sZW5ndGg7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xufVxuIiwgIi8qKlxuICogUGF0aCB1dGlsaXR5IGZ1bmN0aW9uc1xuICovXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBwYXRoIGlzIHVuZGVyIGEgc3BlY2lmaWMgZm9sZGVyIChvciBpcyB0aGUgZm9sZGVyIGl0c2VsZikuXG4gKiBIYW5kbGVzIHRyYWlsaW5nIHNsYXNoZXMgY29uc2lzdGVudGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNVbmRlckZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIHBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXIgfHwgcGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJ9L2ApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQyKGRhdGUuZ2V0TW9udGgoKSArIDEpfS0ke3BhZDIoZGF0ZS5nZXREYXRlKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3BhZDIoZGF0ZS5nZXRIb3VycygpKX06JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZVRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0gJHtmb3JtYXRUaW1lS2V5KGRhdGUpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9LSR7cGFkMihkYXRlLmdldEhvdXJzKCkpfSR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS5yZXBsYWNlKC9cXHMrJC9nLCBcIlwiKSlcbiAgICAuam9pbihcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOZXdsaW5lcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCBcIlwiKTtcbn1cblxuZnVuY3Rpb24gcGFkMih2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmJveFZhdWx0U2VydmljZSB7XG4gIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+O1xuICByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluYm94RW50cnkge1xuICBoZWFkaW5nOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZztcbiAgcmF3OiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgaW5kZXg6IG51bWJlcjtcbiAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIHN0YXJ0TGluZTogbnVtYmVyO1xuICBlbmRMaW5lOiBudW1iZXI7XG4gIHJldmlld2VkOiBib29sZWFuO1xuICByZXZpZXdBY3Rpb246IHN0cmluZyB8IG51bGw7XG4gIHJldmlld2VkQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIEluYm94RW50cnlJZGVudGl0eSA9IFBpY2s8XG4gIEluYm94RW50cnksXG4gIFwiaGVhZGluZ1wiIHwgXCJib2R5XCIgfCBcInByZXZpZXdcIiB8IFwic2lnbmF0dXJlXCIgfCBcInNpZ25hdHVyZUluZGV4XCJcbj4gJlxuICBQYXJ0aWFsPFBpY2s8SW5ib3hFbnRyeSwgXCJyYXdcIiB8IFwic3RhcnRMaW5lXCIgfCBcImVuZExpbmVcIj4+O1xuXG5leHBvcnQgY2xhc3MgSW5ib3hTZXJ2aWNlIHtcbiAgcHJpdmF0ZSB1bnJldmlld2VkQ291bnRDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBJbmJveFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRFbnRyaWVzKGxpbWl0ID0gMjAsIGluY2x1ZGVSZXZpZXdlZCA9IGZhbHNlKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGluY2x1ZGVSZXZpZXdlZCA/IGVudHJpZXMgOiBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5yZXZpZXdlZCk7XG4gICAgcmV0dXJuIGZpbHRlcmVkLnNsaWNlKC1saW1pdCkucmV2ZXJzZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VW5yZXZpZXdlZENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB7IHRleHQsIG10aW1lLCBleGlzdHMgfSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0V2l0aE10aW1lKHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnJldmlld2VkQ291bnRDYWNoZSAmJiB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlLm10aW1lID09PSBtdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBwYXJzZUluYm94RW50cmllcyh0ZXh0KS5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpLmxlbmd0aDtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIGFzeW5jIG1hcmtFbnRyeVJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZCgoY2FuZGlkYXRlKSA9PiAhY2FuZGlkYXRlLnJldmlld2VkICYmIGNhbmRpZGF0ZS5yYXcgPT09IGVudHJ5LnJhdykgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnN0YXJ0TGluZSA9PT0gZW50cnkuc3RhcnRMaW5lLFxuICAgICAgKTtcblxuICAgIGlmICghY3VycmVudEVudHJ5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGluc2VydFJldmlld01hcmtlcihjb250ZW50LCBjdXJyZW50RW50cnksIGFjdGlvbik7XG4gICAgaWYgKHVwZGF0ZWQgPT09IGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCB1cGRhdGVkKTtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkVudHJ5KGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgY3VycmVudEVudHJ5ID1cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZSA9PT0gZW50cnkuc2lnbmF0dXJlICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZUluZGV4ID09PSBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICAgICkgPz9cbiAgICAgIGZpbmRVbmlxdWVSZXZpZXdlZFNpZ25hdHVyZU1hdGNoKGN1cnJlbnRFbnRyaWVzLCBlbnRyeS5zaWduYXR1cmUpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5KTtcbiAgICBpZiAodXBkYXRlZCA9PT0gY29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluYm94RW50cmllcyhjb250ZW50OiBzdHJpbmcpOiBJbmJveEVudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IEluYm94RW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudEJvZHlMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICBsZXQgY3VycmVudFJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHNpZ25hdHVyZUNvdW50cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKGVuZExpbmU6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gY3VycmVudEJvZHlMaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwcmV2aWV3ID0gYnVpbGRQcmV2aWV3KGJvZHkpO1xuICAgIGNvbnN0IHJhdyA9IFtjdXJyZW50SGVhZGluZywgLi4uY3VycmVudEJvZHlMaW5lc10uam9pbihcIlxcblwiKS50cmltRW5kKCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYnVpbGRFbnRyeVNpZ25hdHVyZShjdXJyZW50SGVhZGluZywgY3VycmVudEJvZHlMaW5lcyk7XG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXggPSBzaWduYXR1cmVDb3VudHMuZ2V0KHNpZ25hdHVyZSkgPz8gMDtcbiAgICBzaWduYXR1cmVDb3VudHMuc2V0KHNpZ25hdHVyZSwgc2lnbmF0dXJlSW5kZXggKyAxKTtcbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcucmVwbGFjZSgvXiMjXFxzKy8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIGJvZHksXG4gICAgICByYXcsXG4gICAgICBwcmV2aWV3LFxuICAgICAgaW5kZXg6IGVudHJpZXMubGVuZ3RoLFxuICAgICAgc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXgsXG4gICAgICBzdGFydExpbmU6IGN1cnJlbnRTdGFydExpbmUsXG4gICAgICBlbmRMaW5lLFxuICAgICAgcmV2aWV3ZWQ6IGN1cnJlbnRSZXZpZXdlZCxcbiAgICAgIHJldmlld0FjdGlvbjogY3VycmVudFJldmlld0FjdGlvbixcbiAgICAgIHJldmlld2VkQXQ6IGN1cnJlbnRSZXZpZXdlZEF0LFxuICAgIH0pO1xuICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gICAgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gICAgY3VycmVudFJldmlld0FjdGlvbiA9IG51bGw7XG4gICAgY3VycmVudFJldmlld2VkQXQgPSBudWxsO1xuICB9O1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaW5kZXhdO1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeShpbmRleCk7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGxpbmU7XG4gICAgICBjdXJyZW50U3RhcnRMaW5lID0gaW5kZXg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOlxccyooW2Etel0rKSg/OlxccysoLis/KSk/XFxzKi0tPiQvaSk7XG4gICAgaWYgKHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UmV2aWV3ZWQgPSB0cnVlO1xuICAgICAgY3VycmVudFJldmlld0FjdGlvbiA9IHJldmlld01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IHJldmlld01hdGNoWzJdID8/IG51bGw7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjdXJyZW50Qm9keUxpbmVzLnB1c2gobGluZSk7XG4gIH1cblxuICBwdXNoRW50cnkobGluZXMubGVuZ3RoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgY29uc3QgbWFya2VyID0gYDwhLS0gYnJhaW4tcmV2aWV3ZWQ6ICR7YWN0aW9ufSAke3RpbWVzdGFtcH0gLS0+YDtcbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG4gIGNsZWFuZWRFbnRyeUxpbmVzLnB1c2gobWFya2VyLCBcIlwiKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRQcmV2aWV3KGJvZHk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gYm9keVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBsaW5lc1swXSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBidWlsZEVudHJ5U2lnbmF0dXJlKGhlYWRpbmc6IHN0cmluZywgYm9keUxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBbaGVhZGluZy50cmltKCksIC4uLmJvZHlMaW5lcy5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKV0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhsaW5lczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNsb25lID0gWy4uLmxpbmVzXTtcbiAgd2hpbGUgKGNsb25lLmxlbmd0aCA+IDAgJiYgY2xvbmVbY2xvbmUubGVuZ3RoIC0gMV0udHJpbSgpID09PSBcIlwiKSB7XG4gICAgY2xvbmUucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGNsb25lO1xufVxuXG5mdW5jdGlvbiBmaW5kVW5pcXVlUmV2aWV3ZWRTaWduYXR1cmVNYXRjaChcbiAgZW50cmllczogSW5ib3hFbnRyeVtdLFxuICBzaWduYXR1cmU6IHN0cmluZyxcbik6IEluYm94RW50cnkgfCBudWxsIHtcbiAgY29uc3QgcmV2aWV3ZWRNYXRjaGVzID0gZW50cmllcy5maWx0ZXIoXG4gICAgKGVudHJ5KSA9PiBlbnRyeS5yZXZpZXdlZCAmJiBlbnRyeS5zaWduYXR1cmUgPT09IHNpZ25hdHVyZSxcbiAgKTtcbiAgaWYgKHJldmlld2VkTWF0Y2hlcy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gcmV2aWV3ZWRNYXRjaGVzWzBdO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlSm91cm5hbFRleHQsIGZvcm1hdERhdGVLZXksIGZvcm1hdFRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEpvdXJuYWxTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBnZXRKb3VybmFsUGF0aChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICByZXR1cm4gYCR7c2V0dGluZ3Muam91cm5hbEZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gIH1cblxuICBhc3luYyBlbnN1cmVKb3VybmFsRmlsZShkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRKb3VybmFsUGF0aChkYXRlKTtcbiAgICByZXR1cm4gdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kSm91cm5hbEhlYWRlcihwYXRoLCBkYXRlS2V5KTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEVudHJ5KHRleHQ6IHN0cmluZywgZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkpvdXJuYWwgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IGZpbGUucGF0aDtcblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0VGltZUtleShkYXRlKX1cXG4ke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQge1xuICBjb2xsYXBzZVdoaXRlc3BhY2UsXG4gIGZvcm1hdERhdGVUaW1lS2V5LFxuICBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLFxufSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIE5vdGVTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmROb3RlKHRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdGUgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2sgPSBgIyMgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1cXG4tICR7Y2xlYW5lZH1gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCBibG9jayk7XG4gICAgcmV0dXJuIHsgcGF0aDogc2V0dGluZ3MuaW5ib3hGaWxlIH07XG4gIH1cblxuICBhc3luYyBjcmVhdGVHZW5lcmF0ZWROb3RlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgYm9keTogc3RyaW5nLFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgICBzb3VyY2VQYXRocz86IHN0cmluZ1tdLFxuICApOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGNsZWFuZWRUaXRsZSA9IHRyaW1UaXRsZSh0aXRsZSk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBgJHtmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKG5vdyl9LSR7c2x1Z2lmeShjbGVhbmVkVGl0bGUpfS5tZGA7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKFxuICAgICAgYCR7c2V0dGluZ3Mubm90ZXNGb2xkZXJ9LyR7ZmlsZU5hbWV9YCxcbiAgICApO1xuICAgIGNvbnN0IHNvdXJjZUxpbmUgPSBzb3VyY2VQYXRocyAmJiBzb3VyY2VQYXRocy5sZW5ndGggPiAwXG4gICAgICA/IGAke3NvdXJjZUxhYmVsfSBcdTIwMjIgJHtzb3VyY2VQYXRocy5sZW5ndGh9ICR7c291cmNlUGF0aHMubGVuZ3RoID09PSAxID8gXCJmaWxlXCIgOiBcImZpbGVzXCJ9YFxuICAgICAgOiBzb3VyY2VQYXRoXG4gICAgICAgID8gYCR7c291cmNlTGFiZWx9IFx1MjAyMiAke3NvdXJjZVBhdGh9YFxuICAgICAgICA6IHNvdXJjZUxhYmVsO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVMaW5lcyA9IHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgID8gW1xuICAgICAgICAgIFwiU291cmNlIGZpbGVzOlwiLFxuICAgICAgICAgIC4uLnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKS5tYXAoKHNvdXJjZSkgPT4gYC0gJHtzb3VyY2V9YCksXG4gICAgICAgICAgLi4uKHNvdXJjZVBhdGhzLmxlbmd0aCA+IDEyXG4gICAgICAgICAgICA/IFtgLSAuLi5hbmQgJHtzb3VyY2VQYXRocy5sZW5ndGggLSAxMn0gbW9yZWBdXG4gICAgICAgICAgICA6IFtdKSxcbiAgICAgICAgXVxuICAgICAgOiBbXTtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMgJHtjbGVhbmVkVGl0bGV9YCxcbiAgICAgIFwiXCIsXG4gICAgICBgQ3JlYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBgU291cmNlOiAke3NvdXJjZUxpbmV9YCxcbiAgICAgIC4uLnNvdXJjZUZpbGVMaW5lcyxcbiAgICAgIFwiXCIsXG4gICAgICBjb2xsYXBzZVdoaXRlc3BhY2UoYm9keSkgPyBib2R5LnRyaW0oKSA6IFwiTm8gYXJ0aWZhY3QgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHBhdGgsIGNvbnRlbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpXG4gICAgLnNsaWNlKDAsIDQ4KSB8fCBcIm5vdGVcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVLZXksIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEluYm94RW50cnksIEluYm94RW50cnlJZGVudGl0eSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi4vdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGludGVyZmFjZSBSZXZpZXdMb2dFbnRyeSBleHRlbmRzIEluYm94RW50cnlJZGVudGl0eSB7XG4gIGFjdGlvbjogc3RyaW5nO1xuICB0aW1lc3RhbXA6IHN0cmluZztcbiAgc291cmNlUGF0aDogc3RyaW5nO1xuICBmaWxlTXRpbWU6IG51bWJlcjtcbiAgZW50cnlJbmRleDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUmV2aWV3TG9nU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3RW50cnlDb3VudENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0+KCk7XG4gIHByaXZhdGUgcmV2aWV3TG9nRmlsZXNDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZmlsZXM6IFRGaWxlW107XG4gIH0gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXZpZXdFbnRyeVRvdGFsQ2FjaGU6IHtcbiAgICBsaXN0aW5nTXRpbWU6IG51bWJlcjtcbiAgICB0b3RhbDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmRSZXZpZXdMb2coZW50cnk6IEluYm94RW50cnlJZGVudGl0eSwgYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdERhdGVLZXkobm93KTtcbiAgICBjb25zdCBwYXRoID0gYCR7c2V0dGluZ3MucmV2aWV3c0ZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIGAtIEFjdGlvbjogJHthY3Rpb259YCxcbiAgICAgIGAtIEluYm94OiAke2VudHJ5LmhlYWRpbmd9YCxcbiAgICAgIGAtIFByZXZpZXc6ICR7ZW50cnkucHJldmlldyB8fCBlbnRyeS5ib2R5IHx8IFwiKGVtcHR5KVwifWAsXG4gICAgICBgLSBTaWduYXR1cmU6ICR7ZW5jb2RlUmV2aWV3U2lnbmF0dXJlKGVudHJ5LnNpZ25hdHVyZSl9YCxcbiAgICAgIGAtIFNpZ25hdHVyZSBpbmRleDogJHtlbnRyeS5zaWduYXR1cmVJbmRleH1gLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGNvbnRlbnQpO1xuICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlID0gbnVsbDtcbiAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHsgcGF0aCB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuXG4gICAgaWYgKCF0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUpIHtcbiAgICAgIGNvbnN0IGFsbEZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICAgIGNvbnN0IG1hdGNoaW5nID0gYWxsRmlsZXNcbiAgICAgICAgLmZpbHRlcigoZmlsZSkgPT4gaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICAgICAgdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlID0ge1xuICAgICAgICBtdGltZTogbWF0Y2hpbmdbMF0/LnN0YXQubXRpbWUgPz8gMCxcbiAgICAgICAgZmlsZXM6IG1hdGNoaW5nLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiXG4gICAgICA/IHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZS5maWxlcy5zbGljZSgwLCBsaW1pdClcbiAgICAgIDogdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlLmZpbGVzO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3RW50cmllcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8UmV2aWV3TG9nRW50cnlbXT4ge1xuICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCB0aGlzLmdldFJldmlld0xvZ0ZpbGVzKGxpbWl0KTtcbiAgICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbG9ncykge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVJldmlld0xvZ0VudHJpZXMoY29udGVudCwgZmlsZS5wYXRoLCBmaWxlLnN0YXQubXRpbWUpO1xuICAgICAgZW50cmllcy5wdXNoKC4uLnBhcnNlZC5yZXZlcnNlKCkpO1xuICAgICAgaWYgKHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiAmJiBlbnRyaWVzLmxlbmd0aCA+PSBsaW1pdCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiID8gZW50cmllcy5zbGljZSgwLCBsaW1pdCkgOiBlbnRyaWVzO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3RW50cnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCB0aGlzLmdldFJldmlld0xvZ0ZpbGVzKCk7XG4gICAgaWYgKGxvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IHsgbGlzdGluZ010aW1lOiAwLCB0b3RhbDogMCB9O1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdGluZ010aW1lID0gbG9nc1swXS5zdGF0Lm10aW1lO1xuICAgIGlmICh0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZT8ubGlzdGluZ010aW1lID09PSBsaXN0aW5nTXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZS50b3RhbDtcbiAgICB9XG5cbiAgICBjb25zdCBzZWVuUGF0aHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBsZXQgdG90YWwgPSAwO1xuXG4gICAgY29uc3QgdW5jYWNoZWRGaWxlcyA9IGxvZ3MuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgIHJldHVybiAhKGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjYWNoZWRGaWxlcyA9IGxvZ3MuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgIHJldHVybiBjYWNoZWQgJiYgY2FjaGVkLm10aW1lID09PSBmaWxlLnN0YXQubXRpbWU7XG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2FjaGVkRmlsZXMpIHtcbiAgICAgIHNlZW5QYXRocy5hZGQoZmlsZS5wYXRoKTtcbiAgICAgIHRvdGFsICs9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpIS5jb3VudDtcbiAgICB9XG5cbiAgICBpZiAodW5jYWNoZWRGaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHVuY2FjaGVkRmlsZXMubWFwKGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICAgICAgY29uc3QgY291bnQgPSBwYXJzZVJldmlld0xvZ0VudHJpZXMoY29udGVudCwgZmlsZS5wYXRoLCBmaWxlLnN0YXQubXRpbWUpLmxlbmd0aDtcbiAgICAgICAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5zZXQoZmlsZS5wYXRoLCB7XG4gICAgICAgICAgICBtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuICAgICAgICAgICAgY291bnQsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHsgZmlsZSwgY291bnQgfTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBmb3IgKGNvbnN0IHsgZmlsZSwgY291bnQgfSBvZiByZXN1bHRzKSB7XG4gICAgICAgIHNlZW5QYXRocy5hZGQoZmlsZS5wYXRoKTtcbiAgICAgICAgdG90YWwgKz0gY291bnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmtleXMoKSkge1xuICAgICAgaWYgKCFzZWVuUGF0aHMuaGFzKHBhdGgpKSB7XG4gICAgICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmRlbGV0ZShwYXRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IHsgbGlzdGluZ010aW1lLCB0b3RhbCB9O1xuICAgIHJldHVybiB0b3RhbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyxcbiAgZmlsZU10aW1lOiBudW1iZXIsXG4pOiBSZXZpZXdMb2dFbnRyeVtdIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG4gIGxldCBjdXJyZW50VGltZXN0YW1wID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudFByZXZpZXcgPSBcIlwiO1xuICBsZXQgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICBsZXQgY3VycmVudEVudHJ5SW5kZXggPSAwO1xuXG4gIGNvbnN0IHB1c2hFbnRyeSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUaW1lc3RhbXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgYWN0aW9uOiBjdXJyZW50QWN0aW9uIHx8IFwidW5rbm93blwiLFxuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBjdXJyZW50UHJldmlldyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBzaWduYXR1cmU6IGN1cnJlbnRTaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogY3VycmVudFNpZ25hdHVyZUluZGV4LFxuICAgICAgdGltZXN0YW1wOiBjdXJyZW50VGltZXN0YW1wLFxuICAgICAgc291cmNlUGF0aCxcbiAgICAgIGZpbGVNdGltZSxcbiAgICAgIGVudHJ5SW5kZXg6IGN1cnJlbnRFbnRyeUluZGV4LFxuICAgIH0pO1xuICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICAgIGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICAgIGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgICBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gMDtcbiAgICBjdXJyZW50RW50cnlJbmRleCArPSAxO1xuICB9O1xuXG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeSgpO1xuICAgICAgY3VycmVudFRpbWVzdGFtcCA9IGhlYWRpbmdNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb25NYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0FjdGlvbjpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKGFjdGlvbk1hdGNoKSB7XG4gICAgICBjdXJyZW50QWN0aW9uID0gYWN0aW9uTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5ib3hNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0luYm94OlxccysoLispJC9pKTtcbiAgICBpZiAoaW5ib3hNYXRjaCkge1xuICAgICAgY3VycmVudEhlYWRpbmcgPSBpbmJveE1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1ByZXZpZXc6XFxzKyguKykkL2kpO1xuICAgIGlmIChwcmV2aWV3TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRQcmV2aWV3ID0gcHJldmlld01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZU1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrU2lnbmF0dXJlOlxccysoLispJC9pKTtcbiAgICBpZiAoc2lnbmF0dXJlTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRTaWduYXR1cmUgPSBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlTWF0Y2hbMV0udHJpbSgpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZUluZGV4TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmUgaW5kZXg6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVJbmRleE1hdGNoKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQoc2lnbmF0dXJlSW5kZXhNYXRjaFsxXSwgMTApO1xuICAgICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBwYXJzZWQgOiAwO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hFbnRyeSgpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gZW5jb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc2lnbmF0dXJlKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5LCBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBKb3VybmFsU2VydmljZSB9IGZyb20gXCIuL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi90YXNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5LCBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluYm94U2VydmljZTogSW5ib3hTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2U6IFRhc2tTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgam91cm5hbFNlcnZpY2U6IEpvdXJuYWxTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3TG9nU2VydmljZTogUmV2aWV3TG9nU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRJbmJveEVudHJpZXMobGltaXQgPSAyMCk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuaW5ib3hTZXJ2aWNlLmdldFJlY2VudEVudHJpZXMobGltaXQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvVGFzayhlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdGV4dCA9IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nO1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJ0YXNrXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInRhc2tcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcbiAgICAgIGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byB0YXNrIGluICR7c2F2ZWQucGF0aH1gLFxuICAgICAgbWFya2VyVXBkYXRlZCxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMga2VlcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwia2VlcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJrZWVwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJLZXB0IGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgc2tpcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwic2tpcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJza2lwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJTa2lwcGVkIGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVG9Kb3VybmFsKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkoXG4gICAgICBbXG4gICAgICAgIGBTb3VyY2U6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJqb3VybmFsXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShgQXBwZW5kZWQgaW5ib3ggZW50cnkgdG8gJHtzYXZlZC5wYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvTm90ZShlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gc2V0dGluZ3Mubm90ZXNGb2xkZXI7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlRm9sZGVyKG5vdGVzRm9sZGVyKTtcblxuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5idWlsZE5vdGVUaXRsZShlbnRyeSk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtmb3JtYXREYXRlVGltZUtleShub3cpLnJlcGxhY2UoL1s6IF0vZywgXCItXCIpfS0ke3NsdWdpZnkodGl0bGUpfS5tZGA7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKGAke25vdGVzRm9sZGVyfS8ke2ZpbGVuYW1lfWApO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke3RpdGxlfWAsXG4gICAgICBcIlwiLFxuICAgICAgYENyZWF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgXCJTb3VyY2U6IEJyYWluIGluYm94XCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJPcmlnaW5hbCBjYXB0dXJlOlwiLFxuICAgICAgZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmcsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcIm5vdGVcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwibm90ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byBub3RlIGluICR7cGF0aH1gLCBtYXJrZXJVcGRhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkZyb21SZXZpZXdMb2coZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBpZGVudGl0eSA9IHtcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgcHJldmlldzogZW50cnkucHJldmlldyxcbiAgICAgIHNpZ25hdHVyZTogZW50cnkuc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXg6IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgIH07XG4gICAgY29uc3QgcmVvcGVuZWQgPSBhd2FpdCB0aGlzLmluYm94U2VydmljZS5yZW9wZW5FbnRyeShpZGVudGl0eSk7XG4gICAgaWYgKCFyZW9wZW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChpZGVudGl0eSwgXCJyZW9wZW5cIik7XG4gICAgcmV0dXJuIGBSZS1vcGVuZWQgaW5ib3ggZW50cnkgJHtlbnRyeS5oZWFkaW5nfWA7XG4gIH1cblxuICBidWlsZE5vdGVUaXRsZShlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZW50cnkucHJldmlldyB8fCBlbnRyeS5ib2R5IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3QgbGluZXMgPSBjYW5kaWRhdGVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gY29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGNvbnN0IGZpcnN0ID0gbGluZXNbMF0gPz8gXCJVbnRpdGxlZCBub3RlXCI7XG4gICAgcmV0dXJuIHRyaW1UaXRsZShmaXJzdCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG1hcmtJbmJveFJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UubWFya0VudHJ5UmV2aWV3ZWQoZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwZW5kTWFya2VyTm90ZShtZXNzYWdlOiBzdHJpbmcsIG1hcmtlclVwZGF0ZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiBtYXJrZXJVcGRhdGVkID8gbWVzc2FnZSA6IGAke21lc3NhZ2V9IChyZXZpZXcgbWFya2VyIG5vdCB1cGRhdGVkKWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoXG4gICAgZW50cnk6IEluYm94RW50cnlJZGVudGl0eSxcbiAgICBhY3Rpb246IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5hcHBlbmRSZXZpZXdMb2coZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzbHVnaWZ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTldKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi0rfC0rJC9nLCBcIlwiKVxuICAgIC5zbGljZSgwLCA0OCkgfHwgXCJub3RlXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1UaXRsZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGlmICh0cmltbWVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiB0cmltbWVkO1xuICB9XG4gIHJldHVybiBgJHt0cmltbWVkLnNsaWNlKDAsIDU3KS50cmltRW5kKCl9Li4uYDtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyIH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBRdWVzdGlvblNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb246IHN0cmluZywgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IFByb21pc2U8U3ludGhlc2lzUmVzdWx0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tRdWVzdGlvbkFuc3dlcihxdWVzdGlvbiwgY29udGV4dC50ZXh0KTtcbiAgICBsZXQgY29udGVudCA9IGZhbGxiYWNrO1xuICAgIGxldCB1c2VkQUkgPSBmYWxzZTtcblxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykge1xuICAgICAgaWYgKCFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICFzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkFJIGFuc3dlcnMgYXJlIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHF1ZXN0aW9uIGFuc3dlcmluZ1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBcIlF1ZXN0aW9uIEFuc3dlclwiLFxuICAgICAgdGl0bGU6IFwiQW5zd2VyXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5RdWVzdGlvbihxdWVzdGlvbiksXG4gICAgICBjb250ZW50OiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHByb21wdFRleHQ6IHF1ZXN0aW9uLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gcXVlc3Rpb24udHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgUXVlc3Rpb24gJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0S2V5d29yZHMocXVlc3Rpb246IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3Qgc3RvcHdvcmRzID0gbmV3IFNldChbXG4gICAgXCJ3aGF0XCIsXG4gICAgXCJ3aHlcIixcbiAgICBcImhvd1wiLFxuICAgIFwid2hpY2hcIixcbiAgICBcIndoZW5cIixcbiAgICBcIndoZXJlXCIsXG4gICAgXCJ3aG9cIixcbiAgICBcIndob21cIixcbiAgICBcImRvZXNcIixcbiAgICBcImRvXCIsXG4gICAgXCJkaWRcIixcbiAgICBcImlzXCIsXG4gICAgXCJhcmVcIixcbiAgICBcIndhc1wiLFxuICAgIFwid2VyZVwiLFxuICAgIFwidGhlXCIsXG4gICAgXCJhXCIsXG4gICAgXCJhblwiLFxuICAgIFwidG9cIixcbiAgICBcIm9mXCIsXG4gICAgXCJmb3JcIixcbiAgICBcImFuZFwiLFxuICAgIFwib3JcIixcbiAgICBcImluXCIsXG4gICAgXCJvblwiLFxuICAgIFwiYXRcIixcbiAgICBcIndpdGhcIixcbiAgICBcImFib3V0XCIsXG4gICAgXCJmcm9tXCIsXG4gICAgXCJteVwiLFxuICAgIFwib3VyXCIsXG4gICAgXCJ5b3VyXCIsXG4gICAgXCJ0aGlzXCIsXG4gICAgXCJ0aGF0XCIsXG4gICAgXCJ0aGVzZVwiLFxuICAgIFwidGhvc2VcIixcbiAgICBcIm1ha2VcIixcbiAgICBcIm1hZGVcIixcbiAgICBcIm5lZWRcIixcbiAgICBcIm5lZWRzXCIsXG4gICAgXCJjYW5cIixcbiAgICBcImNvdWxkXCIsXG4gICAgXCJzaG91bGRcIixcbiAgICBcIndvdWxkXCIsXG4gICAgXCJ3aWxsXCIsXG4gICAgXCJoYXZlXCIsXG4gICAgXCJoYXNcIixcbiAgICBcImhhZFwiLFxuICBdKTtcblxuICByZXR1cm4gQXJyYXkuZnJvbShcbiAgICBuZXcgU2V0KFxuICAgICAgcXVlc3Rpb25cbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnNwbGl0KC9bXmEtejAtOV0rL2cpXG4gICAgICAgIC5tYXAoKHdvcmQpID0+IHdvcmQudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKCh3b3JkKSA9PiB3b3JkLmxlbmd0aCA+PSA0ICYmICFzdG9wd29yZHMuaGFzKHdvcmQpKSxcbiAgICApLFxuICApO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzUXVlc3Rpb24obGluZTogc3RyaW5nLCBrZXl3b3Jkczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgaWYgKCFrZXl3b3Jkcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBsb3dlciA9IGxpbmUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIGtleXdvcmRzLnNvbWUoKGtleXdvcmQpID0+IGxvd2VyLmluY2x1ZGVzKGtleXdvcmQpKTtcbn1cblxuZnVuY3Rpb24gY29sbGVjdEV2aWRlbmNlKGNvbnRlbnQ6IHN0cmluZywgcXVlc3Rpb246IHN0cmluZyk6IHtcbiAgZXZpZGVuY2U6IFNldDxzdHJpbmc+O1xuICBtYXRjaGVkOiBib29sZWFuO1xufSB7XG4gIGNvbnN0IGV2aWRlbmNlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGtleXdvcmRzID0gZXh0cmFjdEtleXdvcmRzKHF1ZXN0aW9uKTtcbiAgbGV0IG1hdGNoZWQgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCAmJiAobWF0Y2hlc1F1ZXN0aW9uKGhlYWRpbmdUZXh0LCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDMpKSB7XG4gICAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24oaGVhZGluZ1RleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24odGFza1RleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMykpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbih0YXNrVGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCAmJiAobWF0Y2hlc1F1ZXN0aW9uKGJ1bGxldFRleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgNCkpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihidWxsZXRUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGxpbmUsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMikge1xuICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihsaW5lLCBrZXl3b3JkcykpIHtcbiAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBldmlkZW5jZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBldmlkZW5jZSxcbiAgICBtYXRjaGVkLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWRRdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UocXVlc3Rpb24pO1xuICBjb25zdCB7IGV2aWRlbmNlLCBtYXRjaGVkIH0gPSBjb2xsZWN0RXZpZGVuY2UoY29udGVudCwgY2xlYW5lZFF1ZXN0aW9uKTtcbiAgY29uc3QgYW5zd2VyTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgaWYgKG1hdGNoZWQpIHtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFxuICAgICAgXCJJIGZvdW5kIHRoZXNlIGxpbmVzIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0IHRoYXQgZGlyZWN0bHkgbWF0Y2ggeW91ciBxdWVzdGlvbi5cIixcbiAgICApO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUaGUgY29udGV4dCBkb2VzIG5vdCBwcm92aWRlIGEgZnVsbHkgdmVyaWZpZWQgYW5zd2VyLCBzbyB0cmVhdCB0aGlzIGFzIGEgZ3JvdW5kZWQgc3VtbWFyeS5cIik7XG4gIH0gZWxzZSBpZiAoZXZpZGVuY2Uuc2l6ZSkge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXG4gICAgICBcIkkgY291bGQgbm90IGZpbmQgYSBkaXJlY3QgbWF0Y2ggaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQsIHNvIHRoZXNlIGFyZSB0aGUgY2xvc2VzdCBsaW5lcyBhdmFpbGFibGUuXCIsXG4gICAgKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVHJlYXQgdGhpcyBhcyBuZWFyYnkgY29udGV4dCByYXRoZXIgdGhhbiBhIGNvbmZpcm1lZCBhbnN3ZXIuXCIpO1xuICB9IGVsc2Uge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJJIGNvdWxkIG5vdCBmaW5kIGEgZGlyZWN0IGFuc3dlciBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dC5cIik7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRyeSBuYXJyb3dpbmcgdGhlIHF1ZXN0aW9uIG9yIHNlbGVjdGluZyBhIG1vcmUgc3BlY2lmaWMgbm90ZSBvciBmb2xkZXIuXCIpO1xuICB9XG5cbiAgY29uc3QgZm9sbG93VXBzID0gbWF0Y2hlZCB8fCBldmlkZW5jZS5zaXplXG4gICAgPyBuZXcgU2V0KFtcbiAgICAgICAgXCJBc2sgYSBuYXJyb3dlciBxdWVzdGlvbiBpZiB5b3Ugd2FudCBhIG1vcmUgc3BlY2lmaWMgYW5zd2VyLlwiLFxuICAgICAgICBcIk9wZW4gdGhlIHNvdXJjZSBub3RlIG9yIGZvbGRlciBmb3IgYWRkaXRpb25hbCBjb250ZXh0LlwiLFxuICAgICAgXSlcbiAgICA6IG5ldyBTZXQoW1xuICAgICAgICBcIlByb3ZpZGUgbW9yZSBleHBsaWNpdCBjb250ZXh0IG9yIHNlbGVjdCBhIGRpZmZlcmVudCBub3RlIG9yIGZvbGRlci5cIixcbiAgICAgIF0pO1xuXG4gIHJldHVybiBbXG4gICAgXCIjIEFuc3dlclwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBRdWVzdGlvblwiLFxuICAgIGNsZWFuZWRRdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBBbnN3ZXJcIixcbiAgICBhbnN3ZXJMaW5lcy5qb2luKFwiIFwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihldmlkZW5jZSwgXCJObyBkaXJlY3QgZXZpZGVuY2UgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgIFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBBbnN3ZXJcIixcbiAgICAgIFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VRdWVzdGlvbkFuc3dlclNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBBbnN3ZXJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgICBwYXJzZWQucXVlc3Rpb24gfHwgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgcGFyc2VkLmFuc3dlciB8fCBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIHBhcnNlZC5ldmlkZW5jZSB8fCBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIEFuc3dlclwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBRdWVzdGlvblwiLFxuICAgIFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEFuc3dlclwiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VRdWVzdGlvbkFuc3dlclNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgcXVlc3Rpb246IHN0cmluZztcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIlF1ZXN0aW9uXCIgfCBcIkFuc3dlclwiIHwgXCJFdmlkZW5jZVwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBRdWVzdGlvbjogW10sXG4gICAgQW5zd2VyOiBbXSxcbiAgICBFdmlkZW5jZTogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFF1ZXN0aW9ufEFuc3dlcnxFdmlkZW5jZXxGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcXVlc3Rpb246IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuUXVlc3Rpb25dKSxcbiAgICBhbnN3ZXI6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5BbnN3ZXIpLFxuICAgIGV2aWRlbmNlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuRXZpZGVuY2UpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgUXVlc3Rpb246IHN0cmluZ1tdO1xuICBBbnN3ZXI6IHN0cmluZ1tdO1xuICBFdmlkZW5jZTogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJhbnN3ZXJcIikge1xuICAgIHJldHVybiBcIkFuc3dlclwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImV2aWRlbmNlXCIpIHtcbiAgICByZXR1cm4gXCJFdmlkZW5jZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJRdWVzdGlvblwiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQge1xuICBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5LFxufSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXksIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1N1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvc3VtbWFyeS1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi4vdXRpbHMvcGF0aFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1bW1hcnlSZXN1bHQge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHBlcnNpc3RlZFBhdGg/OiBzdHJpbmc7XG4gIHVzZWRBSTogYm9vbGVhbjtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN1bW1hcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cz86IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9IGxvb2tiYWNrRGF5cyA/PyBzZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0UmVjZW50RmlsZXMoc2V0dGluZ3MsIGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIGZpbGVzLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzLFxuICAgICk7XG5cbiAgICBsZXQgc3VtbWFyeSA9IGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQpO1xuICAgIGxldCB1c2VkQUkgPSBmYWxzZTtcblxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykge1xuICAgICAgaWYgKCFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICFzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkFJIHN1bW1hcmllcyBhcmUgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdW1tYXJ5ID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uuc3VtbWFyaXplKGNvbnRlbnQgfHwgc3VtbWFyeSwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCBzdW1tYXJ5XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBlcnNpc3RlZFBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0aXRsZSA9IGxhYmVsID8gYCR7bGFiZWx9IFN1bW1hcnlgIDogXCJTdW1tYXJ5XCI7XG4gICAgaWYgKHNldHRpbmdzLnBlcnNpc3RTdW1tYXJpZXMpIHtcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAobmV3IERhdGUoKSk7XG4gICAgICBjb25zdCBmaWxlTGFiZWwgPSBsYWJlbCA/IGAke2xhYmVsLnRvTG93ZXJDYXNlKCl9LSR7dGltZXN0YW1wfWAgOiB0aW1lc3RhbXA7XG4gICAgICBjb25zdCByZXF1ZXN0ZWRQYXRoID0gYCR7c2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyfS8ke2ZpbGVMYWJlbH0ubWRgO1xuICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKHJlcXVlc3RlZFBhdGgpO1xuICAgICAgY29uc3QgZGlzcGxheVRpbWVzdGFtcCA9IGZvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpO1xuICAgICAgY29uc3QgYm9keSA9IFtcbiAgICAgICAgYCMgJHt0aXRsZX0gJHtkaXNwbGF5VGltZXN0YW1wfWAsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGAjIyBXaW5kb3dgLFxuICAgICAgICBlZmZlY3RpdmVMb29rYmFja0RheXMgPT09IDEgPyBcIlRvZGF5XCIgOiBgTGFzdCAke2VmZmVjdGl2ZUxvb2tiYWNrRGF5c30gZGF5c2AsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIHN1bW1hcnkudHJpbSgpLFxuICAgICAgXS5qb2luKFwiXFxuXCIpO1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBib2R5KTtcbiAgICAgIHBlcnNpc3RlZFBhdGggPSBwYXRoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBzdW1tYXJ5LFxuICAgICAgcGVyc2lzdGVkUGF0aCxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHRpdGxlLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RSZWNlbnRGaWxlcyhcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBsb29rYmFja0RheXM6IG51bWJlcixcbiAgKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGZpbGUuc3RhdC5tdGltZSA+PSBjdXRvZmYpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5czogbnVtYmVyKTogRGF0ZSB7XG4gIGNvbnN0IHNhZmVEYXlzID0gTWF0aC5tYXgoMSwgbG9va2JhY2tEYXlzKTtcbiAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZSgpO1xuICBzdGFydC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgc3RhcnQuc2V0RGF0ZShzdGFydC5nZXREYXRlKCkgLSAoc2FmZURheXMgLSAxKSk7XG4gIHJldHVybiBzdGFydDtcbn1cbiIsICJmdW5jdGlvbiBjbGVhblN1bW1hcnlMaW5lKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiAodGV4dCA/PyBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VGFza1NlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+KTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIFwiLSBObyByZWNlbnQgdGFza3MgZm91bmQuXCI7XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gWyBdICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGlnaGxpZ2h0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0YXNrcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGhpZ2hsaWdodHMuYWRkKGNsZWFuU3VtbWFyeUxpbmUoaGVhZGluZ1sxXSkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBjbGVhblN1bW1hcnlMaW5lKHRhc2tbMl0pO1xuICAgICAgdGFza3MuYWRkKHRleHQpO1xuICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBjbGVhblN1bW1hcnlMaW5lKGJ1bGxldFsyXSk7XG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBoaWdobGlnaHRzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChoaWdobGlnaHRzLnNpemUgPCA1ICYmIGxpbmUubGVuZ3RoIDw9IDE0MCkge1xuICAgICAgaGlnaGxpZ2h0cy5hZGQoY2xlYW5TdW1tYXJ5TGluZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihoaWdobGlnaHRzLCBcIk5vIHJlY2VudCBub3RlcyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgZm9ybWF0VGFza1NlY3Rpb24odGFza3MpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vdGhpbmcgcGVuZGluZyBmcm9tIHJlY2VudCBub3Rlcy5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1N5bnRoZXNpcyB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tEZWNpc2lvbkV4dHJhY3Rpb24gfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnMgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja0NsZWFuTm90ZSB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmIH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1ub3JtYWxpemVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNSZXN1bHQge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbm90ZVRpdGxlOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICBwcm9tcHRUZXh0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3ludGhlc2lzU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBydW4odGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gdGhpcy5idWlsZEZhbGxiYWNrKHRlbXBsYXRlLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgc3VtbWFyaWVzIGFyZSBlbmFibGVkIGJ1dCBPcGVuQUkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5zeW50aGVzaXplQ29udGV4dCh0ZW1wbGF0ZSwgY29udGV4dCwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCBzeW50aGVzaXNcIik7XG4gICAgICAgICAgY29udGVudCA9IGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSksXG4gICAgICB0aXRsZTogZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSksXG4gICAgICBub3RlVGl0bGU6IGAke2NvbnRleHQuc291cmNlTGFiZWx9ICR7Z2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSl9YCxcbiAgICAgIGNvbnRlbnQ6IHRoaXMubm9ybWFsaXplKHRlbXBsYXRlLCBjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEZhbGxiYWNrKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbih0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnModGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja0NsZWFuTm90ZSh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZih0ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbGRGYWxsYmFja1N5bnRoZXNpcyh0ZXh0KTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dChjb250ZW50KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGFkZFN1bW1hcnlMaW5lKFxuICBzdW1tYXJ5OiBTZXQ8c3RyaW5nPixcbiAgdGV4dDogc3RyaW5nLFxuICBtYXhJdGVtcyA9IDQsXG4pOiB2b2lkIHtcbiAgaWYgKHN1bW1hcnkuc2l6ZSA+PSBtYXhJdGVtcykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gIGlmICghY2xlYW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN1bW1hcnkuYWRkKGNsZWFuZWQpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3VtbWFyeSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0aGVtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgdGhlbWVzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBoZWFkaW5nVGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgZm9sbG93VXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB0aGVtZXMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIHRhc2tUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICB0aGVtZXMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgYnVsbGV0VGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGZvbGxvd1Vwcy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuXG4gICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgbGluZSk7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHN1bW1hcnksIFwiTm8gc291cmNlIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGhlbWVzLCBcIk5vIGtleSB0aGVtZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3ludGhlc2lzU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBwYXJzZWQuc3VtbWFyeSB8fCBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgcGFyc2VkLmtleVRoZW1lcyB8fCBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFN1bW1hcnlcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgXCJObyBrZXkgdGhlbWVzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN5bnRoZXNpc1NlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBrZXlUaGVtZXM6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiU3VtbWFyeVwiIHwgXCJLZXkgVGhlbWVzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFN1bW1hcnk6IFtdLFxuICAgIFwiS2V5IFRoZW1lc1wiOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoU3VtbWFyeXxLZXkgVGhlbWVzfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLlN1bW1hcnldKSxcbiAgICBrZXlUaGVtZXM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIktleSBUaGVtZXNcIl0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgU3VtbWFyeTogc3RyaW5nW107XG4gIFwiS2V5IFRoZW1lc1wiOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImtleSB0aGVtZXNcIikge1xuICAgIHJldHVybiBcIktleSBUaGVtZXNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiU3VtbWFyeVwiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgMTApXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGNvbnRleHQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICB0YXNrcy5hZGQodGFza1RleHQpO1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBjb250ZXh0LmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpO1xuICAgICAgaWYgKHF1ZXN0aW9uKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHRhc2tzLCBcIk5vIHRhc2tzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRhc2tFeHRyYWN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgcGFyc2VkLmNvbnRleHQgfHwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRhc2tFeHRyYWN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICB0YXNrczogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIlRhc2tzXCIgfCBcIkNvbnRleHRcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgVGFza3M6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhUYXNrc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0YXNrczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlRhc2tzKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkNvbnRleHRdKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFRhc2tzOiBzdHJpbmdbXTtcbiAgQ29udGV4dDogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJjb250ZXh0XCIpIHtcbiAgICByZXR1cm4gXCJDb250ZXh0XCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlRhc2tzXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCAxMClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZVJhdGlvbmFsZSh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJiZWNhdXNlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzbyB0aGF0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkdWUgdG9cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInJlYXNvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidHJhZGVvZmZcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImNvbnN0cmFpbnRcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRGVjaXNpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZGVjaWRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpc2lvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY2hvb3NlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaGlwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJhZG9wdFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZHJvcFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic3dpdGNoXCIpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGRlY2lzaW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCByYXRpb25hbGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlRGVjaXNpb24odGV4dCkpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKHRleHQpKSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlRGVjaXNpb24odGV4dCkpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKHRleHQpKSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGRlY2lzaW9ucy5zaXplIDwgMykge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlRGVjaXNpb24obGluZSkpIHtcbiAgICAgIGRlY2lzaW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUobGluZSkpIHtcbiAgICAgIHJhdGlvbmFsZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGRlY2lzaW9ucywgXCJObyBjbGVhciBkZWNpc2lvbnMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihyYXRpb25hbGUsIFwiTm8gZXhwbGljaXQgcmF0aW9uYWxlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRGVjaXNpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgcGFyc2VkLmRlY2lzaW9ucyB8fCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIHBhcnNlZC5yYXRpb25hbGUgfHwgXCJObyByYXRpb25hbGUgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgXCJObyByYXRpb25hbGUgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZURlY2lzaW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBkZWNpc2lvbnM6IHN0cmluZztcbiAgcmF0aW9uYWxlOiBzdHJpbmc7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJEZWNpc2lvbnNcIiB8IFwiUmF0aW9uYWxlXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBEZWNpc2lvbnM6IFtdLFxuICAgIFJhdGlvbmFsZTogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhEZWNpc2lvbnN8UmF0aW9uYWxlfE9wZW4gUXVlc3Rpb25zKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGVjaXNpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkRlY2lzaW9uc10pLFxuICAgIHJhdGlvbmFsZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlJhdGlvbmFsZSksXG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIERlY2lzaW9uczogc3RyaW5nW107XG4gIFJhdGlvbmFsZTogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwicmF0aW9uYWxlXCIpIHtcbiAgICByZXR1cm4gXCJSYXRpb25hbGVcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICByZXR1cm4gXCJEZWNpc2lvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDEwKVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlUXVlc3Rpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmVuZHNXaXRoKFwiP1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicXVlc3Rpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVuY2xlYXJcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVua25vd25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5vdCBzdXJlXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZUZvbGxvd1VwKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImZvbGxvdyB1cFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmV4dCBzdGVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJpbnZlc3RpZ2F0ZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uZmlybVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidmFsaWRhdGVcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tPcGVuUXVlc3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUgfHwgbGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24odGV4dCkpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24odGV4dCkpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuc2l6ZSA8IDYpIHtcbiAgICAgICAgY29udGV4dC5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlRm9sbG93VXAodGV4dCkpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbihsaW5lKSkge1xuICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zaXplIDwgNCkge1xuICAgICAgY29udGV4dC5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIENvbnRleHRcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihjb250ZXh0LCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZU9wZW5RdWVzdGlvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgcGFyc2VkLmNvbnRleHQgfHwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU9wZW5RdWVzdGlvblNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk9wZW4gUXVlc3Rpb25zXCIgfCBcIkNvbnRleHRcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgICBDb250ZXh0OiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3BlbiBRdWVzdGlvbnN8Q29udGV4dHxGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdXSksXG4gICAgY29udGV4dDogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkNvbnRleHQpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbiAgQ29udGV4dDogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJjb250ZXh0XCIpIHtcbiAgICByZXR1cm4gXCJDb250ZXh0XCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5UG9pbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgcXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oa2V5UG9pbnRzLCBcIk5vIGtleSBwb2ludHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUNsZWFuTm90ZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgcGFyc2VkLmtleVBvaW50cyB8fCBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBrZXlQb2ludHM6IHN0cmluZztcbiAgcXVlc3Rpb25zOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiS2V5IFBvaW50c1wiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIFwiS2V5IFBvaW50c1wiOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEtleSBQb2ludHN8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGtleVBvaW50czogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFBvaW50c1wiXSksXG4gICAgcXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBcIktleSBQb2ludHNcIjogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHBvaW50c1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFBvaW50c1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tQcm9qZWN0QnJpZWYoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZ29hbHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgc2NvcGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmV4dFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIHNjb3BlLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIG5leHRTdGVwcy5hZGQodGFza1RleHQpO1xuICAgICAgICBnb2Fscy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIHNjb3BlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZUdvYWwoYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBnb2Fscy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VHb2FsKGxpbmUpKSB7XG4gICAgICBnb2Fscy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEdvYWxzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZ29hbHMsIFwiTm8gZ29hbHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTY29wZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHNjb3BlLCBcIk5vIHNjb3BlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG5leHRTdGVwcywgXCJObyBuZXh0IHN0ZXBzIGZvdW5kLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VHb2FsKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZ29hbCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZ29hbHMgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5lZWQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5lZWRzIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ3YW50IFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ3YW50cyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNob3VsZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm11c3QgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJvYmplY3RpdmVcIilcbiAgKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlUHJvamVjdEJyaWVmU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgcGFyc2VkLmdvYWxzIHx8IFwiTm8gZ29hbHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgIHBhcnNlZC5zY29wZSB8fCBcIk5vIHNjb3BlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIHBhcnNlZC5uZXh0U3RlcHMgfHwgXCJObyBuZXh0IHN0ZXBzIGV4dHJhY3RlZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgR29hbHNcIixcbiAgICBcIk5vIGdvYWxzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgU2NvcGVcIixcbiAgICBcIk5vIHNjb3BlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIFwiTm8gbmV4dCBzdGVwcyBleHRyYWN0ZWQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQcm9qZWN0QnJpZWZTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGdvYWxzOiBzdHJpbmc7XG4gIHNjb3BlOiBzdHJpbmc7XG4gIG5leHRTdGVwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk92ZXJ2aWV3XCIgfCBcIkdvYWxzXCIgfCBcIlNjb3BlXCIgfCBcIk5leHQgU3RlcHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBHb2FsczogW10sXG4gICAgU2NvcGU6IFtdLFxuICAgIFwiTmV4dCBTdGVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPdmVydmlld3xHb2Fsc3xTY29wZXxOZXh0IFN0ZXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBnb2FsczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkdvYWxzKSxcbiAgICBzY29wZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlNjb3BlKSxcbiAgICBuZXh0U3RlcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk5leHQgU3RlcHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIE92ZXJ2aWV3OiBzdHJpbmdbXTtcbiAgR29hbHM6IHN0cmluZ1tdO1xuICBTY29wZTogc3RyaW5nW107XG4gIFwiTmV4dCBTdGVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJnb2Fsc1wiKSB7XG4gICAgcmV0dXJuIFwiR29hbHNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJzY29wZVwiKSB7XG4gICAgcmV0dXJuIFwiU2NvcGVcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJuZXh0IHN0ZXBzXCIpIHtcbiAgICByZXR1cm4gXCJOZXh0IFN0ZXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiVGFzayBFeHRyYWN0aW9uXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgIHJldHVybiBcIkRlY2lzaW9uIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgcmV0dXJuIFwiQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIlByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcnlcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlKTogc3RyaW5nIHtcbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgVGFza3NcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBEZWNpc2lvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IE9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJSZXdyaXRlIGFzIENsZWFuIE5vdGVcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICByZXR1cm4gXCJEcmFmdCBQcm9qZWN0IEJyaWVmXCI7XG4gIH1cblxuICByZXR1cm4gXCJTdW1tYXJpemVcIjtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1RvcGljUGFnZSB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBUb3BpY1BhZ2VTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZSh0b3BpYzogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWRUb3BpYyA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyk7XG4gICAgaWYgKCFjbGVhbmVkVG9waWMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvcGljIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgICBjb250ZXh0LnRleHQsXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgdG9waWMgcGFnZXMgYXJlIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZShjbGVhbmVkVG9waWMsIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgdG9waWMgcGFnZSBnZW5lcmF0aW9uXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gZW5zdXJlVG9waWNCdWxsZXQoXG4gICAgICBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudCksXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiVG9waWMgUGFnZVwiLFxuICAgICAgdGl0bGU6IFwiVG9waWMgUGFnZVwiLFxuICAgICAgbm90ZVRpdGxlOiBzaG9ydGVuVG9waWMoY2xlYW5lZFRvcGljKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50LFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogY2xlYW5lZFRvcGljLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlVG9waWNCdWxsZXQoY29udGVudDogc3RyaW5nLCB0b3BpYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBvdmVydmlld0luZGV4ID0gbGluZXMuZmluZEluZGV4KChsaW5lKSA9PiAvXiMjXFxzK092ZXJ2aWV3XFxzKiQvLnRlc3QobGluZSkpO1xuICBpZiAob3ZlcnZpZXdJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IG5leHRIZWFkaW5nSW5kZXggPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgKGxpbmUsIGluZGV4KSA9PiBpbmRleCA+IG92ZXJ2aWV3SW5kZXggJiYgL14jI1xccysvLnRlc3QobGluZSksXG4gICk7XG4gIGNvbnN0IHRvcGljTGluZSA9IGAtIFRvcGljOiAke25vcm1hbGl6ZWRUb3BpY31gO1xuICBjb25zdCBvdmVydmlld1NsaWNlID0gbGluZXMuc2xpY2UoXG4gICAgb3ZlcnZpZXdJbmRleCArIDEsXG4gICAgbmV4dEhlYWRpbmdJbmRleCA9PT0gLTEgPyBsaW5lcy5sZW5ndGggOiBuZXh0SGVhZGluZ0luZGV4LFxuICApO1xuICBpZiAob3ZlcnZpZXdTbGljZS5zb21lKChsaW5lKSA9PiBsaW5lLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCItIHRvcGljOlwiKSkpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGluc2VydGlvbkluZGV4ID0gb3ZlcnZpZXdJbmRleCArIDE7XG4gIGNvbnN0IHVwZGF0ZWQgPSBbLi4ubGluZXNdO1xuICB1cGRhdGVkLnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgdG9waWNMaW5lKTtcbiAgcmV0dXJuIHVwZGF0ZWQuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2hvcnRlblRvcGljKHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gdG9waWMudHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgVG9waWMgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VPcGVuUXVlc3Rpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmVuZHNXaXRoKFwiP1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicXVlc3Rpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVuY2xlYXJcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm9wZW4gaXNzdWVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVua25vd25cIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlTmV4dFN0ZXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZXh0IFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJmb2xsb3cgdXBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZm9sbG93LXVwXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcInRvZG8gXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcInRvLWRvIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hvdWxkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmVlZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5lZWRzIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibXVzdCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFjdGlvblwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRTb3VyY2VzKFxuICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBzb3VyY2VQYXRoczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgaWYgKHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2Ygc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpKSB7XG4gICAgICBzb3VyY2VzLmFkZChwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoc291cmNlUGF0aHMubGVuZ3RoID4gMTIpIHtcbiAgICAgIHNvdXJjZXMuYWRkKGAuLi5hbmQgJHtzb3VyY2VQYXRocy5sZW5ndGggLSAxMn0gbW9yZWApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChzb3VyY2VQYXRoKSB7XG4gICAgc291cmNlcy5hZGQoc291cmNlUGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgc291cmNlcy5hZGQoc291cmNlTGFiZWwpO1xuICB9XG5cbiAgcmV0dXJuIGZvcm1hdExpc3RTZWN0aW9uKHNvdXJjZXMsIFwiTm8gZXhwbGljaXQgc291cmNlcyBmb3VuZC5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVG9waWNQYWdlKFxuICB0b3BpYzogc3RyaW5nLFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIHNvdXJjZVBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IG92ZXJ2aWV3ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGV2aWRlbmNlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmV4dFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24oaGVhZGluZ1RleHQpKSB7XG4gICAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb29rc0xpa2VOZXh0U3RlcChoZWFkaW5nVGV4dCkpIHtcbiAgICAgICAgICBuZXh0U3RlcHMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgICBuZXh0U3RlcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBldmlkZW5jZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24oYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9va3NMaWtlTmV4dFN0ZXAoYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBuZXh0U3RlcHMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplIDwgNCkge1xuICAgICAgZXZpZGVuY2UuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghbmV4dFN0ZXBzLnNpemUpIHtcbiAgICBuZXh0U3RlcHMuYWRkKFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBgLSBUb3BpYzogJHtzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKX1gLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihldmlkZW5jZSwgXCJObyBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFNvdXJjZXNcIixcbiAgICBmb3JtYXRTb3VyY2VzKHNvdXJjZUxhYmVsLCBzb3VyY2VQYXRoLCBzb3VyY2VQYXRocyksXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihuZXh0U3RlcHMsIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRvcGljUGFnZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBwYXJzZWQuZXZpZGVuY2UgfHwgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICBwYXJzZWQuc291cmNlcyB8fCBcIk5vIHNvdXJjZXMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgcGFyc2VkLm5leHRTdGVwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgU291cmNlc1wiLFxuICAgIFwiTm8gc291cmNlcyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUb3BpY1BhZ2VTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBzdHJpbmc7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbiAgc291cmNlczogc3RyaW5nO1xuICBuZXh0U3RlcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XG4gICAgXCJPdmVydmlld1wiIHwgXCJFdmlkZW5jZVwiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiIHwgXCJTb3VyY2VzXCIgfCBcIk5leHQgU3RlcHNcIixcbiAgICBzdHJpbmdbXVxuICA+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBFdmlkZW5jZTogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgICBTb3VyY2VzOiBbXSxcbiAgICBcIk5leHQgU3RlcHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goXG4gICAgICAvXiMjXFxzKyhPdmVydmlld3xFdmlkZW5jZXxPcGVuIFF1ZXN0aW9uc3xTb3VyY2VzfE5leHQgU3RlcHMpXFxzKiQvaSxcbiAgICApO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBldmlkZW5jZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkV2aWRlbmNlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gICAgc291cmNlczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlNvdXJjZXMpLFxuICAgIG5leHRTdGVwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiTmV4dCBTdGVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBFdmlkZW5jZTogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG4gIFNvdXJjZXM6IHN0cmluZ1tdO1xuICBcIk5leHQgU3RlcHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwic291cmNlc1wiKSB7XG4gICAgcmV0dXJuIFwiU291cmNlc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm5leHQgc3RlcHNcIikge1xuICAgIHJldHVybiBcIk5leHQgU3RlcHNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza1ZhdWx0U2VydmljZSB7XG4gIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPjtcbiAgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBUYXNrU2VydmljZSB7XG4gIHByaXZhdGUgb3BlblRhc2tDb3VudENhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFRhc2tWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUYXNrIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrID0gYC0gWyBdICR7Y2xlYW5lZH0gXyhhZGRlZCAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfSlfYDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHNldHRpbmdzLnRhc2tzRmlsZSwgYmxvY2spO1xuICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy50YXNrc0ZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGdldE9wZW5UYXNrQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHsgdGV4dCwgbXRpbWUsIGV4aXN0cyB9ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHRXaXRoTXRpbWUoc2V0dGluZ3MudGFza3NGaWxlKTtcbiAgICBpZiAoIWV4aXN0cykge1xuICAgICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgJiYgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUubXRpbWUgPT09IG10aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSB0ZXh0XG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gL14tIFxcWyggfHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAhL14tIFxcWyh4fFgpXFxdLy50ZXN0KGxpbmUpKVxuICAgICAgLmxlbmd0aDtcbiAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IHtcbiAgICAgIG10aW1lLFxuICAgICAgY291bnQsXG4gICAgfTtcbiAgICByZXR1cm4gY291bnQ7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyByZXF1ZXN0VXJsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTdW1tYXJ5IH0gZnJvbSBcIi4uL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuXG50eXBlIFJvdXRlTGFiZWwgPSBcIm5vdGVcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBudWxsO1xuXG5pbnRlcmZhY2UgQ2hhdENvbXBsZXRpb25DaG9pY2Uge1xuICBtZXNzYWdlPzoge1xuICAgIGNvbnRlbnQ/OiBzdHJpbmc7XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvblJlc3BvbnNlIHtcbiAgY2hvaWNlcz86IENoYXRDb21wbGV0aW9uQ2hvaWNlW107XG59XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkFJU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBhc3luYyBzdW1tYXJpemUodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHN1bW1hcml6ZSBtYXJrZG93biB2YXVsdCBjb250ZW50LiBSZXNwb25kIHdpdGggY29uY2lzZSBtYXJrZG93biB1c2luZyB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiU3VtbWFyaXplIHRoZSBmb2xsb3dpbmcgdmF1bHQgY29udGVudCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIHRhc2tzLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVTdW1tYXJ5KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVDb250ZXh0KFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHByb21wdCA9IHRoaXMuYnVpbGRQcm9tcHQodGVtcGxhdGUsIGNvbnRleHQpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIHByb21wdCk7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHRlbXBsYXRlLCByZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8Um91dGVMYWJlbD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIkNsYXNzaWZ5IGNhcHR1cmUgdGV4dCBpbnRvIGV4YWN0bHkgb25lIG9mOiBub3RlLCB0YXNrLCBqb3VybmFsLiBSZXR1cm4gb25lIHdvcmQgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJDbGFzc2lmeSB0aGUgZm9sbG93aW5nIHVzZXIgaW5wdXQgYXMgZXhhY3RseSBvbmUgb2Y6XCIsXG4gICAgICAgICAgXCJub3RlXCIsXG4gICAgICAgICAgXCJ0YXNrXCIsXG4gICAgICAgICAgXCJqb3VybmFsXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBvbmx5IG9uZSB3b3JkLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIGNvbnN0IGNsZWFuZWQgPSByZXNwb25zZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY2xlYW5lZCA9PT0gXCJub3RlXCIgfHwgY2xlYW5lZCA9PT0gXCJ0YXNrXCIgfHwgY2xlYW5lZCA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgIHJldHVybiBjbGVhbmVkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGFuc3dlclF1ZXN0aW9uKFxuICAgIHF1ZXN0aW9uOiBzdHJpbmcsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgYW5zd2VyIHF1ZXN0aW9ucyB1c2luZyBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IG9ubHkuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seSBhbmQgZG8gbm90IGludmVudCBmYWN0cy5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJBbnN3ZXIgdGhlIGZvbGxvd2luZyBxdWVzdGlvbiB1c2luZyBvbmx5IHRoZSBjb250ZXh0IGJlbG93LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgYFF1ZXN0aW9uOiAke3F1ZXN0aW9ufWAsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiSWYgdGhlIGNvbnRleHQgaXMgaW5zdWZmaWNpZW50LCBzYXkgc28gZXhwbGljaXRseS5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoXG4gICAgdG9waWM6IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSB0dXJuIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBhIGR1cmFibGUgd2lraSBwYWdlLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBgQ3JlYXRlIGEgdG9waWMgcGFnZSBmb3I6ICR7dG9waWN9YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgYC0gVG9waWM6ICR7dG9waWN9YCxcbiAgICAgICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQga2VlcCB0aGUgcGFnZSByZXVzYWJsZS5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQocmVzcG9uc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q2hhdENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLnBvc3RHZW1pbmlDb21wbGV0aW9uKHNldHRpbmdzLCBtZXNzYWdlcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnBvc3RPcGVuQUlDb21wbGV0aW9uKHNldHRpbmdzLCBtZXNzYWdlcyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RPcGVuQUlDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGlzRGVmYXVsdFVybCA9ICFzZXR0aW5ncy5vcGVuQUlCYXNlVXJsIHx8IHNldHRpbmdzLm9wZW5BSUJhc2VVcmwuaW5jbHVkZXMoXCJhcGkub3BlbmFpLmNvbVwiKTtcbiAgICBpZiAoaXNEZWZhdWx0VXJsICYmICFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgQVBJIGtleSBpcyBtaXNzaW5nXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9O1xuXG4gICAgaWYgKHNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICAgIGhlYWRlcnNbXCJBdXRob3JpemF0aW9uXCJdID0gYEJlYXJlciAke3NldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCl9YDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogc2V0dGluZ3Mub3BlbkFJQmFzZVVybC50cmltKCkgfHwgXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxL2NoYXQvY29tcGxldGlvbnNcIixcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtb2RlbDogc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpLFxuICAgICAgICBtZXNzYWdlcyxcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuMixcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgY29uc3QganNvbiA9IHJlc3VsdC5qc29uIGFzIENoYXRDb21wbGV0aW9uUmVzcG9uc2U7XG4gICAgY29uc3QgY29udGVudCA9IGpzb24uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50ID8/IFwiXCI7XG4gICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbkFJIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RHZW1pbmlDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VtaW5pIEFQSSBrZXkgaXMgbWlzc2luZ1wiKTtcbiAgICB9XG5cbiAgICBjb25zdCBzeXN0ZW1NZXNzYWdlID0gbWVzc2FnZXMuZmluZCgobSkgPT4gbS5yb2xlID09PSBcInN5c3RlbVwiKTtcbiAgICBjb25zdCB1c2VyTWVzc2FnZXMgPSBtZXNzYWdlcy5maWx0ZXIoKG0pID0+IG0ucm9sZSAhPT0gXCJzeXN0ZW1cIik7XG5cbiAgICAvLyBDb252ZXJ0IE9wZW5BSSBtZXNzYWdlcyB0byBHZW1pbmkgZm9ybWF0XG4gICAgY29uc3QgY29udGVudHMgPSB1c2VyTWVzc2FnZXMubWFwKChtKSA9PiAoe1xuICAgICAgcm9sZTogbS5yb2xlID09PSBcInVzZXJcIiA/IFwidXNlclwiIDogXCJtb2RlbFwiLFxuICAgICAgcGFydHM6IFt7IHRleHQ6IG0uY29udGVudCB9XSxcbiAgICB9KSk7XG5cbiAgICBjb25zdCBib2R5OiBhbnkgPSB7XG4gICAgICBjb250ZW50cyxcbiAgICAgIGdlbmVyYXRpb25Db25maWc6IHtcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuMixcbiAgICAgICAgbWF4T3V0cHV0VG9rZW5zOiAyMDQ4LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgaWYgKHN5c3RlbU1lc3NhZ2UpIHtcbiAgICAgIGJvZHkuc3lzdGVtX2luc3RydWN0aW9uID0ge1xuICAgICAgICBwYXJ0czogW3sgdGV4dDogc3lzdGVtTWVzc2FnZS5jb250ZW50IH1dLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvJHtzZXR0aW5ncy5nZW1pbmlNb2RlbH06Z2VuZXJhdGVDb250ZW50P2tleT0ke3NldHRpbmdzLmdlbWluaUFwaUtleX1gLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzdWx0Lmpzb247XG4gICAgY29uc3QgY29udGVudCA9IGpzb24uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0ID8/IFwiXCI7XG4gICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VtaW5pIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkUHJvbXB0KFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+IHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCBhY3Rpb25hYmxlIHRhc2tzIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCB0YXNrcyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIGl0ZW1zLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgcmV3cml0ZSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gYSBjbGVhbiBtYXJrZG93biBub3RlLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJSZXdyaXRlIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHRoZSBzdHJ1Y3R1cmUgb2YgYSByZXVzYWJsZSBub3RlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IGRlY2lzaW9ucyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3QgZGVjaXNpb25zIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSB1bmNlcnRhaW50eSB3aGVyZSBjb250ZXh0IGlzIGluY29tcGxldGUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCB1bnJlc29sdmVkIHF1ZXN0aW9ucyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3Qgb3BlbiBxdWVzdGlvbnMgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQga2VlcCB1bmNlcnRhaW50eSBleHBsaWNpdC5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBkcmFmdCBhIHByb2plY3QgYnJpZWYgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJEcmFmdCB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICAgICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICAgICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBwcm9qZWN0IHN0cnVjdHVyZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgdHVybiBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gY29uY2lzZSBtYXJrZG93biBzeW50aGVzaXMuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiU3VtbWFyaXplIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgaXRlbXMuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgcmVzcG9uc2U6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVN1bW1hcnlTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgIHBhcnNlZC5oaWdobGlnaHRzIHx8IFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIHBhcnNlZC50YXNrcyB8fCBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHJlY2VudCBub3Rlcy5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN1bW1hcnlTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGhpZ2hsaWdodHM6IHN0cmluZztcbiAgdGFza3M6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiSGlnaGxpZ2h0c1wiIHwgXCJUYXNrc1wiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBIaWdobGlnaHRzOiBbXSxcbiAgICBUYXNrczogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKEhpZ2hsaWdodHN8VGFza3N8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGhpZ2hsaWdodHM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuSGlnaGxpZ2h0c10pLFxuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgSGlnaGxpZ2h0czogc3RyaW5nW107XG4gIFRhc2tzOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcInRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJUYXNrc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJIaWdobGlnaHRzXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dExvY2F0aW9uKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmcge1xuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBjb3VudCA9IGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoO1xuICAgIHJldHVybiBgJHtjb250ZXh0LnNvdXJjZUxhYmVsfSBcdTIwMjIgJHtjb3VudH0gJHtjb3VudCA9PT0gMSA/IFwiZmlsZVwiIDogXCJmaWxlc1wifWA7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgcmV0dXJuIGAke2NvbnRleHQuc291cmNlTGFiZWx9IFx1MjAyMiAke2NvbnRleHQuc291cmNlUGF0aH1gO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQuc291cmNlTGFiZWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICBjb25zdCBsaW5lcyA9IFtgQ29udGV4dCBzb3VyY2U6ICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXTtcblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgbGluZXMucHVzaChgQ29udGV4dCBwYXRoOiAke2NvbnRleHQuc291cmNlUGF0aH1gKTtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goXCJDb250ZXh0IGZpbGVzOlwiKTtcbiAgICBjb25zdCB2aXNpYmxlID0gY29udGV4dC5zb3VyY2VQYXRocy5zbGljZSgwLCAxMik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHZpc2libGUpIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gJHtwYXRofWApO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IHZpc2libGUubGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtIC4uLmFuZCAke2NvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoIC0gdmlzaWJsZS5sZW5ndGh9IG1vcmVgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29udGV4dC50cnVuY2F0ZWQpIHtcbiAgICBsaW5lcy5wdXNoKFxuICAgICAgYENvbnRleHQgd2FzIHRydW5jYXRlZCB0byAke2NvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9LmAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICBjb25zdCBsaW5lcyA9IFtgU291cmNlOiAke2NvbnRleHQuc291cmNlTGFiZWx9YF07XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIGxpbmVzLnB1c2goYFNvdXJjZSBwYXRoOiAke2NvbnRleHQuc291cmNlUGF0aH1gKTtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goXCJTb3VyY2UgZmlsZXM6XCIpO1xuICAgIGNvbnN0IHZpc2libGUgPSBjb250ZXh0LnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdmlzaWJsZSkge1xuICAgICAgbGluZXMucHVzaChwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiB2aXNpYmxlLmxlbmd0aCkge1xuICAgICAgbGluZXMucHVzaChgLi4uYW5kICR7Y29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggLSB2aXNpYmxlLmxlbmd0aH0gbW9yZWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb250ZXh0LnRydW5jYXRlZCkge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBgQ29udGV4dCB0cnVuY2F0ZWQgdG8gJHtjb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbGluZXM7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlLCBPYnNpZGlhblByb3RvY29sRGF0YSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkF1dGhTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IEJyYWluUGx1Z2luKSB7fVxuXG4gIHJlZ2lzdGVyUHJvdG9jb2woKSB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJPYnNpZGlhblByb3RvY29sKFwiYnJhaW4tYXV0aFwiLCBhc3luYyAoZGF0YTogT2JzaWRpYW5Qcm90b2NvbERhdGEpID0+IHtcbiAgICAgIGNvbnN0IHsgcHJvdmlkZXIsIHRva2VuIH0gPSBkYXRhO1xuXG4gICAgICBpZiAoIXByb3ZpZGVyIHx8ICF0b2tlbikge1xuICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW46IEludmFsaWQgYXV0aGVudGljYXRpb24gZGF0YSByZWNlaXZlZFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJvdmlkZXIgPT09IFwib3BlbmFpXCIpIHtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5ID0gdG9rZW47XG4gICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbjogT3BlbkFJIGF1dGhlbnRpY2F0ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuICAgICAgfSBlbHNlIGlmIChwcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkgPSB0b2tlbjtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluOiBHZW1pbmkgYXV0aGVudGljYXRlZCBzdWNjZXNzZnVsbHlcIik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgLy8gRm9yY2UgcmVmcmVzaCBzZXR0aW5ncyB0YWIgaWYgb3BlblxuICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiYnJhaW46c2V0dGluZ3MtdXBkYXRlZFwiKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGxvZ2luKHByb3ZpZGVyOiBcIm9wZW5haVwiIHwgXCJnZW1pbmlcIikge1xuICAgIC8vIEluIGEgcmVhbCBPQXV0aCBmbG93LCB0aGlzIHdvdWxkIHBvaW50IHRvIGEgYmFja2VuZCB0aGF0IGhhbmRsZXMgdGhlIHJlZGlyZWN0XG4gICAgLy8gRm9yIG5vdywgd2UgcG9pbnQgdG8gdGhlIHByb3ZpZGVyJ3MgYXV0aCBwYWdlIG9yIGEgaGVscGVyIHRvb2xcbiAgICBsZXQgdXJsID0gXCJcIjtcbiAgICBpZiAocHJvdmlkZXIgPT09IFwib3BlbmFpXCIpIHtcbiAgICAgIHVybCA9IFwiaHR0cHM6Ly9wbGF0Zm9ybS5vcGVuYWkuY29tL2FwaS1rZXlzXCI7IC8vIEZhbGxiYWNrIGlmIG5vIE9BdXRoXG4gICAgICBuZXcgTm90aWNlKFwiUGxlYXNlIGNyZWF0ZSBhbiBBUEkga2V5IGFuZCB0aGUgcGx1Z2luIHdpbGwgZ3VpZGUgeW91LlwiKTtcbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgICB1cmwgPSBcImh0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvYXBpa2V5XCI7IC8vIEZhbGxiYWNrIGZvciBHZW1pbmlcbiAgICAgIG5ldyBOb3RpY2UoXCJPcGVuaW5nIEdlbWluaSBBUEkgS2V5IHBhZ2UuLi5cIik7XG4gICAgfVxuXG4gICAgd2luZG93Lm9wZW4odXJsKTtcbiAgfVxufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgVEFic3RyYWN0RmlsZSxcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLmpvdXJuYWxGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLm5vdGVzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLnJldmlld3NGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihzZXR0aW5ncy5pbmJveEZpbGUpKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIoc2V0dGluZ3MudGFza3NGaWxlKSk7XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoY3VycmVudCk7XG4gICAgICB9IGVsc2UgaWYgKCEoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmb2xkZXI6ICR7Y3VycmVudH1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGluaXRpYWxDb250ZW50ID0gXCJcIik6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIHJldHVybiBleGlzdGluZztcbiAgICB9XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmaWxlOiAke25vcm1hbGl6ZWR9YCk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKG5vcm1hbGl6ZWQpKTtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vcm1hbGl6ZWQsIGluaXRpYWxDb250ZW50KTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICBtdGltZTogMCxcbiAgICAgICAgZXhpc3RzOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQ6IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSksXG4gICAgICBtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuICAgICAgZXhpc3RzOiB0cnVlLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IGN1cnJlbnQubGVuZ3RoID09PSAwXG4gICAgICA/IFwiXCJcbiAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblxcblwiKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgICAgICAgPyBcIlxcblwiXG4gICAgICAgICAgOiBcIlxcblxcblwiO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgJHtjdXJyZW50fSR7c2VwYXJhdG9yfSR7bm9ybWFsaXplZENvbnRlbnR9YCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbm9ybWFsaXplZENvbnRlbnQpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlVW5pcXVlRmlsZVBhdGgoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBkb3RJbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3RJbmRleCA9PT0gLTEgPyBub3JtYWxpemVkIDogbm9ybWFsaXplZC5zbGljZSgwLCBkb3RJbmRleCk7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZG90SW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoZG90SW5kZXgpO1xuXG4gICAgbGV0IGNvdW50ZXIgPSAyO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2NvdW50ZXJ9JHtleHRlbnNpb259YDtcbiAgICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICAgIGNvdW50ZXIgKz0gMTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBhcHBlbmRKb3VybmFsSGVhZGVyKGZpbGVQYXRoOiBzdHJpbmcsIGRhdGVLZXk6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoLCBgIyAke2RhdGVLZXl9XFxuXFxuYCk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAjICR7ZGF0ZUtleX1cXG5cXG5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBsaXN0TWFya2Rvd25GaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcmVudEZvbGRlcihmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICBjb25zdCBpbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpO1xuICByZXR1cm4gaW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgdHJpbVRyYWlsaW5nTmV3bGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5pbnRlcmZhY2UgUHJvbXB0TW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgcGxhY2Vob2xkZXI/OiBzdHJpbmc7XG4gIHN1Ym1pdExhYmVsPzogc3RyaW5nO1xuICBtdWx0aWxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUHJvbXB0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFByb21wdE1vZGFsT3B0aW9ucykge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUHJvbXB0KCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUpIHtcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgPz8gXCJcIixcbiAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5KSkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5wdXRFbCA9IHRleHRhcmVhO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSBpbnB1dDtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwuZm9jdXMoKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQodGhpcy5vcHRpb25zLnN1Ym1pdExhYmVsID8/IFwiU3VibWl0XCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3VibWl0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gdHJpbVRyYWlsaW5nTmV3bGluZXModGhpcy5pbnB1dEVsLnZhbHVlKS50cmltKCk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZmluaXNoKHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aXRsZVRleHQ6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGJvZHlUZXh0OiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLnRpdGxlVGV4dCB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogdGhpcy5ib2R5VGV4dCxcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW50ZXJmYWNlIEZpbGVHcm91cFBpY2tlck1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBGaWxlUm93IHtcbiAgZmlsZTogVEZpbGU7XG4gIGNoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50O1xuICByb3c6IEhUTUxFbGVtZW50O1xufVxuXG5leHBvcnQgY2xhc3MgRmlsZUdyb3VwUGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogVEZpbGVbXSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIHNlYXJjaElucHV0ITogSFRNTElucHV0RWxlbWVudDtcbiAgcHJpdmF0ZSByb3dzOiBGaWxlUm93W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZpbGVzOiBURmlsZVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogRmlsZUdyb3VwUGlja2VyTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFRGaWxlW10gfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBvbmUgb3IgbW9yZSBub3RlcyB0byB1c2UgYXMgY29udGV4dC5cIixcbiAgICB9KTtcblxuICAgIHRoaXMuc2VhcmNoSW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiRmlsdGVyIG5vdGVzLi4uXCIsXG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmZpbHRlclJvd3ModGhpcy5zZWFyY2hJbnB1dC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1maWxlLWdyb3VwLWxpc3RcIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiB0aGlzLmZpbGVzKSB7XG4gICAgICBjb25zdCByb3cgPSBsaXN0LmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tZmlsZS1ncm91cC1yb3dcIixcbiAgICAgIH0pO1xuICAgICAgY29uc3QgY2hlY2tib3ggPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgdGV4dDogZmlsZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICB0aGlzLnJvd3MucHVzaCh7IGZpbGUsIGNoZWNrYm94LCByb3cgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlVzZSBTZWxlY3RlZFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMucm93c1xuICAgICAgICAuZmlsdGVyKChyb3cpID0+IHJvdy5jaGVja2JveC5jaGVja2VkKVxuICAgICAgICAubWFwKChyb3cpID0+IHJvdy5maWxlKTtcbiAgICAgIGlmICghc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG5vdGVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmluaXNoKHNlbGVjdGVkKTtcbiAgICB9KTtcblxuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyUm93cyh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcXVlcnkgPSB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gIXF1ZXJ5IHx8IHJvdy5maWxlLnBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSk7XG4gICAgICByb3cucm93LnN0eWxlLmRpc3BsYXkgPSBtYXRjaCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChmaWxlczogVEZpbGVbXSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKGZpbGVzKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEluYm94RW50cnksIEluYm94RW50cnlJZGVudGl0eSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld1NlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LXNlcnZpY2VcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbnR5cGUgUmV2aWV3QWN0aW9uID0gXCJrZWVwXCIgfCBcInRhc2tcIiB8IFwiam91cm5hbFwiIHwgXCJub3RlXCIgfCBcInNraXBcIjtcblxuZXhwb3J0IGNsYXNzIEluYm94UmV2aWV3TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgY3VycmVudEluZGV4ID0gMDtcbiAgcHJpdmF0ZSByZWFkb25seSBoYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5hbHRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGlmICh0YXJnZXQgJiYgKHRhcmdldC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgdGFyZ2V0LnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBrZXlUb0FjdGlvbihldmVudC5rZXkpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB2b2lkIHRoaXMuaGFuZGxlQWN0aW9uKGFjdGlvbik7XG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBlbnRyaWVzOiBJbmJveEVudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdTZXJ2aWNlOiBSZXZpZXdTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb25BY3Rpb25Db21wbGV0ZT86IChtZXNzYWdlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvY2VzcyBJbmJveFwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIk5vIGluYm94IGVudHJpZXMgZm91bmQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIHRleHQ6IGBFbnRyeSAke3RoaXMuY3VycmVudEluZGV4ICsgMX0gb2YgJHt0aGlzLmVudHJpZXMubGVuZ3RofWAsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBlbnRyeS5oZWFkaW5nIHx8IFwiVW50aXRsZWQgZW50cnlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgZW50cnkpXCIsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIGFuIGFjdGlvbiBmb3IgdGhpcyBlbnRyeS4gU2hvcnRjdXRzOiBrIGtlZXAsIHQgdGFzaywgaiBqb3VybmFsLCBuIG5vdGUsIHMgc2tpcC5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvblJvdyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiS2VlcCBpbiBpbmJveFwiLCBcImtlZXBcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIkNvbnZlcnQgdG8gdGFza1wiLCBcInRhc2tcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIkFwcGVuZCB0byBqb3VybmFsXCIsIFwiam91cm5hbFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiUHJvbW90ZSB0byBub3RlXCIsIFwibm90ZVwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiU2tpcFwiLCBcInNraXBcIik7XG4gIH1cblxuICBwcml2YXRlIGFkZEJ1dHRvbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nLCBhY3Rpb246IFJldmlld0FjdGlvbik6IHZvaWQge1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IGFjdGlvbiA9PT0gXCJub3RlXCIgPyBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiIDogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IGxhYmVsLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuaGFuZGxlQWN0aW9uKGFjdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZUFjdGlvbihhY3Rpb246IFJldmlld0FjdGlvbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZXNzYWdlID0gXCJcIjtcbiAgICAgIGlmIChhY3Rpb24gPT09IFwidGFza1wiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UucHJvbW90ZVRvVGFzayhlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5hcHBlbmRUb0pvdXJuYWwoZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwibm90ZVwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UucHJvbW90ZVRvTm90ZShlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJrZWVwXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5rZWVwRW50cnkoZW50cnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5za2lwRW50cnkoZW50cnkpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5vbkFjdGlvbkNvbXBsZXRlKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vbkFjdGlvbkNvbXBsZXRlKG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcHJvY2VzcyByZXZpZXcgYWN0aW9uXCIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCArPSAxO1xuXG4gICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXggPj0gdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiSW5ib3ggcmV2aWV3IGNvbXBsZXRlXCIpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBwcm9jZXNzIGluYm94IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBrZXlUb0FjdGlvbihrZXk6IHN0cmluZyk6IFJldmlld0FjdGlvbiB8IG51bGwge1xuICBzd2l0Y2ggKGtleS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSBcImtcIjpcbiAgICAgIHJldHVybiBcImtlZXBcIjtcbiAgICBjYXNlIFwidFwiOlxuICAgICAgcmV0dXJuIFwidGFza1wiO1xuICAgIGNhc2UgXCJqXCI6XG4gICAgICByZXR1cm4gXCJqb3VybmFsXCI7XG4gICAgY2FzZSBcIm5cIjpcbiAgICAgIHJldHVybiBcIm5vdGVcIjtcbiAgICBjYXNlIFwic1wiOlxuICAgICAgcmV0dXJuIFwic2tpcFwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKipcbiAqIENlbnRyYWxpemVkIGVycm9yIGhhbmRsaW5nIHV0aWxpdHlcbiAqIFN0YW5kYXJkaXplcyBlcnJvciByZXBvcnRpbmcgYWNyb3NzIHRoZSBwbHVnaW5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yKGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZTtcbiAgbmV3IE5vdGljZShtZXNzYWdlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvckFuZFJldGhyb3coZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiBuZXZlciB7XG4gIHNob3dFcnJvcihlcnJvciwgZGVmYXVsdE1lc3NhZ2UpO1xuICB0aHJvdyBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoZGVmYXVsdE1lc3NhZ2UpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IHR5cGUgUXVlc3Rpb25TY29wZSA9IFwibm90ZVwiIHwgXCJncm91cFwiIHwgXCJmb2xkZXJcIiB8IFwidmF1bHRcIjtcblxuaW50ZXJmYWNlIFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUXVlc3Rpb25TY29wZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFF1ZXN0aW9uU2NvcGUgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8UXVlc3Rpb25TY29wZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIHRoZSBzY29wZSBCcmFpbiBzaG91bGQgdXNlIGZvciB0aGlzIHJlcXVlc3QuXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBOb3RlXCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwibm90ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiU2VsZWN0ZWQgTm90ZXNcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJncm91cFwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBGb2xkZXJcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJmb2xkZXJcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkVudGlyZSBWYXVsdFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInZhdWx0XCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHNjb3BlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUoc2NvcGUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgY2xhc3MgUmV2aWV3SGlzdG9yeU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgSGlzdG9yeVwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyByZXZpZXcgbG9ncyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiT3BlbiBhIGxvZyB0byBpbnNwZWN0IGl0LCBvciByZS1vcGVuIGFuIGluYm94IGl0ZW0gaWYgaXQgd2FzIG1hcmtlZCBpbmNvcnJlY3RseS5cIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5lbnRyaWVzKSB7XG4gICAgICBjb25zdCByb3cgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb25cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGl0ZW1cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgJHtlbnRyeS50aW1lc3RhbXB9IFx1MjAyMiAke2VudHJ5LmFjdGlvbn1gLFxuICAgICAgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgcHJldmlldylcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidXR0b25zID0gcm93LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgIHRleHQ6IFwiT3BlbiBsb2dcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuTG9nKGVudHJ5LnNvdXJjZVBhdGgpO1xuICAgICAgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICB0ZXh0OiBcIlJlLW9wZW5cIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5yZW9wZW5FbnRyeShlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Mb2cocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoYWJzdHJhY3RGaWxlKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnBsdWdpbi5yZW9wZW5SZXZpZXdFbnRyeShlbnRyeSk7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlLW9wZW4gaW5ib3ggZW50cnlcIik7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0TG9jYXRpb24gfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBTeW50aGVzaXNSZXN1bHRNb2RhbE9wdGlvbnMge1xuICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0O1xuICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdDtcbiAgY2FuSW5zZXJ0OiBib29sZWFuO1xuICBvbkluc2VydDogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBvblNhdmU6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgb25BY3Rpb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIFN5bnRoZXNpc1Jlc3VsdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidXR0b25zOiBIVE1MQnV0dG9uRWxlbWVudFtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBTeW50aGVzaXNSZXN1bHRNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBgQnJhaW4gJHt0aGlzLm9wdGlvbnMucmVzdWx0LnRpdGxlfWAgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBBY3Rpb246ICR7dGhpcy5vcHRpb25zLnJlc3VsdC5hY3Rpb259YCxcbiAgICB9KTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc3VsdC5wcm9tcHRUZXh0KSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogYFByb21wdDogJHt0aGlzLm9wdGlvbnMucmVzdWx0LnByb21wdFRleHR9YCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBDb250ZXh0OiAke2Zvcm1hdENvbnRleHRMb2NhdGlvbih0aGlzLm9wdGlvbnMuY29udGV4dCl9YCxcbiAgICB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5jb250ZXh0LnRydW5jYXRlZFxuICAgICAgICA/IGBDb250ZXh0IHRydW5jYXRlZCB0byAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHt0aGlzLm9wdGlvbnMuY29udGV4dC5vcmlnaW5hbExlbmd0aH0uYFxuICAgICAgICA6IGBDb250ZXh0IGxlbmd0aDogJHt0aGlzLm9wdGlvbnMuY29udGV4dC5vcmlnaW5hbExlbmd0aH0gY2hhcmFjdGVycy5gLFxuICAgIH0pO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5yZXN1bHQuY29udGVudCxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FuSW5zZXJ0KSB7XG4gICAgICAvLyBCdXR0b25zIGFyZSByZW5kZXJlZCBiZWxvdyBhZnRlciBvcHRpb25hbCBndWlkYW5jZSB0ZXh0LlxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogXCJPcGVuIGEgbWFya2Rvd24gbm90ZSB0byBpbnNlcnQgdGhpcyBhcnRpZmFjdCB0aGVyZSwgb3Igc2F2ZSBpdCB0byBCcmFpbiBub3Rlcy5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYnV0dG9ucyA9IFtdO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jYW5JbnNlcnQpIHtcbiAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiSW5zZXJ0IGludG8gY3VycmVudCBub3RlXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJ1bkFjdGlvbigoKSA9PiB0aGlzLm9wdGlvbnMub25JbnNlcnQoKSk7XG4gICAgICB9LCB0cnVlKSk7XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25zLnB1c2goXG4gICAgICB0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIlNhdmUgdG8gQnJhaW4gbm90ZXNcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucnVuQWN0aW9uKCgpID0+IHRoaXMub3B0aW9ucy5vblNhdmUoKSk7XG4gICAgICB9KSxcbiAgICAgIHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiQ2xvc2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVCdXR0b24oXG4gICAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgb25DbGljazogKCkgPT4gdm9pZCxcbiAgICBjdGEgPSBmYWxzZSxcbiAgKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHBhcmVudC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IGN0YSA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dCxcbiAgICB9KTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkFjdGlvbihhY3Rpb246ICgpID0+IFByb21pc2U8c3RyaW5nPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLndvcmtpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0QnV0dG9uc0Rpc2FibGVkKHRydWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCBhY3Rpb24oKTtcbiAgICAgIGF3YWl0IHRoaXMub3B0aW9ucy5vbkFjdGlvbkNvbXBsZXRlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHVwZGF0ZSB0aGUgc3ludGhlc2lzIHJlc3VsdFwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZChmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25zRGlzYWJsZWQoZGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiB0aGlzLmJ1dHRvbnMpIHtcbiAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLXRlbXBsYXRlXCI7XG5cbmV4cG9ydCB0eXBlIFN5bnRoZXNpc1RlbXBsYXRlID1cbiAgfCBcInN1bW1hcml6ZVwiXG4gIHwgXCJleHRyYWN0LXRhc2tzXCJcbiAgfCBcImV4dHJhY3QtZGVjaXNpb25zXCJcbiAgfCBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIlxuICB8IFwicmV3cml0ZS1jbGVhbi1ub3RlXCJcbiAgfCBcImRyYWZ0LXByb2plY3QtYnJpZWZcIjtcblxuaW50ZXJmYWNlIFRlbXBsYXRlUGlja2VyT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBUZW1wbGF0ZVBpY2tlck9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBob3cgQnJhaW4gc2hvdWxkIHN5bnRoZXNpemUgdGhpcyBjb250ZXh0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwic3VtbWFyaXplXCIpKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInN1bW1hcml6ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LXRhc2tzXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3QtdGFza3NcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1kZWNpc2lvbnNcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC1kZWNpc2lvbnNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcInJld3JpdGUtY2xlYW4tbm90ZVwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJyZXdyaXRlLWNsZWFuLW5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHRlbXBsYXRlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBJdGVtVmlldywgTm90aWNlLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSByZXN1bHRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGluYm94Q291bnRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHRhc2tDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmV2aWV3SGlzdG9yeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgYWlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGlzTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGNvbGxhcHNlZFNlY3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBCUkFJTl9WSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIkJyYWluXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW5cIjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tc2lkZWJhclwiKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDYXB0dXJlIGlkZWFzLCBzeW50aGVzaXplIGV4cGxpY2l0IGNvbnRleHQsIGFuZCBzYXZlIGR1cmFibGUgbWFya2Rvd24gYXJ0aWZhY3RzLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkQ29sbGFwc2VkU3RhdGUoKTtcbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVBc2tTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVSZXZpZXdTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlU3RhdHVzU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0U2VjdGlvbigpO1xuICAgIHRoaXMucmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBzZXRMYXN0UmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMucmVzdWx0RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIHNldExhc3RTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IFtpbmJveENvdW50LCB0YXNrQ291bnQsIHJldmlld0NvdW50XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMucGx1Z2luLmdldEluYm94Q291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldE9wZW5UYXNrQ291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldFJldmlld0hpc3RvcnlDb3VudCgpLFxuICAgIF0pO1xuICAgIGlmICh0aGlzLmluYm94Q291bnRFbCkge1xuICAgICAgdGhpcy5pbmJveENvdW50RWwuc2V0VGV4dChgJHtpbmJveENvdW50fSB1bnJldmlld2VkIGVudHJpZXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudGFza0NvdW50RWwpIHtcbiAgICAgIHRoaXMudGFza0NvdW50RWwuc2V0VGV4dChgJHt0YXNrQ291bnR9IG9wZW4gdGFza3NgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmV2aWV3SGlzdG9yeUVsKSB7XG4gICAgICB0aGlzLnJldmlld0hpc3RvcnlFbC5zZXRUZXh0KGBSZXZpZXcgaGlzdG9yeTogJHtyZXZpZXdDb3VudH0gZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5haVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLmFpU3RhdHVzRWwuZW1wdHkoKTtcbiAgICAgIGNvbnN0IHN0YXR1c1RleHQgPSB0aGlzLnBsdWdpbi5nZXRBaVN0YXR1c1RleHQoKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQUk6ICR7c3RhdHVzVGV4dH0gYCB9KTtcblxuICAgICAgY29uc3QgaXNDb25uZWN0ZWQgPSBzdGF0dXNUZXh0LmluY2x1ZGVzKFwiY29uZmlndXJlZFwiKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICAgIHRleHQ6IGlzQ29ubmVjdGVkID8gXCJNYW5hZ2VcIiA6IFwiQ29ubmVjdFwiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgLy8gT3BlbiBzZXR0aW5ncyB0YWJcbiAgICAgICAgKHRoaXMuYXBwIGFzIGFueSkuc2V0dGluZy5vcGVuKCk7XG4gICAgICAgICh0aGlzLmFwcCBhcyBhbnkpLnNldHRpbmcub3BlblRhYkJ5SWQodGhpcy5wbHVnaW4ubWFuaWZlc3QuaWQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN1bW1hcnlTdGF0dXNFbCkge1xuICAgICAgdGhpcy5zdW1tYXJ5U3RhdHVzRWwuc2V0VGV4dCh0aGlzLnBsdWdpbi5nZXRMYXN0U3VtbWFyeUxhYmVsKCkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0TG9hZGluZyhsb2FkaW5nOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSBsb2FkaW5nO1xuICAgIGNvbnN0IGJ1dHRvbnMgPSBBcnJheS5mcm9tKHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b24uYnJhaW4tYnV0dG9uXCIpKTtcbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiBidXR0b25zKSB7XG4gICAgICAoYnV0dG9uIGFzIEhUTUxCdXR0b25FbGVtZW50KS5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgfVxuICAgIGlmICh0aGlzLmlucHV0RWwpIHtcbiAgICAgIHRoaXMuaW5wdXRFbC5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWdpc3RlcktleWJvYXJkU2hvcnRjdXRzKCk6IHZvaWQge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkb25seSBoYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5hbHRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGlmICh0YXJnZXQgJiYgKHRhcmdldC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgdGFyZ2V0LnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlIFwiblwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzTm90ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQXNUYXNrKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImpcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVBc0pvdXJuYWwoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY1wiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgICBuZXcgTm90aWNlKFwiQ2FwdHVyZSBjbGVhcmVkXCIpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH07XG5cbiAgcHJpdmF0ZSB0b2dnbGVTZWN0aW9uKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKHNlY3Rpb25JZCkpIHtcbiAgICAgIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuZGVsZXRlKHNlY3Rpb25JZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuYWRkKHNlY3Rpb25JZCk7XG4gICAgfVxuICAgIHRoaXMuc2F2ZUNvbGxhcHNlZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRDb2xsYXBzZWRTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zID0gbmV3IFNldCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBzYXZlQ29sbGFwc2VkU3RhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zID0gQXJyYXkuZnJvbSh0aGlzLmNvbGxhcHNlZFNlY3Rpb25zKTtcbiAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgaWQ6IHN0cmluZyxcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgY29udGVudENyZWF0b3I6IChjb250YWluZXI6IEhUTUxFbGVtZW50KSA9PiB2b2lkLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb24taGVhZGVyXCIgfSk7XG4gICAgY29uc3QgdG9nZ2xlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jb2xsYXBzZS10b2dnbGVcIixcbiAgICAgIHRleHQ6IHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IFwiXHUyNUI2XCIgOiBcIlx1MjVCQ1wiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBcImFyaWEtbGFiZWxcIjogdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gYEV4cGFuZCAke3RpdGxlfWAgOiBgQ29sbGFwc2UgJHt0aXRsZX1gLFxuICAgICAgICBcImFyaWEtZXhwYW5kZWRcIjogKCF0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkpLnRvU3RyaW5nKCksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogdGl0bGUgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IGRlc2NyaXB0aW9uIH0pO1xuXG4gICAgdG9nZ2xlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnRvZ2dsZVNlY3Rpb24oaWQpO1xuICAgICAgY29uc3QgY29udGVudEVsID0gc2VjdGlvbi5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLXNlY3Rpb24tY29udGVudFwiKTtcbiAgICAgIGlmIChjb250ZW50RWwpIHtcbiAgICAgICAgY29udGVudEVsLnRvZ2dsZUF0dHJpYnV0ZShcImhpZGRlblwiKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldFRleHQodGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gXCJcdTI1QjZcIiA6IFwiXHUyNUJDXCIpO1xuICAgICAgICB0b2dnbGVCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBgRXhwYW5kICR7dGl0bGV9YCA6IGBDb2xsYXBzZSAke3RpdGxlfWApO1xuICAgICAgICB0b2dnbGVCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCAoIXRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSkudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb250ZW50ID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvbi1jb250ZW50XCIsXG4gICAgICBhdHRyOiB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyB7IGhpZGRlbjogXCJ0cnVlXCIgfSA6IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgICBjb250ZW50Q3JlYXRvcihjb250ZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ2FwdHVyZVNlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcImNhcHR1cmVcIixcbiAgICAgIFwiUXVpY2sgQ2FwdHVyZVwiLFxuICAgICAgXCJDYXB0dXJlIHJvdWdoIGlucHV0IGludG8gdGhlIHZhdWx0IGJlZm9yZSByZXZpZXcgYW5kIHN5bnRoZXNpcy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgdGhpcy5pbnB1dEVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1jYXB0dXJlLWlucHV0XCIsXG4gICAgICAgICAgYXR0cjoge1xuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiVHlwZSBhIG5vdGUsIHRhc2ssIG9yIGpvdXJuYWwgZW50cnkuLi5cIixcbiAgICAgICAgICAgIHJvd3M6IFwiOFwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDYXB0dXJlIE5vdGUgKG4pXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc05vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNhcHR1cmUgVGFzayAodClcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzVGFzaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2FwdHVyZSBKb3VybmFsIChqKVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNKb3VybmFsKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDbGVhciAoYylcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJDYXB0dXJlIGNsZWFyZWRcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJzeW50aGVzaXNcIixcbiAgICAgIFwiU3ludGhlc2l6ZVwiLFxuICAgICAgXCJUdXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBzdW1tYXJpZXMsIGNsZWFuIG5vdGVzLCB0YXNrcywgYW5kIGJyaWVmcy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgICB0ZXh0OiBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0Q3VycmVudE5vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlLi4uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiRXh0cmFjdCBUYXNrcyBGcm9tIFNlbGVjdGlvblwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRTZWxlY3Rpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkRyYWZ0IEJyaWVmIEZyb20gRm9sZGVyXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnRGb2xkZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNsZWFuIE5vdGUgRnJvbSBSZWNlbnQgRmlsZXNcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFza0Fib3V0UmVjZW50RmlsZXMoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJTeW50aGVzaXplIE5vdGVzLi4uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zeW50aGVzaXplTm90ZXMoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVBc2tTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJhc2tcIixcbiAgICAgIFwiQXNrIEJyYWluXCIsXG4gICAgICBcIkFzayBhIHF1ZXN0aW9uIGFib3V0IHRoZSBjdXJyZW50IG5vdGUsIGEgc2VsZWN0ZWQgZ3JvdXAsIGEgZm9sZGVyLCBvciB0aGUgd2hvbGUgdmF1bHQuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgICAgdGV4dDogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza1F1ZXN0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQWJvdXQgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Rm9sZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVSZXZpZXdTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJyZXZpZXdcIixcbiAgICAgIFwiUmV2aWV3XCIsXG4gICAgICBcIlByb2Nlc3MgY2FwdHVyZWQgaW5wdXQgYW5kIGtlZXAgdGhlIGRhaWx5IGxvb3AgbW92aW5nLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICAgIHRleHQ6IFwiUmV2aWV3IEluYm94XCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIk9wZW4gUmV2aWV3IEhpc3RvcnlcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJ0b3BpY1wiLFxuICAgICAgXCJUb3BpYyBQYWdlc1wiLFxuICAgICAgXCJCcmFpbidzIGZsYWdzaGlwIGZsb3c6IHR1cm4gZXhwbGljaXQgY29udGV4dCBpbnRvIGEgZHVyYWJsZSBtYXJrZG93biBwYWdlIHlvdSBjYW4ga2VlcCBidWlsZGluZy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5jcmVhdGVUb3BpY1BhZ2UoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJUb3BpYyBQYWdlIEZyb20gQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZShcIm5vdGVcIik7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ2FwdHVyZUFzc2lzdFNlY3Rpb24oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwiY2FwdHVyZS1hc3Npc3RcIixcbiAgICAgIFwiQ2FwdHVyZSBBc3Npc3RcIixcbiAgICAgIFwiVXNlIEFJIG9ubHkgdG8gY2xhc3NpZnkgZnJlc2ggY2FwdHVyZSBpbnRvIG5vdGUsIHRhc2ssIG9yIGpvdXJuYWwuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJBdXRvLXJvdXRlIENhcHR1cmVcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuYXV0b1JvdXRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTdGF0dXNTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJzdGF0dXNcIixcbiAgICAgIFwiU3RhdHVzXCIsXG4gICAgICBcIkN1cnJlbnQgaW5ib3gsIHRhc2ssIGFuZCBzeW50aGVzaXMgc3RhdHVzLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBpbmJveFJvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkluYm94OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHRoaXMuaW5ib3hDb3VudEVsID0gaW5ib3hSb3c7XG5cbiAgICAgICAgY29uc3QgdGFza1JvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIlRhc2tzOiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHRoaXMudGFza0NvdW50RWwgPSB0YXNrUm93O1xuXG4gICAgICAgIGNvbnN0IHJldmlld1JvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zdGF0dXMtcm93XCIgfSk7XG4gICAgICAgIHRoaXMucmV2aWV3SGlzdG9yeUVsID0gcmV2aWV3Um93LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiUmV2aWV3IGhpc3Rvcnk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgcmV2aWV3Um93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1zbWFsbFwiLFxuICAgICAgICAgIHRleHQ6IFwiT3BlblwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ub3BlblJldmlld0hpc3RvcnkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYWlSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJBSTogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLmFpU3RhdHVzRWwgPSBhaVJvdztcblxuICAgICAgICBjb25zdCBzdW1tYXJ5Um93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTGFzdCBhcnRpZmFjdDogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLnN1bW1hcnlTdGF0dXNFbCA9IHN1bW1hcnlSb3c7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZU91dHB1dFNlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcIm91dHB1dFwiLFxuICAgICAgXCJBcnRpZmFjdHNcIixcbiAgICAgIFwiUmVjZW50IHN5bnRoZXNpcyByZXN1bHRzIGFuZCBnZW5lcmF0ZWQgYXJ0aWZhY3RzLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb250YWluZXIuY3JlYXRlRWwoXCJoNFwiLCB7IHRleHQ6IFwiTGFzdCBSZXN1bHRcIiB9KTtcbiAgICAgICAgdGhpcy5yZXN1bHRFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLW91dHB1dFwiLFxuICAgICAgICAgIHRleHQ6IFwiTm8gcmVzdWx0IHlldC5cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkxhc3QgQXJ0aWZhY3RcIiB9KTtcbiAgICAgICAgdGhpcy5zdW1tYXJ5RWwgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1vdXRwdXRcIixcbiAgICAgICAgICB0ZXh0OiBcIk5vIGFydGlmYWN0IGdlbmVyYXRlZCB5ZXQuXCIsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQXNOb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAodGV4dCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZU5vdGUodGV4dCksXG4gICAgICBcIkNvdWxkIG5vdCBjYXB0dXJlIG5vdGVcIixcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQXNUYXNrKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAodGV4dCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZVRhc2sodGV4dCksXG4gICAgICBcIkNvdWxkIG5vdCBzYXZlIHRhc2tcIixcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQXNKb3VybmFsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAodGV4dCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZUpvdXJuYWwodGV4dCksXG4gICAgICBcIkNvdWxkIG5vdCBzYXZlIGpvdXJuYWwgZW50cnlcIixcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhdXRvUm91dGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5wbHVnaW4ucm91dGVUZXh0KHRleHQpO1xuICAgICAgaWYgKCFyb3V0ZSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gY291bGQgbm90IGNsYXNzaWZ5IHRoYXQgZW50cnlcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChyb3V0ZSA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBjYXB0dXJlIG5vdGVcIixcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAocm91dGUgPT09IFwidGFza1wiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZVRhc2sodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGF1dG8tcm91dGUgY2FwdHVyZVwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVDYXB0dXJlKFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIGZhaWx1cmVNZXNzYWdlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFjdGlvbih0ZXh0KTtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlcG9ydEFjdGlvblJlc3VsdChyZXN1bHQpO1xuICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBmYWlsdXJlTWVzc2FnZSk7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBCcmFpblBsdWdpbik6IHZvaWQge1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY2FwdHVyZS1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFwiQ2FwdHVyZSBOb3RlXCIsIFwiQ2FwdHVyZVwiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi5ub3RlU2VydmljZS5hcHBlbmROb3RlKHRleHQpO1xuICAgICAgICByZXR1cm4gYENhcHR1cmVkIG5vdGUgaW4gJHtzYXZlZC5wYXRofWA7XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYWRkLXRhc2tcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIFRhc2tcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIFRhc2tcIiwgXCJDYXB0dXJlXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtam91cm5hbC1lbnRyeVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgSm91cm5hbFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcbiAgICAgICAgXCJDYXB0dXJlIEpvdXJuYWxcIixcbiAgICAgICAgXCJDYXB0dXJlXCIsXG4gICAgICAgIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4uam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkodGV4dCk7XG4gICAgICAgICAgcmV0dXJuIGBTYXZlZCBqb3VybmFsIGVudHJ5IHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgICB9LFxuICAgICAgICB0cnVlLFxuICAgICAgKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwicHJvY2Vzcy1pbmJveFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IFJldmlldyBJbmJveFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ucHJvY2Vzc0luYm94KCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInJldmlldy1oaXN0b3J5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBSZXZpZXcgSGlzdG9yeVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblJldmlld0hpc3RvcnkoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3VtbWFyaXplLXRvZGF5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9kYXkgU3VtbWFyeVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDEsIFwiVG9kYXlcIik7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN1bW1hcml6ZS10aGlzLXdlZWtcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBXZWVrbHkgU3VtbWFyeVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDcsIFwiV2Vla1wiKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYWRkLXRhc2stZnJvbS1zZWxlY3Rpb25cIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIFRhc2sgRnJvbSBTZWxlY3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFkZFRhc2tGcm9tU2VsZWN0aW9uKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4tdG9kYXlzLWpvdXJuYWxcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFRvZGF5J3MgSm91cm5hbFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblRvZGF5c0pvdXJuYWwoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi1zaWRlYmFyXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBCcmFpbiBTaWRlYmFyXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuU2lkZWJhcigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeW50aGVzaXplLW5vdGVzXCIsXG4gICAgbmFtZTogXCJCcmFpbjogU3ludGhlc2l6ZSBOb3Rlc1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uc3ludGhlc2l6ZU5vdGVzKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5bnRoZXNpemUtY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogU3ludGhlc2l6ZSBDdXJyZW50IE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYXNrLXF1ZXN0aW9uXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQXNrIFF1ZXN0aW9uXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tRdWVzdGlvbigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhc2stcXVlc3Rpb24tY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrUXVlc3Rpb25BYm91dEN1cnJlbnROb3RlKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNyZWF0ZS10b3BpYy1wYWdlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9waWMgUGFnZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY3JlYXRlVG9waWNQYWdlKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNyZWF0ZS10b3BpYy1wYWdlLWN1cnJlbnQtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFRvcGljIFBhZ2UgRnJvbSBDdXJyZW50IE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKFwibm90ZVwiKTtcbiAgICB9LFxuICB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG9CQUFvRDs7O0FDMkI3QyxJQUFNLHlCQUE4QztBQUFBLEVBQ3pELFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQSxFQUNYLGVBQWU7QUFBQSxFQUNmLGFBQWE7QUFBQSxFQUNiLGlCQUFpQjtBQUFBLEVBQ2pCLGVBQWU7QUFBQSxFQUNmLG1CQUFtQjtBQUFBLEVBQ25CLGlCQUFpQjtBQUFBLEVBQ2pCLGNBQWM7QUFBQSxFQUNkLGFBQWE7QUFBQSxFQUNiLGVBQWU7QUFBQSxFQUNmLFlBQVk7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUNkLGFBQWE7QUFBQSxFQUNiLHFCQUFxQjtBQUFBLEVBQ3JCLGlCQUFpQjtBQUFBLEVBQ2pCLGtCQUFrQjtBQUFBLEVBQ2xCLDBCQUEwQixDQUFDO0FBQzdCO0FBRU8sU0FBUyx1QkFDZCxPQUNxQjtBQUNyQixRQUFNLFNBQThCO0FBQUEsSUFDbEMsR0FBRztBQUFBLElBQ0gsR0FBRztBQUFBLEVBQ0w7QUFFQSxTQUFPO0FBQUEsSUFDTCxXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsTUFDUCx1QkFBdUI7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S0FBSztBQUFBLEVBQ25DO0FBQUEsRUFFUSx5QkFBaUM7QUFuMUIzQztBQW8xQkksVUFBTSxhQUFhLEtBQUssSUFBSSxVQUFVLG9CQUFvQiw4QkFBWTtBQUN0RSxVQUFNLGFBQVksMERBQVksV0FBWixtQkFBb0IsbUJBQXBCLG1CQUFvQyxXQUFwQyxZQUE4QztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgInNsdWdpZnkiLCAidHJpbVRpdGxlIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAiZ2V0V2luZG93U3RhcnQiLCAiaW1wb3J0X29ic2lkaWFuIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
