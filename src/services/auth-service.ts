import { Notice, ObsidianProtocolData } from "obsidian";
import BrainPlugin from "../../main";

export class BrainAuthService {
  constructor(private plugin: BrainPlugin) {}

  registerProtocol() {
    this.plugin.registerObsidianProtocol("brain-auth", async (data: ObsidianProtocolData) => {
      const { provider, token } = data;

      if (!provider || !token) {
        new Notice("Brain: Invalid authentication data received");
        return;
      }

      if (provider === "openai") {
        this.plugin.settings.openAIApiKey = token;
        new Notice("Brain: OpenAI authenticated successfully");
      } else if (provider === "gemini") {
        this.plugin.settings.geminiApiKey = token;
        new Notice("Brain: Gemini authenticated successfully");
      }

      await this.plugin.saveSettings();
      // Force refresh settings tab if open
      this.plugin.app.workspace.trigger("brain:settings-updated");
    });
  }

  async login(provider: "openai" | "gemini") {
    // In a real OAuth flow, this would point to a backend that handles the redirect
    // For now, we point to the provider's auth page or a helper tool
    let url = "";
    if (provider === "openai") {
      url = "https://platform.openai.com/api-keys"; // Fallback if no OAuth
      new Notice("Please create an API key and the plugin will guide you.");
    } else if (provider === "gemini") {
      url = "https://aistudio.google.com/app/apikey"; // Fallback for Gemini
      new Notice("Opening Gemini API Key page...");
    }

    window.open(url);
  }
}
