/**
 * Override finished translations.
 *
 * The chunk files under `work/chunks/` are the record of the translation work
 * and the source `tools/apply-translations.mjs` reads, so a correction belongs
 * there — editing `dictionaries/*.json` alone would be undone by the next
 * apply. This tool resolves `namespace/key` to its id, finds the chunk that
 * carries that id, and replaces the value in place.
 *
 * Usage:
 *   node tools/set-translation.mjs work/overrides.json
 *
 * The overrides file is a JSON object of `"<namespace>/<key>": "<new text>"`.
 *
 * @module tools/set-translation
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const chunksDir = join(root, 'work', 'chunks')

/**
 * Apply a set of overrides to the chunk files.
 * @param overrides - `{ "namespace/key": text }`.
 * @returns applied and unresolved entries.
 */
export function setTranslations(overrides) {
  const keymap = JSON.parse(readFileSync(join(root, 'work', 'keymap.json'), 'utf8'))
  const chunkFiles = readdirSync(chunksDir).filter((name) => /^out-\d+\.json$/u.test(name)).sort()
  const payloads = new Map(chunkFiles.map((name) => [name, JSON.parse(readFileSync(join(chunksDir, name), 'utf8'))]))
  const applied = []
  const unresolved = []
  for (const [path, value] of Object.entries(overrides)) {
    const slash = path.indexOf('/')
    const namespace = path.slice(0, slash)
    const key = path.slice(slash + 1)
    const id = keymap[namespace]?.[key]
    if (id === undefined) {
      unresolved.push(`${path}: not in the work keymap`)
      continue
    }
    const owner = chunkFiles.find((name) => id in payloads.get(name))
    if (owner === undefined) {
      unresolved.push(`${path}: id ${id} is in no chunk output`)
      continue
    }
    const payload = payloads.get(owner)
    const previous = payload[id]
    payload[id] = value
    applied.push({ path, id, chunk: owner, previous, value })
  }
  for (const [name, payload] of payloads) {
    if (!applied.some((entry) => entry.chunk === name)) continue
    writeFileSync(join(chunksDir, name), `${JSON.stringify(payload, null, 1)}\n`, 'utf8')
  }
  return { applied, unresolved }
}

function main(argv) {
  const file = argv[0]
  if (file === undefined) {
    process.stderr.write('usage: node tools/set-translation.mjs <overrides.json>\n')
    process.exitCode = 1
    return
  }
  const { applied, unresolved } = setTranslations(JSON.parse(readFileSync(file, 'utf8')))
  for (const entry of applied) {
    process.stdout.write(`${entry.path} (${entry.chunk})\n  was: ${JSON.stringify(entry.previous)}\n  now: ${JSON.stringify(entry.value)}\n`)
  }
  for (const problem of unresolved) process.stdout.write(`unresolved: ${problem}\n`)
  process.stdout.write(`${String(applied.length)} applied, ${String(unresolved.length)} unresolved — re-run apply-translations.mjs\n`)
  if (unresolved.length > 0) process.exitCode = 1
}

if (process.argv[1] === import.meta.filename) main(process.argv.slice(2))
