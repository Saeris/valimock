import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  array,
  string,
  length,
  minLength,
  maxLength,
  number,
  union,
  url,
  maxValue,
  integer,
  arrayAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockArray`, () => {
  it.each([
    array(string()),
    array(number()),
    array(union([string([url()]), number([maxValue(20), integer()])])),
    arrayAsync(string()),
    arrayAsync(number()),
    arrayAsync(union([string([url()]), number([maxValue(20), integer()])])),
    array(string(), [minLength(2)]),
    array(string(), [maxLength(10)]),
    array(string(), [length(5)]),
    arrayAsync(string(), [minLength(2)]),
    arrayAsync(string(), [maxLength(10)]),
    arrayAsync(string(), [length(5)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(schema.async ? result : result);
  });
});
