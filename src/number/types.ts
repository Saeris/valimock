import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Constraint state accumulated while walking a number schema's pipe. Handlers
 * mutate this Context as they run; `generate()` reads it to produce a value.
 *
 * Note that `min` and `max` are inclusive bounds *after* `gt`/`lt` actions are
 * resolved (which adjust by `1` for integers or `Number.EPSILON` for floats).
 */
export interface NumberContext {
  readonly schema: SchemaMaybeWithPipe<v.NumberSchema<v.ErrorMessage<v.NumberIssue> | undefined>>;
  readonly faker: Faker;

  /** Lower bound (inclusive). Defaults to 0 unless an action raises it. */
  min: number;
  /** Upper bound (inclusive). Defaults to max(min + 1, 5) unless an action lowers it. */
  max: number;
  /** True iff `min` was set by an action (vs. the default). */
  minSet: boolean;
  /** True iff `max` was set by an action (vs. the default). */
  maxSet: boolean;
  /** Set when `integer` or `safe_integer` action is present. */
  isInteger: boolean;
  /** Set when `finite` action is present (affects Infinity handling). */
  isFinite: boolean;

  /** Exact-value pin from `value` action. Wins over everything else. */
  exactValue: number | undefined;
  /** Allow-list from `values` action. */
  allowedValues: readonly number[] | undefined;
  /** Disallow-list from `not_value` / `not_values` actions. */
  forbidden: Set<number>;
  /** Step from `multiple_of` action. */
  multipleOf: number | undefined;

  /** Diagnostics (unknown actions, retry-budget exhaustion). */
  warnings: string[];
}

/** Handler signature: collects one pipe item's constraint into the Context. */
export type NumberActionHandler = (ctx: NumberContext, action: v.GenericPipeItem) => void;

export const NUMBER_RETRY_BUDGET = 16;
export const DEFAULT_NUMBER_MIN = 0;
export const DEFAULT_NUMBER_MAX = 5;
