# Brain Agent Guide

## Purpose

Brain is a markdown-first Obsidian plugin for capture, review, synthesis, and topic-page generation over explicit vault context.

The working principle is simple:

- markdown in the vault is the source of truth
- generated output must remain inspectable markdown
- AI is optional for core behavior
- avoid broad platform features that do not directly improve vault synthesis

## Product Boundaries

Stay within the current product shape:

- vault chat sidebar for retrieval and filing
- editable `Brain/AGENTS.md` operating instructions
- safe markdown writes with per-operation approval
- question answering over explicit vault context
- generated notes and topic pages in the configured notes folder

Do not add:

- embeddings
- vector databases
- backend services
- agents or autonomous workflows
- hidden indexing pipelines
- chat UI that replaces explicit context selection

## Working Rules

- Use `apply_patch` for file edits.
- Prefer small, reviewable changes over broad refactors.
- Keep implementations markdown-first and vault-local.
- Reuse existing services and modals before adding new abstractions.
- Treat `main.js` as generated output; edit the TypeScript sources and rebuild instead of hand-editing the bundle.
- If a new feature changes user-facing behavior, update the README and smoke tests in the same pass.
- Do not revert user changes unless explicitly asked.
- Do not use destructive git commands.

## Code Structure

The repo is organized around a small set of modules:

- `main.ts` wires commands, services, and views.
- `src/services/` contains vault, capture, review, synthesis, topic-page, and AI logic.
- `src/views/` contains modal and sidebar UI.
- `src/utils/` contains markdown parsing, formatting, and normalization helpers.
- `scripts/smoke-tests.ts` is the current regression suite.

Prefer adding logic in the relevant service or utility file rather than growing `main.ts`.

## Validation

Run the project checks before finishing a pass:

- `npm run lint`
- `npm test`
- `npm run build`

If you change runtime behavior, run all three.
If you only touch docs, run at least `npm test` when there is any chance of behavior drift.

## Markdown and Data Rules

- All persisted user content must stay in normal markdown files in the vault.
- Generated pages should be clear and reusable markdown, not opaque machine output.
- Topic pages should preserve the user topic, explicit evidence, open questions, sources, and next steps.
- Vault-wide context must continue to exclude Brain-generated summaries and review logs to avoid recursion.

## Public-Facing Changes

When adding or changing:

- commands
- settings
- default file layout
- sidebar actions
- save locations
- AI behavior

update the README in the same pass.

## Quality Bar

- Review for mistakes after each implementation pass.
- Call out concrete bugs first when reviewing code.
- Prefer explicit, observable behavior over cleverness.
- Keep the plugin useful without AI.
- Keep the design simple enough to ship and maintain.
