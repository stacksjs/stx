declare module 'showdown' {
  export class Converter {
    constructor(options?: any)
    makeHtml(markdown: string): string
  }
}
