---
valimock: patch
---

Fix intersect dropping variant discriminator when shared keys diverge, and let `customMocks` override built-in schema handlers (notably `customMocks.any: () => undefined` to restore pre-1.5 v.any behavior).
