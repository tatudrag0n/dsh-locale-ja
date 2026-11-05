/**
 * Turn the extracted dictionaries into translation work units.
 *
 * Every English string is translated once and mapped back onto every key that
 * uses it, so one repeated label ("Cancel", "Retry") reads identically on every
 * surface and the translation volume is the distinct-string count rather than
 * the key count.
 *
 * Outputs under `work/`:
 *   strings.json          id → English source text (the whole job)
 *   keymap.json           namespace → key → id (how to write the result back)
 *   chunks/chunk-NN.json  one agent's share of strings.json
 *   chunks/out-NN.json    that agent's translations (written by the agent)
 *
 * @module tools/make-work
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const dictionariesDir = join(root, 'dictionaries')
const workDir = join(root, 'work')
const chunksDir = join(workDir, 'chunks')

/** Strings that are already language-neutral and must survive translation. */
export const VERBATIM = new Set([
  'DSH', 'GitHub', 'LM Studio', 'Ollama', 'llama.cpp', 'API', 'URL', 'JSON', 'Markdown',
  'OK', 'ID', 'MCP', 'PTC', 'SSH', 'CLI', 'HTTP', 'HTTPS', 'PDF', 'Excel', 'CSV', 'PNG',
  'JPEG', 'WebP', 'SVG', 'npm', 'pnpm', 'Node.js', 'Windows', 'macOS', 'Linux', 'VS Code',
])

/** Placeholder tokens that must appear unchanged in a translation. */
export function placeholders(text) {
  return [...text.matchAll(/\{[A-Za-z0-9_.]+\}/gu)].map((match) => match[0]).sort()
}

/**
 * Build the work units.
 * @param options - `{ chunkSize }`.
 * @returns the written paths and counts.
 */
export function makeWork({ chunkSize = 120 } = {}) {
  const strings = new Map()
  const keymap = {}
  for (const file of readdirSync(dictionariesDir)) {
    if (!file.endsWith('.json') || file === 'index.json') continue
    const record = JSON.parse(readFileSync(join(dictionariesDir, file), 'utf8'))
    const ns = record.namespace
    const map = (keymap[ns] = {})
    for (const [key, value] of Object.entries(record.keys)) {
      if (typeof value !== 'string') continue
      if (!strings.has(value)) strings.set(value, `s${String(strings.size + 1).padStart(4, '0')}`)
      map[key] = strings.get(value)
    }
  }
  rmSync(chunksDir, { recursive: true, force: true })
  mkdirSync(chunksDir, { recursive: true })

  const ids = [...strings.keys()].sort()
  const byId = new Map(ids.map((text) => [strings.get(text), text]))
  writeFileSync(join(workDir, 'strings.json'), `${JSON.stringify(Object.fromEntries(byId), null, 1)}\n`, 'utf8')
  writeFileSync(join(workDir, 'keymap.json'), `${JSON.stringify(keymap, null, 1)}\n`, 'utf8')

  const chunkCount = Math.max(1, Math.ceil(ids.length / chunkSize))
  const chunkIds = []
  for (let index = 0; index < chunkCount; index += 1) {
    const slice = ids.slice(index * chunkSize, (index + 1) * chunkSize)
    const name = `chunk-${String(index + 1).padStart(2, '0')}`
    const payload = {}
    for (const text of slice) payload[strings.get(text)] = text
    writeFileSync(join(chunksDir, `${name}.json`), `${JSON.stringify(payload, null, 1)}\n`, 'utf8')
    chunkIds.push(name)
  }
  return { chunkIds, strings: ids.length, keys: Object.values(keymap).reduce((sum, map) => sum + Object.keys(map).length, 0) }
}

if (process.argv[1] === import.meta.filename) {
  const chunkSize = Number(process.argv[2] ?? 120)
  const result = makeWork({ chunkSize })
  process.stdout.write(`distinct strings: ${String(result.strings)}\n`)
  process.stdout.write(`keys mapped:      ${String(result.keys)}\n`)
  process.stdout.write(`chunks:           ${String(result.chunkIds.length)} (${result.chunkIds.join(' ')})\n`)
  void existsSync
}
