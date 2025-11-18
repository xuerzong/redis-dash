import { omit, pick } from '@/client/utils/object'
import { mergeProps } from '@/client/utils/props'
import React from 'react'

const stylePropertyKeys = [
  'position',
  'top',
  'left',
  'bottom',
  'right',
  'transform',
  'display',

  'margin',
  'marginTop',
  'marginLeft',
  'marginBottom',
  'marginRight',

  'padding',
  'paddingTop',
  'paddingLeft',
  'paddingBottom',
  'paddingRight',

  'width',
  'height',

  'border',
  'borderTop',
  'borderLeft',
  'borderRight',
  'borderBottom',

  'borderRadius',
  'borderColor',
  // flex
  'flex',
  'flexShrink',
  'flexGrow',
  'flexDirection',
  'alignItems',
  'justifyContent',

  // grid
  'gridTemplateColumns',
  'gap',

  'fontSize',
  'fontWeight',
  'textAlign',

  'color',
  'backgroundColor',
  'opacity',
  'pointerEvents',
  'cursor',
  'userSelect',
  'wordBreak',
  'boxSizing',
  'overscrollBehavior',
  'zIndex',

  'textTransform',

  'overflow',
  'overflowX',
  'overflowY',

  'backdropFilter',
] as const

type StyleKey = (typeof stylePropertyKeys)[number]

export type StyleProperties = Pick<React.CSSProperties, StyleKey>

type DefaultElement = 'div'

interface BoxOwnProps {
  as?: React.ElementType
  children?: React.ReactNode
}

type BoxProps<Root extends React.ElementType = DefaultElement> =
  React.ComponentPropsWithoutRef<Root> &
    Omit<BoxOwnProps, 'as'> &
    BoxOwnProps &
    StyleProperties

const BoxComponent = React.forwardRef(
  <T extends React.ElementType = DefaultElement>(
    { as = 'div', children, ...restProps }: BoxProps<T>,
    ref: React.Ref<any>
  ) => {
    const Component = as

    const componentProps = omit(restProps, ...stylePropertyKeys)
    const styleProps = pick(restProps, ...stylePropertyKeys)

    const mergedProps = mergeProps(componentProps, { style: styleProps })

    return (
      <Component ref={ref} {...mergedProps}>
        {children}
      </Component>
    )
  }
)

type PolymorphicComponent = <T extends React.ElementType = DefaultElement>(
  props: BoxProps<T> & { ref?: React.Ref<any> }
) => React.ReactElement | null

export const Box: PolymorphicComponent & { displayName?: string } =
  BoxComponent as PolymorphicComponent & { displayName?: string }

Box.displayName = 'Box'
