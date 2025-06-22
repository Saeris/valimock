import { describe, expect, it } from "vitest";
import { pipe, pipeAsync, parse, parseAsync, date, value, minValue, maxValue } from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

describe(`mockDate`, () => {
  const requirement = new Date(Date.now() + 3600000);

  it.concurrent.each([
    date(),
    pipe(date(), value(new Date(`2025-05-07T11:41:17.000Z`))),
    pipe(date(), minValue(requirement)),
    pipe(date(), maxValue(requirement))
  ])(`should generate valid mock data (%#)`, { repeats: 5 }, (schema) => {
    const result = mockSchema(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });

  it.concurrent.each([pipeAsync(date(), minValue(requirement)), pipeAsync(date(), maxValue(requirement))])(
    `should generate valid mock data with async validation (%#)`,
    { repeats: 5 },
    async (schema) => {
      const result = mockSchema(schema);
      await expect(parseAsync(schema, result)).resolves.toStrictEqual(result);
    }
  );
});
