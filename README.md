<div align="center">

# 🃏 Valimock

[![npm version][npm_badge]][npm]
[![CI status][ci_badge]][ci]

Generate mock data for [Valibot][valibot] schemas using [Faker][faker]

</div>

---

## 📦 Installation

```bash
npm install --save-dev valimock @faker-js/faker
```

```bash
yarn add -D valimock @faker-js/faker
```

> [!NOTE]
>
> Tested against `valibot >= 1.4.0` and `@faker-js/faker >= 10.0.0`. Older
> versions of either may still work — the peer-dependency ranges remain
> permissive — but the test matrix runs against current majors.

## 🔧 Usage

Import and optionally configure a new instance of the `Valimock` class, then pass along your `valibot` schema to `mock()`, that's it!

```ts
import { parse, array, union, string, pipe, url, number, maxValue } from "valibot";
import { Valimock } from "valimock";

describe(`example test`, () => {
  it(`should generate valid mock data`, () => {
    const schema = array(union([pipe(string(), url()), pipe(number(), maxValue(20))]));
    const result = new Valimock().mock(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });
});
```

> [!NOTE]
>
> For async schemas, you will need to use `parseAsync()`. Be aware that async schemas generate a `Promise` and may need to be `await`'ed depending on usage.
>
> Please see the [`__tests__`][tests] folder for more usage examples of different schema types.

### Configuration

`new Valimock(options)` accepts a partial options object:

| option               | type                                  | default                | purpose                                                                                                                                                   |
| -------------------- | ------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `faker`              | `Faker`                               | default Faker instance | Faker instance used for all generation; supply your own to control locale or seeding centrally                                                            |
| `seed`               | `number \| number[]`                  | `undefined`            | Re-seeds Faker on every `mock()` call for deterministic output                                                                                            |
| `stringMap`          | `Record<string, () => string>`        | `undefined`            | Per-key string overrides (when generating strings inside an object). Wins over the built-in format/key-name routing.                                      |
| `customMocks`        | `Record<string, (schema) => unknown>` | `{}`                   | Generators for Valibot schema `type`s Valimock doesn't yet support. Keyed by `schema.type`.                                                               |
| `recordKeysLength`   | `number`                              | `1`                    | How many entries to generate for a `record()` schema                                                                                                      |
| `mapEntriesLength`   | `number`                              | `1`                    | How many entries to generate for a `map()` schema                                                                                                         |
| `throwOnUnknownType` | `boolean`                             | `false`                | When true, throw a `MockError` for unrecognized schema types instead of warning                                                                           |
| `onWarn`             | `(message: string) => void`           | `console.warn`         | Diagnostic sink. Receives unhandled-action notices, retry-budget exhaustion, and generation errors. Set to `() => {}` to silence.                         |
| `mockeryMapper`      | `MockeryMapper`                       | built-in defaults      | **Deprecated.** Prefer `stringMap` or contributing an action handler. Still consulted for backwards compatibility; emits a one-time warning when invoked. |

## API Coverage

Valimock's string mocking is built around a small pipeline (`src/string/`)
with a per-action registry. Adding support for a new Valibot action is a
one-line addition to the registry. See [Contributing](#-contributing) below.

Any schema type Valimock doesn't yet support can be handled by supplying a
`customMocks` entry keyed by the schema's `type` field.

### Schemas

|      Any       |      Array      |    Bigint     |     Blob      |   Boolean   |    Date     |      Enum       |
| :------------: | :-------------: | :-----------: | :-----------: | :---------: | :---------: | :-------------: |
|       ❌       |        ✔        |       ✔       |      ➖       |      ✔      |      ✔      |        ✔        |
|  **Instance**  |  **Intersect**  |  **Literal**  |    **Map**    |   **NaN**   |  **Never**  | **NonNullable** |
|       ➖       |        ✔        |       ✔       |       ✔       |      ✔      |     ❌      |        ✔        |
| **NonNullish** | **NonOptional** |   **Null**    | **Nullable**  | **Nullish** | **Number**  |   **Object**    |
|       ✔        |        ✔        |       ✔       |       ✔       |      ✔      |      ✔      |        ✔        |
|  **Optional**  |  **Picklist**   |  **Record**   | **Recursive** |   **Set**   | **Special** |   **String**    |
|       ✔        |        ✔        |       ✔       |       ✔       |      ✔      |     ➖      |        ✔        |
|   **Symbol**   |    **Tuple**    | **Undefined** |   **Union**   | **Unknown** | **Variant** |    **Void**     |
|       ➖       |        ✔        |       ✔       |       ✔       |     ❌      |      ✔      |       ❌        |

**Legend**: ✔ implemented · ⚠ partial · ❌ not implemented · ➖ unsupported / no meaningful mock representation

### Validations

#### Array

| `empty` | `includes` | `length` | `maxLength` | `minLength` | `nonEmpty` |
| :-----: | :--------: | :------: | :---------: | :---------: | :--------: |
|    ✔    |     ❌     |    ✔     |      ✔      |      ✔      |     ✔      |

#### Set

| `size` | `minSize` | `maxSize` | `notSize` |
| :----: | :-------: | :-------: | :-------: |
|   ✔    |     ✔     |     ✔     |     ✔     |

#### BigInt

| `gtValue` | `ltValue` | `maxValue` | `minValue` | `value` | `values` |
| :-------: | :-------: | :--------: | :--------: | :-----: | :------: |
|     ✔     |     ✔     |     ✔      |     ✔      |    ✔    |    ✔     |

#### Date

| `maxValue` | `minValue` | `value` |
| :--------: | :--------: | :-----: |
|     ✔      |     ✔      |    ✔    |

#### Number

| `finite` | `gtValue` | `integer` | `ltValue` | `maxValue` | `minValue` | `multipleOf` | `notValue` | `notValues` | `safeInteger` | `value` | `values` |
| :------: | :-------: | :-------: | :-------: | :--------: | :--------: | :----------: | :--------: | :---------: | :-----------: | :-----: | :------: |
|    ✔     |     ✔     |     ✔     |     ✔     |     ✔      |     ✔      |      ✔       |     ✔      |      ✔      |       ✔       |    ✔    |    ✔     |

#### String

| `base64` | `bic` | `bytes` | `creditCard` | `cuid2` | `decimal` | `digits` | `domain` | `email` | `emoji` | `empty` | `endsWith` | `excludes` |
| :------: | :---: | :-----: | :----------: | :-----: | :-------: | :------: | :------: | :-----: | :-----: | :-----: | :--------: | :--------: |
|    ✔     |   ✔   |    ✔    |      ✔       |    ✔    |     ✔     |    ✔     |    ✔     |    ✔    |    ✔    |    ✔    |     ✔      |     ✔      |

| `graphemes` | `hash` | `hexColor` | `hexadecimal` | `imei` | `includes` | `ip` | `ipv4` | `ipv6` | `isbn` | `isoDate` | `isoDateTime` | `isoDateTimeSecond` |
| :---------: | :----: | :--------: | :-----------: | :----: | :--------: | :--: | :----: | :----: | :----: | :-------: | :-----------: | :-----------------: |
|      ✔      |   ✔    |     ✔      |       ✔       |   ✔    |     ✔      |  ✔   |   ✔    |   ✔    |   ✔    |     ✔     |       ✔       |          ✔          |

| `isoTime` | `isoTimeSecond` | `isoTimestamp` | `isoWeek` | `isrc` | `jwsCompact` | `length` | `mac` | `mac48` | `mac64` | `maxBytes` | `maxGraphemes` | `maxLength` |
| :-------: | :-------------: | :------------: | :-------: | :----: | :----------: | :------: | :---: | :-----: | :-----: | :--------: | :------------: | :---------: |
|     ✔     |        ✔        |       ✔        |     ✔     |   ✔    |      ✔       |    ✔     |   ✔   |    ✔    |    ✔    |     ✔      |       ✔        |      ✔      |

| `maxWords` | `minBytes` | `minGraphemes` | `minLength` | `minWords` | `nanoid` | `nonEmpty` | `notBytes` | `notGraphemes` | `notLength` | `notValue` | `notValues` | `notWords` |
| :--------: | :--------: | :------------: | :---------: | :--------: | :------: | :--------: | :--------: | :------------: | :---------: | :--------: | :---------: | :--------: |
|     ✔      |     ✔      |       ✔        |      ✔      |     ✔      |    ✔     |     ✔      |     ✔      |       ✔        |      ✔      |     ✔      |      ✔      |     ✔      |

| `octal` | `regex` | `rfcEmail` | `slug` | `startsWith` | `ulid` | `url` | `uuid` | `value` | `values` | `words` |
| :-----: | :-----: | :--------: | :----: | :----------: | :----: | :---: | :----: | :-----: | :------: | :-----: |
|    ✔    |    ✔    |     ✔      |   ✔    |      ✔       |   ✔    |   ✔   |   ✔    |    ✔    |    ✔     |    ✔    |

Not yet implemented (string): `notEntries`. The `bytes` / `graphemes` /
`words` families currently treat each unit as `.length` (correct for ASCII
output, approximate for multi-byte content); a future enhancement may
distinguish them via `Intl.Segmenter`.

When Valimock encounters an action it doesn't know how to handle inside a
string pipe, it emits an `onWarn` notice and ignores the action — the
generated value satisfies the rest of the constraints but may not match
the unhandled one. Override `options.onWarn` to route those notices into
your test reporter or set `throwOnUnknownType: true` for strict mode.

## 🤝 Contributing

The project uses [Vite+][viteplus] as a unified toolchain (Oxlint + Oxfmt

- tsdown + Vitest) and [Bumpy][bumpy] for versioning and release.

```bash
vp install           # install dependencies
vp check --fix       # format + lint + typecheck (with autofixes)
vp test              # run Vitest
yarn bumpy add       # create a bump file for your PR
```

Adding support for a new Valibot string action is typically a two-line
change: register a handler in [`src/string/actionHandlers.ts`](src/string/actionHandlers.ts)
and (if the action is a format selector) add the matching generator to
[`src/string/formatGenerators.ts`](src/string/formatGenerators.ts).
The property-based test in [`src/__tests__/mockString.property.spec.ts`](src/__tests__/mockString.property.spec.ts)
will exercise the new combination automatically once the action appears
in its `formats` table.

## 📣 Acknowledgements

Valimock's implementation is based on [`@anatine/zod-mock`][zod-mock]

## 🥂 License

Released under the [MIT license][license] © [Drake Costa][personal-website].

[npm_badge]: https://img.shields.io/npm/v/valimock.svg?style=flat
[npm]: https://www.npmjs.com/package/valimock
[ci_badge]: https://github.com/Saeris/valimock/actions/workflows/ci.yml/badge.svg
[ci]: https://github.com/Saeris/valimock/actions/workflows/ci.yml
[valibot]: https://github.com/fabian-hiller/valibot
[faker]: https://github.com/faker-js/faker
[viteplus]: https://viteplus.dev/
[bumpy]: https://bumpy.varlock.dev/
[tests]: ./src/__tests__/
[zod-mock]: https://github.com/anatine/zod-plugins/tree/main/packages/zod-mock
[license]: ./LICENSE.md
[personal-website]: https://saeris.gg
