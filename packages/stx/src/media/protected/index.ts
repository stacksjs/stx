/**
 * STX Media - Protected Media Module
 *
 * Content protection via signed URLs and authentication.
 *
 * @module media/protected
 */

// =============================================================================
// Signature Exports
// =============================================================================

export {
  // URL signing
  signUrl,
  batchSignUrls,
  smartBatchSign,

  // Validation
  isSignatureValid,
  getTimeUntilExpiry,
  shouldRefreshSignature,

  // Auth helpers
  checkAuthAccess,
  buildAuthParams,

  // Cache
  getCachedSignature,
  clearSignatureCache,
  pruneSignatureCache,

  // Runtime
  generateSignatureRuntime,
} from './signature'

// =============================================================================
// Component Exports
// =============================================================================

export {
  // Components
  renderProtectedImg,
  renderProtectedVideo,

  // Processing
  processProtectedMedia,

  // Directive helpers
  parseProtectedArgs,
} from './component'
