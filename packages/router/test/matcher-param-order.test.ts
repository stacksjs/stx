import { describe, expect, it } from 'bun:test'
import { matchRoute, patternToRegex } from '../src/matcher'

/**
 * Parameter names must line up with the capture groups they came from.
 *
 * The regression: the compiler made three passes - optional, then catch-all,
 * then required - pushing names in *sweep* order while the groups ended up in
 * *pattern* order. Any pattern mixing kinds bound every value to the wrong
 * name, and nothing errored: the regex still matched and the page still
 * rendered, just with `repository` holding the branch and `ref` holding the
 * path. That reads as a routing mystery rather than an off-by-one.
 */
function route(pattern: string) {
  const { regex, params } = patternToRegex(pattern)
  return { pattern, regex, params }
}

describe('patternToRegex parameter order', () => {
  it('orders a catch-all last when it appears last', () => {
    expect(patternToRegex('/:owner/:repository/tree/:ref/:path*').params)
      .toEqual(['owner', 'repository', 'ref', 'path'])
  })

  it('orders an optional by position, not by kind', () => {
    expect(patternToRegex('/:a/:b?/:c').params).toEqual(['a', 'b', 'c'])
  })

  it('handles a catch-all that comes first', () => {
    expect(patternToRegex('/:path*').params).toEqual(['path'])
  })

  it('keeps plain patterns in order', () => {
    expect(patternToRegex('/:owner/:repository/pull/:number').params)
      .toEqual(['owner', 'repository', 'number'])
  })
})

describe('matchRoute binds the right value to each name', () => {
  it('binds a mixed catch-all pattern correctly', () => {
    const result = matchRoute('/stacks/stacks/tree/main/storage/framework', [route('/:owner/:repository/tree/:ref/:path*')])

    expect(result?.params).toEqual({
      owner: 'stacks',
      repository: 'stacks',
      ref: 'main',
      path: 'storage/framework',
    })
  })

  it('lets a catch-all span separators while others stop at one', () => {
    const result = matchRoute('/docs/a/b/c', [route('/docs/:path*')])

    expect(result?.params.path).toBe('a/b/c')
  })

  it('still matches a single segment through a catch-all', () => {
    const result = matchRoute('/stacks/stacks/tree/main/app', [route('/:owner/:repository/tree/:ref/:path*')])

    expect(result?.params).toMatchObject({ repository: 'stacks', ref: 'main', path: 'app' })
  })

  it('matches an optional parameter when absent', () => {
    const routes = [route('/blog/:slug?')]

    expect(matchRoute('/blog', routes)?.params.slug).toBeUndefined()
    expect(matchRoute('/blog/hello', routes)?.params.slug).toBe('hello')
  })

  it('does not let a literal dot act as a wildcard', () => {
    const routes = [route('/file.txt')]

    expect(matchRoute('/file.txt', routes)).not.toBeNull()
    expect(matchRoute('/fileXtxt', routes)).toBeNull()
  })

  it('requires a catch-all to have at least one segment', () => {
    // `(.+)` not `(.*)`: /docs and /docs/ are not the same route as /docs/x.
    expect(matchRoute('/docs/', [route('/docs/:path*')])).toBeNull()
  })
})
