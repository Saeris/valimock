import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
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
    array(
      union([pipe(string(), url()), pipe(number(), maxValue(20), integer())])
    ),
    pipe(array(string()), minLength(2)),
    pipe(array(string()), maxLength(10)),
    pipe(array(string()), length(5))
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema); //?
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    arrayAsync(string()),
    arrayAsync(number()),
    arrayAsync(
      union([pipe(string(), url()), pipe(number(), maxValue(20), integer())])
    ),
    pipeAsync(arrayAsync(string()), minLength(2)),
    pipeAsync(arrayAsync(string()), maxLength(10)),
    pipeAsync(arrayAsync(string()), length(5))
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
