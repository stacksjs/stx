import { describe, expect, it } from 'bun:test'
import { clientLoopScopes, processExpressions } from '../src/expressions'

/**
 * A client loop's variable shadows a server binding of the same name, inside
 * that loop only. bun-plugin-stx puts the request into the server context as
 * `host`, `query`, `cookies`, `ip`, `params` and `request`, so a loop written
 * `:for="host in hosts()"` had `{{ host.key }}` evaluated on the server against
 * the request's Host header and rendered empty.
 */
const context = { host: 'localhost:3402', query: {}, title: 'Hosts' }

describe('client loop variables on the server', () => {
  it('leaves a mustache that reads the loop variable for the browser', async () => {
    const html = await processExpressions(
      '<ul><template :for="host in hosts()"><li>{{ host.key }}</li></template></ul>',
      context,
      'test.stx',
    )
    expect(html).toContain('{{ host.key }}')
  })

  it('still evaluates the same name on the server outside the loop', async () => {
    const html = await processExpressions(
      '<p>{{ host }}</p><template :for="host in hosts()"><li>{{ host.key }}</li></template><p>{{ title }}</p>',
      context,
      'test.stx',
    )
    expect(html).toStartWith('<p>localhost:3402</p>')
    expect(html).toContain('{{ host.key }}')
    expect(html).toEndWith('<p>Hosts</p>')
  })

  it('does not let one loop shadow a server binding it does not declare', async () => {
    const html = await processExpressions(
      '<template :for="entry in hosts()"><li>{{ title }}</li></template>',
      context,
      'test.stx',
    )
    expect(html).toContain('<li>Hosts</li>')
  })

  it('finds each loop, its index variable, and its matching close tag through nesting', () => {
    const html = '<div :for="(row, i) in rows()"><div>{{ row }}</div></div><p>{{ row }}</p><li x-for="query in q" />'
    const scopes = clientLoopScopes(html)
    expect(scopes.map(scope => [...scope.names])).toEqual([['row', 'i'], ['query']])
    expect(html.slice(scopes[0]!.start, scopes[0]!.end)).toBe('<div :for="(row, i) in rows()"><div>{{ row }}</div></div>')
  })
})
