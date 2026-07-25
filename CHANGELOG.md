# Changelog

All notable changes to Brain are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project tries to follow [Semantic Versioning](https://semver.org/) for user-visible behavior.

## [Unreleased]

### Fixed
- Answers containing a fenced code block are no longer mangled. The response parser matched the first markdown fence before trying the whole payload, so a JSON reply whose `answer` contained a ` ```bash ` block failed to parse — the user saw the raw JSON blob and any proposed write plan was silently dropped.
- Codex exiting before it reads stdin (an unsupported CLI flag, for example) no longer raises an uncaught `EPIPE` in Obsidian's renderer. The child's stdin now has an error listener, so the exec callback reports the real failure instead.
- A rendered answer could be deleted from the chat. Appending a turn bumped a shared render generation, so approving a write plan while the previous answer was still rendering removed that answer from the DOM. Appends now check whether their own element is still attached.
- The **Sources** list showed up to 8 files while only 6 were sent to Codex, crediting files the model never saw. Retrieval and the prompt now use the same set.
- The instructions-file guard compared paths with `===`. On case-insensitive filesystems (macOS, Windows) a path like `brain/agents.md` slipped past both the write boundary and the retrieval exclusion. Vault paths are now compared case-insensitively.
- `Brain: Open Vault Chat` reused an already-open Brain view instead of creating a second one.
- The write preview modal's "Append to X" / "Create X" label now updates when the target path is edited.
- `isSafeMarkdownPath` rejected legitimate filenames containing a literal `..` (such as `Notes/v1.2..md`). It now rejects only real `..` path segments.
- Codex binary discovery checks for execute permission, not just existence, so a non-executable file named `codex` on `PATH` is no longer selected.

### Added
- Follow-up questions keep their subject. Terms from the previous user message are added to retrieval at a reduced weight, so *"when is the next review?"* still finds the note the conversation is about. Sources retrieved this way say where the term came from.
- Cancelling the write review no longer discards the proposal. The plan stays on the message behind a **Review N proposed changes** button until it is applied.
- **Codex timeout** setting (15–900 seconds, default 120). The previous 120-second limit was hardcoded and too short for slower reasoning models; the timeout error now names the setting.
- `CONTRIBUTING.md` with developer setup, PR workflow, and the public-facing change checklist.
- `CHANGELOG.md` so users can see what changed between releases.
- Sidebar header quick links: `Instructions` opens `Brain/AGENTS.md`, `Settings` jumps to the Brain settings tab.
- `Clear` button in the sidebar header to wipe the in-memory conversation (disabled while a request is in flight).
- Inline error and info turns in the chat so failed requests and stopped requests stay visible in the conversation thread, not only in Notices.
- Placeholder "Rechecking Codex CLI status…" while the settings-tab recheck is running.
- `VaultWritePlan.droppedOperations` count and a "skipped changes" notice at the top of the write preview modal so users can see when the model proposed operations that were rejected during normalization.

### Changed
- Vault retrieval is substantially faster on large vaults. Token regexes are compiled once per query instead of once per file, file contents are read with `cachedRead` through the `TFile` handle Brain already holds, and reasons/excerpts are built only for the results that are returned rather than for every scored file.
- Retrieval now runs in two passes. The first scores every file in the vault from its path and Obsidian's metadata cache (headings, tags, links, aliases) with no file reads; the second reads contents in that priority order, bounded at 1000 files per query. Vaults under 1000 markdown files are scanned in full as before, and above that the skipped files are the ones with no path, heading, tag, link, or alias match and the oldest modification times.
- The whitespace-insensitive phrase check no longer lowercases each file's text twice, and skips the collapse pass entirely for single-word queries.
- `VaultQueryMatch` no longer carries each matched file's full text. The field was unused and every match was retained in the sidebar's conversation state for the life of the view.
- Codex login status and binary path lookups are cached for 30 seconds and de-duplicated across concurrent callers. Previously every chat message, settings save, and model change spawned a `codex login status` process — changing the model spawned two back to back. **Recheck Status** forces a fresh check.
- Two-character query terms such as `AI`, `Q3`, and `v2` are no longer discarded by the tokenizer; common two-letter English words were added to the stop-word list instead.
- Codex readiness is checked before the vault scan rather than after it, so an unconfigured CLI fails immediately.
- `BrainSidebarView` has one definition of a chat turn's DOM instead of two near-identical copies in the append and re-render paths.
- **Codex no longer has access to the vault.** It was launched from the vault root and told it could inspect markdown with read-only shell commands. That made the **Sources** list unverifiable — the model could ground an answer in files that never appeared there — and reduced **Excluded folders** to a filter it could read straight past. Codex now runs from an empty temporary directory and is told it has no filesystem access, so the source hints Brain assembles are the complete context. Exclusions and the instructions-file guard are now enforced rather than advisory, and the Sources list accounts for every answer.
- Retrieval sends more context now that it is the only context: 8 source hints instead of 6, and excerpts of up to 12 lines / 1200 characters instead of 5 lines / 700. The prompt's 1200-character cap was previously unreachable, since excerpts were already truncated to 700.
- When the retrieved context does not answer the question, Brain is instructed to say so and suggest what to search for instead of guessing.
- `README.md` rewritten for open-source consumption: badges, table of contents, features list, architecture diagram, troubleshooting, FAQ, project layout, and explicit privacy guarantees.
- `AGENTS.md` (contributor guide) rewritten to reflect the current vault chat product and the actual file layout under `src/services/`.
- `package.json` description aligned with the user-facing `manifest.json` description.
- Settings tab split into focused `render*` methods (`renderStorageSection`, `renderCodexSetupSection`, `renderStatusSection`, `renderModelSection`) and a model-section re-render that preserves focus, so the dropdown no longer steals focus on each refresh.

## [0.4.0] - 2026-06-01

### Added
- Vault chat sidebar with auto-resizing input, conversation history (last 6 exchanges), and source-backed answers.
- Per-operation write approval modal: editable paths and content, per-operation checkboxes, approve/skip controls.
- Editable vault instructions file at `Brain/AGENTS.md` with sensible defaults, read on every chat.
- Codex model selector that lists models reported by the installed Codex CLI, plus a custom model id input.
- Codex status indicator (green when ready, amber when setup is missing) with a recheck button.
- Stop button to cancel an in-flight Codex call.
- Auto-scroll with a floating scroll-to-bottom button when the user has scrolled up.
- Copy buttons on code blocks rendered into chat answers.
- `codex debug models` parsing for the model dropdown.
- Hardened Codex startup: better binary lookup on macOS, Linux, and Windows (`%APPDATA%\npm`, `%LOCALAPPDATA%\Programs\Codex`).
- Strengthened recency tuning (1d / 7d / 30d / 90d score buckets).
- Configurable excluded folders, parsed one path per line. The default list already covers `.obsidian` and `node_modules`, so plugin internals stay out of retrieval by default; other sensitive folders have to be added explicitly.
- Smoke tests for settings normalization, Codex status and model parsing, vault query filtering, safe write plan normalization, and exclude-folder behavior.
- Installed-bundle smoke test that asserts the files in the vault's plugin folder match the current build.

### Changed
- Project refocused from a multi-surface second brain to a single Obsidian-native vault chat that retrieves from markdown and files approved updates back as markdown.
- Codex is now the only supported AI provider. Multi-provider and Gemini support were removed.
- `main.js` is marked as generated output via `.gitattributes`.

### Security
- Writes are gated by `isSafeMarkdownPath` both at plan parsing and at write time: paths must end in `.md`, must not contain `..`, must not target dot-folder segments, and must not target the instructions file.

## Earlier versions

Versions before 0.4.0 explored a broader second-brain product with capture, review, synthesis, and topic-page generation. That product was retired when Brain was refocused on the Codex vault chat shape in 0.4.0. Earlier release notes are available through `git log` and the `V4_ROADMAP.md` history.
