import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockOmit`, () => {
  it.concurrent.each([
    v.omit(
      v.object({
        name: v.pipe(v.string(), v.minLength(2), v.maxLength(32)),
        address: v.object({
          city: v.union([
            v.literal(`San Francisco`),
            v.literal(`Portland`),
            v.literal(`Seattle`),
            v.pipe(v.string(), v.minLength(2))
          ]),
          postalCode: v.pipe(v.number(), v.maxValue(99999), v.integer(), v.minValue(0))
        })
      }),
      [`address`]
    )
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
    expect(v.parse(schema, result)).not.toHaveProperty(`address`);
  });

  it.concurrent.each([
    v.omit(
      v.objectAsync({
        name: v.pipeAsync(v.string(), v.minLength(2), v.maxLength(32)),
        address: v.objectAsync({
          city: v.unionAsync([
            v.literal(`San Francisco`),
            v.literal(`Portland`),
            v.literal(`Seattle`),
            v.pipeAsync(v.string(), v.minLength(2))
          ]),
          postalCode: v.pipeAsync(v.number(), v.maxValue(99999), v.integer(), v.minValue(0))
        })
      }),
      [`address`]
    )
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    await expect(v.parseAsync(schema, result)).resolves.not.toHaveProperty(`address`);
  });
});
