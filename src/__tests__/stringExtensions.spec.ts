import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  type StringActionHandler,
  type StringFormatGenerator,
  Valimock
} from "../Valimock.js";
import { captureWarnings } from "./helpers/captureWarnings.js";

/**
 * A third-party string action in the shape Valibot uses for its own format
 * actions (`email()`, `url()`): a validation with a distinct `type` and a
 * regex requirement.
 */
const DID_REGEX = /^did:plc:[a-z2-7]{24}$/u;
const did = (): v.RegexAction<string, undefined> => ({
  ...v.regex(DID_REGEX),
  type: `did` as `regex`
});

/**
 * A third-party action whose requirement the generator needs: an `accept`
 * list of MIME type patterns.
 */
const accept = (requirement: readonly string[]): v.GenericPipeItem<string> =>
  ({
    ...v.check<string>((input) => requirement.includes(input)),
    type: `accept`,
    requirement
  }) as unknown as v.GenericPipeItem<string>;

const stringActions: Record<string, StringActionHandler> = {
  did: (ctx) => {
    ctx.format = `did`;
  },
  accept: (ctx, action) => {
    ctx.format = `mime`;
    ctx.custom.accept = (
      action as unknown as { requirement: readonly string[] }
    ).requirement;
  }
};

const stringFormats: Record<string, StringFormatGenerator> = {
  did: (ctx) =>
    `did:plc:${ctx.faker.string.fromCharacters(`abcdefghijklmnopqrstuvwxyz234567`, 24)}`,
  mime: (ctx) =>
    ctx.faker.helpers.arrayElement(ctx.custom.accept as readonly string[])
};

describe(`stringActions and stringFormats`, () => {
  it(`route a foreign action to its generator`, () => {
    // Without the registry, an unknown action is ignored and the value is a
    // lorem word that fails the regex. With it, the handler names a format and
    // the generator produces a passing value.
    const schema = v.pipe(v.string(), did());
    const { mock, warnings } = captureWarnings({
      stringActions,
      stringFormats
    });
    for (let i = 0; i < 20; i++) {
      expect(v.parse(schema, mock(schema))).toMatch(DID_REGEX);
    }
    expect(warnings).toStrictEqual([]);
  });

  it(`hand data from the handler to the generator through ctx.custom`, () => {
    const schema = v.pipe(v.string(), accept([`image/png`, `image/jpeg`]));
    const { mock } = captureWarnings({ stringActions, stringFormats });
    for (let i = 0; i < 20; i++) {
      expect([`image/png`, `image/jpeg`]).toContain(mock(schema));
    }
  });

  it(`keep the built-in constraints working alongside foreign actions`, () => {
    // Length bounds, substring rules and stringMap are collected by the
    // built-in handlers that the user table is merged over, not replaced.
    const schema = v.object({
      id: v.pipe(v.string(), did(), v.maxLength(32)),
      name: v.pipe(v.string(), v.minLength(3), v.maxLength(5))
    });
    const m = new Valimock({
      onWarn: () => {},
      stringActions,
      stringFormats,
      stringMap: { name: () => `abcd` }
    }).mock;
    const result = m(schema);
    expect(v.parse(schema, result)).toStrictEqual(result);
    expect(result.name).toBe(`abcd`);
  });

  it(`can override a built-in action`, () => {
    // The merge order (user over built-in) is what lets a caller change how
    // Valimock interprets an action it already knows.
    const schema = v.pipe(v.string(), v.email());
    const m = new Valimock({
      onWarn: () => {},
      stringActions: {
        email: (ctx) => {
          ctx.format = `corporate`;
        }
      },
      stringFormats: {
        corporate: (ctx) => `${ctx.faker.internet.username()}@example.com`
      }
    }).mock;
    expect(m(schema)).toMatch(/@example\.com$/u);
  });

  it(`still warn about actions no handler knows`, () => {
    const schema = v.pipe(v.string(), did());
    const { mock, warnings } = captureWarnings();
    mock(schema);
    expect(warnings.some((w) => w.includes(`did`))).toBe(true);
  });
});
