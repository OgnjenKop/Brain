export function isCustomModelValue(
  value: string,
  presetModels: readonly string[],
): boolean {
  return !presetModels.includes(value);
}

export function getModelDropdownValue(
  value: string,
  presetModels: readonly string[],
): string {
  return isCustomModelValue(value, presetModels) ? "custom" : value;
}

export function getNextModelValue(
  selection: string,
  currentValue: string,
  presetModels: readonly string[],
): string | null {
  if (selection === "custom") {
    return isCustomModelValue(currentValue, presetModels) ? currentValue : "";
  }

  return presetModels.includes(selection) ? selection : null;
}
