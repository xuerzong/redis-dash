export const safeFunction = <T extends Function>(
  func: T,
  onError?: (error: any) => void
): T => {
  return (async (...args: any[]) => {
    try {
      const result = (func as Function)(...args)

      if (result instanceof Promise) {
        const awaitedResult = await result
        return awaitedResult
      }

      return result
    } catch (error) {
      console.error('Caught an error in safeFunction execution:', error)
      onError?.(error)
    }
  }) as unknown as T
}
