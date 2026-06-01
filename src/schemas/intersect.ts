import type * as v from "valibot";

/**
 * Generate a mock value for a Valibot intersect schema. Intersect requires
 * its value to match *every* option — Valibot's runtime then deep-merges
 * the per-option output into a single value, succeeding only when all
 * options agree at every leaf.
 *
 * Mocking strategy:
 *   1. Mock option[0] as the base.
 *   2. For each subsequent option, mock it and deep-merge against the base
 *      following Valibot's `_merge` semantics (objects merge by key, equal
 *      primitives reduce to themselves).
 *
 * **Key-level recovery for nested merges.** When two options share a key
 * but our independent mocking happens to produce divergent values at that
 * leaf (common for nullish/optional fields that roll different types per
 * invocation), the *parent object merge* still succeeds — the divergent
 * leaf picks the later option's value rather than discarding the entire
 * later option. This preserves discriminator keys in the canonical
 * `intersect([common, variant(...)])` pattern, which would otherwise drop
 * the `type` field whenever the common base and the variant disagree on a
 * shared nullish field.
 *
 * **Top-level incompatibility still warns.** Primitive intersects
 * (`intersect([string, string])`) mock independently and have no shared
 * structure to fall back on; when the two values disagree, the warning
 * fires and the earlier value wins. This is unchanged.
 */
export interface GenerateIntersectOptions {
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
  onWarn?: (message: string) => void;
}

export type IntersectSchemaInput =
  | v.IntersectSchema<v.IntersectOptions, v.ErrorMessage<v.IntersectIssue> | undefined>
  | v.IntersectSchemaAsync<v.IntersectOptionsAsync, v.ErrorMessage<v.IntersectIssue> | undefined>;

export const generateIntersect = (schema: IntersectSchemaInput, options: GenerateIntersectOptions): unknown => {
  const opts = schema.options as ReadonlyArray<v.GenericSchema | v.GenericSchemaAsync>;
  if (opts.length === 0) return {};

  let result = options.mockItem(opts[0]);
  for (let i = 1; i < opts.length; i++) {
    const next = options.mockItem(opts[i]);
    const merged = deepMerge(result, next);
    if (merged.issue) {
      options.onWarn?.(
        `intersect: option[${i}] mocked to a value incompatible with option[0..${i - 1}]; ` +
          `keeping the earlier value. Consider whether the intersect is satisfiable.`
      );
      continue;
    }
    result = merged.value;
  }
  return result;
};

interface MergeResult {
  value?: unknown;
  issue?: boolean;
}

/**
 * Mirror of Valibot's internal `_merge` semantics for intersect, with one
 * deliberate divergence: object-level sub-merges that fail at a leaf
 * recover by preferring `b`'s value at that key instead of aborting the
 * parent merge.
 *
 *   - equal primitives → first value
 *   - matching Date timestamps → first value
 *   - plain objects → recursive merge by key; failed sub-merges prefer `b`
 *   - arrays of equal length → positional recursive merge; failed sub-merges prefer `b`
 *   - everything else (top-level primitives, type mismatches) → issue (caller decides)
 *
 * The "prefer `b`" recovery exists because Valimock mocks each option
 * independently and can't satisfy an intersect's shared-key constraints
 * at the value level — the only correct solution would be schema-level
 * unification before any mocking. Preferring `b` (the later option) is a
 * principled stopgap: later options are typically the constraint-adders
 * (variants, extensions), so their values are more likely to satisfy the
 * combined pipeline.
 */
const deepMerge = (a: unknown, b: unknown): MergeResult => {
  if (typeof a !== typeof b) return { issue: true };
  if (a === b) return { value: a };
  if (a instanceof Date && b instanceof Date && +a === +b) return { value: a };
  if (a && b && (a as object).constructor === Object && (b as object).constructor === Object) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const key in b as Record<string, unknown>) {
      if (key in (a as Record<string, unknown>)) {
        const sub = deepMerge((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]);
        // Recover at the key level: a failed sub-merge picks b's value
        // rather than discarding the whole parent object merge. See the
        // "deliberate divergence" note above.
        out[key] = sub.issue ? (b as Record<string, unknown>)[key] : sub.value;
      } else {
        out[key] = (b as Record<string, unknown>)[key];
      }
    }
    return { value: out };
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    const out: unknown[] = [...a];
    for (let i = 0; i < a.length; i++) {
      const sub = deepMerge(a[i], b[i]);
      // Same key-level recovery as the object branch above.
      out[i] = sub.issue ? b[i] : sub.value;
    }
    return { value: out };
  }
  return { issue: true };
};
