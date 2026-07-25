# Brain Agent Guide

This guide is for contributors working on the Brain plugin itself. It is not the same file as the `Brain/AGENTS.md` that Brain creates inside a user's vault to steer its own behavior.

## Purpose

Brain is a markdown-first Obsidian plugin that adds a sidebar chat for retrieving information from the vault and for filing approved updates back as plain markdown.

Working principles:

- Markdown in the vault is the source of truth.
- Generated output must remain inspectable markdown.
- AI is optional for retrieval but currently required for chat answers.
- Avoid broad platform features that do not directly improve vault retrieval or filing.

## Product Boundaries

Stay within the current product shape:

- a vault chat sidebar for retrieval and filing
- an editable `Brain/AGENTS.md` operating instructions file inside the vault
- safe markdown writes (`append` and `create` only) with per-operation approval
- question answering over explicit vault context plus a compact source-hint summary
- AI backed by the local Codex CLI only, with no vault access of its own

Do not add:

- embeddings or vector databases
- backend services, sync layers, or hosted APIs
- autonomous agents, scheduled tasks, or unattended writes
- hidden indexing pipelines, caches, or background workers
- chat surfaces that replace explicit context selection
- support for AI providers other than the Codex CLI

## Working Rules

- Use `apply_patch` for file edits.
- Prefer small, reviewable changes over broad refactors.
- Keep implementations markdown-first and vault-local.
- Reuse existing services and modals before adding new abstractions.
- Treat `main.js` as generated output. Edit the TypeScript sources under `main.ts` and `src/` and rebuild with `npm run build` instead of hand-editing the bundle.
- If a change affects user-facing behavior, update `README.md` and the smoke tests in the same pass.
- Do not revert user changes unless explicitly asked.
- Do not use destructive git commands.
- Do not commit secrets, API keys, or local vault paths.

## Code Structure

The repo is organized around a small set of modules:

- `main.ts` wires the plugin, services, sidebar view, settings tab, and commands.
- `src/commands/register-commands.ts` registers Obsidian commands for the plugin.
- `src/settings/settings.ts` and `src/settings/settings-tab.ts` define and render the plugin settings.
- `src/services/`
  - `vault-service.ts` wraps Obsidian's vault API for read, append, create, and folder management.
  - `vault-query-service.ts` scores markdown files against the user's prompt and returns ranked matches.
  - `vault-write-service.ts` normalizes and applies safe write plans.
  - `vault-chat-service.ts` orchestrates retrieval, prompt building, Codex calls, and response parsing.
  - `instruction-service.ts` ensures and reads the user-editable `Brain/AGENTS.md` instructions file.
  - `ai-service.ts` shells out to the local Codex CLI.
  - `auth-service.ts` opens the Codex setup flow and re-checks login status.
- `src/views/sidebar-view.ts` renders the chat sidebar.
- `src/views/vault-plan-modal.ts` shows the per-operation write approval modal.
- `src/utils/` contains markdown parsing, formatting, Codex auth, Codex model parsing, runtime helpers, and path safety checks.
- `scripts/smoke-tests.ts` and `scripts/installed-smoke-tests.mjs` are the current regression suites.

Prefer adding logic in the relevant service or utility file rather than growing `main.ts`.

## Validation

Run the project checks before finishing a pass:

- `npm run lint`
- `npm test`
- `npm run build`

If you change runtime behavior, run all three. If you only touch docs, run at least `npm test` when there is any chance of behavior drift.

## Markdown and Data Rules

- All persisted user content must stay in normal markdown files in the vault.
- Generated content should be clear and reusable markdown, not opaque machine output.
- Vault-wide context must continue to exclude the configured instructions file and the folders listed in **Excluded folders**. The default list covers `.obsidian` and `node_modules`, which is what keeps plugin internals out of retrieval; the query path does not auto-exclude every dot-folder, so add any other sensitive folder explicitly.
- **Retrieval is the only path from the vault to the model.** Codex is launched from an empty temp directory, never the vault, so the source hints Brain assembles are the complete context. Do not add `--cd`, a vault working directory, or any other affordance that lets the model read files Brain did not choose — it would silently break both the **Excluded folders** guarantee and the claim that the **Sources** list accounts for every answer.
- The only write operations Brain may propose are `append` to an existing markdown file and `create` of a new markdown file. Plans that target the instructions file, dot-folders, paths with a `..` segment, or non-markdown paths must be rejected at the boundary in `isSafeMarkdownPath`.
- Vault paths are compared case-insensitively (`samePath` in `src/utils/path-safety.ts`) because Brain runs on case-insensitive filesystems. Never compare vault paths with `===`.

## Public-Facing Changes

When adding or changing:

- commands
- settings
- default file layout
- sidebar actions
- save locations
- AI behavior
- the per-operation write plan shape

update `README.md` and, when relevant, `V4_ROADMAP.md` in the same pass.

## Quality Bar

- Review for mistakes after each implementation pass. Call out concrete bugs first.
- Prefer explicit, observable behavior over cleverness.
- Keep the plugin useful without AI where possible.
- Keep the design simple enough to ship and maintain.
- Run the smoke tests before requesting review.
