import type { Faker } from "@faker-js/faker";
import type { StringContext } from "./types.js";

/**
 * Generators chosen by *property name* when a string schema appears inside an
 * object schema. e.g. `firstName: pipe(string(), nonEmpty())` triggers the
 * `firstName` generator regardless of validations.
 *
 * Keys are matched case-insensitively. Add a new entry to extend coverage.
 *
 * Consumers should prefer the precomputed `keyNameGeneratorsByLowercase` Map
 * for lookups — the literal `keyNameGenerators` object exists for source
 * readability and as the bootstrap input.
 */
export const keyNameGenerators: Record<string, (ctx: StringContext) => string> =
  {
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

/**
 * Precomputed `Map<lowercaseKey, generator>` derived from `keyNameGenerators`.
 * Built once at module load so the per-mock keyName lookup is a single O(1)
 * `Map.get` instead of `Object.keys(...).find((k) => k.toLowerCase() === ...)`.
 */
export const keyNameGeneratorsByLowercase: ReadonlyMap<
  string,
  (ctx: StringContext) => string
> = new Map(
  Object.entries(keyNameGenerators).map(([key, fn]) => [key.toLowerCase(), fn])
);

/** Type of the (deprecated) user-overridable Faker resolver. */
export type MockeryMapper = (
  keyName: string,
  fakerInstance: Faker
) => ((...args: unknown[]) => Date | boolean | number | string) | undefined;

type DiscoveredFn = () => Date | boolean | number | string;

/**
 * Cache for `findFakerForKeyName`'s auto-discovery path. The discovery walk
 * over every section + method of `faker` is expensive (the report measured
 * it as 21.4% of CPU self-time on real schemas); without caching it ran
 * fresh on every string field whose `keyName` didn't hit a direct
 * `keyNameGenerators` entry.
 *
 * The cache is module-level and keyed by Faker instance via WeakMap so it
 * (a) survives across `Valimock` instance constructions when callers share a
 * faker (the common case in tests) and (b) becomes eligible for GC when the
 * faker instance is unreachable.
 *
 * Values are `DiscoveredFn | null` so negative results are cached too — a
 * keyName like `irrelevantSubfield` that doesn't resolve must not re-scan
 * the entire faker tree on every subsequent string field with the same name.
 *
 * The deprecated `mockeryMapper` path bypasses the cache entirely: it emits
 * a one-time deprecation warning that callers should see on every distinct
 * invocation, and its output depends on the user-supplied mapper rather
 * than a deterministic property of `faker`.
 */
const discoveryCache = new WeakMap<Faker, Map<string, DiscoveredFn | null>>();

const getDiscoveryCache = (faker: Faker): Map<string, DiscoveredFn | null> => {
  let cache = discoveryCache.get(faker);
  if (!cache) {
    cache = new Map();
    discoveryCache.set(faker, cache);
  }
  return cache;
};

const discover = (lower: string, faker: Faker): DiscoveredFn | undefined => {
  const compact = lower.replace(/_|-/g, ``);
  for (const section of Object.values(faker)) {
    if (!isFakerSection(section)) continue;
    for (const [fnKey, fn] of Object.entries(section)) {
      const fnLower = fnKey.toLowerCase();
      if (fnLower !== lower && fnLower !== compact) continue;
      if (typeof fn !== `function`) continue;
      try {
        const sample: unknown = fn();
        if (
          typeof sample === `string` ||
          typeof sample === `number` ||
          typeof sample === `boolean` ||
          sample instanceof Date
        ) {
          // `fn` is a verified function that just returned a primitive/Date —
          // exactly `DiscoveredFn`'s contract — but TS only knows it's
          // `Function`. The runtime sample check is the proof.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          return fn as DiscoveredFn;
        }
      } catch {
        // fall through — this method needs args we don't have
      }
    }
  }
  return undefined;
};

/**
 * A Faker namespace section (e.g. `faker.internet`) — a non-null object whose
 * members we introspect by name. Faker sections are class instances, so this
 * narrows to a string-keyed record (values stay `unknown`; the caller checks
 * each member is callable) without asserting.
 */
const isFakerSection = (section: unknown): section is Record<string, unknown> =>
  typeof section === `object` && section !== null;

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
): DiscoveredFn | undefined => {
  if (mockeryMapper) {
    const mapped = mockeryMapper(keyName, faker);
    if (mapped) {
      onDeprecatedMapper?.();
      return mapped as DiscoveredFn;
    }
  }
  const lower = keyName.toLowerCase();
  const cache = getDiscoveryCache(faker);
  // Two-state cache: `null` means we've already scanned and found nothing;
  // anything else is a cached fn. `Map.has()` distinguishes both from "not
  // yet scanned" (key absent).
  if (cache.has(lower)) {
    return cache.get(lower) ?? undefined;
  }
  const discovered = discover(lower, faker);
  cache.set(lower, discovered ?? null);
  return discovered;
};
