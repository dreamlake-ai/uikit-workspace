/**
 * Scan the workspace for package.json files we treat as version-bearing.
 *
 * Convention (hardcoded — keep in sync with pnpm-workspace.yaml):
 *   - root package.json
 *   - packages/<name>/package.json (one level only, no recursion)
 *
 * If you change the workspace layout (e.g. add apps/*), update WORKSPACE_GLOBS
 * below and the docs in pages/getting-started/+Page.mdx.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const WORKSPACE_DIRS = ['packages']

export function listVersionedPackages() {
  const out = []
  pushIfPackage(out, REPO_ROOT)
  for (const dir of WORKSPACE_DIRS) {
    const abs = join(REPO_ROOT, dir)
    let entries
    try {
      entries = readdirSync(abs)
    } catch {
      continue
    }
    for (const name of entries) {
      const child = join(abs, name)
      try {
        if (!statSync(child).isDirectory()) continue
      } catch {
        continue
      }
      pushIfPackage(out, child)
    }
  }
  return out
}

function pushIfPackage(out, dirAbs) {
  const pkgPath = join(dirAbs, 'package.json')
  let raw
  try {
    raw = readFileSync(pkgPath, 'utf-8')
  } catch {
    return
  }
  let json
  try {
    json = JSON.parse(raw)
  } catch (err) {
    throw new Error(`Failed to parse ${relative(REPO_ROOT, pkgPath)}: ${err.message}`)
  }
  out.push({
    path: pkgPath,
    relPath: relative(REPO_ROOT, pkgPath),
    name: json.name ?? '(unnamed)',
    version: json.version,
    raw,
    json,
  })
}

export { REPO_ROOT }
