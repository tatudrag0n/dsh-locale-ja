/**
 * Write finished translations back into the dictionary files.
 *
 * `tools/make-work.mjs` split the distinct English strings into chunks and kept
 * the id → (namespace, key) mapping in `work/keymap.json`. This tool reads the
 * chunk results, and for every mapped key stores the Japanese string under the
 * file's `ja` field. Keys whose id has no translation are reported and left
 * untranslated, which is a supported state: lookup falls through to English.
 *
 * Usage:
 *   node tools/apply-translations.mjs [--strict]
 *
 * `--strict` exits nonzero when any key is still untranslated.
 *
 * @module tools/apply-translations
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const dictionariesDir = join(root, 'dictionaries')
const workDir = join(root, 'work')
const chunksDir = join(workDir, 'chunks')

/** Merge every `out-NN.json` chunk result into one id → translation map. */
export function readTranslations() {
  const translations = new Map()
  const duplicates = []
  for (const file of readdirSync(chunksDir).filter((name) => /^out-\d+\.json$/u.test(name)).sort()) {
    const payload = JSON.parse(readFileSync(join(chunksDir, file), 'utf8'))
    for (const [id, value] of Object.entries(payload)) {
      if (typeof value !== 'string') continue
      if (translations.has(id) && translations.get(id) !== value) duplicates.push(`${id} (${file})`)
      translations.set(id, value)
    }
  }
  return { translations, duplicates }
}

/**
 * Apply the translations to the dictionary files.
 *
 * Every write is guarded by an identity check: the English source recorded in
 * `work/strings.json` for an id must be the source the dictionary file holds for
 * that key. Ids are positional, so a regeneration that reordered the source
 * would otherwise attach a correct translation to the wrong key — silently, and
 * only visibly as odd copy in the UI.
 *
 * @returns a per-namespace summary plus the ids no chunk covered.
 */
export function applyTranslations() {
  const { translations, duplicates } = readTranslations()
  const keymap = JSON.parse(readFileSync(join(workDir, 'keymap.json'), 'utf8'))
  const strings = JSON.parse(readFileSync(join(workDir, 'strings.json'), 'utf8'))
  const summary = []
  const missing = new Set()
  const mismatched = []
  for (const [namespace, map] of Object.entries(keymap)) {
    const file = join(dictionariesDir, `${namespace}.json`)
    const record = JSON.parse(readFileSync(file, 'utf8'))
    const ja = {}
    let untranslated = 0
    for (const [key, id] of Object.entries(map)) {
      const source = record.keys[key]
      if (typeof source !== 'string') continue
      const value = translations.get(id)
      if (value === undefined) {
        untranslated += 1
        missing.add(id)
        continue
      }
      if (strings[id] !== source) {
        mismatched.push(`${namespace}/${key}: id ${id} carries ${JSON.stringify(strings[id])} but the key holds ${JSON.stringify(source)}`)
        untranslated += 1
        continue
      }
      ja[key] = value
    }
    record.ja = ja
    writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    summary.push({ namespace, keys: Object.keys(map).length, translated: Object.keys(ja).length, untranslated })
  }
  return { summary, missing: [...missing].sort(), mismatched, duplicates, strings }
}

function main(argv) {
  const { summary, missing, mismatched, duplicates, strings } = applyTranslations()
  const total = summary.reduce((sum, row) => sum + row.keys, 0)
  const translated = summary.reduce((sum, row) => sum + row.translated, 0)
  process.stdout.write(`namespaces:   ${String(summary.length)}\n`)
  process.stdout.write(`keys:         ${String(translated)}/${String(total)} translated\n`)
  process.stdout.write(`strings:      ${String(strings ? Object.keys(strings).length : 0)} distinct sources\n`)
  for (const row of summary) {
    if (row.untranslated === 0) continue
    process.stdout.write(`  incomplete: ${row.namespace} (${String(row.untranslated)}/${String(row.keys)})\n`)
  }
  for (const id of missing) process.stdout.write(`  missing:    ${id} = ${JSON.stringify(strings[id] ?? '')}\n`)
  for (const row of mismatched) process.stdout.write(`  mismatch:   ${row}\n`)
  for (const id of duplicates) process.stdout.write(`  conflict:   ${id} came from two chunks with different text\n`)
  if (argv.includes('--strict') && (missing.length > 0 || duplicates.length > 0 || mismatched.length > 0)) process.exitCode = 1
}

if (process.argv[1] === import.meta.filename) main(process.argv.slice(2))
