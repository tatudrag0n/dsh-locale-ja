import assert from 'node:assert/strict'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { isDirectCliInvocation, toLinkPath } from '../install.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const installerSource = join(repoRoot, 'install.mjs')

function makePackDir(parent, name = 'dsh-locale-ja pack 日本語') {
  const packDir = join(parent, name)
  mkdirSync(packDir, { recursive: true })
  copyFileSync(installerSource, join(packDir, 'install.mjs'))
  writeFileSync(join(packDir, 'package.json'), `${JSON.stringify({ name: '@local/dsh-locale-ja', version: '1.0.1' }, null, 2)}\n`)
  writeFileSync(join(packDir, 'index.js'), 'export function apply() {}\n')
  writeFileSync(join(packDir, 'client.js'), 'window.__ModuleLoader__?.load?.({ id: "@local/dsh-locale-ja", factory: () => ({ inject: ["locale"], apply: () => {} }) })\n')
  writeFileSync(join(packDir, 'cordis.patch.yml'), '- id: local-dsh-locale-ja\n')
  return packDir
}

function makeProfileDir(parent, name = 'profile web') {
  const profileDir = join(parent, name)
  mkdirSync(profileDir, { recursive: true })
  const manifest = {
    name: 'dsh-web-profile',
    private: true,
    dependencies: {
      '@example/keep': '^1.2.3',
    },
    scripts: {
      keep: 'echo keep',
    },
    dsh: {
      profile: {
        bundles: ['@example/alpha', '@example/beta'],
      },
    },
  }
  writeFileSync(join(profileDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return profileDir
}

function makePnpmStub(parent) {
  const binDir = join(parent, 'bin')
  mkdirSync(binDir, { recursive: true })
  const stubJs = join(binDir, 'pnpm-stub.cjs')
  writeFileSync(stubJs, `const fs = require('node:fs')\nconst marker = process.env.PNPM_MARKER\nif (typeof marker === 'string' && marker !== '') {\n  fs.appendFileSync(marker, [process.argv[1], process.cwd(), process.argv.slice(2).join(' ')].join('|') + '\\n')\n}\nif (process.argv[2] === '--version') {\n  process.stdout.write('9.0.0\\n')\n  process.exit(0)\n}\nif (process.env.PNPM_SHOULD_FAIL === '1' && process.argv[2] === 'install') {\n  process.exit(7)\n}\nprocess.exit(0)\n`)
  if (process.platform === 'win32') {
    const pnpmCmd = join(binDir, 'pnpm.cmd')
    writeFileSync(pnpmCmd, `@ECHO OFF\r\n"%~dp0\\pnpm-stub.cjs" %*\r\n`)
    return binDir
  }
  const pnpm = join(binDir, 'pnpm')
  writeFileSync(pnpm, `#!/usr/bin/env node\nrequire('./pnpm-stub.cjs')\n`)
  chmodSync(pnpm, 0o755)
  return binDir
}

function makeWindowsPnpmShim(parent, relativeJsPath) {
  const binDir = join(parent, 'bin-win')
  mkdirSync(binDir, { recursive: true })
  const jsPath = join(binDir, ...relativeJsPath.split('/'))
  mkdirSync(resolve(jsPath, '..'), { recursive: true })
  writeFileSync(jsPath, `const fs = require('node:fs')\nconst marker = process.env.PNPM_MARKER\nif (marker) fs.appendFileSync(marker, process.argv.slice(2).join(' ') + '\\n')\nif (process.argv[2] === '--version') process.exit(0)\nif (process.argv[2] === 'install') process.exit(0)\nprocess.exit(1)\n`)
  writeFileSync(
    join(binDir, 'pnpm.cmd'),
    `@ECHO OFF\r\n"%~dp0\\${relativeJsPath.replaceAll('/', '\\')}" %*\r\n`,
  )
  return binDir
}

function runInstaller({ packDir, args = [], env = {} }) {
  const result = spawnSync(process.execPath, [join(packDir, 'install.mjs'), ...args], {
    cwd: packDir,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  })
  return result
}

function withPrependedPath(pathname) {
  const separator = process.platform === 'win32' ? ';' : ':'
  return `${pathname}${separator}${process.env.PATH ?? ''}`
}

function readManifest(profileDir) {
  return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'))
}

test('installs into profile, preserves settings, and stays idempotent', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-'))
  const packDir = makePackDir(root, 'pack with spaces 日本語')
  const profileDir = makeProfileDir(root)
  const marker = join(root, 'pnpm.log')
  const binDir = makePnpmStub(root)
  const env = {
    PATH: withPrependedPath(binDir),
    PNPM_MARKER: marker,
  }

  const first = runInstaller({ packDir, args: ['--profile', profileDir], env })
  assert.equal(first.status, 0, `${first.stderr}\n${first.stdout}`)
  const firstManifest = readManifest(profileDir)
  assert.equal(firstManifest.dependencies['@example/keep'], '^1.2.3')
  assert.equal(firstManifest.scripts.keep, 'echo keep')
  assert.equal(firstManifest.dependencies['@local/dsh-locale-ja'], `link:${packDir.replaceAll('\\\\', '/')}`)
  assert.deepEqual(
    firstManifest.dsh.profile.bundles,
    ['@example/alpha', '@example/beta', '@local/dsh-locale-ja'],
  )
  assert.match(first.stdout, /Stop DSH before installation\./u)
  assert.match(first.stdout, /Restart DSH and reload the browser/u)

  const second = runInstaller({ packDir, args: ['--profile', profileDir], env })
  assert.equal(second.status, 0, `${second.stderr}\n${second.stdout}`)
  const secondManifest = readManifest(profileDir)
  assert.equal(secondManifest.dsh.profile.bundles.filter((entry) => entry === '@local/dsh-locale-ja').length, 1)

  const calls = readFileSync(marker, 'utf8').trim().split('\n').filter(Boolean)
  const installCalls = calls.filter((line) => line.endsWith('|install'))
  assert.equal(installCalls.length, 2)
  assert.ok(installCalls.every((line) => line.includes(`|${profileDir}|`)))
})

test('fails for invalid profile manifest structure', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-invalid-'))
  const packDir = makePackDir(root)
  const badProfileDir = join(root, 'bad-profile')
  mkdirSync(badProfileDir, { recursive: true })
  writeFileSync(join(badProfileDir, 'package.json'), `${JSON.stringify({ dsh: { profile: {} } }, null, 2)}\n`)
  const binDir = makePnpmStub(root)

  const result = runInstaller({
    packDir,
    args: ['--profile', badProfileDir],
    env: { PATH: withPrependedPath(binDir) },
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /missing dsh\.profile\.bundles array/u)
})

test('fails clearly when profile resolution is ambiguous in non-interactive mode', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-ambiguous-'))
  const packDir = makePackDir(root)
  const profileOne = makeProfileDir(root, 'profile-one')
  const dshHome = join(root, 'dsh-home')
  const profileTwo = makeProfileDir(join(dshHome, 'profiles'), 'web')
  const binDir = makePnpmStub(root)

  const result = runInstaller({
    packDir,
    env: {
      PATH: withPrependedPath(binDir),
      DSH_PROFILE_DIR: profileOne,
      DSH_HOME: dshHome,
    },
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Multiple valid profile directories were found/u)
  assert.match(result.stderr, new RegExp(profileOne.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  assert.match(result.stderr, new RegExp(profileTwo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
})

test('fails before writing when pnpm is unavailable', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-no-pnpm-'))
  const packDir = makePackDir(root)
  const profileDir = makeProfileDir(root)
  const before = readFileSync(join(profileDir, 'package.json'), 'utf8')

  const result = runInstaller({
    packDir,
    args: ['--profile', profileDir],
    env: { PATH: '' },
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /pnpm was not found in PATH/u)
  assert.equal(readFileSync(join(profileDir, 'package.json'), 'utf8'), before)
  const backups = readdirSync(profileDir).filter((entry) => entry.startsWith('package.json.bak-'))
  assert.deepEqual(backups, [])
})

test('fails clearly in non-interactive mode when no valid profile is discoverable', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-no-profile-'))
  const packDir = makePackDir(root)
  const binDir = makePnpmStub(root)

  const result = runInstaller({
    packDir,
    env: { PATH: withPrependedPath(binDir) },
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Could not determine a valid DSH Web profile directory/u)
})

test('restores profile package.json when pnpm install fails', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-rollback-'))
  const packDir = makePackDir(root)
  const profileDir = makeProfileDir(root)
  const before = readFileSync(join(profileDir, 'package.json'), 'utf8')
  const binDir = makePnpmStub(root)

  const result = runInstaller({
    packDir,
    args: ['--profile', profileDir],
    env: { PATH: withPrependedPath(binDir), PNPM_SHOULD_FAIL: '1' },
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /package\.json was restored from backup/u)
  assert.match(result.stderr, /lockfile\/node_modules may still contain partial changes/u)
  assert.equal(readFileSync(join(profileDir, 'package.json'), 'utf8'), before)
  assert.ok(existsSync(profileDir))
  assert.ok(readdirSync(profileDir).some((entry) => entry.startsWith('package.json.bak-')))
})

test('refuses to run when required runtime files are missing from the pack', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-pack-missing-'))
  const packDir = makePackDir(root)
  const missingFile = join(packDir, 'client.js')
  unlinkSync(missingFile)
  const profileDir = makeProfileDir(root)
  const binDir = makePnpmStub(root)

  const result = runInstaller({
    packDir,
    args: ['--profile', profileDir],
    env: { PATH: withPrependedPath(binDir) },
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Required runtime file is missing/u)
})

test('toLinkPath converts Windows drive and UNC paths', () => {
  assert.equal(toLinkPath(String.raw`C:\Program Files\DSH\pack 日本語`), 'C:/Program Files/DSH/pack 日本語')
  assert.equal(toLinkPath(String.raw`\\server\share\pack`), '//server/share/pack')
})

test('installer handles metacharacters in profile and pack paths without shell injection', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-metachar-'))
  const packDir = makePackDir(root, 'pack & shell 日本語')
  const profileDir = makeProfileDir(root, 'profile & shell 日本語')
  const marker = join(root, 'pnpm.log')
  const binDir = makePnpmStub(root)

  const result = runInstaller({
    packDir,
    args: ['--profile', profileDir],
    env: { PATH: withPrependedPath(binDir), PNPM_MARKER: marker },
  })

  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`)
  const manifest = readManifest(profileDir)
  assert.equal(manifest.dependencies['@local/dsh-locale-ja'], `link:${toLinkPath(packDir)}`)
  const calls = readFileSync(marker, 'utf8').trim().split('\n').filter(Boolean)
  assert.equal(calls.filter((line) => line.endsWith('|install')).length, 1)
})

test('direct CLI invocation guard matches normalized path casing and separators on Windows', () => {
  const scriptPath = fileURLToPath(new URL('../install.mjs', import.meta.url))
  if (process.platform === 'win32') {
    const variant = scriptPath.replaceAll('\\', '/').toUpperCase()
    assert.equal(isDirectCliInvocation(variant), true)
    return
  }
  assert.equal(isDirectCliInvocation(scriptPath), true)
})

test('Windows pnpm.cmd shim resolves to JavaScript entry and runs via node', () => {
  if (process.platform !== 'win32') return
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-win-shim-'))
  const packDir = makePackDir(root, 'pack with spaces 日本語')
  const profileDir = makeProfileDir(root)
  const marker = join(root, 'pnpm-win.log')
  const shimDir = makeWindowsPnpmShim(root, '../node_modules/pnpm/bin/pnpm.cjs')
  const result = runInstaller({
    packDir,
    args: ['--profile', profileDir],
    env: { PATH: withPrependedPath(shimDir), PNPM_MARKER: marker },
  })
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`)
  const calls = readFileSync(marker, 'utf8').trim().split('\n').filter(Boolean)
  assert.deepEqual(calls, ['--version', 'install'])
})

test('Windows Corepack-style pnpm.cmd shim resolves correctly', () => {
  if (process.platform !== 'win32') return
  const root = mkdtempSync(join(tmpdir(), 'dsh-installer-win-corepack-'))
  const packDir = makePackDir(root)
  const profileDir = makeProfileDir(root)
  const marker = join(root, 'pnpm-corepack.log')
  const shimDir = makeWindowsPnpmShim(root, '../node_modules/corepack/dist/pnpm.js')
  const result = runInstaller({
    packDir,
    args: ['--profile', profileDir],
    env: { PATH: withPrependedPath(shimDir), PNPM_MARKER: marker },
  })
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`)
  const calls = readFileSync(marker, 'utf8').trim().split('\n').filter(Boolean)
  assert.deepEqual(calls, ['--version', 'install'])
})
