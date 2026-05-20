import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { blob, maxSize, mimeType, minSize, parse, pipe, size } from "valibot";
import { Valimock } from "../Valimock.js";

const mock = new Valimock({ onWarn: () => {} }).mock;

type BlobPipeItem = v.PipeItem<Blob, Blob, v.BaseIssue<unknown>>;

const blobSchemaArb: fc.Arbitrary<v.GenericSchema<Blob>> = fc.oneof(
  fc.constant(blob()),

  // Size bounds.
  fc.tuple(fc.nat({ max: 256 }), fc.integer({ min: 1, max: 512 })).map(([lo, range]) => {
    return pipe(blob(), minSize(lo), maxSize(lo + range)) as unknown as v.GenericSchema<Blob>;
  }),

  // Exact size.
  fc.nat({ max: 256 }).map((n) => pipe(blob(), size(n)) as unknown as v.GenericSchema<Blob>),

  // MIME type allow-list.
  fc
    .array(fc.constantFrom(`image/png`, `image/jpeg`, `application/json`, `text/plain`), { minLength: 1, maxLength: 3 })
    .map((types) => pipe(blob(), mimeType(types) as BlobPipeItem) as unknown as v.GenericSchema<Blob>),

  // Size + MIME combined.
  fc.tuple(fc.integer({ min: 32, max: 256 }), fc.constantFrom(`image/png`, `application/pdf`)).map(([sz, mt]) => {
    return pipe(blob(), size(sz), mimeType([mt]) as BlobPipeItem) as unknown as v.GenericSchema<Blob>;
  })
);

describe(`mockBlob property-based`, () => {
  it(`every mock value round-trips through Valibot's parse`, () => {
    fc.assert(
      fc.property(blobSchemaArb, (schema) => {
        const result = mock(schema);
        expect(result).toBeInstanceOf(Blob);
        expect(parse(schema, result)).toBe(result);
      }),
      { numRuns: 100 }
    );
  });
});
