import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
  parse,
  parseAsync,
  array,
  string,
  length,
  empty,
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
  it.concurrent.each([
    array(string()),
    array(number()),
    array(union([pipe(string(), url()), pipe(number(), maxValue(20), integer())])),
    pipe(array(string()), empty()),
    pipe(array(string()), minLength(2)),
    pipe(array(string()), maxLength(10)),
    pipe(array(string()), length(5))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    arrayAsync(string()),
    arrayAsync(number()),
    arrayAsync(union([pipe(string(), url()), pipe(number(), maxValue(20), integer())])),
    pipeAsync(arrayAsync(string()), empty()),
    pipeAsync(arrayAsync(string()), minLength(2)),
    pipeAsync(arrayAsync(string()), maxLength(10)),
    pipeAsync(arrayAsync(string()), length(5))
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
