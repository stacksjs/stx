const DEFAULT_STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
  'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'because', 'about', 'up', 'its', 'it', 'this',
  'that', 'these', 'those', 'he', 'she', 'they', 'them', 'his', 'her',
  'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'if', 'we', 'our', 'my', 'me', 'i', 'you', 'your',
])

const ACCENT_MAP: Record<string, string> = {
  '\u00E0': 'a', '\u00E1': 'a', '\u00E2': 'a', '\u00E3': 'a', '\u00E4': 'a', '\u00E5': 'a',
  '\u00E8': 'e', '\u00E9': 'e', '\u00EA': 'e', '\u00EB': 'e',
  '\u00EC': 'i', '\u00ED': 'i', '\u00EE': 'i', '\u00EF': 'i',
  '\u00F2': 'o', '\u00F3': 'o', '\u00F4': 'o', '\u00F5': 'o', '\u00F6': 'o',
  '\u00F9': 'u', '\u00FA': 'u', '\u00FB': 'u', '\u00FC': 'u',
  '\u00F1': 'n', '\u00FD': 'y', '\u00FF': 'y', '\u00E7': 'c',
}

export function normalize(text: string): string {
  let result = text.toLowerCase().trim()
  for (const [accented, plain] of Object.entries(ACCENT_MAP)) {
    result = result.replaceAll(accented, plain)
  }
  return result
}

export function tokenize(text: string, options?: { minLength?: number, stopWords?: string[] }): string[] {
  const minLength = options?.minLength ?? 2
  const stopWords = options?.stopWords ? new Set(options.stopWords) : DEFAULT_STOP_WORDS

  const normalized = normalize(text)
  const words = normalized.split(/[\s\-_.,;:!?'"()[\]{}<>\/\\@#$%^&*+=|~`]+/)

  return words.filter((word) => {
    return word.length >= minLength && !stopWords.has(word)
  })
}

export function highlight(text: string, query: string, tag: string = 'mark'): string {
  const queryTokens = tokenize(query, { minLength: 1, stopWords: [] })
  if (queryTokens.length === 0)
    return text

  const pattern = queryTokens
    .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  const regex = new RegExp(`(${pattern})`, 'gi')
  return text.replace(regex, `<${tag}>$1</${tag}>`)
}
