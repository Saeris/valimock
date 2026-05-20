import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock Blob for a Valibot blob schema. Honors `size` / `min_size` /
 * `max_size` / `not_size` and `mime_type` actions when present.
 *
 * Returns an empty `{}` placeholder when the `Blob` global is unavailable
 * (e.g. Node < 18 without polyfills) so downstream consumers don't crash on
 * property access — the orchestrator surfaces the missing-global via `onWarn`.
 */
export interface GenerateBlobOptions {
  onWarn?: (message: string) => void;
}

export type BlobSchemaInput = SchemaMaybeWithPipe<v.BlobSchema<v.ErrorMessage<v.BlobIssue> | undefined>>;

interface BlobContext {
  exactSize: number | undefined;
  min: number;
  max: number;
  forbiddenSizes: Set<number>;
  mimeTypes: readonly string[] | undefined;
  warnings: string[];
}

const KNOWN_ACTIONS = new Set([`size`, `min_size`, `max_size`, `not_size`, `mime_type`]);
const DEFAULT_MAX_SIZE = 1024;

export const generateBlob = (schema: BlobSchemaInput, options: GenerateBlobOptions): unknown => {
  if (typeof Blob === `undefined`) {
    options.onWarn?.(`blob: no Blob global available in this environment`);
    return {};
  }

  const ctx: BlobContext = {
    exactSize: undefined,
    min: 0,
    max: DEFAULT_MAX_SIZE,
    forbiddenSizes: new Set(),
    mimeTypes: undefined,
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
        if (typeof req === `number`) ctx.min = Math.max(ctx.min, req);
        break;
      case `max_size`:
        if (typeof req === `number`) ctx.max = Math.min(ctx.max, req);
        break;
      case `not_size`:
        if (typeof req === `number`) ctx.forbiddenSizes.add(req);
        break;
      case `mime_type`:
        if (Array.isArray(req)) {
          const types = req.filter((v): v is string => typeof v === `string`);
          if (types.length > 0) ctx.mimeTypes = types;
        }
        break;
      default:
        if (action.kind === `validation` && !KNOWN_ACTIONS.has(action.type)) {
          ctx.warnings.push(`Unhandled blob validation: ${action.type}`);
        }
    }
  }

  if (options.onWarn) for (const w of ctx.warnings) options.onWarn(w);

  // Reconcile bounds.
  if (ctx.min > ctx.max) ctx.min = ctx.max;
  let targetSize = ctx.exactSize ?? Math.floor((ctx.min + ctx.max) / 2);
  if (targetSize > ctx.max) targetSize = ctx.max;
  if (targetSize < ctx.min) targetSize = ctx.min;
  // Nudge away from forbidden sizes when possible.
  while (ctx.forbiddenSizes.has(targetSize) && targetSize + 1 <= ctx.max) targetSize += 1;
  while (ctx.forbiddenSizes.has(targetSize) && targetSize - 1 >= ctx.min) targetSize -= 1;

  const type = ctx.mimeTypes ? ctx.mimeTypes[0] : ``;
  // Pad a Uint8Array to the requested size — content doesn't matter, only byteLength.
  const buf = new Uint8Array(targetSize);
  return new Blob([buf], { type });
};
