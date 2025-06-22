# valimock

## 1.3.0

### Minor Changes

- [`4170123`](https://github.com/Saeris/valimock/commit/41701235c63bbd3b4c341efceb1f4e8edecab9f4) Thanks [@Saeris](https://github.com/Saeris)! - Add `variant` and `exactOptional` schema support, Improve test reliability

## 1.2.0

### Minor Changes

- [`2f875f1`](https://github.com/Saeris/valimock/commit/2f875f12e96fd4694063bf16cbd97ae6d0d58809) Thanks [@Saeris](https://github.com/Saeris)! - Add support for new String validations and Keyword matchers

  New Validations:

  - base64
  - bic
  - creditCard
  - decimal
  - empty
  - hexadecimal
  - hexColor
  - mac
  - nanoid (unstable)
  - octal

  New keywords:

  - username
  - displayName
  - firstName
  - middleName
  - lastName
  - fullName
  - gender
  - sex
  - zodiacSign
  - isbn
  - iban
  - vin
  - vrm

  Also adds support for `empty()` for both Strings and Arrays

## 1.1.1

### Patch Changes

- [`97a9221`](https://github.com/Saeris/valimock/commit/97a9221bc8efd8a3306d830c130e7f19d08171c7) Thanks [@Saeris](https://github.com/Saeris)! - Fix incorrect string max length behavior, Update dependencies

  Strings were accidentally being capped to a fixed max length when a `maxLength()` validation was not provided by the schema, resulting in unwanted behavior such as the shortening of usernames, emails, etc, which would cause validations such as `email()` to fail against the resulting mock data.

## 1.1.0

### Minor Changes

- [#42](https://github.com/Saeris/valimock/pull/42) [`7078d1f`](https://github.com/Saeris/valimock/commit/7078d1f752c11578bbf5dbe13a81aa1551eb5cfb) Thanks [@Saeris](https://github.com/Saeris)! - Support Valibot v1.1.0

## 0.1.3

### Patch Changes

- [`60b9bed`](https://github.com/Saeris/valimock/commit/60b9bedc477dd2356a4f1439e3aa97fa042c94d3) Thanks [@Saeris](https://github.com/Saeris)! - Update Valibot min version, Fix tests for intersect schema

## 0.1.2

### Patch Changes

- [`1b4a3ce`](https://github.com/Saeris/valimock/commit/1b4a3ce8ecc796d5a2a4fd1a6d8b212efbdde4f0) Thanks [@Saeris](https://github.com/Saeris)! - Upgrade Dependencies

## 0.1.1

### Patch Changes

- [#9](https://github.com/Saeris/valimock/pull/9) [`ff60f6c`](https://github.com/Saeris/valimock/commit/ff60f6ca8a3185db426e928464bff8cb8c74e94e) Thanks [@Saeris](https://github.com/Saeris)! - Fix broken `#getValidEnumValues()` method

## 0.1.0

### Minor Changes

- [#6](https://github.com/Saeris/valimock/pull/6) [`254049e`](https://github.com/Saeris/valimock/commit/254049e0cc85045a74388bbce60353e06ca2dc0c) Thanks [@Saeris](https://github.com/Saeris)! - Add support for Valibot v0.21.0
