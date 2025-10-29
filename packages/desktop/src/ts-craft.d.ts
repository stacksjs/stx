/**
 * Type declarations for ts-craft package
 * This is a temporary declaration file until ts-craft provides its own .d.ts files
 */

declare module 'ts-craft' {
  export interface WindowOptions {
    title?: string
    width?: number
    height?: number
    x?: number
    y?: number
    resizable?: boolean
    frameless?: boolean
    transparent?: boolean
    alwaysOnTop?: boolean
    fullscreen?: boolean
    darkMode?: boolean
    hotReload?: boolean
    devTools?: boolean
    systemTray?: boolean
    hideDockIcon?: boolean
    menubarOnly?: boolean
    minimizable?: boolean
    maximizable?: boolean
    closable?: boolean
  }

  export interface AppConfig {
    url?: string
    html?: string
    window?: WindowOptions
    craftPath?: string
  }

  export class CraftApp {
    constructor(config?: AppConfig)
    show(html?: string): Promise<void>
    loadURL(url: string): Promise<void>
    close(): void
  }

  export function createApp(config?: AppConfig): CraftApp
  export function show(html: string, options?: WindowOptions): Promise<void>
  export function loadURL(url: string, options?: WindowOptions): Promise<void>

  // Export types
  export type { AppConfig as default }
}
