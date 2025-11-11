import type { CSSProperties } from 'react'
import { cn } from './cn'

type Props = {
  className?: string
  style?: CSSProperties & Record<string, any>
  [key: string]: any
}

const mergePropObj = (targetProp: Props, key: string, value: any) => {
  if (typeof value !== 'object' && targetProp[key] === value) {
    return
  }

  if (!targetProp[key]) {
    targetProp[key] = value
    return
  }

  if (key === 'className') {
    targetProp.className = cn(targetProp.className, value)
    return
  }

  if (key === 'style') {
    targetProp.style = { ...targetProp.style, ...value }
    return
  }

  if (typeof value === 'function') {
    const preFunc = targetProp[key]
    targetProp[key] = (...args: any[]) => {
      preFunc(...args)
      ;(value as any)(...args)
    }
    return
  }

  targetProp[key] = value
}

/**
 * @reference https://github.com/andrewbranch/merge-props/blob/dfabe62918751f1d6379b84db87ef333183e9bd6/src/index.ts#L1
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

export const mergeProps = <T extends Props[]>(
  ...props: T
): {
  [K in keyof UnionToIntersection<T[number]>]: K extends 'className'
    ? string
    : K extends 'style'
      ? UnionToIntersection<T[number]>[K]
      : Exclude<Extract<T[number], { [Q in K]: unknown }>[K], undefined>
} => {
  if (props.length === 1) {
    return props[0] as any
  }

  return props.reduce((pre, cur) => {
    for (const key in cur) {
      mergePropObj(pre, key, cur[key])
    }
    return pre
  }) as any
}
