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
 *      primitives reduce to themselves, mismatched primitives surface a
 *      warning and the base wins).
 *
 * This produces correct output for the common object-extends-object case
 * and best-effort output for the rare primitive-intersect case (which is
 * usually degenerate — the only satisfying value would be one that matches
 * every option's constraint pipeline simultaneously).
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
 * Mirror of Valibot's internal `_merge` semantics for intersect:
 *   - equal primitives → first value
 *   - matching Date timestamps → first value
 *   - plain objects → recursive merge by key
 *   - arrays of equal length → positional recursive merge
 *   - everything else → issue (caller decides how to recover)
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
        if (sub.issue) return sub;
        out[key] = sub.value;
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
      if (sub.issue) return sub;
      out[i] = sub.value;
    }
    return { value: out };
  }
  return { issue: true };
};
