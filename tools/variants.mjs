/**
 * Report Japanese orthographic variants used across the pack.
 *
 * Nine parallel translators converge on nine ways to spell the same loanword.
 * Each pair below is a place the UI can contradict itself ("ユーザー" in one row,
 * "ユーザ" in the next), so the pack is normalized against this report rather
 * than by eye.
 *
 * Usage:
 *   node tools/variants.mjs [--json]
 *
 * @module tools/variants
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dictionariesDir = join(import.meta.dirname, '..', 'dictionaries')

/** Loanwords and compounds with more than one accepted Japanese spelling. */
const VARIANTS = [
  ['ユーザー', 'ユーザ'],
  ['サーバー', 'サーバ'],
  ['ブラウザー', 'ブラウザ'],
  ['パラメーター', 'パラメータ'],
  ['コンピューター', 'コンピュータ'],
  ['フォルダー', 'フォルダ'],
  ['ディレクトリー', 'ディレクトリ'],
  ['カテゴリー', 'カテゴリ'],
  ['メモリー', 'メモリ'],
  ['プロバイダー', 'プロバイダ'],
  ['エディター', 'エディタ'],
  ['レジストリー', 'レジストリ'],
  ['セパレーター', 'セパレータ'],
  ['ドライバー', 'ドライバ'],
  ['フィルター', 'フィルタ'],
  ['ヘッダー', 'ヘッダ'],
  ['フッター', 'フッタ'],
  ['ラベル', 'ラベルー'],
  ['デフォルト', '既定'],
  ['キャンセル', '取消'],
  ['クリップボード', 'クリップボードー'],
]

/** Every `ja` value in the pack with the key that carries it. */
export function readValues() {
  const values = []
  for (const file of readdirSync(dictionariesDir).sort()) {
    if (!file.endsWith('.json') || file === 'index.json') continue
    const record = JSON.parse(readFileSync(join(dictionariesDir, file), 'utf8'))
    for (const [key, value] of Object.entries(record.ja ?? {})) {
      if (typeof value === 'string') values.push({ namespace: record.namespace, key, value })
    }
  }
  return values
}

/**
 * Count how often each spelling of each variant pair appears.
 * @returns one row per pair that is spelled both ways, with example keys.
 */
export function findVariants(values = readValues()) {
  const rows = []
  for (const [preferred, alternate] of VARIANTS) {
    /* A longer spelling contains the shorter one, so subtract to attribute each
       occurrence to the spelling actually written. */
    const preferredCount = values.filter((entry) => entry.value.includes(preferred)).length
    const alternateCount = values.filter((entry) => entry.value.includes(alternate)).length
    const overlap = preferred.includes(alternate) || alternate.includes(preferred)
    const long = preferred.length >= alternate.length ? preferred : alternate
    const short = long === preferred ? alternate : preferred
    const shortOnly = values.filter((entry) => entry.value.includes(short) && !entry.value.includes(long))
    const longOnly = values.filter((entry) => entry.value.includes(long))
    if (!overlap) {
      if (preferredCount > 0 && alternateCount > 0) {
        rows.push({ preferred, alternate, preferredCount, alternateCount, examples: shortOnly.slice(0, 4) })
      }
      continue
    }
    if (shortOnly.length > 0 && longOnly.length > 0) {
      rows.push({
        preferred: long,
        alternate: short,
        preferredCount: longOnly.length,
        alternateCount: shortOnly.length,
        examples: shortOnly.slice(0, 4),
      })
    }
  }
  return rows
}

function main(argv) {
  const values = readValues()
  const rows = findVariants(values)
  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`)
    return
  }
  process.stdout.write(`${String(values.length)} translated values scanned\n`)
  if (rows.length === 0) {
    process.stdout.write('no variant spellings found\n')
    return
  }
  for (const row of rows) {
    process.stdout.write(`\n${row.preferred} (${String(row.preferredCount)})  vs  ${row.alternate} (${String(row.alternateCount)})\n`)
    for (const example of row.examples) process.stdout.write(`   ${example.namespace}/${example.key}: ${example.value}\n`)
  }
}

if (process.argv[1] === import.meta.filename) main(process.argv.slice(2))
