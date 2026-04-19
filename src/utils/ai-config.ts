import { BrainPluginSettings } from "../settings/settings";
import { getCodexLoginStatus } from "./codex-auth";

export interface AIProviderConfig {
  apiKey: string;
  model: string;
}

export interface AIConfigurationStatus {
  configured: boolean;
  message: string;
}

export async function getAIConfigurationStatus(
  settings: BrainPluginSettings,
): Promise<AIConfigurationStatus> {
  if (settings.aiProvider === "codex") {
    const codexStatus = await getCodexLoginStatus();
    if (codexStatus === "unavailable") {
      return {
        configured: false,
        message: "Codex CLI not installed.",
      };
    }

    if (codexStatus !== "logged-in") {
      return {
        configured: false,
        message: "Codex CLI not logged in.",
      };
    }

    return {
      configured: true,
      message: settings.codexModel.trim()
        ? `Ready to use Codex with model ${settings.codexModel.trim()}.`
        : "Ready to use Codex with the account default model.",
    };
  }

  if (settings.aiProvider === "gemini") {
    if (!settings.geminiApiKey.trim()) {
      return {
        configured: false,
        message: "Gemini API key missing.",
      };
    }

    if (!settings.geminiModel.trim()) {
      return {
        configured: false,
        message: "Gemini model missing.",
      };
    }

    return {
      configured: true,
      message: "Ready to use Gemini.",
    };
  }

  const isDefaultOpenAIUrl =
    !settings.openAIBaseUrl.trim() || settings.openAIBaseUrl.includes("api.openai.com");

  if (!settings.openAIModel.trim()) {
    return {
      configured: false,
      message: "OpenAI model missing.",
    };
  }

  if (isDefaultOpenAIUrl && !settings.openAIApiKey.trim()) {
    return {
      configured: false,
      message: "OpenAI API key missing.",
    };
  }

  return {
    configured: true,
    message: isDefaultOpenAIUrl
      ? "Ready to use the OpenAI API."
      : "Ready to use a custom OpenAI-compatible endpoint.",
  };
}
