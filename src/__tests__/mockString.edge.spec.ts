import { describe, expect, it, vi } from "vite-plus/test";
import {
  email,
  endsWith,
  excludes,
  includes,
  length,
  maxLength,
  minLength,
  notLength,
  notValue,
  notValues,
  object,
  parse,
  pipe,
  startsWith,
  string,
  type GenericSchema,
  value as valueAction,
  values as valuesAction
} from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

/**
 * Edge cases that the broader property test deliberately filters out — these
 * exercise the constraint-handling code in src/string/phases.ts that
 * doesn't get visited by `format ⊕ bounds`-shaped schemas.
 */

describe(`mockString edge cases — substring constraints`, () => {
  it(`startsWith only: result starts with the required prefix`, () => {
    const schema = pipe(string(), startsWith(`pfx-`));
    for (let i = 0; i < 20; i++) {
      const result = mock(schema);
      expect(result).toMatch(/^pfx-/);
      expect(parse(schema, result)).toBe(result);
    }
  });

  it(`endsWith only: result ends with the required suffix`, () => {
    const schema = pipe(string(), endsWith(`.suffix`));
    for (let i = 0; i < 20; i++) {
      const result = mock(schema);
      expect(result.endsWith(`.suffix`)).toBe(true);
      expect(parse(schema, result)).toBe(result);
    }
  });

  it(`startsWith + endsWith + maxLength: enforce truncates while preserving tail`, () => {
    // Forces enforce()'s "truncate preserving endsWith" branch.
    const schema = pipe(string(), startsWith(`a`), endsWith(`z`), maxLength(20));
    for (let i = 0; i < 20; i++) {
      const result = mock(schema);
      expect(result.startsWith(`a`)).toBe(true);
      expect(result.endsWith(`z`)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(parse(schema, result)).toBe(result);
    }
  });

  it(`includes: result contains each required substring`, () => {
    const schema = pipe(string(), includes(`foo`), includes(`bar`));
    for (let i = 0; i < 20; i++) {
      const result = mock(schema);
      expect(result).toContain(`foo`);
      expect(result).toContain(`bar`);
      expect(parse(schema, result)).toBe(result);
    }
  });

  it(`excludes: result does not contain forbidden substrings (retry until satisfied)`, () => {
    // `excludes` is checked in satisfies() — the orchestrator regenerates
    // until faker happens to produce output without the substring.
    const schema = pipe(string(), excludes(`zzzzzz`)) as GenericSchema<string>;
    for (let i = 0; i < 20; i++) {
      const result = mock(schema);
      expect(result).not.toContain(`zzzzzz`);
      expect(parse(schema, result)).toBe(result);
    }
  });
});

describe(`mockString edge cases — value constraints`, () => {
  it(`value: returns the exact pinned value`, () => {
    const schema = pipe(string(), valueAction(`pinned`));
    for (let i = 0; i < 5; i++) {
      expect(mock(schema)).toBe(`pinned`);
    }
  });

  it(`values: returns one of the allow-list entries`, () => {
    const schema = pipe(string(), valuesAction([`one`, `two`, `three`]));
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(mock(schema));
    }
    for (const v of seen) {
      expect([`one`, `two`, `three`]).toContain(v);
    }
  });

  it(`values + not_values: produces an allow-list entry not in the forbidden set`, () => {
    const schema = pipe(string(), valuesAction([`good`, `bad`, `ugly`]), notValues([`bad`]));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect([`good`, `ugly`]).toContain(result);
      expect(result).not.toBe(`bad`);
    }
  });

  it(`not_value: never returns the forbidden string`, () => {
    // The orchestrator retries until satisfies() accepts.
    const schema = pipe(string(), notValue(`forbidden-exact-value-aaa`));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect(result).not.toBe(`forbidden-exact-value-aaa`);
    }
  });
});

describe(`mockString edge cases — length constraints`, () => {
  it(`not_length: result length avoids the forbidden value`, () => {
    // bounds.min=4 .. bounds.max=8 with not_length(5,6,7) leaves only 4 or 8.
    const schema = pipe(string(), minLength(4), maxLength(8), notLength(5), notLength(6), notLength(7));
    for (let i = 0; i < 30; i++) {
      const result = mock(schema);
      expect([4, 8]).toContain(result.length);
      expect(parse(schema, result)).toBe(result);
    }
  });
});

describe(`mockString edge cases — stringMap override`, () => {
  it(`stringMap entry is invoked when keyName matches`, () => {
    const customMock = vi.fn(() => `CUSTOM-VALUE`);
    const mockWithMap = new Valimock({
      onWarn: () => {},
      stringMap: { customField: customMock }
    }).mock;

    const objSchema = object({ customField: string() });
    const result = mockWithMap(objSchema as never) as { customField: string };
    expect(result.customField).toBe(`CUSTOM-VALUE`);
    expect(customMock).toHaveBeenCalled();
  });

  it(`stringMap overrides format generators by key name`, () => {
    const schema = object({ email: pipe(string(), email()) });
    const mockWithMap = new Valimock({
      onWarn: () => {},
      stringMap: { email: () => `override@example.com` }
    }).mock;
    const result = mockWithMap(schema as never) as { email: string };
    expect(result.email).toBe(`override@example.com`);
  });
});

describe(`mockString edge cases — diagnostics`, () => {
  it(`onWarn fires when retry budget is exhausted on impossible constraints`, () => {
    const warnings: string[] = [];
    const m = new Valimock({ onWarn: (msg) => warnings.push(msg) }).mock;

    // Inherently unsatisfiable: length(3) + email() (no valid email fits in 3 chars).
    const schema = pipe(string(), email(), length(3));
    m(schema);
    expect(warnings.some((w) => w.includes(`Could not satisfy`))).toBe(true);
  });
});
