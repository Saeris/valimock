import { describe, expect, it } from "vitest";
import {
  pipe,
  pipeAsync,
  object,
  objectAsync,
  map,
  mapAsync,
  string,
  email,
  maxLength,
  minLength,
  parse,
  parseAsync
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockMap`, () => {
  it.concurrent.each([
    map(
      pipe(string(), email()),
      object({
        name: pipe(string(), minLength(2), maxLength(16)),
        city: pipe(string(), minLength(2), maxLength(24))
      })
    )
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([
    mapAsync(
      pipe(string(), email()),
      objectAsync({
        name: pipeAsync(string(), minLength(2), maxLength(16)),
        city: pipeAsync(string(), minLength(2), maxLength(24))
      })
    )
  ])(`should generate valid mock data with async validation (%#)`, { repeats: 5 }, async (schema) => {
    const result = mockSchema(schema);
    await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
  });
});
