import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

describe(`customMocks precedence`, () => {
  // `customMocks` entries are consulted BEFORE the built-in `#schemas`
  // dispatcher. This lets callers override built-in mockers for schema types
  // Valimock already supports — the canonical use case is restoring the
  // pre-1.5 `v.any()` behavior (`() => undefined`) when downstream tests
  // were written against schemas where `v.any()` fields are expected to be
  // absent rather than carry a random concrete value.
  it(`customMocks.any overrides #mockAny`, () => {
    const schema = v.object({ required: v.string(), placeholder: v.any() });
    const m = new Valimock({
      onWarn: () => {},
      customMocks: { any: () => undefined }
    }).mock;
    for (let i = 0; i < 10; i++) {
      const result = m(schema) as { required: string; placeholder: unknown };
      expect(result.placeholder).toBeUndefined();
    }
  });

  it(`customMocks.string overrides built-in string generation`, () => {
    // Demonstrates the override path is general — not specific to `any`.
    // Callers can replace any built-in mocker by registering its `type`.
    const schema = v.string();
    const m = new Valimock({
      onWarn: () => {},
      customMocks: { string: () => `FIXED` }
    }).mock;
    expect(m(schema)).toBe(`FIXED`);
  });

  it(`when no customMocks entry exists, built-in mockers still run`, () => {
    // Sanity: registering an unrelated override mustn't break other types.
    const m = new Valimock({
      onWarn: () => {},
      customMocks: { custom: () => `irrelevant` }
    }).mock;
    const result = m(v.boolean());
    expect(typeof result).toBe(`boolean`);
  });
});
