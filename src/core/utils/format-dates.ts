import { Prisma } from "@prisma/client";

/**
 * Recursively converts `Date` values to ISO strings and Prisma `Decimal` values to strings.
 * Used by GraphQL resolvers because the schema declares those fields as `String`.
 *
 * @param obj Any value: primitive, object or array (nested values are converted too).
 * @returns A copy of the value that is safe to serialize.
 */
export function formatDates<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  if (Prisma.Decimal.isDecimal(obj)) return obj.toString() as unknown as T;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(formatDates) as unknown as T;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = formatDates(value);
  }
  return result as T;
}
