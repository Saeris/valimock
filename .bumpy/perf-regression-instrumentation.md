---
valimock: minor
---

Add opt-in instrumentation hook (`new Valimock({ instrument: true })`) and a perf-regression spec asserting call-count and depth ceilings on realistic-shape schemas. Catches catastrophic regressions like the v1.5.0 wrapper-recursion bug — proven locally to detect the bug at ~2,100x explosion in call counts.
