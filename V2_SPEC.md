# Brain v0.2 Spec

## Overview

Brain v0.2 is a review and triage release.

The goal is to keep quick capture fast while making it much easier to process inbox content, review recent activity, and promote captures into more useful markdown destinations.

This release should deepen the existing workflow, not widen the product into a larger AI system.

## Product Goal

Brain should support a simple daily loop:

1. capture quickly during the day
2. review inbox items later
3. promote useful captures into notes, tasks, or journal entries
4. generate daily or weekly summaries

The plugin should still work well without AI and should remain markdown-first.

## Release Theme

`Review + Triage`

## Product Principles

1. Markdown remains the source of truth.
2. Core workflows must work without AI.
3. Review should be lightweight, not a full task or PKM system.
4. Promotion should be explicit and user-controlled.
5. The architecture should stay simple enough for local-only Obsidian plugin development.

## Scope

### In Scope

- inbox review flow
- promotion of inbox entries into task, journal, or note destinations
- daily summary
- weekly summary
- task capture from editor selection
- command palette support for review workflows
- sidebar review state
- improved summary quality

### Out of Scope

- embeddings
- semantic search
- autonomous workflows
- background automation
- chat interface
- complex task metadata
- full note refactoring
- multi-agent behavior

## User Problems Being Solved

- quick captures pile up without a good review path
- summaries are useful but not yet actionable enough
- good captures cannot be cleanly promoted into standalone notes
- tasks cannot be captured directly from the current editor selection
- the sidebar helps with capture but not yet with review

## Core v0.2 Features

### 1. Inbox Triage

New command:

- `Brain: Process Inbox`

Behavior:

- reads recent inbox entries from `inboxFile`
- presents entries in a lightweight review modal or review view
- lets the user act on one entry at a time

Available actions:

- `Keep in inbox`
- `Convert to task`
- `Append to journal`
- `Promote to note`
- `Skip`

Rules:

- no automatic deletion
- no silent mutation
- if mutation is supported, it must be explicit and visible
- if mutation is deferred for implementation simplicity, the plugin may append to the chosen destination and leave the original inbox entry untouched in v0.2

Recommendation:

- start with append-only promotion plus optional "mark processed" metadata in the inbox entry
- do not implement true move/delete semantics unless the editing path is robust

### 2. Daily and Weekly Review

New commands:

- `Brain: Summarize Today`
- `Brain: Summarize This Week`
- `Brain: Open Today's Journal`

Behavior:

- `Summarize Today` only includes content modified today
- `Summarize This Week` includes the last 7 days
- `Open Today's Journal` opens or creates the current daily journal file

Summary output should still use the existing markdown structure:

```md
## Highlights
...

## Tasks
...

## Follow-ups
...
```

v0.2 improvements:

- better task extraction
- fewer noisy highlights
- optional source references
- clearer follow-ups

### 3. Promotion to Standalone Notes

New concept:

- inbox captures can be promoted into a standalone note file

Suggested default location:

```text
Brain/notes/
```

Suggested note format:

```md
# Note Title

Created: 2026-04-12 14:30

Source: Brain inbox

Original capture:
Thought text here
```

Rules:

- quick capture still defaults to inbox append
- standalone note creation happens during review, not during raw capture
- title generation should be simple
- without AI, use the first meaningful line or a truncated version of the capture
- with AI enabled, title generation can be optional later, not required for v0.2

### 4. Capture Task From Selection

New command:

- `Brain: Add Task From Selection`

Behavior:

- when invoked from an editor with selected text, append a task to `tasksFile`
- if no selection exists, show a notice and optionally fall back to the normal task modal later

Suggested output:

```md
- [ ] Selected text _(added 2026-04-12 14:30)_
```

### 5. Sidebar Review State

The sidebar should evolve from capture-only into a lightweight control center.

New sections:

- `Quick Capture`
- `Review`
- `Summaries`
- `Status`

Suggested sidebar capabilities:

- existing capture textarea and actions
- `Process Inbox` button
- `Summarize Today` button
- `Summarize This Week` button
- current open task count
- recent inbox entry count
- last summary timestamp
- AI status text

AI status values:

- `AI off`
- `AI configured`
- `AI enabled but missing key`

Optional UX improvement:

- preserve unsaved sidebar draft during the current Obsidian session

## Data Model

### Existing User Data

```text
Brain/
  inbox.md
  tasks.md
  journal/
  summaries/
```

### New Optional User Data

```text
Brain/
  notes/
```

Optional future addition, not required for first v0.2 pass:

```text
Brain/
  reviews/
```

This should only exist if persisted review notes are added. It is not required for the first implementation pass.

## File Format Proposals

### Inbox Entry

Existing format remains valid:

```md
## 2026-04-11 22:15
- Thought here
```

Optional v0.2 processed marker if needed:

```md
## 2026-04-11 22:15
- Thought here
  - processed: task
```

This marker is optional. If it adds too much editing complexity, skip it in the first pass.

### Standalone Note

```md
# Meeting Follow-up

Created: 2026-04-12 14:30
Source: Brain inbox

Need to send revised proposal and follow up on pricing.
```

### Daily Summary File

Suggested persisted filename:

```text
Brain/summaries/daily-2026-04-12.md
```

### Weekly Summary File

Suggested persisted filename:

```text
Brain/summaries/weekly-2026-04-12.md
```

If collision handling is already timestamp-based, that is acceptable too. Keep it simple and deterministic.

## Commands

### New Commands

- `Brain: Process Inbox`
- `Brain: Summarize Today`
- `Brain: Summarize This Week`
- `Brain: Add Task From Selection`
- `Brain: Open Today's Journal`

### Existing Commands To Keep

- `Brain: Capture Note`
- `Brain: Add Task`
- `Brain: Add Journal Entry`
- `Brain: Summarize Recent Notes`
- `Brain: Open Sidebar`

## Summary Logic v0.2

### Existing Summary Sections

- `Highlights`
- `Tasks`
- `Follow-ups`

### Improvements

- exclude noise introduced by file separators
- prioritize markdown task lines
- prioritize recent journal headings and meaningful bullets
- include source file references when useful
- avoid duplicating the same line across multiple sections

### Time Windows

- today: local calendar day
- this week: rolling 7-day window
- recent notes: keep current configurable lookback behavior

## AI in v0.2

AI remains optional.

Valid AI uses:

- better daily summary
- better weekly summary
- optional routing during capture

Still out of scope:

- agent planning
- autonomous triage
- background processing
- semantic memory

If AI fails:

- summary falls back to local summary
- routing falls back to manual user choice
- plugin does not block review workflows

## Technical Design

### New Modules

- `src/services/inbox-service.ts`
- `src/services/review-service.ts`

### Likely Responsibilities

`inbox-service.ts`

- parse inbox markdown into entry objects
- return recent entries for review
- optionally mark entries as processed

`review-service.ts`

- promote inbox entry to task
- promote inbox entry to journal
- promote inbox entry to standalone note
- coordinate review actions without hiding markdown writes

### Existing Modules To Extend

`summary-service.ts`

- support daily and weekly windows
- improve output structure

`sidebar-view.ts`

- add review and status sections

`main.ts`

- register new commands
- wire new services

## Implementation Strategy

### Phase 1

- inbox parsing service
- `Process Inbox` command
- `Add Task From Selection`
- `Open Today's Journal`

### Phase 2

- daily and weekly summary commands
- improved fallback summary logic

### Phase 3

- sidebar review section
- sidebar status section
- session draft preservation

### Phase 4

- optional processed-state marking
- note promotion polish

## UX Constraints

- no destructive edits by default
- preserve speed of the current capture flow
- review flow must feel lighter than manually editing markdown files
- failures must surface as notices, not crashes
- if a review action fails, the original inbox entry remains untouched

## Acceptance Criteria

- user can review recent inbox entries without manually opening `inbox.md`
- user can promote an inbox entry to task, journal, or note
- user can generate a daily summary
- user can generate a weekly summary
- user can add a task from editor selection
- user can open or create today's journal from a command
- sidebar exposes review state, not just capture actions
- all core flows work without API keys
- all output remains markdown stored in the vault

## Definition of Done

v0.2 is done when:

- capture remains as fast as v0.1
- inbox review exists and is usable
- review actions produce correct markdown output
- daily and weekly summaries are materially more useful than v0.1
- the sidebar supports both capture and review
- AI remains optional and non-blocking
- the codebase remains modular and local-only

## Final Rule

Do not turn Brain into a large AI platform in v0.2.

Make it better at helping a person capture, review, and act on their own markdown.
