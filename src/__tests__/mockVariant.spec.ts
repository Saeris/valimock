import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

enum PetType {
  CAT = `cat`,
  DOG = `dog`,
  BIRD = `bird`,
  FISH = `fish`
}

const petTypeSchema = v.enum_(PetType);

const petsSchema = v.intersect([
  // common properties
  v.object({
    name: v.pipe(v.string(), v.nonEmpty()),
    age: v.pipe(v.number(), v.integer())
  }),
  // type specific properties
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

describe(`mockVariant`, () => {
  it.concurrent.each([petsSchema, vehiclesSchema, nestedSchema])(
    `should generate valid mock data (%#)`,
    { repeats: 5 },
    (schema) => {
      const result = mockSchema(schema);
      expect(v.parse(schema, result)).toStrictEqual(result);
    }
  );
});
