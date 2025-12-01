import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearComponents,
  getComponent,
  getComponentNames,
  hasComponent,
  registerClientComponent,
  registerServerComponent,
} from '../../src/server-components'

describe('registerServerComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should register a server component', () => {
    registerServerComponent({
      name: 'user-profile',
      template: '<div>{{ name }}</div>',
    })

    expect(hasComponent('user-profile')).toBe(true)
    const entry = getComponent('user-profile')
    expect(entry?.type).toBe('server')
  })

  it('should register a server component with loader', () => {
    registerServerComponent({
      name: 'async-data',
      template: '<div>{{ data }}</div>',
      loader: async () => ({ data: 'loaded' }),
    })

    const entry = getComponent('async-data')
    expect(entry?.type).toBe('server')
    expect((entry?.component as any).loader).toBeDefined()
  })

  it('should register a server component with cache config', () => {
    registerServerComponent({
      name: 'cached-component',
      template: '<p>Cached</p>',
      cache: {
        enabled: true,
        ttl: 60000,
      },
    })

    const entry = getComponent('cached-component')
    expect((entry?.component as any).cache?.enabled).toBe(true)
    expect((entry?.component as any).cache?.ttl).toBe(60000)
  })

  it('should register a server component with error boundary', () => {
    registerServerComponent({
      name: 'safe-component',
      template: '<div>{{ mayFail }}</div>',
      errorBoundary: '<p class="error">Something went wrong: {{ error }}</p>',
    })

    const entry = getComponent('safe-component')
    expect((entry?.component as any).errorBoundary).toContain('Something went wrong')
  })

  it('should register a server component with suspense fallback', () => {
    registerServerComponent({
      name: 'async-component',
      template: '<div>{{ asyncData }}</div>',
      suspenseFallback: '<p>Loading...</p>',
    })

    const entry = getComponent('async-component')
    expect((entry?.component as any).suspenseFallback).toBe('<p>Loading...</p>')
  })
})

describe('registerClientComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should register a client component', () => {
    registerClientComponent({
      name: 'counter',
      template: '<button>{{ count }}</button>',
    })

    expect(hasComponent('counter')).toBe(true)
    const entry = getComponent('counter')
    expect(entry?.type).toBe('client')
  })

  it('should register with client script', () => {
    registerClientComponent({
      name: 'interactive',
      template: '<div id="app"></div>',
      clientScript: 'document.getElementById("app").innerHTML = "Hello"',
    })

    const entry = getComponent('interactive')
    expect((entry?.component as any).clientScript).toContain('Hello')
  })

  it('should register with client props', () => {
    registerClientComponent({
      name: 'with-props',
      template: '<div>{{ name }}</div>',
      clientProps: ['name', 'id'],
    })

    const entry = getComponent('with-props')
    expect((entry?.component as any).clientProps).toEqual(['name', 'id'])
  })

  it('should register with priority', () => {
    registerClientComponent({
      name: 'eager-component',
      template: '<div>Eager</div>',
      priority: 'eager',
    })

    const entry = getComponent('eager-component')
    expect((entry?.component as any).priority).toBe('eager')
  })

  it('should default to lazy priority', () => {
    registerClientComponent({
      name: 'default-priority',
      template: '<div>Default</div>',
    })

    const entry = getComponent('default-priority')
    expect((entry?.component as any).priority).toBeUndefined()
  })
})

describe('getComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should return undefined for non-existent component', () => {
    expect(getComponent('non-existent')).toBeUndefined()
  })

  it('should return the correct component entry', () => {
    registerServerComponent({
      name: 'test',
      template: '<div>Test</div>',
    })

    const entry = getComponent('test')
    expect(entry).toBeDefined()
    expect(entry?.component.name).toBe('test')
  })
})

describe('hasComponent', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should return false for non-existent component', () => {
    expect(hasComponent('fake')).toBe(false)
  })

  it('should return true for registered component', () => {
    registerServerComponent({
      name: 'exists',
      template: '<div></div>',
    })

    expect(hasComponent('exists')).toBe(true)
  })
})

describe('getComponentNames', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should return empty array when no components', () => {
    expect(getComponentNames()).toEqual([])
  })

  it('should return all component names', () => {
    registerServerComponent({
      name: 'server-one',
      template: '<div></div>',
    })
    registerClientComponent({
      name: 'client-one',
      template: '<div></div>',
    })

    const names = getComponentNames()
    expect(names).toContain('server-one')
    expect(names).toContain('client-one')
    expect(names.length).toBe(2)
  })
})

describe('clearComponents', () => {
  it('should clear all registered components', () => {
    registerServerComponent({
      name: 'to-clear',
      template: '<div></div>',
    })

    expect(hasComponent('to-clear')).toBe(true)
    clearComponents()
    expect(hasComponent('to-clear')).toBe(false)
    expect(getComponentNames()).toEqual([])
  })
})
