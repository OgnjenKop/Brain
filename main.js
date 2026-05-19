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
    var _a;
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
    let execResult = null;
    try {
      execResult = await execFileWithAbort(codexBinary, args, {
        maxBuffer: 1024 * 1024 * 4,
        cwd: tempDir,
        timeout: CODEX_CHAT_TIMEOUT_MS,
        signal,
        stdin: prompt
      }, execFile);
      let content;
      try {
        content = await fs.readFile(outputFile, "utf8");
      } catch (e) {
        if (execResult.stdout.trim()) {
          content = execResult.stdout.trim();
        } else if (execResult.stderr.trim()) {
          throw new Error(`Codex did not produce output. Details: ${execResult.stderr.trim().slice(0, 500)}`);
        } else {
          throw new Error("Codex did not produce any output. The CLI may require a newer version or a different configuration.");
        }
      }
      if (!content.trim()) {
        throw new Error("Codex returned an empty response.");
      }
      return content.trim();
    } catch (error) {
      if ((signal == null ? void 0 : signal.aborted) || isAbortError(error)) {
        throw new Error("Codex request stopped.");
      }
      if (isTimeoutError(error)) {
        throw new Error(
          "Codex did not respond in time. Try again, or check `codex login status` outside Brain. If Codex requires approval for shell commands, configure it for non-interactive use."
        );
      }
      if (isEnoentError(error)) {
        throw new Error("Codex CLI is not installed. Install `@openai/codex` and run `codex login` first.");
      }
      const stderrDetail = ((_a = execResult == null ? void 0 : execResult.stderr) == null ? void 0 : _a.trim()) || getErrorDetail(error, "stderr") || "";
      if (stderrDetail && error instanceof Error) {
        throw new Error(`${error.message}
Codex stderr: ${stderrDetail.slice(0, 500)}`);
      }
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => void 0);
    }
  }
  buildCodexPrompt(messages) {
    const parts = [];
    for (const message of messages) {
      if (message.role === "system") {
        parts.push(message.content);
      } else {
        parts.push("");
        parts.push("---");
        parts.push("");
        parts.push(message.content);
      }
    }
    return parts.join("\n");
  }
};
function execFileWithAbort(file, args, options, execFile) {
  return new Promise((resolve, reject) => {
    var _a;
    let settled = false;
    const { signal, stdin, ...execOptions } = options;
    const child = execFile(file, args, execOptions, (error, stdout, stderr) => {
      if (settled) {
        return;
      }
      settled = true;
      signal == null ? void 0 : signal.removeEventListener("abort", abort);
      if (error) {
        const enriched = enrichError(error, stdout, stderr);
        reject(enriched);
      } else {
        resolve({
          stdout: bufferToString(stdout),
          stderr: bufferToString(stderr)
        });
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
function bufferToString(value) {
  return Buffer.isBuffer(value) ? value.toString("utf8") : value;
}
function enrichError(error, stdout, stderr) {
  return Object.assign(error, {
    stdout: bufferToString(stdout),
    stderr: bufferToString(stderr)
  });
}
function getErrorDetail(error, key) {
  if (typeof error !== "object" || error === null || !(key in error)) {
    return "";
  }
  const value = error[key];
  if (typeof value === "string") {
    return value.trim();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("utf8").trim();
  }
  return "";
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
  async respond(message, history = [], signal, onStage) {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Enter a message first");
    }
    onStage == null ? void 0 : onStage("query");
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
    onStage == null ? void 0 : onStage("ai");
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    this.loadingStageEl = null;
    this.loadingStage = "query";
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
    const headerTop = header.createEl("div", { cls: "brain-header-top" });
    headerTop.createEl("h2", { text: "Brain" });
    this.modelRowEl = headerTop.createEl("div", { cls: "brain-model-row" });
    this.renderModelSelector();
    void this.refreshModelOptions();
    header.createEl("p", {
      text: "Ask your vault, or tell Brain what to file."
    });
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
    this.inputEl = this.contentEl.createEl("textarea", {
      cls: "brain-chat-input",
      attr: {
        placeholder: "Ask about your vault, or paste rough notes for Brain to file...",
        rows: "4"
      }
    });
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void this.sendMessage();
      }
    });
    this.inputEl.addEventListener("input", () => {
      this.autoResizeInput();
    });
    const actions = this.contentEl.createEl("div", { cls: "brain-actions" });
    this.sendButtonEl = actions.createEl("button", {
      cls: "brain-button brain-button-primary brain-button-send",
      text: "Send"
    });
    this.sendButtonEl.addEventListener("click", () => {
      void this.sendMessage();
    });
    this.stopButtonEl = actions.createEl("button", {
      cls: "brain-button brain-button-stop brain-button-hidden",
      text: "Stop"
    });
    this.stopButtonEl.addEventListener("click", () => {
      this.stopCurrentRequest();
    });
    this.stopButtonEl.hidden = true;
    this.statusEl = this.contentEl.createEl("div", { cls: "brain-chat-status" });
    this.autoResizeInput();
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
    let statusText = "Not connected";
    try {
      const aiStatus = await getAIConfigurationStatus(this.plugin.settings);
      if (aiStatus.configured) {
        statusText = aiStatus.model || "Connected";
      }
    } catch (error) {
      console.error(error);
    }
    const indicator = this.statusEl.createEl("span", {
      cls: `brain-status-indicator ${statusText !== "Not connected" ? "brain-status-indicator--ok" : "brain-status-indicator--warn"}`
    });
    indicator.setAttribute("aria-hidden", "true");
    this.statusEl.createEl("span", { text: statusText });
  }
  async sendMessage() {
    const message = this.inputEl.value.trim();
    if (!message || this.isLoading) {
      return;
    }
    this.inputEl.value = "";
    this.autoResizeInput();
    this.userScrolledUp = false;
    this.addTurn("user", message);
    this.setLoading(true, "query");
    const controller = new AbortController();
    this.currentAbortController = controller;
    try {
      const history = this.buildChatHistory();
      const response = await this.plugin.chatWithVault(message, history, controller.signal, (stage) => {
        this.loadingStage = stage;
        this.updateLoadingText();
      });
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
  renderModelSelector() {
    this.modelRowEl.empty();
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
  setLoading(loading, stage = "query") {
    this.isLoading = loading;
    this.loadingStage = stage;
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
    this.sendButtonEl.hidden = loading;
    this.stopButtonEl.hidden = !loading;
    this.renderModelSelector();
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
    const meta = loading.createEl("div", { cls: "brain-loading-meta" });
    this.loadingStageEl = meta.createEl("span", {
      cls: "brain-loading-stage",
      text: "Searching vault\u2026"
    });
    this.loadingTextEl = meta.createEl("span", {
      cls: "brain-loading-time",
      text: "0s"
    });
    this.maybeScrollToBottom();
  }
  removeLoadingIndicator() {
    const loadingEl = this.messagesEl.querySelector(".brain-chat-message-loading");
    if (loadingEl) {
      loadingEl.remove();
    }
    this.loadingTextEl = null;
    this.loadingStageEl = null;
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
    const stageLabel = this.loadingStage === "query" ? "Searching vault" : "Asking Codex";
    this.loadingText = `${stageLabel} \xB7 ${seconds}s`;
    if (this.loadingTextEl) {
      this.loadingTextEl.setText(this.loadingText);
    }
    if (this.loadingStageEl) {
      this.loadingStageEl.setText(this.loadingStage === "query" ? "Searching vault\u2026" : "Asking Codex\u2026");
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
  async chatWithVault(message, history = [], signal, onStage) {
    return this.vaultChatService.respond(message, history, signal, onStage);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbm9kZS1ydW50aW1lLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3V0aWxzL2NvZGV4LW1vZGVscy50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgtc2FmZXR5LnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCUkFJTl9WSUVXX1RZUEUsIEJyYWluU2lkZWJhclZpZXcgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBpbnN0cnVjdGlvblNlcnZpY2UhOiBJbnN0cnVjdGlvblNlcnZpY2U7XG4gIHZhdWx0UXVlcnlTZXJ2aWNlITogVmF1bHRRdWVyeVNlcnZpY2U7XG4gIHZhdWx0V3JpdGVTZXJ2aWNlITogVmF1bHRXcml0ZVNlcnZpY2U7XG4gIHZhdWx0Q2hhdFNlcnZpY2UhOiBWYXVsdENoYXRTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlID0gbmV3IEluc3RydWN0aW9uU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UgPSBuZXcgVmF1bHRRdWVyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlID0gbmV3IFZhdWx0V3JpdGVTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdENoYXRTZXJ2aWNlID0gbmV3IFZhdWx0Q2hhdFNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFF1ZXJ5U2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZS5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBCcmFpbiBzdG9yYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgbG9hZCBCcmFpbiBzZXR0aW5nc1wiKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2U/LmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIEJyYWluIHN0b3JhZ2VcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGhpcy5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKGBDb3VsZCBub3Qgb3BlbiAke3RoaXMuc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZX1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBjaGF0V2l0aFZhdWx0KG1lc3NhZ2U6IHN0cmluZywgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10gPSBbXSwgc2lnbmFsPzogQWJvcnRTaWduYWwsIG9uU3RhZ2U/OiAoc3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIikgPT4gdm9pZCk6IFByb21pc2U8VmF1bHRDaGF0UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy52YXVsdENoYXRTZXJ2aWNlLnJlc3BvbmQobWVzc2FnZSwgaGlzdG9yeSwgc2lnbmFsLCBvblN0YWdlKTtcbiAgfVxuXG4gIGFzeW5jIGFwcGx5VmF1bHRXcml0ZVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcGF0aHMgPSBhd2FpdCB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlLmFwcGx5UGxhbihwbGFuKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiBwYXRocztcbiAgfVxuXG4gIGdldE9wZW5TaWRlYmFyVmlldygpOiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCB7XG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBsZWF2ZXMpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEJyYWluU2lkZWJhclZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIG5vdGVzRm9sZGVyOiBzdHJpbmc7XG4gIGluc3RydWN0aW9uc0ZpbGU6IHN0cmluZztcbiAgY29kZXhNb2RlbDogc3RyaW5nO1xuICBleGNsdWRlRm9sZGVyczogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CUkFJTl9TRVRUSU5HUzogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgbm90ZXNGb2xkZXI6IFwiTm90ZXNcIixcbiAgaW5zdHJ1Y3Rpb25zRmlsZTogXCJCcmFpbi9BR0VOVFMubWRcIixcbiAgY29kZXhNb2RlbDogXCJcIixcbiAgZXhjbHVkZUZvbGRlcnM6IFwiLm9ic2lkaWFuXFxubm9kZV9tb2R1bGVzXCIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBpbnN0cnVjdGlvbnNGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICApLFxuICAgIGNvZGV4TW9kZWw6IHR5cGVvZiBtZXJnZWQuY29kZXhNb2RlbCA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5jb2RleE1vZGVsLnRyaW0oKSA6IFwiXCIsXG4gICAgZXhjbHVkZUZvbGRlcnM6IG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKG1lcmdlZC5leGNsdWRlRm9sZGVycyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmV4Y2x1ZGVGb2xkZXJzO1xuICB9XG4gIHJldHVybiB2YWx1ZVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUV4Y2x1ZGVGb2xkZXJzKGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBleGNsdWRlRm9sZGVyc1xuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHtcbiAgQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4gIENvZGV4TW9kZWxPcHRpb24sXG4gIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlLFxuICBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucyxcbiAgaXNLbm93bkNvZGV4TW9kZWwsXG59IGZyb20gXCIuLi91dGlscy9jb2RleC1tb2RlbHNcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb2RlbE9wdGlvbnNMb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpbiBTZXR0aW5nc1wiIH0pO1xuICAgIGlmICghdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nICYmICF0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCkge1xuICAgICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdG9yYWdlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTm90ZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkRlZmF1bHQgZm9sZGVyIGZvciBuZXcgbWFya2Rvd24gbm90ZXMgY3JlYXRlZCBmcm9tIGFwcHJvdmVkIHdyaXRlIHBsYW5zLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5zdHJ1Y3Rpb25zIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB0aGF0IHRlbGxzIEJyYWluIGhvdyB0byBvcGVyYXRlIGluIHRoaXMgdmF1bHQuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSW5zdHJ1Y3Rpb25zIGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFeGNsdWRlZCBmb2xkZXJzXCIpXG4gICAgICAuc2V0RGVzYyhcIk9uZSBmb2xkZXIgcGF0aCBwZXIgbGluZS4gQnJhaW4gd2lsbCBza2lwIG1hcmtkb3duIGZpbGVzIGluc2lkZSB0aGVzZSBmb2xkZXJzIHdoZW4gc2VhcmNoaW5nIHRoZSB2YXVsdC5cIilcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVGb2xkZXJzKS5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5leGNsdWRlRm9sZGVycyA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29kZXggQ0xJXCIgfSk7XG5cbiAgICB0aGlzLmNyZWF0ZUNvZGV4U3RhdHVzU2V0dGluZyhjb250YWluZXJFbCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggc2V0dXBcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkJyYWluIHVzZXMgb25seSB0aGUgbG9jYWwgQ29kZXggQ0xJLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gcmVjaGVjayBzdGF0dXMuXCIsXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiT3BlbiBDb2RleCBTZXR1cFwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKCk7XG4gICAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVjaGVjayBTdGF0dXNcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBjb25zdCBtb2RlbFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggbW9kZWxcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmdcbiAgICAgICAgICA/IFwiTG9hZGluZyBtb2RlbHMgZnJvbSB0aGUgaW5zdGFsbGVkIENvZGV4IENMSS4uLlwiXG4gICAgICAgICAgOiBcIk9wdGlvbmFsLiBTZWxlY3QgYSBtb2RlbCByZXBvcnRlZCBieSBDb2RleCBDTEksIG9yIGxlYXZlIGJsYW5rIHRvIHVzZSB0aGUgYWNjb3VudCBkZWZhdWx0LlwiLFxuICAgICAgKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm1vZGVsT3B0aW9ucykge1xuICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihvcHRpb24udmFsdWUsIG9wdGlvbi5sYWJlbCk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSwgXCJDdXN0b20uLi5cIilcbiAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnRcbiAgICAgICAgICAgICAgPyBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICAgICAgICAgICAgOiBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucyksXG4gICAgICAgICAgKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBtb2RlbFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICBidXR0b25cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJSZWxvYWRcIilcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgICAgIH0pLFxuICAgICk7XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHxcbiAgICAgIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgKSB7XG4gICAgICBsZXQgZHJhZnRWYWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fCBpc0tub3duQ29kZXhNb2RlbCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucylcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbDtcbiAgICAgIGlmICh0aGlzLmN1c3RvbU1vZGVsRHJhZnQgJiYgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgLnNldE5hbWUoXCJBY3RpdmUgQ29kZXggbW9kZWxcIilcbiAgICAgICAgICAuc2V0RGVzYyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSk7XG4gICAgICB9XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJDdXN0b20gQ29kZXggbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJFeGFjdCBtb2RlbCBpZCBwYXNzZWQgdG8gYGNvZGV4IGV4ZWMgLS1tb2RlbGAuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dFxuICAgICAgICAgICAgLnNldFZhbHVlKGRyYWZ0VmFsdWUpXG4gICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGRyYWZ0VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUN1c3RvbU1vZGVsRHJhZnQoZHJhZnRWYWx1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9ucyA9IGF3YWl0IGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQ3VzdG9tTW9kZWxEcmFmdCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbW9kZWwgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IG1vZGVsO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMuZGlzcGxheSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDb2RleFN0YXR1c1NldHRpbmcoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdHVzU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBzdGF0dXNcIilcbiAgICAgIC5zZXREZXNjKFwiQ2hlY2tpbmcgQ29kZXggQ0xJIHN0YXR1cy4uLlwiKTtcbiAgICB2b2lkIHRoaXMucmVmcmVzaENvZGV4U3RhdHVzKHN0YXR1c1NldHRpbmcpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoQ29kZXhTdGF0dXMoc2V0dGluZzogU2V0dGluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgc2V0dGluZy5zZXREZXNjKHN0YXR1cy5tZXNzYWdlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBzZXR0aW5nLnNldERlc2MoXCJDb3VsZCBub3QgY2hlY2sgQ29kZXggQ0xJIHN0YXR1cy5cIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBiaW5kVGV4dFNldHRpbmcoXG4gICAgdGV4dDogVGV4dENvbXBvbmVudCxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIG9uVmFsdWVDaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IFRleHRDb21wb25lbnQge1xuICAgIGxldCBsYXN0VmFsaWRWYWx1ZSA9IHZhbHVlO1xuXG4gICAgdGV4dC5zZXRWYWx1ZSh2YWx1ZSkub25DaGFuZ2UoKG5leHRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKCF2YWxpZGF0ZSB8fCB2YWxpZGF0ZShuZXh0VmFsdWUpKSB7XG4gICAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICAgICAgbGFzdFZhbGlkVmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gdGV4dC5pbnB1dEVsLnZhbHVlO1xuICAgICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICAgIHRleHQuc2V0VmFsdWUobGFzdFZhbGlkVmFsdWUpO1xuICAgICAgICBvblZhbHVlQ2hhbmdlKGxhc3RWYWxpZFZhbHVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB9KTtcblxuICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiZcbiAgICAgICAgIWV2ZW50Lm1ldGFLZXkgJiZcbiAgICAgICAgIWV2ZW50LmN0cmxLZXkgJiZcbiAgICAgICAgIWV2ZW50LmFsdEtleSAmJlxuICAgICAgICAhZXZlbnQuc2hpZnRLZXlcbiAgICAgICkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0ZXh0LmlucHV0RWwuYmx1cigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cbn1cbiIsICIvKipcbiAqIFNoYXJlZCBOb2RlLmpzIHJ1bnRpbWUgaGVscGVycy5cbiAqXG4gKiBUaGVzZSB1c2UgZHluYW1pYyBgcmVxdWlyZSgpYCB2aWEgYEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKWAgdG9cbiAqIGJ5cGFzcyBlc2J1aWxkIGJ1bmRsaW5nIG9mIE5vZGUgYnVpbHQtaW5zLiBPYnNpZGlhbiBwbHVnaW5zIHJ1biBpbiBhblxuICogRWxlY3Ryb24vTm9kZSBjb250ZXh0IHdoZXJlIGByZXF1aXJlYCBpcyBhdmFpbGFibGUgYXQgcnVudGltZSBidXQgY2Fubm90XG4gKiBiZSBzdGF0aWNhbGx5IGJ1bmRsZWQuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVSZXF1aXJlKCk6IE5vZGVSZXF1aXJlIHtcbiAgcmV0dXJuIEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKSBhcyBOb2RlUmVxdWlyZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvZGV4UnVudGltZSgpOiB7XG4gIGV4ZWNGaWxlOiAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMsXG4gICAgY2FsbGJhY2s/OiAoXG4gICAgICBlcnJvcjogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZUV4Y2VwdGlvbiB8IG51bGwsXG4gICAgICBzdGRvdXQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICAgIHN0ZGVycjogc3RyaW5nIHwgQnVmZmVyLFxuICAgICkgPT4gdm9pZCxcbiAgKSA9PiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkNoaWxkUHJvY2VzcztcbiAgZnM6IHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKTtcbiAgb3M6IHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcbiAgcGF0aDogdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG59IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgY29uc3QgeyBleGVjRmlsZSB9ID0gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZTogZXhlY0ZpbGUgYXMgKFxuICAgICAgZmlsZTogc3RyaW5nLFxuICAgICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgICAgb3B0aW9ucz86IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVPcHRpb25zLFxuICAgICAgY2FsbGJhY2s/OiAoXG4gICAgICAgIGVycm9yOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlRXhjZXB0aW9uIHwgbnVsbCxcbiAgICAgICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICAgIHN0ZGVycjogc3RyaW5nIHwgQnVmZmVyLFxuICAgICAgKSA9PiB2b2lkLFxuICAgICkgPT4gaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5DaGlsZFByb2Nlc3MsXG4gICAgZnM6IHJlcShcImZzL3Byb21pc2VzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKSxcbiAgICBvczogcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpLFxuICAgIHBhdGg6IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIiksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeGVjRmlsZUFzeW5jKCk6IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbikgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PiB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgZXhlY0ZpbGUgfSA9IHJlcShcImNoaWxkX3Byb2Nlc3NcIikgYXMgdHlwZW9mIGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuICByZXR1cm4gcHJvbWlzaWZ5KGV4ZWNGaWxlKSBhcyAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW5vZW50RXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBOb2RlSlMuRXJybm9FeGNlcHRpb24ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmIGVycm9yICE9PSBudWxsICYmIFwiY29kZVwiIGluIGVycm9yICYmIGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RpbWVvdXRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJraWxsZWRcIiBpbiBlcnJvciAmJiBlcnJvci5raWxsZWQgPT09IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Fib3J0RXJyb3IoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgXCJuYW1lXCIgaW4gZXJyb3IgJiZcbiAgICBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBSZWZlcmVuY2VFcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIFR5cGVFcnJvcjtcbn1cbiIsICJpbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jLCBnZXROb2RlUmVxdWlyZSwgaXNFbm9lbnRFcnJvciwgaXNOb2RlUnVudGltZVVuYXZhaWxhYmxlLCBpc1RpbWVvdXRFcnJvciB9IGZyb20gXCIuL25vZGUtcnVudGltZVwiO1xuXG5leHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5jb25zdCBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyA9IDUwMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGV4TG9naW5TdGF0dXMob3V0cHV0OiBzdHJpbmcpOiBDb2RleExvZ2luU3RhdHVzIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG91dHB1dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJub3QgbG9nZ2VkIGluXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgb3V0XCIpKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgaW5cIikgfHxcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwic2lnbmVkIGluXCIpIHx8XG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcImF1dGhlbnRpY2F0ZWRcIilcbiAgKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLWluXCI7XG4gIH1cblxuICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleExvZ2luU3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgICB9XG5cbiAgICBjb25zdCBleGVjRmlsZUFzeW5jID0gZ2V0RXhlY0ZpbGVBc3luYygpO1xuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIFtcImxvZ2luXCIsIFwic3RhdHVzXCJdLCB7XG4gICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0LFxuICAgICAgdGltZW91dDogQ09ERVhfTE9HSU5fU1RBVFVTX1RJTUVPVVRfTVMsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpIHx8IGlzVGltZW91dEVycm9yKGVycm9yKSB8fCBpc05vZGVSdW50aW1lVW5hdmFpbGFibGUoZXJyb3IpKSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4QmluYXJ5UGF0aCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgbGV0IHJlcTogTm9kZVJlcXVpcmU7XG4gIHRyeSB7XG4gICAgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmcyA9IHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKTtcbiAgY29uc3QgcGF0aCA9IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG4gIGNvbnN0IG9zID0gcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoLCBvcy5ob21lZGlyKCkpO1xuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgc2VhcmNoaW5nLlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoTW9kdWxlOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSwgaG9tZURpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBjYW5kaWRhdGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdGhFbnRyaWVzID0gKHByb2Nlc3MuZW52LlBBVEggPz8gXCJcIikuc3BsaXQocGF0aE1vZHVsZS5kZWxpbWl0ZXIpLmZpbHRlcihCb29sZWFuKTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhdGhFbnRyaWVzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGVudHJ5LCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1vbkRpcnMgPSBbXG4gICAgXCIvb3B0L2hvbWVicmV3L2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBgJHtob21lRGlyfS8ubG9jYWwvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYnVuL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmNvZGVpdW0vd2luZHN1cmYvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYW50aWdyYXZpdHkvYW50aWdyYXZpdHkvYmluYCxcbiAgICBcIi9BcHBsaWNhdGlvbnMvQ29kZXguYXBwL0NvbnRlbnRzL1Jlc291cmNlc1wiLFxuICBdO1xuXG4gIGZvciAoY29uc3QgZGlyIG9mIGNvbW1vbkRpcnMpIHtcbiAgICBjYW5kaWRhdGVzLmFkZChwYXRoTW9kdWxlLmpvaW4oZGlyLCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGNhbmRpZGF0ZXMpO1xufVxuXG5mdW5jdGlvbiBjb2RleEV4ZWN1dGFibGVOYW1lKCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyBcImNvZGV4LmNtZFwiIDogXCJjb2RleFwiO1xufVxuIiwgImltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZXhMb2dpblN0YXR1cyB9IGZyb20gXCIuL2NvZGV4LWF1dGhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBBSUNvbmZpZ3VyYXRpb25TdGF0dXMge1xuICBjb25maWd1cmVkOiBib29sZWFuO1xuICBwcm92aWRlcjogXCJjb2RleFwiO1xuICBtb2RlbDogc3RyaW5nIHwgbnVsbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKFxuICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbik6IFByb21pc2U8QUlDb25maWd1cmF0aW9uU3RhdHVzPiB7XG4gIGNvbnN0IGNvZGV4U3RhdHVzID0gYXdhaXQgZ2V0Q29kZXhMb2dpblN0YXR1cygpO1xuICBpZiAoY29kZXhTdGF0dXMgPT09IFwidW5hdmFpbGFibGVcIikge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgIHByb3ZpZGVyOiBcImNvZGV4XCIsXG4gICAgICBtb2RlbDogbnVsbCxcbiAgICAgIG1lc3NhZ2U6IFwiQ29kZXggQ0xJIG5vdCBpbnN0YWxsZWQuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChjb2RleFN0YXR1cyAhPT0gXCJsb2dnZWQtaW5cIikge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWd1cmVkOiBmYWxzZSxcbiAgICAgIHByb3ZpZGVyOiBcImNvZGV4XCIsXG4gICAgICBtb2RlbDogbnVsbCxcbiAgICAgIG1lc3NhZ2U6IFwiQ29kZXggQ0xJIG5vdCBsb2dnZWQgaW4uXCIsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IG1vZGVsID0gc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkgfHwgbnVsbDtcbiAgcmV0dXJuIHtcbiAgICBjb25maWd1cmVkOiB0cnVlLFxuICAgIHByb3ZpZGVyOiBcImNvZGV4XCIsXG4gICAgbW9kZWwsXG4gICAgbWVzc2FnZTogbW9kZWxcbiAgICAgID8gYFJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIG1vZGVsICR7bW9kZWx9LmBcbiAgICAgIDogXCJSZWFkeSB0byB1c2UgQ29kZXggd2l0aCB0aGUgYWNjb3VudCBkZWZhdWx0IG1vZGVsLlwiLFxuICB9O1xufVxuIiwgImltcG9ydCB7IGdldENvZGV4QmluYXJ5UGF0aCB9IGZyb20gXCIuL2NvZGV4LWF1dGhcIjtcbmltcG9ydCB7IGdldEV4ZWNGaWxlQXN5bmMgfSBmcm9tIFwiLi9ub2RlLXJ1bnRpbWVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDb2RleE1vZGVsT3B0aW9uIHtcbiAgdmFsdWU6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUzogQ29kZXhNb2RlbE9wdGlvbltdID0gW1xuICB7IHZhbHVlOiBcIlwiLCBsYWJlbDogXCJBY2NvdW50IGRlZmF1bHRcIiB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSA9IFwiX19jdXN0b21fX1wiO1xuY29uc3QgQ09ERVhfTU9ERUxfQ0FUQUxPR19USU1FT1VUX01TID0gODAwMDtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zKCk6IFByb21pc2U8Q29kZXhNb2RlbE9wdGlvbltdPiB7XG4gIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gIGlmICghY29kZXhCaW5hcnkpIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBleGVjRmlsZUFzeW5jID0gZ2V0RXhlY0ZpbGVBc3luYygpO1xuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIFtcImRlYnVnXCIsIFwibW9kZWxzXCJdLCB7XG4gICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogMjAsXG4gICAgICB0aW1lb3V0OiBDT0RFWF9NT0RFTF9DQVRBTE9HX1RJTUVPVVRfTVMsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhNb2RlbENhdGFsb2coYCR7c3Rkb3V0fVxcbiR7c3RkZXJyfWApO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGV4TW9kZWxDYXRhbG9nKG91dHB1dDogc3RyaW5nKTogQ29kZXhNb2RlbE9wdGlvbltdIHtcbiAgY29uc3QganNvblRleHQgPSBleHRyYWN0SnNvbk9iamVjdChvdXRwdXQpO1xuICBpZiAoIWpzb25UZXh0KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uVGV4dCkgYXMge1xuICAgICAgbW9kZWxzPzogQXJyYXk8e1xuICAgICAgICBzbHVnPzogdW5rbm93bjtcbiAgICAgICAgZGlzcGxheV9uYW1lPzogdW5rbm93bjtcbiAgICAgICAgdmlzaWJpbGl0eT86IHVua25vd247XG4gICAgICB9PjtcbiAgICB9O1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBvcHRpb25zID0gWy4uLkRFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OU107XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiBwYXJzZWQubW9kZWxzID8/IFtdKSB7XG4gICAgICBjb25zdCBzbHVnID0gdHlwZW9mIG1vZGVsLnNsdWcgPT09IFwic3RyaW5nXCIgPyBtb2RlbC5zbHVnLnRyaW0oKSA6IFwiXCI7XG4gICAgICBpZiAoIXNsdWcgfHwgc2Vlbi5oYXMoc2x1ZykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAobW9kZWwudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG1vZGVsLnZpc2liaWxpdHkgIT09IFwibGlzdFwiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQoc2x1Zyk7XG4gICAgICBvcHRpb25zLnB1c2goe1xuICAgICAgICB2YWx1ZTogc2x1ZyxcbiAgICAgICAgbGFiZWw6IHR5cGVvZiBtb2RlbC5kaXNwbGF5X25hbWUgPT09IFwic3RyaW5nXCIgJiYgbW9kZWwuZGlzcGxheV9uYW1lLnRyaW0oKVxuICAgICAgICAgID8gbW9kZWwuZGlzcGxheV9uYW1lLnRyaW0oKVxuICAgICAgICAgIDogc2x1ZyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUoXG4gIG1vZGVsOiBzdHJpbmcsXG4gIG9wdGlvbnM6IHJlYWRvbmx5IENvZGV4TW9kZWxPcHRpb25bXSA9IERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbik6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBtb2RlbC50cmltKCk7XG4gIGlmICghbm9ybWFsaXplZCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHJldHVybiBvcHRpb25zLnNvbWUoKG9wdGlvbikgPT4gb3B0aW9uLnZhbHVlID09PSBub3JtYWxpemVkKVxuICAgID8gbm9ybWFsaXplZFxuICAgIDogQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNLbm93bkNvZGV4TW9kZWwoXG4gIG1vZGVsOiBzdHJpbmcsXG4gIG9wdGlvbnM6IHJlYWRvbmx5IENvZGV4TW9kZWxPcHRpb25bXSA9IERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbik6IGJvb2xlYW4ge1xuICBjb25zdCBub3JtYWxpemVkID0gbW9kZWwudHJpbSgpO1xuICByZXR1cm4gb3B0aW9ucy5zb21lKChvcHRpb24pID0+IG9wdGlvbi52YWx1ZSA9PT0gbm9ybWFsaXplZCk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RKc29uT2JqZWN0KG91dHB1dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHN0YXJ0ID0gb3V0cHV0LmluZGV4T2YoXCJ7XCIpO1xuICBjb25zdCBlbmQgPSBvdXRwdXQubGFzdEluZGV4T2YoXCJ9XCIpO1xuICBpZiAoc3RhcnQgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHwgZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIG91dHB1dC5zbGljZShzdGFydCwgZW5kICsgMSk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZXhCaW5hcnlQYXRoIH0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LWF1dGhcIjtcbmltcG9ydCB7IGdldENvZGV4UnVudGltZSwgaXNBYm9ydEVycm9yLCBpc0Vub2VudEVycm9yLCBpc1RpbWVvdXRFcnJvciB9IGZyb20gXCIuLi91dGlscy9ub2RlLXJ1bnRpbWVcIjtcblxuY29uc3QgQ09ERVhfQ0hBVF9USU1FT1VUX01TID0gMTIwMDAwO1xuXG5pbnRlcmZhY2UgRXhlY1Jlc3VsdCB7XG4gIHN0ZG91dDogc3RyaW5nO1xuICBzdGRlcnI6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgYXN5bmMgY29tcGxldGVDaGF0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyB8IG51bGwsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucG9zdENvZGV4Q29tcGxldGlvbihzZXR0aW5ncywgbWVzc2FnZXMsIHdvcmtpbmdEaXJlY3RvcnksIHNpZ25hbCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvc3RDb2RleENvbXBsZXRpb24oXG4gICAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICAgd29ya2luZ0RpcmVjdG9yeTogc3RyaW5nIHwgbnVsbCxcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IGV4ZWNGaWxlLCBmcywgb3MsIHBhdGggfSA9IGdldENvZGV4UnVudGltZSgpO1xuXG4gICAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCBDTEkgaXMgbm90IGluc3RhbGxlZC4gSW5zdGFsbCBgQG9wZW5haS9jb2RleGAgYW5kIHJ1biBgY29kZXggbG9naW5gIGZpcnN0LlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZW1wRGlyID0gYXdhaXQgZnMubWtkdGVtcChwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiYnJhaW4tY29kZXgtXCIpKTtcbiAgICBjb25zdCBvdXRwdXRGaWxlID0gcGF0aC5qb2luKHRlbXBEaXIsIFwicmVzcG9uc2UudHh0XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0tZXBoZW1lcmFsXCIsXG4gICAgICBcIi0taWdub3JlLXJ1bGVzXCIsXG4gICAgICBcIi0tc2FuZGJveFwiLFxuICAgICAgXCJyZWFkLW9ubHlcIixcbiAgICAgIFwiLS1vdXRwdXQtbGFzdC1tZXNzYWdlXCIsXG4gICAgICBvdXRwdXRGaWxlLFxuICAgIF07XG5cbiAgICBpZiAod29ya2luZ0RpcmVjdG9yeSkge1xuICAgICAgYXJncy5wdXNoKFwiLS1jZFwiLCB3b3JraW5nRGlyZWN0b3J5KTtcbiAgICB9XG5cbiAgICBpZiAoc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tbW9kZWxcIiwgc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgIH1cblxuICAgIGFyZ3MucHVzaChcIi1cIik7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZENvZGV4UHJvbXB0KG1lc3NhZ2VzKTtcblxuICAgIGxldCBleGVjUmVzdWx0OiBFeGVjUmVzdWx0IHwgbnVsbCA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgZXhlY1Jlc3VsdCA9IGF3YWl0IGV4ZWNGaWxlV2l0aEFib3J0KGNvZGV4QmluYXJ5LCBhcmdzLCB7XG4gICAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQgKiA0LFxuICAgICAgICBjd2Q6IHRlbXBEaXIsXG4gICAgICAgIHRpbWVvdXQ6IENPREVYX0NIQVRfVElNRU9VVF9NUyxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgICBzdGRpbjogcHJvbXB0LFxuICAgICAgfSwgZXhlY0ZpbGUpO1xuXG4gICAgICBsZXQgY29udGVudDogc3RyaW5nO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKG91dHB1dEZpbGUsIFwidXRmOFwiKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBpZiAoZXhlY1Jlc3VsdC5zdGRvdXQudHJpbSgpKSB7XG4gICAgICAgICAgY29udGVudCA9IGV4ZWNSZXN1bHQuc3Rkb3V0LnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIGlmIChleGVjUmVzdWx0LnN0ZGVyci50cmltKCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvZGV4IGRpZCBub3QgcHJvZHVjZSBvdXRwdXQuIERldGFpbHM6ICR7ZXhlY1Jlc3VsdC5zdGRlcnIudHJpbSgpLnNsaWNlKDAsIDUwMCl9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggZGlkIG5vdCBwcm9kdWNlIGFueSBvdXRwdXQuIFRoZSBDTEkgbWF5IHJlcXVpcmUgYSBuZXdlciB2ZXJzaW9uIG9yIGEgZGlmZmVyZW50IGNvbmZpZ3VyYXRpb24uXCIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2UuXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkIHx8IGlzQWJvcnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcmVxdWVzdCBzdG9wcGVkLlwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChpc1RpbWVvdXRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIFwiQ29kZXggZGlkIG5vdCByZXNwb25kIGluIHRpbWUuIFRyeSBhZ2Fpbiwgb3IgY2hlY2sgYGNvZGV4IGxvZ2luIHN0YXR1c2Agb3V0c2lkZSBCcmFpbi4gXCIgK1xuICAgICAgICAgIFwiSWYgQ29kZXggcmVxdWlyZXMgYXBwcm92YWwgZm9yIHNoZWxsIGNvbW1hbmRzLCBjb25maWd1cmUgaXQgZm9yIG5vbi1pbnRlcmFjdGl2ZSB1c2UuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0ZGVyckRldGFpbCA9IGV4ZWNSZXN1bHQ/LnN0ZGVycj8udHJpbSgpXG4gICAgICAgIHx8IGdldEVycm9yRGV0YWlsKGVycm9yLCBcInN0ZGVyclwiKVxuICAgICAgICB8fCBcIlwiO1xuICAgICAgaWYgKHN0ZGVyckRldGFpbCAmJiBlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtlcnJvci5tZXNzYWdlfVxcbkNvZGV4IHN0ZGVycjogJHtzdGRlcnJEZXRhaWwuc2xpY2UoMCwgNTAwKX1gKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBmcy5ybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29kZXhQcm9tcHQoXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbWVzc2FnZXMpIHtcbiAgICAgIGlmIChtZXNzYWdlLnJvbGUgPT09IFwic3lzdGVtXCIpIHtcbiAgICAgICAgcGFydHMucHVzaChtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgICAgcGFydHMucHVzaChcIi0tLVwiKTtcbiAgICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgICAgcGFydHMucHVzaChtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWNGaWxlV2l0aEFib3J0KFxuICBmaWxlOiBzdHJpbmcsXG4gIGFyZ3M6IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyAmIHtcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgICBzdGRpbj86IHN0cmluZztcbiAgfSxcbiAgZXhlY0ZpbGU6IFJldHVyblR5cGU8dHlwZW9mIGdldENvZGV4UnVudGltZT5bXCJleGVjRmlsZVwiXSxcbik6IFByb21pc2U8RXhlY1Jlc3VsdD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgY29uc3QgeyBzaWduYWwsIHN0ZGluLCAuLi5leGVjT3B0aW9ucyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBjaGlsZCA9IGV4ZWNGaWxlKGZpbGUsIGFyZ3MsIGV4ZWNPcHRpb25zLCAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgICBpZiAoc2V0dGxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgIHNpZ25hbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0KTtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjb25zdCBlbnJpY2hlZCA9IGVucmljaEVycm9yKGVycm9yLCBzdGRvdXQsIHN0ZGVycik7XG4gICAgICAgIHJlamVjdChlbnJpY2hlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICBzdGRvdXQ6IGJ1ZmZlclRvU3RyaW5nKHN0ZG91dCksXG4gICAgICAgICAgc3RkZXJyOiBidWZmZXJUb1N0cmluZyhzdGRlcnIpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoc3RkaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2hpbGQuc3RkaW4/LmVuZChzdGRpbik7XG4gICAgfVxuXG4gICAgY29uc3QgYWJvcnQgPSAoKSA9PiB7XG4gICAgICBpZiAoc2V0dGxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjaGlsZC5raWxsKFwiU0lHVEVSTVwiKTtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKGNoaWxkLmV4aXRDb2RlID09PSBudWxsICYmIGNoaWxkLnNpZ25hbENvZGUgPT09IG51bGwpIHtcbiAgICAgICAgICBjaGlsZC5raWxsKFwiU0lHS0lMTFwiKTtcbiAgICAgICAgfVxuICAgICAgfSwgMTUwMCk7XG4gICAgfTtcblxuICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgIGFib3J0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpZ25hbD8uYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0LCB7IG9uY2U6IHRydWUgfSk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gYnVmZmVyVG9TdHJpbmcodmFsdWU6IHN0cmluZyB8IEJ1ZmZlcik6IHN0cmluZyB7XG4gIHJldHVybiBCdWZmZXIuaXNCdWZmZXIodmFsdWUpID8gdmFsdWUudG9TdHJpbmcoXCJ1dGY4XCIpIDogdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGVucmljaEVycm9yKFxuICBlcnJvcjogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZUV4Y2VwdGlvbixcbiAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gIHN0ZGVycjogc3RyaW5nIHwgQnVmZmVyLFxuKTogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZUV4Y2VwdGlvbiB7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKGVycm9yLCB7XG4gICAgc3Rkb3V0OiBidWZmZXJUb1N0cmluZyhzdGRvdXQpLFxuICAgIHN0ZGVycjogYnVmZmVyVG9TdHJpbmcoc3RkZXJyKSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEVycm9yRGV0YWlsKGVycm9yOiB1bmtub3duLCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgZXJyb3IgIT09IFwib2JqZWN0XCIgfHwgZXJyb3IgPT09IG51bGwgfHwgIShrZXkgaW4gZXJyb3IpKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgY29uc3QgdmFsdWUgPSAoZXJyb3IgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV07XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdmFsdWUudHJpbSgpO1xuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKFwidXRmOFwiKS50cmltKCk7XG4gIH1cbiAgcmV0dXJuIFwiXCI7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IENvZGV4TG9naW5TdGF0dXMsIGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5BdXRoU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBCcmFpblBsdWdpbikge31cblxuICBhc3luYyBsb2dpbigpIHtcbiAgICBuZXcgTm90aWNlKFwiSW5zdGFsbCB0aGUgQ29kZXggQ0xJLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiByZXR1cm4gdG8gQnJhaW4gYW5kIHJlY2hlY2sgQ29kZXggc3RhdHVzLlwiKTtcbiAgICB3aW5kb3cub3BlbihcImh0dHBzOi8vb3BlbmFpLmNvbS9jb2RleC9nZXQtc3RhcnRlZC9cIik7XG4gIH1cblxuICBhc3luYyBnZXRDb2RleFN0YXR1cygpOiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHtcbiAgICByZXR1cm4gZ2V0Q29kZXhMb2dpblN0YXR1cygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5jb25zdCBERUZBVUxUX0lOU1RSVUNUSU9OUyA9IFtcbiAgXCIjIEJyYWluIEluc3RydWN0aW9uc1wiLFxuICBcIlwiLFxuICBcIllvdSBhcmUgaGVscGluZyBmaWxlIGluZm9ybWF0aW9uIGludG8gdGhpcyBPYnNpZGlhbiB2YXVsdCBhbmQgcmV0cmlldmUgaW5mb3JtYXRpb24gZnJvbSBpdC5cIixcbiAgXCJcIixcbiAgXCIjIyBPcGVyYXRpbmcgUnVsZXNcIixcbiAgXCItIEtlZXAgYWxsIHBlcnNpc3RlZCBjb250ZW50IGFzIG5vcm1hbCBtYXJrZG93bi5cIixcbiAgXCItIFVzZSBvbmx5IGV4cGxpY2l0IHZhdWx0IGNvbnRleHQgd2hlbiBhbnN3ZXJpbmcgcmV0cmlldmFsIHF1ZXN0aW9ucy5cIixcbiAgXCItIFByZWZlciB1cGRhdGluZyBvciBhcHBlbmRpbmcgdG8gZXhpc3Rpbmcgbm90ZXMgb3ZlciBjcmVhdGluZyBkdXBsaWNhdGVzLlwiLFxuICBcIi0gVXNlIHdpa2kgbGlua3Mgd2hlbiB1c2VmdWwgYW5kIHN1cHBvcnRlZCBieSB0aGUgcHJvdmlkZWQgY29udGV4dC5cIixcbiAgXCItIFVzZSB0aGUgY29uZmlndXJlZCBub3RlcyBmb2xkZXIgYXMgdGhlIGRlZmF1bHQgbG9jYXRpb24gZm9yIG5ldyBub3Rlcy5cIixcbiAgXCItIElmIHlvdSBhcmUgdW5zdXJlIHdoZXJlIHNvbWV0aGluZyBiZWxvbmdzLCBhc2sgYSBxdWVzdGlvbiBpbnN0ZWFkIG9mIGd1ZXNzaW5nLlwiLFxuICBcIi0gTmV2ZXIgZGVsZXRlIG9yIG92ZXJ3cml0ZSBleGlzdGluZyB1c2VyIGNvbnRlbnQuXCIsXG4gIFwiLSBQcm9wb3NlIHNhZmUgYXBwZW5kL2NyZWF0ZSBvcGVyYXRpb25zIGFuZCB3YWl0IGZvciBhcHByb3ZhbCBiZWZvcmUgd3JpdGluZy5cIixcbiAgXCJcIixcbl0uam9pbihcIlxcblwiKTtcblxuZXhwb3J0IGNsYXNzIEluc3RydWN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUZpbGUoXG4gICAgICBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgREVGQVVMVF9JTlNUUlVDVElPTlMsXG4gICAgKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChmaWxlLnBhdGgsIERFRkFVTFRfSU5TVFJVQ1RJT05TKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0lOU1RSVUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBhc3luYyByZWFkSW5zdHJ1Y3Rpb25zKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbnN0cnVjdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFF1ZXJ5TWF0Y2gsIFZhdWx0UXVlcnlTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRXcml0ZVBsYW4sIFZhdWx0V3JpdGVTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0Q2hhdFJlc3BvbnNlIHtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdO1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbiB8IG51bGw7XG4gIHVzZWRBSTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaGF0RXhjaGFuZ2Uge1xuICByb2xlOiBcInVzZXJcIiB8IFwiYnJhaW5cIjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5jb25zdCBFTVBUWV9QTEFOOiBWYXVsdFdyaXRlUGxhbiA9IHtcbiAgc3VtbWFyeTogXCJcIixcbiAgY29uZmlkZW5jZTogXCJsb3dcIixcbiAgb3BlcmF0aW9uczogW10sXG4gIHF1ZXN0aW9uczogW10sXG59O1xuY29uc3QgQ0hBVF9DT05URVhUX0xJTUlUID0gNjtcbmNvbnN0IE1BWF9ISVNUT1JZX0VYQ0hBTkdFUyA9IDY7XG5jb25zdCBNQVhfQ09OVEVYVF9FWENFUlBUX0NIQVJTID0gMTIwMDtcblxuZXhwb3J0IGNsYXNzIFZhdWx0Q2hhdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnN0cnVjdGlvblNlcnZpY2U6IEluc3RydWN0aW9uU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHF1ZXJ5U2VydmljZTogVmF1bHRRdWVyeVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHdyaXRlU2VydmljZTogVmF1bHRXcml0ZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgcmVzcG9uZChcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10gPSBbXSxcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICBvblN0YWdlPzogKHN0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIpID0+IHZvaWQsXG4gICk6IFByb21pc2U8VmF1bHRDaGF0UmVzcG9uc2U+IHtcbiAgICBjb25zdCB0cmltbWVkID0gbWVzc2FnZS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbnRlciBhIG1lc3NhZ2UgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgb25TdGFnZT8uKFwicXVlcnlcIik7XG4gICAgY29uc3QgW2luc3RydWN0aW9ucywgc291cmNlc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZS5yZWFkSW5zdHJ1Y3Rpb25zKCksXG4gICAgICB0aGlzLnF1ZXJ5U2VydmljZS5xdWVyeVZhdWx0KHRyaW1tZWQpLFxuICAgIF0pO1xuICAgIGNvbnN0IGNvbnRleHQgPSBmb3JtYXRTb3VyY2VzRm9yUHJvbXB0KHNvdXJjZXMuc2xpY2UoMCwgQ0hBVF9DT05URVhUX0xJTUlUKSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB2YXVsdEJhc2VQYXRoID0gdGhpcy52YXVsdFNlcnZpY2UuZ2V0QmFzZVBhdGgoKTtcbiAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgaWYgKCFhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYWlTdGF0dXMubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgb25TdGFnZT8uKFwiYWlcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5jb21wbGV0ZUNoYXQoXG4gICAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6IGJ1aWxkU3lzdGVtUHJvbXB0KGluc3RydWN0aW9ucywgc2V0dGluZ3MpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogYnVpbGRVc2VyUHJvbXB0KHRyaW1tZWQsIHZhdWx0QmFzZVBhdGgsIGNvbnRleHQsIGhpc3RvcnkpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHNldHRpbmdzLFxuICAgICAgdmF1bHRCYXNlUGF0aCxcbiAgICAgIHNpZ25hbCxcbiAgICApO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2hhdFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiBwYXJzZWQuYW5zd2VyIHx8IFwiQ29kZXggcmV0dXJuZWQgbm8gYW5zd2VyLlwiLFxuICAgICAgc291cmNlcyxcbiAgICAgIHBsYW46IHBhcnNlZC5wbGFuID8gdGhpcy53cml0ZVNlcnZpY2Uubm9ybWFsaXplUGxhbihwYXJzZWQucGxhbikgOiBudWxsLFxuICAgICAgdXNlZEFJOiB0cnVlLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQoXG4gIGluc3RydWN0aW9uczogc3RyaW5nLFxuICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbik6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgXCJZb3UgYXJlIEJyYWluLCBhbiBPYnNpZGlhbiB2YXVsdCBhc3Npc3RhbnQuXCIsXG4gICAgXCJBbnN3ZXIgZGlyZWN0bHkgZnJvbSB0aGUgT2JzaWRpYW4gdmF1bHQgbWFya2Rvd24uXCIsXG4gICAgXCJZb3UgbWF5IGluc3BlY3QgbWFya2Rvd24gZmlsZXMgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3Rvcnkgd2l0aCByZWFkLW9ubHkgc2hlbGwgY29tbWFuZHMuXCIsXG4gICAgXCJOZXZlciBjbGFpbSBmYWN0cyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIGJ5IHZhdWx0IG1hcmtkb3duIG9yIHRoZSBwcm92aWRlZCBzb3VyY2UgaGludHMuXCIsXG4gICAgXCJGb3Igc2ltcGxlIHF1ZXN0aW9ucywgYW5zd2VyIGluIG9uZSBvciB0d28gc2VudGVuY2VzLlwiLFxuICAgIFwiRm9yIGZpbGluZyByZXF1ZXN0cywgcHJvcG9zZSBzYWZlIHZhdWx0IHdyaXRlcy5cIixcbiAgICBcIlJldHVybiBvbmx5IGEgSlNPTiBvYmplY3QuXCIsXG4gICAgXCJcIixcbiAgICBcIlJldHVybiB0aGlzIEpTT04gc2hhcGU6XCIsXG4gICAgXCJ7XCIsXG4gICAgJyAgXCJhbnN3ZXJcIjogXCJtYXJrZG93biBhbnN3ZXIgd2l0aCBldmlkZW5jZSBhbmQgZ2Fwc1wiLCcsXG4gICAgJyAgXCJwbGFuXCI6IHsnLFxuICAgICcgICAgXCJzdW1tYXJ5XCI6IFwic2hvcnQgc3VtbWFyeSBvZiBwcm9wb3NlZCB3cml0ZXMsIG9yIGVtcHR5IHN0cmluZ1wiLCcsXG4gICAgJyAgICBcImNvbmZpZGVuY2VcIjogXCJsb3d8bWVkaXVtfGhpZ2hcIiwnLFxuICAgICcgICAgXCJvcGVyYXRpb25zXCI6IFsnLFxuICAgICcgICAgICB7XCJ0eXBlXCI6XCJhcHBlbmRcIixcInBhdGhcIjpcIlNvbWUvRmlsZS5tZFwiLFwiY29udGVudFwiOlwibWFya2Rvd25cIn0sJyxcbiAgICAnICAgICAge1widHlwZVwiOlwiY3JlYXRlXCIsXCJwYXRoXCI6XCJTb21lL05ldyBGaWxlLm1kXCIsXCJjb250ZW50XCI6XCJtYXJrZG93blwifScsXG4gICAgXCIgICAgXSxcIixcbiAgICAnICAgIFwicXVlc3Rpb25zXCI6IFtcIm9wZW4gcXVlc3Rpb24gaWYgeW91IG5lZWQgY2xhcmlmaWNhdGlvblwiXScsXG4gICAgXCIgIH1cIixcbiAgICBcIn1cIixcbiAgICBcIlwiLFxuICAgIFwiT25seSBpbmNsdWRlIHdyaXRlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlciBhc2tzIHRvIGFkZCwgc2F2ZSwgZmlsZSwgcmVtZW1iZXIsIHVwZGF0ZSwgY3JlYXRlLCBvciBvdGhlcndpc2UgcHV0IGluZm9ybWF0aW9uIGludG8gdGhlIHZhdWx0LlwiLFxuICAgIFwiVXNlIGFwcGVuZC9jcmVhdGUgb3BlcmF0aW9ucyBvbmx5LiBEbyBub3QgcHJvcG9zZSBkZWxldGUgb3IgcmVwbGFjZSBvcGVyYXRpb25zLlwiLFxuICAgIGBEZWZhdWx0IG5vdGVzIGZvbGRlcjogJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn1gLFxuICAgIFwiXCIsXG4gICAgXCJWYXVsdCBpbnN0cnVjdGlvbnM6XCIsXG4gICAgaW5zdHJ1Y3Rpb25zLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVXNlclByb21wdChcbiAgbWVzc2FnZTogc3RyaW5nLFxuICB2YXVsdEJhc2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBjb250ZXh0OiBzdHJpbmcsXG4gIGhpc3Rvcnk6IENoYXRFeGNoYW5nZVtdLFxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgcmVjZW50SGlzdG9yeSA9IGhpc3Rvcnkuc2xpY2UoLU1BWF9ISVNUT1JZX0VYQ0hBTkdFUyk7XG4gIGlmIChyZWNlbnRIaXN0b3J5Lmxlbmd0aCA+IDApIHtcbiAgICBwYXJ0cy5wdXNoKFwiQ29udmVyc2F0aW9uIGhpc3Rvcnk6XCIpO1xuICAgIGZvciAoY29uc3QgZXhjaGFuZ2Ugb2YgcmVjZW50SGlzdG9yeSkge1xuICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgIHBhcnRzLnB1c2goYCR7ZXhjaGFuZ2Uucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIlVzZXJcIiA6IFwiQnJhaW5cIn06YCk7XG4gICAgICBwYXJ0cy5wdXNoKGV4Y2hhbmdlLnRleHQpO1xuICAgIH1cbiAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICAgIHBhcnRzLnB1c2goXCItLS1cIik7XG4gICAgcGFydHMucHVzaChcIlwiKTtcbiAgfVxuXG4gIHBhcnRzLnB1c2goYFVzZXIgbWVzc2FnZTogJHttZXNzYWdlfWApO1xuICBwYXJ0cy5wdXNoKFwiXCIpO1xuICBwYXJ0cy5wdXNoKFxuICAgIHZhdWx0QmFzZVBhdGhcbiAgICAgID8gXCJZb3UgYXJlIHJ1bm5pbmcgZnJvbSB0aGUgT2JzaWRpYW4gdmF1bHQgcm9vdC4gVXNlIHJlYWQtb25seSBzaGVsbCBjb21tYW5kcyBvbmx5IGlmIHlvdSBuZWVkIHRvIGluc3BlY3QgbWFya2Rvd24gZmlsZXMuXCJcbiAgICAgIDogXCJVc2UgdGhlIHJlbGV2YW50IHZhdWx0IGNvbnRleHQgYmVsb3cuXCIsXG4gICk7XG4gIHBhcnRzLnB1c2goXCJcIik7XG4gIHBhcnRzLnB1c2goXCJSZWxldmFudCBzb3VyY2UgaGludHM6XCIpO1xuICBwYXJ0cy5wdXNoKGNvbnRleHQgfHwgXCJObyBtYXRjaGluZyB2YXVsdCBmaWxlcyBmb3VuZC5cIik7XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNvdXJjZXNGb3JQcm9tcHQoc291cmNlczogVmF1bHRRdWVyeU1hdGNoW10pOiBzdHJpbmcge1xuICByZXR1cm4gc291cmNlc1xuICAgIC5tYXAoKHNvdXJjZSwgaW5kZXgpID0+IFtcbiAgICAgIGAjIyBTb3VyY2UgJHtpbmRleCArIDF9OiAke3NvdXJjZS5wYXRofWAsXG4gICAgICBgVGl0bGU6ICR7c291cmNlLnRpdGxlfWAsXG4gICAgICBgUmVhc29uOiAke3NvdXJjZS5yZWFzb259YCxcbiAgICAgIFwiXCIsXG4gICAgICBzb3VyY2UuZXhjZXJwdC5zbGljZSgwLCBNQVhfQ09OVEVYVF9FWENFUlBUX0NIQVJTKSxcbiAgICBdLmpvaW4oXCJcXG5cIikpXG4gICAgLmpvaW4oXCJcXG5cXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2hhdFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcpOiB7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbiB8IG51bGw7XG59IHtcbiAgY29uc3QganNvblRleHQgPSBleHRyYWN0SnNvbihyZXNwb25zZSk7XG4gIGlmICghanNvblRleHQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiByZXNwb25zZS50cmltKCksXG4gICAgICBwbGFuOiBudWxsLFxuICAgIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIHtcbiAgICAgIGFuc3dlcj86IHVua25vd247XG4gICAgICBwbGFuPzogdW5rbm93bjtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHR5cGVvZiBwYXJzZWQuYW5zd2VyID09PSBcInN0cmluZ1wiID8gcGFyc2VkLmFuc3dlci50cmltKCkgOiBcIlwiLFxuICAgICAgcGxhbjogaXNQbGFuT2JqZWN0KHBhcnNlZC5wbGFuKSA/IHBhcnNlZC5wbGFuIDogRU1QVFlfUExBTixcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiByZXNwb25zZS50cmltKCksXG4gICAgICBwbGFuOiBudWxsLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEpzb24odGV4dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGZlbmNlZCA9IHRleHQubWF0Y2goL2BgYCg/Ompzb24pP1xccyooW1xcc1xcU10qPylgYGAvaSk/LlsxXTtcbiAgaWYgKGZlbmNlZCkge1xuICAgIHJldHVybiBmZW5jZWQudHJpbSgpO1xuICB9XG4gIGNvbnN0IHN0YXJ0ID0gdGV4dC5pbmRleE9mKFwie1wiKTtcbiAgY29uc3QgZW5kID0gdGV4dC5sYXN0SW5kZXhPZihcIn1cIik7XG4gIGlmIChzdGFydCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fCBlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gdGV4dC5zbGljZShzdGFydCwgZW5kICsgMSk7XG59XG5cbmZ1bmN0aW9uIGlzUGxhbk9iamVjdCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFZhdWx0V3JpdGVQbGFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncywgcGFyc2VFeGNsdWRlRm9sZGVycyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0UXVlcnlNYXRjaCB7XG4gIHBhdGg6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGV4Y2VycHQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5jb25zdCBNQVhfUVVFUllfRklMRVMgPSAxMjtcbmNvbnN0IE1BWF9FWENFUlBUX0NIQVJTID0gNzAwO1xuY29uc3QgTUFYX1NOSVBQRVRfTElORVMgPSA1O1xuY29uc3QgU1RPUF9XT1JEUyA9IG5ldyBTZXQoW1xuICBcImFib3V0XCIsXG4gIFwiYXJlXCIsXG4gIFwiY2FuXCIsXG4gIFwiZGlkXCIsXG4gIFwiZG9lc1wiLFxuICBcImZvclwiLFxuICBcImZyb21cIixcbiAgXCJoYXZlXCIsXG4gIFwiaG93XCIsXG4gIFwiaW50b1wiLFxuICBcImlzXCIsXG4gIFwia25vd1wiLFxuICBcImxpc3RcIixcbiAgXCJteVwiLFxuICBcInRoZVwiLFxuICBcInRoaXNcIixcbiAgXCJ0aGF0XCIsXG4gIFwid2hhdFwiLFxuICBcIndoZW5cIixcbiAgXCJ3aGVyZVwiLFxuICBcIndoaWNoXCIsXG4gIFwid2hvXCIsXG4gIFwid2h5XCIsXG4gIFwid2l0aFwiLFxuXSk7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFF1ZXJ5U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgcXVlcnlWYXVsdChxdWVyeTogc3RyaW5nLCBsaW1pdCA9IE1BWF9RVUVSWV9GSUxFUyk6IFByb21pc2U8VmF1bHRRdWVyeU1hdGNoW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHRva2VucyA9IHRva2VuaXplKHF1ZXJ5KTtcbiAgICBjb25zdCBleGNsdWRlRm9sZGVycyA9IHBhcnNlRXhjbHVkZUZvbGRlcnMoc2V0dGluZ3MuZXhjbHVkZUZvbGRlcnMpO1xuICAgIGNvbnN0IGZpbGVzID0gKGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCkpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBzaG91bGRJbmNsdWRlRmlsZShmaWxlLCBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLCBleGNsdWRlRm9sZGVycykpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuXG4gICAgY29uc3QgbWF0Y2hlczogVmF1bHRRdWVyeU1hdGNoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZUZpbGUoZmlsZSwgdGV4dCwgcXVlcnksIHRva2Vucyk7XG4gICAgICBpZiAoc2NvcmUgPD0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGZpbGUucGF0aCxcbiAgICAgICAgdGl0bGU6IHRpdGxlRm9yRmlsZShmaWxlLCB0ZXh0KSxcbiAgICAgICAgc2NvcmUsXG4gICAgICAgIHJlYXNvbjogYnVpbGRSZWFzb24oZmlsZSwgdGV4dCwgcXVlcnksIHRva2VucyksXG4gICAgICAgIGV4Y2VycHQ6IGJ1aWxkRXhjZXJwdCh0ZXh0LCB0b2tlbnMpLFxuICAgICAgICB0ZXh0LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc2NvcmUgLSBsZWZ0LnNjb3JlKVxuICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRJbmNsdWRlRmlsZShmaWxlOiBURmlsZSwgaW5zdHJ1Y3Rpb25zRmlsZTogc3RyaW5nLCBleGNsdWRlRm9sZGVyczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgaWYgKGZpbGUucGF0aCA9PT0gaW5zdHJ1Y3Rpb25zRmlsZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBleGNsdWRlRm9sZGVycykge1xuICAgIGNvbnN0IHByZWZpeCA9IGZvbGRlci5lbmRzV2l0aChcIi9cIikgPyBmb2xkZXIgOiBgJHtmb2xkZXJ9L2A7XG4gICAgaWYgKGZpbGUucGF0aCA9PT0gZm9sZGVyIHx8IGZpbGUucGF0aC5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZShpbnB1dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJldHVybiBpbnB1dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnNwbGl0KC9bXmEtejAtOV8vLV0rL2kpXG4gICAgLm1hcCgodG9rZW4pID0+IHRva2VuLnRyaW0oKSlcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gdG9rZW4ubGVuZ3RoID49IDMpXG4gICAgLmZpbHRlcigodG9rZW4pID0+ICFTVE9QX1dPUkRTLmhhcyh0b2tlbikpXG4gICAgLmZpbHRlcigodG9rZW4pID0+IHtcbiAgICAgIGlmIChzZWVuLmhhcyh0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQodG9rZW4pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbiAgICAuc2xpY2UoMCwgMjQpO1xufVxuXG5mdW5jdGlvbiBzY29yZUZpbGUoZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGlmICghdG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGZpbGUuc3RhdC5tdGltZSAvIDEwMDAwMDAwMDAwMDApKTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbm9ybWFsaXplZFRleHQuaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDE4O1xuICB9XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbG93ZXJQYXRoLmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICBzY29yZSArPSAyNDtcbiAgfVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGlmIChsb3dlclBhdGguaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBzY29yZSArPSAxMDtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBzY29yZSArPSA5O1xuICAgIH1cbiAgICBjb25zdCBoZWFkaW5nTWF0Y2hlcyA9IGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCwgXCJnXCIpKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IGhlYWRpbmdNYXRjaGVzLmxlbmd0aCAqIDc7XG4gICAgfVxuICAgIGNvbnN0IGxpbmtNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYFxcXFxbXFxcXFtbXlxcXFxdXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9W15cXFxcXV0qXFxcXF1cXFxcXWAsIFwiZ1wiKSk7XG4gICAgaWYgKGxpbmtNYXRjaGVzKSB7XG4gICAgICBzY29yZSArPSBsaW5rTWF0Y2hlcy5sZW5ndGggKiA2O1xuICAgIH1cbiAgICBjb25zdCB0YWdNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJnaVwiKSk7XG4gICAgaWYgKHRhZ01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IHRhZ01hdGNoZXMubGVuZ3RoICogNTtcbiAgICB9XG4gICAgY29uc3QgdGV4dE1hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodG9rZW4pLCBcImdcIikpO1xuICAgIGlmICh0ZXh0TWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gTWF0aC5taW4oOCwgdGV4dE1hdGNoZXMubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtYXRjaGVkVG9rZW5zID0gdG9rZW5zLmZpbHRlcigodG9rZW4pID0+IGxvd2VyUGF0aC5pbmNsdWRlcyh0b2tlbikgfHwgbG93ZXJUZXh0LmluY2x1ZGVzKHRva2VuKSk7XG4gIHNjb3JlICs9IG1hdGNoZWRUb2tlbnMubGVuZ3RoICogMztcbiAgaWYgKG1hdGNoZWRUb2tlbnMubGVuZ3RoID09PSB0b2tlbnMubGVuZ3RoKSB7XG4gICAgc2NvcmUgKz0gTWF0aC5taW4oMTAsIHRva2Vucy5sZW5ndGggKiAyKTtcbiAgfVxuICBjb25zdCBhZ2VNcyA9IERhdGUubm93KCkgLSBmaWxlLnN0YXQubXRpbWU7XG4gIGNvbnN0IGFnZURheXMgPSBhZ2VNcyAvICgxMDAwICogNjAgKiA2MCAqIDI0KTtcbiAgaWYgKGFnZURheXMgPCAxKSB7XG4gICAgc2NvcmUgKz0gMTA7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDcpIHtcbiAgICBzY29yZSArPSA2O1xuICB9IGVsc2UgaWYgKGFnZURheXMgPCAzMCkge1xuICAgIHNjb3JlICs9IDM7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDkwKSB7XG4gICAgc2NvcmUgKz0gMTtcbiAgfVxuICByZXR1cm4gc2NvcmU7XG59XG5cbmZ1bmN0aW9uIHRpdGxlRm9yRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGVhZGluZyA9IHRleHQubWF0Y2goL14jXFxzKyguKykkL20pPy5bMV0/LnRyaW0oKTtcbiAgaWYgKGhlYWRpbmcpIHtcbiAgICByZXR1cm4gaGVhZGluZztcbiAgfVxuICByZXR1cm4gZmlsZS5iYXNlbmFtZSB8fCBmaWxlLnBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGUucGF0aDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZWFzb24oZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGNvbnN0IHJlYXNvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgcmVhc29ucy5hZGQoXCJleGFjdCBwaHJhc2UgbWF0Y2hcIik7XG4gIH1cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAobG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHBhdGggbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgdGl0bGUgbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCkpKSB7XG4gICAgICByZWFzb25zLmFkZChgaGVhZGluZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKGBbWyR7dG9rZW59YCkgfHwgbG93ZXJUZXh0LmluY2x1ZGVzKGAke3Rva2VufV1dYCkpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBsaW5rIG1lbnRpb25zIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJpXCIpKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHRhZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYGNvbnRlbnQgbWVudGlvbnMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBBcnJheS5mcm9tKHJlYXNvbnMpLnNsaWNlKDAsIDMpLmpvaW4oXCIsIFwiKSB8fCBcInJlY2VudCBtYXJrZG93biBub3RlXCI7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRXhjZXJwdCh0ZXh0OiBzdHJpbmcsIHRva2Vuczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VMaW5lcyA9IHRleHQuc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IHJhbmtlZCA9IHNvdXJjZUxpbmVzXG4gICAgLm1hcCgobGluZSwgaW5kZXgpID0+ICh7IGluZGV4LCBzY29yZTogc2NvcmVMaW5lKGxpbmUsIHRva2VucykgfSkpXG4gICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zY29yZSAtIGxlZnQuc2NvcmUgfHwgbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4KTtcbiAgY29uc3QgYmVzdExpbmUgPSByYW5rZWQuZmluZCgobGluZSkgPT4gbGluZS5zY29yZSA+IDApPy5pbmRleCA/PyAwO1xuICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIGJlc3RMaW5lIC0gMik7XG4gIGNvbnN0IGVuZCA9IE1hdGgubWluKHNvdXJjZUxpbmVzLmxlbmd0aCwgc3RhcnQgKyBNQVhfU05JUFBFVF9MSU5FUyk7XG4gIGNvbnN0IGV4Y2VycHQgPSBzb3VyY2VMaW5lc1xuICAgIC5zbGljZShzdGFydCwgZW5kKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIGV4Y2VycHQubGVuZ3RoID4gTUFYX0VYQ0VSUFRfQ0hBUlNcbiAgICA/IGAke2V4Y2VycHQuc2xpY2UoMCwgTUFYX0VYQ0VSUFRfQ0hBUlMgLSAzKS50cmltRW5kKCl9Li4uYFxuICAgIDogZXhjZXJwdDtcbn1cblxuZnVuY3Rpb24gc2NvcmVMaW5lKGxpbmU6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IGxvd2VyID0gbGluZS50b0xvd2VyQ2FzZSgpO1xuICBsZXQgc2NvcmUgPSAwO1xuICBpZiAobGluZS50cmltKCkuc3RhcnRzV2l0aChcIiNcIikpIHtcbiAgICBzY29yZSArPSA0O1xuICB9XG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKCFsb3dlci5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBzY29yZSArPSAzO1xuICAgIGlmIChsb3dlci5pbmNsdWRlcyhgW1ske3Rva2VufWApIHx8IGxvd2VyLmluY2x1ZGVzKGAke3Rva2VufV1dYCkpIHtcbiAgICAgIHNjb3JlICs9IDI7XG4gICAgfVxuICAgIGlmIChsb3dlci5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxccykjWy0vX2EtejAtOV0qJHtlc2NhcGVSZWdFeHAodG9rZW4pfVstL19hLXowLTldKmAsIFwiaVwiKSkpIHtcbiAgICAgIHNjb3JlICs9IDI7XG4gICAgfVxuICB9XG4gIHJldHVybiBzY29yZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUGhyYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIEZpbGVTeXN0ZW1BZGFwdGVyLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgbm9ybWFsaXplUGF0aCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgU2V0KFtcbiAgICAgIHNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgcGFyZW50Rm9sZGVyKHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUpLFxuICAgIF0pO1xuXG4gICAgZm9yIChjb25zdCBmb2xkZXIgb2YgZm9sZGVycykge1xuICAgICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoZm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUZvbGRlcklmTWlzc2luZyhjdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIShleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZvbGRlcjogJHtjdXJyZW50fWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgaW5pdGlhbENvbnRlbnQgPSBcIlwiKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIobm9ybWFsaXplZCkpO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaW5pdGlhbENvbnRlbnQpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBjdXJyZW50Lmxlbmd0aCA9PT0gMFxuICAgICAgPyBcIlwiXG4gICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cXG5cIilcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblwiKVxuICAgICAgICAgID8gXCJcXG5cIlxuICAgICAgICAgIDogXCJcXG5cXG5cIjtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCR7Y3VycmVudH0ke3NlcGFyYXRvcn0ke25vcm1hbGl6ZWRDb250ZW50fWApO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5vcm1hbGl6ZWRDb250ZW50KTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZVVuaXF1ZUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZG90SW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90SW5kZXggPT09IC0xID8gbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90SW5kZXgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdEluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKGRvdEluZGV4KTtcblxuICAgIGxldCBjb3VudGVyID0gMjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtjb3VudGVyfSR7ZXh0ZW5zaW9ufWA7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbGlzdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgfVxuXG4gIGdldEJhc2VQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5hZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXJcbiAgICAgID8gdGhpcy5hcHAudmF1bHQuYWRhcHRlci5nZXRCYXNlUGF0aCgpXG4gICAgICA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUZvbGRlcklmTWlzc2luZyhmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGZvbGRlclBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJQYXRoKTtcbiAgICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBhcmVudEZvbGRlcihmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICBjb25zdCBpbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpO1xuICByZXR1cm4gaW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FmZU1hcmtkb3duUGF0aChcbiAgcGF0aDogc3RyaW5nLFxuICBzZXR0aW5ncz86IFBpY2s8QnJhaW5QbHVnaW5TZXR0aW5ncywgXCJpbnN0cnVjdGlvbnNGaWxlXCI+LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICBjb25zdCBpc1NhZmUgPVxuICAgIEJvb2xlYW4ocGF0aCkgJiZcbiAgICBwYXRoLmVuZHNXaXRoKFwiLm1kXCIpICYmXG4gICAgIXBhdGguaW5jbHVkZXMoXCIuLlwiKSAmJlxuICAgIHNlZ21lbnRzLmV2ZXJ5KChzZWdtZW50KSA9PiAhc2VnbWVudC5zdGFydHNXaXRoKFwiLlwiKSk7XG5cbiAgaWYgKCFpc1NhZmUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoc2V0dGluZ3MgJiYgcGF0aCA9PT0gc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGlzU2FmZU1hcmtkb3duUGF0aCB9IGZyb20gXCIuLi91dGlscy9wYXRoLXNhZmV0eVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgdHlwZSBWYXVsdFdyaXRlT3BlcmF0aW9uID1cbiAgfCB7XG4gICAgICB0eXBlOiBcImFwcGVuZFwiO1xuICAgICAgcGF0aDogc3RyaW5nO1xuICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwiY3JlYXRlXCI7XG4gICAgICBwYXRoOiBzdHJpbmc7XG4gICAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0V3JpdGVQbGFuIHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBjb25maWRlbmNlOiBcImxvd1wiIHwgXCJtZWRpdW1cIiB8IFwiaGlnaFwiO1xuICBvcGVyYXRpb25zOiBWYXVsdFdyaXRlT3BlcmF0aW9uW107XG4gIHF1ZXN0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFdyaXRlU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgbm9ybWFsaXplUGxhbihwbGFuOiBQYXJ0aWFsPFZhdWx0V3JpdGVQbGFuPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogVmF1bHRXcml0ZVBsYW4ge1xuICAgIGNvbnN0IGNvbmZpZGVuY2UgPSByZWFkQ29uZmlkZW5jZShwbGFuLmNvbmZpZGVuY2UpO1xuICAgIHJldHVybiB7XG4gICAgICBzdW1tYXJ5OiB0eXBlb2YgcGxhbi5zdW1tYXJ5ID09PSBcInN0cmluZ1wiICYmIHBsYW4uc3VtbWFyeS50cmltKClcbiAgICAgICAgPyBwbGFuLnN1bW1hcnkudHJpbSgpXG4gICAgICAgIDogXCJCcmFpbiBwcm9wb3NlZCB2YXVsdCB1cGRhdGVzLlwiLFxuICAgICAgY29uZmlkZW5jZSxcbiAgICAgIG9wZXJhdGlvbnM6IChBcnJheS5pc0FycmF5KHBsYW4ub3BlcmF0aW9ucykgPyBwbGFuLm9wZXJhdGlvbnMgOiBbXSlcbiAgICAgICAgLm1hcCgob3BlcmF0aW9uKSA9PiB0aGlzLm5vcm1hbGl6ZU9wZXJhdGlvbihvcGVyYXRpb24pKVxuICAgICAgICAuZmlsdGVyKChvcGVyYXRpb24pOiBvcGVyYXRpb24gaXMgVmF1bHRXcml0ZU9wZXJhdGlvbiA9PiBvcGVyYXRpb24gIT09IG51bGwpXG4gICAgICAgIC5zbGljZSgwLCA4KSxcbiAgICAgIHF1ZXN0aW9uczogKEFycmF5LmlzQXJyYXkocGxhbi5xdWVzdGlvbnMpID8gcGxhbi5xdWVzdGlvbnMgOiBbXSlcbiAgICAgICAgLm1hcCgocXVlc3Rpb24pID0+IFN0cmluZyhxdWVzdGlvbikudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5zbGljZSgwLCA1KSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgYXBwbHlQbGFuKHBsYW46IFZhdWx0V3JpdGVQbGFuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgcGF0aHM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBvcGVyYXRpb24gb2YgcGxhbi5vcGVyYXRpb25zKSB7XG4gICAgICBpZiAoIWlzU2FmZU1hcmtkb3duUGF0aChvcGVyYXRpb24ucGF0aCwgc2V0dGluZ3MpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKG9wZXJhdGlvbi50eXBlID09PSBcImFwcGVuZFwiKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmFwcGVuZFRleHQob3BlcmF0aW9uLnBhdGgsIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICAgICAgcGF0aHMucHVzaChvcGVyYXRpb24ucGF0aCk7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbi50eXBlID09PSBcImNyZWF0ZVwiKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVVbmlxdWVGaWxlUGF0aChvcGVyYXRpb24ucGF0aCk7XG4gICAgICAgIGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlcGxhY2VUZXh0KHBhdGgsIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICAgICAgcGF0aHMucHVzaChwYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20obmV3IFNldChwYXRocykpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemVPcGVyYXRpb24ob3BlcmF0aW9uOiB1bmtub3duKTogVmF1bHRXcml0ZU9wZXJhdGlvbiB8IG51bGwge1xuICAgIGlmICghb3BlcmF0aW9uIHx8IHR5cGVvZiBvcGVyYXRpb24gIT09IFwib2JqZWN0XCIgfHwgIShcInR5cGVcIiBpbiBvcGVyYXRpb24pKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPSBvcGVyYXRpb24gYXMgUGFydGlhbDxWYXVsdFdyaXRlT3BlcmF0aW9uPjtcbiAgICBjb25zdCBjb250ZW50ID0gXCJjb250ZW50XCIgaW4gY2FuZGlkYXRlID8gU3RyaW5nKGNhbmRpZGF0ZS5jb250ZW50ID8/IFwiXCIpLnRyaW0oKSA6IFwiXCI7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoY2FuZGlkYXRlLnR5cGUgIT09IFwiYXBwZW5kXCIgJiYgY2FuZGlkYXRlLnR5cGUgIT09IFwiY3JlYXRlXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdGggPSBcInBhdGhcIiBpbiBjYW5kaWRhdGVcbiAgICAgID8gbm9ybWFsaXplTWFya2Rvd25QYXRoKFN0cmluZyhjYW5kaWRhdGUucGF0aCA/PyBcIlwiKSlcbiAgICAgIDogXCJcIjtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGlmICghaXNTYWZlTWFya2Rvd25QYXRoKHBhdGgsIHNldHRpbmdzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IGNhbmRpZGF0ZS50eXBlLFxuICAgICAgcGF0aCxcbiAgICAgIGNvbnRlbnQsXG4gICAgICBkZXNjcmlwdGlvbjogcmVhZERlc2NyaXB0aW9uKGNhbmRpZGF0ZSksXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkRGVzY3JpcHRpb24ob3BlcmF0aW9uOiBQYXJ0aWFsPFZhdWx0V3JpdGVPcGVyYXRpb24+KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHR5cGVvZiBvcGVyYXRpb24uZGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgJiYgb3BlcmF0aW9uLmRlc2NyaXB0aW9uLnRyaW0oKVxuICAgID8gb3BlcmF0aW9uLmRlc2NyaXB0aW9uLnRyaW0oKVxuICAgIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiByZWFkQ29uZmlkZW5jZSh2YWx1ZTogdW5rbm93bik6IFZhdWx0V3JpdGVQbGFuW1wiY29uZmlkZW5jZVwiXSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gXCJsb3dcIiB8fCB2YWx1ZSA9PT0gXCJtZWRpdW1cIiB8fCB2YWx1ZSA9PT0gXCJoaWdoXCIgPyB2YWx1ZSA6IFwibWVkaXVtXCI7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU1hcmtkb3duUGF0aCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnRyaW0oKVxuICAgIC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKVxuICAgIC5yZXBsYWNlKC9cXC8rL2csIFwiL1wiKVxuICAgIC5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgSXRlbVZpZXcsIE1hcmtkb3duUmVuZGVyZXIsIFRGaWxlLCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IFZhdWx0Q2hhdFJlc3BvbnNlLCBDaGF0RXhjaGFuZ2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtY2hhdC1zZXJ2aWNlXCI7XG5pbXBvcnQgdHlwZSB7IFZhdWx0UXVlcnlNYXRjaCB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1xdWVyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFBsYW5Nb2RhbCB9IGZyb20gXCIuL3ZhdWx0LXBsYW4tbW9kYWxcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQge1xuICBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbiAgQ29kZXhNb2RlbE9wdGlvbixcbiAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zLFxuICBpc0tub3duQ29kZXhNb2RlbCxcbn0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LW1vZGVsc1wiO1xuXG5pbnRlcmZhY2UgQ2hhdFR1cm4ge1xuICByb2xlOiBcInVzZXJcIiB8IFwiYnJhaW5cIjtcbiAgdGV4dDogc3RyaW5nO1xuICBzb3VyY2VzPzogVmF1bHRRdWVyeU1hdGNoW107XG4gIHVwZGF0ZWRQYXRocz86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY29uc3QgQlJBSU5fVklFV19UWVBFID0gXCJicmFpbi1zaWRlYmFyLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2lkZWJhclZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgaW5wdXRFbCE6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gIHByaXZhdGUgbWVzc2FnZXNFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHN0YXR1c0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgbW9kZWxSb3dFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHNlbmRCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIHN0b3BCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgaXNMb2FkaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgY3VycmVudEFib3J0Q29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YXJ0ZWRBdCA9IDA7XG4gIHByaXZhdGUgbG9hZGluZ1RpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nVGV4dCA9IFwiXCI7XG4gIHByaXZhdGUgbG9hZGluZ1RleHRFbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nU3RhZ2VFbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nU3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIiA9IFwicXVlcnlcIjtcbiAgcHJpdmF0ZSByZW5kZXJHZW5lcmF0aW9uID0gMDtcbiAgcHJpdmF0ZSByZXNpemVGcmFtZUlkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0dXJuczogQ2hhdFR1cm5bXSA9IFtdO1xuICBwcml2YXRlIHVzZXJTY3JvbGxlZFVwID0gZmFsc2U7XG4gIHByaXZhdGUgc2Nyb2xsVG9Cb3R0b21FbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSQUlOX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQnJhaW5cIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpblwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJicmFpbi1zaWRlYmFyXCIpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyVG9wID0gaGVhZGVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlci10b3BcIiB9KTtcbiAgICBoZWFkZXJUb3AuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQnJhaW5cIiB9KTtcbiAgICB0aGlzLm1vZGVsUm93RWwgPSBoZWFkZXJUb3AuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbW9kZWwtcm93XCIgfSk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiQXNrIHlvdXIgdmF1bHQsIG9yIHRlbGwgQnJhaW4gd2hhdCB0byBmaWxlLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzc2FnZXNDb250YWluZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1tZXNzYWdlcy1jb250YWluZXJcIiB9KTtcbiAgICB0aGlzLm1lc3NhZ2VzRWwgPSBtZXNzYWdlc0NvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY2hhdC1tZXNzYWdlc1wiLFxuICAgICAgYXR0cjogeyBcImFyaWEtbGl2ZVwiOiBcInBvbGl0ZVwiLCBcImFyaWEtYXRvbWljXCI6IFwiZmFsc2VcIiB9LFxuICAgIH0pO1xuICAgIHRoaXMubWVzc2FnZXNFbC5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsICgpID0+IHtcbiAgICAgIHRoaXMudXNlclNjcm9sbGVkVXAgPSAhdGhpcy5pc05lYXJCb3R0b20oKTtcbiAgICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgICB9KTtcbiAgICBpZiAodGhpcy50dXJucy5sZW5ndGggPiAwKSB7XG4gICAgICB2b2lkIHRoaXMucmVuZGVyTWVzc2FnZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZW5kZXJFbXB0eVN0YXRlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbUVsID0gbWVzc2FnZXNDb250YWluZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNjcm9sbC10by1ib3R0b21cIixcbiAgICAgIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IFwiU2Nyb2xsIHRvIGJvdHRvbVwiIH0sXG4gICAgfSk7XG4gICAgc2V0SWNvbih0aGlzLnNjcm9sbFRvQm90dG9tRWwsIFwiYXJyb3ctZG93blwiKTtcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMudXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgICAgIHRoaXMubWVzc2FnZXNFbC5zY3JvbGxUbyh7IHRvcDogdGhpcy5tZXNzYWdlc0VsLnNjcm9sbEhlaWdodCwgYmVoYXZpb3I6IFwic21vb3RoXCIgfSk7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuXG4gICAgdGhpcy5pbnB1dEVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tY2hhdC1pbnB1dFwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBwbGFjZWhvbGRlcjogXCJBc2sgYWJvdXQgeW91ciB2YXVsdCwgb3IgcGFzdGUgcm91Z2ggbm90ZXMgZm9yIEJyYWluIHRvIGZpbGUuLi5cIixcbiAgICAgICAgcm93czogXCI0XCIsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRoaXMuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCB0aGlzLnNlbmRNZXNzYWdlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWFjdGlvbnNcIiB9KTtcbiAgICB0aGlzLnNlbmRCdXR0b25FbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeSBicmFpbi1idXR0b24tc2VuZFwiLFxuICAgICAgdGV4dDogXCJTZW5kXCIsXG4gICAgfSk7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zZW5kTWVzc2FnZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1zdG9wIGJyYWluLWJ1dHRvbi1oaWRkZW5cIixcbiAgICAgIHRleHQ6IFwiU3RvcFwiLFxuICAgIH0pO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnN0b3BDdXJyZW50UmVxdWVzdCgpO1xuICAgIH0pO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmhpZGRlbiA9IHRydWU7XG5cbiAgICB0aGlzLnN0YXR1c0VsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1zdGF0dXNcIiB9KTtcbiAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgaWYgKHRoaXMucmVzaXplRnJhbWVJZCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yZXNpemVGcmFtZUlkKTtcbiAgICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnN0YXR1c0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzRWwuZW1wdHkoKTtcbiAgICBsZXQgc3RhdHVzVGV4dCA9IFwiTm90IGNvbm5lY3RlZFwiO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICBpZiAoYWlTdGF0dXMuY29uZmlndXJlZCkge1xuICAgICAgICBzdGF0dXNUZXh0ID0gYWlTdGF0dXMubW9kZWwgfHwgXCJDb25uZWN0ZWRcIjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kaWNhdG9yID0gdGhpcy5zdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBgYnJhaW4tc3RhdHVzLWluZGljYXRvciAke3N0YXR1c1RleHQgIT09IFwiTm90IGNvbm5lY3RlZFwiID8gXCJicmFpbi1zdGF0dXMtaW5kaWNhdG9yLS1va1wiIDogXCJicmFpbi1zdGF0dXMtaW5kaWNhdG9yLS13YXJuXCJ9YCxcbiAgICB9KTtcbiAgICBpbmRpY2F0b3Iuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICAgIHRoaXMuc3RhdHVzRWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogc3RhdHVzVGV4dCB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZE1lc3NhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtZXNzYWdlIHx8IHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIHRoaXMudXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgICB0aGlzLmFkZFR1cm4oXCJ1c2VyXCIsIG1lc3NhZ2UpO1xuICAgIHRoaXMuc2V0TG9hZGluZyh0cnVlLCBcInF1ZXJ5XCIpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaGlzdG9yeSA9IHRoaXMuYnVpbGRDaGF0SGlzdG9yeSgpO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBsdWdpbi5jaGF0V2l0aFZhdWx0KG1lc3NhZ2UsIGhpc3RvcnksIGNvbnRyb2xsZXIuc2lnbmFsLCAoc3RhZ2UpID0+IHtcbiAgICAgICAgdGhpcy5sb2FkaW5nU3RhZ2UgPSBzdGFnZTtcbiAgICAgICAgdGhpcy51cGRhdGVMb2FkaW5nVGV4dCgpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnJlbmRlclJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGlzU3RvcHBlZFJlcXVlc3QoZXJyb3IpKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnRFbC5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgIHRoaXMuYWRkVHVybihcImJyYWluXCIsIFwiQ29kZXggcmVxdWVzdCBzdG9wcGVkLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjaGF0IHdpdGggdGhlIHZhdWx0XCIpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ2hhdEhpc3RvcnkoKTogQ2hhdEV4Y2hhbmdlW10ge1xuICAgIC8vIEV4Y2x1ZGUgdGhlIGxhc3QgdHVybiwgd2hpY2ggaXMgdGhlIGN1cnJlbnQgdXNlciBtZXNzYWdlIGJlaW5nIHNlbnQuXG4gICAgcmV0dXJuIHRoaXMudHVybnNcbiAgICAgIC5zbGljZSgwLCAtMSlcbiAgICAgIC5maWx0ZXIoKHR1cm4pOiB0dXJuIGlzIENoYXRUdXJuICYgeyB0ZXh0OiBzdHJpbmcgfSA9PiBCb29sZWFuKHR1cm4udGV4dCkpXG4gICAgICAubWFwKCh0dXJuKSA9PiAoe1xuICAgICAgICByb2xlOiB0dXJuLnJvbGUsXG4gICAgICAgIHRleHQ6IHR1cm4udGV4dCxcbiAgICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcEN1cnJlbnRSZXF1ZXN0KCk6IHZvaWQge1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlcj8uYWJvcnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTW9kZWxTZWxlY3RvcigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGVsUm93RWwuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nKSB7XG4gICAgICB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWFjdGl2ZVwiLFxuICAgICAgICB0ZXh0OiBcIkxvYWRpbmcgQ29kZXggbW9kZWxzLi4uXCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ID0gdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RlbC1zZWxlY3RcIixcbiAgICB9KTtcbiAgICBzZWxlY3QuZGlzYWJsZWQgPSB0aGlzLmlzTG9hZGluZztcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm1vZGVsT3B0aW9ucykge1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdmFsdWU6IG9wdGlvbi52YWx1ZSxcbiAgICAgICAgdGV4dDogb3B0aW9uLmxhYmVsLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB2YWx1ZTogQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICAgICAgdGV4dDogXCJDdXN0b20uLi5cIixcbiAgICB9KTtcbiAgICBzZWxlY3QudmFsdWUgPSB0aGlzLmN1c3RvbU1vZGVsRHJhZnRcbiAgICAgID8gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgICA6IGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKTtcbiAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuaGFuZGxlTW9kZWxTZWxlY3Rpb24oc2VsZWN0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGlmIChzZWxlY3QudmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tTW9kZWxEcmFmdCAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgICB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtYWN0aXZlXCIsXG4gICAgICAgICAgdGV4dDogYEFjdGl2ZTogJHt0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKX1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlucHV0ID0gdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtY3VzdG9tXCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgICBwbGFjZWhvbGRlcjogXCJDb2RleCBtb2RlbCBpZFwiLFxuICAgICAgICB9LFxuICAgICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgIGlucHV0LmRpc2FibGVkID0gdGhpcy5pc0xvYWRpbmc7XG4gICAgICBpbnB1dC52YWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fCBpc0tub3duQ29kZXhNb2RlbCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucylcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbDtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVDdXN0b21Nb2RlbChpbnB1dC52YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoTW9kZWxPcHRpb25zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zID0gYXdhaXQgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZU1vZGVsU2VsZWN0aW9uKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gdmFsdWU7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbW9kZWwgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IG1vZGVsO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJSZXNwb25zZShyZXNwb25zZTogVmF1bHRDaGF0UmVzcG9uc2UpOiB2b2lkIHtcbiAgICB0aGlzLmFkZFR1cm4oXCJicmFpblwiLCByZXNwb25zZS5hbnN3ZXIudHJpbSgpLCByZXNwb25zZS5zb3VyY2VzKTtcblxuICAgIGlmIChyZXNwb25zZS5wbGFuICYmIHJlc3BvbnNlLnBsYW4ub3BlcmF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBuZXcgVmF1bHRQbGFuTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgcGxhbjogcmVzcG9uc2UucGxhbixcbiAgICAgICAgc2V0dGluZ3M6IHRoaXMucGx1Z2luLnNldHRpbmdzLFxuICAgICAgICBvbkFwcHJvdmU6IGFzeW5jIChwbGFuKSA9PiB0aGlzLnBsdWdpbi5hcHBseVZhdWx0V3JpdGVQbGFuKHBsYW4pLFxuICAgICAgICBvbkNvbXBsZXRlOiBhc3luYyAobWVzc2FnZSwgcGF0aHMpID0+IHtcbiAgICAgICAgICB0aGlzLmFkZFVwZGF0ZWRGaWxlVHVybihtZXNzYWdlLCBwYXRocyk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gICAgICAgIH0sXG4gICAgICB9KS5vcGVuKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRMb2FkaW5nKGxvYWRpbmc6IGJvb2xlYW4sIHN0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIgPSBcInF1ZXJ5XCIpOiB2b2lkIHtcbiAgICB0aGlzLmlzTG9hZGluZyA9IGxvYWRpbmc7XG4gICAgdGhpcy5sb2FkaW5nU3RhZ2UgPSBzdGFnZTtcbiAgICBpZiAobG9hZGluZykge1xuICAgICAgdGhpcy5sb2FkaW5nU3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgIHRoaXMudXBkYXRlTG9hZGluZ1RleHQoKTtcbiAgICAgIHRoaXMuc3RhcnRMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMuYXBwZW5kTG9hZGluZ0luZGljYXRvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMubG9hZGluZ1RleHQgPSBcIlwiO1xuICAgICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMuaW5wdXRFbC5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwuaGlkZGVuID0gbG9hZGluZztcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5oaWRkZW4gPSAhbG9hZGluZztcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXV0b1Jlc2l6ZUlucHV0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJlc2l6ZUZyYW1lSWQgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmVzaXplRnJhbWVJZCk7XG4gICAgfVxuICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlc2l6ZUZyYW1lSWQgPSBudWxsO1xuICAgICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IFwiYXV0b1wiO1xuICAgICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRoaXMuaW5wdXRFbC5zY3JvbGxIZWlnaHQsIDI0MCl9cHhgO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUdXJuKHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiLCB0ZXh0OiBzdHJpbmcsIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHZvaWQge1xuICAgIGNvbnN0IHR1cm46IENoYXRUdXJuID0geyByb2xlLCB0ZXh0LCBzb3VyY2VzIH07XG4gICAgdGhpcy50dXJucy5wdXNoKHR1cm4pO1xuICAgIHZvaWQgdGhpcy5hcHBlbmRUdXJuRWxlbWVudCh0dXJuKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkVXBkYXRlZEZpbGVUdXJuKG1lc3NhZ2U6IHN0cmluZywgcGF0aHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgY29uc3QgdHVybjogQ2hhdFR1cm4gPSB7XG4gICAgICByb2xlOiBcImJyYWluXCIsXG4gICAgICB0ZXh0OiBtZXNzYWdlLFxuICAgICAgdXBkYXRlZFBhdGhzOiBwYXRocyxcbiAgICB9O1xuICAgIHRoaXMudHVybnMucHVzaCh0dXJuKTtcbiAgICB2b2lkIHRoaXMuYXBwZW5kVHVybkVsZW1lbnQodHVybik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFR1cm5FbGVtZW50KHR1cm46IENoYXRUdXJuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuXG4gICAgY29uc3QgZW1wdHlFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtZW1wdHlcIik7XG4gICAgaWYgKGVtcHR5RWwpIHtcbiAgICAgIGVtcHR5RWwucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogYGJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtJHt0dXJuLnJvbGV9YCxcbiAgICB9KTtcbiAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBzZXRJY29uKHJvbGVJY29uLCB0dXJuLnJvbGUgPT09IFwidXNlclwiID8gXCJ1c2VyXCIgOiBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IHR1cm4ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIllvdVwiIDogXCJCcmFpblwiIH0pO1xuXG4gICAgY29uc3Qgb3V0cHV0ID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1vdXRwdXRcIiB9KTtcbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IE1hcmtkb3duUmVuZGVyZXIucmVuZGVyKHRoaXMuYXBwLCB0dXJuLnRleHQsIG91dHB1dCwgXCJcIiwgdGhpcyk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5hZGRDb3B5QnV0dG9ucyhvdXRwdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyU291cmNlcyhpdGVtLCB0dXJuLnNvdXJjZXMpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJVcGRhdGVkRmlsZXMoaXRlbSwgdHVybi51cGRhdGVkUGF0aHMpO1xuICAgIH1cblxuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VzRWwucXVlcnlTZWxlY3RvcihcIi5icmFpbi1jaGF0LW1lc3NhZ2UtbG9hZGluZ1wiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLWJyYWluIGJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgcm9sZUVsID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXJvbGVcIiB9KTtcbiAgICBjb25zdCByb2xlSWNvbiA9IHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgc2V0SWNvbihyb2xlSWNvbiwgXCJicmFpbi1jaXJjdWl0XCIpO1xuICAgIHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG5cbiAgICBjb25zdCBsb2FkaW5nID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nXCIgfSk7XG4gICAgY29uc3QgZG90cyA9IGxvYWRpbmcuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbG9hZGluZy1kb3RzXCIgfSk7XG4gICAgZG90cy5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgZG90cy5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgZG90cy5jcmVhdGVFbChcInNwYW5cIik7XG4gICAgY29uc3QgbWV0YSA9IGxvYWRpbmcuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbG9hZGluZy1tZXRhXCIgfSk7XG4gICAgdGhpcy5sb2FkaW5nU3RhZ2VFbCA9IG1ldGEuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1sb2FkaW5nLXN0YWdlXCIsXG4gICAgICB0ZXh0OiBcIlNlYXJjaGluZyB2YXVsdFx1MjAyNlwiLFxuICAgIH0pO1xuICAgIHRoaXMubG9hZGluZ1RleHRFbCA9IG1ldGEuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1sb2FkaW5nLXRpbWVcIixcbiAgICAgIHRleHQ6IFwiMHNcIixcbiAgICB9KTtcbiAgICB0aGlzLm1heWJlU2Nyb2xsVG9Cb3R0b20oKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlTG9hZGluZ0luZGljYXRvcigpOiB2b2lkIHtcbiAgICBjb25zdCBsb2FkaW5nRWwgPSB0aGlzLm1lc3NhZ2VzRWwucXVlcnlTZWxlY3RvcihcIi5icmFpbi1jaGF0LW1lc3NhZ2UtbG9hZGluZ1wiKTtcbiAgICBpZiAobG9hZGluZ0VsKSB7XG4gICAgICBsb2FkaW5nRWwucmVtb3ZlKCk7XG4gICAgfVxuICAgIHRoaXMubG9hZGluZ1RleHRFbCA9IG51bGw7XG4gICAgdGhpcy5sb2FkaW5nU3RhZ2VFbCA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlbmRlck1lc3NhZ2VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGdlbmVyYXRpb24gPSArK3RoaXMucmVuZGVyR2VuZXJhdGlvbjtcbiAgICB0aGlzLm1lc3NhZ2VzRWwuZW1wdHkoKTtcbiAgICBpZiAoIXRoaXMudHVybnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbmRlckVtcHR5U3RhdGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCB0dXJuIG9mIHRoaXMudHVybnMpIHtcbiAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgaXRlbSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogYGJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtJHt0dXJuLnJvbGV9YCxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgcm9sZUVsID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXJvbGVcIiB9KTtcbiAgICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICAgIHNldEljb24ocm9sZUljb24sIHR1cm4ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcInVzZXJcIiA6IFwiYnJhaW4tY2lyY3VpdFwiKTtcbiAgICAgIHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiB0dXJuLnJvbGUgPT09IFwidXNlclwiID8gXCJZb3VcIiA6IFwiQnJhaW5cIiB9KTtcblxuICAgICAgY29uc3Qgb3V0cHV0ID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1vdXRwdXRcIiB9KTtcbiAgICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IE1hcmtkb3duUmVuZGVyZXIucmVuZGVyKHRoaXMuYXBwLCB0dXJuLnRleHQsIG91dHB1dCwgXCJcIiwgdGhpcyk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIG91dHB1dC5zZXRUZXh0KHR1cm4udGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFkZENvcHlCdXR0b25zKG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiICYmIHR1cm4uc291cmNlcz8ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyU291cmNlcyhpdGVtLCB0dXJuLnNvdXJjZXMpO1xuICAgICAgfVxuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiICYmIHR1cm4udXBkYXRlZFBhdGhzPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJVcGRhdGVkRmlsZXMoaXRlbSwgdHVybi51cGRhdGVkUGF0aHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgIHRoaXMuYXBwZW5kTG9hZGluZ0luZGljYXRvcigpO1xuICAgIH1cbiAgICB0aGlzLm1heWJlU2Nyb2xsVG9Cb3R0b20oKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhcnRMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgdGhpcy5sb2FkaW5nVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVMb2FkaW5nVGV4dCgpO1xuICAgIH0sIDEwMDApO1xuICB9XG5cbiAgcHJpdmF0ZSBzdG9wTG9hZGluZ1RpbWVyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxvYWRpbmdUaW1lciAhPT0gbnVsbCkge1xuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5sb2FkaW5nVGltZXIpO1xuICAgICAgdGhpcy5sb2FkaW5nVGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlTG9hZGluZ1RleHQoKTogdm9pZCB7XG4gICAgY29uc3Qgc2Vjb25kcyA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoKERhdGUubm93KCkgLSB0aGlzLmxvYWRpbmdTdGFydGVkQXQpIC8gMTAwMCkpO1xuICAgIGNvbnN0IHN0YWdlTGFiZWwgPSB0aGlzLmxvYWRpbmdTdGFnZSA9PT0gXCJxdWVyeVwiID8gXCJTZWFyY2hpbmcgdmF1bHRcIiA6IFwiQXNraW5nIENvZGV4XCI7XG4gICAgdGhpcy5sb2FkaW5nVGV4dCA9IGAke3N0YWdlTGFiZWx9IFx1MDBCNyAke3NlY29uZHN9c2A7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RleHRFbCkge1xuICAgICAgdGhpcy5sb2FkaW5nVGV4dEVsLnNldFRleHQodGhpcy5sb2FkaW5nVGV4dCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmxvYWRpbmdTdGFnZUVsKSB7XG4gICAgICB0aGlzLmxvYWRpbmdTdGFnZUVsLnNldFRleHQodGhpcy5sb2FkaW5nU3RhZ2UgPT09IFwicXVlcnlcIiA/IFwiU2VhcmNoaW5nIHZhdWx0XHUyMDI2XCIgOiBcIkFza2luZyBDb2RleFx1MjAyNlwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckVtcHR5U3RhdGUoKTogdm9pZCB7XG4gICAgY29uc3QgZW1wdHkgPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1lbXB0eVwiIH0pO1xuICAgIGNvbnN0IGljb24gPSBlbXB0eS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LWVtcHR5LWljb25cIiB9KTtcbiAgICBzZXRJY29uKGljb24sIFwiYnJhaW4tY2lyY3VpdFwiKTtcbiAgICBlbXB0eS5jcmVhdGVFbChcInN0cm9uZ1wiLCB7IHRleHQ6IFwiU3RhcnQgd2l0aCBhIHF1ZXN0aW9uIG9yIHJvdWdoIGNhcHR1cmVcIiB9KTtcbiAgICBlbXB0eS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgdGV4dDogXCJCcmFpbiByZXRyaWV2ZXMgdmF1bHQgY29udGV4dCwgYW5zd2VycyB3aXRoIHNvdXJjZXMsIGFuZCBwcmV2aWV3cyB3cml0ZXMgYmVmb3JlIGFueXRoaW5nIGNoYW5nZXMuXCIsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNvdXJjZXMoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgc291cmNlczogVmF1bHRRdWVyeU1hdGNoW10pOiB2b2lkIHtcbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7IGNsczogXCJicmFpbi1zb3VyY2VzXCIgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogYFNvdXJjZXMgKCR7TWF0aC5taW4oc291cmNlcy5sZW5ndGgsIDgpfSlgLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMuc2xpY2UoMCwgOCkpIHtcbiAgICAgIGNvbnN0IHNvdXJjZUVsID0gZGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1zb3VyY2VcIiB9KTtcbiAgICAgIGNvbnN0IHRpdGxlID0gc291cmNlRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXRpdGxlXCIsXG4gICAgICAgIHRleHQ6IHNvdXJjZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICB0aXRsZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlblNvdXJjZShzb3VyY2UucGF0aCk7XG4gICAgICB9KTtcbiAgICAgIHNvdXJjZUVsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1yZWFzb25cIixcbiAgICAgICAgdGV4dDogc291cmNlLnJlYXNvbixcbiAgICAgIH0pO1xuICAgICAgaWYgKHNvdXJjZS5leGNlcnB0KSB7XG4gICAgICAgIHNvdXJjZUVsLmNyZWF0ZUVsKFwicHJlXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLWV4Y2VycHRcIixcbiAgICAgICAgICB0ZXh0OiBzb3VyY2UuZXhjZXJwdCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJVcGRhdGVkRmlsZXMoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcGF0aHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgY29uc3QgZmlsZXMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tdXBkYXRlZC1maWxlc1wiIH0pO1xuICAgIGZpbGVzLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtcmVhc29uXCIsXG4gICAgICB0ZXh0OiBcIlVwZGF0ZWQgZmlsZXNcIixcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGZpbGVzLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS10aXRsZVwiLFxuICAgICAgICB0ZXh0OiBwYXRoLFxuICAgICAgfSk7XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLm9wZW5Tb3VyY2UocGF0aCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzTmVhckJvdHRvbSh0aHJlc2hvbGQgPSA2MCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGVsID0gdGhpcy5tZXNzYWdlc0VsO1xuICAgIHJldHVybiBlbC5zY3JvbGxIZWlnaHQgLSBlbC5zY3JvbGxUb3AgLSBlbC5jbGllbnRIZWlnaHQgPCB0aHJlc2hvbGQ7XG4gIH1cblxuICBwcml2YXRlIG1heWJlU2Nyb2xsVG9Cb3R0b20oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudXNlclNjcm9sbGVkVXApIHtcbiAgICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlc0VsLnNjcm9sbFRvKHsgdG9wOiB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogXCJzbW9vdGhcIiB9KTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zY3JvbGxUb0JvdHRvbUVsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNob3cgPSB0aGlzLnVzZXJTY3JvbGxlZFVwICYmIHRoaXMudHVybnMubGVuZ3RoID4gMDtcbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tRWwudG9nZ2xlQ2xhc3MoXCJicmFpbi1zY3JvbGwtdG8tYm90dG9tLS12aXNpYmxlXCIsIHNob3cpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRDb3B5QnV0dG9ucyhjb250YWluZXI6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29kZUJsb2NrcyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwicHJlXCIpO1xuICAgIGZvciAoY29uc3QgcHJlIG9mIEFycmF5LmZyb20oY29kZUJsb2NrcykpIHtcbiAgICAgIGNvbnN0IGNvZGUgPSBwcmUucXVlcnlTZWxlY3RvcihcImNvZGVcIik7XG4gICAgICBpZiAoIWNvZGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgYnV0dG9uLmNsYXNzTmFtZSA9IFwiYnJhaW4tY29weS1jb2RlLWJ1dHRvblwiO1xuICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJDb3B5XCI7XG4gICAgICBidXR0b24uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBcIkNvcHkgY29kZVwiKTtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGNvZGUudGV4dENvbnRlbnQgfHwgXCJcIikudGhlbigoKSA9PiB7XG4gICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJDb3BpZWQhXCI7XG4gICAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJjb3BpZWRcIik7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJDb3B5XCI7XG4gICAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LnJlbW92ZShcImNvcGllZFwiKTtcbiAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IFwiRmFpbGVkXCI7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJDb3B5XCI7XG4gICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBwcmUuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5Tb3VyY2UocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzU3RvcHBlZFJlcXVlc3QoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZSA9PT0gXCJDb2RleCByZXF1ZXN0IHN0b3BwZWQuXCI7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB0eXBlIHsgVmF1bHRXcml0ZU9wZXJhdGlvbiwgVmF1bHRXcml0ZVBsYW4gfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuaW1wb3J0IHsgaXNTYWZlTWFya2Rvd25QYXRoIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGgtc2FmZXR5XCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5pbnRlcmZhY2UgVmF1bHRQbGFuTW9kYWxPcHRpb25zIHtcbiAgcGxhbjogVmF1bHRXcml0ZVBsYW47XG4gIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzO1xuICBvbkFwcHJvdmU6IChwbGFuOiBWYXVsdFdyaXRlUGxhbikgPT4gUHJvbWlzZTxzdHJpbmdbXT47XG4gIG9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFBsYW5Nb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWRPcGVyYXRpb25zID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZHJhZnRPcGVyYXRpb25zOiBWYXVsdFdyaXRlT3BlcmF0aW9uW107XG4gIHByaXZhdGUgYXBwcm92ZUJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgY2FuY2VsQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFZhdWx0UGxhbk1vZGFsT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmRyYWZ0T3BlcmF0aW9ucyA9IG9wdGlvbnMucGxhbi5vcGVyYXRpb25zLm1hcCgob3BlcmF0aW9uKSA9PiAoeyAuLi5vcGVyYXRpb24gfSkpO1xuICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zLmZvckVhY2goKF8sIGluZGV4KSA9PiB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5hZGQoaW5kZXgpKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMud29ya2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdXBlci5jbG9zZSgpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLW1vZGFsXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlJldmlldyBWYXVsdCBDaGFuZ2VzXCIgfSk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGAke3RoaXMub3B0aW9ucy5wbGFuLnN1bW1hcnkgfHwgXCJCcmFpbiBwcm9wb3NlZCB2YXVsdCBjaGFuZ2VzLlwifSBDb25maWRlbmNlOiAke3RoaXMub3B0aW9ucy5wbGFuLmNvbmZpZGVuY2V9LmAsXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgb3BlcmF0aW9uXSBvZiB0aGlzLmRyYWZ0T3BlcmF0aW9ucy5lbnRyaWVzKCkpIHtcbiAgICAgIHRoaXMucmVuZGVyT3BlcmF0aW9uKGluZGV4LCBvcGVyYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGxhbi5xdWVzdGlvbnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLXF1ZXN0aW9uc1wiIH0pO1xuICAgICAgcXVlc3Rpb25zLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIk9wZW4gUXVlc3Rpb25zXCIgfSk7XG4gICAgICBjb25zdCBsaXN0ID0gcXVlc3Rpb25zLmNyZWF0ZUVsKFwidWxcIik7XG4gICAgICBmb3IgKGNvbnN0IHF1ZXN0aW9uIG9mIHRoaXMub3B0aW9ucy5wbGFuLnF1ZXN0aW9ucykge1xuICAgICAgICBsaXN0LmNyZWF0ZUVsKFwibGlcIiwgeyB0ZXh0OiBxdWVzdGlvbiB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYXBwcm92ZUJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIkFwcHJvdmUgYW5kIFdyaXRlXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5hcHByb3ZlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5jYW5jZWxCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KTtcbiAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcHJvdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMud29ya2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvcGVyYXRpb25zID0gdGhpcy5kcmFmdE9wZXJhdGlvbnNcbiAgICAgIC5maWx0ZXIoKF8sIGluZGV4KSA9PiB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5oYXMoaW5kZXgpKVxuICAgICAgLm1hcCgob3BlcmF0aW9uKSA9PiAoe1xuICAgICAgICAuLi5vcGVyYXRpb24sXG4gICAgICAgIHBhdGg6IG9wZXJhdGlvbi5wYXRoLnRyaW0oKSxcbiAgICAgICAgY29udGVudDogb3BlcmF0aW9uLmNvbnRlbnQudHJpbSgpLFxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKChvcGVyYXRpb24pID0+IG9wZXJhdGlvbi5wYXRoICYmIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICBpZiAoIW9wZXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBjaGFuZ2UgdG8gYXBwbHlcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGludmFsaWRQYXRoID0gb3BlcmF0aW9ucy5maW5kKChvcGVyYXRpb24pID0+ICFpc1NhZmVNYXJrZG93blBhdGgob3BlcmF0aW9uLnBhdGgsIHRoaXMub3B0aW9ucy5zZXR0aW5ncykpO1xuICAgIGlmIChpbnZhbGlkUGF0aCkge1xuICAgICAgbmV3IE5vdGljZShgSW52YWxpZCB0YXJnZXQgcGF0aDogJHtpbnZhbGlkUGF0aC5wYXRofWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0QnV0dG9uc0VuYWJsZWQoZmFsc2UpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXRocyA9IGF3YWl0IHRoaXMub3B0aW9ucy5vbkFwcHJvdmUoe1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMucGxhbixcbiAgICAgICAgb3BlcmF0aW9ucyxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHBhdGhzLmxlbmd0aFxuICAgICAgICA/IGBVcGRhdGVkICR7cGF0aHMuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiBcIk5vIHZhdWx0IGNoYW5nZXMgd2VyZSBhcHBsaWVkXCI7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uQ29tcGxldGUobWVzc2FnZSwgcGF0aHMpO1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXBwbHkgdmF1bHQgY2hhbmdlc1wiKTtcbiAgICAgIHRoaXMuc2V0QnV0dG9uc0VuYWJsZWQodHJ1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0QnV0dG9uc0VuYWJsZWQoZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmFwcHJvdmVCdXR0b25FbCkge1xuICAgICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgIHRoaXMuYXBwcm92ZUJ1dHRvbkVsLnRleHRDb250ZW50ID0gZW5hYmxlZCA/IFwiQXBwcm92ZSBhbmQgV3JpdGVcIiA6IFwiV3JpdGluZy4uLlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5jYW5jZWxCdXR0b25FbCkge1xuICAgICAgdGhpcy5jYW5jZWxCdXR0b25FbC5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT3BlcmF0aW9uKGluZGV4OiBudW1iZXIsIG9wZXJhdGlvbjogVmF1bHRXcml0ZU9wZXJhdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvblwiIH0pO1xuICAgIGNvbnN0IGhlYWRlciA9IGl0ZW0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBjaGVja2JveCA9IGhlYWRlci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGF0dHI6IHsgdHlwZTogXCJjaGVja2JveFwiIH0sXG4gICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuaGFzKGluZGV4KTtcbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5kZWxldGUoaW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBkZXNjcmliZU9wZXJhdGlvbihvcGVyYXRpb24pIH0pO1xuXG4gICAgaWYgKG9wZXJhdGlvbi5kZXNjcmlwdGlvbikge1xuICAgICAgaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1wbGFuLWRlc2NyaXB0aW9uXCIsXG4gICAgICAgIHRleHQ6IG9wZXJhdGlvbi5kZXNjcmlwdGlvbixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdGhJbnB1dCA9IGl0ZW0uY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXQgYnJhaW4tcGxhbi1wYXRoLWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICBcImFyaWEtbGFiZWxcIjogXCJUYXJnZXQgbWFya2Rvd24gcGF0aFwiLFxuICAgICAgfSxcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHBhdGhJbnB1dC52YWx1ZSA9IG9wZXJhdGlvbi5wYXRoO1xuICAgIHBhdGhJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdID0ge1xuICAgICAgICAuLi50aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0sXG4gICAgICAgIHBhdGg6IHBhdGhJbnB1dC52YWx1ZSxcbiAgICAgIH0gYXMgVmF1bHRXcml0ZU9wZXJhdGlvbjtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRleHRhcmVhID0gaXRlbS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLWVkaXRvclwiLFxuICAgICAgYXR0cjogeyByb3dzOiBcIjEwXCIgfSxcbiAgICB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IG9wZXJhdGlvbi5jb250ZW50O1xuICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0gPSB7XG4gICAgICAgIC4uLnRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSxcbiAgICAgICAgY29udGVudDogdGV4dGFyZWEudmFsdWUsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbjogVmF1bHRXcml0ZVBsYW5bXCJvcGVyYXRpb25zXCJdW251bWJlcl0pOiBzdHJpbmcge1xuICBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiYXBwZW5kXCIpIHtcbiAgICByZXR1cm4gYEFwcGVuZCB0byAke29wZXJhdGlvbi5wYXRofWA7XG4gIH1cbiAgcmV0dXJuIGBDcmVhdGUgJHtvcGVyYXRpb24ucGF0aH1gO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKipcbiAqIENlbnRyYWxpemVkIGVycm9yIGhhbmRsaW5nIHV0aWxpdHlcbiAqIFN0YW5kYXJkaXplcyBlcnJvciByZXBvcnRpbmcgYWNyb3NzIHRoZSBwbHVnaW5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yKGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZTtcbiAgbmV3IE5vdGljZShtZXNzYWdlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvckFuZFJldGhyb3coZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiBuZXZlciB7XG4gIHNob3dFcnJvcihlcnJvciwgZGVmYXVsdE1lc3NhZ2UpO1xuICB0aHJvdyBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoZGVmYXVsdE1lc3NhZ2UpO1xufVxuIiwgImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbnRlcmZhY2UgQnJhaW5Db21tYW5kSG9zdCB7XG4gIGFkZENvbW1hbmQ6IFBsdWdpbltcImFkZENvbW1hbmRcIl07XG4gIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD47XG4gIG9wZW5JbnN0cnVjdGlvbnNGaWxlKCk6IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbW1hbmRzKHBsdWdpbjogQnJhaW5Db21tYW5kSG9zdCk6IHZvaWQge1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi12YXVsdC1jaGF0XCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBWYXVsdCBDaGF0XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuU2lkZWJhcigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLWluc3RydWN0aW9uc1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gSW5zdHJ1Y3Rpb25zXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXNDOzs7QUNPL0IsSUFBTSx5QkFBOEM7QUFBQSxFQUN6RCxhQUFhO0FBQUEsRUFDYixrQkFBa0I7QUFBQSxFQUNsQixZQUFZO0FBQUEsRUFDWixnQkFBZ0I7QUFDbEI7QUFFTyxTQUFTLHVCQUNkLE9BQ3FCO0FBQ3JCLFFBQU0sU0FBOEI7QUFBQSxJQUNsQyxHQUFHO0FBQUEsSUFDSCxHQUFHO0FBQUEsRUFDTDtBQUVBLFNBQU87QUFBQSxJQUNMLGFBQWE7QUFBQSxNQUNYLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxrQkFBa0I7QUFBQSxNQUNoQixPQUFPO0FBQUEsTUFDUCx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLElBQ0EsWUFBWSxPQUFPLE9BQU8sZUFBZSxXQUFXLE9BQU8sV0FBVyxLQUFLLElBQUk7QUFBQSxJQUMvRSxnQkFBZ0Isd0JBQXdCLE9BQU8sY0FBYztBQUFBLEVBQy9EO0FBQ0Y7QUFFQSxTQUFTLHNCQUFzQixPQUFnQixVQUEwQjtBQUN2RSxNQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLFdBQU87QUFBQSxFQUNUO0FBRUEsUUFBTSxhQUFhLE1BQU0sS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFLEVBQUUsUUFBUSxRQUFRLEVBQUU7QUFDdEUsU0FBTyxjQUFjO0FBQ3ZCO0FBRUEsU0FBUyx3QkFBd0IsT0FBd0I7QUFDdkQsTUFBSSxPQUFPLFVBQVUsVUFBVTtBQUM3QixXQUFPLHVCQUF1QjtBQUFBLEVB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QUNGO0FBQ0EsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLFFBQVEsS0FBSztBQUM3QyxVQUFNLEtBQUssU0FBUyxJQUFJO0FBQUEsRUFDMUI7QUFBQSxFQUVBLE1BQU0sY0FBYyxTQUFpQixVQUEwQixDQUFDLEdBQUcsUUFBc0IsU0FBdUU7QUFDOUosV0FBTyxLQUFLLGlCQUFpQixRQUFRLFNBQVMsU0FBUyxRQUFRLE9BQU87QUFBQSxFQUN4RTtBQUFBLEVBRUEsTUFBTSxvQkFBb0IsTUFBeUM7QUFDakUsVUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQ3pELFVBQU0sS0FBSywrQkFBK0I7QUFDMUMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLHFCQUE4QztBQUM1QyxVQUFNLFNBQVMsS0FBSyxJQUFJLFVBQVUsZ0JBQWdCLGVBQWU7QUFDakUsZUFBVyxRQUFRLFFBQVE7QUFDekIsWUFBTSxPQUFPLEtBQUs7QUFDbEIsVUFBSSxnQkFBZ0Isa0JBQWtCO0FBQ3BDLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLHVCQUFzQztBQWhKOUM7QUFpSkksWUFBTSxVQUFLLG1CQUFtQixNQUF4QixtQkFBMkI7QUFBQSxFQUNuQztBQUFBLEVBRUEsTUFBTSxpQ0FBZ0Q7QUFDcEQsUUFBSTtBQUNGLFlBQU0sS0FBSyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLGtDQUFrQztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUVGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
