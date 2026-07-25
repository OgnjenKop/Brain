import assert from "node:assert/strict";
import type { CachedMetadata, TFile } from "obsidian";
import {
  DEFAULT_BRAIN_SETTINGS,
  normalizeBrainSettings,
} from "../src/settings/settings";
import {
  formatDateKey,
  formatDateTimeKey,
  formatTimeKey,
} from "../src/utils/date";
import { parseCodexLoginStatus } from "../src/utils/codex-auth";
import { parseCodexModelCatalog } from "../src/utils/codex-models";
import { isSafeMarkdownPath, samePath } from "../src/utils/path-safety";
import { parseChatResponse } from "../src/services/vault-chat-service";
import { VaultQueryService, tokenize } from "../src/services/vault-query-service";
import { VaultWriteService } from "../src/services/vault-write-service";

const TEST_MTIME_BASE = 100;

async function run(): Promise<void> {
  const normalized = normalizeBrainSettings({
    notesFolder: "  Knowledge  ",
    codexModel: "  gpt-5  ",
  });

  assert.equal(normalized.notesFolder, "Knowledge");
  assert.equal(normalized.codexModel, "gpt-5");
  assert.equal(normalized.instructionsFile, DEFAULT_BRAIN_SETTINGS.instructionsFile);
  assert.equal(normalized.excludeFolders, DEFAULT_BRAIN_SETTINGS.excludeFolders);
  assert.ok(!("openAIModel" in normalized));
  assert.ok(!("openAIApiKey" in normalized));
  assert.ok(!("openAIBaseUrl" in normalized));
  assert.ok(!("aiProvider" in normalized));
  assert.ok(!("geminiApiKey" in normalized));
  assert.ok(!("geminiModel" in normalized));
  assert.ok(!("inboxFile" in normalized));
  assert.ok(!("tasksFile" in normalized));
  assert.ok(!("journalFolder" in normalized));
  assert.ok(!("summariesFolder" in normalized));
  assert.ok(!("reviewsFolder" in normalized));
  assert.ok(!("summaryLookbackDays" in normalized));

  const withExcludes = normalizeBrainSettings({
    excludeFolders: "  .obsidian/ \n node_modules \n\n",
  });
  assert.equal(withExcludes.excludeFolders, ".obsidian\nnode_modules");

  const emptyExcludes = normalizeBrainSettings({
    excludeFolders: "",
  });
  assert.equal(emptyExcludes.excludeFolders, "");

  assert.equal(normalized.codexTimeoutSeconds, DEFAULT_BRAIN_SETTINGS.codexTimeoutSeconds);
  assert.equal(normalizeBrainSettings({ codexTimeoutSeconds: 300 }).codexTimeoutSeconds, 300);
  assert.equal(normalizeBrainSettings({ codexTimeoutSeconds: 1 }).codexTimeoutSeconds, 15);
  assert.equal(normalizeBrainSettings({ codexTimeoutSeconds: 99999 }).codexTimeoutSeconds, 900);
  assert.equal(
    normalizeBrainSettings({ codexTimeoutSeconds: "nonsense" }).codexTimeoutSeconds,
    DEFAULT_BRAIN_SETTINGS.codexTimeoutSeconds,
  );

  assert.equal(parseCodexLoginStatus("Logged in using ChatGPT"), "logged-in");
  assert.equal(parseCodexLoginStatus("Signed in with ChatGPT"), "logged-in");
  assert.equal(parseCodexLoginStatus("Authenticated as user@example.com"), "logged-in");
  assert.equal(parseCodexLoginStatus("Not logged in"), "logged-out");
  assert.equal(parseCodexLoginStatus(""), "logged-out");
  assert.deepEqual(
    parseCodexModelCatalog([
      "warning text",
      JSON.stringify({
        models: [
          { slug: "gpt-test", display_name: "GPT Test", visibility: "list" },
          { slug: "hidden-test", display_name: "Hidden", visibility: "hidden" },
        ],
      }),
    ].join("\n")),
    [
      { value: "", label: "Account default" },
      { value: "gpt-test", label: "GPT Test" },
    ],
  );

  const date = new Date("2026-04-11T22:15:00");
  assert.equal(formatDateKey(date), "2026-04-11");
  assert.equal(formatTimeKey(date), "22:15");
  assert.equal(formatDateTimeKey(date), "2026-04-11 22:15");

  // Codex returns bare JSON whose answer often contains a fenced code block.
  // Matching a fence before trying the whole payload used to swallow both the
  // answer and the plan.
  const answerWithFence = "Run this:\n\n```bash\nls -la\n```\n\nDone.";
  const withFence = parseChatResponse(JSON.stringify({
    answer: answerWithFence,
    plan: { summary: "File it", operations: [] },
  }));
  assert.equal(withFence.answer, answerWithFence);
  assert.deepEqual(withFence.plan, { summary: "File it", operations: [] });

  const fencedJson = parseChatResponse("```json\n{\"answer\": \"Fenced\", \"plan\": null}\n```");
  assert.equal(fencedJson.answer, "Fenced");
  assert.equal(fencedJson.plan, null);

  const proseWrapped = parseChatResponse("Sure thing.\n{\"answer\": \"Embedded\"}\nHope that helps.");
  assert.equal(proseWrapped.answer, "Embedded");

  const notJson = parseChatResponse("  Just prose, no JSON at all.  ");
  assert.equal(notJson.answer, "Just prose, no JSON at all.");
  assert.equal(notJson.plan, null);

  const arrayPlan = parseChatResponse(JSON.stringify({ answer: "No plan", plan: ["nope"] }));
  assert.equal(arrayPlan.plan, null);

  // The instructions file is off limits regardless of case, because Brain runs
  // on case-insensitive filesystems.
  assert.ok(samePath("brain/agents.md", "Brain/AGENTS.md"));
  assert.ok(!isSafeMarkdownPath("brain/agents.md", DEFAULT_BRAIN_SETTINGS));
  assert.ok(!isSafeMarkdownPath("Brain/AGENTS.md", DEFAULT_BRAIN_SETTINGS));
  assert.ok(!isSafeMarkdownPath("../escape.md", DEFAULT_BRAIN_SETTINGS));
  assert.ok(!isSafeMarkdownPath("Notes/../../escape.md", DEFAULT_BRAIN_SETTINGS));
  assert.ok(!isSafeMarkdownPath(".obsidian/data.md", DEFAULT_BRAIN_SETTINGS));
  assert.ok(!isSafeMarkdownPath("Notes/plain.txt", DEFAULT_BRAIN_SETTINGS));
  assert.ok(isSafeMarkdownPath("Notes/project.md", DEFAULT_BRAIN_SETTINGS));
  // A literal ".." inside a filename is not traversal and stays allowed.
  assert.ok(isSafeMarkdownPath("Notes/v1.2..md", DEFAULT_BRAIN_SETTINGS));

  // Two-character terms carry real signal ("AI", "Q3", "v2") and used to be
  // dropped, leaving those queries with no tokens at all.
  assert.deepEqual(tokenize("What is my Q3 AI plan?"), ["q3", "ai", "plan"]);
  assert.deepEqual(tokenize("the of and to"), []);

  const writeService = new VaultWriteService({} as never, () => DEFAULT_BRAIN_SETTINGS);
  const normalizedPlan = writeService.normalizePlan({
    summary: "  File project note  ",
    confidence: "certain",
    operations: [
      null,
      { type: "append", path: "../bad.md", content: "Nope" },
      { type: "append", path: ".obsidian/plugins/brain/data.md", content: "Nope" },
      { type: "append", path: "Brain/AGENTS.md", content: "Nope" },
      { type: "replace", path: "Notes/project.md", content: "Nope" },
      { type: "append", path: "Notes/project.md", content: "  Keep this  " },
      { type: "unsupported", content: "  Call Alex  " },
    ],
    questions: ["  Confirm owner?  ", ""],
  });
  assert.equal(normalizedPlan.summary, "File project note");
  assert.equal(normalizedPlan.confidence, "medium");
  assert.equal(normalizedPlan.operations.length, 1);
  assert.deepEqual(normalizedPlan.operations[0], {
    type: "append",
    path: "Notes/project.md",
    content: "Keep this",
    description: undefined,
  });
  assert.equal(normalizedPlan.droppedOperations, 6);
  assert.deepEqual(normalizedPlan.questions, ["Confirm owner?"]);

  const queryVault = new FakeVaultService({
    "Notes/project-alpha.md": {
      text: [
        "# Alpha Pricing",
        "",
        "Owner: Mira",
        "Alpha pricing is approved.",
        "Next review is Friday.",
      ].join("\n"),
      mtime: TEST_MTIME_BASE + 10,
    },
    "Tasks.md": {
      text: "- [ ] Follow up on Alpha pricing",
      mtime: TEST_MTIME_BASE + 11,
    },
    "Inbox.md": {
      text: "- Alpha raw capture",
      mtime: TEST_MTIME_BASE + 12,
    },
    "Brain/AGENTS.md": {
      text: "Alpha instruction should stay internal",
      mtime: TEST_MTIME_BASE + 13,
    },
    "Reference/old-note.md": {
      text: "Alpha archived note can be queried like any normal note.",
      mtime: TEST_MTIME_BASE + 14,
    },
    "Notes/beta-notes.md": {
      text: "# Beta Review\n\nNext review is Monday.",
      mtime: TEST_MTIME_BASE + 17,
    },
    ".obsidian/plugins/brain/data.md": {
      text: "Alpha plugin data",
      mtime: TEST_MTIME_BASE + 15,
    },
    "node_modules/some-package/readme.md": {
      text: "Alpha package readme",
      mtime: TEST_MTIME_BASE + 16,
    },
  });
  const queryService = new VaultQueryService(queryVault as never, () => DEFAULT_BRAIN_SETTINGS);
  const queryMatches = await queryService.queryVault("Alpha pricing", { limit: 10 });
  assert.ok(queryMatches.some((match) => match.path === "Notes/project-alpha.md"));
  assert.ok(queryMatches.some((match) => match.path === "Tasks.md"));
  assert.ok(queryMatches.some((match) => match.path === "Inbox.md"));
  assert.ok(queryMatches.some((match) => match.path === "Reference/old-note.md"));
  assert.ok(!queryMatches.some((match) => match.path === "Brain/AGENTS.md"));
  assert.ok(!queryMatches.some((match) => match.path === ".obsidian/plugins/brain/data.md"));
  assert.ok(!queryMatches.some((match) => match.path === "node_modules/some-package/readme.md"));
  assert.equal(queryMatches[0].path, "Notes/project-alpha.md");
  assert.match(queryMatches[0].reason, /exact phrase match|heading matches/);
  assert.match(queryMatches[0].excerpt, /Owner: Mira/);
  assert.match(queryMatches[0].excerpt, /Alpha pricing is approved/);

  // A follow-up carries no subject of its own. On its own it retrieves the
  // generic review note; with the previous question in hand it retrieves the
  // note the conversation is actually about.
  const followUp = "When is the next review?";
  const withoutContext = await queryService.queryVault(followUp, { limit: 10 });
  assert.equal(withoutContext[0].path, "Notes/beta-notes.md");

  const withContext = await queryService.queryVault(followUp, {
    limit: 10,
    priorQuery: "What do I know about Alpha pricing?",
  });
  assert.equal(withContext[0].path, "Notes/project-alpha.md");
  assert.match(
    withContext.find((match) => match.path === "Notes/project-alpha.md")!.reason,
    /previous question/,
  );

  // Carried terms must not outrank the current question on their own: a note
  // that only matches the prior subject stays below the on-topic results.
  assert.ok(
    withContext.findIndex((match) => match.path === "Notes/project-alpha.md")
      < withContext.findIndex((match) => match.path === "Inbox.md"),
  );

  await runScanBudgetTest();
}

/**
 * Above the content-scan budget, files are read in priority order rather than
 * by recency alone. Both needles here are the oldest files in the vault and
 * would be cut if the budget were filled newest-first.
 */
async function runScanBudgetTest(): Promise<void> {
  const seed: Record<string, FakeFile> = {};
  for (let index = 0; index < 1200; index += 1) {
    seed[`Filler/note-${index}.md`] = {
      text: "Filler content with nothing of interest.",
      mtime: TEST_MTIME_BASE + 2000 + index,
    };
  }
  // Reachable because its path matches, despite being the oldest file.
  seed["Archive/needle-log.md"] = {
    text: "Nothing quotable here.",
    mtime: TEST_MTIME_BASE,
  };
  // Reachable because its heading matches, with no path match at all.
  seed["Archive/2019-notes.md"] = {
    text: "# Needle Topic\n\nThe answer is 42.",
    mtime: TEST_MTIME_BASE,
    metadata: { headings: [{ heading: "Needle Topic" }] } as CachedMetadata,
  };

  const service = new VaultQueryService(
    new FakeVaultService(seed) as never,
    () => DEFAULT_BRAIN_SETTINGS,
  );
  const matches = await service.queryVault("needle topic", { limit: 5 });
  const paths = matches.map((match) => match.path);

  assert.equal(paths[0], "Archive/2019-notes.md");
  assert.ok(paths.includes("Archive/needle-log.md"));
  assert.ok(!paths.some((path) => path.startsWith("Filler/")));
}

interface FakeFile {
  text: string;
  mtime: number;
  metadata?: CachedMetadata;
}

class FakeVaultService {
  private readonly files = new Map<string, FakeFile>();

  constructor(seed: Record<string, FakeFile>) {
    for (const [path, payload] of Object.entries(seed)) {
      this.files.set(path, payload);
    }
  }

  async readText(path: string): Promise<string> {
    return this.files.get(path)?.text ?? "";
  }

  async readFileText(file: TFile): Promise<string> {
    return this.files.get(file.path)?.text ?? "";
  }

  getFileMetadata(file: TFile): CachedMetadata | null {
    return this.files.get(file.path)?.metadata ?? null;
  }

  async listMarkdownFiles(): Promise<TFile[]> {
    return Array.from(this.files.entries())
      .filter(([path]) => path.endsWith(".md"))
      .map(([path, payload]) => ({
        path,
        basename: path.split("/").pop()?.replace(/\.md$/, "") ?? path,
        stat: {
          ctime: payload.mtime,
          mtime: payload.mtime,
          size: payload.text.length,
        },
      }) as TFile);
  }
}

void run().then(() => {
  console.log("smoke tests passed");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
