# Brain

Brain is a markdown-first Obsidian plugin for quick capture, daily journaling, and lightweight summaries.

It keeps user data in normal vault files and works without AI. OpenAI is optional and only used for summaries or routing when configured.

The sidebar includes quick capture, inbox triage, review history, and summary actions so you can move from capture to review without leaving Obsidian.

## Features

- quick note capture into `Brain/inbox.md`
- quick task capture into `Brain/tasks.md`
- daily journal entries into `Brain/journal/YYYY-MM-DD.md`
- inbox triage with review markers and review history
- promoted notes into `Brain/notes/`
- recent markdown summaries with a fallback local summary
- optional OpenAI summaries and capture routing
- command palette actions and a persistent sidebar

## Install

1. Build the plugin:

```bash
npm install
npm run build
```

2. Copy the plugin files into your vault's plugin folder:

```text
main.js
manifest.json
styles.css
```

Place them in a plugin folder named `brain` inside `.obsidian/plugins/` in your vault.

3. Enable the plugin in Obsidian.

If you are developing locally, keep the repository folder inside your Obsidian community plugins directory and rebuild after changes.

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

## Inbox Review

The inbox review modal supports keyboard shortcuts for faster triage:

- `k` keep in inbox
- `t` convert to task
- `j` append to journal
- `n` promote to note
- `s` skip

## Default Vault Layout

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

## Settings

- inbox file path
- tasks file path
- journal folder
- notes folder
- summaries folder
- reviews folder
- AI summaries toggle
- AI routing toggle
- OpenAI API key
- OpenAI model
- summary lookback window
- summary character limit
- persist summaries toggle

## Development

```bash
npm run lint
npm test
npm run build
```

`npm test` runs a small smoke-test script that checks settings normalization, date formatting, and fallback summary output.

## Privacy

- All user content stays in the vault as markdown files.
- OpenAI requests are only made when AI settings are enabled and an API key is present.
- The plugin does not use embeddings, a vector database, or a backend service.

## License

MIT
