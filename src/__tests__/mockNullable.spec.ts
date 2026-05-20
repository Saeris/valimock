import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockNullable`, () => {
  it.concurrent.each([v.nullable(v.string())])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([v.nullableAsync(v.string())])(
    `should generate valid mock data with async validation (%#)`,
    { repeats: 5 },
    async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
