import { LoaderCircle } from 'lucide-react'
import { cn } from '@/client/utils/cn'
import s from './index.module.scss'

interface LoaderProps {
  style?: React.CSSProperties
  className?: string
}

export const Loader: React.FC<LoaderProps> = ({ className, ...restProps }) => {
  return <LoaderCircle className={cn(s.Loader, className)} {...restProps} />
}
