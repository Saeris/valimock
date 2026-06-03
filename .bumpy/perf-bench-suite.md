---
valimock: patch
---

Add Vitest `bench()` files for iteration-time performance evaluation, reusing the fixture library from the regression canary. Includes a `scripts/profile.mjs` convenience wrapper for CPU profiling. Pure tooling — no public-API or runtime changes.
