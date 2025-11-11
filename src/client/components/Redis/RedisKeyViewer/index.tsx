import { Editor } from '@/client/components/Editor'
import { Box } from '@/client/components/ui/Box'
import { InputWithPrefix } from '@/client/components/ui/Input'
import { Button } from '@/client/components/ui/Button'
import { SaveIcon, TrashIcon } from 'lucide-react'
import { NumberInput } from '@/client/components/ui/NumberInput'
import {
  changeSelectedKey,
  queryRedisKeys,
  queryRedisViewerState,
  useRedisStore,
} from '@/client/stores/redisStore'
import { RedisZSETTable } from '../RedisTable/RedisZSETTable'
import { RedisLISTTable } from '../RedisTable/RedisLISTTable'
import { RedisSETTable } from '../RedisTable/RedisSetTable'
import { RedisStreamTable } from '../RedisTable/ReisStreamTable'
import { RedisHASHTable } from '../RedisTable/RedisHashTable'
import { Modal } from '../../ui/Modal'
import { useState } from 'react'
import { toast } from 'sonner'
import { delKey } from '@/client/commands/redis'
import { useRedisId } from '@/client/hooks/useRedisId'
import {
  RedisKeyViewerProvider,
  useRedisKeyViewerContext,
} from '@/client/providers/RedisKeyViewer'

export const RedisKeyViewerComponent: React.FC = () => {
  const { redisId, redisKeyState } = useRedisKeyViewerContext()
  const [delOpen, setDelOpen] = useState(false)
  const [delLoaing, setDelLoading] = useState(false)

  const onDelKey = async () => {
    setDelLoading(true)
    toast.promise(delKey(redisId, redisKeyState.keyName), {
      loading: 'Loading...',
      success: () => {
        setDelOpen(false)
        queryRedisKeys(redisId)
        changeSelectedKey('')
        return 'Delete Key Successfully'
      },
      error: (e) => e.message || 'Delete Key Failed',
      finally() {
        setDelLoading(false)
      },
    })
  }

  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      height="100%"
    >
      <Box
        position="sticky"
        top={0}
        zIndex={1}
        display="flex"
        alignItems="center"
        gap="var(--spacing-md)"
        backgroundColor="var(--background-color)"
        padding="var(--spacing-md)"
        borderBottom="1px solid var(--border-color)"
      >
        <InputWithPrefix
          style={{
            flex: 1,
          }}
          value={redisKeyState.keyName}
          onChange={(e) => {
            console.log(e.target.value)
          }}
          prefixNode={
            <div style={{ textTransform: 'capitalize' }}>
              {redisKeyState.type}
            </div>
          }
        />

        <Box className="InputRoot InputWithPrefixRoot">
          <Box className="InputPrefix">TTL</Box>
          <NumberInput
            min={-1}
            value={redisKeyState.ttl.toString()}
            onChange={(e) => {
              console.log(e)
            }}
          />
        </Box>
      </Box>
      <Box padding="var(--spacing-md)">
        {redisKeyState.type === 'HASH' && (
          <RedisHASHTable
            dataSource={redisKeyState.value.data}
            length={redisKeyState.value.length}
          />
        )}
        {redisKeyState.type === 'ZSET' && (
          <RedisZSETTable
            dataSource={redisKeyState.value.data}
            length={redisKeyState.value.length}
          />
        )}
        {redisKeyState.type === 'SET' && (
          <RedisSETTable
            dataSource={redisKeyState.value.data}
            length={redisKeyState.value.length}
          />
        )}
        {redisKeyState.type === 'LIST' && (
          <RedisLISTTable
            dataSource={redisKeyState.value.data}
            length={redisKeyState.value.length}
          />
        )}
        {redisKeyState.type === 'STREAM' && (
          <RedisStreamTable
            dataSource={redisKeyState.value.data}
            length={redisKeyState.value.length}
          />
        )}

        {redisKeyState.type === 'STRING' && (
          <Editor value={redisKeyState.value} />
        )}
      </Box>

      <Box
        position="sticky"
        bottom={0}
        zIndex={1}
        width="100%"
        borderTop="1px solid var(--border-color)"
        backgroundColor="var(--background-color)"
        padding="var(--spacing-md)"
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          gap="var(--spacing-md)"
        >
          <Button
            variant="outline"
            onClick={() => {
              setDelOpen(true)
            }}
          >
            <TrashIcon />
            Delete
          </Button>
          {/* Only the STRING type should save manually */}
          {redisKeyState.type === 'STRING' && (
            <Button>
              <SaveIcon />
              Save
            </Button>
          )}
        </Box>
      </Box>

      <Modal
        open={delOpen}
        title="Delete Key"
        description="Confirm to delete this key?"
        footer={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap="var(--spacing-md)"
            padding="1rem"
          >
            <Button variant="outline" onClick={() => setDelOpen(false)}>
              Cancel
            </Button>

            <Button onClick={onDelKey} disabled={delLoaing}>
              Confirm
            </Button>
          </Box>
        }
      />
    </Box>
  )
}

export const RedisKeyViewer = () => {
  const redisId = useRedisId()
  const redisKeyState = useRedisStore((state) => state.viewerState.data)
  return (
    <RedisKeyViewerProvider
      redisId={redisId}
      redisKeyState={redisKeyState}
      refreshRedisKeyState={() => {
        return queryRedisViewerState(redisId, redisKeyState.keyName)
      }}
      key={`${redisId}_${redisKeyState.keyName}`}
    >
      <RedisKeyViewerComponent />
    </RedisKeyViewerProvider>
  )
}
