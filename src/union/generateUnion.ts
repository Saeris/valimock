import type * as v from "valibot";

/**
 * Generate a mock value for a Valibot union schema. Union requires the value
 * to match *any* one option, so we pick a random option and mock it.
 *
 * No deep semantics needed — union is the simplest discriminator-style schema.
 */
export interface GenerateUnionOptions {
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
  pickOption: <T>(options: readonly T[]) => T;
}

export type UnionSchemaInput =
  | v.UnionSchema<v.UnionOptions, v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined>
  | v.UnionSchemaAsync<
      v.UnionOptions | v.UnionOptionsAsync,
      v.ErrorMessage<v.UnionIssue<v.BaseIssue<unknown>>> | undefined
    >;

export const generateUnion = (schema: UnionSchemaInput, options: GenerateUnionOptions): unknown => {
  const opts = schema.options as ReadonlyArray<v.GenericSchema | v.GenericSchemaAsync>;
  return options.mockItem(options.pickOption(opts));
};
