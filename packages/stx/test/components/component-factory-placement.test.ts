import { expect, test } from 'bun:test'
import { initializeComponentClientFactories, injectComponentClientFactories, registerComponentClientFactory } from '../../src/component-client-factories'

test('an inert first instance cannot hide the shared factories used by later active components', () => {
  const context = {}
  initializeComponentClientFactories(context)
  const factory = 'function(scope) { window.runs.push(scope) }'
  const id = registerComponentClientFactory(context, factory)
  registerComponentClientFactory(context, factory)
  const invoke = (scope: string) => `<script data-stx-scoped>window.__stxComponentFactories[${JSON.stringify(id)}](${JSON.stringify(scope)});</script>`
  const html = injectComponentClientFactories(`<!DOCTYPE html><html><head></head><body>
<!-- <template> --> <p title="<template>">Example</p>
<template>${invoke('inactive')}</template>${invoke('active')}</body></html>`, context)
  const prelude = html.match(/<script[^>]*data-stx-component-factories[^>]*>([\s\S]*?)<\/script>/)
  expect(prelude).not.toBeNull()
  expect(html.indexOf(prelude![0])).toBeLessThan(html.indexOf(`<template>${invoke('inactive')}`))
  expect(html.indexOf(prelude![0])).toBeGreaterThan(html.indexOf('Example</p>'))
  const host = { runs: [] as string[] }
  new Function('window', prelude![1]!)(host)
  // The inactive template does not execute its invocation at parse time.
  new Function('window', `window.__stxComponentFactories[${JSON.stringify(id)}]('active')`)(host)
  expect(host.runs).toEqual(['active'])
  new Function('window', `window.__stxComponentFactories[${JSON.stringify(id)}]('inactive')`)(host)
  expect(host.runs).toEqual(['active', 'inactive'])
})
