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
  // Input Components
  createButton,
  createTextInput,
  createCheckbox,
  createRadioButton,
  createSlider,
  createColorPicker,
  createDatePicker,
  createTimePicker,
  createAutocomplete,

  // Display Components
  createLabel,
  createImageView,
  createProgressBar,
  createAvatar,
  createBadge,
  createChip,
  createCard,
  createTooltip,

  // Layout Components
  createScrollView,
  createSplitView,
  createAccordion,
  createStepper,
  createModalComponent,
  createTabs,
  createDropdown,

  // Data Components
  createListView,
  createTable,
  createTreeView,
  createDataGrid,
  createChart,

  // Advanced Components
  createRating,
  createCodeEditor,
  createMediaPlayer,
  createFileExplorer,
  createWebView,

  // Component list and styles
  AVAILABLE_COMPONENTS,
  COMPONENT_STYLES,
} from './components'

export type {
  ComponentName,
  // Input Props
  ButtonProps,
  TextInputProps,
  CheckboxProps,
  RadioButtonProps,
  SliderProps,
  ColorPickerProps,
  DatePickerProps,
  TimePickerProps,
  AutocompleteProps,
  // Display Props
  LabelProps,
  ImageViewProps,
  ProgressBarProps,
  AvatarProps,
  BadgeProps,
  ChipProps,
  CardProps,
  TooltipProps,
  // Layout Props
  ScrollViewProps,
  SplitViewProps,
  AccordionProps,
  StepperProps,
  ModalComponentProps,
  TabsProps,
  DropdownProps,
  // Data Props
  ListViewProps,
  TableProps,
  TreeViewProps,
  TreeNode,
  DataGridProps,
  ChartProps,
  ChartData,
  ChartOptions,
  // Advanced Props
  RatingProps,
  CodeEditorProps,
  MediaPlayerProps,
  FileExplorerProps,
  FileNode,
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
  getTrayInstance,
  TRAY_MENU_STYLES,
  triggerTrayAction,
} from './system-tray'

// =============================================================================
// Window Management
// =============================================================================
export {
  createWindow,
  createWindowWithHTML,
  getDesktopConfig,
  isWebviewAvailable,
  openDevWindow,
  resetDesktopConfig,
  setDesktopConfig,
} from './window'

export type { DesktopConfig } from './window'

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
