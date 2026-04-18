import { Notice, ObsidianProtocolData } from "obsidian";
import BrainPlugin from "../../main";

export class BrainAuthService {
  constructor(private plugin: BrainPlugin) {}

  registerProtocol() {
    this.plugin.registerObsidianProtocolHandler("brain-auth", async (data: ObsidianProtocolData) => {
      const { provider, token } = data;

      if (!provider || !token) {
        new Notice("Brain: Invalid authentication data received");
        return;
      }

      if (provider !== "openai" && provider !== "gemini") {
        new Notice("Brain: Unknown authentication provider");
        return;
      }

      if (token.length < 10 || token.length > 512) {
        new Notice("Brain: Invalid token format");
        return;
      }

      if (provider === "openai") {
        this.plugin.settings.openAIApiKey = token;
        new Notice("Brain: OpenAI authenticated successfully");
      } else {
        this.plugin.settings.geminiApiKey = token;
        new Notice("Brain: Gemini authenticated successfully");
      }

      await this.plugin.saveSettings();
      this.plugin.app.workspace.trigger("brain:settings-updated");
    });
  }

  async login(provider: "openai" | "gemini") {
    let url = "";
    if (provider === "openai") {
      url = "https://platform.openai.com/api-keys";
      new Notice("Please create an API key and the plugin will guide you.");
    } else if (provider === "gemini") {
      url = "https://aistudio.google.com/app/apikey";
      new Notice("Opening Gemini API Key page...");
    }

    window.open(url);
  }
}
