declare module 'jsdom' {
  export class JSDOM {
    constructor(html: string)
    window: any
  }
}
