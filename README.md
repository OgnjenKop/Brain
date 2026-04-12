# Brain

Brain is an Obsidian plugin for turning a markdown vault into a lightweight LLM wiki.

It keeps markdown as the source of truth and makes the vault easier to query, synthesize, and reshape into useful knowledge artifacts.

## What Brain Is

Brain is built around a simple idea:

`your vault should be something you can think with, not just something you store text in`

That means:

- markdown files stay canonical
- the plugin stays local-first and simple
- LLM features are layered on top of explicit vault context
- output comes back as markdown you keep in your vault

## Current Foundation

- quick note capture into `Brain/inbox.md`
- quick task capture into `Brain/tasks.md`
- daily journal entries into `Brain/journal/YYYY-MM-DD.md`
- inbox triage with promotion to task, journal, or note
- review history with reopen support
- recent markdown summaries with a local fallback summarizer
- OpenAI summaries and sidebar auto-routing when configured
- command palette actions plus a persistent sidebar

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
- `Brain: Add Task`
- `Brain: Add Journal Entry`
- `Brain: Process Inbox`
- `Brain: Review History`
- `Brain: Summarize Recent Notes`
- `Brain: Summarize Today`
- `Brain: Summarize This Week`
- `Brain: Add Task From Selection`
- `Brain: Open Today's Journal`
- `Brain: Open Sidebar`

## Sidebar

The sidebar is the main day-to-day surface.

It includes:

- quick capture for note, task, and journal entry
- review actions for inbox processing and journal access
- summary actions
- status for inbox, tasks, AI, review history, and last summary
- output panels for the latest action and summary

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

With AI enabled:

- summaries can use OpenAI
- sidebar auto-route can classify capture text as `note`, `task`, or `journal`

Brain is moving toward a stronger AI workflow centered on query and synthesis over explicit vault context, not generic chat or autonomous behavior.

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

- enable AI summaries
- enable AI routing
- OpenAI API key
- OpenAI model

Summary behavior:

- lookback window
- maximum input characters
- persist summaries

Default model: `gpt-4.1-mini`

## Development

```bash
npm run lint
npm test
npm run build
```

`npm test` runs a smoke-test suite covering settings normalization, date formatting, inbox parsing, review-log parsing, and summary formatting.

## Privacy

- all user content stays in the vault as markdown files
- OpenAI requests are only made when AI settings are enabled and configured
- the plugin does not use embeddings, a vector database, or a backend service

## License

MIT
