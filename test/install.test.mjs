import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { toLinkPath } from '../install.mjs'

const NAME = '@local/dsh-locale-ja'
const source = fileURLToPath(new URL('../install.mjs', import.meta.url))
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-install-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const pack = join(root, 'pack 日本語 & spaces')
  const profile = join(root, 'profile 日本語 & spaces')
  const bin = join(root, 'bin 日本語 & spaces')
  for (const directory of [pack, profile, bin]) mkdirSync(directory)
  copyFileSync(source, join(pack, 'install.mjs'))
  writeFileSync(join(pack, 'package.json'), JSON.stringify({ name: NAME }))
  for (const file of ['index.js', 'client.js', 'cordis.patch.yml']) writeFileSync(join(pack, file), '')
  const manifest = { dependencies: { keep: '1' }, scripts: { keep: 'echo keep' }, dsh: { profile: { bundles: ['keep'] } } }
  const pathname = join(profile, 'package.json')
  const original = JSON.stringify(manifest)
  writeFileSync(pathname, original)
  writeFileSync(join(bin, 'pnpm-stub.cjs'), `const fs=require('node:fs'); if(process.env.PNPM_MARKER) fs.appendFileSync(process.env.PNPM_MARKER,JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2)})+'\\n'); if(process.argv[2]==='--version') console.log('10.0.0'); else if(process.env.PNPM_SHOULD_FAIL==='1') process.exit(7);`)
  if (process.platform === 'win32') {
    writeFileSync(join(bin, 'pnpm.cmd'), '@echo off\r\n"%DSH_TEST_NODE%" "%~dp0pnpm-stub.cjs" %*\r\n')
  } else {
    writeFileSync(join(bin, 'pnpm'), '#!/bin/sh\nexec "$DSH_TEST_NODE" "$(dirname "$0")/pnpm-stub.cjs" "$@"\n')
    chmodSync(join(bin, 'pnpm'), 0o755)
  }
  const env = { ...process.env }
  for (const key of Object.keys(env)) if (['path', 'dsh_home', 'dsh_profile_dir', 'pnpm_marker', 'pnpm_should_fail', 'node_options'].includes(key.toLowerCase())) delete env[key]
  env.PATH = [bin, dirname(process.execPath), ...(process.platform === 'win32' ? [join(process.env.SystemRoot, 'System32')] : ['/usr/bin', '/bin'])].join(delimiter)
  env.DSH_TEST_NODE = process.execPath
  env.PNPM_MARKER = join(root, 'pnpm.log')
  const run = (extra = {}, argv = ['--profile', profile]) => spawnSync(process.execPath, [join(pack, 'install.mjs'), ...argv], { cwd: pack, env: { ...env, ...extra }, encoding: 'utf8', timeout: 20000 })
  return { root, pack, profile, bin, pathname, original, env, run, read: () => JSON.parse(readFileSync(pathname, 'utf8')) }
}
test('normalizes individual Windows separators and preserves UNC prefix', () => {
  assert.equal(toLinkPath('C:\\Users\\日本語 folder\\pack'), 'C:/Users/日本語 folder/pack')
  assert.equal(toLinkPath('\\\\server\\share\\pack'), '//server/share/pack')
  assert.equal(toLinkPath('/home/user/pack'), '/home/user/pack')
})
test('CLI installs from paths containing spaces, Unicode and ampersands; repeats safely', t => {
  const f = fixture(t)
  for (let i = 0; i < 2; i++) {
    const result = f.run()
    assert.equal(result.status, 0, result.stderr + result.stdout)
    assert.match(result.stdout, /Restart DSH/)
    assert.equal(f.read().dependencies[NAME], `link:${f.pack.replaceAll('\\', '/')}`)
    assert.equal(f.read().dependencies.keep, '1')
    assert.equal(f.read().scripts.keep, 'echo keep')
    assert.deepEqual(f.read().dsh.profile.bundles, ['keep', NAME])
  }
  assert.equal(readdirSync(f.profile).filter(x => x.startsWith('package.json.bak-')).length, 2)
  const calls = readFileSync(f.env.PNPM_MARKER, 'utf8').trim().split('\n').map(JSON.parse).filter(x => x.args[0] === 'install')
  assert.equal(calls.length, 2)
  assert.ok(calls.every(x => x.cwd === f.profile))
})
test('failure restores original manifest and reports partial side effects', t => {
  const f = fixture(t)
  const result = f.run({ PNPM_SHOULD_FAIL: '1' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /restored from backup/)
  assert.match(result.stderr, /lockfile\/node_modules/)
  assert.equal(readFileSync(f.pathname, 'utf8'), f.original)
})
test('missing pnpm leaves manifest and backup directory untouched', t => {
  const f = fixture(t)
  const result = f.run({ PATH: '' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /pnpm was not found/)
  assert.equal(readFileSync(f.pathname, 'utf8'), f.original)
  assert.deepEqual(readdirSync(f.profile), ['package.json'])
})
test('invalid profile rejected before executing pnpm', t => {
  const f = fixture(t)
  writeFileSync(f.pathname, JSON.stringify({ dsh: { profile: {} } }))
  const result = f.run()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /missing dsh.profile.bundles/)
  assert.equal(existsSync(f.env.PNPM_MARKER), false)
})
test('missing runtime file rejected', t => {
  const f = fixture(t)
  unlinkSync(join(f.pack, 'client.js'))
  const result = f.run()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Required runtime file is missing/)
  assert.equal(readFileSync(f.pathname, 'utf8'), f.original)
})
test('environment profile works and no-profile noninteractive call fails', t => {
  const f = fixture(t)
  assert.notEqual(f.run({}, []).status, 0)
  const result = f.run({ DSH_PROFILE_DIR: f.profile }, [])
  assert.equal(result.status, 0, result.stderr)
})
test('conflicting environment profiles are rejected without writes', t => {
  const f = fixture(t)
  const home = join(f.root, 'home')
  mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
  writeFileSync(join(home, 'profiles', 'web', 'package.json'), f.original)
  const result = f.run({ DSH_PROFILE_DIR: f.profile, DSH_HOME: home }, [])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Multiple valid profile/)
  assert.equal(readFileSync(f.pathname, 'utf8'), f.original)
})
