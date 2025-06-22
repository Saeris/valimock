import { describe, expect, it } from "vitest";
import { pipe, pipeAsync, parse, parseAsync, union, unionAsync, string, number, url, maxValue, integer } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockUnion`, () => {
  it.concurrent.each([union([pipe(string(), url()), pipe(number(), maxValue(20), integer())])])(
    `should generate valid mock data (%#)`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );

  it.concurrent.each([unionAsync([pipe(string(), url()), pipeAsync(number(), maxValue(20), integer())])])(
    `should generate valid mock data with async validation (%#)`,
    { repeats: 5 },
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
