import { RedisForm } from '@/client/components/Redis/RedisForm'
import { Card } from '@/client/components/ui/Card'
import { Box } from '@/client/components/ui/Box'
import s from './index.module.scss'

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
