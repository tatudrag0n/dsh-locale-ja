/**
 * A tiny reader for the plain literals a DSH client bundle spells its locale
 * dictionaries with: object literals of string keys and string values, with
 * `zh`/`en` bound to module-level `const`s and occasionally inlined.
 *
 * A full parser is dead weight for that shape and evaluating the bundle is out
 * of the question, so this reads exactly the syntax a dictionary can contain
 * and reports anything else instead of guessing.
 *
 * @module tools/literal
 */

const IDENT_START = /[A-Za-z_$]/u
const IDENT_PART = /[A-Za-z0-9_$]/u

/** Skip whitespace and comments starting at `i`; return the next code index. */
export function skipTrivia(text, i) {
  for (;;) {
    const ch = text[i]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1
      continue
    }
    if (ch === '/' && text[i + 1] === '/') {
      const end = text.indexOf('\n', i)
      i = end === -1 ? text.length : end + 1
      continue
    }
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
      continue
    }
    return i
  }
}

/**
 * Read a quoted string starting at `i`.
 * @returns `{ value, end }` with `end` just past the closing quote, or null when
 * the character is not a quoting character or a template interpolates.
 */
export function readString(text, i) {
  const quote = text[i]
  if (quote !== "'" && quote !== '"' && quote !== '`') return null
  let out = ''
  let j = i + 1
  while (j < text.length) {
    const ch = text[j]
    if (ch === '\\') {
      const next = text[j + 1]
      if (next === 'n') out += '\n'
      else if (next === 't') out += '\t'
      else if (next === 'r') out += '\r'
      else out += next
      j += 2
      continue
    }
    if (ch === quote) return { value: out, end: j + 1 }
    if (quote === '`' && ch === '$' && text[j + 1] === '{') return null
    out += ch
    j += 1
  }
  return null
}

/** Read an identifier starting at `i`, or null. */
export function readIdentifier(text, i) {
  if (!IDENT_START.test(text[i] ?? '')) return null
  let j = i
  while (j < text.length && IDENT_PART.test(text[j])) j += 1
  return { value: text.slice(i, j), end: j }
}

/** Index just past the bracket opened at `i`. */
export function matchBracket(text, i) {
  const open = text[i]
  const close = open === '{' ? '}' : open === '(' ? ')' : open === '[' ? ']' : null
  if (close === null) throw new Error(`not a bracket at ${String(i)}: ${String(open)}`)
  let depth = 0
  let j = i
  while (j < text.length) {
    const ch = text[j]
    if (ch === "'" || ch === '"' || ch === '`') {
      const s = readString(text, j)
      if (s !== null) {
        j = s.end
        continue
      }
      /* A template with interpolation: skip to its closing backtick. */
      const end = text.indexOf('`', j + 1)
      j = end === -1 ? text.length : end + 1
      continue
    }
    if (ch === '/' && (text[j + 1] === '/' || text[j + 1] === '*')) {
      j = skipTrivia(text, j)
      continue
    }
    if (ch === open) depth += 1
    else if (ch === close) {
      depth -= 1
      if (depth === 0) return j + 1
    }
    j += 1
  }
  throw new Error(`unbalanced ${open} at ${String(i)}`)
}

/**
 * Parse an object literal.
 *
 * Each entry keeps both readings of its value: the decoded string when the
 * value is a string literal, and the raw source text otherwise, so a caller can
 * follow an identifier, descend into a nested literal, or reject the entry.
 * `{ zh, en }` shorthand records the property name as the raw value.
 *
 * @returns `{ entries: Map<string, { raw: string, string: string|null }>, end }`.
 */
export function parseObjectLiteral(text, start) {
  const entries = new Map()
  let i = skipTrivia(text, start)
  if (text[i] !== '{') throw new Error(`expected { at ${String(i)}`)
  i = skipTrivia(text, i + 1)
  if (text[i] === '}') return { entries, end: i + 1 }
  for (;;) {
    i = skipTrivia(text, i)
    /* A spread merges another dictionary and contributes no key of its own. */
    if (text.startsWith('...', i)) {
      i = skipTrivia(text, skipValue(text, i + 3))
      if (text[i] === ',') {
        i = skipTrivia(text, i + 1)
        if (text[i] === '}') return { entries, end: i + 1 }
        continue
      }
      if (text[i] === '}') return { entries, end: i + 1 }
      throw new Error(`unexpected ${String(text[i])} after a spread at ${String(i)}`)
    }
    let key
    const quoted = readString(text, i)
    if (quoted !== null) {
      key = quoted.value
      i = skipTrivia(text, quoted.end)
    } else {
      const ident = readIdentifier(text, i)
      if (ident !== null) {
        key = ident.value
        i = skipTrivia(text, ident.end)
      } else {
        const colon = text.indexOf(':', i)
        if (colon === -1) throw new Error(`expected a key at ${String(i)}`)
        key = text.slice(i, colon).trim()
        i = skipTrivia(colon)
      }
    }
    if (text[i] !== ':') {
      /* Shorthand property: `{ zh, en }` binds the name to an outer binding. */
      entries.set(key, { raw: key, string: null })
    } else {
      i = skipTrivia(text, i + 1)
      const value = readString(text, i)
      if (value !== null) {
        entries.set(key, { raw: text.slice(i, value.end), string: value.value })
        i = value.end
      } else {
        const valueStart = i
        i = skipValue(text, i)
        entries.set(key, { raw: text.slice(valueStart, i).trim(), string: null })
      }
    }
    i = skipTrivia(text, i)
    if (text[i] === ',') {
      i = skipTrivia(text, i + 1)
      if (text[i] === '}') return { entries, end: i + 1 }
      continue
    }
    if (text[i] === '}') return { entries, end: i + 1 }
    throw new Error(`unexpected ${String(text[i])} in an object literal at ${String(i)} :: ${text.slice(Math.max(0, i - 120), i + 40).replace(/\s+/gu, ' ')}`)
  }
}

/** Index of the first character after a non-string value beginning at `i`. */
function skipValue(text, i) {
  let depth = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      const s = readString(text, i)
      i = s === null ? i + 1 : s.end
      continue
    }
    if (ch === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) {
      i = skipTrivia(text, i)
      continue
    }
    if (ch === '{' || ch === '(' || ch === '[') depth += 1
    else if (ch === '}' || ch === ')' || ch === ']') {
      if (depth === 0) return i
      depth -= 1
    } else if (ch === ',' && depth === 0) return i
    i += 1
  }
  return i
}

/** Split a call's argument text on top-level commas. */
export function splitArguments(text) {
  const parts = []
  let depth = 0
  let start = 0
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      const s = readString(text, i)
      i = s === null ? i + 1 : s.end
      continue
    }
    if (ch === '{' || ch === '(' || ch === '[') depth += 1
    else if (ch === '}' || ch === ')' || ch === ']') depth -= 1
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
    i += 1
  }
  parts.push(text.slice(start))
  return parts.map((part) => part.trim()).filter((part) => part !== '')
}

/** Resolve a `const NAME = <literal>` declaration into its parsed value. */
export function resolveDeclaration(text, name) {
  const escaped = name.replace(/\$/gu, '\\$')
  const re = new RegExp(`(?:const|let|var)\\s+${escaped}\\s*=\\s*`, 'gu')
  for (const match of text.matchAll(re)) {
    const at = skipTrivia(text, match.index + match[0].length)
    if (text[at] === '{') return { kind: 'object', entries: parseObjectLiteral(text, at).entries }
    const str = readString(text, at)
    if (str !== null) return { kind: 'string', value: str.value }
  }
  return null
}

/**
 * Resolve one argument expression, following a single identifier reference.
 * @returns `{kind:'string',value}` | `{kind:'object',entries}` | null.
 */
export function resolveArgument(text, expr, scope = text) {
  const trimmed = expr.trim()
  const outer = readString(trimmed, 0)
  if (outer !== null && outer.end === trimmed.length) return { kind: 'string', value: outer.value }
  if (trimmed.startsWith('{')) return { kind: 'object', entries: parseObjectLiteral(trimmed, 0).entries }
  const ident = readIdentifier(trimmed, 0)
  if (ident !== null && ident.end === trimmed.length) {
    const resolved = resolveDeclaration(scope, ident.value)
    if (resolved !== null) return resolved
    /* One hop through a re-exported alias, e.g. `const NS = OTHER_NS`. */
    return null
  }
  return null
}
