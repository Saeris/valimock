import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";
import { captureWarnings } from "./helpers/captureWarnings.js";

describe(`mockCustom`, () => {
  it(`without a customMocks entry: warns and returns undefined`, () => {
    // `custom()` validates via an arbitrary user predicate Valimock can't
    // introspect. The library has no general way to produce a satisfying
    // value, so it must surface that explicitly rather than silently
    // returning undefined (the previous behavior was a footgun).
    const { mock, warnings } = captureWarnings();
    const schema = v.custom((input) => typeof input === `string` && input === `expected`);
    const result = mock(schema);
    expect(result).toBeUndefined();
    expect(warnings.some((w) => w.includes(`No built-in mocker`) && w.includes(`custom`))).toBe(true);
  });

  it(`with a customMocks entry: the override is invoked and the result round-trips`, () => {
    const schema = v.custom((input) => typeof input === `string` && input === `expected`);
    const m = new Valimock({
      onWarn: () => {},
      customMocks: {
        custom: () => `expected`
      }
    }).mock;
    const result = m(schema);
    expect(result).toBe(`expected`);
    expect(v.parse(schema, result)).toBe(`expected`);
  });

  it(`customAsync without a customMocks entry: warns the same way`, () => {
    // customAsync produces `type: "custom"` just like custom(), so it routes
    // through the same dispatch path and surfaces the same warning.
    const { mock, warnings } = captureWarnings();
    const schema = v.customAsync(async (input) => typeof input === `string`);
    const result = mock(schema as never);
    expect(result).toBeUndefined();
    expect(warnings.some((w) => w.includes(`No built-in mocker`) && w.includes(`custom`))).toBe(true);
  });
});
