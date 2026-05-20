import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Constraint state accumulated while walking a string schema's pipe.
 * Phases read from and write to a single Context as the pipeline executes.
 */
export interface StringContext {
  readonly schema: SchemaMaybeWithPipe<v.StringSchema<v.ErrorMessage<v.StringIssue> | undefined>>;
  readonly keyName: string | undefined;
  readonly faker: Faker;

  /** Resolved length bounds. `min` is inclusive lower bound, `max` is inclusive upper bound. */
  bounds: { min: number; max: number };
  /** Set when an `empty` action is present — generation short-circuits to "". */
  forceEmpty: boolean;
  /** A named string format (e.g. `email`, `uuid`) when a format-validation action is detected. */
  format: string | undefined;
  /** Regex requirement collected from one or more `regex` actions. */
  regex: RegExp | undefined;
  /** Example values from `examples` metadata actions. Used as cheap, valid generators when present. */
  examples: readonly string[] | undefined;
  /** Substring requirements collected from `includes`/`startsWith`/`endsWith` actions. */
  includes: readonly string[];
  startsWith: string | undefined;
  endsWith: string | undefined;
  /** Excluded substrings (from `excludes` actions). */
  excludes: readonly string[];

  /** Forbidden exact lengths from `not_length` actions. */
  forbiddenLengths: Set<number>;
  /** Exact value pin from `value` action. Wins over generators. */
  exactValue: string | undefined;
  /** Allow-list from `values` action. */
  allowedValues: readonly string[] | undefined;
  /** Forbidden exact values from `not_value` / `not_values` actions. */
  forbiddenValues: Set<string>;

  /** Diagnostics — unknown action types, conflicting constraints, etc. Surfaced via `Valimock.options`. */
  warnings: string[];
}

/**
 * Handler invoked by the `collectConstraints` phase for a single pipe item.
 * Pure: mutates only the provided Context.
 */
export type ActionHandler = (ctx: StringContext, action: v.GenericPipeItem) => void;

/**
 * A phase is a single ordered pass over the Context. Returns the (possibly produced) value
 * once `generate` phase has run; earlier phases return undefined.
 */
export type Phase = (ctx: StringContext) => string | undefined;

/** Default max length when no upper bound is specified by the schema. */
export const DEFAULT_MAX_LENGTH = 128;

/** Cap on enforceConstraints regeneration attempts; prevents the recursion bug we replaced. */
export const ENFORCE_RETRY_BUDGET = 16;
