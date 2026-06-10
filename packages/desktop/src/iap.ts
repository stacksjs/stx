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

export type IAPProductType = 
| 'consumable'
| 'non-consumable'
| 'auto-subscription'
| 'non-auto-subscription'

export type IAPSubscriptionPeriod = 'day' | 'week' | 'month' | 'year'

export interface IAPSubscriptionInfo {
  /** Length of one period — `1` + `month` means a one-month subscription. */
  numberOfUnits: number
  unit: IAPSubscriptionPeriod
  /** Free trial / intro offer attached to this subscription, if any. */
  introductoryOffer?: IAPIntroductoryOffer
  /** True when the subscription is shareable with iCloud Family. */
  familyShareable?: boolean
  /** Subscription group identifier. Used by StoreKit for upgrade/downgrade math. */
  groupIdentifier?: string
}

export interface IAPIntroductoryOffer {
  /** "free-trial" | "pay-as-you-go" | "pay-up-front". */
  paymentMode: 'free-trial' | 'pay-as-you-go' | 'pay-up-front'
  /** Localized price including currency symbol; `"0.00"` for free trials. */
  localizedPrice: string
  /** How long the intro lasts. */
  numberOfUnits: number
  unit: IAPSubscriptionPeriod
  /** How many billing periods the intro repeats over (>=1). */
  numberOfPeriods?: number
}

export interface IAPProduct {
  id: string
  title: string
  description?: string
  price: string
  /** Currency code (e.g. "USD"). */
  currency?: string
  /** Localized price including currency symbol. */
  localizedPrice?: string
  type?: IAPProductType
  /** Present only when `type === 'auto-subscription'`. */
  subscription?: IAPSubscriptionInfo
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
  /** Original transaction id — populated for renewals / restores. */
  originalTransactionId?: string
  /** True when this purchase was issued under iCloud Family Sharing. */
  familyShared?: boolean
  /** True when restoring a previously purchased non-consumable. */
  restored?: boolean
  /** Subscription auto-renewal status, if applicable. */
  autoRenewing?: boolean
  /** ISO date when the current subscription period expires. */
  expiresAt?: string
  /** True when StoreKit reports this transaction is in the intro/free-trial period. */
  inIntroPeriod?: boolean
}

export interface IAPFailureEvent {
  productId: string
  /** Apple's SKErrorCode value. */
  code?: number
  message?: string
}

export interface IAPRefundEvent {
  productId: string
  transactionId: string
  /** ISO date when the refund was issued. */
  refundedAt?: string
  /** "voluntary" | "issue-app" | "other" — Apple's refund preference. */
  reason?: string
}

export interface IAPSubscriptionStatusEvent {
  productId: string
  /** "active" | "expired" | "in-grace-period" | "in-billing-retry" | "revoked". */
  status: 'active' | 'expired' | 'in-grace-period' | 'in-billing-retry' | 'revoked'
  /** ISO date when status takes effect. */
  changedAt?: string
  /** ISO date the current period ends. */
  expiresAt?: string
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
  /**
   * Fires when a previous purchase has been refunded by the user via the
   * App Store. Apps should immediately revoke the entitlement granted by
   * the original transaction.
   */
  onRefunded: (cb: (e: IAPRefundEvent) => void) => () => void
  /**
   * Fires whenever a subscription's lifecycle status changes — the user
   * lapses out of grace period, billing retry resolves, etc.
   */
  onSubscriptionStatusChanged: (cb: (e: IAPSubscriptionStatusEvent) => void) => () => void
  /**
   * Returns the currently-active subscription product ids, plus their
   * status. Use on app boot to gate features rather than re-running
   * `restorePurchases()` every time.
   */
  getActiveSubscriptions: () => Promise<IAPSubscriptionStatusEvent[]>
  /**
   * True if the user is eligible for the introductory offer attached to
   * `productId`. Apple gates intro eligibility per subscription group:
   * if the user has ever subscribed to *any* product in the same group,
   * they're ineligible for further intro offers.
   */
  isEligibleForIntroOffer: (productId: string) => Promise<boolean>
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
  onPurchased(cb) { return onCraftEvent<IAPTransactionEvent>('craft:iap:purchased', cb) },
  onFailed(cb) { return onCraftEvent<IAPFailureEvent>('craft:iap:failed', cb) },
  onRestored(cb) { return onCraftEvent<IAPTransactionEvent>('craft:iap:restored', cb) },
  onProductsLoaded(cb) {
    return onCraftEvent<{ products?: IAPProduct[] }>('craft:iap:productsLoaded', (e) => cb(e.products || []))
  },
  onRefunded(cb) { return onCraftEvent<IAPRefundEvent>('craft:iap:refunded', cb) },
  onSubscriptionStatusChanged(cb) {
    return onCraftEvent<IAPSubscriptionStatusEvent>('craft:iap:subscriptionStatusChanged', cb)
  },
  async getActiveSubscriptions() {
    if (!hasBridge('iap')) return []
    // Older bridges may not implement this — defensive default keeps the
    // call shape stable so callers can ship before the native side ships.
    const fn = window.craft!.iap.getActiveSubscriptions
    if (typeof fn !== 'function') return []
    const r = await fn()
    return Array.isArray(r) ? r as IAPSubscriptionStatusEvent[] : []
  },
  async isEligibleForIntroOffer(productId) {
    if (!hasBridge('iap')) return false
    const fn = window.craft!.iap.isEligibleForIntroOffer
    if (typeof fn !== 'function') return false
    return !!(await fn(productId))
  },
}
