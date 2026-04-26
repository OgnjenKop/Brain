import { App, ItemView, MarkdownRenderer, TFile, WorkspaceLeaf } from "obsidian";
import BrainPlugin from "../../main";
import { VaultChatResponse } from "../services/vault-chat-service";
import type { VaultQueryMatch } from "../services/vault-query-service";
import { VaultPlanModal } from "./vault-plan-modal";
import { showError } from "../utils/error-handler";
import { getAIConfigurationStatus } from "../utils/ai-config";
import {
  CUSTOM_CODEX_MODEL_VALUE,
  DEFAULT_CODEX_MODEL_OPTIONS,
  CodexModelOption,
  getCodexModelDropdownValue,
  getSupportedCodexModelOptions,
  isKnownCodexModel,
} from "../utils/codex-models";

interface AppWithSettings extends App {
  setting?: {
    open(): void;
    openTabById(id: string): void;
  };
}

interface ChatTurn {
  role: "user" | "brain";
  text: string;
  sources?: VaultQueryMatch[];
  updatedPaths?: string[];
}

export const BRAIN_VIEW_TYPE = "brain-sidebar-view";

export class BrainSidebarView extends ItemView {
  private inputEl!: HTMLTextAreaElement;
  private messagesEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private modelRowEl!: HTMLElement;
  private sendButtonEl!: HTMLButtonElement;
  private stopButtonEl!: HTMLButtonElement;
  private clearButtonEl!: HTMLButtonElement;
  private modelOptions: CodexModelOption[] = DEFAULT_CODEX_MODEL_OPTIONS;
  private modelOptionsLoading = false;
  private customModelDraft = false;
  private isLoading = false;
  private currentAbortController: AbortController | null = null;
  private loadingStartedAt = 0;
  private loadingTimer: number | null = null;
  private loadingText = "";
  private renderGeneration = 0;
  private turns: ChatTurn[] = [];

  constructor(leaf: WorkspaceLeaf, private readonly plugin: BrainPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return BRAIN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Brain";
  }

  getIcon(): string {
    return "brain";
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass("brain-sidebar");

    const header = this.contentEl.createEl("div", { cls: "brain-header" });
    header.createEl("h2", { text: "Brain" });
    header.createEl("p", {
      text: "Ask your vault, or tell Brain what to file.",
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
        rows: "6",
      },
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
      text: "Send",
    });
    this.sendButtonEl.addEventListener("click", () => {
      void this.sendMessage();
    });
    this.stopButtonEl = buttons.createEl("button", {
      cls: "brain-button brain-button-stop",
      text: "Stop",
    });
    this.stopButtonEl.addEventListener("click", () => {
      this.stopCurrentRequest();
    });
    this.stopButtonEl.disabled = true;
    buttons.createEl("button", {
      cls: "brain-button",
      text: "Instructions",
    }).addEventListener("click", () => {
      void this.plugin.openInstructionsFile();
    });
    this.clearButtonEl = buttons.createEl("button", {
      cls: "brain-button",
      text: "Clear",
    });
    this.clearButtonEl.addEventListener("click", () => {
      this.turns = [];
      void this.renderMessages();
    });

    this.statusEl = this.contentEl.createEl("div", { cls: "brain-chat-status" });
    this.updateComposerState();
    await this.refreshStatus();
  }

  onClose(): Promise<void> {
    this.currentAbortController?.abort();
    this.stopLoadingTimer();
    return Promise.resolve();
  }

  async refreshStatus(): Promise<void> {
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
      text: buttonText,
    }).addEventListener("click", () => {
      const app = this.app as AppWithSettings;
      if (!app.setting) {
        return;
      }
      app.setting.open();
      app.setting.openTabById(this.plugin.manifest.id);
    });
  }

  private async sendMessage(): Promise<void> {
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

  private stopCurrentRequest(): void {
    this.currentAbortController?.abort();
  }

  private createPromptChip(container: HTMLElement, label: string, prompt: string): void {
    container.createEl("button", {
      cls: "brain-prompt-chip",
      text: label,
    }).addEventListener("click", () => {
      this.inputEl.value = prompt;
      this.updateComposerState();
      this.inputEl.focus();
    });
  }

  private renderModelSelector(): void {
    this.modelRowEl.empty();
    this.modelRowEl.createEl("span", {
      cls: "brain-model-label",
      text: "Model",
    });
    if (this.modelOptionsLoading) {
      this.modelRowEl.createEl("span", {
        cls: "brain-model-active",
        text: "Loading Codex models...",
      });
    }
    const select = this.modelRowEl.createEl("select", {
      cls: "brain-model-select",
    });
    select.disabled = this.isLoading;
    for (const option of this.modelOptions) {
      select.createEl("option", {
        value: option.value,
        text: option.label,
      });
    }
    select.createEl("option", {
      value: CUSTOM_CODEX_MODEL_VALUE,
      text: "Custom...",
    });
    select.value = this.customModelDraft
      ? CUSTOM_CODEX_MODEL_VALUE
      : getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions);
    select.addEventListener("change", () => {
      void this.handleModelSelection(select.value);
    });

    if (select.value === CUSTOM_CODEX_MODEL_VALUE) {
      if (this.customModelDraft && this.plugin.settings.codexModel.trim()) {
        this.modelRowEl.createEl("span", {
          cls: "brain-model-active",
          text: `Active: ${this.plugin.settings.codexModel.trim()}`,
        });
      }
      const input = this.modelRowEl.createEl("input", {
        cls: "brain-model-custom",
        attr: {
          type: "text",
          placeholder: "Codex model id",
        },
      }) as HTMLInputElement;
      input.disabled = this.isLoading;
      input.value = this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions)
        ? ""
        : this.plugin.settings.codexModel;
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

  private async refreshModelOptions(): Promise<void> {
    this.modelOptionsLoading = true;
    this.renderModelSelector();
    try {
      this.modelOptions = await getSupportedCodexModelOptions();
    } finally {
      this.modelOptionsLoading = false;
      this.renderModelSelector();
    }
  }

  private async handleModelSelection(value: string): Promise<void> {
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

  private async saveCustomModel(value: string): Promise<void> {
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

  private renderResponse(response: VaultChatResponse): void {
    this.addTurn("brain", response.answer.trim(), response.sources);

    if (response.plan && response.plan.operations.length > 0) {
      new VaultPlanModal(this.app, {
        plan: response.plan,
        onApprove: async (plan) => this.plugin.applyVaultWritePlan(plan),
        onComplete: async (message, paths) => {
          this.addUpdatedFileTurn(message, paths);
          await this.refreshStatus();
        },
      }).open();
    }
  }

  private setLoading(loading: boolean): void {
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

  private updateComposerState(): void {
    this.autoResizeInput();
    if (this.sendButtonEl) {
      this.sendButtonEl.disabled = this.isLoading || !this.inputEl.value.trim();
    }
  }

  private autoResizeInput(): void {
    this.inputEl.style.height = "auto";
    this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 240)}px`;
  }

  private addTurn(role: "user" | "brain", text: string, sources?: VaultQueryMatch[]): void {
    this.turns.push({ role, text, sources });
    void this.renderMessages();
  }

  private addUpdatedFileTurn(message: string, paths: string[]): void {
    this.turns.push({
      role: "brain",
      text: message,
      updatedPaths: paths,
    });
    void this.renderMessages();
  }

  private async renderMessages(): Promise<void> {
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
        cls: `brain-chat-message brain-chat-message-${turn.role}`,
      });
      item.createEl("div", {
        cls: "brain-chat-role",
        text: turn.role === "user" ? "You" : "Brain",
      });
      const output = item.createEl("div", { cls: "brain-output" });
      if (turn.role === "brain") {
        await MarkdownRenderer.render(this.app, turn.text, output, "", this);
        if (generation !== this.renderGeneration) {
          return;
        }
      } else {
        output.setText(turn.text);
      }
      if (turn.role === "brain" && turn.sources?.length) {
        this.renderSources(item, turn.sources);
      }
      if (turn.role === "brain" && turn.updatedPaths?.length) {
        this.renderUpdatedFiles(item, turn.updatedPaths);
      }
    }
    if (this.isLoading) {
      const item = this.messagesEl.createEl("div", {
        cls: "brain-chat-message brain-chat-message-brain brain-chat-message-loading",
      });
      item.createEl("div", {
        cls: "brain-chat-role",
        text: "Brain",
      });
      item.createEl("div", {
        cls: "brain-loading",
        text: this.loadingText || "Reading vault context and asking Codex...",
      });
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private startLoadingTimer(): void {
    this.stopLoadingTimer();
    this.loadingTimer = window.setInterval(() => {
      this.updateLoadingText();
      void this.renderMessages();
    }, 1000);
  }

  private stopLoadingTimer(): void {
    if (this.loadingTimer !== null) {
      window.clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  private updateLoadingText(): void {
    const seconds = Math.max(0, Math.floor((Date.now() - this.loadingStartedAt) / 1000));
    const remaining = Math.max(0, 120 - seconds);
    this.loadingText = `Reading vault context and asking Codex... ${seconds}s elapsed, timeout in ${remaining}s.`;
  }

  private renderEmptyState(): void {
    const empty = this.messagesEl.createEl("div", { cls: "brain-chat-empty" });
    empty.createEl("strong", { text: "Start with a question or rough capture." });
    empty.createEl("span", {
      text: " Brain retrieves markdown context, answers with sources, and previews proposed writes before anything changes.",
    });
  }

  private renderSources(container: HTMLElement, sources: VaultQueryMatch[]): void {
    const details = container.createEl("details", { cls: "brain-sources" });
    details.createEl("summary", {
      text: `Sources (${Math.min(sources.length, 8)})`,
    });
    for (const source of sources.slice(0, 8)) {
      const sourceEl = details.createEl("div", { cls: "brain-source" });
      const title = sourceEl.createEl("button", {
        cls: "brain-source-title",
        text: source.path,
      });
      title.addEventListener("click", () => {
        void this.openSource(source.path);
      });
      sourceEl.createEl("div", {
        cls: "brain-source-reason",
        text: source.reason,
      });
      if (source.excerpt) {
        sourceEl.createEl("pre", {
          cls: "brain-source-excerpt",
          text: source.excerpt,
        });
      }
    }
  }

  private renderUpdatedFiles(container: HTMLElement, paths: string[]): void {
    const files = container.createEl("div", { cls: "brain-updated-files" });
    files.createEl("div", {
      cls: "brain-source-reason",
      text: "Updated files",
    });
    for (const path of paths) {
      const button = files.createEl("button", {
        cls: "brain-source-title",
        text: path,
      });
      button.addEventListener("click", () => {
        void this.openSource(path);
      });
    }
  }

  private async openSource(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }
}

function formatProviderStatus(status: Awaited<ReturnType<typeof getAIConfigurationStatus>>): string {
  if (!status.configured) {
    return status.message.replace(/\.$/, "");
  }
  const model = status.model ? ` (${status.model})` : "";
  return `Codex${model}`;
}

function isStoppedRequest(error: unknown): boolean {
  return error instanceof Error && error.message === "Codex request stopped.";
}
