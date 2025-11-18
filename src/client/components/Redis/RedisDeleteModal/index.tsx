import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { Modal } from '@/client/components/ui/Modal'
import { sendRequest } from '@/client/utils/invoke'
import { queryConnections } from '@/client/stores/appStore'

interface RedisDeleteModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  redisId: string
}

export const RedisDeleteModal: React.FC<RedisDeleteModalProps> = ({
  open,
  onOpenChange,
  redisId,
}) => {
  const navigate = useNavigate()
  return (
    <Modal
      title="Delete Connection"
      description="Confirm delete this connection?"
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
          <Button
            onClick={() => {
              toast.promise(
                sendRequest({
                  url: '/api/connection',
                  method: 'DELETE',
                  body: { id: redisId },
                }),
                {
                  loading: 'Loading...',
                  success: () => {
                    navigate('/')
                    queryConnections()
                    onOpenChange?.(false)
                    return 'Delete Connection Successfully'
                  },
                  error: (e) => e.message || 'Delete Connection Failed',
                }
              )
            }}
          >
            Confirm
          </Button>
        </Box>
      }
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
