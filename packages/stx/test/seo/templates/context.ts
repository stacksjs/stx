/**
 * Product context interface
 */
interface ProductContext {
  // Page metadata
  pageTitle: string
  pageDescription: string
  pageUrl: string

  // Product details
  productName: string
  productDescription: string
  productPrice: number
  productSku: string
  productBrand: string
  productRating: number
  reviewCount: number

  // Images
  productImage: string
  productImageAlt: string

  // OpenGraph specific overrides
  openGraph: {
    title: string
  }

  // Current year for footer
  currentYear: number
}

/**
 * Context data for SEO example template
 */
export const productContext: ProductContext = {
  // Page metadata
  pageTitle: 'Premium Ergonomic Chair | STX Demo Store',
  pageDescription: 'Experience ultimate comfort with our premium ergonomic office chair. Designed for long work sessions with lumbar support and adjustable features.',
  pageUrl: 'https://example.com/products/ergonomic-chair',

  // Product details
  productName: 'Premium Ergonomic Office Chair',
  productDescription: 'This premium ergonomic office chair is designed to provide maximum comfort during long work sessions. Features include adjustable height, tilt mechanism, lumbar support, and breathable mesh back.',
  productPrice: 299.99,
  productSku: 'CHAIR-ERG-001',
  productBrand: 'ComfortDesign',
  productRating: 4.7,
  reviewCount: 234,

  // Images
  productImage: 'https://example.com/images/products/ergonomic-chair.jpg',
  productImageAlt: 'Premium Ergonomic Office Chair with black mesh back and adjustable armrests',

  // OpenGraph specific overrides
  openGraph: {
    title: 'Premium Ergonomic Chair - Best Seller | STX Demo Store',
  },

  // Current year for footer
  currentYear: new Date().getFullYear(),
}
