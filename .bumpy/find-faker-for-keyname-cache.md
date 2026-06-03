---
valimock: patch
---

Cache findFakerForKeyName auto-discovery results in a module-level WeakMap keyed by Faker instance. Both positive and negative results are cached, so repeat lookups of the same keyName (cached hit) and repeat lookups of unknown keyNames (cached miss) both skip the full Object.keys(faker) walk. ~1.8-2.1x faster on string-heavy schemas.
