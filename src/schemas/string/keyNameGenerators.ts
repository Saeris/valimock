import type { Faker } from "@faker-js/faker";
import type { StringContext } from "./types.js";

/**
 * Generators chosen by *property name* when a string schema appears inside an
 * object schema. e.g. `firstName: pipe(string(), nonEmpty())` triggers the
 * `firstName` generator regardless of validations.
 *
 * Keys are matched case-insensitively. Add a new entry to extend coverage.
 */
export const keyNameGenerators: Record<string, (ctx: StringContext) => string> = {
  default: (ctx) => ctx.faker.lorem.word(),
  email: (ctx) => ctx.faker.internet.exampleEmail(),
  uuid: (ctx) => ctx.faker.string.uuid(),
  uid: (ctx) => ctx.faker.string.uuid(),
  url: (ctx) => ctx.faker.internet.url(),
  name: (ctx) => ctx.faker.person.fullName(),
  date: (ctx) => ctx.faker.date.recent().toISOString(),
  dateTime: (ctx) => ctx.faker.date.recent().toISOString(),
  colorHex: (ctx) => ctx.faker.color.rgb(),
  color: (ctx) => ctx.faker.color.rgb(),
  backgroundColor: (ctx) => ctx.faker.color.rgb(),
  textShadow: (ctx) => ctx.faker.color.rgb(),
  textColor: (ctx) => ctx.faker.color.rgb(),
  textDecorationColor: (ctx) => ctx.faker.color.rgb(),
  borderColor: (ctx) => ctx.faker.color.rgb(),
  borderTopColor: (ctx) => ctx.faker.color.rgb(),
  borderRightColor: (ctx) => ctx.faker.color.rgb(),
  borderBottomColor: (ctx) => ctx.faker.color.rgb(),
  borderLeftColor: (ctx) => ctx.faker.color.rgb(),
  borderBlockStartColor: (ctx) => ctx.faker.color.rgb(),
  borderBlockEndColor: (ctx) => ctx.faker.color.rgb(),
  borderInlineStartColor: (ctx) => ctx.faker.color.rgb(),
  borderInlineEndColor: (ctx) => ctx.faker.color.rgb(),
  columnRuleColor: (ctx) => ctx.faker.color.rgb(),
  outlineColor: (ctx) => ctx.faker.color.rgb(),
  phoneNumber: (ctx) => ctx.faker.phone.number(),
  username: (ctx) => ctx.faker.internet.username(),
  displayName: (ctx) => ctx.faker.internet.displayName(),
  firstName: (ctx) => ctx.faker.person.firstName(),
  middleName: (ctx) => ctx.faker.person.middleName(),
  lastName: (ctx) => ctx.faker.person.lastName(),
  fullName: (ctx) => ctx.faker.person.fullName(),
  gender: (ctx) => ctx.faker.person.gender(),
  sex: (ctx) => ctx.faker.person.sex(),
  zodiacSign: (ctx) => ctx.faker.person.zodiacSign(),
  isbn: (ctx) => ctx.faker.commerce.isbn(),
  iban: (ctx) => ctx.faker.finance.iban(),
  vin: (ctx) => ctx.faker.vehicle.vin(),
  vrm: (ctx) => ctx.faker.vehicle.vrm()
};

/** Type of the (deprecated) user-overridable Faker resolver. */
export type MockeryMapper = (
  keyName: string,
  fakerInstance: Faker
) => ((...args: unknown[]) => Date | boolean | number | string) | undefined;

/**
 * Last-resort discovery: walk Faker's namespaces looking for a method whose
 * name (case- and separator-insensitive) matches the property name and that
 * returns a primitive when invoked with no args.
 *
 * Honors a caller-provided `mockeryMapper` extension point first (deprecated).
 *
 * Returns a thunk so the discovery cost is only paid once per call.
 */
export const findFakerForKeyName = (
  keyName: string,
  faker: Faker,
  mockeryMapper?: MockeryMapper,
  onDeprecatedMapper?: () => void
): (() => Date | boolean | number | string) | undefined => {
  if (mockeryMapper) {
    const mapped = mockeryMapper(keyName, faker);
    if (mapped) {
      onDeprecatedMapper?.();
      return mapped as () => Date | boolean | number | string;
    }
  }
  const lower = keyName.toLowerCase();
  const compact = lower.replace(/_|-/g, ``);
  for (const sectionKey of Object.keys(faker) as Array<keyof Faker>) {
    const section = faker[sectionKey];
    if (!section || typeof section !== `object`) continue;
    for (const fnKey of Object.keys(section)) {
      const fnLower = fnKey.toLowerCase();
      if (fnLower !== lower && fnLower !== compact) continue;
      const fn = (section as Record<string, unknown>)[fnKey];
      if (typeof fn !== `function`) continue;
      try {
        const sample = (fn as () => unknown)();
        if (
          typeof sample === `string` ||
          typeof sample === `number` ||
          typeof sample === `boolean` ||
          sample instanceof Date
        ) {
          return fn as () => Date | boolean | number | string;
        }
      } catch {
        // fall through — this method needs args we don't have
      }
    }
  }
  return undefined;
};
