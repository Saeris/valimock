import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  tuple,
  tupleAsync,
  string,
  number,
  url,
  maxValue,
  integer,
  numberAsync,
  maxLength
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockTuple`, () => {
  it.each([
    tuple([string([url()]), number([maxValue(20), integer()])]),
    tupleAsync([string([url()]), numberAsync([maxValue(20), integer()])]),
    tuple([string([url()]), number([maxValue(20), integer()])], [maxLength(2)]),
    tupleAsync(
      [string([url()]), numberAsync([maxValue(20), integer()])],
      [maxLength(2)]
    )
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema); //?
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
