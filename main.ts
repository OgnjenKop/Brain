import { Notice, Plugin, TFile } from "obsidian";
import {
  BrainPluginSettings,
  normalizeBrainSettings,
} from "./src/settings/settings";
import { BrainSettingTab } from "./src/settings/settings-tab";
import { BrainAIService } from "./src/services/ai-service";
import { BrainAuthService } from "./src/services/auth-service";
import { InstructionService } from "./src/services/instruction-service";
import { VaultChatResponse, VaultChatService, ChatExchange } from "./src/services/vault-chat-service";
import { VaultQueryService } from "./src/services/vault-query-service";
import { VaultService } from "./src/services/vault-service";
import { VaultWritePlan, VaultWriteService } from "./src/services/vault-write-service";
import { BRAIN_VIEW_TYPE, BrainSidebarView } from "./src/views/sidebar-view";
import { registerCommands } from "./src/commands/register-commands";
import { showError } from "./src/utils/error-handler";

export default class BrainPlugin extends Plugin {
  settings!: BrainPluginSettings;
  vaultService!: VaultService;
  aiService!: BrainAIService;
  authService!: BrainAuthService;
  instructionService!: InstructionService;
  vaultQueryService!: VaultQueryService;
  vaultWriteService!: VaultWriteService;
  vaultChatService!: VaultChatService;
  private sidebarView: BrainSidebarView | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.vaultService = new VaultService(this.app);
    this.aiService = new BrainAIService();
    this.authService = new BrainAuthService(this);
    this.instructionService = new InstructionService(
      this.vaultService,
      () => this.settings,
    );
    this.vaultQueryService = new VaultQueryService(
      this.vaultService,
      () => this.settings,
    );
    this.vaultWriteService = new VaultWriteService(
      this.vaultService,
      () => this.settings,
    );
    this.vaultChatService = new VaultChatService(
      this.aiService,
      this.instructionService,
      this.vaultQueryService,
      this.vaultService,
      this.vaultWriteService,
      () => this.settings,
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

  onunload(): void {
    this.sidebarView = null;
  }

  async loadSettings(): Promise<void> {
    try {
      const loaded = (await this.loadData()) ?? {};
      this.settings = normalizeBrainSettings(loaded);
    } catch (error) {
      showError(error, "Could not load Brain settings");
      this.settings = normalizeBrainSettings({});
    }
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeBrainSettings(this.settings);
    await this.saveData(this.settings);
    try {
      await this.vaultService.ensureKnownFolders(this.settings);
      await this.instructionService?.ensureInstructionsFile();
    } catch (error) {
      showError(error, "Could not initialize Brain storage");
    }
    await this.refreshSidebarStatus();
  }

  async openSidebar(): Promise<void> {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice("Unable to open the sidebar");
      return;
    }
    await leaf.setViewState({
      type: BRAIN_VIEW_TYPE,
      active: true,
    });
    this.app.workspace.revealLeaf(leaf);
  }

  async openInstructionsFile(): Promise<void> {
    await this.instructionService.ensureInstructionsFile();
    const file = this.app.vault.getAbstractFileByPath(this.settings.instructionsFile);
    if (!(file instanceof TFile)) {
      new Notice(`Could not open ${this.settings.instructionsFile}`);
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }

  async chatWithVault(message: string, history: ChatExchange[] = [], signal?: AbortSignal): Promise<VaultChatResponse> {
    return this.vaultChatService.respond(message, history, signal);
  }

  async applyVaultWritePlan(plan: VaultWritePlan): Promise<string[]> {
    const paths = await this.vaultWriteService.applyPlan(plan);
    await this.refreshSidebarStatusBestEffort();
    return paths;
  }

  getOpenSidebarView(): BrainSidebarView | null {
    const leaves = this.app.workspace.getLeavesOfType(BRAIN_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof BrainSidebarView) {
        return view;
      }
    }
    return null;
  }

  async refreshSidebarStatus(): Promise<void> {
    await this.getOpenSidebarView()?.refreshStatus();
  }

  async refreshSidebarStatusBestEffort(): Promise<void> {
    try {
      await this.refreshSidebarStatus();
    } catch (error) {
      showError(error, "Could not refresh sidebar status");
    }
  }

}
