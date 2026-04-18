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

// src/utils/ai-config.ts
function getAIProviderConfig(settings) {
  if (settings.aiProvider === "gemini") {
    return {
      apiKey: settings.geminiApiKey,
      model: settings.geminiModel
    };
  }
  return {
    apiKey: settings.openAIApiKey,
    model: settings.openAIModel
  };
}
function isAIConfigured(settings) {
  const config = getAIProviderConfig(settings);
  return config.apiKey.trim().length > 0 && config.model.trim().length > 0;
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
      if (!isAIConfigured(settings)) {
        new import_obsidian3.Notice("AI answers are enabled but no API key is configured");
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
      if (!isAIConfigured(settings)) {
        new import_obsidian4.Notice("AI summaries are enabled but no API key is configured");
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
      if (!isAIConfigured(settings)) {
        new import_obsidian5.Notice("AI summaries are enabled but no API key is configured");
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
      if (!isAIConfigured(settings)) {
        new import_obsidian6.Notice("AI topic pages are enabled but no API key is configured");
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
    this.plugin.registerObsidianProtocolHandler("brain-auth", async (data) => {
      const { provider, token } = data;
      if (!provider || !token) {
        new import_obsidian8.Notice("Brain: Invalid authentication data received");
        return;
      }
      if (provider !== "openai" && provider !== "gemini") {
        new import_obsidian8.Notice("Brain: Unknown authentication provider");
        return;
      }
      if (token.length < 10 || token.length > 512) {
        new import_obsidian8.Notice("Brain: Invalid token format");
        return;
      }
      if (provider === "openai") {
        this.plugin.settings.openAIApiKey = token;
        new import_obsidian8.Notice("Brain: OpenAI authenticated successfully");
      } else {
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
    this.lastArtifactScanAt = 0;
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
  async initializeLastArtifactTimestamp() {
    const now = Date.now();
    if (now - this.lastArtifactScanAt < 5e3) {
      return;
    }
    this.lastArtifactScanAt = now;
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
  getActiveSelectionText() {
    var _a, _b, _c;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian19.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy90ZXh0LnRzIiwgInNyYy91dGlscy9wYXRoLnRzIiwgInNyYy91dGlscy9kYXRlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9qb3VybmFsLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL25vdGUtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZS50cyIsICJzcmMvdXRpbHMvZm9ybWF0LWhlbHBlcnMudHMiLCAic3JjL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2FpLWNvbmZpZy50cyIsICJzcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy9zdW1tYXJ5LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9jb250ZXh0LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9wcm9tcHQtbW9kYWxzLnRzIiwgInNyYy92aWV3cy9maWxlLWdyb3VwLXBpY2tlci1tb2RhbC50cyIsICJzcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsLnRzIiwgInNyYy91dGlscy9lcnJvci1oYW5kbGVyLnRzIiwgInNyYy92aWV3cy9xdWVzdGlvbi1zY29wZS1tb2RhbC50cyIsICJzcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWwudHMiLCAic3JjL3ZpZXdzL3N5bnRoZXNpcy1yZXN1bHQtbW9kYWwudHMiLCAic3JjL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbC50cyIsICJzcmMvdmlld3Mvc2lkZWJhci12aWV3LnRzIiwgInNyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQ29udGV4dFNlcnZpY2UsIFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgSm91cm5hbFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBOb3RlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQsIFN5bnRoZXNpc1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IFRvcGljUGFnZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdG9waWMtcGFnZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQXV0aFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgUHJvbXB0TW9kYWwsXG4gIFJlc3VsdE1vZGFsLFxufSBmcm9tIFwiLi9zcmMvdmlld3MvcHJvbXB0LW1vZGFsc1wiO1xuaW1wb3J0IHsgRmlsZUdyb3VwUGlja2VyTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWxcIjtcbmltcG9ydCB7IFF1ZXN0aW9uU2NvcGUgfSBmcm9tIFwiLi9zcmMvdHlwZXNcIjtcbmltcG9ydCB7IFJldmlld0hpc3RvcnlNb2RhbCB9IGZyb20gXCIuL3NyYy92aWV3cy9yZXZpZXctaGlzdG9yeS1tb2RhbFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbFwiO1xuaW1wb3J0IHsgVGVtcGxhdGVQaWNrZXJNb2RhbCB9IGZyb20gXCIuL3NyYy92aWV3cy90ZW1wbGF0ZS1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4vc3JjL3R5cGVzXCI7XG5pbXBvcnQge1xuICBCUkFJTl9WSUVXX1RZUEUsXG4gIEJyYWluU2lkZWJhclZpZXcsXG59IGZyb20gXCIuL3NyYy92aWV3cy9zaWRlYmFyLXZpZXdcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4vc3JjL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN1bW1hcnlSZXN1bHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0U291cmNlTGluZXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi9zcmMvdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gXCIuL3NyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kc1wiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcbmltcG9ydCB7IGdldEFwcGVuZFNlcGFyYXRvciwgc3RyaXBMZWFkaW5nVGl0bGUgfSBmcm9tIFwiLi9zcmMvdXRpbHMvdGV4dFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBpbmJveFNlcnZpY2UhOiBJbmJveFNlcnZpY2U7XG4gIG5vdGVTZXJ2aWNlITogTm90ZVNlcnZpY2U7XG4gIHRhc2tTZXJ2aWNlITogVGFza1NlcnZpY2U7XG4gIGpvdXJuYWxTZXJ2aWNlITogSm91cm5hbFNlcnZpY2U7XG4gIHJldmlld0xvZ1NlcnZpY2UhOiBSZXZpZXdMb2dTZXJ2aWNlO1xuICByZXZpZXdTZXJ2aWNlITogUmV2aWV3U2VydmljZTtcbiAgcXVlc3Rpb25TZXJ2aWNlITogUXVlc3Rpb25TZXJ2aWNlO1xuICBjb250ZXh0U2VydmljZSE6IENvbnRleHRTZXJ2aWNlO1xuICBzeW50aGVzaXNTZXJ2aWNlITogU3ludGhlc2lzU2VydmljZTtcbiAgdG9waWNQYWdlU2VydmljZSE6IFRvcGljUGFnZVNlcnZpY2U7XG4gIGFpU2VydmljZSE6IEJyYWluQUlTZXJ2aWNlO1xuICBhdXRoU2VydmljZSE6IEJyYWluQXV0aFNlcnZpY2U7XG4gIHN1bW1hcnlTZXJ2aWNlITogU3VtbWFyeVNlcnZpY2U7XG4gIHByaXZhdGUgc2lkZWJhclZpZXc6IEJyYWluU2lkZWJhclZpZXcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0U3VtbWFyeUF0OiBEYXRlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGFzdEFydGlmYWN0U2NhbkF0ID0gMDtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMudmF1bHRTZXJ2aWNlID0gbmV3IFZhdWx0U2VydmljZSh0aGlzLmFwcCk7XG4gICAgdGhpcy5haVNlcnZpY2UgPSBuZXcgQnJhaW5BSVNlcnZpY2UoKTtcbiAgICB0aGlzLmF1dGhTZXJ2aWNlID0gbmV3IEJyYWluQXV0aFNlcnZpY2UodGhpcyk7XG4gICAgdGhpcy5hdXRoU2VydmljZS5yZWdpc3RlclByb3RvY29sKCk7XG4gICAgdGhpcy5pbmJveFNlcnZpY2UgPSBuZXcgSW5ib3hTZXJ2aWNlKHRoaXMudmF1bHRTZXJ2aWNlLCAoKSA9PiB0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLm5vdGVTZXJ2aWNlID0gbmV3IE5vdGVTZXJ2aWNlKHRoaXMudmF1bHRTZXJ2aWNlLCAoKSA9PiB0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLnRhc2tTZXJ2aWNlID0gbmV3IFRhc2tTZXJ2aWNlKHRoaXMudmF1bHRTZXJ2aWNlLCAoKSA9PiB0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLmpvdXJuYWxTZXJ2aWNlID0gbmV3IEpvdXJuYWxTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5jb250ZXh0U2VydmljZSA9IG5ldyBDb250ZXh0U2VydmljZShcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlID0gbmV3IFJldmlld0xvZ1NlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnJldmlld1NlcnZpY2UgPSBuZXcgUmV2aWV3U2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy5pbmJveFNlcnZpY2UsXG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLFxuICAgICAgdGhpcy5qb3VybmFsU2VydmljZSxcbiAgICAgIHRoaXMucmV2aWV3TG9nU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnF1ZXN0aW9uU2VydmljZSA9IG5ldyBRdWVzdGlvblNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnN1bW1hcnlTZXJ2aWNlID0gbmV3IFN1bW1hcnlTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnN5bnRoZXNpc1NlcnZpY2UgPSBuZXcgU3ludGhlc2lzU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudG9waWNQYWdlU2VydmljZSA9IG5ldyBUb3BpY1BhZ2VTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG5cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhCUkFJTl9WSUVXX1RZUEUsIChsZWFmKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbmV3IEJyYWluU2lkZWJhclZpZXcobGVhZiwgdGhpcyk7XG4gICAgICB0aGlzLnNpZGViYXJWaWV3ID0gdmlldztcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0pO1xuXG4gICAgcmVnaXN0ZXJDb21tYW5kcyh0aGlzKTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgQnJhaW5TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLnNpZGViYXJWaWV3ID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhsb2FkZWQpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUxhc3RBcnRpZmFjdFRpbWVzdGFtcCgpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgZ2V0T3BlblNpZGViYXJWaWV3KCk6IEJyYWluU2lkZWJhclZpZXcgfCBudWxsIHtcbiAgICBjb25zdCBsZWF2ZXMgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSk7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIGxlYXZlcykge1xuICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICAgIGlmICh2aWV3IGluc3RhbmNlb2YgQnJhaW5TaWRlYmFyVmlldykge1xuICAgICAgICByZXR1cm4gdmlldztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBoYXNPcGVuU2lkZWJhcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpLmxlbmd0aCA+IDA7XG4gIH1cblxuICB1cGRhdGVTaWRlYmFyUmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RSZXN1bHQodGV4dCk7XG4gIH1cblxuICB1cGRhdGVTaWRlYmFyU3VtbWFyeSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5zZXRMYXN0U3VtbWFyeSh0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlZnJlc2ggc2lkZWJhciBzdGF0dXNcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KG1lc3NhZ2UpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBnZXRMYXN0U3VtbWFyeUxhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubGFzdFN1bW1hcnlBdCA/IGZvcm1hdERhdGVUaW1lS2V5KHRoaXMubGFzdFN1bW1hcnlBdCkgOiBcIk5vIGFydGlmYWN0IHlldFwiO1xuICB9XG5cbiAgYXN5bmMgcm91dGVUZXh0KHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwib3BlbmFpXCIpIHtcbiAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICF0aGlzLnNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgcm91dGluZyBpcyBlbmFibGVkIGJ1dCBPcGVuQUkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5nZW1pbmlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkFJIHJvdXRpbmcgaXMgZW5hYmxlZCBidXQgR2VtaW5pIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnJvdXRlVGV4dCh0ZXh0LCB0aGlzLnNldHRpbmdzKTtcbiAgICBpZiAocm91dGUpIHtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgQXV0by1yb3V0ZWQgYXMgJHtyb3V0ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJvdXRlO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIixcbiAgICAgIFwic3VtbWFyaXplXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgXCJTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0U2VsZWN0ZWRUZXh0Q29udGV4dCgpLFxuICAgICAgXCJFeHRyYWN0IFRhc2tzIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgICBcImV4dHJhY3QtdGFza3NcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRSZWNlbnRGaWxlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0UmVjZW50RmlsZXNDb250ZXh0KCksXG4gICAgICBcIkNsZWFuIE5vdGUgRnJvbSBSZWNlbnQgRmlsZXNcIixcbiAgICAgIFwicmV3cml0ZS1jbGVhbi1ub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudEZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKSxcbiAgICAgIFwiRHJhZnQgQnJpZWYgRnJvbSBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVOb3RlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2NvcGUgPSBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIlN5bnRoZXNpemUgTm90ZXNcIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgdGhpcy5yZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgICAgICBzY29wZSxcbiAgICAgICAgXCJTZWxlY3QgTm90ZXMgdG8gU3ludGhlc2l6ZVwiLFxuICAgICAgKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gYXdhaXQgdGhpcy5waWNrU3ludGhlc2lzVGVtcGxhdGUoXCJTeW50aGVzaXplIE5vdGVzXCIpO1xuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucnVuU3ludGhlc2lzRmxvdyhjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc3ludGhlc2l6ZSB0aGVzZSBub3Rlc1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBhc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwibm90ZVwiKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25Gb3JTY29wZShcImZvbGRlclwiKTtcbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzY29wZSA9IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiQXNrIFF1ZXN0aW9uXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKHNjb3BlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhc2sgQnJhaW5cIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKGRlZmF1bHRTY29wZT86IFF1ZXN0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdG9waWMgPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiQ3JlYXRlIFRvcGljIFBhZ2VcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiVG9waWMgb3IgcXVlc3Rpb24gdG8gdHVybiBpbnRvIGEgd2lraSBwYWdlLi4uXCIsXG4gICAgICAgIHN1Ym1pdExhYmVsOiBcIkNyZWF0ZVwiLFxuICAgICAgICBtdWx0aWxpbmU6IHRydWUsXG4gICAgICB9KS5vcGVuUHJvbXB0KCk7XG4gICAgICBpZiAoIXRvcGljKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NvcGUgPSBkZWZhdWx0U2NvcGUgPz8gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyBmb3IgVG9waWMgUGFnZVwiLFxuICAgICAgKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudG9waWNQYWdlU2VydmljZS5jcmVhdGVUb3BpY1BhZ2UodG9waWMsIGNvbnRleHQpO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICAgIHJlc3VsdC5jb250ZW50LFxuICAgICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aHMsXG4gICAgICApO1xuXG4gICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGBBSSB0b3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gXG4gICAgICAgICAgOiBgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCxcbiAgICAgICk7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgICAgbmV3IE5vdGljZShgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCk7XG5cbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKHNhdmVkKTtcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgY3JlYXRlIHRoYXQgdG9waWMgcGFnZVwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coXG4gICAgbG9va2JhY2tEYXlzPzogbnVtYmVyLFxuICAgIGxhYmVsPzogc3RyaW5nLFxuICApOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN1bW1hcnlTZXJ2aWNlLmdlbmVyYXRlU3VtbWFyeShsb29rYmFja0RheXMsIGxhYmVsKTtcbiAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclN1bW1hcnkoYCR7cmVzdWx0LnRpdGxlfVxcblxcbiR7cmVzdWx0LmNvbnRlbnR9YCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KFxuICAgICAgcmVzdWx0LnVzZWRBSSA/IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIHdpdGggQUlgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIG5ldyBOb3RpY2UoXG4gICAgICByZXN1bHQucGVyc2lzdGVkUGF0aFxuICAgICAgICA/IGAke3Jlc3VsdC50aXRsZX0gc2F2ZWQgdG8gJHtyZXN1bHQucGVyc2lzdGVkUGF0aH1gXG4gICAgICAgIDogcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWBcbiAgICAgICAgICA6IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIGxvY2FsbHlgLFxuICAgICk7XG4gICAgaWYgKCF0aGlzLmhhc09wZW5TaWRlYmFyKCkpIHtcbiAgICAgIG5ldyBSZXN1bHRNb2RhbCh0aGlzLmFwcCwgYEJyYWluICR7cmVzdWx0LnRpdGxlfWAsIHJlc3VsdC5jb250ZW50KS5vcGVuKCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyBzYXZlU3ludGhlc2lzUmVzdWx0KFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICByZXN1bHQubm90ZVRpdGxlLFxuICAgICAgdGhpcy5idWlsZFN5bnRoZXNpc05vdGVDb250ZW50KHJlc3VsdCwgY29udGV4dCksXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIHJldHVybiBgU2F2ZWQgYXJ0aWZhY3QgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBpbnNlcnRTeW50aGVzaXNJbnRvQ3VycmVudE5vdGUoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGFkZGl0aW9uID0gdGhpcy5idWlsZEluc2VydGVkU3ludGhlc2lzQ29udGVudChyZXN1bHQsIGNvbnRleHQpO1xuICAgIGNvbnN0IGVkaXRvciA9IHZpZXcuZWRpdG9yO1xuICAgIGNvbnN0IGxhc3RMaW5lID0gZWRpdG9yLmxhc3RMaW5lKCk7XG4gICAgY29uc3QgbGFzdExpbmVUZXh0ID0gZWRpdG9yLmdldExpbmUobGFzdExpbmUpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9uID0geyBsaW5lOiBsYXN0TGluZSwgY2g6IGxhc3RMaW5lVGV4dC5sZW5ndGggfTtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBnZXRBcHBlbmRTZXBhcmF0b3IoZWRpdG9yLmdldFZhbHVlKCkpO1xuICAgIGVkaXRvci5yZXBsYWNlUmFuZ2UoYCR7c2VwYXJhdG9yfSR7YWRkaXRpb259XFxuYCwgZW5kUG9zaXRpb24pO1xuICAgIHJldHVybiBgSW5zZXJ0ZWQgc3ludGhlc2lzIGludG8gJHt2aWV3LmZpbGUucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZUZyb21Nb2RhbChcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHN1Ym1pdExhYmVsOiBzdHJpbmcsXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgbXVsdGlsaW5lID0gZmFsc2UsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICB0aXRsZSxcbiAgICAgIHBsYWNlaG9sZGVyOiBtdWx0aWxpbmVcbiAgICAgICAgPyBcIldyaXRlIHlvdXIgZW50cnkgaGVyZS4uLlwiXG4gICAgICAgIDogXCJUeXBlIGhlcmUuLi5cIixcbiAgICAgIHN1Ym1pdExhYmVsLFxuICAgICAgbXVsdGlsaW5lLFxuICAgIH0pLm9wZW5Qcm9tcHQoKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odmFsdWUpO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkJyYWluIGNvdWxkIG5vdCBzYXZlIHRoYXQgZW50cnlcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY2FwdHVyZU5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICByZXR1cm4gYENhcHR1cmVkIG5vdGUgaW4gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVKb3VybmFsKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgam91cm5hbCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NJbmJveCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmdldFJlY2VudEluYm94RW50cmllcygpO1xuICAgIGlmICghZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBpbmJveCBlbnRyaWVzIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBJbmJveFJldmlld01vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzLnJldmlld1NlcnZpY2UsIGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICB9KS5vcGVuKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBMb2FkZWQgJHtlbnRyaWVzLmxlbmd0aH0gaW5ib3ggZW50cmllc2ApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBhc3luYyBvcGVuUmV2aWV3SGlzdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmdldFJldmlld0VudHJpZXMoKTtcbiAgICBuZXcgUmV2aWV3SGlzdG9yeU1vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBhZGRUYXNrRnJvbVNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3Rpb24gPSB0aGlzLmdldEFjdGl2ZVNlbGVjdGlvblRleHQoKTtcbiAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayhzZWxlY3Rpb24pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGBTYXZlZCB0YXNrIGZyb20gc2VsZWN0aW9uIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IE5vdGljZShcIk5vIHNlbGVjdGlvbiBmb3VuZC4gT3BlbmluZyB0YXNrIGVudHJ5IG1vZGFsLlwiKTtcbiAgICBhd2FpdCB0aGlzLmNhcHR1cmVGcm9tTW9kYWwoXCJBZGQgVGFza1wiLCBcIlNhdmUgdGFza1wiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBvcGVuVG9kYXlzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5lbnN1cmVKb3VybmFsRmlsZSgpO1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdG9kYXkncyBqb3VybmFsXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgY29uc3QgbWVzc2FnZSA9IGBPcGVuZWQgJHtmaWxlLnBhdGh9YDtcbiAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIGdldEluYm94Q291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UuZ2V0VW5yZXZpZXdlZENvdW50KCk7XG4gIH1cblxuICBhc3luYyBnZXRPcGVuVGFza0NvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudGFza1NlcnZpY2UuZ2V0T3BlblRhc2tDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3SGlzdG9yeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyeUNvdW50KCk7XG4gIH1cblxuICBhc3luYyByZW9wZW5SZXZpZXdFbnRyeShlbnRyeToge1xuICAgIGhlYWRpbmc6IHN0cmluZztcbiAgICBwcmV2aWV3OiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlSW5kZXg6IG51bWJlcjtcbiAgfSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnJlb3BlbkZyb21SZXZpZXdMb2coe1xuICAgICAgYWN0aW9uOiBcInJlb3BlblwiLFxuICAgICAgdGltZXN0YW1wOiBcIlwiLFxuICAgICAgc291cmNlUGF0aDogXCJcIixcbiAgICAgIGZpbGVNdGltZTogRGF0ZS5ub3coKSxcbiAgICAgIGVudHJ5SW5kZXg6IDAsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGVudHJ5LnByZXZpZXcsXG4gICAgICBzaWduYXR1cmU6IGVudHJ5LnNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRBaVN0YXR1c1RleHQoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgJiYgIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm4gXCJBSSBvZmZcIjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5haVByb3ZpZGVyID09PSBcIm9wZW5haVwiKSB7XG4gICAgICBpZiAoIXRoaXMuc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgcmV0dXJuIFwiT3BlbkFJIGVuYWJsZWQgYnV0IG1pc3Npbmcga2V5XCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gXCJPcGVuQUkgY29uZmlndXJlZFwiO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5nZW1pbmlBcGlLZXkudHJpbSgpIHx8ICF0aGlzLnNldHRpbmdzLmdlbWluaU1vZGVsLnRyaW0oKSkge1xuICAgICAgICByZXR1cm4gXCJHZW1pbmkgZW5hYmxlZCBidXQgbWlzc2luZyBrZXlcIjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBcIkdlbWluaSBjb25maWd1cmVkXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiQUkgY29uZmlndXJlZFwiO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tCcmFpbkZvckNvbnRleHQoXG4gICAgcmVzb2x2ZXI6ICgpID0+IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4sXG4gICAgbW9kYWxUaXRsZTogc3RyaW5nLFxuICAgIGRlZmF1bHRUZW1wbGF0ZT86IFN5bnRoZXNpc1RlbXBsYXRlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHJlc29sdmVyKCk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRlZmF1bHRUZW1wbGF0ZSA/PyAoYXdhaXQgdGhpcy5waWNrU3ludGhlc2lzVGVtcGxhdGUobW9kYWxUaXRsZSkpO1xuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucnVuU3ludGhlc2lzRmxvdyhjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc3ludGhlc2l6ZSB0aGF0IGNvbnRleHRcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tRdWVzdGlvbkZvclNjb3BlKHNjb3BlOiBRdWVzdGlvblNjb3BlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc3dpdGNoIChzY29wZSkge1xuICAgICAgY2FzZSBcIm5vdGVcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJmb2xkZXJcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwidmF1bHRcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0VmF1bHRDb250ZXh0KCksXG4gICAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgRW50aXJlIFZhdWx0XCIsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJncm91cFwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uQWJvdXRTZWxlY3RlZEdyb3VwKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgc2NvcGU6IFF1ZXN0aW9uU2NvcGUsXG4gICAgZ3JvdXBQaWNrZXJUaXRsZTogc3RyaW5nLFxuICApOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQgfCBudWxsPiB7XG4gICAgc3dpdGNoIChzY29wZSkge1xuICAgICAgY2FzZSBcIm5vdGVcIjpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCk7XG4gICAgICBjYXNlIFwiZm9sZGVyXCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCk7XG4gICAgICBjYXNlIFwidmF1bHRcIjpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0VmF1bHRDb250ZXh0KCk7XG4gICAgICBjYXNlIFwiZ3JvdXBcIjoge1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGlja1NlbGVjdGVkTWFya2Rvd25GaWxlcyhncm91cFBpY2tlclRpdGxlKTtcbiAgICAgICAgaWYgKCFmaWxlcyB8fCAhZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0U2VsZWN0ZWRGaWxlc0NvbnRleHQoZmlsZXMpO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tRdWVzdGlvbkFib3V0U2VsZWN0ZWRHcm91cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXMoXCJTZWxlY3QgTm90ZXNcIik7XG4gICAgICBpZiAoIWZpbGVzIHx8ICFmaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0U2VsZWN0ZWRGaWxlc0NvbnRleHQoZmlsZXMpLFxuICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBTZWxlY3RlZCBOb3Rlc1wiLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzZWxlY3Qgbm90ZXMgZm9yIEJyYWluXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGlja1NlbGVjdGVkTWFya2Rvd25GaWxlcyh0aXRsZTogc3RyaW5nKTogUHJvbWlzZTxURmlsZVtdIHwgbnVsbD4ge1xuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5hcHAudmF1bHRcbiAgICAgIC5nZXRNYXJrZG93bkZpbGVzKClcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICF0aGlzLmlzQnJhaW5HZW5lcmF0ZWRGaWxlKGZpbGUucGF0aCkpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuXG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBtYXJrZG93biBmaWxlcyBmb3VuZFwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBuZXcgRmlsZUdyb3VwUGlja2VyTW9kYWwodGhpcy5hcHAsIGZpbGVzLCB7XG4gICAgICB0aXRsZSxcbiAgICB9KS5vcGVuUGlja2VyKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgcmVzb2x2ZXI6ICgpID0+IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4sXG4gICAgbW9kYWxUaXRsZTogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHJlc29sdmVyKCk7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogbW9kYWxUaXRsZSxcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiQXNrIGEgcXVlc3Rpb24gYWJvdXQgdGhpcyBjb250ZXh0Li4uXCIsXG4gICAgICAgIHN1Ym1pdExhYmVsOiBcIkFza1wiLFxuICAgICAgICBtdWx0aWxpbmU6IHRydWUsXG4gICAgICB9KS5vcGVuUHJvbXB0KCk7XG4gICAgICBpZiAoIXF1ZXN0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVzdGlvblNlcnZpY2UuYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb24sIGNvbnRleHQpO1xuICAgICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclN1bW1hcnkocmVzdWx0LmNvbnRlbnQpO1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KFxuICAgICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgQUkgYW5zd2VyIGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBcbiAgICAgICAgICA6IGBMb2NhbCBhbnN3ZXIgZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YCxcbiAgICAgICk7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgICAgbmV3IFN5bnRoZXNpc1Jlc3VsdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIGNvbnRleHQsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgY2FuSW5zZXJ0OiB0aGlzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgICBvbkluc2VydDogYXN5bmMgKCkgPT4gdGhpcy5pbnNlcnRTeW50aGVzaXNJbnRvQ3VycmVudE5vdGUocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgICAgb25TYXZlOiBhc3luYyAoKSA9PiB0aGlzLnNhdmVTeW50aGVzaXNSZXN1bHQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgICAgb25BY3Rpb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJ1blN5bnRoZXNpc0Zsb3coY29udGV4dCwgXCJzdW1tYXJpemVcIik7XG4gICAgICAgIH0sXG4gICAgICB9KS5vcGVuKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYW5zd2VyIHRoYXQgcXVlc3Rpb25cIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5TeW50aGVzaXNGbG93KFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN5bnRoZXNpc1NlcnZpY2UucnVuKHRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclN1bW1hcnkocmVzdWx0LmNvbnRlbnQpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgPyBgQUkgJHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX0gZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YFxuICAgICAgICA6IGBMb2NhbCAke3Jlc3VsdC50aXRsZS50b0xvd2VyQ2FzZSgpfSBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICBuZXcgU3ludGhlc2lzUmVzdWx0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgIGNvbnRleHQsXG4gICAgICByZXN1bHQsXG4gICAgICBjYW5JbnNlcnQ6IHRoaXMuaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCksXG4gICAgICBvbkluc2VydDogYXN5bmMgKCkgPT4gdGhpcy5pbnNlcnRTeW50aGVzaXNJbnRvQ3VycmVudE5vdGUocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIG9uU2F2ZTogYXN5bmMgKCkgPT4gdGhpcy5zYXZlU3ludGhlc2lzUmVzdWx0KHJlc3VsdCwgY29udGV4dCksXG4gICAgICBvbkFjdGlvbkNvbXBsZXRlOiBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICAgIH0sXG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwaWNrU3ludGhlc2lzVGVtcGxhdGUoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGw+IHtcbiAgICByZXR1cm4gYXdhaXQgbmV3IFRlbXBsYXRlUGlja2VyTW9kYWwodGhpcy5hcHAsIHsgdGl0bGUgfSkub3BlblBpY2tlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFN5bnRoZXNpc05vdGVDb250ZW50KFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFtcbiAgICAgIGBBY3Rpb246ICR7cmVzdWx0LmFjdGlvbn1gLFxuICAgICAgYEdlbmVyYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gLFxuICAgICAgYENvbnRleHQgbGVuZ3RoOiAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9IGNoYXJhY3RlcnMuYCxcbiAgICAgIFwiXCIsXG4gICAgICBzdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRJbnNlcnRlZFN5bnRoZXNpc0NvbnRlbnQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW1xuICAgICAgYCMjIEJyYWluICR7cmVzdWx0LnRpdGxlfWAsXG4gICAgICAuLi50aGlzLmJ1aWxkQ29udGV4dEJ1bGxldExpbmVzKGNvbnRleHQpLFxuICAgICAgYC0gR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgICBcIlwiLFxuICAgICAgc3RyaXBMZWFkaW5nVGl0bGUocmVzdWx0LmNvbnRlbnQpLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk/LmZpbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICAgIHJldHVybiBmb3JtYXRDb250ZXh0U291cmNlTGluZXMoY29udGV4dCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dEJ1bGxldExpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgc291cmNlTGluZXMgPSB0aGlzLmJ1aWxkQ29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQpO1xuICAgIHJldHVybiBzb3VyY2VMaW5lcy5tYXAoKGxpbmUpID0+IGAtICR7bGluZX1gKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5pdGlhbGl6ZUxhc3RBcnRpZmFjdFRpbWVzdGFtcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSB0aGlzLmxhc3RBcnRpZmFjdFNjYW5BdCA8IDUwMDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sYXN0QXJ0aWZhY3RTY2FuQXQgPSBub3c7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICAgIGxldCBsYXRlc3QgPSAwO1xuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FydGlmYWN0RmlsZShmaWxlLnBhdGgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbGUuc3RhdC5tdGltZSA+IGxhdGVzdCkge1xuICAgICAgICAgIGxhdGVzdCA9IGZpbGUuc3RhdC5tdGltZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbGF0ZXN0ID4gMCA/IG5ldyBEYXRlKGxhdGVzdCkgOiBudWxsO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGluaXRpYWxpemUgbGFzdCBhcnRpZmFjdCB0aW1lc3RhbXBcIik7XG4gICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNBcnRpZmFjdEZpbGUocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIGlzVW5kZXJGb2xkZXIocGF0aCwgdGhpcy5zZXR0aW5ncy5ub3Rlc0ZvbGRlcikgfHxcbiAgICAgIGlzVW5kZXJGb2xkZXIocGF0aCwgdGhpcy5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNCcmFpbkdlbmVyYXRlZEZpbGUocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIGlzVW5kZXJGb2xkZXIocGF0aCwgdGhpcy5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpIHx8XG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3MucmV2aWV3c0ZvbGRlcilcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRBY3RpdmVTZWxlY3Rpb25UZXh0KCk6IHN0cmluZyB7XG4gICAgY29uc3QgYWN0aXZlVmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gYWN0aXZlVmlldz8uZWRpdG9yPy5nZXRTZWxlY3Rpb24oKT8udHJpbSgpID8/IFwiXCI7XG4gICAgcmV0dXJuIHNlbGVjdGlvbjtcbiAgfVxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIGluYm94RmlsZTogc3RyaW5nO1xuICB0YXNrc0ZpbGU6IHN0cmluZztcbiAgam91cm5hbEZvbGRlcjogc3RyaW5nO1xuICBub3Rlc0ZvbGRlcjogc3RyaW5nO1xuICBzdW1tYXJpZXNGb2xkZXI6IHN0cmluZztcbiAgcmV2aWV3c0ZvbGRlcjogc3RyaW5nO1xuXG4gIGVuYWJsZUFJU3VtbWFyaWVzOiBib29sZWFuO1xuICBlbmFibGVBSVJvdXRpbmc6IGJvb2xlYW47XG5cbiAgb3BlbkFJQXBpS2V5OiBzdHJpbmc7XG4gIG9wZW5BSU1vZGVsOiBzdHJpbmc7XG4gIG9wZW5BSUJhc2VVcmw6IHN0cmluZztcblxuICBhaVByb3ZpZGVyOiBcIm9wZW5haVwiIHwgXCJnZW1pbmlcIjtcbiAgZ2VtaW5pQXBpS2V5OiBzdHJpbmc7XG4gIGdlbWluaU1vZGVsOiBzdHJpbmc7XG5cbiAgc3VtbWFyeUxvb2tiYWNrRGF5czogbnVtYmVyO1xuICBzdW1tYXJ5TWF4Q2hhcnM6IG51bWJlcjtcblxuICBwZXJzaXN0U3VtbWFyaWVzOiBib29sZWFuO1xuXG4gIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICBpbmJveEZpbGU6IFwiQnJhaW4vaW5ib3gubWRcIixcbiAgdGFza3NGaWxlOiBcIkJyYWluL3Rhc2tzLm1kXCIsXG4gIGpvdXJuYWxGb2xkZXI6IFwiQnJhaW4vam91cm5hbFwiLFxuICBub3Rlc0ZvbGRlcjogXCJCcmFpbi9ub3Rlc1wiLFxuICBzdW1tYXJpZXNGb2xkZXI6IFwiQnJhaW4vc3VtbWFyaWVzXCIsXG4gIHJldmlld3NGb2xkZXI6IFwiQnJhaW4vcmV2aWV3c1wiLFxuICBlbmFibGVBSVN1bW1hcmllczogZmFsc2UsXG4gIGVuYWJsZUFJUm91dGluZzogZmFsc2UsXG4gIG9wZW5BSUFwaUtleTogXCJcIixcbiAgb3BlbkFJTW9kZWw6IFwiZ3B0LTRvLW1pbmlcIixcbiAgb3BlbkFJQmFzZVVybDogXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxL2NoYXQvY29tcGxldGlvbnNcIixcbiAgYWlQcm92aWRlcjogXCJvcGVuYWlcIixcbiAgZ2VtaW5pQXBpS2V5OiBcIlwiLFxuICBnZW1pbmlNb2RlbDogXCJnZW1pbmktMS41LWZsYXNoXCIsXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IDcsXG4gIHN1bW1hcnlNYXhDaGFyczogMTIwMDAsXG4gIHBlcnNpc3RTdW1tYXJpZXM6IHRydWUsXG4gIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogW10sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgaW5ib3hGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgobWVyZ2VkLmluYm94RmlsZSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5pbmJveEZpbGUpLFxuICAgIHRhc2tzRmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKG1lcmdlZC50YXNrc0ZpbGUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1MudGFza3NGaWxlKSxcbiAgICBqb3VybmFsRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuam91cm5hbEZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muam91cm5hbEZvbGRlcixcbiAgICApLFxuICAgIG5vdGVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQubm90ZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm5vdGVzRm9sZGVyLFxuICAgICksXG4gICAgc3VtbWFyaWVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuc3VtbWFyaWVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJpZXNGb2xkZXIsXG4gICAgKSxcbiAgICByZXZpZXdzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQucmV2aWV3c0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MucmV2aWV3c0ZvbGRlcixcbiAgICApLFxuICAgIGVuYWJsZUFJU3VtbWFyaWVzOiBCb29sZWFuKG1lcmdlZC5lbmFibGVBSVN1bW1hcmllcyksXG4gICAgZW5hYmxlQUlSb3V0aW5nOiBCb29sZWFuKG1lcmdlZC5lbmFibGVBSVJvdXRpbmcpLFxuICAgIG9wZW5BSUFwaUtleTogdHlwZW9mIG1lcmdlZC5vcGVuQUlBcGlLZXkgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQub3BlbkFJQXBpS2V5LnRyaW0oKSA6IFwiXCIsXG4gICAgb3BlbkFJTW9kZWw6XG4gICAgICB0eXBlb2YgbWVyZ2VkLm9wZW5BSU1vZGVsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5vcGVuQUlNb2RlbC50cmltKClcbiAgICAgICAgPyBtZXJnZWQub3BlbkFJTW9kZWwudHJpbSgpXG4gICAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5vcGVuQUlNb2RlbCxcbiAgICBvcGVuQUlCYXNlVXJsOlxuICAgICAgdHlwZW9mIG1lcmdlZC5vcGVuQUlCYXNlVXJsID09PSBcInN0cmluZ1wiICYmIG1lcmdlZC5vcGVuQUlCYXNlVXJsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5vcGVuQUlCYXNlVXJsLnRyaW0oKVxuICAgICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1Mub3BlbkFJQmFzZVVybCxcbiAgICBhaVByb3ZpZGVyOiAobWVyZ2VkLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIgPyBcImdlbWluaVwiIDogXCJvcGVuYWlcIikgYXMgXCJvcGVuYWlcIiB8IFwiZ2VtaW5pXCIsXG4gICAgZ2VtaW5pQXBpS2V5OiB0eXBlb2YgbWVyZ2VkLmdlbWluaUFwaUtleSA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5nZW1pbmlBcGlLZXkudHJpbSgpIDogXCJcIixcbiAgICBnZW1pbmlNb2RlbDpcbiAgICAgIHR5cGVvZiBtZXJnZWQuZ2VtaW5pTW9kZWwgPT09IFwic3RyaW5nXCIgJiYgbWVyZ2VkLmdlbWluaU1vZGVsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5nZW1pbmlNb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmdlbWluaU1vZGVsLFxuICAgIHN1bW1hcnlMb29rYmFja0RheXM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeUxvb2tiYWNrRGF5cywgMSwgMzY1LCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgIHN1bW1hcnlNYXhDaGFyczogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TWF4Q2hhcnMsIDEwMDAsIDEwMDAwMCwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgIHBlcnNpc3RTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLnBlcnNpc3RTdW1tYXJpZXMpLFxuICAgIGNvbGxhcHNlZFNpZGViYXJTZWN0aW9uczogQXJyYXkuaXNBcnJheShtZXJnZWQuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zKVxuICAgICAgPyAobWVyZ2VkLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyBhcyBzdHJpbmdbXSkuZmlsdGVyKChzKSA9PiB0eXBlb2YgcyA9PT0gXCJzdHJpbmdcIilcbiAgICAgIDogREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGNsYW1wSW50ZWdlcihcbiAgdmFsdWU6IHVua25vd24sXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlcixcbiAgZmFsbGJhY2s6IG51bWJlcixcbik6IG51bWJlciB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcbiAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbHVlKSk7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZShwYXJzZWQpKSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHBhcnNlZCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxsYmFjaztcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVGV4dENvbXBvbmVudCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpblNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBCcmFpblBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblxuICAgIC8vIExpc3RlbiBmb3Igc2V0dGluZyB1cGRhdGVzIChlLmcuLCBmcm9tIGF1dGggZmxvdylcbiAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uKFwiYnJhaW46c2V0dGluZ3MtdXBkYXRlZFwiIGFzIG5ldmVyLCAoKSA9PiB7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluIFNldHRpbmdzXCIgfSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdG9yYWdlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5ib3ggZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHVzZWQgZm9yIHF1aWNrIG5vdGUgY2FwdHVyZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluYm94RmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluYm94RmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSW5ib3ggZmlsZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlRhc2tzIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB1c2VkIGZvciBxdWljayB0YXNrIGNhcHR1cmUuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZpbGUsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZpbGUgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlRhc2tzIGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJKb3VybmFsIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgY29udGFpbmluZyBkYWlseSBqb3VybmFsIGZpbGVzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmpvdXJuYWxGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkpvdXJuYWwgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTm90ZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIGZvciBwcm9tb3RlZCBub3RlcyBhbmQgZ2VuZXJhdGVkIG1hcmtkb3duIGFydGlmYWN0cy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIk5vdGVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlN1bW1hcmllcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgZm9yIHBlcnNpc3RlZCBzdW1tYXJpZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlN1bW1hcmllcyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZXZpZXdzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCB0byBzdG9yZSBpbmJveCByZXZpZXcgbG9ncy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXZpZXdzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJSZXZpZXdzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQUlcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBSSBQcm92aWRlclwiKVxuICAgICAgLnNldERlc2MoXCJDaG9vc2Ugd2hpY2ggQUkgcHJvdmlkZXIgdG8gdXNlIGZvciBzeW50aGVzaXMgYW5kIHJvdXRpbmcuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PlxuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb25zKHtcbiAgICAgICAgICAgIG9wZW5haTogXCJPcGVuQUkgLyBDaGF0R1BUXCIsXG4gICAgICAgICAgICBnZW1pbmk6IFwiR29vZ2xlIEdlbWluaVwiLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYWlQcm92aWRlciA9IHZhbHVlIGFzIFwib3BlbmFpXCIgfCBcImdlbWluaVwiO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTsgLy8gUmVmcmVzaCBVSSB0byBzaG93IHJlbGV2YW50IGZpZWxkc1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5haVByb3ZpZGVyID09PSBcIm9wZW5haVwiKSB7XG4gICAgICBjb25zdCBhdXRoU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkF1dGhlbnRpY2F0aW9uXCIpXG4gICAgICAgIC5zZXREZXNjKHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA/IFwiQ29ubmVjdGVkIHRvIE9wZW5BSVwiIDogXCJOb3QgY29ubmVjdGVkXCIpO1xuXG4gICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5KSB7XG4gICAgICAgIGF1dGhTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJEaXNjb25uZWN0XCIpXG4gICAgICAgICAgICAuc2V0V2FybmluZygpXG4gICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IFwiXCI7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXV0aFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkNvbm5lY3QgT3BlbkFJXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oXCJvcGVuYWlcIik7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiT3BlbkFJIEFQSSBrZXlcIilcbiAgICAgICAgLnNldERlc2MoXCJTdG9yZWQgbG9jYWxseSBpbiBwbHVnaW4gc2V0dGluZ3MuIENhbiBiZSBhbiBBUEkga2V5IG9yIGEgc2Vzc2lvbi9hY2Nlc3MgdG9rZW4uXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG4gICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIGtleSBvciB0b2tlbi4uLlwiKTtcbiAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXksXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJPcGVuQUkgbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJTZWxlY3QgYSBtb2RlbCBvciBlbnRlciBhIGN1c3RvbSBvbmUuXCIpXG4gICAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgICBkcm9wZG93blxuICAgICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgICBcImdwdC00by1taW5pXCI6IFwiR1BULTRvIE1pbmkgKERlZmF1bHQpXCIsXG4gICAgICAgICAgICAgIFwiZ3B0LTRvXCI6IFwiR1BULTRvIChQb3dlcmZ1bClcIixcbiAgICAgICAgICAgICAgXCJvMS1taW5pXCI6IFwibzEgTWluaSAoUmVhc29uaW5nKVwiLFxuICAgICAgICAgICAgICBcIm8xLXByZXZpZXdcIjogXCJvMSBQcmV2aWV3IChTdHJvbmcgUmVhc29uaW5nKVwiLFxuICAgICAgICAgICAgICBcImdwdC0zLjUtdHVyYm9cIjogXCJHUFQtMy41IFR1cmJvIChMZWdhY3kpXCIsXG4gICAgICAgICAgICAgIGN1c3RvbTogXCJDdXN0b20gTW9kZWwuLi5cIixcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgIFtcImdwdC00by1taW5pXCIsIFwiZ3B0LTRvXCIsIFwibzEtbWluaVwiLCBcIm8xLXByZXZpZXdcIiwgXCJncHQtMy41LXR1cmJvXCJdLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgPyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbFxuICAgICAgICAgICAgICAgIDogXCJjdXN0b21cIixcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBcImN1c3RvbVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNDdXN0b20gPSAhW1wiZ3B0LTRvLW1pbmlcIiwgXCJncHQtNG9cIiwgXCJvMS1taW5pXCIsIFwibzEtcHJldmlld1wiLCBcImdwdC0zLjUtdHVyYm9cIl0uaW5jbHVkZXMoXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChpc0N1c3RvbSkge1xuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIGN1c3RvbSBtb2RlbCBuYW1lLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcodGV4dCwgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQuaW5wdXRFbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cbiAgICAgICAgLnNldE5hbWUoXCJPcGVuQUkgYmFzZSBVUkxcIilcbiAgICAgICAgLnNldERlc2MoXCJPdmVycmlkZSB0aGUgZGVmYXVsdCBPcGVuQUkgZW5kcG9pbnQgZm9yIGN1c3RvbSBwcm94aWVzIG9yIGxvY2FsIExMTXMuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUJhc2VVcmwsXG4gICAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQmFzZVVybCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJPcGVuQUkgYmFzZSBVUkwgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmFpUHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIGNvbnN0IGF1dGhTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiQXV0aGVudGljYXRpb25cIilcbiAgICAgICAgLnNldERlc2ModGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5ID8gXCJDb25uZWN0ZWQgdG8gR29vZ2xlXCIgOiBcIk5vdCBjb25uZWN0ZWRcIik7XG5cbiAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkpIHtcbiAgICAgICAgYXV0aFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkRpc2Nvbm5lY3RcIilcbiAgICAgICAgICAgIC5zZXRXYXJuaW5nKClcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5ID0gXCJcIjtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdXRoU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQ29ubmVjdCBHb29nbGVcIilcbiAgICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hdXRoU2VydmljZS5sb2dpbihcImdlbWluaVwiKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJHZW1pbmkgQVBJIGtleVwiKVxuICAgICAgICAuc2V0RGVzYyhcIlN0b3JlZCBsb2NhbGx5IGluIHBsdWdpbiBzZXR0aW5ncy5cIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwicGFzc3dvcmRcIjtcbiAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgR2VtaW5pIEFQSSBrZXkuLi5cIik7XG4gICAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LFxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaUFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiR2VtaW5pIG1vZGVsXCIpXG4gICAgICAgIC5zZXREZXNjKFwiU2VsZWN0IGEgR2VtaW5pIG1vZGVsIG9yIGVudGVyIGEgY3VzdG9tIG9uZS5cIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTEuNS1mbGFzaFwiOiBcIkdlbWluaSAxLjUgRmxhc2ggKEZhc3Rlc3QpXCIsXG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTEuNS1mbGFzaC04YlwiOiBcIkdlbWluaSAxLjUgRmxhc2ggOEIgKExpZ2h0ZXIpXCIsXG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTEuNS1wcm9cIjogXCJHZW1pbmkgMS41IFBybyAoUG93ZXJmdWwpXCIsXG4gICAgICAgICAgICAgIFwiZ2VtaW5pLTIuMC1mbGFzaFwiOiBcIkdlbWluaSAyLjAgRmxhc2ggKExhdGVzdClcIixcbiAgICAgICAgICAgICAgY3VzdG9tOiBcIkN1c3RvbSBNb2RlbC4uLlwiLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgW1wiZ2VtaW5pLTEuNS1mbGFzaFwiLCBcImdlbWluaS0xLjUtZmxhc2gtOGJcIiwgXCJnZW1pbmktMS41LXByb1wiLCBcImdlbWluaS0yLjAtZmxhc2hcIl0uaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2VtaW5pTW9kZWwsXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICA/IHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsXG4gICAgICAgICAgICAgICAgOiBcImN1c3RvbVwiLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IFwiY3VzdG9tXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBpc0N1c3RvbSA9ICFbXCJnZW1pbmktMS41LWZsYXNoXCIsIFwiZ2VtaW5pLTEuNS1mbGFzaC04YlwiLCBcImdlbWluaS0xLjUtcHJvXCIsIFwiZ2VtaW5pLTIuMC1mbGFzaFwiXS5pbmNsdWRlcyhcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGlzQ3VzdG9tKSB7XG4gICAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgY3VzdG9tIG1vZGVsIG5hbWUuLi5cIik7XG4gICAgICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyh0ZXh0LCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlNb2RlbCwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdlbWluaU1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dC5pbnB1dEVsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFJIFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHN5bnRoZXNpc1wiKVxuICAgICAgLnNldERlc2MoXCJVc2UgQUkgZm9yIHN5bnRoZXNpcywgcXVlc3Rpb24gYW5zd2VyaW5nLCBhbmQgdG9waWMgcGFnZXMgd2hlbiBjb25maWd1cmVkLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgQUkgcm91dGluZ1wiKVxuICAgICAgLnNldERlc2MoXCJBbGxvdyB0aGUgc2lkZWJhciB0byBhdXRvLXJvdXRlIGNhcHR1cmVzIHdpdGggQUkuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJDb250ZXh0IENvbGxlY3Rpb25cIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJMb29rYmFjayBkYXlzXCIpXG4gICAgICAuc2V0RGVzYyhcIkhvdyBmYXIgYmFjayB0byBzY2FuIHdoZW4gYnVpbGRpbmcgcmVjZW50LWNvbnRleHQgc3VtbWFyaWVzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzID1cbiAgICAgICAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMCA/IHBhcnNlZCA6IDc7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTWF4aW11bSBjaGFyYWN0ZXJzXCIpXG4gICAgICAuc2V0RGVzYyhcIk1heGltdW0gdGV4dCBjb2xsZWN0ZWQgYmVmb3JlIHN5bnRoZXNpcyBvciBzdW1tYXJ5LlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyksXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+PSAxMDAwID8gcGFyc2VkIDogMTIwMDA7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdW1tYXJ5IE91dHB1dFwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlBlcnNpc3Qgc3VtbWFyaWVzXCIpXG4gICAgICAuc2V0RGVzYyhcIldyaXRlIGdlbmVyYXRlZCBzdW1tYXJpZXMgaW50byB0aGUgdmF1bHQuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYmluZFRleHRTZXR0aW5nKFxuICAgIHRleHQ6IFRleHRDb21wb25lbnQsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgICBvblZhbHVlQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiBUZXh0Q29tcG9uZW50IHtcbiAgICBsZXQgY3VycmVudFZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGxhc3RTYXZlZFZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGlzU2F2aW5nID0gZmFsc2U7XG5cbiAgICB0ZXh0LnNldFZhbHVlKHZhbHVlKS5vbkNoYW5nZSgobmV4dFZhbHVlKSA9PiB7XG4gICAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKG5leHRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY3VycmVudFZhbHVlID0gbmV4dFZhbHVlO1xuICAgICAgb25WYWx1ZUNoYW5nZShuZXh0VmFsdWUpO1xuICAgIH0pO1xuICAgIHRoaXMucXVldWVTYXZlT25CbHVyKFxuICAgICAgdGV4dC5pbnB1dEVsLFxuICAgICAgKCkgPT4gY3VycmVudFZhbHVlLFxuICAgICAgKCkgPT4gbGFzdFNhdmVkVmFsdWUsXG4gICAgICAoc2F2ZWRWYWx1ZSkgPT4ge1xuICAgICAgICBsYXN0U2F2ZWRWYWx1ZSA9IHNhdmVkVmFsdWU7XG4gICAgICB9LFxuICAgICAgKCkgPT4gaXNTYXZpbmcsXG4gICAgICAoc2F2aW5nKSA9PiB7XG4gICAgICAgIGlzU2F2aW5nID0gc2F2aW5nO1xuICAgICAgfSxcbiAgICAgIHZhbGlkYXRlLFxuICAgICk7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlU2F2ZU9uQmx1cihcbiAgICBpbnB1dDogSFRNTElucHV0RWxlbWVudCxcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogdm9pZCB7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVPbkJsdXIoXG4gICAgICAgIGdldEN1cnJlbnRWYWx1ZSxcbiAgICAgICAgZ2V0TGFzdFNhdmVkVmFsdWUsXG4gICAgICAgIHNldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBpc1NhdmluZyxcbiAgICAgICAgc2V0U2F2aW5nLFxuICAgICAgICB2YWxpZGF0ZSxcbiAgICAgICk7XG4gICAgfSk7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmXG4gICAgICAgICFldmVudC5tZXRhS2V5ICYmXG4gICAgICAgICFldmVudC5jdHJsS2V5ICYmXG4gICAgICAgICFldmVudC5hbHRLZXkgJiZcbiAgICAgICAgIWV2ZW50LnNoaWZ0S2V5XG4gICAgICApIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlT25CbHVyKFxuICAgIGdldEN1cnJlbnRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIGdldExhc3RTYXZlZFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgc2V0TGFzdFNhdmVkVmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIGlzU2F2aW5nOiAoKSA9PiBib29sZWFuLFxuICAgIHNldFNhdmluZzogKHNhdmluZzogYm9vbGVhbikgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoaXNTYXZpbmcoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGdldEN1cnJlbnRWYWx1ZSgpO1xuICAgIGlmIChjdXJyZW50VmFsdWUgPT09IGdldExhc3RTYXZlZFZhbHVlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRTYXZpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgc2V0TGFzdFNhdmVkVmFsdWUoY3VycmVudFZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2F2aW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBnZXRXaW5kb3dTdGFydCB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGhlc2lzQ29udGV4dCB7XG4gIHNvdXJjZUxhYmVsOiBzdHJpbmc7XG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGw7XG4gIHNvdXJjZVBhdGhzPzogc3RyaW5nW107XG4gIHRleHQ6IHN0cmluZztcbiAgb3JpZ2luYWxMZW5ndGg6IG51bWJlcjtcbiAgdHJ1bmNhdGVkOiBib29sZWFuO1xuICBtYXhDaGFyczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgQ29udGV4dFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0Q3VycmVudE5vdGVDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IHZpZXcuZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBub3RlIGlzIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChcIkN1cnJlbnQgbm90ZVwiLCB2aWV3LmZpbGUucGF0aCwgdGV4dCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZFRleHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IHZpZXcuZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlbGVjdCBzb21lIHRleHQgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KFwiU2VsZWN0ZWQgdGV4dFwiLCB2aWV3LmZpbGUucGF0aCwgdGV4dCk7XG4gIH1cblxuICBhc3luYyBnZXRSZWNlbnRGaWxlc0NvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdFJlY2VudE1hcmtkb3duRmlsZXMoc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiUmVjZW50IGZpbGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IHZpZXcuZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdEZpbGVzSW5Gb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiQ3VycmVudCBmb2xkZXJcIiwgZmlsZXMsIGZvbGRlclBhdGggfHwgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlczogVEZpbGVbXSk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG1hcmtkb3duIG5vdGVcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiU2VsZWN0ZWQgbm90ZXNcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VmF1bHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0VmF1bHRNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiRW50aXJlIHZhdWx0XCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0KFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgc291cmNlUGF0aHM/OiBzdHJpbmdbXSxcbiAgKTogU3ludGhlc2lzQ29udGV4dCB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBtYXhDaGFycyA9IE1hdGgubWF4KDEwMDAsIHNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyk7XG4gICAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICAgIGNvbnN0IG9yaWdpbmFsTGVuZ3RoID0gdHJpbW1lZC5sZW5ndGg7XG4gICAgY29uc3QgdHJ1bmNhdGVkID0gb3JpZ2luYWxMZW5ndGggPiBtYXhDaGFycztcbiAgICBjb25zdCBsaW1pdGVkID0gdHJ1bmNhdGVkID8gdHJpbW1lZC5zbGljZSgwLCBtYXhDaGFycykudHJpbUVuZCgpIDogdHJpbW1lZDtcblxuICAgIHJldHVybiB7XG4gICAgICBzb3VyY2VMYWJlbCxcbiAgICAgIHNvdXJjZVBhdGgsXG4gICAgICBzb3VyY2VQYXRocyxcbiAgICAgIHRleHQ6IGxpbWl0ZWQsXG4gICAgICBvcmlnaW5hbExlbmd0aCxcbiAgICAgIHRydW5jYXRlZCxcbiAgICAgIG1heENoYXJzLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGJ1aWxkRmlsZUdyb3VwQ29udGV4dChcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIGZpbGVzOiBURmlsZVtdLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG1hcmtkb3duIGZpbGVzIGZvdW5kIGZvciAke3NvdXJjZUxhYmVsLnRvTG93ZXJDYXNlKCl9YCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbWFya2Rvd24gZmlsZXMgZm91bmQgZm9yICR7c291cmNlTGFiZWwudG9Mb3dlckNhc2UoKX1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoc291cmNlTGFiZWwsIHNvdXJjZVBhdGgsIHRleHQsIGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5wYXRoKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RSZWNlbnRNYXJrZG93bkZpbGVzKGxvb2tiYWNrRGF5czogbnVtYmVyKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzKS5nZXRUaW1lKCk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IGN1dG9mZilcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RWYXVsdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdEZpbGVzSW5Gb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT5cbiAgICAgICAgZm9sZGVyUGF0aCA/IGlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBmb2xkZXJQYXRoKSA6ICFmaWxlLnBhdGguaW5jbHVkZXMoXCIvXCIpLFxuICAgICAgKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxufVxuXG5cbiIsICJpbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gIHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICBmaWxlczogVEZpbGVbXSxcbiAgbWF4Q2hhcnM6IG51bWJlcixcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgdG90YWwgPSAwO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gICAgICBpZiAoIXRyaW1tZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGJsb2NrID0gW2AtLS0gJHtmaWxlLnBhdGh9YCwgdHJpbW1lZF0uam9pbihcIlxcblwiKTtcbiAgICAgIGlmICh0b3RhbCArIGJsb2NrLmxlbmd0aCA+IG1heENoYXJzKSB7XG4gICAgICAgIGNvbnN0IHJlbWFpbmluZyA9IE1hdGgubWF4KDAsIG1heENoYXJzIC0gdG90YWwpO1xuICAgICAgICBpZiAocmVtYWluaW5nID4gMCkge1xuICAgICAgICAgIHBhcnRzLnB1c2goYmxvY2suc2xpY2UoMCwgcmVtYWluaW5nKSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBhcnRzLnB1c2goYmxvY2spO1xuICAgICAgdG90YWwgKz0gYmxvY2subGVuZ3RoO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbihcIlxcblxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpXG4gICAgLnNsaWNlKDAsIDQ4KSB8fCBcIm5vdGVcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyaW1UaXRsZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGlmICh0cmltbWVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiB0cmltbWVkO1xuICB9XG4gIHJldHVybiBgJHt0cmltbWVkLnNsaWNlKDAsIDU3KS50cmltRW5kKCl9Li4uYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFwcGVuZFNlcGFyYXRvcih0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgaWYgKHRleHQuZW5kc1dpdGgoXCJcXG5cXG5cIikpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBpZiAodGV4dC5lbmRzV2l0aChcIlxcblwiKSkge1xuICAgIHJldHVybiBcIlxcblwiO1xuICB9XG4gIHJldHVybiBcIlxcblxcblwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBMZWFkaW5nVGl0bGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnRyaW0oKS5zcGxpdChcIlxcblwiKTtcbiAgaWYgKCFsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGlmICghL14jXFxzKy8udGVzdChsaW5lc1swXSkpIHtcbiAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gIH1cblxuICBjb25zdCByZW1haW5pbmcgPSBsaW5lcy5zbGljZSgxKTtcbiAgd2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwICYmICFyZW1haW5pbmdbMF0udHJpbSgpKSB7XG4gICAgcmVtYWluaW5nLnNoaWZ0KCk7XG4gIH1cbiAgcmV0dXJuIHJlbWFpbmluZy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICIvKipcbiAqIFBhdGggdXRpbGl0eSBmdW5jdGlvbnNcbiAqL1xuXG4vKipcbiAqIENoZWNrIGlmIGEgcGF0aCBpcyB1bmRlciBhIHNwZWNpZmljIGZvbGRlciAob3IgaXMgdGhlIGZvbGRlciBpdHNlbGYpLlxuICogSGFuZGxlcyB0cmFpbGluZyBzbGFzaGVzIGNvbnNpc3RlbnRseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVW5kZXJGb2xkZXIocGF0aDogc3RyaW5nLCBmb2xkZXI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBub3JtYWxpemVkRm9sZGVyID0gZm9sZGVyLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBwYXRoID09PSBub3JtYWxpemVkRm9sZGVyIHx8IHBhdGguc3RhcnRzV2l0aChgJHtub3JtYWxpemVkRm9sZGVyfS9gKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZUtleShkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtkYXRlLmdldEZ1bGxZZWFyKCl9LSR7cGFkMihkYXRlLmdldE1vbnRoKCkgKyAxKX0tJHtwYWQyKGRhdGUuZ2V0RGF0ZSgpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VGltZUtleShkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtwYWQyKGRhdGUuZ2V0SG91cnMoKSl9OiR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERhdGVUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9ICR7Zm9ybWF0VGltZUtleShkYXRlKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U3VtbWFyeVRpbWVzdGFtcChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtmb3JtYXREYXRlS2V5KGRhdGUpfS0ke3BhZDIoZGF0ZS5nZXRIb3VycygpKX0ke3BhZDIoZGF0ZS5nZXRNaW51dGVzKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUucmVwbGFjZSgvXFxzKyQvZywgXCJcIikpXG4gICAgLmpvaW4oXCJcXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJpbVRyYWlsaW5nTmV3bGluZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFxuKyQvZywgXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXM6IG51bWJlcik6IERhdGUge1xuICBjb25zdCBzYWZlRGF5cyA9IE1hdGgubWF4KDEsIGxvb2tiYWNrRGF5cyk7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgc3RhcnQuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gIHN0YXJ0LnNldERhdGUoc3RhcnQuZ2V0RGF0ZSgpIC0gKHNhZmVEYXlzIC0gMSkpO1xuICByZXR1cm4gc3RhcnQ7XG59XG5cbmZ1bmN0aW9uIHBhZDIodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5ib3hWYXVsdFNlcnZpY2Uge1xuICByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+O1xuICByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9PjtcbiAgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmJveEVudHJ5IHtcbiAgaGVhZGluZzogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIHJhdzogc3RyaW5nO1xuICBwcmV2aWV3OiBzdHJpbmc7XG4gIGluZGV4OiBudW1iZXI7XG4gIHNpZ25hdHVyZTogc3RyaW5nO1xuICBzaWduYXR1cmVJbmRleDogbnVtYmVyO1xuICBzdGFydExpbmU6IG51bWJlcjtcbiAgZW5kTGluZTogbnVtYmVyO1xuICByZXZpZXdlZDogYm9vbGVhbjtcbiAgcmV2aWV3QWN0aW9uOiBzdHJpbmcgfCBudWxsO1xuICByZXZpZXdlZEF0OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBJbmJveEVudHJ5SWRlbnRpdHkgPSBQaWNrPFxuICBJbmJveEVudHJ5LFxuICBcImhlYWRpbmdcIiB8IFwiYm9keVwiIHwgXCJwcmV2aWV3XCIgfCBcInNpZ25hdHVyZVwiIHwgXCJzaWduYXR1cmVJbmRleFwiXG4+ICZcbiAgUGFydGlhbDxQaWNrPEluYm94RW50cnksIFwicmF3XCIgfCBcInN0YXJ0TGluZVwiIHwgXCJlbmRMaW5lXCI+PjtcblxuZXhwb3J0IGNsYXNzIEluYm94U2VydmljZSB7XG4gIHByaXZhdGUgdW5yZXZpZXdlZENvdW50Q2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogSW5ib3hWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0UmVjZW50RW50cmllcyhsaW1pdCA9IDIwLCBpbmNsdWRlUmV2aWV3ZWQgPSBmYWxzZSk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBlbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBpbmNsdWRlUmV2aWV3ZWQgPyBlbnRyaWVzIDogZW50cmllcy5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpO1xuICAgIHJldHVybiBmaWx0ZXJlZC5zbGljZSgtbGltaXQpLnJldmVyc2UoKTtcbiAgfVxuXG4gIGFzeW5jIGdldFVucmV2aWV3ZWRDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgeyB0ZXh0LCBtdGltZSwgZXhpc3RzIH0gPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dFdpdGhNdGltZShzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGlmICghZXhpc3RzKSB7XG4gICAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0ge1xuICAgICAgICBtdGltZTogMCxcbiAgICAgICAgY291bnQ6IDAsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgJiYgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZS5tdGltZSA9PT0gbXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlLmNvdW50O1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gcGFyc2VJbmJveEVudHJpZXModGV4dCkuZmlsdGVyKChlbnRyeSkgPT4gIWVudHJ5LnJldmlld2VkKS5sZW5ndGg7XG4gICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IHtcbiAgICAgIG10aW1lLFxuICAgICAgY291bnQsXG4gICAgfTtcbiAgICByZXR1cm4gY291bnQ7XG4gIH1cblxuICBhc3luYyBtYXJrRW50cnlSZXZpZXdlZChlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgY3VycmVudEVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBjdXJyZW50RW50cnkgPVxuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZSA9PT0gZW50cnkuc2lnbmF0dXJlICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZUluZGV4ID09PSBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICAgICkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJiBjYW5kaWRhdGUucmF3ID09PSBlbnRyeS5yYXcpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuaGVhZGluZyA9PT0gZW50cnkuaGVhZGluZyAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5ib2R5ID09PSBlbnRyeS5ib2R5ICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnByZXZpZXcgPT09IGVudHJ5LnByZXZpZXcsXG4gICAgICApID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuaGVhZGluZyA9PT0gZW50cnkuaGVhZGluZyAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zdGFydExpbmUgPT09IGVudHJ5LnN0YXJ0TGluZSxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSBpbnNlcnRSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5LCBhY3Rpb24pO1xuICAgIGlmICh1cGRhdGVkID09PSBjb250ZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHNldHRpbmdzLmluYm94RmlsZSwgdXBkYXRlZCk7XG4gICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyByZW9wZW5FbnRyeShlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmUgPT09IGVudHJ5LnNpZ25hdHVyZSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmVJbmRleCA9PT0gZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgICApID8/XG4gICAgICBmaW5kVW5pcXVlUmV2aWV3ZWRTaWduYXR1cmVNYXRjaChjdXJyZW50RW50cmllcywgZW50cnkuc2lnbmF0dXJlKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICBjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuaGVhZGluZyA9PT0gZW50cnkuaGVhZGluZyAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5ib2R5ID09PSBlbnRyeS5ib2R5ICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnByZXZpZXcgPT09IGVudHJ5LnByZXZpZXcsXG4gICAgICApO1xuXG4gICAgaWYgKCFjdXJyZW50RW50cnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkID0gcmVtb3ZlUmV2aWV3TWFya2VyKGNvbnRlbnQsIGN1cnJlbnRFbnRyeSk7XG4gICAgaWYgKHVwZGF0ZWQgPT09IGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCB1cGRhdGVkKTtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmJveEVudHJpZXMoY29udGVudDogc3RyaW5nKTogSW5ib3hFbnRyeVtdIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBlbnRyaWVzOiBJbmJveEVudHJ5W10gPSBbXTtcbiAgbGV0IGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRCb2R5TGluZXM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWQgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdBY3Rpb246IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudFJldmlld2VkQXQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBjb25zdCBzaWduYXR1cmVDb3VudHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGNvbnN0IHB1c2hFbnRyeSA9IChlbmRMaW5lOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjdXJyZW50Qm9keUxpbmVzID0gW107XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm9keSA9IGN1cnJlbnRCb2R5TGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG4gICAgY29uc3QgcHJldmlldyA9IGJ1aWxkUHJldmlldyhib2R5KTtcbiAgICBjb25zdCByYXcgPSBbY3VycmVudEhlYWRpbmcsIC4uLmN1cnJlbnRCb2R5TGluZXNdLmpvaW4oXCJcXG5cIikudHJpbUVuZCgpO1xuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGJ1aWxkRW50cnlTaWduYXR1cmUoY3VycmVudEhlYWRpbmcsIGN1cnJlbnRCb2R5TGluZXMpO1xuICAgIGNvbnN0IHNpZ25hdHVyZUluZGV4ID0gc2lnbmF0dXJlQ291bnRzLmdldChzaWduYXR1cmUpID8/IDA7XG4gICAgc2lnbmF0dXJlQ291bnRzLnNldChzaWduYXR1cmUsIHNpZ25hdHVyZUluZGV4ICsgMSk7XG4gICAgZW50cmllcy5wdXNoKHtcbiAgICAgIGhlYWRpbmc6IGN1cnJlbnRIZWFkaW5nLnJlcGxhY2UoL14jI1xccysvLCBcIlwiKS50cmltKCksXG4gICAgICBib2R5LFxuICAgICAgcmF3LFxuICAgICAgcHJldmlldyxcbiAgICAgIGluZGV4OiBlbnRyaWVzLmxlbmd0aCxcbiAgICAgIHNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4LFxuICAgICAgc3RhcnRMaW5lOiBjdXJyZW50U3RhcnRMaW5lLFxuICAgICAgZW5kTGluZSxcbiAgICAgIHJldmlld2VkOiBjdXJyZW50UmV2aWV3ZWQsXG4gICAgICByZXZpZXdBY3Rpb246IGN1cnJlbnRSZXZpZXdBY3Rpb24sXG4gICAgICByZXZpZXdlZEF0OiBjdXJyZW50UmV2aWV3ZWRBdCxcbiAgICB9KTtcbiAgICBjdXJyZW50Qm9keUxpbmVzID0gW107XG4gICAgY3VycmVudFN0YXJ0TGluZSA9IC0xO1xuICAgIGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICAgIGN1cnJlbnRSZXZpZXdBY3Rpb24gPSBudWxsO1xuICAgIGN1cnJlbnRSZXZpZXdlZEF0ID0gbnVsbDtcbiAgfTtcblxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGluZXMubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgbGluZSA9IGxpbmVzW2luZGV4XTtcbiAgICBjb25zdCBoZWFkaW5nTWF0Y2ggPSBsaW5lLm1hdGNoKC9eIyNcXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoKSB7XG4gICAgICBwdXNoRW50cnkoaW5kZXgpO1xuICAgICAgY3VycmVudEhlYWRpbmcgPSBsaW5lO1xuICAgICAgY3VycmVudFN0YXJ0TGluZSA9IGluZGV4O1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFjdXJyZW50SGVhZGluZykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcmV2aWV3TWF0Y2ggPSBsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDpcXHMqKFthLXpdKykoPzpcXHMrKC4rPykpP1xccyotLT4kL2kpO1xuICAgIGlmIChyZXZpZXdNYXRjaCkge1xuICAgICAgY3VycmVudFJldmlld2VkID0gdHJ1ZTtcbiAgICAgIGN1cnJlbnRSZXZpZXdBY3Rpb24gPSByZXZpZXdNYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY3VycmVudFJldmlld2VkQXQgPSByZXZpZXdNYXRjaFsyXSA/PyBudWxsO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY3VycmVudEJvZHlMaW5lcy5wdXNoKGxpbmUpO1xuICB9XG5cbiAgcHVzaEVudHJ5KGxpbmVzLmxlbmd0aCk7XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRSZXZpZXdNYXJrZXIoY29udGVudDogc3RyaW5nLCBlbnRyeTogSW5ib3hFbnRyeSwgYWN0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGlmIChlbnRyeS5zdGFydExpbmUgPCAwIHx8IGVudHJ5LmVuZExpbmUgPCBlbnRyeS5zdGFydExpbmUgfHwgZW50cnkuZW5kTGluZSA+IGxpbmVzLmxlbmd0aCkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgdGltZXN0YW1wID0gZm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSk7XG4gIGNvbnN0IG1hcmtlciA9IGA8IS0tIGJyYWluLXJldmlld2VkOiAke2FjdGlvbn0gJHt0aW1lc3RhbXB9IC0tPmA7XG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuICBjbGVhbmVkRW50cnlMaW5lcy5wdXNoKG1hcmtlciwgXCJcIik7XG5cbiAgY29uc3QgdXBkYXRlZExpbmVzID0gW1xuICAgIC4uLmxpbmVzLnNsaWNlKDAsIGVudHJ5LnN0YXJ0TGluZSksXG4gICAgLi4uY2xlYW5lZEVudHJ5TGluZXMsXG4gICAgLi4ubGluZXMuc2xpY2UoZW50cnkuZW5kTGluZSksXG4gIF07XG5cbiAgcmV0dXJuIHRyaW1UcmFpbGluZ0JsYW5rTGluZXModXBkYXRlZExpbmVzKS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudDogc3RyaW5nLCBlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCBlbnRyeUxpbmVzID0gbGluZXMuc2xpY2UoZW50cnkuc3RhcnRMaW5lLCBlbnRyeS5lbmRMaW5lKTtcbiAgY29uc3QgY2xlYW5lZEVudHJ5TGluZXMgPSB0cmltVHJhaWxpbmdCbGFua0xpbmVzKFxuICAgIGVudHJ5TGluZXMuZmlsdGVyKChsaW5lKSA9PiAhbGluZS5tYXRjaCgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kpKSxcbiAgKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkUHJldmlldyhib2R5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGJvZHlcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICByZXR1cm4gbGluZXNbMF0gPz8gXCJcIjtcbn1cblxuZnVuY3Rpb24gYnVpbGRFbnRyeVNpZ25hdHVyZShoZWFkaW5nOiBzdHJpbmcsIGJvZHlMaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gW2hlYWRpbmcudHJpbSgpLCAuLi5ib2R5TGluZXMubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSldLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHRyaW1UcmFpbGluZ0JsYW5rTGluZXMobGluZXM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCBjbG9uZSA9IFsuLi5saW5lc107XG4gIHdoaWxlIChjbG9uZS5sZW5ndGggPiAwICYmIGNsb25lW2Nsb25lLmxlbmd0aCAtIDFdLnRyaW0oKSA9PT0gXCJcIikge1xuICAgIGNsb25lLnBvcCgpO1xuICB9XG4gIHJldHVybiBjbG9uZTtcbn1cblxuZnVuY3Rpb24gZmluZFVuaXF1ZVJldmlld2VkU2lnbmF0dXJlTWF0Y2goXG4gIGVudHJpZXM6IEluYm94RW50cnlbXSxcbiAgc2lnbmF0dXJlOiBzdHJpbmcsXG4pOiBJbmJveEVudHJ5IHwgbnVsbCB7XG4gIGNvbnN0IHJldmlld2VkTWF0Y2hlcyA9IGVudHJpZXMuZmlsdGVyKFxuICAgIChlbnRyeSkgPT4gZW50cnkucmV2aWV3ZWQgJiYgZW50cnkuc2lnbmF0dXJlID09PSBzaWduYXR1cmUsXG4gICk7XG4gIGlmIChyZXZpZXdlZE1hdGNoZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHJldmlld2VkTWF0Y2hlc1swXTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBjb2xsYXBzZUpvdXJuYWxUZXh0LCBmb3JtYXREYXRlS2V5LCBmb3JtYXRUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBKb3VybmFsU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgZ2V0Sm91cm5hbFBhdGgoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdERhdGVLZXkoZGF0ZSk7XG4gICAgcmV0dXJuIGAke3NldHRpbmdzLmpvdXJuYWxGb2xkZXJ9LyR7ZGF0ZUtleX0ubWRgO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdERhdGVLZXkoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0Sm91cm5hbFBhdGgoZGF0ZSk7XG4gICAgcmV0dXJuIHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZEpvdXJuYWxIZWFkZXIocGF0aCwgZGF0ZUtleSk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRFbnRyeSh0ZXh0OiBzdHJpbmcsIGRhdGUgPSBuZXcgRGF0ZSgpKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlSm91cm5hbFRleHQodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJKb3VybmFsIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUpvdXJuYWxGaWxlKGRhdGUpO1xuICAgIGNvbnN0IHBhdGggPSBmaWxlLnBhdGg7XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdFRpbWVLZXkoZGF0ZSl9XFxuJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBibG9jayk7XG4gICAgcmV0dXJuIHsgcGF0aCB9O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHtcbiAgY29sbGFwc2VXaGl0ZXNwYWNlLFxuICBmb3JtYXREYXRlVGltZUtleSxcbiAgZm9ybWF0U3VtbWFyeVRpbWVzdGFtcCxcbn0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IHNsdWdpZnksIHRyaW1UaXRsZSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgTm90ZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZE5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90ZSB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfVxcbi0gJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy5pbmJveEZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgY2xlYW5lZFRpdGxlID0gdHJpbVRpdGxlKHRpdGxlKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGAke2Zvcm1hdFN1bW1hcnlUaW1lc3RhbXAobm93KX0tJHtzbHVnaWZ5KGNsZWFuZWRUaXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoXG4gICAgICBgJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn0vJHtmaWxlTmFtZX1gLFxuICAgICk7XG4gICAgY29uc3Qgc291cmNlTGluZSA9IHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgID8gYCR7c291cmNlTGFiZWx9IFx1MjAyMiAke3NvdXJjZVBhdGhzLmxlbmd0aH0gJHtzb3VyY2VQYXRocy5sZW5ndGggPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gXG4gICAgICA6IHNvdXJjZVBhdGhcbiAgICAgICAgPyBgJHtzb3VyY2VMYWJlbH0gXHUyMDIyICR7c291cmNlUGF0aH1gXG4gICAgICAgIDogc291cmNlTGFiZWw7XG4gICAgY29uc3Qgc291cmNlRmlsZUxpbmVzID0gc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgPyBbXG4gICAgICAgICAgXCJTb3VyY2UgZmlsZXM6XCIsXG4gICAgICAgICAgLi4uc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpLm1hcCgoc291cmNlKSA9PiBgLSAke3NvdXJjZX1gKSxcbiAgICAgICAgICAuLi4oc291cmNlUGF0aHMubGVuZ3RoID4gMTJcbiAgICAgICAgICAgID8gW2AtIC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYF1cbiAgICAgICAgICAgIDogW10pLFxuICAgICAgICBdXG4gICAgICA6IFtdO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke2NsZWFuZWRUaXRsZX1gLFxuICAgICAgXCJcIixcbiAgICAgIGBDcmVhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIGBTb3VyY2U6ICR7c291cmNlTGluZX1gLFxuICAgICAgLi4uc291cmNlRmlsZUxpbmVzLFxuICAgICAgXCJcIixcbiAgICAgIGNvbGxhcHNlV2hpdGVzcGFjZShib2R5KSA/IGJvZHkudHJpbSgpIDogXCJObyBhcnRpZmFjdCBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgY29udGVudCk7XG4gIH1cbn1cblxuXG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5IH0gZnJvbSBcIi4vaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJldmlld0xvZ0VudHJ5IGV4dGVuZHMgSW5ib3hFbnRyeUlkZW50aXR5IHtcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmc7XG4gIGZpbGVNdGltZTogbnVtYmVyO1xuICBlbnRyeUluZGV4OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdMb2dTZXJ2aWNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdFbnRyeUNvdW50Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfT4oKTtcbiAgcHJpdmF0ZSByZXZpZXdMb2dGaWxlc0NhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBmaWxlczogVEZpbGVbXTtcbiAgfSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJldmlld0VudHJ5VG90YWxDYWNoZToge1xuICAgIGxpc3RpbmdNdGltZTogbnVtYmVyO1xuICAgIHRvdGFsOiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFJldmlld0xvZyhlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShub3cpO1xuICAgIGNvbnN0IHBhdGggPSBgJHtzZXR0aW5ncy5yZXZpZXdzRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYC0gQWN0aW9uOiAke2FjdGlvbn1gLFxuICAgICAgYC0gSW5ib3g6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgYC0gUHJldmlldzogJHtlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgXCIoZW1wdHkpXCJ9YCxcbiAgICAgIGAtIFNpZ25hdHVyZTogJHtlbmNvZGVSZXZpZXdTaWduYXR1cmUoZW50cnkuc2lnbmF0dXJlKX1gLFxuICAgICAgYC0gU2lnbmF0dXJlIGluZGV4OiAke2VudHJ5LnNpZ25hdHVyZUluZGV4fWAsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSBudWxsO1xuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdMb2dGaWxlcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG5cbiAgICBpZiAoIXRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSkge1xuICAgICAgY29uc3QgYWxsRmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgICAgY29uc3QgbWF0Y2hpbmcgPSBhbGxGaWxlc1xuICAgICAgICAuZmlsdGVyKChmaWxlKSA9PiBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gICAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiBtYXRjaGluZ1swXT8uc3RhdC5tdGltZSA/PyAwLFxuICAgICAgICBmaWxlczogbWF0Y2hpbmcsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCJcbiAgICAgID8gdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlLmZpbGVzLnNsaWNlKDAsIGxpbWl0KVxuICAgICAgOiB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUuZmlsZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyaWVzKGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxSZXZpZXdMb2dFbnRyeVtdPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQpO1xuICAgIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBsb2dzKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSk7XG4gICAgICBlbnRyaWVzLnB1c2goLi4ucGFyc2VkLnJldmVyc2UoKSk7XG4gICAgICBpZiAodHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiICYmIGVudHJpZXMubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgPyBlbnRyaWVzLnNsaWNlKDAsIGxpbWl0KSA6IGVudHJpZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMoKTtcbiAgICBpZiAobG9ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWU6IDAsIHRvdGFsOiAwIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0aW5nTXRpbWUgPSBsb2dzWzBdLnN0YXQubXRpbWU7XG4gICAgaWYgKHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlPy5saXN0aW5nTXRpbWUgPT09IGxpc3RpbmdNdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlLnRvdGFsO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZW5QYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGxldCB0b3RhbCA9IDA7XG5cbiAgICBjb25zdCB1bmNhY2hlZEZpbGVzID0gbG9ncy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuICEoY2FjaGVkICYmIGNhY2hlZC5tdGltZSA9PT0gZmlsZS5zdGF0Lm10aW1lKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNhY2hlZEZpbGVzID0gbG9ncy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuIGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZTtcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBjYWNoZWRGaWxlcykge1xuICAgICAgc2VlblBhdGhzLmFkZChmaWxlLnBhdGgpO1xuICAgICAgdG90YWwgKz0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCkhLmNvdW50O1xuICAgIH1cblxuICAgIGlmICh1bmNhY2hlZEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgdW5jYWNoZWRGaWxlcy5tYXAoYXN5bmMgKGZpbGUpID0+IHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSkubGVuZ3RoO1xuICAgICAgICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLnNldChmaWxlLnBhdGgsIHtcbiAgICAgICAgICAgIG10aW1lOiBmaWxlLnN0YXQubXRpbWUsXG4gICAgICAgICAgICBjb3VudCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4geyBmaWxlLCBjb3VudCB9O1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICAgIGZvciAoY29uc3QgeyBmaWxlLCBjb3VudCB9IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgc2VlblBhdGhzLmFkZChmaWxlLnBhdGgpO1xuICAgICAgICB0b3RhbCArPSBjb3VudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUua2V5cygpKSB7XG4gICAgICBpZiAoIXNlZW5QYXRocy5oYXMocGF0aCkpIHtcbiAgICAgICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZGVsZXRlKHBhdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWUsIHRvdGFsIH07XG4gICAgcmV0dXJuIHRvdGFsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJldmlld0xvZ0VudHJpZXMoXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nLFxuICBmaWxlTXRpbWU6IG51bWJlcixcbik6IFJldmlld0xvZ0VudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcbiAgbGV0IGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICBsZXQgY3VycmVudEFjdGlvbiA9IFwiXCI7XG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gIGxldCBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IDA7XG4gIGxldCBjdXJyZW50RW50cnlJbmRleCA9IDA7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudFRpbWVzdGFtcCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBhY3Rpb246IGN1cnJlbnRBY3Rpb24gfHwgXCJ1bmtub3duXCIsXG4gICAgICBoZWFkaW5nOiBjdXJyZW50SGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGN1cnJlbnRQcmV2aWV3LFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIHNpZ25hdHVyZTogY3VycmVudFNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBjdXJyZW50U2lnbmF0dXJlSW5kZXgsXG4gICAgICB0aW1lc3RhbXA6IGN1cnJlbnRUaW1lc3RhbXAsXG4gICAgICBzb3VyY2VQYXRoLFxuICAgICAgZmlsZU10aW1lLFxuICAgICAgZW50cnlJbmRleDogY3VycmVudEVudHJ5SW5kZXgsXG4gICAgfSk7XG4gICAgY3VycmVudFRpbWVzdGFtcCA9IFwiXCI7XG4gICAgY3VycmVudEFjdGlvbiA9IFwiXCI7XG4gICAgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICAgIGN1cnJlbnRQcmV2aWV3ID0gXCJcIjtcbiAgICBjdXJyZW50U2lnbmF0dXJlID0gXCJcIjtcbiAgICBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICAgIGN1cnJlbnRFbnRyeUluZGV4ICs9IDE7XG4gIH07XG5cbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgaGVhZGluZ01hdGNoID0gbGluZS5tYXRjaCgvXiMjXFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmdNYXRjaCkge1xuICAgICAgcHVzaEVudHJ5KCk7XG4gICAgICBjdXJyZW50VGltZXN0YW1wID0gaGVhZGluZ01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbk1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrQWN0aW9uOlxccysoLispJC9pKTtcbiAgICBpZiAoYWN0aW9uTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRBY3Rpb24gPSBhY3Rpb25NYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmJveE1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrSW5ib3g6XFxzKyguKykkL2kpO1xuICAgIGlmIChpbmJveE1hdGNoKSB7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGluYm94TWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlld01hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrUHJldmlldzpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHByZXZpZXdNYXRjaCkge1xuICAgICAgY3VycmVudFByZXZpZXcgPSBwcmV2aWV3TWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlTWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmU6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVNYXRjaCkge1xuICAgICAgY3VycmVudFNpZ25hdHVyZSA9IGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmVNYXRjaFsxXS50cmltKCkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXhNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1NpZ25hdHVyZSBpbmRleDpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHNpZ25hdHVyZUluZGV4TWF0Y2gpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludChzaWduYXR1cmVJbmRleE1hdGNoWzFdLCAxMCk7XG4gICAgICBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG4gICAgfVxuICB9XG5cbiAgcHVzaEVudHJ5KCk7XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHNpZ25hdHVyZSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gc2lnbmF0dXJlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBzbHVnaWZ5LCB0cmltVGl0bGUgfSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5LCBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBKb3VybmFsU2VydmljZSB9IGZyb20gXCIuL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi90YXNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5LCBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluYm94U2VydmljZTogSW5ib3hTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2U6IFRhc2tTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgam91cm5hbFNlcnZpY2U6IEpvdXJuYWxTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3TG9nU2VydmljZTogUmV2aWV3TG9nU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRJbmJveEVudHJpZXMobGltaXQgPSAyMCk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuaW5ib3hTZXJ2aWNlLmdldFJlY2VudEVudHJpZXMobGltaXQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvVGFzayhlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdGV4dCA9IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nO1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJ0YXNrXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInRhc2tcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcbiAgICAgIGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byB0YXNrIGluICR7c2F2ZWQucGF0aH1gLFxuICAgICAgbWFya2VyVXBkYXRlZCxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMga2VlcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwia2VlcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJrZWVwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJLZXB0IGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgc2tpcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwic2tpcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJza2lwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJTa2lwcGVkIGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVG9Kb3VybmFsKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkoXG4gICAgICBbXG4gICAgICAgIGBTb3VyY2U6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJqb3VybmFsXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShgQXBwZW5kZWQgaW5ib3ggZW50cnkgdG8gJHtzYXZlZC5wYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvTm90ZShlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gc2V0dGluZ3Mubm90ZXNGb2xkZXI7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlRm9sZGVyKG5vdGVzRm9sZGVyKTtcblxuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5idWlsZE5vdGVUaXRsZShlbnRyeSk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtmb3JtYXREYXRlVGltZUtleShub3cpLnJlcGxhY2UoL1s6IF0vZywgXCItXCIpfS0ke3NsdWdpZnkodGl0bGUpfS5tZGA7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKGAke25vdGVzRm9sZGVyfS8ke2ZpbGVuYW1lfWApO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke3RpdGxlfWAsXG4gICAgICBcIlwiLFxuICAgICAgYENyZWF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgXCJTb3VyY2U6IEJyYWluIGluYm94XCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJPcmlnaW5hbCBjYXB0dXJlOlwiLFxuICAgICAgZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmcsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcIm5vdGVcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwibm90ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byBub3RlIGluICR7cGF0aH1gLCBtYXJrZXJVcGRhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkZyb21SZXZpZXdMb2coZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBpZGVudGl0eSA9IHtcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgcHJldmlldzogZW50cnkucHJldmlldyxcbiAgICAgIHNpZ25hdHVyZTogZW50cnkuc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXg6IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgIH07XG4gICAgY29uc3QgcmVvcGVuZWQgPSBhd2FpdCB0aGlzLmluYm94U2VydmljZS5yZW9wZW5FbnRyeShpZGVudGl0eSk7XG4gICAgaWYgKCFyZW9wZW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChpZGVudGl0eSwgXCJyZW9wZW5cIik7XG4gICAgcmV0dXJuIGBSZS1vcGVuZWQgaW5ib3ggZW50cnkgJHtlbnRyeS5oZWFkaW5nfWA7XG4gIH1cblxuICBidWlsZE5vdGVUaXRsZShlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZW50cnkucHJldmlldyB8fCBlbnRyeS5ib2R5IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3QgbGluZXMgPSBjYW5kaWRhdGVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gY29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGNvbnN0IGZpcnN0ID0gbGluZXNbMF0gPz8gXCJVbnRpdGxlZCBub3RlXCI7XG4gICAgcmV0dXJuIHRyaW1UaXRsZShmaXJzdCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG1hcmtJbmJveFJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UubWFya0VudHJ5UmV2aWV3ZWQoZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwZW5kTWFya2VyTm90ZShtZXNzYWdlOiBzdHJpbmcsIG1hcmtlclVwZGF0ZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiBtYXJrZXJVcGRhdGVkID8gbWVzc2FnZSA6IGAke21lc3NhZ2V9IChyZXZpZXcgbWFya2VyIG5vdCB1cGRhdGVkKWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoXG4gICAgZW50cnk6IEluYm94RW50cnlJZGVudGl0eSxcbiAgICBhY3Rpb246IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5hcHBlbmRSZXZpZXdMb2coZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG5cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyIH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc0FJQ29uZmlndXJlZCB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhbnN3ZXJRdWVzdGlvbihxdWVzdGlvbjogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIWlzQUlDb25maWd1cmVkKHNldHRpbmdzKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgYW5zd2VycyBhcmUgZW5hYmxlZCBidXQgbm8gQVBJIGtleSBpcyBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb24sIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgcXVlc3Rpb24gYW5zd2VyaW5nXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiUXVlc3Rpb24gQW5zd2VyXCIsXG4gICAgICB0aXRsZTogXCJBbnN3ZXJcIixcbiAgICAgIG5vdGVUaXRsZTogc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogcXVlc3Rpb24sXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG9ydGVuUXVlc3Rpb24ocXVlc3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSBxdWVzdGlvbi50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBRdWVzdGlvbiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oXG4gIGl0ZW1zOiBTZXQ8c3RyaW5nPixcbiAgZW1wdHlNZXNzYWdlOiBzdHJpbmcsXG4gIG1heEl0ZW1zID0gMTAsXG4pOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCBtYXhJdGVtcylcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gZXh0cmFjdEtleXdvcmRzKHF1ZXN0aW9uOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHN0b3B3b3JkcyA9IG5ldyBTZXQoW1xuICAgIFwid2hhdFwiLFxuICAgIFwid2h5XCIsXG4gICAgXCJob3dcIixcbiAgICBcIndoaWNoXCIsXG4gICAgXCJ3aGVuXCIsXG4gICAgXCJ3aGVyZVwiLFxuICAgIFwid2hvXCIsXG4gICAgXCJ3aG9tXCIsXG4gICAgXCJkb2VzXCIsXG4gICAgXCJkb1wiLFxuICAgIFwiZGlkXCIsXG4gICAgXCJpc1wiLFxuICAgIFwiYXJlXCIsXG4gICAgXCJ3YXNcIixcbiAgICBcIndlcmVcIixcbiAgICBcInRoZVwiLFxuICAgIFwiYVwiLFxuICAgIFwiYW5cIixcbiAgICBcInRvXCIsXG4gICAgXCJvZlwiLFxuICAgIFwiZm9yXCIsXG4gICAgXCJhbmRcIixcbiAgICBcIm9yXCIsXG4gICAgXCJpblwiLFxuICAgIFwib25cIixcbiAgICBcImF0XCIsXG4gICAgXCJ3aXRoXCIsXG4gICAgXCJhYm91dFwiLFxuICAgIFwiZnJvbVwiLFxuICAgIFwibXlcIixcbiAgICBcIm91clwiLFxuICAgIFwieW91clwiLFxuICAgIFwidGhpc1wiLFxuICAgIFwidGhhdFwiLFxuICAgIFwidGhlc2VcIixcbiAgICBcInRob3NlXCIsXG4gICAgXCJtYWtlXCIsXG4gICAgXCJtYWRlXCIsXG4gICAgXCJuZWVkXCIsXG4gICAgXCJuZWVkc1wiLFxuICAgIFwiY2FuXCIsXG4gICAgXCJjb3VsZFwiLFxuICAgIFwic2hvdWxkXCIsXG4gICAgXCJ3b3VsZFwiLFxuICAgIFwid2lsbFwiLFxuICAgIFwiaGF2ZVwiLFxuICAgIFwiaGFzXCIsXG4gICAgXCJoYWRcIixcbiAgXSk7XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oXG4gICAgbmV3IFNldChcbiAgICAgIHF1ZXN0aW9uXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5zcGxpdCgvW15hLXowLTldKy9nKVxuICAgICAgICAubWFwKCh3b3JkKSA9PiB3b3JkLnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcigod29yZCkgPT4gd29yZC5sZW5ndGggPj0gNCAmJiAhc3RvcHdvcmRzLmhhcyh3b3JkKSksXG4gICAgKSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc1F1ZXN0aW9uKGxpbmU6IHN0cmluZywga2V5d29yZHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGlmICgha2V5d29yZHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgbG93ZXIgPSBsaW5lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBrZXl3b3Jkcy5zb21lKChrZXl3b3JkKSA9PiBsb3dlci5pbmNsdWRlcyhrZXl3b3JkKSk7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RFdmlkZW5jZShjb250ZW50OiBzdHJpbmcsIHF1ZXN0aW9uOiBzdHJpbmcpOiB7XG4gIGV2aWRlbmNlOiBTZXQ8c3RyaW5nPjtcbiAgbWF0Y2hlZDogYm9vbGVhbjtcbn0ge1xuICBjb25zdCBldmlkZW5jZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBrZXl3b3JkcyA9IGV4dHJhY3RLZXl3b3JkcyhxdWVzdGlvbik7XG4gIGxldCBtYXRjaGVkID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQgJiYgKG1hdGNoZXNRdWVzdGlvbihoZWFkaW5nVGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAzKSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGhlYWRpbmdUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCAmJiAobWF0Y2hlc1F1ZXN0aW9uKHRhc2tUZXh0LCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDMpKSB7XG4gICAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24odGFza1RleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQgJiYgKG1hdGNoZXNRdWVzdGlvbihidWxsZXRUZXh0LCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDQpKSB7XG4gICAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24oYnVsbGV0VGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG1hdGNoZXNRdWVzdGlvbihsaW5lLCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDIpIHtcbiAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24obGluZSwga2V5d29yZHMpKSB7XG4gICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgZXZpZGVuY2UuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZXZpZGVuY2UsXG4gICAgbWF0Y2hlZCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tRdWVzdGlvbkFuc3dlcihxdWVzdGlvbjogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkUXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHF1ZXN0aW9uKTtcbiAgY29uc3QgeyBldmlkZW5jZSwgbWF0Y2hlZCB9ID0gY29sbGVjdEV2aWRlbmNlKGNvbnRlbnQsIGNsZWFuZWRRdWVzdGlvbik7XG4gIGNvbnN0IGFuc3dlckxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGlmIChtYXRjaGVkKSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcbiAgICAgIFwiSSBmb3VuZCB0aGVzZSBsaW5lcyBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dCB0aGF0IGRpcmVjdGx5IG1hdGNoIHlvdXIgcXVlc3Rpb24uXCIsXG4gICAgKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVGhlIGNvbnRleHQgZG9lcyBub3QgcHJvdmlkZSBhIGZ1bGx5IHZlcmlmaWVkIGFuc3dlciwgc28gdHJlYXQgdGhpcyBhcyBhIGdyb3VuZGVkIHN1bW1hcnkuXCIpO1xuICB9IGVsc2UgaWYgKGV2aWRlbmNlLnNpemUpIHtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFxuICAgICAgXCJJIGNvdWxkIG5vdCBmaW5kIGEgZGlyZWN0IG1hdGNoIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0LCBzbyB0aGVzZSBhcmUgdGhlIGNsb3Nlc3QgbGluZXMgYXZhaWxhYmxlLlwiLFxuICAgICk7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRyZWF0IHRoaXMgYXMgbmVhcmJ5IGNvbnRleHQgcmF0aGVyIHRoYW4gYSBjb25maXJtZWQgYW5zd2VyLlwiKTtcbiAgfSBlbHNlIHtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiSSBjb3VsZCBub3QgZmluZCBhIGRpcmVjdCBhbnN3ZXIgaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQuXCIpO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUcnkgbmFycm93aW5nIHRoZSBxdWVzdGlvbiBvciBzZWxlY3RpbmcgYSBtb3JlIHNwZWNpZmljIG5vdGUgb3IgZm9sZGVyLlwiKTtcbiAgfVxuXG4gIGNvbnN0IGZvbGxvd1VwcyA9IG1hdGNoZWQgfHwgZXZpZGVuY2Uuc2l6ZVxuICAgID8gbmV3IFNldChbXG4gICAgICAgIFwiQXNrIGEgbmFycm93ZXIgcXVlc3Rpb24gaWYgeW91IHdhbnQgYSBtb3JlIHNwZWNpZmljIGFuc3dlci5cIixcbiAgICAgICAgXCJPcGVuIHRoZSBzb3VyY2Ugbm90ZSBvciBmb2xkZXIgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cIixcbiAgICAgIF0pXG4gICAgOiBuZXcgU2V0KFtcbiAgICAgICAgXCJQcm92aWRlIG1vcmUgZXhwbGljaXQgY29udGV4dCBvciBzZWxlY3QgYSBkaWZmZXJlbnQgbm90ZSBvciBmb2xkZXIuXCIsXG4gICAgICBdKTtcblxuICByZXR1cm4gW1xuICAgIFwiIyBBbnN3ZXJcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICBjbGVhbmVkUXVlc3Rpb24gfHwgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgYW5zd2VyTGluZXMuam9pbihcIiBcIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZXZpZGVuY2UsIFwiTm8gZGlyZWN0IGV2aWRlbmNlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBBbnN3ZXJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgICBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlUXVlc3Rpb25BbnN3ZXJTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgcGFyc2VkLnF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBBbnN3ZXJcIixcbiAgICAgIHBhcnNlZC5hbnN3ZXIgfHwgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBwYXJzZWQuZXZpZGVuY2UgfHwgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBBbnN3ZXJcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBBbnN3ZXJcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUXVlc3Rpb25BbnN3ZXJTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHF1ZXN0aW9uOiBzdHJpbmc7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBldmlkZW5jZTogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJRdWVzdGlvblwiIHwgXCJBbnN3ZXJcIiB8IFwiRXZpZGVuY2VcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgUXVlc3Rpb246IFtdLFxuICAgIEFuc3dlcjogW10sXG4gICAgRXZpZGVuY2U6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhRdWVzdGlvbnxBbnN3ZXJ8RXZpZGVuY2V8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHF1ZXN0aW9uOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLlF1ZXN0aW9uXSksXG4gICAgYW5zd2VyOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuQW5zd2VyKSxcbiAgICBldmlkZW5jZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkV2aWRlbmNlKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFF1ZXN0aW9uOiBzdHJpbmdbXTtcbiAgQW5zd2VyOiBzdHJpbmdbXTtcbiAgRXZpZGVuY2U6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiYW5zd2VyXCIpIHtcbiAgICByZXR1cm4gXCJBbnN3ZXJcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJldmlkZW5jZVwiKSB7XG4gICAgcmV0dXJuIFwiRXZpZGVuY2VcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiUXVlc3Rpb25cIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBBSVByb3ZpZGVyQ29uZmlnIHtcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBSVByb3ZpZGVyQ29uZmlnKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogQUlQcm92aWRlckNvbmZpZyB7XG4gIGlmIChzZXR0aW5ncy5haVByb3ZpZGVyID09PSBcImdlbWluaVwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFwaUtleTogc2V0dGluZ3MuZ2VtaW5pQXBpS2V5LFxuICAgICAgbW9kZWw6IHNldHRpbmdzLmdlbWluaU1vZGVsLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFwaUtleTogc2V0dGluZ3Mub3BlbkFJQXBpS2V5LFxuICAgIG1vZGVsOiBzZXR0aW5ncy5vcGVuQUlNb2RlbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQUlDb25maWd1cmVkKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGdldEFJUHJvdmlkZXJDb25maWcoc2V0dGluZ3MpO1xuICByZXR1cm4gY29uZmlnLmFwaUtleS50cmltKCkubGVuZ3RoID4gMCAmJiBjb25maWcubW9kZWwudHJpbSgpLmxlbmd0aCA+IDA7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQge1xuICBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5LFxufSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXksIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAsIGdldFdpbmRvd1N0YXJ0IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tTdW1tYXJ5IH0gZnJvbSBcIi4uL3V0aWxzL3N1bW1hcnktZm9ybWF0XCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IGlzQUlDb25maWd1cmVkIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1bW1hcnlSZXN1bHQge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHBlcnNpc3RlZFBhdGg/OiBzdHJpbmc7XG4gIHVzZWRBSTogYm9vbGVhbjtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN1bW1hcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cz86IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9IGxvb2tiYWNrRGF5cyA/PyBzZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0UmVjZW50RmlsZXMoc2V0dGluZ3MsIGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIGZpbGVzLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzLFxuICAgICk7XG5cbiAgICBsZXQgc3VtbWFyeSA9IGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQpO1xuICAgIGxldCB1c2VkQUkgPSBmYWxzZTtcblxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykge1xuICAgICAgaWYgKCFpc0FJQ29uZmlndXJlZChzZXR0aW5ncykpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkFJIHN1bW1hcmllcyBhcmUgZW5hYmxlZCBidXQgbm8gQVBJIGtleSBpcyBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdW1tYXJ5ID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uuc3VtbWFyaXplKGNvbnRlbnQgfHwgc3VtbWFyeSwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCBzdW1tYXJ5XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBlcnNpc3RlZFBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0aXRsZSA9IGxhYmVsID8gYCR7bGFiZWx9IFN1bW1hcnlgIDogXCJTdW1tYXJ5XCI7XG4gICAgaWYgKHNldHRpbmdzLnBlcnNpc3RTdW1tYXJpZXMpIHtcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAobmV3IERhdGUoKSk7XG4gICAgICBjb25zdCBmaWxlTGFiZWwgPSBsYWJlbCA/IGAke2xhYmVsLnRvTG93ZXJDYXNlKCl9LSR7dGltZXN0YW1wfWAgOiB0aW1lc3RhbXA7XG4gICAgICBjb25zdCByZXF1ZXN0ZWRQYXRoID0gYCR7c2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyfS8ke2ZpbGVMYWJlbH0ubWRgO1xuICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKHJlcXVlc3RlZFBhdGgpO1xuICAgICAgY29uc3QgZGlzcGxheVRpbWVzdGFtcCA9IGZvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpO1xuICAgICAgY29uc3QgYm9keSA9IFtcbiAgICAgICAgYCMgJHt0aXRsZX0gJHtkaXNwbGF5VGltZXN0YW1wfWAsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGAjIyBXaW5kb3dgLFxuICAgICAgICBlZmZlY3RpdmVMb29rYmFja0RheXMgPT09IDEgPyBcIlRvZGF5XCIgOiBgTGFzdCAke2VmZmVjdGl2ZUxvb2tiYWNrRGF5c30gZGF5c2AsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIHN1bW1hcnkudHJpbSgpLFxuICAgICAgXS5qb2luKFwiXFxuXCIpO1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBib2R5KTtcbiAgICAgIHBlcnNpc3RlZFBhdGggPSBwYXRoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBzdW1tYXJ5LFxuICAgICAgcGVyc2lzdGVkUGF0aCxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHRpdGxlLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RSZWNlbnRGaWxlcyhcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBsb29rYmFja0RheXM6IG51bWJlcixcbiAgKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGZpbGUuc3RhdC5tdGltZSA+PSBjdXRvZmYpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24gfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBjbGVhblN1bW1hcnlMaW5lKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiAodGV4dCA/PyBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFRhc2tTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBcIi0gTm8gcmVjZW50IHRhc2tzIGZvdW5kLlwiO1xuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtIFsgXSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGhpZ2hsaWdodHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGhlYWRpbmdbMV0pKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gY2xlYW5TdW1tYXJ5TGluZSh0YXNrWzJdKTtcbiAgICAgIHRhc2tzLmFkZCh0ZXh0KTtcbiAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gY2xlYW5TdW1tYXJ5TGluZShidWxsZXRbMl0pO1xuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgaGlnaGxpZ2h0cy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoaGlnaGxpZ2h0cy5zaXplIDwgNSAmJiBsaW5lLmxlbmd0aCA8PSAxNDApIHtcbiAgICAgIGhpZ2hsaWdodHMuYWRkKGNsZWFuU3VtbWFyeUxpbmUobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oaGlnaGxpZ2h0cywgXCJObyByZWNlbnQgbm90ZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIGZvcm1hdFRhc2tTZWN0aW9uKHRhc2tzKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJOb3RoaW5nIHBlbmRpbmcgZnJvbSByZWNlbnQgbm90ZXMuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tUYXNrRXh0cmFjdGlvbiB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3QtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tPcGVuUXVlc3Rpb25zIH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZiB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcbmltcG9ydCB7IGlzQUlDb25maWd1cmVkIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRoZXNpc1Jlc3VsdCB7XG4gIGFjdGlvbjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBub3RlVGl0bGU6IHN0cmluZztcbiAgY29udGVudDogc3RyaW5nO1xuICB1c2VkQUk6IGJvb2xlYW47XG4gIHByb21wdFRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIHJ1bih0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmFsbGJhY2sgPSB0aGlzLmJ1aWxkRmFsbGJhY2sodGVtcGxhdGUsIGNvbnRleHQudGV4dCk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGlmICghaXNBSUNvbmZpZ3VyZWQoc2V0dGluZ3MpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJBSSBzdW1tYXJpZXMgYXJlIGVuYWJsZWQgYnV0IG5vIEFQSSBrZXkgaXMgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN5bnRoZXNpemVDb250ZXh0KHRlbXBsYXRlLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN5bnRoZXNpc1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIHRpdGxlOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIG5vdGVUaXRsZTogYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gJHtnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKX1gLFxuICAgICAgY29udGVudDogdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRmFsbGJhY2sodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24odGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsZEZhbGxiYWNrU3ludGhlc2lzKHRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5mdW5jdGlvbiBhZGRTdW1tYXJ5TGluZShcbiAgc3VtbWFyeTogU2V0PHN0cmluZz4sXG4gIHRleHQ6IHN0cmluZyxcbiAgbWF4SXRlbXMgPSA0LFxuKTogdm9pZCB7XG4gIGlmIChzdW1tYXJ5LnNpemUgPj0gbWF4SXRlbXMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICBpZiAoIWNsZWFuZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBzdW1tYXJ5LmFkZChjbGVhbmVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3VtbWFyeSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0aGVtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgdGhlbWVzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBoZWFkaW5nVGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgZm9sbG93VXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB0aGVtZXMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIHRhc2tUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICB0aGVtZXMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgYnVsbGV0VGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGZvbGxvd1Vwcy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuXG4gICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgbGluZSk7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHN1bW1hcnksIFwiTm8gc291cmNlIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGhlbWVzLCBcIk5vIGtleSB0aGVtZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3ludGhlc2lzU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBwYXJzZWQuc3VtbWFyeSB8fCBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgcGFyc2VkLmtleVRoZW1lcyB8fCBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFN1bW1hcnlcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgXCJObyBrZXkgdGhlbWVzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN5bnRoZXNpc1NlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBrZXlUaGVtZXM6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiU3VtbWFyeVwiIHwgXCJLZXkgVGhlbWVzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFN1bW1hcnk6IFtdLFxuICAgIFwiS2V5IFRoZW1lc1wiOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoU3VtbWFyeXxLZXkgVGhlbWVzfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLlN1bW1hcnldKSxcbiAgICBrZXlUaGVtZXM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIktleSBUaGVtZXNcIl0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgU3VtbWFyeTogc3RyaW5nW107XG4gIFwiS2V5IFRoZW1lc1wiOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImtleSB0aGVtZXNcIikge1xuICAgIHJldHVybiBcIktleSBUaGVtZXNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiU3VtbWFyeVwiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGNvbnRleHQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICB0YXNrcy5hZGQodGFza1RleHQpO1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBjb250ZXh0LmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpO1xuICAgICAgaWYgKHF1ZXN0aW9uKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHRhc2tzLCBcIk5vIHRhc2tzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRhc2tFeHRyYWN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgcGFyc2VkLmNvbnRleHQgfHwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRhc2tFeHRyYWN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICB0YXNrczogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIlRhc2tzXCIgfCBcIkNvbnRleHRcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgVGFza3M6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhUYXNrc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0YXNrczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlRhc2tzKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkNvbnRleHRdKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFRhc2tzOiBzdHJpbmdbXTtcbiAgQ29udGV4dDogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJjb250ZXh0XCIpIHtcbiAgICByZXR1cm4gXCJDb250ZXh0XCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlRhc2tzXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZVJhdGlvbmFsZSh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJiZWNhdXNlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzbyB0aGF0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkdWUgdG9cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInJlYXNvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidHJhZGVvZmZcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImNvbnN0cmFpbnRcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRGVjaXNpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZGVjaWRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpc2lvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY2hvb3NlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaGlwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJhZG9wdFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZHJvcFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic3dpdGNoXCIpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGRlY2lzaW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCByYXRpb25hbGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlRGVjaXNpb24odGV4dCkpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKHRleHQpKSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlRGVjaXNpb24odGV4dCkpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKHRleHQpKSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGRlY2lzaW9ucy5zaXplIDwgMykge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlRGVjaXNpb24obGluZSkpIHtcbiAgICAgIGRlY2lzaW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUobGluZSkpIHtcbiAgICAgIHJhdGlvbmFsZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGRlY2lzaW9ucywgXCJObyBjbGVhciBkZWNpc2lvbnMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihyYXRpb25hbGUsIFwiTm8gZXhwbGljaXQgcmF0aW9uYWxlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRGVjaXNpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgcGFyc2VkLmRlY2lzaW9ucyB8fCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIHBhcnNlZC5yYXRpb25hbGUgfHwgXCJObyByYXRpb25hbGUgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgXCJObyByYXRpb25hbGUgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZURlY2lzaW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBkZWNpc2lvbnM6IHN0cmluZztcbiAgcmF0aW9uYWxlOiBzdHJpbmc7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJEZWNpc2lvbnNcIiB8IFwiUmF0aW9uYWxlXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBEZWNpc2lvbnM6IFtdLFxuICAgIFJhdGlvbmFsZTogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhEZWNpc2lvbnN8UmF0aW9uYWxlfE9wZW4gUXVlc3Rpb25zKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGVjaXNpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkRlY2lzaW9uc10pLFxuICAgIHJhdGlvbmFsZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlJhdGlvbmFsZSksXG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIERlY2lzaW9uczogc3RyaW5nW107XG4gIFJhdGlvbmFsZTogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwicmF0aW9uYWxlXCIpIHtcbiAgICByZXR1cm4gXCJSYXRpb25hbGVcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICByZXR1cm4gXCJEZWNpc2lvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gbG9va3NMaWtlUXVlc3Rpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmVuZHNXaXRoKFwiP1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicXVlc3Rpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVuY2xlYXJcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVua25vd25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5vdCBzdXJlXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZUZvbGxvd1VwKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImZvbGxvdyB1cFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmV4dCBzdGVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJpbnZlc3RpZ2F0ZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uZmlybVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidmFsaWRhdGVcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tPcGVuUXVlc3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUgfHwgbGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24odGV4dCkpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24odGV4dCkpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuc2l6ZSA8IDYpIHtcbiAgICAgICAgY29udGV4dC5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlRm9sbG93VXAodGV4dCkpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbihsaW5lKSkge1xuICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zaXplIDwgNCkge1xuICAgICAgY29udGV4dC5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIENvbnRleHRcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihjb250ZXh0LCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZU9wZW5RdWVzdGlvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgcGFyc2VkLmNvbnRleHQgfHwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU9wZW5RdWVzdGlvblNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk9wZW4gUXVlc3Rpb25zXCIgfCBcIkNvbnRleHRcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgICBDb250ZXh0OiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3BlbiBRdWVzdGlvbnN8Q29udGV4dHxGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdXSksXG4gICAgY29udGV4dDogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkNvbnRleHQpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbiAgQ29udGV4dDogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJjb250ZXh0XCIpIHtcbiAgICByZXR1cm4gXCJDb250ZXh0XCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBmb3JtYXRMaXN0U2VjdGlvbiwgc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2Zvcm1hdC1oZWxwZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG92ZXJ2aWV3ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGtleVBvaW50cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBxdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBrZXlQb2ludHMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICBrZXlQb2ludHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpO1xuICAgICAgaWYgKHF1ZXN0aW9uKSB7XG4gICAgICAgIHF1ZXN0aW9ucy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGtleVBvaW50cywgXCJObyBrZXkgcG9pbnRzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihxdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgZm91bmQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VDbGVhbk5vdGVTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgIHBhcnNlZC5rZXlQb2ludHMgfHwgXCJObyBrZXkgcG9pbnRzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBwYXJzZWQucXVlc3Rpb25zIHx8IFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgXCJObyBrZXkgcG9pbnRzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZUNsZWFuTm90ZVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAga2V5UG9pbnRzOiBzdHJpbmc7XG4gIHF1ZXN0aW9uczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk92ZXJ2aWV3XCIgfCBcIktleSBQb2ludHNcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiwgc3RyaW5nW10+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBcIktleSBQb2ludHNcIjogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPdmVydmlld3xLZXkgUG9pbnRzfE9wZW4gUXVlc3Rpb25zKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBrZXlQb2ludHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIktleSBQb2ludHNcIl0pLFxuICAgIHF1ZXN0aW9uczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIE92ZXJ2aWV3OiBzdHJpbmdbXTtcbiAgXCJLZXkgUG9pbnRzXCI6IHN0cmluZ1tdO1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImtleSBwb2ludHNcIikge1xuICAgIHJldHVybiBcIktleSBQb2ludHNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgZm9ybWF0TGlzdFNlY3Rpb24sIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9mb3JtYXQtaGVscGVyc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBnb2FscyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzY29wZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBuZXh0U3RlcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgc2NvcGUuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAgbmV4dFN0ZXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGdvYWxzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAgc2NvcGUuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlR29hbChidWxsZXRUZXh0KSkge1xuICAgICAgICAgIGdvYWxzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZUdvYWwobGluZSkpIHtcbiAgICAgIGdvYWxzLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgR29hbHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihnb2FscywgXCJObyBnb2FscyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFNjb3BlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oc2NvcGUsIFwiTm8gc2NvcGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24obmV4dFN0ZXBzLCBcIk5vIG5leHQgc3RlcHMgZm91bmQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZUdvYWwodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJnb2FsIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJnb2FscyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmVlZCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmVlZHMgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIndhbnQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIndhbnRzIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hvdWxkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibXVzdCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm9iamVjdGl2ZVwiKVxuICApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VQcm9qZWN0QnJpZWZTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICBwYXJzZWQuZ29hbHMgfHwgXCJObyBnb2FscyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgcGFyc2VkLnNjb3BlIHx8IFwiTm8gc2NvcGUgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgcGFyc2VkLm5leHRTdGVwcyB8fCBcIk5vIG5leHQgc3RlcHMgZXh0cmFjdGVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBHb2Fsc1wiLFxuICAgIFwiTm8gZ29hbHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTY29wZVwiLFxuICAgIFwiTm8gc2NvcGUgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgXCJObyBuZXh0IHN0ZXBzIGV4dHJhY3RlZC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVByb2plY3RCcmllZlNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAgZ29hbHM6IHN0cmluZztcbiAgc2NvcGU6IHN0cmluZztcbiAgbmV4dFN0ZXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiR29hbHNcIiB8IFwiU2NvcGVcIiB8IFwiTmV4dCBTdGVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIEdvYWxzOiBbXSxcbiAgICBTY29wZTogW10sXG4gICAgXCJOZXh0IFN0ZXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEdvYWxzfFNjb3BlfE5leHQgU3RlcHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGdvYWxzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuR29hbHMpLFxuICAgIHNjb3BlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuU2NvcGUpLFxuICAgIG5leHRTdGVwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiTmV4dCBTdGVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBHb2Fsczogc3RyaW5nW107XG4gIFNjb3BlOiBzdHJpbmdbXTtcbiAgXCJOZXh0IFN0ZXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImdvYWxzXCIpIHtcbiAgICByZXR1cm4gXCJHb2Fsc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcInNjb3BlXCIpIHtcbiAgICByZXR1cm4gXCJTY29wZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm5leHQgc3RlcHNcIikge1xuICAgIHJldHVybiBcIk5leHQgU3RlcHNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bnRoZXNpc1RlbXBsYXRlVGl0bGUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlKTogc3RyaW5nIHtcbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgIHJldHVybiBcIlRhc2sgRXh0cmFjdGlvblwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICByZXR1cm4gXCJEZWNpc2lvbiBFeHRyYWN0aW9uXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgIHJldHVybiBcIkNsZWFuIE5vdGVcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICByZXR1cm4gXCJQcm9qZWN0IEJyaWVmXCI7XG4gIH1cblxuICByZXR1cm4gXCJTdW1tYXJ5XCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSk6IHN0cmluZyB7XG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IFRhc2tzXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgRGVjaXNpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgcmV0dXJuIFwiUmV3cml0ZSBhcyBDbGVhbiBOb3RlXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgcmV0dXJuIFwiRHJhZnQgUHJvamVjdCBCcmllZlwiO1xuICB9XG5cbiAgcmV0dXJuIFwiU3VtbWFyaXplXCI7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UgfSBmcm9tIFwiLi4vdXRpbHMvdG9waWMtcGFnZS1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQgfSBmcm9tIFwiLi9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNBSUNvbmZpZ3VyZWQgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5cbmV4cG9ydCBjbGFzcyBUb3BpY1BhZ2VTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZSh0b3BpYzogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWRUb3BpYyA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyk7XG4gICAgaWYgKCFjbGVhbmVkVG9waWMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvcGljIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgICBjb250ZXh0LnRleHQsXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIWlzQUlDb25maWd1cmVkKHNldHRpbmdzKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgdG9waWMgcGFnZXMgYXJlIGVuYWJsZWQgYnV0IG5vIEFQSSBrZXkgaXMgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZShjbGVhbmVkVG9waWMsIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgdG9waWMgcGFnZSBnZW5lcmF0aW9uXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gZW5zdXJlVG9waWNCdWxsZXQoXG4gICAgICBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudCksXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiVG9waWMgUGFnZVwiLFxuICAgICAgdGl0bGU6IFwiVG9waWMgUGFnZVwiLFxuICAgICAgbm90ZVRpdGxlOiBzaG9ydGVuVG9waWMoY2xlYW5lZFRvcGljKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50LFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogY2xlYW5lZFRvcGljLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlVG9waWNCdWxsZXQoY29udGVudDogc3RyaW5nLCB0b3BpYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBvdmVydmlld0luZGV4ID0gbGluZXMuZmluZEluZGV4KChsaW5lKSA9PiAvXiMjXFxzK092ZXJ2aWV3XFxzKiQvLnRlc3QobGluZSkpO1xuICBpZiAob3ZlcnZpZXdJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IG5leHRIZWFkaW5nSW5kZXggPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgKGxpbmUsIGluZGV4KSA9PiBpbmRleCA+IG92ZXJ2aWV3SW5kZXggJiYgL14jI1xccysvLnRlc3QobGluZSksXG4gICk7XG4gIGNvbnN0IHRvcGljTGluZSA9IGAtIFRvcGljOiAke25vcm1hbGl6ZWRUb3BpY31gO1xuICBjb25zdCBvdmVydmlld1NsaWNlID0gbGluZXMuc2xpY2UoXG4gICAgb3ZlcnZpZXdJbmRleCArIDEsXG4gICAgbmV4dEhlYWRpbmdJbmRleCA9PT0gLTEgPyBsaW5lcy5sZW5ndGggOiBuZXh0SGVhZGluZ0luZGV4LFxuICApO1xuICBpZiAob3ZlcnZpZXdTbGljZS5zb21lKChsaW5lKSA9PiBsaW5lLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCItIHRvcGljOlwiKSkpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGluc2VydGlvbkluZGV4ID0gb3ZlcnZpZXdJbmRleCArIDE7XG4gIGNvbnN0IHVwZGF0ZWQgPSBbLi4ubGluZXNdO1xuICB1cGRhdGVkLnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgdG9waWNMaW5lKTtcbiAgcmV0dXJuIHVwZGF0ZWQuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2hvcnRlblRvcGljKHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gdG9waWMudHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgVG9waWMgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGZvcm1hdExpc3RTZWN0aW9uLCBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZm9ybWF0LWhlbHBlcnNcIjtcblxuZnVuY3Rpb24gbG9va3NMaWtlT3BlblF1ZXN0aW9uKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5lbmRzV2l0aChcIj9cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInF1ZXN0aW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ1bmNsZWFyXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJvcGVuIGlzc3VlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ1bmtub3duXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZU5leHRTdGVwKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmV4dCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZm9sbG93IHVwXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImZvbGxvdy11cFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ0b2RvIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ0by1kbyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNob3VsZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5lZWQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZWVkcyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm11c3QgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJhY3Rpb25cIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0U291cmNlcyhcbiAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgc291cmNlUGF0aHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgc291cmNlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGlmIChzb3VyY2VQYXRocyAmJiBzb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKSkge1xuICAgICAgc291cmNlcy5hZGQocGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZVBhdGhzLmxlbmd0aCA+IDEyKSB7XG4gICAgICBzb3VyY2VzLmFkZChgLi4uYW5kICR7c291cmNlUGF0aHMubGVuZ3RoIC0gMTJ9IG1vcmVgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoc291cmNlUGF0aCkge1xuICAgIHNvdXJjZXMuYWRkKHNvdXJjZVBhdGgpO1xuICB9IGVsc2Uge1xuICAgIHNvdXJjZXMuYWRkKHNvdXJjZUxhYmVsKTtcbiAgfVxuXG4gIHJldHVybiBmb3JtYXRMaXN0U2VjdGlvbihzb3VyY2VzLCBcIk5vIGV4cGxpY2l0IHNvdXJjZXMgZm91bmQuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1RvcGljUGFnZShcbiAgdG9waWM6IHN0cmluZyxcbiAgY29udGVudDogc3RyaW5nLFxuICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBzb3VyY2VQYXRoczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBldmlkZW5jZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG5leHRTdGVwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGhlYWRpbmdUZXh0KSkge1xuICAgICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9va3NMaWtlTmV4dFN0ZXAoaGVhZGluZ1RleHQpKSB7XG4gICAgICAgICAgbmV4dFN0ZXBzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAgZXZpZGVuY2UuYWRkKHRhc2tUZXh0KTtcbiAgICAgICAgbmV4dFN0ZXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAgZXZpZGVuY2UuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGJ1bGxldFRleHQpKSB7XG4gICAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvb2tzTGlrZU5leHRTdGVwKGJ1bGxldFRleHQpKSB7XG4gICAgICAgICAgbmV4dFN0ZXBzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihsaW5lKSkge1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpO1xuICAgICAgaWYgKHF1ZXN0aW9uKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHF1ZXN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH0gZWxzZSBpZiAoZXZpZGVuY2Uuc2l6ZSA8IDQpIHtcbiAgICAgIGV2aWRlbmNlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIW5leHRTdGVwcy5zaXplKSB7XG4gICAgbmV4dFN0ZXBzLmFkZChcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgYC0gVG9waWM6ICR7c2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyl9YCxcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZXZpZGVuY2UsIFwiTm8gZXZpZGVuY2UgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgZm9ybWF0U291cmNlcyhzb3VyY2VMYWJlbCwgc291cmNlUGF0aCwgc291cmNlUGF0aHMpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24obmV4dFN0ZXBzLCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNvdXJjZXNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUb3BpY1BhZ2VTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgcGFyc2VkLmV2aWRlbmNlIHx8IFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgcGFyc2VkLnNvdXJjZXMgfHwgXCJObyBzb3VyY2VzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIHBhcnNlZC5uZXh0U3RlcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFNvdXJjZXNcIixcbiAgICBcIk5vIHNvdXJjZXMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVG9waWNQYWdlU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBldmlkZW5jZTogc3RyaW5nO1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG4gIHNvdXJjZXM6IHN0cmluZztcbiAgbmV4dFN0ZXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFxuICAgIFwiT3ZlcnZpZXdcIiB8IFwiRXZpZGVuY2VcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiB8IFwiU291cmNlc1wiIHwgXCJOZXh0IFN0ZXBzXCIsXG4gICAgc3RyaW5nW11cbiAgPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgRXZpZGVuY2U6IFtdLFxuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gICAgU291cmNlczogW10sXG4gICAgXCJOZXh0IFN0ZXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKFxuICAgICAgL14jI1xccysoT3ZlcnZpZXd8RXZpZGVuY2V8T3BlbiBRdWVzdGlvbnN8U291cmNlc3xOZXh0IFN0ZXBzKVxccyokL2ksXG4gICAgKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAgZXZpZGVuY2U6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5FdmlkZW5jZSksXG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl0pLFxuICAgIHNvdXJjZXM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5Tb3VyY2VzKSxcbiAgICBuZXh0U3RlcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk5leHQgU3RlcHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIE92ZXJ2aWV3OiBzdHJpbmdbXTtcbiAgRXZpZGVuY2U6IHN0cmluZ1tdO1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xuICBTb3VyY2VzOiBzdHJpbmdbXTtcbiAgXCJOZXh0IFN0ZXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImV2aWRlbmNlXCIpIHtcbiAgICByZXR1cm4gXCJFdmlkZW5jZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcInNvdXJjZXNcIikge1xuICAgIHJldHVybiBcIlNvdXJjZXNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJuZXh0IHN0ZXBzXCIpIHtcbiAgICByZXR1cm4gXCJOZXh0IFN0ZXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tWYXVsdFNlcnZpY2Uge1xuICBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dW5rbm93bj47XG4gIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgVGFza1NlcnZpY2Uge1xuICBwcml2YXRlIG9wZW5UYXNrQ291bnRDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBUYXNrVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGFzayB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAtIFsgXSAke2NsZWFuZWR9IF8oYWRkZWQgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX0pX2A7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy50YXNrc0ZpbGUsIGJsb2NrKTtcbiAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHsgcGF0aDogc2V0dGluZ3MudGFza3NGaWxlIH07XG4gIH1cblxuICBhc3luYyBnZXRPcGVuVGFza0NvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB7IHRleHQsIG10aW1lLCBleGlzdHMgfSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0V2l0aE10aW1lKHNldHRpbmdzLnRhc2tzRmlsZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0ge1xuICAgICAgICBtdGltZTogMCxcbiAgICAgICAgY291bnQ6IDAsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3BlblRhc2tDb3VudENhY2hlICYmIHRoaXMub3BlblRhc2tDb3VudENhY2hlLm10aW1lID09PSBtdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMub3BlblRhc2tDb3VudENhY2hlLmNvdW50O1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gdGV4dFxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoKGxpbmUpID0+IC9eLSBcXFsoIHx4fFgpXFxdLy50ZXN0KGxpbmUpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gIS9eLSBcXFsoeHxYKVxcXS8udGVzdChsaW5lKSlcbiAgICAgIC5sZW5ndGg7XG4gICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSB7XG4gICAgICBtdGltZSxcbiAgICAgIGNvdW50LFxuICAgIH07XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG59XG4iLCAiaW1wb3J0IHsgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dCB9IGZyb20gXCIuLi91dGlscy9xdWVzdGlvbi1hbnN3ZXItbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdG9waWMtcGFnZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRleHQtZm9ybWF0XCI7XG5pbXBvcnQgeyBTeW50aGVzaXNUZW1wbGF0ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG50eXBlIFJvdXRlTGFiZWwgPSBcIm5vdGVcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBudWxsO1xuXG5pbnRlcmZhY2UgR2VtaW5pQ29udGVudFBhcnQge1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBHZW1pbmlSZXF1ZXN0Qm9keSB7XG4gIGNvbnRlbnRzOiBBcnJheTx7IHJvbGU6IHN0cmluZzsgcGFydHM6IEdlbWluaUNvbnRlbnRQYXJ0W10gfT47XG4gIGdlbmVyYXRpb25Db25maWc6IHtcbiAgICB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICAgIG1heE91dHB1dFRva2VuczogbnVtYmVyO1xuICB9O1xuICBzeXN0ZW1faW5zdHJ1Y3Rpb24/OiB7XG4gICAgcGFydHM6IEdlbWluaUNvbnRlbnRQYXJ0W107XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvbkNob2ljZSB7XG4gIG1lc3NhZ2U/OiB7XG4gICAgY29udGVudD86IHN0cmluZztcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENoYXRDb21wbGV0aW9uUmVzcG9uc2Uge1xuICBjaG9pY2VzPzogQ2hhdENvbXBsZXRpb25DaG9pY2VbXTtcbn1cblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIGFzeW5jIHN1bW1hcml6ZSh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3Ugc3VtbWFyaXplIG1hcmtkb3duIHZhdWx0IGNvbnRlbnQuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyB2YXVsdCBjb250ZW50IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgdGFza3MuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN1bW1hcnkocmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZUNvbnRleHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZFByb21wdCh0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgcHJvbXB0KTtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHJvdXRlVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxSb3V0ZUxhYmVsPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiQ2xhc3NpZnkgY2FwdHVyZSB0ZXh0IGludG8gZXhhY3RseSBvbmUgb2Y6IG5vdGUsIHRhc2ssIGpvdXJuYWwuIFJldHVybiBvbmUgd29yZCBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkNsYXNzaWZ5IHRoZSBmb2xsb3dpbmcgdXNlciBpbnB1dCBhcyBleGFjdGx5IG9uZSBvZjpcIixcbiAgICAgICAgICBcIm5vdGVcIixcbiAgICAgICAgICBcInRhc2tcIixcbiAgICAgICAgICBcImpvdXJuYWxcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIG9ubHkgb25lIHdvcmQuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgY29uc3QgY2xlYW5lZCA9IHJlc3BvbnNlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjbGVhbmVkID09PSBcIm5vdGVcIiB8fCBjbGVhbmVkID09PSBcInRhc2tcIiB8fCBjbGVhbmVkID09PSBcImpvdXJuYWxcIikge1xuICAgICAgcmV0dXJuIGNsZWFuZWQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgYW5zd2VyUXVlc3Rpb24oXG4gICAgcXVlc3Rpb246IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSBhbnN3ZXIgcXVlc3Rpb25zIHVzaW5nIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgb25seS4gUmVzcG9uZCB3aXRoIGNvbmNpc2UgbWFya2Rvd24gdXNpbmcgdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXN0aW9uIHVzaW5nIG9ubHkgdGhlIGNvbnRleHQgYmVsb3cuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBgUXVlc3Rpb246ICR7cXVlc3Rpb259YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJJZiB0aGUgY29udGV4dCBpcyBpbnN1ZmZpY2llbnQsIHNheSBzbyBleHBsaWNpdGx5LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZShcbiAgICB0b3BpYzogc3RyaW5nLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHR1cm4gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGEgZHVyYWJsZSB3aWtpIHBhZ2UuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkgYW5kIGRvIG5vdCBpbnZlbnQgZmFjdHMuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIGBDcmVhdGUgYSB0b3BpYyBwYWdlIGZvcjogJHt0b3BpY31gLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJSZXR1cm4gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICBgLSBUb3BpYzogJHt0b3BpY31gLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHRoZSBwYWdlIHJldXNhYmxlLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDaGF0Q29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoc2V0dGluZ3MuYWlQcm92aWRlciA9PT0gXCJnZW1pbmlcIikge1xuICAgICAgcmV0dXJuIHRoaXMucG9zdEdlbWluaUNvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucG9zdE9wZW5BSUNvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdE9wZW5BSUNvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgaXNEZWZhdWx0VXJsID0gIXNldHRpbmdzLm9wZW5BSUJhc2VVcmwgfHwgc2V0dGluZ3Mub3BlbkFJQmFzZVVybC5pbmNsdWRlcyhcImFwaS5vcGVuYWkuY29tXCIpO1xuICAgIGlmIChpc0RlZmF1bHRVcmwgJiYgIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5BSSBBUEkga2V5IGlzIG1pc3NpbmdcIik7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH07XG5cbiAgICBpZiAoc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSkge1xuICAgICAgaGVhZGVyc1tcIkF1dGhvcml6YXRpb25cIl0gPSBgQmVhcmVyICR7c2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKX1gO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBzZXR0aW5ncy5vcGVuQUlCYXNlVXJsLnRyaW0oKSB8fCBcImh0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEvY2hhdC9jb21wbGV0aW9uc1wiLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1vZGVsOiBzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCksXG4gICAgICAgIG1lc3NhZ2VzLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4yLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzdWx0Lmpzb24gYXMgQ2hhdENvbXBsZXRpb25SZXNwb25zZTtcbiAgICBjb25zdCBjb250ZW50ID0ganNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgPz8gXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdEdlbWluaUNvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCFzZXR0aW5ncy5nZW1pbmlBcGlLZXkudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW1pbmkgQVBJIGtleSBpcyBtaXNzaW5nXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHN5c3RlbU1lc3NhZ2UgPSBtZXNzYWdlcy5maW5kKChtKSA9PiBtLnJvbGUgPT09IFwic3lzdGVtXCIpO1xuICAgIGNvbnN0IHVzZXJNZXNzYWdlcyA9IG1lc3NhZ2VzLmZpbHRlcigobSkgPT4gbS5yb2xlICE9PSBcInN5c3RlbVwiKTtcblxuICAgIC8vIENvbnZlcnQgT3BlbkFJIG1lc3NhZ2VzIHRvIEdlbWluaSBmb3JtYXRcbiAgICBjb25zdCBjb250ZW50cyA9IHVzZXJNZXNzYWdlcy5tYXAoKG0pID0+ICh7XG4gICAgICByb2xlOiBtLnJvbGUgPT09IFwidXNlclwiID8gXCJ1c2VyXCIgOiBcIm1vZGVsXCIsXG4gICAgICBwYXJ0czogW3sgdGV4dDogbS5jb250ZW50IH1dLFxuICAgIH0pKTtcblxuICAgIGNvbnN0IGJvZHk6IEdlbWluaVJlcXVlc3RCb2R5ID0ge1xuICAgICAgY29udGVudHMsXG4gICAgICBnZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjIsXG4gICAgICAgIG1heE91dHB1dFRva2VuczogMjA0OCxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGlmIChzeXN0ZW1NZXNzYWdlKSB7XG4gICAgICBib2R5LnN5c3RlbV9pbnN0cnVjdGlvbiA9IHtcbiAgICAgICAgcGFydHM6IFt7IHRleHQ6IHN5c3RlbU1lc3NhZ2UuY29udGVudCB9XSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzLyR7c2V0dGluZ3MuZ2VtaW5pTW9kZWx9OmdlbmVyYXRlQ29udGVudD9rZXk9JHtzZXR0aW5ncy5nZW1pbmlBcGlLZXl9YCxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgIH0pO1xuXG4gICAgY29uc3QganNvbiA9IHJlc3VsdC5qc29uO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBqc29uLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dCA/PyBcIlwiO1xuICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbWluaSByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFByb21wdChcbiAgICB0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PiB7XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgYWN0aW9uYWJsZSB0YXNrcyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3QgdGFza3MgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgICAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSBpdGVtcy5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IHJld3JpdGUgZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGEgY2xlYW4gbWFya2Rvd24gbm90ZS4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiUmV3cml0ZSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSB0aGUgc3RydWN0dXJlIG9mIGEgcmV1c2FibGUgbm90ZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCBkZWNpc2lvbnMgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IGRlY2lzaW9ucyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICAgICAgICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgdW5jZXJ0YWludHkgd2hlcmUgY29udGV4dCBpcyBpbmNvbXBsZXRlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgdW5yZXNvbHZlZCBxdWVzdGlvbnMgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IG9wZW4gcXVlc3Rpb25zIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIGtlZXAgdW5jZXJ0YWludHkgZXhwbGljaXQuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZHJhZnQgYSBwcm9qZWN0IGJyaWVmIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRHJhZnQgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgcHJvamVjdCBzdHJ1Y3R1cmUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHR1cm4gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGNvbmNpc2UgbWFya2Rvd24gc3ludGhlc2lzLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIlN1bW1hcml6ZSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIGl0ZW1zLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF07XG4gIH1cblxuICBwcml2YXRlIG5vcm1hbGl6ZSh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsIHJlc3BvbnNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dChyZXNwb25zZSk7XG4gIH1cbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3VtbWFyeShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VTdW1tYXJ5U2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICBwYXJzZWQuaGlnaGxpZ2h0cyB8fCBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBwYXJzZWQudGFza3MgfHwgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHJlY2VudCBub3Rlcy5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyByZWNlbnQgbm90ZXMuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VTdW1tYXJ5U2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBoaWdobGlnaHRzOiBzdHJpbmc7XG4gIHRhc2tzOiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIkhpZ2hsaWdodHNcIiB8IFwiVGFza3NcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgSGlnaGxpZ2h0czogW10sXG4gICAgVGFza3M6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhIaWdobGlnaHRzfFRhc2tzfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBoaWdobGlnaHRzOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkhpZ2hsaWdodHNdKSxcbiAgICB0YXNrczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlRhc2tzKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIEhpZ2hsaWdodHM6IHN0cmluZ1tdO1xuICBUYXNrczogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJ0YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiVGFza3NcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiSGlnaGxpZ2h0c1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9jb250ZXh0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRMb2NhdGlvbihjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nIHtcbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY291bnQgPSBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aDtcbiAgICByZXR1cm4gYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gXHUyMDIyICR7Y291bnR9ICR7Y291bnQgPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIHJldHVybiBgJHtjb250ZXh0LnNvdXJjZUxhYmVsfSBcdTIwMjIgJHtjb250ZXh0LnNvdXJjZVBhdGh9YDtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LnNvdXJjZUxhYmVsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbGluZXMgPSBbYENvbnRleHQgc291cmNlOiAke2NvbnRleHQuc291cmNlTGFiZWx9YF07XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIGxpbmVzLnB1c2goYENvbnRleHQgcGF0aDogJHtjb250ZXh0LnNvdXJjZVBhdGh9YCk7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBsaW5lcy5wdXNoKFwiQ29udGV4dCBmaWxlczpcIik7XG4gICAgY29uc3QgdmlzaWJsZSA9IGNvbnRleHQuc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiB2aXNpYmxlKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICR7cGF0aH1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiB2aXNpYmxlLmxlbmd0aCkge1xuICAgICAgbGluZXMucHVzaChgLSAuLi5hbmQgJHtjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCAtIHZpc2libGUubGVuZ3RofSBtb3JlYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnRleHQudHJ1bmNhdGVkKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGBDb250ZXh0IHdhcyB0cnVuY2F0ZWQgdG8gJHtjb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbGluZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0U291cmNlTGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbGluZXMgPSBbYFNvdXJjZTogJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBdO1xuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICBsaW5lcy5wdXNoKGBTb3VyY2UgcGF0aDogJHtjb250ZXh0LnNvdXJjZVBhdGh9YCk7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBsaW5lcy5wdXNoKFwiU291cmNlIGZpbGVzOlwiKTtcbiAgICBjb25zdCB2aXNpYmxlID0gY29udGV4dC5zb3VyY2VQYXRocy5zbGljZSgwLCAxMik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHZpc2libGUpIHtcbiAgICAgIGxpbmVzLnB1c2gocGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgIGxpbmVzLnB1c2goYC4uLmFuZCAke2NvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoIC0gdmlzaWJsZS5sZW5ndGh9IG1vcmVgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29udGV4dC50cnVuY2F0ZWQpIHtcbiAgICBsaW5lcy5wdXNoKFxuICAgICAgYENvbnRleHQgdHJ1bmNhdGVkIHRvICR7Y29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSwgT2JzaWRpYW5Qcm90b2NvbERhdGEgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5BdXRoU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBCcmFpblBsdWdpbikge31cblxuICByZWdpc3RlclByb3RvY29sKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyT2JzaWRpYW5Qcm90b2NvbEhhbmRsZXIoXCJicmFpbi1hdXRoXCIsIGFzeW5jIChkYXRhOiBPYnNpZGlhblByb3RvY29sRGF0YSkgPT4ge1xuICAgICAgY29uc3QgeyBwcm92aWRlciwgdG9rZW4gfSA9IGRhdGE7XG5cbiAgICAgIGlmICghcHJvdmlkZXIgfHwgIXRva2VuKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbjogSW52YWxpZCBhdXRoZW50aWNhdGlvbiBkYXRhIHJlY2VpdmVkXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm92aWRlciAhPT0gXCJvcGVuYWlcIiAmJiBwcm92aWRlciAhPT0gXCJnZW1pbmlcIikge1xuICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW46IFVua25vd24gYXV0aGVudGljYXRpb24gcHJvdmlkZXJcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLmxlbmd0aCA8IDEwIHx8IHRva2VuLmxlbmd0aCA+IDUxMikge1xuICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW46IEludmFsaWQgdG9rZW4gZm9ybWF0XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPSB0b2tlbjtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluOiBPcGVuQUkgYXV0aGVudGljYXRlZCBzdWNjZXNzZnVsbHlcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nZW1pbmlBcGlLZXkgPSB0b2tlbjtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluOiBHZW1pbmkgYXV0aGVudGljYXRlZCBzdWNjZXNzZnVsbHlcIik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiYnJhaW46c2V0dGluZ3MtdXBkYXRlZFwiKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGxvZ2luKHByb3ZpZGVyOiBcIm9wZW5haVwiIHwgXCJnZW1pbmlcIikge1xuICAgIGxldCB1cmwgPSBcIlwiO1xuICAgIGlmIChwcm92aWRlciA9PT0gXCJvcGVuYWlcIikge1xuICAgICAgdXJsID0gXCJodHRwczovL3BsYXRmb3JtLm9wZW5haS5jb20vYXBpLWtleXNcIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJQbGVhc2UgY3JlYXRlIGFuIEFQSSBrZXkgYW5kIHRoZSBwbHVnaW4gd2lsbCBndWlkZSB5b3UuXCIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09IFwiZ2VtaW5pXCIpIHtcbiAgICAgIHVybCA9IFwiaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL2FwcC9hcGlrZXlcIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJPcGVuaW5nIEdlbWluaSBBUEkgS2V5IHBhZ2UuLi5cIik7XG4gICAgfVxuXG4gICAgd2luZG93Lm9wZW4odXJsKTtcbiAgfVxufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgVEFic3RyYWN0RmlsZSxcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLmpvdXJuYWxGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLm5vdGVzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLnJldmlld3NGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihzZXR0aW5ncy5pbmJveEZpbGUpKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIoc2V0dGluZ3MudGFza3NGaWxlKSk7XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoY3VycmVudCk7XG4gICAgICB9IGVsc2UgaWYgKCEoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmb2xkZXI6ICR7Y3VycmVudH1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGluaXRpYWxDb250ZW50ID0gXCJcIik6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIHJldHVybiBleGlzdGluZztcbiAgICB9XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmaWxlOiAke25vcm1hbGl6ZWR9YCk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKG5vcm1hbGl6ZWQpKTtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vcm1hbGl6ZWQsIGluaXRpYWxDb250ZW50KTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICBtdGltZTogMCxcbiAgICAgICAgZXhpc3RzOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQ6IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSksXG4gICAgICBtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuICAgICAgZXhpc3RzOiB0cnVlLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IGN1cnJlbnQubGVuZ3RoID09PSAwXG4gICAgICA/IFwiXCJcbiAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblxcblwiKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgICAgICAgPyBcIlxcblwiXG4gICAgICAgICAgOiBcIlxcblxcblwiO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgJHtjdXJyZW50fSR7c2VwYXJhdG9yfSR7bm9ybWFsaXplZENvbnRlbnR9YCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbm9ybWFsaXplZENvbnRlbnQpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlVW5pcXVlRmlsZVBhdGgoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBkb3RJbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3RJbmRleCA9PT0gLTEgPyBub3JtYWxpemVkIDogbm9ybWFsaXplZC5zbGljZSgwLCBkb3RJbmRleCk7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZG90SW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoZG90SW5kZXgpO1xuXG4gICAgbGV0IGNvdW50ZXIgPSAyO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2NvdW50ZXJ9JHtleHRlbnNpb259YDtcbiAgICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICAgIGNvdW50ZXIgKz0gMTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBhcHBlbmRKb3VybmFsSGVhZGVyKGZpbGVQYXRoOiBzdHJpbmcsIGRhdGVLZXk6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoLCBgIyAke2RhdGVLZXl9XFxuXFxuYCk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAjICR7ZGF0ZUtleX1cXG5cXG5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBsaXN0TWFya2Rvd25GaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcmVudEZvbGRlcihmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICBjb25zdCBpbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpO1xuICByZXR1cm4gaW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgdHJpbVRyYWlsaW5nTmV3bGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5pbnRlcmZhY2UgUHJvbXB0TW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgcGxhY2Vob2xkZXI/OiBzdHJpbmc7XG4gIHN1Ym1pdExhYmVsPzogc3RyaW5nO1xuICBtdWx0aWxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUHJvbXB0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFByb21wdE1vZGFsT3B0aW9ucykge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUHJvbXB0KCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUpIHtcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgPz8gXCJcIixcbiAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5KSkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5wdXRFbCA9IHRleHRhcmVhO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSBpbnB1dDtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwuZm9jdXMoKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQodGhpcy5vcHRpb25zLnN1Ym1pdExhYmVsID8/IFwiU3VibWl0XCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3VibWl0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gdHJpbVRyYWlsaW5nTmV3bGluZXModGhpcy5pbnB1dEVsLnZhbHVlKS50cmltKCk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZmluaXNoKHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aXRsZVRleHQ6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGJvZHlUZXh0OiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLnRpdGxlVGV4dCB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogdGhpcy5ib2R5VGV4dCxcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW50ZXJmYWNlIEZpbGVHcm91cFBpY2tlck1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBGaWxlUm93IHtcbiAgZmlsZTogVEZpbGU7XG4gIGNoZWNrYm94OiBIVE1MSW5wdXRFbGVtZW50O1xuICByb3c6IEhUTUxFbGVtZW50O1xufVxuXG5leHBvcnQgY2xhc3MgRmlsZUdyb3VwUGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogVEZpbGVbXSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIHNlYXJjaElucHV0ITogSFRNTElucHV0RWxlbWVudDtcbiAgcHJpdmF0ZSByb3dzOiBGaWxlUm93W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGZpbGVzOiBURmlsZVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogRmlsZUdyb3VwUGlja2VyTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFRGaWxlW10gfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBvbmUgb3IgbW9yZSBub3RlcyB0byB1c2UgYXMgY29udGV4dC5cIixcbiAgICB9KTtcblxuICAgIHRoaXMuc2VhcmNoSW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiRmlsdGVyIG5vdGVzLi4uXCIsXG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmZpbHRlclJvd3ModGhpcy5zZWFyY2hJbnB1dC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1maWxlLWdyb3VwLWxpc3RcIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiB0aGlzLmZpbGVzKSB7XG4gICAgICBjb25zdCByb3cgPSBsaXN0LmNyZWF0ZUVsKFwibGFiZWxcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tZmlsZS1ncm91cC1yb3dcIixcbiAgICAgIH0pO1xuICAgICAgY29uc3QgY2hlY2tib3ggPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgdGV4dDogZmlsZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICB0aGlzLnJvd3MucHVzaCh7IGZpbGUsIGNoZWNrYm94LCByb3cgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlVzZSBTZWxlY3RlZFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMucm93c1xuICAgICAgICAuZmlsdGVyKChyb3cpID0+IHJvdy5jaGVja2JveC5jaGVja2VkKVxuICAgICAgICAubWFwKChyb3cpID0+IHJvdy5maWxlKTtcbiAgICAgIGlmICghc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG5vdGVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmluaXNoKHNlbGVjdGVkKTtcbiAgICB9KTtcblxuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyUm93cyh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcXVlcnkgPSB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gIXF1ZXJ5IHx8IHJvdy5maWxlLnBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSk7XG4gICAgICByb3cucm93LnN0eWxlLmRpc3BsYXkgPSBtYXRjaCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChmaWxlczogVEZpbGVbXSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKGZpbGVzKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEluYm94RW50cnksIEluYm94RW50cnlJZGVudGl0eSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld1NlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LXNlcnZpY2VcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbnR5cGUgUmV2aWV3QWN0aW9uID0gXCJrZWVwXCIgfCBcInRhc2tcIiB8IFwiam91cm5hbFwiIHwgXCJub3RlXCIgfCBcInNraXBcIjtcblxuZXhwb3J0IGNsYXNzIEluYm94UmV2aWV3TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgY3VycmVudEluZGV4ID0gMDtcbiAgcHJpdmF0ZSByZWFkb25seSBoYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5hbHRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGlmICh0YXJnZXQgJiYgKHRhcmdldC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgdGFyZ2V0LnRhZ05hbWUgPT09IFwiVEVYVEFSRUFcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBrZXlUb0FjdGlvbihldmVudC5rZXkpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB2b2lkIHRoaXMuaGFuZGxlQWN0aW9uKGFjdGlvbik7XG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBlbnRyaWVzOiBJbmJveEVudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdTZXJ2aWNlOiBSZXZpZXdTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb25BY3Rpb25Db21wbGV0ZT86IChtZXNzYWdlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvY2VzcyBJbmJveFwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIk5vIGluYm94IGVudHJpZXMgZm91bmQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIHRleHQ6IGBFbnRyeSAke3RoaXMuY3VycmVudEluZGV4ICsgMX0gb2YgJHt0aGlzLmVudHJpZXMubGVuZ3RofWAsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBlbnRyeS5oZWFkaW5nIHx8IFwiVW50aXRsZWQgZW50cnlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgZW50cnkpXCIsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIGFuIGFjdGlvbiBmb3IgdGhpcyBlbnRyeS4gU2hvcnRjdXRzOiBrIGtlZXAsIHQgdGFzaywgaiBqb3VybmFsLCBuIG5vdGUsIHMgc2tpcC5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvblJvdyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiS2VlcCBpbiBpbmJveFwiLCBcImtlZXBcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIkNvbnZlcnQgdG8gdGFza1wiLCBcInRhc2tcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIkFwcGVuZCB0byBqb3VybmFsXCIsIFwiam91cm5hbFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiUHJvbW90ZSB0byBub3RlXCIsIFwibm90ZVwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiU2tpcFwiLCBcInNraXBcIik7XG4gIH1cblxuICBwcml2YXRlIGFkZEJ1dHRvbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nLCBhY3Rpb246IFJldmlld0FjdGlvbik6IHZvaWQge1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IGFjdGlvbiA9PT0gXCJub3RlXCIgPyBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiIDogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IGxhYmVsLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuaGFuZGxlQWN0aW9uKGFjdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZUFjdGlvbihhY3Rpb246IFJldmlld0FjdGlvbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZXNzYWdlID0gXCJcIjtcbiAgICAgIGlmIChhY3Rpb24gPT09IFwidGFza1wiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UucHJvbW90ZVRvVGFzayhlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5hcHBlbmRUb0pvdXJuYWwoZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwibm90ZVwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UucHJvbW90ZVRvTm90ZShlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJrZWVwXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5rZWVwRW50cnkoZW50cnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5za2lwRW50cnkoZW50cnkpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5vbkFjdGlvbkNvbXBsZXRlKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5vbkFjdGlvbkNvbXBsZXRlKG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcHJvY2VzcyByZXZpZXcgYWN0aW9uXCIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCArPSAxO1xuXG4gICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXggPj0gdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiSW5ib3ggcmV2aWV3IGNvbXBsZXRlXCIpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBwcm9jZXNzIGluYm94IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBrZXlUb0FjdGlvbihrZXk6IHN0cmluZyk6IFJldmlld0FjdGlvbiB8IG51bGwge1xuICBzd2l0Y2ggKGtleS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSBcImtcIjpcbiAgICAgIHJldHVybiBcImtlZXBcIjtcbiAgICBjYXNlIFwidFwiOlxuICAgICAgcmV0dXJuIFwidGFza1wiO1xuICAgIGNhc2UgXCJqXCI6XG4gICAgICByZXR1cm4gXCJqb3VybmFsXCI7XG4gICAgY2FzZSBcIm5cIjpcbiAgICAgIHJldHVybiBcIm5vdGVcIjtcbiAgICBjYXNlIFwic1wiOlxuICAgICAgcmV0dXJuIFwic2tpcFwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKipcbiAqIENlbnRyYWxpemVkIGVycm9yIGhhbmRsaW5nIHV0aWxpdHlcbiAqIFN0YW5kYXJkaXplcyBlcnJvciByZXBvcnRpbmcgYWNyb3NzIHRoZSBwbHVnaW5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yKGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZTtcbiAgbmV3IE5vdGljZShtZXNzYWdlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvckFuZFJldGhyb3coZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiBuZXZlciB7XG4gIHNob3dFcnJvcihlcnJvciwgZGVmYXVsdE1lc3NhZ2UpO1xuICB0aHJvdyBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoZGVmYXVsdE1lc3NhZ2UpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgUXVlc3Rpb25TY29wZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgdHlwZSB7IFF1ZXN0aW9uU2NvcGUgfTtcblxuaW50ZXJmYWNlIFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUXVlc3Rpb25TY29wZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFF1ZXN0aW9uU2NvcGUgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFF1ZXN0aW9uU2NvcGVNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8UXVlc3Rpb25TY29wZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIHRoZSBzY29wZSBCcmFpbiBzaG91bGQgdXNlIGZvciB0aGlzIHJlcXVlc3QuXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBOb3RlXCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwibm90ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiU2VsZWN0ZWQgTm90ZXNcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJncm91cFwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ3VycmVudCBGb2xkZXJcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJmb2xkZXJcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkVudGlyZSBWYXVsdFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInZhdWx0XCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHNjb3BlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUoc2NvcGUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgY2xhc3MgUmV2aWV3SGlzdG9yeU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgSGlzdG9yeVwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyByZXZpZXcgbG9ncyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiT3BlbiBhIGxvZyB0byBpbnNwZWN0IGl0LCBvciByZS1vcGVuIGFuIGluYm94IGl0ZW0gaWYgaXQgd2FzIG1hcmtlZCBpbmNvcnJlY3RseS5cIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5lbnRyaWVzKSB7XG4gICAgICBjb25zdCByb3cgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb25cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGl0ZW1cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgJHtlbnRyeS50aW1lc3RhbXB9IFx1MjAyMiAke2VudHJ5LmFjdGlvbn1gLFxuICAgICAgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgcHJldmlldylcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidXR0b25zID0gcm93LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgIHRleHQ6IFwiT3BlbiBsb2dcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuTG9nKGVudHJ5LnNvdXJjZVBhdGgpO1xuICAgICAgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICB0ZXh0OiBcIlJlLW9wZW5cIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5yZW9wZW5FbnRyeShlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Mb2cocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoYWJzdHJhY3RGaWxlKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnBsdWdpbi5yZW9wZW5SZXZpZXdFbnRyeShlbnRyeSk7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlLW9wZW4gaW5ib3ggZW50cnlcIik7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0TG9jYXRpb24gfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBTeW50aGVzaXNSZXN1bHRNb2RhbE9wdGlvbnMge1xuICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0O1xuICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdDtcbiAgY2FuSW5zZXJ0OiBib29sZWFuO1xuICBvbkluc2VydDogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBvblNhdmU6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgb25BY3Rpb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIFN5bnRoZXNpc1Jlc3VsdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidXR0b25zOiBIVE1MQnV0dG9uRWxlbWVudFtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBTeW50aGVzaXNSZXN1bHRNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBgQnJhaW4gJHt0aGlzLm9wdGlvbnMucmVzdWx0LnRpdGxlfWAgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBBY3Rpb246ICR7dGhpcy5vcHRpb25zLnJlc3VsdC5hY3Rpb259YCxcbiAgICB9KTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc3VsdC5wcm9tcHRUZXh0KSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogYFByb21wdDogJHt0aGlzLm9wdGlvbnMucmVzdWx0LnByb21wdFRleHR9YCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBDb250ZXh0OiAke2Zvcm1hdENvbnRleHRMb2NhdGlvbih0aGlzLm9wdGlvbnMuY29udGV4dCl9YCxcbiAgICB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5jb250ZXh0LnRydW5jYXRlZFxuICAgICAgICA/IGBDb250ZXh0IHRydW5jYXRlZCB0byAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHt0aGlzLm9wdGlvbnMuY29udGV4dC5vcmlnaW5hbExlbmd0aH0uYFxuICAgICAgICA6IGBDb250ZXh0IGxlbmd0aDogJHt0aGlzLm9wdGlvbnMuY29udGV4dC5vcmlnaW5hbExlbmd0aH0gY2hhcmFjdGVycy5gLFxuICAgIH0pO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5yZXN1bHQuY29udGVudCxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FuSW5zZXJ0KSB7XG4gICAgICAvLyBCdXR0b25zIGFyZSByZW5kZXJlZCBiZWxvdyBhZnRlciBvcHRpb25hbCBndWlkYW5jZSB0ZXh0LlxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogXCJPcGVuIGEgbWFya2Rvd24gbm90ZSB0byBpbnNlcnQgdGhpcyBhcnRpZmFjdCB0aGVyZSwgb3Igc2F2ZSBpdCB0byBCcmFpbiBub3Rlcy5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYnV0dG9ucyA9IFtdO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jYW5JbnNlcnQpIHtcbiAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiSW5zZXJ0IGludG8gY3VycmVudCBub3RlXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJ1bkFjdGlvbigoKSA9PiB0aGlzLm9wdGlvbnMub25JbnNlcnQoKSk7XG4gICAgICB9LCB0cnVlKSk7XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25zLnB1c2goXG4gICAgICB0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIlNhdmUgdG8gQnJhaW4gbm90ZXNcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucnVuQWN0aW9uKCgpID0+IHRoaXMub3B0aW9ucy5vblNhdmUoKSk7XG4gICAgICB9KSxcbiAgICAgIHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiQ2xvc2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVCdXR0b24oXG4gICAgcGFyZW50OiBIVE1MRWxlbWVudCxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgb25DbGljazogKCkgPT4gdm9pZCxcbiAgICBjdGEgPSBmYWxzZSxcbiAgKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHBhcmVudC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IGN0YSA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dCxcbiAgICB9KTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkFjdGlvbihhY3Rpb246ICgpID0+IFByb21pc2U8c3RyaW5nPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLndvcmtpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0QnV0dG9uc0Rpc2FibGVkKHRydWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCBhY3Rpb24oKTtcbiAgICAgIGF3YWl0IHRoaXMub3B0aW9ucy5vbkFjdGlvbkNvbXBsZXRlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHVwZGF0ZSB0aGUgc3ludGhlc2lzIHJlc3VsdFwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZChmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25zRGlzYWJsZWQoZGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiB0aGlzLmJ1dHRvbnMpIHtcbiAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLXRlbXBsYXRlXCI7XG5pbXBvcnQgdHlwZSB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCB0eXBlIHsgU3ludGhlc2lzVGVtcGxhdGUgfTtcblxuaW50ZXJmYWNlIFRlbXBsYXRlUGlja2VyT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBUZW1wbGF0ZVBpY2tlck9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBob3cgQnJhaW4gc2hvdWxkIHN5bnRoZXNpemUgdGhpcyBjb250ZXh0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwic3VtbWFyaXplXCIpKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInN1bW1hcml6ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LXRhc2tzXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3QtdGFza3NcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1kZWNpc2lvbnNcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC1kZWNpc2lvbnNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcInJld3JpdGUtY2xlYW4tbm90ZVwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJyZXdyaXRlLWNsZWFuLW5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHRlbXBsYXRlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIEl0ZW1WaWV3LCBOb3RpY2UsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuaW50ZXJmYWNlIEFwcFdpdGhTZXR0aW5ncyBleHRlbmRzIEFwcCB7XG4gIHNldHRpbmc6IHtcbiAgICBvcGVuKCk6IHZvaWQ7XG4gICAgb3BlblRhYkJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQ7XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSByZXN1bHRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGluYm94Q291bnRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHRhc2tDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmV2aWV3SGlzdG9yeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgYWlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlTdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGlzTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGNvbGxhcHNlZFNlY3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBCUkFJTl9WSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIkJyYWluXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW5cIjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tc2lkZWJhclwiKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDYXB0dXJlIGlkZWFzLCBzeW50aGVzaXplIGV4cGxpY2l0IGNvbnRleHQsIGFuZCBzYXZlIGR1cmFibGUgbWFya2Rvd24gYXJ0aWZhY3RzLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkQ29sbGFwc2VkU3RhdGUoKTtcbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVBc2tTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVSZXZpZXdTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlU3RhdHVzU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0U2VjdGlvbigpO1xuICAgIHRoaXMucmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBzZXRMYXN0UmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMucmVzdWx0RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIHNldExhc3RTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IFtpbmJveENvdW50LCB0YXNrQ291bnQsIHJldmlld0NvdW50XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMucGx1Z2luLmdldEluYm94Q291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldE9wZW5UYXNrQ291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldFJldmlld0hpc3RvcnlDb3VudCgpLFxuICAgIF0pO1xuICAgIGlmICh0aGlzLmluYm94Q291bnRFbCkge1xuICAgICAgdGhpcy5pbmJveENvdW50RWwuc2V0VGV4dChgJHtpbmJveENvdW50fSB1bnJldmlld2VkIGVudHJpZXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudGFza0NvdW50RWwpIHtcbiAgICAgIHRoaXMudGFza0NvdW50RWwuc2V0VGV4dChgJHt0YXNrQ291bnR9IG9wZW4gdGFza3NgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmV2aWV3SGlzdG9yeUVsKSB7XG4gICAgICB0aGlzLnJldmlld0hpc3RvcnlFbC5zZXRUZXh0KGBSZXZpZXcgaGlzdG9yeTogJHtyZXZpZXdDb3VudH0gZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5haVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLmFpU3RhdHVzRWwuZW1wdHkoKTtcbiAgICAgIGNvbnN0IHN0YXR1c1RleHQgPSB0aGlzLnBsdWdpbi5nZXRBaVN0YXR1c1RleHQoKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQUk6ICR7c3RhdHVzVGV4dH0gYCB9KTtcblxuICAgICAgY29uc3QgaXNDb25uZWN0ZWQgPSBzdGF0dXNUZXh0LmluY2x1ZGVzKFwiY29uZmlndXJlZFwiKTtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICAgIHRleHQ6IGlzQ29ubmVjdGVkID8gXCJNYW5hZ2VcIiA6IFwiQ29ubmVjdFwiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHAgYXMgQXBwV2l0aFNldHRpbmdzO1xuICAgICAgICBhcHAuc2V0dGluZy5vcGVuKCk7XG4gICAgICAgIGFwcC5zZXR0aW5nLm9wZW5UYWJCeUlkKHRoaXMucGx1Z2luLm1hbmlmZXN0LmlkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdW1tYXJ5U3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuc3VtbWFyeVN0YXR1c0VsLnNldFRleHQodGhpcy5wbHVnaW4uZ2V0TGFzdFN1bW1hcnlMYWJlbCgpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldExvYWRpbmcobG9hZGluZzogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuaXNMb2FkaW5nID0gbG9hZGluZztcbiAgICBjb25zdCBidXR0b25zID0gQXJyYXkuZnJvbSh0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uLmJyYWluLWJ1dHRvblwiKSk7XG4gICAgZm9yIChjb25zdCBidXR0b24gb2YgYnV0dG9ucykge1xuICAgICAgKGJ1dHRvbiBhcyBIVE1MQnV0dG9uRWxlbWVudCkuZGlzYWJsZWQgPSBsb2FkaW5nO1xuICAgIH1cbiAgICBpZiAodGhpcy5pbnB1dEVsKSB7XG4gICAgICB0aGlzLmlucHV0RWwuZGlzYWJsZWQgPSBsb2FkaW5nO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpOiB2b2lkIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZG9ubHkgaGFuZGxlS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4ge1xuICAgIGlmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuYWx0S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAodGFyZ2V0ICYmICh0YXJnZXQudGFnTmFtZSA9PT0gXCJJTlBVVFwiIHx8IHRhcmdldC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3dpdGNoIChldmVudC5rZXkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVBc05vdGUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwidFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzVGFzaygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJqXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQXNKb3VybmFsKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICAgICAgbmV3IE5vdGljZShcIkNhcHR1cmUgY2xlYXJlZFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9O1xuXG4gIHByaXZhdGUgdG9nZ2xlU2VjdGlvbihzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhzZWN0aW9uSWQpKSB7XG4gICAgICB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmRlbGV0ZShzZWN0aW9uSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmFkZChzZWN0aW9uSWQpO1xuICAgIH1cbiAgICB0aGlzLnNhdmVDb2xsYXBzZWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkQ29sbGFwc2VkU3RhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucyA9IG5ldyBTZXQodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZUNvbGxhcHNlZFN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyA9IEFycmF5LmZyb20odGhpcy5jb2xsYXBzZWRTZWN0aW9ucyk7XG4gICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIGNvbnRlbnRDcmVhdG9yOiAoY29udGFpbmVyOiBIVE1MRWxlbWVudCkgPT4gdm9pZCxcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaGVhZGVyID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zZWN0aW9uLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IHRvZ2dsZUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY29sbGFwc2UtdG9nZ2xlXCIsXG4gICAgICB0ZXh0OiB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBcIlx1MjVCNlwiIDogXCJcdTI1QkNcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgXCJhcmlhLWxhYmVsXCI6IHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IGBFeHBhbmQgJHt0aXRsZX1gIDogYENvbGxhcHNlICR7dGl0bGV9YCxcbiAgICAgICAgXCJhcmlhLWV4cGFuZGVkXCI6ICghdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpKS50b1N0cmluZygpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IHRpdGxlIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBkZXNjcmlwdGlvbiB9KTtcblxuICAgIHRvZ2dsZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50b2dnbGVTZWN0aW9uKGlkKTtcbiAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IHNlY3Rpb24ucXVlcnlTZWxlY3RvcihcIi5icmFpbi1zZWN0aW9uLWNvbnRlbnRcIik7XG4gICAgICBpZiAoY29udGVudEVsKSB7XG4gICAgICAgIGNvbnRlbnRFbC50b2dnbGVBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgICAgIHRvZ2dsZUJ0bi5zZXRUZXh0KHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IFwiXHUyNUI2XCIgOiBcIlx1MjVCQ1wiKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gYEV4cGFuZCAke3RpdGxlfWAgOiBgQ29sbGFwc2UgJHt0aXRsZX1gKTtcbiAgICAgICAgdG9nZ2xlQnRuLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgKCF0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkpLnRvU3RyaW5nKCkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgY29udGVudCA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb24tY29udGVudFwiLFxuICAgICAgYXR0cjogdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8geyBoaWRkZW46IFwidHJ1ZVwiIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gICAgY29udGVudENyZWF0b3IoY29udGVudCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJjYXB0dXJlXCIsXG4gICAgICBcIlF1aWNrIENhcHR1cmVcIixcbiAgICAgIFwiQ2FwdHVyZSByb3VnaCBpbnB1dCBpbnRvIHRoZSB2YXVsdCBiZWZvcmUgcmV2aWV3IGFuZCBzeW50aGVzaXMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIHRoaXMuaW5wdXRFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tY2FwdHVyZS1pbnB1dFwiLFxuICAgICAgICAgIGF0dHI6IHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIlR5cGUgYSBub3RlLCB0YXNrLCBvciBqb3VybmFsIGVudHJ5Li4uXCIsXG4gICAgICAgICAgICByb3dzOiBcIjhcIixcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2FwdHVyZSBOb3RlIChuKVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNOb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDYXB0dXJlIFRhc2sgKHQpXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc1Rhc2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNhcHR1cmUgSm91cm5hbCAoailcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzSm91cm5hbCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2xlYXIgKGMpXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQ2FwdHVyZSBjbGVhcmVkXCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3ludGhlc2lzU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwic3ludGhlc2lzXCIsXG4gICAgICBcIlN5bnRoZXNpemVcIixcbiAgICAgIFwiVHVybiBleHBsaWNpdCBjb250ZXh0IGludG8gc3VtbWFyaWVzLCBjbGVhbiBub3RlcywgdGFza3MsIGFuZCBicmllZnMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgICAgdGV4dDogXCJTdW1tYXJpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJTeW50aGVzaXplIEN1cnJlbnQgTm90ZS4uLlwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0U2VsZWN0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJEcmFmdCBCcmllZiBGcm9tIEZvbGRlclwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDbGVhbiBOb3RlIEZyb20gUmVjZW50IEZpbGVzXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hc2tBYm91dFJlY2VudEZpbGVzKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiU3ludGhlc2l6ZSBOb3Rlcy4uLlwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc3ludGhlc2l6ZU5vdGVzKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQXNrU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwiYXNrXCIsXG4gICAgICBcIkFzayBCcmFpblwiLFxuICAgICAgXCJBc2sgYSBxdWVzdGlvbiBhYm91dCB0aGUgY3VycmVudCBub3RlLCBhIHNlbGVjdGVkIGdyb3VwLCBhIGZvbGRlciwgb3IgdGhlIHdob2xlIHZhdWx0LlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICAgIHRleHQ6IFwiQXNrIFF1ZXN0aW9uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkFib3V0IEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudEZvbGRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmV2aWV3U2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwicmV2aWV3XCIsXG4gICAgICBcIlJldmlld1wiLFxuICAgICAgXCJQcm9jZXNzIGNhcHR1cmVkIGlucHV0IGFuZCBrZWVwIHRoZSBkYWlseSBsb29wIG1vdmluZy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgICB0ZXh0OiBcIlJldmlldyBJbmJveFwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucHJvY2Vzc0luYm94KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlVG9waWNQYWdlU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwidG9waWNcIixcbiAgICAgIFwiVG9waWMgUGFnZXNcIixcbiAgICAgIFwiQnJhaW4ncyBmbGFnc2hpcCBmbG93OiB0dXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBhIGR1cmFibGUgbWFya2Rvd24gcGFnZSB5b3UgY2FuIGtlZXAgYnVpbGRpbmcuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlKCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVBc3Npc3RTZWN0aW9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcImNhcHR1cmUtYXNzaXN0XCIsXG4gICAgICBcIkNhcHR1cmUgQXNzaXN0XCIsXG4gICAgICBcIlVzZSBBSSBvbmx5IHRvIGNsYXNzaWZ5IGZyZXNoIGNhcHR1cmUgaW50byBub3RlLCB0YXNrLCBvciBqb3VybmFsLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQXV0by1yb3V0ZSBDYXB0dXJlXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLmF1dG9Sb3V0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdHVzU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwic3RhdHVzXCIsXG4gICAgICBcIlN0YXR1c1wiLFxuICAgICAgXCJDdXJyZW50IGluYm94LCB0YXNrLCBhbmQgc3ludGhlc2lzIHN0YXR1cy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgaW5ib3hSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJJbmJveDogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLmluYm94Q291bnRFbCA9IGluYm94Um93O1xuXG4gICAgICAgIGNvbnN0IHRhc2tSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJUYXNrczogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICB0aGlzLnRhc2tDb3VudEVsID0gdGFza1JvdztcblxuICAgICAgICBjb25zdCByZXZpZXdSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc3RhdHVzLXJvd1wiIH0pO1xuICAgICAgICB0aGlzLnJldmlld0hpc3RvcnlFbCA9IHJldmlld1Jvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIlJldmlldyBoaXN0b3J5OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHJldmlld1Jvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgICAgICB0ZXh0OiBcIk9wZW5cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFpUm93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiQUk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5haVN0YXR1c0VsID0gYWlSb3c7XG5cbiAgICAgICAgY29uc3Qgc3VtbWFyeVJvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkxhc3QgYXJ0aWZhY3Q6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5zdW1tYXJ5U3RhdHVzRWwgPSBzdW1tYXJ5Um93O1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRTZWN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJvdXRwdXRcIixcbiAgICAgIFwiQXJ0aWZhY3RzXCIsXG4gICAgICBcIlJlY2VudCBzeW50aGVzaXMgcmVzdWx0cyBhbmQgZ2VuZXJhdGVkIGFydGlmYWN0cy5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkxhc3QgUmVzdWx0XCIgfSk7XG4gICAgICAgIHRoaXMucmVzdWx0RWwgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1vdXRwdXRcIixcbiAgICAgICAgICB0ZXh0OiBcIk5vIHJlc3VsdCB5ZXQuXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IEFydGlmYWN0XCIgfSk7XG4gICAgICAgIHRoaXMuc3VtbWFyeUVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tb3V0cHV0XCIsXG4gICAgICAgICAgdGV4dDogXCJObyBhcnRpZmFjdCBnZW5lcmF0ZWQgeWV0LlwiLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzTm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVOb3RlKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzVGFzaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSBqb3VybmFsIGVudHJ5XCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXV0b1JvdXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXRMb2FkaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJvdXRlVGV4dCh0ZXh0KTtcbiAgICAgIGlmICghcm91dGUpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGNvdWxkIG5vdCBjbGFzc2lmeSB0aGF0IGVudHJ5XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocm91dGUgPT09IFwibm90ZVwiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZU5vdGUodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKHJvdXRlID09PSBcInRhc2tcIikge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIGpvdXJuYWwgZW50cnlcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhdXRvLXJvdXRlIGNhcHR1cmVcIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ2FwdHVyZShcbiAgICBhY3Rpb246ICh0ZXh0OiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPixcbiAgICBmYWlsdXJlTWVzc2FnZTogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odGV4dCk7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgZmFpbHVyZU1lc3NhZ2UpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbW1hbmRzKHBsdWdpbjogQnJhaW5QbHVnaW4pOiB2b2lkIHtcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNhcHR1cmUtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcIkNhcHR1cmUgTm90ZVwiLCBcIkNhcHR1cmVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4ubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGBDYXB0dXJlZCBub3RlIGluICR7c2F2ZWQucGF0aH1gO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC10YXNrXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBUYXNrXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFwiQ2FwdHVyZSBUYXNrXCIsIFwiQ2FwdHVyZVwiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgICAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYWRkLWpvdXJuYWwtZW50cnlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIEpvdXJuYWxcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXG4gICAgICAgIFwiQ2FwdHVyZSBKb3VybmFsXCIsXG4gICAgICAgIFwiQ2FwdHVyZVwiLFxuICAgICAgICBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KHRleHQpO1xuICAgICAgICAgIHJldHVybiBgU2F2ZWQgam91cm5hbCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgICAgfSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInByb2Nlc3MtaW5ib3hcIixcbiAgICBuYW1lOiBcIkJyYWluOiBSZXZpZXcgSW5ib3hcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLnByb2Nlc3NJbmJveCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJyZXZpZXctaGlzdG9yeVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gUmV2aWV3IEhpc3RvcnlcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN1bW1hcml6ZS10b2RheVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFRvZGF5IFN1bW1hcnlcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdygxLCBcIlRvZGF5XCIpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzdW1tYXJpemUtdGhpcy13ZWVrXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgV2Vla2x5IFN1bW1hcnlcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyg3LCBcIldlZWtcIik7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC10YXNrLWZyb20tc2VsZWN0aW9uXCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBUYXNrIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hZGRUYXNrRnJvbVNlbGVjdGlvbigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXRvZGF5cy1qb3VybmFsXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBUb2RheSdzIEpvdXJuYWxcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5Ub2RheXNKb3VybmFsKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4tc2lkZWJhclwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gQnJhaW4gU2lkZWJhclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblNpZGViYXIoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3ludGhlc2l6ZS1ub3Rlc1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IFN5bnRoZXNpemUgTm90ZXNcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLnN5bnRoZXNpemVOb3RlcygpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeW50aGVzaXplLWN1cnJlbnQtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IFN5bnRoZXNpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFzay1xdWVzdGlvblwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEFzayBRdWVzdGlvblwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrUXVlc3Rpb24oKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiYXNrLXF1ZXN0aW9uLWN1cnJlbnQtbm90ZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEFzayBRdWVzdGlvbiBBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjcmVhdGUtdG9waWMtcGFnZVwiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFRvcGljIFBhZ2VcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNyZWF0ZVRvcGljUGFnZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjcmVhdGUtdG9waWMtcGFnZS1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb3BpYyBQYWdlIEZyb20gQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZShcIm5vdGVcIik7XG4gICAgfSxcbiAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxvQkFBb0Q7OztBQzJCN0MsSUFBTSx5QkFBOEM7QUFBQSxFQUN6RCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxlQUFlO0FBQUEsRUFDZixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixlQUFlO0FBQUEsRUFDZixtQkFBbUI7QUFBQSxFQUNuQixpQkFBaUI7QUFBQSxFQUNqQixjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixlQUFlO0FBQUEsRUFDZixZQUFZO0FBQUEsRUFDWixjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixxQkFBcUI7QUFBQSxFQUNyQixpQkFBaUI7QUFBQSxFQUNqQixrQkFBa0I7QUFBQSxFQUNsQiwwQkFBMEIsQ0FBQztBQUM3QjtBQUVPLFNBQVMsdUJBQ2QsT0FDcUI7QUFDckIsUUFBTSxTQUE4QjtBQUFBLElBQ2xDLEdBQUc7QUFBQSxJQUNILEdBQUc7QUFBQSxFQUNMO0FBRUEsU0FBTztBQUFBLElBQ0wsV0FBVyxzQkFBc0IsT0FBTyxXQUFXLHVCQUF1QixTQUFTO0FBQUEsSUFDbkYsV0FBVyxzQkFBc0IsT0FBTyxXQUFXLHVCQUF1QixTQUFTO0FBQUEsSUFDbkYsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGFBQWE7QUFBQSxNQUNYLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxpQkFBaUI7QUFBQSxNQUNmLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsTUFDUCx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLElBQ0EsbUJBQW1CLFFBQVEsT0FBTyxpQkFBaUI7QUFBQSxJQUNuRCxpQkFBaUIsUUFBUSxPQUFPLGVBQWU7QUFBQSxJQUMvQyxjQUFjLE9BQU8sT0FBTyxpQkFBaUIsV0FBVyxPQUFPLGFBQWEsS0FBSyxJQUFJO0FBQUEsSUFDckYsYUFDRSxPQUFPLE9BQU8sZ0JBQWdCLFlBQVksT0FBTyxZQUFZLEtBQUssSUFDOUQsT0FBTyxZQUFZLEtBQUssSUFDeEIsdUJBQXVCO0FBQUEsSUFDN0IsZUFDRSxPQUFPLE9BQU8sa0JBQWtCLFlBQVksT0FBTyxjQUFjLEtBQUssSUFDbEUsT0FBTyxjQUFjLEtBQUssSUFDMUIsdUJBQXVCO0FBQUEsSUFDN0IsWUFBYSxPQUFPLGVBQWUsV0FBVyxXQUFXO0FBQUEsSUFDekQsY0FBYyxPQUFPLE9BQU8saUJBQWlCLFdBQVcsT0FBTyxhQUFhLEtBQUssSUFBSTtBQUFBLElBQ3JGLGFBQ0UsT0FBTyxPQUFPLGdCQUFnQixZQUFZLE9BQU8sWUFBWSxLQUFLLElBQzlELE9BQU8sWUFBWSxLQUFLLElBQ3hCLHVCQUF1QjtBQUFBLElBQzdCLHFCQUFxQixhQUFhLE9BQU8scUJBQXFCLEdBQUcsS0FBSyx1QkFBdUIsbUJBQW1CO0FBQUEsSUFDaEgsaUJBQWlCLGFBQWEsT0FBTyxpQkFBaUIsS0FBTSxLQUFRLHVCQUF1QixlQUFlO0FBQUEsSUFDMUcsa0JBQWtCLFFBQVEsT0FBTyxnQkFBZ0I7QUFBQSxJQUNqRCwwQkFBMEIsTUFBTSxRQUFRLE9BQU8sd0JBQXdCLElBQ2xFLE9BQU8seUJBQXNDLE9BQU8sQ0FBQyxNQUFNLE9BQU8sTUFBTSxRQUFRLElBQ2pGLHVCQUF1QjtBQUFBLEVBQzdCO0FBQ0Y7QUFFQSxTQUFTLHNCQUFzQixPQUFnQixVQUEwQjtBQUN2RSxNQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLFdBQU87QUFBQSxFQUNUO0FBRUEsUUFBTSxhQUFhLE1BQU0sS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFLEVBQUUsUUFBUSxRQUFRLEVBQUU7QUFDdEUsU0FBTyxjQUFjO0FBQ3ZCO0FBRUEsU0FBUyxhQUNQLE9BQ0EsS0FDQSxLQUNBLFVBQ1E7QUFDUixNQUFJLE9BQU8sVUFBVSxZQUFZLE9BQU8sVUFBVSxLQUFLLEdBQUc7QUFDeEQsV0FBTyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLENBQUM7QUFBQSxFQUMzQztBQUVBLE1BQUksT0FBTyxVQUFVLFVBQVU7QUFDN0IsVUFBTSxTQUFTLE9BQU8sU0FBUyxPQUFPLEVBQUU7QUFDeEMsUUFBSSxPQUFPLFNBQVMsTUFBTSxHQUFHO0FBQzNCLGFBQU8sS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssTUFBTSxDQUFDO0FBQUEsSUFDNUM7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNUOzs7QUNoSUEsc0JBQXNFO0FBRy9ELElBQU0sa0JBQU4sY0FBOEIsaUNBQWlCO0FBQUEsRUFHcEQsWUFBWSxLQUFVLFFBQXFCO0FBQ3pDLFVBQU0sS0FBSyxNQUFNO0FBQ2pCLFNBQUssU0FBUztBQUdkLFNBQUssT0FBTyxJQUFJLFVBQVUsR0FBRywwQkFBbUMsTUFBTTtBQUNwRSxXQUFLLFFBQVE7QUFBQSxJQUNmLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxVQUFnQjtBQUNkLFVBQU0sRUFBRSxZQUFZLElBQUk7QUFDeEIsZ0JBQVksTUFBTTtBQUNsQixnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXJELGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRTlDLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLFlBQVksRUFDcEIsUUFBUSw0Q0FBNEMsRUFDcEQ7QUFBQSxNQUFRLENBQUMsU0FDUixLQUFLO0FBQUEsUUFDSDtBQUFBLFFBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxRQUNyQixDQUFDLFVBQVU7QUFDVCxlQUFLLE9BQU8sU0FBUyxZQUFZO0FBQUEsUUFDbkM7QUFBQSxRQUNBLENBQUMsVUFBVTtBQUNULGNBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztBQUNqQixnQkFBSSx1QkFBTyw0QkFBNEI7QUFDdkMsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxZQUFZLEVBQ3BCLFFBQVEsNENBQTRDLEVBQ3BEO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FBSztBQUFBLFFBQ0g7QUFBQSxRQUNBLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDckIsQ0FBQyxVQUFVO0FBQ1QsZUFBSyxPQUFPLFNBQVMsWUFBWTtBQUFBLFFBQ25DO0FBQUEsUUFDQSxDQUFDLFVBQVU7QUFDVCxjQUFJLENBQUMsTUFBTSxLQUFLLEdBQUc7QUFDakIsZ0JBQUksdUJBQU8sNEJBQTRCO0FBQ3ZDLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsZ0JBQWdCLEVBQ3hCLFFBQVEsd0NBQXdDLEVBQ2hEO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FBSztBQUFBLFFBQ0g7QUFBQSxRQUNBLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDckIsQ0FBQyxVQUFVO0FBQ1QsZUFBSyxPQUFPLFNBQVMsZ0JBQWdCO0FBQUEsUUFDdkM7QUFBQSxRQUNBLENBQUMsVUFBVTtBQUNULGNBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztBQUNqQixnQkFBSSx1QkFBTyxnQ0FBZ0M7QUFDM0MsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxjQUFjLEVBQ3RCLFFBQVEsa0VBQWtFLEVBQzFFO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FBSztBQUFBLFFBQ0g7QUFBQSxRQUNBLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDckIsQ0FBQyxVQUFVO0FBQ1QsZUFBSyxPQUFPLFNBQVMsY0FBYztBQUFBLFFBQ3JDO0FBQUEsUUFDQSxDQUFDLFVBQVU7QUFDVCxjQUFJLENBQUMsTUFBTSxLQUFLLEdBQUc7QUFDakIsZ0JBQUksdUJBQU8sOEJBQThCO0FBQ3pDLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsa0JBQWtCLEVBQzFCLFFBQVEsc0NBQXNDLEVBQzlDO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FBSztBQUFBLFFBQ0g7QUFBQSxRQUNBLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDckIsQ0FBQyxVQUFVO0FBQ1QsZUFBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQUEsUUFDekM7QUFBQSxRQUNBLENBQUMsVUFBVTtBQUNULGNBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztBQUNqQixnQkFBSSx1QkFBTyxrQ0FBa0M7QUFDN0MsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEIsUUFBUSx5Q0FBeUMsRUFDakQ7QUFBQSxNQUFRLENBQUMsU0FDUixLQUFLO0FBQUEsUUFDSDtBQUFBLFFBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxRQUNyQixDQUFDLFVBQVU7QUFDVCxlQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFBQSxRQUN2QztBQUFBLFFBQ0EsQ0FBQyxVQUFVO0FBQ1QsY0FBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO0FBQ2pCLGdCQUFJLHVCQUFPLGdDQUFnQztBQUMzQyxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVGLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBRXpDLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGFBQWEsRUFDckIsUUFBUSw0REFBNEQsRUFDcEU7QUFBQSxNQUFZLENBQUMsYUFDWixTQUNHLFdBQVc7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLFFBQVE7QUFBQSxNQUNWLENBQUMsRUFDQSxTQUFTLEtBQUssT0FBTyxTQUFTLFVBQVUsRUFDeEMsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsYUFBYTtBQUNsQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssUUFBUTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0w7QUFFRixRQUFJLEtBQUssT0FBTyxTQUFTLGVBQWUsVUFBVTtBQUNoRCxZQUFNLGNBQWMsSUFBSSx3QkFBUSxXQUFXLEVBQ3hDLFFBQVEsZ0JBQWdCLEVBQ3hCLFFBQVEsS0FBSyxPQUFPLFNBQVMsZUFBZSx3QkFBd0IsZUFBZTtBQUV0RixVQUFJLEtBQUssT0FBTyxTQUFTLGNBQWM7QUFDckMsb0JBQVk7QUFBQSxVQUFVLENBQUMsV0FDckIsT0FDRyxjQUFjLFlBQVksRUFDMUIsV0FBVyxFQUNYLFFBQVEsWUFBWTtBQUNuQixpQkFBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxrQkFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixpQkFBSyxRQUFRO0FBQUEsVUFDZixDQUFDO0FBQUEsUUFDTDtBQUFBLE1BQ0YsT0FBTztBQUNMLG9CQUFZO0FBQUEsVUFBVSxDQUFDLFdBQ3JCLE9BQ0csY0FBYyxnQkFBZ0IsRUFDOUIsT0FBTyxFQUNQLFFBQVEsWUFBWTtBQUNuQixrQkFBTSxLQUFLLE9BQU8sWUFBWSxNQUFNLFFBQVE7QUFBQSxVQUM5QyxDQUFDO0FBQUEsUUFDTDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEIsUUFBUSxpRkFBaUYsRUFDekYsUUFBUSxDQUFDLFNBQVM7QUFDakIsYUFBSyxRQUFRLE9BQU87QUFDcEIsYUFBSyxlQUFlLHVCQUF1QjtBQUMzQyxhQUFLO0FBQUEsVUFDSDtBQUFBLFVBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxVQUNyQixDQUFDLFVBQVU7QUFDVCxpQkFBSyxPQUFPLFNBQVMsZUFBZTtBQUFBLFVBQ3RDO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUVILFVBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGNBQWMsRUFDdEIsUUFBUSx1Q0FBdUMsRUFDL0MsWUFBWSxDQUFDLGFBQWE7QUFDekIsaUJBQ0csV0FBVztBQUFBLFVBQ1YsZUFBZTtBQUFBLFVBQ2YsVUFBVTtBQUFBLFVBQ1YsV0FBVztBQUFBLFVBQ1gsY0FBYztBQUFBLFVBQ2QsaUJBQWlCO0FBQUEsVUFDakIsUUFBUTtBQUFBLFFBQ1YsQ0FBQyxFQUNBO0FBQUEsVUFDQyxDQUFDLGVBQWUsVUFBVSxXQUFXLGNBQWMsZUFBZSxFQUFFO0FBQUEsWUFDbEUsS0FBSyxPQUFPLFNBQVM7QUFBQSxVQUN2QixJQUNJLEtBQUssT0FBTyxTQUFTLGNBQ3JCO0FBQUEsUUFDTixFQUNDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGNBQUksVUFBVSxVQUFVO0FBQ3RCLGlCQUFLLE9BQU8sU0FBUyxjQUFjO0FBQ25DLGtCQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGlCQUFLLFFBQVE7QUFBQSxVQUNmO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDTCxDQUFDLEVBQ0EsUUFBUSxDQUFDLFNBQVM7QUFDakIsY0FBTSxXQUFXLENBQUMsQ0FBQyxlQUFlLFVBQVUsV0FBVyxjQUFjLGVBQWUsRUFBRTtBQUFBLFVBQ3BGLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDdkI7QUFDQSxZQUFJLFVBQVU7QUFDWixlQUFLLGVBQWUsNEJBQTRCO0FBQ2hELGVBQUssZ0JBQWdCLE1BQU0sS0FBSyxPQUFPLFNBQVMsYUFBYSxDQUFDLFVBQVU7QUFDdEUsaUJBQUssT0FBTyxTQUFTLGNBQWM7QUFBQSxVQUNyQyxDQUFDO0FBQUEsUUFDSCxPQUFPO0FBQ0wsZUFBSyxRQUFRLE1BQU0sVUFBVTtBQUFBLFFBQy9CO0FBQUEsTUFDRixDQUFDO0FBRUgsVUFBSSx3QkFBUSxXQUFXLEVBRXBCLFFBQVEsaUJBQWlCLEVBQ3pCLFFBQVEsd0VBQXdFLEVBQ2hGO0FBQUEsUUFBUSxDQUFDLFNBQ1IsS0FBSztBQUFBLFVBQ0g7QUFBQSxVQUNBLEtBQUssT0FBTyxTQUFTO0FBQUEsVUFDckIsQ0FBQyxVQUFVO0FBQ1QsaUJBQUssT0FBTyxTQUFTLGdCQUFnQjtBQUFBLFVBQ3ZDO0FBQUEsVUFDQSxDQUFDLFVBQVU7QUFDVCxnQkFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLEdBQUc7QUFDMUIsa0JBQUksdUJBQU8saUNBQWlDO0FBQzVDLHFCQUFPO0FBQUEsWUFDVDtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDSixXQUFXLEtBQUssT0FBTyxTQUFTLGVBQWUsVUFBVTtBQUN2RCxZQUFNLGNBQWMsSUFBSSx3QkFBUSxXQUFXLEVBQ3hDLFFBQVEsZ0JBQWdCLEVBQ3hCLFFBQVEsS0FBSyxPQUFPLFNBQVMsZUFBZSx3QkFBd0IsZUFBZTtBQUV0RixVQUFJLEtBQUssT0FBTyxTQUFTLGNBQWM7QUFDckMsb0JBQVk7QUFBQSxVQUFVLENBQUMsV0FDckIsT0FDRyxjQUFjLFlBQVksRUFDMUIsV0FBVyxFQUNYLFFBQVEsWUFBWTtBQUNuQixpQkFBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxrQkFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixpQkFBSyxRQUFRO0FBQUEsVUFDZixDQUFDO0FBQUEsUUFDTDtBQUFBLE1BQ0YsT0FBTztBQUNMLG9CQUFZO0FBQUEsVUFBVSxDQUFDLFdBQ3JCLE9BQ0csY0FBYyxnQkFBZ0IsRUFDOUIsT0FBTyxFQUNQLFFBQVEsWUFBWTtBQUNuQixrQkFBTSxLQUFLLE9BQU8sWUFBWSxNQUFNLFFBQVE7QUFBQSxVQUM5QyxDQUFDO0FBQUEsUUFDTDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEIsUUFBUSxvQ0FBb0MsRUFDNUMsUUFBUSxDQUFDLFNBQVM7QUFDakIsYUFBSyxRQUFRLE9BQU87QUFDcEIsYUFBSyxlQUFlLHlCQUF5QjtBQUM3QyxhQUFLO0FBQUEsVUFDSDtBQUFBLFVBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxVQUNyQixDQUFDLFVBQVU7QUFDVCxpQkFBSyxPQUFPLFNBQVMsZUFBZTtBQUFBLFVBQ3RDO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUVILFVBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGNBQWMsRUFDdEIsUUFBUSw4Q0FBOEMsRUFDdEQsWUFBWSxDQUFDLGFBQWE7QUFDekIsaUJBQ0csV0FBVztBQUFBLFVBQ1Ysb0JBQW9CO0FBQUEsVUFDcEIsdUJBQXVCO0FBQUEsVUFDdkIsa0JBQWtCO0FBQUEsVUFDbEIsb0JBQW9CO0FBQUEsVUFDcEIsUUFBUTtBQUFBLFFBQ1YsQ0FBQyxFQUNBO0FBQUEsVUFDQyxDQUFDLG9CQUFvQix1QkFBdUIsa0JBQWtCLGtCQUFrQixFQUFFO0FBQUEsWUFDaEYsS0FBSyxPQUFPLFNBQVM7QUFBQSxVQUN2QixJQUNJLEtBQUssT0FBTyxTQUFTLGNBQ3JCO0FBQUEsUUFDTixFQUNDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGNBQUksVUFBVSxVQUFVO0FBQ3RCLGlCQUFLLE9BQU8sU0FBUyxjQUFjO0FBQ25DLGtCQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGlCQUFLLFFBQVE7QUFBQSxVQUNmO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDTCxDQUFDLEVBQ0EsUUFBUSxDQUFDLFNBQVM7QUFDakIsY0FBTSxXQUFXLENBQUMsQ0FBQyxvQkFBb0IsdUJBQXVCLGtCQUFrQixrQkFBa0IsRUFBRTtBQUFBLFVBQ2xHLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDdkI7QUFDQSxZQUFJLFVBQVU7QUFDWixlQUFLLGVBQWUsNEJBQTRCO0FBQ2hELGVBQUssZ0JBQWdCLE1BQU0sS0FBSyxPQUFPLFNBQVMsYUFBYSxDQUFDLFVBQVU7QUFDdEUsaUJBQUssT0FBTyxTQUFTLGNBQWM7QUFBQSxVQUNyQyxDQUFDO0FBQUEsUUFDSCxPQUFPO0FBQ0wsZUFBSyxRQUFRLE1BQU0sVUFBVTtBQUFBLFFBQy9CO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDTDtBQUVBLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRWxELFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHFCQUFxQixFQUM3QixRQUFRLDRFQUE0RSxFQUNwRjtBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sU0FBUyxLQUFLLE9BQU8sU0FBUyxpQkFBaUIsRUFBRSxTQUFTLE9BQU8sVUFBVTtBQUNoRixhQUFLLE9BQU8sU0FBUyxvQkFBb0I7QUFDekMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsbUJBQW1CLEVBQzNCLFFBQVEsbURBQW1ELEVBQzNEO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxTQUFTLEtBQUssT0FBTyxTQUFTLGVBQWUsRUFBRSxTQUFTLE9BQU8sVUFBVTtBQUM5RSxhQUFLLE9BQU8sU0FBUyxrQkFBa0I7QUFDdkMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBRUYsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUV6RCxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEsOERBQThELEVBQ3RFO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FBSztBQUFBLFFBQ0g7QUFBQSxRQUNBLE9BQU8sS0FBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQUEsUUFDL0MsQ0FBQyxVQUFVO0FBQ1QsZ0JBQU0sU0FBUyxPQUFPLFNBQVMsT0FBTyxFQUFFO0FBQ3hDLGVBQUssT0FBTyxTQUFTLHNCQUNuQixPQUFPLFNBQVMsTUFBTSxLQUFLLFNBQVMsSUFBSSxTQUFTO0FBQUEsUUFDckQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLG9CQUFvQixFQUM1QixRQUFRLHFEQUFxRCxFQUM3RDtBQUFBLE1BQVEsQ0FBQyxTQUNSLEtBQUs7QUFBQSxRQUNIO0FBQUEsUUFDQSxPQUFPLEtBQUssT0FBTyxTQUFTLGVBQWU7QUFBQSxRQUMzQyxDQUFDLFVBQVU7QUFDVCxnQkFBTSxTQUFTLE9BQU8sU0FBUyxPQUFPLEVBQUU7QUFDeEMsZUFBSyxPQUFPLFNBQVMsa0JBQ25CLE9BQU8sU0FBUyxNQUFNLEtBQUssVUFBVSxNQUFPLFNBQVM7QUFBQSxRQUN6RDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUYsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVyRCxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxtQkFBbUIsRUFDM0IsUUFBUSwyQ0FBMkMsRUFDbkQ7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLFNBQVMsS0FBSyxPQUFPLFNBQVMsZ0JBQWdCLEVBQUUsU0FBUyxPQUFPLFVBQVU7QUFDL0UsYUFBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQ3hDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0o7QUFBQSxFQUVRLGdCQUNOLE1BQ0EsT0FDQSxlQUNBLFVBQ2U7QUFDZixRQUFJLGVBQWU7QUFDbkIsUUFBSSxpQkFBaUI7QUFDckIsUUFBSSxXQUFXO0FBRWYsU0FBSyxTQUFTLEtBQUssRUFBRSxTQUFTLENBQUMsY0FBYztBQUMzQyxVQUFJLFlBQVksQ0FBQyxTQUFTLFNBQVMsR0FBRztBQUNwQztBQUFBLE1BQ0Y7QUFDQSxxQkFBZTtBQUNmLG9CQUFjLFNBQVM7QUFBQSxJQUN6QixDQUFDO0FBQ0QsU0FBSztBQUFBLE1BQ0gsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sQ0FBQyxlQUFlO0FBQ2QseUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxNQUNBLE1BQU07QUFBQSxNQUNOLENBQUMsV0FBVztBQUNWLG1CQUFXO0FBQUEsTUFDYjtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLGdCQUNOLE9BQ0EsaUJBQ0EsbUJBQ0EsbUJBQ0EsVUFDQSxXQUNBLFVBQ007QUFDTixVQUFNLGlCQUFpQixRQUFRLE1BQU07QUFDbkMsV0FBSyxLQUFLO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUNELFVBQU0saUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQzNDLFVBQ0UsTUFBTSxRQUFRLFdBQ2QsQ0FBQyxNQUFNLFdBQ1AsQ0FBQyxNQUFNLFdBQ1AsQ0FBQyxNQUFNLFVBQ1AsQ0FBQyxNQUFNLFVBQ1A7QUFDQSxjQUFNLGVBQWU7QUFDckIsY0FBTSxLQUFLO0FBQUEsTUFDYjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLE1BQWMsV0FDWixpQkFDQSxtQkFDQSxtQkFDQSxVQUNBLFdBQ0EsVUFDZTtBQUNmLFFBQUksU0FBUyxHQUFHO0FBQ2Q7QUFBQSxJQUNGO0FBRUEsVUFBTSxlQUFlLGdCQUFnQjtBQUNyQyxRQUFJLGlCQUFpQixrQkFBa0IsR0FBRztBQUN4QztBQUFBLElBQ0Y7QUFFQSxRQUFJLFlBQVksQ0FBQyxTQUFTLFlBQVksR0FBRztBQUN2QztBQUFBLElBQ0Y7QUFFQSxjQUFVLElBQUk7QUFDZCxRQUFJO0FBQ0YsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQix3QkFBa0IsWUFBWTtBQUFBLElBQ2hDLFVBQUU7QUFDQSxnQkFBVSxLQUFLO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBQ0Y7OztBQ2hnQkEsSUFBQUMsbUJBQXlDOzs7QUNHekMsZUFBc0IsMEJBQ3BCLGNBQ0EsT0FDQSxVQUNpQjtBQUNqQixRQUFNLFFBQWtCLENBQUM7QUFDekIsTUFBSSxRQUFRO0FBRVosYUFBVyxRQUFRLE9BQU87QUFDeEIsUUFBSTtBQUNGLFlBQU0sVUFBVSxNQUFNLGFBQWEsU0FBUyxLQUFLLElBQUk7QUFDckQsWUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixVQUFJLENBQUMsU0FBUztBQUNaO0FBQUEsTUFDRjtBQUVBLFlBQU0sUUFBUSxDQUFDLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxFQUFFLEtBQUssSUFBSTtBQUNyRCxVQUFJLFFBQVEsTUFBTSxTQUFTLFVBQVU7QUFDbkMsY0FBTSxZQUFZLEtBQUssSUFBSSxHQUFHLFdBQVcsS0FBSztBQUM5QyxZQUFJLFlBQVksR0FBRztBQUNqQixnQkFBTSxLQUFLLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQztBQUFBLFFBQ3RDO0FBQ0E7QUFBQSxNQUNGO0FBRUEsWUFBTSxLQUFLLEtBQUs7QUFDaEIsZUFBUyxNQUFNO0FBQUEsSUFDakIsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLEtBQUs7QUFBQSxJQUNyQjtBQUFBLEVBQ0Y7QUFFQSxTQUFPLE1BQU0sS0FBSyxNQUFNO0FBQzFCO0FBRU8sU0FBUyxRQUFRLE1BQXNCO0FBQzVDLFNBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxlQUFlLEdBQUcsRUFDMUIsUUFBUSxZQUFZLEVBQUUsRUFDdEIsTUFBTSxHQUFHLEVBQUUsS0FBSztBQUNyQjtBQUVPLFNBQVMsVUFBVSxNQUFzQjtBQUM5QyxRQUFNLFVBQVUsS0FBSyxLQUFLO0FBQzFCLE1BQUksUUFBUSxVQUFVLElBQUk7QUFDeEIsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPLEdBQUcsUUFBUSxNQUFNLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQztBQUMxQztBQUVPLFNBQVMsbUJBQW1CLE1BQXNCO0FBQ3ZELE1BQUksQ0FBQyxLQUFLLEtBQUssR0FBRztBQUNoQixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksS0FBSyxTQUFTLE1BQU0sR0FBRztBQUN6QixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksS0FBSyxTQUFTLElBQUksR0FBRztBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUNBLFNBQU87QUFDVDtBQUVPLFNBQVMsa0JBQWtCLFNBQXlCO0FBQ3pELFFBQU0sUUFBUSxRQUFRLEtBQUssRUFBRSxNQUFNLElBQUk7QUFDdkMsTUFBSSxDQUFDLE1BQU0sUUFBUTtBQUNqQixXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksQ0FBQyxRQUFRLEtBQUssTUFBTSxDQUFDLENBQUMsR0FBRztBQUMzQixXQUFPLFFBQVEsS0FBSztBQUFBLEVBQ3RCO0FBRUEsUUFBTSxZQUFZLE1BQU0sTUFBTSxDQUFDO0FBQy9CLFNBQU8sVUFBVSxTQUFTLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEdBQUc7QUFDbkQsY0FBVSxNQUFNO0FBQUEsRUFDbEI7QUFDQSxTQUFPLFVBQVUsS0FBSyxJQUFJLEVBQUUsS0FBSztBQUNuQzs7O0FDMUVPLFNBQVMsY0FBYyxNQUFjLFFBQXlCO0FBQ25FLFFBQU0sbUJBQW1CLE9BQU8sUUFBUSxRQUFRLEVBQUU7QUFDbEQsU0FBTyxTQUFTLG9CQUFvQixLQUFLLFdBQVcsR0FBRyxnQkFBZ0IsR0FBRztBQUM1RTs7O0FDWE8sU0FBUyxjQUFjLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ3ZELFNBQU8sR0FBRyxLQUFLLFlBQVksQ0FBQyxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQ25GO0FBRU8sU0FBUyxjQUFjLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ3ZELFNBQU8sR0FBRyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsSUFBSSxLQUFLLEtBQUssV0FBVyxDQUFDLENBQUM7QUFDNUQ7QUFFTyxTQUFTLGtCQUFrQixPQUFPLG9CQUFJLEtBQUssR0FBVztBQUMzRCxTQUFPLEdBQUcsY0FBYyxJQUFJLENBQUMsSUFBSSxjQUFjLElBQUksQ0FBQztBQUN0RDtBQUVPLFNBQVMsdUJBQXVCLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ2hFLFNBQU8sR0FBRyxjQUFjLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQztBQUNsRjtBQUVPLFNBQVMsbUJBQW1CLE1BQXNCO0FBQ3ZELFNBQU8sS0FBSyxRQUFRLFFBQVEsR0FBRyxFQUFFLEtBQUs7QUFDeEM7QUFFTyxTQUFTLG9CQUFvQixNQUFzQjtBQUN4RCxTQUFPLEtBQ0osTUFBTSxJQUFJLEVBQ1YsSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLFNBQVMsRUFBRSxDQUFDLEVBQ3ZDLEtBQUssSUFBSSxFQUNULEtBQUs7QUFDVjtBQUVPLFNBQVMscUJBQXFCLE1BQXNCO0FBQ3pELFNBQU8sS0FBSyxRQUFRLFNBQVMsRUFBRTtBQUNqQztBQUVPLFNBQVMsZUFBZSxjQUE0QjtBQUN6RCxRQUFNLFdBQVcsS0FBSyxJQUFJLEdBQUcsWUFBWTtBQUN6QyxRQUFNLFFBQVEsb0JBQUksS0FBSztBQUN2QixRQUFNLFNBQVMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUN6QixRQUFNLFFBQVEsTUFBTSxRQUFRLEtBQUssV0FBVyxFQUFFO0FBQzlDLFNBQU87QUFDVDtBQUVBLFNBQVMsS0FBSyxPQUF1QjtBQUNuQyxTQUFPLE9BQU8sS0FBSyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQ3RDOzs7QUh6Qk8sSUFBTSxpQkFBTixNQUFxQjtBQUFBLEVBQzFCLFlBQ21CLEtBQ0EsY0FDQSxrQkFDakI7QUFIaUI7QUFDQTtBQUNBO0FBQUEsRUFDaEI7QUFBQSxFQUVILE1BQU0sd0JBQW1EO0FBQ3ZELFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxvQkFBb0IsNkJBQVk7QUFDaEUsUUFBSSxFQUFDLDZCQUFNLE9BQU07QUFDZixZQUFNLElBQUksTUFBTSw0QkFBNEI7QUFBQSxJQUM5QztBQUVBLFVBQU0sT0FBTyxLQUFLLE9BQU8sU0FBUztBQUNsQyxRQUFJLENBQUMsS0FBSyxLQUFLLEdBQUc7QUFDaEIsWUFBTSxJQUFJLE1BQU0sdUJBQXVCO0FBQUEsSUFDekM7QUFFQSxXQUFPLEtBQUssYUFBYSxnQkFBZ0IsS0FBSyxLQUFLLE1BQU0sSUFBSTtBQUFBLEVBQy9EO0FBQUEsRUFFQSxNQUFNLHlCQUFvRDtBQUN4RCxVQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsb0JBQW9CLDZCQUFZO0FBQ2hFLFFBQUksRUFBQyw2QkFBTSxPQUFNO0FBQ2YsWUFBTSxJQUFJLE1BQU0sNEJBQTRCO0FBQUEsSUFDOUM7QUFFQSxVQUFNLE9BQU8sS0FBSyxPQUFPLGFBQWE7QUFDdEMsUUFBSSxDQUFDLEtBQUssS0FBSyxHQUFHO0FBQ2hCLFlBQU0sSUFBSSxNQUFNLHdCQUF3QjtBQUFBLElBQzFDO0FBRUEsV0FBTyxLQUFLLGFBQWEsaUJBQWlCLEtBQUssS0FBSyxNQUFNLElBQUk7QUFBQSxFQUNoRTtBQUFBLEVBRUEsTUFBTSx3QkFBbUQ7QUFDdkQsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sUUFBUSxNQUFNLEtBQUssMkJBQTJCLFNBQVMsbUJBQW1CO0FBQ2hGLFdBQU8sS0FBSyxzQkFBc0IsZ0JBQWdCLE9BQU8sSUFBSTtBQUFBLEVBQy9EO0FBQUEsRUFFQSxNQUFNLDBCQUFxRDtBQTFEN0Q7QUEyREksVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLG9CQUFvQiw2QkFBWTtBQUNoRSxRQUFJLEVBQUMsNkJBQU0sT0FBTTtBQUNmLFlBQU0sSUFBSSxNQUFNLDRCQUE0QjtBQUFBLElBQzlDO0FBRUEsVUFBTSxjQUFhLGdCQUFLLEtBQUssV0FBVixtQkFBa0IsU0FBbEIsWUFBMEI7QUFDN0MsVUFBTSxRQUFRLE1BQU0sS0FBSyxxQkFBcUIsVUFBVTtBQUN4RCxXQUFPLEtBQUssc0JBQXNCLGtCQUFrQixPQUFPLGNBQWMsSUFBSTtBQUFBLEVBQy9FO0FBQUEsRUFFQSxNQUFNLHdCQUF3QixPQUEyQztBQUN2RSxRQUFJLENBQUMsTUFBTSxRQUFRO0FBQ2pCLFlBQU0sSUFBSSxNQUFNLG1DQUFtQztBQUFBLElBQ3JEO0FBRUEsV0FBTyxLQUFLLHNCQUFzQixrQkFBa0IsT0FBTyxJQUFJO0FBQUEsRUFDakU7QUFBQSxFQUVBLE1BQU0sa0JBQTZDO0FBQ2pELFVBQU0sUUFBUSxNQUFNLEtBQUssMEJBQTBCO0FBQ25ELFdBQU8sS0FBSyxzQkFBc0IsZ0JBQWdCLE9BQU8sSUFBSTtBQUFBLEVBQy9EO0FBQUEsRUFFUSxhQUNOLGFBQ0EsWUFDQSxNQUNBLGFBQ2tCO0FBQ2xCLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFdBQVcsS0FBSyxJQUFJLEtBQU0sU0FBUyxlQUFlO0FBQ3hELFVBQU0sVUFBVSxLQUFLLEtBQUs7QUFDMUIsVUFBTSxpQkFBaUIsUUFBUTtBQUMvQixVQUFNLFlBQVksaUJBQWlCO0FBQ25DLFVBQU0sVUFBVSxZQUFZLFFBQVEsTUFBTSxHQUFHLFFBQVEsRUFBRSxRQUFRLElBQUk7QUFFbkUsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsTUFBTTtBQUFBLE1BQ047QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLHNCQUNaLGFBQ0EsT0FDQSxZQUMyQjtBQUMzQixRQUFJLENBQUMsTUFBTSxRQUFRO0FBQ2pCLFlBQU0sSUFBSSxNQUFNLCtCQUErQixZQUFZLFlBQVksQ0FBQyxFQUFFO0FBQUEsSUFDNUU7QUFFQSxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxPQUFPLE1BQU07QUFBQSxNQUNqQixLQUFLO0FBQUEsTUFDTDtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1g7QUFFQSxRQUFJLENBQUMsS0FBSyxLQUFLLEdBQUc7QUFDaEIsWUFBTSxJQUFJLE1BQU0sK0JBQStCLFlBQVksWUFBWSxDQUFDLEVBQUU7QUFBQSxJQUM1RTtBQUVBLFdBQU8sS0FBSyxhQUFhLGFBQWEsWUFBWSxNQUFNLE1BQU0sSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUM7QUFBQSxFQUN4RjtBQUFBLEVBRUEsTUFBYywyQkFBMkIsY0FBd0M7QUFDL0UsVUFBTSxTQUFTLGVBQWUsWUFBWSxFQUFFLFFBQVE7QUFDcEQsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sUUFBUSxNQUFNLEtBQUssYUFBYSxrQkFBa0I7QUFDeEQsV0FBTyxNQUNKLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxLQUFLLE1BQU0sU0FBUyxlQUFlLENBQUMsRUFDcEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxTQUFTLGFBQWEsQ0FBQyxFQUNsRSxPQUFPLENBQUMsU0FBUyxLQUFLLEtBQUssU0FBUyxNQUFNLEVBQzFDLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFBQSxFQUM3RDtBQUFBLEVBRUEsTUFBYyw0QkFBOEM7QUFDMUQsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sUUFBUSxNQUFNLEtBQUssYUFBYSxrQkFBa0I7QUFDeEQsV0FBTyxNQUNKLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxLQUFLLE1BQU0sU0FBUyxlQUFlLENBQUMsRUFDcEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxTQUFTLGFBQWEsQ0FBQyxFQUNsRSxLQUFLLENBQUMsTUFBTSxVQUFVLE1BQU0sS0FBSyxRQUFRLEtBQUssS0FBSyxLQUFLO0FBQUEsRUFDN0Q7QUFBQSxFQUVBLE1BQWMscUJBQXFCLFlBQXNDO0FBQ3ZFLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFFBQVEsTUFBTSxLQUFLLGFBQWEsa0JBQWtCO0FBQ3hELFdBQU8sTUFDSixPQUFPLENBQUMsU0FBUyxDQUFDLGNBQWMsS0FBSyxNQUFNLFNBQVMsZUFBZSxDQUFDLEVBQ3BFLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxLQUFLLE1BQU0sU0FBUyxhQUFhLENBQUMsRUFDbEU7QUFBQSxNQUFPLENBQUMsU0FDUCxhQUFhLGNBQWMsS0FBSyxNQUFNLFVBQVUsSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEdBQUc7QUFBQSxJQUM3RSxFQUNDLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFBQSxFQUM3RDtBQUNGOzs7QUk5SE8sSUFBTSxlQUFOLE1BQW1CO0FBQUEsRUFNeEIsWUFDbUIsY0FDQSxrQkFDakI7QUFGaUI7QUFDQTtBQVBuQixTQUFRLHVCQUdHO0FBQUEsRUFLUjtBQUFBLEVBRUgsTUFBTSxpQkFBaUIsUUFBUSxJQUFJLGtCQUFrQixPQUE4QjtBQUNqRixVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxVQUFVLE1BQU0sS0FBSyxhQUFhLFNBQVMsU0FBUyxTQUFTO0FBQ25FLFVBQU0sVUFBVSxrQkFBa0IsT0FBTztBQUN6QyxVQUFNLFdBQVcsa0JBQWtCLFVBQVUsUUFBUSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sUUFBUTtBQUN0RixXQUFPLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRO0FBQUEsRUFDeEM7QUFBQSxFQUVBLE1BQU0scUJBQXNDO0FBQzFDLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLEVBQUUsTUFBTSxPQUFPLE9BQU8sSUFBSSxNQUFNLEtBQUssYUFBYSxrQkFBa0IsU0FBUyxTQUFTO0FBQzVGLFFBQUksQ0FBQyxRQUFRO0FBQ1gsV0FBSyx1QkFBdUI7QUFBQSxRQUMxQixPQUFPO0FBQUEsUUFDUCxPQUFPO0FBQUEsTUFDVDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBRUEsUUFBSSxLQUFLLHdCQUF3QixLQUFLLHFCQUFxQixVQUFVLE9BQU87QUFDMUUsYUFBTyxLQUFLLHFCQUFxQjtBQUFBLElBQ25DO0FBRUEsVUFBTSxRQUFRLGtCQUFrQixJQUFJLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLFFBQVEsRUFBRTtBQUN6RSxTQUFLLHVCQUF1QjtBQUFBLE1BQzFCO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxrQkFBa0IsT0FBMkIsUUFBa0M7QUE1RXZGO0FBNkVJLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFVBQVUsTUFBTSxLQUFLLGFBQWEsU0FBUyxTQUFTLFNBQVM7QUFDbkUsVUFBTSxpQkFBaUIsa0JBQWtCLE9BQU87QUFDaEQsVUFBTSxnQkFDSixnQ0FBZTtBQUFBLE1BQ2IsQ0FBQyxjQUNDLENBQUMsVUFBVSxZQUNYLFVBQVUsY0FBYyxNQUFNLGFBQzlCLFVBQVUsbUJBQW1CLE1BQU07QUFBQSxJQUN2QyxNQUxBLFlBTUEsZUFBZSxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVUsWUFBWSxVQUFVLFFBQVEsTUFBTSxHQUFHLE1BTnJGLFlBT0EsZUFBZTtBQUFBLE1BQ2IsQ0FBQyxjQUNDLENBQUMsVUFBVSxZQUNYLFVBQVUsWUFBWSxNQUFNLFdBQzVCLFVBQVUsU0FBUyxNQUFNLFFBQ3pCLFVBQVUsWUFBWSxNQUFNO0FBQUEsSUFDaEMsTUFiQSxZQWNBLGVBQWU7QUFBQSxNQUNiLENBQUMsY0FDQyxDQUFDLFVBQVUsWUFDWCxVQUFVLFlBQVksTUFBTSxXQUM1QixVQUFVLGNBQWMsTUFBTTtBQUFBLElBQ2xDO0FBRUYsUUFBSSxDQUFDLGNBQWM7QUFDakIsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFVBQVUsbUJBQW1CLFNBQVMsY0FBYyxNQUFNO0FBQ2hFLFFBQUksWUFBWSxTQUFTO0FBQ3ZCLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxLQUFLLGFBQWEsWUFBWSxTQUFTLFdBQVcsT0FBTztBQUMvRCxTQUFLLHVCQUF1QjtBQUM1QixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxZQUFZLE9BQTZDO0FBbkhqRTtBQW9ISSxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxVQUFVLE1BQU0sS0FBSyxhQUFhLFNBQVMsU0FBUyxTQUFTO0FBQ25FLFVBQU0saUJBQWlCLGtCQUFrQixPQUFPO0FBQ2hELFVBQU0sZ0JBQ0osMEJBQWU7QUFBQSxNQUNiLENBQUMsY0FDQyxVQUFVLFlBQ1YsVUFBVSxjQUFjLE1BQU0sYUFDOUIsVUFBVSxtQkFBbUIsTUFBTTtBQUFBLElBQ3ZDLE1BTEEsWUFNQSxpQ0FBaUMsZ0JBQWdCLE1BQU0sU0FBUyxNQU5oRSxZQU9BLGVBQWU7QUFBQSxNQUNiLENBQUMsY0FDQyxVQUFVLFlBQ1YsVUFBVSxZQUFZLE1BQU0sV0FDNUIsVUFBVSxTQUFTLE1BQU0sUUFDekIsVUFBVSxZQUFZLE1BQU07QUFBQSxJQUNoQztBQUVGLFFBQUksQ0FBQyxjQUFjO0FBQ2pCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxVQUFVLG1CQUFtQixTQUFTLFlBQVk7QUFDeEQsUUFBSSxZQUFZLFNBQVM7QUFDdkIsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLEtBQUssYUFBYSxZQUFZLFNBQVMsV0FBVyxPQUFPO0FBQy9ELFNBQUssdUJBQXVCO0FBQzVCLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFTyxTQUFTLGtCQUFrQixTQUErQjtBQXJKakU7QUFzSkUsUUFBTSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQ2hDLFFBQU0sVUFBd0IsQ0FBQztBQUMvQixNQUFJLGlCQUFpQjtBQUNyQixNQUFJLG1CQUE2QixDQUFDO0FBQ2xDLE1BQUksbUJBQW1CO0FBQ3ZCLE1BQUksa0JBQWtCO0FBQ3RCLE1BQUksc0JBQXFDO0FBQ3pDLE1BQUksb0JBQW1DO0FBQ3ZDLFFBQU0sa0JBQWtCLG9CQUFJLElBQW9CO0FBRWhELFFBQU0sWUFBWSxDQUFDLFlBQTBCO0FBaEsvQyxRQUFBQztBQWlLSSxRQUFJLENBQUMsZ0JBQWdCO0FBQ25CLHlCQUFtQixDQUFDO0FBQ3BCO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxpQkFBaUIsS0FBSyxJQUFJLEVBQUUsS0FBSztBQUM5QyxVQUFNLFVBQVUsYUFBYSxJQUFJO0FBQ2pDLFVBQU0sTUFBTSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixFQUFFLEtBQUssSUFBSSxFQUFFLFFBQVE7QUFDckUsVUFBTSxZQUFZLG9CQUFvQixnQkFBZ0IsZ0JBQWdCO0FBQ3RFLFVBQU0sa0JBQWlCQSxNQUFBLGdCQUFnQixJQUFJLFNBQVMsTUFBN0IsT0FBQUEsTUFBa0M7QUFDekQsb0JBQWdCLElBQUksV0FBVyxpQkFBaUIsQ0FBQztBQUNqRCxZQUFRLEtBQUs7QUFBQSxNQUNYLFNBQVMsZUFBZSxRQUFRLFVBQVUsRUFBRSxFQUFFLEtBQUs7QUFBQSxNQUNuRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLFFBQVE7QUFBQSxNQUNmO0FBQUEsTUFDQTtBQUFBLE1BQ0EsV0FBVztBQUFBLE1BQ1g7QUFBQSxNQUNBLFVBQVU7QUFBQSxNQUNWLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFDRCx1QkFBbUIsQ0FBQztBQUNwQix1QkFBbUI7QUFDbkIsc0JBQWtCO0FBQ2xCLDBCQUFzQjtBQUN0Qix3QkFBb0I7QUFBQSxFQUN0QjtBQUVBLFdBQVMsUUFBUSxHQUFHLFFBQVEsTUFBTSxRQUFRLFNBQVMsR0FBRztBQUNwRCxVQUFNLE9BQU8sTUFBTSxLQUFLO0FBQ3hCLFVBQU0sZUFBZSxLQUFLLE1BQU0sYUFBYTtBQUM3QyxRQUFJLGNBQWM7QUFDaEIsZ0JBQVUsS0FBSztBQUNmLHVCQUFpQjtBQUNqQix5QkFBbUI7QUFDbkI7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLGdCQUFnQjtBQUNuQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGNBQWMsS0FBSyxNQUFNLHlEQUF5RDtBQUN4RixRQUFJLGFBQWE7QUFDZix3QkFBa0I7QUFDbEIsNEJBQXNCLFlBQVksQ0FBQyxFQUFFLFlBQVk7QUFDakQsMkJBQW9CLGlCQUFZLENBQUMsTUFBYixZQUFrQjtBQUN0QztBQUFBLElBQ0Y7QUFFQSxxQkFBaUIsS0FBSyxJQUFJO0FBQUEsRUFDNUI7QUFFQSxZQUFVLE1BQU0sTUFBTTtBQUN0QixTQUFPO0FBQ1Q7QUFFQSxTQUFTLG1CQUFtQixTQUFpQixPQUFtQixRQUF3QjtBQUN0RixRQUFNLFFBQVEsUUFBUSxNQUFNLElBQUk7QUFDaEMsTUFBSSxNQUFNLFlBQVksS0FBSyxNQUFNLFVBQVUsTUFBTSxhQUFhLE1BQU0sVUFBVSxNQUFNLFFBQVE7QUFDMUYsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLFlBQVksa0JBQWtCLG9CQUFJLEtBQUssQ0FBQztBQUM5QyxRQUFNLFNBQVMsd0JBQXdCLE1BQU0sSUFBSSxTQUFTO0FBQzFELFFBQU0sYUFBYSxNQUFNLE1BQU0sTUFBTSxXQUFXLE1BQU0sT0FBTztBQUM3RCxRQUFNLG9CQUFvQjtBQUFBLElBQ3hCLFdBQVcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLE1BQU0sMEJBQTBCLENBQUM7QUFBQSxFQUNyRTtBQUNBLG9CQUFrQixLQUFLLFFBQVEsRUFBRTtBQUVqQyxRQUFNLGVBQWU7QUFBQSxJQUNuQixHQUFHLE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUztBQUFBLElBQ2pDLEdBQUc7QUFBQSxJQUNILEdBQUcsTUFBTSxNQUFNLE1BQU0sT0FBTztBQUFBLEVBQzlCO0FBRUEsU0FBTyx1QkFBdUIsWUFBWSxFQUFFLEtBQUssSUFBSTtBQUN2RDtBQUVBLFNBQVMsbUJBQW1CLFNBQWlCLE9BQTJCO0FBQ3RFLFFBQU0sUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNoQyxNQUFJLE1BQU0sWUFBWSxLQUFLLE1BQU0sVUFBVSxNQUFNLGFBQWEsTUFBTSxVQUFVLE1BQU0sUUFBUTtBQUMxRixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sYUFBYSxNQUFNLE1BQU0sTUFBTSxXQUFXLE1BQU0sT0FBTztBQUM3RCxRQUFNLG9CQUFvQjtBQUFBLElBQ3hCLFdBQVcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLE1BQU0sMEJBQTBCLENBQUM7QUFBQSxFQUNyRTtBQUVBLFFBQU0sZUFBZTtBQUFBLElBQ25CLEdBQUcsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTO0FBQUEsSUFDakMsR0FBRztBQUFBLElBQ0gsR0FBRyxNQUFNLE1BQU0sTUFBTSxPQUFPO0FBQUEsRUFDOUI7QUFFQSxTQUFPLHVCQUF1QixZQUFZLEVBQUUsS0FBSyxJQUFJO0FBQ3ZEO0FBRUEsU0FBUyxhQUFhLE1BQXNCO0FBelE1QztBQTBRRSxRQUFNLFFBQVEsS0FDWCxNQUFNLElBQUksRUFDVixJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxFQUN6QixPQUFPLE9BQU87QUFDakIsVUFBTyxXQUFNLENBQUMsTUFBUCxZQUFZO0FBQ3JCO0FBRUEsU0FBUyxvQkFBb0IsU0FBaUIsV0FBNkI7QUFDekUsU0FBTyxDQUFDLFFBQVEsS0FBSyxHQUFHLEdBQUcsVUFBVSxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJO0FBQzVFO0FBRUEsU0FBUyx1QkFBdUIsT0FBMkI7QUFDekQsUUFBTSxRQUFRLENBQUMsR0FBRyxLQUFLO0FBQ3ZCLFNBQU8sTUFBTSxTQUFTLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQyxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQ2hFLFVBQU0sSUFBSTtBQUFBLEVBQ1o7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGlDQUNQLFNBQ0EsV0FDbUI7QUFDbkIsUUFBTSxrQkFBa0IsUUFBUTtBQUFBLElBQzlCLENBQUMsVUFBVSxNQUFNLFlBQVksTUFBTSxjQUFjO0FBQUEsRUFDbkQ7QUFDQSxNQUFJLGdCQUFnQixXQUFXLEdBQUc7QUFDaEMsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPLGdCQUFnQixDQUFDO0FBQzFCOzs7QUNuU08sSUFBTSxpQkFBTixNQUFxQjtBQUFBLEVBQzFCLFlBQ21CLGNBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsZUFBZSxPQUFPLG9CQUFJLEtBQUssR0FBVztBQUN4QyxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxVQUFVLGNBQWMsSUFBSTtBQUNsQyxXQUFPLEdBQUcsU0FBUyxhQUFhLElBQUksT0FBTztBQUFBLEVBQzdDO0FBQUEsRUFFQSxNQUFNLGtCQUFrQixPQUFPLG9CQUFJLEtBQUssR0FBbUI7QUFDekQsVUFBTSxVQUFVLGNBQWMsSUFBSTtBQUNsQyxVQUFNLE9BQU8sS0FBSyxlQUFlLElBQUk7QUFDckMsV0FBTyxLQUFLLGFBQWEsb0JBQW9CLE1BQU0sT0FBTztBQUFBLEVBQzVEO0FBQUEsRUFFQSxNQUFNLFlBQVksTUFBYyxPQUFPLG9CQUFJLEtBQUssR0FBOEI7QUFDNUUsVUFBTSxVQUFVLG9CQUFvQixJQUFJO0FBQ3hDLFFBQUksQ0FBQyxTQUFTO0FBQ1osWUFBTSxJQUFJLE1BQU0sOEJBQThCO0FBQUEsSUFDaEQ7QUFFQSxVQUFNLE9BQU8sTUFBTSxLQUFLLGtCQUFrQixJQUFJO0FBQzlDLFVBQU0sT0FBTyxLQUFLO0FBRWxCLFVBQU0sUUFBUSxNQUFNLGNBQWMsSUFBSSxDQUFDO0FBQUEsRUFBSyxPQUFPO0FBQ25ELFVBQU0sS0FBSyxhQUFhLFdBQVcsTUFBTSxLQUFLO0FBQzlDLFdBQU8sRUFBRSxLQUFLO0FBQUEsRUFDaEI7QUFDRjs7O0FDMUJPLElBQU0sY0FBTixNQUFrQjtBQUFBLEVBQ3ZCLFlBQ21CLGNBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsTUFBTSxXQUFXLE1BQXlDO0FBQ3hELFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFVBQVUsbUJBQW1CLElBQUk7QUFDdkMsUUFBSSxDQUFDLFNBQVM7QUFDWixZQUFNLElBQUksTUFBTSwyQkFBMkI7QUFBQSxJQUM3QztBQUVBLFVBQU0sUUFBUSxNQUFNLGtCQUFrQixvQkFBSSxLQUFLLENBQUMsQ0FBQztBQUFBLElBQU8sT0FBTztBQUMvRCxVQUFNLEtBQUssYUFBYSxXQUFXLFNBQVMsV0FBVyxLQUFLO0FBQzVELFdBQU8sRUFBRSxNQUFNLFNBQVMsVUFBVTtBQUFBLEVBQ3BDO0FBQUEsRUFFQSxNQUFNLG9CQUNKLE9BQ0EsTUFDQSxhQUNBLFlBQ0EsYUFDZ0I7QUFDaEIsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sZUFBZSxVQUFVLEtBQUs7QUFDcEMsVUFBTSxXQUFXLEdBQUcsdUJBQXVCLEdBQUcsQ0FBQyxJQUFJLFFBQVEsWUFBWSxDQUFDO0FBQ3hFLFVBQU0sT0FBTyxNQUFNLEtBQUssYUFBYTtBQUFBLE1BQ25DLEdBQUcsU0FBUyxXQUFXLElBQUksUUFBUTtBQUFBLElBQ3JDO0FBQ0EsVUFBTSxhQUFhLGVBQWUsWUFBWSxTQUFTLElBQ25ELEdBQUcsV0FBVyxXQUFNLFlBQVksTUFBTSxJQUFJLFlBQVksV0FBVyxJQUFJLFNBQVMsT0FBTyxLQUNyRixhQUNFLEdBQUcsV0FBVyxXQUFNLFVBQVUsS0FDOUI7QUFDTixVQUFNLGtCQUFrQixlQUFlLFlBQVksU0FBUyxJQUN4RDtBQUFBLE1BQ0U7QUFBQSxNQUNBLEdBQUcsWUFBWSxNQUFNLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxFQUFFO0FBQUEsTUFDekQsR0FBSSxZQUFZLFNBQVMsS0FDckIsQ0FBQyxZQUFZLFlBQVksU0FBUyxFQUFFLE9BQU8sSUFDM0MsQ0FBQztBQUFBLElBQ1AsSUFDQSxDQUFDO0FBQ0wsVUFBTSxVQUFVO0FBQUEsTUFDZCxLQUFLLFlBQVk7QUFBQSxNQUNqQjtBQUFBLE1BQ0EsWUFBWSxrQkFBa0IsR0FBRyxDQUFDO0FBQUEsTUFDbEMsV0FBVyxVQUFVO0FBQUEsTUFDckIsR0FBRztBQUFBLE1BQ0g7QUFBQSxNQUNBLG1CQUFtQixJQUFJLElBQUksS0FBSyxLQUFLLElBQUk7QUFBQSxNQUN6QztBQUFBLElBQ0YsRUFBRSxLQUFLLElBQUk7QUFFWCxXQUFPLE1BQU0sS0FBSyxhQUFhLFlBQVksTUFBTSxPQUFPO0FBQUEsRUFDMUQ7QUFDRjs7O0FDdERPLElBQU0sbUJBQU4sTUFBdUI7QUFBQSxFQWM1QixZQUNtQixjQUNBLGtCQUNqQjtBQUZpQjtBQUNBO0FBZm5CLFNBQWlCLHdCQUF3QixvQkFBSSxJQUcxQztBQUNILFNBQVEsc0JBR0c7QUFDWCxTQUFRLHdCQUdHO0FBQUEsRUFLUjtBQUFBLEVBRUgsTUFBTSxnQkFBZ0IsT0FBMkIsUUFBMkM7QUFDMUYsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sVUFBVSxjQUFjLEdBQUc7QUFDakMsVUFBTSxPQUFPLEdBQUcsU0FBUyxhQUFhLElBQUksT0FBTztBQUNqRCxVQUFNLFVBQVU7QUFBQSxNQUNkLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQztBQUFBLE1BQzVCLGFBQWEsTUFBTTtBQUFBLE1BQ25CLFlBQVksTUFBTSxPQUFPO0FBQUEsTUFDekIsY0FBYyxNQUFNLFdBQVcsTUFBTSxRQUFRLFNBQVM7QUFBQSxNQUN0RCxnQkFBZ0Isc0JBQXNCLE1BQU0sU0FBUyxDQUFDO0FBQUEsTUFDdEQsc0JBQXNCLE1BQU0sY0FBYztBQUFBLE1BQzFDO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUVYLFVBQU0sS0FBSyxhQUFhLFdBQVcsTUFBTSxPQUFPO0FBQ2hELFNBQUssc0JBQXNCLE1BQU07QUFDakMsU0FBSyxzQkFBc0I7QUFDM0IsU0FBSyx3QkFBd0I7QUFDN0IsV0FBTyxFQUFFLEtBQUs7QUFBQSxFQUNoQjtBQUFBLEVBRUEsTUFBTSxrQkFBa0IsT0FBa0M7QUF4RDVEO0FBeURJLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUV2QyxRQUFJLENBQUMsS0FBSyxxQkFBcUI7QUFDN0IsWUFBTSxXQUFXLE1BQU0sS0FBSyxhQUFhLGtCQUFrQjtBQUMzRCxZQUFNLFdBQVcsU0FDZCxPQUFPLENBQUMsU0FBUyxjQUFjLEtBQUssTUFBTSxTQUFTLGFBQWEsQ0FBQyxFQUNqRSxLQUFLLENBQUMsTUFBTSxVQUFVLE1BQU0sS0FBSyxRQUFRLEtBQUssS0FBSyxLQUFLO0FBQzNELFdBQUssc0JBQXNCO0FBQUEsUUFDekIsUUFBTyxvQkFBUyxDQUFDLE1BQVYsbUJBQWEsS0FBSyxVQUFsQixZQUEyQjtBQUFBLFFBQ2xDLE9BQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUVBLFdBQU8sT0FBTyxVQUFVLFdBQ3BCLEtBQUssb0JBQW9CLE1BQU0sTUFBTSxHQUFHLEtBQUssSUFDN0MsS0FBSyxvQkFBb0I7QUFBQSxFQUMvQjtBQUFBLEVBRUEsTUFBTSxpQkFBaUIsT0FBMkM7QUFDaEUsVUFBTSxPQUFPLE1BQU0sS0FBSyxrQkFBa0IsS0FBSztBQUMvQyxVQUFNLFVBQTRCLENBQUM7QUFFbkMsZUFBVyxRQUFRLE1BQU07QUFDdkIsWUFBTSxVQUFVLE1BQU0sS0FBSyxhQUFhLFNBQVMsS0FBSyxJQUFJO0FBQzFELFlBQU0sU0FBUyxzQkFBc0IsU0FBUyxLQUFLLE1BQU0sS0FBSyxLQUFLLEtBQUs7QUFDeEUsY0FBUSxLQUFLLEdBQUcsT0FBTyxRQUFRLENBQUM7QUFDaEMsVUFBSSxPQUFPLFVBQVUsWUFBWSxRQUFRLFVBQVUsT0FBTztBQUN4RDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsV0FBTyxPQUFPLFVBQVUsV0FBVyxRQUFRLE1BQU0sR0FBRyxLQUFLLElBQUk7QUFBQSxFQUMvRDtBQUFBLEVBRUEsTUFBTSxzQkFBdUM7QUEzRi9DO0FBNEZJLFVBQU0sT0FBTyxNQUFNLEtBQUssa0JBQWtCO0FBQzFDLFFBQUksS0FBSyxXQUFXLEdBQUc7QUFDckIsV0FBSyx3QkFBd0IsRUFBRSxjQUFjLEdBQUcsT0FBTyxFQUFFO0FBQ3pELGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxlQUFlLEtBQUssQ0FBQyxFQUFFLEtBQUs7QUFDbEMsVUFBSSxVQUFLLDBCQUFMLG1CQUE0QixrQkFBaUIsY0FBYztBQUM3RCxhQUFPLEtBQUssc0JBQXNCO0FBQUEsSUFDcEM7QUFFQSxVQUFNLFlBQVksb0JBQUksSUFBWTtBQUNsQyxRQUFJLFFBQVE7QUFFWixVQUFNLGdCQUFnQixLQUFLLE9BQU8sQ0FBQyxTQUFTO0FBQzFDLFlBQU0sU0FBUyxLQUFLLHNCQUFzQixJQUFJLEtBQUssSUFBSTtBQUN2RCxhQUFPLEVBQUUsVUFBVSxPQUFPLFVBQVUsS0FBSyxLQUFLO0FBQUEsSUFDaEQsQ0FBQztBQUVELFVBQU0sY0FBYyxLQUFLLE9BQU8sQ0FBQyxTQUFTO0FBQ3hDLFlBQU0sU0FBUyxLQUFLLHNCQUFzQixJQUFJLEtBQUssSUFBSTtBQUN2RCxhQUFPLFVBQVUsT0FBTyxVQUFVLEtBQUssS0FBSztBQUFBLElBQzlDLENBQUM7QUFFRCxlQUFXLFFBQVEsYUFBYTtBQUM5QixnQkFBVSxJQUFJLEtBQUssSUFBSTtBQUN2QixlQUFTLEtBQUssc0JBQXNCLElBQUksS0FBSyxJQUFJLEVBQUc7QUFBQSxJQUN0RDtBQUVBLFFBQUksY0FBYyxTQUFTLEdBQUc7QUFDNUIsWUFBTSxVQUFVLE1BQU0sUUFBUTtBQUFBLFFBQzVCLGNBQWMsSUFBSSxPQUFPLFNBQVM7QUFDaEMsZ0JBQU0sVUFBVSxNQUFNLEtBQUssYUFBYSxTQUFTLEtBQUssSUFBSTtBQUMxRCxnQkFBTSxRQUFRLHNCQUFzQixTQUFTLEtBQUssTUFBTSxLQUFLLEtBQUssS0FBSyxFQUFFO0FBQ3pFLGVBQUssc0JBQXNCLElBQUksS0FBSyxNQUFNO0FBQUEsWUFDeEMsT0FBTyxLQUFLLEtBQUs7QUFBQSxZQUNqQjtBQUFBLFVBQ0YsQ0FBQztBQUNELGlCQUFPLEVBQUUsTUFBTSxNQUFNO0FBQUEsUUFDdkIsQ0FBQztBQUFBLE1BQ0g7QUFFQSxpQkFBVyxFQUFFLE1BQU0sTUFBTSxLQUFLLFNBQVM7QUFDckMsa0JBQVUsSUFBSSxLQUFLLElBQUk7QUFDdkIsaUJBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUVBLGVBQVcsUUFBUSxLQUFLLHNCQUFzQixLQUFLLEdBQUc7QUFDcEQsVUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLEdBQUc7QUFDeEIsYUFBSyxzQkFBc0IsT0FBTyxJQUFJO0FBQUEsTUFDeEM7QUFBQSxJQUNGO0FBRUEsU0FBSyx3QkFBd0IsRUFBRSxjQUFjLE1BQU07QUFDbkQsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVPLFNBQVMsc0JBQ2QsU0FDQSxZQUNBLFdBQ2tCO0FBQ2xCLFFBQU0sUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNoQyxRQUFNLFVBQTRCLENBQUM7QUFDbkMsTUFBSSxtQkFBbUI7QUFDdkIsTUFBSSxnQkFBZ0I7QUFDcEIsTUFBSSxpQkFBaUI7QUFDckIsTUFBSSxpQkFBaUI7QUFDckIsTUFBSSxtQkFBbUI7QUFDdkIsTUFBSSx3QkFBd0I7QUFDNUIsTUFBSSxvQkFBb0I7QUFFeEIsUUFBTSxZQUFZLE1BQVk7QUFDNUIsUUFBSSxDQUFDLGtCQUFrQjtBQUNyQjtBQUFBLElBQ0Y7QUFFQSxZQUFRLEtBQUs7QUFBQSxNQUNYLFFBQVEsaUJBQWlCO0FBQUEsTUFDekIsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsTUFBTTtBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1gsZ0JBQWdCO0FBQUEsTUFDaEIsV0FBVztBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsTUFDQSxZQUFZO0FBQUEsSUFDZCxDQUFDO0FBQ0QsdUJBQW1CO0FBQ25CLG9CQUFnQjtBQUNoQixxQkFBaUI7QUFDakIscUJBQWlCO0FBQ2pCLHVCQUFtQjtBQUNuQiw0QkFBd0I7QUFDeEIseUJBQXFCO0FBQUEsRUFDdkI7QUFFQSxhQUFXLFFBQVEsT0FBTztBQUN4QixVQUFNLGVBQWUsS0FBSyxNQUFNLGFBQWE7QUFDN0MsUUFBSSxjQUFjO0FBQ2hCLGdCQUFVO0FBQ1YseUJBQW1CLGFBQWEsQ0FBQyxFQUFFLEtBQUs7QUFDeEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxjQUFjLEtBQUssTUFBTSx1QkFBdUI7QUFDdEQsUUFBSSxhQUFhO0FBQ2Ysc0JBQWdCLFlBQVksQ0FBQyxFQUFFLEtBQUs7QUFDcEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxhQUFhLEtBQUssTUFBTSxzQkFBc0I7QUFDcEQsUUFBSSxZQUFZO0FBQ2QsdUJBQWlCLFdBQVcsQ0FBQyxFQUFFLEtBQUs7QUFDcEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxlQUFlLEtBQUssTUFBTSx3QkFBd0I7QUFDeEQsUUFBSSxjQUFjO0FBQ2hCLHVCQUFpQixhQUFhLENBQUMsRUFBRSxLQUFLO0FBQ3RDO0FBQUEsSUFDRjtBQUVBLFVBQU0saUJBQWlCLEtBQUssTUFBTSwwQkFBMEI7QUFDNUQsUUFBSSxnQkFBZ0I7QUFDbEIseUJBQW1CLHNCQUFzQixlQUFlLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDakU7QUFBQSxJQUNGO0FBRUEsVUFBTSxzQkFBc0IsS0FBSyxNQUFNLGdDQUFnQztBQUN2RSxRQUFJLHFCQUFxQjtBQUN2QixZQUFNLFNBQVMsT0FBTyxTQUFTLG9CQUFvQixDQUFDLEdBQUcsRUFBRTtBQUN6RCw4QkFBd0IsT0FBTyxTQUFTLE1BQU0sSUFBSSxTQUFTO0FBQUEsSUFDN0Q7QUFBQSxFQUNGO0FBRUEsWUFBVTtBQUNWLFNBQU87QUFDVDtBQUVBLFNBQVMsc0JBQXNCLFdBQTJCO0FBQ3hELFNBQU8sbUJBQW1CLFNBQVM7QUFDckM7QUFFQSxTQUFTLHNCQUFzQixXQUEyQjtBQUN4RCxNQUFJO0FBQ0YsV0FBTyxtQkFBbUIsU0FBUztBQUFBLEVBQ3JDLFNBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGOzs7QUM1T08sSUFBTSxnQkFBTixNQUFvQjtBQUFBLEVBQ3pCLFlBQ21CLGNBQ0EsY0FDQSxhQUNBLGdCQUNBLGtCQUNBLGtCQUNqQjtBQU5pQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsTUFBTSxzQkFBc0IsUUFBUSxJQUEyQjtBQUM3RCxXQUFPLEtBQUssYUFBYSxpQkFBaUIsS0FBSztBQUFBLEVBQ2pEO0FBQUEsRUFFQSxNQUFNLGNBQWMsT0FBb0M7QUFDdEQsVUFBTSxPQUFPLE1BQU0sUUFBUSxNQUFNLFdBQVcsTUFBTTtBQUNsRCxVQUFNLFFBQVEsTUFBTSxLQUFLLFlBQVksV0FBVyxJQUFJO0FBQ3BELFVBQU0sS0FBSywwQkFBMEIsT0FBTyxNQUFNO0FBQ2xELFVBQU0sZ0JBQWdCLE1BQU0sS0FBSyxrQkFBa0IsT0FBTyxNQUFNO0FBQ2hFLFdBQU8sS0FBSztBQUFBLE1BQ1YsbUNBQW1DLE1BQU0sSUFBSTtBQUFBLE1BQzdDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sVUFBVSxPQUFvQztBQUNsRCxVQUFNLEtBQUssMEJBQTBCLE9BQU8sTUFBTTtBQUNsRCxVQUFNLGdCQUFnQixNQUFNLEtBQUssa0JBQWtCLE9BQU8sTUFBTTtBQUNoRSxXQUFPLEtBQUssaUJBQWlCLG9CQUFvQixhQUFhO0FBQUEsRUFDaEU7QUFBQSxFQUVBLE1BQU0sVUFBVSxPQUFvQztBQUNsRCxVQUFNLEtBQUssMEJBQTBCLE9BQU8sTUFBTTtBQUNsRCxVQUFNLGdCQUFnQixNQUFNLEtBQUssa0JBQWtCLE9BQU8sTUFBTTtBQUNoRSxXQUFPLEtBQUssaUJBQWlCLHVCQUF1QixhQUFhO0FBQUEsRUFDbkU7QUFBQSxFQUVBLE1BQU0sZ0JBQWdCLE9BQW9DO0FBQ3hELFVBQU0sUUFBUSxNQUFNLEtBQUssZUFBZTtBQUFBLE1BQ3RDO0FBQUEsUUFDRSxXQUFXLE1BQU0sT0FBTztBQUFBLFFBQ3hCO0FBQUEsUUFDQSxNQUFNLFFBQVEsTUFBTSxXQUFXLE1BQU07QUFBQSxNQUN2QyxFQUFFLEtBQUssSUFBSTtBQUFBLElBQ2I7QUFDQSxVQUFNLEtBQUssMEJBQTBCLE9BQU8sU0FBUztBQUNyRCxVQUFNLGdCQUFnQixNQUFNLEtBQUssa0JBQWtCLE9BQU8sU0FBUztBQUNuRSxXQUFPLEtBQUssaUJBQWlCLDJCQUEyQixNQUFNLElBQUksSUFBSSxhQUFhO0FBQUEsRUFDckY7QUFBQSxFQUVBLE1BQU0sY0FBYyxPQUFvQztBQUN0RCxVQUFNLE1BQU0sb0JBQUksS0FBSztBQUNyQixVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxjQUFjLFNBQVM7QUFDN0IsVUFBTSxLQUFLLGFBQWEsYUFBYSxXQUFXO0FBRWhELFVBQU0sUUFBUSxLQUFLLGVBQWUsS0FBSztBQUN2QyxVQUFNLFdBQVcsR0FBRyxrQkFBa0IsR0FBRyxFQUFFLFFBQVEsU0FBUyxHQUFHLENBQUMsSUFBSSxRQUFRLEtBQUssQ0FBQztBQUNsRixVQUFNLE9BQU8sTUFBTSxLQUFLLGFBQWEscUJBQXFCLEdBQUcsV0FBVyxJQUFJLFFBQVEsRUFBRTtBQUN0RixVQUFNLFVBQVU7QUFBQSxNQUNkLEtBQUssS0FBSztBQUFBLE1BQ1Y7QUFBQSxNQUNBLFlBQVksa0JBQWtCLEdBQUcsQ0FBQztBQUFBLE1BQ2xDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLE1BQU0sUUFBUSxNQUFNLFdBQVcsTUFBTTtBQUFBLE1BQ3JDO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUVYLFVBQU0sS0FBSyxhQUFhLFdBQVcsTUFBTSxPQUFPO0FBQ2hELFVBQU0sS0FBSywwQkFBMEIsT0FBTyxNQUFNO0FBQ2xELFVBQU0sZ0JBQWdCLE1BQU0sS0FBSyxrQkFBa0IsT0FBTyxNQUFNO0FBQ2hFLFdBQU8sS0FBSyxpQkFBaUIsbUNBQW1DLElBQUksSUFBSSxhQUFhO0FBQUEsRUFDdkY7QUFBQSxFQUVBLE1BQU0sb0JBQW9CLE9BQXdDO0FBQ2hFLFVBQU0sV0FBVztBQUFBLE1BQ2YsU0FBUyxNQUFNO0FBQUEsTUFDZixNQUFNO0FBQUEsTUFDTixTQUFTLE1BQU07QUFBQSxNQUNmLFdBQVcsTUFBTTtBQUFBLE1BQ2pCLGdCQUFnQixNQUFNO0FBQUEsSUFDeEI7QUFDQSxVQUFNLFdBQVcsTUFBTSxLQUFLLGFBQWEsWUFBWSxRQUFRO0FBQzdELFFBQUksQ0FBQyxVQUFVO0FBQ2IsWUFBTSxJQUFJLE1BQU0saUNBQWlDLE1BQU0sT0FBTyxFQUFFO0FBQUEsSUFDbEU7QUFDQSxVQUFNLEtBQUssMEJBQTBCLFVBQVUsUUFBUTtBQUN2RCxXQUFPLHlCQUF5QixNQUFNLE9BQU87QUFBQSxFQUMvQztBQUFBLEVBRUEsZUFBZSxPQUEyQjtBQXJHNUM7QUFzR0ksVUFBTSxZQUFZLE1BQU0sV0FBVyxNQUFNLFFBQVEsTUFBTTtBQUN2RCxVQUFNLFFBQVEsVUFDWCxNQUFNLElBQUksRUFDVixJQUFJLENBQUMsU0FBUyxtQkFBbUIsSUFBSSxDQUFDLEVBQ3RDLE9BQU8sT0FBTztBQUVqQixVQUFNLFNBQVEsV0FBTSxDQUFDLE1BQVAsWUFBWTtBQUMxQixXQUFPLFVBQVUsS0FBSztBQUFBLEVBQ3hCO0FBQUEsRUFFQSxNQUFjLGtCQUFrQixPQUFtQixRQUFrQztBQUNuRixRQUFJO0FBQ0YsYUFBTyxNQUFNLEtBQUssYUFBYSxrQkFBa0IsT0FBTyxNQUFNO0FBQUEsSUFDaEUsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLEtBQUs7QUFDbkIsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQUEsRUFFUSxpQkFBaUIsU0FBaUIsZUFBZ0M7QUFDeEUsV0FBTyxnQkFBZ0IsVUFBVSxHQUFHLE9BQU87QUFBQSxFQUM3QztBQUFBLEVBRUEsTUFBYywwQkFDWixPQUNBLFFBQ2U7QUFDZixRQUFJO0FBQ0YsWUFBTSxLQUFLLGlCQUFpQixnQkFBZ0IsT0FBTyxNQUFNO0FBQUEsSUFDM0QsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLEtBQUs7QUFBQSxJQUNyQjtBQUFBLEVBQ0Y7QUFDRjs7O0FDdklBLElBQUFDLG1CQUF1Qjs7O0FDRWhCLFNBQVMsa0JBQ2QsT0FDQSxjQUNBLFdBQVcsSUFDSDtBQUNSLE1BQUksQ0FBQyxNQUFNLE1BQU07QUFDZixXQUFPLEtBQUssWUFBWTtBQUFBLEVBQzFCO0FBRUEsU0FBTyxNQUFNLEtBQUssS0FBSyxFQUNwQixNQUFNLEdBQUcsUUFBUSxFQUNqQixJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRSxFQUN6QixLQUFLLElBQUk7QUFDZDtBQUVPLFNBQVMsdUJBQXVCLE1BQWtDO0FBQ3ZFLFNBQU8sbUJBQW1CLHNCQUFRLEVBQUU7QUFDdEM7OztBQ2pCQSxTQUFTLGdCQUFnQixVQUE0QjtBQUNuRCxRQUFNLFlBQVksb0JBQUksSUFBSTtBQUFBLElBQ3hCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLE1BQU07QUFBQSxJQUNYLElBQUk7QUFBQSxNQUNGLFNBQ0csWUFBWSxFQUNaLE1BQU0sYUFBYSxFQUNuQixJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxFQUN6QixPQUFPLENBQUMsU0FBUyxLQUFLLFVBQVUsS0FBSyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUM7QUFBQSxJQUM5RDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLFNBQVMsZ0JBQWdCLE1BQWMsVUFBNkI7QUFDbEUsTUFBSSxDQUFDLFNBQVMsUUFBUTtBQUNwQixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sUUFBUSxLQUFLLFlBQVk7QUFDL0IsU0FBTyxTQUFTLEtBQUssQ0FBQyxZQUFZLE1BQU0sU0FBUyxPQUFPLENBQUM7QUFDM0Q7QUFFQSxTQUFTLGdCQUFnQixTQUFpQixVQUd4QztBQUNBLFFBQU0sV0FBVyxvQkFBSSxJQUFZO0FBQ2pDLFFBQU0sV0FBVyxnQkFBZ0IsUUFBUTtBQUN6QyxNQUFJLFVBQVU7QUFFZCxhQUFXLFdBQVcsUUFBUSxNQUFNLElBQUksR0FBRztBQUN6QyxVQUFNLE9BQU8sUUFBUSxLQUFLO0FBQzFCLFFBQUksQ0FBQyxNQUFNO0FBQ1Q7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFdBQVcsTUFBTSxHQUFHO0FBQzNCO0FBQUEsSUFDRjtBQUVBLFFBQUksMkJBQTJCLEtBQUssSUFBSSxHQUFHO0FBQ3pDO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBVSxLQUFLLE1BQU0saUJBQWlCO0FBQzVDLFFBQUksU0FBUztBQUNYLFlBQU0sY0FBYyx1QkFBdUIsUUFBUSxDQUFDLENBQUM7QUFDckQsVUFBSSxnQkFBZ0IsZ0JBQWdCLGFBQWEsUUFBUSxLQUFLLFNBQVMsT0FBTyxJQUFJO0FBQ2hGLFlBQUksZ0JBQWdCLGFBQWEsUUFBUSxHQUFHO0FBQzFDLG9CQUFVO0FBQUEsUUFDWjtBQUNBLGlCQUFTLElBQUksV0FBVztBQUFBLE1BQzFCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLEtBQUssTUFBTSw4QkFBOEI7QUFDdEQsUUFBSSxNQUFNO0FBQ1IsWUFBTSxXQUFXLHVCQUF1QixLQUFLLENBQUMsQ0FBQztBQUMvQyxVQUFJLGFBQWEsZ0JBQWdCLFVBQVUsUUFBUSxLQUFLLFNBQVMsT0FBTyxJQUFJO0FBQzFFLFlBQUksZ0JBQWdCLFVBQVUsUUFBUSxHQUFHO0FBQ3ZDLG9CQUFVO0FBQUEsUUFDWjtBQUNBLGlCQUFTLElBQUksUUFBUTtBQUFBLE1BQ3ZCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLEtBQUssTUFBTSxrQ0FBa0M7QUFDNUQsUUFBSSxRQUFRO0FBQ1YsWUFBTSxhQUFhLHVCQUF1QixPQUFPLENBQUMsQ0FBQztBQUNuRCxVQUFJLGVBQWUsZ0JBQWdCLFlBQVksUUFBUSxLQUFLLFNBQVMsT0FBTyxJQUFJO0FBQzlFLFlBQUksZ0JBQWdCLFlBQVksUUFBUSxHQUFHO0FBQ3pDLG9CQUFVO0FBQUEsUUFDWjtBQUNBLGlCQUFTLElBQUksVUFBVTtBQUFBLE1BQ3pCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxnQkFBZ0IsTUFBTSxRQUFRLEtBQUssU0FBUyxPQUFPLEdBQUc7QUFDeEQsVUFBSSxnQkFBZ0IsTUFBTSxRQUFRLEdBQUc7QUFDbkMsa0JBQVU7QUFBQSxNQUNaO0FBQ0EsZUFBUyxJQUFJLHVCQUF1QixJQUFJLENBQUM7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQ0Y7QUFFTyxTQUFTLDRCQUE0QixVQUFrQixTQUF5QjtBQUNyRixRQUFNLGtCQUFrQix1QkFBdUIsUUFBUTtBQUN2RCxRQUFNLEVBQUUsVUFBVSxRQUFRLElBQUksZ0JBQWdCLFNBQVMsZUFBZTtBQUN0RSxRQUFNLGNBQXdCLENBQUM7QUFFL0IsTUFBSSxTQUFTO0FBQ1gsZ0JBQVk7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUNBLGdCQUFZLEtBQUssNEZBQTRGO0FBQUEsRUFDL0csV0FBVyxTQUFTLE1BQU07QUFDeEIsZ0JBQVk7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUNBLGdCQUFZLEtBQUssOERBQThEO0FBQUEsRUFDakYsT0FBTztBQUNMLGdCQUFZLEtBQUssMkRBQTJEO0FBQzVFLGdCQUFZLEtBQUsseUVBQXlFO0FBQUEsRUFDNUY7QUFFQSxRQUFNLFlBQVksV0FBVyxTQUFTLE9BQ2xDLG9CQUFJLElBQUk7QUFBQSxJQUNOO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQyxJQUNELG9CQUFJLElBQUk7QUFBQSxJQUNOO0FBQUEsRUFDRixDQUFDO0FBRUwsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsbUJBQW1CO0FBQUEsSUFDbkI7QUFBQSxJQUNBO0FBQUEsSUFDQSxZQUFZLEtBQUssR0FBRztBQUFBLElBQ3BCO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLFVBQVUsMkJBQTJCO0FBQUEsSUFDdkQ7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsV0FBVywyQkFBMkI7QUFBQSxFQUMxRCxFQUFFLEtBQUssSUFBSTtBQUNiOzs7QUM5TE8sU0FBUyw4QkFBOEIsU0FBeUI7QUFDckUsUUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixNQUFJLENBQUMsU0FBUztBQUNaLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFFQSxRQUFNLFNBQVMsNEJBQTRCLE9BQU87QUFDbEQsTUFBSSxRQUFRO0FBQ1YsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxZQUFZO0FBQUEsTUFDbkI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLFVBQVU7QUFBQSxNQUNqQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sWUFBWTtBQUFBLE1BQ25CO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsSUFDdEIsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEVBQUUsS0FBSyxJQUFJO0FBQ2I7QUFFQSxTQUFTLDRCQUE0QixTQUs1QjtBQUNQLFFBQU0sZUFBb0Y7QUFBQSxJQUN4RixVQUFVLENBQUM7QUFBQSxJQUNYLFFBQVEsQ0FBQztBQUFBLElBQ1QsVUFBVSxDQUFDO0FBQUEsSUFDWCxjQUFjLENBQUM7QUFBQSxFQUNqQjtBQUNBLFFBQU0sZ0JBQTBCLENBQUM7QUFFakMsTUFBSSxpQkFBbUQ7QUFDdkQsTUFBSSxhQUFhO0FBRWpCLGFBQVcsV0FBVyxRQUFRLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLFFBQVE7QUFDN0IsVUFBTSxVQUFVLEtBQUssTUFBTSxrREFBa0Q7QUFDN0UsUUFBSSxTQUFTO0FBQ1gsdUJBQWlCLHFCQUFxQixRQUFRLENBQUMsQ0FBQztBQUNoRCxtQkFBYTtBQUNiO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxZQUFZO0FBQ2YsVUFBSSxLQUFLLE1BQU0sT0FBTyxHQUFHO0FBQ3ZCO0FBQUEsTUFDRjtBQUNBLFVBQUksS0FBSyxLQUFLLEdBQUc7QUFDZixzQkFBYyxLQUFLLElBQUk7QUFBQSxNQUN6QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksZ0JBQWdCO0FBQ2xCLG1CQUFhLGNBQWMsRUFBRSxLQUFLLElBQUk7QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsWUFBWTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUFBLElBQ0wsVUFBVSxZQUFZLENBQUMsR0FBRyxlQUFlLEdBQUcsYUFBYSxRQUFRLENBQUM7QUFBQSxJQUNsRSxRQUFRLFlBQVksYUFBYSxNQUFNO0FBQUEsSUFDdkMsVUFBVSxZQUFZLGFBQWEsUUFBUTtBQUFBLElBQzNDLFdBQVcsWUFBWSxhQUFhLFlBQVksQ0FBQztBQUFBLEVBQ25EO0FBQ0Y7QUFFQSxTQUFTLHFCQUFxQixTQUs1QjtBQUNBLFFBQU0sYUFBYSxRQUFRLFlBQVk7QUFDdkMsTUFBSSxlQUFlLFVBQVU7QUFDM0IsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGVBQWUsWUFBWTtBQUM3QixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxZQUFZLE9BQXlCO0FBQzVDLFNBQU8sTUFBTSxLQUFLLElBQUksRUFBRSxLQUFLO0FBQy9COzs7QUMzSE8sU0FBUyxvQkFBb0IsVUFBaUQ7QUFDbkYsTUFBSSxTQUFTLGVBQWUsVUFBVTtBQUNwQyxXQUFPO0FBQUEsTUFDTCxRQUFRLFNBQVM7QUFBQSxNQUNqQixPQUFPLFNBQVM7QUFBQSxJQUNsQjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTCxRQUFRLFNBQVM7QUFBQSxJQUNqQixPQUFPLFNBQVM7QUFBQSxFQUNsQjtBQUNGO0FBRU8sU0FBUyxlQUFlLFVBQXdDO0FBQ3JFLFFBQU0sU0FBUyxvQkFBb0IsUUFBUTtBQUMzQyxTQUFPLE9BQU8sT0FBTyxLQUFLLEVBQUUsU0FBUyxLQUFLLE9BQU8sTUFBTSxLQUFLLEVBQUUsU0FBUztBQUN6RTs7O0FKZE8sSUFBTSxrQkFBTixNQUFzQjtBQUFBLEVBQzNCLFlBQ21CLFdBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsTUFBTSxlQUFlLFVBQWtCLFNBQXFEO0FBQzFGLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFdBQVcsNEJBQTRCLFVBQVUsUUFBUSxJQUFJO0FBQ25FLFFBQUksVUFBVTtBQUNkLFFBQUksU0FBUztBQUViLFFBQUksU0FBUyxtQkFBbUI7QUFDOUIsVUFBSSxDQUFDLGVBQWUsUUFBUSxHQUFHO0FBQzdCLFlBQUksd0JBQU8scURBQXFEO0FBQUEsTUFDbEUsT0FBTztBQUNMLFlBQUk7QUFDRixvQkFBVSxNQUFNLEtBQUssVUFBVSxlQUFlLFVBQVUsU0FBUyxRQUFRO0FBQ3pFLG1CQUFTO0FBQUEsUUFDWCxTQUFTLE9BQU87QUFDZCxrQkFBUSxNQUFNLEtBQUs7QUFDbkIsY0FBSSx3QkFBTyw2Q0FBNkM7QUFDeEQsb0JBQVU7QUFBQSxRQUNaO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixPQUFPO0FBQUEsTUFDUCxXQUFXLGdCQUFnQixRQUFRO0FBQUEsTUFDbkMsU0FBUyw4QkFBOEIsT0FBTztBQUFBLE1BQzlDO0FBQUEsTUFDQSxZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLFNBQVMsZ0JBQWdCLFVBQTBCO0FBQ2pELFFBQU0sVUFBVSxTQUFTLEtBQUssRUFBRSxRQUFRLFFBQVEsR0FBRztBQUNuRCxNQUFJLFFBQVEsVUFBVSxJQUFJO0FBQ3hCLFdBQU8sV0FBVyxZQUFZLGtCQUFrQixvQkFBSSxLQUFLLENBQUMsQ0FBQztBQUFBLEVBQzdEO0FBRUEsU0FBTyxHQUFHLFFBQVEsTUFBTSxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUM7QUFDMUM7OztBS3ZEQSxJQUFBQyxtQkFBOEI7OztBQ0U5QixTQUFTLGlCQUFpQixNQUFrQztBQUMxRCxVQUFRLHNCQUFRLElBQUksUUFBUSxRQUFRLEdBQUcsRUFBRSxLQUFLO0FBQ2hEO0FBRUEsU0FBUyxrQkFBa0IsT0FBNEI7QUFDckQsTUFBSSxDQUFDLE1BQU0sTUFBTTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTyxNQUFNLEtBQUssS0FBSyxFQUNwQixNQUFNLEdBQUcsQ0FBQyxFQUNWLElBQUksQ0FBQyxTQUFTLFNBQVMsSUFBSSxFQUFFLEVBQzdCLEtBQUssSUFBSTtBQUNkO0FBRU8sU0FBUyxxQkFBcUIsU0FBeUI7QUFDNUQsUUFBTSxhQUFhLG9CQUFJLElBQVk7QUFDbkMsUUFBTSxRQUFRLG9CQUFJLElBQVk7QUFDOUIsUUFBTSxZQUFZLG9CQUFJLElBQVk7QUFFbEMsUUFBTSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQ2hDLGFBQVcsV0FBVyxPQUFPO0FBQzNCLFVBQU0sT0FBTyxRQUFRLEtBQUs7QUFDMUIsUUFBSSxDQUFDLE1BQU07QUFDVDtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssV0FBVyxNQUFNLEdBQUc7QUFDM0I7QUFBQSxJQUNGO0FBRUEsUUFBSSwyQkFBMkIsS0FBSyxJQUFJLEdBQUc7QUFDekM7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLEtBQUssTUFBTSxpQkFBaUI7QUFDNUMsUUFBSSxTQUFTO0FBQ1gsaUJBQVcsSUFBSSxpQkFBaUIsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMzQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQU8sS0FBSyxNQUFNLDhCQUE4QjtBQUN0RCxRQUFJLE1BQU07QUFDUixZQUFNLE9BQU8saUJBQWlCLEtBQUssQ0FBQyxDQUFDO0FBQ3JDLFlBQU0sSUFBSSxJQUFJO0FBQ2QsZ0JBQVUsSUFBSSxJQUFJO0FBQ2xCO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBUyxLQUFLLE1BQU0sa0NBQWtDO0FBQzVELFFBQUksUUFBUTtBQUNWLFlBQU0sT0FBTyxpQkFBaUIsT0FBTyxDQUFDLENBQUM7QUFDdkMsVUFBSSxNQUFNO0FBQ1IsbUJBQVcsSUFBSSxJQUFJO0FBQUEsTUFDckI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLFdBQVcsT0FBTyxLQUFLLEtBQUssVUFBVSxLQUFLO0FBQzdDLGlCQUFXLElBQUksaUJBQWlCLElBQUksQ0FBQztBQUFBLElBQ3ZDO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQSxrQkFBa0IsWUFBWSx3QkFBd0I7QUFBQSxJQUN0RDtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixLQUFLO0FBQUEsSUFDdkI7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsV0FBVyxvQ0FBb0M7QUFBQSxFQUNuRSxFQUFFLEtBQUssSUFBSTtBQUNiOzs7QUR2RE8sSUFBTSxpQkFBTixNQUFxQjtBQUFBLEVBQzFCLFlBQ21CLGNBQ0EsV0FDQSxrQkFDakI7QUFIaUI7QUFDQTtBQUNBO0FBQUEsRUFDaEI7QUFBQSxFQUVILE1BQU0sZ0JBQWdCLGNBQXVCLE9BQXdDO0FBQ25GLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLHdCQUF3QixzQ0FBZ0IsU0FBUztBQUN2RCxVQUFNLFFBQVEsTUFBTSxLQUFLLG1CQUFtQixVQUFVLHFCQUFxQjtBQUMzRSxVQUFNLFVBQVUsTUFBTTtBQUFBLE1BQ3BCLEtBQUs7QUFBQSxNQUNMO0FBQUEsTUFDQSxTQUFTO0FBQUEsSUFDWDtBQUVBLFFBQUksVUFBVSxxQkFBcUIsT0FBTztBQUMxQyxRQUFJLFNBQVM7QUFFYixRQUFJLFNBQVMsbUJBQW1CO0FBQzlCLFVBQUksQ0FBQyxlQUFlLFFBQVEsR0FBRztBQUM3QixZQUFJLHdCQUFPLHVEQUF1RDtBQUFBLE1BQ3BFLE9BQU87QUFDTCxZQUFJO0FBQ0Ysb0JBQVUsTUFBTSxLQUFLLFVBQVUsVUFBVSxXQUFXLFNBQVMsUUFBUTtBQUNyRSxtQkFBUztBQUFBLFFBQ1gsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSxLQUFLO0FBQ25CLGNBQUksd0JBQU8sa0NBQWtDO0FBQUEsUUFDL0M7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUk7QUFDSixVQUFNLFFBQVEsUUFBUSxHQUFHLEtBQUssYUFBYTtBQUMzQyxRQUFJLFNBQVMsa0JBQWtCO0FBQzdCLFlBQU0sWUFBWSx1QkFBdUIsb0JBQUksS0FBSyxDQUFDO0FBQ25ELFlBQU0sWUFBWSxRQUFRLEdBQUcsTUFBTSxZQUFZLENBQUMsSUFBSSxTQUFTLEtBQUs7QUFDbEUsWUFBTSxnQkFBZ0IsR0FBRyxTQUFTLGVBQWUsSUFBSSxTQUFTO0FBQzlELFlBQU0sT0FBTyxNQUFNLEtBQUssYUFBYSxxQkFBcUIsYUFBYTtBQUN2RSxZQUFNLG1CQUFtQixrQkFBa0Isb0JBQUksS0FBSyxDQUFDO0FBQ3JELFlBQU0sT0FBTztBQUFBLFFBQ1gsS0FBSyxLQUFLLElBQUksZ0JBQWdCO0FBQUEsUUFDOUI7QUFBQSxRQUNBO0FBQUEsUUFDQSwwQkFBMEIsSUFBSSxVQUFVLFFBQVEscUJBQXFCO0FBQUEsUUFDckU7QUFBQSxRQUNBLFFBQVEsS0FBSztBQUFBLE1BQ2YsRUFBRSxLQUFLLElBQUk7QUFDWCxZQUFNLEtBQUssYUFBYSxXQUFXLE1BQU0sSUFBSTtBQUM3QyxzQkFBZ0I7QUFBQSxJQUNsQjtBQUVBLFdBQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNUO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxtQkFDWixVQUNBLGNBQ2tCO0FBQ2xCLFVBQU0sU0FBUyxlQUFlLFlBQVksRUFBRSxRQUFRO0FBQ3BELFVBQU0sUUFBUSxNQUFNLEtBQUssYUFBYSxrQkFBa0I7QUFDeEQsV0FBTyxNQUNKLE9BQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxLQUFLLE1BQU0sU0FBUyxlQUFlLENBQUMsRUFDcEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxTQUFTLGFBQWEsQ0FBQyxFQUNsRSxPQUFPLENBQUMsU0FBUyxLQUFLLEtBQUssU0FBUyxNQUFNLEVBQzFDLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFBQSxFQUM3RDtBQUNGOzs7QUU3RkEsSUFBQUMsbUJBQXVCOzs7QUNHdkIsU0FBUyxlQUNQLFNBQ0EsTUFDQSxXQUFXLEdBQ0w7QUFDTixNQUFJLFFBQVEsUUFBUSxVQUFVO0FBQzVCO0FBQUEsRUFDRjtBQUVBLFFBQU0sVUFBVSxtQkFBbUIsSUFBSTtBQUN2QyxNQUFJLENBQUMsU0FBUztBQUNaO0FBQUEsRUFDRjtBQUVBLFVBQVEsSUFBSSxPQUFPO0FBQ3JCO0FBRU8sU0FBUyx1QkFBdUIsU0FBeUI7QUFDOUQsUUFBTSxVQUFVLG9CQUFJLElBQVk7QUFDaEMsUUFBTSxTQUFTLG9CQUFJLElBQVk7QUFDL0IsUUFBTSxZQUFZLG9CQUFJLElBQVk7QUFFbEMsUUFBTSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQ2hDLGFBQVcsV0FBVyxPQUFPO0FBQzNCLFVBQU0sT0FBTyxRQUFRLEtBQUs7QUFDMUIsUUFBSSxDQUFDLE1BQU07QUFDVDtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssV0FBVyxNQUFNLEtBQUssMkJBQTJCLEtBQUssSUFBSSxHQUFHO0FBQ3BFO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBVSxLQUFLLE1BQU0saUJBQWlCO0FBQzVDLFFBQUksU0FBUztBQUNYLFlBQU0sY0FBYyx1QkFBdUIsUUFBUSxDQUFDLENBQUM7QUFDckQsYUFBTyxJQUFJLFdBQVc7QUFDdEIscUJBQWUsU0FBUyxXQUFXO0FBQ25DO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxLQUFLLE1BQU0sOEJBQThCO0FBQ3RELFFBQUksTUFBTTtBQUNSLFlBQU0sV0FBVyx1QkFBdUIsS0FBSyxDQUFDLENBQUM7QUFDL0MsZ0JBQVUsSUFBSSxRQUFRO0FBQ3RCLGFBQU8sSUFBSSxRQUFRO0FBQ25CLHFCQUFlLFNBQVMsUUFBUTtBQUNoQztBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQVMsS0FBSyxNQUFNLGtDQUFrQztBQUM1RCxRQUFJLFFBQVE7QUFDVixZQUFNLGFBQWEsdUJBQXVCLE9BQU8sQ0FBQyxDQUFDO0FBQ25ELGFBQU8sSUFBSSxVQUFVO0FBQ3JCLHFCQUFlLFNBQVMsVUFBVTtBQUNsQztBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssU0FBUyxHQUFHLEdBQUc7QUFDdEIsZ0JBQVUsSUFBSSx1QkFBdUIsSUFBSSxDQUFDO0FBQUEsSUFDNUM7QUFFQSxtQkFBZSxTQUFTLElBQUk7QUFBQSxFQUM5QjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQSxrQkFBa0IsU0FBUywwQkFBMEI7QUFBQSxJQUNyRDtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixRQUFRLHNCQUFzQjtBQUFBLElBQ2hEO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLFdBQVcsMkJBQTJCO0FBQUEsRUFDMUQsRUFBRSxLQUFLLElBQUk7QUFDYjs7O0FDOUVPLFNBQVMseUJBQXlCLFNBQXlCO0FBQ2hFLFFBQU0sVUFBVSxRQUFRLEtBQUs7QUFDN0IsTUFBSSxDQUFDLFNBQVM7QUFDWixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQUUsS0FBSyxJQUFJO0FBQUEsRUFDYjtBQUVBLFFBQU0sU0FBUyx1QkFBdUIsT0FBTztBQUM3QyxNQUFJLFFBQVE7QUFDVixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTyxXQUFXO0FBQUEsTUFDbEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLGFBQWE7QUFBQSxNQUNwQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sYUFBYTtBQUFBLElBQ3RCLEVBQUUsS0FBSyxJQUFJO0FBQUEsRUFDYjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsRUFBRSxLQUFLLElBQUk7QUFDYjtBQUVBLFNBQVMsdUJBQXVCLFNBSXZCO0FBQ1AsUUFBTSxlQUEwRTtBQUFBLElBQzlFLFNBQVMsQ0FBQztBQUFBLElBQ1YsY0FBYyxDQUFDO0FBQUEsSUFDZixjQUFjLENBQUM7QUFBQSxFQUNqQjtBQUNBLFFBQU0sZ0JBQTBCLENBQUM7QUFFakMsTUFBSSxpQkFBbUQ7QUFDdkQsTUFBSSxhQUFhO0FBRWpCLGFBQVcsV0FBVyxRQUFRLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLFFBQVE7QUFDN0IsVUFBTSxVQUFVLEtBQUssTUFBTSw0Q0FBNEM7QUFDdkUsUUFBSSxTQUFTO0FBQ1gsdUJBQWlCQyxzQkFBcUIsUUFBUSxDQUFDLENBQUM7QUFDaEQsbUJBQWE7QUFDYjtBQUFBLElBQ0Y7QUFFQSxRQUFJLENBQUMsWUFBWTtBQUNmLFVBQUksS0FBSyxLQUFLLEdBQUc7QUFDZixzQkFBYyxLQUFLLElBQUk7QUFBQSxNQUN6QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksZ0JBQWdCO0FBQ2xCLG1CQUFhLGNBQWMsRUFBRSxLQUFLLElBQUk7QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsWUFBWTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUFBLElBQ0wsU0FBU0MsYUFBWSxDQUFDLEdBQUcsZUFBZSxHQUFHLGFBQWEsT0FBTyxDQUFDO0FBQUEsSUFDaEUsV0FBV0EsYUFBWSxhQUFhLFlBQVksQ0FBQztBQUFBLElBQ2pELFdBQVdBLGFBQVksYUFBYSxZQUFZLENBQUM7QUFBQSxFQUNuRDtBQUNGO0FBRUEsU0FBU0Qsc0JBQXFCLFNBSTVCO0FBQ0EsUUFBTSxhQUFhLFFBQVEsWUFBWTtBQUN2QyxNQUFJLGVBQWUsY0FBYztBQUMvQixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBU0MsYUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FDdkdPLFNBQVMsNEJBQTRCLFNBQXlCO0FBQ25FLFFBQU0sUUFBUSxvQkFBSSxJQUFZO0FBQzlCLFFBQU0sVUFBVSxvQkFBSSxJQUFZO0FBQ2hDLFFBQU0sWUFBWSxvQkFBSSxJQUFZO0FBRWxDLGFBQVcsV0FBVyxRQUFRLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLEtBQUs7QUFDMUIsUUFBSSxDQUFDLE1BQU07QUFDVDtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssV0FBVyxNQUFNLEtBQUssMkJBQTJCLEtBQUssSUFBSSxHQUFHO0FBQ3BFO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxLQUFLLE1BQU0sOEJBQThCO0FBQ3RELFFBQUksTUFBTTtBQUNSLFlBQU0sV0FBVyx1QkFBdUIsS0FBSyxDQUFDLENBQUM7QUFDL0MsVUFBSSxVQUFVO0FBQ1osY0FBTSxJQUFJLFFBQVE7QUFDbEIsa0JBQVUsSUFBSSxRQUFRO0FBQUEsTUFDeEI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQVMsS0FBSyxNQUFNLGtDQUFrQztBQUM1RCxRQUFJLFFBQVE7QUFDVixZQUFNLGFBQWEsdUJBQXVCLE9BQU8sQ0FBQyxDQUFDO0FBQ25ELFVBQUksWUFBWTtBQUNkLGdCQUFRLElBQUksVUFBVTtBQUFBLE1BQ3hCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFNBQVMsR0FBRyxHQUFHO0FBQ3RCLFlBQU0sV0FBVyx1QkFBdUIsSUFBSTtBQUM1QyxVQUFJLFVBQVU7QUFDWixrQkFBVSxJQUFJLFFBQVE7QUFBQSxNQUN4QjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLGtCQUFrQixPQUFPLGlCQUFpQjtBQUFBLElBQzFDO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLFNBQVMsOEJBQThCO0FBQUEsSUFDekQ7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsV0FBVywyQkFBMkI7QUFBQSxFQUMxRCxFQUFFLEtBQUssSUFBSTtBQUNiOzs7QUN0RE8sU0FBUyw4QkFBOEIsU0FBeUI7QUFDckUsUUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixNQUFJLENBQUMsU0FBUztBQUNaLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsUUFBTSxTQUFTLDRCQUE0QixPQUFPO0FBQ2xELE1BQUksUUFBUTtBQUNWLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQSxPQUFPLFNBQVM7QUFBQSxNQUNoQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sV0FBVztBQUFBLE1BQ2xCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsSUFDdEIsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixFQUFFLEtBQUssSUFBSTtBQUNiO0FBRUEsU0FBUyw0QkFBNEIsU0FJNUI7QUFDUCxRQUFNLGVBQXFFO0FBQUEsSUFDekUsT0FBTyxDQUFDO0FBQUEsSUFDUixTQUFTLENBQUM7QUFBQSxJQUNWLGNBQWMsQ0FBQztBQUFBLEVBQ2pCO0FBQ0EsUUFBTSxnQkFBMEIsQ0FBQztBQUVqQyxNQUFJLGlCQUFtRDtBQUN2RCxNQUFJLGFBQWE7QUFFakIsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsUUFBUTtBQUM3QixVQUFNLFVBQVUsS0FBSyxNQUFNLHVDQUF1QztBQUNsRSxRQUFJLFNBQVM7QUFDWCx1QkFBaUJDLHNCQUFxQixRQUFRLENBQUMsQ0FBQztBQUNoRCxtQkFBYTtBQUNiO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxZQUFZO0FBQ2YsVUFBSSxLQUFLLEtBQUssR0FBRztBQUNmLHNCQUFjLEtBQUssSUFBSTtBQUFBLE1BQ3pCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxnQkFBZ0I7QUFDbEIsbUJBQWEsY0FBYyxFQUFFLEtBQUssSUFBSTtBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUVBLE1BQUksQ0FBQyxZQUFZO0FBQ2YsV0FBTztBQUFBLEVBQ1Q7QUFFQSxTQUFPO0FBQUEsSUFDTCxPQUFPQyxhQUFZLGFBQWEsS0FBSztBQUFBLElBQ3JDLFNBQVNBLGFBQVksQ0FBQyxHQUFHLGVBQWUsR0FBRyxhQUFhLE9BQU8sQ0FBQztBQUFBLElBQ2hFLFdBQVdBLGFBQVksYUFBYSxZQUFZLENBQUM7QUFBQSxFQUNuRDtBQUNGO0FBRUEsU0FBU0Qsc0JBQXFCLFNBSTVCO0FBQ0EsUUFBTSxhQUFhLFFBQVEsWUFBWTtBQUN2QyxNQUFJLGVBQWUsV0FBVztBQUM1QixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBU0MsYUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FDdkdBLFNBQVMsbUJBQW1CLE1BQXVCO0FBQ2pELFFBQU0sUUFBUSxLQUFLLFlBQVk7QUFDL0IsU0FDRSxNQUFNLFNBQVMsU0FBUyxLQUN4QixNQUFNLFNBQVMsU0FBUyxLQUN4QixNQUFNLFNBQVMsUUFBUSxLQUN2QixNQUFNLFNBQVMsUUFBUSxLQUN2QixNQUFNLFNBQVMsVUFBVSxLQUN6QixNQUFNLFNBQVMsWUFBWTtBQUUvQjtBQUVBLFNBQVMsa0JBQWtCLE1BQXVCO0FBQ2hELFFBQU0sUUFBUSxLQUFLLFlBQVk7QUFDL0IsU0FDRSxNQUFNLFNBQVMsUUFBUSxLQUN2QixNQUFNLFNBQVMsVUFBVSxLQUN6QixNQUFNLFNBQVMsUUFBUSxLQUN2QixNQUFNLFNBQVMsTUFBTSxLQUNyQixNQUFNLFNBQVMsT0FBTyxLQUN0QixNQUFNLFNBQVMsTUFBTSxLQUNyQixNQUFNLFNBQVMsUUFBUTtBQUUzQjtBQUVPLFNBQVMsZ0NBQWdDLFNBQXlCO0FBQ3ZFLFFBQU0sWUFBWSxvQkFBSSxJQUFZO0FBQ2xDLFFBQU0sWUFBWSxvQkFBSSxJQUFZO0FBQ2xDLFFBQU0sZ0JBQWdCLG9CQUFJLElBQVk7QUFFdEMsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsS0FBSztBQUMxQixRQUFJLENBQUMsUUFBUSxLQUFLLFdBQVcsTUFBTSxLQUFLLDJCQUEyQixLQUFLLElBQUksR0FBRztBQUM3RTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsS0FBSyxNQUFNLGlCQUFpQjtBQUM1QyxRQUFJLFNBQVM7QUFDWCxZQUFNLE9BQU8sdUJBQXVCLFFBQVEsQ0FBQyxDQUFDO0FBQzlDLFVBQUksS0FBSyxTQUFTLEdBQUcsR0FBRztBQUN0QixzQkFBYyxJQUFJLElBQUk7QUFBQSxNQUN4QixXQUFXLGtCQUFrQixJQUFJLEdBQUc7QUFDbEMsa0JBQVUsSUFBSSxJQUFJO0FBQUEsTUFDcEIsV0FBVyxtQkFBbUIsSUFBSSxHQUFHO0FBQ25DLGtCQUFVLElBQUksSUFBSTtBQUFBLE1BQ3BCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLEtBQUssTUFBTSw4QkFBOEI7QUFDdEQsUUFBSSxNQUFNO0FBQ1IsWUFBTSxPQUFPLHVCQUF1QixLQUFLLENBQUMsQ0FBQztBQUMzQyxnQkFBVSxJQUFJLElBQUk7QUFDbEI7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLEtBQUssTUFBTSxrQ0FBa0M7QUFDNUQsUUFBSSxRQUFRO0FBQ1YsWUFBTSxPQUFPLHVCQUF1QixPQUFPLENBQUMsQ0FBQztBQUM3QyxVQUFJLENBQUMsTUFBTTtBQUNUO0FBQUEsTUFDRjtBQUNBLFVBQUksS0FBSyxTQUFTLEdBQUcsR0FBRztBQUN0QixzQkFBYyxJQUFJLElBQUk7QUFBQSxNQUN4QixXQUFXLGtCQUFrQixJQUFJLEdBQUc7QUFDbEMsa0JBQVUsSUFBSSxJQUFJO0FBQUEsTUFDcEIsV0FBVyxtQkFBbUIsSUFBSSxHQUFHO0FBQ25DLGtCQUFVLElBQUksSUFBSTtBQUFBLE1BQ3BCLFdBQVcsVUFBVSxPQUFPLEdBQUc7QUFDN0Isa0JBQVUsSUFBSSxJQUFJO0FBQUEsTUFDcEIsT0FBTztBQUNMLGtCQUFVLElBQUksSUFBSTtBQUFBLE1BQ3BCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFNBQVMsR0FBRyxHQUFHO0FBQ3RCLG9CQUFjLElBQUksdUJBQXVCLElBQUksQ0FBQztBQUM5QztBQUFBLElBQ0Y7QUFFQSxRQUFJLGtCQUFrQixJQUFJLEdBQUc7QUFDM0IsZ0JBQVUsSUFBSSx1QkFBdUIsSUFBSSxDQUFDO0FBQUEsSUFDNUMsV0FBVyxtQkFBbUIsSUFBSSxHQUFHO0FBQ25DLGdCQUFVLElBQUksdUJBQXVCLElBQUksQ0FBQztBQUFBLElBQzVDO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQSxrQkFBa0IsV0FBVywyQkFBMkI7QUFBQSxJQUN4RDtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixXQUFXLDhCQUE4QjtBQUFBLElBQzNEO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLGVBQWUsK0JBQStCO0FBQUEsRUFDbEUsRUFBRSxLQUFLLElBQUk7QUFDYjs7O0FDcEdPLFNBQVMsa0NBQWtDLFNBQXlCO0FBQ3pFLFFBQU0sVUFBVSxRQUFRLEtBQUs7QUFDN0IsTUFBSSxDQUFDLFNBQVM7QUFDWixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQUUsS0FBSyxJQUFJO0FBQUEsRUFDYjtBQUVBLFFBQU0sU0FBUyxzQkFBc0IsT0FBTztBQUM1QyxNQUFJLFFBQVE7QUFDVixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsTUFDcEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLGFBQWE7QUFBQSxNQUNwQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8saUJBQWlCO0FBQUEsSUFDMUIsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixFQUFFLEtBQUssSUFBSTtBQUNiO0FBRUEsU0FBUyxzQkFBc0IsU0FJdEI7QUFDUCxRQUFNLGVBQStFO0FBQUEsSUFDbkYsV0FBVyxDQUFDO0FBQUEsSUFDWixXQUFXLENBQUM7QUFBQSxJQUNaLGtCQUFrQixDQUFDO0FBQUEsRUFDckI7QUFDQSxRQUFNLGdCQUEwQixDQUFDO0FBRWpDLE1BQUksaUJBQW1EO0FBQ3ZELE1BQUksYUFBYTtBQUVqQixhQUFXLFdBQVcsUUFBUSxNQUFNLElBQUksR0FBRztBQUN6QyxVQUFNLE9BQU8sUUFBUSxRQUFRO0FBQzdCLFVBQU0sVUFBVSxLQUFLLE1BQU0saURBQWlEO0FBQzVFLFFBQUksU0FBUztBQUNYLHVCQUFpQkMsc0JBQXFCLFFBQVEsQ0FBQyxDQUFDO0FBQ2hELG1CQUFhO0FBQ2I7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLFlBQVk7QUFDZixVQUFJLEtBQUssS0FBSyxHQUFHO0FBQ2Ysc0JBQWMsS0FBSyxJQUFJO0FBQUEsTUFDekI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGdCQUFnQjtBQUNsQixtQkFBYSxjQUFjLEVBQUUsS0FBSyxJQUFJO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBRUEsTUFBSSxDQUFDLFlBQVk7QUFDZixXQUFPO0FBQUEsRUFDVDtBQUVBLFNBQU87QUFBQSxJQUNMLFdBQVdDLGFBQVksQ0FBQyxHQUFHLGVBQWUsR0FBRyxhQUFhLFNBQVMsQ0FBQztBQUFBLElBQ3BFLFdBQVdBLGFBQVksYUFBYSxTQUFTO0FBQUEsSUFDN0MsZUFBZUEsYUFBWSxhQUFhLGdCQUFnQixDQUFDO0FBQUEsRUFDM0Q7QUFDRjtBQUVBLFNBQVNELHNCQUFxQixTQUk1QjtBQUNBLFFBQU0sYUFBYSxRQUFRLFlBQVk7QUFDdkMsTUFBSSxlQUFlLGFBQWE7QUFDOUIsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGVBQWUsa0JBQWtCO0FBQ25DLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBU0MsYUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FDdkdBLFNBQVMsa0JBQWtCLE1BQXVCO0FBQ2hELFFBQU0sUUFBUSxLQUFLLFlBQVk7QUFDL0IsU0FDRSxNQUFNLFNBQVMsR0FBRyxLQUNsQixNQUFNLFNBQVMsVUFBVSxLQUN6QixNQUFNLFNBQVMsU0FBUyxLQUN4QixNQUFNLFNBQVMsU0FBUyxLQUN4QixNQUFNLFNBQVMsVUFBVTtBQUU3QjtBQUVBLFNBQVMsa0JBQWtCLE1BQXVCO0FBQ2hELFFBQU0sUUFBUSxLQUFLLFlBQVk7QUFDL0IsU0FDRSxNQUFNLFNBQVMsV0FBVyxLQUMxQixNQUFNLFNBQVMsV0FBVyxLQUMxQixNQUFNLFNBQVMsYUFBYSxLQUM1QixNQUFNLFNBQVMsU0FBUyxLQUN4QixNQUFNLFNBQVMsVUFBVTtBQUU3QjtBQUVPLFNBQVMsMkJBQTJCLFNBQXlCO0FBQ2xFLFFBQU0sZ0JBQWdCLG9CQUFJLElBQVk7QUFDdEMsUUFBTSxVQUFVLG9CQUFJLElBQVk7QUFDaEMsUUFBTSxZQUFZLG9CQUFJLElBQVk7QUFFbEMsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsS0FBSztBQUMxQixRQUFJLENBQUMsUUFBUSxLQUFLLFdBQVcsTUFBTSxLQUFLLDJCQUEyQixLQUFLLElBQUksR0FBRztBQUM3RTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsS0FBSyxNQUFNLGlCQUFpQjtBQUM1QyxRQUFJLFNBQVM7QUFDWCxZQUFNLE9BQU8sdUJBQXVCLFFBQVEsQ0FBQyxDQUFDO0FBQzlDLFVBQUksQ0FBQyxNQUFNO0FBQ1Q7QUFBQSxNQUNGO0FBQ0EsVUFBSSxrQkFBa0IsSUFBSSxHQUFHO0FBQzNCLHNCQUFjLElBQUksSUFBSTtBQUFBLE1BQ3hCLE9BQU87QUFDTCxnQkFBUSxJQUFJLElBQUk7QUFBQSxNQUNsQjtBQUNBLFVBQUksa0JBQWtCLElBQUksR0FBRztBQUMzQixrQkFBVSxJQUFJLElBQUk7QUFBQSxNQUNwQjtBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxLQUFLLE1BQU0sOEJBQThCO0FBQ3RELFFBQUksTUFBTTtBQUNSLFlBQU0sT0FBTyx1QkFBdUIsS0FBSyxDQUFDLENBQUM7QUFDM0MsVUFBSSxNQUFNO0FBQ1Isa0JBQVUsSUFBSSxJQUFJO0FBQUEsTUFDcEI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQVMsS0FBSyxNQUFNLGtDQUFrQztBQUM1RCxRQUFJLFFBQVE7QUFDVixZQUFNLE9BQU8sdUJBQXVCLE9BQU8sQ0FBQyxDQUFDO0FBQzdDLFVBQUksQ0FBQyxNQUFNO0FBQ1Q7QUFBQSxNQUNGO0FBQ0EsVUFBSSxrQkFBa0IsSUFBSSxHQUFHO0FBQzNCLHNCQUFjLElBQUksSUFBSTtBQUFBLE1BQ3hCLFdBQVcsUUFBUSxPQUFPLEdBQUc7QUFDM0IsZ0JBQVEsSUFBSSxJQUFJO0FBQUEsTUFDbEI7QUFDQSxVQUFJLGtCQUFrQixJQUFJLEdBQUc7QUFDM0Isa0JBQVUsSUFBSSxJQUFJO0FBQUEsTUFDcEI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGtCQUFrQixJQUFJLEdBQUc7QUFDM0Isb0JBQWMsSUFBSSx1QkFBdUIsSUFBSSxDQUFDO0FBQzlDO0FBQUEsSUFDRjtBQUVBLFFBQUksUUFBUSxPQUFPLEdBQUc7QUFDcEIsY0FBUSxJQUFJLHVCQUF1QixJQUFJLENBQUM7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0Esa0JBQWtCLGVBQWUsMEJBQTBCO0FBQUEsSUFDM0Q7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsU0FBUyw4QkFBOEI7QUFBQSxJQUN6RDtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixXQUFXLDJCQUEyQjtBQUFBLEVBQzFELEVBQUUsS0FBSyxJQUFJO0FBQ2I7OztBQ2xHTyxTQUFTLDZCQUE2QixTQUF5QjtBQUNwRSxRQUFNLFVBQVUsUUFBUSxLQUFLO0FBQzdCLE1BQUksQ0FBQyxTQUFTO0FBQ1osV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFFQSxRQUFNLFNBQVMsMEJBQTBCLE9BQU87QUFDaEQsTUFBSSxRQUFRO0FBQ1YsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBLE9BQU8saUJBQWlCO0FBQUEsTUFDeEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLFdBQVc7QUFBQSxNQUNsQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sYUFBYTtBQUFBLElBQ3RCLEVBQUUsS0FBSyxJQUFJO0FBQUEsRUFDYjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsRUFBRSxLQUFLLElBQUk7QUFDYjtBQUVBLFNBQVMsMEJBQTBCLFNBSTFCO0FBQ1AsUUFBTSxlQUE4RTtBQUFBLElBQ2xGLGtCQUFrQixDQUFDO0FBQUEsSUFDbkIsU0FBUyxDQUFDO0FBQUEsSUFDVixjQUFjLENBQUM7QUFBQSxFQUNqQjtBQUNBLFFBQU0sZ0JBQTBCLENBQUM7QUFFakMsTUFBSSxpQkFBbUQ7QUFDdkQsTUFBSSxhQUFhO0FBRWpCLGFBQVcsV0FBVyxRQUFRLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLFFBQVE7QUFDN0IsVUFBTSxVQUFVLEtBQUssTUFBTSxnREFBZ0Q7QUFDM0UsUUFBSSxTQUFTO0FBQ1gsdUJBQWlCQyxzQkFBcUIsUUFBUSxDQUFDLENBQUM7QUFDaEQsbUJBQWE7QUFDYjtBQUFBLElBQ0Y7QUFFQSxRQUFJLENBQUMsWUFBWTtBQUNmLFVBQUksS0FBSyxLQUFLLEdBQUc7QUFDZixzQkFBYyxLQUFLLElBQUk7QUFBQSxNQUN6QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksZ0JBQWdCO0FBQ2xCLG1CQUFhLGNBQWMsRUFBRSxLQUFLLElBQUk7QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsWUFBWTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUFBLElBQ0wsZUFBZUMsYUFBWSxDQUFDLEdBQUcsZUFBZSxHQUFHLGFBQWEsZ0JBQWdCLENBQUMsQ0FBQztBQUFBLElBQ2hGLFNBQVNBLGFBQVksYUFBYSxPQUFPO0FBQUEsSUFDekMsV0FBV0EsYUFBWSxhQUFhLFlBQVksQ0FBQztBQUFBLEVBQ25EO0FBQ0Y7QUFFQSxTQUFTRCxzQkFBcUIsU0FJNUI7QUFDQSxRQUFNLGFBQWEsUUFBUSxZQUFZO0FBQ3ZDLE1BQUksZUFBZSxXQUFXO0FBQzVCLFdBQU87QUFBQSxFQUNUO0FBQ0EsTUFBSSxlQUFlLGNBQWM7QUFDL0IsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTQyxhQUFZLE9BQXlCO0FBQzVDLFNBQU8sTUFBTSxLQUFLLElBQUksRUFBRSxLQUFLO0FBQy9COzs7QUN2R08sU0FBUyx1QkFBdUIsU0FBeUI7QUFDOUQsUUFBTSxXQUFXLG9CQUFJLElBQVk7QUFDakMsUUFBTSxZQUFZLG9CQUFJLElBQVk7QUFDbEMsUUFBTSxZQUFZLG9CQUFJLElBQVk7QUFFbEMsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsS0FBSztBQUMxQixRQUFJLENBQUMsTUFBTTtBQUNUO0FBQUEsSUFDRjtBQUVBLFFBQUksS0FBSyxXQUFXLE1BQU0sS0FBSywyQkFBMkIsS0FBSyxJQUFJLEdBQUc7QUFDcEU7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLEtBQUssTUFBTSxpQkFBaUI7QUFDNUMsUUFBSSxTQUFTO0FBQ1gsWUFBTSxjQUFjLHVCQUF1QixRQUFRLENBQUMsQ0FBQztBQUNyRCxVQUFJLGFBQWE7QUFDZixpQkFBUyxJQUFJLFdBQVc7QUFBQSxNQUMxQjtBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBUyxLQUFLLE1BQU0sa0NBQWtDO0FBQzVELFFBQUksUUFBUTtBQUNWLFlBQU0sYUFBYSx1QkFBdUIsT0FBTyxDQUFDLENBQUM7QUFDbkQsVUFBSSxZQUFZO0FBQ2Qsa0JBQVUsSUFBSSxVQUFVO0FBQUEsTUFDMUI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQU8sS0FBSyxNQUFNLDhCQUE4QjtBQUN0RCxRQUFJLE1BQU07QUFDUixZQUFNLFdBQVcsdUJBQXVCLEtBQUssQ0FBQyxDQUFDO0FBQy9DLFVBQUksVUFBVTtBQUNaLGtCQUFVLElBQUksUUFBUTtBQUFBLE1BQ3hCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFNBQVMsR0FBRyxHQUFHO0FBQ3RCLFlBQU0sV0FBVyx1QkFBdUIsSUFBSTtBQUM1QyxVQUFJLFVBQVU7QUFDWixrQkFBVSxJQUFJLFFBQVE7QUFBQSxNQUN4QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksU0FBUyxPQUFPLEdBQUc7QUFDckIsZUFBUyxJQUFJLHVCQUF1QixJQUFJLENBQUM7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsVUFBVSxvQkFBb0I7QUFBQSxJQUNoRDtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixXQUFXLHNCQUFzQjtBQUFBLElBQ25EO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLFdBQVcsMEJBQTBCO0FBQUEsRUFDekQsRUFBRSxLQUFLLElBQUk7QUFDYjs7O0FDckVPLFNBQVMseUJBQXlCLFNBQXlCO0FBQ2hFLFFBQU0sVUFBVSxRQUFRLEtBQUs7QUFDN0IsTUFBSSxDQUFDLFNBQVM7QUFDWixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsUUFBTSxTQUFTLHVCQUF1QixPQUFPO0FBQzdDLE1BQUksUUFBUTtBQUNWLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sWUFBWTtBQUFBLE1BQ25CO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsTUFDcEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLGFBQWE7QUFBQSxJQUN0QixFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsRUFBRSxLQUFLLElBQUk7QUFDYjtBQUVBLFNBQVMsdUJBQXVCLFNBSXZCO0FBQ1AsUUFBTSxlQUErRTtBQUFBLElBQ25GLFVBQVUsQ0FBQztBQUFBLElBQ1gsY0FBYyxDQUFDO0FBQUEsSUFDZixrQkFBa0IsQ0FBQztBQUFBLEVBQ3JCO0FBQ0EsUUFBTSxnQkFBMEIsQ0FBQztBQUVqQyxNQUFJLGlCQUFtRDtBQUN2RCxNQUFJLGFBQWE7QUFFakIsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsUUFBUTtBQUM3QixVQUFNLFVBQVUsS0FBSyxNQUFNLGlEQUFpRDtBQUM1RSxRQUFJLFNBQVM7QUFDWCx1QkFBaUJDLHNCQUFxQixRQUFRLENBQUMsQ0FBQztBQUNoRCxtQkFBYTtBQUNiO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxZQUFZO0FBQ2YsVUFBSSxLQUFLLE1BQU0sT0FBTyxHQUFHO0FBQ3ZCO0FBQUEsTUFDRjtBQUNBLFVBQUksS0FBSyxLQUFLLEdBQUc7QUFDZixzQkFBYyxLQUFLLElBQUk7QUFBQSxNQUN6QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksZ0JBQWdCO0FBQ2xCLG1CQUFhLGNBQWMsRUFBRSxLQUFLLElBQUk7QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsWUFBWTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUFBLElBQ0wsVUFBVUMsYUFBWSxDQUFDLEdBQUcsZUFBZSxHQUFHLGFBQWEsUUFBUSxDQUFDO0FBQUEsSUFDbEUsV0FBV0EsYUFBWSxhQUFhLFlBQVksQ0FBQztBQUFBLElBQ2pELFdBQVdBLGFBQVksYUFBYSxnQkFBZ0IsQ0FBQztBQUFBLEVBQ3ZEO0FBQ0Y7QUFFQSxTQUFTRCxzQkFBcUIsU0FJNUI7QUFDQSxRQUFNLGFBQWEsUUFBUSxZQUFZO0FBQ3ZDLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsTUFBSSxlQUFlLGtCQUFrQjtBQUNuQyxXQUFPO0FBQUEsRUFDVDtBQUNBLFNBQU87QUFDVDtBQUVBLFNBQVNDLGFBQVksT0FBeUI7QUFDNUMsU0FBTyxNQUFNLEtBQUssSUFBSSxFQUFFLEtBQUs7QUFDL0I7OztBQ2hITyxTQUFTLDBCQUEwQixTQUF5QjtBQUNqRSxRQUFNLFdBQVcsb0JBQUksSUFBWTtBQUNqQyxRQUFNLFFBQVEsb0JBQUksSUFBWTtBQUM5QixRQUFNLFFBQVEsb0JBQUksSUFBWTtBQUM5QixRQUFNLFlBQVksb0JBQUksSUFBWTtBQUVsQyxhQUFXLFdBQVcsUUFBUSxNQUFNLElBQUksR0FBRztBQUN6QyxVQUFNLE9BQU8sUUFBUSxLQUFLO0FBQzFCLFFBQUksQ0FBQyxNQUFNO0FBQ1Q7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFdBQVcsTUFBTSxLQUFLLDJCQUEyQixLQUFLLElBQUksR0FBRztBQUNwRTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsS0FBSyxNQUFNLGlCQUFpQjtBQUM1QyxRQUFJLFNBQVM7QUFDWCxZQUFNLGNBQWMsdUJBQXVCLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELFVBQUksYUFBYTtBQUNmLGlCQUFTLElBQUksV0FBVztBQUN4QixjQUFNLElBQUksV0FBVztBQUFBLE1BQ3ZCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLEtBQUssTUFBTSw4QkFBOEI7QUFDdEQsUUFBSSxNQUFNO0FBQ1IsWUFBTSxXQUFXLHVCQUF1QixLQUFLLENBQUMsQ0FBQztBQUMvQyxVQUFJLFVBQVU7QUFDWixrQkFBVSxJQUFJLFFBQVE7QUFDdEIsY0FBTSxJQUFJLFFBQVE7QUFBQSxNQUNwQjtBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBUyxLQUFLLE1BQU0sa0NBQWtDO0FBQzVELFFBQUksUUFBUTtBQUNWLFlBQU0sYUFBYSx1QkFBdUIsT0FBTyxDQUFDLENBQUM7QUFDbkQsVUFBSSxZQUFZO0FBQ2QsY0FBTSxJQUFJLFVBQVU7QUFDcEIsWUFBSSxjQUFjLFVBQVUsR0FBRztBQUM3QixnQkFBTSxJQUFJLFVBQVU7QUFBQSxRQUN0QjtBQUFBLE1BQ0Y7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGNBQWMsSUFBSSxHQUFHO0FBQ3ZCLFlBQU0sSUFBSSx1QkFBdUIsSUFBSSxDQUFDO0FBQUEsSUFDeEMsV0FBVyxTQUFTLE9BQU8sR0FBRztBQUM1QixlQUFTLElBQUksdUJBQXVCLElBQUksQ0FBQztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixVQUFVLG9CQUFvQjtBQUFBLElBQ2hEO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLE9BQU8saUJBQWlCO0FBQUEsSUFDMUM7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsT0FBTyxpQkFBaUI7QUFBQSxJQUMxQztBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixXQUFXLHNCQUFzQjtBQUFBLEVBQ3JELEVBQUUsS0FBSyxJQUFJO0FBQ2I7QUFFQSxTQUFTLGNBQWMsTUFBdUI7QUFDNUMsUUFBTSxRQUFRLEtBQUssWUFBWTtBQUMvQixTQUNFLE1BQU0sV0FBVyxPQUFPLEtBQ3hCLE1BQU0sV0FBVyxRQUFRLEtBQ3pCLE1BQU0sV0FBVyxPQUFPLEtBQ3hCLE1BQU0sV0FBVyxRQUFRLEtBQ3pCLE1BQU0sV0FBVyxPQUFPLEtBQ3hCLE1BQU0sV0FBVyxRQUFRLEtBQ3pCLE1BQU0sU0FBUyxTQUFTLEtBQ3hCLE1BQU0sU0FBUyxPQUFPLEtBQ3RCLE1BQU0sU0FBUyxXQUFXO0FBRTlCOzs7QUN2Rk8sU0FBUyw0QkFBNEIsU0FBeUI7QUFDbkUsUUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixNQUFJLENBQUMsU0FBUztBQUNaLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFFQSxRQUFNLFNBQVMsMEJBQTBCLE9BQU87QUFDaEQsTUFBSSxRQUFRO0FBQ1YsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxZQUFZO0FBQUEsTUFDbkI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLFNBQVM7QUFBQSxNQUNoQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sU0FBUztBQUFBLE1BQ2hCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsSUFDdEIsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEVBQUUsS0FBSyxJQUFJO0FBQ2I7QUFFQSxTQUFTLDBCQUEwQixTQUsxQjtBQUNQLFFBQU0sZUFBZ0Y7QUFBQSxJQUNwRixVQUFVLENBQUM7QUFBQSxJQUNYLE9BQU8sQ0FBQztBQUFBLElBQ1IsT0FBTyxDQUFDO0FBQUEsSUFDUixjQUFjLENBQUM7QUFBQSxFQUNqQjtBQUNBLFFBQU0sZ0JBQTBCLENBQUM7QUFFakMsTUFBSSxpQkFBbUQ7QUFDdkQsTUFBSSxhQUFhO0FBRWpCLGFBQVcsV0FBVyxRQUFRLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLFFBQVE7QUFDN0IsVUFBTSxVQUFVLEtBQUssTUFBTSw4Q0FBOEM7QUFDekUsUUFBSSxTQUFTO0FBQ1gsdUJBQWlCQyxzQkFBcUIsUUFBUSxDQUFDLENBQUM7QUFDaEQsbUJBQWE7QUFDYjtBQUFBLElBQ0Y7QUFFQSxRQUFJLENBQUMsWUFBWTtBQUNmLFVBQUksS0FBSyxNQUFNLE9BQU8sR0FBRztBQUN2QjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLEtBQUssS0FBSyxHQUFHO0FBQ2Ysc0JBQWMsS0FBSyxJQUFJO0FBQUEsTUFDekI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGdCQUFnQjtBQUNsQixtQkFBYSxjQUFjLEVBQUUsS0FBSyxJQUFJO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBRUEsTUFBSSxDQUFDLFlBQVk7QUFDZixXQUFPO0FBQUEsRUFDVDtBQUVBLFNBQU87QUFBQSxJQUNMLFVBQVVDLGFBQVksQ0FBQyxHQUFHLGVBQWUsR0FBRyxhQUFhLFFBQVEsQ0FBQztBQUFBLElBQ2xFLE9BQU9BLGFBQVksYUFBYSxLQUFLO0FBQUEsSUFDckMsT0FBT0EsYUFBWSxhQUFhLEtBQUs7QUFBQSxJQUNyQyxXQUFXQSxhQUFZLGFBQWEsWUFBWSxDQUFDO0FBQUEsRUFDbkQ7QUFDRjtBQUVBLFNBQVNELHNCQUFxQixTQUs1QjtBQUNBLFFBQU0sYUFBYSxRQUFRLFlBQVk7QUFDdkMsTUFBSSxlQUFlLFNBQVM7QUFDMUIsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGVBQWUsU0FBUztBQUMxQixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBU0MsYUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FDaElPLFNBQVMsMEJBQTBCLFVBQXFDO0FBQzdFLE1BQUksYUFBYSxpQkFBaUI7QUFDaEMsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJLGFBQWEscUJBQXFCO0FBQ3BDLFdBQU87QUFBQSxFQUNUO0FBRUEsTUFBSSxhQUFhLDBCQUEwQjtBQUN6QyxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksYUFBYSxzQkFBc0I7QUFDckMsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJLGFBQWEsdUJBQXVCO0FBQ3RDLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUNUO0FBRU8sU0FBUyxnQ0FBZ0MsVUFBcUM7QUFDbkYsTUFBSSxhQUFhLGlCQUFpQjtBQUNoQyxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksYUFBYSxxQkFBcUI7QUFDcEMsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJLGFBQWEsMEJBQTBCO0FBQ3pDLFdBQU87QUFBQSxFQUNUO0FBRUEsTUFBSSxhQUFhLHNCQUFzQjtBQUNyQyxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksYUFBYSx1QkFBdUI7QUFDdEMsV0FBTztBQUFBLEVBQ1Q7QUFFQSxTQUFPO0FBQ1Q7OztBYm5CTyxJQUFNLG1CQUFOLE1BQXVCO0FBQUEsRUFDNUIsWUFDbUIsV0FDQSxrQkFDakI7QUFGaUI7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxNQUFNLElBQUksVUFBNkIsU0FBcUQ7QUFDMUYsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sV0FBVyxLQUFLLGNBQWMsVUFBVSxRQUFRLElBQUk7QUFDMUQsUUFBSSxVQUFVO0FBQ2QsUUFBSSxTQUFTO0FBRWIsUUFBSSxTQUFTLG1CQUFtQjtBQUM5QixVQUFJLENBQUMsZUFBZSxRQUFRLEdBQUc7QUFDN0IsWUFBSSx3QkFBTyx1REFBdUQ7QUFBQSxNQUNwRSxPQUFPO0FBQ0wsWUFBSTtBQUNGLG9CQUFVLE1BQU0sS0FBSyxVQUFVLGtCQUFrQixVQUFVLFNBQVMsUUFBUTtBQUM1RSxtQkFBUztBQUFBLFFBQ1gsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSxLQUFLO0FBQ25CLGNBQUksd0JBQU8sb0NBQW9DO0FBQy9DLG9CQUFVO0FBQUEsUUFDWjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLE1BQ0wsUUFBUSwwQkFBMEIsUUFBUTtBQUFBLE1BQzFDLE9BQU8sMEJBQTBCLFFBQVE7QUFBQSxNQUN6QyxXQUFXLEdBQUcsUUFBUSxXQUFXLElBQUksMEJBQTBCLFFBQVEsQ0FBQztBQUFBLE1BQ3hFLFNBQVMsS0FBSyxVQUFVLFVBQVUsT0FBTztBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLGNBQWMsVUFBNkIsTUFBc0I7QUFDdkUsUUFBSSxhQUFhLGlCQUFpQjtBQUNoQyxhQUFPLDRCQUE0QixJQUFJO0FBQUEsSUFDekM7QUFFQSxRQUFJLGFBQWEscUJBQXFCO0FBQ3BDLGFBQU8sZ0NBQWdDLElBQUk7QUFBQSxJQUM3QztBQUVBLFFBQUksYUFBYSwwQkFBMEI7QUFDekMsYUFBTywyQkFBMkIsSUFBSTtBQUFBLElBQ3hDO0FBRUEsUUFBSSxhQUFhLHNCQUFzQjtBQUNyQyxhQUFPLHVCQUF1QixJQUFJO0FBQUEsSUFDcEM7QUFFQSxRQUFJLGFBQWEsdUJBQXVCO0FBQ3RDLGFBQU8sMEJBQTBCLElBQUk7QUFBQSxJQUN2QztBQUVBLFdBQU8sdUJBQXVCLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRVEsVUFBVSxVQUE2QixTQUF5QjtBQUN0RSxRQUFJLGFBQWEsaUJBQWlCO0FBQ2hDLGFBQU8sOEJBQThCLE9BQU87QUFBQSxJQUM5QztBQUVBLFFBQUksYUFBYSxxQkFBcUI7QUFDcEMsYUFBTyxrQ0FBa0MsT0FBTztBQUFBLElBQ2xEO0FBRUEsUUFBSSxhQUFhLDBCQUEwQjtBQUN6QyxhQUFPLDZCQUE2QixPQUFPO0FBQUEsSUFDN0M7QUFFQSxRQUFJLGFBQWEsc0JBQXNCO0FBQ3JDLGFBQU8seUJBQXlCLE9BQU87QUFBQSxJQUN6QztBQUVBLFFBQUksYUFBYSx1QkFBdUI7QUFDdEMsYUFBTyw0QkFBNEIsT0FBTztBQUFBLElBQzVDO0FBRUEsV0FBTyx5QkFBeUIsT0FBTztBQUFBLEVBQ3pDO0FBQ0Y7OztBY2hIQSxJQUFBQyxtQkFBdUI7OztBQ0V2QixTQUFTLHNCQUFzQixNQUF1QjtBQUNwRCxRQUFNLFFBQVEsS0FBSyxZQUFZO0FBQy9CLFNBQ0UsTUFBTSxTQUFTLEdBQUcsS0FDbEIsTUFBTSxTQUFTLFVBQVUsS0FDekIsTUFBTSxTQUFTLFNBQVMsS0FDeEIsTUFBTSxTQUFTLFlBQVksS0FDM0IsTUFBTSxTQUFTLFNBQVM7QUFFNUI7QUFFQSxTQUFTLGtCQUFrQixNQUF1QjtBQUNoRCxRQUFNLFFBQVEsS0FBSyxZQUFZO0FBQy9CLFNBQ0UsTUFBTSxXQUFXLE9BQU8sS0FDeEIsTUFBTSxXQUFXLFdBQVcsS0FDNUIsTUFBTSxXQUFXLFdBQVcsS0FDNUIsTUFBTSxXQUFXLE9BQU8sS0FDeEIsTUFBTSxXQUFXLFFBQVEsS0FDekIsTUFBTSxTQUFTLFNBQVMsS0FDeEIsTUFBTSxTQUFTLE9BQU8sS0FDdEIsTUFBTSxTQUFTLFFBQVEsS0FDdkIsTUFBTSxTQUFTLE9BQU8sS0FDdEIsTUFBTSxTQUFTLFFBQVE7QUFFM0I7QUFFQSxTQUFTLGNBQ1AsYUFDQSxZQUNBLGFBQ1E7QUFDUixRQUFNLFVBQVUsb0JBQUksSUFBWTtBQUVoQyxNQUFJLGVBQWUsWUFBWSxTQUFTLEdBQUc7QUFDekMsZUFBVyxRQUFRLFlBQVksTUFBTSxHQUFHLEVBQUUsR0FBRztBQUMzQyxjQUFRLElBQUksSUFBSTtBQUFBLElBQ2xCO0FBRUEsUUFBSSxZQUFZLFNBQVMsSUFBSTtBQUMzQixjQUFRLElBQUksVUFBVSxZQUFZLFNBQVMsRUFBRSxPQUFPO0FBQUEsSUFDdEQ7QUFBQSxFQUNGLFdBQVcsWUFBWTtBQUNyQixZQUFRLElBQUksVUFBVTtBQUFBLEVBQ3hCLE9BQU87QUFDTCxZQUFRLElBQUksV0FBVztBQUFBLEVBQ3pCO0FBRUEsU0FBTyxrQkFBa0IsU0FBUyw0QkFBNEI7QUFDaEU7QUFFTyxTQUFTLHVCQUNkLE9BQ0EsU0FDQSxhQUNBLFlBQ0EsYUFDUTtBQUNSLFFBQU0sV0FBVyxvQkFBSSxJQUFZO0FBQ2pDLFFBQU0sV0FBVyxvQkFBSSxJQUFZO0FBQ2pDLFFBQU0sZ0JBQWdCLG9CQUFJLElBQVk7QUFDdEMsUUFBTSxZQUFZLG9CQUFJLElBQVk7QUFFbEMsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsS0FBSztBQUMxQixRQUFJLENBQUMsTUFBTTtBQUNUO0FBQUEsSUFDRjtBQUVBLFFBQUksS0FBSyxXQUFXLE1BQU0sS0FBSywyQkFBMkIsS0FBSyxJQUFJLEdBQUc7QUFDcEU7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLEtBQUssTUFBTSxpQkFBaUI7QUFDNUMsUUFBSSxTQUFTO0FBQ1gsWUFBTSxjQUFjLHVCQUF1QixRQUFRLENBQUMsQ0FBQztBQUNyRCxVQUFJLGFBQWE7QUFDZixpQkFBUyxJQUFJLFdBQVc7QUFDeEIsWUFBSSxzQkFBc0IsV0FBVyxHQUFHO0FBQ3RDLHdCQUFjLElBQUksV0FBVztBQUFBLFFBQy9CO0FBQ0EsWUFBSSxrQkFBa0IsV0FBVyxHQUFHO0FBQ2xDLG9CQUFVLElBQUksV0FBVztBQUFBLFFBQzNCO0FBQUEsTUFDRjtBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxLQUFLLE1BQU0sOEJBQThCO0FBQ3RELFFBQUksTUFBTTtBQUNSLFlBQU0sV0FBVyx1QkFBdUIsS0FBSyxDQUFDLENBQUM7QUFDL0MsVUFBSSxVQUFVO0FBQ1osaUJBQVMsSUFBSSxRQUFRO0FBQ3JCLGtCQUFVLElBQUksUUFBUTtBQUFBLE1BQ3hCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLEtBQUssTUFBTSxrQ0FBa0M7QUFDNUQsUUFBSSxRQUFRO0FBQ1YsWUFBTSxhQUFhLHVCQUF1QixPQUFPLENBQUMsQ0FBQztBQUNuRCxVQUFJLFlBQVk7QUFDZCxpQkFBUyxJQUFJLFVBQVU7QUFDdkIsWUFBSSxzQkFBc0IsVUFBVSxHQUFHO0FBQ3JDLHdCQUFjLElBQUksVUFBVTtBQUFBLFFBQzlCO0FBQ0EsWUFBSSxrQkFBa0IsVUFBVSxHQUFHO0FBQ2pDLG9CQUFVLElBQUksVUFBVTtBQUFBLFFBQzFCO0FBQUEsTUFDRjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksc0JBQXNCLElBQUksR0FBRztBQUMvQixZQUFNLFdBQVcsdUJBQXVCLElBQUk7QUFDNUMsVUFBSSxVQUFVO0FBQ1osc0JBQWMsSUFBSSxRQUFRO0FBQUEsTUFDNUI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLFNBQVMsT0FBTyxHQUFHO0FBQ3JCLGVBQVMsSUFBSSx1QkFBdUIsSUFBSSxDQUFDO0FBQUEsSUFDM0MsV0FBVyxTQUFTLE9BQU8sR0FBRztBQUM1QixlQUFTLElBQUksdUJBQXVCLElBQUksQ0FBQztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUVBLE1BQUksQ0FBQyxVQUFVLE1BQU07QUFDbkIsY0FBVSxJQUFJLDRCQUE0QjtBQUFBLEVBQzVDO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLFlBQVksdUJBQXVCLEtBQUssQ0FBQztBQUFBLElBQ3pDLGtCQUFrQixVQUFVLG9CQUFvQjtBQUFBLElBQ2hEO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLFVBQVUsb0JBQW9CO0FBQUEsSUFDaEQ7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsZUFBZSwwQkFBMEI7QUFBQSxJQUMzRDtBQUFBLElBQ0E7QUFBQSxJQUNBLGNBQWMsYUFBYSxZQUFZLFdBQVc7QUFBQSxJQUNsRDtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQixXQUFXLDRCQUE0QjtBQUFBLEVBQzNELEVBQUUsS0FBSyxJQUFJO0FBQ2I7OztBQ3ZKTyxTQUFTLHlCQUF5QixTQUF5QjtBQUNoRSxRQUFNLFVBQVUsUUFBUSxLQUFLO0FBQzdCLE1BQUksQ0FBQyxTQUFTO0FBQ1osV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFFQSxRQUFNLFNBQVMsdUJBQXVCLE9BQU87QUFDN0MsTUFBSSxRQUFRO0FBQ1YsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBLE9BQU8sWUFBWTtBQUFBLE1BQ25CO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxZQUFZO0FBQUEsTUFDbkI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLGlCQUFpQjtBQUFBLE1BQ3hCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxXQUFXO0FBQUEsTUFDbEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLGFBQWE7QUFBQSxJQUN0QixFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEVBQUUsS0FBSyxJQUFJO0FBQ2I7QUFFQSxTQUFTLHVCQUF1QixTQU12QjtBQUNQLFFBQU0sZUFHRjtBQUFBLElBQ0YsVUFBVSxDQUFDO0FBQUEsSUFDWCxVQUFVLENBQUM7QUFBQSxJQUNYLGtCQUFrQixDQUFDO0FBQUEsSUFDbkIsU0FBUyxDQUFDO0FBQUEsSUFDVixjQUFjLENBQUM7QUFBQSxFQUNqQjtBQUNBLFFBQU0sZ0JBQTBCLENBQUM7QUFFakMsTUFBSSxpQkFBbUQ7QUFDdkQsTUFBSSxhQUFhO0FBRWpCLGFBQVcsV0FBVyxRQUFRLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLFFBQVE7QUFDN0IsVUFBTSxVQUFVLEtBQUs7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFDQSxRQUFJLFNBQVM7QUFDWCx1QkFBaUJDLHNCQUFxQixRQUFRLENBQUMsQ0FBQztBQUNoRCxtQkFBYTtBQUNiO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxZQUFZO0FBQ2YsVUFBSSxLQUFLLE1BQU0sT0FBTyxHQUFHO0FBQ3ZCO0FBQUEsTUFDRjtBQUNBLFVBQUksS0FBSyxLQUFLLEdBQUc7QUFDZixzQkFBYyxLQUFLLElBQUk7QUFBQSxNQUN6QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksZ0JBQWdCO0FBQ2xCLG1CQUFhLGNBQWMsRUFBRSxLQUFLLElBQUk7QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsWUFBWTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUFBLElBQ0wsVUFBVUMsYUFBWSxDQUFDLEdBQUcsZUFBZSxHQUFHLGFBQWEsUUFBUSxDQUFDO0FBQUEsSUFDbEUsVUFBVUEsYUFBWSxhQUFhLFFBQVE7QUFBQSxJQUMzQyxlQUFlQSxhQUFZLGFBQWEsZ0JBQWdCLENBQUM7QUFBQSxJQUN6RCxTQUFTQSxhQUFZLGFBQWEsT0FBTztBQUFBLElBQ3pDLFdBQVdBLGFBQVksYUFBYSxZQUFZLENBQUM7QUFBQSxFQUNuRDtBQUNGO0FBRUEsU0FBU0Qsc0JBQXFCLFNBTTVCO0FBQ0EsUUFBTSxhQUFhLFFBQVEsWUFBWTtBQUN2QyxNQUFJLGVBQWUsWUFBWTtBQUM3QixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxrQkFBa0I7QUFDbkMsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGVBQWUsV0FBVztBQUM1QixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBU0MsYUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FGdklPLElBQU0sbUJBQU4sTUFBdUI7QUFBQSxFQUM1QixZQUNtQixXQUNBLGtCQUNqQjtBQUZpQjtBQUNBO0FBQUEsRUFDaEI7QUFBQSxFQUVILE1BQU0sZ0JBQWdCLE9BQWUsU0FBcUQ7QUFDeEYsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sZUFBZSxtQkFBbUIsS0FBSztBQUM3QyxRQUFJLENBQUMsY0FBYztBQUNqQixZQUFNLElBQUksTUFBTSx1QkFBdUI7QUFBQSxJQUN6QztBQUVBLFVBQU0sV0FBVztBQUFBLE1BQ2Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxJQUNWO0FBQ0EsUUFBSSxVQUFVO0FBQ2QsUUFBSSxTQUFTO0FBRWIsUUFBSSxTQUFTLG1CQUFtQjtBQUM5QixVQUFJLENBQUMsZUFBZSxRQUFRLEdBQUc7QUFDN0IsWUFBSSx3QkFBTyx5REFBeUQ7QUFBQSxNQUN0RSxPQUFPO0FBQ0wsWUFBSTtBQUNGLG9CQUFVLE1BQU0sS0FBSyxVQUFVLGdCQUFnQixjQUFjLFNBQVMsUUFBUTtBQUM5RSxtQkFBUztBQUFBLFFBQ1gsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSxLQUFLO0FBQ25CLGNBQUksd0JBQU8sZ0RBQWdEO0FBQzNELG9CQUFVO0FBQUEsUUFDWjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsVUFBTSxvQkFBb0I7QUFBQSxNQUN4Qix5QkFBeUIsT0FBTztBQUFBLE1BQ2hDO0FBQUEsSUFDRjtBQUVBLFdBQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLE9BQU87QUFBQSxNQUNQLFdBQVcsYUFBYSxZQUFZO0FBQUEsTUFDcEMsU0FBUztBQUFBLE1BQ1Q7QUFBQSxNQUNBLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGO0FBRUEsU0FBUyxrQkFBa0IsU0FBaUIsT0FBdUI7QUFDakUsUUFBTSxrQkFBa0IsbUJBQW1CLEtBQUs7QUFDaEQsUUFBTSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQ2hDLFFBQU0sZ0JBQWdCLE1BQU0sVUFBVSxDQUFDLFNBQVMscUJBQXFCLEtBQUssSUFBSSxDQUFDO0FBQy9FLE1BQUksa0JBQWtCLElBQUk7QUFDeEIsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLG1CQUFtQixNQUFNO0FBQUEsSUFDN0IsQ0FBQyxNQUFNLFVBQVUsUUFBUSxpQkFBaUIsU0FBUyxLQUFLLElBQUk7QUFBQSxFQUM5RDtBQUNBLFFBQU0sWUFBWSxZQUFZLGVBQWU7QUFDN0MsUUFBTSxnQkFBZ0IsTUFBTTtBQUFBLElBQzFCLGdCQUFnQjtBQUFBLElBQ2hCLHFCQUFxQixLQUFLLE1BQU0sU0FBUztBQUFBLEVBQzNDO0FBQ0EsTUFBSSxjQUFjLEtBQUssQ0FBQyxTQUFTLEtBQUssS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLFVBQVUsQ0FBQyxHQUFHO0FBQ2xGLFdBQU87QUFBQSxFQUNUO0FBRUEsUUFBTSxpQkFBaUIsZ0JBQWdCO0FBQ3ZDLFFBQU0sVUFBVSxDQUFDLEdBQUcsS0FBSztBQUN6QixVQUFRLE9BQU8sZ0JBQWdCLEdBQUcsU0FBUztBQUMzQyxTQUFPLFFBQVEsS0FBSyxJQUFJO0FBQzFCO0FBRUEsU0FBUyxhQUFhLE9BQXVCO0FBQzNDLFFBQU0sVUFBVSxNQUFNLEtBQUssRUFBRSxRQUFRLFFBQVEsR0FBRztBQUNoRCxNQUFJLFFBQVEsVUFBVSxJQUFJO0FBQ3hCLFdBQU8sV0FBVyxTQUFTLGtCQUFrQixvQkFBSSxLQUFLLENBQUMsQ0FBQztBQUFBLEVBQzFEO0FBRUEsU0FBTyxHQUFHLFFBQVEsTUFBTSxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUM7QUFDMUM7OztBR3JGTyxJQUFNLGNBQU4sTUFBa0I7QUFBQSxFQU12QixZQUNtQixjQUNBLGtCQUNqQjtBQUZpQjtBQUNBO0FBUG5CLFNBQVEscUJBR0c7QUFBQSxFQUtSO0FBQUEsRUFFSCxNQUFNLFdBQVcsTUFBeUM7QUFDeEQsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sVUFBVSxtQkFBbUIsSUFBSTtBQUN2QyxRQUFJLENBQUMsU0FBUztBQUNaLFlBQU0sSUFBSSxNQUFNLDJCQUEyQjtBQUFBLElBQzdDO0FBRUEsVUFBTSxRQUFRLFNBQVMsT0FBTyxZQUFZLGtCQUFrQixvQkFBSSxLQUFLLENBQUMsQ0FBQztBQUN2RSxVQUFNLEtBQUssYUFBYSxXQUFXLFNBQVMsV0FBVyxLQUFLO0FBQzVELFNBQUsscUJBQXFCO0FBQzFCLFdBQU8sRUFBRSxNQUFNLFNBQVMsVUFBVTtBQUFBLEVBQ3BDO0FBQUEsRUFFQSxNQUFNLG1CQUFvQztBQUN4QyxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxFQUFFLE1BQU0sT0FBTyxPQUFPLElBQUksTUFBTSxLQUFLLGFBQWEsa0JBQWtCLFNBQVMsU0FBUztBQUM1RixRQUFJLENBQUMsUUFBUTtBQUNYLFdBQUsscUJBQXFCO0FBQUEsUUFDeEIsT0FBTztBQUFBLFFBQ1AsT0FBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksS0FBSyxzQkFBc0IsS0FBSyxtQkFBbUIsVUFBVSxPQUFPO0FBQ3RFLGFBQU8sS0FBSyxtQkFBbUI7QUFBQSxJQUNqQztBQUVBLFVBQU0sUUFBUSxLQUNYLE1BQU0sSUFBSSxFQUNWLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLEVBQ3pCLE9BQU8sQ0FBQyxTQUFTLGlCQUFpQixLQUFLLElBQUksQ0FBQyxFQUM1QyxPQUFPLENBQUMsU0FBUyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsRUFDM0M7QUFDSCxTQUFLLHFCQUFxQjtBQUFBLE1BQ3hCO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNGOzs7QUMvREEsSUFBQUMsbUJBQTJCOzs7QUNBcEIsU0FBUyxpQkFBaUIsU0FBeUI7QUFDeEQsUUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixNQUFJLENBQUMsU0FBUztBQUNaLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsUUFBTSxTQUFTLHFCQUFxQixPQUFPO0FBQzNDLE1BQUksUUFBUTtBQUNWLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQSxPQUFPLGNBQWM7QUFBQSxNQUNyQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sU0FBUztBQUFBLE1BQ2hCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsSUFDdEIsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixFQUFFLEtBQUssSUFBSTtBQUNiO0FBRUEsU0FBUyxxQkFBcUIsU0FJckI7QUFDUCxRQUFNLGVBQXdFO0FBQUEsSUFDNUUsWUFBWSxDQUFDO0FBQUEsSUFDYixPQUFPLENBQUM7QUFBQSxJQUNSLGNBQWMsQ0FBQztBQUFBLEVBQ2pCO0FBQ0EsUUFBTSxnQkFBMEIsQ0FBQztBQUVqQyxNQUFJLGlCQUFtRDtBQUN2RCxNQUFJLGFBQWE7QUFFakIsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsUUFBUTtBQUM3QixVQUFNLFVBQVUsS0FBSyxNQUFNLDBDQUEwQztBQUNyRSxRQUFJLFNBQVM7QUFDWCx1QkFBaUJDLHNCQUFxQixRQUFRLENBQUMsQ0FBQztBQUNoRCxtQkFBYTtBQUNiO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxZQUFZO0FBQ2YsVUFBSSxLQUFLLEtBQUssR0FBRztBQUNmLHNCQUFjLEtBQUssSUFBSTtBQUFBLE1BQ3pCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxnQkFBZ0I7QUFDbEIsbUJBQWEsY0FBYyxFQUFFLEtBQUssSUFBSTtBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUVBLE1BQUksQ0FBQyxZQUFZO0FBQ2YsV0FBTztBQUFBLEVBQ1Q7QUFFQSxTQUFPO0FBQUEsSUFDTCxZQUFZQyxhQUFZLENBQUMsR0FBRyxlQUFlLEdBQUcsYUFBYSxVQUFVLENBQUM7QUFBQSxJQUN0RSxPQUFPQSxhQUFZLGFBQWEsS0FBSztBQUFBLElBQ3JDLFdBQVdBLGFBQVksYUFBYSxZQUFZLENBQUM7QUFBQSxFQUNuRDtBQUNGO0FBRUEsU0FBU0Qsc0JBQXFCLFNBSTVCO0FBQ0EsUUFBTSxhQUFhLFFBQVEsWUFBWTtBQUN2QyxNQUFJLGVBQWUsU0FBUztBQUMxQixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksZUFBZSxjQUFjO0FBQy9CLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBU0MsYUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FDdkdPLFNBQVMsc0JBQXNCLFNBQW1DO0FBQ3ZFLE1BQUksUUFBUSxlQUFlLFFBQVEsWUFBWSxTQUFTLEdBQUc7QUFDekQsVUFBTSxRQUFRLFFBQVEsWUFBWTtBQUNsQyxXQUFPLEdBQUcsUUFBUSxXQUFXLFdBQU0sS0FBSyxJQUFJLFVBQVUsSUFBSSxTQUFTLE9BQU87QUFBQSxFQUM1RTtBQUVBLE1BQUksUUFBUSxZQUFZO0FBQ3RCLFdBQU8sR0FBRyxRQUFRLFdBQVcsV0FBTSxRQUFRLFVBQVU7QUFBQSxFQUN2RDtBQUVBLFNBQU8sUUFBUTtBQUNqQjtBQUVPLFNBQVMsMkJBQTJCLFNBQXFDO0FBQzlFLFFBQU0sUUFBUSxDQUFDLG1CQUFtQixRQUFRLFdBQVcsRUFBRTtBQUV2RCxNQUFJLFFBQVEsWUFBWTtBQUN0QixVQUFNLEtBQUssaUJBQWlCLFFBQVEsVUFBVSxFQUFFO0FBQUEsRUFDbEQ7QUFFQSxNQUFJLFFBQVEsZUFBZSxRQUFRLFlBQVksU0FBUyxHQUFHO0FBQ3pELFVBQU0sS0FBSyxnQkFBZ0I7QUFDM0IsVUFBTSxVQUFVLFFBQVEsWUFBWSxNQUFNLEdBQUcsRUFBRTtBQUMvQyxlQUFXLFFBQVEsU0FBUztBQUMxQixZQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFBQSxJQUN4QjtBQUVBLFFBQUksUUFBUSxZQUFZLFNBQVMsUUFBUSxRQUFRO0FBQy9DLFlBQU0sS0FBSyxZQUFZLFFBQVEsWUFBWSxTQUFTLFFBQVEsTUFBTSxPQUFPO0FBQUEsSUFDM0U7QUFBQSxFQUNGO0FBRUEsTUFBSSxRQUFRLFdBQVc7QUFDckIsVUFBTTtBQUFBLE1BQ0osNEJBQTRCLFFBQVEsUUFBUSxvQkFBb0IsUUFBUSxjQUFjO0FBQUEsSUFDeEY7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNUO0FBRU8sU0FBUyx5QkFBeUIsU0FBcUM7QUFDNUUsUUFBTSxRQUFRLENBQUMsV0FBVyxRQUFRLFdBQVcsRUFBRTtBQUUvQyxNQUFJLFFBQVEsWUFBWTtBQUN0QixVQUFNLEtBQUssZ0JBQWdCLFFBQVEsVUFBVSxFQUFFO0FBQUEsRUFDakQ7QUFFQSxNQUFJLFFBQVEsZUFBZSxRQUFRLFlBQVksU0FBUyxHQUFHO0FBQ3pELFVBQU0sS0FBSyxlQUFlO0FBQzFCLFVBQU0sVUFBVSxRQUFRLFlBQVksTUFBTSxHQUFHLEVBQUU7QUFDL0MsZUFBVyxRQUFRLFNBQVM7QUFDMUIsWUFBTSxLQUFLLElBQUk7QUFBQSxJQUNqQjtBQUVBLFFBQUksUUFBUSxZQUFZLFNBQVMsUUFBUSxRQUFRO0FBQy9DLFlBQU0sS0FBSyxVQUFVLFFBQVEsWUFBWSxTQUFTLFFBQVEsTUFBTSxPQUFPO0FBQUEsSUFDekU7QUFBQSxFQUNGO0FBRUEsTUFBSSxRQUFRLFdBQVc7QUFDckIsVUFBTTtBQUFBLE1BQ0osd0JBQXdCLFFBQVEsUUFBUSxvQkFBb0IsUUFBUSxjQUFjO0FBQUEsSUFDcEY7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNUOzs7QUYzQk8sSUFBTSxpQkFBTixNQUFxQjtBQUFBLEVBQzFCLGNBQWM7QUFBQSxFQUFDO0FBQUEsRUFFZixNQUFNLFVBQVUsTUFBYyxVQUFnRDtBQUM1RSxVQUFNLFdBQVcsTUFBTSxLQUFLLG1CQUFtQixVQUFVO0FBQUEsTUFDdkQ7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFNBQ0U7QUFBQSxNQUNKO0FBQUEsTUFDQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxNQUNiO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTyxpQkFBaUIsUUFBUTtBQUFBLEVBQ2xDO0FBQUEsRUFFQSxNQUFNLGtCQUNKLFVBQ0EsU0FDQSxVQUNpQjtBQUNqQixVQUFNLFNBQVMsS0FBSyxZQUFZLFVBQVUsT0FBTztBQUNqRCxVQUFNLFdBQVcsTUFBTSxLQUFLLG1CQUFtQixVQUFVLE1BQU07QUFDL0QsV0FBTyxLQUFLLFVBQVUsVUFBVSxRQUFRO0FBQUEsRUFDMUM7QUFBQSxFQUVBLE1BQU0sVUFBVSxNQUFjLFVBQW9EO0FBQ2hGLFVBQU0sV0FBVyxNQUFNLEtBQUssbUJBQW1CLFVBQVU7QUFBQSxNQUN2RDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sU0FDRTtBQUFBLE1BQ0o7QUFBQSxNQUNBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGLEVBQUUsS0FBSyxJQUFJO0FBQUEsTUFDYjtBQUFBLElBQ0YsQ0FBQztBQUVELFVBQU0sVUFBVSxTQUFTLEtBQUssRUFBRSxZQUFZO0FBQzVDLFFBQUksWUFBWSxVQUFVLFlBQVksVUFBVSxZQUFZLFdBQVc7QUFDckUsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxlQUNKLFVBQ0EsU0FDQSxVQUNpQjtBQUNqQixVQUFNLFdBQVcsTUFBTSxLQUFLLG1CQUFtQixVQUFVO0FBQUEsTUFDdkQ7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFNBQ0U7QUFBQSxNQUNKO0FBQUEsTUFDQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQSxhQUFhLFFBQVE7QUFBQSxVQUNyQjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBLEdBQUcsMkJBQTJCLE9BQU87QUFBQSxVQUNyQztBQUFBLFVBQ0EsUUFBUTtBQUFBLFFBQ1YsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLElBQUk7QUFBQSxNQUNkO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTyw4QkFBOEIsUUFBUTtBQUFBLEVBQy9DO0FBQUEsRUFFQSxNQUFNLGdCQUNKLE9BQ0EsU0FDQSxVQUNpQjtBQUNqQixVQUFNLFdBQVcsTUFBTSxLQUFLLG1CQUFtQixVQUFVO0FBQUEsTUFDdkQ7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFNBQ0U7QUFBQSxNQUNKO0FBQUEsTUFDQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsNEJBQTRCLEtBQUs7QUFBQSxVQUNqQztBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0EsWUFBWSxLQUFLO0FBQUEsVUFDakI7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBLEdBQUcsMkJBQTJCLE9BQU87QUFBQSxVQUNyQztBQUFBLFVBQ0EsUUFBUTtBQUFBLFFBQ1YsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLElBQUk7QUFBQSxNQUNkO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTyx5QkFBeUIsUUFBUTtBQUFBLEVBQzFDO0FBQUEsRUFFQSxNQUFjLG1CQUNaLFVBQ0EsVUFDaUI7QUFDakIsUUFBSSxTQUFTLGVBQWUsVUFBVTtBQUNwQyxhQUFPLEtBQUsscUJBQXFCLFVBQVUsUUFBUTtBQUFBLElBQ3JEO0FBQ0EsV0FBTyxLQUFLLHFCQUFxQixVQUFVLFFBQVE7QUFBQSxFQUNyRDtBQUFBLEVBRUEsTUFBYyxxQkFDWixVQUNBLFVBQ2lCO0FBMU1yQjtBQTJNSSxVQUFNLGVBQWUsQ0FBQyxTQUFTLGlCQUFpQixTQUFTLGNBQWMsU0FBUyxnQkFBZ0I7QUFDaEcsUUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsS0FBSyxHQUFHO0FBQ2pELFlBQU0sSUFBSSxNQUFNLDJCQUEyQjtBQUFBLElBQzdDO0FBRUEsVUFBTSxVQUFrQztBQUFBLE1BQ3RDLGdCQUFnQjtBQUFBLElBQ2xCO0FBRUEsUUFBSSxTQUFTLGFBQWEsS0FBSyxHQUFHO0FBQ2hDLGNBQVEsZUFBZSxJQUFJLFVBQVUsU0FBUyxhQUFhLEtBQUssQ0FBQztBQUFBLElBQ25FO0FBRUEsVUFBTSxTQUFTLFVBQU0sNkJBQVc7QUFBQSxNQUM5QixLQUFLLFNBQVMsY0FBYyxLQUFLLEtBQUs7QUFBQSxNQUN0QyxRQUFRO0FBQUEsTUFDUjtBQUFBLE1BQ0EsTUFBTSxLQUFLLFVBQVU7QUFBQSxRQUNuQixPQUFPLFNBQVMsWUFBWSxLQUFLO0FBQUEsUUFDakM7QUFBQSxRQUNBLGFBQWE7QUFBQSxNQUNmLENBQUM7QUFBQSxJQUNILENBQUM7QUFFRCxVQUFNLE9BQU8sT0FBTztBQUNwQixVQUFNLFdBQVUsNEJBQUssWUFBTCxtQkFBZSxPQUFmLG1CQUFtQixZQUFuQixtQkFBNEIsWUFBNUIsWUFBdUM7QUFDdkQsUUFBSSxDQUFDLFFBQVEsS0FBSyxHQUFHO0FBQ25CLFlBQU0sSUFBSSxNQUFNLG1DQUFtQztBQUFBLElBQ3JEO0FBQ0EsV0FBTyxRQUFRLEtBQUs7QUFBQSxFQUN0QjtBQUFBLEVBRUEsTUFBYyxxQkFDWixVQUNBLFVBQ2lCO0FBOU9yQjtBQStPSSxRQUFJLENBQUMsU0FBUyxhQUFhLEtBQUssR0FBRztBQUNqQyxZQUFNLElBQUksTUFBTSwyQkFBMkI7QUFBQSxJQUM3QztBQUVBLFVBQU0sZ0JBQWdCLFNBQVMsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLFFBQVE7QUFDOUQsVUFBTSxlQUFlLFNBQVMsT0FBTyxDQUFDLE1BQU0sRUFBRSxTQUFTLFFBQVE7QUFHL0QsVUFBTSxXQUFXLGFBQWEsSUFBSSxDQUFDLE9BQU87QUFBQSxNQUN4QyxNQUFNLEVBQUUsU0FBUyxTQUFTLFNBQVM7QUFBQSxNQUNuQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDO0FBQUEsSUFDN0IsRUFBRTtBQUVGLFVBQU0sT0FBMEI7QUFBQSxNQUM5QjtBQUFBLE1BQ0Esa0JBQWtCO0FBQUEsUUFDaEIsYUFBYTtBQUFBLFFBQ2IsaUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxJQUNGO0FBRUEsUUFBSSxlQUFlO0FBQ2pCLFdBQUsscUJBQXFCO0FBQUEsUUFDeEIsT0FBTyxDQUFDLEVBQUUsTUFBTSxjQUFjLFFBQVEsQ0FBQztBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBUyxVQUFNLDZCQUFXO0FBQUEsTUFDOUIsS0FBSywyREFBMkQsU0FBUyxXQUFXLHdCQUF3QixTQUFTLFlBQVk7QUFBQSxNQUNqSSxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLE1BQ0EsTUFBTSxLQUFLLFVBQVUsSUFBSTtBQUFBLElBQzNCLENBQUM7QUFFRCxVQUFNLE9BQU8sT0FBTztBQUNwQixVQUFNLFdBQVUsd0NBQUssZUFBTCxtQkFBa0IsT0FBbEIsbUJBQXNCLFlBQXRCLG1CQUErQixVQUEvQixtQkFBdUMsT0FBdkMsbUJBQTJDLFNBQTNDLFlBQW1EO0FBQ25FLFFBQUksQ0FBQyxRQUFRLEtBQUssR0FBRztBQUNuQixZQUFNLElBQUksTUFBTSxtQ0FBbUM7QUFBQSxJQUNyRDtBQUNBLFdBQU8sUUFBUSxLQUFLO0FBQUEsRUFDdEI7QUFBQSxFQUVRLFlBQ04sVUFDQSxTQUNxRDtBQUNyRCxRQUFJLGFBQWEsaUJBQWlCO0FBQ2hDLGFBQU87QUFBQSxRQUNMO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixTQUNFO0FBQUEsUUFDSjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0EsR0FBRywyQkFBMkIsT0FBTztBQUFBLFlBQ3JDO0FBQUEsWUFDQSxRQUFRO0FBQUEsVUFDVixFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssSUFBSTtBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUksYUFBYSxzQkFBc0I7QUFDckMsYUFBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFNBQ0U7QUFBQSxRQUNKO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFlBQ1A7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0EsR0FBRywyQkFBMkIsT0FBTztBQUFBLFlBQ3JDO0FBQUEsWUFDQSxRQUFRO0FBQUEsVUFDVixFQUNHLE9BQU8sT0FBTyxFQUNkLEtBQUssSUFBSTtBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUksYUFBYSxxQkFBcUI7QUFDcEMsYUFBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFNBQ0U7QUFBQSxRQUNKO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFlBQ1A7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQSxHQUFHLDJCQUEyQixPQUFPO0FBQUEsWUFDckM7QUFBQSxZQUNBLFFBQVE7QUFBQSxVQUNWLEVBQ0csT0FBTyxPQUFPLEVBQ2QsS0FBSyxJQUFJO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsUUFBSSxhQUFhLDBCQUEwQjtBQUN6QyxhQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sU0FDRTtBQUFBLFFBQ0o7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixTQUFTO0FBQUEsWUFDUDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBLEdBQUcsMkJBQTJCLE9BQU87QUFBQSxZQUNyQztBQUFBLFlBQ0EsUUFBUTtBQUFBLFVBQ1YsRUFDRyxPQUFPLE9BQU8sRUFDZCxLQUFLLElBQUk7QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxRQUFJLGFBQWEsdUJBQXVCO0FBQ3RDLGFBQU87QUFBQSxRQUNMO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixTQUNFO0FBQUEsUUFDSjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQSxHQUFHLDJCQUEyQixPQUFPO0FBQUEsWUFDckM7QUFBQSxZQUNBLFFBQVE7QUFBQSxVQUNWLEVBQ0csT0FBTyxPQUFPLEVBQ2QsS0FBSyxJQUFJO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLE1BQ0w7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFNBQ0U7QUFBQSxNQUNKO0FBQUEsTUFDQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQSxHQUFHLDJCQUEyQixPQUFPO0FBQUEsVUFDckM7QUFBQSxVQUNBLFFBQVE7QUFBQSxRQUNWLEVBQ0csT0FBTyxPQUFPLEVBQ2QsS0FBSyxJQUFJO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFUSxVQUFVLFVBQTZCLFVBQTBCO0FBQ3ZFLFFBQUksYUFBYSxpQkFBaUI7QUFDaEMsYUFBTyw4QkFBOEIsUUFBUTtBQUFBLElBQy9DO0FBQ0EsUUFBSSxhQUFhLHFCQUFxQjtBQUNwQyxhQUFPLGtDQUFrQyxRQUFRO0FBQUEsSUFDbkQ7QUFDQSxRQUFJLGFBQWEsMEJBQTBCO0FBQ3pDLGFBQU8sNkJBQTZCLFFBQVE7QUFBQSxJQUM5QztBQUNBLFFBQUksYUFBYSxzQkFBc0I7QUFDckMsYUFBTyx5QkFBeUIsUUFBUTtBQUFBLElBQzFDO0FBQ0EsUUFBSSxhQUFhLHVCQUF1QjtBQUN0QyxhQUFPLDRCQUE0QixRQUFRO0FBQUEsSUFDN0M7QUFDQSxXQUFPLHlCQUF5QixRQUFRO0FBQUEsRUFDMUM7QUFDRjs7O0FHM2RBLElBQUFDLG1CQUE2QztBQUd0QyxJQUFNLG1CQUFOLE1BQXVCO0FBQUEsRUFDNUIsWUFBb0IsUUFBcUI7QUFBckI7QUFBQSxFQUFzQjtBQUFBLEVBRTFDLG1CQUFtQjtBQUNqQixTQUFLLE9BQU8sZ0NBQWdDLGNBQWMsT0FBTyxTQUErQjtBQUM5RixZQUFNLEVBQUUsVUFBVSxNQUFNLElBQUk7QUFFNUIsVUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPO0FBQ3ZCLFlBQUksd0JBQU8sNkNBQTZDO0FBQ3hEO0FBQUEsTUFDRjtBQUVBLFVBQUksYUFBYSxZQUFZLGFBQWEsVUFBVTtBQUNsRCxZQUFJLHdCQUFPLHdDQUF3QztBQUNuRDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLE1BQU0sU0FBUyxNQUFNLE1BQU0sU0FBUyxLQUFLO0FBQzNDLFlBQUksd0JBQU8sNkJBQTZCO0FBQ3hDO0FBQUEsTUFDRjtBQUVBLFVBQUksYUFBYSxVQUFVO0FBQ3pCLGFBQUssT0FBTyxTQUFTLGVBQWU7QUFDcEMsWUFBSSx3QkFBTywwQ0FBMEM7QUFBQSxNQUN2RCxPQUFPO0FBQ0wsYUFBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxZQUFJLHdCQUFPLDBDQUEwQztBQUFBLE1BQ3ZEO0FBRUEsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixXQUFLLE9BQU8sSUFBSSxVQUFVLFFBQVEsd0JBQXdCO0FBQUEsSUFDNUQsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLE1BQU0sTUFBTSxVQUErQjtBQUN6QyxRQUFJLE1BQU07QUFDVixRQUFJLGFBQWEsVUFBVTtBQUN6QixZQUFNO0FBQ04sVUFBSSx3QkFBTyx5REFBeUQ7QUFBQSxJQUN0RSxXQUFXLGFBQWEsVUFBVTtBQUNoQyxZQUFNO0FBQ04sVUFBSSx3QkFBTyxnQ0FBZ0M7QUFBQSxJQUM3QztBQUVBLFdBQU8sS0FBSyxHQUFHO0FBQUEsRUFDakI7QUFDRjs7O0FDbERBLElBQUFDLG1CQU1PO0FBSUEsSUFBTSxlQUFOLE1BQW1CO0FBQUEsRUFDeEIsWUFBNkIsS0FBVTtBQUFWO0FBQUEsRUFBVztBQUFBLEVBRXhDLE1BQU0sbUJBQW1CLFVBQThDO0FBQ3JFLFVBQU0sS0FBSyxhQUFhLFNBQVMsYUFBYTtBQUM5QyxVQUFNLEtBQUssYUFBYSxTQUFTLFdBQVc7QUFDNUMsVUFBTSxLQUFLLGFBQWEsU0FBUyxlQUFlO0FBQ2hELFVBQU0sS0FBSyxhQUFhLFNBQVMsYUFBYTtBQUM5QyxVQUFNLEtBQUssYUFBYSxhQUFhLFNBQVMsU0FBUyxDQUFDO0FBQ3hELFVBQU0sS0FBSyxhQUFhLGFBQWEsU0FBUyxTQUFTLENBQUM7QUFBQSxFQUMxRDtBQUFBLEVBRUEsTUFBTSxhQUFhLFlBQW1DO0FBQ3BELFVBQU0saUJBQWEsZ0NBQWMsVUFBVSxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQy9ELFFBQUksQ0FBQyxZQUFZO0FBQ2Y7QUFBQSxJQUNGO0FBRUEsVUFBTSxXQUFXLFdBQVcsTUFBTSxHQUFHLEVBQUUsT0FBTyxPQUFPO0FBQ3JELFFBQUksVUFBVTtBQUNkLGVBQVcsV0FBVyxVQUFVO0FBQzlCLGdCQUFVLFVBQVUsR0FBRyxPQUFPLElBQUksT0FBTyxLQUFLO0FBQzlDLFlBQU0sV0FBVyxLQUFLLElBQUksTUFBTSxzQkFBc0IsT0FBTztBQUM3RCxVQUFJLENBQUMsVUFBVTtBQUNiLGNBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxPQUFPO0FBQUEsTUFDM0MsV0FBVyxFQUFFLG9CQUFvQiwyQkFBVTtBQUN6QyxjQUFNLElBQUksTUFBTSxvQ0FBb0MsT0FBTyxFQUFFO0FBQUEsTUFDL0Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxXQUFXLFVBQWtCLGlCQUFpQixJQUFvQjtBQUN0RSxVQUFNLGlCQUFhLGdDQUFjLFFBQVE7QUFDekMsVUFBTSxXQUFXLEtBQUssSUFBSSxNQUFNLHNCQUFzQixVQUFVO0FBQ2hFLFFBQUksb0JBQW9CLHdCQUFPO0FBQzdCLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxVQUFVO0FBQ1osWUFBTSxJQUFJLE1BQU0sa0NBQWtDLFVBQVUsRUFBRTtBQUFBLElBQ2hFO0FBRUEsVUFBTSxLQUFLLGFBQWEsYUFBYSxVQUFVLENBQUM7QUFDaEQsV0FBTyxLQUFLLElBQUksTUFBTSxPQUFPLFlBQVksY0FBYztBQUFBLEVBQ3pEO0FBQUEsRUFFQSxNQUFNLFNBQVMsVUFBbUM7QUFDaEQsVUFBTSxPQUFPLEtBQUssSUFBSSxNQUFNLDBCQUFzQixnQ0FBYyxRQUFRLENBQUM7QUFDekUsUUFBSSxFQUFFLGdCQUFnQix5QkFBUTtBQUM1QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU8sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQUEsRUFDakM7QUFBQSxFQUVBLE1BQU0sa0JBQWtCLFVBSXJCO0FBQ0QsVUFBTSxPQUFPLEtBQUssSUFBSSxNQUFNLDBCQUFzQixnQ0FBYyxRQUFRLENBQUM7QUFDekUsUUFBSSxFQUFFLGdCQUFnQix5QkFBUTtBQUM1QixhQUFPO0FBQUEsUUFDTCxNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsUUFDUCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsTUFDTCxNQUFNLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQUEsTUFDcEMsT0FBTyxLQUFLLEtBQUs7QUFBQSxNQUNqQixRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sV0FBVyxVQUFrQixTQUFpQztBQUNsRSxVQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVcsUUFBUTtBQUMzQyxVQUFNLFVBQVUsTUFBTSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUk7QUFDOUMsVUFBTSxvQkFBb0IsUUFBUSxTQUFTLElBQUksSUFBSSxVQUFVLEdBQUcsT0FBTztBQUFBO0FBQ3ZFLFVBQU0sWUFBWSxRQUFRLFdBQVcsSUFDakMsS0FDQSxRQUFRLFNBQVMsTUFBTSxJQUNyQixLQUNBLFFBQVEsU0FBUyxJQUFJLElBQ25CLE9BQ0E7QUFDUixVQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sTUFBTSxHQUFHLE9BQU8sR0FBRyxTQUFTLEdBQUcsaUJBQWlCLEVBQUU7QUFDOUUsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sWUFBWSxVQUFrQixTQUFpQztBQUNuRSxVQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVcsUUFBUTtBQUMzQyxVQUFNLG9CQUFvQixRQUFRLFNBQVMsSUFBSSxJQUFJLFVBQVUsR0FBRyxPQUFPO0FBQUE7QUFDdkUsVUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLE1BQU0saUJBQWlCO0FBQ25ELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLHFCQUFxQixVQUFtQztBQUM1RCxVQUFNLGlCQUFhLGdDQUFjLFFBQVE7QUFDekMsUUFBSSxDQUFDLEtBQUssSUFBSSxNQUFNLHNCQUFzQixVQUFVLEdBQUc7QUFDckQsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFdBQVcsV0FBVyxZQUFZLEdBQUc7QUFDM0MsVUFBTSxPQUFPLGFBQWEsS0FBSyxhQUFhLFdBQVcsTUFBTSxHQUFHLFFBQVE7QUFDeEUsVUFBTSxZQUFZLGFBQWEsS0FBSyxLQUFLLFdBQVcsTUFBTSxRQUFRO0FBRWxFLFFBQUksVUFBVTtBQUNkLFdBQU8sTUFBTTtBQUNYLFlBQU0sWUFBWSxHQUFHLElBQUksSUFBSSxPQUFPLEdBQUcsU0FBUztBQUNoRCxVQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFNBQVMsR0FBRztBQUNwRCxlQUFPO0FBQUEsTUFDVDtBQUNBLGlCQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sb0JBQW9CLFVBQWtCLFNBQWlDO0FBQzNFLFVBQU0sT0FBTyxNQUFNLEtBQUssV0FBVyxVQUFVLEtBQUssT0FBTztBQUFBO0FBQUEsQ0FBTTtBQUMvRCxVQUFNLE9BQU8sTUFBTSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUk7QUFDM0MsUUFBSSxDQUFDLEtBQUssS0FBSyxHQUFHO0FBQ2hCLFlBQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxNQUFNLEtBQUssT0FBTztBQUFBO0FBQUEsQ0FBTTtBQUFBLElBQ3REO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sb0JBQXNDO0FBQzFDLFdBQU8sS0FBSyxJQUFJLE1BQU0saUJBQWlCO0FBQUEsRUFDekM7QUFDRjtBQUVBLFNBQVMsYUFBYSxVQUEwQjtBQUM5QyxRQUFNLGlCQUFhLGdDQUFjLFFBQVE7QUFDekMsUUFBTSxRQUFRLFdBQVcsWUFBWSxHQUFHO0FBQ3hDLFNBQU8sVUFBVSxLQUFLLEtBQUssV0FBVyxNQUFNLEdBQUcsS0FBSztBQUN0RDs7O0FDaEpBLElBQUFDLG9CQUE0QztBQVVyQyxJQUFNLGNBQU4sY0FBMEIsd0JBQU07QUFBQSxFQUtyQyxZQUFZLEtBQTJCLFNBQTZCO0FBQ2xFLFVBQU0sR0FBRztBQUQ0QjtBQUh2QyxTQUFRLFVBQVU7QUFBQSxFQUtsQjtBQUFBLEVBRUEsYUFBcUM7QUFDbkMsV0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzlCLFdBQUssVUFBVTtBQUNmLFdBQUssS0FBSztBQUFBLElBQ1osQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFNBQWU7QUExQmpCO0FBMkJJLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLGNBQVUsU0FBUyxhQUFhO0FBQ2hDLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLFFBQVEsTUFBTSxDQUFDO0FBRXJELFFBQUksS0FBSyxRQUFRLFdBQVc7QUFDMUIsWUFBTSxXQUFXLFVBQVUsU0FBUyxZQUFZO0FBQUEsUUFDOUMsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLFVBQ0osY0FBYSxVQUFLLFFBQVEsZ0JBQWIsWUFBNEI7QUFBQSxVQUN6QyxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0YsQ0FBQztBQUNELGVBQVMsaUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQzlDLFlBQUksTUFBTSxRQUFRLFlBQVksTUFBTSxXQUFXLE1BQU0sVUFBVTtBQUM3RCxnQkFBTSxlQUFlO0FBQ3JCLGVBQUssS0FBSyxPQUFPO0FBQUEsUUFDbkI7QUFBQSxNQUNGLENBQUM7QUFDRCxXQUFLLFVBQVU7QUFBQSxJQUNqQixPQUFPO0FBQ0wsWUFBTSxRQUFRLFVBQVUsU0FBUyxTQUFTO0FBQUEsUUFDeEMsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLFVBQ0osY0FBYSxVQUFLLFFBQVEsZ0JBQWIsWUFBNEI7QUFBQSxVQUN6QyxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0YsQ0FBQztBQUNELFlBQU0saUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQzNDLFlBQUksTUFBTSxRQUFRLFNBQVM7QUFDekIsZ0JBQU0sZUFBZTtBQUNyQixlQUFLLEtBQUssT0FBTztBQUFBLFFBQ25CO0FBQUEsTUFDRixDQUFDO0FBQ0QsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFFQSxTQUFLLFFBQVEsTUFBTTtBQUVuQixRQUFJLDBCQUFRLFNBQVMsRUFDbEI7QUFBQSxNQUFVLENBQUMsV0FBUTtBQW5FMUIsWUFBQUM7QUFvRVEsc0JBQU8sZUFBY0EsTUFBQSxLQUFLLFFBQVEsZ0JBQWIsT0FBQUEsTUFBNEIsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLE1BQU07QUFDaEYsZUFBSyxLQUFLLE9BQU87QUFBQSxRQUNuQixDQUFDO0FBQUE7QUFBQSxJQUNILEVBQ0M7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLGNBQWMsUUFBUSxFQUFFLFFBQVEsTUFBTTtBQUMzQyxhQUFLLE9BQU8sSUFBSTtBQUFBLE1BQ2xCLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDSjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUNyQixRQUFJLENBQUMsS0FBSyxTQUFTO0FBQ2pCLFdBQUssT0FBTyxJQUFJO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLFNBQXdCO0FBQ3BDLFVBQU0sUUFBUSxxQkFBcUIsS0FBSyxRQUFRLEtBQUssRUFBRSxLQUFLO0FBQzVELFFBQUksQ0FBQyxPQUFPO0FBQ1YsVUFBSSx5QkFBTyx3QkFBd0I7QUFDbkM7QUFBQSxJQUNGO0FBQ0EsU0FBSyxPQUFPLEtBQUs7QUFBQSxFQUNuQjtBQUFBLEVBRVEsT0FBTyxPQUE0QjtBQUN6QyxRQUFJLEtBQUssU0FBUztBQUNoQjtBQUFBLElBQ0Y7QUFDQSxTQUFLLFVBQVU7QUFDZixTQUFLLFFBQVEsS0FBSztBQUNsQixTQUFLLE1BQU07QUFBQSxFQUNiO0FBQ0Y7QUFFTyxJQUFNLGNBQU4sY0FBMEIsd0JBQU07QUFBQSxFQUNyQyxZQUNFLEtBQ2lCLFdBQ0EsVUFDakI7QUFDQSxVQUFNLEdBQUc7QUFIUTtBQUNBO0FBQUEsRUFHbkI7QUFBQSxFQUVBLFNBQWU7QUFDYixVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsTUFBTTtBQUNoQixjQUFVLFNBQVMsYUFBYTtBQUNoQyxjQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxVQUFVLENBQUM7QUFDakQsY0FBVSxTQUFTLE9BQU87QUFBQSxNQUN4QixLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUs7QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNIO0FBQ0Y7OztBQzVIQSxJQUFBQyxvQkFBMEM7QUFZbkMsSUFBTSx1QkFBTixjQUFtQyx3QkFBTTtBQUFBLEVBTTlDLFlBQ0UsS0FDaUIsT0FDQSxTQUNqQjtBQUNBLFVBQU0sR0FBRztBQUhRO0FBQ0E7QUFQbkIsU0FBUSxVQUFVO0FBRWxCLFNBQVEsT0FBa0IsQ0FBQztBQUFBLEVBUTNCO0FBQUEsRUFFQSxhQUFzQztBQUNwQyxXQUFPLElBQUksUUFBUSxDQUFDLFlBQVk7QUFDOUIsV0FBSyxVQUFVO0FBQ2YsV0FBSyxLQUFLO0FBQUEsSUFDWixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsU0FBZTtBQUNiLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLGNBQVUsU0FBUyxhQUFhO0FBQ2hDLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLFFBQVEsTUFBTSxDQUFDO0FBQ3JELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFNBQUssY0FBYyxVQUFVLFNBQVMsU0FBUztBQUFBLE1BQzdDLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxRQUNKLGFBQWE7QUFBQSxRQUNiLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRixDQUFDO0FBQ0QsU0FBSyxZQUFZLGlCQUFpQixTQUFTLE1BQU07QUFDL0MsV0FBSyxXQUFXLEtBQUssWUFBWSxLQUFLO0FBQUEsSUFDeEMsQ0FBQztBQUVELFVBQU0sT0FBTyxVQUFVLFNBQVMsT0FBTztBQUFBLE1BQ3JDLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFFRCxlQUFXLFFBQVEsS0FBSyxPQUFPO0FBQzdCLFlBQU0sTUFBTSxLQUFLLFNBQVMsU0FBUztBQUFBLFFBQ2pDLEtBQUs7QUFBQSxNQUNQLENBQUM7QUFDRCxZQUFNLFdBQVcsSUFBSSxTQUFTLFNBQVM7QUFBQSxRQUNyQyxNQUFNO0FBQUEsTUFDUixDQUFDO0FBQ0QsVUFBSSxTQUFTLFFBQVE7QUFBQSxRQUNuQixNQUFNLEtBQUs7QUFBQSxNQUNiLENBQUM7QUFDRCxXQUFLLEtBQUssS0FBSyxFQUFFLE1BQU0sVUFBVSxJQUFJLENBQUM7QUFBQSxJQUN4QztBQUVBLFVBQU0sVUFBVSxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDckUsWUFBUSxTQUFTLFVBQVU7QUFBQSxNQUN6QixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxZQUFNLFdBQVcsS0FBSyxLQUNuQixPQUFPLENBQUMsUUFBUSxJQUFJLFNBQVMsT0FBTyxFQUNwQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUk7QUFDeEIsVUFBSSxDQUFDLFNBQVMsUUFBUTtBQUNwQixZQUFJLHlCQUFPLDBCQUEwQjtBQUNyQztBQUFBLE1BQ0Y7QUFDQSxXQUFLLE9BQU8sUUFBUTtBQUFBLElBQ3RCLENBQUM7QUFFRCxZQUFRLFNBQVMsVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLFdBQUssT0FBTyxJQUFJO0FBQUEsSUFDbEIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsU0FBSyxVQUFVLE1BQU07QUFDckIsUUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQixXQUFLLE9BQU8sSUFBSTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUFBLEVBRVEsV0FBVyxPQUFxQjtBQUN0QyxVQUFNLFFBQVEsTUFBTSxLQUFLLEVBQUUsWUFBWTtBQUN2QyxlQUFXLE9BQU8sS0FBSyxNQUFNO0FBQzNCLFlBQU0sUUFBUSxDQUFDLFNBQVMsSUFBSSxLQUFLLEtBQUssWUFBWSxFQUFFLFNBQVMsS0FBSztBQUNsRSxVQUFJLElBQUksTUFBTSxVQUFVLFFBQVEsS0FBSztBQUFBLElBQ3ZDO0FBQUEsRUFDRjtBQUFBLEVBRVEsT0FBTyxPQUE2QjtBQUMxQyxRQUFJLEtBQUssU0FBUztBQUNoQjtBQUFBLElBQ0Y7QUFDQSxTQUFLLFVBQVU7QUFDZixTQUFLLFFBQVEsS0FBSztBQUNsQixTQUFLLE1BQU07QUFBQSxFQUNiO0FBQ0Y7OztBQ3BIQSxJQUFBQyxvQkFBNEM7OztBQ0E1QyxJQUFBQyxvQkFBdUI7QUFPaEIsU0FBUyxVQUFVLE9BQWdCLGdCQUE4QjtBQUN0RSxVQUFRLE1BQU0sS0FBSztBQUNuQixRQUFNLFVBQVUsaUJBQWlCLFFBQVEsTUFBTSxVQUFVO0FBQ3pELE1BQUkseUJBQU8sT0FBTztBQUNwQjs7O0FESE8sSUFBTSxtQkFBTixjQUErQix3QkFBTTtBQUFBLEVBcUIxQyxZQUNFLEtBQ2lCLFNBQ0EsZUFDQSxrQkFDakI7QUFDQSxVQUFNLEdBQUc7QUFKUTtBQUNBO0FBQ0E7QUF4Qm5CLFNBQVEsZUFBZTtBQUN2QixTQUFpQixnQkFBZ0IsQ0FBQyxVQUErQjtBQUMvRCxVQUFJLE1BQU0sV0FBVyxNQUFNLFdBQVcsTUFBTSxRQUFRO0FBQ2xEO0FBQUEsTUFDRjtBQUVBLFlBQU0sU0FBUyxNQUFNO0FBQ3JCLFVBQUksV0FBVyxPQUFPLFlBQVksV0FBVyxPQUFPLFlBQVksYUFBYTtBQUMzRTtBQUFBLE1BQ0Y7QUFFQSxZQUFNLFNBQVMsWUFBWSxNQUFNLEdBQUc7QUFDcEMsVUFBSSxDQUFDLFFBQVE7QUFDWDtBQUFBLE1BQ0Y7QUFFQSxZQUFNLGVBQWU7QUFDckIsV0FBSyxLQUFLLGFBQWEsTUFBTTtBQUFBLElBQy9CO0FBQUEsRUFTQTtBQUFBLEVBRUEsU0FBZTtBQUNiLFdBQU8saUJBQWlCLFdBQVcsS0FBSyxhQUFhO0FBQ3JELFNBQUssT0FBTztBQUFBLEVBQ2Q7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsV0FBTyxvQkFBb0IsV0FBVyxLQUFLLGFBQWE7QUFDeEQsU0FBSyxVQUFVLE1BQU07QUFBQSxFQUN2QjtBQUFBLEVBRVEsU0FBZTtBQUNyQixTQUFLLFVBQVUsTUFBTTtBQUNyQixTQUFLLFVBQVUsU0FBUyxhQUFhO0FBQ3JDLFNBQUssVUFBVSxTQUFTLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRXZELFFBQUksQ0FBQyxLQUFLLFFBQVEsUUFBUTtBQUN4QixXQUFLLFVBQVUsU0FBUyxLQUFLLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRTtBQUFBLElBQ0Y7QUFFQSxVQUFNLFFBQVEsS0FBSyxRQUFRLEtBQUssWUFBWTtBQUM1QyxTQUFLLFVBQVUsU0FBUyxPQUFPO0FBQUEsTUFDN0IsTUFBTSxTQUFTLEtBQUssZUFBZSxDQUFDLE9BQU8sS0FBSyxRQUFRLE1BQU07QUFBQSxJQUNoRSxDQUFDO0FBQ0QsU0FBSyxVQUFVLFNBQVMsTUFBTTtBQUFBLE1BQzVCLE1BQU0sTUFBTSxXQUFXO0FBQUEsSUFDekIsQ0FBQztBQUNELFNBQUssVUFBVSxTQUFTLE9BQU87QUFBQSxNQUM3QixLQUFLO0FBQUEsTUFDTCxNQUFNLE1BQU0sUUFBUSxNQUFNLFdBQVc7QUFBQSxJQUN2QyxDQUFDO0FBQ0QsU0FBSyxVQUFVLFNBQVMsS0FBSztBQUFBLE1BQzNCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLFlBQVksS0FBSyxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDNUUsU0FBSyxVQUFVLFdBQVcsaUJBQWlCLE1BQU07QUFDakQsU0FBSyxVQUFVLFdBQVcsbUJBQW1CLE1BQU07QUFDbkQsU0FBSyxVQUFVLFdBQVcscUJBQXFCLFNBQVM7QUFDeEQsU0FBSyxVQUFVLFdBQVcsbUJBQW1CLE1BQU07QUFDbkQsU0FBSyxVQUFVLFdBQVcsUUFBUSxNQUFNO0FBQUEsRUFDMUM7QUFBQSxFQUVRLFVBQVUsV0FBd0IsT0FBZSxRQUE0QjtBQUNuRixjQUFVLFNBQVMsVUFBVTtBQUFBLE1BQzNCLEtBQUssV0FBVyxTQUFTLHNDQUFzQztBQUFBLE1BQy9ELE1BQU07QUFBQSxJQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLFdBQUssS0FBSyxhQUFhLE1BQU07QUFBQSxJQUMvQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsTUFBYyxhQUFhLFFBQXFDO0FBQzlELFVBQU0sUUFBUSxLQUFLLFFBQVEsS0FBSyxZQUFZO0FBQzVDLFFBQUksQ0FBQyxPQUFPO0FBQ1YsV0FBSyxNQUFNO0FBQ1g7QUFBQSxJQUNGO0FBRUEsUUFBSTtBQUNGLFVBQUksVUFBVTtBQUNkLFVBQUksV0FBVyxRQUFRO0FBQ3JCLGtCQUFVLE1BQU0sS0FBSyxjQUFjLGNBQWMsS0FBSztBQUFBLE1BQ3hELFdBQVcsV0FBVyxXQUFXO0FBQy9CLGtCQUFVLE1BQU0sS0FBSyxjQUFjLGdCQUFnQixLQUFLO0FBQUEsTUFDMUQsV0FBVyxXQUFXLFFBQVE7QUFDNUIsa0JBQVUsTUFBTSxLQUFLLGNBQWMsY0FBYyxLQUFLO0FBQUEsTUFDeEQsV0FBVyxXQUFXLFFBQVE7QUFDNUIsa0JBQVUsTUFBTSxLQUFLLGNBQWMsVUFBVSxLQUFLO0FBQUEsTUFDcEQsT0FBTztBQUNMLGtCQUFVLE1BQU0sS0FBSyxjQUFjLFVBQVUsS0FBSztBQUFBLE1BQ3BEO0FBRUEsVUFBSTtBQUNGLFlBQUksS0FBSyxrQkFBa0I7QUFDekIsZ0JBQU0sS0FBSyxpQkFBaUIsT0FBTztBQUFBLFFBQ3JDLE9BQU87QUFDTCxjQUFJLHlCQUFPLE9BQU87QUFBQSxRQUNwQjtBQUFBLE1BQ0YsU0FBUyxPQUFPO0FBQ2Qsa0JBQVUsT0FBTyxpQ0FBaUM7QUFBQSxNQUNwRDtBQUVBLFdBQUssZ0JBQWdCO0FBRXJCLFVBQUksS0FBSyxnQkFBZ0IsS0FBSyxRQUFRLFFBQVE7QUFDNUMsWUFBSSx5QkFBTyx1QkFBdUI7QUFDbEMsYUFBSyxNQUFNO0FBQ1g7QUFBQSxNQUNGO0FBRUEsV0FBSyxPQUFPO0FBQUEsSUFDZCxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLCtCQUErQjtBQUFBLElBQ2xEO0FBQUEsRUFDRjtBQUNGO0FBRUEsU0FBUyxZQUFZLEtBQWtDO0FBQ3JELFVBQVEsSUFBSSxZQUFZLEdBQUc7QUFBQSxJQUN6QixLQUFLO0FBQ0gsYUFBTztBQUFBLElBQ1QsS0FBSztBQUNILGFBQU87QUFBQSxJQUNULEtBQUs7QUFDSCxhQUFPO0FBQUEsSUFDVCxLQUFLO0FBQ0gsYUFBTztBQUFBLElBQ1QsS0FBSztBQUNILGFBQU87QUFBQSxJQUNUO0FBQ0UsYUFBTztBQUFBLEVBQ1g7QUFDRjs7O0FFdkpBLElBQUFDLG9CQUFvQztBQVM3QixJQUFNLHFCQUFOLGNBQWlDLHdCQUFNO0FBQUEsRUFJNUMsWUFDRSxLQUNpQixTQUNqQjtBQUNBLFVBQU0sR0FBRztBQUZRO0FBSm5CLFNBQVEsVUFBVTtBQUFBLEVBT2xCO0FBQUEsRUFFQSxhQUE0QztBQUMxQyxXQUFPLElBQUksUUFBUSxDQUFDLFlBQVk7QUFDOUIsV0FBSyxVQUFVO0FBQ2YsV0FBSyxLQUFLO0FBQUEsSUFDWixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsU0FBZTtBQUNiLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLGNBQVUsU0FBUyxhQUFhO0FBQ2hDLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLFFBQVEsTUFBTSxDQUFDO0FBQ3JELGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFFBQUksMEJBQVEsU0FBUyxFQUNsQjtBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sY0FBYyxjQUFjLEVBQUUsT0FBTyxFQUFFLFFBQVEsTUFBTTtBQUMxRCxhQUFLLE9BQU8sTUFBTTtBQUFBLE1BQ3BCLENBQUM7QUFBQSxJQUNILEVBQ0M7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLGNBQWMsZ0JBQWdCLEVBQUUsUUFBUSxNQUFNO0FBQ25ELGFBQUssT0FBTyxPQUFPO0FBQUEsTUFDckIsQ0FBQztBQUFBLElBQ0gsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sY0FBYyxnQkFBZ0IsRUFBRSxRQUFRLE1BQU07QUFDbkQsYUFBSyxPQUFPLFFBQVE7QUFBQSxNQUN0QixDQUFDO0FBQUEsSUFDSCxFQUNDO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxjQUFjLGNBQWMsRUFBRSxRQUFRLE1BQU07QUFDakQsYUFBSyxPQUFPLE9BQU87QUFBQSxNQUNyQixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0o7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsU0FBSyxVQUFVLE1BQU07QUFDckIsUUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQixXQUFLLE9BQU8sSUFBSTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUFBLEVBRVEsT0FBTyxPQUFtQztBQUNoRCxRQUFJLEtBQUssU0FBUztBQUNoQjtBQUFBLElBQ0Y7QUFDQSxTQUFLLFVBQVU7QUFDZixTQUFLLFFBQVEsS0FBSztBQUNsQixTQUFLLE1BQU07QUFBQSxFQUNiO0FBQ0Y7OztBQzFFQSxJQUFBQyxvQkFBMEM7QUFLbkMsSUFBTSxxQkFBTixjQUFpQyx3QkFBTTtBQUFBLEVBQzVDLFlBQ0UsS0FDaUIsU0FDQSxRQUNqQjtBQUNBLFVBQU0sR0FBRztBQUhRO0FBQ0E7QUFBQSxFQUduQjtBQUFBLEVBRUEsU0FBZTtBQUNiLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLGNBQVUsU0FBUyxhQUFhO0FBQ2hDLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVuRCxRQUFJLENBQUMsS0FBSyxRQUFRLFFBQVE7QUFDeEIsZ0JBQVUsU0FBUyxLQUFLLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUN6RDtBQUFBLElBQ0Y7QUFFQSxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxlQUFXLFNBQVMsS0FBSyxTQUFTO0FBQ2hDLFlBQU0sTUFBTSxVQUFVLFNBQVMsV0FBVyxFQUFFLEtBQUssZ0JBQWdCLENBQUM7QUFDbEUsVUFBSSxTQUFTLE1BQU0sRUFBRSxNQUFNLE1BQU0sV0FBVyxnQkFBZ0IsQ0FBQztBQUM3RCxVQUFJLFNBQVMsS0FBSztBQUFBLFFBQ2hCLE1BQU0sR0FBRyxNQUFNLFNBQVMsV0FBTSxNQUFNLE1BQU07QUFBQSxNQUM1QyxDQUFDO0FBQ0QsVUFBSSxTQUFTLE9BQU87QUFBQSxRQUNsQixLQUFLO0FBQUEsUUFDTCxNQUFNLE1BQU0sV0FBVztBQUFBLE1BQ3pCLENBQUM7QUFFRCxZQUFNLFVBQVUsSUFBSSxTQUFTLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQy9ELGNBQVEsU0FBUyxVQUFVO0FBQUEsUUFDekIsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLE1BQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsYUFBSyxLQUFLLFFBQVEsTUFBTSxVQUFVO0FBQUEsTUFDcEMsQ0FBQztBQUNELGNBQVEsU0FBUyxVQUFVO0FBQUEsUUFDekIsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLE1BQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsYUFBSyxLQUFLLFlBQVksS0FBSztBQUFBLE1BQzdCLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxNQUFjLFFBQVEsTUFBNkI7QUE1RHJEO0FBNkRJLFVBQU0sZUFBZSxLQUFLLElBQUksTUFBTSxzQkFBc0IsSUFBSTtBQUM5RCxRQUFJLEVBQUUsd0JBQXdCLDBCQUFRO0FBQ3BDLFVBQUkseUJBQU8sMkJBQTJCO0FBQ3RDO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBTyxVQUFLLElBQUksVUFBVSxRQUFRLEtBQUssTUFBaEMsWUFBcUMsS0FBSyxJQUFJLFVBQVUsYUFBYSxLQUFLO0FBQ3ZGLFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSx5QkFBTywyQkFBMkI7QUFDdEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxLQUFLLFNBQVMsWUFBWTtBQUNoQyxTQUFLLElBQUksVUFBVSxXQUFXLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRUEsTUFBYyxZQUFZLE9BQXNDO0FBQzlELFFBQUk7QUFDRixZQUFNLFVBQVUsTUFBTSxLQUFLLE9BQU8sa0JBQWtCLEtBQUs7QUFDekQsVUFBSSx5QkFBTyxPQUFPO0FBQ2xCLFdBQUssTUFBTTtBQUFBLElBQ2IsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTywrQkFBK0I7QUFBQSxJQUNsRDtBQUFBLEVBQ0Y7QUFDRjs7O0FDdEZBLElBQUFDLG9CQUFtQztBQWU1QixJQUFNLHVCQUFOLGNBQW1DLHdCQUFNO0FBQUEsRUFJOUMsWUFDRSxLQUNpQixTQUNqQjtBQUNBLFVBQU0sR0FBRztBQUZRO0FBTG5CLFNBQVEsVUFBVTtBQUNsQixTQUFRLFVBQStCLENBQUM7QUFBQSxFQU94QztBQUFBLEVBRUEsU0FBZTtBQUNiLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBQ2hCLGNBQVUsU0FBUyxhQUFhO0FBQ2hDLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxTQUFTLEtBQUssUUFBUSxPQUFPLEtBQUssR0FBRyxDQUFDO0FBRXZFLGNBQVUsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTSxXQUFXLEtBQUssUUFBUSxPQUFPLE1BQU07QUFBQSxJQUM3QyxDQUFDO0FBQ0QsUUFBSSxLQUFLLFFBQVEsT0FBTyxZQUFZO0FBQ2xDLGdCQUFVLFNBQVMsS0FBSztBQUFBLFFBQ3RCLE1BQU0sV0FBVyxLQUFLLFFBQVEsT0FBTyxVQUFVO0FBQUEsTUFDakQsQ0FBQztBQUFBLElBQ0g7QUFDQSxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU0sWUFBWSxzQkFBc0IsS0FBSyxRQUFRLE9BQU8sQ0FBQztBQUFBLElBQy9ELENBQUM7QUFDRCxjQUFVLFNBQVMsS0FBSztBQUFBLE1BQ3RCLE1BQU0sS0FBSyxRQUFRLFFBQVEsWUFDdkIsd0JBQXdCLEtBQUssUUFBUSxRQUFRLFFBQVEsb0JBQW9CLEtBQUssUUFBUSxRQUFRLGNBQWMsTUFDNUcsbUJBQW1CLEtBQUssUUFBUSxRQUFRLGNBQWM7QUFBQSxJQUM1RCxDQUFDO0FBRUQsY0FBVSxTQUFTLE9BQU87QUFBQSxNQUN4QixLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUssUUFBUSxPQUFPO0FBQUEsSUFDNUIsQ0FBQztBQUVELFFBQUksS0FBSyxRQUFRLFdBQVc7QUFBQSxJQUU1QixPQUFPO0FBQ0wsZ0JBQVUsU0FBUyxLQUFLO0FBQUEsUUFDdEIsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLFVBQVUsVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQ3JFLFNBQUssVUFBVSxDQUFDO0FBRWhCLFFBQUksS0FBSyxRQUFRLFdBQVc7QUFDMUIsV0FBSyxRQUFRLEtBQUssS0FBSyxhQUFhLFNBQVMsNEJBQTRCLE1BQU07QUFDN0UsYUFBSyxLQUFLLFVBQVUsTUFBTSxLQUFLLFFBQVEsU0FBUyxDQUFDO0FBQUEsTUFDbkQsR0FBRyxJQUFJLENBQUM7QUFBQSxJQUNWO0FBRUEsU0FBSyxRQUFRO0FBQUEsTUFDWCxLQUFLLGFBQWEsU0FBUyx1QkFBdUIsTUFBTTtBQUN0RCxhQUFLLEtBQUssVUFBVSxNQUFNLEtBQUssUUFBUSxPQUFPLENBQUM7QUFBQSxNQUNqRCxDQUFDO0FBQUEsTUFDRCxLQUFLLGFBQWEsU0FBUyxTQUFTLE1BQU07QUFDeEMsYUFBSyxNQUFNO0FBQUEsTUFDYixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsU0FBSyxVQUFVLE1BQU07QUFBQSxFQUN2QjtBQUFBLEVBRVEsYUFDTixRQUNBLE1BQ0EsU0FDQSxNQUFNLE9BQ2E7QUFDbkIsVUFBTSxTQUFTLE9BQU8sU0FBUyxVQUFVO0FBQUEsTUFDdkMsS0FBSyxNQUFNLHNDQUFzQztBQUFBLE1BQ2pEO0FBQUEsSUFDRixDQUFDO0FBQ0QsV0FBTyxpQkFBaUIsU0FBUyxPQUFPO0FBQ3hDLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFjLFVBQVUsUUFBOEM7QUFDcEUsUUFBSSxLQUFLLFNBQVM7QUFDaEI7QUFBQSxJQUNGO0FBRUEsU0FBSyxVQUFVO0FBQ2YsU0FBSyxtQkFBbUIsSUFBSTtBQUU1QixRQUFJO0FBQ0YsWUFBTSxVQUFVLE1BQU0sT0FBTztBQUM3QixZQUFNLEtBQUssUUFBUSxpQkFBaUIsT0FBTztBQUMzQyxXQUFLLE1BQU07QUFBQSxJQUNiLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8sdUNBQXVDO0FBQUEsSUFDMUQsVUFBRTtBQUNBLFdBQUssVUFBVTtBQUNmLFdBQUssbUJBQW1CLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLG1CQUFtQixVQUF5QjtBQUNsRCxlQUFXLFVBQVUsS0FBSyxTQUFTO0FBQ2pDLGFBQU8sV0FBVztBQUFBLElBQ3BCO0FBQUEsRUFDRjtBQUNGOzs7QUM1SEEsSUFBQUMsb0JBQW9DO0FBVTdCLElBQU0sc0JBQU4sY0FBa0Msd0JBQU07QUFBQSxFQUk3QyxZQUNFLEtBQ2lCLFNBQ2pCO0FBQ0EsVUFBTSxHQUFHO0FBRlE7QUFKbkIsU0FBUSxVQUFVO0FBQUEsRUFPbEI7QUFBQSxFQUVBLGFBQWdEO0FBQzlDLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixXQUFLLFVBQVU7QUFDZixXQUFLLEtBQUs7QUFBQSxJQUNaLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxTQUFlO0FBQ2IsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUN0QixjQUFVLE1BQU07QUFDaEIsY0FBVSxTQUFTLGFBQWE7QUFDaEMsY0FBVSxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssUUFBUSxNQUFNLENBQUM7QUFDckQsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsUUFBSSwwQkFBUSxTQUFTLEVBQ2xCO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxjQUFjLGdDQUFnQyxXQUFXLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxNQUFNO0FBQ3hGLGFBQUssT0FBTyxXQUFXO0FBQUEsTUFDekIsQ0FBQztBQUFBLElBQ0gsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sY0FBYyxnQ0FBZ0MsZUFBZSxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQ25GLGFBQUssT0FBTyxlQUFlO0FBQUEsTUFDN0IsQ0FBQztBQUFBLElBQ0gsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sY0FBYyxnQ0FBZ0MsbUJBQW1CLENBQUMsRUFBRSxRQUFRLE1BQU07QUFDdkYsYUFBSyxPQUFPLG1CQUFtQjtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNILEVBQ0M7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLGNBQWMsZ0NBQWdDLHdCQUF3QixDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQzVGLGFBQUssT0FBTyx3QkFBd0I7QUFBQSxNQUN0QyxDQUFDO0FBQUEsSUFDSCxFQUNDO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxjQUFjLGdDQUFnQyxvQkFBb0IsQ0FBQyxFQUFFLFFBQVEsTUFBTTtBQUN4RixhQUFLLE9BQU8sb0JBQW9CO0FBQUEsTUFDbEMsQ0FBQztBQUFBLElBQ0gsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sY0FBYyxnQ0FBZ0MscUJBQXFCLENBQUMsRUFBRSxRQUFRLE1BQU07QUFDekYsYUFBSyxPQUFPLHFCQUFxQjtBQUFBLE1BQ25DLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDSjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUNyQixRQUFJLENBQUMsS0FBSyxTQUFTO0FBQ2pCLFdBQUssT0FBTyxJQUFJO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQUEsRUFFUSxPQUFPLFVBQTBDO0FBQ3ZELFFBQUksS0FBSyxTQUFTO0FBQ2hCO0FBQUEsSUFDRjtBQUNBLFNBQUssVUFBVTtBQUNmLFNBQUssUUFBUSxRQUFRO0FBQ3JCLFNBQUssTUFBTTtBQUFBLEVBQ2I7QUFDRjs7O0FDckZBLElBQUFDLG9CQUFxRDtBQVc5QyxJQUFNLGtCQUFrQjtBQUV4QixJQUFNLG1CQUFOLGNBQStCLDJCQUFTO0FBQUEsRUFZN0MsWUFBWSxNQUFzQyxRQUFxQjtBQUNyRSxVQUFNLElBQUk7QUFEc0M7QUFIbEQsU0FBUSxZQUFZO0FBQ3BCLFNBQVEsb0JBQW9CLG9CQUFJLElBQVk7QUF3RzVDLFNBQWlCLGdCQUFnQixDQUFDLFVBQStCO0FBQy9ELFVBQUksTUFBTSxXQUFXLE1BQU0sV0FBVyxNQUFNLFFBQVE7QUFDbEQ7QUFBQSxNQUNGO0FBRUEsWUFBTSxTQUFTLE1BQU07QUFDckIsVUFBSSxXQUFXLE9BQU8sWUFBWSxXQUFXLE9BQU8sWUFBWSxhQUFhO0FBQzNFO0FBQUEsTUFDRjtBQUVBLGNBQVEsTUFBTSxJQUFJLFlBQVksR0FBRztBQUFBLFFBQy9CLEtBQUs7QUFDSCxnQkFBTSxlQUFlO0FBQ3JCLGVBQUssS0FBSyxXQUFXO0FBQ3JCO0FBQUEsUUFDRixLQUFLO0FBQ0gsZ0JBQU0sZUFBZTtBQUNyQixlQUFLLEtBQUssV0FBVztBQUNyQjtBQUFBLFFBQ0YsS0FBSztBQUNILGdCQUFNLGVBQWU7QUFDckIsZUFBSyxLQUFLLGNBQWM7QUFDeEI7QUFBQSxRQUNGLEtBQUs7QUFDSCxnQkFBTSxlQUFlO0FBQ3JCLGVBQUssUUFBUSxRQUFRO0FBQ3JCLGNBQUkseUJBQU8saUJBQWlCO0FBQzVCO0FBQUEsTUFDSjtBQUFBLElBQ0Y7QUFBQSxFQWpJQTtBQUFBLEVBRUEsY0FBc0I7QUFDcEIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLGlCQUF5QjtBQUN2QixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsVUFBa0I7QUFDaEIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sU0FBd0I7QUFDNUIsU0FBSyxVQUFVLE1BQU07QUFDckIsU0FBSyxVQUFVLFNBQVMsZUFBZTtBQUV2QyxVQUFNLFNBQVMsS0FBSyxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssZUFBZSxDQUFDO0FBQ3JFLFdBQU8sU0FBUyxNQUFNLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDdkMsV0FBTyxTQUFTLEtBQUs7QUFBQSxNQUNuQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsU0FBSyxtQkFBbUI7QUFDeEIsU0FBSyxxQkFBcUI7QUFDMUIsU0FBSyx1QkFBdUI7QUFDNUIsU0FBSyx1QkFBdUI7QUFDNUIsU0FBSyxpQkFBaUI7QUFDdEIsU0FBSyxvQkFBb0I7QUFDekIsU0FBSywyQkFBMkI7QUFDaEMsU0FBSyxvQkFBb0I7QUFDekIsU0FBSyxvQkFBb0I7QUFDekIsU0FBSywwQkFBMEI7QUFDL0IsVUFBTSxLQUFLLGNBQWM7QUFBQSxFQUMzQjtBQUFBLEVBRUEsVUFBeUI7QUFDdkIsV0FBTyxvQkFBb0IsV0FBVyxLQUFLLGFBQWE7QUFDeEQsV0FBTyxRQUFRLFFBQVE7QUFBQSxFQUN6QjtBQUFBLEVBRUEsY0FBYyxNQUFvQjtBQUNoQyxTQUFLLFNBQVMsUUFBUSxJQUFJO0FBQUEsRUFDNUI7QUFBQSxFQUVBLGVBQWUsTUFBb0I7QUFDakMsU0FBSyxVQUFVLFFBQVEsSUFBSTtBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFNLGdCQUErQjtBQUNuQyxVQUFNLENBQUMsWUFBWSxXQUFXLFdBQVcsSUFBSSxNQUFNLFFBQVEsSUFBSTtBQUFBLE1BQzdELEtBQUssT0FBTyxjQUFjO0FBQUEsTUFDMUIsS0FBSyxPQUFPLGlCQUFpQjtBQUFBLE1BQzdCLEtBQUssT0FBTyxzQkFBc0I7QUFBQSxJQUNwQyxDQUFDO0FBQ0QsUUFBSSxLQUFLLGNBQWM7QUFDckIsV0FBSyxhQUFhLFFBQVEsR0FBRyxVQUFVLHFCQUFxQjtBQUFBLElBQzlEO0FBQ0EsUUFBSSxLQUFLLGFBQWE7QUFDcEIsV0FBSyxZQUFZLFFBQVEsR0FBRyxTQUFTLGFBQWE7QUFBQSxJQUNwRDtBQUNBLFFBQUksS0FBSyxpQkFBaUI7QUFDeEIsV0FBSyxnQkFBZ0IsUUFBUSxtQkFBbUIsV0FBVyxVQUFVO0FBQUEsSUFDdkU7QUFDQSxRQUFJLEtBQUssWUFBWTtBQUNuQixXQUFLLFdBQVcsTUFBTTtBQUN0QixZQUFNLGFBQWEsS0FBSyxPQUFPLGdCQUFnQjtBQUMvQyxXQUFLLFdBQVcsU0FBUyxRQUFRLEVBQUUsTUFBTSxPQUFPLFVBQVUsSUFBSSxDQUFDO0FBRS9ELFlBQU0sY0FBYyxXQUFXLFNBQVMsWUFBWTtBQUNwRCxXQUFLLFdBQVcsU0FBUyxVQUFVO0FBQUEsUUFDakMsS0FBSztBQUFBLFFBQ0wsTUFBTSxjQUFjLFdBQVc7QUFBQSxNQUNqQyxDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxjQUFNLE1BQU0sS0FBSztBQUNqQixZQUFJLFFBQVEsS0FBSztBQUNqQixZQUFJLFFBQVEsWUFBWSxLQUFLLE9BQU8sU0FBUyxFQUFFO0FBQUEsTUFDakQsQ0FBQztBQUFBLElBQ0g7QUFDQSxRQUFJLEtBQUssaUJBQWlCO0FBQ3hCLFdBQUssZ0JBQWdCLFFBQVEsS0FBSyxPQUFPLG9CQUFvQixDQUFDO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQUEsRUFFUSxXQUFXLFNBQXdCO0FBQ3pDLFNBQUssWUFBWTtBQUNqQixVQUFNLFVBQVUsTUFBTSxLQUFLLEtBQUssVUFBVSxpQkFBaUIscUJBQXFCLENBQUM7QUFDakYsZUFBVyxVQUFVLFNBQVM7QUFDNUIsTUFBQyxPQUE2QixXQUFXO0FBQUEsSUFDM0M7QUFDQSxRQUFJLEtBQUssU0FBUztBQUNoQixXQUFLLFFBQVEsV0FBVztBQUFBLElBQzFCO0FBQUEsRUFDRjtBQUFBLEVBRVEsNEJBQWtDO0FBQ3hDLFdBQU8saUJBQWlCLFdBQVcsS0FBSyxhQUFhO0FBQUEsRUFDdkQ7QUFBQSxFQWlDUSxjQUFjLFdBQXlCO0FBQzdDLFFBQUksS0FBSyxrQkFBa0IsSUFBSSxTQUFTLEdBQUc7QUFDekMsV0FBSyxrQkFBa0IsT0FBTyxTQUFTO0FBQUEsSUFDekMsT0FBTztBQUNMLFdBQUssa0JBQWtCLElBQUksU0FBUztBQUFBLElBQ3RDO0FBQ0EsU0FBSyxtQkFBbUI7QUFBQSxFQUMxQjtBQUFBLEVBRVEscUJBQTJCO0FBQ2pDLFNBQUssb0JBQW9CLElBQUksSUFBSSxLQUFLLE9BQU8sU0FBUyx3QkFBd0I7QUFBQSxFQUNoRjtBQUFBLEVBRVEscUJBQTJCO0FBQ2pDLFNBQUssT0FBTyxTQUFTLDJCQUEyQixNQUFNLEtBQUssS0FBSyxpQkFBaUI7QUFDakYsU0FBSyxLQUFLLE9BQU8sYUFBYTtBQUFBLEVBQ2hDO0FBQUEsRUFFUSx5QkFDTixJQUNBLE9BQ0EsYUFDQSxnQkFDTTtBQUNOLFVBQU0sVUFBVSxLQUFLLFVBQVUsU0FBUyxXQUFXO0FBQUEsTUFDakQsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUVELFVBQU0sU0FBUyxRQUFRLFNBQVMsT0FBTyxFQUFFLEtBQUssdUJBQXVCLENBQUM7QUFDdEUsVUFBTSxZQUFZLE9BQU8sU0FBUyxVQUFVO0FBQUEsTUFDMUMsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLLGtCQUFrQixJQUFJLEVBQUUsSUFBSSxXQUFNO0FBQUEsTUFDN0MsTUFBTTtBQUFBLFFBQ0osY0FBYyxLQUFLLGtCQUFrQixJQUFJLEVBQUUsSUFBSSxVQUFVLEtBQUssS0FBSyxZQUFZLEtBQUs7QUFBQSxRQUNwRixrQkFBa0IsQ0FBQyxLQUFLLGtCQUFrQixJQUFJLEVBQUUsR0FBRyxTQUFTO0FBQUEsTUFDOUQ7QUFBQSxJQUNGLENBQUM7QUFDRCxXQUFPLFNBQVMsTUFBTSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3JDLFdBQU8sU0FBUyxLQUFLLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFMUMsY0FBVSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3hDLFdBQUssY0FBYyxFQUFFO0FBQ3JCLFlBQU0sWUFBWSxRQUFRLGNBQWMsd0JBQXdCO0FBQ2hFLFVBQUksV0FBVztBQUNiLGtCQUFVLGdCQUFnQixRQUFRO0FBQ2xDLGtCQUFVLFFBQVEsS0FBSyxrQkFBa0IsSUFBSSxFQUFFLElBQUksV0FBTSxRQUFHO0FBQzVELGtCQUFVLGFBQWEsY0FBYyxLQUFLLGtCQUFrQixJQUFJLEVBQUUsSUFBSSxVQUFVLEtBQUssS0FBSyxZQUFZLEtBQUssRUFBRTtBQUM3RyxrQkFBVSxhQUFhLGtCQUFrQixDQUFDLEtBQUssa0JBQWtCLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUFBLE1BQ3RGO0FBQUEsSUFDRixDQUFDO0FBRUQsVUFBTSxVQUFVLFFBQVEsU0FBUyxPQUFPO0FBQUEsTUFDdEMsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLLGtCQUFrQixJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsT0FBTyxJQUFJO0FBQUEsSUFDOUQsQ0FBQztBQUNELG1CQUFlLE9BQU87QUFBQSxFQUN4QjtBQUFBLEVBRVEsdUJBQTZCO0FBQ25DLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUMsY0FBYztBQUNiLGFBQUssVUFBVSxVQUFVLFNBQVMsWUFBWTtBQUFBLFVBQzVDLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxZQUNKLGFBQWE7QUFBQSxZQUNiLE1BQU07QUFBQSxVQUNSO0FBQUEsUUFDRixDQUFDO0FBRUQsY0FBTSxVQUFVLFVBQVUsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUNyRSxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLEtBQUssV0FBVztBQUFBLFFBQ3ZCLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLEtBQUssV0FBVztBQUFBLFFBQ3ZCLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLEtBQUssY0FBYztBQUFBLFFBQzFCLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLFFBQVEsUUFBUTtBQUNyQixjQUFJLHlCQUFPLGlCQUFpQjtBQUFBLFFBQzlCLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLHlCQUErQjtBQUNyQyxTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxDQUFDLGNBQWM7QUFDYixjQUFNLFVBQVUsVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQ3JFLGdCQUFRLFNBQVMsVUFBVTtBQUFBLFVBQ3pCLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLGVBQUssS0FBSyxPQUFPLG9CQUFvQjtBQUFBLFFBQ3ZDLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsWUFBWTtBQUN2QyxlQUFLLFdBQVcsSUFBSTtBQUNwQixjQUFJO0FBQ0Ysa0JBQU0sS0FBSyxPQUFPLGdDQUFnQztBQUFBLFVBQ3BELFVBQUU7QUFDQSxpQkFBSyxXQUFXLEtBQUs7QUFBQSxVQUN2QjtBQUFBLFFBQ0YsQ0FBQztBQUNELGdCQUFRLFNBQVMsVUFBVTtBQUFBLFVBQ3pCLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLGVBQUssS0FBSyxPQUFPLGtCQUFrQjtBQUFBLFFBQ3JDLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLEtBQUssT0FBTyxzQkFBc0I7QUFBQSxRQUN6QyxDQUFDO0FBQ0QsZ0JBQVEsU0FBUyxVQUFVO0FBQUEsVUFDekIsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLFlBQVk7QUFDdkMsZUFBSyxXQUFXLElBQUk7QUFDcEIsY0FBSTtBQUNGLGtCQUFNLEtBQUssT0FBTyxvQkFBb0I7QUFBQSxVQUN4QyxVQUFFO0FBQ0EsaUJBQUssV0FBVyxLQUFLO0FBQUEsVUFDdkI7QUFBQSxRQUNGLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsWUFBWTtBQUN2QyxlQUFLLFdBQVcsSUFBSTtBQUNwQixjQUFJO0FBQ0Ysa0JBQU0sS0FBSyxPQUFPLGdCQUFnQjtBQUFBLFVBQ3BDLFVBQUU7QUFDQSxpQkFBSyxXQUFXLEtBQUs7QUFBQSxVQUN2QjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRVEsbUJBQXlCO0FBQy9CLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUMsY0FBYztBQUNiLGNBQU0sVUFBVSxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDckUsZ0JBQVEsU0FBUyxVQUFVO0FBQUEsVUFDekIsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsZUFBSyxLQUFLLE9BQU8sWUFBWTtBQUFBLFFBQy9CLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLEtBQUssT0FBTyw0QkFBNEI7QUFBQSxRQUMvQyxDQUFDO0FBQ0QsZ0JBQVEsU0FBUyxVQUFVO0FBQUEsVUFDekIsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsZUFBSyxLQUFLLE9BQU8sOEJBQThCO0FBQUEsUUFDakQsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRVEsc0JBQTRCO0FBQ2xDLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUMsY0FBYztBQUNiLGNBQU0sVUFBVSxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDckUsZ0JBQVEsU0FBUyxVQUFVO0FBQUEsVUFDekIsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsZUFBSyxLQUFLLE9BQU8sYUFBYTtBQUFBLFFBQ2hDLENBQUM7QUFDRCxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxlQUFLLEtBQUssT0FBTyxrQkFBa0I7QUFBQSxRQUNyQyxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFUSx5QkFBK0I7QUFDckMsU0FBSztBQUFBLE1BQ0g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsQ0FBQyxjQUFjO0FBQ2IsY0FBTSxVQUFVLFVBQVUsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUNyRSxnQkFBUSxTQUFTLFVBQVU7QUFBQSxVQUN6QixLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsWUFBWTtBQUN2QyxlQUFLLFdBQVcsSUFBSTtBQUNwQixjQUFJO0FBQ0Ysa0JBQU0sS0FBSyxPQUFPLGdCQUFnQjtBQUFBLFVBQ3BDLFVBQUU7QUFDQSxpQkFBSyxXQUFXLEtBQUs7QUFBQSxVQUN2QjtBQUFBLFFBQ0YsQ0FBQztBQUNELGdCQUFRLFNBQVMsVUFBVTtBQUFBLFVBQ3pCLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxZQUFZO0FBQ3ZDLGVBQUssV0FBVyxJQUFJO0FBQ3BCLGNBQUk7QUFDRixrQkFBTSxLQUFLLE9BQU8sd0JBQXdCLE1BQU07QUFBQSxVQUNsRCxVQUFFO0FBQ0EsaUJBQUssV0FBVyxLQUFLO0FBQUEsVUFDdkI7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLDZCQUFtQztBQUN6QyxRQUFJLENBQUMsS0FBSyxPQUFPLFNBQVMsaUJBQWlCO0FBQ3pDO0FBQUEsSUFDRjtBQUVBLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUMsY0FBYztBQUNiLGNBQU0sVUFBVSxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDckUsZ0JBQVEsU0FBUyxVQUFVO0FBQUEsVUFDekIsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsZUFBSyxLQUFLLFVBQVU7QUFBQSxRQUN0QixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFUSxzQkFBNEI7QUFDbEMsU0FBSztBQUFBLE1BQ0g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsQ0FBQyxjQUFjO0FBQ2IsY0FBTSxXQUFXLFVBQVUsU0FBUyxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RSxhQUFLLGVBQWU7QUFFcEIsY0FBTSxVQUFVLFVBQVUsU0FBUyxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRSxhQUFLLGNBQWM7QUFFbkIsY0FBTSxZQUFZLFVBQVUsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUN2RSxhQUFLLGtCQUFrQixVQUFVLFNBQVMsUUFBUSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDeEYsa0JBQVUsU0FBUyxVQUFVO0FBQUEsVUFDM0IsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsZUFBSyxLQUFLLE9BQU8sa0JBQWtCO0FBQUEsUUFDckMsQ0FBQztBQUVELGNBQU0sUUFBUSxVQUFVLFNBQVMsS0FBSyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDaEUsYUFBSyxhQUFhO0FBRWxCLGNBQU0sYUFBYSxVQUFVLFNBQVMsS0FBSyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDaEYsYUFBSyxrQkFBa0I7QUFBQSxNQUN6QjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFUSxzQkFBNEI7QUFDbEMsU0FBSztBQUFBLE1BQ0g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsQ0FBQyxjQUFjO0FBQ2Isa0JBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDaEQsYUFBSyxXQUFXLFVBQVUsU0FBUyxPQUFPO0FBQUEsVUFDeEMsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQztBQUVELGtCQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEQsYUFBSyxZQUFZLFVBQVUsU0FBUyxPQUFPO0FBQUEsVUFDekMsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1IsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxhQUE0QjtBQUN4QyxVQUFNLEtBQUs7QUFBQSxNQUNULENBQUMsU0FBUyxLQUFLLE9BQU8sWUFBWSxJQUFJO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxhQUE0QjtBQUN4QyxVQUFNLEtBQUs7QUFBQSxNQUNULENBQUMsU0FBUyxLQUFLLE9BQU8sWUFBWSxJQUFJO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxnQkFBK0I7QUFDM0MsVUFBTSxLQUFLO0FBQUEsTUFDVCxDQUFDLFNBQVMsS0FBSyxPQUFPLGVBQWUsSUFBSTtBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQWMsWUFBMkI7QUFDdkMsVUFBTSxPQUFPLEtBQUssUUFBUSxNQUFNLEtBQUs7QUFDckMsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHlCQUFPLHdCQUF3QjtBQUNuQztBQUFBLElBQ0Y7QUFFQSxTQUFLLFdBQVcsSUFBSTtBQUNwQixRQUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0sS0FBSyxPQUFPLFVBQVUsSUFBSTtBQUM5QyxVQUFJLENBQUMsT0FBTztBQUNWLFlBQUkseUJBQU8scUNBQXFDO0FBQ2hEO0FBQUEsTUFDRjtBQUNBLFVBQUksVUFBVSxRQUFRO0FBQ3BCLGNBQU0sS0FBSztBQUFBLFVBQ1QsTUFBTSxLQUFLLE9BQU8sWUFBWSxJQUFJO0FBQUEsVUFDbEM7QUFBQSxRQUNGO0FBQUEsTUFDRixXQUFXLFVBQVUsUUFBUTtBQUMzQixjQUFNLEtBQUs7QUFBQSxVQUNULE1BQU0sS0FBSyxPQUFPLFlBQVksSUFBSTtBQUFBLFVBQ2xDO0FBQUEsUUFDRjtBQUFBLE1BQ0YsT0FBTztBQUNMLGNBQU0sS0FBSztBQUFBLFVBQ1QsTUFBTSxLQUFLLE9BQU8sZUFBZSxJQUFJO0FBQUEsVUFDckM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTyw4QkFBOEI7QUFBQSxJQUNqRCxVQUFFO0FBQ0EsV0FBSyxXQUFXLEtBQUs7QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQWMsZUFDWixRQUNBLGdCQUNlO0FBQ2YsVUFBTSxPQUFPLEtBQUssUUFBUSxNQUFNLEtBQUs7QUFDckMsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHlCQUFPLHdCQUF3QjtBQUNuQztBQUFBLElBQ0Y7QUFFQSxRQUFJO0FBQ0YsWUFBTSxTQUFTLE1BQU0sT0FBTyxJQUFJO0FBQ2hDLFlBQU0sS0FBSyxPQUFPLG1CQUFtQixNQUFNO0FBQzNDLFdBQUssUUFBUSxRQUFRO0FBQUEsSUFDdkIsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTyxjQUFjO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQ0Y7OztBQ3hpQk8sU0FBUyxpQkFBaUIsUUFBMkI7QUFDMUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyxpQkFBaUIsZ0JBQWdCLFdBQVcsT0FBTyxTQUFTO0FBQ3ZFLGNBQU0sUUFBUSxNQUFNLE9BQU8sWUFBWSxXQUFXLElBQUk7QUFDdEQsZUFBTyxvQkFBb0IsTUFBTSxJQUFJO0FBQUEsTUFDdkMsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixVQUFVLFlBQVk7QUFDcEIsWUFBTSxPQUFPLGlCQUFpQixnQkFBZ0IsV0FBVyxPQUFPLFNBQVM7QUFDdkUsY0FBTSxRQUFRLE1BQU0sT0FBTyxZQUFZLFdBQVcsSUFBSTtBQUN0RCxlQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxNQUNwQyxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0YsQ0FBQztBQUVELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsWUFBWTtBQUNwQixZQUFNLE9BQU87QUFBQSxRQUNYO0FBQUEsUUFDQTtBQUFBLFFBQ0EsT0FBTyxTQUFTO0FBQ2QsZ0JBQU0sUUFBUSxNQUFNLE9BQU8sZUFBZSxZQUFZLElBQUk7QUFDMUQsaUJBQU8sMEJBQTBCLE1BQU0sSUFBSTtBQUFBLFFBQzdDO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyxhQUFhO0FBQUEsSUFDNUI7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixVQUFVLFlBQVk7QUFDcEIsWUFBTSxPQUFPLGtCQUFrQjtBQUFBLElBQ2pDO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyx5QkFBeUIsR0FBRyxPQUFPO0FBQUEsSUFDbEQ7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixVQUFVLFlBQVk7QUFDcEIsWUFBTSxPQUFPLHlCQUF5QixHQUFHLE1BQU07QUFBQSxJQUNqRDtBQUFBLEVBQ0YsQ0FBQztBQUVELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsWUFBWTtBQUNwQixZQUFNLE9BQU8scUJBQXFCO0FBQUEsSUFDcEM7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixVQUFVLFlBQVk7QUFDcEIsWUFBTSxPQUFPLGtCQUFrQjtBQUFBLElBQ2pDO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyxZQUFZO0FBQUEsSUFDM0I7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixVQUFVLFlBQVk7QUFDcEIsWUFBTSxPQUFPLGdCQUFnQjtBQUFBLElBQy9CO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyxnQ0FBZ0M7QUFBQSxJQUMvQztBQUFBLEVBQ0YsQ0FBQztBQUVELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsWUFBWTtBQUNwQixZQUFNLE9BQU8sWUFBWTtBQUFBLElBQzNCO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyw0QkFBNEI7QUFBQSxJQUMzQztBQUFBLEVBQ0YsQ0FBQztBQUVELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsWUFBWTtBQUNwQixZQUFNLE9BQU8sZ0JBQWdCO0FBQUEsSUFDL0I7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixVQUFVLFlBQVk7QUFDcEIsWUFBTSxPQUFPLHdCQUF3QixNQUFNO0FBQUEsSUFDN0M7QUFBQSxFQUNGLENBQUM7QUFDSDs7O0FuRHJHQSxJQUFxQixjQUFyQixjQUF5Qyx5QkFBTztBQUFBLEVBQWhEO0FBQUE7QUFnQkUsU0FBUSxjQUF1QztBQUMvQyxTQUFRLGdCQUE2QjtBQUNyQyxTQUFRLHFCQUFxQjtBQUFBO0FBQUEsRUFFN0IsTUFBTSxTQUF3QjtBQUM1QixVQUFNLEtBQUssYUFBYTtBQUV4QixTQUFLLGVBQWUsSUFBSSxhQUFhLEtBQUssR0FBRztBQUM3QyxTQUFLLFlBQVksSUFBSSxlQUFlO0FBQ3BDLFNBQUssY0FBYyxJQUFJLGlCQUFpQixJQUFJO0FBQzVDLFNBQUssWUFBWSxpQkFBaUI7QUFDbEMsU0FBSyxlQUFlLElBQUksYUFBYSxLQUFLLGNBQWMsTUFBTSxLQUFLLFFBQVE7QUFDM0UsU0FBSyxjQUFjLElBQUksWUFBWSxLQUFLLGNBQWMsTUFBTSxLQUFLLFFBQVE7QUFDekUsU0FBSyxjQUFjLElBQUksWUFBWSxLQUFLLGNBQWMsTUFBTSxLQUFLLFFBQVE7QUFDekUsU0FBSyxpQkFBaUIsSUFBSTtBQUFBLE1BQ3hCLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSztBQUFBLElBQ2I7QUFDQSxTQUFLLGlCQUFpQixJQUFJO0FBQUEsTUFDeEIsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYjtBQUNBLFNBQUssbUJBQW1CLElBQUk7QUFBQSxNQUMxQixLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUs7QUFBQSxJQUNiO0FBQ0EsU0FBSyxnQkFBZ0IsSUFBSTtBQUFBLE1BQ3ZCLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSztBQUFBLElBQ2I7QUFDQSxTQUFLLGtCQUFrQixJQUFJO0FBQUEsTUFDekIsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYjtBQUNBLFNBQUssaUJBQWlCLElBQUk7QUFBQSxNQUN4QixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUs7QUFBQSxJQUNiO0FBQ0EsU0FBSyxtQkFBbUIsSUFBSTtBQUFBLE1BQzFCLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSztBQUFBLElBQ2I7QUFDQSxTQUFLLG1CQUFtQixJQUFJO0FBQUEsTUFDMUIsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYjtBQUVBLFVBQU0sS0FBSyxhQUFhLG1CQUFtQixLQUFLLFFBQVE7QUFDeEQsVUFBTSxLQUFLLGdDQUFnQztBQUUzQyxTQUFLLGFBQWEsaUJBQWlCLENBQUMsU0FBUztBQUMzQyxZQUFNLE9BQU8sSUFBSSxpQkFBaUIsTUFBTSxJQUFJO0FBQzVDLFdBQUssY0FBYztBQUNuQixhQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQscUJBQWlCLElBQUk7QUFFckIsU0FBSyxjQUFjLElBQUksZ0JBQWdCLEtBQUssS0FBSyxJQUFJLENBQUM7QUFBQSxFQUN4RDtBQUFBLEVBRUEsV0FBaUI7QUFDZixTQUFLLGNBQWM7QUFBQSxFQUNyQjtBQUFBLEVBRUEsTUFBTSxlQUE4QjtBQW5JdEM7QUFvSUksVUFBTSxVQUFVLFdBQU0sS0FBSyxTQUFTLE1BQXBCLFlBQTBCLENBQUM7QUFDM0MsU0FBSyxXQUFXLHVCQUF1QixNQUFNO0FBQUEsRUFDL0M7QUFBQSxFQUVBLE1BQU0sZUFBOEI7QUFDbEMsU0FBSyxXQUFXLHVCQUF1QixLQUFLLFFBQVE7QUFDcEQsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQ2pDLFVBQU0sS0FBSyxhQUFhLG1CQUFtQixLQUFLLFFBQVE7QUFDeEQsVUFBTSxLQUFLLGdDQUFnQztBQUMzQyxVQUFNLEtBQUsscUJBQXFCO0FBQUEsRUFDbEM7QUFBQSxFQUVBLE1BQU0sY0FBNkI7QUFDakMsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGFBQWEsS0FBSztBQUNsRCxRQUFJLENBQUMsTUFBTTtBQUNULFVBQUkseUJBQU8sNEJBQTRCO0FBQ3ZDO0FBQUEsSUFDRjtBQUNBLFVBQU0sS0FBSyxhQUFhO0FBQUEsTUFDdEIsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLElBQ1YsQ0FBQztBQUNELFNBQUssSUFBSSxVQUFVLFdBQVcsSUFBSTtBQUFBLEVBQ3BDO0FBQUEsRUFFQSxxQkFBOEM7QUFDNUMsVUFBTSxTQUFTLEtBQUssSUFBSSxVQUFVLGdCQUFnQixlQUFlO0FBQ2pFLGVBQVcsUUFBUSxRQUFRO0FBQ3pCLFlBQU0sT0FBTyxLQUFLO0FBQ2xCLFVBQUksZ0JBQWdCLGtCQUFrQjtBQUNwQyxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsaUJBQTBCO0FBQ3hCLFdBQU8sS0FBSyxJQUFJLFVBQVUsZ0JBQWdCLGVBQWUsRUFBRSxTQUFTO0FBQUEsRUFDdEU7QUFBQSxFQUVBLG9CQUFvQixNQUFvQjtBQTVLMUM7QUE2S0ksZUFBSyxtQkFBbUIsTUFBeEIsbUJBQTJCLGNBQWM7QUFBQSxFQUMzQztBQUFBLEVBRUEscUJBQXFCLE1BQW9CO0FBaEwzQztBQWlMSSxlQUFLLG1CQUFtQixNQUF4QixtQkFBMkIsZUFBZTtBQUFBLEVBQzVDO0FBQUEsRUFFQSxNQUFNLHVCQUFzQztBQXBMOUM7QUFxTEksWUFBTSxVQUFLLG1CQUFtQixNQUF4QixtQkFBMkI7QUFBQSxFQUNuQztBQUFBLEVBRUEsTUFBTSxpQ0FBZ0Q7QUFDcEQsUUFBSTtBQUNGLFlBQU0sS0FBSyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLGtDQUFrQztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxtQkFBbUIsU0FBZ0M7QUFDdkQsUUFBSSx5QkFBTyxPQUFPO0FBQ2xCLFNBQUssb0JBQW9CLE9BQU87QUFDaEMsVUFBTSxLQUFLLCtCQUErQjtBQUFBLEVBQzVDO0FBQUEsRUFFQSxzQkFBOEI7QUFDNUIsV0FBTyxLQUFLLGdCQUFnQixrQkFBa0IsS0FBSyxhQUFhLElBQUk7QUFBQSxFQUN0RTtBQUFBLEVBRUEsTUFBTSxVQUFVLE1BQXNDO0FBQ3BELFFBQUksQ0FBQyxLQUFLLFNBQVMsaUJBQWlCO0FBQ2xDLGFBQU87QUFBQSxJQUNUO0FBRUEsUUFBSSxLQUFLLFNBQVMsZUFBZSxVQUFVO0FBQ3pDLFVBQUksQ0FBQyxLQUFLLFNBQVMsYUFBYSxLQUFLLEtBQUssQ0FBQyxLQUFLLFNBQVMsWUFBWSxLQUFLLEdBQUc7QUFDM0UsWUFBSSx5QkFBTyxvREFBb0Q7QUFDL0QsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGLFdBQVcsS0FBSyxTQUFTLGVBQWUsVUFBVTtBQUNoRCxVQUFJLENBQUMsS0FBSyxTQUFTLGFBQWEsS0FBSyxLQUFLLENBQUMsS0FBSyxTQUFTLFlBQVksS0FBSyxHQUFHO0FBQzNFLFlBQUkseUJBQU8sb0RBQW9EO0FBQy9ELGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBUSxNQUFNLEtBQUssVUFBVSxVQUFVLE1BQU0sS0FBSyxRQUFRO0FBQ2hFLFFBQUksT0FBTztBQUNULFdBQUssb0JBQW9CLGtCQUFrQixLQUFLLEVBQUU7QUFBQSxJQUNwRDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLHNCQUFxQztBQUN6QyxVQUFNLEtBQUs7QUFBQSxNQUNULE1BQU0sS0FBSyxlQUFlLHNCQUFzQjtBQUFBLE1BQ2hEO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGtDQUFpRDtBQUNyRCxVQUFNLEtBQUs7QUFBQSxNQUNULE1BQU0sS0FBSyxlQUFlLHNCQUFzQjtBQUFBLE1BQ2hEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sb0JBQW1DO0FBQ3ZDLFVBQU0sS0FBSztBQUFBLE1BQ1QsTUFBTSxLQUFLLGVBQWUsdUJBQXVCO0FBQUEsTUFDakQ7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sc0JBQXFDO0FBQ3pDLFVBQU0sS0FBSztBQUFBLE1BQ1QsTUFBTSxLQUFLLGVBQWUsc0JBQXNCO0FBQUEsTUFDaEQ7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sd0JBQXVDO0FBQzNDLFVBQU0sS0FBSztBQUFBLE1BQ1QsTUFBTSxLQUFLLGVBQWUsd0JBQXdCO0FBQUEsTUFDbEQ7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sa0JBQWlDO0FBQ3JDLFFBQUk7QUFDRixZQUFNLFFBQVEsTUFBTSxJQUFJLG1CQUFtQixLQUFLLEtBQUs7QUFBQSxRQUNuRCxPQUFPO0FBQUEsTUFDVCxDQUFDLEVBQUUsV0FBVztBQUNkLFVBQUksQ0FBQyxPQUFPO0FBQ1Y7QUFBQSxNQUNGO0FBRUEsWUFBTSxVQUFVLE1BQU0sS0FBSztBQUFBLFFBQ3pCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFDQSxVQUFJLENBQUMsU0FBUztBQUNaO0FBQUEsTUFDRjtBQUVBLFlBQU0sV0FBVyxNQUFNLEtBQUssc0JBQXNCLGtCQUFrQjtBQUNwRSxVQUFJLENBQUMsVUFBVTtBQUNiO0FBQUEsTUFDRjtBQUVBLFlBQU0sS0FBSyxpQkFBaUIsU0FBUyxRQUFRO0FBQUEsSUFDL0MsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTyxrQ0FBa0M7QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sOEJBQTZDO0FBQ2pELFVBQU0sS0FBSyxvQkFBb0IsTUFBTTtBQUFBLEVBQ3ZDO0FBQUEsRUFFQSxNQUFNLGdDQUErQztBQUNuRCxVQUFNLEtBQUssb0JBQW9CLFFBQVE7QUFBQSxFQUN6QztBQUFBLEVBRUEsTUFBTSxjQUE2QjtBQUNqQyxRQUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0sSUFBSSxtQkFBbUIsS0FBSyxLQUFLO0FBQUEsUUFDbkQsT0FBTztBQUFBLE1BQ1QsQ0FBQyxFQUFFLFdBQVc7QUFDZCxVQUFJLENBQUMsT0FBTztBQUNWO0FBQUEsTUFDRjtBQUVBLFlBQU0sS0FBSyxvQkFBb0IsS0FBSztBQUFBLElBQ3RDLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8scUJBQXFCO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGtCQUFpQztBQUNyQyxVQUFNLEtBQUssd0JBQXdCO0FBQUEsRUFDckM7QUFBQSxFQUVBLE1BQU0sd0JBQXdCLGNBQTZDO0FBaFU3RTtBQWlVSSxRQUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0sSUFBSSxZQUFZLEtBQUssS0FBSztBQUFBLFFBQzVDLE9BQU87QUFBQSxRQUNQLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxNQUNiLENBQUMsRUFBRSxXQUFXO0FBQ2QsVUFBSSxDQUFDLE9BQU87QUFDVjtBQUFBLE1BQ0Y7QUFFQSxZQUFNLFFBQVEsc0NBQWdCLE1BQU0sSUFBSSxtQkFBbUIsS0FBSyxLQUFLO0FBQUEsUUFDbkUsT0FBTztBQUFBLE1BQ1QsQ0FBQyxFQUFFLFdBQVc7QUFDZCxVQUFJLENBQUMsT0FBTztBQUNWO0FBQUEsTUFDRjtBQUVBLFlBQU0sVUFBVSxNQUFNLEtBQUs7QUFBQSxRQUN6QjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQ0EsVUFBSSxDQUFDLFNBQVM7QUFDWjtBQUFBLE1BQ0Y7QUFFQSxZQUFNLFNBQVMsTUFBTSxLQUFLLGlCQUFpQixnQkFBZ0IsT0FBTyxPQUFPO0FBQ3pFLFlBQU0sUUFBUSxNQUFNLEtBQUssWUFBWTtBQUFBLFFBQ25DLE9BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLFFBQVE7QUFBQSxRQUNSLFFBQVE7QUFBQSxNQUNWO0FBRUEsV0FBSyxnQkFBZ0Isb0JBQUksS0FBSztBQUM5QixXQUFLLHFCQUFxQixPQUFPLE9BQU87QUFDeEMsV0FBSztBQUFBLFFBQ0gsT0FBTyxTQUNILDBCQUEwQixNQUFNLElBQUksS0FDcEMsdUJBQXVCLE1BQU0sSUFBSTtBQUFBLE1BQ3ZDO0FBQ0EsWUFBTSxLQUFLLCtCQUErQjtBQUMxQyxVQUFJLHlCQUFPLHVCQUF1QixNQUFNLElBQUksRUFBRTtBQUU5QyxZQUFNLFFBQU8sVUFBSyxJQUFJLFVBQVUsUUFBUSxLQUFLLE1BQWhDLFlBQXFDLEtBQUssSUFBSSxVQUFVLGFBQWEsS0FBSztBQUN2RixVQUFJLE1BQU07QUFDUixjQUFNLEtBQUssU0FBUyxLQUFLO0FBQ3pCLGFBQUssSUFBSSxVQUFVLFdBQVcsSUFBSTtBQUFBLE1BQ3BDO0FBQUEsSUFDRixTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLGtDQUFrQztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSx5QkFDSixjQUNBLE9BQ3dCO0FBQ3hCLFVBQU0sU0FBUyxNQUFNLEtBQUssZUFBZSxnQkFBZ0IsY0FBYyxLQUFLO0FBQzVFLFNBQUssZ0JBQWdCLG9CQUFJLEtBQUs7QUFDOUIsU0FBSyxxQkFBcUIsR0FBRyxPQUFPLEtBQUs7QUFBQTtBQUFBLEVBQU8sT0FBTyxPQUFPLEVBQUU7QUFDaEUsU0FBSztBQUFBLE1BQ0gsT0FBTyxTQUFTLEdBQUcsT0FBTyxLQUFLLHVCQUF1QixHQUFHLE9BQU8sS0FBSztBQUFBLElBQ3ZFO0FBQ0EsVUFBTSxLQUFLLCtCQUErQjtBQUMxQyxRQUFJO0FBQUEsTUFDRixPQUFPLGdCQUNILEdBQUcsT0FBTyxLQUFLLGFBQWEsT0FBTyxhQUFhLEtBQ2hELE9BQU8sU0FDTCxHQUFHLE9BQU8sS0FBSyx1QkFDZixHQUFHLE9BQU8sS0FBSztBQUFBLElBQ3ZCO0FBQ0EsUUFBSSxDQUFDLEtBQUssZUFBZSxHQUFHO0FBQzFCLFVBQUksWUFBWSxLQUFLLEtBQUssU0FBUyxPQUFPLEtBQUssSUFBSSxPQUFPLE9BQU8sRUFBRSxLQUFLO0FBQUEsSUFDMUU7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxvQkFDSixRQUNBLFNBQ2lCO0FBQ2pCLFVBQU0sUUFBUSxNQUFNLEtBQUssWUFBWTtBQUFBLE1BQ25DLE9BQU87QUFBQSxNQUNQLEtBQUssMEJBQTBCLFFBQVEsT0FBTztBQUFBLE1BQzlDLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxJQUNWO0FBQ0EsV0FBTyxxQkFBcUIsTUFBTSxJQUFJO0FBQUEsRUFDeEM7QUFBQSxFQUVBLE1BQU0sK0JBQ0osUUFDQSxTQUNpQjtBQUNqQixVQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsb0JBQW9CLDhCQUFZO0FBQ2hFLFFBQUksRUFBQyw2QkFBTSxPQUFNO0FBQ2YsWUFBTSxJQUFJLE1BQU0sNEJBQTRCO0FBQUEsSUFDOUM7QUFFQSxVQUFNLFdBQVcsS0FBSyw4QkFBOEIsUUFBUSxPQUFPO0FBQ25FLFVBQU0sU0FBUyxLQUFLO0FBQ3BCLFVBQU0sV0FBVyxPQUFPLFNBQVM7QUFDakMsVUFBTSxlQUFlLE9BQU8sUUFBUSxRQUFRO0FBQzVDLFVBQU0sY0FBYyxFQUFFLE1BQU0sVUFBVSxJQUFJLGFBQWEsT0FBTztBQUM5RCxVQUFNLFlBQVksbUJBQW1CLE9BQU8sU0FBUyxDQUFDO0FBQ3RELFdBQU8sYUFBYSxHQUFHLFNBQVMsR0FBRyxRQUFRO0FBQUEsR0FBTSxXQUFXO0FBQzVELFdBQU8sMkJBQTJCLEtBQUssS0FBSyxJQUFJO0FBQUEsRUFDbEQ7QUFBQSxFQUVBLE1BQU0saUJBQ0osT0FDQSxhQUNBLFFBQ0EsWUFBWSxPQUNHO0FBQ2YsVUFBTSxRQUFRLE1BQU0sSUFBSSxZQUFZLEtBQUssS0FBSztBQUFBLE1BQzVDO0FBQUEsTUFDQSxhQUFhLFlBQ1QsNkJBQ0E7QUFBQSxNQUNKO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQyxFQUFFLFdBQVc7QUFFZCxRQUFJLFVBQVUsTUFBTTtBQUNsQjtBQUFBLElBQ0Y7QUFFQSxRQUFJO0FBQ0YsWUFBTSxTQUFTLE1BQU0sT0FBTyxLQUFLO0FBQ2pDLFlBQU0sS0FBSyxtQkFBbUIsTUFBTTtBQUFBLElBQ3RDLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8saUNBQWlDO0FBQUEsSUFDcEQ7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLFlBQVksTUFBK0I7QUFDL0MsVUFBTSxRQUFRLE1BQU0sS0FBSyxZQUFZLFdBQVcsSUFBSTtBQUNwRCxXQUFPLG9CQUFvQixNQUFNLElBQUk7QUFBQSxFQUN2QztBQUFBLEVBRUEsTUFBTSxZQUFZLE1BQStCO0FBQy9DLFVBQU0sUUFBUSxNQUFNLEtBQUssWUFBWSxXQUFXLElBQUk7QUFDcEQsV0FBTyxpQkFBaUIsTUFBTSxJQUFJO0FBQUEsRUFDcEM7QUFBQSxFQUVBLE1BQU0sZUFBZSxNQUErQjtBQUNsRCxVQUFNLFFBQVEsTUFBTSxLQUFLLGVBQWUsWUFBWSxJQUFJO0FBQ3hELFdBQU8sMEJBQTBCLE1BQU0sSUFBSTtBQUFBLEVBQzdDO0FBQUEsRUFFQSxNQUFNLGVBQThCO0FBQ2xDLFVBQU0sVUFBVSxNQUFNLEtBQUssY0FBYyxzQkFBc0I7QUFDL0QsUUFBSSxDQUFDLFFBQVEsUUFBUTtBQUNuQixVQUFJLHlCQUFPLHdCQUF3QjtBQUNuQztBQUFBLElBQ0Y7QUFFQSxRQUFJLGlCQUFpQixLQUFLLEtBQUssU0FBUyxLQUFLLGVBQWUsT0FBTyxZQUFZO0FBQzdFLFlBQU0sS0FBSyxtQkFBbUIsT0FBTztBQUFBLElBQ3ZDLENBQUMsRUFBRSxLQUFLO0FBQ1IsU0FBSyxvQkFBb0IsVUFBVSxRQUFRLE1BQU0sZ0JBQWdCO0FBQ2pFLFVBQU0sS0FBSywrQkFBK0I7QUFBQSxFQUM1QztBQUFBLEVBRUEsTUFBTSxvQkFBbUM7QUFDdkMsVUFBTSxVQUFVLE1BQU0sS0FBSyxpQkFBaUIsaUJBQWlCO0FBQzdELFFBQUksbUJBQW1CLEtBQUssS0FBSyxTQUFTLElBQUksRUFBRSxLQUFLO0FBQUEsRUFDdkQ7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBQzFDLFVBQU0sWUFBWSxLQUFLLHVCQUF1QjtBQUM5QyxRQUFJLFdBQVc7QUFDYixZQUFNLFFBQVEsTUFBTSxLQUFLLFlBQVksV0FBVyxTQUFTO0FBQ3pELFlBQU0sVUFBVSxnQ0FBZ0MsTUFBTSxJQUFJO0FBQzFELFlBQU0sS0FBSyxtQkFBbUIsT0FBTztBQUNyQztBQUFBLElBQ0Y7QUFFQSxRQUFJLHlCQUFPLCtDQUErQztBQUMxRCxVQUFNLEtBQUssaUJBQWlCLFlBQVksYUFBYSxPQUFPLFNBQVM7QUFDbkUsWUFBTSxRQUFRLE1BQU0sS0FBSyxZQUFZLFdBQVcsSUFBSTtBQUNwRCxhQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxJQUNwQyxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsTUFBTSxvQkFBbUM7QUE5ZjNDO0FBK2ZJLFVBQU0sT0FBTyxNQUFNLEtBQUssZUFBZSxrQkFBa0I7QUFDekQsVUFBTSxRQUFPLFVBQUssSUFBSSxVQUFVLFFBQVEsS0FBSyxNQUFoQyxZQUFxQyxLQUFLLElBQUksVUFBVSxhQUFhLEtBQUs7QUFDdkYsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHlCQUFPLGdDQUFnQztBQUMzQztBQUFBLElBQ0Y7QUFFQSxVQUFNLEtBQUssU0FBUyxJQUFJO0FBQ3hCLFNBQUssSUFBSSxVQUFVLFdBQVcsSUFBSTtBQUNsQyxVQUFNLFVBQVUsVUFBVSxLQUFLLElBQUk7QUFDbkMsVUFBTSxLQUFLLG1CQUFtQixPQUFPO0FBQUEsRUFDdkM7QUFBQSxFQUVBLE1BQU0sZ0JBQWlDO0FBQ3JDLFdBQU8sTUFBTSxLQUFLLGFBQWEsbUJBQW1CO0FBQUEsRUFDcEQ7QUFBQSxFQUVBLE1BQU0sbUJBQW9DO0FBQ3hDLFdBQU8sTUFBTSxLQUFLLFlBQVksaUJBQWlCO0FBQUEsRUFDakQ7QUFBQSxFQUVBLE1BQU0sd0JBQXlDO0FBQzdDLFdBQU8sS0FBSyxpQkFBaUIsb0JBQW9CO0FBQUEsRUFDbkQ7QUFBQSxFQUVBLE1BQU0sa0JBQWtCLE9BS0o7QUFDbEIsVUFBTSxTQUFTLE1BQU0sS0FBSyxjQUFjLG9CQUFvQjtBQUFBLE1BQzFELFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUNaLFdBQVcsS0FBSyxJQUFJO0FBQUEsTUFDcEIsWUFBWTtBQUFBLE1BQ1osTUFBTTtBQUFBLE1BQ04sU0FBUyxNQUFNO0FBQUEsTUFDZixTQUFTLE1BQU07QUFBQSxNQUNmLFdBQVcsTUFBTTtBQUFBLE1BQ2pCLGdCQUFnQixNQUFNO0FBQUEsSUFDeEIsQ0FBQztBQUNELFVBQU0sS0FBSywrQkFBK0I7QUFDMUMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLGtCQUEwQjtBQUN4QixRQUFJLENBQUMsS0FBSyxTQUFTLHFCQUFxQixDQUFDLEtBQUssU0FBUyxpQkFBaUI7QUFDdEUsYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLEtBQUssU0FBUyxlQUFlLFVBQVU7QUFDekMsVUFBSSxDQUFDLEtBQUssU0FBUyxhQUFhLEtBQUssS0FBSyxDQUFDLEtBQUssU0FBUyxZQUFZLEtBQUssR0FBRztBQUMzRSxlQUFPO0FBQUEsTUFDVDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBRUEsUUFBSSxLQUFLLFNBQVMsZUFBZSxVQUFVO0FBQ3pDLFVBQUksQ0FBQyxLQUFLLFNBQVMsYUFBYSxLQUFLLEtBQUssQ0FBQyxLQUFLLFNBQVMsWUFBWSxLQUFLLEdBQUc7QUFDM0UsZUFBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFjLG1CQUNaLFVBQ0EsWUFDQSxpQkFDZTtBQUNmLFFBQUk7QUFDRixZQUFNLFVBQVUsTUFBTSxTQUFTO0FBQy9CLFlBQU0sV0FBVyw0Q0FBb0IsTUFBTSxLQUFLLHNCQUFzQixVQUFVO0FBQ2hGLFVBQUksQ0FBQyxVQUFVO0FBQ2I7QUFBQSxNQUNGO0FBRUEsWUFBTSxLQUFLLGlCQUFpQixTQUFTLFFBQVE7QUFBQSxJQUMvQyxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLG1DQUFtQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxvQkFBb0IsT0FBcUM7QUFDckUsWUFBUSxPQUFPO0FBQUEsTUFDYixLQUFLO0FBQ0gsY0FBTSxLQUFLO0FBQUEsVUFDVCxNQUFNLEtBQUssZUFBZSxzQkFBc0I7QUFBQSxVQUNoRDtBQUFBLFFBQ0Y7QUFDQTtBQUFBLE1BQ0YsS0FBSztBQUNILGNBQU0sS0FBSztBQUFBLFVBQ1QsTUFBTSxLQUFLLGVBQWUsd0JBQXdCO0FBQUEsVUFDbEQ7QUFBQSxRQUNGO0FBQ0E7QUFBQSxNQUNGLEtBQUs7QUFDSCxjQUFNLEtBQUs7QUFBQSxVQUNULE1BQU0sS0FBSyxlQUFlLGdCQUFnQjtBQUFBLFVBQzFDO0FBQUEsUUFDRjtBQUNBO0FBQUEsTUFDRixLQUFLO0FBQ0gsY0FBTSxLQUFLLDhCQUE4QjtBQUN6QztBQUFBLE1BQ0Y7QUFDRTtBQUFBLElBQ0o7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLHVCQUNaLE9BQ0Esa0JBQ2tDO0FBQ2xDLFlBQVEsT0FBTztBQUFBLE1BQ2IsS0FBSztBQUNILGVBQU8sTUFBTSxLQUFLLGVBQWUsc0JBQXNCO0FBQUEsTUFDekQsS0FBSztBQUNILGVBQU8sTUFBTSxLQUFLLGVBQWUsd0JBQXdCO0FBQUEsTUFDM0QsS0FBSztBQUNILGVBQU8sTUFBTSxLQUFLLGVBQWUsZ0JBQWdCO0FBQUEsTUFDbkQsS0FBSyxTQUFTO0FBQ1osY0FBTSxRQUFRLE1BQU0sS0FBSywwQkFBMEIsZ0JBQWdCO0FBQ25FLFlBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxRQUFRO0FBQzNCLGlCQUFPO0FBQUEsUUFDVDtBQUNBLGVBQU8sTUFBTSxLQUFLLGVBQWUsd0JBQXdCLEtBQUs7QUFBQSxNQUNoRTtBQUFBLE1BQ0E7QUFDRSxlQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQWMsZ0NBQStDO0FBQzNELFFBQUk7QUFDRixZQUFNLFFBQVEsTUFBTSxLQUFLLDBCQUEwQixjQUFjO0FBQ2pFLFVBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxRQUFRO0FBQzNCO0FBQUEsTUFDRjtBQUVBLFlBQU0sS0FBSztBQUFBLFFBQ1QsTUFBTSxLQUFLLGVBQWUsd0JBQXdCLEtBQUs7QUFBQSxRQUN2RDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8sa0NBQWtDO0FBQUEsSUFDckQ7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLDBCQUEwQixPQUF3QztBQUM5RSxVQUFNLFFBQVEsS0FBSyxJQUFJLE1BQ3BCLGlCQUFpQixFQUNqQixPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUsscUJBQXFCLEtBQUssSUFBSSxDQUFDLEVBQ3RELEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFFM0QsUUFBSSxDQUFDLE1BQU0sUUFBUTtBQUNqQixVQUFJLHlCQUFPLHlCQUF5QjtBQUNwQyxhQUFPO0FBQUEsSUFDVDtBQUVBLFdBQU8sTUFBTSxJQUFJLHFCQUFxQixLQUFLLEtBQUssT0FBTztBQUFBLE1BQ3JEO0FBQUEsSUFDRixDQUFDLEVBQUUsV0FBVztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxNQUFjLHVCQUNaLFVBQ0EsWUFDZTtBQUNmLFFBQUk7QUFDRixZQUFNLFVBQVUsTUFBTSxTQUFTO0FBQy9CLFlBQU0sV0FBVyxNQUFNLElBQUksWUFBWSxLQUFLLEtBQUs7QUFBQSxRQUMvQyxPQUFPO0FBQUEsUUFDUCxhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixXQUFXO0FBQUEsTUFDYixDQUFDLEVBQUUsV0FBVztBQUNkLFVBQUksQ0FBQyxVQUFVO0FBQ2I7QUFBQSxNQUNGO0FBRUEsWUFBTSxTQUFTLE1BQU0sS0FBSyxnQkFBZ0IsZUFBZSxVQUFVLE9BQU87QUFDMUUsV0FBSyxnQkFBZ0Isb0JBQUksS0FBSztBQUM5QixXQUFLLHFCQUFxQixPQUFPLE9BQU87QUFDeEMsV0FBSztBQUFBLFFBQ0gsT0FBTyxTQUNILGtCQUFrQixRQUFRLFdBQVcsS0FDckMscUJBQXFCLFFBQVEsV0FBVztBQUFBLE1BQzlDO0FBQ0EsWUFBTSxLQUFLLCtCQUErQjtBQUMxQyxVQUFJLHFCQUFxQixLQUFLLEtBQUs7QUFBQSxRQUNqQztBQUFBLFFBQ0E7QUFBQSxRQUNBLFdBQVcsS0FBSyxzQkFBc0I7QUFBQSxRQUN0QyxVQUFVLFlBQVksS0FBSywrQkFBK0IsUUFBUSxPQUFPO0FBQUEsUUFDekUsUUFBUSxZQUFZLEtBQUssb0JBQW9CLFFBQVEsT0FBTztBQUFBLFFBQzVELGtCQUFrQixPQUFPLFlBQVk7QUFDbkMsZ0JBQU0sS0FBSyxpQkFBaUIsU0FBUyxXQUFXO0FBQUEsUUFDbEQ7QUFBQSxNQUNGLENBQUMsRUFBRSxLQUFLO0FBQUEsSUFDVixTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLGdDQUFnQztBQUFBLElBQ25EO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxpQkFDWixTQUNBLFVBQ2U7QUFDZixVQUFNLFNBQVMsTUFBTSxLQUFLLGlCQUFpQixJQUFJLFVBQVUsT0FBTztBQUNoRSxTQUFLLGdCQUFnQixvQkFBSSxLQUFLO0FBQzlCLFNBQUsscUJBQXFCLE9BQU8sT0FBTztBQUN4QyxTQUFLO0FBQUEsTUFDSCxPQUFPLFNBQ0gsTUFBTSxPQUFPLE1BQU0sWUFBWSxDQUFDLFNBQVMsUUFBUSxXQUFXLEtBQzVELFNBQVMsT0FBTyxNQUFNLFlBQVksQ0FBQyxTQUFTLFFBQVEsV0FBVztBQUFBLElBQ3JFO0FBQ0EsVUFBTSxLQUFLLCtCQUErQjtBQUMxQyxRQUFJLHFCQUFxQixLQUFLLEtBQUs7QUFBQSxNQUNqQztBQUFBLE1BQ0E7QUFBQSxNQUNBLFdBQVcsS0FBSyxzQkFBc0I7QUFBQSxNQUN0QyxVQUFVLFlBQVksS0FBSywrQkFBK0IsUUFBUSxPQUFPO0FBQUEsTUFDekUsUUFBUSxZQUFZLEtBQUssb0JBQW9CLFFBQVEsT0FBTztBQUFBLE1BQzVELGtCQUFrQixPQUFPLFlBQVk7QUFDbkMsY0FBTSxLQUFLLG1CQUFtQixPQUFPO0FBQUEsTUFDdkM7QUFBQSxJQUNGLENBQUMsRUFBRSxLQUFLO0FBQUEsRUFDVjtBQUFBLEVBRUEsTUFBYyxzQkFDWixPQUNtQztBQUNuQyxXQUFPLE1BQU0sSUFBSSxvQkFBb0IsS0FBSyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsV0FBVztBQUFBLEVBQ3ZFO0FBQUEsRUFFUSwwQkFDTixRQUNBLFNBQ1E7QUFDUixXQUFPO0FBQUEsTUFDTCxXQUFXLE9BQU8sTUFBTTtBQUFBLE1BQ3hCLGNBQWMsa0JBQWtCLG9CQUFJLEtBQUssQ0FBQyxDQUFDO0FBQUEsTUFDM0MsbUJBQW1CLFFBQVEsY0FBYztBQUFBLE1BQ3pDO0FBQUEsTUFDQSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsTUFDaEM7QUFBQSxJQUNGLEVBQUUsS0FBSyxJQUFJO0FBQUEsRUFDYjtBQUFBLEVBRVEsOEJBQ04sUUFDQSxTQUNRO0FBQ1IsV0FBTztBQUFBLE1BQ0wsWUFBWSxPQUFPLEtBQUs7QUFBQSxNQUN4QixHQUFHLEtBQUssd0JBQXdCLE9BQU87QUFBQSxNQUN2QyxnQkFBZ0Isa0JBQWtCLG9CQUFJLEtBQUssQ0FBQyxDQUFDO0FBQUEsTUFDN0M7QUFBQSxNQUNBLGtCQUFrQixPQUFPLE9BQU87QUFBQSxJQUNsQyxFQUFFLEtBQUssSUFBSTtBQUFBLEVBQ2I7QUFBQSxFQUVRLHdCQUFpQztBQTN3QjNDO0FBNHdCSSxXQUFPLFNBQVEsVUFBSyxJQUFJLFVBQVUsb0JBQW9CLDhCQUFZLE1BQW5ELG1CQUFzRCxJQUFJO0FBQUEsRUFDM0U7QUFBQSxFQUVRLHdCQUF3QixTQUFxQztBQUNuRSxXQUFPLHlCQUF5QixPQUFPO0FBQUEsRUFDekM7QUFBQSxFQUVRLHdCQUF3QixTQUFxQztBQUNuRSxVQUFNLGNBQWMsS0FBSyx3QkFBd0IsT0FBTztBQUN4RCxXQUFPLFlBQVksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7QUFBQSxFQUM5QztBQUFBLEVBRUEsTUFBYyxrQ0FBaUQ7QUFDN0QsVUFBTSxNQUFNLEtBQUssSUFBSTtBQUNyQixRQUFJLE1BQU0sS0FBSyxxQkFBcUIsS0FBTTtBQUN4QztBQUFBLElBQ0Y7QUFDQSxTQUFLLHFCQUFxQjtBQUMxQixRQUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0sS0FBSyxhQUFhLGtCQUFrQjtBQUN4RCxVQUFJLFNBQVM7QUFDYixpQkFBVyxRQUFRLE9BQU87QUFDeEIsWUFBSSxDQUFDLEtBQUssZUFBZSxLQUFLLElBQUksR0FBRztBQUNuQztBQUFBLFFBQ0Y7QUFDQSxZQUFJLEtBQUssS0FBSyxRQUFRLFFBQVE7QUFDNUIsbUJBQVMsS0FBSyxLQUFLO0FBQUEsUUFDckI7QUFBQSxNQUNGO0FBQ0EsV0FBSyxnQkFBZ0IsU0FBUyxJQUFJLElBQUksS0FBSyxNQUFNLElBQUk7QUFBQSxJQUN2RCxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLDhDQUE4QztBQUMvRCxXQUFLLGdCQUFnQjtBQUFBLElBQ3ZCO0FBQUEsRUFDRjtBQUFBLEVBRVEsZUFBZSxNQUF1QjtBQUM1QyxXQUNFLGNBQWMsTUFBTSxLQUFLLFNBQVMsV0FBVyxLQUM3QyxjQUFjLE1BQU0sS0FBSyxTQUFTLGVBQWU7QUFBQSxFQUVyRDtBQUFBLEVBRVEscUJBQXFCLE1BQXVCO0FBQ2xELFdBQ0UsY0FBYyxNQUFNLEtBQUssU0FBUyxlQUFlLEtBQ2pELGNBQWMsTUFBTSxLQUFLLFNBQVMsYUFBYTtBQUFBLEVBRW5EO0FBQUEsRUFFUSx5QkFBaUM7QUE5ekIzQztBQSt6QkksVUFBTSxhQUFhLEtBQUssSUFBSSxVQUFVLG9CQUFvQiw4QkFBWTtBQUN0RSxVQUFNLGFBQVksMERBQVksV0FBWixtQkFBb0IsbUJBQXBCLG1CQUFvQyxXQUFwQyxZQUE4QztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
