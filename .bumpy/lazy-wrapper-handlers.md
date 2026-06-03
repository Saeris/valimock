---
valimock: patch
---

Lazify wrapper handlers (nullable / nullish / optional / undefinedable) so they descend into the wrapped schema only when the random roll picks the wrapped branch. Eliminates a ~4,700x slowdown on self-referencing schemas wrapped in nullish-lazy (the canonical `referencedMessage: v.nullish(v.lazy(() => self))` pattern).
