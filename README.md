<div align="center">

# Brain

**Chat with your Obsidian vault. Ask questions, file notes, get source-backed answers — with AI proposing safe edits only after your approval.**

> Markdown-first. Privacy-first. No vector DB, no backend, no hidden indexing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7c3aed.svg)](https://obsidian.md/plugins)
[![Version](https://img.shields.io/badge/version-0.4.0-blueviolet.svg)](manifest.json)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933.svg)](package.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Table of Contents

- [Why Brain?](#why-brain)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Core Concepts](#core-concepts)
- [Sidebar Features](#sidebar-features)
- [Settings](#settings)
- [Commands](#commands)
- [Privacy & Security](#privacy--security)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Development](#development)
- [Project Layout](#project-layout)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Changelog](#changelog)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Why Brain?

Most "AI second brain" plugins hide what's happening: silent vector indexing, opaque writes, expensive hosted APIs. Brain does the opposite:

- **Markdown is the source of truth.** No embeddings, no databases, no caches you have to trust.
- **Retrieval is observable.** Every answer shows you the ranked markdown sources that backed it.
- **Writes are safe by construction.** Brain can only `append` to or `create` markdown files — never delete, never overwrite — and you see and edit the plan before it lands.
- **AI is local.** Brain shells out to the official [`@openai/codex`](https://www.npmjs.com/package/@openai/codex) CLI on your machine, authenticated by the CLI itself.

If you want a chat assistant for your vault that you can read, audit, and shut off, Brain is built for that.

## Features

- **Vault chat sidebar** — open with a single command from the Command Palette.
- **Source-backed answers** — every response includes expandable, ranked source snippets with the exact reasons they matched (phrase, heading, tag, wiki-link, recency).
- **Conversation history** — the last 6 exchanges stay in the sidebar for contextual follow-ups.
- **Per-operation write approval** — when Brain proposes a vault change, you see a modal with each path and content editable before you approve or skip. If any of the proposed operations were rejected during normalization (for example, non-markdown paths or dot-folder targets), the modal shows a count of dropped changes at the top.
- **Safe writes only** — `append` to an existing `.md` file, or `create` of a new `.md` file. Plans targeting `Brain/AGENTS.md`, dot-folders (`.obsidian/`), paths containing `..`, or non-markdown files are rejected automatically.
- **Editable vault instructions** — `Brain/AGENTS.md` is created automatically. Edit it to steer tone, preferred folders, linking style, and filing rules.
- **Configurable excluded folders** — keep plugin data, scratch notes, or generated content out of retrieval.
- **Codex model selector** — choose from models reported by the installed Codex CLI, or enter a custom model id.
- **Stop button** — cancel an in-flight Codex call from the sidebar.
- **Clear conversation** — wipe the in-memory chat history with one click; the button is disabled while a request is in flight.
- **Header quick links** — `Instructions` opens `Brain/AGENTS.md` in a new tab, `Settings` jumps to the Brain settings tab, and the trash icon clears the conversation.
- **Inline errors and stop messages** — chat failures are rendered as inline error turns in the conversation (still surfaced as a Notice), and a stopped request shows up as an info turn rather than disappearing silently.
- **Auto-scroll with manual override** — the chat scrolls to the latest answer by default, with a floating button when you scroll up to read history.
- **Copy buttons** on code blocks in answers.
- **Desktop-only** — uses the local Codex CLI, so it only runs on Obsidian Desktop.

## Requirements

- **Obsidian** 1.5.0 or later (desktop only)
- **Node.js** 18 or later — only required if you build from source
- **Codex CLI** installed and logged in on the same machine that runs Obsidian:
  ```bash
  npm install -g @openai/codex
  codex login
  ```
  Authentication is handled entirely by the local Codex CLI; Brain never sees or stores an API key.

## Installation

### From Community Plugins (when available)

Open **Settings → Community Plugins → Browse**, search for **Brain**, and install.

### Manual

1. Download the latest release assets: `main.js`, `manifest.json`, `styles.css`.
2. Copy them into your vault at `.obsidian/plugins/brain/`.
3. Enable **Brain** in **Settings → Community Plugins**.

### From Source

```bash
git clone https://github.com/OgnjenKop/Brain.git
cd Brain
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` from the repo root into your vault at `.obsidian/plugins/brain/`.

If you change the plugin id, the installed folder name, or the `manifest.json` in the repo, the manual install path will need to match.

## Quick Start

1. Open the sidebar: **Command Palette** → `Brain: Open Vault Chat`. The first time, the Brain view also appears in the right sidebar with a brain icon. The header has `Instructions`, `Settings`, and `Clear` controls once the sidebar is open.
2. Make sure the status indicator in the sidebar header is green. If it is amber, open **Settings → Brain** and run **Open Codex Setup** or **Recheck Status**.
3. Type a question about your vault, for example: *What do I know about Alpha pricing?*
4. Read the answer, expand the **Sources** section to verify the evidence, and follow up naturally.
5. When you ask Brain to file something, a **Review Vault Changes** modal appears with each path and content editable. Untick any operation you do not want, tweak the path or text, then **Approve and Write**. Cancelling is safe: the proposal stays on the message behind a **Review N proposed changes** button, so you can go check a note and come back to it.

## How It Works

```text
User message
    │
    ▼
Vault query (tokenize current + previous question → score files → rank)
    │   pass 1: path + metadata cache, no file reads, whole vault
    │   pass 2: file contents, in priority order, budget-capped
    │   excludes: instructions file, configured excluded folders
    ▼
Codex prompt: system instructions + vault context + conversation history + user message
    │   Codex runs in a read-only sandbox from an empty temp directory —
    │   it has no access to the vault beyond the context above
    ▼
Parse JSON response: answer + optional write plan
    │   plan operations are normalized: paths must end in .md, no ".." segment,
    │   no dot-folder targets, no targeting of the instructions file (any case)
    │   rejected operations are tracked as droppedOperations and skipped
    ▼
If plan exists → preview modal → user approves per operation → safe markdown writes
```

Brain does not maintain a hidden index. Every retrieval step re-reads the markdown files that match the user's prompt.

## Core Concepts

### Markdown-First

Your vault is the source of truth. Brain never creates hidden files, databases, or indexes. Everything it reads and writes is plain markdown in your vault.

### Source-Backed Answers

Brain scores every markdown file by relevance (exact phrase, title, heading, tag, wiki-link, content match, recency) and includes the top matches as expandable sources in every answer. The **Sources** list is exactly the set of files sent to Codex, so it never credits a file the model did not see.

Retrieval runs in two passes. The first pass scores every file in the vault from its path and Obsidian's metadata cache (headings, tags, links, aliases) and needs no file reads. The second pass reads file contents in that priority order, up to 1000 files per query. Vaults under 1000 markdown files are always scanned in full; above that, the files left unread are the ones with no path, heading, tag, link, or alias match and the oldest modification times.

### Follow-Ups Keep The Thread

A question like *"when is the next review?"* names no subject. Brain adds the terms from your previous question to the search at a reduced weight, so the follow-up retrieves notes about what you were just discussing without letting the old subject outrank what you actually asked. Sources retrieved this way say so — *content mentions "alpha" (from your previous question)*.

### Safe Writes Only

Brain can only propose two operations:

- **Append** to an existing `.md` file
- **Create** a new `.md` file

It cannot delete, overwrite, or target non-markdown files. Plans targeting `Brain/AGENTS.md`, dot-folders (`.obsidian/`), or paths with `..` are rejected automatically at the boundary, both during plan parsing and again at write time.

### Vault Instructions

`Brain/AGENTS.md` is created automatically the first time the plugin loads. Edit it to customize Brain's behavior in this vault: preferred folders, linking style, filing rules, tone, and what to ask back when information is missing. Brain reads this file before every chat.

## Sidebar Features

- **Chat input** with auto-resize and `Enter` to send (`Shift+Enter` for a newline).
- **Source-backed answers** with ranked, expandable source snippets that open the underlying note in a new tab.
- **Conversation history** — the last 6 exchanges for contextual follow-ups, with a **Clear** button in the header to wipe it on demand.
- **Write preview modal** — editable paths and content per operation, with per-operation checkboxes and approve/skip controls. Rejected operations surface a clear "skipped" notice at the top of the modal.
- **Smart auto-scroll** — scrolls to the bottom automatically unless you scroll up to read history; floating scroll-to-bottom button when needed.
- **Stop button** — cancel an in-flight Codex call without closing the sidebar.
- **Header quick links** — `Instructions` opens `Brain/AGENTS.md`; `Settings` jumps to the Brain settings tab.
- **Copy buttons** on code blocks in answers.
- **Model selector** — choose from installed Codex models or enter a custom model id.
- **Status indicator** — green when connected, amber when Codex is not ready. The detailed reason is in the **Brain** settings tab.

## Settings

| Setting | Description | Default |
| --- | --- | --- |
| **Notes folder** | Default folder for new notes created from approved write plans. Brain uses this when its answer says "create" but does not specify a path. | `Notes` |
| **Instructions file** | Markdown file that guides Brain's behavior in this vault. Created automatically on first load. | `Brain/AGENTS.md` |
| **Excluded folders** | One folder path per line. Brain never reads markdown inside these folders and never sends it to Codex. The default list covers `.obsidian` and `node_modules`. | `.obsidian`<br>`node_modules` |
| **Codex model** | Optional model override. Leave blank to use the account default reported by the Codex CLI. The dropdown is populated from `codex debug models`. | *(blank)* |
| **Codex timeout** | Seconds to wait for a Codex reply before giving up (15–900). Raise it if you use a slower reasoning model. | `120` |
| **Codex status** | Live read of the Codex CLI login state. Cached for 30 seconds; **Recheck Status** forces a fresh check. | — |
| **Codex setup** | Buttons to open the Codex setup page and to recheck login status. | — |

The **Codex status**, **Codex setup**, **Codex model**, and **Codex timeout** controls live under the **Codex CLI** section of the Brain settings tab.

## Commands

| Command | Action |
| --- | --- |
| `Brain: Open Vault Chat` | Open the Brain sidebar. |
| `Brain: Open Instructions` | Open `Brain/AGENTS.md` in a new tab. |

## Privacy & Security

- **No telemetry, no analytics.** Brain does not phone home.
- **No embeddings, vector databases, or hosted services.** Retrieval reads your markdown files directly.
- **Codex requests are only made when you send a chat message.** Idle, settings changes, and history browsing do not trigger any AI call.
- **Authentication is delegated to the local Codex CLI** (`codex login`). Brain never receives or stores an API key.
- **Writes are gated by `isSafeMarkdownPath`.** Paths that are non-markdown, contain a `..` segment, target a dot-folder, or target the instructions file are rejected before reaching the vault. The instructions-file check is case-insensitive, so `brain/agents.md` is rejected the same as `Brain/AGENTS.md`.
- **Codex never sees your vault directly.** It is launched from an empty temporary directory with `--sandbox read-only`, and is told it has no filesystem access. The only vault content that reaches the model is the source hints Brain assembles — which is exactly what the **Sources** list shows you. A file Brain did not retrieve was not read.
- **Excluded folders are enforced, not advisory.** Files inside them are never read, never ranked, and never sent. The same is true of the instructions file.
- **All persisted content stays in your vault** as normal markdown. There is no Brain-owned storage outside the vault.

## Troubleshooting

### Status indicator is amber after install

Open **Settings → Brain → Codex CLI** and run **Recheck Status**. If that still shows amber:

- Confirm `codex --version` works in your shell.
- Confirm `codex login status` reports you as logged in.
- If you installed Codex to a non-standard location, the bundled binary lookup already covers the common spots (Homebrew, `/usr/local/bin`, `~/.local/bin`, `~/.bun/bin`, the Codex desktop app, and on Windows `%LOCALAPPDATA%\Programs\Codex` plus `%APPDATA%\npm`). If yours is elsewhere, add it to your `PATH` and recheck.

### "Codex CLI is not installed"

Install it globally and log in:

```bash
npm install -g @openai/codex
codex login
```

Then return to Brain and click **Recheck Status**.

### "Codex did not respond in time"

Brain waits up to 120 seconds for a Codex reply. Long prompts, slow networks, or a Codex CLI that needs interactive approval can exceed that. Try a shorter message, confirm `codex login status` works outside Brain, and check the Codex CLI's own non-interactive configuration if you have not already.

### Brain proposes no sources for a question

- Confirm the question is grounded in markdown that exists. Brain will not invent sources.
- Check **Excluded folders** in settings — the file you expected may be in an excluded path.
- Open `Brain/AGENTS.md` in a new tab from the sidebar to confirm the instructions file is being read.

### I approved a write but nothing happened

- Look at the bottom notice. It reports the exact paths that were written, or a short reason if the plan was empty or invalid.
- The modal also shows a "skipped changes" notice at the top if any of the proposed operations were rejected during normalization (non-markdown paths, the instructions file, dot-folders, or paths with `..`). Those never reach the approval stage.
- Per-operation path validation is enforced both at plan parsing and at write time, so an "Invalid target path" notice means the path was rejected before anything was written.

## FAQ

**Does Brain train on my vault?**
No. Brain only sends your current message plus a compact source-hint summary to the Codex CLI when you send a chat. There is no indexing pipeline, no background job, and no embedded model state.

**Do I need an OpenAI API key?**
No. Brain uses whatever login the local Codex CLI uses. Run `codex login status` in your terminal; if it reports you as logged in, Brain can use it.

**Can Brain delete or rewrite files?**
No. The write plan is normalized to `append` or `create` only, paths are checked against `isSafeMarkdownPath`, and you approve each operation in a modal before anything is written. There is no UI surface that can issue a delete or overwrite.

**Can I keep plugin data, generated notes, or scratch folders out of retrieval?**
Yes, and the exclusion is enforced rather than advisory. Add them to **Excluded folders** in settings, one path per line. Brain never reads those files and never sends them to Codex, and Codex has no way to reach them on its own. The default list already excludes `.obsidian` and `node_modules`; add any other folder you want kept out, such as a scratch folder or a dot-folder used by a different plugin.

**Where does Brain keep my conversation history?**
In memory only. The last 6 exchanges are kept in the sidebar while it is open, and they are lost when the sidebar is closed or Obsidian is restarted. There is no on-disk transcript.

**Can Codex read notes that Brain did not retrieve?**
No. Brain runs it from an empty temporary directory with `--sandbox read-only`, and the prompt states it has no filesystem access. Whatever the model saw is what the **Sources** list shows. This is what makes the answer auditable: if a claim is not supported by a listed source, it is not supported by your vault.

The trade-off is that a bad retrieval cannot be rescued by the model going to look for itself. Brain is built to fail visibly here — it is told to say what is missing and what you might search for instead, rather than guess.

**Will Brain work on Obsidian Mobile?**
No. The plugin is `isDesktopOnly: true` because it shells out to a local CLI.

## Development

```bash
npm run lint     # TypeScript type check
npm test         # Smoke tests (settings, codex status, vault query, safe writes, excludes)
npm run build    # Bundle main.js
npm run dev      # Watch mode for the bundle
```

The smoke tests cover settings normalization (including the Codex timeout clamp), Codex status parsing, Codex model catalog parsing, chat-response JSON parsing, path safety, query tokenization, vault query filtering, safe write-plan normalization (including the `droppedOperations` count), and exclude-folder behavior. Add or extend tests in `scripts/smoke-tests.ts` when you change any of those surfaces.

### Verify an Installed Bundle

After `npm run build`, point the installed-bundle smoke test at the vault where you copied the files:

```bash
npm run build
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/brain/
OBSIDIAN_VAULT=/path/to/vault npm run smoke:installed
```

The installed-bundle test asserts that the files in the vault's plugin folder are byte-identical to the build output, and that the manifest and bundle still expose the expected command and view ids.

## Project Layout

```text
.
├── AGENTS.md                  # Contributor guide for this repo
├── CONTRIBUTING.md            # How to file issues, send PRs, and run checks
├── CHANGELOG.md               # Release notes
├── LICENSE                    # MIT
├── README.md                  # You are here
├── V4_ROADMAP.md              # Current product direction and planned work
├── manifest.json              # Obsidian plugin manifest
├── main.ts                    # Plugin entry point
├── main.js                    # Generated bundle (do not edit by hand)
├── styles.css                 # Sidebar and modal styles
├── esbuild.config.mjs         # Bundle configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Scripts and dependencies
├── scripts/
│   ├── smoke-tests.ts                 # Unit-style smoke tests
│   ├── run-smoke-tests.mjs            # Test runner (esbuild + node)
│   └── installed-smoke-tests.mjs      # Verifies a vault install
└── src/
    ├── commands/register-commands.ts
    ├── settings/{settings,settings-tab}.ts
    ├── services/
    │   ├── ai-service.ts
    │   ├── auth-service.ts
    │   ├── instruction-service.ts
    │   ├── vault-chat-service.ts
    │   ├── vault-query-service.ts
    │   ├── vault-service.ts
    │   └── vault-write-service.ts
    ├── utils/
    │   ├── ai-config.ts
    │   ├── codex-auth.ts
    │   ├── codex-models.ts
    │   ├── date.ts
    │   ├── error-handler.ts
    │   ├── node-runtime.ts
    │   └── path-safety.ts
    └── views/
        ├── sidebar-view.ts
        └── vault-plan-modal.ts
```

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, and [`AGENTS.md`](AGENTS.md) for the contributor rules and the product boundaries that keep Brain small and reviewable.

Please:

- Keep changes small and reviewable.
- Run `npm run lint`, `npm test`, and `npm run build` before requesting review.
- Update the README, the contributor guide, and the smoke tests in the same pass when you change user-facing behavior.
- Do not commit secrets, API keys, or local vault paths.

## Roadmap

See [`V4_ROADMAP.md`](V4_ROADMAP.md) for the current product direction, what is already shipped, and what is being considered next.

## Changelog

Release notes live in [`CHANGELOG.md`](CHANGELOG.md). The format follows [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/) where practical.

## License

[MIT](LICENSE) — see the license file for the full text.

## Acknowledgments

- [Obsidian](https://obsidian.md/) for the plugin platform and the local-first markdown vault.
- [OpenAI](https://openai.com/) for the [`@openai/codex`](https://www.npmjs.com/package/@openai/codex) CLI that powers Brain's chat and write planning.
- Everyone who files issues, sends PRs, and shares how they use Brain in their own vaults.
