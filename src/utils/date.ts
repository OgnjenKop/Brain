export function formatDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatTimeKey(date = new Date()): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatDateTimeKey(date = new Date()): string {
  return `${formatDateKey(date)} ${formatTimeKey(date)}`;
}

export function formatSummaryTimestamp(date = new Date()): string {
  return `${formatDateKey(date)}-${pad2(date.getHours())}${pad2(date.getMinutes())}`;
}

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function collapseJournalText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

export function trimTrailingNewlines(text: string): string {
  return text.replace(/\n+$/g, "");
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
