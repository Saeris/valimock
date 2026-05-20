import type * as v from "valibot";
import type { SchemaMaybeWithPipe } from "../types.js";

/**
 * Generate a mock File for a Valibot file schema. Honors `size` / `min_size` /
 * `max_size` / `not_size` and `mime_type` actions when present (File extends
 * Blob, so the action set is identical).
 *
 * Returns an empty `{}` placeholder when the `File` global is unavailable.
 */
export interface GenerateFileOptions {
  onWarn?: (message: string) => void;
}

export type FileSchemaInput = SchemaMaybeWithPipe<v.FileSchema<v.ErrorMessage<v.FileIssue> | undefined>>;

interface FileContext {
  exactSize: number | undefined;
  min: number;
  max: number;
  forbiddenSizes: Set<number>;
  mimeTypes: readonly string[] | undefined;
  warnings: string[];
}

const KNOWN_ACTIONS = new Set([`size`, `min_size`, `max_size`, `not_size`, `mime_type`]);
const DEFAULT_MAX_SIZE = 1024;

export const generateFile = (schema: FileSchemaInput, options: GenerateFileOptions): unknown => {
  if (typeof File === `undefined`) {
    options.onWarn?.(`file: no File global available in this environment`);
    return {};
  }

  const ctx: FileContext = {
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
          ctx.warnings.push(`Unhandled file validation: ${action.type}`);
        }
    }
  }

  if (options.onWarn) for (const w of ctx.warnings) options.onWarn(w);

  if (ctx.min > ctx.max) ctx.min = ctx.max;
  let targetSize = ctx.exactSize ?? Math.floor((ctx.min + ctx.max) / 2);
  if (targetSize > ctx.max) targetSize = ctx.max;
  if (targetSize < ctx.min) targetSize = ctx.min;
  while (ctx.forbiddenSizes.has(targetSize) && targetSize + 1 <= ctx.max) targetSize += 1;
  while (ctx.forbiddenSizes.has(targetSize) && targetSize - 1 >= ctx.min) targetSize -= 1;

  const type = ctx.mimeTypes ? ctx.mimeTypes[0] : ``;
  const buf = new Uint8Array(targetSize);
  return new File([buf], `mock.bin`, { type });
};
