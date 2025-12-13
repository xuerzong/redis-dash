import type { ColorPalette } from '@client/constants/colorPalettes'
import { omit, pick } from '@client/utils/object'
import { mergeProps } from '@client/utils/props'
import React, { useMemo } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDisplayTheme } from '@client/providers/ConfigProvider'

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
  'maxWidth',
  'minWidth',
  'maxHeight',
  'minHeight',

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
  'lineHeight',
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
  asChild?: boolean
  children?: React.ReactNode
}

export type BoxProps<Root extends React.ElementType = DefaultElement> =
  React.ComponentPropsWithoutRef<Root> &
    Omit<BoxOwnProps, 'as'> &
    BoxOwnProps &
    StyleProperties & {
      colorPalette?: ColorPalette
    }

const BoxComponent = React.forwardRef(
  <T extends React.ElementType = DefaultElement>(
    { as = 'div', asChild, children, colorPalette, ...restProps }: BoxProps<T>,
    ref: React.Ref<any>
  ) => {
    const displayTheme = useDisplayTheme()
    const Component = asChild ? Slot : as

    const colorPaletteVars = useMemo(() => {
      if (!colorPalette) return

      let _colorPalette = colorPalette
      if (_colorPalette === 'danger') _colorPalette = 'red'
      if (_colorPalette === 'success') _colorPalette = 'green'
      if (_colorPalette === 'warning') _colorPalette = 'yellow'
      return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].reduce(
        (pre, cur) => {
          return {
            ...pre,
            [`--color-palettle-${cur}`]: `var(--color-${_colorPalette}-${cur})`,
          }
        },
        displayTheme === 'dark'
          ? {
              '--color': 'rgba(var(--color-palettle-500) / 1)',
              '--bg-color': 'rgba(var(--color-palettle-950) / 1)',
            }
          : {
              '--color': 'rgba(var(--color-palettle-600) / 1)',
              '--bg-color': 'rgba(var(--color-palettle-100) / 1)',
            }
      )
    }, [displayTheme, colorPalette])

    const componentProps = omit(restProps, ...stylePropertyKeys)
    const styleProps = pick(restProps, ...stylePropertyKeys)

    const mergedProps = mergeProps(componentProps, {
      style: {
        ...styleProps,
        ...colorPaletteVars,
      },
    })

    return (
      <Component
        ref={ref}
        {...mergedProps}
        {...(Boolean(colorPalette) && { 'data-color-palette': colorPalette })}
        data-box
      >
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
