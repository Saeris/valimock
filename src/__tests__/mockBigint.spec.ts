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
    bigintAsync(),
    bigint([minValue(100n), maxValue(200n)]),
    bigint([value(50n)]),
    bigintAsync([minValue(100n), maxValue(200n)]),
    bigintAsync([value(50n)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
