import { SynthesisTemplate } from "../types";

export function getSynthesisTemplateTitle(template: SynthesisTemplate): string {
  if (template === "extract-tasks") {
    return "Task Extraction";
  }

  if (template === "extract-decisions") {
    return "Decision Extraction";
  }

  if (template === "extract-open-questions") {
    return "Open Questions";
  }

  if (template === "rewrite-clean-note") {
    return "Clean Note";
  }

  if (template === "draft-project-brief") {
    return "Project Brief";
  }

  return "Summary";
}

export function getSynthesisTemplateButtonLabel(template: SynthesisTemplate): string {
  if (template === "extract-tasks") {
    return "Extract Tasks";
  }

  if (template === "extract-decisions") {
    return "Extract Decisions";
  }

  if (template === "extract-open-questions") {
    return "Extract Open Questions";
  }

  if (template === "rewrite-clean-note") {
    return "Rewrite as Clean Note";
  }

  if (template === "draft-project-brief") {
    return "Draft Project Brief";
  }

  return "Summarize";
}
