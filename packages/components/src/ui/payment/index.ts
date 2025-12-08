export { default as Checkout } from './Checkout.stx'
export { default as DefaultPaymentMethod } from './DefaultPaymentMethod.stx'
export { default as PaymentMethods } from './PaymentMethods.stx'
export { default as SubscriptionCheckout } from './SubscriptionCheckout.stx'

export interface PaymentMethod {
  id: string | number
  brand: string
  last_four: string
  exp_month: number
  exp_year: number
  is_default?: boolean
}

export interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[]
  onDeletePaymentMethod?: (id: string | number) => void
  onMakeDefault?: (id: string | number) => void
  isLoading?: boolean
  className?: string
}

export interface DefaultPaymentMethodProps {
  paymentMethod: PaymentMethod | null
  isLoading?: boolean
  className?: string
}

export interface Product {
  id: string | number
  name: string
  price: number // in cents
  images?: string
  quantity?: number
}

export interface SubscriptionCheckoutProps {
  products: Product[]
  stripePublicKey: string
  apiUrl: string
  onSubmit?: (result: { success: boolean }) => void
  onRemoveProduct?: (id: string | number) => void
  shipping?: number
  taxes?: number
  className?: string
}

export interface CheckoutProps {
  products: Product[]
  redirectUrl: string
  mode: 'one-time' | 'subscription'
  stripePublicKey: string
  apiUrl: string
  onSubmit?: (result: { success: boolean }) => void
  onRemoveProduct?: (id: string | number) => void
  shipping?: number
  taxes?: number
  className?: string
}
