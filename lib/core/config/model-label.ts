export function getModelDisplayName(modelName: string): string {
  const segments = modelName.split("/");
  return segments[segments.length - 1] || modelName;
}
