import { Notice } from "obsidian";
import BrainPlugin from "../../main";
import { CodexLoginStatus, getCodexLoginStatus } from "../utils/codex-auth";

export class BrainAuthService {
  constructor(private plugin: BrainPlugin) {}

  async login(provider: "openai" | "codex" | "gemini") {
    let url = "";
    if (provider === "openai") {
      url = "https://platform.openai.com/api-keys";
      new Notice("Open the OpenAI API key page, create a key, then paste it into Brain settings.");
    } else if (provider === "codex") {
      url = "https://openai.com/codex/get-started/";
      new Notice("Install the Codex CLI, run `codex login`, then return to Brain and select the Codex provider.");
    } else if (provider === "gemini") {
      url = "https://aistudio.google.com/app/apikey";
      new Notice("Open the Gemini API key page, then paste the key into Brain settings.");
    }

    window.open(url);
  }

  async getCodexStatus(): Promise<CodexLoginStatus> {
    return getCodexLoginStatus();
  }
}
