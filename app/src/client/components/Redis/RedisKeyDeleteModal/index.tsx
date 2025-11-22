import { useState } from 'react'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { Modal } from '@/client/components/ui/Modal'
import { toast } from 'sonner'
import { delKey } from '@/client/commands/redis'
import { useRedisId } from '@/client/hooks/useRedisId'
import { useRedisContext } from '@/client/providers/RedisContext'
import { useRedisKeysMenuContext } from '@/client/providers/RedisKeysMenu'

interface RedisKeyDeleteModalProps {
  keyName: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const RedisKeyDeleteModal: React.FC<RedisKeyDeleteModalProps> = ({
  keyName,
  open,
  onOpenChange,
  trigger,
}) => {
  const redisId = useRedisId()
  const { refreshKeys: refreshRedisKeys } = useRedisKeysMenuContext()
  const { setSelectedKey } = useRedisContext()
  const [loading, setLoading] = useState(false)
  const onDelKey = async () => {
    setLoading(true)
    toast.promise(delKey(redisId, keyName), {
      loading: 'Loading...',
      success: () => {
        onOpenChange?.(false)
        refreshRedisKeys()
        setSelectedKey('')
        return 'Delete Key Successfully'
      },
      error: (e) => e.message || 'Delete Key Failed',
      finally() {
        setLoading(false)
      },
    })
  }
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Key"
      description="Confirm to delete this key?"
      trigger={trigger}
      footer={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap="var(--spacing-md)"
          padding="1rem"
        >
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>

          <Button onClick={onDelKey} loading={loading} disabled={loading}>
            Confirm
          </Button>
        </Box>
      }
    />
  )
}
