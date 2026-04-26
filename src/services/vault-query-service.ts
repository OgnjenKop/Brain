import type { TFile } from "obsidian";
import { BrainPluginSettings } from "../settings/settings";
import { VaultService } from "./vault-service";

export interface VaultQueryMatch {
  path: string;
  title: string;
  score: number;
  reason: string;
  excerpt: string;
  text: string;
}

const MAX_QUERY_FILES = 12;
const MAX_EXCERPT_CHARS = 700;
const MAX_SNIPPET_LINES = 5;

export class VaultQueryService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async queryVault(query: string, limit = MAX_QUERY_FILES): Promise<VaultQueryMatch[]> {
    const settings = this.settingsProvider();
    const tokens = tokenize(query);
    const files = (await this.vaultService.listMarkdownFiles())
      .filter((file) => shouldIncludeFile(file, settings))
      .sort((left, right) => right.stat.mtime - left.stat.mtime);

    const matches: VaultQueryMatch[] = [];
    for (const file of files) {
      const text = await this.vaultService.readText(file.path);
      const score = scoreFile(file, text, query, tokens);
      if (score <= 0) {
        continue;
      }
      matches.push({
        path: file.path,
        title: titleForFile(file, text),
        score,
        reason: buildReason(file, text, query, tokens),
        excerpt: buildExcerpt(text, tokens),
        text,
      });
    }

    return matches
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}

function shouldIncludeFile(file: TFile, settings: BrainPluginSettings): boolean {
  return file.path !== settings.instructionsFile;
}

export function tokenize(input: string): string[] {
  const seen = new Set<string>();
  return input
    .toLowerCase()
    .split(/[^a-z0-9_/-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => {
      if (seen.has(token)) {
        return false;
      }
      seen.add(token);
      return true;
    })
    .slice(0, 24);
}

function scoreFile(file: TFile, text: string, query: string, tokens: string[]): number {
  if (!tokens.length) {
    return Math.max(1, Math.round(file.stat.mtime / 1000000000000));
  }

  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  const normalizedText = normalizePhrase(text);
  const normalizedQuery = normalizePhrase(query);
  let score = 0;
  if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
    score += 18;
  }
  if (normalizedQuery && lowerPath.includes(normalizedQuery)) {
    score += 24;
  }
  for (const token of tokens) {
    if (lowerPath.includes(token)) {
      score += 10;
    }
    if (lowerTitle.includes(token)) {
      score += 9;
    }
    const headingMatches = lowerText.match(new RegExp(`(^|\\n)#{1,6}[^\\n]*${escapeRegExp(token)}`, "g"));
    if (headingMatches) {
      score += headingMatches.length * 7;
    }
    const linkMatches = lowerText.match(new RegExp(`\\[\\[[^\\]]*${escapeRegExp(token)}[^\\]]*\\]\\]`, "g"));
    if (linkMatches) {
      score += linkMatches.length * 6;
    }
    const tagMatches = lowerText.match(new RegExp(`(^|\\s)#[-/_a-z0-9]*${escapeRegExp(token)}[-/_a-z0-9]*`, "gi"));
    if (tagMatches) {
      score += tagMatches.length * 5;
    }
    const textMatches = lowerText.match(new RegExp(escapeRegExp(token), "g"));
    if (textMatches) {
      score += Math.min(8, textMatches.length);
    }
  }

  const matchedTokens = tokens.filter((token) => lowerPath.includes(token) || lowerText.includes(token));
  score += matchedTokens.length * 3;
  if (matchedTokens.length === tokens.length) {
    score += Math.min(10, tokens.length * 2);
  }
  score += Math.min(3, file.stat.mtime / Date.now());
  return score;
}

function titleForFile(file: TFile, text: string): string {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) {
    return heading;
  }
  return file.basename || file.path.split("/").pop() || file.path;
}

function buildReason(file: TFile, text: string, query: string, tokens: string[]): string {
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  const normalizedText = normalizePhrase(text);
  const normalizedQuery = normalizePhrase(query);
  const reasons = new Set<string>();
  if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
    reasons.add("exact phrase match");
  }
  for (const token of tokens) {
    if (lowerPath.includes(token)) {
      reasons.add(`path matches "${token}"`);
    }
    if (lowerTitle.includes(token)) {
      reasons.add(`title matches "${token}"`);
    }
    if (lowerText.match(new RegExp(`(^|\\n)#{1,6}[^\\n]*${escapeRegExp(token)}`))) {
      reasons.add(`heading matches "${token}"`);
    }
    if (lowerText.includes(`[[${token}`) || lowerText.includes(`${token}]]`)) {
      reasons.add(`link mentions "${token}"`);
    }
    if (lowerText.match(new RegExp(`(^|\\s)#[-/_a-z0-9]*${escapeRegExp(token)}[-/_a-z0-9]*`, "i"))) {
      reasons.add(`tag matches "${token}"`);
    }
    if (lowerText.includes(token)) {
      reasons.add(`content mentions "${token}"`);
    }
  }
  return Array.from(reasons).slice(0, 3).join(", ") || "recent markdown note";
}

function buildExcerpt(text: string, tokens: string[]): string {
  const sourceLines = text.split("\n");
  const ranked = sourceLines
    .map((line, index) => ({ index, score: scoreLine(line, tokens) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const bestLine = ranked.find((line) => line.score > 0)?.index ?? 0;
  const start = Math.max(0, bestLine - 2);
  const end = Math.min(sourceLines.length, start + MAX_SNIPPET_LINES);
  const excerpt = sourceLines
    .slice(start, end)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  return excerpt.length > MAX_EXCERPT_CHARS
    ? `${excerpt.slice(0, MAX_EXCERPT_CHARS - 3).trimEnd()}...`
    : excerpt;
}

function scoreLine(line: string, tokens: string[]): number {
  const lower = line.toLowerCase();
  let score = 0;
  if (line.trim().startsWith("#")) {
    score += 4;
  }
  for (const token of tokens) {
    if (!lower.includes(token)) {
      continue;
    }
    score += 3;
    if (lower.includes(`[[${token}`) || lower.includes(`${token}]]`)) {
      score += 2;
    }
    if (lower.match(new RegExp(`(^|\\s)#[-/_a-z0-9]*${escapeRegExp(token)}[-/_a-z0-9]*`, "i"))) {
      score += 2;
    }
  }
  return score;
}

function normalizePhrase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
