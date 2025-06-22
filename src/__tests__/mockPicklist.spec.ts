import { describe, expect, it } from "vitest";
import { parse, picklist } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockPicklist`, () => {
  it.concurrent.each([picklist([`foo`, `bar`, `baz`])])(
    `should generate valid mock data (%#)`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema);
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );
});
