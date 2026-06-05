# Brain Roadmap (v0.4.x)

Brain is focused on one product direction: an Obsidian-native vault chat that retrieves information from markdown and files approved updates back into the vault. This document tracks the current baseline, the near-term work, and the non-goals that keep the plugin narrow and reviewable.

## Shipped Baseline (0.4.x)

- Vault chat sidebar with auto-resizing input and conversation history (last 6 exchanges).
- Editable `Brain/AGENTS.md` operating instructions file, created on first load.
- `Brain: Open Instructions` command to open `Brain/AGENTS.md` in a new tab.
- Header quick links: `Instructions` opens the instructions file, `Settings` jumps to the Brain settings tab, and a `Clear` button wipes the in-memory conversation.
- Inline error and stop turns so chat failures and stopped requests are visible in the conversation thread, not only in Notices.
- Deterministic vault query over markdown files with ranked, expandable source snippets.
- AI-backed answers over compact source hints, with Codex running from the vault root in a read-only sandbox.
- AI-backed safe write plans (`append`, `create`) with editable per-operation approval modal. The modal surfaces a count of any operations that were rejected during normalization.
- Codex model selector populated from `codex debug models`, with a custom model id override.
- Codex status indicator and recheck button in settings and the sidebar; the recheck now shows a "Rechecking…" placeholder while it runs.
- Configurable excluded folders for vault queries. The default list covers `.obsidian` and `node_modules`; the query path does not auto-exclude every dot-folder, so other sensitive folders have to be added explicitly.
- Strengthened recency tuning (1d / 7d / 30d / 90d score buckets).
- Stop button, smart auto-scroll, copy buttons on code blocks, and a clean composer DOM.
- Installed-bundle smoke test for verifying a local Obsidian plugin folder.
- Unit-style smoke tests for settings, Codex status, Codex model catalog, vault query, safe writes, and excludes.

## Near-Term Improvements

1. **Better retrieval quality**
   - Improved multi-note result grouping and clearer source snippet highlighting.
   - Frontmatter-aware matching for tags, aliases, and titles.
   - Optional recency filters the user can toggle in the sidebar.

2. **Stronger live Obsidian testing**
   - Launch Obsidian against a fixture vault from a script.
   - Verify command registration from the running app.
   - Exercise the sidebar chat surface manually or through UI automation.
   - Capture screenshots of the write preview flow for the docs.

3. **Better write previews**
   - Clearer warnings when an operation creates a new file versus appending.
   - Open the affected note in a new tab after approval.
   - Section-level append previews so users can see exactly which heading gets the new content.

4. **Stronger instruction support**
   - Default examples for common vault layouts (Zettelkasten, PARA, daily notes).
   - Validation warnings for contradictory instructions.

## Later Improvements

- Dedicated "Ask Vault" source browser that runs a query without sending it to Codex.
- Saved chat transcripts as markdown, opt-in per session.
- Optional web research with citations, still routed through the Codex CLI.
- Link suggestion previews in the sidebar.
- Duplicate-note detection before `create` operations.
- Section append under a selected heading.
- User-defined filing rules in frontmatter or instruction blocks.
- Optional semantic retrieval, still vault-local and explicit.

## Non-Goals

- No hidden background indexing pipeline. Retrieval always reads the live vault.
- No autonomous unattended writes. Every write is gated by an explicit user approval.
- No direct AI file editing. The model proposes a plan; Brain applies the plan only after approval.
- No backend service requirement. The plugin runs entirely against the local Codex CLI.
- No vector database in the default product. Retrieval is keyword and phrase based over plain markdown.
- No dedicated Brain inbox, tasks, journal, summaries, or review-history files. Brain only writes the user-facing instructions file and the markdown files the user approves.

## How to Suggest Roadmap Changes

Open an issue and link to the relevant section above. The contributor guide in [`AGENTS.md`](AGENTS.md) lists the product boundaries that the roadmap is built on top of, so reading both will help proposals land faster.
