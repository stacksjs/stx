/**
 * STX Media - Protected Media with Signed URLs
 *
 * Content protection via signed URLs for secure media delivery.
 * Supports one-time use URLs and batch signature requests.
 *
 * @module media/protected/signature
 */

import type {
  BatchSignatureRequest,
  BatchSignatureResult,
  ProtectedAuthContext,
  SignatureConfig,
  SignedUrl,
} from '../types'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_EXPIRATION_SECONDS = 3600 // 1 hour
const DEFAULT_BATCH_SIZE = 10

// =============================================================================
// URL Signing
// =============================================================================

/**
 * Sign a single URL for protected access
 *
 * @example
 * ```typescript
 * const signed = await signUrl('/media/secure-video.mp4', {
 *   endpoint: '/api/sign',
 *   expirationSeconds: 3600,
 * })
 * console.log(signed.url) // URL with signature query param
 * ```
 */
export async function signUrl(src: string, config: SignatureConfig): Promise<SignedUrl> {
  const { endpoint, method = 'POST', headers = {}, expirationSeconds = DEFAULT_EXPIRATION_SECONDS, oneTimeUse = false, params = {} } = config

  const body = JSON.stringify({
    url: src,
    expirationSeconds,
    oneTimeUse,
    ...params,
  })

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method !== 'GET' ? body : undefined,
  })

  if (!response.ok) {
    throw new Error(`Failed to sign URL: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return {
    url: data.url || data.signedUrl,
    signature: data.signature,
    expires: data.expires || Date.now() + expirationSeconds * 1000,
    oneTimeUse: data.oneTimeUse || oneTimeUse,
  }
}

/**
 * Sign multiple URLs in a single batch request
 *
 * This minimizes API calls when a page has multiple protected media items.
 *
 * @example
 * ```typescript
 * const result = await batchSignUrls(
 *   ['/media/video1.mp4', '/media/video2.mp4'],
 *   { endpoint: '/api/batch-sign' }
 * )
 * console.log(result.signatures.get('/media/video1.mp4'))
 * ```
 */
export async function batchSignUrls(
  sources: string[],
  config: SignatureConfig,
): Promise<BatchSignatureResult> {
  const { endpoint, method = 'POST', headers = {}, expirationSeconds = DEFAULT_EXPIRATION_SECONDS, oneTimeUse = false, params = {} } = config

  const body = JSON.stringify({
    urls: sources,
    expirationSeconds,
    oneTimeUse,
    ...params,
  })

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method !== 'GET' ? body : undefined,
  })

  if (!response.ok) {
    throw new Error(`Failed to batch sign URLs: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Parse response (supports multiple formats)
  const signatures = new Map<string, SignedUrl>()
  const errors = new Map<string, string>()

  if (Array.isArray(data.results)) {
    // Array format: [{ url, signedUrl, signature, expires, error? }, ...]
    for (const item of data.results) {
      if (item.error) {
        errors.set(item.url, item.error)
      } else {
        signatures.set(item.url || item.originalUrl, {
          url: item.signedUrl || item.url,
          signature: item.signature,
          expires: item.expires || Date.now() + expirationSeconds * 1000,
          oneTimeUse: item.oneTimeUse || oneTimeUse,
        })
      }
    }
  } else if (typeof data.signatures === 'object') {
    // Object format: { signatures: { [url]: { signedUrl, signature, expires } }, errors: { [url]: error } }
    for (const [url, signed] of Object.entries(data.signatures)) {
      const s = signed as { signedUrl?: string; url?: string; signature: string; expires?: number }
      signatures.set(url, {
        url: s.signedUrl || s.url || url,
        signature: s.signature,
        expires: s.expires || Date.now() + expirationSeconds * 1000,
        oneTimeUse,
      })
    }
    if (data.errors) {
      for (const [url, error] of Object.entries(data.errors)) {
        errors.set(url, error as string)
      }
    }
  }

  return { signatures, errors }
}

/**
 * Smart batch signing that groups requests for efficiency
 */
export async function smartBatchSign(
  sources: string[],
  config: SignatureConfig,
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<BatchSignatureResult> {
  const allSignatures = new Map<string, SignedUrl>()
  const allErrors = new Map<string, string>()

  // Split into batches
  const batches: string[][] = []
  for (let i = 0; i < sources.length; i += batchSize) {
    batches.push(sources.slice(i, i + batchSize))
  }

  // Process batches in parallel (with limit)
  const results = await Promise.all(
    batches.map((batch) => batchSignUrls(batch, config)),
  )

  // Merge results
  for (const result of results) {
    for (const [url, signed] of result.signatures) {
      allSignatures.set(url, signed)
    }
    for (const [url, error] of result.errors) {
      allErrors.set(url, error)
    }
  }

  return { signatures: allSignatures, errors: allErrors }
}

// =============================================================================
// Signature Validation
// =============================================================================

/**
 * Check if a signed URL is still valid (not expired)
 */
export function isSignatureValid(signedUrl: SignedUrl): boolean {
  return signedUrl.expires > Date.now()
}

/**
 * Get time until signature expires (in ms)
 */
export function getTimeUntilExpiry(signedUrl: SignedUrl): number {
  return Math.max(0, signedUrl.expires - Date.now())
}

/**
 * Check if signature should be refreshed (within refresh window)
 *
 * @param signedUrl - The signed URL to check
 * @param refreshWindowMs - Time before expiry to trigger refresh (default: 5 minutes)
 */
export function shouldRefreshSignature(signedUrl: SignedUrl, refreshWindowMs: number = 5 * 60 * 1000): boolean {
  return getTimeUntilExpiry(signedUrl) < refreshWindowMs
}

// =============================================================================
// Authentication Context
// =============================================================================

/**
 * Check if user has access based on auth context
 */
export async function checkAuthAccess(auth: ProtectedAuthContext): Promise<boolean> {
  // Custom check function
  if (auth.check) {
    return await auth.check()
  }

  // Default: no restrictions
  return true
}

/**
 * Build auth params for signature request
 */
export function buildAuthParams(auth: ProtectedAuthContext): Record<string, unknown> {
  const params: Record<string, unknown> = {}

  if (auth.role) params.role = auth.role
  if (auth.permission) params.permission = auth.permission
  if (auth.userId) params.userId = auth.userId

  return params
}

// =============================================================================
// Signed URL Cache
// =============================================================================

const signatureCache = new Map<string, SignedUrl>()

/**
 * Get signed URL from cache or fetch new
 */
export async function getCachedSignature(src: string, config: SignatureConfig): Promise<SignedUrl> {
  const cacheKey = `${src}:${config.endpoint}`
  const cached = signatureCache.get(cacheKey)

  // Return cached if valid and not about to expire
  if (cached && isSignatureValid(cached) && !shouldRefreshSignature(cached)) {
    return cached
  }

  // Fetch new signature
  const signed = await signUrl(src, config)
  signatureCache.set(cacheKey, signed)

  return signed
}

/**
 * Clear signature cache
 */
export function clearSignatureCache(): void {
  signatureCache.clear()
}

/**
 * Remove expired signatures from cache
 */
export function pruneSignatureCache(): number {
  let pruned = 0
  const now = Date.now()

  for (const [key, signed] of signatureCache) {
    if (signed.expires <= now) {
      signatureCache.delete(key)
      pruned++
    }
  }

  return pruned
}

// =============================================================================
// Client-Side Helpers
// =============================================================================

/**
 * Generate client-side signature handler runtime
 */
export function generateSignatureRuntime(): string {
  return `
(function() {
  'use strict';

  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};
  var cache = new Map();

  window.STX.signUrl = async function(src, config) {
    var cacheKey = src + ':' + config.endpoint;
    var cached = cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached;
    }

    var response = await fetch(config.endpoint, {
      method: config.method || 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, config.headers || {}),
      body: JSON.stringify({ url: src, expirationSeconds: config.expirationSeconds || 3600 })
    });

    if (!response.ok) throw new Error('Failed to sign URL');

    var data = await response.json();
    var signed = {
      url: data.url || data.signedUrl,
      signature: data.signature,
      expires: data.expires || Date.now() + (config.expirationSeconds || 3600) * 1000
    };

    cache.set(cacheKey, signed);
    return signed;
  };

  window.STX.batchSignUrls = async function(sources, config) {
    var response = await fetch(config.endpoint, {
      method: config.method || 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, config.headers || {}),
      body: JSON.stringify({ urls: sources, expirationSeconds: config.expirationSeconds || 3600 })
    });

    if (!response.ok) throw new Error('Failed to batch sign URLs');

    return response.json();
  };

  window.STX.loadProtectedMedia = async function(element, config) {
    var src = element.dataset.protectedSrc;
    if (!src) return;

    try {
      var signed = await window.STX.signUrl(src, config);
      if (element.tagName === 'IMG') {
        element.src = signed.url;
      } else if (element.tagName === 'VIDEO') {
        element.src = signed.url;
        element.load();
      } else if (element.tagName === 'SOURCE') {
        element.src = signed.url;
        element.parentElement.load();
      }
    } catch (error) {
      console.error('Failed to load protected media:', error);
      if (element.dataset.fallback) {
        element.src = element.dataset.fallback;
      }
    }
  };
})();
`.trim()
}
