import { describe, expect, it } from "vitest";
import {
  literal,
  number,
  object,
  objectAsync,
  string,
  union,
  parse,
  parseAsync,
  integer,
  maxLength,
  maxValue,
  minLength,
  minValue
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockObject`, () => {
  it.each([
    object({
      name: string([minLength(2), maxLength(32)]),
      address: object({
        city: union([
          literal(`San Francisco`),
          literal(`Portland`),
          literal(`Seattle`),
          string([minLength(2)])
        ]),
        postalCode: number([maxValue(99999), integer(), minValue(0)])
      })
    })
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    objectAsync({
      name: string([minLength(2), maxLength(32)]),
      address: object({
        city: union([
          literal(`San Francisco`),
          literal(`Portland`),
          literal(`Seattle`),
          string([minLength(2)])
        ]),
        postalCode: number([maxValue(99999), integer(), minValue(0)])
      })
    })
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
