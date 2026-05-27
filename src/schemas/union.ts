import * as v from "valibot";

/**
 * Generate a mock value for a Valibot union schema.
 *
 * Naive approach: pick a random option and mock it. Problem: Valibot's union
 * resolution iterates options in order and accepts the first one that
 * structurally matches. If we mock a value satisfying option[2] but option[0]
 * *also* accepts it (e.g. option[0] has fewer required keys, or has
 * `exactOptional` on the field that distinguishes the variants), parse will
 * route to option[0] and strip the extra keys we generated — breaking the
 * `parse(schema, mock(schema)) === mock(schema)` round-trip.
 *
 * Mitigation: after mocking, verify the round-trip via safeParse. If it
 * doesn't match, retry with another option (preferring the one whose mock
 * shape is the most distinctive). Bounded by UNION_RETRY_BUDGET.
 *
 * Final fallback when no option's mock survives the round-trip: emit option[0]'s
 * mock since parse will route there anyway. This sacrifices variant diversity
 * but maintains the round-trip property.
 */
export interface GenerateUnionOptions {
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
  pickOption: <T>(options: readonly T[]) => T;
  onWarn?: (message: string) => void;
}

export type UnionSchemaInput =
  | v.UnionSchema<v.UnionOptions, v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined>
  | v.UnionSchemaAsync<
      v.UnionOptions | v.UnionOptionsAsync,
      v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined
    >;

const UNION_RETRY_BUDGET = 8;

export const generateUnion = (schema: UnionSchemaInput, options: GenerateUnionOptions): unknown => {
  const opts = schema.options as ReadonlyArray<v.GenericSchema | v.GenericSchemaAsync>;

  // Track which options we've already tried so we can prefer un-tried ones on retry.
  const tried = new Set<number>();
  let lastResult: unknown;

  for (let attempt = 0; attempt < UNION_RETRY_BUDGET; attempt++) {
    // Prefer an untried option; if all have been tried, just pick randomly.
    const remaining = opts.filter((_, i) => !tried.has(i));
    const chosen = remaining.length > 0 ? options.pickOption(remaining) : options.pickOption(opts);
    tried.add(opts.indexOf(chosen));

    const result = options.mockItem(chosen);
    lastResult = result;

    // Verify the round-trip: does parse(unionSchema, result) === result?
    // Only run for sync schemas — async parse would change the function shape.
    if (schema.async) return result;
    const parsed = v.safeParse(schema as v.UnionSchema<v.UnionOptions, undefined>, result);
    if (parsed.success && structurallyEqual(parsed.output, result)) {
      return result;
    }
  }

  options.onWarn?.(
    `union: could not find an option whose mock round-trips through parse within ${UNION_RETRY_BUDGET} attempts. ` +
      `This usually means union options overlap structurally — earlier options accept later options' shapes. ` +
      `Returning the last attempted value; consider restructuring as variant() for discriminated cases.`
  );
  return lastResult;
};

/**
 * Structural equality for parse-output vs mock-output. Plain JSON-shape compare
 * is enough for the union round-trip check — the values are post-parse so
 * they're already canonicalised.
 */
const structurallyEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!structurallyEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === `object` && typeof b === `object`) {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!(k in (b as Record<string, unknown>))) return false;
      if (!structurallyEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
    }
    return true;
  }
  return false;
};
