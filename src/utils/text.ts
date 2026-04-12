import { TFile } from "obsidian";
import { VaultService } from "../services/vault-service";
import { buildFallbackSummary } from "./summary-format";

export async function joinRecentFilesForSummary(
  vaultService: VaultService,
  files: TFile[],
  maxChars: number,
): Promise<string> {
  const parts: string[] = [];
  let total = 0;

  for (const file of files) {
    try {
      const content = await vaultService.readText(file.path);
      const trimmed = content.trim();
      if (!trimmed) {
        continue;
      }

      const block = [`--- ${file.path}`, trimmed].join("\n");
      if (total + block.length > maxChars) {
        const remaining = Math.max(0, maxChars - total);
        if (remaining > 0) {
          parts.push(block.slice(0, remaining));
        }
        break;
      }

      parts.push(block);
      total += block.length;
    } catch (error) {
      console.error(error);
    }
  }

  return parts.join("\n\n");
}
