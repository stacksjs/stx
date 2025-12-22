import { build, defaultConfig, tailwindPreflight } from '@stacksjs/headwind'
import type { Preflight } from '@stacksjs/headwind'

// Custom form reset preflight for dark mode apps
const darkFormReset: Preflight = {
  getCSS: () => `
/* Dark Mode Form Reset */
input, select, textarea {
  appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  border-color: currentColor;
  border-width: 0;
  border-radius: 0;
  padding: 0;
}
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b949e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem;
}
input::placeholder, textarea::placeholder {
  color: inherit;
  opacity: 0.5;
}
input:focus, select:focus, textarea:focus {
  outline: none;
}
`.trim(),
}

// Headwind config for voide
const headwindConfig = {
  ...defaultConfig,
  content: ['./components/**/*.stx', './voide-refactored.stx'],
  output: './dist/voide.css',
  minify: false,
  preflights: [tailwindPreflight, darkFormReset],
  safelist: ['border-solid', 'bg-black', 'opacity-60', 'appearance-none'],
}

const _server = Bun.serve({
  port: 3000,
  development: true,
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname
    if (path === '/')
      path = '/homepage.stx'

    try {
      // Generate CSS on-the-fly for voide.css
      if (path === '/dist/voide.css') {
        console.log('Building CSS on-the-fly...')
        const result = await build(headwindConfig)
        console.log(`Generated ${result.classes.size} classes in ${result.duration.toFixed(1)}ms`)
        return new Response(result.css, {
          headers: {
            'Content-Type': 'text/css',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
      }

      const file = Bun.file(`.${path}`)
      const exists = await file.exists()
      if (!exists) {
        console.log('404:', path)
        return new Response(`File not found: ${path}`, { status: 404 })
      }
      console.log('200:', path)

      // Transpile TypeScript files on the fly
      if (path.endsWith('.ts')) {
        const transpiler = new Bun.Transpiler({ loader: 'ts' })
        const code = await file.text()
        const js = transpiler.transformSync(code)
        return new Response(js, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
      }

      // Serve .stx files as HTML
      if (path.endsWith('.stx')) {
        return new Response(file, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
      }

      return new Response(file, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }
    catch (err: any) {
      console.error('Error:', err)
      return new Response(`Error: ${err.message}`, { status: 500 })
    }
  },
})

console.log('✓ Server running at http://localhost:3000')
console.log('✓ Voide: http://localhost:3000/voide-refactored.stx')
console.log('✓ CSS generated on-the-fly (Tailwind-style JIT)')
console.log('Press Ctrl+C to stop')
