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
  it.each([
    tuple([pipe(string(), url()), pipe(number(), maxValue(20), integer())]),
    pipe(
      tuple([pipe(string(), url()), pipe(number(), maxValue(20), integer())]),
      maxLength(2)
    )
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    tupleAsync([
      pipe(string(), url()),
      pipeAsync(number(), maxValue(20), integer())
    ]),
    pipe(
      tupleAsync([
        pipe(string(), url()),
        pipeAsync(number(), maxValue(20), integer())
      ]),
      maxLength(2)
    )
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
