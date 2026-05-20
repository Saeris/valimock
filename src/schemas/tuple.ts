import type * as v from "valibot";

/**
 * Generate a mock tuple for a Valibot tuple schema. Each position in
 * `schema.items` is independently mocked via the recursive callback —
 * no shared constraint resolution since tuples are positional.
 */
export interface GenerateTupleOptions {
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
}

export type TupleSchemaInput =
  | v.TupleSchema<v.TupleItems, v.ErrorMessage<v.TupleIssue> | undefined>
  | v.TupleSchemaAsync<v.TupleItemsAsync, v.ErrorMessage<v.TupleIssue> | undefined>;

export const generateTuple = (schema: TupleSchemaInput, options: GenerateTupleOptions): unknown[] =>
  schema.items.map((item) => options.mockItem(item as v.GenericSchema | v.GenericSchemaAsync));
