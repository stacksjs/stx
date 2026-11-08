import { processComponentDirectives } from '../../../src/component-processing'
import { processComponents } from '../../../src/component-renderer'

const [mode, componentsDir, template] = process.argv.slice(2)
const context = {}
const dependencies = new Set<string>()
const file = `${componentsDir}/page.stx`
const output = mode === 'renderer'
  ? await processComponents(template, context, file, { componentsDir }, dependencies)
  : await processComponentDirectives(template, context, file, componentsDir, {}, dependencies)
console.log(JSON.stringify(output))
