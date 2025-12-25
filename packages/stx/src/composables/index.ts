/**
 * STX Composables
 *
 * Nuxt-style reactive utilities for browser APIs.
 * These composables provide a streamlined, reactive interface to common browser features.
 *
 * @example
 * ```ts
 * import {
 *   useStorage,
 *   useCookie,
 *   useClipboard,
 *   useMediaQuery,
 *   useNetwork,
 *   useWindowSize,
 * } from '@stacksjs/stx/composables'
 * ```
 */

// Storage
export {
  useStorage,
  useLocalStorage,
  useSessionStorage,
  clearStorage,
  getStorageKeys,
  getStorageSize,
  type StorageType,
  type UseStorageOptions,
  type StorageRef,
} from './use-storage'

// Cookies
export {
  useCookie,
  useCookies,
  getCookie,
  setCookie,
  removeCookie,
  parseCookies,
  clearCookies,
  type CookieOptions,
  type CookieRef,
} from './use-cookie'

// Clipboard
export {
  useClipboard,
  copyToClipboard,
  type ClipboardRef,
} from './use-clipboard'

// Media Queries
export {
  useMediaQuery,
  usePreferredDark,
  usePreferredLight,
  usePreferredReducedMotion,
  usePreferredContrast,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  breakpoints,
  type MediaQueryRef,
} from './use-media-query'

// Network
export {
  useNetwork,
  useOnline,
  type NetworkState,
  type NetworkRef,
} from './use-network'

// Window
export {
  useWindowSize,
  useScroll,
  useVisibility,
  useTitle,
  useFavicon,
  type WindowSize,
  type ScrollPosition,
  type WindowSizeRef,
  type ScrollRef,
  type VisibilityRef,
} from './use-window'

// Geolocation
export {
  useGeolocation,
  useGeolocationWatch,
  getCurrentPosition,
  calculateDistance,
  type GeolocationCoords,
  type GeolocationState,
  type GeolocationOptions,
  type GeolocationRef,
} from './use-geolocation'

// Mouse & Pointer
export {
  useMouse,
  useMouseInElement,
  usePointer,
  type MouseState,
  type MouseOptions,
  type MouseRef,
  type ElementMouseState,
  type ElementMouseRef,
} from './use-mouse'

// Keyboard
export {
  useKeyboard,
  useHotkey,
  useKeyPressed,
  useKeySequence,
  shortcuts,
  type KeyboardState,
  type KeyboardOptions,
  type KeyboardRef,
  type HotkeyOptions,
} from './use-keyboard'

// Intersection Observer
export {
  useIntersectionObserver,
  useElementVisibility,
  useLazyLoad,
  useInfiniteScroll,
  useIntersectionObserverMultiple,
  type IntersectionObserverOptions,
  type IntersectionState,
  type IntersectionObserverRef,
} from './use-intersection-observer'

// Fetch & Async Data
export {
  useFetch,
  useAsyncData,
  usePost,
  clearFetchCache,
  prefetch,
  type FetchOptions,
  type FetchState,
  type FetchRef,
} from './use-fetch'

// Fullscreen
export {
  useFullscreen,
  toggleFullscreen,
  isInFullscreen,
  type FullscreenState,
  type FullscreenOptions,
  type FullscreenRef,
} from './use-fullscreen'

// Notifications
export {
  useNotification,
  notify,
  canNotify,
  requestNotificationPermission,
  notifications,
  type NotificationPermission,
  type NotificationState,
  type NotificationOptions,
  type NotificationRef,
} from './use-notification'
