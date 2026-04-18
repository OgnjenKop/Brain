import { BrainPluginSettings } from "../settings/settings";

export interface AIProviderConfig {
  apiKey: string;
  model: string;
}

export function getAIProviderConfig(settings: BrainPluginSettings): AIProviderConfig {
  if (settings.aiProvider === "gemini") {
    return {
      apiKey: settings.geminiApiKey,
      model: settings.geminiModel,
    };
  }

  return {
    apiKey: settings.openAIApiKey,
    model: settings.openAIModel,
  };
}

export function isAIConfigured(settings: BrainPluginSettings): boolean {
  const config = getAIProviderConfig(settings);
  return config.apiKey.trim().length > 0 && config.model.trim().length > 0;
}
