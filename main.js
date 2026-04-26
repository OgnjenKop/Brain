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
  codexModel: "",
  excludeFolders: ".obsidian\nnode_modules"
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
    codexModel: typeof merged.codexModel === "string" ? merged.codexModel.trim() : "",
    excludeFolders: normalizeExcludeFolders(merged.excludeFolders)
  };
}
function normalizeRelativePath(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || fallback;
}
function normalizeExcludeFolders(value) {
  if (typeof value !== "string") {
    return DEFAULT_BRAIN_SETTINGS.excludeFolders;
  }
  return value.split("\n").map((line) => line.trim().replace(/^\/+/, "").replace(/\/+$/, "")).filter(Boolean).join("\n");
}
function parseExcludeFolders(excludeFolders) {
  return excludeFolders.split("\n").map((line) => line.trim()).filter(Boolean);
}

// src/settings/settings-tab.ts
var import_obsidian = require("obsidian");

// src/utils/node-runtime.ts
function getNodeRequire() {
  return Function("return require")();
}
function getCodexRuntime() {
  const req = getNodeRequire();
  const { execFile } = req("child_process");
  return {
    execFile,
    fs: req("fs/promises"),
    os: req("os"),
    path: req("path")
  };
}
function getExecFileAsync() {
  const req = getNodeRequire();
  const { execFile } = req("child_process");
  const { promisify } = req("util");
  return promisify(execFile);
}
function isEnoentError(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
function isTimeoutError(error) {
  return typeof error === "object" && error !== null && "killed" in error && error.killed === true;
}
function isAbortError(error) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}
function isNodeRuntimeUnavailable(error) {
  return error instanceof ReferenceError || error instanceof TypeError;
}

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
    const execFileAsync = getExecFileAsync();
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
    new import_obsidian.Setting(containerEl).setName("Excluded folders").setDesc("One folder path per line. Brain will skip markdown files inside these folders when searching the vault.").addTextArea((text) => {
      text.setValue(this.plugin.settings.excludeFolders).onChange((value) => {
        this.plugin.settings.excludeFolders = value;
      });
      text.inputEl.addEventListener("blur", () => {
        void this.plugin.saveSettings();
      });
    });
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
    let lastValidValue = value;
    text.setValue(value).onChange((nextValue) => {
      if (!validate || validate(nextValue)) {
        onValueChange(nextValue);
        lastValidValue = nextValue;
      }
    });
    text.inputEl.addEventListener("blur", () => {
      const currentValue = text.inputEl.value;
      if (validate && !validate(currentValue)) {
        text.setValue(lastValidValue);
        onValueChange(lastValidValue);
        return;
      }
      void this.plugin.saveSettings();
    });
    text.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        text.inputEl.blur();
      }
    });
    return text;
  }
};

// src/services/ai-service.ts
var CODEX_CHAT_TIMEOUT_MS = 12e4;
var BrainAIService = class {
  async completeChat(messages, settings, workingDirectory, signal) {
    return this.postCodexCompletion(settings, messages, workingDirectory, signal);
  }
  async postCodexCompletion(settings, messages, workingDirectory, signal) {
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
      "--ignore-rules",
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputFile
    ];
    if (workingDirectory) {
      args.push("--cd", workingDirectory);
    }
    if (settings.codexModel.trim()) {
      args.push("--model", settings.codexModel.trim());
    }
    args.push("-");
    const prompt = this.buildCodexPrompt(messages);
    try {
      await execFileWithAbort(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
        timeout: CODEX_CHAT_TIMEOUT_MS,
        signal,
        stdin: prompt
      }, execFile);
      const content = await fs.readFile(outputFile, "utf8");
      if (!content.trim()) {
        throw new Error("Codex returned an empty response");
      }
      return content.trim();
    } catch (error) {
      if (isEnoentError(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }
      if (isTimeoutError(error)) {
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
function execFileWithAbort(file, args, options, execFile) {
  return new Promise((resolve, reject) => {
    var _a;
    let settled = false;
    const { signal, stdin, ...execOptions } = options;
    const child = execFile(file, args, execOptions, (error) => {
      if (settled) {
        return;
      }
      settled = true;
      signal == null ? void 0 : signal.removeEventListener("abort", abort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    if (stdin !== void 0) {
      (_a = child.stdin) == null ? void 0 : _a.end(stdin);
    }
    const abort = () => {
      if (settled) {
        return;
      }
      child.kill("SIGTERM");
      window.setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, 1500);
    };
    if (signal == null ? void 0 : signal.aborted) {
      abort();
    } else {
      signal == null ? void 0 : signal.addEventListener("abort", abort, { once: true });
    }
  });
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
var CHAT_CONTEXT_LIMIT = 6;
var MAX_HISTORY_EXCHANGES = 6;
var MAX_CONTEXT_EXCERPT_CHARS = 1200;
var VaultChatService = class {
  constructor(aiService, instructionService, queryService, vaultService, writeService, settingsProvider) {
    this.aiService = aiService;
    this.instructionService = instructionService;
    this.queryService = queryService;
    this.vaultService = vaultService;
    this.writeService = writeService;
    this.settingsProvider = settingsProvider;
  }
  async respond(message, history = [], signal) {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Enter a message first");
    }
    const [instructions, sources] = await Promise.all([
      this.instructionService.readInstructions(),
      this.queryService.queryVault(trimmed)
    ]);
    const context = formatSourcesForPrompt(sources.slice(0, CHAT_CONTEXT_LIMIT));
    const settings = this.settingsProvider();
    const vaultBasePath = this.vaultService.getBasePath();
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
          content: buildUserPrompt(trimmed, vaultBasePath, context, history)
        }
      ],
      settings,
      vaultBasePath,
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
    "Answer directly from the Obsidian vault markdown.",
    "You may inspect markdown files in the current working directory with read-only shell commands.",
    "Never claim facts that are not supported by vault markdown or the provided source hints.",
    "For simple questions, answer in one or two sentences.",
    "For filing requests, propose safe vault writes.",
    "Return only a JSON object.",
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
function buildUserPrompt(message, vaultBasePath, context, history) {
  const parts = [];
  const recentHistory = history.slice(-MAX_HISTORY_EXCHANGES);
  if (recentHistory.length > 0) {
    parts.push("Conversation history:");
    for (const exchange of recentHistory) {
      parts.push("");
      parts.push(`${exchange.role === "user" ? "User" : "Brain"}:`);
      parts.push(exchange.text);
    }
    parts.push("");
    parts.push("---");
    parts.push("");
  }
  parts.push(`User message: ${message}`);
  parts.push("");
  parts.push(
    vaultBasePath ? "You are running from the Obsidian vault root. Use read-only shell commands only if you need to inspect markdown files." : "Use the relevant vault context below."
  );
  parts.push("");
  parts.push("Relevant source hints:");
  parts.push(context || "No matching vault files found.");
  return parts.join("\n");
}
function formatSourcesForPrompt(sources) {
  return sources.map((source, index) => [
    `## Source ${index + 1}: ${source.path}`,
    `Title: ${source.title}`,
    `Reason: ${source.reason}`,
    "",
    source.excerpt.slice(0, MAX_CONTEXT_EXCERPT_CHARS)
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
var STOP_WORDS = /* @__PURE__ */ new Set([
  "about",
  "are",
  "can",
  "did",
  "does",
  "for",
  "from",
  "have",
  "how",
  "into",
  "is",
  "know",
  "list",
  "my",
  "the",
  "this",
  "that",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with"
]);
var VaultQueryService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async queryVault(query, limit = MAX_QUERY_FILES) {
    const settings = this.settingsProvider();
    const tokens = tokenize(query);
    const excludeFolders = parseExcludeFolders(settings.excludeFolders);
    const files = (await this.vaultService.listMarkdownFiles()).filter((file) => shouldIncludeFile(file, settings.instructionsFile, excludeFolders)).sort((left, right) => right.stat.mtime - left.stat.mtime);
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
function shouldIncludeFile(file, instructionsFile, excludeFolders) {
  if (file.path === instructionsFile) {
    return false;
  }
  for (const folder of excludeFolders) {
    const prefix = folder.endsWith("/") ? folder : `${folder}/`;
    if (file.path === folder || file.path.startsWith(prefix)) {
      return false;
    }
  }
  return true;
}
function tokenize(input) {
  const seen = /* @__PURE__ */ new Set();
  return input.toLowerCase().split(/[^a-z0-9_/-]+/i).map((token) => token.trim()).filter((token) => token.length >= 3).filter((token) => !STOP_WORDS.has(token)).filter((token) => {
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
  const ageMs = Date.now() - file.stat.mtime;
  const ageDays = ageMs / (1e3 * 60 * 60 * 24);
  if (ageDays < 1) {
    score += 10;
  } else if (ageDays < 7) {
    score += 6;
  } else if (ageDays < 30) {
    score += 3;
  } else if (ageDays < 90) {
    score += 1;
  }
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
  getBasePath() {
    return this.app.vault.adapter instanceof import_obsidian3.FileSystemAdapter ? this.app.vault.adapter.getBasePath() : null;
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

// src/utils/path-safety.ts
function isSafeMarkdownPath(path, settings) {
  const segments = path.split("/").filter(Boolean);
  const isSafe = Boolean(path) && path.endsWith(".md") && !path.includes("..") && segments.every((segment) => !segment.startsWith("."));
  if (!isSafe) {
    return false;
  }
  if (settings && path === settings.instructionsFile) {
    return false;
  }
  return true;
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
    const settings = this.settingsProvider();
    const paths = [];
    for (const operation of plan.operations) {
      if (!isSafeMarkdownPath(operation.path, settings)) {
        continue;
      }
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
    const settings = this.settingsProvider();
    if (!isSafeMarkdownPath(path, settings)) {
      return null;
    }
    return {
      type: candidate.type,
      path,
      content,
      description: readDescription(candidate)
    };
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
  close() {
    if (this.working) {
      return;
    }
    super.close();
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
    this.approveButtonEl = buttons.createEl("button", {
      cls: "brain-button brain-button-primary",
      text: "Approve and Write"
    });
    this.approveButtonEl.addEventListener("click", () => {
      void this.approve();
    });
    this.cancelButtonEl = buttons.createEl("button", {
      cls: "brain-button",
      text: "Cancel"
    });
    this.cancelButtonEl.addEventListener("click", () => {
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
    const invalidPath = operations.find((operation) => !isSafeMarkdownPath(operation.path, this.options.settings));
    if (invalidPath) {
      new import_obsidian5.Notice(`Invalid target path: ${invalidPath.path}`);
      return;
    }
    this.working = true;
    this.setButtonsEnabled(false);
    try {
      const paths = await this.options.onApprove({
        ...this.options.plan,
        operations
      });
      const message = paths.length ? `Updated ${paths.join(", ")}` : "No vault changes were applied";
      new import_obsidian5.Notice(message);
      await this.options.onComplete(message, paths);
      this.working = false;
      this.close();
    } catch (error) {
      showError(error, "Could not apply vault changes");
      this.setButtonsEnabled(true);
    } finally {
      this.working = false;
    }
  }
  setButtonsEnabled(enabled) {
    if (this.approveButtonEl) {
      this.approveButtonEl.disabled = !enabled;
      this.approveButtonEl.textContent = enabled ? "Approve and Write" : "Writing...";
    }
    if (this.cancelButtonEl) {
      this.cancelButtonEl.disabled = !enabled;
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
    this.loadingTextEl = null;
    this.renderGeneration = 0;
    this.resizeFrameId = null;
    this.turns = [];
    this.userScrolledUp = false;
    this.scrollToBottomEl = null;
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
    const messagesContainer = this.contentEl.createEl("div", { cls: "brain-messages-container" });
    this.messagesEl = messagesContainer.createEl("div", {
      cls: "brain-chat-messages",
      attr: { "aria-live": "polite", "aria-atomic": "false" }
    });
    this.messagesEl.addEventListener("scroll", () => {
      this.userScrolledUp = !this.isNearBottom();
      this.updateScrollToBottomButton();
    });
    if (this.turns.length > 0) {
      void this.renderMessages();
    } else {
      this.renderEmptyState();
    }
    this.scrollToBottomEl = messagesContainer.createEl("button", {
      cls: "brain-scroll-to-bottom",
      attr: { "aria-label": "Scroll to bottom" }
    });
    (0, import_obsidian6.setIcon)(this.scrollToBottomEl, "arrow-down");
    this.scrollToBottomEl.addEventListener("click", () => {
      this.userScrolledUp = false;
      this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
      this.updateScrollToBottomButton();
    });
    this.updateScrollToBottomButton();
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
    if (this.resizeFrameId !== null) {
      cancelAnimationFrame(this.resizeFrameId);
      this.resizeFrameId = null;
    }
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
    const indicator = this.statusEl.createEl("span", {
      cls: `brain-status-indicator ${aiConfigured ? "brain-status-indicator--ok" : "brain-status-indicator--warn"}`
    });
    indicator.setAttribute("aria-hidden", "true");
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
    this.userScrolledUp = false;
    this.addTurn("user", message);
    this.setLoading(true);
    const controller = new AbortController();
    this.currentAbortController = controller;
    try {
      const history = this.buildChatHistory();
      const response = await this.plugin.chatWithVault(message, history, controller.signal);
      this.renderResponse(response);
    } catch (error) {
      if (isStoppedRequest(error)) {
        if (this.contentEl.isConnected) {
          this.addTurn("brain", "Codex request stopped.");
        }
      } else {
        showError(error, "Could not chat with the vault");
      }
    } finally {
      this.currentAbortController = null;
      this.setLoading(false);
    }
  }
  buildChatHistory() {
    return this.turns.slice(0, -1).filter((turn) => Boolean(turn.text)).map((turn) => ({
      role: turn.role,
      text: turn.text
    }));
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
        settings: this.plugin.settings,
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
      this.appendLoadingIndicator();
    } else {
      this.stopLoadingTimer();
      this.loadingText = "";
      this.removeLoadingIndicator();
    }
    this.inputEl.disabled = loading;
    this.clearButtonEl.disabled = loading;
    this.stopButtonEl.disabled = !loading;
    this.sendButtonEl.disabled = loading || !this.inputEl.value.trim();
    this.renderModelSelector();
  }
  updateComposerState() {
    this.autoResizeInput();
    if (this.sendButtonEl) {
      this.sendButtonEl.disabled = this.isLoading || !this.inputEl.value.trim();
    }
  }
  autoResizeInput() {
    if (this.resizeFrameId !== null) {
      cancelAnimationFrame(this.resizeFrameId);
    }
    this.resizeFrameId = requestAnimationFrame(() => {
      this.resizeFrameId = null;
      this.inputEl.style.height = "auto";
      this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 240)}px`;
    });
  }
  addTurn(role, text, sources) {
    const turn = { role, text, sources };
    this.turns.push(turn);
    void this.appendTurnElement(turn);
  }
  addUpdatedFileTurn(message, paths) {
    const turn = {
      role: "brain",
      text: message,
      updatedPaths: paths
    };
    this.turns.push(turn);
    void this.appendTurnElement(turn);
  }
  async appendTurnElement(turn) {
    var _a, _b;
    const generation = ++this.renderGeneration;
    const emptyEl = this.messagesEl.querySelector(".brain-chat-empty");
    if (emptyEl) {
      emptyEl.remove();
    }
    this.removeLoadingIndicator();
    const item = this.messagesEl.createEl("div", {
      cls: `brain-chat-message brain-chat-message-${turn.role}`
    });
    const roleEl = item.createEl("div", { cls: "brain-chat-role" });
    const roleIcon = roleEl.createEl("span");
    (0, import_obsidian6.setIcon)(roleIcon, turn.role === "user" ? "user" : "brain-circuit");
    roleEl.createEl("span", { text: turn.role === "user" ? "You" : "Brain" });
    const output = item.createEl("div", { cls: "brain-output" });
    if (turn.role === "brain") {
      try {
        await import_obsidian6.MarkdownRenderer.render(this.app, turn.text, output, "", this);
      } catch (e) {
        output.setText(turn.text);
      }
      if (generation !== this.renderGeneration) {
        item.remove();
        return;
      }
      this.addCopyButtons(output);
    } else {
      output.setText(turn.text);
    }
    if (turn.role === "brain" && ((_a = turn.sources) == null ? void 0 : _a.length)) {
      this.renderSources(item, turn.sources);
    }
    if (turn.role === "brain" && ((_b = turn.updatedPaths) == null ? void 0 : _b.length)) {
      this.renderUpdatedFiles(item, turn.updatedPaths);
    }
    this.maybeScrollToBottom();
  }
  appendLoadingIndicator() {
    if (this.messagesEl.querySelector(".brain-chat-message-loading")) {
      return;
    }
    const item = this.messagesEl.createEl("div", {
      cls: "brain-chat-message brain-chat-message-brain brain-chat-message-loading"
    });
    const roleEl = item.createEl("div", { cls: "brain-chat-role" });
    const roleIcon = roleEl.createEl("span");
    (0, import_obsidian6.setIcon)(roleIcon, "brain-circuit");
    roleEl.createEl("span", { text: "Brain" });
    const loading = item.createEl("div", { cls: "brain-loading" });
    const dots = loading.createEl("div", { cls: "brain-loading-dots" });
    dots.createEl("span");
    dots.createEl("span");
    dots.createEl("span");
    this.loadingTextEl = loading.createEl("span", {
      text: this.loadingText || "Reading vault context and asking Codex..."
    });
    this.maybeScrollToBottom();
  }
  removeLoadingIndicator() {
    const loadingEl = this.messagesEl.querySelector(".brain-chat-message-loading");
    if (loadingEl) {
      loadingEl.remove();
    }
    this.loadingTextEl = null;
  }
  async renderMessages() {
    var _a, _b;
    const generation = ++this.renderGeneration;
    this.messagesEl.empty();
    if (!this.turns.length) {
      this.renderEmptyState();
      return;
    }
    for (const turn of this.turns) {
      if (generation !== this.renderGeneration) {
        return;
      }
      const item = this.messagesEl.createEl("div", {
        cls: `brain-chat-message brain-chat-message-${turn.role}`
      });
      const roleEl = item.createEl("div", { cls: "brain-chat-role" });
      const roleIcon = roleEl.createEl("span");
      (0, import_obsidian6.setIcon)(roleIcon, turn.role === "user" ? "user" : "brain-circuit");
      roleEl.createEl("span", { text: turn.role === "user" ? "You" : "Brain" });
      const output = item.createEl("div", { cls: "brain-output" });
      if (turn.role === "brain") {
        try {
          await import_obsidian6.MarkdownRenderer.render(this.app, turn.text, output, "", this);
        } catch (e) {
          output.setText(turn.text);
        }
        if (generation !== this.renderGeneration) {
          return;
        }
        this.addCopyButtons(output);
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
      this.appendLoadingIndicator();
    }
    this.maybeScrollToBottom();
  }
  startLoadingTimer() {
    this.stopLoadingTimer();
    this.loadingTimer = window.setInterval(() => {
      this.updateLoadingText();
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
    this.loadingText = `${seconds}s elapsed, timeout in ${remaining}s`;
    if (this.loadingTextEl) {
      this.loadingTextEl.setText(this.loadingText);
    }
  }
  renderEmptyState() {
    const empty = this.messagesEl.createEl("div", { cls: "brain-chat-empty" });
    const icon = empty.createEl("div", { cls: "brain-chat-empty-icon" });
    (0, import_obsidian6.setIcon)(icon, "brain-circuit");
    empty.createEl("strong", { text: "Start with a question or rough capture" });
    empty.createEl("span", {
      text: "Brain retrieves vault context, answers with sources, and previews writes before anything changes."
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
  isNearBottom(threshold = 60) {
    const el = this.messagesEl;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }
  maybeScrollToBottom() {
    if (this.userScrolledUp) {
      this.updateScrollToBottomButton();
      return;
    }
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
    this.updateScrollToBottomButton();
  }
  updateScrollToBottomButton() {
    if (!this.scrollToBottomEl) {
      return;
    }
    const show = this.userScrolledUp && this.turns.length > 0;
    this.scrollToBottomEl.toggleClass("brain-scroll-to-bottom--visible", show);
  }
  addCopyButtons(container) {
    const codeBlocks = container.querySelectorAll("pre");
    for (const pre of Array.from(codeBlocks)) {
      const code = pre.querySelector("code");
      if (!code) {
        continue;
      }
      const button = document.createElement("button");
      button.className = "brain-copy-code-button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code");
      button.addEventListener("click", () => {
        void navigator.clipboard.writeText(code.textContent || "").then(() => {
          button.textContent = "Copied!";
          button.classList.add("copied");
          window.setTimeout(() => {
            button.textContent = "Copy";
            button.classList.remove("copied");
          }, 1500);
        }).catch(() => {
          button.textContent = "Failed";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1500);
        });
      });
      pre.appendChild(button);
    }
  }
  async openSource(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian6.TFile)) {
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
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
      this.vaultService,
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
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }
  async chatWithVault(message, history = [], signal) {
    return this.vaultChatService.respond(message, history, signal);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbm9kZS1ydW50aW1lLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3V0aWxzL2NvZGV4LW1vZGVscy50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgtc2FmZXR5LnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCUkFJTl9WSUVXX1RZUEUsIEJyYWluU2lkZWJhclZpZXcgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBpbnN0cnVjdGlvblNlcnZpY2UhOiBJbnN0cnVjdGlvblNlcnZpY2U7XG4gIHZhdWx0UXVlcnlTZXJ2aWNlITogVmF1bHRRdWVyeVNlcnZpY2U7XG4gIHZhdWx0V3JpdGVTZXJ2aWNlITogVmF1bHRXcml0ZVNlcnZpY2U7XG4gIHZhdWx0Q2hhdFNlcnZpY2UhOiBWYXVsdENoYXRTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlID0gbmV3IEluc3RydWN0aW9uU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UgPSBuZXcgVmF1bHRRdWVyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlID0gbmV3IFZhdWx0V3JpdGVTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdENoYXRTZXJ2aWNlID0gbmV3IFZhdWx0Q2hhdFNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFF1ZXJ5U2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZS5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBCcmFpbiBzdG9yYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgbG9hZCBCcmFpbiBzZXR0aW5nc1wiKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2U/LmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIEJyYWluIHN0b3JhZ2VcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGhpcy5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKGBDb3VsZCBub3Qgb3BlbiAke3RoaXMuc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZX1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBjaGF0V2l0aFZhdWx0KG1lc3NhZ2U6IHN0cmluZywgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10gPSBbXSwgc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFZhdWx0Q2hhdFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMudmF1bHRDaGF0U2VydmljZS5yZXNwb25kKG1lc3NhZ2UsIGhpc3RvcnksIHNpZ25hbCk7XG4gIH1cblxuICBhc3luYyBhcHBseVZhdWx0V3JpdGVQbGFuKHBsYW46IFZhdWx0V3JpdGVQbGFuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgdGhpcy52YXVsdFdyaXRlU2VydmljZS5hcHBseVBsYW4ocGxhbik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcGF0aHM7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlZnJlc2ggc2lkZWJhciBzdGF0dXNcIik7XG4gICAgfVxuICB9XG5cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBub3Rlc0ZvbGRlcjogc3RyaW5nO1xuICBpbnN0cnVjdGlvbnNGaWxlOiBzdHJpbmc7XG4gIGNvZGV4TW9kZWw6IHN0cmluZztcbiAgZXhjbHVkZUZvbGRlcnM6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQlJBSU5fU0VUVElOR1M6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gIG5vdGVzRm9sZGVyOiBcIk5vdGVzXCIsXG4gIGluc3RydWN0aW9uc0ZpbGU6IFwiQnJhaW4vQUdFTlRTLm1kXCIsXG4gIGNvZGV4TW9kZWw6IFwiXCIsXG4gIGV4Y2x1ZGVGb2xkZXJzOiBcIi5vYnNpZGlhblxcbm5vZGVfbW9kdWxlc1wiLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MoXG4gIGlucHV0OiBQYXJ0aWFsPEJyYWluUGx1Z2luU2V0dGluZ3M+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgY29uc3QgbWVyZ2VkOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICAgIC4uLkRFRkFVTFRfQlJBSU5fU0VUVElOR1MsXG4gICAgLi4uaW5wdXQsXG4gIH0gYXMgQnJhaW5QbHVnaW5TZXR0aW5ncztcblxuICByZXR1cm4ge1xuICAgIG5vdGVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQubm90ZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm5vdGVzRm9sZGVyLFxuICAgICksXG4gICAgaW5zdHJ1Y3Rpb25zRmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLmluc3RydWN0aW9uc0ZpbGUsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmluc3RydWN0aW9uc0ZpbGUsXG4gICAgKSxcbiAgICBjb2RleE1vZGVsOiB0eXBlb2YgbWVyZ2VkLmNvZGV4TW9kZWwgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQuY29kZXhNb2RlbC50cmltKCkgOiBcIlwiLFxuICAgIGV4Y2x1ZGVGb2xkZXJzOiBub3JtYWxpemVFeGNsdWRlRm9sZGVycyhtZXJnZWQuZXhjbHVkZUZvbGRlcnMpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGl2ZVBhdGgodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkIHx8IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVFeGNsdWRlRm9sZGVycyh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5leGNsdWRlRm9sZGVycztcbiAgfVxuICByZXR1cm4gdmFsdWVcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpLnJlcGxhY2UoL1xcLyskLywgXCJcIikpXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5qb2luKFwiXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VFeGNsdWRlRm9sZGVycyhleGNsdWRlRm9sZGVyczogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gZXhjbHVkZUZvbGRlcnNcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBUZXh0Q29tcG9uZW50IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7XG4gIENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSxcbiAgREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuICBDb2RleE1vZGVsT3B0aW9uLFxuICBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSxcbiAgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMsXG4gIGlzS25vd25Db2RleE1vZGVsLFxufSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtbW9kZWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpblNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBCcmFpblBsdWdpbjtcbiAgcHJpdmF0ZSBtb2RlbE9wdGlvbnM6IENvZGV4TW9kZWxPcHRpb25bXSA9IERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgcHJpdmF0ZSBtb2RlbE9wdGlvbnNMb2FkaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zTG9hZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW4gU2V0dGluZ3NcIiB9KTtcbiAgICBpZiAoIXRoaXMubW9kZWxPcHRpb25zTG9hZGluZyAmJiAhdGhpcy5tb2RlbE9wdGlvbnNMb2FkZWQpIHtcbiAgICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgfVxuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3RvcmFnZVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJEZWZhdWx0IGZvbGRlciBmb3IgbmV3IG1hcmtkb3duIG5vdGVzIGNyZWF0ZWQgZnJvbSBhcHByb3ZlZCB3cml0ZSBwbGFucy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIk5vdGVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluc3RydWN0aW9ucyBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdGhhdCB0ZWxscyBCcmFpbiBob3cgdG8gb3BlcmF0ZSBpbiB0aGlzIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkluc3RydWN0aW9ucyBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRXhjbHVkZWQgZm9sZGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJPbmUgZm9sZGVyIHBhdGggcGVyIGxpbmUuIEJyYWluIHdpbGwgc2tpcCBtYXJrZG93biBmaWxlcyBpbnNpZGUgdGhlc2UgZm9sZGVycyB3aGVuIHNlYXJjaGluZyB0aGUgdmF1bHQuXCIpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5leGNsdWRlRm9sZGVycykub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZXhjbHVkZUZvbGRlcnMgPSB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkNvZGV4IENMSVwiIH0pO1xuXG4gICAgdGhpcy5jcmVhdGVDb2RleFN0YXR1c1NldHRpbmcoY29udGFpbmVyRWwpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvZGV4IHNldHVwXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJCcmFpbiB1c2VzIG9ubHkgdGhlIGxvY2FsIENvZGV4IENMSS4gSW5zdGFsbCBgQG9wZW5haS9jb2RleGAsIHJ1biBgY29kZXggbG9naW5gLCB0aGVuIHJlY2hlY2sgc3RhdHVzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIk9wZW4gQ29kZXggU2V0dXBcIilcbiAgICAgICAgICAuc2V0Q3RhKClcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hdXRoU2VydmljZS5sb2dpbigpO1xuICAgICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlJlY2hlY2sgU3RhdHVzXCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgY29uc3QgbW9kZWxTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvZGV4IG1vZGVsXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nXG4gICAgICAgICAgPyBcIkxvYWRpbmcgbW9kZWxzIGZyb20gdGhlIGluc3RhbGxlZCBDb2RleCBDTEkuLi5cIlxuICAgICAgICAgIDogXCJPcHRpb25hbC4gU2VsZWN0IGEgbW9kZWwgcmVwb3J0ZWQgYnkgQ29kZXggQ0xJLCBvciBsZWF2ZSBibGFuayB0byB1c2UgdGhlIGFjY291bnQgZGVmYXVsdC5cIixcbiAgICAgIClcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2YgdGhpcy5tb2RlbE9wdGlvbnMpIHtcbiAgICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24ob3B0aW9uLnZhbHVlLCBvcHRpb24ubGFiZWwpO1xuICAgICAgICB9XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLmFkZE9wdGlvbihDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsIFwiQ3VzdG9tLi4uXCIpXG4gICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0XG4gICAgICAgICAgICAgID8gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgICAgICAgICAgIDogZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpLFxuICAgICAgICAgIClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgbW9kZWxTZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgYnV0dG9uXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVsb2FkXCIpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucmVmcmVzaE1vZGVsT3B0aW9ucygpO1xuICAgICAgICB9KSxcbiAgICApO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8XG4gICAgICBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucykgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRVxuICAgICkge1xuICAgICAgbGV0IGRyYWZ0VmFsdWUgPSB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHwgaXNLbm93bkNvZGV4TW9kZWwodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWw7XG4gICAgICBpZiAodGhpcy5jdXN0b21Nb2RlbERyYWZ0ICYmIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgIC5zZXROYW1lKFwiQWN0aXZlIENvZGV4IG1vZGVsXCIpXG4gICAgICAgICAgLnNldERlc2ModGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgICAgfVxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiQ3VzdG9tIENvZGV4IG1vZGVsXCIpXG4gICAgICAgIC5zZXREZXNjKFwiRXhhY3QgbW9kZWwgaWQgcGFzc2VkIHRvIGBjb2RleCBleGVjIC0tbW9kZWxgLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIC5zZXRWYWx1ZShkcmFmdFZhbHVlKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBkcmFmdFZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdm9pZCB0aGlzLnNhdmVDdXN0b21Nb2RlbERyYWZ0KGRyYWZ0VmFsdWUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICB0ZXh0LmlucHV0RWwuYmx1cigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnMgPSBhd2FpdCBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCA9IHRydWU7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUN1c3RvbU1vZGVsRHJhZnQodmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1vZGVsID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICghbW9kZWwpIHtcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSBtb2RlbDtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLmRpc3BsYXkoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29kZXhTdGF0dXNTZXR0aW5nKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHN0YXR1c1NldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggc3RhdHVzXCIpXG4gICAgICAuc2V0RGVzYyhcIkNoZWNraW5nIENvZGV4IENMSSBzdGF0dXMuLi5cIik7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hDb2RleFN0YXR1cyhzdGF0dXNTZXR0aW5nKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaENvZGV4U3RhdHVzKHNldHRpbmc6IFNldHRpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhzdGF0dXMubWVzc2FnZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgc2V0dGluZy5zZXREZXNjKFwiQ291bGQgbm90IGNoZWNrIENvZGV4IENMSSBzdGF0dXMuXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYmluZFRleHRTZXR0aW5nKFxuICAgIHRleHQ6IFRleHRDb21wb25lbnQsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgICBvblZhbHVlQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWxpZGF0ZT86ICh2YWx1ZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICApOiBUZXh0Q29tcG9uZW50IHtcbiAgICBsZXQgbGFzdFZhbGlkVmFsdWUgPSB2YWx1ZTtcblxuICAgIHRleHQuc2V0VmFsdWUodmFsdWUpLm9uQ2hhbmdlKChuZXh0VmFsdWUpID0+IHtcbiAgICAgIGlmICghdmFsaWRhdGUgfHwgdmFsaWRhdGUobmV4dFZhbHVlKSkge1xuICAgICAgICBvblZhbHVlQ2hhbmdlKG5leHRWYWx1ZSk7XG4gICAgICAgIGxhc3RWYWxpZFZhbHVlID0gbmV4dFZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IHRleHQuaW5wdXRFbC52YWx1ZTtcbiAgICAgIGlmICh2YWxpZGF0ZSAmJiAhdmFsaWRhdGUoY3VycmVudFZhbHVlKSkge1xuICAgICAgICB0ZXh0LnNldFZhbHVlKGxhc3RWYWxpZFZhbHVlKTtcbiAgICAgICAgb25WYWx1ZUNoYW5nZShsYXN0VmFsaWRWYWx1ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgfSk7XG5cbiAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmXG4gICAgICAgICFldmVudC5tZXRhS2V5ICYmXG4gICAgICAgICFldmVudC5jdHJsS2V5ICYmXG4gICAgICAgICFldmVudC5hbHRLZXkgJiZcbiAgICAgICAgIWV2ZW50LnNoaWZ0S2V5XG4gICAgICApIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0ZXh0O1xuICB9XG59XG4iLCAiLyoqXG4gKiBTaGFyZWQgTm9kZS5qcyBydW50aW1lIGhlbHBlcnMuXG4gKlxuICogVGhlc2UgdXNlIGR5bmFtaWMgYHJlcXVpcmUoKWAgdmlhIGBGdW5jdGlvbihcInJldHVybiByZXF1aXJlXCIpKClgIHRvXG4gKiBieXBhc3MgZXNidWlsZCBidW5kbGluZyBvZiBOb2RlIGJ1aWx0LWlucy4gT2JzaWRpYW4gcGx1Z2lucyBydW4gaW4gYW5cbiAqIEVsZWN0cm9uL05vZGUgY29udGV4dCB3aGVyZSBgcmVxdWlyZWAgaXMgYXZhaWxhYmxlIGF0IHJ1bnRpbWUgYnV0IGNhbm5vdFxuICogYmUgc3RhdGljYWxseSBidW5kbGVkLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlUmVxdWlyZSgpOiBOb2RlUmVxdWlyZSB7XG4gIHJldHVybiBGdW5jdGlvbihcInJldHVybiByZXF1aXJlXCIpKCkgYXMgTm9kZVJlcXVpcmU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RleFJ1bnRpbWUoKToge1xuICBleGVjRmlsZTogKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVPcHRpb25zLFxuICAgIGNhbGxiYWNrPzogKFxuICAgICAgZXJyb3I6IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVFeGNlcHRpb24gfCBudWxsLFxuICAgICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICBzdGRlcnI6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICApID0+IHZvaWQsXG4gICkgPT4gaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5DaGlsZFByb2Nlc3M7XG4gIGZzOiB0eXBlb2YgaW1wb3J0KFwiZnMvcHJvbWlzZXNcIik7XG4gIG9zOiB0eXBlb2YgaW1wb3J0KFwib3NcIik7XG4gIHBhdGg6IHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpO1xufSB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgZXhlY0ZpbGUgfSA9IHJlcShcImNoaWxkX3Byb2Nlc3NcIikgYXMgdHlwZW9mIGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gIHJldHVybiB7XG4gICAgZXhlY0ZpbGU6IGV4ZWNGaWxlIGFzIChcbiAgICAgIGZpbGU6IHN0cmluZyxcbiAgICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICAgIG9wdGlvbnM/OiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyxcbiAgICAgIGNhbGxiYWNrPzogKFxuICAgICAgICBlcnJvcjogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZUV4Y2VwdGlvbiB8IG51bGwsXG4gICAgICAgIHN0ZG91dDogc3RyaW5nIHwgQnVmZmVyLFxuICAgICAgICBzdGRlcnI6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICAgICkgPT4gdm9pZCxcbiAgICApID0+IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuQ2hpbGRQcm9jZXNzLFxuICAgIGZzOiByZXEoXCJmcy9wcm9taXNlc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnMvcHJvbWlzZXNcIiksXG4gICAgb3M6IHJlcShcIm9zXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJvc1wiKSxcbiAgICBwYXRoOiByZXEoXCJwYXRoXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhlY0ZpbGVBc3luYygpOiAoXG4gIGZpbGU6IHN0cmluZyxcbiAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCB7IGV4ZWNGaWxlIH0gPSByZXEoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICBjb25zdCB7IHByb21pc2lmeSB9ID0gcmVxKFwidXRpbFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwidXRpbFwiKTtcbiAgcmV0dXJuIHByb21pc2lmeShleGVjRmlsZSkgYXMgKFxuICAgIGZpbGU6IHN0cmluZyxcbiAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Vub2VudEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImNvZGVcIiBpbiBlcnJvciAmJiBlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUaW1lb3V0RXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBOb2RlSlMuRXJybm9FeGNlcHRpb24ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmIGVycm9yICE9PSBudWxsICYmIFwia2lsbGVkXCIgaW4gZXJyb3IgJiYgZXJyb3Iua2lsbGVkID09PSB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBYm9ydEVycm9yKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgIFwibmFtZVwiIGluIGVycm9yICYmXG4gICAgZXJyb3IubmFtZSA9PT0gXCJBYm9ydEVycm9yXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVSdW50aW1lVW5hdmFpbGFibGUoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgUmVmZXJlbmNlRXJyb3IgfHwgZXJyb3IgaW5zdGFuY2VvZiBUeXBlRXJyb3I7XG59XG4iLCAiaW1wb3J0IHsgZ2V0RXhlY0ZpbGVBc3luYywgZ2V0Tm9kZVJlcXVpcmUsIGlzRW5vZW50RXJyb3IsIGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZSwgaXNUaW1lb3V0RXJyb3IgfSBmcm9tIFwiLi9ub2RlLXJ1bnRpbWVcIjtcblxuZXhwb3J0IHR5cGUgQ29kZXhMb2dpblN0YXR1cyA9IFwibG9nZ2VkLWluXCIgfCBcImxvZ2dlZC1vdXRcIiB8IFwidW5hdmFpbGFibGVcIjtcblxuY29uc3QgQ09ERVhfTE9HSU5fU1RBVFVTX1RJTUVPVVRfTVMgPSA1MDAwO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RleExvZ2luU3RhdHVzKG91dHB1dDogc3RyaW5nKTogQ29kZXhMb2dpblN0YXR1cyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBvdXRwdXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gIGlmICghbm9ybWFsaXplZCkge1xuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxuXG4gIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwibm90IGxvZ2dlZCBpblwiKSB8fCBub3JtYWxpemVkLmluY2x1ZGVzKFwibG9nZ2VkIG91dFwiKSkge1xuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxuXG4gIGlmIChcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwibG9nZ2VkIGluXCIpIHx8XG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcInNpZ25lZCBpblwiKSB8fFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJhdXRoZW50aWNhdGVkXCIpXG4gICkge1xuICAgIHJldHVybiBcImxvZ2dlZC1pblwiO1xuICB9XG5cbiAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZXhMb2dpblN0YXR1cygpOiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICAgIGlmICghY29kZXhCaW5hcnkpIHtcbiAgICAgIHJldHVybiBcInVuYXZhaWxhYmxlXCI7XG4gICAgfVxuXG4gICAgY29uc3QgZXhlY0ZpbGVBc3luYyA9IGdldEV4ZWNGaWxlQXN5bmMoKTtcbiAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBbXCJsb2dpblwiLCBcInN0YXR1c1wiXSwge1xuICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCxcbiAgICAgIHRpbWVvdXQ6IENPREVYX0xPR0lOX1NUQVRVU19USU1FT1VUX01TLFxuICAgIH0pO1xuICAgIHJldHVybiBwYXJzZUNvZGV4TG9naW5TdGF0dXMoYCR7c3Rkb3V0fVxcbiR7c3RkZXJyfWApO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChpc0Vub2VudEVycm9yKGVycm9yKSB8fCBpc1RpbWVvdXRFcnJvcihlcnJvcikgfHwgaXNOb2RlUnVudGltZVVuYXZhaWxhYmxlKGVycm9yKSkge1xuICAgICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleEJpbmFyeVBhdGgoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIGxldCByZXE6IE5vZGVSZXF1aXJlO1xuICB0cnkge1xuICAgIHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgZnMgPSByZXEoXCJmc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnNcIik7XG4gIGNvbnN0IHBhdGggPSByZXEoXCJwYXRoXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpO1xuICBjb25zdCBvcyA9IHJlcShcIm9zXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcblxuICBjb25zdCBjYW5kaWRhdGVzID0gYnVpbGRDb2RleENhbmRpZGF0ZXMocGF0aCwgb3MuaG9tZWRpcigpKTtcbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3MoY2FuZGlkYXRlKTtcbiAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBLZWVwIHNlYXJjaGluZy5cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gYnVpbGRDb2RleENhbmRpZGF0ZXMocGF0aE1vZHVsZTogdHlwZW9mIGltcG9ydChcInBhdGhcIiksIGhvbWVEaXI6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwYXRoRW50cmllcyA9IChwcm9jZXNzLmVudi5QQVRIID8/IFwiXCIpLnNwbGl0KHBhdGhNb2R1bGUuZGVsaW1pdGVyKS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBwYXRoRW50cmllcykge1xuICAgIGNhbmRpZGF0ZXMuYWRkKHBhdGhNb2R1bGUuam9pbihlbnRyeSwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICBjb25zdCBjb21tb25EaXJzID0gW1xuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgYCR7aG9tZURpcn0vLmxvY2FsL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmJ1bi9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5jb2RlaXVtL3dpbmRzdXJmL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmFudGlncmF2aXR5L2FudGlncmF2aXR5L2JpbmAsXG4gICAgXCIvQXBwbGljYXRpb25zL0NvZGV4LmFwcC9Db250ZW50cy9SZXNvdXJjZXNcIixcbiAgXTtcblxuICBmb3IgKGNvbnN0IGRpciBvZiBjb21tb25EaXJzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGRpciwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShjYW5kaWRhdGVzKTtcbn1cblxuZnVuY3Rpb24gY29kZXhFeGVjdXRhYmxlTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJjb2RleC5jbWRcIiA6IFwiY29kZXhcIjtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlDb25maWd1cmF0aW9uU3RhdHVzIHtcbiAgY29uZmlndXJlZDogYm9vbGVhbjtcbiAgcHJvdmlkZXI6IFwiY29kZXhcIjtcbiAgbW9kZWw6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBjb25zdCBjb2RleFN0YXR1cyA9IGF3YWl0IGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgaWYgKGNvZGV4U3RhdHVzID09PSBcInVuYXZhaWxhYmxlXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgaW5zdGFsbGVkLlwiLFxuICAgIH07XG4gIH1cblxuICBpZiAoY29kZXhTdGF0dXMgIT09IFwibG9nZ2VkLWluXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgbG9nZ2VkIGluLlwiLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBtb2RlbCA9IHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpIHx8IG51bGw7XG4gIHJldHVybiB7XG4gICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgIG1vZGVsLFxuICAgIG1lc3NhZ2U6IG1vZGVsXG4gICAgICA/IGBSZWFkeSB0byB1c2UgQ29kZXggd2l0aCBtb2RlbCAke21vZGVsfS5gXG4gICAgICA6IFwiUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggdGhlIGFjY291bnQgZGVmYXVsdCBtb2RlbC5cIixcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5pbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jIH0gZnJvbSBcIi4vbm9kZS1ydW50aW1lXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZXhNb2RlbE9wdGlvbiB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM6IENvZGV4TW9kZWxPcHRpb25bXSA9IFtcbiAgeyB2YWx1ZTogXCJcIiwgbGFiZWw6IFwiQWNjb3VudCBkZWZhdWx0XCIgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUgPSBcIl9fY3VzdG9tX19cIjtcbmNvbnN0IENPREVYX01PREVMX0NBVEFMT0dfVElNRU9VVF9NUyA9IDgwMDA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPENvZGV4TW9kZWxPcHRpb25bXT4ge1xuICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhlY0ZpbGVBc3luYyA9IGdldEV4ZWNGaWxlQXN5bmMoKTtcbiAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBbXCJkZWJ1Z1wiLCBcIm1vZGVsc1wiXSwge1xuICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCAqIDIwLFxuICAgICAgdGltZW91dDogQ09ERVhfTU9ERUxfQ0FUQUxPR19USU1FT1VUX01TLFxuICAgIH0pO1xuICAgIHJldHVybiBwYXJzZUNvZGV4TW9kZWxDYXRhbG9nKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RleE1vZGVsQ2F0YWxvZyhvdXRwdXQ6IHN0cmluZyk6IENvZGV4TW9kZWxPcHRpb25bXSB7XG4gIGNvbnN0IGpzb25UZXh0ID0gZXh0cmFjdEpzb25PYmplY3Qob3V0cHV0KTtcbiAgaWYgKCFqc29uVGV4dCkge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIHtcbiAgICAgIG1vZGVscz86IEFycmF5PHtcbiAgICAgICAgc2x1Zz86IHVua25vd247XG4gICAgICAgIGRpc3BsYXlfbmFtZT86IHVua25vd247XG4gICAgICAgIHZpc2liaWxpdHk/OiB1bmtub3duO1xuICAgICAgfT47XG4gICAgfTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IFsuLi5ERUZBVUxUX0NPREVYX01PREVMX09QVElPTlNdO1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgcGFyc2VkLm1vZGVscyA/PyBbXSkge1xuICAgICAgY29uc3Qgc2x1ZyA9IHR5cGVvZiBtb2RlbC5zbHVnID09PSBcInN0cmluZ1wiID8gbW9kZWwuc2x1Zy50cmltKCkgOiBcIlwiO1xuICAgICAgaWYgKCFzbHVnIHx8IHNlZW4uaGFzKHNsdWcpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKG1vZGVsLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBtb2RlbC52aXNpYmlsaXR5ICE9PSBcImxpc3RcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHNlZW4uYWRkKHNsdWcpO1xuICAgICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgdmFsdWU6IHNsdWcsXG4gICAgICAgIGxhYmVsOiB0eXBlb2YgbW9kZWwuZGlzcGxheV9uYW1lID09PSBcInN0cmluZ1wiICYmIG1vZGVsLmRpc3BsYXlfbmFtZS50cmltKClcbiAgICAgICAgICA/IG1vZGVsLmRpc3BsYXlfbmFtZS50cmltKClcbiAgICAgICAgICA6IHNsdWcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKFxuICBtb2RlbDogc3RyaW5nLFxuICBvcHRpb25zOiByZWFkb25seSBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4pOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbW9kZWwudHJpbSgpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICByZXR1cm4gb3B0aW9ucy5zb21lKChvcHRpb24pID0+IG9wdGlvbi52YWx1ZSA9PT0gbm9ybWFsaXplZClcbiAgICA/IG5vcm1hbGl6ZWRcbiAgICA6IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzS25vd25Db2RleE1vZGVsKFxuICBtb2RlbDogc3RyaW5nLFxuICBvcHRpb25zOiByZWFkb25seSBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4pOiBib29sZWFuIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG1vZGVsLnRyaW0oKTtcbiAgcmV0dXJuIG9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT09IG5vcm1hbGl6ZWQpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SnNvbk9iamVjdChvdXRwdXQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzdGFydCA9IG91dHB1dC5pbmRleE9mKFwie1wiKTtcbiAgY29uc3QgZW5kID0gb3V0cHV0Lmxhc3RJbmRleE9mKFwifVwiKTtcbiAgaWYgKHN0YXJ0ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8IGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBvdXRwdXQuc2xpY2Uoc3RhcnQsIGVuZCArIDEpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4QmluYXJ5UGF0aCB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5pbXBvcnQgeyBnZXRDb2RleFJ1bnRpbWUsIGlzQWJvcnRFcnJvciwgaXNFbm9lbnRFcnJvciwgaXNUaW1lb3V0RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvbm9kZS1ydW50aW1lXCI7XG5cbmNvbnN0IENPREVYX0NIQVRfVElNRU9VVF9NUyA9IDEyMDAwMDtcblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgYXN5bmMgY29tcGxldGVDaGF0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyB8IG51bGwsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucG9zdENvZGV4Q29tcGxldGlvbihzZXR0aW5ncywgbWVzc2FnZXMsIHdvcmtpbmdEaXJlY3RvcnksIHNpZ25hbCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDb2RleENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICAgd29ya2luZ0RpcmVjdG9yeTogc3RyaW5nIHwgbnVsbCxcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IGV4ZWNGaWxlLCBmcywgb3MsIHBhdGggfSA9IGdldENvZGV4UnVudGltZSgpO1xuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgfVxuICAgIGNvbnN0IHRlbXBEaXIgPSBhd2FpdCBmcy5ta2R0ZW1wKHBhdGguam9pbihvcy50bXBkaXIoKSwgXCJicmFpbi1jb2RleC1cIikpO1xuICAgIGNvbnN0IG91dHB1dEZpbGUgPSBwYXRoLmpvaW4odGVtcERpciwgXCJyZXNwb25zZS50eHRcIik7XG4gICAgY29uc3QgYXJncyA9IFtcbiAgICAgIFwiZXhlY1wiLFxuICAgICAgXCItLXNraXAtZ2l0LXJlcG8tY2hlY2tcIixcbiAgICAgIFwiLS1lcGhlbWVyYWxcIixcbiAgICAgIFwiLS1pZ25vcmUtcnVsZXNcIixcbiAgICAgIFwiLS1zYW5kYm94XCIsXG4gICAgICBcInJlYWQtb25seVwiLFxuICAgICAgXCItLW91dHB1dC1sYXN0LW1lc3NhZ2VcIixcbiAgICAgIG91dHB1dEZpbGUsXG4gICAgXTtcblxuICAgIGlmICh3b3JraW5nRGlyZWN0b3J5KSB7XG4gICAgICBhcmdzLnB1c2goXCItLWNkXCIsIHdvcmtpbmdEaXJlY3RvcnkpO1xuICAgIH1cblxuICAgIGlmIChzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgYXJncy5wdXNoKFwiLS1tb2RlbFwiLCBzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSk7XG4gICAgfVxuXG4gICAgYXJncy5wdXNoKFwiLVwiKTtcbiAgICBjb25zdCBwcm9tcHQgPSB0aGlzLmJ1aWxkQ29kZXhQcm9tcHQobWVzc2FnZXMpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGV4ZWNGaWxlV2l0aEFib3J0KGNvZGV4QmluYXJ5LCBhcmdzLCB7XG4gICAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQgKiA0LFxuICAgICAgICBjd2Q6IHRlbXBEaXIsXG4gICAgICAgIHRpbWVvdXQ6IENPREVYX0NIQVRfVElNRU9VVF9NUyxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgICBzdGRpbjogcHJvbXB0LFxuICAgICAgfSwgZXhlY0ZpbGUpO1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKG91dHB1dEZpbGUsIFwidXRmOFwiKTtcbiAgICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChpc0Vub2VudEVycm9yKGVycm9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCBDTEkgaXMgbm90IGluc3RhbGxlZC4gSW5zdGFsbCBgQG9wZW5haS9jb2RleGAgYW5kIHJ1biBgY29kZXggbG9naW5gIGZpcnN0LlwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChpc1RpbWVvdXRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggZGlkIG5vdCByZXNwb25kIGluIHRpbWUuIFRyeSBhZ2Fpbiwgb3IgY2hlY2sgYGNvZGV4IGxvZ2luIHN0YXR1c2Agb3V0c2lkZSBCcmFpbi5cIik7XG4gICAgICB9XG4gICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkIHx8IGlzQWJvcnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcmVxdWVzdCBzdG9wcGVkLlwiKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBmcy5ybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29kZXhQcm9tcHQoXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG1lc3NhZ2VzXG4gICAgICAubWFwKChtZXNzYWdlKSA9PiBgJHttZXNzYWdlLnJvbGUudG9VcHBlckNhc2UoKX06XFxuJHttZXNzYWdlLmNvbnRlbnR9YClcbiAgICAgIC5qb2luKFwiXFxuXFxuXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWNGaWxlV2l0aEFib3J0KFxuICBmaWxlOiBzdHJpbmcsXG4gIGFyZ3M6IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyAmIHtcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgICBzdGRpbj86IHN0cmluZztcbiAgfSxcbiAgZXhlY0ZpbGU6IFJldHVyblR5cGU8dHlwZW9mIGdldENvZGV4UnVudGltZT5bXCJleGVjRmlsZVwiXSxcbik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgY29uc3QgeyBzaWduYWwsIHN0ZGluLCAuLi5leGVjT3B0aW9ucyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBjaGlsZCA9IGV4ZWNGaWxlKGZpbGUsIGFyZ3MsIGV4ZWNPcHRpb25zLCAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgc2lnbmFsPy5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgYWJvcnQpO1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHN0ZGluICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoaWxkLnN0ZGluPy5lbmQoc3RkaW4pO1xuICAgIH1cblxuICAgIGNvbnN0IGFib3J0ID0gKCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2hpbGQua2lsbChcIlNJR1RFUk1cIik7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChjaGlsZC5leGl0Q29kZSA9PT0gbnVsbCAmJiBjaGlsZC5zaWduYWxDb2RlID09PSBudWxsKSB7XG4gICAgICAgICAgY2hpbGQua2lsbChcIlNJR0tJTExcIik7XG4gICAgICAgIH1cbiAgICAgIH0sIDE1MDApO1xuICAgIH07XG5cbiAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICBhYm9ydCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cblxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBDb2RleExvZ2luU3RhdHVzLCBnZXRDb2RleExvZ2luU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LWF1dGhcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluQXV0aFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogQnJhaW5QbHVnaW4pIHt9XG5cbiAgYXN5bmMgbG9naW4oKSB7XG4gICAgbmV3IE5vdGljZShcIkluc3RhbGwgdGhlIENvZGV4IENMSSwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gcmV0dXJuIHRvIEJyYWluIGFuZCByZWNoZWNrIENvZGV4IHN0YXR1cy5cIik7XG4gICAgd2luZG93Lm9wZW4oXCJodHRwczovL29wZW5haS5jb20vY29kZXgvZ2V0LXN0YXJ0ZWQvXCIpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29kZXhTdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gICAgcmV0dXJuIGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuY29uc3QgREVGQVVMVF9JTlNUUlVDVElPTlMgPSBbXG4gIFwiIyBCcmFpbiBJbnN0cnVjdGlvbnNcIixcbiAgXCJcIixcbiAgXCJZb3UgYXJlIGhlbHBpbmcgZmlsZSBpbmZvcm1hdGlvbiBpbnRvIHRoaXMgT2JzaWRpYW4gdmF1bHQgYW5kIHJldHJpZXZlIGluZm9ybWF0aW9uIGZyb20gaXQuXCIsXG4gIFwiXCIsXG4gIFwiIyMgT3BlcmF0aW5nIFJ1bGVzXCIsXG4gIFwiLSBLZWVwIGFsbCBwZXJzaXN0ZWQgY29udGVudCBhcyBub3JtYWwgbWFya2Rvd24uXCIsXG4gIFwiLSBVc2Ugb25seSBleHBsaWNpdCB2YXVsdCBjb250ZXh0IHdoZW4gYW5zd2VyaW5nIHJldHJpZXZhbCBxdWVzdGlvbnMuXCIsXG4gIFwiLSBQcmVmZXIgdXBkYXRpbmcgb3IgYXBwZW5kaW5nIHRvIGV4aXN0aW5nIG5vdGVzIG92ZXIgY3JlYXRpbmcgZHVwbGljYXRlcy5cIixcbiAgXCItIFVzZSB3aWtpIGxpbmtzIHdoZW4gdXNlZnVsIGFuZCBzdXBwb3J0ZWQgYnkgdGhlIHByb3ZpZGVkIGNvbnRleHQuXCIsXG4gIFwiLSBVc2UgdGhlIGNvbmZpZ3VyZWQgbm90ZXMgZm9sZGVyIGFzIHRoZSBkZWZhdWx0IGxvY2F0aW9uIGZvciBuZXcgbm90ZXMuXCIsXG4gIFwiLSBJZiB5b3UgYXJlIHVuc3VyZSB3aGVyZSBzb21ldGhpbmcgYmVsb25ncywgYXNrIGEgcXVlc3Rpb24gaW5zdGVhZCBvZiBndWVzc2luZy5cIixcbiAgXCItIE5ldmVyIGRlbGV0ZSBvciBvdmVyd3JpdGUgZXhpc3RpbmcgdXNlciBjb250ZW50LlwiLFxuICBcIi0gUHJvcG9zZSBzYWZlIGFwcGVuZC9jcmVhdGUgb3BlcmF0aW9ucyBhbmQgd2FpdCBmb3IgYXBwcm92YWwgYmVmb3JlIHdyaXRpbmcuXCIsXG4gIFwiXCIsXG5dLmpvaW4oXCJcXG5cIik7XG5cbmV4cG9ydCBjbGFzcyBJbnN0cnVjdGlvblNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVGaWxlKFxuICAgICAgc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfSU5TVFJVQ1RJT05TLFxuICAgICk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoZmlsZS5wYXRoLCBERUZBVUxUX0lOU1RSVUNUSU9OUyk7XG4gICAgICByZXR1cm4gREVGQVVMVF9JTlNUUlVDVElPTlM7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgYXN5bmMgcmVhZEluc3RydWN0aW9ucygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgSW5zdHJ1Y3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vaW5zdHJ1Y3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeU1hdGNoLCBWYXVsdFF1ZXJ5U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXF1ZXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXdyaXRlLXNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWYXVsdENoYXRSZXNwb25zZSB7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgcGxhbjogVmF1bHRXcml0ZVBsYW4gfCBudWxsO1xuICB1c2VkQUk6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhdEV4Y2hhbmdlIHtcbiAgcm9sZTogXCJ1c2VyXCIgfCBcImJyYWluXCI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuY29uc3QgRU1QVFlfUExBTjogVmF1bHRXcml0ZVBsYW4gPSB7XG4gIHN1bW1hcnk6IFwiXCIsXG4gIGNvbmZpZGVuY2U6IFwibG93XCIsXG4gIG9wZXJhdGlvbnM6IFtdLFxuICBxdWVzdGlvbnM6IFtdLFxufTtcbmNvbnN0IENIQVRfQ09OVEVYVF9MSU1JVCA9IDY7XG5jb25zdCBNQVhfSElTVE9SWV9FWENIQU5HRVMgPSA2O1xuY29uc3QgTUFYX0NPTlRFWFRfRVhDRVJQVF9DSEFSUyA9IDEyMDA7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdENoYXRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5zdHJ1Y3Rpb25TZXJ2aWNlOiBJbnN0cnVjdGlvblNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBxdWVyeVNlcnZpY2U6IFZhdWx0UXVlcnlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB3cml0ZVNlcnZpY2U6IFZhdWx0V3JpdGVTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIHJlc3BvbmQoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGhpc3Rvcnk6IENoYXRFeGNoYW5nZVtdID0gW10sXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8VmF1bHRDaGF0UmVzcG9uc2U+IHtcbiAgICBjb25zdCB0cmltbWVkID0gbWVzc2FnZS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbnRlciBhIG1lc3NhZ2UgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgY29uc3QgW2luc3RydWN0aW9ucywgc291cmNlc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZS5yZWFkSW5zdHJ1Y3Rpb25zKCksXG4gICAgICB0aGlzLnF1ZXJ5U2VydmljZS5xdWVyeVZhdWx0KHRyaW1tZWQpLFxuICAgIF0pO1xuICAgIGNvbnN0IGNvbnRleHQgPSBmb3JtYXRTb3VyY2VzRm9yUHJvbXB0KHNvdXJjZXMuc2xpY2UoMCwgQ0hBVF9DT05URVhUX0xJTUlUKSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB2YXVsdEJhc2VQYXRoID0gdGhpcy52YXVsdFNlcnZpY2UuZ2V0QmFzZVBhdGgoKTtcbiAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgaWYgKCFhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYWlTdGF0dXMubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5jb21wbGV0ZUNoYXQoXG4gICAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6IGJ1aWxkU3lzdGVtUHJvbXB0KGluc3RydWN0aW9ucywgc2V0dGluZ3MpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogYnVpbGRVc2VyUHJvbXB0KHRyaW1tZWQsIHZhdWx0QmFzZVBhdGgsIGNvbnRleHQsIGhpc3RvcnkpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHNldHRpbmdzLFxuICAgICAgdmF1bHRCYXNlUGF0aCxcbiAgICAgIHNpZ25hbCxcbiAgICApO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2hhdFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiBwYXJzZWQuYW5zd2VyIHx8IFwiQ29kZXggcmV0dXJuZWQgbm8gYW5zd2VyLlwiLFxuICAgICAgc291cmNlcyxcbiAgICAgIHBsYW46IHBhcnNlZC5wbGFuID8gdGhpcy53cml0ZVNlcnZpY2Uubm9ybWFsaXplUGxhbihwYXJzZWQucGxhbikgOiBudWxsLFxuICAgICAgdXNlZEFJOiB0cnVlLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQoXG4gIGluc3RydWN0aW9uczogc3RyaW5nLFxuICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbik6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgXCJZb3UgYXJlIEJyYWluLCBhbiBPYnNpZGlhbiB2YXVsdCBhc3Npc3RhbnQuXCIsXG4gICAgXCJBbnN3ZXIgZGlyZWN0bHkgZnJvbSB0aGUgT2JzaWRpYW4gdmF1bHQgbWFya2Rvd24uXCIsXG4gICAgXCJZb3UgbWF5IGluc3BlY3QgbWFya2Rvd24gZmlsZXMgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3Rvcnkgd2l0aCByZWFkLW9ubHkgc2hlbGwgY29tbWFuZHMuXCIsXG4gICAgXCJOZXZlciBjbGFpbSBmYWN0cyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIGJ5IHZhdWx0IG1hcmtkb3duIG9yIHRoZSBwcm92aWRlZCBzb3VyY2UgaGludHMuXCIsXG4gICAgXCJGb3Igc2ltcGxlIHF1ZXN0aW9ucywgYW5zd2VyIGluIG9uZSBvciB0d28gc2VudGVuY2VzLlwiLFxuICAgIFwiRm9yIGZpbGluZyByZXF1ZXN0cywgcHJvcG9zZSBzYWZlIHZhdWx0IHdyaXRlcy5cIixcbiAgICBcIlJldHVybiBvbmx5IGEgSlNPTiBvYmplY3QuXCIsXG4gICAgXCJcIixcbiAgICBcIlJldHVybiB0aGlzIEpTT04gc2hhcGU6XCIsXG4gICAgXCJ7XCIsXG4gICAgJyAgXCJhbnN3ZXJcIjogXCJtYXJrZG93biBhbnN3ZXIgd2l0aCBldmlkZW5jZSBhbmQgZ2Fwc1wiLCcsXG4gICAgJyAgXCJwbGFuXCI6IHsnLFxuICAgICcgICAgXCJzdW1tYXJ5XCI6IFwic2hvcnQgc3VtbWFyeSBvZiBwcm9wb3NlZCB3cml0ZXMsIG9yIGVtcHR5IHN0cmluZ1wiLCcsXG4gICAgJyAgICBcImNvbmZpZGVuY2VcIjogXCJsb3d8bWVkaXVtfGhpZ2hcIiwnLFxuICAgICcgICAgXCJvcGVyYXRpb25zXCI6IFsnLFxuICAgICcgICAgICB7XCJ0eXBlXCI6XCJhcHBlbmRcIixcInBhdGhcIjpcIlNvbWUvRmlsZS5tZFwiLFwiY29udGVudFwiOlwibWFya2Rvd25cIn0sJyxcbiAgICAnICAgICAge1widHlwZVwiOlwiY3JlYXRlXCIsXCJwYXRoXCI6XCJTb21lL05ldyBGaWxlLm1kXCIsXCJjb250ZW50XCI6XCJtYXJrZG93blwifScsXG4gICAgXCIgICAgXSxcIixcbiAgICAnICAgIFwicXVlc3Rpb25zXCI6IFtcIm9wZW4gcXVlc3Rpb24gaWYgeW91IG5lZWQgY2xhcmlmaWNhdGlvblwiXScsXG4gICAgXCIgIH1cIixcbiAgICBcIn1cIixcbiAgICBcIlwiLFxuICAgIFwiT25seSBpbmNsdWRlIHdyaXRlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlciBhc2tzIHRvIGFkZCwgc2F2ZSwgZmlsZSwgcmVtZW1iZXIsIHVwZGF0ZSwgY3JlYXRlLCBvciBvdGhlcndpc2UgcHV0IGluZm9ybWF0aW9uIGludG8gdGhlIHZhdWx0LlwiLFxuICAgIFwiVXNlIGFwcGVuZC9jcmVhdGUgb3BlcmF0aW9ucyBvbmx5LiBEbyBub3QgcHJvcG9zZSBkZWxldGUgb3IgcmVwbGFjZSBvcGVyYXRpb25zLlwiLFxuICAgIGBEZWZhdWx0IG5vdGVzIGZvbGRlcjogJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn1gLFxuICAgIFwiXCIsXG4gICAgXCJWYXVsdCBpbnN0cnVjdGlvbnM6XCIsXG4gICAgaW5zdHJ1Y3Rpb25zLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVXNlclByb21wdChcbiAgbWVzc2FnZTogc3RyaW5nLFxuICB2YXVsdEJhc2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBjb250ZXh0OiBzdHJpbmcsXG4gIGhpc3Rvcnk6IENoYXRFeGNoYW5nZVtdLFxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgcmVjZW50SGlzdG9yeSA9IGhpc3Rvcnkuc2xpY2UoLU1BWF9ISVNUT1JZX0VYQ0hBTkdFUyk7XG4gIGlmIChyZWNlbnRIaXN0b3J5Lmxlbmd0aCA+IDApIHtcbiAgICBwYXJ0cy5wdXNoKFwiQ29udmVyc2F0aW9uIGhpc3Rvcnk6XCIpO1xuICAgIGZvciAoY29uc3QgZXhjaGFuZ2Ugb2YgcmVjZW50SGlzdG9yeSkge1xuICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgIHBhcnRzLnB1c2goYCR7ZXhjaGFuZ2Uucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIlVzZXJcIiA6IFwiQnJhaW5cIn06YCk7XG4gICAgICBwYXJ0cy5wdXNoKGV4Y2hhbmdlLnRleHQpO1xuICAgIH1cbiAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICAgIHBhcnRzLnB1c2goXCItLS1cIik7XG4gICAgcGFydHMucHVzaChcIlwiKTtcbiAgfVxuXG4gIHBhcnRzLnB1c2goYFVzZXIgbWVzc2FnZTogJHttZXNzYWdlfWApO1xuICBwYXJ0cy5wdXNoKFwiXCIpO1xuICBwYXJ0cy5wdXNoKFxuICAgIHZhdWx0QmFzZVBhdGhcbiAgICAgID8gXCJZb3UgYXJlIHJ1bm5pbmcgZnJvbSB0aGUgT2JzaWRpYW4gdmF1bHQgcm9vdC4gVXNlIHJlYWQtb25seSBzaGVsbCBjb21tYW5kcyBvbmx5IGlmIHlvdSBuZWVkIHRvIGluc3BlY3QgbWFya2Rvd24gZmlsZXMuXCJcbiAgICAgIDogXCJVc2UgdGhlIHJlbGV2YW50IHZhdWx0IGNvbnRleHQgYmVsb3cuXCIsXG4gICk7XG4gIHBhcnRzLnB1c2goXCJcIik7XG4gIHBhcnRzLnB1c2goXCJSZWxldmFudCBzb3VyY2UgaGludHM6XCIpO1xuICBwYXJ0cy5wdXNoKGNvbnRleHQgfHwgXCJObyBtYXRjaGluZyB2YXVsdCBmaWxlcyBmb3VuZC5cIik7XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNvdXJjZXNGb3JQcm9tcHQoc291cmNlczogVmF1bHRRdWVyeU1hdGNoW10pOiBzdHJpbmcge1xuICByZXR1cm4gc291cmNlc1xuICAgIC5tYXAoKHNvdXJjZSwgaW5kZXgpID0+IFtcbiAgICAgIGAjIyBTb3VyY2UgJHtpbmRleCArIDF9OiAke3NvdXJjZS5wYXRofWAsXG4gICAgICBgVGl0bGU6ICR7c291cmNlLnRpdGxlfWAsXG4gICAgICBgUmVhc29uOiAke3NvdXJjZS5yZWFzb259YCxcbiAgICAgIFwiXCIsXG4gICAgICBzb3VyY2UuZXhjZXJwdC5zbGljZSgwLCBNQVhfQ09OVEVYVF9FWENFUlBUX0NIQVJTKSxcbiAgICBdLmpvaW4oXCJcXG5cIikpXG4gICAgLmpvaW4oXCJcXG5cXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2hhdFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcpOiB7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbiB8IG51bGw7XG59IHtcbiAgY29uc3QganNvblRleHQgPSBleHRyYWN0SnNvbihyZXNwb25zZSk7XG4gIGlmICghanNvblRleHQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiByZXNwb25zZS50cmltKCksXG4gICAgICBwbGFuOiBudWxsLFxuICAgIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIHtcbiAgICAgIGFuc3dlcj86IHVua25vd247XG4gICAgICBwbGFuPzogdW5rbm93bjtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHR5cGVvZiBwYXJzZWQuYW5zd2VyID09PSBcInN0cmluZ1wiID8gcGFyc2VkLmFuc3dlci50cmltKCkgOiBcIlwiLFxuICAgICAgcGxhbjogaXNQbGFuT2JqZWN0KHBhcnNlZC5wbGFuKSA/IHBhcnNlZC5wbGFuIDogRU1QVFlfUExBTixcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiByZXNwb25zZS50cmltKCksXG4gICAgICBwbGFuOiBudWxsLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEpzb24odGV4dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGZlbmNlZCA9IHRleHQubWF0Y2goL2BgYCg/Ompzb24pP1xccyooW1xcc1xcU10qPylgYGAvaSk/LlsxXTtcbiAgaWYgKGZlbmNlZCkge1xuICAgIHJldHVybiBmZW5jZWQudHJpbSgpO1xuICB9XG4gIGNvbnN0IHN0YXJ0ID0gdGV4dC5pbmRleE9mKFwie1wiKTtcbiAgY29uc3QgZW5kID0gdGV4dC5sYXN0SW5kZXhPZihcIn1cIik7XG4gIGlmIChzdGFydCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fCBlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gdGV4dC5zbGljZShzdGFydCwgZW5kICsgMSk7XG59XG5cbmZ1bmN0aW9uIGlzUGxhbk9iamVjdCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFZhdWx0V3JpdGVQbGFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbDtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzLCBwYXJzZUV4Y2x1ZGVGb2xkZXJzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmF1bHRRdWVyeU1hdGNoIHtcbiAgcGF0aDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBzY29yZTogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbiAgZXhjZXJwdDogc3RyaW5nO1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmNvbnN0IE1BWF9RVUVSWV9GSUxFUyA9IDEyO1xuY29uc3QgTUFYX0VYQ0VSUFRfQ0hBUlMgPSA3MDA7XG5jb25zdCBNQVhfU05JUFBFVF9MSU5FUyA9IDU7XG5jb25zdCBTVE9QX1dPUkRTID0gbmV3IFNldChbXG4gIFwiYWJvdXRcIixcbiAgXCJhcmVcIixcbiAgXCJjYW5cIixcbiAgXCJkaWRcIixcbiAgXCJkb2VzXCIsXG4gIFwiZm9yXCIsXG4gIFwiZnJvbVwiLFxuICBcImhhdmVcIixcbiAgXCJob3dcIixcbiAgXCJpbnRvXCIsXG4gIFwiaXNcIixcbiAgXCJrbm93XCIsXG4gIFwibGlzdFwiLFxuICBcIm15XCIsXG4gIFwidGhlXCIsXG4gIFwidGhpc1wiLFxuICBcInRoYXRcIixcbiAgXCJ3aGF0XCIsXG4gIFwid2hlblwiLFxuICBcIndoZXJlXCIsXG4gIFwid2hpY2hcIixcbiAgXCJ3aG9cIixcbiAgXCJ3aHlcIixcbiAgXCJ3aXRoXCIsXG5dKTtcblxuZXhwb3J0IGNsYXNzIFZhdWx0UXVlcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBxdWVyeVZhdWx0KHF1ZXJ5OiBzdHJpbmcsIGxpbWl0ID0gTUFYX1FVRVJZX0ZJTEVTKTogUHJvbWlzZTxWYXVsdFF1ZXJ5TWF0Y2hbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdG9rZW5zID0gdG9rZW5pemUocXVlcnkpO1xuICAgIGNvbnN0IGV4Y2x1ZGVGb2xkZXJzID0gcGFyc2VFeGNsdWRlRm9sZGVycyhzZXR0aW5ncy5leGNsdWRlRm9sZGVycyk7XG4gICAgY29uc3QgZmlsZXMgPSAoYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IHNob3VsZEluY2x1ZGVGaWxlKGZpbGUsIHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUsIGV4Y2x1ZGVGb2xkZXJzKSlcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG5cbiAgICBjb25zdCBtYXRjaGVzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBzY29yZSA9IHNjb3JlRmlsZShmaWxlLCB0ZXh0LCBxdWVyeSwgdG9rZW5zKTtcbiAgICAgIGlmIChzY29yZSA8PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogZmlsZS5wYXRoLFxuICAgICAgICB0aXRsZTogdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLFxuICAgICAgICBzY29yZSxcbiAgICAgICAgcmVhc29uOiBidWlsZFJlYXNvbihmaWxlLCB0ZXh0LCBxdWVyeSwgdG9rZW5zKSxcbiAgICAgICAgZXhjZXJwdDogYnVpbGRFeGNlcnB0KHRleHQsIHRva2VucyksXG4gICAgICAgIHRleHQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zY29yZSAtIGxlZnQuc2NvcmUpXG4gICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEluY2x1ZGVGaWxlKGZpbGU6IFRGaWxlLCBpbnN0cnVjdGlvbnNGaWxlOiBzdHJpbmcsIGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoZmlsZS5wYXRoID09PSBpbnN0cnVjdGlvbnNGaWxlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAoY29uc3QgZm9sZGVyIG9mIGV4Y2x1ZGVGb2xkZXJzKSB7XG4gICAgY29uc3QgcHJlZml4ID0gZm9sZGVyLmVuZHNXaXRoKFwiL1wiKSA/IGZvbGRlciA6IGAke2ZvbGRlcn0vYDtcbiAgICBpZiAoZmlsZS5wYXRoID09PSBmb2xkZXIgfHwgZmlsZS5wYXRoLnN0YXJ0c1dpdGgocHJlZml4KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcmV0dXJuIGlucHV0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoL1teYS16MC05Xy8tXSsvaSlcbiAgICAubWFwKCh0b2tlbikgPT4gdG9rZW4udHJpbSgpKVxuICAgIC5maWx0ZXIoKHRva2VuKSA9PiB0b2tlbi5sZW5ndGggPj0gMylcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gIVNUT1BfV09SRFMuaGFzKHRva2VuKSlcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4ge1xuICAgICAgaWYgKHNlZW4uaGFzKHRva2VuKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZCh0b2tlbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIC5zbGljZSgwLCAyNCk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nLCBxdWVyeTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgaWYgKCF0b2tlbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KDEsIE1hdGgucm91bmQoZmlsZS5zdGF0Lm10aW1lIC8gMTAwMDAwMDAwMDAwMCkpO1xuICB9XG5cbiAgY29uc3QgbG93ZXJQYXRoID0gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGl0bGUgPSB0aXRsZUZvckZpbGUoZmlsZSwgdGV4dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBub3JtYWxpemVkVGV4dCA9IG5vcm1hbGl6ZVBocmFzZSh0ZXh0KTtcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gbm9ybWFsaXplUGhyYXNlKHF1ZXJ5KTtcbiAgbGV0IHNjb3JlID0gMDtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgc2NvcmUgKz0gMTg7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBsb3dlclBhdGguaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDI0O1xuICB9XG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKGxvd2VyUGF0aC5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDEwO1xuICAgIH1cbiAgICBpZiAobG93ZXJUaXRsZS5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDk7XG4gICAgfVxuICAgIGNvbnN0IGhlYWRpbmdNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxuKSN7MSw2fVteXFxcXG5dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1gLCBcImdcIikpO1xuICAgIGlmIChoZWFkaW5nTWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gaGVhZGluZ01hdGNoZXMubGVuZ3RoICogNztcbiAgICB9XG4gICAgY29uc3QgbGlua01hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgXFxcXFtcXFxcW1teXFxcXF1dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bXlxcXFxdXSpcXFxcXVxcXFxdYCwgXCJnXCIpKTtcbiAgICBpZiAobGlua01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IGxpbmtNYXRjaGVzLmxlbmd0aCAqIDY7XG4gICAgfVxuICAgIGNvbnN0IHRhZ01hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgKF58XFxcXHMpI1stL19hLXowLTldKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bLS9fYS16MC05XSpgLCBcImdpXCIpKTtcbiAgICBpZiAodGFnTWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gdGFnTWF0Y2hlcy5sZW5ndGggKiA1O1xuICAgIH1cbiAgICBjb25zdCB0ZXh0TWF0Y2hlcyA9IGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cCh0b2tlbiksIFwiZ1wiKSk7XG4gICAgaWYgKHRleHRNYXRjaGVzKSB7XG4gICAgICBzY29yZSArPSBNYXRoLm1pbig4LCB0ZXh0TWF0Y2hlcy5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1hdGNoZWRUb2tlbnMgPSB0b2tlbnMuZmlsdGVyKCh0b2tlbikgPT4gbG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSB8fCBsb3dlclRleHQuaW5jbHVkZXModG9rZW4pKTtcbiAgc2NvcmUgKz0gbWF0Y2hlZFRva2Vucy5sZW5ndGggKiAzO1xuICBpZiAobWF0Y2hlZFRva2Vucy5sZW5ndGggPT09IHRva2Vucy5sZW5ndGgpIHtcbiAgICBzY29yZSArPSBNYXRoLm1pbigxMCwgdG9rZW5zLmxlbmd0aCAqIDIpO1xuICB9XG4gIGNvbnN0IGFnZU1zID0gRGF0ZS5ub3coKSAtIGZpbGUuc3RhdC5tdGltZTtcbiAgY29uc3QgYWdlRGF5cyA9IGFnZU1zIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuICBpZiAoYWdlRGF5cyA8IDEpIHtcbiAgICBzY29yZSArPSAxMDtcbiAgfSBlbHNlIGlmIChhZ2VEYXlzIDwgNykge1xuICAgIHNjb3JlICs9IDY7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDMwKSB7XG4gICAgc2NvcmUgKz0gMztcbiAgfSBlbHNlIGlmIChhZ2VEYXlzIDwgOTApIHtcbiAgICBzY29yZSArPSAxO1xuICB9XG4gIHJldHVybiBzY29yZTtcbn1cblxuZnVuY3Rpb24gdGl0bGVGb3JGaWxlKGZpbGU6IFRGaWxlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBoZWFkaW5nID0gdGV4dC5tYXRjaCgvXiNcXHMrKC4rKSQvbSk/LlsxXT8udHJpbSgpO1xuICBpZiAoaGVhZGluZykge1xuICAgIHJldHVybiBoZWFkaW5nO1xuICB9XG4gIHJldHVybiBmaWxlLmJhc2VuYW1lIHx8IGZpbGUucGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZS5wYXRoO1xufVxuXG5mdW5jdGlvbiBidWlsZFJlYXNvbihmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nLCBxdWVyeTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgY29uc3QgbG93ZXJQYXRoID0gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGl0bGUgPSB0aXRsZUZvckZpbGUoZmlsZSwgdGV4dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBub3JtYWxpemVkVGV4dCA9IG5vcm1hbGl6ZVBocmFzZSh0ZXh0KTtcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gbm9ybWFsaXplUGhyYXNlKHF1ZXJ5KTtcbiAgY29uc3QgcmVhc29ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBpZiAobm9ybWFsaXplZFF1ZXJ5ICYmIG5vcm1hbGl6ZWRUZXh0LmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICByZWFzb25zLmFkZChcImV4YWN0IHBocmFzZSBtYXRjaFwiKTtcbiAgfVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGlmIChsb3dlclBhdGguaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgcGF0aCBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUaXRsZS5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGB0aXRsZSBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxuKSN7MSw2fVteXFxcXG5dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1gKSkpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBoZWFkaW5nIG1hdGNoZXMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICAgIGlmIChsb3dlclRleHQuaW5jbHVkZXMoYFtbJHt0b2tlbn1gKSB8fCBsb3dlclRleHQuaW5jbHVkZXMoYCR7dG9rZW59XV1gKSkge1xuICAgICAgcmVhc29ucy5hZGQoYGxpbmsgbWVudGlvbnMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICAgIGlmIChsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgKF58XFxcXHMpI1stL19hLXowLTldKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bLS9fYS16MC05XSpgLCBcImlcIikpKSB7XG4gICAgICByZWFzb25zLmFkZChgdGFnIG1hdGNoZXMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICAgIGlmIChsb3dlclRleHQuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgY29udGVudCBtZW50aW9ucyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20ocmVhc29ucykuc2xpY2UoMCwgMykuam9pbihcIiwgXCIpIHx8IFwicmVjZW50IG1hcmtkb3duIG5vdGVcIjtcbn1cblxuZnVuY3Rpb24gYnVpbGRFeGNlcnB0KHRleHQ6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZUxpbmVzID0gdGV4dC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgcmFua2VkID0gc291cmNlTGluZXNcbiAgICAubWFwKChsaW5lLCBpbmRleCkgPT4gKHsgaW5kZXgsIHNjb3JlOiBzY29yZUxpbmUobGluZSwgdG9rZW5zKSB9KSlcbiAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnNjb3JlIC0gbGVmdC5zY29yZSB8fCBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXgpO1xuICBjb25zdCBiZXN0TGluZSA9IHJhbmtlZC5maW5kKChsaW5lKSA9PiBsaW5lLnNjb3JlID4gMCk/LmluZGV4ID8/IDA7XG4gIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgYmVzdExpbmUgLSAyKTtcbiAgY29uc3QgZW5kID0gTWF0aC5taW4oc291cmNlTGluZXMubGVuZ3RoLCBzdGFydCArIE1BWF9TTklQUEVUX0xJTkVTKTtcbiAgY29uc3QgZXhjZXJwdCA9IHNvdXJjZUxpbmVzXG4gICAgLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5qb2luKFwiXFxuXCIpO1xuICByZXR1cm4gZXhjZXJwdC5sZW5ndGggPiBNQVhfRVhDRVJQVF9DSEFSU1xuICAgID8gYCR7ZXhjZXJwdC5zbGljZSgwLCBNQVhfRVhDRVJQVF9DSEFSUyAtIDMpLnRyaW1FbmQoKX0uLi5gXG4gICAgOiBleGNlcnB0O1xufVxuXG5mdW5jdGlvbiBzY29yZUxpbmUobGluZTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3QgbG93ZXIgPSBsaW5lLnRvTG93ZXJDYXNlKCk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChsaW5lLnRyaW0oKS5zdGFydHNXaXRoKFwiI1wiKSkge1xuICAgIHNjb3JlICs9IDQ7XG4gIH1cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAoIWxvd2VyLmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHNjb3JlICs9IDM7XG4gICAgaWYgKGxvd2VyLmluY2x1ZGVzKGBbWyR7dG9rZW59YCkgfHwgbG93ZXIuaW5jbHVkZXMoYCR7dG9rZW59XV1gKSkge1xuICAgICAgc2NvcmUgKz0gMjtcbiAgICB9XG4gICAgaWYgKGxvd2VyLm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJpXCIpKSkge1xuICAgICAgc2NvcmUgKz0gMjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNjb3JlO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVQaHJhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgRmlsZVN5c3RlbUFkYXB0ZXIsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBub3JtYWxpemVQYXRoLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNsYXNzIFZhdWx0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHApIHt9XG5cbiAgYXN5bmMgZW5zdXJlS25vd25Gb2xkZXJzKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZm9sZGVycyA9IG5ldyBTZXQoW1xuICAgICAgc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICBwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSksXG4gICAgXSk7XG5cbiAgICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmb2xkZXJQYXRoKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZ21lbnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlRm9sZGVySWZNaXNzaW5nKGN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmICghKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZm9sZGVyOiAke2N1cnJlbnR9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBpbml0aWFsQ29udGVudCA9IFwiXCIpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZmlsZTogJHtub3JtYWxpemVkfWApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihub3JtYWxpemVkKSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBpbml0aWFsQ29udGVudCk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IGN1cnJlbnQubGVuZ3RoID09PSAwXG4gICAgICA/IFwiXCJcbiAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblxcblwiKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgICAgICAgPyBcIlxcblwiXG4gICAgICAgICAgOiBcIlxcblxcblwiO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgJHtjdXJyZW50fSR7c2VwYXJhdG9yfSR7bm9ybWFsaXplZENvbnRlbnR9YCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbm9ybWFsaXplZENvbnRlbnQpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlVW5pcXVlRmlsZVBhdGgoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBkb3RJbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3RJbmRleCA9PT0gLTEgPyBub3JtYWxpemVkIDogbm9ybWFsaXplZC5zbGljZSgwLCBkb3RJbmRleCk7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZG90SW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoZG90SW5kZXgpO1xuXG4gICAgbGV0IGNvdW50ZXIgPSAyO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2NvdW50ZXJ9JHtleHRlbnNpb259YDtcbiAgICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICAgIGNvdW50ZXIgKz0gMTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsaXN0TWFya2Rvd25GaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICB9XG5cbiAgZ2V0QmFzZVBhdGgoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIgaW5zdGFuY2VvZiBGaWxlU3lzdGVtQWRhcHRlclxuICAgICAgPyB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmdldEJhc2VQYXRoKClcbiAgICAgIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlRm9sZGVySWZNaXNzaW5nKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xuICAgICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50Rm9sZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gIGNvbnN0IGluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIik7XG4gIHJldHVybiBpbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNTYWZlTWFya2Rvd25QYXRoKFxuICBwYXRoOiBzdHJpbmcsXG4gIHNldHRpbmdzPzogUGljazxCcmFpblBsdWdpblNldHRpbmdzLCBcImluc3RydWN0aW9uc0ZpbGVcIj4sXG4pOiBib29sZWFuIHtcbiAgY29uc3Qgc2VnbWVudHMgPSBwYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gIGNvbnN0IGlzU2FmZSA9XG4gICAgQm9vbGVhbihwYXRoKSAmJlxuICAgIHBhdGguZW5kc1dpdGgoXCIubWRcIikgJiZcbiAgICAhcGF0aC5pbmNsdWRlcyhcIi4uXCIpICYmXG4gICAgc2VnbWVudHMuZXZlcnkoKHNlZ21lbnQpID0+ICFzZWdtZW50LnN0YXJ0c1dpdGgoXCIuXCIpKTtcblxuICBpZiAoIWlzU2FmZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncyAmJiBwYXRoID09PSBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaXNTYWZlTWFya2Rvd25QYXRoIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGgtc2FmZXR5XCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCB0eXBlIFZhdWx0V3JpdGVPcGVyYXRpb24gPVxuICB8IHtcbiAgICAgIHR5cGU6IFwiYXBwZW5kXCI7XG4gICAgICBwYXRoOiBzdHJpbmc7XG4gICAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9XG4gIHwge1xuICAgICAgdHlwZTogXCJjcmVhdGVcIjtcbiAgICAgIHBhdGg6IHN0cmluZztcbiAgICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmF1bHRXcml0ZVBsYW4ge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U6IFwibG93XCIgfCBcIm1lZGl1bVwiIHwgXCJoaWdoXCI7XG4gIG9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcXVlc3Rpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0V3JpdGVTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBub3JtYWxpemVQbGFuKHBsYW46IFBhcnRpYWw8VmF1bHRXcml0ZVBsYW4+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBWYXVsdFdyaXRlUGxhbiB7XG4gICAgY29uc3QgY29uZmlkZW5jZSA9IHJlYWRDb25maWRlbmNlKHBsYW4uY29uZmlkZW5jZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1bW1hcnk6IHR5cGVvZiBwbGFuLnN1bW1hcnkgPT09IFwic3RyaW5nXCIgJiYgcGxhbi5zdW1tYXJ5LnRyaW0oKVxuICAgICAgICA/IHBsYW4uc3VtbWFyeS50cmltKClcbiAgICAgICAgOiBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IHVwZGF0ZXMuXCIsXG4gICAgICBjb25maWRlbmNlLFxuICAgICAgb3BlcmF0aW9uczogKEFycmF5LmlzQXJyYXkocGxhbi5vcGVyYXRpb25zKSA/IHBsYW4ub3BlcmF0aW9ucyA6IFtdKVxuICAgICAgICAubWFwKChvcGVyYXRpb24pID0+IHRoaXMubm9ybWFsaXplT3BlcmF0aW9uKG9wZXJhdGlvbikpXG4gICAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbik6IG9wZXJhdGlvbiBpcyBWYXVsdFdyaXRlT3BlcmF0aW9uID0+IG9wZXJhdGlvbiAhPT0gbnVsbClcbiAgICAgICAgLnNsaWNlKDAsIDgpLFxuICAgICAgcXVlc3Rpb25zOiAoQXJyYXkuaXNBcnJheShwbGFuLnF1ZXN0aW9ucykgPyBwbGFuLnF1ZXN0aW9ucyA6IFtdKVxuICAgICAgICAubWFwKChxdWVzdGlvbikgPT4gU3RyaW5nKHF1ZXN0aW9uKS50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLnNsaWNlKDAsIDUpLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBseVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBwYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG9wZXJhdGlvbiBvZiBwbGFuLm9wZXJhdGlvbnMpIHtcbiAgICAgIGlmICghaXNTYWZlTWFya2Rvd25QYXRoKG9wZXJhdGlvbi5wYXRoLCBzZXR0aW5ncykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiYXBwZW5kXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChvcGVyYXRpb24ucGF0aCwgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgICAgICBwYXRocy5wdXNoKG9wZXJhdGlvbi5wYXRoKTtcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiY3JlYXRlXCIpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKG9wZXJhdGlvbi5wYXRoKTtcbiAgICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgICAgICBwYXRocy5wdXNoKHBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KHBhdGhzKSk7XG4gIH1cblxuICBwcml2YXRlIG5vcm1hbGl6ZU9wZXJhdGlvbihvcGVyYXRpb246IHVua25vd24pOiBWYXVsdFdyaXRlT3BlcmF0aW9uIHwgbnVsbCB7XG4gICAgaWYgKCFvcGVyYXRpb24gfHwgdHlwZW9mIG9wZXJhdGlvbiAhPT0gXCJvYmplY3RcIiB8fCAhKFwidHlwZVwiIGluIG9wZXJhdGlvbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IG9wZXJhdGlvbiBhcyBQYXJ0aWFsPFZhdWx0V3JpdGVPcGVyYXRpb24+O1xuICAgIGNvbnN0IGNvbnRlbnQgPSBcImNvbnRlbnRcIiBpbiBjYW5kaWRhdGUgPyBTdHJpbmcoY2FuZGlkYXRlLmNvbnRlbnQgPz8gXCJcIikudHJpbSgpIDogXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChjYW5kaWRhdGUudHlwZSAhPT0gXCJhcHBlbmRcIiAmJiBjYW5kaWRhdGUudHlwZSAhPT0gXCJjcmVhdGVcIikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IFwicGF0aFwiIGluIGNhbmRpZGF0ZVxuICAgICAgPyBub3JtYWxpemVNYXJrZG93blBhdGgoU3RyaW5nKGNhbmRpZGF0ZS5wYXRoID8/IFwiXCIpKVxuICAgICAgOiBcIlwiO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgaWYgKCFpc1NhZmVNYXJrZG93blBhdGgocGF0aCwgc2V0dGluZ3MpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogY2FuZGlkYXRlLnR5cGUsXG4gICAgICBwYXRoLFxuICAgICAgY29udGVudCxcbiAgICAgIGRlc2NyaXB0aW9uOiByZWFkRGVzY3JpcHRpb24oY2FuZGlkYXRlKSxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWREZXNjcmlwdGlvbihvcGVyYXRpb246IFBhcnRpYWw8VmF1bHRXcml0ZU9wZXJhdGlvbj4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdHlwZW9mIG9wZXJhdGlvbi5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgPyBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb25maWRlbmNlKHZhbHVlOiB1bmtub3duKTogVmF1bHRXcml0ZVBsYW5bXCJjb25maWRlbmNlXCJdIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcImxvd1wiIHx8IHZhbHVlID09PSBcIm1lZGl1bVwiIHx8IHZhbHVlID09PSBcImhpZ2hcIiA/IHZhbHVlIDogXCJtZWRpdW1cIjtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWFya2Rvd25QYXRoKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL1xcLysvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL15cXC8rLywgXCJcIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBJdGVtVmlldywgTWFya2Rvd25SZW5kZXJlciwgVEZpbGUsIFdvcmtzcGFjZUxlYWYsIHNldEljb24gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgVmF1bHRDaGF0UmVzcG9uc2UsIENoYXRFeGNoYW5nZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2VcIjtcbmltcG9ydCB0eXBlIHsgVmF1bHRRdWVyeU1hdGNoIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0UGxhbk1vZGFsIH0gZnJvbSBcIi4vdmF1bHQtcGxhbi1tb2RhbFwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7XG4gIENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSxcbiAgREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuICBDb2RleE1vZGVsT3B0aW9uLFxuICBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSxcbiAgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMsXG4gIGlzS25vd25Db2RleE1vZGVsLFxufSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtbW9kZWxzXCI7XG5cbmludGVyZmFjZSBBcHBXaXRoU2V0dGluZ3MgZXh0ZW5kcyBBcHAge1xuICBzZXR0aW5nPzoge1xuICAgIG9wZW4oKTogdm9pZDtcbiAgICBvcGVuVGFiQnlJZChpZDogc3RyaW5nKTogdm9pZDtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENoYXRUdXJuIHtcbiAgcm9sZTogXCJ1c2VyXCIgfCBcImJyYWluXCI7XG4gIHRleHQ6IHN0cmluZztcbiAgc291cmNlcz86IFZhdWx0UXVlcnlNYXRjaFtdO1xuICB1cGRhdGVkUGF0aHM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNvbnN0IEJSQUlOX1ZJRVdfVFlQRSA9IFwiYnJhaW4tc2lkZWJhci12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpblNpZGViYXJWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBwcml2YXRlIG1lc3NhZ2VzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIG1vZGVsUm93RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzZW5kQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBzdG9wQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBjbGVhckJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zOiBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXJyZW50QWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nU3RhcnRlZEF0ID0gMDtcbiAgcHJpdmF0ZSBsb2FkaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxvYWRpbmdUZXh0ID0gXCJcIjtcbiAgcHJpdmF0ZSBsb2FkaW5nVGV4dEVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlbmRlckdlbmVyYXRpb24gPSAwO1xuICBwcml2YXRlIHJlc2l6ZUZyYW1lSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHR1cm5zOiBDaGF0VHVybltdID0gW107XG4gIHByaXZhdGUgdXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzY3JvbGxUb0JvdHRvbUVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQlJBSU5fVklFV19UWVBFO1xuICB9XG5cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJCcmFpblwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImJyYWluXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLXNpZGViYXJcIik7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1oZWFkZXJcIiB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW5cIiB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQXNrIHlvdXIgdmF1bHQsIG9yIHRlbGwgQnJhaW4gd2hhdCB0byBmaWxlLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5tb2RlbFJvd0VsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbW9kZWwtcm93XCIgfSk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcblxuICAgIGNvbnN0IG1lc3NhZ2VzQ29udGFpbmVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbWVzc2FnZXMtY29udGFpbmVyXCIgfSk7XG4gICAgdGhpcy5tZXNzYWdlc0VsID0gbWVzc2FnZXNDb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNoYXQtbWVzc2FnZXNcIixcbiAgICAgIGF0dHI6IHsgXCJhcmlhLWxpdmVcIjogXCJwb2xpdGVcIiwgXCJhcmlhLWF0b21pY1wiOiBcImZhbHNlXCIgfSxcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VzRWwuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnVzZXJTY3JvbGxlZFVwID0gIXRoaXMuaXNOZWFyQm90dG9tKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG4gICAgfSk7XG4gICAgaWYgKHRoaXMudHVybnMubGVuZ3RoID4gMCkge1xuICAgICAgdm9pZCB0aGlzLnJlbmRlck1lc3NhZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgIH1cblxuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbCA9IG1lc3NhZ2VzQ29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zY3JvbGwtdG8tYm90dG9tXCIsXG4gICAgICBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlNjcm9sbCB0byBib3R0b21cIiB9LFxuICAgIH0pO1xuICAgIHNldEljb24odGhpcy5zY3JvbGxUb0JvdHRvbUVsLCBcImFycm93LWRvd25cIik7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnVzZXJTY3JvbGxlZFVwID0gZmFsc2U7XG4gICAgICB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsVG8oeyB0b3A6IHRoaXMubWVzc2FnZXNFbC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiBcInNtb290aFwiIH0pO1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgIH0pO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcblxuICAgIGNvbnN0IGNvbXBvc2VyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY29tcG9zZXJcIiB9KTtcbiAgICB0aGlzLmlucHV0RWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhYm91dCB5b3VyIHZhdWx0LCBvciBwYXN0ZSByb3VnaCBub3RlcyBmb3IgQnJhaW4gdG8gZmlsZS4uLlwiLFxuICAgICAgICByb3dzOiBcIjZcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29tcG9zZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnB1dEVsKTtcbiAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zZW5kTWVzc2FnZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVDb21wb3NlclN0YXRlKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBleGFtcGxlcyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXByb21wdC1jaGlwc1wiIH0pO1xuICAgIHRoaXMuY3JlYXRlUHJvbXB0Q2hpcChleGFtcGxlcywgXCJXaGF0IGRvIEkga25vdyBhYm91dC4uLlwiLCBcIldoYXQgZG8gSSBrbm93IGFib3V0IFwiKTtcbiAgICB0aGlzLmNyZWF0ZVByb21wdENoaXAoZXhhbXBsZXMsIFwiRmlsZSB0aGlzXCIsIFwiRmlsZSB0aGlzIGluIHRoZSByaWdodCBwbGFjZTpcXG5cXG5cIik7XG4gICAgdGhpcy5jcmVhdGVQcm9tcHRDaGlwKGV4YW1wbGVzLCBcIkZpbmQgcmVsYXRlZCBub3Rlc1wiLCBcIkZpbmQgcmVsYXRlZCBub3RlcyBmb3IgXCIpO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWFjdGlvbi1yb3dcIiB9KTtcbiAgICB0aGlzLnNlbmRCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJTZW5kXCIsXG4gICAgfSk7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zZW5kTWVzc2FnZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1zdG9wXCIsXG4gICAgICB0ZXh0OiBcIlN0b3BcIixcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zdG9wQ3VycmVudFJlcXVlc3QoKTtcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5kaXNhYmxlZCA9IHRydWU7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkluc3RydWN0aW9uc1wiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5JbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNsZWFyXCIsXG4gICAgfSk7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnR1cm5zID0gW107XG4gICAgICB2b2lkIHRoaXMucmVuZGVyTWVzc2FnZXMoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3RhdHVzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXN0YXR1c1wiIH0pO1xuICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgaWYgKHRoaXMucmVzaXplRnJhbWVJZCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yZXNpemVGcmFtZUlkKTtcbiAgICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnN0YXR1c0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzRWwuZW1wdHkoKTtcbiAgICBsZXQgYWlDb25maWd1cmVkID0gZmFsc2U7XG4gICAgbGV0IHN0YXR1c1RleHQgPSBcIkNvdWxkIG5vdCBjaGVjayBDb2RleFwiO1xuICAgIGxldCBidXR0b25UZXh0ID0gXCJDb25uZWN0XCI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIGFpQ29uZmlndXJlZCA9IGFpU3RhdHVzLmNvbmZpZ3VyZWQ7XG4gICAgICBzdGF0dXNUZXh0ID0gZm9ybWF0UHJvdmlkZXJTdGF0dXMoYWlTdGF0dXMpO1xuICAgICAgYnV0dG9uVGV4dCA9IGFpQ29uZmlndXJlZCA/IFwiTWFuYWdlXCIgOiBcIkNvbm5lY3RcIjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kaWNhdG9yID0gdGhpcy5zdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBgYnJhaW4tc3RhdHVzLWluZGljYXRvciAke2FpQ29uZmlndXJlZCA/IFwiYnJhaW4tc3RhdHVzLWluZGljYXRvci0tb2tcIiA6IFwiYnJhaW4tc3RhdHVzLWluZGljYXRvci0td2FyblwifWAsXG4gICAgfSk7XG4gICAgaW5kaWNhdG9yLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgICB0aGlzLnN0YXR1c0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGBBSTogJHtzdGF0dXNUZXh0fSBgIH0pO1xuICAgIHRoaXMuc3RhdHVzRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgIHRleHQ6IGJ1dHRvblRleHQsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGFwcCA9IHRoaXMuYXBwIGFzIEFwcFdpdGhTZXR0aW5ncztcbiAgICAgIGlmICghYXBwLnNldHRpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXBwLnNldHRpbmcub3BlbigpO1xuICAgICAgYXBwLnNldHRpbmcub3BlblRhYkJ5SWQodGhpcy5wbHVnaW4ubWFuaWZlc3QuaWQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZW5kTWVzc2FnZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1lc3NhZ2UgfHwgdGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICAgIHRoaXMudXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgICB0aGlzLmFkZFR1cm4oXCJ1c2VyXCIsIG1lc3NhZ2UpO1xuICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSB0aGlzLmJ1aWxkQ2hhdEhpc3RvcnkoKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wbHVnaW4uY2hhdFdpdGhWYXVsdChtZXNzYWdlLCBoaXN0b3J5LCBjb250cm9sbGVyLnNpZ25hbCk7XG4gICAgICB0aGlzLnJlbmRlclJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGlzU3RvcHBlZFJlcXVlc3QoZXJyb3IpKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnRFbC5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgIHRoaXMuYWRkVHVybihcImJyYWluXCIsIFwiQ29kZXggcmVxdWVzdCBzdG9wcGVkLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjaGF0IHdpdGggdGhlIHZhdWx0XCIpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ2hhdEhpc3RvcnkoKTogQ2hhdEV4Y2hhbmdlW10ge1xuICAgIC8vIEV4Y2x1ZGUgdGhlIGxhc3QgdHVybiwgd2hpY2ggaXMgdGhlIGN1cnJlbnQgdXNlciBtZXNzYWdlIGJlaW5nIHNlbnQuXG4gICAgcmV0dXJuIHRoaXMudHVybnNcbiAgICAgIC5zbGljZSgwLCAtMSlcbiAgICAgIC5maWx0ZXIoKHR1cm4pOiB0dXJuIGlzIENoYXRUdXJuICYgeyB0ZXh0OiBzdHJpbmcgfSA9PiBCb29sZWFuKHR1cm4udGV4dCkpXG4gICAgICAubWFwKCh0dXJuKSA9PiAoe1xuICAgICAgICByb2xlOiB0dXJuLnJvbGUsXG4gICAgICAgIHRleHQ6IHR1cm4udGV4dCxcbiAgICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcEN1cnJlbnRSZXF1ZXN0KCk6IHZvaWQge1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlcj8uYWJvcnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUHJvbXB0Q2hpcChjb250YWluZXI6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nLCBwcm9tcHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tcHJvbXB0LWNoaXBcIixcbiAgICAgIHRleHQ6IGxhYmVsLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBwcm9tcHQ7XG4gICAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgICAgIHRoaXMuaW5wdXRFbC5mb2N1cygpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RlbFNlbGVjdG9yKCk6IHZvaWQge1xuICAgIHRoaXMubW9kZWxSb3dFbC5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWxhYmVsXCIsXG4gICAgICB0ZXh0OiBcIk1vZGVsXCIsXG4gICAgfSk7XG4gICAgaWYgKHRoaXMubW9kZWxPcHRpb25zTG9hZGluZykge1xuICAgICAgdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RlbC1hY3RpdmVcIixcbiAgICAgICAgdGV4dDogXCJMb2FkaW5nIENvZGV4IG1vZGVscy4uLlwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdCA9IHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNlbGVjdFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtc2VsZWN0XCIsXG4gICAgfSk7XG4gICAgc2VsZWN0LmRpc2FibGVkID0gdGhpcy5pc0xvYWRpbmc7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgdGhpcy5tb2RlbE9wdGlvbnMpIHtcbiAgICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICAgIHZhbHVlOiBvcHRpb24udmFsdWUsXG4gICAgICAgIHRleHQ6IG9wdGlvbi5sYWJlbCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdmFsdWU6IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSxcbiAgICAgIHRleHQ6IFwiQ3VzdG9tLi4uXCIsXG4gICAgfSk7XG4gICAgc2VsZWN0LnZhbHVlID0gdGhpcy5jdXN0b21Nb2RlbERyYWZ0XG4gICAgICA/IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRVxuICAgICAgOiBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucyk7XG4gICAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmhhbmRsZU1vZGVsU2VsZWN0aW9uKHNlbGVjdC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoc2VsZWN0LnZhbHVlID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUpIHtcbiAgICAgIGlmICh0aGlzLmN1c3RvbU1vZGVsRHJhZnQgJiYgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgICAgdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWFjdGl2ZVwiLFxuICAgICAgICAgIHRleHQ6IGBBY3RpdmU6ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCl9YCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBpbnB1dCA9IHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWN1c3RvbVwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgICAgcGxhY2Vob2xkZXI6IFwiQ29kZXggbW9kZWwgaWRcIixcbiAgICAgICAgfSxcbiAgICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBpbnB1dC5kaXNhYmxlZCA9IHRoaXMuaXNMb2FkaW5nO1xuICAgICAgaW5wdXQudmFsdWUgPSB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHwgaXNLbm93bkNvZGV4TW9kZWwodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWw7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQ3VzdG9tTW9kZWwoaW5wdXQudmFsdWUpO1xuICAgICAgfSk7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9ucyA9IGF3YWl0IGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVNb2RlbFNlbGVjdGlvbih2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHZhbHVlID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUpIHtcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IHRydWU7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IHZhbHVlO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQ3VzdG9tTW9kZWwodmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1vZGVsID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICghbW9kZWwpIHtcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSBtb2RlbDtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUmVzcG9uc2UocmVzcG9uc2U6IFZhdWx0Q2hhdFJlc3BvbnNlKTogdm9pZCB7XG4gICAgdGhpcy5hZGRUdXJuKFwiYnJhaW5cIiwgcmVzcG9uc2UuYW5zd2VyLnRyaW0oKSwgcmVzcG9uc2Uuc291cmNlcyk7XG5cbiAgICBpZiAocmVzcG9uc2UucGxhbiAmJiByZXNwb25zZS5wbGFuLm9wZXJhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgbmV3IFZhdWx0UGxhbk1vZGFsKHRoaXMuYXBwLCB7XG4gICAgICAgIHBsYW46IHJlc3BvbnNlLnBsYW4sXG4gICAgICAgIHNldHRpbmdzOiB0aGlzLnBsdWdpbi5zZXR0aW5ncyxcbiAgICAgICAgb25BcHByb3ZlOiBhc3luYyAocGxhbikgPT4gdGhpcy5wbHVnaW4uYXBwbHlWYXVsdFdyaXRlUGxhbihwbGFuKSxcbiAgICAgICAgb25Db21wbGV0ZTogYXN5bmMgKG1lc3NhZ2UsIHBhdGhzKSA9PiB7XG4gICAgICAgICAgdGhpcy5hZGRVcGRhdGVkRmlsZVR1cm4obWVzc2FnZSwgcGF0aHMpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICAgICAgICB9LFxuICAgICAgfSkub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0TG9hZGluZyhsb2FkaW5nOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSBsb2FkaW5nO1xuICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICB0aGlzLmxvYWRpbmdTdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgdGhpcy51cGRhdGVMb2FkaW5nVGV4dCgpO1xuICAgICAgdGhpcy5zdGFydExvYWRpbmdUaW1lcigpO1xuICAgICAgdGhpcy5hcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcExvYWRpbmdUaW1lcigpO1xuICAgICAgdGhpcy5sb2FkaW5nVGV4dCA9IFwiXCI7XG4gICAgICB0aGlzLnJlbW92ZUxvYWRpbmdJbmRpY2F0b3IoKTtcbiAgICB9XG4gICAgdGhpcy5pbnB1dEVsLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB0aGlzLmNsZWFyQnV0dG9uRWwuZGlzYWJsZWQgPSBsb2FkaW5nO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmRpc2FibGVkID0gIWxvYWRpbmc7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwuZGlzYWJsZWQgPSBsb2FkaW5nIHx8ICF0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDb21wb3NlclN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgaWYgKHRoaXMuc2VuZEJ1dHRvbkVsKSB7XG4gICAgICB0aGlzLnNlbmRCdXR0b25FbC5kaXNhYmxlZCA9IHRoaXMuaXNMb2FkaW5nIHx8ICF0aGlzLmlucHV0RWwudmFsdWUudHJpbSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXV0b1Jlc2l6ZUlucHV0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJlc2l6ZUZyYW1lSWQgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmVzaXplRnJhbWVJZCk7XG4gICAgfVxuICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlc2l6ZUZyYW1lSWQgPSBudWxsO1xuICAgICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IFwiYXV0b1wiO1xuICAgICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRoaXMuaW5wdXRFbC5zY3JvbGxIZWlnaHQsIDI0MCl9cHhgO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUdXJuKHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiLCB0ZXh0OiBzdHJpbmcsIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHZvaWQge1xuICAgIGNvbnN0IHR1cm46IENoYXRUdXJuID0geyByb2xlLCB0ZXh0LCBzb3VyY2VzIH07XG4gICAgdGhpcy50dXJucy5wdXNoKHR1cm4pO1xuICAgIHZvaWQgdGhpcy5hcHBlbmRUdXJuRWxlbWVudCh0dXJuKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkVXBkYXRlZEZpbGVUdXJuKG1lc3NhZ2U6IHN0cmluZywgcGF0aHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgY29uc3QgdHVybjogQ2hhdFR1cm4gPSB7XG4gICAgICByb2xlOiBcImJyYWluXCIsXG4gICAgICB0ZXh0OiBtZXNzYWdlLFxuICAgICAgdXBkYXRlZFBhdGhzOiBwYXRocyxcbiAgICB9O1xuICAgIHRoaXMudHVybnMucHVzaCh0dXJuKTtcbiAgICB2b2lkIHRoaXMuYXBwZW5kVHVybkVsZW1lbnQodHVybik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFR1cm5FbGVtZW50KHR1cm46IENoYXRUdXJuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuXG4gICAgY29uc3QgZW1wdHlFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtZW1wdHlcIik7XG4gICAgaWYgKGVtcHR5RWwpIHtcbiAgICAgIGVtcHR5RWwucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogYGJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtJHt0dXJuLnJvbGV9YCxcbiAgICB9KTtcbiAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBzZXRJY29uKHJvbGVJY29uLCB0dXJuLnJvbGUgPT09IFwidXNlclwiID8gXCJ1c2VyXCIgOiBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IHR1cm4ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIllvdVwiIDogXCJCcmFpblwiIH0pO1xuXG4gICAgY29uc3Qgb3V0cHV0ID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1vdXRwdXRcIiB9KTtcbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IE1hcmtkb3duUmVuZGVyZXIucmVuZGVyKHRoaXMuYXBwLCB0dXJuLnRleHQsIG91dHB1dCwgXCJcIiwgdGhpcyk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5hZGRDb3B5QnV0dG9ucyhvdXRwdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyU291cmNlcyhpdGVtLCB0dXJuLnNvdXJjZXMpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJVcGRhdGVkRmlsZXMoaXRlbSwgdHVybi51cGRhdGVkUGF0aHMpO1xuICAgIH1cblxuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VzRWwucXVlcnlTZWxlY3RvcihcIi5icmFpbi1jaGF0LW1lc3NhZ2UtbG9hZGluZ1wiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLWJyYWluIGJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgcm9sZUVsID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXJvbGVcIiB9KTtcbiAgICBjb25zdCByb2xlSWNvbiA9IHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgc2V0SWNvbihyb2xlSWNvbiwgXCJicmFpbi1jaXJjdWl0XCIpO1xuICAgIHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG5cbiAgICBjb25zdCBsb2FkaW5nID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nXCIgfSk7XG4gICAgY29uc3QgZG90cyA9IGxvYWRpbmcuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbG9hZGluZy1kb3RzXCIgfSk7XG4gICAgZG90cy5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgZG90cy5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgZG90cy5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbG9hZGluZy5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgdGV4dDogdGhpcy5sb2FkaW5nVGV4dCB8fCBcIlJlYWRpbmcgdmF1bHQgY29udGV4dCBhbmQgYXNraW5nIENvZGV4Li4uXCIsXG4gICAgfSk7XG4gICAgdGhpcy5tYXliZVNjcm9sbFRvQm90dG9tKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZUxvYWRpbmdJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgY29uc3QgbG9hZGluZ0VsID0gdGhpcy5tZXNzYWdlc0VsLnF1ZXJ5U2VsZWN0b3IoXCIuYnJhaW4tY2hhdC1tZXNzYWdlLWxvYWRpbmdcIik7XG4gICAgaWYgKGxvYWRpbmdFbCkge1xuICAgICAgbG9hZGluZ0VsLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLmxvYWRpbmdUZXh0RWwgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNZXNzYWdlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBnZW5lcmF0aW9uID0gKyt0aGlzLnJlbmRlckdlbmVyYXRpb247XG4gICAgdGhpcy5tZXNzYWdlc0VsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnR1cm5zLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJFbXB0eVN0YXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29uc3QgdHVybiBvZiB0aGlzLnR1cm5zKSB7XG4gICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZW5kZXJHZW5lcmF0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IGBicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLSR7dHVybi5yb2xlfWAsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHJvbGVFbCA9IGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1yb2xlXCIgfSk7XG4gICAgICBjb25zdCByb2xlSWNvbiA9IHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgICBzZXRJY29uKHJvbGVJY29uLCB0dXJuLnJvbGUgPT09IFwidXNlclwiID8gXCJ1c2VyXCIgOiBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgICByb2xlRWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogdHVybi5yb2xlID09PSBcInVzZXJcIiA/IFwiWW91XCIgOiBcIkJyYWluXCIgfSk7XG5cbiAgICAgIGNvbnN0IG91dHB1dCA9IGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tb3V0cHV0XCIgfSk7XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBNYXJrZG93blJlbmRlcmVyLnJlbmRlcih0aGlzLmFwcCwgdHVybi50ZXh0LCBvdXRwdXQsIFwiXCIsIHRoaXMpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRDb3B5QnV0dG9ucyhvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIiAmJiB0dXJuLnNvdXJjZXM/Lmxlbmd0aCkge1xuICAgICAgICB0aGlzLnJlbmRlclNvdXJjZXMoaXRlbSwgdHVybi5zb3VyY2VzKTtcbiAgICAgIH1cbiAgICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIiAmJiB0dXJuLnVwZGF0ZWRQYXRocz8ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyVXBkYXRlZEZpbGVzKGl0ZW0sIHR1cm4udXBkYXRlZFBhdGhzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICB0aGlzLmFwcGVuZExvYWRpbmdJbmRpY2F0b3IoKTtcbiAgICB9XG4gICAgdGhpcy5tYXliZVNjcm9sbFRvQm90dG9tKCk7XG4gIH1cblxuICBwcml2YXRlIHN0YXJ0TG9hZGluZ1RpbWVyKCk6IHZvaWQge1xuICAgIHRoaXMuc3RvcExvYWRpbmdUaW1lcigpO1xuICAgIHRoaXMubG9hZGluZ1RpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMudXBkYXRlTG9hZGluZ1RleHQoKTtcbiAgICB9LCAxMDAwKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcExvYWRpbmdUaW1lcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5sb2FkaW5nVGltZXIgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMubG9hZGluZ1RpbWVyKTtcbiAgICAgIHRoaXMubG9hZGluZ1RpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUxvYWRpbmdUZXh0KCk6IHZvaWQge1xuICAgIGNvbnN0IHNlY29uZHMgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gdGhpcy5sb2FkaW5nU3RhcnRlZEF0KSAvIDEwMDApKTtcbiAgICBjb25zdCByZW1haW5pbmcgPSBNYXRoLm1heCgwLCAxMjAgLSBzZWNvbmRzKTtcbiAgICB0aGlzLmxvYWRpbmdUZXh0ID0gYCR7c2Vjb25kc31zIGVsYXBzZWQsIHRpbWVvdXQgaW4gJHtyZW1haW5pbmd9c2A7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RleHRFbCkge1xuICAgICAgdGhpcy5sb2FkaW5nVGV4dEVsLnNldFRleHQodGhpcy5sb2FkaW5nVGV4dCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFbXB0eVN0YXRlKCk6IHZvaWQge1xuICAgIGNvbnN0IGVtcHR5ID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtZW1wdHlcIiB9KTtcbiAgICBjb25zdCBpY29uID0gZW1wdHkuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1lbXB0eS1pY29uXCIgfSk7XG4gICAgc2V0SWNvbihpY29uLCBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgZW1wdHkuY3JlYXRlRWwoXCJzdHJvbmdcIiwgeyB0ZXh0OiBcIlN0YXJ0IHdpdGggYSBxdWVzdGlvbiBvciByb3VnaCBjYXB0dXJlXCIgfSk7XG4gICAgZW1wdHkuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIHRleHQ6IFwiQnJhaW4gcmV0cmlldmVzIHZhdWx0IGNvbnRleHQsIGFuc3dlcnMgd2l0aCBzb3VyY2VzLCBhbmQgcHJldmlld3Mgd3JpdGVzIGJlZm9yZSBhbnl0aGluZyBjaGFuZ2VzLlwiLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTb3VyY2VzKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdKTogdm9pZCB7XG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRldGFpbHNcIiwgeyBjbHM6IFwiYnJhaW4tc291cmNlc1wiIH0pO1xuICAgIGRldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsIHtcbiAgICAgIHRleHQ6IGBTb3VyY2VzICgke01hdGgubWluKHNvdXJjZXMubGVuZ3RoLCA4KX0pYCxcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2VzLnNsaWNlKDAsIDgpKSB7XG4gICAgICBjb25zdCBzb3VyY2VFbCA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc291cmNlXCIgfSk7XG4gICAgICBjb25zdCB0aXRsZSA9IHNvdXJjZUVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS10aXRsZVwiLFxuICAgICAgICB0ZXh0OiBzb3VyY2UucGF0aCxcbiAgICAgIH0pO1xuICAgICAgdGl0bGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLm9wZW5Tb3VyY2Uoc291cmNlLnBhdGgpO1xuICAgICAgfSk7XG4gICAgICBzb3VyY2VFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtcmVhc29uXCIsXG4gICAgICAgIHRleHQ6IHNvdXJjZS5yZWFzb24sXG4gICAgICB9KTtcbiAgICAgIGlmIChzb3VyY2UuZXhjZXJwdCkge1xuICAgICAgICBzb3VyY2VFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1leGNlcnB0XCIsXG4gICAgICAgICAgdGV4dDogc291cmNlLmV4Y2VycHQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVXBkYXRlZEZpbGVzKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHBhdGhzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGNvbnN0IGZpbGVzID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXVwZGF0ZWQtZmlsZXNcIiB9KTtcbiAgICBmaWxlcy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXJlYXNvblwiLFxuICAgICAgdGV4dDogXCJVcGRhdGVkIGZpbGVzXCIsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHBhdGhzKSB7XG4gICAgICBjb25zdCBidXR0b24gPSBmaWxlcy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtdGl0bGVcIixcbiAgICAgICAgdGV4dDogcGF0aCxcbiAgICAgIH0pO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuU291cmNlKHBhdGgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc05lYXJCb3R0b20odGhyZXNob2xkID0gNjApOiBib29sZWFuIHtcbiAgICBjb25zdCBlbCA9IHRoaXMubWVzc2FnZXNFbDtcbiAgICByZXR1cm4gZWwuc2Nyb2xsSGVpZ2h0IC0gZWwuc2Nyb2xsVG9wIC0gZWwuY2xpZW50SGVpZ2h0IDwgdGhyZXNob2xkO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXliZVNjcm9sbFRvQm90dG9tKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnVzZXJTY3JvbGxlZFVwKSB7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZXNFbC5zY3JvbGxUbyh7IHRvcDogdGhpcy5tZXNzYWdlc0VsLnNjcm9sbEhlaWdodCwgYmVoYXZpb3I6IFwic21vb3RoXCIgfSk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2Nyb2xsVG9Cb3R0b21FbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzaG93ID0gdGhpcy51c2VyU2Nyb2xsZWRVcCAmJiB0aGlzLnR1cm5zLmxlbmd0aCA+IDA7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbUVsLnRvZ2dsZUNsYXNzKFwiYnJhaW4tc2Nyb2xsLXRvLWJvdHRvbS0tdmlzaWJsZVwiLCBzaG93KTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQ29weUJ1dHRvbnMoY29udGFpbmVyOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvZGVCbG9ja3MgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcInByZVwiKTtcbiAgICBmb3IgKGNvbnN0IHByZSBvZiBBcnJheS5mcm9tKGNvZGVCbG9ja3MpKSB7XG4gICAgICBjb25zdCBjb2RlID0gcHJlLnF1ZXJ5U2VsZWN0b3IoXCJjb2RlXCIpO1xuICAgICAgaWYgKCFjb2RlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIGJ1dHRvbi5jbGFzc05hbWUgPSBcImJyYWluLWNvcHktY29kZS1idXR0b25cIjtcbiAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQ29weVwiO1xuICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgXCJDb3B5IGNvZGVcIik7XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChjb2RlLnRleHRDb250ZW50IHx8IFwiXCIpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQ29waWVkIVwiO1xuICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiY29waWVkXCIpO1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQ29weVwiO1xuICAgICAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJjb3BpZWRcIik7XG4gICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQ29weVwiO1xuICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcHJlLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuU291cmNlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmaWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb3JtYXRQcm92aWRlclN0YXR1cyhzdGF0dXM6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzPj4pOiBzdHJpbmcge1xuICBpZiAoIXN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgcmV0dXJuIHN0YXR1cy5tZXNzYWdlLnJlcGxhY2UoL1xcLiQvLCBcIlwiKTtcbiAgfVxuICBjb25zdCBtb2RlbCA9IHN0YXR1cy5tb2RlbCA/IGAgKCR7c3RhdHVzLm1vZGVsfSlgIDogXCJcIjtcbiAgcmV0dXJuIGBDb2RleCR7bW9kZWx9YDtcbn1cblxuZnVuY3Rpb24gaXNTdG9wcGVkUmVxdWVzdChlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIjtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHR5cGUgeyBWYXVsdFdyaXRlT3BlcmF0aW9uLCBWYXVsdFdyaXRlUGxhbiB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc1NhZmVNYXJrZG93blBhdGggfSBmcm9tIFwiLi4vdXRpbHMvcGF0aC1zYWZldHlcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBWYXVsdFBsYW5Nb2RhbE9wdGlvbnMge1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbjtcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIG9uQXBwcm92ZTogKHBsYW46IFZhdWx0V3JpdGVQbGFuKSA9PiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZywgcGF0aHM6IHN0cmluZ1tdKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0UGxhbk1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzZWxlY3RlZE9wZXJhdGlvbnMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkcmFmdE9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcHJpdmF0ZSBhcHByb3ZlQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBjYW5jZWxCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogVmF1bHRQbGFuTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zID0gb3B0aW9ucy5wbGFuLm9wZXJhdGlvbnMubWFwKChvcGVyYXRpb24pID0+ICh7IC4uLm9wZXJhdGlvbiB9KSk7XG4gICAgdGhpcy5kcmFmdE9wZXJhdGlvbnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCkpO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN1cGVyLmNsb3NlKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUmV2aWV3IFZhdWx0IENoYW5nZXNcIiB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYCR7dGhpcy5vcHRpb25zLnBsYW4uc3VtbWFyeSB8fCBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IGNoYW5nZXMuXCJ9IENvbmZpZGVuY2U6ICR7dGhpcy5vcHRpb25zLnBsYW4uY29uZmlkZW5jZX0uYCxcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgW2luZGV4LCBvcGVyYXRpb25dIG9mIHRoaXMuZHJhZnRPcGVyYXRpb25zLmVudHJpZXMoKSkge1xuICAgICAgdGhpcy5yZW5kZXJPcGVyYXRpb24oaW5kZXgsIG9wZXJhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wbGFuLnF1ZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXBsYW4tcXVlc3Rpb25zXCIgfSk7XG4gICAgICBxdWVzdGlvbnMuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiT3BlbiBRdWVzdGlvbnNcIiB9KTtcbiAgICAgIGNvbnN0IGxpc3QgPSBxdWVzdGlvbnMuY3JlYXRlRWwoXCJ1bFwiKTtcbiAgICAgIGZvciAoY29uc3QgcXVlc3Rpb24gb2YgdGhpcy5vcHRpb25zLnBsYW4ucXVlc3Rpb25zKSB7XG4gICAgICAgIGxpc3QuY3JlYXRlRWwoXCJsaVwiLCB7IHRleHQ6IHF1ZXN0aW9uIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwgPSBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiQXBwcm92ZSBhbmQgV3JpdGVcIixcbiAgICB9KTtcbiAgICB0aGlzLmFwcHJvdmVCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmFwcHJvdmUoKTtcbiAgICB9KTtcbiAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNhbmNlbFwiLFxuICAgIH0pO1xuICAgIHRoaXMuY2FuY2VsQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9wZXJhdGlvbnMgPSB0aGlzLmRyYWZ0T3BlcmF0aW9uc1xuICAgICAgLmZpbHRlcigoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmhhcyhpbmRleCkpXG4gICAgICAubWFwKChvcGVyYXRpb24pID0+ICh7XG4gICAgICAgIC4uLm9wZXJhdGlvbixcbiAgICAgICAgcGF0aDogb3BlcmF0aW9uLnBhdGgudHJpbSgpLFxuICAgICAgICBjb250ZW50OiBvcGVyYXRpb24uY29udGVudC50cmltKCksXG4gICAgICB9KSlcbiAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbikgPT4gb3BlcmF0aW9uLnBhdGggJiYgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgIGlmICghb3BlcmF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIGNoYW5nZSB0byBhcHBseVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaW52YWxpZFBhdGggPSBvcGVyYXRpb25zLmZpbmQoKG9wZXJhdGlvbikgPT4gIWlzU2FmZU1hcmtkb3duUGF0aChvcGVyYXRpb24ucGF0aCwgdGhpcy5vcHRpb25zLnNldHRpbmdzKSk7XG4gICAgaWYgKGludmFsaWRQYXRoKSB7XG4gICAgICBuZXcgTm90aWNlKGBJbnZhbGlkIHRhcmdldCBwYXRoOiAke2ludmFsaWRQYXRoLnBhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMud29ya2luZyA9IHRydWU7XG4gICAgdGhpcy5zZXRCdXR0b25zRW5hYmxlZChmYWxzZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgdGhpcy5vcHRpb25zLm9uQXBwcm92ZSh7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5wbGFuLFxuICAgICAgICBvcGVyYXRpb25zLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBtZXNzYWdlID0gcGF0aHMubGVuZ3RoXG4gICAgICAgID8gYFVwZGF0ZWQgJHtwYXRocy5qb2luKFwiLCBcIil9YFxuICAgICAgICA6IFwiTm8gdmF1bHQgY2hhbmdlcyB3ZXJlIGFwcGxpZWRcIjtcbiAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25Db21wbGV0ZShtZXNzYWdlLCBwYXRocyk7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhcHBseSB2YXVsdCBjaGFuZ2VzXCIpO1xuICAgICAgdGhpcy5zZXRCdXR0b25zRW5hYmxlZCh0cnVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25zRW5hYmxlZChlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuYXBwcm92ZUJ1dHRvbkVsKSB7XG4gICAgICB0aGlzLmFwcHJvdmVCdXR0b25FbC5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwudGV4dENvbnRlbnQgPSBlbmFibGVkID8gXCJBcHByb3ZlIGFuZCBXcml0ZVwiIDogXCJXcml0aW5nLi4uXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLmNhbmNlbEJ1dHRvbkVsKSB7XG4gICAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsLmRpc2FibGVkID0gIWVuYWJsZWQ7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJPcGVyYXRpb24oaW5kZXg6IG51bWJlciwgb3BlcmF0aW9uOiBWYXVsdFdyaXRlT3BlcmF0aW9uKTogdm9pZCB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXBsYW4tb3BlcmF0aW9uXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyID0gaXRlbS5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcImJyYWluLXBsYW4tb3BlcmF0aW9uLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IGNoZWNrYm94ID0gaGVhZGVyLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgYXR0cjogeyB0eXBlOiBcImNoZWNrYm94XCIgfSxcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5oYXMoaW5kZXgpO1xuICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuYWRkKGluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmRlbGV0ZShpbmRleCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbikgfSk7XG5cbiAgICBpZiAob3BlcmF0aW9uLmRlc2NyaXB0aW9uKSB7XG4gICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXBsYW4tZGVzY3JpcHRpb25cIixcbiAgICAgICAgdGV4dDogb3BlcmF0aW9uLmRlc2NyaXB0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aElucHV0ID0gaXRlbS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLXBhdGgtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIFwiYXJpYS1sYWJlbFwiOiBcIlRhcmdldCBtYXJrZG93biBwYXRoXCIsXG4gICAgICB9LFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcGF0aElucHV0LnZhbHVlID0gb3BlcmF0aW9uLnBhdGg7XG4gICAgcGF0aElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0gPSB7XG4gICAgICAgIC4uLnRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSxcbiAgICAgICAgcGF0aDogcGF0aElucHV0LnZhbHVlLFxuICAgICAgfSBhcyBWYXVsdFdyaXRlT3BlcmF0aW9uO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dGFyZWEgPSBpdGVtLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0IGJyYWluLXBsYW4tZWRpdG9yXCIsXG4gICAgICBhdHRyOiB7IHJvd3M6IFwiMTBcIiB9LFxuICAgIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gb3BlcmF0aW9uLmNvbnRlbnQ7XG4gICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSA9IHtcbiAgICAgICAgLi4udGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdLFxuICAgICAgICBjb250ZW50OiB0ZXh0YXJlYS52YWx1ZSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpYmVPcGVyYXRpb24ob3BlcmF0aW9uOiBWYXVsdFdyaXRlUGxhbltcIm9wZXJhdGlvbnNcIl1bbnVtYmVyXSk6IHN0cmluZyB7XG4gIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJhcHBlbmRcIikge1xuICAgIHJldHVybiBgQXBwZW5kIHRvICR7b3BlcmF0aW9uLnBhdGh9YDtcbiAgfVxuICByZXR1cm4gYENyZWF0ZSAke29wZXJhdGlvbi5wYXRofWA7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogQ2VudHJhbGl6ZWQgZXJyb3IgaGFuZGxpbmcgdXRpbGl0eVxuICogU3RhbmRhcmRpemVzIGVycm9yIHJlcG9ydGluZyBhY3Jvc3MgdGhlIHBsdWdpblxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlO1xuICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yQW5kUmV0aHJvdyhlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyIHtcbiAgc2hvd0Vycm9yKGVycm9yLCBkZWZhdWx0TWVzc2FnZSk7XG4gIHRocm93IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihkZWZhdWx0TWVzc2FnZSk7XG59XG4iLCAiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmludGVyZmFjZSBCcmFpbkNvbW1hbmRIb3N0IHtcbiAgYWRkQ29tbWFuZDogUGx1Z2luW1wiYWRkQ29tbWFuZFwiXTtcbiAgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPjtcbiAgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBCcmFpbkNvbW1hbmRIb3N0KTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXZhdWx0LWNoYXRcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFZhdWx0IENoYXRcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4taW5zdHJ1Y3Rpb25zXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBJbnN0cnVjdGlvbnNcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5JbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSxcbiAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBc0M7OztBQ08vQixJQUFNLHlCQUE4QztBQUFBLEVBQ3pELGFBQWE7QUFBQSxFQUNiLGtCQUFrQjtBQUFBLEVBQ2xCLFlBQVk7QUFBQSxFQUNaLGdCQUFnQjtBQUNsQjtBQUVPLFNBQVMsdUJBQ2QsT0FDcUI7QUFDckIsUUFBTSxTQUE4QjtBQUFBLElBQ2xDLEdBQUc7QUFBQSxJQUNILEdBQUc7QUFBQSxFQUNMO0FBRUEsU0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGtCQUFrQjtBQUFBLE1BQ2hCLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxZQUFZLE9BQU8sT0FBTyxlQUFlLFdBQVcsT0FBTyxXQUFXLEtBQUssSUFBSTtBQUFBLElBQy9FLGdCQUFnQix3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QkFBTyxrQkFBa0IsS0FBSyxTQUFTLGdCQUFnQixFQUFFO0FBQzdEO0FBQUEsSUFDRjtBQUNBLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDN0MsVUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLEVBQzFCO0FBQUEsRUFFQSxNQUFNLGNBQWMsU0FBaUIsVUFBMEIsQ0FBQyxHQUFHLFFBQWtEO0FBQ25ILFdBQU8sS0FBSyxpQkFBaUIsUUFBUSxTQUFTLFNBQVMsTUFBTTtBQUFBLEVBQy9EO0FBQUEsRUFFQSxNQUFNLG9CQUFvQixNQUF5QztBQUNqRSxVQUFNLFFBQVEsTUFBTSxLQUFLLGtCQUFrQixVQUFVLElBQUk7QUFDekQsVUFBTSxLQUFLLCtCQUErQjtBQUMxQyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEscUJBQThDO0FBQzVDLFVBQU0sU0FBUyxLQUFLLElBQUksVUFBVSxnQkFBZ0IsZUFBZTtBQUNqRSxlQUFXLFFBQVEsUUFBUTtBQUN6QixZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLGdCQUFnQixrQkFBa0I7QUFDcEMsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBaEo5QztBQWlKSSxZQUFNLFVBQUssbUJBQW1CLE1BQXhCLG1CQUEyQjtBQUFBLEVBQ25DO0FBQUEsRUFFQSxNQUFNLGlDQUFnRDtBQUNwRCxRQUFJO0FBQ0YsWUFBTSxLQUFLLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8sa0NBQWtDO0FBQUEsSUFDckQ7QUFBQSxFQUNGO0FBRUY7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
