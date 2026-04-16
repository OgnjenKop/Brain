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
  persistSummaries: true
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
    persistSummaries: Boolean(merged.persistSummaries)
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
    this.createCaptureSection();
    this.createTopicPageSection();
    this.createSynthesisSection();
    this.createAskSection();
    this.createReviewSection();
    this.createCaptureAssistSection();
    this.createStatusSection();
    this.createOutputSection();
    await this.refreshStatus();
  }
  onClose() {
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
  createCaptureSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Quick Capture" });
    section.createEl("p", {
      text: "Capture rough input into the vault before review and synthesis."
    });
    this.inputEl = section.createEl("textarea", {
      cls: "brain-capture-input",
      attr: {
        placeholder: "Type a note, task, or journal entry...",
        rows: "8"
      }
    });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Capture Note"
    }).addEventListener("click", () => {
      void this.saveAsNote();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Capture Task"
    }).addEventListener("click", () => {
      void this.saveAsTask();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Capture Journal Entry"
    }).addEventListener("click", () => {
      void this.saveAsJournal();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Clear"
    }).addEventListener("click", () => {
      this.inputEl.value = "";
      new import_obsidian17.Notice("Capture cleared");
    });
  }
  createSynthesisSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Synthesize" });
    section.createEl("p", {
      text: "Turn explicit context into summaries, clean notes, tasks, and briefs."
    });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Summarize Current Note"
    }).addEventListener("click", () => {
      void this.plugin.askAboutCurrentNote();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Synthesize Current Note..."
    }).addEventListener("click", () => {
      void this.plugin.askAboutCurrentNoteWithTemplate();
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
    }).addEventListener("click", () => {
      void this.plugin.askAboutRecentFiles();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Synthesize Notes..."
    }).addEventListener("click", () => {
      void this.plugin.synthesizeNotes();
    });
  }
  createAskSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Ask Brain" });
    section.createEl("p", {
      text: "Ask a question about the current note, a selected group, a folder, or the whole vault."
    });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Ask Question..."
    }).addEventListener("click", () => {
      void this.plugin.askQuestion();
    });
  }
  createReviewSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Review" });
    section.createEl("p", {
      text: "Process captured input and keep the daily loop moving."
    });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Review Inbox"
    }).addEventListener("click", () => {
      void this.plugin.processInbox();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Open Today's Journal"
    }).addEventListener("click", () => {
      void this.plugin.openTodaysJournal();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Create Today Summary"
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(1, "Today");
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Create Weekly Summary"
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(7, "Week");
    });
  }
  createTopicPageSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Topic Pages" });
    section.createEl("p", {
      text: "Brain\u2019s flagship flow: turn explicit context into a durable markdown page you can keep building."
    });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Create Topic Page"
    }).addEventListener("click", () => {
      void this.plugin.createTopicPage();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Topic Page From Current Note"
    }).addEventListener("click", () => {
      void this.plugin.createTopicPageForScope("note");
    });
  }
  createCaptureAssistSection() {
    if (!this.plugin.settings.enableAIRouting) {
      return;
    }
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Capture Assist" });
    section.createEl("p", {
      text: "Use AI only to classify fresh capture into note, task, or journal."
    });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Auto-route Capture"
    }).addEventListener("click", () => {
      void this.autoRoute();
    });
  }
  createStatusSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Status" });
    const inboxRow = section.createEl("p", { text: "Inbox: loading..." });
    this.inboxCountEl = inboxRow;
    const taskRow = section.createEl("p", { text: "Tasks: loading..." });
    this.taskCountEl = taskRow;
    const reviewRow = section.createEl("div", { cls: "brain-status-row" });
    this.reviewHistoryEl = reviewRow.createEl("span", { text: "Review history: loading..." });
    reviewRow.createEl("button", {
      cls: "brain-button brain-button-small",
      text: "Open"
    }).addEventListener("click", () => {
      void this.plugin.openReviewHistory();
    });
    const aiRow = section.createEl("p", { text: "AI: loading..." });
    this.aiStatusEl = aiRow;
    const summaryRow = section.createEl("p", { text: "Last artifact: loading..." });
    this.summaryStatusEl = summaryRow;
  }
  createOutputSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Artifacts" });
    section.createEl("h4", { text: "Last Result" });
    this.resultEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No result yet."
    });
    section.createEl("h4", { text: "Last Artifact" });
    this.summaryEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No artifact generated yet."
    });
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
      console.error(error);
      new import_obsidian17.Notice("Could not auto-route capture");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy90ZXh0LnRzIiwgInNyYy91dGlscy9wYXRoLnRzIiwgInNyYy91dGlscy9kYXRlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9qb3VybmFsLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL25vdGUtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZS50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZS50cyIsICJzcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy9zdW1tYXJ5LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9jb250ZXh0LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvdmF1bHQtc2VydmljZS50cyIsICJzcmMvdmlld3MvcHJvbXB0LW1vZGFscy50cyIsICJzcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL2luYm94LXJldmlldy1tb2RhbC50cyIsICJzcmMvdXRpbHMvZXJyb3ItaGFuZGxlci50cyIsICJzcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWwudHMiLCAic3JjL3ZpZXdzL3Jldmlldy1oaXN0b3J5LW1vZGFsLnRzIiwgInNyYy92aWV3cy9zeW50aGVzaXMtcmVzdWx0LW1vZGFsLnRzIiwgInNyYy92aWV3cy90ZW1wbGF0ZS1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyIsICJzcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4sIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBCcmFpblBsdWdpblNldHRpbmdzLFxuICBub3JtYWxpemVCcmFpblNldHRpbmdzLFxufSBmcm9tIFwiLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJyYWluU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5ncy10YWJcIjtcbmltcG9ydCB7IENvbnRleHRTZXJ2aWNlLCBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgTm90ZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvbm90ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZVwiO1xuaW1wb3J0IHsgUXVlc3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2VcIjtcbmltcG9ydCB7IFN1bW1hcnlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N1bW1hcnktc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0LCBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUb3BpY1BhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgUHJvbXB0TW9kYWwsXG4gIFJlc3VsdE1vZGFsLFxufSBmcm9tIFwiLi9zcmMvdmlld3MvcHJvbXB0LW1vZGFsc1wiO1xuaW1wb3J0IHsgRmlsZUdyb3VwUGlja2VyTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlTW9kYWwsIFF1ZXN0aW9uU2NvcGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWxcIjtcbmltcG9ydCB7IFJldmlld0hpc3RvcnlNb2RhbCB9IGZyb20gXCIuL3NyYy92aWV3cy9yZXZpZXctaGlzdG9yeS1tb2RhbFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbFwiO1xuaW1wb3J0IHsgVGVtcGxhdGVQaWNrZXJNb2RhbCwgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQge1xuICBCUkFJTl9WSUVXX1RZUEUsXG4gIEJyYWluU2lkZWJhclZpZXcsXG59IGZyb20gXCIuL3NyYy92aWV3cy9zaWRlYmFyLXZpZXdcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4vc3JjL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN1bW1hcnlSZXN1bHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0U291cmNlTGluZXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi9zcmMvdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gXCIuL3NyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kc1wiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJhaW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIHZhdWx0U2VydmljZSE6IFZhdWx0U2VydmljZTtcbiAgaW5ib3hTZXJ2aWNlITogSW5ib3hTZXJ2aWNlO1xuICBub3RlU2VydmljZSE6IE5vdGVTZXJ2aWNlO1xuICB0YXNrU2VydmljZSE6IFRhc2tTZXJ2aWNlO1xuICBqb3VybmFsU2VydmljZSE6IEpvdXJuYWxTZXJ2aWNlO1xuICByZXZpZXdMb2dTZXJ2aWNlITogUmV2aWV3TG9nU2VydmljZTtcbiAgcmV2aWV3U2VydmljZSE6IFJldmlld1NlcnZpY2U7XG4gIHF1ZXN0aW9uU2VydmljZSE6IFF1ZXN0aW9uU2VydmljZTtcbiAgY29udGV4dFNlcnZpY2UhOiBDb250ZXh0U2VydmljZTtcbiAgc3ludGhlc2lzU2VydmljZSE6IFN5bnRoZXNpc1NlcnZpY2U7XG4gIHRvcGljUGFnZVNlcnZpY2UhOiBUb3BpY1BhZ2VTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgc3VtbWFyeVNlcnZpY2UhOiBTdW1tYXJ5U2VydmljZTtcbiAgcHJpdmF0ZSBzaWRlYmFyVmlldzogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxhc3RTdW1tYXJ5QXQ6IERhdGUgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMudmF1bHRTZXJ2aWNlID0gbmV3IFZhdWx0U2VydmljZSh0aGlzLmFwcCk7XG4gICAgdGhpcy5haVNlcnZpY2UgPSBuZXcgQnJhaW5BSVNlcnZpY2UoKTtcbiAgICB0aGlzLmluYm94U2VydmljZSA9IG5ldyBJbmJveFNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMubm90ZVNlcnZpY2UgPSBuZXcgTm90ZVNlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMudGFza1NlcnZpY2UgPSBuZXcgVGFza1NlcnZpY2UodGhpcy52YXVsdFNlcnZpY2UsICgpID0+IHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuam91cm5hbFNlcnZpY2UgPSBuZXcgSm91cm5hbFNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLmNvbnRleHRTZXJ2aWNlID0gbmV3IENvbnRleHRTZXJ2aWNlKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UgPSBuZXcgUmV2aWV3TG9nU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3U2VydmljZSA9IG5ldyBSZXZpZXdTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICB0aGlzLmluYm94U2VydmljZSxcbiAgICAgIHRoaXMudGFza1NlcnZpY2UsXG4gICAgICB0aGlzLmpvdXJuYWxTZXJ2aWNlLFxuICAgICAgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucXVlc3Rpb25TZXJ2aWNlID0gbmV3IFF1ZXN0aW9uU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3VtbWFyeVNlcnZpY2UgPSBuZXcgU3VtbWFyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuc3ludGhlc2lzU2VydmljZSA9IG5ldyBTeW50aGVzaXNTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlID0gbmV3IFRvcGljUGFnZVNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUtub3duRm9sZGVycyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVMYXN0QXJ0aWZhY3RUaW1lc3RhbXAoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRoZSBzaWRlYmFyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBCUkFJTl9WSUVXX1RZUEUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGhhc09wZW5TaWRlYmFyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSkubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFJlc3VsdCh0ZXh0KTtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RTdW1tYXJ5KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQobWVzc2FnZSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgfVxuXG4gIGdldExhc3RTdW1tYXJ5TGFiZWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sYXN0U3VtbWFyeUF0ID8gZm9ybWF0RGF0ZVRpbWVLZXkodGhpcy5sYXN0U3VtbWFyeUF0KSA6IFwiTm8gYXJ0aWZhY3QgeWV0XCI7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICF0aGlzLnNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgbmV3IE5vdGljZShcIkFJIHJvdXRpbmcgaXMgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5haVNlcnZpY2Uucm91dGVUZXh0KHRleHQsIHRoaXMuc2V0dGluZ3MpO1xuICAgIGlmIChyb3V0ZSkge1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBBdXRvLXJvdXRlZCBhcyAke3JvdXRlfWApO1xuICAgIH1cbiAgICByZXR1cm4gcm91dGU7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dEN1cnJlbnROb3RlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKSxcbiAgICAgIFwiU3VtbWFyaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICAgXCJzdW1tYXJpemVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0U2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZFRleHRDb250ZXh0KCksXG4gICAgICBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICAgIFwiZXh0cmFjdC10YXNrc1wiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFJlY2VudEZpbGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRSZWNlbnRGaWxlc0NvbnRleHQoKSxcbiAgICAgIFwiQ2xlYW4gTm90ZSBGcm9tIFJlY2VudCBGaWxlc1wiLFxuICAgICAgXCJyZXdyaXRlLWNsZWFuLW5vdGVcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Rm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgXCJEcmFmdCBCcmllZiBGcm9tIEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICBcImRyYWZ0LXByb2plY3QtYnJpZWZcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZU5vdGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzY29wZSA9IGF3YWl0IG5ldyBRdWVzdGlvblNjb3BlTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiU3ludGhlc2l6ZSBOb3Rlc1wiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyB0byBTeW50aGVzaXplXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcGxhdGUgPSBhd2FpdCB0aGlzLnBpY2tTeW50aGVzaXNUZW1wbGF0ZShcIlN5bnRoZXNpemUgTm90ZXNcIik7XG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoZXNlIG5vdGVzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoXCJub3RlXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwiZm9sZGVyXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFzayBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BpY1BhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZSgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoZGVmYXVsdFNjb3BlPzogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0b3BpYyA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJUb3BpYyBvciBxdWVzdGlvbiB0byB0dXJuIGludG8gYSB3aWtpIHBhZ2UuLi5cIixcbiAgICAgICAgc3VibWl0TGFiZWw6IFwiQ3JlYXRlXCIsXG4gICAgICAgIG11bHRpbGluZTogdHJ1ZSxcbiAgICAgIH0pLm9wZW5Qcm9tcHQoKTtcbiAgICAgIGlmICghdG9waWMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IGRlZmF1bHRTY29wZSA/PyBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgICB9KS5vcGVuUGlja2VyKCk7XG4gICAgICBpZiAoIXNjb3BlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICAgICAgc2NvcGUsXG4gICAgICAgIFwiU2VsZWN0IE5vdGVzIGZvciBUb3BpYyBQYWdlXCIsXG4gICAgICApO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy50b3BpY1BhZ2VTZXJ2aWNlLmNyZWF0ZVRvcGljUGFnZSh0b3BpYywgY29udGV4dCk7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgICAgcmVzdWx0Lm5vdGVUaXRsZSxcbiAgICAgICAgcmVzdWx0LmNvbnRlbnQsXG4gICAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aCxcbiAgICAgICAgY29udGV4dC5zb3VyY2VQYXRocyxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIHRvcGljIHBhZ2Ugc2F2ZWQgdG8gJHtzYXZlZC5wYXRofWBcbiAgICAgICAgICA6IGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgICBuZXcgTm90aWNlKGBUb3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gKTtcblxuICAgICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICAgIGlmIChsZWFmKSB7XG4gICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoc2F2ZWQpO1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjcmVhdGUgdGhhdCB0b3BpYyBwYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyhcbiAgICBsb29rYmFja0RheXM/OiBudW1iZXIsXG4gICAgbGFiZWw/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3VtbWFyeVNlcnZpY2UuZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cywgbGFiZWwpO1xuICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShgJHtyZXN1bHQudGl0bGV9XFxuXFxuJHtyZXN1bHQuY29udGVudH1gKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWAgOiBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCBsb2NhbGx5YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IE5vdGljZShcbiAgICAgIHJlc3VsdC5wZXJzaXN0ZWRQYXRoXG4gICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBzYXZlZCB0byAke3Jlc3VsdC5wZXJzaXN0ZWRQYXRofWBcbiAgICAgICAgOiByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYFxuICAgICAgICAgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBpZiAoIXRoaXMuaGFzT3BlblNpZGViYXIoKSkge1xuICAgICAgbmV3IFJlc3VsdE1vZGFsKHRoaXMuYXBwLCBgQnJhaW4gJHtyZXN1bHQudGl0bGV9YCwgcmVzdWx0LmNvbnRlbnQpLm9wZW4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTeW50aGVzaXNSZXN1bHQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICB0aGlzLmJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgcmV0dXJuIGBTYXZlZCBhcnRpZmFjdCB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkaXRpb24gPSB0aGlzLmJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KHJlc3VsdCwgY29udGV4dCk7XG4gICAgY29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG4gICAgY29uc3QgbGFzdExpbmUgPSBlZGl0b3IubGFzdExpbmUoKTtcbiAgICBjb25zdCBsYXN0TGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsYXN0TGluZSk7XG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSB7IGxpbmU6IGxhc3RMaW5lLCBjaDogbGFzdExpbmVUZXh0Lmxlbmd0aCB9O1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IHRoaXMuZ2V0QXBwZW5kU2VwYXJhdG9yKGVkaXRvci5nZXRWYWx1ZSgpKTtcbiAgICBlZGl0b3IucmVwbGFjZVJhbmdlKGAke3NlcGFyYXRvcn0ke2FkZGl0aW9ufVxcbmAsIGVuZFBvc2l0aW9uKTtcbiAgICByZXR1cm4gYEluc2VydGVkIHN5bnRoZXNpcyBpbnRvICR7dmlldy5maWxlLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVGcm9tTW9kYWwoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBzdWJtaXRMYWJlbDogc3RyaW5nLFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIG11bHRpbGluZSA9IGZhbHNlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgdGl0bGUsXG4gICAgICBwbGFjZWhvbGRlcjogbXVsdGlsaW5lXG4gICAgICAgID8gXCJXcml0ZSB5b3VyIGVudHJ5IGhlcmUuLi5cIlxuICAgICAgICA6IFwiVHlwZSBoZXJlLi4uXCIsXG4gICAgICBzdWJtaXRMYWJlbCxcbiAgICAgIG11bHRpbGluZSxcbiAgICB9KS5vcGVuUHJvbXB0KCk7XG5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHZhbHVlKTtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJCcmFpbiBjb3VsZCBub3Qgc2F2ZSB0aGF0IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVOb3RlKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgcmV0dXJuIGBDYXB0dXJlZCBub3RlIGluICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZVRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlSm91cm5hbCh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzSW5ib3goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5nZXRSZWNlbnRJbmJveEVudHJpZXMoKTtcbiAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBuZXcgSW5ib3hSZXZpZXdNb2RhbCh0aGlzLmFwcCwgZW50cmllcywgdGhpcy5yZXZpZXdTZXJ2aWNlLCBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgfSkub3BlbigpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgTG9hZGVkICR7ZW50cmllcy5sZW5ndGh9IGluYm94IGVudHJpZXNgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICB9XG5cbiAgYXN5bmMgb3BlblJldmlld0hpc3RvcnkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyaWVzKCk7XG4gICAgbmV3IFJldmlld0hpc3RvcnlNb2RhbCh0aGlzLmFwcCwgZW50cmllcywgdGhpcykub3BlbigpO1xuICB9XG5cbiAgYXN5bmMgYWRkVGFza0Zyb21TZWxlY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gdGhpcy5nZXRBY3RpdmVTZWxlY3Rpb25UZXh0KCk7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2soc2VsZWN0aW9uKTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgU2F2ZWQgdGFzayBmcm9tIHNlbGVjdGlvbiB0byAke3NhdmVkLnBhdGh9YDtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBOb3RpY2UoXCJObyBzZWxlY3Rpb24gZm91bmQuIE9wZW5pbmcgdGFzayBlbnRyeSBtb2RhbC5cIik7XG4gICAgYXdhaXQgdGhpcy5jYXB0dXJlRnJvbU1vZGFsKFwiQWRkIFRhc2tcIiwgXCJTYXZlIHRhc2tcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgb3BlblRvZGF5c0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuZW5zdXJlSm91cm5hbEZpbGUoKTtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRvZGF5J3Mgam91cm5hbFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgT3BlbmVkICR7ZmlsZS5wYXRofWA7XG4gICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBnZXRJbmJveENvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLmdldFVucmV2aWV3ZWRDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmdldE9wZW5UYXNrQ291bnQoKTtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0hpc3RvcnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cnlDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuUmV2aWV3RW50cnkoZW50cnk6IHtcbiAgICBoZWFkaW5nOiBzdHJpbmc7XG4gICAgcHJldmlldzogc3RyaW5nO1xuICAgIHNpZ25hdHVyZTogc3RyaW5nO1xuICAgIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5yZW9wZW5Gcm9tUmV2aWV3TG9nKHtcbiAgICAgIGFjdGlvbjogXCJyZW9wZW5cIixcbiAgICAgIHRpbWVzdGFtcDogXCJcIixcbiAgICAgIHNvdXJjZVBhdGg6IFwiXCIsXG4gICAgICBmaWxlTXRpbWU6IERhdGUubm93KCksXG4gICAgICBlbnRyeUluZGV4OiAwLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0QWlTdGF0dXNUZXh0KCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzICYmICF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIFwiQUkgb2ZmXCI7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgKHRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgfHwgdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpICYmXG4gICAgICAoIXRoaXMuc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJBSSBlbmFibGVkIGJ1dCBtaXNzaW5nIGtleVwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIkFJIGNvbmZpZ3VyZWRcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrQnJhaW5Gb3JDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgICBkZWZhdWx0VGVtcGxhdGU/OiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBkZWZhdWx0VGVtcGxhdGUgPz8gKGF3YWl0IHRoaXMucGlja1N5bnRoZXNpc1RlbXBsYXRlKG1vZGFsVGl0bGUpKTtcbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1blN5bnRoZXNpc0Zsb3coY29udGV4dCwgdGVtcGxhdGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHN5bnRoZXNpemUgdGhhdCBjb250ZXh0XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25Gb3JTY29wZShzY29wZTogUXVlc3Rpb25TY29wZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgTm90ZVwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZm9sZGVyXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCksXG4gICAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEVudGlyZSBWYXVsdFwiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIFwiZ3JvdXBcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkFib3V0U2VsZWN0ZWRHcm91cCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgIHNjb3BlOiBRdWVzdGlvblNjb3BlLFxuICAgIGdyb3VwUGlja2VyVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0IHwgbnVsbD4ge1xuICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgIGNhc2UgXCJub3RlXCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpO1xuICAgICAgY2FzZSBcInZhdWx0XCI6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFZhdWx0Q29udGV4dCgpO1xuICAgICAgY2FzZSBcImdyb3VwXCI6IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXMoZ3JvdXBQaWNrZXJUaXRsZSk7XG4gICAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKFwiU2VsZWN0IE5vdGVzXCIpO1xuICAgICAgaWYgKCFmaWxlcyB8fCAhZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldFNlbGVjdGVkRmlsZXNDb250ZXh0KGZpbGVzKSxcbiAgICAgICAgXCJBc2sgUXVlc3Rpb24gQWJvdXQgU2VsZWN0ZWQgTm90ZXNcIixcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3Qgc2VsZWN0IG5vdGVzIGZvciBCcmFpblwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXModGl0bGU6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0XG4gICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhdGhpcy5pc0JyYWluR2VuZXJhdGVkRmlsZShmaWxlLnBhdGgpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcblxuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbWFya2Rvd24gZmlsZXMgZm91bmRcIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgbmV3IEZpbGVHcm91cFBpY2tlck1vZGFsKHRoaXMuYXBwLCBmaWxlcywge1xuICAgICAgdGl0bGUsXG4gICAgfSkub3BlblBpY2tlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IG1vZGFsVGl0bGUsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhIHF1ZXN0aW9uIGFib3V0IHRoaXMgY29udGV4dC4uLlwiLFxuICAgICAgICBzdWJtaXRMYWJlbDogXCJBc2tcIixcbiAgICAgICAgbXVsdGlsaW5lOiB0cnVlLFxuICAgICAgfSkub3BlblByb21wdCgpO1xuICAgICAgaWYgKCFxdWVzdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlc3Rpb25TZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0KTtcbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIGFuc3dlciBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXG4gICAgICAgICAgOiBgTG9jYWwgYW5zd2VyIGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWAsXG4gICAgICApO1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBjb250ZXh0LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGNhbkluc2VydDogdGhpcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uU2F2ZTogYXN5bmMgKCkgPT4gdGhpcy5zYXZlU3ludGhlc2lzUmVzdWx0KHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uQWN0aW9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW5TeW50aGVzaXNGbG93KGNvbnRleHQsIFwic3VtbWFyaXplXCIpO1xuICAgICAgICB9LFxuICAgICAgfSkub3BlbigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFuc3dlciB0aGF0IHF1ZXN0aW9uXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuU3ludGhlc2lzRmxvdyhcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zeW50aGVzaXNTZXJ2aWNlLnJ1bih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJXG4gICAgICAgID8gYEFJICR7cmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCl9IGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBcbiAgICAgICAgOiBgTG9jYWwgJHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX0gZnJvbSAke2NvbnRleHQuc291cmNlTGFiZWx9YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IFN5bnRoZXNpc1Jlc3VsdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICBjb250ZXh0LFxuICAgICAgcmVzdWx0LFxuICAgICAgY2FuSW5zZXJ0OiB0aGlzLmhhc0FjdGl2ZU1hcmtkb3duTm90ZSgpLFxuICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICBvblNhdmU6IGFzeW5jICgpID0+IHRoaXMuc2F2ZVN5bnRoZXNpc1Jlc3VsdChyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgb25BY3Rpb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICB9LFxuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGlja1N5bnRoZXNpc1RlbXBsYXRlKFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBUZW1wbGF0ZVBpY2tlck1vZGFsKHRoaXMuYXBwLCB7IHRpdGxlIH0pLm9wZW5QaWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRTeW50aGVzaXNOb3RlQ29udGVudChcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBbXG4gICAgICBgQWN0aW9uOiAke3Jlc3VsdC5hY3Rpb259YCxcbiAgICAgIGBHZW5lcmF0ZWQ6ICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9YCxcbiAgICAgIGBDb250ZXh0IGxlbmd0aDogJHtjb250ZXh0Lm9yaWdpbmFsTGVuZ3RofSBjaGFyYWN0ZXJzLmAsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5zdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRJbnNlcnRlZFN5bnRoZXNpc0NvbnRlbnQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW1xuICAgICAgYCMjIEJyYWluICR7cmVzdWx0LnRpdGxlfWAsXG4gICAgICAuLi50aGlzLmJ1aWxkQ29udGV4dEJ1bGxldExpbmVzKGNvbnRleHQpLFxuICAgICAgYC0gR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5zdHJpcExlYWRpbmdUaXRsZShyZXN1bHQuY29udGVudCksXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNBY3RpdmVNYXJrZG93bk5vdGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KT8uZmlsZSk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIGZvcm1hdENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0KTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0QnVsbGV0TGluZXMoY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBzb3VyY2VMaW5lcyA9IHRoaXMuYnVpbGRDb250ZXh0U291cmNlTGluZXMoY29udGV4dCk7XG4gICAgcmV0dXJuIHNvdXJjZUxpbmVzLm1hcCgobGluZSkgPT4gYC0gJHtsaW5lfWApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplTGFzdEFydGlmYWN0VGltZXN0YW1wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgICBsZXQgbGF0ZXN0ID0gMDtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICBpZiAoIXRoaXMuaXNBcnRpZmFjdEZpbGUoZmlsZS5wYXRoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlLnN0YXQubXRpbWUgPiBsYXRlc3QpIHtcbiAgICAgICAgICBsYXRlc3QgPSBmaWxlLnN0YXQubXRpbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IGxhdGVzdCA+IDAgPyBuZXcgRGF0ZShsYXRlc3QpIDogbnVsbDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIGxhc3QgYXJ0aWZhY3QgdGltZXN0YW1wXCIpO1xuICAgICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzQXJ0aWZhY3RGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Mubm90ZXNGb2xkZXIpIHx8XG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGlzQnJhaW5HZW5lcmF0ZWRGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSB8fFxuICAgICAgaXNVbmRlckZvbGRlcihwYXRoLCB0aGlzLnNldHRpbmdzLnJldmlld3NGb2xkZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBwZW5kU2VwYXJhdG9yKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXFxuXCIpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRleHQuZW5kc1dpdGgoXCJcXG5cIikpIHtcbiAgICAgIHJldHVybiBcIlxcblwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJcXG5cXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgc3RyaXBMZWFkaW5nVGl0bGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuICAgIGlmICghbGluZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBpZiAoIS9eI1xccysvLnRlc3QobGluZXNbMF0pKSB7XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtYWluaW5nID0gbGluZXMuc2xpY2UoMSk7XG4gICAgd2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwICYmICFyZW1haW5pbmdbMF0udHJpbSgpKSB7XG4gICAgICByZW1haW5pbmcuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlbWFpbmluZy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IG51bWJlcjtcbiAgc3VtbWFyeU1heENoYXJzOiBudW1iZXI7XG5cbiAgcGVyc2lzdFN1bW1hcmllczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQlJBSU5fU0VUVElOR1M6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gIGluYm94RmlsZTogXCJCcmFpbi9pbmJveC5tZFwiLFxuICB0YXNrc0ZpbGU6IFwiQnJhaW4vdGFza3MubWRcIixcbiAgam91cm5hbEZvbGRlcjogXCJCcmFpbi9qb3VybmFsXCIsXG4gIG5vdGVzRm9sZGVyOiBcIkJyYWluL25vdGVzXCIsXG4gIHN1bW1hcmllc0ZvbGRlcjogXCJCcmFpbi9zdW1tYXJpZXNcIixcbiAgcmV2aWV3c0ZvbGRlcjogXCJCcmFpbi9yZXZpZXdzXCIsXG4gIGVuYWJsZUFJU3VtbWFyaWVzOiBmYWxzZSxcbiAgZW5hYmxlQUlSb3V0aW5nOiBmYWxzZSxcbiAgb3BlbkFJQXBpS2V5OiBcIlwiLFxuICBvcGVuQUlNb2RlbDogXCJncHQtNC4xLW1pbmlcIixcbiAgc3VtbWFyeUxvb2tiYWNrRGF5czogNyxcbiAgc3VtbWFyeU1heENoYXJzOiAxMjAwMCxcbiAgcGVyc2lzdFN1bW1hcmllczogdHJ1ZSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmFpblNldHRpbmdzKFxuICBpbnB1dDogUGFydGlhbDxCcmFpblBsdWdpblNldHRpbmdzPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIGNvbnN0IG1lcmdlZDogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgICAuLi5ERUZBVUxUX0JSQUlOX1NFVFRJTkdTLFxuICAgIC4uLmlucHV0LFxuICB9IGFzIEJyYWluUGx1Z2luU2V0dGluZ3M7XG5cbiAgcmV0dXJuIHtcbiAgICBpbmJveEZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChtZXJnZWQuaW5ib3hGaWxlLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmluYm94RmlsZSksXG4gICAgdGFza3NGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgobWVyZ2VkLnRhc2tzRmlsZSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy50YXNrc0ZpbGUpLFxuICAgIGpvdXJuYWxGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5qb3VybmFsRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5qb3VybmFsRm9sZGVyLFxuICAgICksXG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBzdW1tYXJpZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5zdW1tYXJpZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcmllc0ZvbGRlcixcbiAgICApLFxuICAgIHJldmlld3NGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5yZXZpZXdzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5yZXZpZXdzRm9sZGVyLFxuICAgICksXG4gICAgZW5hYmxlQUlTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLmVuYWJsZUFJU3VtbWFyaWVzKSxcbiAgICBlbmFibGVBSVJvdXRpbmc6IEJvb2xlYW4obWVyZ2VkLmVuYWJsZUFJUm91dGluZyksXG4gICAgb3BlbkFJQXBpS2V5OiB0eXBlb2YgbWVyZ2VkLm9wZW5BSUFwaUtleSA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5vcGVuQUlBcGlLZXkudHJpbSgpIDogXCJcIixcbiAgICBvcGVuQUlNb2RlbDpcbiAgICAgIHR5cGVvZiBtZXJnZWQub3BlbkFJTW9kZWwgPT09IFwic3RyaW5nXCIgJiYgbWVyZ2VkLm9wZW5BSU1vZGVsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5vcGVuQUlNb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm9wZW5BSU1vZGVsLFxuICAgIHN1bW1hcnlMb29rYmFja0RheXM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeUxvb2tiYWNrRGF5cywgMSwgMzY1LCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgIHN1bW1hcnlNYXhDaGFyczogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TWF4Q2hhcnMsIDEwMDAsIDEwMDAwMCwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgIHBlcnNpc3RTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLnBlcnNpc3RTdW1tYXJpZXMpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGl2ZVBhdGgodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBjbGFtcEludGVnZXIoXG4gIHZhbHVlOiB1bmtub3duLFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXIsXG4gIGZhbGxiYWNrOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBwYXJzZWQpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogQnJhaW5QbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpbiBTZXR0aW5nc1wiIH0pO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3RvcmFnZVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluYm94IGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB1c2VkIGZvciBxdWljayBub3RlIGNhcHR1cmUuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmJveEZpbGUsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmJveEZpbGUgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkluYm94IGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJUYXNrcyBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgdGFzayBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJUYXNrcyBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSm91cm5hbCBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIGNvbnRhaW5pbmcgZGFpbHkgam91cm5hbCBmaWxlcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmpvdXJuYWxGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJKb3VybmFsIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcHJvbW90ZWQgbm90ZXMgYW5kIGdlbmVyYXRlZCBtYXJrZG93biBhcnRpZmFjdHMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJOb3RlcyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTdW1tYXJpZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIGZvciBwZXJzaXN0ZWQgc3VtbWFyaWVzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJTdW1tYXJpZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmV2aWV3cyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgdG8gc3RvcmUgaW5ib3ggcmV2aWV3IGxvZ3MuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXZpZXdzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV2aWV3c0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiUmV2aWV3cyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFJXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHN5bnRoZXNpc1wiKVxuICAgICAgLnNldERlc2MoXCJVc2UgT3BlbkFJIGZvciBzeW50aGVzaXMsIHF1ZXN0aW9uIGFuc3dlcmluZywgYW5kIHRvcGljIHBhZ2VzIHdoZW4gY29uZmlndXJlZC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHJvdXRpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiQWxsb3cgdGhlIHNpZGViYXIgdG8gYXV0by1yb3V0ZSBjYXB0dXJlcyB3aXRoIEFJLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk9wZW5BSSBBUEkga2V5XCIpXG4gICAgICAuc2V0RGVzYyhcIlN0b3JlZCBsb2NhbGx5IGluIHBsdWdpbiBzZXR0aW5ncy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwic2stLi4uXCIpO1xuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgIXZhbHVlLnN0YXJ0c1dpdGgoXCJzay1cIikpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIk9wZW5BSSBBUEkga2V5IHNob3VsZCBzdGFydCB3aXRoICdzay0nXCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiT3BlbkFJIG1vZGVsXCIpXG4gICAgICAuc2V0RGVzYyhcIk1vZGVsIG5hbWUgdXNlZCBmb3Igc3ludGhlc2lzLCBxdWVzdGlvbnMsIHRvcGljIHBhZ2VzLCBhbmQgcm91dGluZyByZXF1ZXN0cy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSU1vZGVsLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmICF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIk9wZW5BSSBtb2RlbCBuYW1lIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJDb250ZXh0IENvbGxlY3Rpb25cIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJMb29rYmFjayBkYXlzXCIpXG4gICAgICAuc2V0RGVzYyhcIkhvdyBmYXIgYmFjayB0byBzY2FuIHdoZW4gYnVpbGRpbmcgcmVjZW50LWNvbnRleHQgc3VtbWFyaWVzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzID1cbiAgICAgICAgICAgICAgTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMCA/IHBhcnNlZCA6IDc7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTWF4aW11bSBjaGFyYWN0ZXJzXCIpXG4gICAgICAuc2V0RGVzYyhcIk1heGltdW0gdGV4dCBjb2xsZWN0ZWQgYmVmb3JlIHN5bnRoZXNpcyBvciBzdW1tYXJ5LlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyksXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+PSAxMDAwID8gcGFyc2VkIDogMTIwMDA7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdW1tYXJ5IE91dHB1dFwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlBlcnNpc3Qgc3VtbWFyaWVzXCIpXG4gICAgICAuc2V0RGVzYyhcIldyaXRlIGdlbmVyYXRlZCBzdW1tYXJpZXMgaW50byB0aGUgdmF1bHQuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYmluZFRleHRTZXR0aW5nKFxuICAgIHRleHQ6IFRleHRDb21wb25lbnQsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgICBvblZhbHVlQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiBUZXh0Q29tcG9uZW50IHtcbiAgICBsZXQgY3VycmVudFZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGxhc3RTYXZlZFZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGlzU2F2aW5nID0gZmFsc2U7XG5cbiAgICB0ZXh0LnNldFZhbHVlKHZhbHVlKS5vbkNoYW5nZSgobmV4dFZhbHVlKSA9PiB7XG4gICAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKG5leHRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY3VycmVudFZhbHVlID0gbmV4dFZhbHVlO1xuICAgICAgb25WYWx1ZUNoYW5nZShuZXh0VmFsdWUpO1xuICAgIH0pO1xuICAgIHRoaXMucXVldWVTYXZlT25CbHVyKFxuICAgICAgdGV4dC5pbnB1dEVsLFxuICAgICAgKCkgPT4gY3VycmVudFZhbHVlLFxuICAgICAgKCkgPT4gbGFzdFNhdmVkVmFsdWUsXG4gICAgICAoc2F2ZWRWYWx1ZSkgPT4ge1xuICAgICAgICBsYXN0U2F2ZWRWYWx1ZSA9IHNhdmVkVmFsdWU7XG4gICAgICB9LFxuICAgICAgKCkgPT4gaXNTYXZpbmcsXG4gICAgICAoc2F2aW5nKSA9PiB7XG4gICAgICAgIGlzU2F2aW5nID0gc2F2aW5nO1xuICAgICAgfSxcbiAgICAgIHZhbGlkYXRlLFxuICAgICk7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlU2F2ZU9uQmx1cihcbiAgICBpbnB1dDogSFRNTElucHV0RWxlbWVudCxcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogdm9pZCB7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVPbkJsdXIoXG4gICAgICAgIGdldEN1cnJlbnRWYWx1ZSxcbiAgICAgICAgZ2V0TGFzdFNhdmVkVmFsdWUsXG4gICAgICAgIHNldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBpc1NhdmluZyxcbiAgICAgICAgc2V0U2F2aW5nLFxuICAgICAgICB2YWxpZGF0ZSxcbiAgICAgICk7XG4gICAgfSk7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmXG4gICAgICAgICFldmVudC5tZXRhS2V5ICYmXG4gICAgICAgICFldmVudC5jdHJsS2V5ICYmXG4gICAgICAgICFldmVudC5hbHRLZXkgJiZcbiAgICAgICAgIWV2ZW50LnNoaWZ0S2V5XG4gICAgICApIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlT25CbHVyKFxuICAgIGdldEN1cnJlbnRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIGdldExhc3RTYXZlZFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgc2V0TGFzdFNhdmVkVmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIGlzU2F2aW5nOiAoKSA9PiBib29sZWFuLFxuICAgIHNldFNhdmluZzogKHNhdmluZzogYm9vbGVhbikgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoaXNTYXZpbmcoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGdldEN1cnJlbnRWYWx1ZSgpO1xuICAgIGlmIChjdXJyZW50VmFsdWUgPT09IGdldExhc3RTYXZlZFZhbHVlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRTYXZpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgc2V0TGFzdFNhdmVkVmFsdWUoY3VycmVudFZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2F2aW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGhlc2lzQ29udGV4dCB7XG4gIHNvdXJjZUxhYmVsOiBzdHJpbmc7XG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGw7XG4gIHNvdXJjZVBhdGhzPzogc3RyaW5nW107XG4gIHRleHQ6IHN0cmluZztcbiAgb3JpZ2luYWxMZW5ndGg6IG51bWJlcjtcbiAgdHJ1bmNhdGVkOiBib29sZWFuO1xuICBtYXhDaGFyczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgQ29udGV4dFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0Q3VycmVudE5vdGVDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IHZpZXcuZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBub3RlIGlzIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChcIkN1cnJlbnQgbm90ZVwiLCB2aWV3LmZpbGUucGF0aCwgdGV4dCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZFRleHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IHZpZXcuZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlbGVjdCBzb21lIHRleHQgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KFwiU2VsZWN0ZWQgdGV4dFwiLCB2aWV3LmZpbGUucGF0aCwgdGV4dCk7XG4gIH1cblxuICBhc3luYyBnZXRSZWNlbnRGaWxlc0NvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdFJlY2VudE1hcmtkb3duRmlsZXMoc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiUmVjZW50IGZpbGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IHZpZXcuZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdEZpbGVzSW5Gb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiQ3VycmVudCBmb2xkZXJcIiwgZmlsZXMsIGZvbGRlclBhdGggfHwgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlczogVEZpbGVbXSk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG1hcmtkb3duIG5vdGVcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiU2VsZWN0ZWQgbm90ZXNcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VmF1bHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0VmF1bHRNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiRW50aXJlIHZhdWx0XCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0KFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgc291cmNlUGF0aHM/OiBzdHJpbmdbXSxcbiAgKTogU3ludGhlc2lzQ29udGV4dCB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBtYXhDaGFycyA9IE1hdGgubWF4KDEwMDAsIHNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyk7XG4gICAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICAgIGNvbnN0IG9yaWdpbmFsTGVuZ3RoID0gdHJpbW1lZC5sZW5ndGg7XG4gICAgY29uc3QgdHJ1bmNhdGVkID0gb3JpZ2luYWxMZW5ndGggPiBtYXhDaGFycztcbiAgICBjb25zdCBsaW1pdGVkID0gdHJ1bmNhdGVkID8gdHJpbW1lZC5zbGljZSgwLCBtYXhDaGFycykudHJpbUVuZCgpIDogdHJpbW1lZDtcblxuICAgIHJldHVybiB7XG4gICAgICBzb3VyY2VMYWJlbCxcbiAgICAgIHNvdXJjZVBhdGgsXG4gICAgICBzb3VyY2VQYXRocyxcbiAgICAgIHRleHQ6IGxpbWl0ZWQsXG4gICAgICBvcmlnaW5hbExlbmd0aCxcbiAgICAgIHRydW5jYXRlZCxcbiAgICAgIG1heENoYXJzLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGJ1aWxkRmlsZUdyb3VwQ29udGV4dChcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIGZpbGVzOiBURmlsZVtdLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG1hcmtkb3duIGZpbGVzIGZvdW5kIGZvciAke3NvdXJjZUxhYmVsLnRvTG93ZXJDYXNlKCl9YCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbWFya2Rvd24gZmlsZXMgZm91bmQgZm9yICR7c291cmNlTGFiZWwudG9Mb3dlckNhc2UoKX1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoc291cmNlTGFiZWwsIHNvdXJjZVBhdGgsIHRleHQsIGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5wYXRoKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RSZWNlbnRNYXJrZG93bkZpbGVzKGxvb2tiYWNrRGF5czogbnVtYmVyKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzKS5nZXRUaW1lKCk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IGN1dG9mZilcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RWYXVsdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdEZpbGVzSW5Gb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT5cbiAgICAgICAgZm9sZGVyUGF0aCA/IGlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBmb2xkZXJQYXRoKSA6ICFmaWxlLnBhdGguaW5jbHVkZXMoXCIvXCIpLFxuICAgICAgKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXM6IG51bWJlcik6IERhdGUge1xuICBjb25zdCBzYWZlRGF5cyA9IE1hdGgubWF4KDEsIGxvb2tiYWNrRGF5cyk7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgc3RhcnQuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gIHN0YXJ0LnNldERhdGUoc3RhcnQuZ2V0RGF0ZSgpIC0gKHNhZmVEYXlzIC0gMSkpO1xuICByZXR1cm4gc3RhcnQ7XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgZmlsZXM6IFRGaWxlW10sXG4gIG1heENoYXJzOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICAgICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBibG9jayA9IFtgLS0tICR7ZmlsZS5wYXRofWAsIHRyaW1tZWRdLmpvaW4oXCJcXG5cIik7XG4gICAgICBpZiAodG90YWwgKyBibG9jay5sZW5ndGggPiBtYXhDaGFycykge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSBNYXRoLm1heCgwLCBtYXhDaGFycyAtIHRvdGFsKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA+IDApIHtcbiAgICAgICAgICBwYXJ0cy5wdXNoKGJsb2NrLnNsaWNlKDAsIHJlbWFpbmluZykpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGJsb2NrKTtcbiAgICAgIHRvdGFsICs9IGJsb2NrLmxlbmd0aDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG59XG4iLCAiLyoqXG4gKiBQYXRoIHV0aWxpdHkgZnVuY3Rpb25zXG4gKi9cblxuLyoqXG4gKiBDaGVjayBpZiBhIHBhdGggaXMgdW5kZXIgYSBzcGVjaWZpYyBmb2xkZXIgKG9yIGlzIHRoZSBmb2xkZXIgaXRzZWxmKS5cbiAqIEhhbmRsZXMgdHJhaWxpbmcgc2xhc2hlcyBjb25zaXN0ZW50bHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1VuZGVyRm9sZGVyKHBhdGg6IHN0cmluZywgZm9sZGVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9ybWFsaXplZEZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gcGF0aCA9PT0gbm9ybWFsaXplZEZvbGRlciB8fCBwYXRoLnN0YXJ0c1dpdGgoYCR7bm9ybWFsaXplZEZvbGRlcn0vYCk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERhdGVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7ZGF0ZS5nZXRGdWxsWWVhcigpfS0ke3BhZDIoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkMihkYXRlLmdldERhdGUoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7cGFkMihkYXRlLmdldEhvdXJzKCkpfToke3BhZDIoZGF0ZS5nZXRNaW51dGVzKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlVGltZUtleShkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtmb3JtYXREYXRlS2V5KGRhdGUpfSAke2Zvcm1hdFRpbWVLZXkoZGF0ZSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0tJHtwYWQyKGRhdGUuZ2V0SG91cnMoKSl9JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlSm91cm5hbFRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnJlcGxhY2UoL1xccyskL2csIFwiXCIpKVxuICAgIC5qb2luKFwiXFxuXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyaW1UcmFpbGluZ05ld2xpbmVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xcbiskL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBwYWQyKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlKS5wYWRTdGFydCgyLCBcIjBcIik7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluYm94VmF1bHRTZXJ2aWNlIHtcbiAgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT47XG4gIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dW5rbm93bj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5ib3hFbnRyeSB7XG4gIGhlYWRpbmc6IHN0cmluZztcbiAgYm9keTogc3RyaW5nO1xuICByYXc6IHN0cmluZztcbiAgcHJldmlldzogc3RyaW5nO1xuICBpbmRleDogbnVtYmVyO1xuICBzaWduYXR1cmU6IHN0cmluZztcbiAgc2lnbmF0dXJlSW5kZXg6IG51bWJlcjtcbiAgc3RhcnRMaW5lOiBudW1iZXI7XG4gIGVuZExpbmU6IG51bWJlcjtcbiAgcmV2aWV3ZWQ6IGJvb2xlYW47XG4gIHJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgSW5ib3hFbnRyeUlkZW50aXR5ID0gUGljazxcbiAgSW5ib3hFbnRyeSxcbiAgXCJoZWFkaW5nXCIgfCBcImJvZHlcIiB8IFwicHJldmlld1wiIHwgXCJzaWduYXR1cmVcIiB8IFwic2lnbmF0dXJlSW5kZXhcIlxuPiAmXG4gIFBhcnRpYWw8UGljazxJbmJveEVudHJ5LCBcInJhd1wiIHwgXCJzdGFydExpbmVcIiB8IFwiZW5kTGluZVwiPj47XG5cbmV4cG9ydCBjbGFzcyBJbmJveFNlcnZpY2Uge1xuICBwcml2YXRlIHVucmV2aWV3ZWRDb3VudENhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IEluYm94VmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEVudHJpZXMobGltaXQgPSAyMCwgaW5jbHVkZVJldmlld2VkID0gZmFsc2UpOiBQcm9taXNlPEluYm94RW50cnlbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgZW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGZpbHRlcmVkID0gaW5jbHVkZVJldmlld2VkID8gZW50cmllcyA6IGVudHJpZXMuZmlsdGVyKChlbnRyeSkgPT4gIWVudHJ5LnJldmlld2VkKTtcbiAgICByZXR1cm4gZmlsdGVyZWQuc2xpY2UoLWxpbWl0KS5yZXZlcnNlKCk7XG4gIH1cblxuICBhc3luYyBnZXRVbnJldmlld2VkQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHsgdGV4dCwgbXRpbWUsIGV4aXN0cyB9ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHRXaXRoTXRpbWUoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBpZiAoIWV4aXN0cykge1xuICAgICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGNvdW50OiAwLFxuICAgICAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlICYmIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUubXRpbWUgPT09IG10aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy51bnJldmlld2VkQ291bnRDYWNoZS5jb3VudDtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IHBhcnNlSW5ib3hFbnRyaWVzKHRleHQpLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5yZXZpZXdlZCkubGVuZ3RoO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSB7XG4gICAgICBtdGltZSxcbiAgICAgIGNvdW50LFxuICAgIH07XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cbiAgYXN5bmMgbWFya0VudHJ5UmV2aWV3ZWQoZW50cnk6IEluYm94RW50cnlJZGVudGl0eSwgYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgY3VycmVudEVudHJ5ID1cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmUgPT09IGVudHJ5LnNpZ25hdHVyZSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmVJbmRleCA9PT0gZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgICApID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKChjYW5kaWRhdGUpID0+ICFjYW5kaWRhdGUucmV2aWV3ZWQgJiYgY2FuZGlkYXRlLnJhdyA9PT0gZW50cnkucmF3KSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuYm9keSA9PT0gZW50cnkuYm9keSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5wcmV2aWV3ID09PSBlbnRyeS5wcmV2aWV3LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc3RhcnRMaW5lID09PSBlbnRyeS5zdGFydExpbmUsXG4gICAgICApO1xuXG4gICAgaWYgKCFjdXJyZW50RW50cnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkID0gaW5zZXJ0UmV2aWV3TWFya2VyKGNvbnRlbnQsIGN1cnJlbnRFbnRyeSwgYWN0aW9uKTtcbiAgICBpZiAodXBkYXRlZCA9PT0gY29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IEluYm94RW50cnlJZGVudGl0eSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgY3VycmVudEVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBjdXJyZW50RW50cnkgPVxuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICBjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgZmluZFVuaXF1ZVJldmlld2VkU2lnbmF0dXJlTWF0Y2goY3VycmVudEVudHJpZXMsIGVudHJ5LnNpZ25hdHVyZSkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuYm9keSA9PT0gZW50cnkuYm9keSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5wcmV2aWV3ID09PSBlbnRyeS5wcmV2aWV3LFxuICAgICAgKTtcblxuICAgIGlmICghY3VycmVudEVudHJ5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IHJlbW92ZVJldmlld01hcmtlcihjb250ZW50LCBjdXJyZW50RW50cnkpO1xuICAgIGlmICh1cGRhdGVkID09PSBjb250ZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHNldHRpbmdzLmluYm94RmlsZSwgdXBkYXRlZCk7XG4gICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQ6IHN0cmluZyk6IEluYm94RW50cnlbXSB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgZW50cmllczogSW5ib3hFbnRyeVtdID0gW107XG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gIGxldCBjdXJyZW50Qm9keUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgY3VycmVudFN0YXJ0TGluZSA9IC0xO1xuICBsZXQgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gIGxldCBjdXJyZW50UmV2aWV3QWN0aW9uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZEF0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3Qgc2lnbmF0dXJlQ291bnRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBjb25zdCBwdXNoRW50cnkgPSAoZW5kTGluZTogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgaWYgKCFjdXJyZW50SGVhZGluZykge1xuICAgICAgY3VycmVudEJvZHlMaW5lcyA9IFtdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJvZHkgPSBjdXJyZW50Qm9keUxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xuICAgIGNvbnN0IHByZXZpZXcgPSBidWlsZFByZXZpZXcoYm9keSk7XG4gICAgY29uc3QgcmF3ID0gW2N1cnJlbnRIZWFkaW5nLCAuLi5jdXJyZW50Qm9keUxpbmVzXS5qb2luKFwiXFxuXCIpLnRyaW1FbmQoKTtcbiAgICBjb25zdCBzaWduYXR1cmUgPSBidWlsZEVudHJ5U2lnbmF0dXJlKGN1cnJlbnRIZWFkaW5nLCBjdXJyZW50Qm9keUxpbmVzKTtcbiAgICBjb25zdCBzaWduYXR1cmVJbmRleCA9IHNpZ25hdHVyZUNvdW50cy5nZXQoc2lnbmF0dXJlKSA/PyAwO1xuICAgIHNpZ25hdHVyZUNvdW50cy5zZXQoc2lnbmF0dXJlLCBzaWduYXR1cmVJbmRleCArIDEpO1xuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBoZWFkaW5nOiBjdXJyZW50SGVhZGluZy5yZXBsYWNlKC9eIyNcXHMrLywgXCJcIikudHJpbSgpLFxuICAgICAgYm9keSxcbiAgICAgIHJhdyxcbiAgICAgIHByZXZpZXcsXG4gICAgICBpbmRleDogZW50cmllcy5sZW5ndGgsXG4gICAgICBzaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleCxcbiAgICAgIHN0YXJ0TGluZTogY3VycmVudFN0YXJ0TGluZSxcbiAgICAgIGVuZExpbmUsXG4gICAgICByZXZpZXdlZDogY3VycmVudFJldmlld2VkLFxuICAgICAgcmV2aWV3QWN0aW9uOiBjdXJyZW50UmV2aWV3QWN0aW9uLFxuICAgICAgcmV2aWV3ZWRBdDogY3VycmVudFJldmlld2VkQXQsXG4gICAgfSk7XG4gICAgY3VycmVudEJvZHlMaW5lcyA9IFtdO1xuICAgIGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgICBjdXJyZW50UmV2aWV3ZWQgPSBmYWxzZTtcbiAgICBjdXJyZW50UmV2aWV3QWN0aW9uID0gbnVsbDtcbiAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IG51bGw7XG4gIH07XG5cbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxpbmVzLmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpbmRleF07XG4gICAgY29uc3QgaGVhZGluZ01hdGNoID0gbGluZS5tYXRjaCgvXiMjXFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmdNYXRjaCkge1xuICAgICAgcHVzaEVudHJ5KGluZGV4KTtcbiAgICAgIGN1cnJlbnRIZWFkaW5nID0gbGluZTtcbiAgICAgIGN1cnJlbnRTdGFydExpbmUgPSBpbmRleDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHJldmlld01hdGNoID0gbGluZS5tYXRjaCgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6XFxzKihbYS16XSspKD86XFxzKyguKz8pKT9cXHMqLS0+JC9pKTtcbiAgICBpZiAocmV2aWV3TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRSZXZpZXdlZCA9IHRydWU7XG4gICAgICBjdXJyZW50UmV2aWV3QWN0aW9uID0gcmV2aWV3TWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgIGN1cnJlbnRSZXZpZXdlZEF0ID0gcmV2aWV3TWF0Y2hbMl0gPz8gbnVsbDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGN1cnJlbnRCb2R5TGluZXMucHVzaChsaW5lKTtcbiAgfVxuXG4gIHB1c2hFbnRyeShsaW5lcy5sZW5ndGgpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gaW5zZXJ0UmV2aWV3TWFya2VyKGNvbnRlbnQ6IHN0cmluZywgZW50cnk6IEluYm94RW50cnksIGFjdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IHRpbWVzdGFtcCA9IGZvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpO1xuICBjb25zdCBtYXJrZXIgPSBgPCEtLSBicmFpbi1yZXZpZXdlZDogJHthY3Rpb259ICR7dGltZXN0YW1wfSAtLT5gO1xuICBjb25zdCBlbnRyeUxpbmVzID0gbGluZXMuc2xpY2UoZW50cnkuc3RhcnRMaW5lLCBlbnRyeS5lbmRMaW5lKTtcbiAgY29uc3QgY2xlYW5lZEVudHJ5TGluZXMgPSB0cmltVHJhaWxpbmdCbGFua0xpbmVzKFxuICAgIGVudHJ5TGluZXMuZmlsdGVyKChsaW5lKSA9PiAhbGluZS5tYXRjaCgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kpKSxcbiAgKTtcbiAgY2xlYW5lZEVudHJ5TGluZXMucHVzaChtYXJrZXIsIFwiXCIpO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmV2aWV3TWFya2VyKGNvbnRlbnQ6IHN0cmluZywgZW50cnk6IEluYm94RW50cnkpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGlmIChlbnRyeS5zdGFydExpbmUgPCAwIHx8IGVudHJ5LmVuZExpbmUgPCBlbnRyeS5zdGFydExpbmUgfHwgZW50cnkuZW5kTGluZSA+IGxpbmVzLmxlbmd0aCkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG5cbiAgY29uc3QgdXBkYXRlZExpbmVzID0gW1xuICAgIC4uLmxpbmVzLnNsaWNlKDAsIGVudHJ5LnN0YXJ0TGluZSksXG4gICAgLi4uY2xlYW5lZEVudHJ5TGluZXMsXG4gICAgLi4ubGluZXMuc2xpY2UoZW50cnkuZW5kTGluZSksXG4gIF07XG5cbiAgcmV0dXJuIHRyaW1UcmFpbGluZ0JsYW5rTGluZXModXBkYXRlZExpbmVzKS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBidWlsZFByZXZpZXcoYm9keTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBib2R5XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIGxpbmVzWzBdID8/IFwiXCI7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRW50cnlTaWduYXR1cmUoaGVhZGluZzogc3RyaW5nLCBib2R5TGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtoZWFkaW5nLnRyaW0oKSwgLi4uYm9keUxpbmVzLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY2xvbmUgPSBbLi4ubGluZXNdO1xuICB3aGlsZSAoY2xvbmUubGVuZ3RoID4gMCAmJiBjbG9uZVtjbG9uZS5sZW5ndGggLSAxXS50cmltKCkgPT09IFwiXCIpIHtcbiAgICBjbG9uZS5wb3AoKTtcbiAgfVxuICByZXR1cm4gY2xvbmU7XG59XG5cbmZ1bmN0aW9uIGZpbmRVbmlxdWVSZXZpZXdlZFNpZ25hdHVyZU1hdGNoKFxuICBlbnRyaWVzOiBJbmJveEVudHJ5W10sXG4gIHNpZ25hdHVyZTogc3RyaW5nLFxuKTogSW5ib3hFbnRyeSB8IG51bGwge1xuICBjb25zdCByZXZpZXdlZE1hdGNoZXMgPSBlbnRyaWVzLmZpbHRlcihcbiAgICAoZW50cnkpID0+IGVudHJ5LnJldmlld2VkICYmIGVudHJ5LnNpZ25hdHVyZSA9PT0gc2lnbmF0dXJlLFxuICApO1xuICBpZiAocmV2aWV3ZWRNYXRjaGVzLmxlbmd0aCAhPT0gMSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiByZXZpZXdlZE1hdGNoZXNbMF07XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgY29sbGFwc2VKb3VybmFsVGV4dCwgZm9ybWF0RGF0ZUtleSwgZm9ybWF0VGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgSm91cm5hbFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGdldEpvdXJuYWxQYXRoKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXREYXRlS2V5KGRhdGUpO1xuICAgIHJldHVybiBgJHtzZXR0aW5ncy5qb3VybmFsRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUpvdXJuYWxGaWxlKGRhdGUgPSBuZXcgRGF0ZSgpKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXREYXRlS2V5KGRhdGUpO1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldEpvdXJuYWxQYXRoKGRhdGUpO1xuICAgIHJldHVybiB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRKb3VybmFsSGVhZGVyKHBhdGgsIGRhdGVLZXkpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kRW50cnkodGV4dDogc3RyaW5nLCBkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSm91cm5hbCB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVKb3VybmFsRmlsZShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gZmlsZS5wYXRoO1xuXG4gICAgY29uc3QgYmxvY2sgPSBgIyMgJHtmb3JtYXRUaW1lS2V5KGRhdGUpfVxcbiR7Y2xlYW5lZH1gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgYmxvY2spO1xuICAgIHJldHVybiB7IHBhdGggfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7XG4gIGNvbGxhcHNlV2hpdGVzcGFjZSxcbiAgZm9ybWF0RGF0ZVRpbWVLZXksXG4gIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAsXG59IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgTm90ZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZE5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90ZSB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfVxcbi0gJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy5pbmJveEZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgY2xlYW5lZFRpdGxlID0gdHJpbVRpdGxlKHRpdGxlKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGAke2Zvcm1hdFN1bW1hcnlUaW1lc3RhbXAobm93KX0tJHtzbHVnaWZ5KGNsZWFuZWRUaXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoXG4gICAgICBgJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn0vJHtmaWxlTmFtZX1gLFxuICAgICk7XG4gICAgY29uc3Qgc291cmNlTGluZSA9IHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgID8gYCR7c291cmNlTGFiZWx9IFx1MjAyMiAke3NvdXJjZVBhdGhzLmxlbmd0aH0gJHtzb3VyY2VQYXRocy5sZW5ndGggPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gXG4gICAgICA6IHNvdXJjZVBhdGhcbiAgICAgICAgPyBgJHtzb3VyY2VMYWJlbH0gXHUyMDIyICR7c291cmNlUGF0aH1gXG4gICAgICAgIDogc291cmNlTGFiZWw7XG4gICAgY29uc3Qgc291cmNlRmlsZUxpbmVzID0gc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgPyBbXG4gICAgICAgICAgXCJTb3VyY2UgZmlsZXM6XCIsXG4gICAgICAgICAgLi4uc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpLm1hcCgoc291cmNlKSA9PiBgLSAke3NvdXJjZX1gKSxcbiAgICAgICAgICAuLi4oc291cmNlUGF0aHMubGVuZ3RoID4gMTJcbiAgICAgICAgICAgID8gW2AtIC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYF1cbiAgICAgICAgICAgIDogW10pLFxuICAgICAgICBdXG4gICAgICA6IFtdO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke2NsZWFuZWRUaXRsZX1gLFxuICAgICAgXCJcIixcbiAgICAgIGBDcmVhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIGBTb3VyY2U6ICR7c291cmNlTGluZX1gLFxuICAgICAgLi4uc291cmNlRmlsZUxpbmVzLFxuICAgICAgXCJcIixcbiAgICAgIGNvbGxhcHNlV2hpdGVzcGFjZShib2R5KSA/IGJvZHkudHJpbSgpIDogXCJObyBhcnRpZmFjdCBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgY29udGVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2x1Z2lmeSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tK3wtKyQvZywgXCJcIilcbiAgICAuc2xpY2UoMCwgNDgpIHx8IFwibm90ZVwiO1xufVxuXG5mdW5jdGlvbiB0cmltVGl0bGUodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICBpZiAodHJpbW1lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gdHJpbW1lZDtcbiAgfVxuICByZXR1cm4gYCR7dHJpbW1lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5IH0gZnJvbSBcIi4vaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJldmlld0xvZ0VudHJ5IGV4dGVuZHMgSW5ib3hFbnRyeUlkZW50aXR5IHtcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmc7XG4gIGZpbGVNdGltZTogbnVtYmVyO1xuICBlbnRyeUluZGV4OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdMb2dTZXJ2aWNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdFbnRyeUNvdW50Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfT4oKTtcbiAgcHJpdmF0ZSByZXZpZXdMb2dGaWxlc0NhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBmaWxlczogVEZpbGVbXTtcbiAgfSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJldmlld0VudHJ5VG90YWxDYWNoZToge1xuICAgIGxpc3RpbmdNdGltZTogbnVtYmVyO1xuICAgIHRvdGFsOiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFJldmlld0xvZyhlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShub3cpO1xuICAgIGNvbnN0IHBhdGggPSBgJHtzZXR0aW5ncy5yZXZpZXdzRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYC0gQWN0aW9uOiAke2FjdGlvbn1gLFxuICAgICAgYC0gSW5ib3g6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgYC0gUHJldmlldzogJHtlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgXCIoZW1wdHkpXCJ9YCxcbiAgICAgIGAtIFNpZ25hdHVyZTogJHtlbmNvZGVSZXZpZXdTaWduYXR1cmUoZW50cnkuc2lnbmF0dXJlKX1gLFxuICAgICAgYC0gU2lnbmF0dXJlIGluZGV4OiAke2VudHJ5LnNpZ25hdHVyZUluZGV4fWAsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSBudWxsO1xuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdMb2dGaWxlcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG5cbiAgICBpZiAoIXRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSkge1xuICAgICAgY29uc3QgYWxsRmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgICAgY29uc3QgbWF0Y2hpbmcgPSBhbGxGaWxlc1xuICAgICAgICAuZmlsdGVyKChmaWxlKSA9PiBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gICAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiBtYXRjaGluZ1swXT8uc3RhdC5tdGltZSA/PyAwLFxuICAgICAgICBmaWxlczogbWF0Y2hpbmcsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCJcbiAgICAgID8gdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlLmZpbGVzLnNsaWNlKDAsIGxpbWl0KVxuICAgICAgOiB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUuZmlsZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyaWVzKGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxSZXZpZXdMb2dFbnRyeVtdPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQpO1xuICAgIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBsb2dzKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSk7XG4gICAgICBlbnRyaWVzLnB1c2goLi4ucGFyc2VkLnJldmVyc2UoKSk7XG4gICAgICBpZiAodHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiICYmIGVudHJpZXMubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgPyBlbnRyaWVzLnNsaWNlKDAsIGxpbWl0KSA6IGVudHJpZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMoKTtcbiAgICBpZiAobG9ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWU6IDAsIHRvdGFsOiAwIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0aW5nTXRpbWUgPSBsb2dzWzBdLnN0YXQubXRpbWU7XG4gICAgaWYgKHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlPy5saXN0aW5nTXRpbWUgPT09IGxpc3RpbmdNdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlLnRvdGFsO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZW5QYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGxldCB0b3RhbCA9IDA7XG5cbiAgICBjb25zdCB1bmNhY2hlZEZpbGVzID0gbG9ncy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuICEoY2FjaGVkICYmIGNhY2hlZC5tdGltZSA9PT0gZmlsZS5zdGF0Lm10aW1lKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNhY2hlZEZpbGVzID0gbG9ncy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuIGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZTtcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBjYWNoZWRGaWxlcykge1xuICAgICAgc2VlblBhdGhzLmFkZChmaWxlLnBhdGgpO1xuICAgICAgdG90YWwgKz0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCkhLmNvdW50O1xuICAgIH1cblxuICAgIGlmICh1bmNhY2hlZEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgdW5jYWNoZWRGaWxlcy5tYXAoYXN5bmMgKGZpbGUpID0+IHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSkubGVuZ3RoO1xuICAgICAgICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLnNldChmaWxlLnBhdGgsIHtcbiAgICAgICAgICAgIG10aW1lOiBmaWxlLnN0YXQubXRpbWUsXG4gICAgICAgICAgICBjb3VudCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4geyBmaWxlLCBjb3VudCB9O1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICAgIGZvciAoY29uc3QgeyBmaWxlLCBjb3VudCB9IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgc2VlblBhdGhzLmFkZChmaWxlLnBhdGgpO1xuICAgICAgICB0b3RhbCArPSBjb3VudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUua2V5cygpKSB7XG4gICAgICBpZiAoIXNlZW5QYXRocy5oYXMocGF0aCkpIHtcbiAgICAgICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZGVsZXRlKHBhdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWUsIHRvdGFsIH07XG4gICAgcmV0dXJuIHRvdGFsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJldmlld0xvZ0VudHJpZXMoXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nLFxuICBmaWxlTXRpbWU6IG51bWJlcixcbik6IFJldmlld0xvZ0VudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcbiAgbGV0IGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICBsZXQgY3VycmVudEFjdGlvbiA9IFwiXCI7XG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gIGxldCBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IDA7XG4gIGxldCBjdXJyZW50RW50cnlJbmRleCA9IDA7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudFRpbWVzdGFtcCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBhY3Rpb246IGN1cnJlbnRBY3Rpb24gfHwgXCJ1bmtub3duXCIsXG4gICAgICBoZWFkaW5nOiBjdXJyZW50SGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGN1cnJlbnRQcmV2aWV3LFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIHNpZ25hdHVyZTogY3VycmVudFNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBjdXJyZW50U2lnbmF0dXJlSW5kZXgsXG4gICAgICB0aW1lc3RhbXA6IGN1cnJlbnRUaW1lc3RhbXAsXG4gICAgICBzb3VyY2VQYXRoLFxuICAgICAgZmlsZU10aW1lLFxuICAgICAgZW50cnlJbmRleDogY3VycmVudEVudHJ5SW5kZXgsXG4gICAgfSk7XG4gICAgY3VycmVudFRpbWVzdGFtcCA9IFwiXCI7XG4gICAgY3VycmVudEFjdGlvbiA9IFwiXCI7XG4gICAgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICAgIGN1cnJlbnRQcmV2aWV3ID0gXCJcIjtcbiAgICBjdXJyZW50U2lnbmF0dXJlID0gXCJcIjtcbiAgICBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICAgIGN1cnJlbnRFbnRyeUluZGV4ICs9IDE7XG4gIH07XG5cbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgaGVhZGluZ01hdGNoID0gbGluZS5tYXRjaCgvXiMjXFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmdNYXRjaCkge1xuICAgICAgcHVzaEVudHJ5KCk7XG4gICAgICBjdXJyZW50VGltZXN0YW1wID0gaGVhZGluZ01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbk1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrQWN0aW9uOlxccysoLispJC9pKTtcbiAgICBpZiAoYWN0aW9uTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRBY3Rpb24gPSBhY3Rpb25NYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmJveE1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrSW5ib3g6XFxzKyguKykkL2kpO1xuICAgIGlmIChpbmJveE1hdGNoKSB7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGluYm94TWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlld01hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrUHJldmlldzpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHByZXZpZXdNYXRjaCkge1xuICAgICAgY3VycmVudFByZXZpZXcgPSBwcmV2aWV3TWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlTWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmU6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVNYXRjaCkge1xuICAgICAgY3VycmVudFNpZ25hdHVyZSA9IGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmVNYXRjaFsxXS50cmltKCkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXhNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1NpZ25hdHVyZSBpbmRleDpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHNpZ25hdHVyZUluZGV4TWF0Y2gpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludChzaWduYXR1cmVJbmRleE1hdGNoWzFdLCAxMCk7XG4gICAgICBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG4gICAgfVxuICB9XG5cbiAgcHVzaEVudHJ5KCk7XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHNpZ25hdHVyZSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gc2lnbmF0dXJlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHksIEluYm94U2VydmljZSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3Rhc2stc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnksIFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5ib3hTZXJ2aWNlOiBJbmJveFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZTogVGFza1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBqb3VybmFsU2VydmljZTogSm91cm5hbFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdMb2dTZXJ2aWNlOiBSZXZpZXdMb2dTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEluYm94RW50cmllcyhsaW1pdCA9IDIwKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICByZXR1cm4gdGhpcy5pbmJveFNlcnZpY2UuZ2V0UmVjZW50RW50cmllcyhsaW1pdCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9UYXNrKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0ZXh0ID0gZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcInRhc2tcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwidGFza1wiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFxuICAgICAgYFByb21vdGVkIGluYm94IGVudHJ5IHRvIHRhc2sgaW4gJHtzYXZlZC5wYXRofWAsXG4gICAgICBtYXJrZXJVcGRhdGVkLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBrZWVwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJrZWVwXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImtlZXBcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcIktlcHQgaW5ib3ggZW50cnlcIiwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBza2lwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJza2lwXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInNraXBcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcIlNraXBwZWQgaW5ib3ggZW50cnlcIiwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRUb0pvdXJuYWwoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeShcbiAgICAgIFtcbiAgICAgICAgYFNvdXJjZTogJHtlbnRyeS5oZWFkaW5nfWAsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nLFxuICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwiam91cm5hbFwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBBcHBlbmRlZCBpbmJveCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YCwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9Ob3RlKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm90ZXNGb2xkZXIgPSBzZXR0aW5ncy5ub3Rlc0ZvbGRlcjtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVGb2xkZXIobm90ZXNGb2xkZXIpO1xuXG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLmJ1aWxkTm90ZVRpdGxlKGVudHJ5KTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IGAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdykucmVwbGFjZSgvWzogXS9nLCBcIi1cIil9LSR7c2x1Z2lmeSh0aXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoYCR7bm90ZXNGb2xkZXJ9LyR7ZmlsZW5hbWV9YCk7XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjICR7dGl0bGV9YCxcbiAgICAgIFwiXCIsXG4gICAgICBgQ3JlYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBcIlNvdXJjZTogQnJhaW4gaW5ib3hcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIk9yaWdpbmFsIGNhcHR1cmU6XCIsXG4gICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBjb250ZW50KTtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwibm90ZVwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJub3RlXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoYFByb21vdGVkIGluYm94IGVudHJ5IHRvIG5vdGUgaW4gJHtwYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuRnJvbVJldmlld0xvZyhlbnRyeTogUmV2aWV3TG9nRW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGlkZW50aXR5ID0ge1xuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfTtcbiAgICBjb25zdCByZW9wZW5lZCA9IGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLnJlb3BlbkVudHJ5KGlkZW50aXR5KTtcbiAgICBpZiAoIXJlb3BlbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZS1vcGVuIGluYm94IGVudHJ5ICR7ZW50cnkuaGVhZGluZ31gKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGlkZW50aXR5LCBcInJlb3BlblwiKTtcbiAgICByZXR1cm4gYFJlLW9wZW5lZCBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YDtcbiAgfVxuXG4gIGJ1aWxkTm90ZVRpdGxlKGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgZW50cnkuaGVhZGluZztcbiAgICBjb25zdCBsaW5lcyA9IGNhbmRpZGF0ZVxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBjb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgY29uc3QgZmlyc3QgPSBsaW5lc1swXSA/PyBcIlVudGl0bGVkIG5vdGVcIjtcbiAgICByZXR1cm4gdHJpbVRpdGxlKGZpcnN0KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbWFya0luYm94UmV2aWV3ZWQoZW50cnk6IEluYm94RW50cnksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmluYm94U2VydmljZS5tYXJrRW50cnlSZXZpZXdlZChlbnRyeSwgYWN0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRNYXJrZXJOb3RlKG1lc3NhZ2U6IHN0cmluZywgbWFya2VyVXBkYXRlZDogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgcmV0dXJuIG1hcmtlclVwZGF0ZWQgPyBtZXNzYWdlIDogYCR7bWVzc2FnZX0gKHJldmlldyBtYXJrZXIgbm90IHVwZGF0ZWQpYDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChcbiAgICBlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LFxuICAgIGFjdGlvbjogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmFwcGVuZFJldmlld0xvZyhlbnRyeSwgYWN0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpXG4gICAgLnNsaWNlKDAsIDQ4KSB8fCBcIm5vdGVcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhbnN3ZXJRdWVzdGlvbihxdWVzdGlvbjogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgYW5zd2VycyBhcmUgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb24sIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgcXVlc3Rpb24gYW5zd2VyaW5nXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiUXVlc3Rpb24gQW5zd2VyXCIsXG4gICAgICB0aXRsZTogXCJBbnN3ZXJcIixcbiAgICAgIG5vdGVUaXRsZTogc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogcXVlc3Rpb24sXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG9ydGVuUXVlc3Rpb24ocXVlc3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSBxdWVzdGlvbi50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBRdWVzdGlvbiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RLZXl3b3JkcyhxdWVzdGlvbjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzdG9wd29yZHMgPSBuZXcgU2V0KFtcbiAgICBcIndoYXRcIixcbiAgICBcIndoeVwiLFxuICAgIFwiaG93XCIsXG4gICAgXCJ3aGljaFwiLFxuICAgIFwid2hlblwiLFxuICAgIFwid2hlcmVcIixcbiAgICBcIndob1wiLFxuICAgIFwid2hvbVwiLFxuICAgIFwiZG9lc1wiLFxuICAgIFwiZG9cIixcbiAgICBcImRpZFwiLFxuICAgIFwiaXNcIixcbiAgICBcImFyZVwiLFxuICAgIFwid2FzXCIsXG4gICAgXCJ3ZXJlXCIsXG4gICAgXCJ0aGVcIixcbiAgICBcImFcIixcbiAgICBcImFuXCIsXG4gICAgXCJ0b1wiLFxuICAgIFwib2ZcIixcbiAgICBcImZvclwiLFxuICAgIFwiYW5kXCIsXG4gICAgXCJvclwiLFxuICAgIFwiaW5cIixcbiAgICBcIm9uXCIsXG4gICAgXCJhdFwiLFxuICAgIFwid2l0aFwiLFxuICAgIFwiYWJvdXRcIixcbiAgICBcImZyb21cIixcbiAgICBcIm15XCIsXG4gICAgXCJvdXJcIixcbiAgICBcInlvdXJcIixcbiAgICBcInRoaXNcIixcbiAgICBcInRoYXRcIixcbiAgICBcInRoZXNlXCIsXG4gICAgXCJ0aG9zZVwiLFxuICAgIFwibWFrZVwiLFxuICAgIFwibWFkZVwiLFxuICAgIFwibmVlZFwiLFxuICAgIFwibmVlZHNcIixcbiAgICBcImNhblwiLFxuICAgIFwiY291bGRcIixcbiAgICBcInNob3VsZFwiLFxuICAgIFwid291bGRcIixcbiAgICBcIndpbGxcIixcbiAgICBcImhhdmVcIixcbiAgICBcImhhc1wiLFxuICAgIFwiaGFkXCIsXG4gIF0pO1xuXG4gIHJldHVybiBBcnJheS5mcm9tKFxuICAgIG5ldyBTZXQoXG4gICAgICBxdWVzdGlvblxuICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAuc3BsaXQoL1teYS16MC05XSsvZylcbiAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoKHdvcmQpID0+IHdvcmQubGVuZ3RoID49IDQgJiYgIXN0b3B3b3Jkcy5oYXMod29yZCkpLFxuICAgICksXG4gICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNRdWVzdGlvbihsaW5lOiBzdHJpbmcsIGtleXdvcmRzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoIWtleXdvcmRzLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4ga2V5d29yZHMuc29tZSgoa2V5d29yZCkgPT4gbG93ZXIuaW5jbHVkZXMoa2V5d29yZCkpO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RXZpZGVuY2UoY29udGVudDogc3RyaW5nLCBxdWVzdGlvbjogc3RyaW5nKToge1xuICBldmlkZW5jZTogU2V0PHN0cmluZz47XG4gIG1hdGNoZWQ6IGJvb2xlYW47XG59IHtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5d29yZHMgPSBleHRyYWN0S2V5d29yZHMocXVlc3Rpb24pO1xuICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oaGVhZGluZ1RleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMykpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihoZWFkaW5nVGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQgJiYgKG1hdGNoZXNRdWVzdGlvbih0YXNrVGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAzKSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKHRhc2tUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oYnVsbGV0VGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCA0KSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGJ1bGxldFRleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChtYXRjaGVzUXVlc3Rpb24obGluZSwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAyKSB7XG4gICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGxpbmUsIGtleXdvcmRzKSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGV2aWRlbmNlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGV2aWRlbmNlLFxuICAgIG1hdGNoZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIocXVlc3Rpb246IHN0cmluZywgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZFF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShxdWVzdGlvbik7XG4gIGNvbnN0IHsgZXZpZGVuY2UsIG1hdGNoZWQgfSA9IGNvbGxlY3RFdmlkZW5jZShjb250ZW50LCBjbGVhbmVkUXVlc3Rpb24pO1xuICBjb25zdCBhbnN3ZXJMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAobWF0Y2hlZCkge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXG4gICAgICBcIkkgZm91bmQgdGhlc2UgbGluZXMgaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQgdGhhdCBkaXJlY3RseSBtYXRjaCB5b3VyIHF1ZXN0aW9uLlwiLFxuICAgICk7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRoZSBjb250ZXh0IGRvZXMgbm90IHByb3ZpZGUgYSBmdWxseSB2ZXJpZmllZCBhbnN3ZXIsIHNvIHRyZWF0IHRoaXMgYXMgYSBncm91bmRlZCBzdW1tYXJ5LlwiKTtcbiAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplKSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcbiAgICAgIFwiSSBjb3VsZCBub3QgZmluZCBhIGRpcmVjdCBtYXRjaCBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dCwgc28gdGhlc2UgYXJlIHRoZSBjbG9zZXN0IGxpbmVzIGF2YWlsYWJsZS5cIixcbiAgICApO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUcmVhdCB0aGlzIGFzIG5lYXJieSBjb250ZXh0IHJhdGhlciB0aGFuIGEgY29uZmlybWVkIGFuc3dlci5cIik7XG4gIH0gZWxzZSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIkkgY291bGQgbm90IGZpbmQgYSBkaXJlY3QgYW5zd2VyIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0LlwiKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVHJ5IG5hcnJvd2luZyB0aGUgcXVlc3Rpb24gb3Igc2VsZWN0aW5nIGEgbW9yZSBzcGVjaWZpYyBub3RlIG9yIGZvbGRlci5cIik7XG4gIH1cblxuICBjb25zdCBmb2xsb3dVcHMgPSBtYXRjaGVkIHx8IGV2aWRlbmNlLnNpemVcbiAgICA/IG5ldyBTZXQoW1xuICAgICAgICBcIkFzayBhIG5hcnJvd2VyIHF1ZXN0aW9uIGlmIHlvdSB3YW50IGEgbW9yZSBzcGVjaWZpYyBhbnN3ZXIuXCIsXG4gICAgICAgIFwiT3BlbiB0aGUgc291cmNlIG5vdGUgb3IgZm9sZGVyIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXCIsXG4gICAgICBdKVxuICAgIDogbmV3IFNldChbXG4gICAgICAgIFwiUHJvdmlkZSBtb3JlIGV4cGxpY2l0IGNvbnRleHQgb3Igc2VsZWN0IGEgZGlmZmVyZW50IG5vdGUgb3IgZm9sZGVyLlwiLFxuICAgICAgXSk7XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgY2xlYW5lZFF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEFuc3dlclwiLFxuICAgIGFuc3dlckxpbmVzLmpvaW4oXCIgXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGRpcmVjdCBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICBwYXJzZWQuYW5zd2VyIHx8IFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgcGFyc2VkLmV2aWRlbmNlIHx8IFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBxdWVzdGlvbjogc3RyaW5nO1xuICBhbnN3ZXI6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiUXVlc3Rpb25cIiB8IFwiQW5zd2VyXCIgfCBcIkV2aWRlbmNlXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFF1ZXN0aW9uOiBbXSxcbiAgICBBbnN3ZXI6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoUXVlc3Rpb258QW5zd2VyfEV2aWRlbmNlfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbjogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5RdWVzdGlvbl0pLFxuICAgIGFuc3dlcjogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkFuc3dlciksXG4gICAgZXZpZGVuY2U6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5FdmlkZW5jZSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBRdWVzdGlvbjogc3RyaW5nW107XG4gIEFuc3dlcjogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImFuc3dlclwiKSB7XG4gICAgcmV0dXJuIFwiQW5zd2VyXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlF1ZXN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnksXG59IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSwgZm9ybWF0U3VtbWFyeVRpbWVzdGFtcCB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LWZvcm1hdFwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VtbWFyeVJlc3VsdCB7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgcGVyc2lzdGVkUGF0aD86IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3VtbWFyeVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnkobG9va2JhY2tEYXlzPzogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZWZmZWN0aXZlTG9va2JhY2tEYXlzID0gbG9va2JhY2tEYXlzID8/IHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXM7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RSZWNlbnRGaWxlcyhzZXR0aW5ncywgZWZmZWN0aXZlTG9va2JhY2tEYXlzKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGxldCBzdW1tYXJ5ID0gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudCk7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgc3VtbWFyaWVzIGFyZSBlbmFibGVkIGJ1dCBPcGVuQUkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHN1bW1hcnkgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5zdW1tYXJpemUoY29udGVudCB8fCBzdW1tYXJ5LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN1bW1hcnlcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGVyc2lzdGVkUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHRpdGxlID0gbGFiZWwgPyBgJHtsYWJlbH0gU3VtbWFyeWAgOiBcIlN1bW1hcnlcIjtcbiAgICBpZiAoc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykge1xuICAgICAgY29uc3QgdGltZXN0YW1wID0gZm9ybWF0U3VtbWFyeVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcbiAgICAgIGNvbnN0IGZpbGVMYWJlbCA9IGxhYmVsID8gYCR7bGFiZWwudG9Mb3dlckNhc2UoKX0tJHt0aW1lc3RhbXB9YCA6IHRpbWVzdGFtcDtcbiAgICAgIGNvbnN0IHJlcXVlc3RlZFBhdGggPSBgJHtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXJ9LyR7ZmlsZUxhYmVsfS5tZGA7XG4gICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgocmVxdWVzdGVkUGF0aCk7XG4gICAgICBjb25zdCBkaXNwbGF5VGltZXN0YW1wID0gZm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSk7XG4gICAgICBjb25zdCBib2R5ID0gW1xuICAgICAgICBgIyAke3RpdGxlfSAke2Rpc3BsYXlUaW1lc3RhbXB9YCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgYCMjIFdpbmRvd2AsXG4gICAgICAgIGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9PT0gMSA/IFwiVG9kYXlcIiA6IGBMYXN0ICR7ZWZmZWN0aXZlTG9va2JhY2tEYXlzfSBkYXlzYCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgc3VtbWFyeS50cmltKCksXG4gICAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJvZHkpO1xuICAgICAgcGVyc2lzdGVkUGF0aCA9IHBhdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IHN1bW1hcnksXG4gICAgICBwZXJzaXN0ZWRQYXRoLFxuICAgICAgdXNlZEFJLFxuICAgICAgdGl0bGUsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdFJlY2VudEZpbGVzKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIGxvb2tiYWNrRGF5czogbnVtYmVyLFxuICApOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBjdXRvZmYgPSBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXMpLmdldFRpbWUoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IGN1dG9mZilcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzOiBudW1iZXIpOiBEYXRlIHtcbiAgY29uc3Qgc2FmZURheXMgPSBNYXRoLm1heCgxLCBsb29rYmFja0RheXMpO1xuICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKCk7XG4gIHN0YXJ0LnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICBzdGFydC5zZXREYXRlKHN0YXJ0LmdldERhdGUoKSAtIChzYWZlRGF5cyAtIDEpKTtcbiAgcmV0dXJuIHN0YXJ0O1xufVxuIiwgImZ1bmN0aW9uIGNsZWFuU3VtbWFyeUxpbmUodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuICh0ZXh0ID8/IFwiXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUYXNrU2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gXCItIE5vIHJlY2VudCB0YXNrcyBmb3VuZC5cIjtcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSBbIF0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrU3VtbWFyeShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBoaWdobGlnaHRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgaGlnaGxpZ2h0cy5hZGQoY2xlYW5TdW1tYXJ5TGluZShoZWFkaW5nWzFdKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUodGFza1syXSk7XG4gICAgICB0YXNrcy5hZGQodGV4dCk7XG4gICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUoYnVsbGV0WzJdKTtcbiAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIGhpZ2hsaWdodHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGhpZ2hsaWdodHMuc2l6ZSA8IDUgJiYgbGluZS5sZW5ndGggPD0gMTQwKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGhpZ2hsaWdodHMsIFwiTm8gcmVjZW50IG5vdGVzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBmb3JtYXRUYXNrU2VjdGlvbih0YXNrcyksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm90aGluZyBwZW5kaW5nIGZyb20gcmVjZW50IG5vdGVzLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3ludGhlc2lzIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24gfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbiB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlIH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tQcm9qZWN0QnJpZWYgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy10ZW1wbGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRoZXNpc1Jlc3VsdCB7XG4gIGFjdGlvbjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBub3RlVGl0bGU6IHN0cmluZztcbiAgY29udGVudDogc3RyaW5nO1xuICB1c2VkQUk6IGJvb2xlYW47XG4gIHByb21wdFRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIHJ1bih0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmFsbGJhY2sgPSB0aGlzLmJ1aWxkRmFsbGJhY2sodGVtcGxhdGUsIGNvbnRleHQudGV4dCk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGlmICghc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJBSSBzdW1tYXJpZXMgYXJlIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN5bnRoZXNpemVDb250ZXh0KHRlbXBsYXRlLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN5bnRoZXNpc1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIHRpdGxlOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIG5vdGVUaXRsZTogYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gJHtnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKX1gLFxuICAgICAgY29udGVudDogdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRmFsbGJhY2sodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24odGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsZEZhbGxiYWNrU3ludGhlc2lzKHRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYWRkU3VtbWFyeUxpbmUoXG4gIHN1bW1hcnk6IFNldDxzdHJpbmc+LFxuICB0ZXh0OiBzdHJpbmcsXG4gIG1heEl0ZW1zID0gNCxcbik6IHZvaWQge1xuICBpZiAoc3VtbWFyeS5zaXplID49IG1heEl0ZW1zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgaWYgKCFjbGVhbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc3VtbWFyeS5hZGQoY2xlYW5lZCk7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1N5bnRoZXNpcyhjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzdW1tYXJ5ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRoZW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICB0aGVtZXMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIGhlYWRpbmdUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBmb2xsb3dVcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIHRoZW1lcy5hZGQodGFza1RleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgdGFza1RleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIHRoZW1lcy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBidWxsZXRUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgZm9sbG93VXBzLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG5cbiAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBsaW5lKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oc3VtbWFyeSwgXCJObyBzb3VyY2UgY29udGV4dCBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbih0aGVtZXMsIFwiTm8ga2V5IHRoZW1lcyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VTeW50aGVzaXNTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgIHBhcnNlZC5zdW1tYXJ5IHx8IFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICBwYXJzZWQua2V5VGhlbWVzIHx8IFwiTm8ga2V5IHRoZW1lcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3ludGhlc2lzU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGtleVRoZW1lczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJTdW1tYXJ5XCIgfCBcIktleSBUaGVtZXNcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgU3VtbWFyeTogW10sXG4gICAgXCJLZXkgVGhlbWVzXCI6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhTdW1tYXJ5fEtleSBUaGVtZXN8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnk6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuU3VtbWFyeV0pLFxuICAgIGtleVRoZW1lczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFRoZW1lc1wiXSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBTdW1tYXJ5OiBzdHJpbmdbXTtcbiAgXCJLZXkgVGhlbWVzXCI6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHRoZW1lc1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFRoZW1lc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJTdW1tYXJ5XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCAxMClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIHRhc2tzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGNvbnRleHQuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGFza3MsIFwiTm8gdGFza3MgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oY29udGV4dCwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBwYXJzZWQudGFza3MgfHwgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgVGFza3NcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHRhc2tzOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiVGFza3NcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBUYXNrczogW10sXG4gICAgQ29udGV4dDogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFRhc2tzfENvbnRleHR8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGNvbnRleHQ6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuQ29udGV4dF0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiVGFza3NcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDEwKVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlUmF0aW9uYWxlKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImJlY2F1c2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNvIHRoYXRcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImR1ZSB0b1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicmVhc29uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ0cmFkZW9mZlwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uc3RyYWludFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VEZWNpc2lvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpZGVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImRlY2lzaW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjaG9vc2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNoaXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFkb3B0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkcm9wXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzd2l0Y2hcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tEZWNpc2lvbkV4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZGVjaXNpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHJhdGlvbmFsZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lIHx8IGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoZGVjaXNpb25zLnNpemUgPCAzKSB7XG4gICAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByYXRpb25hbGUuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VEZWNpc2lvbihsaW5lKSkge1xuICAgICAgZGVjaXNpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZVJhdGlvbmFsZShsaW5lKSkge1xuICAgICAgcmF0aW9uYWxlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZGVjaXNpb25zLCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHJhdGlvbmFsZSwgXCJObyBleHBsaWNpdCByYXRpb25hbGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIFwiTm8gZGVjaXNpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VEZWNpc2lvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBwYXJzZWQuZGVjaXNpb25zIHx8IFwiTm8gY2xlYXIgZGVjaXNpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgcGFyc2VkLnJhdGlvbmFsZSB8fCBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGVjaXNpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGRlY2lzaW9uczogc3RyaW5nO1xuICByYXRpb25hbGU6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIkRlY2lzaW9uc1wiIHwgXCJSYXRpb25hbGVcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiwgc3RyaW5nW10+ID0ge1xuICAgIERlY2lzaW9uczogW10sXG4gICAgUmF0aW9uYWxlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKERlY2lzaW9uc3xSYXRpb25hbGV8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkZWNpc2lvbnM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuRGVjaXNpb25zXSksXG4gICAgcmF0aW9uYWxlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuUmF0aW9uYWxlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgRGVjaXNpb25zOiBzdHJpbmdbXTtcbiAgUmF0aW9uYWxlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJyYXRpb25hbGVcIikge1xuICAgIHJldHVybiBcIlJhdGlvbmFsZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIkRlY2lzaW9uc1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgMTApXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VRdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibm90IHN1cmVcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRm9sbG93VXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZm9sbG93IHVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZXh0IHN0ZXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImludmVzdGlnYXRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjb25maXJtXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ2YWxpZGF0ZVwiKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBjb250ZXh0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZUZvbGxvd1VwKHRleHQpKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5zaXplIDwgNikge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZVF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNpemUgPCA0KSB7XG4gICAgICBjb250ZXh0LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3BlbiBRdWVzdGlvbnNcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPcGVuIFF1ZXN0aW9uc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl1dKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuQ29udGV4dCksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja0NsZWFuTm90ZShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBrZXlQb2ludHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAga2V5UG9pbnRzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAga2V5UG9pbnRzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBxdWVzdGlvbnMuYWRkKHF1ZXN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihrZXlQb2ludHMsIFwiTm8ga2V5IHBvaW50cyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ocXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICBwYXJzZWQua2V5UG9pbnRzIHx8IFwiTm8ga2V5IHBvaW50cyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLnF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgIFwiTm8ga2V5IHBvaW50cyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VDbGVhbk5vdGVTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGtleVBvaW50czogc3RyaW5nO1xuICBxdWVzdGlvbnM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJPdmVydmlld1wiIHwgXCJLZXkgUG9pbnRzXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgXCJLZXkgUG9pbnRzXCI6IFtdLFxuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3ZlcnZpZXd8S2V5IFBvaW50c3xPcGVuIFF1ZXN0aW9ucylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAga2V5UG9pbnRzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJLZXkgUG9pbnRzXCJdKSxcbiAgICBxdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIFwiS2V5IFBvaW50c1wiOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJrZXkgcG9pbnRzXCIpIHtcbiAgICByZXR1cm4gXCJLZXkgUG9pbnRzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBnb2FscyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzY29wZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBuZXh0U3RlcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgc2NvcGUuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAgbmV4dFN0ZXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGdvYWxzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAgc2NvcGUuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlR29hbChidWxsZXRUZXh0KSkge1xuICAgICAgICAgIGdvYWxzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZUdvYWwobGluZSkpIHtcbiAgICAgIGdvYWxzLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgR29hbHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihnb2FscywgXCJObyBnb2FscyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFNjb3BlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oc2NvcGUsIFwiTm8gc2NvcGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24obmV4dFN0ZXBzLCBcIk5vIG5leHQgc3RlcHMgZm91bmQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZUdvYWwodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJnb2FsIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJnb2FscyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmVlZCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmVlZHMgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIndhbnQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIndhbnRzIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hvdWxkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibXVzdCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm9iamVjdGl2ZVwiKVxuICApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VQcm9qZWN0QnJpZWZTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICBwYXJzZWQuZ29hbHMgfHwgXCJObyBnb2FscyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgcGFyc2VkLnNjb3BlIHx8IFwiTm8gc2NvcGUgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgcGFyc2VkLm5leHRTdGVwcyB8fCBcIk5vIG5leHQgc3RlcHMgZXh0cmFjdGVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBHb2Fsc1wiLFxuICAgIFwiTm8gZ29hbHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTY29wZVwiLFxuICAgIFwiTm8gc2NvcGUgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgXCJObyBuZXh0IHN0ZXBzIGV4dHJhY3RlZC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVByb2plY3RCcmllZlNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAgZ29hbHM6IHN0cmluZztcbiAgc2NvcGU6IHN0cmluZztcbiAgbmV4dFN0ZXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiR29hbHNcIiB8IFwiU2NvcGVcIiB8IFwiTmV4dCBTdGVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIEdvYWxzOiBbXSxcbiAgICBTY29wZTogW10sXG4gICAgXCJOZXh0IFN0ZXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEdvYWxzfFNjb3BlfE5leHQgU3RlcHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGdvYWxzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuR29hbHMpLFxuICAgIHNjb3BlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuU2NvcGUpLFxuICAgIG5leHRTdGVwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiTmV4dCBTdGVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBHb2Fsczogc3RyaW5nW107XG4gIFNjb3BlOiBzdHJpbmdbXTtcbiAgXCJOZXh0IFN0ZXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImdvYWxzXCIpIHtcbiAgICByZXR1cm4gXCJHb2Fsc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcInNjb3BlXCIpIHtcbiAgICByZXR1cm4gXCJTY29wZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm5leHQgc3RlcHNcIikge1xuICAgIHJldHVybiBcIk5leHQgU3RlcHNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSk6IHN0cmluZyB7XG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJUYXNrIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRGVjaXNpb24gRXh0cmFjdGlvblwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJDbGVhbiBOb3RlXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdCBCcmllZlwiO1xuICB9XG5cbiAgcmV0dXJuIFwiU3VtbWFyeVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbCh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBUYXNrc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IERlY2lzaW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgIHJldHVybiBcIlJld3JpdGUgYXMgQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIkRyYWZ0IFByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcml6ZVwiO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrVG9waWNQYWdlIH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2UtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdG9waWMtcGFnZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFRvcGljUGFnZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKHRvcGljOiBzdHJpbmcsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgICBpZiAoIWNsZWFuZWRUb3BpYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9waWMgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1RvcGljUGFnZShcbiAgICAgIGNsZWFuZWRUb3BpYyxcbiAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGlmICghc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJBSSB0b3BpYyBwYWdlcyBhcmUgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuY3JlYXRlVG9waWNQYWdlKGNsZWFuZWRUb3BpYywgY29udGV4dCwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCB0b3BpYyBwYWdlIGdlbmVyYXRpb25cIik7XG4gICAgICAgICAgY29udGVudCA9IGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBlbnN1cmVUb3BpY0J1bGxldChcbiAgICAgIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChjb250ZW50KSxcbiAgICAgIGNsZWFuZWRUb3BpYyxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogXCJUb3BpYyBQYWdlXCIsXG4gICAgICB0aXRsZTogXCJUb3BpYyBQYWdlXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5Ub3BpYyhjbGVhbmVkVG9waWMpLFxuICAgICAgY29udGVudDogbm9ybWFsaXplZENvbnRlbnQsXG4gICAgICB1c2VkQUksXG4gICAgICBwcm9tcHRUZXh0OiBjbGVhbmVkVG9waWMsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbnN1cmVUb3BpY0J1bGxldChjb250ZW50OiBzdHJpbmcsIHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkVG9waWMgPSBjb2xsYXBzZVdoaXRlc3BhY2UodG9waWMpO1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IG92ZXJ2aWV3SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGxpbmUpID0+IC9eIyNcXHMrT3ZlcnZpZXdcXHMqJC8udGVzdChsaW5lKSk7XG4gIGlmIChvdmVydmlld0luZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgbmV4dEhlYWRpbmdJbmRleCA9IGxpbmVzLmZpbmRJbmRleChcbiAgICAobGluZSwgaW5kZXgpID0+IGluZGV4ID4gb3ZlcnZpZXdJbmRleCAmJiAvXiMjXFxzKy8udGVzdChsaW5lKSxcbiAgKTtcbiAgY29uc3QgdG9waWNMaW5lID0gYC0gVG9waWM6ICR7bm9ybWFsaXplZFRvcGljfWA7XG4gIGNvbnN0IG92ZXJ2aWV3U2xpY2UgPSBsaW5lcy5zbGljZShcbiAgICBvdmVydmlld0luZGV4ICsgMSxcbiAgICBuZXh0SGVhZGluZ0luZGV4ID09PSAtMSA/IGxpbmVzLmxlbmd0aCA6IG5leHRIZWFkaW5nSW5kZXgsXG4gICk7XG4gIGlmIChvdmVydmlld1NsaWNlLnNvbWUoKGxpbmUpID0+IGxpbmUudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcIi0gdG9waWM6XCIpKSkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgaW5zZXJ0aW9uSW5kZXggPSBvdmVydmlld0luZGV4ICsgMTtcbiAgY29uc3QgdXBkYXRlZCA9IFsuLi5saW5lc107XG4gIHVwZGF0ZWQuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCB0b3BpY0xpbmUpO1xuICByZXR1cm4gdXBkYXRlZC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzaG9ydGVuVG9waWModG9waWM6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSB0b3BpYy50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBUb3BpYyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZU9wZW5RdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwib3BlbiBpc3N1ZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VOZXh0U3RlcCh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5leHQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImZvbGxvdyB1cFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJmb2xsb3ctdXBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwidG9kbyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwidG8tZG8gXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaG91bGQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZWVkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmVlZHMgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJtdXN0IFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiYWN0aW9uXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNvdXJjZXMoXG4gIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIHNvdXJjZVBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBpZiAoc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBzb3VyY2VQYXRocy5zbGljZSgwLCAxMikpIHtcbiAgICAgIHNvdXJjZXMuYWRkKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2VQYXRocy5sZW5ndGggPiAxMikge1xuICAgICAgc291cmNlcy5hZGQoYC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHNvdXJjZVBhdGgpIHtcbiAgICBzb3VyY2VzLmFkZChzb3VyY2VQYXRoKTtcbiAgfSBlbHNlIHtcbiAgICBzb3VyY2VzLmFkZChzb3VyY2VMYWJlbCk7XG4gIH1cblxuICByZXR1cm4gZm9ybWF0TGlzdFNlY3Rpb24oc291cmNlcywgXCJObyBleHBsaWNpdCBzb3VyY2VzIGZvdW5kLlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gIHRvcGljOiBzdHJpbmcsXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgc291cmNlUGF0aHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBuZXh0U3RlcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihoZWFkaW5nVGV4dCkpIHtcbiAgICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvb2tzTGlrZU5leHRTdGVwKGhlYWRpbmdUZXh0KSkge1xuICAgICAgICAgIG5leHRTdGVwcy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGV2aWRlbmNlLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIG5leHRTdGVwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihidWxsZXRUZXh0KSkge1xuICAgICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb29rc0xpa2VOZXh0U3RlcChidWxsZXRUZXh0KSkge1xuICAgICAgICAgIG5leHRTdGVwcy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24obGluZSkpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGV2aWRlbmNlLnNpemUgPCA0KSB7XG4gICAgICBldmlkZW5jZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFuZXh0U3RlcHMuc2l6ZSkge1xuICAgIG5leHRTdGVwcy5hZGQoXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGAtIFRvcGljOiAke3NhZmVDb2xsYXBzZVdoaXRlc3BhY2UodG9waWMpfWAsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGV2aWRlbmNlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgU291cmNlc1wiLFxuICAgIGZvcm1hdFNvdXJjZXMoc291cmNlTGFiZWwsIHNvdXJjZVBhdGgsIHNvdXJjZVBhdGhzKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG5leHRTdGVwcywgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVG9waWNQYWdlU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIHBhcnNlZC5ldmlkZW5jZSB8fCBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBwYXJzZWQub3BlblF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNvdXJjZXNcIixcbiAgICAgIHBhcnNlZC5zb3VyY2VzIHx8IFwiTm8gc291cmNlcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBwYXJzZWQubmV4dFN0ZXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgXCJObyBzb3VyY2VzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRvcGljUGFnZVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xuICBzb3VyY2VzOiBzdHJpbmc7XG4gIG5leHRTdGVwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcbiAgICBcIk92ZXJ2aWV3XCIgfCBcIkV2aWRlbmNlXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIgfCBcIlNvdXJjZXNcIiB8IFwiTmV4dCBTdGVwc1wiLFxuICAgIHN0cmluZ1tdXG4gID4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIFNvdXJjZXM6IFtdLFxuICAgIFwiTmV4dCBTdGVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaChcbiAgICAgIC9eIyNcXHMrKE92ZXJ2aWV3fEV2aWRlbmNlfE9wZW4gUXVlc3Rpb25zfFNvdXJjZXN8TmV4dCBTdGVwcylcXHMqJC9pLFxuICAgICk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGV2aWRlbmNlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuRXZpZGVuY2UpLFxuICAgIG9wZW5RdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgICBzb3VyY2VzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuU291cmNlcyksXG4gICAgbmV4dFN0ZXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJOZXh0IFN0ZXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbiAgU291cmNlczogc3RyaW5nW107XG4gIFwiTmV4dCBTdGVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJldmlkZW5jZVwiKSB7XG4gICAgcmV0dXJuIFwiRXZpZGVuY2VcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJzb3VyY2VzXCIpIHtcbiAgICByZXR1cm4gXCJTb3VyY2VzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwibmV4dCBzdGVwc1wiKSB7XG4gICAgcmV0dXJuIFwiTmV4dCBTdGVwc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUYXNrVmF1bHRTZXJ2aWNlIHtcbiAgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xuICByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFRhc2tTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBvcGVuVGFza0NvdW50Q2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVGFza1ZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmRUYXNrKHRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhc2sgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2sgPSBgLSBbIF0gJHtjbGVhbmVkfSBfKGFkZGVkICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9KV9gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQoc2V0dGluZ3MudGFza3NGaWxlLCBibG9jayk7XG4gICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB7IHBhdGg6IHNldHRpbmdzLnRhc2tzRmlsZSB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgeyB0ZXh0LCBtdGltZSwgZXhpc3RzIH0gPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dFdpdGhNdGltZShzZXR0aW5ncy50YXNrc0ZpbGUpO1xuICAgIGlmICghZXhpc3RzKSB7XG4gICAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGNvdW50OiAwLFxuICAgICAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSAmJiB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZS5tdGltZSA9PT0gbXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZS5jb3VudDtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IHRleHRcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAvXi0gXFxbKCB8eHxYKVxcXS8udGVzdChsaW5lKSlcbiAgICAgIC5maWx0ZXIoKGxpbmUpID0+ICEvXi0gXFxbKHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAubGVuZ3RoO1xuICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxufVxuIiwgImltcG9ydCB7IHJlcXVlc3RVcmwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvc3VtbWFyeS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyB9IGZyb20gXCIuLi91dGlscy9jb250ZXh0LWZvcm1hdFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5cbnR5cGUgUm91dGVMYWJlbCA9IFwibm90ZVwiIHwgXCJ0YXNrXCIgfCBcImpvdXJuYWxcIiB8IG51bGw7XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvbkNob2ljZSB7XG4gIG1lc3NhZ2U/OiB7XG4gICAgY29udGVudD86IHN0cmluZztcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENoYXRDb21wbGV0aW9uUmVzcG9uc2Uge1xuICBjaG9pY2VzPzogQ2hhdENvbXBsZXRpb25DaG9pY2VbXTtcbn1cblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIGFzeW5jIHN1bW1hcml6ZSh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3Ugc3VtbWFyaXplIG1hcmtkb3duIHZhdWx0IGNvbnRlbnQuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyB2YXVsdCBjb250ZW50IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgdGFza3MuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN1bW1hcnkocmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZUNvbnRleHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZFByb21wdCh0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgcHJvbXB0KTtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHJvdXRlVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxSb3V0ZUxhYmVsPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiQ2xhc3NpZnkgY2FwdHVyZSB0ZXh0IGludG8gZXhhY3RseSBvbmUgb2Y6IG5vdGUsIHRhc2ssIGpvdXJuYWwuIFJldHVybiBvbmUgd29yZCBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkNsYXNzaWZ5IHRoZSBmb2xsb3dpbmcgdXNlciBpbnB1dCBhcyBleGFjdGx5IG9uZSBvZjpcIixcbiAgICAgICAgICBcIm5vdGVcIixcbiAgICAgICAgICBcInRhc2tcIixcbiAgICAgICAgICBcImpvdXJuYWxcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIG9ubHkgb25lIHdvcmQuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgY29uc3QgY2xlYW5lZCA9IHJlc3BvbnNlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjbGVhbmVkID09PSBcIm5vdGVcIiB8fCBjbGVhbmVkID09PSBcInRhc2tcIiB8fCBjbGVhbmVkID09PSBcImpvdXJuYWxcIikge1xuICAgICAgcmV0dXJuIGNsZWFuZWQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgYW5zd2VyUXVlc3Rpb24oXG4gICAgcXVlc3Rpb246IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSBhbnN3ZXIgcXVlc3Rpb25zIHVzaW5nIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgb25seS4gUmVzcG9uZCB3aXRoIGNvbmNpc2UgbWFya2Rvd24gdXNpbmcgdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXN0aW9uIHVzaW5nIG9ubHkgdGhlIGNvbnRleHQgYmVsb3cuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBgUXVlc3Rpb246ICR7cXVlc3Rpb259YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJJZiB0aGUgY29udGV4dCBpcyBpbnN1ZmZpY2llbnQsIHNheSBzbyBleHBsaWNpdGx5LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZShcbiAgICB0b3BpYzogc3RyaW5nLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHR1cm4gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGEgZHVyYWJsZSB3aWtpIHBhZ2UuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkgYW5kIGRvIG5vdCBpbnZlbnQgZmFjdHMuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIGBDcmVhdGUgYSB0b3BpYyBwYWdlIGZvcjogJHt0b3BpY31gLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJSZXR1cm4gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICBgLSBUb3BpYzogJHt0b3BpY31gLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHRoZSBwYWdlIHJldXNhYmxlLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDaGF0Q29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5BSSBBUEkga2V5IGlzIG1pc3NpbmdcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zXCIsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7c2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKX1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1vZGVsOiBzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCksXG4gICAgICAgIG1lc3NhZ2VzLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4yLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzdWx0Lmpzb24gYXMgQ2hhdENvbXBsZXRpb25SZXNwb25zZTtcbiAgICBjb25zdCBjb250ZW50ID0ganNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgPz8gXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRQcm9tcHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4ge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IGFjdGlvbmFibGUgdGFza3MgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IHRhc2tzIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICAgICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgaXRlbXMuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSByZXdyaXRlIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBhIGNsZWFuIG1hcmtkb3duIG5vdGUuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIlJld3JpdGUgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgICAgICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgdGhlIHN0cnVjdHVyZSBvZiBhIHJldXNhYmxlIG5vdGUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgZGVjaXNpb25zIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCBkZWNpc2lvbnMgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICAgICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHVuY2VydGFpbnR5IHdoZXJlIGNvbnRleHQgaXMgaW5jb21wbGV0ZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IHVucmVzb2x2ZWQgcXVlc3Rpb25zIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCBvcGVuIHF1ZXN0aW9ucyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHVuY2VydGFpbnR5IGV4cGxpY2l0LlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGRyYWZ0IGEgcHJvamVjdCBicmllZiBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkRyYWZ0IHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgICAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgICAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHByb2plY3Qgc3RydWN0dXJlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSB0dXJuIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBjb25jaXNlIG1hcmtkb3duIHN5bnRoZXNpcy4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSBpdGVtcy5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCByZXNwb25zZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQocmVzcG9uc2UpO1xuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3VtbWFyeVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgcGFyc2VkLmhpZ2hsaWdodHMgfHwgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyByZWNlbnQgbm90ZXMuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3VtbWFyeVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgaGlnaGxpZ2h0czogc3RyaW5nO1xuICB0YXNrczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJIaWdobGlnaHRzXCIgfCBcIlRhc2tzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIEhpZ2hsaWdodHM6IFtdLFxuICAgIFRhc2tzOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoSGlnaGxpZ2h0c3xUYXNrc3xGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGlnaGxpZ2h0czogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5IaWdobGlnaHRzXSksXG4gICAgdGFza3M6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5UYXNrcyksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBIaWdobGlnaHRzOiBzdHJpbmdbXTtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwidGFza3NcIikge1xuICAgIHJldHVybiBcIlRhc2tzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIkhpZ2hsaWdodHNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi4vc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0TG9jYXRpb24oY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZyB7XG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGNvdW50ID0gY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGg7XG4gICAgcmV0dXJuIGAke2NvbnRleHQuc291cmNlTGFiZWx9IFx1MjAyMiAke2NvdW50fSAke2NvdW50ID09PSAxID8gXCJmaWxlXCIgOiBcImZpbGVzXCJ9YDtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICByZXR1cm4gYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gXHUyMDIyICR7Y29udGV4dC5zb3VyY2VQYXRofWA7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5zb3VyY2VMYWJlbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGxpbmVzID0gW2BDb250ZXh0IHNvdXJjZTogJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBdO1xuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICBsaW5lcy5wdXNoKGBDb250ZXh0IHBhdGg6ICR7Y29udGV4dC5zb3VyY2VQYXRofWApO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChcIkNvbnRleHQgZmlsZXM6XCIpO1xuICAgIGNvbnN0IHZpc2libGUgPSBjb250ZXh0LnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdmlzaWJsZSkge1xuICAgICAgbGluZXMucHVzaChgLSAke3BhdGh9YCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gLi4uYW5kICR7Y29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggLSB2aXNpYmxlLmxlbmd0aH0gbW9yZWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb250ZXh0LnRydW5jYXRlZCkge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBgQ29udGV4dCB3YXMgdHJ1bmNhdGVkIHRvICR7Y29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGxpbmVzID0gW2BTb3VyY2U6ICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXTtcblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgbGluZXMucHVzaChgU291cmNlIHBhdGg6ICR7Y29udGV4dC5zb3VyY2VQYXRofWApO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChcIlNvdXJjZSBmaWxlczpcIik7XG4gICAgY29uc3QgdmlzaWJsZSA9IGNvbnRleHQuc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiB2aXNpYmxlKSB7XG4gICAgICBsaW5lcy5wdXNoKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IHZpc2libGUubGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wdXNoKGAuLi5hbmQgJHtjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCAtIHZpc2libGUubGVuZ3RofSBtb3JlYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnRleHQudHJ1bmNhdGVkKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGBDb250ZXh0IHRydW5jYXRlZCB0byAke2NvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9LmAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcztcbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIFRBYnN0cmFjdEZpbGUsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBub3JtYWxpemVQYXRoLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgY2xhc3MgVmF1bHRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcCkge31cblxuICBhc3luYyBlbnN1cmVLbm93bkZvbGRlcnMoc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5qb3VybmFsRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5ub3Rlc0ZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5ib3hGaWxlKSk7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKHNldHRpbmdzLnRhc2tzRmlsZSkpO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlRm9sZGVyKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZvbGRlclBhdGgpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fS8ke3NlZ21lbnR9YCA6IHNlZ21lbnQ7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50KTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmICghKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZm9sZGVyOiAke2N1cnJlbnR9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBpbml0aWFsQ29udGVudCA9IFwiXCIpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZmlsZTogJHtub3JtYWxpemVkfWApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihub3JtYWxpemVkKSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBpbml0aWFsQ29udGVudCk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9PiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGV4aXN0czogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpLFxuICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgIGV4aXN0czogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBjdXJyZW50Lmxlbmd0aCA9PT0gMFxuICAgICAgPyBcIlwiXG4gICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cXG5cIilcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblwiKVxuICAgICAgICAgID8gXCJcXG5cIlxuICAgICAgICAgIDogXCJcXG5cXG5cIjtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCR7Y3VycmVudH0ke3NlcGFyYXRvcn0ke25vcm1hbGl6ZWRDb250ZW50fWApO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5vcm1hbGl6ZWRDb250ZW50KTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZVVuaXF1ZUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZG90SW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90SW5kZXggPT09IC0xID8gbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90SW5kZXgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdEluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKGRvdEluZGV4KTtcblxuICAgIGxldCBjb3VudGVyID0gMjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtjb3VudGVyfSR7ZXh0ZW5zaW9ufWA7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYXBwZW5kSm91cm5hbEhlYWRlcihmaWxlUGF0aDogc3RyaW5nLCBkYXRlS2V5OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgIyAke2RhdGVLZXl9XFxuXFxuYCk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgbGlzdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJlbnRGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKDAsIGluZGV4KTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHRyaW1UcmFpbGluZ05ld2xpbmVzIH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuaW50ZXJmYWNlIFByb21wdE1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHBsYWNlaG9sZGVyPzogc3RyaW5nO1xuICBzdWJtaXRMYWJlbD86IHN0cmluZztcbiAgbXVsdGlsaW5lPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFByb21wdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBQcm9tcHRNb2RhbE9wdGlvbnMpIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblByb21wdCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICBjb25zdCB0ZXh0YXJlYSA9IGNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgcm93czogXCI4XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSB0ZXh0YXJlYTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciA/PyBcIlwiLFxuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnB1dEVsID0gaW5wdXQ7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLmZvY3VzKCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KHRoaXMub3B0aW9ucy5zdWJtaXRMYWJlbCA/PyBcIlN1Ym1pdFwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkNhbmNlbFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN1Ym1pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IHRyaW1UcmFpbGluZ05ld2xpbmVzKHRoaXMuaW5wdXRFbC52YWx1ZSkudHJpbSgpO1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmZpbmlzaCh2YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaCh2YWx1ZTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUodmFsdWUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVzdWx0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGl0bGVUZXh0OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSByZWFkb25seSBib2R5VGV4dDogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy50aXRsZVRleHQgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IHRoaXMuYm9keVRleHQsXG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmludGVyZmFjZSBGaWxlR3JvdXBQaWNrZXJNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRmlsZVJvdyB7XG4gIGZpbGU6IFRGaWxlO1xuICBjaGVja2JveDogSFRNTElucHV0RWxlbWVudDtcbiAgcm93OiBIVE1MRWxlbWVudDtcbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVHcm91cFBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFRGaWxlW10gfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzZWFyY2hJbnB1dCE6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHByaXZhdGUgcm93czogRmlsZVJvd1tdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBmaWxlczogVEZpbGVbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IEZpbGVHcm91cFBpY2tlck1vZGFsT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5QaWNrZXIoKTogUHJvbWlzZTxURmlsZVtdIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2Ugb25lIG9yIG1vcmUgbm90ZXMgdG8gdXNlIGFzIGNvbnRleHQuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLnNlYXJjaElucHV0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkZpbHRlciBub3Rlcy4uLlwiLFxuICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5zZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5maWx0ZXJSb3dzKHRoaXMuc2VhcmNoSW5wdXQudmFsdWUpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGlzdCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tZmlsZS1ncm91cC1saXN0XCIsXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgdGhpcy5maWxlcykge1xuICAgICAgY29uc3Qgcm93ID0gbGlzdC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWZpbGUtZ3JvdXAtcm93XCIsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICB0eXBlOiBcImNoZWNrYm94XCIsXG4gICAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgcm93LmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIHRleHQ6IGZpbGUucGF0aCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5yb3dzLnB1c2goeyBmaWxlLCBjaGVja2JveCwgcm93IH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJVc2UgU2VsZWN0ZWRcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnJvd3NcbiAgICAgICAgLmZpbHRlcigocm93KSA9PiByb3cuY2hlY2tib3guY2hlY2tlZClcbiAgICAgICAgLm1hcCgocm93KSA9PiByb3cuZmlsZSk7XG4gICAgICBpZiAoIXNlbGVjdGVkLmxlbmd0aCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBub3RlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmZpbmlzaChzZWxlY3RlZCk7XG4gICAgfSk7XG5cbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2FuY2VsXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbHRlclJvd3ModmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHF1ZXJ5ID0gdmFsdWUudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSB7XG4gICAgICBjb25zdCBtYXRjaCA9ICFxdWVyeSB8fCByb3cuZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpO1xuICAgICAgcm93LnJvdy5zdHlsZS5kaXNwbGF5ID0gbWF0Y2ggPyBcIlwiIDogXCJub25lXCI7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2goZmlsZXM6IFRGaWxlW10gfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZShmaWxlcyk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHkgfSBmcm9tIFwiLi4vc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnkgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG50eXBlIFJldmlld0FjdGlvbiA9IFwia2VlcFwiIHwgXCJ0YXNrXCIgfCBcImpvdXJuYWxcIiB8IFwibm90ZVwiIHwgXCJza2lwXCI7XG5cbmV4cG9ydCBjbGFzcyBJbmJveFJldmlld01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGN1cnJlbnRJbmRleCA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGFuZGxlS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4ge1xuICAgIGlmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuYWx0S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAodGFyZ2V0ICYmICh0YXJnZXQudGFnTmFtZSA9PT0gXCJJTlBVVFwiIHx8IHRhcmdldC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uID0ga2V5VG9BY3Rpb24oZXZlbnQua2V5KTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdm9pZCB0aGlzLmhhbmRsZUFjdGlvbihhY3Rpb24pO1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZW50cmllczogSW5ib3hFbnRyeVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmV2aWV3U2VydmljZTogUmV2aWV3U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9uQWN0aW9uQ29tcGxldGU/OiAobWVzc2FnZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZCxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlByb2Nlc3MgSW5ib3hcIiB9KTtcblxuICAgIGlmICghdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyBpbmJveCBlbnRyaWVzIGZvdW5kLlwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICB0ZXh0OiBgRW50cnkgJHt0aGlzLmN1cnJlbnRJbmRleCArIDF9IG9mICR7dGhpcy5lbnRyaWVzLmxlbmd0aH1gLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiaDNcIiwge1xuICAgICAgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGVudHJ5XCIsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgdGV4dDogZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IFwiKGVtcHR5IGVudHJ5KVwiLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBhbiBhY3Rpb24gZm9yIHRoaXMgZW50cnkuIFNob3J0Y3V0czogayBrZWVwLCB0IHRhc2ssIGogam91cm5hbCwgbiBub3RlLCBzIHNraXAuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBidXR0b25Sb3cgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIktlZXAgaW4gaW5ib3hcIiwgXCJrZWVwXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJDb252ZXJ0IHRvIHRhc2tcIiwgXCJ0YXNrXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJBcHBlbmQgdG8gam91cm5hbFwiLCBcImpvdXJuYWxcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIlByb21vdGUgdG8gbm90ZVwiLCBcIm5vdGVcIik7XG4gICAgdGhpcy5hZGRCdXR0b24oYnV0dG9uUm93LCBcIlNraXBcIiwgXCJza2lwXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRCdXR0b24oY29udGFpbmVyOiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZywgYWN0aW9uOiBSZXZpZXdBY3Rpb24pOiB2b2lkIHtcbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBhY3Rpb24gPT09IFwibm90ZVwiID8gXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIiA6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBsYWJlbCxcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmhhbmRsZUFjdGlvbihhY3Rpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBY3Rpb24oYWN0aW9uOiBSZXZpZXdBY3Rpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBsZXQgbWVzc2FnZSA9IFwiXCI7XG4gICAgICBpZiAoYWN0aW9uID09PSBcInRhc2tcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnByb21vdGVUb1Rhc2soZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwiam91cm5hbFwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UuYXBwZW5kVG9Kb3VybmFsKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcIm5vdGVcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnByb21vdGVUb05vdGUoZW50cnkpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwia2VlcFwiKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2Uua2VlcEVudHJ5KGVudHJ5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2Uuc2tpcEVudHJ5KGVudHJ5KTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMub25BY3Rpb25Db21wbGV0ZSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMub25BY3Rpb25Db21wbGV0ZShtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHByb2Nlc3MgcmV2aWV3IGFjdGlvblwiKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jdXJyZW50SW5kZXggKz0gMTtcblxuICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4ID49IHRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkluYm94IHJldmlldyBjb21wbGV0ZVwiKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcHJvY2VzcyBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24ga2V5VG9BY3Rpb24oa2V5OiBzdHJpbmcpOiBSZXZpZXdBY3Rpb24gfCBudWxsIHtcbiAgc3dpdGNoIChrZXkudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgXCJrXCI6XG4gICAgICByZXR1cm4gXCJrZWVwXCI7XG4gICAgY2FzZSBcInRcIjpcbiAgICAgIHJldHVybiBcInRhc2tcIjtcbiAgICBjYXNlIFwialwiOlxuICAgICAgcmV0dXJuIFwiam91cm5hbFwiO1xuICAgIGNhc2UgXCJuXCI6XG4gICAgICByZXR1cm4gXCJub3RlXCI7XG4gICAgY2FzZSBcInNcIjpcbiAgICAgIHJldHVybiBcInNraXBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqXG4gKiBDZW50cmFsaXplZCBlcnJvciBoYW5kbGluZyB1dGlsaXR5XG4gKiBTdGFuZGFyZGl6ZXMgZXJyb3IgcmVwb3J0aW5nIGFjcm9zcyB0aGUgcGx1Z2luXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvcihlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZGVmYXVsdE1lc3NhZ2U7XG4gIG5ldyBOb3RpY2UobWVzc2FnZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3JBbmRSZXRocm93KGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogbmV2ZXIge1xuICBzaG93RXJyb3IoZXJyb3IsIGRlZmF1bHRNZXNzYWdlKTtcbiAgdGhyb3cgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKGRlZmF1bHRNZXNzYWdlKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCB0eXBlIFF1ZXN0aW9uU2NvcGUgPSBcIm5vdGVcIiB8IFwiZ3JvdXBcIiB8IFwiZm9sZGVyXCIgfCBcInZhdWx0XCI7XG5cbmludGVyZmFjZSBRdWVzdGlvblNjb3BlTW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2NvcGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBRdWVzdGlvblNjb3BlTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFF1ZXN0aW9uU2NvcGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSB0aGUgc2NvcGUgQnJhaW4gc2hvdWxkIHVzZSBmb3IgdGhpcyByZXF1ZXN0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkN1cnJlbnQgTm90ZVwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcIm5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlNlbGVjdGVkIE5vdGVzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZ3JvdXBcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkN1cnJlbnQgRm9sZGVyXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZm9sZGVyXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJFbnRpcmUgVmF1bHRcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJ2YXVsdFwiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChzY29wZTogUXVlc3Rpb25TY29wZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHNjb3BlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld0hpc3RvcnlNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBCcmFpblBsdWdpbixcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUmV2aWV3IEhpc3RvcnlcIiB9KTtcblxuICAgIGlmICghdGhpcy5lbnRyaWVzLmxlbmd0aCkge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gcmV2aWV3IGxvZ3MgZm91bmQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIk9wZW4gYSBsb2cgdG8gaW5zcGVjdCBpdCwgb3IgcmUtb3BlbiBhbiBpbmJveCBpdGVtIGlmIGl0IHdhcyBtYXJrZWQgaW5jb3JyZWN0bHkuXCIsXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuZW50cmllcykge1xuICAgICAgY29uc3Qgcm93ID0gY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7IGNsczogXCJicmFpbi1zZWN0aW9uXCIgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IGVudHJ5LmhlYWRpbmcgfHwgXCJVbnRpdGxlZCBpdGVtXCIgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogYCR7ZW50cnkudGltZXN0YW1wfSBcdTIwMjIgJHtlbnRyeS5hY3Rpb259YCxcbiAgICAgIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXJlc3VsdFwiLFxuICAgICAgICB0ZXh0OiBlbnRyeS5wcmV2aWV3IHx8IFwiKGVtcHR5IHByZXZpZXcpXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYnV0dG9ucyA9IHJvdy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICB0ZXh0OiBcIk9wZW4gbG9nXCIsXG4gICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlbkxvZyhlbnRyeS5zb3VyY2VQYXRoKTtcbiAgICAgIH0pO1xuICAgICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgICAgdGV4dDogXCJSZS1vcGVuXCIsXG4gICAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMucmVvcGVuRW50cnkoZW50cnkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuTG9nKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGFic3RyYWN0RmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShhYnN0cmFjdEZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gcmV2aWV3IGxvZ1wiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGFic3RyYWN0RmlsZSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlb3BlbkVudHJ5KGVudHJ5OiBSZXZpZXdMb2dFbnRyeSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgdGhpcy5wbHVnaW4ucmVvcGVuUmV2aWV3RW50cnkoZW50cnkpO1xuICAgICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCByZS1vcGVuIGluYm94IGVudHJ5XCIpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9jb250ZXh0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFN5bnRoZXNpc1Jlc3VsdCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9zeW50aGVzaXMtc2VydmljZVwiO1xuaW1wb3J0IHsgZm9ybWF0Q29udGV4dExvY2F0aW9uIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRleHQtZm9ybWF0XCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5pbnRlcmZhY2UgU3ludGhlc2lzUmVzdWx0TW9kYWxPcHRpb25zIHtcbiAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dDtcbiAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQ7XG4gIGNhbkluc2VydDogYm9vbGVhbjtcbiAgb25JbnNlcnQ6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgb25TYXZlOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIG9uQWN0aW9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG4gIHByaXZhdGUgYnV0dG9uczogSFRNTEJ1dHRvbkVsZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogU3ludGhlc2lzUmVzdWx0TW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogYEJyYWluICR7dGhpcy5vcHRpb25zLnJlc3VsdC50aXRsZX1gIH0pO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQWN0aW9uOiAke3RoaXMub3B0aW9ucy5yZXN1bHQuYWN0aW9ufWAsXG4gICAgfSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXN1bHQucHJvbXB0VGV4dCkge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IGBQcm9tcHQ6ICR7dGhpcy5vcHRpb25zLnJlc3VsdC5wcm9tcHRUZXh0fWAsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQ29udGV4dDogJHtmb3JtYXRDb250ZXh0TG9jYXRpb24odGhpcy5vcHRpb25zLmNvbnRleHQpfWAsXG4gICAgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiB0aGlzLm9wdGlvbnMuY29udGV4dC50cnVuY2F0ZWRcbiAgICAgICAgPyBgQ29udGV4dCB0cnVuY2F0ZWQgdG8gJHt0aGlzLm9wdGlvbnMuY29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7dGhpcy5vcHRpb25zLmNvbnRleHQub3JpZ2luYWxMZW5ndGh9LmBcbiAgICAgICAgOiBgQ29udGV4dCBsZW5ndGg6ICR7dGhpcy5vcHRpb25zLmNvbnRleHQub3JpZ2luYWxMZW5ndGh9IGNoYXJhY3RlcnMuYCxcbiAgICB9KTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiB0aGlzLm9wdGlvbnMucmVzdWx0LmNvbnRlbnQsXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNhbkluc2VydCkge1xuICAgICAgLy8gQnV0dG9ucyBhcmUgcmVuZGVyZWQgYmVsb3cgYWZ0ZXIgb3B0aW9uYWwgZ3VpZGFuY2UgdGV4dC5cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgdG8gaW5zZXJ0IHRoaXMgYXJ0aWZhY3QgdGhlcmUsIG9yIHNhdmUgaXQgdG8gQnJhaW4gbm90ZXMuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICB0aGlzLmJ1dHRvbnMgPSBbXTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FuSW5zZXJ0KSB7XG4gICAgICB0aGlzLmJ1dHRvbnMucHVzaCh0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIkluc2VydCBpbnRvIGN1cnJlbnQgbm90ZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5ydW5BY3Rpb24oKCkgPT4gdGhpcy5vcHRpb25zLm9uSW5zZXJ0KCkpO1xuICAgICAgfSwgdHJ1ZSkpO1xuICAgIH1cblxuICAgIHRoaXMuYnV0dG9ucy5wdXNoKFxuICAgICAgdGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJTYXZlIHRvIEJyYWluIG5vdGVzXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJ1bkFjdGlvbigoKSA9PiB0aGlzLm9wdGlvbnMub25TYXZlKCkpO1xuICAgICAgfSksXG4gICAgICB0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIkNsb3NlXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQnV0dG9uKFxuICAgIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gICAgY3RhID0gZmFsc2UsXG4gICk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidXR0b24gPSBwYXJlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBjdGEgPyBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiIDogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQsXG4gICAgfSk7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5BY3Rpb24oYWN0aW9uOiAoKSA9PiBQcm9taXNlPHN0cmluZz4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy53b3JraW5nID0gdHJ1ZTtcbiAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZCh0cnVlKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgYWN0aW9uKCk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25BY3Rpb25Db21wbGV0ZShtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCB1cGRhdGUgdGhlIHN5bnRoZXNpcyByZXN1bHRcIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXRCdXR0b25zRGlzYWJsZWQoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0QnV0dG9uc0Rpc2FibGVkKGRpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBidXR0b24gb2YgdGhpcy5idXR0b25zKSB7XG4gICAgICBidXR0b24uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy10ZW1wbGF0ZVwiO1xuXG5leHBvcnQgdHlwZSBTeW50aGVzaXNUZW1wbGF0ZSA9XG4gIHwgXCJzdW1tYXJpemVcIlxuICB8IFwiZXh0cmFjdC10YXNrc1wiXG4gIHwgXCJleHRyYWN0LWRlY2lzaW9uc1wiXG4gIHwgXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCJcbiAgfCBcInJld3JpdGUtY2xlYW4tbm90ZVwiXG4gIHwgXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCI7XG5cbmludGVyZmFjZSBUZW1wbGF0ZVBpY2tlck9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogVGVtcGxhdGVQaWNrZXJPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgaG93IEJyYWluIHNob3VsZCBzeW50aGVzaXplIHRoaXMgY29udGV4dC5cIixcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcInN1bW1hcml6ZVwiKSkuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJzdW1tYXJpemVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC10YXNrc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LXRhc2tzXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImV4dHJhY3QtZGVjaXNpb25zXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3QtZGVjaXNpb25zXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcImRyYWZ0LXByb2plY3QtYnJpZWZcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZHJhZnQtcHJvamVjdC1icmllZlwiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaCh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUgfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZSh0ZW1wbGF0ZSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgSXRlbVZpZXcsIE5vdGljZSwgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgY29uc3QgQlJBSU5fVklFV19UWVBFID0gXCJicmFpbi1zaWRlYmFyLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2lkZWJhclZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gIHByaXZhdGUgcmVzdWx0RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzdW1tYXJ5RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBpbmJveENvdW50RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSB0YXNrQ291bnRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHJldmlld0hpc3RvcnlFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGFpU3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzdW1tYXJ5U3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSQUlOX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQnJhaW5cIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpblwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1zaWRlYmFyXCIpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNhcHR1cmUgaWRlYXMsIHN5bnRoZXNpemUgZXhwbGljaXQgY29udGV4dCwgYW5kIHNhdmUgZHVyYWJsZSBtYXJrZG93biBhcnRpZmFjdHMuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVTeW50aGVzaXNTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVBc2tTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVSZXZpZXdTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlU3RhdHVzU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0U2VjdGlvbigpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBzZXRMYXN0UmVzdWx0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMucmVzdWx0RWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIHNldExhc3RTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IFtpbmJveENvdW50LCB0YXNrQ291bnQsIHJldmlld0NvdW50XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMucGx1Z2luLmdldEluYm94Q291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldE9wZW5UYXNrQ291bnQoKSxcbiAgICAgIHRoaXMucGx1Z2luLmdldFJldmlld0hpc3RvcnlDb3VudCgpLFxuICAgIF0pO1xuICAgIGlmICh0aGlzLmluYm94Q291bnRFbCkge1xuICAgICAgdGhpcy5pbmJveENvdW50RWwuc2V0VGV4dChgJHtpbmJveENvdW50fSB1bnJldmlld2VkIGVudHJpZXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudGFza0NvdW50RWwpIHtcbiAgICAgIHRoaXMudGFza0NvdW50RWwuc2V0VGV4dChgJHt0YXNrQ291bnR9IG9wZW4gdGFza3NgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmV2aWV3SGlzdG9yeUVsKSB7XG4gICAgICB0aGlzLnJldmlld0hpc3RvcnlFbC5zZXRUZXh0KGBSZXZpZXcgaGlzdG9yeTogJHtyZXZpZXdDb3VudH0gZW50cmllc2ApO1xuICAgIH1cbiAgICBpZiAodGhpcy5haVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLmFpU3RhdHVzRWwuc2V0VGV4dCh0aGlzLnBsdWdpbi5nZXRBaVN0YXR1c1RleHQoKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN1bW1hcnlTdGF0dXNFbCkge1xuICAgICAgdGhpcy5zdW1tYXJ5U3RhdHVzRWwuc2V0VGV4dCh0aGlzLnBsdWdpbi5nZXRMYXN0U3VtbWFyeUxhYmVsKCkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ2FwdHVyZVNlY3Rpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiUXVpY2sgQ2FwdHVyZVwiIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2FwdHVyZSByb3VnaCBpbnB1dCBpbnRvIHRoZSB2YXVsdCBiZWZvcmUgcmV2aWV3IGFuZCBzeW50aGVzaXMuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmlucHV0RWwgPSBzZWN0aW9uLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNhcHR1cmUtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiVHlwZSBhIG5vdGUsIHRhc2ssIG9yIGpvdXJuYWwgZW50cnkuLi5cIixcbiAgICAgICAgcm93czogXCI4XCIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYXB0dXJlIE5vdGVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVBc05vdGUoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2FwdHVyZSBUYXNrXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlQXNUYXNrKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNhcHR1cmUgSm91cm5hbCBFbnRyeVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuc2F2ZUFzSm91cm5hbCgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDbGVhclwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgbmV3IE5vdGljZShcIkNhcHR1cmUgY2xlYXJlZFwiKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3ludGhlc2lzU2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTeW50aGVzaXplXCIgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJUdXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBzdW1tYXJpZXMsIGNsZWFuIG5vdGVzLCB0YXNrcywgYW5kIGJyaWVmcy5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiU3VtbWFyaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0Q3VycmVudE5vdGUoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiU3ludGhlc2l6ZSBDdXJyZW50IE5vdGUuLi5cIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlV2l0aFRlbXBsYXRlKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkV4dHJhY3QgVGFza3MgRnJvbSBTZWxlY3Rpb25cIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dFNlbGVjdGlvbigpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJEcmFmdCBCcmllZiBGcm9tIEZvbGRlclwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0Q3VycmVudEZvbGRlcigpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDbGVhbiBOb3RlIEZyb20gUmVjZW50IEZpbGVzXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRSZWNlbnRGaWxlcygpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJTeW50aGVzaXplIE5vdGVzLi4uXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc3ludGhlc2l6ZU5vdGVzKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUFza1NlY3Rpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQXNrIEJyYWluXCIgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJBc2sgYSBxdWVzdGlvbiBhYm91dCB0aGUgY3VycmVudCBub3RlLCBhIHNlbGVjdGVkIGdyb3VwLCBhIGZvbGRlciwgb3IgdGhlIHdob2xlIHZhdWx0LlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJBc2sgUXVlc3Rpb24uLi5cIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tRdWVzdGlvbigpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVSZXZpZXdTZWN0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlJldmlld1wiIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiUHJvY2VzcyBjYXB0dXJlZCBpbnB1dCBhbmQga2VlcCB0aGUgZGFpbHkgbG9vcCBtb3ZpbmcuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBidXR0b25zID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlJldmlldyBJbmJveFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnByb2Nlc3NJbmJveCgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJPcGVuIFRvZGF5J3MgSm91cm5hbFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5Ub2RheXNKb3VybmFsKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNyZWF0ZSBUb2RheSBTdW1tYXJ5XCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDEsIFwiVG9kYXlcIik7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNyZWF0ZSBXZWVrbHkgU3VtbWFyeVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyg3LCBcIldlZWtcIik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVRvcGljUGFnZVNlY3Rpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiVG9waWMgUGFnZXNcIiB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkJyYWluXHUyMDE5cyBmbGFnc2hpcCBmbG93OiB0dXJuIGV4cGxpY2l0IGNvbnRleHQgaW50byBhIGR1cmFibGUgbWFya2Rvd24gcGFnZSB5b3UgY2FuIGtlZXAgYnVpbGRpbmcuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBidXR0b25zID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIkNyZWF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIlRvcGljIFBhZ2UgRnJvbSBDdXJyZW50IE5vdGVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5jcmVhdGVUb3BpY1BhZ2VGb3JTY29wZShcIm5vdGVcIik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVBc3Npc3RTZWN0aW9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ2FwdHVyZSBBc3Npc3RcIiB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIlVzZSBBSSBvbmx5IHRvIGNsYXNzaWZ5IGZyZXNoIGNhcHR1cmUgaW50byBub3RlLCB0YXNrLCBvciBqb3VybmFsLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJBdXRvLXJvdXRlIENhcHR1cmVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmF1dG9Sb3V0ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTdGF0dXNTZWN0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0YXR1c1wiIH0pO1xuXG4gICAgY29uc3QgaW5ib3hSb3cgPSBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiSW5ib3g6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICB0aGlzLmluYm94Q291bnRFbCA9IGluYm94Um93O1xuXG4gICAgY29uc3QgdGFza1JvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJUYXNrczogbG9hZGluZy4uLlwiIH0pO1xuICAgIHRoaXMudGFza0NvdW50RWwgPSB0YXNrUm93O1xuXG4gICAgY29uc3QgcmV2aWV3Um93ID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zdGF0dXMtcm93XCIgfSk7XG4gICAgdGhpcy5yZXZpZXdIaXN0b3J5RWwgPSByZXZpZXdSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJSZXZpZXcgaGlzdG9yeTogbG9hZGluZy4uLlwiIH0pO1xuICAgIHJldmlld1Jvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1zbWFsbFwiLFxuICAgICAgdGV4dDogXCJPcGVuXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4ub3BlblJldmlld0hpc3RvcnkoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFpUm93ID0gc2VjdGlvbi5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkFJOiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgdGhpcy5haVN0YXR1c0VsID0gYWlSb3c7XG5cbiAgICBjb25zdCBzdW1tYXJ5Um93ID0gc2VjdGlvbi5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkxhc3QgYXJ0aWZhY3Q6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICB0aGlzLnN1bW1hcnlTdGF0dXNFbCA9IHN1bW1hcnlSb3c7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZU91dHB1dFNlY3Rpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQXJ0aWZhY3RzXCIgfSk7XG5cbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkxhc3QgUmVzdWx0XCIgfSk7XG4gICAgdGhpcy5yZXN1bHRFbCA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW91dHB1dFwiLFxuICAgICAgdGV4dDogXCJObyByZXN1bHQgeWV0LlwiLFxuICAgIH0pO1xuXG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IEFydGlmYWN0XCIgfSk7XG4gICAgdGhpcy5zdW1tYXJ5RWwgPSBzZWN0aW9uLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1vdXRwdXRcIixcbiAgICAgIHRleHQ6IFwiTm8gYXJ0aWZhY3QgZ2VuZXJhdGVkIHlldC5cIixcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzTm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVOb3RlKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzVGFzaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgKHRleHQpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgXCJDb3VsZCBub3Qgc2F2ZSBqb3VybmFsIGVudHJ5XCIsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXV0b1JvdXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5wbHVnaW4ucm91dGVUZXh0KHRleHQpO1xuICAgICAgaWYgKCFyb3V0ZSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gY291bGQgbm90IGNsYXNzaWZ5IHRoYXQgZW50cnlcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChyb3V0ZSA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBjYXB0dXJlIG5vdGVcIixcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAocm91dGUgPT09IFwidGFza1wiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZVRhc2sodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgYXV0by1yb3V0ZSBjYXB0dXJlXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNhcHR1cmUoXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgZmFpbHVyZU1lc3NhZ2U6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHRleHQpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIGZhaWx1cmVNZXNzYWdlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21tYW5kcyhwbHVnaW46IEJyYWluUGx1Z2luKTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjYXB0dXJlLW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIE5vdGVcIiwgXCJDYXB0dXJlXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgICAgIHJldHVybiBgQ2FwdHVyZWQgbm90ZSBpbiAke3NhdmVkLnBhdGh9YDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFza1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFza1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcIkNhcHR1cmUgVGFza1wiLCBcIkNhcHR1cmVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4udGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC1qb3VybmFsLWVudHJ5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFxuICAgICAgICBcIkNhcHR1cmUgSm91cm5hbFwiLFxuICAgICAgICBcIkNhcHR1cmVcIixcbiAgICAgICAgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICAgICAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJwcm9jZXNzLWluYm94XCIsXG4gICAgbmFtZTogXCJCcmFpbjogUmV2aWV3IEluYm94XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwicmV2aWV3LWhpc3RvcnlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzdW1tYXJpemUtdG9kYXlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb2RheSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coMSwgXCJUb2RheVwiKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3VtbWFyaXplLXRoaXMtd2Vla1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFdlZWtseSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coNywgXCJXZWVrXCIpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFzay1mcm9tLXNlbGVjdGlvblwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFzayBGcm9tIFNlbGVjdGlvblwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYWRkVGFza0Zyb21TZWxlY3Rpb24oKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi10b2RheXMtam91cm5hbFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVG9kYXkncyBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuVG9kYXlzSm91cm5hbCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXNpZGViYXJcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIEJyYWluIFNpZGViYXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5bnRoZXNpemUtbm90ZXNcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIE5vdGVzXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5zeW50aGVzaXplTm90ZXMoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3ludGhlc2l6ZS1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhc2stcXVlc3Rpb25cIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza1F1ZXN0aW9uKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFzay1xdWVzdGlvbi1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2VcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jcmVhdGVUb3BpY1BhZ2UoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2UtY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsb0JBQW9EOzs7QUNvQjdDLElBQU0seUJBQThDO0FBQUEsRUFDekQsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsYUFBYTtBQUFBLEVBQ2IsaUJBQWlCO0FBQUEsRUFDakIsZUFBZTtBQUFBLEVBQ2YsbUJBQW1CO0FBQUEsRUFDbkIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IscUJBQXFCO0FBQUEsRUFDckIsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQ3BCO0FBRU8sU0FBUyx1QkFDZCxPQUNxQjtBQUNyQixRQUFNLFNBQThCO0FBQUEsSUFDbEMsR0FBRztBQUFBLElBQ0gsR0FBRztBQUFBLEVBQ0w7QUFFQSxTQUFPO0FBQUEsSUFDTCxXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsTUFDUCx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLElBQ0EsYUFBYTtBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGlCQUFpQjtBQUFBLE1BQ2YsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEs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YyxNQUFNLEtBQUssU0FBUyxlQUFlLEtBQ2pELGNBQWMsTUFBTSxLQUFLLFNBQVMsYUFBYTtBQUFBLEVBRW5EO0FBQUEsRUFFUSxtQkFBbUIsTUFBc0I7QUFDL0MsUUFBSSxDQUFDLEtBQUssS0FBSyxHQUFHO0FBQ2hCLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxLQUFLLFNBQVMsTUFBTSxHQUFHO0FBQ3pCLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxLQUFLLFNBQVMsSUFBSSxHQUFHO0FBQ3ZCLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLGtCQUFrQixTQUF5QjtBQUNqRCxVQUFNLFFBQVEsUUFBUSxLQUFLLEVBQUUsTUFBTSxJQUFJO0FBQ3ZDLFFBQUksQ0FBQyxNQUFNLFFBQVE7QUFDakIsYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLENBQUMsUUFBUSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEdBQUc7QUFDM0IsYUFBTyxRQUFRLEtBQUs7QUFBQSxJQUN0QjtBQUVBLFVBQU0sWUFBWSxNQUFNLE1BQU0sQ0FBQztBQUMvQixXQUFPLFVBQVUsU0FBUyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxHQUFHO0FBQ25ELGdCQUFVLE1BQU07QUFBQSxJQUNsQjtBQUNBLFdBQU8sVUFBVSxLQUFLLElBQUksRUFBRSxLQUFLO0FBQUEsRUFDbkM7QUFBQSxFQUVRLHlCQUFpQztBQS96QjNDO0FBZzBCSSxVQUFNLGFBQWEsS0FBSyxJQUFJLFVBQVUsb0JBQW9CLDhCQUFZO0FBQ3RFLFVBQU0sYUFBWSwwREFBWSxXQUFaLG1CQUFvQixtQkFBcEIsbUJBQW9DLFdBQXBDLFlBQThDO0FBQ2hFLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAic2x1Z2lmeSIsICJ0cmltVGl0bGUiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJnZXRXaW5kb3dTdGFydCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
