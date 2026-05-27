import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockObject`, () => {
  it.concurrent.each([
    v.required(
      v.object({
        name: v.exactOptional(v.string()),
        age: v.exactOptional(v.number())
      })
    )
  ])(`should always include all keys by default (%#)`, { repeats: 10 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
    expect(v.parse(schema, result)).toHaveProperty(`name`);
    expect(v.parse(schema, result).name).toBeTypeOf(`string`);
    expect(v.parse(schema, result)).toHaveProperty(`age`);
    expect(v.parse(schema, result).age).toBeTypeOf(`number`);
  });

  it.concurrent.each([
    v.required(
      v.object({
        name: v.exactOptional(v.string()),
        age: v.exactOptional(v.number())
      }),
      [`age`]
    )
  ])(`should generate valid mock data (%#)`, { repeats: 10 }, (schema) => {
    const result = mockSchema(schema); //?
    expect(v.parse(schema, result)).toStrictEqual(result);
    expect(v.parse(schema, result).name).toBeOneOf([expect.any(String), undefined]);
    expect(v.parse(schema, result)).toHaveProperty(`age`);
    expect(v.parse(schema, result).age).toBeTypeOf(`number`);
  });
});
