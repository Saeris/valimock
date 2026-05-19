import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock Date for a Valibot date schema. Date pipelines are simple
 * compared to string/number — `value`, `min_value`, `max_value` exhaust the
 * useful action surface, so we inline the registry and orchestrator together.
 *
 * Adding a new date action means adding one branch to `collect`.
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
  warnings: string[];
}

const KNOWN_ACTIONS = new Set([`value`, `min_value`, `max_value`]);

export const generateDate = (schema: DateSchemaInput, options: GenerateDateOptions): Date => {
  const ctx: DateContext = { exactValue: undefined, min: undefined, max: undefined, warnings: [] };
  const pipe = (`pipe` in schema ? schema.pipe : []) as readonly v.GenericPipeItem[];

  for (const action of pipe) {
    if (action.kind === `schema`) continue;
    const req = (action as { requirement?: unknown }).requirement;
    switch (action.type) {
      case `value`:
        if (req instanceof Date) ctx.exactValue = req;
        break;
      case `min_value`:
        if (req instanceof Date) ctx.min = req;
        break;
      case `max_value`:
        if (req instanceof Date) ctx.max = req;
        break;
      default:
        if (action.kind === `validation` && !KNOWN_ACTIONS.has(action.type)) {
          ctx.warnings.push(`Unhandled date validation: ${action.type}`);
        }
    }
  }

  if (options.onWarn) for (const w of ctx.warnings) options.onWarn(w);
  if (ctx.exactValue) return ctx.exactValue;
  if (ctx.min && ctx.max) return options.faker.date.between({ from: ctx.min, to: ctx.max });
  if (ctx.min) return options.faker.date.soon({ refDate: ctx.min });
  if (ctx.max) return options.faker.date.recent({ refDate: ctx.max });
  return options.faker.date.soon();
};
