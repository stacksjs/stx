# Payment Components

Comprehensive payment components for Stripe integration, including payment method management and checkout flows.

## Component Syntax

stx supports multiple ways to use components:

### 1. @component Directive with Object Shorthand (Recommended)
```stx
@component('Checkout', {
  products,
  stripePublicKey,
  apiUrl
})
@endcomponent
```

### 2. @component Directive with Full Props
```stx
@component('Checkout', {
  products: products,
  stripePublicKey: stripePublicKey,
  apiUrl: apiUrl
})
@endcomponent
```

### 3. PascalCase Component Tags (Vue-like)
```stx
<Checkout
  :products="products"
  :stripePublicKey="stripePublicKey"
  :apiUrl="apiUrl"
/>
```

### 4. PascalCase with Static Values
```stx
<Checkout
  products="[]"
  stripePublicKey="pk_test_..."
  apiUrl="https://api.example.com"
/>
```

All syntaxes are equivalent and can be used interchangeably based on your preference.

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

### Checkout Component (Recommended)

**Using @component directive with object shorthand:**

```stx
<script>
export const products = [
  {
    id: 1,
    name: 'Premium Subscription',
    price: 99900, // $999.00 in cents
    images: '/images/subscription.jpg',
    quantity: 1
  }
]

export const mode = 'subscription'
export const stripePublicKey = 'pk_test_...'
export const apiUrl = 'https://api.example.com'
export const redirectUrl = '/thank-you'
export const shipping = 4500
export const taxes = 552

export const onSubmit = (result) => {
  if (result.success) {
    console.log('Payment successful!')
    window.location.href = redirectUrl
  }
}

export const onRemoveProduct = (productId) => {
  console.log('Remove product:', productId)
  // Update cart state
}
</script>

@component('Checkout', {
  products,
  mode,
  stripePublicKey,
  apiUrl,
  redirectUrl,
  shipping,
  taxes,
  onSubmit,
  onRemoveProduct
})
@endcomponent
```

**Or using Vue-like PascalCase syntax:**

```stx
<script>
export const products = [...]
export const stripePublicKey = 'pk_test_...'
export const apiUrl = 'https://api.example.com'
// ... other exports
</script>

<Checkout
  :products="products"
  mode="subscription"
  :stripePublicKey="stripePublicKey"
  :apiUrl="apiUrl"
  redirectUrl="/thank-you"
  :shipping="4500"
  :taxes="552"
  :onSubmit="onSubmit"
  :onRemoveProduct="onRemoveProduct"
/>
```

### PaymentMethods Component

```stx
<script>
export const methods = [
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

export const handleDelete = (id) => {
  console.log('Delete payment method:', id)
  // Call your API to delete
}

export const handleMakeDefault = (id) => {
  console.log('Make default:', id)
  // Call your API to set as default
}
</script>

@component('PaymentMethods', {
  paymentMethods: methods,
  onDeletePaymentMethod: handleDelete,
  onMakeDefault: handleMakeDefault,
  isLoading: false
})
@endcomponent
```

### DefaultPaymentMethod Component

```stx
<script>
export const defaultMethod = {
  id: 1,
  brand: 'Visa',
  last_four: '4242',
  exp_month: 12,
  exp_year: 2025
}
</script>

@component('DefaultPaymentMethod', {
  paymentMethod: defaultMethod,
  isLoading: false
})
@endcomponent
```

### SubscriptionCheckout Component

```stx
<script>
export const cartProducts = [
  {
    id: 1,
    name: 'Premium Subscription',
    price: 99900, // $999.00 in cents
    images: '/images/subscription.jpg',
    quantity: 1
  }
]

export const handleCheckoutComplete = (result) => {
  if (result.success) {
    console.log('Payment successful!')
    // Redirect to success page
  }
}
</script>

@component('SubscriptionCheckout', {
  products: cartProducts,
  stripePublicKey: 'pk_test_...',
  apiUrl: 'https://api.example.com/payments',
  shipping: 4500, // $45.00 in cents
  taxes: 552, // $5.52 in cents
  onSubmit: handleCheckoutComplete
})
@endcomponent
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
<script>
// Fetch payment methods
export const paymentMethods = await fetch('/api/payment-methods').then(r => r.json())

// Fetch default payment method
export const defaultMethod = paymentMethods.find(m => m.is_default)

// Cart products
export const cart = [
  { id: 1, name: 'Product 1', price: 5000, quantity: 2 },
  { id: 2, name: 'Product 2', price: 3000, quantity: 1 },
]

export const handleDelete = async (id) => {
  await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
  // Refetch payment methods
}

export const handleMakeDefault = async (id) => {
  await fetch(`/api/payment-methods/${id}/default`, { method: 'POST' })
  // Refetch payment methods
}

export const handleCheckout = (result) => {
  if (result.success) {
    window.location.href = '/thank-you'
  }
}
</script>

<!-- Default Payment Method -->
@component('DefaultPaymentMethod', {
  paymentMethod: defaultMethod
})
@endcomponent

<!-- All Payment Methods -->
@component('PaymentMethods', {
  paymentMethods: paymentMethods,
  onDeletePaymentMethod: handleDelete,
  onMakeDefault: handleMakeDefault
})
@endcomponent

<!-- Checkout Form -->
@component('SubscriptionCheckout', {
  products: cart,
  stripePublicKey: 'pk_test_...',
  apiUrl: 'https://api.example.com/payments',
  shipping: 1000,
  taxes: 800,
  onSubmit: handleCheckout
})
@endcomponent
```

## Security Notes

- **Never** expose your Stripe secret key in client code
- Always validate payment amounts on the server
- Use HTTPS in production
- Implement proper authentication for payment management endpoints
- Verify webhook signatures from Stripe
