import { describe, expect, it } from 'bun:test'

describe('SPA Fragment Extraction', () => {
  // Mock full-page HTML simulating processDirectives output for a bun-queue dashboard page
  const fullPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>bun-queue Dashboard</title>
  <style data-stx-crosswind>.flex{display:flex}.p-4{padding:1rem}.bg-gray-100{background-color:#f7fafc}</style>
  <style data-stx-page>.dashboard-header{font-size:1.5rem;font-weight:bold}</style>
</head>
<body class="bg-gray-100">
  <script data-stx-scoped>;(function(){'use strict';const s=window.stx||(window.stx={});s.signal=function(v){let _v=v;return{get value(){return _v},set value(n){_v=n}}};})();</script>
  <script data-stx-scoped>window.stx.mount(function(){console.log('layout mounted')});</script>
  <style data-stx-push>.queue-status{color:green}</style>
  <aside class="sidebar">
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/queues">Queues</a>
      <a href="/settings">Settings</a>
    </nav>
  </aside>
  <main class="content p-4">
    <h1 class="dashboard-header">Queue Dashboard</h1>
    <div class="queue-list">
      <div :if="queues.length > 0">
        <span>{{ queueCount }} active queues</span>
      </div>
      <div :else>
        <span>No active queues</span>
      </div>
    </div>
    <script data-stx-scoped>;(function(){'use strict';const r=window.stx;r.effect=function(fn){fn()};})();</script>
  </main>
  <script data-stx-scoped>
function __stx_setup_1234_0() {
  const { state } = window.stx;
  const count = state(0);
  const queues = state([]);
  return { count, queues };
}
if(window.stx)window.stx._latestSetup=__stx_setup_1234_0;
</script>
  <script data-stx-router>window.stx.router.init({mode:'history'});</script>
</body>
</html>`

  it('extracts SPA fragment correctly from full page HTML', () => {
    let fragment = fullPageHtml
    const content = fullPageHtml

    // 1. Extract styles from <head>
    const headStyles: string[] = []
    const headMatch = content.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
    if (headMatch) {
      const headContent = headMatch[1]
      let styleMatch: RegExpExecArray | null
      const styleRe = /<style\b[^>]*>[\s\S]*?<\/style>/gi
      while ((styleMatch = styleRe.exec(headContent)) !== null) {
        headStyles.push(styleMatch[0])
      }
    }

    // 2. Extract body styles before <main> and extract <main> inner content
    const mainOpenMatch = fragment.match(/<main\b[^>]*>/i)
    const mainCloseIdx = fragment.lastIndexOf('</main>')
    if (mainOpenMatch && mainCloseIdx !== -1) {
      const bodyMatch = content.match(/<body\b[^>]*>/i)
      if (bodyMatch) {
        const bodyStart = bodyMatch.index! + bodyMatch[0].length
        const mainIdx = mainOpenMatch.index!
        const beforeMain = content.slice(bodyStart, mainIdx)
        let bodyStyleMatch: RegExpExecArray | null
        const bodyStyleRe = /<style\b[^>]*>[\s\S]*?<\/style>/gi
        while ((bodyStyleMatch = bodyStyleRe.exec(beforeMain)) !== null) {
          headStyles.push(bodyStyleMatch[0])
        }
      }

      const mainStart = mainOpenMatch.index! + mainOpenMatch[0].length
      fragment = fragment.slice(mainStart, mainCloseIdx).trim()
    }

    // 3. Extract page setup scripts from anywhere in the full page
    const pageSetupScripts: string[] = []
    const setupRe = /<script data-stx-scoped>\s*function __stx_setup_[\s\S]*?<\/script>/gi
    let setupMatch: RegExpExecArray | null
    while ((setupMatch = setupRe.exec(content)) !== null) {
      pageSetupScripts.push(setupMatch[0])
    }

    // 4. Strip signals runtime IIFE from fragment
    fragment = fragment.replace(
      /<script data-stx-scoped>\s*;?\(function\(\)\s*\{[\s\S]*?<\/script>/g,
      '',
    )

    // 5. Combine: headStyles + fragment + setupScripts
    fragment = `${headStyles.join('\n')}\n${fragment}\n${pageSetupScripts.join('\n')}`

    // --- Assertions ---

    // Fragment contains main inner content
    expect(fragment).toContain('Queue Dashboard')
    expect(fragment).toContain('{{ queueCount }} active queues')
    expect(fragment).toContain(':if="queues.length > 0"')

    // Fragment does NOT contain document shell
    expect(fragment).not.toContain('<!DOCTYPE')
    expect(fragment).not.toContain('<html')
    expect(fragment).not.toContain('</html>')

    // Fragment does NOT contain the signals runtime IIFE
    expect(fragment).not.toContain(`;(function(){'use strict';const s=window.stx`)
    // Also the inner IIFE that was inside <main> should be stripped
    expect(fragment).not.toContain(`;(function(){'use strict';const r=window.stx`)

    // Fragment DOES contain the __stx_setup script
    expect(fragment).toContain('function __stx_setup_1234_0()')
    expect(fragment).toContain('window.stx._latestSetup=__stx_setup_1234_0')

    // Fragment does NOT contain sidebar content
    expect(fragment).not.toContain('<aside')
    expect(fragment).not.toContain('class="sidebar"')

    // Head styles are included
    expect(fragment).toContain('<style data-stx-crosswind>')
    expect(fragment).toContain('<style data-stx-page>')

    // Body styles (from @push) before <main> are included
    expect(fragment).toContain('<style data-stx-push>')
    expect(fragment).toContain('.queue-status{color:green}')

    // Fragment does NOT contain router script (it's outside <main> and not a setup script)
    expect(fragment).not.toContain('data-stx-router')

    // Fragment does NOT contain the layout mount script
    expect(fragment).not.toContain('layout mounted')
  })
})
