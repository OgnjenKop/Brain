import { Plugin } from "obsidian";

interface BrainCommandHost {
  addCommand: Plugin["addCommand"];
  openSidebar(): Promise<void>;
  openInstructionsFile(): Promise<void>;
}

export function registerCommands(plugin: BrainCommandHost): void {
  plugin.addCommand({
    id: "open-vault-chat",
    name: "Brain: Open Vault Chat",
    callback: async () => {
      await plugin.openSidebar();
    },
  });

  plugin.addCommand({
    id: "open-instructions",
    name: "Brain: Open Instructions",
    callback: async () => {
      await plugin.openInstructionsFile();
    },
  });
}
