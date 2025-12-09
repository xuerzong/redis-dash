import { useNavigate } from 'react-router'
import { useState } from 'react'
import { RefreshCcwIcon, SettingsIcon, TrashIcon } from 'lucide-react'
import { useAppStore } from '@client/stores/appStore'
import { ContextMenu } from '@client/components/ui/ContextMenu'
import { Box } from '@client/components/ui/Box'
import { RedisIcon } from '@client/components/Icons/RedisIcon'
import { LoaderMask } from '@client/components/LoaderMask'
import { useRedisId } from '@client/hooks/useRedisId'
import { useIntlContext } from '@client/providers/IntlProvider'
import api from '@xuerzong/redis-studio-invoke/api'
import { RedisConnectionDeleteModal } from '../RedisConnectionDeleteModal'
import s from './index.module.scss'

export const RedisConnectionsMenu = () => {
  const navigate = useNavigate()
  const connections = useAppStore((state) => state.connections)
  const connectionsLoading = useAppStore((state) => state.connectionsLoading)
  const redisId = useRedisId()
  const [selectedRedisId, setSelectedRedisId] = useState('')
  const [delRedisId, setDelRedisId] = useState('')
  const { formatMessage } = useIntlContext()
  return (
    <Box position="relative" height="100%">
      {(connections || []).map((d) => (
        <ContextMenu
          key={d.id}
          onOpenChange={(open) => {
            if (open) {
              setSelectedRedisId(d.id)
            } else {
              setSelectedRedisId('')
            }
          }}
          menu={[
            {
              key: 'reconnect',
              icon: <RefreshCcwIcon />,
              label: formatMessage('reconnect'),
              async onClick() {
                await api.postDisconnectConnection(d.id)
                if (d.id === redisId) {
                  window.location.reload()
                }
              },
            },
            {
              key: 'settings',
              icon: <SettingsIcon />,
              label: formatMessage('settings'),
              onClick() {
                navigate(`/${d.id}/settings`)
              },
            },
            {
              key: 'delete',
              icon: <TrashIcon />,
              label: formatMessage('delete'),
              onClick: () => {
                setDelRedisId(d.id)
              },
              colorPalette: 'danger',
            },
          ]}
        >
          <Box
            className={s.Instance}
            onClick={() => {
              navigate(`/${d.id}`)
            }}
            data-active={redisId === d.id}
            data-selected={selectedRedisId === d.id}
          >
            <RedisIcon className={s.InstanceIcon} />
            {`${d.host}@${d.port}`}
          </Box>
        </ContextMenu>
      ))}
      <RedisConnectionDeleteModal
        open={Boolean(delRedisId)}
        onOpenChange={(open) => {
          if (!open) {
            setDelRedisId('')
          }
        }}
        redisId={delRedisId}
      />
      <LoaderMask loading={connectionsLoading} />
    </Box>
  )
}
