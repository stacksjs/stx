import type { RuntimeInfo, RuntimePlatform } from './types'

export function detectRuntime(): RuntimeInfo {
  // Cloudflare Workers
  if (typeof globalThis !== 'undefined' && 'caches' in globalThis && 'CF' in (globalThis as any)) {
    return {
      platform: 'cloudflare',
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: true,
      capabilities: ['kv', 'r2', 'd1', 'durable-objects', 'queues'],
    }
  }

  // Deno
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    const deno = (globalThis as any).Deno
    return {
      platform: 'deno',
      version: deno.version?.deno,
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: false,
      capabilities: ['kv', 'deploy'],
    }
  }

  // Bun
  if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
    return {
      platform: 'bun',
      version: (globalThis as any).Bun.version,
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: false,
      supportsCache: false,
      capabilities: ['sqlite', 'ffi', 'compile'],
    }
  }

  // Vercel Edge
  if (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) {
    return {
      platform: 'vercel',
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: true,
      supportsCache: true,
      capabilities: ['edge-config', 'kv'],
    }
  }

  // Node.js fallback
  if (typeof process !== 'undefined' && process.versions?.node) {
    return {
      platform: 'node',
      version: process.versions.node,
      supportsStreaming: true,
      supportsCrypto: true,
      supportsKV: false,
      supportsCache: false,
      capabilities: [],
    }
  }

  return {
    platform: 'unknown',
    supportsStreaming: false,
    supportsCrypto: false,
    supportsKV: false,
    supportsCache: false,
    capabilities: [],
  }
}

export function isEdgeRuntime(): boolean {
  const rt = detectRuntime()
  return ['cloudflare', 'deno', 'vercel', 'netlify'].includes(rt.platform)
}
