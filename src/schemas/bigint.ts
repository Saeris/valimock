import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import { readArray, readBigint } from "../utils/readRequirement.js";
import { walkPipe } from "../utils/walkPipe.js";
import { unhandledValidation } from "../utils/warnings.js";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock bigint for a Valibot bigint schema. Handles `value`,
 * `values`, `min_value`, `max_value`, `gt_value`, `lt_value`.
 */
export interface GenerateBigintOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
}

export type BigintSchemaInput = SchemaMaybeWithPipe<v.BigintSchema<v.ErrorMessage<v.BigintIssue> | undefined>>;

interface BigintContext {
  exactValue: bigint | undefined;
  allowedValues: readonly bigint[] | undefined;
  min: bigint | undefined;
  max: bigint | undefined;
}

const handlers = {
  value: (ctx: BigintContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const b = readBigint(action);
    if (b !== undefined) ctx.exactValue = b;
  },
  values: (ctx: BigintContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const allowed = readArray(action, (x): x is bigint => typeof x === `bigint`);
    if (allowed) ctx.allowedValues = allowed;
  },
  min_value: (ctx: BigintContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const b = readBigint(action);
    if (b !== undefined) ctx.min = ctx.min === undefined ? b : ctx.min > b ? ctx.min : b;
  },
  max_value: (ctx: BigintContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const b = readBigint(action);
    if (b !== undefined) ctx.max = ctx.max === undefined ? b : ctx.max < b ? ctx.max : b;
  },
  gt_value: (ctx: BigintContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const b = readBigint(action);
    if (b !== undefined) {
      const next = b + 1n;
      ctx.min = ctx.min === undefined ? next : ctx.min > next ? ctx.min : next;
    }
  },
  lt_value: (ctx: BigintContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const b = readBigint(action);
    if (b !== undefined) {
      const next = b - 1n;
      ctx.max = ctx.max === undefined ? next : ctx.max < next ? ctx.max : next;
    }
  }
};

export const generateBigint = (schema: BigintSchemaInput, options: GenerateBigintOptions): bigint => {
  const ctx: BigintContext = { exactValue: undefined, allowedValues: undefined, min: undefined, max: undefined };
  walkPipe(schema, ctx, handlers, (type) => options.onWarn?.(unhandledValidation(`bigint`, type)));

  if (ctx.exactValue !== undefined) return ctx.exactValue;
  if (ctx.allowedValues && ctx.allowedValues.length > 0) return options.faker.helpers.arrayElement(ctx.allowedValues);
  return options.faker.number.bigInt({ min: ctx.min, max: ctx.max });
};
