import { useCallback, useRef } from 'react'
import { Terminal, terminalStartSymbol, type TerminalRef } from '../Terminal'

export const RedisTerminal = () => {
  const terminalRef = useRef<TerminalRef>(null)
  const currentInputRef = useRef('')

  const onData = useCallback((data: string) => {
    const term = terminalRef.current
    if (!term) return
    switch (data) {
      case '\x7f':
        currentInputRef.current = currentInputRef.current.slice(0, -1)
        term.write('\b \b')
        break
      case '\r':
        term.writeln('')
        term.write(`${terminalStartSymbol} `)
        const commandInput = currentInputRef.current
        currentInputRef.current = ''
        const parts = commandInput.trim().split(/\s+/)
        if (parts.length === 0) {
          return
        }
        const [command, ...args] = parts
        console.log(command, ...args)
        break
      default:
        term.write(data)
        currentInputRef.current = currentInputRef.current + data
        break
    }
  }, [])
  return <Terminal ref={terminalRef} onData={onData} />
}
