import { describe, expect, it } from "vitest";
import {
  pipe,
  parse,
  string,
  intersect,
  object,
  variant,
  enum_,
  literal,
  nonEmpty,
  number,
  integer,
  optional,
  picklist,
  exactOptional,
  union
} from "valibot";
import { Valimock } from "../Valimock.js";

const mockSchema = new Valimock().mock;

enum PetType {
  CAT = `cat`,
  DOG = `dog`,
  BIRD = `bird`,
  FISH = `fish`
}

const petTypeSchema = enum_(PetType);

const petsSchema = intersect([
  // common properties
  object({
    name: pipe(string(), nonEmpty()),
    age: pipe(number(), integer())
  }),
  // type specific properties
  variant(`type`, [
    object({
      type: literal(PetType.CAT),
      sound: literal(`Meow`)
    }),
    object({
      type: literal(PetType.DOG),
      sound: literal(`Woof`)
    }),
    object({
      type: literal(PetType.BIRD),
      sound: literal(`Tweet`)
    }),
    object({
      type: optional(petTypeSchema)
    })
  ])
]);

const vehiclesSchema = intersect([
  object({
    make: pipe(string(), nonEmpty()),
    model: pipe(string(), nonEmpty())
  }),
  union([
    variant(`kind`, [
      object({
        kind: literal(`car`),
        type: picklist([`sedan`, `truck`, `suv`]),
        vin: pipe(string(), nonEmpty())
      }),
      object({
        kind: literal(`motorcylce`),
        vin: pipe(string(), nonEmpty())
      })
    ]),
    object({
      kind: exactOptional(picklist([`car`, `boat`, `motorcylce`, `airplane`]))
    })
  ])
]);

const nestedSchema = intersect([
  object({
    price: number(),
    quantity: pipe(number(), integer())
  }),
  variant(`kind`, [
    variant(`type`, [
      object({
        kind: literal(`fruit`),
        type: literal(`apple`),
        color: literal(`green`)
      }),
      object({
        kind: literal(`fruit`),
        type: literal(`banana`),
        color: literal(`yellow`)
      })
    ]),
    variant(`type`, [
      object({
        kind: literal(`vegetable`),
        type: literal(`carrot`),
        color: literal(`orange`)
      }),
      object({
        kind: literal(`vegetable`),
        type: literal(`tomato`),
        color: literal(`red`)
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
      expect(parse(schema, result)).toStrictEqual(result);
    }
  );
});
