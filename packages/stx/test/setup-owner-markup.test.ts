import { expect, test } from 'bun:test'
import { processScriptSetup } from '../src/signal-processing'

test('page setup belongs to real markup even when earlier opaque text mentions main or body', async () => {
  for (const prefix of [
    '<style>/* layout marks its <main> */</style>',
    '<!-- the shell has <main> -->',
    '<script data-stx-scoped>const example = "<main>"</script>',
    '<style>/* optional <body> wrapper */</style>',
  ]) {
    const { output } = await processScriptSetup(`${prefix}<main id="shop"><p>{{ name }}</p></main><script client>const name = state('shop')</script>`)
    expect(output).toContain(prefix)
    expect(output).toMatch(/<main id="shop" data-stx="__stx_setup_[^"]+">/)
    expect(output.match(/ data-stx=/g)).toHaveLength(1)
  }
})
