import { Terminal as XtermTerminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { CanvasAddon } from '@xterm/addon-canvas'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import {
  UP_KEY,
  DOWN_KEY,
  RIGHT_KEY,
  LEFT_KEY,
  BACKSPACE_KEY,
  ENTER_KEY,
  RESET_LINE,
  START_SYMBOL,
} from './constants'
import { WebLinksAddon } from './addons/WebLinksAddon/WebLinksAddon'
import '@xterm/xterm/css/xterm.css'
import type { ILinkProviderOptions } from './addons/WebLinksAddon/WebLinkProvider'
import s from './index.module.scss'

export interface TerminalRef {
  writeln: (data: string) => void
  write: (data: string) => void
}

interface TerminalProps {
  onMount?: () => void
  onEnter?: (value: string) => Promise<void> | void

  addonOptions?: Partial<{
    webLinks: Partial<{
      callback: (event: MouseEvent, matchedContent: string) => void
      options: ILinkProviderOptions
    }>
  }>
}

export const Terminal = forwardRef<TerminalRef, TerminalProps>(
  ({ onEnter, addonOptions }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<XtermTerminal | null>(null)
    const currentInputRef = useRef('')
    const historyRef = useRef<string[]>([])
    const historyIndexRef = useRef(0)

    useImperativeHandle(ref, () => {
      return {
        writeln(data: string) {
          termRef.current?.writeln(data)
        },
        write(data: string) {
          termRef.current?.write(data)
        },
      }
    })

    const onData = useCallback(async (data: string) => {
      const term = termRef.current
      if (!term) return
      switch (data) {
        case BACKSPACE_KEY: {
          // Clear all
          if (!currentInputRef.current) {
            break
          }
          currentInputRef.current = currentInputRef.current.slice(0, -1)
          term.write(
            [RESET_LINE, START_SYMBOL, currentInputRef.current].join('')
          )
          break
        }
        case ENTER_KEY: {
          term.writeln('')
          const commandInput = currentInputRef.current

          historyIndexRef.current = 0
          currentInputRef.current = ''
          if (commandInput) {
            historyRef.current.unshift(commandInput)
            await onEnter?.(commandInput)
          }

          term.write(START_SYMBOL)
          break
        }
        case UP_KEY: {
          const currentHistoryIndex = historyIndexRef.current
          historyIndexRef.current = Math.min(
            historyRef.current.length - 1,
            currentHistoryIndex + 1
          )
          const nextLine = historyRef.current[currentHistoryIndex]
          if (nextLine) {
            term.write([RESET_LINE, START_SYMBOL, nextLine].join(''))
            currentInputRef.current = nextLine
          }
          break
        }
        case DOWN_KEY: {
          const currentHistoryIndex = historyIndexRef.current
          historyIndexRef.current = Math.max(0, currentHistoryIndex - 1)
          const nextLine = historyRef.current[currentHistoryIndex]
          if (nextLine) {
            term.write([RESET_LINE, START_SYMBOL, nextLine].join(''))
            currentInputRef.current = nextLine
          }
          break
        }
        case LEFT_KEY:
        case RIGHT_KEY: {
          break
        }
        default:
          const charCode = data.charCodeAt(0)
          if (charCode < 32) {
            // pass?
            break
          }
          currentInputRef.current += data
          term.write(RESET_LINE + START_SYMBOL + currentInputRef.current)

          break
      }
    }, [])

    const webLinksAddon = useMemo(() => {
      return new WebLinksAddon(
        addonOptions?.webLinks?.callback,
        addonOptions?.webLinks?.options
      )
    }, [addonOptions])

    useEffect(() => {
      if (!terminalRef.current) return
      const term = new XtermTerminal({
        windowsMode: true,
        cursorBlink: true,
        fontSize: 16,
        fontWeight: 400,
        fontFamily: 'Geist Mono',
        lineHeight: 1,
      })
      const fitAddon = new FitAddon()
      const canvasAddon = new CanvasAddon()
      term.loadAddon(fitAddon)
      term.loadAddon(canvasAddon)
      term.loadAddon(webLinksAddon)
      term.open(terminalRef.current)
      term.write(START_SYMBOL)
      termRef.current = term

      const resize = () => {
        fitAddon.fit()
      }
      resize()

      window.addEventListener('resize', resize)
      return () => {
        term.dispose()
        window.removeEventListener('resize', resize)
      }
    }, [webLinksAddon])

    useEffect(() => {
      const term = termRef.current
      if (!term) {
        return
      }
      term.onData(onData)
    }, [onData])
    return <div className={s.Terminal} ref={terminalRef} />
  }
)
