import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import { readDate } from "../utils/readRequirement.js";
import { walkPipe } from "../utils/walkPipe.js";
import { unhandledValidation } from "../utils/warnings.js";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock Date for a Valibot date schema. Handles `value`,
 * `min_value`, `max_value`.
 */
export interface GenerateDateOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
}

export type DateSchemaInput = SchemaMaybeWithPipe<v.DateSchema<v.ErrorMessage<v.DateIssue> | undefined>>;

interface DateContext {
  exactValue: Date | undefined;
  min: Date | undefined;
  max: Date | undefined;
}

const handlers = {
  value: (ctx: DateContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const d = readDate(action);
    if (d) ctx.exactValue = d;
  },
  min_value: (ctx: DateContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const d = readDate(action);
    if (d) ctx.min = d;
  },
  max_value: (ctx: DateContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const d = readDate(action);
    if (d) ctx.max = d;
  }
};

export const generateDate = (schema: DateSchemaInput, options: GenerateDateOptions): Date => {
  const ctx: DateContext = { exactValue: undefined, min: undefined, max: undefined };
  walkPipe(schema, ctx, handlers, (type) => options.onWarn?.(unhandledValidation(`date`, type)));

  if (ctx.exactValue) return ctx.exactValue;
  if (ctx.min && ctx.max) return options.faker.date.between({ from: ctx.min, to: ctx.max });
  if (ctx.min) return options.faker.date.soon({ refDate: ctx.min });
  if (ctx.max) return options.faker.date.recent({ refDate: ctx.max });
  return options.faker.date.soon();
};
