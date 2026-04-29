/**
 * In-App Purchases (StoreKit on macOS)
 *
 * **Scope**: minimal. Full StoreKit support involves SKProductsRequest
 * delegates, transaction observers, receipt validation, family sharing,
 * promotional offers — months of work. The native side currently
 * implements `isAvailable`, `restorePurchases`, and `getReceiptData`
 * fully; `getProducts`, `purchase`, and `finishTransaction` are stubs
 * pending the StoreKit observer wiring.
 *
 * Apps that need a working IAP flow today should:
 *   1. Use `getReceiptData()` to grab the bundled App Store receipt
 *      and verify it server-side via Apple's verifyReceipt API.
 *   2. Implement product fetch + purchase via a separate SDK or
 *      direct StoreKit code in your bundle.
 *
 * This shape is intentionally stable so apps can write against it now
 * and switch over to a richer implementation when it lands.
 */

import { hasBridge } from './_bridge'

export interface IAPProduct {
  id: string
  title: string
  description?: string
  price: string
  /** Currency code (e.g. "USD"). */
  currency?: string
  /** Localized price including currency symbol. */
  localizedPrice?: string
  /** "consumable" | "non-consumable" | "auto-subscription" | "non-auto-subscription". */
  type?: string
}

export interface IAPPurchaseResult {
  /** True when the purchase was queued successfully. */
  queued: boolean
  productId?: string
  /** Why the purchase couldn't be queued (transient stub limitation, etc). */
  reason?: string
}

export interface IAPTransactionEvent {
  productId: string
  transactionId: string
  /** ISO date string. */
  date?: string
}

export interface IAPFailureEvent {
  productId: string
  /** Apple's SKErrorCode value. */
  code?: number
  message?: string
}

export interface IAPAPI {
  /** True if the device is allowed to make payments. */
  isAvailable: () => Promise<boolean>
  /** Fetch products by id. May return an empty array if native fetch isn't wired yet. */
  getProducts: (ids: string[] | string) => Promise<IAPProduct[]>
  /** Queue a purchase. Result fires via `onPurchased` / `onFailed`. */
  purchase: (productId: string) => Promise<IAPPurchaseResult>
  /** Restore previously-bought non-consumables tied to the user's Apple ID. */
  restorePurchases: () => Promise<{ ok: boolean }>
  /**
   * Mark a transaction as finished — required for non-consumables to
   * stop StoreKit re-delivering them.
   */
  finishTransaction: (transactionId: string) => Promise<void>
  /**
   * Read the App Store receipt as a base64 string. Hand this to your
   * server and call Apple's `verifyReceipt` for trusted validation.
   */
  getReceiptData: () => Promise<string | null>
  /** Subscribe to successful purchase events. */
  onPurchased: (cb: (e: IAPTransactionEvent) => void) => () => void
  /** Subscribe to purchase-failure events. */
  onFailed: (cb: (e: IAPFailureEvent) => void) => () => void
  /** Subscribe to "purchase restored" events. */
  onRestored: (cb: (e: IAPTransactionEvent) => void) => () => void
  /** Subscribe to async products-fetch results. */
  onProductsLoaded: (cb: (products: IAPProduct[]) => void) => () => void
}

import { onCraftEvent } from './_bridge'

export const iap: IAPAPI = {
  async isAvailable() {
    if (!hasBridge('iap')) return false
    return await window.craft!.iap.isAvailable()
  },
  async getProducts(ids) {
    if (!hasBridge('iap')) return []
    // Normalize to array at the TS boundary so the bridge always sees
    // the same shape, regardless of whether the caller passed a
    // single id or a list.
    const arr = Array.isArray(ids) ? ids : [String(ids)]
    return await window.craft!.iap.getProducts(arr)
  },
  async purchase(productId) {
    if (!hasBridge('iap')) return { queued: false, productId, reason: 'IAP bridge not available' }
    const r = await window.craft!.iap.purchase(productId)
    return { queued: !!(r && r.queued), productId: r?.productId, reason: r?.reason }
  },
  async restorePurchases() {
    if (!hasBridge('iap')) return { ok: false }
    const r = await window.craft!.iap.restorePurchases()
    return { ok: !!(r && r.ok) }
  },
  async finishTransaction(transactionId) {
    if (!hasBridge('iap')) return
    await window.craft!.iap.finishTransaction(transactionId)
  },
  async getReceiptData() {
    if (!hasBridge('iap')) return null
    const r = await window.craft!.iap.getReceiptData()
    return r ? String(r) : null
  },
  onPurchased(cb)       { return onCraftEvent<IAPTransactionEvent>('craft:iap:purchased', cb) },
  onFailed(cb)          { return onCraftEvent<IAPFailureEvent>('craft:iap:failed', cb) },
  onRestored(cb)        { return onCraftEvent<IAPTransactionEvent>('craft:iap:restored', cb) },
  onProductsLoaded(cb) {
    return onCraftEvent<{ products?: IAPProduct[] }>('craft:iap:productsLoaded', (e) => cb(e.products || []))
  },
}
