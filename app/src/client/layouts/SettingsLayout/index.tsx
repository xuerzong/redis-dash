import { Outlet } from 'react-router'
import { Box } from '@/client/components/ui/Box'

export const SettingsLayout: React.FC = () => {
  return (
    <Box display="flex" height="100%">
      <Box flex={1}>
        <Outlet />
      </Box>
    </Box>
  )
}
