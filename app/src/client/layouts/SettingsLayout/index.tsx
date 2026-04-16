import { Outlet, useNavigate, useLocation } from 'react-router'
import { Box } from '@client/components/ui/Box'
import { useIntlContext } from '@client/providers/IntlProvider'
import { TitlebarHeightSetter } from '@client/components/tauri/TitlebarHeightSetter'
import { isTauri } from '@tauri-apps/api/core'
import { SettingsIcon, PaletteIcon, MonitorIcon, InfoIcon } from 'lucide-react'
import s from './index.module.scss'

const sidebarItems = [
  { path: '', label: 'settings.general', icon: SettingsIcon },
  { path: 'theme', label: 'settings.theme', icon: PaletteIcon },
  { path: 'interface', label: 'settings.interface', icon: MonitorIcon },
  { path: 'about', label: 'settings.about', icon: InfoIcon },
]

export const SettingsLayout: React.FC = () => {
  const { formatMessage } = useIntlContext()
  const inTauri = isTauri()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = '/settings'

  const isActive = (path: string) => {
    const fullPath = path ? `${basePath}/${path}` : basePath
    return location.pathname === fullPath
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {inTauri && <TitlebarHeightSetter />}
      {inTauri && (
        <Box
          display="flex"
          alignItems="center"
          height="var(--titlebar-height)"
          borderBottom="1px solid var(--border-color)"
          boxSizing="border-box"
        >
          <Box
            flex={1}
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            paddingLeft="0.75rem"
            fontSize="0.875rem"
            textAlign="center"
            data-tauri-drag-region
          >
            {formatMessage('settings')}
          </Box>
        </Box>
      )}
      <Box
        display="flex"
        flex={1}
        height={inTauri ? 'calc(100vh - var(--titlebar-height))' : '100%'}
      >
        <Box height="100%" className={s.Sidebar}>
          {sidebarItems.map((item) => (
            <Box
              key={item.path}
              className={s.SidebarItem}
              data-active={isActive(item.path)}
              onClick={() =>
                navigate(item.path ? `${basePath}/${item.path}` : basePath)
              }
            >
              <item.icon size={16} />
              {formatMessage(item.label)}
            </Box>
          ))}
        </Box>
        <Box flex={1} overflow="auto" padding="var(--spacing-lg)">
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
