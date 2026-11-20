import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

it('tracks useAsyncData where the template reads it and keeps settled content during refresh', async () => {
  const source = `<!doctype html>
<html><body>
<script client>
import { useAsyncData } from 'stx'
const pending = Object.create(null)
function savedLoader(key) {
  return (signal) => new Promise((resolve, reject) => {
    (pending[key] ||= []).push({ resolve, reject, signal })
  })
}
const first = useAsyncData(savedLoader('first'))
const second = useAsyncData(savedLoader('second'))
const unused = useAsyncData(savedLoader('unused'))
const inactive = useAsyncData(savedLoader('inactive'), { suspense: false })
const showFirst = state(true)
const showRetained = state(true)
const rows = useAsyncData(savedLoader('rows'))
const condition = useAsyncData(savedLoader('condition'))
const displayed = memo(() => showFirst() ? first.data()?.name : second.data()?.name)
const displayRuns = []
// Populate the memo before any boundary reads it. A plain effect should not
// rerun when its value is equal and only the async dependency changed.
effect(() => displayRuns.push(displayed()))
window.asyncTest = { pending, second, showFirst, showRetained, displayRuns }
</script>
<main>
  <Suspense fallback="Outer pending">
    <span id="outside">Ready</span>
    <Suspense fallback="Left pending" error-fallback="Left failed">
      <span id="left" x-text="displayed() ?? ''"></span>
    </Suspense>
    <Suspense fallback="Right pending" error-fallback="Right failed">
      <span id="right" x-text="second.data()?.name ?? ''"></span>
    </Suspense>
    <Suspense fallback="Retained pending">
      <div id="retained"><span :if="showRetained" x-text="unused.data()?.name ?? ''"></span></div>
    </Suspense>
    <Suspense fallback="Rows pending">
      <ul id="rows"><li :for="row in (rows.data() ?? [])" x-text="row"></li></ul>
    </Suspense>
    <Suspense fallback="Condition pending">
      <div id="condition"><template :if="condition.data()">Yes</template></div>
    </Suspense>
    <Suspense fallback="Untracked pending">
      <span id="ignored" x-text="inactive.data()?.name ?? ''"></span>
    </Suspense>
  </Suspense>
</main>
</body></html>`
  const html = await processDirectives(source, {}, '/tmp/async-data-suspense.stx', { cache: false, debug: false }, new Set())
  const fixture = createBrowserFixture({
    createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
    createServer: () => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }),
    }),
  })
  const { view } = fixture

  const region = (id: string) => view.evaluate(`(() => {
    const scope = document.getElementById(${JSON.stringify(id)}).closest('[data-stx-suspense]');
    return Array.from(scope.children).find(el => !el.hidden)?.textContent?.trim();
  })()`)
  const run = (code: string) => view.evaluate(`(async () => { ${code}; await Promise.resolve(); })()`)

  try {
    await view.navigate(fixture.url)
    expect(await fixture.waitFor<boolean>(
      "!!window.asyncTest && !!document.getElementById('left') && !document.getElementById('outside').parentElement.hidden",
      Boolean,
    )).toBe(true)
    expect(await region('left')).toBe('Left pending')
    expect(await region('right')).toBe('Right pending')
    expect(await region('ignored')).toBe('')
    expect(await region('retained')).toBe('Retained pending')
    expect(await region('rows')).toBe('Rows pending')
    expect(await region('condition')).toBe('Condition pending')
    await run('asyncTest.showRetained.set(false)')
    expect(await region('retained')).toBe('')
    await run('asyncTest.showRetained.set(true)')
    expect(await region('retained')).toBe('Retained pending')
    await run("asyncTest.pending.unused[0].resolve({ name: 'retained' }); asyncTest.pending.rows[0].resolve(['Row']); asyncTest.pending.condition[0].resolve(true)")
    expect(await region('retained')).toBe('retained')
    expect(await region('rows')).toBe('Row')
    expect(await region('condition')).toBe('Yes')

    // Both branches of the memo initially return undefined. Its boundary
    // must follow the source change even though the memo's value is equal.
    await run("asyncTest.showFirst.set(false); asyncTest.pending.first[0].reject(new Error('first failed'))")
    expect(await region('left')).toBe('Left pending')
    expect(await region('right')).toBe('Right pending')
    expect(await view.evaluate('asyncTest.displayRuns.length')).toBe(1)
    await run("asyncTest.pending.second[0].reject(new Error('second failed'))")
    expect(await region('left')).toBe('Left failed')
    expect(await region('right')).toBe('Right failed')

    await run('void asyncTest.second.refetch()')
    expect(await region('left')).toBe('Left pending')
    await run("asyncTest.pending.second[1].resolve({ name: 'second-v1' })")
    expect(await region('left')).toBe('second-v1')
    expect(await region('right')).toBe('second-v1')

    await run('void asyncTest.second.refetch(); void asyncTest.second.refetch()')
    expect(await region('right')).toBe('second-v1')
    expect(await view.evaluate('asyncTest.second.isFetching()')).toBe(true)
    expect(await view.evaluate('asyncTest.pending.second[2].signal.aborted')).toBe(true)
    await run("asyncTest.pending.second[3].resolve({ name: 'second-v3' })")
    await run("asyncTest.pending.second[2].resolve({ name: 'second-v2' })")
    expect(await region('left')).toBe('second-v3')
    expect(await region('right')).toBe('second-v3')
    await run("void asyncTest.second.refetch(); asyncTest.pending.second[4].reject(new Error('refresh failed'))")
    expect(await region('right')).toBe('second-v3')
    expect(await view.evaluate('asyncTest.second.error().message')).toBe('refresh failed')
  }
  finally {
    fixture.close()
  }
}, 30_000)

it('tracks a late query only while its reader belongs to the boundary', async () => {
  const source = `<!doctype html><html><body><main>
    <Suspense fallback="Waiting">
      <section id="reader">Ready</section>
    </Suspense>
  </main></body></html>`
  const html = await processDirectives(source, {}, '/tmp/late-query-suspense.stx', { cache: false }, new Set())
  const fixture = createBrowserFixture({
    createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
    createServer: () => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }),
    }),
  })
  try {
    const showing = "!document.querySelector('[data-stx-suspense-fallback]').hidden"
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor<boolean>(`!!window.stx && !(${showing})`, Boolean)).toBe(true)
    await fixture.view.evaluate(`(() => {
      window.reader = document.querySelector('#reader');
      window.readerParent = reader.parentElement;
      window.__STX_CURRENT_ELEMENT__ = reader;
      window.query = stx.useQuery('/late', { suspense: true, immediate: false });
      window.__STX_CURRENT_ELEMENT__ = null;
      query.loading.set(true);
    })()`)
    expect(await fixture.view.evaluate(showing)).toBe(true)
    await fixture.view.evaluate('reader.remove()')
    expect(await fixture.waitFor<boolean>(showing, shown => !shown)).toBe(false)
    await fixture.view.evaluate('readerParent.appendChild(reader)')
    expect(await fixture.waitFor<boolean>(showing, Boolean)).toBe(true)
  }
  finally {
    fixture.close()
  }
}, 30_000)
