import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
  parse,
  parseAsync,
  number,
  maxValue,
  integer,
  minValue,
  value
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNumber`, () => {
  it.each([
    number(),
    pipe(number(), minValue(2)),
    pipe(number(), maxValue(10)),
    pipe(number(), value(5)),
    pipe(number(), minValue(2), integer()),
    pipe(number(), maxValue(10), integer()),
    pipe(number(), value(5), integer())
  ])(`should generate valid mock data (%#)`, (schema) => {
    const result = mockSchema(schema); //?
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.each([
    pipeAsync(number(), minValue(2)),
    pipeAsync(number(), maxValue(10)),
    pipeAsync(number(), value(5)),
    pipeAsync(number(), minValue(2), integer()),
    pipeAsync(number(), maxValue(10), integer()),
    pipeAsync(number(), value(5), integer())
  ])(
    `should generate valid mock data with async validation (%#)`,
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
