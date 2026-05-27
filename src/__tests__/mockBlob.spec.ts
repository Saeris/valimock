import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

type BlobPipeItem = v.PipeItem<Blob, Blob, v.BaseIssue<unknown>>;

const blobSchemaArb: fc.Arbitrary<v.GenericSchema<Blob>> = fc.oneof(
  fc.constant(v.blob()),

  // Size bounds.
  fc.tuple(fc.nat({ max: 256 }), fc.integer({ min: 1, max: 512 })).map(([lo, range]) => {
    return v.pipe(v.blob(), v.minSize(lo), v.maxSize(lo + range)) as unknown as v.GenericSchema<Blob>;
  }),

  // Exact size.
  fc.nat({ max: 256 }).map((n) => v.pipe(v.blob(), v.size(n)) as unknown as v.GenericSchema<Blob>),

  // MIME type allow-list.
  fc
    .array(fc.constantFrom(`image/png`, `image/jpeg`, `application/json`, `text/plain`), { minLength: 1, maxLength: 3 })
    .map((types) => v.pipe(v.blob(), v.mimeType(types) as BlobPipeItem) as unknown as v.GenericSchema<Blob>),

  // Size + MIME combined.
  fc.tuple(fc.integer({ min: 32, max: 256 }), fc.constantFrom(`image/png`, `application/pdf`)).map(([sz, mt]) => {
    return v.pipe(v.blob(), v.size(sz), v.mimeType([mt]) as BlobPipeItem) as unknown as v.GenericSchema<Blob>;
  })
);

describe(`mockBlob`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(blobSchemaArb, (schema) => {
        const result = mock(schema);
        expect(result).toBeInstanceOf(Blob);
        expect(v.parse(schema, result)).toBe(result);
      }),
      { numRuns: 100 }
    );
  });
});
