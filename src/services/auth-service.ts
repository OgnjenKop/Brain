import { Notice } from "obsidian";
import BrainPlugin from "../../main";
import { CodexLoginStatus, clearCodexCache, getCodexLoginStatus } from "../utils/codex-auth";

export class BrainAuthService {
  constructor(private plugin: BrainPlugin) {}

  async login() {
    new Notice("Install the Codex CLI, run `codex login`, then return to Brain and recheck Codex status.");
    // The user is about to change the machine's Codex state, so drop cached
    // lookups and make the next status check hit the CLI again.
    clearCodexCache();
    window.open("https://openai.com/codex/get-started/");
  }

  async getCodexStatus(options?: { force?: boolean }): Promise<CodexLoginStatus> {
    return getCodexLoginStatus(options);
  }
}
