import { Box } from '@/client/components/ui/Box'
import ConstructionImage from '../../assets/images/construction.png'
import s from './index.module.scss'

const Page = () => {
  return (
    <Box
      height="32rem"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="1rem"
    >
      <img className={s.ConstructionImage} src={ConstructionImage} />
      <Box fontSize="1.25rem" fontWeight="bold">
        Under Construction
      </Box>
    </Box>
  )
}

export default Page
