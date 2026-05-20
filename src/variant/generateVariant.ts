import type * as v from "valibot";

/**
 * Generate a mock value for a Valibot variant schema. Variant is a
 * discriminated union: each option is an object schema where the value at
 * `schema.key` is a literal/picklist that distinguishes the variant.
 *
 * Mocking strategy:
 *   1. Pick one of the options at random.
 *   2. Recursively mock that option (which is itself an object schema).
 *
 * The recursive object mocker handles the discriminator key naturally —
 * `literal()` and `picklist()` mock to their declared values, so the result
 * always carries the correct discriminator for the chosen variant.
 *
 * Fall-through `?? {}` matches the previous inline behavior: if the option
 * mock resolves to undefined (e.g. error path), return an empty object so
 * downstream consumers don't crash on `result.foo` access.
 */
export interface GenerateVariantOptions {
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync) => unknown;
  pickOption: <T>(options: readonly T[]) => T;
}

export type VariantSchemaInput<Key extends string = string> = v.VariantSchema<
  Key,
  v.VariantOptions<Key>,
  v.ErrorMessage<v.VariantIssue> | undefined
>;

export const generateVariant = <Key extends string>(
  schema: VariantSchemaInput<Key>,
  options: GenerateVariantOptions
): unknown => options.mockItem(options.pickOption(schema.options)) ?? {};
