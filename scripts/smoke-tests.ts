import assert from "node:assert/strict";
import type { TFile } from "obsidian";
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
import { VaultQueryService } from "../src/services/vault-query-service";
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
  const queryMatches = await queryService.queryVault("Alpha pricing", 10);
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
}

class FakeVaultService {
  private readonly files = new Map<string, {
    text: string;
    mtime: number;
  }>();

  constructor(seed: Record<string, { text: string; mtime: number }>) {
    for (const [path, payload] of Object.entries(seed)) {
      this.files.set(path, payload);
    }
  }

  async readText(path: string): Promise<string> {
    return this.files.get(path)?.text ?? "";
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
