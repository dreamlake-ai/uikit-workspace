#!/usr/bin/env node
/**
 * Set the `version` field across every package.json in the workspace
 * (root + packages/*) so the snapshot branch, the topbar chip, and any
 * embedded library all stamp the same number.
 *
 * Also upserts the docs version manifest
 * (packages/docs/public/versions.json, served at /versions.json and
 * consumed by the topbar version-switcher dropdown): sets `current`
 * and prepends/refreshes a `{version, url, date}` entry pointing at
 * the Netlify branch subdomain for the `v/<version>` snapshot branch.
 *
 * Usage: pnpm set-version <x.y.z>
 *
 * Only files that already have a `version` field are touched — packages
 * that intentionally omit it (private, never-published) stay omitted.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { listVersionedPackages, REPO_ROOT } from './lib-packages.mjs'

// Netlify branch subdomain for branch `v/<x.y.z>` (slashes and dots
// sanitized to hyphens), e.g. https://v-0-1-6.uikit.dreamlake.ai
const versionUrl = (version) => `https://v-${version.replace(/\./g, '-')}.uikit.dreamlake.ai`

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

// Keep the docs version manifest in step with the package.json bump.
// Idempotent: re-running with the same version just refreshes url/date.
const manifestRelPath = 'packages/docs/public/versions.json'
const manifestPath = join(REPO_ROOT, manifestRelPath)
let manifestNote = null
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  const url = versionUrl(input)
  const date = new Date().toISOString().slice(0, 10)
  manifest.versions ??= []
  const existing = manifest.versions.find((v) => v.version === input)
  if (existing) {
    existing.url = url
    existing.date = date
  } else {
    manifest.versions.unshift({ version: input, url, date })
  }
  const manifestChanged = manifest.current !== input || !existing
  manifest.current = input
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  manifestNote = { changed: manifestChanged, url }
} catch (err) {
  console.error(`set-version: failed to update ${manifestRelPath}: ${err.message}`)
  process.exit(1)
}

const width = Math.max(...changes.map((c) => c.relPath.length), manifestRelPath.length)
console.log(`Set version to ${input}:`)
for (const c of changes) {
  const tag = c.changed ? '✓' : '·'
  console.log(`  ${tag} ${c.relPath.padEnd(width)}  ${c.before} → ${c.after}`)
}
console.log(
  `  ${manifestNote.changed ? '✓' : '·'} ${manifestRelPath.padEnd(width)}  current: "${input}", entry: ${manifestNote.url}`,
)

const anyChanged = changes.some((c) => c.changed)
if (anyChanged) {
  console.log('')
  console.log('Next: run `pnpm install` to refresh pnpm-lock.yaml, then commit both.')
  console.log('Netlify uses --frozen-lockfile and will fail to build if the lockfile is stale.')
}
