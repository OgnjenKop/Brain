import { App, ItemView, MarkdownRenderer, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import BrainPlugin from "../../main";
import { VaultChatResponse, ChatExchange } from "../services/vault-chat-service";
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
  private modelOptions: CodexModelOption[] = DEFAULT_CODEX_MODEL_OPTIONS;
  private modelOptionsLoading = false;
  private customModelDraft = false;
  private isLoading = false;
  private currentAbortController: AbortController | null = null;
  private loadingStartedAt = 0;
  private loadingTimer: number | null = null;
  private loadingText = "";
  private loadingTextEl: HTMLElement | null = null;
  private loadingStageEl: HTMLElement | null = null;
  private loadingStage: "query" | "ai" = "query";
  private renderGeneration = 0;
  private resizeFrameId: number | null = null;
  private turns: ChatTurn[] = [];
  private userScrolledUp = false;
  private scrollToBottomEl: HTMLElement | null = null;

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
    const headerTop = header.createEl("div", { cls: "brain-header-top" });
    headerTop.createEl("h2", { text: "Brain" });
    this.modelRowEl = headerTop.createEl("div", { cls: "brain-model-row" });
    this.renderModelSelector();
    void this.refreshModelOptions();
    header.createEl("p", {
      text: "Ask your vault, or tell Brain what to file.",
    });

    const messagesContainer = this.contentEl.createEl("div", { cls: "brain-messages-container" });
    this.messagesEl = messagesContainer.createEl("div", {
      cls: "brain-chat-messages",
      attr: { "aria-live": "polite", "aria-atomic": "false" },
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
      attr: { "aria-label": "Scroll to bottom" },
    });
    setIcon(this.scrollToBottomEl, "arrow-down");
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
        rows: "4",
      },
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
      text: "Send",
    });
    this.sendButtonEl.addEventListener("click", () => {
      void this.sendMessage();
    });
    this.stopButtonEl = actions.createEl("button", {
      cls: "brain-button brain-button-stop brain-button-hidden",
      text: "Stop",
    });
    this.stopButtonEl.addEventListener("click", () => {
      this.stopCurrentRequest();
    });
    this.stopButtonEl.hidden = true;

    this.statusEl = this.contentEl.createEl("div", { cls: "brain-chat-status" });
    this.autoResizeInput();
    await this.refreshStatus();
  }

  onClose(): Promise<void> {
    this.currentAbortController?.abort();
    this.stopLoadingTimer();
    if (this.resizeFrameId !== null) {
      cancelAnimationFrame(this.resizeFrameId);
      this.resizeFrameId = null;
    }
    return Promise.resolve();
  }

  async refreshStatus(): Promise<void> {
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
      cls: `brain-status-indicator ${statusText !== "Not connected" ? "brain-status-indicator--ok" : "brain-status-indicator--warn"}`,
    });
    indicator.setAttribute("aria-hidden", "true");
    this.statusEl.createEl("span", { text: statusText });
  }

  private async sendMessage(): Promise<void> {
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

  private buildChatHistory(): ChatExchange[] {
    // Exclude the last turn, which is the current user message being sent.
    return this.turns
      .slice(0, -1)
      .filter((turn): turn is ChatTurn & { text: string } => Boolean(turn.text))
      .map((turn) => ({
        role: turn.role,
        text: turn.text,
      }));
  }

  private stopCurrentRequest(): void {
    this.currentAbortController?.abort();
  }

  private renderModelSelector(): void {
    this.modelRowEl.empty();
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
        settings: this.plugin.settings,
        onApprove: async (plan) => this.plugin.applyVaultWritePlan(plan),
        onComplete: async (message, paths) => {
          this.addUpdatedFileTurn(message, paths);
          await this.refreshStatus();
        },
      }).open();
    }
  }

  private setLoading(loading: boolean, stage: "query" | "ai" = "query"): void {
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

  private autoResizeInput(): void {
    if (this.resizeFrameId !== null) {
      cancelAnimationFrame(this.resizeFrameId);
    }
    this.resizeFrameId = requestAnimationFrame(() => {
      this.resizeFrameId = null;
      this.inputEl.style.height = "auto";
      this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 240)}px`;
    });
  }

  private addTurn(role: "user" | "brain", text: string, sources?: VaultQueryMatch[]): void {
    const turn: ChatTurn = { role, text, sources };
    this.turns.push(turn);
    void this.appendTurnElement(turn);
  }

  private addUpdatedFileTurn(message: string, paths: string[]): void {
    const turn: ChatTurn = {
      role: "brain",
      text: message,
      updatedPaths: paths,
    };
    this.turns.push(turn);
    void this.appendTurnElement(turn);
  }

  private async appendTurnElement(turn: ChatTurn): Promise<void> {
    const generation = ++this.renderGeneration;

    const emptyEl = this.messagesEl.querySelector(".brain-chat-empty");
    if (emptyEl) {
      emptyEl.remove();
    }

    this.removeLoadingIndicator();

    const item = this.messagesEl.createEl("div", {
      cls: `brain-chat-message brain-chat-message-${turn.role}`,
    });
    const roleEl = item.createEl("div", { cls: "brain-chat-role" });
    const roleIcon = roleEl.createEl("span");
    setIcon(roleIcon, turn.role === "user" ? "user" : "brain-circuit");
    roleEl.createEl("span", { text: turn.role === "user" ? "You" : "Brain" });

    const output = item.createEl("div", { cls: "brain-output" });
    if (turn.role === "brain") {
      try {
        await MarkdownRenderer.render(this.app, turn.text, output, "", this);
      } catch {
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
    if (turn.role === "brain" && turn.sources?.length) {
      this.renderSources(item, turn.sources);
    }
    if (turn.role === "brain" && turn.updatedPaths?.length) {
      this.renderUpdatedFiles(item, turn.updatedPaths);
    }

    this.maybeScrollToBottom();
  }

  private appendLoadingIndicator(): void {
    if (this.messagesEl.querySelector(".brain-chat-message-loading")) {
      return;
    }
    const item = this.messagesEl.createEl("div", {
      cls: "brain-chat-message brain-chat-message-brain brain-chat-message-loading",
    });
    const roleEl = item.createEl("div", { cls: "brain-chat-role" });
    const roleIcon = roleEl.createEl("span");
    setIcon(roleIcon, "brain-circuit");
    roleEl.createEl("span", { text: "Brain" });

    const loading = item.createEl("div", { cls: "brain-loading" });
    const dots = loading.createEl("div", { cls: "brain-loading-dots" });
    dots.createEl("span");
    dots.createEl("span");
    dots.createEl("span");
    const meta = loading.createEl("div", { cls: "brain-loading-meta" });
    this.loadingStageEl = meta.createEl("span", {
      cls: "brain-loading-stage",
      text: "Searching vault…",
    });
    this.loadingTextEl = meta.createEl("span", {
      cls: "brain-loading-time",
      text: "0s",
    });
    this.maybeScrollToBottom();
  }

  private removeLoadingIndicator(): void {
    const loadingEl = this.messagesEl.querySelector(".brain-chat-message-loading");
    if (loadingEl) {
      loadingEl.remove();
    }
    this.loadingTextEl = null;
    this.loadingStageEl = null;
  }

  private async renderMessages(): Promise<void> {
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
        cls: `brain-chat-message brain-chat-message-${turn.role}`,
      });
      const roleEl = item.createEl("div", { cls: "brain-chat-role" });
      const roleIcon = roleEl.createEl("span");
      setIcon(roleIcon, turn.role === "user" ? "user" : "brain-circuit");
      roleEl.createEl("span", { text: turn.role === "user" ? "You" : "Brain" });

      const output = item.createEl("div", { cls: "brain-output" });
      if (turn.role === "brain") {
        try {
          await MarkdownRenderer.render(this.app, turn.text, output, "", this);
        } catch {
          output.setText(turn.text);
        }
        if (generation !== this.renderGeneration) {
          return;
        }
        this.addCopyButtons(output);
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
      this.appendLoadingIndicator();
    }
    this.maybeScrollToBottom();
  }

  private startLoadingTimer(): void {
    this.stopLoadingTimer();
    this.loadingTimer = window.setInterval(() => {
      this.updateLoadingText();
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
    const stageLabel = this.loadingStage === "query" ? "Searching vault" : "Asking Codex";
    this.loadingText = `${stageLabel} · ${seconds}s`;
    if (this.loadingTextEl) {
      this.loadingTextEl.setText(this.loadingText);
    }
    if (this.loadingStageEl) {
      this.loadingStageEl.setText(this.loadingStage === "query" ? "Searching vault…" : "Asking Codex…");
    }
  }

  private renderEmptyState(): void {
    const empty = this.messagesEl.createEl("div", { cls: "brain-chat-empty" });
    const icon = empty.createEl("div", { cls: "brain-chat-empty-icon" });
    setIcon(icon, "brain-circuit");
    empty.createEl("strong", { text: "Start with a question or rough capture" });
    empty.createEl("span", {
      text: "Brain retrieves vault context, answers with sources, and previews writes before anything changes.",
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

  private isNearBottom(threshold = 60): boolean {
    const el = this.messagesEl;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  private maybeScrollToBottom(): void {
    if (this.userScrolledUp) {
      this.updateScrollToBottomButton();
      return;
    }
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
    this.updateScrollToBottomButton();
  }

  private updateScrollToBottomButton(): void {
    if (!this.scrollToBottomEl) {
      return;
    }
    const show = this.userScrolledUp && this.turns.length > 0;
    this.scrollToBottomEl.toggleClass("brain-scroll-to-bottom--visible", show);
  }

  private addCopyButtons(container: HTMLElement): void {
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

  private async openSource(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }
}

function isStoppedRequest(error: unknown): boolean {
  return error instanceof Error && error.message === "Codex request stopped.";
}
