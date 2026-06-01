---
valimock: patch
---

Clean up package.json for ESM-only standards compliance: drop redundant `main`/`module`/`types` top-level fields and the non-standard `module` condition inside `exports`. The `exports.import` branch (with `types` listed first per Node's resolver requirement) is the canonical entrypoint for Node >=22 and modern bundlers, which is what this package already requires via `engines.node`. Normalizes `engines.node` from `">=22.x"` to the canonical semver `">=22"`; no behavior change (the two ranges are semver-equivalent), but the new form is idiomatic and what `node-semver` outputs after parsing.
