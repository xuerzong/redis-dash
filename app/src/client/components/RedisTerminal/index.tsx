import { useCallback, useRef } from 'react'
import { Terminal, type TerminalRef } from '../Terminal'
import { sendCommand } from '@xuerzong/redis-studio-invoke'
import { colorize } from '../Terminal/utils'
import { useNavigate } from 'react-router'

interface RedisTerminalProps {
  redisId: string
}

export const RedisTerminal: React.FC<RedisTerminalProps> = ({ redisId }) => {
  const navigate = useNavigate()
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

    if (['SUBSCRIBE', 'PSUBSCRIBE'].includes(command.trim().toUpperCase())) {
      term.writeln(
        `Use ${colorize('Cyan', 'pub/sub ⬏')} tool to subscribe to channels.`
      )
      return
    }
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
  return (
    <Terminal
      ref={terminalRef}
      onEnter={onEnter}
      addonOptions={{
        webLinks: {
          callback(event, matchedContent) {
            event.preventDefault()
            if (matchedContent === 'pub/sub') {
              navigate(`/${redisId}/pub-sub`)
            }
          },
          options: { urlRegex: /pub\/sub/ },
        },
      }}
    />
  )
}
