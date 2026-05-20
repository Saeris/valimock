import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockOptional`, () => {
  it.concurrent.each([
    v.optional(v.any()),
    v.optional(v.undefined_()),
    v.optional(v.null_()),
    v.optional(v.string()),
    v.optional(v.any(), `foo`),
    v.optional(v.any(), `foo`),
    v.optional(v.string(), `foo`),
    v.optional(v.string(), `foo`),
    v.object({
      optional: v.optional(v.string()),
      withDefault: v.optional(v.string(), `foo`)
    })
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    v.optionalAsync(v.any()),
    v.optionalAsync(v.undefined_()),
    v.optionalAsync(v.null_()),
    v.optionalAsync(v.string()),
    v.optionalAsync(v.any(), `foo`),
    v.optionalAsync(v.any(), `foo`),
    v.optionalAsync(v.string(), `foo`),
    v.optionalAsync(v.string(), `foo`)
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
