// Type definitions for test globals and extensions

declare global {
  interface Element {
    __dispatchEvent_safe: (event: Event) => boolean
  }

  interface HTMLElement {
    __dispatchEvent_safe: (event: Event) => boolean
  }

  interface HTMLInputElement {
    __dispatchEvent_safe: (event: Event) => boolean
  }

  interface HTMLSelectElement {
    __dispatchEvent_safe: (event: Event) => boolean
  }
}

export {}
