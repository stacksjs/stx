# Accessibility Guide

Complete guide to building accessible applications with @stacksjs/components.

## Table of Contents

- [Overview](#overview)
- [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
- [Accessibility Utilities](#accessibility-utilities)
- [Component Guidelines](#component-guidelines)
- [Testing Accessibility](#testing-accessibility)
- [Common Patterns](#common-patterns)
- [Resources](#resources)

## Overview

@stacksjs/components is built with accessibility as a core principle. All components follow WCAG 2.1 AA guidelines and include:

- **Keyboard Navigation** - Full keyboard support for all interactive elements
- **Screen Reader Support** - Proper ARIA labels, roles, and live regions
- **Focus Management** - Visible focus indicators and focus trapping
- **Semantic HTML** - Meaningful markup structure
- **Color Contrast** - Sufficient contrast ratios (4.5:1 for text)
- **Responsive Design** - Works across all viewport sizes
- **Reduced Motion** - Respects prefers-reduced-motion preference

## WCAG 2.1 AA Compliance

Our components meet Level AA success criteria:

### Perceivable
- **1.1.1 Non-text Content** - All images have alt text
- **1.3.1 Info and Relationships** - Proper semantic markup and ARIA
- **1.4.3 Contrast (Minimum)** - 4.5:1 contrast ratio for text
- **1.4.11 Non-text Contrast** - 3:1 contrast for UI components

### Operable
- **2.1.1 Keyboard** - All functionality available via keyboard
- **2.1.2 No Keyboard Trap** - Focus can move away from all components
- **2.4.3 Focus Order** - Logical tab order
- **2.4.7 Focus Visible** - Visible focus indicators

### Understandable
- **3.1.1 Language of Page** - Proper lang attribute
- **3.2.1 On Focus** - No context changes on focus
- **3.3.1 Error Identification** - Clear error messages
- **3.3.2 Labels or Instructions** - All inputs have labels

### Robust
- **4.1.1 Parsing** - Valid HTML
- **4.1.2 Name, Role, Value** - Proper ARIA attributes
- **4.1.3 Status Messages** - Screen reader announcements

## Accessibility Utilities

### Focus Management

#### createFocusTrap()

Trap keyboard focus within a modal or dialog:

```typescript
import { createFocusTrap } from '@stacksjs/components'

const dialog = document.getElementById('my-dialog')
const trap = createFocusTrap(dialog, {
  initialFocus: document.getElementById('close-button'),
  escapeDeactivates: true,
  onActivate: () => console.log('Trap activated'),
  onDeactivate: () => console.log('Trap deactivated'),
})

// Activate when dialog opens
trap.activate()

// Deactivate when dialog closes
trap.deactivate()
```

**Options:**
- `initialFocus` - Element to focus when activated
- `returnFocus` - Element to focus when deactivated
- `escapeDeactivates` - ESC key closes trap (default: true)
- `clickOutsideDeactivates` - Click outside closes trap (default: true)
- `allowOutsideClick` - Allow clicks without deactivating

#### createRovingTabindex()

Manage focus in toolbars, menus, and lists:

```typescript
import { createRovingTabindex } from '@stacksjs/components'

const toolbar = document.getElementById('toolbar')
const cleanup = createRovingTabindex(toolbar, {
  selector: 'button',
  orientation: 'horizontal', // or 'vertical' or 'both'
  loop: true, // Wrap around at edges
  initialIndex: 0,
  onFocusChange: (index, element) => {
    console.log(`Focus moved to item ${index}`)
  },
})

// Clean up when done
cleanup()
```

**Keyboard Support:**
- Arrow keys navigate items
- Home/End jump to first/last
- Respects orientation (horizontal/vertical)

#### getFocusableElements()

Get all focusable elements in a container:

```typescript
import { getFocusableElements } from '@stacksjs/components'

const container = document.getElementById('form')
const focusable = getFocusableElements(container)

console.log(`Found ${focusable.length} focusable elements`)
```

### ARIA Helpers

#### createAriaLabel()

Create accessible labels:

```typescript
import { createAriaLabel } from '@stacksjs/components'

const input = document.getElementById('username')

// Visible label
const labelId = createAriaLabel('Username', input, { visible: true })

// Visually hidden label (screen reader only)
const hiddenId = createAriaLabel('Search', input, { visible: false })
```

#### createAriaDescription()

Add descriptive text:

```typescript
import { createAriaDescription } from '@stacksjs/components'

const input = document.getElementById('password')
const descId = createAriaDescription(
  'Password must be at least 8 characters',
  input,
)
```

#### aria Object

Set ARIA attributes easily:

```typescript
import { aria } from '@stacksjs/components'

const button = document.querySelector('button')
const menu = document.querySelector('[role="menu"]')

// Toggle button
aria.setExpanded(button, true)
aria.setPressed(button, false)

// Menu items
aria.setSelected(menuItem, true)
aria.setDisabled(menuItem, false)

// Form validation
aria.setInvalid(input, true)
aria.setRequired(input, true)

// Loading states
aria.setBusy(container, true)

// Live regions
aria.setLive(status, 'polite') // or 'assertive'
```

### Screen Reader Support

#### announceToScreenReader()

Make announcements to screen readers:

```typescript
import { announceToScreenReader } from '@stacksjs/components'

// Polite announcement (waits for user to finish)
announceToScreenReader('Form submitted successfully', 'polite')

// Assertive announcement (interrupts)
announceToScreenReader('Error: Connection lost', 'assertive')
```

#### createScreenReaderText()

Create visually hidden text:

```typescript
import { createScreenReaderText } from '@stacksjs/components'

const button = document.querySelector('button')
const srText = createScreenReaderText('Close dialog')
button.appendChild(srText)
```

### Skip Links

Help keyboard users skip to main content:

```typescript
import { createSkipLink } from '@stacksjs/components'

const skipLink = createSkipLink('main-content', 'Skip to main content')
document.body.prepend(skipLink)
```

Skip links:
- Hidden by default
- Visible on focus
- Jump to target ID
- Improve keyboard navigation

### User Preferences

Respect user accessibility preferences:

```typescript
import {
  prefersReducedMotion,
  prefersHighContrast,
  getColorSchemePreference,
} from '@stacksjs/components'

// Check if user prefers reduced motion
if (prefersReducedMotion()) {
  // Disable or reduce animations
  element.style.transition = 'none'
}

// Check if high contrast mode is enabled
if (prefersHighContrast()) {
  // Adjust visual design
}

// Get color scheme preference
const scheme = getColorSchemePreference()
if (scheme === 'dark') {
  // Apply dark theme
}
```

### Validation

Validate ARIA relationships:

```typescript
import { validateAriaRelationships } from '@stacksjs/components'

const button = document.querySelector('button')
const errors = validateAriaRelationships(button)

if (errors.length > 0) {
  console.error('ARIA validation errors:', errors)
}
```

## Component Guidelines

### Buttons

```html
<!-- Good -->
<button type="button" aria-label="Close dialog">
  <span aria-hidden="true">×</span>
</button>

<!-- Good: Button with icon and text -->
<button type="submit">
  <span class="icon" aria-hidden="true">→</span>
  Submit Form
</button>

<!-- Bad: No accessible text -->
<button type="button">
  <span class="icon">×</span>
</button>
```

**Requirements:**
- Use `<button>` for actions, `<a>` for navigation
- Include accessible text (visible or aria-label)
- Set `type` attribute (button, submit, reset)
- Disable with `disabled` attribute, not aria-disabled alone
- Provide visual focus indicator

### Forms

```html
<!-- Good -->
<form>
  <label for="email">
    Email Address
    <span aria-label="required">*</span>
  </label>
  <input
    type="email"
    id="email"
    name="email"
    required
    aria-required="true"
    aria-invalid="false"
    aria-describedby="email-error email-hint"
  />
  <div id="email-hint">We'll never share your email</div>
  <div id="email-error" role="alert" aria-live="polite"></div>
</form>

<!-- Error state -->
<input
  type="email"
  id="email"
  aria-invalid="true"
/>
<div id="email-error" role="alert">
  Please enter a valid email address
</div>
```

**Requirements:**
- Associate labels with inputs (for/id or wrapping)
- Mark required fields with `required` and `aria-required`
- Indicate errors with `aria-invalid` and descriptive text
- Group related inputs with `<fieldset>` and `<legend>`
- Provide clear error messages

### Dialogs/Modals

```typescript
import { createFocusTrap, announceToScreenReader } from '@stacksjs/components'

function openDialog(dialogId: string) {
  const dialog = document.getElementById(dialogId)

  // Set ARIA attributes
  dialog.setAttribute('role', 'dialog')
  dialog.setAttribute('aria-modal', 'true')
  dialog.setAttribute('aria-labelledby', 'dialog-title')

  // Show dialog
  dialog.style.display = 'block'

  // Trap focus
  const trap = createFocusTrap(dialog, {
    escapeDeactivates: true,
    onDeactivate: () => closeDialog(dialogId),
  })
  trap.activate()

  // Announce to screen readers
  announceToScreenReader('Dialog opened', 'polite')
}
```

**Requirements:**
- Use `role="dialog"` or `role="alertdialog"`
- Set `aria-modal="true"`
- Label with `aria-labelledby` or `aria-label`
- Trap keyboard focus inside dialog
- Close on ESC key
- Return focus when closed
- Prevent body scroll when open

### Tooltips

```html
<button
  aria-describedby="tooltip-1"
  onmouseenter="showTooltip('tooltip-1')"
  onmouseleave="hideTooltip('tooltip-1')"
  onfocus="showTooltip('tooltip-1')"
  onblur="hideTooltip('tooltip-1')"
>
  Help
</button>
<div
  id="tooltip-1"
  role="tooltip"
  hidden
>
  Additional information about this feature
</div>
```

**Requirements:**
- Link tooltip with `aria-describedby`
- Show on hover AND focus
- Hide on mouse leave AND blur
- Use `role="tooltip"`
- Keep tooltips brief

### Accordions

```html
<div class="accordion">
  <h3>
    <button
      id="accordion-button-1"
      aria-expanded="false"
      aria-controls="accordion-panel-1"
    >
      Section 1 Title
    </button>
  </h3>
  <div
    id="accordion-panel-1"
    role="region"
    aria-labelledby="accordion-button-1"
    hidden
  >
    Section 1 content
  </div>
</div>
```

**Requirements:**
- Use heading + button structure
- Set `aria-expanded` on button
- Link button to panel with `aria-controls`
- Use `role="region"` on panel
- Toggle `hidden` attribute
- Support keyboard navigation (↑↓ arrows)

### Tabs

```html
<div class="tabs">
  <div role="tablist" aria-label="Content sections">
    <button
      role="tab"
      aria-selected="true"
      aria-controls="panel-1"
      id="tab-1"
      tabindex="0"
    >
      Tab 1
    </button>
    <button
      role="tab"
      aria-selected="false"
      aria-controls="panel-2"
      id="tab-2"
      tabindex="-1"
    >
      Tab 2
    </button>
  </div>

  <div
    role="tabpanel"
    id="panel-1"
    aria-labelledby="tab-1"
    tabindex="0"
  >
    Panel 1 content
  </div>
</div>
```

**Requirements:**
- Use proper ARIA roles (tablist, tab, tabpanel)
- Set `aria-selected` on active tab
- Link tabs to panels with id/aria-controls
- Implement roving tabindex
- Arrow keys navigate tabs
- Tab key moves to panel

### Data Tables

```html
<table>
  <caption>User List</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col">Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">John Doe</th>
      <td>john@example.com</td>
      <td>Admin</td>
    </tr>
  </tbody>
</table>
```

**Requirements:**
- Use `<caption>` for table description
- Use `<thead>`, `<tbody>`, `<tfoot>`
- Set `scope` on header cells (col/row)
- Use `<th>` for row headers
- Keep tables simple (avoid nested tables)

## Testing Accessibility

### Automated Testing

Use the accessibility test utilities:

```typescript
import {
  validateAriaRelationships,
  getFocusableElements,
  isVisibleToScreenReader,
} from '@stacksjs/components'

// Validate ARIA
const errors = validateAriaRelationships(element)
expect(errors).toHaveLength(0)

// Check focusable elements
const focusable = getFocusableElements(container)
expect(focusable.length).toBeGreaterThan(0)

// Check screen reader visibility
expect(isVisibleToScreenReader(element)).toBe(true)
```

### Manual Testing Checklist

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] ESC key closes dialogs/menus
- [ ] Arrow keys navigate menus/tabs/lists
- [ ] Enter/Space activate buttons
- [ ] No keyboard traps

**Screen Reader:**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Status messages are announced
- [ ] Error messages are clear
- [ ] Page landmarks are present

**Visual:**
- [ ] 4.5:1 contrast for text
- [ ] 3:1 contrast for UI elements
- [ ] Focus indicators are clear
- [ ] Text can zoom to 200%
- [ ] No content reflow at zoom
- [ ] Works at 320px width

**Content:**
- [ ] Headings are hierarchical (h1→h2→h3)
- [ ] Link text is descriptive
- [ ] Error messages are clear
- [ ] Forms have clear instructions

### Testing Tools

**Browser Extensions:**
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Screen Readers:**
- macOS: VoiceOver (Cmd+F5)
- Windows: NVDA (free)
- Windows: JAWS
- Linux: Orca

**Keyboard Testing:**
- Use Tab, Shift+Tab, Enter, Space, Arrow keys
- Disconnect mouse to force keyboard-only

## Common Patterns

### Loading States

```typescript
import { aria, announceToScreenReader } from '@stacksjs/components'

function startLoading(button: HTMLElement) {
  button.setAttribute('disabled', '')
  aria.setBusy(button, true)
  announceToScreenReader('Loading, please wait', 'polite')
}

function finishLoading(button: HTMLElement, success: boolean) {
  button.removeAttribute('disabled')
  aria.setBusy(button, false)

  if (success) {
    announceToScreenReader('Content loaded successfully', 'polite')
  }
  else {
    announceToScreenReader('Error loading content', 'assertive')
  }
}
```

### Form Validation

```typescript
import { aria, announceToScreenReader } from '@stacksjs/components'

function validateField(input: HTMLInputElement, errorId: string) {
  const isValid = input.checkValidity()
  const errorElement = document.getElementById(errorId)

  aria.setInvalid(input, !isValid)

  if (!isValid && errorElement) {
    errorElement.textContent = input.validationMessage
    errorElement.setAttribute('role', 'alert')
    announceToScreenReader(input.validationMessage, 'polite')
  }
  else if (errorElement) {
    errorElement.textContent = ''
  }
}
```

### Live Regions

```typescript
import { aria, announceToScreenReader } from '@stacksjs/components'

// Create live region for updates
const liveRegion = document.createElement('div')
liveRegion.id = 'live-region'
aria.setLive(liveRegion, 'polite')
liveRegion.setAttribute('aria-atomic', 'true')
document.body.appendChild(liveRegion)

// Update content
function updateStatus(message: string) {
  liveRegion.textContent = message
  // Also use announcer for better compatibility
  announceToScreenReader(message, 'polite')
}
```

### Responsive Focus Management

```typescript
import { createFocusTrap } from '@stacksjs/components'

// Mobile: Keep focus in drawer
// Desktop: Allow focus outside
const isMobile = window.innerWidth < 768

const trap = createFocusTrap(drawer, {
  clickOutsideDeactivates: !isMobile,
  allowOutsideClick: !isMobile,
})
```

## Resources

### Standards & Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [HTML Living Standard](https://html.spec.whatwg.org/)

### Testing Resources
- [WebAIM](https://webaim.org/)
- [a11y Project](https://www.a11yproject.com/)
- [Deque University](https://dequeuniversity.com/)

### Community
- [A11Y Slack](https://web-a11y.slack.com/)
- [W3C WAI](https://www.w3.org/WAI/)

---

**Questions or Issues?**

If you find accessibility issues or have questions, please:
1. Check this guide
2. Review [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
3. Open an issue on GitHub
4. Join our community discussions

**Remember:** Accessibility is not just about compliance—it's about creating better experiences for everyone.
