#!/usr/bin/env node
/**
 * Run the Valimock benchmark suite under node's V8 CPU profiler and drop a
 * `.cpuprofile` file in `./profiles/` for analysis in Chrome DevTools.
 *
 * Usage:
 *   vp run profile           # all benchmarks
 *   vp run profile -- messageLikeSchema   # filter to one bench file
 *
 * Open the resulting file in Chrome:
 *   1. devtools → ⋮ menu → More tools → Performance insights
 *   2. drag the .cpuprofile file into the panel
 *
 * The Self Time column surfaces hotspots; ranked self-time is what surfaced
 * `findFakerForKeyName` as the top regression cause in the original perf
 * report.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(import.meta.url), `../..`);
const profilesDir = join(repoRoot, `profiles`);

if (!existsSync(profilesDir)) mkdirSync(profilesDir);

console.log(`>> Running benchmarks under --cpu-prof, output dir: ./profiles/`);
console.log(`>> Bench filter: ${process.argv.slice(2).join(` `) || `(all)`}`);

// Use Vitest's CLI binary directly with --cpu-prof. We can't use `vp test bench`
// here because the --cpu-prof flag has to be passed to the actual node process,
// not the vp wrapper.
const vitestBin = join(repoRoot, `node_modules/vitest/dist/cli.js`);
if (!existsSync(vitestBin)) {
  console.error(`error: vitest CLI not found at ${vitestBin}. Run \`vp install\` first.`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [`--cpu-prof`, `--cpu-prof-dir=${profilesDir}`, vitestBin, `bench`, `--run`, ...process.argv.slice(2)],
  { stdio: `inherit`, cwd: repoRoot }
);

if (result.status !== 0) {
  console.error(`>> Bench run exited with status ${result.status}`);
  process.exit(result.status ?? 1);
}

// Find the most recently-written .cpuprofile in profiles/ and surface its path.
const cpuProfiles = readdirSync(profilesDir)
  .filter((f) => f.endsWith(`.cpuprofile`))
  .map((f) => ({ name: f, mtime: statSync(join(profilesDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (cpuProfiles.length === 0) {
  console.warn(`>> No .cpuprofile files written — check that vitest actually ran.`);
  process.exit(1);
}

const latest = cpuProfiles[0];
console.log(``);
console.log(`>> Wrote: ./profiles/${latest.name}`);
console.log(`>> Open in Chrome DevTools:`);
console.log(`     devtools → ⋮ menu → More tools → Performance insights`);
console.log(`     drag ./profiles/${latest.name} into the panel`);
console.log(``);
console.log(`>> Or inspect via the CLI:`);
console.log(`     npx -y v8-cpu-prof-flamegraph ./profiles/${latest.name}`);
