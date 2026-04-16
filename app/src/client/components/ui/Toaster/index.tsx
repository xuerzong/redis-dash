import { Toaster as SonnerToaster } from 'sonner'
import { useThemeContext } from '@client/providers/ThemeProvider'
import { cn } from '@client/utils/cn'
import s from './index.module.scss'

export const Toaster = () => {
  const { displayTheme } = useThemeContext()

  return (
    <SonnerToaster
      position="top-center"
      richColors
      theme={displayTheme}
      className={cn(s.Toaster, displayTheme === 'dark' ? s.ThemeDark : '')}
      toastOptions={{
        classNames: {
          toast: cn(s.Toast, s.Default),
          title: s.Title,
          description: s.Description,
          content: s.Content,
          closeButton: s.CloseButton,
          actionButton: s.ActionButton,
          cancelButton: s.CancelButton,
          default: s.Default,
          success: s.Success,
          warning: s.Warning,
          error: s.Error,
          info: s.Info,
          loading: s.Loading,
        },
      }}
    />
  )
}
