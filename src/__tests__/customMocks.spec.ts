import { describe, expect, it } from "vitest";
import { parse, custom } from "valibot";
import { Valimock } from "../Valimock.js";

const customSchema = custom(
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
    }
  }
}).mock;

describe(`customMocks config`, () => {
  it.each([customSchema])(
    `should match user defined mocks to the given schema (%#)`,
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );
});
