/**
 * Preview data for the welcome email template
 *
 * This data is used when generating SSG previews.
 * In production, the actual data comes from your backend.
 */

export default {
  user: {
    name: 'Barack Obama',
    email: 'barack@example.com',
    joinDate: 'January 21, 2026',
    plan: 'Premium',
  },

  order: {
    items: [
      { name: 'Annual Subscription', price: '$99.00' },
      { name: 'Premium Add-on', price: '$29.00' },
      { name: 'Priority Support', price: '$19.00' },
    ],
    total: '$147.00',
  },

  activationLink: 'https://example.com/activate?token=abc123',

  currentYear: new Date().getFullYear(),
}
