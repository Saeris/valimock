import type { Faker } from "@faker-js/faker";
import { describe, expect, it } from "vite-plus/test";
import { findFakerForKeyName } from "../schemas/string/keyNameGenerators.js";

/**
 * Regression / behavior test for the `findFakerForKeyName` cache.
 *
 * The cache is observable only via its *effect*: a cached call must not
 * re-walk `Object.keys(faker)` or invoke faker section methods. We use a
 * minimal faker-shaped stub instrumented with counters so we can assert
 * on call counts rather than wall-clock timing (which is flaky in CI).
 *
 * The stub returns the proxy AND a separate counters object — the counters
 * are kept off the proxy itself so reading them doesn't perturb the proxy's
 * own-keys trap (and so the discovery walk doesn't accidentally see them
 * as faker sections).
 */

interface FakerStub {
  faker: Faker;
  counters: {
    /** How many times the discovery walk scanned this faker. */
    scanCount: number;
    /** How many times the discovery walk invoked a candidate method. */
    invokeCount: number;
  };
}

const makeStubFaker = (): FakerStub => {
  const counters = { scanCount: 0, invokeCount: 0 };

  const person = {
    firstName: (): string => {
      counters.invokeCount++;
      return `Alice`;
    },
    nonResolving: (): never => {
      counters.invokeCount++;
      throw new Error(`requires args`);
    }
  };

  const target: Record<string, unknown> = { person };

  // `Object.keys(faker)` invokes the proxy's `ownKeys` trap (incrementing
  // our counter) and then filters by enumerability via `getOwnPropertyDescriptor`.
  // We trap both so the filter step preserves visibility of the keys we
  // care about.
  const proxy = new Proxy(target, {
    ownKeys(t) {
      counters.scanCount++;
      return Reflect.ownKeys(t);
    },
    getOwnPropertyDescriptor(t, key) {
      return Reflect.getOwnPropertyDescriptor(t, key);
    }
  });

  return { faker: proxy as unknown as Faker, counters };
};

describe(`findFakerForKeyName cache`, () => {
  it(`scans faker exactly once for repeated hits on the same keyName`, () => {
    const { faker, counters } = makeStubFaker();
    const fn1 = findFakerForKeyName(`firstName`, faker);
    const fn2 = findFakerForKeyName(`firstName`, faker);
    const fn3 = findFakerForKeyName(`firstName`, faker);

    expect(fn1).toBeDefined();
    expect(fn2).toBeDefined();
    expect(fn3).toBeDefined();
    // The discovery walk should have scanned faker exactly once across all
    // three calls; subsequent calls hit the cache.
    expect(counters.scanCount).toBe(1);
  });

  it(`negative caching: repeated misses don't re-scan faker`, () => {
    const { faker, counters } = makeStubFaker();
    const fn1 = findFakerForKeyName(`completelyUnknownKey`, faker);
    const fn2 = findFakerForKeyName(`completelyUnknownKey`, faker);
    const fn3 = findFakerForKeyName(`completelyUnknownKey`, faker);

    expect(fn1).toBeUndefined();
    expect(fn2).toBeUndefined();
    expect(fn3).toBeUndefined();
    expect(counters.scanCount).toBe(1);
  });

  it(`distinct keyNames each scan once, regardless of order`, () => {
    const { faker, counters } = makeStubFaker();
    findFakerForKeyName(`firstName`, faker);
    findFakerForKeyName(`unknownKey1`, faker);
    findFakerForKeyName(`firstName`, faker); // cached hit
    findFakerForKeyName(`unknownKey2`, faker);
    findFakerForKeyName(`unknownKey1`, faker); // cached miss

    // Three distinct keyNames → three discovery walks. Cache hits don't add.
    expect(counters.scanCount).toBe(3);
  });

  it(`different faker instances maintain separate caches`, () => {
    const a = makeStubFaker();
    const b = makeStubFaker();

    findFakerForKeyName(`firstName`, a.faker);
    findFakerForKeyName(`firstName`, a.faker); // cached on A
    expect(a.counters.scanCount).toBe(1);
    expect(b.counters.scanCount).toBe(0);

    findFakerForKeyName(`firstName`, b.faker);
    expect(b.counters.scanCount).toBe(1);
    expect(a.counters.scanCount).toBe(1);
  });

  it(`case-insensitive cache: differently-cased keyNames share an entry`, () => {
    const { faker, counters } = makeStubFaker();
    findFakerForKeyName(`firstName`, faker);
    findFakerForKeyName(`FIRSTNAME`, faker);
    findFakerForKeyName(`FirstName`, faker);
    findFakerForKeyName(`firstname`, faker);

    expect(counters.scanCount).toBe(1);
  });

  it(`mockeryMapper path bypasses the cache (deprecation warning must still fire on every call)`, () => {
    const { faker } = makeStubFaker();
    let mapperCalls = 0;
    let deprecationFires = 0;

    const mockeryMapper = (key: string): (() => string) | undefined => {
      mapperCalls++;
      return key === `mappedKey` ? () => `from-mapper` : undefined;
    };
    const onDeprecatedMapper = (): void => {
      deprecationFires++;
    };

    findFakerForKeyName(`mappedKey`, faker, mockeryMapper, onDeprecatedMapper);
    findFakerForKeyName(`mappedKey`, faker, mockeryMapper, onDeprecatedMapper);
    findFakerForKeyName(`mappedKey`, faker, mockeryMapper, onDeprecatedMapper);

    // Mapper is consulted on every call (no caching of its result).
    expect(mapperCalls).toBe(3);
    // Each call that resolves via the mapper fires the deprecation callback.
    // The Valimock dispatcher in turn de-duplicates these into a single
    // warning per instance — that's an orthogonal concern, not the
    // function-under-test's responsibility.
    expect(deprecationFires).toBe(3);
  });
});
