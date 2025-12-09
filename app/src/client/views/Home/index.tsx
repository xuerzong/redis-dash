import { PlusIcon } from 'lucide-react'
import { Button } from '@client/components/ui/Button'
import s from './index.module.scss'
import { useNavigate } from 'react-router'
import { useIntlContext } from '@client/providers/IntlProvider'

const Page = () => {
  const navigate = useNavigate()
  const { formatMessage } = useIntlContext()
  return (
    <div className={s.Page}>
      <Button variant="outline" onClick={() => navigate('/create')}>
        <PlusIcon />
        {formatMessage('connection.new')}
      </Button>
    </div>
  )
}

export default Page
