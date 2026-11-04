import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const customSchema = v.custom(
  (input) => typeof input === `string` && input === `custom`,
  `Invalid value!`
);

const mockSchema = new Valimock({
  customMocks: {
    // Pattern match on the schema type value `custom`
    custom: (schema) => {
      // Compare the incoming schema to your instance of `custom()`
      if (schema === customSchema) {
        // Return your mock data here
        return `custom`;
      }
      // Returning undefined signals "no custom mock — use the built-in path".
      return undefined;
    }
  }
}).mock;

describe(`customMocks config`, () => {
  it.concurrent.each([customSchema])(
    `should match user defined mocks to the given schema (%#)`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    }
  );

  it(`should pass a mock function that recurses with the same instance`, () => {
    // A container override (here: a lazy schema that must always resolve
    // to its first option) needs to mock nested schemas. The third argument
    // uses the same instance, so nested strings still see this instance's
    // stringMap and customMocks without constructing a second Valimock.
    const inner = v.object({
      kind: v.literal(`a`),
      name: v.string(),
      tag: v.custom((input) => input === `custom`)
    });
    const schema = v.lazy(() =>
      v.union([inner, v.object({ kind: v.literal(`b`) })])
    );
    const m = new Valimock({
      onWarn: () => {},
      stringMap: { name: () => `fixed` },
      customMocks: {
        custom: () => `custom`,
        lazy: (lazySchema, _options, mock) => {
          const resolved = (lazySchema as v.LazySchema<v.GenericSchema>).getter(
            undefined
          );
          const [first] = (resolved as v.UnionSchema<v.UnionOptions, undefined>)
            .options;
          return mock!(first);
        }
      }
    }).mock;
    const result = m(schema);
    expect(result).toStrictEqual({ kind: `a`, name: `fixed`, tag: `custom` });
  });
});
