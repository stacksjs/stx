/** Context passed to opt-in file-based endpoints. */
export interface ApiHandlerContext {
  params: Record<string, string>
}

/** Preserve a handler's inferred return type for the generated client contract. */
export function defineApiHandler<T>(handler: (request: Request, context: ApiHandlerContext) => T): (request: Request, context: ApiHandlerContext) => T {
  return handler
}
