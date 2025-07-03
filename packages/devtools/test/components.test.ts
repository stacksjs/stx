import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-components')
const PACKAGE_ROOT = path.resolve(TEST_DIR, '..')

describe('DEVTOOLS: STX Components Tests', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should have Card component file', async () => {
    const cardPath = path.join(PACKAGE_ROOT, 'src/components/Card.stx')
    const exists = await Bun.file(cardPath).exists()
    expect(exists).toBe(true)
    
    const content = await Bun.file(cardPath).text()
    expect(content).toContain('<div')
    expect(content.length).toBeGreaterThan(0)
  })

  test('should have PerformanceChart component file', async () => {
    const chartPath = path.join(PACKAGE_ROOT, 'src/components/PerformanceChart.stx')
    const exists = await Bun.file(chartPath).exists()
    expect(exists).toBe(true)
    
    const content = await Bun.file(chartPath).text()
    expect(content).toContain('<div')
    expect(content.length).toBeGreaterThan(0)
  })

  test('should have TemplateDetails component file', async () => {
    const templatePath = path.join(PACKAGE_ROOT, 'src/components/TemplateDetails.stx')
    const exists = await Bun.file(templatePath).exists()
    expect(exists).toBe(true)
    
    const content = await Bun.file(templatePath).text()
    expect(content).toContain('<div')
    expect(content.length).toBeGreaterThan(0)
  })

  test('should have valid STX syntax in Card component', async () => {
    const cardPath = path.join(PACKAGE_ROOT, 'src/components/Card.stx')
    const content = await Bun.file(cardPath).text()
    
    // Check for STX directives
    expect(content).toMatch(/@if|@foreach|@endif|@endforeach|\{\{|\}\}/)
    
    // Check for proper HTML structure
    expect(content).toMatch(/<div[^>]*>/)
    expect(content).toMatch(/<\/div>/)
  })

  test('should have valid STX syntax in PerformanceChart component', async () => {
    const chartPath = path.join(PACKAGE_ROOT, 'src/components/PerformanceChart.stx')
    const content = await Bun.file(chartPath).text()
    
    // Check for STX directives (performance charts likely use loops for data)
    expect(content).toMatch(/@if|@foreach|@endif|@endforeach|\{\{|\}\}/)
    
    // Check for chart-related elements
    expect(content).toMatch(/<div[^>]*>|<canvas[^>]*>|<svg[^>]*>/)
  })

  test('should have valid STX syntax in TemplateDetails component', async () => {
    const templatePath = path.join(PACKAGE_ROOT, 'src/components/TemplateDetails.stx')
    const content = await Bun.file(templatePath).text()
    
    // Check for STX directives
    expect(content).toMatch(/@if|@foreach|@endif|@endforeach|\{\{|\}\}/)
    
    // Check for details-related elements
    expect(content).toMatch(/<div[^>]*>|<dl[^>]*>|<ul[^>]*>|<table[^>]*>/)
  })

  test('should validate MainLayout structure', async () => {
    const layoutPath = path.join(PACKAGE_ROOT, 'src/layouts/MainLayout.stx')
    const exists = await Bun.file(layoutPath).exists()
    expect(exists).toBe(true)
    
    const content = await Bun.file(layoutPath).text()
    
    // Layout should have basic HTML structure
    expect(content).toContain('<!DOCTYPE html>')
    expect(content).toContain('<html')
    expect(content).toContain('<head>')
    expect(content).toContain('<body>')
    expect(content).toContain('</html>')
    
    // Should have STX content placeholders
    expect(content).toMatch(/@yield|@include|\{\{|\}\}/)
  })

  test('should validate view files exist', async () => {
    const views = [
      'src/views/index.stx',
      'src/views/dashboard.stx',
      'src/views/performance.stx',
      'src/views/templates.stx',
      'src/views/config.stx'
    ].map(view => path.join(PACKAGE_ROOT, view))
    
    for (const viewPath of views) {
      const exists = await Bun.file(viewPath).exists()
      expect(exists).toBe(true)
      
      const content = await Bun.file(viewPath).text()
      expect(content.length).toBeGreaterThan(0)
    }
  })

  test('should validate component syntax patterns', async () => {
    const componentPaths = [
      'src/components/Card.stx',
      'src/components/PerformanceChart.stx',
      'src/components/TemplateDetails.stx'
    ].map(component => path.join(PACKAGE_ROOT, component))
    
    for (const componentPath of componentPaths) {
      const content = await Bun.file(componentPath).text()
      
      // Check for balanced STX directives
      const ifCount = (content.match(/@if\b/g) || []).length
      const endifCount = (content.match(/@endif\b/g) || []).length
      expect(ifCount).toBe(endifCount)
      
      const foreachCount = (content.match(/@foreach\b/g) || []).length
      const endforeachCount = (content.match(/@endforeach\b/g) || []).length
      expect(foreachCount).toBe(endforeachCount)
      
      // Check for balanced braces
      const openBraces = (content.match(/\{\{/g) || []).length
      const closeBraces = (content.match(/\}\}/g) || []).length
      expect(openBraces).toBe(closeBraces)
    }
  })

  test('should validate HTML semantics in components', async () => {
    const componentPaths = [
      'src/components/Card.stx',
      'src/components/PerformanceChart.stx',
      'src/components/TemplateDetails.stx'
    ].map(component => path.join(PACKAGE_ROOT, component))
    
    for (const componentPath of componentPaths) {
      const content = await Bun.file(componentPath).text()
      
      // Check for proper HTML tag closure
      const openTags = content.match(/<(\w+)[^>]*>/g) || []
      const closeTags = content.match(/<\/(\w+)>/g) || []
      
      // Basic validation that we have some HTML structure
      expect(openTags.length).toBeGreaterThan(0)
      
      // Check for semantic HTML elements
      expect(content).toMatch(/<div|<section|<article|<header|<main|<aside|<footer/)
    }
  })
}) 