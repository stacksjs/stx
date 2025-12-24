/**
 * Voide Composables
 *
 * Nuxt-style reactive utilities for browser APIs.
 */

// Storage
export {
  useStorage,
  useLocalStorage,
  useSessionStorage,
  clearStorage,
  getStorageKeys,
  type StorageType,
  type UseStorageOptions,
  type StorageRef,
} from './use-storage'

// Cookies
export {
  useCookie,
  getCookie,
  setCookie,
  removeCookie,
  parseCookies,
  clearCookies,
  type CookieOptions,
  type CookieRef,
} from './use-cookie'

// Browser APIs
export {
  // Clipboard
  useClipboard,
  copyToClipboard,
  type ClipboardRef,
  // Media Queries
  useMediaQuery,
  usePreferredDark,
  usePreferredReducedMotion,
  useIsMobile,
  useIsDesktop,
  type MediaQueryRef,
  // Network
  useNetwork,
  useOnline,
  type NetworkState,
  type NetworkRef,
  // Window
  useWindowSize,
  useScroll,
  useVisibility,
  useTitle,
  useFavicon,
} from './use-browser'
