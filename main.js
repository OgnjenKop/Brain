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
function getChildProcess() {
  const req = getNodeRequire();
  return req("child_process");
}
function getCodexRuntime() {
  const req = getNodeRequire();
  return {
    execFile: getChildProcess().execFile,
    fs: req("fs/promises"),
    os: req("os"),
    path: req("path")
  };
}
function getExecFileAsync() {
  const req = getNodeRequire();
  const { promisify } = req("util");
  return promisify(getChildProcess().execFile);
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
var MODEL_SECTION_CLASS = "brain-settings-model-section";
var BrainSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.modelOptions = DEFAULT_CODEX_MODEL_OPTIONS;
    this.modelOptionsLoading = false;
    this.modelOptionsLoaded = false;
    this.customModelDraft = false;
    this.modelSectionEl = null;
    this.statusSetting = null;
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("brain-settings");
    containerEl.createEl("h2", { text: "Brain Settings" });
    this.renderStorageSection(containerEl);
    containerEl.createEl("h3", { text: "Codex CLI" });
    this.renderCodexSetupSection(containerEl);
    this.renderStatusSection(containerEl);
    this.renderModelSection(containerEl);
    if (!this.modelOptionsLoading && !this.modelOptionsLoaded) {
      void this.refreshModelOptions();
    } else {
      this.updateModelControlsState();
    }
  }
  renderStorageSection(containerEl) {
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
  }
  renderStatusSection(containerEl) {
    this.statusSetting = new import_obsidian.Setting(containerEl).setName("Codex status").setDesc("Checking Codex CLI status...");
    void this.refreshCodexStatus(this.statusSetting);
  }
  renderCodexSetupSection(containerEl) {
    new import_obsidian.Setting(containerEl).setName("Codex setup").setDesc(
      "Brain uses only the local Codex CLI. Install `@openai/codex`, run `codex login`, then recheck status."
    ).addButton(
      (button) => button.setButtonText("Open Codex Setup").setCta().onClick(async () => {
        await this.plugin.authService.login();
      })
    ).addButton(
      (button) => button.setButtonText("Recheck Status").onClick(async () => {
        var _a;
        (_a = this.statusSetting) == null ? void 0 : _a.setDesc("Rechecking Codex CLI status...");
        await this.refreshCodexStatus(this.statusSetting, true);
        this.updateModelControlsState();
      })
    );
  }
  renderModelSection(containerEl) {
    const wrapper = containerEl.createDiv({ cls: MODEL_SECTION_CLASS });
    this.modelSectionEl = wrapper;
    new import_obsidian.Setting(wrapper).setName("Codex model").setDesc(
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
          this.refreshModelSection();
          return;
        }
        this.customModelDraft = false;
        this.plugin.settings.codexModel = value;
        await this.plugin.saveSettings();
        this.refreshModelSection();
        this.updateStatusFromSettings();
      });
    }).addButton((button) => {
      button.setButtonText("Reload");
      button.onClick(() => {
        void this.refreshModelOptions();
      });
    });
    if (this.customModelDraft || getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions) === CUSTOM_CODEX_MODEL_VALUE) {
      let draftValue = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions) ? "" : this.plugin.settings.codexModel;
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        new import_obsidian.Setting(wrapper).setName("Active Codex model").setDesc(this.plugin.settings.codexModel.trim());
      }
      new import_obsidian.Setting(wrapper).setName("Custom Codex model").setDesc("Exact model id passed to `codex exec --model`.").addText((text) => {
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
    this.updateModelControlsState();
  }
  updateModelControlsState() {
    if (!this.modelSectionEl) {
      return;
    }
    const disabled = this.modelOptionsLoading;
    this.modelSectionEl.querySelectorAll("select, button").forEach((el) => {
      el.disabled = disabled;
    });
  }
  async refreshModelOptions() {
    this.modelOptionsLoading = true;
    this.refreshModelSection();
    try {
      this.modelOptions = await getSupportedCodexModelOptions();
    } finally {
      this.modelOptionsLoaded = true;
      this.modelOptionsLoading = false;
      this.refreshModelSection();
    }
  }
  refreshModelSection() {
    if (!this.modelSectionEl) {
      return;
    }
    const parent = this.modelSectionEl.parentElement;
    if (!parent) {
      return;
    }
    const wasFocused = this.modelSectionEl.contains(document.activeElement);
    this.modelSectionEl.remove();
    this.renderModelSection(parent);
    if (wasFocused && this.modelSectionEl) {
      const focusable = this.modelSectionEl.querySelector(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), button:not([disabled])"
      );
      focusable == null ? void 0 : focusable.focus();
    }
  }
  async saveCustomModelDraft(value) {
    const model = value.trim();
    if (!model) {
      this.customModelDraft = false;
      this.refreshModelSection();
      return;
    }
    this.customModelDraft = false;
    this.plugin.settings.codexModel = model;
    await this.plugin.saveSettings();
    this.refreshModelSection();
    this.updateStatusFromSettings();
  }
  updateStatusFromSettings() {
    if (this.statusSetting) {
      void this.refreshCodexStatus(this.statusSetting);
    }
  }
  async refreshCodexStatus(setting, force = false) {
    if (!setting) {
      return;
    }
    if (force) {
      setting.setDesc("Rechecking Codex CLI status...");
    }
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
  var _a;
  const stdoutText = bufferToString(stdout);
  const stderrText = bufferToString(stderr);
  const wrapped = new CodexExecutionError(error.message, error);
  wrapped.stdout = stdoutText;
  wrapped.stderr = stderrText;
  if (error.code !== null) {
    wrapped.code = error.code;
  }
  wrapped.killed = (_a = error.killed) != null ? _a : false;
  return wrapped;
}
var CodexExecutionError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.stdout = "";
    this.stderr = "";
    this.code = void 0;
    this.killed = false;
    this.name = "CodexExecutionError";
    this.cause = cause;
  }
};
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
var MAX_OPERATIONS = 8;
var VaultWriteService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  normalizePlan(plan) {
    const confidence = readConfidence(plan.confidence);
    const rawOperations = Array.isArray(plan.operations) ? plan.operations : [];
    const validOperations = rawOperations.map((operation) => this.normalizeOperation(operation)).filter((operation) => operation !== null);
    const droppedFromSafety = rawOperations.length - validOperations.length;
    const totalAfterLimit = validOperations.slice(0, MAX_OPERATIONS);
    const droppedFromLimit = validOperations.length - totalAfterLimit.length;
    return {
      summary: typeof plan.summary === "string" && plan.summary.trim() ? plan.summary.trim() : "Brain proposed vault updates.",
      confidence,
      operations: totalAfterLimit,
      questions: (Array.isArray(plan.questions) ? plan.questions : []).map((question) => String(question).trim()).filter(Boolean).slice(0, 5),
      droppedOperations: droppedFromSafety + droppedFromLimit
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
    if (this.options.plan.droppedOperations > 0) {
      const dropped = this.contentEl.createEl("div", {
        cls: "brain-plan-dropped"
      });
      dropped.createEl("strong", {
        text: `${this.options.plan.droppedOperations} proposed change${this.options.plan.droppedOperations === 1 ? " was" : "s were"} skipped`
      });
      dropped.createEl("span", {
        text: "Brain's plan included changes that targeted non-markdown paths, the instructions file, dot-folders, or paths with `..`. Edit the remaining operations below, or ask Brain to retry."
      });
    }
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
    this.modelSelectEl = null;
    this.modelCustomInputEl = null;
    this.modelActiveEl = null;
    this.modelLoadingEl = null;
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
    const headerActions = header.createEl("div", { cls: "brain-header-actions" });
    this.clearButtonEl = headerActions.createEl("button", {
      cls: "brain-button brain-button-ghost brain-button-small",
      attr: { "aria-label": "Clear conversation", title: "Clear conversation" }
    });
    (0, import_obsidian6.setIcon)(this.clearButtonEl, "trash-2");
    this.clearButtonEl.createEl("span", { text: "Clear" });
    this.clearButtonEl.addEventListener("click", () => {
      void this.clearConversation();
    });
    const instructionsLink = headerActions.createEl("button", {
      cls: "brain-button brain-button-ghost brain-button-small",
      attr: { "aria-label": "Open instructions file", title: "Open instructions file" }
    });
    (0, import_obsidian6.setIcon)(instructionsLink, "book-open");
    instructionsLink.createEl("span", { text: "Instructions" });
    instructionsLink.addEventListener("click", () => {
      void this.plugin.openInstructionsFile();
    });
    const settingsLink = headerActions.createEl("button", {
      cls: "brain-button brain-button-ghost brain-button-small",
      attr: { "aria-label": "Open Brain settings", title: "Open Brain settings" }
    });
    (0, import_obsidian6.setIcon)(settingsLink, "settings");
    settingsLink.createEl("span", { text: "Settings" });
    settingsLink.addEventListener("click", () => {
      var _a;
      const commands = this.app.commands;
      (_a = commands == null ? void 0 : commands.executeCommandById) == null ? void 0 : _a.call(commands, "app:open-settings");
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
    const hint = this.contentEl.createEl("div", { cls: "brain-keyboard-hint" });
    hint.createEl("span", { text: "Press " });
    hint.createEl("kbd", { text: "Enter" });
    hint.createEl("span", { text: " to send \xB7 " });
    hint.createEl("kbd", { text: "Shift+Enter" });
    hint.createEl("span", { text: " for a new line" });
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
    this.updateClearButton();
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
    let statusClass = "error";
    try {
      const aiStatus = await getAIConfigurationStatus(this.plugin.settings);
      if (aiStatus.configured) {
        statusText = aiStatus.model ? `Model: ${aiStatus.model}` : "Connected (account default model)";
        statusClass = "ok";
      } else {
        statusText = aiStatus.message || "Not connected";
        statusClass = "warn";
      }
    } catch (error) {
      console.error(error);
      statusText = "Could not check Codex status";
      statusClass = "error";
    }
    const indicator = this.statusEl.createEl("span", {
      cls: `brain-status-indicator brain-status-indicator--${statusClass}`
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
          this.addTurn("info", "Codex request stopped.");
        }
      } else {
        const message2 = error instanceof Error ? error.message : "Could not chat with the vault";
        showError(error, "Could not chat with the vault");
        if (this.contentEl.isConnected) {
          this.addTurn("error", message2);
        }
      }
    } finally {
      this.currentAbortController = null;
      this.setLoading(false);
    }
  }
  buildChatHistory() {
    var _a;
    const out = [];
    for (const turn of this.turns.slice(0, -1)) {
      if (turn.role !== "user" && turn.role !== "brain") {
        continue;
      }
      if (!turn.text) {
        continue;
      }
      if ((_a = turn.updatedPaths) == null ? void 0 : _a.length) {
        continue;
      }
      out.push({ role: turn.role, text: turn.text });
    }
    return out;
  }
  stopCurrentRequest() {
    if (!this.currentAbortController) {
      return;
    }
    this.currentAbortController.abort();
    this.stopButtonEl.disabled = true;
    if (this.loadingStageEl) {
      this.loadingStageEl.setText("Stopping\u2026");
    }
    if (this.loadingTextEl) {
      this.loadingTextEl.setText("Stopping");
    }
  }
  renderModelSelector() {
    this.modelRowEl.empty();
    this.modelSelectEl = null;
    this.modelCustomInputEl = null;
    this.modelActiveEl = null;
    this.modelLoadingEl = null;
    if (this.modelOptionsLoading) {
      this.modelLoadingEl = this.modelRowEl.createEl("span", {
        cls: "brain-model-active",
        text: "Loading Codex models..."
      });
      this.updateModelControlsDisabledState();
      return;
    }
    const select = this.modelRowEl.createEl("select", {
      cls: "brain-model-select"
    });
    this.modelSelectEl = select;
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
    const desiredValue = this.customModelDraft ? CUSTOM_CODEX_MODEL_VALUE : getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions);
    if (this.modelSelectEl.value !== desiredValue) {
      this.modelSelectEl.value = desiredValue;
    }
    select.addEventListener("change", () => {
      void this.handleModelSelection(select.value);
    });
    if (select.value === CUSTOM_CODEX_MODEL_VALUE) {
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        this.modelActiveEl = this.modelRowEl.createEl("span", {
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
      this.modelCustomInputEl = input;
      const initialCustomValue = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions) ? "" : this.plugin.settings.codexModel;
      if (input.value !== initialCustomValue) {
        input.value = initialCustomValue;
      }
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
    this.updateModelControlsDisabledState();
  }
  updateModelControlsDisabledState() {
    const disabled = this.isLoading || this.modelOptionsLoading;
    if (this.modelSelectEl) {
      this.modelSelectEl.disabled = disabled;
    }
    if (this.modelCustomInputEl) {
      this.modelCustomInputEl.disabled = disabled;
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
    this.stopButtonEl.disabled = false;
    this.updateModelControlsDisabledState();
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
    this.updateClearButton();
  }
  addUpdatedFileTurn(message, paths) {
    const turn = {
      role: "brain",
      text: message,
      updatedPaths: paths
    };
    this.turns.push(turn);
    void this.appendTurnElement(turn);
    this.updateClearButton();
  }
  async clearConversation() {
    if (this.isLoading) {
      new import_obsidian6.Notice("Stop the current request before clearing the conversation.");
      return;
    }
    if (this.turns.length === 0) {
      return;
    }
    this.turns = [];
    this.userScrolledUp = false;
    this.messagesEl.empty();
    this.renderEmptyState();
    this.updateScrollToBottomButton();
    this.updateClearButton();
  }
  updateClearButton() {
    if (!this.clearButtonEl) {
      return;
    }
    const disabled = this.turns.length === 0;
    this.clearButtonEl.disabled = disabled;
    this.clearButtonEl.toggleClass("brain-button-hidden", disabled);
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
    (0, import_obsidian6.setIcon)(roleIcon, this.turnIconFor(turn.role));
    roleEl.createEl("span", { text: this.turnLabelFor(turn.role) });
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
  turnLabelFor(role) {
    switch (role) {
      case "user":
        return "You";
      case "brain":
        return "Brain";
      case "error":
        return "Error";
      case "info":
        return "Brain";
      default:
        return "Brain";
    }
  }
  turnIconFor(role) {
    switch (role) {
      case "user":
        return "user";
      case "brain":
        return "brain-circuit";
      case "error":
        return "alert-triangle";
      case "info":
        return "info";
      default:
        return "brain-circuit";
    }
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
      (0, import_obsidian6.setIcon)(roleIcon, this.turnIconFor(turn.role));
      roleEl.createEl("span", { text: this.turnLabelFor(turn.role) });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbm9kZS1ydW50aW1lLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3V0aWxzL2NvZGV4LW1vZGVscy50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXF1ZXJ5LXNlcnZpY2UudHMiLCAic3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgtc2FmZXR5LnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCUkFJTl9WSUVXX1RZUEUsIEJyYWluU2lkZWJhclZpZXcgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBpbnN0cnVjdGlvblNlcnZpY2UhOiBJbnN0cnVjdGlvblNlcnZpY2U7XG4gIHZhdWx0UXVlcnlTZXJ2aWNlITogVmF1bHRRdWVyeVNlcnZpY2U7XG4gIHZhdWx0V3JpdGVTZXJ2aWNlITogVmF1bHRXcml0ZVNlcnZpY2U7XG4gIHZhdWx0Q2hhdFNlcnZpY2UhOiBWYXVsdENoYXRTZXJ2aWNlO1xuICBwcml2YXRlIHNpZGViYXJWaWV3OiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnZhdWx0U2VydmljZSA9IG5ldyBWYXVsdFNlcnZpY2UodGhpcy5hcHApO1xuICAgIHRoaXMuYWlTZXJ2aWNlID0gbmV3IEJyYWluQUlTZXJ2aWNlKCk7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBCcmFpbkF1dGhTZXJ2aWNlKHRoaXMpO1xuICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlID0gbmV3IEluc3RydWN0aW9uU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UgPSBuZXcgVmF1bHRRdWVyeVNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlID0gbmV3IFZhdWx0V3JpdGVTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdENoYXRTZXJ2aWNlID0gbmV3IFZhdWx0Q2hhdFNlcnZpY2UoXG4gICAgICB0aGlzLmFpU2VydmljZSxcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFF1ZXJ5U2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KEJSQUlOX1ZJRVdfVFlQRSwgKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgQnJhaW5TaWRlYmFyVmlldyhsZWFmLCB0aGlzKTtcbiAgICAgIHRoaXMuc2lkZWJhclZpZXcgPSB2aWV3O1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG5cbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCcmFpblNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZS5lbnN1cmVJbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgaW5pdGlhbGl6ZSBCcmFpbiBzdG9yYWdlXCIpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuc2lkZWJhclZpZXcgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBsb2FkZWQgPSAoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSA/PyB7fTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKGxvYWRlZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgbG9hZCBCcmFpbiBzZXR0aW5nc1wiKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBub3JtYWxpemVCcmFpblNldHRpbmdzKHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3ModGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2U/LmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBpbml0aWFsaXplIEJyYWluIHN0b3JhZ2VcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaFNpZGViYXJTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJVbmFibGUgdG8gb3BlbiB0aGUgc2lkZWJhclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogQlJBSU5fVklFV19UWVBFLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgb3Blbkluc3RydWN0aW9uc0ZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGhpcy5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBuZXcgTm90aWNlKGBDb3VsZCBub3Qgb3BlbiAke3RoaXMuc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZX1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBjaGF0V2l0aFZhdWx0KG1lc3NhZ2U6IHN0cmluZywgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10gPSBbXSwgc2lnbmFsPzogQWJvcnRTaWduYWwsIG9uU3RhZ2U/OiAoc3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIikgPT4gdm9pZCk6IFByb21pc2U8VmF1bHRDaGF0UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy52YXVsdENoYXRTZXJ2aWNlLnJlc3BvbmQobWVzc2FnZSwgaGlzdG9yeSwgc2lnbmFsLCBvblN0YWdlKTtcbiAgfVxuXG4gIGFzeW5jIGFwcGx5VmF1bHRXcml0ZVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcGF0aHMgPSBhd2FpdCB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlLmFwcGx5UGxhbihwbGFuKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpO1xuICAgIHJldHVybiBwYXRocztcbiAgfVxuXG4gIGdldE9wZW5TaWRlYmFyVmlldygpOiBCcmFpblNpZGViYXJWaWV3IHwgbnVsbCB7XG4gICAgY29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShCUkFJTl9WSUVXX1RZUEUpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBsZWF2ZXMpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEJyYWluU2lkZWJhclZpZXcpIHtcbiAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5nZXRPcGVuU2lkZWJhclZpZXcoKT8ucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFNpZGViYXJTdGF0dXNCZXN0RWZmb3J0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hTaWRlYmFyU3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgcmVmcmVzaCBzaWRlYmFyIHN0YXR1c1wiKTtcbiAgICB9XG4gIH1cblxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgQnJhaW5QbHVnaW5TZXR0aW5ncyB7XG4gIG5vdGVzRm9sZGVyOiBzdHJpbmc7XG4gIGluc3RydWN0aW9uc0ZpbGU6IHN0cmluZztcbiAgY29kZXhNb2RlbDogc3RyaW5nO1xuICBleGNsdWRlRm9sZGVyczogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CUkFJTl9TRVRUSU5HUzogQnJhaW5QbHVnaW5TZXR0aW5ncyA9IHtcbiAgbm90ZXNGb2xkZXI6IFwiTm90ZXNcIixcbiAgaW5zdHJ1Y3Rpb25zRmlsZTogXCJCcmFpbi9BR0VOVFMubWRcIixcbiAgY29kZXhNb2RlbDogXCJcIixcbiAgZXhjbHVkZUZvbGRlcnM6IFwiLm9ic2lkaWFuXFxubm9kZV9tb2R1bGVzXCIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyhcbiAgaW5wdXQ6IFBhcnRpYWw8QnJhaW5QbHVnaW5TZXR0aW5ncz4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBjb25zdCBtZXJnZWQ6IEJyYWluUGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgLi4uREVGQVVMVF9CUkFJTl9TRVRUSU5HUyxcbiAgICAuLi5pbnB1dCxcbiAgfSBhcyBCcmFpblBsdWdpblNldHRpbmdzO1xuXG4gIHJldHVybiB7XG4gICAgbm90ZXNGb2xkZXI6IG5vcm1hbGl6ZVJlbGF0aXZlUGF0aChcbiAgICAgIG1lcmdlZC5ub3Rlc0ZvbGRlcixcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1Mubm90ZXNGb2xkZXIsXG4gICAgKSxcbiAgICBpbnN0cnVjdGlvbnNGaWxlOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgIERFRkFVTFRfQlJBSU5fU0VUVElOR1MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICApLFxuICAgIGNvZGV4TW9kZWw6IHR5cGVvZiBtZXJnZWQuY29kZXhNb2RlbCA9PT0gXCJzdHJpbmdcIiA/IG1lcmdlZC5jb2RleE1vZGVsLnRyaW0oKSA6IFwiXCIsXG4gICAgZXhjbHVkZUZvbGRlcnM6IG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKG1lcmdlZC5leGNsdWRlRm9sZGVycyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmV4Y2x1ZGVGb2xkZXJzO1xuICB9XG4gIHJldHVybiB2YWx1ZVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUV4Y2x1ZGVGb2xkZXJzKGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBleGNsdWRlRm9sZGVyc1xuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHtcbiAgQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4gIENvZGV4TW9kZWxPcHRpb24sXG4gIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlLFxuICBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucyxcbiAgaXNLbm93bkNvZGV4TW9kZWwsXG59IGZyb20gXCIuLi91dGlscy9jb2RleC1tb2RlbHNcIjtcblxuY29uc3QgTU9ERUxfU0VDVElPTl9DTEFTUyA9IFwiYnJhaW4tc2V0dGluZ3MtbW9kZWwtc2VjdGlvblwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogQnJhaW5QbHVnaW47XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zOiBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIHByaXZhdGUgbW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRlZCA9IGZhbHNlO1xuICBwcml2YXRlIGN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb2RlbFNlY3Rpb25FbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzdGF0dXNTZXR0aW5nOiBTZXR0aW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQnJhaW5QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5hZGRDbGFzcyhcImJyYWluLXNldHRpbmdzXCIpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluIFNldHRpbmdzXCIgfSk7XG5cbiAgICB0aGlzLnJlbmRlclN0b3JhZ2VTZWN0aW9uKGNvbnRhaW5lckVsKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkNvZGV4IENMSVwiIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJDb2RleFNldHVwU2VjdGlvbihjb250YWluZXJFbCk7XG4gICAgdGhpcy5yZW5kZXJTdGF0dXNTZWN0aW9uKGNvbnRhaW5lckVsKTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VjdGlvbihjb250YWluZXJFbCk7XG5cbiAgICBpZiAoIXRoaXMubW9kZWxPcHRpb25zTG9hZGluZyAmJiAhdGhpcy5tb2RlbE9wdGlvbnNMb2FkZWQpIHtcbiAgICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXBkYXRlTW9kZWxDb250cm9sc1N0YXRlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTdG9yYWdlU2VjdGlvbihjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdG9yYWdlXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTm90ZXMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkRlZmF1bHQgZm9sZGVyIGZvciBuZXcgbWFya2Rvd24gbm90ZXMgY3JlYXRlZCBmcm9tIGFwcHJvdmVkIHdyaXRlIHBsYW5zLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIsXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiTm90ZXMgZm9sZGVyIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5zdHJ1Y3Rpb25zIGZpbGVcIilcbiAgICAgIC5zZXREZXNjKFwiTWFya2Rvd24gZmlsZSB0aGF0IHRlbGxzIEJyYWluIGhvdyB0byBvcGVyYXRlIGluIHRoaXMgdmF1bHQuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGhpcy5iaW5kVGV4dFNldHRpbmcoXG4gICAgICAgICAgdGV4dCxcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSA9IHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiSW5zdHJ1Y3Rpb25zIGZpbGUgY2Fubm90IGJlIGVtcHR5XCIpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFeGNsdWRlZCBmb2xkZXJzXCIpXG4gICAgICAuc2V0RGVzYyhcIk9uZSBmb2xkZXIgcGF0aCBwZXIgbGluZS4gQnJhaW4gd2lsbCBza2lwIG1hcmtkb3duIGZpbGVzIGluc2lkZSB0aGVzZSBmb2xkZXJzIHdoZW4gc2VhcmNoaW5nIHRoZSB2YXVsdC5cIilcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmV4Y2x1ZGVGb2xkZXJzKS5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5leGNsdWRlRm9sZGVycyA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTdGF0dXNTZWN0aW9uKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHVzU2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBzdGF0dXNcIilcbiAgICAgIC5zZXREZXNjKFwiQ2hlY2tpbmcgQ29kZXggQ0xJIHN0YXR1cy4uLlwiKTtcbiAgICB2b2lkIHRoaXMucmVmcmVzaENvZGV4U3RhdHVzKHRoaXMuc3RhdHVzU2V0dGluZyk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckNvZGV4U2V0dXBTZWN0aW9uKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBzZXR1cFwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQnJhaW4gdXNlcyBvbmx5IHRoZSBsb2NhbCBDb2RleCBDTEkuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiByZWNoZWNrIHN0YXR1cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJPcGVuIENvZGV4IFNldHVwXCIpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXV0aFNlcnZpY2UubG9naW4oKTtcbiAgICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJSZWNoZWNrIFN0YXR1c1wiKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzU2V0dGluZz8uc2V0RGVzYyhcIlJlY2hlY2tpbmcgQ29kZXggQ0xJIHN0YXR1cy4uLlwiKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaENvZGV4U3RhdHVzKHRoaXMuc3RhdHVzU2V0dGluZywgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1vZGVsQ29udHJvbHNTdGF0ZSgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTW9kZWxTZWN0aW9uKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IE1PREVMX1NFQ1RJT05fQ0xBU1MgfSk7XG4gICAgdGhpcy5tb2RlbFNlY3Rpb25FbCA9IHdyYXBwZXI7XG4gICAgbmV3IFNldHRpbmcod3JhcHBlcilcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggbW9kZWxcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmdcbiAgICAgICAgICA/IFwiTG9hZGluZyBtb2RlbHMgZnJvbSB0aGUgaW5zdGFsbGVkIENvZGV4IENMSS4uLlwiXG4gICAgICAgICAgOiBcIk9wdGlvbmFsLiBTZWxlY3QgYSBtb2RlbCByZXBvcnRlZCBieSBDb2RleCBDTEksIG9yIGxlYXZlIGJsYW5rIHRvIHVzZSB0aGUgYWNjb3VudCBkZWZhdWx0LlwiLFxuICAgICAgKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm1vZGVsT3B0aW9ucykge1xuICAgICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihvcHRpb24udmFsdWUsIG9wdGlvbi5sYWJlbCk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSwgXCJDdXN0b20uLi5cIilcbiAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnRcbiAgICAgICAgICAgICAgPyBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICAgICAgICAgICAgOiBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucyksXG4gICAgICAgICAgKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFKSB7XG4gICAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsU2VjdGlvbigpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxTZWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0Zyb21TZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlJlbG9hZFwiKTtcbiAgICAgICAgYnV0dG9uLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHxcbiAgICAgIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKSA9PT0gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgKSB7XG4gICAgICBsZXQgZHJhZnRWYWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fCBpc0tub3duQ29kZXhNb2RlbCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLCB0aGlzLm1vZGVsT3B0aW9ucylcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbDtcbiAgICAgIGlmICh0aGlzLmN1c3RvbU1vZGVsRHJhZnQgJiYgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgICAgbmV3IFNldHRpbmcod3JhcHBlcilcbiAgICAgICAgICAuc2V0TmFtZShcIkFjdGl2ZSBDb2RleCBtb2RlbFwiKVxuICAgICAgICAgIC5zZXREZXNjKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKTtcbiAgICAgIH1cbiAgICAgIG5ldyBTZXR0aW5nKHdyYXBwZXIpXG4gICAgICAgIC5zZXROYW1lKFwiQ3VzdG9tIENvZGV4IG1vZGVsXCIpXG4gICAgICAgIC5zZXREZXNjKFwiRXhhY3QgbW9kZWwgaWQgcGFzc2VkIHRvIGBjb2RleCBleGVjIC0tbW9kZWxgLlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHRcbiAgICAgICAgICAgIC5zZXRWYWx1ZShkcmFmdFZhbHVlKVxuICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICBkcmFmdFZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdm9pZCB0aGlzLnNhdmVDdXN0b21Nb2RlbERyYWZ0KGRyYWZ0VmFsdWUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICB0ZXh0LmlucHV0RWwuYmx1cigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZU1vZGVsQ29udHJvbHNTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVNb2RlbENvbnRyb2xzU3RhdGUoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLm1vZGVsU2VjdGlvbkVsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRpc2FibGVkID0gdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nO1xuICAgIHRoaXMubW9kZWxTZWN0aW9uRWxcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxTZWxlY3RFbGVtZW50IHwgSFRNTEJ1dHRvbkVsZW1lbnQ+KFwic2VsZWN0LCBidXR0b25cIilcbiAgICAgIC5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICBlbC5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnJlZnJlc2hNb2RlbFNlY3Rpb24oKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnMgPSBhd2FpdCBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCA9IHRydWU7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmcmVzaE1vZGVsU2VjdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaE1vZGVsU2VjdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMubW9kZWxTZWN0aW9uRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5tb2RlbFNlY3Rpb25FbC5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHdhc0ZvY3VzZWQgPSB0aGlzLm1vZGVsU2VjdGlvbkVsLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMubW9kZWxTZWN0aW9uRWwucmVtb3ZlKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlY3Rpb24ocGFyZW50KTtcbiAgICBpZiAod2FzRm9jdXNlZCAmJiB0aGlzLm1vZGVsU2VjdGlvbkVsKSB7XG4gICAgICBjb25zdCBmb2N1c2FibGUgPSB0aGlzLm1vZGVsU2VjdGlvbkVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICBcImlucHV0Om5vdChbdHlwZT0naGlkZGVuJ10pOm5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKVwiLFxuICAgICAgKTtcbiAgICAgIGZvY3VzYWJsZT8uZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbERyYWZ0KHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2RlbCA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1vZGVsKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmcmVzaE1vZGVsU2VjdGlvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gbW9kZWw7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZWZyZXNoTW9kZWxTZWN0aW9uKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0dXNGcm9tU2V0dGluZ3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHVzRnJvbVNldHRpbmdzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXR1c1NldHRpbmcpIHtcbiAgICAgIHZvaWQgdGhpcy5yZWZyZXNoQ29kZXhTdGF0dXModGhpcy5zdGF0dXNTZXR0aW5nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hDb2RleFN0YXR1cyhzZXR0aW5nOiBTZXR0aW5nIHwgbnVsbCwgZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghc2V0dGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZm9yY2UpIHtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhcIlJlY2hlY2tpbmcgQ29kZXggQ0xJIHN0YXR1cy4uLlwiKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICBzZXR0aW5nLnNldERlc2Moc3RhdHVzLm1lc3NhZ2UpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhcIkNvdWxkIG5vdCBjaGVjayBDb2RleCBDTEkgc3RhdHVzLlwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGxhc3RWYWxpZFZhbHVlID0gdmFsdWU7XG5cbiAgICB0ZXh0LnNldFZhbHVlKHZhbHVlKS5vbkNoYW5nZSgobmV4dFZhbHVlKSA9PiB7XG4gICAgICBpZiAoIXZhbGlkYXRlIHx8IHZhbGlkYXRlKG5leHRWYWx1ZSkpIHtcbiAgICAgICAgb25WYWx1ZUNoYW5nZShuZXh0VmFsdWUpO1xuICAgICAgICBsYXN0VmFsaWRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSB0ZXh0LmlucHV0RWwudmFsdWU7XG4gICAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShsYXN0VmFsaWRWYWx1ZSk7XG4gICAgICAgIG9uVmFsdWVDaGFuZ2UobGFzdFZhbGlkVmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIH0pO1xuXG4gICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxufVxuIiwgIi8qKlxuICogU2hhcmVkIE5vZGUuanMgcnVudGltZSBoZWxwZXJzLlxuICpcbiAqIFRoZXNlIHVzZSBkeW5hbWljIGByZXF1aXJlKClgIHZpYSBgRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpYCB0b1xuICogYnlwYXNzIGVzYnVpbGQgYnVuZGxpbmcgb2YgTm9kZSBidWlsdC1pbnMuIE9ic2lkaWFuIHBsdWdpbnMgcnVuIGluIGFuXG4gKiBFbGVjdHJvbi9Ob2RlIGNvbnRleHQgd2hlcmUgYHJlcXVpcmVgIGlzIGF2YWlsYWJsZSBhdCBydW50aW1lIGJ1dCBjYW5ub3RcbiAqIGJlIHN0YXRpY2FsbHkgYnVuZGxlZC5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENoaWxkUHJvY2VzcywgRXhlY0ZpbGVFeGNlcHRpb24sIEV4ZWNGaWxlT3B0aW9ucyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgdHlwZSB7IFBhdGhMaWtlIH0gZnJvbSBcImZzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlUmVxdWlyZSgpOiBOb2RlUmVxdWlyZSB7XG4gIHJldHVybiBGdW5jdGlvbihcInJldHVybiByZXF1aXJlXCIpKCkgYXMgTm9kZVJlcXVpcmU7XG59XG5cbnR5cGUgRXhlY0ZpbGVGbiA9IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBFeGVjRmlsZU9wdGlvbnMsXG4gIGNhbGxiYWNrPzogKFxuICAgIGVycm9yOiBFeGVjRmlsZUV4Y2VwdGlvbiB8IG51bGwsXG4gICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgc3RkZXJyOiBzdHJpbmcgfCBCdWZmZXIsXG4gICkgPT4gdm9pZCxcbikgPT4gQ2hpbGRQcm9jZXNzO1xuXG50eXBlIEV4ZWNGaWxlQXN5bmNGbiA9IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBFeGVjRmlsZU9wdGlvbnMsXG4pID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG5cbmZ1bmN0aW9uIGdldENoaWxkUHJvY2VzcygpOiB7IGV4ZWNGaWxlOiBFeGVjRmlsZUZuIH0ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICByZXR1cm4gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB7IGV4ZWNGaWxlOiBFeGVjRmlsZUZuIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RleFJ1bnRpbWUoKToge1xuICBleGVjRmlsZTogRXhlY0ZpbGVGbjtcbiAgZnM6IHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKTtcbiAgb3M6IHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcbiAgcGF0aDogdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG59IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZTogZ2V0Q2hpbGRQcm9jZXNzKCkuZXhlY0ZpbGUsXG4gICAgZnM6IHJlcShcImZzL3Byb21pc2VzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKSxcbiAgICBvczogcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpLFxuICAgIHBhdGg6IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIiksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeGVjRmlsZUFzeW5jKCk6IEV4ZWNGaWxlQXN5bmNGbiB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuICByZXR1cm4gcHJvbWlzaWZ5KGdldENoaWxkUHJvY2VzcygpLmV4ZWNGaWxlKSBhcyB1bmtub3duIGFzIEV4ZWNGaWxlQXN5bmNGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW5vZW50RXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBOb2RlSlMuRXJybm9FeGNlcHRpb24ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmIGVycm9yICE9PSBudWxsICYmIFwiY29kZVwiIGluIGVycm9yICYmIGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RpbWVvdXRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJraWxsZWRcIiBpbiBlcnJvciAmJiBlcnJvci5raWxsZWQgPT09IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Fib3J0RXJyb3IoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgXCJuYW1lXCIgaW4gZXJyb3IgJiZcbiAgICBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBSZWZlcmVuY2VFcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIFR5cGVFcnJvcjtcbn1cbiIsICJpbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jLCBnZXROb2RlUmVxdWlyZSwgaXNFbm9lbnRFcnJvciwgaXNOb2RlUnVudGltZVVuYXZhaWxhYmxlLCBpc1RpbWVvdXRFcnJvciB9IGZyb20gXCIuL25vZGUtcnVudGltZVwiO1xuXG5leHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5jb25zdCBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyA9IDUwMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvZGV4TG9naW5TdGF0dXMob3V0cHV0OiBzdHJpbmcpOiBDb2RleExvZ2luU3RhdHVzIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG91dHB1dC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJub3QgbG9nZ2VkIGluXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgb3V0XCIpKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLW91dFwiO1xuICB9XG5cbiAgaWYgKFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJsb2dnZWQgaW5cIikgfHxcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwic2lnbmVkIGluXCIpIHx8XG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcImF1dGhlbnRpY2F0ZWRcIilcbiAgKSB7XG4gICAgcmV0dXJuIFwibG9nZ2VkLWluXCI7XG4gIH1cblxuICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2RleExvZ2luU3RhdHVzKCk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgcmV0dXJuIFwidW5hdmFpbGFibGVcIjtcbiAgICB9XG5cbiAgICBjb25zdCBleGVjRmlsZUFzeW5jID0gZ2V0RXhlY0ZpbGVBc3luYygpO1xuICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNGaWxlQXN5bmMoY29kZXhCaW5hcnksIFtcImxvZ2luXCIsIFwic3RhdHVzXCJdLCB7XG4gICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0LFxuICAgICAgdGltZW91dDogQ09ERVhfTE9HSU5fU1RBVFVTX1RJTUVPVVRfTVMsXG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpIHx8IGlzVGltZW91dEVycm9yKGVycm9yKSB8fCBpc05vZGVSdW50aW1lVW5hdmFpbGFibGUoZXJyb3IpKSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4QmluYXJ5UGF0aCgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgbGV0IHJlcTogTm9kZVJlcXVpcmU7XG4gIHRyeSB7XG4gICAgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmcyA9IHJlcShcImZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmc1wiKTtcbiAgY29uc3QgcGF0aCA9IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG4gIGNvbnN0IG9zID0gcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoLCBvcy5ob21lZGlyKCkpO1xuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgc2VhcmNoaW5nLlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBidWlsZENvZGV4Q2FuZGlkYXRlcyhwYXRoTW9kdWxlOiB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKSwgaG9tZURpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCBjYW5kaWRhdGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdGhFbnRyaWVzID0gKHByb2Nlc3MuZW52LlBBVEggPz8gXCJcIikuc3BsaXQocGF0aE1vZHVsZS5kZWxpbWl0ZXIpLmZpbHRlcihCb29sZWFuKTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhdGhFbnRyaWVzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGVudHJ5LCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1vbkRpcnM6IHN0cmluZ1tdID0gW1xuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgYCR7aG9tZURpcn0vLmxvY2FsL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmJ1bi9iaW5gLFxuICAgIGAke2hvbWVEaXJ9Ly5jb2RlaXVtL3dpbmRzdXJmL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmFudGlncmF2aXR5L2FudGlncmF2aXR5L2JpbmAsXG4gICAgXCIvQXBwbGljYXRpb25zL0NvZGV4LmFwcC9Db250ZW50cy9SZXNvdXJjZXNcIixcbiAgXTtcblxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52LkFQUERBVEEpIHtcbiAgICAgIGNvbW1vbkRpcnMucHVzaChwYXRoTW9kdWxlLmpvaW4ocHJvY2Vzcy5lbnYuQVBQREFUQSwgXCJucG1cIikpO1xuICAgIH1cbiAgICBpZiAocHJvY2Vzcy5lbnYuTE9DQUxBUFBEQVRBKSB7XG4gICAgICBjb21tb25EaXJzLnB1c2gocGF0aE1vZHVsZS5qb2luKHByb2Nlc3MuZW52LkxPQ0FMQVBQREFUQSwgXCJQcm9ncmFtc1wiLCBcIkNvZGV4XCIpKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IGRpciBvZiBjb21tb25EaXJzKSB7XG4gICAgY2FuZGlkYXRlcy5hZGQocGF0aE1vZHVsZS5qb2luKGRpciwgY29kZXhFeGVjdXRhYmxlTmFtZSgpKSk7XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShjYW5kaWRhdGVzKTtcbn1cblxuZnVuY3Rpb24gY29kZXhFeGVjdXRhYmxlTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJjb2RleC5jbWRcIiA6IFwiY29kZXhcIjtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlDb25maWd1cmF0aW9uU3RhdHVzIHtcbiAgY29uZmlndXJlZDogYm9vbGVhbjtcbiAgcHJvdmlkZXI6IFwiY29kZXhcIjtcbiAgbW9kZWw6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyhcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBjb25zdCBjb2RleFN0YXR1cyA9IGF3YWl0IGdldENvZGV4TG9naW5TdGF0dXMoKTtcbiAgaWYgKGNvZGV4U3RhdHVzID09PSBcInVuYXZhaWxhYmxlXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgaW5zdGFsbGVkLlwiLFxuICAgIH07XG4gIH1cblxuICBpZiAoY29kZXhTdGF0dXMgIT09IFwibG9nZ2VkLWluXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZmlndXJlZDogZmFsc2UsXG4gICAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgICAgbW9kZWw6IG51bGwsXG4gICAgICBtZXNzYWdlOiBcIkNvZGV4IENMSSBub3QgbG9nZ2VkIGluLlwiLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBtb2RlbCA9IHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpIHx8IG51bGw7XG4gIHJldHVybiB7XG4gICAgY29uZmlndXJlZDogdHJ1ZSxcbiAgICBwcm92aWRlcjogXCJjb2RleFwiLFxuICAgIG1vZGVsLFxuICAgIG1lc3NhZ2U6IG1vZGVsXG4gICAgICA/IGBSZWFkeSB0byB1c2UgQ29kZXggd2l0aCBtb2RlbCAke21vZGVsfS5gXG4gICAgICA6IFwiUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggdGhlIGFjY291bnQgZGVmYXVsdCBtb2RlbC5cIixcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi9jb2RleC1hdXRoXCI7XG5pbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jIH0gZnJvbSBcIi4vbm9kZS1ydW50aW1lXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZXhNb2RlbE9wdGlvbiB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM6IENvZGV4TW9kZWxPcHRpb25bXSA9IFtcbiAgeyB2YWx1ZTogXCJcIiwgbGFiZWw6IFwiQWNjb3VudCBkZWZhdWx0XCIgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUgPSBcIl9fY3VzdG9tX19cIjtcbmNvbnN0IENPREVYX01PREVMX0NBVEFMT0dfVElNRU9VVF9NUyA9IDgwMDA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPENvZGV4TW9kZWxPcHRpb25bXT4ge1xuICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhlY0ZpbGVBc3luYyA9IGdldEV4ZWNGaWxlQXN5bmMoKTtcbiAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjRmlsZUFzeW5jKGNvZGV4QmluYXJ5LCBbXCJkZWJ1Z1wiLCBcIm1vZGVsc1wiXSwge1xuICAgICAgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCAqIDIwLFxuICAgICAgdGltZW91dDogQ09ERVhfTU9ERUxfQ0FUQUxPR19USU1FT1VUX01TLFxuICAgIH0pO1xuICAgIHJldHVybiBwYXJzZUNvZGV4TW9kZWxDYXRhbG9nKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2RleE1vZGVsQ2F0YWxvZyhvdXRwdXQ6IHN0cmluZyk6IENvZGV4TW9kZWxPcHRpb25bXSB7XG4gIGNvbnN0IGpzb25UZXh0ID0gZXh0cmFjdEpzb25PYmplY3Qob3V0cHV0KTtcbiAgaWYgKCFqc29uVGV4dCkge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblRleHQpIGFzIHtcbiAgICAgIG1vZGVscz86IEFycmF5PHtcbiAgICAgICAgc2x1Zz86IHVua25vd247XG4gICAgICAgIGRpc3BsYXlfbmFtZT86IHVua25vd247XG4gICAgICAgIHZpc2liaWxpdHk/OiB1bmtub3duO1xuICAgICAgfT47XG4gICAgfTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IFsuLi5ERUZBVUxUX0NPREVYX01PREVMX09QVElPTlNdO1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgcGFyc2VkLm1vZGVscyA/PyBbXSkge1xuICAgICAgY29uc3Qgc2x1ZyA9IHR5cGVvZiBtb2RlbC5zbHVnID09PSBcInN0cmluZ1wiID8gbW9kZWwuc2x1Zy50cmltKCkgOiBcIlwiO1xuICAgICAgaWYgKCFzbHVnIHx8IHNlZW4uaGFzKHNsdWcpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKG1vZGVsLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBtb2RlbC52aXNpYmlsaXR5ICE9PSBcImxpc3RcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHNlZW4uYWRkKHNsdWcpO1xuICAgICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgdmFsdWU6IHNsdWcsXG4gICAgICAgIGxhYmVsOiB0eXBlb2YgbW9kZWwuZGlzcGxheV9uYW1lID09PSBcInN0cmluZ1wiICYmIG1vZGVsLmRpc3BsYXlfbmFtZS50cmltKClcbiAgICAgICAgICA/IG1vZGVsLmRpc3BsYXlfbmFtZS50cmltKClcbiAgICAgICAgICA6IHNsdWcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKFxuICBtb2RlbDogc3RyaW5nLFxuICBvcHRpb25zOiByZWFkb25seSBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4pOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbW9kZWwudHJpbSgpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICByZXR1cm4gb3B0aW9ucy5zb21lKChvcHRpb24pID0+IG9wdGlvbi52YWx1ZSA9PT0gbm9ybWFsaXplZClcbiAgICA/IG5vcm1hbGl6ZWRcbiAgICA6IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzS25vd25Db2RleE1vZGVsKFxuICBtb2RlbDogc3RyaW5nLFxuICBvcHRpb25zOiByZWFkb25seSBDb2RleE1vZGVsT3B0aW9uW10gPSBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlMsXG4pOiBib29sZWFuIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG1vZGVsLnRyaW0oKTtcbiAgcmV0dXJuIG9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT09IG5vcm1hbGl6ZWQpO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SnNvbk9iamVjdChvdXRwdXQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzdGFydCA9IG91dHB1dC5pbmRleE9mKFwie1wiKTtcbiAgY29uc3QgZW5kID0gb3V0cHV0Lmxhc3RJbmRleE9mKFwifVwiKTtcbiAgaWYgKHN0YXJ0ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8IGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBvdXRwdXQuc2xpY2Uoc3RhcnQsIGVuZCArIDEpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldENvZGV4QmluYXJ5UGF0aCB9IGZyb20gXCIuLi91dGlscy9jb2RleC1hdXRoXCI7XG5pbXBvcnQgeyBnZXRDb2RleFJ1bnRpbWUsIGlzQWJvcnRFcnJvciwgaXNFbm9lbnRFcnJvciwgaXNUaW1lb3V0RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvbm9kZS1ydW50aW1lXCI7XG5cbmNvbnN0IENPREVYX0NIQVRfVElNRU9VVF9NUyA9IDEyMDAwMDtcblxuaW50ZXJmYWNlIEV4ZWNSZXN1bHQge1xuICBzdGRvdXQ6IHN0cmluZztcbiAgc3RkZXJyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBCcmFpbkFJU2VydmljZSB7XG4gIGFzeW5jIGNvbXBsZXRlQ2hhdChcbiAgICBtZXNzYWdlczogQXJyYXk8eyByb2xlOiBcInN5c3RlbVwiIHwgXCJ1c2VyXCI7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBzdHJpbmcgfCBudWxsLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBvc3RDb2RleENvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzLCB3b3JraW5nRGlyZWN0b3J5LCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q29kZXhDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHN0cmluZyB8IG51bGwsXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBleGVjRmlsZSwgZnMsIG9zLCBwYXRoIH0gPSBnZXRDb2RleFJ1bnRpbWUoKTtcblxuICAgIGNvbnN0IGNvZGV4QmluYXJ5ID0gYXdhaXQgZ2V0Q29kZXhCaW5hcnlQYXRoKCk7XG4gICAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGVtcERpciA9IGF3YWl0IGZzLm1rZHRlbXAocGF0aC5qb2luKG9zLnRtcGRpcigpLCBcImJyYWluLWNvZGV4LVwiKSk7XG4gICAgY29uc3Qgb3V0cHV0RmlsZSA9IHBhdGguam9pbih0ZW1wRGlyLCBcInJlc3BvbnNlLnR4dFwiKTtcbiAgICBjb25zdCBhcmdzID0gW1xuICAgICAgXCJleGVjXCIsXG4gICAgICBcIi0tc2tpcC1naXQtcmVwby1jaGVja1wiLFxuICAgICAgXCItLWVwaGVtZXJhbFwiLFxuICAgICAgXCItLWlnbm9yZS1ydWxlc1wiLFxuICAgICAgXCItLXNhbmRib3hcIixcbiAgICAgIFwicmVhZC1vbmx5XCIsXG4gICAgICBcIi0tb3V0cHV0LWxhc3QtbWVzc2FnZVwiLFxuICAgICAgb3V0cHV0RmlsZSxcbiAgICBdO1xuXG4gICAgaWYgKHdvcmtpbmdEaXJlY3RvcnkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tY2RcIiwgd29ya2luZ0RpcmVjdG9yeSk7XG4gICAgfVxuXG4gICAgaWYgKHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKSB7XG4gICAgICBhcmdzLnB1c2goXCItLW1vZGVsXCIsIHNldHRpbmdzLmNvZGV4TW9kZWwudHJpbSgpKTtcbiAgICB9XG5cbiAgICBhcmdzLnB1c2goXCItXCIpO1xuICAgIGNvbnN0IHByb21wdCA9IHRoaXMuYnVpbGRDb2RleFByb21wdChtZXNzYWdlcyk7XG5cbiAgICBsZXQgZXhlY1Jlc3VsdDogRXhlY1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNSZXN1bHQgPSBhd2FpdCBleGVjRmlsZVdpdGhBYm9ydChjb2RleEJpbmFyeSwgYXJncywge1xuICAgICAgICBtYXhCdWZmZXI6IDEwMjQgKiAxMDI0ICogNCxcbiAgICAgICAgY3dkOiB0ZW1wRGlyLFxuICAgICAgICB0aW1lb3V0OiBDT0RFWF9DSEFUX1RJTUVPVVRfTVMsXG4gICAgICAgIHNpZ25hbCxcbiAgICAgICAgc3RkaW46IHByb21wdCxcbiAgICAgIH0sIGV4ZWNGaWxlKTtcblxuICAgICAgbGV0IGNvbnRlbnQ6IHN0cmluZztcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShvdXRwdXRGaWxlLCBcInV0ZjhcIik7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgaWYgKGV4ZWNSZXN1bHQuc3Rkb3V0LnRyaW0oKSkge1xuICAgICAgICAgIGNvbnRlbnQgPSBleGVjUmVzdWx0LnN0ZG91dC50cmltKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXhlY1Jlc3VsdC5zdGRlcnIudHJpbSgpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb2RleCBkaWQgbm90IHByb2R1Y2Ugb3V0cHV0LiBEZXRhaWxzOiAke2V4ZWNSZXN1bHQuc3RkZXJyLnRyaW0oKS5zbGljZSgwLCA1MDApfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IGRpZCBub3QgcHJvZHVjZSBhbnkgb3V0cHV0LiBUaGUgQ0xJIG1heSByZXF1aXJlIGEgbmV3ZXIgdmVyc2lvbiBvciBhIGRpZmZlcmVudCBjb25maWd1cmF0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlLlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb250ZW50LnRyaW0oKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCB8fCBpc0Fib3J0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIik7XG4gICAgICB9XG4gICAgICBpZiAoaXNUaW1lb3V0RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIkNvZGV4IGRpZCBub3QgcmVzcG9uZCBpbiB0aW1lLiBUcnkgYWdhaW4sIG9yIGNoZWNrIGBjb2RleCBsb2dpbiBzdGF0dXNgIG91dHNpZGUgQnJhaW4uIFwiICtcbiAgICAgICAgICBcIklmIENvZGV4IHJlcXVpcmVzIGFwcHJvdmFsIGZvciBzaGVsbCBjb21tYW5kcywgY29uZmlndXJlIGl0IGZvciBub24taW50ZXJhY3RpdmUgdXNlLlwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKGlzRW5vZW50RXJyb3IoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGRlcnJEZXRhaWwgPSBleGVjUmVzdWx0Py5zdGRlcnI/LnRyaW0oKVxuICAgICAgICB8fCBnZXRFcnJvckRldGFpbChlcnJvciwgXCJzdGRlcnJcIilcbiAgICAgICAgfHwgXCJcIjtcbiAgICAgIGlmIChzdGRlcnJEZXRhaWwgJiYgZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZXJyb3IubWVzc2FnZX1cXG5Db2RleCBzdGRlcnI6ICR7c3RkZXJyRGV0YWlsLnNsaWNlKDAsIDUwMCl9YCk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgZnMucm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENvZGV4UHJvbXB0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBtZXNzYWdlIG9mIG1lc3NhZ2VzKSB7XG4gICAgICBpZiAobWVzc2FnZS5yb2xlID09PSBcInN5c3RlbVwiKSB7XG4gICAgICAgIHBhcnRzLnB1c2gobWVzc2FnZS5jb250ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgIHBhcnRzLnB1c2goXCItLS1cIik7XG4gICAgICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgIHBhcnRzLnB1c2gobWVzc2FnZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFydHMuam9pbihcIlxcblwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjRmlsZVdpdGhBYm9ydChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzOiByZWFkb25seSBzdHJpbmdbXSxcbiAgb3B0aW9uczogaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKS5FeGVjRmlsZU9wdGlvbnMgJiB7XG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gICAgc3RkaW4/OiBzdHJpbmc7XG4gIH0sXG4gIGV4ZWNGaWxlOiBSZXR1cm5UeXBlPHR5cGVvZiBnZXRDb2RleFJ1bnRpbWU+W1wiZXhlY0ZpbGVcIl0sXG4pOiBQcm9taXNlPEV4ZWNSZXN1bHQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHsgc2lnbmFsLCBzdGRpbiwgLi4uZXhlY09wdGlvbnMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgY2hpbGQgPSBleGVjRmlsZShmaWxlLCBhcmdzLCBleGVjT3B0aW9ucywgKGVycm9yLCBzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICBzaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgZW5yaWNoZWQgPSBlbnJpY2hFcnJvcihlcnJvciwgc3Rkb3V0LCBzdGRlcnIpO1xuICAgICAgICByZWplY3QoZW5yaWNoZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgc3Rkb3V0OiBidWZmZXJUb1N0cmluZyhzdGRvdXQpLFxuICAgICAgICAgIHN0ZGVycjogYnVmZmVyVG9TdHJpbmcoc3RkZXJyKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHN0ZGluICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoaWxkLnN0ZGluPy5lbmQoc3RkaW4pO1xuICAgIH1cblxuICAgIGNvbnN0IGFib3J0ID0gKCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2hpbGQua2lsbChcIlNJR1RFUk1cIik7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChjaGlsZC5leGl0Q29kZSA9PT0gbnVsbCAmJiBjaGlsZC5zaWduYWxDb2RlID09PSBudWxsKSB7XG4gICAgICAgICAgY2hpbGQua2lsbChcIlNJR0tJTExcIik7XG4gICAgICAgIH1cbiAgICAgIH0sIDE1MDApO1xuICAgIH07XG5cbiAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICBhYm9ydCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ1ZmZlclRvU3RyaW5nKHZhbHVlOiBzdHJpbmcgfCBCdWZmZXIpOiBzdHJpbmcge1xuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSA/IHZhbHVlLnRvU3RyaW5nKFwidXRmOFwiKSA6IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBlbnJpY2hFcnJvcihcbiAgZXJyb3I6IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIikuRXhlY0ZpbGVFeGNlcHRpb24sXG4gIHN0ZG91dDogc3RyaW5nIHwgQnVmZmVyLFxuICBzdGRlcnI6IHN0cmluZyB8IEJ1ZmZlcixcbik6IENvZGV4RXhlY3V0aW9uRXJyb3Ige1xuICBjb25zdCBzdGRvdXRUZXh0ID0gYnVmZmVyVG9TdHJpbmcoc3Rkb3V0KTtcbiAgY29uc3Qgc3RkZXJyVGV4dCA9IGJ1ZmZlclRvU3RyaW5nKHN0ZGVycik7XG4gIGNvbnN0IHdyYXBwZWQgPSBuZXcgQ29kZXhFeGVjdXRpb25FcnJvcihlcnJvci5tZXNzYWdlLCBlcnJvcik7XG4gIHdyYXBwZWQuc3Rkb3V0ID0gc3Rkb3V0VGV4dDtcbiAgd3JhcHBlZC5zdGRlcnIgPSBzdGRlcnJUZXh0O1xuICBpZiAoZXJyb3IuY29kZSAhPT0gbnVsbCkge1xuICAgIHdyYXBwZWQuY29kZSA9IGVycm9yLmNvZGU7XG4gIH1cbiAgd3JhcHBlZC5raWxsZWQgPSBlcnJvci5raWxsZWQgPz8gZmFsc2U7XG4gIHJldHVybiB3cmFwcGVkO1xufVxuXG5jbGFzcyBDb2RleEV4ZWN1dGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGRvdXQgPSBcIlwiO1xuICBzdGRlcnIgPSBcIlwiO1xuICBjb2RlOiBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGtpbGxlZCA9IGZhbHNlO1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGNhdXNlPzogdW5rbm93bikge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9IFwiQ29kZXhFeGVjdXRpb25FcnJvclwiO1xuICAgICh0aGlzIGFzIEVycm9yICYgeyBjYXVzZT86IHVua25vd24gfSkuY2F1c2UgPSBjYXVzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRFcnJvckRldGFpbChlcnJvcjogdW5rbm93biwga2V5OiBcInN0ZG91dFwiIHwgXCJzdGRlcnJcIik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgZXJyb3IgIT09IFwib2JqZWN0XCIgfHwgZXJyb3IgPT09IG51bGwgfHwgIShrZXkgaW4gZXJyb3IpKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgY29uc3QgdmFsdWUgPSAoZXJyb3IgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV07XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gdmFsdWUudHJpbSgpO1xuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKFwidXRmOFwiKS50cmltKCk7XG4gIH1cbiAgcmV0dXJuIFwiXCI7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IENvZGV4TG9naW5TdGF0dXMsIGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5BdXRoU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBCcmFpblBsdWdpbikge31cblxuICBhc3luYyBsb2dpbigpIHtcbiAgICBuZXcgTm90aWNlKFwiSW5zdGFsbCB0aGUgQ29kZXggQ0xJLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiByZXR1cm4gdG8gQnJhaW4gYW5kIHJlY2hlY2sgQ29kZXggc3RhdHVzLlwiKTtcbiAgICB3aW5kb3cub3BlbihcImh0dHBzOi8vb3BlbmFpLmNvbS9jb2RleC9nZXQtc3RhcnRlZC9cIik7XG4gIH1cblxuICBhc3luYyBnZXRDb2RleFN0YXR1cygpOiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHtcbiAgICByZXR1cm4gZ2V0Q29kZXhMb2dpblN0YXR1cygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5jb25zdCBERUZBVUxUX0lOU1RSVUNUSU9OUyA9IFtcbiAgXCIjIEJyYWluIEluc3RydWN0aW9uc1wiLFxuICBcIlwiLFxuICBcIllvdSBhcmUgaGVscGluZyBmaWxlIGluZm9ybWF0aW9uIGludG8gdGhpcyBPYnNpZGlhbiB2YXVsdCBhbmQgcmV0cmlldmUgaW5mb3JtYXRpb24gZnJvbSBpdC5cIixcbiAgXCJcIixcbiAgXCIjIyBPcGVyYXRpbmcgUnVsZXNcIixcbiAgXCItIEtlZXAgYWxsIHBlcnNpc3RlZCBjb250ZW50IGFzIG5vcm1hbCBtYXJrZG93bi5cIixcbiAgXCItIFVzZSBvbmx5IGV4cGxpY2l0IHZhdWx0IGNvbnRleHQgd2hlbiBhbnN3ZXJpbmcgcmV0cmlldmFsIHF1ZXN0aW9ucy5cIixcbiAgXCItIFByZWZlciB1cGRhdGluZyBvciBhcHBlbmRpbmcgdG8gZXhpc3Rpbmcgbm90ZXMgb3ZlciBjcmVhdGluZyBkdXBsaWNhdGVzLlwiLFxuICBcIi0gVXNlIHdpa2kgbGlua3Mgd2hlbiB1c2VmdWwgYW5kIHN1cHBvcnRlZCBieSB0aGUgcHJvdmlkZWQgY29udGV4dC5cIixcbiAgXCItIFVzZSB0aGUgY29uZmlndXJlZCBub3RlcyBmb2xkZXIgYXMgdGhlIGRlZmF1bHQgbG9jYXRpb24gZm9yIG5ldyBub3Rlcy5cIixcbiAgXCItIElmIHlvdSBhcmUgdW5zdXJlIHdoZXJlIHNvbWV0aGluZyBiZWxvbmdzLCBhc2sgYSBxdWVzdGlvbiBpbnN0ZWFkIG9mIGd1ZXNzaW5nLlwiLFxuICBcIi0gTmV2ZXIgZGVsZXRlIG9yIG92ZXJ3cml0ZSBleGlzdGluZyB1c2VyIGNvbnRlbnQuXCIsXG4gIFwiLSBQcm9wb3NlIHNhZmUgYXBwZW5kL2NyZWF0ZSBvcGVyYXRpb25zIGFuZCB3YWl0IGZvciBhcHByb3ZhbCBiZWZvcmUgd3JpdGluZy5cIixcbiAgXCJcIixcbl0uam9pbihcIlxcblwiKTtcblxuZXhwb3J0IGNsYXNzIEluc3RydWN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUZpbGUoXG4gICAgICBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgREVGQVVMVF9JTlNUUlVDVElPTlMsXG4gICAgKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChmaWxlLnBhdGgsIERFRkFVTFRfSU5TVFJVQ1RJT05TKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0lOU1RSVUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBhc3luYyByZWFkSW5zdHJ1Y3Rpb25zKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbnN0cnVjdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFF1ZXJ5TWF0Y2gsIFZhdWx0UXVlcnlTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRXcml0ZVBsYW4sIFZhdWx0V3JpdGVTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0Q2hhdFJlc3BvbnNlIHtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdO1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbiB8IG51bGw7XG4gIHVzZWRBSTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaGF0RXhjaGFuZ2Uge1xuICByb2xlOiBcInVzZXJcIiB8IFwiYnJhaW5cIjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5jb25zdCBDSEFUX0NPTlRFWFRfTElNSVQgPSA2O1xuY29uc3QgTUFYX0hJU1RPUllfRVhDSEFOR0VTID0gNjtcbmNvbnN0IE1BWF9DT05URVhUX0VYQ0VSUFRfQ0hBUlMgPSAxMjAwO1xuXG5leHBvcnQgY2xhc3MgVmF1bHRDaGF0U2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYWlTZXJ2aWNlOiBCcmFpbkFJU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluc3RydWN0aW9uU2VydmljZTogSW5zdHJ1Y3Rpb25TZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcXVlcnlTZXJ2aWNlOiBWYXVsdFF1ZXJ5U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgd3JpdGVTZXJ2aWNlOiBWYXVsdFdyaXRlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyByZXNwb25kKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBoaXN0b3J5OiBDaGF0RXhjaGFuZ2VbXSA9IFtdLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgIG9uU3RhZ2U/OiAoc3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIikgPT4gdm9pZCxcbiAgKTogUHJvbWlzZTxWYXVsdENoYXRSZXNwb25zZT4ge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBtZXNzYWdlLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVudGVyIGEgbWVzc2FnZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICBvblN0YWdlPy4oXCJxdWVyeVwiKTtcbiAgICBjb25zdCBbaW5zdHJ1Y3Rpb25zLCBzb3VyY2VzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLnJlYWRJbnN0cnVjdGlvbnMoKSxcbiAgICAgIHRoaXMucXVlcnlTZXJ2aWNlLnF1ZXJ5VmF1bHQodHJpbW1lZCksXG4gICAgXSk7XG4gICAgY29uc3QgY29udGV4dCA9IGZvcm1hdFNvdXJjZXNGb3JQcm9tcHQoc291cmNlcy5zbGljZSgwLCBDSEFUX0NPTlRFWFRfTElNSVQpKTtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHZhdWx0QmFzZVBhdGggPSB0aGlzLnZhdWx0U2VydmljZS5nZXRCYXNlUGF0aCgpO1xuICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHNldHRpbmdzKTtcbiAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBvblN0YWdlPy4oXCJhaVwiKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNvbXBsZXRlQ2hhdChcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQoaW5zdHJ1Y3Rpb25zLCBzZXR0aW5ncyksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBidWlsZFVzZXJQcm9tcHQodHJpbW1lZCwgdmF1bHRCYXNlUGF0aCwgY29udGV4dCwgaGlzdG9yeSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgc2V0dGluZ3MsXG4gICAgICB2YXVsdEJhc2VQYXRoLFxuICAgICAgc2lnbmFsLFxuICAgICk7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VDaGF0UmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHBhcnNlZC5hbnN3ZXIgfHwgXCJDb2RleCByZXR1cm5lZCBubyBhbnN3ZXIuXCIsXG4gICAgICBzb3VyY2VzLFxuICAgICAgcGxhbjogcGFyc2VkLnBsYW4gPyB0aGlzLndyaXRlU2VydmljZS5ub3JtYWxpemVQbGFuKHBhcnNlZC5wbGFuKSA6IG51bGwsXG4gICAgICB1c2VkQUk6IHRydWUsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZFN5c3RlbVByb21wdChcbiAgaW5zdHJ1Y3Rpb25zOiBzdHJpbmcsXG4gIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBcIllvdSBhcmUgQnJhaW4sIGFuIE9ic2lkaWFuIHZhdWx0IGFzc2lzdGFudC5cIixcbiAgICBcIkFuc3dlciBkaXJlY3RseSBmcm9tIHRoZSBPYnNpZGlhbiB2YXVsdCBtYXJrZG93bi5cIixcbiAgICBcIllvdSBtYXkgaW5zcGVjdCBtYXJrZG93biBmaWxlcyBpbiB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSB3aXRoIHJlYWQtb25seSBzaGVsbCBjb21tYW5kcy5cIixcbiAgICBcIk5ldmVyIGNsYWltIGZhY3RzIHRoYXQgYXJlIG5vdCBzdXBwb3J0ZWQgYnkgdmF1bHQgbWFya2Rvd24gb3IgdGhlIHByb3ZpZGVkIHNvdXJjZSBoaW50cy5cIixcbiAgICBcIkZvciBzaW1wbGUgcXVlc3Rpb25zLCBhbnN3ZXIgaW4gb25lIG9yIHR3byBzZW50ZW5jZXMuXCIsXG4gICAgXCJGb3IgZmlsaW5nIHJlcXVlc3RzLCBwcm9wb3NlIHNhZmUgdmF1bHQgd3JpdGVzLlwiLFxuICAgIFwiUmV0dXJuIG9ubHkgYSBKU09OIG9iamVjdC5cIixcbiAgICBcIlwiLFxuICAgIFwiUmV0dXJuIHRoaXMgSlNPTiBzaGFwZTpcIixcbiAgICBcIntcIixcbiAgICAnICBcImFuc3dlclwiOiBcIm1hcmtkb3duIGFuc3dlciB3aXRoIGV2aWRlbmNlIGFuZCBnYXBzXCIsJyxcbiAgICAnICBcInBsYW5cIjogeycsXG4gICAgJyAgICBcInN1bW1hcnlcIjogXCJzaG9ydCBzdW1tYXJ5IG9mIHByb3Bvc2VkIHdyaXRlcywgb3IgZW1wdHkgc3RyaW5nXCIsJyxcbiAgICAnICAgIFwiY29uZmlkZW5jZVwiOiBcImxvd3xtZWRpdW18aGlnaFwiLCcsXG4gICAgJyAgICBcIm9wZXJhdGlvbnNcIjogWycsXG4gICAgJyAgICAgIHtcInR5cGVcIjpcImFwcGVuZFwiLFwicGF0aFwiOlwiU29tZS9GaWxlLm1kXCIsXCJjb250ZW50XCI6XCJtYXJrZG93blwifSwnLFxuICAgICcgICAgICB7XCJ0eXBlXCI6XCJjcmVhdGVcIixcInBhdGhcIjpcIlNvbWUvTmV3IEZpbGUubWRcIixcImNvbnRlbnRcIjpcIm1hcmtkb3duXCJ9JyxcbiAgICBcIiAgICBdLFwiLFxuICAgICcgICAgXCJxdWVzdGlvbnNcIjogW1wib3BlbiBxdWVzdGlvbiBpZiB5b3UgbmVlZCBjbGFyaWZpY2F0aW9uXCJdJyxcbiAgICBcIiAgfVwiLFxuICAgIFwifVwiLFxuICAgIFwiXCIsXG4gICAgXCJPbmx5IGluY2x1ZGUgd3JpdGUgb3BlcmF0aW9ucyB3aGVuIHRoZSB1c2VyIGFza3MgdG8gYWRkLCBzYXZlLCBmaWxlLCByZW1lbWJlciwgdXBkYXRlLCBjcmVhdGUsIG9yIG90aGVyd2lzZSBwdXQgaW5mb3JtYXRpb24gaW50byB0aGUgdmF1bHQuXCIsXG4gICAgXCJVc2UgYXBwZW5kL2NyZWF0ZSBvcGVyYXRpb25zIG9ubHkuIERvIG5vdCBwcm9wb3NlIGRlbGV0ZSBvciByZXBsYWNlIG9wZXJhdGlvbnMuXCIsXG4gICAgYERlZmF1bHQgbm90ZXMgZm9sZGVyOiAke3NldHRpbmdzLm5vdGVzRm9sZGVyfWAsXG4gICAgXCJcIixcbiAgICBcIlZhdWx0IGluc3RydWN0aW9uczpcIixcbiAgICBpbnN0cnVjdGlvbnMsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRVc2VyUHJvbXB0KFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIHZhdWx0QmFzZVBhdGg6IHN0cmluZyB8IG51bGwsXG4gIGNvbnRleHQ6IHN0cmluZyxcbiAgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10sXG4pOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCByZWNlbnRIaXN0b3J5ID0gaGlzdG9yeS5zbGljZSgtTUFYX0hJU1RPUllfRVhDSEFOR0VTKTtcbiAgaWYgKHJlY2VudEhpc3RvcnkubGVuZ3RoID4gMCkge1xuICAgIHBhcnRzLnB1c2goXCJDb252ZXJzYXRpb24gaGlzdG9yeTpcIik7XG4gICAgZm9yIChjb25zdCBleGNoYW5nZSBvZiByZWNlbnRIaXN0b3J5KSB7XG4gICAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICAgICAgcGFydHMucHVzaChgJHtleGNoYW5nZS5yb2xlID09PSBcInVzZXJcIiA/IFwiVXNlclwiIDogXCJCcmFpblwifTpgKTtcbiAgICAgIHBhcnRzLnB1c2goZXhjaGFuZ2UudGV4dCk7XG4gICAgfVxuICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgcGFydHMucHVzaChcIi0tLVwiKTtcbiAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICB9XG5cbiAgcGFydHMucHVzaChgVXNlciBtZXNzYWdlOiAke21lc3NhZ2V9YCk7XG4gIHBhcnRzLnB1c2goXCJcIik7XG4gIHBhcnRzLnB1c2goXG4gICAgdmF1bHRCYXNlUGF0aFxuICAgICAgPyBcIllvdSBhcmUgcnVubmluZyBmcm9tIHRoZSBPYnNpZGlhbiB2YXVsdCByb290LiBVc2UgcmVhZC1vbmx5IHNoZWxsIGNvbW1hbmRzIG9ubHkgaWYgeW91IG5lZWQgdG8gaW5zcGVjdCBtYXJrZG93biBmaWxlcy5cIlxuICAgICAgOiBcIlVzZSB0aGUgcmVsZXZhbnQgdmF1bHQgY29udGV4dCBiZWxvdy5cIixcbiAgKTtcbiAgcGFydHMucHVzaChcIlwiKTtcbiAgcGFydHMucHVzaChcIlJlbGV2YW50IHNvdXJjZSBoaW50czpcIik7XG4gIHBhcnRzLnB1c2goY29udGV4dCB8fCBcIk5vIG1hdGNoaW5nIHZhdWx0IGZpbGVzIGZvdW5kLlwiKTtcblxuICByZXR1cm4gcGFydHMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0U291cmNlc0ZvclByb21wdChzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHN0cmluZyB7XG4gIHJldHVybiBzb3VyY2VzXG4gICAgLm1hcCgoc291cmNlLCBpbmRleCkgPT4gW1xuICAgICAgYCMjIFNvdXJjZSAke2luZGV4ICsgMX06ICR7c291cmNlLnBhdGh9YCxcbiAgICAgIGBUaXRsZTogJHtzb3VyY2UudGl0bGV9YCxcbiAgICAgIGBSZWFzb246ICR7c291cmNlLnJlYXNvbn1gLFxuICAgICAgXCJcIixcbiAgICAgIHNvdXJjZS5leGNlcnB0LnNsaWNlKDAsIE1BWF9DT05URVhUX0VYQ0VSUFRfQ0hBUlMpLFxuICAgIF0uam9pbihcIlxcblwiKSlcbiAgICAuam9pbihcIlxcblxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VDaGF0UmVzcG9uc2UocmVzcG9uc2U6IHN0cmluZyk6IHtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIHBsYW46IFZhdWx0V3JpdGVQbGFuIHwgbnVsbDtcbn0ge1xuICBjb25zdCBqc29uVGV4dCA9IGV4dHJhY3RKc29uKHJlc3BvbnNlKTtcbiAgaWYgKCFqc29uVGV4dCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHJlc3BvbnNlLnRyaW0oKSxcbiAgICAgIHBsYW46IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uVGV4dCkgYXMge1xuICAgICAgYW5zd2VyPzogdW5rbm93bjtcbiAgICAgIHBsYW4/OiB1bmtub3duO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogdHlwZW9mIHBhcnNlZC5hbnN3ZXIgPT09IFwic3RyaW5nXCIgPyBwYXJzZWQuYW5zd2VyLnRyaW0oKSA6IFwiXCIsXG4gICAgICBwbGFuOiBpc1BsYW5PYmplY3QocGFyc2VkLnBsYW4pID8gcGFyc2VkLnBsYW4gOiBudWxsLFxuICAgIH07XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7XG4gICAgICBhbnN3ZXI6IHJlc3BvbnNlLnRyaW0oKSxcbiAgICAgIHBsYW46IG51bGwsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0SnNvbih0ZXh0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgZmVuY2VkID0gdGV4dC5tYXRjaCgvYGBgKD86anNvbik/XFxzKihbXFxzXFxTXSo/KWBgYC9pKT8uWzFdO1xuICBpZiAoZmVuY2VkKSB7XG4gICAgcmV0dXJuIGZlbmNlZC50cmltKCk7XG4gIH1cbiAgY29uc3Qgc3RhcnQgPSB0ZXh0LmluZGV4T2YoXCJ7XCIpO1xuICBjb25zdCBlbmQgPSB0ZXh0Lmxhc3RJbmRleE9mKFwifVwiKTtcbiAgaWYgKHN0YXJ0ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8IGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB0ZXh0LnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcbn1cblxuZnVuY3Rpb24gaXNQbGFuT2JqZWN0KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVmF1bHRXcml0ZVBsYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzLCBwYXJzZUV4Y2x1ZGVGb2xkZXJzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmF1bHRRdWVyeU1hdGNoIHtcbiAgcGF0aDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBzY29yZTogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbiAgZXhjZXJwdDogc3RyaW5nO1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmNvbnN0IE1BWF9RVUVSWV9GSUxFUyA9IDEyO1xuY29uc3QgTUFYX0VYQ0VSUFRfQ0hBUlMgPSA3MDA7XG5jb25zdCBNQVhfU05JUFBFVF9MSU5FUyA9IDU7XG5jb25zdCBTVE9QX1dPUkRTID0gbmV3IFNldChbXG4gIFwiYWJvdXRcIixcbiAgXCJhcmVcIixcbiAgXCJjYW5cIixcbiAgXCJkaWRcIixcbiAgXCJkb2VzXCIsXG4gIFwiZm9yXCIsXG4gIFwiZnJvbVwiLFxuICBcImhhdmVcIixcbiAgXCJob3dcIixcbiAgXCJpbnRvXCIsXG4gIFwiaXNcIixcbiAgXCJrbm93XCIsXG4gIFwibGlzdFwiLFxuICBcIm15XCIsXG4gIFwidGhlXCIsXG4gIFwidGhpc1wiLFxuICBcInRoYXRcIixcbiAgXCJ3aGF0XCIsXG4gIFwid2hlblwiLFxuICBcIndoZXJlXCIsXG4gIFwid2hpY2hcIixcbiAgXCJ3aG9cIixcbiAgXCJ3aHlcIixcbiAgXCJ3aXRoXCIsXG5dKTtcblxuZXhwb3J0IGNsYXNzIFZhdWx0UXVlcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBxdWVyeVZhdWx0KHF1ZXJ5OiBzdHJpbmcsIGxpbWl0ID0gTUFYX1FVRVJZX0ZJTEVTKTogUHJvbWlzZTxWYXVsdFF1ZXJ5TWF0Y2hbXT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgdG9rZW5zID0gdG9rZW5pemUocXVlcnkpO1xuICAgIGNvbnN0IGV4Y2x1ZGVGb2xkZXJzID0gcGFyc2VFeGNsdWRlRm9sZGVycyhzZXR0aW5ncy5leGNsdWRlRm9sZGVycyk7XG4gICAgY29uc3QgZmlsZXMgPSAoYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UubGlzdE1hcmtkb3duRmlsZXMoKSlcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+IHNob3VsZEluY2x1ZGVGaWxlKGZpbGUsIHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUsIGV4Y2x1ZGVGb2xkZXJzKSlcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc3RhdC5tdGltZSAtIGxlZnQuc3RhdC5tdGltZSk7XG5cbiAgICBjb25zdCBtYXRjaGVzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLnJlYWRUZXh0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBzY29yZSA9IHNjb3JlRmlsZShmaWxlLCB0ZXh0LCBxdWVyeSwgdG9rZW5zKTtcbiAgICAgIGlmIChzY29yZSA8PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogZmlsZS5wYXRoLFxuICAgICAgICB0aXRsZTogdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLFxuICAgICAgICBzY29yZSxcbiAgICAgICAgcmVhc29uOiBidWlsZFJlYXNvbihmaWxlLCB0ZXh0LCBxdWVyeSwgdG9rZW5zKSxcbiAgICAgICAgZXhjZXJwdDogYnVpbGRFeGNlcnB0KHRleHQsIHRva2VucyksXG4gICAgICAgIHRleHQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zY29yZSAtIGxlZnQuc2NvcmUpXG4gICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEluY2x1ZGVGaWxlKGZpbGU6IFRGaWxlLCBpbnN0cnVjdGlvbnNGaWxlOiBzdHJpbmcsIGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoZmlsZS5wYXRoID09PSBpbnN0cnVjdGlvbnNGaWxlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAoY29uc3QgZm9sZGVyIG9mIGV4Y2x1ZGVGb2xkZXJzKSB7XG4gICAgY29uc3QgcHJlZml4ID0gZm9sZGVyLmVuZHNXaXRoKFwiL1wiKSA/IGZvbGRlciA6IGAke2ZvbGRlcn0vYDtcbiAgICBpZiAoZmlsZS5wYXRoID09PSBmb2xkZXIgfHwgZmlsZS5wYXRoLnN0YXJ0c1dpdGgocHJlZml4KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcmV0dXJuIGlucHV0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoL1teYS16MC05Xy8tXSsvaSlcbiAgICAubWFwKCh0b2tlbikgPT4gdG9rZW4udHJpbSgpKVxuICAgIC5maWx0ZXIoKHRva2VuKSA9PiB0b2tlbi5sZW5ndGggPj0gMylcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gIVNUT1BfV09SRFMuaGFzKHRva2VuKSlcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4ge1xuICAgICAgaWYgKHNlZW4uaGFzKHRva2VuKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZCh0b2tlbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIC5zbGljZSgwLCAyNCk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nLCBxdWVyeTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgaWYgKCF0b2tlbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KDEsIE1hdGgucm91bmQoZmlsZS5zdGF0Lm10aW1lIC8gMTAwMDAwMDAwMDAwMCkpO1xuICB9XG5cbiAgY29uc3QgbG93ZXJQYXRoID0gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGl0bGUgPSB0aXRsZUZvckZpbGUoZmlsZSwgdGV4dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBub3JtYWxpemVkVGV4dCA9IG5vcm1hbGl6ZVBocmFzZSh0ZXh0KTtcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gbm9ybWFsaXplUGhyYXNlKHF1ZXJ5KTtcbiAgbGV0IHNjb3JlID0gMDtcbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBub3JtYWxpemVkVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgc2NvcmUgKz0gMTg7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZWRRdWVyeSAmJiBsb3dlclBhdGguaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDI0O1xuICB9XG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKGxvd2VyUGF0aC5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDEwO1xuICAgIH1cbiAgICBpZiAobG93ZXJUaXRsZS5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDk7XG4gICAgfVxuICAgIGNvbnN0IGhlYWRpbmdNYXRjaGVzID0gbG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxuKSN7MSw2fVteXFxcXG5dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1gLCBcImdcIikpO1xuICAgIGlmIChoZWFkaW5nTWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gaGVhZGluZ01hdGNoZXMubGVuZ3RoICogNztcbiAgICB9XG4gICAgY29uc3QgbGlua01hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgXFxcXFtcXFxcW1teXFxcXF1dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bXlxcXFxdXSpcXFxcXVxcXFxdYCwgXCJnXCIpKTtcbiAgICBpZiAobGlua01hdGNoZXMpIHtcbiAgICAgIHNjb3JlICs9IGxpbmtNYXRjaGVzLmxlbmd0aCAqIDY7XG4gICAgfVxuICAgIGNvbnN0IHRhZ01hdGNoZXMgPSBsb3dlclRleHQubWF0Y2gobmV3IFJlZ0V4cChgKF58XFxcXHMpI1stL19hLXowLTldKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bLS9fYS16MC05XSpgLCBcImdpXCIpKTtcbiAgICBpZiAodGFnTWF0Y2hlcykge1xuICAgICAgc2NvcmUgKz0gdGFnTWF0Y2hlcy5sZW5ndGggKiA1O1xuICAgIH1cbiAgICBjb25zdCB0ZXh0TWF0Y2hlcyA9IGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cCh0b2tlbiksIFwiZ1wiKSk7XG4gICAgaWYgKHRleHRNYXRjaGVzKSB7XG4gICAgICBzY29yZSArPSBNYXRoLm1pbig4LCB0ZXh0TWF0Y2hlcy5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1hdGNoZWRUb2tlbnMgPSB0b2tlbnMuZmlsdGVyKCh0b2tlbikgPT4gbG93ZXJQYXRoLmluY2x1ZGVzKHRva2VuKSB8fCBsb3dlclRleHQuaW5jbHVkZXModG9rZW4pKTtcbiAgc2NvcmUgKz0gbWF0Y2hlZFRva2Vucy5sZW5ndGggKiAzO1xuICBpZiAobWF0Y2hlZFRva2Vucy5sZW5ndGggPT09IHRva2Vucy5sZW5ndGgpIHtcbiAgICBzY29yZSArPSBNYXRoLm1pbigxMCwgdG9rZW5zLmxlbmd0aCAqIDIpO1xuICB9XG4gIGNvbnN0IGFnZU1zID0gRGF0ZS5ub3coKSAtIGZpbGUuc3RhdC5tdGltZTtcbiAgY29uc3QgYWdlRGF5cyA9IGFnZU1zIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuICBpZiAoYWdlRGF5cyA8IDEpIHtcbiAgICBzY29yZSArPSAxMDtcbiAgfSBlbHNlIGlmIChhZ2VEYXlzIDwgNykge1xuICAgIHNjb3JlICs9IDY7XG4gIH0gZWxzZSBpZiAoYWdlRGF5cyA8IDMwKSB7XG4gICAgc2NvcmUgKz0gMztcbiAgfSBlbHNlIGlmIChhZ2VEYXlzIDwgOTApIHtcbiAgICBzY29yZSArPSAxO1xuICB9XG4gIHJldHVybiBzY29yZTtcbn1cblxuZnVuY3Rpb24gdGl0bGVGb3JGaWxlKGZpbGU6IFRGaWxlLCB0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBoZWFkaW5nID0gdGV4dC5tYXRjaCgvXiNcXHMrKC4rKSQvbSk/LlsxXT8udHJpbSgpO1xuICBpZiAoaGVhZGluZykge1xuICAgIHJldHVybiBoZWFkaW5nO1xuICB9XG4gIHJldHVybiBmaWxlLmJhc2VuYW1lIHx8IGZpbGUucGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZS5wYXRoO1xufVxuXG5mdW5jdGlvbiBidWlsZFJlYXNvbihmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nLCBxdWVyeTogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgY29uc3QgbG93ZXJQYXRoID0gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGl0bGUgPSB0aXRsZUZvckZpbGUoZmlsZSwgdGV4dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBub3JtYWxpemVkVGV4dCA9IG5vcm1hbGl6ZVBocmFzZSh0ZXh0KTtcbiAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gbm9ybWFsaXplUGhyYXNlKHF1ZXJ5KTtcbiAgY29uc3QgcmVhc29ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBpZiAobm9ybWFsaXplZFF1ZXJ5ICYmIG5vcm1hbGl6ZWRUZXh0LmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICByZWFzb25zLmFkZChcImV4YWN0IHBocmFzZSBtYXRjaFwiKTtcbiAgfVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGlmIChsb3dlclBhdGguaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICByZWFzb25zLmFkZChgcGF0aCBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUaXRsZS5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGB0aXRsZSBtYXRjaGVzIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgICBpZiAobG93ZXJUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYChefFxcXFxuKSN7MSw2fVteXFxcXG5dKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1gKSkpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBoZWFkaW5nIG1hdGNoZXMgXCIke3Rva2VufVwiYCk7XG4gICAgfVxuICAgIGlmIChuZXcgUmVnRXhwKGBcXFxcW1xcXFxbW15cXFxcXV0qJHtlc2NhcGVSZWdFeHAodG9rZW4pfVteXFxcXF1dKlxcXFxdXFxcXF1gLCBcImlcIikudGVzdChsb3dlclRleHQpKSB7XG4gICAgICByZWFzb25zLmFkZChgbGluayBtZW50aW9ucyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5tYXRjaChuZXcgUmVnRXhwKGAoXnxcXFxccykjWy0vX2EtejAtOV0qJHtlc2NhcGVSZWdFeHAodG9rZW4pfVstL19hLXowLTldKmAsIFwiaVwiKSkpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGB0YWcgbWF0Y2hlcyBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5pbmNsdWRlcyh0b2tlbikpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBjb250ZW50IG1lbnRpb25zIFwiJHt0b2tlbn1cImApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShyZWFzb25zKS5zbGljZSgwLCAzKS5qb2luKFwiLCBcIikgfHwgXCJyZWNlbnQgbWFya2Rvd24gbm90ZVwiO1xufVxuXG5mdW5jdGlvbiBidWlsZEV4Y2VycHQodGV4dDogc3RyaW5nLCB0b2tlbnM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgY29uc3Qgc291cmNlTGluZXMgPSB0ZXh0LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCByYW5rZWQgPSBzb3VyY2VMaW5lc1xuICAgIC5tYXAoKGxpbmUsIGluZGV4KSA9PiAoeyBpbmRleCwgc2NvcmU6IHNjb3JlTGluZShsaW5lLCB0b2tlbnMpIH0pKVxuICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc2NvcmUgLSBsZWZ0LnNjb3JlIHx8IGxlZnQuaW5kZXggLSByaWdodC5pbmRleCk7XG4gIGNvbnN0IGJlc3RMaW5lID0gcmFua2VkLmZpbmQoKGxpbmUpID0+IGxpbmUuc2NvcmUgPiAwKT8uaW5kZXggPz8gMDtcbiAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBiZXN0TGluZSAtIDIpO1xuICBjb25zdCBlbmQgPSBNYXRoLm1pbihzb3VyY2VMaW5lcy5sZW5ndGgsIHN0YXJ0ICsgTUFYX1NOSVBQRVRfTElORVMpO1xuICBjb25zdCBleGNlcnB0ID0gc291cmNlTGluZXNcbiAgICAuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAubWFwKChsaW5lKSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oXCJcXG5cIik7XG4gIHJldHVybiBleGNlcnB0Lmxlbmd0aCA+IE1BWF9FWENFUlBUX0NIQVJTXG4gICAgPyBgJHtleGNlcnB0LnNsaWNlKDAsIE1BWF9FWENFUlBUX0NIQVJTIC0gMykudHJpbUVuZCgpfS4uLmBcbiAgICA6IGV4Y2VycHQ7XG59XG5cbmZ1bmN0aW9uIHNjb3JlTGluZShsaW5lOiBzdHJpbmcsIHRva2Vuczogc3RyaW5nW10pOiBudW1iZXIge1xuICBjb25zdCBsb3dlciA9IGxpbmUudG9Mb3dlckNhc2UoKTtcbiAgbGV0IHNjb3JlID0gMDtcbiAgaWYgKGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoXCIjXCIpKSB7XG4gICAgc2NvcmUgKz0gNDtcbiAgfVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGlmICghbG93ZXIuaW5jbHVkZXModG9rZW4pKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgc2NvcmUgKz0gMztcbiAgICBpZiAobG93ZXIuaW5jbHVkZXMoYFtbJHt0b2tlbn1gKSB8fCBsb3dlci5pbmNsdWRlcyhgJHt0b2tlbn1dXWApKSB7XG4gICAgICBzY29yZSArPSAyO1xuICAgIH1cbiAgICBpZiAobG93ZXIubWF0Y2gobmV3IFJlZ0V4cChgKF58XFxcXHMpI1stL19hLXowLTldKiR7ZXNjYXBlUmVnRXhwKHRva2VuKX1bLS9fYS16MC05XSpgLCBcImlcIikpKSB7XG4gICAgICBzY29yZSArPSAyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc2NvcmU7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBocmFzZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG59XG4iLCAiaW1wb3J0IHtcbiAgQXBwLFxuICBGaWxlU3lzdGVtQWRhcHRlcixcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgVmF1bHRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcCkge31cblxuICBhc3luYyBlbnN1cmVLbm93bkZvbGRlcnMoc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmb2xkZXJzID0gbmV3IFNldChbXG4gICAgICBzZXR0aW5ncy5ub3Rlc0ZvbGRlcixcbiAgICAgIHBhcmVudEZvbGRlcihzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlKSxcbiAgICBdKTtcblxuICAgIGZvciAoY29uc3QgZm9sZGVyIG9mIGZvbGRlcnMpIHtcbiAgICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKGZvbGRlcik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRm9sZGVyKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZvbGRlclBhdGgpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fS8ke3NlZ21lbnR9YCA6IHNlZ21lbnQ7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50KTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVGb2xkZXJJZk1pc3NpbmcoY3VycmVudCk7XG4gICAgICB9IGVsc2UgaWYgKCEoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmb2xkZXI6ICR7Y3VycmVudH1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGluaXRpYWxDb250ZW50ID0gXCJcIik6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIHJldHVybiBleGlzdGluZztcbiAgICB9XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggZXhpc3RzIGJ1dCBpcyBub3QgYSBmaWxlOiAke25vcm1hbGl6ZWR9YCk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIocGFyZW50Rm9sZGVyKG5vcm1hbGl6ZWQpKTtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vcm1hbGl6ZWQsIGluaXRpYWxDb250ZW50KTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRUZXh0KGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChmaWxlUGF0aCkpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIGFwcGVuZFRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgY29uc3Qgc2VwYXJhdG9yID0gY3VycmVudC5sZW5ndGggPT09IDBcbiAgICAgID8gXCJcIlxuICAgICAgOiBjdXJyZW50LmVuZHNXaXRoKFwiXFxuXFxuXCIpXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICAgICAgICA/IFwiXFxuXCJcbiAgICAgICAgICA6IFwiXFxuXFxuXCI7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAke2N1cnJlbnR9JHtzZXBhcmF0b3J9JHtub3JtYWxpemVkQ29udGVudH1gKTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIHJlcGxhY2VUZXh0KGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5lbnN1cmVGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IGNvbnRlbnQuZW5kc1dpdGgoXCJcXG5cIikgPyBjb250ZW50IDogYCR7Y29udGVudH1cXG5gO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBub3JtYWxpemVkQ29udGVudCk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBlbnN1cmVVbmlxdWVGaWxlUGF0aChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIGNvbnN0IGRvdEluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdEluZGV4ID09PSAtMSA/IG5vcm1hbGl6ZWQgOiBub3JtYWxpemVkLnNsaWNlKDAsIGRvdEluZGV4KTtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3RJbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZShkb3RJbmRleCk7XG5cbiAgICBsZXQgY291bnRlciA9IDI7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7Y291bnRlcn0ke2V4dGVuc2lvbn1gO1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY2FuZGlkYXRlKSkge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgICAgY291bnRlciArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGxpc3RNYXJrZG93bkZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG4gIH1cblxuICBnZXRCYXNlUGF0aCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuYWRhcHRlciBpbnN0YW5jZW9mIEZpbGVTeXN0ZW1BZGFwdGVyXG4gICAgICA/IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZ2V0QmFzZVBhdGgoKVxuICAgICAgOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVGb2xkZXJJZk1pc3NpbmcoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJlbnRGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKDAsIGluZGV4KTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NhZmVNYXJrZG93blBhdGgoXG4gIHBhdGg6IHN0cmluZyxcbiAgc2V0dGluZ3M/OiBQaWNrPEJyYWluUGx1Z2luU2V0dGluZ3MsIFwiaW5zdHJ1Y3Rpb25zRmlsZVwiPixcbik6IGJvb2xlYW4ge1xuICBjb25zdCBzZWdtZW50cyA9IHBhdGguc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgY29uc3QgaXNTYWZlID1cbiAgICBCb29sZWFuKHBhdGgpICYmXG4gICAgcGF0aC5lbmRzV2l0aChcIi5tZFwiKSAmJlxuICAgICFwYXRoLmluY2x1ZGVzKFwiLi5cIikgJiZcbiAgICBzZWdtZW50cy5ldmVyeSgoc2VnbWVudCkgPT4gIXNlZ21lbnQuc3RhcnRzV2l0aChcIi5cIikpO1xuXG4gIGlmICghaXNTYWZlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHNldHRpbmdzICYmIHBhdGggPT09IHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBpc1NhZmVNYXJrZG93blBhdGggfSBmcm9tIFwiLi4vdXRpbHMvcGF0aC1zYWZldHlcIjtcbmltcG9ydCB7IFZhdWx0U2VydmljZSB9IGZyb20gXCIuL3ZhdWx0LXNlcnZpY2VcIjtcblxuY29uc3QgTUFYX09QRVJBVElPTlMgPSA4O1xuXG5leHBvcnQgdHlwZSBWYXVsdFdyaXRlT3BlcmF0aW9uID1cbiAgfCB7XG4gICAgICB0eXBlOiBcImFwcGVuZFwiO1xuICAgICAgcGF0aDogc3RyaW5nO1xuICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgfVxuICB8IHtcbiAgICAgIHR5cGU6IFwiY3JlYXRlXCI7XG4gICAgICBwYXRoOiBzdHJpbmc7XG4gICAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0V3JpdGVQbGFuIHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBjb25maWRlbmNlOiBcImxvd1wiIHwgXCJtZWRpdW1cIiB8IFwiaGlnaFwiO1xuICBvcGVyYXRpb25zOiBWYXVsdFdyaXRlT3BlcmF0aW9uW107XG4gIHF1ZXN0aW9uczogc3RyaW5nW107XG4gIGRyb3BwZWRPcGVyYXRpb25zOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFdyaXRlU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgbm9ybWFsaXplUGxhbihwbGFuOiBQYXJ0aWFsPFZhdWx0V3JpdGVQbGFuPiB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogVmF1bHRXcml0ZVBsYW4ge1xuICAgIGNvbnN0IGNvbmZpZGVuY2UgPSByZWFkQ29uZmlkZW5jZShwbGFuLmNvbmZpZGVuY2UpO1xuICAgIGNvbnN0IHJhd09wZXJhdGlvbnMgPSBBcnJheS5pc0FycmF5KHBsYW4ub3BlcmF0aW9ucykgPyBwbGFuLm9wZXJhdGlvbnMgOiBbXTtcbiAgICBjb25zdCB2YWxpZE9wZXJhdGlvbnMgPSByYXdPcGVyYXRpb25zXG4gICAgICAubWFwKChvcGVyYXRpb24pID0+IHRoaXMubm9ybWFsaXplT3BlcmF0aW9uKG9wZXJhdGlvbikpXG4gICAgICAuZmlsdGVyKChvcGVyYXRpb24pOiBvcGVyYXRpb24gaXMgVmF1bHRXcml0ZU9wZXJhdGlvbiA9PiBvcGVyYXRpb24gIT09IG51bGwpO1xuICAgIGNvbnN0IGRyb3BwZWRGcm9tU2FmZXR5ID0gcmF3T3BlcmF0aW9ucy5sZW5ndGggLSB2YWxpZE9wZXJhdGlvbnMubGVuZ3RoO1xuICAgIGNvbnN0IHRvdGFsQWZ0ZXJMaW1pdCA9IHZhbGlkT3BlcmF0aW9ucy5zbGljZSgwLCBNQVhfT1BFUkFUSU9OUyk7XG4gICAgY29uc3QgZHJvcHBlZEZyb21MaW1pdCA9IHZhbGlkT3BlcmF0aW9ucy5sZW5ndGggLSB0b3RhbEFmdGVyTGltaXQubGVuZ3RoO1xuICAgIHJldHVybiB7XG4gICAgICBzdW1tYXJ5OiB0eXBlb2YgcGxhbi5zdW1tYXJ5ID09PSBcInN0cmluZ1wiICYmIHBsYW4uc3VtbWFyeS50cmltKClcbiAgICAgICAgPyBwbGFuLnN1bW1hcnkudHJpbSgpXG4gICAgICAgIDogXCJCcmFpbiBwcm9wb3NlZCB2YXVsdCB1cGRhdGVzLlwiLFxuICAgICAgY29uZmlkZW5jZSxcbiAgICAgIG9wZXJhdGlvbnM6IHRvdGFsQWZ0ZXJMaW1pdCxcbiAgICAgIHF1ZXN0aW9uczogKEFycmF5LmlzQXJyYXkocGxhbi5xdWVzdGlvbnMpID8gcGxhbi5xdWVzdGlvbnMgOiBbXSlcbiAgICAgICAgLm1hcCgocXVlc3Rpb24pID0+IFN0cmluZyhxdWVzdGlvbikudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5zbGljZSgwLCA1KSxcbiAgICAgIGRyb3BwZWRPcGVyYXRpb25zOiBkcm9wcGVkRnJvbVNhZmV0eSArIGRyb3BwZWRGcm9tTGltaXQsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGFwcGx5UGxhbihwbGFuOiBWYXVsdFdyaXRlUGxhbik6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IHBhdGhzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgb3BlcmF0aW9uIG9mIHBsYW4ub3BlcmF0aW9ucykge1xuICAgICAgaWYgKCFpc1NhZmVNYXJrZG93blBhdGgob3BlcmF0aW9uLnBhdGgsIHNldHRpbmdzKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJhcHBlbmRcIikge1xuICAgICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5hcHBlbmRUZXh0KG9wZXJhdGlvbi5wYXRoLCBvcGVyYXRpb24uY29udGVudCk7XG4gICAgICAgIHBhdGhzLnB1c2gob3BlcmF0aW9uLnBhdGgpO1xuICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJjcmVhdGVcIikge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlVW5pcXVlRmlsZVBhdGgob3BlcmF0aW9uLnBhdGgpO1xuICAgICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChwYXRoLCBvcGVyYXRpb24uY29udGVudCk7XG4gICAgICAgIHBhdGhzLnB1c2gocGF0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQocGF0aHMpKTtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplT3BlcmF0aW9uKG9wZXJhdGlvbjogdW5rbm93bik6IFZhdWx0V3JpdGVPcGVyYXRpb24gfCBudWxsIHtcbiAgICBpZiAoIW9wZXJhdGlvbiB8fCB0eXBlb2Ygb3BlcmF0aW9uICE9PSBcIm9iamVjdFwiIHx8ICEoXCJ0eXBlXCIgaW4gb3BlcmF0aW9uKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuZGlkYXRlID0gb3BlcmF0aW9uIGFzIFBhcnRpYWw8VmF1bHRXcml0ZU9wZXJhdGlvbj47XG4gICAgY29uc3QgY29udGVudCA9IFwiY29udGVudFwiIGluIGNhbmRpZGF0ZSA/IFN0cmluZyhjYW5kaWRhdGUuY29udGVudCA/PyBcIlwiKS50cmltKCkgOiBcIlwiO1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGNhbmRpZGF0ZS50eXBlICE9PSBcImFwcGVuZFwiICYmIGNhbmRpZGF0ZS50eXBlICE9PSBcImNyZWF0ZVwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBwYXRoID0gXCJwYXRoXCIgaW4gY2FuZGlkYXRlXG4gICAgICA/IG5vcm1hbGl6ZU1hcmtkb3duUGF0aChTdHJpbmcoY2FuZGlkYXRlLnBhdGggPz8gXCJcIikpXG4gICAgICA6IFwiXCI7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBpZiAoIWlzU2FmZU1hcmtkb3duUGF0aChwYXRoLCBzZXR0aW5ncykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBjYW5kaWRhdGUudHlwZSxcbiAgICAgIHBhdGgsXG4gICAgICBjb250ZW50LFxuICAgICAgZGVzY3JpcHRpb246IHJlYWREZXNjcmlwdGlvbihjYW5kaWRhdGUpLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZERlc2NyaXB0aW9uKG9wZXJhdGlvbjogUGFydGlhbDxWYXVsdFdyaXRlT3BlcmF0aW9uPik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiB0eXBlb2Ygb3BlcmF0aW9uLmRlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiICYmIG9wZXJhdGlvbi5kZXNjcmlwdGlvbi50cmltKClcbiAgICA/IG9wZXJhdGlvbi5kZXNjcmlwdGlvbi50cmltKClcbiAgICA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbmZpZGVuY2UodmFsdWU6IHVua25vd24pOiBWYXVsdFdyaXRlUGxhbltcImNvbmZpZGVuY2VcIl0ge1xuICByZXR1cm4gdmFsdWUgPT09IFwibG93XCIgfHwgdmFsdWUgPT09IFwibWVkaXVtXCIgfHwgdmFsdWUgPT09IFwiaGlnaFwiID8gdmFsdWUgOiBcIm1lZGl1bVwiO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVNYXJrZG93blBhdGgodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZVxuICAgIC50cmltKClcbiAgICAucmVwbGFjZSgvXFxcXC9nLCBcIi9cIilcbiAgICAucmVwbGFjZSgvXFwvKy9nLCBcIi9cIilcbiAgICAucmVwbGFjZSgvXlxcLysvLCBcIlwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIEl0ZW1WaWV3LCBNYXJrZG93blJlbmRlcmVyLCBOb3RpY2UsIFRGaWxlLCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgQnJhaW5QbHVnaW4gZnJvbSBcIi4uLy4uL21haW5cIjtcbmltcG9ydCB7IFZhdWx0Q2hhdFJlc3BvbnNlLCBDaGF0RXhjaGFuZ2UgfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtY2hhdC1zZXJ2aWNlXCI7XG5pbXBvcnQgdHlwZSB7IFZhdWx0UXVlcnlNYXRjaCB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC1xdWVyeS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFBsYW5Nb2RhbCB9IGZyb20gXCIuL3ZhdWx0LXBsYW4tbW9kYWxcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQge1xuICBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbiAgQ29kZXhNb2RlbE9wdGlvbixcbiAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zLFxuICBpc0tub3duQ29kZXhNb2RlbCxcbn0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LW1vZGVsc1wiO1xuXG5pbnRlcmZhY2UgQ2hhdFR1cm4ge1xuICByb2xlOiBcInVzZXJcIiB8IFwiYnJhaW5cIiB8IFwiZXJyb3JcIiB8IFwiaW5mb1wiO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgdXBkYXRlZFBhdGhzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSBtZXNzYWdlc0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlbFJvd0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2VuZEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RvcEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgY2xlYXJCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgbW9kZWxTZWxlY3RFbDogSFRNTFNlbGVjdEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtb2RlbEN1c3RvbUlucHV0RWw6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtb2RlbEFjdGl2ZUVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1vZGVsTG9hZGluZ0VsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGlzTG9hZGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGN1cnJlbnRBYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxvYWRpbmdTdGFydGVkQXQgPSAwO1xuICBwcml2YXRlIGxvYWRpbmdUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1RleHQgPSBcIlwiO1xuICBwcml2YXRlIGxvYWRpbmdUZXh0RWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YWdlRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIgPSBcInF1ZXJ5XCI7XG4gIHByaXZhdGUgcmVuZGVyR2VuZXJhdGlvbiA9IDA7XG4gIHByaXZhdGUgcmVzaXplRnJhbWVJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdHVybnM6IENoYXRUdXJuW10gPSBbXTtcbiAgcHJpdmF0ZSB1c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICBwcml2YXRlIHNjcm9sbFRvQm90dG9tRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBCUkFJTl9WSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIkJyYWluXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW5cIjtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tc2lkZWJhclwiKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlclwiIH0pO1xuICAgIGNvbnN0IGhlYWRlclRvcCA9IGhlYWRlci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1oZWFkZXItdG9wXCIgfSk7XG4gICAgaGVhZGVyVG9wLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJyYWluXCIgfSk7XG4gICAgdGhpcy5tb2RlbFJvd0VsID0gaGVhZGVyVG9wLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW1vZGVsLXJvd1wiIH0pO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIkFzayB5b3VyIHZhdWx0LCBvciB0ZWxsIEJyYWluIHdoYXQgdG8gZmlsZS5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGhlYWRlckFjdGlvbnMgPSBoZWFkZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyLWFjdGlvbnNcIiB9KTtcbiAgICB0aGlzLmNsZWFyQnV0dG9uRWwgPSBoZWFkZXJBY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLWdob3N0IGJyYWluLWJ1dHRvbi1zbWFsbFwiLFxuICAgICAgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJDbGVhciBjb252ZXJzYXRpb25cIiwgdGl0bGU6IFwiQ2xlYXIgY29udmVyc2F0aW9uXCIgfSxcbiAgICB9KTtcbiAgICBzZXRJY29uKHRoaXMuY2xlYXJCdXR0b25FbCwgXCJ0cmFzaC0yXCIpO1xuICAgIHRoaXMuY2xlYXJCdXR0b25FbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIkNsZWFyXCIgfSk7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuY2xlYXJDb252ZXJzYXRpb24oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGluc3RydWN0aW9uc0xpbmsgPSBoZWFkZXJBY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLWdob3N0IGJyYWluLWJ1dHRvbi1zbWFsbFwiLFxuICAgICAgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJPcGVuIGluc3RydWN0aW9ucyBmaWxlXCIsIHRpdGxlOiBcIk9wZW4gaW5zdHJ1Y3Rpb25zIGZpbGVcIiB9LFxuICAgIH0pO1xuICAgIHNldEljb24oaW5zdHJ1Y3Rpb25zTGluaywgXCJib29rLW9wZW5cIik7XG4gICAgaW5zdHJ1Y3Rpb25zTGluay5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIkluc3RydWN0aW9uc1wiIH0pO1xuICAgIGluc3RydWN0aW9uc0xpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4ub3Blbkluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHNldHRpbmdzTGluayA9IGhlYWRlckFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tZ2hvc3QgYnJhaW4tYnV0dG9uLXNtYWxsXCIsXG4gICAgICBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIk9wZW4gQnJhaW4gc2V0dGluZ3NcIiwgdGl0bGU6IFwiT3BlbiBCcmFpbiBzZXR0aW5nc1wiIH0sXG4gICAgfSk7XG4gICAgc2V0SWNvbihzZXR0aW5nc0xpbmssIFwic2V0dGluZ3NcIik7XG4gICAgc2V0dGluZ3NMaW5rLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiU2V0dGluZ3NcIiB9KTtcbiAgICBzZXR0aW5nc0xpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmRzID0gKHRoaXMuYXBwIGFzIHVua25vd24gYXMgeyBjb21tYW5kcz86IHsgZXhlY3V0ZUNvbW1hbmRCeUlkPzogKGlkOiBzdHJpbmcpID0+IHZvaWQgfSB9KVxuICAgICAgICAuY29tbWFuZHM7XG4gICAgICBjb21tYW5kcz8uZXhlY3V0ZUNvbW1hbmRCeUlkPy4oXCJhcHA6b3Blbi1zZXR0aW5nc1wiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG1lc3NhZ2VzQ29udGFpbmVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tbWVzc2FnZXMtY29udGFpbmVyXCIgfSk7XG4gICAgdGhpcy5tZXNzYWdlc0VsID0gbWVzc2FnZXNDb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNoYXQtbWVzc2FnZXNcIixcbiAgICAgIGF0dHI6IHsgXCJhcmlhLWxpdmVcIjogXCJwb2xpdGVcIiwgXCJhcmlhLWF0b21pY1wiOiBcImZhbHNlXCIgfSxcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VzRWwuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnVzZXJTY3JvbGxlZFVwID0gIXRoaXMuaXNOZWFyQm90dG9tKCk7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG4gICAgfSk7XG4gICAgaWYgKHRoaXMudHVybnMubGVuZ3RoID4gMCkge1xuICAgICAgdm9pZCB0aGlzLnJlbmRlck1lc3NhZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgIH1cblxuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbCA9IG1lc3NhZ2VzQ29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1zY3JvbGwtdG8tYm90dG9tXCIsXG4gICAgICBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlNjcm9sbCB0byBib3R0b21cIiB9LFxuICAgIH0pO1xuICAgIHNldEljb24odGhpcy5zY3JvbGxUb0JvdHRvbUVsLCBcImFycm93LWRvd25cIik7XG4gICAgdGhpcy5zY3JvbGxUb0JvdHRvbUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnVzZXJTY3JvbGxlZFVwID0gZmFsc2U7XG4gICAgICB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsVG8oeyB0b3A6IHRoaXMubWVzc2FnZXNFbC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiBcInNtb290aFwiIH0pO1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgIH0pO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcblxuICAgIHRoaXMuaW5wdXRFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNoYXQtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiQXNrIGFib3V0IHlvdXIgdmF1bHQsIG9yIHBhc3RlIHJvdWdoIG5vdGVzIGZvciBCcmFpbiB0byBmaWxlLi4uXCIsXG4gICAgICAgIHJvd3M6IFwiNFwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgdGhpcy5zZW5kTWVzc2FnZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5hdXRvUmVzaXplSW5wdXQoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhpbnQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1rZXlib2FyZC1oaW50XCIgfSk7XG4gICAgaGludC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIlByZXNzIFwiIH0pO1xuICAgIGhpbnQuY3JlYXRlRWwoXCJrYmRcIiwgeyB0ZXh0OiBcIkVudGVyXCIgfSk7XG4gICAgaGludC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIiB0byBzZW5kIFx1MDBCNyBcIiB9KTtcbiAgICBoaW50LmNyZWF0ZUVsKFwia2JkXCIsIHsgdGV4dDogXCJTaGlmdCtFbnRlclwiIH0pO1xuICAgIGhpbnQuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCIgZm9yIGEgbmV3IGxpbmVcIiB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1hY3Rpb25zXCIgfSk7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXByaW1hcnkgYnJhaW4tYnV0dG9uLXNlbmRcIixcbiAgICAgIHRleHQ6IFwiU2VuZFwiLFxuICAgIH0pO1xuICAgIHRoaXMuc2VuZEJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuc2VuZE1lc3NhZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tc3RvcCBicmFpbi1idXR0b24taGlkZGVuXCIsXG4gICAgICB0ZXh0OiBcIlN0b3BcIixcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5zdG9wQ3VycmVudFJlcXVlc3QoKTtcbiAgICB9KTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5oaWRkZW4gPSB0cnVlO1xuXG4gICAgdGhpcy5zdGF0dXNFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtc3RhdHVzXCIgfSk7XG4gICAgdGhpcy51cGRhdGVDbGVhckJ1dHRvbigpO1xuICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlcj8uYWJvcnQoKTtcbiAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICBpZiAodGhpcy5yZXNpemVGcmFtZUlkICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJlc2l6ZUZyYW1lSWQpO1xuICAgICAgdGhpcy5yZXNpemVGcmFtZUlkID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaFN0YXR1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuc3RhdHVzRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zdGF0dXNFbC5lbXB0eSgpO1xuICAgIGxldCBzdGF0dXNUZXh0ID0gXCJOb3QgY29ubmVjdGVkXCI7XG4gICAgbGV0IHN0YXR1c0NsYXNzOiBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiA9IFwiZXJyb3JcIjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYWlTdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgaWYgKGFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgICAgc3RhdHVzVGV4dCA9IGFpU3RhdHVzLm1vZGVsID8gYE1vZGVsOiAke2FpU3RhdHVzLm1vZGVsfWAgOiBcIkNvbm5lY3RlZCAoYWNjb3VudCBkZWZhdWx0IG1vZGVsKVwiO1xuICAgICAgICBzdGF0dXNDbGFzcyA9IFwib2tcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXR1c1RleHQgPSBhaVN0YXR1cy5tZXNzYWdlIHx8IFwiTm90IGNvbm5lY3RlZFwiO1xuICAgICAgICBzdGF0dXNDbGFzcyA9IFwid2FyblwiO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHN0YXR1c1RleHQgPSBcIkNvdWxkIG5vdCBjaGVjayBDb2RleCBzdGF0dXNcIjtcbiAgICAgIHN0YXR1c0NsYXNzID0gXCJlcnJvclwiO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGljYXRvciA9IHRoaXMuc3RhdHVzRWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIGNsczogYGJyYWluLXN0YXR1cy1pbmRpY2F0b3IgYnJhaW4tc3RhdHVzLWluZGljYXRvci0tJHtzdGF0dXNDbGFzc31gLFxuICAgIH0pO1xuICAgIGluZGljYXRvci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgdGhpcy5zdGF0dXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBzdGF0dXNUZXh0IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZW5kTWVzc2FnZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1lc3NhZ2UgfHwgdGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBcIlwiO1xuICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICAgIHRoaXMuYWRkVHVybihcInVzZXJcIiwgbWVzc2FnZSk7XG4gICAgdGhpcy5zZXRMb2FkaW5nKHRydWUsIFwicXVlcnlcIik7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBoaXN0b3J5ID0gdGhpcy5idWlsZENoYXRIaXN0b3J5KCk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucGx1Z2luLmNoYXRXaXRoVmF1bHQobWVzc2FnZSwgaGlzdG9yeSwgY29udHJvbGxlci5zaWduYWwsIChzdGFnZSkgPT4ge1xuICAgICAgICB0aGlzLmxvYWRpbmdTdGFnZSA9IHN0YWdlO1xuICAgICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMucmVuZGVyUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaXNTdG9wcGVkUmVxdWVzdChlcnJvcikpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudEVsLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgdGhpcy5hZGRUdXJuKFwiaW5mb1wiLCBcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiQ291bGQgbm90IGNoYXQgd2l0aCB0aGUgdmF1bHRcIjtcbiAgICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjaGF0IHdpdGggdGhlIHZhdWx0XCIpO1xuICAgICAgICBpZiAodGhpcy5jb250ZW50RWwuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICB0aGlzLmFkZFR1cm4oXCJlcnJvclwiLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgdGhpcy5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ2hhdEhpc3RvcnkoKTogQ2hhdEV4Y2hhbmdlW10ge1xuICAgIC8vIEV4Y2x1ZGUgdGhlIGxhc3QgdHVybiwgd2hpY2ggaXMgdGhlIGN1cnJlbnQgdXNlciBtZXNzYWdlIGJlaW5nIHNlbnQuXG4gICAgY29uc3Qgb3V0OiBDaGF0RXhjaGFuZ2VbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgdHVybiBvZiB0aGlzLnR1cm5zLnNsaWNlKDAsIC0xKSkge1xuICAgICAgaWYgKHR1cm4ucm9sZSAhPT0gXCJ1c2VyXCIgJiYgdHVybi5yb2xlICE9PSBcImJyYWluXCIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIXR1cm4udGV4dCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0dXJuLnVwZGF0ZWRQYXRocz8ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgb3V0LnB1c2goeyByb2xlOiB0dXJuLnJvbGUsIHRleHQ6IHR1cm4udGV4dCB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcEN1cnJlbnRSZXF1ZXN0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlci5hYm9ydCgpO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5sb2FkaW5nU3RhZ2VFbCkge1xuICAgICAgdGhpcy5sb2FkaW5nU3RhZ2VFbC5zZXRUZXh0KFwiU3RvcHBpbmdcdTIwMjZcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLmxvYWRpbmdUZXh0RWwpIHtcbiAgICAgIHRoaXMubG9hZGluZ1RleHRFbC5zZXRUZXh0KFwiU3RvcHBpbmdcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RlbFNlbGVjdG9yKCk6IHZvaWQge1xuICAgIHRoaXMubW9kZWxSb3dFbC5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWxTZWxlY3RFbCA9IG51bGw7XG4gICAgdGhpcy5tb2RlbEN1c3RvbUlucHV0RWwgPSBudWxsO1xuICAgIHRoaXMubW9kZWxBY3RpdmVFbCA9IG51bGw7XG4gICAgdGhpcy5tb2RlbExvYWRpbmdFbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nKSB7XG4gICAgICB0aGlzLm1vZGVsTG9hZGluZ0VsID0gdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1tb2RlbC1hY3RpdmVcIixcbiAgICAgICAgdGV4dDogXCJMb2FkaW5nIENvZGV4IG1vZGVscy4uLlwiLFxuICAgICAgfSk7XG4gICAgICB0aGlzLnVwZGF0ZU1vZGVsQ29udHJvbHNEaXNhYmxlZFN0YXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdCA9IHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNlbGVjdFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtc2VsZWN0XCIsXG4gICAgfSkgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgdGhpcy5tb2RlbFNlbGVjdEVsID0gc2VsZWN0O1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHRoaXMubW9kZWxPcHRpb25zKSB7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgICB2YWx1ZTogb3B0aW9uLnZhbHVlLFxuICAgICAgICB0ZXh0OiBvcHRpb24ubGFiZWwsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgIHZhbHVlOiBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gICAgICB0ZXh0OiBcIkN1c3RvbS4uLlwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRlc2lyZWRWYWx1ZSA9IHRoaXMuY3VzdG9tTW9kZWxEcmFmdFxuICAgICAgPyBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICAgIDogZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpO1xuICAgIGlmICh0aGlzLm1vZGVsU2VsZWN0RWwudmFsdWUgIT09IGRlc2lyZWRWYWx1ZSkge1xuICAgICAgdGhpcy5tb2RlbFNlbGVjdEVsLnZhbHVlID0gZGVzaXJlZFZhbHVlO1xuICAgIH1cbiAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuaGFuZGxlTW9kZWxTZWxlY3Rpb24oc2VsZWN0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGlmIChzZWxlY3QudmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgaWYgKHRoaXMuY3VzdG9tTW9kZWxEcmFmdCAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgICB0aGlzLm1vZGVsQWN0aXZlRWwgPSB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtYWN0aXZlXCIsXG4gICAgICAgICAgdGV4dDogYEFjdGl2ZTogJHt0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKX1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlucHV0ID0gdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtY3VzdG9tXCIsXG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgICBwbGFjZWhvbGRlcjogXCJDb2RleCBtb2RlbCBpZFwiLFxuICAgICAgICB9LFxuICAgICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgIHRoaXMubW9kZWxDdXN0b21JbnB1dEVsID0gaW5wdXQ7XG4gICAgICBjb25zdCBpbml0aWFsQ3VzdG9tVmFsdWUgPVxuICAgICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgfHwgaXNLbm93bkNvZGV4TW9kZWwodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpXG4gICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsO1xuICAgICAgaWYgKGlucHV0LnZhbHVlICE9PSBpbml0aWFsQ3VzdG9tVmFsdWUpIHtcbiAgICAgICAgaW5wdXQudmFsdWUgPSBpbml0aWFsQ3VzdG9tVmFsdWU7XG4gICAgICB9XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQ3VzdG9tTW9kZWwoaW5wdXQudmFsdWUpO1xuICAgICAgfSk7XG4gICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZU1vZGVsQ29udHJvbHNEaXNhYmxlZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZU1vZGVsQ29udHJvbHNEaXNhYmxlZFN0YXRlKCk6IHZvaWQge1xuICAgIGNvbnN0IGRpc2FibGVkID0gdGhpcy5pc0xvYWRpbmcgfHwgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nO1xuICAgIGlmICh0aGlzLm1vZGVsU2VsZWN0RWwpIHtcbiAgICAgIHRoaXMubW9kZWxTZWxlY3RFbC5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlbEN1c3RvbUlucHV0RWwpIHtcbiAgICAgIHRoaXMubW9kZWxDdXN0b21JbnB1dEVsLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoTW9kZWxPcHRpb25zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zID0gYXdhaXQgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZU1vZGVsU2VsZWN0aW9uKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodmFsdWUgPT09IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gdmFsdWU7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbW9kZWwgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IG1vZGVsO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJSZXNwb25zZShyZXNwb25zZTogVmF1bHRDaGF0UmVzcG9uc2UpOiB2b2lkIHtcbiAgICB0aGlzLmFkZFR1cm4oXCJicmFpblwiLCByZXNwb25zZS5hbnN3ZXIudHJpbSgpLCByZXNwb25zZS5zb3VyY2VzKTtcblxuICAgIGlmIChyZXNwb25zZS5wbGFuICYmIHJlc3BvbnNlLnBsYW4ub3BlcmF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBuZXcgVmF1bHRQbGFuTW9kYWwodGhpcy5hcHAsIHtcbiAgICAgICAgcGxhbjogcmVzcG9uc2UucGxhbixcbiAgICAgICAgc2V0dGluZ3M6IHRoaXMucGx1Z2luLnNldHRpbmdzLFxuICAgICAgICBvbkFwcHJvdmU6IGFzeW5jIChwbGFuKSA9PiB0aGlzLnBsdWdpbi5hcHBseVZhdWx0V3JpdGVQbGFuKHBsYW4pLFxuICAgICAgICBvbkNvbXBsZXRlOiBhc3luYyAobWVzc2FnZSwgcGF0aHMpID0+IHtcbiAgICAgICAgICB0aGlzLmFkZFVwZGF0ZWRGaWxlVHVybihtZXNzYWdlLCBwYXRocyk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gICAgICAgIH0sXG4gICAgICB9KS5vcGVuKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRMb2FkaW5nKGxvYWRpbmc6IGJvb2xlYW4sIHN0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIgPSBcInF1ZXJ5XCIpOiB2b2lkIHtcbiAgICB0aGlzLmlzTG9hZGluZyA9IGxvYWRpbmc7XG4gICAgdGhpcy5sb2FkaW5nU3RhZ2UgPSBzdGFnZTtcbiAgICBpZiAobG9hZGluZykge1xuICAgICAgdGhpcy5sb2FkaW5nU3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgIHRoaXMudXBkYXRlTG9hZGluZ1RleHQoKTtcbiAgICAgIHRoaXMuc3RhcnRMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMuYXBwZW5kTG9hZGluZ0luZGljYXRvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICAgIHRoaXMubG9hZGluZ1RleHQgPSBcIlwiO1xuICAgICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMuaW5wdXRFbC5kaXNhYmxlZCA9IGxvYWRpbmc7XG4gICAgdGhpcy5zZW5kQnV0dG9uRWwuaGlkZGVuID0gbG9hZGluZztcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5oaWRkZW4gPSAhbG9hZGluZztcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIHRoaXMudXBkYXRlTW9kZWxDb250cm9sc0Rpc2FibGVkU3RhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXV0b1Jlc2l6ZUlucHV0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJlc2l6ZUZyYW1lSWQgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmVzaXplRnJhbWVJZCk7XG4gICAgfVxuICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlc2l6ZUZyYW1lSWQgPSBudWxsO1xuICAgICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IFwiYXV0b1wiO1xuICAgICAgdGhpcy5pbnB1dEVsLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRoaXMuaW5wdXRFbC5zY3JvbGxIZWlnaHQsIDI0MCl9cHhgO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUdXJuKHJvbGU6IENoYXRUdXJuW1wicm9sZVwiXSwgdGV4dDogc3RyaW5nLCBzb3VyY2VzPzogVmF1bHRRdWVyeU1hdGNoW10pOiB2b2lkIHtcbiAgICBjb25zdCB0dXJuOiBDaGF0VHVybiA9IHsgcm9sZSwgdGV4dCwgc291cmNlcyB9O1xuICAgIHRoaXMudHVybnMucHVzaCh0dXJuKTtcbiAgICB2b2lkIHRoaXMuYXBwZW5kVHVybkVsZW1lbnQodHVybik7XG4gICAgdGhpcy51cGRhdGVDbGVhckJ1dHRvbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRVcGRhdGVkRmlsZVR1cm4obWVzc2FnZTogc3RyaW5nLCBwYXRoczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBjb25zdCB0dXJuOiBDaGF0VHVybiA9IHtcbiAgICAgIHJvbGU6IFwiYnJhaW5cIixcbiAgICAgIHRleHQ6IG1lc3NhZ2UsXG4gICAgICB1cGRhdGVkUGF0aHM6IHBhdGhzLFxuICAgIH07XG4gICAgdGhpcy50dXJucy5wdXNoKHR1cm4pO1xuICAgIHZvaWQgdGhpcy5hcHBlbmRUdXJuRWxlbWVudCh0dXJuKTtcbiAgICB0aGlzLnVwZGF0ZUNsZWFyQnV0dG9uKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNsZWFyQ29udmVyc2F0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgbmV3IE5vdGljZShcIlN0b3AgdGhlIGN1cnJlbnQgcmVxdWVzdCBiZWZvcmUgY2xlYXJpbmcgdGhlIGNvbnZlcnNhdGlvbi5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnR1cm5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnR1cm5zID0gW107XG4gICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICAgIHRoaXMubWVzc2FnZXNFbC5lbXB0eSgpO1xuICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgICB0aGlzLnVwZGF0ZUNsZWFyQnV0dG9uKCk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUNsZWFyQnV0dG9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jbGVhckJ1dHRvbkVsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRpc2FibGVkID0gdGhpcy50dXJucy5sZW5ndGggPT09IDA7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLnRvZ2dsZUNsYXNzKFwiYnJhaW4tYnV0dG9uLWhpZGRlblwiLCBkaXNhYmxlZCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFR1cm5FbGVtZW50KHR1cm46IENoYXRUdXJuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuXG4gICAgY29uc3QgZW1wdHlFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtZW1wdHlcIik7XG4gICAgaWYgKGVtcHR5RWwpIHtcbiAgICAgIGVtcHR5RWwucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogYGJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtJHt0dXJuLnJvbGV9YCxcbiAgICB9KTtcbiAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBzZXRJY29uKHJvbGVJY29uLCB0aGlzLnR1cm5JY29uRm9yKHR1cm4ucm9sZSkpO1xuICAgIHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiB0aGlzLnR1cm5MYWJlbEZvcih0dXJuLnJvbGUpIH0pO1xuXG4gICAgY29uc3Qgb3V0cHV0ID0gaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1vdXRwdXRcIiB9KTtcbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IE1hcmtkb3duUmVuZGVyZXIucmVuZGVyKHRoaXMuYXBwLCB0dXJuLnRleHQsIG91dHB1dCwgXCJcIiwgdGhpcyk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgIH1cbiAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLnJlbmRlckdlbmVyYXRpb24pIHtcbiAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5hZGRDb3B5QnV0dG9ucyhvdXRwdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQuc2V0VGV4dCh0dXJuLnRleHQpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyU291cmNlcyhpdGVtLCB0dXJuLnNvdXJjZXMpO1xuICAgIH1cbiAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW5kZXJVcGRhdGVkRmlsZXMoaXRlbSwgdHVybi51cGRhdGVkUGF0aHMpO1xuICAgIH1cblxuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSB0dXJuTGFiZWxGb3Iocm9sZTogQ2hhdFR1cm5bXCJyb2xlXCJdKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHJvbGUpIHtcbiAgICAgIGNhc2UgXCJ1c2VyXCI6XG4gICAgICAgIHJldHVybiBcIllvdVwiO1xuICAgICAgY2FzZSBcImJyYWluXCI6XG4gICAgICAgIHJldHVybiBcIkJyYWluXCI7XG4gICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3JcIjtcbiAgICAgIGNhc2UgXCJpbmZvXCI6XG4gICAgICAgIHJldHVybiBcIkJyYWluXCI7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gXCJCcmFpblwiO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdHVybkljb25Gb3Iocm9sZTogQ2hhdFR1cm5bXCJyb2xlXCJdKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHJvbGUpIHtcbiAgICAgIGNhc2UgXCJ1c2VyXCI6XG4gICAgICAgIHJldHVybiBcInVzZXJcIjtcbiAgICAgIGNhc2UgXCJicmFpblwiOlxuICAgICAgICByZXR1cm4gXCJicmFpbi1jaXJjdWl0XCI7XG4gICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgcmV0dXJuIFwiYWxlcnQtdHJpYW5nbGVcIjtcbiAgICAgIGNhc2UgXCJpbmZvXCI6XG4gICAgICAgIHJldHVybiBcImluZm9cIjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcImJyYWluLWNpcmN1aXRcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZExvYWRpbmdJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtYnJhaW4gYnJhaW4tY2hhdC1tZXNzYWdlLWxvYWRpbmdcIixcbiAgICB9KTtcbiAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBzZXRJY29uKHJvbGVJY29uLCBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiQnJhaW5cIiB9KTtcblxuICAgIGNvbnN0IGxvYWRpbmcgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWxvYWRpbmdcIiB9KTtcbiAgICBjb25zdCBkb3RzID0gbG9hZGluZy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nLWRvdHNcIiB9KTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBjb25zdCBtZXRhID0gbG9hZGluZy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nLW1ldGFcIiB9KTtcbiAgICB0aGlzLmxvYWRpbmdTdGFnZUVsID0gbWV0YS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWxvYWRpbmctc3RhZ2VcIixcbiAgICAgIHRleHQ6IFwiU2VhcmNoaW5nIHZhdWx0XHUyMDI2XCIsXG4gICAgfSk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbWV0YS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWxvYWRpbmctdGltZVwiLFxuICAgICAgdGV4dDogXCIwc1wiLFxuICAgIH0pO1xuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGNvbnN0IGxvYWRpbmdFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIpO1xuICAgIGlmIChsb2FkaW5nRWwpIHtcbiAgICAgIGxvYWRpbmdFbC5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbnVsbDtcbiAgICB0aGlzLmxvYWRpbmdTdGFnZUVsID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWVzc2FnZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuICAgIHRoaXMubWVzc2FnZXNFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy50dXJucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHR1cm4gb2YgdGhpcy50dXJucykge1xuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5tZXNzYWdlc0VsLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBgYnJhaW4tY2hhdC1tZXNzYWdlIGJyYWluLWNoYXQtbWVzc2FnZS0ke3R1cm4ucm9sZX1gLFxuICAgICAgfSk7XG4gICAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgICAgY29uc3Qgcm9sZUljb24gPSByb2xlRWwuY3JlYXRlRWwoXCJzcGFuXCIpO1xuICAgICAgc2V0SWNvbihyb2xlSWNvbiwgdGhpcy50dXJuSWNvbkZvcih0dXJuLnJvbGUpKTtcbiAgICAgIHJvbGVFbC5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiB0aGlzLnR1cm5MYWJlbEZvcih0dXJuLnJvbGUpIH0pO1xuXG4gICAgICBjb25zdCBvdXRwdXQgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW91dHB1dFwiIH0pO1xuICAgICAgaWYgKHR1cm4ucm9sZSA9PT0gXCJicmFpblwiKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIHR1cm4udGV4dCwgb3V0cHV0LCBcIlwiLCB0aGlzKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5yZW5kZXJHZW5lcmF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkQ29weUJ1dHRvbnMob3V0cHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5zZXRUZXh0KHR1cm4udGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi5zb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJTb3VyY2VzKGl0ZW0sIHR1cm4uc291cmNlcyk7XG4gICAgICB9XG4gICAgICBpZiAodHVybi5yb2xlID09PSBcImJyYWluXCIgJiYgdHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgICB0aGlzLnJlbmRlclVwZGF0ZWRGaWxlcyhpdGVtLCB0dXJuLnVwZGF0ZWRQYXRocyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgdGhpcy5hcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGFydExvYWRpbmdUaW1lcigpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICB0aGlzLmxvYWRpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RpbWVyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdUaW1lcik7XG4gICAgICB0aGlzLmxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVMb2FkaW5nVGV4dCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWNvbmRzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMubG9hZGluZ1N0YXJ0ZWRBdCkgLyAxMDAwKSk7XG4gICAgY29uc3Qgc3RhZ2VMYWJlbCA9IHRoaXMubG9hZGluZ1N0YWdlID09PSBcInF1ZXJ5XCIgPyBcIlNlYXJjaGluZyB2YXVsdFwiIDogXCJBc2tpbmcgQ29kZXhcIjtcbiAgICB0aGlzLmxvYWRpbmdUZXh0ID0gYCR7c3RhZ2VMYWJlbH0gXHUwMEI3ICR7c2Vjb25kc31zYDtcbiAgICBpZiAodGhpcy5sb2FkaW5nVGV4dEVsKSB7XG4gICAgICB0aGlzLmxvYWRpbmdUZXh0RWwuc2V0VGV4dCh0aGlzLmxvYWRpbmdUZXh0KTtcbiAgICB9XG4gICAgaWYgKHRoaXMubG9hZGluZ1N0YWdlRWwpIHtcbiAgICAgIHRoaXMubG9hZGluZ1N0YWdlRWwuc2V0VGV4dCh0aGlzLmxvYWRpbmdTdGFnZSA9PT0gXCJxdWVyeVwiID8gXCJTZWFyY2hpbmcgdmF1bHRcdTIwMjZcIiA6IFwiQXNraW5nIENvZGV4XHUyMDI2XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBlbXB0eSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LWVtcHR5XCIgfSk7XG4gICAgY29uc3QgaWNvbiA9IGVtcHR5LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtZW1wdHktaWNvblwiIH0pO1xuICAgIHNldEljb24oaWNvbiwgXCJicmFpbi1jaXJjdWl0XCIpO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJTdGFydCB3aXRoIGEgcXVlc3Rpb24gb3Igcm91Z2ggY2FwdHVyZVwiIH0pO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICB0ZXh0OiBcIkJyYWluIHJldHJpZXZlcyB2YXVsdCBjb250ZXh0LCBhbnN3ZXJzIHdpdGggc291cmNlcywgYW5kIHByZXZpZXdzIHdyaXRlcyBiZWZvcmUgYW55dGhpbmcgY2hhbmdlcy5cIixcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU291cmNlcyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHZvaWQge1xuICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHsgY2xzOiBcImJyYWluLXNvdXJjZXNcIiB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBgU291cmNlcyAoJHtNYXRoLm1pbihzb3VyY2VzLmxlbmd0aCwgOCl9KWAsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcy5zbGljZSgwLCA4KSkge1xuICAgICAgY29uc3Qgc291cmNlRWwgPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXNvdXJjZVwiIH0pO1xuICAgICAgY29uc3QgdGl0bGUgPSBzb3VyY2VFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtdGl0bGVcIixcbiAgICAgICAgdGV4dDogc291cmNlLnBhdGgsXG4gICAgICB9KTtcbiAgICAgIHRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuU291cmNlKHNvdXJjZS5wYXRoKTtcbiAgICAgIH0pO1xuICAgICAgc291cmNlRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXJlYXNvblwiLFxuICAgICAgICB0ZXh0OiBzb3VyY2UucmVhc29uLFxuICAgICAgfSk7XG4gICAgICBpZiAoc291cmNlLmV4Y2VycHQpIHtcbiAgICAgICAgc291cmNlRWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtZXhjZXJwdFwiLFxuICAgICAgICAgIHRleHQ6IHNvdXJjZS5leGNlcnB0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclVwZGF0ZWRGaWxlcyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBwYXRoczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlcyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi11cGRhdGVkLWZpbGVzXCIgfSk7XG4gICAgZmlsZXMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1yZWFzb25cIixcbiAgICAgIHRleHQ6IFwiVXBkYXRlZCBmaWxlc1wiLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuICAgICAgY29uc3QgYnV0dG9uID0gZmlsZXMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXRpdGxlXCIsXG4gICAgICAgIHRleHQ6IHBhdGgsXG4gICAgICB9KTtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlblNvdXJjZShwYXRoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNOZWFyQm90dG9tKHRocmVzaG9sZCA9IDYwKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZWwgPSB0aGlzLm1lc3NhZ2VzRWw7XG4gICAgcmV0dXJuIGVsLnNjcm9sbEhlaWdodCAtIGVsLnNjcm9sbFRvcCAtIGVsLmNsaWVudEhlaWdodCA8IHRocmVzaG9sZDtcbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTY3JvbGxUb0JvdHRvbSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy51c2VyU2Nyb2xsZWRVcCkge1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsVG8oeyB0b3A6IHRoaXMubWVzc2FnZXNFbC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiBcInNtb290aFwiIH0pO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbFRvQm90dG9tRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2hvdyA9IHRoaXMudXNlclNjcm9sbGVkVXAgJiYgdGhpcy50dXJucy5sZW5ndGggPiAwO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbC50b2dnbGVDbGFzcyhcImJyYWluLXNjcm9sbC10by1ib3R0b20tLXZpc2libGVcIiwgc2hvdyk7XG4gIH1cblxuICBwcml2YXRlIGFkZENvcHlCdXR0b25zKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBjb2RlQmxvY2tzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCJwcmVcIik7XG4gICAgZm9yIChjb25zdCBwcmUgb2YgQXJyYXkuZnJvbShjb2RlQmxvY2tzKSkge1xuICAgICAgY29uc3QgY29kZSA9IHByZS5xdWVyeVNlbGVjdG9yKFwiY29kZVwiKTtcbiAgICAgIGlmICghY29kZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBidXR0b24uY2xhc3NOYW1lID0gXCJicmFpbi1jb3B5LWNvZGUtYnV0dG9uXCI7XG4gICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIFwiQ29weSBjb2RlXCIpO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY29kZS50ZXh0Q29udGVudCB8fCBcIlwiKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcGllZCFcIjtcbiAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcImNvcGllZFwiKTtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiY29waWVkXCIpO1xuICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHByZS5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3BlblNvdXJjZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNTdG9wcGVkUmVxdWVzdChlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIjtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHR5cGUgeyBWYXVsdFdyaXRlT3BlcmF0aW9uLCBWYXVsdFdyaXRlUGxhbiB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc1NhZmVNYXJrZG93blBhdGggfSBmcm9tIFwiLi4vdXRpbHMvcGF0aC1zYWZldHlcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBWYXVsdFBsYW5Nb2RhbE9wdGlvbnMge1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbjtcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIG9uQXBwcm92ZTogKHBsYW46IFZhdWx0V3JpdGVQbGFuKSA9PiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZywgcGF0aHM6IHN0cmluZ1tdKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0UGxhbk1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzZWxlY3RlZE9wZXJhdGlvbnMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkcmFmdE9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcHJpdmF0ZSBhcHByb3ZlQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBjYW5jZWxCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogVmF1bHRQbGFuTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zID0gb3B0aW9ucy5wbGFuLm9wZXJhdGlvbnMubWFwKChvcGVyYXRpb24pID0+ICh7IC4uLm9wZXJhdGlvbiB9KSk7XG4gICAgdGhpcy5kcmFmdE9wZXJhdGlvbnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCkpO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN1cGVyLmNsb3NlKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUmV2aWV3IFZhdWx0IENoYW5nZXNcIiB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYCR7dGhpcy5vcHRpb25zLnBsYW4uc3VtbWFyeSB8fCBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IGNoYW5nZXMuXCJ9IENvbmZpZGVuY2U6ICR7dGhpcy5vcHRpb25zLnBsYW4uY29uZmlkZW5jZX0uYCxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGxhbi5kcm9wcGVkT3BlcmF0aW9ucyA+IDApIHtcbiAgICAgIGNvbnN0IGRyb3BwZWQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1wbGFuLWRyb3BwZWRcIixcbiAgICAgIH0pO1xuICAgICAgZHJvcHBlZC5jcmVhdGVFbChcInN0cm9uZ1wiLCB7XG4gICAgICAgIHRleHQ6IGAke3RoaXMub3B0aW9ucy5wbGFuLmRyb3BwZWRPcGVyYXRpb25zfSBwcm9wb3NlZCBjaGFuZ2Uke3RoaXMub3B0aW9ucy5wbGFuLmRyb3BwZWRPcGVyYXRpb25zID09PSAxID8gXCIgd2FzXCIgOiBcInMgd2VyZVwifSBza2lwcGVkYCxcbiAgICAgIH0pO1xuICAgICAgZHJvcHBlZC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICB0ZXh0OiBcIkJyYWluJ3MgcGxhbiBpbmNsdWRlZCBjaGFuZ2VzIHRoYXQgdGFyZ2V0ZWQgbm9uLW1hcmtkb3duIHBhdGhzLCB0aGUgaW5zdHJ1Y3Rpb25zIGZpbGUsIGRvdC1mb2xkZXJzLCBvciBwYXRocyB3aXRoIGAuLmAuIEVkaXQgdGhlIHJlbWFpbmluZyBvcGVyYXRpb25zIGJlbG93LCBvciBhc2sgQnJhaW4gdG8gcmV0cnkuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgb3BlcmF0aW9uXSBvZiB0aGlzLmRyYWZ0T3BlcmF0aW9ucy5lbnRyaWVzKCkpIHtcbiAgICAgIHRoaXMucmVuZGVyT3BlcmF0aW9uKGluZGV4LCBvcGVyYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGxhbi5xdWVzdGlvbnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLXF1ZXN0aW9uc1wiIH0pO1xuICAgICAgcXVlc3Rpb25zLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIk9wZW4gUXVlc3Rpb25zXCIgfSk7XG4gICAgICBjb25zdCBsaXN0ID0gcXVlc3Rpb25zLmNyZWF0ZUVsKFwidWxcIik7XG4gICAgICBmb3IgKGNvbnN0IHF1ZXN0aW9uIG9mIHRoaXMub3B0aW9ucy5wbGFuLnF1ZXN0aW9ucykge1xuICAgICAgICBsaXN0LmNyZWF0ZUVsKFwibGlcIiwgeyB0ZXh0OiBxdWVzdGlvbiB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYXBwcm92ZUJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIkFwcHJvdmUgYW5kIFdyaXRlXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5hcHByb3ZlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5jYW5jZWxCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KTtcbiAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcHJvdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMud29ya2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvcGVyYXRpb25zID0gdGhpcy5kcmFmdE9wZXJhdGlvbnNcbiAgICAgIC5maWx0ZXIoKF8sIGluZGV4KSA9PiB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5oYXMoaW5kZXgpKVxuICAgICAgLm1hcCgob3BlcmF0aW9uKSA9PiAoe1xuICAgICAgICAuLi5vcGVyYXRpb24sXG4gICAgICAgIHBhdGg6IG9wZXJhdGlvbi5wYXRoLnRyaW0oKSxcbiAgICAgICAgY29udGVudDogb3BlcmF0aW9uLmNvbnRlbnQudHJpbSgpLFxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKChvcGVyYXRpb24pID0+IG9wZXJhdGlvbi5wYXRoICYmIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICBpZiAoIW9wZXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBjaGFuZ2UgdG8gYXBwbHlcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGludmFsaWRQYXRoID0gb3BlcmF0aW9ucy5maW5kKChvcGVyYXRpb24pID0+ICFpc1NhZmVNYXJrZG93blBhdGgob3BlcmF0aW9uLnBhdGgsIHRoaXMub3B0aW9ucy5zZXR0aW5ncykpO1xuICAgIGlmIChpbnZhbGlkUGF0aCkge1xuICAgICAgbmV3IE5vdGljZShgSW52YWxpZCB0YXJnZXQgcGF0aDogJHtpbnZhbGlkUGF0aC5wYXRofWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0QnV0dG9uc0VuYWJsZWQoZmFsc2UpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXRocyA9IGF3YWl0IHRoaXMub3B0aW9ucy5vbkFwcHJvdmUoe1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMucGxhbixcbiAgICAgICAgb3BlcmF0aW9ucyxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHBhdGhzLmxlbmd0aFxuICAgICAgICA/IGBVcGRhdGVkICR7cGF0aHMuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiBcIk5vIHZhdWx0IGNoYW5nZXMgd2VyZSBhcHBsaWVkXCI7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uQ29tcGxldGUobWVzc2FnZSwgcGF0aHMpO1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXBwbHkgdmF1bHQgY2hhbmdlc1wiKTtcbiAgICAgIHRoaXMuc2V0QnV0dG9uc0VuYWJsZWQodHJ1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0QnV0dG9uc0VuYWJsZWQoZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmFwcHJvdmVCdXR0b25FbCkge1xuICAgICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgIHRoaXMuYXBwcm92ZUJ1dHRvbkVsLnRleHRDb250ZW50ID0gZW5hYmxlZCA/IFwiQXBwcm92ZSBhbmQgV3JpdGVcIiA6IFwiV3JpdGluZy4uLlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5jYW5jZWxCdXR0b25FbCkge1xuICAgICAgdGhpcy5jYW5jZWxCdXR0b25FbC5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT3BlcmF0aW9uKGluZGV4OiBudW1iZXIsIG9wZXJhdGlvbjogVmF1bHRXcml0ZU9wZXJhdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvblwiIH0pO1xuICAgIGNvbnN0IGhlYWRlciA9IGl0ZW0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBjaGVja2JveCA9IGhlYWRlci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGF0dHI6IHsgdHlwZTogXCJjaGVja2JveFwiIH0sXG4gICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuaGFzKGluZGV4KTtcbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5kZWxldGUoaW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBkZXNjcmliZU9wZXJhdGlvbihvcGVyYXRpb24pIH0pO1xuXG4gICAgaWYgKG9wZXJhdGlvbi5kZXNjcmlwdGlvbikge1xuICAgICAgaXRlbS5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1wbGFuLWRlc2NyaXB0aW9uXCIsXG4gICAgICAgIHRleHQ6IG9wZXJhdGlvbi5kZXNjcmlwdGlvbixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdGhJbnB1dCA9IGl0ZW0uY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tbW9kYWwtaW5wdXQgYnJhaW4tcGxhbi1wYXRoLWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICBcImFyaWEtbGFiZWxcIjogXCJUYXJnZXQgbWFya2Rvd24gcGF0aFwiLFxuICAgICAgfSxcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHBhdGhJbnB1dC52YWx1ZSA9IG9wZXJhdGlvbi5wYXRoO1xuICAgIHBhdGhJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdID0ge1xuICAgICAgICAuLi50aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0sXG4gICAgICAgIHBhdGg6IHBhdGhJbnB1dC52YWx1ZSxcbiAgICAgIH0gYXMgVmF1bHRXcml0ZU9wZXJhdGlvbjtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRleHRhcmVhID0gaXRlbS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLWVkaXRvclwiLFxuICAgICAgYXR0cjogeyByb3dzOiBcIjEwXCIgfSxcbiAgICB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IG9wZXJhdGlvbi5jb250ZW50O1xuICAgIHRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0gPSB7XG4gICAgICAgIC4uLnRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSxcbiAgICAgICAgY29udGVudDogdGV4dGFyZWEudmFsdWUsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbjogVmF1bHRXcml0ZVBsYW5bXCJvcGVyYXRpb25zXCJdW251bWJlcl0pOiBzdHJpbmcge1xuICBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiYXBwZW5kXCIpIHtcbiAgICByZXR1cm4gYEFwcGVuZCB0byAke29wZXJhdGlvbi5wYXRofWA7XG4gIH1cbiAgcmV0dXJuIGBDcmVhdGUgJHtvcGVyYXRpb24ucGF0aH1gO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKipcbiAqIENlbnRyYWxpemVkIGVycm9yIGhhbmRsaW5nIHV0aWxpdHlcbiAqIFN0YW5kYXJkaXplcyBlcnJvciByZXBvcnRpbmcgYWNyb3NzIHRoZSBwbHVnaW5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0Vycm9yKGVycm9yOiB1bmtub3duLCBkZWZhdWx0TWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZTtcbiAgbmV3IE5vdGljZShtZXNzYWdlKTtcbn1cbiIsICJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW50ZXJmYWNlIEJyYWluQ29tbWFuZEhvc3Qge1xuICBhZGRDb21tYW5kOiBQbHVnaW5bXCJhZGRDb21tYW5kXCJdO1xuICBvcGVuU2lkZWJhcigpOiBQcm9taXNlPHZvaWQ+O1xuICBvcGVuSW5zdHJ1Y3Rpb25zRmlsZSgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21tYW5kcyhwbHVnaW46IEJyYWluQ29tbWFuZEhvc3QpOiB2b2lkIHtcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm9wZW4tdmF1bHQtY2hhdFwiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gVmF1bHQgQ2hhdFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3BlblNpZGViYXIoKTtcbiAgICB9LFxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi1pbnN0cnVjdGlvbnNcIixcbiAgICBuYW1lOiBcIkJyYWluOiBPcGVuIEluc3RydWN0aW9uc1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBwbHVnaW4ub3Blbkluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICB9LFxuICB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUFzQzs7O0FDTy9CLElBQU0seUJBQThDO0FBQUEsRUFDekQsYUFBYTtBQUFBLEVBQ2Isa0JBQWtCO0FBQUEsRUFDbEIsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQ2xCO0FBRU8sU0FBUyx1QkFDZCxPQUNxQjtBQUNyQixRQUFNLFNBQThCO0FBQUEsSUFDbEMsR0FBRztBQUFBLElBQ0gsR0FBRztBQUFBLEVBQ0w7QUFFQSxTQUFPO0FBQUEsSUFDTCxhQUFhO0FBQUEsTUFDWCxPQUFPO0FBQUEsTUFDUCx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLElBQ0Esa0JBQWtCO0FBQUEsTUFDaEIsT0FBTztBQUFBLE1BQ1AsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLFlBQVksT0FBTyxPQUFPLGVBQWUsV0FBVyxPQUFPLFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDL0UsZ0JBQWdCLHdCQUF3QixPQUFPLGNBQWM7QUFBQSxFQUMvRDtBQUNGO0FBRUEsU0FBUyxzQkFBc0IsT0FBZ0IsVUFBMEI7QUFDdkUsTUFBSSxPQUFPLFVBQVUsVUFBVTtBQUM3QixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sYUFBYSxNQUFNLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRSxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RFLFNBQU8sY0FBYztBQUN2QjtBQUVBLFNBQVMsd0JBQXdCLE9BQXdCO0FBQ3ZELE1BQUksT0FBTyxVQUFVLFVBQVU7QUFDN0IsV0FBTyx1QkFBdUI7QUFBQSxFQUNoQztBQUNBLFNBQU8sTUFDSixNQUFNLElBQUksRUFDVixJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRSxFQUFFLFFBQVEsUUFBUSxFQUFFLENBQUMsRUFDakUsT0FBTyxPQUFPLEVBQ2QsS0FBSyxJQUFJO0FBQ2Q7QUFFTyxTQUFTLG9CQUFvQixnQkFBa0M7QUFDcEUsU0FBTyxlQUNKLE1BQU0sSUFBSSxFQUNWLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLEVBQ3pCLE9BQU8sT0FBTztBQUNuQjs7O0FDN0RBLHNCQUFzRTs7O0FDWS9ELFNBQVMsaUJBQThCO0FBQzVDLFNBQU8sU0FBUyxnQkFBZ0IsRUFBRTtBQUNwQztBQW1CQSxTQUFTLGtCQUE0QztBQUNuRCxRQUFNLE1BQU0sZUFBZTtBQUMzQixTQUFPLElBQUksZUFBZTtBQUM1QjtBQUVPLFNBQVMsa0JBS2Q7QUFDQSxRQUFNLE1BQU0sZUFBZTtBQUMzQixTQUFPO0FBQUEsSUFDTCxVQUFVLGdCQUFnQixFQUFFO0FBQUEsSUFDNUIsSUFBSSxJQUFJLGFBQWE7QUFBQSxJQUNyQixJQUFJLElBQUksSUFBSTtBQUFBLElBQ1osTUFBTSxJQUFJLE1BQU07QUFBQSxFQUNsQjtBQUNGO0FBRU8sU0FBUyxtQkFBb0M7QUFDbEQsUUFBTSxNQUFNLGVBQWU7QUFDM0IsUUFBTSxFQUFFLFVBQVUsSUFBSSxJQUFJLE1BQU07QUFDaEMsU0FBTyxVQUFVLGdCQUFnQixFQUFFLFFBQVE7QUFDN0M7QUFFTyxTQUFTLGNBQWMsT0FBZ0Q7QUFDNUUsU0FBTyxPQUFPLFVBQVUsWUFBWSxVQUFVLFFBQVEsVUFBVSxTQUFTLE1BQU0sU0FBUztBQUMxRjtBQUVPLFNBQVMsZUFBZSxPQUFnRDtBQUM3RSxTQUFPLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxZQUFZLFNBQVMsTUFBTSxXQUFXO0FBQzlGO0FBRU8sU0FBUyxhQUFhLE9BQXlCO0FBQ3BELFNBQU8sT0FBTyxVQUFVLFlBQ3RCLFVBQVUsUUFDVixVQUFVLFNBQ1YsTUFBTSxTQUFTO0FBQ25CO0FBRU8sU0FBUyx5QkFBeUIsT0FBeUI7QUFDaEUsU0FBTyxpQkFBaUIsa0JBQWtCLGlCQUFpQjtBQUM3RDs7O0FDeEVBLElBQU0sZ0NBQWdDO0FBRS9CLFNBQVMsc0JBQXNCLFFBQWtDO0FBQ3RFLFFBQU0sYUFBYSxPQUFPLEtBQUssRUFBRSxZQUFZO0FBQzdDLE1BQUksQ0FBQyxZQUFZO0FBQ2YsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJLFdBQVcsU0FBUyxlQUFlLEtBQUssV0FBVyxTQUFTLFlBQVksR0FBRztBQUM3RSxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQ0UsV0FBVyxTQUFTLFdBQVcsS0FDL0IsV0FBVyxTQUFTLFdBQVcsS0FDL0IsV0FBVyxTQUFTLGVBQWUsR0FDbkM7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUVBLFNBQU87QUFDVDtBQUVBLGVBQXNCLHNCQUFpRDtBQUNyRSxNQUFJO0FBQ0YsVUFBTSxjQUFjLE1BQU0sbUJBQW1CO0FBQzdDLFFBQUksQ0FBQyxhQUFhO0FBQ2hCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxnQkFBZ0IsaUJBQWlCO0FBQ3ZDLFVBQU0sRUFBRSxRQUFRLE9BQU8sSUFBSSxNQUFNLGNBQWMsYUFBYSxDQUFDLFNBQVMsUUFBUSxHQUFHO0FBQUEsTUFDL0UsV0FBVyxPQUFPO0FBQUEsTUFDbEIsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUNELFdBQU8sc0JBQXNCLEdBQUcsTUFBTTtBQUFBLEVBQUssTUFBTSxFQUFFO0FBQUEsRUFDckQsU0FBUyxPQUFPO0FBQ2QsUUFBSSxjQUFjLEtBQUssS0FBSyxlQUFlLEtBQUssS0FBSyx5QkFBeUIsS0FBSyxHQUFHO0FBQ3BGLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLGVBQXNCLHFCQUE2QztBQUNqRSxNQUFJO0FBQ0osTUFBSTtBQUNGLFVBQU0sZUFBZTtBQUFBLEVBQ3ZCLFNBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sS0FBSyxJQUFJLElBQUk7QUFDbkIsUUFBTSxPQUFPLElBQUksTUFBTTtBQUN2QixRQUFNLEtBQUssSUFBSSxJQUFJO0FBRW5CLFFBQU0sYUFBYSxxQkFBcUIsTUFBTSxHQUFHLFFBQVEsQ0FBQztBQUMxRCxhQUFXLGFBQWEsWUFBWTtBQUNsQyxRQUFJO0FBQ0YsWUFBTSxHQUFHLFNBQVMsT0FBTyxTQUFTO0FBQ2xDLGFBQU87QUFBQSxJQUNULFNBQVE7QUFBQSxJQUVSO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFDVDtBQUVBLFNBQVMscUJBQXFCLFlBQW1DLFNBQTJCO0FBekU1RjtBQTBFRSxRQUFNLGFBQWEsb0JBQUksSUFBWTtBQUNuQyxRQUFNLGdCQUFlLGFBQVEsSUFBSSxTQUFaLFlBQW9CLElBQUksTUFBTSxXQUFXLFNBQVMsRUFBRSxPQUFPLE9BQU87QUFFdkYsYUFBVyxTQUFTLGFBQWE7QUFDL0IsZUFBVyxJQUFJLFdBQVcsS0FBSyxPQUFPLG9CQUFvQixDQUFDLENBQUM7QUFBQSxFQUM5RDtBQUVBLFFBQU0sYUFBdUI7QUFBQSxJQUMzQjtBQUFBLElBQ0E7QUFBQSxJQUNBLEdBQUcsT0FBTztBQUFBLElBQ1YsR0FBRyxPQUFPO0FBQUEsSUFDVixHQUFHLE9BQU87QUFBQSxJQUNWLEdBQUcsT0FBTztBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBRUEsTUFBSSxRQUFRLGFBQWEsU0FBUztBQUNoQyxRQUFJLFFBQVEsSUFBSSxTQUFTO0FBQ3ZCLGlCQUFXLEtBQUssV0FBVyxLQUFLLFFBQVEsSUFBSSxTQUFTLEtBQUssQ0FBQztBQUFBLElBQzdEO0FBQ0EsUUFBSSxRQUFRLElBQUksY0FBYztBQUM1QixpQkFBVyxLQUFLLFdBQVcsS0FBSyxRQUFRLElBQUksY0FBYyxZQUFZLE9BQU8sQ0FBQztBQUFBLElBQ2hGO0FBQUEsRUFDRjtBQUVBLGFBQVcsT0FBTyxZQUFZO0FBQzVCLGVBQVcsSUFBSSxXQUFXLEtBQUssS0FBSyxvQkFBb0IsQ0FBQyxDQUFDO0FBQUEsRUFDNUQ7QUFFQSxTQUFPLE1BQU0sS0FBSyxVQUFVO0FBQzlCO0FBRUEsU0FBUyxzQkFBOEI7QUFDckMsU0FBTyxRQUFRLGFBQWEsVUFBVSxjQUFjO0FBQ3REOzs7QUNuR0EsZUFBc0IseUJBQ3BCLFVBQ2dDO0FBQ2hDLFFBQU0sY0FBYyxNQUFNLG9CQUFvQjtBQUM5QyxNQUFJLGdCQUFnQixlQUFlO0FBQ2pDLFdBQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLE9BQU87QUFBQSxNQUNQLFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUVBLE1BQUksZ0JBQWdCLGFBQWE7QUFDL0IsV0FBTztBQUFBLE1BQ0wsWUFBWTtBQUFBLE1BQ1osVUFBVTtBQUFBLE1BQ1YsT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBRUEsUUFBTSxRQUFRLFNBQVMsV0FBVyxLQUFLLEtBQUs7QUFDNUMsU0FBTztBQUFBLElBQ0wsWUFBWTtBQUFBLElBQ1osVUFBVTtBQUFBLElBQ1Y7QUFBQSxJQUNBLFNBQVMsUUFDTCxpQ0FBaUMsS0FBSyxNQUN0QztBQUFBLEVBQ047QUFDRjs7O0FDakNPLElBQU0sOEJBQWtEO0FBQUEsRUFDN0QsRUFBRSxPQUFPLElBQUksT0FBTyxrQkFBa0I7QUFDeEM7QUFFTyxJQUFNLDJCQUEyQjtBQUN4QyxJQUFNLGlDQUFpQztBQUV2QyxlQUFzQixnQ0FBNkQ7QUFDakYsUUFBTSxjQUFjLE1BQU0sbUJBQW1CO0FBQzdDLE1BQUksQ0FBQyxhQUFhO0FBQ2hCLFdBQU87QUFBQSxFQUNUO0FBRUEsTUFBSTtBQUNGLFVBQU0sZ0JBQWdCLGlCQUFpQjtBQUN2QyxVQUFNLEVBQUUsUUFBUSxPQUFPLElBQUksTUFBTSxjQUFjLGFBQWEsQ0FBQyxTQUFTLFFBQVEsR0FBRztBQUFBLE1BQy9FLFdBQVcsT0FBTyxPQUFPO0FBQUEsTUFDekIsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUNELFdBQU8sdUJBQXVCLEdBQUcsTUFBTTtBQUFBLEVBQUssTUFBTSxFQUFFO0FBQUEsRUFDdEQsU0FBUTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFTyxTQUFTLHVCQUF1QixRQUFvQztBQWpDM0U7QUFrQ0UsUUFBTSxXQUFXLGtCQUFrQixNQUFNO0FBQ3pDLE1BQUksQ0FBQyxVQUFVO0FBQ2IsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJO0FBQ0YsVUFBTSxTQUFTLEtBQUssTUFBTSxRQUFRO0FBT2xDLFVBQU0sT0FBTyxvQkFBSSxJQUFZO0FBQzdCLFVBQU0sVUFBVSxDQUFDLEdBQUcsMkJBQTJCO0FBQy9DLGVBQVcsVUFBUyxZQUFPLFdBQVAsWUFBaUIsQ0FBQyxHQUFHO0FBQ3ZDLFlBQU0sT0FBTyxPQUFPLE1BQU0sU0FBUyxXQUFXLE1BQU0sS0FBSyxLQUFLLElBQUk7QUFDbEUsVUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksR0FBRztBQUMzQjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLE1BQU0sZUFBZSxVQUFhLE1BQU0sZUFBZSxRQUFRO0FBQ2pFO0FBQUEsTUFDRjtBQUNBLFdBQUssSUFBSSxJQUFJO0FBQ2IsY0FBUSxLQUFLO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxPQUFPLE9BQU8sTUFBTSxpQkFBaUIsWUFBWSxNQUFNLGFBQWEsS0FBSyxJQUNyRSxNQUFNLGFBQWEsS0FBSyxJQUN4QjtBQUFBLE1BQ04sQ0FBQztBQUFBLElBQ0g7QUFDQSxXQUFPO0FBQUEsRUFDVCxTQUFRO0FBQ04sV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVPLFNBQVMsMkJBQ2QsT0FDQSxVQUF1Qyw2QkFDL0I7QUFDUixRQUFNLGFBQWEsTUFBTSxLQUFLO0FBQzlCLE1BQUksQ0FBQyxZQUFZO0FBQ2YsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPLFFBQVEsS0FBSyxDQUFDLFdBQVcsT0FBTyxVQUFVLFVBQVUsSUFDdkQsYUFDQTtBQUNOO0FBRU8sU0FBUyxrQkFDZCxPQUNBLFVBQXVDLDZCQUM5QjtBQUNULFFBQU0sYUFBYSxNQUFNLEtBQUs7QUFDOUIsU0FBTyxRQUFRLEtBQUssQ0FBQyxXQUFXLE9BQU8sVUFBVSxVQUFVO0FBQzdEO0FBRUEsU0FBUyxrQkFBa0IsUUFBK0I7QUFDeEQsUUFBTSxRQUFRLE9BQU8sUUFBUSxHQUFHO0FBQ2hDLFFBQU0sTUFBTSxPQUFPLFlBQVksR0FBRztBQUNsQyxNQUFJLFVBQVUsTUFBTSxRQUFRLE1BQU0sT0FBTyxPQUFPO0FBQzlDLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTyxPQUFPLE1BQU0sT0FBTyxNQUFNLENBQUM7QUFDcEM7OztBSnZGQSxJQUFNLHNCQUFzQjtBQUVyQixJQUFNLGtCQUFOLGNBQThCLGlDQUFpQjtBQUFBLEVBU3BELFlBQVksS0FBVSxRQUFxQjtBQUN6QyxVQUFNLEtBQUssTUFBTTtBQVJuQixTQUFRLGVBQW1DO0FBQzNDLFNBQVEsc0JBQXNCO0FBQzlCLFNBQVEscUJBQXFCO0FBQzdCLFNBQVEsbUJBQW1CO0FBQzNCLFNBQVEsaUJBQXFDO0FBQzdDLFNBQVEsZ0JBQWdDO0FBSXRDLFNBQUssU0FBUztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxVQUFnQjtBQUNkLFVBQU0sRUFBRSxZQUFZLElBQUk7QUFDeEIsZ0JBQVksTUFBTTtBQUNsQixnQkFBWSxTQUFTLGdCQUFnQjtBQUNyQyxnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXJELFNBQUsscUJBQXFCLFdBQVc7QUFFckMsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFaEQsU0FBSyx3QkFBd0IsV0FBVztBQUN4QyxTQUFLLG9CQUFvQixXQUFXO0FBQ3BDLFNBQUssbUJBQW1CLFdBQVc7QUFFbkMsUUFBSSxDQUFDLEtBQUssdUJBQXVCLENBQUMsS0FBSyxvQkFBb0I7QUFDekQsV0FBSyxLQUFLLG9CQUFvQjtBQUFBLElBQ2hDLE9BQU87QUFDTCxXQUFLLHlCQUF5QjtBQUFBLElBQ2hDO0FBQUEsRUFDRjtBQUFBLEVBRVEscUJBQXFCLGFBQWdDO0FBQzNELGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRTlDLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGNBQWMsRUFDdEIsUUFBUSwwRUFBMEUsRUFDbEY7QUFBQSxNQUFRLENBQUMsU0FDUixLQUFLO0FBQUEsUUFDSDtBQUFBLFFBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxRQUNyQixDQUFDLFVBQVU7QUFDVCxlQUFLLE9BQU8sU0FBUyxjQUFjO0FBQUEsUUFDckM7QUFBQSxRQUNBLENBQUMsVUFBVTtBQUNULGNBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztBQUNqQixnQkFBSSx1QkFBTyw4QkFBOEI7QUFDekMsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxtQkFBbUIsRUFDM0IsUUFBUSw4REFBOEQsRUFDdEU7QUFBQSxNQUFRLENBQUMsU0FDUixLQUFLO0FBQUEsUUFDSDtBQUFBLFFBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxRQUNyQixDQUFDLFVBQVU7QUFDVCxlQUFLLE9BQU8sU0FBUyxtQkFBbUI7QUFBQSxRQUMxQztBQUFBLFFBQ0EsQ0FBQyxVQUFVO0FBQ1QsY0FBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO0FBQ2pCLGdCQUFJLHVCQUFPLG1DQUFtQztBQUM5QyxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGtCQUFrQixFQUMxQixRQUFRLHlHQUF5RyxFQUNqSCxZQUFZLENBQUMsU0FBUztBQUNyQixXQUFLLFNBQVMsS0FBSyxPQUFPLFNBQVMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxVQUFVO0FBQ3JFLGFBQUssT0FBTyxTQUFTLGlCQUFpQjtBQUFBLE1BQ3hDLENBQUM7QUFDRCxXQUFLLFFBQVEsaUJBQWlCLFFBQVEsTUFBTTtBQUMxQyxhQUFLLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDaEMsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUVRLG9CQUFvQixhQUFnQztBQUMxRCxTQUFLLGdCQUFnQixJQUFJLHdCQUFRLFdBQVcsRUFDekMsUUFBUSxjQUFjLEVBQ3RCLFFBQVEsOEJBQThCO0FBQ3pDLFNBQUssS0FBSyxtQkFBbUIsS0FBSyxhQUFhO0FBQUEsRUFDakQ7QUFBQSxFQUVRLHdCQUF3QixhQUFnQztBQUM5RCxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxhQUFhLEVBQ3JCO0FBQUEsTUFDQztBQUFBLElBQ0YsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQ0csY0FBYyxrQkFBa0IsRUFDaEMsT0FBTyxFQUNQLFFBQVEsWUFBWTtBQUNuQixjQUFNLEtBQUssT0FBTyxZQUFZLE1BQU07QUFBQSxNQUN0QyxDQUFDO0FBQUEsSUFDTCxFQUNDO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FDRyxjQUFjLGdCQUFnQixFQUM5QixRQUFRLFlBQVk7QUFqSS9CO0FBa0lZLG1CQUFLLGtCQUFMLG1CQUFvQixRQUFRO0FBQzVCLGNBQU0sS0FBSyxtQkFBbUIsS0FBSyxlQUFlLElBQUk7QUFDdEQsYUFBSyx5QkFBeUI7QUFBQSxNQUNoQyxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0o7QUFBQSxFQUVRLG1CQUFtQixhQUFnQztBQUN6RCxVQUFNLFVBQVUsWUFBWSxVQUFVLEVBQUUsS0FBSyxvQkFBb0IsQ0FBQztBQUNsRSxTQUFLLGlCQUFpQjtBQUN0QixRQUFJLHdCQUFRLE9BQU8sRUFDaEIsUUFBUSxhQUFhLEVBQ3JCO0FBQUEsTUFDQyxLQUFLLHNCQUNELG1EQUNBO0FBQUEsSUFDTixFQUNDLFlBQVksQ0FBQyxhQUFhO0FBQ3pCLGlCQUFXLFVBQVUsS0FBSyxjQUFjO0FBQ3RDLGlCQUFTLFVBQVUsT0FBTyxPQUFPLE9BQU8sS0FBSztBQUFBLE1BQy9DO0FBQ0EsZUFDRyxVQUFVLDBCQUEwQixXQUFXLEVBQy9DO0FBQUEsUUFDQyxLQUFLLG1CQUNELDJCQUNBLDJCQUEyQixLQUFLLE9BQU8sU0FBUyxZQUFZLEtBQUssWUFBWTtBQUFBLE1BQ25GLEVBQ0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsWUFBSSxVQUFVLDBCQUEwQjtBQUN0QyxlQUFLLG1CQUFtQjtBQUN4QixlQUFLLG9CQUFvQjtBQUN6QjtBQUFBLFFBQ0Y7QUFDQSxhQUFLLG1CQUFtQjtBQUN4QixhQUFLLE9BQU8sU0FBUyxhQUFhO0FBQ2xDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFDL0IsYUFBSyxvQkFBb0I7QUFDekIsYUFBSyx5QkFBeUI7QUFBQSxNQUNoQyxDQUFDO0FBQUEsSUFDTCxDQUFDLEVBQ0EsVUFBVSxDQUFDLFdBQVc7QUFDckIsYUFBTyxjQUFjLFFBQVE7QUFDN0IsYUFBTyxRQUFRLE1BQU07QUFDbkIsYUFBSyxLQUFLLG9CQUFvQjtBQUFBLE1BQ2hDLENBQUM7QUFBQSxJQUNILENBQUM7QUFFSCxRQUNFLEtBQUssb0JBQ0wsMkJBQTJCLEtBQUssT0FBTyxTQUFTLFlBQVksS0FBSyxZQUFZLE1BQU0sMEJBQ25GO0FBQ0EsVUFBSSxhQUFhLEtBQUssb0JBQW9CLGtCQUFrQixLQUFLLE9BQU8sU0FBUyxZQUFZLEtBQUssWUFBWSxJQUMxRyxLQUNBLEtBQUssT0FBTyxTQUFTO0FBQ3pCLFVBQUksS0FBSyxvQkFBb0IsS0FBSyxPQUFPLFNBQVMsV0FBVyxLQUFLLEdBQUc7QUFDbkUsWUFBSSx3QkFBUSxPQUFPLEVBQ2hCLFFBQVEsb0JBQW9CLEVBQzVCLFFBQVEsS0FBSyxPQUFPLFNBQVMsV0FBVyxLQUFLLENBQUM7QUFBQSxNQUNuRDtBQUNBLFVBQUksd0JBQVEsT0FBTyxFQUNoQixRQUFRLG9CQUFvQixFQUM1QixRQUFRLGdEQUFnRCxFQUN4RCxRQUFRLENBQUMsU0FBUztBQUNqQixhQUNHLFNBQVMsVUFBVSxFQUNuQixTQUFTLENBQUMsVUFBVTtBQUNuQix1QkFBYTtBQUFBLFFBQ2YsQ0FBQztBQUNILGFBQUssUUFBUSxpQkFBaUIsUUFBUSxNQUFNO0FBQzFDLGVBQUssS0FBSyxxQkFBcUIsVUFBVTtBQUFBLFFBQzNDLENBQUM7QUFDRCxhQUFLLFFBQVEsaUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQ2xELGNBQUksTUFBTSxRQUFRLFNBQVM7QUFDekIsa0JBQU0sZUFBZTtBQUNyQixpQkFBSyxRQUFRLEtBQUs7QUFBQSxVQUNwQjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUFBLElBQ0w7QUFFQSxTQUFLLHlCQUF5QjtBQUFBLEVBQ2hDO0FBQUEsRUFFUSwyQkFBaUM7QUFDdkMsUUFBSSxDQUFDLEtBQUssZ0JBQWdCO0FBQ3hCO0FBQUEsSUFDRjtBQUNBLFVBQU0sV0FBVyxLQUFLO0FBQ3RCLFNBQUssZUFDRixpQkFBd0QsZ0JBQWdCLEVBQ3hFLFFBQVEsQ0FBQyxPQUFPO0FBQ2YsU0FBRyxXQUFXO0FBQUEsSUFDaEIsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUVBLE1BQWMsc0JBQXFDO0FBQ2pELFNBQUssc0JBQXNCO0FBQzNCLFNBQUssb0JBQW9CO0FBQ3pCLFFBQUk7QUFDRixXQUFLLGVBQWUsTUFBTSw4QkFBOEI7QUFBQSxJQUMxRCxVQUFFO0FBQ0EsV0FBSyxxQkFBcUI7QUFDMUIsV0FBSyxzQkFBc0I7QUFDM0IsV0FBSyxvQkFBb0I7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLHNCQUE0QjtBQUNsQyxRQUFJLENBQUMsS0FBSyxnQkFBZ0I7QUFDeEI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxTQUFTLEtBQUssZUFBZTtBQUNuQyxRQUFJLENBQUMsUUFBUTtBQUNYO0FBQUEsSUFDRjtBQUNBLFVBQU0sYUFBYSxLQUFLLGVBQWUsU0FBUyxTQUFTLGFBQWE7QUFDdEUsU0FBSyxlQUFlLE9BQU87QUFDM0IsU0FBSyxtQkFBbUIsTUFBTTtBQUM5QixRQUFJLGNBQWMsS0FBSyxnQkFBZ0I7QUFDckMsWUFBTSxZQUFZLEtBQUssZUFBZTtBQUFBLFFBQ3BDO0FBQUEsTUFDRjtBQUNBLDZDQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQWMscUJBQXFCLE9BQThCO0FBQy9ELFVBQU0sUUFBUSxNQUFNLEtBQUs7QUFDekIsUUFBSSxDQUFDLE9BQU87QUFDVixXQUFLLG1CQUFtQjtBQUN4QixXQUFLLG9CQUFvQjtBQUN6QjtBQUFBLElBQ0Y7QUFDQSxTQUFLLG1CQUFtQjtBQUN4QixTQUFLLE9BQU8sU0FBUyxhQUFhO0FBQ2xDLFVBQU0sS0FBSyxPQUFPLGFBQWE7QUFDL0IsU0FBSyxvQkFBb0I7QUFDekIsU0FBSyx5QkFBeUI7QUFBQSxFQUNoQztBQUFBLEVBRVEsMkJBQWlDO0FBQ3ZDLFFBQUksS0FBSyxlQUFlO0FBQ3RCLFdBQUssS0FBSyxtQkFBbUIsS0FBSyxhQUFhO0FBQUEsSUFDakQ7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLG1CQUFtQixTQUF5QixRQUFRLE9BQXNCO0FBQ3RGLFFBQUksQ0FBQyxTQUFTO0FBQ1o7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPO0FBQ1QsY0FBUSxRQUFRLGdDQUFnQztBQUFBLElBQ2xEO0FBQ0EsUUFBSTtBQUNGLFlBQU0sU0FBUyxNQUFNLHlCQUF5QixLQUFLLE9BQU8sUUFBUTtBQUNsRSxjQUFRLFFBQVEsT0FBTyxPQUFPO0FBQUEsSUFDaEMsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLEtBQUs7QUFDbkIsY0FBUSxRQUFRLG1DQUFtQztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUFBLEVBRVEsZ0JBQ04sTUFDQSxPQUNBLGVBQ0EsVUFDZTtBQUNmLFFBQUksaUJBQWlCO0FBRXJCLFNBQUssU0FBUyxLQUFLLEVBQUUsU0FBUyxDQUFDLGNBQWM7QUFDM0MsVUFBSSxDQUFDLFlBQVksU0FBUyxTQUFTLEdBQUc7QUFDcEMsc0JBQWMsU0FBUztBQUN2Qix5QkFBaUI7QUFBQSxNQUNuQjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssUUFBUSxpQkFBaUIsUUFBUSxNQUFNO0FBQzFDLFlBQU0sZUFBZSxLQUFLLFFBQVE7QUFDbEMsVUFBSSxZQUFZLENBQUMsU0FBUyxZQUFZLEdBQUc7QUFDdkMsYUFBSyxTQUFTLGNBQWM7QUFDNUIsc0JBQWMsY0FBYztBQUM1QjtBQUFBLE1BQ0Y7QUFDQSxXQUFLLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQztBQUVELFNBQUssUUFBUSxpQkFBaUIsV0FBVyxDQUFDLFVBQVU7QUFDbEQsVUFDRSxNQUFNLFFBQVEsV0FDZCxDQUFDLE1BQU0sV0FDUCxDQUFDLE1BQU0sV0FDUCxDQUFDLE1BQU0sVUFDUCxDQUFDLE1BQU0sVUFDUDtBQUNBLGNBQU0sZUFBZTtBQUNyQixhQUFLLFFBQVEsS0FBSztBQUFBLE1BQ3BCO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTztBQUFBLEVBQ1Q7QUFDRjs7O0FLelVBLElBQU0sd0JBQXdCO0FBT3ZCLElBQU0saUJBQU4sTUFBcUI7QUFBQSxFQUMxQixNQUFNLGFBQ0osVUFDQSxVQUNBLGtCQUNBLFFBQ2lCO0FBQ2pCLFdBQU8sS0FBSyxvQkFBb0IsVUFBVSxVQUFVLGtCQUFrQixNQUFNO0FBQUEsRUFDOUU7QUFBQSxFQUVBLE1BQWMsb0JBQ1osVUFDQSxVQUNBLGtCQUNBLFFBQ2lCO0FBMUJyQjtBQTJCSSxVQUFNLEVBQUUsVUFBVSxJQUFJLElBQUksS0FBSyxJQUFJLGdCQUFnQjtBQUVuRCxVQUFNLGNBQWMsTUFBTSxtQkFBbUI7QUFDN0MsUUFBSSxDQUFDLGFBQWE7QUFDaEIsWUFBTSxJQUFJLE1BQU0sa0ZBQWtGO0FBQUEsSUFDcEc7QUFFQSxVQUFNLFVBQVUsTUFBTSxHQUFHLFFBQVEsS0FBSyxLQUFLLEdBQUcsT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUN2RSxVQUFNLGFBQWEsS0FBSyxLQUFLLFNBQVMsY0FBYztBQUNwRCxVQUFNLE9BQU87QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFQSxRQUFJLGtCQUFrQjtBQUNwQixXQUFLLEtBQUssUUFBUSxnQkFBZ0I7QUFBQSxJQUNwQztBQUVBLFFBQUksU0FBUyxXQUFXLEtBQUssR0FBRztBQUM5QixXQUFLLEtBQUssV0FBVyxTQUFTLFdBQVcsS0FBSyxDQUFDO0FBQUEsSUFDakQ7QUFFQSxTQUFLLEtBQUssR0FBRztBQUNiLFVBQU0sU0FBUyxLQUFLLGlCQUFpQixRQUFRO0FBRTdDLFFBQUksYUFBZ0M7QUFFcEMsUUFBSTtBQUNGLG1CQUFhLE1BQU0sa0JBQWtCLGFBQWEsTUFBTTtBQUFBLFFBQ3RELFdBQVcsT0FBTyxPQUFPO0FBQUEsUUFDekIsS0FBSztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1Q7QUFBQSxRQUNBLE9BQU87QUFBQSxNQUNULEdBQUcsUUFBUTtBQUVYLFVBQUk7QUFDSixVQUFJO0FBQ0Ysa0JBQVUsTUFBTSxHQUFHLFNBQVMsWUFBWSxNQUFNO0FBQUEsTUFDaEQsU0FBUTtBQUNOLFlBQUksV0FBVyxPQUFPLEtBQUssR0FBRztBQUM1QixvQkFBVSxXQUFXLE9BQU8sS0FBSztBQUFBLFFBQ25DLFdBQVcsV0FBVyxPQUFPLEtBQUssR0FBRztBQUNuQyxnQkFBTSxJQUFJLE1BQU0sMENBQTBDLFdBQVcsT0FBTyxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFO0FBQUEsUUFDcEcsT0FBTztBQUNMLGdCQUFNLElBQUksTUFBTSxxR0FBcUc7QUFBQSxRQUN2SDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLENBQUMsUUFBUSxLQUFLLEdBQUc7QUFDbkIsY0FBTSxJQUFJLE1BQU0sbUNBQW1DO0FBQUEsTUFDckQ7QUFDQSxhQUFPLFFBQVEsS0FBSztBQUFBLElBQ3RCLFNBQVMsT0FBTztBQUNkLFdBQUksaUNBQVEsWUFBVyxhQUFhLEtBQUssR0FBRztBQUMxQyxjQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxNQUMxQztBQUNBLFVBQUksZUFBZSxLQUFLLEdBQUc7QUFDekIsY0FBTSxJQUFJO0FBQUEsVUFDUjtBQUFBLFFBRUY7QUFBQSxNQUNGO0FBQ0EsVUFBSSxjQUFjLEtBQUssR0FBRztBQUN4QixjQUFNLElBQUksTUFBTSxrRkFBa0Y7QUFBQSxNQUNwRztBQUVBLFlBQU0saUJBQWUsOENBQVksV0FBWixtQkFBb0IsV0FDcEMsZUFBZSxPQUFPLFFBQVEsS0FDOUI7QUFDTCxVQUFJLGdCQUFnQixpQkFBaUIsT0FBTztBQUMxQyxjQUFNLElBQUksTUFBTSxHQUFHLE1BQU0sT0FBTztBQUFBLGdCQUFtQixhQUFhLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRTtBQUFBLE1BQ2pGO0FBQ0EsWUFBTTtBQUFBLElBQ1IsVUFBRTtBQUNBLFlBQU0sR0FBRyxHQUFHLFNBQVMsRUFBRSxXQUFXLE1BQU0sT0FBTyxLQUFLLENBQUMsRUFBRSxNQUFNLE1BQU0sTUFBUztBQUFBLElBQzlFO0FBQUEsRUFDRjtBQUFBLEVBRVEsaUJBQ04sVUFDUTtBQUNSLFVBQU0sUUFBa0IsQ0FBQztBQUV6QixlQUFXLFdBQVcsVUFBVTtBQUM5QixVQUFJLFFBQVEsU0FBUyxVQUFVO0FBQzdCLGNBQU0sS0FBSyxRQUFRLE9BQU87QUFBQSxNQUM1QixPQUFPO0FBQ0wsY0FBTSxLQUFLLEVBQUU7QUFDYixjQUFNLEtBQUssS0FBSztBQUNoQixjQUFNLEtBQUssRUFBRTtBQUNiLGNBQU0sS0FBSyxRQUFRLE9BQU87QUFBQSxNQUM1QjtBQUFBLElBQ0Y7QUFFQSxXQUFPLE1BQU0sS0FBSyxJQUFJO0FBQUEsRUFDeEI7QUFDRjtBQUVBLFNBQVMsa0JBQ1AsTUFDQSxNQUNBLFNBSUEsVUFDcUI7QUFDckIsU0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUE3STFDO0FBOElJLFFBQUksVUFBVTtBQUNkLFVBQU0sRUFBRSxRQUFRLE9BQU8sR0FBRyxZQUFZLElBQUk7QUFDMUMsVUFBTSxRQUFRLFNBQVMsTUFBTSxNQUFNLGFBQWEsQ0FBQyxPQUFPLFFBQVEsV0FBVztBQUN6RSxVQUFJLFNBQVM7QUFDWDtBQUFBLE1BQ0Y7QUFDQSxnQkFBVTtBQUNWLHVDQUFRLG9CQUFvQixTQUFTO0FBQ3JDLFVBQUksT0FBTztBQUNULGNBQU0sV0FBVyxZQUFZLE9BQU8sUUFBUSxNQUFNO0FBQ2xELGVBQU8sUUFBUTtBQUFBLE1BQ2pCLE9BQU87QUFDTCxnQkFBUTtBQUFBLFVBQ04sUUFBUSxlQUFlLE1BQU07QUFBQSxVQUM3QixRQUFRLGVBQWUsTUFBTTtBQUFBLFFBQy9CLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRixDQUFDO0FBQ0QsUUFBSSxVQUFVLFFBQVc7QUFDdkIsa0JBQU0sVUFBTixtQkFBYSxJQUFJO0FBQUEsSUFDbkI7QUFFQSxVQUFNLFFBQVEsTUFBTTtBQUNsQixVQUFJLFNBQVM7QUFDWDtBQUFBLE1BQ0Y7QUFDQSxZQUFNLEtBQUssU0FBUztBQUNwQixhQUFPLFdBQVcsTUFBTTtBQUN0QixZQUFJLE1BQU0sYUFBYSxRQUFRLE1BQU0sZUFBZSxNQUFNO0FBQ3hELGdCQUFNLEtBQUssU0FBUztBQUFBLFFBQ3RCO0FBQUEsTUFDRixHQUFHLElBQUk7QUFBQSxJQUNUO0FBRUEsUUFBSSxpQ0FBUSxTQUFTO0FBQ25CLFlBQU07QUFBQSxJQUNSLE9BQU87QUFDTCx1Q0FBUSxpQkFBaUIsU0FBUyxPQUFPLEVBQUUsTUFBTSxLQUFLO0FBQUEsSUFDeEQ7QUFBQSxFQUNGLENBQUM7QUFDSDtBQUVBLFNBQVMsZUFBZSxPQUFnQztBQUN0RCxTQUFPLE9BQU8sU0FBUyxLQUFLLElBQUksTUFBTSxTQUFTLE1BQU0sSUFBSTtBQUMzRDtBQUVBLFNBQVMsWUFDUCxPQUNBLFFBQ0EsUUFDcUI7QUFoTXZCO0FBaU1FLFFBQU0sYUFBYSxlQUFlLE1BQU07QUFDeEMsUUFBTSxhQUFhLGVBQWUsTUFBTTtBQUN4QyxRQUFNLFVBQVUsSUFBSSxvQkFBb0IsTUFBTSxTQUFTLEtBQUs7QUFDNUQsVUFBUSxTQUFTO0FBQ2pCLFVBQVEsU0FBUztBQUNqQixNQUFJLE1BQU0sU0FBUyxNQUFNO0FBQ3ZCLFlBQVEsT0FBTyxNQUFNO0FBQUEsRUFDdkI7QUFDQSxVQUFRLFVBQVMsV0FBTSxXQUFOLFlBQWdCO0FBQ2pDLFNBQU87QUFDVDtBQUVBLElBQU0sc0JBQU4sY0FBa0MsTUFBTTtBQUFBLEVBS3RDLFlBQVksU0FBaUIsT0FBaUI7QUFDNUMsVUFBTSxPQUFPO0FBTGYsa0JBQVM7QUFDVCxrQkFBUztBQUNULGdCQUFvQztBQUNwQyxrQkFBUztBQUdQLFNBQUssT0FBTztBQUNaLElBQUMsS0FBcUMsUUFBUTtBQUFBLEVBQ2hEO0FBQ0Y7QUFFQSxTQUFTLGVBQWUsT0FBZ0IsS0FBa0M7QUFDeEUsTUFBSSxPQUFPLFVBQVUsWUFBWSxVQUFVLFFBQVEsRUFBRSxPQUFPLFFBQVE7QUFDbEUsV0FBTztBQUFBLEVBQ1Q7QUFDQSxRQUFNLFFBQVMsTUFBa0MsR0FBRztBQUNwRCxNQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLFdBQU8sTUFBTSxLQUFLO0FBQUEsRUFDcEI7QUFDQSxNQUFJLE9BQU8sU0FBUyxLQUFLLEdBQUc7QUFDMUIsV0FBTyxNQUFNLFNBQVMsTUFBTSxFQUFFLEtBQUs7QUFBQSxFQUNyQztBQUNBLFNBQU87QUFDVDs7O0FDck9BLElBQUFDLG1CQUF1QjtBQUloQixJQUFNLG1CQUFOLE1BQXVCO0FBQUEsRUFDNUIsWUFBb0IsUUFBcUI7QUFBckI7QUFBQSxFQUFzQjtBQUFBLEVBRTFDLE1BQU0sUUFBUTtBQUNaLFFBQUksd0JBQU8sMEZBQTBGO0FBQ3JHLFdBQU8sS0FBSyx1Q0FBdUM7QUFBQSxFQUNyRDtBQUFBLEVBRUEsTUFBTSxpQkFBNEM7QUFDaEQsV0FBTyxvQkFBb0I7QUFBQSxFQUM3QjtBQUNGOzs7QUNaQSxJQUFNLHVCQUF1QjtBQUFBLEVBQzNCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLEVBQUUsS0FBSyxJQUFJO0FBRUosSUFBTSxxQkFBTixNQUF5QjtBQUFBLEVBQzlCLFlBQ21CLGNBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsTUFBTSx5QkFBMEM7QUFDOUMsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sT0FBTyxNQUFNLEtBQUssYUFBYTtBQUFBLE1BQ25DLFNBQVM7QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFVBQU0sT0FBTyxNQUFNLEtBQUssYUFBYSxTQUFTLEtBQUssSUFBSTtBQUN2RCxRQUFJLENBQUMsS0FBSyxLQUFLLEdBQUc7QUFDaEIsWUFBTSxLQUFLLGFBQWEsWUFBWSxLQUFLLE1BQU0sb0JBQW9CO0FBQ25FLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sbUJBQW9DO0FBQ3hDLFdBQU8sS0FBSyx1QkFBdUI7QUFBQSxFQUNyQztBQUNGOzs7QUN2QkEsSUFBTSxxQkFBcUI7QUFDM0IsSUFBTSx3QkFBd0I7QUFDOUIsSUFBTSw0QkFBNEI7QUFFM0IsSUFBTSxtQkFBTixNQUF1QjtBQUFBLEVBQzVCLFlBQ21CLFdBQ0Esb0JBQ0EsY0FDQSxjQUNBLGNBQ0Esa0JBQ2pCO0FBTmlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxNQUFNLFFBQ0osU0FDQSxVQUEwQixDQUFDLEdBQzNCLFFBQ0EsU0FDNEI7QUFDNUIsVUFBTSxVQUFVLFFBQVEsS0FBSztBQUM3QixRQUFJLENBQUMsU0FBUztBQUNaLFlBQU0sSUFBSSxNQUFNLHVCQUF1QjtBQUFBLElBQ3pDO0FBRUEsdUNBQVU7QUFDVixVQUFNLENBQUMsY0FBYyxPQUFPLElBQUksTUFBTSxRQUFRLElBQUk7QUFBQSxNQUNoRCxLQUFLLG1CQUFtQixpQkFBaUI7QUFBQSxNQUN6QyxLQUFLLGFBQWEsV0FBVyxPQUFPO0FBQUEsSUFDdEMsQ0FBQztBQUNELFVBQU0sVUFBVSx1QkFBdUIsUUFBUSxNQUFNLEdBQUcsa0JBQWtCLENBQUM7QUFDM0UsVUFBTSxXQUFXLEtBQUssaUJBQWlCO0FBQ3ZDLFVBQU0sZ0JBQWdCLEtBQUssYUFBYSxZQUFZO0FBQ3BELFVBQU0sV0FBVyxNQUFNLHlCQUF5QixRQUFRO0FBQ3hELFFBQUksQ0FBQyxTQUFTLFlBQVk7QUFDeEIsWUFBTSxJQUFJLE1BQU0sU0FBUyxPQUFPO0FBQUEsSUFDbEM7QUFFQSx1Q0FBVTtBQUNWLFVBQU0sV0FBVyxNQUFNLEtBQUssVUFBVTtBQUFBLE1BQ3BDO0FBQUEsUUFDRTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sU0FBUyxrQkFBa0IsY0FBYyxRQUFRO0FBQUEsUUFDbkQ7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixTQUFTLGdCQUFnQixTQUFTLGVBQWUsU0FBUyxPQUFPO0FBQUEsUUFDbkU7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUyxrQkFBa0IsUUFBUTtBQUN6QyxXQUFPO0FBQUEsTUFDTCxRQUFRLE9BQU8sVUFBVTtBQUFBLE1BQ3pCO0FBQUEsTUFDQSxNQUFNLE9BQU8sT0FBTyxLQUFLLGFBQWEsY0FBYyxPQUFPLElBQUksSUFBSTtBQUFBLE1BQ25FLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUNGO0FBRUEsU0FBUyxrQkFDUCxjQUNBLFVBQ1E7QUFDUixTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSx5QkFBeUIsU0FBUyxXQUFXO0FBQUEsSUFDN0M7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsRUFBRSxLQUFLLElBQUk7QUFDYjtBQUVBLFNBQVMsZ0JBQ1AsU0FDQSxlQUNBLFNBQ0EsU0FDUTtBQUNSLFFBQU0sUUFBa0IsQ0FBQztBQUV6QixRQUFNLGdCQUFnQixRQUFRLE1BQU0sQ0FBQyxxQkFBcUI7QUFDMUQsTUFBSSxjQUFjLFNBQVMsR0FBRztBQUM1QixVQUFNLEtBQUssdUJBQXVCO0FBQ2xDLGVBQVcsWUFBWSxlQUFlO0FBQ3BDLFlBQU0sS0FBSyxFQUFFO0FBQ2IsWUFBTSxLQUFLLEdBQUcsU0FBUyxTQUFTLFNBQVMsU0FBUyxPQUFPLEdBQUc7QUFDNUQsWUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLElBQzFCO0FBQ0EsVUFBTSxLQUFLLEVBQUU7QUFDYixVQUFNLEtBQUssS0FBSztBQUNoQixVQUFNLEtBQUssRUFBRTtBQUFBLEVBQ2Y7QUFFQSxRQUFNLEtBQUssaUJBQWlCLE9BQU8sRUFBRTtBQUNyQyxRQUFNLEtBQUssRUFBRTtBQUNiLFFBQU07QUFBQSxJQUNKLGdCQUNJLDJIQUNBO0FBQUEsRUFDTjtBQUNBLFFBQU0sS0FBSyxFQUFFO0FBQ2IsUUFBTSxLQUFLLHdCQUF3QjtBQUNuQyxRQUFNLEtBQUssV0FBVyxnQ0FBZ0M7QUFFdEQsU0FBTyxNQUFNLEtBQUssSUFBSTtBQUN4QjtBQUVBLFNBQVMsdUJBQXVCLFNBQW9DO0FBQ2xFLFNBQU8sUUFDSixJQUFJLENBQUMsUUFBUSxVQUFVO0FBQUEsSUFDdEIsYUFBYSxRQUFRLENBQUMsS0FBSyxPQUFPLElBQUk7QUFBQSxJQUN0QyxVQUFVLE9BQU8sS0FBSztBQUFBLElBQ3RCLFdBQVcsT0FBTyxNQUFNO0FBQUEsSUFDeEI7QUFBQSxJQUNBLE9BQU8sUUFBUSxNQUFNLEdBQUcseUJBQXlCO0FBQUEsRUFDbkQsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUNYLEtBQUssTUFBTTtBQUNoQjtBQUVBLFNBQVMsa0JBQWtCLFVBR3pCO0FBQ0EsUUFBTSxXQUFXLFlBQVksUUFBUTtBQUNyQyxNQUFJLENBQUMsVUFBVTtBQUNiLFdBQU87QUFBQSxNQUNMLFFBQVEsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBRUEsTUFBSTtBQUNGLFVBQU0sU0FBUyxLQUFLLE1BQU0sUUFBUTtBQUlsQyxXQUFPO0FBQUEsTUFDTCxRQUFRLE9BQU8sT0FBTyxXQUFXLFdBQVcsT0FBTyxPQUFPLEtBQUssSUFBSTtBQUFBLE1BQ25FLE1BQU0sYUFBYSxPQUFPLElBQUksSUFBSSxPQUFPLE9BQU87QUFBQSxJQUNsRDtBQUFBLEVBQ0YsU0FBUTtBQUNOLFdBQU87QUFBQSxNQUNMLFFBQVEsU0FBUyxLQUFLO0FBQUEsTUFDdEIsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLFlBQVksTUFBNkI7QUFwTWxEO0FBcU1FLFFBQU0sVUFBUyxVQUFLLE1BQU0sK0JBQStCLE1BQTFDLG1CQUE4QztBQUM3RCxNQUFJLFFBQVE7QUFDVixXQUFPLE9BQU8sS0FBSztBQUFBLEVBQ3JCO0FBQ0EsUUFBTSxRQUFRLEtBQUssUUFBUSxHQUFHO0FBQzlCLFFBQU0sTUFBTSxLQUFLLFlBQVksR0FBRztBQUNoQyxNQUFJLFVBQVUsTUFBTSxRQUFRLE1BQU0sT0FBTyxPQUFPO0FBQzlDLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTyxLQUFLLE1BQU0sT0FBTyxNQUFNLENBQUM7QUFDbEM7QUFFQSxTQUFTLGFBQWEsT0FBeUM7QUFDN0QsU0FBTyxPQUFPLFVBQVUsWUFBWSxVQUFVLFFBQVEsQ0FBQyxNQUFNLFFBQVEsS0FBSztBQUM1RTs7O0FDdE1BLElBQU0sa0JBQWtCO0FBQ3hCLElBQU0sb0JBQW9CO0FBQzFCLElBQU0sb0JBQW9CO0FBQzFCLElBQU0sYUFBYSxvQkFBSSxJQUFJO0FBQUEsRUFDekI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLENBQUM7QUFFTSxJQUFNLG9CQUFOLE1BQXdCO0FBQUEsRUFDN0IsWUFDbUIsY0FDQSxrQkFDakI7QUFGaUI7QUFDQTtBQUFBLEVBQ2hCO0FBQUEsRUFFSCxNQUFNLFdBQVcsT0FBZSxRQUFRLGlCQUE2QztBQUNuRixVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxTQUFTLFNBQVMsS0FBSztBQUM3QixVQUFNLGlCQUFpQixvQkFBb0IsU0FBUyxjQUFjO0FBQ2xFLFVBQU0sU0FBUyxNQUFNLEtBQUssYUFBYSxrQkFBa0IsR0FDdEQsT0FBTyxDQUFDLFNBQVMsa0JBQWtCLE1BQU0sU0FBUyxrQkFBa0IsY0FBYyxDQUFDLEVBQ25GLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFFM0QsVUFBTSxVQUE2QixDQUFDO0FBQ3BDLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFlBQU0sT0FBTyxNQUFNLEtBQUssYUFBYSxTQUFTLEtBQUssSUFBSTtBQUN2RCxZQUFNLFFBQVEsVUFBVSxNQUFNLE1BQU0sT0FBTyxNQUFNO0FBQ2pELFVBQUksU0FBUyxHQUFHO0FBQ2Q7QUFBQSxNQUNGO0FBQ0EsY0FBUSxLQUFLO0FBQUEsUUFDWCxNQUFNLEtBQUs7QUFBQSxRQUNYLE9BQU8sYUFBYSxNQUFNLElBQUk7QUFBQSxRQUM5QjtBQUFBLFFBQ0EsUUFBUSxZQUFZLE1BQU0sTUFBTSxPQUFPLE1BQU07QUFBQSxRQUM3QyxTQUFTLGFBQWEsTUFBTSxNQUFNO0FBQUEsUUFDbEM7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBRUEsV0FBTyxRQUNKLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxRQUFRLEtBQUssS0FBSyxFQUM5QyxNQUFNLEdBQUcsS0FBSztBQUFBLEVBQ25CO0FBQ0Y7QUFFQSxTQUFTLGtCQUFrQixNQUFhLGtCQUEwQixnQkFBbUM7QUFDbkcsTUFBSSxLQUFLLFNBQVMsa0JBQWtCO0FBQ2xDLFdBQU87QUFBQSxFQUNUO0FBQ0EsYUFBVyxVQUFVLGdCQUFnQjtBQUNuQyxVQUFNLFNBQVMsT0FBTyxTQUFTLEdBQUcsSUFBSSxTQUFTLEdBQUcsTUFBTTtBQUN4RCxRQUFJLEtBQUssU0FBUyxVQUFVLEtBQUssS0FBSyxXQUFXLE1BQU0sR0FBRztBQUN4RCxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQ1Q7QUFFTyxTQUFTLFNBQVMsT0FBeUI7QUFDaEQsUUFBTSxPQUFPLG9CQUFJLElBQVk7QUFDN0IsU0FBTyxNQUNKLFlBQVksRUFDWixNQUFNLGdCQUFnQixFQUN0QixJQUFJLENBQUMsVUFBVSxNQUFNLEtBQUssQ0FBQyxFQUMzQixPQUFPLENBQUMsVUFBVSxNQUFNLFVBQVUsQ0FBQyxFQUNuQyxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsRUFDeEMsT0FBTyxDQUFDLFVBQVU7QUFDakIsUUFBSSxLQUFLLElBQUksS0FBSyxHQUFHO0FBQ25CLGFBQU87QUFBQSxJQUNUO0FBQ0EsU0FBSyxJQUFJLEtBQUs7QUFDZCxXQUFPO0FBQUEsRUFDVCxDQUFDLEVBQ0EsTUFBTSxHQUFHLEVBQUU7QUFDaEI7QUFFQSxTQUFTLFVBQVUsTUFBYSxNQUFjLE9BQWUsUUFBMEI7QUFDckYsTUFBSSxDQUFDLE9BQU8sUUFBUTtBQUNsQixXQUFPLEtBQUssSUFBSSxHQUFHLEtBQUssTUFBTSxLQUFLLEtBQUssUUFBUSxJQUFhLENBQUM7QUFBQSxFQUNoRTtBQUVBLFFBQU0sWUFBWSxLQUFLLEtBQUssWUFBWTtBQUN4QyxRQUFNLGFBQWEsYUFBYSxNQUFNLElBQUksRUFBRSxZQUFZO0FBQ3hELFFBQU0sWUFBWSxLQUFLLFlBQVk7QUFDbkMsUUFBTSxpQkFBaUIsZ0JBQWdCLElBQUk7QUFDM0MsUUFBTSxrQkFBa0IsZ0JBQWdCLEtBQUs7QUFDN0MsTUFBSSxRQUFRO0FBQ1osTUFBSSxtQkFBbUIsZUFBZSxTQUFTLGVBQWUsR0FBRztBQUMvRCxhQUFTO0FBQUEsRUFDWDtBQUNBLE1BQUksbUJBQW1CLFVBQVUsU0FBUyxlQUFlLEdBQUc7QUFDMUQsYUFBUztBQUFBLEVBQ1g7QUFDQSxhQUFXLFNBQVMsUUFBUTtBQUMxQixRQUFJLFVBQVUsU0FBUyxLQUFLLEdBQUc7QUFDN0IsZUFBUztBQUFBLElBQ1g7QUFDQSxRQUFJLFdBQVcsU0FBUyxLQUFLLEdBQUc7QUFDOUIsZUFBUztBQUFBLElBQ1g7QUFDQSxVQUFNLGlCQUFpQixVQUFVLE1BQU0sSUFBSSxPQUFPLHVCQUF1QixhQUFhLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUNwRyxRQUFJLGdCQUFnQjtBQUNsQixlQUFTLGVBQWUsU0FBUztBQUFBLElBQ25DO0FBQ0EsVUFBTSxjQUFjLFVBQVUsTUFBTSxJQUFJLE9BQU8sZ0JBQWdCLGFBQWEsS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUM7QUFDdkcsUUFBSSxhQUFhO0FBQ2YsZUFBUyxZQUFZLFNBQVM7QUFBQSxJQUNoQztBQUNBLFVBQU0sYUFBYSxVQUFVLE1BQU0sSUFBSSxPQUFPLHVCQUF1QixhQUFhLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDO0FBQzdHLFFBQUksWUFBWTtBQUNkLGVBQVMsV0FBVyxTQUFTO0FBQUEsSUFDL0I7QUFDQSxVQUFNLGNBQWMsVUFBVSxNQUFNLElBQUksT0FBTyxhQUFhLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDeEUsUUFBSSxhQUFhO0FBQ2YsZUFBUyxLQUFLLElBQUksR0FBRyxZQUFZLE1BQU07QUFBQSxJQUN6QztBQUFBLEVBQ0Y7QUFFQSxRQUFNLGdCQUFnQixPQUFPLE9BQU8sQ0FBQyxVQUFVLFVBQVUsU0FBUyxLQUFLLEtBQUssVUFBVSxTQUFTLEtBQUssQ0FBQztBQUNyRyxXQUFTLGNBQWMsU0FBUztBQUNoQyxNQUFJLGNBQWMsV0FBVyxPQUFPLFFBQVE7QUFDMUMsYUFBUyxLQUFLLElBQUksSUFBSSxPQUFPLFNBQVMsQ0FBQztBQUFBLEVBQ3pDO0FBQ0EsUUFBTSxRQUFRLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSztBQUNyQyxRQUFNLFVBQVUsU0FBUyxNQUFPLEtBQUssS0FBSztBQUMxQyxNQUFJLFVBQVUsR0FBRztBQUNmLGFBQVM7QUFBQSxFQUNYLFdBQVcsVUFBVSxHQUFHO0FBQ3RCLGFBQVM7QUFBQSxFQUNYLFdBQVcsVUFBVSxJQUFJO0FBQ3ZCLGFBQVM7QUFBQSxFQUNYLFdBQVcsVUFBVSxJQUFJO0FBQ3ZCLGFBQVM7QUFBQSxFQUNYO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxhQUFhLE1BQWEsTUFBc0I7QUE1S3pEO0FBNktFLFFBQU0sV0FBVSxnQkFBSyxNQUFNLGFBQWEsTUFBeEIsbUJBQTRCLE9BQTVCLG1CQUFnQztBQUNoRCxNQUFJLFNBQVM7QUFDWCxXQUFPO0FBQUEsRUFDVDtBQUNBLFNBQU8sS0FBSyxZQUFZLEtBQUssS0FBSyxNQUFNLEdBQUcsRUFBRSxJQUFJLEtBQUssS0FBSztBQUM3RDtBQUVBLFNBQVMsWUFBWSxNQUFhLE1BQWMsT0FBZSxRQUEwQjtBQUN2RixRQUFNLFlBQVksS0FBSyxLQUFLLFlBQVk7QUFDeEMsUUFBTSxhQUFhLGFBQWEsTUFBTSxJQUFJLEVBQUUsWUFBWTtBQUN4RCxRQUFNLFlBQVksS0FBSyxZQUFZO0FBQ25DLFFBQU0saUJBQWlCLGdCQUFnQixJQUFJO0FBQzNDLFFBQU0sa0JBQWtCLGdCQUFnQixLQUFLO0FBQzdDLFFBQU0sVUFBVSxvQkFBSSxJQUFZO0FBQ2hDLE1BQUksbUJBQW1CLGVBQWUsU0FBUyxlQUFlLEdBQUc7QUFDL0QsWUFBUSxJQUFJLG9CQUFvQjtBQUFBLEVBQ2xDO0FBQ0EsYUFBVyxTQUFTLFFBQVE7QUFDMUIsUUFBSSxVQUFVLFNBQVMsS0FBSyxHQUFHO0FBQzdCLGNBQVEsSUFBSSxpQkFBaUIsS0FBSyxHQUFHO0FBQUEsSUFDdkM7QUFDQSxRQUFJLFdBQVcsU0FBUyxLQUFLLEdBQUc7QUFDOUIsY0FBUSxJQUFJLGtCQUFrQixLQUFLLEdBQUc7QUFBQSxJQUN4QztBQUNBLFFBQUksVUFBVSxNQUFNLElBQUksT0FBTyx1QkFBdUIsYUFBYSxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUc7QUFDN0UsY0FBUSxJQUFJLG9CQUFvQixLQUFLLEdBQUc7QUFBQSxJQUMxQztBQUNBLFFBQUksSUFBSSxPQUFPLGdCQUFnQixhQUFhLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEtBQUssU0FBUyxHQUFHO0FBQ3ZGLGNBQVEsSUFBSSxrQkFBa0IsS0FBSyxHQUFHO0FBQUEsSUFDeEM7QUFDQSxRQUFJLFVBQVUsTUFBTSxJQUFJLE9BQU8sdUJBQXVCLGFBQWEsS0FBSyxDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRztBQUM5RixjQUFRLElBQUksZ0JBQWdCLEtBQUssR0FBRztBQUFBLElBQ3RDO0FBQ0EsUUFBSSxVQUFVLFNBQVMsS0FBSyxHQUFHO0FBQzdCLGNBQVEsSUFBSSxxQkFBcUIsS0FBSyxHQUFHO0FBQUEsSUFDM0M7QUFBQSxFQUNGO0FBQ0EsU0FBTyxNQUFNLEtBQUssT0FBTyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsS0FBSyxJQUFJLEtBQUs7QUFDdkQ7QUFFQSxTQUFTLGFBQWEsTUFBYyxRQUEwQjtBQXJOOUQ7QUFzTkUsUUFBTSxjQUFjLEtBQUssTUFBTSxJQUFJO0FBQ25DLFFBQU0sU0FBUyxZQUNaLElBQUksQ0FBQyxNQUFNLFdBQVcsRUFBRSxPQUFPLE9BQU8sVUFBVSxNQUFNLE1BQU0sRUFBRSxFQUFFLEVBQ2hFLEtBQUssQ0FBQyxNQUFNLFVBQVUsTUFBTSxRQUFRLEtBQUssU0FBUyxLQUFLLFFBQVEsTUFBTSxLQUFLO0FBQzdFLFFBQU0sWUFBVyxrQkFBTyxLQUFLLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxNQUFwQyxtQkFBdUMsVUFBdkMsWUFBZ0Q7QUFDakUsUUFBTSxRQUFRLEtBQUssSUFBSSxHQUFHLFdBQVcsQ0FBQztBQUN0QyxRQUFNLE1BQU0sS0FBSyxJQUFJLFlBQVksUUFBUSxRQUFRLGlCQUFpQjtBQUNsRSxRQUFNLFVBQVUsWUFDYixNQUFNLE9BQU8sR0FBRyxFQUNoQixJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxFQUN6QixPQUFPLE9BQU8sRUFDZCxLQUFLLElBQUk7QUFDWixTQUFPLFFBQVEsU0FBUyxvQkFDcEIsR0FBRyxRQUFRLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxRQUNwRDtBQUNOO0FBRUEsU0FBUyxVQUFVLE1BQWMsUUFBMEI7QUFDekQsUUFBTSxRQUFRLEtBQUssWUFBWTtBQUMvQixNQUFJLFFBQVE7QUFDWixNQUFJLEtBQUssS0FBSyxFQUFFLFdBQVcsR0FBRyxHQUFHO0FBQy9CLGFBQVM7QUFBQSxFQUNYO0FBQ0EsYUFBVyxTQUFTLFFBQVE7QUFDMUIsUUFBSSxDQUFDLE1BQU0sU0FBUyxLQUFLLEdBQUc7QUFDMUI7QUFBQSxJQUNGO0FBQ0EsYUFBUztBQUNULFFBQUksTUFBTSxTQUFTLEtBQUssS0FBSyxFQUFFLEtBQUssTUFBTSxTQUFTLEdBQUcsS0FBSyxJQUFJLEdBQUc7QUFDaEUsZUFBUztBQUFBLElBQ1g7QUFDQSxRQUFJLE1BQU0sTUFBTSxJQUFJLE9BQU8sdUJBQXVCLGFBQWEsS0FBSyxDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRztBQUMxRixlQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGdCQUFnQixPQUF1QjtBQUM5QyxTQUFPLE1BQ0osWUFBWSxFQUNaLFFBQVEsUUFBUSxHQUFHLEVBQ25CLEtBQUs7QUFDVjtBQUVBLFNBQVMsYUFBYSxPQUF1QjtBQUMzQyxTQUFPLE1BQU0sUUFBUSx1QkFBdUIsTUFBTTtBQUNwRDs7O0FDclFBLElBQUFDLG1CQU1PO0FBR0EsSUFBTSxlQUFOLE1BQW1CO0FBQUEsRUFDeEIsWUFBNkIsS0FBVTtBQUFWO0FBQUEsRUFBVztBQUFBLEVBRXhDLE1BQU0sbUJBQW1CLFVBQThDO0FBQ3JFLFVBQU0sVUFBVSxvQkFBSSxJQUFJO0FBQUEsTUFDdEIsU0FBUztBQUFBLE1BQ1QsYUFBYSxTQUFTLGdCQUFnQjtBQUFBLElBQ3hDLENBQUM7QUFFRCxlQUFXLFVBQVUsU0FBUztBQUM1QixZQUFNLEtBQUssYUFBYSxNQUFNO0FBQUEsSUFDaEM7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGFBQWEsWUFBbUM7QUFDcEQsVUFBTSxpQkFBYSxnQ0FBYyxVQUFVLEVBQUUsUUFBUSxRQUFRLEVBQUU7QUFDL0QsUUFBSSxDQUFDLFlBQVk7QUFDZjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFdBQVcsV0FBVyxNQUFNLEdBQUcsRUFBRSxPQUFPLE9BQU87QUFDckQsUUFBSSxVQUFVO0FBQ2QsZUFBVyxXQUFXLFVBQVU7QUFDOUIsZ0JBQVUsVUFBVSxHQUFHLE9BQU8sSUFBSSxPQUFPLEtBQUs7QUFDOUMsWUFBTSxXQUFXLEtBQUssSUFBSSxNQUFNLHNCQUFzQixPQUFPO0FBQzdELFVBQUksQ0FBQyxVQUFVO0FBQ2IsY0FBTSxLQUFLLHNCQUFzQixPQUFPO0FBQUEsTUFDMUMsV0FBVyxFQUFFLG9CQUFvQiwyQkFBVTtBQUN6QyxjQUFNLElBQUksTUFBTSxvQ0FBb0MsT0FBTyxFQUFFO0FBQUEsTUFDL0Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxXQUFXLFVBQWtCLGlCQUFpQixJQUFvQjtBQUN0RSxVQUFNLGlCQUFhLGdDQUFjLFFBQVE7QUFDekMsVUFBTSxXQUFXLEtBQUssSUFBSSxNQUFNLHNCQUFzQixVQUFVO0FBQ2hFLFFBQUksb0JBQW9CLHdCQUFPO0FBQzdCLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxVQUFVO0FBQ1osWUFBTSxJQUFJLE1BQU0sa0NBQWtDLFVBQVUsRUFBRTtBQUFBLElBQ2hFO0FBRUEsVUFBTSxLQUFLLGFBQWEsYUFBYSxVQUFVLENBQUM7QUFDaEQsV0FBTyxLQUFLLElBQUksTUFBTSxPQUFPLFlBQVksY0FBYztBQUFBLEVBQ3pEO0FBQUEsRUFFQSxNQUFNLFNBQVMsVUFBbUM7QUFDaEQsVUFBTSxPQUFPLEtBQUssSUFBSSxNQUFNLDBCQUFzQixnQ0FBYyxRQUFRLENBQUM7QUFDekUsUUFBSSxFQUFFLGdCQUFnQix5QkFBUTtBQUM1QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU8sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQUEsRUFDakM7QUFBQSxFQUVBLE1BQU0sV0FBVyxVQUFrQixTQUFpQztBQUNsRSxVQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVcsUUFBUTtBQUMzQyxVQUFNLFVBQVUsTUFBTSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUk7QUFDOUMsVUFBTSxvQkFBb0IsUUFBUSxTQUFTLElBQUksSUFBSSxVQUFVLEdBQUcsT0FBTztBQUFBO0FBQ3ZFLFVBQU0sWUFBWSxRQUFRLFdBQVcsSUFDakMsS0FDQSxRQUFRLFNBQVMsTUFBTSxJQUNyQixLQUNBLFFBQVEsU0FBUyxJQUFJLElBQ25CLE9BQ0E7QUFDUixVQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sTUFBTSxHQUFHLE9BQU8sR0FBRyxTQUFTLEdBQUcsaUJBQWlCLEVBQUU7QUFDOUUsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sWUFBWSxVQUFrQixTQUFpQztBQUNuRSxVQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVcsUUFBUTtBQUMzQyxVQUFNLG9CQUFvQixRQUFRLFNBQVMsSUFBSSxJQUFJLFVBQVUsR0FBRyxPQUFPO0FBQUE7QUFDdkUsVUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLE1BQU0saUJBQWlCO0FBQ25ELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLHFCQUFxQixVQUFtQztBQUM1RCxVQUFNLGlCQUFhLGdDQUFjLFFBQVE7QUFDekMsUUFBSSxDQUFDLEtBQUssSUFBSSxNQUFNLHNCQUFzQixVQUFVLEdBQUc7QUFDckQsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFdBQVcsV0FBVyxZQUFZLEdBQUc7QUFDM0MsVUFBTSxPQUFPLGFBQWEsS0FBSyxhQUFhLFdBQVcsTUFBTSxHQUFHLFFBQVE7QUFDeEUsVUFBTSxZQUFZLGFBQWEsS0FBSyxLQUFLLFdBQVcsTUFBTSxRQUFRO0FBRWxFLFFBQUksVUFBVTtBQUNkLFdBQU8sTUFBTTtBQUNYLFlBQU0sWUFBWSxHQUFHLElBQUksSUFBSSxPQUFPLEdBQUcsU0FBUztBQUNoRCxVQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFNBQVMsR0FBRztBQUNwRCxlQUFPO0FBQUEsTUFDVDtBQUNBLGlCQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sb0JBQXNDO0FBQzFDLFdBQU8sS0FBSyxJQUFJLE1BQU0saUJBQWlCO0FBQUEsRUFDekM7QUFBQSxFQUVBLGNBQTZCO0FBQzNCLFdBQU8sS0FBSyxJQUFJLE1BQU0sbUJBQW1CLHFDQUNyQyxLQUFLLElBQUksTUFBTSxRQUFRLFlBQVksSUFDbkM7QUFBQSxFQUNOO0FBQUEsRUFFQSxNQUFjLHNCQUFzQixZQUFtQztBQUNyRSxRQUFJO0FBQ0YsWUFBTSxLQUFLLElBQUksTUFBTSxhQUFhLFVBQVU7QUFBQSxJQUM5QyxTQUFTLE9BQU87QUFDZCxZQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFVBQVU7QUFDaEUsVUFBSSxvQkFBb0IsMEJBQVM7QUFDL0I7QUFBQSxNQUNGO0FBQ0EsWUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLGFBQWEsVUFBMEI7QUFDOUMsUUFBTSxpQkFBYSxnQ0FBYyxRQUFRO0FBQ3pDLFFBQU0sUUFBUSxXQUFXLFlBQVksR0FBRztBQUN4QyxTQUFPLFVBQVUsS0FBSyxLQUFLLFdBQVcsTUFBTSxHQUFHLEtBQUs7QUFDdEQ7OztBQ25JTyxTQUFTLG1CQUNkLE1BQ0EsVUFDUztBQUNULFFBQU0sV0FBVyxLQUFLLE1BQU0sR0FBRyxFQUFFLE9BQU8sT0FBTztBQUMvQyxRQUFNLFNBQ0osUUFBUSxJQUFJLEtBQ1osS0FBSyxTQUFTLEtBQUssS0FDbkIsQ0FBQyxLQUFLLFNBQVMsSUFBSSxLQUNuQixTQUFTLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxXQUFXLEdBQUcsQ0FBQztBQUV0RCxNQUFJLENBQUMsUUFBUTtBQUNYLFdBQU87QUFBQSxFQUNUO0FBRUEsTUFBSSxZQUFZLFNBQVMsU0FBUyxrQkFBa0I7QUFDbEQsV0FBTztBQUFBLEVBQ1Q7QUFFQSxTQUFPO0FBQ1Q7OztBQ2xCQSxJQUFNLGlCQUFpQjtBQXdCaEIsSUFBTSxvQkFBTixNQUF3QjtBQUFBLEVBQzdCLFlBQ21CLGNBQ0Esa0JBQ2pCO0FBRmlCO0FBQ0E7QUFBQSxFQUNoQjtBQUFBLEVBRUgsY0FBYyxNQUF5RTtBQUNyRixVQUFNLGFBQWEsZUFBZSxLQUFLLFVBQVU7QUFDakQsVUFBTSxnQkFBZ0IsTUFBTSxRQUFRLEtBQUssVUFBVSxJQUFJLEtBQUssYUFBYSxDQUFDO0FBQzFFLFVBQU0sa0JBQWtCLGNBQ3JCLElBQUksQ0FBQyxjQUFjLEtBQUssbUJBQW1CLFNBQVMsQ0FBQyxFQUNyRCxPQUFPLENBQUMsY0FBZ0QsY0FBYyxJQUFJO0FBQzdFLFVBQU0sb0JBQW9CLGNBQWMsU0FBUyxnQkFBZ0I7QUFDakUsVUFBTSxrQkFBa0IsZ0JBQWdCLE1BQU0sR0FBRyxjQUFjO0FBQy9ELFVBQU0sbUJBQW1CLGdCQUFnQixTQUFTLGdCQUFnQjtBQUNsRSxXQUFPO0FBQUEsTUFDTCxTQUFTLE9BQU8sS0FBSyxZQUFZLFlBQVksS0FBSyxRQUFRLEtBQUssSUFDM0QsS0FBSyxRQUFRLEtBQUssSUFDbEI7QUFBQSxNQUNKO0FBQUEsTUFDQSxZQUFZO0FBQUEsTUFDWixZQUFZLE1BQU0sUUFBUSxLQUFLLFNBQVMsSUFBSSxLQUFLLFlBQVksQ0FBQyxHQUMzRCxJQUFJLENBQUMsYUFBYSxPQUFPLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFDekMsT0FBTyxPQUFPLEVBQ2QsTUFBTSxHQUFHLENBQUM7QUFBQSxNQUNiLG1CQUFtQixvQkFBb0I7QUFBQSxJQUN6QztBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sVUFBVSxNQUF5QztBQUN2RCxVQUFNLFdBQVcsS0FBSyxpQkFBaUI7QUFDdkMsVUFBTSxRQUFrQixDQUFDO0FBQ3pCLGVBQVcsYUFBYSxLQUFLLFlBQVk7QUFDdkMsVUFBSSxDQUFDLG1CQUFtQixVQUFVLE1BQU0sUUFBUSxHQUFHO0FBQ2pEO0FBQUEsTUFDRjtBQUNBLFVBQUksVUFBVSxTQUFTLFVBQVU7QUFDL0IsY0FBTSxLQUFLLGFBQWEsV0FBVyxVQUFVLE1BQU0sVUFBVSxPQUFPO0FBQ3BFLGNBQU0sS0FBSyxVQUFVLElBQUk7QUFBQSxNQUMzQixXQUFXLFVBQVUsU0FBUyxVQUFVO0FBQ3RDLGNBQU0sT0FBTyxNQUFNLEtBQUssYUFBYSxxQkFBcUIsVUFBVSxJQUFJO0FBQ3hFLGNBQU0sS0FBSyxhQUFhLFlBQVksTUFBTSxVQUFVLE9BQU87QUFDM0QsY0FBTSxLQUFLLElBQUk7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFDQSxXQUFPLE1BQU0sS0FBSyxJQUFJLElBQUksS0FBSyxDQUFDO0FBQUEsRUFDbEM7QUFBQSxFQUVRLG1CQUFtQixXQUFnRDtBQTVFN0U7QUE2RUksUUFBSSxDQUFDLGFBQWEsT0FBTyxjQUFjLFlBQVksRUFBRSxVQUFVLFlBQVk7QUFDekUsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFlBQVk7QUFDbEIsVUFBTSxVQUFVLGFBQWEsWUFBWSxRQUFPLGVBQVUsWUFBVixZQUFxQixFQUFFLEVBQUUsS0FBSyxJQUFJO0FBQ2xGLFFBQUksQ0FBQyxTQUFTO0FBQ1osYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLFVBQVUsU0FBUyxZQUFZLFVBQVUsU0FBUyxVQUFVO0FBQzlELGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxPQUFPLFVBQVUsWUFDbkIsc0JBQXNCLFFBQU8sZUFBVSxTQUFWLFlBQWtCLEVBQUUsQ0FBQyxJQUNsRDtBQUNKLFVBQU0sV0FBVyxLQUFLLGlCQUFpQjtBQUN2QyxRQUFJLENBQUMsbUJBQW1CLE1BQU0sUUFBUSxHQUFHO0FBQ3ZDLGFBQU87QUFBQSxJQUNUO0FBRUEsV0FBTztBQUFBLE1BQ0wsTUFBTSxVQUFVO0FBQUEsTUFDaEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxhQUFhLGdCQUFnQixTQUFTO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTLGdCQUFnQixXQUE2RDtBQUNwRixTQUFPLE9BQU8sVUFBVSxnQkFBZ0IsWUFBWSxVQUFVLFlBQVksS0FBSyxJQUMzRSxVQUFVLFlBQVksS0FBSyxJQUMzQjtBQUNOO0FBRUEsU0FBUyxlQUFlLE9BQThDO0FBQ3BFLFNBQU8sVUFBVSxTQUFTLFVBQVUsWUFBWSxVQUFVLFNBQVMsUUFBUTtBQUM3RTtBQUVBLFNBQVMsc0JBQXNCLE9BQXVCO0FBQ3BELFNBQU8sTUFDSixLQUFLLEVBQ0wsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxRQUFRLEdBQUcsRUFDbkIsUUFBUSxRQUFRLEVBQUU7QUFDdkI7OztBQzVIQSxJQUFBQyxtQkFBdUY7OztBQ0F2RixJQUFBQyxtQkFBbUM7OztBQ0FuQyxJQUFBQyxtQkFBdUI7QUFPaEIsU0FBUyxVQUFVLE9BQWdCLGdCQUE4QjtBQUN0RSxVQUFRLE1BQU0sS0FBSztBQUNuQixRQUFNLFVBQVUsaUJBQWlCLFFBQVEsTUFBTSxVQUFVO0FBQ3pELE1BQUksd0JBQU8sT0FBTztBQUNwQjs7O0FERU8sSUFBTSxpQkFBTixjQUE2Qix1QkFBTTtBQUFBLEVBT3hDLFlBQ0UsS0FDaUIsU0FDakI7QUFDQSxVQUFNLEdBQUc7QUFGUTtBQVJuQixTQUFRLFVBQVU7QUFDbEIsU0FBaUIscUJBQXFCLG9CQUFJLElBQVk7QUFVcEQsU0FBSyxrQkFBa0IsUUFBUSxLQUFLLFdBQVcsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLFVBQVUsRUFBRTtBQUNwRixTQUFLLGdCQUFnQixRQUFRLENBQUMsR0FBRyxVQUFVLEtBQUssbUJBQW1CLElBQUksS0FBSyxDQUFDO0FBQUEsRUFDL0U7QUFBQSxFQUVBLFNBQWU7QUFDYixTQUFLLE9BQU87QUFBQSxFQUNkO0FBQUEsRUFFQSxRQUFjO0FBQ1osUUFBSSxLQUFLLFNBQVM7QUFDaEI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxNQUFNO0FBQUEsRUFDZDtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQUEsRUFFUSxTQUFlO0FBQ3JCLFNBQUssVUFBVSxNQUFNO0FBQ3JCLFNBQUssVUFBVSxTQUFTLGFBQWE7QUFDckMsU0FBSyxVQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsU0FBSyxVQUFVLFNBQVMsS0FBSztBQUFBLE1BQzNCLE1BQU0sR0FBRyxLQUFLLFFBQVEsS0FBSyxXQUFXLCtCQUErQixnQkFBZ0IsS0FBSyxRQUFRLEtBQUssVUFBVTtBQUFBLElBQ25ILENBQUM7QUFFRCxRQUFJLEtBQUssUUFBUSxLQUFLLG9CQUFvQixHQUFHO0FBQzNDLFlBQU0sVUFBVSxLQUFLLFVBQVUsU0FBUyxPQUFPO0FBQUEsUUFDN0MsS0FBSztBQUFBLE1BQ1AsQ0FBQztBQUNELGNBQVEsU0FBUyxVQUFVO0FBQUEsUUFDekIsTUFBTSxHQUFHLEtBQUssUUFBUSxLQUFLLGlCQUFpQixtQkFBbUIsS0FBSyxRQUFRLEtBQUssc0JBQXNCLElBQUksU0FBUyxRQUFRO0FBQUEsTUFDOUgsQ0FBQztBQUNELGNBQVEsU0FBUyxRQUFRO0FBQUEsUUFDdkIsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUFBLElBQ0g7QUFFQSxlQUFXLENBQUMsT0FBTyxTQUFTLEtBQUssS0FBSyxnQkFBZ0IsUUFBUSxHQUFHO0FBQy9ELFdBQUssZ0JBQWdCLE9BQU8sU0FBUztBQUFBLElBQ3ZDO0FBRUEsUUFBSSxLQUFLLFFBQVEsS0FBSyxVQUFVLFFBQVE7QUFDdEMsWUFBTSxZQUFZLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLHVCQUF1QixDQUFDO0FBQ2hGLGdCQUFVLFNBQVMsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDbkQsWUFBTSxPQUFPLFVBQVUsU0FBUyxJQUFJO0FBQ3BDLGlCQUFXLFlBQVksS0FBSyxRQUFRLEtBQUssV0FBVztBQUNsRCxhQUFLLFNBQVMsTUFBTSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQUEsTUFDeEM7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQzFFLFNBQUssa0JBQWtCLFFBQVEsU0FBUyxVQUFVO0FBQUEsTUFDaEQsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUNELFNBQUssZ0JBQWdCLGlCQUFpQixTQUFTLE1BQU07QUFDbkQsV0FBSyxLQUFLLFFBQVE7QUFBQSxJQUNwQixDQUFDO0FBQ0QsU0FBSyxpQkFBaUIsUUFBUSxTQUFTLFVBQVU7QUFBQSxNQUMvQyxLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsU0FBSyxlQUFlLGlCQUFpQixTQUFTLE1BQU07QUFDbEQsV0FBSyxNQUFNO0FBQUEsSUFDYixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsTUFBYyxVQUF5QjtBQUNyQyxRQUFJLEtBQUssU0FBUztBQUNoQjtBQUFBLElBQ0Y7QUFDQSxVQUFNLGFBQWEsS0FBSyxnQkFDckIsT0FBTyxDQUFDLEdBQUcsVUFBVSxLQUFLLG1CQUFtQixJQUFJLEtBQUssQ0FBQyxFQUN2RCxJQUFJLENBQUMsZUFBZTtBQUFBLE1BQ25CLEdBQUc7QUFBQSxNQUNILE1BQU0sVUFBVSxLQUFLLEtBQUs7QUFBQSxNQUMxQixTQUFTLFVBQVUsUUFBUSxLQUFLO0FBQUEsSUFDbEMsRUFBRSxFQUNELE9BQU8sQ0FBQyxjQUFjLFVBQVUsUUFBUSxVQUFVLE9BQU87QUFDNUQsUUFBSSxDQUFDLFdBQVcsUUFBUTtBQUN0QixVQUFJLHdCQUFPLHFDQUFxQztBQUNoRDtBQUFBLElBQ0Y7QUFDQSxVQUFNLGNBQWMsV0FBVyxLQUFLLENBQUMsY0FBYyxDQUFDLG1CQUFtQixVQUFVLE1BQU0sS0FBSyxRQUFRLFFBQVEsQ0FBQztBQUM3RyxRQUFJLGFBQWE7QUFDZixVQUFJLHdCQUFPLHdCQUF3QixZQUFZLElBQUksRUFBRTtBQUNyRDtBQUFBLElBQ0Y7QUFDQSxTQUFLLFVBQVU7QUFDZixTQUFLLGtCQUFrQixLQUFLO0FBQzVCLFFBQUk7QUFDRixZQUFNLFFBQVEsTUFBTSxLQUFLLFFBQVEsVUFBVTtBQUFBLFFBQ3pDLEdBQUcsS0FBSyxRQUFRO0FBQUEsUUFDaEI7QUFBQSxNQUNGLENBQUM7QUFDRCxZQUFNLFVBQVUsTUFBTSxTQUNsQixXQUFXLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FDM0I7QUFDSixVQUFJLHdCQUFPLE9BQU87QUFDbEIsWUFBTSxLQUFLLFFBQVEsV0FBVyxTQUFTLEtBQUs7QUFDNUMsV0FBSyxVQUFVO0FBQ2YsV0FBSyxNQUFNO0FBQUEsSUFDYixTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLCtCQUErQjtBQUNoRCxXQUFLLGtCQUFrQixJQUFJO0FBQUEsSUFDN0IsVUFBRTtBQUNBLFdBQUssVUFBVTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUFBLEVBRVEsa0JBQWtCLFNBQXdCO0FBQ2hELFFBQUksS0FBSyxpQkFBaUI7QUFDeEIsV0FBSyxnQkFBZ0IsV0FBVyxDQUFDO0FBQ2pDLFdBQUssZ0JBQWdCLGNBQWMsVUFBVSxzQkFBc0I7QUFBQSxJQUNyRTtBQUNBLFFBQUksS0FBSyxnQkFBZ0I7QUFDdkIsV0FBSyxlQUFlLFdBQVcsQ0FBQztBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBRVEsZ0JBQWdCLE9BQWUsV0FBc0M7QUFDM0UsVUFBTSxPQUFPLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLHVCQUF1QixDQUFDO0FBQzNFLFVBQU0sU0FBUyxLQUFLLFNBQVMsU0FBUyxFQUFFLEtBQUssOEJBQThCLENBQUM7QUFDNUUsVUFBTSxXQUFXLE9BQU8sU0FBUyxTQUFTO0FBQUEsTUFDeEMsTUFBTSxFQUFFLE1BQU0sV0FBVztBQUFBLElBQzNCLENBQUM7QUFDRCxhQUFTLFVBQVUsS0FBSyxtQkFBbUIsSUFBSSxLQUFLO0FBQ3BELGFBQVMsaUJBQWlCLFVBQVUsTUFBTTtBQUN4QyxVQUFJLFNBQVMsU0FBUztBQUNwQixhQUFLLG1CQUFtQixJQUFJLEtBQUs7QUFBQSxNQUNuQyxPQUFPO0FBQ0wsYUFBSyxtQkFBbUIsT0FBTyxLQUFLO0FBQUEsTUFDdEM7QUFBQSxJQUNGLENBQUM7QUFDRCxXQUFPLFNBQVMsUUFBUSxFQUFFLE1BQU0sa0JBQWtCLFNBQVMsRUFBRSxDQUFDO0FBRTlELFFBQUksVUFBVSxhQUFhO0FBQ3pCLFdBQUssU0FBUyxPQUFPO0FBQUEsUUFDbkIsS0FBSztBQUFBLFFBQ0wsTUFBTSxVQUFVO0FBQUEsTUFDbEIsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLFlBQVksS0FBSyxTQUFTLFNBQVM7QUFBQSxNQUN2QyxLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGLENBQUM7QUFDRCxjQUFVLFFBQVEsVUFBVTtBQUM1QixjQUFVLGlCQUFpQixTQUFTLE1BQU07QUFDeEMsV0FBSyxnQkFBZ0IsS0FBSyxJQUFJO0FBQUEsUUFDNUIsR0FBRyxLQUFLLGdCQUFnQixLQUFLO0FBQUEsUUFDN0IsTUFBTSxVQUFVO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFFRCxVQUFNLFdBQVcsS0FBSyxTQUFTLFlBQVk7QUFBQSxNQUN6QyxLQUFLO0FBQUEsTUFDTCxNQUFNLEVBQUUsTUFBTSxLQUFLO0FBQUEsSUFDckIsQ0FBQztBQUNELGFBQVMsUUFBUSxVQUFVO0FBQzNCLGFBQVMsaUJBQWlCLFNBQVMsTUFBTTtBQUN2QyxXQUFLLGdCQUFnQixLQUFLLElBQUk7QUFBQSxRQUM1QixHQUFHLEtBQUssZ0JBQWdCLEtBQUs7QUFBQSxRQUM3QixTQUFTLFNBQVM7QUFBQSxNQUNwQjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQUVBLFNBQVMsa0JBQWtCLFdBQXlEO0FBQ2xGLE1BQUksVUFBVSxTQUFTLFVBQVU7QUFDL0IsV0FBTyxhQUFhLFVBQVUsSUFBSTtBQUFBLEVBQ3BDO0FBQ0EsU0FBTyxVQUFVLFVBQVUsSUFBSTtBQUNqQzs7O0FEckxPLElBQU0sa0JBQWtCO0FBRXhCLElBQU0sbUJBQU4sY0FBK0IsMEJBQVM7QUFBQSxFQTZCN0MsWUFBWSxNQUFzQyxRQUFxQjtBQUNyRSxVQUFNLElBQUk7QUFEc0M7QUFyQmxELFNBQVEsZUFBbUM7QUFDM0MsU0FBUSxzQkFBc0I7QUFDOUIsU0FBUSxtQkFBbUI7QUFDM0IsU0FBUSxnQkFBMEM7QUFDbEQsU0FBUSxxQkFBOEM7QUFDdEQsU0FBUSxnQkFBb0M7QUFDNUMsU0FBUSxpQkFBcUM7QUFDN0MsU0FBUSxZQUFZO0FBQ3BCLFNBQVEseUJBQWlEO0FBQ3pELFNBQVEsbUJBQW1CO0FBQzNCLFNBQVEsZUFBOEI7QUFDdEMsU0FBUSxjQUFjO0FBQ3RCLFNBQVEsZ0JBQW9DO0FBQzVDLFNBQVEsaUJBQXFDO0FBQzdDLFNBQVEsZUFBK0I7QUFDdkMsU0FBUSxtQkFBbUI7QUFDM0IsU0FBUSxnQkFBK0I7QUFDdkMsU0FBUSxRQUFvQixDQUFDO0FBQzdCLFNBQVEsaUJBQWlCO0FBQ3pCLFNBQVEsbUJBQXVDO0FBQUEsRUFJL0M7QUFBQSxFQUVBLGNBQXNCO0FBQ3BCLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxpQkFBeUI7QUFDdkIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLFVBQWtCO0FBQ2hCLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLFNBQXdCO0FBQzVCLFNBQUssVUFBVSxNQUFNO0FBQ3JCLFNBQUssVUFBVSxTQUFTLGVBQWU7QUFFdkMsVUFBTSxTQUFTLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUNyRSxVQUFNLFlBQVksT0FBTyxTQUFTLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQ3BFLGNBQVUsU0FBUyxNQUFNLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDMUMsU0FBSyxhQUFhLFVBQVUsU0FBUyxPQUFPLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUN0RSxTQUFLLG9CQUFvQjtBQUN6QixTQUFLLEtBQUssb0JBQW9CO0FBQzlCLFdBQU8sU0FBUyxLQUFLO0FBQUEsTUFDbkIsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFVBQU0sZ0JBQWdCLE9BQU8sU0FBUyxPQUFPLEVBQUUsS0FBSyx1QkFBdUIsQ0FBQztBQUM1RSxTQUFLLGdCQUFnQixjQUFjLFNBQVMsVUFBVTtBQUFBLE1BQ3BELEtBQUs7QUFBQSxNQUNMLE1BQU0sRUFBRSxjQUFjLHNCQUFzQixPQUFPLHFCQUFxQjtBQUFBLElBQzFFLENBQUM7QUFDRCxrQ0FBUSxLQUFLLGVBQWUsU0FBUztBQUNyQyxTQUFLLGNBQWMsU0FBUyxRQUFRLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDckQsU0FBSyxjQUFjLGlCQUFpQixTQUFTLE1BQU07QUFDakQsV0FBSyxLQUFLLGtCQUFrQjtBQUFBLElBQzlCLENBQUM7QUFFRCxVQUFNLG1CQUFtQixjQUFjLFNBQVMsVUFBVTtBQUFBLE1BQ3hELEtBQUs7QUFBQSxNQUNMLE1BQU0sRUFBRSxjQUFjLDBCQUEwQixPQUFPLHlCQUF5QjtBQUFBLElBQ2xGLENBQUM7QUFDRCxrQ0FBUSxrQkFBa0IsV0FBVztBQUNyQyxxQkFBaUIsU0FBUyxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUQscUJBQWlCLGlCQUFpQixTQUFTLE1BQU07QUFDL0MsV0FBSyxLQUFLLE9BQU8scUJBQXFCO0FBQUEsSUFDeEMsQ0FBQztBQUVELFVBQU0sZUFBZSxjQUFjLFNBQVMsVUFBVTtBQUFBLE1BQ3BELEtBQUs7QUFBQSxNQUNMLE1BQU0sRUFBRSxjQUFjLHVCQUF1QixPQUFPLHNCQUFzQjtBQUFBLElBQzVFLENBQUM7QUFDRCxrQ0FBUSxjQUFjLFVBQVU7QUFDaEMsaUJBQWEsU0FBUyxRQUFRLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDbEQsaUJBQWEsaUJBQWlCLFNBQVMsTUFBTTtBQS9HakQ7QUFnSE0sWUFBTSxXQUFZLEtBQUssSUFDcEI7QUFDSCxpREFBVSx1QkFBVixrQ0FBK0I7QUFBQSxJQUNqQyxDQUFDO0FBRUQsVUFBTSxvQkFBb0IsS0FBSyxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssMkJBQTJCLENBQUM7QUFDNUYsU0FBSyxhQUFhLGtCQUFrQixTQUFTLE9BQU87QUFBQSxNQUNsRCxLQUFLO0FBQUEsTUFDTCxNQUFNLEVBQUUsYUFBYSxVQUFVLGVBQWUsUUFBUTtBQUFBLElBQ3hELENBQUM7QUFDRCxTQUFLLFdBQVcsaUJBQWlCLFVBQVUsTUFBTTtBQUMvQyxXQUFLLGlCQUFpQixDQUFDLEtBQUssYUFBYTtBQUN6QyxXQUFLLDJCQUEyQjtBQUFBLElBQ2xDLENBQUM7QUFDRCxRQUFJLEtBQUssTUFBTSxTQUFTLEdBQUc7QUFDekIsV0FBSyxLQUFLLGVBQWU7QUFBQSxJQUMzQixPQUFPO0FBQ0wsV0FBSyxpQkFBaUI7QUFBQSxJQUN4QjtBQUVBLFNBQUssbUJBQW1CLGtCQUFrQixTQUFTLFVBQVU7QUFBQSxNQUMzRCxLQUFLO0FBQUEsTUFDTCxNQUFNLEVBQUUsY0FBYyxtQkFBbUI7QUFBQSxJQUMzQyxDQUFDO0FBQ0Qsa0NBQVEsS0FBSyxrQkFBa0IsWUFBWTtBQUMzQyxTQUFLLGlCQUFpQixpQkFBaUIsU0FBUyxNQUFNO0FBQ3BELFdBQUssaUJBQWlCO0FBQ3RCLFdBQUssV0FBVyxTQUFTLEVBQUUsS0FBSyxLQUFLLFdBQVcsY0FBYyxVQUFVLFNBQVMsQ0FBQztBQUNsRixXQUFLLDJCQUEyQjtBQUFBLElBQ2xDLENBQUM7QUFDRCxTQUFLLDJCQUEyQjtBQUVoQyxTQUFLLFVBQVUsS0FBSyxVQUFVLFNBQVMsWUFBWTtBQUFBLE1BQ2pELEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxRQUNKLGFBQWE7QUFBQSxRQUNiLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRixDQUFDO0FBQ0QsU0FBSyxRQUFRLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUNsRCxVQUFJLE1BQU0sUUFBUSxXQUFXLENBQUMsTUFBTSxVQUFVO0FBQzVDLGNBQU0sZUFBZTtBQUNyQixhQUFLLEtBQUssWUFBWTtBQUFBLE1BQ3hCO0FBQUEsSUFDRixDQUFDO0FBQ0QsU0FBSyxRQUFRLGlCQUFpQixTQUFTLE1BQU07QUFDM0MsV0FBSyxnQkFBZ0I7QUFBQSxJQUN2QixDQUFDO0FBRUQsVUFBTSxPQUFPLEtBQUssVUFBVSxTQUFTLE9BQU8sRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBQzFFLFNBQUssU0FBUyxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDeEMsU0FBSyxTQUFTLE9BQU8sRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUN0QyxTQUFLLFNBQVMsUUFBUSxFQUFFLE1BQU0saUJBQWMsQ0FBQztBQUM3QyxTQUFLLFNBQVMsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzVDLFNBQUssU0FBUyxRQUFRLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUVqRCxVQUFNLFVBQVUsS0FBSyxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssZ0JBQWdCLENBQUM7QUFDdkUsU0FBSyxlQUFlLFFBQVEsU0FBUyxVQUFVO0FBQUEsTUFDN0MsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUNELFNBQUssYUFBYSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2hELFdBQUssS0FBSyxZQUFZO0FBQUEsSUFDeEIsQ0FBQztBQUNELFNBQUssZUFBZSxRQUFRLFNBQVMsVUFBVTtBQUFBLE1BQzdDLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxTQUFLLGFBQWEsaUJBQWlCLFNBQVMsTUFBTTtBQUNoRCxXQUFLLG1CQUFtQjtBQUFBLElBQzFCLENBQUM7QUFDRCxTQUFLLGFBQWEsU0FBUztBQUUzQixTQUFLLFdBQVcsS0FBSyxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssb0JBQW9CLENBQUM7QUFDM0UsU0FBSyxrQkFBa0I7QUFDdkIsU0FBSyxnQkFBZ0I7QUFDckIsVUFBTSxLQUFLLGNBQWM7QUFBQSxFQUMzQjtBQUFBLEVBRUEsVUFBeUI7QUEvTDNCO0FBZ01JLGVBQUssMkJBQUwsbUJBQTZCO0FBQzdCLFNBQUssaUJBQWlCO0FBQ3RCLFFBQUksS0FBSyxrQkFBa0IsTUFBTTtBQUMvQiwyQkFBcUIsS0FBSyxhQUFhO0FBQ3ZDLFdBQUssZ0JBQWdCO0FBQUEsSUFDdkI7QUFDQSxXQUFPLFFBQVEsUUFBUTtBQUFBLEVBQ3pCO0FBQUEsRUFFQSxNQUFNLGdCQUErQjtBQUNuQyxRQUFJLENBQUMsS0FBSyxVQUFVO0FBQ2xCO0FBQUEsSUFDRjtBQUNBLFNBQUssU0FBUyxNQUFNO0FBQ3BCLFFBQUksYUFBYTtBQUNqQixRQUFJLGNBQXVDO0FBQzNDLFFBQUk7QUFDRixZQUFNLFdBQVcsTUFBTSx5QkFBeUIsS0FBSyxPQUFPLFFBQVE7QUFDcEUsVUFBSSxTQUFTLFlBQVk7QUFDdkIscUJBQWEsU0FBUyxRQUFRLFVBQVUsU0FBUyxLQUFLLEtBQUs7QUFDM0Qsc0JBQWM7QUFBQSxNQUNoQixPQUFPO0FBQ0wscUJBQWEsU0FBUyxXQUFXO0FBQ2pDLHNCQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxLQUFLO0FBQ25CLG1CQUFhO0FBQ2Isb0JBQWM7QUFBQSxJQUNoQjtBQUVBLFVBQU0sWUFBWSxLQUFLLFNBQVMsU0FBUyxRQUFRO0FBQUEsTUFDL0MsS0FBSyxrREFBa0QsV0FBVztBQUFBLElBQ3BFLENBQUM7QUFDRCxjQUFVLGFBQWEsZUFBZSxNQUFNO0FBQzVDLFNBQUssU0FBUyxTQUFTLFFBQVEsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUFBLEVBQ3JEO0FBQUEsRUFFQSxNQUFjLGNBQTZCO0FBQ3pDLFVBQU0sVUFBVSxLQUFLLFFBQVEsTUFBTSxLQUFLO0FBQ3hDLFFBQUksQ0FBQyxXQUFXLEtBQUssV0FBVztBQUM5QjtBQUFBLElBQ0Y7QUFFQSxTQUFLLFFBQVEsUUFBUTtBQUNyQixTQUFLLGdCQUFnQjtBQUNyQixTQUFLLGlCQUFpQjtBQUN0QixTQUFLLFFBQVEsUUFBUSxPQUFPO0FBQzVCLFNBQUssV0FBVyxNQUFNLE9BQU87QUFDN0IsVUFBTSxhQUFhLElBQUksZ0JBQWdCO0FBQ3ZDLFNBQUsseUJBQXlCO0FBQzlCLFFBQUk7QUFDRixZQUFNLFVBQVUsS0FBSyxpQkFBaUI7QUFDdEMsWUFBTSxXQUFXLE1BQU0sS0FBSyxPQUFPLGNBQWMsU0FBUyxTQUFTLFdBQVcsUUFBUSxDQUFDLFVBQVU7QUFDL0YsYUFBSyxlQUFlO0FBQ3BCLGFBQUssa0JBQWtCO0FBQUEsTUFDekIsQ0FBQztBQUNELFdBQUssZUFBZSxRQUFRO0FBQUEsSUFDOUIsU0FBUyxPQUFPO0FBQ2QsVUFBSSxpQkFBaUIsS0FBSyxHQUFHO0FBQzNCLFlBQUksS0FBSyxVQUFVLGFBQWE7QUFDOUIsZUFBSyxRQUFRLFFBQVEsd0JBQXdCO0FBQUEsUUFDL0M7QUFBQSxNQUNGLE9BQU87QUFDTCxjQUFNQyxXQUFVLGlCQUFpQixRQUFRLE1BQU0sVUFBVTtBQUN6RCxrQkFBVSxPQUFPLCtCQUErQjtBQUNoRCxZQUFJLEtBQUssVUFBVSxhQUFhO0FBQzlCLGVBQUssUUFBUSxTQUFTQSxRQUFPO0FBQUEsUUFDL0I7QUFBQSxNQUNGO0FBQUEsSUFDRixVQUFFO0FBQ0EsV0FBSyx5QkFBeUI7QUFDOUIsV0FBSyxXQUFXLEtBQUs7QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLG1CQUFtQztBQTVRN0M7QUE4UUksVUFBTSxNQUFzQixDQUFDO0FBQzdCLGVBQVcsUUFBUSxLQUFLLE1BQU0sTUFBTSxHQUFHLEVBQUUsR0FBRztBQUMxQyxVQUFJLEtBQUssU0FBUyxVQUFVLEtBQUssU0FBUyxTQUFTO0FBQ2pEO0FBQUEsTUFDRjtBQUNBLFVBQUksQ0FBQyxLQUFLLE1BQU07QUFDZDtBQUFBLE1BQ0Y7QUFDQSxXQUFJLFVBQUssaUJBQUwsbUJBQW1CLFFBQVE7QUFDN0I7QUFBQSxNQUNGO0FBQ0EsVUFBSSxLQUFLLEVBQUUsTUFBTSxLQUFLLE1BQU0sTUFBTSxLQUFLLEtBQUssQ0FBQztBQUFBLElBQy9DO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLHFCQUEyQjtBQUNqQyxRQUFJLENBQUMsS0FBSyx3QkFBd0I7QUFDaEM7QUFBQSxJQUNGO0FBQ0EsU0FBSyx1QkFBdUIsTUFBTTtBQUNsQyxTQUFLLGFBQWEsV0FBVztBQUM3QixRQUFJLEtBQUssZ0JBQWdCO0FBQ3ZCLFdBQUssZUFBZSxRQUFRLGdCQUFXO0FBQUEsSUFDekM7QUFDQSxRQUFJLEtBQUssZUFBZTtBQUN0QixXQUFLLGNBQWMsUUFBUSxVQUFVO0FBQUEsSUFDdkM7QUFBQSxFQUNGO0FBQUEsRUFFUSxzQkFBNEI7QUFDbEMsU0FBSyxXQUFXLE1BQU07QUFDdEIsU0FBSyxnQkFBZ0I7QUFDckIsU0FBSyxxQkFBcUI7QUFDMUIsU0FBSyxnQkFBZ0I7QUFDckIsU0FBSyxpQkFBaUI7QUFFdEIsUUFBSSxLQUFLLHFCQUFxQjtBQUM1QixXQUFLLGlCQUFpQixLQUFLLFdBQVcsU0FBUyxRQUFRO0FBQUEsUUFDckQsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUNELFdBQUssaUNBQWlDO0FBQ3RDO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUyxLQUFLLFdBQVcsU0FBUyxVQUFVO0FBQUEsTUFDaEQsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUNELFNBQUssZ0JBQWdCO0FBQ3JCLGVBQVcsVUFBVSxLQUFLLGNBQWM7QUFDdEMsYUFBTyxTQUFTLFVBQVU7QUFBQSxRQUN4QixPQUFPLE9BQU87QUFBQSxRQUNkLE1BQU0sT0FBTztBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0g7QUFDQSxXQUFPLFNBQVMsVUFBVTtBQUFBLE1BQ3hCLE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxVQUFNLGVBQWUsS0FBSyxtQkFDdEIsMkJBQ0EsMkJBQTJCLEtBQUssT0FBTyxTQUFTLFlBQVksS0FBSyxZQUFZO0FBQ2pGLFFBQUksS0FBSyxjQUFjLFVBQVUsY0FBYztBQUM3QyxXQUFLLGNBQWMsUUFBUTtBQUFBLElBQzdCO0FBQ0EsV0FBTyxpQkFBaUIsVUFBVSxNQUFNO0FBQ3RDLFdBQUssS0FBSyxxQkFBcUIsT0FBTyxLQUFLO0FBQUEsSUFDN0MsQ0FBQztBQUVELFFBQUksT0FBTyxVQUFVLDBCQUEwQjtBQUM3QyxVQUFJLEtBQUssb0JBQW9CLEtBQUssT0FBTyxTQUFTLFdBQVcsS0FBSyxHQUFHO0FBQ25FLGFBQUssZ0JBQWdCLEtBQUssV0FBVyxTQUFTLFFBQVE7QUFBQSxVQUNwRCxLQUFLO0FBQUEsVUFDTCxNQUFNLFdBQVcsS0FBSyxPQUFPLFNBQVMsV0FBVyxLQUFLLENBQUM7QUFBQSxRQUN6RCxDQUFDO0FBQUEsTUFDSDtBQUNBLFlBQU0sUUFBUSxLQUFLLFdBQVcsU0FBUyxTQUFTO0FBQUEsUUFDOUMsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLFVBQ0osTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxNQUNGLENBQUM7QUFDRCxXQUFLLHFCQUFxQjtBQUMxQixZQUFNLHFCQUNKLEtBQUssb0JBQW9CLGtCQUFrQixLQUFLLE9BQU8sU0FBUyxZQUFZLEtBQUssWUFBWSxJQUN6RixLQUNBLEtBQUssT0FBTyxTQUFTO0FBQzNCLFVBQUksTUFBTSxVQUFVLG9CQUFvQjtBQUN0QyxjQUFNLFFBQVE7QUFBQSxNQUNoQjtBQUNBLFlBQU0saUJBQWlCLFFBQVEsTUFBTTtBQUNuQyxhQUFLLEtBQUssZ0JBQWdCLE1BQU0sS0FBSztBQUFBLE1BQ3ZDLENBQUM7QUFDRCxZQUFNLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUMzQyxZQUFJLE1BQU0sUUFBUSxTQUFTO0FBQ3pCLGdCQUFNLGVBQWU7QUFDckIsZ0JBQU0sS0FBSztBQUFBLFFBQ2I7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQ0EsU0FBSyxpQ0FBaUM7QUFBQSxFQUN4QztBQUFBLEVBRVEsbUNBQXlDO0FBQy9DLFVBQU0sV0FBVyxLQUFLLGFBQWEsS0FBSztBQUN4QyxRQUFJLEtBQUssZUFBZTtBQUN0QixXQUFLLGNBQWMsV0FBVztBQUFBLElBQ2hDO0FBQ0EsUUFBSSxLQUFLLG9CQUFvQjtBQUMzQixXQUFLLG1CQUFtQixXQUFXO0FBQUEsSUFDckM7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLHNCQUFxQztBQUNqRCxTQUFLLHNCQUFzQjtBQUMzQixTQUFLLG9CQUFvQjtBQUN6QixRQUFJO0FBQ0YsV0FBSyxlQUFlLE1BQU0sOEJBQThCO0FBQUEsSUFDMUQsVUFBRTtBQUNBLFdBQUssc0JBQXNCO0FBQzNCLFdBQUssb0JBQW9CO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLHFCQUFxQixPQUE4QjtBQUMvRCxRQUFJLFVBQVUsMEJBQTBCO0FBQ3RDLFdBQUssbUJBQW1CO0FBQ3hCLFdBQUssb0JBQW9CO0FBQ3pCO0FBQUEsSUFDRjtBQUNBLFNBQUssbUJBQW1CO0FBQ3hCLFNBQUssT0FBTyxTQUFTLGFBQWE7QUFDbEMsVUFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixTQUFLLG9CQUFvQjtBQUN6QixVQUFNLEtBQUssY0FBYztBQUFBLEVBQzNCO0FBQUEsRUFFQSxNQUFjLGdCQUFnQixPQUE4QjtBQUMxRCxVQUFNLFFBQVEsTUFBTSxLQUFLO0FBQ3pCLFFBQUksQ0FBQyxPQUFPO0FBQ1YsV0FBSyxtQkFBbUI7QUFDeEIsV0FBSyxvQkFBb0I7QUFDekI7QUFBQSxJQUNGO0FBQ0EsU0FBSyxtQkFBbUI7QUFDeEIsU0FBSyxPQUFPLFNBQVMsYUFBYTtBQUNsQyxVQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLFNBQUssb0JBQW9CO0FBQ3pCLFVBQU0sS0FBSyxjQUFjO0FBQUEsRUFDM0I7QUFBQSxFQUVRLGVBQWUsVUFBbUM7QUFDeEQsU0FBSyxRQUFRLFNBQVMsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLE9BQU87QUFFOUQsUUFBSSxTQUFTLFFBQVEsU0FBUyxLQUFLLFdBQVcsU0FBUyxHQUFHO0FBQ3hELFVBQUksZUFBZSxLQUFLLEtBQUs7QUFBQSxRQUMzQixNQUFNLFNBQVM7QUFBQSxRQUNmLFVBQVUsS0FBSyxPQUFPO0FBQUEsUUFDdEIsV0FBVyxPQUFPLFNBQVMsS0FBSyxPQUFPLG9CQUFvQixJQUFJO0FBQUEsUUFDL0QsWUFBWSxPQUFPLFNBQVMsVUFBVTtBQUNwQyxlQUFLLG1CQUFtQixTQUFTLEtBQUs7QUFDdEMsZ0JBQU0sS0FBSyxjQUFjO0FBQUEsUUFDM0I7QUFBQSxNQUNGLENBQUMsRUFBRSxLQUFLO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLFdBQVcsU0FBa0IsUUFBd0IsU0FBZTtBQUMxRSxTQUFLLFlBQVk7QUFDakIsU0FBSyxlQUFlO0FBQ3BCLFFBQUksU0FBUztBQUNYLFdBQUssbUJBQW1CLEtBQUssSUFBSTtBQUNqQyxXQUFLLGtCQUFrQjtBQUN2QixXQUFLLGtCQUFrQjtBQUN2QixXQUFLLHVCQUF1QjtBQUFBLElBQzlCLE9BQU87QUFDTCxXQUFLLGlCQUFpQjtBQUN0QixXQUFLLGNBQWM7QUFDbkIsV0FBSyx1QkFBdUI7QUFBQSxJQUM5QjtBQUNBLFNBQUssUUFBUSxXQUFXO0FBQ3hCLFNBQUssYUFBYSxTQUFTO0FBQzNCLFNBQUssYUFBYSxTQUFTLENBQUM7QUFDNUIsU0FBSyxhQUFhLFdBQVc7QUFDN0IsU0FBSyxpQ0FBaUM7QUFBQSxFQUN4QztBQUFBLEVBRVEsa0JBQXdCO0FBQzlCLFFBQUksS0FBSyxrQkFBa0IsTUFBTTtBQUMvQiwyQkFBcUIsS0FBSyxhQUFhO0FBQUEsSUFDekM7QUFDQSxTQUFLLGdCQUFnQixzQkFBc0IsTUFBTTtBQUMvQyxXQUFLLGdCQUFnQjtBQUNyQixXQUFLLFFBQVEsTUFBTSxTQUFTO0FBQzVCLFdBQUssUUFBUSxNQUFNLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxRQUFRLGNBQWMsR0FBRyxDQUFDO0FBQUEsSUFDekUsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVRLFFBQVEsTUFBd0IsTUFBYyxTQUFtQztBQUN2RixVQUFNLE9BQWlCLEVBQUUsTUFBTSxNQUFNLFFBQVE7QUFDN0MsU0FBSyxNQUFNLEtBQUssSUFBSTtBQUNwQixTQUFLLEtBQUssa0JBQWtCLElBQUk7QUFDaEMsU0FBSyxrQkFBa0I7QUFBQSxFQUN6QjtBQUFBLEVBRVEsbUJBQW1CLFNBQWlCLE9BQXVCO0FBQ2pFLFVBQU0sT0FBaUI7QUFBQSxNQUNyQixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixjQUFjO0FBQUEsSUFDaEI7QUFDQSxTQUFLLE1BQU0sS0FBSyxJQUFJO0FBQ3BCLFNBQUssS0FBSyxrQkFBa0IsSUFBSTtBQUNoQyxTQUFLLGtCQUFrQjtBQUFBLEVBQ3pCO0FBQUEsRUFFQSxNQUFjLG9CQUFtQztBQUMvQyxRQUFJLEtBQUssV0FBVztBQUNsQixVQUFJLHdCQUFPLDREQUE0RDtBQUN2RTtBQUFBLElBQ0Y7QUFDQSxRQUFJLEtBQUssTUFBTSxXQUFXLEdBQUc7QUFDM0I7QUFBQSxJQUNGO0FBQ0EsU0FBSyxRQUFRLENBQUM7QUFDZCxTQUFLLGlCQUFpQjtBQUN0QixTQUFLLFdBQVcsTUFBTTtBQUN0QixTQUFLLGlCQUFpQjtBQUN0QixTQUFLLDJCQUEyQjtBQUNoQyxTQUFLLGtCQUFrQjtBQUFBLEVBQ3pCO0FBQUEsRUFFUSxvQkFBMEI7QUFDaEMsUUFBSSxDQUFDLEtBQUssZUFBZTtBQUN2QjtBQUFBLElBQ0Y7QUFDQSxVQUFNLFdBQVcsS0FBSyxNQUFNLFdBQVc7QUFDdkMsU0FBSyxjQUFjLFdBQVc7QUFDOUIsU0FBSyxjQUFjLFlBQVksdUJBQXVCLFFBQVE7QUFBQSxFQUNoRTtBQUFBLEVBRUEsTUFBYyxrQkFBa0IsTUFBK0I7QUFoZ0JqRTtBQWlnQkksVUFBTSxhQUFhLEVBQUUsS0FBSztBQUUxQixVQUFNLFVBQVUsS0FBSyxXQUFXLGNBQWMsbUJBQW1CO0FBQ2pFLFFBQUksU0FBUztBQUNYLGNBQVEsT0FBTztBQUFBLElBQ2pCO0FBRUEsU0FBSyx1QkFBdUI7QUFFNUIsVUFBTSxPQUFPLEtBQUssV0FBVyxTQUFTLE9BQU87QUFBQSxNQUMzQyxLQUFLLHlDQUF5QyxLQUFLLElBQUk7QUFBQSxJQUN6RCxDQUFDO0FBQ0QsVUFBTSxTQUFTLEtBQUssU0FBUyxPQUFPLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUM5RCxVQUFNLFdBQVcsT0FBTyxTQUFTLE1BQU07QUFDdkMsa0NBQVEsVUFBVSxLQUFLLFlBQVksS0FBSyxJQUFJLENBQUM7QUFDN0MsV0FBTyxTQUFTLFFBQVEsRUFBRSxNQUFNLEtBQUssYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO0FBRTlELFVBQU0sU0FBUyxLQUFLLFNBQVMsT0FBTyxFQUFFLEtBQUssZUFBZSxDQUFDO0FBQzNELFFBQUksS0FBSyxTQUFTLFNBQVM7QUFDekIsVUFBSTtBQUNGLGNBQU0sa0NBQWlCLE9BQU8sS0FBSyxLQUFLLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSTtBQUFBLE1BQ3JFLFNBQVE7QUFDTixlQUFPLFFBQVEsS0FBSyxJQUFJO0FBQUEsTUFDMUI7QUFDQSxVQUFJLGVBQWUsS0FBSyxrQkFBa0I7QUFDeEMsYUFBSyxPQUFPO0FBQ1o7QUFBQSxNQUNGO0FBQ0EsV0FBSyxlQUFlLE1BQU07QUFBQSxJQUM1QixPQUFPO0FBQ0wsYUFBTyxRQUFRLEtBQUssSUFBSTtBQUFBLElBQzFCO0FBQ0EsUUFBSSxLQUFLLFNBQVMsYUFBVyxVQUFLLFlBQUwsbUJBQWMsU0FBUTtBQUNqRCxXQUFLLGNBQWMsTUFBTSxLQUFLLE9BQU87QUFBQSxJQUN2QztBQUNBLFFBQUksS0FBSyxTQUFTLGFBQVcsVUFBSyxpQkFBTCxtQkFBbUIsU0FBUTtBQUN0RCxXQUFLLG1CQUFtQixNQUFNLEtBQUssWUFBWTtBQUFBLElBQ2pEO0FBRUEsU0FBSyxvQkFBb0I7QUFBQSxFQUMzQjtBQUFBLEVBRVEsYUFBYSxNQUFnQztBQUNuRCxZQUFRLE1BQU07QUFBQSxNQUNaLEtBQUs7QUFDSCxlQUFPO0FBQUEsTUFDVCxLQUFLO0FBQ0gsZUFBTztBQUFBLE1BQ1QsS0FBSztBQUNILGVBQU87QUFBQSxNQUNULEtBQUs7QUFDSCxlQUFPO0FBQUEsTUFDVDtBQUNFLGVBQU87QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBRVEsWUFBWSxNQUFnQztBQUNsRCxZQUFRLE1BQU07QUFBQSxNQUNaLEtBQUs7QUFDSCxlQUFPO0FBQUEsTUFDVCxLQUFLO0FBQ0gsZUFBTztBQUFBLE1BQ1QsS0FBSztBQUNILGVBQU87QUFBQSxNQUNULEtBQUs7QUFDSCxlQUFPO0FBQUEsTUFDVDtBQUNFLGVBQU87QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBRVEseUJBQStCO0FBQ3JDLFFBQUksS0FBSyxXQUFXLGNBQWMsNkJBQTZCLEdBQUc7QUFDaEU7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLEtBQUssV0FBVyxTQUFTLE9BQU87QUFBQSxNQUMzQyxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBQ0QsVUFBTSxTQUFTLEtBQUssU0FBUyxPQUFPLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUM5RCxVQUFNLFdBQVcsT0FBTyxTQUFTLE1BQU07QUFDdkMsa0NBQVEsVUFBVSxlQUFlO0FBQ2pDLFdBQU8sU0FBUyxRQUFRLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFFekMsVUFBTSxVQUFVLEtBQUssU0FBUyxPQUFPLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQztBQUM3RCxVQUFNLE9BQU8sUUFBUSxTQUFTLE9BQU8sRUFBRSxLQUFLLHFCQUFxQixDQUFDO0FBQ2xFLFNBQUssU0FBUyxNQUFNO0FBQ3BCLFNBQUssU0FBUyxNQUFNO0FBQ3BCLFNBQUssU0FBUyxNQUFNO0FBQ3BCLFVBQU0sT0FBTyxRQUFRLFNBQVMsT0FBTyxFQUFFLEtBQUsscUJBQXFCLENBQUM7QUFDbEUsU0FBSyxpQkFBaUIsS0FBSyxTQUFTLFFBQVE7QUFBQSxNQUMxQyxLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsU0FBSyxnQkFBZ0IsS0FBSyxTQUFTLFFBQVE7QUFBQSxNQUN6QyxLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsU0FBSyxvQkFBb0I7QUFBQSxFQUMzQjtBQUFBLEVBRVEseUJBQStCO0FBQ3JDLFVBQU0sWUFBWSxLQUFLLFdBQVcsY0FBYyw2QkFBNkI7QUFDN0UsUUFBSSxXQUFXO0FBQ2IsZ0JBQVUsT0FBTztBQUFBLElBQ25CO0FBQ0EsU0FBSyxnQkFBZ0I7QUFDckIsU0FBSyxpQkFBaUI7QUFBQSxFQUN4QjtBQUFBLEVBRUEsTUFBYyxpQkFBZ0M7QUEvbUJoRDtBQWduQkksVUFBTSxhQUFhLEVBQUUsS0FBSztBQUMxQixTQUFLLFdBQVcsTUFBTTtBQUN0QixRQUFJLENBQUMsS0FBSyxNQUFNLFFBQVE7QUFDdEIsV0FBSyxpQkFBaUI7QUFDdEI7QUFBQSxJQUNGO0FBQ0EsZUFBVyxRQUFRLEtBQUssT0FBTztBQUM3QixVQUFJLGVBQWUsS0FBSyxrQkFBa0I7QUFDeEM7QUFBQSxNQUNGO0FBQ0EsWUFBTSxPQUFPLEtBQUssV0FBVyxTQUFTLE9BQU87QUFBQSxRQUMzQyxLQUFLLHlDQUF5QyxLQUFLLElBQUk7QUFBQSxNQUN6RCxDQUFDO0FBQ0QsWUFBTSxTQUFTLEtBQUssU0FBUyxPQUFPLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUM5RCxZQUFNLFdBQVcsT0FBTyxTQUFTLE1BQU07QUFDdkMsb0NBQVEsVUFBVSxLQUFLLFlBQVksS0FBSyxJQUFJLENBQUM7QUFDN0MsYUFBTyxTQUFTLFFBQVEsRUFBRSxNQUFNLEtBQUssYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO0FBRTlELFlBQU0sU0FBUyxLQUFLLFNBQVMsT0FBTyxFQUFFLEtBQUssZUFBZSxDQUFDO0FBQzNELFVBQUksS0FBSyxTQUFTLFNBQVM7QUFDekIsWUFBSTtBQUNGLGdCQUFNLGtDQUFpQixPQUFPLEtBQUssS0FBSyxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUk7QUFBQSxRQUNyRSxTQUFRO0FBQ04saUJBQU8sUUFBUSxLQUFLLElBQUk7QUFBQSxRQUMxQjtBQUNBLFlBQUksZUFBZSxLQUFLLGtCQUFrQjtBQUN4QztBQUFBLFFBQ0Y7QUFDQSxhQUFLLGVBQWUsTUFBTTtBQUFBLE1BQzVCLE9BQU87QUFDTCxlQUFPLFFBQVEsS0FBSyxJQUFJO0FBQUEsTUFDMUI7QUFDQSxVQUFJLEtBQUssU0FBUyxhQUFXLFVBQUssWUFBTCxtQkFBYyxTQUFRO0FBQ2pELGFBQUssY0FBYyxNQUFNLEtBQUssT0FBTztBQUFBLE1BQ3ZDO0FBQ0EsVUFBSSxLQUFLLFNBQVMsYUFBVyxVQUFLLGlCQUFMLG1CQUFtQixTQUFRO0FBQ3RELGFBQUssbUJBQW1CLE1BQU0sS0FBSyxZQUFZO0FBQUEsTUFDakQ7QUFBQSxJQUNGO0FBQ0EsUUFBSSxLQUFLLFdBQVc7QUFDbEIsV0FBSyx1QkFBdUI7QUFBQSxJQUM5QjtBQUNBLFNBQUssb0JBQW9CO0FBQUEsRUFDM0I7QUFBQSxFQUVRLG9CQUEwQjtBQUNoQyxTQUFLLGlCQUFpQjtBQUN0QixTQUFLLGVBQWUsT0FBTyxZQUFZLE1BQU07QUFDM0MsV0FBSyxrQkFBa0I7QUFBQSxJQUN6QixHQUFHLEdBQUk7QUFBQSxFQUNUO0FBQUEsRUFFUSxtQkFBeUI7QUFDL0IsUUFBSSxLQUFLLGlCQUFpQixNQUFNO0FBQzlCLGFBQU8sY0FBYyxLQUFLLFlBQVk7QUFDdEMsV0FBSyxlQUFlO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBQUEsRUFFUSxvQkFBMEI7QUFDaEMsVUFBTSxVQUFVLEtBQUssSUFBSSxHQUFHLEtBQUssT0FBTyxLQUFLLElBQUksSUFBSSxLQUFLLG9CQUFvQixHQUFJLENBQUM7QUFDbkYsVUFBTSxhQUFhLEtBQUssaUJBQWlCLFVBQVUsb0JBQW9CO0FBQ3ZFLFNBQUssY0FBYyxHQUFHLFVBQVUsU0FBTSxPQUFPO0FBQzdDLFFBQUksS0FBSyxlQUFlO0FBQ3RCLFdBQUssY0FBYyxRQUFRLEtBQUssV0FBVztBQUFBLElBQzdDO0FBQ0EsUUFBSSxLQUFLLGdCQUFnQjtBQUN2QixXQUFLLGVBQWUsUUFBUSxLQUFLLGlCQUFpQixVQUFVLDBCQUFxQixvQkFBZTtBQUFBLElBQ2xHO0FBQUEsRUFDRjtBQUFBLEVBRVEsbUJBQXlCO0FBQy9CLFVBQU0sUUFBUSxLQUFLLFdBQVcsU0FBUyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUN6RSxVQUFNLE9BQU8sTUFBTSxTQUFTLE9BQU8sRUFBRSxLQUFLLHdCQUF3QixDQUFDO0FBQ25FLGtDQUFRLE1BQU0sZUFBZTtBQUM3QixVQUFNLFNBQVMsVUFBVSxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDM0UsVUFBTSxTQUFTLFFBQVE7QUFBQSxNQUNyQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRVEsY0FBYyxXQUF3QixTQUFrQztBQUM5RSxVQUFNLFVBQVUsVUFBVSxTQUFTLFdBQVcsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ3RFLFlBQVEsU0FBUyxXQUFXO0FBQUEsTUFDMUIsTUFBTSxZQUFZLEtBQUssSUFBSSxRQUFRLFFBQVEsQ0FBQyxDQUFDO0FBQUEsSUFDL0MsQ0FBQztBQUNELGVBQVcsVUFBVSxRQUFRLE1BQU0sR0FBRyxDQUFDLEdBQUc7QUFDeEMsWUFBTSxXQUFXLFFBQVEsU0FBUyxPQUFPLEVBQUUsS0FBSyxlQUFlLENBQUM7QUFDaEUsWUFBTSxRQUFRLFNBQVMsU0FBUyxVQUFVO0FBQUEsUUFDeEMsS0FBSztBQUFBLFFBQ0wsTUFBTSxPQUFPO0FBQUEsTUFDZixDQUFDO0FBQ0QsWUFBTSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3BDLGFBQUssS0FBSyxXQUFXLE9BQU8sSUFBSTtBQUFBLE1BQ2xDLENBQUM7QUFDRCxlQUFTLFNBQVMsT0FBTztBQUFBLFFBQ3ZCLEtBQUs7QUFBQSxRQUNMLE1BQU0sT0FBTztBQUFBLE1BQ2YsQ0FBQztBQUNELFVBQUksT0FBTyxTQUFTO0FBQ2xCLGlCQUFTLFNBQVMsT0FBTztBQUFBLFVBQ3ZCLEtBQUs7QUFBQSxVQUNMLE1BQU0sT0FBTztBQUFBLFFBQ2YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRVEsbUJBQW1CLFdBQXdCLE9BQXVCO0FBQ3hFLFVBQU0sUUFBUSxVQUFVLFNBQVMsT0FBTyxFQUFFLEtBQUssc0JBQXNCLENBQUM7QUFDdEUsVUFBTSxTQUFTLE9BQU87QUFBQSxNQUNwQixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsZUFBVyxRQUFRLE9BQU87QUFDeEIsWUFBTSxTQUFTLE1BQU0sU0FBUyxVQUFVO0FBQUEsUUFDdEMsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUNELGFBQU8saUJBQWlCLFNBQVMsTUFBTTtBQUNyQyxhQUFLLEtBQUssV0FBVyxJQUFJO0FBQUEsTUFDM0IsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQUEsRUFFUSxhQUFhLFlBQVksSUFBYTtBQUM1QyxVQUFNLEtBQUssS0FBSztBQUNoQixXQUFPLEdBQUcsZUFBZSxHQUFHLFlBQVksR0FBRyxlQUFlO0FBQUEsRUFDNUQ7QUFBQSxFQUVRLHNCQUE0QjtBQUNsQyxRQUFJLEtBQUssZ0JBQWdCO0FBQ3ZCLFdBQUssMkJBQTJCO0FBQ2hDO0FBQUEsSUFDRjtBQUNBLFNBQUssV0FBVyxTQUFTLEVBQUUsS0FBSyxLQUFLLFdBQVcsY0FBYyxVQUFVLFNBQVMsQ0FBQztBQUNsRixTQUFLLDJCQUEyQjtBQUFBLEVBQ2xDO0FBQUEsRUFFUSw2QkFBbUM7QUFDekMsUUFBSSxDQUFDLEtBQUssa0JBQWtCO0FBQzFCO0FBQUEsSUFDRjtBQUNBLFVBQU0sT0FBTyxLQUFLLGtCQUFrQixLQUFLLE1BQU0sU0FBUztBQUN4RCxTQUFLLGlCQUFpQixZQUFZLG1DQUFtQyxJQUFJO0FBQUEsRUFDM0U7QUFBQSxFQUVRLGVBQWUsV0FBOEI7QUFDbkQsVUFBTSxhQUFhLFVBQVUsaUJBQWlCLEtBQUs7QUFDbkQsZUFBVyxPQUFPLE1BQU0sS0FBSyxVQUFVLEdBQUc7QUFDeEMsWUFBTSxPQUFPLElBQUksY0FBYyxNQUFNO0FBQ3JDLFVBQUksQ0FBQyxNQUFNO0FBQ1Q7QUFBQSxNQUNGO0FBQ0EsWUFBTSxTQUFTLFNBQVMsY0FBYyxRQUFRO0FBQzlDLGFBQU8sWUFBWTtBQUNuQixhQUFPLGNBQWM7QUFDckIsYUFBTyxhQUFhLGNBQWMsV0FBVztBQUM3QyxhQUFPLGlCQUFpQixTQUFTLE1BQU07QUFDckMsYUFBSyxVQUFVLFVBQVUsVUFBVSxLQUFLLGVBQWUsRUFBRSxFQUFFLEtBQUssTUFBTTtBQUNwRSxpQkFBTyxjQUFjO0FBQ3JCLGlCQUFPLFVBQVUsSUFBSSxRQUFRO0FBQzdCLGlCQUFPLFdBQVcsTUFBTTtBQUN0QixtQkFBTyxjQUFjO0FBQ3JCLG1CQUFPLFVBQVUsT0FBTyxRQUFRO0FBQUEsVUFDbEMsR0FBRyxJQUFJO0FBQUEsUUFDVCxDQUFDLEVBQUUsTUFBTSxNQUFNO0FBQ2IsaUJBQU8sY0FBYztBQUNyQixpQkFBTyxXQUFXLE1BQU07QUFDdEIsbUJBQU8sY0FBYztBQUFBLFVBQ3ZCLEdBQUcsSUFBSTtBQUFBLFFBQ1QsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUNELFVBQUksWUFBWSxNQUFNO0FBQUEsSUFDeEI7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLFdBQVcsTUFBNkI7QUFDcEQsVUFBTSxPQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixJQUFJO0FBQ3RELFFBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLFFBQVEsS0FBSztBQUM3QyxVQUFNLEtBQUssU0FBUyxJQUFJO0FBQUEsRUFDMUI7QUFDRjtBQUVBLFNBQVMsaUJBQWlCLE9BQXlCO0FBQ2pELFNBQU8saUJBQWlCLFNBQVMsTUFBTSxZQUFZO0FBQ3JEOzs7QUdyeUJPLFNBQVMsaUJBQWlCLFFBQWdDO0FBQy9ELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsWUFBWTtBQUNwQixZQUFNLE9BQU8sWUFBWTtBQUFBLElBQzNCO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sVUFBVSxZQUFZO0FBQ3BCLFlBQU0sT0FBTyxxQkFBcUI7QUFBQSxJQUNwQztBQUFBLEVBQ0YsQ0FBQztBQUNIOzs7QWxCUEEsSUFBcUIsY0FBckIsY0FBeUMsd0JBQU87QUFBQSxFQUFoRDtBQUFBO0FBU0UsU0FBUSxjQUF1QztBQUFBO0FBQUEsRUFFL0MsTUFBTSxTQUF3QjtBQUM1QixVQUFNLEtBQUssYUFBYTtBQUV4QixTQUFLLGVBQWUsSUFBSSxhQUFhLEtBQUssR0FBRztBQUM3QyxTQUFLLFlBQVksSUFBSSxlQUFlO0FBQ3BDLFNBQUssY0FBYyxJQUFJLGlCQUFpQixJQUFJO0FBQzVDLFNBQUsscUJBQXFCLElBQUk7QUFBQSxNQUM1QixLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUs7QUFBQSxJQUNiO0FBQ0EsU0FBSyxvQkFBb0IsSUFBSTtBQUFBLE1BQzNCLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSztBQUFBLElBQ2I7QUFDQSxTQUFLLG9CQUFvQixJQUFJO0FBQUEsTUFDM0IsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLO0FBQUEsSUFDYjtBQUNBLFNBQUssbUJBQW1CLElBQUk7QUFBQSxNQUMxQixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxNQUFNLEtBQUs7QUFBQSxJQUNiO0FBRUEsU0FBSyxhQUFhLGlCQUFpQixDQUFDLFNBQVM7QUFDM0MsWUFBTSxPQUFPLElBQUksaUJBQWlCLE1BQU0sSUFBSTtBQUM1QyxXQUFLLGNBQWM7QUFDbkIsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUVELHFCQUFpQixJQUFJO0FBRXJCLFNBQUssY0FBYyxJQUFJLGdCQUFnQixLQUFLLEtBQUssSUFBSSxDQUFDO0FBRXRELFFBQUk7QUFDRixZQUFNLEtBQUssYUFBYSxtQkFBbUIsS0FBSyxRQUFRO0FBQ3hELFlBQU0sS0FBSyxtQkFBbUIsdUJBQXVCO0FBQUEsSUFDdkQsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTyxvQ0FBb0M7QUFBQSxJQUN2RDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFdBQWlCO0FBQ2YsU0FBSyxjQUFjO0FBQUEsRUFDckI7QUFBQSxFQUVBLE1BQU0sZUFBOEI7QUE3RXRDO0FBOEVJLFFBQUk7QUFDRixZQUFNLFVBQVUsV0FBTSxLQUFLLFNBQVMsTUFBcEIsWUFBMEIsQ0FBQztBQUMzQyxXQUFLLFdBQVcsdUJBQXVCLE1BQU07QUFBQSxJQUMvQyxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLCtCQUErQjtBQUNoRCxXQUFLLFdBQVcsdUJBQXVCLENBQUMsQ0FBQztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxlQUE4QjtBQXZGdEM7QUF3RkksU0FBSyxXQUFXLHVCQUF1QixLQUFLLFFBQVE7QUFDcEQsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQ2pDLFFBQUk7QUFDRixZQUFNLEtBQUssYUFBYSxtQkFBbUIsS0FBSyxRQUFRO0FBQ3hELGNBQU0sVUFBSyx1QkFBTCxtQkFBeUI7QUFBQSxJQUNqQyxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLG9DQUFvQztBQUFBLElBQ3ZEO0FBQ0EsVUFBTSxLQUFLLHFCQUFxQjtBQUFBLEVBQ2xDO0FBQUEsRUFFQSxNQUFNLGNBQTZCO0FBQ2pDLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxhQUFhLEtBQUs7QUFDbEQsUUFBSSxDQUFDLE1BQU07QUFDVCxVQUFJLHdCQUFPLDRCQUE0QjtBQUN2QztBQUFBLElBQ0Y7QUFDQSxVQUFNLEtBQUssYUFBYTtBQUFBLE1BQ3RCLE1BQU07QUFBQSxNQUNOLFFBQVE7QUFBQSxJQUNWLENBQUM7QUFDRCxTQUFLLElBQUksVUFBVSxXQUFXLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRUEsTUFBTSx1QkFBc0M7QUFDMUMsVUFBTSxLQUFLLG1CQUFtQix1QkFBdUI7QUFDckQsVUFBTSxPQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixLQUFLLFNBQVMsZ0JBQWdCO0FBQ2hGLFFBQUksRUFBRSxnQkFBZ0IseUJBQVE7QUFDNUIsVUFBSSx3QkFBTyxrQkFBa0IsS0FBSyxTQUFTLGdCQUFnQixFQUFFO0FBQzdEO0FBQUEsSUFDRjtBQUNBLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDN0MsVUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLEVBQzFCO0FBQUEsRUFFQSxNQUFNLGNBQWMsU0FBaUIsVUFBMEIsQ0FBQyxHQUFHLFFBQXNCLFNBQXVFO0FBQzlKLFdBQU8sS0FBSyxpQkFBaUIsUUFBUSxTQUFTLFNBQVMsUUFBUSxPQUFPO0FBQUEsRUFDeEU7QUFBQSxFQUVBLE1BQU0sb0JBQW9CLE1BQXlDO0FBQ2pFLFVBQU0sUUFBUSxNQUFNLEtBQUssa0JBQWtCLFVBQVUsSUFBSTtBQUN6RCxVQUFNLEtBQUssK0JBQStCO0FBQzFDLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxxQkFBOEM7QUFDNUMsVUFBTSxTQUFTLEtBQUssSUFBSSxVQUFVLGdCQUFnQixlQUFlO0FBQ2pFLGVBQVcsUUFBUSxRQUFRO0FBQ3pCLFlBQU0sT0FBTyxLQUFLO0FBQ2xCLFVBQUksZ0JBQWdCLGtCQUFrQjtBQUNwQyxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSx1QkFBc0M7QUFoSjlDO0FBaUpJLFlBQU0sVUFBSyxtQkFBbUIsTUFBeEIsbUJBQTJCO0FBQUEsRUFDbkM7QUFBQSxFQUVBLE1BQU0saUNBQWdEO0FBQ3BELFFBQUk7QUFDRixZQUFNLEtBQUsscUJBQXFCO0FBQUEsSUFDbEMsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUsT0FBTyxrQ0FBa0M7QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFFRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAibWVzc2FnZSJdCn0K
