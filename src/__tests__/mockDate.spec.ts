import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockDate`, () => {
  const requirement = new Date(Date.now() + 3600000);

  it.concurrent.each([
    v.date(),
    v.pipe(v.date(), v.value(new Date(`2025-05-07T11:41:17.000Z`))),
    v.pipe(v.date(), v.minValue(requirement)),
    v.pipe(v.date(), v.maxValue(requirement))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([v.pipeAsync(v.date(), v.minValue(requirement)), v.pipeAsync(v.date(), v.maxValue(requirement))])(
    `should generate valid mock data with async validation (%#)`,
    { repeats: 5 },
    async (schema) => {
      const result = mockSchema(schema);
      await expect(v.parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
