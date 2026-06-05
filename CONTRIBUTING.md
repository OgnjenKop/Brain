# Contributing to Brain

Thanks for your interest in Brain. This document covers the practical workflow for getting set up, sending changes, and getting them merged. For the product-level rules and the contributor guide for this repo, see [`AGENTS.md`](AGENTS.md).

## Code of Conduct

By participating, you agree to keep discussions focused on the work, be respectful of other contributors and users, and assume good faith. Harassment of any kind is not acceptable.

## Ways to Contribute

- **File a bug report** with reproduction steps, the Obsidian version, the plugin version, and the relevant settings (with secrets redacted).
- **Suggest a feature** by opening an issue first. Brain is intentionally narrow; please read [`AGENTS.md`](AGENTS.md) and [`V4_ROADMAP.md`](V4_ROADMAP.md) before proposing scope changes.
- **Improve documentation** in this repo, in the user-facing `Brain/AGENTS.md` template inside the vault, or in the settings copy.
- **Send a pull request** for a bug fix, a small refactor, or an item from the roadmap.

## Development Setup

You will need:

- Node.js 18 or later
- npm
- A local Obsidian vault for manual testing
- An installed and logged-in [`@openai/codex`](https://www.npmjs.com/package/@openai/codex) CLI if you want to exercise chat end-to-end

Clone the repo and install dependencies:

```bash
git clone https://github.com/OgnjenKop/Brain.git
cd Brain
npm install
```

Run the checks:

```bash
npm run lint
npm test
npm run build
```

Watch mode for the bundle while you iterate:

```bash
npm run dev
```

To load the plugin into Obsidian for manual testing, either:

- **Symlink** `.obsidian/plugins/brain` in your test vault to the repo root so each `npm run build` is picked up immediately, or
- **Copy** `main.js`, `manifest.json`, and `styles.css` from the repo root into the test vault's `.obsidian/plugins/brain/` folder.

You can verify a manual install is in sync with the current build using:

```bash
OBSIDIAN_VAULT=/path/to/vault npm run smoke:installed
```

## Working Rules

These are the practical rules. The reasoning lives in [`AGENTS.md`](AGENTS.md).

- Prefer small, reviewable changes. Split refactors from behavior changes.
- Reuse existing services and modals before adding new abstractions.
- Treat `main.js` as generated output. Edit the TypeScript sources under `main.ts` and `src/`, then rebuild.
- Keep the plugin useful without AI where possible.
- Avoid bringing in new dependencies unless there is a clear win. Brain has zero runtime dependencies (`obsidian` is a peer dep, not bundled) and a small set of dev dependencies.
- Do not commit secrets, API keys, or local vault paths. Use placeholders in examples.

## Public-Facing Changes

When you change something a user will see, update the docs in the same pass:

- New or renamed commands, settings, default file locations, sidebar actions, save locations, AI behavior, or the per-operation write plan shape: update [`README.md`](README.md) and, if relevant, [`V4_ROADMAP.md`](V4_ROADMAP.md).
- Changes to retrieval, normalization, write filtering, Codex status, or model catalog parsing: extend the smoke tests in [`scripts/smoke-tests.ts`](scripts/smoke-tests.ts).
- Anything that affects how Brain creates or interprets the user-facing `Brain/AGENTS.md` template: update both the template in `src/services/instruction-service.ts` and the matching user-facing copy in [`README.md`](README.md).

## Tests

The smoke tests in `scripts/smoke-tests.ts` cover:

- Settings normalization (including exclude folder normalization and rejection of removed settings).
- Codex login status and model catalog parsing.
- Date helpers.
- Vault write plan normalization (path safety, type filtering, content trimming, and the `droppedOperations` count for rejected operations).
- Vault query filtering (instructions file, configured excluded folders, recency and phrase scoring).

Add or extend tests in the same pass when you change one of these surfaces. Keep tests fast and free of network or filesystem side effects.

## Pull Request Process

1. **Open an issue first** for non-trivial changes. Smaller fixes and docs improvements can go straight to a PR.
2. **Branch from `main`.** Use a short, descriptive branch name (for example `fix/append-separator` or `docs/contributing`).
3. **Make the change small.** If a PR touches more than two or three areas, split it.
4. **Run the checks locally** before pushing:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
5. **Write a clear PR description.** Summarize the user-visible change, the implementation notes, and any follow-up work that is intentionally out of scope.
6. **Update the docs and tests** that the contributor guide requires.
7. **Avoid destructive git operations** (force-pushes, rebases of published history) and do not skip pre-commit or pre-push hooks.

A maintainer will review for:

- Fit with the product boundaries in `AGENTS.md`.
- Tests for the changed surface.
- Doc updates for any user-facing change.
- No secrets, no local paths, no hand-edits of `main.js`.

## Reporting Bugs

Open an issue and include:

- Brain version (from the plugin list in Obsidian)
- Obsidian version and platform (for example `Obsidian 1.7.7 on macOS 14.5`)
- The exact steps to reproduce, with a small vault snippet if possible
- The expected and actual behavior
- The relevant settings, with secrets redacted
- The contents of the Developer Console (Help → Toggle Developer Tools → Console) when the bug shows up there

For a security issue, please do not open a public issue. Email the maintainers listed on the GitHub profile of the repository owner instead.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
