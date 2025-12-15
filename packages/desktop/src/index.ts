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
