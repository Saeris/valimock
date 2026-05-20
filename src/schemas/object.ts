import * as v from "valibot";

/**
 * Generate a mock object for a Valibot object schema. The shape comes from
 * `schema.entries` — each key gets a recursive `mockItem(value, key)` call
 * (the second arg supplies a property-name hint that string mocking uses to
 * route through `keyNameGenerators`).
 *
 * exactOptional quirk: if a property is declared with `exactOptional()` and
 * the mock value resolves to `undefined`, the key is omitted entirely from
 * the result rather than included with a `undefined` value. This mirrors how
 * `parse()` treats exact-optional keys when the input doesn't contain them.
 */
export interface GenerateObjectOptions {
  /** Recursive element mocker — typically a bound reference to Valimock's `#mock`. */
  mockItem: (schema: v.GenericSchema | v.GenericSchemaAsync, keyName?: string) => unknown;
}

export type ObjectSchemaInput =
  | v.ObjectSchema<v.ObjectEntries, v.ErrorMessage<v.ObjectIssue> | undefined>
  | v.ObjectSchemaAsync<v.ObjectEntriesAsync, v.ErrorMessage<v.ObjectIssue> | undefined>;

export const generateObject = (schema: ObjectSchemaInput, options: GenerateObjectOptions): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema.entries)) {
    const mocked = options.mockItem(value as v.GenericSchema | v.GenericSchemaAsync, key);
    // Skip exact_optional keys whose mock value is undefined — the absence
    // of the key is the canonical "this optional wasn't provided" form.
    if (v.isOfType(`exact_optional`, value as v.GenericSchema) && typeof mocked === `undefined`) continue;
    result[key] = mocked;
  }
  return result;
};
