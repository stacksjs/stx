/**
 * STX Media Module Types
 *
 * Comprehensive type definitions for responsive images, video,
 * content protection, file upload, and media management.
 *
 * @module media/types
 */

// =============================================================================
// Placeholder Types
// =============================================================================

/**
 * Placeholder generation strategies for lazy loading
 */
export type PlaceholderStrategy =
  | 'blur' // Low-quality blurred image (LQIP)
  | 'thumbhash' // Thumbhash-based placeholder
  | 'blurhash' // Blurhash-based placeholder
  | 'pixelate' // Pixelated low-res version
  | 'dominant-color' // Solid dominant color
  | 'none' // No placeholder

/**
 * Options for placeholder generation
 */
export interface PlaceholderOptions {
  /** Strategy for generating placeholder */
  strategy: PlaceholderStrategy
  /** Width of placeholder image (default: 20) */
  width?: number
  /** Height of placeholder image */
  height?: number
  /** Quality for blur strategy (1-100) */
  quality?: number
  /** Blur level for blur strategy (0-100) */
  blurLevel?: number
  /** CSS transition duration in ms */
  transitionDuration?: number
  /** CSS transition easing function */
  easing?: string
}

/**
 * Result from placeholder generation
 */
export interface PlaceholderResult {
  /** Base64 data URL for the placeholder */
  dataURL: string
  /** Placeholder width */
  width: number
  /** Placeholder height */
  height: number
  /** Original image aspect ratio */
  aspectRatio: number
  /** Original image width */
  originalWidth: number
  /** Original image height */
  originalHeight: number
  /** Strategy used */
  strategy: PlaceholderStrategy
  /** Dominant color (for dominant-color strategy) */
  dominantColor?: string
  /** Optional CSS for the placeholder */
  css?: string
}

// =============================================================================
// Image Types
// =============================================================================

/**
 * Supported image formats
 */
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'gif'

/**
 * Image fit modes (similar to CSS object-fit)
 */
export type ImageFit = 'clip' | 'crop' | 'fill' | 'max' | 'min' | 'scale' | 'cover' | 'contain'

/**
 * Image crop positions
 */
export type ImageCrop =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'faces' // AI face detection
  | 'entropy' // Maximum entropy region

/**
 * imgix-style image transformation parameters
 */
export interface ImageParams {
  // Sizing
  /** Width in pixels */
  w?: number
  /** Height in pixels */
  h?: number
  /** Fit mode */
  fit?: ImageFit
  /** Crop position */
  crop?: ImageCrop
  /** Aspect ratio (e.g., "16:9") */
  ar?: string

  // Format & Quality
  /** Output format */
  fm?: ImageFormat
  /** Quality (1-100) */
  q?: number
  /** Lossless compression */
  lossless?: boolean
  /** Progressive rendering */
  progressive?: boolean

  // Adjustments
  /** Blur radius (0-2000) */
  blur?: number
  /** Sharpen amount (0-100) */
  sharp?: number
  /** Brightness (-100 to 100) */
  bri?: number
  /** Contrast (-100 to 100) */
  con?: number
  /** Saturation (-100 to 100) */
  sat?: number
  /** Hue rotation (0-360) */
  hue?: number
  /** Exposure (-100 to 100) */
  exp?: number
  /** Vibrance (-100 to 100) */
  vib?: number
  /** Highlight (-100 to 100) */
  high?: number
  /** Shadow (-100 to 100) */
  shad?: number
  /** Gamma (0.1 to 10) */
  gam?: number

  // Transformations
  /** Rotation degrees (0-359) */
  rot?: number
  /** Flip: h (horizontal), v (vertical), hv (both) */
  flip?: 'h' | 'v' | 'hv'
  /** Orientation (auto-rotate based on EXIF) */
  orient?: number

  // Watermark
  /** Watermark image URL */
  mark?: string
  /** Watermark X position */
  markx?: number
  /** Watermark Y position */
  marky?: number
  /** Watermark opacity (0-1) */
  markalpha?: number
  /** Watermark scale (0-1) */
  markscale?: number
  /** Watermark alignment */
  markalign?: 'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right'

  // Effects
  /** Apply sepia tone (0-100) */
  sepia?: number
  /** Apply pixelate effect (1-100) */
  px?: number
  /** Monochrome with tint color */
  mono?: string
  /** Duotone colors (highlight,shadow) */
  duotone?: string
  /** Invert colors */
  invert?: boolean

  // Auto enhancements
  /** Auto-enhance: format, compress, enhance */
  auto?: string | string[]

  // Device pixel ratio
  /** Device pixel ratio (1-5) */
  dpr?: number
}

/**
 * Image variant generated at a specific size/format
 */
export interface ImageVariant {
  /** Output file path */
  path: string
  /** URL for srcset */
  url: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Output format */
  format: ImageFormat
  /** File size in bytes */
  size: number
  /** Device pixel ratio (for DPR-based srcsets) */
  dpr?: number
}

/**
 * Processed image with all variants
 */
export interface ProcessedImage {
  /** Original source path */
  src: string
  /** Generated variants */
  variants: ImageVariant[]
  /** Placeholder data */
  placeholder?: PlaceholderResult
  /** Original width */
  width: number
  /** Original height */
  height: number
  /** Aspect ratio */
  aspectRatio: number
  /** Content hash for caching */
  hash: string
}

/**
 * <Img> component props
 */
export interface ImgProps {
  /** Image source URL or path */
  src: string
  /** Alternative text (required for accessibility) */
  alt: string
  /** Display width */
  width?: number | string
  /** Display height */
  height?: number | string
  /** Responsive sizes attribute */
  sizes?: string
  /** Custom breakpoint widths for srcset */
  widths?: number[]
  /** Device pixel ratios for fixed-width images */
  dpr?: number[]
  /** Output formats (default: ['avif', 'webp', 'jpeg']) */
  formats?: ImageFormat[]
  /** Output quality (1-100) */
  quality?: number
  /** imgix-style transformation params */
  params?: ImageParams
  /** Placeholder strategy */
  placeholder?: PlaceholderStrategy
  /** Placeholder options */
  placeholderOptions?: Partial<PlaceholderOptions>
  /** Enable lazy loading (default: true) */
  lazy?: boolean
  /** High priority (preload, fetchpriority=high) */
  priority?: boolean
  /** Loading attribute */
  loading?: 'lazy' | 'eager'
  /** Decoding hint */
  decoding?: 'sync' | 'async' | 'auto'
  /** Fetch priority */
  fetchpriority?: 'high' | 'low' | 'auto'
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  /** Object position */
  objectPosition?: string
  /** CSS class */
  class?: string
  /** Inline styles */
  style?: string
  /** ID attribute */
  id?: string
  /** Data attributes */
  data?: Record<string, string>
  /** Cross-origin setting */
  crossorigin?: 'anonymous' | 'use-credentials'
  /** Referrer policy */
  referrerpolicy?: string
}

/**
 * @img directive options
 */
export interface ImgDirectiveOptions extends Omit<ImgProps, 'src' | 'alt'> {
  /** Custom srcset string (overrides auto-generation) */
  srcset?: string
}

/**
 * Image render context
 */
export interface ImageRenderContext {
  /** Pre-processed image data */
  processedImage?: ProcessedImage
  /** Whether optimization is enabled */
  optimize?: boolean
  /** Development mode flag */
  isDev?: boolean
  /** Base URL for generated images */
  baseUrl?: string
  /** Output directory */
  outputDir?: string
}

/**
 * Image render result
 */
export interface ImageRenderResult {
  /** Generated HTML */
  html: string
  /** Preload link tag (for priority images) */
  preloadLink?: string
  /** CSS for placeholder */
  css?: string
  /** Client-side script */
  script?: string
}

// =============================================================================
// Video Types
// =============================================================================

/**
 * Video source definition
 */
export interface VideoSource {
  /** Video URL */
  src: string
  /** MIME type (e.g., 'video/mp4') */
  type: string
  /** Media query for adaptive sources */
  media?: string
  /** Codec specification */
  codecs?: string
}

/**
 * Video embed type
 */
export type VideoEmbedType = 'video' | 'youtube' | 'vimeo' | 'dailymotion' | 'twitch'

/**
 * Plyr.js control options
 */
export type PlyrControl =
  | 'play-large'
  | 'restart'
  | 'rewind'
  | 'play'
  | 'fast-forward'
  | 'progress'
  | 'current-time'
  | 'duration'
  | 'mute'
  | 'volume'
  | 'captions'
  | 'settings'
  | 'pip'
  | 'airplay'
  | 'fullscreen'

/**
 * Plyr.js configuration options
 */
export interface PlyrOptions {
  /** Enable/disable controls */
  controls?: PlyrControl[] | boolean
  /** Autoplay on load */
  autoplay?: boolean
  /** Mute by default */
  muted?: boolean
  /** Loop playback */
  loop?: { active: boolean }
  /** Seek time in seconds */
  seekTime?: number
  /** Volume (0-1) */
  volume?: number
  /** Click to play/pause */
  clickToPlay?: boolean
  /** Hide controls timeout (ms) */
  hideControls?: number
  /** Reset to start when playback ends */
  resetOnEnd?: boolean
  /** Disable context menu */
  disableContextMenu?: boolean
  /** Keyboard shortcuts */
  keyboard?: { focused: boolean; global: boolean }
  /** Tooltips */
  tooltips?: { controls: boolean; seek: boolean }
  /** Quality selector options */
  quality?: { default: number; options: number[]; forced: boolean }
  /** Captions settings */
  captions?: { active: boolean; language: string; update: boolean }
  /** Storage settings */
  storage?: { enabled: boolean; key: string }
  /** Speed settings */
  speed?: { selected: number; options: number[] }
  /** Ratio for responsive sizing */
  ratio?: string
  /** Full screen settings */
  fullscreen?: { enabled: boolean; fallback: boolean; iosNative: boolean }
  /** Preview thumbnails */
  previewThumbnails?: { enabled: boolean; src: string }
  /** i18n strings */
  i18n?: Record<string, string>
}

/**
 * <Video> component props
 */
export interface VideoProps {
  /** Video source URL */
  src?: string
  /** Multiple video sources */
  sources?: VideoSource[]
  /** Poster image URL */
  poster?: string
  /** Placeholder for poster image */
  posterPlaceholder?: PlaceholderStrategy
  /** Show controls */
  controls?: boolean
  /** Autoplay on load */
  autoplay?: boolean
  /** Mute audio */
  muted?: boolean
  /** Loop playback */
  loop?: boolean
  /** Preload behavior */
  preload?: 'none' | 'metadata' | 'auto'
  /** Inline playback (iOS) */
  playsinline?: boolean
  /** Enable lazy loading */
  lazy?: boolean
  /** Video player type */
  player?: 'native' | 'plyr'
  /** Plyr.js options */
  plyrOptions?: PlyrOptions
  /** Embed type */
  type?: VideoEmbedType
  /** Width */
  width?: number | string
  /** Height */
  height?: number | string
  /** CSS class */
  class?: string
  /** Inline styles */
  style?: string
  /** ID attribute */
  id?: string
  /** Cross-origin setting */
  crossorigin?: 'anonymous' | 'use-credentials'
  /** Disable picture-in-picture */
  disablePictureInPicture?: boolean
  /** Disable remote playback */
  disableRemotePlayback?: boolean
}

/**
 * @video directive options
 */
export interface VideoDirectiveOptions extends Omit<VideoProps, 'src'> {}

/**
 * Video render result
 */
export interface VideoRenderResult {
  /** Generated HTML */
  html: string
  /** Script tags for player initialization */
  script?: string
  /** CSS styles */
  css?: string
}

// =============================================================================
// Upload Types
// =============================================================================

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  valid: boolean
  /** Error message if invalid */
  error?: string
  /** Validation error code */
  code?: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'FILE_TOO_SMALL' | 'INVALID_DIMENSIONS'
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** File being uploaded */
  file: File
  /** Bytes loaded */
  loaded: number
  /** Total bytes */
  total: number
  /** Percentage complete (0-100) */
  percent: number
  /** Upload speed in bytes/sec */
  speed?: number
  /** Estimated time remaining in ms */
  timeRemaining?: number
}

/**
 * Upload result
 */
export interface UploadResult {
  /** Whether upload succeeded */
  success: boolean
  /** Uploaded file URL */
  url?: string
  /** File ID from server */
  id?: string
  /** File name */
  name?: string
  /** File size */
  size?: number
  /** MIME type */
  type?: string
  /** Error message if failed */
  error?: string
  /** Error code */
  errorCode?: string
  /** Server response data */
  data?: Record<string, unknown>
}

/**
 * Upload configuration
 */
export interface UploadConfig {
  /** Upload endpoint URL */
  endpoint: string
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT' | 'PATCH'
  /** Request headers */
  headers?: Record<string, string>
  /** Form field name (default: 'file') */
  fieldName?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Minimum file size in bytes */
  minSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Accepted MIME types */
  accept?: string[]
  /** Chunk size for chunked uploads (bytes) */
  chunkSize?: number
  /** Number of retry attempts */
  retries?: number
  /** Timeout in ms */
  timeout?: number
  /** With credentials (cookies) */
  withCredentials?: boolean
  /** Additional form data */
  formData?: Record<string, string>
  /** Validate image dimensions */
  validateDimensions?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }
}

/**
 * <MediaUpload> component props
 */
export interface MediaUploadProps extends UploadConfig {
  /** Show file preview */
  preview?: boolean
  /** Enable drag and drop */
  dropzone?: boolean
  /** Multiple file selection */
  multiple?: boolean
  /** Auto-upload on file selection */
  autoUpload?: boolean
  /** Show progress bar */
  showProgress?: boolean
  /** Disabled state */
  disabled?: boolean
  /** CSS class */
  class?: string
  /** Inline styles */
  style?: string
  /** ID attribute */
  id?: string
  /** Placeholder text */
  placeholder?: string
  /** Label text */
  label?: string
}

/**
 * @upload directive options
 */
export interface UploadDirectiveOptions extends Omit<MediaUploadProps, 'endpoint'> {
  /** Progress callback variable name */
  onProgress?: string
  /** Complete callback variable name */
  onComplete?: string
  /** Error callback variable name */
  onError?: string
}

// =============================================================================
// Protected Media Types
// =============================================================================

/**
 * Signed URL result
 */
export interface SignedUrl {
  /** Signed URL */
  url: string
  /** Signature token */
  signature: string
  /** Expiration timestamp (ms) */
  expires: number
  /** Whether URL is one-time use */
  oneTimeUse?: boolean
}

/**
 * Signature request configuration
 */
export interface SignatureConfig {
  /** Signature endpoint URL */
  endpoint: string
  /** HTTP method (default: POST) */
  method?: 'GET' | 'POST'
  /** Request headers */
  headers?: Record<string, string>
  /** Expiration time in seconds */
  expirationSeconds?: number
  /** Generate one-time use URL */
  oneTimeUse?: boolean
  /** Custom parameters to include */
  params?: Record<string, unknown>
}

/**
 * Batch signature request
 */
export interface BatchSignatureRequest {
  /** Array of source URLs to sign */
  sources: string[]
  /** Signature configuration */
  config: SignatureConfig
}

/**
 * Batch signature result
 */
export interface BatchSignatureResult {
  /** Map of source URL to signed URL */
  signatures: Map<string, SignedUrl>
  /** Sources that failed to sign */
  errors: Map<string, string>
}

/**
 * Protected media authentication context
 */
export interface ProtectedAuthContext {
  /** Required role */
  role?: string
  /** Required permission */
  permission?: string
  /** User ID (for ownership check) */
  userId?: string
  /** Custom auth function */
  check?: () => boolean | Promise<boolean>
}

/**
 * <ProtectedImg> component props
 */
export interface ProtectedMediaProps {
  /** Source URL (to be signed) */
  src: string
  /** Alternative text */
  alt?: string
  /** Signature endpoint */
  signatureEndpoint?: string
  /** Signature configuration */
  signatureConfig?: Partial<SignatureConfig>
  /** Authentication context */
  auth?: ProtectedAuthContext
  /** Fallback image if unauthorized */
  fallback?: string
  /** One-time use URL */
  oneTimeUse?: boolean
  /** CSS class */
  class?: string
  /** Inline styles */
  style?: string
}

/**
 * @protected directive options
 */
export interface ProtectedDirectiveOptions extends Omit<ProtectedMediaProps, 'src' | 'alt'> {}

// =============================================================================
// Media Manager Types
// =============================================================================

/**
 * Media manager configuration
 */
export interface MediaManagerConfig {
  /** CDN script URL */
  src: string
  /** API key */
  apiKey?: string
  /** Storage bucket */
  bucket?: string
  /** Allowed file types */
  allowedTypes?: string[]
  /** Maximum file size */
  maxFileSize?: number
  /** Allow multiple selection */
  multiple?: boolean
  /** Custom styling */
  customStyles?: Record<string, string>
  /** Callback variable names */
  callbacks?: {
    onSelect?: string
    onUpload?: string
    onDelete?: string
    onError?: string
  }
}

/**
 * Media item from manager
 */
export interface MediaItem {
  /** Unique ID */
  id: string
  /** File URL */
  url: string
  /** File name */
  name: string
  /** MIME type */
  type: string
  /** File size in bytes */
  size: number
  /** Width (for images/videos) */
  width?: number
  /** Height (for images/videos) */
  height?: number
  /** Duration in seconds (for audio/video) */
  duration?: number
  /** Creation timestamp */
  createdAt: string
  /** Last modified timestamp */
  updatedAt: string
  /** Custom metadata */
  metadata?: Record<string, unknown>
}

// =============================================================================
// Media Configuration Types
// =============================================================================

/**
 * Image optimization configuration
 */
export interface MediaImageConfig {
  /** Enable image optimization */
  enabled?: boolean
  /** Default breakpoint widths */
  defaultWidths?: number[]
  /** Default output formats */
  defaultFormats?: ImageFormat[]
  /** Default quality (1-100) */
  defaultQuality?: number
  /** Default placeholder strategy */
  placeholderStrategy?: PlaceholderStrategy
  /** Lazy load by default */
  lazyByDefault?: boolean
  /** URL-based editing endpoint */
  editingEndpoint?: string | null
  /** Output directory for generated images */
  outputDir?: string
  /** Base URL for generated images */
  baseUrl?: string
  /** Enable device pixel ratio handling */
  enableDpr?: boolean
  /** Default DPR values */
  defaultDpr?: number[]
}

/**
 * Video configuration
 */
export interface MediaVideoConfig {
  /** Enable video features */
  enabled?: boolean
  /** Plyr.js CDN version */
  plyrVersion?: string
  /** Plyr.js theme URL */
  plyrTheme?: string
  /** Lazy load videos by default */
  lazyByDefault?: boolean
  /** Default controls for native player */
  defaultControls?: boolean
  /** Default Plyr options */
  defaultPlyrOptions?: Partial<PlyrOptions>
}

/**
 * Upload configuration
 */
export interface MediaUploadConfig {
  /** Enable upload features */
  enabled?: boolean
  /** Default upload endpoint */
  defaultEndpoint?: string
  /** Default max file size (bytes) */
  maxSize?: number
  /** Allowed file types */
  allowedTypes?: string[]
  /** Chunk size for large uploads */
  chunkSize?: number
  /** Maximum concurrent uploads */
  maxConcurrent?: number
}

/**
 * Protected media configuration
 */
export interface MediaProtectedConfig {
  /** Enable protected media */
  enabled?: boolean
  /** Default signature endpoint */
  signatureEndpoint?: string
  /** Default expiration time (seconds) */
  expirationSeconds?: number
  /** Batch signature request size */
  batchSize?: number
}

/**
 * Media cache configuration
 */
export interface MediaCacheConfig {
  /** Enable caching */
  enabled?: boolean
  /** Cache directory */
  directory?: string
  /** Max cache age in days */
  maxAge?: number
  /** Max cache size in MB */
  maxSize?: number
}

/**
 * Complete media module configuration
 */
export interface MediaConfig {
  /** Enable media module */
  enabled?: boolean
  /** Image configuration */
  image?: MediaImageConfig
  /** Video configuration */
  video?: MediaVideoConfig
  /** Upload configuration */
  upload?: MediaUploadConfig
  /** Protected media configuration */
  protected?: MediaProtectedConfig
  /** Cache configuration */
  cache?: MediaCacheConfig
}

// =============================================================================
// Client Runtime Types
// =============================================================================

/**
 * Lazy load observer options
 */
export interface LazyLoadOptions {
  /** Root element for intersection observer */
  root?: Element | null
  /** Root margin */
  rootMargin?: string
  /** Intersection threshold(s) */
  threshold?: number | number[]
  /** Use native loading="lazy" when supported */
  useNative?: boolean
}

/**
 * Blur-up animation options
 */
export interface BlurUpOptions {
  /** Transition duration in ms */
  duration?: number
  /** CSS easing function */
  easing?: string
  /** Remove placeholder after load */
  removePlaceholder?: boolean
  /** Class to add when loaded */
  loadedClass?: string
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Breakpoint definition for responsive images
 */
export interface Breakpoint {
  /** Breakpoint name (e.g., 'sm', 'md', 'lg') */
  name: string
  /** Min-width in pixels */
  minWidth?: number
  /** Max-width in pixels */
  maxWidth?: number
  /** Image width at this breakpoint */
  imageWidth: number | string
}

/**
 * Srcset generation options
 */
export interface SrcsetOptions {
  /** Source image path */
  src: string
  /** Widths for width-based srcset */
  widths?: number[]
  /** DPR values for fixed-width srcset */
  dprValues?: number[]
  /** Fixed width (enables DPR-based srcset) */
  fixedWidth?: number
  /** Output formats */
  formats?: ImageFormat[]
  /** Base URL for paths */
  baseUrl?: string
  /** Image transformation params */
  params?: ImageParams
}

/**
 * Generated srcset data
 */
export interface SrcsetData {
  /** Srcset string */
  srcset: string
  /** Format this srcset is for */
  format: ImageFormat
  /** MIME type */
  mimeType: string
  /** Array of variants included */
  variants: ImageVariant[]
}
