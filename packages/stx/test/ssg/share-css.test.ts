/**
 * The generated stylesheet split into one shared sheet and a small one per page
 * (stacksjs/stx#2230), without changing which rule wins anywhere.
 */
import { describe, expect, it } from 'bun:test'
import { planSharedCss, propertyFamilies, sharedThreshold, splitTopLevelCss } from '../../src/build-share-css'

describe('splitTopLevelCss', () => {
  it('reads rules, at-rule blocks and statements in order, with nested braces and strings', () => {
    const css = `@layer a, b;\n:root { --x: "}"; }\n/* note */\n.p-4 { padding: 1rem; }\n@media (min-width: 768px) { .md\\:p-8 { padding: 2rem; } }\n.c::before { content: '{'; }`
    expect(splitTopLevelCss(css)).toEqual([
      '@layer a, b;',
      ':root { --x: "}"; }',
      '/* note */\n.p-4 { padding: 1rem; }',
      '@media (min-width: 768px) { .md\\:p-8 { padding: 2rem; } }',
      `.c::before { content: '{'; }`,
    ])
  })
})

describe('propertyFamilies', () => {
  it('puts a shorthand with its longhands', () => {
    expect([...propertyFamilies('.px-2 { padding-left: .5rem; padding-right: .5rem; }')]).toEqual(['padding'])
    expect([...propertyFamilies('.inset-0 { inset: 0; }')]).toEqual(['inset'])
    expect([...propertyFamilies('.top-0 { top: 0; }')]).toEqual(['inset'])
    expect([...propertyFamilies('.leading-6 { line-height: 1.5rem; }')]).toEqual(['font'])
    expect([...propertyFamilies('.gap-x-2 { column-gap: .5rem; }')]).toEqual(['gap'])
    expect([...propertyFamilies('.a { -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }')]).toEqual(['backdrop'])
  })

  it('keeps custom properties apart, reads inside media, and takes all as everything', () => {
    expect([...propertyFamilies('@media (min-width: 768px) { .md\\:x { --tw-x: 1; transform: translateX(var(--tw-x)); } }')]).toEqual(['--tw-x', 'transform'])
    expect([...propertyFamilies('.reset { all: unset; }')]).toEqual(['*'])
    expect([...propertyFamilies('@layer a, b;')]).toEqual([])
  })
})

describe('planSharedCss', () => {
  const base = ':root { --c: red; }'
  it('shares what enough pages carry and keeps the rest on the page', () => {
    const plan = planSharedCss([[base, '.flex { display: flex; }', '.a { color: red; }'], [base, '.flex { display: flex; }', '.b { margin: 0; }']], 2)!
    expect(plan.shared).toEqual([base, '.flex { display: flex; }'])
    expect(plan.pages).toEqual([['.a { color: red; }'], ['.b { margin: 0; }']])
  })

  it('repeats a shared rule after a page rule it competes with, and what competes with that', () => {
    const p4 = '.p-4 { padding: 1rem; }'
    const px = '.px-2 { padding-left: .5rem; }'
    const md = '@media (min-width: 768px) { .md\\:p-8 { padding: 2rem; } }'
    const color = '.text-red { color: red; }'
    const plan = planSharedCss([[base, p4, px, color, md], [base, px, color, md], [base, px, color, md]], 2)!
    expect(plan.shared).toEqual([base, px, color, md])
    // p-4 is the first page's own; px-2 and md:p-8 come after it and touch
    // padding, so they come after it again. text-red competes with nothing.
    expect(plan.pages[0]).toEqual([p4, px, md])
    expect(plan.pages[1]).toEqual([])
  })

  it('refuses what it cannot split safely', () => {
    expect(planSharedCss([[base]])).toBeNull()
    expect(planSharedCss([['@import url(x.css);', base], [base]], 2)).toBeNull()
    expect(planSharedCss([['.a{}', '.b{}'], ['.b{}', '.a{}']], 2), 'pages disagree on the order').toBeNull()
    expect(planSharedCss([['.a{}'], ['.b{}']], 2), 'nothing in common').toBeNull()
  })

  it('needs a rule on two pages, or on a quarter of a larger site', () => {
    expect(sharedThreshold(2)).toBe(2)
    expect(sharedThreshold(8)).toBe(2)
    expect(sharedThreshold(12)).toBe(3)
  })

  /*
   * The invariant, over random sites: on every page, any two rules that can
   * compete (they share a property family) end up with the later one in
   * canonical order last, counting the shared sheet first and the page's
   * after it, exactly as the browser applies them.
   */
  it('never changes which of two competing rules a page applies last', () => {
    const families = ['padding', 'color', 'display', 'margin', 'gap']
    let seed = 7
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
    for (let round = 0; round < 300; round++) {
      const canonical = Array.from({ length: 12 }, (_, i) => `.r${round}-${i} { ${families[Math.floor(random() * families.length)]}: ${i}; }`)
      const pages = Array.from({ length: 2 + Math.floor(random() * 5) }, () => canonical.filter(() => random() < 0.6))
      const plan = planSharedCss(pages, 2)
      if (!plan) continue
      pages.forEach((page, index) => {
        const applied = [...plan.shared, ...plan.pages[index]!]
        const lastAt = (rule: string) => applied.lastIndexOf(rule)
        for (let a = 0; a < page.length; a++) {
          for (let b = a + 1; b < page.length; b++) {
            const [x, y] = [page[a]!, page[b]!]
            const shared = [...propertyFamilies(x)].some(f => propertyFamilies(y).has(f))
            if (shared) expect(lastAt(x) < lastAt(y), `${x} before ${y}`).toBe(true)
          }
        }
        for (const rule of page) expect(applied).toContain(rule)
      })
    }
  })
})
