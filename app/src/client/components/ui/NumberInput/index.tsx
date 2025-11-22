import { useEffect, useRef, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { useSyncState } from '@/client/hooks/useSyncState'
import { Box } from '../Box'
import './index.scss'
import { cn } from '@/client/utils/cn'
import { Slot } from '@radix-ui/react-slot'

interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
  > {
  min?: number
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
}

const formatValue = (value = '', min = 0) => {
  let nextValue = parseInt(value || '0', 10)
  if (isNaN(nextValue)) {
    nextValue = 0
  }
  return Math.max(nextValue, min).toString()
}

export const NumberInput: React.FC<NumberInputProps> = ({
  disabled = false,
  min = 0,
  value: propsValue,
  onChange,
  className,
  ...restProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hasFocused, setHasFocused] = useState(false)
  const [value, setValue] = useSyncState(formatValue(propsValue, min))
  const blurTimer = useRef<any>(null)

  const onAdd = () => {
    onValueChange((Number(value) + 1).toString())
    clearTimeout(blurTimer.current)
    inputRef.current?.focus()
  }

  const onDec = () => {
    onValueChange((Number(value) - 1).toString())
    clearTimeout(blurTimer.current)
    inputRef.current?.focus()
  }

  const onValueChange = (newValue: string) => {
    setValue(formatValue(newValue, min))
    onChange?.(formatValue(newValue, min))
  }

  useEffect(() => {
    const keyEvent = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') {
        onAdd()
      }

      if (e.code === 'ArrowDown') {
        onDec()
      }
    }
    if (hasFocused) {
      document.addEventListener('keydown', keyEvent)
    }

    return () => {
      return document.removeEventListener('keydown', keyEvent)
    }
  }, [hasFocused, onAdd, onDec])

  return (
    <div
      className="NumberInput"
      {...(hasFocused && {
        'data-focused': '',
      })}
      {...(disabled && {
        'data-disabled': '',
      })}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div
        className="NumberInputControlWrapper"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <ChevronUpIcon
          className="NumberInputControlIcon"
          {...(disabled && {
            'data-disabled': '',
          })}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAdd()
          }}
        />

        <ChevronDownIcon
          className="NumberInputControlIcon"
          {...(disabled && {
            'data-disabled': '',
          })}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDec()
          }}
        />
      </div>
      <Slot {...restProps}>
        <input
          className={cn('NumberInputInput', className)}
          ref={inputRef}
          onFocus={() => {
            setHasFocused(!disabled && true)
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setHasFocused(false)
            }, 50)
          }}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
              e.preventDefault()
            }
          }}
          disabled={disabled}
        />
      </Slot>
    </div>
  )
}

interface InputWithPrefixProps extends NumberInputProps {
  prefixNode?: React.ReactNode
}

export const NumberInputWithPrefix: React.FC<InputWithPrefixProps> = ({
  prefixNode,
  ...restProps
}) => {
  return (
    <Box className="InputRoot InputWithPrefixRoot">
      <Box className="InputPrefix">{prefixNode}</Box>
      <NumberInput {...restProps} />
    </Box>
  )
}
