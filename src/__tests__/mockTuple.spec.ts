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
    tuple([string([url()]), number([maxValue(20), integer()])], [maxLength(2)])
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    tupleAsync([string([url()]), numberAsync([maxValue(20), integer()])]),
    tupleAsync(
      [string([url()]), numberAsync([maxValue(20), integer()])],
      [maxLength(2)]
    )
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
