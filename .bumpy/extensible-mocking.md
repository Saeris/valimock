---
valimock: minor
---

Add `stringActions` and `stringFormats` options so libraries can register generators for their own string actions without replacing the built-in string generator. Pass a `mock` function as the third argument of `customMocks` entries so container overrides can recurse with the same instance. Flatten nested pipes when collecting constraints, so `v.pipe(v.pipe(...), ...)` no longer drops inner actions such as `integer`. Seed Faker once per top-level `mock()` call instead of before every nested value, so sibling fields with the same schema no longer receive identical values.
