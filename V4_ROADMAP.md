# Brain Roadmap

Brain is now focused on one product direction: an Obsidian-native vault chat that retrieves information from markdown and files approved updates back into the vault.

## Shipped Baseline

- Vault chat sidebar
- Editable `Brain/AGENTS.md` operating instructions
- Command and sidebar button to open `Brain/AGENTS.md`
- Deterministic vault query over markdown files with ranked source snippets
- AI-backed answers over compact source hints, with Codex running from the vault root in a read-only sandbox
- AI-backed safe write plans
- Editable per-operation approval modal before writes
- Safe write operations: append, create
- AI support: Codex CLI via ChatGPT
- Installed-bundle smoke test for local Obsidian plugin files
- Configurable excluded folders for vault queries
- Strengthened recency tuning (1d/7d/30d/90d score buckets)
- Session-local conversation history (last 6 exchanges) for contextual follow-ups

## Near-Term Improvements

1. Improve vault retrieval quality
   - better multi-note result grouping
   - frontmatter-aware matching
   - clearer source snippet highlighting

2. Improve live Obsidian testing
   - launch Obsidian against a fixture vault
   - verify command registration from the running app
   - exercise the sidebar chat surface manually or through UI automation
   - capture screenshots of the write preview flow

3. Improve write previews
   - clearer warnings for new files
   - open updated files after approval
   - section-level append previews

4. Strengthen instruction support
   - default examples for common vault layouts
   - validation warnings for contradictory instructions

## Later Improvements

- Dedicated "Ask Vault" source browser
- Saved chat transcripts as markdown
- Optional web research with citations
- Link suggestion previews
- Duplicate-note detection before create operations
- Section append under a selected heading
- User-defined filing rules in frontmatter or instruction blocks
- Optional semantic retrieval, still vault-local and explicit

## Non-Goals

- No hidden background indexing pipeline
- No autonomous unattended writes
- No direct AI file editing
- No backend service requirement
- No vector database in the default product
- No dedicated Brain inbox, tasks, journal, summaries, or review-history files
