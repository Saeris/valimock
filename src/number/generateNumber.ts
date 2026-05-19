import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";
import { knownNumberActionTypes, numberActionHandlers, resolveBounds } from "./actionHandlers.js";
import { DEFAULT_NUMBER_MAX, DEFAULT_NUMBER_MIN, NUMBER_RETRY_BUDGET, type NumberContext } from "./types.js";

export interface GenerateNumberOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
}

export type NumberSchemaInput = SchemaMaybeWithPipe<v.NumberSchema<v.ErrorMessage<v.NumberIssue> | undefined>>;

/**
 * Generate a mock number for a Valibot number schema.
 *
 * Pipeline:
 *   1. collectConstraints — walk the pipe, populate Context via the registry
 *   2. resolveBounds — re-snap to integer grid if the integer flag is set
 *   3. exact-value / allow-list short-circuit
 *   4. multiple_of: snap to a factor-aligned value
 *   5. generate via faker.number.int/float, retrying past forbidden values
 *   6. fall through with a warning if no value satisfies the constraints
 */
export const generateNumber = (schema: NumberSchemaInput, options: GenerateNumberOptions): number => {
  const ctx: NumberContext = {
    schema,
    faker: options.faker,
    min: DEFAULT_NUMBER_MIN,
    max: DEFAULT_NUMBER_MAX,
    minSet: false,
    maxSet: false,
    isInteger: false,
    isFinite: false,
    exactValue: undefined,
    allowedValues: undefined,
    forbidden: new Set(),
    multipleOf: undefined,
    warnings: []
  };

  collectConstraints(ctx);
  resolveBounds(ctx);

  if (ctx.exactValue !== undefined) {
    flushWarnings(ctx, options.onWarn);
    return ctx.exactValue;
  }
  if (ctx.allowedValues && ctx.allowedValues.length > 0) {
    flushWarnings(ctx, options.onWarn);
    return ctx.faker.helpers.arrayElement(ctx.allowedValues);
  }

  // multiple_of: pick `k` such that `k * factor` is within bounds and not forbidden.
  if (ctx.multipleOf !== undefined) {
    const factor = ctx.multipleOf;
    const lo = Math.ceil(ctx.min / factor);
    const hi = Math.floor(ctx.max / factor);
    if (lo > hi) {
      ctx.warnings.push(`multiple_of(${factor}) has no value in [${ctx.min}, ${ctx.max}]`);
      flushWarnings(ctx, options.onWarn);
      return ctx.min;
    }
    for (let attempt = 0; attempt < NUMBER_RETRY_BUDGET; attempt++) {
      const k = ctx.faker.number.int({ min: lo, max: hi });
      const candidate = k * factor;
      if (!ctx.forbidden.has(candidate)) {
        flushWarnings(ctx, options.onWarn);
        return candidate;
      }
    }
    ctx.warnings.push(`Could not find a multiple_of(${factor}) value outside forbidden set within retry budget`);
    flushWarnings(ctx, options.onWarn);
    return lo * factor;
  }

  // Standard path: retry until we avoid forbidden values.
  for (let attempt = 0; attempt < NUMBER_RETRY_BUDGET; attempt++) {
    const candidate = ctx.isInteger
      ? ctx.faker.number.int({ min: ctx.min, max: ctx.max })
      : ctx.faker.number.float({ min: ctx.min, max: ctx.max });
    if (!ctx.forbidden.has(candidate)) {
      flushWarnings(ctx, options.onWarn);
      return candidate;
    }
  }

  ctx.warnings.push(
    `Number constraints unsatisfiable within retry budget (min=${ctx.min}, max=${ctx.max}, forbidden={${[...ctx.forbidden].join(`,`)}})`
  );
  flushWarnings(ctx, options.onWarn);
  return ctx.isInteger
    ? ctx.faker.number.int({ min: ctx.min, max: ctx.max })
    : ctx.faker.number.float({ min: ctx.min, max: ctx.max });
};

const collectConstraints = (ctx: NumberContext): void => {
  const pipe = (`pipe` in ctx.schema ? ctx.schema.pipe : []) as readonly v.GenericPipeItem[];
  for (const action of pipe) {
    if (action.kind === `schema`) continue;
    const handler = numberActionHandlers[action.type];
    if (handler) {
      handler(ctx, action);
    } else if (action.kind === `validation` && !knownNumberActionTypes.has(action.type)) {
      ctx.warnings.push(`Unhandled number validation: ${action.type}`);
    }
  }
};

const flushWarnings = (ctx: NumberContext, onWarn: ((m: string) => void) | undefined): void => {
  if (!onWarn) return;
  for (const w of ctx.warnings) onWarn(w);
};
