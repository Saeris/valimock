import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { Bounds } from "../utils/bounds.js";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Constraint state accumulated while walking a number schema's pipe.
 * Bounds are managed by the shared `internal/bounds.ts` helpers.
 */
export interface NumberContext {
  readonly schema: SchemaMaybeWithPipe<v.NumberSchema<v.ErrorMessage<v.NumberIssue> | undefined>>;
  readonly faker: Faker;

  bounds: Bounds;
  isInteger: boolean;
  isFinite: boolean;

  exactValue: number | undefined;
  allowedValues: readonly number[] | undefined;
  forbidden: Set<number>;
  multipleOf: number | undefined;

  warnings: string[];
}

export type NumberActionHandler = (ctx: NumberContext, action: v.GenericPipeItem | v.GenericPipeItemAsync) => void;

export const NUMBER_RETRY_BUDGET = 16;
export const NUMBER_DEFAULTS = { min: 0, max: 5 };
