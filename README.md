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

## API Coverage

> [!WARNING]
>
> At present, not all of `valibot`'s API is fully covered by `valimock`, however, any unimplemented schema type can be handled by a user-supplied map via the `customMocks` configuration option. The schema's `type` proerty is used as the property key for this map.

|            | Implemented | Incomplete | Not Implemented | Unsupported |
| ---------- | :---------: | :--------: | :-------------: | :---------: |
| **Symbol** |      ✔      |     ⚠      |       ❌        |     ➖      |

### Schemas

|      Any       |      Array      |    Bigint     |     Blob      |   Boolean   |    Date     |      Enum       |
| :------------: | :-------------: | :-----------: | :-----------: | :---------: | :---------: | :-------------: |
|       ❌       |        ✔        |       ✔       |      ➖       |      ✔      |      ⚠      |        ✔        |
|  **Instance**  |  **Intersect**  |  **Literal**  |    **Map**    |   **NaN**   |  **Never**  | **NonNullable** |
|       ➖       |        ✔        |       ✔       |       ✔       |      ✔      |     ❌      |        ✔        |
| **NonNullish** | **NonOptional** |   **Null**    | **Nullable**  | **Nullish** | **Number**  |   **Object**    |
|       ✔        |        ✔        |       ✔       |       ✔       |      ✔      |      ⚠      |        ✔        |
|  **Optional**  |  **Picklist**   |  **Record**   | **Recursive** |   **Set**   | **Special** |   **String**    |
|       ✔        |        ✔        |       ✔       |       ✔       |      ✔      |     ➖      |        ⚠        |
|   **Symbol**   |    **Tuple**    | **Undefined** |   **Union**   | **Unknown** | **Variant** |    **Void**     |
|       ➖       |        ✔        |       ✔       |       ✔       |     ❌      |     ❌      |       ❌        |

### Validations

Below is an incomplete list of supported validations for the given schemas.

#### Array

|     check     |    checkItems    |     empty     |   everyItem   |   excludes   |
| :-----------: | :--------------: | :-----------: | :-----------: | :----------: |
|      ❌       |        ❌        |       ✔       |      ❌       |      ❌      |
| **includes**  |    **length**    | **maxLength** | **minLength** | **nonEmpty** |
|      ❌       |        ✔         |       ✔       |       ✔       |      ✔       |
| **notLength** | **partialCheck** | **rawCheck**  | **someItem**  |
|      ❌       |        ❌        |      ❌       |      ❌       |

#### BigInt

|     check      |   gtValue    |    ltValue    |   maxValue   | minValue  |
| :------------: | :----------: | :-----------: | :----------: | :-------: |
|       ❌       |      ❌      |      ❌       |      ✔       |     ✔     |
| **multipleOf** | **notValue** | **notValues** | **rawCheck** | **value** |
|       ❌       |      ❌      |      ❌       |      ❌      |     ✔     |
|   **values**   |
|       ❌       |

#### Date

|    check     |    gtValue    |   ltValue    | maxValue  |  minValue  |
| :----------: | :-----------: | :----------: | :-------: | :--------: |
|      ❌      |      ❌       |      ❌      |     ✔     |     ✔      |
| **notValue** | **notValues** | **rawCheck** | **value** | **values** |
|      ❌      |      ❌       |      ❌      |     ✔     |     ❌     |

#### Number

|    check     |     finite      |    gtValue     |   integer    |    ltValue    |
| :----------: | :-------------: | :------------: | :----------: | :-----------: |
|      ❌      |       ❌        |       ❌       |      ✔       |      ❌       |
| **maxValue** |  **minValue**   | **multipleOf** | **notValue** | **notValues** |
|      ✔       |        ✔        |       ❌       |      ❌      |      ❌       |
| **rawCheck** | **safeInteger** |   **value**    |  **values**  |
|      ❌      |       ❌        |       ✔        |      ❌      |

#### String

|      base64      |        bic        |      bytes       |    creditCard    |      cuid2      |
| :--------------: | :---------------: | :--------------: | :--------------: | :-------------: |
|        ✔         |         ✔         |        ❌        |        ✔         |        ✔        |
|      check       |      decimal      |    **digits**    |    **email**     |    **emoji**    |
|        ❌        |         ✔         |        ✔         |        ✔         |        ✔        |
|    **empty**     |   **endsWith**    |   **excludes**   |  **graphemes**   |   **gtValue**   |
|        ✔         |        ❌         |        ❌        |        ❌        |       ❌        |
|     **hash**     |  **hexadecimal**  |   **hexColor**   |     **imei**     |  **includes**   |
|        ❌        |         ✔         |        ✔         |        ✔         |       ❌        |
|      **ip**      |     **ipv4**      |     **ipv6**     |   **isoDate**    | **isoDateTime** |
|        ✔         |         ✔         |        ✔         |        ✔         |        ✔        |
|   **isoTime**    | **isoTimeSecond** | **isoTimestamp** |   **isoWeek**    |   **length**    |
|        ✔         |         ✔         |        ✔         |        ❌        |        ✔        |
|   **ltValue**    |      **mac**      |    **mac48**     |    **mac64**     |  **maxBytes**   |
|        ❌        |         ✔         |        ❌        |        ❌        |       ❌        |
| **maxGraphemes** |   **maxLength**   |   **maxValue**   |   **maxWords**   |  **minBytes**   |
|        ❌        |         ✔         |        ❌        |        ❌        |       ❌        |
| **minGraphemes** |   **minLength**   |   **minValue**   |   **minWords**   |   **nanoid**    |
|        ❌        |         ✔         |        ❌        |        ❌        |        ✔        |
|   **nonEmpty**   |   **notBytes**    |  **notEntries**  | **notGraphemes** |  **notLength**  |
|        ✔         |        ❌         |        ❌        |        ❌        |       ❌        |
|   **notValue**   |   **notValues**   |   **notWords**   |    **octal**     |  **rawCheck**   |
|        ❌        |        ❌         |        ❌        |        ✔         |       ❌        |
|    **regex**     |   **rfcEmail**    |     **slug**     |  **startsWith**  |    **ulid**     |
|        ✔         |        ❌         |        ❌        |        ❌        |        ✔        |
|     **url**      |     **uuid**      |    **value**     |    **values**    |    **words**    |
|        ✔         |         ✔         |        ❌        |        ❌        |       ❌        |

## 📣 Acknowledgements

Valimock's implementation is based on [`@anatine/zod-mock`][zod-mock]

## 🥂 License

Released under the [MIT license][license] © [Drake Costa][personal-website].

[npm_badge]: https://img.shields.io/npm/v/valimock.svg?style=flat
[npm]: https://www.npmjs.com/package/valimock
[ci_badge]: https://github.com/saeris/valimock/actions/workflows/ci.yml/badge.svg
[ci]: https://github.com/saeris/valimock/actions/workflows/ci.yml
[valibot]: https://github.com/fabian-hiller/valibot
[faker]: https://github.com/faker-js/faker
[tests]: ./src/__tests__/
[zod-mock]: https://github.com/anatine/zod-plugins/tree/main/packages/zod-mock
[license]: ./LICENSE.md
[personal-website]: https://saeris.gg
