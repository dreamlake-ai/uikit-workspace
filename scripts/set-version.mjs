#!/usr/bin/env node
/**
 * Set the `version` field across every package.json in the workspace
 * (root + packages/*) so the snapshot branch, the topbar chip, and any
 * embedded library all stamp the same number.
 *
 * Usage: pnpm set-version <x.y.z>
 *
 * Only files that already have a `version` field are touched — packages
 * that intentionally omit it (private, never-published) stay omitted.
 */
import { writeFileSync } from 'node:fs'
import { listVersionedPackages } from './lib-packages.mjs'

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

const input = process.argv[2]
if (!input) {
  console.error('Usage: pnpm set-version <x.y.z>')
  process.exit(1)
}
if (!SEMVER_RE.test(input)) {
  console.error(`set-version: "${input}" is not a valid semver (expected e.g. 1.2.3 or 1.2.3-beta.1)`)
  process.exit(1)
}

const pkgs = listVersionedPackages()
if (pkgs.length === 0) {
  console.error('set-version: no package.json files found')
  process.exit(1)
}

const changes = []
for (const pkg of pkgs) {
  if (pkg.version === undefined) continue
  const before = pkg.version
  if (before === input) {
    changes.push({ relPath: pkg.relPath, before, after: input, changed: false })
    continue
  }
  const updated = pkg.raw.replace(
    /("version"\s*:\s*")[^"]+(")/,
    `$1${input}$2`,
  )
  if (updated === pkg.raw) {
    console.error(`set-version: failed to rewrite version in ${pkg.relPath}`)
    process.exit(1)
  }
  writeFileSync(pkg.path, updated)
  changes.push({ relPath: pkg.relPath, before, after: input, changed: true })
}

if (changes.length === 0) {
  console.log('set-version: no package.json files have a `version` field — nothing to do')
  process.exit(0)
}

const width = Math.max(...changes.map((c) => c.relPath.length))
console.log(`Set version to ${input}:`)
for (const c of changes) {
  const tag = c.changed ? '✓' : '·'
  console.log(`  ${tag} ${c.relPath.padEnd(width)}  ${c.before} → ${c.after}`)
}

const anyChanged = changes.some((c) => c.changed)
if (anyChanged) {
  console.log('')
  console.log('Next: run `pnpm install` to refresh pnpm-lock.yaml, then commit both.')
  console.log('Netlify uses --frozen-lockfile and will fail to build if the lockfile is stale.')
}
