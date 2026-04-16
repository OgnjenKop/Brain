# Brain v0.4 Roadmap

## Thesis

`Higher-quality extraction and faster vault feedback loops, without expanding product scope.`

v0.4 keeps Brain markdown-first and vault-local. The goal is to make synthesis artifacts more reliable and the core sidebar loop more responsive in larger vaults.

## Milestone 1: Extraction Quality ✅

- tighten prompt and fallback heuristics for:
  - decisions
  - open questions
  - tasks
- add stricter output-shape normalization checks for all synthesis templates
- improve low-confidence messaging in local fallbacks

Exit criteria:
- generated artifacts consistently preserve explicit evidence
- malformed AI output is normalized into stable section shapes

## Milestone 2: Behavior-Level Regression Coverage ✅

- expand smoke tests beyond pure formatting:
  - count and cache invalidation paths
  - scope/context aggregation behavior
  - reopen/marker edge cases for duplicate inbox entries
- keep tests runnable without external services

Exit criteria:
- key user workflows (capture → review → synthesize → save/insert) have regression coverage on critical logic

## Milestone 3: Large-Vault Responsiveness ✅

- reduce repeated full-file parsing in frequently refreshed UI status paths
- prefer mtime-aware caches for derived counts where correctness is deterministic
- parallelize independent sidebar status lookups

Exit criteria:
- status refresh remains responsive with large `inbox.md`, `tasks.md`, and review history

## Milestone 4: UX Consistency ✅

- align command names, sidebar labels, and template labels
- ensure status text reflects real semantics (e.g. unreviewed vs recent)
- remove overlapping wording that obscures scope choices

Exit criteria:
- users can predict command/sidebar behavior from labels alone

## Non-Goals

- embeddings
- vector databases
- backend services
- autonomous workflows
- hidden indexing
- generic chat UI replacing explicit scope selection
