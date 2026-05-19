import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe, Schema, SyncSchema } from "../types.js";

/**
 * Generate a mock array for a Valibot array schema. The element type is
 * recursive — `mockItem` is a callback into Valimock's primary `#mock`
 * dispatcher so element generation respects the full pipeline.
 *
 * Supported actions: `length`, `min_length`, `max_length`, `empty`,
 * `non_empty`. Future actions (`includes` / `excludes` for arrays) can be
 * added by extending the switch in `collect`.
 */
export interface GenerateArrayOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
  /** Element generator — typically a bound reference to Valimock's `#mock`. */
  mockItem: (itemSchema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
}

export type ArraySchemaInput = SchemaMaybeWithPipe<
  | v.ArraySchema<SyncSchema, v.ErrorMessage<v.ArrayIssue> | undefined>
  | v.ArraySchemaAsync<Schema, v.ErrorMessage<v.ArrayIssue> | undefined>
>;

interface ArrayContext {
  exactLength: number | undefined;
  min: number;
  max: number;
  minSet: boolean;
  maxSet: boolean;
  forceEmpty: boolean;
  warnings: string[];
}

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 5;
const KNOWN_ACTIONS = new Set([`length`, `min_length`, `max_length`, `empty`, `non_empty`]);

export const generateArray = (schema: ArraySchemaInput, options: GenerateArrayOptions): unknown[] => {
  const ctx: ArrayContext = {
    exactLength: undefined,
    min: DEFAULT_MIN,
    max: DEFAULT_MAX,
    minSet: false,
    maxSet: false,
    forceEmpty: false,
    warnings: []
  };
  const pipe = (`pipe` in schema ? schema.pipe : []) as readonly v.GenericPipeItem[];

  for (const action of pipe) {
    if (action.kind === `schema`) continue;
    const req = (action as { requirement?: unknown }).requirement;
    switch (action.type) {
      case `length`:
        if (typeof req === `number`) ctx.exactLength = req;
        break;
      case `min_length`:
        if (typeof req === `number`) {
          ctx.min = ctx.minSet ? Math.max(ctx.min, req) : req;
          ctx.minSet = true;
        }
        break;
      case `max_length`:
        if (typeof req === `number`) {
          ctx.max = ctx.maxSet ? Math.min(ctx.max, req) : req;
          ctx.maxSet = true;
        }
        break;
      case `empty`:
        ctx.forceEmpty = true;
        break;
      case `non_empty`:
        if (!ctx.minSet || ctx.min < 1) {
          ctx.min = Math.max(ctx.min, 1);
          ctx.minSet = true;
        }
        break;
      default:
        if (action.kind === `validation` && !KNOWN_ACTIONS.has(action.type)) {
          ctx.warnings.push(`Unhandled array validation: ${action.type}`);
        }
    }
  }

  if (options.onWarn) for (const w of ctx.warnings) options.onWarn(w);
  if (ctx.forceEmpty) return [];

  // Reconcile bounds: if `min_length` raised min above the default ceiling
  // (or only max was set below the floor), widen the other side.
  if (ctx.minSet && !ctx.maxSet && ctx.min > ctx.max) ctx.max = ctx.min;
  if (ctx.maxSet && !ctx.minSet && ctx.max < ctx.min) ctx.min = ctx.max;

  const length =
    ctx.exactLength !== undefined ? ctx.exactLength : options.faker.number.int({ min: ctx.min, max: ctx.max });

  return Array.from({ length }, () => options.mockItem(schema.item));
};
