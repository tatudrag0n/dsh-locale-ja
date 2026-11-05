#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, isAbsolute, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'

const PACKAGE_NAME = '@local/dsh-locale-ja'
const REQUIRED_PACK_FILES = ['package.json', 'index.js', 'client.js', 'cordis.patch.yml']

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toLinkPath(pathname) {
  return pathname.replaceAll('\\', '/')
}

function parseArgs(argv) {
  let profile
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--profile') {
      const value = argv[index + 1]
      if (typeof value !== 'string' || value.startsWith('--')) {
        throw new Error('`--profile` requires a directory path')
      }
      profile = value
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }
  return { profile }
}

function readJson(pathname, label) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(pathname, 'utf8'))
  } catch (error) {
    throw new Error(`${label} is not valid JSON (${error instanceof Error ? error.message : String(error)})`)
  }
  if (!isPlainObject(parsed)) throw new Error(`${label} must be a JSON object`)
  return parsed
}

function ensurePackRuntimeFiles(packDir) {
  for (const file of REQUIRED_PACK_FILES) {
    const target = join(packDir, file)
    if (!existsSync(target)) throw new Error(`Required runtime file is missing: ${target}`)
  }
  const manifest = readJson(join(packDir, 'package.json'), 'Pack package.json')
  if (manifest.name !== PACKAGE_NAME) {
    throw new Error(`Pack package.json name must be ${PACKAGE_NAME}`)
  }
}

function ensureProfileManifestStructure(manifest, manifestPath) {
  if (!isPlainObject(manifest.dsh)) {
    throw new Error(`Profile package.json is missing dsh object (${manifestPath})`)
  }
  if (!isPlainObject(manifest.dsh.profile)) {
    throw new Error(`Profile package.json is missing dsh.profile object (${manifestPath})`)
  }
  if (!Array.isArray(manifest.dsh.profile.bundles)) {
    throw new Error(`Profile package.json is missing dsh.profile.bundles array (${manifestPath})`)
  }
  if (manifest.dsh.profile.bundles.some((entry) => typeof entry !== 'string')) {
    throw new Error(`Profile dsh.profile.bundles must contain only strings (${manifestPath})`)
  }
  if (manifest.dependencies !== undefined && !isPlainObject(manifest.dependencies)) {
    throw new Error(`Profile dependencies must be an object when present (${manifestPath})`)
  }
}

function inspectProfile(profileDir) {
  const manifestPath = join(profileDir, 'package.json')
  if (!existsSync(manifestPath)) throw new Error(`Missing ${manifestPath}`)
  const manifest = readJson(manifestPath, `Profile package.json (${manifestPath})`)
  ensureProfileManifestStructure(manifest, manifestPath)
  return { profileDir, manifestPath, manifest }
}

function maybeInspectProfile(profileDir) {
  try {
    return { ok: true, ...inspectProfile(profileDir) }
  } catch (error) {
    return {
      ok: false,
      profileDir,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

function resolveFromEnvironment(env) {
  const candidates = []
  if (typeof env.DSH_PROFILE_DIR === 'string' && env.DSH_PROFILE_DIR.trim() !== '') {
    candidates.push(resolve(env.DSH_PROFILE_DIR))
  }
  if (typeof env.DSH_HOME === 'string' && env.DSH_HOME.trim() !== '') {
    candidates.push(resolve(env.DSH_HOME, 'profiles', 'web'))
  }
  const unique = [...new Set(candidates)]
  const valid = unique.map(maybeInspectProfile).filter((entry) => entry.ok)
  if (valid.length === 1) return valid[0]
  if (valid.length > 1) {
    throw new Error(`Multiple valid profile directories were found. Use --profile explicitly: ${valid.map((entry) => entry.profileDir).join(', ')}`)
  }
  return null
}

async function promptProfile() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = (await rl.question('DSH Web profile directory (contains package.json): ')).trim()
    if (answer === '') throw new Error('No profile directory was provided')
    return resolve(answer)
  } finally {
    rl.close()
  }
}

function formatSpawnFailure(result) {
  if (result.error instanceof Error) {
    const code = typeof result.error.code === 'string' ? ` (${result.error.code})` : ''
    return `${result.error.message}${code}`
  }
  if (result.signal !== null) return `terminated by signal ${result.signal}`
  if (typeof result.status === 'number') return `exit status ${String(result.status)}`
  return 'unknown failure'
}

function appendAttempt(attempts, target, result) {
  attempts.push(`${target}: ${formatSpawnFailure(result)}`)
}

function resolveWindowsPnpmEntryFromShim(shimPath) {
  let text
  try {
    text = readFileSync(shimPath, 'utf8')
  } catch {
    return null
  }
  const match = text.match(/"%~dp0\\([^"\r\n]+\.c?js)"/iu)
  if (!match) return null
  const relative = match[1].replaceAll('\\', '/')
  return resolve(dirname(shimPath), relative)
}

function listWindowsPnpmCandidates(env) {
  const pathValue = typeof env.PATH === 'string' ? env.PATH : ''
  const directories = pathValue.split(';').filter(Boolean)
  const candidates = []
  for (const directory of directories) {
    candidates.push(join(directory, 'pnpm.cmd'))
    candidates.push(join(directory, 'pnpm.bat'))
    candidates.push(join(directory, 'pnpm.exe'))
    candidates.push(join(directory, 'pnpm'))
  }
  return [...new Set(candidates)]
}

function detectPnpmOnWindows({ env, attempts }) {
  const shimCandidates = listWindowsPnpmCandidates(env)
  for (const candidate of shimCandidates) {
    if (!existsSync(candidate)) continue
    const lower = candidate.toLowerCase()
    if (lower.endsWith('.cmd') || lower.endsWith('.bat')) {
      const entry = resolveWindowsPnpmEntryFromShim(candidate)
      if (entry === null || !existsSync(entry)) {
        attempts.push(`${candidate}: could not resolve a pnpm JavaScript entry from shim`)
        continue
      }
      const result = spawnSync(process.execPath, [entry, '--version'], { stdio: 'ignore', shell: false, env })
      if (result.status === 0) return { command: process.execPath, args: [entry], attempts }
      appendAttempt(attempts, `${process.execPath} ${entry} --version`, result)
      continue
    }
    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: false, env })
    if (result.status === 0) return { command: candidate, args: [], attempts }
    appendAttempt(attempts, `${candidate} --version`, result)
  }

  const corepackEntry = resolve(dirname(process.execPath), 'node_modules', 'corepack', 'dist', 'pnpm.js')
  if (existsSync(corepackEntry)) {
    const result = spawnSync(process.execPath, [corepackEntry, '--version'], { stdio: 'ignore', shell: false, env })
    if (result.status === 0) return { command: process.execPath, args: [corepackEntry], attempts }
    appendAttempt(attempts, `${process.execPath} ${corepackEntry} --version`, result)
  }

  return { command: null, args: [], attempts }
}

function detectPnpm(env = process.env) {
  const attempts = []
  if (process.platform === 'win32') return detectPnpmOnWindows({ env, attempts })
  const commands = ['pnpm', 'pnpm.cmd']
  for (const command of commands) {
    const result = spawnSync(command, ['--version'], { stdio: 'ignore', shell: false, env })
    if (result.status === 0) return { command, args: [], attempts }
    appendAttempt(attempts, `${command} --version`, result)
  }
  return { command: null, args: [], attempts }
}

export function isDirectCliInvocation(argv1 = process.argv[1]) {
  if (typeof argv1 !== 'string' || argv1.trim() === '') return false
  const expected = normalize(resolve(fileURLToPath(import.meta.url)))
  const actual = normalize(resolve(argv1))
  if (process.platform === 'win32') {
    return expected.toLowerCase() === actual.toLowerCase()
  }
  return expected === actual
}

function dedupeBundleEntries(entries) {
  const output = []
  let seen = false
  for (const entry of entries) {
    if (entry === PACKAGE_NAME) {
      if (seen) continue
      seen = true
    }
    output.push(entry)
  }
  if (!seen) output.push(PACKAGE_NAME)
  return output
}

function ensureAbsoluteProfile(dir) {
  if (!isAbsolute(dir)) return resolve(dir)
  return dir
}

async function ensureParent(pathname) {
  await mkdir(dirname(pathname), { recursive: true })
}

export async function runInstaller({ argv = process.argv.slice(2), env = process.env } = {}) {
  const packDir = normalize(resolve(fileURLToPath(new URL('.', import.meta.url))))
  ensurePackRuntimeFiles(packDir)

  const { profile: explicitProfile } = parseArgs(argv)
  let inspected
  if (typeof explicitProfile === 'string') {
    inspected = inspectProfile(ensureAbsoluteProfile(explicitProfile))
  } else {
    inspected = resolveFromEnvironment(env)
    if (inspected === null) {
      const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
      if (!interactive) {
        throw new Error('Could not determine a valid DSH Web profile directory. Use --profile <directory> or set DSH_PROFILE_DIR / DSH_HOME.')
      }
      inspected = inspectProfile(await promptProfile())
    }
  }

  const pnpm = detectPnpm(env)
  if (pnpm.command === null) {
    const details = pnpm.attempts.length > 0 ? ` Attempts: ${pnpm.attempts.join(' | ')}` : ''
    throw new Error(`pnpm was not found in PATH. Install pnpm first, then re-run this installer.${details}`)
  }

  const { manifestPath, profileDir } = inspected
  const originalText = readFileSync(manifestPath, 'utf8')
  const manifest = readJson(manifestPath, `Profile package.json (${manifestPath})`)
  ensureProfileManifestStructure(manifest, manifestPath)

  const dependencySpec = `link:${toLinkPath(packDir)}`
  const updated = structuredClone(manifest)
  if (!isPlainObject(updated.dependencies)) updated.dependencies = {}
  updated.dependencies[PACKAGE_NAME] = dependencySpec
  updated.dsh.profile.bundles = dedupeBundleEntries(updated.dsh.profile.bundles)

  const backupPath = `${manifestPath}.bak-${new Date().toISOString().replaceAll(':', '').replaceAll('.', '')}`
  await ensureParent(backupPath)
  writeFileSync(backupPath, originalText, 'utf8')
  const nextText = `${JSON.stringify(updated, null, 2)}\n`
  writeFileSync(manifestPath, nextText, 'utf8')

  process.stdout.write('Stop DSH before installation.\n')
  process.stdout.write(`Profile: ${profileDir}\n`)
  process.stdout.write(`Backup: ${backupPath}\n`)
  process.stdout.write(`Dependency: ${PACKAGE_NAME} -> ${dependencySpec}\n`)

  const result = spawnSync(pnpm.command, [...pnpm.args, 'install'], {
    cwd: profileDir,
    stdio: 'inherit',
    shell: false,
  })

  if (result.status !== 0) {
    writeFileSync(manifestPath, originalText, 'utf8')
    throw new Error(`pnpm install failed (${formatSpawnFailure(result)}). Profile package.json was restored from backup. lockfile/node_modules may still contain partial changes from pnpm.`)
  }

  process.stdout.write('Installation updated profile configuration successfully.\n')
  process.stdout.write('Restart DSH and reload the browser, then select 日本語 in Settings > General > Language.\n')

  return {
    profileDir,
    backupPath,
    dependencySpec,
  }
}

if (isDirectCliInvocation()) {
  runInstaller().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
