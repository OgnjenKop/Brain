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
var import_obsidian9 = require("obsidian");

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
      (text) => text.setValue(this.plugin.settings.inboxFile).onChange(async (value) => {
        this.plugin.settings.inboxFile = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Tasks file").setDesc("Markdown file used for quick task capture.").addText(
      (text) => text.setValue(this.plugin.settings.tasksFile).onChange(async (value) => {
        this.plugin.settings.tasksFile = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Journal folder").setDesc("Folder containing daily journal files.").addText(
      (text) => text.setValue(this.plugin.settings.journalFolder).onChange(async (value) => {
        this.plugin.settings.journalFolder = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Notes folder").setDesc("Folder used for promoted notes.").addText(
      (text) => text.setValue(this.plugin.settings.notesFolder).onChange(async (value) => {
        this.plugin.settings.notesFolder = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Summaries folder").setDesc("Folder used for persisted summaries.").addText(
      (text) => text.setValue(this.plugin.settings.summariesFolder).onChange(async (value) => {
        this.plugin.settings.summariesFolder = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reviews folder").setDesc("Folder used to store inbox review logs.").addText(
      (text) => text.setValue(this.plugin.settings.reviewsFolder).onChange(async (value) => {
        this.plugin.settings.reviewsFolder = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "AI" });
    new import_obsidian.Setting(containerEl).setName("Enable AI summaries").setDesc("Use OpenAI for summaries when configured.").addToggle(
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
      text.setPlaceholder("sk-...").setValue(this.plugin.settings.openAIApiKey).onChange(async (value) => {
        this.plugin.settings.openAIApiKey = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("OpenAI model").setDesc("Model name used for summary and routing requests.").addText(
      (text) => text.setValue(this.plugin.settings.openAIModel).onChange(async (value) => {
        this.plugin.settings.openAIModel = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "Summaries" });
    new import_obsidian.Setting(containerEl).setName("Lookback days").setDesc("How far back to scan when building a summary.").addText(
      (text) => text.setValue(String(this.plugin.settings.summaryLookbackDays)).onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        this.plugin.settings.summaryLookbackDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Maximum characters").setDesc("Maximum text collected before summarizing.").addText(
      (text) => text.setValue(String(this.plugin.settings.summaryMaxChars)).onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        this.plugin.settings.summaryMaxChars = Number.isFinite(parsed) && parsed >= 1e3 ? parsed : 12e3;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Persist summaries").setDesc("Write generated summaries into the vault.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.persistSummaries).onChange(async (value) => {
        this.plugin.settings.persistSummaries = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

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
  }
  async getRecentEntries(limit = 20, includeReviewed = false) {
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const entries = parseInboxEntries(content);
    const filtered = includeReviewed ? entries : entries.filter((entry) => !entry.reviewed);
    return filtered.slice(-limit).reverse();
  }
  async markEntryReviewed(entry, action) {
    var _a, _b, _c;
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const currentEntries = parseInboxEntries(content);
    const currentEntry = (_c = (_b = (_a = currentEntries.find(
      (candidate) => candidate.signature === entry.signature && candidate.signatureIndex === entry.signatureIndex
    )) != null ? _a : currentEntries.find((candidate) => !candidate.reviewed && candidate.raw === entry.raw)) != null ? _b : currentEntries.find(
      (candidate) => !candidate.reviewed && candidate.heading === entry.heading && candidate.body === entry.body && candidate.preview === entry.preview
    )) != null ? _c : currentEntries.find(
      (candidate) => !candidate.reviewed && candidate.heading === entry.heading && candidate.startLine === entry.startLine
    );
    if (!currentEntry) {
      return false;
    }
    const updated = insertReviewMarker(content, currentEntry, action);
    await this.vaultService.replaceText(settings.inboxFile, updated);
    return true;
  }
  async reopenEntry(entry) {
    var _a, _b;
    const settings = this.settingsProvider();
    const content = await this.vaultService.readText(settings.inboxFile);
    const currentEntries = parseInboxEntries(content);
    const currentEntry = (_b = (_a = currentEntries.find(
      (candidate) => candidate.signature === entry.signature && candidate.signatureIndex === entry.signatureIndex
    )) != null ? _a : currentEntries.find((candidate) => candidate.signature === entry.signature)) != null ? _b : currentEntries.find(
      (candidate) => candidate.heading === entry.heading && candidate.body === entry.body && candidate.preview === entry.preview
    );
    if (!currentEntry) {
      return false;
    }
    const updated = removeReviewMarker(content, currentEntry);
    await this.vaultService.replaceText(settings.inboxFile, updated);
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
};

// src/services/review-log-service.ts
var ReviewLogService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
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
    return { path };
  }
  async getReviewLogFiles(limit) {
    const settings = this.settingsProvider();
    const files = await this.vaultService.listMarkdownFiles();
    const matching = files.filter((file) => isUnderFolder(file.path, settings.reviewsFolder)).sort((left, right) => right.stat.mtime - left.stat.mtime);
    return typeof limit === "number" ? matching.slice(0, limit) : matching;
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
    return (await this.getReviewEntries()).length;
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
function isUnderFolder(path, folder) {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
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

// src/services/summary-service.ts
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

// src/utils/summary-format.ts
function cleanSummaryLine(text) {
  return (text != null ? text : "").replace(/\s+/g, " ").trim();
}
function formatListSection(items, emptyMessage) {
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
      const text = cleanSummaryLine(bullet[1]);
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
      if (!settings.openAIApiKey.trim() || !settings.openAIModel.trim()) {
        new import_obsidian2.Notice("AI summaries are enabled but OpenAI is not configured");
      } else {
        try {
          summary = await this.aiService.summarize(content || summary, settings);
          usedAI = true;
        } catch (error) {
          console.error(error);
          new import_obsidian2.Notice("Brain fell back to local summary");
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
    return files.filter((file) => !isUnderFolder2(file.path, settings.summariesFolder)).filter((file) => !isUnderFolder2(file.path, settings.reviewsFolder)).filter((file) => file.stat.mtime >= cutoff).sort((left, right) => right.stat.mtime - left.stat.mtime);
  }
};
function isUnderFolder2(path, folder) {
  const normalizedFolder = folder.replace(/\/+$/, "");
  return path === normalizedFolder || path.startsWith(`${normalizedFolder}/`);
}
function getWindowStart(lookbackDays) {
  const safeDays = Math.max(1, lookbackDays);
  const start = /* @__PURE__ */ new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));
  return start;
}

// src/services/task-service.ts
var TaskService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async appendTask(text) {
    const settings = this.settingsProvider();
    const cleaned = collapseWhitespace(text);
    if (!cleaned) {
      throw new Error("Task text cannot be empty");
    }
    const block = `- [ ] ${cleaned} _(added ${formatDateTimeKey(/* @__PURE__ */ new Date())})_`;
    await this.vaultService.appendText(settings.tasksFile, block);
    return { path: settings.tasksFile };
  }
};

// src/services/ai-service.ts
var import_obsidian3 = require("obsidian");

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
      currentSection = canonicalSectionName(heading[1]);
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
    highlights: trimSection([...preambleLines, ...sectionLines.Highlights]),
    tasks: trimSection(sectionLines.Tasks),
    followUps: trimSection(sectionLines["Follow-ups"])
  };
}
function canonicalSectionName(section) {
  const normalized = section.toLowerCase();
  if (normalized === "tasks") {
    return "Tasks";
  }
  if (normalized === "follow-ups") {
    return "Follow-ups";
  }
  return "Highlights";
}
function trimSection(lines) {
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
  async postChatCompletion(settings, messages) {
    var _a, _b, _c, _d;
    if (!settings.openAIApiKey.trim()) {
      throw new Error("OpenAI API key is missing");
    }
    const result = await (0, import_obsidian3.requestUrl)({
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
};

// src/services/vault-service.ts
var import_obsidian4 = require("obsidian");
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
    const normalized = (0, import_obsidian4.normalizePath)(folderPath).replace(/\/+$/, "");
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
      } else if (!(existing instanceof import_obsidian4.TFolder)) {
        throw new Error(`Path exists but is not a folder: ${current}`);
      }
    }
  }
  async ensureFile(filePath, initialContent = "") {
    const normalized = (0, import_obsidian4.normalizePath)(filePath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian4.TFile) {
      return existing;
    }
    if (existing) {
      throw new Error(`Path exists but is not a file: ${normalized}`);
    }
    await this.ensureFolder(parentFolder(normalized));
    return this.app.vault.create(normalized, initialContent);
  }
  async readText(filePath) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian4.normalizePath)(filePath));
    if (!(file instanceof import_obsidian4.TFile)) {
      return "";
    }
    return this.app.vault.read(file);
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
    const normalized = (0, import_obsidian4.normalizePath)(filePath);
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
  const normalized = (0, import_obsidian4.normalizePath)(filePath);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

// src/views/prompt-modals.ts
var import_obsidian5 = require("obsidian");
var PromptModal = class extends import_obsidian5.Modal {
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
    new import_obsidian5.Setting(contentEl).addButton(
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
      new import_obsidian5.Notice("Enter some text first.");
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
var ResultModal = class extends import_obsidian5.Modal {
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

// src/views/inbox-review-modal.ts
var import_obsidian6 = require("obsidian");
var InboxReviewModal = class extends import_obsidian6.Modal {
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
          new import_obsidian6.Notice(message);
        }
      } catch (error) {
        console.error(error);
      }
      this.currentIndex += 1;
      if (this.currentIndex >= this.entries.length) {
        new import_obsidian6.Notice("Inbox review complete");
        this.close();
        return;
      }
      this.render();
    } catch (error) {
      console.error(error);
      new import_obsidian6.Notice("Could not process inbox entry");
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
var import_obsidian7 = require("obsidian");
var ReviewHistoryModal = class extends import_obsidian7.Modal {
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
    if (!(abstractFile instanceof import_obsidian7.TFile)) {
      new import_obsidian7.Notice("Unable to open review log");
      return;
    }
    const leaf = (_a = this.app.workspace.getLeaf(false)) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian7.Notice("Unable to open review log");
      return;
    }
    await leaf.openFile(abstractFile);
    this.app.workspace.revealLeaf(leaf);
  }
  async reopenEntry(entry) {
    try {
      const message = await this.plugin.reopenReviewEntry(entry);
      new import_obsidian7.Notice(message);
      this.close();
    } catch (error) {
      console.error(error);
      new import_obsidian7.Notice("Could not re-open inbox entry");
    }
  }
};

// src/views/sidebar-view.ts
var import_obsidian8 = require("obsidian");
var BRAIN_VIEW_TYPE = "brain-sidebar-view";
var BrainSidebarView = class extends import_obsidian8.ItemView {
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
      text: "Quick capture, daily journaling, and lightweight summaries."
    });
    this.createCaptureSection();
    this.createReviewSection();
    this.createAiSection();
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
    if (this.inboxCountEl) {
      const inboxCount = await this.plugin.getInboxCount();
      this.inboxCountEl.setText(`${inboxCount} recent entries`);
    }
    if (this.taskCountEl) {
      const taskCount = await this.plugin.getOpenTaskCount();
      this.taskCountEl.setText(`${taskCount} open tasks`);
    }
    if (this.reviewHistoryEl) {
      const reviewCount = await this.plugin.getReviewHistoryCount();
      this.reviewHistoryEl.setText(`Review history: ${reviewCount} logs`);
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
      text: "Save as Note"
    }).addEventListener("click", () => {
      void this.saveAsNote();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Save as Task"
    }).addEventListener("click", () => {
      void this.saveAsTask();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Save as Journal"
    }).addEventListener("click", () => {
      void this.saveAsJournal();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Clear"
    }).addEventListener("click", () => {
      this.inputEl.value = "";
      new import_obsidian8.Notice("Capture cleared");
    });
  }
  createReviewSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Review" });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Process Inbox"
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
      text: "Summarize Today"
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(1, "Today");
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Summarize Week"
    }).addEventListener("click", () => {
      void this.plugin.generateSummaryForWindow(7, "Week");
    });
  }
  createAiSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "AI Actions" });
    const buttons = section.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Summarize"
    }).addEventListener("click", () => {
      void this.generateSummary();
    });
    if (this.plugin.settings.enableAIRouting) {
      buttons.createEl("button", {
        cls: "brain-button",
        text: "Auto-route"
      }).addEventListener("click", () => {
        void this.autoRoute();
      });
    }
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
    const summaryRow = section.createEl("p", { text: "Last summary: loading..." });
    this.summaryStatusEl = summaryRow;
  }
  createOutputSection() {
    const section = this.contentEl.createEl("section", {
      cls: "brain-section"
    });
    section.createEl("h3", { text: "Output" });
    section.createEl("h4", { text: "Last Result" });
    this.resultEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No recent action."
    });
    section.createEl("h4", { text: "Last Summary" });
    this.summaryEl = section.createEl("pre", {
      cls: "brain-output",
      text: "No summary generated yet."
    });
  }
  async saveAsNote() {
    await this.executeCapture(
      (text) => this.plugin.captureNote(text),
      "Could not save note"
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
  async generateSummary() {
    try {
      const result = await this.plugin.summarizeNow();
      this.summaryEl.setText(result.content);
      this.setLastResult(
        result.usedAI ? "AI summary generated" : "Local summary generated"
      );
    } catch (error) {
      console.error(error);
      new import_obsidian8.Notice("Could not generate summary");
    }
  }
  async autoRoute() {
    const text = this.inputEl.value.trim();
    if (!text) {
      new import_obsidian8.Notice("Enter some text first.");
      return;
    }
    try {
      const route = await this.plugin.routeText(text);
      if (!route) {
        new import_obsidian8.Notice("Brain could not classify that entry");
        return;
      }
      if (route === "note") {
        await this.executeCapture(
          () => this.plugin.captureNote(text),
          "Could not save note"
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
      new import_obsidian8.Notice("Could not auto-route capture");
    }
  }
  async executeCapture(action, failureMessage) {
    const text = this.inputEl.value.trim();
    if (!text) {
      new import_obsidian8.Notice("Enter some text first.");
      return;
    }
    try {
      const result = await action(text);
      await this.plugin.reportActionResult(result);
      this.inputEl.value = "";
    } catch (error) {
      console.error(error);
      new import_obsidian8.Notice(failureMessage);
    }
  }
};

// main.ts
var BrainPlugin = class extends import_obsidian9.Plugin {
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
    this.summaryService = new SummaryService(
      this.vaultService,
      this.aiService,
      () => this.settings
    );
    await this.vaultService.ensureKnownFolders(this.settings);
    this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
      const view = new BrainSidebarView(leaf, this);
      this.sidebarView = view;
      return view;
    });
    this.addCommand({
      id: "capture-note",
      name: "Brain: Capture Note",
      callback: async () => {
        await this.captureFromModal("Capture Note", "Save note", async (text) => {
          const saved = await this.noteService.appendNote(text);
          return `Saved note to ${saved.path}`;
        });
      }
    });
    this.addCommand({
      id: "add-task",
      name: "Brain: Add Task",
      callback: async () => {
        await this.captureFromModal("Add Task", "Save task", async (text) => {
          const saved = await this.taskService.appendTask(text);
          return `Saved task to ${saved.path}`;
        });
      }
    });
    this.addCommand({
      id: "add-journal-entry",
      name: "Brain: Add Journal Entry",
      callback: async () => {
        await this.captureFromModal(
          "Add Journal Entry",
          "Save entry",
          async (text) => {
            const saved = await this.journalService.appendEntry(text);
            return `Saved journal entry to ${saved.path}`;
          },
          true
        );
      }
    });
    this.addCommand({
      id: "process-inbox",
      name: "Brain: Process Inbox",
      callback: async () => {
        await this.processInbox();
      }
    });
    this.addCommand({
      id: "review-history",
      name: "Brain: Review History",
      callback: async () => {
        await this.openReviewHistory();
      }
    });
    this.addCommand({
      id: "summarize-recent-notes",
      name: "Brain: Summarize Recent Notes",
      callback: async () => {
        await this.generateSummaryForWindow();
      }
    });
    this.addCommand({
      id: "summarize-today",
      name: "Brain: Summarize Today",
      callback: async () => {
        await this.generateSummaryForWindow(1, "Today");
      }
    });
    this.addCommand({
      id: "summarize-this-week",
      name: "Brain: Summarize This Week",
      callback: async () => {
        await this.generateSummaryForWindow(7, "Week");
      }
    });
    this.addCommand({
      id: "add-task-from-selection",
      name: "Brain: Add Task From Selection",
      callback: async () => {
        await this.addTaskFromSelection();
      }
    });
    this.addCommand({
      id: "open-todays-journal",
      name: "Brain: Open Today's Journal",
      callback: async () => {
        await this.openTodaysJournal();
      }
    });
    this.addCommand({
      id: "open-sidebar",
      name: "Brain: Open Sidebar",
      callback: async () => {
        await this.openSidebar();
      }
    });
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
    await this.refreshSidebarStatus();
  }
  async openSidebar() {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian9.Notice("Unable to open the sidebar");
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
    new import_obsidian9.Notice(message);
    this.updateSidebarResult(message);
    await this.refreshSidebarStatusBestEffort();
  }
  getLastSummaryLabel() {
    return this.lastSummaryAt ? formatDateTimeKey(this.lastSummaryAt) : "No summary yet";
  }
  async routeText(text) {
    if (!this.settings.enableAIRouting) {
      return null;
    }
    if (!this.settings.openAIApiKey.trim() || !this.settings.openAIModel.trim()) {
      new import_obsidian9.Notice("AI routing is enabled but OpenAI is not configured");
      return null;
    }
    const route = await this.aiService.routeText(text, this.settings);
    if (route) {
      this.updateSidebarResult(`Auto-routed as ${route}`);
    }
    return route;
  }
  async summarizeNow() {
    const result = await this.summaryService.generateSummary();
    this.lastSummaryAt = /* @__PURE__ */ new Date();
    this.updateSidebarSummary(`${result.title}

${result.content}`);
    this.updateSidebarResult(
      result.usedAI ? `${result.title} generated with AI` : `${result.title} generated locally`
    );
    await this.refreshSidebarStatusBestEffort();
    return result;
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
    new import_obsidian9.Notice(
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
      console.error(error);
      new import_obsidian9.Notice("Brain could not save that entry");
    }
  }
  async captureNote(text) {
    const saved = await this.noteService.appendNote(text);
    return `Saved note to ${saved.path}`;
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
      new import_obsidian9.Notice("No inbox entries found");
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
    new import_obsidian9.Notice("No selection found. Opening task entry modal.");
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
      new import_obsidian9.Notice("Unable to open today's journal");
      return;
    }
    await leaf.openFile(file);
    this.app.workspace.revealLeaf(leaf);
    const message = `Opened ${file.path}`;
    await this.reportActionResult(message);
  }
  async getInboxCount() {
    const entries = await this.inboxService.getRecentEntries(1e3);
    return entries.length;
  }
  async getOpenTaskCount() {
    const text = await this.vaultService.readText(this.settings.tasksFile);
    return text.split("\n").map((line) => line.trim()).filter((line) => /^- \[( |x|X)\]/.test(line)).filter((line) => !/^- \[(x|X)\]/.test(line)).length;
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
  getActiveSelectionText() {
    var _a, _b, _c;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian9.MarkdownView);
    const selection = (_c = (_b = (_a = activeView == null ? void 0 : activeView.editor) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.trim()) != null ? _c : "";
    return selection;
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvZGF0ZS50cyIsICJzcmMvc2VydmljZXMvaW5ib3gtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3Jldmlldy1sb2ctc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvcmV2aWV3LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3N1bW1hcnktc2VydmljZS50cyIsICJzcmMvdXRpbHMvdGV4dC50cyIsICJzcmMvdXRpbHMvc3VtbWFyeS1mb3JtYXQudHMiLCAic3JjL3NlcnZpY2VzL3Rhc2stc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvdXRpbHMvc3VtbWFyeS1ub3JtYWxpemUudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3ZpZXdzL3Byb21wdC1tb2RhbHMudHMiLCAic3JjL3ZpZXdzL2luYm94LXJldmlldy1tb2RhbC50cyIsICJzcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWwudHMiLCAic3JjL3ZpZXdzL3NpZGViYXItdmlldy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgbm9ybWFsaXplQnJhaW5TZXR0aW5ncyxcbn0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBCcmFpblNldHRpbmdUYWIgfSBmcm9tIFwiLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3MtdGFiXCI7XG5pbXBvcnQgeyBJbmJveFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvaW5ib3gtc2VydmljZVwiO1xuaW1wb3J0IHsgSm91cm5hbFNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBOb3RlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9ub3RlLXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvcmV2aWV3LWxvZy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBSZXZpZXdTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Jldmlldy1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTdW1tYXJ5U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFRhc2tTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3Rhc2stc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7XG4gIFByb21wdE1vZGFsLFxuICBSZXN1bHRNb2RhbCxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3Byb21wdC1tb2RhbHNcIjtcbmltcG9ydCB7IEluYm94UmV2aWV3TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvaW5ib3gtcmV2aWV3LW1vZGFsXCI7XG5pbXBvcnQgeyBSZXZpZXdIaXN0b3J5TW9kYWwgfSBmcm9tIFwiLi9zcmMvdmlld3MvcmV2aWV3LWhpc3RvcnktbW9kYWxcIjtcbmltcG9ydCB7XG4gIEJSQUlOX1ZJRVdfVFlQRSxcbiAgQnJhaW5TaWRlYmFyVmlldyxcbn0gZnJvbSBcIi4vc3JjL3ZpZXdzL3NpZGViYXItdmlld1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgU3VtbWFyeVJlc3VsdCB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9zdW1tYXJ5LXNlcnZpY2VcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJhaW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIHZhdWx0U2VydmljZSE6IFZhdWx0U2VydmljZTtcbiAgaW5ib3hTZXJ2aWNlITogSW5ib3hTZXJ2aWNlO1xuICBub3RlU2VydmljZSE6IE5vdGVTZXJ2aWNlO1xuICB0YXNrU2VydmljZSE6IFRhc2tTZXJ2aWNlO1xuICBqb3VybmFsU2VydmljZSE6IEpvdXJuYWxTZXJ2aWNlO1xuICByZXZpZXdMb2dTZXJ2aWNlITogUmV2aWV3TG9nU2VydmljZTtcbiAgcmV2aWV3U2VydmljZSE6IFJldmlld1NlcnZpY2U7XG4gIGFpU2VydmljZSE6IEJyYWluQUlTZXJ2aWNlO1xuICBzdW1tYXJ5U2VydmljZSE6IFN1bW1hcnlTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGFzdFN1bW1hcnlBdDogRGF0ZSB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy52YXVsdFNlcnZpY2UgPSBuZXcgVmF1bHRTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFpU2VydmljZSA9IG5ldyBCcmFpbkFJU2VydmljZSgpO1xuICAgIHRoaXMuaW5ib3hTZXJ2aWNlID0gbmV3IEluYm94U2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5ub3RlU2VydmljZSA9IG5ldyBOb3RlU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy50YXNrU2VydmljZSA9IG5ldyBUYXNrU2VydmljZSh0aGlzLnZhdWx0U2VydmljZSwgKCkgPT4gdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5qb3VybmFsU2VydmljZSA9IG5ldyBKb3VybmFsU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMucmV2aWV3TG9nU2VydmljZSA9IG5ldyBSZXZpZXdMb2dTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5yZXZpZXdTZXJ2aWNlID0gbmV3IFJldmlld1NlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgIHRoaXMuaW5ib3hTZXJ2aWNlLFxuICAgICAgdGhpcy50YXNrU2VydmljZSxcbiAgICAgIHRoaXMuam91cm5hbFNlcnZpY2UsXG4gICAgICB0aGlzLnJldmlld0xvZ1NlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy5zdW1tYXJ5U2VydmljZSA9IG5ldyBTdW1tYXJ5U2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG5cbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhCUkFJTl9WSUVXX1RZUEUsIChsZWFmKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbmV3IEJyYWluU2lkZWJhclZpZXcobGVhZiwgdGhpcyk7XG4gICAgICB0aGlzLnNpZGViYXJWaWV3ID0gdmlldztcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImNhcHR1cmUtbm90ZVwiLFxuICAgICAgbmFtZTogXCJCcmFpbjogQ2FwdHVyZSBOb3RlXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNhcHR1cmVGcm9tTW9kYWwoXCJDYXB0dXJlIE5vdGVcIiwgXCJTYXZlIG5vdGVcIiwgYXN5bmMgKHRleHQpID0+IHtcbiAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMubm90ZVNlcnZpY2UuYXBwZW5kTm90ZSh0ZXh0KTtcbiAgICAgICAgICByZXR1cm4gYFNhdmVkIG5vdGUgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJhZGQtdGFza1wiLFxuICAgICAgbmFtZTogXCJCcmFpbjogQWRkIFRhc2tcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2FwdHVyZUZyb21Nb2RhbChcIkFkZCBUYXNrXCIsIFwiU2F2ZSB0YXNrXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgICAgICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYWRkLWpvdXJuYWwtZW50cnlcIixcbiAgICAgIG5hbWU6IFwiQnJhaW46IEFkZCBKb3VybmFsIEVudHJ5XCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNhcHR1cmVGcm9tTW9kYWwoXG4gICAgICAgICAgXCJBZGQgSm91cm5hbCBFbnRyeVwiLFxuICAgICAgICAgIFwiU2F2ZSBlbnRyeVwiLFxuICAgICAgICAgIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkodGV4dCk7XG4gICAgICAgICAgICByZXR1cm4gYFNhdmVkIGpvdXJuYWwgZW50cnkgdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJwcm9jZXNzLWluYm94XCIsXG4gICAgICBuYW1lOiBcIkJyYWluOiBQcm9jZXNzIEluYm94XCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnByb2Nlc3NJbmJveCgpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJyZXZpZXctaGlzdG9yeVwiLFxuICAgICAgbmFtZTogXCJCcmFpbjogUmV2aWV3IEhpc3RvcnlcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMub3BlblJldmlld0hpc3RvcnkoKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwic3VtbWFyaXplLXJlY2VudC1ub3Rlc1wiLFxuICAgICAgbmFtZTogXCJCcmFpbjogU3VtbWFyaXplIFJlY2VudCBOb3Rlc1wiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZVN1bW1hcnlGb3JXaW5kb3coKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwic3VtbWFyaXplLXRvZGF5XCIsXG4gICAgICBuYW1lOiBcIkJyYWluOiBTdW1tYXJpemUgVG9kYXlcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDEsIFwiVG9kYXlcIik7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInN1bW1hcml6ZS10aGlzLXdlZWtcIixcbiAgICAgIG5hbWU6IFwiQnJhaW46IFN1bW1hcml6ZSBUaGlzIFdlZWtcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KDcsIFwiV2Vla1wiKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYWRkLXRhc2stZnJvbS1zZWxlY3Rpb25cIixcbiAgICAgIG5hbWU6IFwiQnJhaW46IEFkZCBUYXNrIEZyb20gU2VsZWN0aW9uXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmFkZFRhc2tGcm9tU2VsZWN0aW9uKCk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tdG9kYXlzLWpvdXJuYWxcIixcbiAgICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVG9kYXkncyBKb3VybmFsXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLm9wZW5Ub2RheXNKb3VybmFsKCk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tc2lkZWJhclwiLFxuICAgICAgbmFtZTogXCJCcmFpbjogT3BlbiBTaWRlYmFyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLm9wZW5TaWRlYmFyKCk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRoZSBzaWRlYmFyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBCUkFJTl9WSUVXX1RZUEUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGhhc09wZW5TaWRlYmFyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSkubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJSZXN1bHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8uc2V0TGFzdFJlc3VsdCh0ZXh0KTtcbiAgfVxuXG4gIHVwZGF0ZVNpZGViYXJTdW1tYXJ5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnNldExhc3RTdW1tYXJ5KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChtZXNzYWdlKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICB9XG5cbiAgZ2V0TGFzdFN1bW1hcnlMYWJlbCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmxhc3RTdW1tYXJ5QXQgPyBmb3JtYXREYXRlVGltZUtleSh0aGlzLmxhc3RTdW1tYXJ5QXQpIDogXCJObyBzdW1tYXJ5IHlldFwiO1xuICB9XG5cbiAgYXN5bmMgcm91dGVUZXh0KHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJBSSByb3V0aW5nIGlzIGVuYWJsZWQgYnV0IE9wZW5BSSBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLnJvdXRlVGV4dCh0ZXh0LCB0aGlzLnNldHRpbmdzKTtcbiAgICBpZiAocm91dGUpIHtcbiAgICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChgQXV0by1yb3V0ZWQgYXMgJHtyb3V0ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJvdXRlO1xuICB9XG5cbiAgYXN5bmMgc3VtbWFyaXplTm93KCk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3VtbWFyeVNlcnZpY2UuZ2VuZXJhdGVTdW1tYXJ5KCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KGAke3Jlc3VsdC50aXRsZX1cXG5cXG4ke3Jlc3VsdC5jb250ZW50fWApO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgIHJlc3VsdC51c2VkQUkgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYCA6IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIGxvY2FsbHlgLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5Rm9yV2luZG93KFxuICAgIGxvb2tiYWNrRGF5cz86IG51bWJlcixcbiAgICBsYWJlbD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxTdW1tYXJ5UmVzdWx0PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zdW1tYXJ5U2VydmljZS5nZW5lcmF0ZVN1bW1hcnkobG9va2JhY2tEYXlzLCBsYWJlbCk7XG4gICAgdGhpcy5sYXN0U3VtbWFyeUF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJTdW1tYXJ5KGAke3Jlc3VsdC50aXRsZX1cXG5cXG4ke3Jlc3VsdC5jb250ZW50fWApO1xuICAgIHRoaXMudXBkYXRlU2lkZWJhclJlc3VsdChcbiAgICAgIHJlc3VsdC51c2VkQUkgPyBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCB3aXRoIEFJYCA6IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIGxvY2FsbHlgLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICBuZXcgTm90aWNlKFxuICAgICAgcmVzdWx0LnBlcnNpc3RlZFBhdGhcbiAgICAgICAgPyBgJHtyZXN1bHQudGl0bGV9IHNhdmVkIHRvICR7cmVzdWx0LnBlcnNpc3RlZFBhdGh9YFxuICAgICAgICA6IHJlc3VsdC51c2VkQUlcbiAgICAgICAgICA/IGAke3Jlc3VsdC50aXRsZX0gZ2VuZXJhdGVkIHdpdGggQUlgXG4gICAgICAgICAgOiBgJHtyZXN1bHQudGl0bGV9IGdlbmVyYXRlZCBsb2NhbGx5YCxcbiAgICApO1xuICAgIGlmICghdGhpcy5oYXNPcGVuU2lkZWJhcigpKSB7XG4gICAgICBuZXcgUmVzdWx0TW9kYWwodGhpcy5hcHAsIGBCcmFpbiAke3Jlc3VsdC50aXRsZX1gLCByZXN1bHQuY29udGVudCkub3BlbigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZUZyb21Nb2RhbChcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHN1Ym1pdExhYmVsOiBzdHJpbmcsXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgbXVsdGlsaW5lID0gZmFsc2UsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgbmV3IFByb21wdE1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICB0aXRsZSxcbiAgICAgIHBsYWNlaG9sZGVyOiBtdWx0aWxpbmVcbiAgICAgICAgPyBcIldyaXRlIHlvdXIgZW50cnkgaGVyZS4uLlwiXG4gICAgICAgIDogXCJUeXBlIGhlcmUuLi5cIixcbiAgICAgIHN1Ym1pdExhYmVsLFxuICAgICAgbXVsdGlsaW5lLFxuICAgIH0pLm9wZW5Qcm9tcHQoKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhY3Rpb24odmFsdWUpO1xuICAgICAgYXdhaXQgdGhpcy5yZXBvcnRBY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiQnJhaW4gY291bGQgbm90IHNhdmUgdGhhdCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjYXB0dXJlTm90ZSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5ub3RlU2VydmljZS5hcHBlbmROb3RlKHRleHQpO1xuICAgIHJldHVybiBgU2F2ZWQgbm90ZSB0byAke3NhdmVkLnBhdGh9YDtcbiAgfVxuXG4gIGFzeW5jIGNhcHR1cmVUYXNrKHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgcmV0dXJuIGBTYXZlZCB0YXNrIHRvICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgY2FwdHVyZUpvdXJuYWwodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuam91cm5hbFNlcnZpY2UuYXBwZW5kRW50cnkodGV4dCk7XG4gICAgcmV0dXJuIGBTYXZlZCBqb3VybmFsIGVudHJ5IHRvICR7c2F2ZWQucGF0aH1gO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc0luYm94KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB0aGlzLnJldmlld1NlcnZpY2UuZ2V0UmVjZW50SW5ib3hFbnRyaWVzKCk7XG4gICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgbmV3IE5vdGljZShcIk5vIGluYm94IGVudHJpZXMgZm91bmRcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV3IEluYm94UmV2aWV3TW9kYWwodGhpcy5hcHAsIGVudHJpZXMsIHRoaXMucmV2aWV3U2VydmljZSwgYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICAgIH0pLm9wZW4oKTtcbiAgICB0aGlzLnVwZGF0ZVNpZGViYXJSZXN1bHQoYExvYWRlZCAke2VudHJpZXMubGVuZ3RofSBpbmJveCBlbnRyaWVzYCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5SZXZpZXdIaXN0b3J5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cmllcygpO1xuICAgIG5ldyBSZXZpZXdIaXN0b3J5TW9kYWwodGhpcy5hcHAsIGVudHJpZXMsIHRoaXMpLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIGFkZFRhc2tGcm9tU2VsZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IHRoaXMuZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpO1xuICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy50YXNrU2VydmljZS5hcHBlbmRUYXNrKHNlbGVjdGlvbik7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYFNhdmVkIHRhc2sgZnJvbSBzZWxlY3Rpb24gdG8gJHtzYXZlZC5wYXRofWA7XG4gICAgICBhd2FpdCB0aGlzLnJlcG9ydEFjdGlvblJlc3VsdChtZXNzYWdlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBuZXcgTm90aWNlKFwiTm8gc2VsZWN0aW9uIGZvdW5kLiBPcGVuaW5nIHRhc2sgZW50cnkgbW9kYWwuXCIpO1xuICAgIGF3YWl0IHRoaXMuY2FwdHVyZUZyb21Nb2RhbChcIkFkZCBUYXNrXCIsIFwiU2F2ZSB0YXNrXCIsIGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMudGFza1NlcnZpY2UuYXBwZW5kVGFzayh0ZXh0KTtcbiAgICAgIHJldHVybiBgU2F2ZWQgdGFzayB0byAke3NhdmVkLnBhdGh9YDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5Ub2RheXNKb3VybmFsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmpvdXJuYWxTZXJ2aWNlLmVuc3VyZUpvdXJuYWxGaWxlKCk7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0b2RheSdzIGpvdXJuYWxcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgICBjb25zdCBtZXNzYWdlID0gYE9wZW5lZCAke2ZpbGUucGF0aH1gO1xuICAgIGF3YWl0IHRoaXMucmVwb3J0QWN0aW9uUmVzdWx0KG1lc3NhZ2UpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW5ib3hDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB0aGlzLmluYm94U2VydmljZS5nZXRSZWNlbnRFbnRyaWVzKDEwMDApO1xuICAgIHJldHVybiBlbnRyaWVzLmxlbmd0aDtcbiAgfVxuXG4gIGFzeW5jIGdldE9wZW5UYXNrQ291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQodGhpcy5zZXR0aW5ncy50YXNrc0ZpbGUpO1xuICAgIHJldHVybiB0ZXh0XG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gL14tIFxcWyggfHh8WClcXF0vLnRlc3QobGluZSkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiAhL14tIFxcWyh4fFgpXFxdLy50ZXN0KGxpbmUpKVxuICAgICAgLmxlbmd0aDtcbiAgfVxuXG4gIGFzeW5jIGdldFJldmlld0hpc3RvcnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLnJldmlld0xvZ1NlcnZpY2UuZ2V0UmV2aWV3RW50cnlDb3VudCgpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuUmV2aWV3RW50cnkoZW50cnk6IHtcbiAgICBoZWFkaW5nOiBzdHJpbmc7XG4gICAgcHJldmlldzogc3RyaW5nO1xuICAgIHNpZ25hdHVyZTogc3RyaW5nO1xuICAgIHNpZ25hdHVyZUluZGV4OiBudW1iZXI7XG4gIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5yZW9wZW5Gcm9tUmV2aWV3TG9nKHtcbiAgICAgIGFjdGlvbjogXCJyZW9wZW5cIixcbiAgICAgIHRpbWVzdGFtcDogXCJcIixcbiAgICAgIHNvdXJjZVBhdGg6IFwiXCIsXG4gICAgICBmaWxlTXRpbWU6IERhdGUubm93KCksXG4gICAgICBlbnRyeUluZGV4OiAwLFxuICAgICAgYm9keTogXCJcIixcbiAgICAgIGhlYWRpbmc6IGVudHJ5LmhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0QWlTdGF0dXNUZXh0KCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzICYmICF0aGlzLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZykge1xuICAgICAgcmV0dXJuIFwiQUkgb2ZmXCI7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgKHRoaXMuc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMgfHwgdGhpcy5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpICYmXG4gICAgICAoIXRoaXMuc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSB8fCAhdGhpcy5zZXR0aW5ncy5vcGVuQUlNb2RlbC50cmltKCkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJBSSBlbmFibGVkIGJ1dCBtaXNzaW5nIGtleVwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIkFJIGNvbmZpZ3VyZWRcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlU2VsZWN0aW9uVGV4dCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFjdGl2ZVZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGFjdGl2ZVZpZXc/LmVkaXRvcj8uZ2V0U2VsZWN0aW9uKCk/LnRyaW0oKSA/PyBcIlwiO1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBpbmJveEZpbGU6IHN0cmluZztcbiAgdGFza3NGaWxlOiBzdHJpbmc7XG4gIGpvdXJuYWxGb2xkZXI6IHN0cmluZztcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgc3VtbWFyaWVzRm9sZGVyOiBzdHJpbmc7XG4gIHJldmlld3NGb2xkZXI6IHN0cmluZztcblxuICBlbmFibGVBSVN1bW1hcmllczogYm9vbGVhbjtcbiAgZW5hYmxlQUlSb3V0aW5nOiBib29sZWFuO1xuXG4gIG9wZW5BSUFwaUtleTogc3RyaW5nO1xuICBvcGVuQUlNb2RlbDogc3RyaW5nO1xuXG4gIHN1bW1hcnlMb29rYmFja0RheXM6IG51bWJlcjtcbiAgc3VtbWFyeU1heENoYXJzOiBudW1iZXI7XG5cbiAgcGVyc2lzdFN1bW1hcmllczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQlJBSU5fU0VUVElOR1M6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gIGluYm94RmlsZTogXCJCcmFpbi9pbmJveC5tZFwiLFxuICB0YXNrc0ZpbGU6IFwiQnJhaW4vdGFza3MubWRcIixcbiAgam91cm5hbEZvbGRlcjogXCJCcmFpbi9qb3VybmFsXCIsXG4gIG5vdGVzRm9sZGVyOiBcIkJyYWluL25vdGVzXCIsXG4gIHN1bW1hcmllc0ZvbGRlcjogXCJCcmFpbi9zdW1tYXJpZXNcIixcbiAgcmV2aWV3c0ZvbGRlcjogXCJCcmFpbi9yZXZpZXdzXCIsXG4gIGVuYWJsZUFJU3VtbWFyaWVzOiBmYWxzZSxcbiAgZW5hYmxlQUlSb3V0aW5nOiBmYWxzZSxcbiAgb3BlbkFJQXBpS2V5OiBcIlwiLFxuICBvcGVuQUlNb2RlbDogXCJncHQtNC4xLW1pbmlcIixcbiAgc3VtbWFyeUxvb2tiYWNrRGF5czogNyxcbiAgc3VtbWFyeU1heENoYXJzOiAxMjAwMCxcbiAgcGVyc2lzdFN1bW1hcmllczogdHJ1ZSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmFpblNldHRpbmdzKFxuICBpbnB1dDogUGFydGlhbDxCcmFpblBsdWdpblNldHRpbmdzPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIGNvbnN0IG1lcmdlZDogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgICAuLi5ERUZBVUxUX0JSQUlOX1NFVFRJTkdTLFxuICAgIC4uLmlucHV0LFxuICB9IGFzIEJyYWluUGx1Z2luU2V0dGluZ3M7XG5cbiAgcmV0dXJuIHtcbiAgICBpbmJveEZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChtZXJnZWQuaW5ib3hGaWxlLCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmluYm94RmlsZSksXG4gICAgdGFza3NGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgobWVyZ2VkLnRhc2tzRmlsZSwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy50YXNrc0ZpbGUpLFxuICAgIGpvdXJuYWxGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5qb3VybmFsRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5qb3VybmFsRm9sZGVyLFxuICAgICksXG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBzdW1tYXJpZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5zdW1tYXJpZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcmllc0ZvbGRlcixcbiAgICApLFxuICAgIHJldmlld3NGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5yZXZpZXdzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5yZXZpZXdzRm9sZGVyLFxuICAgICksXG4gICAgZW5hYmxlQUlTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLmVuYWJsZUFJU3VtbWFyaWVzKSxcbiAgICBlbmFibGVBSVJvdXRpbmc6IEJvb2xlYW4obWVyZ2VkLmVuYWJsZUFJUm91dGluZyksXG4gICAgb3BlbkFJQXBpS2V5OiB0eXBlb2YgbWVyZ2VkLm9wZW5BSUFwaUtleSA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5vcGVuQUlBcGlLZXkudHJpbSgpIDogXCJcIixcbiAgICBvcGVuQUlNb2RlbDpcbiAgICAgIHR5cGVvZiBtZXJnZWQub3BlbkFJTW9kZWwgPT09IFwic3RyaW5nXCIgJiYgbWVyZ2VkLm9wZW5BSU1vZGVsLnRyaW0oKVxuICAgICAgICA/IG1lcmdlZC5vcGVuQUlNb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm9wZW5BSU1vZGVsLFxuICAgIHN1bW1hcnlMb29rYmFja0RheXM6IGNsYW1wSW50ZWdlcihtZXJnZWQuc3VtbWFyeUxvb2tiYWNrRGF5cywgMSwgMzY1LCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLnN1bW1hcnlMb29rYmFja0RheXMpLFxuICAgIHN1bW1hcnlNYXhDaGFyczogY2xhbXBJbnRlZ2VyKG1lcmdlZC5zdW1tYXJ5TWF4Q2hhcnMsIDEwMDAsIDEwMDAwMCwgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5zdW1tYXJ5TWF4Q2hhcnMpLFxuICAgIHBlcnNpc3RTdW1tYXJpZXM6IEJvb2xlYW4obWVyZ2VkLnBlcnNpc3RTdW1tYXJpZXMpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGl2ZVBhdGgodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBjbGFtcEludGVnZXIoXG4gIHZhbHVlOiB1bmtub3duLFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXIsXG4gIGZhbGxiYWNrOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBwYXJzZWQpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW4gU2V0dGluZ3NcIiB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0b3JhZ2VcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbmJveCBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdXNlZCBmb3IgcXVpY2sgbm90ZSBjYXB0dXJlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5ib3hGaWxlKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluYm94RmlsZSA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlRhc2tzIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB1c2VkIGZvciBxdWljayB0YXNrIGNhcHR1cmUuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZpbGUpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGaWxlID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSm91cm5hbCBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIGNvbnRhaW5pbmcgZGFpbHkgam91cm5hbCBmaWxlcy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmpvdXJuYWxGb2xkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbEZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJGb2xkZXIgdXNlZCBmb3IgcHJvbW90ZWQgbm90ZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlcilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlN1bW1hcmllcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgZm9yIHBlcnNpc3RlZCBzdW1tYXJpZXMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyaWVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmV2aWV3cyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRm9sZGVyIHVzZWQgdG8gc3RvcmUgaW5ib3ggcmV2aWV3IGxvZ3MuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXZpZXdzRm9sZGVyKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJldmlld3NGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFJXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIEFJIHN1bW1hcmllc1wiKVxuICAgICAgLnNldERlc2MoXCJVc2UgT3BlbkFJIGZvciBzdW1tYXJpZXMgd2hlbiBjb25maWd1cmVkLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlTdW1tYXJpZXMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgQUkgcm91dGluZ1wiKVxuICAgICAgLnNldERlc2MoXCJBbGxvdyB0aGUgc2lkZWJhciB0byBhdXRvLXJvdXRlIGNhcHR1cmVzIHdpdGggQUkuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBSVJvdXRpbmcpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUFJUm91dGluZyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiT3BlbkFJIEFQSSBrZXlcIilcbiAgICAgIC5zZXREZXNjKFwiU3RvcmVkIGxvY2FsbHkgaW4gcGx1Z2luIHNldHRpbmdzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcInBhc3N3b3JkXCI7XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJzay0uLi5cIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJQXBpS2V5KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5BSUFwaUtleSA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJPcGVuQUkgbW9kZWxcIilcbiAgICAgIC5zZXREZXNjKFwiTW9kZWwgbmFtZSB1c2VkIGZvciBzdW1tYXJ5IGFuZCByb3V0aW5nIHJlcXVlc3RzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3BlbkFJTW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN1bW1hcmllc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkxvb2tiYWNrIGRheXNcIilcbiAgICAgIC5zZXREZXNjKFwiSG93IGZhciBiYWNrIHRvIHNjYW4gd2hlbiBidWlsZGluZyBhIHN1bW1hcnkuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3Muc3VtbWFyeUxvb2tiYWNrRGF5cykpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TG9va2JhY2tEYXlzID0gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMCA/IHBhcnNlZCA6IDc7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTWF4aW11bSBjaGFyYWN0ZXJzXCIpXG4gICAgICAuc2V0RGVzYyhcIk1heGltdW0gdGV4dCBjb2xsZWN0ZWQgYmVmb3JlIHN1bW1hcml6aW5nLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN1bW1hcnlNYXhDaGFycykpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMgPSBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPj0gMTAwMCA/IHBhcnNlZCA6IDEyMDAwO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlBlcnNpc3Qgc3VtbWFyaWVzXCIpXG4gICAgICAuc2V0RGVzYyhcIldyaXRlIGdlbmVyYXRlZCBzdW1tYXJpZXMgaW50byB0aGUgdmF1bHQuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzaXN0U3VtbWFyaWVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXREYXRlS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQyKGRhdGUuZ2V0TW9udGgoKSArIDEpfS0ke3BhZDIoZGF0ZS5nZXREYXRlKCkpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUaW1lS2V5KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3BhZDIoZGF0ZS5nZXRIb3VycygpKX06JHtwYWQyKGRhdGUuZ2V0TWludXRlcygpKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZVRpbWVLZXkoZGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Zm9ybWF0RGF0ZUtleShkYXRlKX0gJHtmb3JtYXRUaW1lS2V5KGRhdGUpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wKGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Zvcm1hdERhdGVLZXkoZGF0ZSl9LSR7cGFkMihkYXRlLmdldEhvdXJzKCkpfSR7cGFkMihkYXRlLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsYXBzZUpvdXJuYWxUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS5yZXBsYWNlKC9cXHMrJC9nLCBcIlwiKSlcbiAgICAuam9pbihcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOZXdsaW5lcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCBcIlwiKTtcbn1cblxuZnVuY3Rpb24gcGFkMih2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmJveEVudHJ5IHtcbiAgaGVhZGluZzogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIHJhdzogc3RyaW5nO1xuICBwcmV2aWV3OiBzdHJpbmc7XG4gIGluZGV4OiBudW1iZXI7XG4gIHNpZ25hdHVyZTogc3RyaW5nO1xuICBzaWduYXR1cmVJbmRleDogbnVtYmVyO1xuICBzdGFydExpbmU6IG51bWJlcjtcbiAgZW5kTGluZTogbnVtYmVyO1xuICByZXZpZXdlZDogYm9vbGVhbjtcbiAgcmV2aWV3QWN0aW9uOiBzdHJpbmcgfCBudWxsO1xuICByZXZpZXdlZEF0OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBJbmJveEVudHJ5SWRlbnRpdHkgPSBQaWNrPFxuICBJbmJveEVudHJ5LFxuICBcImhlYWRpbmdcIiB8IFwiYm9keVwiIHwgXCJwcmV2aWV3XCIgfCBcInNpZ25hdHVyZVwiIHwgXCJzaWduYXR1cmVJbmRleFwiXG4+ICZcbiAgUGFydGlhbDxQaWNrPEluYm94RW50cnksIFwicmF3XCIgfCBcInN0YXJ0TGluZVwiIHwgXCJlbmRMaW5lXCI+PjtcblxuZXhwb3J0IGNsYXNzIEluYm94U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0UmVjZW50RW50cmllcyhsaW1pdCA9IDIwLCBpbmNsdWRlUmV2aWV3ZWQgPSBmYWxzZSk6IFByb21pc2U8SW5ib3hFbnRyeVtdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBlbnRyaWVzID0gcGFyc2VJbmJveEVudHJpZXMoY29udGVudCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBpbmNsdWRlUmV2aWV3ZWQgPyBlbnRyaWVzIDogZW50cmllcy5maWx0ZXIoKGVudHJ5KSA9PiAhZW50cnkucmV2aWV3ZWQpO1xuICAgIHJldHVybiBmaWx0ZXJlZC5zbGljZSgtbGltaXQpLnJldmVyc2UoKTtcbiAgfVxuXG4gIGFzeW5jIG1hcmtFbnRyeVJldmlld2VkKGVudHJ5OiBJbmJveEVudHJ5SWRlbnRpdHksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoc2V0dGluZ3MuaW5ib3hGaWxlKTtcbiAgICBjb25zdCBjdXJyZW50RW50cmllcyA9IHBhcnNlSW5ib3hFbnRyaWVzKGNvbnRlbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRFbnRyeSA9XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmUgPT09IGVudHJ5LnNpZ25hdHVyZSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5zaWduYXR1cmVJbmRleCA9PT0gZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgICApID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKChjYW5kaWRhdGUpID0+ICFjYW5kaWRhdGUucmV2aWV3ZWQgJiYgY2FuZGlkYXRlLnJhdyA9PT0gZW50cnkucmF3KSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuYm9keSA9PT0gZW50cnkuYm9keSAmJlxuICAgICAgICAgIGNhbmRpZGF0ZS5wcmV2aWV3ID09PSBlbnRyeS5wcmV2aWV3LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAhY2FuZGlkYXRlLnJldmlld2VkICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmhlYWRpbmcgPT09IGVudHJ5LmhlYWRpbmcgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc3RhcnRMaW5lID09PSBlbnRyeS5zdGFydExpbmUsXG4gICAgICApO1xuXG4gICAgaWYgKCFjdXJyZW50RW50cnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkID0gaW5zZXJ0UmV2aWV3TWFya2VyKGNvbnRlbnQsIGN1cnJlbnRFbnRyeSwgYWN0aW9uKTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IEluYm94RW50cnlJZGVudGl0eSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KHNldHRpbmdzLmluYm94RmlsZSk7XG4gICAgY29uc3QgY3VycmVudEVudHJpZXMgPSBwYXJzZUluYm94RW50cmllcyhjb250ZW50KTtcbiAgICBjb25zdCBjdXJyZW50RW50cnkgPVxuICAgICAgY3VycmVudEVudHJpZXMuZmluZChcbiAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUgJiZcbiAgICAgICAgICBjYW5kaWRhdGUuc2lnbmF0dXJlSW5kZXggPT09IGVudHJ5LnNpZ25hdHVyZUluZGV4LFxuICAgICAgKSA/P1xuICAgICAgY3VycmVudEVudHJpZXMuZmluZCgoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUuc2lnbmF0dXJlID09PSBlbnRyeS5zaWduYXR1cmUpID8/XG4gICAgICBjdXJyZW50RW50cmllcy5maW5kKFxuICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgIGNhbmRpZGF0ZS5oZWFkaW5nID09PSBlbnRyeS5oZWFkaW5nICYmXG4gICAgICAgICAgY2FuZGlkYXRlLmJvZHkgPT09IGVudHJ5LmJvZHkgJiZcbiAgICAgICAgICBjYW5kaWRhdGUucHJldmlldyA9PT0gZW50cnkucHJldmlldyxcbiAgICAgICk7XG5cbiAgICBpZiAoIWN1cnJlbnRFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWQgPSByZW1vdmVSZXZpZXdNYXJrZXIoY29udGVudCwgY3VycmVudEVudHJ5KTtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIHVwZGF0ZWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluYm94RW50cmllcyhjb250ZW50OiBzdHJpbmcpOiBJbmJveEVudHJ5W10ge1xuICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGVudHJpZXM6IEluYm94RW50cnlbXSA9IFtdO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudEJvZHlMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRTdGFydExpbmUgPSAtMTtcbiAgbGV0IGN1cnJlbnRSZXZpZXdlZCA9IGZhbHNlO1xuICBsZXQgY3VycmVudFJldmlld0FjdGlvbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50UmV2aWV3ZWRBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHNpZ25hdHVyZUNvdW50cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgcHVzaEVudHJ5ID0gKGVuZExpbmU6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGlmICghY3VycmVudEhlYWRpbmcpIHtcbiAgICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gY3VycmVudEJvZHlMaW5lcy5qb2luKFwiXFxuXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwcmV2aWV3ID0gYnVpbGRQcmV2aWV3KGJvZHkpO1xuICAgIGNvbnN0IHJhdyA9IFtjdXJyZW50SGVhZGluZywgLi4uY3VycmVudEJvZHlMaW5lc10uam9pbihcIlxcblwiKS50cmltRW5kKCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYnVpbGRFbnRyeVNpZ25hdHVyZShjdXJyZW50SGVhZGluZywgY3VycmVudEJvZHlMaW5lcyk7XG4gICAgY29uc3Qgc2lnbmF0dXJlSW5kZXggPSBzaWduYXR1cmVDb3VudHMuZ2V0KHNpZ25hdHVyZSkgPz8gMDtcbiAgICBzaWduYXR1cmVDb3VudHMuc2V0KHNpZ25hdHVyZSwgc2lnbmF0dXJlSW5kZXggKyAxKTtcbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcucmVwbGFjZSgvXiMjXFxzKy8sIFwiXCIpLnRyaW0oKSxcbiAgICAgIGJvZHksXG4gICAgICByYXcsXG4gICAgICBwcmV2aWV3LFxuICAgICAgaW5kZXg6IGVudHJpZXMubGVuZ3RoLFxuICAgICAgc2lnbmF0dXJlLFxuICAgICAgc2lnbmF0dXJlSW5kZXgsXG4gICAgICBzdGFydExpbmU6IGN1cnJlbnRTdGFydExpbmUsXG4gICAgICBlbmRMaW5lLFxuICAgICAgcmV2aWV3ZWQ6IGN1cnJlbnRSZXZpZXdlZCxcbiAgICAgIHJldmlld0FjdGlvbjogY3VycmVudFJldmlld0FjdGlvbixcbiAgICAgIHJldmlld2VkQXQ6IGN1cnJlbnRSZXZpZXdlZEF0LFxuICAgIH0pO1xuICAgIGN1cnJlbnRCb2R5TGluZXMgPSBbXTtcbiAgICBjdXJyZW50U3RhcnRMaW5lID0gLTE7XG4gICAgY3VycmVudFJldmlld2VkID0gZmFsc2U7XG4gICAgY3VycmVudFJldmlld0FjdGlvbiA9IG51bGw7XG4gICAgY3VycmVudFJldmlld2VkQXQgPSBudWxsO1xuICB9O1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaW5kZXhdO1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeShpbmRleCk7XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGxpbmU7XG4gICAgICBjdXJyZW50U3RhcnRMaW5lID0gaW5kZXg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIWN1cnJlbnRIZWFkaW5nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOlxccyooW2Etel0rKSg/OlxccysoLis/KSk/XFxzKi0tPiQvaSk7XG4gICAgaWYgKHJldmlld01hdGNoKSB7XG4gICAgICBjdXJyZW50UmV2aWV3ZWQgPSB0cnVlO1xuICAgICAgY3VycmVudFJldmlld0FjdGlvbiA9IHJldmlld01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjdXJyZW50UmV2aWV3ZWRBdCA9IHJldmlld01hdGNoWzJdID8/IG51bGw7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjdXJyZW50Qm9keUxpbmVzLnB1c2gobGluZSk7XG4gIH1cblxuICBwdXNoRW50cnkobGluZXMubGVuZ3RoKTtcbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5LCBhY3Rpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgaWYgKGVudHJ5LnN0YXJ0TGluZSA8IDAgfHwgZW50cnkuZW5kTGluZSA8IGVudHJ5LnN0YXJ0TGluZSB8fCBlbnRyeS5lbmRMaW5lID4gbGluZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKTtcbiAgY29uc3QgbWFya2VyID0gYDwhLS0gYnJhaW4tcmV2aWV3ZWQ6ICR7YWN0aW9ufSAke3RpbWVzdGFtcH0gLS0+YDtcbiAgY29uc3QgZW50cnlMaW5lcyA9IGxpbmVzLnNsaWNlKGVudHJ5LnN0YXJ0TGluZSwgZW50cnkuZW5kTGluZSk7XG4gIGNvbnN0IGNsZWFuZWRFbnRyeUxpbmVzID0gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhcbiAgICBlbnRyeUxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUubWF0Y2goL148IS0tXFxzKmJyYWluLXJldmlld2VkOi9pKSksXG4gICk7XG4gIGNsZWFuZWRFbnRyeUxpbmVzLnB1c2gobWFya2VyLCBcIlwiKTtcblxuICBjb25zdCB1cGRhdGVkTGluZXMgPSBbXG4gICAgLi4ubGluZXMuc2xpY2UoMCwgZW50cnkuc3RhcnRMaW5lKSxcbiAgICAuLi5jbGVhbmVkRW50cnlMaW5lcyxcbiAgICAuLi5saW5lcy5zbGljZShlbnRyeS5lbmRMaW5lKSxcbiAgXTtcblxuICByZXR1cm4gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyh1cGRhdGVkTGluZXMpLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJldmlld01hcmtlcihjb250ZW50OiBzdHJpbmcsIGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBpZiAoZW50cnkuc3RhcnRMaW5lIDwgMCB8fCBlbnRyeS5lbmRMaW5lIDwgZW50cnkuc3RhcnRMaW5lIHx8IGVudHJ5LmVuZExpbmUgPiBsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIGNvbnN0IGVudHJ5TGluZXMgPSBsaW5lcy5zbGljZShlbnRyeS5zdGFydExpbmUsIGVudHJ5LmVuZExpbmUpO1xuICBjb25zdCBjbGVhbmVkRW50cnlMaW5lcyA9IHRyaW1UcmFpbGluZ0JsYW5rTGluZXMoXG4gICAgZW50cnlMaW5lcy5maWx0ZXIoKGxpbmUpID0+ICFsaW5lLm1hdGNoKC9ePCEtLVxccypicmFpbi1yZXZpZXdlZDovaSkpLFxuICApO1xuXG4gIGNvbnN0IHVwZGF0ZWRMaW5lcyA9IFtcbiAgICAuLi5saW5lcy5zbGljZSgwLCBlbnRyeS5zdGFydExpbmUpLFxuICAgIC4uLmNsZWFuZWRFbnRyeUxpbmVzLFxuICAgIC4uLmxpbmVzLnNsaWNlKGVudHJ5LmVuZExpbmUpLFxuICBdO1xuXG4gIHJldHVybiB0cmltVHJhaWxpbmdCbGFua0xpbmVzKHVwZGF0ZWRMaW5lcykuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRQcmV2aWV3KGJvZHk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gYm9keVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIHJldHVybiBsaW5lc1swXSA/PyBcIlwiO1xufVxuXG5mdW5jdGlvbiBidWlsZEVudHJ5U2lnbmF0dXJlKGhlYWRpbmc6IHN0cmluZywgYm9keUxpbmVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBbaGVhZGluZy50cmltKCksIC4uLmJvZHlMaW5lcy5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKV0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gdHJpbVRyYWlsaW5nQmxhbmtMaW5lcyhsaW5lczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNsb25lID0gWy4uLmxpbmVzXTtcbiAgd2hpbGUgKGNsb25lLmxlbmd0aCA+IDAgJiYgY2xvbmVbY2xvbmUubGVuZ3RoIC0gMV0udHJpbSgpID09PSBcIlwiKSB7XG4gICAgY2xvbmUucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGNsb25lO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlSm91cm5hbFRleHQsIGZvcm1hdERhdGVLZXksIGZvcm1hdFRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEpvdXJuYWxTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBnZXRKb3VybmFsUGF0aChkYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICByZXR1cm4gYCR7c2V0dGluZ3Muam91cm5hbEZvbGRlcn0vJHtkYXRlS2V5fS5tZGA7XG4gIH1cblxuICBhc3luYyBlbnN1cmVKb3VybmFsRmlsZShkYXRlID0gbmV3IERhdGUoKSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShkYXRlKTtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRKb3VybmFsUGF0aChkYXRlKTtcbiAgICByZXR1cm4gdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kSm91cm5hbEhlYWRlcihwYXRoLCBkYXRlS2V5KTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEVudHJ5KHRleHQ6IHN0cmluZywgZGF0ZSA9IG5ldyBEYXRlKCkpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VKb3VybmFsVGV4dCh0ZXh0KTtcbiAgICBpZiAoIWNsZWFuZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkpvdXJuYWwgdGV4dCBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlSm91cm5hbEZpbGUoZGF0ZSk7XG4gICAgY29uc3QgcGF0aCA9IGZpbGUucGF0aDtcblxuICAgIGNvbnN0IGJsb2NrID0gYCMjICR7Zm9ybWF0VGltZUtleShkYXRlKX1cXG4ke2NsZWFuZWR9YDtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQge1xuICBmb3JtYXREYXRlVGltZUtleSxcbiAgY29sbGFwc2VXaGl0ZXNwYWNlLFxufSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuXG5leHBvcnQgY2xhc3MgTm90ZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZE5vdGUodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90ZSB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAjIyAke2Zvcm1hdERhdGVUaW1lS2V5KG5ldyBEYXRlKCkpfVxcbi0gJHtjbGVhbmVkfWA7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy5pbmJveEZpbGUsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy5pbmJveEZpbGUgfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVLZXksIGZvcm1hdERhdGVUaW1lS2V5IH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IEluYm94RW50cnksIEluYm94RW50cnlJZGVudGl0eSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmV2aWV3TG9nRW50cnkgZXh0ZW5kcyBJbmJveEVudHJ5SWRlbnRpdHkge1xuICBhY3Rpb246IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG4gIHNvdXJjZVBhdGg6IHN0cmluZztcbiAgZmlsZU10aW1lOiBudW1iZXI7XG4gIGVudHJ5SW5kZXg6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFJldmlld0xvZ1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFJldmlld0xvZyhlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LCBhY3Rpb246IHN0cmluZyk6IFByb21pc2U8eyBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkYXRlS2V5ID0gZm9ybWF0RGF0ZUtleShub3cpO1xuICAgIGNvbnN0IHBhdGggPSBgJHtzZXR0aW5ncy5yZXZpZXdzRm9sZGVyfS8ke2RhdGVLZXl9Lm1kYDtcbiAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgYCMjICR7Zm9ybWF0RGF0ZVRpbWVLZXkobm93KX1gLFxuICAgICAgYC0gQWN0aW9uOiAke2FjdGlvbn1gLFxuICAgICAgYC0gSW5ib3g6ICR7ZW50cnkuaGVhZGluZ31gLFxuICAgICAgYC0gUHJldmlldzogJHtlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgXCIoZW1wdHkpXCJ9YCxcbiAgICAgIGAtIFNpZ25hdHVyZTogJHtlbmNvZGVSZXZpZXdTaWduYXR1cmUoZW50cnkuc2lnbmF0dXJlKX1gLFxuICAgICAgYC0gU2lnbmF0dXJlIGluZGV4OiAke2VudHJ5LnNpZ25hdHVyZUluZGV4fWAsXG4gICAgICBcIlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQocGF0aCwgY29udGVudCk7XG4gICAgcmV0dXJuIHsgcGF0aCB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3TG9nRmlsZXMobGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKTtcbiAgICBjb25zdCBtYXRjaGluZyA9IGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBpc1VuZGVyRm9sZGVyKGZpbGUucGF0aCwgc2V0dGluZ3MucmV2aWV3c0ZvbGRlcikpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpXG4gICAgcmV0dXJuIHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiA/IG1hdGNoaW5nLnNsaWNlKDAsIGxpbWl0KSA6IG1hdGNoaW5nO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3RW50cmllcyhsaW1pdD86IG51bWJlcik6IFByb21pc2U8UmV2aWV3TG9nRW50cnlbXT4ge1xuICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCB0aGlzLmdldFJldmlld0xvZ0ZpbGVzKGxpbWl0KTtcbiAgICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbG9ncykge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVJldmlld0xvZ0VudHJpZXMoY29udGVudCwgZmlsZS5wYXRoLCBmaWxlLnN0YXQubXRpbWUpO1xuICAgICAgZW50cmllcy5wdXNoKC4uLnBhcnNlZC5yZXZlcnNlKCkpO1xuICAgICAgaWYgKHR5cGVvZiBsaW1pdCA9PT0gXCJudW1iZXJcIiAmJiBlbnRyaWVzLmxlbmd0aCA+PSBsaW1pdCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGxpbWl0ID09PSBcIm51bWJlclwiID8gZW50cmllcy5zbGljZSgwLCBsaW1pdCkgOiBlbnRyaWVzO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmV2aWV3RW50cnlDb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRSZXZpZXdFbnRyaWVzKCkpLmxlbmd0aDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXZpZXdMb2dFbnRyaWVzKFxuICBjb250ZW50OiBzdHJpbmcsXG4gIHNvdXJjZVBhdGg6IHN0cmluZyxcbiAgZmlsZU10aW1lOiBudW1iZXIsXG4pOiBSZXZpZXdMb2dFbnRyeVtdIHtcbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBlbnRyaWVzOiBSZXZpZXdMb2dFbnRyeVtdID0gW107XG4gIGxldCBjdXJyZW50VGltZXN0YW1wID0gXCJcIjtcbiAgbGV0IGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICBsZXQgY3VycmVudEhlYWRpbmcgPSBcIlwiO1xuICBsZXQgY3VycmVudFByZXZpZXcgPSBcIlwiO1xuICBsZXQgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gIGxldCBjdXJyZW50U2lnbmF0dXJlSW5kZXggPSAwO1xuICBsZXQgY3VycmVudEVudHJ5SW5kZXggPSAwO1xuXG4gIGNvbnN0IHB1c2hFbnRyeSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUaW1lc3RhbXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgYWN0aW9uOiBjdXJyZW50QWN0aW9uIHx8IFwidW5rbm93blwiLFxuICAgICAgaGVhZGluZzogY3VycmVudEhlYWRpbmcsXG4gICAgICBwcmV2aWV3OiBjdXJyZW50UHJldmlldyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBzaWduYXR1cmU6IGN1cnJlbnRTaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogY3VycmVudFNpZ25hdHVyZUluZGV4LFxuICAgICAgdGltZXN0YW1wOiBjdXJyZW50VGltZXN0YW1wLFxuICAgICAgc291cmNlUGF0aCxcbiAgICAgIGZpbGVNdGltZSxcbiAgICAgIGVudHJ5SW5kZXg6IGN1cnJlbnRFbnRyeUluZGV4LFxuICAgIH0pO1xuICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBcIlwiO1xuICAgIGN1cnJlbnRBY3Rpb24gPSBcIlwiO1xuICAgIGN1cnJlbnRIZWFkaW5nID0gXCJcIjtcbiAgICBjdXJyZW50UHJldmlldyA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZSA9IFwiXCI7XG4gICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gMDtcbiAgICBjdXJyZW50RW50cnlJbmRleCArPSAxO1xuICB9O1xuXG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGhlYWRpbmdNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoZWFkaW5nTWF0Y2gpIHtcbiAgICAgIHB1c2hFbnRyeSgpO1xuICAgICAgY3VycmVudFRpbWVzdGFtcCA9IGhlYWRpbmdNYXRjaFsxXS50cmltKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb25NYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0FjdGlvbjpcXHMrKC4rKSQvaSk7XG4gICAgaWYgKGFjdGlvbk1hdGNoKSB7XG4gICAgICBjdXJyZW50QWN0aW9uID0gYWN0aW9uTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5ib3hNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK0luYm94OlxccysoLispJC9pKTtcbiAgICBpZiAoaW5ib3hNYXRjaCkge1xuICAgICAgY3VycmVudEhlYWRpbmcgPSBpbmJveE1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpZXdNYXRjaCA9IGxpbmUubWF0Y2goL14tXFxzK1ByZXZpZXc6XFxzKyguKykkL2kpO1xuICAgIGlmIChwcmV2aWV3TWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRQcmV2aWV3ID0gcHJldmlld01hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZU1hdGNoID0gbGluZS5tYXRjaCgvXi1cXHMrU2lnbmF0dXJlOlxccysoLispJC9pKTtcbiAgICBpZiAoc2lnbmF0dXJlTWF0Y2gpIHtcbiAgICAgIGN1cnJlbnRTaWduYXR1cmUgPSBkZWNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlTWF0Y2hbMV0udHJpbSgpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZUluZGV4TWF0Y2ggPSBsaW5lLm1hdGNoKC9eLVxccytTaWduYXR1cmUgaW5kZXg6XFxzKyguKykkL2kpO1xuICAgIGlmIChzaWduYXR1cmVJbmRleE1hdGNoKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQoc2lnbmF0dXJlSW5kZXhNYXRjaFsxXSwgMTApO1xuICAgICAgY3VycmVudFNpZ25hdHVyZUluZGV4ID0gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBwYXJzZWQgOiAwO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hFbnRyeSgpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gaXNVbmRlckZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIHBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXIgfHwgcGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJ9L2ApO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVSZXZpZXdTaWduYXR1cmUoc2lnbmF0dXJlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHNpZ25hdHVyZSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVJldmlld1NpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzaWduYXR1cmUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gc2lnbmF0dXJlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY29sbGFwc2VXaGl0ZXNwYWNlLCBmb3JtYXREYXRlVGltZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5LCBJbmJveEVudHJ5SWRlbnRpdHksIEluYm94U2VydmljZSB9IGZyb20gXCIuL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IEpvdXJuYWxTZXJ2aWNlIH0gZnJvbSBcIi4vam91cm5hbC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBUYXNrU2VydmljZSB9IGZyb20gXCIuL3Rhc2stc2VydmljZVwiO1xuaW1wb3J0IHsgUmV2aWV3TG9nRW50cnksIFJldmlld0xvZ1NlcnZpY2UgfSBmcm9tIFwiLi9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5ib3hTZXJ2aWNlOiBJbmJveFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZTogVGFza1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBqb3VybmFsU2VydmljZTogSm91cm5hbFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXZpZXdMb2dTZXJ2aWNlOiBSZXZpZXdMb2dTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGdldFJlY2VudEluYm94RW50cmllcyhsaW1pdCA9IDIwKTogUHJvbWlzZTxJbmJveEVudHJ5W10+IHtcbiAgICByZXR1cm4gdGhpcy5pbmJveFNlcnZpY2UuZ2V0UmVjZW50RW50cmllcyhsaW1pdCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9UYXNrKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0ZXh0ID0gZW50cnkuYm9keSB8fCBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmhlYWRpbmc7XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLnRhc2tTZXJ2aWNlLmFwcGVuZFRhc2sodGV4dCk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcInRhc2tcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwidGFza1wiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKFxuICAgICAgYFByb21vdGVkIGluYm94IGVudHJ5IHRvIHRhc2sgaW4gJHtzYXZlZC5wYXRofWAsXG4gICAgICBtYXJrZXJVcGRhdGVkLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBrZWVwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJrZWVwXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcImtlZXBcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcIktlcHQgaW5ib3ggZW50cnlcIiwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBza2lwRW50cnkoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChlbnRyeSwgXCJza2lwXCIpO1xuICAgIGNvbnN0IG1hcmtlclVwZGF0ZWQgPSBhd2FpdCB0aGlzLm1hcmtJbmJveFJldmlld2VkKGVudHJ5LCBcInNraXBcIik7XG4gICAgcmV0dXJuIHRoaXMuYXBwZW5kTWFya2VyTm90ZShcIlNraXBwZWQgaW5ib3ggZW50cnlcIiwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRUb0pvdXJuYWwoZW50cnk6IEluYm94RW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5qb3VybmFsU2VydmljZS5hcHBlbmRFbnRyeShcbiAgICAgIFtcbiAgICAgICAgYFNvdXJjZTogJHtlbnRyeS5oZWFkaW5nfWAsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBlbnRyeS5oZWFkaW5nLFxuICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGVudHJ5LCBcImpvdXJuYWxcIik7XG4gICAgY29uc3QgbWFya2VyVXBkYXRlZCA9IGF3YWl0IHRoaXMubWFya0luYm94UmV2aWV3ZWQoZW50cnksIFwiam91cm5hbFwiKTtcbiAgICByZXR1cm4gdGhpcy5hcHBlbmRNYXJrZXJOb3RlKGBBcHBlbmRlZCBpbmJveCBlbnRyeSB0byAke3NhdmVkLnBhdGh9YCwgbWFya2VyVXBkYXRlZCk7XG4gIH1cblxuICBhc3luYyBwcm9tb3RlVG9Ob3RlKGVudHJ5OiBJbmJveEVudHJ5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgbm90ZXNGb2xkZXIgPSBzZXR0aW5ncy5ub3Rlc0ZvbGRlcjtcbiAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVGb2xkZXIobm90ZXNGb2xkZXIpO1xuXG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLmJ1aWxkTm90ZVRpdGxlKGVudHJ5KTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IGAke2Zvcm1hdERhdGVUaW1lS2V5KG5vdykucmVwbGFjZSgvWzogXS9nLCBcIi1cIil9LSR7c2x1Z2lmeSh0aXRsZSl9Lm1kYDtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgoYCR7bm90ZXNGb2xkZXJ9LyR7ZmlsZW5hbWV9YCk7XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgIGAjICR7dGl0bGV9YCxcbiAgICAgIFwiXCIsXG4gICAgICBgQ3JlYXRlZDogJHtmb3JtYXREYXRlVGltZUtleShub3cpfWAsXG4gICAgICBcIlNvdXJjZTogQnJhaW4gaW5ib3hcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIk9yaWdpbmFsIGNhcHR1cmU6XCIsXG4gICAgICBlbnRyeS5ib2R5IHx8IGVudHJ5LnByZXZpZXcgfHwgZW50cnkuaGVhZGluZyxcbiAgICAgIFwiXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChwYXRoLCBjb250ZW50KTtcbiAgICBhd2FpdCB0aGlzLmFwcGVuZFJldmlld0xvZ0Jlc3RFZmZvcnQoZW50cnksIFwibm90ZVwiKTtcbiAgICBjb25zdCBtYXJrZXJVcGRhdGVkID0gYXdhaXQgdGhpcy5tYXJrSW5ib3hSZXZpZXdlZChlbnRyeSwgXCJub3RlXCIpO1xuICAgIHJldHVybiB0aGlzLmFwcGVuZE1hcmtlck5vdGUoYFByb21vdGVkIGluYm94IGVudHJ5IHRvIG5vdGUgaW4gJHtwYXRofWAsIG1hcmtlclVwZGF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgcmVvcGVuRnJvbVJldmlld0xvZyhlbnRyeTogUmV2aWV3TG9nRW50cnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGlkZW50aXR5ID0ge1xuICAgICAgaGVhZGluZzogZW50cnkuaGVhZGluZyxcbiAgICAgIGJvZHk6IFwiXCIsXG4gICAgICBwcmV2aWV3OiBlbnRyeS5wcmV2aWV3LFxuICAgICAgc2lnbmF0dXJlOiBlbnRyeS5zaWduYXR1cmUsXG4gICAgICBzaWduYXR1cmVJbmRleDogZW50cnkuc2lnbmF0dXJlSW5kZXgsXG4gICAgfTtcbiAgICBjb25zdCByZW9wZW5lZCA9IGF3YWl0IHRoaXMuaW5ib3hTZXJ2aWNlLnJlb3BlbkVudHJ5KGlkZW50aXR5KTtcbiAgICBpZiAoIXJlb3BlbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZS1vcGVuIGluYm94IGVudHJ5ICR7ZW50cnkuaGVhZGluZ31gKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5hcHBlbmRSZXZpZXdMb2dCZXN0RWZmb3J0KGlkZW50aXR5LCBcInJlb3BlblwiKTtcbiAgICByZXR1cm4gYFJlLW9wZW5lZCBpbmJveCBlbnRyeSAke2VudHJ5LmhlYWRpbmd9YDtcbiAgfVxuXG4gIGJ1aWxkTm90ZVRpdGxlKGVudHJ5OiBJbmJveEVudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBlbnRyeS5wcmV2aWV3IHx8IGVudHJ5LmJvZHkgfHwgZW50cnkuaGVhZGluZztcbiAgICBjb25zdCBsaW5lcyA9IGNhbmRpZGF0ZVxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsaW5lKSA9PiBjb2xsYXBzZVdoaXRlc3BhY2UobGluZSkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgY29uc3QgZmlyc3QgPSBsaW5lc1swXSA/PyBcIlVudGl0bGVkIG5vdGVcIjtcbiAgICByZXR1cm4gdHJpbVRpdGxlKGZpcnN0KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbWFya0luYm94UmV2aWV3ZWQoZW50cnk6IEluYm94RW50cnksIGFjdGlvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmluYm94U2VydmljZS5tYXJrRW50cnlSZXZpZXdlZChlbnRyeSwgYWN0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRNYXJrZXJOb3RlKG1lc3NhZ2U6IHN0cmluZywgbWFya2VyVXBkYXRlZDogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgcmV0dXJuIG1hcmtlclVwZGF0ZWQgPyBtZXNzYWdlIDogYCR7bWVzc2FnZX0gKHJldmlldyBtYXJrZXIgbm90IHVwZGF0ZWQpYDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwZW5kUmV2aWV3TG9nQmVzdEVmZm9ydChcbiAgICBlbnRyeTogSW5ib3hFbnRyeUlkZW50aXR5LFxuICAgIGFjdGlvbjogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZXZpZXdMb2dTZXJ2aWNlLmFwcGVuZFJldmlld0xvZyhlbnRyeSwgYWN0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLSt8LSskL2csIFwiXCIpXG4gICAgLnNsaWNlKDAsIDQ4KSB8fCBcIm5vdGVcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVRpdGxlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQubGVuZ3RoIDw9IDYwKSB7XG4gICAgcmV0dXJuIHRyaW1tZWQ7XG4gIH1cbiAgcmV0dXJuIGAke3RyaW1tZWQuc2xpY2UoMCwgNTcpLnRyaW1FbmQoKX0uLi5gO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHtcbiAgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeSxcbn0gZnJvbSBcIi4uL3V0aWxzL3RleHRcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVUaW1lS2V5LCBmb3JtYXRTdW1tYXJ5VGltZXN0YW1wIH0gZnJvbSBcIi4uL3V0aWxzL2RhdGVcIjtcbmltcG9ydCB7IGJ1aWxkRmFsbGJhY2tTdW1tYXJ5IH0gZnJvbSBcIi4uL3V0aWxzL3N1bW1hcnktZm9ybWF0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VtbWFyeVJlc3VsdCB7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgcGVyc2lzdGVkUGF0aD86IHN0cmluZztcbiAgdXNlZEFJOiBib29sZWFuO1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3VtbWFyeVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBnZW5lcmF0ZVN1bW1hcnkobG9va2JhY2tEYXlzPzogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8U3VtbWFyeVJlc3VsdD4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZWZmZWN0aXZlTG9va2JhY2tEYXlzID0gbG9va2JhY2tEYXlzID8/IHNldHRpbmdzLnN1bW1hcnlMb29rYmFja0RheXM7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNvbGxlY3RSZWNlbnRGaWxlcyhzZXR0aW5ncywgZWZmZWN0aXZlTG9va2JhY2tEYXlzKTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgam9pblJlY2VudEZpbGVzRm9yU3VtbWFyeShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgZmlsZXMsXG4gICAgICBzZXR0aW5ncy5zdW1tYXJ5TWF4Q2hhcnMsXG4gICAgKTtcblxuICAgIGxldCBzdW1tYXJ5ID0gYnVpbGRGYWxsYmFja1N1bW1hcnkoY29udGVudCk7XG4gICAgbGV0IHVzZWRBSSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmdzLmVuYWJsZUFJU3VtbWFyaWVzKSB7XG4gICAgICBpZiAoIXNldHRpbmdzLm9wZW5BSUFwaUtleS50cmltKCkgfHwgIXNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQUkgc3VtbWFyaWVzIGFyZSBlbmFibGVkIGJ1dCBPcGVuQUkgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHN1bW1hcnkgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5zdW1tYXJpemUoY29udGVudCB8fCBzdW1tYXJ5LCBzZXR0aW5ncyk7XG4gICAgICAgICAgdXNlZEFJID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gZmVsbCBiYWNrIHRvIGxvY2FsIHN1bW1hcnlcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGVyc2lzdGVkUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHRpdGxlID0gbGFiZWwgPyBgJHtsYWJlbH0gU3VtbWFyeWAgOiBcIlN1bW1hcnlcIjtcbiAgICBpZiAoc2V0dGluZ3MucGVyc2lzdFN1bW1hcmllcykge1xuICAgICAgY29uc3QgdGltZXN0YW1wID0gZm9ybWF0U3VtbWFyeVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcbiAgICAgIGNvbnN0IGZpbGVMYWJlbCA9IGxhYmVsID8gYCR7bGFiZWwudG9Mb3dlckNhc2UoKX0tJHt0aW1lc3RhbXB9YCA6IHRpbWVzdGFtcDtcbiAgICAgIGNvbnN0IHJlcXVlc3RlZFBhdGggPSBgJHtzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXJ9LyR7ZmlsZUxhYmVsfS5tZGA7XG4gICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgocmVxdWVzdGVkUGF0aCk7XG4gICAgICBjb25zdCBkaXNwbGF5VGltZXN0YW1wID0gZm9ybWF0RGF0ZVRpbWVLZXkobmV3IERhdGUoKSk7XG4gICAgICBjb25zdCBib2R5ID0gW1xuICAgICAgICBgIyAke3RpdGxlfSAke2Rpc3BsYXlUaW1lc3RhbXB9YCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgYCMjIFdpbmRvd2AsXG4gICAgICAgIGVmZmVjdGl2ZUxvb2tiYWNrRGF5cyA9PT0gMSA/IFwiVG9kYXlcIiA6IGBMYXN0ICR7ZWZmZWN0aXZlTG9va2JhY2tEYXlzfSBkYXlzYCxcbiAgICAgICAgXCJcIixcbiAgICAgICAgc3VtbWFyeS50cmltKCksXG4gICAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KHBhdGgsIGJvZHkpO1xuICAgICAgcGVyc2lzdGVkUGF0aCA9IHBhdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IHN1bW1hcnksXG4gICAgICBwZXJzaXN0ZWRQYXRoLFxuICAgICAgdXNlZEFJLFxuICAgICAgdGl0bGUsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdFJlY2VudEZpbGVzKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIGxvb2tiYWNrRGF5czogbnVtYmVyLFxuICApOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICBjb25zdCBjdXRvZmYgPSBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXMpLmdldFRpbWUoKTtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCk7XG4gICAgcmV0dXJuIGZpbGVzXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnN1bW1hcmllc0ZvbGRlcikpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiAhaXNVbmRlckZvbGRlcihmaWxlLnBhdGgsIHNldHRpbmdzLnJldmlld3NGb2xkZXIpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5zdGF0Lm10aW1lID49IGN1dG9mZilcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlckZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIHBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXIgfHwgcGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJ9L2ApO1xufVxuXG5mdW5jdGlvbiBnZXRXaW5kb3dTdGFydChsb29rYmFja0RheXM6IG51bWJlcik6IERhdGUge1xuICBjb25zdCBzYWZlRGF5cyA9IE1hdGgubWF4KDEsIGxvb2tiYWNrRGF5cyk7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgc3RhcnQuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gIHN0YXJ0LnNldERhdGUoc3RhcnQuZ2V0RGF0ZSgpIC0gKHNhZmVEYXlzIC0gMSkpO1xuICByZXR1cm4gc3RhcnQ7XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBidWlsZEZhbGxiYWNrU3VtbWFyeSB9IGZyb20gXCIuL3N1bW1hcnktZm9ybWF0XCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBqb2luUmVjZW50RmlsZXNGb3JTdW1tYXJ5KFxuICB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgZmlsZXM6IFRGaWxlW10sXG4gIG1heENoYXJzOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICAgICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBibG9jayA9IFtgLS0tICR7ZmlsZS5wYXRofWAsIHRyaW1tZWRdLmpvaW4oXCJcXG5cIik7XG4gICAgICBpZiAodG90YWwgKyBibG9jay5sZW5ndGggPiBtYXhDaGFycykge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSBNYXRoLm1heCgwLCBtYXhDaGFycyAtIHRvdGFsKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA+IDApIHtcbiAgICAgICAgICBwYXJ0cy5wdXNoKGJsb2NrLnNsaWNlKDAsIHJlbWFpbmluZykpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGJsb2NrKTtcbiAgICAgIHRvdGFsICs9IGJsb2NrLmxlbmd0aDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG59XG4iLCAiZnVuY3Rpb24gY2xlYW5TdW1tYXJ5TGluZSh0ZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICByZXR1cm4gKHRleHQgPz8gXCJcIikucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRMaXN0U2VjdGlvbihpdGVtczogU2V0PHN0cmluZz4sIGVtcHR5TWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFpdGVtcy5zaXplKSB7XG4gICAgcmV0dXJuIGAtICR7ZW1wdHlNZXNzYWdlfWA7XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlbXMpXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gJHtpdGVtfWApXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFRhc2tTZWN0aW9uKGl0ZW1zOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghaXRlbXMuc2l6ZSkge1xuICAgIHJldHVybiBcIi0gTm8gcmVjZW50IHRhc2tzIGZvdW5kLlwiO1xuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKGl0ZW1zKVxuICAgIC5zbGljZSgwLCA4KVxuICAgIC5tYXAoKGl0ZW0pID0+IGAtIFsgXSAke2l0ZW19YClcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmFsbGJhY2tTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGhpZ2hsaWdodHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGFza3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgZm9sbG93VXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltKCk7XG4gICAgaWYgKCFsaW5lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLS0tIFwiKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jezEsNn1cXHMrKC4rKSQvKTtcbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgaGlnaGxpZ2h0cy5hZGQoY2xlYW5TdW1tYXJ5TGluZShoZWFkaW5nWzFdKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gbGluZS5tYXRjaCgvXlstKitdXFxzK1xcWyggfHh8WClcXF1cXHMrKC4rKSQvKTtcbiAgICBpZiAodGFzaykge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUodGFza1syXSk7XG4gICAgICB0YXNrcy5hZGQodGV4dCk7XG4gICAgICBmb2xsb3dVcHMuYWRkKHRleHQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXlstKitdXFxzKyg/IVxcWyggfHh8WClcXF1cXHMrKSguKykkLyk7XG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgY29uc3QgdGV4dCA9IGNsZWFuU3VtbWFyeUxpbmUoYnVsbGV0WzFdKTtcbiAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIGhpZ2hsaWdodHMuYWRkKHRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGhpZ2hsaWdodHMuc2l6ZSA8IDUgJiYgbGluZS5sZW5ndGggPD0gMTQwKSB7XG4gICAgICBoaWdobGlnaHRzLmFkZChjbGVhblN1bW1hcnlMaW5lKGxpbmUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW1xuICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgIGZvcm1hdExpc3RTZWN0aW9uKGhpZ2hsaWdodHMsIFwiTm8gcmVjZW50IG5vdGVzIGZvdW5kLlwiKSxcbiAgICBcIlwiLFxuICAgIFwiIyMgVGFza3NcIixcbiAgICBmb3JtYXRUYXNrU2VjdGlvbih0YXNrcyksXG4gICAgXCJcIixcbiAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICBmb3JtYXRMaXN0U2VjdGlvbihmb2xsb3dVcHMsIFwiTm90aGluZyBwZW5kaW5nIGZyb20gcmVjZW50IG5vdGVzLlwiKSxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGNvbGxhcHNlV2hpdGVzcGFjZSwgZm9ybWF0RGF0ZVRpbWVLZXkgfSBmcm9tIFwiLi4vdXRpbHMvZGF0ZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgY2xhc3MgVGFza1NlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGFwcGVuZFRhc2sodGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY29sbGFwc2VXaGl0ZXNwYWNlKHRleHQpO1xuICAgIGlmICghY2xlYW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGFzayB0ZXh0IGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9jayA9IGAtIFsgXSAke2NsZWFuZWR9IF8oYWRkZWQgJHtmb3JtYXREYXRlVGltZUtleShuZXcgRGF0ZSgpKX0pX2A7XG4gICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChzZXR0aW5ncy50YXNrc0ZpbGUsIGJsb2NrKTtcbiAgICByZXR1cm4geyBwYXRoOiBzZXR0aW5ncy50YXNrc0ZpbGUgfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IHJlcXVlc3RVcmwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVN1bW1hcnkgfSBmcm9tIFwiLi4vdXRpbHMvc3VtbWFyeS1ub3JtYWxpemVcIjtcblxudHlwZSBSb3V0ZUxhYmVsID0gXCJub3RlXCIgfCBcInRhc2tcIiB8IFwiam91cm5hbFwiIHwgbnVsbDtcblxuaW50ZXJmYWNlIENoYXRDb21wbGV0aW9uQ2hvaWNlIHtcbiAgbWVzc2FnZT86IHtcbiAgICBjb250ZW50Pzogc3RyaW5nO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQ2hhdENvbXBsZXRpb25SZXNwb25zZSB7XG4gIGNob2ljZXM/OiBDaGF0Q29tcGxldGlvbkNob2ljZVtdO1xufVxuXG5leHBvcnQgY2xhc3MgQnJhaW5BSVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgYXN5bmMgc3VtbWFyaXplKHRleHQ6IHN0cmluZywgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIllvdSBzdW1tYXJpemUgbWFya2Rvd24gdmF1bHQgY29udGVudC4gUmVzcG9uZCB3aXRoIGNvbmNpc2UgbWFya2Rvd24gdXNpbmcgdGhlIHJlcXVlc3RlZCBzZWN0aW9ucyBvbmx5LlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICBcIlN1bW1hcml6ZSB0aGUgZm9sbG93aW5nIHZhdWx0IGNvbnRlbnQgaW50byBleGFjdGx5IHRoZXNlIHNlY3Rpb25zOlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCJCZSBjb25jaXNlLCBkbyBub3QgaW52ZW50IGZhY3RzLCBhbmQgcHJlc2VydmUgYWN0aW9uYWJsZSB0YXNrcy5cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHRleHQsXG4gICAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICAgIH0sXG4gICAgXSk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplU3VtbWFyeShyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyByb3V0ZVRleHQodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8Um91dGVMYWJlbD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wb3N0Q2hhdENvbXBsZXRpb24oc2V0dGluZ3MsIFtcbiAgICAgIHtcbiAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgY29udGVudDpcbiAgICAgICAgICBcIkNsYXNzaWZ5IGNhcHR1cmUgdGV4dCBpbnRvIGV4YWN0bHkgb25lIG9mOiBub3RlLCB0YXNrLCBqb3VybmFsLiBSZXR1cm4gb25lIHdvcmQgb25seS5cIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgXCJDbGFzc2lmeSB0aGUgZm9sbG93aW5nIHVzZXIgaW5wdXQgYXMgZXhhY3RseSBvbmUgb2Y6XCIsXG4gICAgICAgICAgXCJub3RlXCIsXG4gICAgICAgICAgXCJ0YXNrXCIsXG4gICAgICAgICAgXCJqb3VybmFsXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIlJldHVybiBvbmx5IG9uZSB3b3JkLlwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIGNvbnN0IGNsZWFuZWQgPSByZXNwb25zZS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY2xlYW5lZCA9PT0gXCJub3RlXCIgfHwgY2xlYW5lZCA9PT0gXCJ0YXNrXCIgfHwgY2xlYW5lZCA9PT0gXCJqb3VybmFsXCIpIHtcbiAgICAgIHJldHVybiBjbGVhbmVkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcG9zdENoYXRDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghc2V0dGluZ3Mub3BlbkFJQXBpS2V5LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3BlbkFJIEFQSSBrZXkgaXMgbWlzc2luZ1wiKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxL2NoYXQvY29tcGxldGlvbnNcIixcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtzZXR0aW5ncy5vcGVuQUlBcGlLZXkudHJpbSgpfWAsXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbW9kZWw6IHNldHRpbmdzLm9wZW5BSU1vZGVsLnRyaW0oKSxcbiAgICAgICAgbWVzc2FnZXMsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjIsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGpzb24gPSByZXN1bHQuanNvbiBhcyBDaGF0Q29tcGxldGlvblJlc3BvbnNlO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBqc29uLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCA/PyBcIlwiO1xuICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5BSSByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdHJpbW1lZCA9IGNvbnRlbnQudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCIjIyBIaWdobGlnaHRzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIFRhc2tzXCIsXG4gICAgICBcIk5vIHN1bW1hcnkgY29udGVudCByZXR1cm5lZC5cIixcbiAgICAgIFwiXCIsXG4gICAgICBcIiMjIEZvbGxvdy11cHNcIixcbiAgICAgIFwiTm8gc3VtbWFyeSBjb250ZW50IHJldHVybmVkLlwiLFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlU3VtbWFyeVNlY3Rpb25zKHRyaW1tZWQpO1xuICBpZiAocGFyc2VkKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiIyMgSGlnaGxpZ2h0c1wiLFxuICAgICAgcGFyc2VkLmhpZ2hsaWdodHMgfHwgXCJObyBzdW1tYXJ5IGNvbnRlbnQgcmV0dXJuZWQuXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCIjIyBUYXNrc1wiLFxuICAgICAgcGFyc2VkLnRhc2tzIHx8IFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiIyMgRm9sbG93LXVwc1wiLFxuICAgICAgcGFyc2VkLmZvbGxvd1VwcyB8fCBcIlJldmlldyByZWNlbnQgbm90ZXMuXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBcIiMjIEhpZ2hsaWdodHNcIixcbiAgICB0cmltbWVkLFxuICAgIFwiXCIsXG4gICAgXCIjIyBUYXNrc1wiLFxuICAgIFwiTm8gdGFza3MgZXh0cmFjdGVkLlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBGb2xsb3ctdXBzXCIsXG4gICAgXCJSZXZpZXcgcmVjZW50IG5vdGVzLlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3VtbWFyeVNlY3Rpb25zKGNvbnRlbnQ6IHN0cmluZyk6IHtcbiAgaGlnaGxpZ2h0czogc3RyaW5nO1xuICB0YXNrczogc3RyaW5nO1xuICBmb2xsb3dVcHM6IHN0cmluZztcbn0gfCBudWxsIHtcbiAgY29uc3Qgc2VjdGlvbkxpbmVzOiBSZWNvcmQ8XCJIaWdobGlnaHRzXCIgfCBcIlRhc2tzXCIgfCBcIkZvbGxvdy11cHNcIiwgc3RyaW5nW10+ID0ge1xuICAgIEhpZ2hsaWdodHM6IFtdLFxuICAgIFRhc2tzOiBbXSxcbiAgICBcIkZvbGxvdy11cHNcIjogW10sXG4gIH07XG4gIGNvbnN0IHByZWFtYmxlTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgbGV0IGN1cnJlbnRTZWN0aW9uOiBrZXlvZiB0eXBlb2Ygc2VjdGlvbkxpbmVzIHwgbnVsbCA9IG51bGw7XG4gIGxldCBzYXdIZWFkaW5nID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIGNvbnRlbnQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL14jI1xccysoSGlnaGxpZ2h0c3xUYXNrc3xGb2xsb3ctdXBzKVxccyokL2kpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjdXJyZW50U2VjdGlvbiA9IGNhbm9uaWNhbFNlY3Rpb25OYW1lKGhlYWRpbmdbMV0pO1xuICAgICAgc2F3SGVhZGluZyA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSkge1xuICAgICAgICBwcmVhbWJsZUxpbmVzLnB1c2gobGluZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24pIHtcbiAgICAgIHNlY3Rpb25MaW5lc1tjdXJyZW50U2VjdGlvbl0ucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNhd0hlYWRpbmcpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGlnaGxpZ2h0czogdHJpbVNlY3Rpb24oWy4uLnByZWFtYmxlTGluZXMsIC4uLnNlY3Rpb25MaW5lcy5IaWdobGlnaHRzXSksXG4gICAgdGFza3M6IHRyaW1TZWN0aW9uKHNlY3Rpb25MaW5lcy5UYXNrcyksXG4gICAgZm9sbG93VXBzOiB0cmltU2VjdGlvbihzZWN0aW9uTGluZXNbXCJGb2xsb3ctdXBzXCJdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsU2VjdGlvbk5hbWUoc2VjdGlvbjogc3RyaW5nKToga2V5b2Yge1xuICBIaWdobGlnaHRzOiBzdHJpbmdbXTtcbiAgVGFza3M6IHN0cmluZ1tdO1xuICBcIkZvbGxvdy11cHNcIjogc3RyaW5nW107XG59IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHNlY3Rpb24udG9Mb3dlckNhc2UoKTtcbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwidGFza3NcIikge1xuICAgIHJldHVybiBcIlRhc2tzXCI7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiZm9sbG93LXVwc1wiKSB7XG4gICAgcmV0dXJuIFwiRm9sbG93LXVwc1wiO1xuICB9XG4gIHJldHVybiBcIkhpZ2hsaWdodHNcIjtcbn1cblxuZnVuY3Rpb24gdHJpbVNlY3Rpb24obGluZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIikudHJpbSgpO1xufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgVEFic3RyYWN0RmlsZSxcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZUtleSB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLmpvdXJuYWxGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLm5vdGVzRm9sZGVyKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihzZXR0aW5ncy5zdW1tYXJpZXNGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHNldHRpbmdzLnJldmlld3NGb2xkZXIpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihzZXR0aW5ncy5pbmJveEZpbGUpKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIoc2V0dGluZ3MudGFza3NGaWxlKSk7XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoY3VycmVudCk7XG4gICAgICB9IGVsc2UgaWYgKCEoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmb2xkZXI6ICR7Y3VycmVudH1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGluaXRpYWxDb250ZW50ID0gXCJcIik6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIHJldHVybiBleGlzdGluZztcbiAgICB9XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmaWxlOiAke25vcm1hbGl6ZWR9YCk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKG5vcm1hbGl6ZWQpKTtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vcm1hbGl6ZWQsIGluaXRpYWxDb250ZW50KTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgY29uc3Qgc2VwYXJhdG9yID0gY3VycmVudC5sZW5ndGggPT09IDBcbiAgICAgID8gXCJcIlxuICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXFxuXCIpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICAgICAgICA/IFwiXFxuXCJcbiAgICAgICAgICA6IFwiXFxuXFxuXCI7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAke2N1cnJlbnR9JHtzZXBhcmF0b3J9JHtub3JtYWxpemVkQ29udGVudH1gKTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBub3JtYWxpemVkQ29udGVudCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBlbnN1cmVVbmlxdWVGaWxlUGF0aChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIGNvbnN0IGRvdEluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdEluZGV4ID09PSAtMSA/IG5vcm1hbGl6ZWQgOiBub3JtYWxpemVkLnNsaWNlKDAsIGRvdEluZGV4KTtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3RJbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZShkb3RJbmRleCk7XG5cbiAgICBsZXQgY291bnRlciA9IDI7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7Y291bnRlcn0ke2V4dGVuc2lvbn1gO1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY2FuZGlkYXRlKSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgICAgY291bnRlciArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFwcGVuZEpvdXJuYWxIZWFkZXIoZmlsZVBhdGg6IHN0cmluZywgZGF0ZUtleTogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgsIGAjICR7ZGF0ZUtleX1cXG5cXG5gKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCMgJHtkYXRlS2V5fVxcblxcbmApO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50Rm9sZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gIGNvbnN0IGluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIik7XG4gIHJldHVybiBpbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyB0cmltVHJhaWxpbmdOZXdsaW5lcyB9IGZyb20gXCIuLi91dGlscy9kYXRlXCI7XG5cbmludGVyZmFjZSBQcm9tcHRNb2RhbE9wdGlvbnMge1xuICB0aXRsZTogc3RyaW5nO1xuICBwbGFjZWhvbGRlcj86IHN0cmluZztcbiAgc3VibWl0TGFiZWw/OiBzdHJpbmc7XG4gIG11bHRpbGluZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBQcm9tcHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlITogKHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldHRsZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogUHJvbXB0TW9kYWxPcHRpb25zKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9wZW5Qcm9tcHQoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiB0aGlzLm9wdGlvbnMudGl0bGUgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLm11bHRpbGluZSkge1xuICAgICAgY29uc3QgdGV4dGFyZWEgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dFwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciA/PyBcIlwiLFxuICAgICAgICAgIHJvd3M6IFwiOFwiLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICB0ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkpKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2b2lkIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnB1dEVsID0gdGV4dGFyZWE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlucHV0ID0gY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXRcIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgPz8gXCJcIixcbiAgICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5wdXRFbCA9IGlucHV0O1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRFbC5mb2N1cygpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dCh0aGlzLm9wdGlvbnMuc3VibWl0TGFiZWwgPz8gXCJTdWJtaXRcIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJDYW5jZWxcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMuc2V0dGxlZCkge1xuICAgICAgdGhpcy5maW5pc2gobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzdWJtaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmltVHJhaWxpbmdOZXdsaW5lcyh0aGlzLmlucHV0RWwudmFsdWUpLnRyaW0oKTtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5maW5pc2godmFsdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5pc2godmFsdWU6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0bGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0dGxlZCA9IHRydWU7XG4gICAgdGhpcy5yZXNvbHZlKHZhbHVlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlc3VsdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRpdGxlVGV4dDogc3RyaW5nLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYm9keVRleHQ6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IHRoaXMudGl0bGVUZXh0IH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICB0ZXh0OiB0aGlzLmJvZHlUZXh0LFxuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBJbmJveEVudHJ5IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2luYm94LXNlcnZpY2VcIjtcbmltcG9ydCB7IFJldmlld1NlcnZpY2UgfSBmcm9tIFwiLi4vc2VydmljZXMvcmV2aWV3LXNlcnZpY2VcIjtcblxudHlwZSBSZXZpZXdBY3Rpb24gPSBcImtlZXBcIiB8IFwidGFza1wiIHwgXCJqb3VybmFsXCIgfCBcIm5vdGVcIiB8IFwic2tpcFwiO1xuXG5leHBvcnQgY2xhc3MgSW5ib3hSZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBjdXJyZW50SW5kZXggPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IGhhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0LnRhZ05hbWUgPT09IFwiSU5QVVRcIiB8fCB0YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGtleVRvQWN0aW9uKGV2ZW50LmtleSk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IEluYm94RW50cnlbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJldmlld1NlcnZpY2U6IFJldmlld1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvbkFjdGlvbkNvbXBsZXRlPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJQcm9jZXNzIEluYm94XCIgfSk7XG5cbiAgICBpZiAoIXRoaXMuZW50cmllcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gaW5ib3ggZW50cmllcyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgdGV4dDogYEVudHJ5ICR7dGhpcy5jdXJyZW50SW5kZXggKyAxfSBvZiAke3RoaXMuZW50cmllcy5sZW5ndGh9YCxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHtcbiAgICAgIHRleHQ6IGVudHJ5LmhlYWRpbmcgfHwgXCJVbnRpdGxlZCBlbnRyeVwiLFxuICAgIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1yZXN1bHRcIixcbiAgICAgIHRleHQ6IGVudHJ5LmJvZHkgfHwgZW50cnkucHJldmlldyB8fCBcIihlbXB0eSBlbnRyeSlcIixcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJDaG9vc2UgYW4gYWN0aW9uIGZvciB0aGlzIGVudHJ5LiBTaG9ydGN1dHM6IGsga2VlcCwgdCB0YXNrLCBqIGpvdXJuYWwsIG4gbm90ZSwgcyBza2lwLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9uUm93ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJLZWVwIGluIGluYm94XCIsIFwia2VlcFwiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQ29udmVydCB0byB0YXNrXCIsIFwidGFza1wiKTtcbiAgICB0aGlzLmFkZEJ1dHRvbihidXR0b25Sb3csIFwiQXBwZW5kIHRvIGpvdXJuYWxcIiwgXCJqb3VybmFsXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJQcm9tb3RlIHRvIG5vdGVcIiwgXCJub3RlXCIpO1xuICAgIHRoaXMuYWRkQnV0dG9uKGJ1dHRvblJvdywgXCJTa2lwXCIsIFwic2tpcFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQnV0dG9uKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogUmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogYWN0aW9uID09PSBcIm5vdGVcIiA/IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIgOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogbGFiZWwsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVBY3Rpb24oYWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlQWN0aW9uKGFjdGlvbjogUmV2aWV3QWN0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICAgICAgaWYgKGFjdGlvbiA9PT0gXCJ0YXNrXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9UYXNrKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImpvdXJuYWxcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmFwcGVuZFRvSm91cm5hbChlbnRyeSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMucmV2aWV3U2VydmljZS5wcm9tb3RlVG9Ob3RlKGVudHJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImtlZXBcIikge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLmtlZXBFbnRyeShlbnRyeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlID0gYXdhaXQgdGhpcy5yZXZpZXdTZXJ2aWNlLnNraXBFbnRyeShlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLm9uQWN0aW9uQ29tcGxldGUpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLm9uQWN0aW9uQ29tcGxldGUobWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY3VycmVudEluZGV4ICs9IDE7XG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA+PSB0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJJbmJveCByZXZpZXcgY29tcGxldGVcIik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcHJvY2VzcyBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24ga2V5VG9BY3Rpb24oa2V5OiBzdHJpbmcpOiBSZXZpZXdBY3Rpb24gfCBudWxsIHtcbiAgc3dpdGNoIChrZXkudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgXCJrXCI6XG4gICAgICByZXR1cm4gXCJrZWVwXCI7XG4gICAgY2FzZSBcInRcIjpcbiAgICAgIHJldHVybiBcInRhc2tcIjtcbiAgICBjYXNlIFwialwiOlxuICAgICAgcmV0dXJuIFwiam91cm5hbFwiO1xuICAgIGNhc2UgXCJuXCI6XG4gICAgICByZXR1cm4gXCJub3RlXCI7XG4gICAgY2FzZSBcInNcIjpcbiAgICAgIHJldHVybiBcInNraXBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBSZXZpZXdMb2dFbnRyeSB9IGZyb20gXCIuLi9zZXJ2aWNlcy9yZXZpZXctbG9nLXNlcnZpY2VcIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgUmV2aWV3SGlzdG9yeU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IFJldmlld0xvZ0VudHJ5W10sXG4gICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgSGlzdG9yeVwiIH0pO1xuXG4gICAgaWYgKCF0aGlzLmVudHJpZXMubGVuZ3RoKSB7XG4gICAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyByZXZpZXcgbG9ncyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiT3BlbiBhIGxvZyB0byBpbnNwZWN0IGl0LCBvciByZS1vcGVuIGFuIGluYm94IGl0ZW0gaWYgaXQgd2FzIG1hcmtlZCBpbmNvcnJlY3RseS5cIixcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5lbnRyaWVzKSB7XG4gICAgICBjb25zdCByb3cgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHsgY2xzOiBcImJyYWluLXNlY3Rpb25cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogZW50cnkuaGVhZGluZyB8fCBcIlVudGl0bGVkIGl0ZW1cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICB0ZXh0OiBgJHtlbnRyeS50aW1lc3RhbXB9IFx1MjAyMiAke2VudHJ5LmFjdGlvbn1gLFxuICAgICAgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tcmVzdWx0XCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LnByZXZpZXcgfHwgXCIoZW1wdHkgcHJldmlldylcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidXR0b25zID0gcm93LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICAgIHRleHQ6IFwiT3BlbiBsb2dcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuTG9nKGVudHJ5LnNvdXJjZVBhdGgpO1xuICAgICAgfSk7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgICB0ZXh0OiBcIlJlLW9wZW5cIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5yZW9wZW5FbnRyeShlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Mb2cocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHJldmlldyBsb2dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKSA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiByZXZpZXcgbG9nXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoYWJzdHJhY3RGaWxlKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVvcGVuRW50cnkoZW50cnk6IFJldmlld0xvZ0VudHJ5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnBsdWdpbi5yZW9wZW5SZXZpZXdFbnRyeShlbnRyeSk7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgcmUtb3BlbiBpbmJveCBlbnRyeVwiKTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBJdGVtVmlldywgTm90aWNlLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IFByb21wdE1vZGFsIH0gZnJvbSBcIi4vcHJvbXB0LW1vZGFsc1wiO1xuXG5leHBvcnQgY29uc3QgQlJBSU5fVklFV19UWVBFID0gXCJicmFpbi1zaWRlYmFyLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2lkZWJhclZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gIHByaXZhdGUgcmVzdWx0RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzdW1tYXJ5RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBpbmJveENvdW50RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSB0YXNrQ291bnRFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHJldmlld0hpc3RvcnlFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGFpU3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzdW1tYXJ5U3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSQUlOX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQnJhaW5cIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpblwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1zaWRlYmFyXCIpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIlF1aWNrIGNhcHR1cmUsIGRhaWx5IGpvdXJuYWxpbmcsIGFuZCBsaWdodHdlaWdodCBzdW1tYXJpZXMuXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmNyZWF0ZUNhcHR1cmVTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVSZXZpZXdTZWN0aW9uKCk7XG4gICAgdGhpcy5jcmVhdGVBaVNlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZVN0YXR1c1NlY3Rpb24oKTtcbiAgICB0aGlzLmNyZWF0ZU91dHB1dFNlY3Rpb24oKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgc2V0TGFzdFJlc3VsdCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnJlc3VsdEVsLnNldFRleHQodGV4dCk7XG4gIH1cblxuICBzZXRMYXN0U3VtbWFyeSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnN1bW1hcnlFbC5zZXRUZXh0KHRleHQpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pbmJveENvdW50RWwpIHtcbiAgICAgIGNvbnN0IGluYm94Q291bnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRJbmJveENvdW50KCk7XG4gICAgICB0aGlzLmluYm94Q291bnRFbC5zZXRUZXh0KGAke2luYm94Q291bnR9IHJlY2VudCBlbnRyaWVzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnRhc2tDb3VudEVsKSB7XG4gICAgICBjb25zdCB0YXNrQ291bnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRPcGVuVGFza0NvdW50KCk7XG4gICAgICB0aGlzLnRhc2tDb3VudEVsLnNldFRleHQoYCR7dGFza0NvdW50fSBvcGVuIHRhc2tzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnJldmlld0hpc3RvcnlFbCkge1xuICAgICAgY29uc3QgcmV2aWV3Q291bnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRSZXZpZXdIaXN0b3J5Q291bnQoKTtcbiAgICAgIHRoaXMucmV2aWV3SGlzdG9yeUVsLnNldFRleHQoYFJldmlldyBoaXN0b3J5OiAke3Jldmlld0NvdW50fSBsb2dzYCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmFpU3RhdHVzRWwpIHtcbiAgICAgIHRoaXMuYWlTdGF0dXNFbC5zZXRUZXh0KHRoaXMucGx1Z2luLmdldEFpU3RhdHVzVGV4dCgpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3VtbWFyeVN0YXR1c0VsKSB7XG4gICAgICB0aGlzLnN1bW1hcnlTdGF0dXNFbC5zZXRUZXh0KHRoaXMucGx1Z2luLmdldExhc3RTdW1tYXJ5TGFiZWwoKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDYXB0dXJlU2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJRdWljayBDYXB0dXJlXCIgfSk7XG5cbiAgICB0aGlzLmlucHV0RWwgPSBzZWN0aW9uLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNhcHR1cmUtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiVHlwZSBhIG5vdGUsIHRhc2ssIG9yIGpvdXJuYWwgZW50cnkuLi5cIixcbiAgICAgICAgcm93czogXCI4XCIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJTYXZlIGFzIE5vdGVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVBc05vdGUoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiU2F2ZSBhcyBUYXNrXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zYXZlQXNUYXNrKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIlNhdmUgYXMgSm91cm5hbFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuc2F2ZUFzSm91cm5hbCgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDbGVhclwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgICAgbmV3IE5vdGljZShcIkNhcHR1cmUgY2xlYXJlZFwiKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmV2aWV3U2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJSZXZpZXdcIiB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBzZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiUHJvY2VzcyBJbmJveFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnByb2Nlc3NJbmJveCgpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJPcGVuIFRvZGF5J3MgSm91cm5hbFwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5Ub2RheXNKb3VybmFsKCk7XG4gICAgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIlN1bW1hcml6ZSBUb2RheVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdygxLCBcIlRvZGF5XCIpO1xuICAgIH0pO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJTdW1tYXJpemUgV2Vla1wiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmdlbmVyYXRlU3VtbWFyeUZvcldpbmRvdyg3LCBcIldlZWtcIik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUFpU2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJBSSBBY3Rpb25zXCIgfSk7XG5cbiAgICBjb25zdCBidXR0b25zID0gc2VjdGlvbi5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIlN1bW1hcml6ZVwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuZ2VuZXJhdGVTdW1tYXJ5KCk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQUlSb3V0aW5nKSB7XG4gICAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgICB0ZXh0OiBcIkF1dG8tcm91dGVcIixcbiAgICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5hdXRvUm91dGUoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdHVzU2VjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJzZWN0aW9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdGF0dXNcIiB9KTtcblxuICAgIGNvbnN0IGluYm94Um93ID0gc2VjdGlvbi5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIkluYm94OiBsb2FkaW5nLi4uXCIgfSk7XG4gICAgdGhpcy5pbmJveENvdW50RWwgPSBpbmJveFJvdztcblxuICAgIGNvbnN0IHRhc2tSb3cgPSBzZWN0aW9uLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiVGFza3M6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICB0aGlzLnRhc2tDb3VudEVsID0gdGFza1JvdztcblxuICAgIGNvbnN0IHJldmlld1JvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc3RhdHVzLXJvd1wiIH0pO1xuICAgIHRoaXMucmV2aWV3SGlzdG9yeUVsID0gcmV2aWV3Um93LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiUmV2aWV3IGhpc3Rvcnk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICByZXZpZXdSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgIHRleHQ6IFwiT3BlblwiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXZpZXdIaXN0b3J5KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBhaVJvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJBSTogbG9hZGluZy4uLlwiIH0pO1xuICAgIHRoaXMuYWlTdGF0dXNFbCA9IGFpUm93O1xuXG4gICAgY29uc3Qgc3VtbWFyeVJvdyA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJMYXN0IHN1bW1hcnk6IGxvYWRpbmcuLi5cIiB9KTtcbiAgICB0aGlzLnN1bW1hcnlTdGF0dXNFbCA9IHN1bW1hcnlSb3c7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZU91dHB1dFNlY3Rpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwic2VjdGlvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiT3V0cHV0XCIgfSk7XG5cbiAgICBzZWN0aW9uLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkxhc3QgUmVzdWx0XCIgfSk7XG4gICAgdGhpcy5yZXN1bHRFbCA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW91dHB1dFwiLFxuICAgICAgdGV4dDogXCJObyByZWNlbnQgYWN0aW9uLlwiLFxuICAgIH0pO1xuXG4gICAgc2VjdGlvbi5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJMYXN0IFN1bW1hcnlcIiB9KTtcbiAgICB0aGlzLnN1bW1hcnlFbCA9IHNlY3Rpb24uY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW91dHB1dFwiLFxuICAgICAgdGV4dDogXCJObyBzdW1tYXJ5IGdlbmVyYXRlZCB5ZXQuXCIsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc05vdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgbm90ZVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc1Rhc2soKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlVGFzayh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgdGFza1wiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBc0pvdXJuYWwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICh0ZXh0KSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlSm91cm5hbCh0ZXh0KSxcbiAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlU3VtbWFyeSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4uc3VtbWFyaXplTm93KCk7XG4gICAgICB0aGlzLnN1bW1hcnlFbC5zZXRUZXh0KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIHRoaXMuc2V0TGFzdFJlc3VsdChcbiAgICAgICAgcmVzdWx0LnVzZWRBSSA/IFwiQUkgc3VtbWFyeSBnZW5lcmF0ZWRcIiA6IFwiTG9jYWwgc3VtbWFyeSBnZW5lcmF0ZWRcIixcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIkNvdWxkIG5vdCBnZW5lcmF0ZSBzdW1tYXJ5XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXV0b1JvdXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIGlmICghdGV4dCkge1xuICAgICAgbmV3IE5vdGljZShcIkVudGVyIHNvbWUgdGV4dCBmaXJzdC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgdGhpcy5wbHVnaW4ucm91dGVUZXh0KHRleHQpO1xuICAgICAgaWYgKCFyb3V0ZSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiQnJhaW4gY291bGQgbm90IGNsYXNzaWZ5IHRoYXQgZW50cnlcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChyb3V0ZSA9PT0gXCJub3RlXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlQ2FwdHVyZShcbiAgICAgICAgICAoKSA9PiB0aGlzLnBsdWdpbi5jYXB0dXJlTm90ZSh0ZXh0KSxcbiAgICAgICAgICBcIkNvdWxkIG5vdCBzYXZlIG5vdGVcIixcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAocm91dGUgPT09IFwidGFza1wiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUNhcHR1cmUoXG4gICAgICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uY2FwdHVyZVRhc2sodGV4dCksXG4gICAgICAgICAgXCJDb3VsZCBub3Qgc2F2ZSB0YXNrXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVDYXB0dXJlKFxuICAgICAgICAgICgpID0+IHRoaXMucGx1Z2luLmNhcHR1cmVKb3VybmFsKHRleHQpLFxuICAgICAgICAgIFwiQ291bGQgbm90IHNhdmUgam91cm5hbCBlbnRyeVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDb3VsZCBub3QgYXV0by1yb3V0ZSBjYXB0dXJlXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNhcHR1cmUoXG4gICAgYWN0aW9uOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4sXG4gICAgZmFpbHVyZU1lc3NhZ2U6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiRW50ZXIgc29tZSB0ZXh0IGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWN0aW9uKHRleHQpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVwb3J0QWN0aW9uUmVzdWx0KHJlc3VsdCk7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoZmFpbHVyZU1lc3NhZ2UpO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQTZDOzs7QUNvQnRDLElBQU0seUJBQThDO0FBQUEsRUFDekQsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsYUFBYTtBQUFBLEVBQ2IsaUJBQWlCO0FBQUEsRUFDakIsZUFBZTtBQUFBLEVBQ2YsbUJBQW1CO0FBQUEsRUFDbkIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IscUJBQXFCO0FBQUEsRUFDckIsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQ3BCO0FBRU8sU0FBUyx1QkFDZCxPQUNxQjtBQUNyQixRQUFNLFNBQThCO0FBQUEsSUFDbEMsR0FBRztBQUFBLElBQ0gsR0FBRztBQUFBLEVBQ0w7QUFFQSxTQUFPO0FBQUEsSUFDTCxXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixXQUFXLHNCQUFzQixPQUFPLFdBQVcsdUJBQXVCLFNBQVM7QUFBQSxJQUNuRixlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsTUFDUCx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLElBQ0EsYUFBYTtBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGlCQUFpQjtBQUFBLE1BQ2YsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxtQkFBbUIsUUFBUSxPQUFPLGlCQUFpQjtBQUFBLElBQ25ELGlCQUFpQixRQUFRLE9BQU8sZUFBZTtBQUFBLElBQy9DLGNBQWMsT0FBTyxPQUFPLGlCQUFpQixXQUFXLE9BQU8sYUFBYSxLQUFLLElBQUk7QUFBQSxJQUNyRixhQUNFLE9BQU8sT0FBTyxnQkFBZ0IsWUFBWSxPQUFPLFlBQVksS0FBSyxJQUM5RCxPQUFPLFlBQVksS0FBSyxJQUN4Qix1QkFBdUI7QUFBQSxJQUM3QixxQkFBcUIsYUFBYSxPQUFPLHFCQUFxQixHQUFHLEtBQUssdUJBQXVCLG1CQUFtQjtBQUFBLElBQ2hILGlCQUFpQixhQUFhLE9BQU8saUJBQWlCLEtBQU0sS0FBUSx1QkFBdUIsZUFBZTtBQUFBLElBQzFHLGtCQUFrQixRQUFRLE9BQU8sZ0JBQWdCO0FBQUEsRUFDbkQ7QUFDRjtBQUVBLFNBQVMsc0JBQXNCLE9BQWdCLFVBQTBCO0FBQ3ZFLE1BQUksT0FBTyxVQUFVLFVBQVU7QUFDN0IsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLGFBQWEsTUFBTSxLQUFLLEVBQUUsUUFBUSxRQUFRLEVBQUUsRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0RSxTQUFPLGNBQWM7QUFDdkI7QUFFQSxTQUFTLGFBQ1AsT0FDQSxLQUNBLEtBQ0EsVUFDUTtBQUNSLE1BQUksT0FBTyxVQUFVLFlBQVksT0FBTyxVQUFVLEtBQUssR0FBRztBQUN4RCxXQUFPLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssQ0FBQztBQUFBLEVBQzNDO0FBRUEsTUFBSSxPQUFPLFVBQVUsVUFBVTtBQUM3QixVQUFNLFNBQVMsT0FBTyxTQUFTLE9BQU8sRUFBRTtBQUN4QyxRQUFJLE9BQU8sU0FBUyxNQUFNLEdBQUc7QUFDM0IsYUFBTyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxNQUFNLENBQUM7QUFBQSxJQUM1QztBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQ1Q7OztBQ3ZHQSxzQkFBK0M7QUFHeEMsSUFBTSxrQkFBTixjQUE4QixpQ0FBaUI7QUFBQSxFQUdwRCxZQUFZLEtBQVUsUUFBcUI7QUFDekMsVUFBTSxLQUFLLE1BQU07QUFDakIsU0FBSyxTQUFTO0FBQUEsRUFDaEI7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBQ2xCLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFckQsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFFOUMsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsWUFBWSxFQUNwQixRQUFRLDRDQUE0QyxFQUNwRDtBQUFBLE1BQVEsQ0FBQyxTQUNSLEtBQ0csU0FBUyxLQUFLLE9BQU8sU0FBUyxTQUFTLEVBQ3ZDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGFBQUssT0FBTyxTQUFTLFlBQVk7QUFDakMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNMO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsWUFBWSxFQUNwQixRQUFRLDRDQUE0QyxFQUNwRDtBQUFBLE1BQVEsQ0FBQyxTQUNSLEtBQ0csU0FBUyxLQUFLLE9BQU8sU0FBUyxTQUFTLEVBQ3ZDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGFBQUssT0FBTyxTQUFTLFlBQVk7QUFDakMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNMO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsZ0JBQWdCLEVBQ3hCLFFBQVEsd0NBQXdDLEVBQ2hEO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FDRyxTQUFTLEtBQUssT0FBTyxTQUFTLGFBQWEsRUFDM0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsZ0JBQWdCO0FBQ3JDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDTDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGNBQWMsRUFDdEIsUUFBUSxpQ0FBaUMsRUFDekM7QUFBQSxNQUFRLENBQUMsU0FDUixLQUNHLFNBQVMsS0FBSyxPQUFPLFNBQVMsV0FBVyxFQUN6QyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxjQUFjO0FBQ25DLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDTDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGtCQUFrQixFQUMxQixRQUFRLHNDQUFzQyxFQUM5QztBQUFBLE1BQVEsQ0FBQyxTQUNSLEtBQ0csU0FBUyxLQUFLLE9BQU8sU0FBUyxlQUFlLEVBQzdDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGFBQUssT0FBTyxTQUFTLGtCQUFrQjtBQUN2QyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0w7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEIsUUFBUSx5Q0FBeUMsRUFDakQ7QUFBQSxNQUFRLENBQUMsU0FDUixLQUNHLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxFQUMzQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFDckMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNMO0FBRUYsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFFekMsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEscUJBQXFCLEVBQzdCLFFBQVEsMkNBQTJDLEVBQ25EO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxTQUFTLEtBQUssT0FBTyxTQUFTLGlCQUFpQixFQUFFLFNBQVMsT0FBTyxVQUFVO0FBQ2hGLGFBQUssT0FBTyxTQUFTLG9CQUFvQjtBQUN6QyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxtQkFBbUIsRUFDM0IsUUFBUSxtREFBbUQsRUFDM0Q7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLFNBQVMsS0FBSyxPQUFPLFNBQVMsZUFBZSxFQUFFLFNBQVMsT0FBTyxVQUFVO0FBQzlFLGFBQUssT0FBTyxTQUFTLGtCQUFrQjtBQUN2QyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEIsUUFBUSxvQ0FBb0MsRUFDNUMsUUFBUSxDQUFDLFNBQVM7QUFDakIsV0FBSyxRQUFRLE9BQU87QUFDcEIsV0FDRyxlQUFlLFFBQVEsRUFDdkIsU0FBUyxLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQzFDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGFBQUssT0FBTyxTQUFTLGVBQWU7QUFDcEMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNMLENBQUM7QUFFSCxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxjQUFjLEVBQ3RCLFFBQVEsbURBQW1ELEVBQzNEO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FDRyxTQUFTLEtBQUssT0FBTyxTQUFTLFdBQVcsRUFDekMsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsY0FBYztBQUNuQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0w7QUFFRixnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVoRCxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEsK0NBQStDLEVBQ3ZEO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FDRyxTQUFTLE9BQU8sS0FBSyxPQUFPLFNBQVMsbUJBQW1CLENBQUMsRUFDekQsU0FBUyxPQUFPLFVBQVU7QUFDekIsY0FBTSxTQUFTLE9BQU8sU0FBUyxPQUFPLEVBQUU7QUFDeEMsYUFBSyxPQUFPLFNBQVMsc0JBQXNCLE9BQU8sU0FBUyxNQUFNLEtBQUssU0FBUyxJQUFJLFNBQVM7QUFDNUYsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNMO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsb0JBQW9CLEVBQzVCLFFBQVEsNENBQTRDLEVBQ3BEO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FDRyxTQUFTLE9BQU8sS0FBSyxPQUFPLFNBQVMsZUFBZSxDQUFDLEVBQ3JELFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGNBQU0sU0FBUyxPQUFPLFNBQVMsT0FBTyxFQUFFO0FBQ3hDLGFBQUssT0FBTyxTQUFTLGtCQUFrQixPQUFPLFNBQVMsTUFBTSxLQUFLLFVBQVUsTUFBTyxTQUFTO0FBQzVGLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDTDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLG1CQUFtQixFQUMzQixRQUFRLDJDQUEyQyxFQUNuRDtBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sU0FBUyxLQUFLLE9BQU8sU0FBUyxnQkFBZ0IsRUFBRSxTQUFTLE9BQU8sVUFBVTtBQUMvRSxhQUFLLE9BQU8sU0FBUyxtQkFBbUI7QUFDeEMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDSjtBQUNGOzs7QUNoTE8sU0FBUyxjQUFjLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ3ZELFNBQU8sR0FBRyxLQUFLLFlBQVksQ0FBQyxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQ25GO0FBRU8sU0FBUyxjQUFjLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ3ZELFNBQU8sR0FBRyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsSUFBSSxLQUFLLEtBQUssV0FBVyxDQUFDLENBQUM7QUFDNUQ7QUFFTyxTQUFTLGtCQUFrQixPQUFPLG9CQUFJLEtBQUssR0FBVztBQUMzRCxTQUFPLEdBQUcsY0FBYyxJQUFJLENBQUMsSUFBSSxjQUFjLElBQUksQ0FBQztBQUN0RDtBQUVPLFNBQVMsdUJBQXVCLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ2hFLFNBQU8sR0FBRyxjQUFjLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQztBQUNsRjtBQUVPLFNBQVMsbUJBQW1CLE1BQXNCO0FBQ3ZELFNBQU8sS0FBSyxRQUFRLFFBQVEsR0FBRyxFQUFFLEtBQUs7QUFDeEM7QUFFTyxTQUFTLG9CQUFvQixNQUFzQjtBQUN4RCxTQUFPLEtBQ0osTUFBTSxJQUFJLEVBQ1YsSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLFNBQVMsRUFBRSxDQUFDLEVBQ3ZDLEtBQUssSUFBSSxFQUNULEtBQUs7QUFDVjtBQUVPLFNBQVMscUJBQXFCLE1BQXNCO0FBQ3pELFNBQU8sS0FBSyxRQUFRLFNBQVMsRUFBRTtBQUNqQztBQUVBLFNBQVMsS0FBSyxPQUF1QjtBQUNuQyxTQUFPLE9BQU8sS0FBSyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQ3RDOzs7QUNUTyxJQUFNLGVBQU4sTUFBbUI7QUFBQSxFQUN4QixZQUNtQixjQUNBLGtCQUNqQjtBQUZpQjtBQUNBO0FBQUEsRUFDaEI7QUFBQSxFQUVILE1BQU0saUJBQWlCLFFBQVEsSUFBSSxrQkFBa0IsT0FBOEI7QUFDakYsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sVUFBVSxNQUFNLEtBQUssYUFBYSxTQUFTLFNBQVMsU0FBUztBQUNuRSxVQUFNLFVBQVUsa0JBQWtCLE9BQU87QUFDekMsVUFBTSxXQUFXLGtCQUFrQixVQUFVLFFBQVEsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLFFBQVE7QUFDdEYsV0FBTyxTQUFTLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUTtBQUFBLEVBQ3hDO0FBQUEsRUFFQSxNQUFNLGtCQUFrQixPQUEyQixRQUFrQztBQXZDdkY7QUF3Q0ksVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sVUFBVSxNQUFNLEtBQUssYUFBYSxTQUFTLFNBQVMsU0FBUztBQUNuRSxVQUFNLGlCQUFpQixrQkFBa0IsT0FBTztBQUNoRCxVQUFNLGdCQUNKLGdDQUFlO0FBQUEsTUFDYixDQUFDLGNBQ0MsVUFBVSxjQUFjLE1BQU0sYUFDOUIsVUFBVSxtQkFBbUIsTUFBTTtBQUFBLElBQ3ZDLE1BSkEsWUFLQSxlQUFlLEtBQUssQ0FBQyxjQUFjLENBQUMsVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLEdBQUcsTUFMckYsWUFNQSxlQUFlO0FBQUEsTUFDYixDQUFDLGNBQ0MsQ0FBQyxVQUFVLFlBQ1gsVUFBVSxZQUFZLE1BQU0sV0FDNUIsVUFBVSxTQUFTLE1BQU0sUUFDekIsVUFBVSxZQUFZLE1BQU07QUFBQSxJQUNoQyxNQVpBLFlBYUEsZUFBZTtBQUFBLE1BQ2IsQ0FBQyxjQUNDLENBQUMsVUFBVSxZQUNYLFVBQVUsWUFBWSxNQUFNLFdBQzVCLFVBQVUsY0FBYyxNQUFNO0FBQUEsSUFDbEM7QUFFRixRQUFJLENBQUMsY0FBYztBQUNqQixhQUFPO0FBQUEsSUFDVDtBQUVBLFVBQU0sVUFBVSxtQkFBbUIsU0FBUyxjQUFjLE1BQU07QUFDaEUsVUFBTSxLQUFLLGFBQWEsWUFBWSxTQUFTLFdBQVcsT0FBTztBQUMvRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxZQUFZLE9BQTZDO0FBekVqRTtBQTBFSSxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxVQUFVLE1BQU0sS0FBSyxhQUFhLFNBQVMsU0FBUyxTQUFTO0FBQ25FLFVBQU0saUJBQWlCLGtCQUFrQixPQUFPO0FBQ2hELFVBQU0sZ0JBQ0osMEJBQWU7QUFBQSxNQUNiLENBQUMsY0FDQyxVQUFVLGNBQWMsTUFBTSxhQUM5QixVQUFVLG1CQUFtQixNQUFNO0FBQUEsSUFDdkMsTUFKQSxZQUtBLGVBQWUsS0FBSyxDQUFDLGNBQWMsVUFBVSxjQUFjLE1BQU0sU0FBUyxNQUwxRSxZQU1BLGVBQWU7QUFBQSxNQUNiLENBQUMsY0FDQyxVQUFVLFlBQVksTUFBTSxXQUM1QixVQUFVLFNBQVMsTUFBTSxRQUN6QixVQUFVLFlBQVksTUFBTTtBQUFBLElBQ2hDO0FBRUYsUUFBSSxDQUFDLGNBQWM7QUFDakIsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFVBQVUsbUJBQW1CLFNBQVMsWUFBWTtBQUN4RCxVQUFNLEtBQUssYUFBYSxZQUFZLFNBQVMsV0FBVyxPQUFPO0FBQy9ELFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFTyxTQUFTLGtCQUFrQixTQUErQjtBQXJHakU7QUFzR0UsUUFBTSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQ2hDLFFBQU0sVUFBd0IsQ0FBQztBQUMvQixNQUFJLGlCQUFpQjtBQUNyQixNQUFJLG1CQUE2QixDQUFDO0FBQ2xDLE1BQUksbUJBQW1CO0FBQ3ZCLE1BQUksa0JBQWtCO0FBQ3RCLE1BQUksc0JBQXFDO0FBQ3pDLE1BQUksb0JBQW1DO0FBQ3ZDLFFBQU0sa0JBQWtCLG9CQUFJLElBQW9CO0FBRWhELFFBQU0sWUFBWSxDQUFDLFlBQTBCO0FBaEgvQyxRQUFBQztBQWlISSxRQUFJLENBQUMsZ0JBQWdCO0FBQ25CLHlCQUFtQixDQUFDO0FBQ3BCO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxpQkFBaUIsS0FBSyxJQUFJLEVBQUUsS0FBSztBQUM5QyxVQUFNLFVBQVUsYUFBYSxJQUFJO0FBQ2pDLFVBQU0sTUFBTSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixFQUFFLEtBQUssSUFBSSxFQUFFLFFBQVE7QUFDckUsVUFBTSxZQUFZLG9CQUFvQixnQkFBZ0IsZ0JBQWdCO0FBQ3RFLFVBQU0sa0JBQWlCQSxNQUFBLGdCQUFnQixJQUFJLFNBQVMsTUFBN0IsT0FBQUEsTUFBa0M7QUFDekQsb0JBQWdCLElBQUksV0FBVyxpQkFBaUIsQ0FBQztBQUNqRCxZQUFRLEtBQUs7QUFBQSxNQUNYLFNBQVMsZUFBZSxRQUFRLFVBQVUsRUFBRSxFQUFFLEtBQUs7QUFBQSxNQUNuRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLFFBQVE7QUFBQSxNQUNmO0FBQUEsTUFDQTtBQUFBLE1BQ0EsV0FBVztBQUFBLE1BQ1g7QUFBQSxNQUNBLFVBQVU7QUFBQSxNQUNWLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFDRCx1QkFBbUIsQ0FBQztBQUNwQix1QkFBbUI7QUFDbkIsc0JBQWtCO0FBQ2xCLDBCQUFzQjtBQUN0Qix3QkFBb0I7QUFBQSxFQUN0QjtBQUVBLFdBQVMsUUFBUSxHQUFHLFFBQVEsTUFBTSxRQUFRLFNBQVMsR0FBRztBQUNwRCxVQUFNLE9BQU8sTUFBTSxLQUFLO0FBQ3hCLFVBQU0sZUFBZSxLQUFLLE1BQU0sYUFBYTtBQUM3QyxRQUFJLGNBQWM7QUFDaEIsZ0JBQVUsS0FBSztBQUNmLHVCQUFpQjtBQUNqQix5QkFBbUI7QUFDbkI7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLGdCQUFnQjtBQUNuQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGNBQWMsS0FBSyxNQUFNLHlEQUF5RDtBQUN4RixRQUFJLGFBQWE7QUFDZix3QkFBa0I7QUFDbEIsNEJBQXNCLFlBQVksQ0FBQyxFQUFFLFlBQVk7QUFDakQsMkJBQW9CLGlCQUFZLENBQUMsTUFBYixZQUFrQjtBQUN0QztBQUFBLElBQ0Y7QUFFQSxxQkFBaUIsS0FBSyxJQUFJO0FBQUEsRUFDNUI7QUFFQSxZQUFVLE1BQU0sTUFBTTtBQUN0QixTQUFPO0FBQ1Q7QUFFQSxTQUFTLG1CQUFtQixTQUFpQixPQUFtQixRQUF3QjtBQUN0RixRQUFNLFFBQVEsUUFBUSxNQUFNLElBQUk7QUFDaEMsTUFBSSxNQUFNLFlBQVksS0FBSyxNQUFNLFVBQVUsTUFBTSxhQUFhLE1BQU0sVUFBVSxNQUFNLFFBQVE7QUFDMUYsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLFlBQVksa0JBQWtCLG9CQUFJLEtBQUssQ0FBQztBQUM5QyxRQUFNLFNBQVMsd0JBQXdCLE1BQU0sSUFBSSxTQUFTO0FBQzFELFFBQU0sYUFBYSxNQUFNLE1BQU0sTUFBTSxXQUFXLE1BQU0sT0FBTztBQUM3RCxRQUFNLG9CQUFvQjtBQUFBLElBQ3hCLFdBQVcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLE1BQU0sMEJBQTBCLENBQUM7QUFBQSxFQUNyRTtBQUNBLG9CQUFrQixLQUFLLFFBQVEsRUFBRTtBQUVqQyxRQUFNLGVBQWU7QUFBQSxJQUNuQixHQUFHLE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUztBQUFBLElBQ2pDLEdBQUc7QUFBQSxJQUNILEdBQUcsTUFBTSxNQUFNLE1BQU0sT0FBTztBQUFBLEVBQzlCO0FBRUEsU0FBTyx1QkFBdUIsWUFBWSxFQUFFLEtBQUssSUFBSTtBQUN2RDtBQUVBLFNBQVMsbUJBQW1CLFNBQWlCLE9BQTJCO0FBQ3RFLFFBQU0sUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNoQyxNQUFJLE1BQU0sWUFBWSxLQUFLLE1BQU0sVUFBVSxNQUFNLGFBQWEsTUFBTSxVQUFVLE1BQU0sUUFBUTtBQUMxRixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sYUFBYSxNQUFNLE1BQU0sTUFBTSxXQUFXLE1BQU0sT0FBTztBQUM3RCxRQUFNLG9CQUFvQjtBQUFBLElBQ3hCLFdBQVcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLE1BQU0sMEJBQTBCLENBQUM7QUFBQSxFQUNyRTtBQUVBLFFBQU0sZUFBZTtBQUFBLElBQ25CLEdBQUcsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTO0FBQUEsSUFDakMsR0FBRztBQUFBLElBQ0gsR0FBRyxNQUFNLE1BQU0sTUFBTSxPQUFPO0FBQUEsRUFDOUI7QUFFQSxTQUFPLHVCQUF1QixZQUFZLEVBQUUsS0FBSyxJQUFJO0FBQ3ZEO0FBRUEsU0FBUyxhQUFhLE1BQXNCO0FBek41QztBQTBORSxRQUFNLFFBQVEsS0FDWCxNQUFNLElBQUksRUFDVixJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxFQUN6QixPQUFPLE9BQU87QUFDakIsVUFBTyxXQUFNLENBQUMsTUFBUCxZQUFZO0FBQ3JCO0FBRUEsU0FBUyxvQkFBb0IsU0FBaUIsV0FBNkI7QUFDekUsU0FBTyxDQUFDLFFBQVEsS0FBSyxHQUFHLEdBQUcsVUFBVSxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJO0FBQzVFO0FBRUEsU0FBUyx1QkFBdUIsT0FBMkI7QUFDekQsUUFBTSxRQUFRLENBQUMsR0FBRyxLQUFLO0FBQ3ZCLFNBQU8sTUFBTSxTQUFTLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQyxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQ2hFLFVBQU0sSUFBSTtBQUFBLEVBQ1o7QUFDQSxTQUFPO0FBQ1Q7OztBQ3RPTyxJQUFNLGlCQUFOLE1BQXFCO0FBQUEsRUFDMUIsWUFDbUIsY0FDQSxrQkFDakI7QUFGaUI7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxlQUFlLE9BQU8sb0JBQUksS0FBSyxHQUFXO0FBQ3hDLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFVBQVUsY0FBYyxJQUFJO0FBQ2xDLFdBQU8sR0FBRyxTQUFTLGFBQWEsSUFBSSxPQUFPO0FBQUEsRUFDN0M7QUFBQSxFQUVBLE1BQU0sa0JBQWtCLE9BQU8sb0JBQUksS0FBSyxHQUFtQjtBQUN6RCxVQUFNLFVBQVUsY0FBYyxJQUFJO0FBQ2xDLFVBQU0sT0FBTyxLQUFLLGVBQWUsSUFBSTtBQUNyQyxXQUFPLEtBQUssYUFBYSxvQkFBb0IsTUFBTSxPQUFPO0FBQUEsRUFDNUQ7QUFBQSxFQUVBLE1BQU0sWUFBWSxNQUFjLE9BQU8sb0JBQUksS0FBSyxHQUE4QjtBQUM1RSxVQUFNLFVBQVUsb0JBQW9CLElBQUk7QUFDeEMsUUFBSSxDQUFDLFNBQVM7QUFDWixZQUFNLElBQUksTUFBTSw4QkFBOEI7QUFBQSxJQUNoRDtBQUVBLFVBQU0sT0FBTyxNQUFNLEtBQUssa0JBQWtCLElBQUk7QUFDOUMsVUFBTSxPQUFPLEtBQUs7QUFFbEIsVUFBTSxRQUFRLE1BQU0sY0FBYyxJQUFJLENBQUM7QUFBQSxFQUFLLE9BQU87QUFDbkQsVUFBTSxLQUFLLGFBQWEsV0FBVyxNQUFNLEtBQUs7QUFDOUMsV0FBTyxFQUFFLEtBQUs7QUFBQSxFQUNoQjtBQUNGOzs7QUM3Qk8sSUFBTSxjQUFOLE1BQWtCO0FBQUEsRUFDdkIsWUFDbUIsY0FDQSxrQkFDakI7QUFGaUI7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxNQUFNLFdBQVcsTUFBeUM7QUFDeEQsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sVUFBVSxtQkFBbUIsSUFBSTtBQUN2QyxRQUFJLENBQUMsU0FBUztBQUNaLFlBQU0sSUFBSSxNQUFNLDJCQUEyQjtBQUFBLElBQzdDO0FBRUEsVUFBTSxRQUFRLE1BQU0sa0JBQWtCLG9CQUFJLEtBQUssQ0FBQyxDQUFDO0FBQUEsSUFBTyxPQUFPO0FBQy9ELFVBQU0sS0FBSyxhQUFhLFdBQVcsU0FBUyxXQUFXLEtBQUs7QUFDNUQsV0FBTyxFQUFFLE1BQU0sU0FBUyxVQUFVO0FBQUEsRUFDcEM7QUFDRjs7O0FDVk8sSUFBTSxtQkFBTixNQUF1QjtBQUFBLEVBQzVCLFlBQ21CLGNBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsTUFBTSxnQkFBZ0IsT0FBMkIsUUFBMkM7QUFDMUYsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sVUFBVSxjQUFjLEdBQUc7QUFDakMsVUFBTSxPQUFPLEdBQUcsU0FBUyxhQUFhLElBQUksT0FBTztBQUNqRCxVQUFNLFVBQVU7QUFBQSxNQUNkLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQztBQUFBLE1BQzVCLGFBQWEsTUFBTTtBQUFBLE1BQ25CLFlBQVksTUFBTSxPQUFPO0FBQUEsTUFDekIsY0FBYyxNQUFNLFdBQVcsTUFBTSxRQUFRLFNBQVM7QUFBQSxNQUN0RCxnQkFBZ0Isc0JBQXNCLE1BQU0sU0FBUyxDQUFDO0FBQUEsTUFDdEQsc0JBQXNCLE1BQU0sY0FBYztBQUFBLE1BQzFDO0FBQUEsSUFDRixFQUFFLEtBQUssSUFBSTtBQUVYLFVBQU0sS0FBSyxhQUFhLFdBQVcsTUFBTSxPQUFPO0FBQ2hELFdBQU8sRUFBRSxLQUFLO0FBQUEsRUFDaEI7QUFBQSxFQUVBLE1BQU0sa0JBQWtCLE9BQWtDO0FBQ3hELFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFFBQVEsTUFBTSxLQUFLLGFBQWEsa0JBQWtCO0FBQ3hELFVBQU0sV0FBVyxNQUNkLE9BQU8sQ0FBQyxTQUFTLGNBQWMsS0FBSyxNQUFNLFNBQVMsYUFBYSxDQUFDLEVBQ2pFLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFDM0QsV0FBTyxPQUFPLFVBQVUsV0FBVyxTQUFTLE1BQU0sR0FBRyxLQUFLLElBQUk7QUFBQSxFQUNoRTtBQUFBLEVBRUEsTUFBTSxpQkFBaUIsT0FBMkM7QUFDaEUsVUFBTSxPQUFPLE1BQU0sS0FBSyxrQkFBa0IsS0FBSztBQUMvQyxVQUFNLFVBQTRCLENBQUM7QUFFbkMsZUFBVyxRQUFRLE1BQU07QUFDdkIsWUFBTSxVQUFVLE1BQU0sS0FBSyxhQUFhLFNBQVMsS0FBSyxJQUFJO0FBQzFELFlBQU0sU0FBUyxzQkFBc0IsU0FBUyxLQUFLLE1BQU0sS0FBSyxLQUFLLEtBQUs7QUFDeEUsY0FBUSxLQUFLLEdBQUcsT0FBTyxRQUFRLENBQUM7QUFDaEMsVUFBSSxPQUFPLFVBQVUsWUFBWSxRQUFRLFVBQVUsT0FBTztBQUN4RDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsV0FBTyxPQUFPLFVBQVUsV0FBVyxRQUFRLE1BQU0sR0FBRyxLQUFLLElBQUk7QUFBQSxFQUMvRDtBQUFBLEVBRUEsTUFBTSxzQkFBdUM7QUFDM0MsWUFBUSxNQUFNLEtBQUssaUJBQWlCLEdBQUc7QUFBQSxFQUN6QztBQUNGO0FBRU8sU0FBUyxzQkFDZCxTQUNBLFlBQ0EsV0FDa0I7QUFDbEIsUUFBTSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQ2hDLFFBQU0sVUFBNEIsQ0FBQztBQUNuQyxNQUFJLG1CQUFtQjtBQUN2QixNQUFJLGdCQUFnQjtBQUNwQixNQUFJLGlCQUFpQjtBQUNyQixNQUFJLGlCQUFpQjtBQUNyQixNQUFJLG1CQUFtQjtBQUN2QixNQUFJLHdCQUF3QjtBQUM1QixNQUFJLG9CQUFvQjtBQUV4QixRQUFNLFlBQVksTUFBWTtBQUM1QixRQUFJLENBQUMsa0JBQWtCO0FBQ3JCO0FBQUEsSUFDRjtBQUVBLFlBQVEsS0FBSztBQUFBLE1BQ1gsUUFBUSxpQkFBaUI7QUFBQSxNQUN6QixTQUFTO0FBQUEsTUFDVCxTQUFTO0FBQUEsTUFDVCxNQUFNO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWCxnQkFBZ0I7QUFBQSxNQUNoQixXQUFXO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxNQUNBLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFDRCx1QkFBbUI7QUFDbkIsb0JBQWdCO0FBQ2hCLHFCQUFpQjtBQUNqQixxQkFBaUI7QUFDakIsdUJBQW1CO0FBQ25CLDRCQUF3QjtBQUN4Qix5QkFBcUI7QUFBQSxFQUN2QjtBQUVBLGFBQVcsUUFBUSxPQUFPO0FBQ3hCLFVBQU0sZUFBZSxLQUFLLE1BQU0sYUFBYTtBQUM3QyxRQUFJLGNBQWM7QUFDaEIsZ0JBQVU7QUFDVix5QkFBbUIsYUFBYSxDQUFDLEVBQUUsS0FBSztBQUN4QztBQUFBLElBQ0Y7QUFFQSxVQUFNLGNBQWMsS0FBSyxNQUFNLHVCQUF1QjtBQUN0RCxRQUFJLGFBQWE7QUFDZixzQkFBZ0IsWUFBWSxDQUFDLEVBQUUsS0FBSztBQUNwQztBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWEsS0FBSyxNQUFNLHNCQUFzQjtBQUNwRCxRQUFJLFlBQVk7QUFDZCx1QkFBaUIsV0FBVyxDQUFDLEVBQUUsS0FBSztBQUNwQztBQUFBLElBQ0Y7QUFFQSxVQUFNLGVBQWUsS0FBSyxNQUFNLHdCQUF3QjtBQUN4RCxRQUFJLGNBQWM7QUFDaEIsdUJBQWlCLGFBQWEsQ0FBQyxFQUFFLEtBQUs7QUFDdEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxpQkFBaUIsS0FBSyxNQUFNLDBCQUEwQjtBQUM1RCxRQUFJLGdCQUFnQjtBQUNsQix5QkFBbUIsc0JBQXNCLGVBQWUsQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUNqRTtBQUFBLElBQ0Y7QUFFQSxVQUFNLHNCQUFzQixLQUFLLE1BQU0sZ0NBQWdDO0FBQ3ZFLFFBQUkscUJBQXFCO0FBQ3ZCLFlBQU0sU0FBUyxPQUFPLFNBQVMsb0JBQW9CLENBQUMsR0FBRyxFQUFFO0FBQ3pELDhCQUF3QixPQUFPLFNBQVMsTUFBTSxJQUFJLFNBQVM7QUFBQSxJQUM3RDtBQUFBLEVBQ0Y7QUFFQSxZQUFVO0FBQ1YsU0FBTztBQUNUO0FBRUEsU0FBUyxjQUFjLE1BQWMsUUFBeUI7QUFDNUQsUUFBTSxtQkFBbUIsT0FBTyxRQUFRLFFBQVEsRUFBRTtBQUNsRCxTQUFPLFNBQVMsb0JBQW9CLEtBQUssV0FBVyxHQUFHLGdCQUFnQixHQUFHO0FBQzVFO0FBRUEsU0FBUyxzQkFBc0IsV0FBMkI7QUFDeEQsU0FBTyxtQkFBbUIsU0FBUztBQUNyQztBQUVBLFNBQVMsc0JBQXNCLFdBQTJCO0FBQ3hELE1BQUk7QUFDRixXQUFPLG1CQUFtQixTQUFTO0FBQUEsRUFDckMsU0FBUTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7OztBQ2hLTyxJQUFNLGdCQUFOLE1BQW9CO0FBQUEsRUFDekIsWUFDbUIsY0FDQSxjQUNBLGFBQ0EsZ0JBQ0Esa0JBQ0Esa0JBQ2pCO0FBTmlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxNQUFNLHNCQUFzQixRQUFRLElBQTJCO0FBQzdELFdBQU8sS0FBSyxhQUFhLGlCQUFpQixLQUFLO0FBQUEsRUFDakQ7QUFBQSxFQUVBLE1BQU0sY0FBYyxPQUFvQztBQUN0RCxVQUFNLE9BQU8sTUFBTSxRQUFRLE1BQU0sV0FBVyxNQUFNO0FBQ2xELFVBQU0sUUFBUSxNQUFNLEtBQUssWUFBWSxXQUFXLElBQUk7QUFDcEQsVUFBTSxLQUFLLDBCQUEwQixPQUFPLE1BQU07QUFDbEQsVUFBTSxnQkFBZ0IsTUFBTSxLQUFLLGtCQUFrQixPQUFPLE1BQU07QUFDaEUsV0FBTyxLQUFLO0FBQUEsTUFDVixtQ0FBbUMsTUFBTSxJQUFJO0FBQUEsTUFDN0M7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxVQUFVLE9BQW9DO0FBQ2xELFVBQU0sS0FBSywwQkFBMEIsT0FBTyxNQUFNO0FBQ2xELFVBQU0sZ0JBQWdCLE1BQU0sS0FBSyxrQkFBa0IsT0FBTyxNQUFNO0FBQ2hFLFdBQU8sS0FBSyxpQkFBaUIsb0JBQW9CLGFBQWE7QUFBQSxFQUNoRTtBQUFBLEVBRUEsTUFBTSxVQUFVLE9BQW9DO0FBQ2xELFVBQU0sS0FBSywwQkFBMEIsT0FBTyxNQUFNO0FBQ2xELFVBQU0sZ0JBQWdCLE1BQU0sS0FBSyxrQkFBa0IsT0FBTyxNQUFNO0FBQ2hFLFdBQU8sS0FBSyxpQkFBaUIsdUJBQXVCLGFBQWE7QUFBQSxFQUNuRTtBQUFBLEVBRUEsTUFBTSxnQkFBZ0IsT0FBb0M7QUFDeEQsVUFBTSxRQUFRLE1BQU0sS0FBSyxlQUFlO0FBQUEsTUFDdEM7QUFBQSxRQUNFLFdBQVcsTUFBTSxPQUFPO0FBQUEsUUFDeEI7QUFBQSxRQUNBLE1BQU0sUUFBUSxNQUFNLFdBQVcsTUFBTTtBQUFBLE1BQ3ZDLEVBQUUsS0FBSyxJQUFJO0FBQUEsSUFDYjtBQUNBLFVBQU0sS0FBSywwQkFBMEIsT0FBTyxTQUFTO0FBQ3JELFVBQU0sZ0JBQWdCLE1BQU0sS0FBSyxrQkFBa0IsT0FBTyxTQUFTO0FBQ25FLFdBQU8sS0FBSyxpQkFBaUIsMkJBQTJCLE1BQU0sSUFBSSxJQUFJLGFBQWE7QUFBQSxFQUNyRjtBQUFBLEVBRUEsTUFBTSxjQUFjLE9BQW9DO0FBQ3RELFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLGNBQWMsU0FBUztBQUM3QixVQUFNLEtBQUssYUFBYSxhQUFhLFdBQVc7QUFFaEQsVUFBTSxRQUFRLEtBQUssZUFBZSxLQUFLO0FBQ3ZDLFVBQU0sV0FBVyxHQUFHLGtCQUFrQixHQUFHLEVBQUUsUUFBUSxTQUFTLEdBQUcsQ0FBQyxJQUFJLFFBQVEsS0FBSyxDQUFDO0FBQ2xGLFVBQU0sT0FBTyxNQUFNLEtBQUssYUFBYSxxQkFBcUIsR0FBRyxXQUFXLElBQUksUUFBUSxFQUFFO0FBQ3RGLFVBQU0sVUFBVTtBQUFBLE1BQ2QsS0FBSyxLQUFLO0FBQUEsTUFDVjtBQUFBLE1BQ0EsWUFBWSxrQkFBa0IsR0FBRyxDQUFDO0FBQUEsTUFDbEM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsTUFBTSxRQUFRLE1BQU0sV0FBVyxNQUFNO0FBQUEsTUFDckM7QUFBQSxJQUNGLEVBQUUsS0FBSyxJQUFJO0FBRVgsVUFBTSxLQUFLLGFBQWEsV0FBVyxNQUFNLE9BQU87QUFDaEQsVUFBTSxLQUFLLDBCQUEwQixPQUFPLE1BQU07QUFDbEQsVUFBTSxnQkFBZ0IsTUFBTSxLQUFLLGtCQUFrQixPQUFPLE1BQU07QUFDaEUsV0FBTyxLQUFLLGlCQUFpQixtQ0FBbUMsSUFBSSxJQUFJLGFBQWE7QUFBQSxFQUN2RjtBQUFBLEVBRUEsTUFBTSxvQkFBb0IsT0FBd0M7QUFDaEUsVUFBTSxXQUFXO0FBQUEsTUFDZixTQUFTLE1BQU07QUFBQSxNQUNmLE1BQU07QUFBQSxNQUNOLFNBQVMsTUFBTTtBQUFBLE1BQ2YsV0FBVyxNQUFNO0FBQUEsTUFDakIsZ0JBQWdCLE1BQU07QUFBQSxJQUN4QjtBQUNBLFVBQU0sV0FBVyxNQUFNLEtBQUssYUFBYSxZQUFZLFFBQVE7QUFDN0QsUUFBSSxDQUFDLFVBQVU7QUFDYixZQUFNLElBQUksTUFBTSxpQ0FBaUMsTUFBTSxPQUFPLEVBQUU7QUFBQSxJQUNsRTtBQUNBLFVBQU0sS0FBSywwQkFBMEIsVUFBVSxRQUFRO0FBQ3ZELFdBQU8seUJBQXlCLE1BQU0sT0FBTztBQUFBLEVBQy9DO0FBQUEsRUFFQSxlQUFlLE9BQTJCO0FBcEc1QztBQXFHSSxVQUFNLFlBQVksTUFBTSxXQUFXLE1BQU0sUUFBUSxNQUFNO0FBQ3ZELFVBQU0sUUFBUSxVQUNYLE1BQU0sSUFBSSxFQUNWLElBQUksQ0FBQyxTQUFTLG1CQUFtQixJQUFJLENBQUMsRUFDdEMsT0FBTyxPQUFPO0FBRWpCLFVBQU0sU0FBUSxXQUFNLENBQUMsTUFBUCxZQUFZO0FBQzFCLFdBQU8sVUFBVSxLQUFLO0FBQUEsRUFDeEI7QUFBQSxFQUVBLE1BQWMsa0JBQWtCLE9BQW1CLFFBQWtDO0FBQ25GLFFBQUk7QUFDRixhQUFPLE1BQU0sS0FBSyxhQUFhLGtCQUFrQixPQUFPLE1BQU07QUFBQSxJQUNoRSxTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sS0FBSztBQUNuQixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQSxFQUVRLGlCQUFpQixTQUFpQixlQUFnQztBQUN4RSxXQUFPLGdCQUFnQixVQUFVLEdBQUcsT0FBTztBQUFBLEVBQzdDO0FBQUEsRUFFQSxNQUFjLDBCQUNaLE9BQ0EsUUFDZTtBQUNmLFFBQUk7QUFDRixZQUFNLEtBQUssaUJBQWlCLGdCQUFnQixPQUFPLE1BQU07QUFBQSxJQUMzRCxTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sS0FBSztBQUFBLElBQ3JCO0FBQUEsRUFDRjtBQUNGO0FBRUEsU0FBUyxRQUFRLE1BQXNCO0FBQ3JDLFNBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxlQUFlLEdBQUcsRUFDMUIsUUFBUSxZQUFZLEVBQUUsRUFDdEIsTUFBTSxHQUFHLEVBQUUsS0FBSztBQUNyQjtBQUVBLFNBQVMsVUFBVSxNQUFzQjtBQUN2QyxRQUFNLFVBQVUsS0FBSyxLQUFLO0FBQzFCLE1BQUksUUFBUSxVQUFVLElBQUk7QUFDeEIsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPLEdBQUcsUUFBUSxNQUFNLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQztBQUMxQzs7O0FDdEpBLElBQUFDLG1CQUE4Qjs7O0FDSTlCLGVBQXNCLDBCQUNwQixjQUNBLE9BQ0EsVUFDaUI7QUFDakIsUUFBTSxRQUFrQixDQUFDO0FBQ3pCLE1BQUksUUFBUTtBQUVaLGFBQVcsUUFBUSxPQUFPO0FBQ3hCLFFBQUk7QUFDRixZQUFNLFVBQVUsTUFBTSxhQUFhLFNBQVMsS0FBSyxJQUFJO0FBQ3JELFlBQU0sVUFBVSxRQUFRLEtBQUs7QUFDN0IsVUFBSSxDQUFDLFNBQVM7QUFDWjtBQUFBLE1BQ0Y7QUFFQSxZQUFNLFFBQVEsQ0FBQyxPQUFPLEtBQUssSUFBSSxJQUFJLE9BQU8sRUFBRSxLQUFLLElBQUk7QUFDckQsVUFBSSxRQUFRLE1BQU0sU0FBUyxVQUFVO0FBQ25DLGNBQU0sWUFBWSxLQUFLLElBQUksR0FBRyxXQUFXLEtBQUs7QUFDOUMsWUFBSSxZQUFZLEdBQUc7QUFDakIsZ0JBQU0sS0FBSyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUM7QUFBQSxRQUN0QztBQUNBO0FBQUEsTUFDRjtBQUVBLFlBQU0sS0FBSyxLQUFLO0FBQ2hCLGVBQVMsTUFBTTtBQUFBLElBQ2pCLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBRUEsU0FBTyxNQUFNLEtBQUssTUFBTTtBQUMxQjs7O0FDckNBLFNBQVMsaUJBQWlCLE1BQWtDO0FBQzFELFVBQVEsc0JBQVEsSUFBSSxRQUFRLFFBQVEsR0FBRyxFQUFFLEtBQUs7QUFDaEQ7QUFFQSxTQUFTLGtCQUFrQixPQUFvQixjQUE4QjtBQUMzRSxNQUFJLENBQUMsTUFBTSxNQUFNO0FBQ2YsV0FBTyxLQUFLLFlBQVk7QUFBQSxFQUMxQjtBQUNBLFNBQU8sTUFBTSxLQUFLLEtBQUssRUFDcEIsTUFBTSxHQUFHLENBQUMsRUFDVixJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRSxFQUN6QixLQUFLLElBQUk7QUFDZDtBQUVBLFNBQVMsa0JBQWtCLE9BQTRCO0FBQ3JELE1BQUksQ0FBQyxNQUFNLE1BQU07QUFDZixXQUFPO0FBQUEsRUFDVDtBQUNBLFNBQU8sTUFBTSxLQUFLLEtBQUssRUFDcEIsTUFBTSxHQUFHLENBQUMsRUFDVixJQUFJLENBQUMsU0FBUyxTQUFTLElBQUksRUFBRSxFQUM3QixLQUFLLElBQUk7QUFDZDtBQUVPLFNBQVMscUJBQXFCLFNBQXlCO0FBQzVELFFBQU0sYUFBYSxvQkFBSSxJQUFZO0FBQ25DLFFBQU0sUUFBUSxvQkFBSSxJQUFZO0FBQzlCLFFBQU0sWUFBWSxvQkFBSSxJQUFZO0FBRWxDLFFBQU0sUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNoQyxhQUFXLFdBQVcsT0FBTztBQUMzQixVQUFNLE9BQU8sUUFBUSxLQUFLO0FBQzFCLFFBQUksQ0FBQyxNQUFNO0FBQ1Q7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFdBQVcsTUFBTSxHQUFHO0FBQzNCO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBVSxLQUFLLE1BQU0saUJBQWlCO0FBQzVDLFFBQUksU0FBUztBQUNYLGlCQUFXLElBQUksaUJBQWlCLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDM0M7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLEtBQUssTUFBTSw4QkFBOEI7QUFDdEQsUUFBSSxNQUFNO0FBQ1IsWUFBTSxPQUFPLGlCQUFpQixLQUFLLENBQUMsQ0FBQztBQUNyQyxZQUFNLElBQUksSUFBSTtBQUNkLGdCQUFVLElBQUksSUFBSTtBQUNsQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQVMsS0FBSyxNQUFNLGtDQUFrQztBQUM1RCxRQUFJLFFBQVE7QUFDVixZQUFNLE9BQU8saUJBQWlCLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZDLFVBQUksTUFBTTtBQUNSLG1CQUFXLElBQUksSUFBSTtBQUFBLE1BQ3JCO0FBQ0E7QUFBQSxJQUNGO0FBRUEsUUFBSSxXQUFXLE9BQU8sS0FBSyxLQUFLLFVBQVUsS0FBSztBQUM3QyxpQkFBVyxJQUFJLGlCQUFpQixJQUFJLENBQUM7QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0Esa0JBQWtCLFlBQVksd0JBQXdCO0FBQUEsSUFDdEQ7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0IsS0FBSztBQUFBLElBQ3ZCO0FBQUEsSUFDQTtBQUFBLElBQ0Esa0JBQWtCLFdBQVcsb0NBQW9DO0FBQUEsRUFDbkUsRUFBRSxLQUFLLElBQUk7QUFDYjs7O0FGN0RPLElBQU0saUJBQU4sTUFBcUI7QUFBQSxFQUMxQixZQUNtQixjQUNBLFdBQ0Esa0JBQ2pCO0FBSGlCO0FBQ0E7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxNQUFNLGdCQUFnQixjQUF1QixPQUF3QztBQUNuRixVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSx3QkFBd0Isc0NBQWdCLFNBQVM7QUFDdkQsVUFBTSxRQUFRLE1BQU0sS0FBSyxtQkFBbUIsVUFBVSxxQkFBcUI7QUFDM0UsVUFBTSxVQUFVLE1BQU07QUFBQSxNQUNwQixLQUFLO0FBQUEsTUFDTDtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1g7QUFFQSxRQUFJLFVBQVUscUJBQXFCLE9BQU87QUFDMUMsUUFBSSxTQUFTO0FBRWIsUUFBSSxTQUFTLG1CQUFtQjtBQUM5QixVQUFJLENBQUMsU0FBUyxhQUFhLEtBQUssS0FBSyxDQUFDLFNBQVMsWUFBWSxLQUFLLEdBQUc7QUFDakUsWUFBSSx3QkFBTyx1REFBdUQ7QUFBQSxNQUNwRSxPQUFPO0FBQ0wsWUFBSTtBQUNGLG9CQUFVLE1BQU0sS0FBSyxVQUFVLFVBQVUsV0FBVyxTQUFTLFFBQVE7QUFDckUsbUJBQVM7QUFBQSxRQUNYLFNBQVMsT0FBTztBQUNkLGtCQUFRLE1BQU0sS0FBSztBQUNuQixjQUFJLHdCQUFPLGtDQUFrQztBQUFBLFFBQy9DO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxRQUFJO0FBQ0osVUFBTSxRQUFRLFFBQVEsR0FBRyxLQUFLLGFBQWE7QUFDM0MsUUFBSSxTQUFTLGtCQUFrQjtBQUM3QixZQUFNLFlBQVksdUJBQXVCLG9CQUFJLEtBQUssQ0FBQztBQUNuRCxZQUFNLFlBQVksUUFBUSxHQUFHLE1BQU0sWUFBWSxDQUFDLElBQUksU0FBUyxLQUFLO0FBQ2xFLFlBQU0sZ0JBQWdCLEdBQUcsU0FBUyxlQUFlLElBQUksU0FBUztBQUM5RCxZQUFNLE9BQU8sTUFBTSxLQUFLLGFBQWEscUJBQXFCLGFBQWE7QUFDdkUsWUFBTSxtQkFBbUIsa0JBQWtCLG9CQUFJLEtBQUssQ0FBQztBQUNyRCxZQUFNLE9BQU87QUFBQSxRQUNYLEtBQUssS0FBSyxJQUFJLGdCQUFnQjtBQUFBLFFBQzlCO0FBQUEsUUFDQTtBQUFBLFFBQ0EsMEJBQTBCLElBQUksVUFBVSxRQUFRLHFCQUFxQjtBQUFBLFFBQ3JFO0FBQUEsUUFDQSxRQUFRLEtBQUs7QUFBQSxNQUNmLEVBQUUsS0FBSyxJQUFJO0FBQ1gsWUFBTSxLQUFLLGFBQWEsV0FBVyxNQUFNLElBQUk7QUFDN0Msc0JBQWdCO0FBQUEsSUFDbEI7QUFFQSxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQWMsbUJBQ1osVUFDQSxjQUNrQjtBQUNsQixVQUFNLFNBQVMsZUFBZSxZQUFZLEVBQUUsUUFBUTtBQUNwRCxVQUFNLFFBQVEsTUFBTSxLQUFLLGFBQWEsa0JBQWtCO0FBQ3hELFdBQU8sTUFDSixPQUFPLENBQUMsU0FBUyxDQUFDQyxlQUFjLEtBQUssTUFBTSxTQUFTLGVBQWUsQ0FBQyxFQUNwRSxPQUFPLENBQUMsU0FBUyxDQUFDQSxlQUFjLEtBQUssTUFBTSxTQUFTLGFBQWEsQ0FBQyxFQUNsRSxPQUFPLENBQUMsU0FBUyxLQUFLLEtBQUssU0FBUyxNQUFNLEVBQzFDLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFBQSxFQUM3RDtBQUNGO0FBRUEsU0FBU0EsZUFBYyxNQUFjLFFBQXlCO0FBQzVELFFBQU0sbUJBQW1CLE9BQU8sUUFBUSxRQUFRLEVBQUU7QUFDbEQsU0FBTyxTQUFTLG9CQUFvQixLQUFLLFdBQVcsR0FBRyxnQkFBZ0IsR0FBRztBQUM1RTtBQUVBLFNBQVMsZUFBZSxjQUE0QjtBQUNsRCxRQUFNLFdBQVcsS0FBSyxJQUFJLEdBQUcsWUFBWTtBQUN6QyxRQUFNLFFBQVEsb0JBQUksS0FBSztBQUN2QixRQUFNLFNBQVMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUN6QixRQUFNLFFBQVEsTUFBTSxRQUFRLEtBQUssV0FBVyxFQUFFO0FBQzlDLFNBQU87QUFDVDs7O0FHcEdPLElBQU0sY0FBTixNQUFrQjtBQUFBLEVBQ3ZCLFlBQ21CLGNBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsTUFBTSxXQUFXLE1BQXlDO0FBQ3hELFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxVQUFNLFVBQVUsbUJBQW1CLElBQUk7QUFDdkMsUUFBSSxDQUFDLFNBQVM7QUFDWixZQUFNLElBQUksTUFBTSwyQkFBMkI7QUFBQSxJQUM3QztBQUVBLFVBQU0sUUFBUSxTQUFTLE9BQU8sWUFBWSxrQkFBa0Isb0JBQUksS0FBSyxDQUFDLENBQUM7QUFDdkUsVUFBTSxLQUFLLGFBQWEsV0FBVyxTQUFTLFdBQVcsS0FBSztBQUM1RCxXQUFPLEVBQUUsTUFBTSxTQUFTLFVBQVU7QUFBQSxFQUNwQztBQUNGOzs7QUNyQkEsSUFBQUMsbUJBQTJCOzs7QUNBcEIsU0FBUyxpQkFBaUIsU0FBeUI7QUFDeEQsUUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixNQUFJLENBQUMsU0FBUztBQUNaLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsUUFBTSxTQUFTLHFCQUFxQixPQUFPO0FBQzNDLE1BQUksUUFBUTtBQUNWLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQSxPQUFPLGNBQWM7QUFBQSxNQUNyQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU8sU0FBUztBQUFBLE1BQ2hCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsT0FBTyxhQUFhO0FBQUEsSUFDdEIsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixFQUFFLEtBQUssSUFBSTtBQUNiO0FBRUEsU0FBUyxxQkFBcUIsU0FJckI7QUFDUCxRQUFNLGVBQXdFO0FBQUEsSUFDNUUsWUFBWSxDQUFDO0FBQUEsSUFDYixPQUFPLENBQUM7QUFBQSxJQUNSLGNBQWMsQ0FBQztBQUFBLEVBQ2pCO0FBQ0EsUUFBTSxnQkFBMEIsQ0FBQztBQUVqQyxNQUFJLGlCQUFtRDtBQUN2RCxNQUFJLGFBQWE7QUFFakIsYUFBVyxXQUFXLFFBQVEsTUFBTSxJQUFJLEdBQUc7QUFDekMsVUFBTSxPQUFPLFFBQVEsUUFBUTtBQUM3QixVQUFNLFVBQVUsS0FBSyxNQUFNLDBDQUEwQztBQUNyRSxRQUFJLFNBQVM7QUFDWCx1QkFBaUIscUJBQXFCLFFBQVEsQ0FBQyxDQUFDO0FBQ2hELG1CQUFhO0FBQ2I7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLFlBQVk7QUFDZixVQUFJLEtBQUssS0FBSyxHQUFHO0FBQ2Ysc0JBQWMsS0FBSyxJQUFJO0FBQUEsTUFDekI7QUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGdCQUFnQjtBQUNsQixtQkFBYSxjQUFjLEVBQUUsS0FBSyxJQUFJO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBRUEsTUFBSSxDQUFDLFlBQVk7QUFDZixXQUFPO0FBQUEsRUFDVDtBQUVBLFNBQU87QUFBQSxJQUNMLFlBQVksWUFBWSxDQUFDLEdBQUcsZUFBZSxHQUFHLGFBQWEsVUFBVSxDQUFDO0FBQUEsSUFDdEUsT0FBTyxZQUFZLGFBQWEsS0FBSztBQUFBLElBQ3JDLFdBQVcsWUFBWSxhQUFhLFlBQVksQ0FBQztBQUFBLEVBQ25EO0FBQ0Y7QUFFQSxTQUFTLHFCQUFxQixTQUk1QjtBQUNBLFFBQU0sYUFBYSxRQUFRLFlBQVk7QUFDdkMsTUFBSSxlQUFlLFNBQVM7QUFDMUIsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGVBQWUsY0FBYztBQUMvQixXQUFPO0FBQUEsRUFDVDtBQUNBLFNBQU87QUFDVDtBQUVBLFNBQVMsWUFBWSxPQUF5QjtBQUM1QyxTQUFPLE1BQU0sS0FBSyxJQUFJLEVBQUUsS0FBSztBQUMvQjs7O0FEekZPLElBQU0saUJBQU4sTUFBcUI7QUFBQSxFQUMxQixjQUFjO0FBQUEsRUFBQztBQUFBLEVBRWYsTUFBTSxVQUFVLE1BQWMsVUFBZ0Q7QUFDNUUsVUFBTSxXQUFXLE1BQU0sS0FBSyxtQkFBbUIsVUFBVTtBQUFBLE1BQ3ZEO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixTQUNFO0FBQUEsTUFDSjtBQUFBLE1BQ0E7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGLEVBQUUsS0FBSyxJQUFJO0FBQUEsTUFDYjtBQUFBLElBQ0YsQ0FBQztBQUVELFdBQU8saUJBQWlCLFFBQVE7QUFBQSxFQUNsQztBQUFBLEVBRUEsTUFBTSxVQUFVLE1BQWMsVUFBb0Q7QUFDaEYsVUFBTSxXQUFXLE1BQU0sS0FBSyxtQkFBbUIsVUFBVTtBQUFBLE1BQ3ZEO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixTQUNFO0FBQUEsTUFDSjtBQUFBLE1BQ0E7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxNQUNiO0FBQUEsSUFDRixDQUFDO0FBRUQsVUFBTSxVQUFVLFNBQVMsS0FBSyxFQUFFLFlBQVk7QUFDNUMsUUFBSSxZQUFZLFVBQVUsWUFBWSxVQUFVLFlBQVksV0FBVztBQUNyRSxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFjLG1CQUNaLFVBQ0EsVUFDaUI7QUE3RXJCO0FBOEVJLFFBQUksQ0FBQyxTQUFTLGFBQWEsS0FBSyxHQUFHO0FBQ2pDLFlBQU0sSUFBSSxNQUFNLDJCQUEyQjtBQUFBLElBQzdDO0FBRUEsVUFBTSxTQUFTLFVBQU0sNkJBQVc7QUFBQSxNQUM5QixLQUFLO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxlQUFlLFVBQVUsU0FBUyxhQUFhLEtBQUssQ0FBQztBQUFBLFFBQ3JELGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsTUFDQSxNQUFNLEtBQUssVUFBVTtBQUFBLFFBQ25CLE9BQU8sU0FBUyxZQUFZLEtBQUs7QUFBQSxRQUNqQztBQUFBLFFBQ0EsYUFBYTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFVBQU0sT0FBTyxPQUFPO0FBQ3BCLFVBQU0sV0FBVSw0QkFBSyxZQUFMLG1CQUFlLE9BQWYsbUJBQW1CLFlBQW5CLG1CQUE0QixZQUE1QixZQUF1QztBQUN2RCxRQUFJLENBQUMsUUFBUSxLQUFLLEdBQUc7QUFDbkIsWUFBTSxJQUFJLE1BQU0sbUNBQW1DO0FBQUEsSUFDckQ7QUFDQSxXQUFPLFFBQVEsS0FBSztBQUFBLEVBQ3RCO0FBQ0Y7OztBRXZHQSxJQUFBQyxtQkFNTztBQUlBLElBQU0sZUFBTixNQUFtQjtBQUFBLEVBQ3hCLFlBQTZCLEtBQVU7QUFBVjtBQUFBLEVBQVc7QUFBQSxFQUV4QyxNQUFNLG1CQUFtQixVQUE4QztBQUNyRSxVQUFNLEtBQUssYUFBYSxTQUFTLGFBQWE7QUFDOUMsVUFBTSxLQUFLLGFBQWEsU0FBUyxXQUFXO0FBQzVDLFVBQU0sS0FBSyxhQUFhLFNBQVMsZUFBZTtBQUNoRCxVQUFNLEtBQUssYUFBYSxTQUFTLGFBQWE7QUFDOUMsVUFBTSxLQUFLLGFBQWEsYUFBYSxTQUFTLFNBQVMsQ0FBQztBQUN4RCxVQUFNLEtBQUssYUFBYSxhQUFhLFNBQVMsU0FBUyxDQUFDO0FBQUEsRUFDMUQ7QUFBQSxFQUVBLE1BQU0sYUFBYSxZQUFtQztBQUNwRCxVQUFNLGlCQUFhLGdDQUFjLFVBQVUsRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUMvRCxRQUFJLENBQUMsWUFBWTtBQUNmO0FBQUEsSUFDRjtBQUVBLFVBQU0sV0FBVyxXQUFXLE1BQU0sR0FBRyxFQUFFLE9BQU8sT0FBTztBQUNyRCxRQUFJLFVBQVU7QUFDZCxlQUFXLFdBQVcsVUFBVTtBQUM5QixnQkFBVSxVQUFVLEdBQUcsT0FBTyxJQUFJLE9BQU8sS0FBSztBQUM5QyxZQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLE9BQU87QUFDN0QsVUFBSSxDQUFDLFVBQVU7QUFDYixjQUFNLEtBQUssSUFBSSxNQUFNLGFBQWEsT0FBTztBQUFBLE1BQzNDLFdBQVcsRUFBRSxvQkFBb0IsMkJBQVU7QUFDekMsY0FBTSxJQUFJLE1BQU0sb0NBQW9DLE9BQU8sRUFBRTtBQUFBLE1BQy9EO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sV0FBVyxVQUFrQixpQkFBaUIsSUFBb0I7QUFDdEUsVUFBTSxpQkFBYSxnQ0FBYyxRQUFRO0FBQ3pDLFVBQU0sV0FBVyxLQUFLLElBQUksTUFBTSxzQkFBc0IsVUFBVTtBQUNoRSxRQUFJLG9CQUFvQix3QkFBTztBQUM3QixhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksVUFBVTtBQUNaLFlBQU0sSUFBSSxNQUFNLGtDQUFrQyxVQUFVLEVBQUU7QUFBQSxJQUNoRTtBQUVBLFVBQU0sS0FBSyxhQUFhLGFBQWEsVUFBVSxDQUFDO0FBQ2hELFdBQU8sS0FBSyxJQUFJLE1BQU0sT0FBTyxZQUFZLGNBQWM7QUFBQSxFQUN6RDtBQUFBLEVBRUEsTUFBTSxTQUFTLFVBQW1DO0FBQ2hELFVBQU0sT0FBTyxLQUFLLElBQUksTUFBTSwwQkFBc0IsZ0NBQWMsUUFBUSxDQUFDO0FBQ3pFLFFBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSTtBQUFBLEVBQ2pDO0FBQUEsRUFFQSxNQUFNLFdBQVcsVUFBa0IsU0FBaUM7QUFDbEUsVUFBTSxPQUFPLE1BQU0sS0FBSyxXQUFXLFFBQVE7QUFDM0MsVUFBTSxVQUFVLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQzlDLFVBQU0sb0JBQW9CLFFBQVEsU0FBUyxJQUFJLElBQUksVUFBVSxHQUFHLE9BQU87QUFBQTtBQUN2RSxVQUFNLFlBQVksUUFBUSxXQUFXLElBQ2pDLEtBQ0EsUUFBUSxTQUFTLE1BQU0sSUFDckIsS0FDQSxRQUFRLFNBQVMsSUFBSSxJQUNuQixPQUNBO0FBQ1IsVUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLE1BQU0sR0FBRyxPQUFPLEdBQUcsU0FBUyxHQUFHLGlCQUFpQixFQUFFO0FBQzlFLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLFlBQVksVUFBa0IsU0FBaUM7QUFDbkUsVUFBTSxPQUFPLE1BQU0sS0FBSyxXQUFXLFFBQVE7QUFDM0MsVUFBTSxvQkFBb0IsUUFBUSxTQUFTLElBQUksSUFBSSxVQUFVLEdBQUcsT0FBTztBQUFBO0FBQ3ZFLFVBQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxNQUFNLGlCQUFpQjtBQUNuRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxxQkFBcUIsVUFBbUM7QUFDNUQsVUFBTSxpQkFBYSxnQ0FBYyxRQUFRO0FBQ3pDLFFBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxzQkFBc0IsVUFBVSxHQUFHO0FBQ3JELGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxXQUFXLFdBQVcsWUFBWSxHQUFHO0FBQzNDLFVBQU0sT0FBTyxhQUFhLEtBQUssYUFBYSxXQUFXLE1BQU0sR0FBRyxRQUFRO0FBQ3hFLFVBQU0sWUFBWSxhQUFhLEtBQUssS0FBSyxXQUFXLE1BQU0sUUFBUTtBQUVsRSxRQUFJLFVBQVU7QUFDZCxXQUFPLE1BQU07QUFDWCxZQUFNLFlBQVksR0FBRyxJQUFJLElBQUksT0FBTyxHQUFHLFNBQVM7QUFDaEQsVUFBSSxDQUFDLEtBQUssSUFBSSxNQUFNLHNCQUFzQixTQUFTLEdBQUc7QUFDcEQsZUFBTztBQUFBLE1BQ1Q7QUFDQSxpQkFBVztBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLG9CQUFvQixVQUFrQixTQUFpQztBQUMzRSxVQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVcsVUFBVSxLQUFLLE9BQU87QUFBQTtBQUFBLENBQU07QUFDL0QsVUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQzNDLFFBQUksQ0FBQyxLQUFLLEtBQUssR0FBRztBQUNoQixZQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sTUFBTSxLQUFLLE9BQU87QUFBQTtBQUFBLENBQU07QUFBQSxJQUN0RDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLG9CQUFzQztBQUMxQyxXQUFPLEtBQUssSUFBSSxNQUFNLGlCQUFpQjtBQUFBLEVBQ3pDO0FBQ0Y7QUFFQSxTQUFTLGFBQWEsVUFBMEI7QUFDOUMsUUFBTSxpQkFBYSxnQ0FBYyxRQUFRO0FBQ3pDLFFBQU0sUUFBUSxXQUFXLFlBQVksR0FBRztBQUN4QyxTQUFPLFVBQVUsS0FBSyxLQUFLLFdBQVcsTUFBTSxHQUFHLEtBQUs7QUFDdEQ7OztBQzNIQSxJQUFBQyxtQkFBNEM7QUFVckMsSUFBTSxjQUFOLGNBQTBCLHVCQUFNO0FBQUEsRUFLckMsWUFBWSxLQUEyQixTQUE2QjtBQUNsRSxVQUFNLEdBQUc7QUFENEI7QUFIdkMsU0FBUSxVQUFVO0FBQUEsRUFLbEI7QUFBQSxFQUVBLGFBQXFDO0FBQ25DLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixXQUFLLFVBQVU7QUFDZixXQUFLLEtBQUs7QUFBQSxJQUNaLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxTQUFlO0FBMUJqQjtBQTJCSSxVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsTUFBTTtBQUNoQixjQUFVLFNBQVMsYUFBYTtBQUNoQyxjQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxRQUFRLE1BQU0sQ0FBQztBQUVyRCxRQUFJLEtBQUssUUFBUSxXQUFXO0FBQzFCLFlBQU0sV0FBVyxVQUFVLFNBQVMsWUFBWTtBQUFBLFFBQzlDLEtBQUs7QUFBQSxRQUNMLE1BQU07QUFBQSxVQUNKLGNBQWEsVUFBSyxRQUFRLGdCQUFiLFlBQTRCO0FBQUEsVUFDekMsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGLENBQUM7QUFDRCxlQUFTLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUM5QyxZQUFJLE1BQU0sUUFBUSxZQUFZLE1BQU0sV0FBVyxNQUFNLFVBQVU7QUFDN0QsZ0JBQU0sZUFBZTtBQUNyQixlQUFLLEtBQUssT0FBTztBQUFBLFFBQ25CO0FBQUEsTUFDRixDQUFDO0FBQ0QsV0FBSyxVQUFVO0FBQUEsSUFDakIsT0FBTztBQUNMLFlBQU0sUUFBUSxVQUFVLFNBQVMsU0FBUztBQUFBLFFBQ3hDLEtBQUs7QUFBQSxRQUNMLE1BQU07QUFBQSxVQUNKLGNBQWEsVUFBSyxRQUFRLGdCQUFiLFlBQTRCO0FBQUEsVUFDekMsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGLENBQUM7QUFDRCxZQUFNLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUMzQyxZQUFJLE1BQU0sUUFBUSxTQUFTO0FBQ3pCLGdCQUFNLGVBQWU7QUFDckIsZUFBSyxLQUFLLE9BQU87QUFBQSxRQUNuQjtBQUFBLE1BQ0YsQ0FBQztBQUNELFdBQUssVUFBVTtBQUFBLElBQ2pCO0FBRUEsU0FBSyxRQUFRLE1BQU07QUFFbkIsUUFBSSx5QkFBUSxTQUFTLEVBQ2xCO0FBQUEsTUFBVSxDQUFDLFdBQVE7QUFuRTFCLFlBQUFDO0FBb0VRLHNCQUFPLGVBQWNBLE1BQUEsS0FBSyxRQUFRLGdCQUFiLE9BQUFBLE1BQTRCLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxNQUFNO0FBQ2hGLGVBQUssS0FBSyxPQUFPO0FBQUEsUUFDbkIsQ0FBQztBQUFBO0FBQUEsSUFDSCxFQUNDO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxjQUFjLFFBQVEsRUFBRSxRQUFRLE1BQU07QUFDM0MsYUFBSyxPQUFPLElBQUk7QUFBQSxNQUNsQixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0o7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsU0FBSyxVQUFVLE1BQU07QUFDckIsUUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQixXQUFLLE9BQU8sSUFBSTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxTQUF3QjtBQUNwQyxVQUFNLFFBQVEscUJBQXFCLEtBQUssUUFBUSxLQUFLLEVBQUUsS0FBSztBQUM1RCxRQUFJLENBQUMsT0FBTztBQUNWLFVBQUksd0JBQU8sd0JBQXdCO0FBQ25DO0FBQUEsSUFDRjtBQUNBLFNBQUssT0FBTyxLQUFLO0FBQUEsRUFDbkI7QUFBQSxFQUVRLE9BQU8sT0FBNEI7QUFDekMsUUFBSSxLQUFLLFNBQVM7QUFDaEI7QUFBQSxJQUNGO0FBQ0EsU0FBSyxVQUFVO0FBQ2YsU0FBSyxRQUFRLEtBQUs7QUFDbEIsU0FBSyxNQUFNO0FBQUEsRUFDYjtBQUNGO0FBRU8sSUFBTSxjQUFOLGNBQTBCLHVCQUFNO0FBQUEsRUFDckMsWUFDRSxLQUNpQixXQUNBLFVBQ2pCO0FBQ0EsVUFBTSxHQUFHO0FBSFE7QUFDQTtBQUFBLEVBR25CO0FBQUEsRUFFQSxTQUFlO0FBQ2IsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUN0QixjQUFVLE1BQU07QUFDaEIsY0FBVSxTQUFTLGFBQWE7QUFDaEMsY0FBVSxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssVUFBVSxDQUFDO0FBQ2pELGNBQVUsU0FBUyxPQUFPO0FBQUEsTUFDeEIsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYixDQUFDO0FBQUEsRUFDSDtBQUNGOzs7QUM1SEEsSUFBQUMsbUJBQW1DO0FBTTVCLElBQU0sbUJBQU4sY0FBK0IsdUJBQU07QUFBQSxFQXFCMUMsWUFDRSxLQUNpQixTQUNBLGVBQ0Esa0JBQ2pCO0FBQ0EsVUFBTSxHQUFHO0FBSlE7QUFDQTtBQUNBO0FBeEJuQixTQUFRLGVBQWU7QUFDdkIsU0FBaUIsZ0JBQWdCLENBQUMsVUFBK0I7QUFDL0QsVUFBSSxNQUFNLFdBQVcsTUFBTSxXQUFXLE1BQU0sUUFBUTtBQUNsRDtBQUFBLE1BQ0Y7QUFFQSxZQUFNLFNBQVMsTUFBTTtBQUNyQixVQUFJLFdBQVcsT0FBTyxZQUFZLFdBQVcsT0FBTyxZQUFZLGFBQWE7QUFDM0U7QUFBQSxNQUNGO0FBRUEsWUFBTSxTQUFTLFlBQVksTUFBTSxHQUFHO0FBQ3BDLFVBQUksQ0FBQyxRQUFRO0FBQ1g7QUFBQSxNQUNGO0FBRUEsWUFBTSxlQUFlO0FBQ3JCLFdBQUssS0FBSyxhQUFhLE1BQU07QUFBQSxJQUMvQjtBQUFBLEVBU0E7QUFBQSxFQUVBLFNBQWU7QUFDYixXQUFPLGlCQUFpQixXQUFXLEtBQUssYUFBYTtBQUNyRCxTQUFLLE9BQU87QUFBQSxFQUNkO0FBQUEsRUFFQSxVQUFnQjtBQUNkLFdBQU8sb0JBQW9CLFdBQVcsS0FBSyxhQUFhO0FBQ3hELFNBQUssVUFBVSxNQUFNO0FBQUEsRUFDdkI7QUFBQSxFQUVRLFNBQWU7QUFDckIsU0FBSyxVQUFVLE1BQU07QUFDckIsU0FBSyxVQUFVLFNBQVMsYUFBYTtBQUNyQyxTQUFLLFVBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUV2RCxRQUFJLENBQUMsS0FBSyxRQUFRLFFBQVE7QUFDeEIsV0FBSyxVQUFVLFNBQVMsS0FBSyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDaEU7QUFBQSxJQUNGO0FBRUEsVUFBTSxRQUFRLEtBQUssUUFBUSxLQUFLLFlBQVk7QUFDNUMsU0FBSyxVQUFVLFNBQVMsT0FBTztBQUFBLE1BQzdCLE1BQU0sU0FBUyxLQUFLLGVBQWUsQ0FBQyxPQUFPLEtBQUssUUFBUSxNQUFNO0FBQUEsSUFDaEUsQ0FBQztBQUNELFNBQUssVUFBVSxTQUFTLE1BQU07QUFBQSxNQUM1QixNQUFNLE1BQU0sV0FBVztBQUFBLElBQ3pCLENBQUM7QUFDRCxTQUFLLFVBQVUsU0FBUyxPQUFPO0FBQUEsTUFDN0IsS0FBSztBQUFBLE1BQ0wsTUFBTSxNQUFNLFFBQVEsTUFBTSxXQUFXO0FBQUEsSUFDdkMsQ0FBQztBQUNELFNBQUssVUFBVSxTQUFTLEtBQUs7QUFBQSxNQUMzQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxZQUFZLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQzVFLFNBQUssVUFBVSxXQUFXLGlCQUFpQixNQUFNO0FBQ2pELFNBQUssVUFBVSxXQUFXLG1CQUFtQixNQUFNO0FBQ25ELFNBQUssVUFBVSxXQUFXLHFCQUFxQixTQUFTO0FBQ3hELFNBQUssVUFBVSxXQUFXLG1CQUFtQixNQUFNO0FBQ25ELFNBQUssVUFBVSxXQUFXLFFBQVEsTUFBTTtBQUFBLEVBQzFDO0FBQUEsRUFFUSxVQUFVLFdBQXdCLE9BQWUsUUFBNEI7QUFDbkYsY0FBVSxTQUFTLFVBQVU7QUFBQSxNQUMzQixLQUFLLFdBQVcsU0FBUyxzQ0FBc0M7QUFBQSxNQUMvRCxNQUFNO0FBQUEsSUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxXQUFLLEtBQUssYUFBYSxNQUFNO0FBQUEsSUFDL0IsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLE1BQWMsYUFBYSxRQUFxQztBQUM5RCxVQUFNLFFBQVEsS0FBSyxRQUFRLEtBQUssWUFBWTtBQUM1QyxRQUFJLENBQUMsT0FBTztBQUNWLFdBQUssTUFBTTtBQUNYO0FBQUEsSUFDRjtBQUVBLFFBQUk7QUFDRixVQUFJLFVBQVU7QUFDZCxVQUFJLFdBQVcsUUFBUTtBQUNyQixrQkFBVSxNQUFNLEtBQUssY0FBYyxjQUFjLEtBQUs7QUFBQSxNQUN4RCxXQUFXLFdBQVcsV0FBVztBQUMvQixrQkFBVSxNQUFNLEtBQUssY0FBYyxnQkFBZ0IsS0FBSztBQUFBLE1BQzFELFdBQVcsV0FBVyxRQUFRO0FBQzVCLGtCQUFVLE1BQU0sS0FBSyxjQUFjLGNBQWMsS0FBSztBQUFBLE1BQ3hELFdBQVcsV0FBVyxRQUFRO0FBQzVCLGtCQUFVLE1BQU0sS0FBSyxjQUFjLFVBQVUsS0FBSztBQUFBLE1BQ3BELE9BQU87QUFDTCxrQkFBVSxNQUFNLEtBQUssY0FBYyxVQUFVLEtBQUs7QUFBQSxNQUNwRDtBQUVBLFVBQUk7QUFDRixZQUFJLEtBQUssa0JBQWtCO0FBQ3pCLGdCQUFNLEtBQUssaUJBQWlCLE9BQU87QUFBQSxRQUNyQyxPQUFPO0FBQ0wsY0FBSSx3QkFBTyxPQUFPO0FBQUEsUUFDcEI7QUFBQSxNQUNGLFNBQVMsT0FBTztBQUNkLGdCQUFRLE1BQU0sS0FBSztBQUFBLE1BQ3JCO0FBRUEsV0FBSyxnQkFBZ0I7QUFFckIsVUFBSSxLQUFLLGdCQUFnQixLQUFLLFFBQVEsUUFBUTtBQUM1QyxZQUFJLHdCQUFPLHVCQUF1QjtBQUNsQyxhQUFLLE1BQU07QUFDWDtBQUFBLE1BQ0Y7QUFFQSxXQUFLLE9BQU87QUFBQSxJQUNkLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLFVBQUksd0JBQU8sK0JBQStCO0FBQUEsSUFDNUM7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLFlBQVksS0FBa0M7QUFDckQsVUFBUSxJQUFJLFlBQVksR0FBRztBQUFBLElBQ3pCLEtBQUs7QUFDSCxhQUFPO0FBQUEsSUFDVCxLQUFLO0FBQ0gsYUFBTztBQUFBLElBQ1QsS0FBSztBQUNILGFBQU87QUFBQSxJQUNULEtBQUs7QUFDSCxhQUFPO0FBQUEsSUFDVCxLQUFLO0FBQ0gsYUFBTztBQUFBLElBQ1Q7QUFDRSxhQUFPO0FBQUEsRUFDWDtBQUNGOzs7QUN0SkEsSUFBQUMsbUJBQTBDO0FBSW5DLElBQU0scUJBQU4sY0FBaUMsdUJBQU07QUFBQSxFQUM1QyxZQUNFLEtBQ2lCLFNBQ0EsUUFDakI7QUFDQSxVQUFNLEdBQUc7QUFIUTtBQUNBO0FBQUEsRUFHbkI7QUFBQSxFQUVBLFNBQWU7QUFDYixVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsTUFBTTtBQUNoQixjQUFVLFNBQVMsYUFBYTtBQUNoQyxjQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFbkQsUUFBSSxDQUFDLEtBQUssUUFBUSxRQUFRO0FBQ3hCLGdCQUFVLFNBQVMsS0FBSyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDekQ7QUFBQSxJQUNGO0FBRUEsY0FBVSxTQUFTLEtBQUs7QUFBQSxNQUN0QixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsZUFBVyxTQUFTLEtBQUssU0FBUztBQUNoQyxZQUFNLE1BQU0sVUFBVSxTQUFTLFdBQVcsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ2xFLFVBQUksU0FBUyxNQUFNLEVBQUUsTUFBTSxNQUFNLFdBQVcsZ0JBQWdCLENBQUM7QUFDN0QsVUFBSSxTQUFTLEtBQUs7QUFBQSxRQUNoQixNQUFNLEdBQUcsTUFBTSxTQUFTLFdBQU0sTUFBTSxNQUFNO0FBQUEsTUFDNUMsQ0FBQztBQUNELFVBQUksU0FBUyxPQUFPO0FBQUEsUUFDbEIsS0FBSztBQUFBLFFBQ0wsTUFBTSxNQUFNLFdBQVc7QUFBQSxNQUN6QixDQUFDO0FBRUQsWUFBTSxVQUFVLElBQUksU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUMvRCxjQUFRLFNBQVMsVUFBVTtBQUFBLFFBQ3pCLEtBQUs7QUFBQSxRQUNMLE1BQU07QUFBQSxNQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLGFBQUssS0FBSyxRQUFRLE1BQU0sVUFBVTtBQUFBLE1BQ3BDLENBQUM7QUFDRCxjQUFRLFNBQVMsVUFBVTtBQUFBLFFBQ3pCLEtBQUs7QUFBQSxRQUNMLE1BQU07QUFBQSxNQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLGFBQUssS0FBSyxZQUFZLEtBQUs7QUFBQSxNQUM3QixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsU0FBSyxVQUFVLE1BQU07QUFBQSxFQUN2QjtBQUFBLEVBRUEsTUFBYyxRQUFRLE1BQTZCO0FBM0RyRDtBQTRESSxVQUFNLGVBQWUsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLElBQUk7QUFDOUQsUUFBSSxFQUFFLHdCQUF3Qix5QkFBUTtBQUNwQyxVQUFJLHdCQUFPLDJCQUEyQjtBQUN0QztBQUFBLElBQ0Y7QUFFQSxVQUFNLFFBQU8sVUFBSyxJQUFJLFVBQVUsUUFBUSxLQUFLLE1BQWhDLFlBQXFDLEtBQUssSUFBSSxVQUFVLGFBQWEsS0FBSztBQUN2RixRQUFJLENBQUMsTUFBTTtBQUNULFVBQUksd0JBQU8sMkJBQTJCO0FBQ3RDO0FBQUEsSUFDRjtBQUVBLFVBQU0sS0FBSyxTQUFTLFlBQVk7QUFDaEMsU0FBSyxJQUFJLFVBQVUsV0FBVyxJQUFJO0FBQUEsRUFDcEM7QUFBQSxFQUVBLE1BQWMsWUFBWSxPQUFzQztBQUM5RCxRQUFJO0FBQ0YsWUFBTSxVQUFVLE1BQU0sS0FBSyxPQUFPLGtCQUFrQixLQUFLO0FBQ3pELFVBQUksd0JBQU8sT0FBTztBQUNsQixXQUFLLE1BQU07QUFBQSxJQUNiLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLFVBQUksd0JBQU8sK0JBQStCO0FBQUEsSUFDNUM7QUFBQSxFQUNGO0FBQ0Y7OztBQ3RGQSxJQUFBQyxtQkFBZ0Q7QUFJekMsSUFBTSxrQkFBa0I7QUFFeEIsSUFBTSxtQkFBTixjQUErQiwwQkFBUztBQUFBLEVBVTdDLFlBQVksTUFBc0MsUUFBcUI7QUFDckUsVUFBTSxJQUFJO0FBRHNDO0FBQUEsRUFFbEQ7QUFBQSxFQUVBLGNBQXNCO0FBQ3BCLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxpQkFBeUI7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLFVBQWtCO0FBQ2hCLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLFNBQXdCO0FBQzVCLFNBQUssVUFBVSxNQUFNO0FBQ3JCLFNBQUssVUFBVSxTQUFTLGVBQWU7QUFFdkMsVUFBTSxTQUFTLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUNyRSxXQUFPLFNBQVMsTUFBTSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQ3ZDLFdBQU8sU0FBUyxLQUFLO0FBQUEsTUFDbkIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFNBQUsscUJBQXFCO0FBQzFCLFNBQUssb0JBQW9CO0FBQ3pCLFNBQUssZ0JBQWdCO0FBQ3JCLFNBQUssb0JBQW9CO0FBQ3pCLFNBQUssb0JBQW9CO0FBQ3pCLFVBQU0sS0FBSyxjQUFjO0FBQUEsRUFDM0I7QUFBQSxFQUVBLFVBQXlCO0FBQ3ZCLFdBQU8sUUFBUSxRQUFRO0FBQUEsRUFDekI7QUFBQSxFQUVBLGNBQWMsTUFBb0I7QUFDaEMsU0FBSyxTQUFTLFFBQVEsSUFBSTtBQUFBLEVBQzVCO0FBQUEsRUFFQSxlQUFlLE1BQW9CO0FBQ2pDLFNBQUssVUFBVSxRQUFRLElBQUk7QUFBQSxFQUM3QjtBQUFBLEVBRUEsTUFBTSxnQkFBK0I7QUFDbkMsUUFBSSxLQUFLLGNBQWM7QUFDckIsWUFBTSxhQUFhLE1BQU0sS0FBSyxPQUFPLGNBQWM7QUFDbkQsV0FBSyxhQUFhLFFBQVEsR0FBRyxVQUFVLGlCQUFpQjtBQUFBLElBQzFEO0FBQ0EsUUFBSSxLQUFLLGFBQWE7QUFDcEIsWUFBTSxZQUFZLE1BQU0sS0FBSyxPQUFPLGlCQUFpQjtBQUNyRCxXQUFLLFlBQVksUUFBUSxHQUFHLFNBQVMsYUFBYTtBQUFBLElBQ3BEO0FBQ0EsUUFBSSxLQUFLLGlCQUFpQjtBQUN4QixZQUFNLGNBQWMsTUFBTSxLQUFLLE9BQU8sc0JBQXNCO0FBQzVELFdBQUssZ0JBQWdCLFFBQVEsbUJBQW1CLFdBQVcsT0FBTztBQUFBLElBQ3BFO0FBQ0EsUUFBSSxLQUFLLFlBQVk7QUFDbkIsV0FBSyxXQUFXLFFBQVEsS0FBSyxPQUFPLGdCQUFnQixDQUFDO0FBQUEsSUFDdkQ7QUFDQSxRQUFJLEtBQUssaUJBQWlCO0FBQ3hCLFdBQUssZ0JBQWdCLFFBQVEsS0FBSyxPQUFPLG9CQUFvQixDQUFDO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQUEsRUFFUSx1QkFBNkI7QUFDbkMsVUFBTSxVQUFVLEtBQUssVUFBVSxTQUFTLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBQ0QsWUFBUSxTQUFTLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRWhELFNBQUssVUFBVSxRQUFRLFNBQVMsWUFBWTtBQUFBLE1BQzFDLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxRQUNKLGFBQWE7QUFBQSxRQUNiLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRixDQUFDO0FBRUQsVUFBTSxVQUFVLFFBQVEsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUNuRSxZQUFRLFNBQVMsVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLFdBQUssS0FBSyxXQUFXO0FBQUEsSUFDdkIsQ0FBQztBQUNELFlBQVEsU0FBUyxVQUFVO0FBQUEsTUFDekIsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLElBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsV0FBSyxLQUFLLFdBQVc7QUFBQSxJQUN2QixDQUFDO0FBQ0QsWUFBUSxTQUFTLFVBQVU7QUFBQSxNQUN6QixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxXQUFLLEtBQUssY0FBYztBQUFBLElBQzFCLENBQUM7QUFDRCxZQUFRLFNBQVMsVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLFdBQUssUUFBUSxRQUFRO0FBQ3JCLFVBQUksd0JBQU8saUJBQWlCO0FBQUEsSUFDOUIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVRLHNCQUE0QjtBQUNsQyxVQUFNLFVBQVUsS0FBSyxVQUFVLFNBQVMsV0FBVztBQUFBLE1BQ2pELEtBQUs7QUFBQSxJQUNQLENBQUM7QUFDRCxZQUFRLFNBQVMsTUFBTSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXpDLFVBQU0sVUFBVSxRQUFRLFNBQVMsT0FBTyxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDbkUsWUFBUSxTQUFTLFVBQVU7QUFBQSxNQUN6QixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxXQUFLLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQztBQUNELFlBQVEsU0FBUyxVQUFVO0FBQUEsTUFDekIsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLElBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsV0FBSyxLQUFLLE9BQU8sa0JBQWtCO0FBQUEsSUFDckMsQ0FBQztBQUNELFlBQVEsU0FBUyxVQUFVO0FBQUEsTUFDekIsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLElBQ1IsQ0FBQyxFQUFFLGlCQUFpQixTQUFTLE1BQU07QUFDakMsV0FBSyxLQUFLLE9BQU8seUJBQXlCLEdBQUcsT0FBTztBQUFBLElBQ3RELENBQUM7QUFDRCxZQUFRLFNBQVMsVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLFdBQUssS0FBSyxPQUFPLHlCQUF5QixHQUFHLE1BQU07QUFBQSxJQUNyRCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRVEsa0JBQXdCO0FBQzlCLFVBQU0sVUFBVSxLQUFLLFVBQVUsU0FBUyxXQUFXO0FBQUEsTUFDakQsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUNELFlBQVEsU0FBUyxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFN0MsVUFBTSxVQUFVLFFBQVEsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUNuRSxZQUFRLFNBQVMsVUFBVTtBQUFBLE1BQ3pCLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUMsRUFBRSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLFdBQUssS0FBSyxnQkFBZ0I7QUFBQSxJQUM1QixDQUFDO0FBRUQsUUFBSSxLQUFLLE9BQU8sU0FBUyxpQkFBaUI7QUFDeEMsY0FBUSxTQUFTLFVBQVU7QUFBQSxRQUN6QixLQUFLO0FBQUEsUUFDTCxNQUFNO0FBQUEsTUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxhQUFLLEtBQUssVUFBVTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUFBLEVBRVEsc0JBQTRCO0FBQ2xDLFVBQU0sVUFBVSxLQUFLLFVBQVUsU0FBUyxXQUFXO0FBQUEsTUFDakQsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUNELFlBQVEsU0FBUyxNQUFNLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFekMsVUFBTSxXQUFXLFFBQVEsU0FBUyxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNwRSxTQUFLLGVBQWU7QUFFcEIsVUFBTSxVQUFVLFFBQVEsU0FBUyxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRSxTQUFLLGNBQWM7QUFFbkIsVUFBTSxZQUFZLFFBQVEsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUNyRSxTQUFLLGtCQUFrQixVQUFVLFNBQVMsUUFBUSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDeEYsY0FBVSxTQUFTLFVBQVU7QUFBQSxNQUMzQixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDLEVBQUUsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxXQUFLLEtBQUssT0FBTyxrQkFBa0I7QUFBQSxJQUNyQyxDQUFDO0FBRUQsVUFBTSxRQUFRLFFBQVEsU0FBUyxLQUFLLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUM5RCxTQUFLLGFBQWE7QUFFbEIsVUFBTSxhQUFhLFFBQVEsU0FBUyxLQUFLLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RSxTQUFLLGtCQUFrQjtBQUFBLEVBQ3pCO0FBQUEsRUFFUSxzQkFBNEI7QUFDbEMsVUFBTSxVQUFVLEtBQUssVUFBVSxTQUFTLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBQ0QsWUFBUSxTQUFTLE1BQU0sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUV6QyxZQUFRLFNBQVMsTUFBTSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzlDLFNBQUssV0FBVyxRQUFRLFNBQVMsT0FBTztBQUFBLE1BQ3RDLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxZQUFRLFNBQVMsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQy9DLFNBQUssWUFBWSxRQUFRLFNBQVMsT0FBTztBQUFBLE1BQ3ZDLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxNQUFjLGFBQTRCO0FBQ3hDLFVBQU0sS0FBSztBQUFBLE1BQ1QsQ0FBQyxTQUFTLEtBQUssT0FBTyxZQUFZLElBQUk7QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLGFBQTRCO0FBQ3hDLFVBQU0sS0FBSztBQUFBLE1BQ1QsQ0FBQyxTQUFTLEtBQUssT0FBTyxZQUFZLElBQUk7QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLGdCQUErQjtBQUMzQyxVQUFNLEtBQUs7QUFBQSxNQUNULENBQUMsU0FBUyxLQUFLLE9BQU8sZUFBZSxJQUFJO0FBQUEsTUFDekM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxrQkFBaUM7QUFDN0MsUUFBSTtBQUNGLFlBQU0sU0FBUyxNQUFNLEtBQUssT0FBTyxhQUFhO0FBQzlDLFdBQUssVUFBVSxRQUFRLE9BQU8sT0FBTztBQUNyQyxXQUFLO0FBQUEsUUFDSCxPQUFPLFNBQVMseUJBQXlCO0FBQUEsTUFDM0M7QUFBQSxJQUNGLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLFVBQUksd0JBQU8sNEJBQTRCO0FBQUEsSUFDekM7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLFlBQTJCO0FBQ3ZDLFVBQU0sT0FBTyxLQUFLLFFBQVEsTUFBTSxLQUFLO0FBQ3JDLFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSx3QkFBTyx3QkFBd0I7QUFDbkM7QUFBQSxJQUNGO0FBRUEsUUFBSTtBQUNGLFlBQU0sUUFBUSxNQUFNLEtBQUssT0FBTyxVQUFVLElBQUk7QUFDOUMsVUFBSSxDQUFDLE9BQU87QUFDVixZQUFJLHdCQUFPLHFDQUFxQztBQUNoRDtBQUFBLE1BQ0Y7QUFDQSxVQUFJLFVBQVUsUUFBUTtBQUNwQixjQUFNLEtBQUs7QUFBQSxVQUNULE1BQU0sS0FBSyxPQUFPLFlBQVksSUFBSTtBQUFBLFVBQ2xDO0FBQUEsUUFDRjtBQUFBLE1BQ0YsV0FBVyxVQUFVLFFBQVE7QUFDM0IsY0FBTSxLQUFLO0FBQUEsVUFDVCxNQUFNLEtBQUssT0FBTyxZQUFZLElBQUk7QUFBQSxVQUNsQztBQUFBLFFBQ0Y7QUFBQSxNQUNGLE9BQU87QUFDTCxjQUFNLEtBQUs7QUFBQSxVQUNULE1BQU0sS0FBSyxPQUFPLGVBQWUsSUFBSTtBQUFBLFVBQ3JDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLFVBQUksd0JBQU8sOEJBQThCO0FBQUEsSUFDM0M7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLGVBQ1osUUFDQSxnQkFDZTtBQUNmLFVBQU0sT0FBTyxLQUFLLFFBQVEsTUFBTSxLQUFLO0FBQ3JDLFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSx3QkFBTyx3QkFBd0I7QUFDbkM7QUFBQSxJQUNGO0FBRUEsUUFBSTtBQUNGLFlBQU0sU0FBUyxNQUFNLE9BQU8sSUFBSTtBQUNoQyxZQUFNLEtBQUssT0FBTyxtQkFBbUIsTUFBTTtBQUMzQyxXQUFLLFFBQVEsUUFBUTtBQUFBLElBQ3ZCLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLFVBQUksd0JBQU8sY0FBYztBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUNGOzs7QW5CalNBLElBQXFCLGNBQXJCLGNBQXlDLHdCQUFPO0FBQUEsRUFBaEQ7QUFBQTtBQVdFLFNBQVEsY0FBdUM7QUFDL0MsU0FBUSxnQkFBNkI7QUFBQTtBQUFBLEVBRXJDLE1BQU0sU0FBd0I7QUFDNUIsVUFBTSxLQUFLLGFBQWE7QUFFeEIsU0FBSyxlQUFlLElBQUksYUFBYSxLQUFLLEdBQUc7QUFDN0MsU0FBSyxZQUFZLElBQUksZUFBZTtBQUNwQyxTQUFLLGVBQWUsSUFBSSxhQUFhLEtBQUssY0FBYyxNQUFNLEtBQUssUUFBUTtBQUMzRSxTQUFLLGNBQWMsSUFBSSxZQUFZLEtBQUssY0FBYyxNQUFNLEtBQUssUUFBUTtBQUN6RSxTQUFLLGNBQWMsSUFBSSxZQUFZLEtBQUssY0FBYyxNQUFNLEtBQUssUUFBUTtBQUN6RSxTQUFLLGlCQUFpQixJQUFJO0FBQUEsTUFDeEIsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYjtBQUNBLFNBQUssbUJBQW1CLElBQUk7QUFBQSxNQUMxQixLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUs7QUFBQSxJQUNiO0FBQ0EsU0FBSyxnQkFBZ0IsSUFBSTtBQUFBLE1BQ3ZCLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSztBQUFBLElBQ2I7QUFDQSxTQUFLLGlCQUFpQixJQUFJO0FBQUEsTUFDeEIsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYjtBQUVBLFVBQU0sS0FBSyxhQUFhLG1CQUFtQixLQUFLLFFBQVE7QUFFeEQsU0FBSyxhQUFhLGlCQUFpQixDQUFDLFNBQVM7QUFDM0MsWUFBTSxPQUFPLElBQUksaUJBQWlCLE1BQU0sSUFBSTtBQUM1QyxXQUFLLGNBQWM7QUFDbkIsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZO0FBQ3BCLGNBQU0sS0FBSyxpQkFBaUIsZ0JBQWdCLGFBQWEsT0FBTyxTQUFTO0FBQ3ZFLGdCQUFNLFFBQVEsTUFBTSxLQUFLLFlBQVksV0FBVyxJQUFJO0FBQ3BELGlCQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxRQUNwQyxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZO0FBQ3BCLGNBQU0sS0FBSyxpQkFBaUIsWUFBWSxhQUFhLE9BQU8sU0FBUztBQUNuRSxnQkFBTSxRQUFRLE1BQU0sS0FBSyxZQUFZLFdBQVcsSUFBSTtBQUNwRCxpQkFBTyxpQkFBaUIsTUFBTSxJQUFJO0FBQUEsUUFDcEMsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsWUFBWTtBQUNwQixjQUFNLEtBQUs7QUFBQSxVQUNUO0FBQUEsVUFDQTtBQUFBLFVBQ0EsT0FBTyxTQUFTO0FBQ2Qsa0JBQU0sUUFBUSxNQUFNLEtBQUssZUFBZSxZQUFZLElBQUk7QUFDeEQsbUJBQU8sMEJBQTBCLE1BQU0sSUFBSTtBQUFBLFVBQzdDO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLFlBQVk7QUFDcEIsY0FBTSxLQUFLLGFBQWE7QUFBQSxNQUMxQjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZO0FBQ3BCLGNBQU0sS0FBSyxrQkFBa0I7QUFBQSxNQUMvQjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZO0FBQ3BCLGNBQU0sS0FBSyx5QkFBeUI7QUFBQSxNQUN0QztBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZO0FBQ3BCLGNBQU0sS0FBSyx5QkFBeUIsR0FBRyxPQUFPO0FBQUEsTUFDaEQ7QUFBQSxJQUNGLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsWUFBWTtBQUNwQixjQUFNLEtBQUsseUJBQXlCLEdBQUcsTUFBTTtBQUFBLE1BQy9DO0FBQUEsSUFDRixDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLFlBQVk7QUFDcEIsY0FBTSxLQUFLLHFCQUFxQjtBQUFBLE1BQ2xDO0FBQUEsSUFDRixDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLFlBQVk7QUFDcEIsY0FBTSxLQUFLLGtCQUFrQjtBQUFBLE1BQy9CO0FBQUEsSUFDRixDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLFlBQVk7QUFDcEIsY0FBTSxLQUFLLFlBQVk7QUFBQSxNQUN6QjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssY0FBYyxJQUFJLGdCQUFnQixLQUFLLEtBQUssSUFBSSxDQUFDO0FBQUEsRUFDeEQ7QUFBQSxFQUVBLFdBQWlCO0FBQ2YsU0FBSyxjQUFjO0FBQUEsRUFDckI7QUFBQSxFQUVBLE1BQU0sZUFBOEI7QUE3THRDO0FBOExJLFVBQU0sVUFBVSxXQUFNLEtBQUssU0FBUyxNQUFwQixZQUEwQixDQUFDO0FBQzNDLFNBQUssV0FBVyx1QkFBdUIsTUFBTTtBQUFBLEVBQy9DO0FBQUEsRUFFQSxNQUFNLGVBQThCO0FBQ2xDLFNBQUssV0FBVyx1QkFBdUIsS0FBSyxRQUFRO0FBQ3BELFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUNqQyxVQUFNLEtBQUssYUFBYSxtQkFBbUIsS0FBSyxRQUFRO0FBQ3hELFVBQU0sS0FBSyxxQkFBcUI7QUFBQSxFQUNsQztBQUFBLEVBRUEsTUFBTSxjQUE2QjtBQUNqQyxVQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsYUFBYSxLQUFLO0FBQ2xELFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSx3QkFBTyw0QkFBNEI7QUFDdkM7QUFBQSxJQUNGO0FBQ0EsVUFBTSxLQUFLLGFBQWE7QUFBQSxNQUN0QixNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsSUFDVixDQUFDO0FBQ0QsU0FBSyxJQUFJLFVBQVUsV0FBVyxJQUFJO0FBQUEsRUFDcEM7QUFBQSxFQUVBLHFCQUE4QztBQUM1QyxVQUFNLFNBQVMsS0FBSyxJQUFJLFVBQVUsZ0JBQWdCLGVBQWU7QUFDakUsZUFBVyxRQUFRLFFBQVE7QUFDekIsWUFBTSxPQUFPLEtBQUs7QUFDbEIsVUFBSSxnQkFBZ0Isa0JBQWtCO0FBQ3BDLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxpQkFBMEI7QUFDeEIsV0FBTyxLQUFLLElBQUksVUFBVSxnQkFBZ0IsZUFBZSxFQUFFLFNBQVM7QUFBQSxFQUN0RTtBQUFBLEVBRUEsb0JBQW9CLE1BQW9CO0FBck8xQztBQXNPSSxlQUFLLG1CQUFtQixNQUF4QixtQkFBMkIsY0FBYztBQUFBLEVBQzNDO0FBQUEsRUFFQSxxQkFBcUIsTUFBb0I7QUF6TzNDO0FBME9JLGVBQUssbUJBQW1CLE1BQXhCLG1CQUEyQixlQUFlO0FBQUEsRUFDNUM7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBN085QztBQThPSSxZQUFNLFVBQUssbUJBQW1CLE1BQXhCLG1CQUEyQjtBQUFBLEVBQ25DO0FBQUEsRUFFQSxNQUFNLGlDQUFnRDtBQUNwRCxRQUFJO0FBQ0YsWUFBTSxLQUFLLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLG1CQUFtQixTQUFnQztBQUN2RCxRQUFJLHdCQUFPLE9BQU87QUFDbEIsU0FBSyxvQkFBb0IsT0FBTztBQUNoQyxVQUFNLEtBQUssK0JBQStCO0FBQUEsRUFDNUM7QUFBQSxFQUVBLHNCQUE4QjtBQUM1QixXQUFPLEtBQUssZ0JBQWdCLGtCQUFrQixLQUFLLGFBQWEsSUFBSTtBQUFBLEVBQ3RFO0FBQUEsRUFFQSxNQUFNLFVBQVUsTUFBc0M7QUFDcEQsUUFBSSxDQUFDLEtBQUssU0FBUyxpQkFBaUI7QUFDbEMsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLENBQUMsS0FBSyxTQUFTLGFBQWEsS0FBSyxLQUFLLENBQUMsS0FBSyxTQUFTLFlBQVksS0FBSyxHQUFHO0FBQzNFLFVBQUksd0JBQU8sb0RBQW9EO0FBQy9ELGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxRQUFRLE1BQU0sS0FBSyxVQUFVLFVBQVUsTUFBTSxLQUFLLFFBQVE7QUFDaEUsUUFBSSxPQUFPO0FBQ1QsV0FBSyxvQkFBb0Isa0JBQWtCLEtBQUssRUFBRTtBQUFBLElBQ3BEO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sZUFBdUM7QUFDM0MsVUFBTSxTQUFTLE1BQU0sS0FBSyxlQUFlLGdCQUFnQjtBQUN6RCxTQUFLLGdCQUFnQixvQkFBSSxLQUFLO0FBQzlCLFNBQUsscUJBQXFCLEdBQUcsT0FBTyxLQUFLO0FBQUE7QUFBQSxFQUFPLE9BQU8sT0FBTyxFQUFFO0FBQ2hFLFNBQUs7QUFBQSxNQUNILE9BQU8sU0FBUyxHQUFHLE9BQU8sS0FBSyx1QkFBdUIsR0FBRyxPQUFPLEtBQUs7QUFBQSxJQUN2RTtBQUNBLFVBQU0sS0FBSywrQkFBK0I7QUFDMUMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0seUJBQ0osY0FDQSxPQUN3QjtBQUN4QixVQUFNLFNBQVMsTUFBTSxLQUFLLGVBQWUsZ0JBQWdCLGNBQWMsS0FBSztBQUM1RSxTQUFLLGdCQUFnQixvQkFBSSxLQUFLO0FBQzlCLFNBQUsscUJBQXFCLEdBQUcsT0FBTyxLQUFLO0FBQUE7QUFBQSxFQUFPLE9BQU8sT0FBTyxFQUFFO0FBQ2hFLFNBQUs7QUFBQSxNQUNILE9BQU8sU0FBUyxHQUFHLE9BQU8sS0FBSyx1QkFBdUIsR0FBRyxPQUFPLEtBQUs7QUFBQSxJQUN2RTtBQUNBLFVBQU0sS0FBSywrQkFBK0I7QUFDMUMsUUFBSTtBQUFBLE1BQ0YsT0FBTyxnQkFDSCxHQUFHLE9BQU8sS0FBSyxhQUFhLE9BQU8sYUFBYSxLQUNoRCxPQUFPLFNBQ0wsR0FBRyxPQUFPLEtBQUssdUJBQ2YsR0FBRyxPQUFPLEtBQUs7QUFBQSxJQUN2QjtBQUNBLFFBQUksQ0FBQyxLQUFLLGVBQWUsR0FBRztBQUMxQixVQUFJLFlBQVksS0FBSyxLQUFLLFNBQVMsT0FBTyxLQUFLLElBQUksT0FBTyxPQUFPLEVBQUUsS0FBSztBQUFBLElBQzFFO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0saUJBQ0osT0FDQSxhQUNBLFFBQ0EsWUFBWSxPQUNHO0FBQ2YsVUFBTSxRQUFRLE1BQU0sSUFBSSxZQUFZLEtBQUssS0FBSztBQUFBLE1BQzVDO0FBQUEsTUFDQSxhQUFhLFlBQ1QsNkJBQ0E7QUFBQSxNQUNKO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQyxFQUFFLFdBQVc7QUFFZCxRQUFJLFVBQVUsTUFBTTtBQUNsQjtBQUFBLElBQ0Y7QUFFQSxRQUFJO0FBQ0YsWUFBTSxTQUFTLE1BQU0sT0FBTyxLQUFLO0FBQ2pDLFlBQU0sS0FBSyxtQkFBbUIsTUFBTTtBQUFBLElBQ3RDLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLFVBQUksd0JBQU8saUNBQWlDO0FBQUEsSUFDOUM7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLFlBQVksTUFBK0I7QUFDL0MsVUFBTSxRQUFRLE1BQU0sS0FBSyxZQUFZLFdBQVcsSUFBSTtBQUNwRCxXQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRUEsTUFBTSxZQUFZLE1BQStCO0FBQy9DLFVBQU0sUUFBUSxNQUFNLEtBQUssWUFBWSxXQUFXLElBQUk7QUFDcEQsV0FBTyxpQkFBaUIsTUFBTSxJQUFJO0FBQUEsRUFDcEM7QUFBQSxFQUVBLE1BQU0sZUFBZSxNQUErQjtBQUNsRCxVQUFNLFFBQVEsTUFBTSxLQUFLLGVBQWUsWUFBWSxJQUFJO0FBQ3hELFdBQU8sMEJBQTBCLE1BQU0sSUFBSTtBQUFBLEVBQzdDO0FBQUEsRUFFQSxNQUFNLGVBQThCO0FBQ2xDLFVBQU0sVUFBVSxNQUFNLEtBQUssY0FBYyxzQkFBc0I7QUFDL0QsUUFBSSxDQUFDLFFBQVEsUUFBUTtBQUNuQixVQUFJLHdCQUFPLHdCQUF3QjtBQUNuQztBQUFBLElBQ0Y7QUFFQSxRQUFJLGlCQUFpQixLQUFLLEtBQUssU0FBUyxLQUFLLGVBQWUsT0FBTyxZQUFZO0FBQzdFLFlBQU0sS0FBSyxtQkFBbUIsT0FBTztBQUFBLElBQ3ZDLENBQUMsRUFBRSxLQUFLO0FBQ1IsU0FBSyxvQkFBb0IsVUFBVSxRQUFRLE1BQU0sZ0JBQWdCO0FBQ2pFLFVBQU0sS0FBSywrQkFBK0I7QUFBQSxFQUM1QztBQUFBLEVBRUEsTUFBTSxvQkFBbUM7QUFDdkMsVUFBTSxVQUFVLE1BQU0sS0FBSyxpQkFBaUIsaUJBQWlCO0FBQzdELFFBQUksbUJBQW1CLEtBQUssS0FBSyxTQUFTLElBQUksRUFBRSxLQUFLO0FBQUEsRUFDdkQ7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBQzFDLFVBQU0sWUFBWSxLQUFLLHVCQUF1QjtBQUM5QyxRQUFJLFdBQVc7QUFDYixZQUFNLFFBQVEsTUFBTSxLQUFLLFlBQVksV0FBVyxTQUFTO0FBQ3pELFlBQU0sVUFBVSxnQ0FBZ0MsTUFBTSxJQUFJO0FBQzFELFlBQU0sS0FBSyxtQkFBbUIsT0FBTztBQUNyQztBQUFBLElBQ0Y7QUFFQSxRQUFJLHdCQUFPLCtDQUErQztBQUMxRCxVQUFNLEtBQUssaUJBQWlCLFlBQVksYUFBYSxPQUFPLFNBQVM7QUFDbkUsWUFBTSxRQUFRLE1BQU0sS0FBSyxZQUFZLFdBQVcsSUFBSTtBQUNwRCxhQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxJQUNwQyxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsTUFBTSxvQkFBbUM7QUFuWTNDO0FBb1lJLFVBQU0sT0FBTyxNQUFNLEtBQUssZUFBZSxrQkFBa0I7QUFDekQsVUFBTSxRQUFPLFVBQUssSUFBSSxVQUFVLFFBQVEsS0FBSyxNQUFoQyxZQUFxQyxLQUFLLElBQUksVUFBVSxhQUFhLEtBQUs7QUFDdkYsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHdCQUFPLGdDQUFnQztBQUMzQztBQUFBLElBQ0Y7QUFFQSxVQUFNLEtBQUssU0FBUyxJQUFJO0FBQ3hCLFNBQUssSUFBSSxVQUFVLFdBQVcsSUFBSTtBQUNsQyxVQUFNLFVBQVUsVUFBVSxLQUFLLElBQUk7QUFDbkMsVUFBTSxLQUFLLG1CQUFtQixPQUFPO0FBQUEsRUFDdkM7QUFBQSxFQUVBLE1BQU0sZ0JBQWlDO0FBQ3JDLFVBQU0sVUFBVSxNQUFNLEtBQUssYUFBYSxpQkFBaUIsR0FBSTtBQUM3RCxXQUFPLFFBQVE7QUFBQSxFQUNqQjtBQUFBLEVBRUEsTUFBTSxtQkFBb0M7QUFDeEMsVUFBTSxPQUFPLE1BQU0sS0FBSyxhQUFhLFNBQVMsS0FBSyxTQUFTLFNBQVM7QUFDckUsV0FBTyxLQUNKLE1BQU0sSUFBSSxFQUNWLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLEVBQ3pCLE9BQU8sQ0FBQyxTQUFTLGlCQUFpQixLQUFLLElBQUksQ0FBQyxFQUM1QyxPQUFPLENBQUMsU0FBUyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsRUFDM0M7QUFBQSxFQUNMO0FBQUEsRUFFQSxNQUFNLHdCQUF5QztBQUM3QyxXQUFPLEtBQUssaUJBQWlCLG9CQUFvQjtBQUFBLEVBQ25EO0FBQUEsRUFFQSxNQUFNLGtCQUFrQixPQUtKO0FBQ2xCLFVBQU0sU0FBUyxNQUFNLEtBQUssY0FBYyxvQkFBb0I7QUFBQSxNQUMxRCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxZQUFZO0FBQUEsTUFDWixXQUFXLEtBQUssSUFBSTtBQUFBLE1BQ3BCLFlBQVk7QUFBQSxNQUNaLE1BQU07QUFBQSxNQUNOLFNBQVMsTUFBTTtBQUFBLE1BQ2YsU0FBUyxNQUFNO0FBQUEsTUFDZixXQUFXLE1BQU07QUFBQSxNQUNqQixnQkFBZ0IsTUFBTTtBQUFBLElBQ3hCLENBQUM7QUFDRCxVQUFNLEtBQUssK0JBQStCO0FBQzFDLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxrQkFBMEI7QUFDeEIsUUFBSSxDQUFDLEtBQUssU0FBUyxxQkFBcUIsQ0FBQyxLQUFLLFNBQVMsaUJBQWlCO0FBQ3RFLGFBQU87QUFBQSxJQUNUO0FBRUEsU0FDRyxLQUFLLFNBQVMscUJBQXFCLEtBQUssU0FBUyxxQkFDakQsQ0FBQyxLQUFLLFNBQVMsYUFBYSxLQUFLLEtBQUssQ0FBQyxLQUFLLFNBQVMsWUFBWSxLQUFLLElBQ3ZFO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEseUJBQWlDO0FBemMzQztBQTBjSSxVQUFNLGFBQWEsS0FBSyxJQUFJLFVBQVUsb0JBQW9CLDZCQUFZO0FBQ3RFLFVBQU0sYUFBWSwwREFBWSxXQUFaLG1CQUFvQixtQkFBcEIsbUJBQW9DLFdBQXBDLFlBQThDO0FBQ2hFLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaXNVbmRlckZvbGRlciIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
