import type * as v from "valibot";
import { makeBounds, pickAvoiding, reconcileBounds, tightenMax, tightenMin, type Bounds } from "../utils/bounds.js";
import { readNumber, readRequirement } from "../utils/readRequirement.js";
import { walkPipe } from "../utils/walkPipe.js";
import { unhandledValidation } from "../utils/warnings.js";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock Blob for a Valibot blob schema. Honors `size` / `min_size` /
 * `max_size` / `not_size` and `mime_type`. Returns an empty `{}` placeholder
 * when the `Blob` global is unavailable.
 */
export interface GenerateBlobOptions {
  onWarn?: (message: string) => void;
}

export type BlobSchemaInput = SchemaMaybeWithPipe<v.BlobSchema<v.ErrorMessage<v.BlobIssue> | undefined>>;

interface BlobContext {
  bounds: Bounds;
  exactSize: number | undefined;
  forbiddenSizes: Set<number>;
  mimeTypes: readonly string[] | undefined;
}

const DEFAULTS = { min: 0, max: 1024 };

const handlers = {
  size: (ctx: BlobContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.exactSize = n;
  },
  min_size: (ctx: BlobContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMin(ctx.bounds, n);
  },
  max_size: (ctx: BlobContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMax(ctx.bounds, n);
  },
  not_size: (ctx: BlobContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.forbiddenSizes.add(n);
  },
  mime_type: (ctx: BlobContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const req = readRequirement(action);
    if (Array.isArray(req)) {
      const types = req.filter((v): v is string => typeof v === `string`);
      if (types.length > 0) ctx.mimeTypes = types;
    }
  }
};

export const generateBlob = (schema: BlobSchemaInput, options: GenerateBlobOptions): unknown => {
  if (typeof Blob === `undefined`) {
    options.onWarn?.(`blob: no Blob global available in this environment`);
    return {};
  }

  const ctx: BlobContext = {
    bounds: makeBounds(DEFAULTS),
    exactSize: undefined,
    forbiddenSizes: new Set(),
    mimeTypes: undefined
  };

  walkPipe(schema, ctx, handlers, (type) => options.onWarn?.(unhandledValidation(`blob`, type)));
  reconcileBounds(ctx.bounds);

  // For blobs the "target" is just the byte length. Use the bounds midpoint
  // as the seed when no exact size was requested.
  const targetSize = pickAvoiding(ctx.bounds, ctx.forbiddenSizes, ctx.exactSize);

  const type = ctx.mimeTypes ? ctx.mimeTypes[0] : ``;
  const buf = new Uint8Array(targetSize);
  return new Blob([buf], { type });
};
