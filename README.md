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

## 📣 Acknowledgements

Valimock's implementation is based on [`@anatine/zod-mock`](https://github.com/anatine/zod-plugins/tree/main/packages/zod-mock)

## 🥂 License

Released under the [MIT license](https://github.com/Saeris/discordkit/blob/master/LICENSE.md).
