import { describe, expect, it } from "vitest";
import {
  parse,
  parseAsync,
  union,
  unionAsync,
  string,
  number,
  url,
  maxValue,
  integer,
  numberAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockUnion`, () => {
  it.each([
    union([string([url()]), number([maxValue(20), integer()])]),
    unionAsync([string([url()]), numberAsync([maxValue(20), integer()])])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(
      schema.async ? parseAsync(schema, result) : parse(schema, result)
    ).toStrictEqual(result);
  });
});
