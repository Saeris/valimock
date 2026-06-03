---
valimock: patch
---

Dispatch and lookup optimizations: Map-based schema dispatch in the hot #mock path, precomputed lowercase keyNameGenerators lookup, WeakMap memoization of #getValidEnumValues, and a fast path through generateString for unconstrained strings. ~1.2-1.7x faster on string- and enum-heavy schemas.
