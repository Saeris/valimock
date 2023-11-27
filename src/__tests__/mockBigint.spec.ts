import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  maxValue,
  bigint,
  minValue,
  value,
  bigintAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockBigint`, () => {
  it.each([
    bigint(),
    bigint([minValue(100n), maxValue(200n)]),
    bigint([value(50n)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    bigintAsync(),
    bigintAsync([minValue(100n), maxValue(200n)]),
    bigintAsync([value(50n)])
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
