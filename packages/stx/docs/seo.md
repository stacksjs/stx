# STX SEO Features

STX includes comprehensive SEO capabilities that make it easy to optimize your web pages for search engines and social media sharing. This document covers how to use the SEO directives, configuration options, and best practices.

## Available SEO Directives

### @meta Directive

The `@meta` directive allows you to add meta tags to your HTML document.

```html
@meta("description", "This is a description of my page")
@meta("keywords", "stx, templating, seo")
@meta("author", "STX Team")
```

You can also use the shorthand format for Open Graph properties:

```html
@meta("og:title")  <!-- Will use context.title or context.openGraph.title -->
@meta("og:description")  <!-- Will use context.description or context.openGraph.description -->
```

### @metaTag Directive

For more control over meta tag attributes, you can use the `@metaTag` directive:

```html
@metaTag({ name: "viewport", content: "width=device-width, initial-scale=1.0" })
@metaTag({ property: "og:image", content: "https://example.com/image.jpg" })
@metaTag({ httpEquiv: "content-type", content: "text/html; charset=UTF-8" })
```

### @seo Directive

The `@seo` directive provides a comprehensive way to define all your SEO metadata in one place:

```html
@seo({
  title: "My Page Title",
  description: "A detailed description of this page",
  keywords: ["stx", "templates", "seo"],
  canonical: "https://example.com/my-page",
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "My OpenGraph Title",
    description: "OpenGraph description for social sharing",
    image: "https://example.com/og-image.jpg",
    imageAlt: "Description of the image",
    imageWidth: 1200,
    imageHeight: 630,
    siteName: "My STX Website"
  },
  twitter: {
    card: "summary_large_image",
    site: "@mysitehandle",
    creator: "@myhandle",
    title: "My Twitter Card Title",
    description: "Twitter card description"
  }
})
```

This directive will generate all the necessary meta tags based on the provided configuration.

### @structuredData Directive

The `@structuredData` directive allows you to add structured data (JSON-LD) to your pages for rich results in search engines:

```html
@structuredData({
  "@type": "Product",
  "name": "Executive Leather Chair",
  "description": "A comfortable leather chair for your office",
  "brand": {
    "@type": "Brand",
    "name": "ComfortDesign"
  },
  "offers": {
    "@type": "Offer",
    "price": 299.99,
    "priceCurrency": "USD"
  }
})
```

You can also use variables from the context:

```html
@structuredData({
  "@type": "Product",
  "name": productName,
  "price": productPrice,
  "description": productDescription
})
```

## Automatic SEO Tags

STX can automatically inject SEO tags into your pages based on configuration. Set this up in your STX configuration:

```javascript
// stx.config.ts
export default {
  // ... other config options
  seo: {
    enabled: true,
    socialPreview: true,
    defaultImage: "https://example.com/default-og-image.jpg",
    defaultConfig: {
      title: "My STX Website",
      description: "A site built with the STX templating engine"
    }
  }
}
```

With this configuration, STX will:

1. Automatically add title, description and other meta tags if not already present
2. Generate Open Graph and Twitter Card tags for social sharing
3. Use values from the page context if available (e.g., `context.title`, `context.description`)

## Using SEO Features with Page Context

The most powerful way to use STX SEO features is by providing a rich context object:

```javascript
const context = {
  title: "Product Page - Executive Chair",
  description: "Our premium executive leather chair provides maximum comfort for long work sessions",
  pageUrl: "https://example.com/products/executive-chair",
  productName: "Executive Leather Chair",
  productPrice: 299.99,
  productImage: "https://example.com/images/executive-chair.jpg",
  openGraph: {
    title: "Premium Executive Chair - Special Offer"  // Override for social sharing
  }
};

// Render template with this context
await renderTemplate("product.stx", context);
```

Then in your template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  @meta("viewport", "width=device-width, initial-scale=1.0")

  @seo({
    title: title,
    description: description,
    canonical: pageUrl,
    openGraph: {
      type: "product",
      image: productImage,
      siteName: "My E-Commerce Site"
    },
    twitter: {
      card: "summary_large_image"
    }
  })

  @structuredData({
    "@type": "Product",
    "name": productName,
    "image": productImage,
    "offers": {
      "@type": "Offer",
      "price": productPrice,
      "priceCurrency": "USD"
    }
  })
</head>
<body>
  <!-- Rest of your template -->
</body>
</html>
```

## Best Practices

1. **Use Meaningful Titles and Descriptions**: Each page should have a unique title and description.

2. **Optimize for Social Sharing**: Include OpenGraph and Twitter Card metadata for better social media sharing.

3. **Add Structured Data**: Use JSON-LD to provide search engines with structured information about your content.

4. **Set Canonical URLs**: Prevent duplicate content issues by specifying canonical URLs.

5. **Use Context Variables**: Keep your SEO data in your context objects for consistency and maintainability.

6. **Test Your Metadata**: Use tools like Google's Structured Data Testing Tool, Facebook's Sharing Debugger, and Twitter's Card Validator to test your metadata.

## Types

STX provides TypeScript types for SEO configuration:

```typescript
// SeoConfig for the @seo directive
interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  robots?: string;
  canonical?: string;
  openGraph?: OpenGraphConfig;
  twitter?: TwitterConfig;
  structuredData?: Record<string, any>;
}

// OpenGraphConfig for social sharing on Facebook, LinkedIn, etc.
interface OpenGraphConfig {
  type?: string;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  siteName?: string;
}

// TwitterConfig for Twitter Cards
interface TwitterConfig {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
}

// STX config for SEO features
interface SeoFeatureConfig {
  enabled: boolean;
  defaultConfig?: SeoConfig;
  socialPreview?: boolean;
  defaultImage?: string;
}
```