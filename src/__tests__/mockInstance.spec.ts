import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";
import { captureWarnings } from "./helpers/captureWarnings.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

class ZeroArgClass {
  readonly label = `ok`;
}

class RequiresArgsClass {
  constructor(public value: string) {
    if (typeof value !== `string`) throw new TypeError(`value required`);
  }
}

describe(`mockInstance`, () => {
  describe(`zero-arg constructor`, () => {
    it(`returns an instance that passes parse`, () => {
      const schema = v.instance(ZeroArgClass);
      for (let i = 0; i < 5; i++) {
        const result = mock(schema);
        expect(result).toBeInstanceOf(ZeroArgClass);
        // The mock is a real instance, so parse round-trips to the same reference.
        expect(v.parse(schema, result)).toBe(result);
      }
    });

    it(`works with built-in zero-arg constructors (Date)`, () => {
      const schema = v.instance(Date);
      const result = mock(schema);
      expect(result).toBeInstanceOf(Date);
      expect(v.parse(schema, result)).toBe(result);
    });
  });

  describe(`constructor that requires arguments`, () => {
    it(`falls back to a prototype-based placeholder and warns`, () => {
      const { mock, warnings } = captureWarnings();
      const schema = v.instance(RequiresArgsClass);
      const result = mock(schema);
      // Object.create(prototype) preserves the instanceof check so parse passes.
      expect(result).toBeInstanceOf(RequiresArgsClass);
      // The warning records that we couldn't call the real constructor.
      expect(warnings.some((w) => w.includes(`RequiresArgsClass`))).toBe(true);
      expect(warnings.some((w) => w.includes(`prototype-based placeholder`))).toBe(true);
    });
  });
});
