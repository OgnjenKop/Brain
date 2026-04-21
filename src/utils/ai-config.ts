import type { BrainPluginSettings } from "../settings/settings";
import { getCodexLoginStatus } from "./codex-auth";

export interface AIConfigurationStatus {
  configured: boolean;
  provider: "openai" | "codex" | "gemini" | null;
  model: string | null;
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
        provider: "codex",
        model: null,
        message: "Codex CLI not installed.",
      };
    }

    if (codexStatus !== "logged-in") {
      return {
        configured: false,
        provider: "codex",
        model: null,
        message: "Codex CLI not logged in.",
      };
    }

    const model = settings.codexModel.trim() || null;
    return {
      configured: true,
      provider: "codex",
      model,
      message: model
        ? `Ready to use Codex with model ${model}.`
        : "Ready to use Codex with the account default model.",
    };
  }

  if (settings.aiProvider === "gemini") {
    if (!settings.geminiApiKey.trim()) {
      return {
        configured: false,
        provider: "gemini",
        model: null,
        message: "Gemini API key missing.",
      };
    }

    if (!settings.geminiModel.trim()) {
      return {
        configured: false,
        provider: "gemini",
        model: null,
        message: "Gemini model missing.",
      };
    }

    return {
      configured: true,
      provider: "gemini",
      model: settings.geminiModel.trim(),
      message: "Ready to use Gemini.",
    };
  }

  const isDefaultOpenAIUrl =
    !settings.openAIBaseUrl.trim() || settings.openAIBaseUrl.includes("api.openai.com");

  if (!settings.openAIModel.trim()) {
    return {
      configured: false,
      provider: "openai",
      model: null,
      message: "OpenAI model missing.",
    };
  }

  if (isDefaultOpenAIUrl && !settings.openAIApiKey.trim()) {
    return {
      configured: false,
      provider: "openai",
      model: null,
      message: "OpenAI API key missing.",
    };
  }

  return {
    configured: true,
    provider: "openai",
    model: settings.openAIModel.trim(),
    message: isDefaultOpenAIUrl
      ? "Ready to use the OpenAI API."
      : "Ready to use a custom OpenAI-compatible endpoint.",
  };
}
