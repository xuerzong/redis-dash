import { Terminal as XtermTerminal } from '@xterm/xterm'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import '@xterm/xterm/css/xterm.css'
import s from './index.module.scss'

export const terminalStartSymbol = '$'

export interface TerminalRef {
  writeln: (data: string) => void
  write: (data: string) => void
}

interface TerminalProps {
  onData?: (value: string) => void
  onMount?: () => void
}

export const Terminal = forwardRef<TerminalRef, TerminalProps>(
  ({ onData }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<XtermTerminal | null>(null)

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

    useEffect(() => {
      if (!terminalRef.current) return
      const term = new XtermTerminal({
        windowsMode: true,
        cursorBlink: true,
      })
      term.open(terminalRef.current)
      term.write(`${terminalStartSymbol} `)
      if (onData) {
        term.onData(onData)
      }
      termRef.current = term

      return () => {
        term.dispose()
      }
    }, [onData])
    return <div className={s.terminal} ref={terminalRef}></div>
  }
)
