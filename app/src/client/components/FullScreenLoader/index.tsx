import { Loader } from '@client/components/Loader'
import { Box } from '@client/components/ui/Box'

export const FullScreenLoader: React.FC = () => {
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Loader />
    </Box>
  )
}
