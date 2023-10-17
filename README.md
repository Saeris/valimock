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
import { parse, array, union, string, url, number, maxValue } from "valibot";
import { Valimock } from "valimock";

describe(`example test`, () => {
  it(`should generate valid mock data`, () => {
    const schema = array(union([string([url()]), number([maxValue(20)])]));
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

> [!WARNING]
>
> At present, not all of `valibot`'s API is fully covered by `valimock`, however, any unimplemented schema type can be handled by a user-supplied map via the `customMocks` configuration option. The schema's `kind` proerty is used as the property key for this map.
>
> In the future a table will be provided with API coverage data.

## 📣 Acknowledgements

Valimock's implementation is based on [`@anatine/zod-mock`](https://github.com/anatine/zod-plugins/tree/main/packages/zod-mock)

## 🥂 License

Released under the [MIT license](https://github.com/Saeris/discordkit/blob/master/LICENSE.md).
