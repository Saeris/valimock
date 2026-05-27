import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

type FilePipeItem = v.PipeItem<File, File, v.BaseIssue<unknown>>;

const fileSchemaArb: fc.Arbitrary<v.GenericSchema<File>> = fc.oneof(
  fc.constant(v.file()),

  fc.tuple(fc.nat({ max: 256 }), fc.integer({ min: 1, max: 512 })).map(([lo, range]) => {
    return v.pipe(v.file(), v.minSize(lo), v.maxSize(lo + range)) as unknown as v.GenericSchema<File>;
  }),

  fc.nat({ max: 256 }).map((n) => v.pipe(v.file(), v.size(n)) as unknown as v.GenericSchema<File>),

  fc
    .array(fc.constantFrom(`image/png`, `image/jpeg`, `application/pdf`, `text/plain`), { minLength: 1, maxLength: 3 })
    .map((types) => v.pipe(v.file(), v.mimeType(types) as FilePipeItem) as unknown as v.GenericSchema<File>)
);

describe(`mockFile`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(fileSchemaArb, (schema) => {
        const result = mock(schema);
        // jsdom / Node may or may not have File depending on version; if it
        // does, the result is a File; otherwise it's a placeholder object.
        if (typeof File !== `undefined`) {
          expect(result).toBeInstanceOf(File);
          expect(v.parse(schema, result)).toBe(result);
        }
      }),
      { numRuns: 100 }
    );
  });
});
