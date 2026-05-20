import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockPicklist`, () => {
  it.concurrent.each([v.picklist([`foo`, `bar`, `baz`])])(
    `should generate valid mock data (%#)`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    }
  );
});
