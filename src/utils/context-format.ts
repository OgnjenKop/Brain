import { SynthesisContext } from "../services/context-service";

export function formatContextLocation(context: SynthesisContext): string {
  if (context.sourcePaths && context.sourcePaths.length > 0) {
    const count = context.sourcePaths.length;
    return `${context.sourceLabel} • ${count} ${count === 1 ? "file" : "files"}`;
  }

  if (context.sourcePath) {
    return `${context.sourceLabel} • ${context.sourcePath}`;
  }

  return context.sourceLabel;
}

export function formatContextMetadataLines(context: SynthesisContext): string[] {
  const lines = [`Context source: ${context.sourceLabel}`];

  if (context.sourcePath) {
    lines.push(`Context path: ${context.sourcePath}`);
  }

  if (context.sourcePaths && context.sourcePaths.length > 0) {
    lines.push("Context files:");
    const visible = context.sourcePaths.slice(0, 12);
    for (const path of visible) {
      lines.push(`- ${path}`);
    }

    if (context.sourcePaths.length > visible.length) {
      lines.push(`- ...and ${context.sourcePaths.length - visible.length} more`);
    }
  }

  if (context.truncated) {
    lines.push(
      `Context was truncated to ${context.maxChars} characters from ${context.originalLength}.`,
    );
  }

  return lines;
}

export function formatContextSourceLines(context: SynthesisContext): string[] {
  const lines = [`Source: ${context.sourceLabel}`];

  if (context.sourcePath) {
    lines.push(`Source path: ${context.sourcePath}`);
  }

  if (context.sourcePaths && context.sourcePaths.length > 0) {
    lines.push("Source files:");
    const visible = context.sourcePaths.slice(0, 12);
    for (const path of visible) {
      lines.push(path);
    }

    if (context.sourcePaths.length > visible.length) {
      lines.push(`...and ${context.sourcePaths.length - visible.length} more`);
    }
  }

  if (context.truncated) {
    lines.push(
      `Context truncated to ${context.maxChars} characters from ${context.originalLength}.`,
    );
  }

  return lines;
}
