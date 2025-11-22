import { Box } from '@/client/components/ui/Box'
import { Loader } from '../Loader'
import s from './index.module.scss'

interface LoaderMaskProps {
  loading?: boolean
}

export const LoaderMask: React.FC<LoaderMaskProps> = ({ loading }) => {
  return (
    <Box
      {...(!loading && {
        opacity: 0,
        pointerEvents: 'none',
      })}
      className={s.LoaderMask}
    >
      <Loader />
    </Box>
  )
}
