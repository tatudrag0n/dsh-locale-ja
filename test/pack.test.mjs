/**
 * The pack is an artifact plus data: `client.js` is generated from
 * `client.src.js` and `dictionaries/*.json`, and the browser sees only
 * `client.js`. These tests read the artifact the way the client module system
 * does — register the factory, build it, apply it to a stub context — and then
 * assert the registrations it makes and the data those registrations carry.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderBundle } from '../tools/build.mjs'
import { auditNamespace, loadDictionaries, placeholders } from '../tools/check.mjs'

const artifactUrl = new URL('../client.js', import.meta.url)
const artifact = readFileSync(artifactUrl, 'utf8')

/**
 * Execute the artifact against a stub module loader.
 * @returns the registered entry.
 */
function loadEntry() {
  let entry
  const window = { __ModuleLoader__: { load: (value) => { entry = value } } }
  // eslint-disable-next-line no-new-func
  new Function('window', artifact)(window)
  assert.ok(entry !== undefined, 'client.js did not call __ModuleLoader__.load')
  return entry
}

/**
 * Apply the built plugin to a stub client context and record the calls it makes.
 * @returns the recorded registrations.
 */
function applyPlugin() {
  const entry = loadEntry()
  const plugin = entry.factory()
  const languages = []
  const dictionaries = []
  const labels = []
  const ctx = {
    effect: (fn, label) => { labels.push(label); return fn() },
    locale: {
      addLanguage: (input) => { languages.push(input); return () => {} },
      register: (namespace, locale, dict) => { dictionaries.push({ namespace, locale, dict }); return () => {} },
    },
  }
  plugin.apply(ctx)
  return { entry, plugin, languages, dictionaries, labels }
}

test('registers the language the settings selector lists', () => {
  const { plugin, languages } = applyPlugin()
  assert.deepEqual(plugin.inject, ['locale'])
  assert.deepEqual(languages, [{ id: 'ja', label: '日本語', fallback: 'en' }])
})

test('registers one Japanese dictionary per translated namespace', () => {
  const records = loadDictionaries()
  const translated = [...records.values()].filter((record) => Object.keys(record.ja ?? {}).length > 0)
  const { dictionaries } = applyPlugin()
  assert.equal(dictionaries.length, translated.length)
  assert.ok(dictionaries.length > 40, `expected dictionaries for most namespaces, got ${String(dictionaries.length)}`)
  for (const registration of dictionaries) assert.equal(registration.locale, 'ja')
})

test('carries copy the UI actually renders, not just keys', () => {
  const { dictionaries } = applyPlugin()
  const common = dictionaries.find((entry) => entry.namespace === 'common')
  assert.ok(common !== undefined, 'no common dictionary was registered')
  const settings = dictionaries.find((entry) => entry.namespace === 'settings.locale')
  assert.ok(settings !== undefined, 'the Language row namespace is not registered')
  const title = settings.dict['language.title']
  assert.equal(typeof title, 'string')
  assert.notEqual(title, 'Language', 'the Language row title is still English')
  const translated = Object.values(common.dict)
  assert.ok(translated.some((value) => /[\u3040-\u30ff\u4e00-\u9fff]/u.test(value)), 'the common dictionary has no Japanese text')
  assert.ok(dictionaries.some((entry) => entry.dict !== undefined && Object.keys(entry.dict).length > 100), 'no large dictionary was registered')
})

test('every locale registration is disposed by the effect that owns it', () => {
  const { labels, dictionaries } = applyPlugin()
  assert.equal(labels.length, dictionaries.length + 1)
  assert.equal(new Set(labels).size, labels.length, 'two effects share a label, so one hides the other on dispose')
})

test('the artifact is current with its sources', () => {
  assert.equal(artifact, renderBundle(), 'client.js is stale: run `node tools/build.mjs`')
})

test('every authored translation survives the dictionary audit', () => {
  const failures = []
  for (const [namespace, record] of loadDictionaries()) {
    for (const defect of auditNamespace(record).defects) {
      failures.push(`${namespace}/${defect.key}: ${defect.kind} — ${defect.detail}`)
    }
  }
  assert.deepEqual(failures, [])
})

test('the pack translates the whole extracted key set', () => {
  const gaps = []
  for (const [namespace, record] of loadDictionaries()) {
    for (const key of Object.keys(record.keys)) {
      if (typeof record.ja?.[key] !== 'string') gaps.push(`${namespace}/${key}`)
    }
  }
  assert.deepEqual(gaps, [])
})

test('placeholders the UI interpolates survive translation', () => {
  for (const [namespace, record] of loadDictionaries()) {
    for (const [key, source] of Object.entries(record.keys)) {
      const value = record.ja?.[key]
      if (typeof source !== 'string' || typeof value !== 'string') continue
      assert.deepEqual(placeholders(value), placeholders(source), `${namespace}/${key}`)
    }
  }
})
