# Brain

Chat with your Obsidian vault. Ask questions, file notes, and get source-backed answers — with AI proposing safe edits only after your approval.

> **Privacy-first.** No vector DB, no backend, no hidden indexing. Just markdown, your local Codex CLI, and explicit vault context.

---

## What It Does

Brain is a sidebar chat for Obsidian that understands your vault:

- **Ask** — "What do I know about Alpha pricing?" → Brain searches your markdown, ranks sources, and answers with evidence.
- **File** — "Add that Mark owns the follow-up by Friday" → Brain proposes the right markdown file and content, previews it, and writes only when you approve.
- **Iterate** — Conversation history lets you ask follow-ups naturally.

Every answer includes source snippets ranked by relevance (phrase match, headings, tags, wiki-links, recency). Every write is a safe append or create — never delete or overwrite.

---

## Requirements

- **Obsidian** 1.5.0+ (desktop only)
- **Codex CLI** installed and logged in: `npm install -g @openai/codex && codex login`

---

## Installation

### From Community Plugins (when available)

Search "Brain" in Obsidian's Community Plugins and install.

### Manual

1. Download the latest release: `main.js`, `manifest.json`, `styles.css`
2. Copy them to `.obsidian/plugins/brain/` in your vault
3. Enable **Brain** in Settings → Community Plugins

### From Source

```bash
git clone https://github.com/OgnjenKop/Brain.git
cd Brain
npm install
npm run build
```

Copy `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/brain/`.

---

## Quick Start

1. Open the sidebar: **Command Palette** → `Brain: Open Vault Chat`
2. Ask a question or paste rough notes
3. Review Brain's answer with expandable source snippets
4. If Brain proposes a write, review the preview modal, edit paths/content if needed, and approve

---

## Core Concepts

### Markdown-First

Your vault is the source of truth. Brain never creates hidden files, databases, or indexes. Everything it reads and writes is plain markdown.

### Source-Backed Answers

Brain scores every markdown file by relevance (exact phrase, title, heading, tag, wiki-link, content match, recency) and includes the top matches as expandable sources in every answer.

### Safe Writes Only

Brain can only propose two operations:
- **Append** to an existing `.md` file
- **Create** a new `.md` file

It cannot delete, overwrite, or target non-markdown files. Plans targeting `Brain/AGENTS.md`, dot-folders (`.obsidian/`), or paths with `..` are rejected automatically.

### Vault Instructions

`Brain/AGENTS.md` is created automatically. Edit it to customize Brain's behavior: preferred folders, linking style, filing rules, and tone. Brain reads this file before every chat.

---

## Sidebar Features

- **Chat input** with auto-resize and prompt chips
- **Source-backed answers** with ranked, expandable source snippets
- **Conversation history** — last 6 exchanges for contextual follow-ups
- **Write preview modal** — editable paths and content per operation, with approve/skip controls
- **Smart auto-scroll** — scrolls to bottom automatically unless you scroll up to read history; floating scroll-to-bottom button when needed
- **Copy buttons** on code blocks in answers
- **Model selector** — choose from installed Codex models or enter a custom model ID
- **Status indicator** — green when connected, amber when Codex needs setup
- **Quick links** to instructions file and settings

---

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Notes folder** | Default folder for new notes created from approved write plans | `Notes` |
| **Instructions file** | Markdown file that guides Brain's behavior | `Brain/AGENTS.md` |
| **Excluded folders** | One folder path per line. Brain skips markdown files inside these folders when searching. | `.obsidian`<br>`node_modules` |
| **Codex model** | Optional model override. Leave blank for account default. | *(blank)* |

---

## Commands

| Command | Action |
|---------|--------|
| `Brain: Open Vault Chat` | Open the Brain sidebar |
| `Brain: Open Instructions` | Open `Brain/AGENTS.md` in a new tab |

---

## How It Works

```
User message
    ↓
Vault query (tokenize → score files → rank by relevance + recency)
    ↓
Codex prompt: system instructions + vault context + conversation history + user message
    ↓
Codex runs in read-only sandbox from vault root
    ↓
Parse JSON response: answer + optional write plan
    ↓
If plan exists → preview modal → user approves → safe markdown writes
```

---

## Development

```bash
npm run lint     # TypeScript check
npm test         # Smoke tests
npm run build    # Bundle main.js
npm run dev      # Watch mode
```

Smoke tests cover settings normalization, Codex status parsing, vault query filtering, safe write-plan normalization, and exclude-folder behavior.

### Verify Installed Bundle

```bash
npm run build
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/brain/
OBSIDIAN_VAULT=/path/to/vault npm run smoke:installed
```

---

## Privacy

- All user content stays in the vault as markdown files
- Codex requests are only made when you send a chat message
- Authentication is handled by the local Codex CLI (Sign in with ChatGPT)
- No embeddings, vector databases, backend services, or hidden indexing
- No telemetry or analytics

---

## Roadmap

See [`V4_ROADMAP.md`](V4_ROADMAP.md) for planned features.

---

## License

MIT
