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

// Share
export {
  useShare,
  share,
  shareURL,
  shareText,
  shareFiles,
  shareCurrentPage,
  shareWithFallback,
  createShareableFile,
  type ShareData,
  type ShareResult,
  type ShareRef,
} from './use-share'

// Permissions
export {
  usePermission,
  usePermissions,
  isPermissionGranted,
  hasCameraPermission,
  hasMicrophonePermission,
  hasGeolocationPermission,
  hasNotificationPermission,
  requestMediaPermissions,
  permissionGroups,
  type PermissionName,
  type PermissionState,
  type PermissionStatus,
  type PermissionRef,
  type MultiPermissionRef,
} from './use-permissions'

// Resize Observer
export {
  useResizeObserver,
  useResizeObserverMultiple,
  useElementSize,
  hasResizeObserver,
  type ResizeObserverSize,
  type ResizeObserverState,
  type ResizeObserverOptions,
  type ResizeObserverRef,
} from './use-resize-observer'

// Battery
export {
  useBattery,
  getBatteryLevel,
  isCharging,
  hasBattery,
  type BatteryState,
  type BatteryRef,
} from './use-battery'

// Speech Recognition & Synthesis
export {
  useSpeechRecognition,
  useSpeechSynthesis,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speak,
  stopSpeaking,
  getVoices,
  type SpeechRecognitionOptions,
  type SpeechRecognitionState,
  type SpeechRecognitionResult,
  type SpeechRecognitionRef,
  type SpeechSynthesisOptions,
  type SpeechSynthesisState,
  type SpeechSynthesisRef,
} from './use-speech'

// Broadcast Channel
export {
  useBroadcastChannel,
  broadcast,
  isBroadcastChannelSupported,
  type BroadcastChannelState,
  type BroadcastChannelOptions,
  type BroadcastChannelRef,
} from './use-broadcast-channel'

// WebSocket
export {
  useWebSocket,
  isWebSocketSupported,
  type WebSocketStatus,
  type WebSocketState,
  type WebSocketOptions,
  type WebSocketRef,
} from './use-websocket'

// Device Orientation & Motion
export {
  useDeviceOrientation,
  useDeviceMotion,
  useParallax,
  isDeviceOrientationSupported,
  isDeviceMotionSupported,
  requestOrientationPermission,
  requestMotionPermission,
  type DeviceOrientationState,
  type DeviceMotionState,
  type DeviceOrientationRef,
  type DeviceMotionRef,
} from './use-device-orientation'

// Mutation Observer
export {
  useMutationObserver,
  useAttributeObserver,
  useChildListObserver,
  useTextObserver,
  isMutationObserverSupported,
  type MutationObserverState,
  type MutationObserverOptions,
  type MutationObserverRef,
} from './use-mutation-observer'

// Event Source (SSE)
export {
  useEventSource,
  useSSE,
  isEventSourceSupported,
  type EventSourceStatus,
  type EventSourceState,
  type EventSourceOptions,
  type EventSourceRef,
} from './use-event-source'

// Idle Detection
export {
  useIdle,
  useIdleState,
  useLastActive,
  useAutoLogout,
  type IdleState,
  type IdleOptions,
  type IdleRef,
} from './use-idle'

// Text Selection
export {
  useTextSelection,
  useElementTextSelection,
  useSelectionPopup,
  useCopySelection,
  type TextSelectionState,
  type TextSelectionOptions,
  type TextSelectionRef,
} from './use-text-selection'

// Wake Lock
export {
  useWakeLock,
  useAutoWakeLock,
  useConditionalWakeLock,
  isWakeLockSupported,
  type WakeLockState,
  type WakeLockRef,
} from './use-wake-lock'

// Eye Dropper (Color Picker)
export {
  useEyeDropper,
  useColorHistory,
  pickColor,
  hexToRgb,
  hexToHsl,
  isEyeDropperSupported,
  type EyeDropperState,
  type EyeDropperResult,
  type EyeDropperOptions,
  type EyeDropperRef,
} from './use-eye-dropper'
