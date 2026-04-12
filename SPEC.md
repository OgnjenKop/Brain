# Brain Plugin Spec

## Overview

Brain is an Obsidian plugin that turns a markdown vault into a lightweight AI-assisted second brain.

The MVP is a fast, markdown-first capture and review tool. It supports:

- quick note capture
- quick task capture
- daily journal entries
- recent-note summaries
- optional OpenAI-powered summaries and routing

This is a single-plugin MVP. It is not an agent system and does not use embeddings, a vector database, or a backend.

## Product Principles

1. Markdown is the source of truth.
2. Core flows work without AI.
3. Interactions are fast and low-friction.
4. The architecture stays simple.
5. The foundation remains extensible.

## MVP Scope

### In Scope

- command palette actions
- sidebar panel
- settings tab
- note capture
- task capture
- journal capture
- summary generation
- optional OpenAI integration

### Out of Scope

- agents
- embeddings
- vector databases
- backend services
- automation workflows

## Core Product Definition

### Capture Note

Appends a timestamped inbox entry to a single markdown file. In MVP, this is an inbox capture flow, not a standalone note creator.

### Add Task

Appends a markdown checkbox line to a single tasks file. MVP does not include projects, due dates, priorities, or completion workflows.

### Add Journal Entry

Appends a timestamped entry to today’s daily journal file.

### Summarize Recent Notes

Builds a summary from recently modified markdown files in the vault, excluding Brain-generated summary output to avoid recursion.

### Open Sidebar

Opens a persistent Brain sidebar with quick capture and summary actions.

## Locked Decisions

- Markdown files inside the vault are the only persisted user data.
- All capture flows are append-only where possible.
- There is no background automation.
- AI is optional and never required for core functionality.
- Non-AI smart routing is out of scope.
- AI routing is opt-in and only used when triggered from the sidebar.
- Summary persistence is controlled by settings.
- The plugin should never overwrite user content except by appending to known target files.

## Default User Data Layout

```text
Brain/
  inbox.md
  tasks.md
  journal/
    YYYY-MM-DD.md
  summaries/
```

## Markdown File Formats

### Inbox

Path: `Brain/inbox.md`

```md
## 2026-04-11 22:15
- Thought here
```

Rules:

- Each capture creates a new heading block.
- The note text is written as a single bullet under that heading.
- The file is created automatically if missing.

### Tasks

Path: `Brain/tasks.md`

```md
- [ ] Send proposal _(added 2026-04-11 22:15)_
```

Rules:

- Each task is appended as a single markdown checkbox line.
- The plugin does not toggle task state in MVP.
- The plugin does not deduplicate tasks.

### Journal

Path: `Brain/journal/YYYY-MM-DD.md`

```md
# 2026-04-11

## 22:15
Entry text
```

Rules:

- If the daily file does not exist, create it with the `# YYYY-MM-DD` title.
- Each new entry appends a `## HH:mm` heading and the entry text below it.
- Entries are separated by blank lines.

### Summaries

Path pattern: `Brain/summaries/YYYY-MM-DD-HHmm.md`

Suggested persisted format:

```md
# Summary 2026-04-11 22:15

## Window
Last 7 days

## Highlights
...

## Tasks
...

## Follow-ups
...
```

Rules:

- A summary file is created only when `persistSummaries` is enabled.
- Timestamped names preserve history and avoid collisions.

## Commands

- `Brain: Capture Note`
- `Brain: Add Task`
- `Brain: Add Journal Entry`
- `Brain: Summarize Recent Notes`
- `Brain: Open Sidebar`

### Command Behavior

#### Brain: Capture Note

- Opens a small input modal.
- Rejects empty or whitespace-only input.
- Appends to `inboxFile`.
- Shows a success notice.

#### Brain: Add Task

- Opens a small input modal.
- Rejects empty or whitespace-only input.
- Appends to `tasksFile`.
- Shows a success notice.

#### Brain: Add Journal Entry

- Opens a multiline input modal.
- Rejects empty or whitespace-only input.
- Appends to today’s journal file inside `journalFolder`.
- Shows a success notice.

#### Brain: Summarize Recent Notes

- Gathers recent markdown files.
- Uses AI summary only if enabled and usable.
- Otherwise uses the fallback summary.
- Displays the result in the sidebar if open and otherwise via a modal or notice-backed output.
- Persists the result only when `persistSummaries` is enabled.

#### Brain: Open Sidebar

- Reveals the Brain custom view in the right sidebar by default.

## Sidebar Contract

### Quick Capture

- multiline text area
- `Save as Note`
- `Save as Task`
- `Save as Journal`

Behavior:

- The shared textarea is the input source for all capture actions.
- On successful save, clear the textarea.
- On failure, leave the input untouched.

### AI Actions

- `Summarize`
- `Auto-route` only when AI routing is enabled

Behavior:

- If AI is not configured, the UI still works and uses fallback behavior where applicable.

### Output Area

- shows last successful result
- shows latest summary text

This is ephemeral UI state, not a persisted activity log.

## Settings

```ts
interface BrainPluginSettings {
  inboxFile: string;
  tasksFile: string;
  journalFolder: string;
  summariesFolder: string;

  enableAISummaries: boolean;
  enableAIRouting: boolean;

  openAIApiKey: string;
  openAIModel: string;

  summaryLookbackDays: number;
  summaryMaxChars: number;

  persistSummaries: boolean;
}
```

### Recommended Defaults

```ts
{
  inboxFile: "Brain/inbox.md",
  tasksFile: "Brain/tasks.md",
  journalFolder: "Brain/journal",
  summariesFolder: "Brain/summaries",
  enableAISummaries: false,
  enableAIRouting: false,
  openAIApiKey: "",
  openAIModel: "gpt-4.1-mini",
  summaryLookbackDays: 7,
  summaryMaxChars: 12000,
  persistSummaries: true
}
```

### Validation Rules

- All paths must be relative vault paths.
- `summaryLookbackDays` minimum is `1`.
- `summaryMaxChars` minimum is `1000`.
- If AI is enabled without an API key, the plugin warns and falls back cleanly.

## Summary Logic

### File Collection

- Include markdown files in the vault.
- Exclude files under `summariesFolder`.
- Exclude future plugin internal output that would cause recursion.
- Filter by Obsidian file modified time, not inferred content dates.

### Processing Pipeline

1. Collect markdown files modified within `summaryLookbackDays`.
2. Sort them by modified time descending.
3. Read contents.
4. Concatenate content until `summaryMaxChars` is reached.
5. Use AI summary if enabled and configured.
6. Otherwise use fallback summary.

If no recent content exists, return:

```md
## Highlights
No recent notes found.

## Tasks
No recent tasks found.

## Follow-ups
Nothing pending from recent notes.
```

## Fallback Summary

The fallback summary should be deterministic and cheap.

Extraction rules:

- `Highlights`: headings plus a few meaningful paragraphs or bullet lines
- `Tasks`: markdown task lines matching `- [ ]`
- `Follow-ups`: lightweight next steps inferred from open tasks or repeated bullets

Output shape:

```md
## Highlights
- ...
- ...

## Tasks
- [ ] ...
- [ ] ...

## Follow-ups
- ...
- ...
```

Constraints:

- Keep output concise.
- Do not invent facts.
- Prefer plain summaries over fake insight when the input is sparse.

## AI Contract

### AI Summaries

Use AI only when:

- `enableAISummaries` is `true`
- API key exists
- model string is set

Prompt:

```text
Summarize the following vault content into exactly these sections:

## Highlights
## Tasks
## Follow-ups

Be concise, do not invent facts, and preserve actionable tasks.
```

### AI Routing

Use AI routing only when `enableAIRouting` is `true`.

Input is the sidebar text. Output must be exactly one of:

- `note`
- `task`
- `journal`

Prompt:

```text
Classify the following user input as exactly one of:
note
task
journal

Return only one word.
```

If routing fails or returns an invalid label:

- do not auto-route
- show an error notice
- keep the text in the sidebar

## Error Handling

The plugin must fail softly in all expected error cases.

### Missing File

- Create it automatically if it is a known target file.

### Missing Folder

- Create it automatically if it is a known target folder.

### Missing API Key

- Show a notice.
- Fall back to non-AI behavior if possible.

### AI Failure

- Catch the error.
- Show a notice.
- Fall back for summaries.
- Abort auto-routing while preserving text input.

### Malformed Settings

- Use defaults where possible.
- Never crash plugin load because of invalid settings.

### Vault Read or Write Failure

- Show a notice.
- Do not clear user input when the action fails.

## Suggested Internal Architecture

```text
main.ts
src/settings/
src/services/vault-service.ts
src/services/note-service.ts
src/services/task-service.ts
src/services/journal-service.ts
src/services/summary-service.ts
src/services/ai-service.ts
src/views/sidebar-view.ts
src/utils/
```

Responsibilities:

- `main.ts`: plugin bootstrap, command registration, view registration, settings tab registration
- `settings`: settings interface, defaults, settings tab UI
- `vault-service`: file existence, folder existence, append, read, list markdown files
- `note-service`: append inbox notes
- `task-service`: append tasks
- `journal-service`: append journal entries
- `summary-service`: collect files, build fallback summary, generate summaries
- `ai-service`: summarize and classify
- `sidebar-view`: UI for capture, summary, and output
- `utils`: date formatting, path normalization, text extraction helpers

## MVP UX Rules

- Every successful action should show a short Obsidian notice.
- Every failed action should show a short actionable error.
- The sidebar should feel instant.
- Commands should work even if the sidebar was never opened.
- The plugin should never silently modify unrelated files.

## What To Avoid

- Creating separate note files for quick capture in MVP
- Editing or reorganizing user notes automatically
- Expensive whole-vault parsing on every keystroke
- Complex task parsing or due-date inference
- Embeddings, agents, workflows, or automation systems

## Definition of Done

The MVP is complete when:

- the plugin loads without runtime errors
- all five commands are registered and usable
- the sidebar opens and supports quick capture
- inbox note capture appends correctly
- task capture appends correctly
- journal capture creates and appends correctly
- summary works without an API key
- summary optionally uses OpenAI when configured
- persisted files are valid markdown stored in the vault
- failures surface through notices instead of crashes
