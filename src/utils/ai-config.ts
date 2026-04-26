import type { BrainPluginSettings } from "../settings/settings";
import { getCodexLoginStatus } from "./codex-auth";

export interface AIConfigurationStatus {
  configured: boolean;
  provider: "codex";
  model: string | null;
  message: string;
}

export async function getAIConfigurationStatus(
  settings: BrainPluginSettings,
): Promise<AIConfigurationStatus> {
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
