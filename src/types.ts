export type SynthesisTemplate =
  | "summarize"
  | "extract-tasks"
  | "extract-decisions"
  | "extract-open-questions"
  | "rewrite-clean-note"
  | "draft-project-brief";

export type QuestionScope = "note" | "group" | "folder" | "vault";
