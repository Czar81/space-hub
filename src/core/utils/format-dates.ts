export function formatDates<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(formatDates) as unknown as T;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = formatDates(value);
  }
  return result as T;
}