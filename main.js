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
var MIN_CODEX_TIMEOUT_SECONDS = 15;
var MAX_CODEX_TIMEOUT_SECONDS = 900;
var DEFAULT_BRAIN_SETTINGS = {
  notesFolder: "Notes",
  instructionsFile: "Brain/AGENTS.md",
  codexModel: "",
  codexTimeoutSeconds: 120,
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
    codexTimeoutSeconds: normalizeTimeoutSeconds(merged.codexTimeoutSeconds),
    excludeFolders: normalizeExcludeFolders(merged.excludeFolders)
  };
}
function normalizeTimeoutSeconds(value) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_BRAIN_SETTINGS.codexTimeoutSeconds;
  }
  return Math.min(
    MAX_CODEX_TIMEOUT_SECONDS,
    Math.max(MIN_CODEX_TIMEOUT_SECONDS, Math.round(numeric))
  );
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
var CODEX_CACHE_MS = 3e4;
var loginStatusCache = null;
var loginStatusInFlight = null;
var binaryPathCache = null;
var binaryPathInFlight = null;
function isFresh(entry) {
  return entry !== null && Date.now() - entry.at < CODEX_CACHE_MS;
}
function clearCodexCache() {
  loginStatusCache = null;
  loginStatusInFlight = null;
  binaryPathCache = null;
  binaryPathInFlight = null;
}
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
async function getCodexLoginStatus(options) {
  if (options == null ? void 0 : options.force) {
    clearCodexCache();
  } else if (isFresh(loginStatusCache)) {
    return loginStatusCache.value;
  }
  if (!loginStatusInFlight) {
    loginStatusInFlight = fetchCodexLoginStatus().finally(() => {
      loginStatusInFlight = null;
    });
  }
  return loginStatusInFlight;
}
async function fetchCodexLoginStatus() {
  const status = await readCodexLoginStatus();
  loginStatusCache = { at: Date.now(), value: status };
  return status;
}
async function readCodexLoginStatus() {
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
  if (isFresh(binaryPathCache)) {
    return binaryPathCache.value;
  }
  if (!binaryPathInFlight) {
    binaryPathInFlight = findCodexBinaryPath().then((resolved) => {
      binaryPathCache = { at: Date.now(), value: resolved };
      return resolved;
    }).finally(() => {
      binaryPathInFlight = null;
    });
  }
  return binaryPathInFlight;
}
async function findCodexBinaryPath() {
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
      await fs.promises.access(candidate, fs.constants.X_OK);
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
async function getAIConfigurationStatus(settings, options) {
  const codexStatus = await getCodexLoginStatus(options);
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
    this.renderTimeoutSection(containerEl);
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
        void this.refreshModelOptions();
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
  renderTimeoutSection(containerEl) {
    new import_obsidian.Setting(containerEl).setName("Codex timeout").setDesc(
      `How long to wait for a Codex reply before giving up, in seconds (${MIN_CODEX_TIMEOUT_SECONDS}-${MAX_CODEX_TIMEOUT_SECONDS}). Raise this if you use a slower reasoning model.`
    ).addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = String(MIN_CODEX_TIMEOUT_SECONDS);
      text.inputEl.max = String(MAX_CODEX_TIMEOUT_SECONDS);
      text.setValue(String(this.plugin.settings.codexTimeoutSeconds));
      const commit = () => {
        const parsed = Number(text.inputEl.value);
        const next = Number.isFinite(parsed) ? Math.min(
          MAX_CODEX_TIMEOUT_SECONDS,
          Math.max(MIN_CODEX_TIMEOUT_SECONDS, Math.round(parsed))
        ) : this.plugin.settings.codexTimeoutSeconds;
        this.plugin.settings.codexTimeoutSeconds = next;
        text.setValue(String(next));
        void this.plugin.saveSettings();
      };
      text.inputEl.addEventListener("blur", commit);
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          text.inputEl.blur();
        }
      });
    });
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
      const status = await getAIConfigurationStatus(this.plugin.settings, { force });
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
var BrainAIService = class {
  async completeChat(messages, settings, signal) {
    return this.postCodexCompletion(settings, messages, signal);
  }
  async postCodexCompletion(settings, messages, signal) {
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
        timeout: settings.codexTimeoutSeconds * 1e3,
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
          `Codex did not respond within ${settings.codexTimeoutSeconds}s. Raise "Codex timeout" in Brain settings, or check \`codex login status\` outside Brain.`
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
    let settled = false;
    let killTimer = null;
    const { signal, stdin, ...execOptions } = options;
    const child = execFile(file, args, execOptions, (error, stdout, stderr) => {
      if (settled) {
        return;
      }
      settled = true;
      signal == null ? void 0 : signal.removeEventListener("abort", abort);
      if (killTimer !== null) {
        window.clearTimeout(killTimer);
        killTimer = null;
      }
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
    if (stdin !== void 0 && child.stdin) {
      child.stdin.on("error", () => void 0);
      child.stdin.end(stdin);
    }
    const abort = () => {
      if (settled) {
        return;
      }
      child.kill("SIGTERM");
      killTimer = window.setTimeout(() => {
        killTimer = null;
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
    clearCodexCache();
    window.open("https://openai.com/codex/get-started/");
  }
  async getCodexStatus(options) {
    return getCodexLoginStatus(options);
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
var CHAT_CONTEXT_LIMIT = 8;
var MAX_HISTORY_EXCHANGES = 6;
var MAX_CONTEXT_EXCERPT_CHARS = 1200;
var VaultChatService = class {
  constructor(aiService, instructionService, queryService, writeService, settingsProvider) {
    this.aiService = aiService;
    this.instructionService = instructionService;
    this.queryService = queryService;
    this.writeService = writeService;
    this.settingsProvider = settingsProvider;
  }
  async respond(message, history = [], signal, onStage) {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Enter a message first");
    }
    const settings = this.settingsProvider();
    const aiStatus = await getAIConfigurationStatus(settings);
    if (!aiStatus.configured) {
      throw new Error(aiStatus.message);
    }
    onStage == null ? void 0 : onStage("query");
    const [instructions, sources] = await Promise.all([
      this.instructionService.readInstructions(),
      this.queryService.queryVault(trimmed, {
        limit: CHAT_CONTEXT_LIMIT,
        priorQuery: lastUserMessage(history)
      })
    ]);
    const context = formatSourcesForPrompt(sources);
    onStage == null ? void 0 : onStage("ai");
    const response = await this.aiService.completeChat(
      [
        {
          role: "system",
          content: buildSystemPrompt(instructions, settings)
        },
        {
          role: "user",
          content: buildUserPrompt(trimmed, context, history)
        }
      ],
      settings,
      signal
    );
    const parsed = parseChatResponse(response);
    return {
      answer: parsed.answer || "Codex returned no answer.",
      sources,
      plan: parsed.plan ? this.writeService.normalizePlan(parsed.plan) : null
    };
  }
};
function lastUserMessage(history) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].role === "user") {
      return history[index].text;
    }
  }
  return void 0;
}
function buildSystemPrompt(instructions, settings) {
  return [
    "You are Brain, an Obsidian vault assistant.",
    "Answer from the source hints provided in the user message.",
    "You have no shell and no filesystem access. The source hints are the only vault content available to you; there is nothing else to read.",
    "Never claim facts that are not supported by the provided source hints.",
    "If the hints do not answer the question, say so plainly and name what the user could search for or which note is likely to hold it. Do not guess, and do not describe files you were not shown.",
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
function buildUserPrompt(message, context, history) {
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
    "The source hints below are the complete vault context for this question. There is no other vault content available to you."
  );
  parts.push("");
  parts.push("Relevant source hints:");
  parts.push(
    context || "No matching vault files found. Say so, and suggest what the user could search for instead."
  );
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
  for (const candidate of jsonCandidates(response)) {
    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch (e) {
      continue;
    }
    if (!isJsonObject(parsed)) {
      continue;
    }
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
      plan: isJsonObject(parsed.plan) ? parsed.plan : null
    };
  }
  return {
    answer: response.trim(),
    plan: null
  };
}
function jsonCandidates(text) {
  var _a;
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  const candidates = [trimmed];
  const fenced = (_a = trimmed.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n?```$/i)) == null ? void 0 : _a[1];
  if (fenced) {
    candidates.push(fenced.trim());
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.push(trimmed.slice(start, end + 1));
  }
  return candidates;
}
function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/utils/path-safety.ts
function normalizeComparablePath(value) {
  return value.trim().replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
}
function samePath(left, right) {
  const normalized = normalizeComparablePath(left);
  return Boolean(normalized) && normalized === normalizeComparablePath(right);
}
function isInsideFolder(path, folder) {
  const normalizedFolder = normalizeComparablePath(folder);
  if (!normalizedFolder) {
    return false;
  }
  const normalizedPath = normalizeComparablePath(path);
  return normalizedPath === normalizedFolder || normalizedPath.startsWith(`${normalizedFolder}/`);
}
function isSafeMarkdownPath(path, settings) {
  const segments = path.split("/").filter(Boolean);
  const isSafe = Boolean(path) && path.endsWith(".md") && !segments.includes("..") && segments.every((segment) => !segment.startsWith("."));
  if (!isSafe) {
    return false;
  }
  if (settings && samePath(path, settings.instructionsFile)) {
    return false;
  }
  return true;
}

// src/services/vault-query-service.ts
var MAX_QUERY_FILES = 12;
var MAX_CONTENT_SCAN_FILES = 1e3;
var MAX_EXCERPT_CHARS = 1200;
var MAX_SNIPPET_LINES = 12;
var MIN_TOKEN_LENGTH = 2;
var MAX_TOKENS = 24;
var CARRIED_TOKEN_WEIGHT = 0.4;
var STOP_WORDS = /* @__PURE__ */ new Set([
  "about",
  "am",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "go",
  "have",
  "he",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "know",
  "list",
  "me",
  "my",
  "no",
  "not",
  "of",
  "on",
  "or",
  "so",
  "the",
  "this",
  "that",
  "to",
  "up",
  "us",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you"
]);
var VaultQueryService = class {
  constructor(vaultService, settingsProvider) {
    this.vaultService = vaultService;
    this.settingsProvider = settingsProvider;
  }
  async queryVault(query, options = {}) {
    var _a, _b;
    const limit = (_a = options.limit) != null ? _a : MAX_QUERY_FILES;
    const settings = this.settingsProvider();
    const primaryTokens = tokenize(query);
    const carriedTokens = tokenize((_b = options.priorQuery) != null ? _b : "").filter((token) => !primaryTokens.includes(token));
    const matchers = [
      ...buildTokenMatchers(primaryTokens, 1),
      ...buildTokenMatchers(carriedTokens, CARRIED_TOKEN_WEIGHT)
    ];
    const primaryCount = primaryTokens.length;
    const normalizedQuery = normalizePhrase(query);
    const excludeFolders = parseExcludeFolders(settings.excludeFolders);
    const files = (await this.vaultService.listMarkdownFiles()).filter((file) => shouldIncludeFile(file, settings.instructionsFile, excludeFolders)).sort((left, right) => right.stat.mtime - left.stat.mtime);
    const candidates = this.selectScanCandidates(files, matchers, normalizedQuery);
    const scored = [];
    for (const candidate of candidates) {
      const text = await this.vaultService.readFileText(candidate.file);
      const score = scoreFile(candidate, text, matchers, normalizedQuery, primaryCount);
      if (score <= 0) {
        continue;
      }
      scored.push({ file: candidate.file, score });
    }
    const top = scored.sort((left, right) => right.score - left.score).slice(0, limit);
    const matches = [];
    for (const { file, score } of top) {
      const text = await this.vaultService.readFileText(file);
      matches.push({
        path: file.path,
        title: titleForFile(file, text),
        score,
        reason: buildReason(file, text, matchers, normalizedQuery),
        excerpt: buildExcerpt(text, matchers)
      });
    }
    return matches;
  }
  /**
   * Decides which files are worth reading. Path scoring is free; metadata
   * scoring is only worth computing when the scan budget actually binds.
   */
  selectScanCandidates(files, matchers, normalizedQuery) {
    const withinBudget = files.length <= MAX_CONTENT_SCAN_FILES;
    const candidates = files.map((file) => {
      const pathScore = scorePath(file, matchers, normalizedQuery);
      return {
        file,
        pathScore,
        preScore: withinBudget ? pathScore : pathScore + scoreMetadata(this.vaultService.getFileMetadata(file), matchers)
      };
    });
    if (withinBudget) {
      return candidates;
    }
    return candidates.sort((left, right) => right.preScore - left.preScore).slice(0, MAX_CONTENT_SCAN_FILES);
  }
};
function shouldIncludeFile(file, instructionsFile, excludeFolders) {
  if (samePath(file.path, instructionsFile)) {
    return false;
  }
  return !excludeFolders.some((folder) => isInsideFolder(file.path, folder));
}
function tokenize(input) {
  const seen = /* @__PURE__ */ new Set();
  return input.toLowerCase().split(/[^a-z0-9_/-]+/i).map((token) => token.trim()).filter((token) => token.length >= MIN_TOKEN_LENGTH).filter((token) => !STOP_WORDS.has(token)).filter((token) => {
    if (seen.has(token)) {
      return false;
    }
    seen.add(token);
    return true;
  }).slice(0, MAX_TOKENS);
}
function buildTokenMatchers(tokens, weight) {
  return tokens.map((token) => {
    const escaped = escapeRegExp(token);
    return {
      token,
      weight,
      heading: new RegExp(`(^|\\n)#{1,6}[^\\n]*${escaped}`, "g"),
      link: new RegExp(`\\[\\[[^\\]]*${escaped}[^\\]]*\\]\\]`, "g"),
      tag: new RegExp(`(^|\\s)#[-/_a-z0-9]*${escaped}[-/_a-z0-9]*`, "g"),
      occurrences: new RegExp(escaped, "g")
    };
  });
}
function scorePath(file, matchers, normalizedQuery) {
  const lowerPath = file.path.toLowerCase();
  let score = 0;
  if (normalizedQuery && lowerPath.includes(normalizedQuery)) {
    score += 24;
  }
  for (const matcher of matchers) {
    if (lowerPath.includes(matcher.token)) {
      score += 10 * matcher.weight;
    }
  }
  return score;
}
function scoreMetadata(metadata, matchers) {
  if (!metadata) {
    return 0;
  }
  const blob = metadataBlob(metadata);
  if (!blob) {
    return 0;
  }
  let score = 0;
  for (const matcher of matchers) {
    if (blob.includes(matcher.token)) {
      score += 8 * matcher.weight;
    }
  }
  return score;
}
function metadataBlob(metadata) {
  var _a, _b, _c;
  const parts = [];
  for (const heading of (_a = metadata.headings) != null ? _a : []) {
    parts.push(heading.heading);
  }
  for (const tag of (_b = metadata.tags) != null ? _b : []) {
    parts.push(tag.tag);
  }
  for (const link of (_c = metadata.links) != null ? _c : []) {
    parts.push(link.link);
    if (link.displayText) {
      parts.push(link.displayText);
    }
  }
  for (const alias of frontmatterAliases(metadata)) {
    parts.push(alias);
  }
  return parts.join("\n").toLowerCase();
}
function frontmatterAliases(metadata) {
  var _a;
  const aliases = (_a = metadata.frontmatter) == null ? void 0 : _a.aliases;
  if (typeof aliases === "string") {
    return [aliases];
  }
  if (Array.isArray(aliases)) {
    return aliases.filter((alias) => typeof alias === "string");
  }
  return [];
}
function scoreFile(candidate, text, matchers, normalizedQuery, primaryCount) {
  if (!matchers.length) {
    return 1;
  }
  const { file } = candidate;
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  let score = candidate.pathScore;
  if (containsPhrase(lowerText, normalizedQuery)) {
    score += 18;
  }
  for (const matcher of matchers) {
    let tokenScore = 0;
    if (lowerTitle.includes(matcher.token)) {
      tokenScore += 9;
    }
    tokenScore += countMatches(lowerText, matcher.heading) * 7;
    tokenScore += countMatches(lowerText, matcher.link) * 6;
    tokenScore += countMatches(lowerText, matcher.tag) * 5;
    tokenScore += Math.min(8, countMatches(lowerText, matcher.occurrences));
    score += tokenScore * matcher.weight;
  }
  const matched = matchers.filter(
    (matcher) => lowerPath.includes(matcher.token) || lowerText.includes(matcher.token)
  );
  for (const matcher of matched) {
    score += 3 * matcher.weight;
  }
  const matchedPrimary = matched.filter((matcher) => matcher.weight === 1).length;
  if (primaryCount > 0 && matchedPrimary === primaryCount) {
    score += Math.min(10, primaryCount * 2);
  }
  score += recencyBonus(file);
  return score;
}
function recencyBonus(file) {
  const ageDays = (Date.now() - file.stat.mtime) / (1e3 * 60 * 60 * 24);
  if (ageDays < 1) {
    return 10;
  }
  if (ageDays < 7) {
    return 6;
  }
  if (ageDays < 30) {
    return 3;
  }
  if (ageDays < 90) {
    return 1;
  }
  return 0;
}
function containsPhrase(lowerText, normalizedQuery) {
  if (!normalizedQuery) {
    return false;
  }
  if (!/\s/.test(normalizedQuery)) {
    return lowerText.includes(normalizedQuery);
  }
  return lowerText.replace(/\s+/g, " ").includes(normalizedQuery);
}
function countMatches(text, pattern) {
  var _a, _b;
  pattern.lastIndex = 0;
  return (_b = (_a = text.match(pattern)) == null ? void 0 : _a.length) != null ? _b : 0;
}
function titleForFile(file, text) {
  var _a, _b;
  const heading = (_b = (_a = text.match(/^#\s+(.+)$/m)) == null ? void 0 : _a[1]) == null ? void 0 : _b.trim();
  if (heading) {
    return heading;
  }
  return file.basename || file.path.split("/").pop() || file.path;
}
function buildReason(file, text, matchers, normalizedQuery) {
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  const reasons = /* @__PURE__ */ new Set();
  if (containsPhrase(lowerText, normalizedQuery)) {
    reasons.add("exact phrase match");
  }
  for (const matcher of matchers) {
    const label = matcher.weight === 1 ? `"${matcher.token}"` : `"${matcher.token}" (from your previous question)`;
    if (lowerPath.includes(matcher.token)) {
      reasons.add(`path matches ${label}`);
    }
    if (lowerTitle.includes(matcher.token)) {
      reasons.add(`title matches ${label}`);
    }
    if (countMatches(lowerText, matcher.heading) > 0) {
      reasons.add(`heading matches ${label}`);
    }
    if (countMatches(lowerText, matcher.link) > 0) {
      reasons.add(`link mentions ${label}`);
    }
    if (countMatches(lowerText, matcher.tag) > 0) {
      reasons.add(`tag matches ${label}`);
    }
    if (lowerText.includes(matcher.token)) {
      reasons.add(`content mentions ${label}`);
    }
  }
  return Array.from(reasons).slice(0, 3).join(", ") || "recent markdown note";
}
function buildExcerpt(text, matchers) {
  var _a, _b;
  const sourceLines = text.split("\n");
  const ranked = sourceLines.map((line, index) => ({ index, score: scoreLine(line, matchers) })).sort((left, right) => right.score - left.score || left.index - right.index);
  const bestLine = (_b = (_a = ranked.find((line) => line.score > 0)) == null ? void 0 : _a.index) != null ? _b : 0;
  const start = Math.max(0, bestLine - 2);
  const end = Math.min(sourceLines.length, start + MAX_SNIPPET_LINES);
  const excerpt = sourceLines.slice(start, end).map((line) => line.trim()).filter(Boolean).join("\n");
  return excerpt.length > MAX_EXCERPT_CHARS ? `${excerpt.slice(0, MAX_EXCERPT_CHARS - 3).trimEnd()}...` : excerpt;
}
function scoreLine(line, matchers) {
  const lower = line.toLowerCase();
  let score = 0;
  if (line.trim().startsWith("#")) {
    score += 4;
  }
  for (const matcher of matchers) {
    if (!lower.includes(matcher.token)) {
      continue;
    }
    let lineScore = 3;
    if (lower.includes(`[[${matcher.token}`) || lower.includes(`${matcher.token}]]`)) {
      lineScore += 2;
    }
    if (countMatches(lower, matcher.tag) > 0) {
      lineScore += 2;
    }
    score += lineScore * matcher.weight;
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
  /**
   * Reads a file Brain already holds a handle to. Uses `cachedRead`, which is
   * the API meant for read-only scanning, and skips the path lookup that
   * `readText` has to do.
   */
  async readFileText(file) {
    return this.app.vault.cachedRead(file);
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
  /**
   * Obsidian's parsed headings, tags, links, and frontmatter for a file. Reads
   * from the metadata cache, so it costs no file I/O. Null when the file has
   * not been indexed yet.
   */
  getFileMetadata(file) {
    return this.app.metadataCache.getFileCache(file);
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
    const headerLabel = header.createEl("span", { text: describeOperation(operation) });
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
      const updated = {
        ...this.draftOperations[index],
        path: pathInput.value
      };
      this.draftOperations[index] = updated;
      headerLabel.setText(describeOperation(updated));
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
    this.isLoading = false;
    this.currentAbortController = null;
    this.loadingStartedAt = 0;
    this.loadingTimer = null;
    this.loadingTextEl = null;
    this.loadingStageEl = null;
    this.loadingStage = "query";
    this.renderGeneration = 0;
    this.resizeFrameId = null;
    this.turns = [];
    /** Latest rendered element for a turn, so a turn can be updated in place. */
    this.turnElements = /* @__PURE__ */ new WeakMap();
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
    this.addTurn({ role: "user", text: message });
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
          this.addTurn({ role: "info", text: "Codex request stopped." });
        }
      } else {
        const message2 = error instanceof Error ? error.message : "Could not chat with the vault";
        showError(error, "Could not chat with the vault");
        if (this.contentEl.isConnected) {
          this.addTurn({ role: "error", text: message2 });
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
    if (this.modelOptionsLoading) {
      this.modelRowEl.createEl("span", {
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
  }
  renderResponse(response) {
    const plan = response.plan && response.plan.operations.length > 0 ? response.plan : void 0;
    const turn = this.addTurn({
      role: "brain",
      text: response.answer.trim(),
      sources: response.sources,
      plan
    });
    if (plan) {
      this.openPlanModal(turn);
    }
  }
  /**
   * Opens the write review for a turn. The plan stays on the turn until it is
   * applied, so cancelling the modal to go check something does not throw the
   * proposal away — the message keeps a button to reopen it.
   */
  openPlanModal(turn) {
    const plan = turn.plan;
    if (!plan || plan.operations.length === 0) {
      return;
    }
    new VaultPlanModal(this.app, {
      plan,
      settings: this.plugin.settings,
      onApprove: async (approved) => this.plugin.applyVaultWritePlan(approved),
      onComplete: async (message, paths) => {
        var _a, _b;
        turn.plan = void 0;
        (_b = (_a = this.turnElements.get(turn)) == null ? void 0 : _a.querySelector(".brain-plan-action")) == null ? void 0 : _b.remove();
        this.addTurn({ role: "brain", text: message, updatedPaths: paths });
        await this.refreshStatus();
      }
    }).open();
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
  addTurn(turn) {
    this.turns.push(turn);
    void this.appendTurnElement(turn);
    this.updateClearButton();
    return turn;
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
    const emptyEl = this.messagesEl.querySelector(".brain-chat-empty");
    if (emptyEl) {
      emptyEl.remove();
    }
    this.removeLoadingIndicator();
    await this.renderTurn(turn);
    this.maybeScrollToBottom();
  }
  /** Single definition of a turn's DOM, shared by appends and full re-renders. */
  async renderTurn(turn) {
    var _a, _b, _c;
    const item = this.messagesEl.createEl("div", {
      cls: `brain-chat-message brain-chat-message-${turn.role}`
    });
    this.turnElements.set(turn, item);
    const roleEl = item.createEl("div", { cls: "brain-chat-role" });
    const roleIcon = roleEl.createEl("span");
    (0, import_obsidian6.setIcon)(roleIcon, this.turnIconFor(turn.role));
    roleEl.createEl("span", { text: this.turnLabelFor(turn.role) });
    const output = item.createEl("div", { cls: "brain-output" });
    if (turn.role !== "brain") {
      output.setText(turn.text);
      return;
    }
    try {
      await import_obsidian6.MarkdownRenderer.render(this.app, turn.text, output, "", this);
    } catch (e) {
      output.setText(turn.text);
    }
    if (item.parentElement !== this.messagesEl) {
      return;
    }
    this.addCopyButtons(output);
    if ((_a = turn.sources) == null ? void 0 : _a.length) {
      this.renderSources(item, turn.sources);
    }
    if ((_b = turn.plan) == null ? void 0 : _b.operations.length) {
      this.renderPlanAction(item, turn);
    }
    if ((_c = turn.updatedPaths) == null ? void 0 : _c.length) {
      this.renderUpdatedFiles(item, turn.updatedPaths);
    }
  }
  renderPlanAction(container, turn) {
    var _a, _b;
    const count = (_b = (_a = turn.plan) == null ? void 0 : _a.operations.length) != null ? _b : 0;
    const row = container.createEl("div", { cls: "brain-plan-action" });
    const button = row.createEl("button", {
      cls: "brain-button brain-button-primary brain-button-small"
    });
    (0, import_obsidian6.setIcon)(button, "file-pen");
    button.createEl("span", {
      text: `Review ${count} proposed change${count === 1 ? "" : "s"}`
    });
    button.addEventListener("click", () => {
      this.openPlanModal(turn);
    });
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
      await this.renderTurn(turn);
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
    if (this.loadingTextEl) {
      this.loadingTextEl.setText(`${stageLabel} \xB7 ${seconds}s`);
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
      text: `Sources (${sources.length})`
    });
    for (const source of sources) {
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
    this.registerView(BRAIN_VIEW_TYPE, (leaf) => new BrainSidebarView(leaf, this));
    registerCommands(this);
    this.addSettingTab(new BrainSettingTab(this.app, this));
    try {
      await this.vaultService.ensureKnownFolders(this.settings);
      await this.instructionService.ensureInstructionsFile();
    } catch (error) {
      showError(error, "Could not initialize Brain storage");
    }
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
    const existing = this.app.workspace.getLeavesOfType(BRAIN_VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYi50cyIsICJzcmMvdXRpbHMvbm9kZS1ydW50aW1lLnRzIiwgInNyYy91dGlscy9jb2RleC1hdXRoLnRzIiwgInNyYy91dGlscy9haS1jb25maWcudHMiLCAic3JjL3V0aWxzL2NvZGV4LW1vZGVscy50cyIsICJzcmMvc2VydmljZXMvYWktc2VydmljZS50cyIsICJzcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1jaGF0LXNlcnZpY2UudHMiLCAic3JjL3V0aWxzL3BhdGgtc2FmZXR5LnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1xdWVyeS1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC1zZXJ2aWNlLnRzIiwgInNyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlLnRzIiwgInNyYy92aWV3cy9zaWRlYmFyLXZpZXcudHMiLCAic3JjL3ZpZXdzL3ZhdWx0LXBsYW4tbW9kYWwudHMiLCAic3JjL3V0aWxzL2Vycm9yLWhhbmRsZXIudHMiLCAic3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MsXG59IGZyb20gXCIuL3NyYy9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQnJhaW5TZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLXRhYlwiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvYWktc2VydmljZVwiO1xuaW1wb3J0IHsgQnJhaW5BdXRoU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2VcIjtcbmltcG9ydCB7IEluc3RydWN0aW9uU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgVmF1bHRDaGF0U2VydmljZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9zcmMvc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vc3JjL3NlcnZpY2VzL3ZhdWx0LXNlcnZpY2VcIjtcbmltcG9ydCB7IFZhdWx0V3JpdGVQbGFuLCBWYXVsdFdyaXRlU2VydmljZSB9IGZyb20gXCIuL3NyYy9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBCUkFJTl9WSUVXX1RZUEUsIEJyYWluU2lkZWJhclZpZXcgfSBmcm9tIFwiLi9zcmMvdmlld3Mvc2lkZWJhci12aWV3XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzL3JlZ2lzdGVyLWNvbW1hbmRzXCI7XG5pbXBvcnQgeyBzaG93RXJyb3IgfSBmcm9tIFwiLi9zcmMvdXRpbHMvZXJyb3ItaGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcmFpblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQnJhaW5QbHVnaW5TZXR0aW5ncztcbiAgdmF1bHRTZXJ2aWNlITogVmF1bHRTZXJ2aWNlO1xuICBhaVNlcnZpY2UhOiBCcmFpbkFJU2VydmljZTtcbiAgYXV0aFNlcnZpY2UhOiBCcmFpbkF1dGhTZXJ2aWNlO1xuICBpbnN0cnVjdGlvblNlcnZpY2UhOiBJbnN0cnVjdGlvblNlcnZpY2U7XG4gIHZhdWx0UXVlcnlTZXJ2aWNlITogVmF1bHRRdWVyeVNlcnZpY2U7XG4gIHZhdWx0V3JpdGVTZXJ2aWNlITogVmF1bHRXcml0ZVNlcnZpY2U7XG4gIHZhdWx0Q2hhdFNlcnZpY2UhOiBWYXVsdENoYXRTZXJ2aWNlO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy52YXVsdFNlcnZpY2UgPSBuZXcgVmF1bHRTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFpU2VydmljZSA9IG5ldyBCcmFpbkFJU2VydmljZSgpO1xuICAgIHRoaXMuYXV0aFNlcnZpY2UgPSBuZXcgQnJhaW5BdXRoU2VydmljZSh0aGlzKTtcbiAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZSA9IG5ldyBJbnN0cnVjdGlvblNlcnZpY2UoXG4gICAgICB0aGlzLnZhdWx0U2VydmljZSxcbiAgICAgICgpID0+IHRoaXMuc2V0dGluZ3MsXG4gICAgKTtcbiAgICB0aGlzLnZhdWx0UXVlcnlTZXJ2aWNlID0gbmV3IFZhdWx0UXVlcnlTZXJ2aWNlKFxuICAgICAgdGhpcy52YXVsdFNlcnZpY2UsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzLFxuICAgICk7XG4gICAgdGhpcy52YXVsdFdyaXRlU2VydmljZSA9IG5ldyBWYXVsdFdyaXRlU2VydmljZShcbiAgICAgIHRoaXMudmF1bHRTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuICAgIHRoaXMudmF1bHRDaGF0U2VydmljZSA9IG5ldyBWYXVsdENoYXRTZXJ2aWNlKFxuICAgICAgdGhpcy5haVNlcnZpY2UsXG4gICAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZSxcbiAgICAgIHRoaXMudmF1bHRRdWVyeVNlcnZpY2UsXG4gICAgICB0aGlzLnZhdWx0V3JpdGVTZXJ2aWNlLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5ncyxcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoQlJBSU5fVklFV19UWVBFLCAobGVhZikgPT4gbmV3IEJyYWluU2lkZWJhclZpZXcobGVhZiwgdGhpcykpO1xuXG4gICAgcmVnaXN0ZXJDb21tYW5kcyh0aGlzKTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgQnJhaW5TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuZW5zdXJlS25vd25Gb2xkZXJzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgYXdhaXQgdGhpcy5pbnN0cnVjdGlvblNlcnZpY2UuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGluaXRpYWxpemUgQnJhaW4gc3RvcmFnZVwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGxvYWRlZCA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpID8/IHt9O1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MobG9hZGVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBsb2FkIEJyYWluIHNldHRpbmdzXCIpO1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IG5vcm1hbGl6ZUJyYWluU2V0dGluZ3Moe30pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplQnJhaW5TZXR0aW5ncyh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5lbnN1cmVLbm93bkZvbGRlcnModGhpcy5zZXR0aW5ncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydWN0aW9uU2VydmljZT8uZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IGluaXRpYWxpemUgQnJhaW4gc3RvcmFnZVwiKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICB9XG5cbiAgYXN5bmMgb3BlblNpZGViYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gUmV1c2UgYW4gb3BlbiBCcmFpbiB2aWV3IGluc3RlYWQgb2YgY3JlYXRpbmcgYSBzZWNvbmQgb25lLCB3aGljaCB3b3VsZFxuICAgIC8vIGFsc28gbGVhdmUgcmVmcmVzaFNpZGViYXJTdGF0dXMgdXBkYXRpbmcgd2hpY2hldmVyIGxlYWYgY2FtZSBmaXJzdC5cbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGV4aXN0aW5nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBuZXcgTm90aWNlKFwiVW5hYmxlIHRvIG9wZW4gdGhlIHNpZGViYXJcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcbiAgICAgIHR5cGU6IEJSQUlOX1ZJRVdfVFlQRSxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9KTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5JbnN0cnVjdGlvbnNGaWxlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuaW5zdHJ1Y3Rpb25TZXJ2aWNlLmVuc3VyZUluc3RydWN0aW9uc0ZpbGUoKTtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRoaXMuc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgbmV3IE5vdGljZShgQ291bGQgbm90IG9wZW4gJHt0aGlzLnNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGV9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgY2hhdFdpdGhWYXVsdChtZXNzYWdlOiBzdHJpbmcsIGhpc3Rvcnk6IENoYXRFeGNoYW5nZVtdID0gW10sIHNpZ25hbD86IEFib3J0U2lnbmFsLCBvblN0YWdlPzogKHN0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIpID0+IHZvaWQpOiBQcm9taXNlPFZhdWx0Q2hhdFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMudmF1bHRDaGF0U2VydmljZS5yZXNwb25kKG1lc3NhZ2UsIGhpc3RvcnksIHNpZ25hbCwgb25TdGFnZSk7XG4gIH1cblxuICBhc3luYyBhcHBseVZhdWx0V3JpdGVQbGFuKHBsYW46IFZhdWx0V3JpdGVQbGFuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgdGhpcy52YXVsdFdyaXRlU2VydmljZS5hcHBseVBsYW4ocGxhbik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1c0Jlc3RFZmZvcnQoKTtcbiAgICByZXR1cm4gcGF0aHM7XG4gIH1cblxuICBnZXRPcGVuU2lkZWJhclZpZXcoKTogQnJhaW5TaWRlYmFyVmlldyB8IG51bGwge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoQlJBSU5fVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBCcmFpblNpZGViYXJWaWV3KSB7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZ2V0T3BlblNpZGViYXJWaWV3KCk/LnJlZnJlc2hTdGF0dXMoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTaWRlYmFyU3RhdHVzQmVzdEVmZm9ydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU2lkZWJhclN0YXR1cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzaG93RXJyb3IoZXJyb3IsIFwiQ291bGQgbm90IHJlZnJlc2ggc2lkZWJhciBzdGF0dXNcIik7XG4gICAgfVxuICB9XG5cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEJyYWluUGx1Z2luU2V0dGluZ3Mge1xuICBub3Rlc0ZvbGRlcjogc3RyaW5nO1xuICBpbnN0cnVjdGlvbnNGaWxlOiBzdHJpbmc7XG4gIGNvZGV4TW9kZWw6IHN0cmluZztcbiAgY29kZXhUaW1lb3V0U2Vjb25kczogbnVtYmVyO1xuICBleGNsdWRlRm9sZGVyczogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgTUlOX0NPREVYX1RJTUVPVVRfU0VDT05EUyA9IDE1O1xuZXhwb3J0IGNvbnN0IE1BWF9DT0RFWF9USU1FT1VUX1NFQ09ORFMgPSA5MDA7XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JSQUlOX1NFVFRJTkdTOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICBub3Rlc0ZvbGRlcjogXCJOb3Rlc1wiLFxuICBpbnN0cnVjdGlvbnNGaWxlOiBcIkJyYWluL0FHRU5UUy5tZFwiLFxuICBjb2RleE1vZGVsOiBcIlwiLFxuICBjb2RleFRpbWVvdXRTZWNvbmRzOiAxMjAsXG4gIGV4Y2x1ZGVGb2xkZXJzOiBcIi5vYnNpZGlhblxcbm5vZGVfbW9kdWxlc1wiLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJyYWluU2V0dGluZ3MoXG4gIGlucHV0OiBQYXJ0aWFsPEJyYWluUGx1Z2luU2V0dGluZ3M+IHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBCcmFpblBsdWdpblNldHRpbmdzIHtcbiAgY29uc3QgbWVyZ2VkOiBCcmFpblBsdWdpblNldHRpbmdzID0ge1xuICAgIC4uLkRFRkFVTFRfQlJBSU5fU0VUVElOR1MsXG4gICAgLi4uaW5wdXQsXG4gIH0gYXMgQnJhaW5QbHVnaW5TZXR0aW5ncztcblxuICByZXR1cm4ge1xuICAgIG5vdGVzRm9sZGVyOiBub3JtYWxpemVSZWxhdGl2ZVBhdGgoXG4gICAgICBtZXJnZWQubm90ZXNGb2xkZXIsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLm5vdGVzRm9sZGVyLFxuICAgICksXG4gICAgaW5zdHJ1Y3Rpb25zRmlsZTogbm9ybWFsaXplUmVsYXRpdmVQYXRoKFxuICAgICAgbWVyZ2VkLmluc3RydWN0aW9uc0ZpbGUsXG4gICAgICBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmluc3RydWN0aW9uc0ZpbGUsXG4gICAgKSxcbiAgICBjb2RleE1vZGVsOiB0eXBlb2YgbWVyZ2VkLmNvZGV4TW9kZWwgPT09IFwic3RyaW5nXCIgPyBtZXJnZWQuY29kZXhNb2RlbC50cmltKCkgOiBcIlwiLFxuICAgIGNvZGV4VGltZW91dFNlY29uZHM6IG5vcm1hbGl6ZVRpbWVvdXRTZWNvbmRzKG1lcmdlZC5jb2RleFRpbWVvdXRTZWNvbmRzKSxcbiAgICBleGNsdWRlRm9sZGVyczogbm9ybWFsaXplRXhjbHVkZUZvbGRlcnMobWVyZ2VkLmV4Y2x1ZGVGb2xkZXJzKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGltZW91dFNlY29uZHModmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCBudW1lcmljID0gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiID8gdmFsdWUgOiBOdW1iZXIodmFsdWUpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShudW1lcmljKSkge1xuICAgIHJldHVybiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmNvZGV4VGltZW91dFNlY29uZHM7XG4gIH1cbiAgcmV0dXJuIE1hdGgubWluKFxuICAgIE1BWF9DT0RFWF9USU1FT1VUX1NFQ09ORFMsXG4gICAgTWF0aC5tYXgoTUlOX0NPREVYX1RJTUVPVVRfU0VDT05EUywgTWF0aC5yb3VuZChudW1lcmljKSksXG4gICk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlbGF0aXZlUGF0aCh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgfHwgZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUV4Y2x1ZGVGb2xkZXJzKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBERUZBVUxUX0JSQUlOX1NFVFRJTkdTLmV4Y2x1ZGVGb2xkZXJzO1xuICB9XG4gIHJldHVybiB2YWx1ZVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpLnJlcGxhY2UoL15cXC8rLywgXCJcIikucmVwbGFjZSgvXFwvKyQvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oXCJcXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUV4Y2x1ZGVGb2xkZXJzKGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBleGNsdWRlRm9sZGVyc1xuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRleHRDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBCcmFpblBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpblwiO1xuaW1wb3J0IHtcbiAgTUFYX0NPREVYX1RJTUVPVVRfU0VDT05EUyxcbiAgTUlOX0NPREVYX1RJTUVPVVRfU0VDT05EUyxcbn0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGdldEFJQ29uZmlndXJhdGlvblN0YXR1cyB9IGZyb20gXCIuLi91dGlscy9haS1jb25maWdcIjtcbmltcG9ydCB7XG4gIENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRSxcbiAgREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuICBDb2RleE1vZGVsT3B0aW9uLFxuICBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZSxcbiAgZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMsXG4gIGlzS25vd25Db2RleE1vZGVsLFxufSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtbW9kZWxzXCI7XG5cbmNvbnN0IE1PREVMX1NFQ1RJT05fQ0xBU1MgPSBcImJyYWluLXNldHRpbmdzLW1vZGVsLXNlY3Rpb25cIjtcblxuZXhwb3J0IGNsYXNzIEJyYWluU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJyYWluUGx1Z2luO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb2RlbE9wdGlvbnNMb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgbW9kZWxTZWN0aW9uRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdHVzU2V0dGluZzogU2V0dGluZyB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJyYWluUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJicmFpbi1zZXR0aW5nc1wiKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpbiBTZXR0aW5nc1wiIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJTdG9yYWdlU2VjdGlvbihjb250YWluZXJFbCk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJDb2RleCBDTElcIiB9KTtcblxuICAgIHRoaXMucmVuZGVyQ29kZXhTZXR1cFNlY3Rpb24oY29udGFpbmVyRWwpO1xuICAgIHRoaXMucmVuZGVyU3RhdHVzU2VjdGlvbihjb250YWluZXJFbCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlY3Rpb24oY29udGFpbmVyRWwpO1xuICAgIHRoaXMucmVuZGVyVGltZW91dFNlY3Rpb24oY29udGFpbmVyRWwpO1xuXG4gICAgaWYgKCF0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgJiYgIXRoaXMubW9kZWxPcHRpb25zTG9hZGVkKSB7XG4gICAgICB2b2lkIHRoaXMucmVmcmVzaE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVwZGF0ZU1vZGVsQ29udHJvbHNTdGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU3RvcmFnZVNlY3Rpb24oY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3RvcmFnZVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5vdGVzIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJEZWZhdWx0IGZvbGRlciBmb3IgbmV3IG1hcmtkb3duIG5vdGVzIGNyZWF0ZWQgZnJvbSBhcHByb3ZlZCB3cml0ZSBwbGFucy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0aGlzLmJpbmRUZXh0U2V0dGluZyhcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90ZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIk5vdGVzIGZvbGRlciBjYW5ub3QgYmUgZW1wdHlcIik7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluc3RydWN0aW9ucyBmaWxlXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hcmtkb3duIGZpbGUgdGhhdCB0ZWxscyBCcmFpbiBob3cgdG8gb3BlcmF0ZSBpbiB0aGlzIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRoaXMuYmluZFRleHRTZXR0aW5nKFxuICAgICAgICAgIHRleHQsXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSxcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUgPSB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkluc3RydWN0aW9ucyBmaWxlIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgKSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRXhjbHVkZWQgZm9sZGVyc1wiKVxuICAgICAgLnNldERlc2MoXCJPbmUgZm9sZGVyIHBhdGggcGVyIGxpbmUuIEJyYWluIHdpbGwgc2tpcCBtYXJrZG93biBmaWxlcyBpbnNpZGUgdGhlc2UgZm9sZGVycyB3aGVuIHNlYXJjaGluZyB0aGUgdmF1bHQuXCIpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5leGNsdWRlRm9sZGVycykub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZXhjbHVkZUZvbGRlcnMgPSB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU3RhdHVzU2VjdGlvbihjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXR1c1NldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggc3RhdHVzXCIpXG4gICAgICAuc2V0RGVzYyhcIkNoZWNraW5nIENvZGV4IENMSSBzdGF0dXMuLi5cIik7XG4gICAgdm9pZCB0aGlzLnJlZnJlc2hDb2RleFN0YXR1cyh0aGlzLnN0YXR1c1NldHRpbmcpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDb2RleFNldHVwU2VjdGlvbihjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQ29kZXggc2V0dXBcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkJyYWluIHVzZXMgb25seSB0aGUgbG9jYWwgQ29kZXggQ0xJLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCwgcnVuIGBjb2RleCBsb2dpbmAsIHRoZW4gcmVjaGVjayBzdGF0dXMuXCIsXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiT3BlbiBDb2RleCBTZXR1cFwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmF1dGhTZXJ2aWNlLmxvZ2luKCk7XG4gICAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiUmVjaGVjayBTdGF0dXNcIilcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c1NldHRpbmc/LnNldERlc2MoXCJSZWNoZWNraW5nIENvZGV4IENMSSBzdGF0dXMuLi5cIik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hDb2RleFN0YXR1cyh0aGlzLnN0YXR1c1NldHRpbmcsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVNb2RlbENvbnRyb2xzU3RhdGUoKTtcbiAgICAgICAgICAgIHZvaWQgdGhpcy5yZWZyZXNoTW9kZWxPcHRpb25zKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RlbFNlY3Rpb24oY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogTU9ERUxfU0VDVElPTl9DTEFTUyB9KTtcbiAgICB0aGlzLm1vZGVsU2VjdGlvbkVsID0gd3JhcHBlcjtcbiAgICBuZXcgU2V0dGluZyh3cmFwcGVyKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCBtb2RlbFwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZ1xuICAgICAgICAgID8gXCJMb2FkaW5nIG1vZGVscyBmcm9tIHRoZSBpbnN0YWxsZWQgQ29kZXggQ0xJLi4uXCJcbiAgICAgICAgICA6IFwiT3B0aW9uYWwuIFNlbGVjdCBhIG1vZGVsIHJlcG9ydGVkIGJ5IENvZGV4IENMSSwgb3IgbGVhdmUgYmxhbmsgdG8gdXNlIHRoZSBhY2NvdW50IGRlZmF1bHQuXCIsXG4gICAgICApXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHRoaXMubW9kZWxPcHRpb25zKSB7XG4gICAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKG9wdGlvbi52YWx1ZSwgb3B0aW9uLmxhYmVsKTtcbiAgICAgICAgfVxuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb24oQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLCBcIkN1c3RvbS4uLlwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdFxuICAgICAgICAgICAgICA/IENVU1RPTV9DT0RFWF9NT0RFTF9WQUxVRVxuICAgICAgICAgICAgICA6IGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKSxcbiAgICAgICAgICApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUpIHtcbiAgICAgICAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxTZWN0aW9uKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFNlY3Rpb24oKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzRnJvbVNldHRpbmdzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiUmVsb2FkXCIpO1xuICAgICAgICBidXR0b24ub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdm9pZCB0aGlzLnJlZnJlc2hNb2RlbE9wdGlvbnMoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCB8fFxuICAgICAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCwgdGhpcy5tb2RlbE9wdGlvbnMpID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUVcbiAgICApIHtcbiAgICAgIGxldCBkcmFmdFZhbHVlID0gdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8IGlzS25vd25Db2RleE1vZGVsKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKVxuICAgICAgICA/IFwiXCJcbiAgICAgICAgOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsO1xuICAgICAgaWYgKHRoaXMuY3VzdG9tTW9kZWxEcmFmdCAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSkge1xuICAgICAgICBuZXcgU2V0dGluZyh3cmFwcGVyKVxuICAgICAgICAgIC5zZXROYW1lKFwiQWN0aXZlIENvZGV4IG1vZGVsXCIpXG4gICAgICAgICAgLnNldERlc2ModGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgICAgfVxuICAgICAgbmV3IFNldHRpbmcod3JhcHBlcilcbiAgICAgICAgLnNldE5hbWUoXCJDdXN0b20gQ29kZXggbW9kZWxcIilcbiAgICAgICAgLnNldERlc2MoXCJFeGFjdCBtb2RlbCBpZCBwYXNzZWQgdG8gYGNvZGV4IGV4ZWMgLS1tb2RlbGAuXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGV4dFxuICAgICAgICAgICAgLnNldFZhbHVlKGRyYWZ0VmFsdWUpXG4gICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGRyYWZ0VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAgICAgICB2b2lkIHRoaXMuc2F2ZUN1c3RvbU1vZGVsRHJhZnQoZHJhZnRWYWx1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlTW9kZWxDb250cm9sc1N0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclRpbWVvdXRTZWN0aW9uKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJDb2RleCB0aW1lb3V0XCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgYEhvdyBsb25nIHRvIHdhaXQgZm9yIGEgQ29kZXggcmVwbHkgYmVmb3JlIGdpdmluZyB1cCwgaW4gc2Vjb25kcyAoJHtNSU5fQ09ERVhfVElNRU9VVF9TRUNPTkRTfS0ke01BWF9DT0RFWF9USU1FT1VUX1NFQ09ORFN9KS4gUmFpc2UgdGhpcyBpZiB5b3UgdXNlIGEgc2xvd2VyIHJlYXNvbmluZyBtb2RlbC5gLFxuICAgICAgKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LmlucHV0RWwubWluID0gU3RyaW5nKE1JTl9DT0RFWF9USU1FT1VUX1NFQ09ORFMpO1xuICAgICAgICB0ZXh0LmlucHV0RWwubWF4ID0gU3RyaW5nKE1BWF9DT0RFWF9USU1FT1VUX1NFQ09ORFMpO1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleFRpbWVvdXRTZWNvbmRzKSk7XG5cbiAgICAgICAgY29uc3QgY29tbWl0ID0gKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcih0ZXh0LmlucHV0RWwudmFsdWUpO1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKVxuICAgICAgICAgICAgPyBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICBNQVhfQ09ERVhfVElNRU9VVF9TRUNPTkRTLFxuICAgICAgICAgICAgICAgIE1hdGgubWF4KE1JTl9DT0RFWF9USU1FT1VUX1NFQ09ORFMsIE1hdGgucm91bmQocGFyc2VkKSksXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhUaW1lb3V0U2Vjb25kcztcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleFRpbWVvdXRTZWNvbmRzID0gbmV4dDtcbiAgICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhuZXh0KSk7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0ZXh0LmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgY29tbWl0KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVNb2RlbENvbnRyb2xzU3RhdGUoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLm1vZGVsU2VjdGlvbkVsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRpc2FibGVkID0gdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nO1xuICAgIHRoaXMubW9kZWxTZWN0aW9uRWxcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxTZWxlY3RFbGVtZW50IHwgSFRNTEJ1dHRvbkVsZW1lbnQ+KFwic2VsZWN0LCBidXR0b25cIilcbiAgICAgIC5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICBlbC5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5tb2RlbE9wdGlvbnNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnJlZnJlc2hNb2RlbFNlY3Rpb24oKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tb2RlbE9wdGlvbnMgPSBhd2FpdCBnZXRTdXBwb3J0ZWRDb2RleE1vZGVsT3B0aW9ucygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRlZCA9IHRydWU7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmcmVzaE1vZGVsU2VjdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaE1vZGVsU2VjdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMubW9kZWxTZWN0aW9uRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5tb2RlbFNlY3Rpb25FbC5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHdhc0ZvY3VzZWQgPSB0aGlzLm1vZGVsU2VjdGlvbkVsLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMubW9kZWxTZWN0aW9uRWwucmVtb3ZlKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlY3Rpb24ocGFyZW50KTtcbiAgICBpZiAod2FzRm9jdXNlZCAmJiB0aGlzLm1vZGVsU2VjdGlvbkVsKSB7XG4gICAgICBjb25zdCBmb2N1c2FibGUgPSB0aGlzLm1vZGVsU2VjdGlvbkVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICBcImlucHV0Om5vdChbdHlwZT0naGlkZGVuJ10pOm5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKVwiLFxuICAgICAgKTtcbiAgICAgIGZvY3VzYWJsZT8uZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbERyYWZ0KHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2RlbCA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIW1vZGVsKSB7XG4gICAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmcmVzaE1vZGVsU2VjdGlvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1c3RvbU1vZGVsRHJhZnQgPSBmYWxzZTtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2RleE1vZGVsID0gbW9kZWw7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZWZyZXNoTW9kZWxTZWN0aW9uKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0dXNGcm9tU2V0dGluZ3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHVzRnJvbVNldHRpbmdzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXR1c1NldHRpbmcpIHtcbiAgICAgIHZvaWQgdGhpcy5yZWZyZXNoQ29kZXhTdGF0dXModGhpcy5zdGF0dXNTZXR0aW5nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hDb2RleFN0YXR1cyhzZXR0aW5nOiBTZXR0aW5nIHwgbnVsbCwgZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghc2V0dGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZm9yY2UpIHtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhcIlJlY2hlY2tpbmcgQ29kZXggQ0xJIHN0YXR1cy4uLlwiKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIC8vIGBmb3JjZWAgYnlwYXNzZXMgdGhlIHNob3J0LWxpdmVkIENvZGV4IGxvb2t1cCBjYWNoZSwgd2hpY2ggaXMgdGhlIHBvaW50XG4gICAgICAvLyBvZiB0aGUgUmVjaGVjayBidXR0b24uXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXModGhpcy5wbHVnaW4uc2V0dGluZ3MsIHsgZm9yY2UgfSk7XG4gICAgICBzZXR0aW5nLnNldERlc2Moc3RhdHVzLm1lc3NhZ2UpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHNldHRpbmcuc2V0RGVzYyhcIkNvdWxkIG5vdCBjaGVjayBDb2RleCBDTEkgc3RhdHVzLlwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJpbmRUZXh0U2V0dGluZyhcbiAgICB0ZXh0OiBUZXh0Q29tcG9uZW50LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgb25WYWx1ZUNoYW5nZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsaWRhdGU/OiAodmFsdWU6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgKTogVGV4dENvbXBvbmVudCB7XG4gICAgbGV0IGxhc3RWYWxpZFZhbHVlID0gdmFsdWU7XG5cbiAgICB0ZXh0LnNldFZhbHVlKHZhbHVlKS5vbkNoYW5nZSgobmV4dFZhbHVlKSA9PiB7XG4gICAgICBpZiAoIXZhbGlkYXRlIHx8IHZhbGlkYXRlKG5leHRWYWx1ZSkpIHtcbiAgICAgICAgb25WYWx1ZUNoYW5nZShuZXh0VmFsdWUpO1xuICAgICAgICBsYXN0VmFsaWRWYWx1ZSA9IG5leHRWYWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSB0ZXh0LmlucHV0RWwudmFsdWU7XG4gICAgICBpZiAodmFsaWRhdGUgJiYgIXZhbGlkYXRlKGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShsYXN0VmFsaWRWYWx1ZSk7XG4gICAgICAgIG9uVmFsdWVDaGFuZ2UobGFzdFZhbGlkVmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIH0pO1xuXG4gICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuY3RybEtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5zaGlmdEtleVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5ibHVyKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxufVxuIiwgIi8qKlxuICogU2hhcmVkIE5vZGUuanMgcnVudGltZSBoZWxwZXJzLlxuICpcbiAqIFRoZXNlIHVzZSBkeW5hbWljIGByZXF1aXJlKClgIHZpYSBgRnVuY3Rpb24oXCJyZXR1cm4gcmVxdWlyZVwiKSgpYCB0b1xuICogYnlwYXNzIGVzYnVpbGQgYnVuZGxpbmcgb2YgTm9kZSBidWlsdC1pbnMuIE9ic2lkaWFuIHBsdWdpbnMgcnVuIGluIGFuXG4gKiBFbGVjdHJvbi9Ob2RlIGNvbnRleHQgd2hlcmUgYHJlcXVpcmVgIGlzIGF2YWlsYWJsZSBhdCBydW50aW1lIGJ1dCBjYW5ub3RcbiAqIGJlIHN0YXRpY2FsbHkgYnVuZGxlZC5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENoaWxkUHJvY2VzcywgRXhlY0ZpbGVFeGNlcHRpb24sIEV4ZWNGaWxlT3B0aW9ucyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgdHlwZSB7IFBhdGhMaWtlIH0gZnJvbSBcImZzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlUmVxdWlyZSgpOiBOb2RlUmVxdWlyZSB7XG4gIHJldHVybiBGdW5jdGlvbihcInJldHVybiByZXF1aXJlXCIpKCkgYXMgTm9kZVJlcXVpcmU7XG59XG5cbnR5cGUgRXhlY0ZpbGVGbiA9IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBFeGVjRmlsZU9wdGlvbnMsXG4gIGNhbGxiYWNrPzogKFxuICAgIGVycm9yOiBFeGVjRmlsZUV4Y2VwdGlvbiB8IG51bGwsXG4gICAgc3Rkb3V0OiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgc3RkZXJyOiBzdHJpbmcgfCBCdWZmZXIsXG4gICkgPT4gdm9pZCxcbikgPT4gQ2hpbGRQcm9jZXNzO1xuXG50eXBlIEV4ZWNGaWxlQXN5bmNGbiA9IChcbiAgZmlsZTogc3RyaW5nLFxuICBhcmdzPzogcmVhZG9ubHkgc3RyaW5nW10sXG4gIG9wdGlvbnM/OiBFeGVjRmlsZU9wdGlvbnMsXG4pID0+IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT47XG5cbmZ1bmN0aW9uIGdldENoaWxkUHJvY2VzcygpOiB7IGV4ZWNGaWxlOiBFeGVjRmlsZUZuIH0ge1xuICBjb25zdCByZXEgPSBnZXROb2RlUmVxdWlyZSgpO1xuICByZXR1cm4gcmVxKFwiY2hpbGRfcHJvY2Vzc1wiKSBhcyB7IGV4ZWNGaWxlOiBFeGVjRmlsZUZuIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RleFJ1bnRpbWUoKToge1xuICBleGVjRmlsZTogRXhlY0ZpbGVGbjtcbiAgZnM6IHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKTtcbiAgb3M6IHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcbiAgcGF0aDogdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG59IHtcbiAgY29uc3QgcmVxID0gZ2V0Tm9kZVJlcXVpcmUoKTtcbiAgcmV0dXJuIHtcbiAgICBleGVjRmlsZTogZ2V0Q2hpbGRQcm9jZXNzKCkuZXhlY0ZpbGUsXG4gICAgZnM6IHJlcShcImZzL3Byb21pc2VzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJmcy9wcm9taXNlc1wiKSxcbiAgICBvczogcmVxKFwib3NcIikgYXMgdHlwZW9mIGltcG9ydChcIm9zXCIpLFxuICAgIHBhdGg6IHJlcShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIiksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeGVjRmlsZUFzeW5jKCk6IEV4ZWNGaWxlQXN5bmNGbiB7XG4gIGNvbnN0IHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXEoXCJ1dGlsXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJ1dGlsXCIpO1xuICByZXR1cm4gcHJvbWlzaWZ5KGdldENoaWxkUHJvY2VzcygpLmV4ZWNGaWxlKSBhcyB1bmtub3duIGFzIEV4ZWNGaWxlQXN5bmNGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW5vZW50RXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBOb2RlSlMuRXJybm9FeGNlcHRpb24ge1xuICByZXR1cm4gdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmIGVycm9yICE9PSBudWxsICYmIFwiY29kZVwiIGluIGVycm9yICYmIGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RpbWVvdXRFcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiYgZXJyb3IgIT09IG51bGwgJiYgXCJraWxsZWRcIiBpbiBlcnJvciAmJiBlcnJvci5raWxsZWQgPT09IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Fib3J0RXJyb3IoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgXCJuYW1lXCIgaW4gZXJyb3IgJiZcbiAgICBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBSZWZlcmVuY2VFcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIFR5cGVFcnJvcjtcbn1cbiIsICJpbXBvcnQgeyBnZXRFeGVjRmlsZUFzeW5jLCBnZXROb2RlUmVxdWlyZSwgaXNFbm9lbnRFcnJvciwgaXNOb2RlUnVudGltZVVuYXZhaWxhYmxlLCBpc1RpbWVvdXRFcnJvciB9IGZyb20gXCIuL25vZGUtcnVudGltZVwiO1xuXG5leHBvcnQgdHlwZSBDb2RleExvZ2luU3RhdHVzID0gXCJsb2dnZWQtaW5cIiB8IFwibG9nZ2VkLW91dFwiIHwgXCJ1bmF2YWlsYWJsZVwiO1xuXG5jb25zdCBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyA9IDUwMDA7XG4vKipcbiAqIEJvdGggbG9va3VwcyBiZWxvdyBzcGF3biBhIHByb2Nlc3Mgb3Igd2FsayBldmVyeSBQQVRIIGVudHJ5LCBhbmQgdGhleSBhcmUgaGl0XG4gKiBvbiBlYWNoIGNoYXQgbWVzc2FnZSwgc2V0dGluZ3Mgc2F2ZSwgbW9kZWwgY2hhbmdlLCBhbmQgc3RhdHVzIHJlZnJlc2guIEFcbiAqIHNob3J0IGNhY2hlIGtlZXBzIHRoYXQgb2ZmIHRoZSBob3QgcGF0aDsgXCJSZWNoZWNrIFN0YXR1c1wiIHBhc3NlcyBgZm9yY2VgLlxuICovXG5jb25zdCBDT0RFWF9DQUNIRV9NUyA9IDMwMDAwO1xuXG5pbnRlcmZhY2UgQ2FjaGVkPFQ+IHtcbiAgYXQ6IG51bWJlcjtcbiAgdmFsdWU6IFQ7XG59XG5cbmxldCBsb2dpblN0YXR1c0NhY2hlOiBDYWNoZWQ8Q29kZXhMb2dpblN0YXR1cz4gfCBudWxsID0gbnVsbDtcbmxldCBsb2dpblN0YXR1c0luRmxpZ2h0OiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHwgbnVsbCA9IG51bGw7XG5sZXQgYmluYXJ5UGF0aENhY2hlOiBDYWNoZWQ8c3RyaW5nIHwgbnVsbD4gfCBudWxsID0gbnVsbDtcbmxldCBiaW5hcnlQYXRoSW5GbGlnaHQ6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4gfCBudWxsID0gbnVsbDtcblxuZnVuY3Rpb24gaXNGcmVzaChlbnRyeTogQ2FjaGVkPHVua25vd24+IHwgbnVsbCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZW50cnkgIT09IG51bGwgJiYgRGF0ZS5ub3coKSAtIGVudHJ5LmF0IDwgQ09ERVhfQ0FDSEVfTVM7XG59XG5cbi8qKiBEcm9wcyBjYWNoZWQgQ29kZXggbG9va3VwcyBzbyB0aGUgbmV4dCBjYWxsIHJlLWNoZWNrcyB0aGUgbWFjaGluZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNvZGV4Q2FjaGUoKTogdm9pZCB7XG4gIGxvZ2luU3RhdHVzQ2FjaGUgPSBudWxsO1xuICBsb2dpblN0YXR1c0luRmxpZ2h0ID0gbnVsbDtcbiAgYmluYXJ5UGF0aENhY2hlID0gbnVsbDtcbiAgYmluYXJ5UGF0aEluRmxpZ2h0ID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29kZXhMb2dpblN0YXR1cyhvdXRwdXQ6IHN0cmluZyk6IENvZGV4TG9naW5TdGF0dXMge1xuICBjb25zdCBub3JtYWxpemVkID0gb3V0cHV0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cblxuICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcIm5vdCBsb2dnZWQgaW5cIikgfHwgbm9ybWFsaXplZC5pbmNsdWRlcyhcImxvZ2dlZCBvdXRcIikpIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtb3V0XCI7XG4gIH1cblxuICBpZiAoXG4gICAgbm9ybWFsaXplZC5pbmNsdWRlcyhcImxvZ2dlZCBpblwiKSB8fFxuICAgIG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJzaWduZWQgaW5cIikgfHxcbiAgICBub3JtYWxpemVkLmluY2x1ZGVzKFwiYXV0aGVudGljYXRlZFwiKVxuICApIHtcbiAgICByZXR1cm4gXCJsb2dnZWQtaW5cIjtcbiAgfVxuXG4gIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvZGV4TG9naW5TdGF0dXMob3B0aW9ucz86IHsgZm9yY2U/OiBib29sZWFuIH0pOiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHtcbiAgaWYgKG9wdGlvbnM/LmZvcmNlKSB7XG4gICAgY2xlYXJDb2RleENhY2hlKCk7XG4gIH0gZWxzZSBpZiAoaXNGcmVzaChsb2dpblN0YXR1c0NhY2hlKSkge1xuICAgIHJldHVybiBsb2dpblN0YXR1c0NhY2hlIS52YWx1ZTtcbiAgfVxuXG4gIC8vIENvbmN1cnJlbnQgY2FsbGVycyBzaGFyZSBvbmUgcHJvY2VzcyByYXRoZXIgdGhhbiBlYWNoIHNwYXduaW5nIHRoZWlyIG93bi5cbiAgaWYgKCFsb2dpblN0YXR1c0luRmxpZ2h0KSB7XG4gICAgbG9naW5TdGF0dXNJbkZsaWdodCA9IGZldGNoQ29kZXhMb2dpblN0YXR1cygpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgbG9naW5TdGF0dXNJbkZsaWdodCA9IG51bGw7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGxvZ2luU3RhdHVzSW5GbGlnaHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoQ29kZXhMb2dpblN0YXR1cygpOiBQcm9taXNlPENvZGV4TG9naW5TdGF0dXM+IHtcbiAgY29uc3Qgc3RhdHVzID0gYXdhaXQgcmVhZENvZGV4TG9naW5TdGF0dXMoKTtcbiAgbG9naW5TdGF0dXNDYWNoZSA9IHsgYXQ6IERhdGUubm93KCksIHZhbHVlOiBzdGF0dXMgfTtcbiAgcmV0dXJuIHN0YXR1cztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZENvZGV4TG9naW5TdGF0dXMoKTogUHJvbWlzZTxDb2RleExvZ2luU3RhdHVzPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgICBpZiAoIWNvZGV4QmluYXJ5KSB7XG4gICAgICByZXR1cm4gXCJ1bmF2YWlsYWJsZVwiO1xuICAgIH1cblxuICAgIGNvbnN0IGV4ZWNGaWxlQXN5bmMgPSBnZXRFeGVjRmlsZUFzeW5jKCk7XG4gICAgY29uc3QgeyBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgZXhlY0ZpbGVBc3luYyhjb2RleEJpbmFyeSwgW1wibG9naW5cIiwgXCJzdGF0dXNcIl0sIHtcbiAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQsXG4gICAgICB0aW1lb3V0OiBDT0RFWF9MT0dJTl9TVEFUVVNfVElNRU9VVF9NUyxcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VDb2RleExvZ2luU3RhdHVzKGAke3N0ZG91dH1cXG4ke3N0ZGVycn1gKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikgfHwgaXNUaW1lb3V0RXJyb3IoZXJyb3IpIHx8IGlzTm9kZVJ1bnRpbWVVbmF2YWlsYWJsZShlcnJvcikpIHtcbiAgICAgIHJldHVybiBcInVuYXZhaWxhYmxlXCI7XG4gICAgfVxuICAgIHJldHVybiBcImxvZ2dlZC1vdXRcIjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZXhCaW5hcnlQYXRoKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBpZiAoaXNGcmVzaChiaW5hcnlQYXRoQ2FjaGUpKSB7XG4gICAgcmV0dXJuIGJpbmFyeVBhdGhDYWNoZSEudmFsdWU7XG4gIH1cbiAgaWYgKCFiaW5hcnlQYXRoSW5GbGlnaHQpIHtcbiAgICBiaW5hcnlQYXRoSW5GbGlnaHQgPSBmaW5kQ29kZXhCaW5hcnlQYXRoKClcbiAgICAgIC50aGVuKChyZXNvbHZlZCkgPT4ge1xuICAgICAgICBiaW5hcnlQYXRoQ2FjaGUgPSB7IGF0OiBEYXRlLm5vdygpLCB2YWx1ZTogcmVzb2x2ZWQgfTtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVkO1xuICAgICAgfSlcbiAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgYmluYXJ5UGF0aEluRmxpZ2h0ID0gbnVsbDtcbiAgICAgIH0pO1xuICB9XG4gIHJldHVybiBiaW5hcnlQYXRoSW5GbGlnaHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRDb2RleEJpbmFyeVBhdGgoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIGxldCByZXE6IE5vZGVSZXF1aXJlO1xuICB0cnkge1xuICAgIHJlcSA9IGdldE5vZGVSZXF1aXJlKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgZnMgPSByZXEoXCJmc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnNcIik7XG4gIGNvbnN0IHBhdGggPSByZXEoXCJwYXRoXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpO1xuICBjb25zdCBvcyA9IHJlcShcIm9zXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJvc1wiKTtcblxuICBjb25zdCBjYW5kaWRhdGVzID0gYnVpbGRDb2RleENhbmRpZGF0ZXMocGF0aCwgb3MuaG9tZWRpcigpKTtcbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgIHRyeSB7XG4gICAgICAvLyBYX09LLCBub3QgRl9PSzogYSBub24tZXhlY3V0YWJsZSBmaWxlIG5hbWVkIGBjb2RleGAgb24gUEFUSCBpcyBub3QgYVxuICAgICAgLy8gdXNhYmxlIENMSSwgYW5kIHNlbGVjdGluZyBpdCB3b3VsZCBmYWlsIGxhdGVyIHdpdGggYSBjb25mdXNpbmcgZXJyb3IuXG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3MoY2FuZGlkYXRlLCBmcy5jb25zdGFudHMuWF9PSyk7XG4gICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gS2VlcCBzZWFyY2hpbmcuXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29kZXhDYW5kaWRhdGVzKHBhdGhNb2R1bGU6IHR5cGVvZiBpbXBvcnQoXCJwYXRoXCIpLCBob21lRGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcGF0aEVudHJpZXMgPSAocHJvY2Vzcy5lbnYuUEFUSCA/PyBcIlwiKS5zcGxpdChwYXRoTW9kdWxlLmRlbGltaXRlcikuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGZvciAoY29uc3QgZW50cnkgb2YgcGF0aEVudHJpZXMpIHtcbiAgICBjYW5kaWRhdGVzLmFkZChwYXRoTW9kdWxlLmpvaW4oZW50cnksIGNvZGV4RXhlY3V0YWJsZU5hbWUoKSkpO1xuICB9XG5cbiAgY29uc3QgY29tbW9uRGlyczogc3RyaW5nW10gPSBbXG4gICAgXCIvb3B0L2hvbWVicmV3L2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBgJHtob21lRGlyfS8ubG9jYWwvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYnVuL2JpbmAsXG4gICAgYCR7aG9tZURpcn0vLmNvZGVpdW0vd2luZHN1cmYvYmluYCxcbiAgICBgJHtob21lRGlyfS8uYW50aWdyYXZpdHkvYW50aWdyYXZpdHkvYmluYCxcbiAgICBcIi9BcHBsaWNhdGlvbnMvQ29kZXguYXBwL0NvbnRlbnRzL1Jlc291cmNlc1wiLFxuICBdO1xuXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuQVBQREFUQSkge1xuICAgICAgY29tbW9uRGlycy5wdXNoKHBhdGhNb2R1bGUuam9pbihwcm9jZXNzLmVudi5BUFBEQVRBLCBcIm5wbVwiKSk7XG4gICAgfVxuICAgIGlmIChwcm9jZXNzLmVudi5MT0NBTEFQUERBVEEpIHtcbiAgICAgIGNvbW1vbkRpcnMucHVzaChwYXRoTW9kdWxlLmpvaW4ocHJvY2Vzcy5lbnYuTE9DQUxBUFBEQVRBLCBcIlByb2dyYW1zXCIsIFwiQ29kZXhcIikpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgZGlyIG9mIGNvbW1vbkRpcnMpIHtcbiAgICBjYW5kaWRhdGVzLmFkZChwYXRoTW9kdWxlLmpvaW4oZGlyLCBjb2RleEV4ZWN1dGFibGVOYW1lKCkpKTtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGNhbmRpZGF0ZXMpO1xufVxuXG5mdW5jdGlvbiBjb2RleEV4ZWN1dGFibGVOYW1lKCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyBcImNvZGV4LmNtZFwiIDogXCJjb2RleFwiO1xufVxuIiwgImltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0Q29kZXhMb2dpblN0YXR1cyB9IGZyb20gXCIuL2NvZGV4LWF1dGhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBBSUNvbmZpZ3VyYXRpb25TdGF0dXMge1xuICBjb25maWd1cmVkOiBib29sZWFuO1xuICBwcm92aWRlcjogXCJjb2RleFwiO1xuICBtb2RlbDogc3RyaW5nIHwgbnVsbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKFxuICBzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgb3B0aW9ucz86IHsgZm9yY2U/OiBib29sZWFuIH0sXG4pOiBQcm9taXNlPEFJQ29uZmlndXJhdGlvblN0YXR1cz4ge1xuICBjb25zdCBjb2RleFN0YXR1cyA9IGF3YWl0IGdldENvZGV4TG9naW5TdGF0dXMob3B0aW9ucyk7XG4gIGlmIChjb2RleFN0YXR1cyA9PT0gXCJ1bmF2YWlsYWJsZVwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbWVzc2FnZTogXCJDb2RleCBDTEkgbm90IGluc3RhbGxlZC5cIixcbiAgICB9O1xuICB9XG5cbiAgaWYgKGNvZGV4U3RhdHVzICE9PSBcImxvZ2dlZC1pblwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyZWQ6IGZhbHNlLFxuICAgICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbWVzc2FnZTogXCJDb2RleCBDTEkgbm90IGxvZ2dlZCBpbi5cIixcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgbW9kZWwgPSBzZXR0aW5ncy5jb2RleE1vZGVsLnRyaW0oKSB8fCBudWxsO1xuICByZXR1cm4ge1xuICAgIGNvbmZpZ3VyZWQ6IHRydWUsXG4gICAgcHJvdmlkZXI6IFwiY29kZXhcIixcbiAgICBtb2RlbCxcbiAgICBtZXNzYWdlOiBtb2RlbFxuICAgICAgPyBgUmVhZHkgdG8gdXNlIENvZGV4IHdpdGggbW9kZWwgJHttb2RlbH0uYFxuICAgICAgOiBcIlJlYWR5IHRvIHVzZSBDb2RleCB3aXRoIHRoZSBhY2NvdW50IGRlZmF1bHQgbW9kZWwuXCIsXG4gIH07XG59XG4iLCAiaW1wb3J0IHsgZ2V0Q29kZXhCaW5hcnlQYXRoIH0gZnJvbSBcIi4vY29kZXgtYXV0aFwiO1xuaW1wb3J0IHsgZ2V0RXhlY0ZpbGVBc3luYyB9IGZyb20gXCIuL25vZGUtcnVudGltZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvZGV4TW9kZWxPcHRpb24ge1xuICB2YWx1ZTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TOiBDb2RleE1vZGVsT3B0aW9uW10gPSBbXG4gIHsgdmFsdWU6IFwiXCIsIGxhYmVsOiBcIkFjY291bnQgZGVmYXVsdFwiIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFID0gXCJfX2N1c3RvbV9fXCI7XG5jb25zdCBDT0RFWF9NT0RFTF9DQVRBTE9HX1RJTUVPVVRfTVMgPSA4MDAwO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3VwcG9ydGVkQ29kZXhNb2RlbE9wdGlvbnMoKTogUHJvbWlzZTxDb2RleE1vZGVsT3B0aW9uW10+IHtcbiAgY29uc3QgY29kZXhCaW5hcnkgPSBhd2FpdCBnZXRDb2RleEJpbmFyeVBhdGgoKTtcbiAgaWYgKCFjb2RleEJpbmFyeSkge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGV4ZWNGaWxlQXN5bmMgPSBnZXRFeGVjRmlsZUFzeW5jKCk7XG4gICAgY29uc3QgeyBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgZXhlY0ZpbGVBc3luYyhjb2RleEJpbmFyeSwgW1wiZGVidWdcIiwgXCJtb2RlbHNcIl0sIHtcbiAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQgKiAyMCxcbiAgICAgIHRpbWVvdXQ6IENPREVYX01PREVMX0NBVEFMT0dfVElNRU9VVF9NUyxcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyc2VDb2RleE1vZGVsQ2F0YWxvZyhgJHtzdGRvdXR9XFxuJHtzdGRlcnJ9YCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBERUZBVUxUX0NPREVYX01PREVMX09QVElPTlM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29kZXhNb2RlbENhdGFsb2cob3V0cHV0OiBzdHJpbmcpOiBDb2RleE1vZGVsT3B0aW9uW10ge1xuICBjb25zdCBqc29uVGV4dCA9IGV4dHJhY3RKc29uT2JqZWN0KG91dHB1dCk7XG4gIGlmICghanNvblRleHQpIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25UZXh0KSBhcyB7XG4gICAgICBtb2RlbHM/OiBBcnJheTx7XG4gICAgICAgIHNsdWc/OiB1bmtub3duO1xuICAgICAgICBkaXNwbGF5X25hbWU/OiB1bmtub3duO1xuICAgICAgICB2aXNpYmlsaXR5PzogdW5rbm93bjtcbiAgICAgIH0+O1xuICAgIH07XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBbLi4uREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TXTtcbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHBhcnNlZC5tb2RlbHMgPz8gW10pIHtcbiAgICAgIGNvbnN0IHNsdWcgPSB0eXBlb2YgbW9kZWwuc2x1ZyA9PT0gXCJzdHJpbmdcIiA/IG1vZGVsLnNsdWcudHJpbSgpIDogXCJcIjtcbiAgICAgIGlmICghc2x1ZyB8fCBzZWVuLmhhcyhzbHVnKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChtb2RlbC52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgbW9kZWwudmlzaWJpbGl0eSAhPT0gXCJsaXN0XCIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZChzbHVnKTtcbiAgICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICAgIHZhbHVlOiBzbHVnLFxuICAgICAgICBsYWJlbDogdHlwZW9mIG1vZGVsLmRpc3BsYXlfbmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBtb2RlbC5kaXNwbGF5X25hbWUudHJpbSgpXG4gICAgICAgICAgPyBtb2RlbC5kaXNwbGF5X25hbWUudHJpbSgpXG4gICAgICAgICAgOiBzbHVnLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2RleE1vZGVsRHJvcGRvd25WYWx1ZShcbiAgbW9kZWw6IHN0cmluZyxcbiAgb3B0aW9uczogcmVhZG9ubHkgQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG1vZGVsLnRyaW0oKTtcbiAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBvcHRpb24udmFsdWUgPT09IG5vcm1hbGl6ZWQpXG4gICAgPyBub3JtYWxpemVkXG4gICAgOiBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0tub3duQ29kZXhNb2RlbChcbiAgbW9kZWw6IHN0cmluZyxcbiAgb3B0aW9uczogcmVhZG9ubHkgQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBtb2RlbC50cmltKCk7XG4gIHJldHVybiBvcHRpb25zLnNvbWUoKG9wdGlvbikgPT4gb3B0aW9uLnZhbHVlID09PSBub3JtYWxpemVkKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEpzb25PYmplY3Qob3V0cHV0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3Qgc3RhcnQgPSBvdXRwdXQuaW5kZXhPZihcIntcIik7XG4gIGNvbnN0IGVuZCA9IG91dHB1dC5sYXN0SW5kZXhPZihcIn1cIik7XG4gIGlmIChzdGFydCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fCBlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gb3V0cHV0LnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcbn1cbiIsICJpbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBnZXRDb2RleEJpbmFyeVBhdGggfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuaW1wb3J0IHsgZ2V0Q29kZXhSdW50aW1lLCBpc0Fib3J0RXJyb3IsIGlzRW5vZW50RXJyb3IsIGlzVGltZW91dEVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL25vZGUtcnVudGltZVwiO1xuXG5pbnRlcmZhY2UgRXhlY1Jlc3VsdCB7XG4gIHN0ZG91dDogc3RyaW5nO1xuICBzdGRlcnI6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEJyYWluQUlTZXJ2aWNlIHtcbiAgYXN5bmMgY29tcGxldGVDaGF0KFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBvc3RDb2RleENvbXBsZXRpb24oc2V0dGluZ3MsIG1lc3NhZ2VzLCBzaWduYWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwb3N0Q29kZXhDb21wbGV0aW9uKFxuICAgIHNldHRpbmdzOiBCcmFpblBsdWdpblNldHRpbmdzLFxuICAgIG1lc3NhZ2VzOiBBcnJheTx7IHJvbGU6IFwic3lzdGVtXCIgfCBcInVzZXJcIjsgY29udGVudDogc3RyaW5nIH0+LFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHsgZXhlY0ZpbGUsIGZzLCBvcywgcGF0aCB9ID0gZ2V0Q29kZXhSdW50aW1lKCk7XG5cbiAgICBjb25zdCBjb2RleEJpbmFyeSA9IGF3YWl0IGdldENvZGV4QmluYXJ5UGF0aCgpO1xuICAgIGlmICghY29kZXhCaW5hcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IENMSSBpcyBub3QgaW5zdGFsbGVkLiBJbnN0YWxsIGBAb3BlbmFpL2NvZGV4YCBhbmQgcnVuIGBjb2RleCBsb2dpbmAgZmlyc3QuXCIpO1xuICAgIH1cblxuICAgIC8vIENvZGV4IHJ1bnMgaW4gYW4gZW1wdHkgdGVtcCBkaXJlY3RvcnksIG5ldmVyIHRoZSB2YXVsdC4gQnJhaW4gYXNzZW1ibGVzXG4gICAgLy8gdGhlIGNvbnRleHQgaXRzZWxmLCBzbyB0aGUgbW9kZWwgaGFzIG5vdGhpbmcgdG8gZXhwbG9yZSBcdTIwMTQgd2hpY2ggaXMgd2hhdFxuICAgIC8vIG1ha2VzIHRoZSBTb3VyY2VzIGxpc3QgYSBjb21wbGV0ZSBhY2NvdW50IG9mIHdoYXQgYmFja2VkIGFuIGFuc3dlciwgYW5kXG4gICAgLy8gd2hhdCBtYWtlcyBcIkV4Y2x1ZGVkIGZvbGRlcnNcIiBtZWFuIHNvbWV0aGluZy5cbiAgICBjb25zdCB0ZW1wRGlyID0gYXdhaXQgZnMubWtkdGVtcChwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiYnJhaW4tY29kZXgtXCIpKTtcbiAgICBjb25zdCBvdXRwdXRGaWxlID0gcGF0aC5qb2luKHRlbXBEaXIsIFwicmVzcG9uc2UudHh0XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0tZXBoZW1lcmFsXCIsXG4gICAgICBcIi0taWdub3JlLXJ1bGVzXCIsXG4gICAgICBcIi0tc2FuZGJveFwiLFxuICAgICAgXCJyZWFkLW9ubHlcIixcbiAgICAgIFwiLS1vdXRwdXQtbGFzdC1tZXNzYWdlXCIsXG4gICAgICBvdXRwdXRGaWxlLFxuICAgIF07XG5cbiAgICBpZiAoc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgIGFyZ3MucHVzaChcIi0tbW9kZWxcIiwgc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpO1xuICAgIH1cblxuICAgIGFyZ3MucHVzaChcIi1cIik7XG4gICAgY29uc3QgcHJvbXB0ID0gdGhpcy5idWlsZENvZGV4UHJvbXB0KG1lc3NhZ2VzKTtcblxuICAgIGxldCBleGVjUmVzdWx0OiBFeGVjUmVzdWx0IHwgbnVsbCA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgZXhlY1Jlc3VsdCA9IGF3YWl0IGV4ZWNGaWxlV2l0aEFib3J0KGNvZGV4QmluYXJ5LCBhcmdzLCB7XG4gICAgICAgIG1heEJ1ZmZlcjogMTAyNCAqIDEwMjQgKiA0LFxuICAgICAgICBjd2Q6IHRlbXBEaXIsXG4gICAgICAgIHRpbWVvdXQ6IHNldHRpbmdzLmNvZGV4VGltZW91dFNlY29uZHMgKiAxMDAwLFxuICAgICAgICBzaWduYWwsXG4gICAgICAgIHN0ZGluOiBwcm9tcHQsXG4gICAgICB9LCBleGVjRmlsZSk7XG5cbiAgICAgIGxldCBjb250ZW50OiBzdHJpbmc7XG4gICAgICB0cnkge1xuICAgICAgICBjb250ZW50ID0gYXdhaXQgZnMucmVhZEZpbGUob3V0cHV0RmlsZSwgXCJ1dGY4XCIpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIGlmIChleGVjUmVzdWx0LnN0ZG91dC50cmltKCkpIHtcbiAgICAgICAgICBjb250ZW50ID0gZXhlY1Jlc3VsdC5zdGRvdXQudHJpbSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGV4ZWNSZXN1bHQuc3RkZXJyLnRyaW0oKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29kZXggZGlkIG5vdCBwcm9kdWNlIG91dHB1dC4gRGV0YWlsczogJHtleGVjUmVzdWx0LnN0ZGVyci50cmltKCkuc2xpY2UoMCwgNTAwKX1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCBkaWQgbm90IHByb2R1Y2UgYW55IG91dHB1dC4gVGhlIENMSSBtYXkgcmVxdWlyZSBhIG5ld2VyIHZlcnNpb24gb3IgYSBkaWZmZXJlbnQgY29uZmlndXJhdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZS5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChzaWduYWw/LmFib3J0ZWQgfHwgaXNBYm9ydEVycm9yKGVycm9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCByZXF1ZXN0IHN0b3BwZWQuXCIpO1xuICAgICAgfVxuICAgICAgaWYgKGlzVGltZW91dEVycm9yKGVycm9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvZGV4IGRpZCBub3QgcmVzcG9uZCB3aXRoaW4gJHtzZXR0aW5ncy5jb2RleFRpbWVvdXRTZWNvbmRzfXMuIFJhaXNlIFwiQ29kZXggdGltZW91dFwiIGluIEJyYWluIHNldHRpbmdzLCBgICtcbiAgICAgICAgICBcIm9yIGNoZWNrIGBjb2RleCBsb2dpbiBzdGF0dXNgIG91dHNpZGUgQnJhaW4uXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoaXNFbm9lbnRFcnJvcihlcnJvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggQ0xJIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgYEBvcGVuYWkvY29kZXhgIGFuZCBydW4gYGNvZGV4IGxvZ2luYCBmaXJzdC5cIik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0ZGVyckRldGFpbCA9IGV4ZWNSZXN1bHQ/LnN0ZGVycj8udHJpbSgpXG4gICAgICAgIHx8IGdldEVycm9yRGV0YWlsKGVycm9yLCBcInN0ZGVyclwiKVxuICAgICAgICB8fCBcIlwiO1xuICAgICAgaWYgKHN0ZGVyckRldGFpbCAmJiBlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtlcnJvci5tZXNzYWdlfVxcbkNvZGV4IHN0ZGVycjogJHtzdGRlcnJEZXRhaWwuc2xpY2UoMCwgNTAwKX1gKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBmcy5ybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ29kZXhQcm9tcHQoXG4gICAgbWVzc2FnZXM6IEFycmF5PHsgcm9sZTogXCJzeXN0ZW1cIiB8IFwidXNlclwiOyBjb250ZW50OiBzdHJpbmcgfT4sXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbWVzc2FnZXMpIHtcbiAgICAgIGlmIChtZXNzYWdlLnJvbGUgPT09IFwic3lzdGVtXCIpIHtcbiAgICAgICAgcGFydHMucHVzaChtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgICAgcGFydHMucHVzaChcIi0tLVwiKTtcbiAgICAgICAgcGFydHMucHVzaChcIlwiKTtcbiAgICAgICAgcGFydHMucHVzaChtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWNGaWxlV2l0aEFib3J0KFxuICBmaWxlOiBzdHJpbmcsXG4gIGFyZ3M6IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBvcHRpb25zOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlT3B0aW9ucyAmIHtcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgICBzdGRpbj86IHN0cmluZztcbiAgfSxcbiAgZXhlY0ZpbGU6IFJldHVyblR5cGU8dHlwZW9mIGdldENvZGV4UnVudGltZT5bXCJleGVjRmlsZVwiXSxcbik6IFByb21pc2U8RXhlY1Jlc3VsdD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgbGV0IGtpbGxUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3QgeyBzaWduYWwsIHN0ZGluLCAuLi5leGVjT3B0aW9ucyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBjaGlsZCA9IGV4ZWNGaWxlKGZpbGUsIGFyZ3MsIGV4ZWNPcHRpb25zLCAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgICBpZiAoc2V0dGxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgIHNpZ25hbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0KTtcbiAgICAgIGlmIChraWxsVGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChraWxsVGltZXIpO1xuICAgICAgICBraWxsVGltZXIgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IGVucmljaGVkID0gZW5yaWNoRXJyb3IoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKTtcbiAgICAgICAgcmVqZWN0KGVucmljaGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIHN0ZG91dDogYnVmZmVyVG9TdHJpbmcoc3Rkb3V0KSxcbiAgICAgICAgICBzdGRlcnI6IGJ1ZmZlclRvU3RyaW5nKHN0ZGVyciksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHN0ZGluICE9PSB1bmRlZmluZWQgJiYgY2hpbGQuc3RkaW4pIHtcbiAgICAgIC8vIENvZGV4IGNhbiBleGl0IGJlZm9yZSBpdCByZWFkcyBzdGRpbiBcdTIwMTQgYW4gdW5zdXBwb3J0ZWQgQ0xJIGZsYWcgbWFrZXMgaXRcbiAgICAgIC8vIGJhaWwgaW1tZWRpYXRlbHkgXHUyMDE0IHdoaWNoIHN1cmZhY2VzIGFzIEVQSVBFIG9uIHRoaXMgc3RyZWFtLiBXaXRob3V0IGFcbiAgICAgIC8vIGxpc3RlbmVyIHRoYXQgYmVjb21lcyBhbiB1bmNhdWdodCBleGNlcHRpb24gaW4gT2JzaWRpYW4ncyByZW5kZXJlciwgc29cbiAgICAgIC8vIHN3YWxsb3cgaXQgaGVyZSBhbmQgbGV0IHRoZSBleGVjIGNhbGxiYWNrIHJlcG9ydCB0aGUgcmVhbCBmYWlsdXJlLlxuICAgICAgY2hpbGQuc3RkaW4ub24oXCJlcnJvclwiLCAoKSA9PiB1bmRlZmluZWQpO1xuICAgICAgY2hpbGQuc3RkaW4uZW5kKHN0ZGluKTtcbiAgICB9XG5cbiAgICBjb25zdCBhYm9ydCA9ICgpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNoaWxkLmtpbGwoXCJTSUdURVJNXCIpO1xuICAgICAga2lsbFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBraWxsVGltZXIgPSBudWxsO1xuICAgICAgICBpZiAoY2hpbGQuZXhpdENvZGUgPT09IG51bGwgJiYgY2hpbGQuc2lnbmFsQ29kZSA9PT0gbnVsbCkge1xuICAgICAgICAgIGNoaWxkLmtpbGwoXCJTSUdLSUxMXCIpO1xuICAgICAgICB9XG4gICAgICB9LCAxNTAwKTtcbiAgICB9O1xuXG4gICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgYWJvcnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgYWJvcnQsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBidWZmZXJUb1N0cmluZyh2YWx1ZTogc3RyaW5nIHwgQnVmZmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkgPyB2YWx1ZS50b1N0cmluZyhcInV0ZjhcIikgOiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZW5yaWNoRXJyb3IoXG4gIGVycm9yOiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpLkV4ZWNGaWxlRXhjZXB0aW9uLFxuICBzdGRvdXQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgc3RkZXJyOiBzdHJpbmcgfCBCdWZmZXIsXG4pOiBDb2RleEV4ZWN1dGlvbkVycm9yIHtcbiAgY29uc3Qgc3Rkb3V0VGV4dCA9IGJ1ZmZlclRvU3RyaW5nKHN0ZG91dCk7XG4gIGNvbnN0IHN0ZGVyclRleHQgPSBidWZmZXJUb1N0cmluZyhzdGRlcnIpO1xuICBjb25zdCB3cmFwcGVkID0gbmV3IENvZGV4RXhlY3V0aW9uRXJyb3IoZXJyb3IubWVzc2FnZSwgZXJyb3IpO1xuICB3cmFwcGVkLnN0ZG91dCA9IHN0ZG91dFRleHQ7XG4gIHdyYXBwZWQuc3RkZXJyID0gc3RkZXJyVGV4dDtcbiAgaWYgKGVycm9yLmNvZGUgIT09IG51bGwpIHtcbiAgICB3cmFwcGVkLmNvZGUgPSBlcnJvci5jb2RlO1xuICB9XG4gIHdyYXBwZWQua2lsbGVkID0gZXJyb3Iua2lsbGVkID8/IGZhbHNlO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuY2xhc3MgQ29kZXhFeGVjdXRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3Rkb3V0ID0gXCJcIjtcbiAgc3RkZXJyID0gXCJcIjtcbiAgY29kZTogc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBraWxsZWQgPSBmYWxzZTtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjYXVzZT86IHVua25vd24pIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSBcIkNvZGV4RXhlY3V0aW9uRXJyb3JcIjtcbiAgICAodGhpcyBhcyBFcnJvciAmIHsgY2F1c2U/OiB1bmtub3duIH0pLmNhdXNlID0gY2F1c2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RXJyb3JEZXRhaWwoZXJyb3I6IHVua25vd24sIGtleTogXCJzdGRvdXRcIiB8IFwic3RkZXJyXCIpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGVycm9yICE9PSBcIm9iamVjdFwiIHx8IGVycm9yID09PSBudWxsIHx8ICEoa2V5IGluIGVycm9yKSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIGNvbnN0IHZhbHVlID0gKGVycm9yIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRyaW0oKTtcbiAgfVxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZyhcInV0ZjhcIikudHJpbSgpO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuIiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBDb2RleExvZ2luU3RhdHVzLCBjbGVhckNvZGV4Q2FjaGUsIGdldENvZGV4TG9naW5TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvY29kZXgtYXV0aFwiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5BdXRoU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBCcmFpblBsdWdpbikge31cblxuICBhc3luYyBsb2dpbigpIHtcbiAgICBuZXcgTm90aWNlKFwiSW5zdGFsbCB0aGUgQ29kZXggQ0xJLCBydW4gYGNvZGV4IGxvZ2luYCwgdGhlbiByZXR1cm4gdG8gQnJhaW4gYW5kIHJlY2hlY2sgQ29kZXggc3RhdHVzLlwiKTtcbiAgICAvLyBUaGUgdXNlciBpcyBhYm91dCB0byBjaGFuZ2UgdGhlIG1hY2hpbmUncyBDb2RleCBzdGF0ZSwgc28gZHJvcCBjYWNoZWRcbiAgICAvLyBsb29rdXBzIGFuZCBtYWtlIHRoZSBuZXh0IHN0YXR1cyBjaGVjayBoaXQgdGhlIENMSSBhZ2Fpbi5cbiAgICBjbGVhckNvZGV4Q2FjaGUoKTtcbiAgICB3aW5kb3cub3BlbihcImh0dHBzOi8vb3BlbmFpLmNvbS9jb2RleC9nZXQtc3RhcnRlZC9cIik7XG4gIH1cblxuICBhc3luYyBnZXRDb2RleFN0YXR1cyhvcHRpb25zPzogeyBmb3JjZT86IGJvb2xlYW4gfSk6IFByb21pc2U8Q29kZXhMb2dpblN0YXR1cz4ge1xuICAgIHJldHVybiBnZXRDb2RleExvZ2luU3RhdHVzKG9wdGlvbnMpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5jb25zdCBERUZBVUxUX0lOU1RSVUNUSU9OUyA9IFtcbiAgXCIjIEJyYWluIEluc3RydWN0aW9uc1wiLFxuICBcIlwiLFxuICBcIllvdSBhcmUgaGVscGluZyBmaWxlIGluZm9ybWF0aW9uIGludG8gdGhpcyBPYnNpZGlhbiB2YXVsdCBhbmQgcmV0cmlldmUgaW5mb3JtYXRpb24gZnJvbSBpdC5cIixcbiAgXCJcIixcbiAgXCIjIyBPcGVyYXRpbmcgUnVsZXNcIixcbiAgXCItIEtlZXAgYWxsIHBlcnNpc3RlZCBjb250ZW50IGFzIG5vcm1hbCBtYXJrZG93bi5cIixcbiAgXCItIFVzZSBvbmx5IGV4cGxpY2l0IHZhdWx0IGNvbnRleHQgd2hlbiBhbnN3ZXJpbmcgcmV0cmlldmFsIHF1ZXN0aW9ucy5cIixcbiAgXCItIFByZWZlciB1cGRhdGluZyBvciBhcHBlbmRpbmcgdG8gZXhpc3Rpbmcgbm90ZXMgb3ZlciBjcmVhdGluZyBkdXBsaWNhdGVzLlwiLFxuICBcIi0gVXNlIHdpa2kgbGlua3Mgd2hlbiB1c2VmdWwgYW5kIHN1cHBvcnRlZCBieSB0aGUgcHJvdmlkZWQgY29udGV4dC5cIixcbiAgXCItIFVzZSB0aGUgY29uZmlndXJlZCBub3RlcyBmb2xkZXIgYXMgdGhlIGRlZmF1bHQgbG9jYXRpb24gZm9yIG5ldyBub3Rlcy5cIixcbiAgXCItIElmIHlvdSBhcmUgdW5zdXJlIHdoZXJlIHNvbWV0aGluZyBiZWxvbmdzLCBhc2sgYSBxdWVzdGlvbiBpbnN0ZWFkIG9mIGd1ZXNzaW5nLlwiLFxuICBcIi0gTmV2ZXIgZGVsZXRlIG9yIG92ZXJ3cml0ZSBleGlzdGluZyB1c2VyIGNvbnRlbnQuXCIsXG4gIFwiLSBQcm9wb3NlIHNhZmUgYXBwZW5kL2NyZWF0ZSBvcGVyYXRpb25zIGFuZCB3YWl0IGZvciBhcHByb3ZhbCBiZWZvcmUgd3JpdGluZy5cIixcbiAgXCJcIixcbl0uam9pbihcIlxcblwiKTtcblxuZXhwb3J0IGNsYXNzIEluc3RydWN0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdmF1bHRTZXJ2aWNlOiBWYXVsdFNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBzZXR0aW5nc1Byb3ZpZGVyOiAoKSA9PiBCcmFpblBsdWdpblNldHRpbmdzLFxuICApIHt9XG5cbiAgYXN5bmMgZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZUZpbGUoXG4gICAgICBzZXR0aW5ncy5pbnN0cnVjdGlvbnNGaWxlLFxuICAgICAgREVGQVVMVF9JTlNUUlVDVElPTlMsXG4gICAgKTtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZFRleHQoZmlsZS5wYXRoKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZXBsYWNlVGV4dChmaWxlLnBhdGgsIERFRkFVTFRfSU5TVFJVQ1RJT05TKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0lOU1RSVUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBhc3luYyByZWFkSW5zdHJ1Y3Rpb25zKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZW5zdXJlSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3V0aWxzL2FpLWNvbmZpZ1wiO1xuaW1wb3J0IHsgQnJhaW5BSVNlcnZpY2UgfSBmcm9tIFwiLi9haS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBJbnN0cnVjdGlvblNlcnZpY2UgfSBmcm9tIFwiLi9pbnN0cnVjdGlvbi1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFF1ZXJ5TWF0Y2gsIFZhdWx0UXVlcnlTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHsgVmF1bHRXcml0ZVBsYW4sIFZhdWx0V3JpdGVTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtd3JpdGUtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0Q2hhdFJlc3BvbnNlIHtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdO1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhdEV4Y2hhbmdlIHtcbiAgcm9sZTogXCJ1c2VyXCIgfCBcImJyYWluXCI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBUaGUgc291cmNlIGhpbnRzIGFyZSB0aGUgbW9kZWwncyBvbmx5IHZpZXcgb2YgdGhlIHZhdWx0LCBzbyBCcmFpbiBzZW5kcyBhIGZld1xuICogbW9yZSBvZiB0aGVtLCBhbmQgbW9yZSBvZiBlYWNoLCB0aGFuIGl0IGRpZCB3aGVuIENvZGV4IGNvdWxkIGdvIHJlYWQgZmlsZXNcbiAqIGZvciBpdHNlbGYuXG4gKi9cbmNvbnN0IENIQVRfQ09OVEVYVF9MSU1JVCA9IDg7XG5jb25zdCBNQVhfSElTVE9SWV9FWENIQU5HRVMgPSA2O1xuY29uc3QgTUFYX0NPTlRFWFRfRVhDRVJQVF9DSEFSUyA9IDEyMDA7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdENoYXRTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBhaVNlcnZpY2U6IEJyYWluQUlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5zdHJ1Y3Rpb25TZXJ2aWNlOiBJbnN0cnVjdGlvblNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBxdWVyeVNlcnZpY2U6IFZhdWx0UXVlcnlTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgd3JpdGVTZXJ2aWNlOiBWYXVsdFdyaXRlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyByZXNwb25kKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBoaXN0b3J5OiBDaGF0RXhjaGFuZ2VbXSA9IFtdLFxuICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgIG9uU3RhZ2U/OiAoc3RhZ2U6IFwicXVlcnlcIiB8IFwiYWlcIikgPT4gdm9pZCxcbiAgKTogUHJvbWlzZTxWYXVsdENoYXRSZXNwb25zZT4ge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBtZXNzYWdlLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVudGVyIGEgbWVzc2FnZSBmaXJzdFwiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVja2VkIGJlZm9yZSByZXRyaWV2YWwgc28gYW4gdW5jb25maWd1cmVkIENvZGV4IGZhaWxzIGltbWVkaWF0ZWx5XG4gICAgLy8gaW5zdGVhZCBvZiBhZnRlciBhIGZ1bGwgdmF1bHQgc2Nhbi5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHNldHRpbmdzKTtcbiAgICBpZiAoIWFpU3RhdHVzLmNvbmZpZ3VyZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihhaVN0YXR1cy5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBvblN0YWdlPy4oXCJxdWVyeVwiKTtcbiAgICAvLyBSZXRyaWV2ZSBleGFjdGx5IHRoZSBzb3VyY2VzIHRoYXQgZ28gaW50byB0aGUgcHJvbXB0LCBzbyB0aGUgc291cmNlcyB0aGVcbiAgICAvLyBVSSBhdHRyaWJ1dGVzIHRoZSBhbnN3ZXIgdG8gYXJlIHRoZSBvbmVzIHRoZSBtb2RlbCBhY3R1YWxseSBzYXcuXG4gICAgY29uc3QgW2luc3RydWN0aW9ucywgc291cmNlc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmluc3RydWN0aW9uU2VydmljZS5yZWFkSW5zdHJ1Y3Rpb25zKCksXG4gICAgICB0aGlzLnF1ZXJ5U2VydmljZS5xdWVyeVZhdWx0KHRyaW1tZWQsIHtcbiAgICAgICAgbGltaXQ6IENIQVRfQ09OVEVYVF9MSU1JVCxcbiAgICAgICAgcHJpb3JRdWVyeTogbGFzdFVzZXJNZXNzYWdlKGhpc3RvcnkpLFxuICAgICAgfSksXG4gICAgXSk7XG4gICAgY29uc3QgY29udGV4dCA9IGZvcm1hdFNvdXJjZXNGb3JQcm9tcHQoc291cmNlcyk7XG5cbiAgICBvblN0YWdlPy4oXCJhaVwiKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYWlTZXJ2aWNlLmNvbXBsZXRlQ2hhdChcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgICAgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQoaW5zdHJ1Y3Rpb25zLCBzZXR0aW5ncyksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgICBjb250ZW50OiBidWlsZFVzZXJQcm9tcHQodHJpbW1lZCwgY29udGV4dCwgaGlzdG9yeSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgc2V0dGluZ3MsXG4gICAgICBzaWduYWwsXG4gICAgKTtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUNoYXRSZXNwb25zZShyZXNwb25zZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogcGFyc2VkLmFuc3dlciB8fCBcIkNvZGV4IHJldHVybmVkIG5vIGFuc3dlci5cIixcbiAgICAgIHNvdXJjZXMsXG4gICAgICBwbGFuOiBwYXJzZWQucGxhbiA/IHRoaXMud3JpdGVTZXJ2aWNlLm5vcm1hbGl6ZVBsYW4ocGFyc2VkLnBsYW4pIDogbnVsbCxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogVGhlIG1vc3QgcmVjZW50IHVzZXIgbWVzc2FnZSBiZWZvcmUgdGhpcyBvbmUuIEEgZm9sbG93LXVwIGxpa2UgXCJ3aGVuIGlzIHRoZVxuICogbmV4dCByZXZpZXc/XCIgY2FycmllcyBub25lIG9mIGl0cyBvd24gc3ViamVjdCwgc28gcmV0cmlldmFsIHdvdWxkIG90aGVyd2lzZVxuICogbG9zZSB0aGUgdGhyZWFkLlxuICovXG5mdW5jdGlvbiBsYXN0VXNlck1lc3NhZ2UoaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBmb3IgKGxldCBpbmRleCA9IGhpc3RvcnkubGVuZ3RoIC0gMTsgaW5kZXggPj0gMDsgaW5kZXggLT0gMSkge1xuICAgIGlmIChoaXN0b3J5W2luZGV4XS5yb2xlID09PSBcInVzZXJcIikge1xuICAgICAgcmV0dXJuIGhpc3RvcnlbaW5kZXhdLnRleHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU3lzdGVtUHJvbXB0KFxuICBpbnN0cnVjdGlvbnM6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gW1xuICAgIFwiWW91IGFyZSBCcmFpbiwgYW4gT2JzaWRpYW4gdmF1bHQgYXNzaXN0YW50LlwiLFxuICAgIFwiQW5zd2VyIGZyb20gdGhlIHNvdXJjZSBoaW50cyBwcm92aWRlZCBpbiB0aGUgdXNlciBtZXNzYWdlLlwiLFxuICAgIFwiWW91IGhhdmUgbm8gc2hlbGwgYW5kIG5vIGZpbGVzeXN0ZW0gYWNjZXNzLiBUaGUgc291cmNlIGhpbnRzIGFyZSB0aGUgb25seSB2YXVsdCBjb250ZW50IGF2YWlsYWJsZSB0byB5b3U7IHRoZXJlIGlzIG5vdGhpbmcgZWxzZSB0byByZWFkLlwiLFxuICAgIFwiTmV2ZXIgY2xhaW0gZmFjdHMgdGhhdCBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGUgcHJvdmlkZWQgc291cmNlIGhpbnRzLlwiLFxuICAgIFwiSWYgdGhlIGhpbnRzIGRvIG5vdCBhbnN3ZXIgdGhlIHF1ZXN0aW9uLCBzYXkgc28gcGxhaW5seSBhbmQgbmFtZSB3aGF0IHRoZSB1c2VyIGNvdWxkIHNlYXJjaCBmb3Igb3Igd2hpY2ggbm90ZSBpcyBsaWtlbHkgdG8gaG9sZCBpdC4gRG8gbm90IGd1ZXNzLCBhbmQgZG8gbm90IGRlc2NyaWJlIGZpbGVzIHlvdSB3ZXJlIG5vdCBzaG93bi5cIixcbiAgICBcIkZvciBzaW1wbGUgcXVlc3Rpb25zLCBhbnN3ZXIgaW4gb25lIG9yIHR3byBzZW50ZW5jZXMuXCIsXG4gICAgXCJGb3IgZmlsaW5nIHJlcXVlc3RzLCBwcm9wb3NlIHNhZmUgdmF1bHQgd3JpdGVzLlwiLFxuICAgIFwiUmV0dXJuIG9ubHkgYSBKU09OIG9iamVjdC5cIixcbiAgICBcIlwiLFxuICAgIFwiUmV0dXJuIHRoaXMgSlNPTiBzaGFwZTpcIixcbiAgICBcIntcIixcbiAgICAnICBcImFuc3dlclwiOiBcIm1hcmtkb3duIGFuc3dlciB3aXRoIGV2aWRlbmNlIGFuZCBnYXBzXCIsJyxcbiAgICAnICBcInBsYW5cIjogeycsXG4gICAgJyAgICBcInN1bW1hcnlcIjogXCJzaG9ydCBzdW1tYXJ5IG9mIHByb3Bvc2VkIHdyaXRlcywgb3IgZW1wdHkgc3RyaW5nXCIsJyxcbiAgICAnICAgIFwiY29uZmlkZW5jZVwiOiBcImxvd3xtZWRpdW18aGlnaFwiLCcsXG4gICAgJyAgICBcIm9wZXJhdGlvbnNcIjogWycsXG4gICAgJyAgICAgIHtcInR5cGVcIjpcImFwcGVuZFwiLFwicGF0aFwiOlwiU29tZS9GaWxlLm1kXCIsXCJjb250ZW50XCI6XCJtYXJrZG93blwifSwnLFxuICAgICcgICAgICB7XCJ0eXBlXCI6XCJjcmVhdGVcIixcInBhdGhcIjpcIlNvbWUvTmV3IEZpbGUubWRcIixcImNvbnRlbnRcIjpcIm1hcmtkb3duXCJ9JyxcbiAgICBcIiAgICBdLFwiLFxuICAgICcgICAgXCJxdWVzdGlvbnNcIjogW1wib3BlbiBxdWVzdGlvbiBpZiB5b3UgbmVlZCBjbGFyaWZpY2F0aW9uXCJdJyxcbiAgICBcIiAgfVwiLFxuICAgIFwifVwiLFxuICAgIFwiXCIsXG4gICAgXCJPbmx5IGluY2x1ZGUgd3JpdGUgb3BlcmF0aW9ucyB3aGVuIHRoZSB1c2VyIGFza3MgdG8gYWRkLCBzYXZlLCBmaWxlLCByZW1lbWJlciwgdXBkYXRlLCBjcmVhdGUsIG9yIG90aGVyd2lzZSBwdXQgaW5mb3JtYXRpb24gaW50byB0aGUgdmF1bHQuXCIsXG4gICAgXCJVc2UgYXBwZW5kL2NyZWF0ZSBvcGVyYXRpb25zIG9ubHkuIERvIG5vdCBwcm9wb3NlIGRlbGV0ZSBvciByZXBsYWNlIG9wZXJhdGlvbnMuXCIsXG4gICAgYERlZmF1bHQgbm90ZXMgZm9sZGVyOiAke3NldHRpbmdzLm5vdGVzRm9sZGVyfWAsXG4gICAgXCJcIixcbiAgICBcIlZhdWx0IGluc3RydWN0aW9uczpcIixcbiAgICBpbnN0cnVjdGlvbnMsXG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRVc2VyUHJvbXB0KFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIGNvbnRleHQ6IHN0cmluZyxcbiAgaGlzdG9yeTogQ2hhdEV4Y2hhbmdlW10sXG4pOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCByZWNlbnRIaXN0b3J5ID0gaGlzdG9yeS5zbGljZSgtTUFYX0hJU1RPUllfRVhDSEFOR0VTKTtcbiAgaWYgKHJlY2VudEhpc3RvcnkubGVuZ3RoID4gMCkge1xuICAgIHBhcnRzLnB1c2goXCJDb252ZXJzYXRpb24gaGlzdG9yeTpcIik7XG4gICAgZm9yIChjb25zdCBleGNoYW5nZSBvZiByZWNlbnRIaXN0b3J5KSB7XG4gICAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICAgICAgcGFydHMucHVzaChgJHtleGNoYW5nZS5yb2xlID09PSBcInVzZXJcIiA/IFwiVXNlclwiIDogXCJCcmFpblwifTpgKTtcbiAgICAgIHBhcnRzLnB1c2goZXhjaGFuZ2UudGV4dCk7XG4gICAgfVxuICAgIHBhcnRzLnB1c2goXCJcIik7XG4gICAgcGFydHMucHVzaChcIi0tLVwiKTtcbiAgICBwYXJ0cy5wdXNoKFwiXCIpO1xuICB9XG5cbiAgcGFydHMucHVzaChgVXNlciBtZXNzYWdlOiAke21lc3NhZ2V9YCk7XG4gIHBhcnRzLnB1c2goXCJcIik7XG4gIHBhcnRzLnB1c2goXG4gICAgXCJUaGUgc291cmNlIGhpbnRzIGJlbG93IGFyZSB0aGUgY29tcGxldGUgdmF1bHQgY29udGV4dCBmb3IgdGhpcyBxdWVzdGlvbi4gVGhlcmUgaXMgbm8gb3RoZXIgdmF1bHQgY29udGVudCBhdmFpbGFibGUgdG8geW91LlwiLFxuICApO1xuICBwYXJ0cy5wdXNoKFwiXCIpO1xuICBwYXJ0cy5wdXNoKFwiUmVsZXZhbnQgc291cmNlIGhpbnRzOlwiKTtcbiAgcGFydHMucHVzaChcbiAgICBjb250ZXh0XG4gICAgICB8fCBcIk5vIG1hdGNoaW5nIHZhdWx0IGZpbGVzIGZvdW5kLiBTYXkgc28sIGFuZCBzdWdnZXN0IHdoYXQgdGhlIHVzZXIgY291bGQgc2VhcmNoIGZvciBpbnN0ZWFkLlwiLFxuICApO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRTb3VyY2VzRm9yUHJvbXB0KHNvdXJjZXM6IFZhdWx0UXVlcnlNYXRjaFtdKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNvdXJjZXNcbiAgICAubWFwKChzb3VyY2UsIGluZGV4KSA9PiBbXG4gICAgICBgIyMgU291cmNlICR7aW5kZXggKyAxfTogJHtzb3VyY2UucGF0aH1gLFxuICAgICAgYFRpdGxlOiAke3NvdXJjZS50aXRsZX1gLFxuICAgICAgYFJlYXNvbjogJHtzb3VyY2UucmVhc29ufWAsXG4gICAgICBcIlwiLFxuICAgICAgc291cmNlLmV4Y2VycHQuc2xpY2UoMCwgTUFYX0NPTlRFWFRfRVhDRVJQVF9DSEFSUyksXG4gICAgXS5qb2luKFwiXFxuXCIpKVxuICAgIC5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDaGF0UmVzcG9uc2UocmVzcG9uc2U6IHN0cmluZyk6IHtcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIC8qKiBSYXcsIHVudmFsaWRhdGVkIHBsYW4gcGF5bG9hZC4gYFZhdWx0V3JpdGVTZXJ2aWNlLm5vcm1hbGl6ZVBsYW5gIHZhbGlkYXRlcyBpdC4gKi9cbiAgcGxhbjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsO1xufSB7XG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGpzb25DYW5kaWRhdGVzKHJlc3BvbnNlKSkge1xuICAgIGxldCBwYXJzZWQ6IHVua25vd247XG4gICAgdHJ5IHtcbiAgICAgIHBhcnNlZCA9IEpTT04ucGFyc2UoY2FuZGlkYXRlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoIWlzSnNvbk9iamVjdChwYXJzZWQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuc3dlcjogdHlwZW9mIHBhcnNlZC5hbnN3ZXIgPT09IFwic3RyaW5nXCIgPyBwYXJzZWQuYW5zd2VyLnRyaW0oKSA6IFwiXCIsXG4gICAgICBwbGFuOiBpc0pzb25PYmplY3QocGFyc2VkLnBsYW4pID8gcGFyc2VkLnBsYW4gOiBudWxsLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBhbnN3ZXI6IHJlc3BvbnNlLnRyaW0oKSxcbiAgICBwbGFuOiBudWxsLFxuICB9O1xufVxuXG4vKipcbiAqIENhbmRpZGF0ZSBKU09OIHBheWxvYWRzLCBtb3N0IHRydXN0d29ydGh5IGZpcnN0LlxuICpcbiAqIFRoZSB3aG9sZSByZXNwb25zZSBpcyB0cmllZCBiZWZvcmUgYW55IGZlbmNlLCBiZWNhdXNlIENvZGV4IG5vcm1hbGx5IHJldHVybnNcbiAqIGJhcmUgSlNPTiB3aG9zZSBgYW5zd2VyYCBjb250YWlucyBtYXJrZG93biBcdTIwMTQgb2Z0ZW4gaW5jbHVkaW5nIGEgZmVuY2VkIGNvZGVcbiAqIGJsb2NrLiBNYXRjaGluZyBhbiB1bmFuY2hvcmVkIGZlbmNlIGZpcnN0IHdvdWxkIGV4dHJhY3QgdGhhdCBpbm5lciBibG9jayBhbmRcbiAqIGxvc2UgYm90aCB0aGUgYW5zd2VyIGFuZCB0aGUgd3JpdGUgcGxhbi5cbiAqL1xuZnVuY3Rpb24ganNvbkNhbmRpZGF0ZXModGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCk7XG4gIGlmICghdHJpbW1lZCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbdHJpbW1lZF07XG5cbiAgY29uc3QgZmVuY2VkID0gdHJpbW1lZC5tYXRjaCgvXmBgYCg/Ompzb24pP1sgXFx0XSpcXHI/XFxuKFtcXHNcXFNdKj8pXFxyP1xcbj9gYGAkL2kpPy5bMV07XG4gIGlmIChmZW5jZWQpIHtcbiAgICBjYW5kaWRhdGVzLnB1c2goZmVuY2VkLnRyaW0oKSk7XG4gIH1cblxuICBjb25zdCBzdGFydCA9IHRyaW1tZWQuaW5kZXhPZihcIntcIik7XG4gIGNvbnN0IGVuZCA9IHRyaW1tZWQubGFzdEluZGV4T2YoXCJ9XCIpO1xuICBpZiAoc3RhcnQgIT09IC0xICYmIGVuZCA+IHN0YXJ0KSB7XG4gICAgY2FuZGlkYXRlcy5wdXNoKHRyaW1tZWQuc2xpY2Uoc3RhcnQsIGVuZCArIDEpKTtcbiAgfVxuXG4gIHJldHVybiBjYW5kaWRhdGVzO1xufVxuXG5mdW5jdGlvbiBpc0pzb25PYmplY3QodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuIiwgImltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcblxuLyoqXG4gKiBOb3JtYWxpemVzIGEgdmF1bHQtcmVsYXRpdmUgcGF0aCBmb3IgY29tcGFyaXNvbiBvbmx5LlxuICpcbiAqIFZhdWx0IHBhdGhzIGFyZSBjb21wYXJlZCBjYXNlLWluc2Vuc2l0aXZlbHkgYmVjYXVzZSBCcmFpbiBydW5zIG9uXG4gKiBjYXNlLWluc2Vuc2l0aXZlIGZpbGVzeXN0ZW1zIChtYWNPUywgV2luZG93cyksIHdoZXJlIGBicmFpbi9hZ2VudHMubWRgIGFuZFxuICogYEJyYWluL0FHRU5UUy5tZGAgYXJlIHRoZSBzYW1lIGZpbGUuIENvbXBhcmluZyB0aGUgcmF3IHN0cmluZ3Mgd291bGQgbGV0IGFcbiAqIGRpZmZlcmVudGx5LWNhc2VkIHBhdGggc2xpcCBwYXN0IHRoZSBpbnN0cnVjdGlvbnMtZmlsZSBndWFyZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUNvbXBhcmFibGVQYXRoKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL1xcLysvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL15cXC8rLywgXCJcIilcbiAgICAucmVwbGFjZSgvXFwvKyQvLCBcIlwiKVxuICAgIC50b0xvd2VyQ2FzZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtZVBhdGgobGVmdDogc3RyaW5nLCByaWdodDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVDb21wYXJhYmxlUGF0aChsZWZ0KTtcbiAgcmV0dXJuIEJvb2xlYW4obm9ybWFsaXplZCkgJiYgbm9ybWFsaXplZCA9PT0gbm9ybWFsaXplQ29tcGFyYWJsZVBhdGgocmlnaHQpO1xufVxuXG4vKiogVHJ1ZSB3aGVuIGBwYXRoYCBpcyBpbnNpZGUgYGZvbGRlcmAgKG9yIGlzIHRoZSBmb2xkZXIgaXRzZWxmKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0luc2lkZUZvbGRlcihwYXRoOiBzdHJpbmcsIGZvbGRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXIgPSBub3JtYWxpemVDb21wYXJhYmxlUGF0aChmb2xkZXIpO1xuICBpZiAoIW5vcm1hbGl6ZWRGb2xkZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVDb21wYXJhYmxlUGF0aChwYXRoKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWRQYXRoID09PSBub3JtYWxpemVkRm9sZGVyXG4gICAgfHwgbm9ybWFsaXplZFBhdGguc3RhcnRzV2l0aChgJHtub3JtYWxpemVkRm9sZGVyfS9gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FmZU1hcmtkb3duUGF0aChcbiAgcGF0aDogc3RyaW5nLFxuICBzZXR0aW5ncz86IFBpY2s8QnJhaW5QbHVnaW5TZXR0aW5ncywgXCJpbnN0cnVjdGlvbnNGaWxlXCI+LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICBjb25zdCBpc1NhZmUgPVxuICAgIEJvb2xlYW4ocGF0aCkgJiZcbiAgICBwYXRoLmVuZHNXaXRoKFwiLm1kXCIpICYmXG4gICAgIXNlZ21lbnRzLmluY2x1ZGVzKFwiLi5cIikgJiZcbiAgICBzZWdtZW50cy5ldmVyeSgoc2VnbWVudCkgPT4gIXNlZ21lbnQuc3RhcnRzV2l0aChcIi5cIikpO1xuXG4gIGlmICghaXNTYWZlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHNldHRpbmdzICYmIHNhbWVQYXRoKHBhdGgsIHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBDYWNoZWRNZXRhZGF0YSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJyYWluUGx1Z2luU2V0dGluZ3MsIHBhcnNlRXhjbHVkZUZvbGRlcnMgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NcIjtcbmltcG9ydCB7IGlzSW5zaWRlRm9sZGVyLCBzYW1lUGF0aCB9IGZyb20gXCIuLi91dGlscy9wYXRoLXNhZmV0eVwiO1xuaW1wb3J0IHsgVmF1bHRTZXJ2aWNlIH0gZnJvbSBcIi4vdmF1bHQtc2VydmljZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0UXVlcnlNYXRjaCB7XG4gIHBhdGg6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGV4Y2VycHQ6IHN0cmluZztcbn1cblxuY29uc3QgTUFYX1FVRVJZX0ZJTEVTID0gMTI7XG4vKipcbiAqIFVwcGVyIGJvdW5kIG9uIGhvdyBtYW55IGZpbGVzIGdldCB0aGVpciBjb250ZW50cyByZWFkIGZvciBvbmUgcXVlcnkuXG4gKlxuICogRmlsZXMgYXJlIHJlYWQgaW4gb3JkZXIgb2YgYSBzY29yZSBidWlsdCBmcm9tIHBhdGgsIHRpdGxlIGFuZCBPYnNpZGlhbidzXG4gKiBtZXRhZGF0YSBjYWNoZSAoaGVhZGluZ3MsIHRhZ3MsIGxpbmtzLCBhbGlhc2VzKSwgbm9uZSBvZiB3aGljaCBuZWVkcyBhIGZpbGVcbiAqIHJlYWQuIFZhdWx0cyBzbWFsbGVyIHRoYW4gdGhpcyBhcmUgc2Nhbm5lZCBpbiBmdWxsLCBzbyB0aGlzIG9ubHkgdGFrZXMgZWZmZWN0XG4gKiBvbiB2ZXJ5IGxhcmdlIHZhdWx0cyBcdTIwMTQgYW5kIHdoZW4gaXQgZG9lcywgdGhlIGZpbGVzIGl0IHNraXBzIGFyZSB0aGUgb25lcyB3aXRoXG4gKiBubyBwYXRoLCBoZWFkaW5nLCB0YWcsIGxpbmsgb3IgYWxpYXMgbWF0Y2ggYW5kIHRoZSBvbGRlc3QgbW9kaWZpY2F0aW9uIHRpbWVzLlxuICovXG5jb25zdCBNQVhfQ09OVEVOVF9TQ0FOX0ZJTEVTID0gMTAwMDtcbi8qKlxuICogRXhjZXJwdHMgYXJlIHRoZSBtb2RlbCdzIGVudGlyZSB2aWV3IG9mIGEgbm90ZSwgc28gdGhleSBjYXJyeSBhIHJlYWwgd2luZG93XG4gKiBvZiBjb250ZW50IHJhdGhlciB0aGFuIGEgdGVhc2VyLiBUaGUgcHJldmlvdXMgNS1saW5lLzcwMC1jaGFyIHNuaXBwZXQgd2FzXG4gKiBzaXplZCBmb3IgYSBtb2RlbCB0aGF0IGNvdWxkIG9wZW4gdGhlIGZpbGUgaXRzZWxmLlxuICovXG5jb25zdCBNQVhfRVhDRVJQVF9DSEFSUyA9IDEyMDA7XG5jb25zdCBNQVhfU05JUFBFVF9MSU5FUyA9IDEyO1xuY29uc3QgTUlOX1RPS0VOX0xFTkdUSCA9IDI7XG5jb25zdCBNQVhfVE9LRU5TID0gMjQ7XG4vKipcbiAqIEhvdyBtdWNoIGEgdGVybSBjYXJyaWVkIG92ZXIgZnJvbSB0aGUgcHJldmlvdXMgcXVlc3Rpb24gY291bnRzLCByZWxhdGl2ZSB0byBhXG4gKiB0ZXJtIGluIHRoZSBjdXJyZW50IG9uZS4gRm9sbG93LXVwcyBsaWtlIFwid2hlbiBpcyB0aGUgbmV4dCByZXZpZXc/XCIgZGVwZW5kIG9uXG4gKiB0aGUgc3ViamVjdCBvZiB0aGUgcHJpb3IgdHVybiwgYnV0IHRoYXQgc3ViamVjdCBtdXN0IG5vdCBvdXRyYW5rIHdoYXQgdGhlXG4gKiB1c2VyIGFjdHVhbGx5IGp1c3QgYXNrZWQuXG4gKi9cbmNvbnN0IENBUlJJRURfVE9LRU5fV0VJR0hUID0gMC40O1xuY29uc3QgU1RPUF9XT1JEUyA9IG5ldyBTZXQoW1xuICBcImFib3V0XCIsXG4gIFwiYW1cIixcbiAgXCJhblwiLFxuICBcImFuZFwiLFxuICBcImFyZVwiLFxuICBcImFzXCIsXG4gIFwiYXRcIixcbiAgXCJiZVwiLFxuICBcImJ1dFwiLFxuICBcImJ5XCIsXG4gIFwiY2FuXCIsXG4gIFwiZGlkXCIsXG4gIFwiZG9cIixcbiAgXCJkb2VzXCIsXG4gIFwiZm9yXCIsXG4gIFwiZnJvbVwiLFxuICBcImdvXCIsXG4gIFwiaGF2ZVwiLFxuICBcImhlXCIsXG4gIFwiaG93XCIsXG4gIFwiaWZcIixcbiAgXCJpblwiLFxuICBcImludG9cIixcbiAgXCJpc1wiLFxuICBcIml0XCIsXG4gIFwia25vd1wiLFxuICBcImxpc3RcIixcbiAgXCJtZVwiLFxuICBcIm15XCIsXG4gIFwibm9cIixcbiAgXCJub3RcIixcbiAgXCJvZlwiLFxuICBcIm9uXCIsXG4gIFwib3JcIixcbiAgXCJzb1wiLFxuICBcInRoZVwiLFxuICBcInRoaXNcIixcbiAgXCJ0aGF0XCIsXG4gIFwidG9cIixcbiAgXCJ1cFwiLFxuICBcInVzXCIsXG4gIFwid2VcIixcbiAgXCJ3aGF0XCIsXG4gIFwid2hlblwiLFxuICBcIndoZXJlXCIsXG4gIFwid2hpY2hcIixcbiAgXCJ3aG9cIixcbiAgXCJ3aHlcIixcbiAgXCJ3aXRoXCIsXG4gIFwieW91XCIsXG5dKTtcblxuLyoqXG4gKiBSZWdleGVzIGZvciBvbmUgcXVlcnkgdG9rZW4sIGNvbXBpbGVkIG9uY2UgcGVyIHF1ZXJ5IGluc3RlYWQgb2Ygb25jZSBwZXJcbiAqIGZpbGUuIEEgbGFyZ2UgdmF1bHQgbXVsdGlwbGllcyB0aGlzIGJ5IHRob3VzYW5kcyBvZiBmaWxlcywgc28gYnVpbGRpbmcgdGhlbVxuICogaW5zaWRlIHRoZSBzY29yaW5nIGxvb3AgZG9taW5hdGVkIHF1ZXJ5IHRpbWUuXG4gKi9cbmludGVyZmFjZSBUb2tlbk1hdGNoZXIge1xuICB0b2tlbjogc3RyaW5nO1xuICB3ZWlnaHQ6IG51bWJlcjtcbiAgaGVhZGluZzogUmVnRXhwO1xuICBsaW5rOiBSZWdFeHA7XG4gIHRhZzogUmVnRXhwO1xuICBvY2N1cnJlbmNlczogUmVnRXhwO1xufVxuXG5pbnRlcmZhY2UgQ2FuZGlkYXRlIHtcbiAgZmlsZTogVEZpbGU7XG4gIHBhdGhTY29yZTogbnVtYmVyO1xuICBwcmVTY29yZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZhdWx0UXVlcnlPcHRpb25zIHtcbiAgbGltaXQ/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgcHJldmlvdXMgdXNlciBtZXNzYWdlLiBJdHMgdGVybXMgYXJlIHNjb3JlZCBhdCBhIHJlZHVjZWQgd2VpZ2h0IHNvIGFcbiAgICogc2hvcnQgZm9sbG93LXVwIHN0aWxsIHJldHJpZXZlcyBub3RlcyBhYm91dCB0aGUgc3ViamVjdCB1bmRlciBkaXNjdXNzaW9uLlxuICAgKi9cbiAgcHJpb3JRdWVyeT86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0UXVlcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB2YXVsdFNlcnZpY2U6IFZhdWx0U2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzUHJvdmlkZXI6ICgpID0+IEJyYWluUGx1Z2luU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBxdWVyeVZhdWx0KHF1ZXJ5OiBzdHJpbmcsIG9wdGlvbnM6IFZhdWx0UXVlcnlPcHRpb25zID0ge30pOiBQcm9taXNlPFZhdWx0UXVlcnlNYXRjaFtdPiB7XG4gICAgY29uc3QgbGltaXQgPSBvcHRpb25zLmxpbWl0ID8/IE1BWF9RVUVSWV9GSUxFUztcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3NQcm92aWRlcigpO1xuXG4gICAgY29uc3QgcHJpbWFyeVRva2VucyA9IHRva2VuaXplKHF1ZXJ5KTtcbiAgICBjb25zdCBjYXJyaWVkVG9rZW5zID0gdG9rZW5pemUob3B0aW9ucy5wcmlvclF1ZXJ5ID8/IFwiXCIpXG4gICAgICAuZmlsdGVyKCh0b2tlbikgPT4gIXByaW1hcnlUb2tlbnMuaW5jbHVkZXModG9rZW4pKTtcbiAgICBjb25zdCBtYXRjaGVycyA9IFtcbiAgICAgIC4uLmJ1aWxkVG9rZW5NYXRjaGVycyhwcmltYXJ5VG9rZW5zLCAxKSxcbiAgICAgIC4uLmJ1aWxkVG9rZW5NYXRjaGVycyhjYXJyaWVkVG9rZW5zLCBDQVJSSUVEX1RPS0VOX1dFSUdIVCksXG4gICAgXTtcbiAgICBjb25zdCBwcmltYXJ5Q291bnQgPSBwcmltYXJ5VG9rZW5zLmxlbmd0aDtcbiAgICBjb25zdCBub3JtYWxpemVkUXVlcnkgPSBub3JtYWxpemVQaHJhc2UocXVlcnkpO1xuXG4gICAgY29uc3QgZXhjbHVkZUZvbGRlcnMgPSBwYXJzZUV4Y2x1ZGVGb2xkZXJzKHNldHRpbmdzLmV4Y2x1ZGVGb2xkZXJzKTtcbiAgICBjb25zdCBmaWxlcyA9IChhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5saXN0TWFya2Rvd25GaWxlcygpKVxuICAgICAgLmZpbHRlcigoZmlsZSkgPT4gc2hvdWxkSW5jbHVkZUZpbGUoZmlsZSwgc2V0dGluZ3MuaW5zdHJ1Y3Rpb25zRmlsZSwgZXhjbHVkZUZvbGRlcnMpKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zdGF0Lm10aW1lIC0gbGVmdC5zdGF0Lm10aW1lKTtcblxuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSB0aGlzLnNlbGVjdFNjYW5DYW5kaWRhdGVzKGZpbGVzLCBtYXRjaGVycywgbm9ybWFsaXplZFF1ZXJ5KTtcblxuICAgIGNvbnN0IHNjb3JlZDogQXJyYXk8eyBmaWxlOiBURmlsZTsgc2NvcmU6IG51bWJlciB9PiA9IFtdO1xuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLnZhdWx0U2VydmljZS5yZWFkRmlsZVRleHQoY2FuZGlkYXRlLmZpbGUpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZUZpbGUoY2FuZGlkYXRlLCB0ZXh0LCBtYXRjaGVycywgbm9ybWFsaXplZFF1ZXJ5LCBwcmltYXJ5Q291bnQpO1xuICAgICAgaWYgKHNjb3JlIDw9IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzY29yZWQucHVzaCh7IGZpbGU6IGNhbmRpZGF0ZS5maWxlLCBzY29yZSB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB0b3AgPSBzY29yZWRcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQuc2NvcmUgLSBsZWZ0LnNjb3JlKVxuICAgICAgLnNsaWNlKDAsIGxpbWl0KTtcblxuICAgIC8vIFJlYXNvbnMgYW5kIGV4Y2VycHRzIGFyZSBvbmx5IG5lZWRlZCBmb3IgcmVzdWx0cyB0aGUgY2FsbGVyIHdpbGwgYWN0dWFsbHlcbiAgICAvLyB1c2UsIHNvIHRoZXkgYXJlIGJ1aWx0IGFmdGVyIHJhbmtpbmcgcmF0aGVyIHRoYW4gZm9yIGV2ZXJ5IG1hdGNoLlxuICAgIGNvbnN0IG1hdGNoZXM6IFZhdWx0UXVlcnlNYXRjaFtdID0gW107XG4gICAgZm9yIChjb25zdCB7IGZpbGUsIHNjb3JlIH0gb2YgdG9wKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVhZEZpbGVUZXh0KGZpbGUpO1xuICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogZmlsZS5wYXRoLFxuICAgICAgICB0aXRsZTogdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLFxuICAgICAgICBzY29yZSxcbiAgICAgICAgcmVhc29uOiBidWlsZFJlYXNvbihmaWxlLCB0ZXh0LCBtYXRjaGVycywgbm9ybWFsaXplZFF1ZXJ5KSxcbiAgICAgICAgZXhjZXJwdDogYnVpbGRFeGNlcnB0KHRleHQsIG1hdGNoZXJzKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNpZGVzIHdoaWNoIGZpbGVzIGFyZSB3b3J0aCByZWFkaW5nLiBQYXRoIHNjb3JpbmcgaXMgZnJlZTsgbWV0YWRhdGFcbiAgICogc2NvcmluZyBpcyBvbmx5IHdvcnRoIGNvbXB1dGluZyB3aGVuIHRoZSBzY2FuIGJ1ZGdldCBhY3R1YWxseSBiaW5kcy5cbiAgICovXG4gIHByaXZhdGUgc2VsZWN0U2NhbkNhbmRpZGF0ZXMoXG4gICAgZmlsZXM6IFRGaWxlW10sXG4gICAgbWF0Y2hlcnM6IFRva2VuTWF0Y2hlcltdLFxuICAgIG5vcm1hbGl6ZWRRdWVyeTogc3RyaW5nLFxuICApOiBDYW5kaWRhdGVbXSB7XG4gICAgY29uc3Qgd2l0aGluQnVkZ2V0ID0gZmlsZXMubGVuZ3RoIDw9IE1BWF9DT05URU5UX1NDQU5fRklMRVM7XG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IGZpbGVzLm1hcCgoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgcGF0aFNjb3JlID0gc2NvcmVQYXRoKGZpbGUsIG1hdGNoZXJzLCBub3JtYWxpemVkUXVlcnkpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZSxcbiAgICAgICAgcGF0aFNjb3JlLFxuICAgICAgICBwcmVTY29yZTogd2l0aGluQnVkZ2V0XG4gICAgICAgICAgPyBwYXRoU2NvcmVcbiAgICAgICAgICA6IHBhdGhTY29yZSArIHNjb3JlTWV0YWRhdGEodGhpcy52YXVsdFNlcnZpY2UuZ2V0RmlsZU1ldGFkYXRhKGZpbGUpLCBtYXRjaGVycyksXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgaWYgKHdpdGhpbkJ1ZGdldCkge1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZXM7XG4gICAgfVxuXG4gICAgLy8gYGZpbGVzYCBpcyBhbHJlYWR5IHNvcnRlZCBuZXdlc3QtZmlyc3QsIGFuZCBzb3J0IGlzIHN0YWJsZSwgc28gZmlsZXMgd2l0aFxuICAgIC8vIGVxdWFsIHNpZ25hbCBrZWVwIHJlY2VuY3kgb3JkZXIuXG4gICAgcmV0dXJuIGNhbmRpZGF0ZXNcbiAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQucHJlU2NvcmUgLSBsZWZ0LnByZVNjb3JlKVxuICAgICAgLnNsaWNlKDAsIE1BWF9DT05URU5UX1NDQU5fRklMRVMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEluY2x1ZGVGaWxlKGZpbGU6IFRGaWxlLCBpbnN0cnVjdGlvbnNGaWxlOiBzdHJpbmcsIGV4Y2x1ZGVGb2xkZXJzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBpZiAoc2FtZVBhdGgoZmlsZS5wYXRoLCBpbnN0cnVjdGlvbnNGaWxlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gIWV4Y2x1ZGVGb2xkZXJzLnNvbWUoKGZvbGRlcikgPT4gaXNJbnNpZGVGb2xkZXIoZmlsZS5wYXRoLCBmb2xkZXIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcmV0dXJuIGlucHV0XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoL1teYS16MC05Xy8tXSsvaSlcbiAgICAubWFwKCh0b2tlbikgPT4gdG9rZW4udHJpbSgpKVxuICAgIC5maWx0ZXIoKHRva2VuKSA9PiB0b2tlbi5sZW5ndGggPj0gTUlOX1RPS0VOX0xFTkdUSClcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gIVNUT1BfV09SRFMuaGFzKHRva2VuKSlcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4ge1xuICAgICAgaWYgKHNlZW4uaGFzKHRva2VuKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZCh0b2tlbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIC5zbGljZSgwLCBNQVhfVE9LRU5TKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRUb2tlbk1hdGNoZXJzKHRva2Vuczogc3RyaW5nW10sIHdlaWdodDogbnVtYmVyKTogVG9rZW5NYXRjaGVyW10ge1xuICByZXR1cm4gdG9rZW5zLm1hcCgodG9rZW4pID0+IHtcbiAgICBjb25zdCBlc2NhcGVkID0gZXNjYXBlUmVnRXhwKHRva2VuKTtcbiAgICByZXR1cm4ge1xuICAgICAgdG9rZW4sXG4gICAgICB3ZWlnaHQsXG4gICAgICBoZWFkaW5nOiBuZXcgUmVnRXhwKGAoXnxcXFxcbikjezEsNn1bXlxcXFxuXSoke2VzY2FwZWR9YCwgXCJnXCIpLFxuICAgICAgbGluazogbmV3IFJlZ0V4cChgXFxcXFtcXFxcW1teXFxcXF1dKiR7ZXNjYXBlZH1bXlxcXFxdXSpcXFxcXVxcXFxdYCwgXCJnXCIpLFxuICAgICAgdGFnOiBuZXcgUmVnRXhwKGAoXnxcXFxccykjWy0vX2EtejAtOV0qJHtlc2NhcGVkfVstL19hLXowLTldKmAsIFwiZ1wiKSxcbiAgICAgIG9jY3VycmVuY2VzOiBuZXcgUmVnRXhwKGVzY2FwZWQsIFwiZ1wiKSxcbiAgICB9O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2NvcmVQYXRoKGZpbGU6IFRGaWxlLCBtYXRjaGVyczogVG9rZW5NYXRjaGVyW10sIG5vcm1hbGl6ZWRRdWVyeTogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgbG93ZXJQYXRoID0gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChub3JtYWxpemVkUXVlcnkgJiYgbG93ZXJQYXRoLmluY2x1ZGVzKG5vcm1hbGl6ZWRRdWVyeSkpIHtcbiAgICBzY29yZSArPSAyNDtcbiAgfVxuICBmb3IgKGNvbnN0IG1hdGNoZXIgb2YgbWF0Y2hlcnMpIHtcbiAgICBpZiAobG93ZXJQYXRoLmluY2x1ZGVzKG1hdGNoZXIudG9rZW4pKSB7XG4gICAgICBzY29yZSArPSAxMCAqIG1hdGNoZXIud2VpZ2h0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gc2NvcmU7XG59XG5cbi8qKlxuICogU2NvcmVzIGEgZmlsZSBmcm9tIE9ic2lkaWFuJ3MgcGFyc2VkIG1ldGFkYXRhLCB3aGljaCBuZWVkcyBubyBmaWxlIHJlYWQuXG4gKiBVc2VkIG9ubHkgdG8gcHJpb3JpdGl6ZSB0aGUgY29udGVudCBzY2FuLCBzbyBhIGNvYXJzZSBzaWduYWwgaXMgZW5vdWdoLlxuICovXG5mdW5jdGlvbiBzY29yZU1ldGFkYXRhKG1ldGFkYXRhOiBDYWNoZWRNZXRhZGF0YSB8IG51bGwsIG1hdGNoZXJzOiBUb2tlbk1hdGNoZXJbXSk6IG51bWJlciB7XG4gIGlmICghbWV0YWRhdGEpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCBibG9iID0gbWV0YWRhdGFCbG9iKG1ldGFkYXRhKTtcbiAgaWYgKCFibG9iKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgbGV0IHNjb3JlID0gMDtcbiAgZm9yIChjb25zdCBtYXRjaGVyIG9mIG1hdGNoZXJzKSB7XG4gICAgaWYgKGJsb2IuaW5jbHVkZXMobWF0Y2hlci50b2tlbikpIHtcbiAgICAgIHNjb3JlICs9IDggKiBtYXRjaGVyLndlaWdodDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNjb3JlO1xufVxuXG5mdW5jdGlvbiBtZXRhZGF0YUJsb2IobWV0YWRhdGE6IENhY2hlZE1ldGFkYXRhKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaGVhZGluZyBvZiBtZXRhZGF0YS5oZWFkaW5ncyA/PyBbXSkge1xuICAgIHBhcnRzLnB1c2goaGVhZGluZy5oZWFkaW5nKTtcbiAgfVxuICBmb3IgKGNvbnN0IHRhZyBvZiBtZXRhZGF0YS50YWdzID8/IFtdKSB7XG4gICAgcGFydHMucHVzaCh0YWcudGFnKTtcbiAgfVxuICBmb3IgKGNvbnN0IGxpbmsgb2YgbWV0YWRhdGEubGlua3MgPz8gW10pIHtcbiAgICBwYXJ0cy5wdXNoKGxpbmsubGluayk7XG4gICAgaWYgKGxpbmsuZGlzcGxheVRleHQpIHtcbiAgICAgIHBhcnRzLnB1c2gobGluay5kaXNwbGF5VGV4dCk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgYWxpYXMgb2YgZnJvbnRtYXR0ZXJBbGlhc2VzKG1ldGFkYXRhKSkge1xuICAgIHBhcnRzLnB1c2goYWxpYXMpO1xuICB9XG4gIHJldHVybiBwYXJ0cy5qb2luKFwiXFxuXCIpLnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIGZyb250bWF0dGVyQWxpYXNlcyhtZXRhZGF0YTogQ2FjaGVkTWV0YWRhdGEpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGFsaWFzZXMgPSBtZXRhZGF0YS5mcm9udG1hdHRlcj8uYWxpYXNlcztcbiAgaWYgKHR5cGVvZiBhbGlhc2VzID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIFthbGlhc2VzXTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShhbGlhc2VzKSkge1xuICAgIHJldHVybiBhbGlhc2VzLmZpbHRlcigoYWxpYXMpOiBhbGlhcyBpcyBzdHJpbmcgPT4gdHlwZW9mIGFsaWFzID09PSBcInN0cmluZ1wiKTtcbiAgfVxuICByZXR1cm4gW107XG59XG5cbmZ1bmN0aW9uIHNjb3JlRmlsZShcbiAgY2FuZGlkYXRlOiBDYW5kaWRhdGUsXG4gIHRleHQ6IHN0cmluZyxcbiAgbWF0Y2hlcnM6IFRva2VuTWF0Y2hlcltdLFxuICBub3JtYWxpemVkUXVlcnk6IHN0cmluZyxcbiAgcHJpbWFyeUNvdW50OiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBpZiAoIW1hdGNoZXJzLmxlbmd0aCkge1xuICAgIC8vIE5vdGhpbmcgdG8gbWF0Y2ggb24sIHNvIGV2ZXJ5IGZpbGUgaXMgZXF1YWxseSByZWxldmFudC4gQ2FsbGVycyBzb3J0IGJ5XG4gICAgLy8gbXRpbWUgYmVmb3JlIHNjb3JpbmcsIGFuZCB0aGUgc29ydCBhZnRlcndhcmRzIGlzIHN0YWJsZSwgd2hpY2ggbGVhdmVzIHRoZVxuICAgIC8vIG1vc3QgcmVjZW50bHkgbW9kaWZpZWQgbm90ZXMgb24gdG9wLlxuICAgIHJldHVybiAxO1xuICB9XG5cbiAgY29uc3QgeyBmaWxlIH0gPSBjYW5kaWRhdGU7XG4gIGNvbnN0IGxvd2VyUGF0aCA9IGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRpdGxlID0gdGl0bGVGb3JGaWxlKGZpbGUsIHRleHQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcbiAgbGV0IHNjb3JlID0gY2FuZGlkYXRlLnBhdGhTY29yZTtcbiAgaWYgKGNvbnRhaW5zUGhyYXNlKGxvd2VyVGV4dCwgbm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHNjb3JlICs9IDE4O1xuICB9XG4gIGZvciAoY29uc3QgbWF0Y2hlciBvZiBtYXRjaGVycykge1xuICAgIGxldCB0b2tlblNjb3JlID0gMDtcbiAgICBpZiAobG93ZXJUaXRsZS5pbmNsdWRlcyhtYXRjaGVyLnRva2VuKSkge1xuICAgICAgdG9rZW5TY29yZSArPSA5O1xuICAgIH1cbiAgICB0b2tlblNjb3JlICs9IGNvdW50TWF0Y2hlcyhsb3dlclRleHQsIG1hdGNoZXIuaGVhZGluZykgKiA3O1xuICAgIHRva2VuU2NvcmUgKz0gY291bnRNYXRjaGVzKGxvd2VyVGV4dCwgbWF0Y2hlci5saW5rKSAqIDY7XG4gICAgdG9rZW5TY29yZSArPSBjb3VudE1hdGNoZXMobG93ZXJUZXh0LCBtYXRjaGVyLnRhZykgKiA1O1xuICAgIHRva2VuU2NvcmUgKz0gTWF0aC5taW4oOCwgY291bnRNYXRjaGVzKGxvd2VyVGV4dCwgbWF0Y2hlci5vY2N1cnJlbmNlcykpO1xuICAgIHNjb3JlICs9IHRva2VuU2NvcmUgKiBtYXRjaGVyLndlaWdodDtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoZWQgPSBtYXRjaGVycy5maWx0ZXIoXG4gICAgKG1hdGNoZXIpID0+IGxvd2VyUGF0aC5pbmNsdWRlcyhtYXRjaGVyLnRva2VuKSB8fCBsb3dlclRleHQuaW5jbHVkZXMobWF0Y2hlci50b2tlbiksXG4gICk7XG4gIGZvciAoY29uc3QgbWF0Y2hlciBvZiBtYXRjaGVkKSB7XG4gICAgc2NvcmUgKz0gMyAqIG1hdGNoZXIud2VpZ2h0O1xuICB9XG4gIC8vIFRoZSBjb21wbGV0ZW5lc3MgYm9udXMgaXMgYWJvdXQgdGhlIGN1cnJlbnQgcXVlc3Rpb24sIHNvIGNhcnJpZWQtb3ZlciB0ZXJtc1xuICAvLyBuZWl0aGVyIGVhcm4gaXQgbm9yIGJsb2NrIGl0LlxuICBjb25zdCBtYXRjaGVkUHJpbWFyeSA9IG1hdGNoZWQuZmlsdGVyKChtYXRjaGVyKSA9PiBtYXRjaGVyLndlaWdodCA9PT0gMSkubGVuZ3RoO1xuICBpZiAocHJpbWFyeUNvdW50ID4gMCAmJiBtYXRjaGVkUHJpbWFyeSA9PT0gcHJpbWFyeUNvdW50KSB7XG4gICAgc2NvcmUgKz0gTWF0aC5taW4oMTAsIHByaW1hcnlDb3VudCAqIDIpO1xuICB9XG4gIHNjb3JlICs9IHJlY2VuY3lCb251cyhmaWxlKTtcbiAgcmV0dXJuIHNjb3JlO1xufVxuXG5mdW5jdGlvbiByZWNlbmN5Qm9udXMoZmlsZTogVEZpbGUpOiBudW1iZXIge1xuICBjb25zdCBhZ2VEYXlzID0gKERhdGUubm93KCkgLSBmaWxlLnN0YXQubXRpbWUpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuICBpZiAoYWdlRGF5cyA8IDEpIHtcbiAgICByZXR1cm4gMTA7XG4gIH1cbiAgaWYgKGFnZURheXMgPCA3KSB7XG4gICAgcmV0dXJuIDY7XG4gIH1cbiAgaWYgKGFnZURheXMgPCAzMCkge1xuICAgIHJldHVybiAzO1xuICB9XG4gIGlmIChhZ2VEYXlzIDwgOTApIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLyoqXG4gKiBXaGl0ZXNwYWNlLWluc2Vuc2l0aXZlIHBocmFzZSBtYXRjaC4gT25seSBjb2xsYXBzZXMgd2hpdGVzcGFjZSB3aGVuIHRoZSBxdWVyeVxuICogYWN0dWFsbHkgY29udGFpbnMgc29tZSwgd2hpY2ggYXZvaWRzIGNvcHlpbmcgZXZlcnkgZmlsZSdzIHRleHQgaW4gdGhlIGNvbW1vblxuICogc2luZ2xlLXdvcmQgY2FzZS5cbiAqL1xuZnVuY3Rpb24gY29udGFpbnNQaHJhc2UobG93ZXJUZXh0OiBzdHJpbmcsIG5vcm1hbGl6ZWRRdWVyeTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmICghbm9ybWFsaXplZFF1ZXJ5KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICghL1xccy8udGVzdChub3JtYWxpemVkUXVlcnkpKSB7XG4gICAgcmV0dXJuIGxvd2VyVGV4dC5pbmNsdWRlcyhub3JtYWxpemVkUXVlcnkpO1xuICB9XG4gIHJldHVybiBsb3dlclRleHQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikuaW5jbHVkZXMobm9ybWFsaXplZFF1ZXJ5KTtcbn1cblxuZnVuY3Rpb24gY291bnRNYXRjaGVzKHRleHQ6IHN0cmluZywgcGF0dGVybjogUmVnRXhwKTogbnVtYmVyIHtcbiAgcGF0dGVybi5sYXN0SW5kZXggPSAwO1xuICByZXR1cm4gdGV4dC5tYXRjaChwYXR0ZXJuKT8ubGVuZ3RoID8/IDA7XG59XG5cbmZ1bmN0aW9uIHRpdGxlRm9yRmlsZShmaWxlOiBURmlsZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaGVhZGluZyA9IHRleHQubWF0Y2goL14jXFxzKyguKykkL20pPy5bMV0/LnRyaW0oKTtcbiAgaWYgKGhlYWRpbmcpIHtcbiAgICByZXR1cm4gaGVhZGluZztcbiAgfVxuICByZXR1cm4gZmlsZS5iYXNlbmFtZSB8fCBmaWxlLnBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGUucGF0aDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZWFzb24oXG4gIGZpbGU6IFRGaWxlLFxuICB0ZXh0OiBzdHJpbmcsXG4gIG1hdGNoZXJzOiBUb2tlbk1hdGNoZXJbXSxcbiAgbm9ybWFsaXplZFF1ZXJ5OiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICBjb25zdCBsb3dlclBhdGggPSBmaWxlLnBhdGgudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJUaXRsZSA9IHRpdGxlRm9yRmlsZShmaWxlLCB0ZXh0KS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBsb3dlclRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IHJlYXNvbnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgaWYgKGNvbnRhaW5zUGhyYXNlKGxvd2VyVGV4dCwgbm9ybWFsaXplZFF1ZXJ5KSkge1xuICAgIHJlYXNvbnMuYWRkKFwiZXhhY3QgcGhyYXNlIG1hdGNoXCIpO1xuICB9XG4gIGZvciAoY29uc3QgbWF0Y2hlciBvZiBtYXRjaGVycykge1xuICAgIGNvbnN0IGxhYmVsID0gbWF0Y2hlci53ZWlnaHQgPT09IDFcbiAgICAgID8gYFwiJHttYXRjaGVyLnRva2VufVwiYFxuICAgICAgOiBgXCIke21hdGNoZXIudG9rZW59XCIgKGZyb20geW91ciBwcmV2aW91cyBxdWVzdGlvbilgO1xuICAgIGlmIChsb3dlclBhdGguaW5jbHVkZXMobWF0Y2hlci50b2tlbikpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBwYXRoIG1hdGNoZXMgJHtsYWJlbH1gKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGl0bGUuaW5jbHVkZXMobWF0Y2hlci50b2tlbikpIHtcbiAgICAgIHJlYXNvbnMuYWRkKGB0aXRsZSBtYXRjaGVzICR7bGFiZWx9YCk7XG4gICAgfVxuICAgIGlmIChjb3VudE1hdGNoZXMobG93ZXJUZXh0LCBtYXRjaGVyLmhlYWRpbmcpID4gMCkge1xuICAgICAgcmVhc29ucy5hZGQoYGhlYWRpbmcgbWF0Y2hlcyAke2xhYmVsfWApO1xuICAgIH1cbiAgICBpZiAoY291bnRNYXRjaGVzKGxvd2VyVGV4dCwgbWF0Y2hlci5saW5rKSA+IDApIHtcbiAgICAgIHJlYXNvbnMuYWRkKGBsaW5rIG1lbnRpb25zICR7bGFiZWx9YCk7XG4gICAgfVxuICAgIGlmIChjb3VudE1hdGNoZXMobG93ZXJUZXh0LCBtYXRjaGVyLnRhZykgPiAwKSB7XG4gICAgICByZWFzb25zLmFkZChgdGFnIG1hdGNoZXMgJHtsYWJlbH1gKTtcbiAgICB9XG4gICAgaWYgKGxvd2VyVGV4dC5pbmNsdWRlcyhtYXRjaGVyLnRva2VuKSkge1xuICAgICAgcmVhc29ucy5hZGQoYGNvbnRlbnQgbWVudGlvbnMgJHtsYWJlbH1gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIEFycmF5LmZyb20ocmVhc29ucykuc2xpY2UoMCwgMykuam9pbihcIiwgXCIpIHx8IFwicmVjZW50IG1hcmtkb3duIG5vdGVcIjtcbn1cblxuZnVuY3Rpb24gYnVpbGRFeGNlcnB0KHRleHQ6IHN0cmluZywgbWF0Y2hlcnM6IFRva2VuTWF0Y2hlcltdKTogc3RyaW5nIHtcbiAgY29uc3Qgc291cmNlTGluZXMgPSB0ZXh0LnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCByYW5rZWQgPSBzb3VyY2VMaW5lc1xuICAgIC5tYXAoKGxpbmUsIGluZGV4KSA9PiAoeyBpbmRleCwgc2NvcmU6IHNjb3JlTGluZShsaW5lLCBtYXRjaGVycykgfSkpXG4gICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiByaWdodC5zY29yZSAtIGxlZnQuc2NvcmUgfHwgbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4KTtcbiAgY29uc3QgYmVzdExpbmUgPSByYW5rZWQuZmluZCgobGluZSkgPT4gbGluZS5zY29yZSA+IDApPy5pbmRleCA/PyAwO1xuICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIGJlc3RMaW5lIC0gMik7XG4gIGNvbnN0IGVuZCA9IE1hdGgubWluKHNvdXJjZUxpbmVzLmxlbmd0aCwgc3RhcnQgKyBNQVhfU05JUFBFVF9MSU5FUyk7XG4gIGNvbnN0IGV4Y2VycHQgPSBzb3VyY2VMaW5lc1xuICAgIC5zbGljZShzdGFydCwgZW5kKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIGV4Y2VycHQubGVuZ3RoID4gTUFYX0VYQ0VSUFRfQ0hBUlNcbiAgICA/IGAke2V4Y2VycHQuc2xpY2UoMCwgTUFYX0VYQ0VSUFRfQ0hBUlMgLSAzKS50cmltRW5kKCl9Li4uYFxuICAgIDogZXhjZXJwdDtcbn1cblxuZnVuY3Rpb24gc2NvcmVMaW5lKGxpbmU6IHN0cmluZywgbWF0Y2hlcnM6IFRva2VuTWF0Y2hlcltdKTogbnVtYmVyIHtcbiAgY29uc3QgbG93ZXIgPSBsaW5lLnRvTG93ZXJDYXNlKCk7XG4gIGxldCBzY29yZSA9IDA7XG4gIGlmIChsaW5lLnRyaW0oKS5zdGFydHNXaXRoKFwiI1wiKSkge1xuICAgIHNjb3JlICs9IDQ7XG4gIH1cbiAgZm9yIChjb25zdCBtYXRjaGVyIG9mIG1hdGNoZXJzKSB7XG4gICAgaWYgKCFsb3dlci5pbmNsdWRlcyhtYXRjaGVyLnRva2VuKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGxldCBsaW5lU2NvcmUgPSAzO1xuICAgIGlmIChsb3dlci5pbmNsdWRlcyhgW1ske21hdGNoZXIudG9rZW59YCkgfHwgbG93ZXIuaW5jbHVkZXMoYCR7bWF0Y2hlci50b2tlbn1dXWApKSB7XG4gICAgICBsaW5lU2NvcmUgKz0gMjtcbiAgICB9XG4gICAgaWYgKGNvdW50TWF0Y2hlcyhsb3dlciwgbWF0Y2hlci50YWcpID4gMCkge1xuICAgICAgbGluZVNjb3JlICs9IDI7XG4gICAgfVxuICAgIHNjb3JlICs9IGxpbmVTY29yZSAqIG1hdGNoZXIud2VpZ2h0O1xuICB9XG4gIHJldHVybiBzY29yZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUGhyYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbn1cbiIsICJpbXBvcnQge1xuICBBcHAsXG4gIENhY2hlZE1ldGFkYXRhLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgbm9ybWFsaXplUGF0aCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCcmFpblBsdWdpblNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXVsdFNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwKSB7fVxuXG4gIGFzeW5jIGVuc3VyZUtub3duRm9sZGVycyhzZXR0aW5nczogQnJhaW5QbHVnaW5TZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgU2V0KFtcbiAgICAgIHNldHRpbmdzLm5vdGVzRm9sZGVyLFxuICAgICAgcGFyZW50Rm9sZGVyKHNldHRpbmdzLmluc3RydWN0aW9uc0ZpbGUpLFxuICAgIF0pO1xuXG4gICAgZm9yIChjb25zdCBmb2xkZXIgb2YgZm9sZGVycykge1xuICAgICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoZm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoZm9sZGVyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7c2VnbWVudH1gIDogc2VnbWVudDtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUZvbGRlcklmTWlzc2luZyhjdXJyZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIShleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZvbGRlcjogJHtjdXJyZW50fWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZywgaW5pdGlhbENvbnRlbnQgPSBcIlwiKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBleGlzdHMgYnV0IGlzIG5vdCBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcihwYXJlbnRGb2xkZXIobm9ybWFsaXplZCkpO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaW5pdGlhbENvbnRlbnQpO1xuICB9XG5cbiAgYXN5bmMgcmVhZFRleHQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGZpbGVQYXRoKSk7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIGEgZmlsZSBCcmFpbiBhbHJlYWR5IGhvbGRzIGEgaGFuZGxlIHRvLiBVc2VzIGBjYWNoZWRSZWFkYCwgd2hpY2ggaXNcbiAgICogdGhlIEFQSSBtZWFudCBmb3IgcmVhZC1vbmx5IHNjYW5uaW5nLCBhbmQgc2tpcHMgdGhlIHBhdGggbG9va3VwIHRoYXRcbiAgICogYHJlYWRUZXh0YCBoYXMgdG8gZG8uXG4gICAqL1xuICBhc3luYyByZWFkRmlsZVRleHQoZmlsZTogVEZpbGUpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgYXBwZW5kVGV4dChmaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW5zdXJlRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBjb250ZW50LmVuZHNXaXRoKFwiXFxuXCIpID8gY29udGVudCA6IGAke2NvbnRlbnR9XFxuYDtcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBjdXJyZW50Lmxlbmd0aCA9PT0gMFxuICAgICAgPyBcIlwiXG4gICAgICA6IGN1cnJlbnQuZW5kc1dpdGgoXCJcXG5cXG5cIilcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogY3VycmVudC5lbmRzV2l0aChcIlxcblwiKVxuICAgICAgICAgID8gXCJcXG5cIlxuICAgICAgICAgIDogXCJcXG5cXG5cIjtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYCR7Y3VycmVudH0ke3NlcGFyYXRvcn0ke25vcm1hbGl6ZWRDb250ZW50fWApO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgcmVwbGFjZVRleHQoZmlsZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmVuc3VyZUZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gY29udGVudC5lbmRzV2l0aChcIlxcblwiKSA/IGNvbnRlbnQgOiBgJHtjb250ZW50fVxcbmA7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5vcm1hbGl6ZWRDb250ZW50KTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZVVuaXF1ZUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZG90SW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90SW5kZXggPT09IC0xID8gbm9ybWFsaXplZCA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90SW5kZXgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdEluZGV4ID09PSAtMSA/IFwiXCIgOiBub3JtYWxpemVkLnNsaWNlKGRvdEluZGV4KTtcblxuICAgIGxldCBjb3VudGVyID0gMjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtjb3VudGVyfSR7ZXh0ZW5zaW9ufWA7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbGlzdE1hcmtkb3duRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNpZGlhbidzIHBhcnNlZCBoZWFkaW5ncywgdGFncywgbGlua3MsIGFuZCBmcm9udG1hdHRlciBmb3IgYSBmaWxlLiBSZWFkc1xuICAgKiBmcm9tIHRoZSBtZXRhZGF0YSBjYWNoZSwgc28gaXQgY29zdHMgbm8gZmlsZSBJL08uIE51bGwgd2hlbiB0aGUgZmlsZSBoYXNcbiAgICogbm90IGJlZW4gaW5kZXhlZCB5ZXQuXG4gICAqL1xuICBnZXRGaWxlTWV0YWRhdGEoZmlsZTogVEZpbGUpOiBDYWNoZWRNZXRhZGF0YSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlRm9sZGVySWZNaXNzaW5nKGZvbGRlclBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlclBhdGgpO1xuICAgICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyZW50Rm9sZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlUGF0aCk7XG4gIGNvbnN0IGluZGV4ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIik7XG4gIHJldHVybiBpbmRleCA9PT0gLTEgPyBcIlwiIDogbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG4iLCAiaW1wb3J0IHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaXNTYWZlTWFya2Rvd25QYXRoIH0gZnJvbSBcIi4uL3V0aWxzL3BhdGgtc2FmZXR5XCI7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2UgfSBmcm9tIFwiLi92YXVsdC1zZXJ2aWNlXCI7XG5cbmNvbnN0IE1BWF9PUEVSQVRJT05TID0gODtcblxuZXhwb3J0IHR5cGUgVmF1bHRXcml0ZU9wZXJhdGlvbiA9XG4gIHwge1xuICAgICAgdHlwZTogXCJhcHBlbmRcIjtcbiAgICAgIHBhdGg6IHN0cmluZztcbiAgICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIH1cbiAgfCB7XG4gICAgICB0eXBlOiBcImNyZWF0ZVwiO1xuICAgICAgcGF0aDogc3RyaW5nO1xuICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgfTtcblxuZXhwb3J0IGludGVyZmFjZSBWYXVsdFdyaXRlUGxhbiB7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgY29uZmlkZW5jZTogXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcbiAgb3BlcmF0aW9uczogVmF1bHRXcml0ZU9wZXJhdGlvbltdO1xuICBxdWVzdGlvbnM6IHN0cmluZ1tdO1xuICBkcm9wcGVkT3BlcmF0aW9uczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgVmF1bHRXcml0ZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHZhdWx0U2VydmljZTogVmF1bHRTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NQcm92aWRlcjogKCkgPT4gQnJhaW5QbHVnaW5TZXR0aW5ncyxcbiAgKSB7fVxuXG4gIG5vcm1hbGl6ZVBsYW4ocGxhbjogUGFydGlhbDxWYXVsdFdyaXRlUGxhbj4gfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFZhdWx0V3JpdGVQbGFuIHtcbiAgICBjb25zdCBjb25maWRlbmNlID0gcmVhZENvbmZpZGVuY2UocGxhbi5jb25maWRlbmNlKTtcbiAgICBjb25zdCByYXdPcGVyYXRpb25zID0gQXJyYXkuaXNBcnJheShwbGFuLm9wZXJhdGlvbnMpID8gcGxhbi5vcGVyYXRpb25zIDogW107XG4gICAgY29uc3QgdmFsaWRPcGVyYXRpb25zID0gcmF3T3BlcmF0aW9uc1xuICAgICAgLm1hcCgob3BlcmF0aW9uKSA9PiB0aGlzLm5vcm1hbGl6ZU9wZXJhdGlvbihvcGVyYXRpb24pKVxuICAgICAgLmZpbHRlcigob3BlcmF0aW9uKTogb3BlcmF0aW9uIGlzIFZhdWx0V3JpdGVPcGVyYXRpb24gPT4gb3BlcmF0aW9uICE9PSBudWxsKTtcbiAgICBjb25zdCBkcm9wcGVkRnJvbVNhZmV0eSA9IHJhd09wZXJhdGlvbnMubGVuZ3RoIC0gdmFsaWRPcGVyYXRpb25zLmxlbmd0aDtcbiAgICBjb25zdCB0b3RhbEFmdGVyTGltaXQgPSB2YWxpZE9wZXJhdGlvbnMuc2xpY2UoMCwgTUFYX09QRVJBVElPTlMpO1xuICAgIGNvbnN0IGRyb3BwZWRGcm9tTGltaXQgPSB2YWxpZE9wZXJhdGlvbnMubGVuZ3RoIC0gdG90YWxBZnRlckxpbWl0Lmxlbmd0aDtcbiAgICByZXR1cm4ge1xuICAgICAgc3VtbWFyeTogdHlwZW9mIHBsYW4uc3VtbWFyeSA9PT0gXCJzdHJpbmdcIiAmJiBwbGFuLnN1bW1hcnkudHJpbSgpXG4gICAgICAgID8gcGxhbi5zdW1tYXJ5LnRyaW0oKVxuICAgICAgICA6IFwiQnJhaW4gcHJvcG9zZWQgdmF1bHQgdXBkYXRlcy5cIixcbiAgICAgIGNvbmZpZGVuY2UsXG4gICAgICBvcGVyYXRpb25zOiB0b3RhbEFmdGVyTGltaXQsXG4gICAgICBxdWVzdGlvbnM6IChBcnJheS5pc0FycmF5KHBsYW4ucXVlc3Rpb25zKSA/IHBsYW4ucXVlc3Rpb25zIDogW10pXG4gICAgICAgIC5tYXAoKHF1ZXN0aW9uKSA9PiBTdHJpbmcocXVlc3Rpb24pLnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAuc2xpY2UoMCwgNSksXG4gICAgICBkcm9wcGVkT3BlcmF0aW9uczogZHJvcHBlZEZyb21TYWZldHkgKyBkcm9wcGVkRnJvbUxpbWl0LFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBseVBsYW4ocGxhbjogVmF1bHRXcml0ZVBsYW4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzUHJvdmlkZXIoKTtcbiAgICBjb25zdCBwYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG9wZXJhdGlvbiBvZiBwbGFuLm9wZXJhdGlvbnMpIHtcbiAgICAgIGlmICghaXNTYWZlTWFya2Rvd25QYXRoKG9wZXJhdGlvbi5wYXRoLCBzZXR0aW5ncykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiYXBwZW5kXCIpIHtcbiAgICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UuYXBwZW5kVGV4dChvcGVyYXRpb24ucGF0aCwgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgICAgICBwYXRocy5wdXNoKG9wZXJhdGlvbi5wYXRoKTtcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uLnR5cGUgPT09IFwiY3JlYXRlXCIpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMudmF1bHRTZXJ2aWNlLmVuc3VyZVVuaXF1ZUZpbGVQYXRoKG9wZXJhdGlvbi5wYXRoKTtcbiAgICAgICAgYXdhaXQgdGhpcy52YXVsdFNlcnZpY2UucmVwbGFjZVRleHQocGF0aCwgb3BlcmF0aW9uLmNvbnRlbnQpO1xuICAgICAgICBwYXRocy5wdXNoKHBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KHBhdGhzKSk7XG4gIH1cblxuICBwcml2YXRlIG5vcm1hbGl6ZU9wZXJhdGlvbihvcGVyYXRpb246IHVua25vd24pOiBWYXVsdFdyaXRlT3BlcmF0aW9uIHwgbnVsbCB7XG4gICAgaWYgKCFvcGVyYXRpb24gfHwgdHlwZW9mIG9wZXJhdGlvbiAhPT0gXCJvYmplY3RcIiB8fCAhKFwidHlwZVwiIGluIG9wZXJhdGlvbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IG9wZXJhdGlvbiBhcyBQYXJ0aWFsPFZhdWx0V3JpdGVPcGVyYXRpb24+O1xuICAgIGNvbnN0IGNvbnRlbnQgPSBcImNvbnRlbnRcIiBpbiBjYW5kaWRhdGUgPyBTdHJpbmcoY2FuZGlkYXRlLmNvbnRlbnQgPz8gXCJcIikudHJpbSgpIDogXCJcIjtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChjYW5kaWRhdGUudHlwZSAhPT0gXCJhcHBlbmRcIiAmJiBjYW5kaWRhdGUudHlwZSAhPT0gXCJjcmVhdGVcIikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IFwicGF0aFwiIGluIGNhbmRpZGF0ZVxuICAgICAgPyBub3JtYWxpemVNYXJrZG93blBhdGgoU3RyaW5nKGNhbmRpZGF0ZS5wYXRoID8/IFwiXCIpKVxuICAgICAgOiBcIlwiO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5nc1Byb3ZpZGVyKCk7XG4gICAgaWYgKCFpc1NhZmVNYXJrZG93blBhdGgocGF0aCwgc2V0dGluZ3MpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogY2FuZGlkYXRlLnR5cGUsXG4gICAgICBwYXRoLFxuICAgICAgY29udGVudCxcbiAgICAgIGRlc2NyaXB0aW9uOiByZWFkRGVzY3JpcHRpb24oY2FuZGlkYXRlKSxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWREZXNjcmlwdGlvbihvcGVyYXRpb246IFBhcnRpYWw8VmF1bHRXcml0ZU9wZXJhdGlvbj4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdHlwZW9mIG9wZXJhdGlvbi5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiAmJiBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgPyBvcGVyYXRpb24uZGVzY3JpcHRpb24udHJpbSgpXG4gICAgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb25maWRlbmNlKHZhbHVlOiB1bmtub3duKTogVmF1bHRXcml0ZVBsYW5bXCJjb25maWRlbmNlXCJdIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcImxvd1wiIHx8IHZhbHVlID09PSBcIm1lZGl1bVwiIHx8IHZhbHVlID09PSBcImhpZ2hcIiA/IHZhbHVlIDogXCJtZWRpdW1cIjtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWFya2Rvd25QYXRoKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL1xcLysvZywgXCIvXCIpXG4gICAgLnJlcGxhY2UoL15cXC8rLywgXCJcIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBJdGVtVmlldywgTWFya2Rvd25SZW5kZXJlciwgTm90aWNlLCBURmlsZSwgV29ya3NwYWNlTGVhZiwgc2V0SWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEJyYWluUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluXCI7XG5pbXBvcnQgeyBWYXVsdENoYXRSZXNwb25zZSwgQ2hhdEV4Y2hhbmdlIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3ZhdWx0LWNoYXQtc2VydmljZVwiO1xuaW1wb3J0IHR5cGUgeyBWYXVsdFF1ZXJ5TWF0Y2ggfSBmcm9tIFwiLi4vc2VydmljZXMvdmF1bHQtcXVlcnktc2VydmljZVwiO1xuaW1wb3J0IHR5cGUgeyBWYXVsdFdyaXRlUGxhbiB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBWYXVsdFBsYW5Nb2RhbCB9IGZyb20gXCIuL3ZhdWx0LXBsYW4tbW9kYWxcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5pbXBvcnQgeyBnZXRBSUNvbmZpZ3VyYXRpb25TdGF0dXMgfSBmcm9tIFwiLi4vdXRpbHMvYWktY29uZmlnXCI7XG5pbXBvcnQge1xuICBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUsXG4gIERFRkFVTFRfQ09ERVhfTU9ERUxfT1BUSU9OUyxcbiAgQ29kZXhNb2RlbE9wdGlvbixcbiAgZ2V0Q29kZXhNb2RlbERyb3Bkb3duVmFsdWUsXG4gIGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zLFxuICBpc0tub3duQ29kZXhNb2RlbCxcbn0gZnJvbSBcIi4uL3V0aWxzL2NvZGV4LW1vZGVsc1wiO1xuXG5pbnRlcmZhY2UgQ2hhdFR1cm4ge1xuICByb2xlOiBcInVzZXJcIiB8IFwiYnJhaW5cIiB8IFwiZXJyb3JcIiB8IFwiaW5mb1wiO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNvdXJjZXM/OiBWYXVsdFF1ZXJ5TWF0Y2hbXTtcbiAgLyoqIFByb3Bvc2VkIHdyaXRlcywga2VwdCB1bnRpbCBhcHBsaWVkIHNvIGEgY2FuY2VsbGVkIHJldmlldyBjYW4gYmUgcmVvcGVuZWQuICovXG4gIHBsYW4/OiBWYXVsdFdyaXRlUGxhbjtcbiAgdXBkYXRlZFBhdGhzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBCUkFJTl9WSUVXX1RZUEUgPSBcImJyYWluLXNpZGViYXItdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgQnJhaW5TaWRlYmFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgcHJpdmF0ZSBtZXNzYWdlc0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBtb2RlbFJvd0VsITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2VuZEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RvcEJ1dHRvbkVsITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgY2xlYXJCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIG1vZGVsT3B0aW9uczogQ29kZXhNb2RlbE9wdGlvbltdID0gREVGQVVMVF9DT0RFWF9NT0RFTF9PUFRJT05TO1xuICBwcml2YXRlIG1vZGVsT3B0aW9uc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgbW9kZWxTZWxlY3RFbDogSFRNTFNlbGVjdEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtb2RlbEN1c3RvbUlucHV0RWw6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBpc0xvYWRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXJyZW50QWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsb2FkaW5nU3RhcnRlZEF0ID0gMDtcbiAgcHJpdmF0ZSBsb2FkaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxvYWRpbmdUZXh0RWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YWdlRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbG9hZGluZ1N0YWdlOiBcInF1ZXJ5XCIgfCBcImFpXCIgPSBcInF1ZXJ5XCI7XG4gIHByaXZhdGUgcmVuZGVyR2VuZXJhdGlvbiA9IDA7XG4gIHByaXZhdGUgcmVzaXplRnJhbWVJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdHVybnM6IENoYXRUdXJuW10gPSBbXTtcbiAgLyoqIExhdGVzdCByZW5kZXJlZCBlbGVtZW50IGZvciBhIHR1cm4sIHNvIGEgdHVybiBjYW4gYmUgdXBkYXRlZCBpbiBwbGFjZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSB0dXJuRWxlbWVudHMgPSBuZXcgV2Vha01hcDxDaGF0VHVybiwgSFRNTEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgdXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzY3JvbGxUb0JvdHRvbUVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBCcmFpblBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQlJBSU5fVklFV19UWVBFO1xuICB9XG5cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJCcmFpblwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImJyYWluXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcImJyYWluLXNpZGViYXJcIik7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBoZWFkZXJUb3AgPSBoZWFkZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4taGVhZGVyLXRvcFwiIH0pO1xuICAgIGhlYWRlclRvcC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCcmFpblwiIH0pO1xuICAgIHRoaXMubW9kZWxSb3dFbCA9IGhlYWRlclRvcC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1tb2RlbC1yb3dcIiB9KTtcbiAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICB2b2lkIHRoaXMucmVmcmVzaE1vZGVsT3B0aW9ucygpO1xuICAgIGhlYWRlci5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJBc2sgeW91ciB2YXVsdCwgb3IgdGVsbCBCcmFpbiB3aGF0IHRvIGZpbGUuXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBoZWFkZXJBY3Rpb25zID0gaGVhZGVyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWhlYWRlci1hY3Rpb25zXCIgfSk7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsID0gaGVhZGVyQWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1naG9zdCBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IFwiQ2xlYXIgY29udmVyc2F0aW9uXCIsIHRpdGxlOiBcIkNsZWFyIGNvbnZlcnNhdGlvblwiIH0sXG4gICAgfSk7XG4gICAgc2V0SWNvbih0aGlzLmNsZWFyQnV0dG9uRWwsIFwidHJhc2gtMlwiKTtcbiAgICB0aGlzLmNsZWFyQnV0dG9uRWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJDbGVhclwiIH0pO1xuICAgIHRoaXMuY2xlYXJCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmNsZWFyQ29udmVyc2F0aW9uKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpbnN0cnVjdGlvbnNMaW5rID0gaGVhZGVyQWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1naG9zdCBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICAgIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IFwiT3BlbiBpbnN0cnVjdGlvbnMgZmlsZVwiLCB0aXRsZTogXCJPcGVuIGluc3RydWN0aW9ucyBmaWxlXCIgfSxcbiAgICB9KTtcbiAgICBzZXRJY29uKGluc3RydWN0aW9uc0xpbmssIFwiYm9vay1vcGVuXCIpO1xuICAgIGluc3RydWN0aW9uc0xpbmsuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJJbnN0cnVjdGlvbnNcIiB9KTtcbiAgICBpbnN0cnVjdGlvbnNMaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5JbnN0cnVjdGlvbnNGaWxlKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzZXR0aW5nc0xpbmsgPSBoZWFkZXJBY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLWdob3N0IGJyYWluLWJ1dHRvbi1zbWFsbFwiLFxuICAgICAgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJPcGVuIEJyYWluIHNldHRpbmdzXCIsIHRpdGxlOiBcIk9wZW4gQnJhaW4gc2V0dGluZ3NcIiB9LFxuICAgIH0pO1xuICAgIHNldEljb24oc2V0dGluZ3NMaW5rLCBcInNldHRpbmdzXCIpO1xuICAgIHNldHRpbmdzTGluay5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIlNldHRpbmdzXCIgfSk7XG4gICAgc2V0dGluZ3NMaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kcyA9ICh0aGlzLmFwcCBhcyB1bmtub3duIGFzIHsgY29tbWFuZHM/OiB7IGV4ZWN1dGVDb21tYW5kQnlJZD86IChpZDogc3RyaW5nKSA9PiB2b2lkIH0gfSlcbiAgICAgICAgLmNvbW1hbmRzO1xuICAgICAgY29tbWFuZHM/LmV4ZWN1dGVDb21tYW5kQnlJZD8uKFwiYXBwOm9wZW4tc2V0dGluZ3NcIik7XG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNzYWdlc0NvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW1lc3NhZ2VzLWNvbnRhaW5lclwiIH0pO1xuICAgIHRoaXMubWVzc2FnZXNFbCA9IG1lc3NhZ2VzQ29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LW1lc3NhZ2VzXCIsXG4gICAgICBhdHRyOiB7IFwiYXJpYS1saXZlXCI6IFwicG9saXRlXCIsIFwiYXJpYS1hdG9taWNcIjogXCJmYWxzZVwiIH0sXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlc0VsLmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgKCkgPT4ge1xuICAgICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9ICF0aGlzLmlzTmVhckJvdHRvbSgpO1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgIH0pO1xuICAgIGlmICh0aGlzLnR1cm5zLmxlbmd0aCA+IDApIHtcbiAgICAgIHZvaWQgdGhpcy5yZW5kZXJNZXNzYWdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlckVtcHR5U3RhdGUoKTtcbiAgICB9XG5cbiAgICB0aGlzLnNjcm9sbFRvQm90dG9tRWwgPSBtZXNzYWdlc0NvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tc2Nyb2xsLXRvLWJvdHRvbVwiLFxuICAgICAgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJTY3JvbGwgdG8gYm90dG9tXCIgfSxcbiAgICB9KTtcbiAgICBzZXRJY29uKHRoaXMuc2Nyb2xsVG9Cb3R0b21FbCwgXCJhcnJvdy1kb3duXCIpO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICAgICAgdGhpcy5tZXNzYWdlc0VsLnNjcm9sbFRvKHsgdG9wOiB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogXCJzbW9vdGhcIiB9KTtcbiAgICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgICB9KTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbFRvQm90dG9tQnV0dG9uKCk7XG5cbiAgICB0aGlzLmlucHV0RWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1jaGF0LWlucHV0XCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHBsYWNlaG9sZGVyOiBcIkFzayBhYm91dCB5b3VyIHZhdWx0LCBvciBwYXN0ZSByb3VnaCBub3RlcyBmb3IgQnJhaW4gdG8gZmlsZS4uLlwiLFxuICAgICAgICByb3dzOiBcIjRcIixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuc2VuZE1lc3NhZ2UoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXV0b1Jlc2l6ZUlucHV0KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoaW50ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4ta2V5Ym9hcmQtaGludFwiIH0pO1xuICAgIGhpbnQuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJQcmVzcyBcIiB9KTtcbiAgICBoaW50LmNyZWF0ZUVsKFwia2JkXCIsIHsgdGV4dDogXCJFbnRlclwiIH0pO1xuICAgIGhpbnQuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCIgdG8gc2VuZCBcdTAwQjcgXCIgfSk7XG4gICAgaGludC5jcmVhdGVFbChcImtiZFwiLCB7IHRleHQ6IFwiU2hpZnQrRW50ZXJcIiB9KTtcbiAgICBoaW50LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiIGZvciBhIG5ldyBsaW5lXCIgfSk7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYWN0aW9uc1wiIH0pO1xuICAgIHRoaXMuc2VuZEJ1dHRvbkVsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5IGJyYWluLWJ1dHRvbi1zZW5kXCIsXG4gICAgICB0ZXh0OiBcIlNlbmRcIixcbiAgICB9KTtcbiAgICB0aGlzLnNlbmRCdXR0b25FbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNlbmRNZXNzYWdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1idXR0b24gYnJhaW4tYnV0dG9uLXN0b3AgYnJhaW4tYnV0dG9uLWhpZGRlblwiLFxuICAgICAgdGV4dDogXCJTdG9wXCIsXG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuc3RvcEN1cnJlbnRSZXF1ZXN0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5zdG9wQnV0dG9uRWwuaGlkZGVuID0gdHJ1ZTtcblxuICAgIHRoaXMuc3RhdHVzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LXN0YXR1c1wiIH0pO1xuICAgIHRoaXMudXBkYXRlQ2xlYXJCdXR0b24oKTtcbiAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaFN0YXR1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgaWYgKHRoaXMucmVzaXplRnJhbWVJZCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yZXNpemVGcmFtZUlkKTtcbiAgICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hTdGF0dXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnN0YXR1c0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzRWwuZW1wdHkoKTtcbiAgICBsZXQgc3RhdHVzVGV4dCA9IFwiTm90IGNvbm5lY3RlZFwiO1xuICAgIGxldCBzdGF0dXNDbGFzczogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIgPSBcImVycm9yXCI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFpU3RhdHVzID0gYXdhaXQgZ2V0QUlDb25maWd1cmF0aW9uU3RhdHVzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgIGlmIChhaVN0YXR1cy5jb25maWd1cmVkKSB7XG4gICAgICAgIHN0YXR1c1RleHQgPSBhaVN0YXR1cy5tb2RlbCA/IGBNb2RlbDogJHthaVN0YXR1cy5tb2RlbH1gIDogXCJDb25uZWN0ZWQgKGFjY291bnQgZGVmYXVsdCBtb2RlbClcIjtcbiAgICAgICAgc3RhdHVzQ2xhc3MgPSBcIm9rXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0dXNUZXh0ID0gYWlTdGF0dXMubWVzc2FnZSB8fCBcIk5vdCBjb25uZWN0ZWRcIjtcbiAgICAgICAgc3RhdHVzQ2xhc3MgPSBcIndhcm5cIjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBzdGF0dXNUZXh0ID0gXCJDb3VsZCBub3QgY2hlY2sgQ29kZXggc3RhdHVzXCI7XG4gICAgICBzdGF0dXNDbGFzcyA9IFwiZXJyb3JcIjtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRpY2F0b3IgPSB0aGlzLnN0YXR1c0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICBjbHM6IGBicmFpbi1zdGF0dXMtaW5kaWNhdG9yIGJyYWluLXN0YXR1cy1pbmRpY2F0b3ItLSR7c3RhdHVzQ2xhc3N9YCxcbiAgICB9KTtcbiAgICBpbmRpY2F0b3Iuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICAgIHRoaXMuc3RhdHVzRWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogc3RhdHVzVGV4dCB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZE1lc3NhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtZXNzYWdlIHx8IHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgICB0aGlzLmF1dG9SZXNpemVJbnB1dCgpO1xuICAgIHRoaXMudXNlclNjcm9sbGVkVXAgPSBmYWxzZTtcbiAgICB0aGlzLmFkZFR1cm4oeyByb2xlOiBcInVzZXJcIiwgdGV4dDogbWVzc2FnZSB9KTtcbiAgICB0aGlzLnNldExvYWRpbmcodHJ1ZSwgXCJxdWVyeVwiKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIHRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSB0aGlzLmJ1aWxkQ2hhdEhpc3RvcnkoKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wbHVnaW4uY2hhdFdpdGhWYXVsdChtZXNzYWdlLCBoaXN0b3J5LCBjb250cm9sbGVyLnNpZ25hbCwgKHN0YWdlKSA9PiB7XG4gICAgICAgIHRoaXMubG9hZGluZ1N0YWdlID0gc3RhZ2U7XG4gICAgICAgIHRoaXMudXBkYXRlTG9hZGluZ1RleHQoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5yZW5kZXJSZXNwb25zZShyZXNwb25zZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChpc1N0b3BwZWRSZXF1ZXN0KGVycm9yKSkge1xuICAgICAgICBpZiAodGhpcy5jb250ZW50RWwuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICB0aGlzLmFkZFR1cm4oeyByb2xlOiBcImluZm9cIiwgdGV4dDogXCJDb2RleCByZXF1ZXN0IHN0b3BwZWQuXCIgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiQ291bGQgbm90IGNoYXQgd2l0aCB0aGUgdmF1bHRcIjtcbiAgICAgICAgc2hvd0Vycm9yKGVycm9yLCBcIkNvdWxkIG5vdCBjaGF0IHdpdGggdGhlIHZhdWx0XCIpO1xuICAgICAgICBpZiAodGhpcy5jb250ZW50RWwuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICB0aGlzLmFkZFR1cm4oeyByb2xlOiBcImVycm9yXCIsIHRleHQ6IG1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jdXJyZW50QWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZENoYXRIaXN0b3J5KCk6IENoYXRFeGNoYW5nZVtdIHtcbiAgICAvLyBFeGNsdWRlIHRoZSBsYXN0IHR1cm4sIHdoaWNoIGlzIHRoZSBjdXJyZW50IHVzZXIgbWVzc2FnZSBiZWluZyBzZW50LlxuICAgIGNvbnN0IG91dDogQ2hhdEV4Y2hhbmdlW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHR1cm4gb2YgdGhpcy50dXJucy5zbGljZSgwLCAtMSkpIHtcbiAgICAgIGlmICh0dXJuLnJvbGUgIT09IFwidXNlclwiICYmIHR1cm4ucm9sZSAhPT0gXCJicmFpblwiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCF0dXJuLnRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAodHVybi51cGRhdGVkUGF0aHM/Lmxlbmd0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG91dC5wdXNoKHsgcm9sZTogdHVybi5yb2xlLCB0ZXh0OiB0dXJuLnRleHQgfSk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBwcml2YXRlIHN0b3BDdXJyZW50UmVxdWVzdCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY3VycmVudEFib3J0Q29udHJvbGxlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnRBYm9ydENvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICB0aGlzLnN0b3BCdXR0b25FbC5kaXNhYmxlZCA9IHRydWU7XG4gICAgaWYgKHRoaXMubG9hZGluZ1N0YWdlRWwpIHtcbiAgICAgIHRoaXMubG9hZGluZ1N0YWdlRWwuc2V0VGV4dChcIlN0b3BwaW5nXHUyMDI2XCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5sb2FkaW5nVGV4dEVsKSB7XG4gICAgICB0aGlzLmxvYWRpbmdUZXh0RWwuc2V0VGV4dChcIlN0b3BwaW5nXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTW9kZWxTZWxlY3RvcigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGVsUm93RWwuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsU2VsZWN0RWwgPSBudWxsO1xuICAgIHRoaXMubW9kZWxDdXN0b21JbnB1dEVsID0gbnVsbDtcblxuICAgIGlmICh0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcpIHtcbiAgICAgIHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tbW9kZWwtYWN0aXZlXCIsXG4gICAgICAgIHRleHQ6IFwiTG9hZGluZyBDb2RleCBtb2RlbHMuLi5cIixcbiAgICAgIH0pO1xuICAgICAgdGhpcy51cGRhdGVNb2RlbENvbnRyb2xzRGlzYWJsZWRTdGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3QgPSB0aGlzLm1vZGVsUm93RWwuY3JlYXRlRWwoXCJzZWxlY3RcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGVsLXNlbGVjdFwiLFxuICAgIH0pIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgIHRoaXMubW9kZWxTZWxlY3RFbCA9IHNlbGVjdDtcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm1vZGVsT3B0aW9ucykge1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHtcbiAgICAgICAgdmFsdWU6IG9wdGlvbi52YWx1ZSxcbiAgICAgICAgdGV4dDogb3B0aW9uLmxhYmVsLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB2YWx1ZTogQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFLFxuICAgICAgdGV4dDogXCJDdXN0b20uLi5cIixcbiAgICB9KTtcbiAgICBjb25zdCBkZXNpcmVkVmFsdWUgPSB0aGlzLmN1c3RvbU1vZGVsRHJhZnRcbiAgICAgID8gQ1VTVE9NX0NPREVYX01PREVMX1ZBTFVFXG4gICAgICA6IGdldENvZGV4TW9kZWxEcm9wZG93blZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKTtcbiAgICBpZiAodGhpcy5tb2RlbFNlbGVjdEVsLnZhbHVlICE9PSBkZXNpcmVkVmFsdWUpIHtcbiAgICAgIHRoaXMubW9kZWxTZWxlY3RFbC52YWx1ZSA9IGRlc2lyZWRWYWx1ZTtcbiAgICB9XG4gICAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLmhhbmRsZU1vZGVsU2VsZWN0aW9uKHNlbGVjdC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoc2VsZWN0LnZhbHVlID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUpIHtcbiAgICAgIGlmICh0aGlzLmN1c3RvbU1vZGVsRHJhZnQgJiYgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCkpIHtcbiAgICAgICAgdGhpcy5tb2RlbFJvd0VsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWFjdGl2ZVwiLFxuICAgICAgICAgIHRleHQ6IGBBY3RpdmU6ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbC50cmltKCl9YCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBpbnB1dCA9IHRoaXMubW9kZWxSb3dFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLW1vZGVsLWN1c3RvbVwiLFxuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgICAgcGxhY2Vob2xkZXI6IFwiQ29kZXggbW9kZWwgaWRcIixcbiAgICAgICAgfSxcbiAgICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICB0aGlzLm1vZGVsQ3VzdG9tSW5wdXRFbCA9IGlucHV0O1xuICAgICAgY29uc3QgaW5pdGlhbEN1c3RvbVZhbHVlID1cbiAgICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0IHx8IGlzS25vd25Db2RleE1vZGVsKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvZGV4TW9kZWwsIHRoaXMubW9kZWxPcHRpb25zKVxuICAgICAgICAgID8gXCJcIlxuICAgICAgICAgIDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbDtcbiAgICAgIGlmIChpbnB1dC52YWx1ZSAhPT0gaW5pdGlhbEN1c3RvbVZhbHVlKSB7XG4gICAgICAgIGlucHV0LnZhbHVlID0gaW5pdGlhbEN1c3RvbVZhbHVlO1xuICAgICAgfVxuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUN1c3RvbU1vZGVsKGlucHV0LnZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVNb2RlbENvbnRyb2xzRGlzYWJsZWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVNb2RlbENvbnRyb2xzRGlzYWJsZWRTdGF0ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBkaXNhYmxlZCA9IHRoaXMuaXNMb2FkaW5nIHx8IHRoaXMubW9kZWxPcHRpb25zTG9hZGluZztcbiAgICBpZiAodGhpcy5tb2RlbFNlbGVjdEVsKSB7XG4gICAgICB0aGlzLm1vZGVsU2VsZWN0RWwuZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICB9XG4gICAgaWYgKHRoaXMubW9kZWxDdXN0b21JbnB1dEVsKSB7XG4gICAgICB0aGlzLm1vZGVsQ3VzdG9tSW5wdXRFbC5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaE1vZGVsT3B0aW9ucygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLm1vZGVsT3B0aW9uc0xvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1vZGVsT3B0aW9ucyA9IGF3YWl0IGdldFN1cHBvcnRlZENvZGV4TW9kZWxPcHRpb25zKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubW9kZWxPcHRpb25zTG9hZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVNb2RlbFNlbGVjdGlvbih2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHZhbHVlID09PSBDVVNUT01fQ09ERVhfTU9ERUxfVkFMVUUpIHtcbiAgICAgIHRoaXMuY3VzdG9tTW9kZWxEcmFmdCA9IHRydWU7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IHZhbHVlO1xuICAgIC8vIHNhdmVTZXR0aW5ncyBhbHJlYWR5IHJlZnJlc2hlcyB0aGlzIHZpZXcncyBzdGF0dXMuXG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5yZW5kZXJNb2RlbFNlbGVjdG9yKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVDdXN0b21Nb2RlbCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbW9kZWwgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlck1vZGVsU2VsZWN0b3IoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXN0b21Nb2RlbERyYWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29kZXhNb2RlbCA9IG1vZGVsO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucmVuZGVyTW9kZWxTZWxlY3RvcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJSZXNwb25zZShyZXNwb25zZTogVmF1bHRDaGF0UmVzcG9uc2UpOiB2b2lkIHtcbiAgICBjb25zdCBwbGFuID0gcmVzcG9uc2UucGxhbiAmJiByZXNwb25zZS5wbGFuLm9wZXJhdGlvbnMubGVuZ3RoID4gMFxuICAgICAgPyByZXNwb25zZS5wbGFuXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0dXJuID0gdGhpcy5hZGRUdXJuKHtcbiAgICAgIHJvbGU6IFwiYnJhaW5cIixcbiAgICAgIHRleHQ6IHJlc3BvbnNlLmFuc3dlci50cmltKCksXG4gICAgICBzb3VyY2VzOiByZXNwb25zZS5zb3VyY2VzLFxuICAgICAgcGxhbixcbiAgICB9KTtcblxuICAgIGlmIChwbGFuKSB7XG4gICAgICB0aGlzLm9wZW5QbGFuTW9kYWwodHVybik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSB3cml0ZSByZXZpZXcgZm9yIGEgdHVybi4gVGhlIHBsYW4gc3RheXMgb24gdGhlIHR1cm4gdW50aWwgaXQgaXNcbiAgICogYXBwbGllZCwgc28gY2FuY2VsbGluZyB0aGUgbW9kYWwgdG8gZ28gY2hlY2sgc29tZXRoaW5nIGRvZXMgbm90IHRocm93IHRoZVxuICAgKiBwcm9wb3NhbCBhd2F5IFx1MjAxNCB0aGUgbWVzc2FnZSBrZWVwcyBhIGJ1dHRvbiB0byByZW9wZW4gaXQuXG4gICAqL1xuICBwcml2YXRlIG9wZW5QbGFuTW9kYWwodHVybjogQ2hhdFR1cm4pOiB2b2lkIHtcbiAgICBjb25zdCBwbGFuID0gdHVybi5wbGFuO1xuICAgIGlmICghcGxhbiB8fCBwbGFuLm9wZXJhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5ldyBWYXVsdFBsYW5Nb2RhbCh0aGlzLmFwcCwge1xuICAgICAgcGxhbixcbiAgICAgIHNldHRpbmdzOiB0aGlzLnBsdWdpbi5zZXR0aW5ncyxcbiAgICAgIG9uQXBwcm92ZTogYXN5bmMgKGFwcHJvdmVkKSA9PiB0aGlzLnBsdWdpbi5hcHBseVZhdWx0V3JpdGVQbGFuKGFwcHJvdmVkKSxcbiAgICAgIG9uQ29tcGxldGU6IGFzeW5jIChtZXNzYWdlLCBwYXRocykgPT4ge1xuICAgICAgICAvLyBUaGUgcGxhbiBoYXMgYmVlbiBhcHBsaWVkLCBzbyByZXRpcmUgdGhlIHJlb3BlbiBhZmZvcmRhbmNlIHJhdGhlclxuICAgICAgICAvLyB0aGFuIHJlLXJlbmRlcmluZyB0aGUgd2hvbGUgY29udmVyc2F0aW9uLlxuICAgICAgICB0dXJuLnBsYW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMudHVybkVsZW1lbnRzLmdldCh0dXJuKT8ucXVlcnlTZWxlY3RvcihcIi5icmFpbi1wbGFuLWFjdGlvblwiKT8ucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuYWRkVHVybih7IHJvbGU6IFwiYnJhaW5cIiwgdGV4dDogbWVzc2FnZSwgdXBkYXRlZFBhdGhzOiBwYXRocyB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoU3RhdHVzKCk7XG4gICAgICB9LFxuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0TG9hZGluZyhsb2FkaW5nOiBib29sZWFuLCBzdGFnZTogXCJxdWVyeVwiIHwgXCJhaVwiID0gXCJxdWVyeVwiKTogdm9pZCB7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSBsb2FkaW5nO1xuICAgIHRoaXMubG9hZGluZ1N0YWdlID0gc3RhZ2U7XG4gICAgaWYgKGxvYWRpbmcpIHtcbiAgICAgIHRoaXMubG9hZGluZ1N0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgICB0aGlzLnN0YXJ0TG9hZGluZ1RpbWVyKCk7XG4gICAgICB0aGlzLmFwcGVuZExvYWRpbmdJbmRpY2F0b3IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdG9wTG9hZGluZ1RpbWVyKCk7XG4gICAgICB0aGlzLnJlbW92ZUxvYWRpbmdJbmRpY2F0b3IoKTtcbiAgICB9XG4gICAgdGhpcy5pbnB1dEVsLmRpc2FibGVkID0gbG9hZGluZztcbiAgICB0aGlzLnNlbmRCdXR0b25FbC5oaWRkZW4gPSBsb2FkaW5nO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmhpZGRlbiA9ICFsb2FkaW5nO1xuICAgIHRoaXMuc3RvcEJ1dHRvbkVsLmRpc2FibGVkID0gZmFsc2U7XG4gICAgdGhpcy51cGRhdGVNb2RlbENvbnRyb2xzRGlzYWJsZWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhdXRvUmVzaXplSW5wdXQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVzaXplRnJhbWVJZCAhPT0gbnVsbCkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yZXNpemVGcmFtZUlkKTtcbiAgICB9XG4gICAgdGhpcy5yZXNpemVGcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMucmVzaXplRnJhbWVJZCA9IG51bGw7XG4gICAgICB0aGlzLmlucHV0RWwuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCI7XG4gICAgICB0aGlzLmlucHV0RWwuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5taW4odGhpcy5pbnB1dEVsLnNjcm9sbEhlaWdodCwgMjQwKX1weGA7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZFR1cm4odHVybjogQ2hhdFR1cm4pOiBDaGF0VHVybiB7XG4gICAgdGhpcy50dXJucy5wdXNoKHR1cm4pO1xuICAgIHZvaWQgdGhpcy5hcHBlbmRUdXJuRWxlbWVudCh0dXJuKTtcbiAgICB0aGlzLnVwZGF0ZUNsZWFyQnV0dG9uKCk7XG4gICAgcmV0dXJuIHR1cm47XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNsZWFyQ29udmVyc2F0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgbmV3IE5vdGljZShcIlN0b3AgdGhlIGN1cnJlbnQgcmVxdWVzdCBiZWZvcmUgY2xlYXJpbmcgdGhlIGNvbnZlcnNhdGlvbi5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnR1cm5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnR1cm5zID0gW107XG4gICAgdGhpcy51c2VyU2Nyb2xsZWRVcCA9IGZhbHNlO1xuICAgIHRoaXMubWVzc2FnZXNFbC5lbXB0eSgpO1xuICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgICB0aGlzLnVwZGF0ZUNsZWFyQnV0dG9uKCk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUNsZWFyQnV0dG9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jbGVhckJ1dHRvbkVsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRpc2FibGVkID0gdGhpcy50dXJucy5sZW5ndGggPT09IDA7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgdGhpcy5jbGVhckJ1dHRvbkVsLnRvZ2dsZUNsYXNzKFwiYnJhaW4tYnV0dG9uLWhpZGRlblwiLCBkaXNhYmxlZCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGVuZFR1cm5FbGVtZW50KHR1cm46IENoYXRUdXJuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW1wdHlFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtZW1wdHlcIik7XG4gICAgaWYgKGVtcHR5RWwpIHtcbiAgICAgIGVtcHR5RWwucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5yZW5kZXJUdXJuKHR1cm4pO1xuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgLyoqIFNpbmdsZSBkZWZpbml0aW9uIG9mIGEgdHVybidzIERPTSwgc2hhcmVkIGJ5IGFwcGVuZHMgYW5kIGZ1bGwgcmUtcmVuZGVycy4gKi9cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJUdXJuKHR1cm46IENoYXRUdXJuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IGBicmFpbi1jaGF0LW1lc3NhZ2UgYnJhaW4tY2hhdC1tZXNzYWdlLSR7dHVybi5yb2xlfWAsXG4gICAgfSk7XG4gICAgdGhpcy50dXJuRWxlbWVudHMuc2V0KHR1cm4sIGl0ZW0pO1xuICAgIGNvbnN0IHJvbGVFbCA9IGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tY2hhdC1yb2xlXCIgfSk7XG4gICAgY29uc3Qgcm9sZUljb24gPSByb2xlRWwuY3JlYXRlRWwoXCJzcGFuXCIpO1xuICAgIHNldEljb24ocm9sZUljb24sIHRoaXMudHVybkljb25Gb3IodHVybi5yb2xlKSk7XG4gICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IHRoaXMudHVybkxhYmVsRm9yKHR1cm4ucm9sZSkgfSk7XG5cbiAgICBjb25zdCBvdXRwdXQgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLW91dHB1dFwiIH0pO1xuICAgIGlmICh0dXJuLnJvbGUgIT09IFwiYnJhaW5cIikge1xuICAgICAgb3V0cHV0LnNldFRleHQodHVybi50ZXh0KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIHR1cm4udGV4dCwgb3V0cHV0LCBcIlwiLCB0aGlzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIG91dHB1dC5zZXRUZXh0KHR1cm4udGV4dCk7XG4gICAgfVxuICAgIC8vIE9ubHkgYmFpbCBpZiB0aGlzIGVsZW1lbnQgd2FzIGRldGFjaGVkIHdoaWxlIG1hcmtkb3duIHdhcyByZW5kZXJpbmdcbiAgICAvLyAoYSBmdWxsIHJlLXJlbmRlciBvciBhIGNsZWFyZWQgY29udmVyc2F0aW9uKS4gQSBsYXRlciBhcHBlbmQgbXVzdCBub3RcbiAgICAvLyByZW1vdmUgYW4gZWFybGllciwgc3RpbGwtYXR0YWNoZWQgbWVzc2FnZS5cbiAgICBpZiAoaXRlbS5wYXJlbnRFbGVtZW50ICE9PSB0aGlzLm1lc3NhZ2VzRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5hZGRDb3B5QnV0dG9ucyhvdXRwdXQpO1xuXG4gICAgaWYgKHR1cm4uc291cmNlcz8ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbmRlclNvdXJjZXMoaXRlbSwgdHVybi5zb3VyY2VzKTtcbiAgICB9XG4gICAgaWYgKHR1cm4ucGxhbj8ub3BlcmF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyUGxhbkFjdGlvbihpdGVtLCB0dXJuKTtcbiAgICB9XG4gICAgaWYgKHR1cm4udXBkYXRlZFBhdGhzPy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyVXBkYXRlZEZpbGVzKGl0ZW0sIHR1cm4udXBkYXRlZFBhdGhzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclBsYW5BY3Rpb24oY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdHVybjogQ2hhdFR1cm4pOiB2b2lkIHtcbiAgICBjb25zdCBjb3VudCA9IHR1cm4ucGxhbj8ub3BlcmF0aW9ucy5sZW5ndGggPz8gMDtcbiAgICBjb25zdCByb3cgPSBjb250YWluZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tcGxhbi1hY3Rpb25cIiB9KTtcbiAgICBjb25zdCBidXR0b24gPSByb3cuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvbiBicmFpbi1idXR0b24tcHJpbWFyeSBicmFpbi1idXR0b24tc21hbGxcIixcbiAgICB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgXCJmaWxlLXBlblwiKTtcbiAgICBidXR0b24uY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIHRleHQ6IGBSZXZpZXcgJHtjb3VudH0gcHJvcG9zZWQgY2hhbmdlJHtjb3VudCA9PT0gMSA/IFwiXCIgOiBcInNcIn1gLFxuICAgIH0pO1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5vcGVuUGxhbk1vZGFsKHR1cm4pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB0dXJuTGFiZWxGb3Iocm9sZTogQ2hhdFR1cm5bXCJyb2xlXCJdKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHJvbGUpIHtcbiAgICAgIGNhc2UgXCJ1c2VyXCI6XG4gICAgICAgIHJldHVybiBcIllvdVwiO1xuICAgICAgY2FzZSBcImJyYWluXCI6XG4gICAgICAgIHJldHVybiBcIkJyYWluXCI7XG4gICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgcmV0dXJuIFwiRXJyb3JcIjtcbiAgICAgIGNhc2UgXCJpbmZvXCI6XG4gICAgICAgIHJldHVybiBcIkJyYWluXCI7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gXCJCcmFpblwiO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdHVybkljb25Gb3Iocm9sZTogQ2hhdFR1cm5bXCJyb2xlXCJdKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHJvbGUpIHtcbiAgICAgIGNhc2UgXCJ1c2VyXCI6XG4gICAgICAgIHJldHVybiBcInVzZXJcIjtcbiAgICAgIGNhc2UgXCJicmFpblwiOlxuICAgICAgICByZXR1cm4gXCJicmFpbi1jaXJjdWl0XCI7XG4gICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgcmV0dXJuIFwiYWxlcnQtdHJpYW5nbGVcIjtcbiAgICAgIGNhc2UgXCJpbmZvXCI6XG4gICAgICAgIHJldHVybiBcImluZm9cIjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcImJyYWluLWNpcmN1aXRcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZExvYWRpbmdJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm1lc3NhZ2VzRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLWNoYXQtbWVzc2FnZSBicmFpbi1jaGF0LW1lc3NhZ2UtYnJhaW4gYnJhaW4tY2hhdC1tZXNzYWdlLWxvYWRpbmdcIixcbiAgICB9KTtcbiAgICBjb25zdCByb2xlRWwgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtcm9sZVwiIH0pO1xuICAgIGNvbnN0IHJvbGVJY29uID0gcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBzZXRJY29uKHJvbGVJY29uLCBcImJyYWluLWNpcmN1aXRcIik7XG4gICAgcm9sZUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiQnJhaW5cIiB9KTtcblxuICAgIGNvbnN0IGxvYWRpbmcgPSBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWxvYWRpbmdcIiB9KTtcbiAgICBjb25zdCBkb3RzID0gbG9hZGluZy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nLWRvdHNcIiB9KTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBkb3RzLmNyZWF0ZUVsKFwic3BhblwiKTtcbiAgICBjb25zdCBtZXRhID0gbG9hZGluZy5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1sb2FkaW5nLW1ldGFcIiB9KTtcbiAgICB0aGlzLmxvYWRpbmdTdGFnZUVsID0gbWV0YS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWxvYWRpbmctc3RhZ2VcIixcbiAgICAgIHRleHQ6IFwiU2VhcmNoaW5nIHZhdWx0XHUyMDI2XCIsXG4gICAgfSk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbWV0YS5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWxvYWRpbmctdGltZVwiLFxuICAgICAgdGV4dDogXCIwc1wiLFxuICAgIH0pO1xuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVMb2FkaW5nSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGNvbnN0IGxvYWRpbmdFbCA9IHRoaXMubWVzc2FnZXNFbC5xdWVyeVNlbGVjdG9yKFwiLmJyYWluLWNoYXQtbWVzc2FnZS1sb2FkaW5nXCIpO1xuICAgIGlmIChsb2FkaW5nRWwpIHtcbiAgICAgIGxvYWRpbmdFbC5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5sb2FkaW5nVGV4dEVsID0gbnVsbDtcbiAgICB0aGlzLmxvYWRpbmdTdGFnZUVsID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWVzc2FnZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9ICsrdGhpcy5yZW5kZXJHZW5lcmF0aW9uO1xuICAgIHRoaXMubWVzc2FnZXNFbC5lbXB0eSgpO1xuICAgIGlmICghdGhpcy50dXJucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHR1cm4gb2YgdGhpcy50dXJucykge1xuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMucmVuZGVyR2VuZXJhdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhd2FpdCB0aGlzLnJlbmRlclR1cm4odHVybik7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgdGhpcy5hcHBlbmRMb2FkaW5nSW5kaWNhdG9yKCk7XG4gICAgfVxuICAgIHRoaXMubWF5YmVTY3JvbGxUb0JvdHRvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGFydExvYWRpbmdUaW1lcigpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3BMb2FkaW5nVGltZXIoKTtcbiAgICB0aGlzLmxvYWRpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZUxvYWRpbmdUZXh0KCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BMb2FkaW5nVGltZXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9hZGluZ1RpbWVyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmxvYWRpbmdUaW1lcik7XG4gICAgICB0aGlzLmxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVMb2FkaW5nVGV4dCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWNvbmRzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMubG9hZGluZ1N0YXJ0ZWRBdCkgLyAxMDAwKSk7XG4gICAgY29uc3Qgc3RhZ2VMYWJlbCA9IHRoaXMubG9hZGluZ1N0YWdlID09PSBcInF1ZXJ5XCIgPyBcIlNlYXJjaGluZyB2YXVsdFwiIDogXCJBc2tpbmcgQ29kZXhcIjtcbiAgICBpZiAodGhpcy5sb2FkaW5nVGV4dEVsKSB7XG4gICAgICB0aGlzLmxvYWRpbmdUZXh0RWwuc2V0VGV4dChgJHtzdGFnZUxhYmVsfSBcdTAwQjcgJHtzZWNvbmRzfXNgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMubG9hZGluZ1N0YWdlRWwpIHtcbiAgICAgIHRoaXMubG9hZGluZ1N0YWdlRWwuc2V0VGV4dCh0aGlzLmxvYWRpbmdTdGFnZSA9PT0gXCJxdWVyeVwiID8gXCJTZWFyY2hpbmcgdmF1bHRcdTIwMjZcIiA6IFwiQXNraW5nIENvZGV4XHUyMDI2XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBlbXB0eSA9IHRoaXMubWVzc2FnZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1jaGF0LWVtcHR5XCIgfSk7XG4gICAgY29uc3QgaWNvbiA9IGVtcHR5LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLWNoYXQtZW1wdHktaWNvblwiIH0pO1xuICAgIHNldEljb24oaWNvbiwgXCJicmFpbi1jaXJjdWl0XCIpO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJTdGFydCB3aXRoIGEgcXVlc3Rpb24gb3Igcm91Z2ggY2FwdHVyZVwiIH0pO1xuICAgIGVtcHR5LmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICB0ZXh0OiBcIkJyYWluIHJldHJpZXZlcyB2YXVsdCBjb250ZXh0LCBhbnN3ZXJzIHdpdGggc291cmNlcywgYW5kIHByZXZpZXdzIHdyaXRlcyBiZWZvcmUgYW55dGhpbmcgY2hhbmdlcy5cIixcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU291cmNlcyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBzb3VyY2VzOiBWYXVsdFF1ZXJ5TWF0Y2hbXSk6IHZvaWQge1xuICAgIC8vIEV2ZXJ5IHNvdXJjZSBoZXJlIHdhcyBpbmNsdWRlZCBpbiB0aGUgcHJvbXB0LCBzbyB0aGUgY291bnQgaXMgYW4gaG9uZXN0XG4gICAgLy8gZGVzY3JpcHRpb24gb2Ygd2hhdCBiYWNrZWQgdGhlIGFuc3dlci5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7IGNsczogXCJicmFpbi1zb3VyY2VzXCIgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogYFNvdXJjZXMgKCR7c291cmNlcy5sZW5ndGh9KWAsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgICAgY29uc3Qgc291cmNlRWwgPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcImJyYWluLXNvdXJjZVwiIH0pO1xuICAgICAgY29uc3QgdGl0bGUgPSBzb3VyY2VFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtdGl0bGVcIixcbiAgICAgICAgdGV4dDogc291cmNlLnBhdGgsXG4gICAgICB9KTtcbiAgICAgIHRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5vcGVuU291cmNlKHNvdXJjZS5wYXRoKTtcbiAgICAgIH0pO1xuICAgICAgc291cmNlRWwuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXJlYXNvblwiLFxuICAgICAgICB0ZXh0OiBzb3VyY2UucmVhc29uLFxuICAgICAgfSk7XG4gICAgICBpZiAoc291cmNlLmV4Y2VycHQpIHtcbiAgICAgICAgc291cmNlRWwuY3JlYXRlRWwoXCJwcmVcIiwge1xuICAgICAgICAgIGNsczogXCJicmFpbi1zb3VyY2UtZXhjZXJwdFwiLFxuICAgICAgICAgIHRleHQ6IHNvdXJjZS5leGNlcnB0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclVwZGF0ZWRGaWxlcyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBwYXRoczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlcyA9IGNvbnRhaW5lci5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi11cGRhdGVkLWZpbGVzXCIgfSk7XG4gICAgZmlsZXMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcImJyYWluLXNvdXJjZS1yZWFzb25cIixcbiAgICAgIHRleHQ6IFwiVXBkYXRlZCBmaWxlc1wiLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuICAgICAgY29uc3QgYnV0dG9uID0gZmlsZXMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiYnJhaW4tc291cmNlLXRpdGxlXCIsXG4gICAgICAgIHRleHQ6IHBhdGgsXG4gICAgICB9KTtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMub3BlblNvdXJjZShwYXRoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNOZWFyQm90dG9tKHRocmVzaG9sZCA9IDYwKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZWwgPSB0aGlzLm1lc3NhZ2VzRWw7XG4gICAgcmV0dXJuIGVsLnNjcm9sbEhlaWdodCAtIGVsLnNjcm9sbFRvcCAtIGVsLmNsaWVudEhlaWdodCA8IHRocmVzaG9sZDtcbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTY3JvbGxUb0JvdHRvbSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy51c2VyU2Nyb2xsZWRVcCkge1xuICAgICAgdGhpcy51cGRhdGVTY3JvbGxUb0JvdHRvbUJ1dHRvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VzRWwuc2Nyb2xsVG8oeyB0b3A6IHRoaXMubWVzc2FnZXNFbC5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiBcInNtb290aFwiIH0pO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU2Nyb2xsVG9Cb3R0b21CdXR0b24oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbFRvQm90dG9tRWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2hvdyA9IHRoaXMudXNlclNjcm9sbGVkVXAgJiYgdGhpcy50dXJucy5sZW5ndGggPiAwO1xuICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b21FbC50b2dnbGVDbGFzcyhcImJyYWluLXNjcm9sbC10by1ib3R0b20tLXZpc2libGVcIiwgc2hvdyk7XG4gIH1cblxuICBwcml2YXRlIGFkZENvcHlCdXR0b25zKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBjb2RlQmxvY2tzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCJwcmVcIik7XG4gICAgZm9yIChjb25zdCBwcmUgb2YgQXJyYXkuZnJvbShjb2RlQmxvY2tzKSkge1xuICAgICAgY29uc3QgY29kZSA9IHByZS5xdWVyeVNlbGVjdG9yKFwiY29kZVwiKTtcbiAgICAgIGlmICghY29kZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBidXR0b24uY2xhc3NOYW1lID0gXCJicmFpbi1jb3B5LWNvZGUtYnV0dG9uXCI7XG4gICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIFwiQ29weSBjb2RlXCIpO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY29kZS50ZXh0Q29udGVudCB8fCBcIlwiKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcGllZCFcIjtcbiAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcImNvcGllZFwiKTtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiY29waWVkXCIpO1xuICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSBcIkNvcHlcIjtcbiAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHByZS5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3BlblNvdXJjZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNTdG9wcGVkUmVxdWVzdChlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBcIkNvZGV4IHJlcXVlc3Qgc3RvcHBlZC5cIjtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQnJhaW5QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc1wiO1xuaW1wb3J0IHR5cGUgeyBWYXVsdFdyaXRlT3BlcmF0aW9uLCBWYXVsdFdyaXRlUGxhbiB9IGZyb20gXCIuLi9zZXJ2aWNlcy92YXVsdC13cml0ZS1zZXJ2aWNlXCI7XG5pbXBvcnQgeyBpc1NhZmVNYXJrZG93blBhdGggfSBmcm9tIFwiLi4vdXRpbHMvcGF0aC1zYWZldHlcIjtcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvci1oYW5kbGVyXCI7XG5cbmludGVyZmFjZSBWYXVsdFBsYW5Nb2RhbE9wdGlvbnMge1xuICBwbGFuOiBWYXVsdFdyaXRlUGxhbjtcbiAgc2V0dGluZ3M6IEJyYWluUGx1Z2luU2V0dGluZ3M7XG4gIG9uQXBwcm92ZTogKHBsYW46IFZhdWx0V3JpdGVQbGFuKSA9PiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgb25Db21wbGV0ZTogKG1lc3NhZ2U6IHN0cmluZywgcGF0aHM6IHN0cmluZ1tdKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFZhdWx0UGxhbk1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzZWxlY3RlZE9wZXJhdGlvbnMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkcmFmdE9wZXJhdGlvbnM6IFZhdWx0V3JpdGVPcGVyYXRpb25bXTtcbiAgcHJpdmF0ZSBhcHByb3ZlQnV0dG9uRWwhOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBjYW5jZWxCdXR0b25FbCE6IEhUTUxCdXR0b25FbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogVmF1bHRQbGFuTW9kYWxPcHRpb25zLFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zID0gb3B0aW9ucy5wbGFuLm9wZXJhdGlvbnMubWFwKChvcGVyYXRpb24pID0+ICh7IC4uLm9wZXJhdGlvbiB9KSk7XG4gICAgdGhpcy5kcmFmdE9wZXJhdGlvbnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCkpO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN1cGVyLmNsb3NlKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiYnJhaW4tbW9kYWxcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUmV2aWV3IFZhdWx0IENoYW5nZXNcIiB9KTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogYCR7dGhpcy5vcHRpb25zLnBsYW4uc3VtbWFyeSB8fCBcIkJyYWluIHByb3Bvc2VkIHZhdWx0IGNoYW5nZXMuXCJ9IENvbmZpZGVuY2U6ICR7dGhpcy5vcHRpb25zLnBsYW4uY29uZmlkZW5jZX0uYCxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGxhbi5kcm9wcGVkT3BlcmF0aW9ucyA+IDApIHtcbiAgICAgIGNvbnN0IGRyb3BwZWQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICAgIGNsczogXCJicmFpbi1wbGFuLWRyb3BwZWRcIixcbiAgICAgIH0pO1xuICAgICAgZHJvcHBlZC5jcmVhdGVFbChcInN0cm9uZ1wiLCB7XG4gICAgICAgIHRleHQ6IGAke3RoaXMub3B0aW9ucy5wbGFuLmRyb3BwZWRPcGVyYXRpb25zfSBwcm9wb3NlZCBjaGFuZ2Uke3RoaXMub3B0aW9ucy5wbGFuLmRyb3BwZWRPcGVyYXRpb25zID09PSAxID8gXCIgd2FzXCIgOiBcInMgd2VyZVwifSBza2lwcGVkYCxcbiAgICAgIH0pO1xuICAgICAgZHJvcHBlZC5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICB0ZXh0OiBcIkJyYWluJ3MgcGxhbiBpbmNsdWRlZCBjaGFuZ2VzIHRoYXQgdGFyZ2V0ZWQgbm9uLW1hcmtkb3duIHBhdGhzLCB0aGUgaW5zdHJ1Y3Rpb25zIGZpbGUsIGRvdC1mb2xkZXJzLCBvciBwYXRocyB3aXRoIGAuLmAuIEVkaXQgdGhlIHJlbWFpbmluZyBvcGVyYXRpb25zIGJlbG93LCBvciBhc2sgQnJhaW4gdG8gcmV0cnkuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgb3BlcmF0aW9uXSBvZiB0aGlzLmRyYWZ0T3BlcmF0aW9ucy5lbnRyaWVzKCkpIHtcbiAgICAgIHRoaXMucmVuZGVyT3BlcmF0aW9uKGluZGV4LCBvcGVyYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGxhbi5xdWVzdGlvbnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBxdWVzdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLXF1ZXN0aW9uc1wiIH0pO1xuICAgICAgcXVlc3Rpb25zLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIk9wZW4gUXVlc3Rpb25zXCIgfSk7XG4gICAgICBjb25zdCBsaXN0ID0gcXVlc3Rpb25zLmNyZWF0ZUVsKFwidWxcIik7XG4gICAgICBmb3IgKGNvbnN0IHF1ZXN0aW9uIG9mIHRoaXMub3B0aW9ucy5wbGFuLnF1ZXN0aW9ucykge1xuICAgICAgICBsaXN0LmNyZWF0ZUVsKFwibGlcIiwgeyB0ZXh0OiBxdWVzdGlvbiB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwiYnJhaW4tYnV0dG9uLXJvd1wiIH0pO1xuICAgIHRoaXMuYXBwcm92ZUJ1dHRvbkVsID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiYnJhaW4tYnV0dG9uIGJyYWluLWJ1dHRvbi1wcmltYXJ5XCIsXG4gICAgICB0ZXh0OiBcIkFwcHJvdmUgYW5kIFdyaXRlXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5hcHByb3ZlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5jYW5jZWxCdXR0b25FbCA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImJyYWluLWJ1dHRvblwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KTtcbiAgICB0aGlzLmNhbmNlbEJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcHJvdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMud29ya2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvcGVyYXRpb25zID0gdGhpcy5kcmFmdE9wZXJhdGlvbnNcbiAgICAgIC5maWx0ZXIoKF8sIGluZGV4KSA9PiB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5oYXMoaW5kZXgpKVxuICAgICAgLm1hcCgob3BlcmF0aW9uKSA9PiAoe1xuICAgICAgICAuLi5vcGVyYXRpb24sXG4gICAgICAgIHBhdGg6IG9wZXJhdGlvbi5wYXRoLnRyaW0oKSxcbiAgICAgICAgY29udGVudDogb3BlcmF0aW9uLmNvbnRlbnQudHJpbSgpLFxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKChvcGVyYXRpb24pID0+IG9wZXJhdGlvbi5wYXRoICYmIG9wZXJhdGlvbi5jb250ZW50KTtcbiAgICBpZiAoIW9wZXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBjaGFuZ2UgdG8gYXBwbHlcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGludmFsaWRQYXRoID0gb3BlcmF0aW9ucy5maW5kKChvcGVyYXRpb24pID0+ICFpc1NhZmVNYXJrZG93blBhdGgob3BlcmF0aW9uLnBhdGgsIHRoaXMub3B0aW9ucy5zZXR0aW5ncykpO1xuICAgIGlmIChpbnZhbGlkUGF0aCkge1xuICAgICAgbmV3IE5vdGljZShgSW52YWxpZCB0YXJnZXQgcGF0aDogJHtpbnZhbGlkUGF0aC5wYXRofWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0QnV0dG9uc0VuYWJsZWQoZmFsc2UpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXRocyA9IGF3YWl0IHRoaXMub3B0aW9ucy5vbkFwcHJvdmUoe1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMucGxhbixcbiAgICAgICAgb3BlcmF0aW9ucyxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHBhdGhzLmxlbmd0aFxuICAgICAgICA/IGBVcGRhdGVkICR7cGF0aHMuam9pbihcIiwgXCIpfWBcbiAgICAgICAgOiBcIk5vIHZhdWx0IGNoYW5nZXMgd2VyZSBhcHBsaWVkXCI7XG4gICAgICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xuICAgICAgYXdhaXQgdGhpcy5vcHRpb25zLm9uQ29tcGxldGUobWVzc2FnZSwgcGF0aHMpO1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNob3dFcnJvcihlcnJvciwgXCJDb3VsZCBub3QgYXBwbHkgdmF1bHQgY2hhbmdlc1wiKTtcbiAgICAgIHRoaXMuc2V0QnV0dG9uc0VuYWJsZWQodHJ1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2V0QnV0dG9uc0VuYWJsZWQoZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmFwcHJvdmVCdXR0b25FbCkge1xuICAgICAgdGhpcy5hcHByb3ZlQnV0dG9uRWwuZGlzYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgIHRoaXMuYXBwcm92ZUJ1dHRvbkVsLnRleHRDb250ZW50ID0gZW5hYmxlZCA/IFwiQXBwcm92ZSBhbmQgV3JpdGVcIiA6IFwiV3JpdGluZy4uLlwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5jYW5jZWxCdXR0b25FbCkge1xuICAgICAgdGhpcy5jYW5jZWxCdXR0b25FbC5kaXNhYmxlZCA9ICFlbmFibGVkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT3BlcmF0aW9uKGluZGV4OiBudW1iZXIsIG9wZXJhdGlvbjogVmF1bHRXcml0ZU9wZXJhdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvblwiIH0pO1xuICAgIGNvbnN0IGhlYWRlciA9IGl0ZW0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJicmFpbi1wbGFuLW9wZXJhdGlvbi1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBjaGVja2JveCA9IGhlYWRlci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGF0dHI6IHsgdHlwZTogXCJjaGVja2JveFwiIH0sXG4gICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZE9wZXJhdGlvbnMuaGFzKGluZGV4KTtcbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPcGVyYXRpb25zLmFkZChpbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNlbGVjdGVkT3BlcmF0aW9ucy5kZWxldGUoaW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGhlYWRlckxhYmVsID0gaGVhZGVyLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGRlc2NyaWJlT3BlcmF0aW9uKG9wZXJhdGlvbikgfSk7XG5cbiAgICBpZiAob3BlcmF0aW9uLmRlc2NyaXB0aW9uKSB7XG4gICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgY2xzOiBcImJyYWluLXBsYW4tZGVzY3JpcHRpb25cIixcbiAgICAgICAgdGV4dDogb3BlcmF0aW9uLmRlc2NyaXB0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aElucHV0ID0gaXRlbS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIGNsczogXCJicmFpbi1tb2RhbC1pbnB1dCBicmFpbi1wbGFuLXBhdGgtaW5wdXRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIFwiYXJpYS1sYWJlbFwiOiBcIlRhcmdldCBtYXJrZG93biBwYXRoXCIsXG4gICAgICB9LFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgcGF0aElucHV0LnZhbHVlID0gb3BlcmF0aW9uLnBhdGg7XG4gICAgcGF0aElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkID0ge1xuICAgICAgICAuLi50aGlzLmRyYWZ0T3BlcmF0aW9uc1tpbmRleF0sXG4gICAgICAgIHBhdGg6IHBhdGhJbnB1dC52YWx1ZSxcbiAgICAgIH0gYXMgVmF1bHRXcml0ZU9wZXJhdGlvbjtcbiAgICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSA9IHVwZGF0ZWQ7XG4gICAgICAvLyBLZWVwIHRoZSBcIkFwcGVuZCB0byBYXCIgLyBcIkNyZWF0ZSBYXCIgbGFiZWwgaW4gc3RlcCB3aXRoIHRoZSBlZGl0ZWQgcGF0aC5cbiAgICAgIGhlYWRlckxhYmVsLnNldFRleHQoZGVzY3JpYmVPcGVyYXRpb24odXBkYXRlZCkpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dGFyZWEgPSBpdGVtLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImJyYWluLW1vZGFsLWlucHV0IGJyYWluLXBsYW4tZWRpdG9yXCIsXG4gICAgICBhdHRyOiB7IHJvd3M6IFwiMTBcIiB9LFxuICAgIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gb3BlcmF0aW9uLmNvbnRlbnQ7XG4gICAgdGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMuZHJhZnRPcGVyYXRpb25zW2luZGV4XSA9IHtcbiAgICAgICAgLi4udGhpcy5kcmFmdE9wZXJhdGlvbnNbaW5kZXhdLFxuICAgICAgICBjb250ZW50OiB0ZXh0YXJlYS52YWx1ZSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpYmVPcGVyYXRpb24ob3BlcmF0aW9uOiBWYXVsdFdyaXRlUGxhbltcIm9wZXJhdGlvbnNcIl1bbnVtYmVyXSk6IHN0cmluZyB7XG4gIGlmIChvcGVyYXRpb24udHlwZSA9PT0gXCJhcHBlbmRcIikge1xuICAgIHJldHVybiBgQXBwZW5kIHRvICR7b3BlcmF0aW9uLnBhdGh9YDtcbiAgfVxuICByZXR1cm4gYENyZWF0ZSAke29wZXJhdGlvbi5wYXRofWA7XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogQ2VudHJhbGl6ZWQgZXJyb3IgaGFuZGxpbmcgdXRpbGl0eVxuICogU3RhbmRhcmRpemVzIGVycm9yIHJlcG9ydGluZyBhY3Jvc3MgdGhlIHBsdWdpblxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZXJyb3I6IHVua25vd24sIGRlZmF1bHRNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlO1xuICBuZXcgTm90aWNlKG1lc3NhZ2UpO1xufVxuIiwgImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbnRlcmZhY2UgQnJhaW5Db21tYW5kSG9zdCB7XG4gIGFkZENvbW1hbmQ6IFBsdWdpbltcImFkZENvbW1hbmRcIl07XG4gIG9wZW5TaWRlYmFyKCk6IFByb21pc2U8dm9pZD47XG4gIG9wZW5JbnN0cnVjdGlvbnNGaWxlKCk6IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbW1hbmRzKHBsdWdpbjogQnJhaW5Db21tYW5kSG9zdCk6IHZvaWQge1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwib3Blbi12YXVsdC1jaGF0XCIsXG4gICAgbmFtZTogXCJCcmFpbjogT3BlbiBWYXVsdCBDaGF0XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuU2lkZWJhcigpO1xuICAgIH0sXG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJvcGVuLWluc3RydWN0aW9uc1wiLFxuICAgIG5hbWU6IFwiQnJhaW46IE9wZW4gSW5zdHJ1Y3Rpb25zXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHBsdWdpbi5vcGVuSW5zdHJ1Y3Rpb25zRmlsZSgpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXNDOzs7QUNRL0IsSUFBTSw0QkFBNEI7QUFDbEMsSUFBTSw0QkFBNEI7QUFFbEMsSUFBTSx5QkFBOEM7QUFBQSxFQUN6RCxhQUFhO0FBQUEsRUFDYixrQkFBa0I7QUFBQSxFQUNsQixZQUFZO0FBQUEsRUFDWixxQkFBcUI7QUFBQSxFQUNyQixnQkFBZ0I7QUFDbEI7QUFFTyxTQUFTLHVCQUNkLE9BQ3FCO0FBQ3JCLFFBQU0sU0FBOEI7QUFBQSxJQUNsQyxHQUFHO0FBQUEsSUFDSCxHQUFHO0FBQUEsRUFDTDtBQUVBLFNBQU87QUFBQSxJQUNMLGFBQWE7QUFBQSxNQUNYLE9BQU87QUFB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QUFDakUsVUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0IsVUFBVSxJQUFJO0FBQ3pELFVBQU0sS0FBSywrQkFBK0I7QUFDMUMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLHFCQUE4QztBQUM1QyxVQUFNLFNBQVMsS0FBSyxJQUFJLFVBQVUsZ0JBQWdCLGVBQWU7QUFDakUsZUFBVyxRQUFRLFFBQVE7QUFDekIsWUFBTSxPQUFPLEtBQUs7QUFDbEIsVUFBSSxnQkFBZ0Isa0JBQWtCO0FBQ3BDLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLHVCQUFzQztBQTlJOUM7QUErSUksWUFBTSxVQUFLLG1CQUFtQixNQUF4QixtQkFBMkI7QUFBQSxFQUNuQztBQUFBLEVBRUEsTUFBTSxpQ0FBZ0Q7QUFDcEQsUUFBSTtBQUNGLFlBQU0sS0FBSyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLE9BQU87QUFDZCxnQkFBVSxPQUFPLGtDQUFrQztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUVGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJtZXNzYWdlIl0KfQo=
