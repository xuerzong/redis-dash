export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
) => {
  return Object.keys(obj).reduce(
    (pre, key) => {
      if (!keys.includes(key as K)) {
        pre[key as keyof Omit<T, K>] = obj[key as K]
      }
      return pre
    },
    {} as Partial<Omit<T, K>>
  )
}

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  return keys.reduce(
    (pre, key) => {
      if (key in obj) {
        pre[key] = obj[key]
      }
      return pre
    },
    {} as Pick<T, K>
  )
}
