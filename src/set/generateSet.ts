import type { Faker } from "@faker-js/faker";
import type * as v from "valibot";
import type { SchemaMaybeWithPipe, Schema, SyncSchema } from "../types.js";

/**
 * Generate a mock Set for a Valibot set schema. Element generation is
 * recursive — `mockItem` is a callback into Valimock's primary `#mock`
 * dispatcher so element schemas respect the full pipeline.
 *
 * Supported actions: `size`, `min_size`, `max_size`, `not_size`. The
 * registry/orchestrator share one file given the small action surface.
 */
export interface GenerateSetOptions {
  faker: Faker;
  onWarn?: (message: string) => void;
  /** Element generator — typically a bound reference to Valimock's `#mock`. */
  mockItem: (itemSchema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
}

export type SetSchemaInput = SchemaMaybeWithPipe<
  | v.SetSchema<SyncSchema, v.ErrorMessage<v.SetIssue> | undefined>
  | v.SetSchemaAsync<Schema, v.ErrorMessage<v.SetIssue> | undefined>
>;

interface SetContext {
  exactSize: number | undefined;
  min: number;
  max: number;
  minSet: boolean;
  maxSet: boolean;
  forbiddenSizes: Set<number>;
  warnings: string[];
}

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 5;
const KNOWN_ACTIONS = new Set([`size`, `min_size`, `max_size`, `not_size`]);
/** Cap on attempts to grow the result Set when duplicate elements collide. */
const ADD_RETRY_BUDGET = 256;

export const generateSet = (schema: SetSchemaInput, options: GenerateSetOptions): Set<unknown> => {
  const ctx: SetContext = {
    exactSize: undefined,
    min: DEFAULT_MIN,
    max: DEFAULT_MAX,
    minSet: false,
    maxSet: false,
    forbiddenSizes: new Set(),
    warnings: []
  };
  const pipe = (`pipe` in schema ? schema.pipe : []) as readonly v.GenericPipeItem[];

  for (const action of pipe) {
    if (action.kind === `schema`) continue;
    const req = (action as { requirement?: unknown }).requirement;
    switch (action.type) {
      case `size`:
        if (typeof req === `number`) ctx.exactSize = req;
        break;
      case `min_size`:
        if (typeof req === `number`) {
          ctx.min = ctx.minSet ? Math.max(ctx.min, req) : req;
          ctx.minSet = true;
        }
        break;
      case `max_size`:
        if (typeof req === `number`) {
          ctx.max = ctx.maxSet ? Math.min(ctx.max, req) : req;
          ctx.maxSet = true;
        }
        break;
      case `not_size`:
        if (typeof req === `number`) ctx.forbiddenSizes.add(req);
        break;
      default:
        if (action.kind === `validation` && !KNOWN_ACTIONS.has(action.type)) {
          ctx.warnings.push(`Unhandled set validation: ${action.type}`);
        }
    }
  }

  if (options.onWarn) for (const w of ctx.warnings) options.onWarn(w);

  // Reconcile bounds (same logic as array).
  if (ctx.minSet && !ctx.maxSet && ctx.min > ctx.max) ctx.max = ctx.min;
  if (ctx.maxSet && !ctx.minSet && ctx.max < ctx.min) ctx.min = ctx.max;

  let targetSize =
    ctx.exactSize !== undefined ? ctx.exactSize : options.faker.number.int({ min: ctx.min, max: ctx.max });
  // Nudge away from a forbidden size, staying within bounds when possible.
  while (ctx.forbiddenSizes.has(targetSize) && targetSize + 1 <= ctx.max) targetSize += 1;
  while (ctx.forbiddenSizes.has(targetSize) && targetSize - 1 >= ctx.min) targetSize -= 1;

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
