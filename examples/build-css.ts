// Build script for generating headwind CSS for voide app
import { buildAndWrite, defaultConfig, tailwindPreflight } from '/Users/glennmichaeltorregosa/Documents/Projects/headwind/packages/headwind/src/index.ts'
import type { Preflight } from '/Users/glennmichaeltorregosa/Documents/Projects/headwind/packages/headwind/src/types.ts'

// Custom form reset preflight for dark mode apps
// This allows utility classes to properly style form elements
const darkFormReset: Preflight = {
  getCSS: () => `
/* Dark Mode Form Reset - allows utility classes to work */
input,
select,
textarea {
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

input::placeholder,
textarea::placeholder {
  color: inherit;
  opacity: 0.5;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
}
`.trim(),
}

const result = await buildAndWrite({
  ...defaultConfig,
  content: ['./components/**/*.stx', './voide-refactored.stx'],
  output: './dist/voide.css',
  minify: false,
  preflights: [tailwindPreflight, darkFormReset],
  safelist: [
    'border-solid',
    'bg-black',
    'opacity-60',
    'appearance-none',
  ],
})

console.log(`Generated ${result.classes.size} classes in ${result.duration}ms`)
console.log(`Output: ./dist/voide.css`)
