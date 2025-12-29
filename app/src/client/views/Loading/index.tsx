import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Loader } from '@client/components/Loader'
import { Box } from '@client/components/ui/Box'

const Page = () => {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
  }, [])
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

export default Page
