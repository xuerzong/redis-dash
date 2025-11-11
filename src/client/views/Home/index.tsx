import { PlusIcon } from 'lucide-react'
import { Button } from '@/client/components/ui/Button'
import s from './index.module.scss'
import { useNavigate } from 'react-router'

const Page = () => {
  const navigate = useNavigate()
  return (
    <div className={s.Page}>
      <Button variant="outline" onClick={() => navigate('/create')}>
        <PlusIcon />
        New Connection
      </Button>
    </div>
  )
}

export default Page
