import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

import { measureTooltipPosition, tooltipPosition } from '../src/utils/tooltip-position'

describe('Tooltip asynchronous host measurements', () => {
  const phone = { width: 390, height: 844 }
  const panel = { width: 256, height: 175 }
  const box = { x: 100, y: 10, width: 28, height: 28, viewportWidth: 390, viewportHeight: 844, unit: 'points' as const, coordinateSpace: 'screenViewport' as const }
  it('uses the same flip/clamp math and subtracts the native parent origin', async () => {
    for (const unit of ['points', 'dp'] as const) {
      const trigger = { measure: async () => ({ ...box, unit }) }
      const popup = { measure: async () => ({ ...box, ...panel, unit }), parentElement: { measure: async () => ({ ...box, x: 20, y: 24, unit }) } }
      const actual = await measureTooltipPosition(trigger, popup)
      const expected = tooltipPosition({ left: 100, right: 128, top: 10, bottom: 38 }, panel, phone)
      expect(actual).toEqual({ ...expected, left: expected.left - 20, top: expected.top - 24 })
      expect(actual!.side).toBe('bottom')
    }
  })
  it('does not combine bounds from different viewport snapshots or units', async () => {
    const trigger = { measure: async () => box }
    for (const changed of [{ viewportWidth: 844 }, { unit: 'dp' as const }]) {
      await expect(measureTooltipPosition(trigger, { measure: async () => ({ ...box, ...changed }) })).rejects.toThrow('must share viewport')
    }
  })
  it('propagates unavailable measurements and ignores panels with no layout', async () => {
    const trigger = { measure: async () => box }
    await expect(measureTooltipPosition(trigger, { measure: async () => { throw new Error('VIEW_NOT_MOUNTED') } })).rejects.toThrow('VIEW_NOT_MOUNTED')
    expect(await measureTooltipPosition(trigger, { measure: async () => ({ ...box, width: 0 }) })).toBeNull()
  })
})

it('shared Tooltip discards older, closed, disabled and destroyed measurement replies', async () => {
  const utils = join(import.meta.dir, '../src/utils')
  const source = (await Bun.file(join(import.meta.dir, '../src/ui/tooltip/Tooltip.stx')).text())
    .replace('../../utils/tooltip-position', join(utils, 'tooltip-position'))
    .replace('../../utils/element-portal', join(utils, 'element-portal'))
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Tooltip.stx': source,
    'pages/index.stx': page('app', '<Tooltip content="Helpful hint"><button>Hint</button></Tooltip>'),
  }, { '/': 'pages/index.stx' })
  try {
    const browser = await boot(app, '/')
    await settle()
    const panel = find(browser, '[role="tooltip"]')
    const scope = Object.values(browser.window.stx._scopes).find((value: any) => typeof value.positionTooltip === 'function') as any
    expect(scope).toBeDefined()
    const trigger = scope.triggerRef.value
    trigger.getBoundingClientRect = () => ({ left: 100, right: 130, top: 200, bottom: 230, width: 30, height: 30 })
    panel.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 })
    scope.showTooltip()
    await settle()
    expect(scope.panelStyle()).toContain('left:65px;top:152px;')
    scope.hideTooltip()
    await settle()
    const box = { x: 100, y: 200, width: 30, height: 30, viewportWidth: 390, viewportHeight: 844, unit: 'points', coordinateSpace: 'screenViewport' }
    const replies: Array<(value: any) => void> = []
    trigger.measure = () => new Promise(resolve => replies.push(resolve))
    panel.measure = async () => ({ ...box, width: 100, height: 40 })
    // Native views measure their positioning parent. Give the browser fixture
    // that same host contract while executing the actual shared setup code.
    panel.parentElement.measure = async () => ({ ...box, x: 0, y: 0 })
    scope.showTooltip()
    await settle()
    expect(replies.length).toBeGreaterThan(0)
    while (replies.length) replies.shift()!(box)
    await settle()

    const first = scope.positionTooltip()
    const second = scope.positionTooltip()
    expect(replies).toHaveLength(2)
    replies[1]!({ ...box, x: 250 })
    await second
    const latest = scope.panelStyle()
    expect(latest).toContain('left:215px')
    replies[0]!(box)
    await first
    expect(scope.panelStyle()).toBe(latest)
    replies.length = 0

    const closing = scope.positionTooltip()
    scope.hideTooltip()
    replies.shift()!({ ...box, x: 10 })
    await closing
    expect(scope.panelStyle()).toBe(latest)

    scope.showTooltip()
    await settle()
    scope.isDisabled.set(true)
    while (replies.length) replies.shift()!({ ...box, x: 10 })
    await settle()
    expect(scope.panelStyle()).toBe(latest)

    scope.isDisabled.set(false)
    await settle()
    expect(replies.length).toBeGreaterThan(0)
    browser.window.stx._cleanupContainer(browser.window.document.body)
    while (replies.length) replies.shift()!({ ...box, x: 10 })
    await settle()
    expect(scope.panelStyle()).toBe(latest)
  }
  finally {
    closeBrowser()
    await app.dispose()
  }
}, 30_000)
