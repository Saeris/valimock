<div align="center">

# 🃏 Valimock

[![npm version](https://img.shields.io/npm/v/valimock.svg?style=flat)](https://www.npmjs.com/package/valimock)
[![CI status](https://github.com/saeris/valimock/actions/workflows/ci.yml/badge.svg)](https://github.com/saeris/valimock/actions/workflows/ci.yml)

Generate mock data for [Valibot](https://github.com/fabian-hiller/valibot) schemas using [Faker](https://github.com/faker-js/faker)

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
import {
  parse,
  array,
  union,
  string,
  pipe,
  url,
  number,
  maxValue
} from "valibot";
import { Valimock } from "valimock";

describe(`example test`, () => {
  it(`should generate valid mock data`, () => {
    const schema = array(
      union([pipe(string(), url()), pipe(number(), maxValue(20))])
    );
    const result = new Valimock().mock(schema);
    expect(parse(schema, result)).toStrictEqual(result);
  });
});
```

> [!NOTE]
>
> For async schemas, you will need to use `parseAsync()`. Be aware that async schemas generate a `Promise` and may need to be `await`'ed depending on usage.
>
> Please see the [`__tests__`](./src/__tests__/) folder for more usage examples of different schema types.

## API Coverage

> [!WARNING]
>
> At present, not all of `valibot`'s API is fully covered by `valimock`, however, any unimplemented schema type can be handled by a user-supplied map via the `customMocks` configuration option. The schema's `type` proerty is used as the property key for this map.

|            | Implemented | Incomplete | Not Implemented | Unsupported |
| ---------- | :---------: | :--------: | :-------------: | :---------: |
| **Symbol** |     ✔      |     ⚠     |       ❌        |     ➖      |

### Schemas

|      Any       |      Array      |    Bigint     |     Blob      |   Boolean   |    Date     |      Enum       |
| :------------: | :-------------: | :-----------: | :-----------: | :---------: | :---------: | :-------------: |
|       ❌       |       ✔        |      ✔       |      ➖       |     ✔      |     ⚠      |       ✔        |
|  **Instance**  |  **Intersect**  |  **Literal**  |    **Map**    |   **NaN**   |  **Never**  | **NonNullable** |
|       ➖       |       ✔        |      ✔       |      ✔       |     ✔      |     ❌      |       ✔        |
| **NonNullish** | **NonOptional** |   **Null**    | **Nullable**  | **Nullish** | **Number**  |   **Object**    |
|       ✔       |       ✔        |      ✔       |      ✔       |     ✔      |     ⚠      |       ✔        |
|  **Optional**  |  **Picklist**   |  **Record**   | **Recursive** |   **Set**   | **Special** |   **String**    |
|       ✔       |       ✔        |      ✔       |      ✔       |     ✔      |     ➖      |       ⚠        |
|   **Symbol**   |    **Tuple**    | **Undefined** |   **Union**   | **Unknown** | **Variant** |    **Void**     |
|       ➖       |       ✔        |      ✔       |      ✔       |     ❌      |     ❌      |       ❌        |

### Validations

|                   | String | Number | Bigint | Boolean | Date | Array | Tuple | Union | Map | Set | Object | Blob |
| ----------------- | :----: | :----: | :----: | :-----: | :--: | :---: | :---: | :---: | :-: | :-: | :----: | :--: |
| **bytes**         |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **cuid2**         |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **custom**        |   ❌   |   ❌   |   ❌   |   ❌    |  ❌  |  ❌   |  ❌   |  ❌   | ❌  | ❌  |   ❌   |  ❌  |
| **customAsync**   |   ❌   |   ❌   |   ❌   |   ❌    |  ❌  |  ❌   |  ❌   |  ❌   | ❌  | ❌  |   ❌   |  ❌  |
| **email**         |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **emoji**         |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **endsWith**      |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **excludes**      |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ❌   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **finite**        |   ➖   |   ❌   |   ❌   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **imei**          |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **includes**      |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ❌   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **integer**       |   ➖   |   ✔   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **ip**            |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **ipv4**          |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **ipv6**          |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **isoDate**       |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **isoDateTime**   |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **isoTime**       |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **isoTimeSecond** |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **isoTimestamp**  |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **isoWeek**       |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **length**        |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ✔   |  ❌   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **mexBytes**      |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **maxLength**     |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ✔   |  ❌   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **maxSize**       |   ➖   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ❌  | ❌  |   ➖   |  ➖  |
| **maxValue**      |   ❌   |   ✔   |   ✔   |   ➖    |  ✔  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **mimeType**      |   ➖   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ❌  |
| **minBytes**      |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **minLength**     |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ✔   |  ❌   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **minSize**       |   ➖   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ❌  | ❌  |   ➖   |  ➖  |
| **minValue**      |   ❌   |   ✔   |   ✔   |   ➖    |  ✔  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **multipleOf**    |   ➖   |   ❌   |   ❌   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **notBytes**      |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **notLength**     |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ❌   |  ❌   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **notSize**       |   ➖   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ❌  | ❌  |   ❌   |  ❌  |
| **notValue**      |   ❌   |   ❌   |   ❌   |   ❌    |  ❌  |  ❌   |  ❌   |  ❌   | ❌  | ❌  |   ❌   |  ❌  |
| **regex**         |   ⚠   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **safeInteger**   |   ➖   |   ❌   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **size**          |   ➖   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ❌  | ❌  |   ➖   |  ➖  |
| **startsWith**    |   ❌   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **ulid**          |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **url**           |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **uuid**          |   ✔   |   ➖   |   ➖   |   ➖    |  ➖  |  ➖   |  ➖   |  ➖   | ➖  | ➖  |   ➖   |  ➖  |
| **value**         |   ❌   |   ✔   |   ✔   |   ❌    |  ❌  |  ❌   |  ❌   |  ❌   | ❌  | ❌  |   ❌   |  ❌  |

## 📣 Acknowledgements

Valimock's implementation is based on [`@anatine/zod-mock`](https://github.com/anatine/zod-plugins/tree/main/packages/zod-mock)

## 🥂 License

Released under the [MIT license](https://github.com/Saeris/discordkit/blob/master/LICENSE.md).
