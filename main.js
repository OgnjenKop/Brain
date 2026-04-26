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
var import_obsidian7 = require("obsidian");

// src/settings/settings.ts
var DEFAULT_BRAIN_SETTINGS = {
  notesFolder: "Notes",
  instructionsFile: "Brain/AGENTS.md",
  codexModel: ""
};
function normalizeBrainSettings(input) {
  const merged = {
    ...DEFAULT_BRAIN_SETTINGS,
    ...input
  };
  return {
    notesFolder: normalizeRelativePath(
      merged.notesFolder,
      DEFAULT_BRAIN_SETTINGS.notesFolder
    ),
    instructionsFile: normalizeRelativePath(
      merged.instructionsFile,
      DEFAULT_BRAIN_SETTINGS.instructionsFile
    ),
    codexModel: typeof merged.codexModel === "string" ? merged.codexModel.trim() : ""
  };
}
function normalizeRelativePath(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || fallback;
}

// src/settings/settings-tab.ts
var import_obsidian = require("obsidian");

// src/utils/codex-auth.ts
var CODEX_LOGIN_STATUS_TIMEOUT_MS = 5e3;
function parseCodexLoginStatus(output) {
  const normalized = output.trim().toLowerCase();
  if (!normalized) {
    return "logged-out";
  }
  if (normalized.includes("not logged in") || normalized.includes("logged out")) {
    return "logged-out";
  }
  if (normalized.includes("logged in") || normalized.includes("signed in") || normalized.includes("authenticated")) {
    return "logged-in";
  }
  return "logged-out";
}
async function getCodexLoginStatus() {
  try {
    const codexBinary = await getCodexBinaryPath();
    if (!codexBinary) {
      return "unavailable";
    }
    const execFileAsync = getExecFileAsync();
    const { stdout, stderr } = await execFileAsync(codexBinary, ["login", "status"], {
      maxBuffer: 1024 * 1024,
      timeout: CODEX_LOGIN_STATUS_TIMEOUT_MS
    });
    return parseCodexLoginStatus(`${stdout}
${stderr}`);
  } catch (error) {
    if (isEnoentError(error) || isTimeoutError(error) || isNodeRuntimeUnavailable(error)) {
      return "unavailable";
    }
    return "logged-out";
  }
}
async function getCodexBinaryPath() {
  let req;
  try {
    req = getNodeRequire();
  } catch (e) {
    return null;
  }
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
function isTimeoutError(error) {
  return typeof error === "object" && error !== null && "killed" in error && error.killed === true;
}
function isNodeRuntimeUnavailable(error) {
  return error instanceof ReferenceError || error instanceof TypeError;
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

// src/utils/codex-models.ts
var DEFAULT_CODEX_MODEL_OPTIONS = [
  { value: "", label: "Account default" }
];
var CUSTOM_CODEX_MODEL_VALUE = "__custom__";
var CODEX_MODEL_CATALOG_TIMEOUT_MS = 8e3;
async function getSupportedCodexModelOptions() {
  const codexBinary = await getCodexBinaryPath();
  if (!codexBinary) {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }
  try {
    const { execFileAsync } = getCodexModelRuntime();
    const { stdout, stderr } = await execFileAsync(codexBinary, ["debug", "models"], {
      maxBuffer: 1024 * 1024 * 20,
      timeout: CODEX_MODEL_CATALOG_TIMEOUT_MS
    });
    return parseCodexModelCatalog(`${stdout}
${stderr}`);
  } catch (e) {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }
}
function parseCodexModelCatalog(output) {
  var _a;
  const jsonText = extractJsonObject(output);
  if (!jsonText) {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }
  try {
    const parsed = JSON.parse(jsonText);
    const seen = /* @__PURE__ */ new Set();
    const options = [...DEFAULT_CODEX_MODEL_OPTIONS];
    for (const model of (_a = parsed.models) != null ? _a : []) {
      const slug = typeof model.slug === "string" ? model.slug.trim() : "";
      if (!slug || seen.has(slug)) {
        continue;
      }
      if (model.visibility !== void 0 && model.visibility !== "list") {
        continue;
      }
      seen.add(slug);
      options.push({
        value: slug,
        label: typeof model.display_name === "string" && model.display_name.trim() ? model.display_name.trim() : slug
      });
    }
    return options;
  } catch (e) {
    return DEFAULT_CODEX_MODEL_OPTIONS;
  }
}
function getCodexModelDropdownValue(model, options = DEFAULT_CODEX_MODEL_OPTIONS) {
  const normalized = model.trim();
  if (!normalized) {
    return "";
  }
  return options.some((option) => option.value === normalized) ? normalized : CUSTOM_CODEX_MODEL_VALUE;
}
function isKnownCodexModel(model, options = DEFAULT_CODEX_MODEL_OPTIONS) {
  const normalized = model.trim();
  return options.some((option) => option.value === normalized);
}
function extractJsonObject(output) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return output.slice(start, end + 1);
}
function getCodexModelRuntime() {
  const req = Function("return require")();
  const { execFile } = req("child_process");
  const { promisify } = req("util");
  return {
    execFileAsync: promisify(execFile)
  };
}

// src/settings/settings-tab.ts
var BrainSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.modelOptions = DEFAULT_CODEX_MODEL_OPTIONS;
    this.modelOptionsLoading = false;
    this.modelOptionsLoaded = false;
    this.customModelDraft = false;
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Brain Settings" });
    if (!this.modelOptionsLoading && !this.modelOptionsLoaded) {
      void this.refreshModelOptions();
    }
    containerEl.createEl("h3", { text: "Storage" });
    new import_obsidian.Setting(containerEl).setName("Notes folder").setDesc("Default folder for new markdown notes created from approved write plans.").addText(
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
    new import_obsidian.Setting(containerEl).setName("Instructions file").setDesc("Markdown file that tells Brain how to operate in this vault.").addText(
      (text) => this.bindTextSetting(
        text,
        this.plugin.settings.instructionsFile,
        (value) => {
          this.plugin.settings.instructionsFile = value;
        },
        (value) => {
          if (!value.trim()) {
            new import_obsidian.Notice("Instructions file cannot be empty");
            return false;
          }
          return true;
        }
      )
    );
    containerEl.createEl("h3", { text: "Codex CLI" });
    this.createCodexStatusSetting(containerEl);
    new import_obsidian.Setting(containerEl).setName("Codex setup").setDesc(
      "Brain uses only the local Codex CLI. Install `@openai/codex`, run `codex login`, then recheck status."
    ).addButton(
      (button) => button.setButtonText("Open Codex Setup").setCta().onClick(async () => {
        await this.plugin.authService.login();
      })
    ).addButton(
      (button) => button.setButtonText("Recheck Status").onClick(() => {
        this.display();
      })
    );
    const modelSetting = new import_obsidian.Setting(containerEl).setName("Codex model").setDesc(
      this.modelOptionsLoading ? "Loading models from the installed Codex CLI..." : "Optional. Select a model reported by Codex CLI, or leave blank to use the account default."
    ).addDropdown((dropdown) => {
      for (const option of this.modelOptions) {
        dropdown.addOption(option.value, option.label);
      }
      dropdown.addOption(CUSTOM_CODEX_MODEL_VALUE, "Custom...").setValue(
        this.customModelDraft ? CUSTOM_CODEX_MODEL_VALUE : getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions)
      ).onChange(async (value) => {
        if (value === CUSTOM_CODEX_MODEL_VALUE) {
          this.customModelDraft = true;
          this.display();
          return;
        }
        this.customModelDraft = false;
        this.plugin.settings.codexModel = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    modelSetting.addButton(
      (button) => button.setButtonText("Reload").onClick(() => {
        void this.refreshModelOptions();
      })
    );
    if (this.customModelDraft || getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions) === CUSTOM_CODEX_MODEL_VALUE) {
      let draftValue = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions) ? "" : this.plugin.settings.codexModel;
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        new import_obsidian.Setting(containerEl).setName("Active Codex model").setDesc(this.plugin.settings.codexModel.trim());
      }
      new import_obsidian.Setting(containerEl).setName("Custom Codex model").setDesc("Exact model id passed to `codex exec --model`.").addText((text) => {
        text.setValue(draftValue).onChange((value) => {
          draftValue = value;
        });
        text.inputEl.addEventListener("blur", () => {
          void this.saveCustomModelDraft(draftValue);
        });
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            text.inputEl.blur();
          }
        });
      });
    }
  }
  async refreshModelOptions() {
    this.modelOptionsLoading = true;
    this.display();
    try {
      this.modelOptions = await getSupportedCodexModelOptions();
    } finally {
      this.modelOptionsLoaded = true;
      this.modelOptionsLoading = false;
      this.display();
    }
  }
  async saveCustomModelDraft(value) {
    const model = value.trim();
    if (!model) {
      this.customModelDraft = false;
      this.display();
      return;
    }
    this.customModelDraft = false;
    this.plugin.settings.codexModel = model;
    await this.plugin.saveSettings();
    this.display();
  }
  createCodexStatusSetting(containerEl) {
    const statusSetting = new import_obsidian.Setting(containerEl).setName("Codex status").setDesc("Checking Codex CLI status...");
    void this.refreshCodexStatus(statusSetting);
  }
  async refreshCodexStatus(setting) {
    try {
      const status = await getAIConfigurationStatus(this.plugin.settings);
      setting.setDesc(status.message);
    } catch (error) {
      console.error(error);
      setting.setDesc("Could not check Codex CLI status.");
    }
  }
  bindTextSetting(text, value, onValueChange, validate) {
    let currentValue = value;
    let lastSavedValue = value;
    let isSaving = false;
    text.setValue(value).onChange((nextValue) => {
      currentValue = nextValue;
      if (!validate || validate(nextValue)) {
        onValueChange(nextValue);
      }
    });
    this.queueSaveOnBlur(
      text.inputEl,
      () => currentValue,
      () => lastSavedValue,
      (savedValue) => {
        currentValue = savedValue;
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
        input,
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
  async saveOnBlur(input, getCurrentValue, getLastSavedValue, setLastSavedValue, isSaving, setSaving, validate) {
    if (isSaving()) {
      return;
    }
    const currentValue = getCurrentValue();
    if (currentValue === getLastSavedValue()) {
      return;
    }
    if (validate && !validate(currentValue)) {
      const lastSavedValue = getLastSavedValue();
      input.value = lastSavedValue;
      setLastSavedValue(lastSavedValue);
      return;
    }
    setSaving(true);
    try {
      await this.plugin.saveSettings();
      const savedValue = input.value;
      setLastSavedValue(savedValue);
    } finally {
      setSaving(false);
    }
  }
};

// src/services/ai-service.ts
var CODEX_CHAT_TIMEOUT_MS = 12e4;
var BrainAIService = class {
  async completeChat(messages, settings, signal) {
    return this.postCodexCompletion(settings, messages, signal);
  }
  async postCodexCompletion(settings, messages, signal) {
    const { execFile, fs, os, path } = getCodexRuntime();
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
      await execFileWithAbort(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
        timeout: CODEX_CHAT_TIMEOUT_MS,
        signal
      }, execFile);
      const content = await fs.readFile(outputFile, "utf8");
      if (!content.trim()) {
        throw new Error("Codex returned an empty response");
      }
      return content.trim();
    } catch (error) {
      if (isEnoentError2(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }
      if (isTimeoutError2(error)) {
        throw new Error("Codex did not respond in time. Try again, or check `codex login status` outside Brain.");
      }
      if ((signal == null ? void 0 : signal.aborted) || isAbortError(error)) {
        throw new Error("Codex request stopped.");
      }
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => void 0);
    }
  }
  buildCodexPrompt(messages) {
    return messages.map((message) => `${message.role.toUpperCase()}:
${message.content}`).join("\n\n");
  }
};
function getCodexRuntime() {
  const req = Function("return require")();
  const { execFile } = req("child_process");
  return {
    execFile,
    fs: req("fs/promises"),
    os: req("os"),
    path: req("path")
  };
}
function execFileWithAbort(file, args, options, execFile) {
  return new Promise((resolve, reject) => {
    var _a, _b;
    let settled = false;
    const child = execFile(file, args, options, (error) => {
      var _a2;
      if (settled) {
        return;
      }
      settled = true;
      (_a2 = options.signal) == null ? void 0 : _a2.removeEventListener("abort", abort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    const abort = () => {
      if (settled) {
        return;
      }
      child.kill("SIGTERM");
      window.setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 1500);
    };
    if ((_a = options.signal) == null ? void 0 : _a.aborted) {
      abort();
    } else {
      (_b = options.signal) == null ? void 0 : _b.addEventListener("abort", abort, { once: true });
    }
  });
}
function isEnoentError2(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
function isTimeoutError2(error) {
  return typeof error === "object" && error !== null && "killed" in error && error.killed === true;
}
function isAbortError(error) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

// src/services/auth-service.ts
var import_obsidian2 = require("obsidian");
var BrainAuthService = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  async login() {
    new import_obsidian2.Notice("Install the Codex CLI, run `codex login`, then return to Brain and recheck Codex status.");
    window.open("https://openai.com/codex/get-started/");
  }
  async getCodexStatus() {
    return getCodexLoginStatus();
  }
};

// src/services/instruction-service.ts
var DEFAULT_INSTRUCTIONS = [
  "# Brain Instructions",
  "",
  "You are helping file information into this Obsidian vault and retrieve information from it.",
  "",
  "## Operating Rules",
  "- Keep all persisted content as normal markdown.",
  "- Use only explicit vault context when answering retrieval questions.",
  "- Prefer updating or appending to existing notes over creating duplicates.",
  "- Use wiki links when useful and supported by the provided context.",
  "- Use the configured notes folder as the default location for new notes.",
  "- If you are unsure where something belongs, ask a question instead of guessing.",
  "- Never delete or overwrite existing user content.",
  "- Propose safe append/create operations and wait for approval before writing.",
  ""
].join("\n");
var InstructionService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async ensureInstructionsFile() {
    const settings = this.settingsProvider();
    const file = await this.vaultService.ensureFile(
      settings.instructionsFile,
      DEFAULT_INSTRUCTIONS
    );
    const text = await this.vaultService.readText(file.path);
    if (!text.trim()) {
      await this.vaultService.replaceText(file.path, DEFAULT_INSTRUCTIONS);
      return DEFAULT_INSTRUCTIONS;
    }
    return text;
  }
  async readInstructions() {
    return this.ensureInstructionsFile();
  }
};

// src/services/vault-chat-service.ts
var EMPTY_PLAN = {
  summary: "",
  confidence: "low",
  operations: [],
  questions: []
};
var VaultChatService = class {
  constructor(aiService, instructionService, queryService, writeService, settingsProvider) {
    this.aiService = aiService;
    this.instructionService = instructionService;
    this.queryService = queryService;
    this.writeService = writeService;
    this.settingsProvider = settingsProvider;
  }
  async respond(message, signal) {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Enter a message first");
    }
    const [instructions, sources] = await Promise.all([
      this.instructionService.readInstructions(),
      this.queryService.queryVault(trimmed)
    ]);
    const context = formatSourcesForPrompt(sources);
    const settings = this.settingsProvider();
    const aiStatus = await getAIConfigurationStatus(settings);
    if (!aiStatus.configured) {
      throw new Error(aiStatus.message);
    }
    const response = await this.aiService.completeChat(
      [
        {
          role: "system",
          content: buildSystemPrompt(instructions, settings)
        },
        {
          role: "user",
          content: [
            `User message: ${trimmed}`,
            "",
            "Relevant vault context:",
            context || "No matching vault files found."
          ].join("\n")
        }
      ],
      settings,
      signal
    );
    const parsed = parseChatResponse(response);
    return {
      answer: parsed.answer || "Codex returned no answer.",
      sources,
      plan: parsed.plan ? this.writeService.normalizePlan(parsed.plan) : null,
      usedAI: true
    };
  }
};
function buildSystemPrompt(instructions, settings) {
  return [
    "You are Brain, an Obsidian vault assistant.",
    "You retrieve information from explicit markdown context and propose safe vault writes.",
    "Never claim facts that are not in the provided vault context.",
    "Never directly write files. Return only a JSON object.",
    "",
    "Return this JSON shape:",
    "{",
    '  "answer": "markdown answer with evidence and gaps",',
    '  "plan": {',
    '    "summary": "short summary of proposed writes, or empty string",',
    '    "confidence": "low|medium|high",',
    '    "operations": [',
    '      {"type":"append","path":"Some/File.md","content":"markdown"},',
    '      {"type":"create","path":"Some/New File.md","content":"markdown"}',
    "    ],",
    '    "questions": ["open question if you need clarification"]',
    "  }",
    "}",
    "",
    "Only include write operations when the user asks to add, save, file, remember, update, create, or otherwise put information into the vault.",
    "Use append/create operations only. Do not propose delete or replace operations.",
    `Default notes folder: ${settings.notesFolder}`,
    "",
    "Vault instructions:",
    instructions
  ].join("\n");
}
function formatSourcesForPrompt(sources) {
  return sources.map((source, index) => [
    `## Source ${index + 1}: ${source.path}`,
    `Title: ${source.title}`,
    `Reason: ${source.reason}`,
    "",
    source.text.slice(0, 3500)
  ].join("\n")).join("\n\n");
}
function parseChatResponse(response) {
  const jsonText = extractJson(response);
  if (!jsonText) {
    return {
      answer: response.trim(),
      plan: null
    };
  }
  try {
    const parsed = JSON.parse(jsonText);
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
      plan: isPlanObject(parsed.plan) ? parsed.plan : EMPTY_PLAN
    };
  } catch (e) {
    return {
      answer: response.trim(),
      plan: null
    };
  }
}
function extractJson(text) {
  var _a;
  const fenced = (_a = text.match(/```(?:json)?\s*([\s\S]*?)```/i)) == null ? void 0 : _a[1];
  if (fenced) {
    return fenced.trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}
function isPlanObject(value) {
  return typeof value === "object" && value !== null;
}

// src/services/vault-query-service.ts
var MAX_QUERY_FILES = 12;
var MAX_EXCERPT_CHARS = 700;
var MAX_SNIPPET_LINES = 5;
var VaultQueryService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async queryVault(query, limit = MAX_QUERY_FILES) {
    const settings = this.settingsProvider();
    const tokens = tokenize(query);
    const files = (await this.vaultService.listMarkdownFiles()).filter((file) => shouldIncludeFile(file, settings)).sort((left, right) => right.stat.mtime - left.stat.mtime);
    const matches = [];
    for (const file of files) {
      const text = await this.vaultService.readText(file.path);
      const score = scoreFile(file, text, query, tokens);
      if (score <= 0) {
        continue;
      }
      matches.push({
        path: file.path,
        title: titleForFile(file, text),
        score,
        reason: buildReason(file, text, query, tokens),
        excerpt: buildExcerpt(text, tokens),
        text
      });
    }
    return matches.sort((left, right) => right.score - left.score).slice(0, limit);
  }
};
function shouldIncludeFile(file, settings) {
  return file.path !== settings.instructionsFile;
}
function tokenize(input) {
  const seen = /* @__PURE__ */ new Set();
  return input.toLowerCase().split(/[^a-z0-9_/-]+/i).map((token) => token.trim()).filter((token) => token.length >= 3).filter((token) => {
    if (seen.has(token)) {
      return false;
    }
    seen.add(token);
    return true;
  }).slice(0, 24);
}
function scoreFile(file, text, query, tokens) {
  if (!tokens.length) {
    return Math.max(1, Math.round(file.stat.mtime / 1e12));
  }
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  const normalizedText = normalizePhrase(text);
  const normalizedQuery = normalizePhrase(query);
  let score = 0;
  if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
    score += 18;
  }
  if (normalizedQuery && lowerPath.includes(normalizedQuery)) {
    score += 24;
  }
  for (const token of tokens) {
    if (lowerPath.includes(token)) {
      score += 10;
    }
    if (lowerTitle.includes(token)) {
      score += 9;
    }
    const headingMatches = lowerText.match(new RegExp(`(^|\\n)#{1,6}[^\\n]*${escapeRegExp(token)}`, "g"));
    if (headingMatches) {
      score += headingMatches.length * 7;
    }
    const linkMatches = lowerText.match(new RegExp(`\\[\\[[^\\]]*${escapeRegExp(token)}[^\\]]*\\]\\]`, "g"));
    if (linkMatches) {
      score += linkMatches.length * 6;
    }
    const tagMatches = lowerText.match(new RegExp(`(^|\\s)#[-/_a-z0-9]*${escapeRegExp(token)}[-/_a-z0-9]*`, "gi"));
    if (tagMatches) {
      score += tagMatches.length * 5;
    }
    const textMatches = lowerText.match(new RegExp(escapeRegExp(token), "g"));
    if (textMatches) {
      score += Math.min(8, textMatches.length);
    }
  }
  const matchedTokens = tokens.filter((token) => lowerPath.includes(token) || lowerText.includes(token));
  score += matchedTokens.length * 3;
  if (matchedTokens.length === tokens.length) {
    score += Math.min(10, tokens.length * 2);
  }
  score += Math.min(3, file.stat.mtime / Date.now());
  return score;
}
function titleForFile(file, text) {
  var _a, _b;
  const heading = (_b = (_a = text.match(/^#\s+(.+)$/m)) == null ? void 0 : _a[1]) == null ? void 0 : _b.trim();
  if (heading) {
    return heading;
  }
  return file.basename || file.path.split("/").pop() || file.path;
}
function buildReason(file, text, query, tokens) {
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  const normalizedText = normalizePhrase(text);
  const normalizedQuery = normalizePhrase(query);
  const reasons = /* @__PURE__ */ new Set();
  if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
    reasons.add("exact phrase match");
  }
  for (const token of tokens) {
    if (lowerPath.includes(token)) {
      reasons.add(`path matches "${token}"`);
    }
    if (lowerTitle.includes(token)) {
      reasons.add(`title matches "${token}"`);
    }
    if (lowerText.match(new RegExp(`(^|\\n)#{1,6}[^\\n]*${escapeRegExp(token)}`))) {
      reasons.add(`heading matches "${token}"`);
    }
    if (lowerText.includes(`[[${token}`) || lowerText.includes(`${token}]]`)) {
      reasons.add(`link mentions "${token}"`);
    }
    if (lowerText.match(new RegExp(`(^|\\s)#[-/_a-z0-9]*${escapeRegExp(token)}[-/_a-z0-9]*`, "i"))) {
      reasons.add(`tag matches "${token}"`);
    }
    if (lowerText.includes(token)) {
      reasons.add(`content mentions "${token}"`);
    }
  }
  return Array.from(reasons).slice(0, 3).join(", ") || "recent markdown note";
}
function buildExcerpt(text, tokens) {
  var _a, _b;
  const sourceLines = text.split("\n");
  const ranked = sourceLines.map((line, index) => ({ index, score: scoreLine(line, tokens) })).sort((left, right) => right.score - left.score || left.index - right.index);
  const bestLine = (_b = (_a = ranked.find((line) => line.score > 0)) == null ? void 0 : _a.index) != null ? _b : 0;
  const start = Math.max(0, bestLine - 2);
  const end = Math.min(sourceLines.length, start + MAX_SNIPPET_LINES);
  const excerpt = sourceLines.slice(start, end).map((line) => line.trim()).filter(Boolean).join("\n");
  return excerpt.length > MAX_EXCERPT_CHARS ? `${excerpt.slice(0, MAX_EXCERPT_CHARS - 3).trimEnd()}...` : excerpt;
}
function scoreLine(line, tokens) {
  const lower = line.toLowerCase();
  let score = 0;
  if (line.trim().startsWith("#")) {
    score += 4;
  }
  for (const token of tokens) {
    if (!lower.includes(token)) {
      continue;
    }
    score += 3;
    if (lower.includes(`[[${token}`) || lower.includes(`${token}]]`)) {
      score += 2;
    }
    if (lower.match(new RegExp(`(^|\\s)#[-/_a-z0-9]*${escapeRegExp(token)}[-/_a-z0-9]*`, "i"))) {
      score += 2;
    }
  }
  return score;
}
function normalizePhrase(input) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/services/vault-service.ts
var import_obsidian3 = require("obsidian");
var VaultService = class {
  constructor(app) {
    this.app = app;
  }
  async ensureKnownFolders(settings) {
    const folders = /* @__PURE__ */ new Set([
      settings.notesFolder,
      parentFolder(settings.instructionsFile)
    ]);
    for (const folder of folders) {
      await this.ensureFolder(folder);
    }
  }
  async ensureFolder(folderPath) {
    const normalized = (0, import_obsidian3.normalizePath)(folderPath).replace(/\/+$/, "");
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
      } else if (!(existing instanceof import_obsidian3.TFolder)) {
        throw new Error(`Path exists but is not a folder: ${current}`);
      }
    }
  }
  async ensureFile(filePath, initialContent = "") {
    const normalized = (0, import_obsidian3.normalizePath)(filePath);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian3.TFile) {
      return existing;
    }
    if (existing) {
      throw new Error(`Path exists but is not a file: ${normalized}`);
    }
    await this.ensureFolder(parentFolder(normalized));
    return this.app.vault.create(normalized, initialContent);
  }
  async readText(filePath) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian3.normalizePath)(filePath));
    if (!(file instanceof import_obsidian3.TFile)) {
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
    const normalized = (0, import_obsidian3.normalizePath)(filePath);
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
  async listMarkdownFiles() {
    return this.app.vault.getMarkdownFiles();
  }
  async createFolderIfMissing(folderPath) {
    try {
      await this.app.vault.createFolder(folderPath);
    } catch (error) {
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      if (existing instanceof import_obsidian3.TFolder) {
        return;
      }
      throw error;
    }
  }
};
function parentFolder(filePath) {
  const normalized = (0, import_obsidian3.normalizePath)(filePath);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

// src/services/vault-write-service.ts
var VaultWriteService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  normalizePlan(plan) {
    const confidence = readConfidence(plan.confidence);
    return {
      summary: typeof plan.summary === "string" && plan.summary.trim() ? plan.summary.trim() : "Brain proposed vault updates.",
      confidence,
      operations: (Array.isArray(plan.operations) ? plan.operations : []).map((operation) => this.normalizeOperation(operation)).filter((operation) => operation !== null).slice(0, 8),
      questions: (Array.isArray(plan.questions) ? plan.questions : []).map((question) => String(question).trim()).filter(Boolean).slice(0, 5)
    };
  }
  async applyPlan(plan) {
    const normalized = this.normalizePlan(plan);
    const paths = [];
    for (const operation of normalized.operations) {
      if (operation.type === "append") {
        await this.vaultService.appendText(operation.path, operation.content);
        paths.push(operation.path);
      } else if (operation.type === "create") {
        const path = await this.vaultService.ensureUniqueFilePath(operation.path);
        await this.vaultService.replaceText(path, operation.content);
        paths.push(path);
      }
    }
    return Array.from(new Set(paths));
  }
  normalizeOperation(operation) {
    var _a, _b;
    if (!operation || typeof operation !== "object" || !("type" in operation)) {
      return null;
    }
    const candidate = operation;
    const content = "content" in candidate ? String((_a = candidate.content) != null ? _a : "").trim() : "";
    if (!content) {
      return null;
    }
    if (candidate.type !== "append" && candidate.type !== "create") {
      return null;
    }
    const path = "path" in candidate ? normalizeMarkdownPath(String((_b = candidate.path) != null ? _b : "")) : "";
    if (!this.isSafeMarkdownPath(path)) {
      return null;
    }
    return {
      type: candidate.type,
      path,
      content,
      description: readDescription(candidate)
    };
  }
  isSafeMarkdownPath(path) {
    const settings = this.settingsProvider();
    const segments = path.split("/").filter(Boolean);
    return Boolean(path) && path.endsWith(".md") && path !== settings.instructionsFile && !path.includes("..") && segments.every((segment) => !segment.startsWith("."));
  }
};
function readDescription(operation) {
  return typeof operation.description === "string" && operation.description.trim() ? operation.description.trim() : void 0;
}
function readConfidence(value) {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}
function normalizeMarkdownPath(value) {
  return value.trim().replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
}

// src/views/sidebar-view.ts
var import_obsidian6 = require("obsidian");

// src/views/vault-plan-modal.ts
var import_obsidian5 = require("obsidian");

// src/utils/error-handler.ts
var import_obsidian4 = require("obsidian");
function showError(error, defaultMessage) {
  console.error(error);
  const message = error instanceof Error ? error.message : defaultMessage;
  new import_obsidian4.Notice(message);
}

// src/views/vault-plan-modal.ts
var VaultPlanModal = class extends import_obsidian5.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.working = false;
    this.selectedOperations = /* @__PURE__ */ new Set();
    this.draftOperations = options.plan.operations.map((operation) => ({ ...operation }));
    this.draftOperations.forEach((_, index) => this.selectedOperations.add(index));
  }
  onOpen() {
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
    this.contentEl.empty();
    this.contentEl.addClass("brain-modal");
    this.contentEl.createEl("h2", { text: "Review Vault Changes" });
    this.contentEl.createEl("p", {
      text: `${this.options.plan.summary || "Brain proposed vault changes."} Confidence: ${this.options.plan.confidence}.`
    });
    for (const [index, operation] of this.draftOperations.entries()) {
      this.renderOperation(index, operation);
    }
    if (this.options.plan.questions.length) {
      const questions = this.contentEl.createEl("div", { cls: "brain-plan-questions" });
      questions.createEl("h3", { text: "Open Questions" });
      const list = questions.createEl("ul");
      for (const question of this.options.plan.questions) {
        list.createEl("li", { text: question });
      }
    }
    const buttons = this.contentEl.createEl("div", { cls: "brain-button-row" });
    buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Approve and Write"
    }).addEventListener("click", () => {
      void this.approve();
    });
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Cancel"
    }).addEventListener("click", () => {
      this.close();
    });
  }
  async approve() {
    if (this.working) {
      return;
    }
    const operations = this.draftOperations.filter((_, index) => this.selectedOperations.has(index)).map((operation) => ({
      ...operation,
      path: operation.path.trim(),
      content: operation.content.trim()
    })).filter((operation) => operation.path && operation.content);
    if (!operations.length) {
      new import_obsidian5.Notice("Select at least one change to apply");
      return;
    }
    const invalidPath = operations.find((operation) => !isSafeMarkdownPath(operation.path));
    if (invalidPath) {
      new import_obsidian5.Notice(`Invalid target path: ${invalidPath.path}`);
      return;
    }
    this.working = true;
    try {
      const paths = await this.options.onApprove({
        ...this.options.plan,
        operations
      });
      const message = paths.length ? `Updated ${paths.join(", ")}` : "No vault changes were applied";
      new import_obsidian5.Notice(message);
      await this.options.onComplete(message, paths);
      this.close();
    } catch (error) {
      showError(error, "Could not apply vault changes");
    } finally {
      this.working = false;
    }
  }
  renderOperation(index, operation) {
    const item = this.contentEl.createEl("div", { cls: "brain-plan-operation" });
    const header = item.createEl("label", { cls: "brain-plan-operation-header" });
    const checkbox = header.createEl("input", {
      attr: { type: "checkbox" }
    });
    checkbox.checked = this.selectedOperations.has(index);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        this.selectedOperations.add(index);
      } else {
        this.selectedOperations.delete(index);
      }
    });
    header.createEl("span", { text: describeOperation(operation) });
    if (operation.description) {
      item.createEl("div", {
        cls: "brain-plan-description",
        text: operation.description
      });
    }
    const pathInput = item.createEl("input", {
      cls: "brain-modal-input brain-plan-path-input",
      attr: {
        type: "text",
        "aria-label": "Target markdown path"
      }
    });
    pathInput.value = operation.path;
    pathInput.addEventListener("input", () => {
      this.draftOperations[index] = {
        ...this.draftOperations[index],
        path: pathInput.value
      };
    });
    const textarea = item.createEl("textarea", {
      cls: "brain-modal-input brain-plan-editor",
      attr: { rows: "10" }
    });
    textarea.value = operation.content;
    textarea.addEventListener("input", () => {
      this.draftOperations[index] = {
        ...this.draftOperations[index],
        content: textarea.value
      };
    });
  }
};
function describeOperation(operation) {
  if (operation.type === "append") {
    return `Append to ${operation.path}`;
  }
  return `Create ${operation.path}`;
}
function isSafeMarkdownPath(path) {
  const segments = path.split("/").filter(Boolean);
  return Boolean(path) && path.endsWith(".md") && !path.includes("..") && segments.every((segment) => !segment.startsWith("."));
}

// src/views/sidebar-view.ts
var BRAIN_VIEW_TYPE = "brain-sidebar-view";
var BrainSidebarView = class extends import_obsidian6.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.modelOptions = DEFAULT_CODEX_MODEL_OPTIONS;
    this.modelOptionsLoading = false;
    this.customModelDraft = false;
    this.isLoading = false;
    this.currentAbortController = null;
    this.loadingStartedAt = 0;
    this.loadingTimer = null;
    this.loadingText = "";
    this.renderGeneration = 0;
    this.turns = [];
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
      text: "Ask your vault, or tell Brain what to file."
    });
    this.modelRowEl = this.contentEl.createEl("div", { cls: "brain-model-row" });
    this.renderModelSelector();
    void this.refreshModelOptions();
    this.messagesEl = this.contentEl.createEl("div", { cls: "brain-chat-messages" });
    this.renderEmptyState();
    const composer = this.contentEl.createEl("div", { cls: "brain-composer" });
    this.inputEl = this.contentEl.createEl("textarea", {
      cls: "brain-chat-input",
      attr: {
        placeholder: "Ask about your vault, or paste rough notes for Brain to file...",
        rows: "6"
      }
    });
    composer.appendChild(this.inputEl);
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void this.sendMessage();
      }
    });
    this.inputEl.addEventListener("input", () => {
      this.updateComposerState();
    });
    const examples = this.contentEl.createEl("div", { cls: "brain-prompt-chips" });
    this.createPromptChip(examples, "What do I know about...", "What do I know about ");
    this.createPromptChip(examples, "File this", "File this in the right place:\n\n");
    this.createPromptChip(examples, "Find related notes", "Find related notes for ");
    const buttons = this.contentEl.createEl("div", { cls: "brain-action-row" });
    this.sendButtonEl = buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Send"
    });
    this.sendButtonEl.addEventListener("click", () => {
      void this.sendMessage();
    });
    this.stopButtonEl = buttons.createEl("button", {
      cls: "brain-button brain-button-stop",
      text: "Stop"
    });
    this.stopButtonEl.addEventListener("click", () => {
      this.stopCurrentRequest();
    });
    this.stopButtonEl.disabled = true;
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Instructions"
    }).addEventListener("click", () => {
      void this.plugin.openInstructionsFile();
    });
    this.clearButtonEl = buttons.createEl("button", {
      cls: "brain-button",
      text: "Clear"
    });
    this.clearButtonEl.addEventListener("click", () => {
      this.turns = [];
      void this.renderMessages();
    });
    this.statusEl = this.contentEl.createEl("div", { cls: "brain-chat-status" });
    this.updateComposerState();
    await this.refreshStatus();
  }
  onClose() {
    var _a;
    (_a = this.currentAbortController) == null ? void 0 : _a.abort();
    this.stopLoadingTimer();
    return Promise.resolve();
  }
  async refreshStatus() {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.empty();
    let aiConfigured = false;
    let statusText = "Could not check Codex";
    let buttonText = "Connect";
    try {
      const aiStatus = await getAIConfigurationStatus(this.plugin.settings);
      aiConfigured = aiStatus.configured;
      statusText = formatProviderStatus(aiStatus);
      buttonText = aiConfigured ? "Manage" : "Connect";
    } catch (error) {
      console.error(error);
    }
    this.statusEl.createEl("span", { text: `AI: ${statusText} ` });
    this.statusEl.createEl("button", {
      cls: "brain-button brain-button-small",
      text: buttonText
    }).addEventListener("click", () => {
      const app = this.app;
      if (!app.setting) {
        return;
      }
      app.setting.open();
      app.setting.openTabById(this.plugin.manifest.id);
    });
  }
  async sendMessage() {
    const message = this.inputEl.value.trim();
    if (!message || this.isLoading) {
      return;
    }
    this.inputEl.value = "";
    this.updateComposerState();
    this.addTurn("user", message);
    this.setLoading(true);
    const controller = new AbortController();
    this.currentAbortController = controller;
    try {
      const response = await this.plugin.chatWithVault(message, controller.signal);
      this.renderResponse(response);
    } catch (error) {
      if (isStoppedRequest(error)) {
        this.addTurn("brain", "Codex request stopped.");
      } else {
        showError(error, "Could not chat with the vault");
      }
    } finally {
      this.currentAbortController = null;
      this.setLoading(false);
    }
  }
  stopCurrentRequest() {
    var _a;
    (_a = this.currentAbortController) == null ? void 0 : _a.abort();
  }
  createPromptChip(container, label, prompt) {
    container.createEl("button", {
      cls: "brain-prompt-chip",
      text: label
    }).addEventListener("click", () => {
      this.inputEl.value = prompt;
      this.updateComposerState();
      this.inputEl.focus();
    });
  }
  renderModelSelector() {
    this.modelRowEl.empty();
    this.modelRowEl.createEl("span", {
      cls: "brain-model-label",
      text: "Model"
    });
    if (this.modelOptionsLoading) {
      this.modelRowEl.createEl("span", {
        cls: "brain-model-active",
        text: "Loading Codex models..."
      });
    }
    const select = this.modelRowEl.createEl("select", {
      cls: "brain-model-select"
    });
    select.disabled = this.isLoading;
    for (const option of this.modelOptions) {
      select.createEl("option", {
        value: option.value,
        text: option.label
      });
    }
    select.createEl("option", {
      value: CUSTOM_CODEX_MODEL_VALUE,
      text: "Custom..."
    });
    select.value = this.customModelDraft ? CUSTOM_CODEX_MODEL_VALUE : getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions);
    select.addEventListener("change", () => {
      void this.handleModelSelection(select.value);
    });
    if (select.value === CUSTOM_CODEX_MODEL_VALUE) {
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        this.modelRowEl.createEl("span", {
          cls: "brain-model-active",
          text: `Active: ${this.plugin.settings.codexModel.trim()}`
        });
      }
      const input = this.modelRowEl.createEl("input", {
        cls: "brain-model-custom",
        attr: {
          type: "text",
          placeholder: "Codex model id"
        }
      });
      input.disabled = this.isLoading;
      input.value = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions) ? "" : this.plugin.settings.codexModel;
      input.addEventListener("blur", () => {
        void this.saveCustomModel(input.value);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
        }
      });
    }
  }
  async refreshModelOptions() {
    this.modelOptionsLoading = true;
    this.renderModelSelector();
    try {
      this.modelOptions = await getSupportedCodexModelOptions();
    } finally {
      this.modelOptionsLoading = false;
      this.renderModelSelector();
    }
  }
  async handleModelSelection(value) {
    if (value === CUSTOM_CODEX_MODEL_VALUE) {
      this.customModelDraft = true;
      this.renderModelSelector();
      return;
    }
    this.customModelDraft = false;
    this.plugin.settings.codexModel = value;
    await this.plugin.saveSettings();
    this.renderModelSelector();
    await this.refreshStatus();
  }
  async saveCustomModel(value) {
    const model = value.trim();
    if (!model) {
      this.customModelDraft = false;
      this.renderModelSelector();
      return;
    }
    this.customModelDraft = false;
    this.plugin.settings.codexModel = model;
    await this.plugin.saveSettings();
    this.renderModelSelector();
    await this.refreshStatus();
  }
  renderResponse(response) {
    this.addTurn("brain", response.answer.trim(), response.sources);
    if (response.plan && response.plan.operations.length > 0) {
      new VaultPlanModal(this.app, {
        plan: response.plan,
        onApprove: async (plan) => this.plugin.applyVaultWritePlan(plan),
        onComplete: async (message, paths) => {
          this.addUpdatedFileTurn(message, paths);
          await this.refreshStatus();
        }
      }).open();
    }
  }
  setLoading(loading) {
    this.isLoading = loading;
    if (loading) {
      this.loadingStartedAt = Date.now();
      this.updateLoadingText();
      this.startLoadingTimer();
    } else {
      this.stopLoadingTimer();
      this.loadingText = "";
    }
    this.inputEl.disabled = loading;
    this.clearButtonEl.disabled = loading;
    this.stopButtonEl.disabled = !loading;
    this.updateComposerState();
    this.renderModelSelector();
    void this.renderMessages();
  }
  updateComposerState() {
    this.autoResizeInput();
    if (this.sendButtonEl) {
      this.sendButtonEl.disabled = this.isLoading || !this.inputEl.value.trim();
    }
  }
  autoResizeInput() {
    this.inputEl.style.height = "auto";
    this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 240)}px`;
  }
  addTurn(role, text, sources) {
    this.turns.push({ role, text, sources });
    void this.renderMessages();
  }
  addUpdatedFileTurn(message, paths) {
    this.turns.push({
      role: "brain",
      text: message,
      updatedPaths: paths
    });
    void this.renderMessages();
  }
  async renderMessages() {
    var _a, _b;
    const generation = ++this.renderGeneration;
    this.messagesEl.empty();
    if (!this.turns.length) {
      this.renderEmptyState();
    }
    for (const turn of this.turns) {
      if (generation !== this.renderGeneration) {
        return;
      }
      const item = this.messagesEl.createEl("div", {
        cls: `brain-chat-message brain-chat-message-${turn.role}`
      });
      item.createEl("div", {
        cls: "brain-chat-role",
        text: turn.role === "user" ? "You" : "Brain"
      });
      const output = item.createEl("div", { cls: "brain-output" });
      if (turn.role === "brain") {
        await import_obsidian6.MarkdownRenderer.render(this.app, turn.text, output, "", this);
        if (generation !== this.renderGeneration) {
          return;
        }
      } else {
        output.setText(turn.text);
      }
      if (turn.role === "brain" && ((_a = turn.sources) == null ? void 0 : _a.length)) {
        this.renderSources(item, turn.sources);
      }
      if (turn.role === "brain" && ((_b = turn.updatedPaths) == null ? void 0 : _b.length)) {
        this.renderUpdatedFiles(item, turn.updatedPaths);
      }
    }
    if (this.isLoading) {
      const item = this.messagesEl.createEl("div", {
        cls: "brain-chat-message brain-chat-message-brain brain-chat-message-loading"
      });
      item.createEl("div", {
        cls: "brain-chat-role",
        text: "Brain"
      });
      item.createEl("div", {
        cls: "brain-loading",
        text: this.loadingText || "Reading vault context and asking Codex..."
      });
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  startLoadingTimer() {
    this.stopLoadingTimer();
    this.loadingTimer = window.setInterval(() => {
      this.updateLoadingText();
      void this.renderMessages();
    }, 1e3);
  }
  stopLoadingTimer() {
    if (this.loadingTimer !== null) {
      window.clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
  }
  updateLoadingText() {
    const seconds = Math.max(0, Math.floor((Date.now() - this.loadingStartedAt) / 1e3));
    const remaining = Math.max(0, 120 - seconds);
    this.loadingText = `Reading vault context and asking Codex... ${seconds}s elapsed, timeout in ${remaining}s.`;
  }
  renderEmptyState() {
    const empty = this.messagesEl.createEl("div", { cls: "brain-chat-empty" });
    empty.createEl("strong", { text: "Start with a question or rough capture." });
    empty.createEl("span", {
      text: " Brain retrieves markdown context, answers with sources, and previews proposed writes before anything changes."
    });
  }
  renderSources(container, sources) {
    const details = container.createEl("details", { cls: "brain-sources" });
    details.createEl("summary", {
      text: `Sources (${Math.min(sources.length, 8)})`
    });
    for (const source of sources.slice(0, 8)) {
      const sourceEl = details.createEl("div", { cls: "brain-source" });
      const title = sourceEl.createEl("button", {
        cls: "brain-source-title",
        text: source.path
      });
      title.addEventListener("click", () => {
        void this.openSource(source.path);
      });
      sourceEl.createEl("div", {
        cls: "brain-source-reason",
        text: source.reason
      });
      if (source.excerpt) {
        sourceEl.createEl("pre", {
          cls: "brain-source-excerpt",
          text: source.excerpt
        });
      }
    }
  }
  renderUpdatedFiles(container, paths) {
    const files = container.createEl("div", { cls: "brain-updated-files" });
    files.createEl("div", {
      cls: "brain-source-reason",
      text: "Updated files"
    });
    for (const path of paths) {
      const button = files.createEl("button", {
        cls: "brain-source-title",
        text: path
      });
      button.addEventListener("click", () => {
        void this.openSource(path);
      });
    }
  }
  async openSource(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian6.TFile)) {
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }
};
function formatProviderStatus(status) {
  if (!status.configured) {
    return status.message.replace(/\.$/, "");
  }
  const model = status.model ? ` (${status.model})` : "";
  return `Codex${model}`;
}
function isStoppedRequest(error) {
  return error instanceof Error && error.message === "Codex request stopped.";
}

// src/commands/register-commands.ts
function registerCommands(plugin) {
  plugin.addCommand({
    id: "open-vault-chat",
    name: "Brain: Open Vault Chat",
    callback: async () => {
      await plugin.openSidebar();
    }
  });
  plugin.addCommand({
    id: "open-instructions",
    name: "Brain: Open Instructions",
    callback: async () => {
      await plugin.openInstructionsFile();
    }
  });
}

// main.ts
var BrainPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.sidebarView = null;
  }
  async onload() {
    await this.loadSettings();
    this.vaultService = new VaultService(this.app);
    this.aiService = new BrainAIService();
    this.authService = new BrainAuthService(this);
    this.instructionService = new InstructionService(
      this.vaultService,
      () => this.settings
    );
    this.vaultQueryService = new VaultQueryService(
      this.vaultService,
      () => this.settings
    );
    this.vaultWriteService = new VaultWriteService(
      this.vaultService,
      () => this.settings
    );
    this.vaultChatService = new VaultChatService(
      this.aiService,
      this.instructionService,
      this.vaultQueryService,
      this.vaultWriteService,
      () => this.settings
    );
    this.registerView(BRAIN_VIEW_TYPE, (leaf) => {
      const view = new BrainSidebarView(leaf, this);
      this.sidebarView = view;
      return view;
    });
    registerCommands(this);
    this.addSettingTab(new BrainSettingTab(this.app, this));
    try {
      await this.vaultService.ensureKnownFolders(this.settings);
      await this.instructionService.ensureInstructionsFile();
    } catch (error) {
      showError(error, "Could not initialize Brain storage");
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
    var _a;
    this.settings = normalizeBrainSettings(this.settings);
    await this.saveData(this.settings);
    try {
      await this.vaultService.ensureKnownFolders(this.settings);
      await ((_a = this.instructionService) == null ? void 0 : _a.ensureInstructionsFile());
    } catch (error) {
      showError(error, "Could not initialize Brain storage");
    }
    await this.refreshSidebarStatus();
  }
  async openSidebar() {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian7.Notice("Unable to open the sidebar");
      return;
    }
    await leaf.setViewState({
      type: BRAIN_VIEW_TYPE,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }
  async openInstructionsFile() {
    await this.instructionService.ensureInstructionsFile();
    const file = this.app.vault.getAbstractFileByPath(this.settings.instructionsFile);
    if (!(file instanceof import_obsidian7.TFile)) {
      new import_obsidian7.Notice(`Could not open ${this.settings.instructionsFile}`);
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }
  async chatWithVault(message, signal) {
    return this.vaultChatService.respond(message, signal);
  }
  async applyVaultWritePlan(plan) {
    const paths = await this.vaultWriteService.applyPlan(plan);
    await this.refreshSidebarStatusBestEffort();
    return paths;
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
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvY29kZXgtYXV0aC50cyIsICJzcmMvdXRpbHMvYWktY29uZmlnLnRzIiwgInNyYy91dGlscy9jb2RleC1tb2RlbHMudHMiLCAic3JjL3NlcnZpY2VzL2FpLXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL2F1dGgtc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvaW5zdHJ1Y3Rpb24tc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvdmF1bHQtY2hhdC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1xdWVyeS1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0UXVlcnlTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFdyaXRlUGxhbiwgVmF1bHRXcml0ZVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuaW1wb3J0IHsgQlJBSU5fVklFV19UWVBFLCBCcmFpblNpZGViYXJWaWV3IH0gZnJvbSBcIi4vc3JjL3ZpZXdzL3NpZGViYXItdmlld1wiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gXCIuL3NyYy9jb21tYW5kcy9yZWdpc3Rlci1jb21tYW5kc1wiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJhaW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5ncyE6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIHZhdWx0U2VydmljZSE6IFZhdWx0U2VydmljZTtcbiAgYWlTZXJ2aWNlITogQnJhaW5BSVNlcnZpY2U7XG4gIGF1dGhTZXJ2aWNlITogQnJhaW5BdXRoU2VydmljZTtcbiAgaW5zdHJ1Y3Rpb25TZXJ2aWNlITogSW5zdHJ1Y3Rpb25TZXJ2aWNlO1xuICB2YXVsdFF1ZXJ5U2VydmljZSE6IFZhdWx0UXVlcnlTZXJ2aWNlO1xuICB2YXVsdFdyaXRlU2VydmljZSE6IFZhdWx0V3JpdGVTZXJ2aWNlO1xuICB2YXVsdENoYXRTZXJ2aWNlITogVmF1bHRDaGF0U2VydmljZTtcbiAgcHJpdmF0ZSBzaWRlYmFyVmlldzogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy52YXVsdFNlcnZpY2UgPSBuZXcgVmF1bHRTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFpU2VydmljZSA9IG5ldyBCcmFpbkFJU2VydmljZSgpO1xuICAgIHRoaXMuYXV0aFNlcnZpY2UgPSBuZXcgQnJhaW5BdXRoU2VydmljZSh0aGlzKTtcbiAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZSA9IG5ldyBJbnN0cnVjdGlvblNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0UXVlcnlTZXJ2aWNlID0gbmV3IFZhdWx0UXVlcnlTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSA9IG5ldyBWYXVsdFdyaXRlU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRDaGF0U2VydmljZSA9IG5ldyBWYXVsdENoYXRTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UsXG4gICAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoQlJBSU5fVklFV19UWVBFLCAobGVhZikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IG5ldyBCcmFpblNpZGViYXJWaWV3KGxlYWYsIHRoaXMpO1xuICAgICAgdGhpcy5zaWRlYmFyVmlldyA9IHZpZXc7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9KTtcblxuICAgIHJlZ2lzdGVyQ29tbWFuZHModGhpcyk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEJyYWluU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUtub3duRm9sZGVycyh0aGlzLnNldHRpbmdzKTtcbiAgICAgIGF3YWl0IHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIEJyYWluIHN0b3JhZ2VcIik7XG4gICAgfVxuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5zaWRlYmFyVmlldyA9IG51bGw7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MobG9hZGVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBsb2FkIEJyYWluIHNldHRpbmdzXCIpO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3Moe30pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZT8uZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGluaXRpYWxpemUgQnJhaW4gc3RvcmFnZVwiKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbmV3IE5vdGljZShcIlVuYWJsZSB0byBvcGVuIHRoZSBzaWRlYmFyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBCUkFJTl9WSUVXX1RZUEUsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBvcGVuSW5zdHJ1Y3Rpb25zRmlsZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZS5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aCh0aGlzLnNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG5ldyBOb3RpY2UoYENvdWxkIG5vdCBvcGVuICR7dGhpcy5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlfWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBjaGF0V2l0aFZhdWx0KG1lc3NhZ2U6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFZhdWx0Q2hhdFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMudmF1bHRDaGF0U2VydmljZS5yZXNwb25kKG1lc3NhZ2UsIHNpZ25hbCk7XG4gIH1cblxuICBhc3luYyBhcHBseVZhdWx0V3JpdGVQbGFuKHBsYW46IFZhdWx0V3JpdGVQbGFuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgdGhpcy52YXVsdFdyaXRlU2VydmljZS5hcHBseVBsYW4ocGxhbik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcGF0aHM7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlZnJlc2ggc2lkZWJhciBzdGF0dXNcIik7XG4gICAgfVxuICB9XG5cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBub3Rlc0ZvbGRlcjogc3RyaW5nO1xuICBpbnN0cnVjdGlvbnNGaWxlOiBzdHJpbmc7XG4gIGNvZGV4TW9kZWw6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQlJBSU5fU0VUVElOR1M6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gIG5vdGVzRm9sZGVyOiBcIk5vdGVzXCIsXG4gIGluc3RydWN0aW9uc0ZpbGU6IFwiQnJhaW4vQUdFTlRTLm1kXCIsXG4gIGNvZGV4TW9kZWw6IFwiXCIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBpbnN0cnVjdGlvbnNGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICApLFxuICAgIGNvZGV4TW9kZWw6IHR5cGVvZiBtZXJnZWQuY29kZXhNb2RlbCA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5jb2RleE1vZGVsLnRyaW0oKSA6IFwiXCIsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHtcbiAgQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4gIENvZGV4TW9kZWxPcHRpb24sXG4gIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlLFxuICBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucyxcbiAgaXNLbm93bkNvZGV4TW9kZWwsXG59IGZyb20gXCIuLi91dGlscy9jb2RleC1tb2RlbHNcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb2RlbE9wdGlvbnNMb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpbiBTZXR0aW5nc1wiIH0pO1xuICAgIGlmICghdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nICYmICF0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCkge1xuICAgICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdG9yYWdlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTm90ZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkRlZmF1bHQgZm9sZGVyIGZvciBuZXcgbWFya2Rvd24gbm90ZXMgY3JlYXRlZCBmcm9tIGFwcHJvdmVkIHdyaXRlIHBsYW5zLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5zdHJ1Y3Rpb25zIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB0aGF0IHRlbGxzIEJyYWluIGhvdyB0byBvcGVyYXRlIGluIHRoaXMgdmF1bHQuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSW5zdHJ1Y3Rpb25zIGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkNvZGV4IENMSVwiIH0pO1xuXG4gICAgdGhpcy5jcmVhdGVDb2RleFN0YXR1c1NldHRpbmcoY29udGFpbmVyRWwpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvZGV4IHNldHVwXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJCcmFpbiB1c2VzIG9ubHkgdGhlIGxvY2FsIENvZGV4IENMSS4gSW5zdGFsbCBgQG9wZW5haS9jb2RleGAsIHJ1biBgY29kZXggbG9naW5gLCB0aGVuIHJlY2hlY2sgc3RhdHVzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIk9wZW4gQ29kZXggU2V0dXBcIilcbiAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hdXRoU2VydmljZS5sb2dpbigpO1xuICAgICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlJlY2hlY2sgU3RhdHVzXCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgY29uc3QgbW9kZWxTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvZGV4IG1vZGVsXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nXG4gICAgICAgICAgPyBcIkxvYWRpbmcgbW9kZWxzIGZyb20gdGhlIGluc3RhbGxlZCBDb2RleCBDTEkuLi5cIlxuICAgICAgICAgIDogXCJPcHRpb25hbC4gU2VsZWN0IGEgbW9kZWwgcmVwb3J0ZWQgYnkgQ29kZXggQ0xJLCBvciBsZWF2ZSBibGFuayB0byB1c2UgdGhlIGFjY291bnQgZGVmYXVsdC5cIixcbiAgICAgIClcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2YgdGhpcy5tb2RlbE9wdGlvbnMpIHtcbiAgICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24ob3B0aW9uLnZhbHVlLCBvcHRpb24ubGFiZWwpO1xuICAgICAgICB9XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLmFkZE9wdGlvbihDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsIFwiQ3VzdG9tLi4uXCIpXG4gICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0XG4gICAgICAgICAgICAgID8gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgICAgICAgICAgIDogZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpLFxuICAgICAgICAgIClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgbW9kZWxTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgYnV0dG9uXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVsb2FkXCIpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucmVmcmVzaE1vZGVsT3B0aW9ucygpO1xuICAgICAgICB9KSxcbiAgICApO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8XG4gICAgICBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucykgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRVxuICAgICkge1xuICAgICAgbGV0IGRyYWZ0VmFsdWUgPSB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHwgaXNLbm93bkNvZGV4TW9kZWwodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWw7XG4gICAgICBpZiAodGhpcy5jdXN0b21Nb2RlbERyYWZ0ICYmIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgIC5zZXROYW1lKFwiQWN0aXZlIENvZGV4IG1vZGVsXCIpXG4gICAgICAgICAgLnNldERlc2ModGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgICAgfVxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiQ3VzdG9tIENvZGV4IG1vZGVsXCIpXG4gICAgICAgIC5zZXREZXNjKFwiRXhhY3QgbW9kZWwgaWQgcGFzc2VkIHRvIGBjb2RleCBleGVjIC0tbW9kZWxgLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIC5zZXRWYWx1ZShkcmFmdFZhbHVlKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBkcmFmdFZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdm9pZCB0aGlzLnNhdmVDdXN0b21Nb2RlbERyYWZ0KGRyYWZ0VmFsdWUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICB0ZXh0LmlucHV0RWwuYmx1cigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnMgPSBhd2FpdCBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCA9IHRydWU7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUN1c3RvbU1vZGVsRHJhZnQodmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1vZGVsID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICghbW9kZWwpIHtcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSBtb2RlbDtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLmRpc3BsYXkoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29kZXhTdGF0dXNTZXR0aW5nKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHN0YXR1c1NldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggc3RhdHVzXCIpXG4gICAgICAuc2V0RGVzYyhcIkNoZWNraW5nIENvZGV4IENMSSBzdGF0dXMuLi5cIik7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hDb2RleFN0YXR1cyhzdGF0dXNTZXR0aW5nKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaENvZGV4U3RhdHVzKHNldHRpbmc6IFNldHRpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhzdGF0dXMubWVzc2FnZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgc2V0dGluZy5zZXREZXNjKFwiQ291bGQgbm90IGNoZWNrIENvZGV4IENMSSBzdGF0dXMuXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYmluZFRleHRTZXR0aW5nKFxuICAgIHRleHQ6IFRleHRDb21wb25lbnQsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgICBvblZhbHVlQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiBUZXh0Q29tcG9uZW50IHtcbiAgICBsZXQgY3VycmVudFZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGxhc3RTYXZlZFZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGlzU2F2aW5nID0gZmFsc2U7XG5cbiAgICB0ZXh0LnNldFZhbHVlKHZhbHVlKS5vbkNoYW5nZSgobmV4dFZhbHVlKSA9PiB7XG4gICAgICBjdXJyZW50VmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgICBpZiAoIXZhbGlkYXRlIHx8IHZhbGlkYXRlKG5leHRWYWx1ZSkpIHtcbiAgICAgICAgb25WYWx1ZUNoYW5nZShuZXh0VmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMucXVldWVTYXZlT25CbHVyKFxuICAgICAgdGV4dC5pbnB1dEVsLFxuICAgICAgKCkgPT4gY3VycmVudFZhbHVlLFxuICAgICAgKCkgPT4gbGFzdFNhdmVkVmFsdWUsXG4gICAgICAoc2F2ZWRWYWx1ZSkgPT4ge1xuICAgICAgICBjdXJyZW50VmFsdWUgPSBzYXZlZFZhbHVlO1xuICAgICAgICBsYXN0U2F2ZWRWYWx1ZSA9IHNhdmVkVmFsdWU7XG4gICAgICB9LFxuICAgICAgKCkgPT4gaXNTYXZpbmcsXG4gICAgICAoc2F2aW5nKSA9PiB7XG4gICAgICAgIGlzU2F2aW5nID0gc2F2aW5nO1xuICAgICAgfSxcbiAgICAgIHZhbGlkYXRlLFxuICAgICk7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlU2F2ZU9uQmx1cihcbiAgICBpbnB1dDogSFRNTElucHV0RWxlbWVudCxcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogdm9pZCB7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNhdmVPbkJsdXIoXG4gICAgICAgIGlucHV0LFxuICAgICAgICBnZXRDdXJyZW50VmFsdWUsXG4gICAgICAgIGdldExhc3RTYXZlZFZhbHVlLFxuICAgICAgICBzZXRMYXN0U2F2ZWRWYWx1ZSxcbiAgICAgICAgaXNTYXZpbmcsXG4gICAgICAgIHNldFNhdmluZyxcbiAgICAgICAgdmFsaWRhdGUsXG4gICAgICApO1xuICAgIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZU9uQmx1cihcbiAgICBpbnB1dDogSFRNTElucHV0RWxlbWVudCxcbiAgICBnZXRDdXJyZW50VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBnZXRMYXN0U2F2ZWRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldExhc3RTYXZlZFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpc1NhdmluZzogKCkgPT4gYm9vbGVhbixcbiAgICBzZXRTYXZpbmc6IChzYXZpbmc6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGlzU2F2aW5nKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRDdXJyZW50VmFsdWUoKTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09PSBnZXRMYXN0U2F2ZWRWYWx1ZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICBjb25zdCBsYXN0U2F2ZWRWYWx1ZSA9IGdldExhc3RTYXZlZFZhbHVlKCk7XG4gICAgICBpbnB1dC52YWx1ZSA9IGxhc3RTYXZlZFZhbHVlO1xuICAgICAgc2V0TGFzdFNhdmVkVmFsdWUobGFzdFNhdmVkVmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNhdmluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBjb25zdCBzYXZlZFZhbHVlID0gaW5wdXQudmFsdWU7XG4gICAgICBzZXRMYXN0U2F2ZWRWYWx1ZShzYXZlZFZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2F2aW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5jb25zdCBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyA9IDUwMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGV4TG9naW5TdGF0dXMob3V0cHV0OiBzdHJpbmcpOiBDb2RleExvZ2luU3RhdHVzIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG91dHB1dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJub3QgbG9nZ2VkIGluXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgb3V0XCIpKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgaW5cIikgfHxcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwic2lnbmVkIGluXCIpIHx8XG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcImF1dGhlbnRpY2F0ZWRcIilcbiAgKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLWluXCI7XG4gIH1cblxuICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleExvZ2luU3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgICB9XG5cbiAgICBjb25zdCBleGVjRmlsZUFzeW5jID0gZ2V0RXhlY0ZpbGVBc3luYygpO1xuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIFtcImxvZ2luXCIsIFwic3RhdHVzXCJdLCB7XG4gICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0LFxuICAgICAgdGltZW91dDogQ09ERVhfTE9HSU5fU1RBVFVTX1RJTUVPVVRfTVMsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpIHx8IGlzVGltZW91dEVycm9yKGVycm9yKSB8fCBpc05vZGVSdW50aW1lVW5hdmFpbGFibGUoZXJyb3IpKSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4QmluYXJ5UGF0aCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgbGV0IHJlcTogTm9kZVJlcXVpcmU7XG4gIHRyeSB7XG4gICAgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmcyA9IHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKTtcbiAgY29uc3QgcGF0aCA9IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG4gIGNvbnN0IG9zID0gcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoLCBvcy5ob21lZGlyKCkpO1xuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgc2VhcmNoaW5nLlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Vub2VudEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImNvZGVcIiBpbiBlcnJvciAmJiBlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiO1xufVxuXG5mdW5jdGlvbiBpc1RpbWVvdXRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJraWxsZWRcIiBpbiBlcnJvciAmJiBlcnJvci5raWxsZWQgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBSZWZlcmVuY2VFcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIFR5cGVFcnJvcjtcbn1cblxuZnVuY3Rpb24gZ2V0RXhlY0ZpbGVBc3luYygpOiAoXG4gIGZpbGU6IHN0cmluZyxcbiAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCB7IGV4ZWNGaWxlIH0gPSByZXEoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICBjb25zdCB7IHByb21pc2lmeSB9ID0gcmVxKFwidXRpbFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwidXRpbFwiKTtcbiAgcmV0dXJuIHByb21pc2lmeShleGVjRmlsZSkgYXMgKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVSZXF1aXJlKCk6IE5vZGVSZXF1aXJlIHtcbiAgcmV0dXJuIEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKSBhcyBOb2RlUmVxdWlyZTtcbn1cblxuZnVuY3Rpb24gYnVpbGRDb2RleENhbmRpZGF0ZXMocGF0aE1vZHVsZTogdHlwZW9mIGltcG9ydChcInBhdGhcIiksIGhvbWVEaXI6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwYXRoRW50cmllcyA9IChwcm9jZXNzLmVudi5QQVRIID8/IFwiXCIpLnNwbGl0KHBhdGhNb2R1bGUuZGVsaW1pdGVyKS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBwYXRoRW50cmllcykge1xuICAgIGNhbmRpZGF0ZXMuYWRkKHBhdGhNb2R1bGUuam9pbihlbnRyeSwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICBjb25zdCBjb21tb25EaXJzID0gW1xuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgYCR7aG9tZURpcn0vLmxvY2FsL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmJ1bi9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5jb2RlaXVtL3dpbmRzdXJmL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmFudGlncmF2aXR5L2FudGlncmF2aXR5L2JpbmAsXG4gICAgXCIvQXBwbGljYXRpb25zL0NvZGV4LmFwcC9Db250ZW50cy9SZXNvdXJjZXNcIixcbiAgXTtcblxuICBmb3IgKGNvbnN0IGRpciBvZiBjb21tb25EaXJzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGRpciwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShjYW5kaWRhdGVzKTtcbn1cblxuZnVuY3Rpb24gY29kZXhFeGVjdXRhYmxlTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJjb2RleC5jbWRcIiA6IFwiY29kZXhcIjtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlDb25maWd1cmF0aW9uU3RhdHVzIHtcbiAgY29uZmlndXJlZDogYm9vbGVhbjtcbiAgcHJvdmlkZXI6IFwiY29kZXhcIjtcbiAgbW9kZWw6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBjb25zdCBjb2RleFN0YXR1cyA9IGF3YWl0IGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgaWYgKGNvZGV4U3RhdHVzID09PSBcInVuYXZhaWxhYmxlXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgaW5zdGFsbGVkLlwiLFxuICAgIH07XG4gIH1cblxuICBpZiAoY29kZXhTdGF0dXMgIT09IFwibG9nZ2VkLWluXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgbG9nZ2VkIGluLlwiLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBtb2RlbCA9IHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpIHx8IG51bGw7XG4gIHJldHVybiB7XG4gICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgIG1vZGVsLFxuICAgIG1lc3NhZ2U6IG1vZGVsXG4gICAgICA/IGBSZWFkeSB0byB1c2UgQ29kZXggd2l0aCBtb2RlbCAke21vZGVsfS5gXG4gICAgICA6IFwiUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggdGhlIGFjY291bnQgZGVmYXVsdCBtb2RlbC5cIixcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZXhNb2RlbE9wdGlvbiB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM6IENvZGV4TW9kZWxPcHRpb25bXSA9IFtcbiAgeyB2YWx1ZTogXCJcIiwgbGFiZWw6IFwiQWNjb3VudCBkZWZhdWx0XCIgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUgPSBcIl9fY3VzdG9tX19cIjtcbmNvbnN0IENPREVYX01PREVMX0NBVEFMT0dfVElNRU9VVF9NUyA9IDgwMDA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPENvZGV4TW9kZWxPcHRpb25bXT4ge1xuICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgeyBleGVjRmlsZUFzeW5jIH0gPSBnZXRDb2RleE1vZGVsUnVudGltZSgpO1xuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIFtcImRlYnVnXCIsIFwibW9kZWxzXCJdLCB7XG4gICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogMjAsXG4gICAgICB0aW1lb3V0OiBDT0RFWF9NT0RFTF9DQVRBTE9HX1RJTUVPVVRfTVMsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhNb2RlbENhdGFsb2coYCR7c3Rkb3V0fVxcbiR7c3RkZXJyfWApO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGV4TW9kZWxDYXRhbG9nKG91dHB1dDogc3RyaW5nKTogQ29kZXhNb2RlbE9wdGlvbltdIHtcbiAgY29uc3QganNvblRleHQgPSBleHRyYWN0SnNvbk9iamVjdChvdXRwdXQpO1xuICBpZiAoIWpzb25UZXh0KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uVGV4dCkgYXMge1xuICAgICAgbW9kZWxzPzogQXJyYXk8e1xuICAgICAgICBzbHVnPzogdW5rbm93bjtcbiAgICAgICAgZGlzcGxheV9uYW1lPzogdW5rbm93bjtcbiAgICAgICAgdmlzaWJpbGl0eT86IHVua25vd247XG4gICAgICB9PjtcbiAgICB9O1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBvcHRpb25zID0gWy4uLkRFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OU107XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiBwYXJzZWQubW9kZWxzID8/IFtdKSB7XG4gICAgICBjb25zdCBzbHVnID0gdHlwZW9mIG1vZGVsLnNsdWcgPT09IFwic3RyaW5nXCIgPyBtb2RlbC5zbHVnLnRyaW0oKSA6IFwiXCI7XG4gICAgICBpZiAoIXNsdWcgfHwgc2Vlbi5oYXMoc2x1ZykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobW9kZWwudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG1vZGVsLnZpc2liaWxpdHkgIT09IFwibGlzdFwiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQoc2x1Zyk7XG4gICAgICBvcHRpb25zLnB1c2goe1xuICAgICAgICB2YWx1ZTogc2x1ZyxcbiAgICAgICAgbGFiZWw6IHR5cGVvZiBtb2RlbC5kaXNwbGF5X25hbWUgPT09IFwic3RyaW5nXCIgJiYgbW9kZWwuZGlzcGxheV9uYW1lLnRyaW0oKVxuICAgICAgICAgID8gbW9kZWwuZGlzcGxheV9uYW1lLnRyaW0oKVxuICAgICAgICAgIDogc2x1ZyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUoXG4gIG1vZGVsOiBzdHJpbmcsXG4gIG9wdGlvbnM6IHJlYWRvbmx5IENvZGV4TW9kZWxPcHRpb25bXSA9IERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbik6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBtb2RlbC50cmltKCk7XG4gIGlmICghbm9ybWFsaXplZCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHJldHVybiBvcHRpb25zLnNvbWUoKG9wdGlvbikgPT4gb3B0aW9uLnZhbHVlID09PSBub3JtYWxpemVkKVxuICAgID8gbm9ybWFsaXplZFxuICAgIDogQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNLbm93bkNvZGV4TW9kZWwoXG4gIG1vZGVsOiBzdHJpbmcsXG4gIG9wdGlvbnM6IHJlYWRvbmx5IENvZGV4TW9kZWxPcHRpb25bXSA9IERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbik6IGJvb2xlYW4ge1xuICBjb25zdCBub3JtYWxpemVkID0gbW9kZWwudHJpbSgpO1xuICByZXR1cm4gb3B0aW9ucy5zb21lKChvcHRpb24pID0+IG9wdGlvbi52YWx1ZSA9PT0gbm9ybWFsaXplZCk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RKc29uT2JqZWN0KG91dHB1dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHN0YXJ0ID0gb3V0cHV0LmluZGV4T2YoXCJ7XCIpO1xuICBjb25zdCBlbmQgPSBvdXRwdXQubGFzdEluZGV4T2YoXCJ9XCIpO1xuICBpZiAoc3RhcnQgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHwgZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIG91dHB1dC5zbGljZShzdGFydCwgZW5kICsgMSk7XG59XG5cbmZ1bmN0aW9uIGdldENvZGV4TW9kZWxSdW50aW1lKCk6IHtcbiAgZXhlY0ZpbGVBc3luYzogKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG59IHtcbiAgY29uc3QgcmVxID0gRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpIGFzIE5vZGVSZXF1aXJlO1xuICBjb25zdCB7IGV4ZWNGaWxlIH0gPSByZXEoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICBjb25zdCB7IHByb21pc2lmeSB9ID0gcmVxKFwidXRpbFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwidXRpbFwiKTtcbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZUFzeW5jOiBwcm9taXNpZnkoZXhlY0ZpbGUpIGFzIChcbiAgICAgIGZpbGU6IHN0cmluZyxcbiAgICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICAgIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4sXG4gIH07XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZXhCaW5hcnlQYXRoIH0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LWF1dGhcIjtcblxuY29uc3QgQ09ERVhfQ0hBVF9USU1FT1VUX01TID0gMTIwMDAwO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5BSVNlcnZpY2Uge1xuICBhc3luYyBjb21wbGV0ZUNoYXQoXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucG9zdENvZGV4Q29tcGxldGlvbihzZXR0aW5ncywgbWVzc2FnZXMsIHNpZ25hbCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDb2RleENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBleGVjRmlsZSwgZnMsIG9zLCBwYXRoIH0gPSBnZXRDb2RleFJ1bnRpbWUoKTtcbiAgICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICAgIGlmICghY29kZXhCaW5hcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgIH1cbiAgICBjb25zdCB0ZW1wRGlyID0gYXdhaXQgZnMubWtkdGVtcChwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiYnJhaW4tY29kZXgtXCIpKTtcbiAgICBjb25zdCBvdXRwdXRGaWxlID0gcGF0aC5qb2luKHRlbXBEaXIsIFwicmVzcG9uc2UudHh0XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0tZXBoZW1lcmFsXCIsXG4gICAgICBcIi0tc2FuZGJveFwiLFxuICAgICAgXCJyZWFkLW9ubHlcIixcbiAgICAgIFwiLS1vdXRwdXQtbGFzdC1tZXNzYWdlXCIsXG4gICAgICBvdXRwdXRGaWxlLFxuICAgIF07XG5cbiAgICBpZiAoc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tbW9kZWxcIiwgc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgIH1cblxuICAgIGFyZ3MucHVzaCh0aGlzLmJ1aWxkQ29kZXhQcm9tcHQobWVzc2FnZXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjRmlsZVdpdGhBYm9ydChjb2RleEJpbmFyeSwgYXJncywge1xuICAgICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogNCxcbiAgICAgICAgY3dkOiB0ZW1wRGlyLFxuICAgICAgICB0aW1lb3V0OiBDT0RFWF9DSEFUX1RJTUVPVVRfTVMsXG4gICAgICAgIHNpZ25hbCxcbiAgICAgIH0sIGV4ZWNGaWxlKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShvdXRwdXRGaWxlLCBcInV0ZjhcIik7XG4gICAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgICB9XG4gICAgICBpZiAoaXNUaW1lb3V0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IGRpZCBub3QgcmVzcG9uZCBpbiB0aW1lLiBUcnkgYWdhaW4sIG9yIGNoZWNrIGBjb2RleCBsb2dpbiBzdGF0dXNgIG91dHNpZGUgQnJhaW4uXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCB8fCBpc0Fib3J0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIik7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgZnMucm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvZGV4UHJvbXB0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBtZXNzYWdlc1xuICAgICAgLm1hcCgobWVzc2FnZSkgPT4gYCR7bWVzc2FnZS5yb2xlLnRvVXBwZXJDYXNlKCl9OlxcbiR7bWVzc2FnZS5jb250ZW50fWApXG4gICAgICAuam9pbihcIlxcblxcblwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRDb2RleFJ1bnRpbWUoKToge1xuICBleGVjRmlsZTogKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVPcHRpb25zLFxuICAgIGNhbGxiYWNrPzogKFxuICAgICAgZXJyb3I6IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVFeGNlcHRpb24gfCBudWxsLFxuICAgICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICBzdGRlcnI6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICApID0+IHZvaWQsXG4gICkgPT4gaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5DaGlsZFByb2Nlc3M7XG4gIGZzOiB0eXBlb2YgaW1wb3J0KFwiZnMvcHJvbWlzZXNcIik7XG4gIG9zOiB0eXBlb2YgaW1wb3J0KFwib3NcIik7XG4gIHBhdGg6IHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpO1xufSB7XG4gIGNvbnN0IHJlcSA9IEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKSBhcyBOb2RlUmVxdWlyZTtcbiAgY29uc3QgeyBleGVjRmlsZSB9ID0gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZTogZXhlY0ZpbGUgYXMgKFxuICAgICAgZmlsZTogc3RyaW5nLFxuICAgICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgICAgb3B0aW9ucz86IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVPcHRpb25zLFxuICAgICAgY2FsbGJhY2s/OiAoXG4gICAgICAgIGVycm9yOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlRXhjZXB0aW9uIHwgbnVsbCxcbiAgICAgICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICAgIHN0ZGVycjogc3RyaW5nIHwgQnVmZmVyLFxuICAgICAgKSA9PiB2b2lkLFxuICAgICkgPT4gaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5DaGlsZFByb2Nlc3MsXG4gICAgZnM6IHJlcShcImZzL3Byb21pc2VzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKSxcbiAgICBvczogcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpLFxuICAgIHBhdGg6IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIiksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGV4ZWNGaWxlV2l0aEFib3J0KFxuICBmaWxlOiBzdHJpbmcsXG4gIGFyZ3M6IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyAmIHtcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgfSxcbiAgZXhlY0ZpbGU6IFJldHVyblR5cGU8dHlwZW9mIGdldENvZGV4UnVudGltZT5bXCJleGVjRmlsZVwiXSxcbik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgY29uc3QgY2hpbGQgPSBleGVjRmlsZShmaWxlLCBhcmdzLCBvcHRpb25zLCAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgb3B0aW9ucy5zaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGFib3J0ID0gKCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2hpbGQua2lsbChcIlNJR1RFUk1cIik7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICghY2hpbGQua2lsbGVkKSB7XG4gICAgICAgICAgY2hpbGQua2lsbChcIlNJR0tJTExcIik7XG4gICAgICAgIH1cbiAgICAgIH0sIDE1MDApO1xuICAgIH07XG5cbiAgICBpZiAob3B0aW9ucy5zaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgIGFib3J0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMuc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgYWJvcnQsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpc0Vub2VudEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImNvZGVcIiBpbiBlcnJvciAmJiBlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiO1xufVxuXG5mdW5jdGlvbiBpc1RpbWVvdXRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJraWxsZWRcIiBpbiBlcnJvciAmJiBlcnJvci5raWxsZWQgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzQWJvcnRFcnJvcihlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICBcIm5hbWVcIiBpbiBlcnJvciAmJlxuICAgIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBDb2RleExvZ2luU3RhdHVzLCBnZXRDb2RleExvZ2luU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LWF1dGhcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluQXV0aFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogQnJhaW5QbHVnaW4pIHt9XG5cbiAgYXN5bmMgbG9naW4oKSB7XG4gICAgbmV3IE5vdGljZShcIkluc3RhbGwgdGhlIENvZGV4IENMSSwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gcmV0dXJuIHRvIEJyYWluIGFuZCByZWNoZWNrIENvZGV4IHN0YXR1cy5cIik7XG4gICAgd2luZG93Lm9wZW4oXCJodHRwczovL29wZW5haS5jb20vY29kZXgvZ2V0LXN0YXJ0ZWQvXCIpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29kZXhTdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gICAgcmV0dXJuIGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuY29uc3QgREVGQVVMVF9JTlNUUlVDVElPTlMgPSBbXG4gIFwiIyBCcmFpbiBJbnN0cnVjdGlvbnNcIixcbiAgXCJcIixcbiAgXCJZb3UgYXJlIGhlbHBpbmcgZmlsZSBpbmZvcm1hdGlvbiBpbnRvIHRoaXMgT2JzaWRpYW4gdmF1bHQgYW5kIHJldHJpZXZlIGluZm9ybWF0aW9uIGZyb20gaXQuXCIsXG4gIFwiXCIsXG4gIFwiIyMgT3BlcmF0aW5nIFJ1bGVzXCIsXG4gIFwiLSBLZWVwIGFsbCBwZXJzaXN0ZWQgY29udGVudCBhcyBub3JtYWwgbWFya2Rvd24uXCIsXG4gIFwiLSBVc2Ugb25seSBleHBsaWNpdCB2YXVsdCBjb250ZXh0IHdoZW4gYW5zd2VyaW5nIHJldHJpZXZhbCBxdWVzdGlvbnMuXCIsXG4gIFwiLSBQcmVmZXIgdXBkYXRpbmcgb3IgYXBwZW5kaW5nIHRvIGV4aXN0aW5nIG5vdGVzIG92ZXIgY3JlYXRpbmcgZHVwbGljYXRlcy5cIixcbiAgXCItIFVzZSB3aWtpIGxpbmtzIHdoZW4gdXNlZnVsIGFuZCBzdXBwb3J0ZWQgYnkgdGhlIHByb3ZpZGVkIGNvbnRleHQuXCIsXG4gIFwiLSBVc2UgdGhlIGNvbmZpZ3VyZWQgbm90ZXMgZm9sZGVyIGFzIHRoZSBkZWZhdWx0IGxvY2F0aW9uIGZvciBuZXcgbm90ZXMuXCIsXG4gIFwiLSBJZiB5b3UgYXJlIHVuc3VyZSB3aGVyZSBzb21ldGhpbmcgYmVsb25ncywgYXNrIGEgcXVlc3Rpb24gaW5zdGVhZCBvZiBndWVzc2luZy5cIixcbiAgXCItIE5ldmVyIGRlbGV0ZSBvciBvdmVyd3JpdGUgZXhpc3RpbmcgdXNlciBjb250ZW50LlwiLFxuICBcIi0gUHJvcG9zZSBzYWZlIGFwcGVuZC9jcmVhdGUgb3BlcmF0aW9ucyBhbmQgd2FpdCBmb3IgYXBwcm92YWwgYmVmb3JlIHdyaXRpbmcuXCIsXG4gIFwiXCIsXG5dLmpvaW4oXCJcXG5cIik7XG5cbmV4cG9ydCBjbGFzcyBJbnN0cnVjdGlvblNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVGaWxlKFxuICAgICAgc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfSU5TVFJVQ1RJT05TLFxuICAgICk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoZmlsZS5wYXRoLCBERUZBVUxUX0lOU1RSVUNUSU9OUyk7XG4gICAgICByZXR1cm4gREVGQVVMVF9JTlNUUlVDVElPTlM7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgYXN5bmMgcmVhZEluc3RydWN0aW9ucygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgSW5zdHJ1Y3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vaW5zdHJ1Y3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeU1hdGNoLCBWYXVsdFF1ZXJ5U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXF1ZXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXdyaXRlLXNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWYXVsdENoYXRSZXNwb25zZSB7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgcGxhbjogVmF1bHRXcml0ZVBsYW4gfCBudWxsO1xuICB1c2VkQUk6IGJvb2xlYW47XG59XG5cbmNvbnN0IEVNUFRZX1BMQU46IFZhdWx0V3JpdGVQbGFuID0ge1xuICBzdW1tYXJ5OiBcIlwiLFxuICBjb25maWRlbmNlOiBcImxvd1wiLFxuICBvcGVyYXRpb25zOiBbXSxcbiAgcXVlc3Rpb25zOiBbXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBWYXVsdENoYXRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5zdHJ1Y3Rpb25TZXJ2aWNlOiBJbnN0cnVjdGlvblNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBxdWVyeVNlcnZpY2U6IFZhdWx0UXVlcnlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgd3JpdGVTZXJ2aWNlOiBWYXVsdFdyaXRlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyByZXNwb25kKG1lc3NhZ2U6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFZhdWx0Q2hhdFJlc3BvbnNlPiB7XG4gICAgY29uc3QgdHJpbW1lZCA9IG1lc3NhZ2UudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRW50ZXIgYSBtZXNzYWdlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IFtpbnN0cnVjdGlvbnMsIHNvdXJjZXNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UucmVhZEluc3RydWN0aW9ucygpLFxuICAgICAgdGhpcy5xdWVyeVNlcnZpY2UucXVlcnlWYXVsdCh0cmltbWVkKSxcbiAgICBdKTtcbiAgICBjb25zdCBjb250ZXh0ID0gZm9ybWF0U291cmNlc0ZvclByb21wdChzb3VyY2VzKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHNldHRpbmdzKTtcbiAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNvbXBsZXRlQ2hhdChcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQoaW5zdHJ1Y3Rpb25zLCBzZXR0aW5ncyksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICBgVXNlciBtZXNzYWdlOiAke3RyaW1tZWR9YCxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBcIlJlbGV2YW50IHZhdWx0IGNvbnRleHQ6XCIsXG4gICAgICAgICAgICBjb250ZXh0IHx8IFwiTm8gbWF0Y2hpbmcgdmF1bHQgZmlsZXMgZm91bmQuXCIsXG4gICAgICAgICAgXS5qb2luKFwiXFxuXCIpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHNldHRpbmdzLFxuICAgICAgc2lnbmFsLFxuICAgICk7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VDaGF0UmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHBhcnNlZC5hbnN3ZXIgfHwgXCJDb2RleCByZXR1cm5lZCBubyBhbnN3ZXIuXCIsXG4gICAgICBzb3VyY2VzLFxuICAgICAgcGxhbjogcGFyc2VkLnBsYW4gPyB0aGlzLndyaXRlU2VydmljZS5ub3JtYWxpemVQbGFuKHBhcnNlZC5wbGFuKSA6IG51bGwsXG4gICAgICB1c2VkQUk6IHRydWUsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZFN5c3RlbVByb21wdChcbiAgaW5zdHJ1Y3Rpb25zOiBzdHJpbmcsXG4gIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBcIllvdSBhcmUgQnJhaW4sIGFuIE9ic2lkaWFuIHZhdWx0IGFzc2lzdGFudC5cIixcbiAgICBcIllvdSByZXRyaWV2ZSBpbmZvcm1hdGlvbiBmcm9tIGV4cGxpY2l0IG1hcmtkb3duIGNvbnRleHQgYW5kIHByb3Bvc2Ugc2FmZSB2YXVsdCB3cml0ZXMuXCIsXG4gICAgXCJOZXZlciBjbGFpbSBmYWN0cyB0aGF0IGFyZSBub3QgaW4gdGhlIHByb3ZpZGVkIHZhdWx0IGNvbnRleHQuXCIsXG4gICAgXCJOZXZlciBkaXJlY3RseSB3cml0ZSBmaWxlcy4gUmV0dXJuIG9ubHkgYSBKU09OIG9iamVjdC5cIixcbiAgICBcIlwiLFxuICAgIFwiUmV0dXJuIHRoaXMgSlNPTiBzaGFwZTpcIixcbiAgICBcIntcIixcbiAgICAnICBcImFuc3dlclwiOiBcIm1hcmtkb3duIGFuc3dlciB3aXRoIGV2aWRlbmNlIGFuZCBnYXBzXCIsJyxcbiAgICAnICBcInBsYW5cIjogeycsXG4gICAgJyAgICBcInN1bW1hcnlcIjogXCJzaG9ydCBzdW1tYXJ5IG9mIHByb3Bvc2VkIHdyaXRlcywgb3IgZW1wdHkgc3RyaW5nXCIsJyxcbiAgICAnICAgIFwiY29uZmlkZW5jZVwiOiBcImxvd3xtZWRpdW18aGlnaFwiLCcsXG4gICAgJyAgICBcIm9wZXJhdGlvbnNcIjogWycsXG4gICAgJyAgICAgIHtcInR5cGVcIjpcImFwcGVuZFwiLFwicGF0aFwiOlwiU29tZS9GaWxlLm1kXCIsXCJjb250ZW50XCI6XCJtYXJrZG93blwifSwnLFxuICAgICcgICAgICB7XCJ0eXBlXCI6XCJjcmVhdGVcIixcInBhdGhcIjpcIlNvbWUvTmV3IEZpbGUubWRcIixcImNvbnRlbnRcIjpcIm1hcmtkb3duXCJ9JyxcbiAgICBcIiAgICBdLFwiLFxuICAgICcgICAgXCJxdWVzdGlvbnNcIjogW1wib3BlbiBxdWVzdGlvbiBpZiB5b3UgbmVlZCBjbGFyaWZpY2F0aW9uXCJdJyxcbiAgICBcIiAgfVwiLFxuICAgIFwifVwiLFxuICAgIFwiXCIsXG4gICAgXCJPbmx5IGluY2x1ZGUgd3JpdGUgb3BlcmF0aW9ucyB3aGVuIHRoZSB1c2VyIGFza3MgdG8gYWRkLCBzYXZlLCBmaWxlLCByZW1lbWJlciwgdXBkYXRlLCBjcmVhdGUsIG9yIG90aGVyd2lzZSBwdXQgaW5mb3JtYXRpb24gaW50byB0aGUgdmF1bHQuXCIsXG4gICAgXCJVc2UgYXBwZW5kL2NyZWF0ZSBvcGVyYXRpb25zIG9ubHkuIERvIG5vdCBwcm9wb3NlIGRlbGV0ZSBvciByZXBsYWNlIG9wZXJhdGlvbnMuXCIsXG4gICAgYERlZmF1bHQgbm90ZXMgZm9sZGVyOiAke3NldHRpbmdzLm5vdGVzRm9sZGVyfWAsXG4gICAgXCJcIixcbiAgICBcIlZhdWx0IGluc3RydWN0aW9uczpcIixcbiAgICBpbnN0cnVjdGlvbnMsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0U291cmNlc0ZvclByb21wdChzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHN0cmluZyB7XG4gIHJldHVybiBzb3VyY2VzXG4gICAgLm1hcCgoc291cmNlLCBpbmRleCkgPT4gW1xuICAgICAgYCMjIFNvdXJjZSAke2luZGV4ICsgMX06ICR7c291cmNlLnBhdGh9YCxcbiAgICAgIGBUaXRsZTogJHtzb3VyY2UudGl0bGV9YCxcbiAgICAgIGBSZWFzb246ICR7c291cmNlLnJlYXNvbn1gLFxuICAgICAgXCJcIixcbiAgICAgIHNvdXJjZS50ZXh0LnNsaWNlKDAsIDM1MDApLFxuICAgIF0uam9pbihcIlxcblwiKSlcbiAgICAuam9pbihcIlxcblxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VDaGF0UmVzcG9uc2UocmVzcG9uc2U6IHN0cmluZyk6IHtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIHBsYW46IFZhdWx0V3JpdGVQbGFuIHwgbnVsbDtcbn0ge1xuICBjb25zdCBqc29uVGV4dCA9IGV4dHJhY3RKc29uKHJlc3BvbnNlKTtcbiAgaWYgKCFqc29uVGV4dCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHJlc3BvbnNlLnRyaW0oKSxcbiAgICAgIHBsYW46IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uVGV4dCkgYXMge1xuICAgICAgYW5zd2VyPzogdW5rbm93bjtcbiAgICAgIHBsYW4/OiB1bmtub3duO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogdHlwZW9mIHBhcnNlZC5hbnN3ZXIgPT09IFwic3RyaW5nXCIgPyBwYXJzZWQuYW5zd2VyLnRyaW0oKSA6IFwiXCIsXG4gICAgICBwbGFuOiBpc1BsYW5PYmplY3QocGFyc2VkLnBsYW4pID8gcGFyc2VkLnBsYW4gOiBFTVBUWV9QTEFOLFxuICAgIH07XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHJlc3BvbnNlLnRyaW0oKSxcbiAgICAgIHBsYW46IG51bGwsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0SnNvbih0ZXh0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgZmVuY2VkID0gdGV4dC5tYXRjaCgvYGBgKD86anNvbik/XFxzKihbXFxzXFxTXSo/KWBgYC9pKT8uWzFdO1xuICBpZiAoZmVuY2VkKSB7XG4gICAgcmV0dXJuIGZlbmNlZC50cmltKCk7XG4gIH1cbiAgY29uc3Qgc3RhcnQgPSB0ZXh0LmluZGV4T2YoXCJ7XCIpO1xuICBjb25zdCBlbmQgPSB0ZXh0Lmxhc3RJbmRleE9mKFwifVwiKTtcbiAgaWYgKHN0YXJ0ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8IGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB0ZXh0LnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcbn1cblxuZnVuY3Rpb24gaXNQbGFuT2JqZWN0KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVmF1bHRXcml0ZVBsYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsO1xufVxuIiwgImltcG9ydCB0eXBlIHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWYXVsdFF1ZXJ5TWF0Y2gge1xuICBwYXRoOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHNjb3JlOiBudW1iZXI7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBleGNlcnB0OiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuY29uc3QgTUFYX1FVRVJZX0ZJTEVTID0gMTI7XG5jb25zdCBNQVhfRVhDRVJQVF9DSEFSUyA9IDcwMDtcbmNvbnN0IE1BWF9TTklQUEVUX0xJTkVTID0gNTtcblxuZXhwb3J0IGNsYXNzIFZhdWx0UXVlcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBxdWVyeVZhdWx0KHF1ZXJ5OiBzdHJpbmcsIGxpbWl0ID0gTUFYX1FVRVJZX0ZJTEVTKTogUHJvbWlzZTxWYXVsdFF1ZXJ5TWF0Y2hbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdG9rZW5zID0gdG9rZW5pemUocXVlcnkpO1xuICAgIGNvbnN0IGZpbGVzID0gKGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCkpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBzaG91bGRJbmNsdWRlRmlsZShmaWxlLCBzZXR0aW5ncykpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuXG4gICAgY29uc3QgbWF0Y2hlczogVmF1bHRRdWVyeU1hdGNoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZUZpbGUoZmlsZSwgdGV4dCwgcXVlcnksIHRva2Vucyk7XG4gICAgICBpZiAoc2NvcmUgPD0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGZpbGUucGF0aCxcbiAgICAgICAgdGl0bGU6IHRpdGxlRm9yRmlsZShmaWxlLCB0ZXh0KSxcbiAgICAgICAgc2NvcmUsXG4gICAgICAgIHJlYXNvbjogYnVpbGRSZWFzb24oZmlsZSwgdGV4dCwgcXVlcnksIHRva2VucyksXG4gICAgICAgIGV4Y2VycHQ6IGJ1aWxkRXhjZXJwdCh0ZXh0LCB0b2tlbnMpLFxuICAgICAgICB0ZXh0LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc2NvcmUgLSBsZWZ0LnNjb3JlKVxuICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRJbmNsdWRlRmlsZShmaWxlOiBURmlsZSwgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIGZpbGUucGF0aCAhPT0gc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcmV0dXJuIGlucHV0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoL1teYS16MC05Xy8tXSsvaSlcbiAgICAubWFwKCh0b2tlbikgPT4gdG9rZW4udHJpbSgpKVxuICAgIC5maWx0ZXIoKHRva2VuKSA9PiB0b2tlbi5sZW5ndGggPj0gMylcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4ge1xuICAgICAgaWYgKHNlZW4uaGFzKHRva2VuKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZCh0b2tlbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIC5zbGljZSgwLCAyNCk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nLCBxdWVyeTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgaWYgKCF0b2tlbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KDEsIE1hdGgucm91bmQoZmlsZS5zdGF0Lm10aW1lIC8gMTAwMDAwMDAwMDAwMCkpO1xuICB9XG5cbiAgY29uc3QgbG93ZXJQYXRoID0gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGl0bGUgPSB0aXRsZUZvckZpbGUoZmlsZSwgdGV4dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBub3JtYWxpemVkVGV4dCA9IG5vcm1hbGl6ZVBocmFzZSh0ZXh0KTtcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gbm9ybWFsaXplUGhyYXNlKHF1ZXJ5KTtcbiAgbGV0IHNjb3JlID0gMDtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgc2NvcmUgKz0gMTg7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBsb3dlclBhdGguaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDI0O1xuICB9XG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKGxvd2VyUGF0aC5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDEwO1xuICAgIH1cbiAgICBpZiAobG93ZXJUaXRsZS5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDk7XG4gICAgfVxuICAgIGNvbnN0IGhlYWRpbmdNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxuKSN7MSw2fVteXFxcXG5dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1gLCBcImdcIikpO1xuICAgIGlmIChoZWFkaW5nTWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gaGVhZGluZ01hdGNoZXMubGVuZ3RoICogNztcbiAgICB9XG4gICAgY29uc3QgbGlua01hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgXFxcXFtcXFxcW1teXFxcXF1dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bXlxcXFxdXSpcXFxcXVxcXFxdYCwgXCJnXCIpKTtcbiAgICBpZiAobGlua01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IGxpbmtNYXRjaGVzLmxlbmd0aCAqIDY7XG4gICAgfVxuICAgIGNvbnN0IHRhZ01hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgKF58XFxcXHMpI1stL19hLXowLTldKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bLS9fYS16MC05XSpgLCBcImdpXCIpKTtcbiAgICBpZiAodGFnTWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gdGFnTWF0Y2hlcy5sZW5ndGggKiA1O1xuICAgIH1cbiAgICBjb25zdCB0ZXh0TWF0Y2hlcyA9IGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cCh0b2tlbiksIFwiZ1wiKSk7XG4gICAgaWYgKHRleHRNYXRjaGVzKSB7XG4gICAgICBzY29yZSArPSBNYXRoLm1pbig4LCB0ZXh0TWF0Y2hlcy5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1hdGNoZWRUb2tlbnMgPSB0b2tlbnMuZmlsdGVyKCh0b2tlbikgPT4gbG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSB8fCBsb3dlclRleHQuaW5jbHVkZXModG9rZW4pKTtcbiAgc2NvcmUgKz0gbWF0Y2hlZFRva2Vucy5sZW5ndGggKiAzO1xuICBpZiAobWF0Y2hlZFRva2Vucy5sZW5ndGggPT09IHRva2Vucy5sZW5ndGgpIHtcbiAgICBzY29yZSArPSBNYXRoLm1pbigxMCwgdG9rZW5zLmxlbmd0aCAqIDIpO1xuICB9XG4gIHNjb3JlICs9IE1hdGgubWluKDMsIGZpbGUuc3RhdC5tdGltZSAvIERhdGUubm93KCkpO1xuICByZXR1cm4gc2NvcmU7XG59XG5cbmZ1bmN0aW9uIHRpdGxlRm9yRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGVhZGluZyA9IHRleHQubWF0Y2goL14jXFxzKyguKykkL20pPy5bMV0/LnRyaW0oKTtcbiAgaWYgKGhlYWRpbmcpIHtcbiAgICByZXR1cm4gaGVhZGluZztcbiAgfVxuICByZXR1cm4gZmlsZS5iYXNlbmFtZSB8fCBmaWxlLnBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGUucGF0aDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZWFzb24oZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGNvbnN0IHJlYXNvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgcmVhc29ucy5hZGQoXCJleGFjdCBwaHJhc2UgbWF0Y2hcIik7XG4gIH1cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAobG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHBhdGggbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgdGl0bGUgbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCkpKSB7XG4gICAgICByZWFzb25zLmFkZChgaGVhZGluZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKGBbWyR7dG9rZW59YCkgfHwgbG93ZXJUZXh0LmluY2x1ZGVzKGAke3Rva2VufV1dYCkpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBsaW5rIG1lbnRpb25zIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJpXCIpKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHRhZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYGNvbnRlbnQgbWVudGlvbnMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKHJlYXNvbnMpLnNsaWNlKDAsIDMpLmpvaW4oXCIsIFwiKSB8fCBcInJlY2VudCBtYXJrZG93biBub3RlXCI7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRXhjZXJwdCh0ZXh0OiBzdHJpbmcsIHRva2Vuczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VMaW5lcyA9IHRleHQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IHJhbmtlZCA9IHNvdXJjZUxpbmVzXG4gICAgLm1hcCgobGluZSwgaW5kZXgpID0+ICh7IGluZGV4LCBzY29yZTogc2NvcmVMaW5lKGxpbmUsIHRva2VucykgfSkpXG4gICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zY29yZSAtIGxlZnQuc2NvcmUgfHwgbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4KTtcbiAgY29uc3QgYmVzdExpbmUgPSByYW5rZWQuZmluZCgobGluZSkgPT4gbGluZS5zY29yZSA+IDApPy5pbmRleCA/PyAwO1xuICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIGJlc3RMaW5lIC0gMik7XG4gIGNvbnN0IGVuZCA9IE1hdGgubWluKHNvdXJjZUxpbmVzLmxlbmd0aCwgc3RhcnQgKyBNQVhfU05JUFBFVF9MSU5FUyk7XG4gIGNvbnN0IGV4Y2VycHQgPSBzb3VyY2VMaW5lc1xuICAgIC5zbGljZShzdGFydCwgZW5kKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIGV4Y2VycHQubGVuZ3RoID4gTUFYX0VYQ0VSUFRfQ0hBUlNcbiAgICA/IGAke2V4Y2VycHQuc2xpY2UoMCwgTUFYX0VYQ0VSUFRfQ0hBUlMgLSAzKS50cmltRW5kKCl9Li4uYFxuICAgIDogZXhjZXJwdDtcbn1cblxuZnVuY3Rpb24gc2NvcmVMaW5lKGxpbmU6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICBsZXQgc2NvcmUgPSAwO1xuICBpZiAobGluZS50cmltKCkuc3RhcnRzV2l0aChcIiNcIikpIHtcbiAgICBzY29yZSArPSA0O1xuICB9XG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKCFsb3dlci5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBzY29yZSArPSAzO1xuICAgIGlmIChsb3dlci5pbmNsdWRlcyhgW1ske3Rva2VufWApIHx8IGxvd2VyLmluY2x1ZGVzKGAke3Rva2VufV1dYCkpIHtcbiAgICAgIHNjb3JlICs9IDI7XG4gICAgfVxuICAgIGlmIChsb3dlci5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxccykjWy0vX2EtejAtOV0qJHtlc2NhcGVSZWdFeHAodG9rZW4pfVstL19hLXowLTldKmAsIFwiaVwiKSkpIHtcbiAgICAgIHNjb3JlICs9IDI7XG4gICAgfVxuICB9XG4gIHJldHVybiBzY29yZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUGhyYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBub3JtYWxpemVQYXRoLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNsYXNzIFZhdWx0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHApIHt9XG5cbiAgYXN5bmMgZW5zdXJlS25vd25Gb2xkZXJzKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZm9sZGVycyA9IG5ldyBTZXQoW1xuICAgICAgc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICBwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSksXG4gICAgXSk7XG5cbiAgICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmb2xkZXJQYXRoKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZ21lbnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlRm9sZGVySWZNaXNzaW5nKGN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmICghKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZm9sZGVyOiAke2N1cnJlbnR9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBpbml0aWFsQ29udGVudCA9IFwiXCIpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZmlsZTogJHtub3JtYWxpemVkfWApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihub3JtYWxpemVkKSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBpbml0aWFsQ29udGVudCk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IGN1cnJlbnQubGVuZ3RoID09PSAwXG4gICAgICA/IFwiXCJcbiAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblxcblwiKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgICAgICAgPyBcIlxcblwiXG4gICAgICAgICAgOiBcIlxcblxcblwiO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgJHtjdXJyZW50fSR7c2VwYXJhdG9yfSR7bm9ybWFsaXplZENvbnRlbnR9YCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbm9ybWFsaXplZENvbnRlbnQpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlVW5pcXVlRmlsZVBhdGgoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBkb3RJbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3RJbmRleCA9PT0gLTEgPyBub3JtYWxpemVkIDogbm9ybWFsaXplZC5zbGljZSgwLCBkb3RJbmRleCk7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZG90SW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoZG90SW5kZXgpO1xuXG4gICAgbGV0IGNvdW50ZXIgPSAyO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2NvdW50ZXJ9JHtleHRlbnNpb259YDtcbiAgICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICAgIGNvdW50ZXIgKz0gMTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsaXN0TWFya2Rvd25GaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVGb2xkZXJJZk1pc3NpbmcoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJlbnRGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKDAsIGluZGV4KTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCB0eXBlIFZhdWx0V3JpdGVPcGVyYXRpb24gPVxuICB8IHtcbiAgICAgIHR5cGU6IFwiYXBwZW5kXCI7XG4gICAgICBwYXRoOiBzdHJpbmc7XG4gICAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9XG4gIHwge1xuICAgICAgdHlwZTogXCJjcmVhdGVcIjtcbiAgICAgIHBhdGg6IHN0cmluZztcbiAgICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmF1bHRXcml0ZVBsYW4ge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U6IFwibG93XCIgfCBcIm1lZGl1bVwiIHwgXCJoaWdoXCI7XG4gIG9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcXVlc3Rpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0V3JpdGVTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBub3JtYWxpemVQbGFuKHBsYW46IFBhcnRpYWw8VmF1bHRXcml0ZVBsYW4+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBWYXVsdFdyaXRlUGxhbiB7XG4gICAgY29uc3QgY29uZmlkZW5jZSA9IHJlYWRDb25maWRlbmNlKHBsYW4uY29uZmlkZW5jZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1bW1hcnk6IHR5cGVvZiBwbGFuLnN1bW1hcnkgPT09IFwic3RyaW5nXCIgJiYgcGxhbi5zdW1tYXJ5LnRyaW0oKVxuICAgICAgICA/IHBsYW4uc3VtbWFyeS50cmltKClcbiAgICAgICAgOiBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IHVwZGF0ZXMuXCIsXG4gICAgICBjb25maWRlbmNlLFxuICAgICAgb3BlcmF0aW9uczogKEFycmF5LmlzQXJyYXkocGxhbi5vcGVyYXRpb25zKSA/IHBsYW4ub3BlcmF0aW9ucyA6IFtdKVxuICAgICAgICAubWFwKChvcGVyYXRpb24pID0+IHRoaXMubm9ybWFsaXplT3BlcmF0aW9uKG9wZXJhdGlvbikpXG4gICAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbik6IG9wZXJhdGlvbiBpcyBWYXVsdFdyaXRlT3BlcmF0aW9uID0+IG9wZXJhdGlvbiAhPT0gbnVsbClcbiAgICAgICAgLnNsaWNlKDAsIDgpLFxuICAgICAgcXVlc3Rpb25zOiAoQXJyYXkuaXNBcnJheShwbGFuLnF1ZXN0aW9ucykgPyBwbGFuLnF1ZXN0aW9ucyA6IFtdKVxuICAgICAgICAubWFwKChxdWVzdGlvbikgPT4gU3RyaW5nKHF1ZXN0aW9uKS50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLnNsaWNlKDAsIDUpLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBseVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IHRoaXMubm9ybWFsaXplUGxhbihwbGFuKTtcbiAgICBjb25zdCBwYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG9wZXJhdGlvbiBvZiBub3JtYWxpemVkLm9wZXJhdGlvbnMpIHtcbiAgICAgIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJhcHBlbmRcIikge1xuICAgICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KG9wZXJhdGlvbi5wYXRoLCBvcGVyYXRpb24uY29udGVudCk7XG4gICAgICAgIHBhdGhzLnB1c2gob3BlcmF0aW9uLnBhdGgpO1xuICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJjcmVhdGVcIikge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgob3BlcmF0aW9uLnBhdGgpO1xuICAgICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChwYXRoLCBvcGVyYXRpb24uY29udGVudCk7XG4gICAgICAgIHBhdGhzLnB1c2gocGF0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQocGF0aHMpKTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplT3BlcmF0aW9uKG9wZXJhdGlvbjogdW5rbm93bik6IFZhdWx0V3JpdGVPcGVyYXRpb24gfCBudWxsIHtcbiAgICBpZiAoIW9wZXJhdGlvbiB8fCB0eXBlb2Ygb3BlcmF0aW9uICE9PSBcIm9iamVjdFwiIHx8ICEoXCJ0eXBlXCIgaW4gb3BlcmF0aW9uKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuZGlkYXRlID0gb3BlcmF0aW9uIGFzIFBhcnRpYWw8VmF1bHRXcml0ZU9wZXJhdGlvbj47XG4gICAgY29uc3QgY29udGVudCA9IFwiY29udGVudFwiIGluIGNhbmRpZGF0ZSA/IFN0cmluZyhjYW5kaWRhdGUuY29udGVudCA/PyBcIlwiKS50cmltKCkgOiBcIlwiO1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGNhbmRpZGF0ZS50eXBlICE9PSBcImFwcGVuZFwiICYmIGNhbmRpZGF0ZS50eXBlICE9PSBcImNyZWF0ZVwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBwYXRoID0gXCJwYXRoXCIgaW4gY2FuZGlkYXRlXG4gICAgICA/IG5vcm1hbGl6ZU1hcmtkb3duUGF0aChTdHJpbmcoY2FuZGlkYXRlLnBhdGggPz8gXCJcIikpXG4gICAgICA6IFwiXCI7XG4gICAgaWYgKCF0aGlzLmlzU2FmZU1hcmtkb3duUGF0aChwYXRoKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IGNhbmRpZGF0ZS50eXBlLFxuICAgICAgcGF0aCxcbiAgICAgIGNvbnRlbnQsXG4gICAgICBkZXNjcmlwdGlvbjogcmVhZERlc2NyaXB0aW9uKGNhbmRpZGF0ZSksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaXNTYWZlTWFya2Rvd25QYXRoKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBwYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgcmV0dXJuIChcbiAgICAgIEJvb2xlYW4ocGF0aCkgJiZcbiAgICAgIHBhdGguZW5kc1dpdGgoXCIubWRcIikgJiZcbiAgICAgIHBhdGggIT09IHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUgJiZcbiAgICAgICFwYXRoLmluY2x1ZGVzKFwiLi5cIikgJiZcbiAgICAgIHNlZ21lbnRzLmV2ZXJ5KChzZWdtZW50KSA9PiAhc2VnbWVudC5zdGFydHNXaXRoKFwiLlwiKSlcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWREZXNjcmlwdGlvbihvcGVyYXRpb246IFBhcnRpYWw8VmF1bHRXcml0ZU9wZXJhdGlvbj4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdHlwZW9mIG9wZXJhdGlvbi5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgPyBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb25maWRlbmNlKHZhbHVlOiB1bmtub3duKTogVmF1bHRXcml0ZVBsYW5bXCJjb25maWRlbmNlXCJdIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcImxvd1wiIHx8IHZhbHVlID09PSBcIm1lZGl1bVwiIHx8IHZhbHVlID09PSBcImhpZ2hcIiA/IHZhbHVlIDogXCJtZWRpdW1cIjtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWFya2Rvd25QYXRoKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL1xcLysvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL15cXC8rLywgXCJcIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBJdGVtVmlldywgTWFya2Rvd25SZW5kZXJlciwgVEZpbGUsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgVmF1bHRDaGF0UmVzcG9uc2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtY2hhdC1zZXJ2aWNlXCI7XG5pbXBvcnQgdHlwZSB7IFZhdWx0UXVlcnlNYXRjaCB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1xdWVyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFBsYW5Nb2RhbCB9IGZyb20gXCIuL3ZhdWx0LXBsYW4tbW9kYWxcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQge1xuICBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbiAgQ29kZXhNb2RlbE9wdGlvbixcbiAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zLFxuICBpc0tub3duQ29kZXhNb2RlbCxcbn0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LW1vZGVsc1wiO1xuXG5pbnRlcmZhY2UgQXBwV2l0aFNldHRpbmdzIGV4dGVuZHMgQXBwIHtcbiAgc2V0dGluZz86IHtcbiAgICBvcGVuKCk6IHZvaWQ7XG4gICAgb3BlblRhYkJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0VHVybiB7XG4gIHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgdXBkYXRlZFBhdGhzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSBtZXNzYWdlc0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlbFJvd0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2VuZEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RvcEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgY2xlYXJCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgaXNMb2FkaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgY3VycmVudEFib3J0Q29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YXJ0ZWRBdCA9IDA7XG4gIHByaXZhdGUgbG9hZGluZ1RpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nVGV4dCA9IFwiXCI7XG4gIHByaXZhdGUgcmVuZGVyR2VuZXJhdGlvbiA9IDA7XG4gIHByaXZhdGUgdHVybnM6IENoYXRUdXJuW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSQUlOX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQnJhaW5cIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpblwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1zaWRlYmFyXCIpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkFzayB5b3VyIHZhdWx0LCBvciB0ZWxsIEJyYWluIHdoYXQgdG8gZmlsZS5cIixcbiAgICB9KTtcblxuICAgIHRoaXMubW9kZWxSb3dFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW1vZGVsLXJvd1wiIH0pO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG5cbiAgICB0aGlzLm1lc3NhZ2VzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LW1lc3NhZ2VzXCIgfSk7XG4gICAgdGhpcy5yZW5kZXJFbXB0eVN0YXRlKCk7XG5cbiAgICBjb25zdCBjb21wb3NlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNvbXBvc2VyXCIgfSk7XG4gICAgdGhpcy5pbnB1dEVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY2hhdC1pbnB1dFwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBwbGFjZWhvbGRlcjogXCJBc2sgYWJvdXQgeW91ciB2YXVsdCwgb3IgcGFzdGUgcm91Z2ggbm90ZXMgZm9yIEJyYWluIHRvIGZpbGUuLi5cIixcbiAgICAgICAgcm93czogXCI2XCIsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbXBvc2VyLmFwcGVuZENoaWxkKHRoaXMuaW5wdXRFbCk7XG4gICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2VuZE1lc3NhZ2UoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZXhhbXBsZXMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wcm9tcHQtY2hpcHNcIiB9KTtcbiAgICB0aGlzLmNyZWF0ZVByb21wdENoaXAoZXhhbXBsZXMsIFwiV2hhdCBkbyBJIGtub3cgYWJvdXQuLi5cIiwgXCJXaGF0IGRvIEkga25vdyBhYm91dCBcIik7XG4gICAgdGhpcy5jcmVhdGVQcm9tcHRDaGlwKGV4YW1wbGVzLCBcIkZpbGUgdGhpc1wiLCBcIkZpbGUgdGhpcyBpbiB0aGUgcmlnaHQgcGxhY2U6XFxuXFxuXCIpO1xuICAgIHRoaXMuY3JlYXRlUHJvbXB0Q2hpcChleGFtcGxlcywgXCJGaW5kIHJlbGF0ZWQgbm90ZXNcIiwgXCJGaW5kIHJlbGF0ZWQgbm90ZXMgZm9yIFwiKTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1hY3Rpb24tcm93XCIgfSk7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwgPSBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiU2VuZFwiLFxuICAgIH0pO1xuICAgIHRoaXMuc2VuZEJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuc2VuZE1lc3NhZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc3RvcFwiLFxuICAgICAgdGV4dDogXCJTdG9wXCIsXG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc3RvcEN1cnJlbnRSZXF1ZXN0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuZGlzYWJsZWQgPSB0cnVlO1xuICAgIGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJJbnN0cnVjdGlvbnNcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuY2xlYXJCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDbGVhclwiLFxuICAgIH0pO1xuICAgIHRoaXMuY2xlYXJCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy50dXJucyA9IFtdO1xuICAgICAgdm9pZCB0aGlzLnJlbmRlck1lc3NhZ2VzKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnN0YXR1c0VsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1zdGF0dXNcIiB9KTtcbiAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICAgIHRoaXMuc3RvcExvYWRpbmdUaW1lcigpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnN0YXR1c0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzRWwuZW1wdHkoKTtcbiAgICBsZXQgYWlDb25maWd1cmVkID0gZmFsc2U7XG4gICAgbGV0IHN0YXR1c1RleHQgPSBcIkNvdWxkIG5vdCBjaGVjayBDb2RleFwiO1xuICAgIGxldCBidXR0b25UZXh0ID0gXCJDb25uZWN0XCI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIGFpQ29uZmlndXJlZCA9IGFpU3RhdHVzLmNvbmZpZ3VyZWQ7XG4gICAgICBzdGF0dXNUZXh0ID0gZm9ybWF0UHJvdmlkZXJTdGF0dXMoYWlTdGF0dXMpO1xuICAgICAgYnV0dG9uVGV4dCA9IGFpQ29uZmlndXJlZCA/IFwiTWFuYWdlXCIgOiBcIkNvbm5lY3RcIjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQUk6ICR7c3RhdHVzVGV4dH0gYCB9KTtcbiAgICB0aGlzLnN0YXR1c0VsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICB0ZXh0OiBidXR0b25UZXh0LFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBhcHAgPSB0aGlzLmFwcCBhcyBBcHBXaXRoU2V0dGluZ3M7XG4gICAgICBpZiAoIWFwcC5zZXR0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFwcC5zZXR0aW5nLm9wZW4oKTtcbiAgICAgIGFwcC5zZXR0aW5nLm9wZW5UYWJCeUlkKHRoaXMucGx1Z2luLm1hbmlmZXN0LmlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZE1lc3NhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtZXNzYWdlIHx8IHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgICB0aGlzLmFkZFR1cm4oXCJ1c2VyXCIsIG1lc3NhZ2UpO1xuICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wbHVnaW4uY2hhdFdpdGhWYXVsdChtZXNzYWdlLCBjb250cm9sbGVyLnNpZ25hbCk7XG4gICAgICB0aGlzLnJlbmRlclJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGlzU3RvcHBlZFJlcXVlc3QoZXJyb3IpKSB7XG4gICAgICAgIHRoaXMuYWRkVHVybihcImJyYWluXCIsIFwiQ29kZXggcmVxdWVzdCBzdG9wcGVkLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgY2hhdCB3aXRoIHRoZSB2YXVsdFwiKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdG9wQ3VycmVudFJlcXVlc3QoKTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVQcm9tcHRDaGlwKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIHByb21wdDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1wcm9tcHQtY2hpcFwiLFxuICAgICAgdGV4dDogbGFiZWwsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IHByb21wdDtcbiAgICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICAgICAgdGhpcy5pbnB1dEVsLmZvY3VzKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck1vZGVsU2VsZWN0b3IoKTogdm9pZCB7XG4gICAgdGhpcy5tb2RlbFJvd0VsLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtbGFiZWxcIixcbiAgICAgIHRleHQ6IFwiTW9kZWxcIixcbiAgICB9KTtcbiAgICBpZiAodGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nKSB7XG4gICAgICB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWFjdGl2ZVwiLFxuICAgICAgICB0ZXh0OiBcIkxvYWRpbmcgQ29kZXggbW9kZWxzLi4uXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ID0gdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RlbC1zZWxlY3RcIixcbiAgICB9KTtcbiAgICBzZWxlY3QuZGlzYWJsZWQgPSB0aGlzLmlzTG9hZGluZztcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm1vZGVsT3B0aW9ucykge1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdmFsdWU6IG9wdGlvbi52YWx1ZSxcbiAgICAgICAgdGV4dDogb3B0aW9uLmxhYmVsLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB2YWx1ZTogQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICAgICAgdGV4dDogXCJDdXN0b20uLi5cIixcbiAgICB9KTtcbiAgICBzZWxlY3QudmFsdWUgPSB0aGlzLmN1c3RvbU1vZGVsRHJhZnRcbiAgICAgID8gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgICA6IGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKTtcbiAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuaGFuZGxlTW9kZWxTZWxlY3Rpb24oc2VsZWN0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGlmIChzZWxlY3QudmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tTW9kZWxEcmFmdCAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgICB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtYWN0aXZlXCIsXG4gICAgICAgICAgdGV4dDogYEFjdGl2ZTogJHt0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKX1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlucHV0ID0gdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtY3VzdG9tXCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgICBwbGFjZWhvbGRlcjogXCJDb2RleCBtb2RlbCBpZFwiLFxuICAgICAgICB9LFxuICAgICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgIGlucHV0LmRpc2FibGVkID0gdGhpcy5pc0xvYWRpbmc7XG4gICAgICBpbnB1dC52YWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fCBpc0tub3duQ29kZXhNb2RlbCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucylcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbDtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVDdXN0b21Nb2RlbChpbnB1dC52YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoTW9kZWxPcHRpb25zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zID0gYXdhaXQgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZU1vZGVsU2VsZWN0aW9uKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gdmFsdWU7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbW9kZWwgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IG1vZGVsO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJSZXNwb25zZShyZXNwb25zZTogVmF1bHRDaGF0UmVzcG9uc2UpOiB2b2lkIHtcbiAgICB0aGlzLmFkZFR1cm4oXCJicmFpblwiLCByZXNwb25zZS5hbnN3ZXIudHJpbSgpLCByZXNwb25zZS5zb3VyY2VzKTtcblxuICAgIGlmIChyZXNwb25zZS5wbGFuICYmIHJlc3BvbnNlLnBsYW4ub3BlcmF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBuZXcgVmF1bHRQbGFuTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgcGxhbjogcmVzcG9uc2UucGxhbixcbiAgICAgICAgb25BcHByb3ZlOiBhc3luYyAocGxhbikgPT4gdGhpcy5wbHVnaW4uYXBwbHlWYXVsdFdyaXRlUGxhbihwbGFuKSxcbiAgICAgICAgb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UsIHBhdGhzKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRVcGRhdGVkRmlsZVR1cm4obWVzc2FnZSwgcGF0aHMpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICAgICAgICB9LFxuICAgICAgfSkub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0TG9hZGluZyhsb2FkaW5nOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSBsb2FkaW5nO1xuICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICB0aGlzLmxvYWRpbmdTdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgdGhpcy51cGRhdGVMb2FkaW5nVGV4dCgpO1xuICAgICAgdGhpcy5zdGFydExvYWRpbmdUaW1lcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMubG9hZGluZ1RleHQgPSBcIlwiO1xuICAgIH1cbiAgICB0aGlzLmlucHV0RWwuZGlzYWJsZWQgPSBsb2FkaW5nO1xuICAgIHRoaXMuY2xlYXJCdXR0b25FbC5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuZGlzYWJsZWQgPSAhbG9hZGluZztcbiAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB2b2lkIHRoaXMucmVuZGVyTWVzc2FnZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQ29tcG9zZXJTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIGlmICh0aGlzLnNlbmRCdXR0b25FbCkge1xuICAgICAgdGhpcy5zZW5kQnV0dG9uRWwuZGlzYWJsZWQgPSB0aGlzLmlzTG9hZGluZyB8fCAhdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGF1dG9SZXNpemVJbnB1dCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucHV0RWwuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCI7XG4gICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRoaXMuaW5wdXRFbC5zY3JvbGxIZWlnaHQsIDI0MCl9cHhgO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUdXJuKHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiLCB0ZXh0OiBzdHJpbmcsIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHZvaWQge1xuICAgIHRoaXMudHVybnMucHVzaCh7IHJvbGUsIHRleHQsIHNvdXJjZXMgfSk7XG4gICAgdm9pZCB0aGlzLnJlbmRlck1lc3NhZ2VzKCk7XG4gIH1cblxuICBwcml2YXRlIGFkZFVwZGF0ZWRGaWxlVHVybihtZXNzYWdlOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgIHRoaXMudHVybnMucHVzaCh7XG4gICAgICByb2xlOiBcImJyYWluXCIsXG4gICAgICB0ZXh0OiBtZXNzYWdlLFxuICAgICAgdXBkYXRlZFBhdGhzOiBwYXRocyxcbiAgICB9KTtcbiAgICB2b2lkIHRoaXMucmVuZGVyTWVzc2FnZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWVzc2FnZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuICAgIHRoaXMubWVzc2FnZXNFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy50dXJucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHR1cm4gb2YgdGhpcy50dXJucykge1xuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBgYnJhaW4tY2hhdC1tZXNzYWdlIGJyYWluLWNoYXQtbWVzc2FnZS0ke3R1cm4ucm9sZX1gLFxuICAgICAgfSk7XG4gICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiLFxuICAgICAgICB0ZXh0OiB0dXJuLnJvbGUgPT09IFwidXNlclwiID8gXCJZb3VcIiA6IFwiQnJhaW5cIixcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgb3V0cHV0ID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1vdXRwdXRcIiB9KTtcbiAgICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIikge1xuICAgICAgICBhd2FpdCBNYXJrZG93blJlbmRlcmVyLnJlbmRlcih0aGlzLmFwcCwgdHVybi50ZXh0LCBvdXRwdXQsIFwiXCIsIHRoaXMpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZW5kZXJHZW5lcmF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiICYmIHR1cm4uc291cmNlcz8ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyU291cmNlcyhpdGVtLCB0dXJuLnNvdXJjZXMpO1xuICAgICAgfVxuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiICYmIHR1cm4udXBkYXRlZFBhdGhzPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJVcGRhdGVkRmlsZXMoaXRlbSwgdHVybi51cGRhdGVkUGF0aHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tY2hhdC1tZXNzYWdlIGJyYWluLWNoYXQtbWVzc2FnZS1icmFpbiBicmFpbi1jaGF0LW1lc3NhZ2UtbG9hZGluZ1wiLFxuICAgICAgfSk7XG4gICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiLFxuICAgICAgICB0ZXh0OiBcIkJyYWluXCIsXG4gICAgICB9KTtcbiAgICAgIGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiB0aGlzLmxvYWRpbmdUZXh0IHx8IFwiUmVhZGluZyB2YXVsdCBjb250ZXh0IGFuZCBhc2tpbmcgQ29kZXguLi5cIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsVG9wID0gdGhpcy5tZXNzYWdlc0VsLnNjcm9sbEhlaWdodDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhcnRMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgdGhpcy5sb2FkaW5nVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVMb2FkaW5nVGV4dCgpO1xuICAgICAgdm9pZCB0aGlzLnJlbmRlck1lc3NhZ2VzKCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RpbWVyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdUaW1lcik7XG4gICAgICB0aGlzLmxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVMb2FkaW5nVGV4dCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWNvbmRzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMubG9hZGluZ1N0YXJ0ZWRBdCkgLyAxMDAwKSk7XG4gICAgY29uc3QgcmVtYWluaW5nID0gTWF0aC5tYXgoMCwgMTIwIC0gc2Vjb25kcyk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dCA9IGBSZWFkaW5nIHZhdWx0IGNvbnRleHQgYW5kIGFza2luZyBDb2RleC4uLiAke3NlY29uZHN9cyBlbGFwc2VkLCB0aW1lb3V0IGluICR7cmVtYWluaW5nfXMuYDtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBlbXB0eSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LWVtcHR5XCIgfSk7XG4gICAgZW1wdHkuY3JlYXRlRWwoXCJzdHJvbmdcIiwgeyB0ZXh0OiBcIlN0YXJ0IHdpdGggYSBxdWVzdGlvbiBvciByb3VnaCBjYXB0dXJlLlwiIH0pO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICB0ZXh0OiBcIiBCcmFpbiByZXRyaWV2ZXMgbWFya2Rvd24gY29udGV4dCwgYW5zd2VycyB3aXRoIHNvdXJjZXMsIGFuZCBwcmV2aWV3cyBwcm9wb3NlZCB3cml0ZXMgYmVmb3JlIGFueXRoaW5nIGNoYW5nZXMuXCIsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNvdXJjZXMoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgc291cmNlczogVmF1bHRRdWVyeU1hdGNoW10pOiB2b2lkIHtcbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7IGNsczogXCJicmFpbi1zb3VyY2VzXCIgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogYFNvdXJjZXMgKCR7TWF0aC5taW4oc291cmNlcy5sZW5ndGgsIDgpfSlgLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMuc2xpY2UoMCwgOCkpIHtcbiAgICAgIGNvbnN0IHNvdXJjZUVsID0gZGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zb3VyY2VcIiB9KTtcbiAgICAgIGNvbnN0IHRpdGxlID0gc291cmNlRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXRpdGxlXCIsXG4gICAgICAgIHRleHQ6IHNvdXJjZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICB0aXRsZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlblNvdXJjZShzb3VyY2UucGF0aCk7XG4gICAgICB9KTtcbiAgICAgIHNvdXJjZUVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1yZWFzb25cIixcbiAgICAgICAgdGV4dDogc291cmNlLnJlYXNvbixcbiAgICAgIH0pO1xuICAgICAgaWYgKHNvdXJjZS5leGNlcnB0KSB7XG4gICAgICAgIHNvdXJjZUVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLWV4Y2VycHRcIixcbiAgICAgICAgICB0ZXh0OiBzb3VyY2UuZXhjZXJwdCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJVcGRhdGVkRmlsZXMoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcGF0aHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgY29uc3QgZmlsZXMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tdXBkYXRlZC1maWxlc1wiIH0pO1xuICAgIGZpbGVzLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtcmVhc29uXCIsXG4gICAgICB0ZXh0OiBcIlVwZGF0ZWQgZmlsZXNcIixcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGZpbGVzLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS10aXRsZVwiLFxuICAgICAgICB0ZXh0OiBwYXRoLFxuICAgICAgfSk7XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLm9wZW5Tb3VyY2UocGF0aCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Tb3VyY2UocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb3JtYXRQcm92aWRlclN0YXR1cyhzdGF0dXM6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzPj4pOiBzdHJpbmcge1xuICBpZiAoIXN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgcmV0dXJuIHN0YXR1cy5tZXNzYWdlLnJlcGxhY2UoL1xcLiQvLCBcIlwiKTtcbiAgfVxuICBjb25zdCBtb2RlbCA9IHN0YXR1cy5tb2RlbCA/IGAgKCR7c3RhdHVzLm1vZGVsfSlgIDogXCJcIjtcbiAgcmV0dXJuIGBDb2RleCR7bW9kZWx9YDtcbn1cblxuZnVuY3Rpb24gaXNTdG9wcGVkUmVxdWVzdChlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIjtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgVmF1bHRXcml0ZU9wZXJhdGlvbiwgVmF1bHRXcml0ZVBsYW4gfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcblxuaW50ZXJmYWNlIFZhdWx0UGxhbk1vZGFsT3B0aW9ucyB7XG4gIHBsYW46IFZhdWx0V3JpdGVQbGFuO1xuICBvbkFwcHJvdmU6IChwbGFuOiBWYXVsdFdyaXRlUGxhbikgPT4gUHJvbWlzZTxzdHJpbmdbXT47XG4gIG9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFBsYW5Nb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWRPcGVyYXRpb25zID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZHJhZnRPcGVyYXRpb25zOiBWYXVsdFdyaXRlT3BlcmF0aW9uW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBWYXVsdFBsYW5Nb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5kcmFmdE9wZXJhdGlvbnMgPSBvcHRpb25zLnBsYW4ub3BlcmF0aW9ucy5tYXAoKG9wZXJhdGlvbikgPT4gKHsgLi4ub3BlcmF0aW9uIH0pKTtcbiAgICB0aGlzLmRyYWZ0T3BlcmF0aW9ucy5mb3JFYWNoKChfLCBpbmRleCkgPT4gdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuYWRkKGluZGV4KSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgVmF1bHQgQ2hhbmdlc1wiIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgJHt0aGlzLm9wdGlvbnMucGxhbi5zdW1tYXJ5IHx8IFwiQnJhaW4gcHJvcG9zZWQgdmF1bHQgY2hhbmdlcy5cIn0gQ29uZmlkZW5jZTogJHt0aGlzLm9wdGlvbnMucGxhbi5jb25maWRlbmNlfS5gLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBbaW5kZXgsIG9wZXJhdGlvbl0gb2YgdGhpcy5kcmFmdE9wZXJhdGlvbnMuZW50cmllcygpKSB7XG4gICAgICB0aGlzLnJlbmRlck9wZXJhdGlvbihpbmRleCwgb3BlcmF0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnBsYW4ucXVlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgY29uc3QgcXVlc3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tcGxhbi1xdWVzdGlvbnNcIiB9KTtcbiAgICAgIHF1ZXN0aW9ucy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJPcGVuIFF1ZXN0aW9uc1wiIH0pO1xuICAgICAgY29uc3QgbGlzdCA9IHF1ZXN0aW9ucy5jcmVhdGVFbChcInVsXCIpO1xuICAgICAgZm9yIChjb25zdCBxdWVzdGlvbiBvZiB0aGlzLm9wdGlvbnMucGxhbi5xdWVzdGlvbnMpIHtcbiAgICAgICAgbGlzdC5jcmVhdGVFbChcImxpXCIsIHsgdGV4dDogcXVlc3Rpb24gfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiQXBwcm92ZSBhbmQgV3JpdGVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmFwcHJvdmUoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2FuY2VsXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9wZXJhdGlvbnMgPSB0aGlzLmRyYWZ0T3BlcmF0aW9uc1xuICAgICAgLmZpbHRlcigoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmhhcyhpbmRleCkpXG4gICAgICAubWFwKChvcGVyYXRpb24pID0+ICh7XG4gICAgICAgIC4uLm9wZXJhdGlvbixcbiAgICAgICAgcGF0aDogb3BlcmF0aW9uLnBhdGgudHJpbSgpLFxuICAgICAgICBjb250ZW50OiBvcGVyYXRpb24uY29udGVudC50cmltKCksXG4gICAgICB9KSlcbiAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbikgPT4gb3BlcmF0aW9uLnBhdGggJiYgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgIGlmICghb3BlcmF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIGNoYW5nZSB0byBhcHBseVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaW52YWxpZFBhdGggPSBvcGVyYXRpb25zLmZpbmQoKG9wZXJhdGlvbikgPT4gIWlzU2FmZU1hcmtkb3duUGF0aChvcGVyYXRpb24ucGF0aCkpO1xuICAgIGlmIChpbnZhbGlkUGF0aCkge1xuICAgICAgbmV3IE5vdGljZShgSW52YWxpZCB0YXJnZXQgcGF0aDogJHtpbnZhbGlkUGF0aC5wYXRofWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXRocyA9IGF3YWl0IHRoaXMub3B0aW9ucy5vbkFwcHJvdmUoe1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMucGxhbixcbiAgICAgICAgb3BlcmF0aW9ucyxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHBhdGhzLmxlbmd0aFxuICAgICAgICA/IGBVcGRhdGVkICR7cGF0aHMuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiBcIk5vIHZhdWx0IGNoYW5nZXMgd2VyZSBhcHBsaWVkXCI7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uQ29tcGxldGUobWVzc2FnZSwgcGF0aHMpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGFwcGx5IHZhdWx0IGNoYW5nZXNcIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT3BlcmF0aW9uKGluZGV4OiBudW1iZXIsIG9wZXJhdGlvbjogVmF1bHRXcml0ZU9wZXJhdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvblwiIH0pO1xuICAgIGNvbnN0IGhlYWRlciA9IGl0ZW0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBjaGVja2JveCA9IGhlYWRlci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGF0dHI6IHsgdHlwZTogXCJjaGVja2JveFwiIH0sXG4gICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuaGFzKGluZGV4KTtcbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5kZWxldGUoaW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBkZXNjcmliZU9wZXJhdGlvbihvcGVyYXRpb24pIH0pO1xuXG4gICAgaWYgKG9wZXJhdGlvbi5kZXNjcmlwdGlvbikge1xuICAgICAgaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1wbGFuLWRlc2NyaXB0aW9uXCIsXG4gICAgICAgIHRleHQ6IG9wZXJhdGlvbi5kZXNjcmlwdGlvbixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdGhJbnB1dCA9IGl0ZW0uY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXQgYnJhaW4tcGxhbi1wYXRoLWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICBcImFyaWEtbGFiZWxcIjogXCJUYXJnZXQgbWFya2Rvd24gcGF0aFwiLFxuICAgICAgfSxcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHBhdGhJbnB1dC52YWx1ZSA9IG9wZXJhdGlvbi5wYXRoO1xuICAgIHBhdGhJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdID0ge1xuICAgICAgICAuLi50aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0sXG4gICAgICAgIHBhdGg6IHBhdGhJbnB1dC52YWx1ZSxcbiAgICAgIH0gYXMgVmF1bHRXcml0ZU9wZXJhdGlvbjtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRleHRhcmVhID0gaXRlbS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLWVkaXRvclwiLFxuICAgICAgYXR0cjogeyByb3dzOiBcIjEwXCIgfSxcbiAgICB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IG9wZXJhdGlvbi5jb250ZW50O1xuICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0gPSB7XG4gICAgICAgIC4uLnRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSxcbiAgICAgICAgY29udGVudDogdGV4dGFyZWEudmFsdWUsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbjogVmF1bHRXcml0ZVBsYW5bXCJvcGVyYXRpb25zXCJdW251bWJlcl0pOiBzdHJpbmcge1xuICBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiYXBwZW5kXCIpIHtcbiAgICByZXR1cm4gYEFwcGVuZCB0byAke29wZXJhdGlvbi5wYXRofWA7XG4gIH1cbiAgcmV0dXJuIGBDcmVhdGUgJHtvcGVyYXRpb24ucGF0aH1gO1xufVxuXG5mdW5jdGlvbiBpc1NhZmVNYXJrZG93blBhdGgocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICByZXR1cm4gKFxuICAgIEJvb2xlYW4ocGF0aCkgJiZcbiAgICBwYXRoLmVuZHNXaXRoKFwiLm1kXCIpICYmXG4gICAgIXBhdGguaW5jbHVkZXMoXCIuLlwiKSAmJlxuICAgIHNlZ21lbnRzLmV2ZXJ5KChzZWdtZW50KSA9PiAhc2VnbWVudC5zdGFydHNXaXRoKFwiLlwiKSlcbiAgKTtcbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqXG4gKiBDZW50cmFsaXplZCBlcnJvciBoYW5kbGluZyB1dGlsaXR5XG4gKiBTdGFuZGFyZGl6ZXMgZXJyb3IgcmVwb3J0aW5nIGFjcm9zcyB0aGUgcGx1Z2luXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvcihlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZGVmYXVsdE1lc3NhZ2U7XG4gIG5ldyBOb3RpY2UobWVzc2FnZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3JBbmRSZXRocm93KGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogbmV2ZXIge1xuICBzaG93RXJyb3IoZXJyb3IsIGRlZmF1bHRNZXNzYWdlKTtcbiAgdGhyb3cgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKGRlZmF1bHRNZXNzYWdlKTtcbn1cbiIsICJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW50ZXJmYWNlIEJyYWluQ29tbWFuZEhvc3Qge1xuICBhZGRDb21tYW5kOiBQbHVnaW5bXCJhZGRDb21tYW5kXCJdO1xuICBvcGVuU2lkZWJhcigpOiBQcm9taXNlPHZvaWQ+O1xuICBvcGVuSW5zdHJ1Y3Rpb25zRmlsZSgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21tYW5kcyhwbHVnaW46IEJyYWluQ29tbWFuZEhvc3QpOiB2b2lkIHtcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4tdmF1bHQtY2hhdFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVmF1bHQgQ2hhdFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblNpZGViYXIoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi1pbnN0cnVjdGlvbnNcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIEluc3RydWN0aW9uc1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3Blbkluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9LFxuICB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElB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O0FBQzdEO0FBQUEsSUFDRjtBQUNBLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDN0MsVUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLEVBQzFCO0FBQUEsRUFFQSxNQUFNLGNBQWMsU0FBaUIsUUFBa0Q7QUFDckYsV0FBTyxLQUFLLGlCQUFpQixRQUFRLFNBQVMsTUFBTTtBQUFBLEVBQ3REO0FBQUEsRUFFQSxNQUFNLG9CQUFvQixNQUF5QztBQUNqRSxVQUFNLFFBQVEsTUFBTSxLQUFLLGtCQUFrQixVQUFVLElBQUk7QUFDekQsVUFBTSxLQUFLLCtCQUErQjtBQUMxQyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEscUJBQThDO0FBQzVDLFVBQU0sU0FBUyxLQUFLLElBQUksVUFBVSxnQkFBZ0IsZUFBZTtBQUNqRSxlQUFXLFFBQVEsUUFBUTtBQUN6QixZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLGdCQUFnQixrQkFBa0I7QUFDcEMsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBL0k5QztBQWdKSSxZQUFNLFVBQUssbUJBQW1CLE1BQXhCLG1CQUEyQjtBQUFBLEVBQ25DO0FBQUEsRUFFQSxNQUFNLGlDQUFnRDtBQUNwRCxRQUFJO0FBQ0YsWUFBTSxLQUFLLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8sa0NBQWtDO0FBQUEsSUFDckQ7QUFBQSxFQUNGO0FBRUY7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpc0Vub2VudEVycm9yIiwgImlzVGltZW91dEVycm9yIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
