/**
 * Extract every locale dictionary a DSH installation ships.
 *
 * Each shipped client bundle registers its copy through
 * `ctx.locale.register(namespace, { zh, en })`, where `zh`/`en` are
 * module-level object literals. This tool statically recovers those literals
 * (no bundle is executed) into one JSON file per namespace, so a language pack
 * can be authored and diffed against the exact key set the installed harness
 * uses.
 *
 * Usage:
 *   node tools/extract.mjs [--dsh <installation dir>] [--out <dir>]
 *
 * The installation is auto-detected unless `--dsh` (or `DSH_INSTALL_DIR`) names
 * it, and the output defaults to `./dictionaries`.
 *
 * @module tools/extract
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { matchBracket, parseObjectLiteral, resolveArgument, splitArguments } from './literal.mjs'

/**
 * Resolve the installed `@deepseek-ai/dsh` directory.
 *
 * A profile-installed plugin cannot `require.resolve` a package it does not
 * depend on, so the search walks the places a DSH installation actually lives:
 * an explicit flag, the environment, module resolution, the npm global prefix
 * that put `dsh` on PATH, and the profile's own node_modules.
 * @param explicit - `--dsh` value, when given.
 * @returns the installation directory.
 */
export function resolveDsh(explicit) {
  const candidates = []
  if (explicit !== undefined) candidates.push(resolve(explicit))
  if (process.env.DSH_INSTALL_DIR !== undefined && process.env.DSH_INSTALL_DIR !== '') {
    candidates.push(resolve(process.env.DSH_INSTALL_DIR))
  }
  const profile = process.env.DSH_PROFILE_DIR
  if (profile !== undefined && profile !== '') candidates.push(join(profile, 'node_modules', '@deepseek-ai', 'dsh'))
  try {
    candidates.push(dirname(import.meta.resolve('@deepseek-ai/dsh/package.json').replace(/^file:\/\//u, '')))
  } catch {
    /* Not resolvable from here; the PATH lookup below covers a global install. */
  }
  const separator = process.platform === 'win32' ? ';' : ':'
  for (const shim of ['dsh.cmd', 'dsh.ps1', 'dsh']) {
    for (const dir of String(process.env.PATH ?? '').split(separator)) {
      if (dir === '' || !existsSync(join(dir, shim))) continue
      candidates.push(join(dir, 'node_modules', '@deepseek-ai', 'dsh'))
      break
    }
  }
  if (process.env.APPDATA !== undefined) {
    candidates.push(join(process.env.APPDATA, 'npm', 'node_modules', '@deepseek-ai', 'dsh'))
  }
  for (const candidate of candidates) {
    if (candidate !== '' && existsSync(join(candidate, 'package.json'))) return candidate
  }
  throw new Error(`no DSH installation found; tried:\n${candidates.join('\n')}`)
}

/** Every directory that may hold an installed client plugin. */
function packageRoots(dshDir) {
  const roots = [join(dshDir, 'node_modules')]
  const profile = process.env.DSH_PROFILE_DIR
  if (profile !== undefined && profile !== '') roots.push(join(profile, 'node_modules'))
  return roots.filter((dir) => existsSync(dir))
}

/** The client entry file a package declares, or undefined when it has none. */
function clientEntry(packageDir, manifest) {
  if (manifest.dsh?.client === undefined || manifest.dsh.client === null) return undefined
  const exported = manifest.exports?.['./client']
  const target = typeof exported === 'string' ? exported : exported?.default
  return [
    target === undefined ? undefined : join(packageDir, target),
    join(packageDir, 'lib', 'client.js'),
    join(packageDir, 'client.js'),
  ].filter((value) => value !== undefined).find((file) => existsSync(file))
}

/** Walk `node_modules` (including scopes) for packages with a client half. */
function* installedPackages(root) {
  if (!existsSync(root)) return
  for (const name of readdirSync(root)) {
    if (name.startsWith('.')) continue
    const dir = join(root, name)
    if (!statSync(dir).isDirectory()) continue
    if (name.startsWith('@')) {
      for (const scoped of readdirSync(dir)) {
        const scopedDir = join(dir, scoped)
        if (statSync(scopedDir).isDirectory()) yield scopedDir
      }
      continue
    }
    yield dir
  }
}

/** Extract every `locale.register(ns, {zh, en})` dictionary in one bundle. */
export function extractFromBundle(file) {
  const text = readFileSync(file, 'utf8')
  const found = []
  const problems = []
  for (const match of text.matchAll(/\.register\s*\(/gu)) {
    const open = match.index + match[0].length - 1
    try {
      const end = matchBracket(text, open)
      const args = splitArguments(text.slice(open + 1, end - 1))
      if (args.length !== 2) continue
      const ns = resolveArgument(text, args[0])
      if (ns === null || ns.kind !== 'string') continue
      const dicts = resolveArgument(text, args[1])
      if (dicts === null || dicts.kind !== 'object') continue
      const locales = new Map()
      for (const [locale, value] of dicts.entries) {
        const entries = dictionaryEntries(text, value.raw)
        if (entries !== null) locales.set(locale, entries)
      }
      if (locales.size === 0) continue
      found.push({ file, ns: ns.value, locales })
    } catch (error) {
      problems.push(`${file}: ${String(error)} :: ${text.slice(Math.max(0, open - 60), open + 120).replace(/\s+/gu, ' ')}`)
    }
  }
  return { found, problems }
}

/** Follow one dictionary value: an identifier binding, or an inline literal. */
function dictionaryEntries(text, raw) {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) return parseObjectLiteral(trimmed, 0).entries
  const resolved = resolveArgument(text, trimmed)
  if (resolved === null || resolved.kind !== 'object') return null
  return resolved.entries
}

/** Scan every installed client plugin and merge its dictionaries by namespace. */
export function extractDictionaries(dshDir, onBundle = () => {}) {
  const namespaces = new Map()
  const problems = []
  let scanned = 0
  for (const root of packageRoots(dshDir)) {
    for (const packageDir of installedPackages(root)) {
      const manifestPath = join(packageDir, 'package.json')
      if (!existsSync(manifestPath)) continue
      let manifest
      try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      } catch {
        continue
      }
      const entry = clientEntry(packageDir, manifest)
      if (entry === undefined) continue
      scanned += 1
      onBundle(manifest.name ?? packageDir, entry)
      const { found, problems: bundleProblems } = extractFromBundle(entry)
      problems.push(...bundleProblems)
      for (const { ns, locales } of found) {
        const bucket = namespaces.get(ns) ?? { package: manifest.name ?? packageDir, locales: new Map() }
        for (const [locale, entries] of locales) {
          const existing = bucket.locales.get(locale) ?? new Map()
          for (const [key, value] of entries) existing.set(key, value.string)
          bucket.locales.set(locale, existing)
        }
        namespaces.set(ns, bucket)
      }
    }
  }
  return { namespaces, problems, scanned }
}

/** Write the extraction result as one JSON file per namespace. */
export function writeDictionaries(outDir, namespaces) {
  mkdirSync(outDir, { recursive: true })
  const index = []
  for (const ns of [...namespaces.keys()].sort()) {
    const bucket = namespaces.get(ns)
    const en = bucket.locales.get('en') ?? new Map()
    const zh = bucket.locales.get('zh') ?? new Map()
    const file = join(outDir, `${ns}.json`)
    /* A regeneration must not discard authored translations: carry `ja` over
       for every key the new extraction still declares. */
    let authored = {}
    if (existsSync(file)) {
      try {
        authored = JSON.parse(readFileSync(file, 'utf8')).ja ?? {}
      } catch {
        authored = {}
      }
    }
    const keys = {}
    for (const key of [...en.keys()].sort()) {
      if (typeof en.get(key) === 'string') keys[key] = en.get(key)
    }
    const ja = {}
    for (const key of Object.keys(keys)) {
      if (typeof authored[key] === 'string') ja[key] = authored[key]
    }
    const reference = {}
    for (const key of Object.keys(keys)) {
      if (zh.has(key)) reference[key] = zh.get(key)
    }
    const unresolved = Object.entries(keys).filter(([, value]) => value === null).map(([key]) => key)
    writeFileSync(file, `${JSON.stringify({
      namespace: ns,
      package: bucket.package,
      keys,
      zh: reference,
      ja,
      unresolved,
    }, null, 2)}\n`, 'utf8')
    index.push({
      namespace: ns,
      package: bucket.package,
      keys: Object.keys(keys).length,
      translated: Object.keys(ja).length,
      unresolved: unresolved.length,
    })
  }
  writeFileSync(join(outDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  return index
}

function main(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) args.set(argv[i].slice(2), argv[i + 1]?.startsWith('--') === true ? '' : argv[++i])
  }
  const dshDir = resolveDsh(args.get('dsh') === '' ? undefined : args.get('dsh'))
  const outDir = resolve(args.get('out') ?? join(import.meta.dirname, '..', 'dictionaries'))
  const { namespaces, problems, scanned } = extractDictionaries(dshDir)
  const index = writeDictionaries(outDir, namespaces)
  const distinct = new Set()
  let total = 0
  for (const bucket of namespaces.values()) {
    for (const value of (bucket.locales.get('en') ?? new Map()).values()) {
      total += 1
      if (value !== null) distinct.add(value)
    }
  }
  process.stdout.write(`dsh:        ${dshDir}\n`)
  process.stdout.write(`bundles:    ${String(scanned)}\n`)
  process.stdout.write(`namespaces: ${String(index.length)}\n`)
  process.stdout.write(`en keys:    ${String(total)} (${String(distinct.size)} distinct strings)\n`)
  process.stdout.write(`written:    ${outDir}\n`)
  for (const problem of problems) process.stdout.write(`problem:    ${problem}\n`)
  for (const row of index) {
    const coverage = row.keys === 0 ? '—' : `${String(Math.round((row.translated / row.keys) * 100))}%`
    process.stdout.write(`  ${row.namespace.padEnd(30)} ${String(row.keys).padStart(5)}${row.unresolved > 0 ? ` (${String(row.unresolved)} unresolved)` : ''} ja ${coverage.padStart(4)}  ${row.package}\n`)
  }
}

if (process.argv[1] === import.meta.filename) main(process.argv.slice(2))
