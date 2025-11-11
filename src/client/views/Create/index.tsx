import { RedisForm } from '@/client/components/RedisForm'
import { Card } from '@/client/components/ui/Card'
import s from './index.module.scss'
import { Box } from '@/client/components/ui/Box'
import { useNavigate } from 'react-router'

const Page = () => {
  return (
    <Box padding="1rem" className={s.page}>
      <Card>
        <RedisForm />
      </Card>
    </Box>
  )
}

export default Page
