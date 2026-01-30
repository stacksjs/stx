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

// =============================================================================
// ts-images Integration Types
// =============================================================================

/**
 * Image optimization presets for ts-images
 */
export type ImageOptimizationPreset = 'web' | 'quality' | 'performance'

/**
 * Image transformation types supported by ts-images
 */
export type ImageTransformation =
  | 'resize'
  | 'blur'
  | 'sharpen'
  | 'grayscale'
  | 'rotate'
  | 'flip'
  | 'flop'
  | 'brightness'
  | 'contrast'
  | 'saturation'

/**
 * Watermark position options
 */
export type WatermarkPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  /** Watermark image path */
  image?: string
  /** Watermark text */
  text?: string
  /** Position of the watermark */
  position?: WatermarkPosition
  /** Opacity (0-1) */
  opacity?: number
  /** Scale factor (0-1) */
  scale?: number
  /** Font for text watermark */
  font?: string
  /** Font size for text watermark */
  fontSize?: number
  /** Color for text watermark */
  color?: string
}

/**
 * Art direction configuration for responsive images
 */
export interface ArtDirectionConfig {
  /** Media query (e.g., "(max-width: 768px)") */
  media: string
  /** Source image for this breakpoint */
  src: string
  /** Optional specific widths for this breakpoint */
  widths?: number[]
  /** Optional crop settings for this breakpoint */
  crop?: ImageCrop
  /** Optional aspect ratio override */
  aspectRatio?: string
}

/**
 * Image transformation configuration
 */
export interface ImageTransformationConfig {
  /** Type of transformation */
  type: ImageTransformation
  /** Transformation-specific options */
  options?: {
    // Resize options
    width?: number
    height?: number
    fit?: ImageFit
    // Blur options
    sigma?: number
    // Sharpen options
    amount?: number
    // Rotation options
    angle?: number
    // Adjustment options
    value?: number
  }
}

/**
 * Format-specific quality settings for ts-images
 */
export interface FormatQualitySettings {
  /** JPEG optimization settings */
  jpeg?: {
    /** Quality (1-100) */
    quality?: number
    /** Use MozJPEG encoder */
    mozjpeg?: boolean
    /** Chroma subsampling */
    chromaSubsampling?: '4:4:4' | '4:2:2' | '4:2:0'
    /** Progressive encoding */
    progressive?: boolean
    /** Optimize Huffman coding */
    optimizeCoding?: boolean
  }
  /** PNG optimization settings */
  png?: {
    /** Quality (1-100) */
    quality?: number
    /** Compression level (0-9) */
    compressionLevel?: number
    /** Use palette mode */
    palette?: boolean
    /** Adaptive filtering */
    adaptiveFiltering?: boolean
    /** Progressive scan */
    progressive?: boolean
  }
  /** WebP optimization settings */
  webp?: {
    /** Quality (1-100) */
    quality?: number
    /** Lossless encoding */
    lossless?: boolean
    /** Compression effort (0-6) */
    effort?: number
    /** Smart chroma subsampling */
    smartSubsample?: boolean
    /** Near-lossless mode (0-100) */
    nearLossless?: number
  }
  /** AVIF optimization settings */
  avif?: {
    /** Quality (1-100) */
    quality?: number
    /** Lossless encoding */
    lossless?: boolean
    /** Compression effort (0-9) */
    effort?: number
    /** Chroma subsampling */
    chromaSubsampling?: '4:4:4' | '4:2:2' | '4:2:0'
  }
}

/**
 * ts-images integration configuration
 */
export interface TsImagesConfig {
  /** Enable ts-images processing */
  enabled: boolean
  /** Output directory for processed images */
  outputDir: string
  /** Base URL for generated images (CDN prefix) */
  baseUrl?: string
  /** Format-specific quality settings */
  formatQuality?: FormatQualitySettings
  /** Default responsive breakpoints */
  breakpoints?: number[]
  /** Default output formats */
  defaultFormats?: ImageFormat[]
  /** Default quality (1-100) */
  defaultQuality?: number
  /** Batch processing options */
  batchOptions?: {
    /** Max concurrent processing */
    concurrency?: number
    /** Optimization preset */
    optimizationPreset?: ImageOptimizationPreset
  }
  /** Generate sprite sheets for icons */
  generateSprites?: boolean
  /** Sprite output directory */
  spriteOutputDir?: string
}

/**
 * Enhanced image props with ts-images integration
 */
export interface EnhancedImgProps extends ImgProps {
  /** ts-images optimization preset */
  preset?: ImageOptimizationPreset
  /** Process at build time (true) or runtime URL generation (false) */
  process?: boolean
  /** Custom transformations to apply */
  transformations?: ImageTransformationConfig[]
  /** Generate responsive variants at these widths (overrides config) */
  responsiveWidths?: number[]
  /** Watermark configuration */
  watermark?: WatermarkConfig
  /** Art direction: different images for breakpoints */
  artDirection?: ArtDirectionConfig[]
  /** Extract and use dominant color as placeholder background */
  useDominantColor?: boolean
  /** Generate and embed thumbhash at build time */
  embedThumbhash?: boolean
  /** Blur amount for placeholder (when using blur strategy) */
  blurAmount?: number
  /** Custom output filename pattern */
  outputPattern?: string
  /** Skip optimization for this image */
  skipOptimization?: boolean
  /** Force specific output format */
  outputFormat?: ImageFormat
}

/**
 * Result from processing an image with ts-images
 */
export interface ProcessedImageResult {
  /** Original source path */
  src: string
  /** Whether processing was performed */
  processed: boolean
  /** Generated variants by format and width */
  variants?: Array<{
    /** Output path */
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
  }>
  /** Placeholder data URL (thumbhash/blur) */
  placeholder?: string
  /** Dominant color extracted */
  dominantColor?: string
  /** Original dimensions */
  originalWidth?: number
  originalHeight?: number
  /** Content hash for cache invalidation */
  hash?: string
  /** Processing errors if any */
  errors?: string[]
}

/**
 * Responsive variant set result
 */
export interface ResponsiveVariantSet {
  /** Source image */
  src: string
  /** Variants grouped by format */
  byFormat: Record<ImageFormat, ProcessedImageResult['variants']>
  /** Generated srcset strings by format */
  srcsets: Record<ImageFormat, string>
  /** Recommended sizes attribute */
  sizes?: string
  /** Placeholder data */
  placeholder?: {
    dataURL: string
    width: number
    height: number
    strategy: PlaceholderStrategy
  }
}

// =============================================================================
// ts-videos Integration Types
// =============================================================================

/**
 * Video quality presets
 */
export type VideoQualityPreset =
  | 'very-low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very-high'
  | 'lossless'

/**
 * Platform-specific video presets
 */
export type VideoPlatformPreset =
  | 'youtube'
  | 'twitter'
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-reels'
  | 'tiktok'
  | 'discord'
  | 'linkedin'
  | 'facebook'
  | 'web-progressive'
  | 'web-streaming'

/**
 * Video codec options
 */
export type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1'

/**
 * Audio codec options
 */
export type AudioCodec = 'aac' | 'opus' | 'mp3' | 'flac'

/**
 * Poster/thumbnail generation options
 */
export interface PosterGenerationConfig {
  /** Timestamp in seconds to extract frame */
  timestamp?: number
  /** Output width */
  width?: number
  /** Output height (auto-calculated if not specified) */
  height?: number
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp'
  /** Quality (1-100) */
  quality?: number
}

/**
 * Sprite sheet configuration for video scrubbing preview
 */
export interface SpriteSheetConfig {
  /** Number of columns in sprite sheet */
  columns?: number
  /** Thumbnail width */
  thumbnailWidth?: number
  /** Thumbnail height */
  thumbnailHeight?: number
  /** Interval between frames in seconds */
  interval?: number
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp'
  /** Quality (1-100) */
  quality?: number
}

/**
 * Streaming quality level configuration
 */
export interface StreamingQualityLevel {
  /** Display label (e.g., "1080p") */
  label: string
  /** Video width */
  width: number
  /** Video height (auto-calculated if not specified) */
  height?: number
  /** Video bitrate in bps */
  bitrate: number
  /** Audio bitrate in bps */
  audioBitrate?: number
}

/**
 * Adaptive streaming configuration
 */
export interface StreamingConfig {
  /** Streaming format */
  format?: 'hls' | 'dash'
  /** Segment duration in seconds */
  segmentDuration?: number
  /** Quality levels */
  qualities?: StreamingQualityLevel[]
  /** Enable encryption */
  encryption?: {
    enabled: boolean
    keyUrl?: string
    iv?: string
  }
}

/**
 * Video transcoding options
 */
export interface TranscodeConfig {
  /** Video codec */
  codec?: VideoCodec
  /** Video bitrate in bps */
  bitrate?: number
  /** Maximum width */
  maxWidth?: number
  /** Maximum height */
  maxHeight?: number
  /** Frame rate */
  frameRate?: number
  /** Audio codec */
  audioCodec?: AudioCodec
  /** Audio bitrate in bps */
  audioBitrate?: number
  /** Sample rate in Hz */
  sampleRate?: number
  /** Number of audio channels */
  channels?: number
  /** Two-pass encoding for better quality */
  twoPass?: boolean
  /** Speed preset */
  speedPreset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
  /** CRF value (0-51 for H.264, lower = better quality) */
  crf?: number
}

/**
 * Waveform visualization configuration
 */
export interface WaveformConfig {
  /** Output width */
  width?: number
  /** Output height */
  height?: number
  /** Waveform color */
  color?: string
  /** Background color */
  backgroundColor?: string
  /** Output format */
  format?: 'png' | 'svg' | 'json'
  /** Number of samples to render */
  samples?: number
}

/**
 * ts-videos integration configuration
 */
export interface TsVideosConfig {
  /** Enable ts-videos processing */
  enabled: boolean
  /** Output directory for processed videos */
  outputDir: string
  /** Base URL for video assets */
  baseUrl?: string
  /** Default quality preset */
  defaultQuality?: VideoQualityPreset
  /** Streaming configuration */
  streaming?: {
    /** Enable streaming manifest generation */
    enabled: boolean
    /** Default format */
    format?: 'hls' | 'dash'
    /** Segment duration */
    segmentDuration?: number
    /** Default quality levels */
    defaultQualities?: StreamingQualityLevel[]
  }
  /** Thumbnail generation configuration */
  thumbnails?: {
    /** Enable thumbnail generation */
    enabled: boolean
    /** Number of thumbnails to generate */
    count?: number
    /** Interval between thumbnails in seconds */
    interval?: number
    /** Output format */
    format?: 'jpeg' | 'png' | 'webp'
    /** Thumbnail width */
    width?: number
  }
  /** Default transcoding settings */
  transcoding?: {
    /** Default codec */
    defaultCodec?: VideoCodec
    /** Default audio codec */
    defaultAudioCodec?: AudioCodec
    /** Default speed preset */
    speedPreset?: TranscodeConfig['speedPreset']
  }
}

/**
 * Enhanced video props with ts-videos integration
 */
export interface EnhancedVideoProps extends VideoProps {
  /** ts-videos quality preset */
  quality?: VideoQualityPreset
  /** Platform-specific optimization preset */
  platform?: VideoPlatformPreset
  /** Process video at build time */
  process?: boolean
  /** Generate poster from video frame */
  generatePoster?: boolean | PosterGenerationConfig
  /** Generate sprite sheet for scrubbing preview */
  spriteSheet?: boolean | SpriteSheetConfig
  /** Adaptive streaming configuration */
  streaming?: boolean | StreamingConfig
  /** Transcoding options */
  transcode?: TranscodeConfig
  /** Generate waveform for audio visualization */
  waveform?: boolean | WaveformConfig
  /** Progress callback for video processing */
  onProcessProgress?: (progress: {
    percentage: number
    currentTime: number
    duration: number
    stage: 'analyzing' | 'transcoding' | 'generating-manifests' | 'complete'
  }) => void
  /** Custom output filename pattern */
  outputPattern?: string
  /** Skip processing for this video */
  skipProcessing?: boolean
  /** Title for accessibility and metadata */
  title?: string
}

/**
 * Result from generating a thumbnail
 */
export interface ThumbnailResult {
  /** Output path */
  path: string
  /** URL for use in poster attribute */
  url: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Timestamp in seconds */
  timestamp: number
  /** File size in bytes */
  size: number
}

/**
 * Result from generating HLS manifest
 */
export interface HLSResult {
  /** Master playlist URL */
  manifestUrl: string
  /** Path to master playlist file */
  manifestPath: string
  /** Individual quality level playlists */
  playlists: Array<{
    quality: StreamingQualityLevel
    url: string
    path: string
  }>
  /** Total segment count */
  segmentCount: number
  /** Total duration in seconds */
  duration: number
}

/**
 * Result from generating DASH manifest
 */
export interface DASHResult {
  /** MPD manifest URL */
  manifestUrl: string
  /** Path to MPD file */
  manifestPath: string
  /** Adaptation sets */
  adaptationSets: Array<{
    type: 'video' | 'audio'
    representations: Array<{
      bandwidth: number
      width?: number
      height?: number
      url: string
    }>
  }>
  /** Total duration in seconds */
  duration: number
}

/**
 * Result from video transcoding
 */
export interface TranscodeResult {
  /** Output file path */
  path: string
  /** URL for use in video source */
  url: string
  /** Duration in seconds */
  duration: number
  /** File size in bytes */
  size: number
  /** Video properties */
  video: {
    codec: VideoCodec
    width: number
    height: number
    bitrate: number
    frameRate: number
  }
  /** Audio properties */
  audio?: {
    codec: AudioCodec
    bitrate: number
    sampleRate: number
    channels: number
  }
}

/**
 * Result from processing a video with ts-videos
 */
export interface ProcessedVideoResult {
  /** Original source path */
  src: string
  /** Whether processing was performed */
  processed: boolean
  /** Transcoded video result */
  transcoded?: TranscodeResult
  /** Generated poster/thumbnail */
  poster?: ThumbnailResult
  /** Additional thumbnails */
  thumbnails?: ThumbnailResult[]
  /** Sprite sheet for scrubbing */
  spriteSheet?: {
    url: string
    path: string
    columns: number
    rows: number
    thumbnailWidth: number
    thumbnailHeight: number
    interval: number
    totalFrames: number
  }
  /** Streaming manifests */
  streaming?: {
    hls?: HLSResult
    dash?: DASHResult
  }
  /** Waveform data */
  waveform?: {
    url: string
    path: string
    data?: number[]
  }
  /** Video metadata */
  metadata?: {
    duration: number
    width: number
    height: number
    frameRate: number
    bitrate: number
    codec: string
    audioCodec?: string
  }
  /** Content hash for cache invalidation */
  hash?: string
  /** Processing errors if any */
  errors?: string[]
}
