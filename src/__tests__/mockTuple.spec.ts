import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
  parse,
  parseAsync,
  tuple,
  tupleAsync,
  string,
  number,
  url,
  maxValue,
  integer,
  maxLength
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockTuple`, () => {
  it.concurrent.each([
    tuple([pipe(string(), url()), pipe(number(), maxValue(20), integer())]),
    pipe(tuple([pipe(string(), url()), pipe(number(), maxValue(20), integer())]), maxLength(2))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    tupleAsync([pipe(string(), url()), pipeAsync(number(), maxValue(20), integer())]),
    pipeAsync(tupleAsync([pipe(string(), url()), pipeAsync(number(), maxValue(20), integer())]), maxLength(2))
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
