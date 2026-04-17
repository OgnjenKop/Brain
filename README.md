# Brain

Brain is a markdown-first synthesis layer for Obsidian.

It keeps markdown as the source of truth and helps you turn explicit vault context into durable markdown artifacts.

## What Brain Is

Brain is built around a simple idea:

`your vault should be something you can think with, not just something you store text in`

That means:

- markdown files stay canonical
- the plugin stays local-first and simple
- LLM features are layered on top of explicit vault context
- output comes back as markdown you keep in your vault

The core promise is simple:

`select context → synthesize it → keep the result`

## Core Workflow

- quick note capture into `Brain/inbox.md`
- quick task capture into `Brain/tasks.md`
- daily journal entries into `Brain/journal/YYYY-MM-DD.md`
- inbox triage with promotion to task, journal, or note
- review history with reopen support
- daily and weekly markdown summaries with a local fallback summarizer
- synthesis over the current note, selection, folder, recent files, or a chosen note group
- ask Brain a freeform question about the current note, a selected group, a folder, or the entire vault
- create durable topic pages from an explicit topic and vault context
- vault-wide questions exclude Brain-generated summaries and review logs to avoid recursion
- choose between summarize, task extraction, decision extraction, open-question extraction, clean-note rewriting, and project-brief drafting
- OpenAI and Gemini synthesis and sidebar auto-routing when configured
- OAuth-style browser authentication for easy provider connection
- command palette actions plus a persistent sidebar

Topic pages are the flagship artifact. They turn chosen context into reusable markdown you can revisit, expand, and link across the vault.

## Vault Layout

By default, Brain writes to:

```text
Brain/
  inbox.md
  tasks.md
  journal/
    YYYY-MM-DD.md
  notes/
  reviews/
  summaries/
```

All paths are configurable in settings.

## Commands

- `Brain: Capture Note`
- `Brain: Capture Task`
- `Brain: Capture Journal Entry`
- `Brain: Review Inbox`
- `Brain: Open Review History`
- `Brain: Create Today Summary`
- `Brain: Create Weekly Summary`
- `Brain: Capture Task From Selection`
- `Brain: Open Today's Journal`
- `Brain: Synthesize Notes`
- `Brain: Synthesize Current Note`
- `Brain: Ask Question`
- `Brain: Ask Question About Current Note`
- `Brain: Create Topic Page`
- `Brain: Create Topic Page From Current Note`
- `Brain: Open Brain Sidebar`

## Sidebar

The sidebar is the main day-to-day surface.

It includes:

- quick capture into inbox, tasks, or journal
- topic-page creation as the signature artifact flow
- synthesis actions: summarize current note, synthesize current note with template picker, extract tasks from selection, draft brief from folder, clean note from recent files, or synthesize selected notes
- a scoped question flow for the current note, a folder, or the entire vault
- topic page creation from the current note, a folder, or the entire vault
- fast default outputs for common jobs plus a choose-template path for current note and picked notes
- template picker for summarize, extract tasks, extract decisions, extract open questions, rewrite as clean note, and draft project brief
- scope picker for synthesis, questions, and topic pages
- review actions for inbox processing and review history
- optional capture auto-routing when AI routing is enabled
- status for inbox, tasks, AI, review history, and last artifact
- output panels for the latest result and last artifact
- collapsible sections to reduce UI density (state persists across reloads)
- keyboard shortcuts for quick capture: n (note), t (task), j (journal), c (clear)
- accessibility support with ARIA labels on interactive elements

## Inbox Review

Inbox review is designed to turn raw capture into cleaner markdown.

Available actions:

- keep in inbox
- convert to task
- append to journal
- promote to note
- skip

Keyboard shortcuts:

- `k` keep in inbox
- `t` convert to task
- `j` append to journal
- `n` promote to note
- `s` skip

Review actions are written to markdown logs in `Brain/reviews/`, and reviewed items can be re-opened from review history.

## AI

Without AI:

- capture works normally
- inbox review works normally
- summaries use the built-in fallback summarizer
- question answering uses a local evidence-based fallback
- synthesis templates and topic pages still return structured markdown

With AI enabled:

- synthesis, questions, summaries, and topic pages can use OpenAI or Google Gemini
- sidebar auto-route can classify capture text as `note`, `task`, or `journal`
- browser-based authentication for easy connection to providers
- support for custom OpenAI-compatible endpoints (Ollama, LM Studio, etc.)
- session/access token support for ChatGPT Plus subscriptions

Brain is designed around query and synthesis over explicit vault context, not generic chat or autonomous behavior.
It turns chosen context into durable markdown in `Brain/notes/`.

## Roadmap

The v0.4 release track is documented in `V4_ROADMAP.md`. Milestones 1 (extraction quality), 3 (large-vault responsiveness), and 4 (UX consistency) are shipped. Milestone 2 (behavior-level regression coverage) is next.

## Installation

### From source

1. Build the plugin:

```bash
npm install
npm run build
```

2. Copy these files into `.obsidian/plugins/brain/` inside your vault:

```text
main.js
manifest.json
styles.css
```

3. Enable the plugin in Obsidian.

### Local development

Place this repository directly in `.obsidian/plugins/brain` and use:

```bash
npm run dev
```

## Settings

Storage:

- inbox file path
- tasks file path
- journal folder
- notes folder
- summaries folder
- reviews folder

AI:

- enable AI synthesis
- enable AI routing
- AI Provider (OpenAI/ChatGPT or Google Gemini)
- Provider authentication (Connect/Disconnect via browser)
- API key / Session token storage
- OpenAI base URL (for custom proxies or local LLMs)
- Model selection (dropdown with common models or custom entry)

Context collection:

- lookback window
- maximum input characters

Summary output:

- persist summaries

UI:

- collapsed sidebar sections (persists your section collapse preferences)

Default models: `gpt-4o-mini` (OpenAI), `gemini-1.5-flash` (Gemini)

## Development

```bash
npm run lint
npm test
npm run build
```

`npm test` runs a smoke-test suite covering settings normalization, date formatting, inbox/review-log parsing, synthesis template formatting and normalization, context formatting, and behavior-level count/cache paths.

## Privacy

- all user content stays in the vault as markdown files
- OpenAI/Gemini requests are only made when AI settings are enabled and configured
- requests use official provider endpoints unless overridden by a custom base URL
- the plugin does not use embeddings, a vector database, or a backend service

## License

MIT
