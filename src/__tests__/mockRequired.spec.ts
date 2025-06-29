import { describe, expect, it } from "vitest";
import { number, object, string, parse, required, exactOptional } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockObject`, () => {
  it.concurrent.each([
    required(
      object({
        name: exactOptional(string()),
        age: exactOptional(number())
      })
    )
  ])(`should always include all keys by default (%#)`, { repeats: 10 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
    expect(parse(schema, result)).toHaveProperty(`name`);
    expect(parse(schema, result).name).toBeTypeOf(`string`);
    expect(parse(schema, result)).toHaveProperty(`age`);
    expect(parse(schema, result).age).toBeTypeOf(`number`);
  });

  it.concurrent.each([
    required(
      object({
        name: exactOptional(string()),
        age: exactOptional(number())
      }),
      [`age`]
    )
  ])(`should generate valid mock data (%#)`, { repeats: 10 }, (schema) => {
    const result = mockSchema(schema); //?
    expect(parse(schema, result)).toStrictEqual(result);
    expect(parse(schema, result).name).toBeOneOf([expect.any(String), undefined]);
    expect(parse(schema, result)).toHaveProperty(`age`);
    expect(parse(schema, result).age).toBeTypeOf(`number`);
  });
});
