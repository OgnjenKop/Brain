# Brain v0.3 Spec

## Overview

Brain v0.3 recenters the product around the original idea:

`an Obsidian-native, markdown-first interface for turning raw personal notes into LLM-readable, LLM-shapeable knowledge`

The plugin should stop feeling like only a capture-and-review utility and start feeling like a lightweight LLM wiki for the vault.

This release does not add agents, embeddings, a vector database, or a backend. It builds on the existing markdown-first foundation and adds the smallest useful layer of vault querying and synthesis.

## Product Thesis

Brain exists to help users think with their vault, not just store text in it.

The core promise is:

`Capture fast. Ask good questions. Get useful markdown back.`

The LLM is not the source of truth. The vault is.

Brain should make it easy to:

- gather relevant markdown context
- ask for synthesis over that context
- produce structured markdown artifacts
- save those artifacts back into the vault

## Product Positioning

Brain is not:

- a generic AI chat sidebar
- a background automation engine
- a task manager
- a full PKM framework
- a multi-agent tool

Brain is:

- a markdown-first vault interface
- with focused capture and review workflows
- plus LLM-powered query and synthesis actions

## v0.3 Goal

Introduce a clear reason to use Brain beyond capture:

`Brain can read selected vault context and turn it into more useful knowledge artifacts.`

This should create a stronger payoff loop:

1. capture rough notes over time
2. select a note, folder, or recent set of files
3. ask Brain to summarize, extract, or rewrite
4. get usable markdown back

## Release Theme

`Query + Synthesis`

## Core User Problems

- notes accumulate faster than they are synthesized
- useful ideas stay scattered across captures, journals, and project notes
- users can write plenty of markdown, but still struggle to turn it into reusable knowledge
- current summaries are generic and time-window based, not context-aware
- capture alone is not a strong enough reason to install a plugin

## v0.3 Product Principles

1. Markdown remains the source of truth.
2. The user controls what context is sent to the LLM.
3. AI is optional, but the product direction should still be visible without AI.
4. Output should come back as markdown, not ephemeral chat only.
5. The workflow should remain simple enough for a local Obsidian plugin.

## Scope

### In Scope

- ask/summarize actions over explicit context
- context selection based on current note, selected text, recent files, or a folder
- markdown synthesis output
- output save/insert actions
- AI templates for common knowledge transformations
- sidebar or modal entry point for query/synthesis workflows

### Out of Scope

- embeddings
- semantic search infrastructure
- vector databases
- autonomous workflows
- long-running background indexing
- generic chat interface
- multi-agent orchestration

## New Core Concept

### Ask Brain

Brain should introduce a new user-facing concept:

`Ask Brain about this context`

The user chooses a context, then chooses a transformation.

Supported context targets in the first v0.3 pass:

- current note
- selected text in current note
- recent markdown files
- a chosen folder

Supported transformations in the first v0.3 pass:

- Summarize
- Extract Tasks
- Extract Decisions
- Extract Open Questions
- Rewrite as Clean Note
- Draft Project Brief

The output should always be markdown.

## Commands

New commands:

- `Brain: Ask About Current Note`
- `Brain: Ask About Selection`
- `Brain: Summarize Current Folder`
- `Brain: Draft Note From Recent Files`

Existing commands stay:

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

## v0.3 UX

### Sidebar

The sidebar should still support quick capture, but it should now also expose a synthesis path.

Suggested sections:

- `Quick Capture`
- `Ask Brain`
- `Review`
- `Status`
- `Output`

The `Ask Brain` section should allow:

- choosing a context source
- choosing an action template
- running the synthesis
- viewing the markdown result
- inserting or saving the output

### Modal Flow

For the first implementation pass, a simple modal is acceptable.

Flow:

1. choose context source
2. choose transformation
3. gather text context
4. run AI or local fallback where possible
5. show markdown output
6. allow:
   - copy to clipboard later if needed
   - insert into current note
   - save as new note in `Brain/notes/`

The MVP priority is not fancy UI. It is strong behavior.

## Output Philosophy

The output should be markdown that users would actually keep.

Examples:

### Summarize

```md
## Summary
...

## Key Themes
...

## Follow-ups
...
```

### Extract Decisions

```md
## Decisions
- ...

## Rationale
- ...

## Open Questions
- ...
```

### Rewrite as Clean Note

```md
# Topic Title

## Overview
...

## Key Points
...

## Open Questions
...
```

### Draft Project Brief

```md
# Project Brief

## Goal
...

## Context
...

## Current State
...

## Risks
...

## Next Steps
...
```

## AI Behavior

AI should be used for interpretation and synthesis, not for magical routing or broad autonomy.

The LLM should receive:

- a clear instruction
- explicit vault context
- a strict markdown output shape

The response should be normalized into predictable markdown sections.

## Non-AI Behavior

v0.3 should still degrade gracefully without AI.

Without AI:

- existing capture/review workflows remain intact
- current summary features remain available
- new Ask Brain actions can be partially disabled or limited to simple local transforms where reasonable

Recommended first-pass rule:

- if a new action fundamentally requires LLM synthesis, disable it with a clear UI message when AI is unavailable
- do not fake intelligence with weak heuristics where the result would feel broken

## Architecture Changes

Existing services remain useful:

- `VaultService`
- `NoteService`
- `TaskService`
- `JournalService`
- `ReviewService`
- `SummaryService`
- `BrainAIService`

New suggested services:

- `ContextService`
- `SynthesisService`

### ContextService

Responsibilities:

- gather selected text
- read current note
- read recent files
- read markdown files under a chosen folder
- truncate and prepare context safely

### SynthesisService

Responsibilities:

- define supported synthesis templates
- build prompts
- run AI requests
- normalize markdown output
- save or insert output

## Data Model

Existing data model stays valid:

```text
Brain/
  inbox.md
  tasks.md
  journal/
  notes/
  reviews/
  summaries/
```

New output can continue using:

- `Brain/notes/` for saved synthesis artifacts
- `Brain/summaries/` for persisted summary-style outputs

Do not introduce a new data store unless a concrete need appears.

## Acceptance Criteria

v0.3 is successful when:

- the user can run at least one meaningful Ask Brain action over the current note
- the user can run at least one multi-file synthesis action
- the output is saved or inserted as markdown
- the plugin still works without AI for all existing non-AI flows
- the new feature feels like a knowledge tool, not just another command

## Implementation Recommendation

Build in this order:

1. `Ask About Current Note`
2. `Ask About Selection`
3. output modal with insert/save actions
4. recent-files synthesis
5. folder-based synthesis

This keeps the first pass narrow while still making the product direction obvious.

## What To Avoid

- generic “chat with your vault” UI
- trying to solve retrieval comprehensively in v0.3
- adding embeddings before the interaction model is useful
- bolting on more capture features to avoid the harder synthesis problem
- overpromising autonomous knowledge management

## Summary

v0.1 and v0.2 built the substrate:

- markdown-first storage
- capture
- review
- summaries

v0.3 should make Brain feel like the original idea:

`a lightweight LLM wiki interface for an Obsidian vault`
