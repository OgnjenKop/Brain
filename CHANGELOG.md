# Changelog

All notable changes to Brain are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project tries to follow [Semantic Versioning](https://semver.org/) for user-visible behavior.

## [Unreleased]

### Added
- `CONTRIBUTING.md` with developer setup, PR workflow, and the public-facing change checklist.
- `CHANGELOG.md` so users can see what changed between releases.
- Sidebar header quick links: `Instructions` opens `Brain/AGENTS.md`, `Settings` jumps to the Brain settings tab.
- `Clear` button in the sidebar header to wipe the in-memory conversation (disabled while a request is in flight).
- Inline error and info turns in the chat so failed requests and stopped requests stay visible in the conversation thread, not only in Notices.
- Placeholder "Rechecking Codex CLI status…" while the settings-tab recheck is running.
- `VaultWritePlan.droppedOperations` count and a "skipped changes" notice at the top of the write preview modal so users can see when the model proposed operations that were rejected during normalization.

### Changed
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
