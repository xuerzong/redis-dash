import { useCallback, useRef } from 'react'
import { Terminal, type TerminalRef } from '../Terminal'
import { sendCommand } from '@/client/utils/invoke'
import { colorize } from '../Terminal/utils'

interface RedisTerminalProps {
  redisId: string
}

export const RedisTerminal: React.FC<RedisTerminalProps> = ({ redisId }) => {
  const terminalRef = useRef<TerminalRef>(null)

  const onEnter = useCallback(async (data: string) => {
    const term = terminalRef.current
    if (!term) return
    const parts = data.trim().split(/\s+/)
    if (parts && parts.length === 0) {
      return
    }
    const [command, ...args] = parts
    if (!command) return
    await sendCommand({
      id: redisId,
      command,
      args,
    })
      .then((commandRes: any) => {
        let nextLine = ''
        if (typeof commandRes === 'string') {
          nextLine = commandRes
          if (nextLine) {
            term.writeln(nextLine)
          }
        }

        if (typeof commandRes === 'object' && commandRes) {
          nextLine = JSON.stringify(commandRes, null, '\t')
          nextLine.split('\n').forEach((line) => {
            term.writeln(line)
          })
        }
      })
      .catch((error: any) => {
        term.writeln(colorize('Red', error))
      })
  }, [])
  return <Terminal ref={terminalRef} onEnter={onEnter} />
}
