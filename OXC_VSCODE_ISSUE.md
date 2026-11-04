# Extension formats with oxfmt defaults instead of `vite.config.ts` when the raw oxfmt bin shadows the vite-plus wrapper at `node_modules/.bin/oxfmt`

> Target repo: [`oxc-project/oxc-vscode`](https://github.com/oxc-project/oxc-vscode)

### Confirm that this is a Bug for the editor extension, not the CLI

- [x] This bug does not happen in the Oxlint/Oxfmt CLI (`vp fmt` / `vp check --fix` are correct)
- [x] After restarting the editor, the bug still appears

### Versions used

```
VS Code extension (oxc.oxc-vscode): 1.57.0
oxfmt:                              0.48.0   (transitive, via vite-plus)
vite-plus:                          0.1.21
VS Code:                            freshly updated
OS:                                 Windows 10 Pro 19045 (win32)
Node:                               v26.1.0
Package manager:                    yarn@4.14.1 (node-modules linker)
```

### What happened?

Format-on-save (Oxc extension) produces **different output than `vp fmt`** for the same
file and the same `vite.config.ts`, which has `fmt.trailingComma: "none"`.

Given this input (a long object literal that must wrap, so the last property lands on its
own line where a trailing comma would or wouldn't be added):

```ts
const longName = { alpha: 1, beta: 2, gamma: 3, delta: 4, epsilon: 5 };
```

`vp fmt` / `vp check --fix` — **no** trailing comma (config honored ✅):

```ts
const longName = {
  alpha: 1,
  beta: 2,
  gamma: 3,
  delta: 4,
  epsilon: 5
};
```

Format-on-save via the extension — trailing comma **added** (oxfmt default, config ignored ❌):

```ts
const longName = {
  alpha: 1,
  beta: 2,
  gamma: 3,
  delta: 4,
  epsilon: 5
};
```

The only difference is the comma after the last property (`epsilon: 5` vs `epsilon: 5,`).
`oxc.fmt.configPath` is `./vite.config.ts`. The extension silently falls back to oxfmt's
built-in defaults; only `trailingComma` visibly diverges because the other configured
values happen to match oxfmt's defaults.

### Root cause

oxfmt only reads `.fmt` from a `vite.config.ts` when the **`VP_VERSION`** env var is set
(it gates `vite.config.ts` recognition behind it — see
[`apps/oxfmt/src/core/utils.rs::vp_version()`](https://github.com/oxc-project/oxc/blob/e77ff81a6bf5aac5a3ed1627004c00e74f644adf/apps/oxfmt/src/core/utils.rs#L8-L10)).
`vp` injects `VP_VERSION`; the standalone binary does not. `vite-plus` ships a wrapper,
`vite-plus/bin/oxfmt`, whose sole job is to set `process.env.VP_VERSION` and delegate to
the real oxfmt:

```js
// vite-plus/bin/oxfmt (excerpt)
// This allows oxfmt to load vite.config.ts
process.env.VP_VERSION = pkg.version;
await import(pathToFileURL(oxfmtBin).href);
```

This wrapper is the binary the extension is meant to spawn. The extension prefers
`node_modules/.bin/<name>` precisely for this reason — and it documents that rationale at
[`findBinary.ts` L96–99](https://github.com/oxc-project/oxc-vscode/blob/91f7d365a12969ae2c40bedf32060747b6125a55/client/findBinary.ts#L96-L99):

> ```ts
> // try to find shared binary inside `node_modules/.bin` of each workspace folder
> // This is required, because the project can use `vite-plus`,
> // which has different environment variables for `oxlint` and `oxfmt`.
> // Example: It will skip the `vite.config.ts` search without `VP_VERSION` env variable.
> ```

The resolver builds the candidate path as
[`path.join(folder, ".bin", binaryName)`](https://github.com/oxc-project/oxc-vscode/blob/91f7d365a12969ae2c40bedf32060747b6125a55/client/findBinary.ts#L46)
inside
[`searchProjectNodeModulesBin`](https://github.com/oxc-project/oxc-vscode/blob/91f7d365a12969ae2c40bedf32060747b6125a55/client/findBinary.ts#L93-L111)
and trusts whatever that link resolves to.

**But two packages both claim the `oxfmt` bin name:**

- `vite-plus` → `bin/oxfmt` (the wrapper that sets `VP_VERSION`)
- `oxfmt` → `bin/oxfmt` (raw, no `VP_VERSION`)

`oxfmt` is **only a transitive dependency of `vite-plus`** (`yarn why oxfmt` →
`vite-plus@0.1.21 → oxfmt@0.48.0`), yet the raw `oxfmt` bin **won the
`node_modules/.bin/oxfmt` link**. So the extension — which prefers
`node_modules/.bin/oxfmt` — spawns the raw binary, no `VP_VERSION` flows, and oxfmt uses
defaults.

`node_modules/.bin/oxfmt.cmd` →

```
"%~dp0\node.exe"  "%~dp0\..\oxfmt\bin\oxfmt" %*    ← raw oxfmt, NOT vite-plus/bin/oxfmt
```

### Three-leg proof (same binary, same config, same input)

```sh
# 1. raw .bin path (what the extension resolves to) — no VP_VERSION → DEFAULT
$ node node_modules/oxfmt/bin/oxfmt --config ./vite.config.ts test.ts
   → epsilon: 5,            ❌

# 2. same binary WITH VP_VERSION → config honored  (proves the env var is the sole gate)
$ VP_VERSION=0.1.21 node node_modules/oxfmt/bin/oxfmt --config ./vite.config.ts test.ts
   → epsilon: 5             ✅

# 3. vp fmt (sets VP_VERSION + uses the wrapper) → config honored
$ vp fmt test.ts
   → epsilon: 5             ✅
```

### Why 1.53.0's fix doesn't cover this

[#215](https://github.com/oxc-project/oxc-vscode/issues/215) (closed) fixed a related case
by making the extension prefer `node_modules/.bin/oxfmt` (shipped in extension 1.53.0).
That assumes `.bin/oxfmt` **is** the vite-plus wrapper. When the raw `oxfmt` package wins
the bin-name collision (as here — and it can, since vite-plus pulls oxfmt in transitively
and the linker resolves the `.bin` race non-deterministically), that assumption breaks and
the user is silently back on defaults.

### Suggested fix

In [`searchProjectNodeModulesBin`](https://github.com/oxc-project/oxc-vscode/blob/91f7d365a12969ae2c40bedf32060747b6125a55/client/findBinary.ts#L93-L111),
when the workspace has `vite-plus` installed, prefer **`node_modules/vite-plus/bin/oxfmt`**
(and `…/bin/oxlint`) directly rather than the `node_modules/.bin/<name>` link built at
[L46](https://github.com/oxc-project/oxc-vscode/blob/91f7d365a12969ae2c40bedf32060747b6125a55/client/findBinary.ts#L46).
This makes resolution deterministic regardless of how the bin-link race resolved, and
matches the rationale the function already documents. Fall back to the current `.bin`
behavior when `vite-plus` isn't present.

(Alternatively/additionally, the extension could verify a resolved `.bin/<name>` actually
points into `vite-plus/` before trusting it for the VP_VERSION path — but resolving the
wrapper directly is simpler and avoids the race entirely.)

### Minimal reproduction (from scratch — no special project needed)

`@saeris/configs` is **not** involved; an inline `fmt` reproduces it. The only non-obvious
requirement is that the formatted construct must **wrap** (exceed `printWidth`, default 80),
since `trailingComma` only applies to multi-line output — hence the long variable name below.

1. New folder, install vite-plus (any package manager; the collision is in the dep tree):

   ```sh
   npm init -y
   npm install vite-plus
   ```

   This installs both `vite-plus/bin/oxfmt` (the `VP_VERSION` wrapper) and, transitively,
   `oxfmt/bin/oxfmt` (raw) — both claiming the `oxfmt` bin name.

2. `vite.config.ts` with a non-default fmt option:

   ```ts
   import { defineConfig } from "vite-plus";

   export default defineConfig({
     fmt: { trailingComma: "none" }
   });
   ```

3. `test.ts` (long enough that the object must wrap):

   ```ts
   const aReallyLongVariableNameSoTheObjectMustWrapAcrossMultipleLines = {
     alpha: 1,
     beta: 2,
     gamma: 3,
     delta: 4,
     epsilon: 5
   };
   ```

4. VS Code settings: `"editor.defaultFormatter": "oxc.oxc-vscode"`,
   `"editor.formatOnSave": true`, `"oxc.fmt.configPath": "./vite.config.ts"`.

5. Open `test.ts`, save → trailing comma is **added** (`epsilon: 5,`), but `vp fmt test.ts`
   produces **no** trailing comma (`epsilon: 5`).

Check which binary `.bin/oxfmt` resolves to — if it points into `oxfmt/` rather than
`vite-plus/`, the extension is spawning the raw binary and the bug is present. The
three-leg proof above can be run against this same setup.

> **Note on the bin race:** which of the two competing `oxfmt` bins ends up at
> `node_modules/.bin/oxfmt` is decided by the package manager / linker and isn't
> guaranteed to be the raw one on every install — but when it is the raw one (as observed
> here), the extension has no way to tell and silently uses defaults. The fix removes the
> dependence on that race entirely by resolving the `vite-plus` wrapper directly. You can
> force the failing state for testing by pointing `.bin/oxfmt` at `../oxfmt/bin/oxfmt`.
