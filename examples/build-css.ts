// Build script for generating headwind CSS for voide app
import { build, defaultConfig } from '/Users/glennmichaeltorregosa/Documents/Projects/headwind/packages/headwind/src/index.ts'

const result = await build({
  ...defaultConfig,
  content: ['./components/**/*.stx', './voide-refactored.stx'],
  output: './dist/voide.css',
  minify: false,
  safelist: [
    'border-solid',
    'bg-black',
    'opacity-60',
  ],
})

console.log(`Generated ${result.classes.size} classes in ${result.duration}ms`)
console.log(`Output: ./examples/dist/voide.css`)
