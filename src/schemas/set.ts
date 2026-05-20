import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import { makeBounds, pickAvoiding, reconcileBounds, tightenMax, tightenMin, type Bounds } from "../utils/bounds.js";
import { readNumber } from "../utils/readRequirement.js";
import { walkPipe } from "../utils/walkPipe.js";
import { unhandledValidation } from "../utils/warnings.js";
import type { Schema, SchemaMaybeWithPipe, SyncSchema } from "../types.js";

/**
 * Generate a mock Set for a Valibot set schema. Element generation is
 * recursive via `mockItem`. Honors `size` / `min_size` / `max_size` /
 * `not_size`. The result may be smaller than the target when the element
 * schema produces too few distinct values within the retry budget.
 */
export interface GenerateSetOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
  mockItem: (itemSchema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
}

export type SetSchemaInput = SchemaMaybeWithPipe<
  | v.SetSchema<SyncSchema, v.ErrorMessage<v.SetIssue> | undefined>
  | v.SetSchemaAsync<Schema, v.ErrorMessage<v.SetIssue> | undefined>
>;

interface SetContext {
  bounds: Bounds;
  exactSize: number | undefined;
  forbiddenSizes: Set<number>;
}

const DEFAULTS = { min: 1, max: 5 };
const ADD_RETRY_BUDGET = 256;

const handlers = {
  size: (ctx: SetContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.exactSize = n;
  },
  min_size: (ctx: SetContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMin(ctx.bounds, n);
  },
  max_size: (ctx: SetContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMax(ctx.bounds, n);
  },
  not_size: (ctx: SetContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.forbiddenSizes.add(n);
  }
};

export const generateSet = (schema: SetSchemaInput, options: GenerateSetOptions): Set<unknown> => {
  const ctx: SetContext = {
    bounds: makeBounds(DEFAULTS),
    exactSize: undefined,
    forbiddenSizes: new Set()
  };

  walkPipe(schema, ctx, handlers, (type) => options.onWarn?.(unhandledValidation(`set`, type)));
  reconcileBounds(ctx.bounds);

  const targetSize = pickAvoiding(ctx.bounds, ctx.forbiddenSizes, ctx.exactSize ?? options.faker);

  const result = new Set<unknown>();
  let attempts = 0;
  while (result.size < targetSize && attempts < ADD_RETRY_BUDGET) {
    result.add(options.mockItem(schema.value));
    attempts++;
  }
  if (result.size < targetSize) {
    options.onWarn?.(
      `Set generation could not reach target size ${targetSize} within ${ADD_RETRY_BUDGET} attempts ` +
        `(element schema produces too few distinct values). Got size=${result.size}.`
    );
  }
  return result;
};
