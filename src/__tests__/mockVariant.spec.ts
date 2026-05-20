import * as fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock({ onWarn: () => {} }).mock;

enum PetType {
  CAT = `cat`,
  DOG = `dog`,
  BIRD = `bird`,
  FISH = `fish`
}

const petTypeSchema = v.enum_(PetType);

const petsSchema = v.intersect([
  v.object({
    name: v.pipe(v.string(), v.nonEmpty()),
    age: v.pipe(v.number(), v.integer())
  }),
  v.variant(`type`, [
    v.object({
      type: v.literal(PetType.CAT),
      sound: v.literal(`Meow`)
    }),
    v.object({
      type: v.literal(PetType.DOG),
      sound: v.literal(`Woof`)
    }),
    v.object({
      type: v.literal(PetType.BIRD),
      sound: v.literal(`Tweet`)
    }),
    v.object({
      type: v.optional(petTypeSchema)
    })
  ])
]);

const vehiclesSchema = v.intersect([
  v.object({
    make: v.pipe(v.string(), v.nonEmpty()),
    model: v.pipe(v.string(), v.nonEmpty())
  }),
  v.union([
    v.variant(`kind`, [
      v.object({
        kind: v.literal(`car`),
        type: v.picklist([`sedan`, `truck`, `suv`]),
        vin: v.pipe(v.string(), v.nonEmpty())
      }),
      v.object({
        kind: v.literal(`motorcylce`),
        vin: v.pipe(v.string(), v.nonEmpty())
      })
    ]),
    v.object({
      kind: v.exactOptional(v.picklist([`car`, `boat`, `motorcylce`, `airplane`]))
    })
  ])
]);

const nestedSchema = v.intersect([
  v.object({
    price: v.number(),
    quantity: v.pipe(v.number(), v.integer())
  }),
  v.variant(`kind`, [
    v.variant(`type`, [
      v.object({
        kind: v.literal(`fruit`),
        type: v.literal(`apple`),
        color: v.literal(`green`)
      }),
      v.object({
        kind: v.literal(`fruit`),
        type: v.literal(`banana`),
        color: v.literal(`yellow`)
      })
    ]),
    v.variant(`type`, [
      v.object({
        kind: v.literal(`vegetable`),
        type: v.literal(`carrot`),
        color: v.literal(`orange`)
      }),
      v.object({
        kind: v.literal(`vegetable`),
        type: v.literal(`tomato`),
        color: v.literal(`red`)
      })
    ])
  ])
]);

const variantSchemaArb: fc.Arbitrary<v.GenericSchema<unknown>> = fc
  .array(
    fc
      .record({
        tag: fc.string({ minLength: 1, maxLength: 8 }),
        bodyShape: fc.constantFrom(`string`, `number`, `boolean`)
      })
      .filter(({ tag }) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(tag)),
    { minLength: 2, maxLength: 4 }
  )
  .filter((entries) => {
    // variant requires unique discriminator values across options.
    const seen = new Set<string>();
    for (const { tag } of entries) {
      if (seen.has(tag)) return false;
      seen.add(tag);
    }
    return true;
  })
  .map((entries) => {
    const options = entries.map(({ tag, bodyShape }) => {
      const body = bodyShape === `string` ? v.string() : bodyShape === `number` ? v.number() : v.boolean();
      return v.object({ type: v.literal(tag), data: body });
    });
    return v.variant(`type`, options as never) as unknown as v.GenericSchema<unknown>;
  });

describe(`mockVariant`, () => {
  describe(`hand-written cases`, () => {
    it.concurrent.each([petsSchema, vehiclesSchema, nestedSchema])(
      `should generate valid mock data (%#)`,
      { repeats: 5 },
      (schema) => {
        const result = mockSchema(schema);
        expect(v.parse(schema, result)).toStrictEqual(result);
      }
    );
  });

  describe(`property-based`, () => {
    it(`every mock value round-trips through Valibot's parse`, () => {
      fc.assert(
        fc.property(variantSchemaArb, (schema) => {
          const result = mockSchema(schema);
          expect(v.parse(schema, result)).toEqual(result);
        }),
        { numRuns: 200 }
      );
    });
  });
});
