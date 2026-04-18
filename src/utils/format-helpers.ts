import { collapseWhitespace } from "./date";

export function formatListSection(
  items: Set<string>,
  emptyMessage: string,
  maxItems = 10,
): string {
  if (!items.size) {
    return `- ${emptyMessage}`;
  }

  return Array.from(items)
    .slice(0, maxItems)
    .map((item) => `- ${item}`)
    .join("\n");
}

export function safeCollapseWhitespace(text: string | undefined): string {
  return collapseWhitespace(text ?? "");
}
