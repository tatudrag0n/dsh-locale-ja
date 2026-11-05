/**
 * The literal reader is the only parsing in this project, and every dictionary
 * in the pack depends on it: a shape it silently mis-reads becomes wrong copy
 * in the UI rather than a build failure. These cases pin the shapes the shipped
 * bundles actually use.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchBracket, parseObjectLiteral, readString, resolveArgument, splitArguments } from '../tools/literal.mjs'

test('reads plain, quoted, and escaped strings', () => {
  assert.deepEqual(readString(`'cancel'`, 0), { value: 'cancel', end: 8 })
  assert.deepEqual(readString(`"it's"`, 0), { value: "it's", end: 6 })
  assert.deepEqual(readString(`'a\\'b'`, 0), { value: "a'b", end: 6 })
  assert.deepEqual(readString(`'line\\nnext'`, 0), { value: 'line\nnext', end: 12 })
  assert.equal(readString('name', 0), null)
})

test('rejects an interpolated template rather than reading half of it', () => {
  assert.equal(readString('`${x} ms`', 0), null)
})

test('finds the bracket that closes the one it is given', () => {
  const text = `register(ns, { a: '}', b: { c: ')' } })`
  const open = text.indexOf('(')
  assert.equal(matchBracket(text, open), text.length)
})

test('splits call arguments on top-level commas only', () => {
  assert.deepEqual(splitArguments(`NS, { zh, en }`), ['NS', '{ zh, en }'])
  assert.deepEqual(splitArguments(`a, [1, 2], c`), ['a', '[1, 2]', 'c'])
  assert.deepEqual(splitArguments(`'x,y', z`), [`'x,y'`, 'z'])
})

test('records string values, shorthand properties, and spreads', () => {
  const text = `{ ...base, alpha: 'one', "beta.key": "two", gamma, delta: { nested: 'x' }, }`
  const { entries, end } = parseObjectLiteral(text, 0)
  assert.equal(end, text.length)
  assert.deepEqual(entries.get('alpha'), { raw: `'one'`, string: 'one' })
  assert.deepEqual(entries.get('beta.key'), { raw: `"two"`, string: 'two' })
  assert.deepEqual(entries.get('gamma'), { raw: 'gamma', string: null })
  assert.equal(entries.has('base'), false)
  assert.equal(entries.get('delta').string, null)
  assert.equal(entries.get('delta').raw, `{ nested: 'x' }`)
})

test('a brace inside a string does not end the literal', () => {
  const text = `{ a: 'ends } here', b: 'x' }`
  const { entries } = parseObjectLiteral(text, 0)
  assert.equal(entries.get('a').string, 'ends } here')
  assert.equal(entries.get('b').string, 'x')
})

test('resolves an identifier to its const literal, placeholders intact', () => {
  const text = [
    `const NS = 'chat';`,
    `const en = { 'chat.send': 'Send {count} message(s)', 'chat.stop': 'Stop' };`,
  ].join('\n')
  const ns = resolveArgument(text, 'NS')
  assert.deepEqual(ns, { kind: 'string', value: 'chat' })
  const dict = resolveArgument(text, 'en')
  assert.equal(dict.kind, 'object')
  assert.equal(dict.entries.get('chat.send').string, 'Send {count} message(s)')
})

test("resolves a dollar-suffixed binding name, which minified output uses", () => {
  const text = `const zh$1 = { a: '甲' };\nconst en$1 = { a: 'A' };`
  assert.equal(resolveArgument(text, 'en$1').entries.get('a').string, 'A')
})
