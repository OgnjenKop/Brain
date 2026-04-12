# Brain

Brain is a markdown-first Obsidian plugin for quick capture, daily journaling, and lightweight summaries.

It keeps user data in normal vault files and works without AI. OpenAI is optional and only used for summaries or routing when configured.

## Features

- quick note capture into `Brain/inbox.md`
- quick task capture into `Brain/tasks.md`
- daily journal entries into `Brain/journal/YYYY-MM-DD.md`
- recent-note summaries with a fallback local summary
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

3. Enable the plugin in Obsidian.

If you are developing locally, keep the repository folder inside your Obsidian community plugins directory and rebuild after changes.

## Commands

- `Brain: Capture Note`
- `Brain: Add Task`
- `Brain: Add Journal Entry`
- `Brain: Summarize Recent Notes`
- `Brain: Open Sidebar`

## Default Vault Layout

```text
Brain/
  inbox.md
  tasks.md
  journal/
    YYYY-MM-DD.md
  summaries/
```

## Settings

- inbox file path
- tasks file path
- journal folder
- summaries folder
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
