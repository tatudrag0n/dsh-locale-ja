/**
 * Audit the authored dictionaries.
 *
 * Coverage is reported, never assumed: a language pack may legitimately ship
 * fewer keys than the harness declares (lookup falls through to English), but a
 * translation that drops a `{placeholder}`, that loses a whitespace-only value,
 * or that is byte-identical to the English source is a defect in the pack.
 *
 * Usage:
 *   node tools/check.mjs             report coverage and defects
 *   node tools/check.mjs --strict    exit 1 when any defect is found
 *
 * @module tools/check
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const dictionariesDir = join(root, 'dictionaries')
const verbatimFile = join(import.meta.dirname, 'verbatim.json')

/**
 * Sources that are correctly identical to the English: names, formats, units,
 * paths, and example values. Keyed by source text, so one entry covers every
 * key that carries it, and each entry states why it stays Latin.
 * @returns source text → reason.
 */
export function loadVerbatim() {
  return JSON.parse(readFileSync(verbatimFile, 'utf8'))
}

/** `{name}`-style placeholders in a string, as a sorted multiset. */
export function placeholders(text) {
  return [...text.matchAll(/\{[A-Za-z0-9_.]+\}/gu)].map((match) => match[0]).sort()
}

/** Whether a value must be copied verbatim (nothing to translate). */
export function isFrameOnly(text) {
  return text.trim() === ''
}

/**
 * Load every dictionary file.
 * @returns namespace → record.
 */
export function loadDictionaries() {
  const records = new Map()
  for (const file of readdirSync(dictionariesDir).sort()) {
    if (!file.endsWith('.json') || file === 'index.json') continue
    const record = JSON.parse(readFileSync(join(dictionariesDir, file), 'utf8'))
    records.set(record.namespace, record)
  }
  return records
}

/**
 * Audit one namespace.
 * @param record - one dictionary file.
 * @param verbatim - allowlisted source texts (see {@link loadVerbatim}).
 * @returns `{ keys, translated, defects }`.
 */
export function auditNamespace(record, verbatim = loadVerbatim()) {
  const defects = []
  const keys = Object.entries(record.keys)
  const ja = record.ja ?? {}
  for (const [key, source] of keys) {
    const value = ja[key]
    if (value === undefined) continue
    if (typeof source !== 'string') {
      defects.push({ key, kind: 'source-not-a-string', detail: 'extraction did not recover a string' })
      continue
    }
    if (value.trim() === '' && source.trim() !== '') {
      defects.push({ key, kind: 'empty-translation', detail: JSON.stringify(source) })
      continue
    }
    if (isFrameOnly(source)) {
      if (value !== source) defects.push({ key, kind: 'frame-changed', detail: `${JSON.stringify(source)} → ${JSON.stringify(value)}` })
      continue
    }
    const expected = placeholders(source)
    const actual = placeholders(value)
    if (expected.join(',') !== actual.join(',')) {
      defects.push({ key, kind: 'placeholder-mismatch', detail: `${JSON.stringify(source)} → ${JSON.stringify(value)}` })
      continue
    }
    if (value === source && !(source in verbatim)) {
      defects.push({ key, kind: 'untranslated', detail: `${JSON.stringify(source)} — add it to tools/verbatim.json with a reason if it is correctly Latin` })
    }
  }
  const stray = Object.keys(ja).filter((key) => !(key in record.keys))
  for (const key of stray) defects.push({ key, kind: 'unknown-key', detail: 'translated key is not in the extracted key set' })
  return { keys: keys.length, translated: Object.keys(ja).length, defects }
}

/**
 * Allowlist entries no dictionary uses any more.
 * @returns the stale source texts.
 */
export function staleVerbatim(records = loadDictionaries(), verbatim = loadVerbatim()) {
  const sources = new Set()
  for (const record of records.values()) for (const value of Object.values(record.keys)) sources.add(value)
  return Object.keys(verbatim).filter((source) => !sources.has(source))
}

function main(argv) {
  const records = loadDictionaries()
  const verbatim = loadVerbatim()
  let totalKeys = 0
  let totalTranslated = 0
  const defects = []
  const rows = []
  for (const [namespace, record] of records) {
    const audit = auditNamespace(record, verbatim)
    totalKeys += audit.keys
    totalTranslated += audit.translated
    defects.push(...audit.defects.map((defect) => ({ namespace, ...defect })))
    rows.push({ namespace, ...audit })
  }
  for (const source of staleVerbatim(records, verbatim)) {
    defects.push({ namespace: 'tools/verbatim.json', key: source, kind: 'stale-verbatim', detail: 'no dictionary carries this source any more' })
  }
  const width = Math.max(...rows.map((row) => row.namespace.length), 9)
  for (const row of rows.sort((left, right) => left.namespace.localeCompare(right.namespace))) {
    const percent = row.keys === 0 ? '—' : `${String(Math.round((row.translated / row.keys) * 100))}%`
    process.stdout.write(`  ${row.namespace.padEnd(width)} ${String(row.translated).padStart(5)}/${String(row.keys).padEnd(5)} ${percent.padStart(4)}${row.defects.length > 0 ? `  ${String(row.defects.length)} defect(s)` : ''}\n`)
  }
  const percent = totalKeys === 0 ? '0%' : `${((totalTranslated / totalKeys) * 100).toFixed(1)}%`
  process.stdout.write(`\ntotal: ${String(totalTranslated)}/${String(totalKeys)} keys translated (${percent}) across ${String(rows.length)} namespaces\n`)
  for (const defect of defects.slice(0, 60)) {
    process.stdout.write(`  ${defect.kind}: ${defect.namespace}/${defect.key} — ${defect.detail}\n`)
  }
  if (defects.length > 60) process.stdout.write(`  … ${String(defects.length - 60)} more\n`)
  process.stdout.write(`defects: ${String(defects.length)}\n`)
  if (argv.includes('--strict') && defects.length > 0) process.exitCode = 1
}

if (process.argv[1] === import.meta.filename) main(process.argv.slice(2))
