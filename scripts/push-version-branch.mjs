#!/usr/bin/env node
/**
 * Force-push HEAD to a remote `v/<version>` branch where <version> is
 * read from the root package.json. Netlify is configured to deploy any
 * branch matching `v/*`, so this lets `pnpm prod` / `pnpm staging`
 * stamp the current commit with a versioned preview URL alongside
 * pushing to the netlify-production / netlify-staging environment
 * branches.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkgUrl = new URL('../package.json', import.meta.url)
const { version } = JSON.parse(readFileSync(pkgUrl, 'utf-8'))
if (!version) {
  console.error('push-version-branch: no `version` field in package.json')
  process.exit(1)
}

const branch = `v/${version}`
console.log(`→ git push -f origin HEAD:refs/heads/${branch}`)
execSync(`git push -f origin HEAD:refs/heads/${branch}`, { stdio: 'inherit' })
