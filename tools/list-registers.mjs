/** One-off: list every two-argument `.register(<a>, <b>)` call in installed client bundles. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { matchBracket, splitArguments } from './literal.mjs'

const root = process.argv[2]
const filter = process.argv[3] ?? ''
for (const scope of readdirSync(root)) {
  const scopeDir = join(root, scope)
  if (!statSync(scopeDir).isDirectory()) continue
  for (const name of readdirSync(scopeDir)) {
    const dir = join(scopeDir, name)
    if (!statSync(dir).isDirectory()) continue
    const manifestPath = join(dir, 'package.json')
    if (!existsSync(manifestPath)) continue
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (manifest.dsh?.client === undefined) continue
    if (filter !== '' && !String(manifest.name).includes(filter)) continue
    const exported = manifest.exports?.['./client']
    const target = typeof exported === 'string' ? exported : exported?.default
    const file = [target === undefined ? undefined : join(dir, target), join(dir, 'lib', 'client.js'), join(dir, 'client.js')]
      .filter((v) => v !== undefined).find((f) => existsSync(f))
    if (file === undefined) continue
    const text = readFileSync(file, 'utf8')
    const rows = []
    for (const match of text.matchAll(/\.register\s*\(/gu)) {
      const open = match.index + match[0].length - 1
      let args
      try {
        args = splitArguments(text.slice(open + 1, matchBracket(text, open) - 1))
      } catch {
        continue
      }
      if (args.length !== 2) continue
      const ctor = text.slice(Math.max(0, match.index - 40), match.index).trim().split(/\s+/u).at(-1)
      rows.push(`${ctor}(${args[0].replace(/\s+/gu, ' ').slice(0, 60)} , ${args[1].replace(/\s+/gu, ' ').slice(0, 60)})`)
    }
    const localeRows = rows.filter((row) => /locale/iu.test(row) || /^\("|^\(NS|^\(COMMON/iu.test(row))
    if (localeRows.length === 0) continue
    process.stdout.write(`\n${manifest.name}\n`)
    for (const row of localeRows) process.stdout.write(`   ${row}\n`)
  }
}
