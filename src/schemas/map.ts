import type * as v from "valibot";
import type { Schema, SyncSchema } from "../types.js";

/**
 * Generate a mock Map for a Valibot map schema. The number of entries is
 * controlled by `entriesLength` (typically Valimock's `options.mapEntriesLength`).
 *
 * Loops via `result.size` rather than a fixed iteration count so that
 * duplicate keys produced by the key schema don't undercount the result.
 * A retry budget guards against degenerate key schemas with too few distinct
 * outputs.
 */
export interface GenerateMapOptions {
  entriesLength: number;
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
  onWarn?: (message: string) => void;
}

export type MapSchemaInput =
  | v.MapSchema<SyncSchema, SyncSchema, v.ErrorMessage<v.MapIssue> | undefined>
  | v.MapSchemaAsync<Schema, Schema, v.ErrorMessage<v.MapIssue> | undefined>;

/** Cap on attempts to grow the result Map when duplicate keys collide. */
const ADD_RETRY_BUDGET = 256;

export const generateMap = (schema: MapSchemaInput, options: GenerateMapOptions): Map<unknown, unknown> => {
  const result = new Map<unknown, unknown>();
  let attempts = 0;
  while (result.size < options.entriesLength && attempts < ADD_RETRY_BUDGET) {
    result.set(options.mockItem(schema.key), options.mockItem(schema.value));
    attempts++;
  }
  if (result.size < options.entriesLength) {
    options.onWarn?.(
      `Map generation could not reach target size ${options.entriesLength} within ${ADD_RETRY_BUDGET} attempts ` +
        `(key schema produces too few distinct values). Got size=${result.size}.`
    );
  }
  return result;
};
