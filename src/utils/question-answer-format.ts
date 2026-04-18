import { formatListSection, safeCollapseWhitespace } from "./format-helpers";

function extractKeywords(question: string): string[] {
  const stopwords = new Set([
    "what",
    "why",
    "how",
    "which",
    "when",
    "where",
    "who",
    "whom",
    "does",
    "do",
    "did",
    "is",
    "are",
    "was",
    "were",
    "the",
    "a",
    "an",
    "to",
    "of",
    "for",
    "and",
    "or",
    "in",
    "on",
    "at",
    "with",
    "about",
    "from",
    "my",
    "our",
    "your",
    "this",
    "that",
    "these",
    "those",
    "make",
    "made",
    "need",
    "needs",
    "can",
    "could",
    "should",
    "would",
    "will",
    "have",
    "has",
    "had",
  ]);

  return Array.from(
    new Set(
      question
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((word) => word.trim())
        .filter((word) => word.length >= 4 && !stopwords.has(word)),
    ),
  );
}

function matchesQuestion(line: string, keywords: string[]): boolean {
  if (!keywords.length) {
    return false;
  }

  const lower = line.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

function collectEvidence(content: string, question: string): {
  evidence: Set<string>;
  matched: boolean;
} {
  const evidence = new Set<string>();
  const keywords = extractKeywords(question);
  let matched = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("--- ")) {
      continue;
    }

    if (/^<!--\s*brain-reviewed:/i.test(line)) {
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const headingText = safeCollapseWhitespace(heading[1]);
      if (headingText && (matchesQuestion(headingText, keywords) || evidence.size < 3)) {
        if (matchesQuestion(headingText, keywords)) {
          matched = true;
        }
        evidence.add(headingText);
      }
      continue;
    }

    const task = line.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
    if (task) {
      const taskText = safeCollapseWhitespace(task[2]);
      if (taskText && (matchesQuestion(taskText, keywords) || evidence.size < 3)) {
        if (matchesQuestion(taskText, keywords)) {
          matched = true;
        }
        evidence.add(taskText);
      }
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(?!\[( |x|X)\]\s+)(.+)$/);
    if (bullet) {
      const bulletText = safeCollapseWhitespace(bullet[2]);
      if (bulletText && (matchesQuestion(bulletText, keywords) || evidence.size < 4)) {
        if (matchesQuestion(bulletText, keywords)) {
          matched = true;
        }
        evidence.add(bulletText);
      }
      continue;
    }

    if (matchesQuestion(line, keywords) || evidence.size < 2) {
      if (matchesQuestion(line, keywords)) {
        matched = true;
      }
      evidence.add(safeCollapseWhitespace(line));
    }
  }

  return {
    evidence,
    matched,
  };
}

export function buildFallbackQuestionAnswer(question: string, content: string): string {
  const cleanedQuestion = safeCollapseWhitespace(question);
  const { evidence, matched } = collectEvidence(content, cleanedQuestion);
  const answerLines: string[] = [];

  if (matched) {
    answerLines.push(
      "I found these lines in the selected context that directly match your question.",
    );
    answerLines.push("The context does not provide a fully verified answer, so treat this as a grounded summary.");
  } else if (evidence.size) {
    answerLines.push(
      "I could not find a direct match in the selected context, so these are the closest lines available.",
    );
    answerLines.push("Treat this as nearby context rather than a confirmed answer.");
  } else {
    answerLines.push("I could not find a direct answer in the selected context.");
    answerLines.push("Try narrowing the question or selecting a more specific note or folder.");
  }

  const followUps = matched || evidence.size
    ? new Set([
        "Ask a narrower question if you want a more specific answer.",
        "Open the source note or folder for additional context.",
      ])
    : new Set([
        "Provide more explicit context or select a different note or folder.",
      ]);

  return [
    "# Answer",
    "",
    "## Question",
    cleanedQuestion || "No question provided.",
    "",
    "## Answer",
    answerLines.join(" "),
    "",
    "## Evidence",
    formatListSection(evidence, "No direct evidence found."),
    "",
    "## Follow-ups",
    formatListSection(followUps, "No follow-ups identified."),
  ].join("\n");
}
