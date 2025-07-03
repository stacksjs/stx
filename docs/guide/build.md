# Build

This guide covers the build process and configuration options for STX applications.

## Build Configuration

### Basic Configuration

Configure your build in `stx.config.ts`:

```ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',
    
    // Base public path
    base: '/',
    
    // Enable/disable minification
    minify: true,
    
    // Generate source maps
    sourcemap: true,
    
    // Target environment
    target: 'esnext',
    
    // Bundle configuration
    rollupOptions: {
      external: ['some-external-dependency'],
      output: {
        manualChunks: {
          'vendor': ['lodash', 'axios'],
          'components': ['./src/components/']
        }
      }
    }
  }
})
```

### Environment-specific Configuration

Create environment-specific builds:

```ts
// stx.config.ts
export default defineConfig({
  build: {
    env: {
      development: {
        sourcemap: true,
        minify: false
      },
      production: {
        sourcemap: false,
        minify: true,
        drop_console: true
      },
      staging: {
        sourcemap: true,
        minify: true
      }
    }
  }
})
```

## Asset Handling

### Static Assets

Configure static asset handling:

```ts
export default defineConfig({
  build: {
    // Directory for static assets
    assetsDir: 'assets',
    
    // Inline small files as base64
    assetsInlineLimit: 4096,
    
    // Custom asset naming
    assetsPattern: 'assets/[name].[hash].[ext]',
    
    // Asset types to process
    assetsInclude: ['**/*.{png,jpg,gif,svg,woff,woff2}']
  }
})
```

### Asset Optimization

Optimize assets during build:

```ts
export default defineConfig({
  build: {
    // Image optimization
    imageOptimizer: {
      enabled: true,
      options: {
        quality: 80,
        progressive: true
      }
    },
    
    // SVG optimization
    svgo: {
      enabled: true,
      options: {
        multipass: true,
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeDimensions', active: true }
        ]
      }
    }
  }
})
```

## CSS Processing

### CSS Configuration

Configure CSS processing:

```ts
export default defineConfig({
  css: {
    // Enable/disable CSS code splitting
    codeSplit: true,
    
    // Enable/disable CSS source maps
    sourcemap: true,
    
    // PostCSS configuration
    postcss: {
      plugins: [
        autoprefixer(),
        cssnano({ preset: 'default' })
      ]
    },
    
    // CSS modules configuration
    modules: {
      scopeBehaviour: 'local',
      generateScopedName: '[name]_[local]_[hash:base64:5]'
    }
  }
})
```

### CSS Preprocessors

Set up CSS preprocessors:

```ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
        includePaths: ['node_modules']
      },
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1890ff'
        }
      }
    }
  }
})
```

## Build Optimization

### Code Splitting

Configure code splitting:

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Split vendor chunks
        manualChunks: {
          'vendor': ['lodash', 'axios'],
          'ui': ['./src/components/'],
          'utils': ['./src/utils/']
        },
        
        // Custom chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
```

### Tree Shaking

Enable advanced tree shaking:

```ts
export default defineConfig({
  build: {
    // Enable tree shaking
    treeShaking: true,
    
    // Configure tree shaking
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    }
  }
})
```

## Build Hooks

### Custom Build Plugins

Create build plugins:

```ts
function myBuildPlugin() {
  return {
    name: 'my-build-plugin',
    
    // Before build starts
    buildStart() {
      console.log('Build starting...')
    },
    
    // After build completes
    buildEnd() {
      console.log('Build complete!')
    },
    
    // Transform code
    transform(code, id) {
      if (id.endsWith('.stx')) {
        return {
          code: transformSTXCode(code),
          map: null
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    myBuildPlugin()
  ]
})
```

### Build Events

Listen to build events:

```ts
export default defineConfig({
  build: {
    events: {
      onStart() {
        console.log('Build starting...')
      },
      
      onEnd(result) {
        console.log('Build complete:', result)
      },
      
      onError(error) {
        console.error('Build failed:', error)
      }
    }
  }
})
```

## Production Deployment

### Build for Production

Run production build:

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Build Analysis

Analyze build output:

```ts
export default defineConfig({
  build: {
    // Enable build analysis
    analyze: {
      enabled: true,
      template: 'treemap', // or 'sunburst'
      open: true // Open analyzer in browser
    }
  }
})
```

## Best Practices

1. **Performance**
   - Enable code splitting
   - Configure tree shaking
   - Optimize assets
   - Use production mode

2. **Asset Management**
   - Set appropriate limits
   - Optimize images
   - Handle fonts properly
   - Configure caching

3. **Configuration**
   - Use environment configs
   - Set proper targets
   - Handle dependencies
   - Monitor build size

4. **Optimization**
   - Minimize bundle size
   - Reduce load time
   - Enable compression
   - Cache effectively

## Next Steps

- Learn about [Deployment](/features/deployment)
- Explore [Performance](/features/performance)
- Check out [Testing](/features/testing)
- Review [Security](/features/security) 