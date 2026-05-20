import type * as v from "valibot";
import { makeBounds, pickAvoiding, reconcileBounds, tightenMax, tightenMin, type Bounds } from "../utils/bounds.js";
import { readNumber, readRequirement } from "../utils/readRequirement.js";
import { walkPipe } from "../utils/walkPipe.js";
import { unhandledValidation } from "../utils/warnings.js";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock File for a Valibot file schema. Same action set as `blob`
 * (File extends Blob). Returns a placeholder when `File` global is unavailable.
 */
export interface GenerateFileOptions {
  onWarn?: (message: string) => void;
}

export type FileSchemaInput = SchemaMaybeWithPipe<v.FileSchema<v.ErrorMessage<v.FileIssue> | undefined>>;

interface FileContext {
  bounds: Bounds;
  exactSize: number | undefined;
  forbiddenSizes: Set<number>;
  mimeTypes: readonly string[] | undefined;
}

const DEFAULTS = { min: 0, max: 1024 };

const handlers = {
  size: (ctx: FileContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.exactSize = n;
  },
  min_size: (ctx: FileContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMin(ctx.bounds, n);
  },
  max_size: (ctx: FileContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) tightenMax(ctx.bounds, n);
  },
  not_size: (ctx: FileContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const n = readNumber(action);
    if (n !== undefined) ctx.forbiddenSizes.add(n);
  },
  mime_type: (ctx: FileContext, action: v.GenericPipeItem | v.GenericPipeItemAsync): void => {
    const req = readRequirement(action);
    if (Array.isArray(req)) {
      const types = req.filter((v): v is string => typeof v === `string`);
      if (types.length > 0) ctx.mimeTypes = types;
    }
  }
};

export const generateFile = (schema: FileSchemaInput, options: GenerateFileOptions): unknown => {
  if (typeof File === `undefined`) {
    options.onWarn?.(`file: no File global available in this environment`);
    return {};
  }

  const ctx: FileContext = {
    bounds: makeBounds(DEFAULTS),
    exactSize: undefined,
    forbiddenSizes: new Set(),
    mimeTypes: undefined
  };

  walkPipe(schema, ctx, handlers, (type) => options.onWarn?.(unhandledValidation(`file`, type)));
  reconcileBounds(ctx.bounds);

  const targetSize = pickAvoiding(ctx.bounds, ctx.forbiddenSizes, ctx.exactSize);

  const type = ctx.mimeTypes ? ctx.mimeTypes[0] : ``;
  const buf = new Uint8Array(targetSize);
  return new File([buf], `mock.bin`, { type });
};
