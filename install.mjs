#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import readline from 'node:readline/promises'

const NAME = '@local/dsh-locale-ja'
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
export function toLinkPath(pathname) {
  return pathname.replaceAll('\\', '/')
}
function json(pathname) {
  const value = JSON.parse(readFileSync(pathname, 'utf8'))
  if (!object(value)) throw new Error(`Expected a JSON object: ${pathname}`)
  return value
}
function inspect(directory) {
  const profileDir = realpathSync(resolve(directory))
  const manifestPath = join(profileDir, 'package.json')
  const manifest = json(manifestPath)
  if (!object(manifest.dsh) || !object(manifest.dsh.profile) || !Array.isArray(manifest.dsh.profile.bundles)) {
    throw new Error(`Invalid DSH profile: missing dsh.profile.bundles array (${manifestPath})`)
  }
  if (manifest.dsh.profile.bundles.some(value => typeof value !== 'string')) throw new Error('Profile bundles must contain only strings')
  if (manifest.dependencies !== undefined && !object(manifest.dependencies)) throw new Error('Profile dependencies must be an object')
  return { profileDir, manifestPath, manifest }
}
function args(argv) {
  if (argv.length === 0) return null
  if (argv.length !== 2 || argv[0] !== '--profile' || !argv[1] || argv[1].startsWith('--')) {
    throw new Error('Usage: node install.mjs [--profile <directory>]')
  }
  return argv[1]
}
async function selectProfile(explicit, env) {
  if (explicit !== null) return inspect(explicit)
  const candidates = [env.DSH_PROFILE_DIR, env.DSH_HOME && join(env.DSH_HOME, 'profiles', 'web')].filter(Boolean)
  const valid = new Map()
  for (const directory of candidates) {
    try {
      const entry = inspect(directory)
      const key = process.platform === 'win32' ? entry.profileDir.toLowerCase() : entry.profileDir
      valid.set(key, entry)
    } catch {}
  }
  if (valid.size > 1) throw new Error('Multiple valid profile directories were found. Use --profile explicitly.')
  if (valid.size === 1) return [...valid.values()][0]
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Could not determine a valid DSH Web profile directory. Use --profile <directory> or set DSH_PROFILE_DIR / DSH_HOME.')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = (await rl.question('DSH Web profile directory: ')).trim()
    if (!answer) throw new Error('No profile directory was provided')
    return inspect(answer)
  } finally { rl.close() }
}
function runPnpm(action, { cwd, env, stdio }) {
  if (!['--version', 'install'].includes(action)) throw new Error('Unsupported pnpm action')
  if (process.platform === 'win32') {
    const systemRoot = env.SystemRoot || env.SYSTEMROOT
    if (!systemRoot) throw new Error('SystemRoot is missing; cannot locate Windows cmd.exe')
    // Only fixed commands enter cmd.exe. Paths travel exclusively through cwd/env.
    return spawnSync(join(systemRoot, 'System32', 'cmd.exe'), ['/d', '/s', '/c', `pnpm ${action}`], { cwd, env, stdio, shell: false, windowsHide: true })
  }
  return spawnSync('pnpm', [action], { cwd, env, stdio, shell: false })
}
function failure(result) {
  return result.error?.message || (result.signal ? `signal ${result.signal}` : `exit ${result.status}`)
}
export async function runInstaller({ argv = process.argv.slice(2), env = process.env } = {}) {
  const packDir = realpathSync(fileURLToPath(new URL('.', import.meta.url)))
  for (const file of ['package.json', 'index.js', 'client.js', 'cordis.patch.yml']) {
    if (!existsSync(join(packDir, file))) throw new Error(`Required runtime file is missing: ${file}`)
  }
  if (json(join(packDir, 'package.json')).name !== NAME) throw new Error('Unexpected language pack name')
  const { profileDir, manifestPath } = await selectProfile(args(argv), env)
  // cmd.exe cannot retain a UNC working directory. Refuse before any writes.
  if (process.platform === 'win32' && profileDir.startsWith('\\\\')) {
    throw new Error('Windows UNC profile directories are not supported. Map the profile to a drive letter and use --profile.')
  }
  const probe = runPnpm('--version', { cwd: profileDir, env, stdio: 'ignore' })
  if (probe.status !== 0) throw new Error(`pnpm was not found in PATH or could not start (${failure(probe)}). Check pnpm --version first.`)
  const originalText = readFileSync(manifestPath, 'utf8')
  const { manifest } = inspect(profileDir)
  const dependencySpec = `link:${toLinkPath(packDir)}`
  manifest.dependencies ??= {}
  manifest.dependencies[NAME] = dependencySpec
  manifest.dsh.profile.bundles = [...manifest.dsh.profile.bundles.filter(entry => entry !== NAME), NAME]
  const nextText = `${JSON.stringify(manifest, null, 2)}\n`
  const backupPath = `${manifestPath}.bak-${randomUUID()}`
  process.stdout.write('Stop DSH before installation.\n')
  writeFileSync(backupPath, originalText, { encoding: 'utf8', flag: 'wx' })
  writeFileSync(manifestPath, nextText, 'utf8')
  process.stdout.write(`Profile: ${profileDir}\nBackup: ${backupPath}\n`)
  let result
  try {
    result = runPnpm('install', { cwd: profileDir, env, stdio: 'inherit' })
    if (result.status !== 0) throw new Error(failure(result))
  } catch (error) {
    if (readFileSync(manifestPath, 'utf8') !== nextText) {
      throw new Error(`pnpm install failed (${error.message}). Profile changed concurrently; not overwritten. Original backup: ${backupPath}. lockfile/node_modules may still contain partial changes.`)
    }
    writeFileSync(manifestPath, originalText, 'utf8')
    throw new Error(`pnpm install failed (${error.message}). Profile package.json was restored from backup. lockfile/node_modules may still contain partial changes from pnpm.`)
  }
  process.stdout.write('Restart DSH and reload the browser, then select 日本語 in Settings > General > Language.\n')
  return { profileDir, backupPath, dependencySpec }
}
function isMain() {
  if (!process.argv[1]) return false
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)) }
  catch { return false }
}
if (isMain()) runInstaller().catch(error => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
