import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import {
  ComponentHMRHandler,
  getHMRHandler,
  resetHMRHandler,
  generateHMRClientScript,
  wrapComponentForHMR,
} from '../src/component-hmr'

describe('Component HMR', () => {
  beforeEach(() => {
    resetHMRHandler()
  })

  afterEach(() => {
    resetHMRHandler()
  })

  describe('ComponentHMRHandler', () => {
    it('should create handler with default config', () => {
      const handler = new ComponentHMRHandler()
      expect(handler).toBeDefined()
    })

    it('should create handler with custom config', () => {
      const handler = new ComponentHMRHandler({
        preserveState: false,
        maxStateAge: 60000,
        verbose: true,
      })
      expect(handler).toBeDefined()
    })

    it('should register and unregister components', () => {
      const handler = new ComponentHMRHandler()
      const instance = {
        id: 'test-1',
        name: 'TestComponent',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      }

      handler.register(instance)
      expect(handler.getRegistry().getInstance('test-1')).toBeDefined()

      handler.unregister('test-1')
      expect(handler.getRegistry().getInstance('test-1')).toBeUndefined()
    })

    it('should track components by file', () => {
      const handler = new ComponentHMRHandler()

      handler.register({
        id: 'comp-1',
        name: 'Button.stx',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      handler.register({
        id: 'comp-2',
        name: 'Button.stx',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      const instances = handler.getRegistry().getInstancesByFile('Button.stx')
      expect(instances).toHaveLength(2)
    })
  })

  describe('getHMRHandler', () => {
    it('should return singleton instance', () => {
      const handler1 = getHMRHandler()
      const handler2 = getHMRHandler()
      expect(handler1).toBe(handler2)
    })

    it('should return new instance after reset', () => {
      const handler1 = getHMRHandler()
      resetHMRHandler()
      const handler2 = getHMRHandler()
      expect(handler1).not.toBe(handler2)
    })
  })

  describe('generateHMRClientScript', () => {
    it('should generate valid script with WebSocket connection', () => {
      const script = generateHMRClientScript(3001)
      expect(script).toContain('data-stx-hmr-client')
      expect(script).toContain('3001')
      expect(script).toContain('WebSocket')
    })

    it('should include component registration function', () => {
      const script = generateHMRClientScript(3001)
      expect(script).toContain('registerComponent')
      expect(script).toContain('unregisterComponent')
    })

    it('should include state capture and restore', () => {
      const script = generateHMRClientScript(3001)
      expect(script).toContain('captureState')
      expect(script).toContain('restoreState')
    })

    it('should expose __stxHMR on window', () => {
      const script = generateHMRClientScript(3001)
      expect(script).toContain('window.__stxHMR')
    })
  })

  describe('wrapComponentForHMR', () => {
    it('should wrap component with HMR data attributes', () => {
      const wrapped = wrapComponentForHMR(
        'comp-123',
        'Counter',
        '<button>Click</button>',
        'const count = 0'
      )

      expect(wrapped).toContain('data-stx-component="comp-123"')
      expect(wrapped).toContain('data-stx-name="Counter"')
      expect(wrapped).toContain('<button>Click</button>')
    })

    it('should include setup script', () => {
      const wrapped = wrapComponentForHMR(
        'comp-123',
        'Counter',
        '<button>Count: 0</button>',
        'const count = stx.ref(0)'
      )

      expect(wrapped).toContain('const count = stx.ref(0)')
      expect(wrapped).toContain('__setup')
    })

    it('should register with HMR system', () => {
      const wrapped = wrapComponentForHMR(
        'comp-123',
        'Counter',
        '<button>Click</button>',
        ''
      )

      expect(wrapped).toContain('window.__stxHMR.register')
      expect(wrapped).toContain('window.__stxHMR.unregister')
    })

    it('should set up MutationObserver for cleanup', () => {
      const wrapped = wrapComponentForHMR(
        'comp-123',
        'Counter',
        '<button>Click</button>',
        ''
      )

      expect(wrapped).toContain('MutationObserver')
      expect(wrapped).toContain('observer.disconnect')
    })
  })

  describe('HMR Update Handling', () => {
    it('should handle component update', async () => {
      const handler = new ComponentHMRHandler({ verbose: false })

      handler.register({
        id: 'update-test',
        name: 'TestComp.stx',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      // This won't throw because element is null (no DOM in tests)
      await handler.handleUpdate({
        file: 'TestComp.stx',
        code: '<div>Updated</div>',
        type: 'full',
        timestamp: Date.now(),
      })
    })

    it('should handle style-only update', async () => {
      const handler = new ComponentHMRHandler({ verbose: false })

      handler.register({
        id: 'style-test',
        name: 'StyleComp.stx',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      await handler.handleUpdate({
        file: 'StyleComp.stx',
        code: '<style>.btn { color: red; }</style>',
        type: 'style',
        timestamp: Date.now(),
      })
    })
  })

  describe('State Management', () => {
    it('should capture component state', () => {
      const handler = new ComponentHMRHandler()
      const registry = handler.getRegistry()

      registry.register({
        id: 'state-test',
        name: 'StateComp',
        element: null,
        state: {
          refs: { count: 5 },
          reactiveObjects: {},
          custom: { theme: 'dark' },
          timestamp: Date.now(),
        },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      registry.captureState('state-test')
      // State should be captured (internal operation)
    })

    it('should handle missing component gracefully', () => {
      const handler = new ComponentHMRHandler()
      const registry = handler.getRegistry()

      // Should not throw
      registry.captureState('non-existent')
      registry.restoreState('non-existent')
    })

    it('should clear all instances', () => {
      const handler = new ComponentHMRHandler()
      const registry = handler.getRegistry()

      registry.register({
        id: 'clear-1',
        name: 'Comp1',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      registry.register({
        id: 'clear-2',
        name: 'Comp2',
        element: null,
        state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
        isMounted: true,
        props: {},
        children: new Map(),
      })

      registry.clear()

      expect(registry.getAllInstances()).toHaveLength(0)
    })
  })
})
