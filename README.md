# Brain

Brain is a markdown-first vault chat for Obsidian.

It lets you ask what is already in your vault and tell Brain what to file. Brain searches explicit markdown context, answers with sources, and previews safe markdown writes before anything changes.

## What Brain Is

Brain is built around a simple idea:

`chat with the vault, keep markdown in control`

That means:

- markdown files stay canonical
- vault lookup is explicit and source-backed
- AI can propose edits, but the plugin applies only approved safe operations
- no hidden index, vector database, backend, or autonomous background agent
- vault behavior is guided by an editable markdown instruction file

## Core Workflow

Use the Brain sidebar as a chat surface:

```text
You: What do I know about Alpha pricing?
Brain: Searches vault markdown, answers with evidence and sources.

You: Add that Mark owns the follow-up by Friday.
Brain: Proposes safe markdown updates, then writes only after approval.
```

Brain supports two first-class flows in the same chat:

- retrieval: ask questions about existing vault information
- input: file rough information into the right markdown location

## Vault Layout

By default, Brain uses:

```text
Brain/
  AGENTS.md

Notes/
```

`Brain/AGENTS.md` is created automatically. Edit it to tell Brain how to operate in your vault: preferred folders, linking style, filing rules, and safety rules.

`Notes/` is the default folder Brain suggests for new notes. You can change it in settings.

Brain does not create dedicated inbox, task, journal, summary, or review files.

## Commands

- `Brain: Open Vault Chat`
- `Brain: Open Instructions`

## Sidebar

The sidebar is the main interface.

It includes:

- chat input for retrieval and filing requests
- source-backed answers from vault markdown
- source snippets ranked by phrase, heading, path, tag, wiki-link, and content matches
- editable preview modal for proposed writes
- per-operation approve/skip controls before writing
- quick access to `Brain/AGENTS.md`
- Codex model selector
- Codex status and settings access

Proposed writes are limited to safe operations:

- append to an existing markdown file
- create a new markdown file

Brain does not delete or overwrite existing user content. Write plans that target `Brain/AGENTS.md`, hidden dot-folders such as `.obsidian/`, parent-directory traversal, or non-markdown files are rejected.

## AI

Brain is AI-only and uses the local Codex CLI. A working Codex login is required before chat requests can run.

With Codex configured:

- Brain retrieves relevant markdown context from the vault
- Brain answers from retrieved vault context
- Brain can propose filing plans for rough input
- Codex uses the official local Codex CLI and its `Sign in with ChatGPT` flow

AI requests include only the instruction file, the user message, and selected markdown context from the vault.

## Settings

Storage:

- notes folder
- instructions file

Codex:

- Codex setup via the local `codex login` flow with status recheck
- optional Codex model selector in settings and the chat sidebar, populated from `codex debug models`

## Safety Model

Brain is intentionally not a freeform file-editing agent.

The safe write path is:

```text
chat message
-> vault query
-> AI proposes structured operations
-> preview modal
-> user approves
-> plugin writes markdown
```

The AI never receives permission to directly edit the vault.

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

## Development

```bash
npm run lint
npm test
npm run build
```

`npm test` runs smoke tests for settings normalization, Codex status parsing, vault query filtering, and safe write-plan normalization.

To verify the built plugin bundle is installed into an Obsidian vault:

```bash
npm run build
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/brain/
OBSIDIAN_VAULT=/path/to/vault npm run smoke:installed
```

If `OBSIDIAN_VAULT` is not set, the installed-bundle smoke test checks `/Users/ognjen.koprivica/Documents/Obsidian_Vault`. This verifies the installed plugin files and bundled command IDs; it does not launch Obsidian.

## Roadmap

See `V4_ROADMAP.md` for the current product roadmap.

## Privacy

- all persisted user content stays in the vault as markdown files
- Codex requests are only made when you chat with Brain
- Codex authentication is handled by the local Codex CLI
- the plugin does not use embeddings, a vector database, or a backend service

## License

MIT
