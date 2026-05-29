/**
 * Tests for reactive x-else / x-else-if chains (stacksjs/stx#1734).
 *
 * Two layers:
 *  1. Behavioral — extract the REAL chain-discovery functions
 *     (getElseAttrInfo, findIfChain) from the generated runtime and run
 *     them against happy-dom elements. This is where the subtle logic
 *     lives: sibling pairing across all three prefixes, terminal x-else
 *     handling, whitespace/comment tolerance, chain termination.
 *  2. Structural — confirm the runtime wires bindIfChain into the
 *     processElement dispatch and that the binder inherits the #1733
 *     retry-without-unwrap eval.
 *
 * Full DOM-level reactive behavior (insert/remove on signal change) isn't
 * unit-testable here because bindIfChain depends on effect /
 * createAutoUnwrapProxy / processElement / disposeSubtreeScopes — too many
 * runtime internals to extract — and processElement isn't exposed on
 * window.stx. The chain-discovery functions are the new, bug-prone surface;
 * the insert/remove machinery is shared with bindIf (already covered).
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

function extractFunction(src: string, name: string): string {
  const startIdx = src.indexOf(`function ${name}(`)
  if (startIdx === -1)
    throw new Error(`${name} not found in runtime`)
  let depth = 0
  let i = src.indexOf('{', startIdx)
  for (; i < src.length; i++) {
    if (src[i] === '{')
      depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0)
        return src.slice(startIdx, i + 1)
    }
  }
  throw new Error(`unbalanced braces extracting ${name}`)
}

interface ChainEntry { el: Element, attr: string, expr: string | null, terminal: boolean }

function buildChainFns() {
  const runtime = generateSignalsRuntimeDev()
  const getElseSrc = extractFunction(runtime, 'getElseAttrInfo')
  const findChainSrc = extractFunction(runtime, 'findIfChain')
  // findIfChain calls getElseAttrInfo — declare both in the same closure.
  // eslint-disable-next-line no-new-func
  const factory = new Function(`${getElseSrc}\n${findChainSrc}\n;return { getElseAttrInfo, findIfChain };`)
  return factory() as {
    getElseAttrInfo: (el: Element | null) => { name: string, terminal: boolean } | null
    findIfChain: (el: Element, ifAttr: string) => ChainEntry[]
  }
}

// Build a container from an HTML string and return the first element with
// the given if-attribute as the chain head.
function setup(html: string): { container: Element, head: Element } {
  const container = document.createElement('div')
  container.innerHTML = html
  const head = container.querySelector('[x-if],[\\:if],[\\@if]') as Element
  return { container, head }
}

describe('if/else chain discovery (#1734)', () => {
  const { getElseAttrInfo, findIfChain } = buildChainFns()

  describe('getElseAttrInfo', () => {
    it('detects x-else-if as non-terminal', () => {
      const el = document.createElement('div')
      el.setAttribute('x-else-if', 'a')
      expect(getElseAttrInfo(el)).toEqual({ name: 'x-else-if', terminal: false })
    })

    it('detects x-else as terminal', () => {
      const el = document.createElement('div')
      el.setAttribute('x-else', '')
      expect(getElseAttrInfo(el)).toEqual({ name: 'x-else', terminal: true })
    })

    it('detects the :else-if and :else prefix variants', () => {
      const a = document.createElement('div')
      a.setAttribute(':else-if', 'x')
      expect(getElseAttrInfo(a)).toEqual({ name: ':else-if', terminal: false })
      const b = document.createElement('div')
      b.setAttribute(':else', '')
      expect(getElseAttrInfo(b)).toEqual({ name: ':else', terminal: true })
    })

    it('returns null for an element with no else attribute', () => {
      const el = document.createElement('div')
      el.setAttribute('x-if', 'cond')
      expect(getElseAttrInfo(el)).toBeNull()
    })
  })

  describe('findIfChain', () => {
    it('returns a single-entry chain when there are no else siblings', () => {
      const { head } = setup(`<div x-if="a">A</div><p>unrelated</p>`)
      const chain = findIfChain(head, 'x-if')
      expect(chain).toHaveLength(1)
      expect(chain[0].attr).toBe('x-if')
      expect(chain[0].expr).toBe('a')
      expect(chain[0].terminal).toBe(false)
    })

    it('collects if + else-if + else into one chain', () => {
      const { head } = setup(
        `<div x-if="a">A</div><div x-else-if="b">B</div><div x-else>C</div>`,
      )
      const chain = findIfChain(head, 'x-if')
      expect(chain).toHaveLength(3)
      expect(chain.map(c => c.attr)).toEqual(['x-if', 'x-else-if', 'x-else'])
      expect(chain.map(c => c.expr)).toEqual(['a', 'b', null])
      expect(chain[2].terminal).toBe(true)
    })

    it('terminates the chain at the first non-else sibling', () => {
      const { head } = setup(
        `<div x-if="a">A</div><div x-else-if="b">B</div><p>stop</p><div x-else>nope</div>`,
      )
      const chain = findIfChain(head, 'x-if')
      // The <p> breaks the chain — the trailing x-else is NOT part of it.
      expect(chain).toHaveLength(2)
      expect(chain.map(c => c.attr)).toEqual(['x-if', 'x-else-if'])
    })

    it('stops at terminal x-else even if more else-if follow (spec violation)', () => {
      const { head } = setup(
        `<div x-if="a">A</div><div x-else>B</div><div x-else-if="c">C</div>`,
      )
      const chain = findIfChain(head, 'x-if')
      // x-else is terminal; the trailing x-else-if is left out of the chain.
      expect(chain).toHaveLength(2)
      expect(chain[1].terminal).toBe(true)
    })

    it('tolerates whitespace/text nodes between branches', () => {
      const { head } = setup(
        `<div x-if="a">A</div>\n  <div x-else-if="b">B</div>\n  <div x-else>C</div>`,
      )
      const chain = findIfChain(head, 'x-if')
      // nextElementSibling skips text nodes, so whitespace doesn't break it.
      expect(chain).toHaveLength(3)
    })

    it('works with the :if / :else-if / :else prefix triplet', () => {
      const container = document.createElement('div')
      container.innerHTML = `<div :if="a">A</div><div :else-if="b">B</div><div :else>C</div>`
      // happy-dom's querySelector chokes on the escaped `:` attribute
      // selector, so grab the first element child directly.
      const head = container.firstElementChild as Element
      expect(head.hasAttribute(':if')).toBe(true)
      const chain = findIfChain(head, ':if')
      expect(chain.map(c => c.attr)).toEqual([':if', ':else-if', ':else'])
    })
  })
})

describe('if/else chain runtime wiring (#1734)', () => {
  const runtime = generateSignalsRuntimeDev()

  it('defines the chain helpers and binder', () => {
    expect(runtime).toContain('function getElseAttrInfo(')
    expect(runtime).toContain('function findIfChain(')
    expect(runtime).toContain('function bindIfChain(')
  })

  it('dispatches to bindIfChain when the chain has more than one branch', () => {
    expect(runtime).toContain('if (ifChain.length > 1) bindIfChain(ifChain, scope)')
  })

  it('binder inherits the #1733 retry-without-unwrap eval, via with() for narrow subscription (#1738)', () => {
    // The chain's per-branch evaluator must retry without the unwrap proxy
    // so x-else-if="count() === 0" works on day one (#1733)...
    expect(runtime).toContain('var unwrapScope = createAutoUnwrapProxy(scope);')
    // ...and both passes evaluate via with(__scope__) so the effect subscribes
    // ONLY to the signals the branch references, not every signal in scope
    // (#1738). The proxy pass uses unwrapScope; the retry pass uses the raw
    // scope (call-syntax).
    expect(runtime).toContain('new Function(\'__scope__\', \'with(__scope__) { return \' + expression + \' }\')')
    expect(runtime).toContain('return fn2(scope);')
  })

  it('skips detached chain members in processElement (parent snapshot guard)', () => {
    expect(runtime).toContain('if (el.__stx_chain_member && !el.isConnected) return;')
  })

  it('warns + strips an orphan else with no preceding if', () => {
    expect(runtime).toContain('has no matching preceding x-if/:if/@if sibling')
  })
})
