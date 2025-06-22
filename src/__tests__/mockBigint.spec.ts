import { describe, expect, it } from "vitest";
import { pipe, pipeAsync, parse, parseAsync, maxValue, bigint, minValue, value } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockBigint`, () => {
  it.concurrent.each([bigint(), pipe(bigint(), minValue(100n), maxValue(200n)), pipe(bigint(), value(50n))])(
    `should generate valid mock data (%#)`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );

  it.concurrent.each([pipeAsync(bigint(), minValue(100n), maxValue(200n)), pipeAsync(bigint(), value(50n))])(
    `should generate valid mock data with async validation (%#)`,
    { repeats: 5 },
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
