export function getInboxReviewCompletionMessage(keptCount: number): string {
  if (keptCount <= 0) {
    return "Inbox review complete";
  }

  if (keptCount === 1) {
    return "Review pass complete; 1 entry remains in inbox.";
  }

  return `Review pass complete; ${keptCount} entries remain in inbox.`;
}
