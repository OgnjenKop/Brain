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
  if (process.platform === "win32") {
    if (process.env.APPDATA) {
      commonDirs.push(pathModule.join(process.env.APPDATA, "npm"));
    }
    if (process.env.LOCALAPPDATA) {
      commonDirs.push(pathModule.join(process.env.LOCALAPPDATA, "Programs", "Codex"));
    }
  }
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
      plan: isPlanObject(parsed.plan) ? parsed.plan : null
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
    if (new RegExp(`\\[\\[[^\\]]*${escapeRegExp(token)}[^\\]]*\\]\\]`, "i").test(lowerText)) {
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
      return;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbm9kZS1ydW50aW1lLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3V0aWxzL2NvZGV4LW1vZGVscy50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgtc2FmZXR5LnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCUkFJTl9WSUVXX1RZUEUsIEJyYWluU2lkZWJhclZpZXcgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBpbnN0cnVjdGlvblNlcnZpY2UhOiBJbnN0cnVjdGlvblNlcnZpY2U7XG4gIHZhdWx0UXVlcnlTZXJ2aWNlITogVmF1bHRRdWVyeVNlcnZpY2U7XG4gIHZhdWx0V3JpdGVTZXJ2aWNlITogVmF1bHRXcml0ZVNlcnZpY2U7XG4gIHZhdWx0Q2hhdFNlcnZpY2UhOiBWYXVsdENoYXRTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlID0gbmV3IEluc3RydWN0aW9uU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UgPSBuZXcgVmF1bHRRdWVyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlID0gbmV3IFZhdWx0V3JpdGVTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdENoYXRTZXJ2aWNlID0gbmV3IFZhdWx0Q2hhdFNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFF1ZXJ5U2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZS5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBCcmFpbiBzdG9yYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgbG9hZCBCcmFpbiBzZXR0aW5nc1wiKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2U/LmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIEJyYWluIHN0b3JhZ2VcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGhpcy5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKGBDb3VsZCBub3Qgb3BlbiAke3RoaXMuc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZX1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBjaGF0V2l0aFZhdWx0KG1lc3NhZ2U6IHN0cmluZywgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10gPSBbXSwgc2lnbmFsPzogQWJvcnRTaWduYWwsIG9uU3RhZ2U/OiAoc3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIikgPT4gdm9pZCk6IFByb21pc2U8VmF1bHRDaGF0UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy52YXVsdENoYXRTZXJ2aWNlLnJlc3BvbmQobWVzc2FnZSwgaGlzdG9yeSwgc2lnbmFsLCBvblN0YWdlKTtcbiAgfVxuXG4gIGFzeW5jIGFwcGx5VmF1bHRXcml0ZVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcGF0aHMgPSBhd2FpdCB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlLmFwcGx5UGxhbihwbGFuKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiBwYXRocztcbiAgfVxuXG4gIGdldE9wZW5TaWRlYmFyVmlldygpOiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCB7XG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBsZWF2ZXMpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEJyYWluU2lkZWJhclZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIG5vdGVzRm9sZGVyOiBzdHJpbmc7XG4gIGluc3RydWN0aW9uc0ZpbGU6IHN0cmluZztcbiAgY29kZXhNb2RlbDogc3RyaW5nO1xuICBleGNsdWRlRm9sZGVyczogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CUkFJTl9TRVRUSU5HUzogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgbm90ZXNGb2xkZXI6IFwiTm90ZXNcIixcbiAgaW5zdHJ1Y3Rpb25zRmlsZTogXCJCcmFpbi9BR0VOVFMubWRcIixcbiAgY29kZXhNb2RlbDogXCJcIixcbiAgZXhjbHVkZUZvbGRlcnM6IFwiLm9ic2lkaWFuXFxubm9kZV9tb2R1bGVzXCIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBpbnN0cnVjdGlvbnNGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICApLFxuICAgIGNvZGV4TW9kZWw6IHR5cGVvZiBtZXJnZWQuY29kZXhNb2RlbCA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5jb2RleE1vZGVsLnRyaW0oKSA6IFwiXCIsXG4gICAgZXhjbHVkZUZvbGRlcnM6IG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKG1lcmdlZC5leGNsdWRlRm9sZGVycyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmV4Y2x1ZGVGb2xkZXJzO1xuICB9XG4gIHJldHVybiB2YWx1ZVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUV4Y2x1ZGVGb2xkZXJzKGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBleGNsdWRlRm9sZGVyc1xuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHtcbiAgQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4gIENvZGV4TW9kZWxPcHRpb24sXG4gIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlLFxuICBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucyxcbiAgaXNLbm93bkNvZGV4TW9kZWwsXG59IGZyb20gXCIuLi91dGlscy9jb2RleC1tb2RlbHNcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb2RlbE9wdGlvbnNMb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpbiBTZXR0aW5nc1wiIH0pO1xuICAgIGlmICghdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nICYmICF0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCkge1xuICAgICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdG9yYWdlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTm90ZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkRlZmF1bHQgZm9sZGVyIGZvciBuZXcgbWFya2Rvd24gbm90ZXMgY3JlYXRlZCBmcm9tIGFwcHJvdmVkIHdyaXRlIHBsYW5zLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5zdHJ1Y3Rpb25zIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB0aGF0IHRlbGxzIEJyYWluIGhvdyB0byBvcGVyYXRlIGluIHRoaXMgdmF1bHQuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSW5zdHJ1Y3Rpb25zIGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFeGNsdWRlZCBmb2xkZXJzXCIpXG4gICAgICAuc2V0RGVzYyhcIk9uZSBmb2xkZXIgcGF0aCBwZXIgbGluZS4gQnJhaW4gd2lsbCBza2lwIG1hcmtkb3duIGZpbGVzIGluc2lkZSB0aGVzZSBmb2xkZXJzIHdoZW4gc2VhcmNoaW5nIHRoZSB2YXVsdC5cIilcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVGb2xkZXJzKS5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5leGNsdWRlRm9sZGVycyA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiQ29kZXggQ0xJXCIgfSk7XG5cbiAgICB0aGlzLmNyZWF0ZUNvZGV4U3RhdHVzU2V0dGluZyhjb250YWluZXJFbCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggc2V0dXBcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkJyYWluIHVzZXMgb25seSB0aGUgbG9jYWwgQ29kZXggQ0xJLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gcmVjaGVjayBzdGF0dXMuXCIsXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiT3BlbiBDb2RleCBTZXR1cFwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKCk7XG4gICAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVjaGVjayBTdGF0dXNcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBjb25zdCBtb2RlbFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggbW9kZWxcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmdcbiAgICAgICAgICA/IFwiTG9hZGluZyBtb2RlbHMgZnJvbSB0aGUgaW5zdGFsbGVkIENvZGV4IENMSS4uLlwiXG4gICAgICAgICAgOiBcIk9wdGlvbmFsLiBTZWxlY3QgYSBtb2RlbCByZXBvcnRlZCBieSBDb2RleCBDTEksIG9yIGxlYXZlIGJsYW5rIHRvIHVzZSB0aGUgYWNjb3VudCBkZWZhdWx0LlwiLFxuICAgICAgKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm1vZGVsT3B0aW9ucykge1xuICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihvcHRpb24udmFsdWUsIG9wdGlvbi5sYWJlbCk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSwgXCJDdXN0b20uLi5cIilcbiAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnRcbiAgICAgICAgICAgICAgPyBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICAgICAgICAgICAgOiBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucyksXG4gICAgICAgICAgKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBtb2RlbFNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICBidXR0b25cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJSZWxvYWRcIilcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgICAgIH0pLFxuICAgICk7XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHxcbiAgICAgIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgKSB7XG4gICAgICBsZXQgZHJhZnRWYWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fCBpc0tub3duQ29kZXhNb2RlbCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucylcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbDtcbiAgICAgIGlmICh0aGlzLmN1c3RvbU1vZGVsRHJhZnQgJiYgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgLnNldE5hbWUoXCJBY3RpdmUgQ29kZXggbW9kZWxcIilcbiAgICAgICAgICAuc2V0RGVzYyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSk7XG4gICAgICB9XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJDdXN0b20gQ29kZXggbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJFeGFjdCBtb2RlbCBpZCBwYXNzZWQgdG8gYGNvZGV4IGV4ZWMgLS1tb2RlbGAuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dFxuICAgICAgICAgICAgLnNldFZhbHVlKGRyYWZ0VmFsdWUpXG4gICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGRyYWZ0VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUN1c3RvbU1vZGVsRHJhZnQoZHJhZnRWYWx1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9ucyA9IGF3YWl0IGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQ3VzdG9tTW9kZWxEcmFmdCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbW9kZWwgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IG1vZGVsO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMuZGlzcGxheSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDb2RleFN0YXR1c1NldHRpbmcoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdHVzU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBzdGF0dXNcIilcbiAgICAgIC5zZXREZXNjKFwiQ2hlY2tpbmcgQ29kZXggQ0xJIHN0YXR1cy4uLlwiKTtcbiAgICB2b2lkIHRoaXMucmVmcmVzaENvZGV4U3RhdHVzKHN0YXR1c1NldHRpbmcpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoQ29kZXhTdGF0dXMoc2V0dGluZzogU2V0dGluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgc2V0dGluZy5zZXREZXNjKHN0YXR1cy5tZXNzYWdlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBzZXR0aW5nLnNldERlc2MoXCJDb3VsZCBub3QgY2hlY2sgQ29kZXggQ0xJIHN0YXR1cy5cIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBiaW5kVGV4dFNldHRpbmcoXG4gICAgdGV4dDogVGV4dENvbXBvbmVudCxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIG9uVmFsdWVDaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbGlkYXRlPzogKHZhbHVlOiBzdHJpbmcpID0+IGJvb2xlYW4sXG4gICk6IFRleHRDb21wb25lbnQge1xuICAgIGxldCBsYXN0VmFsaWRWYWx1ZSA9IHZhbHVlO1xuXG4gICAgdGV4dC5zZXRWYWx1ZSh2YWx1ZSkub25DaGFuZ2UoKG5leHRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKCF2YWxpZGF0ZSB8fCB2YWxpZGF0ZShuZXh0VmFsdWUpKSB7XG4gICAgICAgIG9uVmFsdWVDaGFuZ2UobmV4dFZhbHVlKTtcbiAgICAgICAgbGFzdFZhbGlkVmFsdWUgPSBuZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gdGV4dC5pbnB1dEVsLnZhbHVlO1xuICAgICAgaWYgKHZhbGlkYXRlICYmICF2YWxpZGF0ZShjdXJyZW50VmFsdWUpKSB7XG4gICAgICAgIHRleHQuc2V0VmFsdWUobGFzdFZhbGlkVmFsdWUpO1xuICAgICAgICBvblZhbHVlQ2hhbmdlKGxhc3RWYWxpZFZhbHVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB9KTtcblxuICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiZcbiAgICAgICAgIWV2ZW50Lm1ldGFLZXkgJiZcbiAgICAgICAgIWV2ZW50LmN0cmxLZXkgJiZcbiAgICAgICAgIWV2ZW50LmFsdEtleSAmJlxuICAgICAgICAhZXZlbnQuc2hpZnRLZXlcbiAgICAgICkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0ZXh0LmlucHV0RWwuYmx1cigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cbn1cbiIsICIvKipcbiAqIFNoYXJlZCBOb2RlLmpzIHJ1bnRpbWUgaGVscGVycy5cbiAqXG4gKiBUaGVzZSB1c2UgZHluYW1pYyBgcmVxdWlyZSgpYCB2aWEgYEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKWAgdG9cbiAqIGJ5cGFzcyBlc2J1aWxkIGJ1bmRsaW5nIG9mIE5vZGUgYnVpbHQtaW5zLiBPYnNpZGlhbiBwbHVnaW5zIHJ1biBpbiBhblxuICogRWxlY3Ryb24vTm9kZSBjb250ZXh0IHdoZXJlIGByZXF1aXJlYCBpcyBhdmFpbGFibGUgYXQgcnVudGltZSBidXQgY2Fubm90XG4gKiBiZSBzdGF0aWNhbGx5IGJ1bmRsZWQuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVSZXF1aXJlKCk6IE5vZGVSZXF1aXJlIHtcbiAgcmV0dXJuIEZ1bmN0aW9uKFwicmV0dXJuIHJlcXVpcmVcIikoKSBhcyBOb2RlUmVxdWlyZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvZGV4UnVudGltZSgpOiB7XG4gIGV4ZWNGaWxlOiAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMsXG4gICAgY2FsbGJhY2s/OiAoXG4gICAgICBlcnJvcjogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZUV4Y2VwdGlvbiB8IG51bGwsXG4gICAgICBzdGRvdXQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICAgIHN0ZGVycjogc3RyaW5nIHwgQnVmZmVyLFxuICAgICkgPT4gdm9pZCxcbiAgKSA9PiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkNoaWxkUHJvY2VzcztcbiAgZnM6IHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKTtcbiAgb3M6IHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcbiAgcGF0aDogdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG59IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgY29uc3QgeyBleGVjRmlsZSB9ID0gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZTogZXhlY0ZpbGUgYXMgKFxuICAgICAgZmlsZTogc3RyaW5nLFxuICAgICAgYXJncz86IHJlYWRvbmx5IHN0cmluZ1tdLFxuICAgICAgb3B0aW9ucz86IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVPcHRpb25zLFxuICAgICAgY2FsbGJhY2s/OiAoXG4gICAgICAgIGVycm9yOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlRXhjZXB0aW9uIHwgbnVsbCxcbiAgICAgICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICAgIHN0ZGVycjogc3RyaW5nIHwgQnVmZmVyLFxuICAgICAgKSA9PiB2b2lkLFxuICAgICkgPT4gaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5DaGlsZFByb2Nlc3MsXG4gICAgZnM6IHJlcShcImZzL3Byb21pc2VzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKSxcbiAgICBvczogcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpLFxuICAgIHBhdGg6IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIiksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeGVjRmlsZUFzeW5jKCk6IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyxcbikgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PiB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgZXhlY0ZpbGUgfSA9IHJlcShcImNoaWxkX3Byb2Nlc3NcIikgYXMgdHlwZW9mIGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuICByZXR1cm4gcHJvbWlzaWZ5KGV4ZWNGaWxlKSBhcyAoXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGFyZ3M/OiByZWFkb25seSBzdHJpbmdbXSxcbiAgICBvcHRpb25zPzogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMsXG4gICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW5vZW50RXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBOb2RlSlMuRXJybm9FeGNlcHRpb24ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmIGVycm9yICE9PSBudWxsICYmIFwiY29kZVwiIGluIGVycm9yICYmIGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RpbWVvdXRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJraWxsZWRcIiBpbiBlcnJvciAmJiBlcnJvci5raWxsZWQgPT09IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Fib3J0RXJyb3IoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgXCJuYW1lXCIgaW4gZXJyb3IgJiZcbiAgICBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBSZWZlcmVuY2VFcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIFR5cGVFcnJvcjtcbn1cbiIsICJpbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jLCBnZXROb2RlUmVxdWlyZSwgaXNFbm9lbnRFcnJvciwgaXNOb2RlUnVudGltZVVuYXZhaWxhYmxlLCBpc1RpbWVvdXRFcnJvciB9IGZyb20gXCIuL25vZGUtcnVudGltZVwiO1xuXG5leHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5jb25zdCBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyA9IDUwMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGV4TG9naW5TdGF0dXMob3V0cHV0OiBzdHJpbmcpOiBDb2RleExvZ2luU3RhdHVzIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG91dHB1dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJub3QgbG9nZ2VkIGluXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgb3V0XCIpKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgaW5cIikgfHxcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwic2lnbmVkIGluXCIpIHx8XG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcImF1dGhlbnRpY2F0ZWRcIilcbiAgKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLWluXCI7XG4gIH1cblxuICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleExvZ2luU3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgICB9XG5cbiAgICBjb25zdCBleGVjRmlsZUFzeW5jID0gZ2V0RXhlY0ZpbGVBc3luYygpO1xuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIFtcImxvZ2luXCIsIFwic3RhdHVzXCJdLCB7XG4gICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0LFxuICAgICAgdGltZW91dDogQ09ERVhfTE9HSU5fU1RBVFVTX1RJTUVPVVRfTVMsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpIHx8IGlzVGltZW91dEVycm9yKGVycm9yKSB8fCBpc05vZGVSdW50aW1lVW5hdmFpbGFibGUoZXJyb3IpKSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4QmluYXJ5UGF0aCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgbGV0IHJlcTogTm9kZVJlcXVpcmU7XG4gIHRyeSB7XG4gICAgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmcyA9IHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKTtcbiAgY29uc3QgcGF0aCA9IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG4gIGNvbnN0IG9zID0gcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoLCBvcy5ob21lZGlyKCkpO1xuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgc2VhcmNoaW5nLlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoTW9kdWxlOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSwgaG9tZURpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBjYW5kaWRhdGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdGhFbnRyaWVzID0gKHByb2Nlc3MuZW52LlBBVEggPz8gXCJcIikuc3BsaXQocGF0aE1vZHVsZS5kZWxpbWl0ZXIpLmZpbHRlcihCb29sZWFuKTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhdGhFbnRyaWVzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGVudHJ5LCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1vbkRpcnM6IHN0cmluZ1tdID0gW1xuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgYCR7aG9tZURpcn0vLmxvY2FsL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmJ1bi9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5jb2RlaXVtL3dpbmRzdXJmL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmFudGlncmF2aXR5L2FudGlncmF2aXR5L2JpbmAsXG4gICAgXCIvQXBwbGljYXRpb25zL0NvZGV4LmFwcC9Db250ZW50cy9SZXNvdXJjZXNcIixcbiAgXTtcblxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52LkFQUERBVEEpIHtcbiAgICAgIGNvbW1vbkRpcnMucHVzaChwYXRoTW9kdWxlLmpvaW4ocHJvY2Vzcy5lbnYuQVBQREFUQSwgXCJucG1cIikpO1xuICAgIH1cbiAgICBpZiAocHJvY2Vzcy5lbnYuTE9DQUxBUFBEQVRBKSB7XG4gICAgICBjb21tb25EaXJzLnB1c2gocGF0aE1vZHVsZS5qb2luKHByb2Nlc3MuZW52LkxPQ0FMQVBQREFUQSwgXCJQcm9ncmFtc1wiLCBcIkNvZGV4XCIpKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IGRpciBvZiBjb21tb25EaXJzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGRpciwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShjYW5kaWRhdGVzKTtcbn1cblxuZnVuY3Rpb24gY29kZXhFeGVjdXRhYmxlTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJjb2RleC5jbWRcIiA6IFwiY29kZXhcIjtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlDb25maWd1cmF0aW9uU3RhdHVzIHtcbiAgY29uZmlndXJlZDogYm9vbGVhbjtcbiAgcHJvdmlkZXI6IFwiY29kZXhcIjtcbiAgbW9kZWw6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBjb25zdCBjb2RleFN0YXR1cyA9IGF3YWl0IGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgaWYgKGNvZGV4U3RhdHVzID09PSBcInVuYXZhaWxhYmxlXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgaW5zdGFsbGVkLlwiLFxuICAgIH07XG4gIH1cblxuICBpZiAoY29kZXhTdGF0dXMgIT09IFwibG9nZ2VkLWluXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgbG9nZ2VkIGluLlwiLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBtb2RlbCA9IHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpIHx8IG51bGw7XG4gIHJldHVybiB7XG4gICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgIG1vZGVsLFxuICAgIG1lc3NhZ2U6IG1vZGVsXG4gICAgICA/IGBSZWFkeSB0byB1c2UgQ29kZXggd2l0aCBtb2RlbCAke21vZGVsfS5gXG4gICAgICA6IFwiUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggdGhlIGFjY291bnQgZGVmYXVsdCBtb2RlbC5cIixcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5pbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jIH0gZnJvbSBcIi4vbm9kZS1ydW50aW1lXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZXhNb2RlbE9wdGlvbiB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM6IENvZGV4TW9kZWxPcHRpb25bXSA9IFtcbiAgeyB2YWx1ZTogXCJcIiwgbGFiZWw6IFwiQWNjb3VudCBkZWZhdWx0XCIgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUgPSBcIl9fY3VzdG9tX19cIjtcbmNvbnN0IENPREVYX01PREVMX0NBVEFMT0dfVElNRU9VVF9NUyA9IDgwMDA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPENvZGV4TW9kZWxPcHRpb25bXT4ge1xuICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhlY0ZpbGVBc3luYyA9IGdldEV4ZWNGaWxlQXN5bmMoKTtcbiAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBbXCJkZWJ1Z1wiLCBcIm1vZGVsc1wiXSwge1xuICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCAqIDIwLFxuICAgICAgdGltZW91dDogQ09ERVhfTU9ERUxfQ0FUQUxPR19USU1FT1VUX01TLFxuICAgIH0pO1xuICAgIHJldHVybiBwYXJzZUNvZGV4TW9kZWxDYXRhbG9nKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RleE1vZGVsQ2F0YWxvZyhvdXRwdXQ6IHN0cmluZyk6IENvZGV4TW9kZWxPcHRpb25bXSB7XG4gIGNvbnN0IGpzb25UZXh0ID0gZXh0cmFjdEpzb25PYmplY3Qob3V0cHV0KTtcbiAgaWYgKCFqc29uVGV4dCkge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIHtcbiAgICAgIG1vZGVscz86IEFycmF5PHtcbiAgICAgICAgc2x1Zz86IHVua25vd247XG4gICAgICAgIGRpc3BsYXlfbmFtZT86IHVua25vd247XG4gICAgICAgIHZpc2liaWxpdHk/OiB1bmtub3duO1xuICAgICAgfT47XG4gICAgfTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IFsuLi5ERUZBVUxUX0NPREVYX01PREVMX09QVElPTlNdO1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgcGFyc2VkLm1vZGVscyA/PyBbXSkge1xuICAgICAgY29uc3Qgc2x1ZyA9IHR5cGVvZiBtb2RlbC5zbHVnID09PSBcInN0cmluZ1wiID8gbW9kZWwuc2x1Zy50cmltKCkgOiBcIlwiO1xuICAgICAgaWYgKCFzbHVnIHx8IHNlZW4uaGFzKHNsdWcpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKG1vZGVsLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBtb2RlbC52aXNpYmlsaXR5ICE9PSBcImxpc3RcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHNlZW4uYWRkKHNsdWcpO1xuICAgICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgdmFsdWU6IHNsdWcsXG4gICAgICAgIGxhYmVsOiB0eXBlb2YgbW9kZWwuZGlzcGxheV9uYW1lID09PSBcInN0cmluZ1wiICYmIG1vZGVsLmRpc3BsYXlfbmFtZS50cmltKClcbiAgICAgICAgICA/IG1vZGVsLmRpc3BsYXlfbmFtZS50cmltKClcbiAgICAgICAgICA6IHNsdWcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKFxuICBtb2RlbDogc3RyaW5nLFxuICBvcHRpb25zOiByZWFkb25seSBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4pOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbW9kZWwudHJpbSgpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICByZXR1cm4gb3B0aW9ucy5zb21lKChvcHRpb24pID0+IG9wdGlvbi52YWx1ZSA9PT0gbm9ybWFsaXplZClcbiAgICA/IG5vcm1hbGl6ZWRcbiAgICA6IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzS25vd25Db2RleE1vZGVsKFxuICBtb2RlbDogc3RyaW5nLFxuICBvcHRpb25zOiByZWFkb25seSBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4pOiBib29sZWFuIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG1vZGVsLnRyaW0oKTtcbiAgcmV0dXJuIG9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT09IG5vcm1hbGl6ZWQpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SnNvbk9iamVjdChvdXRwdXQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzdGFydCA9IG91dHB1dC5pbmRleE9mKFwie1wiKTtcbiAgY29uc3QgZW5kID0gb3V0cHV0Lmxhc3RJbmRleE9mKFwifVwiKTtcbiAgaWYgKHN0YXJ0ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8IGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBvdXRwdXQuc2xpY2Uoc3RhcnQsIGVuZCArIDEpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4QmluYXJ5UGF0aCB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5pbXBvcnQgeyBnZXRDb2RleFJ1bnRpbWUsIGlzQWJvcnRFcnJvciwgaXNFbm9lbnRFcnJvciwgaXNUaW1lb3V0RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvbm9kZS1ydW50aW1lXCI7XG5cbmNvbnN0IENPREVYX0NIQVRfVElNRU9VVF9NUyA9IDEyMDAwMDtcblxuaW50ZXJmYWNlIEV4ZWNSZXN1bHQge1xuICBzdGRvdXQ6IHN0cmluZztcbiAgc3RkZXJyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkFJU2VydmljZSB7XG4gIGFzeW5jIGNvbXBsZXRlQ2hhdChcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBzdHJpbmcgfCBudWxsLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBvc3RDb2RleENvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzLCB3b3JraW5nRGlyZWN0b3J5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q29kZXhDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyB8IG51bGwsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBleGVjRmlsZSwgZnMsIG9zLCBwYXRoIH0gPSBnZXRDb2RleFJ1bnRpbWUoKTtcblxuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGVtcERpciA9IGF3YWl0IGZzLm1rZHRlbXAocGF0aC5qb2luKG9zLnRtcGRpcigpLCBcImJyYWluLWNvZGV4LVwiKSk7XG4gICAgY29uc3Qgb3V0cHV0RmlsZSA9IHBhdGguam9pbih0ZW1wRGlyLCBcInJlc3BvbnNlLnR4dFwiKTtcbiAgICBjb25zdCBhcmdzID0gW1xuICAgICAgXCJleGVjXCIsXG4gICAgICBcIi0tc2tpcC1naXQtcmVwby1jaGVja1wiLFxuICAgICAgXCItLWVwaGVtZXJhbFwiLFxuICAgICAgXCItLWlnbm9yZS1ydWxlc1wiLFxuICAgICAgXCItLXNhbmRib3hcIixcbiAgICAgIFwicmVhZC1vbmx5XCIsXG4gICAgICBcIi0tb3V0cHV0LWxhc3QtbWVzc2FnZVwiLFxuICAgICAgb3V0cHV0RmlsZSxcbiAgICBdO1xuXG4gICAgaWYgKHdvcmtpbmdEaXJlY3RvcnkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tY2RcIiwgd29ya2luZ0RpcmVjdG9yeSk7XG4gICAgfVxuXG4gICAgaWYgKHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICBhcmdzLnB1c2goXCItLW1vZGVsXCIsIHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKTtcbiAgICB9XG5cbiAgICBhcmdzLnB1c2goXCItXCIpO1xuICAgIGNvbnN0IHByb21wdCA9IHRoaXMuYnVpbGRDb2RleFByb21wdChtZXNzYWdlcyk7XG5cbiAgICBsZXQgZXhlY1Jlc3VsdDogRXhlY1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNSZXN1bHQgPSBhd2FpdCBleGVjRmlsZVdpdGhBYm9ydChjb2RleEJpbmFyeSwgYXJncywge1xuICAgICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogNCxcbiAgICAgICAgY3dkOiB0ZW1wRGlyLFxuICAgICAgICB0aW1lb3V0OiBDT0RFWF9DSEFUX1RJTUVPVVRfTVMsXG4gICAgICAgIHNpZ25hbCxcbiAgICAgICAgc3RkaW46IHByb21wdCxcbiAgICAgIH0sIGV4ZWNGaWxlKTtcblxuICAgICAgbGV0IGNvbnRlbnQ6IHN0cmluZztcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShvdXRwdXRGaWxlLCBcInV0ZjhcIik7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgaWYgKGV4ZWNSZXN1bHQuc3Rkb3V0LnRyaW0oKSkge1xuICAgICAgICAgIGNvbnRlbnQgPSBleGVjUmVzdWx0LnN0ZG91dC50cmltKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXhlY1Jlc3VsdC5zdGRlcnIudHJpbSgpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb2RleCBkaWQgbm90IHByb2R1Y2Ugb3V0cHV0LiBEZXRhaWxzOiAke2V4ZWNSZXN1bHQuc3RkZXJyLnRyaW0oKS5zbGljZSgwLCA1MDApfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IGRpZCBub3QgcHJvZHVjZSBhbnkgb3V0cHV0LiBUaGUgQ0xJIG1heSByZXF1aXJlIGEgbmV3ZXIgdmVyc2lvbiBvciBhIGRpZmZlcmVudCBjb25maWd1cmF0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlLlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCB8fCBpc0Fib3J0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIik7XG4gICAgICB9XG4gICAgICBpZiAoaXNUaW1lb3V0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIkNvZGV4IGRpZCBub3QgcmVzcG9uZCBpbiB0aW1lLiBUcnkgYWdhaW4sIG9yIGNoZWNrIGBjb2RleCBsb2dpbiBzdGF0dXNgIG91dHNpZGUgQnJhaW4uIFwiICtcbiAgICAgICAgICBcIklmIENvZGV4IHJlcXVpcmVzIGFwcHJvdmFsIGZvciBzaGVsbCBjb21tYW5kcywgY29uZmlndXJlIGl0IGZvciBub24taW50ZXJhY3RpdmUgdXNlLlwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGRlcnJEZXRhaWwgPSBleGVjUmVzdWx0Py5zdGRlcnI/LnRyaW0oKVxuICAgICAgICB8fCBnZXRFcnJvckRldGFpbChlcnJvciwgXCJzdGRlcnJcIilcbiAgICAgICAgfHwgXCJcIjtcbiAgICAgIGlmIChzdGRlcnJEZXRhaWwgJiYgZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZXJyb3IubWVzc2FnZX1cXG5Db2RleCBzdGRlcnI6ICR7c3RkZXJyRGV0YWlsLnNsaWNlKDAsIDUwMCl9YCk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgZnMucm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvZGV4UHJvbXB0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBtZXNzYWdlIG9mIG1lc3NhZ2VzKSB7XG4gICAgICBpZiAobWVzc2FnZS5yb2xlID09PSBcInN5c3RlbVwiKSB7XG4gICAgICAgIHBhcnRzLnB1c2gobWVzc2FnZS5jb250ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgIHBhcnRzLnB1c2goXCItLS1cIik7XG4gICAgICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgIHBhcnRzLnB1c2gobWVzc2FnZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFydHMuam9pbihcIlxcblwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjRmlsZVdpdGhBYm9ydChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzOiByZWFkb25seSBzdHJpbmdbXSxcbiAgb3B0aW9uczogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMgJiB7XG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gICAgc3RkaW4/OiBzdHJpbmc7XG4gIH0sXG4gIGV4ZWNGaWxlOiBSZXR1cm5UeXBlPHR5cGVvZiBnZXRDb2RleFJ1bnRpbWU+W1wiZXhlY0ZpbGVcIl0sXG4pOiBQcm9taXNlPEV4ZWNSZXN1bHQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHsgc2lnbmFsLCBzdGRpbiwgLi4uZXhlY09wdGlvbnMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgY2hpbGQgPSBleGVjRmlsZShmaWxlLCBhcmdzLCBleGVjT3B0aW9ucywgKGVycm9yLCBzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICBzaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgZW5yaWNoZWQgPSBlbnJpY2hFcnJvcihlcnJvciwgc3Rkb3V0LCBzdGRlcnIpO1xuICAgICAgICByZWplY3QoZW5yaWNoZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgc3Rkb3V0OiBidWZmZXJUb1N0cmluZyhzdGRvdXQpLFxuICAgICAgICAgIHN0ZGVycjogYnVmZmVyVG9TdHJpbmcoc3RkZXJyKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHN0ZGluICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoaWxkLnN0ZGluPy5lbmQoc3RkaW4pO1xuICAgIH1cblxuICAgIGNvbnN0IGFib3J0ID0gKCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2hpbGQua2lsbChcIlNJR1RFUk1cIik7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChjaGlsZC5leGl0Q29kZSA9PT0gbnVsbCAmJiBjaGlsZC5zaWduYWxDb2RlID09PSBudWxsKSB7XG4gICAgICAgICAgY2hpbGQua2lsbChcIlNJR0tJTExcIik7XG4gICAgICAgIH1cbiAgICAgIH0sIDE1MDApO1xuICAgIH07XG5cbiAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICBhYm9ydCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ1ZmZlclRvU3RyaW5nKHZhbHVlOiBzdHJpbmcgfCBCdWZmZXIpOiBzdHJpbmcge1xuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSA/IHZhbHVlLnRvU3RyaW5nKFwidXRmOFwiKSA6IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBlbnJpY2hFcnJvcihcbiAgZXJyb3I6IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVFeGNlcHRpb24sXG4gIHN0ZG91dDogc3RyaW5nIHwgQnVmZmVyLFxuICBzdGRlcnI6IHN0cmluZyB8IEJ1ZmZlcixcbik6IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVFeGNlcHRpb24ge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihlcnJvciwge1xuICAgIHN0ZG91dDogYnVmZmVyVG9TdHJpbmcoc3Rkb3V0KSxcbiAgICBzdGRlcnI6IGJ1ZmZlclRvU3RyaW5nKHN0ZGVyciksXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRFcnJvckRldGFpbChlcnJvcjogdW5rbm93biwga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGVycm9yICE9PSBcIm9iamVjdFwiIHx8IGVycm9yID09PSBudWxsIHx8ICEoa2V5IGluIGVycm9yKSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIGNvbnN0IHZhbHVlID0gKGVycm9yIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRyaW0oKTtcbiAgfVxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZyhcInV0ZjhcIikudHJpbSgpO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBDb2RleExvZ2luU3RhdHVzLCBnZXRDb2RleExvZ2luU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LWF1dGhcIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluQXV0aFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogQnJhaW5QbHVnaW4pIHt9XG5cbiAgYXN5bmMgbG9naW4oKSB7XG4gICAgbmV3IE5vdGljZShcIkluc3RhbGwgdGhlIENvZGV4IENMSSwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gcmV0dXJuIHRvIEJyYWluIGFuZCByZWNoZWNrIENvZGV4IHN0YXR1cy5cIik7XG4gICAgd2luZG93Lm9wZW4oXCJodHRwczovL29wZW5haS5jb20vY29kZXgvZ2V0LXN0YXJ0ZWQvXCIpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29kZXhTdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gICAgcmV0dXJuIGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuY29uc3QgREVGQVVMVF9JTlNUUlVDVElPTlMgPSBbXG4gIFwiIyBCcmFpbiBJbnN0cnVjdGlvbnNcIixcbiAgXCJcIixcbiAgXCJZb3UgYXJlIGhlbHBpbmcgZmlsZSBpbmZvcm1hdGlvbiBpbnRvIHRoaXMgT2JzaWRpYW4gdmF1bHQgYW5kIHJldHJpZXZlIGluZm9ybWF0aW9uIGZyb20gaXQuXCIsXG4gIFwiXCIsXG4gIFwiIyMgT3BlcmF0aW5nIFJ1bGVzXCIsXG4gIFwiLSBLZWVwIGFsbCBwZXJzaXN0ZWQgY29udGVudCBhcyBub3JtYWwgbWFya2Rvd24uXCIsXG4gIFwiLSBVc2Ugb25seSBleHBsaWNpdCB2YXVsdCBjb250ZXh0IHdoZW4gYW5zd2VyaW5nIHJldHJpZXZhbCBxdWVzdGlvbnMuXCIsXG4gIFwiLSBQcmVmZXIgdXBkYXRpbmcgb3IgYXBwZW5kaW5nIHRvIGV4aXN0aW5nIG5vdGVzIG92ZXIgY3JlYXRpbmcgZHVwbGljYXRlcy5cIixcbiAgXCItIFVzZSB3aWtpIGxpbmtzIHdoZW4gdXNlZnVsIGFuZCBzdXBwb3J0ZWQgYnkgdGhlIHByb3ZpZGVkIGNvbnRleHQuXCIsXG4gIFwiLSBVc2UgdGhlIGNvbmZpZ3VyZWQgbm90ZXMgZm9sZGVyIGFzIHRoZSBkZWZhdWx0IGxvY2F0aW9uIGZvciBuZXcgbm90ZXMuXCIsXG4gIFwiLSBJZiB5b3UgYXJlIHVuc3VyZSB3aGVyZSBzb21ldGhpbmcgYmVsb25ncywgYXNrIGEgcXVlc3Rpb24gaW5zdGVhZCBvZiBndWVzc2luZy5cIixcbiAgXCItIE5ldmVyIGRlbGV0ZSBvciBvdmVyd3JpdGUgZXhpc3RpbmcgdXNlciBjb250ZW50LlwiLFxuICBcIi0gUHJvcG9zZSBzYWZlIGFwcGVuZC9jcmVhdGUgb3BlcmF0aW9ucyBhbmQgd2FpdCBmb3IgYXBwcm92YWwgYmVmb3JlIHdyaXRpbmcuXCIsXG4gIFwiXCIsXG5dLmpvaW4oXCJcXG5cIik7XG5cbmV4cG9ydCBjbGFzcyBJbnN0cnVjdGlvblNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVGaWxlKFxuICAgICAgc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfSU5TVFJVQ1RJT05TLFxuICAgICk7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQoZmlsZS5wYXRoLCBERUZBVUxUX0lOU1RSVUNUSU9OUyk7XG4gICAgICByZXR1cm4gREVGQVVMVF9JTlNUUlVDVElPTlM7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgYXN5bmMgcmVhZEluc3RydWN0aW9ucygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7IEJyYWluQUlTZXJ2aWNlIH0gZnJvbSBcIi4vYWktc2VydmljZVwiO1xuaW1wb3J0IHsgSW5zdHJ1Y3Rpb25TZXJ2aWNlIH0gZnJvbSBcIi4vaW5zdHJ1Y3Rpb24tc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeU1hdGNoLCBWYXVsdFF1ZXJ5U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXF1ZXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXdyaXRlLXNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWYXVsdENoYXRSZXNwb25zZSB7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgcGxhbjogVmF1bHRXcml0ZVBsYW4gfCBudWxsO1xuICB1c2VkQUk6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhdEV4Y2hhbmdlIHtcbiAgcm9sZTogXCJ1c2VyXCIgfCBcImJyYWluXCI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuY29uc3QgQ0hBVF9DT05URVhUX0xJTUlUID0gNjtcbmNvbnN0IE1BWF9ISVNUT1JZX0VYQ0hBTkdFUyA9IDY7XG5jb25zdCBNQVhfQ09OVEVYVF9FWENFUlBUX0NIQVJTID0gMTIwMDtcblxuZXhwb3J0IGNsYXNzIFZhdWx0Q2hhdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFpU2VydmljZTogQnJhaW5BSVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnN0cnVjdGlvblNlcnZpY2U6IEluc3RydWN0aW9uU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHF1ZXJ5U2VydmljZTogVmF1bHRRdWVyeVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHdyaXRlU2VydmljZTogVmF1bHRXcml0ZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgcmVzcG9uZChcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10gPSBbXSxcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICBvblN0YWdlPzogKHN0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIpID0+IHZvaWQsXG4gICk6IFByb21pc2U8VmF1bHRDaGF0UmVzcG9uc2U+IHtcbiAgICBjb25zdCB0cmltbWVkID0gbWVzc2FnZS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbnRlciBhIG1lc3NhZ2UgZmlyc3RcIik7XG4gICAgfVxuXG4gICAgb25TdGFnZT8uKFwicXVlcnlcIik7XG4gICAgY29uc3QgW2luc3RydWN0aW9ucywgc291cmNlc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZS5yZWFkSW5zdHJ1Y3Rpb25zKCksXG4gICAgICB0aGlzLnF1ZXJ5U2VydmljZS5xdWVyeVZhdWx0KHRyaW1tZWQpLFxuICAgIF0pO1xuICAgIGNvbnN0IGNvbnRleHQgPSBmb3JtYXRTb3VyY2VzRm9yUHJvbXB0KHNvdXJjZXMuc2xpY2UoMCwgQ0hBVF9DT05URVhUX0xJTUlUKSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCB2YXVsdEJhc2VQYXRoID0gdGhpcy52YXVsdFNlcnZpY2UuZ2V0QmFzZVBhdGgoKTtcbiAgICBjb25zdCBhaVN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhzZXR0aW5ncyk7XG4gICAgaWYgKCFhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYWlTdGF0dXMubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgb25TdGFnZT8uKFwiYWlcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFpU2VydmljZS5jb21wbGV0ZUNoYXQoXG4gICAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInN5c3RlbVwiLFxuICAgICAgICAgIGNvbnRlbnQ6IGJ1aWxkU3lzdGVtUHJvbXB0KGluc3RydWN0aW9ucywgc2V0dGluZ3MpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgY29udGVudDogYnVpbGRVc2VyUHJvbXB0KHRyaW1tZWQsIHZhdWx0QmFzZVBhdGgsIGNvbnRleHQsIGhpc3RvcnkpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHNldHRpbmdzLFxuICAgICAgdmF1bHRCYXNlUGF0aCxcbiAgICAgIHNpZ25hbCxcbiAgICApO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2hhdFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiBwYXJzZWQuYW5zd2VyIHx8IFwiQ29kZXggcmV0dXJuZWQgbm8gYW5zd2VyLlwiLFxuICAgICAgc291cmNlcyxcbiAgICAgIHBsYW46IHBhcnNlZC5wbGFuID8gdGhpcy53cml0ZVNlcnZpY2Uubm9ybWFsaXplUGxhbihwYXJzZWQucGxhbikgOiBudWxsLFxuICAgICAgdXNlZEFJOiB0cnVlLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQoXG4gIGluc3RydWN0aW9uczogc3RyaW5nLFxuICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbik6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgXCJZb3UgYXJlIEJyYWluLCBhbiBPYnNpZGlhbiB2YXVsdCBhc3Npc3RhbnQuXCIsXG4gICAgXCJBbnN3ZXIgZGlyZWN0bHkgZnJvbSB0aGUgT2JzaWRpYW4gdmF1bHQgbWFya2Rvd24uXCIsXG4gICAgXCJZb3UgbWF5IGluc3BlY3QgbWFya2Rvd24gZmlsZXMgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3Rvcnkgd2l0aCByZWFkLW9ubHkgc2hlbGwgY29tbWFuZHMuXCIsXG4gICAgXCJOZXZlciBjbGFpbSBmYWN0cyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIGJ5IHZhdWx0IG1hcmtkb3duIG9yIHRoZSBwcm92aWRlZCBzb3VyY2UgaGludHMuXCIsXG4gICAgXCJGb3Igc2ltcGxlIHF1ZXN0aW9ucywgYW5zd2VyIGluIG9uZSBvciB0d28gc2VudGVuY2VzLlwiLFxuICAgIFwiRm9yIGZpbGluZyByZXF1ZXN0cywgcHJvcG9zZSBzYWZlIHZhdWx0IHdyaXRlcy5cIixcbiAgICBcIlJldHVybiBvbmx5IGEgSlNPTiBvYmplY3QuXCIsXG4gICAgXCJcIixcbiAgICBcIlJldHVybiB0aGlzIEpTT04gc2hhcGU6XCIsXG4gICAgXCJ7XCIsXG4gICAgJyAgXCJhbnN3ZXJcIjogXCJtYXJrZG93biBhbnN3ZXIgd2l0aCBldmlkZW5jZSBhbmQgZ2Fwc1wiLCcsXG4gICAgJyAgXCJwbGFuXCI6IHsnLFxuICAgICcgICAgXCJzdW1tYXJ5XCI6IFwic2hvcnQgc3VtbWFyeSBvZiBwcm9wb3NlZCB3cml0ZXMsIG9yIGVtcHR5IHN0cmluZ1wiLCcsXG4gICAgJyAgICBcImNvbmZpZGVuY2VcIjogXCJsb3d8bWVkaXVtfGhpZ2hcIiwnLFxuICAgICcgICAgXCJvcGVyYXRpb25zXCI6IFsnLFxuICAgICcgICAgICB7XCJ0eXBlXCI6XCJhcHBlbmRcIixcInBhdGhcIjpcIlNvbWUvRmlsZS5tZFwiLFwiY29udGVudFwiOlwibWFya2Rvd25cIn0sJyxcbiAgICAnICAgICAge1widHlwZVwiOlwiY3JlYXRlXCIsXCJwYXRoXCI6XCJTb21lL05ldyBGaWxlLm1kXCIsXCJjb250ZW50XCI6XCJtYXJrZG93blwifScsXG4gICAgXCIgICAgXSxcIixcbiAgICAnICAgIFwicXVlc3Rpb25zXCI6IFtcIm9wZW4gcXVlc3Rpb24gaWYgeW91IG5lZWQgY2xhcmlmaWNhdGlvblwiXScsXG4gICAgXCIgIH1cIixcbiAgICBcIn1cIixcbiAgICBcIlwiLFxuICAgIFwiT25seSBpbmNsdWRlIHdyaXRlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlciBhc2tzIHRvIGFkZCwgc2F2ZSwgZmlsZSwgcmVtZW1iZXIsIHVwZGF0ZSwgY3JlYXRlLCBvciBvdGhlcndpc2UgcHV0IGluZm9ybWF0aW9uIGludG8gdGhlIHZhdWx0LlwiLFxuICAgIFwiVXNlIGFwcGVuZC9jcmVhdGUgb3BlcmF0aW9ucyBvbmx5LiBEbyBub3QgcHJvcG9zZSBkZWxldGUgb3IgcmVwbGFjZSBvcGVyYXRpb25zLlwiLFxuICAgIGBEZWZhdWx0IG5vdGVzIGZvbGRlcjogJHtzZXR0aW5ncy5ub3Rlc0ZvbGRlcn1gLFxuICAgIFwiXCIsXG4gICAgXCJWYXVsdCBpbnN0cnVjdGlvbnM6XCIsXG4gICAgaW5zdHJ1Y3Rpb25zLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVXNlclByb21wdChcbiAgbWVzc2FnZTogc3RyaW5nLFxuICB2YXVsdEJhc2VQYXRoOiBzdHJpbmcgfCBudWxsLFxuICBjb250ZXh0OiBzdHJpbmcsXG4gIGhpc3Rvcnk6IENoYXRFeGNoYW5nZVtdLFxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgcmVjZW50SGlzdG9yeSA9IGhpc3Rvcnkuc2xpY2UoLU1BWF9ISVNUT1JZX0VYQ0hBTkdFUyk7XG4gIGlmIChyZWNlbnRIaXN0b3J5Lmxlbmd0aCA+IDApIHtcbiAgICBwYXJ0cy5wdXNoKFwiQ29udmVyc2F0aW9uIGhpc3Rvcnk6XCIpO1xuICAgIGZvciAoY29uc3QgZXhjaGFuZ2Ugb2YgcmVjZW50SGlzdG9yeSkge1xuICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgIHBhcnRzLnB1c2goYCR7ZXhjaGFuZ2Uucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIlVzZXJcIiA6IFwiQnJhaW5cIn06YCk7XG4gICAgICBwYXJ0cy5wdXNoKGV4Y2hhbmdlLnRleHQpO1xuICAgIH1cbiAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICAgIHBhcnRzLnB1c2goXCItLS1cIik7XG4gICAgcGFydHMucHVzaChcIlwiKTtcbiAgfVxuXG4gIHBhcnRzLnB1c2goYFVzZXIgbWVzc2FnZTogJHttZXNzYWdlfWApO1xuICBwYXJ0cy5wdXNoKFwiXCIpO1xuICBwYXJ0cy5wdXNoKFxuICAgIHZhdWx0QmFzZVBhdGhcbiAgICAgID8gXCJZb3UgYXJlIHJ1bm5pbmcgZnJvbSB0aGUgT2JzaWRpYW4gdmF1bHQgcm9vdC4gVXNlIHJlYWQtb25seSBzaGVsbCBjb21tYW5kcyBvbmx5IGlmIHlvdSBuZWVkIHRvIGluc3BlY3QgbWFya2Rvd24gZmlsZXMuXCJcbiAgICAgIDogXCJVc2UgdGhlIHJlbGV2YW50IHZhdWx0IGNvbnRleHQgYmVsb3cuXCIsXG4gICk7XG4gIHBhcnRzLnB1c2goXCJcIik7XG4gIHBhcnRzLnB1c2goXCJSZWxldmFudCBzb3VyY2UgaGludHM6XCIpO1xuICBwYXJ0cy5wdXNoKGNvbnRleHQgfHwgXCJObyBtYXRjaGluZyB2YXVsdCBmaWxlcyBmb3VuZC5cIik7XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFNvdXJjZXNGb3JQcm9tcHQoc291cmNlczogVmF1bHRRdWVyeU1hdGNoW10pOiBzdHJpbmcge1xuICByZXR1cm4gc291cmNlc1xuICAgIC5tYXAoKHNvdXJjZSwgaW5kZXgpID0+IFtcbiAgICAgIGAjIyBTb3VyY2UgJHtpbmRleCArIDF9OiAke3NvdXJjZS5wYXRofWAsXG4gICAgICBgVGl0bGU6ICR7c291cmNlLnRpdGxlfWAsXG4gICAgICBgUmVhc29uOiAke3NvdXJjZS5yZWFzb259YCxcbiAgICAgIFwiXCIsXG4gICAgICBzb3VyY2UuZXhjZXJwdC5zbGljZSgwLCBNQVhfQ09OVEVYVF9FWENFUlBUX0NIQVJTKSxcbiAgICBdLmpvaW4oXCJcXG5cIikpXG4gICAgLmpvaW4oXCJcXG5cXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2hhdFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcpOiB7XG4gIGFuc3dlcjogc3RyaW5nO1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbiB8IG51bGw7XG59IHtcbiAgY29uc3QganNvblRleHQgPSBleHRyYWN0SnNvbihyZXNwb25zZSk7XG4gIGlmICghanNvblRleHQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiByZXNwb25zZS50cmltKCksXG4gICAgICBwbGFuOiBudWxsLFxuICAgIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIHtcbiAgICAgIGFuc3dlcj86IHVua25vd247XG4gICAgICBwbGFuPzogdW5rbm93bjtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHR5cGVvZiBwYXJzZWQuYW5zd2VyID09PSBcInN0cmluZ1wiID8gcGFyc2VkLmFuc3dlci50cmltKCkgOiBcIlwiLFxuICAgICAgcGxhbjogaXNQbGFuT2JqZWN0KHBhcnNlZC5wbGFuKSA/IHBhcnNlZC5wbGFuIDogbnVsbCxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5zd2VyOiByZXNwb25zZS50cmltKCksXG4gICAgICBwbGFuOiBudWxsLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEpzb24odGV4dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGZlbmNlZCA9IHRleHQubWF0Y2goL2BgYCg/Ompzb24pP1xccyooW1xcc1xcU10qPylgYGAvaSk/LlsxXTtcbiAgaWYgKGZlbmNlZCkge1xuICAgIHJldHVybiBmZW5jZWQudHJpbSgpO1xuICB9XG4gIGNvbnN0IHN0YXJ0ID0gdGV4dC5pbmRleE9mKFwie1wiKTtcbiAgY29uc3QgZW5kID0gdGV4dC5sYXN0SW5kZXhPZihcIn1cIik7XG4gIGlmIChzdGFydCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fCBlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gdGV4dC5zbGljZShzdGFydCwgZW5kICsgMSk7XG59XG5cbmZ1bmN0aW9uIGlzUGxhbk9iamVjdCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFZhdWx0V3JpdGVQbGFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncywgcGFyc2VFeGNsdWRlRm9sZGVycyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0UXVlcnlNYXRjaCB7XG4gIHBhdGg6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGV4Y2VycHQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5jb25zdCBNQVhfUVVFUllfRklMRVMgPSAxMjtcbmNvbnN0IE1BWF9FWENFUlBUX0NIQVJTID0gNzAwO1xuY29uc3QgTUFYX1NOSVBQRVRfTElORVMgPSA1O1xuY29uc3QgU1RPUF9XT1JEUyA9IG5ldyBTZXQoW1xuICBcImFib3V0XCIsXG4gIFwiYXJlXCIsXG4gIFwiY2FuXCIsXG4gIFwiZGlkXCIsXG4gIFwiZG9lc1wiLFxuICBcImZvclwiLFxuICBcImZyb21cIixcbiAgXCJoYXZlXCIsXG4gIFwiaG93XCIsXG4gIFwiaW50b1wiLFxuICBcImlzXCIsXG4gIFwia25vd1wiLFxuICBcImxpc3RcIixcbiAgXCJteVwiLFxuICBcInRoZVwiLFxuICBcInRoaXNcIixcbiAgXCJ0aGF0XCIsXG4gIFwid2hhdFwiLFxuICBcIndoZW5cIixcbiAgXCJ3aGVyZVwiLFxuICBcIndoaWNoXCIsXG4gIFwid2hvXCIsXG4gIFwid2h5XCIsXG4gIFwid2l0aFwiLFxuXSk7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFF1ZXJ5U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgcXVlcnlWYXVsdChxdWVyeTogc3RyaW5nLCBsaW1pdCA9IE1BWF9RVUVSWV9GSUxFUyk6IFByb21pc2U8VmF1bHRRdWVyeU1hdGNoW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHRva2VucyA9IHRva2VuaXplKHF1ZXJ5KTtcbiAgICBjb25zdCBleGNsdWRlRm9sZGVycyA9IHBhcnNlRXhjbHVkZUZvbGRlcnMoc2V0dGluZ3MuZXhjbHVkZUZvbGRlcnMpO1xuICAgIGNvbnN0IGZpbGVzID0gKGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmxpc3RNYXJrZG93bkZpbGVzKCkpXG4gICAgICAuZmlsdGVyKChmaWxlKSA9PiBzaG91bGRJbmNsdWRlRmlsZShmaWxlLCBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLCBleGNsdWRlRm9sZGVycykpXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnN0YXQubXRpbWUgLSBsZWZ0LnN0YXQubXRpbWUpO1xuXG4gICAgY29uc3QgbWF0Y2hlczogVmF1bHRRdWVyeU1hdGNoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkVGV4dChmaWxlLnBhdGgpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZUZpbGUoZmlsZSwgdGV4dCwgcXVlcnksIHRva2Vucyk7XG4gICAgICBpZiAoc2NvcmUgPD0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGZpbGUucGF0aCxcbiAgICAgICAgdGl0bGU6IHRpdGxlRm9yRmlsZShmaWxlLCB0ZXh0KSxcbiAgICAgICAgc2NvcmUsXG4gICAgICAgIHJlYXNvbjogYnVpbGRSZWFzb24oZmlsZSwgdGV4dCwgcXVlcnksIHRva2VucyksXG4gICAgICAgIGV4Y2VycHQ6IGJ1aWxkRXhjZXJwdCh0ZXh0LCB0b2tlbnMpLFxuICAgICAgICB0ZXh0LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc2NvcmUgLSBsZWZ0LnNjb3JlKVxuICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRJbmNsdWRlRmlsZShmaWxlOiBURmlsZSwgaW5zdHJ1Y3Rpb25zRmlsZTogc3RyaW5nLCBleGNsdWRlRm9sZGVyczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgaWYgKGZpbGUucGF0aCA9PT0gaW5zdHJ1Y3Rpb25zRmlsZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBleGNsdWRlRm9sZGVycykge1xuICAgIGNvbnN0IHByZWZpeCA9IGZvbGRlci5lbmRzV2l0aChcIi9cIikgPyBmb2xkZXIgOiBgJHtmb2xkZXJ9L2A7XG4gICAgaWYgKGZpbGUucGF0aCA9PT0gZm9sZGVyIHx8IGZpbGUucGF0aC5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZShpbnB1dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJldHVybiBpbnB1dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnNwbGl0KC9bXmEtejAtOV8vLV0rL2kpXG4gICAgLm1hcCgodG9rZW4pID0+IHRva2VuLnRyaW0oKSlcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gdG9rZW4ubGVuZ3RoID49IDMpXG4gICAgLmZpbHRlcigodG9rZW4pID0+ICFTVE9QX1dPUkRTLmhhcyh0b2tlbikpXG4gICAgLmZpbHRlcigodG9rZW4pID0+IHtcbiAgICAgIGlmIChzZWVuLmhhcyh0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQodG9rZW4pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbiAgICAuc2xpY2UoMCwgMjQpO1xufVxuXG5mdW5jdGlvbiBzY29yZUZpbGUoZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGlmICghdG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGZpbGUuc3RhdC5tdGltZSAvIDEwMDAwMDAwMDAwMDApKTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbm9ybWFsaXplZFRleHQuaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDE4O1xuICB9XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbG93ZXJQYXRoLmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICBzY29yZSArPSAyNDtcbiAgfVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGlmIChsb3dlclBhdGguaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBzY29yZSArPSAxMDtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBzY29yZSArPSA5O1xuICAgIH1cbiAgICBjb25zdCBoZWFkaW5nTWF0Y2hlcyA9IGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCwgXCJnXCIpKTtcbiAgICBpZiAoaGVhZGluZ01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IGhlYWRpbmdNYXRjaGVzLmxlbmd0aCAqIDc7XG4gICAgfVxuICAgIGNvbnN0IGxpbmtNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYFxcXFxbXFxcXFtbXlxcXFxdXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9W15cXFxcXV0qXFxcXF1cXFxcXWAsIFwiZ1wiKSk7XG4gICAgaWYgKGxpbmtNYXRjaGVzKSB7XG4gICAgICBzY29yZSArPSBsaW5rTWF0Y2hlcy5sZW5ndGggKiA2O1xuICAgIH1cbiAgICBjb25zdCB0YWdNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJnaVwiKSk7XG4gICAgaWYgKHRhZ01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IHRhZ01hdGNoZXMubGVuZ3RoICogNTtcbiAgICB9XG4gICAgY29uc3QgdGV4dE1hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodG9rZW4pLCBcImdcIikpO1xuICAgIGlmICh0ZXh0TWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gTWF0aC5taW4oOCwgdGV4dE1hdGNoZXMubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtYXRjaGVkVG9rZW5zID0gdG9rZW5zLmZpbHRlcigodG9rZW4pID0+IGxvd2VyUGF0aC5pbmNsdWRlcyh0b2tlbikgfHwgbG93ZXJUZXh0LmluY2x1ZGVzKHRva2VuKSk7XG4gIHNjb3JlICs9IG1hdGNoZWRUb2tlbnMubGVuZ3RoICogMztcbiAgaWYgKG1hdGNoZWRUb2tlbnMubGVuZ3RoID09PSB0b2tlbnMubGVuZ3RoKSB7XG4gICAgc2NvcmUgKz0gTWF0aC5taW4oMTAsIHRva2Vucy5sZW5ndGggKiAyKTtcbiAgfVxuICBjb25zdCBhZ2VNcyA9IERhdGUubm93KCkgLSBmaWxlLnN0YXQubXRpbWU7XG4gIGNvbnN0IGFnZURheXMgPSBhZ2VNcyAvICgxMDAwICogNjAgKiA2MCAqIDI0KTtcbiAgaWYgKGFnZURheXMgPCAxKSB7XG4gICAgc2NvcmUgKz0gMTA7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDcpIHtcbiAgICBzY29yZSArPSA2O1xuICB9IGVsc2UgaWYgKGFnZURheXMgPCAzMCkge1xuICAgIHNjb3JlICs9IDM7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDkwKSB7XG4gICAgc2NvcmUgKz0gMTtcbiAgfVxuICByZXR1cm4gc2NvcmU7XG59XG5cbmZ1bmN0aW9uIHRpdGxlRm9yRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGVhZGluZyA9IHRleHQubWF0Y2goL14jXFxzKyguKykkL20pPy5bMV0/LnRyaW0oKTtcbiAgaWYgKGhlYWRpbmcpIHtcbiAgICByZXR1cm4gaGVhZGluZztcbiAgfVxuICByZXR1cm4gZmlsZS5iYXNlbmFtZSB8fCBmaWxlLnBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGUucGF0aDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZWFzb24oZmlsZTogVEZpbGUsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSBub3JtYWxpemVQaHJhc2UodGV4dCk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IG5vcm1hbGl6ZVBocmFzZShxdWVyeSk7XG4gIGNvbnN0IHJlYXNvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgcmVhc29ucy5hZGQoXCJleGFjdCBwaHJhc2UgbWF0Y2hcIik7XG4gIH1cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAobG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYHBhdGggbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgdGl0bGUgbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9YCkpKSB7XG4gICAgICByZWFzb25zLmFkZChgaGVhZGluZyBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobmV3IFJlZ0V4cChgXFxcXFtcXFxcW1teXFxcXF1dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bXlxcXFxdXSpcXFxcXVxcXFxdYCwgXCJpXCIpLnRlc3QobG93ZXJUZXh0KSkge1xuICAgICAgcmVhc29ucy5hZGQoYGxpbmsgbWVudGlvbnMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICAgIGlmIChsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgKF58XFxcXHMpI1stL19hLXowLTldKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bLS9fYS16MC05XSpgLCBcImlcIikpKSB7XG4gICAgICByZWFzb25zLmFkZChgdGFnIG1hdGNoZXMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICAgIGlmIChsb3dlclRleHQuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgY29udGVudCBtZW50aW9ucyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20ocmVhc29ucykuc2xpY2UoMCwgMykuam9pbihcIiwgXCIpIHx8IFwicmVjZW50IG1hcmtkb3duIG5vdGVcIjtcbn1cblxuZnVuY3Rpb24gYnVpbGRFeGNlcnB0KHRleHQ6IHN0cmluZywgdG9rZW5zOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZUxpbmVzID0gdGV4dC5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgcmFua2VkID0gc291cmNlTGluZXNcbiAgICAubWFwKChsaW5lLCBpbmRleCkgPT4gKHsgaW5kZXgsIHNjb3JlOiBzY29yZUxpbmUobGluZSwgdG9rZW5zKSB9KSlcbiAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnNjb3JlIC0gbGVmdC5zY29yZSB8fCBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXgpO1xuICBjb25zdCBiZXN0TGluZSA9IHJhbmtlZC5maW5kKChsaW5lKSA9PiBsaW5lLnNjb3JlID4gMCk/LmluZGV4ID8/IDA7XG4gIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgYmVzdExpbmUgLSAyKTtcbiAgY29uc3QgZW5kID0gTWF0aC5taW4oc291cmNlTGluZXMubGVuZ3RoLCBzdGFydCArIE1BWF9TTklQUEVUX0xJTkVTKTtcbiAgY29uc3QgZXhjZXJwdCA9IHNvdXJjZUxpbmVzXG4gICAgLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5qb2luKFwiXFxuXCIpO1xuICByZXR1cm4gZXhjZXJwdC5sZW5ndGggPiBNQVhfRVhDRVJQVF9DSEFSU1xuICAgID8gYCR7ZXhjZXJwdC5zbGljZSgwLCBNQVhfRVhDRVJQVF9DSEFSUyAtIDMpLnRyaW1FbmQoKX0uLi5gXG4gICAgOiBleGNlcnB0O1xufVxuXG5mdW5jdGlvbiBzY29yZUxpbmUobGluZTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3QgbG93ZXIgPSBsaW5lLnRvTG93ZXJDYXNlKCk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChsaW5lLnRyaW0oKS5zdGFydHNXaXRoKFwiI1wiKSkge1xuICAgIHNjb3JlICs9IDQ7XG4gIH1cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAoIWxvd2VyLmluY2x1ZGVzKHRva2VuKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHNjb3JlICs9IDM7XG4gICAgaWYgKGxvd2VyLmluY2x1ZGVzKGBbWyR7dG9rZW59YCkgfHwgbG93ZXIuaW5jbHVkZXMoYCR7dG9rZW59XV1gKSkge1xuICAgICAgc2NvcmUgKz0gMjtcbiAgICB9XG4gICAgaWYgKGxvd2VyLm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxzKSNbLS9fYS16MC05XSoke2VzY2FwZVJlZ0V4cCh0b2tlbil9Wy0vX2EtejAtOV0qYCwgXCJpXCIpKSkge1xuICAgICAgc2NvcmUgKz0gMjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNjb3JlO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVQaHJhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dFxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xufVxuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgRmlsZVN5c3RlbUFkYXB0ZXIsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBub3JtYWxpemVQYXRoLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNsYXNzIFZhdWx0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHApIHt9XG5cbiAgYXN5bmMgZW5zdXJlS25vd25Gb2xkZXJzKHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZm9sZGVycyA9IG5ldyBTZXQoW1xuICAgICAgc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICBwYXJlbnRGb2xkZXIoc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSksXG4gICAgXSk7XG5cbiAgICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihmb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmb2xkZXJQYXRoKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlZ21lbnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlRm9sZGVySWZNaXNzaW5nKGN1cnJlbnQpO1xuICAgICAgfSBlbHNlIGlmICghKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZm9sZGVyOiAke2N1cnJlbnR9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nLCBpbml0aWFsQ29udGVudCA9IFwiXCIpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoIGV4aXN0cyBidXQgaXMgbm90IGEgZmlsZTogJHtub3JtYWxpemVkfWApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKHBhcmVudEZvbGRlcihub3JtYWxpemVkKSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBpbml0aWFsQ29udGVudCk7XG4gIH1cblxuICBhc3luYyByZWFkVGV4dChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIH1cblxuICBhc3luYyBhcHBlbmRUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGNvbnN0IHNlcGFyYXRvciA9IGN1cnJlbnQubGVuZ3RoID09PSAwXG4gICAgICA/IFwiXCJcbiAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblxcblwiKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgICAgICAgPyBcIlxcblwiXG4gICAgICAgICAgOiBcIlxcblxcblwiO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBgJHtjdXJyZW50fSR7c2VwYXJhdG9yfSR7bm9ybWFsaXplZENvbnRlbnR9YCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyByZXBsYWNlVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbm9ybWFsaXplZENvbnRlbnQpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgZW5zdXJlVW5pcXVlRmlsZVBhdGgoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBkb3RJbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3RJbmRleCA9PT0gLTEgPyBub3JtYWxpemVkIDogbm9ybWFsaXplZC5zbGljZSgwLCBkb3RJbmRleCk7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZG90SW5kZXggPT09IC0xID8gXCJcIiA6IG5vcm1hbGl6ZWQuc2xpY2UoZG90SW5kZXgpO1xuXG4gICAgbGV0IGNvdW50ZXIgPSAyO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2NvdW50ZXJ9JHtleHRlbnNpb259YDtcbiAgICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICAgIGNvdW50ZXIgKz0gMTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsaXN0TWFya2Rvd25GaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICB9XG5cbiAgZ2V0QmFzZVBhdGgoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIgaW5zdGFuY2VvZiBGaWxlU3lzdGVtQWRhcHRlclxuICAgICAgPyB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmdldEJhc2VQYXRoKClcbiAgICAgIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlRm9sZGVySWZNaXNzaW5nKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xuICAgICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50Rm9sZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gIGNvbnN0IGluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIik7XG4gIHJldHVybiBpbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNTYWZlTWFya2Rvd25QYXRoKFxuICBwYXRoOiBzdHJpbmcsXG4gIHNldHRpbmdzPzogUGljazxCcmFpblBsdWdpblNldHRpbmdzLCBcImluc3RydWN0aW9uc0ZpbGVcIj4sXG4pOiBib29sZWFuIHtcbiAgY29uc3Qgc2VnbWVudHMgPSBwYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gIGNvbnN0IGlzU2FmZSA9XG4gICAgQm9vbGVhbihwYXRoKSAmJlxuICAgIHBhdGguZW5kc1dpdGgoXCIubWRcIikgJiZcbiAgICAhcGF0aC5pbmNsdWRlcyhcIi4uXCIpICYmXG4gICAgc2VnbWVudHMuZXZlcnkoKHNlZ21lbnQpID0+ICFzZWdtZW50LnN0YXJ0c1dpdGgoXCIuXCIpKTtcblxuICBpZiAoIWlzU2FmZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncyAmJiBwYXRoID09PSBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaXNTYWZlTWFya2Rvd25QYXRoIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGgtc2FmZXR5XCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCB0eXBlIFZhdWx0V3JpdGVPcGVyYXRpb24gPVxuICB8IHtcbiAgICAgIHR5cGU6IFwiYXBwZW5kXCI7XG4gICAgICBwYXRoOiBzdHJpbmc7XG4gICAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9XG4gIHwge1xuICAgICAgdHlwZTogXCJjcmVhdGVcIjtcbiAgICAgIHBhdGg6IHN0cmluZztcbiAgICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmF1bHRXcml0ZVBsYW4ge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U6IFwibG93XCIgfCBcIm1lZGl1bVwiIHwgXCJoaWdoXCI7XG4gIG9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcXVlc3Rpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0V3JpdGVTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBub3JtYWxpemVQbGFuKHBsYW46IFBhcnRpYWw8VmF1bHRXcml0ZVBsYW4+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBWYXVsdFdyaXRlUGxhbiB7XG4gICAgY29uc3QgY29uZmlkZW5jZSA9IHJlYWRDb25maWRlbmNlKHBsYW4uY29uZmlkZW5jZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1bW1hcnk6IHR5cGVvZiBwbGFuLnN1bW1hcnkgPT09IFwic3RyaW5nXCIgJiYgcGxhbi5zdW1tYXJ5LnRyaW0oKVxuICAgICAgICA/IHBsYW4uc3VtbWFyeS50cmltKClcbiAgICAgICAgOiBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IHVwZGF0ZXMuXCIsXG4gICAgICBjb25maWRlbmNlLFxuICAgICAgb3BlcmF0aW9uczogKEFycmF5LmlzQXJyYXkocGxhbi5vcGVyYXRpb25zKSA/IHBsYW4ub3BlcmF0aW9ucyA6IFtdKVxuICAgICAgICAubWFwKChvcGVyYXRpb24pID0+IHRoaXMubm9ybWFsaXplT3BlcmF0aW9uKG9wZXJhdGlvbikpXG4gICAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbik6IG9wZXJhdGlvbiBpcyBWYXVsdFdyaXRlT3BlcmF0aW9uID0+IG9wZXJhdGlvbiAhPT0gbnVsbClcbiAgICAgICAgLnNsaWNlKDAsIDgpLFxuICAgICAgcXVlc3Rpb25zOiAoQXJyYXkuaXNBcnJheShwbGFuLnF1ZXN0aW9ucykgPyBwbGFuLnF1ZXN0aW9ucyA6IFtdKVxuICAgICAgICAubWFwKChxdWVzdGlvbikgPT4gU3RyaW5nKHF1ZXN0aW9uKS50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLnNsaWNlKDAsIDUpLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBseVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBwYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG9wZXJhdGlvbiBvZiBwbGFuLm9wZXJhdGlvbnMpIHtcbiAgICAgIGlmICghaXNTYWZlTWFya2Rvd25QYXRoKG9wZXJhdGlvbi5wYXRoLCBzZXR0aW5ncykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiYXBwZW5kXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChvcGVyYXRpb24ucGF0aCwgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgICAgICBwYXRocy5wdXNoKG9wZXJhdGlvbi5wYXRoKTtcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiY3JlYXRlXCIpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKG9wZXJhdGlvbi5wYXRoKTtcbiAgICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgICAgICBwYXRocy5wdXNoKHBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KHBhdGhzKSk7XG4gIH1cblxuICBwcml2YXRlIG5vcm1hbGl6ZU9wZXJhdGlvbihvcGVyYXRpb246IHVua25vd24pOiBWYXVsdFdyaXRlT3BlcmF0aW9uIHwgbnVsbCB7XG4gICAgaWYgKCFvcGVyYXRpb24gfHwgdHlwZW9mIG9wZXJhdGlvbiAhPT0gXCJvYmplY3RcIiB8fCAhKFwidHlwZVwiIGluIG9wZXJhdGlvbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IG9wZXJhdGlvbiBhcyBQYXJ0aWFsPFZhdWx0V3JpdGVPcGVyYXRpb24+O1xuICAgIGNvbnN0IGNvbnRlbnQgPSBcImNvbnRlbnRcIiBpbiBjYW5kaWRhdGUgPyBTdHJpbmcoY2FuZGlkYXRlLmNvbnRlbnQgPz8gXCJcIikudHJpbSgpIDogXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChjYW5kaWRhdGUudHlwZSAhPT0gXCJhcHBlbmRcIiAmJiBjYW5kaWRhdGUudHlwZSAhPT0gXCJjcmVhdGVcIikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IFwicGF0aFwiIGluIGNhbmRpZGF0ZVxuICAgICAgPyBub3JtYWxpemVNYXJrZG93blBhdGgoU3RyaW5nKGNhbmRpZGF0ZS5wYXRoID8/IFwiXCIpKVxuICAgICAgOiBcIlwiO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgaWYgKCFpc1NhZmVNYXJrZG93blBhdGgocGF0aCwgc2V0dGluZ3MpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogY2FuZGlkYXRlLnR5cGUsXG4gICAgICBwYXRoLFxuICAgICAgY29udGVudCxcbiAgICAgIGRlc2NyaXB0aW9uOiByZWFkRGVzY3JpcHRpb24oY2FuZGlkYXRlKSxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWREZXNjcmlwdGlvbihvcGVyYXRpb246IFBhcnRpYWw8VmF1bHRXcml0ZU9wZXJhdGlvbj4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdHlwZW9mIG9wZXJhdGlvbi5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgPyBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb25maWRlbmNlKHZhbHVlOiB1bmtub3duKTogVmF1bHRXcml0ZVBsYW5bXCJjb25maWRlbmNlXCJdIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcImxvd1wiIHx8IHZhbHVlID09PSBcIm1lZGl1bVwiIHx8IHZhbHVlID09PSBcImhpZ2hcIiA/IHZhbHVlIDogXCJtZWRpdW1cIjtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWFya2Rvd25QYXRoKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL1xcLysvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL15cXC8rLywgXCJcIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBJdGVtVmlldywgTWFya2Rvd25SZW5kZXJlciwgVEZpbGUsIFdvcmtzcGFjZUxlYWYsIHNldEljb24gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgVmF1bHRDaGF0UmVzcG9uc2UsIENoYXRFeGNoYW5nZSB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2VcIjtcbmltcG9ydCB0eXBlIHsgVmF1bHRRdWVyeU1hdGNoIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0UGxhbk1vZGFsIH0gZnJvbSBcIi4vdmF1bHQtcGxhbi1tb2RhbFwiO1xuaW1wb3J0IHsgc2hvd0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yLWhhbmRsZXJcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7XG4gIENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSxcbiAgREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuICBDb2RleE1vZGVsT3B0aW9uLFxuICBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSxcbiAgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMsXG4gIGlzS25vd25Db2RleE1vZGVsLFxufSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtbW9kZWxzXCI7XG5cbmludGVyZmFjZSBDaGF0VHVybiB7XG4gIHJvbGU6IFwidXNlclwiIHwgXCJicmFpblwiO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgdXBkYXRlZFBhdGhzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSBtZXNzYWdlc0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlbFJvd0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2VuZEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RvcEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zOiBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXJyZW50QWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nU3RhcnRlZEF0ID0gMDtcbiAgcHJpdmF0ZSBsb2FkaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxvYWRpbmdUZXh0ID0gXCJcIjtcbiAgcHJpdmF0ZSBsb2FkaW5nVGV4dEVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxvYWRpbmdTdGFnZUVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxvYWRpbmdTdGFnZTogXCJxdWVyeVwiIHwgXCJhaVwiID0gXCJxdWVyeVwiO1xuICBwcml2YXRlIHJlbmRlckdlbmVyYXRpb24gPSAwO1xuICBwcml2YXRlIHJlc2l6ZUZyYW1lSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHR1cm5zOiBDaGF0VHVybltdID0gW107XG4gIHByaXZhdGUgdXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzY3JvbGxUb0JvdHRvbUVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQlJBSU5fVklFV19UWVBFO1xuICB9XG5cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJCcmFpblwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImJyYWluXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLXNpZGViYXJcIik7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBoZWFkZXJUb3AgPSBoZWFkZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyLXRvcFwiIH0pO1xuICAgIGhlYWRlclRvcC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIHRoaXMubW9kZWxSb3dFbCA9IGhlYWRlclRvcC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1tb2RlbC1yb3dcIiB9KTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB2b2lkIHRoaXMucmVmcmVzaE1vZGVsT3B0aW9ucygpO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJBc2sgeW91ciB2YXVsdCwgb3IgdGVsbCBCcmFpbiB3aGF0IHRvIGZpbGUuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNzYWdlc0NvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW1lc3NhZ2VzLWNvbnRhaW5lclwiIH0pO1xuICAgIHRoaXMubWVzc2FnZXNFbCA9IG1lc3NhZ2VzQ29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LW1lc3NhZ2VzXCIsXG4gICAgICBhdHRyOiB7IFwiYXJpYS1saXZlXCI6IFwicG9saXRlXCIsIFwiYXJpYS1hdG9taWNcIjogXCJmYWxzZVwiIH0sXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlc0VsLmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgKCkgPT4ge1xuICAgICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9ICF0aGlzLmlzTmVhckJvdHRvbSgpO1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgIH0pO1xuICAgIGlmICh0aGlzLnR1cm5zLmxlbmd0aCA+IDApIHtcbiAgICAgIHZvaWQgdGhpcy5yZW5kZXJNZXNzYWdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlckVtcHR5U3RhdGUoKTtcbiAgICB9XG5cbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tRWwgPSBtZXNzYWdlc0NvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2Nyb2xsLXRvLWJvdHRvbVwiLFxuICAgICAgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJTY3JvbGwgdG8gYm90dG9tXCIgfSxcbiAgICB9KTtcbiAgICBzZXRJY29uKHRoaXMuc2Nyb2xsVG9Cb3R0b21FbCwgXCJhcnJvdy1kb3duXCIpO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICAgICAgdGhpcy5tZXNzYWdlc0VsLnNjcm9sbFRvKHsgdG9wOiB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogXCJzbW9vdGhcIiB9KTtcbiAgICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgICB9KTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG5cbiAgICB0aGlzLmlucHV0RWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhYm91dCB5b3VyIHZhdWx0LCBvciBwYXN0ZSByb3VnaCBub3RlcyBmb3IgQnJhaW4gdG8gZmlsZS4uLlwiLFxuICAgICAgICByb3dzOiBcIjRcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2VuZE1lc3NhZ2UoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYWN0aW9uc1wiIH0pO1xuICAgIHRoaXMuc2VuZEJ1dHRvbkVsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5IGJyYWluLWJ1dHRvbi1zZW5kXCIsXG4gICAgICB0ZXh0OiBcIlNlbmRcIixcbiAgICB9KTtcbiAgICB0aGlzLnNlbmRCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNlbmRNZXNzYWdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXN0b3AgYnJhaW4tYnV0dG9uLWhpZGRlblwiLFxuICAgICAgdGV4dDogXCJTdG9wXCIsXG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc3RvcEN1cnJlbnRSZXF1ZXN0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuaGlkZGVuID0gdHJ1ZTtcblxuICAgIHRoaXMuc3RhdHVzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXN0YXR1c1wiIH0pO1xuICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlcj8uYWJvcnQoKTtcbiAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICBpZiAodGhpcy5yZXNpemVGcmFtZUlkICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJlc2l6ZUZyYW1lSWQpO1xuICAgICAgdGhpcy5yZXNpemVGcmFtZUlkID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuc3RhdHVzRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zdGF0dXNFbC5lbXB0eSgpO1xuICAgIGxldCBzdGF0dXNUZXh0ID0gXCJOb3QgY29ubmVjdGVkXCI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIGlmIChhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICAgIHN0YXR1c1RleHQgPSBhaVN0YXR1cy5tb2RlbCB8fCBcIkNvbm5lY3RlZFwiO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRpY2F0b3IgPSB0aGlzLnN0YXR1c0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICBjbHM6IGBicmFpbi1zdGF0dXMtaW5kaWNhdG9yICR7c3RhdHVzVGV4dCAhPT0gXCJOb3QgY29ubmVjdGVkXCIgPyBcImJyYWluLXN0YXR1cy1pbmRpY2F0b3ItLW9rXCIgOiBcImJyYWluLXN0YXR1cy1pbmRpY2F0b3ItLXdhcm5cIn1gLFxuICAgIH0pO1xuICAgIGluZGljYXRvci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgdGhpcy5zdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBzdGF0dXNUZXh0IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZW5kTWVzc2FnZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1lc3NhZ2UgfHwgdGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICAgIHRoaXMuYWRkVHVybihcInVzZXJcIiwgbWVzc2FnZSk7XG4gICAgdGhpcy5zZXRMb2FkaW5nKHRydWUsIFwicXVlcnlcIik7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBoaXN0b3J5ID0gdGhpcy5idWlsZENoYXRIaXN0b3J5KCk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucGx1Z2luLmNoYXRXaXRoVmF1bHQobWVzc2FnZSwgaGlzdG9yeSwgY29udHJvbGxlci5zaWduYWwsIChzdGFnZSkgPT4ge1xuICAgICAgICB0aGlzLmxvYWRpbmdTdGFnZSA9IHN0YWdlO1xuICAgICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMucmVuZGVyUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaXNTdG9wcGVkUmVxdWVzdChlcnJvcikpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudEVsLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgdGhpcy5hZGRUdXJuKFwiYnJhaW5cIiwgXCJDb2RleCByZXF1ZXN0IHN0b3BwZWQuXCIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGNoYXQgd2l0aCB0aGUgdmF1bHRcIik7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgICB0aGlzLnNldExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDaGF0SGlzdG9yeSgpOiBDaGF0RXhjaGFuZ2VbXSB7XG4gICAgLy8gRXhjbHVkZSB0aGUgbGFzdCB0dXJuLCB3aGljaCBpcyB0aGUgY3VycmVudCB1c2VyIG1lc3NhZ2UgYmVpbmcgc2VudC5cbiAgICByZXR1cm4gdGhpcy50dXJuc1xuICAgICAgLnNsaWNlKDAsIC0xKVxuICAgICAgLmZpbHRlcigodHVybik6IHR1cm4gaXMgQ2hhdFR1cm4gJiB7IHRleHQ6IHN0cmluZyB9ID0+IEJvb2xlYW4odHVybi50ZXh0KSlcbiAgICAgIC5tYXAoKHR1cm4pID0+ICh7XG4gICAgICAgIHJvbGU6IHR1cm4ucm9sZSxcbiAgICAgICAgdGV4dDogdHVybi50ZXh0LFxuICAgICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdG9wQ3VycmVudFJlcXVlc3QoKTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RlbFNlbGVjdG9yKCk6IHZvaWQge1xuICAgIHRoaXMubW9kZWxSb3dFbC5lbXB0eSgpO1xuICAgIGlmICh0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcpIHtcbiAgICAgIHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtYWN0aXZlXCIsXG4gICAgICAgIHRleHQ6IFwiTG9hZGluZyBDb2RleCBtb2RlbHMuLi5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3QgPSB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzZWxlY3RcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGVsLXNlbGVjdFwiLFxuICAgIH0pO1xuICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRoaXMuaXNMb2FkaW5nO1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHRoaXMubW9kZWxPcHRpb25zKSB7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB2YWx1ZTogb3B0aW9uLnZhbHVlLFxuICAgICAgICB0ZXh0OiBvcHRpb24ubGFiZWwsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHZhbHVlOiBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gICAgICB0ZXh0OiBcIkN1c3RvbS4uLlwiLFxuICAgIH0pO1xuICAgIHNlbGVjdC52YWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdFxuICAgICAgPyBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICAgIDogZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVNb2RlbFNlbGVjdGlvbihzZWxlY3QudmFsdWUpO1xuICAgIH0pO1xuXG4gICAgaWYgKHNlbGVjdC52YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICBpZiAodGhpcy5jdXN0b21Nb2RlbERyYWZ0ICYmIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICAgIHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1tb2RlbC1hY3RpdmVcIixcbiAgICAgICAgICB0ZXh0OiBgQWN0aXZlOiAke3RoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc3QgaW5wdXQgPSB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RlbC1jdXN0b21cIixcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIkNvZGV4IG1vZGVsIGlkXCIsXG4gICAgICAgIH0sXG4gICAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgaW5wdXQuZGlzYWJsZWQgPSB0aGlzLmlzTG9hZGluZztcbiAgICAgIGlucHV0LnZhbHVlID0gdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8IGlzS25vd25Db2RleE1vZGVsKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUN1c3RvbU1vZGVsKGlucHV0LnZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnMgPSBhd2FpdCBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlTW9kZWxTZWxlY3Rpb24odmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh2YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSB0cnVlO1xuICAgICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSB2YWx1ZTtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUN1c3RvbU1vZGVsKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2RlbCA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1vZGVsKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gbW9kZWw7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclJlc3BvbnNlKHJlc3BvbnNlOiBWYXVsdENoYXRSZXNwb25zZSk6IHZvaWQge1xuICAgIHRoaXMuYWRkVHVybihcImJyYWluXCIsIHJlc3BvbnNlLmFuc3dlci50cmltKCksIHJlc3BvbnNlLnNvdXJjZXMpO1xuXG4gICAgaWYgKHJlc3BvbnNlLnBsYW4gJiYgcmVzcG9uc2UucGxhbi5vcGVyYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIG5ldyBWYXVsdFBsYW5Nb2RhbCh0aGlzLmFwcCwge1xuICAgICAgICBwbGFuOiByZXNwb25zZS5wbGFuLFxuICAgICAgICBzZXR0aW5nczogdGhpcy5wbHVnaW4uc2V0dGluZ3MsXG4gICAgICAgIG9uQXBwcm92ZTogYXN5bmMgKHBsYW4pID0+IHRoaXMucGx1Z2luLmFwcGx5VmF1bHRXcml0ZVBsYW4ocGxhbiksXG4gICAgICAgIG9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlLCBwYXRocykgPT4ge1xuICAgICAgICAgIHRoaXMuYWRkVXBkYXRlZEZpbGVUdXJuKG1lc3NhZ2UsIHBhdGhzKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTdGF0dXMoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pLm9wZW4oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldExvYWRpbmcobG9hZGluZzogYm9vbGVhbiwgc3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIiA9IFwicXVlcnlcIik6IHZvaWQge1xuICAgIHRoaXMuaXNMb2FkaW5nID0gbG9hZGluZztcbiAgICB0aGlzLmxvYWRpbmdTdGFnZSA9IHN0YWdlO1xuICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICB0aGlzLmxvYWRpbmdTdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgdGhpcy51cGRhdGVMb2FkaW5nVGV4dCgpO1xuICAgICAgdGhpcy5zdGFydExvYWRpbmdUaW1lcigpO1xuICAgICAgdGhpcy5hcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcExvYWRpbmdUaW1lcigpO1xuICAgICAgdGhpcy5sb2FkaW5nVGV4dCA9IFwiXCI7XG4gICAgICB0aGlzLnJlbW92ZUxvYWRpbmdJbmRpY2F0b3IoKTtcbiAgICB9XG4gICAgdGhpcy5pbnB1dEVsLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB0aGlzLnNlbmRCdXR0b25FbC5oaWRkZW4gPSBsb2FkaW5nO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmhpZGRlbiA9ICFsb2FkaW5nO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhdXRvUmVzaXplSW5wdXQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVzaXplRnJhbWVJZCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yZXNpemVGcmFtZUlkKTtcbiAgICB9XG4gICAgdGhpcy5yZXNpemVGcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IG51bGw7XG4gICAgICB0aGlzLmlucHV0RWwuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCI7XG4gICAgICB0aGlzLmlucHV0RWwuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5taW4odGhpcy5pbnB1dEVsLnNjcm9sbEhlaWdodCwgMjQwKX1weGA7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZFR1cm4ocm9sZTogXCJ1c2VyXCIgfCBcImJyYWluXCIsIHRleHQ6IHN0cmluZywgc291cmNlcz86IFZhdWx0UXVlcnlNYXRjaFtdKTogdm9pZCB7XG4gICAgY29uc3QgdHVybjogQ2hhdFR1cm4gPSB7IHJvbGUsIHRleHQsIHNvdXJjZXMgfTtcbiAgICB0aGlzLnR1cm5zLnB1c2godHVybik7XG4gICAgdm9pZCB0aGlzLmFwcGVuZFR1cm5FbGVtZW50KHR1cm4pO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRVcGRhdGVkRmlsZVR1cm4obWVzc2FnZTogc3RyaW5nLCBwYXRoczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBjb25zdCB0dXJuOiBDaGF0VHVybiA9IHtcbiAgICAgIHJvbGU6IFwiYnJhaW5cIixcbiAgICAgIHRleHQ6IG1lc3NhZ2UsXG4gICAgICB1cGRhdGVkUGF0aHM6IHBhdGhzLFxuICAgIH07XG4gICAgdGhpcy50dXJucy5wdXNoKHR1cm4pO1xuICAgIHZvaWQgdGhpcy5hcHBlbmRUdXJuRWxlbWVudCh0dXJuKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwZW5kVHVybkVsZW1lbnQodHVybjogQ2hhdFR1cm4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBnZW5lcmF0aW9uID0gKyt0aGlzLnJlbmRlckdlbmVyYXRpb247XG5cbiAgICBjb25zdCBlbXB0eUVsID0gdGhpcy5tZXNzYWdlc0VsLnF1ZXJ5U2VsZWN0b3IoXCIuYnJhaW4tY2hhdC1lbXB0eVwiKTtcbiAgICBpZiAoZW1wdHlFbCkge1xuICAgICAgZW1wdHlFbC5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlbW92ZUxvYWRpbmdJbmRpY2F0b3IoKTtcblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBgYnJhaW4tY2hhdC1tZXNzYWdlIGJyYWluLWNoYXQtbWVzc2FnZS0ke3R1cm4ucm9sZX1gLFxuICAgIH0pO1xuICAgIGNvbnN0IHJvbGVFbCA9IGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1yb2xlXCIgfSk7XG4gICAgY29uc3Qgcm9sZUljb24gPSByb2xlRWwuY3JlYXRlRWwoXCJzcGFuXCIpO1xuICAgIHNldEljb24ocm9sZUljb24sIHR1cm4ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcInVzZXJcIiA6IFwiYnJhaW4tY2lyY3VpdFwiKTtcbiAgICByb2xlRWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogdHVybi5yb2xlID09PSBcInVzZXJcIiA/IFwiWW91XCIgOiBcIkJyYWluXCIgfSk7XG5cbiAgICBjb25zdCBvdXRwdXQgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW91dHB1dFwiIH0pO1xuICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIHR1cm4udGV4dCwgb3V0cHV0LCBcIlwiLCB0aGlzKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikge1xuICAgICAgICBpdGVtLnJlbW92ZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmFkZENvcHlCdXR0b25zKG91dHB1dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5zZXRUZXh0KHR1cm4udGV4dCk7XG4gICAgfVxuICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIiAmJiB0dXJuLnNvdXJjZXM/Lmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJTb3VyY2VzKGl0ZW0sIHR1cm4uc291cmNlcyk7XG4gICAgfVxuICAgIGlmICh0dXJuLnJvbGUgPT09IFwiYnJhaW5cIiAmJiB0dXJuLnVwZGF0ZWRQYXRocz8ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbmRlclVwZGF0ZWRGaWxlcyhpdGVtLCB0dXJuLnVwZGF0ZWRQYXRocyk7XG4gICAgfVxuXG4gICAgdGhpcy5tYXliZVNjcm9sbFRvQm90dG9tKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZExvYWRpbmdJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtYnJhaW4gYnJhaW4tY2hhdC1tZXNzYWdlLWxvYWRpbmdcIixcbiAgICB9KTtcbiAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBzZXRJY29uKHJvbGVJY29uLCBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiQnJhaW5cIiB9KTtcblxuICAgIGNvbnN0IGxvYWRpbmcgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWxvYWRpbmdcIiB9KTtcbiAgICBjb25zdCBkb3RzID0gbG9hZGluZy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nLWRvdHNcIiB9KTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBjb25zdCBtZXRhID0gbG9hZGluZy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nLW1ldGFcIiB9KTtcbiAgICB0aGlzLmxvYWRpbmdTdGFnZUVsID0gbWV0YS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWxvYWRpbmctc3RhZ2VcIixcbiAgICAgIHRleHQ6IFwiU2VhcmNoaW5nIHZhdWx0XHUyMDI2XCIsXG4gICAgfSk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbWV0YS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWxvYWRpbmctdGltZVwiLFxuICAgICAgdGV4dDogXCIwc1wiLFxuICAgIH0pO1xuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGNvbnN0IGxvYWRpbmdFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIpO1xuICAgIGlmIChsb2FkaW5nRWwpIHtcbiAgICAgIGxvYWRpbmdFbC5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbnVsbDtcbiAgICB0aGlzLmxvYWRpbmdTdGFnZUVsID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWVzc2FnZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuICAgIHRoaXMubWVzc2FnZXNFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy50dXJucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHR1cm4gb2YgdGhpcy50dXJucykge1xuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBgYnJhaW4tY2hhdC1tZXNzYWdlIGJyYWluLWNoYXQtbWVzc2FnZS0ke3R1cm4ucm9sZX1gLFxuICAgICAgfSk7XG4gICAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgICAgY29uc3Qgcm9sZUljb24gPSByb2xlRWwuY3JlYXRlRWwoXCJzcGFuXCIpO1xuICAgICAgc2V0SWNvbihyb2xlSWNvbiwgdHVybi5yb2xlID09PSBcInVzZXJcIiA/IFwidXNlclwiIDogXCJicmFpbi1jaXJjdWl0XCIpO1xuICAgICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IHR1cm4ucm9sZSA9PT0gXCJ1c2VyXCIgPyBcIllvdVwiIDogXCJCcmFpblwiIH0pO1xuXG4gICAgICBjb25zdCBvdXRwdXQgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW91dHB1dFwiIH0pO1xuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIHR1cm4udGV4dCwgb3V0cHV0LCBcIlwiLCB0aGlzKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZW5kZXJHZW5lcmF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkQ29weUJ1dHRvbnMob3V0cHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5zZXRUZXh0KHR1cm4udGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJTb3VyY2VzKGl0ZW0sIHR1cm4uc291cmNlcyk7XG4gICAgICB9XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgICB0aGlzLnJlbmRlclVwZGF0ZWRGaWxlcyhpdGVtLCB0dXJuLnVwZGF0ZWRQYXRocyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgdGhpcy5hcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGFydExvYWRpbmdUaW1lcigpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICB0aGlzLmxvYWRpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RpbWVyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdUaW1lcik7XG4gICAgICB0aGlzLmxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVMb2FkaW5nVGV4dCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWNvbmRzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMubG9hZGluZ1N0YXJ0ZWRBdCkgLyAxMDAwKSk7XG4gICAgY29uc3Qgc3RhZ2VMYWJlbCA9IHRoaXMubG9hZGluZ1N0YWdlID09PSBcInF1ZXJ5XCIgPyBcIlNlYXJjaGluZyB2YXVsdFwiIDogXCJBc2tpbmcgQ29kZXhcIjtcbiAgICB0aGlzLmxvYWRpbmdUZXh0ID0gYCR7c3RhZ2VMYWJlbH0gXHUwMEI3ICR7c2Vjb25kc31zYDtcbiAgICBpZiAodGhpcy5sb2FkaW5nVGV4dEVsKSB7XG4gICAgICB0aGlzLmxvYWRpbmdUZXh0RWwuc2V0VGV4dCh0aGlzLmxvYWRpbmdUZXh0KTtcbiAgICB9XG4gICAgaWYgKHRoaXMubG9hZGluZ1N0YWdlRWwpIHtcbiAgICAgIHRoaXMubG9hZGluZ1N0YWdlRWwuc2V0VGV4dCh0aGlzLmxvYWRpbmdTdGFnZSA9PT0gXCJxdWVyeVwiID8gXCJTZWFyY2hpbmcgdmF1bHRcdTIwMjZcIiA6IFwiQXNraW5nIENvZGV4XHUyMDI2XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBlbXB0eSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LWVtcHR5XCIgfSk7XG4gICAgY29uc3QgaWNvbiA9IGVtcHR5LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtZW1wdHktaWNvblwiIH0pO1xuICAgIHNldEljb24oaWNvbiwgXCJicmFpbi1jaXJjdWl0XCIpO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJTdGFydCB3aXRoIGEgcXVlc3Rpb24gb3Igcm91Z2ggY2FwdHVyZVwiIH0pO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICB0ZXh0OiBcIkJyYWluIHJldHJpZXZlcyB2YXVsdCBjb250ZXh0LCBhbnN3ZXJzIHdpdGggc291cmNlcywgYW5kIHByZXZpZXdzIHdyaXRlcyBiZWZvcmUgYW55dGhpbmcgY2hhbmdlcy5cIixcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU291cmNlcyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHZvaWQge1xuICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHsgY2xzOiBcImJyYWluLXNvdXJjZXNcIiB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBgU291cmNlcyAoJHtNYXRoLm1pbihzb3VyY2VzLmxlbmd0aCwgOCl9KWAsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcy5zbGljZSgwLCA4KSkge1xuICAgICAgY29uc3Qgc291cmNlRWwgPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXNvdXJjZVwiIH0pO1xuICAgICAgY29uc3QgdGl0bGUgPSBzb3VyY2VFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtdGl0bGVcIixcbiAgICAgICAgdGV4dDogc291cmNlLnBhdGgsXG4gICAgICB9KTtcbiAgICAgIHRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuU291cmNlKHNvdXJjZS5wYXRoKTtcbiAgICAgIH0pO1xuICAgICAgc291cmNlRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXJlYXNvblwiLFxuICAgICAgICB0ZXh0OiBzb3VyY2UucmVhc29uLFxuICAgICAgfSk7XG4gICAgICBpZiAoc291cmNlLmV4Y2VycHQpIHtcbiAgICAgICAgc291cmNlRWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtZXhjZXJwdFwiLFxuICAgICAgICAgIHRleHQ6IHNvdXJjZS5leGNlcnB0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclVwZGF0ZWRGaWxlcyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBwYXRoczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlcyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi11cGRhdGVkLWZpbGVzXCIgfSk7XG4gICAgZmlsZXMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1yZWFzb25cIixcbiAgICAgIHRleHQ6IFwiVXBkYXRlZCBmaWxlc1wiLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuICAgICAgY29uc3QgYnV0dG9uID0gZmlsZXMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXRpdGxlXCIsXG4gICAgICAgIHRleHQ6IHBhdGgsXG4gICAgICB9KTtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlblNvdXJjZShwYXRoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNOZWFyQm90dG9tKHRocmVzaG9sZCA9IDYwKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZWwgPSB0aGlzLm1lc3NhZ2VzRWw7XG4gICAgcmV0dXJuIGVsLnNjcm9sbEhlaWdodCAtIGVsLnNjcm9sbFRvcCAtIGVsLmNsaWVudEhlaWdodCA8IHRocmVzaG9sZDtcbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTY3JvbGxUb0JvdHRvbSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy51c2VyU2Nyb2xsZWRVcCkge1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsVG8oeyB0b3A6IHRoaXMubWVzc2FnZXNFbC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiBcInNtb290aFwiIH0pO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbFRvQm90dG9tRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2hvdyA9IHRoaXMudXNlclNjcm9sbGVkVXAgJiYgdGhpcy50dXJucy5sZW5ndGggPiAwO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbC50b2dnbGVDbGFzcyhcImJyYWluLXNjcm9sbC10by1ib3R0b20tLXZpc2libGVcIiwgc2hvdyk7XG4gIH1cblxuICBwcml2YXRlIGFkZENvcHlCdXR0b25zKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBjb2RlQmxvY2tzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCJwcmVcIik7XG4gICAgZm9yIChjb25zdCBwcmUgb2YgQXJyYXkuZnJvbShjb2RlQmxvY2tzKSkge1xuICAgICAgY29uc3QgY29kZSA9IHByZS5xdWVyeVNlbGVjdG9yKFwiY29kZVwiKTtcbiAgICAgIGlmICghY29kZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBidXR0b24uY2xhc3NOYW1lID0gXCJicmFpbi1jb3B5LWNvZGUtYnV0dG9uXCI7XG4gICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIFwiQ29weSBjb2RlXCIpO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY29kZS50ZXh0Q29udGVudCB8fCBcIlwiKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcGllZCFcIjtcbiAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcImNvcGllZFwiKTtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiY29waWVkXCIpO1xuICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHByZS5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3BlblNvdXJjZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNTdG9wcGVkUmVxdWVzdChlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIjtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHR5cGUgeyBWYXVsdFdyaXRlT3BlcmF0aW9uLCBWYXVsdFdyaXRlUGxhbiB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc1NhZmVNYXJrZG93blBhdGggfSBmcm9tIFwiLi4vdXRpbHMvcGF0aC1zYWZldHlcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBWYXVsdFBsYW5Nb2RhbE9wdGlvbnMge1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbjtcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIG9uQXBwcm92ZTogKHBsYW46IFZhdWx0V3JpdGVQbGFuKSA9PiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZywgcGF0aHM6IHN0cmluZ1tdKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0UGxhbk1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzZWxlY3RlZE9wZXJhdGlvbnMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkcmFmdE9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcHJpdmF0ZSBhcHByb3ZlQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBjYW5jZWxCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogVmF1bHRQbGFuTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zID0gb3B0aW9ucy5wbGFuLm9wZXJhdGlvbnMubWFwKChvcGVyYXRpb24pID0+ICh7IC4uLm9wZXJhdGlvbiB9KSk7XG4gICAgdGhpcy5kcmFmdE9wZXJhdGlvbnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCkpO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN1cGVyLmNsb3NlKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUmV2aWV3IFZhdWx0IENoYW5nZXNcIiB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYCR7dGhpcy5vcHRpb25zLnBsYW4uc3VtbWFyeSB8fCBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IGNoYW5nZXMuXCJ9IENvbmZpZGVuY2U6ICR7dGhpcy5vcHRpb25zLnBsYW4uY29uZmlkZW5jZX0uYCxcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgW2luZGV4LCBvcGVyYXRpb25dIG9mIHRoaXMuZHJhZnRPcGVyYXRpb25zLmVudHJpZXMoKSkge1xuICAgICAgdGhpcy5yZW5kZXJPcGVyYXRpb24oaW5kZXgsIG9wZXJhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wbGFuLnF1ZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXBsYW4tcXVlc3Rpb25zXCIgfSk7XG4gICAgICBxdWVzdGlvbnMuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiT3BlbiBRdWVzdGlvbnNcIiB9KTtcbiAgICAgIGNvbnN0IGxpc3QgPSBxdWVzdGlvbnMuY3JlYXRlRWwoXCJ1bFwiKTtcbiAgICAgIGZvciAoY29uc3QgcXVlc3Rpb24gb2YgdGhpcy5vcHRpb25zLnBsYW4ucXVlc3Rpb25zKSB7XG4gICAgICAgIGxpc3QuY3JlYXRlRWwoXCJsaVwiLCB7IHRleHQ6IHF1ZXN0aW9uIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJ1dHRvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1idXR0b24tcm93XCIgfSk7XG4gICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwgPSBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiQXBwcm92ZSBhbmQgV3JpdGVcIixcbiAgICB9KTtcbiAgICB0aGlzLmFwcHJvdmVCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmFwcHJvdmUoKTtcbiAgICB9KTtcbiAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uXCIsXG4gICAgICB0ZXh0OiBcIkNhbmNlbFwiLFxuICAgIH0pO1xuICAgIHRoaXMuY2FuY2VsQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9wZXJhdGlvbnMgPSB0aGlzLmRyYWZ0T3BlcmF0aW9uc1xuICAgICAgLmZpbHRlcigoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmhhcyhpbmRleCkpXG4gICAgICAubWFwKChvcGVyYXRpb24pID0+ICh7XG4gICAgICAgIC4uLm9wZXJhdGlvbixcbiAgICAgICAgcGF0aDogb3BlcmF0aW9uLnBhdGgudHJpbSgpLFxuICAgICAgICBjb250ZW50OiBvcGVyYXRpb24uY29udGVudC50cmltKCksXG4gICAgICB9KSlcbiAgICAgIC5maWx0ZXIoKG9wZXJhdGlvbikgPT4gb3BlcmF0aW9uLnBhdGggJiYgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgIGlmICghb3BlcmF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJTZWxlY3QgYXQgbGVhc3Qgb25lIGNoYW5nZSB0byBhcHBseVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaW52YWxpZFBhdGggPSBvcGVyYXRpb25zLmZpbmQoKG9wZXJhdGlvbikgPT4gIWlzU2FmZU1hcmtkb3duUGF0aChvcGVyYXRpb24ucGF0aCwgdGhpcy5vcHRpb25zLnNldHRpbmdzKSk7XG4gICAgaWYgKGludmFsaWRQYXRoKSB7XG4gICAgICBuZXcgTm90aWNlKGBJbnZhbGlkIHRhcmdldCBwYXRoOiAke2ludmFsaWRQYXRoLnBhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMud29ya2luZyA9IHRydWU7XG4gICAgdGhpcy5zZXRCdXR0b25zRW5hYmxlZChmYWxzZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgdGhpcy5vcHRpb25zLm9uQXBwcm92ZSh7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5wbGFuLFxuICAgICAgICBvcGVyYXRpb25zLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBtZXNzYWdlID0gcGF0aHMubGVuZ3RoXG4gICAgICAgID8gYFVwZGF0ZWQgJHtwYXRocy5qb2luKFwiLCBcIil9YFxuICAgICAgICA6IFwiTm8gdmF1bHQgY2hhbmdlcyB3ZXJlIGFwcGxpZWRcIjtcbiAgICAgIG5ldyBOb3RpY2UobWVzc2FnZSk7XG4gICAgICBhd2FpdCB0aGlzLm9wdGlvbnMub25Db21wbGV0ZShtZXNzYWdlLCBwYXRocyk7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBhcHBseSB2YXVsdCBjaGFuZ2VzXCIpO1xuICAgICAgdGhpcy5zZXRCdXR0b25zRW5hYmxlZCh0cnVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25zRW5hYmxlZChlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuYXBwcm92ZUJ1dHRvbkVsKSB7XG4gICAgICB0aGlzLmFwcHJvdmVCdXR0b25FbC5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwudGV4dENvbnRlbnQgPSBlbmFibGVkID8gXCJBcHByb3ZlIGFuZCBXcml0ZVwiIDogXCJXcml0aW5nLi4uXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLmNhbmNlbEJ1dHRvbkVsKSB7XG4gICAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsLmRpc2FibGVkID0gIWVuYWJsZWQ7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJPcGVyYXRpb24oaW5kZXg6IG51bWJlciwgb3BlcmF0aW9uOiBWYXVsdFdyaXRlT3BlcmF0aW9uKTogdm9pZCB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXBsYW4tb3BlcmF0aW9uXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyID0gaXRlbS5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcImJyYWluLXBsYW4tb3BlcmF0aW9uLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IGNoZWNrYm94ID0gaGVhZGVyLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgYXR0cjogeyB0eXBlOiBcImNoZWNrYm94XCIgfSxcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5oYXMoaW5kZXgpO1xuICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuYWRkKGluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmRlbGV0ZShpbmRleCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbikgfSk7XG5cbiAgICBpZiAob3BlcmF0aW9uLmRlc2NyaXB0aW9uKSB7XG4gICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXBsYW4tZGVzY3JpcHRpb25cIixcbiAgICAgICAgdGV4dDogb3BlcmF0aW9uLmRlc2NyaXB0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aElucHV0ID0gaXRlbS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLXBhdGgtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIFwiYXJpYS1sYWJlbFwiOiBcIlRhcmdldCBtYXJrZG93biBwYXRoXCIsXG4gICAgICB9LFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcGF0aElucHV0LnZhbHVlID0gb3BlcmF0aW9uLnBhdGg7XG4gICAgcGF0aElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0gPSB7XG4gICAgICAgIC4uLnRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSxcbiAgICAgICAgcGF0aDogcGF0aElucHV0LnZhbHVlLFxuICAgICAgfSBhcyBWYXVsdFdyaXRlT3BlcmF0aW9uO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dGFyZWEgPSBpdGVtLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0IGJyYWluLXBsYW4tZWRpdG9yXCIsXG4gICAgICBhdHRyOiB7IHJvd3M6IFwiMTBcIiB9LFxuICAgIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gb3BlcmF0aW9uLmNvbnRlbnQ7XG4gICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSA9IHtcbiAgICAgICAgLi4udGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdLFxuICAgICAgICBjb250ZW50OiB0ZXh0YXJlYS52YWx1ZSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpYmVPcGVyYXRpb24ob3BlcmF0aW9uOiBWYXVsdFdyaXRlUGxhbltcIm9wZXJhdGlvbnNcIl1bbnVtYmVyXSk6IHN0cmluZyB7XG4gIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJhcHBlbmRcIikge1xuICAgIHJldHVybiBgQXBwZW5kIHRvICR7b3BlcmF0aW9uLnBhdGh9YDtcbiAgfVxuICByZXR1cm4gYENyZWF0ZSAke29wZXJhdGlvbi5wYXRofWA7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogQ2VudHJhbGl6ZWQgZXJyb3IgaGFuZGxpbmcgdXRpbGl0eVxuICogU3RhbmRhcmRpemVzIGVycm9yIHJlcG9ydGluZyBhY3Jvc3MgdGhlIHBsdWdpblxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlO1xuICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yQW5kUmV0aHJvdyhlcnJvcjogdW5rbm93biwgZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyIHtcbiAgc2hvd0Vycm9yKGVycm9yLCBkZWZhdWx0TWVzc2FnZSk7XG4gIHRocm93IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihkZWZhdWx0TWVzc2FnZSk7XG59XG4iLCAiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmludGVyZmFjZSBCcmFpbkNvbW1hbmRIb3N0IHtcbiAgYWRkQ29tbWFuZDogUGx1Z2luW1wiYWRkQ29tbWFuZFwiXTtcbiAgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPjtcbiAgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBCcmFpbkNvbW1hbmRIb3N0KTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLXZhdWx0LWNoYXRcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIFZhdWx0IENoYXRcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5TaWRlYmFyKCk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4taW5zdHJ1Y3Rpb25zXCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBJbnN0cnVjdGlvbnNcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcGx1Z2luLm9wZW5JbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSxcbiAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBc0M7OztBQ08vQixJQUFNLHlCQUE4QztBQUFBLEVBQ3pELGFBQWE7QUFBQSxFQUNiLGtCQUFrQjtBQUFBLEVBQ2xCLFlBQVk7QUFBQSxFQUNaLGdCQUFnQjtBQUNsQjtBQUVPLFNBQVMsdUJBQ2QsT0FDcUI7QUFDckIsUUFBTSxTQUE4QjtBQUFBLElBQ2xDLEdBQUc7QUFBQSxJQUNILEdBQUc7QUFBQSxFQUNMO0FBRUEsU0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLGtCQUFrQjtBQUFBLE1BQ2hCLE9BQU87QUFBQSxNQUNQLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxZQUFZLE9BQU8sT0FBTyxlQUFlLFdBQVcsT0FBTyxXQUFXLEtBQUssSUFBSTtBQUFBLElBQy9FLGdCQUFnQix3QkFBd0IsT0FBTyxj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LE9BQU8sS0FBSyxJQUFJLFVBQVUsYUFBYSxLQUFLO0FBQ2xELFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSx3QkFBTyw0QkFBNEI7QUFDdkM7QUFBQSxJQUNGO0FBQ0EsVUFBTSxLQUFLLGFBQWE7QUFBQSxNQUN0QixNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsSUFDVixDQUFDO0FBQ0QsU0FBSyxJQUFJLFVBQVUsV0FBVyxJQUFJO0FBQUEsRUFDcEM7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBQzFDLFVBQU0sS0FBSyxtQkFBbUIsdUJBQXVCO0FBQ3JELFVBQU0sT0FBTyxLQUFLLElBQUksTUFBTSxzQkFBc0IsS0FBSyxTQUFTLGdCQUFnQjtBQUNoRixRQUFJLEVBQUUsZ0JBQWdCLHlCQUFRO0FBQzVCLFVBQUksd0JBQU8sa0JBQWtCLEtBQUssU0FBUyxnQkFBZ0IsRUFBRTtBQUM3RDtBQUFBLElBQ0Y7QUFDQSxVQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsUUFBUSxLQUFLO0FBQzdDLFVBQU0sS0FBSyxTQUFTLElBQUk7QUFBQSxFQUMxQjtBQUFBLEVBRUEsTUFBTSxjQUFjLFNBQWlCLFVBQTBCLENBQUMsR0FBRyxRQUFzQixTQUF1RTtBQUM5SixXQUFPLEtBQUssaUJBQWlCLFFBQVEsU0FBUyxTQUFTLFFBQVEsT0FBTztBQUFBLEVBQ3hFO0FBQUEsRUFFQSxNQUFNLG9CQUFvQixNQUF5QztBQUNqRSxVQUFNLFFBQVEsTUFBTSxLQUFLLGtCQUFrQixVQUFVLElBQUk7QUFDekQsVUFBTSxLQUFLLCtCQUErQjtBQUMxQyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEscUJBQThDO0FBQzVDLFVBQU0sU0FBUyxLQUFLLElBQUksVUFBVSxnQkFBZ0IsZUFBZTtBQUNqRSxlQUFXLFFBQVEsUUFBUTtBQUN6QixZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLGdCQUFnQixrQkFBa0I7QUFDcEMsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sdUJBQXNDO0FBaEo5QztBQWlKSSxZQUFNLFVBQUssbUJBQW1CLE1BQXhCLG1CQUEyQjtBQUFBLEVBQ25DO0FBQUEsRUFFQSxNQUFNLGlDQUFnRDtBQUNwRCxRQUFJO0FBQ0YsWUFBTSxLQUFLLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVMsT0FBTztBQUNkLGdCQUFVLE9BQU8sa0NBQWtDO0FBQUEsSUFDckQ7QUFBQSxFQUNGO0FBRUY7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
