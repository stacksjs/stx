const sourceMapRE: RegExp = /\/\/#\s*sourceMappingURL=.*\n?/g

export function removeSourceMap(code: string): string {
  if (code.includes('sourceMappingURL='))
    return code.replace(sourceMapRE, '')
  return code
}
