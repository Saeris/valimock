import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock bigint for a Valibot bigint schema. Bigint pipelines have
 * roughly the same shape as numbers but with fewer actions in common use, so
 * the registry and orchestrator live in the same file.
 *
 * Supported actions: `value`, `values`, `min_value`, `max_value`, `gt_value`,
 * `lt_value`. Add new actions by extending the switch in `collect`.
 */
export interface GenerateBigintOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
}

export type BigintSchemaInput = SchemaMaybeWithPipe<v.BigintSchema<v.ErrorMessage<v.BigintIssue> | undefined>>;

interface BigintContext {
  exactValue: bigint | undefined;
  allowedValues: bigint[] | undefined;
  min: bigint | undefined;
  max: bigint | undefined;
  warnings: string[];
}

const KNOWN_ACTIONS = new Set([`value`, `values`, `min_value`, `max_value`, `gt_value`, `lt_value`]);

export const generateBigint = (schema: BigintSchemaInput, options: GenerateBigintOptions): bigint => {
  const ctx: BigintContext = {
    exactValue: undefined,
    allowedValues: undefined,
    min: undefined,
    max: undefined,
    warnings: []
  };
  const pipe = (`pipe` in schema ? schema.pipe : []) as readonly v.GenericPipeItem[];

  for (const action of pipe) {
    if (action.kind === `schema`) continue;
    const req = (action as { requirement?: unknown }).requirement;
    switch (action.type) {
      case `value`:
        if (typeof req === `bigint`) ctx.exactValue = req;
        break;
      case `values`:
        if (Array.isArray(req)) {
          const allowed = req.filter((v): v is bigint => typeof v === `bigint`);
          if (allowed.length > 0) ctx.allowedValues = allowed;
        }
        break;
      case `min_value`:
        if (typeof req === `bigint`) ctx.min = ctx.min === undefined ? req : ctx.min > req ? ctx.min : req;
        break;
      case `max_value`:
        if (typeof req === `bigint`) ctx.max = ctx.max === undefined ? req : ctx.max < req ? ctx.max : req;
        break;
      case `gt_value`:
        if (typeof req === `bigint`) {
          const next = req + 1n;
          ctx.min = ctx.min === undefined ? next : ctx.min > next ? ctx.min : next;
        }
        break;
      case `lt_value`:
        if (typeof req === `bigint`) {
          const next = req - 1n;
          ctx.max = ctx.max === undefined ? next : ctx.max < next ? ctx.max : next;
        }
        break;
      default:
        if (action.kind === `validation` && !KNOWN_ACTIONS.has(action.type)) {
          ctx.warnings.push(`Unhandled bigint validation: ${action.type}`);
        }
    }
  }

  if (options.onWarn) for (const w of ctx.warnings) options.onWarn(w);
  if (ctx.exactValue !== undefined) return ctx.exactValue;
  if (ctx.allowedValues && ctx.allowedValues.length > 0) return options.faker.helpers.arrayElement(ctx.allowedValues);
  return options.faker.number.bigInt({ min: ctx.min, max: ctx.max });
};
