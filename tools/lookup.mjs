/**
 * Resolve translation ids back to their namespace, key, and text.
 *
 * Ids appear in review notes, ids are what the chunk files are keyed by, and the
 * dictionaries are keyed by namespace and key — so applying a review finding
 * means walking id → (namespace, key) → current text. This prints that walk.
 *
 * Usage:
 *   node tools/lookup.mjs s1348 s1370 ...
 *   node tools/lookup.mjs --grep "Ask question"
 *
 * @module tools/lookup
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

/** id → `namespace/key`, and the reverse. */
export function loadIndex() {
  const keymap = JSON.parse(readFileSync(join(root, 'work', 'keymap.json'), 'utf8'))
  const byId = new Map()
  const byPath = new Map()
  for (const [namespace, map] of Object.entries(keymap)) {
    for (const [key, id] of Object.entries(map)) {
      byId.set(id, { namespace, key })
      byPath.set(`${namespace}/${key}`, id)
    }
  }
  return { byId, byPath }
}

/** Load every dictionary record by namespace. */
function loadRecords() {
  const records = new Map()
  for (const file of readdirSync(join(root, 'dictionaries')).sort()) {
    if (!file.endsWith('.json') || file === 'index.json') continue
    const record = JSON.parse(readFileSync(join(root, 'dictionaries', file), 'utf8'))
    records.set(record.namespace, record)
  }
  return records
}

function main(argv) {
  const records = loadRecords()
  const { byId, byPath } = loadIndex()
  const grepAt = argv.indexOf('--grep')
  if (grepAt !== -1) {
    const needle = argv[grepAt + 1]
    for (const [namespace, record] of records) {
      for (const [key, source] of Object.entries(record.keys)) {
        if (!String(source).includes(needle)) continue
        process.stdout.write(`${byPath.get(`${namespace}/${key}`)} ${namespace}/${key} | EN:${JSON.stringify(source)} | JA:${JSON.stringify(record.ja[key])} | ZH:${JSON.stringify(record.zh[key])}\n`)
      }
    }
    return
  }
  for (const id of argv) {
    const at = byId.get(id)
    if (at === undefined) {
      process.stdout.write(`${id} — unknown id\n`)
      continue
    }
    const record = records.get(at.namespace)
    process.stdout.write(`${id} ${at.namespace}/${at.key}\n  EN: ${JSON.stringify(record.keys[at.key])}\n  JA: ${JSON.stringify(record.ja[at.key])}\n  ZH: ${JSON.stringify(record.zh[at.key])}\n`)
  }
}

if (process.argv[1] === import.meta.filename) main(process.argv.slice(2))
