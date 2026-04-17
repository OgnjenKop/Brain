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
var import_obsidian18 = require("obsidian");

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
  openAIModel: "gpt-4.1-mini",
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
    new import_obsidian.Setting(containerEl).setName("Enable AI synthesis").setDesc("Use OpenAI for synthesis, question answering, and topic pages when configured.").addToggle(
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
    new import_obsidian.Setting(containerEl).setName("OpenAI API key").setDesc("Stored locally in plugin settings.").addText((text) => {
      text.inputEl.type = "password";
      text.setPlaceholder("sk-...");
      this.bindTextSetting(
        text,
        this.plugin.settings.openAIApiKey,
        (value) => {
          this.plugin.settings.openAIApiKey = value;
        },
        (value) => {
          if (value && !value.startsWith("sk-")) {
            new import_obsidian.Notice("OpenAI API key should start with 'sk-'");
            return false;
          }
          return true;
        }
      );
    });
    new import_obsidian.Setting(containerEl).setName("OpenAI model").setDesc("Model name used for synthesis, questions, topic pages, and routing requests.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.openAIModel,
        (value) => {
          this.plugin.settings.openAIModel = value;
        },
        (value) => {
          if (value && !value.trim()) {
            new import_obsidian.Notice("OpenAI model name cannot be empty");
            return false;
          }
          return true;
        }
      )
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
    var _a, _b, _c, _d;
    if (!settings.openAIApiKey.trim()) {
      throw new Error("OpenAI API key is missing");
    }
    const result = await (0, import_obsidian7.requestUrl)({
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.openAIApiKey.trim()}`,
        "Content-Type": "application/json"
      },
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

// src/services/vault-service.ts
var import_obsidian8 = require("obsidian");
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
    const normalized = (0, import_obsidian8.normalizePath)(folderPath).replace(/\/+$/, "");
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
      } else if (!(existing instanceof import_obsidian8.TFolder)) {
        throw new Error(`Path exists but is not a folder: ${current}`);
      }
    }
  }
  async ensureFile(filePath, initialContent = "") {
    const normalized = (0, import_obsidian8.normalizePath)(filePath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian8.TFile) {
      return existing;
    }
    if (existing) {
      throw new Error(`Path exists but is not a file: ${normalized}`);
    }
    await this.ensureFolder(parentFolder(normalized));
    return this.app.vault.create(normalized, initialContent);
  }
  async readText(filePath) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian8.normalizePath)(filePath));
    if (!(file instanceof import_obsidian8.TFile)) {
      return "";
    }
    return this.app.vault.read(file);
  }
  async readTextWithMtime(filePath) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian8.normalizePath)(filePath));
    if (!(file instanceof import_obsidian8.TFile)) {
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
    const normalized = (0, import_obsidian8.normalizePath)(filePath);
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
  const normalized = (0, import_obsidian8.normalizePath)(filePath);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

// src/views/prompt-modals.ts
var import_obsidian9 = require("obsidian");
var PromptModal = class extends import_obsidian9.Modal {
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
    new import_obsidian9.Setting(contentEl).addButton(
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
      new import_obsidian9.Notice("Enter some text first.");
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
var ResultModal = class extends import_obsidian9.Modal {
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

// src/views/inbox-review-modal.ts
var import_obsidian12 = require("obsidian");

// src/utils/error-handler.ts
var import_obsidian11 = require("obsidian");
function showError(error, defaultMessage) {
  console.error(error);
  const message = error instanceof Error ? error.message : defaultMessage;
  new import_obsidian11.Notice(message);
}

// src/views/inbox-review-modal.ts
var InboxReviewModal = class extends import_obsidian12.Modal {
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
          new import_obsidian12.Notice(message);
        }
      } catch (error) {
        showError(error, "Could not process review action");
      }
      this.currentIndex += 1;
      if (this.currentIndex >= this.entries.length) {
        new import_obsidian12.Notice("Inbox review complete");
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
var import_obsidian13 = require("obsidian");
var QuestionScopeModal = class extends import_obsidian13.Modal {
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
    new import_obsidian13.Setting(contentEl).addButton(
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
var import_obsidian14 = require("obsidian");
var ReviewHistoryModal = class extends import_obsidian14.Modal {
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
    if (!(abstractFile instanceof import_obsidian14.TFile)) {
      new import_obsidian14.Notice("Unable to open review log");
      return;
    }
    const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian14.Notice("Unable to open review log");
      return;
    }
    await leaf.openFile(abstractFile);
    this.app.workspace.revealLeaf(leaf);
  }
  async reopenEntry(entry) {
    try {
      const message = await this.plugin.reopenReviewEntry(entry);
      new import_obsidian14.Notice(message);
      this.close();
    } catch (error) {
      showError(error, "Could not re-open inbox entry");
    }
  }
};

// src/views/synthesis-result-modal.ts
var import_obsidian15 = require("obsidian");
var SynthesisResultModal = class extends import_obsidian15.Modal {
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
var import_obsidian16 = require("obsidian");
var TemplatePickerModal = class extends import_obsidian16.Modal {
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
    new import_obsidian16.Setting(contentEl).addButton(
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
var import_obsidian17 = require("obsidian");
var BRAIN_VIEW_TYPE = "brain-sidebar-view";
var BrainSidebarView = class extends import_obsidian17.ItemView {
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
          new import_obsidian17.Notice("Capture cleared");
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
      this.aiStatusEl.setText(this.plugin.getAiStatusText());
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
          new import_obsidian17.Notice("Capture cleared");
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
      new import_obsidian17.Notice("Enter some text first.");
      return;
    }
    this.setLoading(true);
    try {
      const route = await this.plugin.routeText(text);
      if (!route) {
        new import_obsidian17.Notice("Brain could not classify that entry");
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
      new import_obsidian17.Notice("Enter some text first.");
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
var BrainPlugin = class extends import_obsidian18.Plugin {
  constructor() {
    super(...arguments);
    this.sidebarView = null;
    this.lastSummaryAt = null;
  }
  async onload() {
    await this.loadSettings();
    this.vaultService = new VaultService(this.app);
    this.aiService = new BrainAIService();
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
      new import_obsidian18.Notice("Unable to open the sidebar");
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
    new import_obsidian18.Notice(message);
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
    if (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim()) {
      new import_obsidian18.Notice("AI routing is enabled but OpenAI is not configured");
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
      new import_obsidian18.Notice(`Topic page saved to ${saved.path}`);
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
    new import_obsidian18.Notice(
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
    const view = this.app.workspace.getActiveViewOfType(import_obsidian18.MarkdownView);
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
      new import_obsidian18.Notice("No inbox entries found");
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
    new import_obsidian18.Notice("No selection found. Opening task entry modal.");
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
      new import_obsidian18.Notice("Unable to open today's journal");
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
    if ((this.settings.enableAISummaries || this.settings.enableAIRouting) && (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim())) {
      return "AI enabled but missing key";
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
      new import_obsidian18.Notice("No markdown files found");
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
    return Boolean((_a = this.app.workspace.getActiveViewOfType(import_obsidian18.MarkdownView)) == null ? void 0 : _a.file);
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
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian18.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy90ZXh0LnRzIiwgInNyYy91dGlscy9wYXRoLnRzIiwgInNyYy91dGlscy9kYXRlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9qb3VybmFsLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL25vdGUtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZS50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZS50cyIsICJzcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy9zdW1tYXJ5LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9jb250ZXh0LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvdmF1bHQtc2VydmljZS50cyIsICJzcmMvdmlld3MvcHJvbXB0LW1vZGFscy50cyIsICJzcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL2luYm94LXJldmlldy1tb2RhbC50cyIsICJzcmMvdXRpbHMvZXJyb3ItaGFuZGxlci50cyIsICJzcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWwudHMiLCAic3JjL3ZpZXdzL3Jldmlldy1oaXN0b3J5LW1vZGFsLnRzIiwgInNyYy92aWV3cy9zeW50aGVzaXMtcmVzdWx0LW1vZGFsLnRzIiwgInNyYy92aWV3cy90ZW1wbGF0ZS1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyIsICJzcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4sIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBCcmFpblBsdWdpblNldHRpbmdzLFxuICBub3JtYWxpemVCcmFpblNldHRpbmdzLFxufSBmcm9tIFwiLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJyYWluU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5ncy10YWJcIjtcbmltcG9ydCB7IENvbnRleHRTZXJ2aWNlLCBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgTm90ZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvbm90ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZVwiO1xuaW1wb3J0IHsgUXVlc3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2VcIjtcbmltcG9ydCB7IFN1bW1hcnlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N1bW1hcnktc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0LCBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUb3BpY1BhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgUHJvbXB0TW9kYWwsXG4gIFJlc3VsdE1vZGFsLFxufSBmcm9tIFwiLi9zcmMvdmlld3MvcHJvbXB0LW1vZGFsc1wiO1xuaW1wb3J0IHsgRmlsZUdyb3VwUGlja2VyTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlTW9kYWwsIFF1ZXN0aW9uU2NvcGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWxcIjtcbmltcG9ydCB7IFJldmlld0hpc3RvcnlNb2RhbCB9IGZyb20gXCIuL3NyYy92aWV3cy9yZXZpZXctaGlzdG9yeS1tb2RhbFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbFwiO1xuaW1wb3J0IHsgVGVtcGxhdGVQaWNrZXJNb2RhbCwgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQge1xuICBCUkFJTl9WSUVXX1RZUEUsXG4gIEJyYWluU2lkZWJhclZpZXcsXG59IGZyb20gXCIuL3NyYy92aWV3cy9zaWRlYmFyLXZpZXdcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4vc3JjL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN1bW1hcnlSZXN1bHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0U291cmNlTGluZXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi9zcmMvdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gXCIuL3NyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kc1wiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJhaW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIHZhdWx0U2VydmljZSE6IFZhdWx0U2VydmljZTtcbiAgaW5ib3hTZXJ2aWNlITogSW5ib3hTZXJ2aWNlO1xuICBub3RlU2VydmljZSE6IE5vdGVTZXJ2aWNlO1xuICB0YXNrU2VydmljZSE6IFRhc2tTZXJ2aWNlO1xuICBqb3VybmFsU2VydmljZSE6IEpvdXJuYWxTZXJ2aWNlO1xuICByZXZpZXdMb2dTZXJ2aWNlITogUmV2aWV3TG9nU2VydmljZTtcbiAgcmV2aWV3U2VydmljZSE6IFJldmlld1NlcnZpY2U7XG4gIHF1ZXN0aW9uU2VydmljZSE6IFF1ZXN0aW9uU2VydmljZTtcbiAgY29udGV4dFNlcnZpY2UhOiBDb250ZXh0U2VydmljZTtcbiAgc3ludGhlc2lzU2VydmljZSE6IFN5bnRoZXNpc1NlcnZpY2U7XG4gIHRvcGljUGFnZVNlcnZpY2UhOiBUb3BpY1BhZ2VTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgc3VtbWFyeVNlcnZpY2UhOiBTdW1tYXJ5U2VydmljZTtcbiAgcHJpdmF0ZSBzaWRlYmFyVmlldzogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxhc3RTdW1tYXJ5QXQ6IERhdGUgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMudmF1bHRTZXJ2aWNlID0gbmV3IFZhdWx0U2VydmljZSh0aGlzLmFwcCk7XG4gICAgdGhpcy5haVNlcnZpY2UgPSBuZXcgQnJhaW5BSVNlcnZpY2UoKTtcbiAgICB0aGlzLmluYm94U2VydmljZSA9IG5ldyBJbmJveFNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMubm90ZVNlcnZpY2UgPSBuZXcgTm90ZVNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMudGFza1NlcnZpY2UgPSBuZXcgVGFza1NlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuam91cm5hbFNlcnZpY2UgPSBuZXcgSm91cm5hbFNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLmNvbnRleHRTZXJ2aWNlID0gbmV3IENvbnRleHRTZXJ2aWNlKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UgPSBuZXcgUmV2aWV3TG9nU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3U2VydmljZSA9IG5ldyBSZXZpZXdTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICB0aGlzLmluYm94U2VydmljZSxcbiAgICAgIHRoaXMudGFza1NlcnZpY2UsXG4gICAgICB0aGlzLmpvdXJuYWxTZXJ2aWNlLFxuICAgICAgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucXVlc3Rpb25TZXJ2aWNlID0gbmV3IFF1ZXN0aW9uU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3VtbWFyeVNlcnZpY2UgPSBuZXcgU3VtbWFyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3ludGhlc2lzU2VydmljZSA9IG5ldyBTeW50aGVzaXNTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlID0gbmV3IFRvcGljUGFnZVNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUtub3duRm9sZGVycyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVMYXN0QXJ0aWZhY3RUaW1lc3RhbXAoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRoZSBzaWRlYmFyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBCUkFJTl9WSUVXX1RZUEUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGhhc09wZW5TaWRlYmFyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSkubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFJlc3VsdCh0ZXh0KTtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RTdW1tYXJ5KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQobWVzc2FnZSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgfVxuXG4gIGdldExhc3RTdW1tYXJ5TGFiZWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sYXN0U3VtbWFyeUF0ID8gZm9ybWF0RGF0ZVRpbWVLZXkodGhpcy5sYXN0U3VtbWFyeUF0KSA6IFwiTm8gYXJ0aWZhY3QgeWV0XCI7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICF0aGlzLnNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgbmV3IE5vdGljZShcIkFJIHJvdXRpbmcgaXMgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uucm91dGVUZXh0KHRleHQsIHRoaXMuc2V0dGluZ3MpO1xuICAgIGlmIChyb3V0ZSkge1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBBdXRvLXJvdXRlZCBhcyAke3JvdXRlfWApO1xuICAgIH1cbiAgICByZXR1cm4gcm91dGU7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnROb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKSxcbiAgICAgIFwiU3VtbWFyaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgXCJzdW1tYXJpemVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0U2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZFRleHRDb250ZXh0KCksXG4gICAgICBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgIFwiZXh0cmFjdC10YXNrc1wiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFJlY2VudEZpbGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRSZWNlbnRGaWxlc0NvbnRleHQoKSxcbiAgICAgIFwiQ2xlYW4gTm90ZSBGcm9tIFJlY2VudCBGaWxlc1wiLFxuICAgICAgXCJyZXdyaXRlLWNsZWFuLW5vdGVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgXCJEcmFmdCBCcmllZiBGcm9tIEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICBcImRyYWZ0LXByb2plY3QtYnJpZWZcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZU5vdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzY29wZSA9IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiU3ludGhlc2l6ZSBOb3Rlc1wiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyB0byBTeW50aGVzaXplXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcGxhdGUgPSBhd2FpdCB0aGlzLnBpY2tTeW50aGVzaXNUZW1wbGF0ZShcIlN5bnRoZXNpemUgTm90ZXNcIik7XG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoZXNlIG5vdGVzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoXCJub3RlXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwiZm9sZGVyXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFzayBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZSgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoZGVmYXVsdFNjb3BlPzogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0b3BpYyA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJUb3BpYyBvciBxdWVzdGlvbiB0byB0dXJuIGludG8gYSB3aWtpIHBhZ2UuLi5cIixcbiAgICAgICAgc3VibWl0TGFiZWw6IFwiQ3JlYXRlXCIsXG4gICAgICAgIG11bHRpbGluZTogdHJ1ZSxcbiAgICAgIH0pLm9wZW5Qcm9tcHQoKTtcbiAgICAgIGlmICghdG9waWMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IGRlZmF1bHRTY29wZSA/PyBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICAgICAgc2NvcGUsXG4gICAgICAgIFwiU2VsZWN0IE5vdGVzIGZvciBUb3BpYyBQYWdlXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZSh0b3BpYywgY29udGV4dCk7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgICAgcmVzdWx0Lm5vdGVUaXRsZSxcbiAgICAgICAgcmVzdWx0LmNvbnRlbnQsXG4gICAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aCxcbiAgICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIHRvcGljIHBhZ2Ugc2F2ZWQgdG8gJHtzYXZlZC5wYXRofWBcbiAgICAgICAgICA6IGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgICBuZXcgTm90aWNlKGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gKTtcblxuICAgICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICAgIGlmIChsZWFmKSB7XG4gICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoc2F2ZWQpO1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjcmVhdGUgdGhhdCB0b3BpYyBwYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyhcbiAgICBsb29rYmFja0RheXM/OiBudW1iZXIsXG4gICAgbGFiZWw/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3VtbWFyeVNlcnZpY2UuZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cywgbGFiZWwpO1xuICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShgJHtyZXN1bHQudGl0bGV9XFxuXFxuJHtyZXN1bHQuY29udGVudH1gKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWAgOiBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCBsb2NhbGx5YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IE5vdGljZShcbiAgICAgIHJlc3VsdC5wZXJzaXN0ZWRQYXRoXG4gICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBzYXZlZCB0byAke3Jlc3VsdC5wZXJzaXN0ZWRQYXRofWBcbiAgICAgICAgOiByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYFxuICAgICAgICAgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBpZiAoIXRoaXMuaGFzT3BlblNpZGViYXIoKSkge1xuICAgICAgbmV3IFJlc3VsdE1vZGFsKHRoaXMuYXBwLCBgQnJhaW4gJHtyZXN1bHQudGl0bGV9YCwgcmVzdWx0LmNvbnRlbnQpLm9wZW4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTeW50aGVzaXNSZXN1bHQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICB0aGlzLmJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgcmV0dXJuIGBTYXZlZCBhcnRpZmFjdCB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkaXRpb24gPSB0aGlzLmJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KHJlc3VsdCwgY29udGV4dCk7XG4gICAgY29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG4gICAgY29uc3QgbGFzdExpbmUgPSBlZGl0b3IubGFzdExpbmUoKTtcbiAgICBjb25zdCBsYXN0TGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsYXN0TGluZSk7XG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSB7IGxpbmU6IGxhc3RMaW5lLCBjaDogbGFzdExpbmVUZXh0Lmxlbmd0aCB9O1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IHRoaXMuZ2V0QXBwZW5kU2VwYXJhdG9yKGVkaXRvci5nZXRWYWx1ZSgpKTtcbiAgICBlZGl0b3IucmVwbGFjZVJhbmdlKGAke3NlcGFyYXRvcn0ke2FkZGl0aW9ufVxcbmAsIGVuZFBvc2l0aW9uKTtcbiAgICByZXR1cm4gYEluc2VydGVkIHN5bnRoZXNpcyBpbnRvICR7dmlldy5maWxlLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVGcm9tTW9kYWwoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBzdWJtaXRMYWJlbDogc3RyaW5nLFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIG11bHRpbGluZSA9IGZhbHNlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgdGl0bGUsXG4gICAgICBwbGFjZWhvbGRlcjogbXVsdGlsaW5lXG4gICAgICAgID8gXCJXcml0ZSB5b3VyIGVudHJ5IGhlcmUuLi5cIlxuICAgICAgICA6IFwiVHlwZSBoZXJlLi4uXCIsXG4gICAgICBzdWJtaXRMYWJlbCxcbiAgICAgIG11bHRpbGluZSxcbiAgICB9KS5vcGVuUHJvbXB0KCk7XG5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHZhbHVlKTtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJCcmFpbiBjb3VsZCBub3Qgc2F2ZSB0aGF0IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVOb3RlKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgcmV0dXJuIGBDYXB0dXJlZCBub3RlIGluICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZVRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlSm91cm5hbCh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzSW5ib3goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5nZXRSZWNlbnRJbmJveEVudHJpZXMoKTtcbiAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBuZXcgSW5ib3hSZXZpZXdNb2RhbCh0aGlzLmFwcCwgZW50cmllcywgdGhpcy5yZXZpZXdTZXJ2aWNlLCBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgfSkub3BlbigpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgTG9hZGVkICR7ZW50cmllcy5sZW5ndGh9IGluYm94IGVudHJpZXNgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICB9XG5cbiAgYXN5bmMgb3BlblJldmlld0hpc3RvcnkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyaWVzKCk7XG4gICAgbmV3IFJldmlld0hpc3RvcnlNb2RhbCh0aGlzLmFwcCwgZW50cmllcywgdGhpcykub3BlbigpO1xuICB9XG5cbiAgYXN5bmMgYWRkVGFza0Zyb21TZWxlY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gdGhpcy5nZXRBY3RpdmVTZWxlY3Rpb25UZXh0KCk7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2soc2VsZWN0aW9uKTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgU2F2ZWQgdGFzayBmcm9tIHNlbGVjdGlvbiB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBOb3RpY2UoXCJObyBzZWxlY3Rpb24gZm91bmQuIE9wZW5pbmcgdGFzayBlbnRyeSBtb2RhbC5cIik7XG4gICAgYXdhaXQgdGhpcy5jYXB0dXJlRnJvbU1vZGFsKFwiQWRkIFRhc2tcIiwgXCJTYXZlIHRhc2tcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgb3BlblRvZGF5c0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuZW5zdXJlSm91cm5hbEZpbGUoKTtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRvZGF5J3Mgam91cm5hbFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgT3BlbmVkICR7ZmlsZS5wYXRofWA7XG4gICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBnZXRJbmJveENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLmdldFVucmV2aWV3ZWRDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmdldE9wZW5UYXNrQ291bnQoKTtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0hpc3RvcnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cnlDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuUmV2aWV3RW50cnkoZW50cnk6IHtcbiAgICBoZWFkaW5nOiBzdHJpbmc7XG4gICAgcHJldmlldzogc3RyaW5nO1xuICAgIHNpZ25hdHVyZTogc3RyaW5nO1xuICAgIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5yZW9wZW5Gcm9tUmV2aWV3TG9nKHtcbiAgICAgIGFjdGlvbjogXCJyZW9wZW5cIixcbiAgICAgIHRpbWVzdGFtcDogXCJcIixcbiAgICAgIHNvdXJjZVBhdGg6IFwiXCIsXG4gICAgICBmaWxlTXRpbWU6IERhdGUubm93KCksXG4gICAgICBlbnRyeUluZGV4OiAwLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0QWlTdGF0dXNUZXh0KCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzICYmICF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIFwiQUkgb2ZmXCI7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgKHRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgfHwgdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpICYmXG4gICAgICAoIXRoaXMuc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJBSSBlbmFibGVkIGJ1dCBtaXNzaW5nIGtleVwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIkFJIGNvbmZpZ3VyZWRcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgICBkZWZhdWx0VGVtcGxhdGU/OiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBkZWZhdWx0VGVtcGxhdGUgPz8gKGF3YWl0IHRoaXMucGlja1N5bnRoZXNpc1RlbXBsYXRlKG1vZGFsVGl0bGUpKTtcbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1blN5bnRoZXNpc0Zsb3coY29udGV4dCwgdGVtcGxhdGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHN5bnRoZXNpemUgdGhhdCBjb250ZXh0XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25Gb3JTY29wZShzY29wZTogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZm9sZGVyXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCksXG4gICAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEVudGlyZSBWYXVsdFwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZ3JvdXBcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkFib3V0U2VsZWN0ZWRHcm91cCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgIHNjb3BlOiBRdWVzdGlvblNjb3BlLFxuICAgIGdyb3VwUGlja2VyVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0IHwgbnVsbD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpO1xuICAgICAgY2FzZSBcImdyb3VwXCI6IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXMoZ3JvdXBQaWNrZXJUaXRsZSk7XG4gICAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKFwiU2VsZWN0IE5vdGVzXCIpO1xuICAgICAgaWYgKCFmaWxlcyB8fCAhZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKSxcbiAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgU2VsZWN0ZWQgTm90ZXNcIixcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc2VsZWN0IG5vdGVzIGZvciBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXModGl0bGU6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0XG4gICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhdGhpcy5pc0JyYWluR2VuZXJhdGVkRmlsZShmaWxlLnBhdGgpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcblxuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbWFya2Rvd24gZmlsZXMgZm91bmRcIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgbmV3IEZpbGVHcm91cFBpY2tlck1vZGFsKHRoaXMuYXBwLCBmaWxlcywge1xuICAgICAgdGl0bGUsXG4gICAgfSkub3BlblBpY2tlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IG1vZGFsVGl0bGUsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhIHF1ZXN0aW9uIGFib3V0IHRoaXMgY29udGV4dC4uLlwiLFxuICAgICAgICBzdWJtaXRMYWJlbDogXCJBc2tcIixcbiAgICAgICAgbXVsdGlsaW5lOiB0cnVlLFxuICAgICAgfSkub3BlblByb21wdCgpO1xuICAgICAgaWYgKCFxdWVzdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlc3Rpb25TZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0KTtcbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIGFuc3dlciBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXG4gICAgICAgICAgOiBgTG9jYWwgYW5zd2VyIGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWAsXG4gICAgICApO1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBjb250ZXh0LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGNhbkluc2VydDogdGhpcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uU2F2ZTogYXN5bmMgKCkgPT4gdGhpcy5zYXZlU3ludGhlc2lzUmVzdWx0KHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uQWN0aW9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIFwic3VtbWFyaXplXCIpO1xuICAgICAgICB9LFxuICAgICAgfSkub3BlbigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFuc3dlciB0aGF0IHF1ZXN0aW9uXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuU3ludGhlc2lzRmxvdyhcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zeW50aGVzaXNTZXJ2aWNlLnJ1bih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgID8gYEFJICR7cmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCl9IGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBcbiAgICAgICAgOiBgTG9jYWwgJHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX0gZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IFN5bnRoZXNpc1Jlc3VsdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBjb250ZXh0LFxuICAgICAgcmVzdWx0LFxuICAgICAgY2FuSW5zZXJ0OiB0aGlzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICBvblNhdmU6IGFzeW5jICgpID0+IHRoaXMuc2F2ZVN5bnRoZXNpc1Jlc3VsdChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgb25BY3Rpb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICB9LFxuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGlja1N5bnRoZXNpc1RlbXBsYXRlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBUZW1wbGF0ZVBpY2tlck1vZGFsKHRoaXMuYXBwLCB7IHRpdGxlIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRTeW50aGVzaXNOb3RlQ29udGVudChcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBbXG4gICAgICBgQWN0aW9uOiAke3Jlc3VsdC5hY3Rpb259YCxcbiAgICAgIGBHZW5lcmF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YCxcbiAgICAgIGBDb250ZXh0IGxlbmd0aDogJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofSBjaGFyYWN0ZXJzLmAsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5zdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRJbnNlcnRlZFN5bnRoZXNpc0NvbnRlbnQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW1xuICAgICAgYCMjIEJyYWluICR7cmVzdWx0LnRpdGxlfWAsXG4gICAgICAuLi50aGlzLmJ1aWxkQ29udGV4dEJ1bGxldExpbmVzKGNvbnRleHQpLFxuICAgICAgYC0gR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5zdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNBY3RpdmVNYXJrZG93bk5vdGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KT8uZmlsZSk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIGZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0KTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0QnVsbGV0TGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBzb3VyY2VMaW5lcyA9IHRoaXMuYnVpbGRDb250ZXh0U291cmNlTGluZXMoY29udGV4dCk7XG4gICAgcmV0dXJuIHNvdXJjZUxpbmVzLm1hcCgobGluZSkgPT4gYC0gJHtsaW5lfWApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgICBsZXQgbGF0ZXN0ID0gMDtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICBpZiAoIXRoaXMuaXNBcnRpZmFjdEZpbGUoZmlsZS5wYXRoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlLnN0YXQubXRpbWUgPiBsYXRlc3QpIHtcbiAgICAgICAgICBsYXRlc3QgPSBmaWxlLnN0YXQubXRpbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IGxhdGVzdCA+IDAgPyBuZXcgRGF0ZShsYXRlc3QpIDogbnVsbDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIGxhc3QgYXJ0aWZhY3QgdGltZXN0YW1wXCIpO1xuICAgICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzQXJ0aWZhY3RGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Mubm90ZXNGb2xkZXIpIHx8XG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGlzQnJhaW5HZW5lcmF0ZWRGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSB8fFxuICAgICAgaXNVbmRlckZvbGRlcihwYXRoLCB0aGlzLnNldHRpbmdzLnJldmlld3NGb2xkZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBwZW5kU2VwYXJhdG9yKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXFxuXCIpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRleHQuZW5kc1dpdGgoXCJcXG5cIikpIHtcbiAgICAgIHJldHVybiBcIlxcblwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJcXG5cXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgc3RyaXBMZWFkaW5nVGl0bGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuICAgIGlmICghbGluZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBpZiAoIS9eI1xccysvLnRlc3QobGluZXNbMF0pKSB7XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtYWluaW5nID0gbGluZXMuc2xpY2UoMSk7XG4gICAgd2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwICYmICFyZW1haW5pbmdbMF0udHJpbSgpKSB7XG4gICAgICByZW1haW5pbmcuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlbWFpbmluZy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IG51bWJlcjtcbiAgc3VtbWFyeU1heENoYXJzOiBudW1iZXI7XG5cbiAgcGVyc2lzdFN1bW1hcmllczogYm9vbGVhbjtcblxuICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CUkFJTl9TRVRUSU5HUzogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgaW5ib3hGaWxlOiBcIkJyYWluL2luYm94Lm1kXCIsXG4gIHRhc2tzRmlsZTogXCJCcmFpbi90YXNrcy5tZFwiLFxuICBqb3VybmFsRm9sZGVyOiBcIkJyYWluL2pvdXJuYWxcIixcbiAgbm90ZXNGb2xkZXI6IFwiQnJhaW4vbm90ZXNcIixcbiAgc3VtbWFyaWVzRm9sZGVyOiBcIkJyYWluL3N1bW1hcmllc1wiLFxuICByZXZpZXdzRm9sZGVyOiBcIkJyYWluL3Jldmlld3NcIixcbiAgZW5hYmxlQUlTdW1tYXJpZXM6IGZhbHNlLFxuICBlbmFibGVBSVJvdXRpbmc6IGZhbHNlLFxuICBvcGVuQUlBcGlLZXk6IFwiXCIsXG4gIG9wZW5BSU1vZGVsOiBcImdwdC00LjEtbWluaVwiLFxuICBzdW1tYXJ5TG9va2JhY2tEYXlzOiA3LFxuICBzdW1tYXJ5TWF4Q2hhcnM6IDEyMDAwLFxuICBwZXJzaXN0U3VtbWFyaWVzOiB0cnVlLFxuICBjb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnM6IFtdLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MoXG4gIGlucHV0OiBQYXJ0aWFsPEJyYWluUGx1Z2luU2V0dGluZ3M+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgY29uc3QgbWVyZ2VkOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICAgIC4uLkRFRkFVTFRfQlJBSU5fU0VUVElOR1MsXG4gICAgLi4uaW5wdXQsXG4gIH0gYXMgQnJhaW5QbHVnaW5TZXR0aW5ncztcblxuICByZXR1cm4ge1xuICAgIGluYm94RmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKG1lcmdlZC5pbmJveEZpbGUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5ib3hGaWxlKSxcbiAgICB0YXNrc0ZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChtZXJnZWQudGFza3NGaWxlLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnRhc2tzRmlsZSksXG4gICAgam91cm5hbEZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLmpvdXJuYWxGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmpvdXJuYWxGb2xkZXIsXG4gICAgKSxcbiAgICBub3Rlc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLm5vdGVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5ub3Rlc0ZvbGRlcixcbiAgICApLFxuICAgIHN1bW1hcmllc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muc3VtbWFyaWVzRm9sZGVyLFxuICAgICksXG4gICAgcmV2aWV3c0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLnJldmlld3NGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnJldmlld3NGb2xkZXIsXG4gICAgKSxcbiAgICBlbmFibGVBSVN1bW1hcmllczogQm9vbGVhbihtZXJnZWQuZW5hYmxlQUlTdW1tYXJpZXMpLFxuICAgIGVuYWJsZUFJUm91dGluZzogQm9vbGVhbihtZXJnZWQuZW5hYmxlQUlSb3V0aW5nKSxcbiAgICBvcGVuQUlBcGlLZXk6IHR5cGVvZiBtZXJnZWQub3BlbkFJQXBpS2V5ID09PSBcInN0cmluZ1wiID8gbWVyZ2VkLm9wZW5BSUFwaUtleS50cmltKCkgOiBcIlwiLFxuICAgIG9wZW5BSU1vZGVsOlxuICAgICAgdHlwZW9mIG1lcmdlZC5vcGVuQUlNb2RlbCA9PT0gXCJzdHJpbmdcIiAmJiBtZXJnZWQub3BlbkFJTW9kZWwudHJpbSgpXG4gICAgICAgID8gbWVyZ2VkLm9wZW5BSU1vZGVsLnRyaW0oKVxuICAgICAgICA6IERFRkFVTFRfQlJBSU5fU0VUVElOR1Mub3BlbkFJTW9kZWwsXG4gICAgc3VtbWFyeUxvb2tiYWNrRGF5czogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TG9va2JhY2tEYXlzLCAxLCAzNjUsIERFRkFVTFRfQlJBSU5fU0VUVElOR1Muc3VtbWFyeUxvb2tiYWNrRGF5cyksXG4gICAgc3VtbWFyeU1heENoYXJzOiBjbGFtcEludGVnZXIobWVyZ2VkLnN1bW1hcnlNYXhDaGFycywgMTAwMCwgMTAwMDAwLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlNYXhDaGFycyksXG4gICAgcGVyc2lzdFN1bW1hcmllczogQm9vbGVhbihtZXJnZWQucGVyc2lzdFN1bW1hcmllcyksXG4gICAgY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zOiBBcnJheS5pc0FycmF5KG1lcmdlZC5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMpXG4gICAgICA/IChtZXJnZWQuY29sbGFwc2VkU2lkZWJhclNlY3Rpb25zIGFzIHN0cmluZ1tdKS5maWx0ZXIoKHMpID0+IHR5cGVvZiBzID09PSBcInN0cmluZ1wiKVxuICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUmVsYXRpdmVQYXRoKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjazogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB2YWx1ZS50cmltKCkucmVwbGFjZSgvXlxcLysvLCBcIlwiKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gbm9ybWFsaXplZCB8fCBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gY2xhbXBJbnRlZ2VyKFxuICB2YWx1ZTogdW5rbm93bixcbiAgbWluOiBudW1iZXIsXG4gIG1heDogbnVtYmVyLFxuICBmYWxsYmFjazogbnVtYmVyLFxuKTogbnVtYmVyIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgcGFyc2VkKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbGxiYWNrO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBUZXh0Q29tcG9uZW50IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW4gU2V0dGluZ3NcIiB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0b3JhZ2VcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbmJveCBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgbm90ZSBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJJbmJveCBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiVGFza3MgZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHVzZWQgZm9yIHF1aWNrIHRhc2sgY2FwdHVyZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiVGFza3MgZmlsZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkpvdXJuYWwgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciBjb250YWluaW5nIGRhaWx5IGpvdXJuYWwgZmlsZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSm91cm5hbCBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOb3RlcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgZm9yIHByb21vdGVkIG5vdGVzIGFuZCBnZW5lcmF0ZWQgbWFya2Rvd24gYXJ0aWZhY3RzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3VtbWFyaWVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcGVyc2lzdGVkIHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiU3VtbWFyaWVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJldmlld3MgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIHRvIHN0b3JlIGluYm94IHJldmlldyBsb2dzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV2aWV3c0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlJldmlld3MgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBBSSBzeW50aGVzaXNcIilcbiAgICAgIC5zZXREZXNjKFwiVXNlIE9wZW5BSSBmb3Igc3ludGhlc2lzLCBxdWVzdGlvbiBhbnN3ZXJpbmcsIGFuZCB0b3BpYyBwYWdlcyB3aGVuIGNvbmZpZ3VyZWQuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBBSSByb3V0aW5nXCIpXG4gICAgICAuc2V0RGVzYyhcIkFsbG93IHRoZSBzaWRlYmFyIHRvIGF1dG8tcm91dGUgY2FwdHVyZXMgd2l0aCBBSS5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJPcGVuQUkgQVBJIGtleVwiKVxuICAgICAgLnNldERlc2MoXCJTdG9yZWQgbG9jYWxseSBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwicGFzc3dvcmRcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcInNrLS4uLlwiKTtcbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXksXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlBcGlLZXkgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmICF2YWx1ZS5zdGFydHNXaXRoKFwic2stXCIpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJPcGVuQUkgQVBJIGtleSBzaG91bGQgc3RhcnQgd2l0aCAnc2stJ1wiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk9wZW5BSSBtb2RlbFwiKVxuICAgICAgLnNldERlc2MoXCJNb2RlbCBuYW1lIHVzZWQgZm9yIHN5bnRoZXNpcywgcXVlc3Rpb25zLCB0b3BpYyBwYWdlcywgYW5kIHJvdXRpbmcgcmVxdWVzdHMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAhdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJPcGVuQUkgbW9kZWwgbmFtZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29udGV4dCBDb2xsZWN0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTG9va2JhY2sgZGF5c1wiKVxuICAgICAgLnNldERlc2MoXCJIb3cgZmFyIGJhY2sgdG8gc2NhbiB3aGVuIGJ1aWxkaW5nIHJlY2VudC1jb250ZXh0IHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDAgPyBwYXJzZWQgOiA3O1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1heGltdW0gY2hhcmFjdGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJNYXhpbXVtIHRleHQgY29sbGVjdGVkIGJlZm9yZSBzeW50aGVzaXMgb3Igc3VtbWFyeS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPj0gMTAwMCA/IHBhcnNlZCA6IDEyMDAwO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3VtbWFyeSBPdXRwdXRcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQZXJzaXN0IHN1bW1hcmllc1wiKVxuICAgICAgLnNldERlc2MoXCJXcml0ZSBnZW5lcmF0ZWQgc3VtbWFyaWVzIGludG8gdGhlIHZhdWx0LlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBsYXN0U2F2ZWRWYWx1ZSA9IHZhbHVlO1xuICAgIGxldCBpc1NhdmluZyA9IGZhbHNlO1xuXG4gICAgdGV4dC5zZXRWYWx1ZSh2YWx1ZSkub25DaGFuZ2UoKG5leHRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShuZXh0VmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlU2F2ZU9uQmx1cihcbiAgICAgIHRleHQuaW5wdXRFbCxcbiAgICAgICgpID0+IGN1cnJlbnRWYWx1ZSxcbiAgICAgICgpID0+IGxhc3RTYXZlZFZhbHVlLFxuICAgICAgKHNhdmVkVmFsdWUpID0+IHtcbiAgICAgICAgbGFzdFNhdmVkVmFsdWUgPSBzYXZlZFZhbHVlO1xuICAgICAgfSxcbiAgICAgICgpID0+IGlzU2F2aW5nLFxuICAgICAgKHNhdmluZykgPT4ge1xuICAgICAgICBpc1NhdmluZyA9IHNhdmluZztcbiAgICAgIH0sXG4gICAgICB2YWxpZGF0ZSxcbiAgICApO1xuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVNhdmVPbkJsdXIoXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgZ2V0Q3VycmVudFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgZ2V0TGFzdFNhdmVkVmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRMYXN0U2F2ZWRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgaXNTYXZpbmc6ICgpID0+IGJvb2xlYW4sXG4gICAgc2V0U2F2aW5nOiAoc2F2aW5nOiBib29sZWFuKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IHZvaWQge1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlT25CbHVyKFxuICAgICAgICBnZXRDdXJyZW50VmFsdWUsXG4gICAgICAgIGdldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBzZXRMYXN0U2F2ZWRWYWx1ZSxcbiAgICAgICAgaXNTYXZpbmcsXG4gICAgICAgIHNldFNhdmluZyxcbiAgICAgICAgdmFsaWRhdGUsXG4gICAgICApO1xuICAgIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZU9uQmx1cihcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGlzU2F2aW5nKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRDdXJyZW50VmFsdWUoKTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09PSBnZXRMYXN0U2F2ZWRWYWx1ZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2F2aW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIHNldExhc3RTYXZlZFZhbHVlKGN1cnJlbnRWYWx1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNhdmluZyhmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRoZXNpc0NvbnRleHQge1xuICBzb3VyY2VMYWJlbDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsO1xuICBzb3VyY2VQYXRocz86IHN0cmluZ1tdO1xuICB0ZXh0OiBzdHJpbmc7XG4gIG9yaWdpbmFsTGVuZ3RoOiBudW1iZXI7XG4gIHRydW5jYXRlZDogYm9vbGVhbjtcbiAgbWF4Q2hhcnM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRleHRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldEN1cnJlbnROb3RlQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSB2aWV3LmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnQgbm90ZSBpcyBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoXCJDdXJyZW50IG5vdGVcIiwgdmlldy5maWxlLnBhdGgsIHRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VsZWN0ZWRUZXh0Q29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSB2aWV3LmVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3Qgc29tZSB0ZXh0IGZpcnN0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChcIlNlbGVjdGVkIHRleHRcIiwgdmlldy5maWxlLnBhdGgsIHRleHQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmVjZW50RmlsZXNDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RSZWNlbnRNYXJrZG93bkZpbGVzKHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXMpO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIlJlY2VudCBmaWxlc1wiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW4gYSBtYXJrZG93biBub3RlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvbGRlclBhdGggPSB2aWV3LmZpbGUucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RGaWxlc0luRm9sZGVyKGZvbGRlclBhdGgpO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIkN1cnJlbnQgZm9sZGVyXCIsIGZpbGVzLCBmb2xkZXJQYXRoIHx8IG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VsZWN0ZWRGaWxlc0NvbnRleHQoZmlsZXM6IFRGaWxlW10pOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBtYXJrZG93biBub3RlXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIlNlbGVjdGVkIG5vdGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldFZhdWx0Q29udGV4dCgpOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdFZhdWx0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiB0aGlzLmJ1aWxkRmlsZUdyb3VwQ29udGV4dChcIkVudGlyZSB2YXVsdFwiLCBmaWxlcywgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dChcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFN5bnRoZXNpc0NvbnRleHQge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgbWF4Q2hhcnMgPSBNYXRoLm1heCgxMDAwLCBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpO1xuICAgIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgICBjb25zdCBvcmlnaW5hbExlbmd0aCA9IHRyaW1tZWQubGVuZ3RoO1xuICAgIGNvbnN0IHRydW5jYXRlZCA9IG9yaWdpbmFsTGVuZ3RoID4gbWF4Q2hhcnM7XG4gICAgY29uc3QgbGltaXRlZCA9IHRydW5jYXRlZCA/IHRyaW1tZWQuc2xpY2UoMCwgbWF4Q2hhcnMpLnRyaW1FbmQoKSA6IHRyaW1tZWQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc291cmNlTGFiZWwsXG4gICAgICBzb3VyY2VQYXRoLFxuICAgICAgc291cmNlUGF0aHMsXG4gICAgICB0ZXh0OiBsaW1pdGVkLFxuICAgICAgb3JpZ2luYWxMZW5ndGgsXG4gICAgICB0cnVuY2F0ZWQsXG4gICAgICBtYXhDaGFycyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBidWlsZEZpbGVHcm91cENvbnRleHQoXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBmaWxlczogVEZpbGVbXSxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICApOiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+IHtcbiAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBtYXJrZG93biBmaWxlcyBmb3VuZCBmb3IgJHtzb3VyY2VMYWJlbC50b0xvd2VyQ2FzZSgpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIGZpbGVzLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzLFxuICAgICk7XG5cbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG1hcmtkb3duIGZpbGVzIGZvdW5kIGZvciAke3NvdXJjZUxhYmVsLnRvTG93ZXJDYXNlKCl9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KHNvdXJjZUxhYmVsLCBzb3VyY2VQYXRoLCB0ZXh0LCBmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUucGF0aCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0UmVjZW50TWFya2Rvd25GaWxlcyhsb29rYmFja0RheXM6IG51bWJlcik6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IGN1dG9mZiA9IGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5cykuZ2V0VGltZSgpO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGZpbGUuc3RhdC5tdGltZSA+PSBjdXRvZmYpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0VmF1bHRNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RGaWxlc0luRm9sZGVyKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+XG4gICAgICAgIGZvbGRlclBhdGggPyBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgZm9sZGVyUGF0aCkgOiAhZmlsZS5wYXRoLmluY2x1ZGVzKFwiL1wiKSxcbiAgICAgIClcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzOiBudW1iZXIpOiBEYXRlIHtcbiAgY29uc3Qgc2FmZURheXMgPSBNYXRoLm1heCgxLCBsb29rYmFja0RheXMpO1xuICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKCk7XG4gIHN0YXJ0LnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICBzdGFydC5zZXREYXRlKHN0YXJ0LmdldERhdGUoKSAtIChzYWZlRGF5cyAtIDEpKTtcbiAgcmV0dXJuIHN0YXJ0O1xufVxuIiwgImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gIGZpbGVzOiBURmlsZVtdLFxuICBtYXhDaGFyczogbnVtYmVyLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGxldCB0b3RhbCA9IDA7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB2YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmxvY2sgPSBbYC0tLSAke2ZpbGUucGF0aH1gLCB0cmltbWVkXS5qb2luKFwiXFxuXCIpO1xuICAgICAgaWYgKHRvdGFsICsgYmxvY2subGVuZ3RoID4gbWF4Q2hhcnMpIHtcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gTWF0aC5tYXgoMCwgbWF4Q2hhcnMgLSB0b3RhbCk7XG4gICAgICAgIGlmIChyZW1haW5pbmcgPiAwKSB7XG4gICAgICAgICAgcGFydHMucHVzaChibG9jay5zbGljZSgwLCByZW1haW5pbmcpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaChibG9jayk7XG4gICAgICB0b3RhbCArPSBibG9jay5sZW5ndGg7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xufVxuIiwgIi8qKlxuICogUGF0aCB1dGlsaXR5IGZ1bmN0aW9uc1xuICovXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBwYXRoIGlzIHVuZGVyIGEgc3BlY2lmaWMgZm9sZGVyIChvciBpcyB0aGUgZm9sZGVyIGl0c2VsZikuXG4gKiBIYW5kbGVzIHRyYWlsaW5nIHNsYXNoZXMgY29uc2lzdGVudGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNVbmRlckZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIHBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXIgfHwgcGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJ9L2ApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQyKGRhdGUuZ2V0TW9udGgoKSArIDEpfS0ke3BhZDIoZGF0ZS5nZXREYXRlKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3BhZDIoZGF0ZS5nZXRIb3VycygpKX06JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZVRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0gJHtmb3JtYXRUaW1lS2V5KGRhdGUpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9LSR7cGFkMihkYXRlLmdldEhvdXJzKCkpfSR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS5yZXBsYWNlKC9cXHMrJC9nLCBcIlwiKSlcbiAgICAuam9pbihcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOZXdsaW5lcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCBcIlwiKTtcbn1cblxuZnVuY3Rpb24gcGFkMih2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmJveFZhdWx0U2VydmljZSB7XG4gIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gIHJlYWRUZXh0V2l0aE10aW1lKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBleGlzdHM6IGJvb2xlYW47XG4gIH0+O1xuICByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluYm94RW50cnkge1xuICBoZWFkaW5nOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZztcbiAgcmF3OiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgaW5kZXg6IG51bWJlcjtcbiAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIHN0YXJ0TGluZTogbnVtYmVyO1xuICBlbmRMaW5lOiBudW1iZXI7XG4gIHJldmlld2VkOiBib29sZWFuO1xuICByZXZpZXdBY3Rpb246IHN0cmluZyB8IG51bGw7XG4gIHJldmlld2VkQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIEluYm94RW50cnlJZGVudGl0eSA9IFBpY2s8XG4gIEluYm94RW50cnksXG4gIFwiaGVhZGluZ1wiIHwgXCJib2R5XCIgfCBcInByZXZpZXdcIiB8IFwic2lnbmF0dXJlXCIgfCBcInNpZ25hdHVyZUluZGV4XCJcbj4gJlxuICBQYXJ0aWFsPFBpY2s8SW5ib3hFbnRyeSwgXCJyYXdcIiB8IFwic3RhcnRMaW5lXCIgfCBcImVuZExpbmVcIj4+O1xuXG5leHBvcnQgY2xhc3MgSW5ib3hTZXJ2aWNlIHtcbiAgcHJpdmF0ZSB1bnJldmlld2VkQ291bnRDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBJbmJveFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRFbnRyaWVzKGxpbWl0ID0gMjAsIGluY2x1ZGVSZXZpZXdlZCA9IGZhbHNlKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGluY2x1ZGVSZXZpZXdlZCA/IGVudHJpZXMgOiBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5yZXZpZXdlZCk7XG4gICAgcmV0dXJuIGZpbHRlcmVkLnNsaWNlKC1saW1pdCkucmV2ZXJzZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VW5yZXZpZXdlZENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB7IHRleHQsIG10aW1lLCBleGlzdHMgfSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0V2l0aE10aW1lKHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnJldmlld2VkQ291bnRDYWNoZSAmJiB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlLm10aW1lID09PSBtdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBwYXJzZUluYm94RW50cmllcyh0ZXh0KS5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpLmxlbmd0aDtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIGFzeW5jIG1hcmtFbnRyeVJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICFjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZCgoY2FuZGlkYXRlKSA9PiAhY2FuZGlkYXRlLnJldmlld2VkICYmIGNhbmRpZGF0ZS5yYXcgPT09IGVudHJ5LnJhdykgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnN0YXJ0TGluZSA9PT0gZW50cnkuc3RhcnRMaW5lLFxuICAgICAgKTtcblxuICAgIGlmICghY3VycmVudEVudHJ5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGluc2VydFJldmlld01hcmtlcihjb250ZW50LCBjdXJyZW50RW50cnksIGFjdGlvbik7XG4gICAgaWYgKHVwZGF0ZWQgPT09IGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCB1cGRhdGVkKTtcbiAgICB0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkVudHJ5KGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgY3VycmVudEVudHJ5ID1cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZSA9PT0gZW50cnkuc2lnbmF0dXJlICYmXG4gICAgICAgICAgY2FuZGlkYXRlLnNpZ25hdHVyZUluZGV4ID09PSBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICAgICkgPz9cbiAgICAgIGZpbmRVbmlxdWVSZXZpZXdlZFNpZ25hdHVyZU1hdGNoKGN1cnJlbnRFbnRyaWVzLCBlbnRyeS5zaWduYXR1cmUpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5KTtcbiAgICBpZiAodXBkYXRlZCA9PT0gY29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluYm94RW50cmllcyhjb250ZW50OiBzdHJpbmcpOiBJbmJveEVudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IEluYm94RW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudEJvZHlMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICBsZXQgY3VycmVudFJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHNpZ25hdHVyZUNvdW50cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKGVuZExpbmU6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gY3VycmVudEJvZHlMaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwcmV2aWV3ID0gYnVpbGRQcmV2aWV3KGJvZHkpO1xuICAgIGNvbnN0IHJhdyA9IFtjdXJyZW50SGVhZGluZywgLi4uY3VycmVudEJvZHlMaW5lc10uam9pbihcIlxcblwiKS50cmltRW5kKCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYnVpbGRFbnRyeVNpZ25hdHVyZShjdXJyZW50SGVhZGluZywgY3VycmVudEJvZHlMaW5lcyk7XG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXggPSBzaWduYXR1cmVDb3VudHMuZ2V0KHNpZ25hdHVyZSkgPz8gMDtcbiAgICBzaWduYXR1cmVDb3VudHMuc2V0KHNpZ25hdHVyZSwgc2lnbmF0dXJlSW5kZXggKyAxKTtcbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcucmVwbGFjZSgvXiMjXFxzKy8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIGJvZHksXG4gICAgICByYXcsXG4gICAgICBwcmV2aWV3LFxuICAgICAgaW5kZXg6IGVudHJpZXMubGVuZ3RoLFxuICAgICAgc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXgsXG4gICAgICBzdGFydExpbmU6IGN1cnJlbnRTdGFydExpbmUsXG4gICAgICBlbmRMaW5lLFxuICAgICAgcmV2aWV3ZWQ6IGN1cnJlbnRSZXZpZXdlZCxcbiAgICAgIHJldmlld0FjdGlvbjogY3VycmVudFJldmlld0FjdGlvbixcbiAgICAgIHJldmlld2VkQXQ6IGN1cnJlbnRSZXZpZXdlZEF0LFxuICAgIH0pO1xuICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gICAgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gICAgY3VycmVudFJldmlld0FjdGlvbiA9IG51bGw7XG4gICAgY3VycmVudFJldmlld2VkQXQgPSBudWxsO1xuICB9O1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaW5kZXhdO1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeShpbmRleCk7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGxpbmU7XG4gICAgICBjdXJyZW50U3RhcnRMaW5lID0gaW5kZXg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOlxccyooW2Etel0rKSg/OlxccysoLis/KSk/XFxzKi0tPiQvaSk7XG4gICAgaWYgKHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UmV2aWV3ZWQgPSB0cnVlO1xuICAgICAgY3VycmVudFJldmlld0FjdGlvbiA9IHJldmlld01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IHJldmlld01hdGNoWzJdID8/IG51bGw7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjdXJyZW50Qm9keUxpbmVzLnB1c2gobGluZSk7XG4gIH1cblxuICBwdXNoRW50cnkobGluZXMubGVuZ3RoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgY29uc3QgbWFya2VyID0gYDwhLS0gYnJhaW4tcmV2aWV3ZWQ6ICR7YWN0aW9ufSAke3RpbWVzdGFtcH0gLS0+YDtcbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG4gIGNsZWFuZWRFbnRyeUxpbmVzLnB1c2gobWFya2VyLCBcIlwiKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRQcmV2aWV3KGJvZHk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gYm9keVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBsaW5lc1swXSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBidWlsZEVudHJ5U2lnbmF0dXJlKGhlYWRpbmc6IHN0cmluZywgYm9keUxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBbaGVhZGluZy50cmltKCksIC4uLmJvZHlMaW5lcy5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKV0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhsaW5lczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNsb25lID0gWy4uLmxpbmVzXTtcbiAgd2hpbGUgKGNsb25lLmxlbmd0aCA+IDAgJiYgY2xvbmVbY2xvbmUubGVuZ3RoIC0gMV0udHJpbSgpID09PSBcIlwiKSB7XG4gICAgY2xvbmUucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGNsb25lO1xufVxuXG5mdW5jdGlvbiBmaW5kVW5pcXVlUmV2aWV3ZWRTaWduYXR1cmVNYXRjaChcbiAgZW50cmllczogSW5ib3hFbnRyeVtdLFxuICBzaWduYXR1cmU6IHN0cmluZyxcbik6IEluYm94RW50cnkgfCBudWxsIHtcbiAgY29uc3QgcmV2aWV3ZWRNYXRjaGVzID0gZW50cmllcy5maWx0ZXIoXG4gICAgKGVudHJ5KSA9PiBlbnRyeS5yZXZpZXdlZCAmJiBlbnRyeS5zaWduYXR1cmUgPT09IHNpZ25hdHVyZSxcbiAgKTtcbiAgaWYgKHJldmlld2VkTWF0Y2hlcy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gcmV2aWV3ZWRNYXRjaGVzWzBdO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlSm91cm5hbFRleHQsIGZvcm1hdERhdGVLZXksIGZvcm1hdFRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEpvdXJuYWxTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBnZXRKb3VybmFsUGF0aChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICByZXR1cm4gYCR7c2V0dGluZ3Muam91cm5hbEZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gIH1cblxuICBhc3luYyBlbnN1cmVKb3VybmFsRmlsZShkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRKb3VybmFsUGF0aChkYXRlKTtcbiAgICByZXR1cm4gdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kSm91cm5hbEhlYWRlcihwYXRoLCBkYXRlS2V5KTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEVudHJ5KHRleHQ6IHN0cmluZywgZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkpvdXJuYWwgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IGZpbGUucGF0aDtcblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0VGltZUtleShkYXRlKX1cXG4ke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQge1xuICBjb2xsYXBzZVdoaXRlc3BhY2UsXG4gIGZvcm1hdERhdGVUaW1lS2V5LFxuICBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wLFxufSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIE5vdGVTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmROb3RlKHRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdGUgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2sgPSBgIyMgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1cXG4tICR7Y2xlYW5lZH1gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlLCBibG9jayk7XG4gICAgcmV0dXJuIHsgcGF0aDogc2V0dGluZ3MuaW5ib3hGaWxlIH07XG4gIH1cblxuICBhc3luYyBjcmVhdGVHZW5lcmF0ZWROb3RlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgYm9keTogc3RyaW5nLFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgICBzb3VyY2VQYXRocz86IHN0cmluZ1tdLFxuICApOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGNsZWFuZWRUaXRsZSA9IHRyaW1UaXRsZSh0aXRsZSk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBgJHtmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKG5vdyl9LSR7c2x1Z2lmeShjbGVhbmVkVGl0bGUpfS5tZGA7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKFxuICAgICAgYCR7c2V0dGluZ3Mubm90ZXNGb2xkZXJ9LyR7ZmlsZU5hbWV9YCxcbiAgICApO1xuICAgIGNvbnN0IHNvdXJjZUxpbmUgPSBzb3VyY2VQYXRocyAmJiBzb3VyY2VQYXRocy5sZW5ndGggPiAwXG4gICAgICA/IGAke3NvdXJjZUxhYmVsfSBcdTIwMjIgJHtzb3VyY2VQYXRocy5sZW5ndGh9ICR7c291cmNlUGF0aHMubGVuZ3RoID09PSAxID8gXCJmaWxlXCIgOiBcImZpbGVzXCJ9YFxuICAgICAgOiBzb3VyY2VQYXRoXG4gICAgICAgID8gYCR7c291cmNlTGFiZWx9IFx1MjAyMiAke3NvdXJjZVBhdGh9YFxuICAgICAgICA6IHNvdXJjZUxhYmVsO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVMaW5lcyA9IHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgID8gW1xuICAgICAgICAgIFwiU291cmNlIGZpbGVzOlwiLFxuICAgICAgICAgIC4uLnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKS5tYXAoKHNvdXJjZSkgPT4gYC0gJHtzb3VyY2V9YCksXG4gICAgICAgICAgLi4uKHNvdXJjZVBhdGhzLmxlbmd0aCA+IDEyXG4gICAgICAgICAgICA/IFtgLSAuLi5hbmQgJHtzb3VyY2VQYXRocy5sZW5ndGggLSAxMn0gbW9yZWBdXG4gICAgICAgICAgICA6IFtdKSxcbiAgICAgICAgXVxuICAgICAgOiBbXTtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMgJHtjbGVhbmVkVGl0bGV9YCxcbiAgICAgIFwiXCIsXG4gICAgICBgQ3JlYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBgU291cmNlOiAke3NvdXJjZUxpbmV9YCxcbiAgICAgIC4uLnNvdXJjZUZpbGVMaW5lcyxcbiAgICAgIFwiXCIsXG4gICAgICBjb2xsYXBzZVdoaXRlc3BhY2UoYm9keSkgPyBib2R5LnRyaW0oKSA6IFwiTm8gYXJ0aWZhY3QgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHBhdGgsIGNvbnRlbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpXG4gICAgLnNsaWNlKDAsIDQ4KSB8fCBcIm5vdGVcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVLZXksIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEluYm94RW50cnksIEluYm94RW50cnlJZGVudGl0eSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi4vdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGludGVyZmFjZSBSZXZpZXdMb2dFbnRyeSBleHRlbmRzIEluYm94RW50cnlJZGVudGl0eSB7XG4gIGFjdGlvbjogc3RyaW5nO1xuICB0aW1lc3RhbXA6IHN0cmluZztcbiAgc291cmNlUGF0aDogc3RyaW5nO1xuICBmaWxlTXRpbWU6IG51bWJlcjtcbiAgZW50cnlJbmRleDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUmV2aWV3TG9nU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3RW50cnlDb3VudENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0+KCk7XG4gIHByaXZhdGUgcmV2aWV3TG9nRmlsZXNDYWNoZToge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZmlsZXM6IFRGaWxlW107XG4gIH0gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXZpZXdFbnRyeVRvdGFsQ2FjaGU6IHtcbiAgICBsaXN0aW5nTXRpbWU6IG51bWJlcjtcbiAgICB0b3RhbDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmRSZXZpZXdMb2coZW50cnk6IEluYm94RW50cnlJZGVudGl0eSwgYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZGF0ZUtleSA9IGZvcm1hdERhdGVLZXkobm93KTtcbiAgICBjb25zdCBwYXRoID0gYCR7c2V0dGluZ3MucmV2aWV3c0ZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIGAtIEFjdGlvbjogJHthY3Rpb259YCxcbiAgICAgIGAtIEluYm94OiAke2VudHJ5LmhlYWRpbmd9YCxcbiAgICAgIGAtIFByZXZpZXc6ICR7ZW50cnkucHJldmlldyB8fCBlbnRyeS5ib2R5IHx8IFwiKGVtcHR5KVwifWAsXG4gICAgICBgLSBTaWduYXR1cmU6ICR7ZW5jb2RlUmV2aWV3U2lnbmF0dXJlKGVudHJ5LnNpZ25hdHVyZSl9YCxcbiAgICAgIGAtIFNpZ25hdHVyZSBpbmRleDogJHtlbnRyeS5zaWduYXR1cmVJbmRleH1gLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGNvbnRlbnQpO1xuICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlID0gbnVsbDtcbiAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHsgcGF0aCB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuXG4gICAgaWYgKCF0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUpIHtcbiAgICAgIGNvbnN0IGFsbEZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICAgIGNvbnN0IG1hdGNoaW5nID0gYWxsRmlsZXNcbiAgICAgICAgLmZpbHRlcigoZmlsZSkgPT4gaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICAgICAgdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlID0ge1xuICAgICAgICBtdGltZTogbWF0Y2hpbmdbMF0/LnN0YXQubXRpbWUgPz8gMCxcbiAgICAgICAgZmlsZXM6IG1hdGNoaW5nLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiXG4gICAgICA/IHRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZS5maWxlcy5zbGljZSgwLCBsaW1pdClcbiAgICAgIDogdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlLmZpbGVzO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3RW50cmllcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8UmV2aWV3TG9nRW50cnlbXT4ge1xuICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCB0aGlzLmdldFJldmlld0xvZ0ZpbGVzKGxpbWl0KTtcbiAgICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbG9ncykge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVJldmlld0xvZ0VudHJpZXMoY29udGVudCwgZmlsZS5wYXRoLCBmaWxlLnN0YXQubXRpbWUpO1xuICAgICAgZW50cmllcy5wdXNoKC4uLnBhcnNlZC5yZXZlcnNlKCkpO1xuICAgICAgaWYgKHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiAmJiBlbnRyaWVzLmxlbmd0aCA+PSBsaW1pdCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiID8gZW50cmllcy5zbGljZSgwLCBsaW1pdCkgOiBlbnRyaWVzO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3RW50cnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCB0aGlzLmdldFJldmlld0xvZ0ZpbGVzKCk7XG4gICAgaWYgKGxvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IHsgbGlzdGluZ010aW1lOiAwLCB0b3RhbDogMCB9O1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdGluZ010aW1lID0gbG9nc1swXS5zdGF0Lm10aW1lO1xuICAgIGlmICh0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZT8ubGlzdGluZ010aW1lID09PSBsaXN0aW5nTXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZS50b3RhbDtcbiAgICB9XG5cbiAgICBjb25zdCBzZWVuUGF0aHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBsZXQgdG90YWwgPSAwO1xuXG4gICAgY29uc3QgdW5jYWNoZWRGaWxlcyA9IGxvZ3MuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgIHJldHVybiAhKGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjYWNoZWRGaWxlcyA9IGxvZ3MuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgIHJldHVybiBjYWNoZWQgJiYgY2FjaGVkLm10aW1lID09PSBmaWxlLnN0YXQubXRpbWU7XG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2FjaGVkRmlsZXMpIHtcbiAgICAgIHNlZW5QYXRocy5hZGQoZmlsZS5wYXRoKTtcbiAgICAgIHRvdGFsICs9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpIS5jb3VudDtcbiAgICB9XG5cbiAgICBpZiAodW5jYWNoZWRGaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHVuY2FjaGVkRmlsZXMubWFwKGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICAgICAgY29uc3QgY291bnQgPSBwYXJzZVJldmlld0xvZ0VudHJpZXMoY29udGVudCwgZmlsZS5wYXRoLCBmaWxlLnN0YXQubXRpbWUpLmxlbmd0aDtcbiAgICAgICAgICB0aGlzLnJldmlld0VudHJ5Q291bnRDYWNoZS5zZXQoZmlsZS5wYXRoLCB7XG4gICAgICAgICAgICBtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuICAgICAgICAgICAgY291bnQsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHsgZmlsZSwgY291bnQgfTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBmb3IgKGNvbnN0IHsgZmlsZSwgY291bnQgfSBvZiByZXN1bHRzKSB7XG4gICAgICAgIHNlZW5QYXRocy5hZGQoZmlsZS5wYXRoKTtcbiAgICAgICAgdG90YWwgKz0gY291bnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmtleXMoKSkge1xuICAgICAgaWYgKCFzZWVuUGF0aHMuaGFzKHBhdGgpKSB7XG4gICAgICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmRlbGV0ZShwYXRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJldmlld0VudHJ5VG90YWxDYWNoZSA9IHsgbGlzdGluZ010aW1lLCB0b3RhbCB9O1xuICAgIHJldHVybiB0b3RhbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyxcbiAgZmlsZU10aW1lOiBudW1iZXIsXG4pOiBSZXZpZXdMb2dFbnRyeVtdIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG4gIGxldCBjdXJyZW50VGltZXN0YW1wID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudFByZXZpZXcgPSBcIlwiO1xuICBsZXQgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICBsZXQgY3VycmVudEVudHJ5SW5kZXggPSAwO1xuXG4gIGNvbnN0IHB1c2hFbnRyeSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUaW1lc3RhbXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgYWN0aW9uOiBjdXJyZW50QWN0aW9uIHx8IFwidW5rbm93blwiLFxuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBjdXJyZW50UHJldmlldyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBzaWduYXR1cmU6IGN1cnJlbnRTaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogY3VycmVudFNpZ25hdHVyZUluZGV4LFxuICAgICAgdGltZXN0YW1wOiBjdXJyZW50VGltZXN0YW1wLFxuICAgICAgc291cmNlUGF0aCxcbiAgICAgIGZpbGVNdGltZSxcbiAgICAgIGVudHJ5SW5kZXg6IGN1cnJlbnRFbnRyeUluZGV4LFxuICAgIH0pO1xuICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICAgIGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICAgIGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgICBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gMDtcbiAgICBjdXJyZW50RW50cnlJbmRleCArPSAxO1xuICB9O1xuXG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeSgpO1xuICAgICAgY3VycmVudFRpbWVzdGFtcCA9IGhlYWRpbmdNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb25NYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0FjdGlvbjpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKGFjdGlvbk1hdGNoKSB7XG4gICAgICBjdXJyZW50QWN0aW9uID0gYWN0aW9uTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5ib3hNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0luYm94OlxccysoLispJC9pKTtcbiAgICBpZiAoaW5ib3hNYXRjaCkge1xuICAgICAgY3VycmVudEhlYWRpbmcgPSBpbmJveE1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1ByZXZpZXc6XFxzKyguKykkL2kpO1xuICAgIGlmIChwcmV2aWV3TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRQcmV2aWV3ID0gcHJldmlld01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZU1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrU2lnbmF0dXJlOlxccysoLispJC9pKTtcbiAgICBpZiAoc2lnbmF0dXJlTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRTaWduYXR1cmUgPSBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlTWF0Y2hbMV0udHJpbSgpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZUluZGV4TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmUgaW5kZXg6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVJbmRleE1hdGNoKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQoc2lnbmF0dXJlSW5kZXhNYXRjaFsxXSwgMTApO1xuICAgICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBwYXJzZWQgOiAwO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hFbnRyeSgpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gZW5jb2RlUmV2aWV3U2lnbmF0dXJlKHNpZ25hdHVyZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc2lnbmF0dXJlKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5LCBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9pbmJveC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBKb3VybmFsU2VydmljZSB9IGZyb20gXCIuL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi90YXNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5LCBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluYm94U2VydmljZTogSW5ib3hTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2U6IFRhc2tTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgam91cm5hbFNlcnZpY2U6IEpvdXJuYWxTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3TG9nU2VydmljZTogUmV2aWV3TG9nU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZXRSZWNlbnRJbmJveEVudHJpZXMobGltaXQgPSAyMCk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuaW5ib3hTZXJ2aWNlLmdldFJlY2VudEVudHJpZXMobGltaXQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvVGFzayhlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdGV4dCA9IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nO1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJ0YXNrXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInRhc2tcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcbiAgICAgIGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byB0YXNrIGluICR7c2F2ZWQucGF0aH1gLFxuICAgICAgbWFya2VyVXBkYXRlZCxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMga2VlcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwia2VlcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJrZWVwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJLZXB0IGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgc2tpcEVudHJ5KGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwic2tpcFwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJza2lwXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoXCJTa2lwcGVkIGluYm94IGVudHJ5XCIsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVG9Kb3VybmFsKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkoXG4gICAgICBbXG4gICAgICAgIGBTb3VyY2U6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgICBcIlwiLFxuICAgICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJqb3VybmFsXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShgQXBwZW5kZWQgaW5ib3ggZW50cnkgdG8gJHtzYXZlZC5wYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcHJvbW90ZVRvTm90ZShlbnRyeTogSW5ib3hFbnRyeSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gc2V0dGluZ3Mubm90ZXNGb2xkZXI7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlRm9sZGVyKG5vdGVzRm9sZGVyKTtcblxuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5idWlsZE5vdGVUaXRsZShlbnRyeSk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtmb3JtYXREYXRlVGltZUtleShub3cpLnJlcGxhY2UoL1s6IF0vZywgXCItXCIpfS0ke3NsdWdpZnkodGl0bGUpfS5tZGA7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKGAke25vdGVzRm9sZGVyfS8ke2ZpbGVuYW1lfWApO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke3RpdGxlfWAsXG4gICAgICBcIlwiLFxuICAgICAgYENyZWF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgXCJTb3VyY2U6IEJyYWluIGluYm94XCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJPcmlnaW5hbCBjYXB0dXJlOlwiLFxuICAgICAgZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmcsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcIm5vdGVcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwibm90ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBQcm9tb3RlZCBpbmJveCBlbnRyeSB0byBub3RlIGluICR7cGF0aH1gLCBtYXJrZXJVcGRhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIHJlb3BlbkZyb21SZXZpZXdMb2coZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBpZGVudGl0eSA9IHtcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgcHJldmlldzogZW50cnkucHJldmlldyxcbiAgICAgIHNpZ25hdHVyZTogZW50cnkuc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXg6IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgIH07XG4gICAgY29uc3QgcmVvcGVuZWQgPSBhd2FpdCB0aGlzLmluYm94U2VydmljZS5yZW9wZW5FbnRyeShpZGVudGl0eSk7XG4gICAgaWYgKCFyZW9wZW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChpZGVudGl0eSwgXCJyZW9wZW5cIik7XG4gICAgcmV0dXJuIGBSZS1vcGVuZWQgaW5ib3ggZW50cnkgJHtlbnRyeS5oZWFkaW5nfWA7XG4gIH1cblxuICBidWlsZE5vdGVUaXRsZShlbnRyeTogSW5ib3hFbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZW50cnkucHJldmlldyB8fCBlbnRyeS5ib2R5IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3QgbGluZXMgPSBjYW5kaWRhdGVcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gY29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGNvbnN0IGZpcnN0ID0gbGluZXNbMF0gPz8gXCJVbnRpdGxlZCBub3RlXCI7XG4gICAgcmV0dXJuIHRyaW1UaXRsZShmaXJzdCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG1hcmtJbmJveFJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UubWFya0VudHJ5UmV2aWV3ZWQoZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwZW5kTWFya2VyTm90ZShtZXNzYWdlOiBzdHJpbmcsIG1hcmtlclVwZGF0ZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiBtYXJrZXJVcGRhdGVkID8gbWVzc2FnZSA6IGAke21lc3NhZ2V9IChyZXZpZXcgbWFya2VyIG5vdCB1cGRhdGVkKWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoXG4gICAgZW50cnk6IEluYm94RW50cnlJZGVudGl0eSxcbiAgICBhY3Rpb246IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5hcHBlbmRSZXZpZXdMb2coZW50cnksIGFjdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzbHVnaWZ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTldKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi0rfC0rJC9nLCBcIlwiKVxuICAgIC5zbGljZSgwLCA0OCkgfHwgXCJub3RlXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1UaXRsZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGlmICh0cmltbWVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiB0cmltbWVkO1xuICB9XG4gIHJldHVybiBgJHt0cmltbWVkLnNsaWNlKDAsIDU3KS50cmltRW5kKCl9Li4uYDtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyIH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBRdWVzdGlvblNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb246IHN0cmluZywgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IFByb21pc2U8U3ludGhlc2lzUmVzdWx0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tRdWVzdGlvbkFuc3dlcihxdWVzdGlvbiwgY29udGV4dC50ZXh0KTtcbiAgICBsZXQgY29udGVudCA9IGZhbGxiYWNrO1xuICAgIGxldCB1c2VkQUkgPSBmYWxzZTtcblxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykge1xuICAgICAgaWYgKCFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICFzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkFJIGFuc3dlcnMgYXJlIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHF1ZXN0aW9uIGFuc3dlcmluZ1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBcIlF1ZXN0aW9uIEFuc3dlclwiLFxuICAgICAgdGl0bGU6IFwiQW5zd2VyXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5RdWVzdGlvbihxdWVzdGlvbiksXG4gICAgICBjb250ZW50OiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHByb21wdFRleHQ6IHF1ZXN0aW9uLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gcXVlc3Rpb24udHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgUXVlc3Rpb24gJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0S2V5d29yZHMocXVlc3Rpb246IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3Qgc3RvcHdvcmRzID0gbmV3IFNldChbXG4gICAgXCJ3aGF0XCIsXG4gICAgXCJ3aHlcIixcbiAgICBcImhvd1wiLFxuICAgIFwid2hpY2hcIixcbiAgICBcIndoZW5cIixcbiAgICBcIndoZXJlXCIsXG4gICAgXCJ3aG9cIixcbiAgICBcIndob21cIixcbiAgICBcImRvZXNcIixcbiAgICBcImRvXCIsXG4gICAgXCJkaWRcIixcbiAgICBcImlzXCIsXG4gICAgXCJhcmVcIixcbiAgICBcIndhc1wiLFxuICAgIFwid2VyZVwiLFxuICAgIFwidGhlXCIsXG4gICAgXCJhXCIsXG4gICAgXCJhblwiLFxuICAgIFwidG9cIixcbiAgICBcIm9mXCIsXG4gICAgXCJmb3JcIixcbiAgICBcImFuZFwiLFxuICAgIFwib3JcIixcbiAgICBcImluXCIsXG4gICAgXCJvblwiLFxuICAgIFwiYXRcIixcbiAgICBcIndpdGhcIixcbiAgICBcImFib3V0XCIsXG4gICAgXCJmcm9tXCIsXG4gICAgXCJteVwiLFxuICAgIFwib3VyXCIsXG4gICAgXCJ5b3VyXCIsXG4gICAgXCJ0aGlzXCIsXG4gICAgXCJ0aGF0XCIsXG4gICAgXCJ0aGVzZVwiLFxuICAgIFwidGhvc2VcIixcbiAgICBcIm1ha2VcIixcbiAgICBcIm1hZGVcIixcbiAgICBcIm5lZWRcIixcbiAgICBcIm5lZWRzXCIsXG4gICAgXCJjYW5cIixcbiAgICBcImNvdWxkXCIsXG4gICAgXCJzaG91bGRcIixcbiAgICBcIndvdWxkXCIsXG4gICAgXCJ3aWxsXCIsXG4gICAgXCJoYXZlXCIsXG4gICAgXCJoYXNcIixcbiAgICBcImhhZFwiLFxuICBdKTtcblxuICByZXR1cm4gQXJyYXkuZnJvbShcbiAgICBuZXcgU2V0KFxuICAgICAgcXVlc3Rpb25cbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnNwbGl0KC9bXmEtejAtOV0rL2cpXG4gICAgICAgIC5tYXAoKHdvcmQpID0+IHdvcmQudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKCh3b3JkKSA9PiB3b3JkLmxlbmd0aCA+PSA0ICYmICFzdG9wd29yZHMuaGFzKHdvcmQpKSxcbiAgICApLFxuICApO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzUXVlc3Rpb24obGluZTogc3RyaW5nLCBrZXl3b3Jkczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgaWYgKCFrZXl3b3Jkcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBsb3dlciA9IGxpbmUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIGtleXdvcmRzLnNvbWUoKGtleXdvcmQpID0+IGxvd2VyLmluY2x1ZGVzKGtleXdvcmQpKTtcbn1cblxuZnVuY3Rpb24gY29sbGVjdEV2aWRlbmNlKGNvbnRlbnQ6IHN0cmluZywgcXVlc3Rpb246IHN0cmluZyk6IHtcbiAgZXZpZGVuY2U6IFNldDxzdHJpbmc+O1xuICBtYXRjaGVkOiBib29sZWFuO1xufSB7XG4gIGNvbnN0IGV2aWRlbmNlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGtleXdvcmRzID0gZXh0cmFjdEtleXdvcmRzKHF1ZXN0aW9uKTtcbiAgbGV0IG1hdGNoZWQgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCAmJiAobWF0Y2hlc1F1ZXN0aW9uKGhlYWRpbmdUZXh0LCBrZXl3b3JkcykgfHwgZXZpZGVuY2Uuc2l6ZSA8IDMpKSB7XG4gICAgICAgIGlmIChtYXRjaGVzUXVlc3Rpb24oaGVhZGluZ1RleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24odGFza1RleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMykpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbih0YXNrVGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCAmJiAobWF0Y2hlc1F1ZXN0aW9uKGJ1bGxldFRleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgNCkpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihidWxsZXRUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGxpbmUsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMikge1xuICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihsaW5lLCBrZXl3b3JkcykpIHtcbiAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBldmlkZW5jZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBldmlkZW5jZSxcbiAgICBtYXRjaGVkLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWRRdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UocXVlc3Rpb24pO1xuICBjb25zdCB7IGV2aWRlbmNlLCBtYXRjaGVkIH0gPSBjb2xsZWN0RXZpZGVuY2UoY29udGVudCwgY2xlYW5lZFF1ZXN0aW9uKTtcbiAgY29uc3QgYW5zd2VyTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgaWYgKG1hdGNoZWQpIHtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFxuICAgICAgXCJJIGZvdW5kIHRoZXNlIGxpbmVzIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0IHRoYXQgZGlyZWN0bHkgbWF0Y2ggeW91ciBxdWVzdGlvbi5cIixcbiAgICApO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUaGUgY29udGV4dCBkb2VzIG5vdCBwcm92aWRlIGEgZnVsbHkgdmVyaWZpZWQgYW5zd2VyLCBzbyB0cmVhdCB0aGlzIGFzIGEgZ3JvdW5kZWQgc3VtbWFyeS5cIik7XG4gIH0gZWxzZSBpZiAoZXZpZGVuY2Uuc2l6ZSkge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXG4gICAgICBcIkkgY291bGQgbm90IGZpbmQgYSBkaXJlY3QgbWF0Y2ggaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQsIHNvIHRoZXNlIGFyZSB0aGUgY2xvc2VzdCBsaW5lcyBhdmFpbGFibGUuXCIsXG4gICAgKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVHJlYXQgdGhpcyBhcyBuZWFyYnkgY29udGV4dCByYXRoZXIgdGhhbiBhIGNvbmZpcm1lZCBhbnN3ZXIuXCIpO1xuICB9IGVsc2Uge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJJIGNvdWxkIG5vdCBmaW5kIGEgZGlyZWN0IGFuc3dlciBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dC5cIik7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRyeSBuYXJyb3dpbmcgdGhlIHF1ZXN0aW9uIG9yIHNlbGVjdGluZyBhIG1vcmUgc3BlY2lmaWMgbm90ZSBvciBmb2xkZXIuXCIpO1xuICB9XG5cbiAgY29uc3QgZm9sbG93VXBzID0gbWF0Y2hlZCB8fCBldmlkZW5jZS5zaXplXG4gICAgPyBuZXcgU2V0KFtcbiAgICAgICAgXCJBc2sgYSBuYXJyb3dlciBxdWVzdGlvbiBpZiB5b3Ugd2FudCBhIG1vcmUgc3BlY2lmaWMgYW5zd2VyLlwiLFxuICAgICAgICBcIk9wZW4gdGhlIHNvdXJjZSBub3RlIG9yIGZvbGRlciBmb3IgYWRkaXRpb25hbCBjb250ZXh0LlwiLFxuICAgICAgXSlcbiAgICA6IG5ldyBTZXQoW1xuICAgICAgICBcIlByb3ZpZGUgbW9yZSBleHBsaWNpdCBjb250ZXh0IG9yIHNlbGVjdCBhIGRpZmZlcmVudCBub3RlIG9yIGZvbGRlci5cIixcbiAgICAgIF0pO1xuXG4gIHJldHVybiBbXG4gICAgXCIjIEFuc3dlclwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBRdWVzdGlvblwiLFxuICAgIGNsZWFuZWRRdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBBbnN3ZXJcIixcbiAgICBhbnN3ZXJMaW5lcy5qb2luKFwiIFwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihldmlkZW5jZSwgXCJObyBkaXJlY3QgZXZpZGVuY2UgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgIFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBBbnN3ZXJcIixcbiAgICAgIFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VRdWVzdGlvbkFuc3dlclNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBBbnN3ZXJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgICBwYXJzZWQucXVlc3Rpb24gfHwgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgcGFyc2VkLmFuc3dlciB8fCBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIHBhcnNlZC5ldmlkZW5jZSB8fCBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIEFuc3dlclwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBRdWVzdGlvblwiLFxuICAgIFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEFuc3dlclwiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VRdWVzdGlvbkFuc3dlclNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgcXVlc3Rpb246IHN0cmluZztcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIlF1ZXN0aW9uXCIgfCBcIkFuc3dlclwiIHwgXCJFdmlkZW5jZVwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBRdWVzdGlvbjogW10sXG4gICAgQW5zd2VyOiBbXSxcbiAgICBFdmlkZW5jZTogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFF1ZXN0aW9ufEFuc3dlcnxFdmlkZW5jZXxGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcXVlc3Rpb246IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuUXVlc3Rpb25dKSxcbiAgICBhbnN3ZXI6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5BbnN3ZXIpLFxuICAgIGV2aWRlbmNlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuRXZpZGVuY2UpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgUXVlc3Rpb246IHN0cmluZ1tdO1xuICBBbnN3ZXI6IHN0cmluZ1tdO1xuICBFdmlkZW5jZTogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJhbnN3ZXJcIikge1xuICAgIHJldHVybiBcIkFuc3dlclwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImV2aWRlbmNlXCIpIHtcbiAgICByZXR1cm4gXCJFdmlkZW5jZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJRdWVzdGlvblwiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQge1xuICBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5LFxufSBmcm9tIFwiLi4vdXRpbHMvdGV4dFwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXksIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1N1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvc3VtbWFyeS1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi4vdXRpbHMvcGF0aFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1bW1hcnlSZXN1bHQge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHBlcnNpc3RlZFBhdGg/OiBzdHJpbmc7XG4gIHVzZWRBSTogYm9vbGVhbjtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFN1bW1hcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cz86IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPFN1bW1hcnlSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9IGxvb2tiYWNrRGF5cyA/PyBzZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0UmVjZW50RmlsZXMoc2V0dGluZ3MsIGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnkoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIGZpbGVzLFxuICAgICAgc2V0dGluZ3Muc3VtbWFyeU1heENoYXJzLFxuICAgICk7XG5cbiAgICBsZXQgc3VtbWFyeSA9IGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQpO1xuICAgIGxldCB1c2VkQUkgPSBmYWxzZTtcblxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcykge1xuICAgICAgaWYgKCFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICFzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkFJIHN1bW1hcmllcyBhcmUgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdW1tYXJ5ID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uuc3VtbWFyaXplKGNvbnRlbnQgfHwgc3VtbWFyeSwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCBzdW1tYXJ5XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBlcnNpc3RlZFBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0aXRsZSA9IGxhYmVsID8gYCR7bGFiZWx9IFN1bW1hcnlgIDogXCJTdW1tYXJ5XCI7XG4gICAgaWYgKHNldHRpbmdzLnBlcnNpc3RTdW1tYXJpZXMpIHtcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAobmV3IERhdGUoKSk7XG4gICAgICBjb25zdCBmaWxlTGFiZWwgPSBsYWJlbCA/IGAke2xhYmVsLnRvTG93ZXJDYXNlKCl9LSR7dGltZXN0YW1wfWAgOiB0aW1lc3RhbXA7XG4gICAgICBjb25zdCByZXF1ZXN0ZWRQYXRoID0gYCR7c2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyfS8ke2ZpbGVMYWJlbH0ubWRgO1xuICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKHJlcXVlc3RlZFBhdGgpO1xuICAgICAgY29uc3QgZGlzcGxheVRpbWVzdGFtcCA9IGZvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpO1xuICAgICAgY29uc3QgYm9keSA9IFtcbiAgICAgICAgYCMgJHt0aXRsZX0gJHtkaXNwbGF5VGltZXN0YW1wfWAsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGAjIyBXaW5kb3dgLFxuICAgICAgICBlZmZlY3RpdmVMb29rYmFja0RheXMgPT09IDEgPyBcIlRvZGF5XCIgOiBgTGFzdCAke2VmZmVjdGl2ZUxvb2tiYWNrRGF5c30gZGF5c2AsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIHN1bW1hcnkudHJpbSgpLFxuICAgICAgXS5qb2luKFwiXFxuXCIpO1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBib2R5KTtcbiAgICAgIHBlcnNpc3RlZFBhdGggPSBwYXRoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiBzdW1tYXJ5LFxuICAgICAgcGVyc2lzdGVkUGF0aCxcbiAgICAgIHVzZWRBSSxcbiAgICAgIHRpdGxlLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RSZWNlbnRGaWxlcyhcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBsb29rYmFja0RheXM6IG51bWJlcixcbiAgKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgIHJldHVybiBmaWxlc1xuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gIWlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGZpbGUuc3RhdC5tdGltZSA+PSBjdXRvZmYpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFdpbmRvd1N0YXJ0KGxvb2tiYWNrRGF5czogbnVtYmVyKTogRGF0ZSB7XG4gIGNvbnN0IHNhZmVEYXlzID0gTWF0aC5tYXgoMSwgbG9va2JhY2tEYXlzKTtcbiAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZSgpO1xuICBzdGFydC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgc3RhcnQuc2V0RGF0ZShzdGFydC5nZXREYXRlKCkgLSAoc2FmZURheXMgLSAxKSk7XG4gIHJldHVybiBzdGFydDtcbn1cbiIsICJmdW5jdGlvbiBjbGVhblN1bW1hcnlMaW5lKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiAodGV4dCA/PyBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VGFza1NlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+KTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIFwiLSBObyByZWNlbnQgdGFza3MgZm91bmQuXCI7XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gWyBdICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGlnaGxpZ2h0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0YXNrcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGhpZ2hsaWdodHMuYWRkKGNsZWFuU3VtbWFyeUxpbmUoaGVhZGluZ1sxXSkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBjbGVhblN1bW1hcnlMaW5lKHRhc2tbMl0pO1xuICAgICAgdGFza3MuYWRkKHRleHQpO1xuICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBjbGVhblN1bW1hcnlMaW5lKGJ1bGxldFsyXSk7XG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBoaWdobGlnaHRzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChoaWdobGlnaHRzLnNpemUgPCA1ICYmIGxpbmUubGVuZ3RoIDw9IDE0MCkge1xuICAgICAgaGlnaGxpZ2h0cy5hZGQoY2xlYW5TdW1tYXJ5TGluZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihoaWdobGlnaHRzLCBcIk5vIHJlY2VudCBub3RlcyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgZm9ybWF0VGFza1NlY3Rpb24odGFza3MpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vdGhpbmcgcGVuZGluZyBmcm9tIHJlY2VudCBub3Rlcy5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1N5bnRoZXNpcyB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tEZWNpc2lvbkV4dHJhY3Rpb24gfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnMgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja0NsZWFuTm90ZSB9IGZyb20gXCIuLi91dGlscy9jbGVhbi1ub3RlLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmIH0gZnJvbSBcIi4uL3V0aWxzL3Byb2plY3QtYnJpZWYtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1ub3JtYWxpemVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNSZXN1bHQge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbm90ZVRpdGxlOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICBwcm9tcHRUZXh0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3ludGhlc2lzU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBydW4odGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gdGhpcy5idWlsZEZhbGxiYWNrKHRlbXBsYXRlLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgc3VtbWFyaWVzIGFyZSBlbmFibGVkIGJ1dCBPcGVuQUkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5zeW50aGVzaXplQ29udGV4dCh0ZW1wbGF0ZSwgY29udGV4dCwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCBzeW50aGVzaXNcIik7XG4gICAgICAgICAgY29udGVudCA9IGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSksXG4gICAgICB0aXRsZTogZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSksXG4gICAgICBub3RlVGl0bGU6IGAke2NvbnRleHQuc291cmNlTGFiZWx9ICR7Z2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZSl9YCxcbiAgICAgIGNvbnRlbnQ6IHRoaXMubm9ybWFsaXplKHRlbXBsYXRlLCBjb250ZW50KSxcbiAgICAgIHVzZWRBSSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEZhbGxiYWNrKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbih0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnModGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja0NsZWFuTm90ZSh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgICByZXR1cm4gYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZih0ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbGRGYWxsYmFja1N5bnRoZXNpcyh0ZXh0KTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dChjb250ZW50KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGFkZFN1bW1hcnlMaW5lKFxuICBzdW1tYXJ5OiBTZXQ8c3RyaW5nPixcbiAgdGV4dDogc3RyaW5nLFxuICBtYXhJdGVtcyA9IDQsXG4pOiB2b2lkIHtcbiAgaWYgKHN1bW1hcnkuc2l6ZSA+PSBtYXhJdGVtcykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gIGlmICghY2xlYW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN1bW1hcnkuYWRkKGNsZWFuZWQpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTeW50aGVzaXMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3VtbWFyeSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0aGVtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgdGhlbWVzLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBoZWFkaW5nVGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgZm9sbG93VXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB0aGVtZXMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIHRhc2tUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICB0aGVtZXMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgYnVsbGV0VGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGZvbGxvd1Vwcy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuXG4gICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgbGluZSk7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHN1bW1hcnksIFwiTm8gc291cmNlIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGhlbWVzLCBcIk5vIGtleSB0aGVtZXMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3ludGhlc2lzU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBwYXJzZWQuc3VtbWFyeSB8fCBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgcGFyc2VkLmtleVRoZW1lcyB8fCBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFN1bW1hcnlcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgXCJObyBrZXkgdGhlbWVzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN5bnRoZXNpc1NlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBrZXlUaGVtZXM6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiU3VtbWFyeVwiIHwgXCJLZXkgVGhlbWVzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFN1bW1hcnk6IFtdLFxuICAgIFwiS2V5IFRoZW1lc1wiOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoU3VtbWFyeXxLZXkgVGhlbWVzfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLlN1bW1hcnldKSxcbiAgICBrZXlUaGVtZXM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIktleSBUaGVtZXNcIl0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgU3VtbWFyeTogc3RyaW5nW107XG4gIFwiS2V5IFRoZW1lc1wiOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImtleSB0aGVtZXNcIikge1xuICAgIHJldHVybiBcIktleSBUaGVtZXNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiU3VtbWFyeVwiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgMTApXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1Rhc2tFeHRyYWN0aW9uKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGNvbnRleHQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICB0YXNrcy5hZGQodGFza1RleHQpO1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBjb250ZXh0LmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpO1xuICAgICAgaWYgKHF1ZXN0aW9uKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHRhc2tzLCBcIk5vIHRhc2tzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRhc2tFeHRyYWN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgcGFyc2VkLmNvbnRleHQgfHwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRhc2tFeHRyYWN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICB0YXNrczogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIlRhc2tzXCIgfCBcIkNvbnRleHRcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgVGFza3M6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhUYXNrc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0YXNrczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlRhc2tzKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkNvbnRleHRdKSxcbiAgICBmb2xsb3dVcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIkZvbGxvdy11cHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIFRhc2tzOiBzdHJpbmdbXTtcbiAgQ29udGV4dDogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJjb250ZXh0XCIpIHtcbiAgICByZXR1cm4gXCJDb250ZXh0XCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlRhc2tzXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCAxMClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZVJhdGlvbmFsZSh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJiZWNhdXNlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzbyB0aGF0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkdWUgdG9cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInJlYXNvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidHJhZGVvZmZcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImNvbnN0cmFpbnRcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRGVjaXNpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZGVjaWRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpc2lvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY2hvb3NlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaGlwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJhZG9wdFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZHJvcFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic3dpdGNoXCIpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGRlY2lzaW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCByYXRpb25hbGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlRGVjaXNpb24odGV4dCkpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKHRleHQpKSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlRGVjaXNpb24odGV4dCkpIHtcbiAgICAgICAgZGVjaXNpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAobG9va3NMaWtlUmF0aW9uYWxlKHRleHQpKSB7XG4gICAgICAgIHJhdGlvbmFsZS5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGRlY2lzaW9ucy5zaXplIDwgMykge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlRGVjaXNpb24obGluZSkpIHtcbiAgICAgIGRlY2lzaW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUobGluZSkpIHtcbiAgICAgIHJhdGlvbmFsZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGRlY2lzaW9ucywgXCJObyBjbGVhciBkZWNpc2lvbnMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihyYXRpb25hbGUsIFwiTm8gZXhwbGljaXQgcmF0aW9uYWxlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBkZWNpc2lvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRGVjaXNpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgcGFyc2VkLmRlY2lzaW9ucyB8fCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIHBhcnNlZC5yYXRpb25hbGUgfHwgXCJObyByYXRpb25hbGUgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgUmF0aW9uYWxlXCIsXG4gICAgXCJObyByYXRpb25hbGUgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZURlY2lzaW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBkZWNpc2lvbnM6IHN0cmluZztcbiAgcmF0aW9uYWxlOiBzdHJpbmc7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJEZWNpc2lvbnNcIiB8IFwiUmF0aW9uYWxlXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBEZWNpc2lvbnM6IFtdLFxuICAgIFJhdGlvbmFsZTogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhEZWNpc2lvbnN8UmF0aW9uYWxlfE9wZW4gUXVlc3Rpb25zKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGVjaXNpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLkRlY2lzaW9uc10pLFxuICAgIHJhdGlvbmFsZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlJhdGlvbmFsZSksXG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIERlY2lzaW9uczogc3RyaW5nW107XG4gIFJhdGlvbmFsZTogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwicmF0aW9uYWxlXCIpIHtcbiAgICByZXR1cm4gXCJSYXRpb25hbGVcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICByZXR1cm4gXCJEZWNpc2lvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDEwKVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlUXVlc3Rpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmVuZHNXaXRoKFwiP1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicXVlc3Rpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVuY2xlYXJcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVua25vd25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5vdCBzdXJlXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZUZvbGxvd1VwKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImZvbGxvdyB1cFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmV4dCBzdGVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJpbnZlc3RpZ2F0ZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uZmlybVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidmFsaWRhdGVcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tPcGVuUXVlc3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUgfHwgbGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24odGV4dCkpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlUXVlc3Rpb24odGV4dCkpIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuc2l6ZSA8IDYpIHtcbiAgICAgICAgY29udGV4dC5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAobG9va3NMaWtlRm9sbG93VXAodGV4dCkpIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbihsaW5lKSkge1xuICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zaXplIDwgNCkge1xuICAgICAgY29udGV4dC5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIENvbnRleHRcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihjb250ZXh0LCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZU9wZW5RdWVzdGlvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5vcGVuUXVlc3Rpb25zIHx8IFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgcGFyc2VkLmNvbnRleHQgfHwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU9wZW5RdWVzdGlvblNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIGZvbGxvd1Vwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk9wZW4gUXVlc3Rpb25zXCIgfCBcIkNvbnRleHRcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgICBDb250ZXh0OiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3BlbiBRdWVzdGlvbnN8Q29udGV4dHxGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3BlblF1ZXN0aW9uczogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdXSksXG4gICAgY29udGV4dDogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkNvbnRleHQpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbiAgQ29udGV4dDogc3RyaW5nW107XG4gIFwiRm9sbG93LXVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJjb250ZXh0XCIpIHtcbiAgICByZXR1cm4gXCJDb250ZXh0XCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tDbGVhbk5vdGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5UG9pbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGhlYWRpbmdUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmIChoZWFkaW5nVGV4dCkge1xuICAgICAgICBvdmVydmlldy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGtleVBvaW50cy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgcXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oa2V5UG9pbnRzLCBcIk5vIGtleSBwb2ludHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUNsZWFuTm90ZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgcGFyc2VkLmtleVBvaW50cyB8fCBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBcIk5vIGtleSBwb2ludHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvdmVydmlldzogc3RyaW5nO1xuICBrZXlQb2ludHM6IHN0cmluZztcbiAgcXVlc3Rpb25zOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiS2V5IFBvaW50c1wiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIFwiS2V5IFBvaW50c1wiOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEtleSBQb2ludHN8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGtleVBvaW50czogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFBvaW50c1wiXSksXG4gICAgcXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBcIktleSBQb2ludHNcIjogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHBvaW50c1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFBvaW50c1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tQcm9qZWN0QnJpZWYoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZ29hbHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgc2NvcGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmV4dFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIHNjb3BlLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIG5leHRTdGVwcy5hZGQodGFza1RleHQpO1xuICAgICAgICBnb2Fscy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIHNjb3BlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZUdvYWwoYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBnb2Fscy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VHb2FsKGxpbmUpKSB7XG4gICAgICBnb2Fscy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEdvYWxzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZ29hbHMsIFwiTm8gZ29hbHMgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTY29wZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHNjb3BlLCBcIk5vIHNjb3BlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG5leHRTdGVwcywgXCJObyBuZXh0IHN0ZXBzIGZvdW5kLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VHb2FsKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZ29hbCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZ29hbHMgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5lZWQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5lZWRzIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ3YW50IFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJ3YW50cyBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNob3VsZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm11c3QgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJvYmplY3RpdmVcIilcbiAgKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUHJvamVjdEJyaWVmT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlUHJvamVjdEJyaWVmU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBHb2Fsc1wiLFxuICAgICAgcGFyc2VkLmdvYWxzIHx8IFwiTm8gZ29hbHMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgIHBhcnNlZC5zY29wZSB8fCBcIk5vIHNjb3BlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIHBhcnNlZC5uZXh0U3RlcHMgfHwgXCJObyBuZXh0IHN0ZXBzIGV4dHJhY3RlZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgR29hbHNcIixcbiAgICBcIk5vIGdvYWxzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgU2NvcGVcIixcbiAgICBcIk5vIHNjb3BlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIFwiTm8gbmV4dCBzdGVwcyBleHRyYWN0ZWQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQcm9qZWN0QnJpZWZTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGdvYWxzOiBzdHJpbmc7XG4gIHNjb3BlOiBzdHJpbmc7XG4gIG5leHRTdGVwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIk92ZXJ2aWV3XCIgfCBcIkdvYWxzXCIgfCBcIlNjb3BlXCIgfCBcIk5leHQgU3RlcHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBHb2FsczogW10sXG4gICAgU2NvcGU6IFtdLFxuICAgIFwiTmV4dCBTdGVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPdmVydmlld3xHb2Fsc3xTY29wZXxOZXh0IFN0ZXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBnb2FsczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkdvYWxzKSxcbiAgICBzY29wZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlNjb3BlKSxcbiAgICBuZXh0U3RlcHM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk5leHQgU3RlcHNcIl0pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTZWN0aW9uTmFtZShzZWN0aW9uOiBzdHJpbmcpOiBrZXlvZiB7XG4gIE92ZXJ2aWV3OiBzdHJpbmdbXTtcbiAgR29hbHM6IHN0cmluZ1tdO1xuICBTY29wZTogc3RyaW5nW107XG4gIFwiTmV4dCBTdGVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJnb2Fsc1wiKSB7XG4gICAgcmV0dXJuIFwiR29hbHNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJzY29wZVwiKSB7XG4gICAgcmV0dXJuIFwiU2NvcGVcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJuZXh0IHN0ZXBzXCIpIHtcbiAgICByZXR1cm4gXCJOZXh0IFN0ZXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVUaXRsZSh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiVGFzayBFeHRyYWN0aW9uXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgIHJldHVybiBcIkRlY2lzaW9uIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgcmV0dXJuIFwiQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIlByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcnlcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlKTogc3RyaW5nIHtcbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgVGFza3NcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBEZWNpc2lvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IE9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJSZXdyaXRlIGFzIENsZWFuIE5vdGVcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICByZXR1cm4gXCJEcmFmdCBQcm9qZWN0IEJyaWVmXCI7XG4gIH1cblxuICByZXR1cm4gXCJTdW1tYXJpemVcIjtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja1RvcGljUGFnZSB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBjbGFzcyBUb3BpY1BhZ2VTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZSh0b3BpYzogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWRUb3BpYyA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0b3BpYyk7XG4gICAgaWYgKCFjbGVhbmVkVG9waWMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvcGljIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWxsYmFjayA9IGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgICBjb250ZXh0LnRleHQsXG4gICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRoLFxuICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICApO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgdG9waWMgcGFnZXMgYXJlIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZShjbGVhbmVkVG9waWMsIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgdG9waWMgcGFnZSBnZW5lcmF0aW9uXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gZW5zdXJlVG9waWNCdWxsZXQoXG4gICAgICBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudCksXG4gICAgICBjbGVhbmVkVG9waWMsXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiVG9waWMgUGFnZVwiLFxuICAgICAgdGl0bGU6IFwiVG9waWMgUGFnZVwiLFxuICAgICAgbm90ZVRpdGxlOiBzaG9ydGVuVG9waWMoY2xlYW5lZFRvcGljKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50LFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogY2xlYW5lZFRvcGljLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlVG9waWNCdWxsZXQoY29udGVudDogc3RyaW5nLCB0b3BpYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBvdmVydmlld0luZGV4ID0gbGluZXMuZmluZEluZGV4KChsaW5lKSA9PiAvXiMjXFxzK092ZXJ2aWV3XFxzKiQvLnRlc3QobGluZSkpO1xuICBpZiAob3ZlcnZpZXdJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IG5leHRIZWFkaW5nSW5kZXggPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgKGxpbmUsIGluZGV4KSA9PiBpbmRleCA+IG92ZXJ2aWV3SW5kZXggJiYgL14jI1xccysvLnRlc3QobGluZSksXG4gICk7XG4gIGNvbnN0IHRvcGljTGluZSA9IGAtIFRvcGljOiAke25vcm1hbGl6ZWRUb3BpY31gO1xuICBjb25zdCBvdmVydmlld1NsaWNlID0gbGluZXMuc2xpY2UoXG4gICAgb3ZlcnZpZXdJbmRleCArIDEsXG4gICAgbmV4dEhlYWRpbmdJbmRleCA9PT0gLTEgPyBsaW5lcy5sZW5ndGggOiBuZXh0SGVhZGluZ0luZGV4LFxuICApO1xuICBpZiAob3ZlcnZpZXdTbGljZS5zb21lKChsaW5lKSA9PiBsaW5lLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCItIHRvcGljOlwiKSkpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGluc2VydGlvbkluZGV4ID0gb3ZlcnZpZXdJbmRleCArIDE7XG4gIGNvbnN0IHVwZGF0ZWQgPSBbLi4ubGluZXNdO1xuICB1cGRhdGVkLnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgdG9waWNMaW5lKTtcbiAgcmV0dXJuIHVwZGF0ZWQuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2hvcnRlblRvcGljKHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbmVkID0gdG9waWMudHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gY2xlYW5lZCB8fCBgVG9waWMgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gO1xuICB9XG5cbiAgcmV0dXJuIGAke2NsZWFuZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VPcGVuUXVlc3Rpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmVuZHNXaXRoKFwiP1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicXVlc3Rpb25cIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVuY2xlYXJcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm9wZW4gaXNzdWVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInVua25vd25cIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlTmV4dFN0ZXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJuZXh0IFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJmb2xsb3cgdXBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwiZm9sbG93LXVwXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcInRvZG8gXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcInRvLWRvIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hvdWxkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmVlZCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm5lZWRzIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibXVzdCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFjdGlvblwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRTb3VyY2VzKFxuICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBzb3VyY2VQYXRoczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgaWYgKHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2Ygc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpKSB7XG4gICAgICBzb3VyY2VzLmFkZChwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoc291cmNlUGF0aHMubGVuZ3RoID4gMTIpIHtcbiAgICAgIHNvdXJjZXMuYWRkKGAuLi5hbmQgJHtzb3VyY2VQYXRocy5sZW5ndGggLSAxMn0gbW9yZWApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChzb3VyY2VQYXRoKSB7XG4gICAgc291cmNlcy5hZGQoc291cmNlUGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgc291cmNlcy5hZGQoc291cmNlTGFiZWwpO1xuICB9XG5cbiAgcmV0dXJuIGZvcm1hdExpc3RTZWN0aW9uKHNvdXJjZXMsIFwiTm8gZXhwbGljaXQgc291cmNlcyBmb3VuZC5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVG9waWNQYWdlKFxuICB0b3BpYzogc3RyaW5nLFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIHNvdXJjZVBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IG92ZXJ2aWV3ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGV2aWRlbmNlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG9wZW5RdWVzdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbmV4dFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24oaGVhZGluZ1RleHQpKSB7XG4gICAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb29rc0xpa2VOZXh0U3RlcChoZWFkaW5nVGV4dCkpIHtcbiAgICAgICAgICBuZXh0U3RlcHMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IGxpbmUubWF0Y2goL15bLSorXVxccytcXFsoIHx4fFgpXFxdXFxzKyguKykkLyk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIGNvbnN0IHRhc2tUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGlmICh0YXNrVGV4dCkge1xuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgICBuZXh0U3RlcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL15bLSorXVxccysoPyFcXFsoIHx4fFgpXFxdXFxzKykoLispJC8pO1xuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGNvbnN0IGJ1bGxldFRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGJ1bGxldFsyXSk7XG4gICAgICBpZiAoYnVsbGV0VGV4dCkge1xuICAgICAgICBldmlkZW5jZS5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24oYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9va3NMaWtlTmV4dFN0ZXAoYnVsbGV0VGV4dCkpIHtcbiAgICAgICAgICBuZXh0U3RlcHMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobG9va3NMaWtlT3BlblF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgb3BlblF1ZXN0aW9ucy5hZGQocXVlc3Rpb24pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplIDwgNCkge1xuICAgICAgZXZpZGVuY2UuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghbmV4dFN0ZXBzLnNpemUpIHtcbiAgICBuZXh0U3RlcHMuYWRkKFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBgLSBUb3BpYzogJHtzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKX1gLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihldmlkZW5jZSwgXCJObyBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3BlblF1ZXN0aW9ucywgXCJObyBvcGVuIHF1ZXN0aW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFNvdXJjZXNcIixcbiAgICBmb3JtYXRTb3VyY2VzKHNvdXJjZUxhYmVsLCBzb3VyY2VQYXRoLCBzb3VyY2VQYXRocyksXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihuZXh0U3RlcHMsIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRvcGljUGFnZVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBwYXJzZWQuZXZpZGVuY2UgfHwgXCJObyBldmlkZW5jZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICBwYXJzZWQuc291cmNlcyB8fCBcIk5vIHNvdXJjZXMgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgcGFyc2VkLm5leHRTdGVwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgU291cmNlc1wiLFxuICAgIFwiTm8gc291cmNlcyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUb3BpY1BhZ2VTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGV2aWRlbmNlOiBzdHJpbmc7XG4gIG9wZW5RdWVzdGlvbnM6IHN0cmluZztcbiAgc291cmNlczogc3RyaW5nO1xuICBuZXh0U3RlcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XG4gICAgXCJPdmVydmlld1wiIHwgXCJFdmlkZW5jZVwiIHwgXCJPcGVuIFF1ZXN0aW9uc1wiIHwgXCJTb3VyY2VzXCIgfCBcIk5leHQgU3RlcHNcIixcbiAgICBzdHJpbmdbXVxuICA+ID0ge1xuICAgIE92ZXJ2aWV3OiBbXSxcbiAgICBFdmlkZW5jZTogW10sXG4gICAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBbXSxcbiAgICBTb3VyY2VzOiBbXSxcbiAgICBcIk5leHQgU3RlcHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goXG4gICAgICAvXiMjXFxzKyhPdmVydmlld3xFdmlkZW5jZXxPcGVuIFF1ZXN0aW9uc3xTb3VyY2VzfE5leHQgU3RlcHMpXFxzKiQvaSxcbiAgICApO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKC9eI1xccysvKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3ZlcnZpZXc6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuT3ZlcnZpZXddKSxcbiAgICBldmlkZW5jZTogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkV2aWRlbmNlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gICAgc291cmNlczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLlNvdXJjZXMpLFxuICAgIG5leHRTdGVwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiTmV4dCBTdGVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBFdmlkZW5jZTogc3RyaW5nW107XG4gIFwiT3BlbiBRdWVzdGlvbnNcIjogc3RyaW5nW107XG4gIFNvdXJjZXM6IHN0cmluZ1tdO1xuICBcIk5leHQgU3RlcHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwic291cmNlc1wiKSB7XG4gICAgcmV0dXJuIFwiU291cmNlc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm5leHQgc3RlcHNcIikge1xuICAgIHJldHVybiBcIk5leHQgU3RlcHNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza1ZhdWx0U2VydmljZSB7XG4gIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPjtcbiAgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBUYXNrU2VydmljZSB7XG4gIHByaXZhdGUgb3BlblRhc2tDb3VudENhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFRhc2tWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgYXBwZW5kVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCk7XG4gICAgaWYgKCFjbGVhbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUYXNrIHRleHQgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrID0gYC0gWyBdICR7Y2xlYW5lZH0gXyhhZGRlZCAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfSlfYDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHNldHRpbmdzLnRhc2tzRmlsZSwgYmxvY2spO1xuICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy50YXNrc0ZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGdldE9wZW5UYXNrQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHsgdGV4dCwgbXRpbWUsIGV4aXN0cyB9ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHRXaXRoTXRpbWUoc2V0dGluZ3MudGFza3NGaWxlKTtcbiAgICBpZiAoIWV4aXN0cykge1xuICAgICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBjb3VudDogMCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgJiYgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUubXRpbWUgPT09IG10aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUuY291bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSB0ZXh0XG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gL14tIFxcWyggfHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAhL14tIFxcWyh4fFgpXFxdLy50ZXN0KGxpbmUpKVxuICAgICAgLmxlbmd0aDtcbiAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IHtcbiAgICAgIG10aW1lLFxuICAgICAgY291bnQsXG4gICAgfTtcbiAgICByZXR1cm4gY291bnQ7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyByZXF1ZXN0VXJsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTdW1tYXJ5IH0gZnJvbSBcIi4uL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL29wZW4tcXVlc3Rpb25zLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3F1ZXN0aW9uLWFuc3dlci1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dCB9IGZyb20gXCIuLi91dGlscy90b3BpYy1wYWdlLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMgfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1RlbXBsYXRlIH0gZnJvbSBcIi4uL3ZpZXdzL3RlbXBsYXRlLXBpY2tlci1tb2RhbFwiO1xuXG50eXBlIFJvdXRlTGFiZWwgPSBcIm5vdGVcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBudWxsO1xuXG5pbnRlcmZhY2UgQ2hhdENvbXBsZXRpb25DaG9pY2Uge1xuICBtZXNzYWdlPzoge1xuICAgIGNvbnRlbnQ/OiBzdHJpbmc7XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvblJlc3BvbnNlIHtcbiAgY2hvaWNlcz86IENoYXRDb21wbGV0aW9uQ2hvaWNlW107XG59XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkFJU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBhc3luYyBzdW1tYXJpemUodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHN1bW1hcml6ZSBtYXJrZG93biB2YXVsdCBjb250ZW50LiBSZXNwb25kIHdpdGggY29uY2lzZSBtYXJrZG93biB1c2luZyB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiU3VtbWFyaXplIHRoZSBmb2xsb3dpbmcgdmF1bHQgY29udGVudCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIHRhc2tzLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVTdW1tYXJ5KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVDb250ZXh0KFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHByb21wdCA9IHRoaXMuYnVpbGRQcm9tcHQodGVtcGxhdGUsIGNvbnRleHQpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIHByb21wdCk7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHRlbXBsYXRlLCByZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8Um91dGVMYWJlbD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIkNsYXNzaWZ5IGNhcHR1cmUgdGV4dCBpbnRvIGV4YWN0bHkgb25lIG9mOiBub3RlLCB0YXNrLCBqb3VybmFsLiBSZXR1cm4gb25lIHdvcmQgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJDbGFzc2lmeSB0aGUgZm9sbG93aW5nIHVzZXIgaW5wdXQgYXMgZXhhY3RseSBvbmUgb2Y6XCIsXG4gICAgICAgICAgXCJub3RlXCIsXG4gICAgICAgICAgXCJ0YXNrXCIsXG4gICAgICAgICAgXCJqb3VybmFsXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBvbmx5IG9uZSB3b3JkLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIGNvbnN0IGNsZWFuZWQgPSByZXNwb25zZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY2xlYW5lZCA9PT0gXCJub3RlXCIgfHwgY2xlYW5lZCA9PT0gXCJ0YXNrXCIgfHwgY2xlYW5lZCA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgIHJldHVybiBjbGVhbmVkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGFuc3dlclF1ZXN0aW9uKFxuICAgIHF1ZXN0aW9uOiBzdHJpbmcsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgYW5zd2VyIHF1ZXN0aW9ucyB1c2luZyBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IG9ubHkuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seSBhbmQgZG8gbm90IGludmVudCBmYWN0cy5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJBbnN3ZXIgdGhlIGZvbGxvd2luZyBxdWVzdGlvbiB1c2luZyBvbmx5IHRoZSBjb250ZXh0IGJlbG93LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgYFF1ZXN0aW9uOiAke3F1ZXN0aW9ufWAsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiSWYgdGhlIGNvbnRleHQgaXMgaW5zdWZmaWNpZW50LCBzYXkgc28gZXhwbGljaXRseS5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoXG4gICAgdG9waWM6IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSB0dXJuIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBhIGR1cmFibGUgd2lraSBwYWdlLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBgQ3JlYXRlIGEgdG9waWMgcGFnZSBmb3I6ICR7dG9waWN9YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgYC0gVG9waWM6ICR7dG9waWN9YCxcbiAgICAgICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgIFwiIyMgU291cmNlc1wiLFxuICAgICAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQga2VlcCB0aGUgcGFnZSByZXVzYWJsZS5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIHJldHVybiBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQocmVzcG9uc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q2hhdENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCFzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgQVBJIGtleSBpcyBtaXNzaW5nXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEvY2hhdC9jb21wbGV0aW9uc1wiLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3NldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCl9YCxcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtb2RlbDogc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpLFxuICAgICAgICBtZXNzYWdlcyxcbiAgICAgICAgdGVtcGVyYXR1cmU6IDAuMixcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgY29uc3QganNvbiA9IHJlc3VsdC5qc29uIGFzIENoYXRDb21wbGV0aW9uUmVzcG9uc2U7XG4gICAgY29uc3QgY29udGVudCA9IGpzb24uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50ID8/IFwiXCI7XG4gICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbkFJIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkUHJvbXB0KFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+IHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCBhY3Rpb25hYmxlIHRhc2tzIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCB0YXNrcyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBhY3Rpb25hYmxlIGl0ZW1zLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgcmV3cml0ZSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gYSBjbGVhbiBtYXJrZG93biBub3RlLiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJSZXdyaXRlIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHRoZSBzdHJ1Y3R1cmUgb2YgYSByZXVzYWJsZSBub3RlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IGRlY2lzaW9ucyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3QgZGVjaXNpb25zIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIERlY2lzaW9uc1wiLFxuICAgICAgICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSB1bmNlcnRhaW50eSB3aGVyZSBjb250ZXh0IGlzIGluY29tcGxldGUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgXCJZb3UgZXh0cmFjdCB1bnJlc29sdmVkIHF1ZXN0aW9ucyBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkV4dHJhY3Qgb3BlbiBxdWVzdGlvbnMgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICAgICAgICAgIFwiIyMgQ29udGV4dFwiLFxuICAgICAgICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQga2VlcCB1bmNlcnRhaW50eSBleHBsaWNpdC5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBkcmFmdCBhIHByb2plY3QgYnJpZWYgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJEcmFmdCB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyBQcm9qZWN0IEJyaWVmXCIsXG4gICAgICAgICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICAgICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICAgICAgICBcIiMjIFNjb3BlXCIsXG4gICAgICAgICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBwcmVzZXJ2ZSBwcm9qZWN0IHN0cnVjdHVyZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3UgdHVybiBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0IGludG8gY29uY2lzZSBtYXJrZG93biBzeW50aGVzaXMuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIFwiU3VtbWFyaXplIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgICAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgaXRlbXMuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSwgcmVzcG9uc2U6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtdGFza3NcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVRhc2tFeHRyYWN0aW9uT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZUNsZWFuTm90ZU91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVN1bW1hcnlTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICAgIHBhcnNlZC5oaWdobGlnaHRzIHx8IFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgIHBhcnNlZC50YXNrcyB8fCBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIHBhcnNlZC5mb2xsb3dVcHMgfHwgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBcIk5vIHRhc2tzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHJlY2VudCBub3Rlcy5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN1bW1hcnlTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGhpZ2hsaWdodHM6IHN0cmluZztcbiAgdGFza3M6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiSGlnaGxpZ2h0c1wiIHwgXCJUYXNrc1wiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBIaWdobGlnaHRzOiBbXSxcbiAgICBUYXNrczogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKEhpZ2hsaWdodHN8VGFza3N8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGhpZ2hsaWdodHM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuSGlnaGxpZ2h0c10pLFxuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgSGlnaGxpZ2h0czogc3RyaW5nW107XG4gIFRhc2tzOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcInRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJUYXNrc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJIaWdobGlnaHRzXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dExvY2F0aW9uKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmcge1xuICBpZiAoY29udGV4dC5zb3VyY2VQYXRocyAmJiBjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBjb3VudCA9IGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoO1xuICAgIHJldHVybiBgJHtjb250ZXh0LnNvdXJjZUxhYmVsfSBcdTIwMjIgJHtjb3VudH0gJHtjb3VudCA9PT0gMSA/IFwiZmlsZVwiIDogXCJmaWxlc1wifWA7XG4gIH1cblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgcmV0dXJuIGAke2NvbnRleHQuc291cmNlTGFiZWx9IFx1MjAyMiAke2NvbnRleHQuc291cmNlUGF0aH1gO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQuc291cmNlTGFiZWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICBjb25zdCBsaW5lcyA9IFtgQ29udGV4dCBzb3VyY2U6ICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXTtcblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgbGluZXMucHVzaChgQ29udGV4dCBwYXRoOiAke2NvbnRleHQuc291cmNlUGF0aH1gKTtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goXCJDb250ZXh0IGZpbGVzOlwiKTtcbiAgICBjb25zdCB2aXNpYmxlID0gY29udGV4dC5zb3VyY2VQYXRocy5zbGljZSgwLCAxMik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHZpc2libGUpIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gJHtwYXRofWApO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IHZpc2libGUubGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtIC4uLmFuZCAke2NvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoIC0gdmlzaWJsZS5sZW5ndGh9IG1vcmVgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29udGV4dC50cnVuY2F0ZWQpIHtcbiAgICBsaW5lcy5wdXNoKFxuICAgICAgYENvbnRleHQgd2FzIHRydW5jYXRlZCB0byAke2NvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9LmAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICBjb25zdCBsaW5lcyA9IFtgU291cmNlOiAke2NvbnRleHQuc291cmNlTGFiZWx9YF07XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aCkge1xuICAgIGxpbmVzLnB1c2goYFNvdXJjZSBwYXRoOiAke2NvbnRleHQuc291cmNlUGF0aH1gKTtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goXCJTb3VyY2UgZmlsZXM6XCIpO1xuICAgIGNvbnN0IHZpc2libGUgPSBjb250ZXh0LnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdmlzaWJsZSkge1xuICAgICAgbGluZXMucHVzaChwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiB2aXNpYmxlLmxlbmd0aCkge1xuICAgICAgbGluZXMucHVzaChgLi4uYW5kICR7Y29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggLSB2aXNpYmxlLmxlbmd0aH0gbW9yZWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb250ZXh0LnRydW5jYXRlZCkge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBgQ29udGV4dCB0cnVuY2F0ZWQgdG8gJHtjb250ZXh0Lm1heENoYXJzfSBjaGFyYWN0ZXJzIGZyb20gJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbGluZXM7XG59XG4iLCAiaW1wb3J0IHtcbiAgQXBwLFxuICBUQWJzdHJhY3RGaWxlLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgbm9ybWFsaXplUGF0aCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGNsYXNzIFZhdWx0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHApIHt9XG5cbiAgYXN5bmMgZW5zdXJlS25vd25Gb2xkZXJzKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoc2V0dGluZ3Muam91cm5hbEZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoc2V0dGluZ3Mubm90ZXNGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoc2V0dGluZ3MucmV2aWV3c0ZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKHNldHRpbmdzLmluYm94RmlsZSkpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihzZXR0aW5ncy50YXNrc0ZpbGUpKTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmb2xkZXJQYXRoKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZ21lbnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIShleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZvbGRlcjogJHtjdXJyZW50fWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgaW5pdGlhbENvbnRlbnQgPSBcIlwiKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIobm9ybWFsaXplZCkpO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaW5pdGlhbENvbnRlbnQpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgIG10aW1lOiAwLFxuICAgICAgICBleGlzdHM6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKSxcbiAgICAgIG10aW1lOiBmaWxlLnN0YXQubXRpbWUsXG4gICAgICBleGlzdHM6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgY29uc3Qgc2VwYXJhdG9yID0gY3VycmVudC5sZW5ndGggPT09IDBcbiAgICAgID8gXCJcIlxuICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXFxuXCIpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICAgICAgICA/IFwiXFxuXCJcbiAgICAgICAgICA6IFwiXFxuXFxuXCI7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAke2N1cnJlbnR9JHtzZXBhcmF0b3J9JHtub3JtYWxpemVkQ29udGVudH1gKTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBub3JtYWxpemVkQ29udGVudCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBlbnN1cmVVbmlxdWVGaWxlUGF0aChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIGNvbnN0IGRvdEluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdEluZGV4ID09PSAtMSA/IG5vcm1hbGl6ZWQgOiBub3JtYWxpemVkLnNsaWNlKDAsIGRvdEluZGV4KTtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3RJbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZShkb3RJbmRleCk7XG5cbiAgICBsZXQgY291bnRlciA9IDI7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7Y291bnRlcn0ke2V4dGVuc2lvbn1gO1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY2FuZGlkYXRlKSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgICAgY291bnRlciArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEpvdXJuYWxIZWFkZXIoZmlsZVBhdGg6IHN0cmluZywgZGF0ZUtleTogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgsIGAjICR7ZGF0ZUtleX1cXG5cXG5gKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50Rm9sZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gIGNvbnN0IGluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIik7XG4gIHJldHVybiBpbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyB0cmltVHJhaWxpbmdOZXdsaW5lcyB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmludGVyZmFjZSBQcm9tcHRNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xuICBwbGFjZWhvbGRlcj86IHN0cmluZztcbiAgc3VibWl0TGFiZWw/OiBzdHJpbmc7XG4gIG11bHRpbGluZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBQcm9tcHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogUHJvbXB0TW9kYWxPcHRpb25zKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5Qcm9tcHQoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLm11bHRpbGluZSkge1xuICAgICAgY29uc3QgdGV4dGFyZWEgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciA/PyBcIlwiLFxuICAgICAgICAgIHJvd3M6IFwiOFwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICB0ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkpKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnB1dEVsID0gdGV4dGFyZWE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlucHV0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgPz8gXCJcIixcbiAgICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5wdXRFbCA9IGlucHV0O1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRFbC5mb2N1cygpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dCh0aGlzLm9wdGlvbnMuc3VibWl0TGFiZWwgPz8gXCJTdWJtaXRcIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJDYW5jZWxcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzdWJtaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmltVHJhaWxpbmdOZXdsaW5lcyh0aGlzLmlucHV0RWwudmFsdWUpLnRyaW0oKTtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5maW5pc2godmFsdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2godmFsdWU6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHZhbHVlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlc3VsdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRpdGxlVGV4dDogc3RyaW5nLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYm9keVRleHQ6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMudGl0bGVUZXh0IH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiB0aGlzLmJvZHlUZXh0LFxuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbnRlcmZhY2UgRmlsZUdyb3VwUGlja2VyTW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEZpbGVSb3cge1xuICBmaWxlOiBURmlsZTtcbiAgY2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHJvdzogSFRNTEVsZW1lbnQ7XG59XG5cbmV4cG9ydCBjbGFzcyBGaWxlR3JvdXBQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBURmlsZVtdIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG4gIHByaXZhdGUgc2VhcmNoSW5wdXQhOiBIVE1MSW5wdXRFbGVtZW50O1xuICBwcml2YXRlIHJvd3M6IEZpbGVSb3dbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZmlsZXM6IFRGaWxlW10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBGaWxlR3JvdXBQaWNrZXJNb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIG9uZSBvciBtb3JlIG5vdGVzIHRvIHVzZSBhcyBjb250ZXh0LlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5zZWFyY2hJbnB1dCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBwbGFjZWhvbGRlcjogXCJGaWx0ZXIgbm90ZXMuLi5cIixcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRoaXMuc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuZmlsdGVyUm93cyh0aGlzLnNlYXJjaElucHV0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3QgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWZpbGUtZ3JvdXAtbGlzdFwiLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIHRoaXMuZmlsZXMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3QuY3JlYXRlRWwoXCJsYWJlbFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1maWxlLWdyb3VwLXJvd1wiLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBjaGVja2JveCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJjaGVja2JveFwiLFxuICAgICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICB0ZXh0OiBmaWxlLnBhdGgsXG4gICAgICB9KTtcbiAgICAgIHRoaXMucm93cy5wdXNoKHsgZmlsZSwgY2hlY2tib3gsIHJvdyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiVXNlIFNlbGVjdGVkXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5yb3dzXG4gICAgICAgIC5maWx0ZXIoKHJvdykgPT4gcm93LmNoZWNrYm94LmNoZWNrZWQpXG4gICAgICAgIC5tYXAoKHJvdykgPT4gcm93LmZpbGUpO1xuICAgICAgaWYgKCFzZWxlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlNlbGVjdCBhdCBsZWFzdCBvbmUgbm90ZVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5maW5pc2goc2VsZWN0ZWQpO1xuICAgIH0pO1xuXG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNhbmNlbFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaWx0ZXJSb3dzKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBxdWVyeSA9IHZhbHVlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykge1xuICAgICAgY29uc3QgbWF0Y2ggPSAhcXVlcnkgfHwgcm93LmZpbGUucGF0aC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KTtcbiAgICAgIHJvdy5yb3cuc3R5bGUuZGlzcGxheSA9IG1hdGNoID8gXCJcIiA6IFwibm9uZVwiO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKGZpbGVzOiBURmlsZVtdIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUoZmlsZXMpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ0VudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3U2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctc2VydmljZVwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxudHlwZSBSZXZpZXdBY3Rpb24gPSBcImtlZXBcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBcIm5vdGVcIiB8IFwic2tpcFwiO1xuXG5leHBvcnQgY2xhc3MgSW5ib3hSZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBjdXJyZW50SW5kZXggPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IGhhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0LnRhZ05hbWUgPT09IFwiSU5QVVRcIiB8fCB0YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGtleVRvQWN0aW9uKGV2ZW50LmtleSk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IEluYm94RW50cnlbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJldmlld1NlcnZpY2U6IFJldmlld1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvbkFjdGlvbkNvbXBsZXRlPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJQcm9jZXNzIEluYm94XCIgfSk7XG5cbiAgICBpZiAoIXRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgdGV4dDogYEVudHJ5ICR7dGhpcy5jdXJyZW50SW5kZXggKyAxfSBvZiAke3RoaXMuZW50cmllcy5sZW5ndGh9YCxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IGVudHJ5LmhlYWRpbmcgfHwgXCJVbnRpdGxlZCBlbnRyeVwiLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBcIihlbXB0eSBlbnRyeSlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgYW4gYWN0aW9uIGZvciB0aGlzIGVudHJ5LiBTaG9ydGN1dHM6IGsga2VlcCwgdCB0YXNrLCBqIGpvdXJuYWwsIG4gbm90ZSwgcyBza2lwLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9uUm93ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJLZWVwIGluIGluYm94XCIsIFwia2VlcFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQ29udmVydCB0byB0YXNrXCIsIFwidGFza1wiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQXBwZW5kIHRvIGpvdXJuYWxcIiwgXCJqb3VybmFsXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJQcm9tb3RlIHRvIG5vdGVcIiwgXCJub3RlXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJTa2lwXCIsIFwic2tpcFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQnV0dG9uKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogUmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogYWN0aW9uID09PSBcIm5vdGVcIiA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogbGFiZWwsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlQWN0aW9uKGFjdGlvbjogUmV2aWV3QWN0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9UYXNrKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImpvdXJuYWxcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmFwcGVuZFRvSm91cm5hbChlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9Ob3RlKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImtlZXBcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmtlZXBFbnRyeShlbnRyeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnNraXBFbnRyeShlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLm9uQWN0aW9uQ29tcGxldGUpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9uQWN0aW9uQ29tcGxldGUobWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBwcm9jZXNzIHJldmlldyBhY3Rpb25cIik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY3VycmVudEluZGV4ICs9IDE7XG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA+PSB0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJJbmJveCByZXZpZXcgY29tcGxldGVcIik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHByb2Nlc3MgaW5ib3ggZW50cnlcIik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGtleVRvQWN0aW9uKGtleTogc3RyaW5nKTogUmV2aWV3QWN0aW9uIHwgbnVsbCB7XG4gIHN3aXRjaCAoa2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlIFwia1wiOlxuICAgICAgcmV0dXJuIFwia2VlcFwiO1xuICAgIGNhc2UgXCJ0XCI6XG4gICAgICByZXR1cm4gXCJ0YXNrXCI7XG4gICAgY2FzZSBcImpcIjpcbiAgICAgIHJldHVybiBcImpvdXJuYWxcIjtcbiAgICBjYXNlIFwiblwiOlxuICAgICAgcmV0dXJuIFwibm90ZVwiO1xuICAgIGNhc2UgXCJzXCI6XG4gICAgICByZXR1cm4gXCJza2lwXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogQ2VudHJhbGl6ZWQgZXJyb3IgaGFuZGxpbmcgdXRpbGl0eVxuICogU3RhbmRhcmRpemVzIGVycm9yIHJlcG9ydGluZyBhY3Jvc3MgdGhlIHBsdWdpblxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlO1xuICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yQW5kUmV0aHJvdyhlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyIHtcbiAgc2hvd0Vycm9yKGVycm9yLCBkZWZhdWx0TWVzc2FnZSk7XG4gIHRocm93IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihkZWZhdWx0TWVzc2FnZSk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgdHlwZSBRdWVzdGlvblNjb3BlID0gXCJub3RlXCIgfCBcImdyb3VwXCIgfCBcImZvbGRlclwiIHwgXCJ2YXVsdFwiO1xuXG5pbnRlcmZhY2UgUXVlc3Rpb25TY29wZU1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBRdWVzdGlvblNjb3BlTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogUXVlc3Rpb25TY29wZSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogUXVlc3Rpb25TY29wZU1vZGFsT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5QaWNrZXIoKTogUHJvbWlzZTxRdWVzdGlvblNjb3BlIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgdGhlIHNjb3BlIEJyYWluIHNob3VsZCB1c2UgZm9yIHRoaXMgcmVxdWVzdC5cIixcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJDdXJyZW50IE5vdGVcIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJub3RlXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJTZWxlY3RlZCBOb3Rlc1wiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImdyb3VwXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJDdXJyZW50IEZvbGRlclwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImZvbGRlclwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiRW50aXJlIFZhdWx0XCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwidmF1bHRcIik7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2goc2NvcGU6IFF1ZXN0aW9uU2NvcGUgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZShzY29wZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnkgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdIaXN0b3J5TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZW50cmllczogUmV2aWV3TG9nRW50cnlbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4sXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlJldmlldyBIaXN0b3J5XCIgfSk7XG5cbiAgICBpZiAoIXRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIk5vIHJldmlldyBsb2dzIGZvdW5kLlwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJPcGVuIGEgbG9nIHRvIGluc3BlY3QgaXQsIG9yIHJlLW9wZW4gYW4gaW5ib3ggaXRlbSBpZiBpdCB3YXMgbWFya2VkIGluY29ycmVjdGx5LlwiLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLmVudHJpZXMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwgeyBjbHM6IFwiYnJhaW4tc2VjdGlvblwiIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBlbnRyeS5oZWFkaW5nIHx8IFwiVW50aXRsZWQgaXRlbVwiIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IGAke2VudHJ5LnRpbWVzdGFtcH0gXHUyMDIyICR7ZW50cnkuYWN0aW9ufWAsXG4gICAgICB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgICAgdGV4dDogZW50cnkucHJldmlldyB8fCBcIihlbXB0eSBwcmV2aWV3KVwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGJ1dHRvbnMgPSByb3cuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgdGV4dDogXCJPcGVuIGxvZ1wiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLm9wZW5Mb2coZW50cnkuc291cmNlUGF0aCk7XG4gICAgICB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgIHRleHQ6IFwiUmUtb3BlblwiLFxuICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJlb3BlbkVudHJ5KGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3BlbkxvZyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBhYnN0cmFjdEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCEoYWJzdHJhY3RGaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gcmV2aWV3IGxvZ1wiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShhYnN0cmFjdEZpbGUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW9wZW5FbnRyeShlbnRyeTogUmV2aWV3TG9nRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJlb3BlblJldmlld0VudHJ5KGVudHJ5KTtcbiAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi4vc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQgfSBmcm9tIFwiLi4vc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdENvbnRleHRMb2NhdGlvbiB9IGZyb20gXCIuLi91dGlscy9jb250ZXh0LWZvcm1hdFwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuaW50ZXJmYWNlIFN5bnRoZXNpc1Jlc3VsdE1vZGFsT3B0aW9ucyB7XG4gIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQ7XG4gIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0O1xuICBjYW5JbnNlcnQ6IGJvb2xlYW47XG4gIG9uSW5zZXJ0OiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIG9uU2F2ZTogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBvbkFjdGlvbkNvbXBsZXRlOiAobWVzc2FnZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgY2xhc3MgU3ludGhlc2lzUmVzdWx0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgd29ya2luZyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1dHRvbnM6IEhUTUxCdXR0b25FbGVtZW50W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFN5bnRoZXNpc1Jlc3VsdE1vZGFsT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IGBCcmFpbiAke3RoaXMub3B0aW9ucy5yZXN1bHQudGl0bGV9YCB9KTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYEFjdGlvbjogJHt0aGlzLm9wdGlvbnMucmVzdWx0LmFjdGlvbn1gLFxuICAgIH0pO1xuICAgIGlmICh0aGlzLm9wdGlvbnMucmVzdWx0LnByb21wdFRleHQpIHtcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgUHJvbXB0OiAke3RoaXMub3B0aW9ucy5yZXN1bHQucHJvbXB0VGV4dH1gLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYENvbnRleHQ6ICR7Zm9ybWF0Q29udGV4dExvY2F0aW9uKHRoaXMub3B0aW9ucy5jb250ZXh0KX1gLFxuICAgIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogdGhpcy5vcHRpb25zLmNvbnRleHQudHJ1bmNhdGVkXG4gICAgICAgID8gYENvbnRleHQgdHJ1bmNhdGVkIHRvICR7dGhpcy5vcHRpb25zLmNvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm9yaWdpbmFsTGVuZ3RofS5gXG4gICAgICAgIDogYENvbnRleHQgbGVuZ3RoOiAke3RoaXMub3B0aW9ucy5jb250ZXh0Lm9yaWdpbmFsTGVuZ3RofSBjaGFyYWN0ZXJzLmAsXG4gICAgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogdGhpcy5vcHRpb25zLnJlc3VsdC5jb250ZW50LFxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jYW5JbnNlcnQpIHtcbiAgICAgIC8vIEJ1dHRvbnMgYXJlIHJlbmRlcmVkIGJlbG93IGFmdGVyIG9wdGlvbmFsIGd1aWRhbmNlIHRleHQuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBcIk9wZW4gYSBtYXJrZG93biBub3RlIHRvIGluc2VydCB0aGlzIGFydGlmYWN0IHRoZXJlLCBvciBzYXZlIGl0IHRvIEJyYWluIG5vdGVzLlwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgdGhpcy5idXR0b25zID0gW107XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNhbkluc2VydCkge1xuICAgICAgdGhpcy5idXR0b25zLnB1c2godGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJJbnNlcnQgaW50byBjdXJyZW50IG5vdGVcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucnVuQWN0aW9uKCgpID0+IHRoaXMub3B0aW9ucy5vbkluc2VydCgpKTtcbiAgICAgIH0sIHRydWUpKTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1dHRvbnMucHVzaChcbiAgICAgIHRoaXMuY3JlYXRlQnV0dG9uKGJ1dHRvbnMsIFwiU2F2ZSB0byBCcmFpbiBub3Rlc1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5ydW5BY3Rpb24oKCkgPT4gdGhpcy5vcHRpb25zLm9uU2F2ZSgpKTtcbiAgICAgIH0pLFxuICAgICAgdGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJDbG9zZVwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUJ1dHRvbihcbiAgICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBvbkNsaWNrOiAoKSA9PiB2b2lkLFxuICAgIGN0YSA9IGZhbHNlLFxuICApOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgYnV0dG9uID0gcGFyZW50LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogY3RhID8gXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIiA6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0LFxuICAgIH0pO1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25DbGljayk7XG4gICAgcmV0dXJuIGJ1dHRvbjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQWN0aW9uKGFjdGlvbjogKCkgPT4gUHJvbWlzZTxzdHJpbmc+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMud29ya2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMud29ya2luZyA9IHRydWU7XG4gICAgdGhpcy5zZXRCdXR0b25zRGlzYWJsZWQodHJ1ZSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IGFjdGlvbigpO1xuICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uQWN0aW9uQ29tcGxldGUobWVzc2FnZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgdXBkYXRlIHRoZSBzeW50aGVzaXMgcmVzdWx0XCIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0QnV0dG9uc0Rpc2FibGVkKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldEJ1dHRvbnNEaXNhYmxlZChkaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIHRoaXMuYnV0dG9ucykge1xuICAgICAgYnV0dG9uLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtdGVtcGxhdGVcIjtcblxuZXhwb3J0IHR5cGUgU3ludGhlc2lzVGVtcGxhdGUgPVxuICB8IFwic3VtbWFyaXplXCJcbiAgfCBcImV4dHJhY3QtdGFza3NcIlxuICB8IFwiZXh0cmFjdC1kZWNpc2lvbnNcIlxuICB8IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiXG4gIHwgXCJyZXdyaXRlLWNsZWFuLW5vdGVcIlxuICB8IFwiZHJhZnQtcHJvamVjdC1icmllZlwiO1xuXG5pbnRlcmZhY2UgVGVtcGxhdGVQaWNrZXJPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZSE6ICh2YWx1ZTogU3ludGhlc2lzVGVtcGxhdGUgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFRlbXBsYXRlUGlja2VyT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5QaWNrZXIoKTogUHJvbWlzZTxTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2hvb3NlIGhvdyBCcmFpbiBzaG91bGQgc3ludGhlc2l6ZSB0aGlzIGNvbnRleHQuXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJzdW1tYXJpemVcIikpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwic3VtbWFyaXplXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImV4dHJhY3QtdGFza3NcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC10YXNrc1wiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LWRlY2lzaW9uc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LWRlY2lzaW9uc1wiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInJld3JpdGUtY2xlYW4tbm90ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImRyYWZ0LXByb2plY3QtYnJpZWZcIik7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2godGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUodGVtcGxhdGUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBOb3RpY2UsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGNvbnN0IEJSQUlOX1ZJRVdfVFlQRSA9IFwiYnJhaW4tc2lkZWJhci12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpblNpZGViYXJWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBwcml2YXRlIHJlc3VsdEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3VtbWFyeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgaW5ib3hDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgdGFza0NvdW50RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSByZXZpZXdIaXN0b3J5RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBhaVN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3VtbWFyeVN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgaXNMb2FkaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgY29sbGFwc2VkU2VjdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSQUlOX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQnJhaW5cIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpblwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1zaWRlYmFyXCIpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNhcHR1cmUgaWRlYXMsIHN5bnRoZXNpemUgZXhwbGljaXQgY29udGV4dCwgYW5kIHNhdmUgZHVyYWJsZSBtYXJrZG93biBhcnRpZmFjdHMuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmxvYWRDb2xsYXBzZWRTdGF0ZSgpO1xuICAgIHRoaXMuY3JlYXRlQ2FwdHVyZVNlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVRvcGljUGFnZVNlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVN5bnRoZXNpc1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZUFza1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVJldmlld1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVBc3Npc3RTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTdGF0dXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVPdXRwdXRTZWN0aW9uKCk7XG4gICAgdGhpcy5yZWdpc3RlcktleWJvYXJkU2hvcnRjdXRzKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHNldExhc3RSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5yZXN1bHRFbC5zZXRUZXh0KHRleHQpO1xuICB9XG5cbiAgc2V0TGFzdFN1bW1hcnkodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zdW1tYXJ5RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgW2luYm94Q291bnQsIHRhc2tDb3VudCwgcmV2aWV3Q291bnRdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5wbHVnaW4uZ2V0SW5ib3hDb3VudCgpLFxuICAgICAgdGhpcy5wbHVnaW4uZ2V0T3BlblRhc2tDb3VudCgpLFxuICAgICAgdGhpcy5wbHVnaW4uZ2V0UmV2aWV3SGlzdG9yeUNvdW50KCksXG4gICAgXSk7XG4gICAgaWYgKHRoaXMuaW5ib3hDb3VudEVsKSB7XG4gICAgICB0aGlzLmluYm94Q291bnRFbC5zZXRUZXh0KGAke2luYm94Q291bnR9IHVucmV2aWV3ZWQgZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy50YXNrQ291bnRFbCkge1xuICAgICAgdGhpcy50YXNrQ291bnRFbC5zZXRUZXh0KGAke3Rhc2tDb3VudH0gb3BlbiB0YXNrc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5yZXZpZXdIaXN0b3J5RWwpIHtcbiAgICAgIHRoaXMucmV2aWV3SGlzdG9yeUVsLnNldFRleHQoYFJldmlldyBoaXN0b3J5OiAke3Jldmlld0NvdW50fSBlbnRyaWVzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmFpU3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5zZXRUZXh0KHRoaXMucGx1Z2luLmdldEFpU3RhdHVzVGV4dCgpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3VtbWFyeVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLnN1bW1hcnlTdGF0dXNFbC5zZXRUZXh0KHRoaXMucGx1Z2luLmdldExhc3RTdW1tYXJ5TGFiZWwoKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRMb2FkaW5nKGxvYWRpbmc6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmlzTG9hZGluZyA9IGxvYWRpbmc7XG4gICAgY29uc3QgYnV0dG9ucyA9IEFycmF5LmZyb20odGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvbi5icmFpbi1idXR0b25cIikpO1xuICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGJ1dHRvbnMpIHtcbiAgICAgIChidXR0b24gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5wdXRFbCkge1xuICAgICAgdGhpcy5pbnB1dEVsLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyS2V5Ym9hcmRTaG9ydGN1dHMoKTogdm9pZCB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gIH1cblxuICBwcml2YXRlIHJlYWRvbmx5IGhhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0LnRhZ05hbWUgPT09IFwiSU5QVVRcIiB8fCB0YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZXZlbnQua2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQXNOb3RlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVBc1Rhc2soKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwialwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzSm91cm5hbCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJDYXB0dXJlIGNsZWFyZWRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfTtcblxuICBwcml2YXRlIHRvZ2dsZVNlY3Rpb24oc2VjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoc2VjdGlvbklkKSkge1xuICAgICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5kZWxldGUoc2VjdGlvbklkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5hZGQoc2VjdGlvbklkKTtcbiAgICB9XG4gICAgdGhpcy5zYXZlQ29sbGFwc2VkU3RhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZENvbGxhcHNlZFN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMgPSBuZXcgU2V0KHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxhcHNlZFNpZGViYXJTZWN0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIHNhdmVDb2xsYXBzZWRTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xsYXBzZWRTaWRlYmFyU2VjdGlvbnMgPSBBcnJheS5mcm9tKHRoaXMuY29sbGFwc2VkU2VjdGlvbnMpO1xuICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICBpZDogc3RyaW5nLFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBjb250ZW50Q3JlYXRvcjogKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpID0+IHZvaWQsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc2VjdGlvbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCB0b2dnbGVCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNvbGxhcHNlLXRvZ2dsZVwiLFxuICAgICAgdGV4dDogdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpID8gXCJcdTI1QjZcIiA6IFwiXHUyNUJDXCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIFwiYXJpYS1sYWJlbFwiOiB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBgRXhwYW5kICR7dGl0bGV9YCA6IGBDb2xsYXBzZSAke3RpdGxlfWAsXG4gICAgICAgIFwiYXJpYS1leHBhbmRlZFwiOiAoIXRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSkudG9TdHJpbmcoKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiB0aXRsZSB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogZGVzY3JpcHRpb24gfSk7XG5cbiAgICB0b2dnbGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMudG9nZ2xlU2VjdGlvbihpZCk7XG4gICAgICBjb25zdCBjb250ZW50RWwgPSBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoXCIuYnJhaW4tc2VjdGlvbi1jb250ZW50XCIpO1xuICAgICAgaWYgKGNvbnRlbnRFbCkge1xuICAgICAgICBjb250ZW50RWwudG9nZ2xlQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xuICAgICAgICB0b2dnbGVCdG4uc2V0VGV4dCh0aGlzLmNvbGxhcHNlZFNlY3Rpb25zLmhhcyhpZCkgPyBcIlx1MjVCNlwiIDogXCJcdTI1QkNcIik7XG4gICAgICAgIHRvZ2dsZUJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IGBFeHBhbmQgJHt0aXRsZX1gIDogYENvbGxhcHNlICR7dGl0bGV9YCk7XG4gICAgICAgIHRvZ2dsZUJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsICghdGhpcy5jb2xsYXBzZWRTZWN0aW9ucy5oYXMoaWQpKS50b1N0cmluZygpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uLWNvbnRlbnRcIixcbiAgICAgIGF0dHI6IHRoaXMuY29sbGFwc2VkU2VjdGlvbnMuaGFzKGlkKSA/IHsgaGlkZGVuOiBcInRydWVcIiB9IDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICAgIGNvbnRlbnRDcmVhdG9yKGNvbnRlbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDYXB0dXJlU2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwiY2FwdHVyZVwiLFxuICAgICAgXCJRdWljayBDYXB0dXJlXCIsXG4gICAgICBcIkNhcHR1cmUgcm91Z2ggaW5wdXQgaW50byB0aGUgdmF1bHQgYmVmb3JlIHJldmlldyBhbmQgc3ludGhlc2lzLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICB0aGlzLmlucHV0RWwgPSBjb250YWluZXIuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWNhcHR1cmUtaW5wdXRcIixcbiAgICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogXCJUeXBlIGEgbm90ZSwgdGFzaywgb3Igam91cm5hbCBlbnRyeS4uLlwiLFxuICAgICAgICAgICAgcm93czogXCI4XCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNhcHR1cmUgTm90ZSAobilcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUFzTm90ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2FwdHVyZSBUYXNrICh0KVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQXNUYXNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJDYXB0dXJlIEpvdXJuYWwgKGopXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnNhdmVBc0pvdXJuYWwoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkNsZWFyIChjKVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkNhcHR1cmUgY2xlYXJlZFwiKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVN5bnRoZXNpc1NlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcInN5bnRoZXNpc1wiLFxuICAgICAgXCJTeW50aGVzaXplXCIsXG4gICAgICBcIlR1cm4gZXhwbGljaXQgY29udGV4dCBpbnRvIHN1bW1hcmllcywgY2xlYW4gbm90ZXMsIHRhc2tzLCBhbmQgYnJpZWZzLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICAgIHRleHQ6IFwiU3VtbWFyaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiU3ludGhlc2l6ZSBDdXJyZW50IE5vdGUuLi5cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJFeHRyYWN0IFRhc2tzIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dFNlbGVjdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiRHJhZnQgQnJpZWYgRnJvbSBGb2xkZXJcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0Q3VycmVudEZvbGRlcigpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ2xlYW4gTm90ZSBGcm9tIFJlY2VudCBGaWxlc1wiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXNrQWJvdXRSZWNlbnRGaWxlcygpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIlN5bnRoZXNpemUgTm90ZXMuLi5cIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnN5bnRoZXNpemVOb3RlcygpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUFza1NlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcImFza1wiLFxuICAgICAgXCJBc2sgQnJhaW5cIixcbiAgICAgIFwiQXNrIGEgcXVlc3Rpb24gYWJvdXQgdGhlIGN1cnJlbnQgbm90ZSwgYSBzZWxlY3RlZCBncm91cCwgYSBmb2xkZXIsIG9yIHRoZSB3aG9sZSB2YXVsdC5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgICB0ZXh0OiBcIkFzayBRdWVzdGlvblwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrUXVlc3Rpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrUXVlc3Rpb25BYm91dEN1cnJlbnROb3RlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgICAgdGV4dDogXCJBYm91dCBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVJldmlld1NlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcInJldmlld1wiLFxuICAgICAgXCJSZXZpZXdcIixcbiAgICAgIFwiUHJvY2VzcyBjYXB0dXJlZCBpbnB1dCBhbmQga2VlcCB0aGUgZGFpbHkgbG9vcCBtb3ZpbmcuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICAgICAgdGV4dDogXCJSZXZpZXcgSW5ib3hcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnByb2Nlc3NJbmJveCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiT3BlbiBSZXZpZXcgSGlzdG9yeVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ub3BlblJldmlld0hpc3RvcnkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVRvcGljUGFnZVNlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcInRvcGljXCIsXG4gICAgICBcIlRvcGljIFBhZ2VzXCIsXG4gICAgICBcIkJyYWluJ3MgZmxhZ3NoaXAgZmxvdzogdHVybiBleHBsaWNpdCBjb250ZXh0IGludG8gYSBkdXJhYmxlIG1hcmtkb3duIHBhZ2UgeW91IGNhbiBrZWVwIGJ1aWxkaW5nLlwiLFxuICAgICAgKGNvbnRhaW5lcikgPT4ge1xuICAgICAgICBjb25zdCBidXR0b25zID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICAgIHRleHQ6IFwiQ3JlYXRlIFRvcGljIFBhZ2VcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmNyZWF0ZVRvcGljUGFnZSgpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIlRvcGljIFBhZ2UgRnJvbSBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKFwibm90ZVwiKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKFxuICAgICAgXCJjYXB0dXJlLWFzc2lzdFwiLFxuICAgICAgXCJDYXB0dXJlIEFzc2lzdFwiLFxuICAgICAgXCJVc2UgQUkgb25seSB0byBjbGFzc2lmeSBmcmVzaCBjYXB0dXJlIGludG8gbm90ZSwgdGFzaywgb3Igam91cm5hbC5cIixcbiAgICAgIChjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgICAgICB0ZXh0OiBcIkF1dG8tcm91dGUgQ2FwdHVyZVwiLFxuICAgICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5hdXRvUm91dGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVN0YXR1c1NlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jcmVhdGVDb2xsYXBzaWJsZVNlY3Rpb24oXG4gICAgICBcInN0YXR1c1wiLFxuICAgICAgXCJTdGF0dXNcIixcbiAgICAgIFwiQ3VycmVudCBpbmJveCwgdGFzaywgYW5kIHN5bnRoZXNpcyBzdGF0dXMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGluYm94Um93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiSW5ib3g6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy5pbmJveENvdW50RWwgPSBpbmJveFJvdztcblxuICAgICAgICBjb25zdCB0YXNrUm93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiVGFza3M6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICAgICAgdGhpcy50YXNrQ291bnRFbCA9IHRhc2tSb3c7XG5cbiAgICAgICAgY29uc3QgcmV2aWV3Um93ID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXN0YXR1cy1yb3dcIiB9KTtcbiAgICAgICAgdGhpcy5yZXZpZXdIaXN0b3J5RWwgPSByZXZpZXdSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJSZXZpZXcgaGlzdG9yeTogbG9hZGluZy4uLlwiIH0pO1xuICAgICAgICByZXZpZXdSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICAgICAgdGV4dDogXCJPcGVuXCIsXG4gICAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhaVJvdyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkFJOiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHRoaXMuYWlTdGF0dXNFbCA9IGFpUm93O1xuXG4gICAgICAgIGNvbnN0IHN1bW1hcnlSb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJMYXN0IGFydGlmYWN0OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgICAgIHRoaXMuc3VtbWFyeVN0YXR1c0VsID0gc3VtbWFyeVJvdztcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0U2VjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcbiAgICAgIFwib3V0cHV0XCIsXG4gICAgICBcIkFydGlmYWN0c1wiLFxuICAgICAgXCJSZWNlbnQgc3ludGhlc2lzIHJlc3VsdHMgYW5kIGdlbmVyYXRlZCBhcnRpZmFjdHMuXCIsXG4gICAgICAoY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IFJlc3VsdFwiIH0pO1xuICAgICAgICB0aGlzLnJlc3VsdEVsID0gY29udGFpbmVyLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tb3V0cHV0XCIsXG4gICAgICAgICAgdGV4dDogXCJObyByZXN1bHQgeWV0LlwiLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb250YWluZXIuY3JlYXRlRWwoXCJoNFwiLCB7IHRleHQ6IFwiTGFzdCBBcnRpZmFjdFwiIH0pO1xuICAgICAgICB0aGlzLnN1bW1hcnlFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLW91dHB1dFwiLFxuICAgICAgICAgIHRleHQ6IFwiTm8gYXJ0aWZhY3QgZ2VuZXJhdGVkIHlldC5cIixcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc05vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IGNhcHR1cmUgbm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc1Rhc2soKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlVGFzayh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGF1dG9Sb3V0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgcm91dGUgPSBhd2FpdCB0aGlzLnBsdWdpbi5yb3V0ZVRleHQodGV4dCk7XG4gICAgICBpZiAoIXJvdXRlKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBjb3VsZCBub3QgY2xhc3NpZnkgdGhhdCBlbnRyeVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHJvdXRlID09PSBcIm5vdGVcIikge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVOb3RlKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IGNhcHR1cmUgbm90ZVwiLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChyb3V0ZSA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlVGFzayh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIHRhc2tcIixcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZUpvdXJuYWwodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3Qgc2F2ZSBqb3VybmFsIGVudHJ5XCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXV0by1yb3V0ZSBjYXB0dXJlXCIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNhcHR1cmUoXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgZmFpbHVyZU1lc3NhZ2U6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHRleHQpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIGZhaWx1cmVNZXNzYWdlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21tYW5kcyhwbHVnaW46IEJyYWluUGx1Z2luKTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjYXB0dXJlLW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIE5vdGVcIiwgXCJDYXB0dXJlXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgICAgIHJldHVybiBgQ2FwdHVyZWQgbm90ZSBpbiAke3NhdmVkLnBhdGh9YDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFza1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFza1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcIkNhcHR1cmUgVGFza1wiLCBcIkNhcHR1cmVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4udGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC1qb3VybmFsLWVudHJ5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFxuICAgICAgICBcIkNhcHR1cmUgSm91cm5hbFwiLFxuICAgICAgICBcIkNhcHR1cmVcIixcbiAgICAgICAgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICAgICAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJwcm9jZXNzLWluYm94XCIsXG4gICAgbmFtZTogXCJCcmFpbjogUmV2aWV3IEluYm94XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwicmV2aWV3LWhpc3RvcnlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzdW1tYXJpemUtdG9kYXlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb2RheSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coMSwgXCJUb2RheVwiKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3VtbWFyaXplLXRoaXMtd2Vla1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFdlZWtseSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coNywgXCJXZWVrXCIpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFzay1mcm9tLXNlbGVjdGlvblwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFzayBGcm9tIFNlbGVjdGlvblwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYWRkVGFza0Zyb21TZWxlY3Rpb24oKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi10b2RheXMtam91cm5hbFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVG9kYXkncyBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuVG9kYXlzSm91cm5hbCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXNpZGViYXJcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIEJyYWluIFNpZGViYXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5bnRoZXNpemUtbm90ZXNcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIE5vdGVzXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5zeW50aGVzaXplTm90ZXMoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3ludGhlc2l6ZS1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhc2stcXVlc3Rpb25cIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza1F1ZXN0aW9uKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFzay1xdWVzdGlvbi1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2VcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jcmVhdGVUb3BpY1BhZ2UoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2UtY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsb0JBQW9EOzs7QUNzQjdDLElBQU0seUJBQThDO0FBQUEsRUFDekQsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsYUFBYTtBQUFBLEVBQ2IsaUJBQWlCO0FBQUEsRUFDakIsZUFBZTtBQUFBLEVBQ2YsbUJBQW1CO0FBQUEsRUFDbkIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IscUJBQXFCO0FBQUEsRUFDckIsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQUEsRUFDbEIsMEJBQTBCLENBQUM7QUFDN0I7QUFFTyxTQUFTLHVCQUNkLE9BQ3FCO0FBQ3JCLFFBQU0sU0FBOEI7QUFBQSxJQUNsQyxHQUFHO0FBQUEsSUFDSCxHQUFHO0FBQUEsRUFDTDtB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QUssU0FBUyxNQUFNLEdBQUc7QUFDekIsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLEtBQUssU0FBUyxJQUFJLEdBQUc7QUFDdkIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEsa0JBQWtCLFNBQXlCO0FBQ2pELFVBQU0sUUFBUSxRQUFRLEtBQUssRUFBRSxNQUFNLElBQUk7QUFDdkMsUUFBSSxDQUFDLE1BQU0sUUFBUTtBQUNqQixhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksQ0FBQyxRQUFRLEtBQUssTUFBTSxDQUFDLENBQUMsR0FBRztBQUMzQixhQUFPLFFBQVEsS0FBSztBQUFBLElBQ3RCO0FBRUEsVUFBTSxZQUFZLE1BQU0sTUFBTSxDQUFDO0FBQy9CLFdBQU8sVUFBVSxTQUFTLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEdBQUc7QUFDbkQsZ0JBQVUsTUFBTTtBQUFBLElBQ2xCO0FBQ0EsV0FBTyxVQUFVLEtBQUssSUFBSSxFQUFFLEtBQUs7QUFBQSxFQUNuQztBQUFBLEVBRVEseUJBQWlDO0FBL3pCM0M7QUFnMEJJLFVBQU0sYUFBYSxLQUFLLElBQUksVUFBVSxvQkFBb0IsOEJBQVk7QUFDdEUsVUFBTSxhQUFZLDBEQUFZLFdBQVosbUJBQW9CLG1CQUFwQixtQkFBb0MsV0FBcEMsWUFBOEM7QUFDaEUsV0FBTztBQUFBLEVBQ1Q7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJzbHVnaWZ5IiwgInRyaW1UaXRsZSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgImdldFdpbmRvd1N0YXJ0IiwgImltcG9ydF9vYnNpZGlhbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
