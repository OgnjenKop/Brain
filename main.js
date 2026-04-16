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
var import_obsidian17 = require("obsidian");

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
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Tasks file").setDesc("Markdown file used for quick task capture.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.tasksFile,
        (value) => {
          this.plugin.settings.tasksFile = value;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Journal folder").setDesc("Folder containing daily journal files.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.journalFolder,
        (value) => {
          this.plugin.settings.journalFolder = value;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Notes folder").setDesc("Folder used for promoted notes and generated markdown artifacts.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.notesFolder,
        (value) => {
          this.plugin.settings.notesFolder = value;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Summaries folder").setDesc("Folder used for persisted summaries.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.summariesFolder,
        (value) => {
          this.plugin.settings.summariesFolder = value;
        }
      )
    );
    new import_obsidian.Setting(containerEl).setName("Reviews folder").setDesc("Folder used to store inbox review logs.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.reviewsFolder,
        (value) => {
          this.plugin.settings.reviewsFolder = value;
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
        }
      );
    });
    new import_obsidian.Setting(containerEl).setName("OpenAI model").setDesc("Model name used for synthesis, questions, topic pages, and routing requests.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.openAIModel,
        (value) => {
          this.plugin.settings.openAIModel = value;
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
  bindTextSetting(text, value, onValueChange) {
    let currentValue = value;
    let lastSavedValue = value;
    let isSaving = false;
    text.setValue(value).onChange((nextValue) => {
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
      }
    );
    return text;
  }
  queueSaveOnBlur(input, getCurrentValue, getLastSavedValue, setLastSavedValue, isSaving, setSaving) {
    input.addEventListener("blur", () => {
      void this.saveOnBlur(
        getCurrentValue,
        getLastSavedValue,
        setLastSavedValue,
        isSaving,
        setSaving
      );
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        input.blur();
      }
    });
  }
  async saveOnBlur(getCurrentValue, getLastSavedValue, setLastSavedValue, isSaving, setSaving) {
    if (isSaving()) {
      return;
    }
    const currentValue = getCurrentValue();
    if (currentValue === getLastSavedValue()) {
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
var import_obsidian11 = require("obsidian");
var InboxReviewModal = class extends import_obsidian11.Modal {
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
          new import_obsidian11.Notice(message);
        }
      } catch (error) {
        console.error(error);
      }
      this.currentIndex += 1;
      if (this.currentIndex >= this.entries.length) {
        new import_obsidian11.Notice("Inbox review complete");
        this.close();
        return;
      }
      this.render();
    } catch (error) {
      console.error(error);
      new import_obsidian11.Notice("Could not process inbox entry");
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

// src/views/review-history-modal.ts
var import_obsidian13 = require("obsidian");
var ReviewHistoryModal = class extends import_obsidian13.Modal {
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
    if (!(abstractFile instanceof import_obsidian13.TFile)) {
      new import_obsidian13.Notice("Unable to open review log");
      return;
    }
    const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian13.Notice("Unable to open review log");
      return;
    }
    await leaf.openFile(abstractFile);
    this.app.workspace.revealLeaf(leaf);
  }
  async reopenEntry(entry) {
    try {
      const message = await this.plugin.reopenReviewEntry(entry);
      new import_obsidian13.Notice(message);
      this.close();
    } catch (error) {
      console.error(error);
      new import_obsidian13.Notice("Could not re-open inbox entry");
    }
  }
};

// src/views/synthesis-result-modal.ts
var import_obsidian14 = require("obsidian");
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
      console.error(error);
      new import_obsidian14.Notice("Could not update the synthesis result");
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

// src/views/sidebar-view.ts
var import_obsidian16 = require("obsidian");
var BRAIN_VIEW_TYPE = "brain-sidebar-view";
var BrainSidebarView = class extends import_obsidian16.ItemView {
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
      new import_obsidian16.Notice("Capture cleared");
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
      new import_obsidian16.Notice("Enter some text first.");
      return;
    }
    try {
      const route = await this.plugin.routeText(text);
      if (!route) {
        new import_obsidian16.Notice("Brain could not classify that entry");
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
      new import_obsidian16.Notice("Could not auto-route capture");
    }
  }
  async executeCapture(action, failureMessage) {
    const text = this.inputEl.value.trim();
    if (!text) {
      new import_obsidian16.Notice("Enter some text first.");
      return;
    }
    try {
      const result = await action(text);
      await this.plugin.reportActionResult(result);
      this.inputEl.value = "";
    } catch (error) {
      console.error(error);
      new import_obsidian16.Notice(failureMessage);
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
var BrainPlugin = class extends import_obsidian17.Plugin {
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
      new import_obsidian17.Notice("Unable to open the sidebar");
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
      console.error(error);
    }
  }
  async reportActionResult(message) {
    new import_obsidian17.Notice(message);
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
      new import_obsidian17.Notice("AI routing is enabled but OpenAI is not configured");
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
      console.error(error);
      new import_obsidian17.Notice(
        error instanceof Error ? error.message : "Could not synthesize these notes"
      );
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
      console.error(error);
      new import_obsidian17.Notice(error instanceof Error ? error.message : "Could not ask Brain");
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
      new import_obsidian17.Notice(`Topic page saved to ${saved.path}`);
      const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.openFile(saved);
        this.app.workspace.revealLeaf(leaf);
      }
    } catch (error) {
      console.error(error);
      new import_obsidian17.Notice(
        error instanceof Error ? error.message : "Could not create that topic page"
      );
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
    new import_obsidian17.Notice(
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
    const view = this.app.workspace.getActiveViewOfType(import_obsidian17.MarkdownView);
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
      console.error(error);
      new import_obsidian17.Notice("Brain could not save that entry");
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
      new import_obsidian17.Notice("No inbox entries found");
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
    new import_obsidian17.Notice("No selection found. Opening task entry modal.");
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
      new import_obsidian17.Notice("Unable to open today's journal");
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
      console.error(error);
      new import_obsidian17.Notice(
        error instanceof Error ? error.message : "Could not synthesize that context"
      );
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
      console.error(error);
      new import_obsidian17.Notice(
        error instanceof Error ? error.message : "Could not select notes for Brain"
      );
    }
  }
  async pickSelectedMarkdownFiles(title) {
    const files = this.app.vault.getMarkdownFiles().filter((file) => !this.isBrainGeneratedFile(file.path)).sort((left, right) => right.stat.mtime - left.stat.mtime);
    if (!files.length) {
      new import_obsidian17.Notice("No markdown files found");
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
      console.error(error);
      new import_obsidian17.Notice(
        error instanceof Error ? error.message : "Could not answer that question"
      );
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
    return Boolean((_a = this.app.workspace.getActiveViewOfType(import_obsidian17.MarkdownView)) == null ? void 0 : _a.file);
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
      console.error(error);
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
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian17.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvc2VydmljZXMvY29udGV4dC1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy90ZXh0LnRzIiwgInNyYy91dGlscy9wYXRoLnRzIiwgInNyYy91dGlscy9kYXRlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbmJveC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9qb3VybmFsLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL25vdGUtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcXVlc3Rpb24tc2VydmljZS50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdC50cyIsICJzcmMvdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZS50cyIsICJzcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlLnRzIiwgInNyYy91dGlscy9zdW1tYXJ5LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3N5bnRoZXNpcy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Rhc2stZXh0cmFjdC1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3QtZm9ybWF0LnRzIiwgInNyYy91dGlscy9kZWNpc2lvbi1leHRyYWN0LW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvb3Blbi1xdWVzdGlvbnMtZm9ybWF0LnRzIiwgInNyYy91dGlscy9vcGVuLXF1ZXN0aW9ucy1ub3JtYWxpemUudHMiLCAic3JjL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0LnRzIiwgInNyYy91dGlscy9jbGVhbi1ub3RlLW5vcm1hbGl6ZS50cyIsICJzcmMvdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3Byb2plY3QtYnJpZWYtbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9zeW50aGVzaXMtdGVtcGxhdGUudHMiLCAic3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZS50cyIsICJzcmMvdXRpbHMvdG9waWMtcGFnZS1mb3JtYXQudHMiLCAic3JjL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplLnRzIiwgInNyYy9zZXJ2aWNlcy90YXNrLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3N1bW1hcnktbm9ybWFsaXplLnRzIiwgInNyYy91dGlscy9jb250ZXh0LWZvcm1hdC50cyIsICJzcmMvc2VydmljZXMvdmF1bHQtc2VydmljZS50cyIsICJzcmMvdmlld3MvcHJvbXB0LW1vZGFscy50cyIsICJzcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL2luYm94LXJldmlldy1tb2RhbC50cyIsICJzcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWwudHMiLCAic3JjL3ZpZXdzL3Jldmlldy1oaXN0b3J5LW1vZGFsLnRzIiwgInNyYy92aWV3cy9zeW50aGVzaXMtcmVzdWx0LW1vZGFsLnRzIiwgInNyYy92aWV3cy90ZW1wbGF0ZS1waWNrZXItbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyIsICJzcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4sIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBCcmFpblBsdWdpblNldHRpbmdzLFxuICBub3JtYWxpemVCcmFpblNldHRpbmdzLFxufSBmcm9tIFwiLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJyYWluU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5ncy10YWJcIjtcbmltcG9ydCB7IENvbnRleHRTZXJ2aWNlLCBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL2pvdXJuYWwtc2VydmljZVwiO1xuaW1wb3J0IHsgTm90ZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvbm90ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9yZXZpZXctc2VydmljZVwiO1xuaW1wb3J0IHsgUXVlc3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3F1ZXN0aW9uLXNlcnZpY2VcIjtcbmltcG9ydCB7IFN1bW1hcnlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N1bW1hcnktc2VydmljZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0LCBTeW50aGVzaXNTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3N5bnRoZXNpcy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUb3BpY1BhZ2VTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3RvcGljLXBhZ2Utc2VydmljZVwiO1xuaW1wb3J0IHsgVGFza1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdGFzay1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgUHJvbXB0TW9kYWwsXG4gIFJlc3VsdE1vZGFsLFxufSBmcm9tIFwiLi9zcmMvdmlld3MvcHJvbXB0LW1vZGFsc1wiO1xuaW1wb3J0IHsgRmlsZUdyb3VwUGlja2VyTW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvZmlsZS1ncm91cC1waWNrZXItbW9kYWxcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBRdWVzdGlvblNjb3BlTW9kYWwsIFF1ZXN0aW9uU2NvcGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvcXVlc3Rpb24tc2NvcGUtbW9kYWxcIjtcbmltcG9ydCB7IFJldmlld0hpc3RvcnlNb2RhbCB9IGZyb20gXCIuL3NyYy92aWV3cy9yZXZpZXctaGlzdG9yeS1tb2RhbFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc3ludGhlc2lzLXJlc3VsdC1tb2RhbFwiO1xuaW1wb3J0IHsgVGVtcGxhdGVQaWNrZXJNb2RhbCwgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi9zcmMvdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQge1xuICBCUkFJTl9WSUVXX1RZUEUsXG4gIEJyYWluU2lkZWJhclZpZXcsXG59IGZyb20gXCIuL3NyYy92aWV3cy9zaWRlYmFyLXZpZXdcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4vc3JjL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFN1bW1hcnlSZXN1bHQgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvc3VtbWFyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0U291cmNlTGluZXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvY29udGV4dC1mb3JtYXRcIjtcbmltcG9ydCB7IGlzVW5kZXJGb2xkZXIgfSBmcm9tIFwiLi9zcmMvdXRpbHMvcGF0aFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gXCIuL3NyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBpbmJveFNlcnZpY2UhOiBJbmJveFNlcnZpY2U7XG4gIG5vdGVTZXJ2aWNlITogTm90ZVNlcnZpY2U7XG4gIHRhc2tTZXJ2aWNlITogVGFza1NlcnZpY2U7XG4gIGpvdXJuYWxTZXJ2aWNlITogSm91cm5hbFNlcnZpY2U7XG4gIHJldmlld0xvZ1NlcnZpY2UhOiBSZXZpZXdMb2dTZXJ2aWNlO1xuICByZXZpZXdTZXJ2aWNlITogUmV2aWV3U2VydmljZTtcbiAgcXVlc3Rpb25TZXJ2aWNlITogUXVlc3Rpb25TZXJ2aWNlO1xuICBjb250ZXh0U2VydmljZSE6IENvbnRleHRTZXJ2aWNlO1xuICBzeW50aGVzaXNTZXJ2aWNlITogU3ludGhlc2lzU2VydmljZTtcbiAgdG9waWNQYWdlU2VydmljZSE6IFRvcGljUGFnZVNlcnZpY2U7XG4gIGFpU2VydmljZSE6IEJyYWluQUlTZXJ2aWNlO1xuICBzdW1tYXJ5U2VydmljZSE6IFN1bW1hcnlTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGFzdFN1bW1hcnlBdDogRGF0ZSB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy52YXVsdFNlcnZpY2UgPSBuZXcgVmF1bHRTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFpU2VydmljZSA9IG5ldyBCcmFpbkFJU2VydmljZSgpO1xuICAgIHRoaXMuaW5ib3hTZXJ2aWNlID0gbmV3IEluYm94U2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5ub3RlU2VydmljZSA9IG5ldyBOb3RlU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy50YXNrU2VydmljZSA9IG5ldyBUYXNrU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5qb3VybmFsU2VydmljZSA9IG5ldyBKb3VybmFsU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMuY29udGV4dFNlcnZpY2UgPSBuZXcgQ29udGV4dFNlcnZpY2UoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3TG9nU2VydmljZSA9IG5ldyBSZXZpZXdMb2dTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5yZXZpZXdTZXJ2aWNlID0gbmV3IFJldmlld1NlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuaW5ib3hTZXJ2aWNlLFxuICAgICAgdGhpcy50YXNrU2VydmljZSxcbiAgICAgIHRoaXMuam91cm5hbFNlcnZpY2UsXG4gICAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5xdWVzdGlvblNlcnZpY2UgPSBuZXcgUXVlc3Rpb25TZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5zdW1tYXJ5U2VydmljZSA9IG5ldyBTdW1tYXJ5U2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5zeW50aGVzaXNTZXJ2aWNlID0gbmV3IFN5bnRoZXNpc1NlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnRvcGljUGFnZVNlcnZpY2UgPSBuZXcgVG9waWNQYWdlU2VydmljZShcbiAgICAgIHRoaXMuYWlTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuXG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUxhc3RBcnRpZmFjdFRpbWVzdGFtcCgpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoQlJBSU5fVklFV19UWVBFLCAobGVhZikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IG5ldyBCcmFpblNpZGViYXJWaWV3KGxlYWYsIHRoaXMpO1xuICAgICAgdGhpcy5zaWRlYmFyVmlldyA9IHZpZXc7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9KTtcblxuICAgIHJlZ2lzdGVyQ29tbWFuZHModGhpcyk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEJyYWluU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5zaWRlYmFyVmlldyA9IG51bGw7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbG9hZGVkID0gKGF3YWl0IHRoaXMubG9hZERhdGEoKSkgPz8ge307XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MobG9hZGVkKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUtub3duRm9sZGVycyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVMYXN0QXJ0aWZhY3RUaW1lc3RhbXAoKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gIH1cblxuICBhc3luYyBvcGVuU2lkZWJhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdGhlIHNpZGViYXJcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcbiAgICAgIHR5cGU6IEJSQUlOX1ZJRVdfVFlQRSxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9KTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIGdldE9wZW5TaWRlYmFyVmlldygpOiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCB7XG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBsZWF2ZXMpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEJyYWluU2lkZWJhclZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaGFzT3BlblNpZGViYXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgdXBkYXRlU2lkZWJhclJlc3VsdCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5zZXRMYXN0UmVzdWx0KHRleHQpO1xuICB9XG5cbiAgdXBkYXRlU2lkZWJhclN1bW1hcnkodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFN1bW1hcnkodGV4dCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU2lkZWJhclN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KG1lc3NhZ2UpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBnZXRMYXN0U3VtbWFyeUxhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubGFzdFN1bW1hcnlBdCA/IGZvcm1hdERhdGVUaW1lS2V5KHRoaXMubGFzdFN1bW1hcnlBdCkgOiBcIk5vIGFydGlmYWN0IHlldFwiO1xuICB9XG5cbiAgYXN5bmMgcm91dGVUZXh0KHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJBSSByb3V0aW5nIGlzIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnJvdXRlVGV4dCh0ZXh0LCB0aGlzLnNldHRpbmdzKTtcbiAgICBpZiAocm91dGUpIHtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgQXV0by1yb3V0ZWQgYXMgJHtyb3V0ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJvdXRlO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudE5vdGVDb250ZXh0KCksXG4gICAgICBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIixcbiAgICAgIFwic3VtbWFyaXplXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudE5vdGVXaXRoVGVtcGxhdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tCcmFpbkZvckNvbnRleHQoXG4gICAgICAoKSA9PiB0aGlzLmNvbnRleHRTZXJ2aWNlLmdldEN1cnJlbnROb3RlQ29udGV4dCgpLFxuICAgICAgXCJTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBhc2tBYm91dFNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0U2VsZWN0ZWRUZXh0Q29udGV4dCgpLFxuICAgICAgXCJFeHRyYWN0IFRhc2tzIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgICBcImV4dHJhY3QtdGFza3NcIixcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgYXNrQWJvdXRSZWNlbnRGaWxlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0UmVjZW50RmlsZXNDb250ZXh0KCksXG4gICAgICBcIkNsZWFuIE5vdGUgRnJvbSBSZWNlbnQgRmlsZXNcIixcbiAgICAgIFwicmV3cml0ZS1jbGVhbi1ub3RlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGFza0Fib3V0Q3VycmVudEZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza0JyYWluRm9yQ29udGV4dChcbiAgICAgICgpID0+IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKSxcbiAgICAgIFwiRHJhZnQgQnJpZWYgRnJvbSBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHN5bnRoZXNpemVOb3RlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2NvcGUgPSBhd2FpdCBuZXcgUXVlc3Rpb25TY29wZU1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHRpdGxlOiBcIlN5bnRoZXNpemUgTm90ZXNcIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgdGhpcy5yZXNvbHZlQ29udGV4dEZvclNjb3BlKFxuICAgICAgICBzY29wZSxcbiAgICAgICAgXCJTZWxlY3QgTm90ZXMgdG8gU3ludGhlc2l6ZVwiLFxuICAgICAgKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gYXdhaXQgdGhpcy5waWNrU3ludGhlc2lzVGVtcGxhdGUoXCJTeW50aGVzaXplIE5vdGVzXCIpO1xuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucnVuU3ludGhlc2lzRmxvdyhjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoZXNlIG5vdGVzXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRDdXJyZW50Tm90ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoXCJub3RlXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb25BYm91dEN1cnJlbnRGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5hc2tRdWVzdGlvbkZvclNjb3BlKFwiZm9sZGVyXCIpO1xuICB9XG5cbiAgYXN5bmMgYXNrUXVlc3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJBc2sgUXVlc3Rpb25cIixcbiAgICAgIH0pLm9wZW5QaWNrZXIoKTtcbiAgICAgIGlmICghc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkNvdWxkIG5vdCBhc2sgQnJhaW5cIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZUZvclNjb3BlKGRlZmF1bHRTY29wZT86IFF1ZXN0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdG9waWMgPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IFwiQ3JlYXRlIFRvcGljIFBhZ2VcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiVG9waWMgb3IgcXVlc3Rpb24gdG8gdHVybiBpbnRvIGEgd2lraSBwYWdlLi4uXCIsXG4gICAgICAgIHN1Ym1pdExhYmVsOiBcIkNyZWF0ZVwiLFxuICAgICAgICBtdWx0aWxpbmU6IHRydWUsXG4gICAgICB9KS5vcGVuUHJvbXB0KCk7XG4gICAgICBpZiAoIXRvcGljKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NvcGUgPSBkZWZhdWx0U2NvcGUgPz8gYXdhaXQgbmV3IFF1ZXN0aW9uU2NvcGVNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICB0aXRsZTogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgICAgfSkub3BlblBpY2tlcigpO1xuICAgICAgaWYgKCFzY29wZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb250ZXh0Rm9yU2NvcGUoXG4gICAgICAgIHNjb3BlLFxuICAgICAgICBcIlNlbGVjdCBOb3RlcyBmb3IgVG9waWMgUGFnZVwiLFxuICAgICAgKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudG9waWNQYWdlU2VydmljZS5jcmVhdGVUb3BpY1BhZ2UodG9waWMsIGNvbnRleHQpO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLm5vdGVTZXJ2aWNlLmNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICAgIHJlc3VsdC5jb250ZW50LFxuICAgICAgICBjb250ZXh0LnNvdXJjZUxhYmVsLFxuICAgICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICAgIGNvbnRleHQuc291cmNlUGF0aHMsXG4gICAgICApO1xuXG4gICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICAgIHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGBBSSB0b3BpYyBwYWdlIHNhdmVkIHRvICR7c2F2ZWQucGF0aH1gXG4gICAgICAgICAgOiBgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCxcbiAgICAgICk7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgICAgbmV3IE5vdGljZShgVG9waWMgcGFnZSBzYXZlZCB0byAke3NhdmVkLnBhdGh9YCk7XG5cbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgICBpZiAobGVhZikge1xuICAgICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKHNhdmVkKTtcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkNvdWxkIG5vdCBjcmVhdGUgdGhhdCB0b3BpYyBwYWdlXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyhcbiAgICBsb29rYmFja0RheXM/OiBudW1iZXIsXG4gICAgbGFiZWw/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3VtbWFyeVNlcnZpY2UuZ2VuZXJhdGVTdW1tYXJ5KGxvb2tiYWNrRGF5cywgbGFiZWwpO1xuICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShgJHtyZXN1bHQudGl0bGV9XFxuXFxuJHtyZXN1bHQuY29udGVudH1gKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoXG4gICAgICByZXN1bHQudXNlZEFJID8gYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgd2l0aCBBSWAgOiBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCBsb2NhbGx5YCxcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgbmV3IE5vdGljZShcbiAgICAgIHJlc3VsdC5wZXJzaXN0ZWRQYXRoXG4gICAgICAgID8gYCR7cmVzdWx0LnRpdGxlfSBzYXZlZCB0byAke3Jlc3VsdC5wZXJzaXN0ZWRQYXRofWBcbiAgICAgICAgOiByZXN1bHQudXNlZEFJXG4gICAgICAgICAgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYFxuICAgICAgICAgIDogYCR7cmVzdWx0LnRpdGxlfSBnZW5lcmF0ZWQgbG9jYWxseWAsXG4gICAgKTtcbiAgICBpZiAoIXRoaXMuaGFzT3BlblNpZGViYXIoKSkge1xuICAgICAgbmV3IFJlc3VsdE1vZGFsKHRoaXMuYXBwLCBgQnJhaW4gJHtyZXN1bHQudGl0bGV9YCwgcmVzdWx0LmNvbnRlbnQpLm9wZW4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTeW50aGVzaXNSZXN1bHQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuY3JlYXRlR2VuZXJhdGVkTm90ZShcbiAgICAgIHJlc3VsdC5ub3RlVGl0bGUsXG4gICAgICB0aGlzLmJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgcmV0dXJuIGBTYXZlZCBhcnRpZmFjdCB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShcbiAgICByZXN1bHQ6IFN5bnRoZXNpc1Jlc3VsdCxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkaXRpb24gPSB0aGlzLmJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KHJlc3VsdCwgY29udGV4dCk7XG4gICAgY29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG4gICAgY29uc3QgbGFzdExpbmUgPSBlZGl0b3IubGFzdExpbmUoKTtcbiAgICBjb25zdCBsYXN0TGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsYXN0TGluZSk7XG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSB7IGxpbmU6IGxhc3RMaW5lLCBjaDogbGFzdExpbmVUZXh0Lmxlbmd0aCB9O1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IHRoaXMuZ2V0QXBwZW5kU2VwYXJhdG9yKGVkaXRvci5nZXRWYWx1ZSgpKTtcbiAgICBlZGl0b3IucmVwbGFjZVJhbmdlKGAke3NlcGFyYXRvcn0ke2FkZGl0aW9ufVxcbmAsIGVuZFBvc2l0aW9uKTtcbiAgICByZXR1cm4gYEluc2VydGVkIHN5bnRoZXNpcyBpbnRvICR7dmlldy5maWxlLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVGcm9tTW9kYWwoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBzdWJtaXRMYWJlbDogc3RyaW5nLFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIG11bHRpbGluZSA9IGZhbHNlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IG5ldyBQcm9tcHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgdGl0bGUsXG4gICAgICBwbGFjZWhvbGRlcjogbXVsdGlsaW5lXG4gICAgICAgID8gXCJXcml0ZSB5b3VyIGVudHJ5IGhlcmUuLi5cIlxuICAgICAgICA6IFwiVHlwZSBoZXJlLi4uXCIsXG4gICAgICBzdWJtaXRMYWJlbCxcbiAgICAgIG11bHRpbGluZSxcbiAgICB9KS5vcGVuUHJvbXB0KCk7XG5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHZhbHVlKTtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkJyYWluIGNvdWxkIG5vdCBzYXZlIHRoYXQgZW50cnlcIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY2FwdHVyZU5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICByZXR1cm4gYENhcHR1cmVkIG5vdGUgaW4gJHtzYXZlZC5wYXRofWA7XG4gIH1cblxuICBhc3luYyBjYXB0dXJlVGFzayh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVKb3VybmFsKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmpvdXJuYWxTZXJ2aWNlLmFwcGVuZEVudHJ5KHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgam91cm5hbCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NJbmJveCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmdldFJlY2VudEluYm94RW50cmllcygpO1xuICAgIGlmICghZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBpbmJveCBlbnRyaWVzIGZvdW5kXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5ldyBJbmJveFJldmlld01vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzLnJldmlld1NlcnZpY2UsIGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICB9KS5vcGVuKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KGBMb2FkZWQgJHtlbnRyaWVzLmxlbmd0aH0gaW5ib3ggZW50cmllc2ApO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gIH1cblxuICBhc3luYyBvcGVuUmV2aWV3SGlzdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmdldFJldmlld0VudHJpZXMoKTtcbiAgICBuZXcgUmV2aWV3SGlzdG9yeU1vZGFsKHRoaXMuYXBwLCBlbnRyaWVzLCB0aGlzKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBhZGRUYXNrRnJvbVNlbGVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3Rpb24gPSB0aGlzLmdldEFjdGl2ZVNlbGVjdGlvblRleHQoKTtcbiAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayhzZWxlY3Rpb24pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGBTYXZlZCB0YXNrIGZyb20gc2VsZWN0aW9uIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IE5vdGljZShcIk5vIHNlbGVjdGlvbiBmb3VuZC4gT3BlbmluZyB0YXNrIGVudHJ5IG1vZGFsLlwiKTtcbiAgICBhd2FpdCB0aGlzLmNhcHR1cmVGcm9tTW9kYWwoXCJBZGQgVGFza1wiLCBcIlNhdmUgdGFza1wiLCBhc3luYyAodGV4dCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICByZXR1cm4gYFNhdmVkIHRhc2sgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBvcGVuVG9kYXlzSm91cm5hbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5lbnN1cmVKb3VybmFsRmlsZSgpO1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdG9kYXkncyBqb3VybmFsXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgY29uc3QgbWVzc2FnZSA9IGBPcGVuZWQgJHtmaWxlLnBhdGh9YDtcbiAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIGdldEluYm94Q291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbmJveFNlcnZpY2UuZ2V0VW5yZXZpZXdlZENvdW50KCk7XG4gIH1cblxuICBhc3luYyBnZXRPcGVuVGFza0NvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudGFza1NlcnZpY2UuZ2V0T3BlblRhc2tDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3SGlzdG9yeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMucmV2aWV3TG9nU2VydmljZS5nZXRSZXZpZXdFbnRyeUNvdW50KCk7XG4gIH1cblxuICBhc3luYyByZW9wZW5SZXZpZXdFbnRyeShlbnRyeToge1xuICAgIGhlYWRpbmc6IHN0cmluZztcbiAgICBwcmV2aWV3OiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlOiBzdHJpbmc7XG4gICAgc2lnbmF0dXJlSW5kZXg6IG51bWJlcjtcbiAgfSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnJlb3BlbkZyb21SZXZpZXdMb2coe1xuICAgICAgYWN0aW9uOiBcInJlb3BlblwiLFxuICAgICAgdGltZXN0YW1wOiBcIlwiLFxuICAgICAgc291cmNlUGF0aDogXCJcIixcbiAgICAgIGZpbGVNdGltZTogRGF0ZS5ub3coKSxcbiAgICAgIGVudHJ5SW5kZXg6IDAsXG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGVudHJ5LnByZXZpZXcsXG4gICAgICBzaWduYXR1cmU6IGVudHJ5LnNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBlbnRyeS5zaWduYXR1cmVJbmRleCxcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRBaVN0YXR1c1RleHQoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgJiYgIXRoaXMuc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICByZXR1cm4gXCJBSSBvZmZcIjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAodGhpcy5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcyB8fCB0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykgJiZcbiAgICAgICghdGhpcy5zZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpIHx8ICF0aGlzLnNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBcIkFJIGVuYWJsZWQgYnV0IG1pc3Npbmcga2V5XCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiQUkgY29uZmlndXJlZFwiO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tCcmFpbkZvckNvbnRleHQoXG4gICAgcmVzb2x2ZXI6ICgpID0+IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4sXG4gICAgbW9kYWxUaXRsZTogc3RyaW5nLFxuICAgIGRlZmF1bHRUZW1wbGF0ZT86IFN5bnRoZXNpc1RlbXBsYXRlLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHJlc29sdmVyKCk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRlZmF1bHRUZW1wbGF0ZSA/PyAoYXdhaXQgdGhpcy5waWNrU3ludGhlc2lzVGVtcGxhdGUobW9kYWxUaXRsZSkpO1xuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMucnVuU3ludGhlc2lzRmxvdyhjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkNvdWxkIG5vdCBzeW50aGVzaXplIHRoYXQgY29udGV4dFwiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uRm9yU2NvcGUoc2NvcGU6IFF1ZXN0aW9uU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBzd2l0Y2ggKHNjb3BlKSB7XG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBDdXJyZW50IE5vdGVcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcImZvbGRlclwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Rm9sZGVyQ29udGV4dCgpLFxuICAgICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIGNhc2UgXCJ2YXVsdFwiOlxuICAgICAgICBhd2FpdCB0aGlzLmFza1F1ZXN0aW9uV2l0aENvbnRleHQoXG4gICAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRWYXVsdENvbnRleHQoKSxcbiAgICAgICAgICBcIkFzayBRdWVzdGlvbiBBYm91dCBFbnRpcmUgVmF1bHRcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSBcImdyb3VwXCI6XG4gICAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25BYm91dFNlbGVjdGVkR3JvdXAoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUNvbnRleHRGb3JTY29wZShcbiAgICBzY29wZTogUXVlc3Rpb25TY29wZSxcbiAgICBncm91cFBpY2tlclRpdGxlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dCB8IG51bGw+IHtcbiAgICBzd2l0Y2ggKHNjb3BlKSB7XG4gICAgICBjYXNlIFwibm90ZVwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRDdXJyZW50Tm90ZUNvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJmb2xkZXJcIjpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29udGV4dFNlcnZpY2UuZ2V0Q3VycmVudEZvbGRlckNvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJ2YXVsdFwiOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRWYXVsdENvbnRleHQoKTtcbiAgICAgIGNhc2UgXCJncm91cFwiOiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5waWNrU2VsZWN0ZWRNYXJrZG93bkZpbGVzKGdyb3VwUGlja2VyVGl0bGUpO1xuICAgICAgICBpZiAoIWZpbGVzIHx8ICFmaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlcyk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFza1F1ZXN0aW9uQWJvdXRTZWxlY3RlZEdyb3VwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGlja1NlbGVjdGVkTWFya2Rvd25GaWxlcyhcIlNlbGVjdCBOb3Rlc1wiKTtcbiAgICAgIGlmICghZmlsZXMgfHwgIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuYXNrUXVlc3Rpb25XaXRoQ29udGV4dChcbiAgICAgICAgKCkgPT4gdGhpcy5jb250ZXh0U2VydmljZS5nZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlcyksXG4gICAgICAgIFwiQXNrIFF1ZXN0aW9uIEFib3V0IFNlbGVjdGVkIE5vdGVzXCIsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJDb3VsZCBub3Qgc2VsZWN0IG5vdGVzIGZvciBCcmFpblwiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBpY2tTZWxlY3RlZE1hcmtkb3duRmlsZXModGl0bGU6IHN0cmluZyk6IFByb21pc2U8VEZpbGVbXSB8IG51bGw+IHtcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuYXBwLnZhdWx0XG4gICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhdGhpcy5pc0JyYWluR2VuZXJhdGVkRmlsZShmaWxlLnBhdGgpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcblxuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbWFya2Rvd24gZmlsZXMgZm91bmRcIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgbmV3IEZpbGVHcm91cFBpY2tlck1vZGFsKHRoaXMuYXBwLCBmaWxlcywge1xuICAgICAgdGl0bGUsXG4gICAgfSkub3BlblBpY2tlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc2tRdWVzdGlvbldpdGhDb250ZXh0KFxuICAgIHJlc29sdmVyOiAoKSA9PiBQcm9taXNlPFN5bnRoZXNpc0NvbnRleHQ+LFxuICAgIG1vZGFsVGl0bGU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCByZXNvbHZlcigpO1xuICAgICAgY29uc3QgcXVlc3Rpb24gPSBhd2FpdCBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgdGl0bGU6IG1vZGFsVGl0bGUsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhIHF1ZXN0aW9uIGFib3V0IHRoaXMgY29udGV4dC4uLlwiLFxuICAgICAgICBzdWJtaXRMYWJlbDogXCJBc2tcIixcbiAgICAgICAgbXVsdGlsaW5lOiB0cnVlLFxuICAgICAgfSkub3BlblByb21wdCgpO1xuICAgICAgaWYgKCFxdWVzdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlc3Rpb25TZXJ2aWNlLmFuc3dlclF1ZXN0aW9uKHF1ZXN0aW9uLCBjb250ZXh0KTtcbiAgICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICAgID8gYEFJIGFuc3dlciBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXG4gICAgICAgICAgOiBgTG9jYWwgYW5zd2VyIGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWAsXG4gICAgICApO1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBjb250ZXh0LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIGNhbkluc2VydDogdGhpcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgICAgb25JbnNlcnQ6IGFzeW5jICgpID0+IHRoaXMuaW5zZXJ0U3ludGhlc2lzSW50b0N1cnJlbnROb3RlKHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uU2F2ZTogYXN5bmMgKCkgPT4gdGhpcy5zYXZlU3ludGhlc2lzUmVzdWx0KHJlc3VsdCwgY29udGV4dCksXG4gICAgICAgIG9uQWN0aW9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQobWVzc2FnZSk7XG4gICAgICAgIH0sXG4gICAgICB9KS5vcGVuKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkNvdWxkIG5vdCBhbnN3ZXIgdGhhdCBxdWVzdGlvblwiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blN5bnRoZXNpc0Zsb3coXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgICB0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3ludGhlc2lzU2VydmljZS5ydW4odGVtcGxhdGUsIGNvbnRleHQpO1xuICAgIHRoaXMubGFzdFN1bW1hcnlBdCA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyU3VtbWFyeShyZXN1bHQuY29udGVudCk7XG4gICAgdGhpcy51cGRhdGVTaWRlYmFyUmVzdWx0KFxuICAgICAgcmVzdWx0LnVzZWRBSVxuICAgICAgICA/IGBBSSAke3Jlc3VsdC50aXRsZS50b0xvd2VyQ2FzZSgpfSBmcm9tICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXG4gICAgICAgIDogYExvY2FsICR7cmVzdWx0LnRpdGxlLnRvTG93ZXJDYXNlKCl9IGZyb20gJHtjb250ZXh0LnNvdXJjZUxhYmVsfWAsXG4gICAgKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIG5ldyBTeW50aGVzaXNSZXN1bHRNb2RhbCh0aGlzLmFwcCwge1xuICAgICAgY29udGV4dCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIGNhbkluc2VydDogdGhpcy5oYXNBY3RpdmVNYXJrZG93bk5vdGUoKSxcbiAgICAgIG9uSW5zZXJ0OiBhc3luYyAoKSA9PiB0aGlzLmluc2VydFN5bnRoZXNpc0ludG9DdXJyZW50Tm90ZShyZXN1bHQsIGNvbnRleHQpLFxuICAgICAgb25TYXZlOiBhc3luYyAoKSA9PiB0aGlzLnNhdmVTeW50aGVzaXNSZXN1bHQocmVzdWx0LCBjb250ZXh0KSxcbiAgICAgIG9uQWN0aW9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgfSxcbiAgICB9KS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBpY2tTeW50aGVzaXNUZW1wbGF0ZShcbiAgICB0aXRsZTogc3RyaW5nLFxuICApOiBQcm9taXNlPFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbD4ge1xuICAgIHJldHVybiBhd2FpdCBuZXcgVGVtcGxhdGVQaWNrZXJNb2RhbCh0aGlzLmFwcCwgeyB0aXRsZSB9KS5vcGVuUGlja2VyKCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkU3ludGhlc2lzTm90ZUNvbnRlbnQoXG4gICAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQsXG4gICAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dCxcbiAgKTogc3RyaW5nIHtcbiAgICByZXR1cm4gW1xuICAgICAgYEFjdGlvbjogJHtyZXN1bHQuYWN0aW9ufWAsXG4gICAgICBgR2VuZXJhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWAsXG4gICAgICBgQ29udGV4dCBsZW5ndGg6ICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0gY2hhcmFjdGVycy5gLFxuICAgICAgXCJcIixcbiAgICAgIHRoaXMuc3RyaXBMZWFkaW5nVGl0bGUocmVzdWx0LmNvbnRlbnQpLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkSW5zZXJ0ZWRTeW50aGVzaXNDb250ZW50KFxuICAgIHJlc3VsdDogU3ludGhlc2lzUmVzdWx0LFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFtcbiAgICAgIGAjIyBCcmFpbiAke3Jlc3VsdC50aXRsZX1gLFxuICAgICAgLi4udGhpcy5idWlsZENvbnRleHRCdWxsZXRMaW5lcyhjb250ZXh0KSxcbiAgICAgIGAtIEdlbmVyYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX1gLFxuICAgICAgXCJcIixcbiAgICAgIHRoaXMuc3RyaXBMZWFkaW5nVGl0bGUocmVzdWx0LmNvbnRlbnQpLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFzQWN0aXZlTWFya2Rvd25Ob3RlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk/LmZpbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvbnRleHRTb3VyY2VMaW5lcyhjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogc3RyaW5nW10ge1xuICAgIHJldHVybiBmb3JtYXRDb250ZXh0U291cmNlTGluZXMoY29udGV4dCk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29udGV4dEJ1bGxldExpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgc291cmNlTGluZXMgPSB0aGlzLmJ1aWxkQ29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQpO1xuICAgIHJldHVybiBzb3VyY2VMaW5lcy5tYXAoKGxpbmUpID0+IGAtICR7bGluZX1gKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5pdGlhbGl6ZUxhc3RBcnRpZmFjdFRpbWVzdGFtcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgICAgbGV0IGxhdGVzdCA9IDA7XG4gICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQXJ0aWZhY3RGaWxlKGZpbGUucGF0aCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsZS5zdGF0Lm10aW1lID4gbGF0ZXN0KSB7XG4gICAgICAgICAgbGF0ZXN0ID0gZmlsZS5zdGF0Lm10aW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmxhc3RTdW1tYXJ5QXQgPSBsYXRlc3QgPiAwID8gbmV3IERhdGUobGF0ZXN0KSA6IG51bGw7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzQXJ0aWZhY3RGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Mubm90ZXNGb2xkZXIpIHx8XG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGlzQnJhaW5HZW5lcmF0ZWRGaWxlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBpc1VuZGVyRm9sZGVyKHBhdGgsIHRoaXMuc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKSB8fFxuICAgICAgaXNVbmRlckZvbGRlcihwYXRoLCB0aGlzLnNldHRpbmdzLnJldmlld3NGb2xkZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBwZW5kU2VwYXJhdG9yKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiXFxuXFxuXCIpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgaWYgKHRleHQuZW5kc1dpdGgoXCJcXG5cIikpIHtcbiAgICAgIHJldHVybiBcIlxcblwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJcXG5cXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgc3RyaXBMZWFkaW5nVGl0bGUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuICAgIGlmICghbGluZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBpZiAoIS9eI1xccysvLnRlc3QobGluZXNbMF0pKSB7XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtYWluaW5nID0gbGluZXMuc2xpY2UoMSk7XG4gICAgd2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwICYmICFyZW1haW5pbmdbMF0udHJpbSgpKSB7XG4gICAgICByZW1haW5pbmcuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlbWFpbmluZy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IG51bWJlcjtcbiAgc3VtbWFyeU1heENoYXJzOiBudW1iZXI7XG5cbiAgcGVyc2lzdFN1bW1hcmllczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQlJBSU5fU0VUVElOR1M6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gIGluYm94RmlsZTogXCJCcmFpbi9pbmJveC5tZFwiLFxuICB0YXNrc0ZpbGU6IFwiQnJhaW4vdGFza3MubWRcIixcbiAgam91cm5hbEZvbGRlcjogXCJCcmFpbi9qb3VybmFsXCIsXG4gIG5vdGVzRm9sZGVyOiBcIkJyYWluL25vdGVzXCIsXG4gIHN1bW1hcmllc0ZvbGRlcjogXCJCcmFpbi9zdW1tYXJpZXNcIixcbiAgcmV2aWV3c0ZvbGRlcjogXCJCcmFpbi9yZXZpZXdzXCIsXG4gIGVuYWJsZUFJU3VtbWFyaWVzOiBmYWxzZSxcbiAgZW5hYmxlQUlSb3V0aW5nOiBmYWxzZSxcbiAgb3BlbkFJQXBpS2V5OiBcIlwiLFxuICBvcGVuQUlNb2RlbDogXCJncHQtNC4xLW1pbmlcIixcbiAgc3VtbWFyeUxvb2tiYWNrRGF5czogNyxcbiAgc3VtbWFyeU1heENoYXJzOiAxMjAwMCxcbiAgcGVyc2lzdFN1bW1hcmllczogdHJ1ZSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmFpblNldHRpbmdzKFxuICBpbnB1dDogUGFydGlhbDxCcmFpblBsdWdpblNldHRpbmdzPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIGNvbnN0IG1lcmdlZDogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgICAuLi5ERUZBVUxUX0JSQUlOX1NFVFRJTkdTLFxuICAgIC4uLmlucHV0LFxuICB9IGFzIEJyYWluUGx1Z2luU2V0dGluZ3M7XG5cbiAgcmV0dXJuIHtcbiAgICBpbmJveEZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChtZXJnZWQuaW5ib3hGaWxlLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmluYm94RmlsZSksXG4gICAgdGFza3NGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgobWVyZ2VkLnRhc2tzRmlsZSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy50YXNrc0ZpbGUpLFxuICAgIGpvdXJuYWxGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5qb3VybmFsRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5qb3VybmFsRm9sZGVyLFxuICAgICksXG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBzdW1tYXJpZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5zdW1tYXJpZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcmllc0ZvbGRlcixcbiAgICApLFxuICAgIHJldmlld3NGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5yZXZpZXdzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5yZXZpZXdzRm9sZGVyLFxuICAgICksXG4gICAgZW5hYmxlQUlTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLmVuYWJsZUFJU3VtbWFyaWVzKSxcbiAgICBlbmFibGVBSVJvdXRpbmc6IEJvb2xlYW4obWVyZ2VkLmVuYWJsZUFJUm91dGluZyksXG4gICAgb3BlbkFJQXBpS2V5OiB0eXBlb2YgbWVyZ2VkLm9wZW5BSUFwaUtleSA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5vcGVuQUlBcGlLZXkudHJpbSgpIDogXCJcIixcbiAgICBvcGVuQUlNb2RlbDpcbiAgICAgIHR5cGVvZiBtZXJnZWQub3BlbkFJTW9kZWwgPT09IFwic3RyaW5nXCIgJiYgbWVyZ2VkLm9wZW5BSU1vZGVsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5vcGVuQUlNb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm9wZW5BSU1vZGVsLFxuICAgIHN1bW1hcnlMb29rYmFja0RheXM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeUxvb2tiYWNrRGF5cywgMSwgMzY1LCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgIHN1bW1hcnlNYXhDaGFyczogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TWF4Q2hhcnMsIDEwMDAsIDEwMDAwMCwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgIHBlcnNpc3RTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLnBlcnNpc3RTdW1tYXJpZXMpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGl2ZVBhdGgodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBjbGFtcEludGVnZXIoXG4gIHZhbHVlOiB1bmtub3duLFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXIsXG4gIGZhbGxiYWNrOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBwYXJzZWQpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBUZXh0Q29tcG9uZW50IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW4gU2V0dGluZ3NcIiB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0b3JhZ2VcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbmJveCBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgbm90ZSBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiVGFza3MgZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHVzZWQgZm9yIHF1aWNrIHRhc2sgY2FwdHVyZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRhc2tzRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkpvdXJuYWwgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciBjb250YWluaW5nIGRhaWx5IGpvdXJuYWwgZmlsZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcHJvbW90ZWQgbm90ZXMgYW5kIGdlbmVyYXRlZCBtYXJrZG93biBhcnRpZmFjdHMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3VtbWFyaWVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcGVyc2lzdGVkIHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcmllc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJldmlld3MgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkZvbGRlciB1c2VkIHRvIHN0b3JlIGluYm94IHJldmlldyBsb2dzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV2aWV3c0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFJXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHN5bnRoZXNpc1wiKVxuICAgICAgLnNldERlc2MoXCJVc2UgT3BlbkFJIGZvciBzeW50aGVzaXMsIHF1ZXN0aW9uIGFuc3dlcmluZywgYW5kIHRvcGljIHBhZ2VzIHdoZW4gY29uZmlndXJlZC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHJvdXRpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiQWxsb3cgdGhlIHNpZGViYXIgdG8gYXV0by1yb3V0ZSBjYXB0dXJlcyB3aXRoIEFJLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk9wZW5BSSBBUEkga2V5XCIpXG4gICAgICAuc2V0RGVzYyhcIlN0b3JlZCBsb2NhbGx5IGluIHBsdWdpbiBzZXR0aW5ncy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwic2stLi4uXCIpO1xuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJPcGVuQUkgbW9kZWxcIilcbiAgICAgIC5zZXREZXNjKFwiTW9kZWwgbmFtZSB1c2VkIGZvciBzeW50aGVzaXMsIHF1ZXN0aW9ucywgdG9waWMgcGFnZXMsIGFuZCByb3V0aW5nIHJlcXVlc3RzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuQUlNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29udGV4dCBDb2xsZWN0aW9uXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTG9va2JhY2sgZGF5c1wiKVxuICAgICAgLnNldERlc2MoXCJIb3cgZmFyIGJhY2sgdG8gc2NhbiB3aGVuIGJ1aWxkaW5nIHJlY2VudC1jb250ZXh0IHN1bW1hcmllcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzKSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyA9XG4gICAgICAgICAgICAgIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpICYmIHBhcnNlZCA+IDAgPyBwYXJzZWQgOiA3O1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1heGltdW0gY2hhcmFjdGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJNYXhpbXVtIHRleHQgY29sbGVjdGVkIGJlZm9yZSBzeW50aGVzaXMgb3Igc3VtbWFyeS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMgPVxuICAgICAgICAgICAgICBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPj0gMTAwMCA/IHBhcnNlZCA6IDEyMDAwO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3VtbWFyeSBPdXRwdXRcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJQZXJzaXN0IHN1bW1hcmllc1wiKVxuICAgICAgLnNldERlc2MoXCJXcml0ZSBnZW5lcmF0ZWQgc3VtbWFyaWVzIGludG8gdGhlIHZhdWx0LlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICk6IFRleHRDb21wb25lbnQge1xuICAgIGxldCBjdXJyZW50VmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgbGFzdFNhdmVkVmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgaXNTYXZpbmcgPSBmYWxzZTtcblxuICAgIHRleHQuc2V0VmFsdWUodmFsdWUpLm9uQ2hhbmdlKChuZXh0VmFsdWUpID0+IHtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlU2F2ZU9uQmx1cihcbiAgICAgIHRleHQuaW5wdXRFbCxcbiAgICAgICgpID0+IGN1cnJlbnRWYWx1ZSxcbiAgICAgICgpID0+IGxhc3RTYXZlZFZhbHVlLFxuICAgICAgKHNhdmVkVmFsdWUpID0+IHtcbiAgICAgICAgbGFzdFNhdmVkVmFsdWUgPSBzYXZlZFZhbHVlO1xuICAgICAgfSxcbiAgICAgICgpID0+IGlzU2F2aW5nLFxuICAgICAgKHNhdmluZykgPT4ge1xuICAgICAgICBpc1NhdmluZyA9IHNhdmluZztcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVTYXZlT25CbHVyKFxuICAgIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50LFxuICAgIGdldEN1cnJlbnRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIGdldExhc3RTYXZlZFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgc2V0TGFzdFNhdmVkVmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIGlzU2F2aW5nOiAoKSA9PiBib29sZWFuLFxuICAgIHNldFNhdmluZzogKHNhdmluZzogYm9vbGVhbikgPT4gdm9pZCxcbiAgKTogdm9pZCB7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVPbkJsdXIoXG4gICAgICAgIGdldEN1cnJlbnRWYWx1ZSxcbiAgICAgICAgZ2V0TGFzdFNhdmVkVmFsdWUsXG4gICAgICAgIHNldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBpc1NhdmluZyxcbiAgICAgICAgc2V0U2F2aW5nLFxuICAgICAgKTtcbiAgICB9KTtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiZcbiAgICAgICAgIWV2ZW50Lm1ldGFLZXkgJiZcbiAgICAgICAgIWV2ZW50LmN0cmxLZXkgJiZcbiAgICAgICAgIWV2ZW50LmFsdEtleSAmJlxuICAgICAgICAhZXZlbnQuc2hpZnRLZXlcbiAgICAgICkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVPbkJsdXIoXG4gICAgZ2V0Q3VycmVudFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgZ2V0TGFzdFNhdmVkVmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRMYXN0U2F2ZWRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgaXNTYXZpbmc6ICgpID0+IGJvb2xlYW4sXG4gICAgc2V0U2F2aW5nOiAoc2F2aW5nOiBib29sZWFuKSA9PiB2b2lkLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoaXNTYXZpbmcoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGdldEN1cnJlbnRWYWx1ZSgpO1xuICAgIGlmIChjdXJyZW50VmFsdWUgPT09IGdldExhc3RTYXZlZFZhbHVlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRTYXZpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgc2V0TGFzdFNhdmVkVmFsdWUoY3VycmVudFZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2F2aW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBpc1VuZGVyRm9sZGVyIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGhcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGhlc2lzQ29udGV4dCB7XG4gIHNvdXJjZUxhYmVsOiBzdHJpbmc7XG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGw7XG4gIHNvdXJjZVBhdGhzPzogc3RyaW5nW107XG4gIHRleHQ6IHN0cmluZztcbiAgb3JpZ2luYWxMZW5ndGg6IG51bWJlcjtcbiAgdHJ1bmNhdGVkOiBib29sZWFuO1xuICBtYXhDaGFyczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgQ29udGV4dFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0Q3VycmVudE5vdGVDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IHZpZXcuZWRpdG9yLmdldFZhbHVlKCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBub3RlIGlzIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1aWxkQ29udGV4dChcIkN1cnJlbnQgbm90ZVwiLCB2aWV3LmZpbGUucGF0aCwgdGV4dCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZFRleHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IHZpZXcuZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlbGVjdCBzb21lIHRleHQgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRDb250ZXh0KFwiU2VsZWN0ZWQgdGV4dFwiLCB2aWV3LmZpbGUucGF0aCwgdGV4dCk7XG4gIH1cblxuICBhc3luYyBnZXRSZWNlbnRGaWxlc0NvbnRleHQoKTogUHJvbWlzZTxTeW50aGVzaXNDb250ZXh0PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdFJlY2VudE1hcmtkb3duRmlsZXMoc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cyk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiUmVjZW50IGZpbGVzXCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIGFzeW5jIGdldEN1cnJlbnRGb2xkZXJDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldz8uZmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IHZpZXcuZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuY29sbGVjdEZpbGVzSW5Gb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiQ3VycmVudCBmb2xkZXJcIiwgZmlsZXMsIGZvbGRlclBhdGggfHwgbnVsbCk7XG4gIH1cblxuICBhc3luYyBnZXRTZWxlY3RlZEZpbGVzQ29udGV4dChmaWxlczogVEZpbGVbXSk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIG1hcmtkb3duIG5vdGVcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiU2VsZWN0ZWQgbm90ZXNcIiwgZmlsZXMsIG51bGwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VmF1bHRDb250ZXh0KCk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5jb2xsZWN0VmF1bHRNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGaWxlR3JvdXBDb250ZXh0KFwiRW50aXJlIHZhdWx0XCIsIGZpbGVzLCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb250ZXh0KFxuICAgIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgc291cmNlUGF0aHM/OiBzdHJpbmdbXSxcbiAgKTogU3ludGhlc2lzQ29udGV4dCB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBtYXhDaGFycyA9IE1hdGgubWF4KDEwMDAsIHNldHRpbmdzLnN1bW1hcnlNYXhDaGFycyk7XG4gICAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICAgIGNvbnN0IG9yaWdpbmFsTGVuZ3RoID0gdHJpbW1lZC5sZW5ndGg7XG4gICAgY29uc3QgdHJ1bmNhdGVkID0gb3JpZ2luYWxMZW5ndGggPiBtYXhDaGFycztcbiAgICBjb25zdCBsaW1pdGVkID0gdHJ1bmNhdGVkID8gdHJpbW1lZC5zbGljZSgwLCBtYXhDaGFycykudHJpbUVuZCgpIDogdHJpbW1lZDtcblxuICAgIHJldHVybiB7XG4gICAgICBzb3VyY2VMYWJlbCxcbiAgICAgIHNvdXJjZVBhdGgsXG4gICAgICBzb3VyY2VQYXRocyxcbiAgICAgIHRleHQ6IGxpbWl0ZWQsXG4gICAgICBvcmlnaW5hbExlbmd0aCxcbiAgICAgIHRydW5jYXRlZCxcbiAgICAgIG1heENoYXJzLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGJ1aWxkRmlsZUdyb3VwQ29udGV4dChcbiAgICBzb3VyY2VMYWJlbDogc3RyaW5nLFxuICAgIGZpbGVzOiBURmlsZVtdLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gICk6IFByb21pc2U8U3ludGhlc2lzQ29udGV4dD4ge1xuICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIG1hcmtkb3duIGZpbGVzIGZvdW5kIGZvciAke3NvdXJjZUxhYmVsLnRvTG93ZXJDYXNlKCl9YCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbWFya2Rvd24gZmlsZXMgZm91bmQgZm9yICR7c291cmNlTGFiZWwudG9Mb3dlckNhc2UoKX1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWlsZENvbnRleHQoc291cmNlTGFiZWwsIHNvdXJjZVBhdGgsIHRleHQsIGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5wYXRoKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RSZWNlbnRNYXJrZG93bkZpbGVzKGxvb2tiYWNrRGF5czogbnVtYmVyKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3QgY3V0b2ZmID0gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzKS5nZXRUaW1lKCk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IGN1dG9mZilcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RWYXVsdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdEZpbGVzSW5Gb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT5cbiAgICAgICAgZm9sZGVyUGF0aCA/IGlzVW5kZXJGb2xkZXIoZmlsZS5wYXRoLCBmb2xkZXJQYXRoKSA6ICFmaWxlLnBhdGguaW5jbHVkZXMoXCIvXCIpLFxuICAgICAgKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXM6IG51bWJlcik6IERhdGUge1xuICBjb25zdCBzYWZlRGF5cyA9IE1hdGgubWF4KDEsIGxvb2tiYWNrRGF5cyk7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgc3RhcnQuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gIHN0YXJ0LnNldERhdGUoc3RhcnQuZ2V0RGF0ZSgpIC0gKHNhZmVEYXlzIC0gMSkpO1xuICByZXR1cm4gc3RhcnQ7XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgZmlsZXM6IFRGaWxlW10sXG4gIG1heENoYXJzOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICAgICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBibG9jayA9IFtgLS0tICR7ZmlsZS5wYXRofWAsIHRyaW1tZWRdLmpvaW4oXCJcXG5cIik7XG4gICAgICBpZiAodG90YWwgKyBibG9jay5sZW5ndGggPiBtYXhDaGFycykge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSBNYXRoLm1heCgwLCBtYXhDaGFycyAtIHRvdGFsKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA+IDApIHtcbiAgICAgICAgICBwYXJ0cy5wdXNoKGJsb2NrLnNsaWNlKDAsIHJlbWFpbmluZykpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGJsb2NrKTtcbiAgICAgIHRvdGFsICs9IGJsb2NrLmxlbmd0aDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG59XG4iLCAiLyoqXG4gKiBQYXRoIHV0aWxpdHkgZnVuY3Rpb25zXG4gKi9cblxuLyoqXG4gKiBDaGVjayBpZiBhIHBhdGggaXMgdW5kZXIgYSBzcGVjaWZpYyBmb2xkZXIgKG9yIGlzIHRoZSBmb2xkZXIgaXRzZWxmKS5cbiAqIEhhbmRsZXMgdHJhaWxpbmcgc2xhc2hlcyBjb25zaXN0ZW50bHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1VuZGVyRm9sZGVyKHBhdGg6IHN0cmluZywgZm9sZGVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9ybWFsaXplZEZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gcGF0aCA9PT0gbm9ybWFsaXplZEZvbGRlciB8fCBwYXRoLnN0YXJ0c1dpdGgoYCR7bm9ybWFsaXplZEZvbGRlcn0vYCk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERhdGVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7ZGF0ZS5nZXRGdWxsWWVhcigpfS0ke3BhZDIoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkMihkYXRlLmdldERhdGUoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7cGFkMihkYXRlLmdldEhvdXJzKCkpfToke3BhZDIoZGF0ZS5nZXRNaW51dGVzKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlVGltZUtleShkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtmb3JtYXREYXRlS2V5KGRhdGUpfSAke2Zvcm1hdFRpbWVLZXkoZGF0ZSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0tJHtwYWQyKGRhdGUuZ2V0SG91cnMoKSl9JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlSm91cm5hbFRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnJlcGxhY2UoL1xccyskL2csIFwiXCIpKVxuICAgIC5qb2luKFwiXFxuXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyaW1UcmFpbGluZ05ld2xpbmVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xcbiskL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBwYWQyKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlKS5wYWRTdGFydCgyLCBcIjBcIik7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluYm94VmF1bHRTZXJ2aWNlIHtcbiAgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgcmVhZFRleHRXaXRoTXRpbWUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGV4aXN0czogYm9vbGVhbjtcbiAgfT47XG4gIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dW5rbm93bj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5ib3hFbnRyeSB7XG4gIGhlYWRpbmc6IHN0cmluZztcbiAgYm9keTogc3RyaW5nO1xuICByYXc6IHN0cmluZztcbiAgcHJldmlldzogc3RyaW5nO1xuICBpbmRleDogbnVtYmVyO1xuICBzaWduYXR1cmU6IHN0cmluZztcbiAgc2lnbmF0dXJlSW5kZXg6IG51bWJlcjtcbiAgc3RhcnRMaW5lOiBudW1iZXI7XG4gIGVuZExpbmU6IG51bWJlcjtcbiAgcmV2aWV3ZWQ6IGJvb2xlYW47XG4gIHJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgSW5ib3hFbnRyeUlkZW50aXR5ID0gUGljazxcbiAgSW5ib3hFbnRyeSxcbiAgXCJoZWFkaW5nXCIgfCBcImJvZHlcIiB8IFwicHJldmlld1wiIHwgXCJzaWduYXR1cmVcIiB8IFwic2lnbmF0dXJlSW5kZXhcIlxuPiAmXG4gIFBhcnRpYWw8UGljazxJbmJveEVudHJ5LCBcInJhd1wiIHwgXCJzdGFydExpbmVcIiB8IFwiZW5kTGluZVwiPj47XG5cbmV4cG9ydCBjbGFzcyBJbmJveFNlcnZpY2Uge1xuICBwcml2YXRlIHVucmV2aWV3ZWRDb3VudENhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBjb3VudDogbnVtYmVyO1xuICB9IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IEluYm94VmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEVudHJpZXMobGltaXQgPSAyMCwgaW5jbHVkZVJldmlld2VkID0gZmFsc2UpOiBQcm9taXNlPEluYm94RW50cnlbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgZW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGZpbHRlcmVkID0gaW5jbHVkZVJldmlld2VkID8gZW50cmllcyA6IGVudHJpZXMuZmlsdGVyKChlbnRyeSkgPT4gIWVudHJ5LnJldmlld2VkKTtcbiAgICByZXR1cm4gZmlsdGVyZWQuc2xpY2UoLWxpbWl0KS5yZXZlcnNlKCk7XG4gIH1cblxuICBhc3luYyBnZXRVbnJldmlld2VkQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHsgdGV4dCwgbXRpbWUsIGV4aXN0cyB9ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHRXaXRoTXRpbWUoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBpZiAoIWV4aXN0cykge1xuICAgICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGNvdW50OiAwLFxuICAgICAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnVucmV2aWV3ZWRDb3VudENhY2hlICYmIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUubXRpbWUgPT09IG10aW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy51bnJldmlld2VkQ291bnRDYWNoZS5jb3VudDtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IHBhcnNlSW5ib3hFbnRyaWVzKHRleHQpLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5yZXZpZXdlZCkubGVuZ3RoO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSB7XG4gICAgICBtdGltZSxcbiAgICAgIGNvdW50LFxuICAgIH07XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cbiAgYXN5bmMgbWFya0VudHJ5UmV2aWV3ZWQoZW50cnk6IEluYm94RW50cnlJZGVudGl0eSwgYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChzZXR0aW5ncy5pbmJveEZpbGUpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgY3VycmVudEVudHJ5ID1cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgIWNhbmRpZGF0ZS5yZXZpZXdlZCAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmUgPT09IGVudHJ5LnNpZ25hdHVyZSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmVJbmRleCA9PT0gZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgICApID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKChjYW5kaWRhdGUpID0+ICFjYW5kaWRhdGUucmV2aWV3ZWQgJiYgY2FuZGlkYXRlLnJhdyA9PT0gZW50cnkucmF3KSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuYm9keSA9PT0gZW50cnkuYm9keSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5wcmV2aWV3ID09PSBlbnRyeS5wcmV2aWV3LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc3RhcnRMaW5lID09PSBlbnRyeS5zdGFydExpbmUsXG4gICAgICApO1xuXG4gICAgaWYgKCFjdXJyZW50RW50cnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkID0gaW5zZXJ0UmV2aWV3TWFya2VyKGNvbnRlbnQsIGN1cnJlbnRFbnRyeSwgYWN0aW9uKTtcbiAgICBpZiAodXBkYXRlZCA9PT0gY29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHRoaXMudW5yZXZpZXdlZENvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IEluYm94RW50cnlJZGVudGl0eSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgY3VycmVudEVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBjdXJyZW50RW50cnkgPVxuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICBjYW5kaWRhdGUucmV2aWV3ZWQgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgZmluZFVuaXF1ZVJldmlld2VkU2lnbmF0dXJlTWF0Y2goY3VycmVudEVudHJpZXMsIGVudHJ5LnNpZ25hdHVyZSkgPz9cbiAgICAgIGN1cnJlbnRFbnRyaWVzLmZpbmQoXG4gICAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgICAgY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuYm9keSA9PT0gZW50cnkuYm9keSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5wcmV2aWV3ID09PSBlbnRyeS5wcmV2aWV3LFxuICAgICAgKTtcblxuICAgIGlmICghY3VycmVudEVudHJ5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IHJlbW92ZVJldmlld01hcmtlcihjb250ZW50LCBjdXJyZW50RW50cnkpO1xuICAgIGlmICh1cGRhdGVkID09PSBjb250ZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHNldHRpbmdzLmluYm94RmlsZSwgdXBkYXRlZCk7XG4gICAgdGhpcy51bnJldmlld2VkQ291bnRDYWNoZSA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQ6IHN0cmluZyk6IEluYm94RW50cnlbXSB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgZW50cmllczogSW5ib3hFbnRyeVtdID0gW107XG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gIGxldCBjdXJyZW50Qm9keUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgY3VycmVudFN0YXJ0TGluZSA9IC0xO1xuICBsZXQgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gIGxldCBjdXJyZW50UmV2aWV3QWN0aW9uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZEF0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3Qgc2lnbmF0dXJlQ291bnRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBjb25zdCBwdXNoRW50cnkgPSAoZW5kTGluZTogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgaWYgKCFjdXJyZW50SGVhZGluZykge1xuICAgICAgY3VycmVudEJvZHlMaW5lcyA9IFtdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJvZHkgPSBjdXJyZW50Qm9keUxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xuICAgIGNvbnN0IHByZXZpZXcgPSBidWlsZFByZXZpZXcoYm9keSk7XG4gICAgY29uc3QgcmF3ID0gW2N1cnJlbnRIZWFkaW5nLCAuLi5jdXJyZW50Qm9keUxpbmVzXS5qb2luKFwiXFxuXCIpLnRyaW1FbmQoKTtcbiAgICBjb25zdCBzaWduYXR1cmUgPSBidWlsZEVudHJ5U2lnbmF0dXJlKGN1cnJlbnRIZWFkaW5nLCBjdXJyZW50Qm9keUxpbmVzKTtcbiAgICBjb25zdCBzaWduYXR1cmVJbmRleCA9IHNpZ25hdHVyZUNvdW50cy5nZXQoc2lnbmF0dXJlKSA/PyAwO1xuICAgIHNpZ25hdHVyZUNvdW50cy5zZXQoc2lnbmF0dXJlLCBzaWduYXR1cmVJbmRleCArIDEpO1xuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBoZWFkaW5nOiBjdXJyZW50SGVhZGluZy5yZXBsYWNlKC9eIyNcXHMrLywgXCJcIikudHJpbSgpLFxuICAgICAgYm9keSxcbiAgICAgIHJhdyxcbiAgICAgIHByZXZpZXcsXG4gICAgICBpbmRleDogZW50cmllcy5sZW5ndGgsXG4gICAgICBzaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleCxcbiAgICAgIHN0YXJ0TGluZTogY3VycmVudFN0YXJ0TGluZSxcbiAgICAgIGVuZExpbmUsXG4gICAgICByZXZpZXdlZDogY3VycmVudFJldmlld2VkLFxuICAgICAgcmV2aWV3QWN0aW9uOiBjdXJyZW50UmV2aWV3QWN0aW9uLFxuICAgICAgcmV2aWV3ZWRBdDogY3VycmVudFJldmlld2VkQXQsXG4gICAgfSk7XG4gICAgY3VycmVudEJvZHlMaW5lcyA9IFtdO1xuICAgIGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgICBjdXJyZW50UmV2aWV3ZWQgPSBmYWxzZTtcbiAgICBjdXJyZW50UmV2aWV3QWN0aW9uID0gbnVsbDtcbiAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IG51bGw7XG4gIH07XG5cbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxpbmVzLmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpbmRleF07XG4gICAgY29uc3QgaGVhZGluZ01hdGNoID0gbGluZS5tYXRjaCgvXiMjXFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmdNYXRjaCkge1xuICAgICAgcHVzaEVudHJ5KGluZGV4KTtcbiAgICAgIGN1cnJlbnRIZWFkaW5nID0gbGluZTtcbiAgICAgIGN1cnJlbnRTdGFydExpbmUgPSBpbmRleDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHJldmlld01hdGNoID0gbGluZS5tYXRjaCgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6XFxzKihbYS16XSspKD86XFxzKyguKz8pKT9cXHMqLS0+JC9pKTtcbiAgICBpZiAocmV2aWV3TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRSZXZpZXdlZCA9IHRydWU7XG4gICAgICBjdXJyZW50UmV2aWV3QWN0aW9uID0gcmV2aWV3TWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgIGN1cnJlbnRSZXZpZXdlZEF0ID0gcmV2aWV3TWF0Y2hbMl0gPz8gbnVsbDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGN1cnJlbnRCb2R5TGluZXMucHVzaChsaW5lKTtcbiAgfVxuXG4gIHB1c2hFbnRyeShsaW5lcy5sZW5ndGgpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gaW5zZXJ0UmV2aWV3TWFya2VyKGNvbnRlbnQ6IHN0cmluZywgZW50cnk6IEluYm94RW50cnksIGFjdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IHRpbWVzdGFtcCA9IGZvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpO1xuICBjb25zdCBtYXJrZXIgPSBgPCEtLSBicmFpbi1yZXZpZXdlZDogJHthY3Rpb259ICR7dGltZXN0YW1wfSAtLT5gO1xuICBjb25zdCBlbnRyeUxpbmVzID0gbGluZXMuc2xpY2UoZW50cnkuc3RhcnRMaW5lLCBlbnRyeS5lbmRMaW5lKTtcbiAgY29uc3QgY2xlYW5lZEVudHJ5TGluZXMgPSB0cmltVHJhaWxpbmdCbGFua0xpbmVzKFxuICAgIGVudHJ5TGluZXMuZmlsdGVyKChsaW5lKSA9PiAhbGluZS5tYXRjaCgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kpKSxcbiAgKTtcbiAgY2xlYW5lZEVudHJ5TGluZXMucHVzaChtYXJrZXIsIFwiXCIpO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmV2aWV3TWFya2VyKGNvbnRlbnQ6IHN0cmluZywgZW50cnk6IEluYm94RW50cnkpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGlmIChlbnRyeS5zdGFydExpbmUgPCAwIHx8IGVudHJ5LmVuZExpbmUgPCBlbnRyeS5zdGFydExpbmUgfHwgZW50cnkuZW5kTGluZSA+IGxpbmVzLmxlbmd0aCkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG5cbiAgY29uc3QgdXBkYXRlZExpbmVzID0gW1xuICAgIC4uLmxpbmVzLnNsaWNlKDAsIGVudHJ5LnN0YXJ0TGluZSksXG4gICAgLi4uY2xlYW5lZEVudHJ5TGluZXMsXG4gICAgLi4ubGluZXMuc2xpY2UoZW50cnkuZW5kTGluZSksXG4gIF07XG5cbiAgcmV0dXJuIHRyaW1UcmFpbGluZ0JsYW5rTGluZXModXBkYXRlZExpbmVzKS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBidWlsZFByZXZpZXcoYm9keTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBib2R5XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIGxpbmVzWzBdID8/IFwiXCI7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRW50cnlTaWduYXR1cmUoaGVhZGluZzogc3RyaW5nLCBib2R5TGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtoZWFkaW5nLnRyaW0oKSwgLi4uYm9keUxpbmVzLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY2xvbmUgPSBbLi4ubGluZXNdO1xuICB3aGlsZSAoY2xvbmUubGVuZ3RoID4gMCAmJiBjbG9uZVtjbG9uZS5sZW5ndGggLSAxXS50cmltKCkgPT09IFwiXCIpIHtcbiAgICBjbG9uZS5wb3AoKTtcbiAgfVxuICByZXR1cm4gY2xvbmU7XG59XG5cbmZ1bmN0aW9uIGZpbmRVbmlxdWVSZXZpZXdlZFNpZ25hdHVyZU1hdGNoKFxuICBlbnRyaWVzOiBJbmJveEVudHJ5W10sXG4gIHNpZ25hdHVyZTogc3RyaW5nLFxuKTogSW5ib3hFbnRyeSB8IG51bGwge1xuICBjb25zdCByZXZpZXdlZE1hdGNoZXMgPSBlbnRyaWVzLmZpbHRlcihcbiAgICAoZW50cnkpID0+IGVudHJ5LnJldmlld2VkICYmIGVudHJ5LnNpZ25hdHVyZSA9PT0gc2lnbmF0dXJlLFxuICApO1xuICBpZiAocmV2aWV3ZWRNYXRjaGVzLmxlbmd0aCAhPT0gMSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiByZXZpZXdlZE1hdGNoZXNbMF07XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgY29sbGFwc2VKb3VybmFsVGV4dCwgZm9ybWF0RGF0ZUtleSwgZm9ybWF0VGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgSm91cm5hbFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGdldEpvdXJuYWxQYXRoKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXREYXRlS2V5KGRhdGUpO1xuICAgIHJldHVybiBgJHtzZXR0aW5ncy5qb3VybmFsRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUpvdXJuYWxGaWxlKGRhdGUgPSBuZXcgRGF0ZSgpKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGRhdGVLZXkgPSBmb3JtYXREYXRlS2V5KGRhdGUpO1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldEpvdXJuYWxQYXRoKGRhdGUpO1xuICAgIHJldHVybiB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRKb3VybmFsSGVhZGVyKHBhdGgsIGRhdGVLZXkpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kRW50cnkodGV4dDogc3RyaW5nLCBkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSm91cm5hbCB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVKb3VybmFsRmlsZShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gZmlsZS5wYXRoO1xuXG4gICAgY29uc3QgYmxvY2sgPSBgIyMgJHtmb3JtYXRUaW1lS2V5KGRhdGUpfVxcbiR7Y2xlYW5lZH1gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgYmxvY2spO1xuICAgIHJldHVybiB7IHBhdGggfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7XG4gIGNvbGxhcHNlV2hpdGVzcGFjZSxcbiAgZm9ybWF0RGF0ZVRpbWVLZXksXG4gIGZvcm1hdFN1bW1hcnlUaW1lc3RhbXAsXG59IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgTm90ZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZE5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90ZSB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfVxcbi0gJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy5pbmJveEZpbGUgfTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUdlbmVyYXRlZE5vdGUoXG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG4gICAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgICBzb3VyY2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICAgIHNvdXJjZVBhdGhzPzogc3RyaW5nW10sXG4gICk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgY2xlYW5lZFRpdGxlID0gdHJpbVRpdGxlKHRpdGxlKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGAke2Zvcm1hdFN1bW1hcnlUaW1lc3RhbXAobm93KX0tJHtzbHVnaWZ5KGNsZWFuZWRUaXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoXG4gICAgICBgJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn0vJHtmaWxlTmFtZX1gLFxuICAgICk7XG4gICAgY29uc3Qgc291cmNlTGluZSA9IHNvdXJjZVBhdGhzICYmIHNvdXJjZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgID8gYCR7c291cmNlTGFiZWx9IFx1MjAyMiAke3NvdXJjZVBhdGhzLmxlbmd0aH0gJHtzb3VyY2VQYXRocy5sZW5ndGggPT09IDEgPyBcImZpbGVcIiA6IFwiZmlsZXNcIn1gXG4gICAgICA6IHNvdXJjZVBhdGhcbiAgICAgICAgPyBgJHtzb3VyY2VMYWJlbH0gXHUyMDIyICR7c291cmNlUGF0aH1gXG4gICAgICAgIDogc291cmNlTGFiZWw7XG4gICAgY29uc3Qgc291cmNlRmlsZUxpbmVzID0gc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgPyBbXG4gICAgICAgICAgXCJTb3VyY2UgZmlsZXM6XCIsXG4gICAgICAgICAgLi4uc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpLm1hcCgoc291cmNlKSA9PiBgLSAke3NvdXJjZX1gKSxcbiAgICAgICAgICAuLi4oc291cmNlUGF0aHMubGVuZ3RoID4gMTJcbiAgICAgICAgICAgID8gW2AtIC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYF1cbiAgICAgICAgICAgIDogW10pLFxuICAgICAgICBdXG4gICAgICA6IFtdO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICBgIyAke2NsZWFuZWRUaXRsZX1gLFxuICAgICAgXCJcIixcbiAgICAgIGBDcmVhdGVkOiAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdyl9YCxcbiAgICAgIGBTb3VyY2U6ICR7c291cmNlTGluZX1gLFxuICAgICAgLi4uc291cmNlRmlsZUxpbmVzLFxuICAgICAgXCJcIixcbiAgICAgIGNvbGxhcHNlV2hpdGVzcGFjZShib2R5KSA/IGJvZHkudHJpbSgpIDogXCJObyBhcnRpZmFjdCBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgY29udGVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2x1Z2lmeSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tK3wtKyQvZywgXCJcIilcbiAgICAuc2xpY2UoMCwgNDgpIHx8IFwibm90ZVwiO1xufVxuXG5mdW5jdGlvbiB0cmltVGl0bGUodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpO1xuICBpZiAodHJpbW1lZC5sZW5ndGggPD0gNjApIHtcbiAgICByZXR1cm4gdHJpbW1lZDtcbiAgfVxuICByZXR1cm4gYCR7dHJpbW1lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgSW5ib3hFbnRyeSwgSW5ib3hFbnRyeUlkZW50aXR5IH0gZnJvbSBcIi4vaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5pbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJldmlld0xvZ0VudHJ5IGV4dGVuZHMgSW5ib3hFbnRyeUlkZW50aXR5IHtcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBzb3VyY2VQYXRoOiBzdHJpbmc7XG4gIGZpbGVNdGltZTogbnVtYmVyO1xuICBlbnRyeUluZGV4OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBSZXZpZXdMb2dTZXJ2aWNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdFbnRyeUNvdW50Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywge1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgfT4oKTtcbiAgcHJpdmF0ZSByZXZpZXdMb2dGaWxlc0NhY2hlOiB7XG4gICAgbXRpbWU6IG51bWJlcjtcbiAgICBmaWxlczogVEZpbGVbXTtcbiAgfSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJldmlld0VudHJ5VG90YWxDYWNoZToge1xuICAgIGxpc3RpbmdNdGltZTogbnVtYmVyO1xuICAgIHRvdGFsOiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFJldmlld0xvZyhlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShub3cpO1xuICAgIGNvbnN0IHBhdGggPSBgJHtzZXR0aW5ncy5yZXZpZXdzRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYC0gQWN0aW9uOiAke2FjdGlvbn1gLFxuICAgICAgYC0gSW5ib3g6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgYC0gUHJldmlldzogJHtlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgXCIoZW1wdHkpXCJ9YCxcbiAgICAgIGAtIFNpZ25hdHVyZTogJHtlbmNvZGVSZXZpZXdTaWduYXR1cmUoZW50cnkuc2lnbmF0dXJlKX1gLFxuICAgICAgYC0gU2lnbmF0dXJlIGluZGV4OiAke2VudHJ5LnNpZ25hdHVyZUluZGV4fWAsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSBudWxsO1xuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0gbnVsbDtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdMb2dGaWxlcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG5cbiAgICBpZiAoIXRoaXMucmV2aWV3TG9nRmlsZXNDYWNoZSkge1xuICAgICAgY29uc3QgYWxsRmlsZXMgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpO1xuICAgICAgY29uc3QgbWF0Y2hpbmcgPSBhbGxGaWxlc1xuICAgICAgICAuZmlsdGVyKChmaWxlKSA9PiBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gICAgICB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUgPSB7XG4gICAgICAgIG10aW1lOiBtYXRjaGluZ1swXT8uc3RhdC5tdGltZSA/PyAwLFxuICAgICAgICBmaWxlczogbWF0Y2hpbmcsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCJcbiAgICAgID8gdGhpcy5yZXZpZXdMb2dGaWxlc0NhY2hlLmZpbGVzLnNsaWNlKDAsIGxpbWl0KVxuICAgICAgOiB0aGlzLnJldmlld0xvZ0ZpbGVzQ2FjaGUuZmlsZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyaWVzKGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxSZXZpZXdMb2dFbnRyeVtdPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQpO1xuICAgIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBsb2dzKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSk7XG4gICAgICBlbnRyaWVzLnB1c2goLi4ucGFyc2VkLnJldmVyc2UoKSk7XG4gICAgICBpZiAodHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiICYmIGVudHJpZXMubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgbGltaXQgPT09IFwibnVtYmVyXCIgPyBlbnRyaWVzLnNsaWNlKDAsIGxpbWl0KSA6IGVudHJpZXM7XG4gIH1cblxuICBhc3luYyBnZXRSZXZpZXdFbnRyeUNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZ2V0UmV2aWV3TG9nRmlsZXMoKTtcbiAgICBpZiAobG9ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWU6IDAsIHRvdGFsOiAwIH07XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0aW5nTXRpbWUgPSBsb2dzWzBdLnN0YXQubXRpbWU7XG4gICAgaWYgKHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlPy5saXN0aW5nTXRpbWUgPT09IGxpc3RpbmdNdGltZSkge1xuICAgICAgcmV0dXJuIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlLnRvdGFsO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZW5QYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGxldCB0b3RhbCA9IDA7XG5cbiAgICBjb25zdCB1bmNhY2hlZEZpbGVzID0gbG9ncy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuICEoY2FjaGVkICYmIGNhY2hlZC5tdGltZSA9PT0gZmlsZS5zdGF0Lm10aW1lKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNhY2hlZEZpbGVzID0gbG9ncy5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLmdldChmaWxlLnBhdGgpO1xuICAgICAgcmV0dXJuIGNhY2hlZCAmJiBjYWNoZWQubXRpbWUgPT09IGZpbGUuc3RhdC5tdGltZTtcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBjYWNoZWRGaWxlcykge1xuICAgICAgc2VlblBhdGhzLmFkZChmaWxlLnBhdGgpO1xuICAgICAgdG90YWwgKz0gdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZ2V0KGZpbGUucGF0aCkhLmNvdW50O1xuICAgIH1cblxuICAgIGlmICh1bmNhY2hlZEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgdW5jYWNoZWRGaWxlcy5tYXAoYXN5bmMgKGZpbGUpID0+IHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IHBhcnNlUmV2aWV3TG9nRW50cmllcyhjb250ZW50LCBmaWxlLnBhdGgsIGZpbGUuc3RhdC5tdGltZSkubGVuZ3RoO1xuICAgICAgICAgIHRoaXMucmV2aWV3RW50cnlDb3VudENhY2hlLnNldChmaWxlLnBhdGgsIHtcbiAgICAgICAgICAgIG10aW1lOiBmaWxlLnN0YXQubXRpbWUsXG4gICAgICAgICAgICBjb3VudCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4geyBmaWxlLCBjb3VudCB9O1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICAgIGZvciAoY29uc3QgeyBmaWxlLCBjb3VudCB9IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgc2VlblBhdGhzLmFkZChmaWxlLnBhdGgpO1xuICAgICAgICB0b3RhbCArPSBjb3VudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUua2V5cygpKSB7XG4gICAgICBpZiAoIXNlZW5QYXRocy5oYXMocGF0aCkpIHtcbiAgICAgICAgdGhpcy5yZXZpZXdFbnRyeUNvdW50Q2FjaGUuZGVsZXRlKHBhdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmV2aWV3RW50cnlUb3RhbENhY2hlID0geyBsaXN0aW5nTXRpbWUsIHRvdGFsIH07XG4gICAgcmV0dXJuIHRvdGFsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJldmlld0xvZ0VudHJpZXMoXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nLFxuICBmaWxlTXRpbWU6IG51bWJlcixcbik6IFJldmlld0xvZ0VudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10gPSBbXTtcbiAgbGV0IGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICBsZXQgY3VycmVudEFjdGlvbiA9IFwiXCI7XG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiXCI7XG4gIGxldCBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRTaWduYXR1cmVJbmRleCA9IDA7XG4gIGxldCBjdXJyZW50RW50cnlJbmRleCA9IDA7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudFRpbWVzdGFtcCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBhY3Rpb246IGN1cnJlbnRBY3Rpb24gfHwgXCJ1bmtub3duXCIsXG4gICAgICBoZWFkaW5nOiBjdXJyZW50SGVhZGluZyxcbiAgICAgIHByZXZpZXc6IGN1cnJlbnRQcmV2aWV3LFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIHNpZ25hdHVyZTogY3VycmVudFNpZ25hdHVyZSxcbiAgICAgIHNpZ25hdHVyZUluZGV4OiBjdXJyZW50U2lnbmF0dXJlSW5kZXgsXG4gICAgICB0aW1lc3RhbXA6IGN1cnJlbnRUaW1lc3RhbXAsXG4gICAgICBzb3VyY2VQYXRoLFxuICAgICAgZmlsZU10aW1lLFxuICAgICAgZW50cnlJbmRleDogY3VycmVudEVudHJ5SW5kZXgsXG4gICAgfSk7XG4gICAgY3VycmVudFRpbWVzdGFtcCA9IFwiXCI7XG4gICAgY3VycmVudEFjdGlvbiA9IFwiXCI7XG4gICAgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICAgIGN1cnJlbnRQcmV2aWV3ID0gXCJcIjtcbiAgICBjdXJyZW50U2lnbmF0dXJlID0gXCJcIjtcbiAgICBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICAgIGN1cnJlbnRFbnRyeUluZGV4ICs9IDE7XG4gIH07XG5cbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgaGVhZGluZ01hdGNoID0gbGluZS5tYXRjaCgvXiMjXFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmdNYXRjaCkge1xuICAgICAgcHVzaEVudHJ5KCk7XG4gICAgICBjdXJyZW50VGltZXN0YW1wID0gaGVhZGluZ01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbk1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrQWN0aW9uOlxccysoLispJC9pKTtcbiAgICBpZiAoYWN0aW9uTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRBY3Rpb24gPSBhY3Rpb25NYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmJveE1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrSW5ib3g6XFxzKyguKykkL2kpO1xuICAgIGlmIChpbmJveE1hdGNoKSB7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGluYm94TWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlld01hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrUHJldmlldzpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHByZXZpZXdNYXRjaCkge1xuICAgICAgY3VycmVudFByZXZpZXcgPSBwcmV2aWV3TWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlTWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmU6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVNYXRjaCkge1xuICAgICAgY3VycmVudFNpZ25hdHVyZSA9IGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmVNYXRjaFsxXS50cmltKCkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXhNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1NpZ25hdHVyZSBpbmRleDpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKHNpZ25hdHVyZUluZGV4TWF0Y2gpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludChzaWduYXR1cmVJbmRleE1hdGNoWzFdLCAxMCk7XG4gICAgICBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG4gICAgfVxuICB9XG5cbiAgcHVzaEVudHJ5KCk7XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHNpZ25hdHVyZSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gc2lnbmF0dXJlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHksIEluYm94U2VydmljZSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3Rhc2stc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnksIFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5ib3hTZXJ2aWNlOiBJbmJveFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZTogVGFza1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBqb3VybmFsU2VydmljZTogSm91cm5hbFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdMb2dTZXJ2aWNlOiBSZXZpZXdMb2dTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEluYm94RW50cmllcyhsaW1pdCA9IDIwKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICByZXR1cm4gdGhpcy5pbmJveFNlcnZpY2UuZ2V0UmVjZW50RW50cmllcyhsaW1pdCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9UYXNrKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0ZXh0ID0gZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcInRhc2tcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwidGFza1wiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFxuICAgICAgYFByb21vdGVkIGluYm94IGVudHJ5IHRvIHRhc2sgaW4gJHtzYXZlZC5wYXRofWAsXG4gICAgICBtYXJrZXJVcGRhdGVkLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBrZWVwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJrZWVwXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImtlZXBcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcIktlcHQgaW5ib3ggZW50cnlcIiwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBza2lwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJza2lwXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInNraXBcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcIlNraXBwZWQgaW5ib3ggZW50cnlcIiwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRUb0pvdXJuYWwoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeShcbiAgICAgIFtcbiAgICAgICAgYFNvdXJjZTogJHtlbnRyeS5oZWFkaW5nfWAsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nLFxuICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwiam91cm5hbFwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBBcHBlbmRlZCBpbmJveCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YCwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9Ob3RlKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm90ZXNGb2xkZXIgPSBzZXR0aW5ncy5ub3Rlc0ZvbGRlcjtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVGb2xkZXIobm90ZXNGb2xkZXIpO1xuXG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLmJ1aWxkTm90ZVRpdGxlKGVudHJ5KTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IGAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdykucmVwbGFjZSgvWzogXS9nLCBcIi1cIil9LSR7c2x1Z2lmeSh0aXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoYCR7bm90ZXNGb2xkZXJ9LyR7ZmlsZW5hbWV9YCk7XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjICR7dGl0bGV9YCxcbiAgICAgIFwiXCIsXG4gICAgICBgQ3JlYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBcIlNvdXJjZTogQnJhaW4gaW5ib3hcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIk9yaWdpbmFsIGNhcHR1cmU6XCIsXG4gICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBjb250ZW50KTtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwibm90ZVwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJub3RlXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoYFByb21vdGVkIGluYm94IGVudHJ5IHRvIG5vdGUgaW4gJHtwYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuRnJvbVJldmlld0xvZyhlbnRyeTogUmV2aWV3TG9nRW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGlkZW50aXR5ID0ge1xuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfTtcbiAgICBjb25zdCByZW9wZW5lZCA9IGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLnJlb3BlbkVudHJ5KGlkZW50aXR5KTtcbiAgICBpZiAoIXJlb3BlbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZS1vcGVuIGluYm94IGVudHJ5ICR7ZW50cnkuaGVhZGluZ31gKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGlkZW50aXR5LCBcInJlb3BlblwiKTtcbiAgICByZXR1cm4gYFJlLW9wZW5lZCBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YDtcbiAgfVxuXG4gIGJ1aWxkTm90ZVRpdGxlKGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgZW50cnkuaGVhZGluZztcbiAgICBjb25zdCBsaW5lcyA9IGNhbmRpZGF0ZVxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBjb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgY29uc3QgZmlyc3QgPSBsaW5lc1swXSA/PyBcIlVudGl0bGVkIG5vdGVcIjtcbiAgICByZXR1cm4gdHJpbVRpdGxlKGZpcnN0KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbWFya0luYm94UmV2aWV3ZWQoZW50cnk6IEluYm94RW50cnksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmluYm94U2VydmljZS5tYXJrRW50cnlSZXZpZXdlZChlbnRyeSwgYWN0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRNYXJrZXJOb3RlKG1lc3NhZ2U6IHN0cmluZywgbWFya2VyVXBkYXRlZDogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgcmV0dXJuIG1hcmtlclVwZGF0ZWQgPyBtZXNzYWdlIDogYCR7bWVzc2FnZX0gKHJldmlldyBtYXJrZXIgbm90IHVwZGF0ZWQpYDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChcbiAgICBlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LFxuICAgIGFjdGlvbjogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmFwcGVuZFJldmlld0xvZyhlbnRyeSwgYWN0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpXG4gICAgLnNsaWNlKDAsIDQ4KSB8fCBcIm5vdGVcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhbnN3ZXJRdWVzdGlvbihxdWVzdGlvbjogc3RyaW5nLCBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0KTogUHJvbWlzZTxTeW50aGVzaXNSZXN1bHQ+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1F1ZXN0aW9uQW5zd2VyKHF1ZXN0aW9uLCBjb250ZXh0LnRleHQpO1xuICAgIGxldCBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgYW5zd2VycyBhcmUgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuYW5zd2VyUXVlc3Rpb24ocXVlc3Rpb24sIGNvbnRleHQsIHNldHRpbmdzKTtcbiAgICAgICAgICB1c2VkQUkgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJCcmFpbiBmZWxsIGJhY2sgdG8gbG9jYWwgcXVlc3Rpb24gYW5zd2VyaW5nXCIpO1xuICAgICAgICAgIGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246IFwiUXVlc3Rpb24gQW5zd2VyXCIsXG4gICAgICB0aXRsZTogXCJBbnN3ZXJcIixcbiAgICAgIG5vdGVUaXRsZTogc2hvcnRlblF1ZXN0aW9uKHF1ZXN0aW9uKSxcbiAgICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgICAgcHJvbXB0VGV4dDogcXVlc3Rpb24sXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG9ydGVuUXVlc3Rpb24ocXVlc3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSBxdWVzdGlvbi50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBRdWVzdGlvbiAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RLZXl3b3JkcyhxdWVzdGlvbjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzdG9wd29yZHMgPSBuZXcgU2V0KFtcbiAgICBcIndoYXRcIixcbiAgICBcIndoeVwiLFxuICAgIFwiaG93XCIsXG4gICAgXCJ3aGljaFwiLFxuICAgIFwid2hlblwiLFxuICAgIFwid2hlcmVcIixcbiAgICBcIndob1wiLFxuICAgIFwid2hvbVwiLFxuICAgIFwiZG9lc1wiLFxuICAgIFwiZG9cIixcbiAgICBcImRpZFwiLFxuICAgIFwiaXNcIixcbiAgICBcImFyZVwiLFxuICAgIFwid2FzXCIsXG4gICAgXCJ3ZXJlXCIsXG4gICAgXCJ0aGVcIixcbiAgICBcImFcIixcbiAgICBcImFuXCIsXG4gICAgXCJ0b1wiLFxuICAgIFwib2ZcIixcbiAgICBcImZvclwiLFxuICAgIFwiYW5kXCIsXG4gICAgXCJvclwiLFxuICAgIFwiaW5cIixcbiAgICBcIm9uXCIsXG4gICAgXCJhdFwiLFxuICAgIFwid2l0aFwiLFxuICAgIFwiYWJvdXRcIixcbiAgICBcImZyb21cIixcbiAgICBcIm15XCIsXG4gICAgXCJvdXJcIixcbiAgICBcInlvdXJcIixcbiAgICBcInRoaXNcIixcbiAgICBcInRoYXRcIixcbiAgICBcInRoZXNlXCIsXG4gICAgXCJ0aG9zZVwiLFxuICAgIFwibWFrZVwiLFxuICAgIFwibWFkZVwiLFxuICAgIFwibmVlZFwiLFxuICAgIFwibmVlZHNcIixcbiAgICBcImNhblwiLFxuICAgIFwiY291bGRcIixcbiAgICBcInNob3VsZFwiLFxuICAgIFwid291bGRcIixcbiAgICBcIndpbGxcIixcbiAgICBcImhhdmVcIixcbiAgICBcImhhc1wiLFxuICAgIFwiaGFkXCIsXG4gIF0pO1xuXG4gIHJldHVybiBBcnJheS5mcm9tKFxuICAgIG5ldyBTZXQoXG4gICAgICBxdWVzdGlvblxuICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAuc3BsaXQoL1teYS16MC05XSsvZylcbiAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoKHdvcmQpID0+IHdvcmQubGVuZ3RoID49IDQgJiYgIXN0b3B3b3Jkcy5oYXMod29yZCkpLFxuICAgICksXG4gICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNRdWVzdGlvbihsaW5lOiBzdHJpbmcsIGtleXdvcmRzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoIWtleXdvcmRzLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4ga2V5d29yZHMuc29tZSgoa2V5d29yZCkgPT4gbG93ZXIuaW5jbHVkZXMoa2V5d29yZCkpO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RXZpZGVuY2UoY29udGVudDogc3RyaW5nLCBxdWVzdGlvbjogc3RyaW5nKToge1xuICBldmlkZW5jZTogU2V0PHN0cmluZz47XG4gIG1hdGNoZWQ6IGJvb2xlYW47XG59IHtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qga2V5d29yZHMgPSBleHRyYWN0S2V5d29yZHMocXVlc3Rpb24pO1xuICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oaGVhZGluZ1RleHQsIGtleXdvcmRzKSB8fCBldmlkZW5jZS5zaXplIDwgMykpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNRdWVzdGlvbihoZWFkaW5nVGV4dCwga2V5d29yZHMpKSB7XG4gICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZpZGVuY2UuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQgJiYgKG1hdGNoZXNRdWVzdGlvbih0YXNrVGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAzKSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKHRhc2tUZXh0LCBrZXl3b3JkcykpIHtcbiAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBldmlkZW5jZS5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0ICYmIChtYXRjaGVzUXVlc3Rpb24oYnVsbGV0VGV4dCwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCA0KSkge1xuICAgICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGJ1bGxldFRleHQsIGtleXdvcmRzKSkge1xuICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChtYXRjaGVzUXVlc3Rpb24obGluZSwga2V5d29yZHMpIHx8IGV2aWRlbmNlLnNpemUgPCAyKSB7XG4gICAgICBpZiAobWF0Y2hlc1F1ZXN0aW9uKGxpbmUsIGtleXdvcmRzKSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGV2aWRlbmNlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGV2aWRlbmNlLFxuICAgIG1hdGNoZWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrUXVlc3Rpb25BbnN3ZXIocXVlc3Rpb246IHN0cmluZywgY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZFF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShxdWVzdGlvbik7XG4gIGNvbnN0IHsgZXZpZGVuY2UsIG1hdGNoZWQgfSA9IGNvbGxlY3RFdmlkZW5jZShjb250ZW50LCBjbGVhbmVkUXVlc3Rpb24pO1xuICBjb25zdCBhbnN3ZXJMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAobWF0Y2hlZCkge1xuICAgIGFuc3dlckxpbmVzLnB1c2goXG4gICAgICBcIkkgZm91bmQgdGhlc2UgbGluZXMgaW4gdGhlIHNlbGVjdGVkIGNvbnRleHQgdGhhdCBkaXJlY3RseSBtYXRjaCB5b3VyIHF1ZXN0aW9uLlwiLFxuICAgICk7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIlRoZSBjb250ZXh0IGRvZXMgbm90IHByb3ZpZGUgYSBmdWxseSB2ZXJpZmllZCBhbnN3ZXIsIHNvIHRyZWF0IHRoaXMgYXMgYSBncm91bmRlZCBzdW1tYXJ5LlwiKTtcbiAgfSBlbHNlIGlmIChldmlkZW5jZS5zaXplKSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcbiAgICAgIFwiSSBjb3VsZCBub3QgZmluZCBhIGRpcmVjdCBtYXRjaCBpbiB0aGUgc2VsZWN0ZWQgY29udGV4dCwgc28gdGhlc2UgYXJlIHRoZSBjbG9zZXN0IGxpbmVzIGF2YWlsYWJsZS5cIixcbiAgICApO1xuICAgIGFuc3dlckxpbmVzLnB1c2goXCJUcmVhdCB0aGlzIGFzIG5lYXJieSBjb250ZXh0IHJhdGhlciB0aGFuIGEgY29uZmlybWVkIGFuc3dlci5cIik7XG4gIH0gZWxzZSB7XG4gICAgYW5zd2VyTGluZXMucHVzaChcIkkgY291bGQgbm90IGZpbmQgYSBkaXJlY3QgYW5zd2VyIGluIHRoZSBzZWxlY3RlZCBjb250ZXh0LlwiKTtcbiAgICBhbnN3ZXJMaW5lcy5wdXNoKFwiVHJ5IG5hcnJvd2luZyB0aGUgcXVlc3Rpb24gb3Igc2VsZWN0aW5nIGEgbW9yZSBzcGVjaWZpYyBub3RlIG9yIGZvbGRlci5cIik7XG4gIH1cblxuICBjb25zdCBmb2xsb3dVcHMgPSBtYXRjaGVkIHx8IGV2aWRlbmNlLnNpemVcbiAgICA/IG5ldyBTZXQoW1xuICAgICAgICBcIkFzayBhIG5hcnJvd2VyIHF1ZXN0aW9uIGlmIHlvdSB3YW50IGEgbW9yZSBzcGVjaWZpYyBhbnN3ZXIuXCIsXG4gICAgICAgIFwiT3BlbiB0aGUgc291cmNlIG5vdGUgb3IgZm9sZGVyIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXCIsXG4gICAgICBdKVxuICAgIDogbmV3IFNldChbXG4gICAgICAgIFwiUHJvdmlkZSBtb3JlIGV4cGxpY2l0IGNvbnRleHQgb3Igc2VsZWN0IGEgZGlmZmVyZW50IG5vdGUgb3IgZm9sZGVyLlwiLFxuICAgICAgXSk7XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgY2xlYW5lZFF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gcHJvdmlkZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIEFuc3dlclwiLFxuICAgIGFuc3dlckxpbmVzLmpvaW4oXCIgXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGRpcmVjdCBldmlkZW5jZSBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVRdWVzdGlvbkFuc3dlck91dHB1dChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB0cmltbWVkID0gY29udGVudC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEFuc3dlclwiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEV2aWRlbmNlXCIsXG4gICAgICBcIk5vIGFuc3dlciBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgXCJObyBhbnN3ZXIgY29udGVudCByZXR1cm5lZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIEFuc3dlclwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgUXVlc3Rpb25cIixcbiAgICAgIHBhcnNlZC5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHByb3ZpZGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICBwYXJzZWQuYW5zd2VyIHx8IFwiTm8gYW5zd2VyIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgcGFyc2VkLmV2aWRlbmNlIHx8IFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyB0aGUgc291cmNlIGNvbnRleHQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgQW5zd2VyXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIFF1ZXN0aW9uXCIsXG4gICAgXCJObyBxdWVzdGlvbiBwcm92aWRlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVF1ZXN0aW9uQW5zd2VyU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBxdWVzdGlvbjogc3RyaW5nO1xuICBhbnN3ZXI6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiUXVlc3Rpb25cIiB8IFwiQW5zd2VyXCIgfCBcIkV2aWRlbmNlXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIFF1ZXN0aW9uOiBbXSxcbiAgICBBbnN3ZXI6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoUXVlc3Rpb258QW5zd2VyfEV2aWRlbmNlfEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBxdWVzdGlvbjogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5RdWVzdGlvbl0pLFxuICAgIGFuc3dlcjogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzLkFuc3dlciksXG4gICAgZXZpZGVuY2U6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5FdmlkZW5jZSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBRdWVzdGlvbjogc3RyaW5nW107XG4gIEFuc3dlcjogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImFuc3dlclwiKSB7XG4gICAgcmV0dXJuIFwiQW5zd2VyXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZXZpZGVuY2VcIikge1xuICAgIHJldHVybiBcIkV2aWRlbmNlXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIlF1ZXN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIGpvaW5SZWNlbnRGaWxlc0ZvclN1bW1hcnksXG59IGZyb20gXCIuLi91dGlscy90ZXh0XCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZUtleSwgZm9ybWF0U3VtbWFyeVRpbWVzdGFtcCB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3VtbWFyeSB9IGZyb20gXCIuLi91dGlscy9zdW1tYXJ5LWZvcm1hdFwiO1xuaW1wb3J0IHsgaXNVbmRlckZvbGRlciB9IGZyb20gXCIuLi91dGlscy9wYXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VtbWFyeVJlc3VsdCB7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgcGVyc2lzdGVkUGF0aD86IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3VtbWFyeVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnkobG9va2JhY2tEYXlzPzogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZWZmZWN0aXZlTG9va2JhY2tEYXlzID0gbG9va2JhY2tEYXlzID8/IHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXM7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RSZWNlbnRGaWxlcyhzZXR0aW5ncywgZWZmZWN0aXZlTG9va2JhY2tEYXlzKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGxldCBzdW1tYXJ5ID0gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudCk7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgc3VtbWFyaWVzIGFyZSBlbmFibGVkIGJ1dCBPcGVuQUkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHN1bW1hcnkgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5zdW1tYXJpemUoY29udGVudCB8fCBzdW1tYXJ5LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN1bW1hcnlcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGVyc2lzdGVkUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHRpdGxlID0gbGFiZWwgPyBgJHtsYWJlbH0gU3VtbWFyeWAgOiBcIlN1bW1hcnlcIjtcbiAgICBpZiAoc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykge1xuICAgICAgY29uc3QgdGltZXN0YW1wID0gZm9ybWF0U3VtbWFyeVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcbiAgICAgIGNvbnN0IGZpbGVMYWJlbCA9IGxhYmVsID8gYCR7bGFiZWwudG9Mb3dlckNhc2UoKX0tJHt0aW1lc3RhbXB9YCA6IHRpbWVzdGFtcDtcbiAgICAgIGNvbnN0IHJlcXVlc3RlZFBhdGggPSBgJHtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXJ9LyR7ZmlsZUxhYmVsfS5tZGA7XG4gICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgocmVxdWVzdGVkUGF0aCk7XG4gICAgICBjb25zdCBkaXNwbGF5VGltZXN0YW1wID0gZm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSk7XG4gICAgICBjb25zdCBib2R5ID0gW1xuICAgICAgICBgIyAke3RpdGxlfSAke2Rpc3BsYXlUaW1lc3RhbXB9YCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgYCMjIFdpbmRvd2AsXG4gICAgICAgIGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9PT0gMSA/IFwiVG9kYXlcIiA6IGBMYXN0ICR7ZWZmZWN0aXZlTG9va2JhY2tEYXlzfSBkYXlzYCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgc3VtbWFyeS50cmltKCksXG4gICAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJvZHkpO1xuICAgICAgcGVyc2lzdGVkUGF0aCA9IHBhdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IHN1bW1hcnksXG4gICAgICBwZXJzaXN0ZWRQYXRoLFxuICAgICAgdXNlZEFJLFxuICAgICAgdGl0bGUsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdFJlY2VudEZpbGVzKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIGxvb2tiYWNrRGF5czogbnVtYmVyLFxuICApOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBjdXRvZmYgPSBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXMpLmdldFRpbWUoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IGN1dG9mZilcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93U3RhcnQobG9va2JhY2tEYXlzOiBudW1iZXIpOiBEYXRlIHtcbiAgY29uc3Qgc2FmZURheXMgPSBNYXRoLm1heCgxLCBsb29rYmFja0RheXMpO1xuICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKCk7XG4gIHN0YXJ0LnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICBzdGFydC5zZXREYXRlKHN0YXJ0LmdldERhdGUoKSAtIChzYWZlRGF5cyAtIDEpKTtcbiAgcmV0dXJuIHN0YXJ0O1xufVxuIiwgImZ1bmN0aW9uIGNsZWFuU3VtbWFyeUxpbmUodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuICh0ZXh0ID8/IFwiXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUYXNrU2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gXCItIE5vIHJlY2VudCB0YXNrcyBmb3VuZC5cIjtcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSBbIF0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrU3VtbWFyeShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBoaWdobGlnaHRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRhc2tzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICgvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgaGlnaGxpZ2h0cy5hZGQoY2xlYW5TdW1tYXJ5TGluZShoZWFkaW5nWzFdKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUodGFza1syXSk7XG4gICAgICB0YXNrcy5hZGQodGV4dCk7XG4gICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUoYnVsbGV0WzJdKTtcbiAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIGhpZ2hsaWdodHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGhpZ2hsaWdodHMuc2l6ZSA8IDUgJiYgbGluZS5sZW5ndGggPD0gMTQwKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGhpZ2hsaWdodHMsIFwiTm8gcmVjZW50IG5vdGVzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBmb3JtYXRUYXNrU2VjdGlvbih0YXNrcyksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm90aGluZyBwZW5kaW5nIGZyb20gcmVjZW50IG5vdGVzLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3ludGhlc2lzIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24gfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1leHRyYWN0LW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgYnVpbGRGYWxsYmFja0RlY2lzaW9uRXh0cmFjdGlvbiB9IGZyb20gXCIuLi91dGlscy9kZWNpc2lvbi1leHRyYWN0LWZvcm1hdFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL2RlY2lzaW9uLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyB9IGZyb20gXCIuLi91dGlscy9vcGVuLXF1ZXN0aW9ucy1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlIH0gZnJvbSBcIi4uL3V0aWxzL2NsZWFuLW5vdGUtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tQcm9qZWN0QnJpZWYgfSBmcm9tIFwiLi4vdXRpbHMvcHJvamVjdC1icmllZi1mb3JtYXRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5pbXBvcnQgeyBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlIH0gZnJvbSBcIi4uL3V0aWxzL3N5bnRoZXNpcy10ZW1wbGF0ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRoZXNpc1Jlc3VsdCB7XG4gIGFjdGlvbjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBub3RlVGl0bGU6IHN0cmluZztcbiAgY29udGVudDogc3RyaW5nO1xuICB1c2VkQUk6IGJvb2xlYW47XG4gIHByb21wdFRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIHJ1bih0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmFsbGJhY2sgPSB0aGlzLmJ1aWxkRmFsbGJhY2sodGVtcGxhdGUsIGNvbnRleHQudGV4dCk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGlmICghc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJBSSBzdW1tYXJpZXMgYXJlIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29udGVudCA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnN5bnRoZXNpemVDb250ZXh0KHRlbXBsYXRlLCBjb250ZXh0LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN5bnRoZXNpc1wiKTtcbiAgICAgICAgICBjb250ZW50ID0gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIHRpdGxlOiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKSxcbiAgICAgIG5vdGVUaXRsZTogYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gJHtnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlKX1gLFxuICAgICAgY29udGVudDogdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIGNvbnRlbnQpLFxuICAgICAgdXNlZEFJLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRmFsbGJhY2sodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24odGV4dCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrRGVjaXNpb25FeHRyYWN0aW9uKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrT3BlblF1ZXN0aW9ucyh0ZXh0KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrQ2xlYW5Ob3RlKHRleHQpO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpIHtcbiAgICAgIHJldHVybiBidWlsZEZhbGxiYWNrUHJvamVjdEJyaWVmKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsZEZhbGxiYWNrU3ludGhlc2lzKHRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCBjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplT3BlblF1ZXN0aW9uc091dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChjb250ZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3ludGhlc2lzT3V0cHV0KGNvbnRlbnQpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYWRkU3VtbWFyeUxpbmUoXG4gIHN1bW1hcnk6IFNldDxzdHJpbmc+LFxuICB0ZXh0OiBzdHJpbmcsXG4gIG1heEl0ZW1zID0gNCxcbik6IHZvaWQge1xuICBpZiAoc3VtbWFyeS5zaXplID49IG1heEl0ZW1zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgaWYgKCFjbGVhbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc3VtbWFyeS5hZGQoY2xlYW5lZCk7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1N5bnRoZXNpcyhjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzdW1tYXJ5ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRoZW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICB0aGVtZXMuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIGFkZFN1bW1hcnlMaW5lKHN1bW1hcnksIGhlYWRpbmdUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBmb2xsb3dVcHMuYWRkKHRhc2tUZXh0KTtcbiAgICAgIHRoZW1lcy5hZGQodGFza1RleHQpO1xuICAgICAgYWRkU3VtbWFyeUxpbmUoc3VtbWFyeSwgdGFza1RleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIHRoZW1lcy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBidWxsZXRUZXh0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiP1wiKSkge1xuICAgICAgZm9sbG93VXBzLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG5cbiAgICBhZGRTdW1tYXJ5TGluZShzdW1tYXJ5LCBsaW5lKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oc3VtbWFyeSwgXCJObyBzb3VyY2UgY29udGV4dCBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbih0aGVtZXMsIFwiTm8ga2V5IHRoZW1lcyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm8gZm9sbG93LXVwcyBpZGVudGlmaWVkLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBTdW1tYXJ5XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VTeW50aGVzaXNTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFN1bW1hcnlcIixcbiAgICAgIHBhcnNlZC5zdW1tYXJ5IHx8IFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgVGhlbWVzXCIsXG4gICAgICBwYXJzZWQua2V5VGhlbWVzIHx8IFwiTm8ga2V5IHRoZW1lcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgIHRyaW1tZWQsXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBUaGVtZXNcIixcbiAgICBcIk5vIGtleSB0aGVtZXMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3ludGhlc2lzU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGtleVRoZW1lczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJTdW1tYXJ5XCIgfCBcIktleSBUaGVtZXNcIiB8IFwiRm9sbG93LXVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgU3VtbWFyeTogW10sXG4gICAgXCJLZXkgVGhlbWVzXCI6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhTdW1tYXJ5fEtleSBUaGVtZXN8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnk6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuU3VtbWFyeV0pLFxuICAgIGtleVRoZW1lczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiS2V5IFRoZW1lc1wiXSksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBTdW1tYXJ5OiBzdHJpbmdbXTtcbiAgXCJLZXkgVGhlbWVzXCI6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwia2V5IHRoZW1lc1wiKSB7XG4gICAgcmV0dXJuIFwiS2V5IFRoZW1lc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcImZvbGxvdy11cHNcIikge1xuICAgIHJldHVybiBcIkZvbGxvdy11cHNcIjtcbiAgfVxuICByZXR1cm4gXCJTdW1tYXJ5XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi9kYXRlXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdExpc3RTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPiwgZW1wdHlNZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWl0ZW1zLnNpemUpIHtcbiAgICByZXR1cm4gYC0gJHtlbXB0eU1lc3NhZ2V9YDtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCAxMClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZhbGxiYWNrVGFza0V4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgY29udGV4dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBmb2xsb3dVcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIHRhc2tzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGNvbnRleHQuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbiA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSk7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgZm9sbG93VXBzLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIFRhc2tzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24odGFza3MsIFwiTm8gdGFza3MgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oY29udGV4dCwgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZm9sbG93VXBzLCBcIk5vIGZvbGxvdy11cHMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgXCJObyB0YXNrIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIHRhc2sgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gdGFzayBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBwYXJzZWQudGFza3MgfHwgXCJObyB0YXNrcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgVGFza3NcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGFza0V4dHJhY3Rpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIHRhc2tzOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiVGFza3NcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBUYXNrczogW10sXG4gICAgQ29udGV4dDogW10sXG4gICAgXCJGb2xsb3ctdXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKFRhc2tzfENvbnRleHR8Rm9sbG93LXVwcylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRhc2tzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuVGFza3MpLFxuICAgIGNvbnRleHQ6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuQ29udGV4dF0pLFxuICAgIGZvbGxvd1VwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiRm9sbG93LXVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiVGFza3NcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDEwKVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtICR7aXRlbX1gKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjb2xsYXBzZVdoaXRlc3BhY2UodGV4dCA/PyBcIlwiKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlUmF0aW9uYWxlKHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsb3dlciA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIChcbiAgICBsb3dlci5pbmNsdWRlcyhcImJlY2F1c2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNvIHRoYXRcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImR1ZSB0b1wiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwicmVhc29uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ0cmFkZW9mZlwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiY29uc3RyYWludFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VEZWNpc2lvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkZWNpZGVcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImRlY2lzaW9uXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjaG9vc2VcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcInNoaXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImFkb3B0XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJkcm9wXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzd2l0Y2hcIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tEZWNpc2lvbkV4dHJhY3Rpb24oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZGVjaXNpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHJhdGlvbmFsZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvcGVuUXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lIHx8IGxpbmUuc3RhcnRzV2l0aChcIi0tLSBcIikgfHwgL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eI3sxLDZ9XFxzKyguKykkLyk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0YXNrWzJdKTtcbiAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRleHQuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VEZWNpc2lvbih0ZXh0KSkge1xuICAgICAgICBkZWNpc2lvbnMuYWRkKHRleHQpO1xuICAgICAgfSBlbHNlIGlmIChsb29rc0xpa2VSYXRpb25hbGUodGV4dCkpIHtcbiAgICAgICAgcmF0aW9uYWxlLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoZGVjaXNpb25zLnNpemUgPCAzKSB7XG4gICAgICAgIGRlY2lzaW9ucy5hZGQodGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByYXRpb25hbGUuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuZW5kc1dpdGgoXCI/XCIpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VEZWNpc2lvbihsaW5lKSkge1xuICAgICAgZGVjaXNpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGxvb2tzTGlrZVJhdGlvbmFsZShsaW5lKSkge1xuICAgICAgcmF0aW9uYWxlLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oZGVjaXNpb25zLCBcIk5vIGNsZWFyIGRlY2lzaW9ucyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKHJhdGlvbmFsZSwgXCJObyBleHBsaWNpdCByYXRpb25hbGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG9wZW5RdWVzdGlvbnMsIFwiTm8gb3BlbiBxdWVzdGlvbnMgaWRlbnRpZmllZC5cIiksXG4gIF0uam9pbihcIlxcblwiKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRGVjaXNpb25FeHRyYWN0aW9uT3V0cHV0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb250ZW50LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICAgIFwiTm8gZGVjaXNpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIGRlY2lzaW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VEZWNpc2lvblNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICBwYXJzZWQuZGVjaXNpb25zIHx8IFwiTm8gY2xlYXIgZGVjaXNpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgcGFyc2VkLnJhdGlvbmFsZSB8fCBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBEZWNpc2lvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBSYXRpb25hbGVcIixcbiAgICBcIk5vIHJhdGlvbmFsZSBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGVjaXNpb25TZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIGRlY2lzaW9uczogc3RyaW5nO1xuICByYXRpb25hbGU6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcIkRlY2lzaW9uc1wiIHwgXCJSYXRpb25hbGVcIiB8IFwiT3BlbiBRdWVzdGlvbnNcIiwgc3RyaW5nW10+ID0ge1xuICAgIERlY2lzaW9uczogW10sXG4gICAgUmF0aW9uYWxlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKERlY2lzaW9uc3xSYXRpb25hbGV8T3BlbiBRdWVzdGlvbnMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkZWNpc2lvbnM6IHRyaW1TZWN0aW9uKFsuLi5wcmVhbWJsZUxpbmVzLCAuLi5zZWN0aW9uTGluZXMuRGVjaXNpb25zXSksXG4gICAgcmF0aW9uYWxlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuUmF0aW9uYWxlKSxcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJPcGVuIFF1ZXN0aW9uc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgRGVjaXNpb25zOiBzdHJpbmdbXTtcbiAgUmF0aW9uYWxlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJyYXRpb25hbGVcIikge1xuICAgIHJldHVybiBcIlJhdGlvbmFsZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm9wZW4gcXVlc3Rpb25zXCIpIHtcbiAgICByZXR1cm4gXCJPcGVuIFF1ZXN0aW9uc1wiO1xuICB9XG4gIHJldHVybiBcIkRlY2lzaW9uc1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgMTApXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VRdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibm90IHN1cmVcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlRm9sbG93VXAodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiZm9sbG93IHVwXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZXh0IHN0ZXBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcImludmVzdGlnYXRlXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJjb25maXJtXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJ2YWxpZGF0ZVwiKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja09wZW5RdWVzdGlvbnMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBjb250ZXh0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGZvbGxvd1VwcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSB8fCBsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShoZWFkaW5nWzFdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKGxvb2tzTGlrZUZvbGxvd1VwKHRleHQpKSB7XG4gICAgICAgIGZvbGxvd1Vwcy5hZGQodGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGV4dCkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmICghdGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VRdWVzdGlvbih0ZXh0KSkge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZCh0ZXh0KTtcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5zaXplIDwgNikge1xuICAgICAgICBjb250ZXh0LmFkZCh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChsb29rc0xpa2VGb2xsb3dVcCh0ZXh0KSkge1xuICAgICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZVF1ZXN0aW9uKGxpbmUpKSB7XG4gICAgICBvcGVuUXVlc3Rpb25zLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNpemUgPCA0KSB7XG4gICAgICBjb250ZXh0LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29udGV4dFwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGNvbnRleHQsIFwiTm8gc3VwcG9ydGluZyBjb250ZXh0IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGZvbGxvd1VwcywgXCJObyBmb2xsb3ctdXBzIGlkZW50aWZpZWQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyBvcGVuLXF1ZXN0aW9uIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBcIk5vIG9wZW4tcXVlc3Rpb24gY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gb3Blbi1xdWVzdGlvbiBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLm9wZW5RdWVzdGlvbnMgfHwgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICBwYXJzZWQuY29udGV4dCB8fCBcIk5vIHN1cHBvcnRpbmcgY29udGV4dCBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgICBwYXJzZWQuZm9sbG93VXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb250ZXh0XCIsXG4gICAgXCJObyBzdXBwb3J0aW5nIGNvbnRleHQgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlT3BlblF1ZXN0aW9uU2VjdGlvbnMoY29udGVudDogc3RyaW5nKToge1xuICBvcGVuUXVlc3Rpb25zOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbiAgZm9sbG93VXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3BlbiBRdWVzdGlvbnNcIiB8IFwiQ29udGV4dFwiIHwgXCJGb2xsb3ctdXBzXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIENvbnRleHQ6IFtdLFxuICAgIFwiRm9sbG93LXVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiMjXFxzKyhPcGVuIFF1ZXN0aW9uc3xDb250ZXh0fEZvbGxvdy11cHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuUXVlc3Rpb25zOiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzW1wiT3BlbiBRdWVzdGlvbnNcIl1dKSxcbiAgICBjb250ZXh0OiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuQ29udGV4dCksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBcIk9wZW4gUXVlc3Rpb25zXCI6IHN0cmluZ1tdO1xuICBDb250ZXh0OiBzdHJpbmdbXTtcbiAgXCJGb2xsb3ctdXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImNvbnRleHRcIikge1xuICAgIHJldHVybiBcIkNvbnRleHRcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJmb2xsb3ctdXBzXCIpIHtcbiAgICByZXR1cm4gXCJGb2xsb3ctdXBzXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja0NsZWFuTm90ZShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBrZXlQb2ludHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcXVlc3Rpb25zID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSB8fCAvXjwhLS1cXHMqYnJhaW4tcmV2aWV3ZWQ6L2kudGVzdChsaW5lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGhlYWRpbmdbMV0pO1xuICAgICAgaWYgKGhlYWRpbmdUZXh0KSB7XG4gICAgICAgIG92ZXJ2aWV3LmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAga2V5UG9pbnRzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAga2V5UG9pbnRzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5lbmRzV2l0aChcIj9cIikpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBxdWVzdGlvbnMuYWRkKHF1ZXN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChvdmVydmlldy5zaXplIDwgNCkge1xuICAgICAgb3ZlcnZpZXcuYWRkKHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvdmVydmlldywgXCJObyBvdmVydmlldyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIEtleSBQb2ludHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihrZXlQb2ludHMsIFwiTm8ga2V5IHBvaW50cyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ocXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2xlYW5Ob3RlU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIENsZWFuIE5vdGVcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBwYXJzZWQub3ZlcnZpZXcgfHwgXCJObyBvdmVydmlldyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICBwYXJzZWQua2V5UG9pbnRzIHx8IFwiTm8ga2V5IHBvaW50cyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgcGFyc2VkLnF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyBDbGVhbiBOb3RlXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgdHJpbW1lZCxcbiAgICBcIlwiLFxuICAgIFwiIyMgS2V5IFBvaW50c1wiLFxuICAgIFwiTm8ga2V5IHBvaW50cyBleHRyYWN0ZWQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgXCJObyBvcGVuIHF1ZXN0aW9ucyBleHRyYWN0ZWQuXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VDbGVhbk5vdGVTZWN0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XG4gIG92ZXJ2aWV3OiBzdHJpbmc7XG4gIGtleVBvaW50czogc3RyaW5nO1xuICBxdWVzdGlvbnM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJPdmVydmlld1wiIHwgXCJLZXkgUG9pbnRzXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIsIHN0cmluZ1tdPiA9IHtcbiAgICBPdmVydmlldzogW10sXG4gICAgXCJLZXkgUG9pbnRzXCI6IFtdLFxuICAgIFwiT3BlbiBRdWVzdGlvbnNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoT3ZlcnZpZXd8S2V5IFBvaW50c3xPcGVuIFF1ZXN0aW9ucylcXHMqJC9pKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY3VycmVudFNlY3Rpb24gPSBjYW5vbmljYWxTZWN0aW9uTmFtZShoZWFkaW5nWzFdKTtcbiAgICAgIHNhd0hlYWRpbmcgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgICBpZiAobGluZS5tYXRjaCgvXiNcXHMrLykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgcHJlYW1ibGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uKSB7XG4gICAgICBzZWN0aW9uTGluZXNbY3VycmVudFNlY3Rpb25dLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzYXdIZWFkaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG92ZXJ2aWV3OiB0cmltU2VjdGlvbihbLi4ucHJlYW1ibGVMaW5lcywgLi4uc2VjdGlvbkxpbmVzLk92ZXJ2aWV3XSksXG4gICAga2V5UG9pbnRzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJLZXkgUG9pbnRzXCJdKSxcbiAgICBxdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIFwiS2V5IFBvaW50c1wiOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJrZXkgcG9pbnRzXCIpIHtcbiAgICByZXR1cm4gXCJLZXkgUG9pbnRzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwib3BlbiBxdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cbiAgcmV0dXJuIFwiT3ZlcnZpZXdcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSB9IGZyb20gXCIuL2RhdGVcIjtcblxuZnVuY3Rpb24gZm9ybWF0TGlzdFNlY3Rpb24oaXRlbXM6IFNldDxzdHJpbmc+LCBlbXB0eU1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBgLSAke2VtcHR5TWVzc2FnZX1gO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0ID8/IFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGYWxsYmFja1Byb2plY3RCcmllZihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvdmVydmlldyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBnb2FscyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzY29wZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBuZXh0U3RlcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgc2NvcGUuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrXFxbKCB8eHxYKVxcXVxccysoLispJC8pO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICBjb25zdCB0YXNrVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UodGFza1syXSk7XG4gICAgICBpZiAodGFza1RleHQpIHtcbiAgICAgICAgbmV4dFN0ZXBzLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIGdvYWxzLmFkZCh0YXNrVGV4dCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eWy0qK11cXHMrKD8hXFxbKCB8eHxYKVxcXVxccyspKC4rKSQvKTtcbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBjb25zdCBidWxsZXRUZXh0ID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShidWxsZXRbMl0pO1xuICAgICAgaWYgKGJ1bGxldFRleHQpIHtcbiAgICAgICAgc2NvcGUuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICBpZiAobG9va3NMaWtlR29hbChidWxsZXRUZXh0KSkge1xuICAgICAgICAgIGdvYWxzLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGxvb2tzTGlrZUdvYWwobGluZSkpIHtcbiAgICAgIGdvYWxzLmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKG92ZXJ2aWV3LnNpemUgPCA0KSB7XG4gICAgICBvdmVydmlldy5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG92ZXJ2aWV3LCBcIk5vIG92ZXJ2aWV3IGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgR29hbHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihnb2FscywgXCJObyBnb2FscyBmb3VuZC5cIiksXG4gICAgXCJcIixcbiAgICBcIiMjIFNjb3BlXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24oc2NvcGUsIFwiTm8gc2NvcGUgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24obmV4dFN0ZXBzLCBcIk5vIG5leHQgc3RlcHMgZm91bmQuXCIpLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZUdvYWwodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gKFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJnb2FsIFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJnb2FscyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmVlZCBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwibmVlZHMgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIndhbnQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIndhbnRzIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwic2hvdWxkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibXVzdCBcIikgfHxcbiAgICBsb3dlci5pbmNsdWRlcyhcIm9iamVjdGl2ZVwiKVxuICApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcm9qZWN0QnJpZWZPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE92ZXJ2aWV3XCIsXG4gICAgICBcIk5vIHN5bnRoZXNpcyBjb250ZW50IHJldHVybmVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgXCJObyBzeW50aGVzaXMgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIFwiTm8gc3ludGhlc2lzIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gcGFyc2VQcm9qZWN0QnJpZWZTZWN0aW9ucyh0cmltbWVkKTtcbiAgaWYgKHBhcnNlZCkge1xuICAgIHJldHVybiBbXG4gICAgICBcIiMgUHJvamVjdCBCcmllZlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgIHBhcnNlZC5vdmVydmlldyB8fCBcIk5vIG92ZXJ2aWV3IGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEdvYWxzXCIsXG4gICAgICBwYXJzZWQuZ29hbHMgfHwgXCJObyBnb2FscyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTY29wZVwiLFxuICAgICAgcGFyc2VkLnNjb3BlIHx8IFwiTm8gc2NvcGUgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgcGFyc2VkLm5leHRTdGVwcyB8fCBcIk5vIG5leHQgc3RlcHMgZXh0cmFjdGVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICBcIlwiLFxuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBHb2Fsc1wiLFxuICAgIFwiTm8gZ29hbHMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTY29wZVwiLFxuICAgIFwiTm8gc2NvcGUgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgXCJObyBuZXh0IHN0ZXBzIGV4dHJhY3RlZC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVByb2plY3RCcmllZlNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAgZ29hbHM6IHN0cmluZztcbiAgc2NvcGU6IHN0cmluZztcbiAgbmV4dFN0ZXBzOiBzdHJpbmc7XG59IHwgbnVsbCB7XG4gIGNvbnN0IHNlY3Rpb25MaW5lczogUmVjb3JkPFwiT3ZlcnZpZXdcIiB8IFwiR29hbHNcIiB8IFwiU2NvcGVcIiB8IFwiTmV4dCBTdGVwc1wiLCBzdHJpbmdbXT4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIEdvYWxzOiBbXSxcbiAgICBTY29wZTogW10sXG4gICAgXCJOZXh0IFN0ZXBzXCI6IFtdLFxuICB9O1xuICBjb25zdCBwcmVhbWJsZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50U2VjdGlvbjoga2V5b2YgdHlwZW9mIHNlY3Rpb25MaW5lcyB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F3SGVhZGluZyA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBjb250ZW50LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eIyNcXHMrKE92ZXJ2aWV3fEdvYWxzfFNjb3BlfE5leHQgU3RlcHMpXFxzKiQvaSk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGdvYWxzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuR29hbHMpLFxuICAgIHNjb3BlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuU2NvcGUpLFxuICAgIG5leHRTdGVwczogdHJpbVNlY3Rpb24oc2VjdGlvbkxpbmVzW1wiTmV4dCBTdGVwc1wiXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFNlY3Rpb25OYW1lKHNlY3Rpb246IHN0cmluZyk6IGtleW9mIHtcbiAgT3ZlcnZpZXc6IHN0cmluZ1tdO1xuICBHb2Fsczogc3RyaW5nW107XG4gIFNjb3BlOiBzdHJpbmdbXTtcbiAgXCJOZXh0IFN0ZXBzXCI6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzZWN0aW9uLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChub3JtYWxpemVkID09PSBcImdvYWxzXCIpIHtcbiAgICByZXR1cm4gXCJHb2Fsc1wiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcInNjb3BlXCIpIHtcbiAgICByZXR1cm4gXCJTY29wZVwiO1xuICB9XG4gIGlmIChub3JtYWxpemVkID09PSBcIm5leHQgc3RlcHNcIikge1xuICAgIHJldHVybiBcIk5leHQgU3RlcHNcIjtcbiAgfVxuICByZXR1cm4gXCJPdmVydmlld1wiO1xufVxuXG5mdW5jdGlvbiB0cmltU2VjdGlvbihsaW5lczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKS50cmltKCk7XG59XG4iLCAiaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW50aGVzaXNUZW1wbGF0ZVRpdGxlKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSk6IHN0cmluZyB7XG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICByZXR1cm4gXCJUYXNrIEV4dHJhY3Rpb25cIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LWRlY2lzaW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiRGVjaXNpb24gRXh0cmFjdGlvblwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIk9wZW4gUXVlc3Rpb25zXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICByZXR1cm4gXCJDbGVhbiBOb3RlXCI7XG4gIH1cblxuICBpZiAodGVtcGxhdGUgPT09IFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdCBCcmllZlwiO1xuICB9XG5cbiAgcmV0dXJuIFwiU3VtbWFyeVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbCh0ZW1wbGF0ZTogU3ludGhlc2lzVGVtcGxhdGUpOiBzdHJpbmcge1xuICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgcmV0dXJuIFwiRXh0cmFjdCBUYXNrc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3QtZGVjaXNpb25zXCIpIHtcbiAgICByZXR1cm4gXCJFeHRyYWN0IERlY2lzaW9uc1wiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIikge1xuICAgIHJldHVybiBcIkV4dHJhY3QgT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZSA9PT0gXCJyZXdyaXRlLWNsZWFuLW5vdGVcIikge1xuICAgIHJldHVybiBcIlJld3JpdGUgYXMgQ2xlYW4gTm90ZVwiO1xuICB9XG5cbiAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgIHJldHVybiBcIkRyYWZ0IFByb2plY3QgQnJpZWZcIjtcbiAgfVxuXG4gIHJldHVybiBcIlN1bW1hcml6ZVwiO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgU3ludGhlc2lzQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQtc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrVG9waWNQYWdlIH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2UtZm9ybWF0XCI7XG5pbXBvcnQgeyBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvdG9waWMtcGFnZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3ludGhlc2lzUmVzdWx0IH0gZnJvbSBcIi4vc3ludGhlc2lzLXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFRvcGljUGFnZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgY3JlYXRlVG9waWNQYWdlKHRvcGljOiBzdHJpbmcsIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZFRvcGljID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRvcGljKTtcbiAgICBpZiAoIWNsZWFuZWRUb3BpYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9waWMgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGZhbGxiYWNrID0gYnVpbGRGYWxsYmFja1RvcGljUGFnZShcbiAgICAgIGNsZWFuZWRUb3BpYyxcbiAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgIGNvbnRleHQuc291cmNlTGFiZWwsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGgsXG4gICAgICBjb250ZXh0LnNvdXJjZVBhdGhzLFxuICAgICk7XG4gICAgbGV0IGNvbnRlbnQgPSBmYWxsYmFjaztcbiAgICBsZXQgdXNlZEFJID0gZmFsc2U7XG5cbiAgICBpZiAoc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpIHtcbiAgICAgIGlmICghc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhc2V0dGluZ3Mub3BlbkFJTW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJBSSB0b3BpYyBwYWdlcyBhcmUgZW5hYmxlZCBidXQgT3BlbkFJIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuY3JlYXRlVG9waWNQYWdlKGNsZWFuZWRUb3BpYywgY29udGV4dCwgc2V0dGluZ3MpO1xuICAgICAgICAgIHVzZWRBSSA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGZlbGwgYmFjayB0byBsb2NhbCB0b3BpYyBwYWdlIGdlbmVyYXRpb25cIik7XG4gICAgICAgICAgY29udGVudCA9IGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBlbnN1cmVUb3BpY0J1bGxldChcbiAgICAgIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChjb250ZW50KSxcbiAgICAgIGNsZWFuZWRUb3BpYyxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogXCJUb3BpYyBQYWdlXCIsXG4gICAgICB0aXRsZTogXCJUb3BpYyBQYWdlXCIsXG4gICAgICBub3RlVGl0bGU6IHNob3J0ZW5Ub3BpYyhjbGVhbmVkVG9waWMpLFxuICAgICAgY29udGVudDogbm9ybWFsaXplZENvbnRlbnQsXG4gICAgICB1c2VkQUksXG4gICAgICBwcm9tcHRUZXh0OiBjbGVhbmVkVG9waWMsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbnN1cmVUb3BpY0J1bGxldChjb250ZW50OiBzdHJpbmcsIHRvcGljOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkVG9waWMgPSBjb2xsYXBzZVdoaXRlc3BhY2UodG9waWMpO1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IG92ZXJ2aWV3SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGxpbmUpID0+IC9eIyNcXHMrT3ZlcnZpZXdcXHMqJC8udGVzdChsaW5lKSk7XG4gIGlmIChvdmVydmlld0luZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgbmV4dEhlYWRpbmdJbmRleCA9IGxpbmVzLmZpbmRJbmRleChcbiAgICAobGluZSwgaW5kZXgpID0+IGluZGV4ID4gb3ZlcnZpZXdJbmRleCAmJiAvXiMjXFxzKy8udGVzdChsaW5lKSxcbiAgKTtcbiAgY29uc3QgdG9waWNMaW5lID0gYC0gVG9waWM6ICR7bm9ybWFsaXplZFRvcGljfWA7XG4gIGNvbnN0IG92ZXJ2aWV3U2xpY2UgPSBsaW5lcy5zbGljZShcbiAgICBvdmVydmlld0luZGV4ICsgMSxcbiAgICBuZXh0SGVhZGluZ0luZGV4ID09PSAtMSA/IGxpbmVzLmxlbmd0aCA6IG5leHRIZWFkaW5nSW5kZXgsXG4gICk7XG4gIGlmIChvdmVydmlld1NsaWNlLnNvbWUoKGxpbmUpID0+IGxpbmUudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcIi0gdG9waWM6XCIpKSkge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgY29uc3QgaW5zZXJ0aW9uSW5kZXggPSBvdmVydmlld0luZGV4ICsgMTtcbiAgY29uc3QgdXBkYXRlZCA9IFsuLi5saW5lc107XG4gIHVwZGF0ZWQuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCB0b3BpY0xpbmUpO1xuICByZXR1cm4gdXBkYXRlZC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzaG9ydGVuVG9waWModG9waWM6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsZWFuZWQgPSB0b3BpYy50cmltKCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSA2MCkge1xuICAgIHJldHVybiBjbGVhbmVkIHx8IGBUb3BpYyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfWA7XG4gIH1cblxuICByZXR1cm4gYCR7Y2xlYW5lZC5zbGljZSgwLCA1NykudHJpbUVuZCgpfS4uLmA7XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlIH0gZnJvbSBcIi4vZGF0ZVwiO1xuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShpdGVtcylcbiAgICAuc2xpY2UoMCwgOClcbiAgICAubWFwKChpdGVtKSA9PiBgLSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIGxvb2tzTGlrZU9wZW5RdWVzdGlvbih0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuZW5kc1dpdGgoXCI/XCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJxdWVzdGlvblwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5jbGVhclwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwib3BlbiBpc3N1ZVwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwidW5rbm93blwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VOZXh0U3RlcCh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAoXG4gICAgbG93ZXIuc3RhcnRzV2l0aChcIm5leHQgXCIpIHx8XG4gICAgbG93ZXIuc3RhcnRzV2l0aChcImZvbGxvdyB1cFwiKSB8fFxuICAgIGxvd2VyLnN0YXJ0c1dpdGgoXCJmb2xsb3ctdXBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwidG9kbyBcIikgfHxcbiAgICBsb3dlci5zdGFydHNXaXRoKFwidG8tZG8gXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJzaG91bGQgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJuZWVkIFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwibmVlZHMgXCIpIHx8XG4gICAgbG93ZXIuaW5jbHVkZXMoXCJtdXN0IFwiKSB8fFxuICAgIGxvd2VyLmluY2x1ZGVzKFwiYWN0aW9uXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNvdXJjZXMoXG4gIHNvdXJjZUxhYmVsOiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIHNvdXJjZVBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBpZiAoc291cmNlUGF0aHMgJiYgc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBzb3VyY2VQYXRocy5zbGljZSgwLCAxMikpIHtcbiAgICAgIHNvdXJjZXMuYWRkKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2VQYXRocy5sZW5ndGggPiAxMikge1xuICAgICAgc291cmNlcy5hZGQoYC4uLmFuZCAke3NvdXJjZVBhdGhzLmxlbmd0aCAtIDEyfSBtb3JlYCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHNvdXJjZVBhdGgpIHtcbiAgICBzb3VyY2VzLmFkZChzb3VyY2VQYXRoKTtcbiAgfSBlbHNlIHtcbiAgICBzb3VyY2VzLmFkZChzb3VyY2VMYWJlbCk7XG4gIH1cblxuICByZXR1cm4gZm9ybWF0TGlzdFNlY3Rpb24oc291cmNlcywgXCJObyBleHBsaWNpdCBzb3VyY2VzIGZvdW5kLlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tUb3BpY1BhZ2UoXG4gIHRvcGljOiBzdHJpbmcsXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgc291cmNlTGFiZWw6IHN0cmluZyxcbiAgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgc291cmNlUGF0aHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgb3ZlcnZpZXcgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZXZpZGVuY2UgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3BlblF1ZXN0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBuZXh0U3RlcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcbiAgICBpZiAoIWxpbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCItLS0gXCIpIHx8IC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaS50ZXN0KGxpbmUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXiN7MSw2fVxccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBoZWFkaW5nVGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoaGVhZGluZ1sxXSk7XG4gICAgICBpZiAoaGVhZGluZ1RleHQpIHtcbiAgICAgICAgb3ZlcnZpZXcuYWRkKGhlYWRpbmdUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihoZWFkaW5nVGV4dCkpIHtcbiAgICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChoZWFkaW5nVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvb2tzTGlrZU5leHRTdGVwKGhlYWRpbmdUZXh0KSkge1xuICAgICAgICAgIG5leHRTdGVwcy5hZGQoaGVhZGluZ1RleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGFza1RleHQgPSBzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKHRhc2tbMl0pO1xuICAgICAgaWYgKHRhc2tUZXh0KSB7XG4gICAgICAgIGV2aWRlbmNlLmFkZCh0YXNrVGV4dCk7XG4gICAgICAgIG5leHRTdGVwcy5hZGQodGFza1RleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgYnVsbGV0VGV4dCA9IHNhZmVDb2xsYXBzZVdoaXRlc3BhY2UoYnVsbGV0WzJdKTtcbiAgICAgIGlmIChidWxsZXRUZXh0KSB7XG4gICAgICAgIGV2aWRlbmNlLmFkZChidWxsZXRUZXh0KTtcbiAgICAgICAgaWYgKGxvb2tzTGlrZU9wZW5RdWVzdGlvbihidWxsZXRUZXh0KSkge1xuICAgICAgICAgIG9wZW5RdWVzdGlvbnMuYWRkKGJ1bGxldFRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb29rc0xpa2VOZXh0U3RlcChidWxsZXRUZXh0KSkge1xuICAgICAgICAgIG5leHRTdGVwcy5hZGQoYnVsbGV0VGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsb29rc0xpa2VPcGVuUXVlc3Rpb24obGluZSkpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKTtcbiAgICAgIGlmIChxdWVzdGlvbikge1xuICAgICAgICBvcGVuUXVlc3Rpb25zLmFkZChxdWVzdGlvbik7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAob3ZlcnZpZXcuc2l6ZSA8IDQpIHtcbiAgICAgIG92ZXJ2aWV3LmFkZChzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlKGxpbmUpKTtcbiAgICB9IGVsc2UgaWYgKGV2aWRlbmNlLnNpemUgPCA0KSB7XG4gICAgICBldmlkZW5jZS5hZGQoc2FmZUNvbGxhcHNlV2hpdGVzcGFjZShsaW5lKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFuZXh0U3RlcHMuc2l6ZSkge1xuICAgIG5leHRTdGVwcy5hZGQoXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgXCIjIyBPdmVydmlld1wiLFxuICAgIGAtIFRvcGljOiAke3NhZmVDb2xsYXBzZVdoaXRlc3BhY2UodG9waWMpfWAsXG4gICAgZm9ybWF0TGlzdFNlY3Rpb24ob3ZlcnZpZXcsIFwiTm8gb3ZlcnZpZXcgZm91bmQuXCIpLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGV2aWRlbmNlLCBcIk5vIGV2aWRlbmNlIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgT3BlbiBRdWVzdGlvbnNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihvcGVuUXVlc3Rpb25zLCBcIk5vIG9wZW4gcXVlc3Rpb25zIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgU291cmNlc1wiLFxuICAgIGZvcm1hdFNvdXJjZXMoc291cmNlTGFiZWwsIHNvdXJjZVBhdGgsIHNvdXJjZVBhdGhzKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKG5leHRTdGVwcywgXCJSZXZpZXcgdGhlIHNvdXJjZSBjb250ZXh0LlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVUb3BpY1BhZ2VPdXRwdXQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgXCJObyB0b3BpYyBwYWdlIGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICBcIk5vIHRvcGljIHBhZ2UgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE5leHQgU3RlcHNcIixcbiAgICAgIFwiTm8gdG9waWMgcGFnZSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVG9waWNQYWdlU2VjdGlvbnModHJpbW1lZCk7XG4gIGlmIChwYXJzZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgcGFyc2VkLm92ZXJ2aWV3IHx8IFwiTm8gb3ZlcnZpZXcgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgIHBhcnNlZC5ldmlkZW5jZSB8fCBcIk5vIGV2aWRlbmNlIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICBwYXJzZWQub3BlblF1ZXN0aW9ucyB8fCBcIk5vIG9wZW4gcXVlc3Rpb25zIGV4dHJhY3RlZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFNvdXJjZXNcIixcbiAgICAgIHBhcnNlZC5zb3VyY2VzIHx8IFwiTm8gc291cmNlcyBleHRyYWN0ZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICBwYXJzZWQubmV4dFN0ZXBzIHx8IFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgIFwiTm8gZXZpZGVuY2UgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgIFwiTm8gb3BlbiBxdWVzdGlvbnMgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgXCJObyBzb3VyY2VzIGV4dHJhY3RlZC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgIFwiUmV2aWV3IHRoZSBzb3VyY2UgY29udGV4dC5cIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRvcGljUGFnZVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgb3ZlcnZpZXc6IHN0cmluZztcbiAgZXZpZGVuY2U6IHN0cmluZztcbiAgb3BlblF1ZXN0aW9uczogc3RyaW5nO1xuICBzb3VyY2VzOiBzdHJpbmc7XG4gIG5leHRTdGVwczogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBzZWN0aW9uTGluZXM6IFJlY29yZDxcbiAgICBcIk92ZXJ2aWV3XCIgfCBcIkV2aWRlbmNlXCIgfCBcIk9wZW4gUXVlc3Rpb25zXCIgfCBcIlNvdXJjZXNcIiB8IFwiTmV4dCBTdGVwc1wiLFxuICAgIHN0cmluZ1tdXG4gID4gPSB7XG4gICAgT3ZlcnZpZXc6IFtdLFxuICAgIEV2aWRlbmNlOiBbXSxcbiAgICBcIk9wZW4gUXVlc3Rpb25zXCI6IFtdLFxuICAgIFNvdXJjZXM6IFtdLFxuICAgIFwiTmV4dCBTdGVwc1wiOiBbXSxcbiAgfTtcbiAgY29uc3QgcHJlYW1ibGVMaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBsZXQgY3VycmVudFNlY3Rpb246IGtleW9mIHR5cGVvZiBzZWN0aW9uTGluZXMgfCBudWxsID0gbnVsbDtcbiAgbGV0IHNhd0hlYWRpbmcgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgY29udGVudC5zcGxpdChcIlxcblwiKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaChcbiAgICAgIC9eIyNcXHMrKE92ZXJ2aWV3fEV2aWRlbmNlfE9wZW4gUXVlc3Rpb25zfFNvdXJjZXN8TmV4dCBTdGVwcylcXHMqJC9pLFxuICAgICk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uID0gY2Fub25pY2FsU2VjdGlvbk5hbWUoaGVhZGluZ1sxXSk7XG4gICAgICBzYXdIZWFkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghc2F3SGVhZGluZykge1xuICAgICAgaWYgKGxpbmUubWF0Y2goL14jXFxzKy8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUudHJpbSgpKSB7XG4gICAgICAgIHByZWFtYmxlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50U2VjdGlvbikge1xuICAgICAgc2VjdGlvbkxpbmVzW2N1cnJlbnRTZWN0aW9uXS5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2F3SGVhZGluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvdmVydmlldzogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5PdmVydmlld10pLFxuICAgIGV2aWRlbmNlOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuRXZpZGVuY2UpLFxuICAgIG9wZW5RdWVzdGlvbnM6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lc1tcIk9wZW4gUXVlc3Rpb25zXCJdKSxcbiAgICBzb3VyY2VzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXMuU291cmNlcyksXG4gICAgbmV4dFN0ZXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJOZXh0IFN0ZXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBPdmVydmlldzogc3RyaW5nW107XG4gIEV2aWRlbmNlOiBzdHJpbmdbXTtcbiAgXCJPcGVuIFF1ZXN0aW9uc1wiOiBzdHJpbmdbXTtcbiAgU291cmNlczogc3RyaW5nW107XG4gIFwiTmV4dCBTdGVwc1wiOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBub3JtYWxpemVkID0gc2VjdGlvbi50b0xvd2VyQ2FzZSgpO1xuICBpZiAobm9ybWFsaXplZCA9PT0gXCJldmlkZW5jZVwiKSB7XG4gICAgcmV0dXJuIFwiRXZpZGVuY2VcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJvcGVuIHF1ZXN0aW9uc1wiKSB7XG4gICAgcmV0dXJuIFwiT3BlbiBRdWVzdGlvbnNcIjtcbiAgfVxuICBpZiAobm9ybWFsaXplZCA9PT0gXCJzb3VyY2VzXCIpIHtcbiAgICByZXR1cm4gXCJTb3VyY2VzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwibmV4dCBzdGVwc1wiKSB7XG4gICAgcmV0dXJuIFwiTmV4dCBTdGVwc1wiO1xuICB9XG4gIHJldHVybiBcIk92ZXJ2aWV3XCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1TZWN0aW9uKGxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBjb2xsYXBzZVdoaXRlc3BhY2UsIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUYXNrVmF1bHRTZXJ2aWNlIHtcbiAgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+O1xuICByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFRhc2tTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBvcGVuVGFza0NvdW50Q2FjaGU6IHtcbiAgICBtdGltZTogbnVtYmVyO1xuICAgIGNvdW50OiBudW1iZXI7XG4gIH0gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVGFza1ZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBhcHBlbmRUYXNrKHRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhc2sgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2sgPSBgLSBbIF0gJHtjbGVhbmVkfSBfKGFkZGVkICR7Zm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSl9KV9gO1xuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQoc2V0dGluZ3MudGFza3NGaWxlLCBibG9jayk7XG4gICAgdGhpcy5vcGVuVGFza0NvdW50Q2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB7IHBhdGg6IHNldHRpbmdzLnRhc2tzRmlsZSB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0T3BlblRhc2tDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgeyB0ZXh0LCBtdGltZSwgZXhpc3RzIH0gPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dFdpdGhNdGltZShzZXR0aW5ncy50YXNrc0ZpbGUpO1xuICAgIGlmICghZXhpc3RzKSB7XG4gICAgICB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSA9IHtcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGNvdW50OiAwLFxuICAgICAgfTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wZW5UYXNrQ291bnRDYWNoZSAmJiB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZS5tdGltZSA9PT0gbXRpbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wZW5UYXNrQ291bnRDYWNoZS5jb3VudDtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IHRleHRcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAvXi0gXFxbKCB8eHxYKVxcXS8udGVzdChsaW5lKSlcbiAgICAgIC5maWx0ZXIoKGxpbmUpID0+ICEvXi0gXFxbKHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAubGVuZ3RoO1xuICAgIHRoaXMub3BlblRhc2tDb3VudENhY2hlID0ge1xuICAgICAgbXRpbWUsXG4gICAgICBjb3VudCxcbiAgICB9O1xuICAgIHJldHVybiBjb3VudDtcbiAgfVxufVxuIiwgImltcG9ydCB7IHJlcXVlc3RVcmwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvc3VtbWFyeS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN5bnRoZXNpc091dHB1dCB9IGZyb20gXCIuLi91dGlscy9zeW50aGVzaXMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBub3JtYWxpemVUYXNrRXh0cmFjdGlvbk91dHB1dCB9IGZyb20gXCIuLi91dGlscy90YXNrLWV4dHJhY3Qtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVEZWNpc2lvbkV4dHJhY3Rpb25PdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvZGVjaXNpb24tZXh0cmFjdC1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZU9wZW5RdWVzdGlvbnNPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvb3Blbi1xdWVzdGlvbnMtbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBub3JtYWxpemVDbGVhbk5vdGVPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvY2xlYW4tbm90ZS1ub3JtYWxpemVcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dCB9IGZyb20gXCIuLi91dGlscy9wcm9qZWN0LWJyaWVmLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUXVlc3Rpb25BbnN3ZXJPdXRwdXQgfSBmcm9tIFwiLi4vdXRpbHMvcXVlc3Rpb24tYW5zd2VyLW5vcm1hbGl6ZVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplVG9waWNQYWdlT3V0cHV0IH0gZnJvbSBcIi4uL3V0aWxzL3RvcGljLXBhZ2Utbm9ybWFsaXplXCI7XG5pbXBvcnQgeyBmb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyB9IGZyb20gXCIuLi91dGlscy9jb250ZXh0LWZvcm1hdFwiO1xuaW1wb3J0IHsgU3ludGhlc2lzVGVtcGxhdGUgfSBmcm9tIFwiLi4vdmlld3MvdGVtcGxhdGUtcGlja2VyLW1vZGFsXCI7XG5cbnR5cGUgUm91dGVMYWJlbCA9IFwibm90ZVwiIHwgXCJ0YXNrXCIgfCBcImpvdXJuYWxcIiB8IG51bGw7XG5cbmludGVyZmFjZSBDaGF0Q29tcGxldGlvbkNob2ljZSB7XG4gIG1lc3NhZ2U/OiB7XG4gICAgY29udGVudD86IHN0cmluZztcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENoYXRDb21wbGV0aW9uUmVzcG9uc2Uge1xuICBjaG9pY2VzPzogQ2hhdENvbXBsZXRpb25DaG9pY2VbXTtcbn1cblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIGFzeW5jIHN1bW1hcml6ZSh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucG9zdENoYXRDb21wbGV0aW9uKHNldHRpbmdzLCBbXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgXCJZb3Ugc3VtbWFyaXplIG1hcmtkb3duIHZhdWx0IGNvbnRlbnQuIFJlc3BvbmQgd2l0aCBjb25jaXNlIG1hcmtkb3duIHVzaW5nIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyB2YXVsdCBjb250ZW50IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgICAgIFwiIyMgVGFza3NcIixcbiAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgdGFza3MuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN1bW1hcnkocmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgc3ludGhlc2l6ZUNvbnRleHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZFByb21wdCh0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgcHJvbXB0KTtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUodGVtcGxhdGUsIHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIHJvdXRlVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTxSb3V0ZUxhYmVsPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiQ2xhc3NpZnkgY2FwdHVyZSB0ZXh0IGludG8gZXhhY3RseSBvbmUgb2Y6IG5vdGUsIHRhc2ssIGpvdXJuYWwuIFJldHVybiBvbmUgd29yZCBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkNsYXNzaWZ5IHRoZSBmb2xsb3dpbmcgdXNlciBpbnB1dCBhcyBleGFjdGx5IG9uZSBvZjpcIixcbiAgICAgICAgICBcIm5vdGVcIixcbiAgICAgICAgICBcInRhc2tcIixcbiAgICAgICAgICBcImpvdXJuYWxcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIG9ubHkgb25lIHdvcmQuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgY29uc3QgY2xlYW5lZCA9IHJlc3BvbnNlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjbGVhbmVkID09PSBcIm5vdGVcIiB8fCBjbGVhbmVkID09PSBcInRhc2tcIiB8fCBjbGVhbmVkID09PSBcImpvdXJuYWxcIikge1xuICAgICAgcmV0dXJuIGNsZWFuZWQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgYW5zd2VyUXVlc3Rpb24oXG4gICAgcXVlc3Rpb246IHN0cmluZyxcbiAgICBjb250ZXh0OiBTeW50aGVzaXNDb250ZXh0LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSBhbnN3ZXIgcXVlc3Rpb25zIHVzaW5nIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgb25seS4gUmVzcG9uZCB3aXRoIGNvbmNpc2UgbWFya2Rvd24gdXNpbmcgdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5IGFuZCBkbyBub3QgaW52ZW50IGZhY3RzLlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIkFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXN0aW9uIHVzaW5nIG9ubHkgdGhlIGNvbnRleHQgYmVsb3cuXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBgUXVlc3Rpb246ICR7cXVlc3Rpb259YCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiUmV0dXJuIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBRdWVzdGlvblwiLFxuICAgICAgICAgIFwiIyMgQW5zd2VyXCIsXG4gICAgICAgICAgXCIjIyBFdmlkZW5jZVwiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJJZiB0aGUgY29udGV4dCBpcyBpbnN1ZmZpY2llbnQsIHNheSBzbyBleHBsaWNpdGx5LlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVF1ZXN0aW9uQW5zd2VyT3V0cHV0KHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRvcGljUGFnZShcbiAgICB0b3BpYzogc3RyaW5nLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBvc3RDaGF0Q29tcGxldGlvbihzZXR0aW5ncywgW1xuICAgICAge1xuICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICBjb250ZW50OlxuICAgICAgICAgIFwiWW91IHR1cm4gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dCBpbnRvIGEgZHVyYWJsZSB3aWtpIHBhZ2UuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkgYW5kIGRvIG5vdCBpbnZlbnQgZmFjdHMuXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogW1xuICAgICAgICAgIGBDcmVhdGUgYSB0b3BpYyBwYWdlIGZvcjogJHt0b3BpY31gLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJSZXR1cm4gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICBgLSBUb3BpYzogJHt0b3BpY31gLFxuICAgICAgICAgIFwiIyMgRXZpZGVuY2VcIixcbiAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgXCIjIyBTb3VyY2VzXCIsXG4gICAgICAgICAgXCIjIyBOZXh0IFN0ZXBzXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHRoZSBwYWdlIHJldXNhYmxlLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgIF1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICB9LFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVRvcGljUGFnZU91dHB1dChyZXNwb25zZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDaGF0Q29tcGxldGlvbihcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5BSSBBUEkga2V5IGlzIG1pc3NpbmdcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zXCIsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7c2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKX1gLFxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1vZGVsOiBzZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCksXG4gICAgICAgIG1lc3NhZ2VzLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4yLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzdWx0Lmpzb24gYXMgQ2hhdENvbXBsZXRpb25SZXNwb25zZTtcbiAgICBjb25zdCBjb250ZW50ID0ganNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQgPz8gXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVuQUkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRQcm9tcHQoXG4gICAgdGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLFxuICAgIGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQsXG4gICk6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4ge1xuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LXRhc2tzXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IGFjdGlvbmFibGUgdGFza3MgZnJvbSBleHBsaWNpdCBtYXJrZG93biB2YXVsdCBjb250ZXh0LiBSZXNwb25kIHdpdGggdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgXCJFeHRyYWN0IHRhc2tzIGZyb20gdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICAgICAgICBcIiMjIENvbnRleHRcIixcbiAgICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIGFjdGlvbmFibGUgaXRlbXMuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwicmV3cml0ZS1jbGVhbi1ub3RlXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSByZXdyaXRlIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBhIGNsZWFuIG1hcmtkb3duIG5vdGUuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIlJld3JpdGUgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIiMgQ2xlYW4gTm90ZVwiLFxuICAgICAgICAgICAgXCIjIyBPdmVydmlld1wiLFxuICAgICAgICAgICAgXCIjIyBLZXkgUG9pbnRzXCIsXG4gICAgICAgICAgICBcIiMjIE9wZW4gUXVlc3Rpb25zXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgdGhlIHN0cnVjdHVyZSBvZiBhIHJldXNhYmxlIG5vdGUuXCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgLi4uZm9ybWF0Q29udGV4dE1ldGFkYXRhTGluZXMoY29udGV4dCksXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICAgIF1cbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGV4dHJhY3QgZGVjaXNpb25zIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCBkZWNpc2lvbnMgZnJvbSB0aGUgZm9sbG93aW5nIGNvbnRleHQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiIyMgRGVjaXNpb25zXCIsXG4gICAgICAgICAgICBcIiMjIFJhdGlvbmFsZVwiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHVuY2VydGFpbnR5IHdoZXJlIGNvbnRleHQgaXMgaW5jb21wbGV0ZS5cIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAuLi5mb3JtYXRDb250ZXh0TWV0YWRhdGFMaW5lcyhjb250ZXh0KSxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBjb250ZXh0LnRleHQsXG4gICAgICAgICAgXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCJcXG5cIiksXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICBcIllvdSBleHRyYWN0IHVucmVzb2x2ZWQgcXVlc3Rpb25zIGZyb20gZXhwbGljaXQgbWFya2Rvd24gdmF1bHQgY29udGV4dC4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgIFwiRXh0cmFjdCBvcGVuIHF1ZXN0aW9ucyBmcm9tIHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIyBPcGVuIFF1ZXN0aW9uc1wiLFxuICAgICAgICAgICAgXCIjIyBDb250ZXh0XCIsXG4gICAgICAgICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIkJlIGNvbmNpc2UsIGRvIG5vdCBpbnZlbnQgZmFjdHMsIGFuZCBrZWVwIHVuY2VydGFpbnR5IGV4cGxpY2l0LlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgIFwiWW91IGRyYWZ0IGEgcHJvamVjdCBicmllZiBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQuIFJlc3BvbmQgd2l0aCB0aGUgcmVxdWVzdGVkIHNlY3Rpb25zIG9ubHkuXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBcIkRyYWZ0IHRoZSBmb2xsb3dpbmcgY29udGV4dCBpbnRvIGV4YWN0bHkgdGhlc2Ugc2VjdGlvbnM6XCIsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgXCIjIFByb2plY3QgQnJpZWZcIixcbiAgICAgICAgICAgIFwiIyMgT3ZlcnZpZXdcIixcbiAgICAgICAgICAgIFwiIyMgR29hbHNcIixcbiAgICAgICAgICAgIFwiIyMgU2NvcGVcIixcbiAgICAgICAgICAgIFwiIyMgTmV4dCBTdGVwc1wiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIFwiQmUgY29uY2lzZSwgZG8gbm90IGludmVudCBmYWN0cywgYW5kIHByZXNlcnZlIHByb2plY3Qgc3RydWN0dXJlLlwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIGNvbnRleHQudGV4dCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIlxcblwiKSxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSB0dXJuIGV4cGxpY2l0IG1hcmtkb3duIHZhdWx0IGNvbnRleHQgaW50byBjb25jaXNlIG1hcmtkb3duIHN5bnRoZXNpcy4gUmVzcG9uZCB3aXRoIHRoZSByZXF1ZXN0ZWQgc2VjdGlvbnMgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJTdW1tYXJpemUgdGhlIGZvbGxvd2luZyBjb250ZXh0IGludG8gZXhhY3RseSB0aGVzZSBzZWN0aW9uczpcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgU3VtbWFyeVwiLFxuICAgICAgICAgIFwiIyMgS2V5IFRoZW1lc1wiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSBpdGVtcy5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIC4uLmZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQpLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgY29udGV4dC50ZXh0LFxuICAgICAgICBdXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemUodGVtcGxhdGU6IFN5bnRoZXNpc1RlbXBsYXRlLCByZXNwb25zZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC10YXNrc1wiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplVGFza0V4dHJhY3Rpb25PdXRwdXQocmVzcG9uc2UpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUgPT09IFwiZXh0cmFjdC1kZWNpc2lvbnNcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURlY2lzaW9uRXh0cmFjdGlvbk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSA9PT0gXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVPcGVuUXVlc3Rpb25zT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcInJld3JpdGUtY2xlYW4tbm90ZVwiKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplQ2xlYW5Ob3RlT3V0cHV0KHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlID09PSBcImRyYWZ0LXByb2plY3QtYnJpZWZcIikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3RCcmllZk91dHB1dChyZXNwb25zZSk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVTeW50aGVzaXNPdXRwdXQocmVzcG9uc2UpO1xuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3VtbWFyeVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgcGFyc2VkLmhpZ2hsaWdodHMgfHwgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyByZWNlbnQgbm90ZXMuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3VtbWFyeVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgaGlnaGxpZ2h0czogc3RyaW5nO1xuICB0YXNrczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJIaWdobGlnaHRzXCIgfCBcIlRhc2tzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIEhpZ2hsaWdodHM6IFtdLFxuICAgIFRhc2tzOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoSGlnaGxpZ2h0c3xUYXNrc3xGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGlnaGxpZ2h0czogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5IaWdobGlnaHRzXSksXG4gICAgdGFza3M6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5UYXNrcyksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBIaWdobGlnaHRzOiBzdHJpbmdbXTtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwidGFza3NcIikge1xuICAgIHJldHVybiBcIlRhc2tzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIkhpZ2hsaWdodHNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi4vc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb250ZXh0TG9jYXRpb24oY29udGV4dDogU3ludGhlc2lzQ29udGV4dCk6IHN0cmluZyB7XG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzICYmIGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGNvdW50ID0gY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGg7XG4gICAgcmV0dXJuIGAke2NvbnRleHQuc291cmNlTGFiZWx9IFx1MjAyMiAke2NvdW50fSAke2NvdW50ID09PSAxID8gXCJmaWxlXCIgOiBcImZpbGVzXCJ9YDtcbiAgfVxuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICByZXR1cm4gYCR7Y29udGV4dC5zb3VyY2VMYWJlbH0gXHUyMDIyICR7Y29udGV4dC5zb3VyY2VQYXRofWA7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5zb3VyY2VMYWJlbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdENvbnRleHRNZXRhZGF0YUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGxpbmVzID0gW2BDb250ZXh0IHNvdXJjZTogJHtjb250ZXh0LnNvdXJjZUxhYmVsfWBdO1xuXG4gIGlmIChjb250ZXh0LnNvdXJjZVBhdGgpIHtcbiAgICBsaW5lcy5wdXNoKGBDb250ZXh0IHBhdGg6ICR7Y29udGV4dC5zb3VyY2VQYXRofWApO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChcIkNvbnRleHQgZmlsZXM6XCIpO1xuICAgIGNvbnN0IHZpc2libGUgPSBjb250ZXh0LnNvdXJjZVBhdGhzLnNsaWNlKDAsIDEyKTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgdmlzaWJsZSkge1xuICAgICAgbGluZXMucHVzaChgLSAke3BhdGh9YCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMubGVuZ3RoID4gdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gLi4uYW5kICR7Y29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggLSB2aXNpYmxlLmxlbmd0aH0gbW9yZWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb250ZXh0LnRydW5jYXRlZCkge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBgQ29udGV4dCB3YXMgdHJ1bmNhdGVkIHRvICR7Y29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7Y29udGV4dC5vcmlnaW5hbExlbmd0aH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q29udGV4dFNvdXJjZUxpbmVzKGNvbnRleHQ6IFN5bnRoZXNpc0NvbnRleHQpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGxpbmVzID0gW2BTb3VyY2U6ICR7Y29udGV4dC5zb3VyY2VMYWJlbH1gXTtcblxuICBpZiAoY29udGV4dC5zb3VyY2VQYXRoKSB7XG4gICAgbGluZXMucHVzaChgU291cmNlIHBhdGg6ICR7Y29udGV4dC5zb3VyY2VQYXRofWApO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuc291cmNlUGF0aHMgJiYgY29udGV4dC5zb3VyY2VQYXRocy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChcIlNvdXJjZSBmaWxlczpcIik7XG4gICAgY29uc3QgdmlzaWJsZSA9IGNvbnRleHQuc291cmNlUGF0aHMuc2xpY2UoMCwgMTIpO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiB2aXNpYmxlKSB7XG4gICAgICBsaW5lcy5wdXNoKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCA+IHZpc2libGUubGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wdXNoKGAuLi5hbmQgJHtjb250ZXh0LnNvdXJjZVBhdGhzLmxlbmd0aCAtIHZpc2libGUubGVuZ3RofSBtb3JlYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnRleHQudHJ1bmNhdGVkKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGBDb250ZXh0IHRydW5jYXRlZCB0byAke2NvbnRleHQubWF4Q2hhcnN9IGNoYXJhY3RlcnMgZnJvbSAke2NvbnRleHQub3JpZ2luYWxMZW5ndGh9LmAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcztcbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIFRBYnN0cmFjdEZpbGUsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBub3JtYWxpemVQYXRoLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgY2xhc3MgVmF1bHRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcCkge31cblxuICBhc3luYyBlbnN1cmVLbm93bkZvbGRlcnMoc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5qb3VybmFsRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5ub3Rlc0ZvbGRlcik7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5yZXZpZXdzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5ib3hGaWxlKSk7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKHNldHRpbmdzLnRhc2tzRmlsZSkpO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlRm9sZGVyKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZvbGRlclBhdGgpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fS8ke3NlZ21lbnR9YCA6IHNlZ21lbnQ7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50KTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmICghKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZm9sZGVyOiAke2N1cnJlbnR9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBpbml0aWFsQ29udGVudCA9IFwiXCIpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZmlsZTogJHtub3JtYWxpemVkfWApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihub3JtYWxpemVkKSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBpbml0aWFsQ29udGVudCk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dFdpdGhNdGltZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgZXhpc3RzOiBib29sZWFuO1xuICB9PiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgbXRpbWU6IDAsXG4gICAgICAgIGV4aXN0czogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpLFxuICAgICAgbXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcbiAgICAgIGV4aXN0czogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBjdXJyZW50Lmxlbmd0aCA9PT0gMFxuICAgICAgPyBcIlwiXG4gICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cXG5cIilcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblwiKVxuICAgICAgICAgID8gXCJcXG5cIlxuICAgICAgICAgIDogXCJcXG5cXG5cIjtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCR7Y3VycmVudH0ke3NlcGFyYXRvcn0ke25vcm1hbGl6ZWRDb250ZW50fWApO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5vcm1hbGl6ZWRDb250ZW50KTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZVVuaXF1ZUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZG90SW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90SW5kZXggPT09IC0xID8gbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90SW5kZXgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdEluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKGRvdEluZGV4KTtcblxuICAgIGxldCBjb3VudGVyID0gMjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtjb3VudGVyfSR7ZXh0ZW5zaW9ufWA7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYXBwZW5kSm91cm5hbEhlYWRlcihmaWxlUGF0aDogc3RyaW5nLCBkYXRlS2V5OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgIyAke2RhdGVLZXl9XFxuXFxuYCk7XG4gICAgfVxuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgbGlzdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJlbnRGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKDAsIGluZGV4KTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHRyaW1UcmFpbGluZ05ld2xpbmVzIH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcblxuaW50ZXJmYWNlIFByb21wdE1vZGFsT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHBsYWNlaG9sZGVyPzogc3RyaW5nO1xuICBzdWJtaXRMYWJlbD86IHN0cmluZztcbiAgbXVsdGlsaW5lPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFByb21wdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0dGxlZCA9IGZhbHNlO1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBQcm9tcHRNb2RhbE9wdGlvbnMpIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblByb21wdCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMub3B0aW9ucy50aXRsZSB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICBjb25zdCB0ZXh0YXJlYSA9IGNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyID8/IFwiXCIsXG4gICAgICAgICAgcm93czogXCI4XCIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmlucHV0RWwgPSB0ZXh0YXJlYTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5wdXQgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciA/PyBcIlwiLFxuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnB1dEVsID0gaW5wdXQ7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLmZvY3VzKCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KHRoaXMub3B0aW9ucy5zdWJtaXRMYWJlbCA/PyBcIlN1Ym1pdFwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkNhbmNlbFwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN1Ym1pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2YWx1ZSA9IHRyaW1UcmFpbGluZ05ld2xpbmVzKHRoaXMuaW5wdXRFbC52YWx1ZSkudHJpbSgpO1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmZpbmlzaCh2YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaCh2YWx1ZTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXR0bGVkID0gdHJ1ZTtcbiAgICB0aGlzLnJlc29sdmUodmFsdWUpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVzdWx0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGl0bGVUZXh0OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSByZWFkb25seSBib2R5VGV4dDogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy50aXRsZVRleHQgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IHRoaXMuYm9keVRleHQsXG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmludGVyZmFjZSBGaWxlR3JvdXBQaWNrZXJNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRmlsZVJvdyB7XG4gIGZpbGU6IFRGaWxlO1xuICBjaGVja2JveDogSFRNTElucHV0RWxlbWVudDtcbiAgcm93OiBIVE1MRWxlbWVudDtcbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVHcm91cFBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFRGaWxlW10gfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzZWFyY2hJbnB1dCE6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHByaXZhdGUgcm93czogRmlsZVJvd1tdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBmaWxlczogVEZpbGVbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IEZpbGVHcm91cFBpY2tlck1vZGFsT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5QaWNrZXIoKTogUHJvbWlzZTxURmlsZVtdIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogdGhpcy5vcHRpb25zLnRpdGxlIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2Ugb25lIG9yIG1vcmUgbm90ZXMgdG8gdXNlIGFzIGNvbnRleHQuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLnNlYXJjaElucHV0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkZpbHRlciBub3Rlcy4uLlwiLFxuICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5zZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5maWx0ZXJSb3dzKHRoaXMuc2VhcmNoSW5wdXQudmFsdWUpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGlzdCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tZmlsZS1ncm91cC1saXN0XCIsXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgdGhpcy5maWxlcykge1xuICAgICAgY29uc3Qgcm93ID0gbGlzdC5jcmVhdGVFbChcImxhYmVsXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWZpbGUtZ3JvdXAtcm93XCIsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICB0eXBlOiBcImNoZWNrYm94XCIsXG4gICAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgcm93LmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIHRleHQ6IGZpbGUucGF0aCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5yb3dzLnB1c2goeyBmaWxlLCBjaGVja2JveCwgcm93IH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJVc2UgU2VsZWN0ZWRcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnJvd3NcbiAgICAgICAgLmZpbHRlcigocm93KSA9PiByb3cuY2hlY2tib3guY2hlY2tlZClcbiAgICAgICAgLm1hcCgocm93KSA9PiByb3cuZmlsZSk7XG4gICAgICBpZiAoIXNlbGVjdGVkLmxlbmd0aCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBub3RlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmZpbmlzaChzZWxlY3RlZCk7XG4gICAgfSk7XG5cbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2FuY2VsXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbHRlclJvd3ModmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHF1ZXJ5ID0gdmFsdWUudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSB7XG4gICAgICBjb25zdCBtYXRjaCA9ICFxdWVyeSB8fCByb3cuZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpO1xuICAgICAgcm93LnJvdy5zdHlsZS5kaXNwbGF5ID0gbWF0Y2ggPyBcIlwiIDogXCJub25lXCI7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2goZmlsZXM6IFRGaWxlW10gfCBudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldHRsZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzb2x2ZShmaWxlcyk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld1NlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LXNlcnZpY2VcIjtcblxudHlwZSBSZXZpZXdBY3Rpb24gPSBcImtlZXBcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBcIm5vdGVcIiB8IFwic2tpcFwiO1xuXG5leHBvcnQgY2xhc3MgSW5ib3hSZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBjdXJyZW50SW5kZXggPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IGhhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0LnRhZ05hbWUgPT09IFwiSU5QVVRcIiB8fCB0YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGtleVRvQWN0aW9uKGV2ZW50LmtleSk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IEluYm94RW50cnlbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJldmlld1NlcnZpY2U6IFJldmlld1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvbkFjdGlvbkNvbXBsZXRlPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJQcm9jZXNzIEluYm94XCIgfSk7XG5cbiAgICBpZiAoIXRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgdGV4dDogYEVudHJ5ICR7dGhpcy5jdXJyZW50SW5kZXggKyAxfSBvZiAke3RoaXMuZW50cmllcy5sZW5ndGh9YCxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IGVudHJ5LmhlYWRpbmcgfHwgXCJVbnRpdGxlZCBlbnRyeVwiLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBcIihlbXB0eSBlbnRyeSlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgYW4gYWN0aW9uIGZvciB0aGlzIGVudHJ5LiBTaG9ydGN1dHM6IGsga2VlcCwgdCB0YXNrLCBqIGpvdXJuYWwsIG4gbm90ZSwgcyBza2lwLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9uUm93ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJLZWVwIGluIGluYm94XCIsIFwia2VlcFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQ29udmVydCB0byB0YXNrXCIsIFwidGFza1wiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQXBwZW5kIHRvIGpvdXJuYWxcIiwgXCJqb3VybmFsXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJQcm9tb3RlIHRvIG5vdGVcIiwgXCJub3RlXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJTa2lwXCIsIFwic2tpcFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQnV0dG9uKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogUmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogYWN0aW9uID09PSBcIm5vdGVcIiA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogbGFiZWwsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlQWN0aW9uKGFjdGlvbjogUmV2aWV3QWN0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9UYXNrKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImpvdXJuYWxcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmFwcGVuZFRvSm91cm5hbChlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9Ob3RlKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImtlZXBcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmtlZXBFbnRyeShlbnRyeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnNraXBFbnRyeShlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLm9uQWN0aW9uQ29tcGxldGUpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9uQWN0aW9uQ29tcGxldGUobWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY3VycmVudEluZGV4ICs9IDE7XG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA+PSB0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJJbmJveCByZXZpZXcgY29tcGxldGVcIik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcHJvY2VzcyBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24ga2V5VG9BY3Rpb24oa2V5OiBzdHJpbmcpOiBSZXZpZXdBY3Rpb24gfCBudWxsIHtcbiAgc3dpdGNoIChrZXkudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgXCJrXCI6XG4gICAgICByZXR1cm4gXCJrZWVwXCI7XG4gICAgY2FzZSBcInRcIjpcbiAgICAgIHJldHVybiBcInRhc2tcIjtcbiAgICBjYXNlIFwialwiOlxuICAgICAgcmV0dXJuIFwiam91cm5hbFwiO1xuICAgIGNhc2UgXCJuXCI6XG4gICAgICByZXR1cm4gXCJub3RlXCI7XG4gICAgY2FzZSBcInNcIjpcbiAgICAgIHJldHVybiBcInNraXBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCB0eXBlIFF1ZXN0aW9uU2NvcGUgPSBcIm5vdGVcIiB8IFwiZ3JvdXBcIiB8IFwiZm9sZGVyXCIgfCBcInZhdWx0XCI7XG5cbmludGVyZmFjZSBRdWVzdGlvblNjb3BlTW9kYWxPcHRpb25zIHtcbiAgdGl0bGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFF1ZXN0aW9uU2NvcGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBRdWVzdGlvblNjb3BlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBRdWVzdGlvblNjb3BlTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb3BlblBpY2tlcigpOiBQcm9taXNlPFF1ZXN0aW9uU2NvcGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSB0aGUgc2NvcGUgQnJhaW4gc2hvdWxkIHVzZSBmb3IgdGhpcyByZXF1ZXN0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkN1cnJlbnQgTm90ZVwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcIm5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlNlbGVjdGVkIE5vdGVzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZ3JvdXBcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIkN1cnJlbnQgRm9sZGVyXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZm9sZGVyXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJFbnRpcmUgVmF1bHRcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJ2YXVsdFwiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy5zZXR0bGVkKSB7XG4gICAgICB0aGlzLmZpbmlzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmlzaChzY29wZTogUXVlc3Rpb25TY29wZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHNjb3BlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgUmV2aWV3SGlzdG9yeU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgSGlzdG9yeVwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyByZXZpZXcgbG9ncyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiT3BlbiBhIGxvZyB0byBpbnNwZWN0IGl0LCBvciByZS1vcGVuIGFuIGluYm94IGl0ZW0gaWYgaXQgd2FzIG1hcmtlZCBpbmNvcnJlY3RseS5cIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5lbnRyaWVzKSB7XG4gICAgICBjb25zdCByb3cgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb25cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGl0ZW1cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgJHtlbnRyeS50aW1lc3RhbXB9IFx1MjAyMiAke2VudHJ5LmFjdGlvbn1gLFxuICAgICAgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgcHJldmlldylcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidXR0b25zID0gcm93LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgIHRleHQ6IFwiT3BlbiBsb2dcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuTG9nKGVudHJ5LnNvdXJjZVBhdGgpO1xuICAgICAgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICB0ZXh0OiBcIlJlLW9wZW5cIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5yZW9wZW5FbnRyeShlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Mb2cocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoYWJzdHJhY3RGaWxlKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnBsdWdpbi5yZW9wZW5SZXZpZXdFbnRyeShlbnRyeSk7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFN5bnRoZXNpc0NvbnRleHQgfSBmcm9tIFwiLi4vc2VydmljZXMvY29udGV4dC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTeW50aGVzaXNSZXN1bHQgfSBmcm9tIFwiLi4vc2VydmljZXMvc3ludGhlc2lzLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdENvbnRleHRMb2NhdGlvbiB9IGZyb20gXCIuLi91dGlscy9jb250ZXh0LWZvcm1hdFwiO1xuXG5pbnRlcmZhY2UgU3ludGhlc2lzUmVzdWx0TW9kYWxPcHRpb25zIHtcbiAgY29udGV4dDogU3ludGhlc2lzQ29udGV4dDtcbiAgcmVzdWx0OiBTeW50aGVzaXNSZXN1bHQ7XG4gIGNhbkluc2VydDogYm9vbGVhbjtcbiAgb25JbnNlcnQ6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgb25TYXZlOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIG9uQWN0aW9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNSZXN1bHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG4gIHByaXZhdGUgYnV0dG9uczogSFRNTEJ1dHRvbkVsZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogU3ludGhlc2lzUmVzdWx0TW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogYEJyYWluICR7dGhpcy5vcHRpb25zLnJlc3VsdC50aXRsZX1gIH0pO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQWN0aW9uOiAke3RoaXMub3B0aW9ucy5yZXN1bHQuYWN0aW9ufWAsXG4gICAgfSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXN1bHQucHJvbXB0VGV4dCkge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IGBQcm9tcHQ6ICR7dGhpcy5vcHRpb25zLnJlc3VsdC5wcm9tcHRUZXh0fWAsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgQ29udGV4dDogJHtmb3JtYXRDb250ZXh0TG9jYXRpb24odGhpcy5vcHRpb25zLmNvbnRleHQpfWAsXG4gICAgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiB0aGlzLm9wdGlvbnMuY29udGV4dC50cnVuY2F0ZWRcbiAgICAgICAgPyBgQ29udGV4dCB0cnVuY2F0ZWQgdG8gJHt0aGlzLm9wdGlvbnMuY29udGV4dC5tYXhDaGFyc30gY2hhcmFjdGVycyBmcm9tICR7dGhpcy5vcHRpb25zLmNvbnRleHQub3JpZ2luYWxMZW5ndGh9LmBcbiAgICAgICAgOiBgQ29udGV4dCBsZW5ndGg6ICR7dGhpcy5vcHRpb25zLmNvbnRleHQub3JpZ2luYWxMZW5ndGh9IGNoYXJhY3RlcnMuYCxcbiAgICB9KTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiB0aGlzLm9wdGlvbnMucmVzdWx0LmNvbnRlbnQsXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNhbkluc2VydCkge1xuICAgICAgLy8gQnV0dG9ucyBhcmUgcmVuZGVyZWQgYmVsb3cgYWZ0ZXIgb3B0aW9uYWwgZ3VpZGFuY2UgdGV4dC5cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiT3BlbiBhIG1hcmtkb3duIG5vdGUgdG8gaW5zZXJ0IHRoaXMgYXJ0aWZhY3QgdGhlcmUsIG9yIHNhdmUgaXQgdG8gQnJhaW4gbm90ZXMuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICB0aGlzLmJ1dHRvbnMgPSBbXTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FuSW5zZXJ0KSB7XG4gICAgICB0aGlzLmJ1dHRvbnMucHVzaCh0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIkluc2VydCBpbnRvIGN1cnJlbnQgbm90ZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5ydW5BY3Rpb24oKCkgPT4gdGhpcy5vcHRpb25zLm9uSW5zZXJ0KCkpO1xuICAgICAgfSwgdHJ1ZSkpO1xuICAgIH1cblxuICAgIHRoaXMuYnV0dG9ucy5wdXNoKFxuICAgICAgdGhpcy5jcmVhdGVCdXR0b24oYnV0dG9ucywgXCJTYXZlIHRvIEJyYWluIG5vdGVzXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnJ1bkFjdGlvbigoKSA9PiB0aGlzLm9wdGlvbnMub25TYXZlKCkpO1xuICAgICAgfSksXG4gICAgICB0aGlzLmNyZWF0ZUJ1dHRvbihidXR0b25zLCBcIkNsb3NlXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQnV0dG9uKFxuICAgIHBhcmVudDogSFRNTEVsZW1lbnQsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gICAgY3RhID0gZmFsc2UsXG4gICk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidXR0b24gPSBwYXJlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBjdGEgPyBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiIDogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQsXG4gICAgfSk7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5BY3Rpb24oYWN0aW9uOiAoKSA9PiBQcm9taXNlPHN0cmluZz4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy53b3JraW5nID0gdHJ1ZTtcbiAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZCh0cnVlKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgYWN0aW9uKCk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25BY3Rpb25Db21wbGV0ZShtZXNzYWdlKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiQ291bGQgbm90IHVwZGF0ZSB0aGUgc3ludGhlc2lzIHJlc3VsdFwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnNldEJ1dHRvbnNEaXNhYmxlZChmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25zRGlzYWJsZWQoZGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiB0aGlzLmJ1dHRvbnMpIHtcbiAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwgfSBmcm9tIFwiLi4vdXRpbHMvc3ludGhlc2lzLXRlbXBsYXRlXCI7XG5cbmV4cG9ydCB0eXBlIFN5bnRoZXNpc1RlbXBsYXRlID1cbiAgfCBcInN1bW1hcml6ZVwiXG4gIHwgXCJleHRyYWN0LXRhc2tzXCJcbiAgfCBcImV4dHJhY3QtZGVjaXNpb25zXCJcbiAgfCBcImV4dHJhY3Qtb3Blbi1xdWVzdGlvbnNcIlxuICB8IFwicmV3cml0ZS1jbGVhbi1ub3RlXCJcbiAgfCBcImRyYWZ0LXByb2plY3QtYnJpZWZcIjtcblxuaW50ZXJmYWNlIFRlbXBsYXRlUGlja2VyT3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmUhOiAodmFsdWU6IFN5bnRoZXNpc1RlbXBsYXRlIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzZXR0bGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBUZW1wbGF0ZVBpY2tlck9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvcGVuUGlja2VyKCk6IFByb21pc2U8U3ludGhlc2lzVGVtcGxhdGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNob29zZSBob3cgQnJhaW4gc2hvdWxkIHN5bnRoZXNpemUgdGhpcyBjb250ZXh0LlwiLFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwic3VtbWFyaXplXCIpKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcInN1bW1hcml6ZVwiKTtcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KGdldFN5bnRoZXNpc1RlbXBsYXRlQnV0dG9uTGFiZWwoXCJleHRyYWN0LXRhc2tzXCIpKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpbmlzaChcImV4dHJhY3QtdGFza3NcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1kZWNpc2lvbnNcIikpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmluaXNoKFwiZXh0cmFjdC1kZWNpc2lvbnNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZXh0cmFjdC1vcGVuLXF1ZXN0aW9uc1wiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJleHRyYWN0LW9wZW4tcXVlc3Rpb25zXCIpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoZ2V0U3ludGhlc2lzVGVtcGxhdGVCdXR0b25MYWJlbChcInJld3JpdGUtY2xlYW4tbm90ZVwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJyZXdyaXRlLWNsZWFuLW5vdGVcIik7XG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChnZXRTeW50aGVzaXNUZW1wbGF0ZUJ1dHRvbkxhYmVsKFwiZHJhZnQtcHJvamVjdC1icmllZlwiKSkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2goXCJkcmFmdC1wcm9qZWN0LWJyaWVmXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnNldHRsZWQpIHtcbiAgICAgIHRoaXMuZmluaXNoKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluaXNoKHRlbXBsYXRlOiBTeW50aGVzaXNUZW1wbGF0ZSB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHRlbXBsYXRlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBJdGVtVmlldywgTm90aWNlLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcblxuZXhwb3J0IGNvbnN0IEJSQUlOX1ZJRVdfVFlQRSA9IFwiYnJhaW4tc2lkZWJhci12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpblNpZGViYXJWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBwcml2YXRlIHJlc3VsdEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3VtbWFyeUVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgaW5ib3hDb3VudEVsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgdGFza0NvdW50RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSByZXZpZXdIaXN0b3J5RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBhaVN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3VtbWFyeVN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBCUkFJTl9WSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIkJyYWluXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW5cIjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tc2lkZWJhclwiKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDYXB0dXJlIGlkZWFzLCBzeW50aGVzaXplIGV4cGxpY2l0IGNvbnRleHQsIGFuZCBzYXZlIGR1cmFibGUgbWFya2Rvd24gYXJ0aWZhY3RzLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5jcmVhdGVDYXB0dXJlU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlVG9waWNQYWdlU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlU3ludGhlc2lzU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlQXNrU2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlUmV2aWV3U2VjdGlvbigpO1xuICAgIHRoaXMuY3JlYXRlQ2FwdHVyZUFzc2lzdFNlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVN0YXR1c1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZU91dHB1dFNlY3Rpb24oKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgc2V0TGFzdFJlc3VsdCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnJlc3VsdEVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBzZXRMYXN0U3VtbWFyeSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnN1bW1hcnlFbC5zZXRUZXh0KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBbaW5ib3hDb3VudCwgdGFza0NvdW50LCByZXZpZXdDb3VudF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLnBsdWdpbi5nZXRJbmJveENvdW50KCksXG4gICAgICB0aGlzLnBsdWdpbi5nZXRPcGVuVGFza0NvdW50KCksXG4gICAgICB0aGlzLnBsdWdpbi5nZXRSZXZpZXdIaXN0b3J5Q291bnQoKSxcbiAgICBdKTtcbiAgICBpZiAodGhpcy5pbmJveENvdW50RWwpIHtcbiAgICAgIHRoaXMuaW5ib3hDb3VudEVsLnNldFRleHQoYCR7aW5ib3hDb3VudH0gdW5yZXZpZXdlZCBlbnRyaWVzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnRhc2tDb3VudEVsKSB7XG4gICAgICB0aGlzLnRhc2tDb3VudEVsLnNldFRleHQoYCR7dGFza0NvdW50fSBvcGVuIHRhc2tzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnJldmlld0hpc3RvcnlFbCkge1xuICAgICAgdGhpcy5yZXZpZXdIaXN0b3J5RWwuc2V0VGV4dChgUmV2aWV3IGhpc3Rvcnk6ICR7cmV2aWV3Q291bnR9IGVudHJpZXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYWlTdGF0dXNFbCkge1xuICAgICAgdGhpcy5haVN0YXR1c0VsLnNldFRleHQodGhpcy5wbHVnaW4uZ2V0QWlTdGF0dXNUZXh0KCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdW1tYXJ5U3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuc3VtbWFyeVN0YXR1c0VsLnNldFRleHQodGhpcy5wbHVnaW4uZ2V0TGFzdFN1bW1hcnlMYWJlbCgpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlF1aWNrIENhcHR1cmVcIiB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkNhcHR1cmUgcm91Z2ggaW5wdXQgaW50byB0aGUgdmF1bHQgYmVmb3JlIHJldmlldyBhbmQgc3ludGhlc2lzLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5pbnB1dEVsID0gc2VjdGlvbi5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jYXB0dXJlLWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIlR5cGUgYSBub3RlLCB0YXNrLCBvciBqb3VybmFsIGVudHJ5Li4uXCIsXG4gICAgICAgIHJvd3M6IFwiOFwiLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2FwdHVyZSBOb3RlXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlQXNOb3RlKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNhcHR1cmUgVGFza1wiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuc2F2ZUFzVGFzaygpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYXB0dXJlIEpvdXJuYWwgRW50cnlcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVBc0pvdXJuYWwoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2xlYXJcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICAgIG5ldyBOb3RpY2UoXCJDYXB0dXJlIGNsZWFyZWRcIik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVN5bnRoZXNpc1NlY3Rpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3ludGhlc2l6ZVwiIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiVHVybiBleHBsaWNpdCBjb250ZXh0IGludG8gc3VtbWFyaWVzLCBjbGVhbiBub3RlcywgdGFza3MsIGFuZCBicmllZnMuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBidXR0b25zID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlN1bW1hcml6ZSBDdXJyZW50IE5vdGVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnROb3RlKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIlN5bnRoZXNpemUgQ3VycmVudCBOb3RlLi4uXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJFeHRyYWN0IFRhc2tzIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrQWJvdXRTZWxlY3Rpb24oKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiRHJhZnQgQnJpZWYgRnJvbSBGb2xkZXJcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hc2tBYm91dEN1cnJlbnRGb2xkZXIoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2xlYW4gTm90ZSBGcm9tIFJlY2VudCBGaWxlc1wiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmFza0Fib3V0UmVjZW50RmlsZXMoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiU3ludGhlc2l6ZSBOb3Rlcy4uLlwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnN5bnRoZXNpemVOb3RlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVBc2tTZWN0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFzayBCcmFpblwiIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQXNrIGEgcXVlc3Rpb24gYWJvdXQgdGhlIGN1cnJlbnQgbm90ZSwgYSBzZWxlY3RlZCBncm91cCwgYSBmb2xkZXIsIG9yIHRoZSB3aG9sZSB2YXVsdC5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiQXNrIFF1ZXN0aW9uLi4uXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXNrUXVlc3Rpb24oKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmV2aWV3U2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJSZXZpZXdcIiB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIlByb2Nlc3MgY2FwdHVyZWQgaW5wdXQgYW5kIGtlZXAgdGhlIGRhaWx5IGxvb3AgbW92aW5nLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJSZXZpZXcgSW5ib3hcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiT3BlbiBUb2RheSdzIEpvdXJuYWxcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuVG9kYXlzSm91cm5hbCgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDcmVhdGUgVG9kYXkgU3VtbWFyeVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdygxLCBcIlRvZGF5XCIpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDcmVhdGUgV2Vla2x5IFN1bW1hcnlcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coNywgXCJXZWVrXCIpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVUb3BpY1BhZ2VTZWN0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlRvcGljIFBhZ2VzXCIgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJCcmFpblx1MjAxOXMgZmxhZ3NoaXAgZmxvdzogdHVybiBleHBsaWNpdCBjb250ZXh0IGludG8gYSBkdXJhYmxlIG1hcmtkb3duIHBhZ2UgeW91IGNhbiBrZWVwIGJ1aWxkaW5nLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJDcmVhdGUgVG9waWMgUGFnZVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmNyZWF0ZVRvcGljUGFnZSgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJUb3BpYyBQYWdlIEZyb20gQ3VycmVudCBOb3RlXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDYXB0dXJlQXNzaXN0U2VjdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkNhcHR1cmUgQXNzaXN0XCIgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJVc2UgQUkgb25seSB0byBjbGFzc2lmeSBmcmVzaCBjYXB0dXJlIGludG8gbm90ZSwgdGFzaywgb3Igam91cm5hbC5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQXV0by1yb3V0ZSBDYXB0dXJlXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5hdXRvUm91dGUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdHVzU2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdGF0dXNcIiB9KTtcblxuICAgIGNvbnN0IGluYm94Um93ID0gc2VjdGlvbi5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkluYm94OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgdGhpcy5pbmJveENvdW50RWwgPSBpbmJveFJvdztcblxuICAgIGNvbnN0IHRhc2tSb3cgPSBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiVGFza3M6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICB0aGlzLnRhc2tDb3VudEVsID0gdGFza1JvdztcblxuICAgIGNvbnN0IHJldmlld1JvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc3RhdHVzLXJvd1wiIH0pO1xuICAgIHRoaXMucmV2aWV3SGlzdG9yeUVsID0gcmV2aWV3Um93LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiUmV2aWV3IGhpc3Rvcnk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICByZXZpZXdSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgIHRleHQ6IFwiT3BlblwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBhaVJvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJBSTogbG9hZGluZy4uLlwiIH0pO1xuICAgIHRoaXMuYWlTdGF0dXNFbCA9IGFpUm93O1xuXG4gICAgY29uc3Qgc3VtbWFyeVJvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJMYXN0IGFydGlmYWN0OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgdGhpcy5zdW1tYXJ5U3RhdHVzRWwgPSBzdW1tYXJ5Um93O1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRTZWN0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInNlY3Rpb25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFydGlmYWN0c1wiIH0pO1xuXG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IFJlc3VsdFwiIH0pO1xuICAgIHRoaXMucmVzdWx0RWwgPSBzZWN0aW9uLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1vdXRwdXRcIixcbiAgICAgIHRleHQ6IFwiTm8gcmVzdWx0IHlldC5cIixcbiAgICB9KTtcblxuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoNFwiLCB7IHRleHQ6IFwiTGFzdCBBcnRpZmFjdFwiIH0pO1xuICAgIHRoaXMuc3VtbWFyeUVsID0gc2VjdGlvbi5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tb3V0cHV0XCIsXG4gICAgICB0ZXh0OiBcIk5vIGFydGlmYWN0IGdlbmVyYXRlZCB5ZXQuXCIsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc05vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IGNhcHR1cmUgbm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc1Rhc2soKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlVGFzayh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGF1dG9Sb3V0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJFbnRlciBzb21lIHRleHQgZmlyc3QuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJvdXRlVGV4dCh0ZXh0KTtcbiAgICAgIGlmICghcm91dGUpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIkJyYWluIGNvdWxkIG5vdCBjbGFzc2lmeSB0aGF0IGVudHJ5XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocm91dGUgPT09IFwibm90ZVwiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZU5vdGUodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3QgY2FwdHVyZSBub3RlXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKHJvdXRlID09PSBcInRhc2tcIikge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVUYXNrKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIGpvdXJuYWwgZW50cnlcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiQ291bGQgbm90IGF1dG8tcm91dGUgY2FwdHVyZVwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVDYXB0dXJlKFxuICAgIGFjdGlvbjogKHRleHQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+LFxuICAgIGZhaWx1cmVNZXNzYWdlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFjdGlvbih0ZXh0KTtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlcG9ydEFjdGlvblJlc3VsdChyZXN1bHQpO1xuICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKGZhaWx1cmVNZXNzYWdlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21tYW5kcyhwbHVnaW46IEJyYWluUGx1Z2luKTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjYXB0dXJlLW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBDYXB0dXJlIE5vdGVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIE5vdGVcIiwgXCJDYXB0dXJlXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcGx1Z2luLm5vdGVTZXJ2aWNlLmFwcGVuZE5vdGUodGV4dCk7XG4gICAgICAgIHJldHVybiBgQ2FwdHVyZWQgbm90ZSBpbiAke3NhdmVkLnBhdGh9YDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFza1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFza1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY2FwdHVyZUZyb21Nb2RhbChcIkNhcHR1cmUgVGFza1wiLCBcIkNhcHR1cmVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBwbHVnaW4udGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFkZC1qb3VybmFsLWVudHJ5XCIsXG4gICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jYXB0dXJlRnJvbU1vZGFsKFxuICAgICAgICBcIkNhcHR1cmUgSm91cm5hbFwiLFxuICAgICAgICBcIkNhcHR1cmVcIixcbiAgICAgICAgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHBsdWdpbi5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeSh0ZXh0KTtcbiAgICAgICAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJwcm9jZXNzLWluYm94XCIsXG4gICAgbmFtZTogXCJCcmFpbjogUmV2aWV3IEluYm94XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5wcm9jZXNzSW5ib3goKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwicmV2aWV3LWhpc3RvcnlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFJldmlldyBIaXN0b3J5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuUmV2aWV3SGlzdG9yeSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzdW1tYXJpemUtdG9kYXlcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb2RheSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coMSwgXCJUb2RheVwiKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3VtbWFyaXplLXRoaXMtd2Vla1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IEdlbmVyYXRlIFdlZWtseSBTdW1tYXJ5XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coNywgXCJXZWVrXCIpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhZGQtdGFzay1mcm9tLXNlbGVjdGlvblwiLFxuICAgIG5hbWU6IFwiQnJhaW46IENhcHR1cmUgVGFzayBGcm9tIFNlbGVjdGlvblwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYWRkVGFza0Zyb21TZWxlY3Rpb24oKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi10b2RheXMtam91cm5hbFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVG9kYXkncyBKb3VybmFsXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuVG9kYXlzSm91cm5hbCgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXNpZGViYXJcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIEJyYWluIFNpZGViYXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5bnRoZXNpemUtbm90ZXNcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIE5vdGVzXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5zeW50aGVzaXplTm90ZXMoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3ludGhlc2l6ZS1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBTeW50aGVzaXplIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uYXNrQWJvdXRDdXJyZW50Tm90ZVdpdGhUZW1wbGF0ZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJhc2stcXVlc3Rpb25cIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLmFza1F1ZXN0aW9uKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImFzay1xdWVzdGlvbi1jdXJyZW50LW5vdGVcIixcbiAgICBuYW1lOiBcIkJyYWluOiBBc2sgUXVlc3Rpb24gQWJvdXQgQ3VycmVudCBOb3RlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hc2tRdWVzdGlvbkFib3V0Q3VycmVudE5vdGUoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2VcIixcbiAgICBuYW1lOiBcIkJyYWluOiBHZW5lcmF0ZSBUb3BpYyBQYWdlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5jcmVhdGVUb3BpY1BhZ2UoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY3JlYXRlLXRvcGljLXBhZ2UtY3VycmVudC1ub3RlXCIsXG4gICAgbmFtZTogXCJCcmFpbjogR2VuZXJhdGUgVG9waWMgUGFnZSBGcm9tIEN1cnJlbnQgTm90ZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4uY3JlYXRlVG9waWNQYWdlRm9yU2NvcGUoXCJub3RlXCIpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsb0JBQW9EOzs7QUNvQjdDLElBQU0seUJBQThDO0FBQUEsRUFDekQsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsYUFBYTtBQUFBLEVBQ2IsaUJBQWlCO0FBQUEsRUFDakIsZUFBZTtBQUFBLEVBQ2YsbUJBQW1CO0FBQUEsRUFDbkIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IscUJBQXFCO0FBQUEsRUFDckIsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQ3BCO0FBRU8sU0FBUyx1QkFDZCxPQUNxQjtBQUNyQixRQUFNLFNBQThCO0FBQUEsSUFDbEMsR0FBRztBQUFBLElBQ0gsR0FBRztBQUFBLEVBQ0w7QUFFQSxTQUFPO0FBQUEsSUFDTCxXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixlQUFlO0FB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QS8wQjNDO0FBZzFCSSxVQUFNLGFBQWEsS0FBSyxJQUFJLFVBQVUsb0JBQW9CLDhCQUFZO0FBQ3RFLFVBQU0sYUFBWSwwREFBWSxXQUFaLG1CQUFvQixtQkFBcEIsbUJBQW9DLFdBQXBDLFlBQThDO0FBQ2hFLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAic2x1Z2lmeSIsICJ0cmltVGl0bGUiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJnZXRXaW5kb3dTdGFydCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiZm9ybWF0TGlzdFNlY3Rpb24iLCAic2FmZUNvbGxhcHNlV2hpdGVzcGFjZSIsICJjYW5vbmljYWxTZWN0aW9uTmFtZSIsICJ0cmltU2VjdGlvbiIsICJmb3JtYXRMaXN0U2VjdGlvbiIsICJzYWZlQ29sbGFwc2VXaGl0ZXNwYWNlIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImZvcm1hdExpc3RTZWN0aW9uIiwgInNhZmVDb2xsYXBzZVdoaXRlc3BhY2UiLCAiY2Fub25pY2FsU2VjdGlvbk5hbWUiLCAidHJpbVNlY3Rpb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNhbm9uaWNhbFNlY3Rpb25OYW1lIiwgInRyaW1TZWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
