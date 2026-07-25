import { App, ItemView, MarkdownRenderer, Notice, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import BrainPlugin from "../../main";
import { VaultChatResponse, ChatExchange } from "../services/vault-chat-service";
import type { VaultQueryMatch } from "../services/vault-query-service";
import type { VaultWritePlan } from "../services/vault-write-service";
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
  role: "user" | "brain" | "error" | "info";
  text: string;
  sources?: VaultQueryMatch[];
  /** Proposed writes, kept until applied so a cancelled review can be reopened. */
  plan?: VaultWritePlan;
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
  private modelSelectEl: HTMLSelectElement | null = null;
  private modelCustomInputEl: HTMLInputElement | null = null;
  private isLoading = false;
  private currentAbortController: AbortController | null = null;
  private loadingStartedAt = 0;
  private loadingTimer: number | null = null;
  private loadingTextEl: HTMLElement | null = null;
  private loadingStageEl: HTMLElement | null = null;
  private loadingStage: "query" | "ai" = "query";
  private renderGeneration = 0;
  private resizeFrameId: number | null = null;
  private turns: ChatTurn[] = [];
  /** Latest rendered element for a turn, so a turn can be updated in place. */
  private readonly turnElements = new WeakMap<ChatTurn, HTMLElement>();
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

    const headerActions = header.createEl("div", { cls: "brain-header-actions" });
    this.clearButtonEl = headerActions.createEl("button", {
      cls: "brain-button brain-button-ghost brain-button-small",
      attr: { "aria-label": "Clear conversation", title: "Clear conversation" },
    });
    setIcon(this.clearButtonEl, "trash-2");
    this.clearButtonEl.createEl("span", { text: "Clear" });
    this.clearButtonEl.addEventListener("click", () => {
      void this.clearConversation();
    });

    const instructionsLink = headerActions.createEl("button", {
      cls: "brain-button brain-button-ghost brain-button-small",
      attr: { "aria-label": "Open instructions file", title: "Open instructions file" },
    });
    setIcon(instructionsLink, "book-open");
    instructionsLink.createEl("span", { text: "Instructions" });
    instructionsLink.addEventListener("click", () => {
      void this.plugin.openInstructionsFile();
    });

    const settingsLink = headerActions.createEl("button", {
      cls: "brain-button brain-button-ghost brain-button-small",
      attr: { "aria-label": "Open Brain settings", title: "Open Brain settings" },
    });
    setIcon(settingsLink, "settings");
    settingsLink.createEl("span", { text: "Settings" });
    settingsLink.addEventListener("click", () => {
      const commands = (this.app as unknown as { commands?: { executeCommandById?: (id: string) => void } })
        .commands;
      commands?.executeCommandById?.("app:open-settings");
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

    const hint = this.contentEl.createEl("div", { cls: "brain-keyboard-hint" });
    hint.createEl("span", { text: "Press " });
    hint.createEl("kbd", { text: "Enter" });
    hint.createEl("span", { text: " to send · " });
    hint.createEl("kbd", { text: "Shift+Enter" });
    hint.createEl("span", { text: " for a new line" });

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
    this.updateClearButton();
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
    let statusClass: "ok" | "warn" | "error" = "error";
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
      cls: `brain-status-indicator brain-status-indicator--${statusClass}`,
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
        const message = error instanceof Error ? error.message : "Could not chat with the vault";
        showError(error, "Could not chat with the vault");
        if (this.contentEl.isConnected) {
          this.addTurn({ role: "error", text: message });
        }
      }
    } finally {
      this.currentAbortController = null;
      this.setLoading(false);
    }
  }

  private buildChatHistory(): ChatExchange[] {
    // Exclude the last turn, which is the current user message being sent.
    const out: ChatExchange[] = [];
    for (const turn of this.turns.slice(0, -1)) {
      if (turn.role !== "user" && turn.role !== "brain") {
        continue;
      }
      if (!turn.text) {
        continue;
      }
      if (turn.updatedPaths?.length) {
        continue;
      }
      out.push({ role: turn.role, text: turn.text });
    }
    return out;
  }

  private stopCurrentRequest(): void {
    if (!this.currentAbortController) {
      return;
    }
    this.currentAbortController.abort();
    this.stopButtonEl.disabled = true;
    if (this.loadingStageEl) {
      this.loadingStageEl.setText("Stopping…");
    }
    if (this.loadingTextEl) {
      this.loadingTextEl.setText("Stopping");
    }
  }

  private renderModelSelector(): void {
    this.modelRowEl.empty();
    this.modelSelectEl = null;
    this.modelCustomInputEl = null;

    if (this.modelOptionsLoading) {
      this.modelRowEl.createEl("span", {
        cls: "brain-model-active",
        text: "Loading Codex models...",
      });
      this.updateModelControlsDisabledState();
      return;
    }
    const select = this.modelRowEl.createEl("select", {
      cls: "brain-model-select",
    }) as HTMLSelectElement;
    this.modelSelectEl = select;
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
    const desiredValue = this.customModelDraft
      ? CUSTOM_CODEX_MODEL_VALUE
      : getCodexModelDropdownValue(this.plugin.settings.codexModel, this.modelOptions);
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
      this.modelCustomInputEl = input;
      const initialCustomValue =
        this.customModelDraft || isKnownCodexModel(this.plugin.settings.codexModel, this.modelOptions)
          ? ""
          : this.plugin.settings.codexModel;
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

  private updateModelControlsDisabledState(): void {
    const disabled = this.isLoading || this.modelOptionsLoading;
    if (this.modelSelectEl) {
      this.modelSelectEl.disabled = disabled;
    }
    if (this.modelCustomInputEl) {
      this.modelCustomInputEl.disabled = disabled;
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
    // saveSettings already refreshes this view's status.
    await this.plugin.saveSettings();
    this.renderModelSelector();
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
  }

  private renderResponse(response: VaultChatResponse): void {
    const plan = response.plan && response.plan.operations.length > 0
      ? response.plan
      : undefined;
    const turn = this.addTurn({
      role: "brain",
      text: response.answer.trim(),
      sources: response.sources,
      plan,
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
  private openPlanModal(turn: ChatTurn): void {
    const plan = turn.plan;
    if (!plan || plan.operations.length === 0) {
      return;
    }
    new VaultPlanModal(this.app, {
      plan,
      settings: this.plugin.settings,
      onApprove: async (approved) => this.plugin.applyVaultWritePlan(approved),
      onComplete: async (message, paths) => {
        // The plan has been applied, so retire the reopen affordance rather
        // than re-rendering the whole conversation.
        turn.plan = undefined;
        this.turnElements.get(turn)?.querySelector(".brain-plan-action")?.remove();
        this.addTurn({ role: "brain", text: message, updatedPaths: paths });
        await this.refreshStatus();
      },
    }).open();
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
      this.removeLoadingIndicator();
    }
    this.inputEl.disabled = loading;
    this.sendButtonEl.hidden = loading;
    this.stopButtonEl.hidden = !loading;
    this.stopButtonEl.disabled = false;
    this.updateModelControlsDisabledState();
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

  private addTurn(turn: ChatTurn): ChatTurn {
    this.turns.push(turn);
    void this.appendTurnElement(turn);
    this.updateClearButton();
    return turn;
  }

  private async clearConversation(): Promise<void> {
    if (this.isLoading) {
      new Notice("Stop the current request before clearing the conversation.");
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

  private updateClearButton(): void {
    if (!this.clearButtonEl) {
      return;
    }
    const disabled = this.turns.length === 0;
    this.clearButtonEl.disabled = disabled;
    this.clearButtonEl.toggleClass("brain-button-hidden", disabled);
  }

  private async appendTurnElement(turn: ChatTurn): Promise<void> {
    const emptyEl = this.messagesEl.querySelector(".brain-chat-empty");
    if (emptyEl) {
      emptyEl.remove();
    }

    this.removeLoadingIndicator();
    await this.renderTurn(turn);
    this.maybeScrollToBottom();
  }

  /** Single definition of a turn's DOM, shared by appends and full re-renders. */
  private async renderTurn(turn: ChatTurn): Promise<void> {
    const item = this.messagesEl.createEl("div", {
      cls: `brain-chat-message brain-chat-message-${turn.role}`,
    });
    this.turnElements.set(turn, item);
    const roleEl = item.createEl("div", { cls: "brain-chat-role" });
    const roleIcon = roleEl.createEl("span");
    setIcon(roleIcon, this.turnIconFor(turn.role));
    roleEl.createEl("span", { text: this.turnLabelFor(turn.role) });

    const output = item.createEl("div", { cls: "brain-output" });
    if (turn.role !== "brain") {
      output.setText(turn.text);
      return;
    }

    try {
      await MarkdownRenderer.render(this.app, turn.text, output, "", this);
    } catch {
      output.setText(turn.text);
    }
    // Only bail if this element was detached while markdown was rendering
    // (a full re-render or a cleared conversation). A later append must not
    // remove an earlier, still-attached message.
    if (item.parentElement !== this.messagesEl) {
      return;
    }
    this.addCopyButtons(output);

    if (turn.sources?.length) {
      this.renderSources(item, turn.sources);
    }
    if (turn.plan?.operations.length) {
      this.renderPlanAction(item, turn);
    }
    if (turn.updatedPaths?.length) {
      this.renderUpdatedFiles(item, turn.updatedPaths);
    }
  }

  private renderPlanAction(container: HTMLElement, turn: ChatTurn): void {
    const count = turn.plan?.operations.length ?? 0;
    const row = container.createEl("div", { cls: "brain-plan-action" });
    const button = row.createEl("button", {
      cls: "brain-button brain-button-primary brain-button-small",
    });
    setIcon(button, "file-pen");
    button.createEl("span", {
      text: `Review ${count} proposed change${count === 1 ? "" : "s"}`,
    });
    button.addEventListener("click", () => {
      this.openPlanModal(turn);
    });
  }

  private turnLabelFor(role: ChatTurn["role"]): string {
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

  private turnIconFor(role: ChatTurn["role"]): string {
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
      await this.renderTurn(turn);
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
    if (this.loadingTextEl) {
      this.loadingTextEl.setText(`${stageLabel} · ${seconds}s`);
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
    // Every source here was included in the prompt, so the count is an honest
    // description of what backed the answer.
    const details = container.createEl("details", { cls: "brain-sources" });
    details.createEl("summary", {
      text: `Sources (${sources.length})`,
    });
    for (const source of sources) {
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
