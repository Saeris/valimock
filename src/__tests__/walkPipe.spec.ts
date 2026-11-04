import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

describe(`nested pipes`, () => {
  const m = new Valimock({ onWarn: () => {} }).mock;

  it(`honor constraints declared in an inner pipe`, () => {
    // Libraries build schemas incrementally, so `v.pipe(v.pipe(...), ...)`
    // is common. The inner pipe's actions must be collected, otherwise an
    // integer constraint is silently dropped and a float comes out.
    const schema = v.pipe(
      v.pipe(v.number(), v.integer(), v.minValue(0)),
      v.maxValue(10)
    );
    for (let i = 0; i < 50; i++) {
      const value = m(schema);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it(`apply inner and outer string constraints together`, () => {
    const schema = v.pipe(
      v.pipe(v.string(), v.minLength(8)),
      v.maxLength(12),
      v.startsWith(`id-`)
    );
    for (let i = 0; i < 50; i++) {
      const value = m(schema);
      expect(v.safeParse(schema, value).success).toBe(true);
    }
  });

  it(`flatten arbitrarily deep nesting`, () => {
    const schema = v.pipe(
      v.pipe(v.pipe(v.array(v.string()), v.minLength(2)), v.maxLength(3)),
      v.description(`ids`)
    );
    for (let i = 0; i < 20; i++) {
      const value = m(schema);
      expect(value.length).toBeGreaterThanOrEqual(2);
      expect(value.length).toBeLessThanOrEqual(3);
    }
  });
});
