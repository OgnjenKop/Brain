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
    const invalidPath = operations.find((operation) => !isSafeMarkdownPath(operation.path, this.options.settings));
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
      const history = this.buildChatHistory();
      const response = await this.plugin.chatWithVault(message, history, controller.signal);
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
    item.createEl("div", {
      cls: "brain-chat-role",
      text: turn.role === "user" ? "You" : "Brain"
    });
    const output = item.createEl("div", { cls: "brain-output" });
    if (turn.role === "brain") {
      await import_obsidian6.MarkdownRenderer.render(this.app, turn.text, output, "", this);
      if (generation !== this.renderGeneration) {
        item.remove();
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
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  appendLoadingIndicator() {
    if (this.messagesEl.querySelector(".brain-chat-message-loading")) {
      return;
    }
    const item = this.messagesEl.createEl("div", {
      cls: "brain-chat-message brain-chat-message-brain brain-chat-message-loading"
    });
    item.createEl("div", {
      cls: "brain-chat-role",
      text: "Brain"
    });
    this.loadingTextEl = item.createEl("div", {
      cls: "brain-loading",
      text: this.loadingText || "Reading vault context and asking Codex..."
    });
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
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
      this.appendLoadingIndicator();
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
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
    this.loadingText = `Reading vault context and asking Codex... ${seconds}s elapsed, timeout in ${remaining}s.`;
    if (this.loadingTextEl) {
      this.loadingTextEl.setText(this.loadingText);
    }
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
    const leaf = this.app.workspace.getLeaf(false);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbm9kZS1ydW50aW1lLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3V0aWxzL2NvZGV4LW1vZGVscy50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgtc2FmZXR5LnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCUkFJTl9WSUVXX1RZUEUsIEJyYWluU2lkZWJhclZpZXcgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBpbnN0cnVjdGlvblNlcnZpY2UhOiBJbnN0cnVjdGlvblNlcnZpY2U7XG4gIHZhdWx0UXVlcnlTZXJ2aWNlITogVmF1bHRRdWVyeVNlcnZpY2U7XG4gIHZhdWx0V3JpdGVTZXJ2aWNlITogVmF1bHRXcml0ZVNlcnZpY2U7XG4gIHZhdWx0Q2hhdFNlcnZpY2UhOiBWYXVsdENoYXRTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlID0gbmV3IEluc3RydWN0aW9uU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UgPSBuZXcgVmF1bHRRdWVyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlID0gbmV3IFZhdWx0V3JpdGVTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdENoYXRTZXJ2aWNlID0gbmV3IFZhdWx0Q2hhdFNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFF1ZXJ5U2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZS5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBCcmFpbiBzdG9yYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgbG9hZCBCcmFpbiBzZXR0aW5nc1wiKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2U/LmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIEJyYWluIHN0b3JhZ2VcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGhpcy5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKGBDb3VsZCBub3Qgb3BlbiAke3RoaXMuc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZX1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgY2hhdFdpdGhWYXVsdChtZXNzYWdlOiBzdHJpbmcsIGhpc3Rvcnk6IENoYXRFeGNoYW5nZVtdID0gW10sIHNpZ25hbD86IEFib3J0U2lnbmFsKTogUHJvbWlzZTxWYXVsdENoYXRSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLnZhdWx0Q2hhdFNlcnZpY2UucmVzcG9uZChtZXNzYWdlLCBoaXN0b3J5LCBzaWduYWwpO1xuICB9XG5cbiAgYXN5bmMgYXBwbHlWYXVsdFdyaXRlUGxhbihwbGFuOiBWYXVsdFdyaXRlUGxhbik6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBwYXRocyA9IGF3YWl0IHRoaXMudmF1bHRXcml0ZVNlcnZpY2UuYXBwbHlQbGFuKHBsYW4pO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk7XG4gICAgcmV0dXJuIHBhdGhzO1xuICB9XG5cbiAgZ2V0T3BlblNpZGViYXJWaWV3KCk6IEJyYWluU2lkZWJhclZpZXcgfCBudWxsIHtcbiAgICBjb25zdCBsZWF2ZXMgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEJSQUlOX1ZJRVdfVFlQRSk7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIGxlYXZlcykge1xuICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICAgIGlmICh2aWV3IGluc3RhbmNlb2YgQnJhaW5TaWRlYmFyVmlldykge1xuICAgICAgICByZXR1cm4gdmlldztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU2lkZWJhclN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmdldE9wZW5TaWRlYmFyVmlldygpPy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBhc3luYyByZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCByZWZyZXNoIHNpZGViYXIgc3RhdHVzXCIpO1xuICAgIH1cbiAgfVxuXG59XG4iLCAiZXhwb3J0IGludGVyZmFjZSBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgbm90ZXNGb2xkZXI6IHN0cmluZztcbiAgaW5zdHJ1Y3Rpb25zRmlsZTogc3RyaW5nO1xuICBjb2RleE1vZGVsOiBzdHJpbmc7XG4gIGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICBub3Rlc0ZvbGRlcjogXCJOb3Rlc1wiLFxuICBpbnN0cnVjdGlvbnNGaWxlOiBcIkJyYWluL0FHRU5UUy5tZFwiLFxuICBjb2RleE1vZGVsOiBcIlwiLFxuICBleGNsdWRlRm9sZGVyczogXCIub2JzaWRpYW5cXG5ub2RlX21vZHVsZXNcIixcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmFpblNldHRpbmdzKFxuICBpbnB1dDogUGFydGlhbDxCcmFpblBsdWdpblNldHRpbmdzPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIGNvbnN0IG1lcmdlZDogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgICAuLi5ERUZBVUxUX0JSQUlOX1NFVFRJTkdTLFxuICAgIC4uLmlucHV0LFxuICB9IGFzIEJyYWluUGx1Z2luU2V0dGluZ3M7XG5cbiAgcmV0dXJuIHtcbiAgICBub3Rlc0ZvbGRlcjogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLm5vdGVzRm9sZGVyLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5ub3Rlc0ZvbGRlcixcbiAgICApLFxuICAgIGluc3RydWN0aW9uc0ZpbGU6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgREVGQVVMVF9CUkFJTl9TRVRUSU5HUy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICksXG4gICAgY29kZXhNb2RlbDogdHlwZW9mIG1lcmdlZC5jb2RleE1vZGVsID09PSBcInN0cmluZ1wiID8gbWVyZ2VkLmNvZGV4TW9kZWwudHJpbSgpIDogXCJcIixcbiAgICBleGNsdWRlRm9sZGVyczogbm9ybWFsaXplRXhjbHVkZUZvbGRlcnMobWVyZ2VkLmV4Y2x1ZGVGb2xkZXJzKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUmVsYXRpdmVQYXRoKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjazogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB2YWx1ZS50cmltKCkucmVwbGFjZSgvXlxcLysvLCBcIlwiKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gbm9ybWFsaXplZCB8fCBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRXhjbHVkZUZvbGRlcnModmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuZXhjbHVkZUZvbGRlcnM7XG4gIH1cbiAgcmV0dXJuIHZhbHVlXG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkucmVwbGFjZSgvXlxcLysvLCBcIlwiKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRXhjbHVkZUZvbGRlcnMoZXhjbHVkZUZvbGRlcnM6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIGV4Y2x1ZGVGb2xkZXJzXG4gICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVGV4dENvbXBvbmVudCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQge1xuICBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbiAgQ29kZXhNb2RlbE9wdGlvbixcbiAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zLFxuICBpc0tub3duQ29kZXhNb2RlbCxcbn0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LW1vZGVsc1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogQnJhaW5QbHVnaW47XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zOiBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRlZCA9IGZhbHNlO1xuICBwcml2YXRlIGN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluIFNldHRpbmdzXCIgfSk7XG4gICAgaWYgKCF0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgJiYgIXRoaXMubW9kZWxPcHRpb25zTG9hZGVkKSB7XG4gICAgICB2b2lkIHRoaXMucmVmcmVzaE1vZGVsT3B0aW9ucygpO1xuICAgIH1cblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlN0b3JhZ2VcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOb3RlcyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRGVmYXVsdCBmb2xkZXIgZm9yIG5ldyBtYXJrZG93biBub3RlcyBjcmVhdGVkIGZyb20gYXBwcm92ZWQgd3JpdGUgcGxhbnMuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJOb3RlcyBmb2xkZXIgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbnN0cnVjdGlvbnMgZmlsZVwiKVxuICAgICAgLnNldERlc2MoXCJNYXJrZG93biBmaWxlIHRoYXQgdGVsbHMgQnJhaW4gaG93IHRvIG9wZXJhdGUgaW4gdGhpcyB2YXVsdC5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlID0gdmFsdWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJJbnN0cnVjdGlvbnMgZmlsZSBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkV4Y2x1ZGVkIGZvbGRlcnNcIilcbiAgICAgIC5zZXREZXNjKFwiT25lIGZvbGRlciBwYXRoIHBlciBsaW5lLiBCcmFpbiB3aWxsIHNraXAgbWFya2Rvd24gZmlsZXMgaW5zaWRlIHRoZXNlIGZvbGRlcnMgd2hlbiBzZWFyY2hpbmcgdGhlIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZXhjbHVkZUZvbGRlcnMpLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVGb2xkZXJzID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJDb2RleCBDTElcIiB9KTtcblxuICAgIHRoaXMuY3JlYXRlQ29kZXhTdGF0dXNTZXR0aW5nKGNvbnRhaW5lckVsKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBzZXR1cFwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQnJhaW4gdXNlcyBvbmx5IHRoZSBsb2NhbCBDb2RleCBDTEkuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiByZWNoZWNrIHN0YXR1cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIENvZGV4IFNldHVwXCIpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oKTtcbiAgICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJSZWNoZWNrIFN0YXR1c1wiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIGNvbnN0IG1vZGVsU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBtb2RlbFwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZ1xuICAgICAgICAgID8gXCJMb2FkaW5nIG1vZGVscyBmcm9tIHRoZSBpbnN0YWxsZWQgQ29kZXggQ0xJLi4uXCJcbiAgICAgICAgICA6IFwiT3B0aW9uYWwuIFNlbGVjdCBhIG1vZGVsIHJlcG9ydGVkIGJ5IENvZGV4IENMSSwgb3IgbGVhdmUgYmxhbmsgdG8gdXNlIHRoZSBhY2NvdW50IGRlZmF1bHQuXCIsXG4gICAgICApXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHRoaXMubW9kZWxPcHRpb25zKSB7XG4gICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKG9wdGlvbi52YWx1ZSwgb3B0aW9uLmxhYmVsKTtcbiAgICAgICAgfVxuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb24oQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLCBcIkN1c3RvbS4uLlwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdFxuICAgICAgICAgICAgICA/IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRVxuICAgICAgICAgICAgICA6IGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKSxcbiAgICAgICAgICApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUpIHtcbiAgICAgICAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIG1vZGVsU2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgIGJ1dHRvblxuICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlJlbG9hZFwiKVxuICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcbiAgICAgICAgfSksXG4gICAgKTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fFxuICAgICAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICApIHtcbiAgICAgIGxldCBkcmFmdFZhbHVlID0gdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8IGlzS25vd25Db2RleE1vZGVsKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsO1xuICAgICAgaWYgKHRoaXMuY3VzdG9tTW9kZWxEcmFmdCAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAuc2V0TmFtZShcIkFjdGl2ZSBDb2RleCBtb2RlbFwiKVxuICAgICAgICAgIC5zZXREZXNjKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKTtcbiAgICAgIH1cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkN1c3RvbSBDb2RleCBtb2RlbFwiKVxuICAgICAgICAuc2V0RGVzYyhcIkV4YWN0IG1vZGVsIGlkIHBhc3NlZCB0byBgY29kZXggZXhlYyAtLW1vZGVsYC5cIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAuc2V0VmFsdWUoZHJhZnRWYWx1ZSlcbiAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgZHJhZnRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQ3VzdG9tTW9kZWxEcmFmdChkcmFmdFZhbHVlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgdGV4dC5pbnB1dEVsLmJsdXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoTW9kZWxPcHRpb25zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zID0gYXdhaXQgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkZWQgPSB0cnVlO1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbERyYWZ0KHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2RlbCA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1vZGVsKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gbW9kZWw7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5kaXNwbGF5KCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvZGV4U3RhdHVzU2V0dGluZyhjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0dXNTZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvZGV4IHN0YXR1c1wiKVxuICAgICAgLnNldERlc2MoXCJDaGVja2luZyBDb2RleCBDTEkgc3RhdHVzLi4uXCIpO1xuICAgIHZvaWQgdGhpcy5yZWZyZXNoQ29kZXhTdGF0dXMoc3RhdHVzU2V0dGluZyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hDb2RleFN0YXR1cyhzZXR0aW5nOiBTZXR0aW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICBzZXR0aW5nLnNldERlc2Moc3RhdHVzLm1lc3NhZ2UpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhcIkNvdWxkIG5vdCBjaGVjayBDb2RleCBDTEkgc3RhdHVzLlwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGxhc3RWYWxpZFZhbHVlID0gdmFsdWU7XG5cbiAgICB0ZXh0LnNldFZhbHVlKHZhbHVlKS5vbkNoYW5nZSgobmV4dFZhbHVlKSA9PiB7XG4gICAgICBpZiAoIXZhbGlkYXRlIHx8IHZhbGlkYXRlKG5leHRWYWx1ZSkpIHtcbiAgICAgICAgb25WYWx1ZUNoYW5nZShuZXh0VmFsdWUpO1xuICAgICAgICBsYXN0VmFsaWRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSB0ZXh0LmlucHV0RWwudmFsdWU7XG4gICAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShsYXN0VmFsaWRWYWx1ZSk7XG4gICAgICAgIG9uVmFsdWVDaGFuZ2UobGFzdFZhbGlkVmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIH0pO1xuXG4gICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxufVxuIiwgIi8qKlxuICogU2hhcmVkIE5vZGUuanMgcnVudGltZSBoZWxwZXJzLlxuICpcbiAqIFRoZXNlIHVzZSBkeW5hbWljIGByZXF1aXJlKClgIHZpYSBgRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpYCB0b1xuICogYnlwYXNzIGVzYnVpbGQgYnVuZGxpbmcgb2YgTm9kZSBidWlsdC1pbnMuIE9ic2lkaWFuIHBsdWdpbnMgcnVuIGluIGFuXG4gKiBFbGVjdHJvbi9Ob2RlIGNvbnRleHQgd2hlcmUgYHJlcXVpcmVgIGlzIGF2YWlsYWJsZSBhdCBydW50aW1lIGJ1dCBjYW5ub3RcbiAqIGJlIHN0YXRpY2FsbHkgYnVuZGxlZC5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZVJlcXVpcmUoKTogTm9kZVJlcXVpcmUge1xuICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpIGFzIE5vZGVSZXF1aXJlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29kZXhSdW50aW1lKCk6IHtcbiAgZXhlY0ZpbGU6IChcbiAgICBmaWxlOiBzdHJpbmcsXG4gICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgIG9wdGlvbnM/OiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyxcbiAgICBjYWxsYmFjaz86IChcbiAgICAgIGVycm9yOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlRXhjZXB0aW9uIHwgbnVsbCxcbiAgICAgIHN0ZG91dDogc3RyaW5nIHwgQnVmZmVyLFxuICAgICAgc3RkZXJyOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgKSA9PiB2b2lkLFxuICApID0+IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuQ2hpbGRQcm9jZXNzO1xuICBmczogdHlwZW9mIGltcG9ydChcImZzL3Byb21pc2VzXCIpO1xuICBvczogdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuICBwYXRoOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKTtcbn0ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICBjb25zdCB7IGV4ZWNGaWxlIH0gPSByZXEoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICByZXR1cm4ge1xuICAgIGV4ZWNGaWxlOiBleGVjRmlsZSBhcyAoXG4gICAgICBmaWxlOiBzdHJpbmcsXG4gICAgICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gICAgICBvcHRpb25zPzogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMsXG4gICAgICBjYWxsYmFjaz86IChcbiAgICAgICAgZXJyb3I6IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVFeGNlcHRpb24gfCBudWxsLFxuICAgICAgICBzdGRvdXQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICAgICAgc3RkZXJyOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICApID0+IHZvaWQsXG4gICAgKSA9PiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkNoaWxkUHJvY2VzcyxcbiAgICBmczogcmVxKFwiZnMvcHJvbWlzZXNcIikgYXMgdHlwZW9mIGltcG9ydChcImZzL3Byb21pc2VzXCIpLFxuICAgIG9zOiByZXEoXCJvc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwib3NcIiksXG4gICAgcGF0aDogcmVxKFwicGF0aFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4ZWNGaWxlQXN5bmMoKTogKFxuICBmaWxlOiBzdHJpbmcsXG4gIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKSA9PiBQcm9taXNlPHsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgY29uc3QgeyBleGVjRmlsZSB9ID0gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgY29uc3QgeyBwcm9taXNpZnkgfSA9IHJlcShcInV0aWxcIikgYXMgdHlwZW9mIGltcG9ydChcInV0aWxcIik7XG4gIHJldHVybiBwcm9taXNpZnkoZXhlY0ZpbGUpIGFzIChcbiAgICBmaWxlOiBzdHJpbmcsXG4gICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKSA9PiBQcm9taXNlPHsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFbm9lbnRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJjb2RlXCIgaW4gZXJyb3IgJiYgZXJyb3IuY29kZSA9PT0gXCJFTk9FTlRcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVGltZW91dEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJiBlcnJvciAhPT0gbnVsbCAmJiBcImtpbGxlZFwiIGluIGVycm9yICYmIGVycm9yLmtpbGxlZCA9PT0gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQWJvcnRFcnJvcihlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICBcIm5hbWVcIiBpbiBlcnJvciAmJlxuICAgIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlUnVudGltZVVuYXZhaWxhYmxlKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIFJlZmVyZW5jZUVycm9yIHx8IGVycm9yIGluc3RhbmNlb2YgVHlwZUVycm9yO1xufVxuIiwgImltcG9ydCB7IGdldEV4ZWNGaWxlQXN5bmMsIGdldE5vZGVSZXF1aXJlLCBpc0Vub2VudEVycm9yLCBpc05vZGVSdW50aW1lVW5hdmFpbGFibGUsIGlzVGltZW91dEVycm9yIH0gZnJvbSBcIi4vbm9kZS1ydW50aW1lXCI7XG5cbmV4cG9ydCB0eXBlIENvZGV4TG9naW5TdGF0dXMgPSBcImxvZ2dlZC1pblwiIHwgXCJsb2dnZWQtb3V0XCIgfCBcInVuYXZhaWxhYmxlXCI7XG5cbmNvbnN0IENPREVYX0xPR0lOX1NUQVRVU19USU1FT1VUX01TID0gNTAwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhvdXRwdXQ6IHN0cmluZyk6IENvZGV4TG9naW5TdGF0dXMge1xuICBjb25zdCBub3JtYWxpemVkID0gb3V0cHV0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cblxuICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcIm5vdCBsb2dnZWQgaW5cIikgfHwgbm9ybWFsaXplZC5pbmNsdWRlcyhcImxvZ2dlZCBvdXRcIikpIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cblxuICBpZiAoXG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcImxvZ2dlZCBpblwiKSB8fFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJzaWduZWQgaW5cIikgfHxcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwiYXV0aGVudGljYXRlZFwiKVxuICApIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtaW5cIjtcbiAgfVxuXG4gIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4TG9naW5TdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cblxuICAgIGNvbnN0IGV4ZWNGaWxlQXN5bmMgPSBnZXRFeGVjRmlsZUFzeW5jKCk7XG4gICAgY29uc3QgeyBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgZXhlY0ZpbGVBc3luYyhjb2RleEJpbmFyeSwgW1wibG9naW5cIiwgXCJzdGF0dXNcIl0sIHtcbiAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQsXG4gICAgICB0aW1lb3V0OiBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyxcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VDb2RleExvZ2luU3RhdHVzKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikgfHwgaXNUaW1lb3V0RXJyb3IoZXJyb3IpIHx8IGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcikpIHtcbiAgICAgIHJldHVybiBcInVuYXZhaWxhYmxlXCI7XG4gICAgfVxuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZXhCaW5hcnlQYXRoKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBsZXQgcmVxOiBOb2RlUmVxdWlyZTtcbiAgdHJ5IHtcbiAgICByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGZzID0gcmVxKFwiZnNcIikgYXMgdHlwZW9mIGltcG9ydChcImZzXCIpO1xuICBjb25zdCBwYXRoID0gcmVxKFwicGF0aFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKTtcbiAgY29uc3Qgb3MgPSByZXEoXCJvc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwib3NcIik7XG5cbiAgY29uc3QgY2FuZGlkYXRlcyA9IGJ1aWxkQ29kZXhDYW5kaWRhdGVzKHBhdGgsIG9zLmhvbWVkaXIoKSk7XG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKGNhbmRpZGF0ZSk7XG4gICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gS2VlcCBzZWFyY2hpbmcuXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29kZXhDYW5kaWRhdGVzKHBhdGhNb2R1bGU6IHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpLCBob21lRGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcGF0aEVudHJpZXMgPSAocHJvY2Vzcy5lbnYuUEFUSCA/PyBcIlwiKS5zcGxpdChwYXRoTW9kdWxlLmRlbGltaXRlcikuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGZvciAoY29uc3QgZW50cnkgb2YgcGF0aEVudHJpZXMpIHtcbiAgICBjYW5kaWRhdGVzLmFkZChwYXRoTW9kdWxlLmpvaW4oZW50cnksIGNvZGV4RXhlY3V0YWJsZU5hbWUoKSkpO1xuICB9XG5cbiAgY29uc3QgY29tbW9uRGlycyA9IFtcbiAgICBcIi9vcHQvaG9tZWJyZXcvYmluXCIsXG4gICAgXCIvdXNyL2xvY2FsL2JpblwiLFxuICAgIGAke2hvbWVEaXJ9Ly5sb2NhbC9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5idW4vYmluYCxcbiAgICBgJHtob21lRGlyfS8uY29kZWl1bS93aW5kc3VyZi9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5hbnRpZ3Jhdml0eS9hbnRpZ3Jhdml0eS9iaW5gLFxuICAgIFwiL0FwcGxpY2F0aW9ucy9Db2RleC5hcHAvQ29udGVudHMvUmVzb3VyY2VzXCIsXG4gIF07XG5cbiAgZm9yIChjb25zdCBkaXIgb2YgY29tbW9uRGlycykge1xuICAgIGNhbmRpZGF0ZXMuYWRkKHBhdGhNb2R1bGUuam9pbihkaXIsIGNvZGV4RXhlY3V0YWJsZU5hbWUoKSkpO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20oY2FuZGlkYXRlcyk7XG59XG5cbmZ1bmN0aW9uIGNvZGV4RXhlY3V0YWJsZU5hbWUoKTogc3RyaW5nIHtcbiAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIiA/IFwiY29kZXguY21kXCIgOiBcImNvZGV4XCI7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBnZXRDb2RleExvZ2luU3RhdHVzIH0gZnJvbSBcIi4vY29kZXgtYXV0aFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFJQ29uZmlndXJhdGlvblN0YXR1cyB7XG4gIGNvbmZpZ3VyZWQ6IGJvb2xlYW47XG4gIHByb3ZpZGVyOiBcImNvZGV4XCI7XG4gIG1vZGVsOiBzdHJpbmcgfCBudWxsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMoXG4gIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuKTogUHJvbWlzZTxBSUNvbmZpZ3VyYXRpb25TdGF0dXM+IHtcbiAgY29uc3QgY29kZXhTdGF0dXMgPSBhd2FpdCBnZXRDb2RleExvZ2luU3RhdHVzKCk7XG4gIGlmIChjb2RleFN0YXR1cyA9PT0gXCJ1bmF2YWlsYWJsZVwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbWVzc2FnZTogXCJDb2RleCBDTEkgbm90IGluc3RhbGxlZC5cIixcbiAgICB9O1xuICB9XG5cbiAgaWYgKGNvZGV4U3RhdHVzICE9PSBcImxvZ2dlZC1pblwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbWVzc2FnZTogXCJDb2RleCBDTEkgbm90IGxvZ2dlZCBpbi5cIixcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbW9kZWwgPSBzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSB8fCBudWxsO1xuICByZXR1cm4ge1xuICAgIGNvbmZpZ3VyZWQ6IHRydWUsXG4gICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICBtb2RlbCxcbiAgICBtZXNzYWdlOiBtb2RlbFxuICAgICAgPyBgUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggbW9kZWwgJHttb2RlbH0uYFxuICAgICAgOiBcIlJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIHRoZSBhY2NvdW50IGRlZmF1bHQgbW9kZWwuXCIsXG4gIH07XG59XG4iLCAiaW1wb3J0IHsgZ2V0Q29kZXhCaW5hcnlQYXRoIH0gZnJvbSBcIi4vY29kZXgtYXV0aFwiO1xuaW1wb3J0IHsgZ2V0RXhlY0ZpbGVBc3luYyB9IGZyb20gXCIuL25vZGUtcnVudGltZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvZGV4TW9kZWxPcHRpb24ge1xuICB2YWx1ZTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TOiBDb2RleE1vZGVsT3B0aW9uW10gPSBbXG4gIHsgdmFsdWU6IFwiXCIsIGxhYmVsOiBcIkFjY291bnQgZGVmYXVsdFwiIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFID0gXCJfX2N1c3RvbV9fXCI7XG5jb25zdCBDT0RFWF9NT0RFTF9DQVRBTE9HX1RJTUVPVVRfTVMgPSA4MDAwO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTxDb2RleE1vZGVsT3B0aW9uW10+IHtcbiAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGV4ZWNGaWxlQXN5bmMgPSBnZXRFeGVjRmlsZUFzeW5jKCk7XG4gICAgY29uc3QgeyBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgZXhlY0ZpbGVBc3luYyhjb2RleEJpbmFyeSwgW1wiZGVidWdcIiwgXCJtb2RlbHNcIl0sIHtcbiAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQgKiAyMCxcbiAgICAgIHRpbWVvdXQ6IENPREVYX01PREVMX0NBVEFMT0dfVElNRU9VVF9NUyxcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VDb2RleE1vZGVsQ2F0YWxvZyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29kZXhNb2RlbENhdGFsb2cob3V0cHV0OiBzdHJpbmcpOiBDb2RleE1vZGVsT3B0aW9uW10ge1xuICBjb25zdCBqc29uVGV4dCA9IGV4dHJhY3RKc29uT2JqZWN0KG91dHB1dCk7XG4gIGlmICghanNvblRleHQpIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25UZXh0KSBhcyB7XG4gICAgICBtb2RlbHM/OiBBcnJheTx7XG4gICAgICAgIHNsdWc/OiB1bmtub3duO1xuICAgICAgICBkaXNwbGF5X25hbWU/OiB1bmtub3duO1xuICAgICAgICB2aXNpYmlsaXR5PzogdW5rbm93bjtcbiAgICAgIH0+O1xuICAgIH07XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBbLi4uREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TXTtcbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHBhcnNlZC5tb2RlbHMgPz8gW10pIHtcbiAgICAgIGNvbnN0IHNsdWcgPSB0eXBlb2YgbW9kZWwuc2x1ZyA9PT0gXCJzdHJpbmdcIiA/IG1vZGVsLnNsdWcudHJpbSgpIDogXCJcIjtcbiAgICAgIGlmICghc2x1ZyB8fCBzZWVuLmhhcyhzbHVnKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChtb2RlbC52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgbW9kZWwudmlzaWJpbGl0eSAhPT0gXCJsaXN0XCIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZChzbHVnKTtcbiAgICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICAgIHZhbHVlOiBzbHVnLFxuICAgICAgICBsYWJlbDogdHlwZW9mIG1vZGVsLmRpc3BsYXlfbmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBtb2RlbC5kaXNwbGF5X25hbWUudHJpbSgpXG4gICAgICAgICAgPyBtb2RlbC5kaXNwbGF5X25hbWUudHJpbSgpXG4gICAgICAgICAgOiBzbHVnLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZShcbiAgbW9kZWw6IHN0cmluZyxcbiAgb3B0aW9uczogcmVhZG9ubHkgQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG1vZGVsLnRyaW0oKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT09IG5vcm1hbGl6ZWQpXG4gICAgPyBub3JtYWxpemVkXG4gICAgOiBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0tub3duQ29kZXhNb2RlbChcbiAgbW9kZWw6IHN0cmluZyxcbiAgb3B0aW9uczogcmVhZG9ubHkgQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBtb2RlbC50cmltKCk7XG4gIHJldHVybiBvcHRpb25zLnNvbWUoKG9wdGlvbikgPT4gb3B0aW9uLnZhbHVlID09PSBub3JtYWxpemVkKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEpzb25PYmplY3Qob3V0cHV0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3Qgc3RhcnQgPSBvdXRwdXQuaW5kZXhPZihcIntcIik7XG4gIGNvbnN0IGVuZCA9IG91dHB1dC5sYXN0SW5kZXhPZihcIn1cIik7XG4gIGlmIChzdGFydCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fCBlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gb3V0cHV0LnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuaW1wb3J0IHsgZ2V0Q29kZXhSdW50aW1lLCBpc0Fib3J0RXJyb3IsIGlzRW5vZW50RXJyb3IsIGlzVGltZW91dEVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL25vZGUtcnVudGltZVwiO1xuXG5jb25zdCBDT0RFWF9DSEFUX1RJTUVPVVRfTVMgPSAxMjAwMDA7XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkFJU2VydmljZSB7XG4gIGFzeW5jIGNvbXBsZXRlQ2hhdChcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBzdHJpbmcgfCBudWxsLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBvc3RDb2RleENvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzLCB3b3JraW5nRGlyZWN0b3J5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q29kZXhDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyB8IG51bGwsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBleGVjRmlsZSwgZnMsIG9zLCBwYXRoIH0gPSBnZXRDb2RleFJ1bnRpbWUoKTtcbiAgICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICAgIGlmICghY29kZXhCaW5hcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgIH1cbiAgICBjb25zdCB0ZW1wRGlyID0gYXdhaXQgZnMubWtkdGVtcChwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiYnJhaW4tY29kZXgtXCIpKTtcbiAgICBjb25zdCBvdXRwdXRGaWxlID0gcGF0aC5qb2luKHRlbXBEaXIsIFwicmVzcG9uc2UudHh0XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0tZXBoZW1lcmFsXCIsXG4gICAgICBcIi0taWdub3JlLXJ1bGVzXCIsXG4gICAgICBcIi0tc2FuZGJveFwiLFxuICAgICAgXCJyZWFkLW9ubHlcIixcbiAgICAgIFwiLS1vdXRwdXQtbGFzdC1tZXNzYWdlXCIsXG4gICAgICBvdXRwdXRGaWxlLFxuICAgIF07XG5cbiAgICBpZiAod29ya2luZ0RpcmVjdG9yeSkge1xuICAgICAgYXJncy5wdXNoKFwiLS1jZFwiLCB3b3JraW5nRGlyZWN0b3J5KTtcbiAgICB9XG5cbiAgICBpZiAoc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tbW9kZWxcIiwgc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgIH1cblxuICAgIGFyZ3MucHVzaChcIi1cIik7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZENvZGV4UHJvbXB0KG1lc3NhZ2VzKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjRmlsZVdpdGhBYm9ydChjb2RleEJpbmFyeSwgYXJncywge1xuICAgICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogNCxcbiAgICAgICAgY3dkOiB0ZW1wRGlyLFxuICAgICAgICB0aW1lb3V0OiBDT0RFWF9DSEFUX1RJTUVPVVRfTVMsXG4gICAgICAgIHNpZ25hbCxcbiAgICAgICAgc3RkaW46IHByb21wdCxcbiAgICAgIH0sIGV4ZWNGaWxlKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShvdXRwdXRGaWxlLCBcInV0ZjhcIik7XG4gICAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgICB9XG4gICAgICBpZiAoaXNUaW1lb3V0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IGRpZCBub3QgcmVzcG9uZCBpbiB0aW1lLiBUcnkgYWdhaW4sIG9yIGNoZWNrIGBjb2RleCBsb2dpbiBzdGF0dXNgIG91dHNpZGUgQnJhaW4uXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCB8fCBpc0Fib3J0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIik7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgZnMucm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvZGV4UHJvbXB0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBzdHJpbmcge1xuICAgIHJldHVybiBtZXNzYWdlc1xuICAgICAgLm1hcCgobWVzc2FnZSkgPT4gYCR7bWVzc2FnZS5yb2xlLnRvVXBwZXJDYXNlKCl9OlxcbiR7bWVzc2FnZS5jb250ZW50fWApXG4gICAgICAuam9pbihcIlxcblxcblwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjRmlsZVdpdGhBYm9ydChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzOiByZWFkb25seSBzdHJpbmdbXSxcbiAgb3B0aW9uczogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMgJiB7XG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gICAgc3RkaW4/OiBzdHJpbmc7XG4gIH0sXG4gIGV4ZWNGaWxlOiBSZXR1cm5UeXBlPHR5cGVvZiBnZXRDb2RleFJ1bnRpbWU+W1wiZXhlY0ZpbGVcIl0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHsgc2lnbmFsLCBzdGRpbiwgLi4uZXhlY09wdGlvbnMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgY2hpbGQgPSBleGVjRmlsZShmaWxlLCBhcmdzLCBleGVjT3B0aW9ucywgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoc2V0dGxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgIHNpZ25hbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0KTtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChzdGRpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjaGlsZC5zdGRpbj8uZW5kKHN0ZGluKTtcbiAgICB9XG5cbiAgICBjb25zdCBhYm9ydCA9ICgpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNoaWxkLmtpbGwoXCJTSUdURVJNXCIpO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAoY2hpbGQuZXhpdENvZGUgPT09IG51bGwgJiYgY2hpbGQuc2lnbmFsQ29kZSA9PT0gbnVsbCkge1xuICAgICAgICAgIGNoaWxkLmtpbGwoXCJTSUdLSUxMXCIpO1xuICAgICAgICB9XG4gICAgICB9LCAxNTAwKTtcbiAgICB9O1xuXG4gICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgYWJvcnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgYWJvcnQsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5cbiIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgQ29kZXhMb2dpblN0YXR1cywgZ2V0Q29kZXhMb2dpblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkF1dGhTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IEJyYWluUGx1Z2luKSB7fVxuXG4gIGFzeW5jIGxvZ2luKCkge1xuICAgIG5ldyBOb3RpY2UoXCJJbnN0YWxsIHRoZSBDb2RleCBDTEksIHJ1biBgY29kZXggbG9naW5gLCB0aGVuIHJldHVybiB0byBCcmFpbiBhbmQgcmVjaGVjayBDb2RleCBzdGF0dXMuXCIpO1xuICAgIHdpbmRvdy5vcGVuKFwiaHR0cHM6Ly9vcGVuYWkuY29tL2NvZGV4L2dldC1zdGFydGVkL1wiKTtcbiAgfVxuXG4gIGFzeW5jIGdldENvZGV4U3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICAgIHJldHVybiBnZXRDb2RleExvZ2luU3RhdHVzKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmNvbnN0IERFRkFVTFRfSU5TVFJVQ1RJT05TID0gW1xuICBcIiMgQnJhaW4gSW5zdHJ1Y3Rpb25zXCIsXG4gIFwiXCIsXG4gIFwiWW91IGFyZSBoZWxwaW5nIGZpbGUgaW5mb3JtYXRpb24gaW50byB0aGlzIE9ic2lkaWFuIHZhdWx0IGFuZCByZXRyaWV2ZSBpbmZvcm1hdGlvbiBmcm9tIGl0LlwiLFxuICBcIlwiLFxuICBcIiMjIE9wZXJhdGluZyBSdWxlc1wiLFxuICBcIi0gS2VlcCBhbGwgcGVyc2lzdGVkIGNvbnRlbnQgYXMgbm9ybWFsIG1hcmtkb3duLlwiLFxuICBcIi0gVXNlIG9ubHkgZXhwbGljaXQgdmF1bHQgY29udGV4dCB3aGVuIGFuc3dlcmluZyByZXRyaWV2YWwgcXVlc3Rpb25zLlwiLFxuICBcIi0gUHJlZmVyIHVwZGF0aW5nIG9yIGFwcGVuZGluZyB0byBleGlzdGluZyBub3RlcyBvdmVyIGNyZWF0aW5nIGR1cGxpY2F0ZXMuXCIsXG4gIFwiLSBVc2Ugd2lraSBsaW5rcyB3aGVuIHVzZWZ1bCBhbmQgc3VwcG9ydGVkIGJ5IHRoZSBwcm92aWRlZCBjb250ZXh0LlwiLFxuICBcIi0gVXNlIHRoZSBjb25maWd1cmVkIG5vdGVzIGZvbGRlciBhcyB0aGUgZGVmYXVsdCBsb2NhdGlvbiBmb3IgbmV3IG5vdGVzLlwiLFxuICBcIi0gSWYgeW91IGFyZSB1bnN1cmUgd2hlcmUgc29tZXRoaW5nIGJlbG9uZ3MsIGFzayBhIHF1ZXN0aW9uIGluc3RlYWQgb2YgZ3Vlc3NpbmcuXCIsXG4gIFwiLSBOZXZlciBkZWxldGUgb3Igb3ZlcndyaXRlIGV4aXN0aW5nIHVzZXIgY29udGVudC5cIixcbiAgXCItIFByb3Bvc2Ugc2FmZSBhcHBlbmQvY3JlYXRlIG9wZXJhdGlvbnMgYW5kIHdhaXQgZm9yIGFwcHJvdmFsIGJlZm9yZSB3cml0aW5nLlwiLFxuICBcIlwiLFxuXS5qb2luKFwiXFxuXCIpO1xuXG5leHBvcnQgY2xhc3MgSW5zdHJ1Y3Rpb25TZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBlbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlRmlsZShcbiAgICAgIHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUsXG4gICAgICBERUZBVUxUX0lOU1RSVUNUSU9OUyxcbiAgICApO1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KGZpbGUucGF0aCwgREVGQVVMVF9JTlNUUlVDVElPTlMpO1xuICAgICAgcmV0dXJuIERFRkFVTFRfSU5TVFJVQ1RJT05TO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGFzeW5jIHJlYWRJbnN0cnVjdGlvbnMoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQgeyBCcmFpbkFJU2VydmljZSB9IGZyb20gXCIuL2FpLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL2luc3RydWN0aW9uLXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0UXVlcnlNYXRjaCwgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1xdWVyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFdyaXRlUGxhbiwgVmF1bHRXcml0ZVNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmF1bHRDaGF0UmVzcG9uc2Uge1xuICBhbnN3ZXI6IHN0cmluZztcbiAgc291cmNlczogVmF1bHRRdWVyeU1hdGNoW107XG4gIHBsYW46IFZhdWx0V3JpdGVQbGFuIHwgbnVsbDtcbiAgdXNlZEFJOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENoYXRFeGNoYW5nZSB7XG4gIHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiO1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmNvbnN0IEVNUFRZX1BMQU46IFZhdWx0V3JpdGVQbGFuID0ge1xuICBzdW1tYXJ5OiBcIlwiLFxuICBjb25maWRlbmNlOiBcImxvd1wiLFxuICBvcGVyYXRpb25zOiBbXSxcbiAgcXVlc3Rpb25zOiBbXSxcbn07XG5jb25zdCBDSEFUX0NPTlRFWFRfTElNSVQgPSA2O1xuY29uc3QgTUFYX0hJU1RPUllfRVhDSEFOR0VTID0gNjtcbmNvbnN0IE1BWF9DT05URVhUX0VYQ0VSUFRfQ0hBUlMgPSAxMjAwO1xuXG5leHBvcnQgY2xhc3MgVmF1bHRDaGF0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluc3RydWN0aW9uU2VydmljZTogSW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcXVlcnlTZXJ2aWNlOiBWYXVsdFF1ZXJ5U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgd3JpdGVTZXJ2aWNlOiBWYXVsdFdyaXRlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyByZXNwb25kKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBoaXN0b3J5OiBDaGF0RXhjaGFuZ2VbXSA9IFtdLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICApOiBQcm9taXNlPFZhdWx0Q2hhdFJlc3BvbnNlPiB7XG4gICAgY29uc3QgdHJpbW1lZCA9IG1lc3NhZ2UudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRW50ZXIgYSBtZXNzYWdlIGZpcnN0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IFtpbnN0cnVjdGlvbnMsIHNvdXJjZXNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UucmVhZEluc3RydWN0aW9ucygpLFxuICAgICAgdGhpcy5xdWVyeVNlcnZpY2UucXVlcnlWYXVsdCh0cmltbWVkKSxcbiAgICBdKTtcbiAgICBjb25zdCBjb250ZXh0ID0gZm9ybWF0U291cmNlc0ZvclByb21wdChzb3VyY2VzLnNsaWNlKDAsIENIQVRfQ09OVEVYVF9MSU1JVCkpO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdmF1bHRCYXNlUGF0aCA9IHRoaXMudmF1bHRTZXJ2aWNlLmdldEJhc2VQYXRoKCk7XG4gICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMoc2V0dGluZ3MpO1xuICAgIGlmICghYWlTdGF0dXMuY29uZmlndXJlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGFpU3RhdHVzLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5haVNlcnZpY2UuY29tcGxldGVDaGF0KFxuICAgICAgW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgICAgICBjb250ZW50OiBidWlsZFN5c3RlbVByb21wdChpbnN0cnVjdGlvbnMsIHNldHRpbmdzKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgIGNvbnRlbnQ6IGJ1aWxkVXNlclByb21wdCh0cmltbWVkLCB2YXVsdEJhc2VQYXRoLCBjb250ZXh0LCBoaXN0b3J5KSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzZXR0aW5ncyxcbiAgICAgIHZhdWx0QmFzZVBhdGgsXG4gICAgICBzaWduYWwsXG4gICAgKTtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUNoYXRSZXNwb25zZShyZXNwb25zZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogcGFyc2VkLmFuc3dlciB8fCBcIkNvZGV4IHJldHVybmVkIG5vIGFuc3dlci5cIixcbiAgICAgIHNvdXJjZXMsXG4gICAgICBwbGFuOiBwYXJzZWQucGxhbiA/IHRoaXMud3JpdGVTZXJ2aWNlLm5vcm1hbGl6ZVBsYW4ocGFyc2VkLnBsYW4pIDogbnVsbCxcbiAgICAgIHVzZWRBSTogdHJ1ZSxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU3lzdGVtUHJvbXB0KFxuICBpbnN0cnVjdGlvbnM6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gW1xuICAgIFwiWW91IGFyZSBCcmFpbiwgYW4gT2JzaWRpYW4gdmF1bHQgYXNzaXN0YW50LlwiLFxuICAgIFwiQW5zd2VyIGRpcmVjdGx5IGZyb20gdGhlIE9ic2lkaWFuIHZhdWx0IG1hcmtkb3duLlwiLFxuICAgIFwiWW91IG1heSBpbnNwZWN0IG1hcmtkb3duIGZpbGVzIGluIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5IHdpdGggcmVhZC1vbmx5IHNoZWxsIGNvbW1hbmRzLlwiLFxuICAgIFwiTmV2ZXIgY2xhaW0gZmFjdHMgdGhhdCBhcmUgbm90IHN1cHBvcnRlZCBieSB2YXVsdCBtYXJrZG93biBvciB0aGUgcHJvdmlkZWQgc291cmNlIGhpbnRzLlwiLFxuICAgIFwiRm9yIHNpbXBsZSBxdWVzdGlvbnMsIGFuc3dlciBpbiBvbmUgb3IgdHdvIHNlbnRlbmNlcy5cIixcbiAgICBcIkZvciBmaWxpbmcgcmVxdWVzdHMsIHByb3Bvc2Ugc2FmZSB2YXVsdCB3cml0ZXMuXCIsXG4gICAgXCJSZXR1cm4gb25seSBhIEpTT04gb2JqZWN0LlwiLFxuICAgIFwiXCIsXG4gICAgXCJSZXR1cm4gdGhpcyBKU09OIHNoYXBlOlwiLFxuICAgIFwie1wiLFxuICAgICcgIFwiYW5zd2VyXCI6IFwibWFya2Rvd24gYW5zd2VyIHdpdGggZXZpZGVuY2UgYW5kIGdhcHNcIiwnLFxuICAgICcgIFwicGxhblwiOiB7JyxcbiAgICAnICAgIFwic3VtbWFyeVwiOiBcInNob3J0IHN1bW1hcnkgb2YgcHJvcG9zZWQgd3JpdGVzLCBvciBlbXB0eSBzdHJpbmdcIiwnLFxuICAgICcgICAgXCJjb25maWRlbmNlXCI6IFwibG93fG1lZGl1bXxoaWdoXCIsJyxcbiAgICAnICAgIFwib3BlcmF0aW9uc1wiOiBbJyxcbiAgICAnICAgICAge1widHlwZVwiOlwiYXBwZW5kXCIsXCJwYXRoXCI6XCJTb21lL0ZpbGUubWRcIixcImNvbnRlbnRcIjpcIm1hcmtkb3duXCJ9LCcsXG4gICAgJyAgICAgIHtcInR5cGVcIjpcImNyZWF0ZVwiLFwicGF0aFwiOlwiU29tZS9OZXcgRmlsZS5tZFwiLFwiY29udGVudFwiOlwibWFya2Rvd25cIn0nLFxuICAgIFwiICAgIF0sXCIsXG4gICAgJyAgICBcInF1ZXN0aW9uc1wiOiBbXCJvcGVuIHF1ZXN0aW9uIGlmIHlvdSBuZWVkIGNsYXJpZmljYXRpb25cIl0nLFxuICAgIFwiICB9XCIsXG4gICAgXCJ9XCIsXG4gICAgXCJcIixcbiAgICBcIk9ubHkgaW5jbHVkZSB3cml0ZSBvcGVyYXRpb25zIHdoZW4gdGhlIHVzZXIgYXNrcyB0byBhZGQsIHNhdmUsIGZpbGUsIHJlbWVtYmVyLCB1cGRhdGUsIGNyZWF0ZSwgb3Igb3RoZXJ3aXNlIHB1dCBpbmZvcm1hdGlvbiBpbnRvIHRoZSB2YXVsdC5cIixcbiAgICBcIlVzZSBhcHBlbmQvY3JlYXRlIG9wZXJhdGlvbnMgb25seS4gRG8gbm90IHByb3Bvc2UgZGVsZXRlIG9yIHJlcGxhY2Ugb3BlcmF0aW9ucy5cIixcbiAgICBgRGVmYXVsdCBub3RlcyBmb2xkZXI6ICR7c2V0dGluZ3Mubm90ZXNGb2xkZXJ9YCxcbiAgICBcIlwiLFxuICAgIFwiVmF1bHQgaW5zdHJ1Y3Rpb25zOlwiLFxuICAgIGluc3RydWN0aW9ucyxcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBidWlsZFVzZXJQcm9tcHQoXG4gIG1lc3NhZ2U6IHN0cmluZyxcbiAgdmF1bHRCYXNlUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgY29udGV4dDogc3RyaW5nLFxuICBoaXN0b3J5OiBDaGF0RXhjaGFuZ2VbXSxcbik6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGNvbnN0IHJlY2VudEhpc3RvcnkgPSBoaXN0b3J5LnNsaWNlKC1NQVhfSElTVE9SWV9FWENIQU5HRVMpO1xuICBpZiAocmVjZW50SGlzdG9yeS5sZW5ndGggPiAwKSB7XG4gICAgcGFydHMucHVzaChcIkNvbnZlcnNhdGlvbiBoaXN0b3J5OlwiKTtcbiAgICBmb3IgKGNvbnN0IGV4Y2hhbmdlIG9mIHJlY2VudEhpc3RvcnkpIHtcbiAgICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgICBwYXJ0cy5wdXNoKGAke2V4Y2hhbmdlLnJvbGUgPT09IFwidXNlclwiID8gXCJVc2VyXCIgOiBcIkJyYWluXCJ9OmApO1xuICAgICAgcGFydHMucHVzaChleGNoYW5nZS50ZXh0KTtcbiAgICB9XG4gICAgcGFydHMucHVzaChcIlwiKTtcbiAgICBwYXJ0cy5wdXNoKFwiLS0tXCIpO1xuICAgIHBhcnRzLnB1c2goXCJcIik7XG4gIH1cblxuICBwYXJ0cy5wdXNoKGBVc2VyIG1lc3NhZ2U6ICR7bWVzc2FnZX1gKTtcbiAgcGFydHMucHVzaChcIlwiKTtcbiAgcGFydHMucHVzaChcbiAgICB2YXVsdEJhc2VQYXRoXG4gICAgICA/IFwiWW91IGFyZSBydW5uaW5nIGZyb20gdGhlIE9ic2lkaWFuIHZhdWx0IHJvb3QuIFVzZSByZWFkLW9ubHkgc2hlbGwgY29tbWFuZHMgb25seSBpZiB5b3UgbmVlZCB0byBpbnNwZWN0IG1hcmtkb3duIGZpbGVzLlwiXG4gICAgICA6IFwiVXNlIHRoZSByZWxldmFudCB2YXVsdCBjb250ZXh0IGJlbG93LlwiLFxuICApO1xuICBwYXJ0cy5wdXNoKFwiXCIpO1xuICBwYXJ0cy5wdXNoKFwiUmVsZXZhbnQgc291cmNlIGhpbnRzOlwiKTtcbiAgcGFydHMucHVzaChjb250ZXh0IHx8IFwiTm8gbWF0Y2hpbmcgdmF1bHQgZmlsZXMgZm91bmQuXCIpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRTb3VyY2VzRm9yUHJvbXB0KHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNvdXJjZXNcbiAgICAubWFwKChzb3VyY2UsIGluZGV4KSA9PiBbXG4gICAgICBgIyMgU291cmNlICR7aW5kZXggKyAxfTogJHtzb3VyY2UucGF0aH1gLFxuICAgICAgYFRpdGxlOiAke3NvdXJjZS50aXRsZX1gLFxuICAgICAgYFJlYXNvbjogJHtzb3VyY2UucmVhc29ufWAsXG4gICAgICBcIlwiLFxuICAgICAgc291cmNlLmV4Y2VycHQuc2xpY2UoMCwgTUFYX0NPTlRFWFRfRVhDRVJQVF9DSEFSUyksXG4gICAgXS5qb2luKFwiXFxuXCIpKVxuICAgIC5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZUNoYXRSZXNwb25zZShyZXNwb25zZTogc3RyaW5nKToge1xuICBhbnN3ZXI6IHN0cmluZztcbiAgcGxhbjogVmF1bHRXcml0ZVBsYW4gfCBudWxsO1xufSB7XG4gIGNvbnN0IGpzb25UZXh0ID0gZXh0cmFjdEpzb24ocmVzcG9uc2UpO1xuICBpZiAoIWpzb25UZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogcmVzcG9uc2UudHJpbSgpLFxuICAgICAgcGxhbjogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25UZXh0KSBhcyB7XG4gICAgICBhbnN3ZXI/OiB1bmtub3duO1xuICAgICAgcGxhbj86IHVua25vd247XG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiB0eXBlb2YgcGFyc2VkLmFuc3dlciA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlZC5hbnN3ZXIudHJpbSgpIDogXCJcIixcbiAgICAgIHBsYW46IGlzUGxhbk9iamVjdChwYXJzZWQucGxhbikgPyBwYXJzZWQucGxhbiA6IEVNUFRZX1BMQU4sXG4gICAgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogcmVzcG9uc2UudHJpbSgpLFxuICAgICAgcGxhbjogbnVsbCxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RKc29uKHRleHQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBmZW5jZWQgPSB0ZXh0Lm1hdGNoKC9gYGAoPzpqc29uKT9cXHMqKFtcXHNcXFNdKj8pYGBgL2kpPy5bMV07XG4gIGlmIChmZW5jZWQpIHtcbiAgICByZXR1cm4gZmVuY2VkLnRyaW0oKTtcbiAgfVxuICBjb25zdCBzdGFydCA9IHRleHQuaW5kZXhPZihcIntcIik7XG4gIGNvbnN0IGVuZCA9IHRleHQubGFzdEluZGV4T2YoXCJ9XCIpO1xuICBpZiAoc3RhcnQgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHwgZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHRleHQuc2xpY2Uoc3RhcnQsIGVuZCArIDEpO1xufVxuXG5mdW5jdGlvbiBpc1BsYW5PYmplY3QodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBWYXVsdFdyaXRlUGxhbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGw7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncywgcGFyc2VFeGNsdWRlRm9sZGVycyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0UXVlcnlNYXRjaCB7XG4gIHBhdGg6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGV4Y2VycHQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5jb25zdCBNQVhfUVVFUllfRklMRVMgPSAxMjtcbmNvbnN0IE1BWF9FWENFUlBUX0NIQVJTID0gNzAwO1xuY29uc3QgTUFYX1NOSVBQRVRfTElORVMgPSA1O1xuY29uc3QgU1RPUF9XT1JEUyA9IG5ldyBTZXQoW1xuICBcImFib3V0XCIsXG4gIFwiYXJlXCIsXG4gIFwiY2FuXCIsXG4gIFwiZGlkXCIsXG4gIFwiZG9lc1wiLFxuICBcImZvclwiLFxuICBcImZyb21cIixcbiAgXCJoYXZlXCIsXG4gIFwiaG93XCIsXG4gIFwiaW50b1wiLFxuICBcImlzXCIsXG4gIFwia25vd1wiLFxuICBcImxpc3RcIixcbiAgXCJteVwiLFxuICBcInRoZVwiLFxuICBcInRoaXNcIixcbiAgXCJ0aGF0XCIsXG4gIFwid2hhdFwiLFxuICBcIndoZW5cIixcbiAgXCJ3aGVyZVwiLFxuICBcIndoaWNoXCIsXG4gIFwid2hvXCIsXG4gIFwid2h5XCIsXG4gIFwid2l0aFwiLFxuXSk7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFF1ZXJ5U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgcXVlcnlWYXVsdChxdWVyeTogc3RyaW5nLCBsaW1pdCA9IE1BWF9RVUVSWV9GSUxFUyk6IFByb21pc2U8VmF1bHRRdWVyeU1hdGNoW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHRva2VucyA9IHRva2VuaXplKHF1ZXJ5KTtcbiAgICBjb25zdCBleGNsdWRlRm9sZGVycyA9IHBhcnNlRXhjbHVkZUZvbGRlcnMoc2V0dGluZ3MuZXhjbHVkZUZvbGRlcnMpO1xuICAgIGNvbnN0IGZpbGVzID0gKGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCkpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBzaG91bGRJbmNsdWRlRmlsZShmaWxlLCBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLCBleGNsdWRlRm9sZGVycykpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuXG4gICAgY29uc3QgbWF0Y2hlczogVmF1bHRRdWVyeU1hdGNoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZUZpbGUoZmlsZSwgdGV4dCwgcXVlcnksIHRva2Vucyk7XG4gICAgICBpZiAoc2NvcmUgPD0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGZpbGUucGF0aCxcbiAgICAgICAgdGl0bGU6IHRpdGxlRm9yRmlsZShmaWxlLCB0ZXh0KSxcbiAgICAgICAgc2NvcmUsXG4gICAgICAgIHJlYXNvbjogYnVpbGRSZWFzb24oZmlsZSwgdGV4dCwgcXVlcnksIHRva2VucyksXG4gICAgICAgIGV4Y2VycHQ6IGJ1aWxkRXhjZXJwdCh0ZXh0LCB0b2tlbnMpLFxuICAgICAgICB0ZXh0LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc2NvcmUgLSBsZWZ0LnNjb3JlKVxuICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRJbmNsdWRlRmlsZShmaWxlOiBURmlsZSwgaW5zdHJ1Y3Rpb25zRmlsZTogc3RyaW5nLCBleGNsdWRlRm9sZGVyczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgaWYgKGZpbGUucGF0aCA9PT0gaW5zdHJ1Y3Rpb25zRmlsZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBleGNsdWRlRm9sZGVycykge1xuICAgIGNvbnN0IHByZWZpeCA9IGZvbGRlci5lbmRzV2l0aChcIi9cIikgPyBmb2xkZXIgOiBgJHtmb2xkZXJ9L2A7XG4gICAgaWYgKGZpbGUucGF0aCA9PT0gZm9sZGVyIHx8IGZpbGUucGF0aC5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZShpbnB1dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJldHVybiBpbnB1dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnNwbGl0KC9bXmEtejAtOV8vLV0rL2kpXG4gICAgLm1hcCgodG9rZW4pID0+IHRva2VuLnRyaW0oKSlcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gdG9rZW4ubGVuZ3RoID49IDMpXG4gICAgLmZpbHRlcigodG9rZW4pID0+ICFTVE9QX1dPUkRTLmhhcyh0b2tlbikpXG4gICAgLmZpbHRlcigodG9rZW4pID0+IHtcbiAgICAgIGlmIChzZWVuLmhhcyh0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQodG9rZW4pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbiAgICAuc2xpY2UoMCwgMjQpO1xufVxuXG5mdW5jdGlvbiBzY29yZUZpbGUoZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGlmICghdG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGZpbGUuc3RhdC5tdGltZSAvIDEwMDAwMDAwMDAwMDApKTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbm9ybWFsaXplZFRleHQuaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDE4O1xuICB9XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbG93ZXJQYXRoLmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICBzY29yZSArPSAyNDtcbiAgfVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGlmIChsb3dlclBhdGguaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBzY29yZSArPSAxMDtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBzY29yZSArPSA5O1xuICAgIH1cbiAgICBjb25zdCBoZWFkaW5nTWF0Y2hlcyA9IGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCwgXCJnXCIpKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IGhlYWRpbmdNYXRjaGVzLmxlbmd0aCAqIDc7XG4gICAgfVxuICAgIGNvbnN0IGxpbmtNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYFxcXFxbXFxcXFtbXlxcXFxdXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9W15cXFxcXV0qXFxcXF1cXFxcXWAsIFwiZ1wiKSk7XG4gICAgaWYgKGxpbmtNYXRjaGVzKSB7XG4gICAgICBzY29yZSArPSBsaW5rTWF0Y2hlcy5sZW5ndGggKiA2O1xuICAgIH1cbiAgICBjb25zdCB0YWdNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJnaVwiKSk7XG4gICAgaWYgKHRhZ01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IHRhZ01hdGNoZXMubGVuZ3RoICogNTtcbiAgICB9XG4gICAgY29uc3QgdGV4dE1hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodG9rZW4pLCBcImdcIikpO1xuICAgIGlmICh0ZXh0TWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gTWF0aC5taW4oOCwgdGV4dE1hdGNoZXMubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtYXRjaGVkVG9rZW5zID0gdG9rZW5zLmZpbHRlcigodG9rZW4pID0+IGxvd2VyUGF0aC5pbmNsdWRlcyh0b2tlbikgfHwgbG93ZXJUZXh0LmluY2x1ZGVzKHRva2VuKSk7XG4gIHNjb3JlICs9IG1hdGNoZWRUb2tlbnMubGVuZ3RoICogMztcbiAgaWYgKG1hdGNoZWRUb2tlbnMubGVuZ3RoID09PSB0b2tlbnMubGVuZ3RoKSB7XG4gICAgc2NvcmUgKz0gTWF0aC5taW4oMTAsIHRva2Vucy5sZW5ndGggKiAyKTtcbiAgfVxuICBjb25zdCBhZ2VNcyA9IERhdGUubm93KCkgLSBmaWxlLnN0YXQubXRpbWU7XG4gIGNvbnN0IGFnZURheXMgPSBhZ2VNcyAvICgxMDAwICogNjAgKiA2MCAqIDI0KTtcbiAgaWYgKGFnZURheXMgPCAxKSB7XG4gICAgc2NvcmUgKz0gMTA7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDcpIHtcbiAgICBzY29yZSArPSA2O1xuICB9IGVsc2UgaWYgKGFnZURheXMgPCAzMCkge1xuICAgIHNjb3JlICs9IDM7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDkwKSB7XG4gICAgc2NvcmUgKz0gMTtcbiAgfVxuICByZXR1cm4gc2NvcmU7XG59XG5cbmZ1bmN0aW9uIHRpdGxlRm9yRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGVhZGluZyA9IHRleHQubWF0Y2goL14jXFxzKyguKykkL20pPy5bMV0/LnRyaW0oKTtcbiAgaWYgKGhlYWRpbmcpIHtcbiAgICByZXR1cm4gaGVhZGluZztcbiAgfVxuICByZXR1cm4gZmlsZS5iYXNlbmFtZSB8fCBmaWxlLnBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGUucGF0aDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZWFzb24oZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGNvbnN0IHJlYXNvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgcmVhc29ucy5hZGQoXCJleGFjdCBwaHJhc2UgbWF0Y2hcIik7XG4gIH1cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAobG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHBhdGggbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgdGl0bGUgbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCkpKSB7XG4gICAgICByZWFzb25zLmFkZChgaGVhZGluZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKGBbWyR7dG9rZW59YCkgfHwgbG93ZXJUZXh0LmluY2x1ZGVzKGAke3Rva2VufV1dYCkpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBsaW5rIG1lbnRpb25zIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJpXCIpKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHRhZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYGNvbnRlbnQgbWVudGlvbnMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKHJlYXNvbnMpLnNsaWNlKDAsIDMpLmpvaW4oXCIsIFwiKSB8fCBcInJlY2VudCBtYXJrZG93biBub3RlXCI7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRXhjZXJwdCh0ZXh0OiBzdHJpbmcsIHRva2Vuczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VMaW5lcyA9IHRleHQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IHJhbmtlZCA9IHNvdXJjZUxpbmVzXG4gICAgLm1hcCgobGluZSwgaW5kZXgpID0+ICh7IGluZGV4LCBzY29yZTogc2NvcmVMaW5lKGxpbmUsIHRva2VucykgfSkpXG4gICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zY29yZSAtIGxlZnQuc2NvcmUgfHwgbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4KTtcbiAgY29uc3QgYmVzdExpbmUgPSByYW5rZWQuZmluZCgobGluZSkgPT4gbGluZS5zY29yZSA+IDApPy5pbmRleCA/PyAwO1xuICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIGJlc3RMaW5lIC0gMik7XG4gIGNvbnN0IGVuZCA9IE1hdGgubWluKHNvdXJjZUxpbmVzLmxlbmd0aCwgc3RhcnQgKyBNQVhfU05JUFBFVF9MSU5FUyk7XG4gIGNvbnN0IGV4Y2VycHQgPSBzb3VyY2VMaW5lc1xuICAgIC5zbGljZShzdGFydCwgZW5kKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIGV4Y2VycHQubGVuZ3RoID4gTUFYX0VYQ0VSUFRfQ0hBUlNcbiAgICA/IGAke2V4Y2VycHQuc2xpY2UoMCwgTUFYX0VYQ0VSUFRfQ0hBUlMgLSAzKS50cmltRW5kKCl9Li4uYFxuICAgIDogZXhjZXJwdDtcbn1cblxuZnVuY3Rpb24gc2NvcmVMaW5lKGxpbmU6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICBsZXQgc2NvcmUgPSAwO1xuICBpZiAobGluZS50cmltKCkuc3RhcnRzV2l0aChcIiNcIikpIHtcbiAgICBzY29yZSArPSA0O1xuICB9XG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKCFsb3dlci5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBzY29yZSArPSAzO1xuICAgIGlmIChsb3dlci5pbmNsdWRlcyhgW1ske3Rva2VufWApIHx8IGxvd2VyLmluY2x1ZGVzKGAke3Rva2VufV1dYCkpIHtcbiAgICAgIHNjb3JlICs9IDI7XG4gICAgfVxuICAgIGlmIChsb3dlci5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxccykjWy0vX2EtejAtOV0qJHtlc2NhcGVSZWdFeHAodG9rZW4pfVstL19hLXowLTldKmAsIFwiaVwiKSkpIHtcbiAgICAgIHNjb3JlICs9IDI7XG4gICAgfVxuICB9XG4gIHJldHVybiBzY29yZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUGhyYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIEZpbGVTeXN0ZW1BZGFwdGVyLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgbm9ybWFsaXplUGF0aCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgU2V0KFtcbiAgICAgIHNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgcGFyZW50Rm9sZGVyKHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUpLFxuICAgIF0pO1xuXG4gICAgZm9yIChjb25zdCBmb2xkZXIgb2YgZm9sZGVycykge1xuICAgICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoZm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUZvbGRlcklmTWlzc2luZyhjdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIShleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZvbGRlcjogJHtjdXJyZW50fWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgaW5pdGlhbENvbnRlbnQgPSBcIlwiKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIobm9ybWFsaXplZCkpO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaW5pdGlhbENvbnRlbnQpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBjdXJyZW50Lmxlbmd0aCA9PT0gMFxuICAgICAgPyBcIlwiXG4gICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cXG5cIilcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblwiKVxuICAgICAgICAgID8gXCJcXG5cIlxuICAgICAgICAgIDogXCJcXG5cXG5cIjtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCR7Y3VycmVudH0ke3NlcGFyYXRvcn0ke25vcm1hbGl6ZWRDb250ZW50fWApO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5vcm1hbGl6ZWRDb250ZW50KTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZVVuaXF1ZUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZG90SW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90SW5kZXggPT09IC0xID8gbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90SW5kZXgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdEluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKGRvdEluZGV4KTtcblxuICAgIGxldCBjb3VudGVyID0gMjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtjb3VudGVyfSR7ZXh0ZW5zaW9ufWA7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbGlzdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgfVxuXG4gIGdldEJhc2VQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5hZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXJcbiAgICAgID8gdGhpcy5hcHAudmF1bHQuYWRhcHRlci5nZXRCYXNlUGF0aCgpXG4gICAgICA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUZvbGRlcklmTWlzc2luZyhmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGZvbGRlclBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJQYXRoKTtcbiAgICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBhcmVudEZvbGRlcihmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICBjb25zdCBpbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpO1xuICByZXR1cm4gaW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FmZU1hcmtkb3duUGF0aChcbiAgcGF0aDogc3RyaW5nLFxuICBzZXR0aW5ncz86IFBpY2s8QnJhaW5QbHVnaW5TZXR0aW5ncywgXCJpbnN0cnVjdGlvbnNGaWxlXCI+LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICBjb25zdCBpc1NhZmUgPVxuICAgIEJvb2xlYW4ocGF0aCkgJiZcbiAgICBwYXRoLmVuZHNXaXRoKFwiLm1kXCIpICYmXG4gICAgIXBhdGguaW5jbHVkZXMoXCIuLlwiKSAmJlxuICAgIHNlZ21lbnRzLmV2ZXJ5KChzZWdtZW50KSA9PiAhc2VnbWVudC5zdGFydHNXaXRoKFwiLlwiKSk7XG5cbiAgaWYgKCFpc1NhZmUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoc2V0dGluZ3MgJiYgcGF0aCA9PT0gc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGlzU2FmZU1hcmtkb3duUGF0aCB9IGZyb20gXCIuLi91dGlscy9wYXRoLXNhZmV0eVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgdHlwZSBWYXVsdFdyaXRlT3BlcmF0aW9uID1cbiAgfCB7XG4gICAgICB0eXBlOiBcImFwcGVuZFwiO1xuICAgICAgcGF0aDogc3RyaW5nO1xuICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwiY3JlYXRlXCI7XG4gICAgICBwYXRoOiBzdHJpbmc7XG4gICAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0V3JpdGVQbGFuIHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBjb25maWRlbmNlOiBcImxvd1wiIHwgXCJtZWRpdW1cIiB8IFwiaGlnaFwiO1xuICBvcGVyYXRpb25zOiBWYXVsdFdyaXRlT3BlcmF0aW9uW107XG4gIHF1ZXN0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFdyaXRlU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgbm9ybWFsaXplUGxhbihwbGFuOiBQYXJ0aWFsPFZhdWx0V3JpdGVQbGFuPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogVmF1bHRXcml0ZVBsYW4ge1xuICAgIGNvbnN0IGNvbmZpZGVuY2UgPSByZWFkQ29uZmlkZW5jZShwbGFuLmNvbmZpZGVuY2UpO1xuICAgIHJldHVybiB7XG4gICAgICBzdW1tYXJ5OiB0eXBlb2YgcGxhbi5zdW1tYXJ5ID09PSBcInN0cmluZ1wiICYmIHBsYW4uc3VtbWFyeS50cmltKClcbiAgICAgICAgPyBwbGFuLnN1bW1hcnkudHJpbSgpXG4gICAgICAgIDogXCJCcmFpbiBwcm9wb3NlZCB2YXVsdCB1cGRhdGVzLlwiLFxuICAgICAgY29uZmlkZW5jZSxcbiAgICAgIG9wZXJhdGlvbnM6IChBcnJheS5pc0FycmF5KHBsYW4ub3BlcmF0aW9ucykgPyBwbGFuLm9wZXJhdGlvbnMgOiBbXSlcbiAgICAgICAgLm1hcCgob3BlcmF0aW9uKSA9PiB0aGlzLm5vcm1hbGl6ZU9wZXJhdGlvbihvcGVyYXRpb24pKVxuICAgICAgICAuZmlsdGVyKChvcGVyYXRpb24pOiBvcGVyYXRpb24gaXMgVmF1bHRXcml0ZU9wZXJhdGlvbiA9PiBvcGVyYXRpb24gIT09IG51bGwpXG4gICAgICAgIC5zbGljZSgwLCA4KSxcbiAgICAgIHF1ZXN0aW9uczogKEFycmF5LmlzQXJyYXkocGxhbi5xdWVzdGlvbnMpID8gcGxhbi5xdWVzdGlvbnMgOiBbXSlcbiAgICAgICAgLm1hcCgocXVlc3Rpb24pID0+IFN0cmluZyhxdWVzdGlvbikudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5zbGljZSgwLCA1KSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgYXBwbHlQbGFuKHBsYW46IFZhdWx0V3JpdGVQbGFuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgcGF0aHM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBvcGVyYXRpb24gb2YgcGxhbi5vcGVyYXRpb25zKSB7XG4gICAgICBpZiAoIWlzU2FmZU1hcmtkb3duUGF0aChvcGVyYXRpb24ucGF0aCwgc2V0dGluZ3MpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKG9wZXJhdGlvbi50eXBlID09PSBcImFwcGVuZFwiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQob3BlcmF0aW9uLnBhdGgsIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICAgICAgcGF0aHMucHVzaChvcGVyYXRpb24ucGF0aCk7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbi50eXBlID09PSBcImNyZWF0ZVwiKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChvcGVyYXRpb24ucGF0aCk7XG4gICAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHBhdGgsIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICAgICAgcGF0aHMucHVzaChwYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20obmV3IFNldChwYXRocykpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemVPcGVyYXRpb24ob3BlcmF0aW9uOiB1bmtub3duKTogVmF1bHRXcml0ZU9wZXJhdGlvbiB8IG51bGwge1xuICAgIGlmICghb3BlcmF0aW9uIHx8IHR5cGVvZiBvcGVyYXRpb24gIT09IFwib2JqZWN0XCIgfHwgIShcInR5cGVcIiBpbiBvcGVyYXRpb24pKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPSBvcGVyYXRpb24gYXMgUGFydGlhbDxWYXVsdFdyaXRlT3BlcmF0aW9uPjtcbiAgICBjb25zdCBjb250ZW50ID0gXCJjb250ZW50XCIgaW4gY2FuZGlkYXRlID8gU3RyaW5nKGNhbmRpZGF0ZS5jb250ZW50ID8/IFwiXCIpLnRyaW0oKSA6IFwiXCI7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoY2FuZGlkYXRlLnR5cGUgIT09IFwiYXBwZW5kXCIgJiYgY2FuZGlkYXRlLnR5cGUgIT09IFwiY3JlYXRlXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdGggPSBcInBhdGhcIiBpbiBjYW5kaWRhdGVcbiAgICAgID8gbm9ybWFsaXplTWFya2Rvd25QYXRoKFN0cmluZyhjYW5kaWRhdGUucGF0aCA/PyBcIlwiKSlcbiAgICAgIDogXCJcIjtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGlmICghaXNTYWZlTWFya2Rvd25QYXRoKHBhdGgsIHNldHRpbmdzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IGNhbmRpZGF0ZS50eXBlLFxuICAgICAgcGF0aCxcbiAgICAgIGNvbnRlbnQsXG4gICAgICBkZXNjcmlwdGlvbjogcmVhZERlc2NyaXB0aW9uKGNhbmRpZGF0ZSksXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkRGVzY3JpcHRpb24ob3BlcmF0aW9uOiBQYXJ0aWFsPFZhdWx0V3JpdGVPcGVyYXRpb24+KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHR5cGVvZiBvcGVyYXRpb24uZGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb3BlcmF0aW9uLmRlc2NyaXB0aW9uLnRyaW0oKVxuICAgID8gb3BlcmF0aW9uLmRlc2NyaXB0aW9uLnRyaW0oKVxuICAgIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiByZWFkQ29uZmlkZW5jZSh2YWx1ZTogdW5rbm93bik6IFZhdWx0V3JpdGVQbGFuW1wiY29uZmlkZW5jZVwiXSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gXCJsb3dcIiB8fCB2YWx1ZSA9PT0gXCJtZWRpdW1cIiB8fCB2YWx1ZSA9PT0gXCJoaWdoXCIgPyB2YWx1ZSA6IFwibWVkaXVtXCI7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU1hcmtkb3duUGF0aCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnRyaW0oKVxuICAgIC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKVxuICAgIC5yZXBsYWNlKC9cXC8rL2csIFwiL1wiKVxuICAgIC5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgSXRlbVZpZXcsIE1hcmtkb3duUmVuZGVyZXIsIFRGaWxlLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IFZhdWx0Q2hhdFJlc3BvbnNlLCBDaGF0RXhjaGFuZ2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtY2hhdC1zZXJ2aWNlXCI7XG5pbXBvcnQgdHlwZSB7IFZhdWx0UXVlcnlNYXRjaCB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1xdWVyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFBsYW5Nb2RhbCB9IGZyb20gXCIuL3ZhdWx0LXBsYW4tbW9kYWxcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQge1xuICBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbiAgQ29kZXhNb2RlbE9wdGlvbixcbiAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zLFxuICBpc0tub3duQ29kZXhNb2RlbCxcbn0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LW1vZGVsc1wiO1xuXG5pbnRlcmZhY2UgQXBwV2l0aFNldHRpbmdzIGV4dGVuZHMgQXBwIHtcbiAgc2V0dGluZz86IHtcbiAgICBvcGVuKCk6IHZvaWQ7XG4gICAgb3BlblRhYkJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQ7XG4gIH07XG59XG5cbmludGVyZmFjZSBDaGF0VHVybiB7XG4gIHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgdXBkYXRlZFBhdGhzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSBtZXNzYWdlc0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlbFJvd0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2VuZEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RvcEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgY2xlYXJCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgaXNMb2FkaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgY3VycmVudEFib3J0Q29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YXJ0ZWRBdCA9IDA7XG4gIHByaXZhdGUgbG9hZGluZ1RpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nVGV4dCA9IFwiXCI7XG4gIHByaXZhdGUgbG9hZGluZ1RleHRFbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZW5kZXJHZW5lcmF0aW9uID0gMDtcbiAgcHJpdmF0ZSByZXNpemVGcmFtZUlkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0dXJuczogQ2hhdFR1cm5bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQlJBSU5fVklFV19UWVBFO1xuICB9XG5cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJCcmFpblwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImJyYWluXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLXNpZGViYXJcIik7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1oZWFkZXJcIiB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW5cIiB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQXNrIHlvdXIgdmF1bHQsIG9yIHRlbGwgQnJhaW4gd2hhdCB0byBmaWxlLlwiLFxuICAgIH0pO1xuXG4gICAgdGhpcy5tb2RlbFJvd0VsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbW9kZWwtcm93XCIgfSk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcblxuICAgIHRoaXMubWVzc2FnZXNFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtbWVzc2FnZXNcIiB9KTtcbiAgICB0aGlzLnJlbmRlckVtcHR5U3RhdGUoKTtcblxuICAgIGNvbnN0IGNvbXBvc2VyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY29tcG9zZXJcIiB9KTtcbiAgICB0aGlzLmlucHV0RWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhYm91dCB5b3VyIHZhdWx0LCBvciBwYXN0ZSByb3VnaCBub3RlcyBmb3IgQnJhaW4gdG8gZmlsZS4uLlwiLFxuICAgICAgICByb3dzOiBcIjZcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29tcG9zZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnB1dEVsKTtcbiAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zZW5kTWVzc2FnZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVDb21wb3NlclN0YXRlKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBleGFtcGxlcyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXByb21wdC1jaGlwc1wiIH0pO1xuICAgIHRoaXMuY3JlYXRlUHJvbXB0Q2hpcChleGFtcGxlcywgXCJXaGF0IGRvIEkga25vdyBhYm91dC4uLlwiLCBcIldoYXQgZG8gSSBrbm93IGFib3V0IFwiKTtcbiAgICB0aGlzLmNyZWF0ZVByb21wdENoaXAoZXhhbXBsZXMsIFwiRmlsZSB0aGlzXCIsIFwiRmlsZSB0aGlzIGluIHRoZSByaWdodCBwbGFjZTpcXG5cXG5cIik7XG4gICAgdGhpcy5jcmVhdGVQcm9tcHRDaGlwKGV4YW1wbGVzLCBcIkZpbmQgcmVsYXRlZCBub3Rlc1wiLCBcIkZpbmQgcmVsYXRlZCBub3RlcyBmb3IgXCIpO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWFjdGlvbi1yb3dcIiB9KTtcbiAgICB0aGlzLnNlbmRCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeVwiLFxuICAgICAgdGV4dDogXCJTZW5kXCIsXG4gICAgfSk7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zZW5kTWVzc2FnZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1zdG9wXCIsXG4gICAgICB0ZXh0OiBcIlN0b3BcIixcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zdG9wQ3VycmVudFJlcXVlc3QoKTtcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5kaXNhYmxlZCA9IHRydWU7XG4gICAgYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkluc3RydWN0aW9uc1wiLFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5JbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNsZWFyXCIsXG4gICAgfSk7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnR1cm5zID0gW107XG4gICAgICB2b2lkIHRoaXMucmVuZGVyTWVzc2FnZXMoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3RhdHVzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXN0YXR1c1wiIH0pO1xuICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgaWYgKHRoaXMucmVzaXplRnJhbWVJZCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yZXNpemVGcmFtZUlkKTtcbiAgICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnN0YXR1c0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzRWwuZW1wdHkoKTtcbiAgICBsZXQgYWlDb25maWd1cmVkID0gZmFsc2U7XG4gICAgbGV0IHN0YXR1c1RleHQgPSBcIkNvdWxkIG5vdCBjaGVjayBDb2RleFwiO1xuICAgIGxldCBidXR0b25UZXh0ID0gXCJDb25uZWN0XCI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIGFpQ29uZmlndXJlZCA9IGFpU3RhdHVzLmNvbmZpZ3VyZWQ7XG4gICAgICBzdGF0dXNUZXh0ID0gZm9ybWF0UHJvdmlkZXJTdGF0dXMoYWlTdGF0dXMpO1xuICAgICAgYnV0dG9uVGV4dCA9IGFpQ29uZmlndXJlZCA/IFwiTWFuYWdlXCIgOiBcIkNvbm5lY3RcIjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQUk6ICR7c3RhdHVzVGV4dH0gYCB9KTtcbiAgICB0aGlzLnN0YXR1c0VsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICB0ZXh0OiBidXR0b25UZXh0LFxuICAgIH0pLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBhcHAgPSB0aGlzLmFwcCBhcyBBcHBXaXRoU2V0dGluZ3M7XG4gICAgICBpZiAoIWFwcC5zZXR0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFwcC5zZXR0aW5nLm9wZW4oKTtcbiAgICAgIGFwcC5zZXR0aW5nLm9wZW5UYWJCeUlkKHRoaXMucGx1Z2luLm1hbmlmZXN0LmlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZE1lc3NhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtZXNzYWdlIHx8IHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgICB0aGlzLmFkZFR1cm4oXCJ1c2VyXCIsIG1lc3NhZ2UpO1xuICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSB0aGlzLmJ1aWxkQ2hhdEhpc3RvcnkoKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wbHVnaW4uY2hhdFdpdGhWYXVsdChtZXNzYWdlLCBoaXN0b3J5LCBjb250cm9sbGVyLnNpZ25hbCk7XG4gICAgICB0aGlzLnJlbmRlclJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGlzU3RvcHBlZFJlcXVlc3QoZXJyb3IpKSB7XG4gICAgICAgIHRoaXMuYWRkVHVybihcImJyYWluXCIsIFwiQ29kZXggcmVxdWVzdCBzdG9wcGVkLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgY2hhdCB3aXRoIHRoZSB2YXVsdFwiKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENoYXRIaXN0b3J5KCk6IENoYXRFeGNoYW5nZVtdIHtcbiAgICAvLyBFeGNsdWRlIHRoZSBsYXN0IHR1cm4sIHdoaWNoIGlzIHRoZSBjdXJyZW50IHVzZXIgbWVzc2FnZSBiZWluZyBzZW50LlxuICAgIHJldHVybiB0aGlzLnR1cm5zXG4gICAgICAuc2xpY2UoMCwgLTEpXG4gICAgICAuZmlsdGVyKCh0dXJuKTogdHVybiBpcyBDaGF0VHVybiAmIHsgdGV4dDogc3RyaW5nIH0gPT4gQm9vbGVhbih0dXJuLnRleHQpKVxuICAgICAgLm1hcCgodHVybikgPT4gKHtcbiAgICAgICAgcm9sZTogdHVybi5yb2xlLFxuICAgICAgICB0ZXh0OiB0dXJuLnRleHQsXG4gICAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BDdXJyZW50UmVxdWVzdCgpOiB2b2lkIHtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVByb21wdENoaXAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZywgcHJvbXB0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb250YWluZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXByb21wdC1jaGlwXCIsXG4gICAgICB0ZXh0OiBsYWJlbCxcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gcHJvbXB0O1xuICAgICAgdGhpcy51cGRhdGVDb21wb3NlclN0YXRlKCk7XG4gICAgICB0aGlzLmlucHV0RWwuZm9jdXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTW9kZWxTZWxlY3RvcigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGVsUm93RWwuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RlbC1sYWJlbFwiLFxuICAgICAgdGV4dDogXCJNb2RlbFwiLFxuICAgIH0pO1xuICAgIGlmICh0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcpIHtcbiAgICAgIHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtYWN0aXZlXCIsXG4gICAgICAgIHRleHQ6IFwiTG9hZGluZyBDb2RleCBtb2RlbHMuLi5cIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3QgPSB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzZWxlY3RcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGVsLXNlbGVjdFwiLFxuICAgIH0pO1xuICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRoaXMuaXNMb2FkaW5nO1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHRoaXMubW9kZWxPcHRpb25zKSB7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB2YWx1ZTogb3B0aW9uLnZhbHVlLFxuICAgICAgICB0ZXh0OiBvcHRpb24ubGFiZWwsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHZhbHVlOiBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gICAgICB0ZXh0OiBcIkN1c3RvbS4uLlwiLFxuICAgIH0pO1xuICAgIHNlbGVjdC52YWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdFxuICAgICAgPyBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICAgIDogZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVNb2RlbFNlbGVjdGlvbihzZWxlY3QudmFsdWUpO1xuICAgIH0pO1xuXG4gICAgaWYgKHNlbGVjdC52YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICBpZiAodGhpcy5jdXN0b21Nb2RlbERyYWZ0ICYmIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICAgIHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1tb2RlbC1hY3RpdmVcIixcbiAgICAgICAgICB0ZXh0OiBgQWN0aXZlOiAke3RoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc3QgaW5wdXQgPSB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RlbC1jdXN0b21cIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIkNvZGV4IG1vZGVsIGlkXCIsXG4gICAgICAgIH0sXG4gICAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgaW5wdXQuZGlzYWJsZWQgPSB0aGlzLmlzTG9hZGluZztcbiAgICAgIGlucHV0LnZhbHVlID0gdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8IGlzS25vd25Db2RleE1vZGVsKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUN1c3RvbU1vZGVsKGlucHV0LnZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnMgPSBhd2FpdCBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlTW9kZWxTZWxlY3Rpb24odmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh2YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSB0cnVlO1xuICAgICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSB2YWx1ZTtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUN1c3RvbU1vZGVsKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2RlbCA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1vZGVsKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gbW9kZWw7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclJlc3BvbnNlKHJlc3BvbnNlOiBWYXVsdENoYXRSZXNwb25zZSk6IHZvaWQge1xuICAgIHRoaXMuYWRkVHVybihcImJyYWluXCIsIHJlc3BvbnNlLmFuc3dlci50cmltKCksIHJlc3BvbnNlLnNvdXJjZXMpO1xuXG4gICAgaWYgKHJlc3BvbnNlLnBsYW4gJiYgcmVzcG9uc2UucGxhbi5vcGVyYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIG5ldyBWYXVsdFBsYW5Nb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBwbGFuOiByZXNwb25zZS5wbGFuLFxuICAgICAgICBzZXR0aW5nczogdGhpcy5wbHVnaW4uc2V0dGluZ3MsXG4gICAgICAgIG9uQXBwcm92ZTogYXN5bmMgKHBsYW4pID0+IHRoaXMucGx1Z2luLmFwcGx5VmF1bHRXcml0ZVBsYW4ocGxhbiksXG4gICAgICAgIG9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlLCBwYXRocykgPT4ge1xuICAgICAgICAgIHRoaXMuYWRkVXBkYXRlZEZpbGVUdXJuKG1lc3NhZ2UsIHBhdGhzKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pLm9wZW4oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldExvYWRpbmcobG9hZGluZzogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuaXNMb2FkaW5nID0gbG9hZGluZztcbiAgICBpZiAobG9hZGluZykge1xuICAgICAgdGhpcy5sb2FkaW5nU3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgIHRoaXMudXBkYXRlTG9hZGluZ1RleHQoKTtcbiAgICAgIHRoaXMuc3RhcnRMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMuYXBwZW5kTG9hZGluZ0luZGljYXRvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMubG9hZGluZ1RleHQgPSBcIlwiO1xuICAgICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMuaW5wdXRFbC5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5kaXNhYmxlZCA9ICFsb2FkaW5nO1xuICAgIHRoaXMuc2VuZEJ1dHRvbkVsLmRpc2FibGVkID0gbG9hZGluZyB8fCAhdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQ29tcG9zZXJTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIGlmICh0aGlzLnNlbmRCdXR0b25FbCkge1xuICAgICAgdGhpcy5zZW5kQnV0dG9uRWwuZGlzYWJsZWQgPSB0aGlzLmlzTG9hZGluZyB8fCAhdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGF1dG9SZXNpemVJbnB1dCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5yZXNpemVGcmFtZUlkICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJlc2l6ZUZyYW1lSWQpO1xuICAgIH1cbiAgICB0aGlzLnJlc2l6ZUZyYW1lSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgdGhpcy5yZXNpemVGcmFtZUlkID0gbnVsbDtcbiAgICAgIHRoaXMuaW5wdXRFbC5zdHlsZS5oZWlnaHQgPSBcImF1dG9cIjtcbiAgICAgIHRoaXMuaW5wdXRFbC5zdHlsZS5oZWlnaHQgPSBgJHtNYXRoLm1pbih0aGlzLmlucHV0RWwuc2Nyb2xsSGVpZ2h0LCAyNDApfXB4YDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkVHVybihyb2xlOiBcInVzZXJcIiB8IFwiYnJhaW5cIiwgdGV4dDogc3RyaW5nLCBzb3VyY2VzPzogVmF1bHRRdWVyeU1hdGNoW10pOiB2b2lkIHtcbiAgICBjb25zdCB0dXJuOiBDaGF0VHVybiA9IHsgcm9sZSwgdGV4dCwgc291cmNlcyB9O1xuICAgIHRoaXMudHVybnMucHVzaCh0dXJuKTtcbiAgICB2b2lkIHRoaXMuYXBwZW5kVHVybkVsZW1lbnQodHVybik7XG4gIH1cblxuICBwcml2YXRlIGFkZFVwZGF0ZWRGaWxlVHVybihtZXNzYWdlOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGNvbnN0IHR1cm46IENoYXRUdXJuID0ge1xuICAgICAgcm9sZTogXCJicmFpblwiLFxuICAgICAgdGV4dDogbWVzc2FnZSxcbiAgICAgIHVwZGF0ZWRQYXRoczogcGF0aHMsXG4gICAgfTtcbiAgICB0aGlzLnR1cm5zLnB1c2godHVybik7XG4gICAgdm9pZCB0aGlzLmFwcGVuZFR1cm5FbGVtZW50KHR1cm4pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhcHBlbmRUdXJuRWxlbWVudCh0dXJuOiBDaGF0VHVybik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGdlbmVyYXRpb24gPSArK3RoaXMucmVuZGVyR2VuZXJhdGlvbjtcblxuICAgIGNvbnN0IGVtcHR5RWwgPSB0aGlzLm1lc3NhZ2VzRWwucXVlcnlTZWxlY3RvcihcIi5icmFpbi1jaGF0LWVtcHR5XCIpO1xuICAgIGlmIChlbXB0eUVsKSB7XG4gICAgICBlbXB0eUVsLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIHRoaXMucmVtb3ZlTG9hZGluZ0luZGljYXRvcigpO1xuXG4gICAgY29uc3QgaXRlbSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IGBicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLSR7dHVybi5yb2xlfWAsXG4gICAgfSk7XG4gICAgaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY2hhdC1yb2xlXCIsXG4gICAgICB0ZXh0OiB0dXJuLnJvbGUgPT09IFwidXNlclwiID8gXCJZb3VcIiA6IFwiQnJhaW5cIixcbiAgICB9KTtcbiAgICBjb25zdCBvdXRwdXQgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW91dHB1dFwiIH0pO1xuICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIikge1xuICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIHR1cm4udGV4dCwgb3V0cHV0LCBcIlwiLCB0aGlzKTtcbiAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyU291cmNlcyhpdGVtLCB0dXJuLnNvdXJjZXMpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJVcGRhdGVkRmlsZXMoaXRlbSwgdHVybi51cGRhdGVkUGF0aHMpO1xuICAgIH1cblxuICAgIHRoaXMubWVzc2FnZXNFbC5zY3JvbGxUb3AgPSB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsSGVpZ2h0O1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VzRWwucXVlcnlTZWxlY3RvcihcIi5icmFpbi1jaGF0LW1lc3NhZ2UtbG9hZGluZ1wiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLWJyYWluIGJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIsXG4gICAgfSk7XG4gICAgaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY2hhdC1yb2xlXCIsXG4gICAgICB0ZXh0OiBcIkJyYWluXCIsXG4gICAgfSk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbG9hZGluZ1wiLFxuICAgICAgdGV4dDogdGhpcy5sb2FkaW5nVGV4dCB8fCBcIlJlYWRpbmcgdmF1bHQgY29udGV4dCBhbmQgYXNraW5nIENvZGV4Li4uXCIsXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlc0VsLnNjcm9sbFRvcCA9IHRoaXMubWVzc2FnZXNFbC5zY3JvbGxIZWlnaHQ7XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZUxvYWRpbmdJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgY29uc3QgbG9hZGluZ0VsID0gdGhpcy5tZXNzYWdlc0VsLnF1ZXJ5U2VsZWN0b3IoXCIuYnJhaW4tY2hhdC1tZXNzYWdlLWxvYWRpbmdcIik7XG4gICAgaWYgKGxvYWRpbmdFbCkge1xuICAgICAgbG9hZGluZ0VsLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLmxvYWRpbmdUZXh0RWwgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNZXNzYWdlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBnZW5lcmF0aW9uID0gKyt0aGlzLnJlbmRlckdlbmVyYXRpb247XG4gICAgdGhpcy5tZXNzYWdlc0VsLmVtcHR5KCk7XG4gICAgaWYgKCF0aGlzLnR1cm5zLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJFbXB0eVN0YXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29uc3QgdHVybiBvZiB0aGlzLnR1cm5zKSB7XG4gICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZW5kZXJHZW5lcmF0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IGBicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLSR7dHVybi5yb2xlfWAsXG4gICAgICB9KTtcbiAgICAgIGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tY2hhdC1yb2xlXCIsXG4gICAgICAgIHRleHQ6IHR1cm4ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIllvdVwiIDogXCJCcmFpblwiLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBvdXRwdXQgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW91dHB1dFwiIH0pO1xuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiKSB7XG4gICAgICAgIGF3YWl0IE1hcmtkb3duUmVuZGVyZXIucmVuZGVyKHRoaXMuYXBwLCB0dXJuLnRleHQsIG91dHB1dCwgXCJcIiwgdGhpcyk7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5zZXRUZXh0KHR1cm4udGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJTb3VyY2VzKGl0ZW0sIHR1cm4uc291cmNlcyk7XG4gICAgICB9XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgICB0aGlzLnJlbmRlclVwZGF0ZWRGaWxlcyhpdGVtLCB0dXJuLnVwZGF0ZWRQYXRocyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgdGhpcy5hcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZXNFbC5zY3JvbGxUb3AgPSB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsSGVpZ2h0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGFydExvYWRpbmdUaW1lcigpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICB0aGlzLmxvYWRpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RpbWVyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdUaW1lcik7XG4gICAgICB0aGlzLmxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVMb2FkaW5nVGV4dCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWNvbmRzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMubG9hZGluZ1N0YXJ0ZWRBdCkgLyAxMDAwKSk7XG4gICAgY29uc3QgcmVtYWluaW5nID0gTWF0aC5tYXgoMCwgMTIwIC0gc2Vjb25kcyk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dCA9IGBSZWFkaW5nIHZhdWx0IGNvbnRleHQgYW5kIGFza2luZyBDb2RleC4uLiAke3NlY29uZHN9cyBlbGFwc2VkLCB0aW1lb3V0IGluICR7cmVtYWluaW5nfXMuYDtcbiAgICBpZiAodGhpcy5sb2FkaW5nVGV4dEVsKSB7XG4gICAgICB0aGlzLmxvYWRpbmdUZXh0RWwuc2V0VGV4dCh0aGlzLmxvYWRpbmdUZXh0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckVtcHR5U3RhdGUoKTogdm9pZCB7XG4gICAgY29uc3QgZW1wdHkgPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1lbXB0eVwiIH0pO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJTdGFydCB3aXRoIGEgcXVlc3Rpb24gb3Igcm91Z2ggY2FwdHVyZS5cIiB9KTtcbiAgICBlbXB0eS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgdGV4dDogXCIgQnJhaW4gcmV0cmlldmVzIG1hcmtkb3duIGNvbnRleHQsIGFuc3dlcnMgd2l0aCBzb3VyY2VzLCBhbmQgcHJldmlld3MgcHJvcG9zZWQgd3JpdGVzIGJlZm9yZSBhbnl0aGluZyBjaGFuZ2VzLlwiLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTb3VyY2VzKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdKTogdm9pZCB7XG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRldGFpbHNcIiwgeyBjbHM6IFwiYnJhaW4tc291cmNlc1wiIH0pO1xuICAgIGRldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsIHtcbiAgICAgIHRleHQ6IGBTb3VyY2VzICgke01hdGgubWluKHNvdXJjZXMubGVuZ3RoLCA4KX0pYCxcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2VzLnNsaWNlKDAsIDgpKSB7XG4gICAgICBjb25zdCBzb3VyY2VFbCA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tc291cmNlXCIgfSk7XG4gICAgICBjb25zdCB0aXRsZSA9IHNvdXJjZUVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS10aXRsZVwiLFxuICAgICAgICB0ZXh0OiBzb3VyY2UucGF0aCxcbiAgICAgIH0pO1xuICAgICAgdGl0bGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLm9wZW5Tb3VyY2Uoc291cmNlLnBhdGgpO1xuICAgICAgfSk7XG4gICAgICBzb3VyY2VFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtcmVhc29uXCIsXG4gICAgICAgIHRleHQ6IHNvdXJjZS5yZWFzb24sXG4gICAgICB9KTtcbiAgICAgIGlmIChzb3VyY2UuZXhjZXJwdCkge1xuICAgICAgICBzb3VyY2VFbC5jcmVhdGVFbChcInByZVwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1leGNlcnB0XCIsXG4gICAgICAgICAgdGV4dDogc291cmNlLmV4Y2VycHQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVXBkYXRlZEZpbGVzKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHBhdGhzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGNvbnN0IGZpbGVzID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXVwZGF0ZWQtZmlsZXNcIiB9KTtcbiAgICBmaWxlcy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXJlYXNvblwiLFxuICAgICAgdGV4dDogXCJVcGRhdGVkIGZpbGVzXCIsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIHBhdGhzKSB7XG4gICAgICBjb25zdCBidXR0b24gPSBmaWxlcy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtdGl0bGVcIixcbiAgICAgICAgdGV4dDogcGF0aCxcbiAgICAgIH0pO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuU291cmNlKHBhdGgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuU291cmNlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJvdmlkZXJTdGF0dXMoc3RhdHVzOiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cz4+KTogc3RyaW5nIHtcbiAgaWYgKCFzdGF0dXMuY29uZmlndXJlZCkge1xuICAgIHJldHVybiBzdGF0dXMubWVzc2FnZS5yZXBsYWNlKC9cXC4kLywgXCJcIik7XG4gIH1cbiAgY29uc3QgbW9kZWwgPSBzdGF0dXMubW9kZWwgPyBgICgke3N0YXR1cy5tb2RlbH0pYCA6IFwiXCI7XG4gIHJldHVybiBgQ29kZXgke21vZGVsfWA7XG59XG5cbmZ1bmN0aW9uIGlzU3RvcHBlZFJlcXVlc3QoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZSA9PT0gXCJDb2RleCByZXF1ZXN0IHN0b3BwZWQuXCI7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB0eXBlIHsgVmF1bHRXcml0ZU9wZXJhdGlvbiwgVmF1bHRXcml0ZVBsYW4gfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNTYWZlTWFya2Rvd25QYXRoIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGgtc2FmZXR5XCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5pbnRlcmZhY2UgVmF1bHRQbGFuTW9kYWxPcHRpb25zIHtcbiAgcGxhbjogVmF1bHRXcml0ZVBsYW47XG4gIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzO1xuICBvbkFwcHJvdmU6IChwbGFuOiBWYXVsdFdyaXRlUGxhbikgPT4gUHJvbWlzZTxzdHJpbmdbXT47XG4gIG9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFBsYW5Nb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWRPcGVyYXRpb25zID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZHJhZnRPcGVyYXRpb25zOiBWYXVsdFdyaXRlT3BlcmF0aW9uW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBWYXVsdFBsYW5Nb2RhbE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5kcmFmdE9wZXJhdGlvbnMgPSBvcHRpb25zLnBsYW4ub3BlcmF0aW9ucy5tYXAoKG9wZXJhdGlvbikgPT4gKHsgLi4ub3BlcmF0aW9uIH0pKTtcbiAgICB0aGlzLmRyYWZ0T3BlcmF0aW9ucy5mb3JFYWNoKChfLCBpbmRleCkgPT4gdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuYWRkKGluZGV4KSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1tb2RhbFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJSZXZpZXcgVmF1bHQgQ2hhbmdlc1wiIH0pO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBgJHt0aGlzLm9wdGlvbnMucGxhbi5zdW1tYXJ5IHx8IFwiQnJhaW4gcHJvcG9zZWQgdmF1bHQgY2hhbmdlcy5cIn0gQ29uZmlkZW5jZTogJHt0aGlzLm9wdGlvbnMucGxhbi5jb25maWRlbmNlfS5gLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBbaW5kZXgsIG9wZXJhdGlvbl0gb2YgdGhpcy5kcmFmdE9wZXJhdGlvbnMuZW50cmllcygpKSB7XG4gICAgICB0aGlzLnJlbmRlck9wZXJhdGlvbihpbmRleCwgb3BlcmF0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnBsYW4ucXVlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgY29uc3QgcXVlc3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tcGxhbi1xdWVzdGlvbnNcIiB9KTtcbiAgICAgIHF1ZXN0aW9ucy5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJPcGVuIFF1ZXN0aW9uc1wiIH0pO1xuICAgICAgY29uc3QgbGlzdCA9IHF1ZXN0aW9ucy5jcmVhdGVFbChcInVsXCIpO1xuICAgICAgZm9yIChjb25zdCBxdWVzdGlvbiBvZiB0aGlzLm9wdGlvbnMucGxhbi5xdWVzdGlvbnMpIHtcbiAgICAgICAgbGlzdC5jcmVhdGVFbChcImxpXCIsIHsgdGV4dDogcXVlc3Rpb24gfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWJ1dHRvbi1yb3dcIiB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiQXBwcm92ZSBhbmQgV3JpdGVcIixcbiAgICB9KS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmFwcHJvdmUoKTtcbiAgICB9KTtcbiAgICBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b25cIixcbiAgICAgIHRleHQ6IFwiQ2FuY2VsXCIsXG4gICAgfSkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9wZXJhdGlvbnMgPSB0aGlzLmRyYWZ0T3BlcmF0aW9uc1xuICAgICAgLmZpbHRlcigoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmhhcyhpbmRleCkpXG4gICAgICAubWFwKChvcGVyYXRpb24pID0+ICh7XG4gICAgICAgIC4uLm9wZXJhdGlvbixcbiAgICAgICAgcGF0aDogb3BlcmF0aW9uLnBhdGgudHJpbSgpLFxuICAgICAgICBjb250ZW50OiBvcGVyYXRpb24uY29udGVudC50cmltKCksXG4gICAgICB9KSlcbiAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbikgPT4gb3BlcmF0aW9uLnBhdGggJiYgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgIGlmICghb3BlcmF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIGNoYW5nZSB0byBhcHBseVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaW52YWxpZFBhdGggPSBvcGVyYXRpb25zLmZpbmQoKG9wZXJhdGlvbikgPT4gIWlzU2FmZU1hcmtkb3duUGF0aChvcGVyYXRpb24ucGF0aCwgdGhpcy5vcHRpb25zLnNldHRpbmdzKSk7XG4gICAgaWYgKGludmFsaWRQYXRoKSB7XG4gICAgICBuZXcgTm90aWNlKGBJbnZhbGlkIHRhcmdldCBwYXRoOiAke2ludmFsaWRQYXRoLnBhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMud29ya2luZyA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgdGhpcy5vcHRpb25zLm9uQXBwcm92ZSh7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5wbGFuLFxuICAgICAgICBvcGVyYXRpb25zLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBtZXNzYWdlID0gcGF0aHMubGVuZ3RoXG4gICAgICAgID8gYFVwZGF0ZWQgJHtwYXRocy5qb2luKFwiLCBcIil9YFxuICAgICAgICA6IFwiTm8gdmF1bHQgY2hhbmdlcyB3ZXJlIGFwcGxpZWRcIjtcbiAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25Db21wbGV0ZShtZXNzYWdlLCBwYXRocyk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXBwbHkgdmF1bHQgY2hhbmdlc1wiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJPcGVyYXRpb24oaW5kZXg6IG51bWJlciwgb3BlcmF0aW9uOiBWYXVsdFdyaXRlT3BlcmF0aW9uKTogdm9pZCB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXBsYW4tb3BlcmF0aW9uXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyID0gaXRlbS5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcImJyYWluLXBsYW4tb3BlcmF0aW9uLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IGNoZWNrYm94ID0gaGVhZGVyLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgYXR0cjogeyB0eXBlOiBcImNoZWNrYm94XCIgfSxcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5oYXMoaW5kZXgpO1xuICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuYWRkKGluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmRlbGV0ZShpbmRleCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbikgfSk7XG5cbiAgICBpZiAob3BlcmF0aW9uLmRlc2NyaXB0aW9uKSB7XG4gICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXBsYW4tZGVzY3JpcHRpb25cIixcbiAgICAgICAgdGV4dDogb3BlcmF0aW9uLmRlc2NyaXB0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aElucHV0ID0gaXRlbS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLXBhdGgtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIFwiYXJpYS1sYWJlbFwiOiBcIlRhcmdldCBtYXJrZG93biBwYXRoXCIsXG4gICAgICB9LFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcGF0aElucHV0LnZhbHVlID0gb3BlcmF0aW9uLnBhdGg7XG4gICAgcGF0aElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0gPSB7XG4gICAgICAgIC4uLnRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSxcbiAgICAgICAgcGF0aDogcGF0aElucHV0LnZhbHVlLFxuICAgICAgfSBhcyBWYXVsdFdyaXRlT3BlcmF0aW9uO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dGFyZWEgPSBpdGVtLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0IGJyYWluLXBsYW4tZWRpdG9yXCIsXG4gICAgICBhdHRyOiB7IHJvd3M6IFwiMTBcIiB9LFxuICAgIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gb3BlcmF0aW9uLmNvbnRlbnQ7XG4gICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSA9IHtcbiAgICAgICAgLi4udGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdLFxuICAgICAgICBjb250ZW50OiB0ZXh0YXJlYS52YWx1ZSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpYmVPcGVyYXRpb24ob3BlcmF0aW9uOiBWYXVsdFdyaXRlUGxhbltcIm9wZXJhdGlvbnNcIl1bbnVtYmVyXSk6IHN0cmluZyB7XG4gIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJhcHBlbmRcIikge1xuICAgIHJldHVybiBgQXBwZW5kIHRvICR7b3BlcmF0aW9uLnBhdGh9YDtcbiAgfVxuICByZXR1cm4gYENyZWF0ZSAke29wZXJhdGlvbi5wYXRofWA7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogQ2VudHJhbGl6ZWQgZXJyb3IgaGFuZGxpbmcgdXRpbGl0eVxuICogU3RhbmRhcmRpemVzIGVycm9yIHJlcG9ydGluZyBhY3Jvc3MgdGhlIHBsdWdpblxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlO1xuICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yQW5kUmV0aHJvdyhlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyIHtcbiAgc2hvd0Vycm9yKGVycm9yLCBkZWZhdWx0TWVzc2FnZSk7XG4gIHRocm93IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihkZWZhdWx0TWVzc2FnZSk7XG59XG4iLCAiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmludGVyZmFjZSBCcmFpbkNvbW1hbmRIb3N0IHtcbiAgYWRkQ29tbWFuZDogUGx1Z2luW1wiYWRkQ29tbWFuZFwiXTtcbiAgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPjtcbiAgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBCcmFpbkNvbW1hbmRIb3N0KTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXZhdWx0LWNoYXRcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFZhdWx0IENoYXRcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4taW5zdHJ1Y3Rpb25zXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBJbnN0cnVjdGlvbnNcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5JbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSxcbiAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBc0M7OztBQ08vQixJQUFNLHlCQUE4QztBQUFBLEVBQ3pELGFBQWE7QUFBQSxFQUNiLGtCQUFrQjtBQUFBLEVBQ2xCLFlBQVk7QUFBQSxFQUNaLGdCQUFnQjtBQUNsQjtBQUVPLFNBQVMsdUJBQ2QsT0FDcUI7QUFDckIsUUFBTSxTQUE4QjtBQUFBLElBQ2xDLEdBQUc7QUFBQSxJQUNILEdBQUc7QUFBQSxFQUNMO0FBRUEsU0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGtCQUFrQjtBQUFBLE1BQ2hCLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxZQUFZLE9BQU8sT0FBTyxlQUFlLFdBQVcsT0FBTyxXQUFXLEtBQUssSUFBSTtBQUFBLElBQy9FLGdCQUFnQix3QkFBd0IsT0FBTyxjQUFjO0FBQUEsRUFDL0Q7QUFDRjtBQUVBLFNBQVMsc0JBQXNCLE9BQWdCLFVBQTBCO0FBQ3ZFLE1BQUksT0FBTyxVQUFVLFVBQVU7QUFDN0IsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLGFBQWEsTUFBTSxLQUFLLEVBQUUsUUFBUSxRQUFRLEVBQUUsRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0RSxTQUFPLGNBQWM7QUFDdkI7QUFFQSxTQUFTLHdCQUF3QixPQUF3QjtBQUN2RCxNQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLFdBQU8sdUJBQXVCO0FBQUEsRUFDaEM7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Y0FBTSxVQUFLLHVCQUFMLG1CQUF5QjtBQUFBLElBQ2pDLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8sb0NBQW9DO0FBQUEsSUFDdkQ7QUFDQSxVQUFNLEtBQUsscUJBQXFCO0FBQUEsRUFDbEM7QUFBQSxFQUVBLE1BQU0sY0FBNkI7QUFDakMsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGFBQWEsS0FBSztBQUNsRCxRQUFJLENBQUMsTUFBTTtBQUNULFVBQUksd0JBQU8sNEJBQTRCO0FBQ3ZDO0FBQUEsSUFDRjtBQUNBLFVBQU0sS0FBSyxhQUFhO0FBQUEsTUFDdEIsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLElBQ1YsQ0FBQztBQUNELFNBQUssSUFBSSxVQUFVLFdBQVcsSUFBSTtBQUFBLEVBQ3BDO0FBQUEsRUFFQSxNQUFNLHVCQUFzQztBQUMxQyxVQUFNLEtBQUssbUJBQW1CLHVCQUF1QjtBQUNyRCxVQUFNLE9BQU8sS0FBSyxJQUFJLE1BQU0sc0JBQXNCLEtBQUssU0FBUyxnQkFBZ0I7QUFDaEYsUUFBSSxFQUFFLGdCQUFnQix5QkFBUTtBQUM1QixVQUFJLHdCQUFPLGtCQUFrQixLQUFLLFNBQVMsZ0JBQWdCLEVBQUU7QUFDN0Q7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLFFBQVEsS0FBSztBQUM3QyxVQUFNLEtBQUssU0FBUyxJQUFJO0FBQUEsRUFDMUI7QUFBQSxFQUVBLE1BQU0sY0FBYyxTQUFpQixVQUEwQixDQUFDLEdBQUcsUUFBa0Q7QUFDbkgsV0FBTyxLQUFLLGlCQUFpQixRQUFRLFNBQVMsU0FBUyxNQUFNO0FBQUEsRUFDL0Q7QUFBQSxFQUVBLE1BQU0sb0JBQW9CLE1BQXlDO0FBQ2pFLFVBQU0sUUFBUSxNQUFNLEtBQUssa0JBQWtCLFVBQVUsSUFBSTtBQUN6RCxVQUFNLEtBQUssK0JBQStCO0FBQzFDLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxxQkFBOEM7QUFDNUMsVUFBTSxTQUFTLEtBQUssSUFBSSxVQUFVLGdCQUFnQixlQUFlO0FBQ2pFLGVBQVcsUUFBUSxRQUFRO0FBQ3pCLFlBQU0sT0FBTyxLQUFLO0FBQ2xCLFVBQUksZ0JBQWdCLGtCQUFrQjtBQUNwQyxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSx1QkFBc0M7QUFoSjlDO0FBaUpJLFlBQU0sVUFBSyxtQkFBbUIsTUFBeEIsbUJBQTJCO0FBQUEsRUFDbkM7QUFBQSxFQUVBLE1BQU0saUNBQWdEO0FBQ3BELFFBQUk7QUFDRixZQUFNLEtBQUsscUJBQXFCO0FBQUEsSUFDbEMsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTyxrQ0FBa0M7QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFFRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
