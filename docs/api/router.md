# Router API Reference

This document details STX's routing system API, including route configuration, navigation guards, and route management.

## Router Setup

### Basic Configuration

```ts
import { createRouter } from '@stacksjs/stx/router'

const router = createRouter({
  // Base URL for all routes
  base: '/',
  
  // Route definitions
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/about',
      component: About
    },
    {
      path: '/users/:id',
      component: UserProfile,
      props: true
    }
  ],
  
  // Scroll behavior
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})
```

### Route Configuration

```ts
interface RouteConfig {
  // Route path
  path: string
  
  // Route name (optional)
  name?: string
  
  // Component to render
  component: Component
  
  // Pass route params as props
  props?: boolean | Object | Function
  
  // Nested routes
  children?: RouteConfig[]
  
  // Route metadata
  meta?: Record<string, any>
  
  // Route alias
  alias?: string | string[]
  
  // Redirect configuration
  redirect?: string | Location | Function
  
  // Route-specific navigation guards
  beforeEnter?: NavigationGuard
  
  // Lazy loading
  component: () => import('./UserProfile.vue')
}
```

## Route Definition

### Basic Routes

```ts
const routes = [
  // Static routes
  {
    path: '/',
    component: Home
  },
  
  // Dynamic segments
  {
    path: '/users/:id',
    component: UserProfile
  },
  
  // Optional parameters
  {
    path: '/posts/:id?',
    component: PostView
  },
  
  // Multiple dynamic segments
  {
    path: '/orgs/:orgId/repos/:repoId',
    component: RepoView
  },
  
  // Catch all / 404
  {
    path: '/:pathMatch(.*)*',
    component: NotFound
  }
]
```

### Nested Routes

```ts
const routes = [
  {
    path: '/user',
    component: User,
    children: [
      {
        // /user/profile
        path: 'profile',
        component: UserProfile
      },
      {
        // /user/posts
        path: 'posts',
        component: UserPosts
      },
      {
        // /user/settings
        path: 'settings',
        component: UserSettings
      }
    ]
  }
]
```

### Named Routes

```ts
const routes = [
  {
    path: '/user/:id',
    name: 'user',
    component: User
  }
]

// Navigate using route name
router.push({ name: 'user', params: { id: '123' } })
```

## Navigation Guards

### Global Guards

```ts
// Before each route change
router.beforeEach((to, from) => {
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }
})

// After each route change
router.afterEach((to, from) => {
  // Analytics tracking
  trackPageView(to.fullPath)
})

// Route error handling
router.onError((error) => {
  // Handle navigation errors
  console.error('Navigation error:', error)
})
```

### Route-Specific Guards

```ts
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from) => {
      // Check admin access
      if (!hasAdminAccess) {
        return '/unauthorized'
      }
    }
  }
]
```

### Component Guards

```ts
const AdminDashboard = defineComponent({
  setup() {
    // Called before component is created
    onBeforeRouteEnter((to, from) => {
      // No access to 'this'
    })
    
    // Called before route changes
    onBeforeRouteUpdate((to, from) => {
      // Can access component instance
    })
    
    // Called before leaving route
    onBeforeRouteLeave((to, from) => {
      // Prevent accidental navigation
      const answer = window.confirm('Leave page?')
      if (!answer) return false
    })
  }
})
```

## Navigation Methods

### Programmatic Navigation

```ts
// Push new route
router.push('/about')

// Push with object
router.push({
  path: '/users',
  query: { page: 2 }
})

// Push with name
router.push({
  name: 'user',
  params: { id: '123' }
})

// Replace current route
router.replace('/other')

// Go back/forward
router.go(-1)  // back
router.go(1)   // forward

// Push with hash
router.push({
  path: '/about',
  hash: '#team'
})
```

### Route Information

```ts
// Current route
const route = router.currentRoute.value

// Access route data
console.log(route.path)       // Current path
console.log(route.params)     // Route parameters
console.log(route.query)      // Query parameters
console.log(route.hash)       // URL hash
console.log(route.fullPath)   // Full URL
console.log(route.name)       // Route name
console.log(route.meta)       // Route metadata

// Check current route
router.isReady()             // Router initialized
router.hasRoute('name')      // Route exists
```

## Route Composition

### Route Utilities

```ts
import { useRoute, useRouter } from '@stacksjs/stx/router'

// In component setup
const route = useRoute()
const router = useRouter()

// Access route info
console.log(route.params.id)
console.log(route.query.page)

// Navigate
router.push('/new-path')
```

### Route Guards Composition

```ts
import { onBeforeRouteLeave, onBeforeRouteUpdate } from '@stacksjs/stx/router'

// In component setup
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm('Leave page?')
  if (!answer) return false
})

onBeforeRouteUpdate((to, from) => {
  // Handle route updates
})
```

## Advanced Features

### Route Meta Fields

```ts
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Admin Dashboard'
    }
  }
]

router.beforeEach((to, from) => {
  // Check meta requirements
  if (to.meta.requiresAuth) {
    // Auth check
  }
  
  if (to.meta.roles) {
    // Role check
  }
  
  // Update page title
  document.title = to.meta.title
})
```

### Dynamic Routes

```ts
// Lazy loading
const routes = [
  {
    path: '/user/:id',
    component: () => import('./views/User.vue')
  }
]

// Dynamic route matching
const routes = [
  // Match /user-1, /user-2, etc.
  {
    path: '/user-:id(\\d+)',
    component: UserById
  },
  
  // Optional parameters
  {
    path: '/optional/:id?',
    component: OptionalId
  },
  
  // Custom regex
  {
    path: '/:id(\\d+)',
    component: NumberId
  }
]
```

### Navigation Failures

```ts
// Handle navigation failures
router.push('/path').catch(failure => {
  if (failure.type === NavigationFailureType.aborted) {
    // Navigation aborted
  }
  
  if (failure.type === NavigationFailureType.cancelled) {
    // Navigation cancelled
  }
})

// Check navigation status
const navigation = await router.push('/path')
if (navigation.aborted) {
  // Handle aborted navigation
}
```

## Next Steps

- Explore [Core API](/api/core)
- Check out [Component API](/api/components)
- Learn about [Helper Functions](/api/helpers)
- Review [State Management](/api/state) 