/**
 * A model is auto-imported because the script queries it, never because a
 * name the script binds itself happens to call `.get(`.
 *
 * The declaration scan was a regex over `const|let|var NAME`, which sees the
 * first declarator of a list and no other. Minified code declares in lists,
 * and @stacksjs/mobile's image cache came out of the phone build as
 *
 *   …},J=new Map,je=new Map;function qt(e,t){…}  …  let i=J.get(n)
 *
 * so `J.get(n)` read as a model query (`Trail.get(…)`), `J` was destructured
 * from window.StacksBrowser, and every phone page logged that the client
 * runtime does not provide "J".
 */
import { describe, expect, it } from 'bun:test'
import { declaredNames } from '../src/client-parameter-bindings'
import { generateBrowserAutoImportDestructuring, injectBrowserCoreAutoImports, transformAutoImports } from '../src/client-script'

const browserImportsFor = (code: string): string[] => transformAutoImports(code).browserImports

// The shape the phone build produced, trimmed.
const MINIFIED_MOBILE = 'var bi=0,Fr=new Map;let Xe={},J=new Map,je=new Map;function qt(e,t){return`${e}|${t.pointSize}`}'
  + 'const Ze={image:(e,t={})=>{let n=qt(e,t),i=J.get(n);if(i)return i;return J.set(n,1),je.get(n)},clearCache:()=>{J.clear(),je.clear()}};'
  + 'function Ke(s){var u=Fr.get(s);if(!u)Fr.set(s,1);return u}'

describe('model auto-import ignores names the script declares', () => {
  it('ignores a minified local declared after the first declarator of a list', () => {
    const imports = browserImportsFor(MINIFIED_MOBILE)
    expect(imports).not.toContain('J')
    expect(imports).not.toContain('Fr')
    expect(imports).toEqual([])
  })

  it('emits no auto-import guard for the minified locals', () => {
    const prelude = generateBrowserAutoImportDestructuring(MINIFIED_MOBILE)
    expect(prelude).not.toContain('typeof J')
    expect(prelude).toBe('')
  })

  it('does not inject a model import for them before bundling either', () => {
    expect(injectBrowserCoreAutoImports(MINIFIED_MOBILE).models).toEqual([])
  })

  it('ignores a later declarator on its own line', () => {
    const code = 'const limit = 10,\n  Cache = new Map()\nexport function read(k) { return Cache.get(k) }'
    expect(browserImportsFor(code)).not.toContain('Cache')
  })

  it('ignores a binding destructured inside a list', () => {
    expect(browserImportsFor('var a = 1, { Store: Cache } = deps\nCache.get(1)')).not.toContain('Cache')
  })

  it('ignores a parameter of the function that queries it', () => {
    expect(browserImportsFor('const read = (Cache, key) => Cache.get(key)')).not.toContain('Cache')
    expect(browserImportsFor('function read(Cache) { return Cache.find(1) }')).not.toContain('Cache')
  })

  it('never takes a one- or two-character name for a model', () => {
    // Undeclared here (bundled from elsewhere), still a minifier's name.
    expect(browserImportsFor('let i = J.get(n), o = Ft.find(1)')).toEqual([])
  })

  it('ignores a query written in a comment or a string', () => {
    expect(browserImportsFor('// Trail.all() loads them\nconst label = "Trail.find(1)"')).toEqual([])
  })

  it('still detects a real model query', () => {
    expect(browserImportsFor('const trails = await Trail.all()')).toEqual(['Trail'])
    expect(browserImportsFor('let page = 1, first = Trail.find(1)')).toEqual(['Trail'])
    expect(browserImportsFor('function load() { return Activity.where("type", "run").get() }')).toEqual(['Activity'])
    expect(browserImportsFor('let a = 1\nTag.all()')).toEqual(['Tag'])
  })

  it('still detects a model named in a typed declaration list', () => {
    const code = 'const byId: Map<string, Trail> = new Map(), all = Trail.all()'
    expect(browserImportsFor(code)).toEqual(['Trail'])
  })

  it('still injects a real model before bundling', () => {
    expect(injectBrowserCoreAutoImports('const trails = await Trail.all()').models).toEqual(['Trail'])
  })
})

describe('declaredNames', () => {
  it('reads every declarator of a list', () => {
    expect([...declaredNames('var bi=0,Fr=new Map,{a,b:c}=x,[d,...e]=y')].sort()).toEqual(['Fr', 'a', 'bi', 'c', 'd', 'e'])
  })

  it('reads past a function or class expression in the list', () => {
    expect([...declaredNames('var a=function(){return 1},Cache=new Map,K=class{},m=import("x")')].sort()).toEqual(['Cache', 'K', 'a', 'm'])
  })

  it('does not take an initialiser for a declarator', () => {
    const names = declaredNames('const a = f(x, y), b = { k: v, w }, c = cond ? p : q, d = (m, n) => m')
    expect([...names].sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('stops at the end of the statement', () => {
    expect([...declaredNames('let a = 1\nfoo(x, y)\nfor (const k of list) use(k, z)')].sort()).toEqual(['a', 'k'])
  })

  it('splits a typed list on its own commas only', () => {
    expect([...declaredNames('const m: Map<string, Trail> = new Map(), n = 1')].sort()).toEqual(['m', 'n'])
  })

  it('reads function, class and default or namespace import names', () => {
    const code = 'import Def from "a"\nimport * as Ns from "b"\nfunction* gen() {}\nclass Box extends Base {}\nconst x = [1] as const'
    expect([...declaredNames(code)].sort()).toEqual(['Box', 'Def', 'Ns', 'gen', 'x'])
  })

  it('ignores keywords used as property names', () => {
    expect([...declaredNames('const o = { let: 1, class: 2 }; o.var(Trail)')]).toEqual(['o'])
  })
})

describe('declaredNames after a string initialiser', () => {
  it('ends the list at the next statement', () => {
    expect([...declaredNames('const a = "x y"\nexport { b, c }\nlet d = 1')].sort()).toEqual(['a', 'd'])
  })
})
