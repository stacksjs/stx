import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { mutationResponse } from '../../src/index'
import { processDirectives } from '../../src/process'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

it('updates a mounted query from an HTTP mutation without a second GET', async () => {
  const source = `<!doctype html><html><body>
<script client>
const users = useQuery('/users')
const create = useMutation('/users', { invalidateQueries: ['/users'] })
async function submit() { await create.mutate({ name: 'Ada' }) }
</script>
<main>
  <span id="count" x-text="users.data()?.length ?? ''"></span>
  <button id="add" @click="submit()">Add</button>
</main>
</body></html>`
  const html = await processDirectives(source, {}, '/tmp/query-mutation.stx', { cache: false }, new Set())
  const reads: string[] = []
  const users: string[] = []
  const fixture = createBrowserFixture({
    createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
    createServer: () => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      async fetch(request) {
        const pathname = new URL(request.url).pathname
        if (pathname === '/') return new Response(html, { headers: { 'Content-Type': 'text/html' } })
        if (pathname !== '/users') return new Response(null, { status: 404 })
        reads.push(request.method)
        if (request.method === 'GET') return Response.json(users)
        const { name } = await request.json() as { name: string }
        users.push(name)
        return mutationResponse({ name }, { '/users': users }, { status: 201 })
      },
    }),
  })
  try {
    const count = "document.querySelector('#count')?.textContent"
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor<string>(count, value => value === '0')).toBe('0')
    await fixture.view.evaluate("document.querySelector('#add').click()")
    expect(await fixture.waitFor<string>(count, value => value === '1')).toBe('1')
    expect(reads).toEqual(['GET', 'POST'])
  }
  finally {
    fixture.close()
  }
}, 30_000)
