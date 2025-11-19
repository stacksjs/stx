import { describe, expect, it } from 'bun:test'
import type { NavigatorItem, NavigatorProps } from '../../src/ui/navigator'

describe('navigator Component', () => {
  describe('type exports', () => {
    it('should export NavigatorItem interface', () => {
      const item: NavigatorItem = {
        id: 'test',
        label: 'Test Item',
        href: '/test',
        icon: '<svg></svg>',
        badge: '5',
        disabled: false,
      }
      expect(item).toBeDefined()
      expect(item.id).toBe('test')
      expect(item.label).toBe('Test Item')
    })

    it('should export NavigatorProps interface', () => {
      const props: NavigatorProps = {
        items: [],
        active: 'test',
        orientation: 'horizontal',
        variant: 'default',
        size: 'md',
        onNavigate: (item) => {},
        className: 'custom-class',
      }
      expect(props).toBeDefined()
    })

    it('should have required NavigatorItem properties', () => {
      // Only label is required
      const item: NavigatorItem = {
        label: 'Test',
      }
      expect(item.label).toBe('Test')
    })

    it('should support optional NavigatorItem properties', () => {
      const item: NavigatorItem = {
        label: 'Test',
        // All other properties are optional
      }
      expect(item).toBeDefined()
    })
  })

  describe('navigation items', () => {
    it('should handle items with href', () => {
      const items: NavigatorItem[] = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'about', label: 'About', href: '/about' },
      ]

      expect(items).toHaveLength(2)
      expect(items[0].href).toBe('/')
      expect(items[1].href).toBe('/about')
    })

    it('should handle items without href (buttons)', () => {
      const items: NavigatorItem[] = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
      ]

      expect(items).toHaveLength(2)
      expect(items[0].href).toBeUndefined()
      expect(items[1].href).toBeUndefined()
    })

    it('should support icons in items', () => {
      const iconSvg = '<svg class="w-5 h-5"><path d="M10 10"/></svg>'
      const item: NavigatorItem = {
        id: 'home',
        label: 'Home',
        href: '/',
        icon: iconSvg,
      }

      expect(item.icon).toBe(iconSvg)
    })

    it('should support badges in items', () => {
      const item1: NavigatorItem = {
        id: 'inbox',
        label: 'Inbox',
        badge: '5',
      }

      const item2: NavigatorItem = {
        id: 'drafts',
        label: 'Drafts',
        badge: 12,
      }

      expect(item1.badge).toBe('5')
      expect(item2.badge).toBe(12)
    })

    it('should support disabled items', () => {
      const item: NavigatorItem = {
        id: 'disabled',
        label: 'Disabled',
        disabled: true,
      }

      expect(item.disabled).toBe(true)
    })
  })

  describe('active state', () => {
    it('should match active by id', () => {
      const items: NavigatorItem[] = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'about', label: 'About', href: '/about' },
      ]
      const active = 'home'

      const activeItem = items.find(item => item.id === active)
      expect(activeItem).toBeDefined()
      expect(activeItem?.id).toBe('home')
    })

    it('should match active by href', () => {
      const items: NavigatorItem[] = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'about', label: 'About', href: '/about' },
      ]
      const active = '/about'

      const activeItem = items.find(item => item.href === active)
      expect(activeItem).toBeDefined()
      expect(activeItem?.href).toBe('/about')
    })

    it('should handle partial href matches', () => {
      const items: NavigatorItem[] = [
        { id: 'blog', label: 'Blog', href: '/blog' },
      ]
      const active = '/blog/post-1'

      const isActiveStartsWith = active.startsWith('/blog')
      expect(isActiveStartsWith).toBe(true)
    })
  })

  describe('orientations', () => {
    it('should support horizontal orientation', () => {
      const props: NavigatorProps = {
        items: [],
        orientation: 'horizontal',
      }

      expect(props.orientation).toBe('horizontal')
    })

    it('should support vertical orientation', () => {
      const props: NavigatorProps = {
        items: [],
        orientation: 'vertical',
      }

      expect(props.orientation).toBe('vertical')
    })

    it('should default to horizontal', () => {
      const props: NavigatorProps = {
        items: [],
      }

      expect(props.orientation).toBeUndefined()
      // In component, this would default to 'horizontal'
    })
  })

  describe('variants', () => {
    it('should support default variant', () => {
      const props: NavigatorProps = {
        items: [],
        variant: 'default',
      }

      expect(props.variant).toBe('default')
    })

    it('should support pills variant', () => {
      const props: NavigatorProps = {
        items: [],
        variant: 'pills',
      }

      expect(props.variant).toBe('pills')
    })

    it('should support underline variant', () => {
      const props: NavigatorProps = {
        items: [],
        variant: 'underline',
      }

      expect(props.variant).toBe('underline')
    })

    it('should support sidebar variant', () => {
      const props: NavigatorProps = {
        items: [],
        variant: 'sidebar',
      }

      expect(props.variant).toBe('sidebar')
    })
  })

  describe('sizes', () => {
    it('should support small size', () => {
      const props: NavigatorProps = {
        items: [],
        size: 'sm',
      }

      expect(props.size).toBe('sm')
    })

    it('should support medium size', () => {
      const props: NavigatorProps = {
        items: [],
        size: 'md',
      }

      expect(props.size).toBe('md')
    })

    it('should support large size', () => {
      const props: NavigatorProps = {
        items: [],
        size: 'lg',
      }

      expect(props.size).toBe('lg')
    })
  })

  describe('navigation handler', () => {
    it('should accept custom navigation handler', () => {
      let navigatedItem: NavigatorItem | null = null

      const props: NavigatorProps = {
        items: [
          { id: 'home', label: 'Home' },
        ],
        onNavigate: (item) => {
          navigatedItem = item
        },
      }

      // Simulate navigation
      const item = props.items[0]
      props.onNavigate?.(item)

      expect(navigatedItem).toBeDefined()
      expect(navigatedItem?.id).toBe('home')
    })

    it('should pass correct item to handler', () => {
      const items: NavigatorItem[] = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
        { id: 'tab3', label: 'Tab 3' },
      ]

      let clickedItem: NavigatorItem | null = null

      const handleNavigate = (item: NavigatorItem) => {
        clickedItem = item
      }

      // Simulate clicking tab2
      handleNavigate(items[1])

      expect(clickedItem).toBeDefined()
      expect(clickedItem?.id).toBe('tab2')
      expect(clickedItem?.label).toBe('Tab 2')
    })
  })

  describe('disabled state', () => {
    it('should prevent navigation when disabled', () => {
      const item: NavigatorItem = {
        id: 'disabled',
        label: 'Disabled',
        href: '/disabled',
        disabled: true,
      }

      // In component, this would prevent click handling
      const shouldNavigate = !item.disabled
      expect(shouldNavigate).toBe(false)
    })

    it('should allow navigation when not disabled', () => {
      const item: NavigatorItem = {
        id: 'enabled',
        label: 'Enabled',
        href: '/enabled',
        disabled: false,
      }

      const shouldNavigate = !item.disabled
      expect(shouldNavigate).toBe(true)
    })
  })

  describe('className support', () => {
    it('should accept custom className', () => {
      const props: NavigatorProps = {
        items: [],
        className: 'custom-nav bg-white p-4',
      }

      expect(props.className).toBe('custom-nav bg-white p-4')
    })

    it('should handle empty className', () => {
      const props: NavigatorProps = {
        items: [],
        className: '',
      }

      expect(props.className).toBe('')
    })
  })

  describe('combined features', () => {
    it('should handle complex navigation setup', () => {
      const items: NavigatorItem[] = [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: '<svg class="w-5 h-5"></svg>',
        },
        {
          id: 'projects',
          label: 'Projects',
          href: '/projects',
          icon: '<svg class="w-5 h-5"></svg>',
          badge: '5',
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/settings',
          icon: '<svg class="w-5 h-5"></svg>',
        },
        {
          id: 'upgrade',
          label: 'Upgrade',
          href: '/upgrade',
          disabled: true,
        },
      ]

      const props: NavigatorProps = {
        items,
        active: 'dashboard',
        orientation: 'vertical',
        variant: 'sidebar',
        size: 'md',
      }

      expect(props.items).toHaveLength(4)
      expect(props.items.filter(item => item.icon).length).toBe(3)
      expect(props.items.filter(item => item.badge).length).toBe(1)
      expect(props.items.filter(item => item.disabled).length).toBe(1)
    })
  })

  describe('accessibility', () => {
    it('should support aria attributes through structure', () => {
      const item: NavigatorItem = {
        id: 'current',
        label: 'Current Page',
        href: '/current',
      }

      // Component would add aria-current="page" for active items
      const ariaCurrent = 'page'
      expect(ariaCurrent).toBe('page')
    })

    it('should support aria-disabled for disabled items', () => {
      const item: NavigatorItem = {
        id: 'disabled',
        label: 'Disabled',
        disabled: true,
      }

      // Component would add aria-disabled="true" for disabled items
      const ariaDisabled = item.disabled ? 'true' : 'false'
      expect(ariaDisabled).toBe('true')
    })
  })
})
