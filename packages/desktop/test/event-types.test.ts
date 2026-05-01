/**
 * Compile-only check that `onCraftEvent` narrows known event names. The
 * runtime side is already covered by every `onXxx` test in the package;
 * this file exists to stop a future regression that would silently widen
 * the payload back to `unknown`.
 */
/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

import { describe, expect, it } from 'bun:test'
import type { CraftEventMap } from '../src'

describe('event-types', () => {
  it('CraftEventMap contains the expected event keys', () => {
    type Keys = keyof CraftEventMap
    const known: Keys[] = [
      'craft:bluetooth:deviceFound',
      'craft:fs:change',
      'craft:iap:purchased',
      'craft:iap:refunded',
      'craft:iap:subscriptionStatusChanged',
      'craft:notification:actionClicked',
      'craft:notification:reply',
      'craft:bluetooth:characteristicValue',
      'craft:updateAvailable',
      'craft:window:resize',
    ]
    expect(known.length).toBeGreaterThan(0)
  })

  it('payloads carry their structural shape, not unknown', () => {
    // Each branch type-checks only because the map gives us a concrete
    // payload type. If `onCraftEvent` regressed to `unknown`, the
    // `.path` access below would error.
    type FSPayload = CraftEventMap['craft:fs:change']
    const fsSample: FSPayload = { id: 'a', path: '/x' }
    expect(fsSample.path).toBe('/x')

    type IAPPayload = CraftEventMap['craft:iap:refunded']
    const iapSample: IAPPayload = { productId: 'p', transactionId: 't' }
    expect(iapSample.productId).toBe('p')
  })
})
