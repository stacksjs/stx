declare module 'ts-broadcasting' {
  export class BroadcastServer {
    constructor(config?: any)
    start(): Promise<void>
    stop(): void
    channels: { channel(name: string, authorize?: any): void } & Map<string, any>
  }
  export class Broadcast {
    static setServer(server: BroadcastServer): void
    static channel(name: string): any
    static to(channel: string): any
    static send(channels: string | string[], event: string, data: any): void
    static toUser(userId: string | number, event: string, data: any): void
    static toUsers(userIds: Array<string | number>, event: string, data: any): void
    static private(channel: string, event: string, data: any): void
    static presence(channel: string, event: string, data: any): void
  }
  export function channel(name: string, authorize?: any): any
  export interface ServerConfig {
    driver?: string
    host?: string
    port?: number
    scheme?: string
    verbose?: boolean
    [key: string]: any
  }
}
