import type { CachedMetadata, TFile } from "obsidian";
import { BrainPluginSettings, parseExcludeFolders } from "../settings/settings";
import { isInsideFolder, samePath } from "../utils/path-safety";
import { VaultService } from "./vault-service";

export interface VaultQueryMatch {
  path: string;
  title: string;
  score: number;
  reason: string;
  excerpt: string;
}

const MAX_QUERY_FILES = 12;
/**
 * Upper bound on how many files get their contents read for one query.
 *
 * Files are read in order of a score built from path, title and Obsidian's
 * metadata cache (headings, tags, links, aliases), none of which needs a file
 * read. Vaults smaller than this are scanned in full, so this only takes effect
 * on very large vaults — and when it does, the files it skips are the ones with
 * no path, heading, tag, link or alias match and the oldest modification times.
 */
const MAX_CONTENT_SCAN_FILES = 1000;
/**
 * Excerpts are the model's entire view of a note, so they carry a real window
 * of content rather than a teaser. The previous 5-line/700-char snippet was
 * sized for a model that could open the file itself.
 */
const MAX_EXCERPT_CHARS = 1200;
const MAX_SNIPPET_LINES = 12;
const MIN_TOKEN_LENGTH = 2;
const MAX_TOKENS = 24;
/**
 * How much a term carried over from the previous question counts, relative to a
 * term in the current one. Follow-ups like "when is the next review?" depend on
 * the subject of the prior turn, but that subject must not outrank what the
 * user actually just asked.
 */
const CARRIED_TOKEN_WEIGHT = 0.4;
const STOP_WORDS = new Set([
  "about",
  "am",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "go",
  "have",
  "he",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "know",
  "list",
  "me",
  "my",
  "no",
  "not",
  "of",
  "on",
  "or",
  "so",
  "the",
  "this",
  "that",
  "to",
  "up",
  "us",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
]);

/**
 * Regexes for one query token, compiled once per query instead of once per
 * file. A large vault multiplies this by thousands of files, so building them
 * inside the scoring loop dominated query time.
 */
interface TokenMatcher {
  token: string;
  weight: number;
  heading: RegExp;
  link: RegExp;
  tag: RegExp;
  occurrences: RegExp;
}

interface Candidate {
  file: TFile;
  pathScore: number;
  preScore: number;
}

export interface VaultQueryOptions {
  limit?: number;
  /**
   * The previous user message. Its terms are scored at a reduced weight so a
   * short follow-up still retrieves notes about the subject under discussion.
   */
  priorQuery?: string;
}

export class VaultQueryService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly settingsProvider: () => BrainPluginSettings,
  ) {}

  async queryVault(query: string, options: VaultQueryOptions = {}): Promise<VaultQueryMatch[]> {
    const limit = options.limit ?? MAX_QUERY_FILES;
    const settings = this.settingsProvider();

    const primaryTokens = tokenize(query);
    const carriedTokens = tokenize(options.priorQuery ?? "")
      .filter((token) => !primaryTokens.includes(token));
    const matchers = [
      ...buildTokenMatchers(primaryTokens, 1),
      ...buildTokenMatchers(carriedTokens, CARRIED_TOKEN_WEIGHT),
    ];
    const primaryCount = primaryTokens.length;
    const normalizedQuery = normalizePhrase(query);

    const excludeFolders = parseExcludeFolders(settings.excludeFolders);
    const files = (await this.vaultService.listMarkdownFiles())
      .filter((file) => shouldIncludeFile(file, settings.instructionsFile, excludeFolders))
      .sort((left, right) => right.stat.mtime - left.stat.mtime);

    const candidates = this.selectScanCandidates(files, matchers, normalizedQuery);

    const scored: Array<{ file: TFile; score: number }> = [];
    for (const candidate of candidates) {
      const text = await this.vaultService.readFileText(candidate.file);
      const score = scoreFile(candidate, text, matchers, normalizedQuery, primaryCount);
      if (score <= 0) {
        continue;
      }
      scored.push({ file: candidate.file, score });
    }

    const top = scored
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);

    // Reasons and excerpts are only needed for results the caller will actually
    // use, so they are built after ranking rather than for every match.
    const matches: VaultQueryMatch[] = [];
    for (const { file, score } of top) {
      const text = await this.vaultService.readFileText(file);
      matches.push({
        path: file.path,
        title: titleForFile(file, text),
        score,
        reason: buildReason(file, text, matchers, normalizedQuery),
        excerpt: buildExcerpt(text, matchers),
      });
    }
    return matches;
  }

  /**
   * Decides which files are worth reading. Path scoring is free; metadata
   * scoring is only worth computing when the scan budget actually binds.
   */
  private selectScanCandidates(
    files: TFile[],
    matchers: TokenMatcher[],
    normalizedQuery: string,
  ): Candidate[] {
    const withinBudget = files.length <= MAX_CONTENT_SCAN_FILES;
    const candidates = files.map((file) => {
      const pathScore = scorePath(file, matchers, normalizedQuery);
      return {
        file,
        pathScore,
        preScore: withinBudget
          ? pathScore
          : pathScore + scoreMetadata(this.vaultService.getFileMetadata(file), matchers),
      };
    });

    if (withinBudget) {
      return candidates;
    }

    // `files` is already sorted newest-first, and sort is stable, so files with
    // equal signal keep recency order.
    return candidates
      .sort((left, right) => right.preScore - left.preScore)
      .slice(0, MAX_CONTENT_SCAN_FILES);
  }
}

function shouldIncludeFile(file: TFile, instructionsFile: string, excludeFolders: string[]): boolean {
  if (samePath(file.path, instructionsFile)) {
    return false;
  }
  return !excludeFolders.some((folder) => isInsideFolder(file.path, folder));
}

export function tokenize(input: string): string[] {
  const seen = new Set<string>();
  return input
    .toLowerCase()
    .split(/[^a-z0-9_/-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= MIN_TOKEN_LENGTH)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => {
      if (seen.has(token)) {
        return false;
      }
      seen.add(token);
      return true;
    })
    .slice(0, MAX_TOKENS);
}

function buildTokenMatchers(tokens: string[], weight: number): TokenMatcher[] {
  return tokens.map((token) => {
    const escaped = escapeRegExp(token);
    return {
      token,
      weight,
      heading: new RegExp(`(^|\\n)#{1,6}[^\\n]*${escaped}`, "g"),
      link: new RegExp(`\\[\\[[^\\]]*${escaped}[^\\]]*\\]\\]`, "g"),
      tag: new RegExp(`(^|\\s)#[-/_a-z0-9]*${escaped}[-/_a-z0-9]*`, "g"),
      occurrences: new RegExp(escaped, "g"),
    };
  });
}

function scorePath(file: TFile, matchers: TokenMatcher[], normalizedQuery: string): number {
  const lowerPath = file.path.toLowerCase();
  let score = 0;
  if (normalizedQuery && lowerPath.includes(normalizedQuery)) {
    score += 24;
  }
  for (const matcher of matchers) {
    if (lowerPath.includes(matcher.token)) {
      score += 10 * matcher.weight;
    }
  }
  return score;
}

/**
 * Scores a file from Obsidian's parsed metadata, which needs no file read.
 * Used only to prioritize the content scan, so a coarse signal is enough.
 */
function scoreMetadata(metadata: CachedMetadata | null, matchers: TokenMatcher[]): number {
  if (!metadata) {
    return 0;
  }
  const blob = metadataBlob(metadata);
  if (!blob) {
    return 0;
  }
  let score = 0;
  for (const matcher of matchers) {
    if (blob.includes(matcher.token)) {
      score += 8 * matcher.weight;
    }
  }
  return score;
}

function metadataBlob(metadata: CachedMetadata): string {
  const parts: string[] = [];
  for (const heading of metadata.headings ?? []) {
    parts.push(heading.heading);
  }
  for (const tag of metadata.tags ?? []) {
    parts.push(tag.tag);
  }
  for (const link of metadata.links ?? []) {
    parts.push(link.link);
    if (link.displayText) {
      parts.push(link.displayText);
    }
  }
  for (const alias of frontmatterAliases(metadata)) {
    parts.push(alias);
  }
  return parts.join("\n").toLowerCase();
}

function frontmatterAliases(metadata: CachedMetadata): string[] {
  const aliases = metadata.frontmatter?.aliases;
  if (typeof aliases === "string") {
    return [aliases];
  }
  if (Array.isArray(aliases)) {
    return aliases.filter((alias): alias is string => typeof alias === "string");
  }
  return [];
}

function scoreFile(
  candidate: Candidate,
  text: string,
  matchers: TokenMatcher[],
  normalizedQuery: string,
  primaryCount: number,
): number {
  if (!matchers.length) {
    // Nothing to match on, so every file is equally relevant. Callers sort by
    // mtime before scoring, and the sort afterwards is stable, which leaves the
    // most recently modified notes on top.
    return 1;
  }

  const { file } = candidate;
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  let score = candidate.pathScore;
  if (containsPhrase(lowerText, normalizedQuery)) {
    score += 18;
  }
  for (const matcher of matchers) {
    let tokenScore = 0;
    if (lowerTitle.includes(matcher.token)) {
      tokenScore += 9;
    }
    tokenScore += countMatches(lowerText, matcher.heading) * 7;
    tokenScore += countMatches(lowerText, matcher.link) * 6;
    tokenScore += countMatches(lowerText, matcher.tag) * 5;
    tokenScore += Math.min(8, countMatches(lowerText, matcher.occurrences));
    score += tokenScore * matcher.weight;
  }

  const matched = matchers.filter(
    (matcher) => lowerPath.includes(matcher.token) || lowerText.includes(matcher.token),
  );
  for (const matcher of matched) {
    score += 3 * matcher.weight;
  }
  // The completeness bonus is about the current question, so carried-over terms
  // neither earn it nor block it.
  const matchedPrimary = matched.filter((matcher) => matcher.weight === 1).length;
  if (primaryCount > 0 && matchedPrimary === primaryCount) {
    score += Math.min(10, primaryCount * 2);
  }
  score += recencyBonus(file);
  return score;
}

function recencyBonus(file: TFile): number {
  const ageDays = (Date.now() - file.stat.mtime) / (1000 * 60 * 60 * 24);
  if (ageDays < 1) {
    return 10;
  }
  if (ageDays < 7) {
    return 6;
  }
  if (ageDays < 30) {
    return 3;
  }
  if (ageDays < 90) {
    return 1;
  }
  return 0;
}

/**
 * Whitespace-insensitive phrase match. Only collapses whitespace when the query
 * actually contains some, which avoids copying every file's text in the common
 * single-word case.
 */
function containsPhrase(lowerText: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return false;
  }
  if (!/\s/.test(normalizedQuery)) {
    return lowerText.includes(normalizedQuery);
  }
  return lowerText.replace(/\s+/g, " ").includes(normalizedQuery);
}

function countMatches(text: string, pattern: RegExp): number {
  pattern.lastIndex = 0;
  return text.match(pattern)?.length ?? 0;
}

function titleForFile(file: TFile, text: string): string {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) {
    return heading;
  }
  return file.basename || file.path.split("/").pop() || file.path;
}

function buildReason(
  file: TFile,
  text: string,
  matchers: TokenMatcher[],
  normalizedQuery: string,
): string {
  const lowerPath = file.path.toLowerCase();
  const lowerTitle = titleForFile(file, text).toLowerCase();
  const lowerText = text.toLowerCase();
  const reasons = new Set<string>();
  if (containsPhrase(lowerText, normalizedQuery)) {
    reasons.add("exact phrase match");
  }
  for (const matcher of matchers) {
    const label = matcher.weight === 1
      ? `"${matcher.token}"`
      : `"${matcher.token}" (from your previous question)`;
    if (lowerPath.includes(matcher.token)) {
      reasons.add(`path matches ${label}`);
    }
    if (lowerTitle.includes(matcher.token)) {
      reasons.add(`title matches ${label}`);
    }
    if (countMatches(lowerText, matcher.heading) > 0) {
      reasons.add(`heading matches ${label}`);
    }
    if (countMatches(lowerText, matcher.link) > 0) {
      reasons.add(`link mentions ${label}`);
    }
    if (countMatches(lowerText, matcher.tag) > 0) {
      reasons.add(`tag matches ${label}`);
    }
    if (lowerText.includes(matcher.token)) {
      reasons.add(`content mentions ${label}`);
    }
  }
  return Array.from(reasons).slice(0, 3).join(", ") || "recent markdown note";
}

function buildExcerpt(text: string, matchers: TokenMatcher[]): string {
  const sourceLines = text.split("\n");
  const ranked = sourceLines
    .map((line, index) => ({ index, score: scoreLine(line, matchers) }))
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

function scoreLine(line: string, matchers: TokenMatcher[]): number {
  const lower = line.toLowerCase();
  let score = 0;
  if (line.trim().startsWith("#")) {
    score += 4;
  }
  for (const matcher of matchers) {
    if (!lower.includes(matcher.token)) {
      continue;
    }
    let lineScore = 3;
    if (lower.includes(`[[${matcher.token}`) || lower.includes(`${matcher.token}]]`)) {
      lineScore += 2;
    }
    if (countMatches(lower, matcher.tag) > 0) {
      lineScore += 2;
    }
    score += lineScore * matcher.weight;
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
