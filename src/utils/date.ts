export function formatDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatTimeKey(date = new Date()): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatDateTimeKey(date = new Date()): string {
  return `${formatDateKey(date)} ${formatTimeKey(date)}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
