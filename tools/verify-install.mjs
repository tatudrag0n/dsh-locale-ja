/**
 * Verify that the language pack is installed correctly in a DSH profile.
 *
 * The browser-side behaviour is covered by `node --test`; what this tool adds is
 * the wiring between the running harness and the package: the manifest entry,
 * the resolution the client-modules scan performs, the bundle patch the Loader
 * applies, and the host half it imports. Those are the parts that fail silently
 * — a plugin that never activates looks exactly like a plugin that activates
 * and does nothing.
 *
 * Usage:
 *   node tools/verify-install.mjs [--profile <profile dir>]
 *
 * The profile defaults to `$DSH_PROFILE_DIR`.
 *
 * @module tools/verify-install
 */

import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const packageName = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8')).name

/** One check's outcome. */
function report(ok, label, detail = '') {
  process.stdout.write(`${ok ? '  ok  ' : ' FAIL '} ${label}${detail === '' ? '' : ` — ${detail}`}\n`)
  return ok
}

/**
 * Run every check.
 * @param profileDir - profile directory to inspect.
 * @returns whether the installation is complete.
 */
export async function verifyInstall(profileDir) {
  const results = []
  const manifestPath = join(profileDir, 'package.json')
  if (!existsSync(manifestPath)) {
    report(false, 'profile manifest exists', manifestPath)
    return false
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  results.push(report(
    typeof manifest.dependencies?.[packageName] === 'string',
    'profile dependencies link the package',
    manifest.dependencies?.[packageName] ?? 'missing',
  ))
  results.push(report(
    Array.isArray(manifest.dsh?.profile?.bundles) && manifest.dsh.profile.bundles.includes(packageName),
    'profile bundles list the package',
  ))

  const installed = join(profileDir, 'node_modules', ...packageName.split('/'))
  results.push(report(existsSync(installed), 'package resolves in the profile', installed))

  const require = createRequire(manifestPath)
  let hostEntry
  try {
    hostEntry = require.resolve(packageName)
  } catch (error) {
    results.push(report(false, 'host half resolves', String(error)))
    return results.every(Boolean)
  }
  const host = await import(new URL(`file:///${hostEntry.replaceAll('\\', '/')}`).href)
  results.push(report(typeof host.apply === 'function', 'host half exports apply()'))

  const installedManifest = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'))
  results.push(report(
    installedManifest.dsh?.client?.platform === 'web' && installedManifest.dsh.client.immediately === true,
    'manifest declares a web client half in the immediate phase',
  ))

  let clientEntry
  try {
    clientEntry = require.resolve(`${packageName}/client`)
  } catch (error) {
    results.push(report(false, 'client bundle resolves through exports', String(error)))
    return results.every(Boolean)
  }
  const source = readFileSync(clientEntry, 'utf8')
  let entry
  const window = { __ModuleLoader__: { load: (value) => { entry = value } } }
  // eslint-disable-next-line no-new-func
  new Function('window', source)(window)
  results.push(report(entry?.id === packageName, 'client bundle registers under the package name', String(entry?.id)))

  const languages = []
  const dictionaries = []
  const plugin = entry.factory()
  plugin.apply({
    effect: (fn) => fn(),
    locale: {
      addLanguage: (input) => { languages.push(input); return () => {} },
      register: (namespace, locale, dict) => { dictionaries.push({ namespace, locale, dict }); return () => {} },
    },
  })
  results.push(report(
    languages.length === 1 && languages[0].id === 'ja' && languages[0].label === '日本語',
    'registers the 日本語 language',
    JSON.stringify(languages),
  ))
  results.push(report(dictionaries.length > 0, 'registers dictionaries', `${String(dictionaries.length)} namespaces`))

  const patch = readFileSync(join(installed, 'cordis.patch.yml'), 'utf8')
  results.push(report(
    patch.includes(packageName) && /id:\s*[\w-]+/u.test(patch),
    'bundle patch inserts a row for the package',
  ))
  return results.every(Boolean)
}

if (process.argv[1] === import.meta.filename) {
  const args = process.argv.slice(2)
  const flag = args.indexOf('--profile')
  const profileDir = resolve(flag === -1 ? (process.env.DSH_PROFILE_DIR ?? '') : args[flag + 1])
  if (profileDir === '') {
    process.stderr.write('usage: node tools/verify-install.mjs --profile <profile dir>\n')
    process.exitCode = 1
  } else {
    process.stdout.write(`profile: ${profileDir}\n`)
    const ok = await verifyInstall(profileDir)
    process.stdout.write(ok ? 'installation complete\n' : 'installation incomplete\n')
    if (!ok) process.exitCode = 1
  }
}
