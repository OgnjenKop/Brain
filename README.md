# Brain

Brain is a markdown-first Obsidian plugin for fast capture, inbox review, daily journaling, and lightweight summaries.

It is built around a simple rule: your vault stays the source of truth. Notes, tasks, journal entries, summaries, and review logs all live in normal markdown files inside Obsidian. AI is optional and the core workflow still works without it.

The longer-term direction is to make Brain feel like a lightweight LLM wiki for the vault: not just a place to store markdown, but a way to query, synthesize, and reshape your notes into better knowledge artifacts.

## What It Does

- capture quick notes into `Brain/inbox.md`
- append tasks into `Brain/tasks.md`
- write daily journal entries into `Brain/journal/YYYY-MM-DD.md`
- review inbox items and promote them into tasks, journal entries, or standalone notes
- keep a review log in `Brain/reviews/`
- generate recent markdown summaries with a local fallback summarizer
- optionally use OpenAI for summaries and capture routing
- expose everything through commands and a persistent sidebar

## Why This Exists

Most AI note tools move too quickly toward opaque workflows, hidden storage, or heavy automation. Brain takes the opposite approach:

- markdown is the source of truth
- the plugin is useful without AI
- the architecture stays simple
- the workflow is optimized for low-friction daily use

Brain is meant to grow toward a stronger promise than capture alone:

- capture raw thoughts quickly
- select vault context deliberately
- ask Brain to synthesize or rewrite it
- keep the result as markdown you actually own

## Current Scope

Brain is intentionally small. It is not trying to be:

- an agent system
- a vector database
- a background automation engine
- a replacement for your vault structure

The focus is capture, review, and summary.

## Product Direction

The current release is the foundation layer:

- fast capture
- inbox review
- journaling
- markdown summaries

The next product step is to make Brain more obviously useful as an LLM wiki for Obsidian.

That means adding focused workflows like:

- ask Brain about the current note
- ask Brain about selected text
- synthesize recent notes into a cleaner artifact
- turn scattered markdown into more structured knowledge

The goal is not generic chat. The goal is useful markdown output over explicit vault context.

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

## Sidebar Workflow

The sidebar is the fastest way to use the plugin day to day. It includes:

- quick capture for note, task, and journal entry saves
- review actions for inbox processing and journal access
- summary actions
- status for inbox, tasks, AI, review history, and the last summary
- output panels for the latest action and summary

## Inbox Review

Inbox review is designed to help you move from raw capture to a cleaner vault.

Available actions:

- keep in inbox
- convert to task
- append to journal
- promote to note
- skip

Keyboard shortcuts in the review modal:

- `k` keep in inbox
- `t` convert to task
- `j` append to journal
- `n` promote to note
- `s` skip

Review actions are logged in markdown, and reviewed inbox items can be re-opened from review history.

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

## Installation

### From source

1. Install dependencies and build:

```bash
npm install
npm run build
```

2. Copy these files into a folder named `brain` inside your vault's `.obsidian/plugins/` directory:

```text
main.js
manifest.json
styles.css
```

3. Enable the plugin in Obsidian.

### Local development

If you are developing locally, place this repository directly inside `.obsidian/plugins/brain` and rebuild after changes:

```bash
npm run build
```

For active development:

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

## AI Behavior

AI is optional.

Without AI:

- capture works normally
- inbox review works normally
- summaries use the built-in fallback summarizer

With AI enabled and configured:

- summaries can use OpenAI
- sidebar auto-route can classify capture text as `note`, `task`, or `journal`

If AI is enabled but unavailable, the plugin falls back instead of crashing.

The intended direction for AI is synthesis over vault context, not autonomous behavior. Brain should help interpret and reshape your notes, not take over your workflow.

## Development

```bash
npm run lint
npm test
npm run build
```

`npm test` runs a small smoke-test suite for settings normalization, date formatting, inbox parsing, review-log parsing, and summary formatting.

## Privacy

- all user content stays in the vault as markdown files
- OpenAI requests are only made when AI settings are enabled and configured
- the plugin does not use embeddings, a vector database, or a backend service

## Status

This repository is currently a focused MVP with iterative polish on top. The design goal is to stay simple and extensible without overengineering the core workflow.

Current status:

- the capture, review, journal, and summary workflows are usable now
- the plugin is still early and intentionally narrow
- the next major iteration is planned around `Query + Synthesis`

## License

MIT
