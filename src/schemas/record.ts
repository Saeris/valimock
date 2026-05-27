import type * as v from "valibot";
import type { Schema } from "../types.js";

/**
 * Generate a mock record for a Valibot record schema. Both the key schema and
 * value schema are recursively mocked. The number of entries is controlled by
 * `entriesLength` (typically Valimock's `options.recordKeysLength`).
 *
 * Note: if the key schema produces duplicate values, the resulting record
 * will have fewer entries than requested (later writes overwrite earlier ones).
 */
export interface GenerateRecordOptions {
  entriesLength: number;
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
}

export type RecordSchemaInput<
  Key extends v.BaseSchema<string, number | string | symbol, v.BaseIssue<unknown>> = v.BaseSchema<
    string,
    number | string | symbol,
    v.BaseIssue<unknown>
  >,
  Value extends Schema = Schema
> = Value extends v.GenericSchema
  ? v.RecordSchema<Key, Value, v.ErrorMessage<v.RecordIssue> | undefined>
  : v.RecordSchemaAsync<Key, Value, v.ErrorMessage<v.RecordIssue> | undefined>;

export const generateRecord = (
  schema: RecordSchemaInput,
  options: GenerateRecordOptions
): Record<number | string | symbol, unknown> => {
  const result: Record<number | string | symbol, unknown> = {};
  for (let i = 0; i < options.entriesLength; i++) {
    const key = options.mockItem(schema.key as v.GenericSchema) as number | string | symbol;
    result[key] = options.mockItem(schema.value as v.GenericSchema | v.GenericSchemaAsync);
  }
  return result;
};
