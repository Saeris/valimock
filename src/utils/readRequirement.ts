import type * as v from "valibot";

/**
 * Generic accessor for the `requirement` field on a Valibot validation action.
 * Returns the raw value (numbers, strings, Dates, bigints, arrays — whatever
 * the action declared). The default action shape carries `requirement` directly
 * on the object, but some validations (e.g. `email`, `integer`) declare a
 * function-typed requirement instead of a value.
 */
export const readRequirement = (action: v.GenericPipeItem | v.GenericPipeItemAsync): unknown =>
  (action as { requirement?: unknown }).requirement;

/** Coerce the requirement to a number, returning undefined for non-finite or non-number values. */
export const readNumber = (action: v.GenericPipeItem | v.GenericPipeItemAsync): number | undefined => {
  const req = readRequirement(action);
  return typeof req === `number` && Number.isFinite(req) ? req : undefined;
};

/** Coerce the requirement to a string, returning undefined otherwise. */
export const readString = (action: v.GenericPipeItem | v.GenericPipeItemAsync): string | undefined => {
  const req = readRequirement(action);
  return typeof req === `string` ? req : undefined;
};

/** Coerce the requirement to a bigint, returning undefined otherwise. */
export const readBigint = (action: v.GenericPipeItem | v.GenericPipeItemAsync): bigint | undefined => {
  const req = readRequirement(action);
  return typeof req === `bigint` ? req : undefined;
};

/** Coerce the requirement to a Date instance, returning undefined otherwise. */
export const readDate = (action: v.GenericPipeItem | v.GenericPipeItemAsync): Date | undefined => {
  const req = readRequirement(action);
  return req instanceof Date ? req : undefined;
};

/** Filter the requirement array to elements of a specific primitive type. */
export const readArray = <T>(
  action: v.GenericPipeItem | v.GenericPipeItemAsync,
  predicate: (v: unknown) => v is T
): readonly T[] | undefined => {
  const req = readRequirement(action);
  if (!Array.isArray(req)) return undefined;
  const filtered = req.filter(predicate);
  return filtered.length > 0 ? filtered : undefined;
};
