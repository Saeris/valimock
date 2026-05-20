import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import { makeBounds, reconcileBounds, tightenMax, tightenMin, type Bounds } from "../utils/bounds.js";
import { readNumber } from "../utils/readRequirement.js";
import { walkPipe } from "../utils/walkPipe.js";
import { unhandledValidation } from "../utils/warnings.js";
import type { Schema, SchemaMaybeWithPipe, SyncSchema } from "../types.js";

/**
 * Generate a mock array for a Valibot array schema. Element generation is
 * recursive — `mockItem` is a callback into Valimock's primary `#mock`
 * dispatcher so element schemas route through the full pipeline.
 *
 * Supported actions: `length`, `min_length`, `max_length`, `empty`, `non_empty`.
 */
export interface GenerateArrayOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
  mockItem: (itemSchema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
}

export type ArraySchemaInput = SchemaMaybeWithPipe<
  | v.ArraySchema<SyncSchema, v.ErrorMessage<v.ArrayIssue> | undefined>
  | v.ArraySchemaAsync<Schema, v.ErrorMessage<v.ArrayIssue> | undefined>
>;

interface ArrayContext {
  bounds: Bounds;
  exactLength: number | undefined;
  forceEmpty: boolean;
}

const DEFAULTS = { min: 1, max: 5 };

const handlers = {
  length: (ctx: ArrayContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.exactLength = n;
  },
  min_length: (ctx: ArrayContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMin(ctx.bounds, n);
  },
  max_length: (ctx: ArrayContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMax(ctx.bounds, n);
  },
  empty: (ctx: ArrayContext): void => {
    ctx.forceEmpty = true;
  },
  non_empty: (ctx: ArrayContext): void => {
    if (!ctx.bounds.minSet || ctx.bounds.min < 1) tightenMin(ctx.bounds, 1);
  }
};

export const generateArray = (schema: ArraySchemaInput, options: GenerateArrayOptions): unknown[] => {
  const ctx: ArrayContext = {
    bounds: makeBounds(DEFAULTS),
    exactLength: undefined,
    forceEmpty: false
  };

  walkPipe(schema, ctx, handlers, (type) => options.onWarn?.(unhandledValidation(`array`, type)));

  if (ctx.forceEmpty) return [];
  reconcileBounds(ctx.bounds);

  const length =
    ctx.exactLength !== undefined
      ? ctx.exactLength
      : options.faker.number.int({ min: ctx.bounds.min, max: ctx.bounds.max });

  return Array.from({ length }, () => options.mockItem(schema.item));
};
