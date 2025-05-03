# Animation System

The STX Animation System provides a set of powerful directives to create beautiful, accessible animations in your templates. The system automatically respects users' motion preferences and makes it easy to coordinate complex animations.

## Features

- **Transition Directives:** Apply transitions to elements with the `@transition` directive
- **Animation Coordination:** Group animations together with the `@animationGroup` directive
- **Motion Preferences Respect:** Automatically respect users' reduced motion preferences with the `@motion` directive
- **Scroll-Based Animations:** Trigger animations when elements enter the viewport with `@scrollAnimate`
- **Accessibility:** Built-in support for the `prefers-reduced-motion` media query
- **Easy Customization:** Configure duration, easing, delay, and animation types

## Configuration

You can configure the animation system in your `stx.config.ts` file:

```ts
// stx.config.ts
import type { StxOptions } from '@stacksjs/stx'

const config: StxOptions = {
  // other config options...

  animation: {
    enabled: true,
    defaultDuration: 300,
    defaultEase: 'ease',
    respectMotionPreferences: true,
    staggerDelay: 50,
  },
}

export default config
```

## Available Directives

### @transition

The `@transition` directive applies transition effects to an element.

#### Syntax

```
@transition(type, duration?, ease?, delay?, direction?)
  // content
@endtransition
```

#### Parameters

- `type` (required): The transition type. Available options:
  - `'fade'`: Opacity transitions
  - `'slide'`: Sliding movements
  - `'scale'`: Size scaling
  - `'flip'`: 3D flipping
  - `'rotate'`: Rotation-based animations
  - `'custom'`: Custom animation (requires additional CSS)
- `duration` (optional): Duration in milliseconds (default: 300)
- `ease` (optional): Easing function. Available options:
  - `'linear'`: Linear timing
  - `'ease'`: Standard easing (default)
  - `'ease-in'`: Accelerating easing
  - `'ease-out'`: Decelerating easing
  - `'ease-in-out'`: Accelerate-then-decelerate
  - `'spring'`: Spring-like animation
- `delay` (optional): Delay in milliseconds before starting the animation (default: 0)
- `direction` (optional): Direction of the animation:
  - `'in'`: The element starts hidden and becomes visible
  - `'out'`: The element starts visible and becomes hidden
  - `'both'`: Support both directions (default)

#### Examples

Basic fade transition:

```html
@transition('fade')
  <div>This content will fade in</div>
@endtransition
```

Slide transition with custom parameters:

```html
@transition('slide', 500, 'ease-out', 200, 'in')
  <div>This content will slide in with a 500ms duration, ease-out easing, and 200ms delay</div>
@endtransition
```

### @scrollAnimate

The `@scrollAnimate` directive applies animations that trigger when an element enters the viewport.

#### Syntax

```
@scrollAnimate(type, duration?, ease?, threshold?, delay?)
  // content
@endscrollAnimate
```

#### Parameters

- `type` (required): The animation type. Available options:
  - `'fade'`: Fade in
  - `'slide-up'`: Slide in from bottom
  - `'slide-down'`: Slide in from top
  - `'slide-left'`: Slide in from right
  - `'slide-right'`: Slide in from left
  - `'scale'`: Scale up
- `duration` (optional): Duration in milliseconds (default: 300)
- `ease` (optional): Easing function (default: 'ease')
- `threshold` (optional): IntersectionObserver threshold (0.0 to 1.0) determining how much of the element must be visible to trigger (default: 0.2)
- `delay` (optional): Delay in milliseconds before starting the animation (default: 0)

#### Examples

Basic scroll animation:

```html
@scrollAnimate('fade')
  <div>This content will fade in when scrolled into view</div>
@endscrollAnimate
```

Slide up animation with custom parameters:

```html
@scrollAnimate('slide-up', 600, 'ease-out', 0.1, 100)
  <div>This content will slide up when 10% visible, with a 600ms duration, ease-out easing, and 100ms delay</div>
@endscrollAnimate
```

### @animationGroup

The `@animationGroup` directive coordinates multiple animations together.

#### Syntax

```
@animationGroup(groupName, selector1, selector2, ...)
```

#### Parameters

- `groupName` (required): Unique name for the animation group
- `selectors` (required): One or more CSS selectors for the elements to animate

#### Examples

Coordinating multiple elements:

```html
<div id="header">Header</div>
<div id="main">Main content</div>
<div id="footer">Footer</div>

@animationGroup('page-load', '#header', '#main', '#footer')
```

### @motion

The `@motion` directive controls motion and animation preferences.

#### Syntax

```
@motion(respectPreferences)
  // content
@endmotion
```

#### Parameters

- `respectPreferences` (optional): Whether to respect user's motion preferences (default: true)

#### Examples

Respect motion preferences:

```html
@motion(true)
  <div>This content will respect motion preferences</div>
@endmotion
```

Force animations:

```html
@motion(false)
  <div>This content will always animate regardless of motion preferences</div>
@endmotion
```

## CSS Classes

The animation system provides CSS classes that you can use to manually apply animations:

- `.stx-transition`: Base transition class
- `.stx-fade`: Fade transition
- `.stx-slide`: Slide transition
- `.stx-scale`: Scale transition
- `.stx-out`: Add this class to initially hide elements
- `.stx-observe`: Elements to be observed for scroll-based animations
- `.stx-from-left`: Elements that animate in from left
- `.stx-from-right`: Elements that animate in from right
- `.stx-from-top`: Elements that animate in from top
- `.stx-from-bottom`: Elements that animate in from bottom

## CSS Variables

You can customize animations by modifying these CSS variables:

- `--stx-transition-duration`: Animation duration
- `--stx-transition-ease`: Easing function
- `--stx-transition-delay`: Animation delay

## Scroll-Based Animations

The animation system uses IntersectionObserver to handle scroll-based animations efficiently. When elements with the `.stx-observe` class enter the viewport, they automatically animate in.

```html
<div class="stx-transition stx-observe stx-from-bottom stx-out">
  This element will slide up when scrolled into view
</div>
```

## Accessibility Considerations

The animation system automatically respects the user's motion preferences by checking for the `prefers-reduced-motion` media query.

When this preference is detected:

1. Animations durations are set to 0
2. The `data-reduced-motion` attribute is added to the root element

You can also manually toggle this in your application:

```js
// Disable animations
document.documentElement.setAttribute('data-reduced-motion', 'true');
document.documentElement.style.setProperty('--stx-transition-duration', '0ms');

// Enable animations
document.documentElement.setAttribute('data-reduced-motion', 'false');
document.documentElement.style.setProperty('--stx-transition-duration', '');
```

## Best Practices

1. **Keep animations subtle and purposeful**
2. **Avoid animations that flash or move too quickly**
3. **Always provide a way to disable animations**
4. **Test your animations with the `prefers-reduced-motion` setting**
5. **Use animation to enhance, not distract**
6. **Keep durations reasonable (usually under 500ms)**
7. **Use scroll-based animations for content that's below the fold**
8. **Group related animations for a more cohesive experience**
