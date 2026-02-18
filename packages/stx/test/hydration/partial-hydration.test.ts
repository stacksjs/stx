import { describe, expect, it } from 'bun:test'
import {
  processPartialHydrationDirectives,
  processStaticDirectives,
  generatePartialHydrationCSS,
  createIslandRegistry,
  generateIslandManifest,
} from '../../src/partial-hydration'
import type { IslandComponent, HydrationOptions } from '../../src/partial-hydration'

describe('processPartialHydrationDirectives', () => {
  describe('@client:load', () => {
    it('should wrap content with data-strategy="load"', () => {
      const input = '@client:load\n  <div>Interactive</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="load"')
      expect(result).toContain('data-island=')
      expect(result).toContain('class="stx-island"')
      expect(result).toContain('<div>Interactive</div>')
    })

    it('should generate load hydration script', () => {
      const input = '@client:load\n  <div>Content</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('<script data-hydrate=')
      expect(result).toContain('classList.add')
    })
  })

  describe('@client:idle', () => {
    it('should wrap content with data-strategy="idle"', () => {
      const input = '@client:idle\n  <div>Idle content</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="idle"')
      expect(result).toContain('<div>Idle content</div>')
    })

    it('should include requestIdleCallback in script', () => {
      const input = '@client:idle\n  <div>Content</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('requestIdleCallback')
    })

    it('should parse priority option', () => {
      const input = '@client:idle(priority: high)\n  <div>High priority</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="idle"')
    })
  })

  describe('@client:visible', () => {
    it('should wrap content with data-strategy="visible"', () => {
      const input = '@client:visible\n  <div>Visible content</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="visible"')
      expect(result).toContain('IntersectionObserver')
    })

    it('should parse rootMargin option', () => {
      const input = "@client:visible(rootMargin: '200px')\n  <div>Content</div>\n@endclient"
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="visible"')
      expect(result).toContain('rootMargin')
      expect(result).toContain('200px')
    })

    it('should parse threshold option', () => {
      const input = '@client:visible(threshold: 0.5)\n  <div>Content</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('threshold')
    })
  })

  describe('@client:media', () => {
    it('should wrap content with data-strategy="media"', () => {
      const input = "@client:media(media: '(min-width: 768px)')\n  <div>Desktop only</div>\n@endclient"
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="media"')
      expect(result).toContain('matchMedia')
    })
  })

  describe('@client:hover', () => {
    it('should wrap content with data-strategy="hover"', () => {
      const input = '@client:hover\n  <div>Hover to hydrate</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="hover"')
      expect(result).toContain('mouseenter')
    })

    it('should include touch event listeners', () => {
      const input = '@client:hover\n  <div>Content</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('touchstart')
      expect(result).toContain('focusin')
    })
  })

  describe('@client:event', () => {
    it('should wrap content with data-strategy="event"', () => {
      const input = "@client:event(event: 'custom-trigger')\n  <div>Event content</div>\n@endclient"
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="event"')
      expect(result).toContain('custom-trigger')
    })
  })

  describe('@client:only', () => {
    it('should wrap content with client-only rendering', () => {
      const input = '@client:only\n  <div>Client only</div>\n@endclient'
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="only"')
      expect(result).toContain('stx-client-only')
      expect(result).toContain('data-client-content')
      expect(result).toContain('<template')
    })
  })

  describe('multiple directives', () => {
    it('should process multiple island directives in one template', () => {
      const input = `
        <header>Static</header>
        @client:load
          <nav>Interactive nav</nav>
        @endclient
        <main>Static main</main>
        @client:visible
          <div>Lazy widget</div>
        @endclient
      `
      const result = processPartialHydrationDirectives(input)

      expect(result).toContain('data-strategy="load"')
      expect(result).toContain('data-strategy="visible"')
      expect(result).toContain('Static')
      expect(result).toContain('Interactive nav')
      expect(result).toContain('Lazy widget')
    })
  })

  describe('no directives', () => {
    it('should return template unchanged when no directives present', () => {
      const input = '<div><p>No islands here</p></div>'
      const result = processPartialHydrationDirectives(input)

      expect(result).toBe(input)
    })
  })

  describe('unique island IDs', () => {
    it('should generate unique IDs for each island', () => {
      const input = `
        @client:load
          <div>First</div>
        @endclient
        @client:load
          <div>Second</div>
        @endclient
      `
      const result = processPartialHydrationDirectives(input)

      // Extract island IDs from the wrapper divs (not from inline scripts)
      const idValues: string[] = []
      const idRegex = /data-island="(island-[a-z0-9]+)"/g
      let m
      while ((m = idRegex.exec(result)) !== null) {
        idValues.push(m[1])
      }
      // Should have at least 2 island references
      expect(idValues.length).toBeGreaterThanOrEqual(2)
      // Extract unique IDs - there should be exactly 2 distinct IDs
      const uniqueIds = new Set(idValues)
      expect(uniqueIds.size).toBe(2)
    })
  })
})

describe('processStaticDirectives', () => {
  it('should wrap @static content in stx-static div', () => {
    const input = '@static\n  <div>Static content</div>\n@endstatic'
    const result = processStaticDirectives(input)

    expect(result).toContain('<div class="stx-static">')
    expect(result).toContain('<div>Static content</div>')
  })

  it('should not modify content without @static', () => {
    const input = '<div>Regular content</div>'
    const result = processStaticDirectives(input)
    expect(result).toBe(input)
  })
})

describe('generatePartialHydrationCSS', () => {
  it('should include island base styles', () => {
    const css = generatePartialHydrationCSS()

    expect(css).toContain('.stx-island')
    expect(css).toContain('display: contents')
  })

  it('should include client-only placeholder styles', () => {
    const css = generatePartialHydrationCSS()

    expect(css).toContain('.stx-client-only')
    expect(css).toContain('animation')
  })

  it('should include hydrated state styles', () => {
    const css = generatePartialHydrationCSS()

    expect(css).toContain('.hydrated')
    expect(css).toContain('opacity')
  })

  it('should include shimmer animation', () => {
    const css = generatePartialHydrationCSS()

    expect(css).toContain('island-shimmer')
    expect(css).toContain('@keyframes')
  })
})

describe('createIslandRegistry', () => {
  it('should create empty registry', () => {
    const registry = createIslandRegistry()
    expect(registry.islands.size).toBe(0)
  })

  it('should register an island', () => {
    const registry = createIslandRegistry()
    const island: IslandComponent = {
      id: 'test-1',
      component: 'Counter',
      props: { initial: 0 },
      options: { strategy: 'load' },
      serverHTML: '<div>0</div>',
      hydrated: false,
    }

    registry.register(island)
    expect(registry.islands.size).toBe(1)
    expect(registry.get('test-1')).toBeDefined()
    expect(registry.get('test-1')?.component).toBe('Counter')
  })

  it('should return undefined for non-existent island', () => {
    const registry = createIslandRegistry()
    expect(registry.get('does-not-exist')).toBeUndefined()
  })

  it('should mark island as hydrated', async () => {
    const registry = createIslandRegistry()
    registry.register({
      id: 'test-1',
      component: 'Widget',
      props: {},
      options: { strategy: 'load' },
      serverHTML: '<div>Widget</div>',
      hydrated: false,
    })

    await registry.hydrate('test-1')
    expect(registry.get('test-1')?.hydrated).toBe(true)
  })

  it('should not re-hydrate already hydrated island', async () => {
    const registry = createIslandRegistry()
    registry.register({
      id: 'test-1',
      component: 'Widget',
      props: {},
      options: { strategy: 'load' },
      serverHTML: '<div>Widget</div>',
      hydrated: true,
    })

    // Should not throw
    await registry.hydrate('test-1')
    expect(registry.get('test-1')?.hydrated).toBe(true)
  })
})

describe('generateIslandManifest', () => {
  it('should generate JSON manifest script tag', () => {
    const islands: IslandComponent[] = [
      {
        id: 'island-1',
        component: 'Counter',
        props: { initial: 5 },
        options: { strategy: 'load' },
        serverHTML: '',
        hydrated: false,
      },
      {
        id: 'island-2',
        component: 'Carousel',
        props: { items: ['a', 'b'] },
        options: { strategy: 'visible' },
        serverHTML: '',
        hydrated: false,
      },
    ]

    const manifest = generateIslandManifest(islands)

    expect(manifest).toContain('<script type="application/json"')
    expect(manifest).toContain('stx-island-manifest')
    expect(manifest).toContain('Counter')
    expect(manifest).toContain('Carousel')
    expect(manifest).toContain('"strategy":"load"')
    expect(manifest).toContain('"strategy":"visible"')

    // Should be valid JSON inside the script tag
    const jsonMatch = manifest.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    expect(jsonMatch).toBeTruthy()
    const parsed = JSON.parse(jsonMatch![1].trim())
    expect(parsed.length).toBe(2)
    expect(parsed[0].id).toBe('island-1')
    expect(parsed[1].component).toBe('Carousel')
  })

  it('should handle empty islands array', () => {
    const manifest = generateIslandManifest([])

    expect(manifest).toContain('stx-island-manifest')
    const jsonMatch = manifest.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    const parsed = JSON.parse(jsonMatch![1].trim())
    expect(parsed).toEqual([])
  })
})
