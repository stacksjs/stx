# Payment Components

Comprehensive payment components for Stripe integration, including payment method management and checkout flows.

## Installation

```bash
bun add @stacksjs/components
```

## Components

### Checkout
Main checkout wrapper component that supports both subscription and one-time payment modes.

### SubscriptionCheckout
Full subscription checkout flow with Stripe Elements integration.

### PaymentMethods
Display and manage a list of saved payment methods with delete and set-default actions.

### DefaultPaymentMethod
Display the default payment method with a badge.

## Usage

### Checkout Component

```stx
<script server>
const products = [
  {
    id: 1,
    name: 'Premium Subscription',
    price: 99900, // $999.00 in cents
    images: '/images/subscription.jpg',
    quantity: 1
  }
]

const mode = 'subscription'
const stripePublicKey = 'pk_test_...'
const apiUrl = 'https://api.example.com'
const redirectUrl = '/thank-you'
const shipping = 4500
const taxes = 552

const onSubmit = (result) => {
  if (result.success) {
    console.log('Payment successful!')
    window.location.href = redirectUrl
  }
}

const onRemoveProduct = (productId) => {
  console.log('Remove product:', productId)
  // Update cart state
}
</script>

<Checkout
  :products="products"
  :mode="mode"
  :stripePublicKey="stripePublicKey"
  :apiUrl="apiUrl"
  :redirectUrl="redirectUrl"
  :shipping="shipping"
  :taxes="taxes"
  :onSubmit="onSubmit"
  :onRemoveProduct="onRemoveProduct"
/>
```

### PaymentMethods Component

```stx
<script server>
const methods = [
  {
    id: 1,
    brand: 'Visa',
    last_four: '4242',
    exp_month: 12,
    exp_year: 2025
  },
  {
    id: 2,
    brand: 'Mastercard',
    last_four: '5555',
    exp_month: 6,
    exp_year: 2026
  }
]

const handleDelete = (id) => {
  console.log('Delete payment method:', id)
  // Call your API to delete
}

const handleMakeDefault = (id) => {
  console.log('Make default:', id)
  // Call your API to set as default
}
</script>

<PaymentMethods
  :paymentMethods="methods"
  :onDeletePaymentMethod="handleDelete"
  :onMakeDefault="handleMakeDefault"
/>
```

### DefaultPaymentMethod Component

```stx
<script server>
const defaultMethod = {
  id: 1,
  brand: 'Visa',
  last_four: '4242',
  exp_month: 12,
  exp_year: 2025
}
</script>

<DefaultPaymentMethod :paymentMethod="defaultMethod" />
```

### SubscriptionCheckout Component

```stx
<script server>
const cartProducts = [
  {
    id: 1,
    name: 'Premium Subscription',
    price: 99900, // $999.00 in cents
    images: '/images/subscription.jpg',
    quantity: 1
  }
]

const handleCheckoutComplete = (result) => {
  if (result.success) {
    console.log('Payment successful!')
    // Redirect to success page
  }
}
</script>

<SubscriptionCheckout
  :products="cartProducts"
  stripePublicKey="pk_test_..."
  apiUrl="https://api.example.com/payments"
  :shipping="4500"
  :taxes="552"
  :onSubmit="handleCheckoutComplete"
/>
```

## Props

### Checkout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `products` | `Product[]` | `[]` | Products in cart |
| `mode` | `'subscription' \| 'one-time'` | `'subscription'` | Payment mode |
| `stripePublicKey` | `string` | - | Stripe publishable key (required) |
| `apiUrl` | `string` | - | Base API URL (required) |
| `redirectUrl` | `string` | `''` | Redirect URL after payment |
| `onSubmit` | `function` | - | Callback when payment completes |
| `onRemoveProduct` | `function` | - | Callback when product removed from cart |
| `shipping` | `number` | `0` | Shipping cost in cents |
| `taxes` | `number` | `0` | Tax amount in cents |
| `className` | `string` | `''` | Additional CSS classes |

### PaymentMethods Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `paymentMethods` | `PaymentMethod[]` | `[]` | Array of payment methods |
| `onDeletePaymentMethod` | `function` | - | Callback when delete clicked |
| `onMakeDefault` | `function` | - | Callback when make default clicked |
| `isLoading` | `boolean` | `false` | Show loading state |
| `className` | `string` | `''` | Additional CSS classes |

### DefaultPaymentMethod Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `paymentMethod` | `PaymentMethod \| null` | - | Default payment method or null |
| `isLoading` | `boolean` | `false` | Show loading state |
| `className` | `string` | `''` | Additional CSS classes |

### SubscriptionCheckout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `products` | `Product[]` | `[]` | Products in cart |
| `stripePublicKey` | `string` | - | Stripe publishable key (required) |
| `apiUrl` | `string` | - | Base API URL (required) |
| `onSubmit` | `function` | - | Callback when payment completes |
| `onRemoveProduct` | `function` | - | Callback when product removed from cart |
| `shipping` | `number` | `0` | Shipping cost in cents |
| `taxes` | `number` | `0` | Tax amount in cents |
| `className` | `string` | `''` | Additional CSS classes |

## TypeScript Interfaces

```typescript
interface PaymentMethod {
  id: string | number
  brand: string
  last_four: string
  exp_month: number
  exp_year: number
  is_default?: boolean
}

interface Product {
  id: string | number
  name: string
  price: number // in cents
  images?: string
  quantity?: number
}
```

## Backend API Requirements

### Create Subscription Endpoint

Your `apiUrl` should implement a `POST /stripe/create-subscription` endpoint:

```typescript
// Example Express.js endpoint
app.post('/stripe/create-subscription', async (req, res) => {
  const { amount, quantity } = req.body

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
  })

  res.json({
    client_secret: paymentIntent.client_secret,
  })
})
```

**Note**: The endpoint path must be `{apiUrl}/stripe/create-subscription` to match the component's expectations.

## Features

- **Stripe Elements** - Integrated Stripe payment form
- **Payment Management** - View, delete, set default payment methods
- **Dark Mode** - Full dark mode support
- **Loading States** - Skeleton loaders while fetching data
- **Empty States** - Friendly messages when no payment methods
- **Responsive** - Mobile-friendly layouts
- **Accessible** - Proper ARIA labels and keyboard navigation
- **Confirmation** - Delete confirmation dialogs
- **Error Handling** - Graceful error messages
- **Modern ES Modules** - Clean export syntax
- **Headwind Styling** - Utility-first CSS classes

## Stripe.js Integration

The `SubscriptionCheckout` component automatically loads Stripe.js from the CDN. Make sure you have a valid Stripe account and publishable key.

### Test Cards

Use these test cards in development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3DS**: `4000 0027 6000 3184`

Use any future expiration date and any 3-digit CVC.

## Example: Full Payment Flow

```stx
<script server>
// Fetch payment methods
const paymentMethods = await fetch('/api/payment-methods').then(r => r.json())

// Fetch default payment method
const defaultMethod = paymentMethods.find(m => m.is_default)

// Cart products
const cart = [
  { id: 1, name: 'Product 1', price: 5000, quantity: 2 },
  { id: 2, name: 'Product 2', price: 3000, quantity: 1 },
]

const handleDelete = async (id) => {
  await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
  // Refetch payment methods
}

const handleMakeDefault = async (id) => {
  await fetch(`/api/payment-methods/${id}/default`, { method: 'POST' })
  // Refetch payment methods
}

const handleCheckout = (result) => {
  if (result.success) {
    window.location.href = '/thank-you'
  }
}
</script>

<!-- Default Payment Method -->
<DefaultPaymentMethod :paymentMethod="defaultMethod" />

<!-- All Payment Methods -->
<PaymentMethods
  :paymentMethods="paymentMethods"
  :onDeletePaymentMethod="handleDelete"
  :onMakeDefault="handleMakeDefault"
/>

<!-- Checkout Form -->
<SubscriptionCheckout
  :products="cart"
  stripePublicKey="pk_test_..."
  apiUrl="https://api.example.com/payments"
  :shipping="1000"
  :taxes="800"
  :onSubmit="handleCheckout"
/>
```

## Security Notes

- **Never** expose your Stripe secret key in client code
- Always validate payment amounts on the server
- Use HTTPS in production
- Implement proper authentication for payment management endpoints
- Verify webhook signatures from Stripe
