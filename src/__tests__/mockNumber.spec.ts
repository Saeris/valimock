import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  number,
  numberAsync,
  maxValue,
  integer,
  minValue,
  value
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNumber`, () => {
  it.each([
    number(),
    number([minValue(2)]),
    number([maxValue(10)]),
    number([value(5)]),
    number([minValue(2), integer()]),
    number([maxValue(10), integer()]),
    number([value(5), integer()])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    numberAsync(),
    numberAsync([minValue(2)]),
    numberAsync([maxValue(10)]),
    numberAsync([value(5)]),
    numberAsync([minValue(2), integer()]),
    numberAsync([maxValue(10), integer()]),
    numberAsync([value(5), integer()])
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
