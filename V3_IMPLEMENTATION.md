# Brain v0.3 Implementation Checklist

## Goal

Ship the smallest useful version of the `LLM wiki` direction without destabilizing the current plugin.

The first pass should prove one thing clearly:

`Brain can read explicit vault context and turn it into useful markdown output.`

## Build Strategy

Start with the narrowest vertical slice:

1. current note as context
2. one synthesis action
3. output modal
4. insert/save result

Do not start with folder traversal, broad templates, or a larger sidebar rewrite.

## Phase 1: Context Plumbing

### Deliverable

Brain can gather context from the current note and selected text.

### Tasks

- [ ] Add `ContextService`
- [ ] Add `getCurrentNoteContext()`
- [ ] Add `getSelectedTextContext()`
- [ ] Normalize context shape:
  - source label
  - source path when available
  - text content
  - truncation metadata
- [ ] Reuse `summaryMaxChars` as an initial safe context cap or introduce a dedicated synthesis cap later
- [ ] Add clear error messages for:
  - no active markdown note
  - empty note
  - no text selected

### Suggested Files

- `src/services/context-service.ts`
- `main.ts`

### Validation

- [ ] current note content can be read from an open markdown file
- [ ] selection content can be read from the active editor
- [ ] failures produce notices instead of runtime crashes

## Phase 2: Synthesis Core

### Deliverable

Brain can run one meaningful synthesis action over explicit context.

### First Action

`Summarize`

This should be the first implemented action because it is the easiest to validate and closest to existing summary behavior.

### Tasks

- [ ] Add `SynthesisService`
- [ ] Define a synthesis template model
- [ ] Implement `summarize` template
- [ ] Build AI prompt for note-context summarization
- [ ] Normalize AI markdown output
- [ ] Add a strict output shape for note summarization

### Suggested Output

```md
## Summary
...

## Key Themes
...

## Follow-ups
...
```

### Suggested Files

- `src/services/synthesis-service.ts`
- `src/utils/summary-normalize.ts` or a new output normalizer file if shapes start diverging
- `src/services/ai-service.ts`

### Validation

- [ ] AI output is normalized into the expected markdown shape
- [ ] missing or malformed AI sections degrade cleanly
- [ ] no empty-string output reaches the UI

## Phase 3: Output UX

### Deliverable

The user can view synthesis output and do something useful with it.

### Tasks

- [ ] Add a synthesis result modal
- [ ] Show:
  - action used
  - context source
  - markdown result
- [ ] Add `Insert into current note`
- [ ] Add `Save as note`
- [ ] Add `Close`

### Save Behavior

For the first pass, save into `Brain/notes/` with a timestamped filename.

### Insert Behavior

Insert into the current note at the cursor or append to the end if that is simpler and more reliable in the first pass.

### Suggested Files

- `src/views/synthesis-result-modal.ts`
- `src/services/review-service.ts` can stay unchanged
- `src/services/note-service.ts` may need a helper for standalone note creation if reuse is awkward

### Validation

- [ ] output can be saved as a markdown note
- [ ] output can be inserted into the active note
- [ ] no data is lost on modal close

## Phase 4: Command Entry Points

### Deliverable

Users can invoke the new behavior from commands.

### Commands

- [ ] `Brain: Ask About Current Note`
- [ ] `Brain: Ask About Selection`

### First-Pass Behavior

To keep scope tight, both commands can initially run the same `Summarize` synthesis action. The broader action/template picker can come in the next phase.

### Tasks

- [ ] register both commands
- [ ] wire current note context flow
- [ ] wire selection context flow
- [ ] open synthesis result modal

### Suggested Files

- `main.ts`

### Validation

- [ ] commands appear in Obsidian
- [ ] both commands work without opening the sidebar
- [ ] error paths are clear and non-fatal

## Phase 5: Action Templates

### Deliverable

Brain starts to feel like a vault synthesis tool instead of just “another summary command”.

### Add Templates

- [ ] Extract Tasks
- [ ] Extract Decisions
- [ ] Extract Open Questions
- [ ] Rewrite as Clean Note
- [ ] Draft Project Brief

### Tasks

- [ ] define stable output shapes for each template
- [ ] add prompt builders per template
- [ ] add output normalization per template where needed
- [ ] avoid overgeneralizing into a freeform chat system

### Validation

- [ ] each template returns markdown worth keeping
- [ ] template names map cleanly to user intent
- [ ] no template produces vague “AI slop” by default

## Phase 6: Broader Context Sources

### Deliverable

Brain can synthesize across more than one note.

### Add Context Sources

- [ ] recent markdown files
- [ ] current folder

### Tasks

- [ ] gather recent files safely
- [ ] gather folder files safely
- [ ] exclude `summaries/` and `reviews/` where appropriate
- [ ] show the context source clearly in output UI
- [ ] apply safe truncation before sending to AI

### Validation

- [ ] multi-file synthesis works on realistic vault content
- [ ] truncation remains predictable
- [ ] the user understands what was included

## Phase 7: Sidebar Integration

### Deliverable

The sidebar exposes the new product direction visibly.

### Tasks

- [ ] add `Ask Brain` section
- [ ] add a context selector
- [ ] add an action selector
- [ ] add a `Run` button
- [ ] show the latest synthesis output in the output area or launch the modal

### Constraint

Do not overbuild the sidebar. The command flow is the primary path first. Sidebar support should reinforce the feature, not become a UI rabbit hole.

## Non-AI Policy

### Rule

Do not fake complex synthesis locally.

### First-Pass Behavior

- [ ] existing capture/review/summary flows continue to work without AI
- [ ] new synthesis commands show a clear notice when AI is unavailable
- [ ] only add local fallback for new synthesis if the result is actually useful

## Testing Checklist

### Smoke Coverage

- [ ] add context service smoke tests where feasible
- [ ] add output normalizer tests
- [ ] add tests for malformed AI output
- [ ] add tests for save/insert routing helpers when feasible

### Manual QA

- [ ] summarize current note
- [ ] summarize selected text
- [ ] save synthesized output as note
- [ ] insert synthesized output into note
- [ ] run with AI disabled and confirm graceful messaging

## Release Gate

v0.3 first pass is ready when all of these are true:

- [ ] current note synthesis works
- [ ] selection synthesis works
- [ ] output can be saved or inserted
- [ ] the result feels like useful markdown, not generic AI filler
- [ ] the feature makes Brain feel more like a knowledge tool than a capture utility

## Recommended First Slice

If only one slice is built next, build exactly this:

- [ ] `ContextService.getCurrentNoteContext()`
- [ ] `SynthesisService.run("summarize", currentNoteContext)`
- [ ] `Brain: Ask About Current Note`
- [ ] synthesis result modal with `Save as note`

That is the smallest implementation that moves Brain toward the original vision.
