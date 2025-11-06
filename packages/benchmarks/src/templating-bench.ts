/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { bench, group, run } from 'mitata'
import ejs from 'ejs'
import pug from 'pug'
import Handlebars from 'handlebars'
import nunjucks from 'nunjucks'
import { Liquid } from 'liquidjs'
import { processDirectives } from '@stacksjs/stx'
import { defaultConfig } from '@stacksjs/stx'

// Configure nunjucks
nunjucks.configure(join(import.meta.dir, '../fixtures/templates'), {
  autoescape: true,
  noCache: false,
})

// Configure liquidjs
const liquid = new Liquid({
  root: join(import.meta.dir, '../fixtures/templates'),
  extname: '.liquid',
})

// Load template files
const fixturesDir = join(import.meta.dir, '../fixtures')
const templatesDir = join(fixturesDir, 'templates')

const stxSimple = readFileSync(join(fixturesDir, 'template-simple.stx'), 'utf-8')
const stxComplex = readFileSync(join(fixturesDir, 'template-complex.stx'), 'utf-8')

const ejsSimple = readFileSync(join(templatesDir, 'simple.ejs'), 'utf-8')
const ejsComplex = readFileSync(join(templatesDir, 'complex.ejs'), 'utf-8')

const pugSimple = readFileSync(join(templatesDir, 'simple.pug'), 'utf-8')

const hbsSimple = readFileSync(join(templatesDir, 'simple.hbs'), 'utf-8')
const hbsComplex = readFileSync(join(templatesDir, 'complex.hbs'), 'utf-8')

const njkSimple = readFileSync(join(templatesDir, 'simple.njk'), 'utf-8')

const liquidSimple = readFileSync(join(templatesDir, 'simple.liquid'), 'utf-8')

const bladeSimple = join(templatesDir, 'simple.blade.php')
const bladeComplex = join(templatesDir, 'complex.blade.php')

// Compile templates (for engines that support pre-compilation)
const ejsSimpleCompiled = ejs.compile(ejsSimple)
const ejsComplexCompiled = ejs.compile(ejsComplex)

const pugSimpleCompiled = pug.compile(pugSimple)

const hbsSimpleTemplate = Handlebars.compile(hbsSimple)
const hbsComplexTemplate = Handlebars.compile(hbsComplex)

const njkSimpleTemplate = nunjucks.compile(njkSimple)

const liquidSimpleTemplate = liquid.parse(liquidSimple)

// Test data
const simpleData = {
  title: 'Hello World',
  heading: 'Welcome to Benchmarks',
  message: 'This is a simple template rendering test.',
  showFooter: true,
  footer: 'Copyright 2025',
}

const complexData = {
  title: 'E-commerce Store',
  description: 'The best online shopping experience',
  heading: 'Featured Products',
  user: {
    name: 'John Doe',
    isAdmin: true,
  },
  navItems: [
    { url: '/home', label: 'Home' },
    { url: '/products', label: 'Products' },
    { url: '/about', label: 'About' },
    { url: '/contact', label: 'Contact' },
  ],
  products: [
    {
      name: 'Product 1',
      description: 'Amazing product',
      price: 99.99,
      originalPrice: 149.99,
      onSale: true,
      inStock: true,
    },
    {
      name: 'Product 2',
      description: 'Another great product',
      price: 49.99,
      onSale: false,
      inStock: true,
    },
    {
      name: 'Product 3',
      description: 'Out of stock item',
      price: 79.99,
      onSale: false,
      inStock: false,
    },
  ],
  showTestimonials: true,
  testimonials: [
    { text: 'Great service!', author: 'Alice' },
    { text: 'Fast shipping!', author: 'Bob' },
    { text: 'Quality products!', author: 'Carol' },
  ],
  footer: 'Contact us at info@example.com',
  year: 2025,
  company: 'Example Corp',
}

// Helper function to check if PHP is available
function isPhpAvailable(): boolean {
  try {
    execSync('php --version', { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

// Helper function to render Laravel Blade template via PHP
function renderBlade(templatePath: string, data: any): string {
  // Create a simplified data object without the extra stx context
  const cleanData = { ...data }
  delete cleanData.__sections
  delete cleanData.__stx_options
  delete cleanData.__translations
  delete cleanData.__locale
  delete cleanData.__i18nConfig

  // Write data to a temp file to avoid command line escaping issues
  const tempDataFile = join(templatesDir, '.temp-data.json')
  const tempResultFile = join(templatesDir, '.temp-result.html')

  try {
    const fs = require('node:fs')
    fs.writeFileSync(tempDataFile, JSON.stringify(cleanData))

    const phpCode = `<?php
require_once '${templatesDir}/blade-renderer.php';
$data = json_decode(file_get_contents('${tempDataFile}'), true);
$result = renderBlade('${templatePath}', $data);
file_put_contents('${tempResultFile}', $result);
echo $result;
?>`

    const result = execSync(`php -r ${JSON.stringify(phpCode)}`, {
      encoding: 'utf-8',
    })

    // Clean up temp files
    if (fs.existsSync(tempDataFile)) fs.unlinkSync(tempDataFile)
    if (fs.existsSync(tempResultFile)) fs.unlinkSync(tempResultFile)

    return result
  }
  catch (error: any) {
    // Clean up temp files on error
    const fs = require('node:fs')
    if (fs.existsSync(tempDataFile)) fs.unlinkSync(tempDataFile)
    if (fs.existsSync(tempResultFile)) fs.unlinkSync(tempResultFile)
    throw error
  }
}

console.log('\n⚡ Template Engine Benchmarks (using Mitata)\n')
console.log('='.repeat(70))

let bladeAvailable = false
try {
  if (isPhpAvailable()) {
    // Test if Blade rendering works
    renderBlade(bladeSimple, { test: 'value', showFooter: false })
    bladeAvailable = true
  }
}
catch {
  // Blade not available or not working
}

if (!bladeAvailable) {
  console.log('\n⚠️  Warning: Laravel Blade benchmarks will be skipped.')
  console.log('   (PHP not found or Blade renderer has issues)\n')
}

// Simple Template Benchmarks
group('Simple Template Rendering', () => {
  bench('@stacksjs/stx', async () => {
    await processDirectives(stxSimple, simpleData, 'simple.stx', defaultConfig, new Set())
  })

  bench('EJS', () => {
    ejsSimpleCompiled(simpleData)
  })

  bench('Pug', () => {
    pugSimpleCompiled(simpleData)
  })

  bench('Handlebars', () => {
    hbsSimpleTemplate(simpleData)
  })

  bench('Nunjucks', () => {
    njkSimpleTemplate.render(simpleData)
  })

  bench('Liquid', async () => {
    await liquid.render(liquidSimpleTemplate, simpleData)
  })

  if (bladeAvailable) {
    bench('Laravel Blade (PHP)', () => {
      renderBlade(bladeSimple, simpleData)
    })
  }
})

// Complex Template Benchmarks
group('Complex Template Rendering (loops, conditionals, nested data)', () => {
  bench('@stacksjs/stx', async () => {
    await processDirectives(stxComplex, complexData, 'complex.stx', defaultConfig, new Set())
  })

  bench('EJS', () => {
    ejsComplexCompiled(complexData)
  })

  bench('Handlebars', () => {
    hbsComplexTemplate(complexData)
  })

  if (bladeAvailable) {
    bench('Laravel Blade (PHP)', () => {
      renderBlade(bladeComplex, complexData)
    })
  }
})

await run({
  percentiles: false,
})

console.log('\n' + '='.repeat(70))
console.log('\n📊 Benchmark Notes:\n')
console.log('- All templates are pre-compiled where supported')
console.log('- @stacksjs/stx runs on Bun runtime (native performance)')
console.log('- Laravel Blade runs via PHP CLI (includes process overhead)')
console.log('- Results show operations per second (higher is better)')
console.log('- Mitata provides accurate statistical analysis with minimal overhead')
console.log('\n' + '='.repeat(70) + '\n')
