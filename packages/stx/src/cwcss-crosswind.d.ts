declare module '@cwcss/crosswind' {
  export class CSSGenerator {
    constructor(config?: Record<string, unknown>)
    generate(content: string): string
    process(content: string): string
  }
  export const config: Record<string, unknown>
}
