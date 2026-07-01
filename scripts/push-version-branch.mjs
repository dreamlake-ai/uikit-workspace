#!/usr/bin/env node
/**
 * Force-push HEAD to a remote `v/<version>` branch where <version> comes
 * from the workspace's package.json files. Netlify is configured to deploy
 * any branch matching `v/*`, so this lets `pnpm run deploy` stamp the current
 * commit with a versioned preview URL alongside pushing to the
 * netlify-production environment branch.
 *
 * Before pushing, every package.json that declares a `version` must agree.
 * If they don't, the script refuses to push and tells you to run
 * `pnpm set-version <x.y.z>` to sync.
 */
import { execSync } from 'node:child_process'
import { listVersionedPackages } from './lib-packages.mjs'

const pkgs = listVersionedPackages().filter((p) => p.version !== undefined)
if (pkgs.length === 0) {
  console.error('push-version-branch: no package.json with a `version` field found')
  process.exit(1)
}

const versions = new Set(pkgs.map((p) => p.version))
if (versions.size > 1) {
  const width = Math.max(...pkgs.map((p) => p.relPath.length))
  console.error('push-version-branch: package versions are out of sync.')
  console.error('')
  for (const p of pkgs) {
    console.error(`  ${p.relPath.padEnd(width)}  ${p.version}`)
  }
  console.error('')
  console.error('→ Run `pnpm set-version <x.y.z>` to sync them, then `pnpm install` and commit.')
  process.exit(1)
}

const [version] = [...versions]
const branch = `v/${version}`
console.log(`→ git push -f origin HEAD:refs/heads/${branch}`)
execSync(`git push -f origin HEAD:refs/heads/${branch}`, { stdio: 'inherit' })
