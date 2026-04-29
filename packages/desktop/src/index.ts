/**
 * @stacksjs/desktop
 *
 * Native desktop application framework for stx
 *
 * This package provides a TypeScript API for creating native desktop applications
 * with the stx framework. Powered by Craft (~/Code/craft).
 *
 * ## Features
 * - Window Management: Create and control native windows
 * - System Tray: Build menubar applications
 * - Modals & Alerts: Native dialogs and notifications
 * - 35 UI Components: Complete component library
 * - Hot Reload: Development mode support
 */

// =============================================================================
// Alerts / Toast Notifications
// =============================================================================
export {
  dismissAlertById,
  dismissAllAlerts,
  getActiveAlertCount,
  notify,
  requestNotificationPermission,
  showAlert,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showToast,
  showWarningToast,
  TOAST_STYLES,
} from './alerts'

// =============================================================================
// Components (35 total)
// =============================================================================
export {
  // Component list and styles
  AVAILABLE_COMPONENTS,
  COMPONENT_STYLES,
  createAccordion,
  createAutocomplete,
  createAvatar,
  createBadge,
  // Input Components
  createButton,
  createCard,
  createChart,

  createCheckbox,
  createChip,
  createCodeEditor,
  createColorPicker,
  createDataGrid,
  createDatePicker,
  createDropdown,
  createFileExplorer,

  createImageView,
  // Display Components
  createLabel,
  // Data Components
  createListView,
  createMediaPlayer,
  createModalComponent,
  createProgressBar,
  createRadioButton,

  // Advanced Components
  createRating,
  // Layout Components
  createScrollView,
  createSlider,
  createSplitView,
  createStepper,

  createTable,
  createTabs,
  createTextInput,
  createTimePicker,
  createTooltip,

  createTreeView,
  createWebView,
} from './components'

export type {
  AccordionProps,
  AutocompleteProps,
  AvatarProps,
  BadgeProps,
  // Input Props
  ButtonProps,
  CardProps,
  ChartData,
  ChartOptions,
  ChartProps,
  CheckboxProps,
  ChipProps,
  CodeEditorProps,
  ColorPickerProps,
  ComponentName,
  DataGridProps,
  DatePickerProps,
  DropdownProps,
  FileExplorerProps,
  FileNode,
  ImageViewProps,
  // Display Props
  LabelProps,
  // Data Props
  ListViewProps,
  MediaPlayerProps,
  ModalComponentProps,
  ProgressBarProps,
  RadioButtonProps,
  // Advanced Props
  RatingProps,
  // Layout Props
  ScrollViewProps,
  SliderProps,
  SplitViewProps,
  StepperProps,
  TableProps,
  TabsProps,
  TextInputProps,
  TimePickerProps,
  TooltipProps,
  TreeNode,
  TreeViewProps,
  WebViewProps,
} from './components'

// =============================================================================
// Modal Dialogs
// =============================================================================
export {
  alert,
  closeAllModals,
  confirm,
  getActiveModalCount,
  MODAL_STYLES,
  prompt,
  showErrorModal,
  showInfoModal,
  showModal,
  showQuestionModal,
  showSuccessModal,
  showWarningModal,
} from './modals'

// =============================================================================
// System Tray / Menubar
// =============================================================================
export {
  createMenubar,
  createSystemTray,
  getActiveTrayInstances,
  getSimulatedTrayHTML,
  getTrayBridgeScript,
  getTrayInstance,
  TRAY_MENU_STYLES,
  triggerTrayAction,
} from './system-tray'

// =============================================================================
// Native Dialogs
// =============================================================================
export {
  getDialogBridgeScript,
  showAlertDialog,
  showColorPicker,
  showConfirmDialog,
  showErrorDialog,
  showMessageBox,
  showOpenDialog,
  showSaveDialog,
  showWarningDialog,
} from './dialogs'

export type {
  ColorPickerOptions,
  ColorPickerResult,
  FileFilter,
  MessageBoxOptions,
  MessageBoxResult,
  OpenDialogOptions,
  OpenDialogResult,
  SaveDialogOptions,
  SaveDialogResult,
} from './dialogs'

// =============================================================================
// Core Types
// =============================================================================
export type {
  AlertOptions,
  ComponentProps,
  ModalButton,
  ModalOptions,
  ModalResult,
  SidebarConfig,
  SystemTrayInstance,
  SystemTrayMenuItem,
  SystemTrayOptions,
  ToastOptions,
  WindowInstance,
  WindowOptions,
} from './types'

// =============================================================================
// Window Management
// =============================================================================
export {
  closeAllWindows,
  createWindow,
  createWindowWithHTML,
  getActiveWindowIds,
  getDesktopConfig,
  getWindow,
  getWindowBridgeScript,
  isWebviewAvailable,
  openDevWindow,
  resetDesktopConfig,
  setDesktopConfig,
} from './window'

export type { DesktopConfig } from './window'

// =============================================================================
// Power Management / Caffeinate
// =============================================================================
export {
  caffeinate,
  decaffeinate,
  formatDuration,
  formatRemainingTime,
  getCaffeinateStatus,
  isCaffeinated,
} from './power'

export type {
  CaffeinateInstance,
  CaffeinateOptions,
  CaffeinateStatus,
} from './power'

// =============================================================================
// Preferences / Settings Storage
// =============================================================================
export {
  createPreferences,
} from './preferences'

export type {
  Preferences,
  PreferencesOptions,
} from './preferences'

// =============================================================================
// Auto-Launch / Login Items
// =============================================================================
export {
  isAutoLaunchEnabled,
  setAutoLaunch,
} from './autolaunch'

export type {
  AutoLaunchOptions,
} from './autolaunch'

// =============================================================================
// Global Hotkeys
// =============================================================================
export {
  formatShortcut,
  getRegisteredHotkeys,
  parseShortcut,
  registerHotkey,
  unregisterAllHotkeys,
  unregisterHotkey,
} from './hotkeys'

export type {
  HotkeyRegistration,
  ParsedShortcut,
} from './hotkeys'

// =============================================================================
// Timer / Scheduling
// =============================================================================
export {
  createInterval,
  createTimer,
  delay,
  formatCompact,
  formatTime,
} from './timer'

export type {
  Interval,
  IntervalOptions,
  Timer,
  TimerOptions,
} from './timer'

// =============================================================================
// Clipboard
// =============================================================================
export { clipboard } from './clipboard'
export type { Clipboard } from './clipboard'

// =============================================================================
// System Notifications (banner + badge — distinct from in-app toasts in alerts.ts)
// =============================================================================
export { notifications } from './notifications'
export type { NotificationOptions, SystemNotifications } from './notifications'

// =============================================================================
// Filesystem
// =============================================================================
export { fs } from './fs'
export type { DirEntry, FileStat, FS, MkdirOptions, RmdirOptions } from './fs'

// =============================================================================
// Shell — open URLs/paths, spawn subprocesses
// =============================================================================
export { shell } from './shell'
export type { Shell, SpawnOptions } from './shell'

// =============================================================================
// Global Shortcuts (system-wide hotkeys — distinct from in-window hotkeys.ts)
// =============================================================================
export { globalShortcuts } from './global-shortcuts'
export type {
  GlobalShortcutOptions,
  GlobalShortcuts,
  ShortcutFireEvent,
} from './global-shortcuts'

// =============================================================================
// System Theme (light/dark)
// =============================================================================
export { theme } from './theme'
export type { Appearance, SystemTheme, ThemeInfo } from './theme'

// =============================================================================
// Native Drag-Out
// =============================================================================
export { dragOut, isDragOutAvailable } from './drag-out'
export type { DragOutOptions } from './drag-out'

// =============================================================================
// Deep Links (custom URL schemes)
// =============================================================================
export { deepLinks } from './deep-link'
export type { DeepLinkEvent, DeepLinks } from './deep-link'

// =============================================================================
// Battery / Power State (system-level metrics — distinct from caffeinate in power.ts)
// =============================================================================
export { battery } from './battery'
export type { BatteryAPI, ThermalState } from './battery'

// =============================================================================
// Network / Reachability
// =============================================================================
export { network } from './network'
export type {
  ConnectionType,
  NetworkAPI,
  NetworkInterface,
  ProxySettings,
} from './network'

// =============================================================================
// Auto-Updater
// =============================================================================
export { updater } from './updater'
export type { UpdateInfo, Updater } from './updater'

// =============================================================================
// Window Lifecycle Events
// =============================================================================
export { windowEvents } from './window-events'
export type { WindowEvents, WindowPosition, WindowSize } from './window-events'

// =============================================================================
// App Metadata + Process Controls
// =============================================================================
export { app as appInfo } from './app-info'
export type { AppAPI, AppInfo, AppNotifyOptions } from './app-info'

// =============================================================================
// Native Application Menu (macOS menubar + dock menu)
// =============================================================================
export { menu } from './menu'
export type { MenuActionEvent, MenuAPI, MenuItem } from './menu'

// =============================================================================
// System / Host Info
// =============================================================================
export { system } from './system'
export type { SystemInfo } from './system'

// =============================================================================
// Display / Multi-Monitor
// =============================================================================
export { screen } from './screen'
export type { Display, ScreenAPI } from './screen'

// =============================================================================
// Keychain — Secure Secret Storage
// =============================================================================
export { keychain } from './keychain'
export type { KeychainAPI } from './keychain'

// =============================================================================
// Privacy Permissions (camera/mic/screen-recording/etc)
// =============================================================================
export { permissions } from './permissions'
export type { PermissionName, PermissionsAPI, PermissionStatus } from './permissions'

// =============================================================================
// Printing / Save-as-PDF
// =============================================================================
export { printing } from './printing'
export type { PrintingAPI, PrintToPDFResult } from './printing'

// =============================================================================
// Native Auto-Launch (SMAppService — distinct from autolaunch.ts)
// =============================================================================
export { nativeAutoLaunch } from './native-autolaunch'
export type { NativeAutoLaunchAPI } from './native-autolaunch'

// =============================================================================
// Touch Bar (legacy macOS hardware)
// =============================================================================
export { touchbar } from './touchbar'
export type { TouchBarActionEvent, TouchBarAPI, TouchBarItem, TouchBarItemType } from './touchbar'

// =============================================================================
// Bluetooth
// =============================================================================
export { bluetooth } from './bluetooth'
export type { BluetoothAPI, BluetoothDevice, BluetoothPowerState } from './bluetooth'

// =============================================================================
// Text-to-Speech
// =============================================================================
export { speech } from './speech'
export type { SpeakOptions, SpeechAPI, SpeechVoice } from './speech'

// =============================================================================
// Crash Reporter
// =============================================================================
export { crashReporter } from './crash-reporter'
export type { CrashReport, CrashReporterAPI, CrashSeverity, StoredCrashEntry } from './crash-reporter'

// =============================================================================
// In-App Purchases
// =============================================================================
export { iap } from './iap'
export type {
  IAPAPI,
  IAPFailureEvent,
  IAPProduct,
  IAPPurchaseResult,
  IAPTransactionEvent,
} from './iap'

// =============================================================================
// Handoff (Apple Continuity / NSUserActivity)
// =============================================================================
export { handoff } from './handoff'
export type {
  HandoffActivityOptions,
  HandoffAPI,
  HandoffIncomingEvent,
  HandoffSnapshot,
} from './handoff'

// =============================================================================
// Live Activities (macOS Handoff-backed approximation of iOS ActivityKit)
// =============================================================================
export { liveActivities } from './live-activities'
export type { LiveActivitiesAPI, LiveActivityState } from './live-activities'

// =============================================================================
// Geolocation (CoreLocation)
// =============================================================================
export { location } from './location'
export type {
  LocationAPI,
  LocationAuthStatus,
  LocationCoordinate,
  LocationWatchOptions,
} from './location'

// =============================================================================
// Screen Capture (programmatic screenshots)
// =============================================================================
export { screenCapture } from './screen-capture'
export type { CapturableWindow, ScreenCaptureAPI } from './screen-capture'

// =============================================================================
// Local HTTP Server (OAuth callbacks)
// =============================================================================
export { localServer } from './local-server'
export type {
  LocalServerAPI,
  LocalServerRequestEvent,
  LocalServerRespondOptions,
  LocalServerStartResult,
} from './local-server'

// =============================================================================
// Biometric Authentication (TouchID / FaceID)
// =============================================================================
export { biometric } from './biometric'
export type {
  BiometricAPI,
  BiometricEvaluateOptions,
  BiometricEvaluateResult,
  BiometryType,
} from './biometric'

// =============================================================================
// Audio Playback + Recording
// =============================================================================
export { audio } from './audio'
export type { AudioAPI, AudioPlayOptions, AudioRecordOptions } from './audio'

// =============================================================================
// AppleScript Executor
// =============================================================================
export { appleScript } from './apple-script'
export type { AppleScriptAPI, AppleScriptResult } from './apple-script'

// =============================================================================
// File Associations (LaunchServices)
// =============================================================================
export { fileAssociations } from './file-associations'
export type { FileAssociationsAPI } from './file-associations'

// =============================================================================
// Finder Tags
// =============================================================================
export { tags } from './tags'
export type { TagsAPI } from './tags'

// =============================================================================
// PDF Reader (PDFKit)
// =============================================================================
export { pdf } from './pdf'
export type { PDFAPI } from './pdf'

// =============================================================================
// Unified System Log
// =============================================================================
export { log } from './log'
export type { LogAPI } from './log'

// =============================================================================
// mDNS / Bonjour
// =============================================================================
export { bonjour } from './bonjour'
export type { BonjourAPI, BonjourService } from './bonjour'

// =============================================================================
// Spotlight Indexing
// =============================================================================
export { spotlight } from './spotlight'
export type { SpotlightAPI, SpotlightItem } from './spotlight'

// =============================================================================
// Speech Recognition (SFSpeechRecognizer)
// =============================================================================
export { speechRecognition } from './speech-recognition'
export type { SpeechRecognitionAPI, SpeechRecognitionStartOptions } from './speech-recognition'

// =============================================================================
// Vision Framework (OCR / Faces / Barcodes)
// =============================================================================
export { vision } from './vision'
export type { VisionAPI, VisionBarcodeResult, VisionFaceResult, VisionTextResult } from './vision'

// =============================================================================
// CoreMIDI
// =============================================================================
export { midi } from './midi'
export type { MIDIAPI, MIDIEndpoint, MIDIMessageEvent } from './midi'

// =============================================================================
// CoreML — on-device inference
// =============================================================================
export { coreml } from './coreml'
export type { CoreMLAPI } from './coreml'

// =============================================================================
// Continuity Camera
// =============================================================================
export { continuityCamera } from './continuity-camera'
export type { ContinuityCameraAPI, ContinuityCameraDevice } from './continuity-camera'

// =============================================================================
// macOS Services Menu
// =============================================================================
export { serviceMenu } from './service-menu'
export type { ServiceMenuAPI, ServiceMenuInvokedEvent } from './service-menu'

// =============================================================================
// Serial Ports
// =============================================================================
export { serial } from './serial'
export type { SerialAPI, SerialDataEvent, SerialPort } from './serial'
