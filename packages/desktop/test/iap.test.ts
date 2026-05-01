import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { iap } from '../src/iap'
import { findCall, installMockBridge } from './_mock-bridge'

describe('iap (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['iap'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('isAvailable returns boolean', async () => {
    bridge.whenCalled('iap', 'isAvailable', true)
    expect(await iap.isAvailable()).toBe(true)
  })

  it('getProducts wraps single id into array', async () => {
    bridge.whenCalled('iap', 'getProducts', [{ id: 'pro', title: 'Pro', price: '$9.99' }])
    const r = await iap.getProducts('pro')
    const c = findCall(bridge.calls, 'iap', 'getProducts')!
    expect(c.args[0]).toEqual(['pro'])
    expect(r).toHaveLength(1)
  })

  it('purchase forwards productId', async () => {
    bridge.whenCalled('iap', 'purchase', { queued: true, productId: 'pro' })
    const r = await iap.purchase('pro')
    expect(r.queued).toBe(true)
    expect(r.productId).toBe('pro')
  })

  it('purchase reports cache-miss reason from native', async () => {
    bridge.whenCalled('iap', 'purchase', {
      queued: false,
      productId: 'unknown',
      reason: 'call getProducts() with this id first; product not in cache',
    })
    const r = await iap.purchase('unknown')
    expect(r.queued).toBe(false)
    expect(r.reason).toMatch(/getProducts/)
  })

  it('finishTransaction forwards', async () => {
    await iap.finishTransaction('txn-1')
    expect(findCall(bridge.calls, 'iap', 'finishTransaction')!.args[0]).toBe('txn-1')
  })

  it('restorePurchases returns ok', async () => {
    bridge.whenCalled('iap', 'restorePurchases', { ok: true })
    const r = await iap.restorePurchases()
    expect(r.ok).toBe(true)
  })

  it('getReceiptData returns string or null', async () => {
    bridge.whenCalled('iap', 'getReceiptData', 'aGVsbG8=')
    expect(await iap.getReceiptData()).toBe('aGVsbG8=')

    bridge.whenCalled('iap', 'getReceiptData', null)
    expect(await iap.getReceiptData()).toBeNull()
  })

  it('event subscribers wire to the right craft:iap:* events', () => {
    const purchased: any[] = []
    const failed: any[] = []
    const restored: any[] = []
    const products: any[] = []

    const offP = iap.onPurchased(e => purchased.push(e))
    const offF = iap.onFailed(e => failed.push(e))
    const offR = iap.onRestored(e => restored.push(e))
    const offProducts = iap.onProductsLoaded(p => products.push(p))

    window.dispatchEvent(new CustomEvent('craft:iap:purchased', { detail: { productId: 'pro', transactionId: 't1' } }))
    window.dispatchEvent(new CustomEvent('craft:iap:failed', { detail: { productId: 'pro', code: 2 } }))
    window.dispatchEvent(new CustomEvent('craft:iap:restored', { detail: { productId: 'pro', transactionId: 't0' } }))
    window.dispatchEvent(new CustomEvent('craft:iap:productsLoaded', { detail: { products: [{ id: 'pro' }] } }))

    expect(purchased[0].productId).toBe('pro')
    expect(failed[0].code).toBe(2)
    expect(restored[0].transactionId).toBe('t0')
    expect(products[0]).toEqual([{ id: 'pro' }])

    offP()
    offF()
    offR()
    offProducts()
  })
})

describe('iap (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('isAvailable returns false', async () => {
    expect(await iap.isAvailable()).toBe(false)
  })

  it('purchase returns queued:false with reason', async () => {
    const r = await iap.purchase('pro')
    expect(r.queued).toBe(false)
    expect(r.reason).toMatch(/not available/i)
  })

  it('getProducts returns []', async () => {
    expect(await iap.getProducts(['pro'])).toEqual([])
  })

  it('restorePurchases returns ok:false', async () => {
    const r = await iap.restorePurchases()
    expect(r.ok).toBe(false)
  })

  it('getReceiptData returns null', async () => {
    expect(await iap.getReceiptData()).toBeNull()
  })

  it('getActiveSubscriptions returns []', async () => {
    expect(await iap.getActiveSubscriptions()).toEqual([])
  })

  it('isEligibleForIntroOffer returns false', async () => {
    expect(await iap.isEligibleForIntroOffer('pro.monthly')).toBe(false)
  })
})

describe('iap — subscriptions, refunds, intro offers', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => { bridge = installMockBridge(['iap']) })
  afterEach(() => { bridge.uninstall() })

  it('onRefunded surfaces craft:iap:refunded events', () => {
    const events: any[] = []
    const off = iap.onRefunded(e => events.push(e))
    window.dispatchEvent(new CustomEvent('craft:iap:refunded', {
      detail: { productId: 'pro.monthly', transactionId: 't-99', refundedAt: '2026-04-01T00:00:00Z', reason: 'voluntary' },
    }))
    expect(events[0].productId).toBe('pro.monthly')
    expect(events[0].reason).toBe('voluntary')
    off()
  })

  it('onSubscriptionStatusChanged surfaces lifecycle transitions', () => {
    const events: any[] = []
    const off = iap.onSubscriptionStatusChanged(e => events.push(e))
    window.dispatchEvent(new CustomEvent('craft:iap:subscriptionStatusChanged', {
      detail: { productId: 'pro.monthly', status: 'in-grace-period', expiresAt: '2026-05-01T00:00:00Z' },
    }))
    expect(events[0].status).toBe('in-grace-period')
    off()
  })

  it('getActiveSubscriptions returns the bridge response', async () => {
    bridge.whenCalled('iap', 'getActiveSubscriptions', [
      { productId: 'pro.monthly', status: 'active', expiresAt: '2026-05-01T00:00:00Z' },
    ])
    const subs = await iap.getActiveSubscriptions()
    expect(subs).toHaveLength(1)
    expect(subs[0].productId).toBe('pro.monthly')
    expect(subs[0].status).toBe('active')
  })

  it('getActiveSubscriptions returns [] when bridge omits the method', async () => {
    // Don't queue a response — proxy returns a function, but it resolves
    // to undefined which should be coerced to [].
    bridge.whenCalled('iap', 'getActiveSubscriptions', undefined)
    expect(await iap.getActiveSubscriptions()).toEqual([])
  })

  it('isEligibleForIntroOffer forwards productId and coerces to boolean', async () => {
    bridge.whenCalled('iap', 'isEligibleForIntroOffer', 1)
    expect(await iap.isEligibleForIntroOffer('pro.monthly')).toBe(true)
    expect(findCall(bridge.calls, 'iap', 'isEligibleForIntroOffer')!.args).toEqual(['pro.monthly'])

    bridge.whenCalled('iap', 'isEligibleForIntroOffer', 0)
    expect(await iap.isEligibleForIntroOffer('pro.monthly')).toBe(false)
  })

  it('IAPTransactionEvent shape carries family-share + intro flags through', () => {
    const events: any[] = []
    const off = iap.onPurchased(e => events.push(e))
    window.dispatchEvent(new CustomEvent('craft:iap:purchased', {
      detail: {
        productId: 'pro.monthly',
        transactionId: 't-1',
        originalTransactionId: 't-0',
        familyShared: true,
        inIntroPeriod: true,
        autoRenewing: true,
        expiresAt: '2026-05-01T00:00:00Z',
      },
    }))
    expect(events[0].familyShared).toBe(true)
    expect(events[0].inIntroPeriod).toBe(true)
    expect(events[0].originalTransactionId).toBe('t-0')
    off()
  })
})
