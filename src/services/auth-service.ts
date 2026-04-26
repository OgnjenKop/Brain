import { Notice } from "obsidian";
import BrainPlugin from "../../main";
import { CodexLoginStatus, getCodexLoginStatus } from "../utils/codex-auth";

export class BrainAuthService {
  constructor(private plugin: BrainPlugin) {}

  async login() {
    new Notice("Install the Codex CLI, run `codex login`, then return to Brain and recheck Codex status.");
    window.open("https://openai.com/codex/get-started/");
  }

  async getCodexStatus(): Promise<CodexLoginStatus> {
    return getCodexLoginStatus();
  }
}
